"use client";

import React, { useState, useEffect } from "react";
import { Flame, TrendingUp, TrendingDown, Activity, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { DetectedTrend, TrendAnalysisResult } from "@/lib/trends-detector";

export function EmergingTrendsRadar() {
  const [data, setData] = useState<TrendAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/trends/emerging?days=${days}`);
      if (!res.ok) throw new Error("Failed to load trend detection");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load trends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [days]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EMERGING":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
          label: "EMERGING SURGE",
        };
      case "DECLINING":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />,
          label: "DECLINING FRICTION",
        };
      default:
        return {
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          icon: <Activity className="w-3.5 h-3.5 text-slate-400" />,
          label: "STABLE MOMENTUM",
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">Emerging Issue Trend Detection</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Statistical Velocity
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Detects volume velocity surges, emerging problem clusters, and resolving friction points
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={60}>Last 60 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button
            onClick={fetchTrends}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
          Analyzing statistical feedback momentum...
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-4 space-y-4">
          {/* Anomalies alert banner */}
          {data.anomalies.length > 0 && (
            <div className="space-y-2">
              {data.anomalies.map((a, i) => (
                <div
                  key={i}
                  className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}

          {/* Trends list */}
          {data.trends.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No statistically significant volume shifts detected in the selected period.
            </div>
          ) : (
            <div className="space-y-3">
              {data.trends.map((t) => {
                const badge = getStatusBadge(t.status);
                const isExpanded = expandedTopic === t.topic;

                return (
                  <div
                    key={t.topic}
                    className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${badge.bg}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{t.topic}</h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className={`font-bold ${t.magnitudePct > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                          {t.magnitudePct > 0 ? `+${t.magnitudePct}%` : `${t.magnitudePct}%`} volume shift
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400 font-medium">
                          Severity: <strong className="text-amber-400">{t.severityScore}/100</strong>
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400">
                          {t.currentPeriodCount} recent vs {t.priorPeriodCount} prior
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-2">{t.description}</p>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Channels:</span>
                        {t.affectedChannels.map((c, ci) => (
                          <span key={ci} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => setExpandedTopic(isExpanded ? null : t.topic)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                      >
                        {isExpanded ? "Hide Evidence" : `View Evidence (${t.evidenceSnippets.length})`}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expandable Evidence Snippets */}
                    {isExpanded && t.evidenceSnippets.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                        {t.evidenceSnippets.map((s) => (
                          <div
                            key={s.id}
                            className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                              <span className="font-semibold text-slate-400">{s.channel}</span>
                              <span className="text-amber-400 font-bold">{s.severityScore}/100</span>
                            </div>
                            <p className="text-slate-300 italic">"{s.content}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
