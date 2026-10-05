import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const allFeedback = await db.feedback.findMany({
      where: {
        workspaceId,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        themes: { include: { theme: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const currentPeriodItems = allFeedback.filter((f) => new Date(f.createdAt) >= sevenDaysAgo);
    const previousPeriodItems = allFeedback.filter(
      (f) => new Date(f.createdAt) >= fourteenDaysAgo && new Date(f.createdAt) < sevenDaysAgo
    );

    // 1. Comparative Analytics: Current Period (7d) vs Previous Period (7d)
    const currentTotal = currentPeriodItems.length;
    const previousTotal = previousPeriodItems.length;
    const volumeChangePct =
      previousTotal === 0
        ? currentTotal > 0 ? 100 : 0
        : Math.round(((currentTotal - previousTotal) / previousTotal) * 100);

    const currentNegCount = currentPeriodItems.filter((f) => f.sentiment === "NEG").length;
    const previousNegCount = previousPeriodItems.filter((f) => f.sentiment === "NEG").length;
    const currentNegPct = currentTotal > 0 ? Math.round((currentNegCount / currentTotal) * 100) : 0;
    const previousNegPct = previousTotal > 0 ? Math.round((previousNegCount / previousTotal) * 100) : 0;

    const currentPosCount = currentPeriodItems.filter((f) => f.sentiment === "POS").length;
    const previousPosCount = previousPeriodItems.filter((f) => f.sentiment === "POS").length;
    const currentPosPct = currentTotal > 0 ? Math.round((currentPosCount / currentTotal) * 100) : 0;
    const previousPosPct = previousTotal > 0 ? Math.round((previousPosCount / previousTotal) * 100) : 0;

    const comparative = {
      currentPeriod: {
        total: currentTotal,
        positivePct: currentPosPct,
        negativePct: currentNegPct,
        criticalCount: currentPeriodItems.filter((f) => f.priority === "CRITICAL").length,
      },
      previousPeriod: {
        total: previousTotal,
        positivePct: previousPosPct,
        negativePct: previousNegPct,
        criticalCount: previousPeriodItems.filter((f) => f.priority === "CRITICAL").length,
      },
      shifts: {
        volumeGrowthPct: volumeChangePct,
        negativeShiftPct: currentNegPct - previousNegPct,
        positiveShiftPct: currentPosPct - previousPosPct,
      },
    };

    // 2. Trend & Velocity Detection by Topic
    const themeVelocity: Record<
      string,
      { current: number; previous: number; negative: number; positive: number }
    > = {};

    for (const f of allFeedback) {
      const isCurrent = new Date(f.createdAt) >= sevenDaysAgo;
      const isPrevious = new Date(f.createdAt) >= fourteenDaysAgo && new Date(f.createdAt) < sevenDaysAgo;

      for (const ft of f.themes) {
        const name = ft.theme.name;
        if (!themeVelocity[name]) {
          themeVelocity[name] = { current: 0, previous: 0, negative: 0, positive: 0 };
        }
        if (isCurrent) themeVelocity[name].current++;
        if (isPrevious) themeVelocity[name].previous++;
        if (f.sentiment === "NEG") themeVelocity[name].negative++;
        if (f.sentiment === "POS") themeVelocity[name].positive++;
      }
    }

    const trends = Object.entries(themeVelocity).map(([topic, counts]) => {
      let growthPct = 0;
      if (counts.previous === 0) growthPct = counts.current > 0 ? 100 : 0;
      else growthPct = Math.round(((counts.current - counts.previous) / counts.previous) * 100);

      let trendState: "increasing" | "decreasing" | "stable" | "emerging" = "stable";
      if (counts.previous === 0 && counts.current >= 2) trendState = "emerging";
      else if (growthPct >= 30) trendState = "increasing";
      else if (growthPct <= -30) trendState = "decreasing";

      return {
        topic,
        currentCount: counts.current,
        previousCount: counts.previous,
        growthPct,
        trendState,
        negativeCount: counts.negative,
        positiveCount: counts.positive,
      };
    });

    // 3. Anomaly Detection
    const anomalies: {
      type: string;
      severity: "CRITICAL" | "HIGH" | "MEDIUM";
      description: string;
      metric: string;
      detectedAt: string;
    }[] = [];

    // Check negative surge
    if (currentNegPct - previousNegPct >= 15 && currentTotal >= 5) {
      anomalies.push({
        type: "NEGATIVE_SENTIMENT_SURGE",
        severity: "CRITICAL",
        description: `Negative feedback surged by +${currentNegPct - previousNegPct}% week-over-week.`,
        metric: `${currentNegPct}% vs ${previousNegPct}% previously`,
        detectedAt: now.toISOString(),
      });
    }

    // Check theme spikes (>50% surge with >=3 items)
    trends.forEach((t) => {
      if (t.growthPct >= 50 && t.currentCount >= 3) {
        anomalies.push({
          type: "TOPIC_VOLUME_SPIKE",
          severity: t.negativeCount > t.positiveCount ? "CRITICAL" : "HIGH",
          description: `Unusual feedback volume spike in '${t.topic}' (+${t.growthPct}% velocity).`,
          metric: `${t.currentCount} items in last 7 days`,
          detectedAt: now.toISOString(),
        });
      }
    });

    // 4. Channel vs Sentiment Correlation Analysis
    const channelCorrelations: Record<string, { total: number; negative: number; positive: number; avgSeverity: number }> = {};
    allFeedback.forEach((f) => {
      if (!channelCorrelations[f.channel]) {
        channelCorrelations[f.channel] = { total: 0, negative: 0, positive: 0, avgSeverity: 0 };
      }
      channelCorrelations[f.channel].total++;
      if (f.sentiment === "NEG") channelCorrelations[f.channel].negative++;
      if (f.sentiment === "POS") channelCorrelations[f.channel].positive++;
      channelCorrelations[f.channel].avgSeverity += f.severityScore || 25;
    });

    const channelInsights = Object.entries(channelCorrelations).map(([channel, data]) => ({
      channel,
      totalSignals: data.total,
      negativeRatio: data.total > 0 ? Math.round((data.negative / data.total) * 100) : 0,
      positiveRatio: data.total > 0 ? Math.round((data.positive / data.total) * 100) : 0,
      avgSeverity: Math.round(data.avgSeverity / (data.total || 1)),
    }));

    return NextResponse.json({
      comparative,
      trends,
      anomalies,
      channelInsights,
    });
  } catch (error) {
    console.error("Fetch analytics error:", error);
    return NextResponse.json({ error: "Failed to load advanced analytics" }, { status: 500 });
  }
}
