"use client";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { ScoreBar } from "@/components/ui/ScoreBar";

interface FeedbackCardProps {
  score: number;
  strengths: string;
  weaknesses: string;
  improvedAnswer: string;
}

export function FeedbackCard({ score, strengths, weaknesses, improvedAnswer }: FeedbackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 border border-violet-500/15 space-y-5"
    >
      {/* Score bar */}
      <div>
        <h4 className="font-display font-semibold text-white mb-3">Your Score</h4>
        <ScoreBar score={score} />
      </div>

      {/* Strengths */}
      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Strengths</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{strengths}</p>
      </div>

      {/* Weaknesses */}
      <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-4 h-4 text-rose-400" />
          <span className="text-rose-400 text-xs font-semibold uppercase tracking-wider">Areas to Improve</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{weaknesses}</p>
      </div>

      {/* Improved answer */}
      <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-violet-400" />
          <span className="text-violet-400 text-xs font-semibold uppercase tracking-wider">Model Answer</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{improvedAnswer}</p>
      </div>
    </motion.div>
  );
}
