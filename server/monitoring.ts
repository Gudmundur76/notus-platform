/**
 * Real-Time Monitoring Module
 * Handles system events, metrics collection, and WebSocket broadcasting
 */

import { getDb } from "./db";
import { monitoringEvents, systemMetrics, InsertMonitoringEvent, InsertSystemMetric } from "../drizzle/schema";
import { desc, eq, and, gte, sql } from "drizzle-orm";

// Event types for monitoring
export type EventType = 
  | "task_started" | "task_completed" | "task_failed"
  | "agent_started" | "agent_completed" | "agent_error"
  | "memory_access" | "credential_access"
  | "session_created" | "session_restored"
  | "system_health" | "error";

export type Severity = "info" | "warning" | "error" | "critical";

export type MetricType = 
  | "active_tasks" | "completed_tasks" | "failed_tasks"
  | "active_agents" | "memory_usage" | "api_calls"
  | "response_time" | "error_rate";

// In-memory event buffer for real-time streaming
const eventBuffer: InsertMonitoringEvent[] = [];
const MAX_BUFFER_SIZE = 100;

// WebSocket connections for real-time updates
const wsConnections: Set<{ send: (data: string) => void }> = new Set();

/**
 * Register a WebSocket connection for real-time updates
 */
export function registerWebSocketConnection(ws: { send: (data: string) => void }) {
  wsConnections.add(ws);
  return () => wsConnections.delete(ws);
}

/**
 * Broadcast event to all connected WebSocket clients
 */
function broadcastEvent(event: InsertMonitoringEvent) {
  const message = JSON.stringify({
    type: "monitoring_event",
    data: event,
    timestamp: new Date().toISOString()
  });
  
  wsConnections.forEach(ws => {
    try {
      ws.send(message);
    } catch (error) {
      // Connection might be closed, remove it
      wsConnections.delete(ws);
    }
  });
}

/**
 * Log a monitoring event
 */
export async function logEvent(params: {
  userId?: number;
  eventType: EventType;
  severity?: Severity;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
  taskId?: number;
  agentId?: number;
}): Promise<void> {
  const event: InsertMonitoringEvent = {
    userId: params.userId ?? null,
    eventType: params.eventType,
    severity: params.severity ?? "info",
    source: params.source,
    message: params.message,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    taskId: params.taskId ?? null,
    agentId: params.agentId ?? null,
  };

  // Add to buffer for real-time streaming
  eventBuffer.push(event);
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift();
  }

  // Broadcast to WebSocket clients
  broadcastEvent(event);

  // Store in database
  try {
    const db = await getDb();
    if (db) {
      await db.insert(monitoringEvents).values(event);
    }
  } catch (error) {
    console.error("[Monitoring] Failed to store event:", error);
  }
}

/**
 * Record a system metric
 */
export async function recordMetric(params: {
  metricType: MetricType;
  value: number;
  unit?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const metric: InsertSystemMetric = {
    metricType: params.metricType,
    value: params.value,
    unit: params.unit ?? null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  };

  try {
    const db = await getDb();
    if (db) {
      await db.insert(systemMetrics).values(metric);
    }
  } catch (error) {
    console.error("[Monitoring] Failed to record metric:", error);
  }

  // Broadcast metric update
  const message = JSON.stringify({
    type: "metric_update",
    data: metric,
    timestamp: new Date().toISOString()
  });
  
  wsConnections.forEach(ws => {
    try {
      ws.send(message);
    } catch (error) {
      wsConnections.delete(ws);
    }
  });
}

/**
 * Get recent events
 */
export async function getRecentEvents(params: {
  userId?: number;
  eventType?: EventType;
  severity?: Severity;
  limit?: number;
  since?: Date;
}): Promise<typeof monitoringEvents.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  if (params.userId) {
    conditions.push(eq(monitoringEvents.userId, params.userId));
  }
  if (params.eventType) {
    conditions.push(eq(monitoringEvents.eventType, params.eventType));
  }
  if (params.severity) {
    conditions.push(eq(monitoringEvents.severity, params.severity));
  }
  if (params.since) {
    conditions.push(gte(monitoringEvents.createdAt, params.since));
  }

  const query = db.select().from(monitoringEvents);
  
  if (conditions.length > 0) {
    return query
      .where(and(...conditions))
      .orderBy(desc(monitoringEvents.createdAt))
      .limit(params.limit ?? 50);
  }
  
  return query
    .orderBy(desc(monitoringEvents.createdAt))
    .limit(params.limit ?? 50);
}

/**
 * Get metrics for a time range
 */
export async function getMetrics(params: {
  metricType?: MetricType;
  since?: Date;
  until?: Date;
}): Promise<typeof systemMetrics.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  if (params.metricType) {
    conditions.push(eq(systemMetrics.metricType, params.metricType));
  }
  if (params.since) {
    conditions.push(gte(systemMetrics.recordedAt, params.since));
  }

  const query = db.select().from(systemMetrics);
  
  if (conditions.length > 0) {
    return query
      .where(and(...conditions))
      .orderBy(desc(systemMetrics.recordedAt))
      .limit(1000);
  }
  
  return query
    .orderBy(desc(systemMetrics.recordedAt))
    .limit(1000);
}

/**
 * Get current system status summary
 */
export async function getSystemStatus(): Promise<{
  activeTasks: number;
  completedTasksToday: number;
  failedTasksToday: number;
  activeAgents: number;
  recentErrors: number;
  wsConnections: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      activeTasks: 0,
      completedTasksToday: 0,
      failedTasksToday: 0,
      activeAgents: 0,
      recentErrors: 0,
      wsConnections: wsConnections.size,
    };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Count tasks by status
    const taskStats = await db.execute(sql`
      SELECT 
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as active_tasks,
        SUM(CASE WHEN status = 'completed' AND updatedAt >= ${today} THEN 1 ELSE 0 END) as completed_today,
        SUM(CASE WHEN status = 'failed' AND updatedAt >= ${today} THEN 1 ELSE 0 END) as failed_today
      FROM tasks
    `);

    // Count active agents
    const agentStats = await db.execute(sql`
      SELECT COUNT(*) as active_agents FROM agents WHERE status = 'active'
    `);

    // Count recent errors
    const errorStats = await db.execute(sql`
      SELECT COUNT(*) as recent_errors 
      FROM monitoring_events 
      WHERE severity IN ('error', 'critical') 
      AND created_at >= ${today}
    `);

    const taskRow = (taskStats as any)[0]?.[0] || {};
    const agentRow = (agentStats as any)[0]?.[0] || {};
    const errorRow = (errorStats as any)[0]?.[0] || {};

    return {
      activeTasks: Number(taskRow.active_tasks) || 0,
      completedTasksToday: Number(taskRow.completed_today) || 0,
      failedTasksToday: Number(taskRow.failed_today) || 0,
      activeAgents: Number(agentRow.active_agents) || 0,
      recentErrors: Number(errorRow.recent_errors) || 0,
      wsConnections: wsConnections.size,
    };
  } catch (error) {
    console.error("[Monitoring] Failed to get system status:", error);
    return {
      activeTasks: 0,
      completedTasksToday: 0,
      failedTasksToday: 0,
      activeAgents: 0,
      recentErrors: 0,
      wsConnections: wsConnections.size,
    };
  }
}

/**
 * Get buffered events for initial load
 */
export function getBufferedEvents(): InsertMonitoringEvent[] {
  return [...eventBuffer];
}

/**
 * Clear old events (cleanup job)
 */
export async function cleanupOldEvents(daysToKeep: number = 30): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await db.execute(sql`
    DELETE FROM monitoring_events WHERE created_at < ${cutoffDate}
  `);

  return (result as any).affectedRows || 0;
}

// Initialize monitoring on module load
console.log("[Monitoring] Module loaded");
