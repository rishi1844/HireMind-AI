"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Upload, Mic, History, ArrowRight, FileText, TrendingUp, Award, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/lib/store";
import { resumeService, interviewService } from "@/services/api";
import { formatDate, getScoreColor } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [resumeHistory, setResumeHistory] = useState<any[]>([]);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      resumeService.getHistory().then((response) => setResumeHistory(response.data)),
      interviewService.getHistory().then((response) => setInterviewHistory(response.data)),
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
    { href: "/resume/upload", icon: Upload, label: "Upload Resume", desc: "Analyze a new resume", color: "violet" },
    { href: "/interview", icon: Mic, label: "Start Interview", desc: "Practice with AI", color: "cyan" },
    { href: "/history", icon: History, label: "View History", desc: "Past results", color: "emerald" },
  ];

  return (
    <AppShell title="Dashboard">
      <div className="max-w-6xl -mx-4 -mb-8 -mt-5 sm:-mx-5 md:-mx-6 lg:-mx-8">
        <div className="relative overflow-hidden  border border-white/8 shadow-[0_40px_110px_rgba(2,6,23,0.58)]">
          <div className="absolute inset-0">
            <Image
              src="/glowing.png"
              alt="Resume dashboard background"
              fill
              priority
              className="scale-[1.03] object-cover object-[76%_center] opacity-70"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.92)_26%,rgba(2,6,23,0.82)_54%,rgba(2,6,23,0.76)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.3)_0%,rgba(2,6,23,0.48)_40%,rgba(2,6,23,0.82)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_22%,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_18%_16%,rgba(139,92,246,0.18),transparent_26%)]" />
          </div>

          <div className="relative z-10 space-y-8 p-6 md:p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/85">Dashboard Overview</p>
              <h2 className="mb-2 text-3xl font-display font-bold text-white md:text-4xl">
                Welcome back, {user?.name?.split(" ")[0]}
              </h2>
              <p className="max-w-3xl text-slate-200">
                Here&apos;s an overview of your career prep progress across resume analysis, ATS scoring, and interview practice.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Resumes Analyzed", value: analyzed.length, icon: FileText, color: "violet" },
                { label: "Avg ATS Score", value: avgScore ? `${avgScore}` : "-", icon: TrendingUp, color: "cyan" },
                { label: "Best ATS Score", value: bestScore ? `${bestScore}` : "-", icon: Award, color: "emerald" },
                { label: "Interviews Done", value: totalInterviews, icon: Mic, color: "amber" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="glass-card rounded-2xl border border-white/10 bg-slate-950/36 p-5 backdrop-blur-xl"
                >
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                      stat.color === "violet"
                        ? "bg-violet-500/15 text-violet-400"
                        : stat.color === "cyan"
                          ? "bg-cyan-500/15 text-cyan-400"
                          : stat.color === "emerald"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="mb-0.5 text-2xl font-display font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-300">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="mb-4 text-lg font-display font-semibold text-white">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="group glass-card block rounded-2xl border border-white/10 bg-slate-950/34 p-5 backdrop-blur-xl transition-all hover:scale-[1.02] hover:border-violet-500/28"
                  >
                    <div
                      className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                        action.color === "violet"
                          ? "bg-violet-500/15 text-violet-400 group-hover:bg-violet-500/25"
                          : action.color === "cyan"
                            ? "bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25"
                            : "bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25"
                      }`}
                    >
                      <action.icon className="h-5 w-5" />
                    </div>
                    <p className="mb-0.5 font-semibold text-white">{action.label}</p>
                    <p className="text-sm text-slate-300">{action.desc}</p>
                    <ArrowRight className="mt-3 h-4 w-4 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {analyzed.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-display font-semibold text-white">Recent Resume Analyses</h3>
                  <Link href="/history" className="flex items-center gap-1 text-sm text-violet-300 transition-colors hover:text-violet-200">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid gap-3">
                  {analyzed.slice(0, 3).map((item, index) => (
                    <motion.div
                      key={item.id ?? item.analysisId ?? index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.08 }}
                      className="glass-card flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/34 p-4 backdrop-blur-xl"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                        <FileText className="h-5 w-5 text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{item.fileName}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
                          <Clock className="h-3 w-3" /> {formatDate(item.analyzedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-display font-bold" style={{ color: getScoreColor(item.atsScore) }}>
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

            {!loading && analyzed.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-3xl border border-dashed border-white/12 bg-slate-950/36 p-12 text-center backdrop-blur-xl"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
                  <Upload className="h-8 w-8 text-violet-400" />
                </div>
                <h3 className="mb-2 text-xl font-display font-bold text-white">No analyses yet</h3>
                <p className="mb-6 text-slate-300">Upload your first resume to get started with AI-powered insights.</p>
                <Link
                  href="/resume/upload"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 font-medium text-white transition-all hover:from-violet-500 hover:to-cyan-500"
                >
                  Upload Resume <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )}

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
      </div>
    </AppShell>
  );
}
