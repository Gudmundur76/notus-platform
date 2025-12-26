/**
 * Webhooks Router
 * tRPC endpoints for webhook management
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  createWebhook,
  getUserWebhooks,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  toggleWebhookActive,
  getWebhookDeliveries,
  retryDelivery,
  exportUserData,
  getAvailableWebhookEvents,
  type WebhookEvent,
} from "./webhooks";

const webhookEventSchema = z.enum([
  "task.created",
  "task.completed",
  "task.failed",
  "agent.dialogue.started",
  "agent.dialogue.completed",
  "knowledge.created",
  "skill.installed",
  "memory.created",
]);

export const webhooksRouter = router({
  // ============================================================================
  // Webhook Configuration
  // ============================================================================

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      url: z.string().url(),
      events: z.array(webhookEventSchema).min(1),
      secret: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await createWebhook(
        ctx.user.id,
        input.name,
        input.url,
        input.events as WebhookEvent[],
        input.secret
      );
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return await getUserWebhooks(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .query(async ({ input }) => {
      return await getWebhookById(input.webhookId);
    }),

  update: protectedProcedure
    .input(z.object({
      webhookId: z.number(),
      name: z.string().min(1).max(100).optional(),
      url: z.string().url().optional(),
      events: z.array(webhookEventSchema).min(1).optional(),
      secret: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { webhookId, ...updates } = input;
      return await updateWebhook(webhookId, updates as any);
    }),

  delete: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await deleteWebhook(input.webhookId);
      return { success };
    }),

  toggleActive: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ input }) => {
      return await toggleWebhookActive(input.webhookId);
    }),

  // ============================================================================
  // Webhook Deliveries
  // ============================================================================

  getDeliveries: protectedProcedure
    .input(z.object({
      webhookId: z.number(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return await getWebhookDeliveries(input.webhookId, input.limit);
    }),

  retryDelivery: protectedProcedure
    .input(z.object({ deliveryId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await retryDelivery(input.deliveryId);
      return { success };
    }),

  // ============================================================================
  // Available Events
  // ============================================================================

  getAvailableEvents: protectedProcedure.query(() => {
    return getAvailableWebhookEvents();
  }),

  // ============================================================================
  // Data Export
  // ============================================================================

  exportData: protectedProcedure
    .input(z.object({
      format: z.enum(["json", "csv"]).default("json"),
      includeMemories: z.boolean().default(true),
      includeConversations: z.boolean().default(false),
      includeTasks: z.boolean().default(false),
      includeSkills: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const data = await exportUserData(ctx.user.id, input);
      return { data, format: input.format };
    }),
});
