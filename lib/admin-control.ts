import { db } from "@/lib/db";

export interface WorkspaceAdminDiagnostics {
  systemHealth: "HEALTHY" | "DEGRADED" | "CRITICAL";
  databaseLatencyMs: number;
  environment: string;
  counts: {
    totalUsers: number;
    totalFeedback: number;
    totalDatasets: number;
    activeAlerts: number;
    totalReports: number;
    totalActionItems: number;
  };
  rateLimiterStatus: string;
  aiPipelineStatus: string;
  recentAuditLogs: Array<{
    id: string;
    actorEmail: string;
    actorRole: string;
    action: string;
    entity: string;
    entityId?: string | null;
    createdAt: Date;
    metadata?: any;
  }>;
}

export async function getWorkspaceAdminDiagnostics(
  workspaceId: string
): Promise<WorkspaceAdminDiagnostics> {
  const startTime = Date.now();

  // Measure database latency using a lightweight query
  await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });
  const databaseLatencyMs = Date.now() - startTime;

  // Run entity counts in parallel
  const [
    totalUsers,
    totalFeedback,
    totalDatasets,
    activeAlerts,
    totalReports,
    totalActionItems,
    auditLogs,
  ] = await Promise.all([
    db.user.count({ where: { workspaceId } }),
    db.feedback.count({ where: { workspaceId } }),
    db.dataset.count({ where: { workspaceId } }),
    db.alert.count({ where: { workspaceId, status: "ACTIVE" } }),
    db.report.count({ where: { workspaceId } }),
    db.actionItem.count({ where: { workspaceId } }),
    db.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        actorEmail: true,
        actorRole: true,
        action: true,
        entity: true,
        entityId: true,
        createdAt: true,
        metadata: true,
      },
    }),
  ]);

  let systemHealth: "HEALTHY" | "DEGRADED" | "CRITICAL" = "HEALTHY";
  if (databaseLatencyMs > 500 || activeAlerts >= 5) {
    systemHealth = "DEGRADED";
  }

  const formattedAuditLogs = auditLogs.map((log) => ({
    ...log,
    metadata: log.metadata ? (() => {
      try { return JSON.parse(log.metadata); } catch { return null; }
    })() : null,
  }));

  return {
    systemHealth,
    databaseLatencyMs,
    environment: process.env.NODE_ENV || "development",
    counts: {
      totalUsers,
      totalFeedback,
      totalDatasets,
      activeAlerts,
      totalReports,
      totalActionItems,
    },
    rateLimiterStatus: "OPERATIONAL",
    aiPipelineStatus: "READY",
    recentAuditLogs: formattedAuditLogs,
  };
}
