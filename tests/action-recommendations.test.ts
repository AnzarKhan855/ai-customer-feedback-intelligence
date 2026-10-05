import { describe, it } from "node:test";
import assert from "node:assert";
import {
  generateRecommendationsFromFeedback,
  promoteRecommendationToActionItem,
} from "../lib/action-recommendations";
import { db } from "../lib/db";

describe("Feature 9: Smart Action Recommendation Engine Suite", () => {
  it("generates prioritized, evidence-backed recommendations from friction feedback", () => {
    const mockFeedback = [
      {
        id: "rc-1",
        content: "Checkout credit card form crashes intermittently when paying with Amex.",
        channel: "SUPPORT_TICKET",
        severityScore: 90,
        churnRiskSignal: true,
        featureArea: "Checkout & Payments",
        intent: "billing_issue",
      },
      {
        id: "rc-2",
        content: "Unable to complete subscription renewal due to gateway timeout.",
        channel: "SALES_CALL",
        severityScore: 80,
        churnRiskSignal: true,
        featureArea: "Checkout & Payments",
        intent: "billing_issue",
      },
    ];

    const recs = generateRecommendationsFromFeedback(mockFeedback);
    assert.strictEqual(recs.length, 1);
    const rec = recs[0];
    assert.strictEqual(rec.priority, "CRITICAL");
    assert.ok(rec.problem.includes("Checkout & Payments"));
    assert.ok(rec.businessImpact.includes("Protects revenue"));
    assert.ok(rec.evidence.includes("Amex"));
  });

  it("returns empty recommendations when no significant friction exists", () => {
    const recs = generateRecommendationsFromFeedback([]);
    assert.strictEqual(recs.length, 0);

    const mildFeedback = [
      {
        id: "rc-3",
        content: "Love the new theme design!",
        channel: "COMMUNITY",
        severityScore: 10,
        churnRiskSignal: false,
        featureArea: "Theme",
        intent: "praise",
      },
    ];
    const mildRecs = generateRecommendationsFromFeedback(mildFeedback);
    assert.strictEqual(mildRecs.length, 0);
  });

  it("promotes recommendation to ActionItem and updates recommendation lifecycle", async () => {
    let ws = await db.workspace.findUnique({
      where: { slug: "rec-promo-test" },
    });
    if (!ws) {
      ws = await db.workspace.create({
        data: {
          name: "Rec Promo Test Workspace",
          slug: "rec-promo-test",
        },
      });
    }

    const rec = await db.aIRecommendation.create({
      data: {
        problem: "SSO Login Latency Spike",
        evidence: "Reported by 5 enterprise tenants",
        businessImpact: "Risk to enterprise renewals",
        recommendedAction: "Optimize OAuth token validation cache",
        priority: "CRITICAL",
        expectedOutcome: "Sub-200ms login response times",
        status: "OPEN",
        workspaceId: ws.id,
      },
    });

    const promoResult = await promoteRecommendationToActionItem({
      recommendationId: rec.id,
      workspaceId: ws.id,
      integration: "LINEAR",
    });

    assert.ok(promoResult.actionItem.id);
    assert.strictEqual(promoResult.actionItem.integration, "LINEAR");
    assert.ok(promoResult.actionItem.externalKey.startsWith("LOO-"));
    assert.strictEqual(promoResult.recommendation.status, "IN_PROGRESS");

    // Verify in database
    const dbAction = await db.actionItem.findUnique({
      where: { id: promoResult.actionItem.id },
    });
    assert.ok(dbAction);
    assert.strictEqual(dbAction?.workspaceId, ws.id);
  });

  it("prevents cross-tenant recommendation promotion (IDOR prevention)", async () => {
    let ws1 = await db.workspace.findUnique({ where: { slug: "rec-promo-ws1" } });
    if (!ws1) ws1 = await db.workspace.create({ data: { name: "WS 1", slug: "rec-promo-ws1" } });

    let ws2 = await db.workspace.findUnique({ where: { slug: "rec-promo-ws2" } });
    if (!ws2) ws2 = await db.workspace.create({ data: { name: "WS 2", slug: "rec-promo-ws2" } });

    const recInWs1 = await db.aIRecommendation.create({
      data: {
        problem: "WS1 Specific Issue",
        evidence: "Evidence",
        businessImpact: "Impact",
        recommendedAction: "Action",
        priority: "HIGH",
        expectedOutcome: "Outcome",
        status: "OPEN",
        workspaceId: ws1.id,
      },
    });

    // Attempt to promote WS1 recommendation from WS2 context
    await assert.rejects(
      async () => {
        await promoteRecommendationToActionItem({
          recommendationId: recInWs1.id,
          workspaceId: ws2.id,
        });
      },
      /Recommendation not found or unauthorized/
    );
  });
});
