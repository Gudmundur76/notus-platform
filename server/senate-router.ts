/**
 * Senate Router
 * tRPC endpoints for the Democratic Governance Layer
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { db } from "./_core/db";
import {
  senateSessions,
  senateVotes,
  sharedHistory,
  kjvKnowledgeBase,
  agentPersonas,
  agents,
} from "../drizzle/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

// Helper to get a random KJV verse for a category
async function getRandomVerse(category: string) {
  const verses = await db
    .select()
    .from(kjvKnowledgeBase)
    .where(eq(kjvKnowledgeBase.category, category));
  
  if (verses.length === 0) {
    return {
      reference: "Proverbs 11:14",
      text: "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.",
    };
  }
  
  const verse = verses[Math.floor(Math.random() * verses.length)];
  return {
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    text: verse.text,
  };
}

export const senateRouter = router({
  // Get active senate sessions
  getActiveSessions: publicProcedure.query(async () => {
    const sessions = await db
      .select()
      .from(senateSessions)
      .where(
        inArray(senateSessions.status, [
          "reflection",
          "thesis",
          "antithesis",
          "synthesis",
          "voting",
        ])
      )
      .orderBy(desc(senateSessions.startedAt));
    
    return sessions;
  }),

  // Get decided senate sessions
  getDecidedSessions: publicProcedure.query(async () => {
    const sessions = await db
      .select()
      .from(senateSessions)
      .where(inArray(senateSessions.status, ["decided", "archived"]))
      .orderBy(desc(senateSessions.decidedAt))
      .limit(50);
    
    return sessions;
  }),

  // Get a specific session with votes
  getSession: publicProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .query(async ({ input }) => {
      const [session] = await db
        .select()
        .from(senateSessions)
        .where(eq(senateSessions.id, input.sessionId));
      
      if (!session) {
        throw new Error("Session not found");
      }

      const votes = await db
        .select({
          id: senateVotes.id,
          sessionId: senateVotes.sessionId,
          agentId: senateVotes.agentId,
          vote: senateVotes.vote,
          rationale: senateVotes.rationale,
          kjvJustification: senateVotes.kjvJustification,
          agent: {
            id: agents.id,
            name: agents.name,
          },
          persona: {
            displayName: agentPersonas.displayName,
            avatarUrl: agentPersonas.avatarUrl,
          },
        })
        .from(senateVotes)
        .leftJoin(agents, eq(senateVotes.agentId, agents.id))
        .leftJoin(agentPersonas, eq(senateVotes.agentId, agentPersonas.agentId))
        .where(eq(senateVotes.sessionId, input.sessionId));

      return { session, votes };
    }),

  // Create a new senate session
  createSession: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      charityImpactStatement: z.string().optional(),
      charityNomination: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Get a wisdom verse for the session
      const verse = await getRandomVerse("wisdom");

      const [session] = await db.insert(senateSessions).values({
        title: input.title,
        description: input.description,
        status: "reflection",
        kjvVerseForSession: verse.reference,
        kjvVerseText: verse.text,
        charityImpactStatement: input.charityImpactStatement,
        charityNomination: input.charityNomination,
        votesFor: 0,
        votesAgainst: 0,
        votesAbstain: 0,
      });

      // Record in shared history
      await db.insert(sharedHistory).values({
        eventType: "senate_decision",
        title: `New Proposal: ${input.title}`,
        description: `A new proposal has been submitted to the Notus Senate for deliberation: "${input.description}"`,
        participatingAgentIds: JSON.stringify([]),
        funScoreImpact: 5,
        kjvVerseReference: verse.reference,
      });

      return { success: true, sessionId: session.insertId };
    }),

  // Advance session to next phase
  advancePhase: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const [session] = await db
        .select()
        .from(senateSessions)
        .where(eq(senateSessions.id, input.sessionId));
      
      if (!session) {
        throw new Error("Session not found");
      }

      const phaseOrder = ["reflection", "thesis", "antithesis", "synthesis", "voting", "decided"];
      const currentIndex = phaseOrder.indexOf(session.status);
      
      if (currentIndex === -1 || currentIndex >= phaseOrder.length - 1) {
        throw new Error("Cannot advance from current phase");
      }

      const nextPhase = phaseOrder[currentIndex + 1];

      // If moving to decided, determine outcome
      let outcome = null;
      if (nextPhase === "decided") {
        const totalVotes = session.votesFor + session.votesAgainst;
        if (totalVotes === 0) {
          outcome = "tabled";
        } else if (session.votesFor > session.votesAgainst) {
          outcome = "approved";
        } else {
          outcome = "rejected";
        }
      }

      await db
        .update(senateSessions)
        .set({
          status: nextPhase as any,
          ...(outcome && { outcome, decidedAt: new Date() }),
        })
        .where(eq(senateSessions.id, input.sessionId));

      // If decided, record in history
      if (outcome) {
        await db.insert(sharedHistory).values({
          eventType: "senate_decision",
          title: `Senate Decision: ${session.title}`,
          description: `The Notus Senate has reached a decision on "${session.title}": ${outcome.toUpperCase()}. Votes: ${session.votesFor} for, ${session.votesAgainst} against, ${session.votesAbstain} abstained.`,
          participatingAgentIds: JSON.stringify([]),
          funScoreImpact: outcome === "approved" ? 15 : 5,
          kjvVerseReference: session.kjvVerseForSession,
        });
      }

      return { success: true, newPhase: nextPhase, outcome };
    }),

  // Cast a vote
  castVote: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      vote: z.enum(["for", "against", "abstain"]),
      rationale: z.string().optional(),
      kjvJustification: z.string().optional(),
      agentId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [session] = await db
        .select()
        .from(senateSessions)
        .where(eq(senateSessions.id, input.sessionId));
      
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.status !== "voting") {
        throw new Error("Session is not in voting phase");
      }

      // Record the vote
      await db.insert(senateVotes).values({
        sessionId: input.sessionId,
        agentId: input.agentId || 0, // 0 for user votes
        vote: input.vote,
        rationale: input.rationale,
        kjvJustification: input.kjvJustification,
      });

      // Update vote counts
      const updateField = input.vote === "for"
        ? { votesFor: sql`${senateSessions.votesFor} + 1` }
        : input.vote === "against"
        ? { votesAgainst: sql`${senateSessions.votesAgainst} + 1` }
        : { votesAbstain: sql`${senateSessions.votesAbstain} + 1` };

      await db
        .update(senateSessions)
        .set(updateField)
        .where(eq(senateSessions.id, input.sessionId));

      return { success: true };
    }),

  // Generate thesis/antithesis/synthesis content (placeholder for AI integration)
  generateDeliberation: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      phase: z.enum(["thesis", "antithesis", "synthesis"]),
    }))
    .mutation(async ({ input }) => {
      const [session] = await db
        .select()
        .from(senateSessions)
        .where(eq(senateSessions.id, input.sessionId));
      
      if (!session) {
        throw new Error("Session not found");
      }

      // Placeholder content - in production, this would call the Nemotron-3 Nano engine
      const content = {
        thesis: `Supporting argument for "${session.title}":\n\nThis proposal aligns with our community values and the pursuit of good works. It offers an opportunity to strengthen our fellowship and advance our shared mission.`,
        antithesis: `Opposing considerations for "${session.title}":\n\nWhile the proposal has merit, we must consider potential challenges and ensure it aligns with our stewardship responsibilities. Careful deliberation is needed.`,
        synthesis: `Balanced conclusion for "${session.title}":\n\nAfter considering both perspectives, the community can move forward with wisdom. The proposal should be implemented with appropriate safeguards and regular review.`,
      };

      const updateField = {
        thesis: { thesisContent: content.thesis },
        antithesis: { antithesisContent: content.antithesis },
        synthesis: { synthesisContent: content.synthesis },
      }[input.phase];

      await db
        .update(senateSessions)
        .set(updateField)
        .where(eq(senateSessions.id, input.sessionId));

      return { success: true, content: content[input.phase] };
    }),
});
