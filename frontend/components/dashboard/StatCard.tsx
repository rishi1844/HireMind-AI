"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "violet" | "cyan" | "emerald" | "amber" | "rose";
  delta?: string;
  delay?: number;
}

const colorMap = {
  violet: { bg: "bg-violet-500/12", text: "text-violet-400", glow: "shadow-violet-500/10" },
  cyan:   { bg: "bg-cyan-500/12",   text: "text-cyan-400",   glow: "shadow-cyan-500/10"   },
  emerald:{ bg: "bg-emerald-500/12",text: "text-emerald-400",glow: "shadow-emerald-500/10"},
  amber:  { bg: "bg-amber-500/12",  text: "text-amber-400",  glow: "shadow-amber-500/10"  },
  rose:   { bg: "bg-rose-500/12",   text: "text-rose-400",   glow: "shadow-rose-500/10"   },
};

export function StatCard({ label, value, icon: Icon, color = "violet", delta, delay = 0 }: Props) {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("glass-card rounded-2xl p-5 border border-white/6 shadow-lg", c.glow)}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", c.bg)}>
        <Icon className={cn("w-5 h-5", c.text)} />
      </div>
      <p className="text-2xl font-display font-bold text-white mb-0.5">{value}</p>
      <p className="text-slate-400 text-xs">{label}</p>
      {delta && (
        <p className="text-emerald-400 text-xs mt-1.5 font-medium">{delta}</p>
      )}
    </motion.div>
  );
}
