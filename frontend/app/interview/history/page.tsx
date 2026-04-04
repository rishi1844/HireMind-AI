"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  ChevronRight,
  FileSearch,
  MessageSquareText,
  Mic,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SessionResponse } from "@/lib/types";
import { cn, formatDate, getScoreColor, truncateText } from "@/lib/utils";
import { interviewService } from "@/services/api";

const INITIAL_QA_COUNT = 2;
const QA_INCREMENT = 2;

function InterviewHistoryContent() {
  const searchParams = useSearchParams();
  const initialSessionId = searchParams.get("sessionId");
  const initialQuery = searchParams.get("query") || "";

  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    initialSessionId ? Number(initialSessionId) : null
  );
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(true);
  const [visibleQaCount, setVisibleQaCount] = useState(INITIAL_QA_COUNT);
  const [deleteTarget, setDeleteTarget] = useState<SessionResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    interviewService
      .getHistory()
      .then((response) => {
        const data = response.data as SessionResponse[];
        setSessions(data);

        if (data.length && !initialSessionId) {
          setSelectedSessionId(data[0].id);
        }
      })
      .catch(() => toast.error("Failed to load interview history"))
      .finally(() => setLoading(false));
  }, [initialSessionId]);

  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return sessions;
    }

    return sessions.filter((session) => {
      const sessionText = [
        session.sessionTitle,
        session.resumeFileName,
        ...(session.qaList || []).flatMap((item) => [item.question, item.answer || ""]),
      ]
        .join(" ")
        .toLowerCase();

      return sessionText.includes(normalized);
    });
  }, [query, sessions]);

  useEffect(() => {
    if (!filteredSessions.length) {
      setSelectedSessionId(null);
      return;
    }

    const selectedStillVisible = filteredSessions.some((session) => session.id === selectedSessionId);
    if (!selectedStillVisible) {
      setSelectedSessionId(filteredSessions[0].id);
    }
  }, [filteredSessions, selectedSessionId]);

  const selectedSession =
    filteredSessions.find((session) => session.id === selectedSessionId) ||
    sessions.find((session) => session.id === selectedSessionId) ||
    null;

  const visibleQaItems = useMemo(
    () => (selectedSession?.qaList || []).slice(0, visibleQaCount),
    [selectedSession?.qaList, visibleQaCount]
  );

  useEffect(() => {
    setVisibleQaCount(INITIAL_QA_COUNT);
  }, [selectedSessionId]);

  const handleDeleteSession = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    try {
      await interviewService.deleteSession(deleteTarget.id);
      setSessions((current) => current.filter((session) => session.id !== deleteTarget.id));
      toast.success("Interview session deleted");
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete session");
    } finally {
      setDeleting(false);
    }
  };

  const toggleQaVisibility = () => {
    const totalQa = selectedSession?.qaList?.length || 0;
    if (visibleQaCount >= totalQa) {
      setVisibleQaCount(INITIAL_QA_COUNT);
      return;
    }

    setVisibleQaCount((current) => Math.min(current + QA_INCREMENT, totalQa));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] border border-dashed border-white/10 p-12 text-center glass-card">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
          <Mic className="h-8 w-8 text-cyan-400" />
        </div>
        <h2 className="mb-2 text-2xl font-display font-bold text-white">No interview sessions yet</h2>
        <p className="mb-6 max-w-xl text-slate-400">
          Start a new interview to save questions, answers, scores, and your complete practice history.
        </p>
        <Link
          href="/interview"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-sm font-medium text-white transition-all hover:from-violet-500 hover:to-cyan-500"
        >
          Start Interview
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const totalQa = selectedSession?.qaList?.length || 0;
  const canCollapse = totalQa > INITIAL_QA_COUNT;
  const showingAllQa = visibleQaCount >= totalQa;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
      >
        <div>
          <h2 className="mb-1 text-3xl font-display font-bold text-white">Interview History</h2>
          <p className="max-w-2xl text-slate-400">
            Review saved sessions without dumping every answer on screen. Open a session, scan the first Q&A quickly,
            and expand only when you need more detail.
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search previous interviews or questions..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
          />
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[1.75rem] border border-white/8 p-4 glass-card"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Saved Sessions</p>
              <p className="text-xs text-slate-500">{filteredSessions.length} results</p>
            </div>
            <Link href="/interview" className="text-sm text-cyan-400 transition-colors hover:text-cyan-300">
              New interview
            </Link>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
              No sessions matched your search.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredSessions.map((session) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedSessionId(session.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedSessionId(session.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "mb-3 w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-200",
                    selectedSessionId === session.id
                      ? "border-violet-500/25 bg-violet-500/10"
                      : "border-white/8 bg-white/5 hover:border-cyan-400/20 hover:bg-white/8"
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{truncateText(session.sessionTitle, 38)}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {session.resumeFileName || "Standalone interview session"}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      {session.overallScore !== undefined && (
                        <div className="text-right">
                          <p
                            className="text-lg font-display font-bold"
                            style={{ color: getScoreColor((session.overallScore || 0) * 10) }}
                          >
                            {session.overallScore?.toFixed(1) || "0.0"}
                          </p>
                          <p className="text-[11px] text-slate-500">score</p>
                        </div>
                      )}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(session);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-300 transition-colors hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDate(session.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      {session.questionsAsked || session.qaList?.length || 0} questions
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[1.75rem] border border-white/8 p-6 glass-card"
        >
          {selectedSession ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="mb-1 text-2xl font-display font-bold text-white">{selectedSession.sessionTitle}</h3>
                  <p className="text-sm text-slate-400">
                    {selectedSession.resumeFileName || "Standalone interview session"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDate(selectedSession.createdAt)}
                    </span>
                    <span>{selectedSession.questionsAnswered} answered</span>
                    <span>
                      {(selectedSession.questionsAsked || selectedSession.qaList?.length || 0) -
                        selectedSession.questionsAnswered}{" "}
                      skipped
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {selectedSession.resumeId && (
                    <Link
                      href={`/interview?resumeId=${selectedSession.resumeId}`}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Practice Again
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    onClick={() => setDeleteTarget(selectedSession)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-200 transition-colors hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center">
                    <div className="flex items-center gap-1 text-sm font-semibold text-white">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{selectedSession.overallScore?.toFixed(1) || "0.0"}/10</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">overall score</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Questions saved", value: selectedSession.questionsAsked || selectedSession.qaList?.length || 0 },
                  { label: "Answers submitted", value: selectedSession.questionsAnswered },
                  { label: "Completed at", value: formatDate(selectedSession.createdAt) },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/8 px-4 py-3 glass">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Saved Q&A</p>
                    <p className="text-xs text-slate-500">
                      Showing {Math.min(visibleQaCount, totalQa)} of {totalQa} responses
                    </p>
                  </div>
                  {canCollapse && (
                    <button
                      onClick={toggleQaVisibility}
                      className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {showingAllQa ? "See Less" : `See More (${Math.max(totalQa - visibleQaCount, 0)} left)`}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {visibleQaItems.map((item, index) => (
                    <motion.div
                      key={`${selectedSession.id}-${item.question}-${index}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-5"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cnQuestionType(item.questionType)}>{item.questionType}</span>
                          {item.skipped && (
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                              Skipped
                            </span>
                          )}
                        </div>
                        {!item.skipped && item.score !== undefined && (
                          <span
                            className="text-lg font-display font-bold"
                            style={{ color: getScoreColor((item.score || 0) * 10) }}
                          >
                            {item.score}/10
                          </span>
                        )}
                      </div>

                      <p className="mb-3 text-base font-medium text-white">{item.question}</p>

                      <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                        <p className="mb-1 text-xs uppercase tracking-[0.18em] text-slate-500">Your answer</p>
                        <p className="text-sm leading-relaxed text-slate-300">
                          {item.skipped ? "No answer submitted for this question." : item.answer}
                        </p>
                      </div>

                      {!item.skipped && item.improvedAnswer && (
                        <div className="mt-4 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-violet-300/80">
                            Suggested improvement
                          </p>
                          <p className="text-sm leading-relaxed text-slate-300">{item.improvedAnswer}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[480px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
                <FileSearch className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="mb-2 text-xl font-display font-bold text-white">Select a session</h3>
              <p className="max-w-md text-sm text-slate-400">
                Pick a saved interview from the left side to inspect the questions, submitted answers, and AI-backed
                feedback.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete interview session?"
        description={`This permanently deletes "${deleteTarget?.sessionTitle || "this session"}" and all of its saved Q&A feedback.`}
        confirmLabel="Delete"
        isLoading={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteSession}
      />
    </div>
  );
}

export default function InterviewHistoryPage() {
  return (
    <AppShell title="Interview History">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          </div>
        }
      >
        <InterviewHistoryContent />
      </Suspense>
    </AppShell>
  );
}

function cnQuestionType(type: string) {
  if (type === "TECHNICAL") {
    return "rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300";
  }
  if (type === "PROJECT") {
    return "rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300";
  }
  return "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300";
}
