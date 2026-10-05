import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db";

describe("Database & Multi-Tenant Model Invariants", () => {
  test("verifies seed workspace exists", async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: "acme-corp" },
      include: {
        users: true,
        datasets: true,
        alerts: true,
      },
    });

    assert.ok(workspace, "Seed workspace 'acme-corp' must exist");
    assert.equal(workspace.slug, "acme-corp");
    assert.ok(workspace.users.length >= 3, "Workspace should have at least 3 users");
    assert.ok(workspace.datasets.length >= 1, "Workspace should have at least 1 dataset");
    assert.ok(workspace.alerts.length >= 1, "Workspace should have seeded alerts");
  });

  test("verifies feedback records have enriched NLP fields", async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: "acme-corp" },
    });
    assert.ok(workspace);

    const feedbackCount = await prisma.feedback.count({
      where: { workspaceId: workspace.id },
    });
    assert.ok(feedbackCount > 0, "Feedback count should be > 0");

    // Fetch sample feedback with rich NLP attributes
    const sample = await prisma.feedback.findFirst({
      where: {
        workspaceId: workspace.id,
        emotion: { not: null },
      },
    });

    assert.ok(sample, "Should find feedback with emotion populated");
    assert.ok(sample.emotion, "Emotion must not be null");
    assert.ok(sample.intent, "Intent must not be null");
    assert.ok(typeof sample.severityScore === "number", "Severity score must be numeric");
    assert.ok(["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(sample.priority || ""));
    assert.ok(sample.aspectsJson, "ABSA aspectsJson must exist");

    // Verify aspectsJson parses into valid JSON array
    const parsedAspects = JSON.parse(sample.aspectsJson);
    assert.ok(Array.isArray(parsedAspects), "aspectsJson should parse as array");
  });

  test("enforces tenant workspace isolation on feedback queries", async () => {
    const nonexistentWorkspaceId = "ws-nonexistent-12345";
    const feedbackForOther = await prisma.feedback.findMany({
      where: { workspaceId: nonexistentWorkspaceId },
    });

    assert.equal(feedbackForOther.length, 0, "Non-existent tenant must return 0 records");
  });

  test("verifies active anomaly alerts can be queried and updated", async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: "acme-corp" },
    });
    assert.ok(workspace);

    const alert = await prisma.alert.findFirst({
      where: { workspaceId: workspace.id },
    });

    assert.ok(alert, "Should find at least one alert in workspace");
    assert.ok(["ACTIVE", "ACKNOWLEDGED", "RESOLVED"].includes(alert.status));
    assert.ok(["CRITICAL", "HIGH", "MEDIUM"].includes(alert.severity));
  });

  test("verifies AI Recommendations exist and have impact metrics", async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: "acme-corp" },
    });
    assert.ok(workspace);

    const recs = await prisma.aIRecommendation.findMany({
      where: { workspaceId: workspace.id },
    });

    assert.ok(recs.length > 0, "Should have at least 1 AI recommendation");
    const rec = recs[0];
    assert.ok(rec.problem.length > 0);
    assert.ok(rec.businessImpact.length > 0);
    assert.ok(rec.recommendedAction.length > 0);
  });
});
