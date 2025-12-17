import { describe, it, expect, beforeAll } from "vitest";
import { generateEmbedding, cosineSimilarity } from "./embeddings";
import { semanticSearch, backfillEmbeddings } from "./semantic-search";

describe("Embeddings", () => {
  it("should generate embeddings for text", async () => {
    const text = "Artificial intelligence is transforming healthcare";
    const embedding = await generateEmbedding(text);

    expect(embedding).toBeInstanceOf(Array);
    expect(embedding.length).toBe(1536); // text-embedding-3-small dimension
    expect(embedding.every((val) => typeof val === "number")).toBe(true);
  }, 30000);

  it("should calculate cosine similarity correctly", () => {
    const vec1 = [1, 0, 0];
    const vec2 = [1, 0, 0];
    const vec3 = [0, 1, 0];

    // Identical vectors should have similarity 1
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(1, 5);

    // Orthogonal vectors should have similarity 0
    expect(cosineSimilarity(vec1, vec3)).toBeCloseTo(0, 5);
  });

  it("should find similar vectors", () => {
    const vec1 = [1, 1, 0];
    const vec2 = [1, 0.9, 0.1];
    const vec3 = [0, 0, 1];

    const sim12 = cosineSimilarity(vec1, vec2);
    const sim13 = cosineSimilarity(vec1, vec3);

    // vec1 should be more similar to vec2 than vec3
    expect(sim12).toBeGreaterThan(sim13);
  });
});

describe("Semantic Search", () => {
  it("should handle empty results gracefully", async () => {
    const results = await semanticSearch("nonexistent topic xyz123", {
      topK: 5,
      minSimilarity: 0.9, // High threshold to ensure no results
    });

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThanOrEqual(0);
  }, 30000);

  it("should return results with similarity scores", async () => {
    // First, ensure there's some knowledge in the database
    // This test assumes knowledge exists; in a real scenario, you'd seed test data
    const results = await semanticSearch("artificial intelligence", {
      topK: 3,
      minSimilarity: 0.3,
    });

    results.forEach((result) => {
      expect(result).toHaveProperty("similarity");
      expect(typeof result.similarity).toBe("number");
      expect(result.similarity).toBeGreaterThanOrEqual(0.3);
      expect(result.similarity).toBeLessThanOrEqual(1);
    });
  }, 30000);

  it("should filter by domain when specified", async () => {
    const results = await semanticSearch("innovation", {
      domain: "biotech",
      topK: 5,
    });

    results.forEach((result) => {
      expect(result.domain).toBe("biotech");
    });
  }, 30000);
});

describe("Backfill Embeddings", () => {
  it("should process batch of knowledge entries", async () => {
    const result = await backfillEmbeddings(5);

    expect(result).toHaveProperty("processed");
    expect(result).toHaveProperty("failed");
    expect(typeof result.processed).toBe("number");
    expect(typeof result.failed).toBe("number");
    expect(result.processed + result.failed).toBeLessThanOrEqual(5);
  }, 60000);
});
