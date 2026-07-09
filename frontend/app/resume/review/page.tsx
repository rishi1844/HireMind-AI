"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, Download, Loader2,
  Mic, RotateCcw, Sparkles, Tag, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { resumeService } from "@/services/api";
import { ScoreSidebar } from "@/components/resume/ScoreSidebar";
import { MagicWriteDrawer } from "@/components/resume/MagicWriteDrawer";
import { ResumeViewer } from "@/components/resume/ResumeViewer";

// ─── Types ────────────────────────────────────────────────────────────────────
interface IssueAnnotation {
  section: string;
  severity: "high" | "medium" | "low";
  issue: string;
  suggestion: string;
  lineHint: string;
  magicReplacement?: string;
}

interface BulletItem {
  original: string;
  improved: string;
  problems: string[];
  section: string;
}

interface KeywordItem {
  keyword: string;
  present: boolean;
}

interface Category {
  score: number;
  issues: string[];
}

interface ResumeData {
  resumeId: string;
  fileName: string;
  filePath: string | null;
  extractedText: string;
  issueAnnotations: IssueAnnotation[];
  analysisId: string | null;
  atsScore: number | null;
  categories: {
    readability?: Category;
    impact?: Category;
    brevity?: Category;
    style?: Category;
  };
  bulletAnalysis: BulletItem[];
  repeatedWords: string[];
  industryKeywords: KeywordItem[];
}

// ─── JD Match Modal ───────────────────────────────────────────────────────────
function JdMatchModal({
  resumeId,
  onClose,
}: {
  resumeId: string;
  onClose: () => void;
}) {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleMatch = async () => {
    if (!jd.trim()) { toast.error("Paste a job description first"); return; }
    setLoading(true);
    try {
      const { data } = await resumeService.matchJd(Number(resumeId), jd.trim());
      setResult(data);
    } catch {
      toast.error("JD match failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="relative z-10 w-full max-w-lg rounded-t-[2rem] rounded-b-none sm:rounded-[2rem] border border-white/10 bg-[#0a0f1e] p-6 shadow-2xl shadow-black/60 max-h-[85vh] overflow-y-auto"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">JD Match</h3>
            <p className="text-xs text-slate-500">Paste job description to see keyword gaps</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!result ? (
          <>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={8}
              placeholder="Paste the full job description here…"
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 transition-all"
            />
            <button
              onClick={handleMatch}
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 py-3.5 text-sm font-semibold text-white transition-all hover:from-cyan-500 hover:to-violet-500 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              {loading ? "Analyzing…" : "Analyze Match"}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Score */}
            <div className="rounded-2xl border border-white/8 p-4 text-center">
              <p className="text-4xl font-bold text-white">{result.matchScore}<span className="text-lg text-slate-500">/100</span></p>
              <p className="mt-1 text-sm font-medium" style={{ color: result.matchScore >= 70 ? "#10b981" : result.matchScore >= 50 ? "#f59e0b" : "#f43f5e" }}>
                {result.verdict}
              </p>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{result.summary}</p>
            </div>

            {/* Keywords */}
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Matched Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords?.map((kw: string) => (
                    <span key={kw} className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-300">{kw}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-rose-400 flex items-center gap-1">
                  <X className="h-3.5 w-3.5" /> Missing Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords?.map((kw: string) => (
                    <span key={kw} className="rounded-full bg-rose-500/15 border border-rose-500/20 px-2.5 py-0.5 text-xs text-rose-300">{kw}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips */}
            {result.tailoringTips?.length > 0 && (
              <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4">
                <p className="mb-2 text-xs font-semibold text-cyan-400">Tailoring Tips</p>
                <ul className="space-y-1.5">
                  {result.tailoringTips.map((tip: string, i: number) => (
                    <li key={i} className="text-xs text-slate-400 leading-relaxed flex items-start gap-2">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-cyan-500" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setResult(null)}
              className="w-full rounded-2xl border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Try Another JD
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function ReviewContent() {
  const params = useSearchParams();
  const router = useRouter();
  const resumeId = params.get("resumeId");
  const analysisId = params.get("id");

  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [magicWriteOpen, setMagicWriteOpen] = useState(false);
  const [magicWriteInitialIdx, setMagicWriteInitialIdx] = useState<number | undefined>(undefined);
  const [jdModalOpen, setJdModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [appliedFixes, setAppliedFixes] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!resumeId || !analysisId) { router.push("/history"); return; }
    resumeService.getResumeText(Number(resumeId))
      .then((r) => {
        setData(r.data);
      })
      .catch(() => toast.error("Failed to load resume"))
      .finally(() => setLoading(false));
  }, [resumeId, analysisId, router]);

  const handleAnnotationApply = useCallback((lineHint: string, replacement: string) => {
    setAppliedFixes((prev) => new Map(prev).set(lineHint, replacement));
    toast.success("Fix noted! Download improved version to get all fixes.");
  }, []);

  const handleBulletApply = useCallback((original: string, improved: string) => {
    setAppliedFixes((prev) => new Map(prev).set(original, improved));
  }, []);

  const handleDownloadImproved = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      let text = data.extractedText;
      appliedFixes.forEach((replacement, original) => {
        text = text.replace(original, replacement);
      });
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 50;
      const maxW = doc.internal.pageSize.getWidth() - margin * 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const lines = doc.splitTextToSize(text, maxW);
      let y = margin;
      const lineH = 15;
      lines.forEach((line: string) => {
        if (y + lineH > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineH;
      });
      const fname = (data.fileName || "resume").replace(/\.pdf$/i, "");
      doc.save(`Improved_${fname}.pdf`);
      toast.success("Improved resume downloaded!");
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          <p className="text-sm text-slate-400">Loading resume…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const annotations = data.issueAnnotations || [];
  const bullets = data.bulletAnalysis || [];
  const keywords = data.industryKeywords || [];
  const repeated = data.repeatedWords || [];
  const fixCount = appliedFixes.size;
  // Count annotations that have a lineHint (these are the Magic Write cards)
  const magicWriteCount = annotations.filter((a) => a.lineHint && a.lineHint.trim()).length;

  return (
    <div className="flex h-[calc(100vh-72px)] flex-col overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/6 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            History
          </Link>
          <div>
            <h1 className="text-base font-bold text-white leading-none">Resume Review</h1>
            <p className="mt-0.5 text-xs text-slate-500 truncate max-w-[200px]">{data.fileName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fixCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
              <CheckCircle className="h-3 w-3" /> {fixCount} fixed
            </span>
          )}

          {magicWriteCount > 0 && (
            <button
              onClick={() => { setMagicWriteInitialIdx(undefined); setMagicWriteOpen(true); }}
              className="flex items-center gap-1.5 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-300 transition-all hover:bg-violet-500/15"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Magic Write
              <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px]">{magicWriteCount}</span>
            </button>
          )}

          {fixCount > 0 && (
            <button
              onClick={() => {
                setAppliedFixes(new Map());
                toast("Reset all fixes.");
              }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}

          {/* <button
            onClick={handleDownloadImproved}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download
          </button> */}

          <Link
            href={`/resume/analysis?id=${analysisId}`}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-3 py-2 text-xs font-medium text-white"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Full Analysis
          </Link>

          <Link
            href={`/interview?resumeId=${resumeId}`}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
          >
            <Mic className="h-3.5 w-3.5" />
            Interview
          </Link>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR — Score + Categories */}
        <div className="w-[220px] shrink-0 border-r border-white/6 bg-[#060b18] overflow-y-auto">
          <ScoreSidebar
            atsScore={data.atsScore ?? 0}
            categories={data.categories ?? {}}
            activeCategory={activeCategory}
            onCategoryClick={(key) =>
              setActiveCategory((prev) => (prev === key ? null : key))
            }
            onJdMatchClick={() => setJdModalOpen(true)}
          />
        </div>

        {/* CENTER — PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          {data.filePath ? (
            <ResumeViewer
              filePath={data.filePath}
              annotations={annotations}
              activeCategory={activeCategory}
              onAnnotationApply={handleAnnotationApply}
              onFixWithMagicWrite={(annIdx) => {
                setMagicWriteInitialIdx(annIdx);
                setMagicWriteOpen(true);
              }}
            />
          ) : (
            /* Fallback: no PDF on disk — show extracted text with highlights */
            <FallbackTextViewer
              text={data.extractedText}
              annotations={annotations}
              activeCategory={activeCategory}
              appliedFixes={appliedFixes}
              onAnnotationApply={handleAnnotationApply}
            />
          )}
        </div>

        {/* RIGHT PANEL — Keywords + Repeated Words */}
        <div className="hidden w-[220px] shrink-0 overflow-y-auto border-l border-white/6 bg-[#060b18] xl:flex xl:flex-col">
          {/* Industry Keywords */}
          {keywords.length > 0 && (
            <div className="border-b border-white/6 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Industry Keywords
              </p>
              <div className="space-y-1.5">
                {keywords.slice(0, 12).map((kw) => (
                  <div key={kw.keyword} className="flex items-center justify-between gap-2">
                    <span className={`text-xs ${kw.present ? "text-slate-400" : "text-slate-600"}`}>
                      {kw.keyword}
                    </span>
                    {kw.present ? (
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-rose-500/40 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500/60" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repeated Words */}
          {repeated.length > 0 && (
            <div className="p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Repeated Words
              </p>
              <div className="flex flex-wrap gap-1.5">
                {repeated.map((word) => (
                  <span
                    key={word}
                    className="rounded-full border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 text-xs text-amber-400"
                  >
                    {word}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-600 leading-relaxed">
                These words appear 3+ times. Vary your vocabulary for stronger impact.
              </p>
            </div>
          )}

          {keywords.length === 0 && repeated.length === 0 && (
            <div className="flex flex-1 items-center justify-center p-4 text-center">
              <p className="text-xs text-slate-600">Re-analyze to get keyword insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Magic Write Drawer */}
      <MagicWriteDrawer
        annotations={annotations}
        isOpen={magicWriteOpen}
        onClose={() => setMagicWriteOpen(false)}
        initialIssueIdx={magicWriteInitialIdx}
        resumeContext={(data.extractedText || "").slice(0, 1500)}
      />

      {/* JD Match Modal */}
      <AnimatePresence>
        {jdModalOpen && (
          <JdMatchModal
            resumeId={data.resumeId}
            onClose={() => setJdModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Fallback Text Viewer (when no PDF on disk) ───────────────────────────────
function FallbackTextViewer({
  text, annotations, activeCategory, appliedFixes, onAnnotationApply,
}: {
  text: string;
  annotations: IssueAnnotation[];
  activeCategory: string | null;
  appliedFixes: Map<string, string>;
  onAnnotationApply: (lineHint: string, replacement: string) => void;
}) {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  // Apply fixes to display text
  let displayText = text;
  appliedFixes.forEach((replacement, original) => {
    displayText = displayText.replace(original, replacement);
  });

  const visibleAnnotations = activeCategory
    ? annotations.filter((a) => a.section.toLowerCase().includes(activeCategory.toLowerCase()))
    : annotations;

  const SEV_UNDERLINE: Record<string, string> = {
    high: "border-b-2 border-rose-500 bg-rose-500/10 cursor-pointer",
    medium: "border-b-2 border-amber-400 bg-amber-500/10 cursor-pointer",
    low: "border-b-2 border-blue-400 bg-blue-500/10 cursor-pointer",
  };

  const lines = displayText.split("\n");

  return (
    <div className="h-full overflow-auto bg-[#060b18] p-6">
      <div className="mx-auto max-w-2xl font-serif text-sm leading-relaxed text-slate-300">
        {lines.map((line, li) => {
          if (!line.trim()) return <div key={li} className="h-2" />;

          // Check if any annotation matches this line
          const matchedIdx = visibleAnnotations.findIndex(
            (ann) =>
              ann.lineHint &&
              line.toLowerCase().includes(ann.lineHint.toLowerCase().slice(0, 12))
          );
          const globalIdx = matchedIdx >= 0
            ? annotations.findIndex((a) => a === visibleAnnotations[matchedIdx])
            : -1;

          if (globalIdx >= 0 && annotations[globalIdx]) {
            const ann = annotations[globalIdx];
            const isActive = activeTooltip === globalIdx;
            return (
              <p key={li} className="relative mb-0.5">
                <span
                  className={SEV_UNDERLINE[ann.severity]}
                  onClick={() => setActiveTooltip(isActive ? null : globalIdx)}
                >
                  {line}
                </span>
                <AnimatePresence>
                  {isActive && (
                    <span className="absolute left-0 top-full z-50 mt-1">
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="w-72 rounded-2xl border border-white/10 bg-[#0d1220] p-3.5 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="mb-1 text-sm font-semibold text-white">{ann.issue}</p>
                        <p className="mb-2 text-xs text-slate-400">💡 {ann.suggestion}</p>
                        {ann.magicReplacement && (
                          <>
                            <p className="mb-1 font-mono text-xs text-slate-300 bg-violet-500/8 rounded-xl border border-violet-500/20 p-2">
                              {ann.magicReplacement}
                            </p>
                            <button
                              onClick={() => {
                                onAnnotationApply(ann.lineHint, ann.magicReplacement!);
                                setActiveTooltip(null);
                              }}
                              className="mt-2 w-full rounded-xl bg-violet-600 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
                            >
                              ⚡ Apply Fix
                            </button>
                          </>
                        )}
                      </motion.div>
                    </span>
                  )}
                </AnimatePresence>
              </p>
            );
          }

          return <p key={li} className="mb-0.5">{line}</p>;
        })}
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function ResumeReviewPage() {
  return (
    <AppShell title="Resume Review">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          </div>
        }
      >
        <ReviewContent />
      </Suspense>
    </AppShell>
  );
}