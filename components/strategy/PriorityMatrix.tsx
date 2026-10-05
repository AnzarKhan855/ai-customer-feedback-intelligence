"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Zap,
  Clock,
  Archive,
  RefreshCw,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PriorityMatrixResult, PriorityMatrixItem } from "@/lib/priority-matrix";

export function PriorityMatrix() {
  const [data, setData] = useState<PriorityMatrixResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/strategy/priority-matrix");
      if (!res.ok) throw new Error("Failed to load priority matrix");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load priority matrix");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded mb-4" />
        <div className="h-48 bg-slate-800/40 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">AI Strategic Priority Matrix</h3>
          <button
            onClick={fetchData}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
        <p className="text-xs text-rose-400 mt-2">{error || "Unable to load priority matrix."}</p>
      </div>
    );
  }

  const renderCard = (item: PriorityMatrixItem) => {
    const isExpanded = expandedItemId === item.id;

    return (
      <div
        key={item.id}
        className="bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 rounded-lg p-3 transition text-xs"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <span>{item.topic}</span>
            {item.churnSignalsCount > 0 && (
              <span className="flex items-center text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20 font-medium">
                <Flame className="w-3 h-3 mr-0.5" />
                {item.churnSignalsCount} churn
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400">Imp:</span>
            <span className="font-bold text-indigo-300">{item.impactScore}</span>
            <span className="text-slate-400 ml-1">Urg:</span>
            <span className="font-bold text-amber-300">{item.urgencyScore}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{item.rationale}</p>

        <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between">
          <span className="text-[11px] text-emerald-400 font-medium">
            Action: {item.suggestedAction}
          </span>
          <button
            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 transition"
          >
            {item.evidenceSnippets.length} citations
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Verbatim Evidence</span>
            {item.evidenceSnippets.map((ev) => (
              <div key={ev.id} className="bg-slate-900/60 p-2 rounded text-[11px] text-slate-300 italic">
                "{ev.content}"
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 not-italic">
                  <span>Channel: {ev.channel}</span>
                  <span>Severity: {ev.severityScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">AI Strategic Priority Matrix</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Impact vs Urgency
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Grounds product decisions using mathematical impact (severity + churn risk) and urgency (volume + multi-channel spread)
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 text-xs text-slate-300 my-4 flex items-center justify-between">
        <span>{data.summary}</span>
        <span className="text-[11px] text-slate-400">{data.totalIssuesRanked} focus areas ranked</span>
      </div>

      {/* 2x2 Quadrant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quadrant 1: High Priority (High Impact, High Urgency) */}
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-rose-900/30 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">High Priority</h4>
                <p className="text-[10px] text-slate-400">High Impact • High Urgency</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              {data.matrix.highPriority.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {data.matrix.highPriority.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">No high priority crises detected</p>
            ) : (
              data.matrix.highPriority.map(renderCard)
            )}
          </div>
        </div>

        {/* Quadrant 2: Quick Wins (High Impact, Low Urgency) */}
        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Wins</h4>
                <p className="text-[10px] text-slate-400">High Impact • Low Urgency</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {data.matrix.quickWins.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {data.matrix.quickWins.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">No immediate quick wins identified</p>
            ) : (
              data.matrix.quickWins.map(renderCard)
            )}
          </div>
        </div>

        {/* Quadrant 3: Strategic Initiatives (Low Impact, High Urgency) */}
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-amber-900/30 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Strategic Focus</h4>
                <p className="text-[10px] text-slate-400">Low Impact • High Urgency</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              {data.matrix.strategic.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {data.matrix.strategic.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">No high-urgency strategic spikes</p>
            ) : (
              data.matrix.strategic.map(renderCard)
            )}
          </div>
        </div>

        {/* Quadrant 4: Low Priority / Backlog */}
        <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-700/40 text-slate-400 border border-slate-700/60">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Backlog / Low Priority</h4>
                <p className="text-[10px] text-slate-400">Low Impact • Low Urgency</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
              {data.matrix.lowPriority.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {data.matrix.lowPriority.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">No low-priority items</p>
            ) : (
              data.matrix.lowPriority.map(renderCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
