import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceDuplicates } from "@/lib/deduplication";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const result = await getWorkspaceDuplicates(auth.workspaceId!);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Feedback deduplication error:", error);
    return NextResponse.json(
      { error: "Failed to detect feedback duplicates" },
      { status: 500 }
    );
  }
}
