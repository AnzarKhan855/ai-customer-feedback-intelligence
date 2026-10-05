import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbeddingVector } from "@/lib/search";
import { SingleFeedbackInputSchema } from "@/lib/types";

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
    const result = SingleFeedbackInputSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid feedback payload" },
        { status: 400 }
      );
    }

    const { content, channel, customerLabel, sourceRef, product, region, datasetId } = result.data;

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
        customerLabel: customerLabel?.trim() || null,
        sourceRef: sourceRef?.trim() || `MANUAL-${Math.floor(1000 + Math.random() * 9000)}`,
        product: product?.trim() || null,
        region: region?.trim() || null,
        datasetId: datasetId || null,
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
          message: `Customer ${customerLabel || "Anonymous"} reported high-severity issue (${aiResult.severityScore}/100): "${content.slice(0, 100)}..."`,
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
