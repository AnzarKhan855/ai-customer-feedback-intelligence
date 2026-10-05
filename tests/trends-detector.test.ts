import { describe, it } from "node:test";
import assert from "node:assert";
import { detectTrendsFromFeedback, getWorkspaceFeedbackTrends } from "../lib/trends-detector";
import { db } from "../lib/db";

describe("Feature 3: Customer Feedback Trend Detection Suite", () => {
  it("flags insufficient data when fewer than 4 feedback records exist", () => {
    const res = detectTrendsFromFeedback([]);
    assert.strictEqual(res.hasSufficientData, false);
    assert.strictEqual(res.trends.length, 0);
    assert.ok(res.anomalies[0].includes("Insufficient feedback volume"));
  });

  it("detects EMERGING volume surge on newly emerging friction areas", () => {
    const now = new Date();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

    const mockFeedback = [
      // 3 recent in SSO (Current window)
      {
        id: "fb-1",
        content: "SAML SSO fails with 401 error.",
        channel: "SUPPORT_TICKET",
        sentiment: "NEG",
        severityScore: 85,
        featureArea: "Authentication",
        churnRiskSignal: true,
        createdAt: twoDaysAgo,
      },
      {
        id: "fb-2",
        content: "Cannot authenticate with Okta.",
        channel: "SUPPORT_TICKET",
        sentiment: "NEG",
        severityScore: 90,
        featureArea: "Authentication",
        churnRiskSignal: true,
        createdAt: twoDaysAgo,
      },
      {
        id: "fb-3",
        content: "SSO certificate error.",
        channel: "COMMUNITY",
        sentiment: "NEG",
        severityScore: 80,
        featureArea: "Authentication",
        churnRiskSignal: false,
        createdAt: twoDaysAgo,
      },
      // 1 old in Billing (Prior window)
      {
        id: "fb-4",
        content: "Invoice receipt PDF missing.",
        channel: "SUPPORT_TICKET",
        sentiment: "NEU",
        severityScore: 30,
        featureArea: "Billing",
        churnRiskSignal: false,
        createdAt: twentyDaysAgo,
      },
      // 1 old in Core
      {
        id: "fb-5",
        content: "Old feedback item.",
        channel: "COMMUNITY",
        sentiment: "POS",
        severityScore: 20,
        featureArea: "Core Platform",
        churnRiskSignal: false,
        createdAt: twentyDaysAgo,
      },
    ];

    const res = detectTrendsFromFeedback(mockFeedback, 30);
    assert.strictEqual(res.hasSufficientData, true);
    assert.ok(res.trends.length > 0);

    const authTrend = res.trends.find((t) => t.topic === "Authentication");
    assert.ok(authTrend, "Must detect Authentication trend");
    assert.strictEqual(authTrend?.status, "EMERGING");
    assert.strictEqual(authTrend?.currentPeriodCount, 3);
    assert.strictEqual(authTrend?.priorPeriodCount, 0);
    assert.ok(authTrend!.magnitudePct >= 100);
    assert.ok(authTrend!.severityScore >= 80);

    // Churn anomaly flagged
    assert.ok(res.anomalies.some((a) => a.includes("Churn Risk Surge")));
  });

  it("detects DECLINING trend when historical complaints resolve and drop in current period", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

    const mockFeedback = [
      // 1 recent in Mobile
      {
        id: "fb-1",
        content: "Mobile layout clean now.",
        channel: "APP_STORE",
        sentiment: "POS",
        severityScore: 20,
        featureArea: "Mobile App",
        churnRiskSignal: false,
        createdAt: twoDaysAgo,
      },
      // 4 old complaints in Mobile (prior window)
      {
        id: "fb-2",
        content: "Mobile app crash on boot.",
        channel: "APP_STORE",
        sentiment: "NEG",
        severityScore: 75,
        featureArea: "Mobile App",
        churnRiskSignal: false,
        createdAt: twentyDaysAgo,
      },
      {
        id: "fb-3",
        content: "Mobile app laggy scrolling.",
        channel: "APP_STORE",
        sentiment: "NEG",
        severityScore: 70,
        featureArea: "Mobile App",
        churnRiskSignal: false,
        createdAt: twentyDaysAgo,
      },
      {
        id: "fb-4",
        content: "Cannot submit forms on mobile.",
        channel: "APP_STORE",
        sentiment: "NEG",
        severityScore: 80,
        featureArea: "Mobile App",
        churnRiskSignal: false,
        createdAt: twentyDaysAgo,
      },
      {
        id: "fb-5",
        content: "White screen on mobile load.",
        channel: "APP_STORE",
        sentiment: "NEG",
        severityScore: 75,
        featureArea: "Mobile App",
        churnRiskSignal: false,
        createdAt: twentyDaysAgo,
      },
    ];

    const res = detectTrendsFromFeedback(mockFeedback, 30);
    const mobileTrend = res.trends.find((t) => t.topic === "Mobile App");
    assert.ok(mobileTrend, "Must detect Mobile App trend");
    assert.strictEqual(mobileTrend?.status, "DECLINING");
    assert.ok(mobileTrend!.magnitudePct < 0);
  });

  it("enforces tenant workspace isolation on trend queries", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "isolated-trends-test" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Isolated Trends Workspace",
          slug: "isolated-trends-test",
        },
      });
    }

    const res = await getWorkspaceFeedbackTrends(emptyWs.id, 30);
    assert.strictEqual(res.hasSufficientData, false);
    assert.strictEqual(res.trends.length, 0);
  });
});
