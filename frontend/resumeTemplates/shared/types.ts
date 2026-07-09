/**
 * types.ts — Shared prop types for all resume templates.
 * Templates import from here; never from the builder's types.ts directly.
 * This decouples the template rendering layer from the builder form layer.
 */

import type { ResumeData, ResumeTheme } from "@/components/resume-builder/types";

export type { ResumeData, ResumeTheme };

/** Common props passed to every top-level template component */
export interface TemplateProps {
  data: ResumeData;
  theme: ResumeTheme;
}

/**
 * Normalized entry used by EntryBlock and list renderers.
 * Maps from raw data (experience/education/project/customSection).
 */
export interface NormalizedEntry {
  id: string;
  title?: string;
  meta?: string;
  description?: string;
  linkLabel?: string;
  linkUrl?: string;
}

/** Contact item rendered in header / sidebar */
export interface ContactItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
}

import type React from "react";
