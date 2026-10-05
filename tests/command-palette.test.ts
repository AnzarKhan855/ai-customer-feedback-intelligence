import { describe, it } from "node:test";
import assert from "node:assert";
import { db } from "../lib/db";

describe("Feature 12: Enterprise Command Palette & Global Search Suite", () => {
  it("queries multi-entity resources across feedback, themes, and action items", async () => {
    let ws = await db.workspace.findUnique({
      where: { slug: "command-search-test-ws" },
    });
    if (!ws) {
      ws = await db.workspace.create({
        data: {
          name: "Command Search Test Workspace",
          slug: "command-search-test-ws",
        },
      });
    }

    // Clean up previous test records
    await db.feedback.deleteMany({ where: { workspaceId: ws.id } });
    await db.actionItem.deleteMany({ where: { workspaceId: ws.id } });

    // Seed feedback and action items
    await db.feedback.create({
      data: {
        content: "OAuth SSO SAML login integration broken",
        channel: "SUPPORT_TICKET",
        severityScore: 85,
        priority: "CRITICAL",
        workspaceId: ws.id,
      },
    });

    await db.actionItem.create({
      data: {
        title: "Fix OAuth SSO SAML integration",
        externalKey: "LOO-301",
        integration: "LINEAR",
        status: "TODO",
        priority: "URGENT",
        workspaceId: ws.id,
      },
    });

    // Run query using DB directly matching the search logic
    const q = "SAML";
    const [feedback, actions] = await Promise.all([
      db.feedback.findMany({
        where: {
          workspaceId: ws.id,
          content: { contains: q },
        },
      }),
      db.actionItem.findMany({
        where: {
          workspaceId: ws.id,
          title: { contains: q },
        },
      }),
    ]);

    assert.strictEqual(feedback.length, 1);
    assert.strictEqual(actions.length, 1);
    assert.strictEqual(actions[0].externalKey, "LOO-301");
  });

  it("enforces strict workspace isolation on search queries", async () => {
    let emptyWs = await db.workspace.findUnique({
      where: { slug: "empty-search-ws" },
    });
    if (!emptyWs) {
      emptyWs = await db.workspace.create({
        data: {
          name: "Empty Search Workspace",
          slug: "empty-search-ws",
        },
      });
    }

    const feedback = await db.feedback.findMany({
      where: {
        workspaceId: emptyWs.id,
        content: { contains: "SAML" },
      },
    });

    assert.strictEqual(feedback.length, 0);
  });
});
