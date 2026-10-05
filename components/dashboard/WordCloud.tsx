"use client";

import { useState } from "react";
import { Tag, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export interface WordCloudTag {
  text: string;
  count: number;
  sentiment: "POS" | "NEU" | "NEG";
  score?: number;
}

interface WordCloudProps {
  tags?: WordCloudTag[];
  onTagClick?: (tag: string) => void;
}

export default function WordCloud({ tags = [], onTagClick }: WordCloudProps) {
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  if (!tags || tags.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-center items-center text-center py-10">
        <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Ingest feedback to discover extracted feature keywords</p>
      </div>
    );
  }

  // Compute font sizes based on min/max counts
  const maxCount = Math.max(...tags.map((t) => t.count), 1);
  const minCount = Math.min(...tags.map((t) => t.count), 1);

  const getFontSize = (count: number) => {
    const minSize = 11;
    const maxSize = 18;
    if (maxCount === minCount) return 13;
    return Math.round(minSize + ((count - minCount) / (maxCount - minCount)) * (maxSize - minSize));
  };

  const getBadgeStyle = (sentiment: "POS" | "NEU" | "NEG", isSelected: boolean) => {
    if (isSelected) return "bg-indigo-600 text-white border-indigo-700 shadow-md scale-105";

    switch (sentiment) {
      case "POS":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100";
      case "NEG":
        return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-100";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200";
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    if (onTagClick) {
      onTagClick(tag);
    } else {
      router.push(`/inbox?search=${encodeURIComponent(tag)}`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-indigo-500" />
            Extracted Feature Keyword Cloud
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any feature or aspect tag to filter in Inbox
          </p>
        </div>
        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Extracted
        </span>
      </div>

      {/* Cloud Items Grid */}
      <div className="flex flex-wrap gap-2 items-center justify-center p-3 min-h-[140px] bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
        {tags.map((tag) => {
          const isSelected = selectedTag === tag.text;
          const fontSize = getFontSize(tag.count);
          return (
            <button
              key={tag.text}
              onClick={() => handleTagClick(tag.text)}
              style={{ fontSize: `${fontSize}px` }}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${getBadgeStyle(
                tag.sentiment,
                isSelected
              )}`}
              title={`Click to explore '${tag.text}' (${tag.count} signals, ${tag.sentiment})`}
            >
              <span>{tag.text}</span>
              <span className="text-[10px] opacity-75 font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/10">
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Positive Signal</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Negative Friction</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Neutral / Inquiry</span>
      </div>
    </div>
  );
}
