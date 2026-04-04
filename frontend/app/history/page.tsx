"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BarChart3, Clock, FileText, Mic, Star, Trash2, type LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { HistoryItem, SessionResponse } from "@/lib/types";
import { formatDate, getScoreColor } from "@/lib/utils";
import { interviewService, resumeService } from "@/services/api";

type Tab = "resumes" | "interviews";

type DeleteTarget =
  | {
      kind: "resume";
      id: number;
      label: string;
    }
  | {
      kind: "session";
      id: number;
      label: string;
    }
  | null;

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("resumes");
  const [resumes, setResumes] = useState<HistoryItem[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([resumeService.getHistory(), interviewService.getHistory()])
      .then(([resumeResponse, sessionResponse]) => {
        setResumes(resumeResponse.data);
        setSessions(sessionResponse.data);
      })
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  const analyzedResumes = useMemo(() => resumes.filter((item) => item.analysisId), [resumes]);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      if (deleteTarget.kind === "resume") {
        await resumeService.deleteResume(deleteTarget.id);
        setResumes((current) => current.filter((item) => item.resumeId !== deleteTarget.id));
        toast.success("Resume removed from history");
      } else {
        await interviewService.deleteSession(deleteTarget.id);
        setSessions((current) => current.filter((item) => item.id !== deleteTarget.id));
        toast.success("Interview session deleted");
      }
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell title="History">
      <div className="mx-auto max-w-5xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="mb-1 text-3xl font-display font-bold text-white">History and Activity</h2>
          <p className="max-w-2xl text-slate-400">
            Manage your resume analysis records and saved interview practice in one clean place.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col gap-3 rounded-[1.75rem] border border-white/8 p-5 glass-card md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Featured shortcut</p>
            <h3 className="mt-1 text-xl font-display font-semibold text-white">Dedicated Interview History page</h3>
            <p className="mt-1 text-sm text-slate-400">
              Review saved questions, submitted answers, timestamps, skipped questions, and delete old sessions when
              needed.
            </p>
          </div>
          <Link
            href="/interview/history"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3 text-sm font-medium text-white transition-all hover:from-violet-500 hover:to-cyan-500"
          >
            Open Interview History
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex w-fit gap-2 rounded-2xl border border-white/8 p-1.5 glass"
        >
          {[
            { key: "resumes", label: "Resumes", icon: FileText, count: analyzedResumes.length },
            { key: "interviews", label: "Interviews", icon: Mic, count: sessions.length },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as Tab)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-all ${
                tab === item.key
                  ? "border border-violet-500/25 bg-gradient-to-r from-violet-600/20 to-cyan-600/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-xs ${
                  tab === item.key ? "bg-violet-500/25 text-violet-200" : "bg-white/5 text-slate-500"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </motion.div>

        {loading && (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          </div>
        )}

        {!loading && tab === "resumes" && (
          <div className="space-y-3">
            {analyzedResumes.length === 0 ? (
              <EmptyHistoryState
                href="/resume/upload"
                icon={FileText}
                title="No resume analyses yet"
                description="Upload a resume to start collecting ATS scores and improvement ideas."
                actionLabel="Upload Resume"
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {analyzedResumes.map((item) => (
                  <motion.div
                    key={item.resumeId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[1.5rem] border border-white/8 p-5 glass-card"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{item.fileName}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          Analyzed {formatDate(item.analyzedAt as string)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <div className="text-center">
                          <p className="text-2xl font-display font-bold" style={{ color: getScoreColor(item.atsScore || 0) }}>
                            {item.atsScore}
                          </p>
                          <p className="text-xs text-slate-500">ATS score</p>
                        </div>
                        <Link
                          href={`/resume/analysis?id=${item.analysisId}`}
                          className="flex items-center gap-2 rounded-2xl border border-violet-500/20 px-4 py-2 text-sm text-violet-300 transition-colors hover:bg-violet-500/10"
                        >
                          View Analysis
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              kind: "resume",
                              id: item.resumeId,
                              label: item.fileName,
                            })
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-300 transition-colors hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {!loading && tab === "interviews" && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <EmptyHistoryState
                href="/interview"
                icon={Mic}
                title="No interview sessions yet"
                description="Run an interview to start saving answers, feedback, and progress."
                actionLabel="Start Interview"
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[1.5rem] border border-white/8 p-5 glass-card"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                        <Mic className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{session.sessionTitle}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(session.createdAt)}
                          </span>
                          {session.resumeFileName && <span>{session.resumeFileName}</span>}
                          <span>{session.questionsAnswered} answered</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-lg font-display font-bold text-white">
                              {session.overallScore?.toFixed(1) || "0.0"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {session.questionsAsked || session.qaList?.length || 0} questions
                          </p>
                        </div>
                        <Link
                          href={`/interview/history?sessionId=${session.id}`}
                          className="flex items-center gap-2 rounded-2xl border border-cyan-500/20 px-4 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/10"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Review Q&A
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              kind: "session",
                              id: session.id,
                              label: session.sessionTitle,
                            })
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-300 transition-colors hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.kind === "resume" ? "Delete resume history item?" : "Delete interview session?"}
        description={
          deleteTarget?.kind === "resume"
            ? `This removes "${deleteTarget.label}" from your resume history. Related interview sessions stay available, but they will no longer be linked to the original resume.`
            : `This permanently deletes "${deleteTarget?.label}" and its saved Q&A feedback.`
        }
        confirmLabel="Delete"
        isLoading={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}

function EmptyHistoryState({
  icon: Icon,
  title,
  description,
  href,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-white/10 p-12 text-center glass-card">
      <Icon className="mx-auto mb-3 h-10 w-10 text-slate-600" />
      <p className="mb-1 font-medium text-white">{title}</p>
      <p className="mb-5 text-sm text-slate-400">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-medium text-white"
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
