"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";
import { ActivityCenterResult, ActivityNotificationItem, ActivityType } from "@/lib/activity";

export function ActivityNotificationCenter() {
  const [data, setData] = useState<ActivityCenterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | ActivityType>("ALL");
  const [readOverride, setReadOverride] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch activities:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = readOverride ? 0 : data?.unreadCount || 0;

  const filteredItems = (data?.items || []).filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.type === activeFilter;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition relative"
        title="Operational Activity Center"
      >
        <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
          </>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col text-slate-800 dark:text-slate-200">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Activity Center
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-500 font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Live operational events</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setReadOverride(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline px-1.5 py-0.5 rounded"
              >
                Mark read
              </button>
              <button
                onClick={fetchActivities}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto text-[11px]">
            {(["ALL", "ALERT", "FEEDBACK", "ACTION"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  activeFilter === filter
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {filter === "ALL" ? "All" : filter.toLowerCase() + "s"}
              </button>
            ))}
          </div>

          {/* Items Feed */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activity in this category.
              </div>
            ) : (
              filteredItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => setIsOpen(false)}
                  className="p-3 block hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        item.severity === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : item.severity === "HIGH"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white mt-1 leading-snug">
                    {item.title}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
