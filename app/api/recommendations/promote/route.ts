import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { promoteRecommendationToActionItem } from "@/lib/action-recommendations";

export async function POST(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { recommendationId, integration } = body;

    if (!recommendationId) {
      return NextResponse.json(
        { error: "recommendationId is required" },
        { status: 400 }
      );
    }

    const result = await promoteRecommendationToActionItem({
      recommendationId,
      workspaceId: auth.workspaceId!,
      userId: auth.user.id,
      userEmail: auth.user.email || undefined,
      userRole: auth.user.role,
      integration: integration || "LINEAR",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Promote recommendation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to promote recommendation" },
      { status: 500 }
    );
  }
}
