"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ResumeDropzone } from "@/components/resume/ResumeDropzone";
import { resumeService } from "@/services/api";
import toast from "react-hot-toast";
import { Sparkles, ArrowRight, FileText, Info } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { data: resume } = await resumeService.upload(file);
      toast.success("Resume uploaded! Starting AI analysis...");
      setUploading(false);
      setAnalyzing(true);

      const { data: analysis } = await resumeService.analyze(resume.id);
      toast.success("Analysis complete! 🎉");
      router.push(`/resume/analysis?id=${analysis.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed. Please try again.");
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <AppShell title="Upload Resume">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            Upload Your <span className="text-gradient">Resume</span>
          </h2>
          <p className="text-slate-400">
            Our AI will analyze your resume against ATS systems and provide detailed, actionable feedback.
          </p>
        </motion.div>

        {/* Info card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">
            We extract text from your PDF and send it to Gemini AI for analysis. Your file is processed securely
            and never shared with third parties.
          </p>
        </motion.div>

        {/* Dropzone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <ResumeDropzone
            onFileSelect={setFile}
            isUploading={uploading || analyzing}
            uploadedFile={file}
            onRemove={() => setFile(null)}
          />
        </motion.div>

        {/* Analyze button */}
        {file && !uploading && !analyzing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={handleUploadAndAnalyze}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold
                         text-lg hover:from-violet-500 hover:to-cyan-500 transition-all shadow-xl shadow-violet-500/20
                         flex items-center justify-center gap-3 hover:scale-[1.02]">
              <Sparkles className="w-5 h-5" />
              Analyze with AI
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Analyzing state */}
        {analyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-6 border border-violet-500/20 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <span className="text-white font-medium">AI is analyzing your resume…</span>
            </div>
            <div className="space-y-2 text-sm text-slate-400">
              {["Parsing resume content", "Checking ATS compatibility", "Generating insights", "Almost done!"].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }}
                  className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  {step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* What you'll get */}
        {!file && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">What You&apos;ll Get</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "ATS Score", desc: "0–100 rating" },
                { label: "Strengths", desc: "What stands out" },
                { label: "Weaknesses", desc: "Areas to fix" },
                { label: "Job Roles", desc: "Best fit positions" },
                { label: "Improvements", desc: "Actionable tips" },
                { label: "Project Ideas", desc: "Resume boosters" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl glass border border-white/5">
                  <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-slate-500 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
