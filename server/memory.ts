/**
 * Memory Management System
 * Handles conversation history, context persistence, and user preferences
 */

import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  conversations,
  messages,
  memoryEntries,
  userPreferences,
  type InsertConversation,
  type InsertMessage,
  type InsertMemoryEntry,
  type InsertUserPreference,
  type Conversation,
  type Message,
  type MemoryEntry,
} from "../drizzle/schema";

// ============================================================================
// Conversation Management
// ============================================================================

export async function createConversation(data: InsertConversation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(data);
  return Number(result[0].insertId);
}

export async function getUserConversations(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.lastMessageAt));
}

export async function getConversationById(conversationId: number): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  return result[0];
}

export async function updateConversation(
  conversationId: number,
  updates: Partial<InsertConversation>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(conversations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

// ============================================================================
// Message Management
// ============================================================================

export async function createMessage(data: InsertMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(data);

  // Update conversation's lastMessageAt
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, data.conversationId));

  return Number(result[0].insertId);
}

export async function getConversationMessages(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

export async function getRecentMessages(userId: number, limit: number = 10): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

// ============================================================================
// Memory Entry Management
// ============================================================================

export async function createMemoryEntry(data: InsertMemoryEntry): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(memoryEntries).values(data);
  return Number(result[0].insertId);
}

export async function getUserMemories(
  userId: number,
  type?: "fact" | "preference" | "context" | "insight"
): Promise<MemoryEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = type
    ? and(eq(memoryEntries.userId, userId), eq(memoryEntries.type, type))
    : eq(memoryEntries.userId, userId);

  return await db
    .select()
    .from(memoryEntries)
    .where(conditions)
    .orderBy(desc(memoryEntries.importance), desc(memoryEntries.updatedAt));
}

export async function searchMemories(userId: number, searchTerm: string): Promise<MemoryEntry[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(memoryEntries)
    .where(
      and(
        eq(memoryEntries.userId, userId),
        sql`(${memoryEntries.key} LIKE ${`%${searchTerm}%`} OR ${memoryEntries.value} LIKE ${`%${searchTerm}%`})`
      )
    )
    .orderBy(desc(memoryEntries.importance));
}

export async function updateMemoryAccess(memoryId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(memoryEntries)
    .set({
      accessCount: sql`${memoryEntries.accessCount} + 1`,
      lastAccessedAt: new Date(),
    })
    .where(eq(memoryEntries.id, memoryId));
}

export async function updateMemoryEntry(
  memoryId: number,
  updates: Partial<InsertMemoryEntry>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(memoryEntries)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(memoryEntries.id, memoryId));
}

export async function deleteMemoryEntry(memoryId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(memoryEntries).where(eq(memoryEntries.id, memoryId));
}

// ============================================================================
// User Preferences Management
// ============================================================================

export async function getUserPreferences(userId: number): Promise<Record<string, any>> {
  const db = await getDb();
  if (!db) return {};

  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (result.length === 0) return {};

  try {
    return JSON.parse(result[0].preferences);
  } catch {
    return {};
  }
}

export async function setUserPreferences(
  userId: number,
  preferences: Record<string, any>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const preferencesJson = JSON.stringify(preferences);

  await db
    .insert(userPreferences)
    .values({
      userId,
      preferences: preferencesJson,
    })
    .onDuplicateKeyUpdate({
      set: {
        preferences: preferencesJson,
        updatedAt: new Date(),
      },
    });
}

export async function updateUserPreferences(
  userId: number,
  updates: Record<string, any>
): Promise<void> {
  const currentPrefs = await getUserPreferences(userId);
  const newPrefs = { ...currentPrefs, ...updates };
  await setUserPreferences(userId, newPrefs);
}

// ============================================================================
// Context Retrieval for AI
// ============================================================================

/**
 * Get relevant context for AI task execution
 * Combines recent messages, important memories, and user preferences
 */
export async function getContextForTask(
  userId: number,
  taskDescription: string,
  conversationId?: number
): Promise<{
  recentMessages: Message[];
  relevantMemories: MemoryEntry[];
  preferences: Record<string, any>;
}> {
  // Get recent conversation messages
  const recentMessages = conversationId
    ? await getConversationMessages(conversationId)
    : await getRecentMessages(userId, 5);

  // Search for relevant memories based on task description
  const keywords = taskDescription.split(" ").slice(0, 5).join(" ");
  const relevantMemories = await searchMemories(userId, keywords);

  // Get user preferences
  const preferences = await getUserPreferences(userId);

  // Update access count for retrieved memories
  for (const memory of relevantMemories.slice(0, 5)) {
    await updateMemoryAccess(memory.id);
  }

  return {
    recentMessages: recentMessages.slice(-10), // Last 10 messages
    relevantMemories: relevantMemories.slice(0, 5), // Top 5 relevant memories
    preferences,
  };
}

/**
 * Extract and store important information from task results
 */
export async function extractAndStoreMemory(
  userId: number,
  taskId: number,
  taskType: string,
  taskDescription: string,
  result: string
): Promise<void> {
  // Simple heuristic: if the result contains specific patterns, store as memory
  const patterns = [
    { regex: /my name is (\w+)/i, type: "fact" as const, key: "user_name" },
    { regex: /I prefer (\w+)/i, type: "preference" as const, key: "preference" },
    { regex: /remember that (.*)/i, type: "context" as const, key: "important_context" },
  ];

  for (const pattern of patterns) {
    const match = taskDescription.match(pattern.regex) || result.match(pattern.regex);
    if (match) {
      await createMemoryEntry({
        userId,
        type: pattern.type,
        key: pattern.key,
        value: match[1] || match[0],
        source: `task-${taskId}`,
        importance: 7,
        accessCount: 0,
      });
    }
  }

  // Store task type preferences (learn what users like to do)
  const taskTypePrefs = await getUserPreferences(userId);
  const taskCounts = taskTypePrefs.taskTypeCounts || {};
  taskCounts[taskType] = (taskCounts[taskType] || 0) + 1;

  await updateUserPreferences(userId, {
    taskTypeCounts: taskCounts,
    lastTaskType: taskType,
  });
}
