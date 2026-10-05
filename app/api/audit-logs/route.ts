import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const action = searchParams.get("action")?.trim() || "";
  const entity = searchParams.get("entity")?.trim() || "";

  try {
    const where: any = { workspaceId };
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const totalCount = await db.auditLog.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const skip = (page - 1) * limit;

    const auditLogs = await db.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const formattedLogs = auditLogs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));

    return NextResponse.json({
      auditLogs: formattedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
