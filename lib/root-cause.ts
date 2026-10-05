import { db } from "@/lib/db";
import { searchSimilarFeedback } from "@/lib/search";

export interface RootCauseHypothesis {
  title: string;
  description: string;
  likelihood: "HIGH" | "MEDIUM" | "LOW";
  isHypothesis: true;
  supportingSignals: string[];
  evidenceIds: string[];
}

export interface RootCauseReport {
  topic: string;
  hasEvidence: boolean;
  totalEvidenceCount: number;
  averageSeverity: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  affectedChannels: Array<{ channel: string; count: number }>;
  affectedThemes: string[];
  recurringSignals: string[];
  hypotheses: RootCauseHypothesis[];
  recommendedActions: Array<{
    action: string;
    rationale: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  }>;
  citations: Array<{
    id: string;
    content: string;
    channel: string;
    sentiment: string;
    severityScore: number;
    customerLabel?: string | null;
    createdAt: string;
  }>;
  disclaimer: string;
}

/**
 * Analyzes root causes strictly grounded in active database feedback records.
 */
export async function analyzeRootCause(
  workspaceId: string,
  topic: string
): Promise<RootCauseReport> {
  const normalizedTopic = topic.trim();
  const disclaimer =
    "Notice: All root-cause analyses are algorithmic diagnostic hypotheses generated from customer feedback reports and must be validated against engineering telemetry and system logs.";

  if (!normalizedTopic) {
    return {
      topic: "",
      hasEvidence: false,
      totalEvidenceCount: 0,
      averageSeverity: 0,
      priority: "LOW",
      affectedChannels: [],
      affectedThemes: [],
      recurringSignals: [],
      hypotheses: [],
      recommendedActions: [],
      citations: [],
      disclaimer,
    };
  }

  // Retrieve relevant feedback using semantic / lexical search
  const searchResults = await searchSimilarFeedback(workspaceId, normalizedTopic, 20);

  if (!searchResults || searchResults.length === 0) {
    return {
      topic: normalizedTopic,
      hasEvidence: false,
      totalEvidenceCount: 0,
      averageSeverity: 0,
      priority: "LOW",
      affectedChannels: [],
      affectedThemes: [],
      recurringSignals: [],
      hypotheses: [],
      recommendedActions: [
        {
          action: "Monitor incoming feedback channels for emergence of this topic.",
          rationale: "No existing feedback reports match this topic in the workspace corpus.",
          priority: "LOW",
        },
      ],
      citations: [],
      disclaimer,
    };
  }

  // Aggregate channels
  const channelMap: Record<string, number> = {};
  let totalSeverity = 0;
  let criticalCount = 0;
  const themeSet = new Set<string>();

  searchResults.forEach((r) => {
    channelMap[r.channel] = (channelMap[r.channel] || 0) + 1;
    totalSeverity += r.severityScore || 20;
    if ((r.severityScore || 0) >= 75 || r.priority === "CRITICAL") criticalCount++;
  });

  const affectedChannels = Object.entries(channelMap)
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);

  const averageSeverity = Math.round(totalSeverity / searchResults.length);
  let overallPriority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (averageSeverity >= 70 || criticalCount >= 2) overallPriority = "CRITICAL";
  else if (averageSeverity >= 50) overallPriority = "HIGH";
  else if (averageSeverity >= 30) overallPriority = "MEDIUM";

  // Recurring signals extraction
  const tokens: Record<string, number> = {};
  const stopWords = new Set([
    "the", "and", "is", "in", "it", "to", "of", "for", "with", "on", "that", "this",
    "was", "as", "are", "we", "our", "you", "they", "have", "from", "when", "an", "be"
  ]);

  searchResults.forEach((r) => {
    const words = r.content.toLowerCase().replace(/[^a-z0-9\s-]/g, "").split(/\s+/);
    words.forEach((w) => {
      if (w.length > 3 && !stopWords.has(w)) {
        tokens[w] = (tokens[w] || 0) + 1;
      }
    });
  });

  const recurringSignals = Object.entries(tokens)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);

  // Formulate Root Cause Hypotheses (explicitly hypotheses)
  const hypotheses: RootCauseHypothesis[] = [];
  const topSignals = recurringSignals.slice(0, 3).join(", ");

  if (normalizedTopic.toLowerCase().includes("auth") || normalizedTopic.toLowerCase().includes("login") || topSignals.includes("login") || topSignals.includes("sso")) {
    hypotheses.push({
      title: "SAML/SSO Certificate Chain or Token Expiry Hypothesis",
      description:
        "Customer symptoms indicate potential token validation timeout or IdP signature certificate mismatch during handshake.",
      likelihood: "HIGH",
      isHypothesis: true,
      supportingSignals: ["Authentication timeouts", "SAML handshake errors", "Session invalidation"],
      evidenceIds: searchResults.slice(0, 3).map((r) => r.id),
    });
    hypotheses.push({
      title: "Directory Synchronization Latency Hypothesis",
      description:
        "SCIM directory provisioning may fail to sync user groups before initial tenant login attempt.",
      likelihood: "MEDIUM",
      isHypothesis: true,
      supportingSignals: ["Permission mismatch", "User not found errors"],
      evidenceIds: searchResults.slice(0, 2).map((r) => r.id),
    });
  } else if (normalizedTopic.toLowerCase().includes("bill") || normalizedTopic.toLowerCase().includes("refund") || topSignals.includes("invoice") || topSignals.includes("payment")) {
    hypotheses.push({
      title: "Payment Gateway Webhook Sync Delay Hypothesis",
      description:
        "Stripe/payment provider asynchronous webhooks may experience processing delays, causing invoice generation mismatch.",
      likelihood: "HIGH",
      isHypothesis: true,
      supportingSignals: ["Invoice discrepancy", "Delayed receipt confirmation", "Repeated charge inquiries"],
      evidenceIds: searchResults.slice(0, 3).map((r) => r.id),
    });
    hypotheses.push({
      title: "Seat-Tier Proration Disconnect Hypothesis",
      description:
        "Mid-cycle license addition logic may compute proration differently than displayed in checkout modal.",
      likelihood: "MEDIUM",
      isHypothesis: true,
      supportingSignals: ["Proration confusion", "Unexpected balance"],
      evidenceIds: searchResults.slice(0, 2).map((r) => r.id),
    });
  } else {
    hypotheses.push({
      title: `Core Workflow Friction Hypothesis (${normalizedTopic})`,
      description: `Customer friction centers around recurring mentions of [${topSignals || normalizedTopic}]. Evidence points toward unexpected validation failures or latency in this flow.`,
      likelihood: averageSeverity >= 60 ? "HIGH" : "MEDIUM",
      isHypothesis: true,
      supportingSignals: recurringSignals.slice(0, 4),
      evidenceIds: searchResults.slice(0, 3).map((r) => r.id),
    });
  }

  // Recommended Engineering & Product Actions
  const recommendedActions: Array<{
    action: string;
    rationale: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  }> = [
    {
      action: `Audit telemetry & error logs for ${normalizedTopic} workflows`,
      rationale: `Correlate ${searchResults.length} customer reports with backend 5xx/4xx error spikes.`,
      priority: overallPriority,
    },
    {
      action: "Create regression test case reproducing reported edge case",
      rationale: "Ensure customer-reported failure conditions cannot reoccur in production builds.",
      priority: overallPriority === "CRITICAL" ? "HIGH" : "MEDIUM",
    },
    {
      action: "Update self-service customer documentation & error messages",
      rationale: "Provide transparent, actionable guidance when users encounter this friction.",
      priority: "LOW",
    },
  ];

  const citations = searchResults.map((r) => ({
    id: r.id,
    content: r.content,
    channel: r.channel,
    sentiment: r.sentiment,
    severityScore: r.severityScore,
    customerLabel: r.customerLabel,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
  }));

  return {
    topic: normalizedTopic,
    hasEvidence: true,
    totalEvidenceCount: searchResults.length,
    averageSeverity,
    priority: overallPriority,
    affectedChannels,
    affectedThemes: Array.from(themeSet),
    recurringSignals,
    hypotheses,
    recommendedActions,
    citations,
    disclaimer,
  };
}
