"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Search,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Quote,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { ClusterExplorerResult, FeedbackCluster } from "@/lib/clusters";

export function ClusterExplorer() {
  const [data, setData] = useState<ClusterExplorerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback/clusters");
      if (!res.ok) throw new Error("Failed to load feedback clusters");
      const json = await res.json();
      setData(json);
      if (json.clusters && json.clusters.length > 0) {
        setSelectedClusterId(json.clusters[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load clusters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 w-52 bg-slate-800 rounded mb-4" />
        <div className="h-48 bg-slate-800/40 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Semantic Feedback Cluster Explorer</h3>
          <button
            onClick={fetchData}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
        <p className="text-xs text-rose-400 mt-2">{error || "Unable to discover clusters."}</p>
      </div>
    );
  }

  const filteredClusters = data.clusters.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.primaryArea.toLowerCase().includes(q) ||
      c.topKeywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const activeCluster =
    data.clusters.find((c) => c.id === selectedClusterId) || data.clusters[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">Semantic Feedback Clusters</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Topic Discovery & Grouping
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Discovers thematic problem groupings across feedback records without manual tagging
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search clusters, topics, keywords..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-400">
          Showing {filteredClusters.length} of {data.totalClustersDiscovered} clusters ({data.totalFeedbackAnalyzed} records)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Cluster List / Selector */}
        <div className="lg:col-span-5 space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filteredClusters.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No clusters match your filter.
            </div>
          ) : (
            filteredClusters.map((cluster) => {
              const isSelected = activeCluster?.id === cluster.id;
              return (
                <div
                  key={cluster.id}
                  onClick={() => setSelectedClusterId(cluster.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? "bg-slate-800 border-indigo-500/60 shadow-sm"
                      : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      {cluster.primaryArea}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-bold">
                      {cluster.size} ({cluster.percentageOfTotal}%)
                    </span>
                  </div>

                  {/* Sentiment Bar */}
                  <div className="mt-2 h-1.5 w-full bg-slate-700/40 rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${(cluster.sentimentDistribution.positive / cluster.size) * 100}%`,
                      }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{
                        width: `${(cluster.sentimentDistribution.neutral / cluster.size) * 100}%`,
                      }}
                      className="bg-slate-500 h-full"
                    />
                    <div
                      style={{
                        width: `${(cluster.sentimentDistribution.negative / cluster.size) * 100}%`,
                      }}
                      className="bg-rose-500 h-full"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>Sev:</span>
                      <span className="font-bold text-amber-400">{cluster.avgSeverity}/100</span>
                      {cluster.churnRiskCount > 0 && (
                        <span className="text-rose-400 font-medium ml-1">
                          {cluster.churnRiskCount} churn
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        cluster.trend === "SURGING"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : cluster.trend === "RESOLVING"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-700/40 text-slate-400"
                      }`}
                    >
                      {cluster.trend}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Cluster Details & Verbatim Grounding */}
        <div className="lg:col-span-7 bg-slate-800/30 border border-slate-800 rounded-xl p-4 flex flex-col">
          {activeCluster ? (
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    {activeCluster.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeCluster.size} customer verbatims ({activeCluster.percentageOfTotal}% of total dataset)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-400">
                    Avg Severity: {activeCluster.avgSeverity}/100
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {activeCluster.churnRiskCount} Churn Risk Signals
                  </div>
                </div>
              </div>

              {/* Keywords & Intents */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">
                  Key Terms:
                </span>
                {activeCluster.topKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700"
                  >
                    #{kw}
                  </span>
                ))}
                {activeCluster.topIntents.map((intent, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  >
                    {intent}
                  </span>
                ))}
              </div>

              {/* Verbatim Grounding Citations */}
              <div className="mt-4">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-indigo-400" />
                  Verbatim Customer Citations ({activeCluster.verbatimSamples.length} samples)
                </h5>
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {activeCluster.verbatimSamples.map((v) => (
                    <div
                      key={v.id}
                      className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-3 text-xs"
                    >
                      <p className="text-slate-200 italic font-medium leading-relaxed">
                        "{v.content}"
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{v.customerLabel || "Anonymous Customer"}</span>
                        <div className="flex items-center gap-2">
                          <span>{v.channel}</span>
                          <span className="font-bold text-amber-400">Sev {v.severityScore}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Select a cluster to view detailed evidence citations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
