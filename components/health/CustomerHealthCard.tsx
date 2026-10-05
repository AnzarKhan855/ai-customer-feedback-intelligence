"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingUp, RefreshCw, Users, Layers } from "lucide-react";
import { HealthScoreResult } from "@/lib/customer-health";

export function CustomerHealthCard() {
  const [data, setData] = useState<HealthScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health-score");
      if (!res.ok) throw new Error("Failed to load health intelligence");
      const json = await res.json();
      setData(json.health);
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded mb-4" />
        <div className="h-20 bg-slate-800/60 rounded mb-4" />
        <div className="h-4 bg-slate-800/40 rounded w-3/4" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Customer Health Score</h3>
          <button
            onClick={fetchHealth}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
        <p className="text-xs text-rose-400 mt-2">{error || "Unable to compute health score."}</p>
      </div>
    );
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "HEALTHY":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          label: "HEALTHY",
        };
      case "AT_RISK":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: "AT RISK",
        };
      default:
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
          label: "CRITICAL",
        };
    }
  };

  const badge = getTierBadge(data.tier);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">Customer Health Intelligence</h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 font-medium ${badge.bg}`}
            >
              {badge.icon}
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time composite health derived from sentiment, severity, churn signals & recurrence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-3xl font-bold tracking-tight text-white">{data.score}</span>
            <span className="text-xs text-slate-500 font-medium">/100</span>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            title="Refresh health signals"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Why this score? (Explainable signals) */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Why this score? (Risk Drivers)
          </h4>
          <ul className="space-y-2">
            {data.reasons.map((r, i) => (
              <li
                key={i}
                className="text-xs bg-slate-800/40 border border-slate-800 rounded-lg p-2.5 text-slate-300 flex items-start gap-2"
              >
                <span className="text-rose-400 font-bold">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Positive Drivers */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Positive Drivers
          </h4>
          <ul className="space-y-2">
            {data.positiveDrivers.map((p, i) => (
              <li
                key={i}
                className="text-xs bg-slate-800/40 border border-slate-800 rounded-lg p-2.5 text-slate-300 flex items-start gap-2"
              >
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top At-Risk Accounts */}
      {data.accounts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Identified Accounts ({data.accounts.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.accounts.slice(0, 6).map((acc, i) => {
              const accBadge = getTierBadge(acc.tier);
              return (
                <div
                  key={i}
                  className="bg-slate-800/50 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-white truncate max-w-[150px]">
                      {acc.customerLabel}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${accBadge.bg}`}>
                      {acc.score}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{acc.reasons[0]}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{acc.feedbackCount} feedback</span>
                    {acc.churnSignals > 0 && (
                      <span className="text-rose-400">⚠️ {acc.churnSignals} churn signal</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature Area Health */}
      {data.featureAreaHealth.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            Feature Area Health Breakdown
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.featureAreaHealth.slice(0, 6).map((area, i) => {
              const areaBadge = getTierBadge(area.tier);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-slate-800/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs"
                >
                  <span className="text-slate-300 font-medium">{area.area}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${areaBadge.bg}`}>
                    {area.healthScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
