import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { analyzeRootCause } from "@/lib/root-cause";
import { z } from "zod";

const RootCauseRequestSchema = z.object({
  topic: z.string().min(1, "Topic or problem description is required").max(200),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = RootCauseRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const report = await analyzeRootCause(auth.workspaceId!, parsed.data.topic);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Root cause analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate root-cause analysis" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic") || "";

  if (!topic) {
    return NextResponse.json(
      { error: "Provide a 'topic' query parameter" },
      { status: 400 }
    );
  }

  try {
    const report = await analyzeRootCause(auth.workspaceId!, topic);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Root cause analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate root-cause analysis" },
      { status: 500 }
    );
  }
}
