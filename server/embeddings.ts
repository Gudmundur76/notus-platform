import { ENV } from "./_core/env";

/**
 * Generate embeddings using OpenAI's text-embedding-3-small model
 * via the Manus built-in API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${ENV.forgeApiUrl}/llm/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 1536, // Standard dimension for text-embedding-3-small
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embedding generation failed: ${response.status} ${response.statusText} – ${error}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error("Invalid embedding response format");
    }

    return data.data[0].embedding;
  } catch (error) {
    console.error("[Embeddings] Generation failed:", error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find most similar knowledge entries using vector similarity
 */
export function findSimilarKnowledge(
  queryEmbedding: number[],
  knowledgeWithEmbeddings: Array<{ id: number; embedding: number[]; [key: string]: any }>,
  topK: number = 5
): Array<{ id: number; similarity: number; [key: string]: any }> {
  const similarities = knowledgeWithEmbeddings
    .filter(k => k.embedding && k.embedding.length > 0)
    .map(knowledge => ({
      ...knowledge,
      similarity: cosineSimilarity(queryEmbedding, knowledge.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return similarities;
}

/**
 * Batch generate embeddings with rate limiting
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  delayMs: number = 100
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i++) {
    try {
      const embedding = await generateEmbedding(texts[i]);
      embeddings.push(embedding);

      // Add delay between requests to avoid rate limiting
      if (i < texts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`[Embeddings] Failed to generate embedding for text ${i}:`, error);
      // Push empty array as placeholder
      embeddings.push([]);
    }
  }

  return embeddings;
}
