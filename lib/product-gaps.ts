import { db } from "@/lib/db";

export interface ProductGapItem {
  id: string;
  title: string;
  category: "PRODUCT_GAP" | "FEATURE_REQUEST" | "CUSTOMER_DESIRE" | "PAIN_POINT";
  featureArea: string;
  verbatim: string;
  feedbackId: string;
  customerLabel?: string | null;
  channel: string;
  severityScore: number;
  sentiment: string;
  createdAt: string;
}

export interface CompetitorMention {
  competitorName: string;
  verbatim: string;
  feedbackId: string;
  sentiment: string;
  customerLabel?: string | null;
  channel: string;
  context: string;
}

export interface ProductGapIntelligenceResult {
  productGaps: ProductGapItem[];
  featureRequests: ProductGapItem[];
  customerDesires: ProductGapItem[];
  painPoints: ProductGapItem[];
  competitiveSignals: CompetitorMention[];
  competitorSummary: string;
  metrics: {
    totalProductGaps: number;
    totalFeatureRequests: number;
    totalDesires: number;
    totalPainPoints: number;
    totalCompetitorMentions: number;
  };
}

const KNOWN_COMPETITORS = [
  "qualtrics", "medallia", "pendo", "sprinklr", "gainsight",
  "salesforce", "hubspot", "jira", "linear", "datadog", "mixpanel",
  "amplitude", "churnzero", "intercom", "zendesk", "productboard"
];

export function extractProductGapsFromFeedback(
  feedbackItems: Array<{
    id: string;
    content: string;
    channel: string;
    sentiment: string;
    severityScore: number;
    intent?: string | null;
    featureArea?: string | null;
    customerLabel?: string | null;
    createdAt: Date;
  }>
): ProductGapIntelligenceResult {
  const productGaps: ProductGapItem[] = [];
  const featureRequests: ProductGapItem[] = [];
  const customerDesires: ProductGapItem[] = [];
  const painPoints: ProductGapItem[] = [];
  const competitiveSignals: CompetitorMention[] = [];

  const gapKeywords = ["missing", "lack of", "doesn't support", "no option to", "unable to", "cannot export", "unsupported", "can't integrate", "not supported"];
  const requestKeywords = ["feature request", "would be great if", "can we get", "please add", "requesting", "wish we had", "suggest adding", "looking for an option"];
  const painKeywords = ["frustrating", "confusing", "hard to use", "difficult to", "slow", "broken", "impossible to", "annoying", "clunky"];
  const desireKeywords = ["would love", "hope to see", "looking forward to", "ideal if", "would appreciate", "eager for"];

  feedbackItems.forEach((f) => {
    const textLower = f.content.toLowerCase();
    const area = f.featureArea && f.featureArea.trim() ? f.featureArea.trim() : "Core Platform";
    const dateStr = new Date(f.createdAt).toISOString();

    const baseItem: ProductGapItem = {
      id: `gap-${f.id}`,
      title: f.content.slice(0, 80) + (f.content.length > 80 ? "..." : ""),
      category: "PRODUCT_GAP",
      featureArea: area,
      verbatim: f.content,
      feedbackId: f.id,
      customerLabel: f.customerLabel,
      channel: f.channel,
      severityScore: f.severityScore || 20,
      sentiment: f.sentiment,
      createdAt: dateStr,
    };

    // 1. Product Gaps
    if (gapKeywords.some((k) => textLower.includes(k))) {
      productGaps.push({ ...baseItem, category: "PRODUCT_GAP" });
    }

    // 2. Feature Requests
    if (
      f.intent === "feature_request" ||
      f.intent === "suggestion" ||
      requestKeywords.some((k) => textLower.includes(k))
    ) {
      featureRequests.push({ ...baseItem, category: "FEATURE_REQUEST" });
    }

    // 3. Customer Desires
    if (desireKeywords.some((k) => textLower.includes(k)) || (f.sentiment === "POS" && requestKeywords.some((k) => textLower.includes(k)))) {
      customerDesires.push({ ...baseItem, category: "CUSTOMER_DESIRE" });
    }

    // 4. Pain Points
    if (f.sentiment === "NEG" && (painKeywords.some((k) => textLower.includes(k)) || f.severityScore >= 60)) {
      painPoints.push({ ...baseItem, category: "PAIN_POINT" });
    }

    // 5. Competitor Mentions
    for (const comp of KNOWN_COMPETITORS) {
      if (textLower.includes(comp)) {
        competitiveSignals.push({
          competitorName: comp.charAt(0).toUpperCase() + comp.slice(1),
          verbatim: f.content,
          feedbackId: f.id,
          sentiment: f.sentiment,
          customerLabel: f.customerLabel,
          channel: f.channel,
          context: `Mentioned in connection with ${area} (${f.sentiment === "POS" ? "Favorable" : "Competitive Comparison"})`,
        });
      }
    }

    // Generic comparative phrases
    const comparativeRegex = /(switch(ed|ing)? (from|to)|evaluat(ed|ing) (against|with)|alternative to|compared to|migrat(ed|ing) from)\s+([a-zA-Z0-9_\-\.]+)/i;
    const match = f.content.match(comparativeRegex);
    if (match && match[7]) {
      const detectedName = match[7].trim();
      if (!KNOWN_COMPETITORS.includes(detectedName.toLowerCase()) && detectedName.length > 2) {
        competitiveSignals.push({
          competitorName: detectedName.charAt(0).toUpperCase() + detectedName.slice(1),
          verbatim: f.content,
          feedbackId: f.id,
          sentiment: f.sentiment,
          customerLabel: f.customerLabel,
          channel: f.channel,
          context: `Competitive migration signal: "${match[0]}"`,
        });
      }
    }
  });

  const competitorSummary =
    competitiveSignals.length > 0
      ? `${competitiveSignals.length} direct competitor benchmark mentions detected across customer signals.`
      : "No competitor evidence available.";

  return {
    productGaps: productGaps.slice(0, 20),
    featureRequests: featureRequests.slice(0, 20),
    customerDesires: customerDesires.slice(0, 20),
    painPoints: painPoints.slice(0, 20),
    competitiveSignals: competitiveSignals.slice(0, 20),
    competitorSummary,
    metrics: {
      totalProductGaps: productGaps.length,
      totalFeatureRequests: featureRequests.length,
      totalDesires: customerDesires.length,
      totalPainPoints: painPoints.length,
      totalCompetitorMentions: competitiveSignals.length,
    },
  };
}

export async function getWorkspaceProductGaps(
  workspaceId: string
): Promise<ProductGapIntelligenceResult> {
  const feedback = await db.feedback.findMany({
    where: { workspaceId },
    select: {
      id: true,
      content: true,
      channel: true,
      sentiment: true,
      severityScore: true,
      intent: true,
      featureArea: true,
      customerLabel: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return extractProductGapsFromFeedback(feedback);
}
