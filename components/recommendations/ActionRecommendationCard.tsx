"use client";

import React, { useState } from "react";
import {
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
} from "lucide-react";

export interface AIRecommendationData {
  id: string;
  problem: string;
  evidence: string;
  businessImpact: string;
  recommendedAction: string;
  priority: string;
  expectedOutcome: string;
  status: string;
  createdAt: string | Date;
}

interface Props {
  recommendation: AIRecommendationData;
  onUpdateStatus?: (id: string, status: string) => Promise<void>;
  onPromoted?: () => void;
}

export function ActionRecommendationCard({
  recommendation: rec,
  onUpdateStatus,
  onPromoted,
}: Props) {
  const [promoting, setPromoting] = useState(false);
  const [promotedKey, setPromotedKey] = useState<string | null>(null);

  const handlePromote = async (integration: "LINEAR" | "JIRA" = "LINEAR") => {
    setPromoting(true);
    try {
      const res = await fetch("/api/recommendations/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: rec.id, integration }),
      });
      const data = await res.json();
      if (res.ok && data.actionItem) {
        setPromotedKey(data.actionItem.externalKey);
        if (onPromoted) onPromoted();
      } else {
        alert(data.error || "Failed to promote recommendation");
      }
    } catch (e: any) {
      alert("Error promoting recommendation: " + e.message);
    } finally {
      setPromoting(false);
    }
  };

  const priorityColors: Record<string, string> = {
    CRITICAL: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    HIGH: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    MEDIUM: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    LOW: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };

  const statusColors: Record<string, string> = {
    OPEN: "bg-slate-700/60 text-slate-300",
    IN_PROGRESS: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
    RESOLVED: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
    DISMISSED: "bg-slate-800 text-slate-500",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 text-slate-200 transition space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  priorityColors[rec.priority] || priorityColors.HIGH
                }`}
              >
                {rec.priority}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  statusColors[rec.status] || statusColors.OPEN
                }`}
              >
                {rec.status.replace("_", " ")}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white leading-snug">{rec.problem}</h4>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-end sm:self-start">
          {promotedKey ? (
            <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Ticket: {promotedKey}
            </span>
          ) : (
            <button
              onClick={() => handlePromote("LINEAR")}
              disabled={promoting || rec.status === "RESOLVED" || rec.status === "DISMISSED"}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {promoting ? "Promoting..." : "Promote to Ticket"}
            </button>
          )}
        </div>
      </div>

      {/* Recommended Action */}
      <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 text-xs">
        <span className="text-[10px] uppercase font-bold text-slate-400">Recommended Action:</span>
        <p className="text-white font-medium mt-0.5">{rec.recommendedAction}</p>
      </div>

      {/* Evidence & Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-800/20 rounded-lg border border-slate-800/60">
          <span className="text-[10px] uppercase font-bold text-slate-500">Evidence Citations</span>
          <p className="text-slate-300 italic mt-1 text-[11px] leading-relaxed">
            {rec.evidence}
          </p>
        </div>
        <div className="p-3 bg-slate-800/20 rounded-lg border border-slate-800/60">
          <span className="text-[10px] uppercase font-bold text-slate-500">Business Impact & Outcome</span>
          <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
            {rec.businessImpact}
          </p>
          <p className="text-emerald-400 mt-1 text-[10px] font-semibold">
            Expected: {rec.expectedOutcome}
          </p>
        </div>
      </div>

      {/* Status Transition Row */}
      {onUpdateStatus && (
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Lifecycle Controls:</span>
          <div className="flex items-center gap-1.5">
            {rec.status !== "IN_PROGRESS" && (
              <button
                onClick={() => onUpdateStatus(rec.id, "IN_PROGRESS")}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                Start Progress
              </button>
            )}
            {rec.status !== "RESOLVED" && (
              <button
                onClick={() => onUpdateStatus(rec.id, "RESOLVED")}
                className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-900/60 hover:bg-emerald-900/60 text-emerald-300 text-[11px]"
              >
                Resolve
              </button>
            )}
            {rec.status !== "DISMISSED" && (
              <button
                onClick={() => onUpdateStatus(rec.id, "DISMISSED")}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-500 text-[11px]"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
