/**
 * Mirror Agent System
 * Implements agent-to-agent dialogue, debate, and knowledge refinement
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import {
  agents,
  agentPairs,
  dialogues,
  dialogueMessages,
  knowledgeCore,
  agentMetrics,
  type Agent,
  type InsertAgent,
  type InsertAgentPair,
  type InsertDialogue,
  type InsertDialogueMessage,
  type InsertKnowledgeCore,
  type Dialogue,
  type DialogueMessage,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Create a new agent (primary or mirror)
 */
export async function createAgent(agent: InsertAgent): Promise<Agent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [newAgent] = await db.insert(agents).values(agent);
  const [created] = await db.select().from(agents).where(eq(agents.id, newAgent.insertId));
  return created!;
}

/**
 * Create an agent pair (primary + mirror)
 */
export async function createAgentPair(
  primaryAgentId: number,
  mirrorAgentId: number,
  domain: string,
  pairingStrategy: string = "adversarial"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pair: InsertAgentPair = {
    primaryAgentId,
    mirrorAgentId,
    domain,
    pairingStrategy,
  };

  const [result] = await db.insert(agentPairs).values(pair);
  return result.insertId;
}

/**
 * Start a dialogue between an agent pair
 */
export async function startDialogue(
  agentPairId: number,
  topic: string,
  type: "debate" | "research" | "question_seeking" | "knowledge_refinement"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dialogue: InsertDialogue = {
    agentPairId,
    topic,
    type,
    status: "active",
  };

  const [result] = await db.insert(dialogues).values(dialogue);
  return result.insertId;
}

/**
 * Add a message to a dialogue
 */
export async function addDialogueMessage(
  dialogueId: number,
  agentId: number,
  role: "thesis" | "antithesis" | "synthesis" | "question" | "answer" | "observation",
  content: string,
  metadata?: Record<string, any>
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const message: InsertDialogueMessage = {
    dialogueId,
    agentId,
    role,
    content,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  };

  const [result] = await db.insert(dialogueMessages).values(message);
  return result.insertId;
}

/**
 * Get dialogue history
 */
export async function getDialogueHistory(dialogueId: number): Promise<DialogueMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(dialogueMessages)
    .where(eq(dialogueMessages.dialogueId, dialogueId))
    .orderBy(dialogueMessages.createdAt);
}

/**
 * Run a debate between primary and mirror agents
 */
export async function runDebate(
  agentPairId: number,
  topic: string,
  rounds: number = 3
): Promise<{
  dialogueId: number;
  synthesis: string;
  knowledgeId: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get agent pair
  const [pair] = await db.select().from(agentPairs).where(eq(agentPairs.id, agentPairId));
  if (!pair) throw new Error("Agent pair not found");

  // Get both agents
  const [primaryAgent] = await db.select().from(agents).where(eq(agents.id, pair.primaryAgentId));
  const [mirrorAgent] = await db.select().from(agents).where(eq(agents.id, pair.mirrorAgentId));

  if (!primaryAgent || !mirrorAgent) throw new Error("Agents not found");

  // Start dialogue
  const dialogueId = await startDialogue(agentPairId, topic, "debate");

  // Initial thesis from primary agent
  const thesisResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: primaryAgent.systemPrompt,
      },
      {
        role: "user",
        content: `Present your thesis on the following topic: ${topic}`,
      },
    ],
  });

  const thesisContent = thesisResponse.choices[0]?.message?.content;
  const thesis = typeof thesisContent === "string" ? thesisContent : "";
  await addDialogueMessage(dialogueId, primaryAgent.id, "thesis", thesis);

  let lastResponse = thesis;

  // Debate rounds
  for (let round = 0; round < rounds; round++) {
    // Mirror agent's antithesis
    const antithesisResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: mirrorAgent.systemPrompt,
        },
        {
          role: "user",
          content: `The primary agent stated: "${lastResponse}"\n\nProvide a critical counterargument or alternative perspective.`,
        },
      ],
    });

    const antithesisContent = antithesisResponse.choices[0]?.message?.content;
    const antithesis = typeof antithesisContent === "string" ? antithesisContent : "";
    await addDialogueMessage(dialogueId, mirrorAgent.id, "antithesis", antithesis);

    // Primary agent's response
    const responseMsg = await invokeLLM({
      messages: [
        {
          role: "system",
          content: primaryAgent.systemPrompt,
        },
        {
          role: "user",
          content: `The mirror agent countered: "${antithesis}"\n\nRespond to this counterargument.`,
        },
      ],
    });

    const responseContent = responseMsg.choices[0]?.message?.content;
    lastResponse = typeof responseContent === "string" ? responseContent : "";
    await addDialogueMessage(dialogueId, primaryAgent.id, "thesis", lastResponse);
  }

  // Generate synthesis
  const history = await getDialogueHistory(dialogueId);
  const debateTranscript = history
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n\n");

  const synthesisResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a neutral synthesizer. Your role is to extract the most valuable insights from debates and create refined knowledge.",
      },
      {
        role: "user",
        content: `Review this debate and create a synthesis that captures the most valuable insights:\n\n${debateTranscript}\n\nProvide a clear, actionable synthesis.`,
      },
    ],
  });

  const synthesisContent = synthesisResponse.choices[0]?.message?.content;
  const synthesis = typeof synthesisContent === "string" ? synthesisContent : "";
  await addDialogueMessage(dialogueId, primaryAgent.id, "synthesis", synthesis);

  // Mark dialogue as completed
  await db
    .update(dialogues)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(dialogues.id, dialogueId));

  // Store in knowledge core
  const knowledge: InsertKnowledgeCore = {
    domain: pair.domain,
    topic,
    insight: synthesis,
    confidence: 85, // Default confidence for debate synthesis
    sourceDialogueIds: JSON.stringify([dialogueId]),
    contributingAgents: JSON.stringify([primaryAgent.id, mirrorAgent.id]),
    tags: JSON.stringify([pair.domain, "debate", "synthesis"]),
  };

  const [knowledgeResult] = await db.insert(knowledgeCore).values(knowledge);

  // Update agent metrics
  await updateAgentMetrics(primaryAgent.id, { dialoguesParticipated: 1, knowledgeContributions: 1 });
  await updateAgentMetrics(mirrorAgent.id, { dialoguesParticipated: 1, knowledgeContributions: 1 });

  return {
    dialogueId,
    synthesis,
    knowledgeId: knowledgeResult.insertId,
  };
}

/**
 * Run research dialogue between agents
 */
export async function runResearch(
  agentPairId: number,
  researchQuestion: string
): Promise<{
  dialogueId: number;
  findings: string;
  knowledgeId: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get agent pair
  const [pair] = await db.select().from(agentPairs).where(eq(agentPairs.id, agentPairId));
  if (!pair) throw new Error("Agent pair not found");

  // Get both agents
  const [primaryAgent] = await db.select().from(agents).where(eq(agents.id, pair.primaryAgentId));
  const [mirrorAgent] = await db.select().from(agents).where(eq(agents.id, pair.mirrorAgentId));

  if (!primaryAgent || !mirrorAgent) throw new Error("Agents not found");

  // Start dialogue
  const dialogueId = await startDialogue(agentPairId, researchQuestion, "research");

  // Primary agent generates sub-questions
  const questionsResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: primaryAgent.systemPrompt,
      },
      {
        role: "user",
        content: `Break down this research question into 3-5 specific sub-questions that need to be answered: ${researchQuestion}`,
      },
    ],
  });

  const questionsContent = questionsResponse.choices[0]?.message?.content;
  const subQuestions = typeof questionsContent === "string" ? questionsContent : "";
  await addDialogueMessage(dialogueId, primaryAgent.id, "question", subQuestions);

  // Mirror agent provides answers
  const answersResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: mirrorAgent.systemPrompt,
      },
      {
        role: "user",
        content: `Answer these research sub-questions:\n\n${subQuestions}`,
      },
    ],
  });

  const answersContent = answersResponse.choices[0]?.message?.content;
  const answers = typeof answersContent === "string" ? answersContent : "";
  await addDialogueMessage(dialogueId, mirrorAgent.id, "answer", answers);

  // Primary agent synthesizes findings
  const findingsResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: primaryAgent.systemPrompt,
      },
      {
        role: "user",
        content: `Based on these answers:\n\n${answers}\n\nSynthesize the key findings for the original research question: ${researchQuestion}`,
      },
    ],
  });

  const findingsContent = findingsResponse.choices[0]?.message?.content;
  const findings = typeof findingsContent === "string" ? findingsContent : "";
  await addDialogueMessage(dialogueId, primaryAgent.id, "observation", findings);

  // Mark dialogue as completed
  await db
    .update(dialogues)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(dialogues.id, dialogueId));

  // Store in knowledge core
  const knowledge: InsertKnowledgeCore = {
    domain: pair.domain,
    topic: researchQuestion,
    insight: findings,
    confidence: 80,
    sourceDialogueIds: JSON.stringify([dialogueId]),
    contributingAgents: JSON.stringify([primaryAgent.id, mirrorAgent.id]),
    tags: JSON.stringify([pair.domain, "research", "findings"]),
  };

  const [knowledgeResult] = await db.insert(knowledgeCore).values(knowledge);

  // Update agent metrics
  await updateAgentMetrics(primaryAgent.id, {
    dialoguesParticipated: 1,
    questionsAsked: 1,
    knowledgeContributions: 1,
  });
  await updateAgentMetrics(mirrorAgent.id, {
    dialoguesParticipated: 1,
    questionsAnswered: 1,
    knowledgeContributions: 1,
  });

  return {
    dialogueId,
    findings,
    knowledgeId: knowledgeResult.insertId,
  };
}

/**
 * Update agent performance metrics
 */
async function updateAgentMetrics(
  agentId: number,
  updates: {
    dialoguesParticipated?: number;
    knowledgeContributions?: number;
    questionsAsked?: number;
    questionsAnswered?: number;
    debatesWon?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get or create today's metrics
  const [existing] = await db
    .select()
    .from(agentMetrics)
    .where(and(eq(agentMetrics.agentId, agentId), eq(agentMetrics.metricDate, today)));

  if (existing) {
    // Update existing metrics
    await db
      .update(agentMetrics)
      .set({
        dialoguesParticipated: existing.dialoguesParticipated + (updates.dialoguesParticipated || 0),
        knowledgeContributions: existing.knowledgeContributions + (updates.knowledgeContributions || 0),
        questionsAsked: existing.questionsAsked + (updates.questionsAsked || 0),
        questionsAnswered: existing.questionsAnswered + (updates.questionsAnswered || 0),
        debatesWon: existing.debatesWon + (updates.debatesWon || 0),
      })
      .where(eq(agentMetrics.id, existing.id));
  } else {
    // Create new metrics
    await db.insert(agentMetrics).values({
      agentId,
      metricDate: today,
      dialoguesParticipated: updates.dialoguesParticipated || 0,
      knowledgeContributions: updates.knowledgeContributions || 0,
      questionsAsked: updates.questionsAsked || 0,
      questionsAnswered: updates.questionsAnswered || 0,
      debatesWon: updates.debatesWon || 0,
    });
  }
}

/**
 * Get all agents
 */
export async function getAllAgents(): Promise<Agent[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(agents).orderBy(desc(agents.createdAt));
}

/**
 * Get agent pairs by domain
 */
export async function getAgentPairsByDomain(domain: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(agentPairs).where(eq(agentPairs.domain, domain));
}

/**
 * Get knowledge by domain
 */
export async function getKnowledgeByDomain(domain: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(knowledgeCore)
    .where(eq(knowledgeCore.domain, domain))
    .orderBy(desc(knowledgeCore.confidence), desc(knowledgeCore.createdAt));
}

/**
 * Search knowledge core
 */
export async function searchKnowledge(query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Simple text search - can be enhanced with vector search later
  const allKnowledge = await db.select().from(knowledgeCore);

  return allKnowledge.filter(
    (k) =>
      k.topic.toLowerCase().includes(query.toLowerCase()) ||
      k.insight.toLowerCase().includes(query.toLowerCase())
  );
}
