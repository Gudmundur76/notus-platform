import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
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

describe("tasks.create", () => {
  it("creates a task successfully with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "Test Task",
      description: "This is a test task description",
      taskType: "general",
    });

    expect(result).toHaveProperty("taskId");
    expect(typeof result.taskId).toBe("number");
    expect(result.taskId).toBeGreaterThan(0);
  });

  it("creates a design task that triggers image generation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "Design Task",
      description: "Create a beautiful landscape design",
      taskType: "design",
    });

    expect(result).toHaveProperty("taskId");
    expect(typeof result.taskId).toBe("number");
  });

  it("creates a slides task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "Slides Task",
      description: "Create presentation slides about AI",
      taskType: "slides",
    });

    expect(result).toHaveProperty("taskId");
    expect(typeof result.taskId).toBe("number");
  });

  it("creates a website task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "Website Task",
      description: "Build a landing page for a startup",
      taskType: "website",
    });

    expect(result).toHaveProperty("taskId");
    expect(typeof result.taskId).toBe("number");
  });

  it("creates an app task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "App Task",
      description: "Develop a mobile app for task management",
      taskType: "app",
    });

    expect(result).toHaveProperty("taskId");
    expect(typeof result.taskId).toBe("number");
  });
});

describe("tasks.list", () => {
  it("returns an array of tasks for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a task first
    await caller.tasks.create({
      title: "Test Task for List",
      description: "This task should appear in the list",
      taskType: "general",
    });

    const tasks = await caller.tasks.list();

    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0]).toHaveProperty("id");
    expect(tasks[0]).toHaveProperty("title");
    expect(tasks[0]).toHaveProperty("description");
    expect(tasks[0]).toHaveProperty("status");
    expect(tasks[0]).toHaveProperty("type");
  });

  it("returns empty array for user with no tasks", async () => {
    const ctx = createAuthContext(999); // New user with no tasks
    const caller = appRouter.createCaller(ctx);

    const tasks = await caller.tasks.list();

    expect(Array.isArray(tasks)).toBe(true);
  });
});

describe("tasks.get", () => {
  it("retrieves task details by ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a task first
    const { taskId } = await caller.tasks.create({
      title: "Task to Retrieve",
      description: "This task will be retrieved",
      taskType: "general",
    });

    const result = await caller.tasks.get({ taskId });

    expect(result).toHaveProperty("task");
    expect(result.task).toBeDefined();
    expect(result.task?.id).toBe(taskId);
    expect(result.task?.title).toBe("Task to Retrieve");
  });

  it("returns undefined for non-existent task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.get({ taskId: 999999 });

    expect(result.task).toBeUndefined();
    expect(result.result).toBeUndefined();
  });
});
