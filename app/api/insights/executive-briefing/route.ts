import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceExecutiveBriefing } from "@/lib/briefing";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const result = await getWorkspaceExecutiveBriefing(auth.workspaceId!);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Executive briefing error:", error);
    return NextResponse.json(
      { error: "Failed to generate executive intelligence briefing" },
      { status: 500 }
    );
  }
}
