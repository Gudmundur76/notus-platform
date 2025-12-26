/**
 * Skills Router
 * tRPC endpoints for skills management
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { seedBuiltInSkills, getBuiltInSkillsCount } from "./builtInSkills";
import {
  createSkill,
  getSkillById,
  getSkillBySlug,
  updateSkill,
  deleteSkill,
  listSkills,
  getPopularSkills,
  getSkillsByCategory,
  addSkillScript,
  getSkillScripts,
  addSkillTemplate,
  getSkillTemplates,
  installSkill,
  uninstallSkill,
  getUserSkills,
  toggleSkillEnabled,
  trackSkillUsage,
  getSkillUsageStats,
  addSkillReview,
  getSkillReviews,
  loadSkillsForAgent,
  getSkillsForTaskType,
  suggestSkillsForTask,
  getSkillCategories,
  importSkillFromGitHub,
  forkSkill,
  searchSkillsFuzzy,
  getSkillRecommendations,
} from "./skills";

export const skillsRouter = router({
  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  /**
   * List skills with filtering
   */
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        isBuiltIn: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return listSkills({
        ...input,
        isPublic: true, // Only show public skills
      });
    }),

  /**
   * Get popular skills
   */
  popular: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ input }) => {
      return getPopularSkills(input.limit);
    }),

  /**
   * Get skills by category
   */
  byCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      return getSkillsByCategory(input.category);
    }),

  /**
   * Get skill by slug
   */
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return getSkillBySlug(input.slug);
    }),

  /**
   * Get skill by ID
   */
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getSkillById(input.id);
    }),

  /**
   * Get skill categories with counts
   */
  categories: publicProcedure.query(async () => {
    return getSkillCategories();
  }),

  /**
   * Suggest skills for a task
   */
  suggest: publicProcedure
    .input(z.object({ taskDescription: z.string() }))
    .query(async ({ input }) => {
      return suggestSkillsForTask(input.taskDescription);
    }),

  /**
   * Get skill reviews
   */
  reviews: publicProcedure
    .input(z.object({ skillId: z.number() }))
    .query(async ({ input }) => {
      return getSkillReviews(input.skillId);
    }),

  /**
   * Get skill usage stats
   */
  usageStats: publicProcedure
    .input(z.object({ skillId: z.number() }))
    .query(async ({ input }) => {
      return getSkillUsageStats(input.skillId);
    }),

  /**
   * Get skill scripts
   */
  scripts: publicProcedure
    .input(z.object({ skillId: z.number() }))
    .query(async ({ input }) => {
      return getSkillScripts(input.skillId);
    }),

  /**
   * Get skill templates
   */
  templates: publicProcedure
    .input(z.object({ skillId: z.number() }))
    .query(async ({ input }) => {
      return getSkillTemplates(input.skillId);
    }),

  // ============================================
  // PROTECTED ENDPOINTS (Require Auth)
  // ============================================

  /**
   * Get user's installed skills
   */
  mySkills: protectedProcedure.query(async ({ ctx }) => {
    return getUserSkills(ctx.user.id);
  }),

  /**
   * Install a skill
   */
  install: protectedProcedure
    .input(z.object({ skillId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return installSkill(ctx.user.id, input.skillId);
    }),

  /**
   * Uninstall a skill
   */
  uninstall: protectedProcedure
    .input(z.object({ skillId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return uninstallSkill(ctx.user.id, input.skillId);
    }),

  /**
   * Toggle skill enabled status
   */
  toggle: protectedProcedure
    .input(z.object({ skillId: z.number(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return toggleSkillEnabled(ctx.user.id, input.skillId, input.enabled);
    }),

  /**
   * Create a new skill
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        description: z.string().min(1),
        category: z.enum([
          "development",
          "data_analysis",
          "business",
          "communication",
          "creative",
          "productivity",
          "security",
          "other",
        ]),
        content: z.string().min(1),
        whenToUse: z.string().optional(),
        instructions: z.string().optional(),
        examples: z.string().optional(), // JSON array
        isPublic: z.boolean().default(false),
        tags: z.string().optional(), // JSON array
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createSkill({
        ...input,
        createdBy: ctx.user.id,
        isPublic: input.isPublic ? 1 : 0,
        isBuiltIn: 0,
      });
    }),

  /**
   * Update a skill (only owner can update)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        whenToUse: z.string().optional(),
        instructions: z.string().optional(),
        examples: z.string().optional(),
        isPublic: z.boolean().optional(),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const skill = await getSkillById(input.id);
      if (!skill) {
        throw new Error("Skill not found");
      }
      if (skill.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Not authorized to update this skill");
      }
      const { id, isPublic, ...data } = input;
      return updateSkill(id, {
        ...data,
        isPublic: isPublic !== undefined ? (isPublic ? 1 : 0) : undefined,
      });
    }),

  /**
   * Delete a skill (only owner can delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await getSkillById(input.id);
      if (!skill) {
        throw new Error("Skill not found");
      }
      if (skill.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Not authorized to delete this skill");
      }
      if (skill.isBuiltIn) {
        throw new Error("Cannot delete built-in skills");
      }
      return deleteSkill(input.id);
    }),

  /**
   * Add script to skill
   */
  addScript: protectedProcedure
    .input(
      z.object({
        skillId: z.number(),
        name: z.string().min(1).max(255),
        language: z.enum(["python", "typescript", "javascript", "bash", "other"]),
        content: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const skill = await getSkillById(input.skillId);
      if (!skill) {
        throw new Error("Skill not found");
      }
      if (skill.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Not authorized to modify this skill");
      }
      return addSkillScript(input);
    }),

  /**
   * Add template to skill
   */
  addTemplate: protectedProcedure
    .input(
      z.object({
        skillId: z.number(),
        name: z.string().min(1).max(255),
        content: z.string().min(1),
        format: z.enum(["markdown", "json", "yaml", "text", "other"]).default("markdown"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const skill = await getSkillById(input.skillId);
      if (!skill) {
        throw new Error("Skill not found");
      }
      if (skill.createdBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Not authorized to modify this skill");
      }
      return addSkillTemplate(input);
    }),

  /**
   * Add review for a skill
   */
  addReview: protectedProcedure
    .input(
      z.object({
        skillId: z.number(),
        rating: z.number().min(1).max(5),
        review: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return addSkillReview({
        skillId: input.skillId,
        userId: ctx.user.id,
        rating: input.rating,
        review: input.review,
      });
    }),

  /**
   * Track skill usage
   */
  trackUsage: protectedProcedure
    .input(
      z.object({
        skillId: z.number(),
        taskId: z.number().optional(),
        success: z.boolean(),
        executionTime: z.number().optional(),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return trackSkillUsage({
        skillId: input.skillId,
        userId: ctx.user.id,
        taskId: input.taskId,
        success: input.success,
        executionTime: input.executionTime,
        feedback: input.feedback,
      });
    }),

  /**
   * Load skills for agent (returns formatted skill instructions)
   */
  loadForAgent: protectedProcedure.query(async ({ ctx }) => {
    return loadSkillsForAgent(ctx.user.id);
  }),

  /**
   * Get skills for specific task type
   */
  forTaskType: protectedProcedure
    .input(z.object({ taskType: z.string() }))
    .query(async ({ ctx, input }) => {
      return getSkillsForTaskType(ctx.user.id, input.taskType);
    }),

  /**
   * Get user's created skills
   */
  myCreatedSkills: protectedProcedure.query(async ({ ctx }) => {
    const result = await listSkills({ createdBy: ctx.user.id });
    return result.skills;
  }),

  /**
   * Seed built-in skills (admin only)
   */
  seedBuiltIn: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can seed built-in skills");
    }
    return seedBuiltInSkills();
  }),

  /**
   * Get built-in skills count
   */
  builtInCount: publicProcedure.query(() => {
    return { count: getBuiltInSkillsCount() };
  }),

  // ============================================
  // IMPORT & FORK ENDPOINTS
  // ============================================

  /**
   * Import skill from GitHub URL
   */
  importFromGitHub: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await importSkillFromGitHub(input.url, ctx.user.id);
      if (!skill) {
        throw new Error("Failed to import skill from GitHub. Make sure the URL points to a valid skill repository with a SKILL.md file.");
      }
      return skill;
    }),

  /**
   * Fork a skill (create a copy for customization)
   */
  fork: protectedProcedure
    .input(z.object({
      skillId: z.number(),
      newName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const forked = await forkSkill(input.skillId, ctx.user.id, input.newName);
      if (!forked) {
        throw new Error("Failed to fork skill. Make sure the skill exists.");
      }
      return forked;
    }),

  /**
   * Fuzzy search skills
   */
  fuzzySearch: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      return searchSkillsFuzzy(input.query, input.limit);
    }),

  /**
   * Get skill recommendations for user
   */
  recommendations: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      return getSkillRecommendations(ctx.user.id, input.limit);
    }),
});
