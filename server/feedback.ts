/**
 * Feedback Collection System
 * Collects and manages user feedback on task results for agent training
 */

import { getDb } from "./db";
import { taskFeedback, tasks, type InsertTaskFeedback, type TaskFeedback } from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

/**
 * Submit feedback for a task
 */
export async function submitFeedback(feedback: InsertTaskFeedback): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate rating
  if (feedback.rating < 1 || feedback.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Determine feedback type based on rating
  let feedbackType: "positive" | "negative" | "neutral" = "neutral";
  if (feedback.rating >= 4) {
    feedbackType = "positive";
  } else if (feedback.rating <= 2) {
    feedbackType = "negative";
  }

  const feedbackData: InsertTaskFeedback = {
    ...feedback,
    feedbackType,
  };

  const [result] = await db.insert(taskFeedback).values(feedbackData);
  return result.insertId;
}

/**
 * Get feedback for a specific task
 */
export async function getTaskFeedback(taskId: number): Promise<TaskFeedback[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(taskFeedback)
    .where(eq(taskFeedback.taskId, taskId))
    .orderBy(desc(taskFeedback.createdAt));
}

/**
 * Get all feedback for a user
 */
export async function getUserFeedback(userId: number, limit: number = 50): Promise<TaskFeedback[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(taskFeedback)
    .where(eq(taskFeedback.userId, userId))
    .orderBy(desc(taskFeedback.createdAt))
    .limit(limit);
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats(options: {
  userId?: number;
  taskType?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalFeedback: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(taskFeedback);

  // Apply filters
  const conditions: any[] = [];
  if (options.userId) {
    conditions.push(eq(taskFeedback.userId, options.userId));
  }
  if (options.startDate) {
    conditions.push(sql`${taskFeedback.createdAt} >= ${options.startDate}`);
  }
  if (options.endDate) {
    conditions.push(sql`${taskFeedback.createdAt} <= ${options.endDate}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const allFeedback = await query;

  // Calculate statistics
  const totalFeedback = allFeedback.length;
  const averageRating = totalFeedback > 0 ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback : 0;

  const positiveCount = allFeedback.filter((f) => f.feedbackType === "positive").length;
  const negativeCount = allFeedback.filter((f) => f.feedbackType === "negative").length;
  const neutralCount = allFeedback.filter((f) => f.feedbackType === "neutral").length;

  const helpfulCount = allFeedback.filter((f) => f.wasHelpful === 1).length;
  const notHelpfulCount = allFeedback.filter((f) => f.wasHelpful === 0).length;

  return {
    totalFeedback,
    averageRating,
    positiveCount,
    negativeCount,
    neutralCount,
    helpfulCount,
    notHelpfulCount,
  };
}

/**
 * Get recent feedback for training
 * Returns feedback that hasn't been processed for training yet
 */
export async function getRecentFeedbackForTraining(limit: number = 100): Promise<
  Array<
    TaskFeedback & {
      taskTitle: string;
      taskType: string;
      taskDescription: string;
    }
  >
> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get feedback with task details
  const feedbackWithTasks = await db
    .select({
      id: taskFeedback.id,
      taskId: taskFeedback.taskId,
      userId: taskFeedback.userId,
      rating: taskFeedback.rating,
      feedbackType: taskFeedback.feedbackType,
      feedbackText: taskFeedback.feedbackText,
      improvementSuggestions: taskFeedback.improvementSuggestions,
      wasHelpful: taskFeedback.wasHelpful,
      createdAt: taskFeedback.createdAt,
      taskTitle: tasks.title,
      taskType: tasks.type,
      taskDescription: tasks.description,
    })
    .from(taskFeedback)
    .innerJoin(tasks, eq(taskFeedback.taskId, tasks.id))
    .orderBy(desc(taskFeedback.createdAt))
    .limit(limit);

  return feedbackWithTasks;
}

/**
 * Extract training examples from positive feedback
 */
export async function extractPositiveTrainingExamples(minRating: number = 4): Promise<
  Array<{
    taskType: string;
    taskDescription: string;
    feedback: string | null;
    rating: number;
  }>
> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const positiveFeedback = await db
    .select({
      taskType: tasks.type,
      taskDescription: tasks.description,
      feedback: taskFeedback.feedbackText,
      rating: taskFeedback.rating,
    })
    .from(taskFeedback)
    .innerJoin(tasks, eq(taskFeedback.taskId, tasks.id))
    .where(
      and(
        sql`${taskFeedback.rating} >= ${minRating}`,
        sql`${taskFeedback.feedbackText} IS NOT NULL AND ${taskFeedback.feedbackText} != ''`
      )
    )
    .orderBy(desc(taskFeedback.rating))
    .limit(50);

  return positiveFeedback;
}

/**
 * Extract failure patterns from negative feedback
 */
export async function extractNegativePatterns(maxRating: number = 2): Promise<
  Array<{
    taskType: string;
    taskDescription: string;
    feedback: string | null;
    improvementSuggestions: string | null;
    rating: number;
  }>
> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const negativeFeedback = await db
    .select({
      taskType: tasks.type,
      taskDescription: tasks.description,
      feedback: taskFeedback.feedbackText,
      improvementSuggestions: taskFeedback.improvementSuggestions,
      rating: taskFeedback.rating,
    })
    .from(taskFeedback)
    .innerJoin(tasks, eq(taskFeedback.taskId, tasks.id))
    .where(sql`${taskFeedback.rating} <= ${maxRating}`)
    .orderBy(taskFeedback.rating)
    .limit(50);

  return negativeFeedback;
}
