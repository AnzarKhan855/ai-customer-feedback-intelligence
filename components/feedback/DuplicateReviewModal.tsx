"use client";

import React, { useState, useEffect } from "react";
import {
  Copy,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  GitMerge,
  Filter,
} from "lucide-react";
import { DeduplicationResult, DuplicateGroup } from "@/lib/deduplication";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DuplicateReviewModal({ isOpen, onClose }: Props) {
  const [data, setData] = useState<DeduplicationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);

  const fetchDuplicates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback/duplicates");
      if (!res.ok) throw new Error("Failed to load deduplication analysis");
      const json = await res.json();
      setData(json);
      if (json.groups && json.groups.length > 0) {
        setSelectedGroup(json.groups[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load duplicates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDuplicates();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Intelligent Feedback Deduplication</h3>
              <p className="text-xs text-slate-400">
                Identify near-duplicate tickets and customer complaints to reduce triage fatigue
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDuplicates}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">Scanning feedback dataset for near-duplicate verbatims...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Duplicate Records</span>
                  <div className="text-xl font-bold text-amber-400 mt-0.5">{data.totalDuplicatesDetected}</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Incident Clusters</span>
                  <div className="text-xl font-bold text-indigo-300 mt-0.5">{data.totalUniqueClusters}</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Triage Noise Reduction</span>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">{data.potentialNoiseReductionPercentage}%</div>
                </div>
              </div>

              {data.groups.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 bg-slate-800/20 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-300">Clean Dataset — Zero Redundant Duplicates</p>
                  <p className="mt-1 text-[11px] text-slate-500">Every customer feedback record in this workspace represents a distinct signal.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Groups Sidebar */}
                  <div className="md:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {data.groups.map((group) => {
                      const isSelected = selectedGroup?.groupId === group.groupId;
                      return (
                        <div
                          key={group.groupId}
                          onClick={() => setSelectedGroup(group)}
                          className={`p-3 rounded-lg border cursor-pointer transition text-xs ${
                            isSelected
                              ? "bg-slate-800 border-indigo-500/60 shadow-sm"
                              : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-slate-200">
                              {group.duplicateCount + 1} Similar Tickets
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                              {Math.round(group.averageSimilarity * 100)}% match
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                            "{group.primaryItem.content}"
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Group Inspection */}
                  <div className="md:col-span-7 bg-slate-800/30 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    {selectedGroup ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                            <span className="font-semibold text-white">Cluster Inspection</span>
                            <span>{selectedGroup.channels.join(", ")}</span>
                          </div>
                          <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                            {selectedGroup.recommendation}
                          </p>
                        </div>

                        {/* Primary Record */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                            Primary Incident (Anchor)
                          </span>
                          <div className="mt-1 p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 text-xs">
                            <p className="text-slate-200 italic font-medium leading-relaxed">
                              "{selectedGroup.primaryItem.content}"
                            </p>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                              <span>{selectedGroup.primaryItem.customerLabel || "Anonymous"}</span>
                              <span>{selectedGroup.primaryItem.channel}</span>
                            </div>
                          </div>
                        </div>

                        {/* Duplicates */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                            Correlated Near-Duplicates ({selectedGroup.duplicates.length})
                          </span>
                          <div className="mt-1 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {selectedGroup.duplicates.map((dup) => (
                              <div
                                key={dup.id}
                                className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800 text-xs"
                              >
                                <p className="text-slate-300 italic">"{dup.content}"</p>
                                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                                  <span>{dup.customerLabel || "Anonymous"} • {dup.channel}</span>
                                  <span className="font-bold text-indigo-400">
                                    {Math.round(dup.similarity * 100)}% similarity
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-500">
                        Select a duplicate cluster to inspect candidates.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
