"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  icon: LucideIcon;
  items: string[];
  color: "emerald" | "rose" | "cyan" | "violet" | "amber";
  delay?: number;
}

const colorMap = {
  emerald: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
    icon: "bg-emerald-500/10 text-emerald-400",
    border: "border-emerald-500/10",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dot: "bg-rose-400",
    icon: "bg-rose-500/10 text-rose-400",
    border: "border-rose-500/10",
  },
  cyan: {
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    dot: "bg-cyan-400",
    icon: "bg-cyan-500/10 text-cyan-400",
    border: "border-cyan-500/10",
  },
  violet: {
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    dot: "bg-violet-400",
    icon: "bg-violet-500/10 text-violet-400",
    border: "border-violet-500/10",
  },
  amber: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
    icon: "bg-amber-500/10 text-amber-400",
    border: "border-amber-500/10",
  },
};

export function AnalysisSection({ title, icon: Icon, items, color, delay = 0 }: Props) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-card rounded-2xl p-6 border ${c.border}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${c.badge}`}>
          <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </div>
        <h3 className="font-display font-semibold text-white">{title}</h3>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border ${c.badge}`}>
          {items.length}
        </span>
      </div>

      <ul className="space-y-3">
        {items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.06 + i * 0.05 }}
            className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed"
          >
            <span className={`w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 ${c.dot}`} />
            {item}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
