"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Loader2,
  Menu,
  Mic,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { BRAND } from "@/lib/brand";
import { isActiveRoute } from "@/lib/routes";
import { useAuthStore } from "@/lib/store";
import { HistoryItem, SessionResponse } from "@/lib/types";
import { interviewService, resolveAssetUrl, resumeService } from "@/services/api";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";

interface Props {
  title?: string;
}

type ActivePanel = "notifications" | "profile" | null;

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  href: string;
  date: string;
  kind: "interview" | "resume" | "suggestion";
}

const featureNavItems = [
  { href: "/resume/upload", label: "Upload Resume", icon: Upload },
  { href: "/resume/builder", label: "Resume Builder", icon: Wand2 },
  { href: "/interview", label: "Interview", icon: Mic },
] as const;

const authNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ...featureNavItems,
] as const;

// Extra dropdown links in the "More" area of the profile panel
const moreLinks = [
  { href: "/cover-letter", label: "Cover Letter AI" },
  { href: "/resume/match", label: "Job Matcher" },
] as const;


const panelMotion = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.18, ease: "easeOut" },
};

export function Navbar({ title = "Dashboard" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, initAuth, logout } = useAuthStore();

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resumeHistory, setResumeHistory] = useState<HistoryItem[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    // Self-initialize auth from localStorage on any page using Navbar
    // No-op if already hydrated (guard is in the store)
    initAuth();
    setActivePanel(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setActivePanel(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (activePanel !== "notifications" || !isAuthenticated) {
      return;
    }

    void loadActivity();
  }, [activePanel, isAuthenticated]);

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
      toast.error("Failed to load notifications");
    } finally {
      setActivityLoading(false);
    }
  };

  const handleLogout = () => {
    // Show confirmation dialog instead of immediately logging out
    setActivePanel(null);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    toast.success("Signed out successfully");
    router.push("/");
  };

  const renderAvatar = (sizeClass = "h-7 w-7") => {
    if (user?.profilePicture) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveAssetUrl(user.profilePicture)}
          alt={user.name}
          className={cn(sizeClass, "rounded-xl object-cover")}
        />
      );
    }

    return (
      <div
        className={cn(
          sizeClass,
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-bold text-white"
        )}
      >
        {getInitials(user?.name || "U")}
      </div>
    );
  };

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    sessions.slice(0, 3).forEach((session) => {
      items.push({
        id: `session-${session.id}`,
        title: "Interview session complete",
        body: `"${session.sessionTitle}" — ${session.questionsAnswered} questions answered.`,
        href: `/interview/history?sessionId=${session.id}`,
        date: session.createdAt,
        kind: "interview",
      });
    });

    resumeHistory
      .filter((item) => item.analysisId && item.analyzedAt)
      .slice(0, 3)
      .forEach((resume) => {
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
          body: `Improvements and tailored practice prompts are ready for ${resume.fileName}.`,
          href: `/resume/analysis?id=${resume.analysisId}`,
          date: resume.analyzedAt as string,
          kind: "suggestion",
        });
      });

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [resumeHistory, sessions]);

  const navItems = isAuthenticated ? authNavItems : featureNavItems;

  return (
    <div
      ref={rootRef}
      className="relative sticky top-0 z-30 border-b border-white/8 bg-slate-950/90 shadow-md shadow-slate-950/40 backdrop-blur-xl"
    >
      {/* ── Main bar ── */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-10">

        {/* Logo */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-xl group"
        >
          {/* Logo wrapper — dark pill with violet/cyan glow, crisp shadow */}
          <div className="relative flex-shrink-0">
            {/* Outer ambient glow — grows on hover */}
            <div className="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-violet-500/40 via-indigo-500/20 to-cyan-500/30 blur-[7px] opacity-80 group-hover:opacity-100 group-hover:blur-[10px] transition-all duration-300" />
            {/* Inner dark pill — gives logo a clean backdrop on the dark navbar */}
            <div className="relative rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-[4px] ring-1 ring-white/[0.12] shadow-[0_2px_12px_rgba(109,40,217,0.35),0_1px_3px_rgba(0,0,0,0.6)] group-hover:ring-violet-400/40 group-hover:shadow-[0_4px_20px_rgba(109,40,217,0.5),0_1px_4px_rgba(0,0,0,0.7)] transition-all duration-300">
              <Image
                src="/logo.png"
                alt={`${BRAND.name} logo`}
                width={40}
                height={40}
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-lg"
              />
            </div>
          </div>
          <div>
            <BrandWordmark className="text-[1.25rem] sm:text-[1.4rem]" />
            <p className="hidden text-[10px] text-slate-500 sm:block">Premium AI interview prep</p>
          </div>
        </Link>

        {/* Desktop nav — hidden below lg */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
                  active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/6 hover:text-white"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-violet-300" : "")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Hamburger — shows only below lg, ONLY for nav links */}
          <button
            onClick={() => setMobileOpen((current) => !current)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-300 transition-all duration-200 hover:border-white/20 hover:text-white lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setActivePanel((current) => (current === "notifications" ? null : "notifications"))}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-300 transition-all duration-200 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white"
                  aria-label="View notifications"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
                  )}
                </button>

                {/* ── Notifications panel ── */}
                <AnimatePresence>
                  {activePanel === "notifications" && (
                    <motion.div
                      {...panelMotion}
                      className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-white/8 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
                    >
                      <div className="border-b border-white/6 px-4 py-3">
                        <p className="text-sm font-medium text-white">Notifications</p>
                        <p className="text-xs text-slate-500">Interview updates, resume analysis, and new guidance.</p>
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
                                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
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
                                <p className="mt-1 text-sm text-slate-400">{item.body}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile button — clicking this ONLY opens the profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActivePanel((current) => (current === "profile" ? null : "profile"))}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-2 text-slate-300 transition-all duration-200 hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
                  aria-label="Open profile menu"
                >
                  {renderAvatar()}
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {/* ── Profile dropdown — triggered ONLY by profile button ── */}
                <AnimatePresence>
                  {activePanel === "profile" && (
                    <motion.div
                      {...panelMotion}
                      className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(92vw,260px)] overflow-hidden rounded-3xl border border-white/8 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
                    >
                      {user && (
                        <div className="flex items-center gap-3 border-b border-white/6 px-4 py-3.5">
                          {renderAvatar("h-9 w-9")}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-0.5 p-2">
                        <Link
                          href="/profile"
                          onClick={() => setActivePanel(null)}
                          className="rounded-2xl px-4 py-2.5 text-sm text-slate-100 transition-all hover:bg-white/5"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/history"
                          onClick={() => setActivePanel(null)}
                          className="rounded-2xl px-4 py-2.5 text-sm text-slate-100 transition-all hover:bg-white/5"
                        >
                          History
                        </Link>
                        {moreLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setActivePanel(null)}
                            className="rounded-2xl px-4 py-2.5 text-sm text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                          >
                            {link.label}
                          </Link>
                        ))}
                        <div className="mx-2 my-1 h-px bg-white/8" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="rounded-2xl px-4 py-2.5 text-left text-sm font-medium text-rose-300 transition-all hover:bg-rose-500/10"
                        >
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-1.5 lg:flex">
              <div className="mr-1 h-4 w-px bg-white/15" />
              <Link href="/auth/login" className="px-3 py-2 text-sm text-slate-300 transition-colors hover:text-white">
                Sign In
              </Link>
              <Link
                href="/pricing"
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-violet-500 hover:to-cyan-500"
              >
                Pricing
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile nav dropdown — ONLY nav links, no profile/history/signout ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="border-t border-white/8 bg-slate-950/95 px-4 py-3 lg:hidden"
          >
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "border-violet-500/25 bg-gradient-to-r from-violet-600/20 to-cyan-600/10 text-white"
                        : "border-white/8 bg-white/4 text-slate-200 hover:border-cyan-400/20 hover:bg-cyan-500/10 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-violet-300" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}

              {/* Auth links for unauthenticated users only */}
              {!isAuthenticated && (
                <div className="mt-2 flex gap-2 border-t border-white/8 pt-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-center text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2.5 text-center text-sm font-medium text-white"
                  >
                    Pricing
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sign Out Confirmation Dialog ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            {/* Backdrop — dark enough to isolate the dialog */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.82)" }}
              onClick={() => setShowLogoutConfirm(false)}
            />
            {/* Dialog — fully opaque, no transparency */}
            <motion.div
              initial={{ opacity: 0, scale: 0.90, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.90, y: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-1/2 top-1/2 z-[51] w-[min(90vw,380px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl p-6"
              style={{
                background: "linear-gradient(145deg, #13151f, #0d0f1a)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Icon */}
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.30)" }}>
                <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">Sign out?</h3>
              <p className="mt-1.5 text-sm" style={{ color: "#94a3b8" }}>
                You will be returned to the home page. Your data is safe and synced.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-2xl py-2.5 text-sm font-medium transition-all hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,0.10)", color: "#94a3b8", background: "rgba(255,255,255,0.03)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 rounded-2xl py-2.5 text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#e11d48,#f43f5e)", boxShadow: "0 4px 16px rgba(244,63,94,0.35)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(244,63,94,0.5)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(244,63,94,0.35)"}
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
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
