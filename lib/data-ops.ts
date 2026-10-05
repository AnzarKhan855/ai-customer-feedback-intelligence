import { db } from "@/lib/db";

export interface DatasetQualityDiagnostic {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  recordCount: number;
  validCount: number;
  errorCount: number;
  qualityScore: number;
  status: string;
  completenessPercentage: number;
  validityPercentage: number;
  createdAt: Date;
}

export interface WorkspaceDataOpsDiagnostics {
  totalDatasets: number;
  totalRecordsIngested: number;
  totalValidRecords: number;
  totalErrorRecords: number;
  averageQualityScore: number;
  overallDataHygieneRating: "EXCELLENT" | "GOOD" | "NEEDS_ATTENTION";
  channelDistribution: Record<string, number>;
  datasetHealth: DatasetQualityDiagnostic[];
  recommendations: string[];
}

export async function getWorkspaceDataOpsDiagnostics(
  workspaceId: string
): Promise<WorkspaceDataOpsDiagnostics> {
  const datasets = await db.dataset.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  const feedback = await db.feedback.findMany({
    where: { workspaceId },
    select: { channel: true },
  });

  const channelDistribution: Record<string, number> = {};
  feedback.forEach((f) => {
    channelDistribution[f.channel] = (channelDistribution[f.channel] || 0) + 1;
  });

  let totalRecords = 0;
  let totalValid = 0;
  let totalErrors = 0;
  let qualitySum = 0;

  const datasetHealth: DatasetQualityDiagnostic[] = datasets.map((d) => {
    totalRecords += d.recordCount;
    totalValid += d.validCount;
    totalErrors += d.errorCount;
    qualitySum += d.qualityScore;

    const completenessPercentage =
      d.recordCount > 0 ? Math.round((d.validCount / d.recordCount) * 100) : 100;
    const validityPercentage =
      d.recordCount > 0 ? Math.round(((d.recordCount - d.errorCount) / d.recordCount) * 100) : 100;

    return {
      id: d.id,
      name: d.name,
      fileName: d.fileName,
      fileType: d.fileType,
      recordCount: d.recordCount,
      validCount: d.validCount,
      errorCount: d.errorCount,
      qualityScore: d.qualityScore,
      status: d.status,
      completenessPercentage,
      validityPercentage,
      createdAt: d.createdAt,
    };
  });

  const avgQuality =
    datasets.length > 0 ? Math.round((qualitySum / datasets.length) * 10) / 10 : 100.0;

  let overallRating: "EXCELLENT" | "GOOD" | "NEEDS_ATTENTION" = "EXCELLENT";
  if (avgQuality < 70 || totalErrors > 50) {
    overallRating = "NEEDS_ATTENTION";
  } else if (avgQuality < 85) {
    overallRating = "GOOD";
  }

  const recommendations: string[] = [];
  if (totalErrors > 0) {
    recommendations.push(
      `${totalErrors} rows were rejected during ingestion. Check CSV headers and column encoding.`
    );
  }
  if (datasets.length === 0) {
    recommendations.push("Import customer feedback CSV or connect live feedback streams to begin intelligence mining.");
  } else {
    recommendations.push(
      `Dataset quality hygiene index is ${avgQuality}/100 across ${datasets.length} batches.`
    );
  }

  return {
    totalDatasets: datasets.length,
    totalRecordsIngested: totalRecords,
    totalValidRecords: totalValid,
    totalErrorRecords: totalErrors,
    averageQualityScore: avgQuality,
    overallDataHygieneRating: overallRating,
    channelDistribution,
    datasetHealth,
    recommendations,
  };
}
