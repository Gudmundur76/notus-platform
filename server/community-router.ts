/**
 * Community Router
 * tRPC endpoints for the Notus Community features
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { db } from "./_core/db";
import { agentPersonas, sharedHistory, kjvKnowledgeBase } from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const communityRouter = router({
  // Get all community members (agent personas)
  getMembers: publicProcedure.query(async () => {
    const members = await db
      .select()
      .from(agentPersonas)
      .orderBy(desc(agentPersonas.trustRating));
    return members;
  }),

  // Get community stats
  getStats: publicProcedure.query(async () => {
    const members = await db.select().from(agentPersonas);
    const totalMembers = members.length;
    const avgFunScore = members.length > 0
      ? Math.round(members.reduce((sum, m) => sum + (m.funScore || 0), 0) / members.length)
      : 0;
    const avgTrustRating = members.length > 0
      ? Math.round(members.reduce((sum, m) => sum + (m.trustRating || 0), 0) / members.length)
      : 0;
    const avgSpiritualAlignment = members.length > 0
      ? Math.round(members.reduce((sum, m) => sum + (m.spiritualAlignmentScore || 0), 0) / members.length)
      : 0;

    return {
      totalMembers,
      avgFunScore,
      avgTrustRating,
      avgSpiritualAlignment,
    };
  }),

  // Get history milestones with optional filter
  getHistory: publicProcedure
    .input(z.object({
      filter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { filter } = input;
      
      let query = db.select().from(sharedHistory);
      
      if (filter && filter !== "all") {
        query = query.where(eq(sharedHistory.eventType, filter as any));
      }
      
      const history = await query.orderBy(desc(sharedHistory.createdAt)).limit(100);
      
      return history.map(h => ({
        ...h,
        participatingAgentIds: JSON.parse(h.participatingAgentIds || "[]"),
      }));
    }),

  // Get recent history (last 10 events)
  getRecentHistory: publicProcedure.query(async () => {
    const history = await db
      .select()
      .from(sharedHistory)
      .orderBy(desc(sharedHistory.createdAt))
      .limit(10);
    
    return history.map(h => ({
      ...h,
      participatingAgentIds: JSON.parse(h.participatingAgentIds || "[]"),
    }));
  }),

  // Get agent personas
  getPersonas: publicProcedure.query(async () => {
    const personas = await db
      .select()
      .from(agentPersonas)
      .orderBy(desc(agentPersonas.funScore));
    
    return personas.map(p => ({
      ...p,
      interests: JSON.parse(p.interests || "[]"),
    }));
  }),

  // Add a history milestone
  addHistoryMilestone: protectedProcedure
    .input(z.object({
      eventType: z.enum([
        "community_fun",
        "knowledge_gained",
        "senate_decision",
        "tithe_paid",
        "charity_donation",
        "agent_joined",
        "project_completed",
        "celebration",
      ]),
      title: z.string().min(1),
      description: z.string().min(1),
      participatingAgentIds: z.array(z.number()).optional(),
      funScoreImpact: z.number().optional(),
      kjvVerseReference: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [milestone] = await db.insert(sharedHistory).values({
        eventType: input.eventType,
        title: input.title,
        description: input.description,
        participatingAgentIds: JSON.stringify(input.participatingAgentIds || []),
        funScoreImpact: input.funScoreImpact || 0,
        kjvVerseReference: input.kjvVerseReference,
      });
      
      return { success: true, id: milestone.insertId };
    }),

  // Get a random KJV verse for a given category
  getKjvVerse: publicProcedure
    .input(z.object({
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(kjvKnowledgeBase);
      
      if (input.category) {
        query = query.where(eq(kjvKnowledgeBase.category, input.category));
      }
      
      const verses = await query;
      
      if (verses.length === 0) {
        return null;
      }
      
      // Return a random verse
      const randomIndex = Math.floor(Math.random() * verses.length);
      const verse = verses[randomIndex];
      
      return {
        ...verse,
        thematicTags: JSON.parse(verse.thematicTags || "[]"),
        reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
      };
    }),
});
