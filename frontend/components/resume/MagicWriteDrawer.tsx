"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { resumeService } from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface IssueAnnotation {
  section: string;
  severity: "high" | "medium" | "low";
  issue: string;
  suggestion: string;
  lineHint: string;
  magicReplacement?: string;
}

interface MagicWriteDrawerProps {
  annotations: IssueAnnotation[];
  isOpen: boolean;
  onClose: () => void;
  initialIssueIdx?: number;   // jump to a specific card when opened from inline tooltip
  resumeContext?: string;      // first ~1500 chars of extracted text for Regenerate calls
}

// ─── Filter type ──────────────────────────────────────────────────────────────
type FilterKey = "all" | "high" | "medium" | "low";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "All",
  high: "Critical",
  medium: "Medium",
  low: "Low",
};

const FILTER_COLORS: Record<FilterKey, string> = {
  all: "border-white/10 text-slate-400 hover:text-white hover:border-white/20",
  high: "border-rose-500/30 text-rose-400 hover:border-rose-500/50",
  medium: "border-amber-500/30 text-amber-400 hover:border-amber-500/50",
  low: "border-blue-500/30 text-blue-400 hover:border-blue-500/50",
};

const FILTER_ACTIVE: Record<FilterKey, string> = {
  all: "bg-white/8 border-white/20 text-white",
  high: "bg-rose-500/12 border-rose-500/40 text-rose-300",
  medium: "bg-amber-500/12 border-amber-500/40 text-amber-300",
  low: "bg-blue-500/12 border-blue-500/40 text-blue-300",
};

// ─── Severity badge ───────────────────────────────────────────────────────────
const SEV_BADGE: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  low: "bg-blue-500/15 text-blue-300 border-blue-500/25",
};

const SEV_LABEL: Record<string, string> = {
  high: "Critical",
  medium: "Medium",
  low: "Low",
};

// ─── Derive a short issue-type badge from the issue string ────────────────────
function deriveIssueTag(issue: string): string {
  const lower = issue.toLowerCase();
  if (lower.includes("metric") || lower.includes("number") || lower.includes("quantif")) return "No metrics";
  if (lower.includes("weak verb") || lower.includes("action verb") || lower.includes("passive")) return "Weak verb";
  if (lower.includes("vague") || lower.includes("generic") || lower.includes("filler")) return "Vague";
  if (lower.includes("short") || lower.includes("brief") || lower.includes("too short")) return "Too short";
  if (lower.includes("repeat") || lower.includes("overused")) return "Repeated word";
  if (lower.includes("outcome") || lower.includes("result") || lower.includes("impact")) return "No outcome";
  if (lower.includes("passive voice")) return "Passive voice";
  return "Issue";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MagicWriteDrawer({
  annotations,
  isOpen,
  onClose,
  initialIssueIdx,
  resumeContext,
}: MagicWriteDrawerProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  // Per-card overridden improved text (after Regenerate)
  const [overrides, setOverrides] = useState<Record<number, string>>({});

  // Only show cards where lineHint is non-empty
  const validAnnotations = useMemo(
    () => annotations.filter((a) => a.lineHint && a.lineHint.trim().length > 0),
    [annotations]
  );

  // Filtered list based on active filter
  const filtered = useMemo(() => {
    if (activeFilter === "all") return validAnnotations;
    return validAnnotations.filter((a) => a.severity === activeFilter);
  }, [validAnnotations, activeFilter]);

  const total = filtered.length;
  const current = filtered[currentIdx];

  // When opened with a specific issue index (from inline tooltip "Fix with Magic Write")
  useEffect(() => {
    if (!isOpen) return;
    if (initialIssueIdx !== undefined && initialIssueIdx >= 0) {
      // Find the card that corresponds to this annotation index in the full list
      const ann = validAnnotations[initialIssueIdx];
      if (!ann) return;
      setActiveFilter("all");
      const idx = validAnnotations.indexOf(ann);
      if (idx >= 0) setCurrentIdx(idx);
    }
  }, [isOpen, initialIssueIdx, validAnnotations]);

  // Clamp currentIdx when filter changes
  useEffect(() => {
    setCurrentIdx(0);
  }, [activeFilter]);

  // Reset copied state on navigation
  useEffect(() => {
    setCopied(false);
  }, [currentIdx]);

  const improvedText =
    current
      ? (overrides[validAnnotations.indexOf(current)] ?? current.magicReplacement ?? "")
      : "";

  const handleCopy = () => {
    if (!improvedText) return;
    navigator.clipboard.writeText(improvedText);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!current || regenerating) return;
    setRegenerating(true);
    try {
      const { data } = await resumeService.regenerateSuggestion({
        originalText: current.lineHint,
        issueType: deriveIssueTag(current.issue),
        section: current.section,
        resumeContext: resumeContext || "",
      });
      if (data.improvedText) {
        const globalIdx = validAnnotations.indexOf(current);
        setOverrides((prev) => ({ ...prev, [globalIdx]: data.improvedText }));
        toast.success("Fresh suggestion generated!");
      }
    } catch {
      toast.error("Regenerate failed. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const counts: Record<FilterKey, number> = {
    all: validAnnotations.length,
    high: validAnnotations.filter((a) => a.severity === "high").length,
    medium: validAnnotations.filter((a) => a.severity === "medium").length,
    low: validAnnotations.filter((a) => a.severity === "low").length,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] border-t border-white/10 bg-[#0a0f1e] shadow-2xl shadow-black/60"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            <div className="px-6 pb-8 pt-2">
              {/* ── Header ── */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Magic Write</p>
                    <p className="text-xs text-slate-500">AI-improved suggestions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Navigation */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                      disabled={currentIdx === 0 || total === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[3rem] text-center text-xs text-slate-500">
                      {total === 0 ? "0/0" : `${currentIdx + 1} / ${total}`}
                    </span>
                    <button
                      onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
                      disabled={currentIdx >= total - 1 || total === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ── Filter Chips ── */}
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => {
                  const isActive = activeFilter === key;
                  const count = counts[key];
                  if (key !== "all" && count === 0) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        isActive ? FILTER_ACTIVE[key] : FILTER_COLORS[key]
                      }`}
                    >
                      {FILTER_LABELS[key]}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          isActive ? "bg-white/10" : "bg-white/5"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ── Card ── */}
              {current ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeFilter}-${currentIdx}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* Card header row: issue tag + section */}
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEV_BADGE[current.severity]}`}>
                          {SEV_LABEL[current.severity]}
                        </span>
                        <span className="rounded-full border border-slate-700/60 bg-white/4 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                          {deriveIssueTag(current.issue)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        {current.section}
                      </span>
                    </div>

                    {/* Side by side comparison */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Original */}
                      <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-rose-400/80">
                          Original
                        </p>
                        <p className="mb-3 text-sm leading-relaxed text-slate-400">
                          {current.lineHint}
                        </p>
                        <p className="text-xs leading-relaxed text-slate-600 border-t border-rose-500/10 pt-2">
                          💬 {current.issue}
                        </p>
                      </div>

                      {/* AI Improved */}
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
                          ✨ AI Improved
                        </p>
                        {improvedText ? (
                          <p className="text-sm leading-relaxed text-white">
                            {improvedText}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-600 italic">
                            No suggestion available — click Regenerate to generate one.
                          </p>
                        )}
                        {current.suggestion && (
                          <p className="text-xs leading-relaxed text-slate-600 border-t border-emerald-500/10 pt-2 mt-3">
                            💡 {current.suggestion}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2.5">
                      {/* Copy */}
                      <button
                        onClick={handleCopy}
                        disabled={!improvedText}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition-all hover:bg-white/5 hover:text-white disabled:opacity-40"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Copied!" : "Copy"}
                      </button>

                      {/* Regenerate */}
                      <button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 py-2.5 text-sm font-semibold text-violet-300 transition-all hover:bg-violet-500/18 hover:text-violet-200 disabled:opacity-60"
                      >
                        <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
                        {regenerating ? "Generating…" : "Regenerate"}
                      </button>
                    </div>

                    {/* Progress dots */}
                    {total > 1 && (
                      <div className="mt-4 flex items-center justify-center gap-1.5">
                        {filtered.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentIdx(i)}
                            className={`rounded-full transition-all ${
                              i === currentIdx
                                ? "h-1.5 w-4 bg-violet-400"
                                : "h-1.5 w-1.5 bg-white/20 hover:bg-white/30"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                  <p className="text-sm text-slate-400">
                    {validAnnotations.length === 0
                      ? "No suggestions available yet. Run analysis first."
                      : "No issues at this severity level."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}