"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  Layers,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Flame,
  ArrowRight,
} from "lucide-react";
import { CustomReportContent, CustomReportType } from "@/lib/report-builder";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated?: () => void;
}

export function CustomReportBuilder({ isOpen, onClose, onReportCreated }: Props) {
  const [title, setTitle] = useState("Executive Customer Health Report");
  const [reportType, setReportType] = useState<CustomReportType>("EXECUTIVE_OVERVIEW");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    id: string;
    title: string;
    content: CustomReportContent;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reports/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          reportType,
          period,
          channelFilter,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate custom report");

      setGeneratedResult(data.report);
      if (onReportCreated) onReportCreated();
    } catch (err: any) {
      setError(err.message || "Failed to create report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Custom AI Executive Report Builder</h3>
              <p className="text-xs text-slate-400">
                Generate tailored, evidence-grounded reports with quantitative metrics and citations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!generatedResult ? (
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Report Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Report Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q1 Enterprise Billing & Friction Review"
                  required
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Report Archetype Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Report Archetype
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "EXECUTIVE_OVERVIEW", label: "Executive Overview", desc: "Holistic VoC and sentiment pulse" },
                    { id: "PRODUCT_FRICTION", label: "Product Friction", desc: "Top system bottlenecks and bug clusters" },
                    { id: "RETENTION_RISK", label: "Retention & Churn Risk", desc: "Account cancellation risk indicators" },
                    { id: "COMPETITIVE", label: "Competitive Benchmark", desc: "Market alternatives and feature gaps" },
                  ].map((arch) => (
                    <div
                      key={arch.id}
                      onClick={() => setReportType(arch.id as CustomReportType)}
                      className={`p-3 rounded-xl border cursor-pointer transition text-xs ${
                        reportType === arch.id
                          ? "bg-indigo-950/30 border-indigo-500/60 text-white"
                          : "bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-semibold text-slate-200">{arch.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{arch.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Period & Channel Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Timeframe
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="7d">Last 7 Days (Weekly)</option>
                    <option value="30d">Last 30 Days (Monthly)</option>
                    <option value="90d">Last 90 Days (Quarterly)</option>
                    <option value="all">All-Time Comprehensive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Channel Filter
                  </label>
                  <select
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Ingested Channels</option>
                    <option value="SUPPORT_TICKET">Support Tickets Only</option>
                    <option value="APP_STORE">App Store Reviews Only</option>
                    <option value="NPS_SURVEY">NPS Surveys Only</option>
                    <option value="SALES_CALL">Sales Calls Only</option>
                    <option value="COMMUNITY">Slack / Community Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Synthesizing Executive Report...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate & Persist Report
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Generated Report Preview */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Report successfully generated and saved to workspace library!
                </span>
                <button
                  onClick={() => setGeneratedResult(null)}
                  className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
                >
                  Build Another
                </button>
              </div>

              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">
                    {generatedResult.content.reportType.replace("_", " ")} • {generatedResult.content.periodLabel}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{generatedResult.title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {generatedResult.content.executiveSummary}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">Total Volume</span>
                    <div className="text-base font-bold text-white">{generatedResult.content.metrics.totalVolume}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">Sentiment Split</span>
                    <div className="text-base font-bold text-emerald-400">
                      {generatedResult.content.metrics.positivePercentage}% POS / {generatedResult.content.metrics.negativePercentage}% NEG
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">Churn Risk Signals</span>
                    <div className="text-base font-bold text-rose-400">{generatedResult.content.metrics.churnRisksCount}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">Severity Index</span>
                    <div className="text-base font-bold text-indigo-300">{generatedResult.content.metrics.averageSeverity}/100</div>
                  </div>
                </div>

                {/* Findings with Verbatims */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
                    Grounded Key Findings & Verbatims
                  </h4>
                  <div className="space-y-3">
                    {generatedResult.content.keyFindings.map((finding, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-200">
                          <span>{finding.title}</span>
                          <span className="text-[10px] text-amber-400">Sev: {finding.severity}/100</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{finding.description}</p>
                        {finding.verbatims.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
                            {finding.verbatims.map((v) => (
                              <div key={v.id} className="text-[11px] text-slate-300 italic">
                                "{v.content}"
                                <span className="not-italic text-[10px] text-slate-500 ml-2">
                                  ({v.channel})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Actionable Recommendations
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {generatedResult.content.actionableRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
