import { describe, it } from "node:test";
import assert from "node:assert";
import { getWorkspaceDataOpsDiagnostics } from "../lib/data-ops";
import { db } from "../lib/db";

describe("Feature 14: Data Quality & Ingestion Command Center Suite", () => {
  it("calculates workspace data quality metrics and hygiene rating", async () => {
    let ws = await db.workspace.findUnique({
      where: { slug: "data-ops-test-ws" },
    });
    if (!ws) {
      ws = await db.workspace.create({
        data: {
          name: "Data Ops Test Workspace",
          slug: "data-ops-test-ws",
        },
      });
    }

    await db.dataset.deleteMany({ where: { workspaceId: ws.id } });
    await db.feedback.deleteMany({ where: { workspaceId: ws.id } });

    // Seed dataset
    await db.dataset.create({
      data: {
        name: "Enterprise Q1 CSV Export",
        fileName: "feedback_q1.csv",
        fileType: "CSV",
        recordCount: 100,
        validCount: 95,
        errorCount: 5,
        qualityScore: 92.5,
        status: "READY",
        workspaceId: ws.id,
      },
    });

    // Seed feedback channel
    await db.feedback.create({
      data: {
        content: "Great customer service experience on chat support.",
        channel: "SUPPORT_TICKET",
        sentiment: "POS",
        severityScore: 10,
        workspaceId: ws.id,
      },
    });

    const res = await getWorkspaceDataOpsDiagnostics(ws.id);
    assert.strictEqual(res.totalDatasets, 1);
    assert.strictEqual(res.totalRecordsIngested, 100);
    assert.strictEqual(res.totalValidRecords, 95);
    assert.strictEqual(res.totalErrorRecords, 5);
    assert.strictEqual(res.averageQualityScore, 92.5);
    assert.strictEqual(res.overallDataHygieneRating, "EXCELLENT");
    assert.strictEqual(res.channelDistribution["SUPPORT_TICKET"], 1);
    assert.ok(res.recommendations.length >= 1);
  });

  it("enforces tenant boundary isolation on data ops diagnostics", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "empty-data-ops-ws" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Empty Data Ops Workspace",
          slug: "empty-data-ops-ws",
        },
      });
    }

    const res = await getWorkspaceDataOpsDiagnostics(emptyWs.id);
    assert.strictEqual(res.totalDatasets, 0);
    assert.strictEqual(res.totalRecordsIngested, 0);
    assert.strictEqual(res.totalValidRecords, 0);
    assert.strictEqual(res.totalErrorRecords, 0);
  });
});
