import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;
  let workspaceCount = 0;
  let feedbackCount = 0;

  try {
    const dbCheckStart = Date.now();
    const [wCount, fCount] = await Promise.all([
      db.workspace.count(),
      db.feedback.count(),
    ]);
    workspaceCount = wCount;
    feedbackCount = fCount;
    dbLatencyMs = Date.now() - dbCheckStart;
  } catch (error: any) {
    dbStatus = `unhealthy: ${error.message}`;
  }

  const isHealthy = dbStatus === "healthy";
  const statusCode = isHealthy ? 200 : 503;

  const mem = process.memoryUsage();

  return NextResponse.json(
    {
      status: isHealthy ? "ready" : "degraded",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        workspaces: workspaceCount,
        feedbackRecords: feedbackCount,
      },
      aiEngine: {
        provider: process.env.ANTHROPIC_API_KEY ? "Anthropic Claude 3.5 Sonnet" : "Deterministic High-Precision NLP",
        status: "active",
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        memoryUsageMb: {
          rss: Math.round(mem.rss / 1024 / 1024),
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        },
      },
      version: "2.0.0",
    },
    { status: statusCode }
  );
}
