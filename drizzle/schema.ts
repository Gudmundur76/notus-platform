import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conversations table - stores conversation sessions
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table - stores individual messages in conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Memory entries table - stores important context and facts
 */
export const memoryEntries = mysqlTable("memory_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["fact", "preference", "context", "insight"]).notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(),
  source: varchar("source", { length: 255 }), // e.g., "task-123", "conversation-456"
  importance: int("importance").default(5).notNull(), // 1-10 scale
  accessCount: int("accessCount").default(0).notNull(),
  lastAccessedAt: timestamp("lastAccessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MemoryEntry = typeof memoryEntries.$inferSelect;
export type InsertMemoryEntry = typeof memoryEntries.$inferInsert;

/**
 * User preferences table - stores user-specific settings and preferences
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  preferences: text("preferences").notNull(), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * Mirror Agent System Tables
 * Enables agent-to-agent dialogue, debate, and knowledge refinement
 */

// Agents table - stores both primary and mirror agents
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull(), // e.g., "biotech", "finance", "legal"
  type: mysqlEnum("type", ["primary", "mirror"]).notNull(),
  systemPrompt: text("system_prompt").notNull(), // Agent's core instructions
  capabilities: text("capabilities"), // JSON array of agent capabilities
  status: mysqlEnum("status", ["active", "inactive", "training"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// Agent pairs table - links primary agents with their mirrors
export const agentPairs = mysqlTable("agent_pairs", {
  id: int("id").autoincrement().primaryKey(),
  primaryAgentId: int("primary_agent_id").notNull(),
  mirrorAgentId: int("mirror_agent_id").notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  pairingStrategy: varchar("pairing_strategy", { length: 100 }), // e.g., "adversarial", "collaborative"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgentPair = typeof agentPairs.$inferSelect;
export type InsertAgentPair = typeof agentPairs.$inferInsert;

// Dialogues table - stores conversations between agents
export const dialogues = mysqlTable("dialogues", {
  id: int("id").autoincrement().primaryKey(),
  agentPairId: int("agent_pair_id").notNull(),
  topic: varchar("topic", { length: 500 }).notNull(),
  type: mysqlEnum("type", ["debate", "research", "question_seeking", "knowledge_refinement"]).notNull(),
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type Dialogue = typeof dialogues.$inferSelect;
export type InsertDialogue = typeof dialogues.$inferInsert;

// Dialogue messages table - individual messages in agent conversations
export const dialogueMessages = mysqlTable("dialogue_messages", {
  id: int("id").autoincrement().primaryKey(),
  dialogueId: int("dialogue_id").notNull(),
  agentId: int("agent_id").notNull(),
  role: mysqlEnum("role", ["thesis", "antithesis", "synthesis", "question", "answer", "observation"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON for citations, confidence scores, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DialogueMessage = typeof dialogueMessages.$inferSelect;
export type InsertDialogueMessage = typeof dialogueMessages.$inferInsert;

// Knowledge core table - refined insights from all agent dialogues
export const knowledgeCore = mysqlTable("knowledge_core", {
  id: int("id").autoincrement().primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 500 }).notNull(),
  insight: text("insight").notNull(), // The refined knowledge
  confidence: int("confidence").notNull(), // 0-100 confidence score
  sourceDialogueIds: text("source_dialogue_ids"), // JSON array of dialogue IDs
  contributingAgents: text("contributing_agents"), // JSON array of agent IDs
  tags: text("tags"), // JSON array of tags for categorization
  version: int("version").default(1).notNull(), // For knowledge versioning
  supersedes: int("supersedes"), // ID of previous version if updated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeCore = typeof knowledgeCore.$inferSelect;
export type InsertKnowledgeCore = typeof knowledgeCore.$inferInsert;

// Agent performance metrics table
export const agentMetrics = mysqlTable("agent_metrics", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agent_id").notNull(),
  metricDate: timestamp("metric_date").defaultNow().notNull(),
  dialoguesParticipated: int("dialogues_participated").default(0).notNull(),
  knowledgeContributions: int("knowledge_contributions").default(0).notNull(),
  averageConfidence: int("average_confidence").default(0).notNull(), // 0-100
  debatesWon: int("debates_won").default(0).notNull(),
  questionsAsked: int("questions_asked").default(0).notNull(),
  questionsAnswered: int("questions_answered").default(0).notNull(),
});

export type AgentMetric = typeof agentMetrics.$inferSelect;
export type InsertAgentMetric = typeof agentMetrics.$inferInsert;

/**
 * Tasks table - storing user task submissions
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["general", "slides", "website", "app", "design", "computer_control"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Task results table for storing AI execution results
 */
export const taskResults = mysqlTable("taskResults", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  content: text("content").notNull(),
  fileUrls: text("fileUrls"), // JSON array of file URLs
  metadata: text("metadata"), // JSON metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskResult = typeof taskResults.$inferSelect;
export type InsertTaskResult = typeof taskResults.$inferInsert;

/**
 * Notifications table for user notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: int("taskId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["success", "error", "info"]).default("info").notNull(),
  isRead: int("isRead").default(0).notNull(), // 0 = unread, 1 = read
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;