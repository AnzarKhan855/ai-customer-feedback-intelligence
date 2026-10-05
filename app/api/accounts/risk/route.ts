import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedbackList = await prisma.feedback.findMany({
      where: {
        workspaceId: session.user.workspaceId,
        customerLabel: { not: null },
      },
      select: {
        customerLabel: true,
        sentiment: true,
        sentimentScore: true,
        createdAt: true,
      },
    });

    // Group by customerLabel
    const accountStatsMap = new Map<
      string,
      {
        account: string;
        totalSignals: number;
        positiveCount: number;
        negativeCount: number;
        neutralCount: number;
        avgScore: number;
        scoreSum: number;
      }
    >();

    for (const item of feedbackList) {
      if (!item.customerLabel) continue;
      const key = item.customerLabel;
      const existing = accountStatsMap.get(key) || {
        account: key,
        totalSignals: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        avgScore: 0,
        scoreSum: 0,
      };

      existing.totalSignals += 1;
      existing.scoreSum += item.sentimentScore;
      if (item.sentiment === "POS") existing.positiveCount += 1;
      else if (item.sentiment === "NEG") existing.negativeCount += 1;
      else existing.neutralCount += 1;

      accountStatsMap.set(key, existing);
    }

    // Compute Risk Scores and Tiers
    const accounts = Array.from(accountStatsMap.values()).map((acc) => {
      const avgScore = Number((acc.scoreSum / (acc.totalSignals || 1)).toFixed(2));
      const negRatio = acc.negativeCount / (acc.totalSignals || 1);
      
      // Churn risk score (0 to 100%)
      // Higher negative ratio and negative avg score increase risk score
      let riskScore = Math.round(negRatio * 70 + (avgScore < 0 ? Math.abs(avgScore) * 30 : 0));
      if (acc.negativeCount >= 3) riskScore = Math.min(100, riskScore + 15);
      riskScore = Math.max(5, Math.min(100, riskScore));

      let riskTier: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" = "LOW";
      if (riskScore >= 70) riskTier = "CRITICAL";
      else if (riskScore >= 45) riskTier = "HIGH";
      else if (riskScore >= 25) riskTier = "MODERATE";

      return {
        ...acc,
        avgScore,
        negRatio: Number((negRatio * 100).toFixed(0)),
        riskScore,
        riskTier,
        isEnterprise: acc.account.toLowerCase().includes("enterprise") || acc.account.toLowerCase().includes("globex") || acc.account.toLowerCase().includes("omnicorp"),
      };
    });

    // Sort accounts by risk score descending
    accounts.sort((a, b) => b.riskScore - a.riskScore);

    return NextResponse.json({ accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to calculate account risk matrix" }, { status: 500 });
  }
}
