import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceProductGaps } from "@/lib/product-gaps";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const result = await getWorkspaceProductGaps(auth.workspaceId!);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Product gaps intelligence error:", error);
    return NextResponse.json(
      { error: "Failed to extract product gap intelligence" },
      { status: 500 }
    );
  }
}
