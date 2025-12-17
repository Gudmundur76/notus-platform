/**
 * Semantic Search for Knowledge Core
 * Uses vector embeddings to find semantically similar knowledge
 */

import { getDb } from "./db";
import { knowledgeCore, type KnowledgeCore } from "../drizzle/schema";
import { generateEmbedding, cosineSimilarity } from "./embeddings";
import { sql } from "drizzle-orm";

/**
 * Semantic search across knowledge core
 * Returns knowledge entries ranked by semantic similarity
 */
export async function semanticSearch(
  query: string,
  options: {
    domain?: string;
    topK?: number;
    minSimilarity?: number;
  } = {}
): Promise<Array<KnowledgeCore & { similarity: number }>> {
  const { domain, topK = 10, minSimilarity = 0.5 } = options;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Get all knowledge with embeddings
  const allKnowledge = domain
    ? await db
        .select()
        .from(knowledgeCore)
        .where(sql`${knowledgeCore.embedding} IS NOT NULL AND ${knowledgeCore.domain} = ${domain}`)
    : await db
        .select()
        .from(knowledgeCore)
        .where(sql`${knowledgeCore.embedding} IS NOT NULL`);

  // Calculate similarities
  const results = allKnowledge
    .map((knowledge) => {
      let embedding: number[] = [];
      try {
        if (knowledge.embedding) {
          embedding = JSON.parse(knowledge.embedding);
        }
      } catch (error) {
        console.error(`[Semantic Search] Failed to parse embedding for knowledge ${knowledge.id}:`, error);
        return null;
      }

      if (embedding.length === 0) return null;

      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return {
        ...knowledge,
        similarity,
      };
    })
    .filter((r): r is KnowledgeCore & { similarity: number } => r !== null && r.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
}

/**
 * Find related knowledge entries
 * Given a knowledge ID, find semantically similar entries
 */
export async function findRelatedKnowledge(
  knowledgeId: number,
  options: {
    excludeSameDomain?: boolean;
    topK?: number;
    minSimilarity?: number;
  } = {}
): Promise<Array<KnowledgeCore & { similarity: number }>> {
  const { excludeSameDomain = false, topK = 5, minSimilarity = 0.6 } = options;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the source knowledge
  const [sourceKnowledge] = await db.select().from(knowledgeCore).where(sql`${knowledgeCore.id} = ${knowledgeId}`);
  if (!sourceKnowledge) throw new Error("Knowledge not found");

  if (!sourceKnowledge.embedding) {
    throw new Error("Source knowledge has no embedding");
  }

  let sourceEmbedding: number[];
  try {
    sourceEmbedding = JSON.parse(sourceKnowledge.embedding);
  } catch (error) {
    throw new Error("Failed to parse source embedding");
  }

  // Get all other knowledge with embeddings
  const allKnowledge = excludeSameDomain
    ? await db
        .select()
        .from(knowledgeCore)
        .where(
          sql`${knowledgeCore.id} != ${knowledgeId} AND ${knowledgeCore.embedding} IS NOT NULL AND ${knowledgeCore.domain} != ${sourceKnowledge.domain}`
        )
    : await db
        .select()
        .from(knowledgeCore)
        .where(sql`${knowledgeCore.id} != ${knowledgeId} AND ${knowledgeCore.embedding} IS NOT NULL`);

  // Calculate similarities
  const results = allKnowledge
    .map((knowledge) => {
      let embedding: number[] = [];
      try {
        if (knowledge.embedding) {
          embedding = JSON.parse(knowledge.embedding);
        }
      } catch (error) {
        console.error(`[Semantic Search] Failed to parse embedding for knowledge ${knowledge.id}:`, error);
        return null;
      }

      if (embedding.length === 0) return null;

      const similarity = cosineSimilarity(sourceEmbedding, embedding);
      return {
        ...knowledge,
        similarity,
      };
    })
    .filter((r): r is KnowledgeCore & { similarity: number } => r !== null && r.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
}

/**
 * Backfill embeddings for existing knowledge
 * Generates embeddings for knowledge entries that don't have them
 */
export async function backfillEmbeddings(batchSize: number = 10): Promise<{
  processed: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get knowledge without embeddings
  const knowledgeWithoutEmbeddings = await db
    .select()
    .from(knowledgeCore)
    .where(sql`${knowledgeCore.embedding} IS NULL`)
    .limit(batchSize);

  let processed = 0;
  let failed = 0;

  for (const knowledge of knowledgeWithoutEmbeddings) {
    try {
      // Generate embedding
      const embedding = await generateEmbedding(knowledge.insight);

      // Update knowledge with embedding
      await db
        .update(knowledgeCore)
        .set({ embedding: JSON.stringify(embedding) })
        .where(sql`${knowledgeCore.id} = ${knowledge.id}`);

      processed++;

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[Backfill] Failed to generate embedding for knowledge ${knowledge.id}:`, error);
      failed++;
    }
  }

  return { processed, failed };
}
