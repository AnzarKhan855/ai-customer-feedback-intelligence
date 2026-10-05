import { db } from "@/lib/db";

export interface ClusterVerbatim {
  id: string;
  content: string;
  channel: string;
  customerLabel?: string | null;
  sentiment: string;
  severityScore: number;
  intent?: string | null;
  createdAt: Date;
}

export interface FeedbackCluster {
  id: string;
  name: string;
  primaryArea: string;
  size: number;
  percentageOfTotal: number;
  avgSeverity: number;
  churnRiskCount: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topKeywords: string[];
  topIntents: string[];
  trend: "SURGING" | "STABLE" | "RESOLVING";
  verbatimSamples: ClusterVerbatim[];
}

export interface ClusterExplorerResult {
  clusters: FeedbackCluster[];
  totalFeedbackAnalyzed: number;
  totalClustersDiscovered: number;
  summary: string;
}

// Stopwords for cluster keyword extraction
const STOPWORDS = new Set([
  "the", "and", "a", "an", "in", "on", "at", "to", "for", "of", "with", "is",
  "are", "was", "were", "it", "this", "that", "i", "we", "my", "our", "you",
  "your", "have", "has", "had", "be", "been", "not", "but", "so", "as", "if",
  "or", "from", "by", "about", "into", "can", "will", "all", "very", "when"
]);

function extractTopKeywords(texts: string[], topK = 5): string[] {
  const counts = new Map<string, number>();

  texts.forEach((text) => {
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3 && !STOPWORDS.has(t));

    tokens.forEach((t) => {
      counts.set(t, (counts.get(t) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([word]) => word);
}

export function discoverFeedbackClusters(
  feedbackItems: Array<{
    id: string;
    content: string;
    channel: string;
    customerLabel?: string | null;
    sentiment: string;
    severityScore: number;
    featureArea?: string | null;
    intent?: string | null;
    churnRiskSignal: boolean;
    detectedEntities?: string | null;
    createdAt: Date;
  }>
): ClusterExplorerResult {
  if (!feedbackItems || feedbackItems.length === 0) {
    return {
      clusters: [],
      totalFeedbackAnalyzed: 0,
      totalClustersDiscovered: 0,
      summary: "No customer feedback available to extract topic clusters.",
    };
  }

  // Group items by featureArea or primary thematic affinity
  const groups = new Map<string, typeof feedbackItems>();

  feedbackItems.forEach((item) => {
    let key = "Core Platform";
    if (item.featureArea && item.featureArea.trim() && item.featureArea.trim().toLowerCase() !== "general") {
      key = item.featureArea.trim();
    } else if (item.intent === "billing_issue" || item.intent === "refund_request" || /billing|invoice|refund|payment/i.test(item.content)) {
      key = "Billing & Payments";
    } else if (/login|auth|sso|password|session/i.test(item.content)) {
      key = "Authentication & Access";
    } else if (/slow|latency|timeout|crash|down/i.test(item.content)) {
      key = "Performance & Reliability";
    } else if (/export|report|csv|pdf|chart/i.test(item.content)) {
      key = "Reporting & Analytics";
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  });

  const total = feedbackItems.length;
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const clusters: FeedbackCluster[] = [];

  groups.forEach((items, area) => {
    const size = items.length;
    const avgSeverity = Math.round(
      items.reduce((acc, i) => acc + (i.severityScore || 20), 0) / size
    );
    const churnRiskCount = items.filter((i) => i.churnRiskSignal).length;

    // Sentiment breakdown
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    items.forEach((i) => {
      const s = (i.sentiment || "").toUpperCase();
      if (s.startsWith("POS")) positive++;
      else if (s.startsWith("NEG")) negative++;
      else neutral++;
    });

    // Top keywords
    const keywords = extractTopKeywords(items.map((i) => i.content), 5);

    // Top intents
    const intentCounts = new Map<string, number>();
    items.forEach((i) => {
      if (i.intent) {
        intentCounts.set(i.intent, (intentCounts.get(i.intent) || 0) + 1);
      }
    });
    const topIntents = Array.from(intentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([intent]) => intent);

    // Trend calculation based on age of feedback
    const recentItems = items.filter((i) => now - new Date(i.createdAt).getTime() < ONE_WEEK_MS * 2).length;
    let trend: "SURGING" | "STABLE" | "RESOLVING" = "STABLE";
    if (recentItems / size >= 0.6 && size >= 3) {
      trend = "SURGING";
    } else if (recentItems / size <= 0.2 && size >= 3) {
      trend = "RESOLVING";
    }

    const clusterId = `cluster-${area.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

    clusters.push({
      id: clusterId,
      name: `${area} Topic Cluster`,
      primaryArea: area,
      size,
      percentageOfTotal: Math.round((size / total) * 100),
      avgSeverity,
      churnRiskCount,
      sentimentDistribution: { positive, neutral, negative },
      topKeywords: keywords,
      topIntents,
      trend,
      verbatimSamples: items.slice(0, 4).map((i) => ({
        id: i.id,
        content: i.content,
        channel: i.channel,
        customerLabel: i.customerLabel,
        sentiment: i.sentiment,
        severityScore: i.severityScore,
        intent: i.intent,
        createdAt: new Date(i.createdAt),
      })),
    });
  });

  // Sort clusters by size descending
  clusters.sort((a, b) => b.size - a.size);

  return {
    clusters,
    totalFeedbackAnalyzed: total,
    totalClustersDiscovered: clusters.length,
    summary: `Discovered ${clusters.length} cohesive thematic clusters across ${total} customer feedback records.`,
  };
}

export async function getWorkspaceFeedbackClusters(
  workspaceId: string,
  limit = 400
): Promise<ClusterExplorerResult> {
  const items = await db.feedback.findMany({
    where: { workspaceId },
    select: {
      id: true,
      content: true,
      channel: true,
      customerLabel: true,
      sentiment: true,
      severityScore: true,
      featureArea: true,
      intent: true,
      churnRiskSignal: true,
      detectedEntities: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return discoverFeedbackClusters(items);
}
