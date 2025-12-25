/**
 * Session Continuity Module
 * Handles session state persistence, context handoff, and multi-session project support
 */

import { getDb } from "./db";
import { 
  sessionStates, 
  handoffDocuments,
  tasks,
  memoryEntries,
  conversations,
  InsertSessionState,
  InsertHandoffDocument 
} from "../drizzle/schema";
import { desc, eq, and, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logEvent } from "./monitoring";

/**
 * Create a new session state
 */
export async function createSessionState(params: {
  userId: number;
  name: string;
  description?: string;
  activeTaskIds?: number[];
}): Promise<typeof sessionStates.$inferSelect> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const sessionId = nanoid();
  
  // Gather current memory snapshot
  const recentMemories = await db.select()
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, params.userId))
    .orderBy(desc(memoryEntries.updatedAt))
    .limit(50);

  const state: InsertSessionState = {
    userId: params.userId,
    sessionId,
    name: params.name,
    description: params.description ?? null,
    state: JSON.stringify({
      createdAt: new Date().toISOString(),
      environment: "notus-platform",
      version: "1.0.0"
    }),
    activeTaskIds: params.activeTaskIds ? JSON.stringify(params.activeTaskIds) : null,
    memorySnapshot: JSON.stringify(recentMemories.map((m) => ({
      key: m.key,
      value: m.value,
      type: m.type,
      importance: m.importance
    }))),
    isActive: 1,
  };

  const [result] = await db.insert(sessionStates).values(state).$returningId();
  
  logEvent({
    userId: params.userId,
    eventType: "session_created",
    source: "session-continuity",
    message: `Session "${params.name}" created`,
    metadata: { sessionId, taskCount: params.activeTaskIds?.length ?? 0 }
  });

  return (await db.select().from(sessionStates).where(eq(sessionStates.id, result.id)))[0];
}

/**
 * Update session state
 */
export async function updateSessionState(params: {
  sessionId: string;
  state?: Record<string, unknown>;
  contextSummary?: string;
  activeTaskIds?: number[];
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: Partial<InsertSessionState> = {};
  
  if (params.state) {
    updates.state = JSON.stringify(params.state);
  }
  if (params.contextSummary) {
    updates.contextSummary = params.contextSummary;
  }
  if (params.activeTaskIds) {
    updates.activeTaskIds = JSON.stringify(params.activeTaskIds);
  }

  await db.update(sessionStates)
    .set(updates)
    .where(eq(sessionStates.sessionId, params.sessionId));
}

/**
 * Get session state by ID
 */
export async function getSessionState(sessionId: string): Promise<typeof sessionStates.$inferSelect | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.select()
    .from(sessionStates)
    .where(eq(sessionStates.sessionId, sessionId));
  
  return results[0] ?? null;
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: number): Promise<typeof sessionStates.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select()
    .from(sessionStates)
    .where(eq(sessionStates.userId, userId))
    .orderBy(desc(sessionStates.updatedAt));
}

/**
 * Restore a session state
 */
export async function restoreSession(sessionId: string): Promise<{
  session: typeof sessionStates.$inferSelect;
  tasks: typeof tasks.$inferSelect[];
  memories: { key: string; value: string; type: string; importance: number }[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const session = await getSessionState(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Parse active task IDs
  const taskIds = session.activeTaskIds ? JSON.parse(session.activeTaskIds) : [];
  
  // Fetch associated tasks
  let sessionTasks: typeof tasks.$inferSelect[] = [];
  if (taskIds.length > 0) {
    sessionTasks = await db.select()
      .from(tasks)
      .where(inArray(tasks.id, taskIds));
  }

  // Parse memory snapshot
  const memories = session.memorySnapshot ? JSON.parse(session.memorySnapshot) : [];

  logEvent({
    userId: session.userId,
    eventType: "session_restored",
    source: "session-continuity",
    message: `Session "${session.name}" restored`,
    metadata: { sessionId, taskCount: sessionTasks.length }
  });

  return {
    session,
    tasks: sessionTasks,
    memories
  };
}

/**
 * Generate a context summary for session handoff
 */
export async function generateContextSummary(params: {
  userId: number;
  sessionId?: string;
  includeTaskHistory?: boolean;
  includeMemories?: boolean;
}): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const sections: string[] = [];
  
  // Get recent tasks
  if (params.includeTaskHistory !== false) {
    const recentTasks = await db.select()
      .from(tasks)
      .where(eq(tasks.userId, params.userId))
      .orderBy(desc(tasks.updatedAt))
      .limit(10);

    if (recentTasks.length > 0) {
      sections.push("## Recent Tasks\n" + recentTasks.map((t) => 
        `- [${t.status}] ${t.title} (${t.type})`
      ).join("\n"));
    }
  }

  // Get important memories
  if (params.includeMemories !== false) {
    const importantMemories = await db.select()
      .from(memoryEntries)
      .where(and(
        eq(memoryEntries.userId, params.userId),
        sql`${memoryEntries.importance} >= 7`
      ))
      .orderBy(desc(memoryEntries.importance))
      .limit(20);

    if (importantMemories.length > 0) {
      sections.push("## Key Memories\n" + importantMemories.map((m) => 
        `- **${m.key}**: ${m.value}`
      ).join("\n"));
    }
  }

  // Get recent conversation topics
  const recentConvos = await db.select()
    .from(conversations)
    .where(eq(conversations.userId, params.userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(5);

  if (recentConvos.length > 0) {
    sections.push("## Recent Conversations\n" + recentConvos.map((c) => 
      `- ${c.title || "Untitled"}: ${c.summary || "No summary"}`
    ).join("\n"));
  }

  return sections.join("\n\n") || "No context available.";
}

/**
 * Create a handoff document for multi-session projects
 */
export async function createHandoffDocument(params: {
  userId: number;
  sessionStateId?: number;
  title: string;
  projectOverview: string;
  currentProgress: string;
  nextSteps: string;
  keyDecisions?: string[];
  blockers?: string[];
  relevantFiles?: string[];
}): Promise<typeof handoffDocuments.$inferSelect> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate context summary
  const contextSummary = await generateContextSummary({
    userId: params.userId,
    includeTaskHistory: true,
    includeMemories: true
  });

  const doc: InsertHandoffDocument = {
    userId: params.userId,
    sessionStateId: params.sessionStateId ?? null,
    title: params.title,
    projectOverview: params.projectOverview,
    currentProgress: params.currentProgress,
    nextSteps: params.nextSteps,
    keyDecisions: params.keyDecisions ? JSON.stringify(params.keyDecisions) : null,
    blockers: params.blockers ? JSON.stringify(params.blockers) : null,
    relevantFiles: params.relevantFiles ? JSON.stringify(params.relevantFiles) : null,
    contextForNextSession: contextSummary,
  };

  const [result] = await db.insert(handoffDocuments).values(doc).$returningId();
  
  logEvent({
    userId: params.userId,
    eventType: "session_created",
    source: "session-continuity",
    message: `Handoff document "${params.title}" created`,
    metadata: { documentId: result.id }
  });

  return (await db.select().from(handoffDocuments).where(eq(handoffDocuments.id, result.id)))[0];
}

/**
 * Get handoff documents for a user
 */
export async function getUserHandoffDocuments(userId: number): Promise<typeof handoffDocuments.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select()
    .from(handoffDocuments)
    .where(eq(handoffDocuments.userId, userId))
    .orderBy(desc(handoffDocuments.generatedAt));
}

/**
 * Get a specific handoff document
 */
export async function getHandoffDocument(id: number): Promise<typeof handoffDocuments.$inferSelect | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.select()
    .from(handoffDocuments)
    .where(eq(handoffDocuments.id, id));
  
  return results[0] ?? null;
}

/**
 * Export session data for external use
 */
export async function exportSessionData(userId: number): Promise<{
  sessions: typeof sessionStates.$inferSelect[];
  handoffs: typeof handoffDocuments.$inferSelect[];
  memories: typeof memoryEntries.$inferSelect[];
  conversations: typeof conversations.$inferSelect[];
  exportedAt: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [sessions, handoffs, memories, convos] = await Promise.all([
    getUserSessions(userId),
    getUserHandoffDocuments(userId),
    db.select().from(memoryEntries).where(eq(memoryEntries.userId, userId)),
    db.select().from(conversations).where(eq(conversations.userId, userId))
  ]);

  return {
    sessions,
    handoffs,
    memories,
    conversations: convos,
    exportedAt: new Date().toISOString()
  };
}

/**
 * Import session data from export
 */
export async function importSessionData(params: {
  userId: number;
  data: {
    memories?: { key: string; value: string; type: string; importance: number }[];
  };
}): Promise<{ memoriesImported: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let memoriesImported = 0;

  if (params.data.memories && params.data.memories.length > 0) {
    for (const memory of params.data.memories) {
      await db.insert(memoryEntries).values({
        userId: params.userId,
        key: memory.key,
        value: memory.value,
        type: memory.type as "fact" | "preference" | "context" | "insight",
        importance: memory.importance,
        source: "import"
      });
      memoriesImported++;
    }
  }

  logEvent({
    userId: params.userId,
    eventType: "session_restored",
    source: "session-continuity",
    message: `Imported ${memoriesImported} memories`,
    metadata: { memoriesImported }
  });

  return { memoriesImported };
}

/**
 * Deactivate old sessions
 */
export async function deactivateOldSessions(daysInactive: number = 30): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  const result = await db.update(sessionStates)
    .set({ isActive: 0 })
    .where(and(
      eq(sessionStates.isActive, 1),
      sql`${sessionStates.updatedAt} < ${cutoffDate}`
    ));

  return (result as any).affectedRows || 0;
}
