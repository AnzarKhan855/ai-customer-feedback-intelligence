"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Inbox,
  Sparkles,
  TrendingUp,
  Kanban,
  Bell,
  FileText,
  Database,
  Settings,
  ArrowRight,
  X,
  Command,
  Flame,
  CheckCircle2,
} from "lucide-react";

interface SearchResults {
  feedback: Array<{ id: string; content: string; channel: string; sentiment: string }>;
  actionItems: Array<{ id: string; title: string; externalKey: string; status: string }>;
  recommendations: Array<{ id: string; problem: string; recommendedAction: string }>;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=5`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.results);
        }
      } catch (err) {
        console.error("Command palette search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Feedback Inbox", href: "/inbox", icon: Inbox },
    { label: "AI Analyst & RAG", href: "/ask", icon: Sparkles },
    { label: "Emerging Trends", href: "/trends", icon: TrendingUp },
    { label: "Roadmap & Action Items", href: "/roadmap", icon: Kanban },
    { label: "Anomaly Alerts", href: "/alerts", icon: Bell },
    { label: "Executive Reports", href: "/reports", icon: FileText },
    { label: "Datasets & Operations", href: "/datasets", icon: Database },
    { label: "Workspace Settings", href: "/settings", icon: Settings },
  ];

  const navigateTo = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search feedback, actions, topics... (ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono">
            ESC
          </span>
        </div>

        {/* Content Feed */}
        <div className="max-h-[460px] overflow-y-auto p-3 space-y-4 text-xs">
          {/* Direct Navigation */}
          {filteredNavItems.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 px-2 tracking-wider">
                Platform Navigation
              </span>
              <div className="mt-1 space-y-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.href}
                      onClick={() => navigateTo(item.href)}
                      className="p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition text-slate-200 hover:text-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-indigo-400" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        Go <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Results */}
          {results && (
            <>
              {results.feedback.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 px-2 tracking-wider">
                    Feedback Records ({results.feedback.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.feedback.map((fb) => (
                      <div
                        key={fb.id}
                        onClick={() => navigateTo("/inbox")}
                        className="p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer transition text-slate-300 hover:text-white"
                      >
                        <p className="line-clamp-1 italic">"{fb.content}"</p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{fb.channel}</span>
                          <span
                            className={
                              fb.sentiment === "POS"
                                ? "text-emerald-400"
                                : fb.sentiment === "NEG"
                                ? "text-rose-400"
                                : "text-slate-400"
                            }
                          >
                            {fb.sentiment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.actionItems.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 px-2 tracking-wider">
                    Action Tickets ({results.actionItems.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {results.actionItems.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => navigateTo("/roadmap")}
                        className="p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition text-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-400 font-bold">{act.externalKey}</span>
                          <span className="line-clamp-1">{act.title}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {act.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {query.trim().length >= 2 && !loading && results && results.feedback.length === 0 && results.actionItems.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              No matching feedback or action items found for "{query}".
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">↵</kbd> Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">esc</kbd> Close
            </span>
          </div>
          <span className="text-[10px] text-slate-600">LOOP 2.0 Command Palette</span>
        </div>
      </div>
    </div>
  );
}
