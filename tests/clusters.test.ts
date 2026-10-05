import { describe, it } from "node:test";
import assert from "node:assert";
import { discoverFeedbackClusters, getWorkspaceFeedbackClusters } from "../lib/clusters";
import { db } from "../lib/db";

describe("Feature 6: Feedback Cluster Explorer Suite", () => {
  it("discovers cohesive clusters with keywords and verbatim citations", () => {
    const mockFeedback = [
      {
        id: "cl-1",
        content: "Billing invoice PDF is broken and won't download properly.",
        channel: "SUPPORT_TICKET",
        customerLabel: "Enterprise Account A",
        sentiment: "NEG",
        severityScore: 70,
        featureArea: "Billing",
        intent: "billing_issue",
        churnRiskSignal: true,
        detectedEntities: JSON.stringify(["invoice", "pdf"]),
        createdAt: new Date(),
      },
      {
        id: "cl-2",
        content: "Our monthly billing statement contains duplicate seat charges.",
        channel: "SUPPORT_TICKET",
        customerLabel: "Enterprise Account B",
        sentiment: "NEG",
        severityScore: 80,
        featureArea: "Billing",
        intent: "billing_issue",
        churnRiskSignal: true,
        detectedEntities: JSON.stringify(["statement", "seat charges"]),
        createdAt: new Date(),
      },
      {
        id: "cl-3",
        content: "The dark mode UI looks great and reduces eye strain significantly.",
        channel: "COMMUNITY",
        customerLabel: "Power User",
        sentiment: "POS",
        severityScore: 10,
        featureArea: "User Interface",
        intent: "praise",
        churnRiskSignal: false,
        detectedEntities: JSON.stringify(["dark mode", "ui"]),
        createdAt: new Date(),
      },
    ];

    const res = discoverFeedbackClusters(mockFeedback);
    assert.strictEqual(res.totalFeedbackAnalyzed, 3);
    assert.strictEqual(res.totalClustersDiscovered, 2);

    const billingCluster = res.clusters.find((c) => c.primaryArea === "Billing");
    assert.ok(billingCluster, "Must discover Billing cluster");
    assert.strictEqual(billingCluster.size, 2);
    assert.strictEqual(billingCluster.churnRiskCount, 2);
    assert.strictEqual(billingCluster.sentimentDistribution.negative, 2);
    assert.strictEqual(billingCluster.verbatimSamples.length, 2);
    assert.strictEqual(billingCluster.verbatimSamples[0].id, "cl-1");

    const uiCluster = res.clusters.find((c) => c.primaryArea === "User Interface");
    assert.ok(uiCluster, "Must discover User Interface cluster");
    assert.strictEqual(uiCluster.size, 1);
    assert.strictEqual(uiCluster.sentimentDistribution.positive, 1);
  });

  it("handles empty feedback input without errors or hallucinated clusters", () => {
    const res = discoverFeedbackClusters([]);
    assert.strictEqual(res.totalFeedbackAnalyzed, 0);
    assert.strictEqual(res.totalClustersDiscovered, 0);
    assert.strictEqual(res.clusters.length, 0);
  });

  it("enforces tenant boundary isolation when querying workspace clusters", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "isolated-cluster-test" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Isolated Clusters Workspace",
          slug: "isolated-cluster-test",
        },
      });
    }

    const res = await getWorkspaceFeedbackClusters(emptyWs.id);
    assert.strictEqual(res.totalFeedbackAnalyzed, 0);
    assert.strictEqual(res.clusters.length, 0);
  });
});
