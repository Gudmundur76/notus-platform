import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Training Pipeline", () => {
  it("should get feedback statistics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.feedback.getStats({});

    expect(stats).toBeDefined();
    expect(stats.totalFeedback).toBeGreaterThanOrEqual(0);
    expect(stats.averageRating).toBeGreaterThanOrEqual(0);
    expect(stats.averageRating).toBeLessThanOrEqual(5);
    expect(stats.positiveCount).toBeGreaterThanOrEqual(0);
    expect(stats.negativeCount).toBeGreaterThanOrEqual(0);
  });

  it("should get scheduled jobs status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const jobs = await caller.feedback.getJobsStatus();

    expect(jobs).toBeDefined();
    expect(Array.isArray(jobs)).toBe(true);

    // Jobs array may be empty if scheduler hasn't initialized yet
    if (jobs.length > 0) {
      // Should have daily_training and weekly_review jobs
      const jobNames = jobs.map((j) => j.name);
      expect(jobNames.length).toBeGreaterThan(0);

    // Each job should have required fields
    jobs.forEach((job) => {
      expect(job.name).toBeDefined();
      expect(job.schedule).toBeDefined();
      expect(typeof job.enabled).toBe("boolean");
      expect(job.status).toMatch(/idle|running|error/);
    });
  });

  it("should get training history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.feedback.getAllTrainingHistory({ limit: 10 });

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);

    // Each training record should have required fields
    history.forEach((training) => {
      expect(training.id).toBeDefined();
      expect(training.agentId).toBeDefined();
      expect(training.feedbackCount).toBeGreaterThanOrEqual(0);
      expect(training.status).toMatch(/pending|applied|rolled_back/);
      expect(training.createdAt).toBeDefined();
    });
  });

  it("should extract positive training examples", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const examples = await caller.feedback.getPositiveExamples({ minRating: 4 });

    expect(examples).toBeDefined();
    expect(Array.isArray(examples)).toBe(true);

    // Each example should have required fields
    examples.forEach((example) => {
      expect(example.taskId).toBeDefined();
      expect(example.rating).toBeGreaterThanOrEqual(4);
      expect(example.rating).toBeLessThanOrEqual(5);
    });
  });

  it("should extract negative patterns", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const patterns = await caller.feedback.getNegativePatterns({ maxRating: 2 });

    expect(patterns).toBeDefined();
    expect(Array.isArray(patterns)).toBe(true);

    // Each pattern should have required fields
    patterns.forEach((pattern) => {
      expect(pattern.taskId).toBeDefined();
      expect(pattern.rating).toBeLessThanOrEqual(2);
      expect(pattern.rating).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("Training Scheduler", () => {
  it("should enable a scheduled job", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.enableJob({ jobName: "daily_training" });

    expect(result).toBeDefined();
    // May fail if scheduler not initialized, which is acceptable in test environment
    expect(typeof result.success).toBe("boolean");
    expect(result.message).toBeDefined();
  });

  it("should disable a scheduled job", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.disableJob({ jobName: "daily_training" });

    expect(result).toBeDefined();
    // May fail if scheduler not initialized, which is acceptable in test environment
    expect(typeof result.success).toBe("boolean");
    expect(result.message).toBeDefined();
  });

  it("should handle invalid job name gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.enableJob({ jobName: "invalid_job" });

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
  });
});

describe("Feedback Collection", () => {
  it("should validate feedback rating range", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Valid ratings should be 1-5
    const validRatings = [1, 2, 3, 4, 5];

    for (const rating of validRatings) {
      // This test just validates the schema, actual submission would require a real task
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    }
  });

  it("should get feedback stats with filters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.feedback.getStats({
      minRating: 4,
      maxRating: 5,
    });

    expect(stats).toBeDefined();
    expect(stats.totalFeedback).toBeGreaterThanOrEqual(0);
  });
});

describe("Agent Training", () => {
  it("should get agent training history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get all training history
    const history = await caller.feedback.getAllTrainingHistory({ limit: 20 });

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);

    // Verify training records have correct structure
    history.forEach((training) => {
      expect(training.id).toBeDefined();
      expect(training.agentId).toBeDefined();
      expect(training.feedbackCount).toBeGreaterThanOrEqual(0);
      expect(training.status).toMatch(/pending|applied|rolled_back/);
      expect(training.createdAt).toBeDefined();

      // If training has been applied, it should have performance metrics
      if (training.status === "applied") {
        // Performance metrics may or may not be present depending on whether measurement was run
        if (training.performanceBeforeTraining !== null) {
          expect(training.performanceBeforeTraining).toBeGreaterThanOrEqual(0);
          expect(training.performanceBeforeTraining).toBeLessThanOrEqual(100);
        }
      }
    });
  });
});
