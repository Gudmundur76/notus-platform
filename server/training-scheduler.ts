/**
 * Automated Training Scheduler
 * Runs scheduled training jobs for continuous agent improvement
 */

import * as cron from "node-cron";
import { trainAgent, applyTraining, measureTrainingPerformance, getAllTrainingHistory } from "./agent-training";
import { getFeedbackStats } from "./feedback";
import { getDb } from "./db";
import { agents } from "../drizzle/schema";

interface ScheduledJob {
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  status: "idle" | "running" | "error";
  task: any | null;
}

const jobs: Map<string, ScheduledJob> = new Map();

/**
 * Daily training job - Analyze feedback and train agents
 * Runs at 2:00 AM daily
 */
export function initializeDailyTraining() {
  const jobName = "daily_training";
  const schedule = "0 2 * * *"; // 2:00 AM daily

  const task = cron.schedule(
    schedule,
    async () => {
      console.log("[Training Scheduler] Running daily training job...");
      const job = jobs.get(jobName);
      if (job) {
        job.status = "running";
        job.lastRun = new Date();
      }

      try {
        await runDailyTraining();
        if (job) job.status = "idle";
        console.log("[Training Scheduler] Daily training completed successfully");
      } catch (error) {
        console.error("[Training Scheduler] Daily training failed:", error);
        if (job) job.status = "error";
      }
    }
  );

  jobs.set(jobName, {
    name: jobName,
    schedule,
    enabled: false,
    lastRun: null,
    nextRun: null,
    status: "idle",
    task,
  });

  console.log(`[Training Scheduler] Daily training job initialized (${schedule})`);
}

/**
 * Weekly performance review - Measure and optimize agent performance
 * Runs at 3:00 AM on Sundays
 */
export function initializeWeeklyReview() {
  const jobName = "weekly_review";
  const schedule = "0 3 * * 0"; // 3:00 AM on Sundays

  const task = cron.schedule(
    schedule,
    async () => {
      console.log("[Training Scheduler] Running weekly performance review...");
      const job = jobs.get(jobName);
      if (job) {
        job.status = "running";
        job.lastRun = new Date();
      }

      try {
        await runWeeklyReview();
        if (job) job.status = "idle";
        console.log("[Training Scheduler] Weekly review completed successfully");
      } catch (error) {
        console.error("[Training Scheduler] Weekly review failed:", error);
        if (job) job.status = "error";
      }
    }
  );

  jobs.set(jobName, {
    name: jobName,
    schedule,
    enabled: false,
    lastRun: null,
    nextRun: null,
    status: "idle",
    task,
  });

  console.log(`[Training Scheduler] Weekly review job initialized (${schedule})`);
}

/**
 * Run daily training for all agents
 */
async function runDailyTraining(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all agents
  const allAgents = await db.select().from(agents);

  console.log(`[Daily Training] Processing ${allAgents.length} agents...`);

  for (const agent of allAgents) {
    try {
      // Train agent
      const result = await trainAgent(agent.id, { minFeedbackCount: 3 });

      if (result.success && result.trainingId) {
        console.log(`[Daily Training] Agent ${agent.name}: ${result.message}`);

        // Auto-apply training if we have enough confidence
        const stats = await getFeedbackStats({});
        if (stats.positiveCount > stats.negativeCount) {
          await applyTraining(result.trainingId);
          console.log(`[Daily Training] Applied training for agent ${agent.name}`);
        }
      } else {
        console.log(`[Daily Training] Agent ${agent.name}: ${result.message}`);
      }
    } catch (error) {
      console.error(`[Daily Training] Failed to train agent ${agent.name}:`, error);
    }
  }
}

/**
 * Run weekly performance review
 */
async function runWeeklyReview(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all training history
  const trainingHistory = await getAllTrainingHistory(100);

  console.log(`[Weekly Review] Reviewing ${trainingHistory.length} training iterations...`);

  for (const training of trainingHistory) {
    if (training.status === "applied" && !training.performanceAfterTraining) {
      try {
        // Measure performance for applied training
        const performance = await measureTrainingPerformance(training.id);
        console.log(
          `[Weekly Review] Training ${training.id}: Performance ${performance.performanceAfter}/100 (${performance.improvement > 0 ? "+" : ""}${performance.improvement})`
        );

        // If performance degraded significantly, consider rollback
        if (performance.improvement < -10) {
          console.log(`[Weekly Review] Performance degraded for training ${training.id}, consider rollback`);
        }
      } catch (error) {
        console.error(`[Weekly Review] Failed to measure performance for training ${training.id}:`, error);
      }
    }
  }

  // Get overall feedback statistics
  const stats = await getFeedbackStats({});
  console.log(`[Weekly Review] Overall stats: ${stats.totalFeedback} feedback, avg rating ${stats.averageRating.toFixed(2)}/5`);
}

/**
 * Enable a scheduled job
 */
export function enableJob(jobName: string): boolean {
  const job = jobs.get(jobName);
  if (!job) return false;

  if (job.task) {
    job.task.start();
    job.enabled = true;
    console.log(`[Training Scheduler] Enabled job: ${jobName}`);
    return true;
  }

  return false;
}

/**
 * Disable a scheduled job
 */
export function disableJob(jobName: string): boolean {
  const job = jobs.get(jobName);
  if (!job) return false;

  if (job.task) {
    job.task.stop();
    job.enabled = false;
    console.log(`[Training Scheduler] Disabled job: ${jobName}`);
    return true;
  }

  return false;
}

/**
 * Trigger a job manually
 */
export async function triggerJob(jobName: string): Promise<{
  success: boolean;
  message: string;
}> {
  const job = jobs.get(jobName);
  if (!job) {
    return { success: false, message: "Job not found" };
  }

  if (job.status === "running") {
    return { success: false, message: "Job is already running" };
  }

  try {
    job.status = "running";
    job.lastRun = new Date();

    if (jobName === "daily_training") {
      await runDailyTraining();
    } else if (jobName === "weekly_review") {
      await runWeeklyReview();
    }

    job.status = "idle";
    return { success: true, message: "Job completed successfully" };
  } catch (error) {
    job.status = "error";
    return { success: false, message: `Job failed: ${error}` };
  }
}

/**
 * Get all scheduled jobs status
 */
export function getJobsStatus(): Array<{
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun: Date | null;
  status: string;
}> {
  return Array.from(jobs.values()).map((job) => ({
    name: job.name,
    schedule: job.schedule,
    enabled: job.enabled,
    lastRun: job.lastRun,
    status: job.status,
  }));
}

/**
 * Initialize all scheduled jobs
 */
export function initializeTrainingScheduler() {
  console.log("[Training Scheduler] Initializing automated training scheduler...");

  initializeDailyTraining();
  initializeWeeklyReview();

  // Auto-enable jobs
  enableJob("daily_training");
  enableJob("weekly_review");

  console.log("[Training Scheduler] All jobs initialized and enabled");
}
