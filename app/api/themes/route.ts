import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const themes = await db.theme.findMany({
      where: { workspaceId },
      include: {
        feedback: {
          include: {
            feedback: true,
          },
        },
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const result = themes.map((theme) => {
      const allItems = theme.feedback.map((ft) => ft.feedback);
      const totalCount = allItems.length;

      // Count in recent 7 days vs previous 7-14 days for trend detection
      const recentCount = allItems.filter((fb) => new Date(fb.createdAt) >= sevenDaysAgo).length;
      const previousCount = allItems.filter(
        (fb) => new Date(fb.createdAt) >= fourteenDaysAgo && new Date(fb.createdAt) < sevenDaysAgo
      ).length;

      let growthPct = 0;
      if (previousCount === 0) {
        growthPct = recentCount > 0 ? 100 : 0;
      } else {
        growthPct = Math.round(((recentCount - previousCount) / previousCount) * 100);
      }

      // Sentiment breakdown for this theme
      const posCount = allItems.filter((fb) => fb.sentiment === "POS").length;
      const neuCount = allItems.filter((fb) => fb.sentiment === "NEU").length;
      const negCount = allItems.filter((fb) => fb.sentiment === "NEG").length;

      // Flag as spiking if growth > 40% with minimum 3 recent feedback items
      const isSpiking = growthPct >= 40 && recentCount >= 3;

      return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        totalCount,
        recentCount,
        previousCount,
        growthPct,
        isSpiking,
        sentimentBreakdown: {
          positive: posCount,
          neutral: neuCount,
          negative: negCount,
          netScore: totalCount > 0 ? Math.round(((posCount - negCount) / totalCount) * 100) / 100 : 0,
        },
        sampleFeedback: allItems.slice(0, 3).map((f) => ({
          id: f.id,
          content: f.content,
          sentiment: f.sentiment,
          channel: f.channel,
          createdAt: f.createdAt,
        })),
      };
    });

    // Sort by total count descending
    result.sort((a, b) => b.totalCount - a.totalCount);

    return NextResponse.json({
      themes: result,
      totalThemes: result.length,
    });
  } catch (error) {
    console.error("Themes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const body = await req.json();
    const { name, description, color } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Theme name must be at least 2 characters" }, { status: 400 });
    }

    const theme = await db.theme.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#6366f1",
        workspaceId,
      },
    });

    return NextResponse.json({ success: true, theme });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A theme with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 });
    }

    const existing = await db.theme.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Theme not found or unauthorized" }, { status: 404 });
    }

    await db.feedbackTheme.deleteMany({
      where: { themeId: id },
    });

    await db.theme.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Theme successfully deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete theme" }, { status: 500 });
  }
}
