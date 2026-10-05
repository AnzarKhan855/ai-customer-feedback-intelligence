import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { GenerateReportSchema } from "@/lib/types";
import { generateVoCReportNarrative } from "@/lib/ai";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const reports = await db.report.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        generatedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        title: r.title,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        createdAt: r.createdAt,
        generatedBy: r.generatedBy.name || r.generatedBy.email,
        content: JSON.parse(r.contentJson),
      })),
    });
  } catch (error) {
    console.error("Fetch reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const userId = auth.user.id;

  try {
    const body = await req.json();
    const result = GenerateReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid report configuration" },
        { status: 400 }
      );
    }

    const { period, type, title } = result.data;
    const now = new Date();
    let startDate = new Date();

    let periodLabel = "Last 30 Days";
    if (period === "7d") {
      startDate.setDate(now.getDate() - 7);
      periodLabel = "Last 7 Days (Weekly Digest)";
    } else if (period === "30d") {
      startDate.setDate(now.getDate() - 30);
      periodLabel = "Last 30 Days (Monthly Digest)";
    } else if (period === "90d") {
      startDate.setDate(now.getDate() - 90);
      periodLabel = "Last 90 Days (Quarterly Review)";
    } else {
      startDate = new Date(0);
      periodLabel = "All-Time Comprehensive Report";
    }

    // 1. Pre-compute statistics in code to prevent LLM numerical hallucination
    const feedbackItems = await db.feedback.findMany({
      where: {
        workspaceId,
        createdAt: { gte: startDate },
      },
      include: {
        themes: { include: { theme: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalCount = feedbackItems.length;
    const posCount = feedbackItems.filter((f) => f.sentiment === "POS").length;
    const neuCount = feedbackItems.filter((f) => f.sentiment === "NEU").length;
    const negCount = feedbackItems.filter((f) => f.sentiment === "NEG").length;

    // Theme counts
    const themeCounts: Record<string, { count: number; pos: number; neg: number }> = {};
    for (const f of feedbackItems) {
      for (const ft of f.themes) {
        const tName = ft.theme.name;
        if (!themeCounts[tName]) themeCounts[tName] = { count: 0, pos: 0, neg: 0 };
        themeCounts[tName].count++;
        if (f.sentiment === "POS") themeCounts[tName].pos++;
        if (f.sentiment === "NEG") themeCounts[tName].neg++;
      }
    }

    const topThemes = Object.entries(themeCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        sentiment: data.pos >= data.neg ? "Positive" : "Negative",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Emotion counts
    const emotionMap: Record<string, number> = {};
    feedbackItems.forEach((f) => {
      const em = f.emotion || "concern";
      emotionMap[em] = (emotionMap[em] || 0) + 1;
    });
    const topEmotions = Object.entries(emotionMap)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);

    // Aspect counts
    const aspectMap: Record<string, { count: number; pos: number; neg: number }> = {};
    feedbackItems.forEach((f) => {
      if (f.aspectsJson) {
        try {
          const parsed = JSON.parse(f.aspectsJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((a: any) => {
              if (a.aspect) {
                if (!aspectMap[a.aspect]) aspectMap[a.aspect] = { count: 0, pos: 0, neg: 0 };
                aspectMap[a.aspect].count++;
                if (a.sentiment === "POS") aspectMap[a.aspect].pos++;
                if (a.sentiment === "NEG") aspectMap[a.aspect].neg++;
              }
            });
          }
        } catch {}
      }
    });

    const topAspects = Object.entries(aspectMap)
      .map(([aspect, data]) => ({
        aspect,
        count: data.count,
        sentiment: data.pos >= data.neg ? "POS" : "NEG",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Pick top representative quotes
    const sampleQuotes = feedbackItems.slice(0, 8).map((f) => ({
      id: f.id,
      content: f.content,
      sentiment: f.sentiment,
      channel: f.channel,
      emotion: f.emotion || undefined,
    }));

    // 2. Generate narrative with AI Engine
    const reportData = await generateVoCReportNarrative({
      period: periodLabel,
      totalCount,
      reportType: type,
      sentimentBreakdown: { pos: posCount, neu: neuCount, neg: negCount },
      topThemes,
      topEmotions,
      topAspects,
      sampleQuotes,
    });

    // 3. Save report to database
    let defaultTitle = `Voice-of-Customer Digest (${periodLabel})`;
    if (type === "cx") defaultTitle = `Customer Experience (CX) Health Report (${periodLabel})`;
    else if (type === "complaints") defaultTitle = `Customer Complaint & Churn Risk Analysis (${periodLabel})`;

    const finalTitle = title?.trim() || defaultTitle;
    const createdReport = await db.report.create({
      data: {
        title: finalTitle,
        periodStart: startDate,
        periodEnd: now,
        contentJson: JSON.stringify(reportData),
        generatedById: userId,
        workspaceId,
      },
      include: {
        generatedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      report: {
        id: createdReport.id,
        title: createdReport.title,
        periodStart: createdReport.periodStart,
        periodEnd: createdReport.periodEnd,
        createdAt: createdReport.createdAt,
        generatedBy: createdReport.generatedBy.name || createdReport.generatedBy.email,
        content: reportData,
      },
    });
  } catch (error) {
    console.error("VoC generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
