import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db";
import { searchSimilarFeedback } from "../lib/search";
import { answerGroundedQuestion } from "../lib/ai";

describe("RAG Retrieval & Grounding Quality", () => {
  test("enforces strict workspace isolation on semantic search", async () => {
    const bogusWorkspaceId = "bogus-workspace-isolation-id-99999";
    const results = await searchSimilarFeedback(
      bogusWorkspaceId,
      "What issues are customers reporting about refunds and billing?",
      5
    );
    assert.equal(results.length, 0, "Non-existent workspace must yield 0 retrieved records");
  });

  test("Query 1: honest zero-match detection for absent topic (audio playback / buffering)", async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: "acme-corp" },
    });
    assert.ok(workspace);

    const query = "Why are customers complaining about audio playback and buffering?";
    const results = await searchSimilarFeedback(workspace.id, query, 5);

    // Audio streaming/buffering does not exist in Acme Corp B2B SaaS dataset
    assert.equal(
      results.length,
      0,
      "Absent topic must yield 0 retrieved matches instead of hallucinated false positives"
    );

    const grounded = await answerGroundedQuestion(query, []);
    assert.equal(grounded.citedIds.length, 0, "Must have zero citations when evidence is absent");
    assert.match(
      grounded.answer,
      /No relevant customer feedback was found/i,
      "Answer must explicitly acknowledge absence of evidence"
    );
  });

  test("Query 2: retrieves high-relevance billing and refund records", async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: "acme-corp" },
    });
    assert.ok(workspace);

    const query = "What issues are customers reporting about refunds and billing?";
    const results = await searchSimilarFeedback(workspace.id, query, 5);

    assert.ok(results.length > 0, "Should retrieve matching billing feedback");
    // Verify all retrieved results contain billing or refund topics
    results.forEach((r) => {
      const text = r.content.toLowerCase();
      const hasTopic =
        text.includes("bill") ||
        text.includes("refund") ||
        text.includes("invoice") ||
        text.includes("charge");
      assert.ok(hasTopic, `Retrieved item "${r.content}" must match billing topic`);
      assert.ok(r.score >= 0.15, "Score must meet minimum relevance threshold");
    });

    const contextItems = results.map((r) => ({
      id: r.id,
      content: r.content,
      channel: r.channel,
      sentiment: r.sentiment,
      sentimentScore: r.sentimentScore,
    }));
    const grounded = await answerGroundedQuestion(query, contextItems);
    assert.ok(grounded.citedIds.length > 0, "Must cite retrieved record IDs");
    grounded.citedIds.forEach((id) => {
      assert.ok(
        results.some((r) => r.id === id),
        "Cited ID must exist in retrieved context"
      );
    });
  });

  test("Query 3: retrieves authentication and login records with deduplication", async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: "acme-corp" },
    });
    assert.ok(workspace);

    const query = "What are customers saying about login failures and account access?";
    const results = await searchSimilarFeedback(workspace.id, query, 5);

    assert.ok(results.length > 0, "Should retrieve authentication feedback");
    results.forEach((r) => {
      const text = r.content.toLowerCase();
      const hasAuth =
        text.includes("login") ||
        text.includes("sso") ||
        text.includes("oauth") ||
        text.includes("account") ||
        text.includes("access") ||
        text.includes("password");
      assert.ok(hasAuth, `Retrieved item "${r.content}" must be auth/access related`);
    });

    // Verify deduplication: no duplicate content snippets
    const snippets = results.map((r) => r.content.slice(0, 40));
    const uniqueSnippets = new Set(snippets);
    assert.equal(
      snippets.length,
      uniqueSnippets.size,
      "Deduplication must prevent duplicate snippet templates"
    );
  });
});
