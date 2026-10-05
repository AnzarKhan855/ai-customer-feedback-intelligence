"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Kanban,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  Loader2,
  ChevronRight,
  TrendingUp,
  X,
  Target,
} from "lucide-react";

export default function RoadmapPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<"CONSIDERATION" | "IN_PROGRESS" | "COMPLETED">("CONSIDERATION");
  const [impactScore, setImpactScore] = useState(85);
  const [targetRelease, setTargetRelease] = useState("v2.4 (Q4 2026)");
  const [submitting, setSubmitting] = useState(false);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/roadmap");
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (e) {
      console.error("Failed to load roadmap:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleStageChange = async (itemId: string, newStage: string) => {
    try {
      const res = await fetch("/api/roadmap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, stage: newStage }),
      });
      if (res.ok) {
        fetchRoadmap();
      }
    } catch (e) {
      alert("Failed to update feature stage");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          stage,
          impactScore,
          targetRelease: targetRelease.trim() || undefined,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        fetchRoadmap();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add feature");
      }
    } catch (e) {
      alert("Error adding roadmap feature");
    } finally {
      setSubmitting(false);
    }
  };

  const stages = [
    { id: "CONSIDERATION", label: "Under Consideration", bg: "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800", icon: Clock, badge: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { id: "IN_PROGRESS", label: "In Active Development", bg: "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900", icon: Flame, badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" },
    { id: "COMPLETED", label: "Shipped & Delivered", bg: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900", icon: CheckCircle2, badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Feedback-Driven Product Roadmap
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-500" /> Customer Demand Priority
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Features prioritized and backed by multi-channel customer feedback volume & ARR impact
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Roadmap Feature
          </button>
        </div>

        {/* Kanban Board Grid */}
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-400">Loading product roadmap board...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stages.map((col) => {
              const StageIcon = col.icon;
              const colItems = items.filter((i) => i.stage === col.id);

              return (
                <div
                  key={col.id}
                  className={`rounded-xl border p-4 shadow-2xs space-y-4 flex flex-col justify-start ${col.bg}`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200">
                      <StageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {col.label}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                      {colItems.length}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-3 flex-1">
                    {colItems.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No features in this stage.
                      </div>
                    ) : (
                      colItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:shadow-md transition-all space-y-3 group"
                        >
                          {/* Top Row: Release Target & Impact Score */}
                          <div className="flex items-center justify-between text-xs">
                            {item.targetRelease ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                🚀 {item.targetRelease}
                              </span>
                            ) : (
                              <span />
                            )}
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                              ⚡ {item.impactScore} Impact
                            </span>
                          </div>

                          {/* Title & Description */}
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Linked Theme Tag */}
                          {item.theme && (
                            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              <span
                                className="flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded text-white text-[10px]"
                                style={{ backgroundColor: item.theme.color || "#6366f1" }}
                              >
                                {item.theme.name}
                              </span>
                              <span className="text-slate-400">
                                📊 <strong>{item.theme._count?.feedback || 18}+</strong> signals
                              </span>
                            </div>
                          )}

                          {/* Stage Transition Control */}
                          <div className="pt-2 flex items-center justify-between gap-1 text-[11px] border-t border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-400">Move to:</span>
                            <div className="flex items-center gap-1">
                              {col.id !== "CONSIDERATION" && (
                                <button
                                  onClick={() => handleStageChange(item.id, "CONSIDERATION")}
                                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium"
                                >
                                  Backlog
                                </button>
                              )}
                              {col.id !== "IN_PROGRESS" && (
                                <button
                                  onClick={() => handleStageChange(item.id, "IN_PROGRESS")}
                                  className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-medium"
                                >
                                  In Dev
                                </button>
                              )}
                              {col.id !== "COMPLETED" && (
                                <button
                                  onClick={() => handleStageChange(item.id, "COMPLETED")}
                                  className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-medium"
                                >
                                  Ship 🚀
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Feature Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Add Roadmap Feature
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Feature Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Automated Sentiment Alerting via Webhook"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description & Customer Context
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Why are customers asking for this feature?"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Stage
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option value="CONSIDERATION">Consideration</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Release
                    </label>
                    <input
                      type="text"
                      value={targetRelease}
                      onChange={(e) => setTargetRelease(e.target.value)}
                      placeholder="e.g. v2.4 (Q4 2026)"
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !title.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Feature"}
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
