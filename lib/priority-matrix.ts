import { db } from "@/lib/db";

export type MatrixQuadrant = "QUICK_WINS" | "HIGH_PRIORITY" | "STRATEGIC" | "LOW_PRIORITY";

export interface PriorityMatrixItem {
  id: string;
  topic: string;
  quadrant: MatrixQuadrant;
  impactScore: number;    // 0 to 100
  urgencyScore: number;   // 0 to 100
  frequency: number;
  averageSeverity: number;
  churnSignalsCount: number;
  affectedChannels: string[];
  rationale: string;
  suggestedAction: string;
  evidenceSnippets: Array<{
    id: string;
    content: string;
    channel: string;
    severityScore: number;
  }>;
}

export interface PriorityMatrixResult {
  matrix: {
    quickWins: PriorityMatrixItem[];
    highPriority: PriorityMatrixItem[];
    strategic: PriorityMatrixItem[];
    lowPriority: PriorityMatrixItem[];
  };
  totalIssuesRanked: number;
  summary: string;
}

export function calculatePriorityMatrix(
  feedbackItems: Array<{
    id: string;
    content: string;
    channel: string;
    sentiment: string;
    severityScore: number;
    featureArea?: string | null;
    priority: string;
    churnRiskSignal: boolean;
    status: string;
  }>
): PriorityMatrixResult {
  if (!feedbackItems || feedbackItems.length === 0) {
    return {
      matrix: { quickWins: [], highPriority: [], strategic: [], lowPriority: [] },
      totalIssuesRanked: 0,
      summary: "No customer feedback signals available to compute strategic prioritization.",
    };
  }

  // Group by feature area / topic
  const groups = new Map<string, typeof feedbackItems>();

  feedbackItems.forEach((f) => {
    const area = f.featureArea && f.featureArea.trim() && f.featureArea !== "General"
      ? f.featureArea.trim()
      : "Core Experience";
    if (!groups.has(area)) groups.set(area, []);
    groups.get(area)!.push(f);
  });

  const allItems: PriorityMatrixItem[] = [];

  groups.forEach((items, area) => {
    const frequency = items.length;
    const avgSeverity = Math.round(
      items.reduce((acc, i) => acc + (i.severityScore || 20), 0) / frequency
    );
    const churnSignalsCount = items.filter((i) => i.churnRiskSignal).length;
    const channels = Array.from(new Set(items.map((i) => i.channel)));
    const unresolvedCritical = items.filter(
      (i) => (i.priority === "CRITICAL" || i.severityScore >= 75) && i.status !== "ACTIONED"
    ).length;

    // Impact Score (0 to 100)
    // Weighted by severity, churn signals, and unresolved critical issues
    const impactScore = Math.max(
      10,
      Math.min(
        100,
        Math.round(
          avgSeverity * 0.45 +
            Math.min(40, churnSignalsCount * 20) +
            Math.min(35, unresolvedCritical * 18)
        )
      )
    );

    // Urgency Score (0 to 100)
    // Weighted by report frequency, multi-channel spread, and churn urgency
    const urgencyScore = Math.max(
      10,
      Math.min(
        100,
        Math.round(
          Math.min(50, frequency * 8) +
            (channels.length >= 2 ? 25 : 10) +
            (churnSignalsCount > 0 ? 25 : 0)
        )
      )
    );

    // Quadrant Classification
    let quadrant: MatrixQuadrant = "LOW_PRIORITY";
    if (impactScore >= 55 && urgencyScore >= 50) {
      quadrant = "HIGH_PRIORITY";
    } else if (impactScore >= 55 && urgencyScore < 50) {
      quadrant = "QUICK_WINS";
    } else if (impactScore < 55 && urgencyScore >= 50) {
      quadrant = "STRATEGIC";
    } else {
      quadrant = "LOW_PRIORITY";
    }

    // Explainable Rationale ("SHOW WHY")
    const rationaleParts: string[] = [];
    if (avgSeverity >= 60) rationaleParts.push(`Elevated severity impact (${avgSeverity}/100)`);
    if (frequency >= 3) rationaleParts.push(`${frequency} recurring feedback reports`);
    if (churnSignalsCount > 0) rationaleParts.push(`${churnSignalsCount} churn indicators detected`);
    if (channels.length > 1) rationaleParts.push(`Reported across ${channels.length} channels`);
    if (rationaleParts.length === 0) rationaleParts.push("Low friction baseline feedback");

    const rationale = `Ranked as ${quadrant.replace("_", " ")} because: ${rationaleParts.join(", ")}.`;

    // Suggested Action
    let suggestedAction = `Address customer friction in ${area}.`;
    if (quadrant === "HIGH_PRIORITY") {
      suggestedAction = `Schedule immediate engineering triage to resolve ${area} bottleneck.`;
    } else if (quadrant === "QUICK_WINS") {
      suggestedAction = `Ship fast fixes or documentation enhancements for ${area}.`;
    } else if (quadrant === "STRATEGIC") {
      suggestedAction = `Incorporate ${area} improvements into next quarter roadmap.`;
    }

    allItems.push({
      id: `prio-${area.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      topic: area,
      quadrant,
      impactScore,
      urgencyScore,
      frequency,
      averageSeverity: avgSeverity,
      churnSignalsCount,
      affectedChannels: channels,
      rationale,
      suggestedAction,
      evidenceSnippets: items.slice(0, 3).map((i) => ({
        id: i.id,
        content: i.content,
        channel: i.channel,
        severityScore: i.severityScore,
      })),
    });
  });

  const matrix = {
    highPriority: allItems.filter((i) => i.quadrant === "HIGH_PRIORITY").sort((a, b) => b.impactScore - a.impactScore),
    quickWins: allItems.filter((i) => i.quadrant === "QUICK_WINS").sort((a, b) => b.impactScore - a.impactScore),
    strategic: allItems.filter((i) => i.quadrant === "STRATEGIC").sort((a, b) => b.urgencyScore - a.urgencyScore),
    lowPriority: allItems.filter((i) => i.quadrant === "LOW_PRIORITY").sort((a, b) => b.impactScore - a.impactScore),
  };

  return {
    matrix,
    totalIssuesRanked: allItems.length,
    summary: `${matrix.highPriority.length} High Priority items, ${matrix.quickWins.length} Quick Wins, ${matrix.strategic.length} Strategic initiatives, ${matrix.lowPriority.length} Low Priority tasks.`,
  };
}

export async function getWorkspacePriorityMatrix(
  workspaceId: string
): Promise<PriorityMatrixResult> {
  const feedback = await db.feedback.findMany({
    where: { workspaceId },
    select: {
      id: true,
      content: true,
      channel: true,
      sentiment: true,
      severityScore: true,
      featureArea: true,
      priority: true,
      churnRiskSignal: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return calculatePriorityMatrix(feedback);
}
