import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceActivityCenter } from "@/lib/activity";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const result = await getWorkspaceActivityCenter(auth.workspaceId!);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Activity notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace activity feed" },
      { status: 500 }
    );
  }
}
