import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceFeedbackTrends } from "@/lib/trends-detector";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const days = Math.min(180, Math.max(7, parseInt(searchParams.get("days") || "30")));

  try {
    const result = await getWorkspaceFeedbackTrends(auth.workspaceId!, days);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Emerging trends detection error:", error);
    return NextResponse.json(
      { error: "Failed to detect feedback trends" },
      { status: 500 }
    );
  }
}
