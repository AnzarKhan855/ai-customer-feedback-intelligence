import { describe, it } from "node:test";
import assert from "node:assert";
import {
  calculateJaccardSimilarity,
  detectDuplicates,
  getWorkspaceDuplicates,
} from "../lib/deduplication";
import { db } from "../lib/db";

describe("Feature 8: Intelligent Feedback Deduplication Suite", () => {
  it("calculates accurate Jaccard similarity between feedback text strings", () => {
    const textA = "Cannot download billing invoice PDF from dashboard";
    const textB = "Cannot download billing invoice PDF from customer dashboard";
    const sim = calculateJaccardSimilarity(textA, textB);
    assert.ok(sim >= 0.75, "Similar texts must have high similarity score");

    const textC = "Authentication SSO SAML login fails with 500 error";
    const simUnrelated = calculateJaccardSimilarity(textA, textC);
    assert.ok(simUnrelated <= 0.2, "Unrelated texts must have near-zero similarity");
  });

  it("detects and groups duplicate feedback records into actionable clusters", () => {
    const mockFeedback = [
      {
        id: "dp-1",
        content: "Cannot download billing invoice PDF from dashboard",
        channel: "SUPPORT_TICKET",
        customerLabel: "Enterprise Account",
        sentiment: "NEG",
        severityScore: 70,
        createdAt: new Date("2026-03-01"),
      },
      {
        id: "dp-2",
        content: "Cannot download billing invoice PDF from customer dashboard",
        channel: "IN_APP",
        customerLabel: "Mid-Market Lead",
        sentiment: "NEG",
        severityScore: 70,
        createdAt: new Date("2026-03-02"),
      },
      {
        id: "dp-3",
        content: "Completely unrelated positive review about our customer onboarding.",
        channel: "COMMUNITY",
        customerLabel: "Power User",
        sentiment: "POS",
        severityScore: 10,
        createdAt: new Date("2026-03-03"),
      },
    ];

    const res = detectDuplicates(mockFeedback);
    assert.strictEqual(res.totalDuplicatesDetected, 1);
    assert.strictEqual(res.totalUniqueClusters, 1);
    assert.strictEqual(res.groups[0].primaryItem.id, "dp-1");
    assert.strictEqual(res.groups[0].duplicates.length, 1);
    assert.strictEqual(res.groups[0].duplicates[0].id, "dp-2");
    assert.ok(res.potentialNoiseReductionPercentage > 0);
  });

  it("handles zero or single item without false duplicate alerts", () => {
    const res = detectDuplicates([]);
    assert.strictEqual(res.totalDuplicatesDetected, 0);
    assert.strictEqual(res.groups.length, 0);

    const singleRes = detectDuplicates([
      {
        id: "single-1",
        content: "Single feedback entry",
        channel: "COMMUNITY",
        sentiment: "NEU",
        severityScore: 20,
        createdAt: new Date(),
      },
    ]);
    assert.strictEqual(singleRes.totalDuplicatesDetected, 0);
    assert.strictEqual(singleRes.groups.length, 0);
  });

  it("enforces tenant boundary isolation when querying workspace duplicates", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "isolated-dups-test" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Isolated Duplicates Workspace",
          slug: "isolated-dups-test",
        },
      });
    }

    const res = await getWorkspaceDuplicates(emptyWs.id);
    assert.strictEqual(res.totalDuplicatesDetected, 0);
    assert.strictEqual(res.groups.length, 0);
  });
});
