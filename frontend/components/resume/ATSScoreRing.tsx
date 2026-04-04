"use client";
import { motion } from "framer-motion";
import { getScoreColor, getScoreLabel } from "@/lib/utils";

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export function ATSScoreRing({ score, size = 180, strokeWidth = 12, animate = true }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={animate ? { strokeDashoffset: offset } : { strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-4xl font-display font-bold text-white leading-none"
          >
            {score}
          </motion.span>
          <span className="text-xs text-slate-400 mt-1">/ 100</span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-sm font-semibold" style={{ color }}>{label}</span>
        <p className="text-xs text-slate-500 mt-0.5">ATS Score</p>
      </div>
    </div>
  );
}
