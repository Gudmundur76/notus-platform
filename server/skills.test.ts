/**
 * Skills System Tests
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getBuiltInSkillsCount, builtInSkillsData } from "./builtInSkills";
import {
  createSkill,
  getSkillById,
  getSkillBySlug,
  deleteSkill,
  listSkills,
  addSkillScript,
  getSkillScripts,
  addSkillTemplate,
  getSkillTemplates,
  installSkill,
  uninstallSkill,
  getUserSkills,
  toggleSkillEnabled,
  loadSkillsForAgent,
  getSkillCategories,
  suggestSkillsForTask,
} from "./skills";

describe("Skills System", () => {
  let testSkillId: number;
  const testUserId = 999999; // Test user ID

  describe("Built-in Skills Data", () => {
    it("should have built-in skills defined", () => {
      const count = getBuiltInSkillsCount();
      expect(count).toBeGreaterThan(0);
    });

    it("should have valid skill data structure", () => {
      for (const skill of builtInSkillsData) {
        expect(skill.name).toBeTruthy();
        expect(skill.slug).toBeTruthy();
        expect(skill.description).toBeTruthy();
        expect(skill.category).toBeTruthy();
        expect(skill.content).toBeTruthy();
        expect(skill.whenToUse).toBeTruthy();
        expect(skill.instructions).toBeTruthy();
        expect(Array.isArray(skill.examples)).toBe(true);
        expect(Array.isArray(skill.tags)).toBe(true);
      }
    });

    it("should have unique slugs for all built-in skills", () => {
      const slugs = builtInSkillsData.map(s => s.slug);
      const uniqueSlugs = new Set(slugs);
      expect(slugs.length).toBe(uniqueSlugs.size);
    });

    it("should have valid categories", () => {
      const validCategories = [
        "development",
        "data_analysis",
        "business",
        "communication",
        "creative",
        "productivity",
        "security",
        "other",
      ];
      for (const skill of builtInSkillsData) {
        expect(validCategories).toContain(skill.category);
      }
    });
  });

  describe("Skill CRUD Operations", () => {
    it("should create a new skill", async () => {
      const skill = await createSkill({
        name: "Test Skill",
        slug: "test-skill-" + Date.now(),
        description: "A test skill for unit testing",
        category: "development",
        content: "Test content for the skill",
        whenToUse: "Use when testing",
        instructions: "Follow these test instructions",
        examples: JSON.stringify(["Example 1", "Example 2"]),
        tags: JSON.stringify(["test", "unit-test"]),
        isPublic: 1,
        isBuiltIn: 0,
        createdBy: testUserId,
      });

      expect(skill).toBeTruthy();
      expect(skill.id).toBeGreaterThan(0);
      expect(skill.name).toBe("Test Skill");
      testSkillId = skill.id;
    });

    it("should get skill by ID", async () => {
      const skill = await getSkillById(testSkillId);
      expect(skill).toBeTruthy();
      expect(skill?.id).toBe(testSkillId);
      expect(skill?.name).toBe("Test Skill");
    });

    it("should list skills", async () => {
      const result = await listSkills({ limit: 10 });
      expect(result.skills).toBeTruthy();
      expect(Array.isArray(result.skills)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it("should filter skills by category", async () => {
      const result = await listSkills({ category: "development", limit: 10 });
      for (const skill of result.skills) {
        expect(skill.category).toBe("development");
      }
    });
  });

  describe("Skill Scripts", () => {
    it("should add a script to a skill", async () => {
      const script = await addSkillScript({
        skillId: testSkillId,
        name: "test-script.py",
        language: "python",
        content: "print('Hello, World!')",
        description: "A test Python script",
      });

      expect(script).toBeTruthy();
      expect(script.skillId).toBe(testSkillId);
      expect(script.language).toBe("python");
    });

    it("should get scripts for a skill", async () => {
      const scripts = await getSkillScripts(testSkillId);
      expect(Array.isArray(scripts)).toBe(true);
      expect(scripts.length).toBeGreaterThan(0);
      expect(scripts[0].name).toBe("test-script.py");
    });
  });

  describe("Skill Templates", () => {
    it("should add a template to a skill", async () => {
      const template = await addSkillTemplate({
        skillId: testSkillId,
        name: "test-template.md",
        format: "markdown",
        content: "# Test Template\n\nThis is a test.",
        description: "A test Markdown template",
      });

      expect(template).toBeTruthy();
      expect(template.skillId).toBe(testSkillId);
      expect(template.format).toBe("markdown");
    });

    it("should get templates for a skill", async () => {
      const templates = await getSkillTemplates(testSkillId);
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].name).toBe("test-template.md");
    });
  });

  describe("User Skills", () => {
    it("should install a skill for a user", async () => {
      const userSkill = await installSkill(testUserId, testSkillId);
      expect(userSkill).toBeTruthy();
      expect(userSkill.userId).toBe(testUserId);
      expect(userSkill.skillId).toBe(testSkillId);
      expect(userSkill.isEnabled).toBe(1);
    });

    it("should get user's installed skills", async () => {
      const skills = await getUserSkills(testUserId);
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills.some(s => s.skillId === testSkillId)).toBe(true);
    });

    it("should toggle skill enabled state", async () => {
      const result = await toggleSkillEnabled(testUserId, testSkillId, false);
      expect(result).toBeTruthy();
      expect(result?.isEnabled).toBe(0);

      // Toggle back
      const result2 = await toggleSkillEnabled(testUserId, testSkillId, true);
      expect(result2?.isEnabled).toBe(1);
    });

    it("should uninstall a skill", async () => {
      const result = await uninstallSkill(testUserId, testSkillId);
      expect(result).toBe(true);

      const skills = await getUserSkills(testUserId);
      expect(skills.some(s => s.skillId === testSkillId)).toBe(false);
    });
  });

  describe("Skill Loading for Agent", () => {
    beforeAll(async () => {
      // Re-install the skill for this test
      await installSkill(testUserId, testSkillId);
    });

    it("should load skills for agent prompt", async () => {
      const prompt = await loadSkillsForAgent(testUserId);
      expect(prompt).toBeTruthy();
      expect(prompt).toContain("Active Skills");
      expect(prompt).toContain("Test Skill");
    });

    it("should return empty string for user with no skills", async () => {
      const prompt = await loadSkillsForAgent(888888); // Non-existent user
      expect(prompt).toBe("");
    });
  });

  describe("Skill Categories", () => {
    it("should get skill categories with counts", async () => {
      const categories = await getSkillCategories();
      expect(Array.isArray(categories)).toBe(true);
      for (const cat of categories) {
        expect(cat.category).toBeTruthy();
        expect(typeof cat.count).toBe("number");
      }
    });
  });

  describe("Skill Suggestions", () => {
    it("should suggest skills based on task description", async () => {
      const suggestions = await suggestSkillsForTask("build a web application");
      expect(Array.isArray(suggestions)).toBe(true);
      // May or may not have suggestions depending on seeded data
    });
  });

  // Cleanup
  afterAll(async () => {
    // Uninstall and delete test skill
    await uninstallSkill(testUserId, testSkillId);
    await deleteSkill(testSkillId);
  });
});
