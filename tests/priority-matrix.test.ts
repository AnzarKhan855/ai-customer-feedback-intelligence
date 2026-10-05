import { describe, it } from "node:test";
import assert from "node:assert";
import { calculatePriorityMatrix, getWorkspacePriorityMatrix } from "../lib/priority-matrix";
import { db } from "../lib/db";

describe("Feature 5: AI Strategic Priority Matrix Engine", () => {
  it("computes 4-quadrant matrix based on mathematical impact and urgency", () => {
    const mockFeedback = [
      // High severity + churn signal + multi channel -> High Priority
      {
        id: "fb-1",
        content: "API rate limiting is breaking our automated sync, cannot continue without this fixed.",
        channel: "SUPPORT_TICKET",
        sentiment: "NEG",
        severityScore: 85,
        featureArea: "API Integrations",
        priority: "CRITICAL",
        churnRiskSignal: true,
        status: "NEW",
      },
      {
        id: "fb-2",
        content: "Webhook failures causing duplicate sync issues.",
        channel: "SLACK_COMMUNITY",
        sentiment: "NEG",
        severityScore: 80,
        featureArea: "API Integrations",
        priority: "HIGH",
        churnRiskSignal: true,
        status: "TRIAGED",
      },
      // Low severity + low frequency -> Low Priority / Backlog
      {
        id: "fb-3",
        content: "Color contrast on dark theme could be slightly improved.",
        channel: "IN_APP",
        sentiment: "NEU",
        severityScore: 15,
        featureArea: "Theme Settings",
        priority: "LOW",
        churnRiskSignal: false,
        status: "NEW",
      },
    ];

    const res = calculatePriorityMatrix(mockFeedback);
    assert.strictEqual(res.totalIssuesRanked, 2);

    const apiItem = res.matrix.highPriority.find((i) => i.topic === "API Integrations");
    assert.ok(apiItem, "API Integrations must be ranked in High Priority quadrant");
    assert.ok(apiItem.impactScore >= 55, "Impact score must be high");
    assert.ok(apiItem.urgencyScore >= 50, "Urgency score must be high");
    assert.strictEqual(apiItem.churnSignalsCount, 2);
    assert.strictEqual(apiItem.evidenceSnippets.length, 2);

    const themeItem = res.matrix.lowPriority.find((i) => i.topic === "Theme Settings");
    assert.ok(themeItem, "Theme Settings must be in Low Priority quadrant");
    assert.ok(themeItem.impactScore < 55);
  });

  it("handles empty feedback gracefully with zero false positives", () => {
    const res = calculatePriorityMatrix([]);
    assert.strictEqual(res.totalIssuesRanked, 0);
    assert.strictEqual(res.matrix.highPriority.length, 0);
    assert.strictEqual(res.matrix.quickWins.length, 0);
    assert.strictEqual(res.matrix.strategic.length, 0);
    assert.strictEqual(res.matrix.lowPriority.length, 0);
  });

  it("enforces tenant boundary isolation when querying workspace priority matrix", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "isolated-prio-test" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Isolated Priority Matrix Workspace",
          slug: "isolated-prio-test",
        },
      });
    }

    const res = await getWorkspacePriorityMatrix(emptyWs.id);
    assert.strictEqual(res.totalIssuesRanked, 0);
    assert.strictEqual(res.matrix.highPriority.length, 0);
  });
});
