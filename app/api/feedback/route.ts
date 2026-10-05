import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbeddingVector } from "@/lib/search";
import { SingleFeedbackInputSchema, FeedbackChannel } from "@/lib/types";

const SIMULATION_TEMPLATES: Record<FeedbackChannel, Array<{ content: string; label: string; product: string; region: string }>> = {
  SUPPORT_TICKET: [
    {
      content: "The export to CSV button is throwing a 504 gateway timeout on our larger datasets (>5,000 rows). Please investigate immediately.",
      label: "Enterprise Customer",
      product: "Analytics & Export",
      region: "US-East",
    },
    {
      content: "Unable to authenticate via Google Workspace SSO since 09:00 AM UTC. Getting 'invalid_client' error on callback.",
      label: "Tier 1 Support Escalation",
      product: "Authentication",
      region: "EU-West",
    },
    {
      content: "Our billing administrator cannot locate the downloadable VAT invoice for March 2026. Needs urgent resolution for tax audit.",
      label: "Finance Team",
      product: "Billing",
      region: "APAC",
    },
    {
      content: "Search filtering by date range is missing items created in the last 24 hours. Cache invalidation appears delayed.",
      label: "Product Operations",
      product: "Search Engine",
      region: "US-West",
    },
    {
      content: "Webhook notifications for high-priority alerts are intermittently failing with TLS connection timeout.",
      label: "DevOps Engineer",
      product: "Webhooks & API",
      region: "US-Central",
    },
  ],
  APP_STORE: [
    {
      content: "Version 2.4 update fixed the table scrolling issues on iPad. Much smoother experience now! Excellent response from the devs.",
      label: "Mobile Power User",
      product: "Mobile App",
      region: "US-East",
    },
    {
      content: "App crashes intermittently on launch after the latest update on iOS 18.2. Please release a hotfix ASAP!",
      label: "iOS Reviewer",
      product: "Mobile App",
      region: "EU-Central",
    },
    {
      content: "Super clean feedback intelligence dashboard. Love the sentiment heatmaps and fast filtering on the go.",
      label: "CX Director",
      product: "Mobile App",
      region: "US-West",
    },
    {
      content: "Push notifications for high-priority alerts are delayed by over 30 minutes on Android background service.",
      label: "Android Tester",
      product: "Push Service",
      region: "APAC",
    },
    {
      content: "Five stars! The automated theme clustering saved our product team dozens of hours this sprint.",
      label: "Startup Founder",
      product: "Mobile App",
      region: "LATAM",
    },
  ],
  NPS_SURVEY: [
    {
      content: "Score 10: The semantic search in Ask LOOP is incredible for discovering customer pain points instantly across all channels.",
      label: "NPS Promoter",
      product: "Ask AI Analyst",
      region: "Global",
    },
    {
      content: "Score 4: The mobile web layout still has horizontal overflow on smaller screens. Triaging tickets on phone is awkward.",
      label: "NPS Detractor",
      product: "Mobile Web",
      region: "US-East",
    },
    {
      content: "Score 9: Best VoC intelligence tool our CX department has used. Integration with our feedback channels was painless.",
      label: "NPS Promoter",
      product: "Core Platform",
      region: "EU-West",
    },
    {
      content: "Score 6: Useful product, but pricing feels high for early-stage startups needing multiple analyst seats.",
      label: "NPS Passive",
      product: "Pricing Tier",
      region: "US-West",
    },
    {
      content: "Score 8: Great sentiment breakdown. Would love deeper integration with Jira roadmap planning and sprint tracking.",
      label: "NPS Passive",
      product: "Integrations",
      region: "APAC",
    },
  ],
  SALES_CALL: [
    {
      content: "Enterprise prospect notes: 'Requires SOC2 Type II report, SAML SSO, and SCIM directory sync before procurement approval.'",
      label: "Fortune 500 Prospect",
      product: "Enterprise Security",
      region: "US-East",
    },
    {
      content: "Call notes with VP of Product: 'Need custom webhook integration to pipe Zendesk tickets and Gong transcripts into Loop.'",
      label: "Scale-up Prospect",
      product: "Data Ingestion",
      region: "EU-West",
    },
    {
      content: "Security team review: 'Requesting on-premises deployment or private AWS VPC option for EU data residency compliance.'",
      label: "Banking Prospect",
      product: "Infrastructure",
      region: "EU-Central",
    },
    {
      content: "Expansion call with Acme Corp: 'They love the automated VoC reports and want to expand from 5 to 50 analyst seats next month.'",
      label: "Existing Enterprise Account",
      product: "Expansion Tier",
      region: "US-West",
    },
    {
      content: "Discovery notes: 'Evaluating Loop against Qualtrics. Primary requirements are real-time alert triage and AI question-answering.'",
      label: "Mid-Market Lead",
      product: "Competitive Eval",
      region: "APAC",
    },
  ],
  COMMUNITY: [
    {
      content: "Feature request: Can we get automated Slack notifications whenever a high-severity churn alert triggers?",
      label: "Community Contributor",
      product: "Slack App",
      region: "Global",
    },
    {
      content: "Is there an official API rate limit for bulk ingesting feedback via the /api/feedback/bulk endpoint?",
      label: "API Developer",
      product: "Public API",
      region: "US-East",
    },
    {
      content: "Great job on the new 2.0 release! The speed improvements on large workspaces are very noticeable.",
      label: "Power User",
      product: "Core Platform",
      region: "EU-West",
    },
    {
      content: "Has anyone successfully configured custom webhook alerts with Zapier or Make.com? Looking for template workflows.",
      label: "Automation Lead",
      product: "Webhooks",
      region: "US-West",
    },
    {
      content: "Discussion: Best practices for organizing customer themes across multiple distinct product lines in a single workspace.",
      label: "Product Strategist",
      product: "Taxonomy",
      region: "APAC",
    },
  ],
};

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12")));
  const search = searchParams.get("search")?.trim() || "";
  const channel = searchParams.get("channel") || "";
  const sentiment = searchParams.get("sentiment") || "";
  const emotion = searchParams.get("emotion") || "";
  const intent = searchParams.get("intent") || "";
  const priority = searchParams.get("priority") || "";
  const status = searchParams.get("status") || "";
  const theme = searchParams.get("theme") || "";
  const product = searchParams.get("product") || "";
  const region = searchParams.get("region") || "";
  const datasetId = searchParams.get("datasetId") || "";
  const churnOnly = searchParams.get("churnOnly") === "true";
  const sortBy = searchParams.get("sortBy") || "newest";

  try {
    const where: any = { workspaceId };

    if (search) {
      where.OR = [
        { content: { contains: search } },
        { customerLabel: { contains: search } },
        { featureArea: { contains: search } },
        { sourceRef: { contains: search } },
        { detectedEntities: { contains: search } },
        { rationale: { contains: search } },
      ];
    }

    if (channel) where.channel = channel;
    if (sentiment) where.sentiment = sentiment;
    if (emotion) where.emotion = emotion;
    if (intent) where.intent = intent;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (product) where.product = product;
    if (region) where.region = region;
    if (datasetId) where.datasetId = datasetId;
    if (churnOnly) where.churnRiskSignal = true;

    if (theme) {
      where.themes = {
        some: {
          theme: {
            name: { equals: theme },
          },
        },
      };
    }

    // Determine sorting
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    else if (sortBy === "severity") orderBy = { severityScore: "desc" };
    else if (sortBy === "confidence") orderBy = { aiConfidence: "desc" };

    const totalCount = await db.feedback.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const skip = (page - 1) * limit;

    const items = await db.feedback.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        themes: {
          include: { theme: true },
        },
        actionItems: true,
      },
    });

    const formattedItems = items.map((fb) => ({
      ...fb,
      aspects: fb.aspectsJson ? JSON.parse(fb.aspectsJson) : [],
      detectedEntities: fb.detectedEntities ? JSON.parse(fb.detectedEntities) : [],
      themes: fb.themes.map((t) => t.theme.name),
    }));

    return NextResponse.json({
      items: formattedItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Fetch feedback list error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const body = await req.json();

    // Check if this is a simulate batch request from SimulateChannelModal
    if (body?.simulateBatch === true) {
      const channel = (body.channel as FeedbackChannel) || "SUPPORT_TICKET";
      const count = Math.min(5, Math.max(1, parseInt(body.count) || 3));

      // Get current workspace themes
      const existingThemes = await db.theme.findMany({
        where: { workspaceId },
        select: { id: true, name: true },
      });
      const themeNames = existingThemes.map((t) => t.name);

      const templates = SIMULATION_TEMPLATES[channel] || SIMULATION_TEMPLATES.SUPPORT_TICKET;
      const createdItems = [];

      for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        const sourceRef = `SIM-${channel.slice(0, 3)}-${uniqueSuffix}`;

        const aiResult = await classifyFeedback(template.content, themeNames);
        const vectorStr = JSON.stringify(generateEmbeddingVector(template.content));

        const item = await db.feedback.create({
          data: {
            content: template.content,
            channel,
            customerLabel: `${template.label} #${uniqueSuffix}`,
            sourceRef,
            product: template.product,
            region: template.region,
            datasetId: null,
            sentiment: aiResult.sentiment,
            sentimentScore: aiResult.sentimentScore,
            aiConfidence: aiResult.aiConfidence,
            emotion: aiResult.emotion,
            emotionConfidence: aiResult.emotionConfidence,
            intent: aiResult.intent,
            aspectsJson: JSON.stringify(aiResult.aspects),
            featureArea: aiResult.featureArea,
            severityScore: aiResult.severityScore,
            priority: aiResult.priority,
            severityRationale: aiResult.severityRationale,
            churnRiskSignal: aiResult.churnRiskSignal,
            churnRiskRationale: aiResult.churnRiskRationale,
            rootCauseHypothesis: aiResult.rootCauseHypothesis,
            detectedEntities: JSON.stringify(aiResult.detectedEntities),
            rationale: aiResult.rationale,
            status: "NEW",
            workspaceId,
            embedding: {
              create: {
                vector: vectorStr,
              },
            },
          },
        });

        // Link themes
        for (const thName of aiResult.themes) {
          let themeRecord = existingThemes.find((t) => t.name.toLowerCase() === thName.toLowerCase());
          if (!themeRecord) {
            themeRecord = await db.theme.create({
              data: {
                name: thName,
                workspaceId,
                color: "#6366f1",
              },
            });
            existingThemes.push(themeRecord);
          }
          await db.feedbackTheme.create({
            data: {
              feedbackId: item.id,
              themeId: themeRecord.id,
              confidence: 0.95,
            },
          });
        }

        // Auto-generate Alert if CRITICAL severity or high churn risk signal
        if (aiResult.priority === "CRITICAL" || (aiResult.churnRiskSignal && aiResult.sentiment === "NEG")) {
          await db.alert.create({
            data: {
              title: `Critical issue flagged: ${aiResult.featureArea}`,
              message: `Customer ${item.customerLabel} reported high-severity issue (${aiResult.severityScore}/100): "${item.content.slice(0, 100)}..."`,
              severity: "CRITICAL",
              type: aiResult.churnRiskSignal ? "CHURN_RISK" : "COMPLAINT_SPIKE",
              metric: `Severity: ${aiResult.severityScore}/100 | Emotion: ${aiResult.emotion}`,
              status: "ACTIVE",
              workspaceId,
            },
          });
        }

        createdItems.push({
          ...item,
          aspects: aiResult.aspects,
          detectedEntities: aiResult.detectedEntities,
          themes: aiResult.themes,
        });
      }

      return NextResponse.json({
        success: true,
        count: createdItems.length,
        items: createdItems,
      });
    }

    const result = SingleFeedbackInputSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid feedback payload" },
        { status: 400 }
      );
    }

    const { content, channel, customerLabel, sourceRef, product, region, datasetId } = result.data;
    const cleanDatasetId = datasetId && datasetId.trim() ? datasetId.trim() : null;
    const cleanCustomerLabel = customerLabel && customerLabel.trim() ? customerLabel.trim() : null;
    const cleanSourceRef = sourceRef && sourceRef.trim() ? sourceRef.trim() : `MANUAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanProduct = product && product.trim() ? product.trim() : null;
    const cleanRegion = region && region.trim() ? region.trim() : null;

    // Get current workspace themes
    const existingThemes = await db.theme.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });
    const themeNames = existingThemes.map((t) => t.name);

    // AI Classification Pipeline
    const aiResult = await classifyFeedback(content, themeNames);
    const vectorStr = JSON.stringify(generateEmbeddingVector(content));

    // Create Feedback item in DB
    const createdFeedback = await db.feedback.create({
      data: {
        content: content.trim(),
        channel,
        customerLabel: cleanCustomerLabel,
        sourceRef: cleanSourceRef,
        product: cleanProduct,
        region: cleanRegion,
        datasetId: cleanDatasetId,
        sentiment: aiResult.sentiment,
        sentimentScore: aiResult.sentimentScore,
        aiConfidence: aiResult.aiConfidence,
        emotion: aiResult.emotion,
        emotionConfidence: aiResult.emotionConfidence,
        intent: aiResult.intent,
        aspectsJson: JSON.stringify(aiResult.aspects),
        featureArea: aiResult.featureArea,
        severityScore: aiResult.severityScore,
        priority: aiResult.priority,
        severityRationale: aiResult.severityRationale,
        churnRiskSignal: aiResult.churnRiskSignal,
        churnRiskRationale: aiResult.churnRiskRationale,
        rootCauseHypothesis: aiResult.rootCauseHypothesis,
        detectedEntities: JSON.stringify(aiResult.detectedEntities),
        rationale: aiResult.rationale,
        status: "NEW",
        workspaceId,
        embedding: {
          create: {
            vector: vectorStr,
          },
        },
      },
    });

    // Link themes
    for (const thName of aiResult.themes) {
      let themeRecord = existingThemes.find((t) => t.name.toLowerCase() === thName.toLowerCase());
      if (!themeRecord) {
        themeRecord = await db.theme.create({
          data: {
            name: thName,
            workspaceId,
            color: "#6366f1",
          },
        });
        existingThemes.push(themeRecord);
      }
      await db.feedbackTheme.create({
        data: {
          feedbackId: createdFeedback.id,
          themeId: themeRecord.id,
          confidence: 0.95,
        },
      });
    }

    // Auto-generate Alert if CRITICAL severity or high churn risk signal
    if (aiResult.priority === "CRITICAL" || (aiResult.churnRiskSignal && aiResult.sentiment === "NEG")) {
      await db.alert.create({
        data: {
          title: `Critical issue flagged: ${aiResult.featureArea}`,
          message: `Customer ${cleanCustomerLabel || "Anonymous"} reported high-severity issue (${aiResult.severityScore}/100): "${content.slice(0, 100)}..."`,
          severity: "CRITICAL",
          type: aiResult.churnRiskSignal ? "CHURN_RISK" : "COMPLAINT_SPIKE",
          metric: `Severity: ${aiResult.severityScore}/100 | Emotion: ${aiResult.emotion}`,
          status: "ACTIVE",
          workspaceId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      feedback: {
        ...createdFeedback,
        aspects: aiResult.aspects,
        detectedEntities: aiResult.detectedEntities,
        themes: aiResult.themes,
      },
    });
  } catch (error) {
    console.error("Create feedback error:", error);
    return NextResponse.json({ error: "Failed to ingest feedback" }, { status: 500 });
  }
}
