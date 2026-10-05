"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import {
  Shield,
  Activity,
  Database,
  Users,
  Inbox,
  AlertTriangle,
  Lock,
  RefreshCw,
  CheckCircle2,
  Clock,
  Key,
  Server,
  FileText,
} from "lucide-react";
import { WorkspaceAdminDiagnostics } from "@/lib/admin-control";

export default function AdminControlPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<WorkspaceAdminDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("ALL");

  const userRole = (session?.user as any)?.role || "VIEWER";

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/diagnostics");
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access Restricted: Administrator Privileges Required");
        }
        throw new Error("Failed to load admin diagnostics");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "ADMIN") {
      fetchDiagnostics();
    } else {
      setLoading(false);
    }
  }, [userRole]);

  if (userRole !== "ADMIN") {
    return (
      <AppShell>
        <div className="py-24 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Administrator Access Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            The Enterprise Control Center is restricted to users with the ADMIN role. Your current role is{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{userRole}</span>.
          </p>
        </div>
      </AppShell>
    );
  }

  const filteredLogs = (data?.recentAuditLogs || []).filter((log) => {
    if (actionFilter === "ALL") return true;
    return log.action.includes(actionFilter);
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Enterprise Control Center
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold">
                ADMIN RESTRICTED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Deep operational telemetry, database query latency, tenant isolation invariants, and live audit trail
            </p>
          </div>

          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            Refresh Telemetry
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* System Status Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">System Health</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {data.systemHealth}
                </div>
                <span className="text-[11px] text-slate-500">Env: {data.environment}</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">DB Response Latency</span>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> {data.databaseLatencyMs} ms
                </div>
                <span className="text-[11px] text-slate-500">Connection pool healthy</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Rate Limiter</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" /> {data.rateLimiterStatus}
                </div>
                <span className="text-[11px] text-slate-500">Sliding window active</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">AI Intelligence Engine</span>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1.5">
                  <Server className="w-4 h-4" /> {data.aiPipelineStatus}
                </div>
                <span className="text-[11px] text-slate-500">Grounded RAG active</span>
              </div>
            </div>

            {/* Workspace Inventory Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Workspace Users</span>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{data.counts.totalUsers}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Feedback Records</span>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{data.counts.totalFeedback}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Datasets Ingested</span>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{data.counts.totalDatasets}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Alerts</span>
                <div className="text-base font-bold text-amber-500 mt-0.5">{data.counts.activeAlerts}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Action Items</span>
                <div className="text-base font-bold text-indigo-500 mt-0.5">{data.counts.totalActionItems}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Reports</span>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{data.counts.totalReports}</div>
              </div>
            </div>

            {/* Live Audit Trail */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Immutable Audit Log Stream
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Security-grade audit trail tracking authentication, ingestion, mutations, and policy actions
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Filter:</span>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="AUTH">Authentication</option>
                    <option value="FEEDBACK">Feedback</option>
                    <option value="ACTION">Action Items</option>
                    <option value="REPORT">Reports</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-3">Actor Email</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Target Entity</th>
                      <th className="py-2.5 px-4">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No audit log records match filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {log.actorEmail}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                              {log.actorRole}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {log.entity} {log.entityId ? `(${log.entityId.slice(0, 8)}...)` : ""}
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-400 font-mono truncate max-w-xs">
                            {log.metadata ? JSON.stringify(log.metadata) : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
