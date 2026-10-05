import { db } from "@/lib/db";

export type ActivityType = "ALERT" | "FEEDBACK" | "ACTION" | "DATASET";
export type ActivitySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ActivityNotificationItem {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  severity: ActivitySeverity;
  link: string;
  createdAt: string;
}

export interface ActivityCenterResult {
  unreadCount: number;
  totalActivities: number;
  items: ActivityNotificationItem[];
  summary: string;
}

export async function getWorkspaceActivityCenter(
  workspaceId: string,
  limit = 20
): Promise<ActivityCenterResult> {
  const items: ActivityNotificationItem[] = [];

  // 1. Fetch active/recent alerts
  const alerts = await db.alert.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  alerts.forEach((a) => {
    items.push({
      id: `alert-${a.id}`,
      title: a.title,
      description: a.message,
      type: "ALERT",
      severity: (a.severity as ActivitySeverity) || "HIGH",
      link: "/alerts",
      createdAt: a.createdAt.toISOString(),
    });
  });

  // 2. Fetch critical feedback items
  const criticalFeedback = await db.feedback.findMany({
    where: {
      workspaceId,
      OR: [
        { priority: "CRITICAL" },
        { severityScore: { gte: 75 } },
        { churnRiskSignal: true },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  criticalFeedback.forEach((f) => {
    items.push({
      id: `fb-${f.id}`,
      title: f.churnRiskSignal
        ? `Churn Risk Detected (${f.channel})`
        : `Severe Feedback Escalation: ${f.featureArea || "Core"}`,
      description: f.content.length > 100 ? `${f.content.slice(0, 97)}...` : f.content,
      type: "FEEDBACK",
      severity: f.priority === "CRITICAL" || f.severityScore >= 80 ? "CRITICAL" : "HIGH",
      link: "/inbox",
      createdAt: f.createdAt.toISOString(),
    });
  });

  // 3. Fetch recent action items
  const actions = await db.actionItem.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  actions.forEach((act) => {
    items.push({
      id: `action-${act.id}`,
      title: `Action Ticket: ${act.externalKey}`,
      description: act.title,
      type: "ACTION",
      severity: act.priority === "URGENT" ? "CRITICAL" : "MEDIUM",
      link: "/roadmap",
      createdAt: act.createdAt.toISOString(),
    });
  });

  // Sort all activities by createdAt descending
  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const trimmed = items.slice(0, limit);
  const unreadCount = alerts.filter((a) => a.status === "ACTIVE").length +
    criticalFeedback.filter((f) => f.status === "NEW").length;

  return {
    unreadCount,
    totalActivities: items.length,
    items: trimmed,
    summary: `${unreadCount} unread high-priority operational signals across workspace.`,
  };
}
