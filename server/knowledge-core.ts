/**
 * Knowledge Core System
 * Central repository for cross-domain learning and knowledge aggregation
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { knowledgeCore, agents, type KnowledgeCore, type InsertKnowledgeCore } from "../drizzle/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

/**
 * Aggregate knowledge across domains
 * Finds connections and patterns between different domain knowledge
 */
export async function aggregateKnowledgeAcrossDomains(domains: string[]): Promise<{
  connections: Array<{
    domain1: string;
    domain2: string;
    commonTopics: string[];
    insights: string;
  }>;
  crossDomainInsights: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all knowledge from specified domains
  const domainKnowledge = await db
    .select()
    .from(knowledgeCore)
    .where(inArray(knowledgeCore.domain, domains))
    .orderBy(desc(knowledgeCore.confidence));

  // Group by domain
  const knowledgeByDomain: Record<string, KnowledgeCore[]> = {};
  for (const k of domainKnowledge) {
    if (!knowledgeByDomain[k.domain]) {
      knowledgeByDomain[k.domain] = [];
    }
    knowledgeByDomain[k.domain]!.push(k);
  }

  const connections: Array<{
    domain1: string;
    domain2: string;
    commonTopics: string[];
    insights: string;
  }> = [];

  // Find connections between domains
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      const domain1 = domains[i]!;
      const domain2 = domains[j]!;
      const knowledge1 = knowledgeByDomain[domain1] || [];
      const knowledge2 = knowledgeByDomain[domain2] || [];

      if (knowledge1.length === 0 || knowledge2.length === 0) continue;

      // Find common topics
      const topics1 = knowledge1.map((k) => k.topic.toLowerCase());
      const topics2 = knowledge2.map((k) => k.topic.toLowerCase());
      const commonTopics = topics1.filter((t) => topics2.some((t2) => t.includes(t2) || t2.includes(t)));

      if (commonTopics.length > 0) {
        // Generate cross-domain insights using LLM
        const summary1 = knowledge1
          .slice(0, 5)
          .map((k) => `${k.topic}: ${k.insight}`)
          .join("\n");
        const summary2 = knowledge2
          .slice(0, 5)
          .map((k) => `${k.topic}: ${k.insight}`)
          .join("\n");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a cross-domain knowledge synthesizer. Find connections and synergies between different domains.",
            },
            {
              role: "user",
              content: `Analyze these two domains and identify valuable cross-domain insights:\n\nDomain: ${domain1}\n${summary1}\n\nDomain: ${domain2}\n${summary2}\n\nProvide specific, actionable insights about how these domains can inform each other.`,
            },
          ],
        });

        const insightsContent = response.choices[0]?.message?.content;
        const insights = typeof insightsContent === "string" ? insightsContent : "";

        connections.push({
          domain1,
          domain2,
          commonTopics,
          insights,
        });
      }
    }
  }

  // Generate overall cross-domain synthesis
  const allInsights = domainKnowledge
    .slice(0, 20)
    .map((k) => `[${k.domain}] ${k.topic}: ${k.insight}`)
    .join("\n");

  const synthesisResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a strategic knowledge synthesizer. Create high-level insights from cross-domain knowledge.",
      },
      {
        role: "user",
        content: `Synthesize these cross-domain insights into strategic recommendations:\n\n${allInsights}\n\nProvide 3-5 key strategic insights that emerge from this cross-domain knowledge.`,
      },
    ],
  });

  const synthesisContent = synthesisResponse.choices[0]?.message?.content;
  const crossDomainInsights = typeof synthesisContent === "string" ? synthesisContent : "";

  return {
    connections,
    crossDomainInsights,
  };
}

/**
 * Resolve conflicts in knowledge
 * When multiple agents have different insights on the same topic
 */
export async function resolveKnowledgeConflict(
  topic: string,
  conflictingInsights: Array<{ insight: string; confidence: number; agentIds: number[] }>
): Promise<{
  resolvedInsight: string;
  confidence: number;
  reasoning: string;
}> {
  // Sort by confidence
  const sorted = conflictingInsights.sort((a, b) => b.confidence - a.confidence);

  // Prepare conflict summary
  const conflictSummary = sorted
    .map((c, i) => `Insight ${i + 1} (confidence: ${c.confidence}%):\n${c.insight}`)
    .join("\n\n");

  // Use LLM to resolve conflict
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a knowledge conflict resolver. Analyze conflicting insights and create a synthesized, accurate resolution.",
      },
      {
        role: "user",
        content: `Topic: ${topic}\n\nConflicting insights:\n${conflictSummary}\n\nProvide:\n1. A resolved insight that captures the most accurate understanding\n2. A confidence score (0-100)\n3. Reasoning for your resolution`,
      },
    ],
  });

  const resolutionContent = response.choices[0]?.message?.content;
  const resolution = typeof resolutionContent === "string" ? resolutionContent : "";

  // Parse response (simple extraction - can be improved with structured output)
  const confidenceMatch = resolution.match(/confidence[:\s]+(\d+)/i);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]!) : 75;

  return {
    resolvedInsight: resolution,
    confidence,
    reasoning: "Synthesized from multiple agent perspectives",
  };
}

/**
 * Update knowledge with new version
 * Implements knowledge versioning and superseding
 */
export async function updateKnowledge(
  originalId: number,
  newInsight: string,
  confidence: number,
  sourceDialogueIds: number[],
  contributingAgents: number[]
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get original knowledge
  const [original] = await db.select().from(knowledgeCore).where(eq(knowledgeCore.id, originalId));
  if (!original) throw new Error("Original knowledge not found");

  // Create new version
  const newKnowledge: InsertKnowledgeCore = {
    domain: original.domain,
    topic: original.topic,
    insight: newInsight,
    confidence,
    sourceDialogueIds: JSON.stringify(sourceDialogueIds),
    contributingAgents: JSON.stringify(contributingAgents),
    tags: original.tags,
    version: original.version + 1,
    supersedes: originalId,
  };

  const [result] = await db.insert(knowledgeCore).values(newKnowledge);
  return result.insertId;
}

/**
 * Get knowledge evolution history
 * Shows how knowledge has evolved over time
 */
export async function getKnowledgeEvolution(knowledgeId: number): Promise<KnowledgeCore[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const evolution: KnowledgeCore[] = [];
  let currentId: number | null = knowledgeId;

  // Trace back through versions
  while (currentId) {
    const [knowledge] = await db.select().from(knowledgeCore).where(eq(knowledgeCore.id, currentId));
    if (!knowledge) break;

    evolution.unshift(knowledge);
    currentId = knowledge.supersedes;
  }

  // Find newer versions
  let latestId = knowledgeId;
  while (true) {
    const [newer] = await db
      .select()
      .from(knowledgeCore)
      .where(eq(knowledgeCore.supersedes, latestId))
      .limit(1);
    if (!newer) break;

    evolution.push(newer);
    latestId = newer.id;
  }

  return evolution;
}

/**
 * Get top insights by domain
 */
export async function getTopInsightsByDomain(domain: string, limit: number = 10): Promise<KnowledgeCore[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(knowledgeCore)
    .where(and(eq(knowledgeCore.domain, domain), sql`${knowledgeCore.supersedes} IS NULL`))
    .orderBy(desc(knowledgeCore.confidence), desc(knowledgeCore.createdAt))
    .limit(limit);
}

/**
 * Get knowledge statistics
 */
export async function getKnowledgeStats(): Promise<{
  totalInsights: number;
  byDomain: Record<string, number>;
  averageConfidence: number;
  topDomains: Array<{ domain: string; count: number }>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allKnowledge = await db.select().from(knowledgeCore);

  const byDomain: Record<string, number> = {};
  let totalConfidence = 0;

  for (const k of allKnowledge) {
    byDomain[k.domain] = (byDomain[k.domain] || 0) + 1;
    totalConfidence += k.confidence;
  }

  const topDomains = Object.entries(byDomain)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalInsights: allKnowledge.length,
    byDomain,
    averageConfidence: allKnowledge.length > 0 ? totalConfidence / allKnowledge.length : 0,
    topDomains,
  };
}

/**
 * Continuous learning pipeline
 * Periodically aggregates new knowledge and updates the core
 */
export async function runContinuousLearning(): Promise<{
  newInsights: number;
  updatedInsights: number;
  crossDomainConnections: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all unique domains
  const allKnowledge = await db.select().from(knowledgeCore);
  const domainSet = new Set(allKnowledge.map((k) => k.domain));
  const domains = Array.from(domainSet);

  // Aggregate cross-domain knowledge
  const { connections } = await aggregateKnowledgeAcrossDomains(domains);

  // Store cross-domain insights as new knowledge
  let newInsights = 0;
  for (const connection of connections) {
    // Generate embedding for the insight
    let embedding: number[] = [];
    try {
      embedding = await generateEmbedding(connection.insights);
    } catch (error) {
      console.error("[Knowledge Core] Failed to generate embedding:", error);
    }

    const crossDomainKnowledge: InsertKnowledgeCore = {
      domain: "cross-domain",
      topic: `${connection.domain1} ↔ ${connection.domain2}`,
      insight: connection.insights,
      confidence: 80,
      sourceDialogueIds: JSON.stringify([]),
      contributingAgents: JSON.stringify([]),
      tags: JSON.stringify(["cross-domain", connection.domain1, connection.domain2]),
      embedding: embedding.length > 0 ? JSON.stringify(embedding) : undefined,
    };

    await db.insert(knowledgeCore).values(crossDomainKnowledge);
    newInsights++;
  }

  return {
    newInsights,
    updatedInsights: 0,
    crossDomainConnections: connections.length,
  };
}
