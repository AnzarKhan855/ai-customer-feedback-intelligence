import { db } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

export type CustomReportType =
  | "EXECUTIVE_OVERVIEW"
  | "PRODUCT_FRICTION"
  | "RETENTION_RISK"
  | "COMPETITIVE";

export interface CustomReportParams {
  workspaceId: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  title: string;
  reportType: CustomReportType;
  period: "7d" | "30d" | "90d" | "all";
  channelFilter?: string;
  featureAreaFilter?: string;
}

export interface CustomReportContent {
  reportType: CustomReportType;
  periodLabel: string;
  generatedAt: string;
  executiveSummary: string;
  metrics: {
    totalVolume: number;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
    averageSeverity: number;
    churnRisksCount: number;
    criticalEscalationsCount: number;
  };
  keyFindings: Array<{
    title: string;
    description: string;
    severity: number;
    verbatims: Array<{
      id: string;
      content: string;
      channel: string;
      customerLabel?: string | null;
      severityScore: number;
    }>;
  }>;
  actionableRecommendations: string[];
}

export async function buildAndSaveCustomReport(
  params: CustomReportParams
): Promise<{
  id: string;
  title: string;
  periodStart: Date;
  periodEnd: Date;
  content: CustomReportContent;
}> {
  const {
    workspaceId,
    userId,
    userEmail,
    userRole,
    title,
    reportType,
    period,
    channelFilter,
    featureAreaFilter,
  } = params;

  const now = new Date();
  let startDate = new Date();
  let periodLabel = "Last 30 Days";

  if (period === "7d") {
    startDate.setDate(now.getDate() - 7);
    periodLabel = "Last 7 Days";
  } else if (period === "30d") {
    startDate.setDate(now.getDate() - 30);
    periodLabel = "Last 30 Days";
  } else if (period === "90d") {
    startDate.setDate(now.getDate() - 90);
    periodLabel = "Last 90 Days";
  } else {
    startDate = new Date(0);
    periodLabel = "All Time";
  }

  // Query feedback with tenant isolation and filters
  const whereClause: any = {
    workspaceId,
    createdAt: { gte: startDate },
  };

  if (channelFilter && channelFilter !== "ALL") {
    whereClause.channel = channelFilter;
  }
  if (featureAreaFilter && featureAreaFilter !== "ALL") {
    whereClause.featureArea = featureAreaFilter;
  }

  const feedbackItems = await db.feedback.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const total = feedbackItems.length;
  let pos = 0;
  let neu = 0;
  let neg = 0;
  let churns = 0;
  let criticals = 0;
  let sevSum = 0;

  feedbackItems.forEach((f) => {
    const s = (f.sentiment || "").toUpperCase();
    if (s.startsWith("POS")) pos++;
    else if (s.startsWith("NEG")) neg++;
    else neu++;

    if (f.churnRiskSignal) churns++;
    if (f.priority === "CRITICAL" || f.severityScore >= 75) criticals++;
    sevSum += f.severityScore || 20;
  });

  const avgSeverity = total > 0 ? Math.round(sevSum / total) : 0;
  const posPct = total > 0 ? Math.round((pos / total) * 100) : 0;
  const negPct = total > 0 ? Math.round((neg / total) * 100) : 0;
  const neuPct = total > 0 ? 100 - posPct - negPct : 0;

  // Group by area for Key Findings
  const areaMap = new Map<string, typeof feedbackItems>();
  feedbackItems.forEach((f) => {
    const area = f.featureArea && f.featureArea.trim() && f.featureArea.toLowerCase() !== "general"
      ? f.featureArea.trim()
      : "Core Platform Experience";
    if (!areaMap.has(area)) areaMap.set(area, []);
    areaMap.get(area)!.push(f);
  });

  const keyFindings = Array.from(areaMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)
    .map(([area, items]) => {
      const areaSev = Math.round(items.reduce((acc, i) => acc + i.severityScore, 0) / items.length);
      return {
        title: `${area} (${items.length} feedback verbatims)`,
        description: `Average severity index of ${areaSev}/100 with ${items.filter((i) => i.churnRiskSignal).length} churn risk signals.`,
        severity: areaSev,
        verbatims: items.slice(0, 3).map((i) => ({
          id: i.id,
          content: i.content,
          channel: i.channel,
          customerLabel: i.customerLabel,
          severityScore: i.severityScore,
        })),
      };
    });

  const recommendations: string[] = [];
  if (churns > 0) {
    recommendations.push(
      `Deploy targeted customer success outreach for ${churns} customer accounts exhibiting direct cancellation signals.`
    );
  }
  if (keyFindings.length > 0) {
    recommendations.push(
      `Prioritize engineering triage on "${keyFindings[0].title.split(" (")[0]}" to resolve top reported friction.`
    );
  }
  if (posPct >= 50) {
    recommendations.push(
      `Amplify positive sentiment (${posPct}%) through case study testimonials and advocacy referral campaigns.`
    );
  } else {
    recommendations.push(
      `Address elevated negative feedback ratio (${negPct}%) to protect platform retention metrics.`
    );
  }

  const executiveSummary = total === 0
    ? `No customer feedback records matched the specified criteria for period ${periodLabel}. Baseline is clean.`
    : `Custom ${reportType.replace("_", " ")} intelligence report compiled across ${total} customer feedback records for ${periodLabel}. Overall sentiment distribution is ${posPct}% POS, ${negPct}% NEG, ${neuPct}% NEU. Identified ${churns} churn risk indicators and ${criticals} critical escalations with an average friction severity of ${avgSeverity}/100.`;

  const content: CustomReportContent = {
    reportType,
    periodLabel,
    generatedAt: now.toISOString(),
    executiveSummary,
    metrics: {
      totalVolume: total,
      positivePercentage: posPct,
      neutralPercentage: neuPct,
      negativePercentage: negPct,
      averageSeverity: avgSeverity,
      churnRisksCount: churns,
      criticalEscalationsCount: criticals,
    },
    keyFindings,
    actionableRecommendations: recommendations,
  };

  const savedReport = await db.report.create({
    data: {
      title: title.trim(),
      periodStart: startDate,
      periodEnd: now,
      contentJson: JSON.stringify(content),
      generatedById: userId,
      workspaceId,
    },
  });

  await recordAuditLog({
    workspaceId,
    actorEmail: userEmail || "system@loop.dev",
    actorRole: userRole || "ANALYST",
    action: "REPORT_GENERATE",
    entity: "Report",
    entityId: savedReport.id,
    metadata: {
      title: savedReport.title,
      reportType,
      period,
      totalFeedback: total,
    },
  });

  return {
    id: savedReport.id,
    title: savedReport.title,
    periodStart: savedReport.periodStart,
    periodEnd: savedReport.periodEnd,
    content,
  };
}
