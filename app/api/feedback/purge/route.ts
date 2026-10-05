import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  // Strict RBAC: Only ADMIN can execute data purges
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId;

  try {
    const body = await req.json();
    const { action, ids, status, olderThanDays } = body;

    // 1. Purge specific array of selected IDs
    if (action === "delete_selected" && Array.isArray(ids) && ids.length > 0) {
      // Delete join table and embeddings first for clean relational integrity
      await db.feedbackTheme.deleteMany({
        where: {
          feedbackId: { in: ids },
          feedback: { workspaceId },
        },
      });

      await db.embedding.deleteMany({
        where: {
          feedbackId: { in: ids },
          feedback: { workspaceId },
        },
      });

      const deleted = await db.feedback.deleteMany({
        where: {
          id: { in: ids },
          workspaceId,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully purged ${deleted.count} feedback records.`,
        deletedCount: deleted.count,
      });
    }

    // 2. Purge by criteria (e.g. status or age)
    if (action === "purge_criteria") {
      const whereClause: any = { workspaceId };

      if (status && ["NEW", "REVIEWED", "ACTIONED"].includes(status)) {
        whereClause.status = status;
      }

      if (olderThanDays && !isNaN(parseInt(olderThanDays))) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - parseInt(olderThanDays));
        whereClause.createdAt = { lte: thresholdDate };
      }

      // Find matching IDs
      const matchingItems = await db.feedback.findMany({
        where: whereClause,
        select: { id: true },
      });

      const matchingIds = matchingItems.map((i) => i.id);

      if (matchingIds.length > 0) {
        await db.feedbackTheme.deleteMany({
          where: { feedbackId: { in: matchingIds } },
        });

        await db.embedding.deleteMany({
          where: { feedbackId: { in: matchingIds } },
        });

        const deleted = await db.feedback.deleteMany({
          where: { id: { in: matchingIds } },
        });

        return NextResponse.json({
          success: true,
          message: `Successfully purged ${deleted.count} feedback records matching criteria.`,
          deletedCount: deleted.count,
        });
      }

      return NextResponse.json({
        success: true,
        message: "No feedback items matched the selected purge criteria.",
        deletedCount: 0,
      });
    }

    // 3. Purge all feedback in workspace
    if (action === "purge_all") {
      await db.feedbackTheme.deleteMany({
        where: { feedback: { workspaceId } },
      });

      await db.embedding.deleteMany({
        where: { feedback: { workspaceId } },
      });

      const deleted = await db.feedback.deleteMany({
        where: { workspaceId },
      });

      return NextResponse.json({
        success: true,
        message: `Complete workspace purge: Deleted all ${deleted.count} feedback items.`,
        deletedCount: deleted.count,
      });
    }

    return NextResponse.json({ error: "Invalid purge action specified" }, { status: 400 });
  } catch (error) {
    console.error("Purge feedback error:", error);
    return NextResponse.json({ error: "Failed to purge feedback" }, { status: 500 });
  }
}
