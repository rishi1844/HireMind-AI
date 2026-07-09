"use client";

import { BuilderStep, BUILDER_STEPS } from "./types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  currentStep: BuilderStep;
  completedSteps: Set<BuilderStep>;
  onStepClick: (step: BuilderStep) => void;
}

export function StepNav({ currentStep, completedSteps, onStepClick }: Props) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {BUILDER_STEPS.map((step) => {
        const isActive = step.id === currentStep;
        const isDone = completedSteps.has(step.id) && !isActive;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick(step.id)}
            title={step.label}
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition-all duration-200",
              isActive
                ? "border-violet-500/60 bg-violet-600/20 text-violet-200 shadow-[0_0_16px_rgba(139,92,246,0.2)]"
                : isDone
                  ? "border-emerald-600/40 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50"
                  : "border-[#2a3548] bg-[#1a2235] text-slate-400 hover:border-[#3a4760] hover:bg-[#1e2940] hover:text-slate-200"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                isActive
                  ? "bg-violet-600 text-violet-100"
                  : isDone
                    ? "bg-emerald-700 text-emerald-100"
                    : "bg-[#0f1623] text-slate-500"
              )}
            >
              {isDone ? (
                <Check className="h-3 w-3" />
              ) : (
                <span>{step.badge}</span>
              )}
            </span>
            <span className="block whitespace-nowrap font-semibold text-xs">
              {step.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
