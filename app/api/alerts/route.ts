import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

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

    const auditAction = status === "RESOLVED" ? "ALERT_RESOLVE" : "ALERT_ACKNOWLEDGE";
    await recordAuditLog({
      workspaceId,
      actorEmail: auth.user.email || "system@loop.dev",
      actorRole: auth.user.role,
      action: auditAction,
      entity: "Alert",
      entityId: id,
      metadata: { status, count: updated.count },
    });

    return NextResponse.json({ success: true, count: updated.count, status });
  } catch (error) {
    console.error("Update alert error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const body = await req.json();
    const { title, message, severity, type, metric } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const alert = await db.alert.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        severity: severity || "HIGH",
        type: type || "ANOMALY",
        metric: metric || null,
        status: "ACTIVE",
        workspaceId,
      },
    });

    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create alert" }, { status: 500 });
  }
}
