import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const sentiment = searchParams.get("sentiment") || "";
    const channel = searchParams.get("channel") || "";
    const status = searchParams.get("status") || "";

    const where: any = {
      workspaceId: session.user.workspaceId,
    };

    if (search) {
      where.OR = [
        { content: { contains: search } },
        { customerLabel: { contains: search } },
        { featureArea: { contains: search } },
        { sourceRef: { contains: search } },
      ];
    }
    if (sentiment) where.sentiment = sentiment;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const items = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Build CSV Content
    const headers = [
      "ID",
      "Created At",
      "Channel",
      "Customer",
      "Sentiment",
      "Sentiment Score",
      "Emotion",
      "Intent",
      "Severity Score",
      "Priority",
      "Churn Risk Signal",
      "Feature Area",
      "Status",
      "Source Ref",
      "Root Cause Hypothesis",
      "Content",
    ];

    const escapeCSV = (str: string | null | undefined) => {
      if (!str) return '""';
      const clean = str.replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = items.map((item) => [
      item.id,
      item.createdAt.toISOString(),
      item.channel,
      escapeCSV(item.customerLabel),
      item.sentiment,
      item.sentimentScore,
      escapeCSV(item.emotion),
      escapeCSV(item.intent),
      item.severityScore ?? 0,
      escapeCSV(item.priority),
      item.churnRiskSignal ? "YES" : "NO",
      escapeCSV(item.featureArea),
      item.status,
      escapeCSV(item.sourceRef),
      escapeCSV(item.rootCauseHypothesis),
      escapeCSV(item.content),
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="loop_feedback_export_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
  }
}
