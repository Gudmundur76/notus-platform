import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createAgent,
  createAgentPair,
  runDebate,
  runResearch,
  getAllAgents,
  getAgentPairsByDomain,
  getKnowledgeByDomain,
  searchKnowledge,
  getDialogueHistory,
} from "./mirror-agents";
import { seedAgents } from "./seed-agents";
import {
  initializeScheduledLearning,
  getScheduledJobs,
  setJobEnabled,
  triggerJob,
} from "./scheduled-learning";
import {
  aggregateKnowledgeAcrossDomains,
  getKnowledgeStats,
  runContinuousLearning,
  getTopInsightsByDomain,
  getKnowledgeEvolution,
} from "./knowledge-core";

export const mirrorAgentRouter = router({
  // Create a new agent
  createAgent: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        domain: z.string(),
        type: z.enum(["primary", "mirror"]),
        systemPrompt: z.string(),
        capabilities: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const agent = await createAgent({
        name: input.name,
        domain: input.domain,
        type: input.type,
        systemPrompt: input.systemPrompt,
        capabilities: input.capabilities ? JSON.stringify(input.capabilities) : undefined,
        status: "active",
      });
      return agent;
    }),

  // Create an agent pair
  createPair: protectedProcedure
    .input(
      z.object({
        primaryAgentId: z.number(),
        mirrorAgentId: z.number(),
        domain: z.string(),
        pairingStrategy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const pairId = await createAgentPair(
        input.primaryAgentId,
        input.mirrorAgentId,
        input.domain,
        input.pairingStrategy
      );
      return { pairId };
    }),

  // Run a debate
  runDebate: protectedProcedure
    .input(
      z.object({
        agentPairId: z.number(),
        topic: z.string(),
        rounds: z.number().min(1).max(10).default(3),
      })
    )
    .mutation(async ({ input }) => {
      const result = await runDebate(input.agentPairId, input.topic, input.rounds);
      return result;
    }),

  // Run research
  runResearch: protectedProcedure
    .input(
      z.object({
        agentPairId: z.number(),
        researchQuestion: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await runResearch(input.agentPairId, input.researchQuestion);
      return result;
    }),

  // Get all agents
  listAgents: protectedProcedure.query(async () => {
    const agents = await getAllAgents();
    return agents.map((agent) => ({
      ...agent,
      capabilities: agent.capabilities ? JSON.parse(agent.capabilities) : [],
    }));
  }),

  // Get agent pairs by domain
  getPairsByDomain: protectedProcedure.input(z.object({ domain: z.string() })).query(async ({ input }) => {
    return await getAgentPairsByDomain(input.domain);
  }),

  // Get knowledge by domain
  getKnowledgeByDomain: protectedProcedure.input(z.object({ domain: z.string() })).query(async ({ input }) => {
    const knowledge = await getKnowledgeByDomain(input.domain);
    return knowledge.map((k) => ({
      ...k,
      sourceDialogueIds: k.sourceDialogueIds ? JSON.parse(k.sourceDialogueIds) : [],
      contributingAgents: k.contributingAgents ? JSON.parse(k.contributingAgents) : [],
      tags: k.tags ? JSON.parse(k.tags) : [],
    }));
  }),

  // Search knowledge
  searchKnowledge: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
    const results = await searchKnowledge(input.query);
    return results.map((k) => ({
      ...k,
      sourceDialogueIds: k.sourceDialogueIds ? JSON.parse(k.sourceDialogueIds) : [],
      contributingAgents: k.contributingAgents ? JSON.parse(k.contributingAgents) : [],
      tags: k.tags ? JSON.parse(k.tags) : [],
    }));
  }),

  // Get dialogue history
  getDialogueHistory: protectedProcedure.input(z.object({ dialogueId: z.number() })).query(async ({ input }) => {
    const messages = await getDialogueHistory(input.dialogueId);
    return messages.map((msg) => ({
      ...msg,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : {},
    }));
  }),

  // Knowledge Core endpoints
  aggregateKnowledge: protectedProcedure
    .input(z.object({ domains: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      return await aggregateKnowledgeAcrossDomains(input.domains);
    }),

  getKnowledgeStats: protectedProcedure.query(async () => {
    return await getKnowledgeStats();
  }),

  runContinuousLearning: protectedProcedure.mutation(async () => {
    return await runContinuousLearning();
  }),

  getTopInsights: protectedProcedure
    .input(z.object({ domain: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getTopInsightsByDomain(input.domain, input.limit);
    }),

  getKnowledgeEvolution: protectedProcedure
    .input(z.object({ knowledgeId: z.number() }))
    .query(async ({ input }) => {
      return await getKnowledgeEvolution(input.knowledgeId);
    }),

  // Seed initial agents
  seedAgents: protectedProcedure.mutation(async () => {
    return await seedAgents();
  }),

  // Scheduled learning management
  getScheduledJobs: protectedProcedure.query(async () => {
    return getScheduledJobs();
  }),

  setJobEnabled: protectedProcedure
    .input(z.object({ name: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      setJobEnabled(input.name, input.enabled);
      return { success: true };
    }),

  triggerJob: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      await triggerJob(input.name);
      return { success: true };
    }),
});
