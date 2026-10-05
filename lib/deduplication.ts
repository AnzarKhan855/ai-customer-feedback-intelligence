import { db } from "@/lib/db";

export interface DuplicateCandidate {
  id: string;
  content: string;
  channel: string;
  customerLabel?: string | null;
  sentiment: string;
  severityScore: number;
  similarity: number;
  createdAt: Date;
}

export interface DuplicateGroup {
  groupId: string;
  primaryItem: DuplicateCandidate;
  duplicates: DuplicateCandidate[];
  duplicateCount: number;
  averageSimilarity: number;
  channels: string[];
  recommendation: string;
}

export interface DeduplicationResult {
  groups: DuplicateGroup[];
  totalDuplicatesDetected: number;
  totalUniqueClusters: number;
  potentialNoiseReductionPercentage: number;
  summary: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordTokens(text: string): Set<string> {
  const norm = normalize(text);
  const words = norm.split(" ").filter((w) => w.length > 2);
  return new Set(words);
}

export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const normA = normalize(textA);
  const normB = normalize(textB);
  if (normA === normB) return 1.0;

  const tokensA = getWordTokens(textA);
  const tokensB = getWordTokens(textB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection++;
  });

  const union = new Set<string>();
  tokensA.forEach((t) => union.add(t));
  tokensB.forEach((t) => union.add(t));
  return union.size === 0 ? 0 : Math.round((intersection / union.size) * 100) / 100;
}

export function detectDuplicates(
  items: Array<{
    id: string;
    content: string;
    channel: string;
    customerLabel?: string | null;
    sentiment: string;
    severityScore: number;
    createdAt: Date;
  }>,
  similarityThreshold = 0.70
): DeduplicationResult {
  if (!items || items.length < 2) {
    return {
      groups: [],
      totalDuplicatesDetected: 0,
      totalUniqueClusters: 0,
      potentialNoiseReductionPercentage: 0,
      summary: "Insufficient records to run deduplication analysis.",
    };
  }

  const visited = new Set<string>();
  const duplicateGroups: DuplicateGroup[] = [];

  for (let i = 0; i < items.length; i++) {
    const itemA = items[i];
    if (visited.has(itemA.id)) continue;

    const duplicates: DuplicateCandidate[] = [];
    let similaritySum = 0;

    for (let j = i + 1; j < items.length; j++) {
      const itemB = items[j];
      if (visited.has(itemB.id)) continue;

      const sim = calculateJaccardSimilarity(itemA.content, itemB.content);
      if (sim >= similarityThreshold) {
        visited.add(itemB.id);
        similaritySum += sim;
        duplicates.push({
          id: itemB.id,
          content: itemB.content,
          channel: itemB.channel,
          customerLabel: itemB.customerLabel,
          sentiment: itemB.sentiment,
          severityScore: itemB.severityScore,
          similarity: sim,
          createdAt: new Date(itemB.createdAt),
        });
      }
    }

    if (duplicates.length > 0) {
      visited.add(itemA.id);
      const avgSim = Math.round((similaritySum / duplicates.length) * 100) / 100;
      const allChannels = Array.from(
        new Set([itemA.channel, ...duplicates.map((d) => d.channel)])
      );

      duplicateGroups.push({
        groupId: `dup-${itemA.id}`,
        primaryItem: {
          id: itemA.id,
          content: itemA.content,
          channel: itemA.channel,
          customerLabel: itemA.customerLabel,
          sentiment: itemA.sentiment,
          severityScore: itemA.severityScore,
          similarity: 1.0,
          createdAt: new Date(itemA.createdAt),
        },
        duplicates,
        duplicateCount: duplicates.length,
        averageSimilarity: avgSim,
        channels: allChannels,
        recommendation: `Merge ${duplicates.length} repetitive signals into primary ticket ${itemA.id.slice(0, 8)}... to reduce triage overhead.`,
      });
    }
  }

  const totalDups = duplicateGroups.reduce((acc, g) => acc + g.duplicateCount, 0);
  const noiseReduction = Math.round((totalDups / items.length) * 100);

  return {
    groups: duplicateGroups,
    totalDuplicatesDetected: totalDups,
    totalUniqueClusters: duplicateGroups.length,
    potentialNoiseReductionPercentage: noiseReduction,
    summary: `Identified ${totalDups} near-duplicate customer records across ${duplicateGroups.length} unique incident clusters (${noiseReduction}% potential noise reduction).`,
  };
}

export async function getWorkspaceDuplicates(
  workspaceId: string,
  limit = 250
): Promise<DeduplicationResult> {
  const items = await db.feedback.findMany({
    where: { workspaceId },
    select: {
      id: true,
      content: true,
      channel: true,
      customerLabel: true,
      sentiment: true,
      severityScore: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return detectDuplicates(items);
}
