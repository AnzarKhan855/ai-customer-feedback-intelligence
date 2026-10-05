"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Building2, TrendingDown, ExternalLink, Loader2 } from "lucide-react";

export default function AccountRiskMatrix() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const res = await fetch("/api/accounts/risk");
        const data = await res.json();
        if (data.accounts) {
          setAccounts(data.accounts.slice(0, 5)); // Top 5 highest risk
        }
      } catch (e) {
        console.error("Failed to load risk matrix:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, []);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      case "MODERATE":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Enterprise Account Churn Risk Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Accounts flagged by negative sentiment ratio & ticket velocity
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> High Risk Watchlist
        </span>
      </div>

      {/* Account Risk Rows */}
      {loading ? (
        <div className="h-44 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <span>Calculating account risk scores...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No customer accounts flagged for churn risk.
        </div>
      ) : (
        <div className="space-y-2.5">
          {accounts.map((acc) => (
            <div
              key={acc.account}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${acc.riskScore >= 70 ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300" : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{acc.account}</span>
                    {acc.isEnterprise && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Enterprise ARR
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>Signals: <strong>{acc.totalSignals}</strong></span>
                    <span>Negative: <strong className="text-rose-600 dark:text-rose-400">{acc.negativeCount} ({acc.negRatio}%)</strong></span>
                    <span>Avg Score: <strong>{acc.avgScore}</strong></span>
                  </div>
                </div>
              </div>

              {/* Risk Score Pill & Bar */}
              <div className="text-right flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getTierBadge(acc.riskTier)}`}>
                  {acc.riskScore}% {acc.riskTier} RISK
                </span>
                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${acc.riskScore}%` }}
                    className={`h-full ${acc.riskScore >= 70 ? "bg-rose-500" : acc.riskScore >= 45 ? "bg-amber-500" : "bg-indigo-500"}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
