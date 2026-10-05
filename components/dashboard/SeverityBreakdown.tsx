"use client";

import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface SeverityItem {
  name: string;
  count: number;
  color: string;
}

interface Props {
  data?: SeverityItem[];
}

export default function SeverityBreakdown({ data = [] }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Issue Severity & Urgency Index
          </h3>
          <span className="text-[11px] font-medium text-slate-400">0 - 100 Scale</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Signals grouped by business criticality and impact urgency
        </p>
      </div>

      <div className="h-56 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "8px",
                color: "#fff",
                border: "1px solid #334155",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
        {data.map((item) => (
          <div key={item.name} className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/60">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.name.split(" ")[0]}</div>
            <div className="text-sm font-bold" style={{ color: item.color }}>
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
