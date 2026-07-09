"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Brain, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Star, Clock, BookOpen, Mic, MessageSquare, TrendingUp, Award
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { interviewService } from "@/services/api";
import Link from "next/link";

interface QA {
  id: string;
  question: string;
  answer: string | null;
  score: number | null;
  strengths: string | null;
  weaknesses: string | null;
  improvedAnswer: string | null;
  questionType: string | null;
  inputMode: string | null;
  orderIndex: number | null;
  skipped: boolean | null;
}

interface Session {
  id: string;
  sessionTitle: string | null;
  overallScore: number | null;
  questionsAnswered: number | null;
  createdAt: string | null;
  resumeFileNameSnapshot: string | null;
  qaList: QA[];
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color = score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-cyan-500" : score >= 4 ? "bg-amber-500" : "bg-rose-500";
  const textColor = score >= 8 ? "text-emerald-400" : score >= 6 ? "text-cyan-400" : score >= 4 ? "text-amber-400" : "text-rose-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums w-8 text-right ${textColor}`}>{score.toFixed(1)}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: string | null }) {
  const map: Record<string, string> = {
    TECHNICAL: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    PROJECT: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
    HR: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  };
  const cls = map[type || ""] || "bg-slate-500/15 text-slate-300 border-slate-500/20";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {type || "General"}
    </span>
  );
}

function QACard({ qa, index }: { qa: QA; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-white/8 bg-[#0a0f1e]/60 overflow-hidden"
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Index bubble */}
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <TypeBadge type={qa.questionType} />
            {qa.skipped && (
              <span className="rounded-full bg-slate-600/20 border border-slate-600/30 px-2.5 py-0.5 text-xs text-slate-500">
                Skipped
              </span>
            )}
            {qa.inputMode === "voice" && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Mic className="h-3 w-3" /> Voice
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-white leading-relaxed">{qa.question}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {qa.score !== null && !qa.skipped && (
            <div className="text-right">
              <span className={`text-lg font-bold ${qa.score >= 8 ? "text-emerald-400" : qa.score >= 6 ? "text-cyan-400" : qa.score >= 4 ? "text-amber-400" : "text-rose-400"}`}>
                {qa.score.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">/10</span>
            </div>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
              {/* Score bar */}
              {qa.score !== null && !qa.skipped && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Score</p>
                  <ScoreBar score={qa.score} />
                </div>
              )}

              {/* Your Answer */}
              {qa.answer && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" /> Your Answer
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed rounded-xl bg-white/[0.03] border border-white/5 p-3">
                    {qa.answer}
                  </p>
                </div>
              )}
              {qa.skipped && (
                <p className="text-sm text-slate-500 italic">You skipped this question.</p>
              )}

              {/* Feedback grid */}
              {!qa.skipped && (qa.strengths || qa.weaknesses) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {qa.strengths && (
                    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1.5 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Strengths
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">{qa.strengths}</p>
                    </div>
                  )}
                  {qa.weaknesses && (
                    <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-1.5 flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Areas to Improve
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">{qa.weaknesses}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Model Answer */}
              {qa.improvedAnswer && !qa.skipped && (
                <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-1.5 flex items-center gap-1">
                    <Brain className="h-3 w-3" /> Model Answer
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">{qa.improvedAnswer}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function InterviewReplayPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { router.push("/history"); return; }
    interviewService
      .getSession(Number(id))
      .then((r) => setSession(r.data))
      .catch(() => toast.error("Failed to load session"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <AppShell title="Interview Replay">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Interview Replay">
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-slate-400">Session not found.</p>
          <Link href="/history" className="text-violet-400 hover:underline text-sm">← Back to History</Link>
        </div>
      </AppShell>
    );
  }

  const answered = session.qaList.filter(q => !q.skipped && q.score !== null);
  const avgScore = answered.length > 0
    ? answered.reduce((a, q) => a + (q.score || 0), 0) / answered.length
    : 0;
  const scoreColor = avgScore >= 8 ? "text-emerald-400" : avgScore >= 6 ? "text-cyan-400" : avgScore >= 4 ? "text-amber-400" : "text-rose-400";

  return (
    <AppShell title="Interview Replay">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back */}
        <Link href="/history" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to History
        </Link>

        {/* Session Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-violet-500/15 bg-gradient-to-br from-violet-950/40 to-slate-950/60 p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {session.sessionTitle || "Interview Session"}
              </h1>
              {session.resumeFileNameSnapshot && (
                <p className="text-sm text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> {session.resumeFileNameSnapshot}
                </p>
              )}
              {session.createdAt && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(session.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              )}
            </div>

            {/* Overall Score */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 min-w-[100px]">
              <Award className="h-5 w-5 text-violet-400 mb-1" />
              <p className={`text-3xl font-bold ${scoreColor}`}>{avgScore.toFixed(1)}</p>
              <p className="text-xs text-slate-500 mt-0.5">/ 10 avg</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Questions", value: session.qaList.length, icon: MessageSquare, color: "text-violet-400" },
              { label: "Answered", value: answered.length, icon: CheckCircle, color: "text-emerald-400" },
              { label: "Skipped", value: session.qaList.length - answered.length, icon: XCircle, color: "text-rose-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Score distribution */}
          {answered.length > 0 && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Score Breakdown
              </p>
              <div className="space-y-1.5">
                {session.qaList.map((qa, i) => !qa.skipped && qa.score !== null && (
                  <div key={qa.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4 text-right">{i + 1}</span>
                    <ScoreBar score={qa.score} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Q&A List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-violet-400" /> Question-by-Question Replay
          </h2>
          {session.qaList
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((qa, i) => (
              <QACard key={qa.id} qa={qa} index={i} />
            ))}
        </div>
      </div>
    </AppShell>
  );
}
