"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  TrendingUp,
  Sparkles,
  FileText,
  Settings,
  Layers,
  Map,
  Database,
  Bell,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CORE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Feedback Inbox", icon: Inbox },
  { href: "/trends", label: "Themes & Trends", icon: TrendingUp },
  { href: "/roadmap", label: "Product Roadmap", icon: Map },
];

const INTELLIGENCE_NAV_ITEMS = [
  { href: "/pm", label: "PM Decision Hub", icon: Target },
  { href: "/ask", label: "Ask LOOP (AI)", icon: Sparkles },
  { href: "/reports", label: "VoC Reports", icon: FileText },
  { href: "/alerts", label: "Anomaly Alerts", icon: Bell },
  { href: "/datasets", label: "Datasets & Quality", icon: Database },
];

const SETTINGS_NAV_ITEMS = [
  { href: "/settings", label: "Workspace & Team", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 flex-shrink-0 h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white">LOOP</span>
          <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-medium border border-indigo-700/50">
            Intelligence
          </span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Feedback Core
        </div>
        {CORE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          AI & Analytics
        </div>
        {INTELLIGENCE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-indigo-400")} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Settings
        </div>
        {SETTINGS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 flex flex-col gap-1">
        <div className="flex items-center justify-between text-slate-400">
          <span>Engine: Claude 3.5 Sonnet</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <div className="text-[11px] text-slate-400">Zidio Development v1.0</div>
      </div>
    </aside>
  );
}
