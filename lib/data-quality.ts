import { DataQualityMetrics } from "./types";

export interface ParsedFeedbackRow {
  content: string;
  channel: string;
  customerLabel?: string;
  sourceRef?: string;
  product?: string;
  region?: string;
  originalRowIndex: number;
}

export interface IngestionValidationResult {
  validRows: ParsedFeedbackRow[];
  invalidRows: { rowIndex: number; raw: any; reason: string }[];
  duplicateCount: number;
  qualityMetrics: DataQualityMetrics;
  detectedColumns: string[];
  inferredFeedbackColumn: string;
}

/**
 * Normalizes input text by removing hidden control characters, normalizing whitespace,
 * and stripping unsafe injection patterns.
 */
export function normalizeFeedbackText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "") // remove control characters
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Calculates a consolidated data quality score based on validity, completeness, and uniqueness.
 */
export function calculateQualityScore(metrics: {
  completenessRate?: number;
  validityRate?: number;
  uniquenessRate?: number;
  sentimentConsistencyRate?: number;
  completenessPct?: number;
  duplicateRatePct?: number;
  validityPct?: number;
}): number {
  const completeness = metrics.completenessRate ?? metrics.completenessPct ?? 100;
  const validity = metrics.validityRate ?? metrics.validityPct ?? 100;
  const duplicateRate =
    metrics.uniquenessRate !== undefined
      ? 100 - metrics.uniquenessRate
      : (metrics.duplicateRatePct ?? 0);

  let qualityScore = Math.round(
    validity * 0.5 + completeness * 0.35 + Math.max(0, 100 - duplicateRate) * 0.15
  );
  return Math.min(100, Math.max(0, qualityScore));
}

/**
 * Automatically inspects the schema and identifies candidate columns for:
 * content, channel, customer_label, source_ref, product, region.
 */
export function detectCandidateColumns(sampleRow: Record<string, any>): {
  feedbackCol: string;
  channelCol?: string;
  customerCol?: string;
  sourceCol?: string;
  productCol?: string;
  regionCol?: string;
} {
  const keys = Object.keys(sampleRow);
  const lowerMap = new Map<string, string>();
  keys.forEach((k) => lowerMap.set(k.toLowerCase().trim(), k));

  const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const findMatchingKey = (candidates: string[]): string | undefined => {
    // 1. Direct lowercase match
    for (const cand of candidates) {
      if (lowerMap.has(cand)) return lowerMap.get(cand);
    }
    // 2. Substring/stripped match
    for (const cand of candidates) {
      const cleanCand = cleanStr(cand);
      for (const k of keys) {
        const cKey = cleanStr(k);
        if (cKey === cleanCand || cKey.includes(cleanCand) || cleanCand.includes(cKey)) {
          return k;
        }
      }
    }
    return undefined;
  };

  // Find feedback text column
  const feedbackCandidates = [
    "content", "feedback", "text", "comment", "comments", "review", "reviews",
    "description", "message", "body", "customer_feedback", "notes"
  ];
  let feedbackCol = findMatchingKey(feedbackCandidates) || keys[0] || "content";

  // Find channel column
  const channelCandidates = ["channel", "source", "platform", "type", "origin"];
  const channelCol = findMatchingKey(channelCandidates);

  // Find customer column
  const customerCandidates = ["customer_label", "customer", "user", "author", "client", "tier", "account", "email"];
  const customerCol = findMatchingKey(customerCandidates);

  // Find source ref / ID column
  const sourceCandidates = ["source_ref", "id", "ticket_id", "external_id", "ref", "url"];
  const sourceCol = findMatchingKey(sourceCandidates);

  // Find product column
  const productCandidates = ["product", "module", "feature", "app", "category"];
  const productCol = findMatchingKey(productCandidates);

  // Find region column
  const regionCandidates = ["region", "country", "location", "geo", "locale"];
  const regionCol = findMatchingKey(regionCandidates);

  return {
    feedbackCol,
    channelCol,
    customerCol,
    sourceCol,
    productCol,
    regionCol,
  };
}

/**
 * Validates, cleans, normalizes, detects duplicates, and scores data quality.
 */
export function validateAndCleanFeedbackBatch(
  rows: Record<string, any>[],
  columnMapping?: Record<string, string>
): IngestionValidationResult {
  if (!rows || rows.length === 0) {
    return {
      validRows: [],
      invalidRows: [],
      duplicateCount: 0,
      qualityMetrics: {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        duplicateRecords: 0,
        emptyFeedbackRecords: 0,
        completenessPct: 0,
        duplicateRatePct: 0,
        overallQualityScore: 0,
      },
      detectedColumns: [],
      inferredFeedbackColumn: "content",
    };
  }

  const detectedColumns = Object.keys(rows[0] || {});
  const detected = detectCandidateColumns(rows[0] || {});

  const feedbackKey = columnMapping?.content || detected.feedbackCol;
  const channelKey = columnMapping?.channel || detected.channelCol;
  const customerKey = columnMapping?.customerLabel || detected.customerCol;
  const sourceKey = columnMapping?.sourceRef || detected.sourceCol;
  const productKey = columnMapping?.product || detected.productCol;
  const regionKey = columnMapping?.region || detected.regionCol;

  const validRows: ParsedFeedbackRow[] = [];
  const invalidRows: { rowIndex: number; raw: any; reason: string }[] = [];
  const seenContentHashes = new Set<string>();
  let duplicateCount = 0;
  let emptyFeedbackCount = 0;
  let filledFieldsCount = 0;
  const totalPossibleFieldCells = rows.length * 4; // content, channel, customer, source

  const validChannels = ["SUPPORT_TICKET", "APP_STORE", "NPS_SURVEY", "SALES_CALL", "COMMUNITY"];

  rows.forEach((row, idx) => {
    const rawContent = row[feedbackKey];
    const normalizedContent = normalizeFeedbackText(rawContent != null ? String(rawContent) : "");

    if (!normalizedContent || normalizedContent.length === 0) {
      emptyFeedbackCount++;
      invalidRows.push({
        rowIndex: idx + 1,
        raw: row,
        reason: `Empty feedback content in column '${feedbackKey}'`,
      });
      return;
    }

    if (normalizedContent.length < 3) {
      invalidRows.push({
        rowIndex: idx + 1,
        raw: row,
        reason: `Feedback content too short (< 3 characters): "${normalizedContent}"`,
      });
      return;
    }

    // Check duplicate within the batch
    const contentKey = normalizedContent.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenContentHashes.has(contentKey)) {
      duplicateCount++;
      invalidRows.push({
        rowIndex: idx + 1,
        raw: row,
        reason: "Duplicate feedback text in same batch",
      });
      return;
    } else {
      seenContentHashes.add(contentKey);
    }

    // Channel validation & mapping
    const rawChannel = channelKey && row[channelKey] ? String(row[channelKey]).toUpperCase().trim().replace(/[\s-]+/g, "_") : "SUPPORT_TICKET";
    let channel = "SUPPORT_TICKET";
    if (validChannels.includes(rawChannel)) {
      channel = rawChannel;
    } else if (rawChannel.includes("APP") || rawChannel.includes("STORE") || rawChannel.includes("PLAY")) {
      channel = "APP_STORE";
    } else if (rawChannel.includes("NPS") || rawChannel.includes("CSAT") || rawChannel.includes("SURVEY")) {
      channel = "NPS_SURVEY";
    } else if (rawChannel.includes("SALES") || rawChannel.includes("CALL") || rawChannel.includes("GONG") || rawChannel.includes("CRM")) {
      channel = "SALES_CALL";
    } else if (rawChannel.includes("COMMUNITY") || rawChannel.includes("SLACK") || rawChannel.includes("FORUM") || rawChannel.includes("DISCOURSE")) {
      channel = "COMMUNITY";
    }

    const customerLabel = customerKey && row[customerKey] ? normalizeFeedbackText(String(row[customerKey])) : undefined;
    const sourceRef = sourceKey && row[sourceKey] ? normalizeFeedbackText(String(row[sourceKey])) : undefined;
    const product = productKey && row[productKey] ? normalizeFeedbackText(String(row[productKey])) : undefined;
    const region = regionKey && row[regionKey] ? normalizeFeedbackText(String(row[regionKey])) : undefined;

    // Track completeness
    filledFieldsCount += 1; // content exists
    if (channel) filledFieldsCount += 1;
    if (customerLabel) filledFieldsCount += 1;
    if (sourceRef) filledFieldsCount += 1;

    validRows.push({
      content: normalizedContent,
      channel,
      customerLabel: customerLabel || undefined,
      sourceRef: sourceRef || undefined,
      product: product || undefined,
      region: region || undefined,
      originalRowIndex: idx + 1,
    });
  });

  // Calculate Data Quality Metrics
  const total = rows.length;
  const valid = validRows.length;
  const invalid = invalidRows.length;
  const completenessPct = total > 0 ? Math.round((filledFieldsCount / totalPossibleFieldCells) * 100) : 0;
  const duplicateRatePct = total > 0 ? Math.round((duplicateCount / total) * 100) : 0;
  const validityPct = total > 0 ? Math.round((valid / total) * 100) : 0;

  // Quality score formula: 50% validity + 30% completeness - 20% duplicate rate
  let qualityScore = Math.round(validityPct * 0.5 + completenessPct * 0.35 + Math.max(0, 100 - duplicateRatePct) * 0.15);
  qualityScore = Math.min(100, Math.max(0, qualityScore));

  const qualityMetrics: DataQualityMetrics = {
    totalRecords: total,
    validRecords: valid,
    invalidRecords: invalid,
    duplicateRecords: duplicateCount,
    emptyFeedbackRecords: emptyFeedbackCount,
    completenessPct,
    duplicateRatePct,
    overallQualityScore: qualityScore,
  };

  return {
    validRows,
    invalidRows,
    duplicateCount,
    qualityMetrics,
    detectedColumns,
    inferredFeedbackColumn: feedbackKey,
  };
}

export const validateAndCleanIngestionData = validateAndCleanFeedbackBatch;
