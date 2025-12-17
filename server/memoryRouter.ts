/**
 * Memory Router - tRPC endpoints for memory management
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createConversation,
  getUserConversations,
  getConversationById,
  createMessage,
  getConversationMessages,
  getUserMemories,
  searchMemories,
  createMemoryEntry,
  updateMemoryEntry,
  deleteMemoryEntry,
  getUserPreferences,
  updateUserPreferences,
  getContextForTask,
} from "./memory";

export const memoryRouter = router({
  // ============================================================================
  // Conversations
  // ============================================================================

  conversations: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().optional(),
          summary: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const conversationId = await createConversation({
          userId: ctx.user.id,
          title: input.title,
          summary: input.summary,
        });

        return { conversationId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserConversations(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await getConversationById(input.conversationId);
      }),
  }),

  // ============================================================================
  // Messages
  // ============================================================================

  messages: router({
    create: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
          metadata: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const messageId = await createMessage({
          conversationId: input.conversationId,
          userId: ctx.user.id,
          role: input.role,
          content: input.content,
          metadata: input.metadata,
        });

        return { messageId };
      }),

    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await getConversationMessages(input.conversationId);
      }),
  }),

  // ============================================================================
  // Memory Entries
  // ============================================================================

  entries: router({
    create: protectedProcedure
      .input(
        z.object({
          type: z.enum(["fact", "preference", "context", "insight"]),
          key: z.string(),
          value: z.string(),
          source: z.string().optional(),
          importance: z.number().min(1).max(10).default(5),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const memoryId = await createMemoryEntry({
          userId: ctx.user.id,
          type: input.type,
          key: input.key,
          value: input.value,
          source: input.source,
          importance: input.importance,
          accessCount: 0,
        });

        return { memoryId };
      }),

    list: protectedProcedure
      .input(
        z.object({
          type: z.enum(["fact", "preference", "context", "insight"]).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        return await getUserMemories(ctx.user.id, input?.type);
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        return await searchMemories(ctx.user.id, input.query);
      }),

    update: protectedProcedure
      .input(
        z.object({
          memoryId: z.number(),
          updates: z.object({
            key: z.string().optional(),
            value: z.string().optional(),
            importance: z.number().min(1).max(10).optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        await updateMemoryEntry(input.memoryId, input.updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ memoryId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMemoryEntry(input.memoryId);
        return { success: true };
      }),
  }),

  // ============================================================================
  // User Preferences
  // ============================================================================

  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserPreferences(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.record(z.string(), z.any()))
      .mutation(async ({ ctx, input }) => {
        await updateUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ============================================================================
  // Context Retrieval
  // ============================================================================

  getContext: protectedProcedure
    .input(
      z.object({
        taskDescription: z.string(),
        conversationId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getContextForTask(
        ctx.user.id,
        input.taskDescription,
        input.conversationId
      );
    }),
});
