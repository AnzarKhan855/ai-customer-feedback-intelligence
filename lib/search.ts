import { db } from "./db";

/**
 * Standard English stopwords and query boilerplate tokens.
 * Filtering these prevents non-informative filler terms from dominating
 * vector buckets and generating false-positive cosine similarity collisions.
 */
export const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing",
  "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
  "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is",
  "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no",
  "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves",
  "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so",
  "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
  "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those",
  "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're",
  "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while",
  "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
  "you're", "you've", "your", "yours", "yourself", "yourselves",
  // Common VoC inquiry framing filler terms
  "regarding", "tell", "show", "give", "please", "user", "users", "customer", "customers",
  "reporting", "saying", "feedback", "mentioning", "mentioned", "issue", "issues", "problem", "problems",
  "complaint", "complaints"
]);

/**
 * Extracts normalized, informative content tokens from input text.
 */
export function extractKeywords(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const rawTokens = normalized.split(/\s+/).filter((t) => t.length > 2);
  const filtered = rawTokens.filter((t) => !STOPWORDS.has(t));
  return filtered.length > 0 ? filtered : rawTokens;
}

/**
 * Lightweight, deterministic suffix stemming for morphological term matching.
 */
export function stemWord(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

/**
 * Portable vector embedding generation based on stopword-filtered semantic hashing
 * and dense n-gram frequencies. Produces a normalized 64-dimensional vector.
 */
export function generateEmbeddingVector(text: string): number[] {
  const DIMENSIONS = 64;
  const vector = new Array(DIMENSIONS).fill(0);
  const tokens = extractKeywords(text);

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
 * Uses hybrid semantic-lexical scoring with deduplication and relevance thresholding.
 * Strictly isolated to `workspaceId`.
 */
export async function searchSimilarFeedback(
  workspaceId: string,
  query: string,
  topK: number = 6
) {
  const queryVector = generateEmbeddingVector(query);
  const queryKeywords = extractKeywords(query);
  const queryStems = queryKeywords.map(stemWord);

  // Retrieve feedback items with their embeddings strictly scoped to this workspace
  const feedbackWithEmbeddings = await db.feedback.findMany({
    where: { workspaceId },
    include: {
      embedding: true,
      themes: { include: { theme: true } },
    },
  });

  const scored = feedbackWithEmbeddings.map((fb) => {
    let semanticScore = 0;
    if (fb.embedding?.vector) {
      try {
        const storedVector = JSON.parse(fb.embedding.vector);
        semanticScore = cosineSimilarity(queryVector, storedVector);
      } catch {
        semanticScore = 0;
      }
    }

    // Lexical term and stem overlap using discrete token sets
    const contentTokens = fb.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);
    const contentTokenSet = new Set(contentTokens);
    const contentStems = new Set(contentTokens.map(stemWord));

    let matchedKeywords = 0;
    let matchedStems = 0;
    for (const kw of queryKeywords) {
      if (contentTokenSet.has(kw)) matchedKeywords++;
    }
    for (const st of queryStems) {
      if (contentStems.has(st)) matchedStems++;
    }

    const lexicalOverlap =
      queryKeywords.length > 0
        ? (matchedKeywords * 2.0 + matchedStems * 1.0) / (queryKeywords.length * 3.0)
        : 0;

    // Suppress semantic hash collisions when lexical overlap is zero on keyword queries
    const effectiveSemantic =
      queryKeywords.length > 0 && lexicalOverlap === 0
        ? semanticScore * 0.1
        : semanticScore;

    const finalScore =
      queryKeywords.length > 0
        ? effectiveSemantic * 0.35 + lexicalOverlap * 0.65
        : semanticScore;

    return {
      feedback: fb,
      score: finalScore,
      semanticScore,
      lexicalOverlap,
    };
  });

  // Filter candidates by minimum relevance threshold (0.15) to eliminate non-relevant noise
  const relevant = scored.filter((item) => item.score >= 0.15);
  relevant.sort((a, b) => b.score - a.score);

  // Deduplicate near-identical template records
  const seenSnippets = new Set<string>();
  const deduplicated = [];
  for (const item of relevant) {
    const coreContent = item.feedback.content
      .toLowerCase()
      .replace(/^(community post|customer review|support ticket note|survey respondent|sales discovery):\s*/i, "")
      .slice(0, 50)
      .trim();
    if (!seenSnippets.has(coreContent)) {
      seenSnippets.add(coreContent);
      deduplicated.push(item);
    }
  }

  return deduplicated.slice(0, topK).map((item) => ({
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
