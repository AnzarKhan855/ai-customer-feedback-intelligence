import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbeddingVector } from "@/lib/search";
import { validateAndCleanFeedbackBatch } from "@/lib/data-quality";

export async function POST(req: Request) {
  const auth = await requireAuth(["ADMIN", "ANALYST"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;
  const userId = auth.user.id;

  try {
    const body = await req.json();
    const rawRows: any[] = body.rows || [];
    const datasetName = body.datasetName?.trim() || `Import-${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const fileName = body.fileName?.trim() || "uploaded_data.csv";
    const fileType = body.fileType?.trim() || "CSV";
    const columnMapping = body.columnMapping || undefined;

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json(
        { error: "No feedback rows provided in request" },
        { status: 400 }
      );
    }

    // Step 1: Data Quality & Cleaning Layer
    const validationResult = validateAndCleanFeedbackBatch(rawRows, columnMapping);
    const { validRows, invalidRows, qualityMetrics } = validationResult;

    // Step 2: Create Dataset record
    const dataset = await db.dataset.create({
      data: {
        name: datasetName,
        fileName,
        fileType,
        recordCount: rawRows.length,
        validCount: validRows.length,
        errorCount: invalidRows.length,
        qualityScore: qualityMetrics.overallQualityScore,
        status: "PROCESSING",
        qualityMetrics: JSON.stringify(qualityMetrics),
        schemaMapping: columnMapping ? JSON.stringify(columnMapping) : null,
        workspaceId,
        createdById: userId,
      },
    });

    // Step 3: Get current workspace themes
    const existingThemes = await db.theme.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });
    const themeNames = existingThemes.map((t) => t.name);

    let importedCount = 0;
    let failedCount = invalidRows.length;
    const errors: string[] = invalidRows.slice(0, 10).map((r) => `Row ${r.rowIndex}: ${r.reason}`);

    // Step 4: Batch process valid records
    for (const validRow of validRows) {
      try {
        const aiResult = await classifyFeedback(validRow.content, themeNames);
        const vectorStr = JSON.stringify(generateEmbeddingVector(validRow.content));

        const fb = await db.feedback.create({
          data: {
            content: validRow.content,
            channel: validRow.channel,
            customerLabel: validRow.customerLabel || null,
            sourceRef: validRow.sourceRef || `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
            product: validRow.product || null,
            region: validRow.region || null,
            datasetId: dataset.id,
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
            themeNames.push(themeRecord.name);
          }
          await db.feedbackTheme.create({
            data: {
              feedbackId: fb.id,
              themeId: themeRecord.id,
              confidence: 0.95,
            },
          });
        }

        importedCount++;
      } catch (err: any) {
        failedCount++;
        if (errors.length < 10) {
          errors.push(`Row ${validRow.originalRowIndex}: Failed to save - ${err?.message || "DB error"}`);
        }
      }
    }

    // Step 5: Update dataset status to READY
    await db.dataset.update({
      where: { id: dataset.id },
      data: {
        status: "READY",
        validCount: importedCount,
        errorCount: failedCount,
      },
    });

    return NextResponse.json({
      success: true,
      datasetId: dataset.id,
      datasetName: dataset.name,
      imported: importedCount,
      failed: failedCount,
      total: rawRows.length,
      qualityScore: qualityMetrics.overallQualityScore,
      qualityMetrics,
      errors,
    });
  } catch (error) {
    console.error("Bulk ingestion error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}
