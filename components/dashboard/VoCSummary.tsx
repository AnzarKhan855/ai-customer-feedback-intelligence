"use client";

import React from "react";
import { AlertCircle, ThumbsUp, AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface VoCProblem {
  name: string;
  count: number;
  sample: string;
}

interface VoCDesire {
  name: string;
  count: number;
  sample: string;
}

interface ChurnSignal {
  id: string;
  customerLabel: string;
  snippet: string;
  severityScore: number;
  featureArea: string;
}

interface VoCSummaryProps {
  data?: {
    topCustomerProblems?: VoCProblem[];
    topCustomerDesires?: VoCDesire[];
    churnSignals?: ChurnSignal[];
  };
}

export default function VoCSummary({ data }: VoCSummaryProps) {
  const problems = data?.topCustomerProblems || [];
  const desires = data?.topCustomerDesires || [];
  const churn = data?.churnSignals || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            Voice-of-Customer (VoC) Intelligence Radar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time clustering of customer pain points, feature demand, and high-risk retention alerts
          </p>
        </div>
        <Link
          href="/inbox"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          View all signals <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Top Customer Problems */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Friction & Problem Areas
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100/60 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                P0/P1 Priority
              </span>
            </div>

            <div className="space-y-2.5">
              {problems.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No active friction clusters detected.</p>
              ) : (
                problems.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {p.name}
                      </span>
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        {p.count} reports
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">
                      "{p.sample}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Top Customer Desires */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
                  <ThumbsUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Feature Desires & Praise
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/60 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                Growth Demand
              </span>
            </div>

            <div className="space-y-2.5">
              {desires.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No feature demand clusters recorded yet.</p>
              ) : (
                desires.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {d.name}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {d.count} requests
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">
                      "{d.sample}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card 3: High-Risk Churn Signals */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Active Churn Risk Signals
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100/60 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                Retention Threat
              </span>
            </div>

            <div className="space-y-2.5">
              {churn.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No churn threats detected.</p>
              ) : (
                churn.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                        {c.customerLabel}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                        Risk {c.severityScore}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">
                      "{c.snippet}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
