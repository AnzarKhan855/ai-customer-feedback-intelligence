import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceFeedbackClusters } from "@/lib/clusters";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const result = await getWorkspaceFeedbackClusters(auth.workspaceId!);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Feedback cluster exploration error:", error);
    return NextResponse.json(
      { error: "Failed to discover feedback clusters" },
      { status: 500 }
    );
  }
}
