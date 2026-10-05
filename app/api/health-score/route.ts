import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceCustomerHealth } from "@/lib/customer-health";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const health = await getWorkspaceCustomerHealth(auth.workspaceId!);
    return NextResponse.json({ success: true, health });
  } catch (error) {
    console.error("Customer health calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate customer health score" },
      { status: 500 }
    );
  }
}
