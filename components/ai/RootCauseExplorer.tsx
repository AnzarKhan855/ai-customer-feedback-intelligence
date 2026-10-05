"use client";

import React, { useState } from "react";
import { Search, Sparkles, AlertOctagon, CheckCircle2, ChevronRight, Layers, FileText, Info } from "lucide-react";
import { RootCauseReport } from "@/lib/root-cause";

const SAMPLE_TOPICS = [
  "Authentication & SAML SSO",
  "Billing & Invoicing",
  "Mobile App Performance",
  "Onboarding Friction",
];

export function RootCauseExplorer() {
  const [topic, setTopic] = useState("Authentication & SAML SSO");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<RootCauseReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null);

  const runAnalysis = async (searchTopic: string) => {
    if (!searchTopic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights/root-cause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: searchTopic }),
      });
      if (!res.ok) throw new Error("Failed to analyze root cause");
      const json = await res.json();
      setReport(json.report);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">AI Issue Root-Cause Explorer</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
              Diagnostic Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Trace recurring customer friction signals to underlying technical root-cause hypotheses
          </p>
        </div>
      </div>

      {/* Topic Input & Quick Suggestions */}
      <div className="mt-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAnalysis(topic)}
              placeholder="Enter customer issue or theme (e.g., Billing timeout, SSO failure)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => runAnalysis(topic)}
            disabled={loading || !topic.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Diagnosing..." : "Explore Root Causes"}
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500 font-medium">Suggested topics:</span>
          {SAMPLE_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTopic(t);
                runAnalysis(t);
              }}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Report Display */}
      {report && (
        <div className="mt-6 space-y-6">
          {/* Diagnostic Disclaimer */}
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-start gap-2.5 text-xs text-indigo-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-200">Algorithmic Diagnostic Hypotheses: </span>
              {report.disclaimer}
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Evidence Count</span>
              <p className="text-lg font-bold text-white mt-0.5">{report.totalEvidenceCount} records</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Severity Impact</span>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{report.averageSeverity} / 100</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Priority Tier</span>
              <p className="text-lg font-bold text-rose-400 mt-0.5">{report.priority}</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Affected Channels</span>
              <p className="text-lg font-bold text-slate-200 mt-0.5">{report.affectedChannels.length} channels</p>
            </div>
          </div>

          {/* Root-Cause Hypotheses */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              Root-Cause Hypotheses ({report.hypotheses.length})
            </h4>
            <div className="space-y-3">
              {report.hypotheses.map((hyp, i) => (
                <div
                  key={i}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        HYPOTHESIS #{i + 1}
                      </span>
                      <h5 className="text-sm font-semibold text-white">{hyp.title}</h5>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Likelihood: <strong className="text-slate-200">{hyp.likelihood}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{hyp.description}</p>
                  
                  {hyp.supportingSignals.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Signals:</span>
                      {hyp.supportingSignals.map((s, si) => (
                        <span key={si} className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Recommended Engineering Actions
            </h4>
            <div className="space-y-2">
              {report.recommendedActions.map((rec, i) => (
                <div
                  key={i}
                  className="bg-slate-800/40 border border-slate-800 rounded-lg p-3 text-xs flex items-start gap-3"
                >
                  <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-bold">
                    {rec.priority}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-200">{rec.action}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{rec.rationale}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verbatim Supporting Evidence */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              Supporting Feedback Citations ({report.citations.length})
            </h4>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {report.citations.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-800/30 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-300">{c.customerLabel || "Anonymous Customer"}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {c.channel}
                      </span>
                      <span className="text-amber-400 font-bold">{c.severityScore}/100</span>
                    </div>
                  </div>
                  <p className="text-slate-300 italic">"{c.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
