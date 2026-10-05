import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbeddingVector } from "@/lib/search";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const { id } = params;

  try {
    const feedback = await db.feedback.findFirst({
      where: { id, workspaceId },
      include: {
        themes: { include: { theme: true } },
        actionItems: true,
        dataset: true,
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback item not found" }, { status: 404 });
    }

    return NextResponse.json({
      feedback: {
        ...feedback,
        aspects: feedback.aspectsJson ? JSON.parse(feedback.aspectsJson) : [],
        detectedEntities: feedback.detectedEntities ? JSON.parse(feedback.detectedEntities) : [],
        themes: feedback.themes.map((t) => t.theme.name),
      },
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback item" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const { id } = params;

  try {
    const body = await req.json();

    const feedback = await db.feedback.findFirst({
      where: { id, workspaceId },
      include: { themes: true },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback item not found" }, { status: 404 });
    }

    // Handle manual re-classification with AI
    if (body.reclassify) {
      const existingThemes = await db.theme.findMany({
        where: { workspaceId },
        select: { id: true, name: true },
      });
      const themeNames = existingThemes.map((t) => t.name);

      const aiResult = await classifyFeedback(feedback.content, themeNames);
      const vectorStr = JSON.stringify(generateEmbeddingVector(feedback.content));

      const updated = await db.feedback.update({
        where: { id },
        data: {
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
          rationale: `Re-classified: ${aiResult.rationale}`,
        },
      });

      // Update vector embedding
      await db.embedding.upsert({
        where: { feedbackId: id },
        update: { vector: vectorStr },
        create: { feedbackId: id, vector: vectorStr },
      });

      // Re-link themes
      await db.feedbackTheme.deleteMany({ where: { feedbackId: id } });
      for (const thName of aiResult.themes) {
        let themeRecord = existingThemes.find((t) => t.name.toLowerCase() === thName.toLowerCase());
        if (!themeRecord) {
          themeRecord = await db.theme.create({
            data: { name: thName, workspaceId, color: "#6366f1" },
          });
        }
        await db.feedbackTheme.create({
          data: { feedbackId: id, themeId: themeRecord.id, confidence: 0.95 },
        });
      }

      return NextResponse.json({
        success: true,
        feedback: {
          ...updated,
          aspects: aiResult.aspects,
          detectedEntities: aiResult.detectedEntities,
          themes: aiResult.themes,
        },
      });
    }

    // Normal status, priority, or sentiment update
    const updateData: any = {};
    if (body.status && ["NEW", "REVIEWED", "ACTIONED"].includes(body.status)) {
      updateData.status = body.status;
    }
    if (body.sentiment && ["POS", "NEU", "NEG"].includes(body.sentiment)) {
      updateData.sentiment = body.sentiment;
    }
    if (body.priority && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(body.priority)) {
      updateData.priority = body.priority;
    }

    const updated = await db.feedback.update({
      where: { id },
      data: updateData,
      include: {
        themes: { include: { theme: true } },
      },
    });

    return NextResponse.json({
      success: true,
      feedback: {
        ...updated,
        aspects: updated.aspectsJson ? JSON.parse(updated.aspectsJson) : [],
        detectedEntities: updated.detectedEntities ? JSON.parse(updated.detectedEntities) : [],
        themes: updated.themes.map((t) => t.theme.name),
      },
    });
  } catch (error) {
    console.error("Update feedback error:", error);
    return NextResponse.json({ error: "Failed to update feedback item" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const { id } = params;

  try {
    const feedback = await db.feedback.findFirst({
      where: { id, workspaceId },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback item not found" }, { status: 404 });
    }

    await db.embedding.deleteMany({ where: { feedbackId: id } });
    await db.feedbackTheme.deleteMany({ where: { feedbackId: id } });
    await db.feedback.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Delete feedback error:", error);
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}
