"use client";

/**
 * AiTipsPanel — Static UI only.
 * Shows hardcoded, step-specific writing tips.
 * NO API calls — zero cost, zero latency.
 */

import { Lightbulb, Sparkles } from "lucide-react";
import { BuilderStep } from "./types";

interface Props {
  step: BuilderStep;
  resumeData?: Record<string, unknown>;
}

const STATIC_TIPS: Record<BuilderStep, string[]> = {
  basics: [
    "Use a professional email address (avoid nicknames).",
    "Add LinkedIn & GitHub to boost recruiter confidence.",
    "Keep your location city-level — no full street address.",
  ],
  summary: [
    "Open with a strong action verb or your title.",
    "Mention your top skill + years of experience in line 1.",
    "Close with the type of role or impact you want next.",
  ],
  education: [
    "List most recent qualification first.",
    "Include CGPA/percentage only if it's 7.5+ or 75%+.",
    "Add relevant coursework or honours if they add value.",
  ],
  experience: [
    "Start every bullet with a strong action verb (Led, Built, Reduced).",
    "Include at least one measurable achievement per role.",
    "Keep descriptions to 2–4 bullet points per position.",
  ],
  projects: [
    "Mention the tech stack clearly (recruiters keyword-scan).",
    "Quantify impact: users served, performance gains, revenue.",
    "Link to a live demo or GitHub repo where possible.",
  ],
  skills: [
    "List tools and languages recruiters search for.",
    "Order skills by proficiency — strongest first.",
    "Avoid vague terms like 'team player' in the skills section.",
  ],
  custom: [
    "Use this for certifications, languages, or awards.",
    "Certifications from AWS, Google, or Meta add credibility.",
    "Keep custom sections brief — 3–5 items maximum.",
  ],
};

export function AiTipsPanel({ step }: Props) {
  const tips = STATIC_TIPS[step] ?? STATIC_TIPS["basics"];

  return (
    <div className="space-y-2.5">
      {tips.map((tip, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2.5 transition-colors hover:bg-amber-500/10"
        >
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/90" />
          <span className="text-[12px] leading-relaxed text-slate-400">{tip}</span>
        </div>
      ))}
    </div>
  );
}
