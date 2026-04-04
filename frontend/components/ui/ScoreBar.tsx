"use client";
import { motion } from "framer-motion";
import { getScoreColor } from "@/lib/utils";

interface Props {
  score: number;   // 0–10
  label?: string;
  showLabel?: boolean;
}

export function ScoreBar({ score, label, showLabel = true }: Props) {
  const color = getScoreColor(score * 10);
  const pct = (score / 10) * 100;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1.5 text-sm">
          {label && <span className="text-slate-400">{label}</span>}
          <span className="font-display font-bold ml-auto" style={{ color }}>
            {score.toFixed(1)}<span className="text-slate-500 text-xs font-normal">/10</span>
          </span>
        </div>
      )}
      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
