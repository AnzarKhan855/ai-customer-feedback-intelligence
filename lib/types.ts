import { z } from "zod";

export type Role = "ADMIN" | "ANALYST" | "VIEWER";
export type Sentiment = "POS" | "NEU" | "NEG";
export type FeedbackStatus = "NEW" | "REVIEWED" | "ACTIONED";
export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type FeedbackChannel =
  | "SUPPORT_TICKET"
  | "APP_STORE"
  | "NPS_SURVEY"
  | "SALES_CALL"
  | "COMMUNITY";

export type EmotionType =
  | "anger"
  | "frustration"
  | "disappointment"
  | "satisfaction"
  | "happiness"
  | "confusion"
  | "excitement"
  | "concern";

export type IntentType =
  | "complaint"
  | "praise"
  | "suggestion"
  | "question"
  | "refund_request"
  | "feature_request"
  | "cancellation"
  | "technical_issue"
  | "product_inquiry";

export const CHANNELS: { value: FeedbackChannel; label: string; icon: string }[] = [
  { value: "SUPPORT_TICKET", label: "Support Ticket", icon: "LifeBuoy" },
  { value: "APP_STORE", label: "App Store / Review", icon: "Star" },
  { value: "NPS_SURVEY", label: "NPS / CSAT Survey", icon: "Smile" },
  { value: "SALES_CALL", label: "Sales & Success Call", icon: "PhoneCall" },
  { value: "COMMUNITY", label: "Community Post", icon: "MessageSquare" },
];

export const STATUSES: { value: FeedbackStatus; label: string; color: string }[] = [
  { value: "NEW", label: "New", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "REVIEWED", label: "Reviewed", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "ACTIONED", label: "Actioned", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

export const SENTIMENTS: { value: Sentiment; label: string; color: string; badge: string }[] = [
  { value: "POS", label: "Positive", color: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "NEU", label: "Neutral", color: "text-slate-600", badge: "bg-slate-50 text-slate-700 border-slate-200" },
  { value: "NEG", label: "Negative", color: "text-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200" },
];

export const EMOTIONS: { value: EmotionType; label: string; color: string; icon: string }[] = [
  { value: "anger", label: "Anger", color: "bg-rose-100 text-rose-800 border-rose-200", icon: "Flame" },
  { value: "frustration", label: "Frustration", color: "bg-orange-100 text-orange-800 border-orange-200", icon: "AlertTriangle" },
  { value: "disappointment", label: "Disappointment", color: "bg-amber-100 text-amber-800 border-amber-200", icon: "Frown" },
  { value: "concern", label: "Concern", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "HelpCircle" },
  { value: "confusion", label: "Confusion", color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: "HelpCircle" },
  { value: "satisfaction", label: "Satisfaction", color: "bg-teal-100 text-teal-800 border-teal-200", icon: "CheckCircle" },
  { value: "happiness", label: "Happiness", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "Smile" },
  { value: "excitement", label: "Excitement", color: "bg-purple-100 text-purple-800 border-purple-200", icon: "Sparkles" },
];

export const INTENTS: { value: IntentType; label: string; color: string }[] = [
  { value: "complaint", label: "Complaint", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "technical_issue", label: "Technical Issue", color: "bg-red-50 text-red-700 border-red-200" },
  { value: "refund_request", label: "Refund Request", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "cancellation", label: "Cancellation Threat", color: "bg-rose-100 text-rose-900 border-rose-300" },
  { value: "feature_request", label: "Feature Request", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "suggestion", label: "Product Suggestion", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "praise", label: "Customer Praise", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "question", label: "Question / Clarification", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "product_inquiry", label: "Product Inquiry", color: "bg-slate-50 text-slate-700 border-slate-200" },
];

export const PRIORITIES: { value: PriorityLevel; label: string; badge: string }[] = [
  { value: "CRITICAL", label: "Critical", badge: "bg-rose-100 text-rose-800 border-rose-300 font-bold" },
  { value: "HIGH", label: "High", badge: "bg-orange-100 text-orange-800 border-orange-200 font-semibold" },
  { value: "MEDIUM", label: "Medium", badge: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "LOW", label: "Low", badge: "bg-slate-100 text-slate-700 border-slate-200" },
];

// Aspect schema for Aspect-Based Sentiment Analysis (ABSA)
export const AspectSentimentSchema = z.object({
  aspect: z.string(),
  sentiment: z.enum(["POS", "NEU", "NEG"]),
  score: z.number().min(-1).max(1),
  rationale: z.string().optional(),
});
export type AspectSentiment = z.infer<typeof AspectSentimentSchema>;

// Zod schema for single feedback entry
export const SingleFeedbackInputSchema = z.object({
  content: z.string().min(3, "Feedback content must be at least 3 characters long"),
  channel: z.enum(["SUPPORT_TICKET", "APP_STORE", "NPS_SURVEY", "SALES_CALL", "COMMUNITY"]).default("SUPPORT_TICKET"),
  sourceRef: z.string().optional(),
  customerLabel: z.string().optional(),
  product: z.string().optional(),
  region: z.string().optional(),
  datasetId: z.string().optional(),
});

// Zod schema for comprehensive AI classification response
export const AIClassificationSchema = z.object({
  sentiment: z.enum(["POS", "NEU", "NEG"]),
  sentimentScore: z.number().min(-1).max(1),
  aiConfidence: z.number().min(0).max(1).default(0.85),
  emotion: z.enum([
    "anger",
    "frustration",
    "disappointment",
    "satisfaction",
    "happiness",
    "confusion",
    "excitement",
    "concern",
  ]),
  emotionConfidence: z.number().min(0).max(1).default(0.8),
  intent: z.enum([
    "complaint",
    "praise",
    "suggestion",
    "question",
    "refund_request",
    "feature_request",
    "cancellation",
    "technical_issue",
    "product_inquiry",
  ]),
  aspects: z.array(AspectSentimentSchema).default([]),
  themes: z.array(z.string()).min(1),
  featureArea: z.string(),
  severityScore: z.number().min(0).max(100),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  severityRationale: z.string(),
  churnRiskSignal: z.boolean().default(false),
  churnRiskRationale: z.string().default("No churn signals observed"),
  rootCauseHypothesis: z.string().default("General user sentiment"),
  detectedEntities: z.array(z.string()).default([]),
  rationale: z.string(),
});

export type AIClassificationResult = z.infer<typeof AIClassificationSchema>;

// Ask AI Analyst Schema
export const AskQuestionSchema = z.object({
  question: z.string().min(2, "Question cannot be empty"),
  limit: z.number().optional().default(6),
  filterSentiment: z.enum(["POS", "NEU", "NEG"]).optional(),
  filterTheme: z.string().optional(),
});

// Report Generation Schema
export const GenerateReportSchema = z.object({
  period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
  type: z.enum(["executive", "cx", "complaints", "sentiment", "monthly"]).default("executive"),
  title: z.string().optional(),
});

// User Signup Schema
export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  workspaceName: z.string().trim().min(2, "Workspace name must be at least 2 characters"),
});

// Action Item Schema
export const CreateActionItemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  integration: z.enum(["LINEAR", "JIRA", "GITHUB"]).default("LINEAR"),
  externalKey: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("HIGH"),
  feedbackId: z.string().optional(),
});

// Roadmap Item Schema
export const CreateRoadmapItemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  stage: z.enum(["CONSIDERATION", "IN_PROGRESS", "COMPLETED"]).default("CONSIDERATION"),
  impactScore: z.number().optional().default(85),
  targetRelease: z.string().optional(),
  themeId: z.string().optional(),
});

// Data Ingestion & Quality Schema
export const DataQualityMetricsSchema = z.object({
  totalRecords: z.number(),
  validRecords: z.number(),
  invalidRecords: z.number(),
  duplicateRecords: z.number(),
  emptyFeedbackRecords: z.number(),
  completenessPct: z.number(),
  duplicateRatePct: z.number(),
  overallQualityScore: z.number(),
});
export type DataQualityMetrics = z.infer<typeof DataQualityMetricsSchema>;

// Bulk Ingestion Request Schema
export const BulkIngestSchema = z.object({
  datasetName: z.string().optional().default("Bulk Ingestion"),
  fileName: z.string().optional().default("upload.csv"),
  fileType: z.enum(["CSV", "JSON", "TXT"]).default("CSV"),
  columnMapping: z.record(z.string()).optional(),
  rows: z.array(z.record(z.any())).min(1, "At least 1 row is required"),
});
