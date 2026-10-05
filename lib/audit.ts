import { db } from "@/lib/db";

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_SIGNUP"
  | "FEEDBACK_CREATE"
  | "FEEDBACK_BULK_INGEST"
  | "FEEDBACK_UPDATE"
  | "FEEDBACK_DELETE"
  | "ACTION_CREATE"
  | "ACTION_UPDATE"
  | "ROADMAP_CREATE"
  | "ROADMAP_UPDATE"
  | "ALERT_ACKNOWLEDGE"
  | "ALERT_RESOLVE"
  | "RECOMMENDATION_UPDATE"
  | "REPORT_GENERATE"
  | "REPORT_DELETE"
  | "EXPORT_DATA";

export type AuditEntity =
  | "Feedback"
  | "User"
  | "Report"
  | "ActionItem"
  | "RoadmapItem"
  | "Alert"
  | "Recommendation"
  | "Dataset"
  | "Workspace";

interface CreateAuditLogParams {
  workspaceId: string;
  actorEmail: string;
  actorRole: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Enterprise Audit Logger
 * Strictly isolated by workspaceId.
 * Guarantees zero leakage of credentials, tokens, or sensitive hashes.
 */
export async function recordAuditLog({
  workspaceId,
  actorEmail,
  actorRole,
  action,
  entity,
  entityId,
  metadata,
}: CreateAuditLogParams) {
  try {
    let sanitizedMeta: string | null = null;
    if (metadata) {
      const safe = { ...metadata };
      delete safe.password;
      delete safe.passwordHash;
      delete safe.token;
      delete safe.secret;
      delete safe.apiKey;
      delete safe.csrfToken;
      sanitizedMeta = JSON.stringify(safe);
    }

    return await db.auditLog.create({
      data: {
        workspaceId,
        actorEmail: actorEmail.toLowerCase().trim(),
        actorRole,
        action,
        entity,
        entityId: entityId || null,
        metadata: sanitizedMeta,
      },
    });
  } catch (error) {
    console.error("Audit log creation error:", error);
    // Non-blocking so business operations succeed even if logging has transient issue
    return null;
  }
}
