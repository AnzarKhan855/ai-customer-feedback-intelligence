"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Flame,
  Sparkles,
  Target,
  Copy,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Heart,
  TrendingDown,
} from "lucide-react";
import { ExecutiveBriefingResult } from "@/lib/briefing";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveBriefingModal({ isOpen, onClose }: Props) {
  const [data, setData] = useState<ExecutiveBriefingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights/executive-briefing");
      if (!res.ok) throw new Error("Failed to load executive briefing");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load briefing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBriefing();
    }
  }, [isOpen]);

  const copyToClipboard = () => {
    if (!data) return;
    const memo = `# EXECUTIVE INTELLIGENCE BRIEFING
Date: ${new Date(data.generatedAt).toLocaleDateString()}
Headline: ${data.headline}

## EXECUTIVE SUMMARY
${data.executiveSummary}

## METRIC SNAPSHOT
- Feedback Analyzed: ${data.metrics.totalFeedbackAnalyzed}
- Sentiment: ${data.metrics.positivePercentage}% POS / ${data.metrics.negativePercentage}% NEG / ${data.metrics.neutralPercentage}% NEU
- Critical Escalations: ${data.metrics.criticalEscalationsCount}
- Churn Signals: ${data.metrics.churnSignalsCount}
- System Severity Index: ${data.metrics.averageSeverityScore}/100

## BURNING FIRES
${data.burningFires.map((f) => `- **${f.area}** (${f.reportCount} reports, severity ${f.severity}/100): ${f.summary}`).join("\n")}

## CUSTOMER DELIGHTERS
${data.customerDelights.map((d) => `- **${d.area}**: ${d.summary}`).join("\n")}

## STRATEGIC PRIORITIES
${data.strategicPriorities.map((p) => `- **${p.title}**: ${p.rationale} (Outcome: ${p.expectedOutcome})`).join("\n")}
`;

    navigator.clipboard.writeText(memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Executive Intelligence Briefing</h3>
              <p className="text-xs text-slate-400">
                C-Suite ready synthesis grounded in real customer verbatims
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied Memo!" : "Copy as Memo"}
              </button>
            )}
            <button
              onClick={fetchBriefing}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">Synthesizing executive briefing from feedback records...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Executive Headline Banner */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  Headline Synthesis
                </span>
                <h2 className="text-lg font-bold text-white mt-1">{data.headline}</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{data.executiveSummary}</p>
              </div>

              {/* Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Analyzed</span>
                  <div className="text-lg font-bold text-white mt-0.5">{data.metrics.totalFeedbackAnalyzed}</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Pos / Neg Split</span>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {data.metrics.positivePercentage}% <span className="text-xs text-rose-400 font-normal">/ {data.metrics.negativePercentage}%</span>
                  </div>
                </div>
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Critical Escalations</span>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">{data.metrics.criticalEscalationsCount}</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Churn Risk Signals</span>
                  <div className="text-lg font-bold text-rose-400 mt-0.5">{data.metrics.churnSignalsCount}</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Friction Index</span>
                  <div className="text-lg font-bold text-indigo-300 mt-0.5">{data.metrics.averageSeverityScore}/100</div>
                </div>
              </div>

              {/* Burning Fires & Delights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Burning Fires */}
                <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 text-rose-300">
                    <Flame className="w-4 h-4 text-rose-400" /> Burning Fires (Top Friction Points)
                  </h4>
                  {data.burningFires.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 italic">No active fires identified</p>
                  ) : (
                    <div className="space-y-3">
                      {data.burningFires.map((fire, idx) => (
                        <div key={idx} className="bg-slate-900/80 border border-rose-950 rounded-lg p-3 text-xs">
                          <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
                            <span>{fire.area}</span>
                            <span className="text-rose-400 text-[11px] font-bold">Sev: {fire.severity}/100</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{fire.summary}</p>
                          {fire.citations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-300 italic">
                              "{fire.citations[0].content}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Delighters */}
                <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 text-emerald-300">
                    <Heart className="w-4 h-4 text-emerald-400" /> Customer Delighters (Organic Wins)
                  </h4>
                  {data.customerDelights.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 italic">No recent positive highlights</p>
                  ) : (
                    <div className="space-y-3">
                      {data.customerDelights.map((delight, idx) => (
                        <div key={idx} className="bg-slate-900/80 border border-emerald-950 rounded-lg p-3 text-xs">
                          <div className="font-semibold text-emerald-300 mb-1">{delight.area}</div>
                          <p className="text-[11px] text-slate-400">{delight.summary}</p>
                          {delight.citations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-300 italic">
                              "{delight.citations[0].content}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Strategic Priorities */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 text-indigo-300">
                  <Target className="w-4 h-4 text-indigo-400" /> Strategic Recommended Actions
                </h4>
                <div className="space-y-2">
                  {data.strategicPriorities.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs">
                      <div className="font-semibold text-slate-200">{item.title}</div>
                      <p className="text-[11px] text-slate-400 mt-1">{item.rationale}</p>
                      <div className="text-[11px] text-emerald-400 font-medium mt-1">
                        Expected Outcome: {item.expectedOutcome}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
