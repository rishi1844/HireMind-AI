"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, Mic, ChevronRight, Clock } from "lucide-react";
import { formatDate, getScoreColor } from "@/lib/utils";

interface ActivityItem {
  type: "resume" | "interview";
  title: string;
  subtitle: string;
  score?: number;
  scoreMax?: number;
  date: string;
  href: string;
}

interface Props {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: Props) {
  if (!items.length) return null;

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <Link
            href={item.href}
            className="flex items-center gap-4 p-4 glass-card rounded-xl border border-white/5
                       hover:border-violet-500/20 transition-all group"
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
              ${item.type === "resume"
                ? "bg-violet-500/10 text-violet-400"
                : "bg-cyan-500/10 text-cyan-400"}`}>
              {item.type === "resume"
                ? <FileText className="w-5 h-5" />
                : <Mic className="w-5 h-5" />}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{item.title}</p>
              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDate(item.date)}
              </p>
            </div>

            {/* Score */}
            {item.score !== undefined && (
              <div className="text-right shrink-0">
                <p
                  className="text-lg font-display font-bold"
                  style={{ color: getScoreColor(item.scoreMax === 10 ? item.score * 10 : item.score) }}
                >
                  {item.score}
                </p>
                <p className="text-slate-500 text-xs">/{item.scoreMax ?? 100}</p>
              </div>
            )}

            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
