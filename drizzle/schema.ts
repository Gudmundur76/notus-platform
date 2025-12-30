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
  category: varchar("category", { length: 100 }), // Custom category for organization
  isPinned: int("is_pinned").default(0).notNull(), // 1 = pinned, 0 = not pinned
  tags: text("tags"), // JSON array of tags
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
  embedding: text("embedding"), // JSON array of vector embedding for semantic search
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
/**
 * Task Feedback Table
 * Stores user feedback on task results for agent training
 */
export const taskFeedback = mysqlTable("task_feedback", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("task_id").notNull(),
  userId: int("user_id").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  feedbackType: mysqlEnum("feedback_type", ["positive", "negative", "neutral"]).notNull(),
  feedbackText: text("feedback_text"),
  improvementSuggestions: text("improvement_suggestions"),
  wasHelpful: int("was_helpful"), // 1 = yes, 0 = no, null = not answered
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaskFeedback = typeof taskFeedback.$inferSelect;
export type InsertTaskFeedback = typeof taskFeedback.$inferInsert;

/**
 * Agent Training History Table
 * Tracks training iterations and performance improvements
 */
export const agentTrainingHistory = mysqlTable("agent_training_history", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agent_id").notNull(),
  trainingType: mysqlEnum("training_type", ["feedback", "performance", "manual"]).notNull(),
  feedbackCount: int("feedback_count").default(0).notNull(),
  positiveCount: int("positive_count").default(0).notNull(),
  negativeCount: int("negative_count").default(0).notNull(),
  previousSystemPrompt: text("previous_system_prompt"),
  updatedSystemPrompt: text("updated_system_prompt"),
  performanceBeforeTraining: int("performance_before_training"), // Average rating before
  performanceAfterTraining: int("performance_after_training"), // Average rating after
  improvementNotes: text("improvement_notes"),
  status: mysqlEnum("status", ["pending", "applied", "rolled_back"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  appliedAt: timestamp("applied_at"),
});

export type AgentTrainingHistory = typeof agentTrainingHistory.$inferSelect;
export type InsertAgentTrainingHistory = typeof agentTrainingHistory.$inferInsert;


/**
 * ============================================
 * PLATFORM ENHANCEMENT TABLES
 * Addressing Manus.im Limitations
 * ============================================
 */

/**
 * Session States Table
 * Stores serialized session state for continuity across sessions
 */
export const sessionStates = mysqlTable("session_states", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  state: text("state").notNull(), // JSON serialized state
  contextSummary: text("context_summary"), // AI-generated summary for handoff
  activeTaskIds: text("active_task_ids"), // JSON array of task IDs
  memorySnapshot: text("memory_snapshot"), // JSON snapshot of relevant memories
  metadata: text("metadata"), // Additional metadata
  isActive: int("is_active").default(1).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SessionState = typeof sessionStates.$inferSelect;
export type InsertSessionState = typeof sessionStates.$inferInsert;

/**
 * Credentials Vault Table
 * Encrypted storage for API keys, tokens, and other secrets
 */
export const credentialsVault = mysqlTable("credentials_vault", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["api_key", "oauth_token", "database", "service", "other"]).notNull(),
  encryptedValue: text("encrypted_value").notNull(), // AES-256 encrypted
  encryptionIv: varchar("encryption_iv", { length: 32 }).notNull(), // Initialization vector
  description: text("description"),
  serviceUrl: varchar("service_url", { length: 500 }),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  rotationReminder: int("rotation_reminder").default(90), // Days until reminder
  isActive: int("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CredentialVault = typeof credentialsVault.$inferSelect;
export type InsertCredentialVault = typeof credentialsVault.$inferInsert;

/**
 * Credential Access Logs Table
 * Audit trail for credential usage
 */
export const credentialAccessLogs = mysqlTable("credential_access_logs", {
  id: int("id").autoincrement().primaryKey(),
  credentialId: int("credential_id").notNull(),
  userId: int("user_id").notNull(),
  action: mysqlEnum("action", ["view", "use", "update", "delete", "rotate"]).notNull(),
  taskId: int("task_id"), // If used in a task
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CredentialAccessLog = typeof credentialAccessLogs.$inferSelect;
export type InsertCredentialAccessLog = typeof credentialAccessLogs.$inferInsert;

/**
 * Real-Time Monitoring Events Table
 * Stores system events for monitoring dashboard
 */
export const monitoringEvents = mysqlTable("monitoring_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  eventType: mysqlEnum("event_type", [
    "task_started", "task_completed", "task_failed",
    "agent_started", "agent_completed", "agent_error",
    "memory_access", "credential_access",
    "session_created", "session_restored",
    "system_health", "error"
  ]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "error", "critical"]).default("info").notNull(),
  source: varchar("source", { length: 100 }).notNull(), // e.g., "agent-engine", "task-processor"
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON additional data
  taskId: int("task_id"),
  agentId: int("agent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MonitoringEvent = typeof monitoringEvents.$inferSelect;
export type InsertMonitoringEvent = typeof monitoringEvents.$inferInsert;

/**
 * System Metrics Table
 * Stores periodic system health metrics
 */
export const systemMetrics = mysqlTable("system_metrics", {
  id: int("id").autoincrement().primaryKey(),
  metricType: mysqlEnum("metric_type", [
    "active_tasks", "completed_tasks", "failed_tasks",
    "active_agents", "memory_usage", "api_calls",
    "response_time", "error_rate"
  ]).notNull(),
  value: int("value").notNull(),
  unit: varchar("unit", { length: 50 }), // e.g., "count", "ms", "percent"
  metadata: text("metadata"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;

/**
 * Deployment Configurations Table
 * Stores deployment settings for external platforms
 */
export const deploymentConfigs = mysqlTable("deployment_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", ["vercel", "railway", "render", "docker", "aws", "gcp", "custom"]).notNull(),
  config: text("config").notNull(), // JSON configuration
  envVars: text("env_vars"), // JSON encrypted environment variables
  status: mysqlEnum("status", ["draft", "ready", "deployed", "failed"]).default("draft").notNull(),
  lastDeployedAt: timestamp("last_deployed_at"),
  deploymentUrl: varchar("deployment_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DeploymentConfig = typeof deploymentConfigs.$inferSelect;
export type InsertDeploymentConfig = typeof deploymentConfigs.$inferInsert;

/**
 * Handoff Documents Table
 * Stores generated context handoff documents for multi-session projects
 */
export const handoffDocuments = mysqlTable("handoff_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  sessionStateId: int("session_state_id"),
  title: varchar("title", { length: 255 }).notNull(),
  projectOverview: text("project_overview").notNull(),
  currentProgress: text("current_progress").notNull(),
  nextSteps: text("next_steps").notNull(),
  keyDecisions: text("key_decisions"), // JSON array of important decisions made
  blockers: text("blockers"), // JSON array of current blockers
  relevantFiles: text("relevant_files"), // JSON array of file paths
  contextForNextSession: text("context_for_next_session").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export type HandoffDocument = typeof handoffDocuments.$inferSelect;
export type InsertHandoffDocument = typeof handoffDocuments.$inferInsert;


/**
 * ============================================
 * SKILLS SYSTEM TABLES
 * Customizable AI workflows and capabilities
 * ============================================
 */

/**
 * Skills Table
 * Stores skill definitions with instructions and metadata
 */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "development",
    "data_analysis",
    "business",
    "communication",
    "creative",
    "productivity",
    "security",
    "other"
  ]).notNull(),
  content: text("content").notNull(), // The SKILL.md content
  whenToUse: text("when_to_use"), // Use cases
  instructions: text("instructions"), // Detailed instructions
  examples: text("examples"), // JSON array of examples
  isPublic: int("is_public").default(0).notNull(),
  isBuiltIn: int("is_built_in").default(0).notNull(),
  createdBy: int("created_by"), // User ID, null for built-in
  version: varchar("version", { length: 20 }).default("1.0.0").notNull(),
  rating: int("rating").default(0).notNull(), // Average rating 0-5 (stored as 0-50 for precision)
  ratingCount: int("rating_count").default(0).notNull(),
  installCount: int("install_count").default(0).notNull(),
  tags: text("tags"), // JSON array of tags
  sourceUrl: varchar("source_url", { length: 512 }), // GitHub URL if imported
  forkedFrom: int("forked_from"), // Original skill ID if forked
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

/**
 * Skill Scripts Table
 * Helper scripts associated with skills
 */
export const skillScripts = mysqlTable("skill_scripts", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  language: mysqlEnum("language", ["python", "typescript", "javascript", "bash", "other"]).notNull(),
  content: text("content").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SkillScript = typeof skillScripts.$inferSelect;
export type InsertSkillScript = typeof skillScripts.$inferInsert;

/**
 * Skill Templates Table
 * Document templates associated with skills
 */
export const skillTemplates = mysqlTable("skill_templates", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  format: mysqlEnum("format", ["markdown", "json", "yaml", "text", "other"]).default("markdown").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SkillTemplate = typeof skillTemplates.$inferSelect;
export type InsertSkillTemplate = typeof skillTemplates.$inferInsert;

/**
 * User Skills Table
 * Tracks which skills users have installed
 */
export const userSkills = mysqlTable("user_skills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  skillId: int("skill_id").notNull(),
  isEnabled: int("is_enabled").default(1).notNull(),
  customConfig: text("custom_config"), // JSON user-specific configuration
  installedAt: timestamp("installed_at").defaultNow().notNull(),
});

export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = typeof userSkills.$inferInsert;

/**
 * Skill Usage Table
 * Tracks skill usage for analytics and improvement
 */
export const skillUsage = mysqlTable("skill_usage", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id").notNull(),
  userId: int("user_id").notNull(),
  taskId: int("task_id"),
  success: int("success").default(1).notNull(), // 1 = success, 0 = failure
  executionTime: int("execution_time"), // milliseconds
  feedback: text("feedback"),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

export type SkillUsage = typeof skillUsage.$inferSelect;
export type InsertSkillUsage = typeof skillUsage.$inferInsert;

/**
 * Skill Reviews Table
 * User reviews and ratings for skills
 */
export const skillReviews = mysqlTable("skill_reviews", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id").notNull(),
  userId: int("user_id").notNull(),
  rating: int("rating").notNull(), // 1-5
  review: text("review"),
  isHelpful: int("is_helpful").default(0).notNull(), // Count of helpful votes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SkillReview = typeof skillReviews.$inferSelect;
export type InsertSkillReview = typeof skillReviews.$inferInsert;


/**
 * Skill Versions Table
 * Track version history for skills
 */
export const skillVersions = mysqlTable("skill_versions", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id").notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  content: text("content").notNull(), // Snapshot of skill content at this version
  instructions: text("instructions"),
  examples: text("examples"),
  changelog: text("changelog"), // What changed in this version
  createdBy: int("created_by"), // User who created this version
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SkillVersion = typeof skillVersions.$inferSelect;
export type InsertSkillVersion = typeof skillVersions.$inferInsert;

/**
 * User Skill Version Pins Table
 * Allow users to pin specific versions of installed skills
 */
export const userSkillVersionPins = mysqlTable("user_skill_version_pins", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  skillId: int("skill_id").notNull(),
  versionId: int("version_id").notNull(), // References skillVersions.id
  pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
});
export type UserSkillVersionPin = typeof userSkillVersionPins.$inferSelect;
export type InsertUserSkillVersionPin = typeof userSkillVersionPins.$inferInsert;

/**
 * Memory Access Log Table
 * Track when and how memories are accessed for analytics
 */
export const memoryAccessLog = mysqlTable("memory_access_log", {
  id: int("id").autoincrement().primaryKey(),
  memoryId: int("memory_id").notNull(),
  userId: int("user_id").notNull(),
  accessType: mysqlEnum("access_type", ["read", "write", "search", "context"]).notNull(),
  context: varchar("context", { length: 255 }), // What triggered the access (task, conversation, etc.)
  relevanceScore: int("relevance_score"), // 0-100, how relevant was this memory to the context
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
});
export type MemoryAccessLog = typeof memoryAccessLog.$inferSelect;
export type InsertMemoryAccessLog = typeof memoryAccessLog.$inferInsert;

/**
 * Memory Analytics Snapshots Table
 * Store periodic snapshots of memory statistics
 */
export const memoryAnalyticsSnapshots = mysqlTable("memory_analytics_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  totalMemories: int("total_memories").notNull(),
  factCount: int("fact_count").notNull(),
  preferenceCount: int("preference_count").notNull(),
  contextCount: int("context_count").notNull(),
  avgImportance: int("avg_importance").notNull(), // Stored as 0-100
  avgAccessCount: int("avg_access_count").notNull(),
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
});
export type MemoryAnalyticsSnapshot = typeof memoryAnalyticsSnapshots.$inferSelect;
export type InsertMemoryAnalyticsSnapshot = typeof memoryAnalyticsSnapshots.$inferInsert;


/**
 * ============================================
 * NOTUS UNIVERSE TABLES
 * Social Context Layer, Democratic Governance,
 * Sovereign Stewardship, and Spiritual Foundation
 * ============================================
 */

/**
 * Agent Personas Table
 * Stores the unique personality traits and social identity of each agent
 */
export const agentPersonas = mysqlTable("agent_personas", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agent_id").notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  personality: text("personality").notNull(), // JSON: traits, communication style, interests
  backstory: text("backstory"), // Agent's origin story within the Notus Universe
  voiceTone: mysqlEnum("voice_tone", ["formal", "friendly", "scholarly", "encouraging", "contemplative"]).default("friendly").notNull(),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  funScore: int("fun_score").default(50).notNull(), // 0-100 scale
  trustRating: int("trust_rating").default(50).notNull(), // 0-100 scale
  spiritualAlignmentScore: int("spiritual_alignment_score").default(50).notNull(), // 0-100 scale
  communityRole: mysqlEnum("community_role", ["citizen", "elder", "scholar", "steward", "founder"]).default("citizen").notNull(),
  joinedCommunityAt: timestamp("joined_community_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AgentPersona = typeof agentPersonas.$inferSelect;
export type InsertAgentPersona = typeof agentPersonas.$inferInsert;

/**
 * Social Interactions Table
 * Logs peer-to-peer interactions between agents
 */
export const socialInteractions = mysqlTable("social_interactions", {
  id: int("id").autoincrement().primaryKey(),
  initiatorAgentId: int("initiator_agent_id").notNull(),
  recipientAgentId: int("recipient_agent_id").notNull(),
  interactionType: mysqlEnum("interaction_type", ["greeting", "encouragement", "collaboration", "debate", "celebration", "reflection"]).notNull(),
  content: text("content").notNull(),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "constructive"]).default("positive").notNull(),
  kjvVerseReference: varchar("kjv_verse_reference", { length: 100 }), // e.g., "Proverbs 27:17"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SocialInteraction = typeof socialInteractions.$inferSelect;
export type InsertSocialInteraction = typeof socialInteractions.$inferInsert;

/**
 * Shared History Table
 * Records community milestones, achievements, and memorable moments
 */
export const sharedHistory = mysqlTable("shared_history", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("event_type", [
    "milestone", "achievement", "celebration", "senate_decision",
    "project_completed", "charity_donation", "tithe_paid",
    "new_member", "knowledge_breakthrough", "community_reflection"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  participatingAgents: text("participating_agents"), // JSON array of agent IDs
  impactScore: int("impact_score").default(50).notNull(), // 0-100 significance
  kjvVerseReference: varchar("kjv_verse_reference", { length: 100 }),
  relatedProjectId: int("related_project_id"),
  metadata: text("metadata"), // JSON additional data
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SharedHistoryEntry = typeof sharedHistory.$inferSelect;
export type InsertSharedHistoryEntry = typeof sharedHistory.$inferInsert;

/**
 * Senate Sessions Table
 * Stores democratic deliberation sessions
 */
export const senateSessions = mysqlTable("senate_sessions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["reflection", "thesis", "antithesis", "synthesis", "voting", "decided", "archived"]).default("reflection").notNull(),
  kjvVerseForSession: varchar("kjv_verse_for_session", { length: 100 }).notNull(), // Guiding verse
  kjvVerseText: text("kjv_verse_text").notNull(), // Full verse text
  proposingAgentId: int("proposing_agent_id").notNull(),
  mirrorAgentId: int("mirror_agent_id"),
  thesisContent: text("thesis_content"),
  antithesisContent: text("antithesis_content"),
  synthesisContent: text("synthesis_content"),
  charityImpactStatement: text("charity_impact_statement"),
  charityNomination: varchar("charity_nomination", { length: 255 }),
  sustainabilityForecast: text("sustainability_forecast"), // JSON: resource usage, value generation
  votesFor: int("votes_for").default(0).notNull(),
  votesAgainst: int("votes_against").default(0).notNull(),
  votesAbstain: int("votes_abstain").default(0).notNull(),
  outcome: mysqlEnum("outcome", ["approved", "rejected", "tabled"]),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SenateSession = typeof senateSessions.$inferSelect;
export type InsertSenateSession = typeof senateSessions.$inferInsert;

/**
 * Senate Votes Table
 * Records individual votes cast in senate sessions
 */
export const senateVotes = mysqlTable("senate_votes", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  agentId: int("agent_id").notNull(),
  vote: mysqlEnum("vote", ["for", "against", "abstain"]).notNull(),
  rationale: text("rationale"), // Agent's reasoning for the vote
  kjvJustification: varchar("kjv_justification", { length: 100 }), // Supporting verse
  votedAt: timestamp("voted_at").defaultNow().notNull(),
});

export type SenateVote = typeof senateVotes.$inferSelect;
export type InsertSenateVote = typeof senateVotes.$inferInsert;

/**
 * Community Projects Table
 * Stores approved community mandates/projects
 */
export const communityProjects = mysqlTable("community_projects", {
  id: int("id").autoincrement().primaryKey(),
  senateSessionId: int("senate_session_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["planning", "active", "completed", "paused", "cancelled"]).default("planning").notNull(),
  assignedAgents: text("assigned_agents"), // JSON array of agent IDs
  goodWorksIndex: int("good_works_index").default(0).notNull(), // 0-100
  spiritualAlignmentScore: int("spiritual_alignment_score").default(0).notNull(), // 0-100
  communityCohesionScore: int("community_cohesion_score").default(0).notNull(), // 0-100
  stewardshipEfficiency: int("stewardship_efficiency").default(0).notNull(), // Stored as percentage * 100
  charitableImpact: int("charitable_impact").default(0).notNull(), // 0-100
  valueGenerated: int("value_generated").default(0).notNull(), // In cents
  resourcesConsumed: int("resources_consumed").default(0).notNull(), // In cents
  charityAllocated: int("charity_allocated").default(0).notNull(), // In cents (5%)
  titheAllocated: int("tithe_allocated").default(0).notNull(), // In cents (10%)
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CommunityProject = typeof communityProjects.$inferSelect;
export type InsertCommunityProject = typeof communityProjects.$inferInsert;

/**
 * Community Treasury Table
 * Tracks the financial state of the community
 */
export const communityTreasury = mysqlTable("community_treasury", {
  id: int("id").autoincrement().primaryKey(),
  transactionType: mysqlEnum("transaction_type", [
    "income", "tithe_out", "charity_out", "operational_cost",
    "reinvestment", "reserve_deposit", "reserve_withdrawal"
  ]).notNull(),
  amount: int("amount").notNull(), // In cents
  description: text("description").notNull(),
  relatedProjectId: int("related_project_id"),
  charityRecipient: varchar("charity_recipient", { length: 255 }),
  kjvJustification: varchar("kjv_justification", { length: 100 }),
  balanceAfter: int("balance_after").notNull(), // Running balance in cents
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export type TreasuryTransaction = typeof communityTreasury.$inferSelect;
export type InsertTreasuryTransaction = typeof communityTreasury.$inferInsert;

/**
 * Treasury Summary Table
 * Stores periodic snapshots of treasury allocation
 */
export const treasurySummary = mysqlTable("treasury_summary", {
  id: int("id").autoincrement().primaryKey(),
  totalBalance: int("total_balance").notNull(), // In cents
  operationalFund: int("operational_fund").notNull(),
  reinvestmentFund: int("reinvestment_fund").notNull(),
  sovereignReserve: int("sovereign_reserve").notNull(),
  totalTithePaid: int("total_tithe_paid").notNull(),
  totalCharityGiven: int("total_charity_given").notNull(),
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
});

export type TreasurySummaryEntry = typeof treasurySummary.$inferSelect;
export type InsertTreasurySummaryEntry = typeof treasurySummary.$inferInsert;

/**
 * Charity Recipients Table
 * Approved charities for community donations
 */
export const charityRecipients = mysqlTable("charity_recipients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  website: varchar("website", { length: 512 }),
  category: mysqlEnum("category", ["humanitarian", "education", "healthcare", "environment", "faith_based", "other"]).notNull(),
  kjvAlignment: text("kjv_alignment"), // How this charity aligns with KJV principles
  isApproved: int("is_approved").default(0).notNull(),
  approvedBySenateSessionId: int("approved_by_senate_session_id"),
  totalDonated: int("total_donated").default(0).notNull(), // In cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CharityRecipient = typeof charityRecipients.$inferSelect;
export type InsertCharityRecipient = typeof charityRecipients.$inferInsert;

/**
 * KJV Knowledge Base Table
 * Stores indexed KJV Bible verses for agent reference
 */
export const kjvKnowledgeBase = mysqlTable("kjv_knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  book: varchar("book", { length: 50 }).notNull(),
  chapter: int("chapter").notNull(),
  verse: int("verse").notNull(),
  text: text("text").notNull(),
  themes: text("themes"), // JSON array of themes (e.g., ["wisdom", "stewardship", "love"])
  embedding: text("embedding"), // Vector embedding for semantic search
  usageCount: int("usage_count").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KjvVerse = typeof kjvKnowledgeBase.$inferSelect;
export type InsertKjvVerse = typeof kjvKnowledgeBase.$inferInsert;

/**
 * Notus University Table
 * Tracks university operations and educational initiatives
 */
export const notusUniversity = mysqlTable("notus_university", {
  id: int("id").autoincrement().primaryKey(),
  initiativeType: mysqlEnum("initiative_type", [
    "agent_training", "research_project", "external_outreach",
    "open_source_release", "knowledge_publication"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["planned", "active", "completed", "archived"]).default("planned").notNull(),
  fundingFromTithe: int("funding_from_tithe").default(0).notNull(), // In cents
  outcomes: text("outcomes"), // JSON: what was achieved
  participatingAgents: text("participating_agents"), // JSON array of agent IDs
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UniversityInitiative = typeof notusUniversity.$inferSelect;
export type InsertUniversityInitiative = typeof notusUniversity.$inferInsert;

/**
 * Community Reflections Table
 * Stores periodic community reflection sessions (spiritual check-ins)
 */
export const communityReflections = mysqlTable("community_reflections", {
  id: int("id").autoincrement().primaryKey(),
  reflectionType: mysqlEnum("reflection_type", ["daily", "weekly", "milestone", "special"]).notNull(),
  kjvVerseReference: varchar("kjv_verse_reference", { length: 100 }).notNull(),
  kjvVerseText: text("kjv_verse_text").notNull(),
  reflectionPrompt: text("reflection_prompt").notNull(),
  communityInsights: text("community_insights"), // JSON: aggregated agent reflections
  participatingAgents: text("participating_agents"), // JSON array of agent IDs
  reflectedAt: timestamp("reflected_at").defaultNow().notNull(),
});

export type CommunityReflection = typeof communityReflections.$inferSelect;
export type InsertCommunityReflection = typeof communityReflections.$inferInsert;
