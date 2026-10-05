"use client";

import React, { useState, useEffect } from "react";
import { Layers, Lightbulb, Heart, ShieldAlert, Swords, RefreshCw, ChevronRight, FileText } from "lucide-react";
import { ProductGapIntelligenceResult, ProductGapItem, CompetitorMention } from "@/lib/product-gaps";

export function ProductGapsView() {
  const [data, setData] = useState<ProductGapIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "gaps" | "requests" | "desires" | "pains" | "competitive"
  >("gaps");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/product/gaps");
      if (!res.ok) throw new Error("Failed to load product gap intelligence");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load product gaps");
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
        <div className="h-6 w-48 bg-slate-800 rounded mb-4" />
        <div className="h-32 bg-slate-800/40 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Product Gap Intelligence</h3>
          <button onClick={fetchData} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
        <p className="text-xs text-rose-400 mt-2">{error || "Unable to load product gaps."}</p>
      </div>
    );
  }

  const renderItemList = (items: ProductGapItem[]) => {
    if (items.length === 0) {
      return (
        <div className="py-12 text-center text-xs text-slate-500">
          No feedback signals found in this category.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                {item.featureArea}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">{item.channel}</span>
                <span className="text-[11px] font-bold text-amber-400">{item.severityScore}/100</span>
              </div>
            </div>
            <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
              "{item.verbatim}"
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>{item.customerLabel || "Anonymous Customer"}</span>
              <span className="text-[10px] text-slate-600">ID: {item.feedbackId.slice(0, 10)}...</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">Competitive & Product Gap Intelligence</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Product Opportunity Mining
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Extracts missing capabilities, wishlist desires, and competitor benchmark signals directly from customer verbatims
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

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
        <div
          onClick={() => setActiveTab("gaps")}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            activeTab === "gaps"
              ? "bg-slate-800 border-indigo-500/50"
              : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <Layers className="w-3 h-3 text-rose-400" /> Gaps
          </span>
          <p className="text-lg font-bold text-white mt-0.5">{data.metrics.totalProductGaps}</p>
        </div>

        <div
          onClick={() => setActiveTab("requests")}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            activeTab === "requests"
              ? "bg-slate-800 border-indigo-500/50"
              : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Requests
          </span>
          <p className="text-lg font-bold text-white mt-0.5">{data.metrics.totalFeatureRequests}</p>
        </div>

        <div
          onClick={() => setActiveTab("desires")}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            activeTab === "desires"
              ? "bg-slate-800 border-indigo-500/50"
              : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <Heart className="w-3 h-3 text-emerald-400" /> Desires
          </span>
          <p className="text-lg font-bold text-white mt-0.5">{data.metrics.totalDesires}</p>
        </div>

        <div
          onClick={() => setActiveTab("pains")}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            activeTab === "pains"
              ? "bg-slate-800 border-indigo-500/50"
              : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> Pains
          </span>
          <p className="text-lg font-bold text-white mt-0.5">{data.metrics.totalPainPoints}</p>
        </div>

        <div
          onClick={() => setActiveTab("competitive")}
          className={`p-3 rounded-lg border cursor-pointer transition ${
            activeTab === "competitive"
              ? "bg-slate-800 border-indigo-500/50"
              : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <Swords className="w-3 h-3 text-indigo-400" /> Competitors
          </span>
          <p className="text-lg font-bold text-white mt-0.5">{data.metrics.totalCompetitorMentions}</p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "gaps" && renderItemList(data.productGaps)}
        {activeTab === "requests" && renderItemList(data.featureRequests)}
        {activeTab === "desires" && renderItemList(data.customerDesires)}
        {activeTab === "pains" && renderItemList(data.painPoints)}

        {activeTab === "competitive" && (
          <div>
            <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 mb-4 flex items-center justify-between">
              <span>{data.competitorSummary}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 font-bold">
                {data.competitiveSignals.length} mentions
              </span>
            </div>

            {data.competitiveSignals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-800/20 rounded-xl border border-slate-800">
                <Swords className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-400">No competitor evidence available.</p>
                <p className="mt-1 text-[11px]">Customers have not cited external market alternatives in recent feedback.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.competitiveSignals.map((comp, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                        {comp.competitorName}
                      </span>
                      <span className="text-[11px] text-slate-400">{comp.context}</span>
                    </div>
                    <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                      "{comp.verbatim}"
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{comp.customerLabel || "Anonymous Customer"}</span>
                      <span>{comp.channel}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
