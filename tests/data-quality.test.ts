import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeFeedbackText,
  detectCandidateColumns,
  calculateQualityScore,
  validateAndCleanIngestionData,
} from "../lib/data-quality";

describe("Data Quality & Ingestion Engine", () => {
  describe("Text Normalization", () => {
    test("strips control characters and normalizes excess whitespace", () => {
      const raw = "  Hello \u0000 world \t\t with\n\n\nnewlines  and   tabs   ";
      const cleaned = normalizeFeedbackText(raw);
      assert.equal(cleaned, "Hello world with\n\nnewlines and tabs");
    });

    test("handles empty or null inputs gracefully", () => {
      assert.equal(normalizeFeedbackText(""), "");
      assert.equal(normalizeFeedbackText(null as any), "");
      assert.equal(normalizeFeedbackText(undefined as any), "");
    });
  });

  describe("Schema & Candidate Column Inference", () => {
    test("detects standard feedback and channel column headers", () => {
      const sample = {
        Feedback_Comment: "App crashes when exporting CSV",
        Source_Channel: "Zendesk",
        User_Email: "jane@example.com",
        Product_Area: "Exports",
        Geo_Region: "EMEA",
      };

      const detected = detectCandidateColumns(sample);
      assert.equal(detected.feedbackCol, "Feedback_Comment");
      assert.equal(detected.channelCol, "Source_Channel");
      assert.equal(detected.customerCol, "User_Email");
      assert.equal(detected.productCol, "Product_Area");
      assert.equal(detected.regionCol, "Geo_Region");
    });

    test("falls back intelligently when standard headers are absent", () => {
      const sample = {
        notes: "Random observation about speed",
        score: "4",
      };
      const detected = detectCandidateColumns(sample);
      assert.equal(detected.feedbackCol, "notes");
    });
  });

  describe("Quality Score Calculation", () => {
    test("calculates a high score for complete and clean data", () => {
      const score = calculateQualityScore({
        completenessRate: 100,
        validityRate: 100,
        uniquenessRate: 100,
        sentimentConsistencyRate: 95,
      });

      assert.ok(score >= 95, `Expected score >= 95, got ${score}`);
      assert.ok(score <= 100);
    });

    test("penalizes duplicate and invalid rows proportionately", () => {
      const score = calculateQualityScore({
        completenessRate: 50,
        validityRate: 60,
        uniquenessRate: 40,
        sentimentConsistencyRate: 50,
      });

      assert.ok(score < 60, `Expected low score, got ${score}`);
    });
  });

  describe("Full Ingestion Validation & Deduplication", () => {
    test("filters out duplicates and short boilerplate text", () => {
      const rawRows = [
        { feedback: "The onboarding tutorial was very clear and helpful.", channel: "Intercom" },
        { feedback: "The onboarding tutorial was very clear and helpful.", channel: "Intercom" }, // duplicate!
        { feedback: "k", channel: "Zendesk" }, // too short / boilerplate (< 5 chars)
        { feedback: "", channel: "Email" }, // empty
        { feedback: "Billing invoice is missing VAT registration number.", channel: "Email" },
      ];

      const validation = validateAndCleanIngestionData(rawRows);
      assert.equal(validation.validRows.length, 2);
      assert.equal(validation.duplicateCount, 1);
      assert.equal(validation.invalidRows.length, 3); // duplicate, 'k', and empty
      assert.ok(validation.qualityMetrics.overallQualityScore > 0);
    });
  });
});
