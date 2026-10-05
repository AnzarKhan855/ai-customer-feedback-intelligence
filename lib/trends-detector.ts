import { db } from "@/lib/db";

export type TrendStatus = "EMERGING" | "STABLE" | "DECLINING";

export interface DetectedTrend {
  topic: string;
  category: "FEATURE_AREA" | "THEME" | "CHURN_RISK" | "CHANNEL_SURGE";
  status: TrendStatus;
  magnitudePct: number;
  currentPeriodCount: number;
  priorPeriodCount: number;
  severityScore: number;
  confidence: number;
  description: string;
  affectedChannels: string[];
  evidenceSnippets: Array<{
    id: string;
    content: string;
    channel: string;
    severityScore: number;
    createdAt: string;
  }>;
}

export interface TrendAnalysisResult {
  hasSufficientData: boolean;
  totalAnalyzed: number;
  timeWindowDays: number;
  trends: DetectedTrend[];
  anomalies: string[];
}

export function detectTrendsFromFeedback(
  feedbackItems: Array<{
    id: string;
    content: string;
    channel: string;
    sentiment: string;
    severityScore: number;
    featureArea?: string | null;
    churnRiskSignal: boolean;
    createdAt: Date;
  }>,
  windowDays: number = 30
): TrendAnalysisResult {
  const total = feedbackItems.length;

  if (total < 4) {
    return {
      hasSufficientData: false,
      totalAnalyzed: total,
      timeWindowDays: windowDays,
      trends: [],
      anomalies: ["Insufficient feedback volume to establish statistical trends (minimum 4 records required)."],
    };
  }

  const now = new Date().getTime();
  const halfWindowMs = (windowDays / 2) * 24 * 60 * 60 * 1000;
  const fullWindowMs = windowDays * 24 * 60 * 60 * 1000;
  const midpoint = now - halfWindowMs;
  const cutoff = now - fullWindowMs;

  const currentWindowItems = feedbackItems.filter(
    (f) => new Date(f.createdAt).getTime() >= midpoint
  );
  const priorWindowItems = feedbackItems.filter(
    (f) =>
      new Date(f.createdAt).getTime() < midpoint &&
      new Date(f.createdAt).getTime() >= cutoff
  );

  // Group by topic/feature area
  const areaGroups = new Map<
    string,
    {
      current: typeof feedbackItems;
      prior: typeof feedbackItems;
    }
  >();

  const getArea = (f: (typeof feedbackItems)[0]) =>
    f.featureArea && f.featureArea.trim() && f.featureArea !== "General"
      ? f.featureArea.trim()
      : "Core Platform";

  currentWindowItems.forEach((f) => {
    const area = getArea(f);
    if (!areaGroups.has(area)) areaGroups.set(area, { current: [], prior: [] });
    areaGroups.get(area)!.current.push(f);
  });

  priorWindowItems.forEach((f) => {
    const area = getArea(f);
    if (!areaGroups.has(area)) areaGroups.set(area, { current: [], prior: [] });
    areaGroups.get(area)!.prior.push(f);
  });

  const trends: DetectedTrend[] = [];
  const anomalies: string[] = [];

  areaGroups.forEach((data, area) => {
    const curCount = data.current.length;
    const priCount = data.prior.length;
    const totalArea = curCount + priCount;

    if (totalArea < 2) return;

    let magnitudePct = 0;
    if (priCount === 0) {
      magnitudePct = curCount * 100;
    } else {
      magnitudePct = Math.round(((curCount - priCount) / priCount) * 100);
    }

    let status: TrendStatus = "STABLE";
    if (priCount === 0 && curCount >= 2) {
      status = "EMERGING";
    } else if (magnitudePct >= 35 && curCount >= 2) {
      status = "EMERGING";
    } else if (magnitudePct <= -20 && priCount >= 2) {
      status = "DECLINING";
    }

    // Severity & channels
    const allAreaItems = [...data.current, ...data.prior];
    const avgSeverity = Math.round(
      allAreaItems.reduce((acc, i) => acc + (i.severityScore || 20), 0) /
        allAreaItems.length
    );

    const channels = Array.from(new Set(allAreaItems.map((i) => i.channel)));
    const confidence = Math.min(
      0.95,
      Number((0.65 + totalArea * 0.04).toFixed(2))
    );

    let description = "";
    if (status === "EMERGING") {
      description = `Volume surge of +${magnitudePct}% detected in ${area}. ${curCount} customer complaints logged in recent period vs ${priCount} previously.`;
    } else if (status === "DECLINING") {
      description = `Friction reports for ${area} decreased by ${Math.abs(magnitudePct)}% (${curCount} recent vs ${priCount} previously).`;
    } else {
      description = `Feedback volume for ${area} remains stable (${curCount} recent vs ${priCount} previously).`;
    }

    trends.push({
      topic: area,
      category: "FEATURE_AREA",
      status,
      magnitudePct,
      currentPeriodCount: curCount,
      priorPeriodCount: priCount,
      severityScore: avgSeverity,
      confidence,
      description,
      affectedChannels: channels,
      evidenceSnippets: allAreaItems.slice(0, 3).map((i) => ({
        id: i.id,
        content: i.content,
        channel: i.channel,
        severityScore: i.severityScore,
        createdAt: new Date(i.createdAt).toISOString(),
      })),
    });
  });

  // Check for Churn Signal surge
  const curChurn = currentWindowItems.filter((f) => f.churnRiskSignal).length;
  const priChurn = priorWindowItems.filter((f) => f.churnRiskSignal).length;
  if (curChurn > 0) {
    const churnDelta = priChurn === 0 ? curChurn * 100 : Math.round(((curChurn - priChurn) / priChurn) * 100);
    if (churnDelta >= 25 || curChurn >= 3) {
      anomalies.push(
        `High Churn Risk Surge: ${curChurn} cancellation/refund signals detected recently (vs ${priChurn} in prior window).`
      );
    }
  }

  // Sort trends: EMERGING first, then by magnitude descending
  trends.sort((a, b) => {
    if (a.status === "EMERGING" && b.status !== "EMERGING") return -1;
    if (b.status === "EMERGING" && a.status !== "EMERGING") return 1;
    return b.magnitudePct - a.magnitudePct;
  });

  return {
    hasSufficientData: true,
    totalAnalyzed: total,
    timeWindowDays: windowDays,
    trends,
    anomalies,
  };
}

export async function getWorkspaceFeedbackTrends(
  workspaceId: string,
  days: number = 30
): Promise<TrendAnalysisResult> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const feedback = await db.feedback.findMany({
    where: {
      workspaceId,
      createdAt: { gte: cutoff },
    },
    select: {
      id: true,
      content: true,
      channel: true,
      sentiment: true,
      severityScore: true,
      featureArea: true,
      churnRiskSignal: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // If filtered set has too few, fallback to overall recent feedback
  if (feedback.length < 4) {
    const allRecent = await db.feedback.findMany({
      where: { workspaceId },
      select: {
        id: true,
        content: true,
        channel: true,
        sentiment: true,
        severityScore: true,
        featureArea: true,
        churnRiskSignal: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return detectTrendsFromFeedback(allRecent, days);
  }

  return detectTrendsFromFeedback(feedback, days);
}
