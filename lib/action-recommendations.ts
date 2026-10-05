import { db } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

export interface GeneratedRecommendation {
  problem: string;
  evidence: string;
  businessImpact: string;
  recommendedAction: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  expectedOutcome: string;
}

export function generateRecommendationsFromFeedback(
  feedbackItems: Array<{
    id: string;
    content: string;
    channel: string;
    severityScore: number;
    churnRiskSignal: boolean;
    featureArea?: string | null;
    intent?: string | null;
  }>
): GeneratedRecommendation[] {
  if (!feedbackItems || feedbackItems.length === 0) {
    return [];
  }

  // Filter for severe issues or churn risk signals
  const frictionItems = feedbackItems.filter(
    (f) => f.severityScore >= 60 || f.churnRiskSignal || f.intent === "complaint" || f.intent === "billing_issue"
  );

  if (frictionItems.length === 0) {
    return [];
  }

  // Group by feature area
  const areaGroups = new Map<string, typeof frictionItems>();
  frictionItems.forEach((f) => {
    const area = f.featureArea && f.featureArea.trim() && f.featureArea.toLowerCase() !== "general"
      ? f.featureArea.trim()
      : "Core Platform Experience";
    if (!areaGroups.has(area)) areaGroups.set(area, []);
    areaGroups.get(area)!.push(f);
  });

  const recommendations: GeneratedRecommendation[] = [];

  areaGroups.forEach((items, area) => {
    const churnCount = items.filter((i) => i.churnRiskSignal).length;
    const avgSeverity = Math.round(
      items.reduce((acc, i) => acc + (i.severityScore || 20), 0) / items.length
    );
    const priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" =
      avgSeverity >= 75 || churnCount >= 2
        ? "CRITICAL"
        : avgSeverity >= 55
        ? "HIGH"
        : "MEDIUM";

    const topEvidence = items
      .slice(0, 2)
      .map((i) => `"${i.content}" (${i.channel}, Sev ${i.severityScore})`)
      .join("; ");

    recommendations.push({
      problem: `High customer friction observed in ${area} across ${items.length} complaints.`,
      evidence: topEvidence,
      businessImpact: churnCount > 0
        ? `Protects revenue from ${churnCount} at-risk customer accounts citing direct cancellation risk.`
        : `Eliminates recurring friction with average severity ${avgSeverity}/100.`,
      recommendedAction: `Deploy engineering sprint to remediate ${area} failure modes and add automated regression tests.`,
      priority,
      expectedOutcome: `30%+ reduction in ${area} ticket volume and elevated customer CSAT.`,
    });
  });

  return recommendations;
}

export async function promoteRecommendationToActionItem(params: {
  recommendationId: string;
  workspaceId: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  integration?: "LINEAR" | "JIRA" | "GITHUB";
}) {
  const { recommendationId, workspaceId, userId, userEmail, userRole, integration = "LINEAR" } = params;

  const rec = await db.aIRecommendation.findFirst({
    where: { id: recommendationId, workspaceId },
  });

  if (!rec) {
    throw new Error("Recommendation not found or unauthorized");
  }

  // Generate external ticket key
  const count = await db.actionItem.count({ where: { workspaceId } });
  const prefix = integration === "JIRA" ? "ENG" : integration === "GITHUB" ? "GH" : "LOO";
  const externalKey = `${prefix}-${150 + count}`;

  const actionPriority =
    rec.priority === "CRITICAL"
      ? "URGENT"
      : rec.priority === "HIGH"
      ? "HIGH"
      : rec.priority === "MEDIUM"
      ? "MEDIUM"
      : "LOW";

  // Create action item
  const actionItem = await db.actionItem.create({
    data: {
      title: `[Recommendation] ${rec.recommendedAction.slice(0, 100)}`,
      description: `Problem: ${rec.problem}\n\nEvidence: ${rec.evidence}\n\nBusiness Impact: ${rec.businessImpact}\n\nExpected Outcome: ${rec.expectedOutcome}`,
      integration,
      externalKey,
      priority: actionPriority,
      status: "TODO",
      createdById: userId || null,
      workspaceId,
    },
  });

  // Update recommendation to IN_PROGRESS
  const updatedRec = await db.aIRecommendation.update({
    where: { id: recommendationId },
    data: { status: "IN_PROGRESS" },
  });

  await recordAuditLog({
    workspaceId,
    actorEmail: userEmail || "system@loop.dev",
    actorRole: userRole || "ANALYST",
    action: "ACTION_CREATE",
    entity: "ActionItem",
    entityId: actionItem.id,
    metadata: {
      recommendationId: rec.id,
      actionItemId: actionItem.id,
      externalKey: actionItem.externalKey,
      integration,
    },
  });

  return { actionItem, recommendation: updatedRec };
}
