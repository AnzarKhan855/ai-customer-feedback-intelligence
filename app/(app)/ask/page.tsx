"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Sparkles,
  Send,
  Loader2,
  FileCheck,
  Bot,
  User,
  ShieldCheck,
  HelpCircle,
  BarChart3,
  Flame,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { getSentimentBadgeColor, getChannelBadge, formatTimeAgo } from "@/lib/utils";
import { RootCauseExplorer } from "@/components/ai/RootCauseExplorer";

const SAMPLE_QUESTIONS = [
  "What are the biggest customer complaints and friction points?",
  "Why did customer sentiment decline this month?",
  "What are users saying about our onboarding experience?",
  "What are the main causes of customer frustration with billing?",
  "How do customers perceive our dashboard performance and speed?",
  "What integrations or SSO features are enterprise prospects asking for?",
  "Show me the top emerging customer problems with highest severity.",
  "Summarize customer feedback for executives and recommend actions.",
];

export default function AskLoopPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    {
      id: string;
      role: "user" | "assistant";
      text: string;
      citedFeedback?: any[];
      metricsSummary?: any;
      confidence?: number;
    }[]
  >([
    {
      id: "welcome",
      role: "assistant",
      text: `### Welcome to Ask LOOP — Your Autonomous AI Feedback Analyst

I am grounded directly in your tenant's active feedback database. You can ask me plain-English analytical questions about customer trends, emerging complaints, root causes, and strategic recommendations.

**Key Analytical Guarantees:**
- 🛡️ **Grounded Retrieval:** Every claim cites verified customer feedback records.
- 📊 **Empirical Metrics:** Quantitative stats are pre-computed directly from actual database records.
- 🎯 **Actionable Insights:** Concrete recommendations tailored for product and engineering leadership.`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [filterSentiment, setFilterSentiment] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [minSeverity, setMinSeverity] = useState(0);
  const [activeTab, setActiveTab] = useState<"qa" | "rootcause">("qa");

  const handleAsk = async (queryToAsk = question) => {
    if (!queryToAsk.trim() || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg = { id: userMessageId, role: "user" as const, text: queryToAsk.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const payload: any = { question: queryToAsk.trim(), limit: 6 };
      if (filterSentiment) payload.filterSentiment = filterSentiment;
      if (filterChannel) payload.filterChannel = filterChannel;
      if (minSeverity > 0) payload.minSeverity = minSeverity;

      const res = await fetch("/api/insights/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get AI answer");

      const botMsg = {
        id: `assistant-${Date.now()}`,
        role: "assistant" as const,
        text: data.answer,
        citedFeedback: data.citedFeedback,
        metricsSummary: data.metricsSummary,
        confidence: data.confidence || 0.95,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant" as const,
          text: `⚠️ **Error:** ${err.message || "Failed to retrieve feedback insights."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                AI Customer Feedback Analyst
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" /> Retrieval Grounded (RAG)
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Ask natural-language questions and receive evidence-backed synthesis with citations and metrics
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab("qa")}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "qa"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Grounded Q&A Analyst
          </button>
          <button
            onClick={() => setActiveTab("rootcause")}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === "rootcause"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Issue Root-Cause Explorer
          </button>
        </div>

        {activeTab === "rootcause" ? (
          <RootCauseExplorer />
        ) : (
          <>
            {/* Suggested Queries Chips */}
            <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Suggested Inquiries
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(q)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 transition-all text-left shadow-2xs"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Chat Stream */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col min-h-[520px]">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-3 ${msg.role === "user" ? "text-right" : ""}`}>
                  {/* Pre-Computed Metrics Card if present */}
                  {msg.metricsSummary && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                          <BarChart3 className="w-4 h-4" /> Empirical Dataset Metrics:
                        </span>
                        <span className="text-[11px] text-slate-400">
                          AI Confidence: {Math.round((msg.confidence || 0.95) * 100)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] text-slate-400">Evaluated</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {msg.metricsSummary.totalEvaluated} signals
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] text-slate-400">Positive</div>
                          <div className="font-bold text-emerald-600">
                            {msg.metricsSummary.positiveCount}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] text-slate-400">Negative</div>
                          <div className="font-bold text-rose-600">
                            {msg.metricsSummary.negativeCount}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] text-slate-400">Avg Severity</div>
                          <div className="font-bold text-indigo-600">
                            {msg.metricsSummary.avgSeverity} / 100
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main Response Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-xs inline-block text-left"
                        : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-xs text-left"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>

                  {/* Grounded Customer Evidence Cards */}
                  {msg.citedFeedback && msg.citedFeedback.length > 0 && (
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2.5 text-left">
                      <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Grounded Evidence ({msg.citedFeedback.length} Verified Sources Cited):
                        </span>
                        <span className="text-[10px] font-mono text-indigo-500">
                          Cosine Vector Ranked
                        </span>
                      </div>

                      <div className="space-y-2">
                        {msg.citedFeedback.map((cf: any) => {
                          const chan = getChannelBadge(cf.channel);
                          return (
                            <div
                              key={cf.id}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.2 rounded font-semibold border ${chan.bg}`}>
                                    {chan.label}
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded font-semibold border uppercase ${getSentimentBadgeColor(cf.sentiment)}`}>
                                    {cf.sentiment}
                                  </span>
                                  {cf.customerLabel && (
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                      {cf.customerLabel}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">
                                  ID: {cf.id.slice(0, 8)}
                                </span>
                              </div>

                              <p className="font-medium text-slate-800 dark:text-slate-200 italic">
                                "{cf.content}"
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Searching vector index, computing empirical metrics, and synthesizing grounded response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box & Filter Toolbar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {/* Grounding Filters Toolbar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400">RAG Grounding Filters:</span>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="">All Channels</option>
                <option value="SUPPORT_TICKET">Support Tickets</option>
                <option value="APP_STORE">App Store</option>
                <option value="NPS_SURVEY">NPS Surveys</option>
                <option value="SALES_CALL">Sales Calls</option>
                <option value="COMMUNITY">Community</option>
              </select>

              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="">All Sentiments</option>
                <option value="POS">Positive Only</option>
                <option value="NEU">Neutral Only</option>
                <option value="NEG">Negative Only</option>
              </select>

              <select
                value={minSeverity}
                onChange={(e) => setMinSeverity(parseInt(e.target.value) || 0)}
                className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value={0}>All Severities (0-100)</option>
                <option value={50}>High Severity (50+)</option>
                <option value={75}>Critical Severity (75+)</option>
              </select>

              {(filterChannel || filterSentiment || minSeverity > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterChannel("");
                    setFilterSentiment("");
                    setMinSeverity(0);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-auto"
                >
                  Reset filters
                </button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about customer requests, bug reports, sentiment..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                Ask Analyst
              </button>
            </form>
          </div>
        </div>
        </>
        )}
      </div>
    </AppShell>
  );
}
