import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Mirror Agent System", () => {
  it("should create a primary agent", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agent = await caller.mirrorAgents.createAgent({
      name: "Biotech Primary Agent",
      domain: "biotech",
      type: "primary",
      systemPrompt: "You are an expert in biotechnology with deep knowledge of CRISPR, gene editing, and synthetic biology.",
    });

    expect(agent).toBeDefined();
    expect(agent.name).toBe("Biotech Primary Agent");
    expect(agent.domain).toBe("biotech");
    expect(agent.type).toBe("primary");
    expect(agent.status).toBe("active");
  });

  it("should create a mirror agent", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agent = await caller.mirrorAgents.createAgent({
      name: "Biotech Mirror Agent",
      domain: "biotech",
      type: "mirror",
      systemPrompt: "You are a critical thinker who challenges assumptions and provides alternative perspectives on biotechnology.",
    });

    expect(agent).toBeDefined();
    expect(agent.type).toBe("mirror");
  });

  it("should list all agents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.mirrorAgents.listAgents();

    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
  });

  it("should get knowledge statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.mirrorAgents.getKnowledgeStats();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalInsights");
    expect(stats).toHaveProperty("byDomain");
    expect(stats).toHaveProperty("averageConfidence");
    expect(stats).toHaveProperty("topDomains");
    expect(Array.isArray(stats.topDomains)).toBe(true);
  });

  it("should search knowledge", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.mirrorAgents.searchKnowledge({
      query: "biotech",
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("should get knowledge by domain", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const knowledge = await caller.mirrorAgents.getKnowledgeByDomain({
      domain: "biotech",
    });

    expect(Array.isArray(knowledge)).toBe(true);
  });
});

describe("Knowledge Core", () => {
  it("should aggregate knowledge across domains", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mirrorAgents.aggregateKnowledge({
      domains: ["biotech", "finance"],
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("connections");
    expect(result).toHaveProperty("crossDomainInsights");
    expect(Array.isArray(result.connections)).toBe(true);
  }, 15000);

  it("should get top insights by domain", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const insights = await caller.mirrorAgents.getTopInsights({
      domain: "biotech",
      limit: 5,
    });

    expect(Array.isArray(insights)).toBe(true);
  });

  it("should run continuous learning", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mirrorAgents.runContinuousLearning();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("newInsights");
    expect(result).toHaveProperty("updatedInsights");
    expect(result).toHaveProperty("crossDomainConnections");
    expect(typeof result.newInsights).toBe("number");
  }, 15000);
});
