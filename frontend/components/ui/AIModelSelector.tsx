"use client";

import { motion } from "framer-motion";

export type AIModel = "gemini" | "gpt";

interface AIModelSelectorProps {
  value: AIModel;
  onChange: (model: AIModel) => void;
  className?: string;
}

const models = [
  {
    id: "gemini" as AIModel,
    name: "Google Gemini",
    badge: "Gemini 1.5 Flash",
    desc: "Fast, accurate, great for ATS analysis",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <defs>
          <linearGradient id="gem-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="50%" stopColor="#34A853" />
            <stop offset="100%" stopColor="#EA4335" />
          </linearGradient>
        </defs>
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3l2.5 7.5H9.5L12 5zm0 14l-2.5-7.5h5L12 19z"
          fill="url(#gem-g)"
        />
      </svg>
    ),
    gradient: "from-blue-500/20 via-green-500/10 to-red-500/20",
    border: "border-blue-500/40",
    ring: "ring-blue-500/30",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  {
    id: "gpt" as AIModel,
    name: "OpenAI GPT",
    badge: "Vita AI",
    desc: "Most powerful, deep reasoning & insights",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path
          d="M22.28 9.63a5.64 5.64 0 0 0-.48-4.63 5.7 5.7 0 0 0-6.13-2.74A5.65 5.65 0 0 0 11.4 1a5.7 5.7 0 0 0-5.44 3.95 5.65 5.65 0 0 0-3.77 2.74 5.7 5.7 0 0 0 .7 6.68 5.64 5.64 0 0 0 .48 4.63 5.7 5.7 0 0 0 6.13 2.74A5.65 5.65 0 0 0 13.77 23a5.7 5.7 0 0 0 5.44-3.95 5.65 5.65 0 0 0 3.77-2.74 5.7 5.7 0 0 0-.7-6.68zM13.77 21.5a4.22 4.22 0 0 1-2.71-.98l.13-.08 4.5-2.6a.74.74 0 0 0 .37-.64v-6.35l1.9 1.1a.07.07 0 0 1 .04.05v5.26a4.24 4.24 0 0 1-4.23 4.24zm-9.1-3.89a4.22 4.22 0 0 1-.5-2.84l.13.08 4.5 2.6a.74.74 0 0 0 .74 0l5.5-3.17v2.2a.07.07 0 0 1-.03.06l-4.55 2.63a4.24 4.24 0 0 1-5.79-1.56zm-1.18-9.8a4.22 4.22 0 0 1 2.2-1.86v5.35a.74.74 0 0 0 .37.64l5.5 3.17-1.9 1.1a.07.07 0 0 1-.07 0L5.1 13.6a4.24 4.24 0 0 1-1.61-5.79zm15.6 3.64-5.5-3.17 1.9-1.1a.07.07 0 0 1 .07 0l4.49 2.6a4.24 4.24 0 0 1-.66 7.65V11.2a.74.74 0 0 0-.3-.75zm1.89-2.86-.13-.08-4.5-2.6a.74.74 0 0 0-.74 0L10.01 9.1V6.9a.07.07 0 0 1 .03-.06l4.55-2.63a4.24 4.24 0 0 1 6.29 4.4zm-11.9 3.91-1.9-1.1a.07.07 0 0 1-.04-.05V5.09a4.24 4.24 0 0 1 6.95-3.26l-.13.08-4.5 2.6a.74.74 0 0 0-.37.64v6.35zm1.03-2.23 2.45-1.41 2.45 1.41v2.82l-2.45 1.41-2.45-1.41V12.37z"
        />
      </svg>
    ),
    gradient: "from-emerald-500/20 via-teal-500/10 to-cyan-500/20",
    border: "border-emerald-500/40",
    ring: "ring-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
];

export function AIModelSelector({ value, onChange, className = "" }: AIModelSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Choose AI Model
      </p>
      <div className="grid grid-cols-2 gap-3">
        {models.map((model) => {
          const selected = value === model.id;
          return (
            <motion.button
              key={model.id}
              type="button"
              onClick={() => onChange(model.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 ${
                selected
                  ? `${model.border} bg-gradient-to-br ${model.gradient} ring-2 ${model.ring}`
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              {/* Selected indicator */}
              {selected && (
                <motion.div
                  layoutId="ai-selector-dot"
                  className={`absolute right-3 top-3 h-2 w-2 rounded-full ${model.dot}`}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className={`${selected ? model.text : "text-slate-400"} transition-colors`}>
                {model.icon}
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-white">{model.name}</p>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      selected ? `${model.text} bg-white/10` : "text-slate-500 bg-white/5"
                    }`}
                  >
                    {model.badge}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{model.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
