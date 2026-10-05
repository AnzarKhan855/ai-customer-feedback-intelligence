import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const datasets = await db.dataset.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { feedback: true },
        },
      },
    });

    return NextResponse.json({
      datasets: datasets.map((d) => ({
        id: d.id,
        name: d.name,
        fileName: d.fileName,
        fileType: d.fileType,
        recordCount: d.recordCount,
        validCount: d.validCount,
        errorCount: d.errorCount,
        qualityScore: d.qualityScore,
        status: d.status,
        qualityMetrics: d.qualityMetrics ? JSON.parse(d.qualityMetrics) : null,
        feedbackCount: d._count.feedback,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch datasets error:", error);
    return NextResponse.json({ error: "Failed to fetch datasets" }, { status: 500 });
  }
}
