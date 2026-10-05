import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { buildAndSaveCustomReport } from "@/lib/report-builder";

export async function POST(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const {
      title,
      reportType = "EXECUTIVE_OVERVIEW",
      period = "30d",
      channelFilter,
      featureAreaFilter,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Report title is required" }, { status: 400 });
    }

    const report = await buildAndSaveCustomReport({
      workspaceId: auth.workspaceId!,
      userId: auth.user.id,
      userEmail: auth.user.email || undefined,
      userRole: auth.user.role,
      title: title.trim(),
      reportType,
      period,
      channelFilter,
      featureAreaFilter,
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error: any) {
    console.error("Custom report generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate custom report" },
      { status: 500 }
    );
  }
}
