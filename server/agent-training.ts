/**
 * Agent Training System
 * Implements automated agent training and refinement based on user feedback
 */

import { getDb } from "./db";
import { agentTrainingHistory, agents, type InsertAgentTrainingHistory } from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { extractPositiveTrainingExamples, extractNegativePatterns, getFeedbackStats } from "./feedback";
import { invokeLLM } from "./_core/llm";

/**
 * Analyze feedback and generate improved system prompt for an agent
 */
export async function generateImprovedPrompt(options: {
  agentId: number;
  currentSystemPrompt: string;
  domain: string;
  positiveExamples: Array<{ taskDescription: string; feedback: string | null; rating: number }>;
  negativePatterns: Array<{
    taskDescription: string;
    feedback: string | null;
    improvementSuggestions: string | null;
    rating: number;
  }>;
}): Promise<{
  improvedPrompt: string;
  improvementNotes: string;
}> {
  const { currentSystemPrompt, domain, positiveExamples, negativePatterns } = options;

  // Build training context
  const positiveContext = positiveExamples
    .filter((ex) => ex.feedback)
    .map((ex) => `Task: ${ex.taskDescription}\nFeedback (${ex.rating}/5): ${ex.feedback}`)
    .join("\n\n");

  const negativeContext = negativePatterns
    .filter((ex) => ex.feedback || ex.improvementSuggestions)
    .map(
      (ex) =>
        `Task: ${ex.taskDescription}\nFeedback (${ex.rating}/5): ${ex.feedback || "N/A"}\nImprovement Suggestions: ${ex.improvementSuggestions || "N/A"}`
    )
    .join("\n\n");

  // Use LLM to generate improved prompt
  const trainingPrompt = `You are an AI training specialist. Your task is to improve an AI agent's system prompt based on user feedback.

Current System Prompt:
${currentSystemPrompt}

Domain: ${domain}

Positive Feedback (What users liked):
${positiveContext || "No positive feedback yet"}

Negative Feedback (What needs improvement):
${negativeContext || "No negative feedback yet"}

Based on this feedback, generate an improved system prompt that:
1. Reinforces behaviors that received positive feedback
2. Addresses issues mentioned in negative feedback
3. Maintains the agent's core purpose and domain expertise
4. Is clear, concise, and actionable

Return your response as JSON with two fields:
{
  "improvedPrompt": "The new system prompt",
  "improvementNotes": "Brief explanation of what was changed and why"
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an AI training specialist. Generate improved system prompts based on user feedback.",
      },
      { role: "user", content: trainingPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "improved_prompt",
        strict: true,
        schema: {
          type: "object",
          properties: {
            improvedPrompt: { type: "string" },
            improvementNotes: { type: "string" },
          },
          required: ["improvedPrompt", "improvementNotes"],
          additionalProperties: false,
        },
      },
    },
  });

  const messageContent = response.choices[0]?.message?.content;
  const contentString = typeof messageContent === "string" ? messageContent : "{}";
  const result = JSON.parse(contentString);
  return {
    improvedPrompt: result.improvedPrompt || currentSystemPrompt,
    improvementNotes: result.improvementNotes || "No improvements generated",
  };
}

/**
 * Train an agent based on recent feedback
 */
export async function trainAgent(agentId: number, options: { minFeedbackCount?: number } = {}): Promise<{
  success: boolean;
  trainingId?: number;
  message: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get agent details
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);

  if (!agent) {
    return { success: false, message: "Agent not found" };
  }

  // Get feedback statistics
  const stats = await getFeedbackStats({});

  // Check if we have enough feedback
  const minFeedback = options.minFeedbackCount || 5;
  if (stats.totalFeedback < minFeedback) {
    return {
      success: false,
      message: `Not enough feedback yet. Need at least ${minFeedback} feedback entries, have ${stats.totalFeedback}`,
    };
  }

  // Extract training data
  const positiveExamples = await extractPositiveTrainingExamples(4);
  const negativePatterns = await extractNegativePatterns(2);

  if (positiveExamples.length === 0 && negativePatterns.length === 0) {
    return {
      success: false,
      message: "No actionable feedback found for training",
    };
  }

  // Generate improved prompt
  const { improvedPrompt, improvementNotes } = await generateImprovedPrompt({
    agentId,
    currentSystemPrompt: agent.systemPrompt || "",
    domain: agent.domain,
    positiveExamples,
    negativePatterns,
  });

  // Calculate performance before training
  const performanceBefore = Math.round(stats.averageRating * 20); // Convert to 0-100 scale

  // Save training history
  const trainingData: InsertAgentTrainingHistory = {
    agentId,
    trainingType: "feedback",
    feedbackCount: stats.totalFeedback,
    positiveCount: stats.positiveCount,
    negativeCount: stats.negativeCount,
    previousSystemPrompt: agent.systemPrompt,
    updatedSystemPrompt: improvedPrompt,
    performanceBeforeTraining: performanceBefore,
    performanceAfterTraining: null, // Will be measured later
    improvementNotes,
    status: "pending",
  };

  const [result] = await db.insert(agentTrainingHistory).values(trainingData);

  return {
    success: true,
    trainingId: result.insertId,
    message: `Training completed. Generated improved prompt based on ${stats.totalFeedback} feedback entries.`,
  };
}

/**
 * Apply training to an agent (update system prompt)
 */
export async function applyTraining(trainingId: number): Promise<{
  success: boolean;
  message: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get training record
  const [training] = await db.select().from(agentTrainingHistory).where(eq(agentTrainingHistory.id, trainingId)).limit(1);

  if (!training) {
    return { success: false, message: "Training record not found" };
  }

  if (training.status === "applied") {
    return { success: false, message: "Training already applied" };
  }

  // Update agent with new system prompt
  await db
    .update(agents)
    .set({ systemPrompt: training.updatedSystemPrompt || "" })
    .where(eq(agents.id, training.agentId));

  // Mark training as applied
  await db
    .update(agentTrainingHistory)
    .set({
      status: "applied",
      appliedAt: new Date(),
    })
    .where(eq(agentTrainingHistory.id, trainingId));

  return {
    success: true,
    message: "Training applied successfully. Agent system prompt updated.",
  };
}

/**
 * Rollback training (revert to previous system prompt)
 */
export async function rollbackTraining(trainingId: number): Promise<{
  success: boolean;
  message: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get training record
  const [training] = await db.select().from(agentTrainingHistory).where(eq(agentTrainingHistory.id, trainingId)).limit(1);

  if (!training) {
    return { success: false, message: "Training record not found" };
  }

  if (training.status !== "applied") {
    return { success: false, message: "Training not applied, cannot rollback" };
  }

  // Revert agent to previous system prompt
  await db
    .update(agents)
    .set({ systemPrompt: training.previousSystemPrompt || "" })
    .where(eq(agents.id, training.agentId));

  // Mark training as rolled back
  await db.update(agentTrainingHistory).set({ status: "rolled_back" }).where(eq(agentTrainingHistory.id, trainingId));

  return {
    success: true,
    message: "Training rolled back successfully. Agent reverted to previous system prompt.",
  };
}

/**
 * Get training history for an agent
 */
export async function getAgentTrainingHistory(agentId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(agentTrainingHistory)
    .where(eq(agentTrainingHistory.agentId, agentId))
    .orderBy(desc(agentTrainingHistory.createdAt))
    .limit(limit);
}

/**
 * Get all training history
 */
export async function getAllTrainingHistory(limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(agentTrainingHistory).orderBy(desc(agentTrainingHistory.createdAt)).limit(limit);
}

/**
 * Measure agent performance after training
 */
export async function measureTrainingPerformance(trainingId: number): Promise<{
  success: boolean;
  performanceAfter: number;
  improvement: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get training record
  const [training] = await db.select().from(agentTrainingHistory).where(eq(agentTrainingHistory.id, trainingId)).limit(1);

  if (!training) {
    throw new Error("Training record not found");
  }

  // Get recent feedback stats (after training was applied)
  const stats = await getFeedbackStats({
    startDate: training.appliedAt || training.createdAt,
  });

  const performanceAfter = Math.round(stats.averageRating * 20); // Convert to 0-100 scale
  const improvement = performanceAfter - (training.performanceBeforeTraining || 0);

  // Update training record with performance metrics
  await db
    .update(agentTrainingHistory)
    .set({ performanceAfterTraining: performanceAfter })
    .where(eq(agentTrainingHistory.id, trainingId));

  return {
    success: true,
    performanceAfter,
    improvement,
  };
}
