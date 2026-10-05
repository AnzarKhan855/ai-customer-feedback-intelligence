"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";
import CreateActionModal from "@/components/feedback/CreateActionModal";
import FeedbackDetailModal from "@/components/feedback/FeedbackDetailModal";
import {
  Search,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  Clock,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Download,
  ExternalLink,
  Layers,
  Flame,
  ShieldAlert,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import {
  CHANNELS,
  STATUSES,
  SENTIMENTS,
  EMOTIONS,
  INTENTS,
  PRIORITIES,
  FeedbackStatus,
  PriorityLevel,
} from "@/lib/types";
import { formatTimeAgo, formatDate, getSentimentBadgeColor, getChannelBadge } from "@/lib/utils";

export default function InboxPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actionItemTarget, setActionItemTarget] = useState<any | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [emotion, setEmotion] = useState("");
  const [intent, setIntent] = useState("");
  const [priority, setPriority] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [theme, setTheme] = useState("");
  const [churnOnly, setChurnOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [themesList, setThemesList] = useState<string[]>([]);
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);

  const userRole = (session?.user as any)?.role || "VIEWER";
  const isAdmin = userRole === "ADMIN";

  const fetchThemes = async () => {
    try {
      const res = await fetch("/api/themes");
      const data = await res.json();
      if (data.themes) {
        setThemesList(data.themes.map((t: any) => t.name));
      }
    } catch {}
  };

  const fetchFeedback = async (pageToFetch = pagination.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pageToFetch.toString());
      params.set("limit", pagination.limit.toString());
      if (search) params.set("search", search);
      if (channel) params.set("channel", channel);
      if (sentiment) params.set("sentiment", sentiment);
      if (emotion) params.set("emotion", emotion);
      if (intent) params.set("intent", intent);
      if (priority) params.set("priority", priority);
      if (statusFilter) params.set("status", statusFilter);
      if (theme) params.set("theme", theme);
      if (churnOnly) params.set("churnOnly", "true");
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      const data = await res.json();

      if (data.items) {
        setItems(data.items);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Failed to fetch feedback items:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeedback(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, channel, sentiment, emotion, intent, priority, statusFilter, theme, churnOnly, sortBy]);

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (channel) params.set("channel", channel);
    if (sentiment) params.set("sentiment", sentiment);
    if (statusFilter) params.set("status", statusFilter);
    window.open(`/api/feedback/export?${params.toString()}`, "_blank");
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (newStatus: FeedbackStatus) => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status: newStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (selectedIds.includes(i.id) ? { ...i, status: newStatus } : i))
        );
        setSelectedIds([]);
      }
    } catch (e) {
      console.error("Bulk update failed:", e);
    } finally {
      setBulkUpdating(false);
    }
  };

  const updateStatus = async (id: string, newStatus: FeedbackStatus) => {
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
        );
        if (selectedItem?.id === id) {
          setSelectedItem((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  const handleReclassify = async (id: string) => {
    setReclassifyingId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reclassify: true }),
      });
      const data = await res.json();
      if (res.ok && data.feedback) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...data.feedback } : i))
        );
        if (selectedItem?.id === id) {
          setSelectedItem({ ...selectedItem, ...data.feedback });
        }
      }
    } catch (e) {
      alert("Failed to re-classify feedback with AI");
    } finally {
      setReclassifyingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback item?")) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
      }
    } catch (e) {
      alert("Failed to delete feedback item");
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200 font-semibold";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Feedback Intelligence Explorer
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {pagination.totalCount} Signals
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Deep triage, aspect-based sentiment, emotion classification, and engineering issue conversion
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Filtered CSV
            </button>
            <button
              onClick={() => fetchFeedback(pagination.page)}
              disabled={loading}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-2xs transition-colors"
              title="Refresh Signals"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search & Multi-Faceted Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
          {/* Search Input Row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search feedback text, accounts, feature areas, entities, or ticket IDs..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium whitespace-nowrap">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="severity">Highest Severity (0-100)</option>
                <option value="confidence">Highest AI Confidence</option>
              </select>
            </div>
          </div>

          {/* Facets Filters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Channel */}
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Channels</option>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Sentiment */}
            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Sentiments</option>
              {SENTIMENTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Emotion */}
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Emotions</option>
              {EMOTIONS.map((em) => (
                <option key={em.value} value={em.value}>{em.label}</option>
              ))}
            </select>

            {/* Intent */}
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Intents</option>
              {INTENTS.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>

            {/* Severity / Priority */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <button
              onClick={() => setChurnOnly(!churnOnly)}
              className={`px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1.5 transition-colors ${
                churnOnly
                  ? "bg-rose-600 text-white border-rose-700 shadow-2xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Churn Risk Signals Only
            </button>

            {theme && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                Theme: {theme}
                <button onClick={() => setTheme("")} className="hover:text-indigo-900 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(search || channel || sentiment || emotion || intent || priority || statusFilter || theme || churnOnly) && (
              <button
                onClick={() => {
                  setSearch("");
                  setChannel("");
                  setSentiment("");
                  setEmotion("");
                  setIntent("");
                  setPriority("");
                  setStatusFilter("");
                  setTheme("");
                  setChurnOnly(false);
                }}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-auto"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Bulk Triage Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>{selectedIds.length} signal{selectedIds.length > 1 ? "s" : ""} selected for bulk triage</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusUpdate("REVIEWED")}
                disabled={bulkUpdating}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
              >
                Mark Reviewed
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("ACTIONED")}
                disabled={bulkUpdating}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Mark Actioned
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("NEW")}
                disabled={bulkUpdating}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
              >
                Reset to New
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-2"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Feedback Items Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Filtering customer signals...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No feedback items match your filters</p>
              <p className="text-xs text-slate-500">Try adjusting your search query, emotion, or channel criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === items.length && items.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Select all on this page"
                      />
                    </th>
                    <th className="py-3 px-4">Feedback Content & Customer</th>
                    <th className="py-3 px-3">Channel</th>
                    <th className="py-3 px-3">Sentiment & Score</th>
                    <th className="py-3 px-3">Emotion & Intent</th>
                    <th className="py-3 px-3">Severity & Priority</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                  {items.map((item) => {
                    const chan = getChannelBadge(item.channel);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          selectedItem?.id === item.id ? "bg-indigo-50/40 dark:bg-indigo-950/30" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 w-8" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelectOne(item.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        {/* Content & Customer */}
                        <td className="py-3.5 px-4 max-w-md">
                          <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
                            "{item.content}"
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            {item.customerLabel && (
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {item.customerLabel}
                              </span>
                            )}
                            {item.customerLabel && <span>•</span>}
                            <span>{formatTimeAgo(item.createdAt)}</span>
                            {item.churnRiskSignal && (
                              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                                • <ShieldAlert className="w-3 h-3" /> Churn Risk
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Channel */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${chan.bg}`}>
                            {chan.label}
                          </span>
                        </td>

                        {/* Sentiment */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${getSentimentBadgeColor(item.sentiment)}`}>
                              {item.sentiment}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore}
                            </span>
                          </div>
                        </td>

                        {/* Emotion & Intent */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="space-y-1">
                            {item.emotion && (
                              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                                {item.emotion}
                              </span>
                            )}
                            {item.intent && (
                              <div className="text-[10px] text-slate-500 capitalize">
                                {item.intent.replace("_", " ")}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Severity & Priority */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(item.priority)}`}>
                              {item.priority || "LOW"}
                            </span>
                            <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">
                              {item.severityScore ?? 25}/100
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={item.status}
                            onChange={(e) => updateStatus(item.id, e.target.value as FeedbackStatus)}
                            className="px-2 py-1 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
                          >
                            <option value="NEW">New</option>
                            <option value="REVIEWED">Reviewed</option>
                            <option value="ACTIONED">Actioned</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActionItemTarget(item)}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-colors"
                              title="Convert to Linear/Jira ticket"
                            >
                              + Ticket
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Delete feedback"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> (
              <strong>{pagination.totalCount}</strong> total items)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchFeedback(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchFeedback(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Feedback Inspection Slide-out Drawer */}
        <FeedbackDetailModal
          feedback={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStatusChange={updateStatus}
          onReclassify={handleReclassify}
          isReclassifying={reclassifyingId === selectedItem?.id}
          onConvertToTicket={(fb) => setActionItemTarget(fb)}
        />

        {/* Create Linear/Jira Action Item Modal */}
        {actionItemTarget && (
          <CreateActionModal
            isOpen={!!actionItemTarget}
            onClose={() => setActionItemTarget(null)}
            feedback={actionItemTarget}
            onSuccess={() => {
              setActionItemTarget(null);
              fetchFeedback();
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
