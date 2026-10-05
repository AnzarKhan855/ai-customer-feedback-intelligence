"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  FileText,
  Sparkles,
  Plus,
  Printer,
  Calendar,
  User,
  Quote,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  Target,
  ShieldAlert,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatDate, getSentimentBadgeColor } from "@/lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [reportType, setReportType] = useState<"executive" | "cx" | "complaints" | "sentiment" | "monthly">("executive");
  const [reportTitle, setReportTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.reports) {
        setReports(data.reports);
        if (data.reports.length > 0 && !selectedReport) {
          setSelectedReport(data.reports[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load reports:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          type: reportType,
          title: reportTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");

      setShowGenerateModal(false);
      setReportTitle("");
      await fetchReports();
      setSelectedReport(data.report);
    } catch (err: any) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const content = selectedReport?.content;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header (hidden during print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Voice-of-Customer (VoC) Reports
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Executive Synthesis
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Empirically calculated statistics, aspect-based sentiment breakdown, root cause hypotheses, and prioritized recommendations
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedReport && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Export / Print PDF
              </button>
            )}

            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Report List (hidden during print) */}
          <div className="no-print lg:col-span-1 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Generated Reports ({reports.length})
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                Loading reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                No reports generated yet. Click "Generate Report" to synthesize your first executive digest.
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs space-y-1 ${
                      selectedReport?.id === r.id
                        ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-2xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {r.title}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{formatDate(r.createdAt)}</span>
                      <span>By {r.generatedBy}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Selected Report View */}
          <div className="lg:col-span-3">
            {selectedReport ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 shadow-xs space-y-8 report-page">
                {/* Report Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Customer Feedback Intelligence Platform</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    {selectedReport.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Generated {formatDate(selectedReport.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Prepared by {selectedReport.generatedBy}
                    </span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs text-indigo-600">
                    1. Executive Summary
                  </h3>
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                    {content?.executiveSummary}
                  </div>
                </div>

                {/* Key Findings */}
                {content?.keyFindings && content.keyFindings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs text-indigo-600">
                      2. Major Findings & Signals
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {content.keyFindings.map((finding: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start gap-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Themes Narrative */}
                {content?.topThemesNarrative && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs text-indigo-600">
                      3. Top Themes & Friction Analysis
                    </h3>
                    <div className="space-y-3">
                      {content.topThemesNarrative.map((themeItem: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {themeItem.theme}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                themeItem.severity === "High"
                                  ? "bg-rose-100 text-rose-800 border-rose-200"
                                  : themeItem.severity === "Medium"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {themeItem.severity} Severity
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {themeItem.analysis}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aspect-Based Breakdown */}
                {content?.aspectBreakdown && content.aspectBreakdown.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs text-indigo-600">
                      4. Aspect-Based Customer Sentiment (ABSA)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {content.aspectBreakdown.map((asp: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900 dark:text-slate-100">{asp.aspect}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold uppercase border ${getSentimentBadgeColor(asp.sentiment)}`}>
                              {asp.sentiment}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {asp.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Root Cause Hypotheses */}
                {content?.rootCauseAnalysis && content.rootCauseAnalysis.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs text-indigo-600">
                      5. AI Root Cause Hypotheses
                    </h3>
                    <div className="space-y-3">
                      {content.rootCauseAnalysis.map((rc: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1.5"
                        >
                          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            {rc.problem}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong>AI Hypothesis:</strong> {rc.hypothesis}
                          </p>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Evidence Basis: {rc.evidence}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notable Customer Quotes */}
                {content?.notableQuotes && content.notableQuotes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs text-indigo-600">
                      6. Representative Voice-of-Customer Quotes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {content.notableQuotes.map((q: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 text-xs"
                        >
                          <p className="italic font-medium text-slate-800 dark:text-slate-200">
                            "{q.quote}"
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{q.context}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold uppercase border ${getSentimentBadgeColor(q.sentiment)}`}>
                              {q.sentiment}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Actions */}
                {content?.recommendedActions && content.recommendedActions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs text-indigo-600">
                      7. Strategic Action Recommendations
                    </h3>
                    <div className="space-y-3">
                      {content.recommendedActions.map((act: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <Target className="w-4 h-4 text-indigo-600" />
                              {act.title}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                act.priority === "CRITICAL"
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : act.priority === "HIGH"
                                  ? "bg-orange-100 text-orange-800 border-orange-200"
                                  : "bg-slate-100 text-slate-800 border-slate-200"
                              }`}
                            >
                              {act.priority} Priority
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {act.description}
                          </p>
                          {act.expectedOutcome && (
                            <div className="p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 text-[11px] text-indigo-900 dark:text-indigo-300 font-medium">
                              Expected Business Outcome: {act.expectedOutcome}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <FileText className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-semibold">Select or generate a report to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Generate Executive Intelligence Report
                  </h3>
                </div>
                <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleGenerateReport} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e: any) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="executive">Executive C-Suite Digest</option>
                    <option value="cx">Customer Experience (CX) Health Review</option>
                    <option value="complaints">Customer Complaints & Churn Risk Analysis</option>
                    <option value="sentiment">Sentiment & Emotion Trajectory Report</option>
                    <option value="monthly">Comprehensive Monthly Review</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Analysis Timeframe
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "7 Days", val: "7d" },
                      { label: "30 Days", val: "30d" },
                      { label: "90 Days", val: "90d" },
                      { label: "All Time", val: "all" },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setPeriod(p.val as any)}
                        className={`py-2 rounded-xl border font-semibold transition-colors ${
                          period === p.val
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g. Q4 Executive Voice-of-Customer Review"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Synthesizing Report...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Intelligence Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
