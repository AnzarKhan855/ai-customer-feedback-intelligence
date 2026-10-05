import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceAdminDiagnostics } from "@/lib/admin-control";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const result = await getWorkspaceAdminDiagnostics(auth.workspaceId!);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Admin diagnostics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin system diagnostics" },
      { status: 500 }
    );
  }
}
