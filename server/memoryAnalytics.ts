/**
 * Memory Analytics Module
 * Track and analyze memory usage patterns
 */

import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";
import { getDb } from "./db";
import {
  memoryEntries,
  memoryAccessLog,
  memoryAnalyticsSnapshots,
  type MemoryAccessLog,
  type InsertMemoryAccessLog,
  type MemoryAnalyticsSnapshot,
} from "../drizzle/schema";

// ============================================
// ACCESS LOGGING
// ============================================

/**
 * Log a memory access event
 */
export async function logMemoryAccess(
  memoryId: number,
  userId: number,
  accessType: "read" | "write" | "search" | "context",
  context?: string,
  relevanceScore?: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(memoryAccessLog).values({
    memoryId,
    userId,
    accessType,
    context,
    relevanceScore,
  });

  // Update access count on memory entry
  await db
    .update(memoryEntries)
    .set({
      accessCount: sql`${memoryEntries.accessCount} + 1`,
      lastAccessedAt: new Date(),
    })
    .where(eq(memoryEntries.id, memoryId));
}

/**
 * Get access history for a memory
 */
export async function getMemoryAccessHistory(
  memoryId: number,
  limit: number = 50
): Promise<MemoryAccessLog[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(memoryAccessLog)
    .where(eq(memoryAccessLog.memoryId, memoryId))
    .orderBy(desc(memoryAccessLog.accessedAt))
    .limit(limit);
}

// ============================================
// USAGE STATISTICS
// ============================================

/**
 * Get overall memory usage stats for a user
 */
export async function getMemoryUsageStats(userId: number): Promise<{
  totalMemories: number;
  byType: { type: string; count: number }[];
  byCategory: { category: string; count: number }[];
  avgImportance: number;
  totalAccesses: number;
  pinnedCount: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalMemories: 0,
      byType: [],
      byCategory: [],
      avgImportance: 0,
      totalAccesses: 0,
      pinnedCount: 0,
    };
  }

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId));

  // Get counts by type
  const byTypeResult = await db
    .select({
      type: memoryEntries.type,
      count: count(),
    })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
    .groupBy(memoryEntries.type);

  // Get counts by category
  const byCategoryResult = await db
    .select({
      category: memoryEntries.category,
      count: count(),
    })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
    .groupBy(memoryEntries.category);

  // Get average importance
  const [avgResult] = await db
    .select({
      avg: sql<number>`AVG(${memoryEntries.importance})`,
    })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId));

  // Get total accesses
  const [accessResult] = await db
    .select({
      total: sql<number>`SUM(${memoryEntries.accessCount})`,
    })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId));

  // Get pinned count
  const [pinnedResult] = await db
    .select({ count: count() })
    .from(memoryEntries)
    .where(and(eq(memoryEntries.userId, userId), eq(memoryEntries.isPinned, 1)));

  return {
    totalMemories: totalResult?.count || 0,
    byType: byTypeResult.map((r) => ({ type: r.type, count: r.count })),
    byCategory: byCategoryResult
      .filter((r) => r.category)
      .map((r) => ({ category: r.category!, count: r.count })),
    avgImportance: Number(avgResult?.avg) || 0,
    totalAccesses: Number(accessResult?.total) || 0,
    pinnedCount: pinnedResult?.count || 0,
  };
}

/**
 * Get most accessed memories
 */
export async function getMostAccessedMemories(
  userId: number,
  limit: number = 10
): Promise<
  {
    id: number;
    key: string;
    type: string;
    accessCount: number;
    importance: number;
  }[]
> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: memoryEntries.id,
      key: memoryEntries.key,
      type: memoryEntries.type,
      accessCount: memoryEntries.accessCount,
      importance: memoryEntries.importance,
    })
    .from(memoryEntries)
    .where(eq(memoryEntries.userId, userId))
    .orderBy(desc(memoryEntries.accessCount))
    .limit(limit);

  return results;
}

/**
 * Get memory access timeline (accesses per day for the last N days)
 */
export async function getMemoryAccessTimeline(
  userId: number,
  days: number = 30
): Promise<{ date: string; count: number }[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Use raw SQL to avoid GROUP BY issues with MySQL strict mode
  const rawResults = await db.execute(
    sql`SELECT DATE(accessed_at) as date, COUNT(*) as count 
        FROM memory_access_log 
        WHERE user_id = ${userId} AND accessed_at >= ${startDate}
        GROUP BY DATE(accessed_at)
        ORDER BY DATE(accessed_at)`
  );

  const rows = (Array.isArray(rawResults) ? rawResults[0] : rawResults) as unknown as { date: string; count: number }[];
  return (rows || []).map((r) => ({ date: String(r.date), count: Number(r.count) }));
}

/**
 * Get context relevance scores distribution
 */
export async function getContextRelevanceDistribution(
  userId: number
): Promise<{ range: string; count: number }[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      relevanceScore: memoryAccessLog.relevanceScore,
    })
    .from(memoryAccessLog)
    .where(
      and(
        eq(memoryAccessLog.userId, userId),
        sql`${memoryAccessLog.relevanceScore} IS NOT NULL`
      )
    );

  // Group into ranges
  const ranges = {
    "0-20": 0,
    "21-40": 0,
    "41-60": 0,
    "61-80": 0,
    "81-100": 0,
  };

  for (const r of results) {
    const score = r.relevanceScore || 0;
    if (score <= 20) ranges["0-20"]++;
    else if (score <= 40) ranges["21-40"]++;
    else if (score <= 60) ranges["41-60"]++;
    else if (score <= 80) ranges["61-80"]++;
    else ranges["81-100"]++;
  }

  return Object.entries(ranges).map(([range, count]) => ({ range, count }));
}

/**
 * Get memory growth trend (new memories per day)
 */
export async function getMemoryGrowthTrend(
  userId: number,
  days: number = 30
): Promise<{ date: string; count: number; cumulative: number }[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Use raw SQL to avoid GROUP BY issues with MySQL strict mode
  const rawResults = await db.execute(
    sql`SELECT DATE(createdAt) as date, COUNT(*) as count 
        FROM memory_entries 
        WHERE userId = ${userId} AND createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY DATE(createdAt)`
  );

  // MySQL2 returns [rows, fields], extract rows
  const rows = (Array.isArray(rawResults) ? rawResults[0] : rawResults) as unknown as { date: string; count: number }[];
  
  // Calculate cumulative
  let cumulative = 0;
  return (rows || []).map((r) => {
    cumulative += Number(r.count);
    return { date: String(r.date), count: Number(r.count), cumulative };
  });
}

/**
 * Get recent memory activity
 */
export async function getRecentMemoryActivity(
  userId: number,
  limit: number = 20
): Promise<
  {
    memoryId: number;
    memoryKey: string;
    accessType: string;
    context: string | null;
    accessedAt: Date;
  }[]
> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      memoryId: memoryAccessLog.memoryId,
      accessType: memoryAccessLog.accessType,
      context: memoryAccessLog.context,
      accessedAt: memoryAccessLog.accessedAt,
      memoryKey: memoryEntries.key,
    })
    .from(memoryAccessLog)
    .innerJoin(memoryEntries, eq(memoryAccessLog.memoryId, memoryEntries.id))
    .where(eq(memoryAccessLog.userId, userId))
    .orderBy(desc(memoryAccessLog.accessedAt))
    .limit(limit);

  return results;
}

/**
 * Create analytics snapshot for a user
 */
export async function createAnalyticsSnapshot(
  userId: number
): Promise<MemoryAnalyticsSnapshot> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await getMemoryUsageStats(userId);

  const factCount =
    stats.byType.find((t) => t.type === "fact")?.count || 0;
  const preferenceCount =
    stats.byType.find((t) => t.type === "preference")?.count || 0;
  const contextCount =
    stats.byType.find((t) => t.type === "context")?.count || 0;

  const [result] = await db.insert(memoryAnalyticsSnapshots).values({
    userId,
    totalMemories: stats.totalMemories,
    factCount,
    preferenceCount,
    contextCount,
    avgImportance: Math.round(stats.avgImportance * 10), // Store as 0-100
    avgAccessCount: Math.round(stats.totalAccesses / Math.max(stats.totalMemories, 1)),
  });

  const [snapshot] = await db
    .select()
    .from(memoryAnalyticsSnapshots)
    .where(eq(memoryAnalyticsSnapshots.id, result.insertId));

  return snapshot;
}

/**
 * Get analytics snapshots history
 */
export async function getAnalyticsSnapshots(
  userId: number,
  limit: number = 30
): Promise<MemoryAnalyticsSnapshot[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(memoryAnalyticsSnapshots)
    .where(eq(memoryAnalyticsSnapshots.userId, userId))
    .orderBy(desc(memoryAnalyticsSnapshots.snapshotDate))
    .limit(limit);
}

/**
 * Get memory insights (AI-generated suggestions)
 */
export async function getMemoryInsights(userId: number): Promise<{
  suggestions: string[];
  healthScore: number;
  topCategories: string[];
}> {
  const stats = await getMemoryUsageStats(userId);
  const mostAccessed = await getMostAccessedMemories(userId, 5);

  const suggestions: string[] = [];
  let healthScore = 70; // Base score

  // Check for balanced memory types
  const typeBalance =
    stats.byType.length >= 3 ? 10 : stats.byType.length >= 2 ? 5 : 0;
  healthScore += typeBalance;

  if (stats.byType.length < 2) {
    suggestions.push(
      "Consider adding more diverse memory types (facts, preferences, context) for better personalization."
    );
  }

  // Check for pinned memories
  if (stats.pinnedCount === 0) {
    suggestions.push(
      "Pin important memories to ensure they're always available in context."
    );
  } else {
    healthScore += 5;
  }

  // Check for categories
  if (stats.byCategory.length < 3) {
    suggestions.push(
      "Organize memories into categories for easier retrieval and management."
    );
  } else {
    healthScore += 10;
  }

  // Check access patterns
  if (stats.totalAccesses < stats.totalMemories) {
    suggestions.push(
      "Many memories haven't been accessed. Consider reviewing and cleaning up unused entries."
    );
  } else {
    healthScore += 5;
  }

  // Cap health score
  healthScore = Math.min(100, healthScore);

  // Get top categories
  const topCategories = stats.byCategory
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((c) => c.category);

  return {
    suggestions,
    healthScore,
    topCategories,
  };
}
