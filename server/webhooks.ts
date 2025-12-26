/**
 * Webhooks Module
 * Handles outgoing webhooks for external integrations
 */

import { getDb } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// ============================================================================
// Types
// ============================================================================

export interface WebhookConfig {
  id: number;
  userId: number;
  name: string;
  url: string;
  secret?: string;
  events: string[]; // JSON array of event types
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: number;
  webhookId: number;
  event: string;
  payload: string;
  status: "pending" | "success" | "failed";
  statusCode?: number;
  response?: string;
  attempts: number;
  createdAt: Date;
  deliveredAt?: Date;
}

export type WebhookEvent =
  | "task.created"
  | "task.completed"
  | "task.failed"
  | "agent.dialogue.started"
  | "agent.dialogue.completed"
  | "knowledge.created"
  | "skill.installed"
  | "memory.created";

// ============================================================================
// In-Memory Storage (for demo - in production use database tables)
// ============================================================================

const webhookConfigs: Map<number, WebhookConfig> = new Map();
const webhookDeliveries: WebhookDelivery[] = [];
let nextWebhookId = 1;
let nextDeliveryId = 1;

// ============================================================================
// Webhook Configuration
// ============================================================================

/**
 * Create a new webhook configuration
 */
export async function createWebhook(
  userId: number,
  name: string,
  url: string,
  events: WebhookEvent[],
  secret?: string
): Promise<WebhookConfig> {
  const webhook: WebhookConfig = {
    id: nextWebhookId++,
    userId,
    name,
    url,
    secret,
    events,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  webhookConfigs.set(webhook.id, webhook);
  return webhook;
}

/**
 * Get all webhooks for a user
 */
export async function getUserWebhooks(userId: number): Promise<WebhookConfig[]> {
  return Array.from(webhookConfigs.values()).filter(w => w.userId === userId);
}

/**
 * Get webhook by ID
 */
export async function getWebhookById(webhookId: number): Promise<WebhookConfig | null> {
  return webhookConfigs.get(webhookId) || null;
}

/**
 * Update webhook configuration
 */
export async function updateWebhook(
  webhookId: number,
  updates: Partial<Pick<WebhookConfig, "name" | "url" | "events" | "secret" | "isActive">>
): Promise<WebhookConfig | null> {
  const webhook = webhookConfigs.get(webhookId);
  if (!webhook) return null;

  const updated = {
    ...webhook,
    ...updates,
    updatedAt: new Date(),
  };

  webhookConfigs.set(webhookId, updated);
  return updated;
}

/**
 * Delete webhook
 */
export async function deleteWebhook(webhookId: number): Promise<boolean> {
  return webhookConfigs.delete(webhookId);
}

/**
 * Toggle webhook active status
 */
export async function toggleWebhookActive(webhookId: number): Promise<WebhookConfig | null> {
  const webhook = webhookConfigs.get(webhookId);
  if (!webhook) return null;

  webhook.isActive = !webhook.isActive;
  webhook.updatedAt = new Date();
  webhookConfigs.set(webhookId, webhook);
  return webhook;
}

// ============================================================================
// Webhook Delivery
// ============================================================================

/**
 * Send a webhook event
 */
export async function sendWebhookEvent(
  userId: number,
  event: WebhookEvent,
  payload: Record<string, any>
): Promise<void> {
  const userWebhooks = await getUserWebhooks(userId);
  const activeWebhooks = userWebhooks.filter(
    w => w.isActive && w.events.includes(event)
  );

  for (const webhook of activeWebhooks) {
    await deliverWebhook(webhook, event, payload);
  }
}

/**
 * Deliver webhook to endpoint
 */
async function deliverWebhook(
  webhook: WebhookConfig,
  event: WebhookEvent,
  payload: Record<string, any>
): Promise<void> {
  const delivery: WebhookDelivery = {
    id: nextDeliveryId++,
    webhookId: webhook.id,
    event,
    payload: JSON.stringify(payload),
    status: "pending",
    attempts: 0,
    createdAt: new Date(),
  };

  webhookDeliveries.push(delivery);

  try {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      payload,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": event,
      "X-Webhook-Delivery": delivery.id.toString(),
    };

    // Add signature if secret is configured
    if (webhook.secret) {
      const crypto = await import("crypto");
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");
      headers["X-Webhook-Signature"] = `sha256=${signature}`;
    }

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body,
    });

    delivery.statusCode = response.status;
    delivery.response = await response.text().catch(() => "");
    delivery.status = response.ok ? "success" : "failed";
    delivery.deliveredAt = new Date();
    delivery.attempts = 1;
  } catch (error) {
    delivery.status = "failed";
    delivery.response = error instanceof Error ? error.message : "Unknown error";
    delivery.attempts = 1;
  }
}

/**
 * Get webhook deliveries
 */
export async function getWebhookDeliveries(
  webhookId: number,
  limit: number = 50
): Promise<WebhookDelivery[]> {
  return webhookDeliveries
    .filter(d => d.webhookId === webhookId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Retry failed delivery
 */
export async function retryDelivery(deliveryId: number): Promise<boolean> {
  const delivery = webhookDeliveries.find(d => d.id === deliveryId);
  if (!delivery || delivery.status !== "failed") return false;

  const webhook = webhookConfigs.get(delivery.webhookId);
  if (!webhook) return false;

  try {
    const payload = JSON.parse(delivery.payload);
    await deliverWebhook(webhook, delivery.event as WebhookEvent, payload);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Data Export
// ============================================================================

export interface ExportOptions {
  format: "json" | "csv";
  includeMemories?: boolean;
  includeConversations?: boolean;
  includeTasks?: boolean;
  includeSkills?: boolean;
  dateRange?: { start: Date; end: Date };
}

/**
 * Export user data
 */
export async function exportUserData(
  userId: number,
  options: ExportOptions
): Promise<string> {
  const data: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    userId,
  };

  // Import required modules
  const { getUserMemories, getUserPreferences } = await import("./memory");
  const { getUserSkills } = await import("./skills");

  if (options.includeMemories) {
    data.memories = await getUserMemories(userId);
    data.preferences = await getUserPreferences(userId);
  }

  if (options.includeSkills) {
    data.installedSkills = await getUserSkills(userId);
  }

  if (options.format === "json") {
    return JSON.stringify(data, null, 2);
  }

  // CSV format - flatten data
  const rows: string[] = [];
  
  if (data.memories) {
    rows.push("type,key,value,importance,createdAt");
    for (const m of data.memories) {
      rows.push(`"${m.type}","${m.key}","${m.value.replace(/"/g, '""')}",${m.importance},"${m.createdAt}"`);
    }
  }

  return rows.join("\n");
}

/**
 * Get available webhook events
 */
export function getAvailableWebhookEvents(): { event: WebhookEvent; description: string }[] {
  return [
    { event: "task.created", description: "When a new task is created" },
    { event: "task.completed", description: "When a task completes successfully" },
    { event: "task.failed", description: "When a task fails" },
    { event: "agent.dialogue.started", description: "When agents start a dialogue" },
    { event: "agent.dialogue.completed", description: "When agents complete a dialogue" },
    { event: "knowledge.created", description: "When new knowledge is discovered" },
    { event: "skill.installed", description: "When a skill is installed" },
    { event: "memory.created", description: "When a new memory is stored" },
  ];
}
