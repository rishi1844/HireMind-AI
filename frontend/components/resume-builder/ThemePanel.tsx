"use client";

import { useState, useEffect } from "react";
import { Palette, RotateCcw, Check, Type, X, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_THEME, PRESET_THEMES, ResumeFont, ResumeTheme } from "./types";

interface Props {
  theme: ResumeTheme;
  onChange: (theme: ResumeTheme) => void;
  onClose?: () => void;
}

/* ── Google Fonts to preload ── */
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap";

const FONT_OPTIONS: Array<{ label: string; value: ResumeFont; preview: string; category: "Sans" | "Serif" | "Mono" }> = [
  { label: "Inter",             value: "'Inter', system-ui, sans-serif",            preview: "Aa", category: "Sans"  },
  { label: "DM Sans",           value: "'DM Sans', system-ui, sans-serif",          preview: "Aa", category: "Sans"  },
  { label: "Outfit",            value: "'Outfit', system-ui, sans-serif",           preview: "Aa", category: "Sans"  },
  { label: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', system-ui, sans-serif",preview: "Ag", category: "Sans"  },
  { label: "Playfair Display",  value: "'Playfair Display', Georgia, serif",        preview: "Ag", category: "Serif" },
  { label: "Georgia",           value: "Georgia, 'Times New Roman', serif",         preview: "Ag", category: "Serif" },
  { label: "Times New Roman",   value: "'Times New Roman', Times, serif",           preview: "Ag", category: "Serif" },
  { label: "Courier New",       value: "'Courier New', Courier, monospace",         preview: "Ag", category: "Mono"  },
  { label: "Arial",             value: "Arial, Helvetica, sans-serif",              preview: "Aa", category: "Sans"  },
  { label: "System Default",    value: "sans-serif",                                preview: "Aa", category: "Sans"  },
];

export function ThemePanel({ theme, onChange, onClose }: Props) {
  const [fontCategory, setFontCategory] = useState<"All" | "Sans" | "Serif" | "Mono">("All");
  const currentFont = theme.font ?? "sans-serif";
  const headingSize = theme.headingSize ?? 10;
  const bodySize = theme.bodySize ?? 11;

  const activePreset = PRESET_THEMES.find(
    (p) => p.theme.primary === theme.primary && p.theme.accent === theme.accent
  );

  /* Inject Google Fonts link once */
  useEffect(() => {
    const id = "hiremind-gfonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  const filteredFonts = fontCategory === "All"
    ? FONT_OPTIONS
    : FONT_OPTIONS.filter((f) => f.category === fontCategory);

  const updateTheme = (patch: Partial<ResumeTheme>) => onChange({ ...theme, ...patch });

  return (
    <div className="flex h-full flex-col bg-[#0d1424] text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#243041] px-6 py-5">
        <div className="flex items-center gap-2.5">
          <Palette className="h-5 w-5 text-violet-500" />
          <h3 className="text-base font-bold text-slate-100" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Customize Theme
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-[#1a2235] hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body Settings */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Color Presets ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Color Presets</p>
            {activePreset && (
              <span className="text-[10px] font-semibold text-violet-400">{activePreset.name}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_THEMES.map((preset) => {
              const isActive =
                preset.theme.primary === theme.primary &&
                preset.theme.accent === theme.accent;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onChange({ ...theme, ...preset.theme })}
                  title={preset.name}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-200",
                    isActive
                      ? "border-violet-500 bg-violet-600/10 shadow-[0_0_10px_rgba(124,58,237,0.1)]"
                      : "border-[#243041] bg-[#0F172A] hover:border-slate-600 hover:bg-[#151f32]"
                  )}
                >
                  {/* Two-tone swatch bar */}
                  <span className="flex h-5 w-8 flex-shrink-0 overflow-hidden rounded border border-white/5">
                    <span className="flex-1" style={{ backgroundColor: preset.theme.primary }} />
                    <span className="w-2.5" style={{ backgroundColor: preset.theme.accent }} />
                  </span>
                  <span
                    className={cn(
                      "flex-1 truncate text-xs font-semibold",
                      isActive ? "text-violet-300" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  >
                    {preset.name}
                  </span>
                  {isActive && (
                    <span title="Active" className="flex-shrink-0">
                      <Check className="h-3 w-3 text-violet-400 stroke-[3px]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Font picker ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" /> Font Family
            </p>
            {/* Category filter */}
            <div className="flex gap-1.5 rounded-lg bg-[#0F172A] p-0.5 border border-[#243041]">
              {(["All", "Sans", "Serif", "Mono"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFontCategory(cat)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all",
                    fontCategory === cat
                      ? "bg-violet-600/35 text-violet-300 shadow-sm"
                      : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {filteredFonts.map((opt) => {
              const isSelected = currentFont === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ ...theme, font: opt.value })}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-200",
                    isSelected
                      ? "border-violet-500 bg-violet-600/10 text-violet-300"
                      : "border-[#243041] bg-[#0F172A] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  )}
                >
                  <span
                    className="text-sm font-bold flex-shrink-0 w-5 text-center text-slate-300"
                    style={{ fontFamily: opt.value }}
                  >
                    {opt.preview}
                  </span>
                  <span className="truncate text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Font Sizes ── */}
        <div className="space-y-4 border-t border-[#243041]/60 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5" /> Font Sizes
          </p>

          {/* Heading Size slider */}
          <div className="rounded-xl border border-[#243041] bg-[#0F172A] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Section Headings</label>
              <span className="text-[10px] font-mono text-violet-400">{headingSize}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={14}
              step={0.5}
              value={headingSize}
              onChange={(e) => updateTheme({ headingSize: parseFloat(e.target.value) })}
              className="w-full"
              style={{ accentColor: "#7c3aed" }}
            />
            {/* Live preview */}
            <div style={{
              fontSize: headingSize,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: theme.primary,
              paddingTop: 4,
              borderTop: `1px solid ${theme.primary}30`,
            }}>
              EXPERIENCE
            </div>
          </div>

          {/* Body Size slider */}
          <div className="rounded-xl border border-[#243041] bg-[#0F172A] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Body & Description</label>
              <span className="text-[10px] font-mono text-violet-400">{bodySize}px</span>
            </div>
            <input
              type="range"
              min={9}
              max={13}
              step={0.5}
              value={bodySize}
              onChange={(e) => updateTheme({ bodySize: parseFloat(e.target.value) })}
              className="w-full"
              style={{ accentColor: "#7c3aed" }}
            />
            {/* Live preview */}
            <div style={{
              fontSize: bodySize,
              lineHeight: 1.55,
              color: "#94a3b8",
              paddingTop: 4,
            }}>
              Developed scalable solutions improving performance by 30%.
            </div>
          </div>
        </div>

        {/* ── Custom color pickers ── */}
        <div className="space-y-3.5 border-t border-[#243041]/60 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Custom Swatches</p>
          <ColorPicker
            label="Primary Color"
            hint="Name &amp; section headings"
            value={theme.primary}
            onChange={(color) => onChange({ ...theme, primary: color })}
          />
          <ColorPicker
            label="Secondary Color"
            hint="Subtitles &amp; metadata dates"
            value={theme.secondary}
            onChange={(color) => onChange({ ...theme, secondary: color })}
          />
          <ColorPicker
            label="Accent Color"
            hint="Border rules &amp; highlights"
            value={theme.accent}
            onChange={(color) => onChange({ ...theme, accent: color })}
          />
        </div>
      </div>

      {/* Footer controls */}
      <div className="border-t border-[#243041] p-6 bg-[#0a0f1c]/50">
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_THEME })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#243041] bg-[#0F172A] py-3 text-xs font-semibold text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-all duration-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to default theme
        </button>
      </div>
    </div>
  );
}

function ColorPicker({
  label, hint, value, onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#243041] bg-[#0F172A] p-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-300">{label}</p>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal" dangerouslySetInnerHTML={{ __html: hint }} />
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{value}</span>
        <label className="relative cursor-pointer">
          <span
            className="block h-7 w-11 rounded-lg border border-[#243041] shadow-md ring-1 ring-white/5 transition-transform hover:scale-105"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
