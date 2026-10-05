"use client";

import { Sparkles, AlertTriangle, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface AIInsight {
  id: string;
  title: string;
  metric: string;
  evidence: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  trend: string;
  action: string;
}

interface Props {
  insights?: AIInsight[];
}

export default function AIExecutiveInsights({ insights = [] }: Props) {
  if (!insights || insights.length === 0) return null;

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/10 via-slate-900/5 to-white dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl p-6 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              AI Executive Insights
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Autonomous Synthesis
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Answers: "What changed? Why did it change? What requires immediate leadership attention?"
          </p>
        </div>

        <Link
          href="/ask"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
        >
          Ask AI Analyst <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className={`px-2 py-0.2 rounded-full font-bold border uppercase text-[10px] ${getSeverityBadge(item.severity)}`}>
                  {item.severity}
                </span>
                <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px] font-semibold">
                  {item.trend}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {item.title}
              </h4>
              <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {item.metric}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                {item.evidence}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Recommended Action:
              </div>
              <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                {item.action}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
