"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bell, Brain, FileText, Loader2, Menu, Mic, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BRAND } from "@/lib/brand";
import { useAuthStore } from "@/lib/store";
import { HistoryItem, SessionResponse } from "@/lib/types";
import { interviewService, resumeService } from "@/services/api";
import { cn, formatDate, formatRelativeTime, getInitials, truncateText } from "@/lib/utils";

interface Props {
  onMenuClick: () => void;
  title?: string;
}

type ActivePanel = "search" | "notifications" | null;

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  kind: "session" | "question";
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  href: string;
  date: string;
  kind: "interview" | "resume" | "suggestion";
}

const panelMotion = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.18, ease: "easeOut" },
};

export function Navbar({ onMenuClick, title = "Dashboard" }: Props) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [query, setQuery] = useState("");
  const [resumeHistory, setResumeHistory] = useState<HistoryItem[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    setActivePanel(null);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setActivePanel(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const loadActivity = async () => {
    setActivityLoading(true);
    try {
      const [resumeResponse, sessionResponse] = await Promise.all([
        resumeService.getHistory(),
        interviewService.getHistory(),
      ]);

      setResumeHistory(resumeResponse.data);
      setSessions(sessionResponse.data);
    } catch {
      toast.error("Failed to load search and notification data");
    } finally {
      setActivityLoading(false);
    }
  };

  const openPanel = async (panel: ActivePanel, allowToggle = true) => {
    const nextPanel = allowToggle && activePanel === panel ? null : panel;
    setActivePanel(nextPanel);

    if (nextPanel) {
      await loadActivity();
    }
  };

  const analyzedResumes = useMemo(
    () => resumeHistory.filter((item) => item.analysisId && item.analyzedAt),
    [resumeHistory]
  );

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const results = new Map<string, SearchResult>();

    const addResult = (result: SearchResult) => {
      if (!results.has(result.id)) {
        results.set(result.id, result);
      }
    };

    const relevantSessions = normalized ? sessions : sessions.slice(0, 5);

    relevantSessions.forEach((session) => {
      const sessionText = [session.sessionTitle, session.resumeFileName].filter(Boolean).join(" ").toLowerCase();
      if (!normalized || sessionText.includes(normalized)) {
        addResult({
          id: `session-${session.id}`,
          title: session.sessionTitle,
          subtitle: session.resumeFileName || "Interview session",
          meta: formatDate(session.createdAt),
          href: `/interview/history?sessionId=${session.id}`,
          kind: "session",
        });
      }

      (session.qaList || []).forEach((qa, index) => {
        const questionText = `${qa.question} ${qa.answer || ""}`.toLowerCase();
        if (normalized && questionText.includes(normalized)) {
          addResult({
            id: `question-${session.id}-${index}`,
            title: truncateText(qa.question, 90),
            subtitle: session.sessionTitle,
            meta: qa.skipped ? "Skipped question" : "Question match",
            href: `/interview/history?sessionId=${session.id}`,
            kind: "question",
          });
        }
      });
    });

    return Array.from(results.values()).slice(0, 8);
  }, [query, sessions]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    sessions.slice(0, 3).forEach((session) => {
      items.push({
        id: `interview-${session.id}`,
        title: "Interview completed",
        body: `${session.sessionTitle} is ready to review with ${session.questionsAnswered} answered questions.`,
        href: `/interview/history?sessionId=${session.id}`,
        date: session.createdAt,
        kind: "interview",
      });
    });

    analyzedResumes.slice(0, 3).forEach((resume) => {
      items.push({
        id: `resume-${resume.analysisId}`,
        title: "Resume analyzed",
        body: `${resume.fileName} received an ATS score of ${resume.atsScore ?? "--"}.`,
        href: `/resume/analysis?id=${resume.analysisId}`,
        date: resume.analyzedAt as string,
        kind: "resume",
      });

      items.push({
        id: `suggestion-${resume.analysisId}`,
        title: "New suggestions available",
        body: `Quick practice prompts and tailored improvements are ready for ${resume.fileName}.`,
        href: `/resume/analysis?id=${resume.analysisId}`,
        date: resume.analyzedAt as string,
        kind: "suggestion",
      });
    });

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [analyzedResumes, sessions]);

  const renderAvatar = (size = "h-8 w-8") => {
    if (user?.profilePicture) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.profilePicture}
          alt={user.name}
          className={cn(size, "rounded-full border border-white/10 object-cover")}
        />
      );
    }

    return (
      <div
        className={cn(
          size,
          "flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-bold text-white"
        )}
      >
        {user ? getInitials(user.name) : "?"}
      </div>
    );
  };

  const iconButtonClass =
    "relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-slate-300 transition-all duration-200 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white";

  return (
    <div ref={rootRef} className="relative sticky top-0 z-30 border-b border-white/6 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-5 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button onClick={onMenuClick} className={cn(iconButtonClass, "lg:hidden")}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 truncate text-sm font-semibold text-white sm:text-base">
              {title}
              <ArrowRight className="h-4 w-4 shrink-0 text-cyan-400" />
            </p>
            <p className="hidden text-xs text-slate-500 md:block">{BRAND.name}</p>
          </div>
        </div>

        <div className="relative hidden w-full max-w-[20rem] md:block">
          <div className="flex h-11 items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 transition-all duration-200 focus-within:bg-white/6">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => openPanel("search", false)}
              placeholder="Search interviews and questions..."
              className="h-full w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>

          <AnimatePresence>
            {activePanel === "search" && (
              <motion.div
                {...panelMotion}
                className="absolute left-0 right-0 top-[calc(100%+12px)] overflow-hidden rounded-3xl border border-white/8 bg-slate-950/95 shadow-2xl shadow-black/30"
              >
                <div className="border-b border-white/6 px-4 py-3">
                  <p className="text-sm font-medium text-white">Search previous interviews</p>
                  <p className="text-xs text-slate-500">Find sessions and question matches instantly.</p>
                </div>

                {activityLoading ? (
                  <LoadingPanelCopy label="Loading activity..." />
                ) : searchResults.length === 0 ? (
                  <EmptyPanelCopy label="No interview history matched your search." />
                ) : (
                  <div className="max-h-[380px] overflow-y-auto p-2">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={() => setActivePanel(null)}
                        className="flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/5"
                      >
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/5">
                          {result.kind === "session" ? (
                            <Mic className="h-4 w-4 text-cyan-400" />
                          ) : (
                            <Search className="h-4 w-4 text-violet-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{result.title}</p>
                          <p className="truncate text-sm text-slate-400">{result.subtitle}</p>
                          <p className="mt-1 text-xs text-slate-500">{result.meta}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => openPanel("search")} className={cn(iconButtonClass, "md:hidden")}>
            <Search className="h-5 w-5" />
          </button>

          <button onClick={() => openPanel("notifications")} className={iconButtonClass}>
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
            )}
          </button>

          <Link href="/profile" className={cn(iconButtonClass, "w-auto px-1.5")}>
            {renderAvatar()}
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {activePanel === "search" && (
          <motion.div {...panelMotion} className="border-t border-white/6 px-4 py-4 md:hidden">
            <div className="rounded-3xl border border-white/8 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search interviews and questions..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="mt-3 rounded-3xl border border-white/8 bg-slate-950/95">
              {activityLoading ? (
                <LoadingPanelCopy label="Loading activity..." />
              ) : searchResults.length === 0 ? (
                <EmptyPanelCopy label="No matching interview history found." />
              ) : (
                <div className="max-h-[320px] overflow-y-auto p-2">
                  {searchResults.map((result) => (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={() => setActivePanel(null)}
                      className="flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/5"
                    >
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/5">
                        {result.kind === "session" ? (
                          <Mic className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Search className="h-4 w-4 text-violet-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{result.title}</p>
                        <p className="truncate text-sm text-slate-400">{result.subtitle}</p>
                        <p className="mt-1 text-xs text-slate-500">{result.meta}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanel === "notifications" && (
          <motion.div
            {...panelMotion}
            className="absolute right-4 top-[calc(100%+12px)] z-40 w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-white/8 bg-slate-950/95 shadow-2xl shadow-black/30"
          >
            <div className="border-b border-white/6 px-4 py-3">
              <p className="text-sm font-medium text-white">Notifications</p>
              <p className="text-xs text-slate-500">Interview updates, resume analysis, and new suggestions.</p>
            </div>

            {activityLoading ? (
              <LoadingPanelCopy label="Loading notifications..." />
            ) : notifications.length === 0 ? (
              <EmptyPanelCopy label="No notifications yet." />
            ) : (
              <div className="max-h-[420px] overflow-y-auto p-2">
                {notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setActivePanel(null)}
                    className="flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/5"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border",
                        item.kind === "interview" && "border-cyan-500/20 bg-cyan-500/10",
                        item.kind === "resume" && "border-violet-500/20 bg-violet-500/10",
                        item.kind === "suggestion" && "border-emerald-500/20 bg-emerald-500/10"
                      )}
                    >
                      {item.kind === "interview" && <Mic className="h-4 w-4 text-cyan-400" />}
                      {item.kind === "resume" && <FileText className="h-4 w-4 text-violet-400" />}
                      {item.kind === "suggestion" && <Sparkles className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <span className="shrink-0 text-xs text-slate-500">{formatRelativeTime(item.date)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{truncateText(item.body, 120)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingPanelCopy({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptyPanelCopy({ label }: { label: string }) {
  return <div className="px-4 py-8 text-center text-sm text-slate-500">{label}</div>;
}
