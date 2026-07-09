"use client";

import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DataPoint {
  date: string;
  score: number;
  label: string;
}

interface Props {
  history: { analyzedAt?: string | null; atsScore?: number | null; fileName: string }[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as DataPoint;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1424] px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-0.5">{d.date}</p>
      <p className="font-bold text-white">{d.label}</p>
      <p className="text-violet-300 font-semibold text-base">{d.score} <span className="text-slate-500 text-xs">ATS</span></p>
    </div>
  );
}

export function ScoreHistoryChart({ history }: Props) {
  const data: DataPoint[] = history
    .filter(h => h.analyzedAt && h.atsScore != null)
    .map(h => ({
      date: new Date(h.analyzedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      score: h.atsScore!,
      label: h.fileName,
    }))
    .reverse(); // oldest first

  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <TrendingUp className="h-7 w-7 text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">Analyze more resumes to see your progress over time.</p>
      </div>
    );
  }

  const latest = data[data.length - 1].score;
  const previous = data[data.length - 2].score;
  const diff = latest - previous;
  const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const trendColor = diff > 0 ? "text-emerald-400" : diff < 0 ? "text-rose-400" : "text-slate-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-0.5">Score Trend</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{latest}</span>
            <span className={`flex items-center gap-0.5 text-sm font-medium ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              {diff > 0 ? "+" : ""}{diff}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500">{data.length} analyses</p>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5}
            fill="url(#scoreGrad)" dot={{ fill: "#7c3aed", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#a78bfa", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
