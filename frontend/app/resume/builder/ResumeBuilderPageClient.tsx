"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Download, FileText, Loader2, Plus, Sparkles, Wand2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ResumeCard } from "@/components/resume-builder/ResumeCard";
import { BuiltResumeListItem } from "@/components/resume-builder/types";
import { useAuthStore } from "@/lib/store";
import { resumeBuilderService } from "@/services/api";

const unauthFeatures = [
  {
    icon: "✦",
    title: "AI-Powered Writing",
    desc: "Generate polished bullet points, summaries, and achievement statements with GPT AI Models.",
    color: "amber",
  },
  {
    icon: "◈",
    title: "11 ATS-Ready Templates",
    desc: "Switch between 11 beautifully designed, ATS-friendly layouts without losing content.",
    color: "violet",
  },
  {
    icon: "⬡",
    title: "PDF & DOCX Export",
    desc: "Download your finished resume in both formats instantly — ready to send.",
    color: "cyan",
  },
  {
    icon: "◎",
    title: "Draft History",
    desc: "All your resumes are saved and accessible anytime. Pick up where you left off.",
    color: "emerald",
  },
];

export default function ResumeBuilderPageClient() {
  const { isAuthenticated } = useAuthStore();
  const [resumes, setResumes] = useState<BuiltResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    resumeBuilderService
      .getAll()
      .then(({ data }) => setResumes(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleDeleted = (id: number) => {
    setResumes((current) => current.filter((resume) => resume.id !== id));
  };

  /* ─── Unauthenticated view ─── */
  if (!isAuthenticated) {
    return (
      <AppShell title="Resume Builder" requireAuth={false}>
        <div className="mx-auto max-w-3xl space-y-8 py-4">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.22em] text-amber-400/80">AI Resume Builder</p>
            <h1 className="mb-2 text-3xl font-display font-bold text-white md:text-4xl">
              Build Your <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Perfect Resume</span>
            </h1>
            <p className="max-w-xl text-slate-400">
              Create a polished, ATS-optimized resume in minutes using our AI-powered builder with 11 professional templates.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { value: "11", label: "Templates" },
              { value: "AI", label: "Vita AI Powered" },
              { value: "2", label: "Export Formats" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/[0.03] py-4 text-center backdrop-blur-xl">
                <p className="text-xl font-display font-bold text-amber-300 md:text-2xl">{stat.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Hero CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="group relative overflow-hidden rounded-[2rem] border border-dashed border-amber-500/30 bg-amber-500/5 px-8 py-12 text-center transition-all hover:border-amber-500/50 hover:bg-amber-500/8"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(139,92,246,0.04))" }}
            />
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/12 ring-1 ring-amber-500/20">
              <Wand2 className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-amber-400/70">Start Building</p>
            <h2 className="mt-2 text-2xl font-display font-bold text-white md:text-3xl">Login to Build Your Resume</h2>
            <p className="mx-auto mt-2.5 max-w-sm text-sm text-slate-400">
              Sign in to access the full builder workspace — pick a template, write with AI, and export in seconds.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] hover:from-amber-600 hover:to-amber-500"
              >
                Login to Build
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10"
              >
                Sign Up Free
              </Link>
            </div>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
          >
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">What you get</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {unauthFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className={`group/card flex items-start gap-3 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${feature.color === "amber"
                    ? "border-amber-500/15 bg-amber-500/5 hover:border-amber-500/30"
                    : feature.color === "violet"
                      ? "border-violet-500/15 bg-violet-500/5 hover:border-violet-500/30"
                      : feature.color === "cyan"
                        ? "border-cyan-500/15 bg-cyan-500/5 hover:border-cyan-500/30"
                        : "border-emerald-500/15 bg-emerald-500/5 hover:border-emerald-500/30"
                    }`}
                >
                  <span className={`mt-0.5 shrink-0 text-xl font-bold ${feature.color === "amber" ? "text-amber-400" : feature.color === "violet" ? "text-violet-400" : feature.color === "cyan" ? "text-cyan-400" : "text-emerald-400"
                    }`}>{feature.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{feature.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  /* ─── Authenticated view ─── */
  return (
    <AppShell title="Resume Builder" requireAuth={false}>
      <div className="mx-auto max-w-6xl space-y-8 py-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.22em] text-amber-400/80">AI Resume Builder</p>
            <h2 className="text-3xl font-bold text-white">My Resumes</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Open the builder workspace, switch across 11 templates, and export PDF or DOCX when ready.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">PDF & DOCX export</span>
            </div>
            <Link
              href="/resume/builder/new"
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:from-amber-500 hover:to-amber-400"
            >
              <Plus className="h-4 w-4" />
              New Resume
            </Link>
          </div>
        </motion.div>

        {/* Builder feature row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            { icon: Sparkles, label: "AI Content", desc: "Vita AI-powered bullets & summaries", color: "amber" },
            { icon: FileText, label: "11 Templates", desc: "ATS-friendly layouts", color: "violet" },
            { icon: Download, label: "PDF & DOCX", desc: "Export in one click", color: "cyan" },
            { icon: Wand2, label: "Real-Time Edit", desc: "Live preview as you type", color: "emerald" },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 ${item.color === "amber"
                ? "border-amber-500/15 bg-amber-500/5"
                : item.color === "violet"
                  ? "border-violet-500/15 bg-violet-500/5"
                  : item.color === "cyan"
                    ? "border-cyan-500/15 bg-cyan-500/5"
                    : "border-emerald-500/15 bg-emerald-500/5"
                }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${item.color === "amber" ? "text-amber-400" : item.color === "violet" ? "text-violet-400" : item.color === "cyan" ? "text-cyan-400" : "text-emerald-400"
                }`} />
              <div>
                <p className="text-xs font-semibold text-white">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="flex h-48 items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your resumes…</span>
          </div>
        ) : null}

        {/* Empty state (authenticated) */}
        {!loading && resumes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-dashed border-amber-500/20 bg-amber-500/5 px-8 py-16 text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-400">
              <Wand2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold text-white">Build your first resume</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Create a polished, ATS-optimized resume in minutes using the AI-powered builder workspace.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: "AI", title: "AI-Powered", desc: "Vita AI writes summaries, bullets, and project blurbs" },
                { icon: "11", title: "11 Templates", desc: "Switch layouts without losing content" },
                { icon: "PDF", title: "PDF & DOCX", desc: "Export formatted files in one click" },
              ].map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-white/8 bg-white/3 p-5 text-left">
                  <span className="text-xl font-bold text-amber-400">{feature.icon}</span>
                  <p className="mt-3 text-sm font-medium text-white">{feature.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
            <Link
              href="/resume/builder/new"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:from-amber-500 hover:to-amber-400"
            >
              <Plus className="h-4 w-4" />
              Create New Resume
            </Link>
          </motion.div>
        ) : null}

        {/* Resume cards grid */}
        {!loading && resumes.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <p className="text-sm font-medium text-slate-300">
                  {resumes.length} resume{resumes.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <ResumeCard resume={resume} onDeleted={handleDeleted} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </div>
    </AppShell>
  );
}
