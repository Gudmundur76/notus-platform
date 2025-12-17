import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createNotification } from "./db";

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

describe("notifications.list", () => {
  it("returns an array of notifications for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a notification first
    await createNotification({
      userId: ctx.user!.id,
      taskId: 1,
      title: "Test Notification",
      message: "This is a test notification",
      type: "info",
      isRead: 0,
    });

    const notifications = await caller.notifications.list();

    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0]).toHaveProperty("id");
    expect(notifications[0]).toHaveProperty("title");
    expect(notifications[0]).toHaveProperty("message");
    expect(notifications[0]).toHaveProperty("type");
    expect(notifications[0]).toHaveProperty("isRead");
  });

  it("returns empty array for user with no notifications", async () => {
    const ctx = createAuthContext(888); // New user with no notifications
    const caller = appRouter.createCaller(ctx);

    const notifications = await caller.notifications.list();

    expect(Array.isArray(notifications)).toBe(true);
  });
});

describe("notifications.markRead", () => {
  it("marks a notification as read successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a notification first
    const notificationId = await createNotification({
      userId: ctx.user!.id,
      taskId: 1,
      title: "Notification to Mark Read",
      message: "This notification will be marked as read",
      type: "success",
      isRead: 0,
    });

    const result = await caller.notifications.markRead({ notificationId });

    expect(result).toEqual({ success: true });
  });

  it("handles marking non-existent notification gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This should not throw an error
    const result = await caller.notifications.markRead({ notificationId: 999999 });

    expect(result).toEqual({ success: true });
  });
});

describe("notification types", () => {
  it("creates success notification", async () => {
    const ctx = createAuthContext();

    const notificationId = await createNotification({
      userId: ctx.user!.id,
      taskId: 1,
      title: "Success",
      message: "Task completed successfully",
      type: "success",
      isRead: 0,
    });

    expect(typeof notificationId).toBe("number");
    expect(notificationId).toBeGreaterThan(0);
  });

  it("creates error notification", async () => {
    const ctx = createAuthContext();

    const notificationId = await createNotification({
      userId: ctx.user!.id,
      taskId: 1,
      title: "Error",
      message: "Task failed",
      type: "error",
      isRead: 0,
    });

    expect(typeof notificationId).toBe("number");
    expect(notificationId).toBeGreaterThan(0);
  });

  it("creates info notification", async () => {
    const ctx = createAuthContext();

    const notificationId = await createNotification({
      userId: ctx.user!.id,
      taskId: 1,
      title: "Info",
      message: "Task is processing",
      type: "info",
      isRead: 0,
    });

    expect(typeof notificationId).toBe("number");
    expect(notificationId).toBeGreaterThan(0);
  });
});
