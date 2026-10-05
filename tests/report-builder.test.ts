import { describe, it } from "node:test";
import assert from "node:assert";
import { buildAndSaveCustomReport } from "../lib/report-builder";
import { db } from "../lib/db";

describe("Feature 10: Custom AI Executive Report Builder Suite", () => {
  it("builds and persists custom targeted report with evidence verbatims", async () => {
    await db.user.deleteMany({
      where: { email: { in: ["report-analyst@loop.dev", "empty-analyst@loop.dev"] } },
    });

    let ws = await db.workspace.findUnique({
      where: { slug: "custom-report-test-ws" },
    });
    if (!ws) {
      ws = await db.workspace.create({
        data: {
          name: "Custom Report Test Workspace",
          slug: "custom-report-test-ws",
        },
      });
    }

    let user = await db.user.findFirst({
      where: { workspaceId: ws.id },
    });
    if (!user) {
      user = await db.user.create({
        data: {
          email: "report-analyst@loop.dev",
          name: "Report Analyst",
          role: "ANALYST",
          passwordHash: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ek5YEYQganwfhp8Qe",
          workspaceId: ws.id,
        },
      });
    }

    // Clean up and seed feedback into workspace
    await db.feedback.deleteMany({ where: { workspaceId: ws.id } });
    await db.feedback.createMany({
      data: [
        {
          content: "Enterprise SSO login timeout when connecting with Okta SAML.",
          channel: "SUPPORT_TICKET",
          customerLabel: "Enterprise Bank",
          sentiment: "NEG",
          severityScore: 85,
          featureArea: "Authentication",
          intent: "complaint",
          churnRiskSignal: true,
          priority: "CRITICAL",
          workspaceId: ws.id,
        },
        {
          content: "Dark mode theme contrast is really easy on the eyes.",
          channel: "COMMUNITY",
          customerLabel: "Beta User",
          sentiment: "POS",
          severityScore: 10,
          featureArea: "UI",
          intent: "praise",
          churnRiskSignal: false,
          priority: "LOW",
          workspaceId: ws.id,
        },
      ],
    });

    const reportRes = await buildAndSaveCustomReport({
      workspaceId: ws.id,
      userId: user.id,
      title: "Quarterly Enterprise Authentication Audit",
      reportType: "PRODUCT_FRICTION",
      period: "30d",
      channelFilter: "ALL",
    });

    assert.ok(reportRes.id);
    assert.strictEqual(reportRes.title, "Quarterly Enterprise Authentication Audit");
    assert.strictEqual(reportRes.content.reportType, "PRODUCT_FRICTION");
    assert.strictEqual(reportRes.content.metrics.totalVolume, 2);
    assert.strictEqual(reportRes.content.metrics.churnRisksCount, 1);
    assert.strictEqual(reportRes.content.metrics.criticalEscalationsCount, 1);
    assert.ok(reportRes.content.keyFindings.length >= 1);
    assert.ok(reportRes.content.actionableRecommendations.length >= 1);

    // Verify database persistence
    const savedInDb = await db.report.findUnique({
      where: { id: reportRes.id },
    });
    assert.ok(savedInDb);
    assert.strictEqual(savedInDb?.workspaceId, ws.id);
    assert.strictEqual(savedInDb?.title, "Quarterly Enterprise Authentication Audit");
  });

  it("enforces tenant boundary isolation when generating custom report", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "empty-report-test-ws" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Empty Report Workspace",
          slug: "empty-report-test-ws",
        },
      });
    }

    let emptyUser = await db.user.findFirst({
      where: { workspaceId: emptyWs.id },
    });
    if (!emptyUser) {
      emptyUser = await db.user.create({
        data: {
          email: "empty-analyst@loop.dev",
          name: "Empty Analyst",
          role: "ANALYST",
          passwordHash: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ek5YEYQganwfhp8Qe",
          workspaceId: emptyWs.id,
        },
      });
    }

    const reportRes = await buildAndSaveCustomReport({
      workspaceId: emptyWs.id,
      userId: emptyUser.id,
      title: "Empty Workspace Report",
      reportType: "EXECUTIVE_OVERVIEW",
      period: "30d",
    });

    assert.strictEqual(reportRes.content.metrics.totalVolume, 0);
    assert.strictEqual(reportRes.content.metrics.churnRisksCount, 0);
    assert.strictEqual(reportRes.content.keyFindings.length, 0);
  });
});
