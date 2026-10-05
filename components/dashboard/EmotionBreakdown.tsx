"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface EmotionItem {
  name: string;
  key: string;
  count: number;
  percent: number;
  color: string;
}

interface Props {
  data?: EmotionItem[];
}

export default function EmotionBreakdown({ data = [] }: Props) {
  const filtered = data.filter((d) => d.count > 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Customer Emotion Spectrum
          </h3>
          <span className="text-[11px] font-medium text-slate-400">8 Taxonomy Categories</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Distribution across customer psychological sentiment states
        </p>
      </div>

      <div className="h-56 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="count"
            >
              {filtered.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "8px",
                color: "#fff",
                border: "1px solid #334155",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
        {filtered.slice(0, 8).map((em) => (
          <div key={em.name} className="p-1 rounded bg-slate-50 dark:bg-slate-800/60">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{em.name}</div>
            <div className="text-xs font-bold" style={{ color: em.color }}>
              {em.percent}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
