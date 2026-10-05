import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const { id } = params;

  try {
    const dataset = await db.dataset.findFirst({
      where: { id, workspaceId },
      include: {
        _count: { select: { feedback: true } },
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    return NextResponse.json({
      dataset: {
        ...dataset,
        qualityMetrics: dataset.qualityMetrics ? JSON.parse(dataset.qualityMetrics) : null,
        schemaMapping: dataset.schemaMapping ? JSON.parse(dataset.schemaMapping) : null,
      },
    });
  } catch (error) {
    console.error("Fetch dataset error:", error);
    return NextResponse.json({ error: "Failed to fetch dataset" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const { id } = params;

  try {
    const dataset = await db.dataset.findFirst({
      where: { id, workspaceId },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    // Find all feedback under this dataset
    const feedbackItems = await db.feedback.findMany({
      where: { datasetId: id, workspaceId },
      select: { id: true },
    });
    const feedbackIds = feedbackItems.map((f) => f.id);

    if (feedbackIds.length > 0) {
      await db.embedding.deleteMany({ where: { feedbackId: { in: feedbackIds } } });
      await db.feedbackTheme.deleteMany({ where: { feedbackId: { in: feedbackIds } } });
      await db.feedback.deleteMany({ where: { id: { in: feedbackIds } } });
    }

    await db.dataset.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Dataset and ${feedbackIds.length} feedback items deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete dataset error:", error);
    return NextResponse.json({ error: "Failed to delete dataset" }, { status: 500 });
  }
}
