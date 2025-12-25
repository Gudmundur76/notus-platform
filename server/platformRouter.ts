/**
 * Platform Router
 * API endpoints for platform enhancement features:
 * - Real-time monitoring
 * - Session continuity
 * - Credentials vault
 * - Deployment manager
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";

// Monitoring imports
import {
  logEvent,
  getRecentEvents,
  getMetrics,
  getSystemStatus,
  getBufferedEvents,
  recordMetric,
} from "./monitoring";

// Session continuity imports
import {
  createSessionState,
  updateSessionState,
  getSessionState,
  getUserSessions,
  restoreSession,
  generateContextSummary,
  createHandoffDocument,
  getUserHandoffDocuments,
  getHandoffDocument,
  exportSessionData,
  importSessionData,
} from "./sessionContinuity";

// Credentials vault imports
import {
  storeCredential,
  getCredential,
  listCredentials,
  updateCredential,
  deleteCredential,
  rotateCredential,
  getCredentialAccessLogs,
  getCredentialsNeedingRotation,
  getExpiringCredentials,
} from "./credentialsVault";

// Deployment manager imports
import {
  createDeploymentConfig,
  getUserDeployments,
  getDeploymentConfig,
  updateDeploymentConfig,
  deleteDeploymentConfig,
  generateDeploymentPackage,
  getDeploymentTemplates,
  generateVercelConfig,
  generateRailwayConfig,
  generateDockerConfig,
} from "./deploymentManager";

export const platformRouter = router({
  // ============================================
  // MONITORING ENDPOINTS
  // ============================================
  monitoring: router({
    // Get system status summary
    status: protectedProcedure.query(async () => {
      return getSystemStatus();
    }),

    // Get recent events
    events: protectedProcedure
      .input(z.object({
        eventType: z.string().optional(),
        severity: z.enum(["info", "warning", "error", "critical"]).optional(),
        limit: z.number().min(1).max(500).optional(),
        since: z.date().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return getRecentEvents({
          userId: ctx.user.id,
          eventType: input?.eventType as any,
          severity: input?.severity,
          limit: input?.limit,
          since: input?.since,
        });
      }),

    // Get buffered events for initial load
    bufferedEvents: protectedProcedure.query(() => {
      return getBufferedEvents();
    }),

    // Get metrics
    metrics: protectedProcedure
      .input(z.object({
        metricType: z.string().optional(),
        since: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getMetrics({
          metricType: input?.metricType as any,
          since: input?.since,
        });
      }),

    // Log a custom event
    logEvent: protectedProcedure
      .input(z.object({
        eventType: z.enum([
          "task_started", "task_completed", "task_failed",
          "agent_started", "agent_completed", "agent_error",
          "memory_access", "credential_access",
          "session_created", "session_restored",
          "system_health", "error"
        ]),
        severity: z.enum(["info", "warning", "error", "critical"]).optional(),
        source: z.string(),
        message: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await logEvent({
          userId: ctx.user.id,
          eventType: input.eventType,
          severity: input.severity,
          source: input.source,
          message: input.message,
          metadata: input.metadata,
        });
        return { success: true };
      }),

    // Record a metric
    recordMetric: protectedProcedure
      .input(z.object({
        metricType: z.enum([
          "active_tasks", "completed_tasks", "failed_tasks",
          "active_agents", "memory_usage", "api_calls",
          "response_time", "error_rate"
        ]),
        value: z.number(),
        unit: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        await recordMetric({
          metricType: input.metricType,
          value: input.value,
          unit: input.unit,
          metadata: input.metadata,
        });
        return { success: true };
      }),
  }),

  // ============================================
  // SESSION CONTINUITY ENDPOINTS
  // ============================================
  sessions: router({
    // Create a new session state
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        activeTaskIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createSessionState({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          activeTaskIds: input.activeTaskIds,
        });
      }),

    // List user sessions
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserSessions(ctx.user.id);
    }),

    // Get a specific session
    get: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return getSessionState(input.sessionId);
      }),

    // Update session state
    update: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        state: z.record(z.string(), z.unknown()).optional(),
        contextSummary: z.string().optional(),
        activeTaskIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        await updateSessionState({
          sessionId: input.sessionId,
          state: input.state,
          contextSummary: input.contextSummary,
          activeTaskIds: input.activeTaskIds,
        });
        return { success: true };
      }),

    // Restore a session
    restore: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        return restoreSession(input.sessionId);
      }),

    // Generate context summary
    generateSummary: protectedProcedure
      .input(z.object({
        sessionId: z.string().optional(),
        includeTaskHistory: z.boolean().optional(),
        includeMemories: z.boolean().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return generateContextSummary({
          userId: ctx.user.id,
          sessionId: input?.sessionId,
          includeTaskHistory: input?.includeTaskHistory,
          includeMemories: input?.includeMemories,
        });
      }),

    // Export session data
    export: protectedProcedure.query(async ({ ctx }) => {
      return exportSessionData(ctx.user.id);
    }),

    // Import session data
    import: protectedProcedure
      .input(z.object({
        memories: z.array(z.object({
          key: z.string(),
          value: z.string(),
          type: z.string(),
          importance: z.number(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return importSessionData({
          userId: ctx.user.id,
          data: { memories: input.memories },
        });
      }),
  }),

  // ============================================
  // HANDOFF DOCUMENTS ENDPOINTS
  // ============================================
  handoffs: router({
    // Create a handoff document
    create: protectedProcedure
      .input(z.object({
        sessionStateId: z.number().optional(),
        title: z.string().min(1).max(255),
        projectOverview: z.string(),
        currentProgress: z.string(),
        nextSteps: z.string(),
        keyDecisions: z.array(z.string()).optional(),
        blockers: z.array(z.string()).optional(),
        relevantFiles: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createHandoffDocument({
          userId: ctx.user.id,
          ...input,
        });
      }),

    // List handoff documents
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserHandoffDocuments(ctx.user.id);
    }),

    // Get a specific handoff document
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getHandoffDocument(input.id);
      }),
  }),

  // ============================================
  // CREDENTIALS VAULT ENDPOINTS
  // ============================================
  credentials: router({
    // Store a new credential
    store: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        category: z.enum(["api_key", "oauth_token", "database", "service", "other"]),
        value: z.string().min(1),
        description: z.string().optional(),
        serviceUrl: z.string().url().optional(),
        expiresAt: z.date().optional(),
        rotationReminderDays: z.number().min(1).max(365).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return storeCredential({
          userId: ctx.user.id,
          name: input.name,
          category: input.category,
          value: input.value,
          description: input.description,
          serviceUrl: input.serviceUrl,
          expiresAt: input.expiresAt,
          rotationReminderDays: input.rotationReminderDays,
        });
      }),

    // List credentials (without values)
    list: protectedProcedure.query(async ({ ctx }) => {
      return listCredentials(ctx.user.id);
    }),

    // Get a credential (decrypted)
    get: protectedProcedure
      .input(z.object({
        credentialId: z.number(),
        taskId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getCredential({
          credentialId: input.credentialId,
          userId: ctx.user.id,
          taskId: input.taskId,
        });
      }),

    // Update a credential
    update: protectedProcedure
      .input(z.object({
        credentialId: z.number(),
        name: z.string().min(1).max(255).optional(),
        value: z.string().min(1).optional(),
        description: z.string().optional(),
        serviceUrl: z.string().url().optional(),
        expiresAt: z.date().optional(),
        rotationReminderDays: z.number().min(1).max(365).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return updateCredential({
          credentialId: input.credentialId,
          userId: ctx.user.id,
          name: input.name,
          value: input.value,
          description: input.description,
          serviceUrl: input.serviceUrl,
          expiresAt: input.expiresAt,
          rotationReminderDays: input.rotationReminderDays,
        });
      }),

    // Delete a credential
    delete: protectedProcedure
      .input(z.object({ credentialId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteCredential({
          credentialId: input.credentialId,
          userId: ctx.user.id,
        });
      }),

    // Rotate a credential
    rotate: protectedProcedure
      .input(z.object({
        credentialId: z.number(),
        newValue: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return rotateCredential({
          credentialId: input.credentialId,
          userId: ctx.user.id,
          newValue: input.newValue,
        });
      }),

    // Get access logs
    accessLogs: protectedProcedure
      .input(z.object({
        credentialId: z.number(),
        limit: z.number().min(1).max(500).optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getCredentialAccessLogs({
          credentialId: input.credentialId,
          userId: ctx.user.id,
          limit: input.limit,
        });
      }),

    // Get credentials needing rotation
    needingRotation: protectedProcedure.query(async ({ ctx }) => {
      return getCredentialsNeedingRotation(ctx.user.id);
    }),

    // Get expiring credentials
    expiring: protectedProcedure
      .input(z.object({
        daysUntilExpiry: z.number().min(1).max(365).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return getExpiringCredentials({
          userId: ctx.user.id,
          daysUntilExpiry: input?.daysUntilExpiry,
        });
      }),
  }),

  // ============================================
  // DEPLOYMENT MANAGER ENDPOINTS
  // ============================================
  deployments: router({
    // Get deployment templates
    templates: protectedProcedure.query(() => {
      return getDeploymentTemplates();
    }),

    // Create a deployment configuration
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        platform: z.enum(["vercel", "railway", "render", "docker", "aws", "gcp", "custom"]),
        config: z.record(z.string(), z.unknown()),
        envVars: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createDeploymentConfig({
          userId: ctx.user.id,
          name: input.name,
          platform: input.platform,
          config: input.config,
          envVars: input.envVars,
        });
      }),

    // List deployments
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserDeployments(ctx.user.id);
    }),

    // Get a specific deployment
    get: protectedProcedure
      .input(z.object({ deploymentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getDeploymentConfig({
          deploymentId: input.deploymentId,
          userId: ctx.user.id,
        });
      }),

    // Update a deployment
    update: protectedProcedure
      .input(z.object({
        deploymentId: z.number(),
        name: z.string().min(1).max(255).optional(),
        config: z.record(z.string(), z.unknown()).optional(),
        envVars: z.record(z.string(), z.string()).optional(),
        status: z.enum(["draft", "ready", "deployed", "failed"]).optional(),
        deploymentUrl: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return updateDeploymentConfig({
          deploymentId: input.deploymentId,
          userId: ctx.user.id,
          name: input.name,
          config: input.config,
          envVars: input.envVars,
          status: input.status,
          deploymentUrl: input.deploymentUrl,
        });
      }),

    // Delete a deployment
    delete: protectedProcedure
      .input(z.object({ deploymentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteDeploymentConfig({
          deploymentId: input.deploymentId,
          userId: ctx.user.id,
        });
      }),

    // Generate deployment package
    generatePackage: protectedProcedure
      .input(z.object({ deploymentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return generateDeploymentPackage({
          userId: ctx.user.id,
          deploymentId: input.deploymentId,
        });
      }),

    // Generate Vercel config
    generateVercel: protectedProcedure.mutation(() => {
      const result = generateVercelConfig("/app");
      return {
        config: result.vercelJson,
        readme: result.readme,
      };
    }),

    // Generate Railway config
    generateRailway: protectedProcedure.mutation(() => {
      const result = generateRailwayConfig();
      return {
        config: result.railwayJson,
        readme: result.readme,
      };
    }),

    // Generate Docker config
    generateDocker: protectedProcedure.mutation(() => {
      const result = generateDockerConfig({});
      return {
        config: result.dockerfile,
        readme: result.readme,
      };
    }),
  }),
});

export type PlatformRouter = typeof platformRouter;
