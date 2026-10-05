import { describe, it } from "node:test";
import assert from "node:assert";
import { getWorkspaceAdminDiagnostics } from "../lib/admin-control";
import { recordAuditLog } from "../lib/audit";
import { db } from "../lib/db";

describe("Feature 15: Enterprise Admin Control Center Suite", () => {
  it("compiles deep operational telemetry and audit logs for workspace", async () => {
    let ws = await db.workspace.findUnique({
      where: { slug: "admin-ctrl-test-ws" },
    });
    if (!ws) {
      ws = await db.workspace.create({
        data: {
          name: "Admin Control Test Workspace",
          slug: "admin-ctrl-test-ws",
        },
      });
    }

    // Seed audit log
    await recordAuditLog({
      workspaceId: ws.id,
      actorEmail: "admin@loop.dev",
      actorRole: "ADMIN",
      action: "AUTH_LOGIN",
      entity: "User",
      metadata: { ip: "127.0.0.1", userAgent: "Mozilla" },
    });

    const res = await getWorkspaceAdminDiagnostics(ws.id);
    assert.ok(res.databaseLatencyMs >= 0, "Database latency must be measured");
    assert.strictEqual(res.systemHealth, "HEALTHY");
    assert.strictEqual(res.rateLimiterStatus, "OPERATIONAL");
    assert.strictEqual(res.aiPipelineStatus, "READY");
    assert.ok(res.recentAuditLogs.length >= 1, "Must return recorded audit logs");
    assert.strictEqual(res.recentAuditLogs[0].actorRole, "ADMIN");
  });

  it("enforces tenant boundary isolation on admin telemetry", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "empty-admin-ctrl-ws" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Empty Admin Control Workspace",
          slug: "empty-admin-ctrl-ws",
        },
      });
    }

    const res = await getWorkspaceAdminDiagnostics(emptyWs.id);
    assert.strictEqual(res.counts.totalUsers, 0);
    assert.strictEqual(res.counts.totalFeedback, 0);
    assert.strictEqual(res.counts.totalDatasets, 0);
    assert.strictEqual(res.counts.activeAlerts, 0);
    assert.strictEqual(res.recentAuditLogs.length, 0);
  });
});
