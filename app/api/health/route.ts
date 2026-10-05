import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;

  try {
    const dbCheckStart = Date.now();
    await db.workspace.count();
    dbLatencyMs = Date.now() - dbCheckStart;
  } catch (error: any) {
    dbStatus = `unhealthy: ${error.message}`;
  }

  const isHealthy = dbStatus === "healthy";
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? "ready" : "degraded",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      aiEngine: {
        provider: process.env.ANTHROPIC_API_KEY ? "Anthropic Claude 3.5 Sonnet" : "Deterministic High-Precision NLP",
        status: "active",
      },
      version: "2.0.0",
    },
    { status: statusCode }
  );
}
