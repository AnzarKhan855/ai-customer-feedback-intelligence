import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceDataOpsDiagnostics } from "@/lib/data-ops";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const result = await getWorkspaceDataOpsDiagnostics(auth.workspaceId!);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Data operations diagnostics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data operations diagnostics" },
      { status: 500 }
    );
  }
}
