"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpCircle,
  Briefcase,
  CheckCircle,
  Lightbulb,
  Mic,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { ATSScoreRing } from "@/components/resume/ATSScoreRing";
import { resumeService } from "@/services/api";
import { AnalysisResponse } from "@/lib/types";
import { getScoreColor } from "@/lib/utils";

function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.push("/resume/upload");
      return;
    }

    resumeService
      .getAnalysis(Number(id))
      .then((response) => setData(response.data))
      .catch(() => toast.error("Failed to load analysis"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const sections = [
    { key: "strengths", label: "Strengths", icon: CheckCircle, color: "emerald", items: data.strengths },
    { key: "weaknesses", label: "Weaknesses", icon: XCircle, color: "rose", items: data.weaknesses },
    { key: "improvements", label: "Improvements", icon: ArrowUpCircle, color: "cyan", items: data.improvements },
    { key: "jobRoles", label: "Best Job Roles", icon: Briefcase, color: "violet", items: data.jobRoles },
    { key: "projectSuggestions", label: "Project Ideas", icon: Lightbulb, color: "amber", items: data.projectSuggestions },
  ];

  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-400",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
    violet: "border-violet-500/20 bg-violet-500/10 text-violet-400",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="mb-1 text-3xl font-display font-bold text-white">Analysis Results</h2>
          <p className="max-w-lg truncate text-sm text-slate-400">{data.fileName}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/resume/upload"
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition-all hover:bg-white/5 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Analyze New
          </Link>
          <Link
            href={`/interview?resumeId=${data.resumeId}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-violet-500 hover:to-cyan-500"
          >
            <Mic className="h-4 w-4" />
            Start Interview
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-[2rem] border border-violet-500/15 p-8 glass-card glow-violet"
      >
        <div className="flex flex-col items-center gap-10 md:flex-row">
          <ATSScoreRing score={data.atsScore} size={200} />
          <div className="flex-1 text-center md:text-left">
            <h3 className="mb-2 text-2xl font-display font-bold text-white">
              Your resume scores <span style={{ color: getScoreColor(data.atsScore) }}>{data.atsScore}/100</span> on ATS
            </h3>
            <p className="mb-6 leading-relaxed text-slate-400">
              {data.atsScore >= 80
                ? "Your resume is already in strong shape. Use the suggestions below to polish positioning and interview readiness."
                : data.atsScore >= 60
                  ? "You have a solid baseline. Tightening weak spots and practicing your positioning should raise interview quality quickly."
                  : "Your resume needs a stronger structure and clearer signals. Start with the improvements below, then use quick practice mode."}
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Strengths", count: data.strengths.length, color: "#10b981" },
                { label: "Issues", count: data.weaknesses.length, color: "#f43f5e" },
                { label: "Tips", count: data.improvements.length, color: "#22d3ee" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 px-4 py-3 text-center glass">
                  <p className="text-2xl font-display font-bold" style={{ color: item.color }}>
                    {item.count}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-5">
        {sections.map((section, index) => (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + index * 0.06 }}
            className="rounded-[1.75rem] border border-white/8 p-6 glass-card"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${colorMap[section.color]}`}>
                <section.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-display font-semibold text-white">{section.label}</h3>
              <span className={`ml-auto rounded-full border px-3 py-1 text-xs ${colorMap[section.color]}`}>
                {section.items.length} items
              </span>
            </div>

            <ul className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <motion.li
                  key={`${section.key}-${itemIndex}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + itemIndex * 0.04 }}
                  className="flex items-start gap-3 text-sm leading-relaxed text-slate-300"
                >
                  <span
                    className={cnDot(section.color)}
                  />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        className="rounded-[1.75rem] border border-emerald-500/15 p-6 glass-card"
      >
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-emerald-300/80">Quick Practice Mode</p>
            <h3 className="text-2xl font-display font-bold text-white">3 to 5 instant Q&A drills</h3>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
            Use these short prompts right after analysis to rehearse sharper answers before you start a full interview.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {data.quickPractice.map((item, index) => (
            <motion.div
              key={`${item.question}-${index}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="rounded-[1.5rem] border border-white/8 bg-slate-950/80 p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Practice question {index + 1}</p>
              </div>
              <p className="mb-4 text-base font-medium leading-relaxed text-white">{item.question}</p>
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-emerald-300/80">Sample answer</p>
                <p className="text-sm leading-relaxed text-slate-300">{item.sampleAnswer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex flex-col items-center gap-5 rounded-[1.75rem] border border-cyan-500/15 p-6 text-center glass-card sm:flex-row sm:text-left"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
          <Mic className="h-6 w-6 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h4 className="mb-1 text-lg font-display font-semibold text-white">Ready for full interview practice?</h4>
          <p className="text-sm text-slate-400">
            Launch a tailored interview using this resume, then save the session to your interview history.
          </p>
        </div>
        <Link
          href={`/interview?resumeId=${data.resumeId}`}
          className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 px-6 py-3 text-sm font-medium text-white transition-all hover:from-cyan-500 hover:to-violet-500"
        >
          Start Interview
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <AppShell title="Resume Analysis">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          </div>
        }
      >
        <AnalysisContent />
      </Suspense>
    </AppShell>
  );
}

function cnDot(color: string) {
  if (color === "emerald") {
    return "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400";
  }
  if (color === "rose") {
    return "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400";
  }
  if (color === "cyan") {
    return "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400";
  }
  if (color === "violet") {
    return "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400";
  }
  return "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400";
}
