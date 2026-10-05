import { describe, it } from "node:test";
import assert from "node:assert";
import { analyzeRootCause } from "../lib/root-cause";
import { db } from "../lib/db";

describe("Feature 2: AI Grounded Root Cause Explorer Suite", () => {
  it("provides evidence-backed root cause hypotheses with citations for billing friction", async () => {
    // Get seed workspace
    const workspace = await db.workspace.findFirst();
    assert.ok(workspace, "Seed workspace must exist");

    const report = await analyzeRootCause(workspace.id, "billing invoice refund");
    assert.strictEqual(report.hasEvidence, true);
    assert.ok(report.totalEvidenceCount > 0);
    assert.ok(report.citations.length > 0);
    assert.ok(report.hypotheses.length > 0);

    // Every hypothesis must be explicitly labeled as a hypothesis
    report.hypotheses.forEach((h) => {
      assert.strictEqual(h.isHypothesis, true, "Must be explicitly labeled as hypothesis");
      assert.ok(h.title.toLowerCase().includes("hypothesis"));
      assert.ok(h.evidenceIds.length > 0);
    });

    // Verification of disclaimer
    assert.ok(
      report.disclaimer.includes("algorithmic diagnostic hypotheses"),
      "Must include standard diagnostic disclaimer"
    );

    // Recommended actions must be present
    assert.ok(report.recommendedActions.length > 0);
  });

  it("handles absent topics gracefully with honest zero-match behavior and no fabricated evidence", async () => {
    const workspace = await db.workspace.findFirst();
    assert.ok(workspace, "Seed workspace must exist");

    const report = await analyzeRootCause(
      workspace.id,
      "quantum entanglement cryptography satellite laser"
    );

    assert.strictEqual(report.hasEvidence, false);
    assert.strictEqual(report.totalEvidenceCount, 0);
    assert.strictEqual(report.citations.length, 0);
    assert.strictEqual(report.priority, "LOW");
    assert.ok(report.recommendedActions.some((a) => a.action.includes("Monitor incoming")));
  });

  it("enforces strict workspace isolation on root-cause retrieval", async () => {
    // Create or find a dummy second workspace with zero feedback
    let isolatedWs = await db.workspace.findUnique({
      where: { slug: "isolated-root-cause-test" },
    });
    if (!isolatedWs) {
      isolatedWs = await db.workspace.create({
        data: {
          name: "Isolated Root Cause Org",
          slug: "isolated-root-cause-test",
        },
      });
    }

    const report = await analyzeRootCause(isolatedWs.id, "billing invoice refund");
    assert.strictEqual(report.hasEvidence, false, "Must find zero evidence in empty workspace");
    assert.strictEqual(report.citations.length, 0);
  });
});
