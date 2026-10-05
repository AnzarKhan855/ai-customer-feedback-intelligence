"use client";

import { useEffect, useState } from "react";
import { Radio, ChevronRight } from "lucide-react";
import { getSentimentBadgeColor, getChannelBadge, formatTimeAgo } from "@/lib/utils";

interface StreamItem {
  id: string;
  channel: string;
  customerLabel?: string | null;
  content: string;
  sentiment: string;
  emotion?: string | null;
  priority?: string | null;
  createdAt: string;
}

export default function LiveTicker() {
  const [tickerItems, setTickerItems] = useState<StreamItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch("/api/feedback?limit=8&sortBy=newest");
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setTickerItems(data.items);
        }
      } catch (e) {
        console.error("Failed to load live ticker feedback:", e);
      }
    };

    fetchRecent();
    const pollInterval = setInterval(fetchRecent, 30000); // refresh every 30s
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [tickerItems.length]);

  if (tickerItems.length === 0) return null;

  const currentItem = tickerItems[activeIndex] || tickerItems[0];
  const chanBadge = getChannelBadge(currentItem.channel);

  return (
    <div className="bg-slate-900 text-white rounded-xl p-3 border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden">
      {/* Left Badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          Live Customer Signal Stream
        </span>
      </div>

      {/* Middle Animated Text Ticker */}
      <div className="flex-1 overflow-hidden w-full sm:w-auto">
        <div
          key={currentItem.id}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2 text-xs text-slate-200"
        >
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${chanBadge.bg} flex-shrink-0`}>
            {chanBadge.label}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSentimentBadgeColor(currentItem.sentiment)} flex-shrink-0`}>
            {currentItem.sentiment}
          </span>
          {currentItem.priority === "CRITICAL" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase animate-pulse flex-shrink-0">
              CRITICAL
            </span>
          )}
          {currentItem.customerLabel && (
            <span className="font-semibold text-slate-300 flex-shrink-0 hidden md:inline">
              [{currentItem.customerLabel}]:
            </span>
          )}
          <span className="truncate italic font-medium text-slate-100 flex-1">
            "{currentItem.content}"
          </span>
          <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap hidden lg:inline">
            {formatTimeAgo(currentItem.createdAt)}
          </span>
        </div>
      </div>

      {/* Counter */}
      <div className="text-[11px] text-slate-400 flex-shrink-0 flex items-center gap-1 font-mono">
        <span>{activeIndex + 1}</span>
        <span>/</span>
        <span>{tickerItems.length}</span>
      </div>
    </div>
  );
}
