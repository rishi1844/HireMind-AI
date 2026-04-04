"use client";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface Props {
  question: string;
  type: string;
  index: number;
  onSpeak?: (q: string) => void;
}

const typeColorMap: Record<string, any> = {
  TECHNICAL: "cyan",
  PROJECT: "violet",
  HR: "emerald",
};

export function QuestionCard({ question, type, index, onSpeak }: Props) {
  const color = typeColorMap[type] || "slate";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-2xl p-5 border border-white/6 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-6 h-6 rounded-full bg-white/8 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <Badge color={color}>{type}</Badge>
        </div>
        {onSpeak && (
          <button
            onClick={() => onSpeak(question)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-white text-sm leading-relaxed">{question}</p>
    </motion.div>
  );
}
