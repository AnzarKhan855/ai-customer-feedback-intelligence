import { db } from "@/lib/db";

export interface FeedbackSignal {
  id: string;
  customerLabel?: string | null;
  sentiment: string;
  sentimentScore: number;
  severityScore: number;
  priority: string;
  status: string;
  churnRiskSignal: boolean;
  featureArea?: string | null;
  content: string;
  createdAt: Date;
}

export type HealthTier = "HEALTHY" | "AT_RISK" | "CRITICAL";

export interface HealthScoreResult {
  score: number;
  tier: HealthTier;
  reasons: string[];
  positiveDrivers: string[];
  signals: {
    totalFeedback: number;
    negativeCount: number;
    positiveCount: number;
    neutralCount: number;
    criticalCount: number;
    unresolvedCriticalCount: number;
    churnRiskCount: number;
    recurringFrictionCount: number;
  };
  accounts: Array<{
    customerLabel: string;
    score: number;
    tier: HealthTier;
    feedbackCount: number;
    churnSignals: number;
    criticalCount: number;
    reasons: string[];
  }>;
  featureAreaHealth: Array<{
    area: string;
    healthScore: number;
    tier: HealthTier;
    totalSignals: number;
    negativeCount: number;
  }>;
}

/**
 * Pure calculation function for Customer Health Intelligence.
 * Derived strictly from real customer feedback signals without hallucinated metrics.
 */
export function calculateCustomerHealth(feedbackList: FeedbackSignal[]): HealthScoreResult {
  if (!feedbackList || feedbackList.length === 0) {
    return {
      score: 100,
      tier: "HEALTHY",
      reasons: ["No negative feedback or risk signals recorded in current period."],
      positiveDrivers: ["Zero customer complaints or churn risks detected."],
      signals: {
        totalFeedback: 0,
        negativeCount: 0,
        positiveCount: 0,
        neutralCount: 0,
        criticalCount: 0,
        unresolvedCriticalCount: 0,
        churnRiskCount: 0,
        recurringFrictionCount: 0,
      },
      accounts: [],
      featureAreaHealth: [],
    };
  }

  const total = feedbackList.length;
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let criticalCount = 0;
  let unresolvedCriticalCount = 0;
  let churnRiskCount = 0;

  // Group by account
  const accountMap = new Map<string, FeedbackSignal[]>();
  // Group by feature area
  const areaMap = new Map<string, FeedbackSignal[]>();

  feedbackList.forEach((f) => {
    if (f.sentiment === "POS") positiveCount++;
    else if (f.sentiment === "NEG") negativeCount++;
    else neutralCount++;

    const isCritical = f.priority === "CRITICAL" || f.severityScore >= 75;
    if (isCritical) {
      criticalCount++;
      if (f.status !== "ACTIONED") {
        unresolvedCriticalCount++;
      }
    }

    if (f.churnRiskSignal) {
      churnRiskCount++;
    }

    if (f.customerLabel && f.customerLabel.trim()) {
      const key = f.customerLabel.trim();
      if (!accountMap.has(key)) accountMap.set(key, []);
      accountMap.get(key)!.push(f);
    }

    const area = f.featureArea && f.featureArea.trim() ? f.featureArea.trim() : "General";
    if (!areaMap.has(area)) areaMap.set(area, []);
    areaMap.get(area)!.push(f);
  });

  // Calculate area recurrence penalties
  const recurringAreas: string[] = [];
  areaMap.forEach((items, area) => {
    const negInArea = items.filter((i) => i.sentiment === "NEG").length;
    if (negInArea >= 3 && area !== "General") {
      recurringAreas.push(area);
    }
  });

  // Penalties
  const negRatio = negativeCount / total;
  const sentimentPenalty = Math.min(30, Math.round(negRatio * 35));
  const severityPenalty = Math.min(25, unresolvedCriticalCount * 8);
  const churnPenalty = Math.min(25, churnRiskCount * 9);
  const recurrencePenalty = Math.min(20, recurringAreas.length * 6);

  const rawScore = 100 - sentimentPenalty - severityPenalty - churnPenalty - recurrencePenalty;
  const score = Math.max(0, Math.min(100, rawScore));

  let tier: HealthTier = "HEALTHY";
  if (score < 40) tier = "CRITICAL";
  else if (score < 70) tier = "AT_RISK";

  // Explainable reasons (Why this score?)
  const reasons: string[] = [];
  if (negativeCount > 0) {
    const pct = Math.round(negRatio * 100);
    reasons.push(`${pct}% of customer feedback is negative (${negativeCount} issues).`);
  }
  if (unresolvedCriticalCount > 0) {
    reasons.push(`${unresolvedCriticalCount} unresolved critical severity issues pending triage.`);
  }
  if (churnRiskCount > 0) {
    reasons.push(`${churnRiskCount} explicit churn-risk signals detected (cancellation/refund mentions).`);
  }
  if (recurringAreas.length > 0) {
    reasons.push(`Recurring complaint concentration in ${recurringAreas.join(", ")}.`);
  }
  if (reasons.length === 0) {
    reasons.push("Customer sentiment is predominantly positive with low friction.");
  }

  // Positive drivers
  const positiveDrivers: string[] = [];
  if (positiveCount > 0) {
    const posPct = Math.round((positiveCount / total) * 100);
    positiveDrivers.push(`${posPct}% of feedback reflects customer satisfaction (${positiveCount} positive signals).`);
  }
  if (unresolvedCriticalCount === 0) {
    positiveDrivers.push("Zero unresolved critical severity incidents.");
  }
  if (churnRiskCount === 0) {
    positiveDrivers.push("Zero churn-risk signals detected across monitored channels.");
  }

  // Calculate per-account breakdown
  const accounts = Array.from(accountMap.entries()).map(([customerLabel, items]) => {
    const accTotal = items.length;
    const accNeg = items.filter((i) => i.sentiment === "NEG").length;
    const accCrit = items.filter((i) => (i.priority === "CRITICAL" || i.severityScore >= 75) && i.status !== "ACTIONED").length;
    const accChurn = items.filter((i) => i.churnRiskSignal).length;

    let accScore = 100;
    accScore -= Math.min(40, Math.round((accNeg / accTotal) * 45));
    accScore -= Math.min(30, accCrit * 15);
    accScore -= Math.min(30, accChurn * 15);
    accScore = Math.max(0, Math.min(100, accScore));

    let accTier: HealthTier = "HEALTHY";
    if (accScore < 40) accTier = "CRITICAL";
    else if (accScore < 70) accTier = "AT_RISK";

    const accReasons: string[] = [];
    if (accNeg > 0) accReasons.push(`${Math.round((accNeg / accTotal) * 100)}% negative sentiment`);
    if (accCrit > 0) accReasons.push(`${accCrit} unresolved critical items`);
    if (accChurn > 0) accReasons.push(`${accChurn} churn indicators`);
    if (accReasons.length === 0) accReasons.push("Stable account with positive sentiment");

    return {
      customerLabel,
      score: accScore,
      tier: accTier,
      feedbackCount: accTotal,
      churnSignals: accChurn,
      criticalCount: accCrit,
      reasons: accReasons,
    };
  }).sort((a, b) => a.score - b.score);

  // Calculate feature area health
  const featureAreaHealth = Array.from(areaMap.entries()).map(([area, items]) => {
    const areaTotal = items.length;
    const areaNeg = items.filter((i) => i.sentiment === "NEG").length;
    const areaCrit = items.filter((i) => i.priority === "CRITICAL" || i.severityScore >= 75).length;

    let areaScore = 100;
    areaScore -= Math.min(50, Math.round((areaNeg / areaTotal) * 50));
    areaScore -= Math.min(50, areaCrit * 15);
    areaScore = Math.max(0, Math.min(100, areaScore));

    let areaTier: HealthTier = "HEALTHY";
    if (areaScore < 40) areaTier = "CRITICAL";
    else if (areaScore < 70) areaTier = "AT_RISK";

    return {
      area,
      healthScore: areaScore,
      tier: areaTier,
      totalSignals: areaTotal,
      negativeCount: areaNeg,
    };
  }).sort((a, b) => a.healthScore - b.healthScore);

  return {
    score,
    tier,
    reasons,
    positiveDrivers,
    signals: {
      totalFeedback: total,
      negativeCount,
      positiveCount,
      neutralCount,
      criticalCount,
      unresolvedCriticalCount,
      churnRiskCount,
      recurringFrictionCount: recurringAreas.length,
    },
    accounts,
    featureAreaHealth,
  };
}

export async function getWorkspaceCustomerHealth(workspaceId: string): Promise<HealthScoreResult> {
  const feedback = await db.feedback.findMany({
    where: { workspaceId },
    select: {
      id: true,
      customerLabel: true,
      sentiment: true,
      sentimentScore: true,
      severityScore: true,
      priority: true,
      status: true,
      churnRiskSignal: true,
      featureArea: true,
      content: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return calculateCustomerHealth(feedback);
}
