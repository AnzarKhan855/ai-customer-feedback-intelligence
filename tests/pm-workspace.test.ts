import { describe, it } from "node:test";
import assert from "node:assert";
import { getWorkspacePriorityMatrix } from "../lib/priority-matrix";
import { getWorkspaceProductGaps } from "../lib/product-gaps";
import { getWorkspaceFeedbackClusters } from "../lib/clusters";
import { db } from "../lib/db";

describe("Feature 13: Product Manager Intelligence Hub Suite", () => {
  it("provides unified decision intelligence across matrix, gaps, and clusters", async () => {
    let ws = await db.workspace.findUnique({
      where: { slug: "pm-hub-test-ws" },
    });
    if (!ws) {
      ws = await db.workspace.create({
        data: {
          name: "PM Hub Test Workspace",
          slug: "pm-hub-test-ws",
        },
      });
    }

    await db.feedback.deleteMany({ where: { workspaceId: ws.id } });

    await db.feedback.createMany({
      data: [
        {
          content: "We need automated webhook retry functionality because webhook failures stall sync.",
          channel: "SUPPORT_TICKET",
          customerLabel: "Enterprise Acme",
          sentiment: "NEG",
          severityScore: 85,
          priority: "CRITICAL",
          featureArea: "Webhooks",
          intent: "feature_request",
          churnRiskSignal: true,
          workspaceId: ws.id,
        },
        {
          content: "Webhook configuration documentation is clear and easy to follow.",
          channel: "COMMUNITY",
          customerLabel: "Mid-Market Lead",
          sentiment: "POS",
          severityScore: 15,
          priority: "LOW",
          featureArea: "Webhooks",
          intent: "praise",
          churnRiskSignal: false,
          workspaceId: ws.id,
        },
      ],
    });

    const [matrix, gaps, clusters] = await Promise.all([
      getWorkspacePriorityMatrix(ws.id),
      getWorkspaceProductGaps(ws.id),
      getWorkspaceFeedbackClusters(ws.id),
    ]);

    assert.strictEqual(matrix.totalIssuesRanked, 1);
    assert.strictEqual(gaps.metrics.totalFeatureRequests, 1);
    assert.strictEqual(clusters.totalFeedbackAnalyzed, 2);
    assert.strictEqual(clusters.clusters.length, 1);
  });

  it("enforces tenant boundary isolation across all PM decision intelligence queries", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "empty-pm-hub-ws" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Empty PM Hub Workspace",
          slug: "empty-pm-hub-ws",
        },
      });
    }

    const [matrix, gaps, clusters] = await Promise.all([
      getWorkspacePriorityMatrix(emptyWs.id),
      getWorkspaceProductGaps(emptyWs.id),
      getWorkspaceFeedbackClusters(emptyWs.id),
    ]);

    assert.strictEqual(matrix.totalIssuesRanked, 0);
    assert.strictEqual(gaps.productGaps.length, 0);
    assert.strictEqual(clusters.totalFeedbackAnalyzed, 0);
  });
});
