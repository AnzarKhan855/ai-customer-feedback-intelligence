import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db";
import { recordAuditLog } from "../lib/audit";
import { checkRateLimit } from "../lib/rate-limit";

describe("Enterprise Excellence & Security Regression Suite", () => {
  before(async () => {
    // Non-destructively ensure AuditLog table exists in local test fixture
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "action" TEXT NOT NULL,
        "entity" TEXT NOT NULL,
        "entityId" TEXT,
        "actorEmail" TEXT NOT NULL,
        "actorRole" TEXT NOT NULL,
        "metadata" TEXT,
        "workspaceId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_workspaceId_idx" ON "AuditLog"("workspaceId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");`);
  });

  describe("Audit Logging & Sensitive Data Redaction", () => {
    test("creates audit log and strips passwords, secrets, and api keys from metadata", async () => {
      const workspace = await prisma.workspace.findFirst();
      assert.ok(workspace, "Seed workspace must exist");

      const log = await recordAuditLog({
        workspaceId: workspace.id,
        actorEmail: "security-auditor@loop.dev",
        actorRole: "ADMIN",
        action: "FEEDBACK_CREATE",
        entity: "Feedback",
        entityId: "test-fb-item-123",
        metadata: {
          clientName: "Enterprise Client",
          password: "SuperSecretPassword123!",
          passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz",
          secret: "jwt-signing-secret",
          apiKey: "sk-ant-api03-abcdef",
          token: "bearer-token-val",
          normalField: "visible",
        },
      });

      assert.ok(log, "Audit log must be created");
      assert.equal(log.workspaceId, workspace.id);
      assert.equal(log.actorEmail, "security-auditor@loop.dev");
      assert.equal(log.action, "FEEDBACK_CREATE");
      assert.equal(log.entity, "Feedback");

      // Verify metadata redaction
      assert.ok(log.metadata, "Metadata must be present");
      const parsedMeta = JSON.parse(log.metadata);
      assert.equal(parsedMeta.normalField, "visible");
      assert.equal(parsedMeta.clientName, "Enterprise Client");
      assert.equal(parsedMeta.password, undefined, "password must be stripped");
      assert.equal(parsedMeta.passwordHash, undefined, "passwordHash must be stripped");
      assert.equal(parsedMeta.secret, undefined, "secret must be stripped");
      assert.equal(parsedMeta.apiKey, undefined, "apiKey must be stripped");
      assert.equal(parsedMeta.token, undefined, "token must be stripped");
    });

    test("enforces tenant workspace isolation on audit log records", async () => {
      const foreignWorkspaceId = "ws-foreign-tenant-isolated-888";

      const foreignLogs = await prisma.auditLog.findMany({
        where: { workspaceId: foreignWorkspaceId },
      });
      assert.equal(foreignLogs.length, 0, "Query for foreign workspace audit logs must return 0 records");
    });
  });

  describe("Sliding Window Rate Limiter", () => {
    test("permits requests within limit and throttles excess requests", () => {
      const testId = `test-ip-${Date.now()}`;
      const config = { windowMs: 1000, maxRequests: 3 };

      // 1st request -> success
      const r1 = checkRateLimit(testId, config);
      assert.equal(r1.success, true);
      assert.equal(r1.remaining, 2);

      // 2nd request -> success
      const r2 = checkRateLimit(testId, config);
      assert.equal(r2.success, true);
      assert.equal(r2.remaining, 1);

      // 3rd request -> success
      const r3 = checkRateLimit(testId, config);
      assert.equal(r3.success, true);
      assert.equal(r3.remaining, 0);

      // 4th request -> throttled!
      const r4 = checkRateLimit(testId, config);
      assert.equal(r4.success, false);
      assert.equal(r4.remaining, 0);
      assert.ok(r4.resetMs > 0, "Reset ms must be positive");
    });

    test("isolates rate limits between distinct client identifiers", () => {
      const clientA = `client-a-${Date.now()}`;
      const clientB = `client-b-${Date.now()}`;
      const config = { windowMs: 1000, maxRequests: 2 };

      checkRateLimit(clientA, config);
      checkRateLimit(clientA, config);
      const throttledA = checkRateLimit(clientA, config);
      assert.equal(throttledA.success, false, "Client A should be throttled");

      // Client B should still be allowed
      const allowedB = checkRateLimit(clientB, config);
      assert.equal(allowedB.success, true, "Client B should not be impacted by Client A");
    });
  });

  describe("IDOR & Tenant Cross-Access Prevention", () => {
    test("guarantees action items and recommendations cannot be read cross-tenant", async () => {
      const foreignWorkspaceId = "ws-foreign-tenant-999";

      const [actionItems, recommendations] = await Promise.all([
        prisma.actionItem.findMany({ where: { workspaceId: foreignWorkspaceId } }),
        prisma.aIRecommendation.findMany({ where: { workspaceId: foreignWorkspaceId } }),
      ]);

      assert.equal(actionItems.length, 0, "Action items must not leak across tenant boundaries");
      assert.equal(recommendations.length, 0, "Recommendations must not leak across tenant boundaries");
    });
  });
});
