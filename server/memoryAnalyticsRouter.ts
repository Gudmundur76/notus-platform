/**
 * Memory Analytics Router
 * tRPC endpoints for memory analytics
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  logMemoryAccess,
  getMemoryAccessHistory,
  getMemoryUsageStats,
  getMostAccessedMemories,
  getMemoryAccessTimeline,
  getContextRelevanceDistribution,
  getMemoryGrowthTrend,
  getRecentMemoryActivity,
  createAnalyticsSnapshot,
  getAnalyticsSnapshots,
  getMemoryInsights,
} from "./memoryAnalytics";

export const memoryAnalyticsRouter = router({
  /**
   * Log a memory access
   */
  logAccess: protectedProcedure
    .input(
      z.object({
        memoryId: z.number(),
        accessType: z.enum(["read", "write", "search", "context"]),
        context: z.string().optional(),
        relevanceScore: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await logMemoryAccess(
        input.memoryId,
        ctx.user.id,
        input.accessType,
        input.context,
        input.relevanceScore
      );
      return { success: true };
    }),

  /**
   * Get access history for a memory
   */
  getAccessHistory: protectedProcedure
    .input(
      z.object({
        memoryId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return getMemoryAccessHistory(input.memoryId, input.limit);
    }),

  /**
   * Get overall usage stats
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    return getMemoryUsageStats(ctx.user.id);
  }),

  /**
   * Get most accessed memories
   */
  getMostAccessed: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return getMostAccessedMemories(ctx.user.id, input.limit);
    }),

  /**
   * Get access timeline
   */
  getAccessTimeline: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      return getMemoryAccessTimeline(ctx.user.id, input.days);
    }),

  /**
   * Get context relevance distribution
   */
  getRelevanceDistribution: protectedProcedure.query(async ({ ctx }) => {
    return getContextRelevanceDistribution(ctx.user.id);
  }),

  /**
   * Get memory growth trend
   */
  getGrowthTrend: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      return getMemoryGrowthTrend(ctx.user.id, input.days);
    }),

  /**
   * Get recent activity
   */
  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      return getRecentMemoryActivity(ctx.user.id, input.limit);
    }),

  /**
   * Create analytics snapshot
   */
  createSnapshot: protectedProcedure.mutation(async ({ ctx }) => {
    return createAnalyticsSnapshot(ctx.user.id);
  }),

  /**
   * Get analytics snapshots history
   */
  getSnapshots: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }))
    .query(async ({ ctx, input }) => {
      return getAnalyticsSnapshots(ctx.user.id, input.limit);
    }),

  /**
   * Get memory insights
   */
  getInsights: protectedProcedure.query(async ({ ctx }) => {
    return getMemoryInsights(ctx.user.id);
  }),
});
