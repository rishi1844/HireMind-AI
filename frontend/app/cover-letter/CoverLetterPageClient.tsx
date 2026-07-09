"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle, ClipboardCopy, Download, FileText, Loader2,
  Mail, RefreshCw, Sparkles, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { coverLetterService, resumeService, getApiError } from "@/services/api";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { CustomResumeDropdown } from "@/components/ui/CustomResumeDropdown";

type Tone = "professional" | "enthusiastic" | "concise";
type Resume = { resumeId: string; fileName: string; analysisId: string | null };

const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Formal & polished" },
  { value: "enthusiastic", label: "Enthusiastic", desc: "Energetic & passionate" },
  { value: "concise", label: "Concise", desc: "Short & impactful (<250 words)" },
];

export default function CoverLetterPageClient() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [mismatch, setMismatch] = useState<{ show: boolean; reason: string; proceed: (() => void) | null }>({
    show: false, reason: "", proceed: null,
  });

  useEffect(() => {
    resumeService.getHistory().then((r) => {
      const data: Resume[] = (r.data as any[]).filter((i: any) => i.analysisId);
      setResumes(data);
      if (data.length > 0) setSelectedResume(data[0].resumeId);
    }).catch(() => {});
  }, []);

  const handleGenerate = async (force = false) => {
    if (!jobTitle.trim() || !companyName.trim() || !jobDescription.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await coverLetterService.generate({
        resumeId: selectedResume ? Number(selectedResume) : undefined,
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        jobDescription: jobDescription.trim(),
        tone,
      });
      // Show mismatch warning (only once unless user explicitly proceeds)
      if (!force && res.data.isMismatch && res.data.mismatchReason) {
        setResult(res.data.coverLetter); // store result but show warning
        setMismatch({
          show: true,
          reason: res.data.mismatchReason,
          proceed: () => {
            setMismatch({ show: false, reason: "", proceed: null });
            toast.success("Cover letter generated!");
          },
        });
      } else {
        setResult(res.data.coverLetter);
        toast.success("Cover letter generated!");
      }
    } catch (err: any) {
      if (err?.response?.data?.code === "USAGE_LIMIT_EXCEEDED" || err?.response?.status === 429) {
        setShowUpgrade(true);
      } else {
        toast.error(getApiError(err));
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => toast.error("Copy failed"));
  };

  // ── Download as TXT or DOC ────────────────────────────────────────────────
  const handleDownload = (format: "txt" | "doc") => {
    if (!result) return;
    const filename = `cover-letter-${jobTitle.replace(/\s+/g, "-").toLowerCase()}.${format}`;
    const blob =
      format === "doc"
        ? new Blob(
            [`<html><body><pre style="font-family:Arial;font-size:12pt;line-height:1.6">${result.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></body></html>`],
            { type: "application/msword" }
          )
        : new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${format.toUpperCase()}`);
  };

  // ── Download as PDF ───────────────────────────────────────────────────────
  const handleDownloadPdf = () => {
    if (!result) return;
    const filename = `cover-letter-${jobTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    // Use browser print-to-PDF via a hidden iframe
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Letter</title>
<style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.7;max-width:700px;margin:40px auto;color:#111;}h2{font-size:14pt;margin-bottom:4px;}p{white-space:pre-wrap;}</style>
</head><body>
<h2>${jobTitle} — ${companyName}</h2>
<p>${result.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 2000);
      }
    };
    toast.success("Opening print dialog for PDF…");
  };

  return (
    <AppShell title="Cover Letter Generator">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white">Cover Letter Generator</h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Generate a tailored, ATS-friendly cover letter in seconds. Paste a job description
            and let AI craft a compelling letter matched to your background.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Left: Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-5"
          >
            {/* Resume selection */}
            <div className="rounded-[1.75rem] border border-white/8 p-6 glass-card space-y-4 relative z-20">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-400" /> Resume (Optional)
              </h2>
              {resumes.length > 0 ? (
                <CustomResumeDropdown
                  value={selectedResume}
                  onChange={setSelectedResume}
                  resumes={resumes}
                  allowNone={true}
                  noneLabel="— No resume (generic letter) —"
                />
              ) : (
                <p className="text-sm text-slate-500">No analyzed resumes yet. You can still generate a cover letter without one.</p>
              )}
            </div>

            {/* Job details */}
            <div className="rounded-[1.75rem] border border-white/8 p-6 glass-card space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" /> Job Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Job Title *</label>
                  <input
                    id="job-title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Frontend Engineer"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Company Name *</label>
                  <input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Job Description *</label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here…"
                  rows={8}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
              </div>
            </div>

            {/* Tone */}
            <div className="rounded-[1.75rem] border border-white/8 p-6 glass-card space-y-3">
              <h2 className="text-base font-semibold text-white">Tone</h2>
              <div className="grid grid-cols-3 gap-3">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    id={`tone-${t.value}`}
                    onClick={() => setTone(t.value)}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      tone === t.value
                        ? "border-violet-500/40 bg-violet-500/15 ring-1 ring-violet-500/30"
                        : "border-white/8 hover:bg-white/5"
                    }`}
                  >
                    <p className={`text-sm font-medium ${tone === t.value ? "text-violet-300" : "text-white"}`}>{t.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              id="generate-cover-letter-btn"
              onClick={() => handleGenerate()}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-4 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-60"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Cover Letter <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </motion.div>

          {/* Right: Result */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <AnimatePresence mode="wait">
              {!result && !generating && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 p-12 text-center h-full min-h-[300px] glass-card"
                >
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 flex items-center justify-center mb-4">
                    <Mail className="h-7 w-7 text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">Your cover letter will appear here</p>
                  <p className="mt-1 text-xs text-slate-600">Fill in the form and click Generate</p>
                </motion.div>
              )}

              {generating && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center rounded-[1.75rem] border border-violet-500/20 p-12 text-center h-full min-h-[300px] glass-card"
                >
                  <div className="relative mb-4">
                    <div className="h-14 w-14 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-white">Crafting your letter…</p>
                  <p className="mt-1 text-xs text-slate-500">Vita AI is working on it</p>
                </motion.div>
              )}

              {result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-[1.75rem] border border-emerald-500/20 glass-card overflow-hidden"
                >
                  {/* Action bar */}
                  <div className="flex items-center justify-between border-b border-white/5 px-5 py-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-white">Cover Letter Ready</span>
                      <span className="text-xs text-slate-500">· editable</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        id="copy-cover-letter-btn"
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                          copied ? "bg-emerald-500/20 text-emerald-300" : "border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                      <button
                        id="download-pdf-btn"
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </button>
                      <button
                        id="download-txt-btn"
                        onClick={() => handleDownload("txt")}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" /> TXT
                      </button>
                      <button
                        id="download-doc-btn"
                        onClick={() => handleDownload("doc")}
                        className="flex items-center gap-1.5 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/20 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" /> DOC
                      </button>
                      <button
                        id="regenerate-btn"
                        onClick={() => handleGenerate()}
                        disabled={generating}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                      </button>
                    </div>
                  </div>
                  {/* ✅ Editable result — user can tweak before downloading */}
                  <div className="p-5">
                    <textarea
                      id="cover-letter-result"
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      rows={22}
                      className="w-full resize-none bg-transparent text-sm leading-relaxed text-slate-300 font-sans outline-none focus:text-white transition-colors"
                      spellCheck
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        featureName="Cover Letter Generator"
        usageLimit={3}
      />

      {/* Mismatch warning modal */}
      <AnimatePresence>
        {mismatch.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={() => setMismatch({ show: false, reason: "", proceed: null })} />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 12 }}
              className="relative z-10 w-full max-w-md rounded-[2rem] border border-amber-500/20 bg-slate-900 p-8 shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="mb-2 text-center text-lg font-bold text-white">Resume &amp; JD Mismatch Detected</h3>
              <p className="mb-2 text-center text-sm text-slate-400">{mismatch.reason}</p>
              <p className="mb-6 text-center text-sm text-slate-500">Your cover letter was still generated. Proceed anyway?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMismatch({ show: false, reason: "", proceed: null })}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={() => mismatch.proceed?.()}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:from-amber-400 hover:to-orange-400 transition-all"
                >
                  Proceed Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
