"use client";

import React from "react";
import {
  X,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { FeedbackStatus } from "@/lib/types";
import { formatDate, getSentimentBadgeColor, getChannelBadge } from "@/lib/utils";

interface FeedbackDetailModalProps {
  feedback: any | null;
  onClose: () => void;
  onStatusChange: (id: string, status: FeedbackStatus) => void;
  onReclassify?: (id: string) => void;
  isReclassifying?: boolean;
  onConvertToTicket?: (feedback: any) => void;
}

const EMOTION_COLORS: Record<string, string> = {
  anger: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300",
  frustration: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300",
  disappointment: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300",
  concern: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300",
  confusion: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300",
  satisfaction: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300",
  happiness: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300",
  excitement: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300",
};

export default function FeedbackDetailModal({
  feedback,
  onClose,
  onStatusChange,
  onReclassify,
  isReclassifying = false,
  onConvertToTicket,
}: FeedbackDetailModalProps) {
  if (!feedback) return null;

  const chan = getChannelBadge(feedback.channel);
  const emotionClass =
    EMOTION_COLORS[feedback.emotion?.toLowerCase() || ""] ||
    "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200";

  const severity = feedback.severityScore ?? 25;
  const severityColor =
    severity >= 75 ? "bg-rose-500" : severity >= 50 ? "bg-orange-500" : "bg-emerald-500";

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-400">
            {feedback.sourceRef || `ID: ${feedback.id.slice(0, 8)}`}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
              feedback.priority === "CRITICAL"
                ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300"
                : feedback.priority === "HIGH"
                ? "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300"
                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {feedback.priority || "LOW"} PRIORITY
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${chan.bg}`}>
            {chan.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Customer Verbatim Quote */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          Customer Verbatim
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed italic">
          "{feedback.content}"
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
          {feedback.customerLabel && (
            <span>
              Customer: <strong>{feedback.customerLabel}</strong>
            </span>
          )}
          {feedback.product && (
            <span>
              Product: <strong>{feedback.product}</strong>
            </span>
          )}
          {feedback.region && (
            <span>
              Region: <strong>{feedback.region}</strong>
            </span>
          )}
          <span>
            Received: <strong>{formatDate(feedback.createdAt)}</strong>
          </span>
        </div>
      </div>

      {/* NLP & AI Multilayer Diagnostics */}
      <div className="space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Multi-Layer AI Classification
        </div>

        {/* Sentiment, Emotion & Intent Grid */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          {/* Sentiment */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-semibold text-slate-400">Sentiment</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getSentimentBadgeColor(
                  feedback.sentiment
                )}`}
              >
                {feedback.sentiment}
              </span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                {feedback.sentimentScore > 0 ? `+${feedback.sentimentScore}` : feedback.sentimentScore}
              </span>
            </div>
          </div>

          {/* Emotion */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-semibold text-slate-400">Emotion (Plutchik-8)</div>
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-bold border capitalize ${emotionClass}`}
              >
                {feedback.emotion || "Concern"}
              </span>
            </div>
          </div>

          {/* Intent */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-semibold text-slate-400">Intent</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize mt-1 truncate">
              {feedback.intent?.replace("_", " ") || "Feedback"}
            </div>
          </div>
        </div>

        {/* Explainable Severity Score Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300">
              Explainable Severity Score:
            </span>
            <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              {severity} / 100
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${severityColor}`}
              style={{ width: `${Math.max(5, severity)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            {feedback.severityRationale ||
              "Calculated algorithmically via emotion intensity, priority urgency, and technical bottleneck keywords."}
          </p>
        </div>

        {/* Aspect-Based Sentiment Analysis (ABSA) */}
        {feedback.aspects && feedback.aspects.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Aspect-Based Sentiment Breakdown (ABSA):
            </div>
            <div className="space-y-1.5">
              {feedback.aspects.map((asp: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {asp.aspect}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSentimentBadgeColor(
                        asp.sentiment
                      )}`}
                    >
                      {asp.sentiment}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 font-semibold">
                      {asp.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Churn Risk Alert */}
        {feedback.churnRiskSignal && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Retention Alert: Customer Churn Signal Detected
            </div>
            <p className="text-[11px] leading-relaxed">
              {feedback.churnRiskRationale ||
                "Customer indicates explicit frustration, competitor evaluation, or intent to terminate agreement."}
            </p>
          </div>
        )}

        {/* AI Root Cause Hypothesis */}
        {feedback.rootCauseHypothesis && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Technical Root Cause Hypothesis:
            </div>
            <p className="text-[11px] leading-relaxed italic">
              "{feedback.rootCauseHypothesis}"
            </p>
            <div className="text-[10px] text-amber-700 dark:text-amber-400">
              *Synthesized by AI inference engine. Cross-reference with system APM and logs.*
            </div>
          </div>
        )}

        {/* Detected Entities */}
        {feedback.detectedEntities && feedback.detectedEntities.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Entities:</span>
            {feedback.detectedEntities.map((ent: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono border border-slate-200 dark:border-slate-700"
              >
                {ent}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Status & Action Buttons */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={feedback.status}
            onChange={(e) => onStatusChange(feedback.id, e.target.value as FeedbackStatus)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACTIONED">Actioned</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onReclassify && (
            <button
              onClick={() => onReclassify(feedback.id)}
              disabled={isReclassifying}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles
                className={`w-3.5 h-3.5 text-indigo-600 ${isReclassifying ? "animate-spin" : ""}`}
              />
              Re-classify
            </button>
          )}

          {onConvertToTicket && (
            <button
              onClick={() => onConvertToTicket(feedback)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              Convert to Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
