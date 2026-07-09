import type { TemplateId } from "@/components/resume-builder/types";

export interface TemplateConfig {
  /** Template display label */
  label: string;
  /** Short description for the template picker */
  description: string;
  /** Category shown in the template selector */
  category: "Professional" | "ATS" | "Modern" | "Executive";
  /** Whether this template is ATS-safe */
  atsSafe: boolean;
  /** Has a sidebar column */
  supportsSidebar: boolean;
  /** Layout type */
  layout: "single-column" | "two-column";
  /** Compact spacing mode */
  compactSpacing: boolean;
  /** Max skill chips per row before wrapping (hint) */
  maxSkillsPerRow: number;
  /** Preferred font family */
  preferredFont: string;
  /** Whether profile photo is shown */
  supportsProfileImage: boolean;
  /** Whether dark/colored background is used anywhere */
  hasDarkBackground: boolean;
  /** Accent color swatch for selector preview */
  selectorAccent: string;
}

export const templateConfig: Record<TemplateId, TemplateConfig> = {
  stark: {
    label: "Stark",
    description: "Dark green header, two-column layout with right sidebar",
    category: "Professional",
    atsSafe: true,
    supportsSidebar: false,
    layout: "two-column",
    compactSpacing: false,
    maxSkillsPerRow: 5,
    preferredFont: "'DM Sans', system-ui, sans-serif",
    supportsProfileImage: true,
    hasDarkBackground: true,
    selectorAccent: "#2d6a4f",
  },
  axiom: {
    label: "Axiom",
    description: "ATS-friendly single-column layout with left accent bar",
    category: "ATS",
    atsSafe: true,
    supportsSidebar: false,
    layout: "single-column",
    compactSpacing: false,
    maxSkillsPerRow: 6,
    preferredFont: "'Inter', system-ui, sans-serif",
    supportsProfileImage: false,
    hasDarkBackground: false,
    selectorAccent: "#1e3a8a",
  },
  pulse: {
    label: "Pulse",
    description: "Classic single-column ATS resume with serif name",
    category: "ATS",
    atsSafe: true,
    supportsSidebar: false,
    layout: "single-column",
    compactSpacing: true,
    maxSkillsPerRow: 6,
    preferredFont: "Georgia, 'Times New Roman', serif",
    supportsProfileImage: true,
    hasDarkBackground: false,
    selectorAccent: "#1e3a8a",
  },
  "timeline-v2": {
    label: "Timeline",
    description: "Timeline dots for experience, two-column layout",
    category: "Modern",
    atsSafe: false,
    supportsSidebar: false,
    layout: "two-column",
    compactSpacing: false,
    maxSkillsPerRow: 4,
    preferredFont: "'Inter', system-ui, sans-serif",
    supportsProfileImage: true,
    hasDarkBackground: false,
    selectorAccent: "#059669",
  },
  nova: {
    label: "Nova",
    description: "Premium dark sidebar with clean right content area",
    category: "Modern",
    atsSafe: false,
    supportsSidebar: true,
    layout: "two-column",
    compactSpacing: false,
    maxSkillsPerRow: 6,
    preferredFont: "'Inter', 'DM Sans', system-ui, sans-serif",
    supportsProfileImage: true,
    hasDarkBackground: true,
    selectorAccent: "#3b82f6",
  },
  executive: {
    label: "Executive",
    description: "Corporate executive resume — main left, themed sidebar right",
    category: "Executive",
    atsSafe: false,
    supportsSidebar: true,
    layout: "two-column",
    compactSpacing: false,
    maxSkillsPerRow: 6,
    preferredFont: "'Inter', 'DM Sans', system-ui, sans-serif",
    supportsProfileImage: true,
    hasDarkBackground: true,
    selectorAccent: "#2563eb",
  },
  plasma: {
    label: "Plasma",
    description: "Premium dark sidebar with customizable primary accent",
    category: "Modern",
    atsSafe: false,
    supportsSidebar: true,
    layout: "two-column",
    compactSpacing: false,
    maxSkillsPerRow: 6,
    preferredFont: "'Inter', 'DM Sans', system-ui, sans-serif",
    supportsProfileImage: true,
    hasDarkBackground: true,
    selectorAccent: "#FFB800",
  },
  editorial: {
    label: "Editorial",
    description: "Clean newspaper/editorial aesthetic with beige tone",
    category: "Professional",
    atsSafe: false,
    supportsSidebar: true,
    layout: "two-column",
    compactSpacing: false,
    maxSkillsPerRow: 6,
    preferredFont: "Georgia, 'Times New Roman', serif",
    supportsProfileImage: false,
    hasDarkBackground: false,
    selectorAccent: "#C8B99A",
  },
  academia: {
    label: "Academia",
    description: "Structured academic style with maroon header and square bullets",
    category: "Executive",
    atsSafe: false,
    supportsSidebar: true,
    layout: "two-column",
    compactSpacing: false,
    maxSkillsPerRow: 6,
    preferredFont: "'Inter', system-ui, sans-serif",
    supportsProfileImage: true,
    hasDarkBackground: true,
    selectorAccent: "#6B1D3E",
  },
  prism: {
    label: "Prism",
    description: "Bold dark banner header, single-column layout with color-band sections and chip-tag skills",
    category: "Modern",
    atsSafe: true,
    supportsSidebar: false,
    layout: "single-column",
    compactSpacing: false,
    maxSkillsPerRow: 8,
    preferredFont: "'Inter', system-ui, sans-serif",
    supportsProfileImage: true,
    hasDarkBackground: true,
    selectorAccent: "#0F4C81",
  },
  alchemy: {
    label: "Alchemy",
    description: "Deep dark sidebar with dot skill meters, accent header block, and card-style project cards",
    category: "Modern",
    atsSafe: false,
    supportsSidebar: true,
    layout: "two-column",
    compactSpacing: false,
    maxSkillsPerRow: 5,
    preferredFont: "'Inter', 'DM Sans', system-ui, sans-serif",
    supportsProfileImage: true,
    hasDarkBackground: true,
    selectorAccent: "#00B4D8",
  },
};

