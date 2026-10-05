"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import CSVUploadModal from "@/components/feedback/CSVUploadModal";
import {
  Database,
  Upload,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<any | null>(null);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/datasets");
      const data = await res.json();
      if (data.datasets) {
        setDatasets(data.datasets);
      }
    } catch (e) {
      console.error("Failed to load datasets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete dataset '${name}' and its associated feedback items?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/datasets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDatasets((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert("Failed to delete dataset");
      }
    } catch (e) {
      alert("An error occurred during dataset deletion");
    }
  };

  const getQualityBadge = (score: number) => {
    if (score >= 90) return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    if (score >= 70) return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Dataset Management & Data Quality
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {datasets.length} Ingestion Batches
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage uploaded feedback corpora, inspect schema mappings, and monitor empirical Data Quality Scores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload New Dataset
            </button>
            <button
              onClick={fetchDatasets}
              disabled={loading}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-2xs transition-colors"
              title="Refresh Datasets"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading datasets...</span>
            </div>
          ) : datasets.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <Database className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No datasets found in workspace</p>
              <p className="text-xs text-slate-500">Upload a CSV or JSON file to start data intelligence processing</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Feedback File
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Dataset Name & File</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Records Ingested</th>
                    <th className="py-3 px-3">Data Quality Score</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Upload Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                  {datasets.map((ds) => (
                    <tr key={ds.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{ds.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ds.fileName}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {ds.fileType}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {ds.validCount} / {ds.recordCount} rows
                        </div>
                        {ds.errorCount > 0 && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                            {ds.errorCount} invalid rows
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getQualityBadge(ds.qualityScore)}`}>
                            {ds.qualityScore}% Quality
                          </span>
                          {ds.qualityMetrics && (
                            <button
                              onClick={() => setSelectedMetrics(ds.qualityMetrics)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                            >
                              Inspect
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ds.status === "READY"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {ds.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(ds.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/inbox?datasetId=${ds.id}`}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors inline-flex items-center gap-1"
                          >
                            Explore Signals <ExternalLink className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleDelete(ds.id, ds.name)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete dataset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quality Metrics Modal */}
        {selectedMetrics && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Data Quality Metrics Breakdown
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedMetrics(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Overall Quality Score</span>
                  <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                    {selectedMetrics.overallQualityScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Completeness Rate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedMetrics.completenessPct}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Duplicate Rate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedMetrics.duplicateRatePct}% ({selectedMetrics.duplicateRecords} rows)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Invalid / Malformed Rows</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {selectedMetrics.invalidRecords} rows
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedMetrics(null)}
                className="w-full py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        <CSVUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchDatasets();
          }}
        />
      </div>
    </AppShell>
  );
}
