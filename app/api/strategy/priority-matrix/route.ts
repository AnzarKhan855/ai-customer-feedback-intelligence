import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspacePriorityMatrix } from "@/lib/priority-matrix";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const result = await getWorkspacePriorityMatrix(auth.workspaceId!);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Priority matrix error:", error);
    return NextResponse.json(
      { error: "Failed to compute priority matrix" },
      { status: 500 }
    );
  }
}
