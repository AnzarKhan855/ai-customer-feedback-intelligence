import { db } from "./db";

/**
 * Portable vector embedding generation based on semantic hashing and dense n-gram frequencies.
 * Produces a normalized 64-dimensional vector for fast cosine similarity.
 */
export function generateEmbeddingVector(text: string): number[] {
  const DIMENSIONS = 64;
  const vector = new Array(DIMENSIONS).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 1);

  if (tokens.length === 0) {
    return vector;
  }

  // Calculate token hashes and n-grams
  tokens.forEach((token, idx) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % DIMENSIONS;
    const weight = 1.0 + 1.0 / (idx + 1); // slight positional bias
    vector[bucket] += weight;

    // Bigrams for richer context
    if (idx < tokens.length - 1) {
      const bigram = `${token}_${tokens[idx + 1]}`;
      let biHash = 0;
      for (let j = 0; j < bigram.length; j++) {
        biHash = (biHash << 5) - biHash + bigram.charCodeAt(j);
        biHash |= 0;
      }
      const biBucket = Math.abs(biHash) % DIMENSIONS;
      vector[biBucket] += 1.5;
    }
  });

  // Normalize vector to unit length for cosine similarity
  let norm = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < DIMENSIONS; i++) {
      vector[i] = Math.round((vector[i] / norm) * 10000) / 10000;
    }
  }

  return vector;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Searches for top-K feedback items in a tenant workspace matching the user's question.
 * Guaranteed strictly isolated to `workspaceId`.
 */
export async function searchSimilarFeedback(
  workspaceId: string,
  query: string,
  topK: number = 6
) {
  const queryVector = generateEmbeddingVector(query);

  // Retrieve feedback items with their embeddings strictly scoped to this workspace
  const feedbackWithEmbeddings = await db.feedback.findMany({
    where: { workspaceId },
    include: {
      embedding: true,
      themes: { include: { theme: true } },
    },
  });

  const scored = feedbackWithEmbeddings.map((fb) => {
    let score = 0;
    if (fb.embedding?.vector) {
      try {
        const storedVector = JSON.parse(fb.embedding.vector);
        score = cosineSimilarity(queryVector, storedVector);
      } catch {
        score = 0;
      }
    } else {
      // Fallback keyword scoring if embedding was not yet created
      const contentLower = fb.content.toLowerCase();
      const queryTokens = query.toLowerCase().split(/\s+/);
      const matches = queryTokens.filter((t) => t.length > 2 && contentLower.includes(t));
      score = matches.length / (queryTokens.length || 1);
    }

    return {
      feedback: fb,
      score,
    };
  });

  // Sort descending by similarity score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((item) => ({
    id: item.feedback.id,
    content: item.feedback.content,
    channel: item.feedback.channel,
    sentiment: item.feedback.sentiment,
    sentimentScore: item.feedback.sentimentScore,
    customerLabel: item.feedback.customerLabel || undefined,
    score: Math.round(item.score * 100) / 100,
    themes: item.feedback.themes.map((t) => t.theme.name),
  }));
}
