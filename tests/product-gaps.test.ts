import { describe, it } from "node:test";
import assert from "node:assert";
import { extractProductGapsFromFeedback, getWorkspaceProductGaps } from "../lib/product-gaps";
import { db } from "../lib/db";

describe("Feature 4: Competitive & Product Gap Intelligence Suite", () => {
  it("extracts product gaps and feature requests with verifiable verbatim citations", () => {
    const mockFeedback = [
      {
        id: "fb-1",
        content: "We are missing automated PDF export for weekly executive summaries.",
        channel: "SUPPORT_TICKET",
        sentiment: "NEG",
        severityScore: 60,
        intent: "feature_request",
        featureArea: "Reports",
        customerLabel: "Enterprise Bank",
        createdAt: new Date(),
      },
      {
        id: "fb-2",
        content: "Please add dark mode support to the mobile dashboard view.",
        channel: "COMMUNITY",
        sentiment: "POS",
        severityScore: 20,
        intent: "suggestion",
        featureArea: "Mobile App",
        customerLabel: "Power User",
        createdAt: new Date(),
      },
      {
        id: "fb-3",
        content: "The dashboard crashes whenever filtering by custom tags, very frustrating.",
        channel: "SUPPORT_TICKET",
        sentiment: "NEG",
        severityScore: 75,
        intent: "complaint",
        featureArea: "Dashboard",
        customerLabel: "Beta Lead",
        createdAt: new Date(),
      },
    ];

    const res = extractProductGapsFromFeedback(mockFeedback);
    assert.ok(res.productGaps.length >= 1, "Must extract product gaps");
    assert.ok(res.featureRequests.length >= 2, "Must extract feature requests");
    assert.ok(res.painPoints.length >= 1, "Must extract pain points");

    // Citations linked
    assert.strictEqual(res.productGaps[0].feedbackId, "fb-1");
    assert.strictEqual(res.productGaps[0].customerLabel, "Enterprise Bank");
  });

  it("reports 'No competitor evidence available' honestly when no competitors are cited", () => {
    const mockFeedback = [
      {
        id: "fb-4",
        content: "The button color on the settings page could be brighter.",
        channel: "COMMUNITY",
        sentiment: "NEU",
        severityScore: 10,
        intent: "suggestion",
        featureArea: "UI",
        customerLabel: "User",
        createdAt: new Date(),
      },
    ];

    const res = extractProductGapsFromFeedback(mockFeedback);
    assert.strictEqual(res.competitiveSignals.length, 0);
    assert.strictEqual(res.competitorSummary, "No competitor evidence available.");
  });

  it("extracts direct competitor mentions and migration signals accurately", () => {
    const mockFeedback = [
      {
        id: "fb-5",
        content: "Our team is evaluating Loop against Qualtrics for next quarter's VoC intelligence stack.",
        channel: "SALES_CALL",
        sentiment: "POS",
        severityScore: 40,
        intent: "inquiry",
        featureArea: "Sales",
        customerLabel: "Mid-Market Lead",
        createdAt: new Date(),
      },
      {
        id: "fb-6",
        content: "We switched from Pendo because of your superior RAG retrieval capabilities.",
        channel: "COMMUNITY",
        sentiment: "POS",
        severityScore: 10,
        intent: "praise",
        featureArea: "Core Platform",
        customerLabel: "VP Product",
        createdAt: new Date(),
      },
    ];

    const res = extractProductGapsFromFeedback(mockFeedback);
    assert.strictEqual(res.competitiveSignals.length, 2);
    assert.ok(res.competitiveSignals.some((c) => c.competitorName === "Qualtrics"));
    assert.ok(res.competitiveSignals.some((c) => c.competitorName === "Pendo"));
    assert.ok(res.competitorSummary.includes("2 direct competitor"));
  });

  it("enforces workspace isolation on product gap queries", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "isolated-gaps-test" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Isolated Gaps Workspace",
          slug: "isolated-gaps-test",
        },
      });
    }

    const res = await getWorkspaceProductGaps(emptyWs.id);
    assert.strictEqual(res.productGaps.length, 0);
    assert.strictEqual(res.featureRequests.length, 0);
    assert.strictEqual(res.competitiveSignals.length, 0);
    assert.strictEqual(res.competitorSummary, "No competitor evidence available.");
  });
});
