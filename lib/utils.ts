import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}

export function getSentimentBadgeColor(sentiment: string): string {
  switch (sentiment) {
    case "POS":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "NEG":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "NEU":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getChannelBadge(channel: string): { label: string; bg: string } {
  switch (channel) {
    case "SUPPORT_TICKET":
      return { label: "Support Ticket", bg: "bg-blue-50 text-blue-700 border-blue-200" };
    case "APP_STORE":
      return { label: "App Store", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    case "NPS_SURVEY":
      return { label: "NPS Survey", bg: "bg-purple-50 text-purple-700 border-purple-200" };
    case "SALES_CALL":
      return { label: "Sales Call", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "COMMUNITY":
      return { label: "Community", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    default:
      return { label: channel, bg: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}
