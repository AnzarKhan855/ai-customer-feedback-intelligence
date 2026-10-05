import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateCustomerHealth, FeedbackSignal } from "../lib/customer-health";

describe("Feature 1: Customer Health Intelligence Suite", () => {
  it("handles empty feedback dataset gracefully with perfect baseline health", () => {
    const res = calculateCustomerHealth([]);
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.tier, "HEALTHY");
    assert.strictEqual(res.signals.totalFeedback, 0);
    assert.strictEqual(res.signals.negativeCount, 0);
    assert.ok(res.reasons.length > 0);
    assert.ok(res.positiveDrivers.length > 0);
  });

  it("calculates high health score for predominantly positive, friction-free customers", () => {
    const mockFeedback: FeedbackSignal[] = [
      {
        id: "fb-1",
        customerLabel: "Enterprise Bank",
        sentiment: "POS",
        sentimentScore: 0.9,
        severityScore: 10,
        priority: "LOW",
        status: "REVIEWED",
        churnRiskSignal: false,
        featureArea: "Analytics",
        content: "Love the new reporting features, very fast and clean.",
        createdAt: new Date(),
      },
      {
        id: "fb-2",
        customerLabel: "Enterprise Bank",
        sentiment: "POS",
        sentimentScore: 0.8,
        severityScore: 15,
        priority: "LOW",
        status: "ACTIONED",
        churnRiskSignal: false,
        featureArea: "Analytics",
        content: "Exporting CSVs is effortless now.",
        createdAt: new Date(),
      },
    ];

    const res = calculateCustomerHealth(mockFeedback);
    assert.ok(res.score >= 85, `Expected score >= 85, got ${res.score}`);
    assert.strictEqual(res.tier, "HEALTHY");
    assert.strictEqual(res.signals.negativeCount, 0);
    assert.strictEqual(res.signals.positiveCount, 2);
    assert.strictEqual(res.signals.churnRiskCount, 0);
    assert.ok(res.positiveDrivers.some((d) => d.includes("100% of feedback reflects customer satisfaction")));
  });

  it("calculates CRITICAL health score and explainable reasons for accounts with severe churn risks & unresolved incidents", () => {
    const mockFeedback: FeedbackSignal[] = [
      {
        id: "fb-3",
        customerLabel: "Acme Financial",
        sentiment: "NEG",
        sentimentScore: -0.9,
        severityScore: 90,
        priority: "CRITICAL",
        status: "NEW", // Unresolved
        churnRiskSignal: true,
        featureArea: "Authentication",
        content: "SAML SSO is completely broken. If this isn't resolved today we are cancelling our annual contract.",
        createdAt: new Date(),
      },
      {
        id: "fb-4",
        customerLabel: "Acme Financial",
        sentiment: "NEG",
        sentimentScore: -0.85,
        severityScore: 85,
        priority: "CRITICAL",
        status: "NEW", // Unresolved
        churnRiskSignal: true,
        featureArea: "Billing",
        content: "Overcharged on the invoice and support has not responded for 48 hours.",
        createdAt: new Date(),
      },
      {
        id: "fb-5",
        customerLabel: "Acme Financial",
        sentiment: "NEG",
        sentimentScore: -0.7,
        severityScore: 60,
        priority: "HIGH",
        status: "NEW",
        churnRiskSignal: false,
        featureArea: "Authentication",
        content: "Directory sync failed again.",
        createdAt: new Date(),
      },
    ];

    const res = calculateCustomerHealth(mockFeedback);
    assert.ok(res.score < 40, `Expected critical score < 40, got ${res.score}`);
    assert.strictEqual(res.tier, "CRITICAL");
    assert.strictEqual(res.signals.unresolvedCriticalCount, 2);
    assert.strictEqual(res.signals.churnRiskCount, 2);

    // Verify "SHOW WHY" explainability
    assert.ok(res.reasons.some((r) => r.includes("negative")));
    assert.ok(res.reasons.some((r) => r.includes("unresolved critical")));
    assert.ok(res.reasons.some((r) => r.includes("churn-risk signals")));

    // Verify account level breakdown
    const acme = res.accounts.find((a) => a.customerLabel === "Acme Financial");
    assert.ok(acme, "Acme Financial account should be in account breakdown");
    assert.strictEqual(acme?.tier, "CRITICAL");
    assert.strictEqual(acme?.churnSignals, 2);
  });

  it("calculates AT_RISK health score for moderate negative sentiment with resolved critical issues", () => {
    const mockFeedback: FeedbackSignal[] = [
      {
        id: "fb-6",
        customerLabel: "Logistics Co",
        sentiment: "NEG",
        sentimentScore: -0.5,
        severityScore: 75,
        priority: "CRITICAL",
        status: "ACTIONED", // Resolved! Does not incur unresolved penalty
        churnRiskSignal: false,
        featureArea: "Mobile App",
        content: "App crashed once during delivery scan but support already patched it.",
        createdAt: new Date(),
      },
      {
        id: "fb-7",
        customerLabel: "Logistics Co",
        sentiment: "POS",
        sentimentScore: 0.6,
        severityScore: 20,
        priority: "LOW",
        status: "REVIEWED",
        churnRiskSignal: false,
        featureArea: "Mobile App",
        content: "Fast resolution on yesterday's bug.",
        createdAt: new Date(),
      },
      {
        id: "fb-8",
        customerLabel: "Logistics Co",
        sentiment: "NEU",
        sentimentScore: 0.0,
        severityScore: 30,
        priority: "MEDIUM",
        status: "NEW",
        churnRiskSignal: false,
        featureArea: "Dashboard",
        content: "Would be nice to have dark mode in mobile browser.",
        createdAt: new Date(),
      },
    ];

    const res = calculateCustomerHealth(mockFeedback);
    assert.ok(res.score >= 40 && res.score <= 90, `Score was ${res.score}`);
    assert.strictEqual(res.signals.unresolvedCriticalCount, 0);
  });
});
