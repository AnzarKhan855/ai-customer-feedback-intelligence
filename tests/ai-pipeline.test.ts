import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { deterministicClassify, classifyFeedback } from "../lib/ai";
import { AIClassificationSchema } from "../lib/types";

describe("AI & NLP Intelligence Pipeline", () => {
  describe("Plutchik-8 Emotion Taxonomy & Sentiment", () => {
    test("classifies strong negative feedback with frustration/anger", async () => {
      const text = "Your app crashed 3 times during checkout and our corporate card got charged twice! This is completely broken and unusable!";
      const result = await classifyFeedback(text);

      assert.equal(result.sentiment, "NEG");
      assert.ok(result.sentimentScore < -0.3, "Expected negative score");
      assert.ok(
        ["frustration", "anger", "disappointment", "concern"].includes(result.emotion),
        `Unexpected emotion: ${result.emotion}`
      );
      assert.ok(result.severityScore >= 60, "Checkout failure should have high severity");
      assert.ok(["CRITICAL", "HIGH"].includes(result.priority));
    });

    test("classifies glowing positive feedback with delight/happiness", async () => {
      const text = "We love the new bulk export feature! It saved our engineering team 10 hours every week. Absolutely seamless and delightful!";
      const result = await classifyFeedback(text);

      assert.equal(result.sentiment, "POS");
      assert.ok(result.sentimentScore > 0.4, "Expected positive score");
      assert.ok(
        ["delight", "satisfaction", "happiness", "excitement"].includes(result.emotion),
        `Unexpected emotion: ${result.emotion}`
      );
      assert.equal(result.priority, "LOW");
      assert.equal(result.churnRiskSignal, false);
    });

    test("classifies confusion for onboarding ambiguity", async () => {
      const text = "I am confused by the workspace invitation flow. Where do I find the API credentials page? Can someone explain how this works?";
      const result = await classifyFeedback(text);

      assert.ok(["confusion", "concern", "disappointment"].includes(result.emotion));
      assert.ok(["question", "product_inquiry", "suggestion"].includes(result.intent));
    });
  });

  describe("Aspect-Based Sentiment Analysis (ABSA)", () => {
    test("extracts distinct aspects with granular sentiments", () => {
      const text = "The user interface is gorgeous and clean, but the database export is painfully slow and times out.";
      const result = deterministicClassify(text);

      assert.ok(result.aspects.length >= 1, "Should detect at least 1 aspect");
      const aspectNames = result.aspects.map((a) => a.aspect.toLowerCase());

      const hasUI = aspectNames.some((a) => a.includes("ui") || a.includes("interface"));
      const hasPerf = aspectNames.some((a) => a.includes("performance") || a.includes("speed") || a.includes("export"));
      assert.ok(hasUI || hasPerf, "Should extract UI or Performance aspect");

      // Verify each aspect conforms to schema
      result.aspects.forEach((asp) => {
        assert.ok(["POS", "NEU", "NEG"].includes(asp.sentiment));
        assert.ok(asp.score >= -1.0 && asp.score <= 1.0);
        assert.ok(typeof asp.rationale === "string" && asp.rationale.length > 0);
      });
    });
  });

  describe("Intent Classification Taxonomy", () => {
    test("identifies bug report intent", () => {
      const text = "Encountered a fatal 500 error when clicking submit on the webhook settings dialog.";
      const result = deterministicClassify(text);
      assert.ok(["complaint", "technical_issue", "bug_report"].includes(result.intent));
    });

    test("identifies feature request intent", () => {
      const text = "Would love to see an integration with Snowflake and Databricks for real-time customer data streaming.";
      const result = deterministicClassify(text);
      assert.ok(["suggestion", "feature_request"].includes(result.intent));
    });

    test("identifies refund / cancellation intent", () => {
      const text = "We would like to cancel our enterprise renewal and request a full refund due to lack of SLA adherence.";
      const result = deterministicClassify(text);
      assert.ok(["refund_request", "cancellation", "complaint"].includes(result.intent));
      assert.equal(result.churnRiskSignal, true);
    });
  });

  describe("Severity Formula & Churn Risk Detection", () => {
    test("calculates P0 Critical for security, data loss, and multi-user lockout", () => {
      const text = "CRITICAL: Security vulnerability! SSO authentication failure is locking out our entire organization and exposing audit logs.";
      const result = deterministicClassify(text);

      assert.ok(result.severityScore >= 80, `Expected severity >= 80, got ${result.severityScore}`);
      assert.equal(result.priority, "CRITICAL");
      assert.ok(result.severityRationale.length > 0);
      assert.equal(result.churnRiskSignal, true);
    });

    test("calculates Low severity for minor aesthetic feedback", () => {
      const text = "Would be nice if the dark mode button was 2 pixels further to the right. Overall great platform!";
      const result = deterministicClassify(text);

      assert.ok(result.severityScore <= 45, `Expected severity <= 45, got ${result.severityScore}`);
      assert.ok(["LOW", "MEDIUM"].includes(result.priority));
      assert.equal(result.churnRiskSignal, false);
    });
  });

  describe("Schema Validation Rigor", () => {
    test("ensures all fields strictly conform to AIClassificationSchema", () => {
      const feedbackSamples = [
        "Everything is working perfectly. Fast response times and great customer service.",
        "Error 404 on API endpoints when sending large JSON payloads. Need urgent fix.",
        "Pricing is too high for startups, considering moving to competitor next month."
      ];

      for (const sample of feedbackSamples) {
        const classified = deterministicClassify(sample);
        const parsed = AIClassificationSchema.safeParse(classified);
        assert.ok(parsed.success, `Schema validation failed for: "${sample}": ${JSON.stringify(parsed.error?.issues)}`);
      }
    });
  });
});
