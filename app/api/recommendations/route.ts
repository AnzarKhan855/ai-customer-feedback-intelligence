import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const recommendations = await db.aIRecommendation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Fetch recommendations error:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid recommendation ID or status" }, { status: 400 });
    }

    const updated = await db.aIRecommendation.updateMany({
      where: { id, workspaceId },
      data: { status },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error) {
    console.error("Update recommendation error:", error);
    return NextResponse.json({ error: "Failed to update recommendation" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const body = await req.json();
    const { problem, evidence, businessImpact, recommendedAction, priority, expectedOutcome } = body;

    if (!problem || !recommendedAction) {
      return NextResponse.json({ error: "Problem and recommendedAction are required" }, { status: 400 });
    }

    const rec = await db.aIRecommendation.create({
      data: {
        problem: problem.trim(),
        evidence: evidence?.trim() || "Observed through customer feedback analysis",
        businessImpact: businessImpact?.trim() || "Improve customer satisfaction and retention",
        recommendedAction: recommendedAction.trim(),
        priority: priority || "HIGH",
        expectedOutcome: expectedOutcome?.trim() || "Reduced churn and positive VoC trend",
        status: "OPEN",
        workspaceId,
      },
    });

    return NextResponse.json({ success: true, recommendation: rec }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create recommendation" }, { status: 500 });
  }
}
