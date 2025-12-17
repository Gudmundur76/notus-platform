import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
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
    res: {} as TrpcContext["res"],
  };
}

describe("Memory System", () => {
  describe("Conversations", () => {
    it("should create a new conversation", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.memory.conversations.create({
        title: "Test Conversation",
        summary: "A test conversation for memory system",
      });

      expect(result).toHaveProperty("conversationId");
      expect(typeof result.conversationId).toBe("number");
      expect(result.conversationId).toBeGreaterThan(0);
    });

    it("should list user conversations", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a conversation first
      await caller.memory.conversations.create({
        title: "Test Conversation List",
      });

      const conversations = await caller.memory.conversations.list();

      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBeGreaterThanOrEqual(1);
    });

    it("should get conversation by ID", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const { conversationId } = await caller.memory.conversations.create({
        title: "Get Test Conversation",
      });

      const conversation = await caller.memory.conversations.get({
        conversationId,
      });

      expect(conversation).toBeDefined();
      expect(conversation?.id).toBe(conversationId);
      expect(conversation?.title).toBe("Get Test Conversation");
    });
  });

  describe("Messages", () => {
    it("should create a message in a conversation", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create conversation first
      const { conversationId } = await caller.memory.conversations.create({
        title: "Message Test Conversation",
      });

      const result = await caller.memory.messages.create({
        conversationId,
        role: "user",
        content: "Hello, this is a test message",
      });

      expect(result).toHaveProperty("messageId");
      expect(typeof result.messageId).toBe("number");
    });

    it("should list messages in a conversation", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create conversation and message
      const { conversationId } = await caller.memory.conversations.create({
        title: "Message List Test",
      });

      await caller.memory.messages.create({
        conversationId,
        role: "user",
        content: "Test message 1",
      });

      await caller.memory.messages.create({
        conversationId,
        role: "assistant",
        content: "Test response 1",
      });

      const messages = await caller.memory.messages.list({ conversationId });

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages[0]?.role).toBe("user");
      expect(messages[1]?.role).toBe("assistant");
    });
  });

  describe("Memory Entries", () => {
    it("should create a memory entry", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.memory.entries.create({
        type: "fact",
        key: "favorite_color",
        value: "blue",
        importance: 7,
      });

      expect(result).toHaveProperty("memoryId");
      expect(typeof result.memoryId).toBe("number");
    });

    it("should list all memory entries", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a memory entry
      await caller.memory.entries.create({
        type: "preference",
        key: "theme",
        value: "dark",
        importance: 5,
      });

      const memories = await caller.memory.entries.list();

      expect(Array.isArray(memories)).toBe(true);
      expect(memories.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter memories by type", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create different types of memories
      await caller.memory.entries.create({
        type: "fact",
        key: "user_name",
        value: "John",
        importance: 8,
      });

      await caller.memory.entries.create({
        type: "preference",
        key: "language",
        value: "English",
        importance: 6,
      });

      const facts = await caller.memory.entries.list({ type: "fact" });
      const preferences = await caller.memory.entries.list({ type: "preference" });

      expect(facts.every((m) => m.type === "fact")).toBe(true);
      expect(preferences.every((m) => m.type === "preference")).toBe(true);
    });

    it("should search memories by keyword", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.memory.entries.create({
        type: "context",
        key: "project_info",
        value: "Working on AI assistant project",
        importance: 7,
      });

      const results = await caller.memory.entries.search({
        query: "assistant",
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(
        results.some((m) => m.value.toLowerCase().includes("assistant"))
      ).toBe(true);
    });

    it("should update a memory entry", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const { memoryId } = await caller.memory.entries.create({
        type: "fact",
        key: "test_key",
        value: "original_value",
        importance: 5,
      });

      const result = await caller.memory.entries.update({
        memoryId,
        updates: {
          value: "updated_value",
          importance: 8,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should delete a memory entry", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const { memoryId } = await caller.memory.entries.create({
        type: "fact",
        key: "delete_test",
        value: "to_be_deleted",
        importance: 3,
      });

      const result = await caller.memory.entries.delete({ memoryId });

      expect(result.success).toBe(true);
    });
  });

  describe("User Preferences", () => {
    it("should get user preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const preferences = await caller.memory.preferences.get();

      expect(typeof preferences).toBe("object");
    });

    it("should update user preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.memory.preferences.update({
        theme: "dark",
        language: "en",
        notifications: true,
      });

      expect(result.success).toBe(true);

      // Verify the update
      const preferences = await caller.memory.preferences.get();
      expect(preferences.theme).toBe("dark");
      expect(preferences.language).toBe("en");
      expect(preferences.notifications).toBe(true);
    });
  });

  describe("Context Retrieval", () => {
    it("should get context for a task", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create some context
      const { conversationId } = await caller.memory.conversations.create({
        title: "Context Test",
      });

      await caller.memory.messages.create({
        conversationId,
        role: "user",
        content: "I need help with coding",
      });

      await caller.memory.entries.create({
        type: "preference",
        key: "coding_language",
        value: "TypeScript",
        importance: 7,
      });

      const context = await caller.memory.getContext({
        taskDescription: "Help me write a TypeScript function",
        conversationId,
      });

      expect(context).toHaveProperty("recentMessages");
      expect(context).toHaveProperty("relevantMemories");
      expect(context).toHaveProperty("preferences");
      expect(Array.isArray(context.recentMessages)).toBe(true);
      expect(Array.isArray(context.relevantMemories)).toBe(true);
      expect(typeof context.preferences).toBe("object");
    });
  });
});
