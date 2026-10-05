import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const alerts = await db.alert.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Fetch alerts error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || !["ACTIVE", "ACKNOWLEDGED", "RESOLVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid alert id or status" }, { status: 400 });
    }

    const updated = await db.alert.updateMany({
      where: { id, workspaceId },
      data: { status },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error) {
    console.error("Update alert error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
