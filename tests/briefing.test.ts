import { describe, it } from "node:test";
import assert from "node:assert";
import { generateExecutiveBriefing, getWorkspaceExecutiveBriefing } from "../lib/briefing";
import { db } from "../lib/db";

describe("Feature 7: AI Executive Intelligence Briefing Suite", () => {
  it("synthesizes executive briefing with burning fires, delighters, and grounded citations", () => {
    const mockFeedback = [
      {
        id: "br-1",
        content: "Exporting large PDF reports crashes the application every time.",
        channel: "SUPPORT_TICKET",
        customerLabel: "Enterprise Account",
        sentiment: "NEG",
        severityScore: 85,
        featureArea: "PDF Reports",
        intent: "complaint",
        churnRiskSignal: true,
        priority: "CRITICAL",
        createdAt: new Date(),
      },
      {
        id: "br-2",
        content: "PDF report export took 10 minutes and then returned an error.",
        channel: "SUPPORT_TICKET",
        customerLabel: "Mid-Market Lead",
        sentiment: "NEG",
        severityScore: 75,
        featureArea: "PDF Reports",
        intent: "complaint",
        churnRiskSignal: false,
        priority: "HIGH",
        createdAt: new Date(),
      },
      {
        id: "br-3",
        content: "The semantic search speed and accuracy is fantastic, saved our team hours.",
        channel: "COMMUNITY",
        customerLabel: "Advocate",
        sentiment: "POS",
        severityScore: 10,
        featureArea: "Semantic Search",
        intent: "praise",
        churnRiskSignal: false,
        priority: "LOW",
        createdAt: new Date(),
      },
    ];

    const res = generateExecutiveBriefing(mockFeedback);
    assert.strictEqual(res.metrics.totalFeedbackAnalyzed, 3);
    assert.strictEqual(res.metrics.criticalEscalationsCount, 2);
    assert.strictEqual(res.metrics.churnSignalsCount, 1);
    assert.strictEqual(res.metrics.positivePercentage, 33);
    assert.strictEqual(res.metrics.negativePercentage, 67);

    assert.ok(res.burningFires.length >= 1, "Must identify burning fires");
    assert.strictEqual(res.burningFires[0].area, "PDF Reports");
    assert.strictEqual(res.burningFires[0].reportCount, 2);
    assert.strictEqual(res.burningFires[0].citations.length, 2);

    assert.ok(res.customerDelights.length >= 1, "Must identify customer delighters");
    assert.strictEqual(res.customerDelights[0].area, "Semantic Search");

    assert.ok(res.strategicPriorities.length >= 1, "Must identify strategic priorities");
  });

  it("handles empty feedback gracefully with baseline health", () => {
    const res = generateExecutiveBriefing([]);
    assert.strictEqual(res.metrics.totalFeedbackAnalyzed, 0);
    assert.strictEqual(res.burningFires.length, 0);
    assert.strictEqual(res.customerDelights.length, 0);
    assert.ok(res.headline.includes("Baseline"));
  });

  it("enforces tenant boundary isolation when generating workspace briefing", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "isolated-briefing-test" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Isolated Briefing Workspace",
          slug: "isolated-briefing-test",
        },
      });
    }

    const res = await getWorkspaceExecutiveBriefing(emptyWs.id);
    assert.strictEqual(res.metrics.totalFeedbackAnalyzed, 0);
    assert.strictEqual(res.burningFires.length, 0);
  });
});
