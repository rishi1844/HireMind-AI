"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, X, ChevronRight, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { resumeBuilderService } from "@/services/api";
import { cn } from "@/lib/utils";

interface Props {
  fieldType: "summary" | "experience" | "project" | "full";
  onGenerated: (text: string) => void;
  label?: string;
  className?: string;
  aiModel?: "gemini" | "gpt";
  // Context for the specific field
  name?: string;
  skills?: string;
  targetRole?: string;
  experienceInput?: string;
  company?: string;
  role?: string;
  duration?: string;
  projectTitle?: string;
  techStack?: string;
  existingDescription?: string;
}

/** Prompt config per field type */
const HINT_CONFIG: Record<
  "summary" | "experience" | "project" | "full",
  { label: string; placeholder: string; helpText: string }
> = {
  summary: {
    label: "Brief about yourself",
    placeholder:
      "e.g. 3+ years backend dev, worked on payment systems, want a senior role at a product startup",
    helpText: "A few words about your background, strengths, or target role. AI will craft a polished summary.",
  },
  experience: {
    label: "Key responsibilities / achievements",
    placeholder:
      "e.g. led API migration, cut latency by 40%, mentored 3 juniors, owned CI/CD pipeline",
    helpText: "Briefly list what you did and any results. AI will turn these into strong bullet points.",
  },
  project: {
    label: "What you built & the result",
    placeholder:
      "e.g. built real-time chat app with WebSockets, 1200 users, improved engagement by 30%",
    helpText: "Describe the problem, what you built, tech used, and any measurable outcome.",
  },
  full: {
    label: "Overview hint",
    placeholder: "e.g. Full-stack developer, React + Node, 2 years experience, seeking product company",
    helpText: "Give a brief overview and AI will fill in your entire resume content.",
  },
};

export function AIWriteButton({
  fieldType,
  onGenerated,
  label = "AI Write",
  className,
  aiModel,
  ...ctx
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const config = HINT_CONFIG[fieldType];

  /* Auto-focus textarea when modal opens */
  useEffect(() => {
    if (modalOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 60);
    }
  }, [modalOpen]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await resumeBuilderService.generateField({
        fieldType,
        aiModel,
        name: ctx.name,
        skills: ctx.skills,
        targetRole: ctx.targetRole,
        experienceInput: ctx.experienceInput,
        company: ctx.company,
        role: ctx.role,
        duration: ctx.duration,
        projectTitle: ctx.projectTitle,
        techStack: ctx.techStack,
        existingDescription: hint.trim() || ctx.existingDescription,
        hint: hint.trim() || undefined,
      });
      if (data?.generatedText) {
        onGenerated(data.generatedText);
        toast.success("✨ AI content generated!");
        setModalOpen(false);
        setHint("");
      }
    } catch {
      toast.error("AI generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10",
          "px-3 py-1.5 text-xs font-semibold text-amber-300 transition-all duration-200",
          "hover:border-amber-400/50 hover:bg-amber-500/20 hover:text-amber-200",
          className
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </button>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(5,10,20,0.75)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-violet-500/40 bg-[#0d1424] shadow-[0_0_30px_rgba(168,85,247,0.25),0_10px_40px_rgba(0,0,0,0.7)]"
            style={{ animation: "slideUpFade 0.18s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e2940] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">AI Write</p>
                  <p className="text-[10px] text-slate-500 capitalize">{fieldType} content</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setModalOpen(false); setHint(""); }}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-[#1a2235] hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Hint textarea */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-300">
                  <Pencil className="h-3.5 w-3.5 text-amber-400" />
                  {config.label}
                  <span className="ml-auto text-[10px] font-normal text-slate-600">Optional — but recommended</span>
                </label>
                <textarea
                  ref={textareaRef}
                  rows={3}
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder={config.placeholder}
                  className="w-full resize-none rounded-xl border border-violet-500/40 bg-[#0f1623] px-4 py-3 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 outline-none transition-all hover:border-violet-500/65 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                />
                <p className="mt-1.5 text-[10px] text-slate-600">{config.helpText}</p>
              </div>

              {/* Skip hint note */}
              <p className="text-[10px] text-slate-600 italic">
                Leave blank to let AI use existing context from your profile.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[#1e2940] px-5 py-3">
              <button
                type="button"
                onClick={() => { setModalOpen(false); setHint(""); }}
                className="rounded-xl border border-[#2a3548] px-4 py-2 text-xs font-medium text-slate-400 transition-all hover:border-[#3a4760] hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-300 transition-all",
                  "hover:border-amber-400/60 hover:bg-amber-500/30 hover:text-amber-200",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {loading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> Generate <ChevronRight className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </>
  );
}
