"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, BookOpen, Briefcase, CheckCircle2,
  Code2, GraduationCap, Loader2, Plus, Sparkles, Trash2, User, X, Upload
} from "lucide-react";
import toast from "react-hot-toast";
import { resumeBuilderService } from "@/services/api";
import { BuilderFormState, mkEducation, mkExperience, mkProject } from "./types";

/* ─── Types ─── */
interface ModalProps {
  onClose: () => void;
  onApply: (updates: Partial<BuilderFormState["resumeData"]>) => void;
}

interface EduEntry { degree: string; college: string; year: string; score: string; }
interface ExpEntry { company: string; role: string; duration: string; roughDescription: string; }
interface ProjEntry { title: string; techStack: string; roughDescription: string; }

type Step = "basics" | "education" | "projects" | "experience" | "generate";

const STEPS: Step[] = ["basics", "education", "projects", "experience", "generate"];

const stepMeta: Record<Step, { icon: React.ElementType; label: string; color: string }> = {
  basics: { icon: User, label: "Info", color: "violet" },
  education: { icon: GraduationCap, label: "Education", color: "blue" },
  projects: { icon: Code2, label: "Projects", color: "cyan" },
  experience: { icon: Briefcase, label: "Experience", color: "emerald" },
  generate: { icon: Sparkles, label: "Generate", color: "amber" },
};

/* ─── Shared input styles ─── */
const inp = "w-full rounded-xl border border-[#2a3548] bg-[#0f1623] px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20";
const ta = "w-full rounded-xl border border-[#2a3548] bg-[#0f1623] px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/20 resize-none leading-relaxed";

export function AIResumeOnboardingModal({ onClose, onApply }: ModalProps) {
  const [step, setStep] = useState<Step>("basics");
  const [generating, setGenerating] = useState(false);

  // Resume Upload/OCR states
  const [optionTab, setOptionTab] = useState<"manual" | "import">("manual");
  const [importingState, setImportingState] = useState<'idle' | 'extracting' | 'ai_reading' | 'mapping'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Form state ─── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");

  const [educations, setEducations] = useState<EduEntry[]>([{ degree: "", college: "", year: "", score: "" }]);
  const [projects, setProjects] = useState<ProjEntry[]>([{ title: "", techStack: "", roughDescription: "" }]);
  const [experiences, setExperiences] = useState<ExpEntry[]>([{ company: "", role: "", duration: "", roughDescription: "" }]);

  const stepIdx = STEPS.indexOf(step);
  const isFirst = stepIdx === 0;
  const isLast = step === "generate";

  const goNext = () => setStep(STEPS[stepIdx + 1]);
  const goPrev = () => setStep(STEPS[stepIdx - 1]);

  /* ─── Education helpers ─── */
  const addEdu = () => setEducations(p => [...p, { degree: "", college: "", year: "", score: "" }]);
  const removeEdu = (i: number) => setEducations(p => p.filter((_, idx) => idx !== i));
  const setEdu = (i: number, f: keyof EduEntry, v: string) =>
    setEducations(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  /* ─── Project helpers ─── */
  const addProj = () => setProjects(p => [...p, { title: "", techStack: "", roughDescription: "" }]);
  const removeProj = (i: number) => setProjects(p => p.filter((_, idx) => idx !== i));
  const setProj = (i: number, f: keyof ProjEntry, v: string) =>
    setProjects(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  /* ─── Experience helpers ─── */
  const addExp = () => setExperiences(p => [...p, { company: "", role: "", duration: "", roughDescription: "" }]);
  const removeExp = (i: number) => setExperiences(p => p.filter((_, idx) => idx !== i));
  const setExp = (i: number, f: keyof ExpEntry, v: string) =>
    setExperiences(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  /* ─── Generate & Apply ─── */
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Build rich experience context (include rough descriptions so GPT can generate accurate bullets)
      const experienceInput = experiences
        .filter(e => e.role || e.company)
        .map(e => {
          const base = `${e.role} at ${e.company} (${e.duration})`;
          return e.roughDescription ? `${base}: ${e.roughDescription}` : base;
        })
        .join("; ");

      // Build project context with rough descriptions
      const projectsInput = projects
        .filter(p => p.title)
        .map(p => {
          const base = `${p.title} [${p.techStack}]`;
          return p.roughDescription ? `${base}: ${p.roughDescription}` : base;
        })
        .join("; ");

      const { data } = await resumeBuilderService.generateField({
        fieldType: "full",
        name: name.trim() || "Candidate",
        skills: skills.trim(),
        experienceInput,
        existingDescription: projectsInput, // reuse this field to pass project context to GPT
        aiModel: "gpt",
      });

      const generated = JSON.parse(data.generatedText);

      /* Map AI output → form data */
      const newEducation = educations
        .filter(e => e.degree || e.college)
        .map(e => ({ ...mkEducation(), degree: e.degree, college: e.college, year: e.year, score: e.score }));

      const newProjects = Array.isArray(generated.projects)
        ? generated.projects.map((p: Record<string, unknown>) => ({
          ...mkProject(),
          title: String(p.title ?? projects[0]?.title ?? ""),
          techStack: String(p.techStack ?? projects[0]?.techStack ?? ""),
          description: String(p.description ?? ""),
        }))
        : projects
          .filter(p => p.title)
          .map(p => ({ ...mkProject(), title: p.title, techStack: p.techStack }));

      const newExperience = Array.isArray(generated.experience)
        ? generated.experience.map((e: Record<string, unknown>) => ({
          ...mkExperience(),
          company: String(e.company ?? ""),
          role: String(e.role ?? ""),
          duration: String(e.duration ?? ""),
          description: String(e.description ?? ""),
        }))
        : experiences
          .filter(e => e.role || e.company)
          .map(e => ({ ...mkExperience(), company: e.company, role: e.role, duration: e.duration }));

      const skillsList: string[] = Array.isArray(generated.skills)
        ? generated.skills.map(String)
        : skills.split(",").map(s => s.trim()).filter(Boolean);

      onApply({
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        summary: generated.summary ?? "",
        skills: skillsList,
        education: newEducation,
        projects: newProjects,
        experience: newExperience,
      });

      toast.success("Resume draft generated with Vita AI ✓");
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "AI generation failed. Check your inputs and try again.";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleImportFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are accepted.");
      return;
    }

    setImportingState('extracting');

    // Simulate state transitions
    const timer1 = setTimeout(() => setImportingState('ai_reading'), 1800);
    const timer2 = setTimeout(() => setImportingState('mapping'), 4000);

    try {
      const { data } = await resumeBuilderService.extractResume(file);

      clearTimeout(timer1);
      clearTimeout(timer2);
      setImportingState('mapping');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Pre-fill manual form fields
      if (data.personalInfo?.fullName) setName(data.personalInfo.fullName);
      if (data.personalInfo?.email) setEmail(data.personalInfo.email);
      if (data.personalInfo?.phone) setPhone(data.personalInfo.phone);
      if (data.personalInfo?.location) setLocation(data.personalInfo.location);

      if (Array.isArray(data.skills) && data.skills.length > 0) {
        setSkills(data.skills.join(", "));
      }

      if (Array.isArray(data.education) && data.education.length > 0) {
        setEducations(data.education.map((e: any) => ({
          degree: e.degree || "",
          college: e.institution || "",
          year: e.startYear && e.endYear ? `${e.startYear} - ${e.endYear}` : (e.startYear || e.endYear || ""),
          score: e.gpa || "",
        })));
      }

      if (Array.isArray(data.experience) && data.experience.length > 0) {
        setExperiences(data.experience.map((e: any) => ({
          company: e.company || "",
          role: e.role || "",
          duration: e.startDate && e.endDate ? `${e.startDate} - ${e.endDate}` : (e.startDate || e.endDate || ""),
          roughDescription: e.description || (e.bullets ? e.bullets.join("\n") : ""),
        })));
      }

      if (Array.isArray(data.projects) && data.projects.length > 0) {
        setProjects(data.projects.map((p: any) => ({
          title: p.name || "",
          techStack: p.technologies || "",
          roughDescription: p.description || "",
        })));
      }

      toast.success("Resume data pre-filled successfully!");
      setOptionTab("manual");
      setStep("basics"); // switch to basics step for manual review/editing
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const errMsg = err.response?.data?.message || err.message || "Failed to parse resume";
      toast.error(errMsg);
    } finally {
      setImportingState('idle');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal card */}
        <motion.div
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-violet-500/40 bg-[#0d1424] shadow-[0_0_30px_rgba(168,85,247,0.25),0_10px_40px_rgba(0,0,0,0.7)]"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1e2940] bg-[#0a0f1c] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">AI Resume Builder</p>
                <p className="text-[11px] text-slate-500">Vita AI powered · ATS-friendly</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-[#1a2235] hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Option Tabs */}
          <div className="flex border-b border-[#1e2940] bg-[#0a0f1c]/30 p-1">
            <button
              onClick={() => setOptionTab("manual")}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg ${optionTab === "manual"
                ? "bg-violet-600/15 text-violet-300 border border-violet-500/10"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Fill Manually
            </button>
            <button
              onClick={() => setOptionTab("import")}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition-all rounded-lg ${optionTab === "import"
                ? "bg-violet-600/15 text-violet-300 border border-violet-500/10"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Import from Resume
            </button>
          </div>

          {optionTab === "manual" ? (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 border-b border-[#1e2940] bg-[#0d1424] px-6 py-3">
                {STEPS.map((s, i) => {
                  const meta = stepMeta[s];
                  const Icon = meta.icon;
                  const isActive = s === step;
                  const isComplete = STEPS.indexOf(s) < stepIdx;
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all ${isActive ? "bg-violet-600/30 text-violet-300 ring-1 ring-violet-500/40" :
                        isComplete ? "bg-emerald-500/15 text-emerald-400" :
                          "text-slate-600"
                        }`}>
                        {isComplete ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                        <span className="hidden sm:inline">{meta.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`h-px w-4 ${isComplete ? "bg-emerald-500/40" : "bg-[#2a3548]"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step content */}
              <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* ── BASICS ── */}
                    {step === "basics" && (
                      <div className="space-y-4">
                        <SectionHead icon={User} title="Basic Info" desc="Your name, contact, and skills." color="violet" />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FField label="Full Name"><input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className={inp} /></FField>
                          <FField label="Email"><input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className={inp} /></FField>
                          <FField label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inp} /></FField>
                          <FField label="Location"><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Bengaluru, India" className={inp} /></FField>
                        </div>
                        <FField label="Skills (comma separated)">
                          <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, Python, MySQL, AWS" className={inp} />
                          <p className="mt-1.5 text-[11px] text-slate-600">Add 6–12 targeted skills for best ATS coverage.</p>
                        </FField>
                      </div>
                    )}

                    {/* ── EDUCATION ── */}
                    {step === "education" && (
                      <div className="space-y-4">
                        <SectionHead icon={GraduationCap} title="Education" desc="Your degrees and academic background." color="blue" />
                        {educations.map((edu, i) => (
                          <div key={i} className="rounded-xl border border-[#2a3548] bg-[#111827] p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-400">Education {i + 1}</p>
                              {educations.length > 1 && (
                                <button onClick={() => removeEdu(i)} className="rounded-lg border border-rose-800/50 bg-rose-900/20 p-1.5 text-rose-400 hover:bg-rose-900/40">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FField label="Degree"><input value={edu.degree} onChange={e => setEdu(i, "degree", e.target.value)} placeholder="B.Tech in Computer Science" className={inp} /></FField>
                              <FField label="College / University"><input value={edu.college} onChange={e => setEdu(i, "college", e.target.value)} placeholder="IIT Bombay" className={inp} /></FField>
                              <FField label="Year"><input value={edu.year} onChange={e => setEdu(i, "year", e.target.value)} placeholder="2019 – 2023" className={inp} /></FField>
                              <FField label="CGPA / %"><input value={edu.score} onChange={e => setEdu(i, "score", e.target.value)} placeholder="8.5 / 88%" className={inp} /></FField>
                            </div>
                          </div>
                        ))}
                        <button onClick={addEdu} className="flex items-center gap-2 rounded-xl border border-dashed border-[#2a3548] px-4 py-2 text-sm text-slate-500 transition-all hover:border-violet-500/50 hover:text-violet-300">
                          <Plus className="h-4 w-4" /> Add Education
                        </button>
                      </div>
                    )}

                    {/* ── PROJECTS ── */}
                    {step === "projects" && (
                      <div className="space-y-4">
                        <SectionHead icon={Code2} title="Projects" desc="Add a rough description — Vita AI will write ATS-friendly bullet points." color="cyan" />
                        {projects.map((proj, i) => (
                          <div key={i} className="rounded-xl border border-[#2a3548] bg-[#111827] p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-400">Project {i + 1}</p>
                              {projects.length > 1 && (
                                <button onClick={() => removeProj(i)} className="rounded-lg border border-rose-800/50 bg-rose-900/20 p-1.5 text-rose-400 hover:bg-rose-900/40">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FField label="Project Title"><input value={proj.title} onChange={e => setProj(i, "title", e.target.value)} placeholder="AI Resume Platform" className={inp} /></FField>
                              <FField label="Tech Stack"><input value={proj.techStack} onChange={e => setProj(i, "techStack", e.target.value)} placeholder="Next.js, Node.js, MySQL" className={inp} /></FField>
                            </div>
                            <div className="mt-3">
                              <FField label="Rough Description (optional — GPT will polish this into bullets)">
                                <textarea
                                  rows={3}
                                  value={proj.roughDescription}
                                  onChange={e => setProj(i, "roughDescription", e.target.value)}
                                  placeholder="e.g. Built a resume builder with AI suggestions, users can export PDF, had 500+ users in 2 weeks..."
                                  className={ta}
                                />
                              </FField>
                            </div>
                          </div>
                        ))}
                        <button onClick={addProj} className="flex items-center gap-2 rounded-xl border border-dashed border-[#2a3548] px-4 py-2 text-sm text-slate-500 transition-all hover:border-cyan-500/50 hover:text-cyan-300">
                          <Plus className="h-4 w-4" /> Add Project
                        </button>
                        <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3">
                          <p className="text-[11px] text-cyan-300/80">
                            <BookOpen className="mr-1 inline h-3 w-3" />
                            Vita AI will expand your rough notes into professional ATS-optimized bullet points.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── EXPERIENCE ── */}
                    {step === "experience" && (
                      <div className="space-y-4">
                        <SectionHead icon={Briefcase} title="Experience" desc="Add a rough description — Vita AI will craft impactful bullet points." color="emerald" />
                        {experiences.map((exp, i) => (
                          <div key={i} className="rounded-xl border border-[#2a3548] bg-[#111827] p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-400">Experience {i + 1}</p>
                              {experiences.length > 1 && (
                                <button onClick={() => removeExp(i)} className="rounded-lg border border-rose-800/50 bg-rose-900/20 p-1.5 text-rose-400 hover:bg-rose-900/40">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FField label="Company"><input value={exp.company} onChange={e => setExp(i, "company", e.target.value)} placeholder="Google" className={inp} /></FField>
                              <FField label="Role / Title"><input value={exp.role} onChange={e => setExp(i, "role", e.target.value)} placeholder="Senior Engineer" className={inp} /></FField>
                              <FField label="Duration" className="sm:col-span-2"><input value={exp.duration} onChange={e => setExp(i, "duration", e.target.value)} placeholder="Jan 2022 – Present" className={inp} /></FField>
                            </div>
                            <div className="mt-3">
                              <FField label="Rough Description (optional — GPT will polish this into bullets)">
                                <textarea
                                  rows={3}
                                  value={exp.roughDescription}
                                  onChange={e => setExp(i, "roughDescription", e.target.value)}
                                  placeholder="e.g. Led migration of payment system to microservices, reduced latency by 40%, managed team of 5 devs..."
                                  className={ta}
                                />
                              </FField>
                            </div>
                          </div>
                        ))}
                        <button onClick={addExp} className="flex items-center gap-2 rounded-xl border border-dashed border-[#2a3548] px-4 py-2 text-sm text-slate-500 transition-all hover:border-emerald-500/50 hover:text-emerald-300">
                          <Plus className="h-4 w-4" /> Add Experience
                        </button>
                        <p className="text-[11px] text-slate-600">You can leave rough descriptions blank — Vita AI will still generate bullet points from your role and company.</p>
                      </div>
                    )}

                    {/* ── GENERATE ── */}
                    {step === "generate" && (
                      <div className="space-y-5">
                        <SectionHead icon={Sparkles} title="Generate Resume" desc="Vita AI will craft an ATS-optimized resume with your details." color="amber" />

                        {/* Summary of what was entered */}
                        <div className="space-y-2">
                          {[
                            { label: "Name", value: name || "Not set" },
                            { label: "Skills", value: skills || "Not set" },
                            { label: "Education", value: `${educations.filter(e => e.degree || e.college).length} added` },
                            { label: "Projects", value: `${projects.filter(p => p.title).length} added (${projects.filter(p => p.roughDescription).length} with rough notes)` },
                            { label: "Experience", value: `${experiences.filter(e => e.role || e.company).length} added (${experiences.filter(e => e.roughDescription).length} with rough notes)` },
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between rounded-lg border border-[#2a3548] bg-[#111827] px-4 py-2">
                              <span className="text-xs text-slate-500">{item.label}</span>
                              <span className="text-xs font-medium text-slate-300 max-w-[60%] truncate text-right">{item.value}</span>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
                          <p className="text-[11px] leading-relaxed text-amber-300/90">
                            <strong>What Vita AI will generate:</strong> Professional summary, ATS-friendly bullet points for each experience and project using your rough descriptions as context, and a curated skills list. You can manually edit everything after.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          ) : (
            /* Option B Upload Content */
            <div className="px-6 py-8">
              {importingState === 'idle' ? (
                <div className="space-y-5">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer.files?.[0]) {
                        await handleImportFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all hover:bg-violet-950/5 ${dragActive
                      ? "border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                      : "border-[#2a3548] bg-[#111827]/40 hover:border-violet-500/55 hover:shadow-[0_0_12px_rgba(168,85,247,0.12)]"
                      }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          await handleImportFile(e.target.files[0]);
                        }
                      }}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-3">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mb-1 text-center">
                      Drag & drop your resume file here or click to browse
                    </p>
                    <p className="text-[10px] text-slate-500 text-center">
                      Accepts PDF, JPG, PNG (Max 5MB)
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed text-center font-medium">
                    Upload your resume and AI will use your existing data to generate an improved draft
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-5">
                  <div className="relative flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
                    <Sparkles className="absolute h-5 w-5 text-violet-400 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-200 animate-pulse">
                      {importingState === 'extracting' && "Extracting text from your resume..."}
                      {importingState === 'ai_reading' && "AI is reading your resume..."}
                      {importingState === 'mapping' && "Filling in your details..."}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                      <span className={importingState === 'extracting' ? "text-violet-400 font-bold" : "opacity-40"}>Extract</span>
                      <span>→</span>
                      <span className={importingState === 'ai_reading' ? "text-violet-400 font-bold" : "opacity-40"}>Analyze</span>
                      <span>→</span>
                      <span className={importingState === 'mapping' ? "text-violet-400 font-bold" : "opacity-40"}>Map</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer nav */}
          {optionTab === "manual" && (<div className="flex items-center justify-between border-t border-[#1e2940] bg-[#0a0f1c] px-6 py-4">
            <button
              onClick={isFirst ? onClose : goPrev}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl border border-[#2a3548] bg-[#141c2b] px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-[#3a4760] hover:text-slate-200 disabled:opacity-50"
            >
              {isFirst ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {isFirst ? "Cancel" : "Back"}
            </button>

            <span className="text-xs text-slate-600 tabular-nums">
              {stepIdx + 1} / {STEPS.length}
            </span>

            {isLast ? (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating..." : "Generate AI Resume Draft"}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:from-violet-500 hover:to-indigo-500"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>)}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Shared tiny components ─── */
function FField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function SectionHead({ icon: Icon, title, desc, color }: {
  icon: React.ElementType; title: string; desc: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-500/10 text-violet-300",
    blue: "bg-blue-500/10 text-blue-300",
    cyan: "bg-cyan-500/10 text-cyan-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    amber: "bg-amber-500/10 text-amber-300",
  };
  return (
    <div className="mb-2 flex items-start gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="text-[11px] text-slate-500">{desc}</p>
      </div>
    </div>
  );
}
