"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Plus,
  ChevronRight,
  Layers,
  Sparkles,
  Smile,
  AlertTriangle,
  Loader2,
  X,
  ShieldAlert,
  ArrowRight,
  BarChart2,
  Activity,
} from "lucide-react";
import { getSentimentBadgeColor, getChannelBadge, formatTimeAgo } from "@/lib/utils";

export default function TrendsPage() {
  const [themes, setThemes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState<any | null>(null);
  const [drillFeedback, setDrillFeedback] = useState<any[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeDesc, setNewThemeDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [themesRes, analyticsRes] = await Promise.all([
        fetch("/api/themes"),
        fetch("/api/analytics"),
      ]);

      const themesData = await themesRes.json();
      const analyticsData = await analyticsRes.json();

      if (themesData.themes) setThemes(themesData.themes);
      if (analyticsData) setAnalytics(analyticsData);
    } catch (e) {
      console.error("Failed to load trends data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeDrill = async (theme: any) => {
    setActiveTheme(theme);
    setDrillLoading(true);
    try {
      const res = await fetch(`/api/feedback?theme=${encodeURIComponent(theme.name)}&limit=50`);
      const data = await res.json();
      if (data.items) {
        setDrillFeedback(data.items);
      }
    } catch (e) {
      console.error("Failed to drill feedback:", e);
    } finally {
      setDrillLoading(false);
    }
  };

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newThemeName.trim(),
          description: newThemeDesc.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setNewThemeName("");
        setNewThemeDesc("");
        fetchData();
      } else {
        alert(data.error || "Failed to create theme");
      }
    } catch (e) {
      alert("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const comparative = analytics?.comparative;
  const anomalies = analytics?.anomalies || [];
  const channelInsights = analytics?.channelInsights || [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Themes & Advanced Trend Intelligence
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Spike Detection Engine
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Week-over-week velocity calculation, anomaly detection, and empirical channel correlations
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Custom Theme
          </button>
        </div>

        {/* Anomaly Detection Banner if anomalies exist */}
        {anomalies.length > 0 && (
          <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              Automated Anomaly Detection Engine Flagged {anomalies.length} Critical Shifts:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {anomalies.map((anom: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 flex items-start gap-2"
                >
                  <Flame className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-700 dark:text-rose-300">{anom.description}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{anom.metric}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparative Analytics Row */}
        {comparative && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Volume Velocity (WoW)
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {comparative.shifts?.volumeGrowthPct > 0 ? `+${comparative.shifts.volumeGrowthPct}%` : `${comparative.shifts?.volumeGrowthPct}%`}
                {comparative.shifts?.volumeGrowthPct > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                {comparative.currentPeriod?.total} signals in last 7d vs {comparative.previousPeriod?.total} previously
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Negative Sentiment Shift
              </div>
              <div className={`text-xl font-bold flex items-center gap-1.5 ${
                comparative.shifts?.negativeShiftPct > 0 ? "text-rose-600" : "text-emerald-600"
              }`}>
                {comparative.shifts?.negativeShiftPct > 0 ? `+${comparative.shifts.negativeShiftPct}%` : `${comparative.shifts?.negativeShiftPct}%`}
                {comparative.shifts?.negativeShiftPct > 0 ? (
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                {comparative.currentPeriod?.negativePct}% current neg ratio vs {comparative.previousPeriod?.negativePct}% prior
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Critical SLA Issues (7d)
              </div>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                {comparative.currentPeriod?.criticalCount} Critical
              </div>
              <div className="text-[11px] text-slate-500">
                Priority items requiring engineering resolution
              </div>
            </div>
          </div>
        )}

        {/* Themes Grid */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Canonical Themes & Velocity Spikes ({themes.length})
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Calculating theme velocity and spikes...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((th) => (
                <div
                  key={th.id}
                  onClick={() => handleThemeDrill(th)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl p-5 shadow-2xs cursor-pointer transition-all flex flex-col justify-between space-y-4 hover:-translate-y-0.5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: th.color }} />
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {th.name}
                        </h3>
                      </div>

                      {th.isSpiking ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          <Flame className="w-3 h-3 text-rose-600" />
                          +{th.growthPct}% SPIKE
                        </span>
                      ) : th.growthPct > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <TrendingUp className="w-3.5 h-3.5" /> +{th.growthPct}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <TrendingDown className="w-3.5 h-3.5" /> {th.growthPct}%
                        </span>
                      )}
                    </div>

                    {th.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {th.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Total Volume:</span>
                      <strong className="text-slate-900 dark:text-slate-100">{th.totalCount} signals</strong>
                    </div>

                    {/* Progress Bar of Positive vs Negative */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${th.totalCount > 0 ? (th.sentimentBreakdown.positive / th.totalCount) * 100 : 0}%`,
                        }}
                        title={`Positive: ${th.sentimentBreakdown.positive}`}
                      />
                      <div
                        className="bg-slate-400 h-full"
                        style={{
                          width: `${th.totalCount > 0 ? (th.sentimentBreakdown.neutral / th.totalCount) * 100 : 0}%`,
                        }}
                        title={`Neutral: ${th.sentimentBreakdown.neutral}`}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{
                          width: `${th.totalCount > 0 ? (th.sentimentBreakdown.negative / th.totalCount) * 100 : 0}%`,
                        }}
                        title={`Negative: ${th.sentimentBreakdown.negative}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span className="text-emerald-600 font-semibold">{th.sentimentBreakdown.positive} Pos</span>
                      <span className="text-rose-600 font-semibold">{th.sentimentBreakdown.negative} Neg</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                        Drill in <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel vs Sentiment Correlation Analytics Table */}
        {channelInsights.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                Channel vs Sentiment Correlation Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Empirical correlation between customer acquisition/support channels and sentiment severity
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2">Channel</th>
                    <th className="py-2">Total Volume</th>
                    <th className="py-2">Negative Ratio</th>
                    <th className="py-2">Positive Ratio</th>
                    <th className="py-2">Average Severity Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {channelInsights.map((ci: any) => (
                    <tr key={ci.channel} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold">{ci.channel?.replace("_", " ")}</td>
                      <td className="py-2.5">{ci.totalSignals} signals</td>
                      <td className="py-2.5 text-rose-600 font-bold">{ci.negativeRatio}%</td>
                      <td className="py-2.5 text-emerald-600 font-bold">{ci.positiveRatio}%</td>
                      <td className="py-2.5 font-mono">{ci.avgSeverity} / 100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Drill-down Drawer for Clicked Theme */}
        {activeTheme && (
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto p-6 space-y-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {activeTheme.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeTheme.totalCount} customer signals categorized under this theme
                </p>
              </div>
              <button onClick={() => setActiveTheme(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {drillLoading ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                Loading theme signals...
              </div>
            ) : drillFeedback.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                No feedback items found for this theme.
              </div>
            ) : (
              <div className="space-y-3">
                {drillFeedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2"
                  >
                    <p className="italic font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      "{fb.content}"
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase border ${getSentimentBadgeColor(fb.sentiment)}`}>
                          {fb.sentiment}
                        </span>
                        {fb.customerLabel && <span>{fb.customerLabel}</span>}
                      </div>
                      <span>{formatTimeAgo(fb.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Theme Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Create Custom Feedback Theme
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTheme} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Theme Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="e.g. Checkout & Apple Pay"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={newThemeDesc}
                    onChange={(e) => setNewThemeDesc(e.target.value)}
                    placeholder="Description of customer pain points or feature boundary..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Create Theme
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
