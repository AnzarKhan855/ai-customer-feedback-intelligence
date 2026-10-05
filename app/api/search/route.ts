import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10")));

  if (!q) {
    return NextResponse.json({
      query: "",
      results: { feedback: [], themes: [], recommendations: [], actionItems: [] },
      totalMatches: 0,
    });
  }

  try {
    const [feedback, themes, recommendations, actionItems] = await Promise.all([
      db.feedback.findMany({
        where: {
          workspaceId,
          OR: [
            { content: { contains: q } },
            { customerLabel: { contains: q } },
            { featureArea: { contains: q } },
          ],
        },
        take: limit,
        select: {
          id: true,
          content: true,
          customerLabel: true,
          channel: true,
          sentiment: true,
          priority: true,
          severityScore: true,
          createdAt: true,
        },
      }),
      db.theme.findMany({
        where: {
          workspaceId,
          name: { contains: q },
        },
        take: limit,
        select: {
          id: true,
          name: true,
          color: true,
          _count: { select: { feedback: true } },
        },
      }),
      db.aIRecommendation.findMany({
        where: {
          workspaceId,
          OR: [
            { problem: { contains: q } },
            { recommendedAction: { contains: q } },
          ],
        },
        take: limit,
        select: {
          id: true,
          problem: true,
          recommendedAction: true,
          priority: true,
          status: true,
        },
      }),
      db.actionItem.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { externalKey: { contains: q } },
          ],
        },
        take: limit,
        select: {
          id: true,
          title: true,
          externalKey: true,
          priority: true,
          status: true,
        },
      }),
    ]);

    const totalMatches =
      feedback.length + themes.length + recommendations.length + actionItems.length;

    return NextResponse.json({
      query: q,
      results: {
        feedback,
        themes,
        recommendations,
        actionItems,
      },
      totalMatches,
    });
  } catch (error) {
    console.error("Multi-entity search error:", error);
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 });
  }
}
