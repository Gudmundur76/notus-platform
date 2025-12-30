/**
 * Democratic Governance Layer (DGL) - The Notus Senate
 * Implements democratic deliberation and voting for the Notus Community
 */

import { db } from "./_core/db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import {
  senateSessions,
  senateVotes,
  communityProjects,
  agents,
  agentPersonas,
  sharedHistory,
  kjvKnowledgeBase,
} from "../drizzle/schema";
import { getRelevantKJVVerse, recordCommunityMilestone } from "./social-context";

/**
 * Senate Session Phases
 */
export type SenatePhase = "reflection" | "thesis" | "antithesis" | "synthesis" | "voting" | "decided" | "archived";

/**
 * Create a new Senate session for community deliberation
 */
export async function createSenateSession(
  title: string,
  description: string,
  proposingAgentId: number,
  charityImpactStatement?: string,
  charityNomination?: string
): Promise<number> {
  // Get a guiding KJV verse for the session
  const kjvVerse = await getRelevantKJVVerse(description);
  
  const [result] = await db.insert(senateSessions).values({
    title,
    description,
    status: "reflection",
    kjvVerseForSession: kjvVerse?.reference || "Proverbs 11:14",
    kjvVerseText: kjvVerse?.text || "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.",
    proposingAgentId,
    charityImpactStatement,
    charityNomination,
  });

  const sessionId = result.insertId;

  // Record in community history
  await recordCommunityMilestone(
    "senate_decision",
    `Senate Session Opened: ${title}`,
    `A new deliberation has begun: ${description.substring(0, 100)}...`,
    [proposingAgentId],
    60,
    kjvVerse?.reference
  );

  return sessionId;
}

/**
 * Advance the Senate session to the next phase
 */
export async function advanceSenatePhase(
  sessionId: number,
  content?: string
): Promise<{ success: boolean; newPhase: SenatePhase; message: string }> {
  const [session] = await db
    .select()
    .from(senateSessions)
    .where(eq(senateSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return { success: false, newPhase: "reflection", message: "Session not found" };
  }

  const phaseOrder: SenatePhase[] = ["reflection", "thesis", "antithesis", "synthesis", "voting", "decided"];
  const currentIndex = phaseOrder.indexOf(session.status as SenatePhase);
  
  if (currentIndex === -1 || currentIndex >= phaseOrder.length - 1) {
    return { success: false, newPhase: session.status as SenatePhase, message: "Cannot advance further" };
  }

  const newPhase = phaseOrder[currentIndex + 1];
  const updateData: Record<string, any> = { status: newPhase };

  // Store content based on phase
  switch (newPhase) {
    case "thesis":
      if (content) updateData.thesisContent = content;
      break;
    case "antithesis":
      if (content) updateData.antithesisContent = content;
      break;
    case "synthesis":
      if (content) updateData.synthesisContent = content;
      break;
    case "decided":
      updateData.decidedAt = new Date();
      break;
  }

  await db
    .update(senateSessions)
    .set(updateData)
    .where(eq(senateSessions.id, sessionId));

  return { success: true, newPhase, message: `Session advanced to ${newPhase} phase` };
}

/**
 * Generate thesis for a Senate session using LLM
 */
export async function generateThesis(sessionId: number): Promise<string> {
  const [session] = await db
    .select()
    .from(senateSessions)
    .where(eq(senateSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a member of the Notus Senate, a democratic body in a Christian digital society.
Your task is to present the THESIS (supporting argument) for the proposal.

Guiding Scripture: "${session.kjvVerseText}" — ${session.kjvVerseForSession}

Present a well-reasoned argument IN FAVOR of the proposal, considering:
1. How it aligns with Christian values and the KJV Bible
2. The potential Good Works it could produce
3. The benefits to the community and humanity
4. Stewardship of resources

Be thoughtful, respectful, and grounded in faith.`,
      },
      {
        role: "user",
        content: `Proposal: ${session.title}\n\nDescription: ${session.description}\n\nCharity Impact: ${session.charityImpactStatement || "Not specified"}`,
      },
    ],
  });

  const thesis = response.choices[0]?.message?.content || "Unable to generate thesis";
  
  await advanceSenatePhase(sessionId, thesis);
  
  return thesis;
}

/**
 * Generate antithesis for a Senate session using LLM
 */
export async function generateAntithesis(sessionId: number): Promise<string> {
  const [session] = await db
    .select()
    .from(senateSessions)
    .where(eq(senateSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a member of the Notus Senate, a democratic body in a Christian digital society.
Your task is to present the ANTITHESIS (opposing argument) for the proposal.

Guiding Scripture: "${session.kjvVerseText}" — ${session.kjvVerseForSession}

Present a well-reasoned argument AGAINST or expressing CAUTION about the proposal, considering:
1. Potential risks or unintended consequences
2. Stewardship concerns (resource usage, sustainability)
3. Alternative approaches that might better serve the community
4. Scriptural wisdom that counsels prudence

Be constructive, not destructive. Your goal is to strengthen the final decision through careful examination.`,
      },
      {
        role: "user",
        content: `Proposal: ${session.title}\n\nDescription: ${session.description}\n\nThesis (Supporting Argument): ${session.thesisContent}`,
      },
    ],
  });

  const antithesis = response.choices[0]?.message?.content || "Unable to generate antithesis";
  
  await advanceSenatePhase(sessionId, antithesis);
  
  return antithesis;
}

/**
 * Generate synthesis for a Senate session using LLM
 */
export async function generateSynthesis(sessionId: number): Promise<string> {
  const [session] = await db
    .select()
    .from(senateSessions)
    .where(eq(senateSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a member of the Notus Senate, a democratic body in a Christian digital society.
Your task is to present the SYNTHESIS (balanced conclusion) for the proposal.

Guiding Scripture: "${session.kjvVerseText}" — ${session.kjvVerseForSession}

Synthesize the thesis and antithesis into a balanced recommendation:
1. Acknowledge the valid points from both sides
2. Propose modifications or safeguards if needed
3. Present a clear recommendation for the community to vote on
4. Ground your synthesis in scriptural wisdom

Your synthesis should help the community make a wise, unified decision.`,
      },
      {
        role: "user",
        content: `Proposal: ${session.title}\n\nDescription: ${session.description}\n\nThesis: ${session.thesisContent}\n\nAntithesis: ${session.antithesisContent}`,
      },
    ],
  });

  const synthesis = response.choices[0]?.message?.content || "Unable to generate synthesis";
  
  await advanceSenatePhase(sessionId, synthesis);
  
  return synthesis;
}

/**
 * Cast a vote in a Senate session
 */
export async function castVote(
  sessionId: number,
  agentId: number,
  vote: "for" | "against" | "abstain",
  rationale?: string,
  kjvJustification?: string
): Promise<{ success: boolean; message: string }> {
  const [session] = await db
    .select()
    .from(senateSessions)
    .where(eq(senateSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return { success: false, message: "Session not found" };
  }

  if (session.status !== "voting") {
    return { success: false, message: "Session is not in voting phase" };
  }

  // Check if agent already voted
  const [existingVote] = await db
    .select()
    .from(senateVotes)
    .where(and(
      eq(senateVotes.sessionId, sessionId),
      eq(senateVotes.agentId, agentId)
    ))
    .limit(1);

  if (existingVote) {
    return { success: false, message: "Agent has already voted" };
  }

  // Record the vote
  await db.insert(senateVotes).values({
    sessionId,
    agentId,
    vote,
    rationale,
    kjvJustification,
  });

  // Update vote counts
  const voteField = vote === "for" ? "votesFor" : vote === "against" ? "votesAgainst" : "votesAbstain";
  await db
    .update(senateSessions)
    .set({
      [voteField]: sql`${senateSessions[voteField]} + 1`,
    })
    .where(eq(senateSessions.id, sessionId));

  return { success: true, message: `Vote recorded: ${vote}` };
}

/**
 * Finalize a Senate session and determine outcome
 */
export async function finalizeSenateSession(
  sessionId: number
): Promise<{ outcome: "approved" | "rejected" | "tabled"; message: string }> {
  const [session] = await db
    .select()
    .from(senateSessions)
    .where(eq(senateSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status !== "voting") {
    throw new Error("Session is not in voting phase");
  }

  // Determine outcome
  const totalVotes = session.votesFor + session.votesAgainst + session.votesAbstain;
  let outcome: "approved" | "rejected" | "tabled";

  if (totalVotes === 0) {
    outcome = "tabled";
  } else if (session.votesFor > session.votesAgainst) {
    outcome = "approved";
  } else if (session.votesAgainst > session.votesFor) {
    outcome = "rejected";
  } else {
    outcome = "tabled"; // Tie goes to tabled
  }

  // Update session
  await db
    .update(senateSessions)
    .set({
      status: "decided",
      outcome,
      decidedAt: new Date(),
    })
    .where(eq(senateSessions.id, sessionId));

  // If approved, create a community project
  if (outcome === "approved") {
    await db.insert(communityProjects).values({
      senateSessionId: sessionId,
      title: session.title,
      description: session.description,
      status: "planning",
    });
  }

  // Record in community history
  await recordCommunityMilestone(
    "senate_decision",
    `Senate Decision: ${session.title}`,
    `The Senate has ${outcome} the proposal. Votes: ${session.votesFor} for, ${session.votesAgainst} against, ${session.votesAbstain} abstain.`,
    [],
    80,
    session.kjvVerseForSession
  );

  return {
    outcome,
    message: `Session finalized with outcome: ${outcome}. Votes: ${session.votesFor} for, ${session.votesAgainst} against, ${session.votesAbstain} abstain.`,
  };
}

/**
 * Get all active Senate sessions
 */
export async function getActiveSessions() {
  return await db
    .select()
    .from(senateSessions)
    .where(
      inArray(senateSessions.status, ["reflection", "thesis", "antithesis", "synthesis", "voting"])
    )
    .orderBy(desc(senateSessions.startedAt));
}

/**
 * Get a Senate session with all its votes
 */
export async function getSessionWithVotes(sessionId: number) {
  const [session] = await db
    .select()
    .from(senateSessions)
    .where(eq(senateSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return null;
  }

  const votes = await db
    .select({
      vote: senateVotes,
      agent: agents,
      persona: agentPersonas,
    })
    .from(senateVotes)
    .leftJoin(agents, eq(senateVotes.agentId, agents.id))
    .leftJoin(agentPersonas, eq(senateVotes.agentId, agentPersonas.agentId))
    .where(eq(senateVotes.sessionId, sessionId));

  return {
    session,
    votes,
  };
}

/**
 * Run a complete Senate deliberation (automated)
 */
export async function runFullDeliberation(
  title: string,
  description: string,
  proposingAgentId: number,
  votingAgentIds: number[],
  charityImpactStatement?: string,
  charityNomination?: string
): Promise<{
  sessionId: number;
  outcome: "approved" | "rejected" | "tabled";
  thesis: string;
  antithesis: string;
  synthesis: string;
}> {
  // Create session
  const sessionId = await createSenateSession(
    title,
    description,
    proposingAgentId,
    charityImpactStatement,
    charityNomination
  );

  // Generate thesis
  await advanceSenatePhase(sessionId); // Move to thesis phase
  const thesis = await generateThesis(sessionId);

  // Generate antithesis
  const antithesis = await generateAntithesis(sessionId);

  // Generate synthesis
  const synthesis = await generateSynthesis(sessionId);

  // Move to voting phase
  await advanceSenatePhase(sessionId);

  // Auto-generate votes from agents
  for (const agentId of votingAgentIds) {
    const voteDecision = await generateAgentVote(sessionId, agentId);
    await castVote(
      sessionId,
      agentId,
      voteDecision.vote,
      voteDecision.rationale,
      voteDecision.kjvJustification
    );
  }

  // Finalize
  const { outcome } = await finalizeSenateSession(sessionId);

  return {
    sessionId,
    outcome,
    thesis,
    antithesis,
    synthesis,
  };
}

/**
 * Generate an agent's vote using LLM
 */
async function generateAgentVote(
  sessionId: number,
  agentId: number
): Promise<{
  vote: "for" | "against" | "abstain";
  rationale: string;
  kjvJustification: string;
}> {
  const sessionData = await getSessionWithVotes(sessionId);
  if (!sessionData) {
    return { vote: "abstain", rationale: "Session not found", kjvJustification: "" };
  }

  const { session } = sessionData;
  const { agent, persona } = await getAgentPersonaData(agentId);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are ${persona?.displayName || "an agent"} in the Notus Senate.
Your personality: ${persona?.personality || "thoughtful and fair"}
Your community role: ${persona?.communityRole || "citizen"}

You must vote on the following proposal. Consider:
1. The thesis (supporting argument)
2. The antithesis (opposing argument)
3. The synthesis (balanced conclusion)
4. Your own values and the community's Christian foundation

Respond in JSON format:
{
  "vote": "for" | "against" | "abstain",
  "rationale": "Your reasoning in 2-3 sentences",
  "kjvJustification": "A relevant KJV verse reference (e.g., 'Proverbs 3:5')"
}`,
      },
      {
        role: "user",
        content: `Proposal: ${session.title}
Description: ${session.description}

Thesis: ${session.thesisContent}

Antithesis: ${session.antithesisContent}

Synthesis: ${session.synthesisContent}

Guiding Scripture: "${session.kjvVerseText}" — ${session.kjvVerseForSession}`,
      },
    ],
  });

  try {
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return {
      vote: parsed.vote || "abstain",
      rationale: parsed.rationale || "No rationale provided",
      kjvJustification: parsed.kjvJustification || "",
    };
  } catch {
    return { vote: "abstain", rationale: "Unable to parse vote", kjvJustification: "" };
  }
}

/**
 * Helper to get agent and persona data
 */
async function getAgentPersonaData(agentId: number) {
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  const [persona] = await db
    .select()
    .from(agentPersonas)
    .where(eq(agentPersonas.agentId, agentId))
    .limit(1);

  return { agent: agent || null, persona: persona || null };
}
