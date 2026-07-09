"use client";

/**
 * dataHelpers.ts — Pure data transformation utilities.
 *
 * Normalizes raw ResumeData into the NormalizedEntry format
 * consumed by all template components. Uses inline SVG icons
 * instead of lucide-react to ensure clean PDF export.
 */

import React from "react";
import type { ResumeData } from "@/components/resume-builder/types";
import type { ContactItem, NormalizedEntry } from "./types";

/* ─── Text Utilities ──────────────────────────────────────── */

export function hasText(value?: string): boolean {
  return Boolean(value && value.trim().length > 0);
}

/** Join non-empty parts with a separator */
export function joinParts(sep: string, ...parts: Array<string | undefined>): string {
  return parts
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(sep);
}

/** Ensure URL has a protocol */
export function ensureUrl(value: string): string {
  if (!value) return "";
  if (/^[a-z]+:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/**
 * Clean AI-generated text artifacts (stray JSON keys, braces).
 * Also converts " - " / " – " used as sentence separators (before a capital letter)
 * into actual newlines, so DescriptionBlock can render them as proper bullet points.
 */
export function cleanText(value?: string): string {
  if (!value) return "";
  let cleaned = value.replace(/['"]?[a-z_]+['"]?\s*:/gi, "");
  cleaned = cleaned.replace(/[{}[\]]/g, "");
  // Convert " - " or " – " used as sentence separators (before a capital letter) → newline
  cleaned = cleaned.replace(/\s+[-\u2013]\s+(?=[A-Z])/g, "\n");
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned;
}

/**
 * Normalize skills: trim, deduplicate, remove empty.
 */
export function normalizeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  return skills
    .map((s) => s.trim())
    .filter((s) => {
      if (!s || seen.has(s.toLowerCase())) return false;
      seen.add(s.toLowerCase());
      return true;
    });
}

/* ─── Inline SVG Icons (no lucide-react dependency) ──────── */

function MailIcon() {
  return React.createElement(
    "svg",
    { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", flexShrink: 0 } },
    React.createElement("rect", { width: 20, height: 16, x: 2, y: 4, rx: 2 }),
    React.createElement("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" })
  );
}

function PhoneIcon() {
  return React.createElement(
    "svg",
    { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", flexShrink: 0 } },
    React.createElement("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" })
  );
}

function MapPinIcon() {
  return React.createElement(
    "svg",
    { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", flexShrink: 0 } },
    React.createElement("path", { d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" }),
    React.createElement("circle", { cx: 12, cy: 10, r: 3 })
  );
}

function LinkedinIcon() {
  return React.createElement(
    "svg",
    { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", flexShrink: 0 } },
    React.createElement("path", { d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" }),
    React.createElement("rect", { width: 4, height: 12, x: 2, y: 9 }),
    React.createElement("circle", { cx: 4, cy: 4, r: 2 })
  );
}

function GithubIcon() {
  return React.createElement(
    "svg",
    { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", flexShrink: 0 } },
    React.createElement("path", { d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" }),
    React.createElement("path", { d: "M9 18c-4.51 2-5-2-7-2" })
  );
}

function GlobeIcon() {
  return React.createElement(
    "svg",
    { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", flexShrink: 0 } },
    React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
    React.createElement("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }),
    React.createElement("path", { d: "M2 12h20" })
  );
}

/* ─── Contact Items ───────────────────────────────────────── */

export function getContactItems(data: ResumeData): ContactItem[] {
  const items: ContactItem[] = [];
  if (hasText(data.email))
    items.push({ key: "email", icon: React.createElement(MailIcon), label: data.email, href: `mailto:${data.email}` });
  if (hasText(data.phone))
    items.push({ key: "phone", icon: React.createElement(PhoneIcon), label: data.phone });
  if (hasText(data.location))
    items.push({ key: "location", icon: React.createElement(MapPinIcon), label: data.location });
  if (hasText(data.linkedin))
    items.push({ key: "linkedin", icon: React.createElement(LinkedinIcon), label: "LinkedIn", href: ensureUrl(data.linkedin) });
  if (hasText(data.github))
    items.push({ key: "github", icon: React.createElement(GithubIcon), label: "GitHub", href: ensureUrl(data.github) });
  if (hasText(data.portfolio))
    items.push({ key: "portfolio", icon: React.createElement(GlobeIcon), label: "Portfolio", href: ensureUrl(data.portfolio) });
  return items;
}

/* ─── Section Entry Mappers ───────────────────────────────── */

export function getExperienceEntries(data: ResumeData): NormalizedEntry[] {
  return data.experience.map((item) => ({
    id: item.id,
    title: joinParts(" · ", item.role, item.company),
    meta: item.duration,
    description: cleanText(item.description),
  }));
}

export function getEducationEntries(data: ResumeData): NormalizedEntry[] {
  return data.education.map((item) => ({
    id: item.id,
    title: joinParts(" · ", item.degree, item.college),
    // Use ||SPLIT|| as internal separator — EntryBlock will space-between these
    meta: [item.year?.trim(), item.score?.trim()].filter(Boolean).join("||SPLIT||"),
    description: item.description,
  }));
}

export function getProjectEntries(data: ResumeData): NormalizedEntry[] {
  return data.projects.map((item) => ({
    id: item.id,
    title: item.title,
    meta: hasText(item.techStack) ? item.techStack : undefined,
    description: cleanText(item.description),
    linkLabel: item.linkLabel,
    linkUrl: item.linkUrl,
  }));
}

export interface NormalizedCustomSection {
  id: string;
  title: string;
  entries: NormalizedEntry[];
}

export function getCustomSections(data: ResumeData): NormalizedCustomSection[] {
  return (data.customSections || [])
    .map((section) => ({
      id: section.id,
      title: section.title,
      entries: section.items.map((item) => ({
        id: item.id,
        title: item.heading,
        meta: item.subheading,
        description: item.description,
        linkLabel: item.linkLabel,
        linkUrl: item.linkUrl,
      })).filter((e) => [e.title, e.meta, e.description].some(hasText)),
    }))
    .filter((s) => hasText(s.title) && s.entries.length > 0);
}

export function hasEntryContent(entry: NormalizedEntry): boolean {
  return [entry.title, entry.meta, entry.description].some(hasText);
}
