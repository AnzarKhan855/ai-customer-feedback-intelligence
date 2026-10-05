"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Bell,
  AlertTriangle,
  Flame,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import Link from "next/link";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (e) {
      console.error("Failed to load alerts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdateStatus = async (id: string, status: "ACKNOWLEDGED" | "RESOLVED") => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      }
    } catch (e) {
      alert("Failed to update alert status");
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return {
          badge: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
          icon: Flame,
          border: "border-l-4 border-l-rose-500",
        };
      case "HIGH":
        return {
          badge: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
          icon: AlertTriangle,
          border: "border-l-4 border-l-orange-500",
        };
      default:
        return {
          badge: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800",
          icon: ShieldAlert,
          border: "border-l-4 border-l-yellow-500",
        };
    }
  };

  const activeCount = alerts.filter((a) => a.status === "ACTIVE").length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Intelligent Customer Alerts
              </h1>
              {activeCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 animate-pulse">
                  {activeCount} Active Alerts
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Automated anomaly detection triggers for negative sentiment surges, critical complaints, and account churn signals
            </p>
          </div>

          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-2xs transition-colors"
            title="Refresh Alerts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Scanning for anomaly triggers...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All Systems Nominal</p>
            <p className="text-xs text-slate-500">No abnormal sentiment spikes or critical customer churn alerts detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const style = getSeverityStyle(alert.severity);
              const Icon = style.icon;

              return (
                <div
                  key={alert.id}
                  className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs ${style.border} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${style.badge}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {alert.type?.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatTimeAgo(alert.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {alert.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {alert.message}
                    </p>

                    {alert.metric && (
                      <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold pt-0.5">
                        Trigger: {alert.metric}
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.status === "ACTIVE" ? (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, "ACKNOWLEDGED")}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        Acknowledge
                      </button>
                    ) : alert.status === "ACKNOWLEDGED" ? (
                      <button
                        onClick={() => handleUpdateStatus(alert.id, "RESOLVED")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Resolved
                      </span>
                    )}

                    <Link
                      href="/inbox"
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1"
                    >
                      View Signals <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
