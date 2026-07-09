"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, CheckCircle, ClipboardList, FileText,
  Loader2, Sparkles, Target, TrendingUp, XCircle, Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { jobMatchService, resumeService, getApiError } from "@/services/api";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { CustomResumeDropdown } from "@/components/ui/CustomResumeDropdown";


type Resume = { resumeId: string; fileName: string; analysisId: string | null };

interface MatchResult {
  resumeId: string;
  fileName: string;
  matchScore: number;
  verdict: string;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionScores: { skills: number; experience: number; education: number; keywords: number };
  tailoringTips: string[];
  analyzedAt: string;
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="capitalize font-medium text-slate-300">{label}</span>
        <span className="tabular-nums font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function getVerdictColor(verdict: string) {
  if (verdict.includes("Excellent")) return "#10b981";
  if (verdict.includes("Good")) return "#22d3ee";
  if (verdict.includes("Partial")) return "#f59e0b";
  return "#f43f5e";
}

function getScoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#22d3ee";
  if (score >= 40) return "#f59e0b";
  return "#f43f5e";
}

export default function JobMatchPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);


  useEffect(() => {
    resumeService.getHistory().then((r) => {
      const data: Resume[] = (r.data as any[]);
      setResumes(data);
      if (data.length > 0) setSelectedResume(data[0].resumeId);
    }).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!selectedResume) { toast.error("Please select a resume."); return; }
    if (!jobDescription.trim()) { toast.error("Please paste a job description."); return; }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await jobMatchService.match({
        resumeId: Number(selectedResume),
        jobDescription: jobDescription.trim(),
      });
      setResult(res.data);
      toast.success("Analysis complete!");
    } catch (err: any) {
      if (err?.response?.data?.code === "USAGE_LIMIT_EXCEEDED" || err?.response?.status === 429) {
        setShowUpgrade(true);
      } else {
        toast.error(getApiError(err));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppShell title="Job Match Analyzer">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-violet-600">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white">Job Description Matcher</h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Find out exactly how well your resume matches a job posting. Get your match score,
            missing keywords, and actionable tips to tailor your resume.
          </p>
        </motion.div>

        {/* Input section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-[1.75rem] border border-white/8 p-6 glass-card space-y-5"
        >
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-400" /> Select Resume & Paste Job Description
          </h2>

          {resumes.length === 0 ? (
            <p className="text-sm text-slate-500">Upload and analyze a resume first to use the job matcher.</p>
          ) : (
            <CustomResumeDropdown
              value={selectedResume}
              onChange={setSelectedResume}
              resumes={resumes}
            />
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Job Description *</label>
            <textarea
              id="jd-input"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here — requirements, responsibilities, nice-to-haves…"
              rows={9}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>

          <button
            id="analyze-match-btn"
            onClick={handleAnalyze}
            disabled={analyzing || resumes.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 py-4 text-sm font-semibold text-white transition-all hover:from-cyan-500 hover:to-violet-500 disabled:opacity-60"
          >
            {analyzing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Zap className="h-4 w-4" /> Analyze Match <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Score hero */}
            <div className="rounded-[2rem] border p-8 glass-card glow-violet"
              style={{ borderColor: `${getVerdictColor(result.verdict)}30` }}
            >
              <div className="flex flex-col items-center gap-8 md:flex-row">
                {/* Big score circle */}
                <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                  <svg className="absolute inset-0" viewBox="0 0 144 144">
                    <circle cx="72" cy="72" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <circle
                      cx="72" cy="72" r="60" fill="none"
                      stroke={getVerdictColor(result.verdict)}
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 60}`}
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - result.matchScore / 100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 72 72)"
                      style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-4xl font-display font-bold" style={{ color: getVerdictColor(result.verdict) }}>
                      {result.matchScore}
                    </p>
                    <p className="text-xs text-slate-500">/ 100</p>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-3"
                    style={{ background: `${getVerdictColor(result.verdict)}20`, color: getVerdictColor(result.verdict), border: `1px solid ${getVerdictColor(result.verdict)}30` }}>
                    {result.verdict}
                  </span>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">{result.fileName}</h2>
                  <p className="text-slate-400 leading-relaxed">{result.summary}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Section Scores */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-[1.75rem] border border-white/8 p-6 glass-card space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Section Scores
                </h3>
                {Object.entries(result.sectionScores).map(([key, val]) => (
                  <ScoreBar key={key} label={key} score={val} color={getScoreColor(val)} />
                ))}
              </motion.div>

              {/* Keywords */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="rounded-[1.75rem] border border-white/8 p-6 glass-card space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> Keyword Analysis
                </h3>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" /> Matched Keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords.map((kw) => (
                      <span key={kw} className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-300">{kw}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                    <XCircle className="h-3.5 w-3.5" /> Missing Keywords
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((kw) => (
                      <span key={kw} className="rounded-full bg-rose-500/15 border border-rose-500/20 px-2.5 py-0.5 text-xs text-rose-300">{kw}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Tailoring Tips */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-[1.75rem] border border-cyan-500/20 p-6 glass-card space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-cyan-400/80 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Tailoring Tips
              </h3>
              <ul className="space-y-3">
                {result.tailoringTips.map((tip, i) => (
                  <motion.li key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="flex items-start gap-3 text-sm leading-relaxed text-slate-300"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    <span>{tip}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </div>
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        featureName="Job Description Matcher"
        usageLimit={3}
      />
    </AppShell>
  );
}

