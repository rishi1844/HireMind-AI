"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff,
  LayoutTemplate, Loader2, Sparkles, X, User, FileText, GraduationCap,
  Briefcase, FolderGit2, Cpu, Check, ShieldCheck, Palette, Download,
  ExternalLink, Mail, Save, Plus, ArrowUpRight, Copy, Share2, Lock, Upload
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { resumeBuilderService } from "@/services/api";
import {
  BuilderFormState,
  BuilderStep,
  DEFAULT_FORM_STATE,
  DEFAULT_THEME,
  TemplateId,
  normalizeResumeData,
  normalizeTheme,
  TEMPLATE_OPTIONS,
} from "./types";
import { StepForms } from "./StepForms";
import { ResumePreview } from "./ResumePreview";
import { TemplateSelector } from "./TemplateSelector";
import { ThemePanel } from "./ThemePanel";
import { AIResumeOnboardingModal } from "./AIResumeOnboardingModal";
import { AiTipsPanel } from "./AiTipsPanel";
import { ResumeUploadModal } from "./ResumeUploadModal";

interface Props {
  mode: "create" | "edit";
  resumeId?: number;
}

const STEP_ORDER: BuilderStep[] = ["basics", "summary", "experience", "education", "skills", "projects", "custom"];

const stepsWithIcons = [
  { id: "basics", label: "Personal Details", badge: "01", icon: User },
  { id: "summary", label: "Professional Summary", badge: "02", icon: FileText },
  { id: "experience", label: "Work Experience", badge: "03", icon: Briefcase },
  { id: "education", label: "Education History", badge: "04", icon: GraduationCap },
  { id: "skills", label: "Core Skills", badge: "05", icon: Cpu },
  { id: "projects", label: "Key Projects", badge: "06", icon: FolderGit2 },
  { id: "custom", label: "Custom Sections", badge: "07", icon: Sparkles },
] as const;

export function ResumeBuilderShell({ mode, resumeId }: Props) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth(true);
  const [form, setForm] = useState<BuilderFormState>(DEFAULT_FORM_STATE());
  const isPremium = user?.plan === "pro" || user?.plan === "elite";
  const isTemplateLocked = form.templateId !== "axiom" && form.templateId !== "editorial" && !isPremium;
  const [currentStep, setCurrentStep] = useState<BuilderStep>("basics");
  const [completedSteps, setCompletedSteps] = useState<Set<BuilderStep>>(new Set());
  const [savedResumeId, setSavedResumeId] = useState<string | null>(
    resumeId != null ? String(resumeId) : null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  // Redesign state additions
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Email modal state ──
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const aiModel = "gpt"; // GPT-only mode
  const previewPanelRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const isExporting = false; // kept for UI compat — unused after switching to window.print()

  /* ── Responsive preview scale ── */
  useEffect(() => {
    const compute = () => {
      const panel = previewPanelRef.current;
      if (!panel) return;
      const panelW = panel.clientWidth;
      const newScale = Math.min(0.72, (panelW - 64) / 794);
      setPreviewScale(newScale);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (previewPanelRef.current) ro.observe(previewPanelRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Close export dropdown on click outside ── */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Load resume in edit mode ── */
  useEffect(() => {
    if (mode !== "edit" || !resumeId) return;
    setIsLoading(true);
    resumeBuilderService
      .getById(resumeId)
      .then(({ data }) => {
        const rawData = data.resumeData as unknown as Record<string, unknown>;
        const savedTheme = rawData?._theme;
        setSavedResumeId(String(data.id));
        setForm((prev) => ({
          ...prev,
          title: data.title,
          templateId: data.templateId,
          theme: savedTheme ? normalizeTheme(savedTheme) : (data.theme ?? DEFAULT_THEME),
          resumeData: normalizeResumeData(data.resumeData),
        }));
      })
      .catch(() => toast.error("Failed to load resume"))
      .finally(() => setIsLoading(false));
  }, [mode, resumeId]);

  const goToStep = useCallback(
    (step: BuilderStep) => {
      setCompletedSteps((cur) => new Set(Array.from(cur).concat(currentStep)));
      setCurrentStep(step);
    },
    [currentStep]
  );

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < STEP_ORDER.length - 1;

  const goBack = () => canGoBack && goToStep(STEP_ORDER[currentStepIndex - 1]);
  const goForward = () => canGoForward && goToStep(STEP_ORDER[currentStepIndex + 1]);

  const handleSave = async (silent = false) => {
    if (!form.title.trim()) {
      if (!silent) toast.error("Enter a resume title before saving.");
      return;
    }
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const resumeDataClean = JSON.parse(JSON.stringify({
        ...(form.resumeData as unknown as Record<string, unknown>),
        _theme: form.theme,
      }));
      const payload = {
        title: form.title.trim(),
        templateId: form.templateId,
        resumeData: resumeDataClean,
      };
      if (savedResumeId) {
        await resumeBuilderService.update(Number(savedResumeId), payload);
        if (!silent) toast.success("Resume updated ✓");
      } else {
        const { data } = await resumeBuilderService.create(payload);
        setSavedResumeId(String(data.id));
        if (!silent) toast.success("Resume saved ✓");
        router.replace(`/resume/builder/${data.id}`);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
      if (!silent) {
        const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
          || (err as { message?: string })?.message
          || "Failed to save resume";
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Auto-save: debounce 2s after any form change ── */
  useEffect(() => {
    if (!savedResumeId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave(true); // silent = no toast
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleGenerateAll = async () => {
    const experienceInput = form.resumeData.experience
      .map((i) => `${i.role} at ${i.company} (${i.duration})`)
      .filter(Boolean)
      .join("; ");
    setIsGeneratingAll(true);
    try {
      const { data } = await resumeBuilderService.generateField({
        fieldType: "full",
        name: form.resumeData.fullName,
        skills: form.resumeData.skills.join(", "),
        experienceInput,
        aiModel,
      });
      const generated = JSON.parse(data.generatedText);
      const createId = () => crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2, 10)}`;
      setForm((cur) => ({
        ...cur,
        resumeData: {
          ...cur.resumeData,
          summary: generated.summary ?? cur.resumeData.summary,
          skills: generated.skills ?? cur.resumeData.skills,
          experience: Array.isArray(generated.experience)
            ? generated.experience.map((i: Record<string, unknown>) => ({
              company: String(i.company ?? ""),
              role: String(i.role ?? ""),
              duration: String(i.duration ?? ""),
              description: String(i.description ?? ""),
              id: createId(),
            }))
            : cur.resumeData.experience,
          projects: Array.isArray(generated.projects)
            ? generated.projects.map((i: Record<string, unknown>) => ({
              title: String(i.title ?? ""),
              techStack: String(i.techStack ?? ""),
              description: String(i.description ?? ""),
              id: createId(),
            }))
            : cur.resumeData.projects,
        },
      }));
      toast.success("Draft generated with AI");
    } catch {
      toast.error("AI generation failed. Use field-level buttons if needed.");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleApplyAIData = (updates: Partial<BuilderFormState["resumeData"]>) => {
    setForm((cur) => ({
      ...cur,
      resumeData: {
        ...cur.resumeData,
        ...updates,
      },
    }));
    setCurrentStep("summary");
    setCompletedSteps(new Set<BuilderStep>(["basics"]));
  };

  /* ── Dynamic Completion Calculator ── */
  const calculateCompletion = () => {
    let score = 0;
    const rd = form.resumeData;
    if (rd.fullName && rd.email && rd.phone) score += 15;
    if (rd.summary && rd.summary.trim().length > 0) score += 15;
    if (rd.education.length > 0 && rd.education.some(e => e.degree && e.college)) score += 15;
    if (rd.experience.length > 0 && rd.experience.some(e => e.role && e.company)) score += 20;
    if (rd.projects.length > 0 && rd.projects.some(p => p.title)) score += 15;
    if (rd.skills.length > 0) score += 10;
    if (rd.customSections.length > 0 && rd.customSections.some(s => s.title && s.items.length > 0)) score += 10;
    return score;
  };

  const handleImportExtractedData = (aiData: any) => {
    const warnings: string[] = [];
    const updatedData = { ...form.resumeData };

    if (aiData.personalInfo) {
      const pi = aiData.personalInfo;
      if (pi.fullName) updatedData.fullName = pi.fullName;
      if (pi.email) updatedData.email = pi.email;
      if (pi.phone) updatedData.phone = pi.phone;
      if (pi.location) updatedData.location = pi.location;
      if (pi.linkedin) updatedData.linkedin = pi.linkedin;
      if (pi.github) updatedData.github = pi.github;
      if (pi.portfolio) updatedData.portfolio = pi.portfolio;
    } else {
      warnings.push("Personal Info");
    }

    if (aiData.summary) {
      updatedData.summary = aiData.summary;
    } else {
      warnings.push("Summary");
    }

    const createId = () => crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2, 10)}`;

    if (Array.isArray(aiData.education) && aiData.education.length > 0) {
      updatedData.education = aiData.education.map((edu: any) => ({
        id: createId(),
        degree: edu.degree || "",
        college: edu.institution || "",
        year: edu.startYear && edu.endYear ? `${edu.startYear} - ${edu.endYear}` : (edu.startYear || edu.endYear || ""),
        score: edu.gpa || "",
        description: edu.location || "",
      }));
    } else if (aiData.education) {
      warnings.push("Education");
    }

    if (Array.isArray(aiData.experience) && aiData.experience.length > 0) {
      updatedData.experience = aiData.experience.map((exp: any) => {
        let desc = "";
        if (Array.isArray(exp.bullets) && exp.bullets.length > 0) {
          desc = exp.bullets.map((b: string) => b.startsWith("-") ? b : `- ${b}`).join("\n");
        } else {
          desc = exp.description || "";
        }
        return {
          id: createId(),
          company: exp.company || "",
          role: exp.role || "",
          duration: exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.endDate || ""),
          description: desc,
        };
      });
    } else if (aiData.experience) {
      warnings.push("Experience");
    }

    if (Array.isArray(aiData.projects) && aiData.projects.length > 0) {
      updatedData.projects = aiData.projects.map((proj: any) => ({
        id: createId(),
        title: proj.name || "",
        techStack: proj.technologies || "",
        description: proj.description || "",
        linkLabel: proj.link ? "Project Link" : "",
        linkUrl: proj.link || "",
      }));
    } else if (aiData.projects) {
      warnings.push("Projects");
    }

    if (Array.isArray(aiData.skills) && aiData.skills.length > 0) {
      updatedData.skills = aiData.skills.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (aiData.skills) {
      warnings.push("Skills");
    }

    const newCustomSections = [...form.resumeData.customSections];

    if (Array.isArray(aiData.certifications) && aiData.certifications.length > 0) {
      newCustomSections.push({
        id: createId(),
        title: "Certifications",
        items: aiData.certifications.map((cert: any) => ({
          id: createId(),
          heading: cert.name || "",
          subheading: cert.issuer || "",
          description: cert.date || "",
          linkLabel: cert.link ? "Credential URL" : "",
          linkUrl: cert.link || "",
        })),
      });
    }

    if (Array.isArray(aiData.languages) && aiData.languages.length > 0) {
      newCustomSections.push({
        id: createId(),
        title: "Languages",
        items: aiData.languages.map((lang: any) => ({
          id: createId(),
          heading: lang.name || "",
          subheading: lang.proficiency || "",
          description: "",
          linkLabel: "",
          linkUrl: "",
        })),
      });
    }

    updatedData.customSections = newCustomSections;

    setForm((cur) => ({
      ...cur,
      resumeData: updatedData,
    }));

    toast.success("Resume data imported successfully!");
    if (warnings.length > 0) {
      toast("Some sections could not be mapped: " + warnings.join(", "), { icon: "⚠️" });
    }
  };

  const isStepCompleted = (stepId: BuilderStep) => {
    const rd = form.resumeData;
    if (stepId === "basics") return !!(rd.fullName && rd.email && rd.phone);
    if (stepId === "summary") return !!(rd.summary && rd.summary.trim().length > 0);
    if (stepId === "education") return rd.education.length > 0 && rd.education.some(e => e.degree && e.college);
    if (stepId === "experience") return rd.experience.length > 0 && rd.experience.some(e => e.role && e.company);
    if (stepId === "projects") return rd.projects.length > 0 && rd.projects.some(p => p.title);
    if (stepId === "skills") return rd.skills.length > 0;
    if (stepId === "custom") return rd.customSections.length > 0 && rd.customSections.some(s => s.title && s.items.length > 0);
    return false;
  };

  const handleShare = () => {
    if (!savedResumeId) {
      toast.error("Save the resume first before sharing.");
      return;
    }
    const url = `${window.location.origin}/resume/viewer/${savedResumeId}`;
    void navigator.clipboard.writeText(url);
    toast.success("Resume share link copied!");
  };  /* ── Send resume as PDF via email ── */
  const handleSendEmail = async () => {
    if (!savedResumeId) { toast.error("Save the resume first."); return; }
    if (!emailRecipient.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailRecipient.trim())) {
      toast.error("Enter a valid email address."); return;
    }
    setIsSendingEmail(true);
    const toastId = toast.loading("Preparing PDF and sending...");
    try {
      await resumeBuilderService.sendEmail(Number(savedResumeId), {
        recipientEmail: emailRecipient.trim(),
        format: "PDF",
        templateId: form.templateId
      });
      toast.success(`Resume sent to ${emailRecipient.trim()} ✓`, { id: toastId });
      setShowEmailModal(false);
      setEmailRecipient("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as { message?: string })?.message || "Failed to send email";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSendingEmail(false);
    }
  };
  const safeFilename = `${(form.title || "resume").replace(/[^a-z0-9_\-\s]/gi, "_")}`;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070B14]">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Opening builder workspace...</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#070B14]">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading resume...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 flex flex-col font-sans selection:bg-violet-600/30 selection:text-violet-200">

      {/* ── TOP STICKY NAVBAR ── */}
      <header className="sticky top-0 z-40 border-b border-[#243041] bg-[#0d1424]/80 backdrop-blur-md shadow-lg shadow-black/20">
        <div className="mx-auto flex max-w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">

          {/* Back arrow + Vita Logo + Resume Title */}
          <div className="flex items-center gap-3 min-w-0">

            {/* Back button */}
            <button
              onClick={() => router.push("/resume/builder")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#243041] bg-[#111827] text-slate-400 hover:border-slate-500 hover:text-white transition-all shadow-sm shrink-0"
              title="Back to library"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Vita Logo (matches dashboard header style) */}
            <div className="hidden sm:flex items-center gap-2.5 shrink-0">
              <div className="relative shrink-0">
                <div className="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-violet-500/40 via-indigo-500/20 to-cyan-500/30 blur-[7px] opacity-70" />
                <div className="relative rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-[4px] ring-1 ring-white/[0.12] shadow-[0_2px_12px_rgba(109,40,217,0.35),0_1px_3px_rgba(0,0,0,0.6)]">
                  <Image
                    src="/logo.png"
                    alt="Vita logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain rounded-lg"
                  />
                </div>
              </div>
              <div className="leading-tight">
                <span
                  className="brand-wordmark text-[1.1rem] font-black tracking-tight text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Vita
                </span>
                <p className="text-[10px] text-slate-500">Resume Builder</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-[#243041] shrink-0 ml-[40px]" />

            {/* Resume title + status */}
            <div className="min-w-0">
              <input
                value={form.title}
                onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
                placeholder="Untitled Resume"
                className="bg-transparent text-sm font-bold text-slate-100 placeholder:text-slate-600 outline-none focus:outline-none truncate w-32 sm:w-40 md:w-52"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-500 font-medium capitalize">
                  {mode === "edit" ? "Edit" : "New"} · {form.templateId.replace("-", " ")}
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-600">
                  <span>•</span>
                  {saveStatus === 'saving' && <span className="text-violet-400">Saving...</span>}
                  {saveStatus === 'saved' && <span className="text-emerald-500">Saved</span>}
                  {saveStatus === 'error' && <span className="text-rose-500">Error</span>}
                  {saveStatus === 'idle' && <span>Auto-save on</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions (AI, Customize, Template selector, Download Dropdown) */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Direct Resume Import */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#243041] bg-[#111827] px-3.5 py-2 text-xs font-semibold tracking-wide text-slate-400 hover:border-slate-500 hover:text-white transition-all shadow-sm"
              title="Upload your resume and auto-fill details"
            >
              <Upload className="h-4 w-4 text-violet-400" />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Template Selector toggler */}
            <button
              onClick={() => setTemplateSelectorOpen(p => !p)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold tracking-wide transition-all shadow-sm",
                templateSelectorOpen
                  ? "border-violet-500 bg-violet-600/10 text-violet-200"
                  : "border-[#243041] bg-[#111827] text-slate-400 hover:border-slate-500 hover:text-white"
              )}
            >
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </button>

            {/* Customize (Sliding Drawer) */}
            <button
              onClick={() => setCustomizeOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#243041] bg-[#111827] px-3 py-2 text-xs font-semibold tracking-wide text-slate-400 hover:border-slate-500 hover:text-white transition-all shadow-sm"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Customize</span>
            </button>

            {/* AI Draft */}
            <div className="relative rounded-xl p-[2px] overflow-hidden bg-slate-900 shadow-[0_0_16px_rgba(168,85,247,0.65)] flex-shrink-0">
              <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#a855f7_0%,#06b6d4_30%,#ec4899_60%,#a855f7_100%)]" />
              <button
                onClick={() => setShowAIModal(true)}
                disabled={isGeneratingAll}
                className="relative flex items-center gap-1.5 rounded-[10px] bg-[#0d1424] hover:bg-[#141b2d] px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50 transition-all w-full h-full"
                style={{ background: "repeating-radial-gradient(black, transparent 100px)" }}
              >
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>AI Draft</span>
              </button>
            </div>

            {/* Export Dropdown container */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setExportDropdownOpen(p => !p)}
                className="flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-600/10 px-3.5 py-2 text-xs font-bold text-violet-300 hover:border-violet-500 hover:bg-violet-600/20 transition-all shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", exportDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {exportDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-52 rounded-xl border border-[#243041] bg-[#0d1424] p-1.5 shadow-2xl z-50"
                  >
                    <button
                      onClick={async () => {
                        setExportDropdownOpen(false);
                        setIsSaving(true);
                        await handleSave();
                        setIsSaving(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-[#1a2235] hover:text-white transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </button>
                    <button
                      onClick={() => {
                        setExportDropdownOpen(false);
                        if (isTemplateLocked) {
                          toast.error("This template requires a Premium subscription. Please upgrade or select a free template.");
                          return;
                        }
                        window.print();
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-[#1a2235] hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Download className="h-3.5 w-3.5" />
                        Download PDF
                      </span>
                      {isTemplateLocked && <Lock className="h-3 w-3 text-amber-500" />}
                    </button>
                    <button
                      onClick={() => {
                        setExportDropdownOpen(false);
                        if (isTemplateLocked) {
                          toast.error("This template requires a Premium subscription. Please upgrade or select a free template.");
                          return;
                        }
                        setShowEmailModal(true);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-[#1a2235] hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        Send via Email
                      </span>
                      {isTemplateLocked && <Lock className="h-3 w-3 text-amber-500" />}
                    </button>
                    <div className="my-1 border-t border-[#243041]/60" />
                    <button
                      onClick={() => {
                        setExportDropdownOpen(false);
                        if (isTemplateLocked) {
                          toast.error("This template requires a Premium subscription. Please upgrade or select a free template.");
                          return;
                        }
                        handleShare();
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-[#1a2235] hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Share2 className="h-3.5 w-3.5" />
                        Share Link
                      </span>
                      {isTemplateLocked && <Lock className="h-3 w-3 text-amber-500" />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile/Tablet Preview trigger */}
            <button
              onClick={() => setShowMobilePreview((p) => !p)}
              className="flex items-center justify-center h-8 w-8 rounded-xl border border-[#243041] bg-[#111827] text-slate-400 hover:border-slate-500 hover:text-white lg:hidden transition-all"
            >
              {showMobilePreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Template Strip */}
        <AnimatePresence>
          {templateSelectorOpen && (
            <motion.div
              key="template-selector"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#243041] bg-[#0d1424]/90"
            >
              <div className="mx-auto max-w-full px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Choose Layout Template</span>
                  <button onClick={() => setTemplateSelectorOpen(false)} className="text-slate-500 hover:text-slate-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <TemplateSelector
                  selected={form.templateId}
                  onChange={(id: TemplateId) => {
                    setForm((cur) => ({ ...cur, templateId: id }));
                    setTemplateSelectorOpen(false);
                    toast.success(`Swapped to ${id.replace("-", " ")} template`);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── MAIN 3-COLUMN LAYOUT ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-62px)] relative overflow-hidden">

        {/* COLUMN 1: LEFT SIDEBAR — Premium Glassmorphism */}
        <aside
          className="w-full lg:w-[248px] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col shrink-0 z-10 overflow-y-auto relative"
          style={{
            background:
              "linear-gradient(180deg, rgba(9,14,28,0.92) 0%, rgba(10,18,35,0.88) 100%)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            boxShadow:
              "0 0 40px rgba(76,29,149,0.18), inset -1px 0 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* RIGHT SIDE GLOW LINE */}
          <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-transparent via-violet-500/40 to-transparent" />

          {/* ───────────────── SECTION TITLE ───────────────── */}
          <div className="px-5 pt-6 pb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Sections
            </span>
          </div>

          {/* ───────────────── NAVIGATION ───────────────── */}
          <nav className="flex flex-col gap-2 px-3">
            {([
              { id: "basics", label: "Personal Info", icon: User },
              { id: "summary", label: "Summary", icon: FileText },
              { id: "experience", label: "Experience", icon: Briefcase },
              { id: "education", label: "Education", icon: GraduationCap },
              { id: "skills", label: "Skills", icon: Cpu },
              { id: "projects", label: "Projects", icon: FolderGit2 },
              { id: "custom", label: "Custom", icon: Sparkles },
            ] as const).map((step) => {
              const isActive = step.id === currentStep;
              const isDone = isStepCompleted(step.id);
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    `
              group
              relative
              flex
              items-center
              justify-between
              overflow-hidden
              rounded-2xl
              px-4
              py-3
              text-left
              text-[13px]
              font-medium
              transition-all
              duration-300
              border
            `,

                    isActive
                      ? `
                bg-gradient-to-r
                from-violet-500/20
                via-indigo-500/10
                to-transparent

                border-violet-400/30
                text-white

                shadow-[0_0_25px_rgba(139,92,246,0.22)]

                backdrop-blur-xl
              `
                      : `
                border-transparent
                text-slate-400

                hover:bg-white/[0.04]
                hover:border-white/10
                hover:text-slate-100
              `
                  )}
                >
                  {/* ACTIVE GLOW EFFECT */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-transparent pointer-events-none" />
                  )}

                  {/* LEFT SIDE */}
                  <div className="relative z-10 flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-all duration-300",

                        isActive
                          ? "text-violet-300 drop-shadow-[0_0_6px_rgba(167,139,250,0.8)]"
                          : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />

                    <span className="truncate">{step.label}</span>
                  </div>

                  {/* RIGHT SIDE STATUS */}
                  <div className="relative z-10">
                    {isDone ? (
                      <span
                        className="
                  flex
                  h-5
                  w-5
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-emerald-400/30
                  bg-emerald-500/10
                  text-emerald-300
                  shadow-[0_0_10px_rgba(16,185,129,0.35)]
                  shrink-0
                "
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3px]" />
                      </span>
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-slate-600 bg-white/[0.02] shrink-0 block" />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* ───────────────── BOTTOM SECTION ───────────────── */}
          <div className="shrink-0 px-4 pt-5 pb-5 flex flex-col gap-4 border-t border-white/5 mt-5">

            {/* PROFILE COMPLETION */}
            <div
              className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        backdrop-blur-xl
        p-4
        shadow-[0_0_20px_rgba(0,0,0,0.25)]
      "
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Profile Completion
                </span>

                <span className="text-sm font-bold text-violet-300">
                  {calculateCompletion()}%
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-[#0F172A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${calculateCompletion()}%`,
                    background:
                      "linear-gradient(90deg, #8B5CF6 0%, #6366F1 50%, #2563EB 100%)",
                    boxShadow: "0 0 12px rgba(139,92,246,0.6)",
                  }}
                />
              </div>

              <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                Complete all sections for the best ATS results.
              </p>
            </div>

            {/* AI WRITING CARD */}
            <div
              className="
        rounded-2xl
        border
        border-violet-500/20
        bg-violet-500/[0.06]
        backdrop-blur-xl
        p-4
        shadow-[0_0_25px_rgba(139,92,246,0.12)]
      "
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/20">
                  <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300/80">
                  AI Writing Assistance
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Writing Tips
                </span>
              </div>

              <AiTipsPanel
                step={currentStep}
                resumeData={form.resumeData as unknown as Record<string, unknown>}
              />
            </div>
          </div>
        </aside>

        {/* COLUMN 2: CENTER PANEL (Form Editor Inputs) */}
        <main className="w-full lg:w-[500px] xl:w-[540px] border-b lg:border-b-0 lg:border-r border-[#243041] bg-[#070B14] flex flex-col shrink-0 min-h-0">
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <StepForms form={form} setForm={setForm} step={currentStep} aiModel={aiModel} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav Footer controls */}
          <div className="border-t border-[#243041] bg-[#0d1424] px-6 py-4 flex items-center justify-between gap-3">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className="flex items-center gap-1.5 rounded-xl border border-[#243041] bg-[#0F172A] px-4 py-2.5 text-xs font-semibold text-slate-400 transition-all hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-20 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase tabular-nums">
              Step {currentStepIndex + 1} / {STEP_ORDER.length}
            </span>

            <button
              onClick={goForward}
              disabled={!canGoForward}
              className="flex items-center gap-1.5 rounded-xl border border-[#243041] bg-[#0F172A] px-4 py-2.5 text-xs font-semibold text-slate-400 transition-all hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-20 shadow-sm"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </main>

        {/* COLUMN 3: RIGHT PANEL (Live Preview) */}
        <section className="flex-1 bg-[#070b14] flex flex-col min-h-0 overflow-hidden relative" ref={previewPanelRef}>

          {/* ── Preview Top Bar ── */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-[#1e2d42]"
            style={{ background: "rgba(7,11,20,0.9)", backdropFilter: "blur(12px)" }}
          >
            {/* Left: Live Preview label */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-slate-200" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Live Preview</p>
                <p className="text-[10px] text-slate-600">Changes appear instantly</p>
              </div>
            </div>

            {/* Right: Zoom controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomScale(p => Math.max(0.4, p - 0.1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#243041] bg-[#111827] text-slate-400 hover:bg-[#1f2c3f] hover:text-white transition-colors text-base font-bold"
                title="Zoom Out"
              >
                −
              </button>
              <span className="min-w-[44px] text-center text-[11px] font-bold text-slate-300 tabular-nums">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(p => Math.min(1.5, p + 0.1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#243041] bg-[#111827] text-slate-400 hover:bg-[#1f2c3f] hover:text-white transition-colors text-base font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="ml-1 rounded-lg border border-[#243041] bg-[#111827] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:bg-[#1f2c3f] hover:text-white transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Subtle dot grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.022]"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* A4 Canvas */}
          <div className="flex-1 overflow-auto p-8 flex justify-center items-start relative min-h-0">
            <div
              className={cn("overflow-hidden transition-all duration-300 relative", isTemplateLocked && "select-none pointer-events-none")}
              style={{
                width: `${794 * previewScale * zoomScale}px`,
                height: `${1122 * previewScale * zoomScale}px`,
                flexShrink: 0,
                borderRadius: "6px",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              <div className={cn("w-full h-full transition-all", isTemplateLocked && "blur-md opacity-60")}>
                <ResumePreview
                  data={form.resumeData}
                  templateId={form.templateId}
                  theme={form.theme}
                  scale={previewScale * zoomScale}
                  id="resume-preview"
                  animate
                />
              </div>

              {isTemplateLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/45 p-6 text-center backdrop-blur-xs pointer-events-auto">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-4">
                    <Lock className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 font-sans">
                    Premium Template Locked
                  </h3>
                  <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-5">
                    Upgrade to Premium to preview, download, and share your resume using the premium <strong>{TEMPLATE_OPTIONS.find(t => t.id === form.templateId)?.label || form.templateId}</strong> template.
                  </p>
                  <button
                    onClick={() => router.push("/pricing")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/20 hover:from-violet-500 hover:to-indigo-500 transition-all pointer-events-auto"
                  >
                    Upgrade to Premium
                  </button>
                  <span className="text-[10px] text-slate-500 mt-3">
                    Or switch to Axiom or Editorial for free
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* PDF export: handled by window.print() + @media print in globals.css targeting #resume-preview */}

      {/* ── CUSTOMIZATION SLIDING RIGHT DRAWER ── */}
      <AnimatePresence>
        {customizeOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomizeOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm border-l border-[#243041] bg-[#0d1424] shadow-2xl"
            >
              <ThemePanel
                theme={form.theme}
                onChange={(theme) => setForm((cur) => ({ ...cur, theme }))}
                onClose={() => setCustomizeOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile preview drawer */}
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col bg-[#080d18] lg:hidden"
          >
            {/* Mobile preview header */}
            <div className="flex items-center justify-between border-b border-[#243041] bg-[#0d1424] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <p className="text-sm font-semibold text-slate-300">Resume Preview</p>
                <span className="ml-1 rounded-full border border-[#2a3548] bg-[#141c2b] px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-400">
                  {form.templateId}
                </span>
              </div>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-[#1a2235] hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
              <div
                className={cn("overflow-hidden transition-all duration-300 relative", isTemplateLocked && "select-none pointer-events-none")}
                style={{
                  width: `${794 * Math.min(1, (typeof window !== "undefined" ? window.innerWidth - 32 : 360) / 794)}px`,
                  height: `${1122 * Math.min(1, (typeof window !== "undefined" ? window.innerWidth - 32 : 360) / 794)}px`,
                  flexShrink: 0,
                  borderRadius: "6px",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                <div className={cn("w-full h-full transition-all", isTemplateLocked && "blur-md opacity-60")}>
                  <ResumePreview
                    data={form.resumeData}
                    templateId={form.templateId}
                    theme={form.theme}
                    scale={Math.min(1, (typeof window !== "undefined" ? window.innerWidth - 32 : 360) / 794)}
                  />
                </div>

                {isTemplateLocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/45 p-4 text-center backdrop-blur-xs pointer-events-auto">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)] mb-3">
                      <Lock className="h-5 w-5 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      Template Locked
                    </h3>
                    <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed mb-4">
                      Upgrade to Premium to preview and export your resume using this template.
                    </p>
                    <button
                      onClick={() => {
                        setShowMobilePreview(false);
                        router.push("/pricing");
                      }}
                      className="inline-flex items-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-[10px] font-bold text-white hover:from-violet-500 hover:to-indigo-500 transition-all pointer-events-auto"
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer className="relative border-t border-[#243041] bg-[#0d1424] text-slate-600" />

      {/* ── AI Onboarding Modal ── */}
      {showAIModal && (
        <AIResumeOnboardingModal
          onClose={() => setShowAIModal(false)}
          onApply={(updates) => {
            handleApplyAIData(updates);
            setShowAIModal(false);
          }}
        />
      )}

      {/* ── Send Resume via Email Modal (PDF only) ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEmailModal(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#243041] bg-[#0d1424] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white">Send Resume via Email</h2>
              </div>
              <button onClick={() => setShowEmailModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-[#1a2235] hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-xs text-slate-500">Your resume will be sent as a <span className="font-semibold text-violet-400">PDF</span> attachment.</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
                  placeholder="recruiter@company.com"
                  className="w-full rounded-xl border border-[#243041] bg-[#111827] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  autoFocus
                />
              </div>

              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: isSendingEmail ? "none" : "0 6px 20px rgba(124,58,237,0.35)" }}
              >
                {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isSendingEmail ? "Sending…" : "Send PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ResumeUploadModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportExtractedData}
      />

      {mounted && typeof window !== "undefined" && createPortal(
        <div id="print-root">
          <ResumePreview
            data={form.resumeData}
            templateId={form.templateId}
            theme={form.theme}
            scale={1}
            id="resume-print"
            animate={false}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
