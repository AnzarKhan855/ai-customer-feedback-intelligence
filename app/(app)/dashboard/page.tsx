"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import LiveTicker from "@/components/dashboard/LiveTicker";
import NpsGauge from "@/components/dashboard/NpsGauge";
import WordCloud from "@/components/dashboard/WordCloud";
import AccountRiskMatrix from "@/components/dashboard/AccountRiskMatrix";
import AIExecutiveInsights from "@/components/dashboard/AIExecutiveInsights";
import EmotionBreakdown from "@/components/dashboard/EmotionBreakdown";
import SeverityBreakdown from "@/components/dashboard/SeverityBreakdown";
import VoCSummary from "@/components/dashboard/VoCSummary";
import { CustomerHealthCard } from "@/components/health/CustomerHealthCard";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  AlertTriangle,
  Smile,
  Clock,
  Sparkles,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Flame,
  Award,
} from "lucide-react";

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/stats?days=${days}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load dashboard data");
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [days]);

  const posPct = data?.metrics?.percentPositive || 0;
  const negPct = data?.metrics?.percentNegative || 0;
  const neuPct = data?.metrics?.percentNeutral || 0;
  const netScore = data?.metrics?.netSentimentScore || 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Executive Feedback Intelligence
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Live Enterprise Feed
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Autonomous customer signal intelligence, aspect-based sentiment, and predictive retention analytics
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeframe selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex items-center shadow-2xs">
              {[
                { label: "7 Days", value: 7 },
                { label: "30 Days", value: 30 },
                { label: "90 Days", value: 90 },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setDays(t.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    days === t.value
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shadow-2xs transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Real-Time Live Signal Ticker Bar */}
        <LiveTicker />

        {/* Loading / Error States */}
        {loading && !data ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Aggregating and synthesizing customer signals...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Failed to load analytics
            </div>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : (
          <>
            {/* AI Executive Insights Cards */}
            <AIExecutiveInsights insights={data?.aiInsights} />

            {/* Core Executive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Signals */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:-translate-y-0.5 transition-all">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Signals
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-baseline gap-2">
                    {data?.metrics?.totalFeedback || 0}
                    {data?.metrics?.feedbackGrowthPct !== undefined && (
                      <span className={`text-xs font-semibold flex items-center gap-0.5 ${data.metrics.feedbackGrowthPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                        {data.metrics.feedbackGrowthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {data.metrics.feedbackGrowthPct > 0 ? `+${data.metrics.feedbackGrowthPct}%` : `${data.metrics.feedbackGrowthPct}%`}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Last {days} days (+{data?.metrics?.newThisWeek || 0} this week)
                  </div>
                </div>
                <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>

              {/* Net Sentiment Score */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:-translate-y-0.5 transition-all">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Net Sentiment (NPS)
                  </div>
                  <div className="text-2xl font-bold mt-1 flex items-baseline gap-2">
                    <span className={netScore >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                      {netScore > 0 ? `+${netScore}` : netScore}
                    </span>
                    {data?.metrics?.sentimentDeltaPct !== undefined && (
                      <span className={`text-xs font-semibold flex items-center gap-0.5 ${data.metrics.sentimentDeltaPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                        {data.metrics.sentimentDeltaPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {data.metrics.sentimentDeltaPct > 0 ? `+${data.metrics.sentimentDeltaPct} pts` : `${data.metrics.sentimentDeltaPct} pts`}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {posPct}% Pos vs {negPct}% Neg
                  </div>
                </div>
                <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Smile className="w-5 h-5" />
                </div>
              </div>

              {/* Critical Urgency Issues */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:-translate-y-0.5 transition-all">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Critical Severity Issues
                  </div>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                    {data?.metrics?.criticalIssuesCount || 0}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Requires immediate engineering SLA
                  </div>
                </div>
                <div className="w-11 h-11 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
              </div>

              {/* AI Opportunity Score */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:-translate-y-0.5 transition-all">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    AI Opportunity Score
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {data?.metrics?.aiOpportunityScore || 85} / 100
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-indigo-500" />
                    Overall Customer Health Index
                  </div>
                </div>
                <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Voice-of-Customer Intelligence Radar */}
            <VoCSummary data={data?.vocBreakdown} />

            {/* Customer Health Intelligence */}
            <CustomerHealthCard />

            {/* Visualizations Grid 1: Volume Over Time & Sentiment Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Volume Trends over Time (Area Chart) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Feedback Volume & Sentiment Momentum
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Daily incoming customer signals grouped by sentiment polarity
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Positive
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Negative
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.volumeOverTime || []}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", border: "1px solid #334155", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Ingested" />
                      <Area type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={1.5} fillOpacity={0} name="Positive" />
                      <Area type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} name="Negative" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Sentiment Distribution (Donut Chart) */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Sentiment Distribution
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Proportion of customer feedback sentiment
                  </p>
                </div>

                <div className="h-60 w-full my-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.sentimentBreakdown || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data?.sentimentBreakdown?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", border: "1px solid #334155", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  {data?.sentimentBreakdown?.map((s: any) => (
                    <div key={s.name} className="p-1.5 rounded bg-slate-50 dark:bg-slate-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{s.name}</div>
                      <div className="text-sm font-bold" style={{ color: s.color }}>
                        {s.percent}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visualizations Grid 2: Net Sentiment Gauge & Real Keyword Cloud */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <NpsGauge
                  score={netScore}
                  positivePct={posPct}
                  negativePct={negPct}
                  neutralPct={neuPct}
                />
              </div>
              <div className="lg:col-span-2">
                <WordCloud tags={data?.keywordCloud || []} />
              </div>
            </div>

            {/* Visualizations Grid 3: Emotion Spectrum & Severity Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmotionBreakdown data={data?.emotionDistribution || []} />
              <SeverityBreakdown data={data?.severityDistribution || []} />
            </div>

            {/* Enterprise Account Churn Risk Matrix */}
            <AccountRiskMatrix />
          </>
        )}
      </div>
    </AppShell>
  );
}
