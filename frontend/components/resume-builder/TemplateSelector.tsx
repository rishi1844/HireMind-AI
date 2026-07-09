"use client";

/**
 * TemplateSelector.tsx — 2-template selector for Stark and Axiom.
 *
 * Shows only the two available templates with static mini previews.
 * Category filter: All / Professional / ATS
 */

import { useRef, useState } from "react";
import { Check, ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATE_OPTIONS, TemplateId } from "./types";
import { templateConfig } from "@/resumeTemplates/templateConfig";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";

interface Props {
  selected: TemplateId;
  onChange: (id: TemplateId) => void;
  onOpenEditor?: () => void;
}

type Category = "All" | "Professional" | "ATS" | "Modern" | "Executive";

const CATEGORIES: Category[] = ["All", "Professional", "ATS", "Modern", "Executive"];

export function TemplateSelector({ selected, onChange, onOpenEditor }: Props) {
  const { user } = useAuthStore();
  const isPremium = user?.plan === "pro" || user?.plan === "elite";
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = TEMPLATE_OPTIONS.filter((t) => {
    if (activeCategory === "All") return true;
    return templateConfig[t.id]?.category === activeCategory;
  });

  return (
    <div className="space-y-2">
      {/* ── Category filter pills ── */}
      <div
        className="flex items-center gap-1 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest transition-all duration-150",
              activeCategory === cat
                ? "bg-violet-600/25 text-violet-300 ring-1 ring-violet-500/40"
                : "text-slate-600 hover:text-slate-400"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Horizontal scroll strip ── */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#1e293b transparent" }}
      >
        {filtered.map((template) => {
          const isSelected = selected === template.id;
          const cfg = templateConfig[template.id];
          const isLocked = template.id !== "axiom" && template.id !== "editorial" && !isPremium;

          return (
            <button
              key={template.id}
              type="button"
              title={template.label}
              onClick={() => {
                onChange(template.id);
              }}
              className={cn(
                "group relative flex-shrink-0 overflow-hidden rounded-xl border text-left transition-all duration-300",
                "w-[140px]",
                isSelected
                  ? "border-violet-500 bg-[#161b26] ring-2 ring-violet-500/30 shadow-[0_0_20px_rgba(124,58,237,0.25)] scale-[1.02]"
                  : "border-[#243041] bg-[#111827] hover:border-slate-500 hover:bg-[#151e2e] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50"
              )}
            >
              {/* Thumbnail */}
              <div className="relative h-[80px] overflow-hidden border-b border-[#1e2940] transition-transform duration-300 group-hover:scale-[1.03]">
                <MiniPreview templateId={template.id} />

                {/* Lock icon overlay */}
                {isLocked && (
                  <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/90 border border-white/10 text-amber-400 backdrop-blur-[1px] shadow-lg">
                    <Lock className="h-2.5 w-2.5" />
                  </div>
                )}

                {/* Selected overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-violet-600/10 flex items-center justify-center backdrop-blur-[0.5px]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 shadow-lg shadow-violet-700/50">
                      <Check className="h-3 w-3 text-white stroke-[3px]" />
                    </span>
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="px-2.5 py-2 bg-[#0f172a]/60">
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={cn(
                      "truncate text-[10px] font-bold tracking-wide leading-tight transition-colors",
                      isSelected ? "text-violet-400" : "text-slate-200 group-hover:text-slate-100"
                    )}
                  >
                    {template.label}
                  </p>
                  {isLocked ? (
                    <span title="Requires Premium Plan">
                      <Lock className="h-3 w-3 flex-shrink-0 text-amber-500" />
                    </span>
                  ) : cfg?.atsSafe ? (
                    <span title="ATS-Safe Layout">
                      <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex items-center justify-between text-[8px] leading-tight text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-slate-500 truncate">
                    {cfg?.category ?? template.category}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-4 text-xs text-slate-500 italic">No templates in this category.</p>
        )}
      </div>

      {/* Pulse-specific tip banner */}
      {selected === "pulse" && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 mt-1">
          <span className="mt-0.5 flex-shrink-0 text-emerald-400" aria-hidden>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </span>
          <p className="text-[10px] leading-relaxed text-emerald-300/90">
            <span className="font-semibold text-emerald-300">Best for Tech Professionals.</span>{" "}
            Pulse is highly ATS-friendly with a clean serif name, structured sections, and keyword-rich skill grouping — ideal for software engineers, developers, and CS graduates.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Compact mini thumbnail previews ── */
function MiniPreview({ templateId }: { templateId: TemplateId }) {
  switch (templateId) {
    case "stark":
      return (
        <div className="h-full w-full bg-white">
          {/* Green header */}
          <div className="h-[30px] p-1.5" style={{ background: "linear-gradient(135deg, #1b4332, #2d6a4f)" }}>
            <div className="h-2 w-12 rounded bg-white/80" />
            <div className="mt-0.5 flex items-center gap-0.5">
              <div className="h-0.5 w-3 rounded bg-green-300/60" />
              <div className="h-0.5 w-0.5 rounded-full bg-green-300/40" />
              <div className="h-0.5 w-3 rounded bg-green-300/60" />
              <div className="h-0.5 w-0.5 rounded-full bg-green-300/40" />
              <div className="h-0.5 w-3 rounded bg-green-300/60" />
            </div>
          </div>
          {/* Two-column body */}
          <div className="grid grid-cols-[1.5fr_1fr] gap-0.5 p-1">
            <div className="space-y-1">
              <div className="h-0.5 w-5 rounded" style={{ background: "#2d6a4f" }} />
              <div className="h-0.5 rounded bg-slate-200" />
              <div className="h-0.5 w-5/6 rounded bg-slate-200" />
              <div className="h-0.5 w-4/5 rounded bg-slate-200" />
              <div className="mt-1 h-0.5 w-5 rounded" style={{ background: "#2d6a4f" }} />
              <div className="h-0.5 rounded bg-slate-200" />
              <div className="h-0.5 w-3/4 rounded bg-slate-200" />
            </div>
            <div className="space-y-1 rounded p-0.5" style={{ background: "#f7faf8" }}>
              <div className="h-0.5 w-3 rounded" style={{ background: "#2d6a4f" }} />
              <div className="flex flex-wrap gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-1 w-4 rounded-full" style={{ background: "rgba(45,106,79,0.15)", border: "0.5px solid rgba(45,106,79,0.3)" }} />
                ))}
              </div>
              <div className="mt-1 h-0.5 w-3 rounded" style={{ background: "#2d6a4f" }} />
              <div className="h-0.5 rounded bg-slate-200" />
              <div className="h-0.5 w-4/5 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      );

    case "axiom":
      return (
        <div className="h-full w-full bg-white flex">
          {/* Left accent bar */}
          <div className="w-1 flex-shrink-0" style={{ background: "#1E3A8A" }} />
          {/* Content */}
          <div className="flex-1 p-1.5">
            {/* Name */}
            <div className="h-2 w-14 rounded bg-slate-800 mb-0.5" />
            {/* Contact row */}
            <div className="flex gap-1 mb-1">
              <div className="h-0.5 w-4 rounded bg-slate-300" />
              <div className="h-0.5 w-4 rounded bg-slate-300" />
              <div className="h-0.5 w-5 rounded bg-slate-300" />
            </div>
            {/* Divider */}
            <div className="h-px w-full mb-1" style={{ background: "#1E3A8A" }} />
            {/* Section heading */}
            <div className="h-0.5 w-6 rounded mb-0.5" style={{ background: "#1E3A8A" }} />
            {/* Content lines */}
            <div className="h-0.5 rounded bg-slate-200 mb-0.5" />
            <div className="h-0.5 w-5/6 rounded bg-slate-200 mb-0.5" />
            <div className="h-0.5 w-4/5 rounded bg-slate-200 mb-1" />
            {/* Another section */}
            <div className="h-0.5 w-5 rounded mb-0.5" style={{ background: "#1E3A8A" }} />
            <div className="h-0.5 rounded bg-slate-200 mb-0.5" />
            <div className="h-0.5 w-3/4 rounded bg-slate-200" />
          </div>
        </div>
      );

    case "pulse": {
      const selectorAccent = templateConfig.pulse?.selectorAccent || "#1e3a8a";
      return (
        <div className="h-full w-full bg-white p-1">
          <div className="text-center mb-0.5">
            <div className="h-1.5 w-12 mx-auto rounded bg-slate-700 mb-0.5" />
            <div className="h-0.5 w-8 mx-auto rounded bg-slate-400" />
          </div>
          <div className="border-t mb-0.5" style={{ borderColor: selectorAccent }} />
          <div className="space-y-0.5">
            <div className="h-0.5 w-6 rounded mb-0.5" style={{ background: selectorAccent }} />
            {[1, 2, 3].map(i => <div key={i} className="h-0.5 rounded bg-slate-200" />)}
          </div>
        </div>
      );
    }

    case "timeline-v2": {
      const selectorAccent = templateConfig["timeline-v2"]?.selectorAccent || "#059669";
      return (
        <div className="h-full w-full bg-white">
          {/* Header */}
          <div className="p-1 border-b-2" style={{ borderColor: selectorAccent }}>
            <div className="h-1.5 w-10 rounded mb-0.5" style={{ background: selectorAccent }} />
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-0.5 w-4 rounded bg-slate-300" />
              ))}
            </div>
          </div>
          {/* Body: left timeline + right sidebar */}
          <div className="grid grid-cols-[1.45fr_0.9fr] h-full">
            <div className="p-1 space-y-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-1 items-start">
                  <div
                    className="w-2 h-2 rounded-full border-2 mt-0.5 flex-shrink-0"
                    style={{ borderColor: selectorAccent }}
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="h-0.5 rounded bg-slate-400 w-4/5" />
                    <div className="h-0.5 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-1 space-y-0.5" style={{ background: "#f8fafc" }}>
              <div className="h-0.5 w-5 rounded mb-1" style={{ background: selectorAccent }} />
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="h-1 rounded-full border"
                  style={{
                    borderColor: `${selectorAccent}50`,
                    background: `${selectorAccent}15`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    case "nova": {
      const novaAccent = templateConfig.nova?.selectorAccent || "#3b82f6";
      const novaPrimary = "#1e3a5f";
      return (
        <div className="h-full w-full flex" style={{ background: "#ffffff" }}>
          {/* Dark sidebar */}
          <div className="flex-shrink-0 p-1.5" style={{ width: "30%", background: novaPrimary }}>
            {/* Avatar placeholder */}
            <div className="w-5 h-5 rounded mb-1" style={{ background: `${novaAccent}30` }} />
            {/* Name */}
            <div className="h-1.5 w-8 rounded mb-2" style={{ background: "rgba(255,255,255,0.8)" }} />
            {/* Contact items */}
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: `${novaAccent}80` }} />
                <div className="h-0.5 rounded" style={{ background: "rgba(255,255,255,0.35)", width: `${28 - i * 4}px` }} />
              </div>
            ))}
            {/* Skill chips */}
            <div className="flex flex-wrap gap-0.5 mt-1.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-1.5 rounded" style={{ width: `${10 + i * 2}px`, background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.3)" }} />
              ))}
            </div>
          </div>
          {/* White content */}
          <div className="flex-1 p-1.5 space-y-1.5">
            {/* Summary card */}
            <div className="p-1 rounded" style={{ background: `${novaPrimary}08`, borderLeft: `2px solid ${novaAccent}` }}>
              {[1, 2].map(i => <div key={i} className="h-0.5 rounded bg-slate-200 mb-0.5" />)}
            </div>
            {/* Section */}
            <div className="h-0.5 w-8 rounded" style={{ background: novaPrimary }} />
            {[1, 2, 3].map(i => <div key={i} className="h-0.5 rounded bg-slate-200" />)}
          </div>
        </div>
      );
    }

    case "executive": {
      const exAccent  = templateConfig.executive?.selectorAccent || "#2563eb";
      const exPrimary = "#0f172a";
      return (
        <div className="h-full w-full flex" style={{ background: "#ffffff" }}>
          {/* Main left 70% */}
          <div className="flex-1 p-1.5">
            {/* Header */}
            <div className="mb-1 pb-1" style={{ borderBottom: `2px solid ${exPrimary}` }}>
              <div className="h-2 w-14 rounded mb-0.5" style={{ background: exPrimary }} />
              <div className="h-1 w-8 rounded" style={{ background: exAccent }} />
              <div className="flex gap-1 mt-0.5">
                {[1,2,3].map(i => <div key={i} className="h-0.5 w-5 rounded bg-slate-300" />)}
              </div>
            </div>
            {/* Summary card */}
            <div className="p-0.5 mb-1" style={{ background: `${exPrimary}06`, borderLeft: `2px solid ${exAccent}` }}>
              {[1,2].map(i => <div key={i} className="h-0.5 rounded bg-slate-200 mb-0.5" />)}
            </div>
            {/* Experience lines */}
            <div className="h-0.5 w-6 rounded mb-0.5" style={{ background: exPrimary }} />
            {[1,2,3].map(i => <div key={i} className="h-0.5 rounded bg-slate-200 mb-0.5" />)}
          </div>
          {/* Sidebar right 30% */}
          <div className="flex-shrink-0 p-1.5" style={{ width: "30%", background: exPrimary }}>
            {/* Avatar circle */}
            <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ background: `${exAccent}30` }} />
            {/* Achievement stars */}
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: exAccent }} />
                <div className="h-0.5 rounded" style={{ background: "rgba(255,255,255,0.30)", flex: 1 }} />
              </div>
            ))}
            {/* Skills */}
            <div className="flex flex-wrap gap-0.5 mt-1">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-1.5 rounded-full" style={{ width: `${10+i*2}px`, background: "rgba(255,255,255,0.15)", border: "0.5px solid rgba(255,255,255,0.25)" }} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    case "plasma": {
      const plasmaAccent = templateConfig.plasma?.selectorAccent || "#FFB800";
      const plasmaSidebar = "#1a1a2e";
      return (
        <div className="h-full w-full flex" style={{ background: "#ffffff" }}>
          {/* Dark sidebar 30% */}
          <div className="flex-shrink-0 p-1.5 flex flex-col items-center" style={{ width: "30%", background: plasmaSidebar }}>
            {/* Avatar circle */}
            <div className="w-4 h-4 rounded-full mb-1 border" style={{ borderColor: plasmaAccent }} />
            {/* Name */}
            <div className="h-1 w-8 rounded mb-2" style={{ background: plasmaAccent }} />
            {/* Contact lines */}
            {[1, 2].map(i => (
              <div key={i} className="h-0.5 w-6 rounded mb-0.5" style={{ background: "rgba(255,255,255,0.4)" }} />
            ))}
            {/* Skills */}
            <div className="w-full space-y-0.5 mt-1.5">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-0.5">
                  <div className="h-0.5 flex-1 bg-white/20 rounded" />
                  <div className="h-0.5 w-2 rounded" style={{ background: plasmaAccent }} />
                </div>
              ))}
            </div>
          </div>
          {/* White content 70% */}
          <div className="flex-1 p-1.5 space-y-1.5">
            {/* Summary */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: plasmaAccent }} />
                <div className="h-1 w-6 rounded bg-slate-800" />
              </div>
              <div className="h-0.5 w-full bg-slate-200 rounded" />
              <div className="h-0.5 w-4/5 bg-slate-200 rounded" />
            </div>
            {/* Experience timeline */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: plasmaAccent }} />
                <div className="h-1 w-8 rounded bg-slate-800" />
              </div>
              <div className="border-l pl-1 space-y-1" style={{ borderColor: "#e2e8f0" }}>
                {[1, 2].map(i => (
                  <div key={i} className="relative flex items-center">
                    <div className="absolute -left-[5.5px] w-1 h-1 rounded-full" style={{ background: plasmaAccent }} />
                    <div className="h-0.5 w-8 rounded bg-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    case "editorial": {
      const edAccent = templateConfig.editorial?.selectorAccent || "#C8B99A";
      const edPrimary = "#1A1A1A"; // Name & title
      return (
        <div className="h-full w-full flex" style={{ background: "#F5F1EA" }}>
          {/* Left Column 35% */}
          <div className="flex-shrink-0 p-1 flex flex-col" style={{ width: "35%", background: "#EDE8DC", borderRight: `1.2px solid ${edAccent}` }}>
            {/* Top dark block line */}
            <div className="h-0.5 w-full bg-slate-800 mb-1" />
            {/* Section title */}
            <div className="h-1.5 w-8 rounded mb-1" style={{ background: edAccent }} />
            {/* Skill tags */}
            <div className="flex flex-wrap gap-0.5 mb-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-1.5 rounded-full border" style={{ width: `${12 + i * 2}px`, borderColor: `${edAccent}`, background: "#E8E0D0" }} />
              ))}
            </div>
            {/* Education */}
            <div className="h-1.5 w-10 rounded mb-1" style={{ background: edAccent }} />
            <div className="h-1 w-12 rounded bg-slate-500 mb-0.5" />
            <div className="h-0.5 w-8 rounded bg-slate-400" />
          </div>
          {/* Right Column 65% */}
          <div className="flex-1 p-1.5 space-y-1">
            {/* Name */}
            <div className="h-2 w-16 rounded bg-slate-800" style={{ background: edPrimary }} />
            {/* Contacts */}
            <div className="h-0.5 w-14 rounded bg-slate-400" />
            {/* Divider */}
            <div className="h-px w-full bg-slate-300" />
            {/* Profile */}
            <div className="space-y-0.5">
              <div className="h-1.5 w-6 rounded" style={{ background: edAccent }} />
              <div className="h-0.5 rounded bg-slate-200" />
              <div className="h-0.5 w-5/6 rounded bg-slate-200" />
            </div>
            {/* Experience */}
            <div className="space-y-0.5">
              <div className="h-1.5 w-8 rounded" style={{ background: edAccent }} />
              <div className="flex gap-1 items-start">
                <span className="text-[6px] text-slate-400 leading-none">-</span>
                <div className="h-0.5 w-12 rounded bg-slate-300" />
              </div>
              <div className="flex gap-1 items-start">
                <span className="text-[6px] text-slate-400 leading-none">-</span>
                <div className="h-0.5 w-10 rounded bg-slate-300" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    case "academia": {
      const acAccent = templateConfig.academia?.selectorAccent || "#6B1D3E";
      return (
        <div className="h-full w-full flex flex-col" style={{ background: "#ffffff" }}>
          {/* Header */}
          <div className="flex h-[25px] w-full border-b flex-shrink-0">
            <div className="flex-shrink-0 flex items-center justify-center bg-[#EBEBEB]" style={{ width: "32%" }}>
              <div className="w-3.5 h-3.5 rounded-full border border-rose-800" style={{ borderColor: acAccent, width: 12, height: 12 }} />
            </div>
            <div className="flex-1 flex flex-col justify-center pl-2" style={{ background: acAccent }}>
              <div className="h-1.5 w-16 bg-white rounded-sm" />
              <div className="h-1 w-10 bg-white/70 rounded-sm mt-0.5" />
            </div>
          </div>
          {/* Body */}
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="p-1 flex flex-col gap-1 flex-shrink-0" style={{ width: "32%", background: "#F2F2F2" }}>
              <div className="h-0.5 w-6 rounded bg-slate-700" />
              <div className="space-y-0.5">
                {[1, 2].map(i => (
                  <div key={i} className="h-0.5 w-8 rounded bg-slate-400" />
                ))}
              </div>
              <div className="h-0.5 w-7 rounded bg-slate-700 mt-1" />
              <div className="space-y-0.5">
                {[1, 2].map(i => (
                  <div key={i} className="h-0.5 w-9 rounded bg-slate-400" />
                ))}
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 p-1.5 space-y-1.5 relative">
              {/* Timeline track */}
              <div className="absolute left-2.5 top-2 bottom-2 w-px" style={{ background: `${acAccent}25` }} />
              {/* Section 1 */}
              <div className="space-y-0.5 relative pl-2">
                <div className="absolute -left-[6px] top-0.5 w-1.5 h-1.5 rounded-sm" style={{ background: acAccent }} />
                <div className="h-1 w-8 rounded bg-slate-800" />
                <div className="h-0.5 w-full bg-slate-200 rounded" />
              </div>
              {/* Section 2 */}
              <div className="space-y-0.5 relative pl-2">
                <div className="absolute -left-[6px] top-0.5 w-1.5 h-1.5 rounded-sm" style={{ background: acAccent }} />
                <div className="h-1 w-10 rounded bg-slate-800" />
                <div className="h-0.5 w-4/5 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    case "prism": {
      const prismAccent = templateConfig.prism?.selectorAccent || "#0F4C81";
      return (
        <div className="h-full w-full flex flex-col" style={{ background: "#ffffff" }}>
          {/* Top color strip */}
          <div className="h-[3px] w-full" style={{ background: prismAccent }} />
          {/* Dark header */}
          <div className="p-1.5" style={{ background: "#111827" }}>
            <div className="h-1.5 w-14 rounded mb-1" style={{ background: "#ffffff" }} />
            <div className="h-1 w-8 rounded mb-1" style={{ background: prismAccent }} />
            <div className="flex gap-1">
              {[1,2,3].map(i => <div key={i} className="h-0.5 w-5 rounded" style={{ background: "rgba(255,255,255,0.35)" }} />)}
            </div>
          </div>
          {/* Body */}
          <div className="p-1.5 flex-1 space-y-1.5">
            <div className="h-0.5 w-6 rounded" style={{ background: prismAccent }} />
            {[1,2,3].map(i => <div key={i} className="h-0.5 rounded bg-slate-200" />)}
            {/* Chip skills */}
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-1.5 rounded-full" style={{ width: `${10+i*2}px`, background: i%2===0 ? prismAccent : `${prismAccent}20`, border: `0.5px solid ${prismAccent}50` }} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    case "alchemy": {
      const alchemyAccent = templateConfig.alchemy?.selectorAccent || "#00B4D8";
      const alchemyDark  = "#0D1B2A";
      return (
        <div className="h-full w-full flex" style={{ background: "#ffffff" }}>
          {/* Dark sidebar */}
          <div className="flex-shrink-0" style={{ width: "32%", background: alchemyDark }}>
            {/* Colored header block in sidebar */}
            <div className="p-1" style={{ background: alchemyAccent }}>
              <div className="w-4 h-4 rounded-full mx-auto mb-0.5" style={{ background: "rgba(255,255,255,0.4)" }} />
              <div className="h-1 w-8 rounded mx-auto" style={{ background: "rgba(255,255,255,0.9)" }} />
            </div>
            {/* Dot skill meters */}
            <div className="p-1 space-y-1">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between gap-0.5">
                  <div className="h-0.5 flex-1 rounded" style={{ background: "rgba(255,255,255,0.3)" }} />
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(d => <div key={d} className="w-1 h-1 rounded-full" style={{ background: d <= i+2 ? alchemyAccent : "rgba(255,255,255,0.15)" }} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Right white area */}
          <div className="flex-1 p-1.5 space-y-1.5">
            <div className="h-0.5 w-8 rounded" style={{ background: alchemyAccent }} />
            {/* Experience with left border */}
            <div className="border-l-2 pl-1 space-y-0.5" style={{ borderColor: alchemyAccent }}>
              {[1,2].map(i => <div key={i} className="h-0.5 rounded bg-slate-400" />)}
            </div>
            {/* Project card */}
            <div className="rounded p-0.5 border-t-2" style={{ borderColor: alchemyAccent, background: "#f8fafc" }}>
              <div className="h-0.5 w-10 rounded bg-slate-700" />
              <div className="h-0.5 w-8 rounded bg-slate-300 mt-0.5" />
            </div>
          </div>
        </div>
      );
    }

    default:
      return <div className="h-full w-full bg-[#0f1623]" />;
  }
}
