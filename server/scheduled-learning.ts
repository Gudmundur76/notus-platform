/**
 * Scheduled Continuous Learning System
 * Implements cron-based jobs for autonomous knowledge evolution
 */

import { runContinuousLearning } from "./knowledge-core";
import { aggregateKnowledgeAcrossDomains } from "./knowledge-core";
import { getDb } from "./db";
import { agentPairs } from "../drizzle/schema";

interface ScheduledJob {
  name: string;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: "idle" | "running" | "failed";
  errorMessage?: string;
}

// In-memory job registry
const jobs: Map<string, ScheduledJob> = new Map();
const jobTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Parse cron expression and calculate next run time
 * Simplified implementation - supports basic patterns
 */
function getNextRunTime(cronExpression: string): Date {
  const now = new Date();
  const parts = cronExpression.split(" ");
  
  if (parts.length !== 5) {
    throw new Error("Invalid cron expression. Expected format: minute hour day month dayOfWeek");
  }

  const [minute, hour, day, month, dayOfWeek] = parts;

  // Simple daily schedule (e.g., "0 2 * * *" = 2:00 AM daily)
  if (minute !== "*" && hour !== "*" && day === "*" && month === "*" && dayOfWeek === "*") {
    const nextRun = new Date(now);
    nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun;
  }

  // Weekly schedule (e.g., "0 3 * * 0" = 3:00 AM every Sunday)
  if (minute !== "*" && hour !== "*" && day === "*" && month === "*" && dayOfWeek !== "*") {
    const targetDay = parseInt(dayOfWeek);
    const nextRun = new Date(now);
    nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    const currentDay = nextRun.getDay();
    let daysUntilTarget = targetDay - currentDay;
    
    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
      daysUntilTarget += 7;
    }
    
    nextRun.setDate(nextRun.getDate() + daysUntilTarget);
    return nextRun;
  }

  // Hourly schedule (e.g., "0 * * * *" = every hour at minute 0)
  if (minute !== "*" && hour === "*") {
    const nextRun = new Date(now);
    nextRun.setMinutes(parseInt(minute), 0, 0);
    
    if (nextRun <= now) {
      nextRun.setHours(nextRun.getHours() + 1);
    }
    
    return nextRun;
  }

  throw new Error(`Unsupported cron expression: ${cronExpression}`);
}

/**
 * Daily knowledge aggregation job
 * Runs at 2:00 AM daily
 */
async function dailyKnowledgeAggregation(): Promise<void> {
  console.log("[Scheduled Learning] Running daily knowledge aggregation...");
  
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all unique domains
    const pairs = await db.select().from(agentPairs);
    const domainSet = new Set(pairs.map(p => p.domain));
    const domains = Array.from(domainSet);

    console.log(`[Scheduled Learning] Aggregating knowledge across ${domains.length} domains`);
    
    const result = await aggregateKnowledgeAcrossDomains(domains);
    
    console.log(`[Scheduled Learning] Daily aggregation completed:`, {
      connections: result.connections.length,
      insights: result.crossDomainInsights.length,
    });

    updateJobStatus("daily_aggregation", "idle");
  } catch (error) {
    console.error("[Scheduled Learning] Daily aggregation failed:", error);
    updateJobStatus("daily_aggregation", "failed", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

/**
 * Weekly continuous learning job
 * Runs at 3:00 AM every Sunday
 */
async function weeklyContinuousLearning(): Promise<void> {
  console.log("[Scheduled Learning] Running weekly continuous learning...");
  
  try {
    const result = await runContinuousLearning();
    
    console.log(`[Scheduled Learning] Weekly learning completed:`, {
      newInsights: result.newInsights,
      updatedInsights: result.updatedInsights,
      crossDomainConnections: result.crossDomainConnections,
    });

    updateJobStatus("weekly_learning", "idle");
  } catch (error) {
    console.error("[Scheduled Learning] Weekly learning failed:", error);
    updateJobStatus("weekly_learning", "failed", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

/**
 * Schedule a job with cron-like timing
 */
function scheduleJob(
  name: string,
  cronExpression: string,
  jobFunction: () => Promise<void>,
  enabled: boolean = true
): void {
  // Cancel existing timer if any
  const existingTimer = jobTimers.get(name);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  if (!enabled) {
    jobs.set(name, {
      name,
      schedule: cronExpression,
      enabled: false,
      status: "idle",
    });
    return;
  }

  const nextRun = getNextRunTime(cronExpression);
  const delay = nextRun.getTime() - Date.now();

  console.log(`[Scheduled Learning] Job "${name}" scheduled for ${nextRun.toISOString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);

  const timer = setTimeout(async () => {
    console.log(`[Scheduled Learning] Executing job "${name}"`);
    updateJobStatus(name, "running");

    try {
      await jobFunction();
      
      // Reschedule for next run
      scheduleJob(name, cronExpression, jobFunction, enabled);
    } catch (error) {
      console.error(`[Scheduled Learning] Job "${name}" failed:`, error);
      
      // Retry after 1 hour on failure
      const retryDelay = 60 * 60 * 1000;
      setTimeout(() => {
        scheduleJob(name, cronExpression, jobFunction, enabled);
      }, retryDelay);
    }
  }, delay);

  jobTimers.set(name, timer);
  jobs.set(name, {
    name,
    schedule: cronExpression,
    enabled: true,
    lastRun: jobs.get(name)?.lastRun,
    nextRun,
    status: "idle",
  });
}

/**
 * Update job status
 */
function updateJobStatus(
  name: string,
  status: "idle" | "running" | "failed",
  errorMessage?: string
): void {
  const job = jobs.get(name);
  if (job) {
    job.status = status;
    job.errorMessage = errorMessage;
    
    if (status === "idle" || status === "failed") {
      job.lastRun = new Date();
    }
    
    jobs.set(name, job);
  }
}

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduledLearning(): void {
  console.log("[Scheduled Learning] Initializing scheduled jobs...");

  // Daily knowledge aggregation at 2:00 AM
  scheduleJob("daily_aggregation", "0 2 * * *", dailyKnowledgeAggregation, true);

  // Weekly continuous learning at 3:00 AM every Sunday
  scheduleJob("weekly_learning", "0 3 * * 0", weeklyContinuousLearning, true);

  console.log("[Scheduled Learning] All jobs initialized");
}

/**
 * Get all scheduled jobs status
 */
export function getScheduledJobs(): ScheduledJob[] {
  return Array.from(jobs.values());
}

/**
 * Enable/disable a specific job
 */
export function setJobEnabled(name: string, enabled: boolean): void {
  const job = jobs.get(name);
  if (!job) {
    throw new Error(`Job "${name}" not found`);
  }

  if (enabled && !job.enabled) {
    // Re-schedule the job
    if (name === "daily_aggregation") {
      scheduleJob(name, job.schedule, dailyKnowledgeAggregation, true);
    } else if (name === "weekly_learning") {
      scheduleJob(name, job.schedule, weeklyContinuousLearning, true);
    }
  } else if (!enabled && job.enabled) {
    // Cancel the job
    const timer = jobTimers.get(name);
    if (timer) {
      clearTimeout(timer);
      jobTimers.delete(name);
    }
    
    job.enabled = false;
    job.status = "idle";
    jobs.set(name, job);
  }
}

/**
 * Manually trigger a job
 */
export async function triggerJob(name: string): Promise<void> {
  const job = jobs.get(name);
  if (!job) {
    throw new Error(`Job "${name}" not found`);
  }

  console.log(`[Scheduled Learning] Manually triggering job "${name}"`);
  updateJobStatus(name, "running");

  try {
    if (name === "daily_aggregation") {
      await dailyKnowledgeAggregation();
    } else if (name === "weekly_learning") {
      await weeklyContinuousLearning();
    }
  } catch (error) {
    updateJobStatus(name, "failed", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
}

/**
 * Shutdown all scheduled jobs
 */
export function shutdownScheduledLearning(): void {
  console.log("[Scheduled Learning] Shutting down all jobs...");
  
  const timers = Array.from(jobTimers.values());
  for (const timer of timers) {
    clearTimeout(timer);
  }
  
  jobTimers.clear();
  jobs.clear();
  
  console.log("[Scheduled Learning] All jobs shut down");
}
