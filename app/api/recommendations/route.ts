import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const recommendations = await db.aIRecommendation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Fetch recommendations error:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid recommendation ID or status" }, { status: 400 });
    }

    const updated = await db.aIRecommendation.updateMany({
      where: { id, workspaceId },
      data: { status },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error) {
    console.error("Update recommendation error:", error);
    return NextResponse.json({ error: "Failed to update recommendation" }, { status: 500 });
  }
}
