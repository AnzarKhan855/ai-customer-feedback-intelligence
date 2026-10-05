import { describe, it } from "node:test";
import assert from "node:assert";
import { getWorkspaceActivityCenter } from "../lib/activity";
import { db } from "../lib/db";

describe("Feature 11: Enterprise Activity Center Suite", () => {
  it("aggregates live alerts, critical escalations, and action items", async () => {
    let ws = await db.workspace.findUnique({
      where: { slug: "activity-center-test-ws" },
    });
    if (!ws) {
      ws = await db.workspace.create({
        data: {
          name: "Activity Center Test Workspace",
          slug: "activity-center-test-ws",
        },
      });
    }

    // Clean up existing
    await db.alert.deleteMany({ where: { workspaceId: ws.id } });
    await db.feedback.deleteMany({ where: { workspaceId: ws.id } });
    await db.actionItem.deleteMany({ where: { workspaceId: ws.id } });

    // Seed alert
    await db.alert.create({
      data: {
        title: "Spike in SSO Authentication Failures",
        message: "5 enterprise users reported login error 500",
        severity: "CRITICAL",
        type: "ANOMALY",
        status: "ACTIVE",
        workspaceId: ws.id,
      },
    });

    // Seed critical feedback
    await db.feedback.create({
      data: {
        content: "We cannot process invoice billing today, critical blocker.",
        channel: "SUPPORT_TICKET",
        severityScore: 90,
        priority: "CRITICAL",
        churnRiskSignal: true,
        status: "NEW",
        workspaceId: ws.id,
      },
    });

    // Seed action item
    await db.actionItem.create({
      data: {
        title: "Fix invoice billing gateway timeout",
        externalKey: "LOO-201",
        integration: "LINEAR",
        status: "TODO",
        priority: "URGENT",
        workspaceId: ws.id,
      },
    });

    const res = await getWorkspaceActivityCenter(ws.id);
    assert.strictEqual(res.totalActivities, 3);
    assert.strictEqual(res.unreadCount, 2); // 1 active alert + 1 new feedback

    assert.ok(res.items.some((i) => i.type === "ALERT" && i.severity === "CRITICAL"));
    assert.ok(res.items.some((i) => i.type === "FEEDBACK" && i.link === "/inbox"));
    assert.ok(res.items.some((i) => i.type === "ACTION" && i.title.includes("LOO-201")));
  });

  it("enforces tenant boundary isolation when querying activity center", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "empty-activity-test-ws" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Empty Activity Workspace",
          slug: "empty-activity-test-ws",
        },
      });
    }

    const res = await getWorkspaceActivityCenter(emptyWs.id);
    assert.strictEqual(res.totalActivities, 0);
    assert.strictEqual(res.unreadCount, 0);
    assert.strictEqual(res.items.length, 0);
  });
});
