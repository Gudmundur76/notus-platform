/**
 * Skills Module
 * Handles skill management, loading, and injection into agent prompts
 */

import { eq, and, desc, like, sql, or } from "drizzle-orm";
import { getDb } from "./db";
import {
  skills,
  skillScripts,
  skillTemplates,
  userSkills,
  skillUsage,
  skillReviews,
  type Skill,
  type InsertSkill,
  type SkillScript,
  type InsertSkillScript,
  type SkillTemplate,
  type InsertSkillTemplate,
  type UserSkill,
  type SkillUsage,
  type SkillReview,
} from "../drizzle/schema";

// ============================================
// SKILL CRUD OPERATIONS
// ============================================

/**
 * Create a new skill
 */
export async function createSkill(data: InsertSkill): Promise<Skill> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(skills).values(data);
  const [skill] = await db.select().from(skills).where(eq(skills.id, result.insertId));
  return skill;
}

/**
 * Get skill by ID
 */
export async function getSkillById(id: number): Promise<Skill | null> {
  const db = await getDb();
  if (!db) return null;
  const [skill] = await db.select().from(skills).where(eq(skills.id, id));
  return skill || null;
}

/**
 * Get skill by slug
 */
export async function getSkillBySlug(slug: string): Promise<Skill | null> {
  const db = await getDb();
  if (!db) return null;
  const [skill] = await db.select().from(skills).where(eq(skills.slug, slug));
  return skill || null;
}

/**
 * Update a skill
 */
export async function updateSkill(id: number, data: Partial<InsertSkill>): Promise<Skill | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(skills).set(data).where(eq(skills.id, id));
  return getSkillById(id);
}

/**
 * Delete a skill
 */
export async function deleteSkill(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Delete related records first
  await db.delete(skillScripts).where(eq(skillScripts.skillId, id));
  await db.delete(skillTemplates).where(eq(skillTemplates.skillId, id));
  await db.delete(userSkills).where(eq(userSkills.skillId, id));
  await db.delete(skillUsage).where(eq(skillUsage.skillId, id));
  await db.delete(skillReviews).where(eq(skillReviews.skillId, id));
  // Delete the skill
  const result = await db.delete(skills).where(eq(skills.id, id));
  return result[0].affectedRows > 0;
}

/**
 * List all skills with filtering
 */
export async function listSkills(options: {
  category?: string;
  search?: string;
  isPublic?: boolean;
  isBuiltIn?: boolean;
  createdBy?: number;
  limit?: number;
  offset?: number;
}): Promise<{ skills: Skill[]; total: number }> {
  const db = await getDb();
  if (!db) return { skills: [], total: 0 };
  const conditions = [];

  if (options.category) {
    conditions.push(eq(skills.category, options.category as any));
  }
  if (options.search) {
    conditions.push(
      or(
        like(skills.name, `%${options.search}%`),
        like(skills.description, `%${options.search}%`)
      )
    );
  }
  if (options.isPublic !== undefined) {
    conditions.push(eq(skills.isPublic, options.isPublic ? 1 : 0));
  }
  if (options.isBuiltIn !== undefined) {
    conditions.push(eq(skills.isBuiltIn, options.isBuiltIn ? 1 : 0));
  }
  if (options.createdBy) {
    conditions.push(eq(skills.createdBy, options.createdBy));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(skills)
    .where(whereClause);

  const skillList = await db
    .select()
    .from(skills)
    .where(whereClause)
    .orderBy(desc(skills.installCount))
    .limit(options.limit || 50)
    .offset(options.offset || 0);

  return { skills: skillList, total: countResult.count };
}

/**
 * Get popular skills
 */
export async function getPopularSkills(limit: number = 10): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(skills)
    .where(eq(skills.isPublic, 1))
    .orderBy(desc(skills.installCount))
    .limit(limit);
}

/**
 * Get skills by category
 */
export async function getSkillsByCategory(category: string): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(skills)
    .where(and(eq(skills.category, category as any), eq(skills.isPublic, 1)))
    .orderBy(desc(skills.rating));
}

// ============================================
// SKILL SCRIPTS & TEMPLATES
// ============================================

/**
 * Add script to skill
 */
export async function addSkillScript(data: InsertSkillScript): Promise<SkillScript> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(skillScripts).values(data);
  const [script] = await db.select().from(skillScripts).where(eq(skillScripts.id, result.insertId));
  return script;
}

/**
 * Get scripts for a skill
 */
export async function getSkillScripts(skillId: number): Promise<SkillScript[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(skillScripts).where(eq(skillScripts.skillId, skillId));
}

/**
 * Add template to skill
 */
export async function addSkillTemplate(data: InsertSkillTemplate): Promise<SkillTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(skillTemplates).values(data);
  const [template] = await db.select().from(skillTemplates).where(eq(skillTemplates.id, result.insertId));
  return template;
}

/**
 * Get templates for a skill
 */
export async function getSkillTemplates(skillId: number): Promise<SkillTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(skillTemplates).where(eq(skillTemplates.skillId, skillId));
}

// ============================================
// USER SKILL MANAGEMENT
// ============================================

/**
 * Install a skill for a user
 */
export async function installSkill(userId: number, skillId: number): Promise<UserSkill> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already installed
  const [existing] = await db
    .select()
    .from(userSkills)
    .where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)));
  
  if (existing) {
    // Re-enable if disabled
    await db
      .update(userSkills)
      .set({ isEnabled: 1 })
      .where(eq(userSkills.id, existing.id));
    return { ...existing, isEnabled: 1 };
  }

  // Install new
  const [result] = await db.insert(userSkills).values({ userId, skillId });
  
  // Increment install count
  await db
    .update(skills)
    .set({ installCount: sql`${skills.installCount} + 1` })
    .where(eq(skills.id, skillId));

  const [userSkill] = await db.select().from(userSkills).where(eq(userSkills.id, result.insertId));
  return userSkill;
}

/**
 * Uninstall a skill for a user
 */
export async function uninstallSkill(userId: number, skillId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .delete(userSkills)
    .where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)));
  
  if (result[0].affectedRows > 0) {
    // Decrement install count
    await db
      .update(skills)
      .set({ installCount: sql`GREATEST(${skills.installCount} - 1, 0)` })
      .where(eq(skills.id, skillId));
    return true;
  }
  return false;
}

/**
 * Get user's installed skills
 */
export async function getUserSkills(userId: number): Promise<(UserSkill & { skill: Skill })[]> {
  const db = await getDb();
  if (!db) return [];
  const userSkillList = await db
    .select()
    .from(userSkills)
    .where(and(eq(userSkills.userId, userId), eq(userSkills.isEnabled, 1)));

  const result = [];
  for (const us of userSkillList) {
    const skill = await getSkillById(us.skillId);
    if (skill) {
      result.push({ ...us, skill });
    }
  }
  return result;
}

/**
 * Toggle skill enabled status
 */
export async function toggleSkillEnabled(userId: number, skillId: number, enabled: boolean): Promise<UserSkill | null> {
  const db = await getDb();
  if (!db) return null;
  await db
    .update(userSkills)
    .set({ isEnabled: enabled ? 1 : 0 })
    .where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)));
  const [updated] = await db
    .select()
    .from(userSkills)
    .where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)));
  return updated || null;
}

// ============================================
// SKILL USAGE TRACKING
// ============================================

/**
 * Track skill usage
 */
export async function trackSkillUsage(data: {
  skillId: number;
  userId: number;
  taskId?: number;
  success: boolean;
  executionTime?: number;
  feedback?: string;
}): Promise<SkillUsage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(skillUsage).values({
    skillId: data.skillId,
    userId: data.userId,
    taskId: data.taskId,
    success: data.success ? 1 : 0,
    executionTime: data.executionTime,
    feedback: data.feedback,
  });
  const [usage] = await db.select().from(skillUsage).where(eq(skillUsage.id, result.insertId));
  return usage;
}

/**
 * Get skill usage stats
 */
export async function getSkillUsageStats(skillId: number): Promise<{
  totalUses: number;
  successRate: number;
  avgExecutionTime: number;
}> {
  const db = await getDb();
  if (!db) return { totalUses: 0, successRate: 0, avgExecutionTime: 0 };
  const [stats] = await db
    .select({
      totalUses: sql<number>`count(*)`,
      successCount: sql<number>`sum(${skillUsage.success})`,
      avgTime: sql<number>`avg(${skillUsage.executionTime})`,
    })
    .from(skillUsage)
    .where(eq(skillUsage.skillId, skillId));

  return {
    totalUses: stats.totalUses || 0,
    successRate: stats.totalUses > 0 ? (stats.successCount / stats.totalUses) * 100 : 0,
    avgExecutionTime: stats.avgTime || 0,
  };
}

// ============================================
// SKILL REVIEWS & RATINGS
// ============================================

/**
 * Add or update a review
 */
export async function addSkillReview(data: {
  skillId: number;
  userId: number;
  rating: number;
  review?: string;
}): Promise<SkillReview> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check for existing review
  const [existing] = await db
    .select()
    .from(skillReviews)
    .where(and(eq(skillReviews.skillId, data.skillId), eq(skillReviews.userId, data.userId)));

  if (existing) {
    await db
      .update(skillReviews)
      .set({ rating: data.rating, review: data.review })
      .where(eq(skillReviews.id, existing.id));
    
    // Update skill average rating
    await updateSkillRating(data.skillId);
    
    const [updated] = await db.select().from(skillReviews).where(eq(skillReviews.id, existing.id));
    return updated;
  }

  const [result] = await db.insert(skillReviews).values({
    skillId: data.skillId,
    userId: data.userId,
    rating: data.rating,
    review: data.review,
  });

  // Update skill average rating
  await updateSkillRating(data.skillId);

  const [review] = await db.select().from(skillReviews).where(eq(skillReviews.id, result.insertId));
  return review;
}

/**
 * Update skill's average rating
 */
async function updateSkillRating(skillId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const [stats] = await db
    .select({
      avgRating: sql<number>`avg(${skillReviews.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(skillReviews)
    .where(eq(skillReviews.skillId, skillId));

  await db
    .update(skills)
    .set({
      rating: Math.round((stats.avgRating || 0) * 10), // Store as 0-50 for precision
      ratingCount: stats.count || 0,
    })
    .where(eq(skills.id, skillId));
}

/**
 * Get reviews for a skill
 */
export async function getSkillReviews(skillId: number): Promise<SkillReview[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(skillReviews)
    .where(eq(skillReviews.skillId, skillId))
    .orderBy(desc(skillReviews.createdAt));
}

// ============================================
// SKILLS LOADER - AGENT INTEGRATION
// ============================================

/**
 * Load skills for injection into agent prompt
 * Returns formatted skill instructions for the agent
 */
export async function loadSkillsForAgent(userId: number): Promise<string> {
  const userSkillList = await getUserSkills(userId);
  
  if (userSkillList.length === 0) {
    return "";
  }

  const skillInstructions: string[] = [];
  
  for (const { skill } of userSkillList) {
    const scripts = await getSkillScripts(skill.id);
    const templates = await getSkillTemplates(skill.id);
    
    let skillBlock = `
## Skill: ${skill.name}
**Category:** ${skill.category}
**Description:** ${skill.description}

### When to Use
${skill.whenToUse || "Use this skill when the task matches its description."}

### Instructions
${skill.instructions || skill.content}
`;

    if (skill.examples) {
      try {
        const examples = JSON.parse(skill.examples);
        if (Array.isArray(examples) && examples.length > 0) {
          skillBlock += `
### Examples
${examples.map((ex: string, i: number) => `${i + 1}. ${ex}`).join("\n")}
`;
        }
      } catch {
        // Ignore parse errors
      }
    }

    if (scripts.length > 0) {
      skillBlock += `
### Available Scripts
${scripts.map(s => `- **${s.name}** (${s.language}): ${s.description || "Helper script"}`).join("\n")}
`;
    }

    if (templates.length > 0) {
      skillBlock += `
### Available Templates
${templates.map(t => `- **${t.name}** (${t.format}): ${t.description || "Document template"}`).join("\n")}
`;
    }

    skillInstructions.push(skillBlock);
  }

  return `
# Active Skills

You have the following skills enabled. Use them when appropriate for the task:

${skillInstructions.join("\n---\n")}
`;
}

/**
 * Get skill context for a specific task type
 */
export async function getSkillsForTaskType(
  userId: number,
  taskType: string
): Promise<Skill[]> {
  const userSkillList = await getUserSkills(userId);
  
  // Map task types to skill categories
  const categoryMap: Record<string, string[]> = {
    general: ["productivity", "communication", "other"],
    slides: ["creative", "business", "communication"],
    website: ["development", "creative"],
    app: ["development", "productivity"],
    design: ["creative", "productivity"],
    computer_control: ["development", "productivity", "security"],
  };

  const relevantCategories = categoryMap[taskType] || ["other"];
  
  return userSkillList
    .filter(({ skill }) => relevantCategories.includes(skill.category))
    .map(({ skill }) => skill);
}

/**
 * Suggest skills based on task description
 */
export async function suggestSkillsForTask(
  taskDescription: string
): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Simple keyword matching for suggestions
  const keywords = taskDescription.toLowerCase().split(/\s+/);
  
  const allPublicSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.isPublic, 1));

  // Score skills based on keyword matches
  const scoredSkills = allPublicSkills.map(skill => {
    const searchText = `${skill.name} ${skill.description} ${skill.tags || ""}`.toLowerCase();
    const score = keywords.reduce((acc, keyword) => {
      return acc + (searchText.includes(keyword) ? 1 : 0);
    }, 0);
    return { skill, score };
  });

  // Return top 5 matching skills
  return scoredSkills
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.skill);
}

/**
 * Get all skill categories with counts
 */
export async function getSkillCategories(): Promise<{ category: string; count: number }[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      category: skills.category,
      count: sql<number>`count(*)`,
    })
    .from(skills)
    .where(eq(skills.isPublic, 1))
    .groupBy(skills.category);
  
  return result;
}


// ============================================
// SKILL IMPORT & VERSIONING
// ============================================

/**
 * Import skill from GitHub URL
 */
export async function importSkillFromGitHub(
  githubUrl: string,
  userId: number
): Promise<Skill | null> {
  try {
    const rawUrl = githubUrl
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/")
      .replace("/tree/", "/");
    
    const skillMdUrl = rawUrl.endsWith("/") 
      ? `${rawUrl}SKILL.md` 
      : `${rawUrl}/SKILL.md`;
    
    const response = await fetch(skillMdUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch skill: ${response.statusText}`);
    }
    
    const content = await response.text();
    const parsed = parseSkillMarkdown(content);
    
    const slug = parsed.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Date.now();
    
    const validCategories = ["development", "data_analysis", "business", "communication", "creative", "productivity", "security", "other"] as const;
    const category = validCategories.includes(parsed.category as any) 
      ? (parsed.category as typeof validCategories[number])
      : "other";
    
    const skill = await createSkill({
      name: parsed.name,
      slug,
      description: parsed.description,
      category,
      content: content,
      whenToUse: parsed.whenToUse,
      instructions: parsed.instructions,
      examples: JSON.stringify(parsed.examples || []),
      tags: JSON.stringify(parsed.tags || []),
      isPublic: 0,
      isBuiltIn: 0,
      createdBy: userId,
      sourceUrl: githubUrl,
      version: "1.0.0",
    });
    
    return skill;
  } catch (error) {
    console.error("Failed to import skill from GitHub:", error);
    return null;
  }
}

function parseSkillMarkdown(content: string): {
  name: string;
  description: string;
  category?: string;
  whenToUse?: string;
  instructions?: string;
  examples?: string[];
  tags?: string[];
} {
  const lines = content.split("\n");
  let name = "Imported Skill";
  let description = "";
  let category = "other";
  let whenToUse = "";
  let instructions = "";
  const examples: string[] = [];
  const tags: string[] = [];
  
  let currentSection = "";
  let sectionContent: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith("# ")) {
      name = line.replace("# ", "").trim();
    } else if (line.startsWith("## ")) {
      if (currentSection && sectionContent.length > 0) {
        const text = sectionContent.join("\n").trim();
        if (currentSection.toLowerCase().includes("when to use")) {
          whenToUse = text;
        } else if (currentSection.toLowerCase().includes("instruction")) {
          instructions = text;
        }
      }
      currentSection = line.replace("## ", "").trim();
      sectionContent = [];
    } else if (line.includes("Category:")) {
      category = line.replace(/\*\*Category:\*\*|Category:/i, "").trim().toLowerCase();
    } else if (line.includes("Tags:")) {
      const tagStr = line.replace(/\*\*Tags:\*\*|Tags:/i, "").trim();
      tagStr.split(",").forEach(t => {
        const cleaned = t.trim().replace(/^#/, "");
        if (cleaned) tags.push(cleaned);
      });
    } else if (currentSection) {
      sectionContent.push(line);
    } else if (!description && line.trim() && !line.startsWith("#")) {
      description = line.trim();
    }
  }
  
  return { name, description, category, whenToUse, instructions, examples, tags };
}

/**
 * Fork a skill (create a copy for customization)
 */
export async function forkSkill(
  skillId: number,
  userId: number,
  newName?: string
): Promise<Skill | null> {
  const original = await getSkillById(skillId);
  if (!original) return null;
  
  const slug = `${original.slug}-fork-${Date.now()}`;
  const name = newName || `${original.name} (Fork)`;
  
  const forked = await createSkill({
    name,
    slug,
    description: original.description,
    category: original.category,
    content: original.content,
    whenToUse: original.whenToUse,
    instructions: original.instructions,
    examples: original.examples,
    tags: original.tags,
    isPublic: 0,
    isBuiltIn: 0,
    createdBy: userId,
    forkedFrom: skillId,
    version: "1.0.0",
  });
  
  const scripts = await getSkillScripts(skillId);
  for (const script of scripts) {
    await addSkillScript({
      skillId: forked.id,
      name: script.name,
      language: script.language,
      content: script.content,
      description: script.description,
    });
  }
  
  const templates = await getSkillTemplates(skillId);
  for (const template of templates) {
    await addSkillTemplate({
      skillId: forked.id,
      name: template.name,
      format: template.format,
      content: template.content,
      description: template.description,
    });
  }
  
  return forked;
}

/**
 * Search skills with fuzzy matching
 */
export async function searchSkillsFuzzy(
  query: string,
  limit: number = 20
): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];
  
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  const allSkills = await db
    .select()
    .from(skills)
    .where(eq(skills.isPublic, 1));
  
  const scored = allSkills.map(skill => {
    let score = 0;
    const searchText = `${skill.name} ${skill.description} ${skill.tags || ""} ${skill.category}`.toLowerCase();
    
    for (const term of searchTerms) {
      if (searchText.includes(term)) {
        score += 10;
      }
      for (const word of searchText.split(/\s+/)) {
        if (word.startsWith(term) || term.startsWith(word)) {
          score += 5;
        }
      }
    }
    
    return { skill, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.skill);
}

/**
 * Get skill recommendations based on user's installed skills
 */
export async function getSkillRecommendations(
  userId: number,
  limit: number = 5
): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];
  
  const installed = await getUserSkills(userId);
  const installedIds = new Set(installed.map(us => us.skillId));
  const installedCategories = new Set(installed.map(us => us.skill.category));
  
  const allPublic = await db
    .select()
    .from(skills)
    .where(eq(skills.isPublic, 1))
    .orderBy(desc(skills.installCount));
  
  const recommendations = allPublic.filter(s => !installedIds.has(s.id));
  
  const scored = recommendations.map(skill => ({
    skill,
    score: installedCategories.has(skill.category) ? 10 : 5,
  }));
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.skill);
}
