"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Target,
  Sparkles,
  Layers,
  FileText,
  GitMerge,
  Lightbulb,
  Swords,
  ChevronRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { PriorityMatrix } from "@/components/strategy/PriorityMatrix";
import { ProductGapsView } from "@/components/product/ProductGapsView";
import { ClusterExplorer } from "@/components/feedback/ClusterExplorer";
import { ActionRecommendationCard, AIRecommendationData } from "@/components/recommendations/ActionRecommendationCard";
import { ExecutiveBriefingModal } from "@/components/ai/ExecutiveBriefingModal";
import { CustomReportBuilder } from "@/components/reports/CustomReportBuilder";
import { DuplicateReviewModal } from "@/components/feedback/DuplicateReviewModal";

export default function PMDecisionHubPage() {
  const [activeTab, setActiveTab] = useState<"matrix" | "gaps" | "clusters" | "recommendations">("matrix");
  const [showBriefing, setShowBriefing] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<AIRecommendationData[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const fetchRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await fetch("/api/recommendations");
      if (res.ok) {
        const json = await res.json();
        setRecommendations(json.recommendations || []);
      }
    } catch (e) {
      console.error("Failed to load recommendations:", e);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchRecommendations();
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header & Fast Action Triggers */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <Target className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                PM Decision Intelligence Hub
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                Strategic Cockpit
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Unifies strategic prioritization, market product gap signals, semantic topic clusters, and action recommendations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBriefing(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Executive Briefing
            </button>
            <button
              onClick={() => setShowReportBuilder(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Build Custom Report
            </button>
            <button
              onClick={() => setShowDuplicates(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition flex items-center gap-1.5"
            >
              <GitMerge className="w-3.5 h-3.5 text-slate-400" /> Review Duplicates
            </button>
          </div>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: "matrix", label: "Strategic Priority Matrix", icon: Target },
            { id: "gaps", label: "Product & Competitive Gaps", icon: Swords },
            { id: "clusters", label: "Semantic Feedback Clusters", icon: Layers },
            { id: "recommendations", label: `Action Recommendations (${recommendations.length})`, icon: Lightbulb },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab View Content */}
        <div className="mt-4">
          {activeTab === "matrix" && <PriorityMatrix />}
          {activeTab === "gaps" && <ProductGapsView />}
          {activeTab === "clusters" && <ClusterExplorer />}
          {activeTab === "recommendations" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Grounded Action Recommendations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Synthesized from recurring friction patterns and promoted directly to engineering trackers
                  </p>
                </div>
                <button
                  onClick={fetchRecommendations}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${recLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {recommendations.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Lightbulb className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No active recommendations pending review.
                  </p>
                  <p className="mt-1 text-slate-500">All customer friction areas are currently stable.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <ActionRecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      onUpdateStatus={handleUpdateStatus}
                      onPromoted={fetchRecommendations}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Popups & Modals */}
      <ExecutiveBriefingModal isOpen={showBriefing} onClose={() => setShowBriefing(false)} />
      <CustomReportBuilder isOpen={showReportBuilder} onClose={() => setShowReportBuilder(false)} />
      <DuplicateReviewModal isOpen={showDuplicates} onClose={() => setShowDuplicates(false)} />
    </AppShell>
  );
}
