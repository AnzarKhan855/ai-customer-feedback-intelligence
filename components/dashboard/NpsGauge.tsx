"use client";

import { useMemo } from "react";
import { Smile, Frown, Meh } from "lucide-react";

interface NpsGaugeProps {
  score: number; // e.g. +42 or -15 (-100 to +100)
  positivePct: number;
  negativePct: number;
  neutralPct: number;
}

export default function NpsGauge({
  score = 35,
  positivePct = 58,
  negativePct = 23,
  neutralPct = 19,
}: NpsGaugeProps) {
  // Angle calculation for SVG needle (-90 deg to +90 deg)
  // score range is -100 to +100
  const needleAngle = useMemo(() => {
    const clamped = Math.max(-100, Math.min(100, score));
    return (clamped / 100) * 90;
  }, [score]);

  const scoreLabel = score > 25 ? "Strongly Positive" : score >= 0 ? "Moderately Positive" : "Needs Attention";
  const scoreColor = score > 25 ? "text-emerald-600" : score >= 0 ? "text-amber-600" : "text-rose-600";
  const gaugeBg = score > 25 ? "from-emerald-500/20 to-indigo-500/10" : score >= 0 ? "from-amber-500/20 to-indigo-500/10" : "from-rose-500/20 to-indigo-500/10";

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${gaugeBg}`}>
      {/* Top Title */}
      <div className="flex items-center justify-between z-10">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Net Sentiment Gauge
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Weighted customer score (-100 to +100)
          </p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${score > 25 ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" : score >= 0 ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"}`}>
          {scoreLabel}
        </span>
      </div>

      {/* SVG Arc Speedometer Gauge */}
      <div className="relative w-full h-36 flex items-center justify-center my-2">
        <svg viewBox="0 0 200 120" className="w-52 h-32 overflow-visible">
          {/* Background Arc Tracks */}
          {/* Negative Red Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 70 30"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="16"
            strokeLinecap="round"
            className="opacity-80"
          />
          {/* Neutral Yellow Arc */}
          <path
            d="M 75 26 A 80 80 0 0 1 125 26"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="16"
            strokeLinecap="round"
            className="opacity-80"
          />
          {/* Positive Green Arc */}
          <path
            d="M 130 30 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#10b981"
            strokeWidth="16"
            strokeLinecap="round"
            className="opacity-80"
          />

          {/* Pivot Center Shadow */}
          <circle cx="100" cy="100" r="8" fill="#1e293b" />
          <circle cx="100" cy="100" r="4" fill="#6366f1" />

          {/* Dynamic Dial Needle */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="#0f172a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="97,35 103,35 100,20" fill="#6366f1" />
          </g>
        </svg>

        {/* Center Big Score Display */}
        <div className="absolute bottom-2 text-center">
          <div className={`text-3xl font-black ${scoreColor}`}>
            {score > 0 ? `+${score}` : score}
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            NPS Index
          </div>
        </div>
      </div>

      {/* Sentiment Micro-Bar Ratios */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs z-10">
        <div className="p-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-1">
          <Smile className="w-3.5 h-3.5" />
          <span>{positivePct}% Pos</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-1">
          <Meh className="w-3.5 h-3.5" />
          <span>{neutralPct}% Neu</span>
        </div>
        <div className="p-1.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-semibold flex items-center justify-center gap-1">
          <Frown className="w-3.5 h-3.5" />
          <span>{negativePct}% Neg</span>
        </div>
      </div>
    </div>
  );
}
