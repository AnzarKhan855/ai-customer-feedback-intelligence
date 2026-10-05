import { db } from "@/lib/db";

export interface BriefingCitation {
  id: string;
  content: string;
  channel: string;
  customerLabel?: string | null;
  severityScore: number;
}

export interface BriefingFireItem {
  area: string;
  summary: string;
  severity: number;
  churnRisks: number;
  reportCount: number;
  citations: BriefingCitation[];
}

export interface BriefingDelightItem {
  area: string;
  summary: string;
  citations: BriefingCitation[];
}

export interface ExecutiveBriefingResult {
  headline: string;
  executiveSummary: string;
  generatedAt: string;
  metrics: {
    totalFeedbackAnalyzed: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
    criticalEscalationsCount: number;
    churnSignalsCount: number;
    averageSeverityScore: number;
  };
  burningFires: BriefingFireItem[];
  customerDelights: BriefingDelightItem[];
  strategicPriorities: Array<{
    title: string;
    rationale: string;
    expectedOutcome: string;
  }>;
}

export function generateExecutiveBriefing(
  feedbackItems: Array<{
    id: string;
    content: string;
    channel: string;
    customerLabel?: string | null;
    sentiment: string;
    severityScore: number;
    featureArea?: string | null;
    intent?: string | null;
    churnRiskSignal: boolean;
    priority: string;
    createdAt: Date;
  }>
): ExecutiveBriefingResult {
  const generatedAt = new Date().toISOString();

  if (!feedbackItems || feedbackItems.length === 0) {
    return {
      headline: "Baseline Customer Health — Zero Active Incidents",
      executiveSummary: "No recent customer feedback signals ingested. Customer health baseline is optimal with no critical friction detected.",
      generatedAt,
      metrics: {
        totalFeedbackAnalyzed: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        neutralPercentage: 0,
        criticalEscalationsCount: 0,
        churnSignalsCount: 0,
        averageSeverityScore: 0,
      },
      burningFires: [],
      customerDelights: [],
      strategicPriorities: [
        {
          title: "Initiate Customer Feedback Collection",
          rationale: "Zero active feedback records found in workspace.",
          expectedOutcome: "Establish baseline customer satisfaction metrics across channels.",
        },
      ],
    };
  }

  const total = feedbackItems.length;
  let posCount = 0;
  let negCount = 0;
  let neuCount = 0;
  let criticalCount = 0;
  let churnCount = 0;
  let severitySum = 0;

  feedbackItems.forEach((f) => {
    const s = (f.sentiment || "").toUpperCase();
    if (s.startsWith("POS")) posCount++;
    else if (s.startsWith("NEG")) negCount++;
    else neuCount++;

    if (f.priority === "CRITICAL" || f.severityScore >= 75) criticalCount++;
    if (f.churnRiskSignal) churnCount++;
    severitySum += f.severityScore || 20;
  });

  const avgSeverity = Math.round(severitySum / total);
  const posPct = Math.round((posCount / total) * 100);
  const negPct = Math.round((negCount / total) * 100);
  const neuPct = 100 - posPct - negPct;

  // Group negative feedback by area for Burning Fires
  const negByArea = new Map<string, typeof feedbackItems>();
  feedbackItems
    .filter((f) => f.sentiment.toUpperCase().startsWith("NEG") || f.severityScore >= 60 || f.churnRiskSignal)
    .forEach((f) => {
      const area = f.featureArea && f.featureArea.trim() && f.featureArea.toLowerCase() !== "general"
        ? f.featureArea.trim()
        : "Platform Friction";
      if (!negByArea.has(area)) negByArea.set(area, []);
      negByArea.get(area)!.push(f);
    });

  const burningFires: BriefingFireItem[] = [];
  Array.from(negByArea.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .forEach(([area, items]) => {
      const churns = items.filter((i) => i.churnRiskSignal).length;
      const avgAreaSev = Math.round(items.reduce((acc, i) => acc + i.severityScore, 0) / items.length);

      burningFires.push({
        area,
        summary: `${items.length} incidents reported with avg severity ${avgAreaSev}/100 and ${churns} churn warnings.`,
        severity: avgAreaSev,
        churnRisks: churns,
        reportCount: items.length,
        citations: items.slice(0, 3).map((i) => ({
          id: i.id,
          content: i.content,
          channel: i.channel,
          customerLabel: i.customerLabel,
          severityScore: i.severityScore,
        })),
      });
    });

  // Group positive feedback by area for Delights
  const posByArea = new Map<string, typeof feedbackItems>();
  feedbackItems
    .filter((f) => f.sentiment.toUpperCase().startsWith("POS") || f.intent === "praise")
    .forEach((f) => {
      const area = f.featureArea && f.featureArea.trim() && f.featureArea.toLowerCase() !== "general"
        ? f.featureArea.trim()
        : "Product Value";
      if (!posByArea.has(area)) posByArea.set(area, []);
      posByArea.get(area)!.push(f);
    });

  const customerDelights: BriefingDelightItem[] = [];
  Array.from(posByArea.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .forEach(([area, items]) => {
      customerDelights.push({
        area,
        summary: `Strong customer satisfaction in ${area} across ${items.length} positive reviews.`,
        citations: items.slice(0, 3).map((i) => ({
          id: i.id,
          content: i.content,
          channel: i.channel,
          customerLabel: i.customerLabel,
          severityScore: i.severityScore,
        })),
      });
    });

  // Strategic priorities based on findings
  const strategicPriorities: Array<{
    title: string;
    rationale: string;
    expectedOutcome: string;
  }> = [];

  if (burningFires.length > 0) {
    const topFire = burningFires[0];
    strategicPriorities.push({
      title: `Eliminate ${topFire.area} Bottleneck`,
      rationale: `Responsible for ${topFire.reportCount} customer complaints and ${topFire.churnRisks} churn risk flags.`,
      expectedOutcome: `Immediate 15-20% reduction in negative sentiment and retention safeguard.`,
    });
  }

  if (churnCount > 0) {
    strategicPriorities.push({
      title: "Targeted Customer Success Outreach for At-Risk Accounts",
      rationale: `${churnCount} customer accounts have exhibited direct churn risk intent.`,
      expectedOutcome: "Proactively rescue renewal revenue through executive touchpoints.",
    });
  } else {
    strategicPriorities.push({
      title: "Double Down on Core Product Delighters",
      rationale: `${posPct}% customer satisfaction with strong organic advocate verbatims.`,
      expectedOutcome: "Amplify expansion revenue through case studies and referral loops.",
    });
  }

  // Headline synthesis
  let headline = "Stable Platform Health Across Customer Touchpoints";
  if (criticalCount >= 3 || negPct >= 45) {
    headline = `Executive Alert: Elevated Friction in ${burningFires[0]?.area || "Core Systems"}`;
  } else if (posPct >= 65) {
    headline = "Strong Organic Advocacy & High Customer Delight";
  }

  const executiveSummary = `Executive briefing compiled from ${total} feedback records. Overall sentiment sits at ${posPct}% positive vs ${negPct}% negative. Identified ${criticalCount} critical escalations and ${churnCount} accounts exhibiting churn intent. Average system friction severity index is ${avgSeverity}/100.`;

  return {
    headline,
    executiveSummary,
    generatedAt,
    metrics: {
      totalFeedbackAnalyzed: total,
      positivePercentage: posPct,
      negativePercentage: negPct,
      neutralPercentage: neuPct,
      criticalEscalationsCount: criticalCount,
      churnSignalsCount: churnCount,
      averageSeverityScore: avgSeverity,
    },
    burningFires,
    customerDelights,
    strategicPriorities,
  };
}

export async function getWorkspaceExecutiveBriefing(
  workspaceId: string
): Promise<ExecutiveBriefingResult> {
  const items = await db.feedback.findMany({
    where: { workspaceId },
    select: {
      id: true,
      content: true,
      channel: true,
      customerLabel: true,
      sentiment: true,
      severityScore: true,
      featureArea: true,
      intent: true,
      churnRiskSignal: true,
      priority: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return generateExecutiveBriefing(items);
}
