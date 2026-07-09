"use client";

import { useState } from "react";
import { Github, Globe, ImagePlus, Link as LinkIcon, Linkedin, Plus, Trash2, Upload, ChevronUp, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { resolveAssetUrl, resumeBuilderService } from "@/services/api";
import { AIWriteButton } from "./AIWriteButton";
import {
  BuilderFormState,
  BuilderStep,
  CustomSection,
  CustomSectionItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeData,
  mkCustomSection,
  mkCustomSectionItem,
  mkEducation,
  mkExperience,
  mkProject,
} from "./types";

/* ─── Dark-mode design system tokens ─── */
const inputClass =
  "w-full rounded-xl border border-[#243041] bg-[#0F172A] px-4 py-3.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-[#111827] focus:shadow-[0_0_12px_rgba(124,58,237,0.15)]";

const textareaClass =
  "w-full rounded-xl border border-[#243041] bg-[#0F172A] px-4 py-3.5 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-[#111827] focus:shadow-[0_0_12px_rgba(124,58,237,0.15)] resize-none";

const cardClass = "rounded-2xl border border-[#243041] bg-[#111827] p-6 shadow-xl shadow-black/40 transition-all duration-200 hover:border-slate-800";
const innerCardClass = "rounded-xl border border-[#243041] bg-[#0d131f] p-5";

const degreeSuggestions = [
  "B.Tech in Computer Science",
  "B.Sc in Computer Science",
  "BE in Information Technology",
  "M.Tech in Computer Science",
  "MBA",
  "BBA",
  "B.Com",
  "M.Sc in Data Science",
  "BCA",
  "Diploma in Engineering",
];

const collegeSuggestions = [
  "IIT Bombay",
  "IIT Delhi",
  "IIT Madras",
  "NIT Trichy",
  "NIT Surathkal",
  "BITS Pilani",
  "Delhi University",
  "Jadavpur University",
  "Anna University",
  "Vellore Institute of Technology",
  "Chandigarh University",
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </label>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#243041] bg-transparent py-4 text-sm font-semibold text-slate-400 transition-all duration-200 hover:border-violet-500/50 hover:bg-violet-500/5 hover:text-violet-300"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-900/30 bg-rose-950/20 text-rose-400 transition-all duration-200 hover:bg-rose-950/40 hover:text-rose-300"
      title="Remove Entry"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function MoveButtons({
  index,
  total,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onMoveUp}
        disabled={index === 0}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#243041] bg-[#0F172A] text-slate-400 hover:bg-[#151f32] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-20 transition-colors"
        title="Move Up"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={index === total - 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#243041] bg-[#0F172A] text-slate-400 hover:bg-[#151f32] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-20 transition-colors"
        title="Move Down"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

type SetForm = React.Dispatch<React.SetStateAction<BuilderFormState>>;

function updateData<K extends keyof ResumeData>(setForm: SetForm, key: K, value: ResumeData[K]) {
  setForm((current) => ({
    ...current,
    resumeData: {
      ...current.resumeData,
      [key]: value,
    },
  }));
}

interface StepProps {
  form: BuilderFormState;
  setForm: SetForm;
  step: BuilderStep;
  aiModel?: "gemini" | "gpt";
}

export function StepForms({ form, setForm, step, aiModel }: StepProps) {
  const data = form.resumeData;
  const upd = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => updateData(setForm, key, value);

  switch (step) {
    case "basics":
      return <BasicsStep data={data} upd={upd} />;
    case "summary":
      return <SummaryStep data={data} upd={upd} aiModel={aiModel} />;
    case "education":
      return <EducationStep data={data} upd={upd} />;
    case "experience":
      return <ExperienceStep data={data} upd={upd} aiModel={aiModel} />;
    case "projects":
      return <ProjectsStep data={data} upd={upd} aiModel={aiModel} />;
    case "skills":
      return <SkillsStep data={data} upd={upd} />;
    case "custom":
      return <CustomStep data={data} upd={upd} />;
  }
}

/* ─── BASICS ─── */
function BasicsStep({
  data,
  upd,
}: {
  data: ResumeData;
  upd: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleProfileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toBase64 = (f: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });

    setUploading(true);
    try {
      const base64 = await toBase64(file);
      upd("profileImageUrl", base64);
      resumeBuilderService.uploadProfileImage(file).then(({ data: response }) => {
        void response;
      }).catch(() => { });
      toast.success("Profile photo uploaded");
    } catch {
      toast.error("Profile photo upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const profilePreview = data.profileImageUrl
    ? (data.profileImageUrl.startsWith("data:") ? data.profileImageUrl : resolveAssetUrl(data.profileImageUrl))
    : "";

  return (
    <div className="space-y-6">
      <StepHeader
        title="Personal Details"
        description="Your identity block — exactly as it'll appear on the resume."
      />

      {/* ── Contact fields FIRST ── */}
      <div className={cardClass}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full Name">
            <input value={data.fullName} onChange={(e) => upd("fullName", e.target.value)} placeholder="Jane Doe" className={inputClass} />
          </Field>
          <Field label="Email">
            <input value={data.email} onChange={(e) => upd("email", e.target.value)} placeholder="jane@example.com" className={inputClass} />
          </Field>
          <Field label="Phone">
            <input value={data.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="+91 98765 43210" className={inputClass} />
          </Field>
          <Field label="Location">
            <input value={data.location} onChange={(e) => upd("location", e.target.value)} placeholder="Bengaluru, India" className={inputClass} />
          </Field>
          <Field label="LinkedIn URL">
            <div className="relative">
              <Linkedin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <input value={data.linkedin} onChange={(e) => upd("linkedin", e.target.value)} placeholder="linkedin.com/in/janedoe" className={`${inputClass} pl-11`} />
            </div>
          </Field>
          <Field label="GitHub URL">
            <div className="relative">
              <Github className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={data.github} onChange={(e) => upd("github", e.target.value)} placeholder="github.com/janedoe" className={`${inputClass} pl-11`} />
            </div>
          </Field>
          <Field label="Portfolio URL" className="sm:col-span-2">
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
              <input value={data.portfolio} onChange={(e) => upd("portfolio", e.target.value)} placeholder="https://janedoe.dev" className={`${inputClass} pl-11`} />
            </div>
          </Field>
        </div>
      </div>

      {/* ── Photo Upload — BELOW all contact fields ── */}
      <div className="rounded-2xl border border-dashed border-[#2e3f58] bg-[#0d1525] p-5 shadow-lg shadow-black/20 transition-all hover:border-violet-500/40 hover:shadow-violet-950/20"
        style={{ boxShadow: "0 0 0 0px #7C3AED00, 0 4px 24px rgba(0,0,0,0.4)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 1px rgba(124,58,237,0.18), 0 4px 24px rgba(0,0,0,0.4)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 0px #7C3AED00, 0 4px 24px rgba(0,0,0,0.4)"; }}
      >
        <div className="flex items-center gap-2 mb-4">
          <ImagePlus className="h-4 w-4 text-violet-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Profile Photo</span>
          <span className="ml-auto text-[10px] text-slate-600 font-medium">Optional</span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Preview */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#243041] bg-[#0F172A] shadow-inner">
            {profilePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center">
                <ImagePlus className="mx-auto h-6 w-6 text-slate-600" />
                <p className="mt-1 text-[9px] uppercase tracking-wider font-bold text-slate-600">Photo</p>
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2.5">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-300 transition-all hover:border-violet-500/60 hover:bg-violet-500/20 hover:text-violet-200">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
              </label>
              <button
                type="button"
                onClick={() => upd("profileImageUrl", "")}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-950 bg-rose-950/20 px-4 py-2.5 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-900/30 hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
            <Field label="Or paste Photo URL">
              <input
                value={data.profileImageUrl}
                onChange={(e) => upd("profileImageUrl", e.target.value)}
                placeholder="https://your-site.com/photo.jpg"
                className={inputClass}
              />
            </Field>
            <p className="text-[11px] text-slate-600 leading-normal">
              Templates that support photos will render it as a professional circular avatar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SUMMARY ─── */
function SummaryStep({
  data,
  upd,
  aiModel,
}: {
  data: ResumeData;
  upd: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
  aiModel?: "gemini" | "gpt";
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Professional Summary"
        description="Who you are, what you do, and the value you bring — in 3–4 sentences."
      />

      <div className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <Label>Summary Description</Label>
          <AIWriteButton
            fieldType="summary"
            name={data.fullName}
            skills={data.skills.join(", ")}
            experienceInput={data.experience.map((i) => `${i.role} at ${i.company}`).filter(Boolean).join("; ")}
            targetRole={data.experience[0]?.role}
            onGenerated={(text) => upd("summary", text)}
            aiModel={aiModel}
          />
        </div>

        <textarea
          rows={8}
          value={data.summary}
          onChange={(e) => upd("summary", e.target.value)}
          placeholder="Results-driven software engineer with 4+ years of experience building scalable products..."
          className={textareaClass}
        />

        <p className="mt-3.5 text-[11px] text-slate-500 leading-normal">
          Aim for 3–4 sentences. Prioritize major outcomes, domain expertise, and the type of role you want next.
        </p>
      </div>
    </div>
  );
}

/* ─── EDUCATION ─── */
function EducationStep({
  data,
  upd,
}: {
  data: ResumeData;
  upd: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isExpanded = (id: string) => expanded[id] !== false; // default expanded

  const update = (index: number, field: keyof EducationItem, value: string) => {
    upd("education", data.education.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const add = () => {
    const newItem = mkEducation();
    upd("education", [...data.education, newItem]);
  };

  const remove = (index: number) => upd("education", data.education.filter((_, i) => i !== index));

  const moveUp = (index: number) => {
    if (index === 0) return;
    const list = [...data.education];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    upd("education", list);
  };

  const moveDown = (index: number) => {
    if (index === data.education.length - 1) return;
    const list = [...data.education];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    upd("education", list);
  };

  return (
    <div className="space-y-5">
      <StepHeader title="Education" description="Degrees, diplomas, coursework, or academic highlights." />

      <datalist id="edu-degree">
        {degreeSuggestions.map((d) => <option key={d} value={d} />)}
      </datalist>
      <datalist id="edu-college">
        {collegeSuggestions.map((c) => <option key={c} value={c} />)}
      </datalist>

      <div className="space-y-4">
        {data.education.map((edu, index) => {
          const expandedState = isExpanded(edu.id);
          return (
            <div key={edu.id} className={cardClass}>
              {/* Card Header (Collapsible toggle) */}
              <div
                onClick={() => toggleExpand(edu.id)}
                className="flex cursor-pointer select-none items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-500 transition-transform duration-200",
                      !expandedState && "-rotate-90"
                    )}
                  />
                  <p className="truncate text-sm font-bold text-slate-200">
                    {edu.degree || edu.college
                      ? `${edu.degree || "Degree"} at ${edu.college || "College"}`
                      : `Education ${index + 1}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <MoveButtons
                    index={index}
                    total={data.education.length}
                    onMoveUp={() => moveUp(index)}
                    onMoveDown={() => moveDown(index)}
                  />
                  {data.education.length > 1 && <RemoveButton onClick={() => remove(index)} />}
                </div>
              </div>

              {expandedState && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 border-t border-[#1e293b]/50 pt-5">
                  <Field label="Degree">
                    <input list="edu-degree" value={edu.degree} onChange={(e) => update(index, "degree", e.target.value)} placeholder="B.Tech in Computer Science" className={inputClass} />
                  </Field>
                  <Field label="College / University">
                    <input list="edu-college" value={edu.college} onChange={(e) => update(index, "college", e.target.value)} placeholder="IIT Bombay" className={inputClass} />
                  </Field>
                  <Field label="Year / Duration">
                    <input value={edu.year} onChange={(e) => update(index, "year", e.target.value)} placeholder="2019 – 2023" className={inputClass} />
                  </Field>
                  <Field label="CGPA / Percentage">
                    <input value={edu.score} onChange={(e) => update(index, "score", e.target.value)} placeholder="8.5 / 88%" className={inputClass} />
                  </Field>
                  <Field label="Highlights" className="sm:col-span-2">
                    <textarea rows={3.5} value={edu.description} onChange={(e) => update(index, "description", e.target.value)} placeholder="Relevant coursework, GPA, honors, leadership..." className={textareaClass} />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddButton onClick={add} label="Add Education" />
    </div>
  );
}

/* ─── EXPERIENCE ─── */
function ExperienceStep({
  data,
  upd,
  aiModel,
}: {
  data: ResumeData;
  upd: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
  aiModel?: "gemini" | "gpt";
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isExpanded = (id: string) => expanded[id] !== false; // default expanded

  const update = (index: number, field: keyof ExperienceItem, value: string) => {
    upd("experience", data.experience.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const add = () => {
    const newItem = mkExperience();
    upd("experience", [...data.experience, newItem]);
  };

  const remove = (index: number) => upd("experience", data.experience.filter((_, i) => i !== index));

  const moveUp = (index: number) => {
    if (index === 0) return;
    const list = [...data.experience];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    upd("experience", list);
  };

  const moveDown = (index: number) => {
    if (index === data.experience.length - 1) return;
    const list = [...data.experience];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    upd("experience", list);
  };

  return (
    <div className="space-y-5">
      <StepHeader
        title="Work Experience"
        description="Write for impact. Focus on outcomes, ownership, and measurable contributions."
      />

      <div className="space-y-4">
        {data.experience.map((exp, index) => {
          const expandedState = isExpanded(exp.id);
          return (
            <div key={exp.id} className={cardClass}>
              {/* Header */}
              <div
                onClick={() => toggleExpand(exp.id)}
                className="flex cursor-pointer select-none items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-500 transition-transform duration-200",
                      !expandedState && "-rotate-90"
                    )}
                  />
                  <p className="truncate text-sm font-bold text-slate-200">
                    {exp.role || exp.company
                      ? `${exp.role || "Role"} at ${exp.company || "Company"}`
                      : `Experience ${index + 1}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <MoveButtons
                    index={index}
                    total={data.experience.length}
                    onMoveUp={() => moveUp(index)}
                    onMoveDown={() => moveDown(index)}
                  />
                  {data.experience.length > 1 && <RemoveButton onClick={() => remove(index)} />}
                </div>
              </div>

              {expandedState && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 border-t border-[#1e293b]/50 pt-5">
                  <Field label="Company">
                    <input value={exp.company} onChange={(e) => update(index, "company", e.target.value)} placeholder="Google" className={inputClass} />
                  </Field>
                  <Field label="Role / Title">
                    <input value={exp.role} onChange={(e) => update(index, "role", e.target.value)} placeholder="Senior Frontend Engineer" className={inputClass} />
                  </Field>
                  <Field label="Duration" className="sm:col-span-2">
                    <input value={exp.duration} onChange={(e) => update(index, "duration", e.target.value)} placeholder="Jan 2022 – Present" className={inputClass} />
                  </Field>
                  <Field label="Achievements &amp; Description" className="sm:col-span-2">
                    <div className="mb-2.5 flex items-center justify-between gap-4">
                      <span className="text-[11px] text-slate-500">Describe your impact and contributions</span>
                      <AIWriteButton
                        fieldType="experience"
                        company={exp.company}
                        role={exp.role}
                        duration={exp.duration}
                        existingDescription={exp.description}
                        onGenerated={(text) => update(index, "description", text)}
                        aiModel={aiModel}
                      />
                    </div>
                    <textarea rows={6} value={exp.description} onChange={(e) => update(index, "description", e.target.value)} placeholder="- Led migration of the design system, reducing release time by 35%..." className={textareaClass} />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddButton onClick={add} label="Add Experience" />
    </div>
  );
}

/* ─── PROJECTS ─── */
function ProjectsStep({
  data,
  upd,
  aiModel,
}: {
  data: ResumeData;
  upd: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
  aiModel?: "gemini" | "gpt";
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isExpanded = (id: string) => expanded[id] !== false; // default expanded

  const update = (index: number, field: keyof ProjectItem, value: string) => {
    upd("projects", data.projects.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const add = () => {
    const newItem = mkProject();
    upd("projects", [...data.projects, newItem]);
  };

  const remove = (index: number) => upd("projects", data.projects.filter((_, i) => i !== index));

  const moveUp = (index: number) => {
    if (index === 0) return;
    const list = [...data.projects];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    upd("projects", list);
  };

  const moveDown = (index: number) => {
    if (index === data.projects.length - 1) return;
    const list = [...data.projects];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    upd("projects", list);
  };

  return (
    <div className="space-y-5">
      <StepHeader
        title="Projects"
        description="Highlight projects that prove depth, initiative, and strong technical judgment."
      />

      <div className="space-y-4">
        {data.projects.map((project, index) => {
          const expandedState = isExpanded(project.id);
          return (
            <div key={project.id} className={cardClass}>
              {/* Header */}
              <div
                onClick={() => toggleExpand(project.id)}
                className="flex cursor-pointer select-none items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-500 transition-transform duration-200",
                      !expandedState && "-rotate-90"
                    )}
                  />
                  <p className="truncate text-sm font-bold text-slate-200">
                    {project.title || "Project Title" ? project.title : `Project ${index + 1}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <MoveButtons
                    index={index}
                    total={data.projects.length}
                    onMoveUp={() => moveUp(index)}
                    onMoveDown={() => moveDown(index)}
                  />
                  {data.projects.length > 1 && <RemoveButton onClick={() => remove(index)} />}
                </div>
              </div>

              {expandedState && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 border-t border-[#1e293b]/50 pt-5">
                  <Field label="Project Title">
                    <input value={project.title} onChange={(e) => update(index, "title", e.target.value)} placeholder="AI Resume Platform" className={inputClass} />
                  </Field>
                  <Field label="Tech Stack">
                    <input value={project.techStack} onChange={(e) => update(index, "techStack", e.target.value)} placeholder="Next.js, Spring Boot, MySQL" className={inputClass} />
                  </Field>
                  <Field label="Description" className="sm:col-span-2">
                    <div className="mb-2.5 flex items-center justify-between gap-4">
                      <span className="text-[11px] text-slate-500">What you built, owned, and the result</span>
                      <AIWriteButton
                        fieldType="project"
                        projectTitle={project.title}
                        techStack={project.techStack}
                        existingDescription={project.description}
                        onGenerated={(text) => update(index, "description", text)}
                        aiModel={aiModel}
                      />
                    </div>
                    <textarea rows={6} value={project.description} onChange={(e) => update(index, "description", e.target.value)} placeholder="Describe the problem, what you built, what you owned, and the result." className={textareaClass} />
                  </Field>
                  <Field label="Link Label (optional)">
                    <div className="relative">
                      <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                      <input value={project.linkLabel} onChange={(e) => update(index, "linkLabel", e.target.value)} placeholder="View on GitHub" className={cn(inputClass, "pl-10")} />
                    </div>
                  </Field>
                  <Field label="Link URL (optional)">
                    <input value={project.linkUrl} onChange={(e) => update(index, "linkUrl", e.target.value)} placeholder="https://github.com/you/project" className={inputClass} />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddButton onClick={add} label="Add Project" />
    </div>
  );
}

/* ─── SKILLS ─── */
function SkillsStep({
  data,
  upd,
}: {
  data: ResumeData;
  upd: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
}) {
  const [input, setInput] = useState("");

  const addSkill = (raw: string) => {
    const normalized = raw.trim();
    if (normalized && !data.skills.includes(normalized)) {
      upd("skills", [...data.skills, normalized]);
    }
    setInput("");
  };

  return (
    <div className="space-y-6">
      <StepHeader
        title="Skills"
        description="Add the keywords and tools recruiters actually search for."
      />

      <div className={cardClass}>
        <div>
          <Label>Add Skill</Label>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSkill(input);
                }
              }}
              placeholder="Type a skill (e.g. React.js) and press Enter"
              className={cn(inputClass, "flex-1")}
            />
            <button
              type="button"
              onClick={() => addSkill(input)}
              className="rounded-xl border border-violet-500/40 bg-violet-600/20 px-5 py-3.5 text-sm font-semibold text-violet-200 transition-all hover:bg-violet-600/30"
            >
              Add
            </button>
          </div>
        </div>

        {data.skills.length > 0 && (
          <div className="mt-6 border-t border-[#1e293b]/50 pt-5">
            <Label>Your Skills ({data.skills.length})</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#243041] bg-[#0F172A] px-3.5 py-2 text-sm text-slate-300"
                  style={{ wordBreak: "break-word", maxWidth: "100%" }}
                >
                  <span style={{ lineHeight: 1.3 }}>{skill}</span>
                  <button
                    type="button"
                    onClick={() => upd("skills", data.skills.filter((s) => s !== skill))}
                    className="flex-shrink-0 text-slate-500 transition-colors hover:text-rose-400 ml-1 text-xs font-bold leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-slate-500 leading-normal">
          Add 6–12 targeted skills for better ATS coverage. Press Enter or comma after each one.
        </p>
      </div>
    </div>
  );
}

/* ─── CUSTOM SECTIONS ─── */
function CustomStep({
  data,
  upd,
}: {
  data: ResumeData;
  upd: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
}) {
  const [expandedSec, setExpandedSec] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleSec = (id: string) => {
    setExpandedSec((p) => ({ ...p, [id]: !p[id] }));
  };
  const toggleItem = (id: string) => {
    setExpandedItems((p) => ({ ...p, [id]: !p[id] }));
  };

  const isSecExpanded = (id: string) => expandedSec[id] !== false;
  const isItemExpanded = (id: string) => expandedItems[id] !== false;

  const updateSection = (index: number, field: keyof CustomSection, value: string | CustomSectionItem[]) => {
    upd("customSections", data.customSections.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const updateItem = (si: number, ii: number, field: keyof CustomSectionItem, value: string) => {
    upd("customSections", data.customSections.map((section, currSi) => {
      if (currSi !== si) return section;
      return { ...section, items: section.items.map((item, currIi) => (currIi === ii ? { ...item, [field]: value } : item)) };
    }));
  };

  const addSection = () => {
    const newSec = mkCustomSection();
    upd("customSections", [...data.customSections, newSec]);
  };

  const removeSection = (index: number) => upd("customSections", data.customSections.filter((_, i) => i !== index));

  const addItem = (si: number) => {
    upd("customSections", data.customSections.map((section, i) =>
      i === si ? { ...section, items: [...section.items, mkCustomSectionItem()] } : section
    ));
  };

  const removeItem = (si: number, ii: number) => {
    upd("customSections", data.customSections.map((section, currSi) => {
      if (currSi !== si) return section;
      return { ...section, items: section.items.filter((_, currIi) => currIi !== ii) };
    }));
  };

  const moveSecUp = (index: number) => {
    if (index === 0) return;
    const list = [...data.customSections];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    upd("customSections", list);
  };

  const moveSecDown = (index: number) => {
    if (index === data.customSections.length - 1) return;
    const list = [...data.customSections];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    upd("customSections", list);
  };

  const moveItemUp = (si: number, ii: number) => {
    if (ii === 0) return;
    const section = data.customSections[si];
    const list = [...section.items];
    const temp = list[ii];
    list[ii] = list[ii - 1];
    list[ii - 1] = temp;
    updateSection(si, "items", list);
  };

  const moveItemDown = (si: number, ii: number) => {
    const section = data.customSections[si];
    if (ii === section.items.length - 1) return;
    const list = [...section.items];
    const temp = list[ii];
    list[ii] = list[ii + 1];
    list[ii + 1] = temp;
    updateSection(si, "items", list);
  };

  return (
    <div className="space-y-5">
      <StepHeader
        title="Custom Sections"
        description="Certificates, awards, volunteering, publications, coding profiles, or languages."
      />

      {data.customSections.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#243041] bg-transparent px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-500">No custom sections added yet.</p>
          <p className="mt-1 text-xs text-slate-600 leading-normal">
            You can add custom templates dynamically for certifications, languages, awards, or custom headers.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {data.customSections.map((section, si) => {
          const secExpanded = isSecExpanded(section.id);
          return (
            <div key={section.id} className={cardClass}>
              {/* Section Header */}
              <div
                onClick={() => toggleSec(section.id)}
                className="flex cursor-pointer select-none items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-500 transition-transform duration-200",
                      !secExpanded && "-rotate-90"
                    )}
                  />
                  <p className="truncate text-sm font-bold text-slate-200">
                    {section.title || `Custom Section ${si + 1}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <MoveButtons
                    index={si}
                    total={data.customSections.length}
                    onMoveUp={() => moveSecUp(si)}
                    onMoveDown={() => moveSecDown(si)}
                  />
                  <RemoveButton onClick={() => removeSection(si)} />
                </div>
              </div>

              {secExpanded && (
                <div className="mt-5 border-t border-[#1e293b]/50 pt-5 space-y-4">
                  <Field label="Section Title">
                    <input value={section.title} onChange={(e) => updateSection(si, "title", e.target.value)} placeholder="Certifications" className={inputClass} />
                  </Field>

                  <div className="space-y-4">
                    {section.items.map((item, ii) => {
                      const itemExpanded = isItemExpanded(item.id);
                      return (
                        <div key={item.id} className={innerCardClass}>
                          {/* Inner Header */}
                          <div
                            onClick={() => toggleItem(item.id)}
                            className="flex cursor-pointer select-none items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ChevronDown
                                className={cn(
                                  "h-3.5 w-3.5 text-slate-500 transition-transform duration-200",
                                  !itemExpanded && "-rotate-90"
                                )}
                              />
                              <p className="truncate text-xs font-bold text-slate-300">
                                {item.heading || `Entry ${ii + 1}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <MoveButtons
                                index={ii}
                                total={section.items.length}
                                onMoveUp={() => moveItemUp(si, ii)}
                                onMoveDown={() => moveItemDown(si, ii)}
                              />
                              {section.items.length > 1 && (
                                <RemoveButton onClick={() => removeItem(si, ii)} />
                              )}
                            </div>
                          </div>

                          {itemExpanded && (
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 border-t border-[#243041]/60 pt-4">
                              <Field label="Entry Title">
                                <input value={item.heading} onChange={(e) => updateItem(si, ii, "heading", e.target.value)} placeholder="AWS Certified Developer - Associate" className={inputClass} />
                              </Field>
                              <Field label="Subtitle">
                                <input value={item.subheading} onChange={(e) => updateItem(si, ii, "subheading", e.target.value)} placeholder="Amazon Web Services | 2024" className={inputClass} />
                              </Field>
                              <Field label="Description" className="sm:col-span-2">
                                <textarea rows={2.5} value={item.description} onChange={(e) => updateItem(si, ii, "description", e.target.value)} placeholder="Add credentials, achievements, or short descriptions." className={textareaClass} />
                              </Field>
                              <Field label="Link Label">
                                <div className="relative">
                                  <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                                  <input value={item.linkLabel} onChange={(e) => updateItem(si, ii, "linkLabel", e.target.value)} placeholder="View credential" className={cn(inputClass, "pl-10")} />
                                </div>
                              </Field>
                              <Field label="Link URL">
                                <input value={item.linkUrl} onChange={(e) => updateItem(si, ii, "linkUrl", e.target.value)} placeholder="https://issuer.example.com/certificate" className={inputClass} />
                              </Field>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <AddButton onClick={() => addItem(si)} label="Add Entry" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddButton onClick={addSection} label="Add Custom Section" />
    </div>
  );
}

/* ─── SHARED ─── */
function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-2">
      <h3 className="text-lg font-bold tracking-tight text-slate-100" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500 leading-normal">{description}</p>
    </div>
  );
}
