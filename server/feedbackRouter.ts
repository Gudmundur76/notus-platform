/**
 * Feedback Router
 * tRPC API endpoints for feedback collection and management
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  submitFeedback,
  getTaskFeedback,
  getUserFeedback,
  getFeedbackStats,
  getRecentFeedbackForTraining,
  extractPositiveTrainingExamples,
  extractNegativePatterns,
} from "./feedback";
import {
  trainAgent,
  applyTraining,
  rollbackTraining,
  getAgentTrainingHistory,
  getAllTrainingHistory,
  measureTrainingPerformance,
} from "./agent-training";
import { enableJob, disableJob, triggerJob, getJobsStatus } from "./training-scheduler";

export const feedbackRouter = router({
  // Submit feedback for a task
  submit: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        rating: z.number().min(1).max(5),
        feedbackText: z.string().optional(),
        improvementSuggestions: z.string().optional(),
        wasHelpful: z.number().optional(), // 1 = yes, 0 = no
      })
    )
    .mutation(async ({ ctx, input }) => {
      const feedbackId = await submitFeedback({
        taskId: input.taskId,
        userId: ctx.user!.id,
        rating: input.rating,
        feedbackType: "neutral", // Will be determined by submitFeedback
        feedbackText: input.feedbackText || null,
        improvementSuggestions: input.improvementSuggestions || null,
        wasHelpful: input.wasHelpful || null,
      });

      return { feedbackId, success: true };
    }),

  // Get feedback for a specific task
  getTaskFeedback: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getTaskFeedback(input.taskId);
    }),

  // Get user's feedback history
  getUserFeedback: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getUserFeedback(ctx.user!.id, input.limit);
    }),

  // Get feedback statistics
  getStats: protectedProcedure
    .input(
      z.object({
        taskType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getFeedbackStats({
        userId: ctx.user!.id,
        taskType: input.taskType,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  // Get recent feedback for training (admin only)
  getRecentForTraining: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getRecentFeedbackForTraining(input.limit);
    }),

  // Extract positive training examples (admin only)
  getPositiveExamples: protectedProcedure
    .input(
      z.object({
        minRating: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await extractPositiveTrainingExamples(input.minRating);
    }),

  // Extract negative patterns (admin only)
  getNegativePatterns: protectedProcedure
    .input(
      z.object({
        maxRating: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await extractNegativePatterns(input.maxRating);
    }),

  // Train an agent based on feedback
  trainAgent: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        minFeedbackCount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await trainAgent(input.agentId, { minFeedbackCount: input.minFeedbackCount });
    }),

  // Apply training to an agent
  applyTraining: protectedProcedure
    .input(
      z.object({
        trainingId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await applyTraining(input.trainingId);
    }),

  // Rollback training
  rollbackTraining: protectedProcedure
    .input(
      z.object({
        trainingId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await rollbackTraining(input.trainingId);
    }),

  // Get training history for an agent
  getAgentTrainingHistory: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getAgentTrainingHistory(input.agentId, input.limit);
    }),

  // Get all training history
  getAllTrainingHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getAllTrainingHistory(input.limit);
    }),

  // Measure training performance
  measurePerformance: protectedProcedure
    .input(
      z.object({
        trainingId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await measureTrainingPerformance(input.trainingId);
    }),

  // Get scheduled jobs status
  getJobsStatus: protectedProcedure.query(async () => {
    return getJobsStatus();
  }),

  // Enable a scheduled job
  enableJob: protectedProcedure
    .input(
      z.object({
        jobName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const success = enableJob(input.jobName);
      return { success, message: success ? "Job enabled" : "Failed to enable job" };
    }),

  // Disable a scheduled job
  disableJob: protectedProcedure
    .input(
      z.object({
        jobName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const success = disableJob(input.jobName);
      return { success, message: success ? "Job disabled" : "Failed to disable job" };
    }),

  // Trigger a job manually
  triggerJob: protectedProcedure
    .input(
      z.object({
        jobName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await triggerJob(input.jobName);
    }),
});
