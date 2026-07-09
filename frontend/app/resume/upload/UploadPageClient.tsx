"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Download,
  FileText,
  Info,
  Loader2,
  Lock,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { ResumeDropzone } from "@/components/resume/ResumeDropzone";
import { useAuthStore } from "@/lib/store";
import { resumeService } from "@/services/api";

const previewStats = [
  { value: "98%", label: "ATS Accuracy" },
  { value: "Vita AI", label: "Powered By" },
  { value: "PDF", label: "Format Supported" },
];

const getFeatures = () => [
  { label: "ATS Score", desc: "0–100 rating against real ATS systems", icon: "◎", color: "violet" },
  { label: "Strengths", desc: "What recruiters immediately notice", icon: "✦", color: "emerald" },
  { label: "Weaknesses", desc: "Specific gaps to fix before applying", icon: "◈", color: "rose" },
  { label: "Best Job Roles", desc: "Positions your profile matches well", icon: "⬡", color: "cyan" },
  { label: "Improvements", desc: "Concrete rewrite tips per section", icon: "◇", color: "amber" },
  { label: "Project Ideas", desc: "Portfolio additions to boost your score", icon: "◉", color: "violet" },
];

export default function UploadPageClient() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [duplicateInfo, setDuplicateInfo] = useState<{ fileName: string; analysisId?: string } | null>(null);

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    if (!isAuthenticated) {
      toast.error("Please login to analyze your resume");
      router.push("/auth/login");
      return;
    }

    setDuplicateInfo(null);
    setUploading(true);
    try {
      const { data: resume } = await resumeService.upload(file);

      // ── Duplicate detected ──────────────────────────────────────────────
      if (resume.isDuplicate) {
        setUploading(false);
        setDuplicateInfo({ fileName: resume.fileName, analysisId: resume.hasAnalysis ? resume.id : undefined });
        toast("Same resume content detected — showing existing record.", { icon: "⚠️" });
        if (resume.hasAnalysis) {
          const { data: analysis } = await resumeService.analyze(resume.id, "gpt");
          router.push(`/resume/analysis?id=${analysis.id}`);
        }
        return;
      }

      // ── Blank / Empty PDF — HARD STOP ──────────────────────────────────
      if (resume.emptyText) {
        setUploading(false);
        toast.error(
          "This PDF appears to be empty or image-based. Please upload a valid text resume.",
          { duration: 6000, icon: "🚫" }
        );
        return; // Do NOT proceed to analyze
      }

      if (resume.ocrUsed) {
        toast("Image-based PDF detected — text extracted automatically via OCR ✓", {
          icon: "🔍",
          duration: 5000,
          style: { background: "#0f172a", color: "#94a3b8", border: "1px solid rgba(139,92,246,0.3)" },
        });
      }

      toast.success("Resume uploaded! Starting Vita AI analysis…");
      setUploading(false);
      setAnalyzing(true);
      const { data: analysis } = await resumeService.analyze(resume.id, "gpt");
      toast.success("Analysis complete!");
      router.push(`/resume/analysis?id=${analysis.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed. Please try again.");
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const features = getFeatures();

  return (
    <AppShell title="Upload Resume" requireAuth={false}>
      <div className="mx-auto max-w-3xl space-y-8 py-4">

        {/* ─── Page header ─── */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.22em] text-violet-400/80">AI Resume Analyzer</p>
          <h1 className="mb-2 text-3xl font-display font-bold text-white md:text-4xl">
            Upload Your <span className="text-gradient">Resume</span>
          </h1>
          <p className="max-w-xl text-slate-400">
            Our AI analyzes your resume against real ATS systems and gives you a detailed, actionable score report.
          </p>
        </motion.div>

        {/* ─── Stats bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="grid grid-cols-3 gap-3"
        >
          {previewStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/8 bg-white/[0.03] py-4 text-center backdrop-blur-xl"
            >
              <p className="text-xl font-display font-bold text-violet-300 md:text-2xl">{stat.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ─── Upload zone ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="group relative rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl transition-all hover:border-violet-500/25 hover:bg-slate-950/50"
        >
          {/* gradient border on hover */}
          <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.04))",
            }}
          />

          {/* ── Duplicate Warning Banner ── */}
          {duplicateInfo && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-300">Duplicate resume detected</p>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  This resume&apos;s content matches &quot;<span className="font-medium text-amber-300">{duplicateInfo.fileName}</span>&quot; already in your history.
                  {duplicateInfo.analysisId ? " Redirecting to existing analysis…" : " Upload a different resume to get a new analysis."}
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex items-start gap-2.5 mb-4 rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-3.5 py-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <p className="text-xs text-slate-300">
              Your PDF is parsed locally and sent to the selected AI for analysis. Files are never stored or shared.
            </p>
          </div>

          {/* Powered by Vita AI badge */}
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">Analyzed by Vita AI</span>
            <span className="ml-auto text-xs text-slate-500">Advanced AI model</span>
          </div>

          <ResumeDropzone
            onFileSelect={setFile}
            isUploading={uploading || analyzing}
            uploadedFile={file}
            onRemove={() => setFile(null)}
          />

          {file && !uploading && !analyzing && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <button
                onClick={handleUploadAndAnalyze}
                className="group/btn relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/20 transition-all hover:scale-[1.01] hover:from-violet-500 hover:to-cyan-500"
              >
                {isAuthenticated ? (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Analyze with Vita AI
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Login to Analyze
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </>
                )}
              </button>
              {!isAuthenticated && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  <Link href="/auth/login" className="text-violet-400 hover:text-violet-300">Sign in</Link>
                  {" "}or{" "}
                  <Link href="/auth/signup" className="text-cyan-400 hover:text-cyan-300">create a free account</Link>
                  {" "}to run the analysis
                </p>
              )}
            </motion.div>
          )}

          {!isAuthenticated && !file && (
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href="/auth/login"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-cyan-500"
              >
                <ArrowRight className="h-4 w-4" /> Login to Analyze
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </motion.div>

        {/* ─── Analyzing progress ─── */}
        {analyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-2xl border border-violet-500/20 p-6 text-center"
          >
            <div className="mb-4 flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              <span className="font-medium text-white">Vita AI is analyzing your resume…</span>
            </div>
            <div className="space-y-2 text-sm text-slate-400">
              {["Parsing resume content", "Checking ATS compatibility", "Generating insights", "Almost done!"].map(
                (step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.6 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    {step}
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* ─── What you'll get ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">What you&apos;ll get</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => (
              <div
                key={item.label}
                className={`group/card flex items-start gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${item.color === "violet"
                    ? "border-violet-500/15 bg-violet-500/5 hover:border-violet-500/30"
                    : item.color === "emerald"
                      ? "border-emerald-500/15 bg-emerald-500/5 hover:border-emerald-500/30"
                      : item.color === "rose"
                        ? "border-rose-500/15 bg-rose-500/5 hover:border-rose-500/30"
                        : item.color === "cyan"
                          ? "border-cyan-500/15 bg-cyan-500/5 hover:border-cyan-500/30"
                          : item.color === "amber"
                            ? "border-amber-500/15 bg-amber-500/5 hover:border-amber-500/30"
                            : "border-white/8 bg-white/3 hover:border-white/15"
                  }`}
              >
                <span
                  className={`mt-0.5 shrink-0 text-base font-bold ${item.color === "violet"
                      ? "text-violet-400"
                      : item.color === "emerald"
                        ? "text-emerald-400"
                        : item.color === "rose"
                          ? "text-rose-400"
                          : item.color === "cyan"
                            ? "text-cyan-400"
                            : item.color === "amber"
                              ? "text-amber-400"
                              : "text-slate-400"
                    }`}
                >
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Download note (for logged in users) ─── */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3"
          >
            <Download className="h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-sm text-slate-300">
              After analysis, you can <span className="font-medium text-emerald-300">download your report as PDF or DOCX</span> from the analysis page.
            </p>
          </motion.div>
        )}

        {/* ─── Powered by ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-xs text-slate-600"
        >
          <Zap className="h-3.5 w-3.5 text-amber-500/60" />
          Powered by Vita AI · Secure · Private
        </motion.div>
      </div>
    </AppShell>
  );
}
