import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AskQuestionSchema } from "@/lib/types";
import { searchSimilarFeedback } from "@/lib/search";
import { answerGroundedQuestion } from "@/lib/ai";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  const rateLimit = checkRateLimit(`ask:${workspaceId}`, { windowMs: 60 * 1000, maxRequests: 30 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 30 AI Analyst queries per minute." },
      {
        status: 429,
        headers: {
          "Retry-After": `${Math.ceil(rateLimit.resetMs / 1000)}`,
          "X-RateLimit-Limit": `${rateLimit.limit}`,
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const body = await req.json();
    const result = AskQuestionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid question format" },
        { status: 400 }
      );
    }

    const { question, limit, filterSentiment, filterTheme, filterChannel, minSeverity } = result.data;

    // 1. Semantic retrieval of top-K relevant feedback items strictly for this workspace
    const candidateLimit = Math.max(12, (limit || 8) * 3);
    let relevantFeedback = await searchSimilarFeedback(workspaceId, question, candidateLimit);

    if (filterSentiment) {
      relevantFeedback = relevantFeedback.filter((f) => f.sentiment === filterSentiment);
    }
    if (filterTheme) {
      relevantFeedback = relevantFeedback.filter((f) => f.themes.includes(filterTheme));
    }
    if (filterChannel) {
      relevantFeedback = relevantFeedback.filter((f) => f.channel === filterChannel);
    }
    if (minSeverity !== undefined) {
      relevantFeedback = relevantFeedback.filter((f) => (f.severityScore ?? 0) >= minSeverity);
    }

    relevantFeedback = relevantFeedback.slice(0, limit || 8);



    // 2. Enrich context items with emotions and severity
    const detailedFeedback = await db.feedback.findMany({
      where: {
        id: { in: relevantFeedback.map((f) => f.id) },
        workspaceId,
      },
    });

    const detailedMap = new Map(detailedFeedback.map((f) => [f.id, f]));

    const contextItems = relevantFeedback.map((f) => {
      const full = detailedMap.get(f.id);
      return {
        id: f.id,
        content: f.content,
        channel: f.channel,
        customer: f.customerLabel,
        sentiment: f.sentiment,
        sentimentScore: f.sentimentScore,
        emotion: full?.emotion || undefined,
        intent: full?.intent || undefined,
        severityScore: full?.severityScore || 25,
        priority: full?.priority || "LOW",
        featureArea: full?.featureArea || undefined,
      };
    });

    // 3. Grounded AI Analyst synthesis
    const aiResponse = await answerGroundedQuestion(question, contextItems);

    return NextResponse.json({
      success: true,
      question,
      answer: aiResponse.answer,
      citedFeedback: relevantFeedback,
      groundedItemsCount: relevantFeedback.length,
      metricsSummary: aiResponse.metricsSummary,
      confidence: 0.94,
    });
  } catch (error) {
    console.error("Ask LOOP error:", error);
    return NextResponse.json(
      { error: "Failed to generate grounded answer" },
      { status: 500 }
    );
  }
}
