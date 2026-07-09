"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Upload, Mic, History, ArrowRight, FileText, TrendingUp, Award, Clock, Wand2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/lib/store";
import { resumeService, interviewService, usageService } from "@/services/api";
import { formatDate, getScoreColor } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [resumeHistory, setResumeHistory] = useState<any[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageSummary, setUsageSummary] = useState<{
    plan: string;
    features: Record<string, { used: number | null; limit: number | null; unlimited: boolean }>;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      resumeService.getHistory().then((response) => setResumeHistory(response.data)),
      interviewService.getHistory().then((response) => setInterviewHistory(response.data)),
      usageService.getSummary().then((r) => setUsageSummary(r.data)).catch(() => { }),
    ]).finally(() => setLoading(false));
  }, []);

  const analyzed = resumeHistory.filter((item) => item.analysisId);
  const avgScore = analyzed.length
    ? Math.round(analyzed.reduce((sum, item) => sum + item.atsScore, 0) / analyzed.length)
    : null;
  const bestScore = analyzed.length ? Math.max(...analyzed.map((item) => item.atsScore)) : null;
  const totalInterviews = interviewHistory.length;
  const avgInterviewScore = interviewHistory.length
    ? (interviewHistory.reduce((sum, item) => sum + (item.overallScore || 0), 0) / interviewHistory.length).toFixed(1)
    : null;

  const quickActions = [
    { href: "/resume/upload", icon: Upload, label: "Upload Resume", desc: "Analyze a new resume with AI", color: "violet" },
    { href: "/resume/builder", icon: Wand2, label: "Resume Builder", desc: "Build an ATS-ready resume", color: "amber" },
    { href: "/interview", icon: Mic, label: "Start Interview", desc: "Practice with AI questions", color: "cyan" },
    { href: "/history", icon: History, label: "View History", desc: "Past results & sessions", color: "emerald" },
  ];

  return (
    <AppShell title="Dashboard">
      {/* Hero banner — full bleed within the max-w-7xl container */}
      <div className="relative -mx-4 -mt-6 overflow-hidden rounded-b-3xl border border-white/8 shadow-[0_40px_110px_rgba(2,6,23,0.58)] sm:-mx-6 md:-mx-8 lg:-mx-10 xl:-mx-12">
        <div className="absolute inset-0">
          <Image
            src="/glowing.png"
            alt="Dashboard background"
            fill
            priority
            className="scale-[1.03] object-cover object-[76%_center] opacity-70"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.92)_26%,rgba(2,6,23,0.82)_54%,rgba(2,6,23,0.76)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.3)_0%,rgba(2,6,23,0.48)_40%,rgba(2,6,23,0.82)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_22%,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_18%_16%,rgba(139,92,246,0.18),transparent_26%)]" />
        </div>

        <div className="relative z-10 space-y-8 px-6 py-8 md:px-10 md:py-10">
          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/85">Dashboard Overview</p>
            <h2 className="mb-2 text-3xl font-display font-bold text-white md:text-4xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                {user?.name?.split(" ")[0]}
              </span>
            </h2>
            <p className="max-w-2xl text-slate-300 text-sm md:text-base">
              Here&apos;s an overview of your career prep — resume analysis, ATS scoring, and interview practice.
            </p>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Resumes Analyzed", value: analyzed.length, icon: FileText, color: "violet" },
              { label: "Avg ATS Score", value: avgScore ? `${avgScore}` : "—", icon: TrendingUp, color: "cyan" },
              { label: "Best ATS Score", value: bestScore ? `${bestScore}` : "—", icon: Award, color: "emerald" },
              { label: "Interviews Done", value: totalInterviews, icon: Mic, color: "amber" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`glass-card rounded-2xl border bg-slate-950/40 p-4 backdrop-blur-xl md:p-5 transition-all duration-300 hover:scale-[1.02] ${
                  stat.color === "violet"
                    ? "border-violet-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_14px_rgba(139,92,246,0.12)] hover:border-violet-500/45 hover:shadow-[0_4px_24px_rgba(139,92,246,0.22),0_10px_30px_rgba(0,0,0,0.6)]"
                    : stat.color === "cyan"
                      ? "border-cyan-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_14px_rgba(6,182,212,0.12)] hover:border-cyan-500/45 hover:shadow-[0_4px_24px_rgba(6,182,212,0.22),0_10px_30px_rgba(0,0,0,0.6)]"
                      : stat.color === "emerald"
                        ? "border-emerald-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_14px_rgba(16,185,129,0.12)] hover:border-emerald-500/45 hover:shadow-[0_4px_24px_rgba(16,185,129,0.22),0_10px_30px_rgba(0,0,0,0.6)]"
                        : "border-amber-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_14px_rgba(245,158,11,0.12)] hover:border-amber-500/45 hover:shadow-[0_4px_24px_rgba(245,158,11,0.22),0_10px_30px_rgba(0,0,0,0.6)]"
                }`}
              >
                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl md:h-10 md:w-10 ${stat.color === "violet"
                      ? "bg-violet-500/15 text-violet-400"
                      : stat.color === "cyan"
                        ? "bg-cyan-500/15 text-cyan-400"
                        : stat.color === "emerald"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                    }`}
                >
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <p className="mb-0.5 text-xl font-display font-bold text-white md:text-2xl">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="mb-3 text-base font-display font-semibold text-white md:text-lg">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`group glass-card block rounded-2xl border bg-slate-950/34 p-4 backdrop-blur-xl transition-all hover:scale-[1.02] md:p-5 ${
                    action.color === "violet"
                      ? "border-violet-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_14px_rgba(139,92,246,0.12)] hover:border-violet-500/45 hover:shadow-[0_4px_24px_rgba(139,92,246,0.22),0_10px_30px_rgba(0,0,0,0.6)]"
                      : action.color === "cyan"
                        ? "border-cyan-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_14px_rgba(6,182,212,0.12)] hover:border-cyan-500/45 hover:shadow-[0_4px_24px_rgba(6,182,212,0.22),0_10px_30px_rgba(0,0,0,0.6)]"
                        : action.color === "amber"
                          ? "border-amber-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_14px_rgba(245,158,11,0.12)] hover:border-amber-500/45 hover:shadow-[0_4px_24px_rgba(245,158,11,0.22),0_10px_30px_rgba(0,0,0,0.6)]"
                          : "border-emerald-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_14px_rgba(16,185,129,0.12)] hover:border-emerald-500/45 hover:shadow-[0_4px_24px_rgba(16,185,129,0.22),0_10px_30px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-all ${action.color === "violet"
                        ? "bg-violet-500/15 text-violet-400 group-hover:bg-violet-500/25"
                        : action.color === "cyan"
                          ? "bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25"
                          : action.color === "amber"
                            ? "bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25"
                            : "bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25"
                      }`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <p className="mb-0.5 text-sm font-semibold text-white">{action.label}</p>
                  <p className="hidden text-xs text-slate-400 sm:block">{action.desc}</p>
                  <ArrowRight className="mt-2 h-3.5 w-3.5 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-white" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ── Monthly Usage Bar ── */}
          {usageSummary && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-display font-semibold text-white">
                  Monthly Usage
                  {usageSummary.plan === "pro" && (
                    <span className="ml-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300 uppercase tracking-wider">Pro</span>
                  )}
                </h3>
                {usageSummary.plan === "free" && (
                  <Link href="/pricing" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Upgrade to Pro →
                  </Link>
                )}
              </div>
              <div className="glass-card rounded-2xl border border-violet-500/25 bg-slate-950/40 p-4 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.45),0_0_14px_rgba(139,92,246,0.12)] hover:border-violet-500/45 hover:shadow-[0_4px_24px_rgba(139,92,246,0.22),0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {([
                    { key: "analyze", label: "Resume Analysis", color: "violet" },
                    { key: "cover_letter", label: "Cover Letters", color: "cyan" },
                    { key: "job_match", label: "Job Matches", color: "emerald" },
                    { key: "interview", label: "Interview Sessions", color: "amber" },
                    { key: "builder", label: "AI Builder Tips", color: "rose" },
                  ] as const).map(({ key, label, color }) => {
                    const feat = usageSummary.features[key];
                    if (!feat) return null;
                    const pct = feat.unlimited ? 0 : Math.min(100, Math.round(((feat.used ?? 0) / (feat.limit ?? 1)) * 100));
                    const barColor = feat.unlimited ? "bg-violet-500" : pct >= 90 ? "bg-rose-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500";
                    return (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300">{label}</span>
                          <span className="text-xs text-slate-500">
                            {feat.unlimited ? "∞ Unlimited" : `${feat.used ?? 0} / ${feat.limit}`}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: feat.unlimited ? "100%" : `${pct}%`, opacity: feat.unlimited ? 0.5 : 1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Recent analyses */}
          {analyzed.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-display font-semibold text-white md:text-lg">Recent Resume Analyses</h3>
                <Link href="/history" className="flex items-center gap-1 text-sm text-violet-300 transition-colors hover:text-violet-200">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid gap-2.5">
                {analyzed.slice(0, 3).map((item, index) => (
                  <motion.div
                    key={item.id ?? item.analysisId ?? index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                    className="glass-card flex items-center gap-4 rounded-2xl border border-violet-500/20 bg-slate-950/34 p-3.5 backdrop-blur-xl md:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4),0_0_12px_rgba(139,92,246,0.08)] hover:border-violet-500/40 hover:shadow-[0_4px_24px_rgba(139,92,246,0.18),0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                      <FileText className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{item.fileName}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3 w-3" /> {formatDate(item.analyzedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="text-base font-display font-bold" style={{ color: getScoreColor(item.atsScore) }}>
                          {item.atsScore}
                        </p>
                        <p className="text-xs text-slate-400">ATS</p>
                      </div>
                      <Link
                        href={`/resume/analysis?id=${item.analysisId}`}
                        className="rounded-lg border border-violet-500/24 px-3 py-1.5 text-xs text-violet-300 transition-all hover:bg-violet-500/10"
                      >
                        View
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && analyzed.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-3xl border border-dashed border-white/12 bg-slate-950/36 p-10 text-center backdrop-blur-xl md:p-12"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
                <Upload className="h-7 w-7 text-violet-400" />
              </div>
              <h3 className="mb-2 text-xl font-display font-bold text-white">No analyses yet</h3>
              <p className="mb-6 text-sm text-slate-300">Upload your first resume to get started with AI-powered insights.</p>
              <Link
                href="/resume/upload"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-sm font-medium text-white transition-all hover:from-violet-500 hover:to-cyan-500"
              >
                Upload Resume <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          )}

          {/* Interview avg */}
          {avgInterviewScore && (
            <div className="flex justify-end">
              <div className="rounded-2xl border border-white/10 bg-slate-950/34 px-4 py-3 text-right backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Interview Average</p>
                <p className="mt-1 text-lg font-display font-semibold text-white">{avgInterviewScore}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
