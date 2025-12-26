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


// ============================================================================
// Enhanced Memory Features
// ============================================================================

/**
 * Pin/unpin a memory entry
 */
export async function toggleMemoryPin(memoryId: number): Promise<MemoryEntry | null> {
  const db = await getDb();
  if (!db) return null;

  const [memory] = await db
    .select()
    .from(memoryEntries)
    .where(eq(memoryEntries.id, memoryId));

  if (!memory) return null;

  const newPinned = memory.isPinned === 1 ? 0 : 1;
  await db
    .update(memoryEntries)
    .set({ isPinned: newPinned })
    .where(eq(memoryEntries.id, memoryId));

  return { ...memory, isPinned: newPinned };
}

/**
 * Get pinned memories for a user
 */
export async function getPinnedMemories(userId: number): Promise<MemoryEntry[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(memoryEntries)
    .where(and(eq(memoryEntries.userId, userId), eq(memoryEntries.isPinned, 1)))
    .orderBy(desc(memoryEntries.updatedAt));
}

/**
 * Set category for a memory entry
 */
export async function setMemoryCategory(
  memoryId: number,
  category: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(memoryEntries)
    .set({ category })
    .where(eq(memoryEntries.id, memoryId));
}

/**
 * Get memories by category
 */
export async function getMemoriesByCategory(
  userId: number,
  category: string
): Promise<MemoryEntry[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(memoryEntries)
    .where(and(eq(memoryEntries.userId, userId), eq(memoryEntries.category, category)))
    .orderBy(desc(memoryEntries.importance), desc(memoryEntries.updatedAt));
}

/**
 * Get all unique categories for a user
 */
export async function getMemoryCategories(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ category: memoryEntries.category })
    .from(memoryEntries)
    .where(and(eq(memoryEntries.userId, userId), sql`${memoryEntries.category} IS NOT NULL`));

  return result.map(r => r.category).filter((c): c is string => c !== null);
}

/**
 * Add tags to a memory entry
 */
export async function setMemoryTags(memoryId: number, tags: string[]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(memoryEntries)
    .set({ tags: JSON.stringify(tags) })
    .where(eq(memoryEntries.id, memoryId));
}

/**
 * Search memories by tag
 */
export async function getMemoriesByTag(userId: number, tag: string): Promise<MemoryEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const allMemories = await db
    .select()
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId));

  return allMemories.filter(m => {
    if (!m.tags) return false;
    try {
      const tags = JSON.parse(m.tags) as string[];
      return tags.some(t => t.toLowerCase().includes(tag.toLowerCase()));
    } catch {
      return false;
    }
  });
}

/**
 * Enhanced search with highlighting
 */
export async function searchMemoriesWithHighlight(
  userId: number,
  searchTerm: string
): Promise<Array<MemoryEntry & { highlights: { key: string[]; value: string[] } }>> {
  const memories = await searchMemories(userId, searchTerm);
  const terms = searchTerm.toLowerCase().split(/\s+/);

  return memories.map(memory => {
    const keyHighlights: string[] = [];
    const valueHighlights: string[] = [];

    for (const term of terms) {
      const keyIndex = memory.key.toLowerCase().indexOf(term);
      if (keyIndex !== -1) {
        keyHighlights.push(
          memory.key.substring(Math.max(0, keyIndex - 20), keyIndex + term.length + 20)
        );
      }

      const valueIndex = memory.value.toLowerCase().indexOf(term);
      if (valueIndex !== -1) {
        valueHighlights.push(
          memory.value.substring(Math.max(0, valueIndex - 50), valueIndex + term.length + 50)
        );
      }
    }

    return {
      ...memory,
      highlights: {
        key: keyHighlights,
        value: valueHighlights,
      },
    };
  });
}

/**
 * Get memory timeline (grouped by date)
 */
export async function getMemoryTimeline(
  userId: number,
  days: number = 30
): Promise<Record<string, MemoryEntry[]>> {
  const db = await getDb();
  if (!db) return {};

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const memories = await db
    .select()
    .from(memoryEntries)
    .where(
      and(
        eq(memoryEntries.userId, userId),
        sql`${memoryEntries.createdAt} >= ${cutoff}`
      )
    )
    .orderBy(desc(memoryEntries.createdAt));

  const timeline: Record<string, MemoryEntry[]> = {};
  for (const memory of memories) {
    const dateKey = memory.createdAt.toISOString().split("T")[0];
    if (!timeline[dateKey]) {
      timeline[dateKey] = [];
    }
    timeline[dateKey].push(memory);
  }

  return timeline;
}

/**
 * Export all memories for a user
 */
export async function exportMemories(
  userId: number,
  format: "json" | "markdown" = "json"
): Promise<string> {
  const memories = await getUserMemories(userId);
  const preferences = await getUserPreferences(userId);
  const conversations = await getUserConversations(userId);

  if (format === "json") {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        memories,
        preferences,
        conversationCount: conversations.length,
      },
      null,
      2
    );
  }

  // Markdown format
  let md = `# Memory Export\n\n`;
  md += `Exported: ${new Date().toISOString()}\n\n`;
  md += `## Statistics\n\n`;
  md += `- Total Memories: ${memories.length}\n`;
  md += `- Conversations: ${conversations.length}\n\n`;

  md += `## Memories\n\n`;

  const byType: Record<string, MemoryEntry[]> = {};
  for (const m of memories) {
    if (!byType[m.type]) byType[m.type] = [];
    byType[m.type].push(m);
  }

  for (const [type, typeMemories] of Object.entries(byType)) {
    md += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
    for (const m of typeMemories) {
      md += `- **${m.key}**: ${m.value}\n`;
      if (m.category) md += `  - Category: ${m.category}\n`;
      if (m.isPinned) md += `  - 📌 Pinned\n`;
    }
    md += `\n`;
  }

  return md;
}

/**
 * Import memories from JSON export
 */
export async function importMemories(
  userId: number,
  jsonData: string
): Promise<{ imported: number; skipped: number }> {
  let data: { memories?: Array<Partial<MemoryEntry>> };
  try {
    data = JSON.parse(jsonData);
  } catch {
    throw new Error("Invalid JSON format");
  }

  if (!data.memories || !Array.isArray(data.memories)) {
    throw new Error("No memories array found in import data");
  }

  let imported = 0;
  let skipped = 0;

  for (const memory of data.memories) {
    if (!memory.key || !memory.value || !memory.type) {
      skipped++;
      continue;
    }

    try {
      await createMemoryEntry({
        userId,
        type: memory.type as "fact" | "preference" | "context" | "insight",
        key: memory.key,
        value: memory.value,
        source: memory.source || "import",
        importance: memory.importance || 5,
        accessCount: 0,
        category: memory.category,
        isPinned: memory.isPinned || 0,
        tags: memory.tags,
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return { imported, skipped };
}

/**
 * Get memory statistics for a user
 */
export async function getMemoryStats(userId: number): Promise<{
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  pinned: number;
  recentlyAccessed: number;
}> {
  const db = await getDb();
  if (!db) {
    return { total: 0, byType: {}, byCategory: {}, pinned: 0, recentlyAccessed: 0 };
  }

  const memories = await getUserMemories(userId);

  const byType: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let pinned = 0;
  let recentlyAccessed = 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (const m of memories) {
    byType[m.type] = (byType[m.type] || 0) + 1;
    if (m.category) {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    }
    if (m.isPinned === 1) pinned++;
    if (m.lastAccessedAt && m.lastAccessedAt > weekAgo) recentlyAccessed++;
  }

  return {
    total: memories.length,
    byType,
    byCategory,
    pinned,
    recentlyAccessed,
  };
}
