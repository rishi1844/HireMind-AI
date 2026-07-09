"use client";

/**
 * StarkTemplate.tsx — Stark resume template.
 *
 * Design:
 * - Deep green header with mesh gradient + glow blob
 * - Contact icons: inline-flex, vertically centered (inline SVG)
 * - Skill chips: inline-flex + align/justify center — text perfectly centered
 * - Entry links: inline with title on same row
 * - Two-column body: experience+projects LEFT, skills+education+custom RIGHT
 * - All inline styles — no Tailwind, no CSS modules — renders cleanly to PDF
 * - theme.headingSize / theme.bodySize drive font sizes (defaults: 10 / 11)
 */

import React from "react";
import {
  getContactItems,
  getExperienceEntries,
  getEducationEntries,
  getProjectEntries,
  getCustomSections,
  hasEntryContent,
  normalizeSkills,
  hasText,
} from "../shared/dataHelpers";
import type { TemplateProps, NormalizedEntry, ContactItem } from "../shared/types";

/* ─── Right column section title keywords ─────────────────── */

const RIGHT_SECTION_TITLES = [
  "certifications", "certification",
  "languages", "language",
  "coding platform", "coding platforms",
  "achievements", "awards",
  "volunteer", "interests", "hobbies",
];

/* ─── Link Icon ──────────────────────────────────────────── */

function LinkIcon() {
  return (
    <svg
      width="10" height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: "inline-block" }}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/* ─── Section Bar ────────────────────────────────────────── */

function SectionBar({ title, primary, accent, headingSize }: { title: string; primary: string; accent: string; headingSize: number }) {
  return (
    <div style={{
      fontSize: headingSize,
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase" as const,
      color: primary,
      paddingBottom: 5,
      borderBottom: `2px solid ${accent}`,
      marginBottom: 12,
    }}>
      {title}
    </div>
  );
}

/* ─── Skill Chip ─────────────────────────────────────────── */

function SkillChip({ label, primary, accent, bodySize }: { label: string; primary: string; accent: string; bodySize: number }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 10px",
      background: `${primary}1a`,
      border: `1px solid ${accent}47`,
      borderRadius: 20,
      fontSize: Math.max(bodySize - 1, 9),
      fontWeight: 500,
      color: primary,
      lineHeight: 1,
      whiteSpace: "nowrap" as const,
    }}>
      {label}
    </span>
  );
}

/* ─── Description Block ──────────────────────────────────── */

function DescriptionBlock({ text, accent, bodySize }: { text: string; accent: string; bodySize: number }) {
  // Normalize: replace \n that are mid-sentence (not real bullet separators) 
  // Rule: if \n is followed by lowercase → it's a word-wrap artifact, join it back
  const normalized = text
    .replace(/\n(?=[a-z])/g, " ")   // "time &\nspace" → "time & space"
    .trim();

  // Now split on real newlines (which start new bullets)
  const lines = normalized
    .split("\n")
    .map((l) => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);

  // Always render as bullet if there's meaningful content — even single line
  // (paragraph only if explicitly no bullet intent, i.e. education description etc.)
  const cleanedSingle = normalized.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim();

  if (lines.length <= 1) {
    // Check if original text had a leading bullet marker → render as single bullet
    const hadBullet = /^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]/.test(text.trim());

    if (hadBullet) {
      // Single bullet point
      return (
        <ul style={{ marginTop: 5, paddingLeft: 0, listStyle: "none", marginBottom: 0 }}>
          <li style={{
            fontSize: bodySize,
            lineHeight: 1.55,
            color: "#4a5568",
            marginBottom: 3,
            paddingLeft: 14,
            position: "relative" as const,
            wordBreak: "break-word" as const,
          }}>
            <span style={{ position: "absolute" as const, left: 0, color: accent, fontWeight: 700 }}>·</span>
            {cleanedSingle}
          </li>
        </ul>
      );
    }

    // Plain paragraph (no leading bullet — e.g. GFG, education description)
    return (
      <p style={{
        fontSize: bodySize,
        lineHeight: 1.55,
        color: "#4a5568",
        marginTop: 4,
        marginBottom: 0,
        wordBreak: "break-word" as const,
      }}>
        {cleanedSingle}
      </p>
    );
  }

  // Multiple lines → bullet list
  return (
    <ul style={{ marginTop: 5, paddingLeft: 0, listStyle: "none", marginBottom: 0 }}>
      {lines.map((line, i) => (
        <li key={i} style={{
          fontSize: bodySize,
          lineHeight: 1.55,
          color: "#4a5568",
          marginBottom: 3,
          paddingLeft: 14,
          position: "relative" as const,
          wordBreak: "break-word" as const,
        }}>
          <span style={{ position: "absolute" as const, left: 0, color: accent, fontWeight: 700 }}>·</span>
          {line}
        </li>
      ))}
    </ul>
  );
}

/* ─── Entry Block ────────────────────────────────────────── */

function EntryBlock({ entry, accent, bodySize }: { entry: NormalizedEntry; accent: string; bodySize: number }) {
  const hasLink = hasText(entry.linkUrl) && hasText(entry.linkLabel);

  return (
    <div style={{ marginBottom: 13 }}>

      {/* Title row + meta */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap" as const,
      }}>
        {/* Left: title + link on same row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "nowrap" as const,
          minWidth: 0,
        }}>
          {hasText(entry.title) && (() => {
            const parts = entry.title!.split(" · ");
            return (
              <span style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#1a1a2e",
                lineHeight: 1.3,
                wordBreak: "break-word" as const,
              }}>
                {parts[0]}
                {parts.length > 1 && (
                  <>
                    <span style={{ color: accent, fontWeight: 400, margin: "0 3px" }}>&#8212;</span>
                    <span style={{ fontWeight: 400 }}>{parts.slice(1).join(" · ")}</span>
                  </>
                )}
              </span>
            );
          })()}


          {hasLink && (
            <a
              href={entry.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10.5,
                fontWeight: 500,
                color: accent,
                textDecoration: "none",
                lineHeight: 1,
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
              }}
            >
              <LinkIcon />
              {entry.linkLabel}
            </a>
          )}
        </div>

        {/* Right: meta (date / year / techStack) */}
        {hasText(entry.meta) && (
          entry.meta!.includes("||SPLIT||") ? (
            // Space-between layout for education (year left, score right)
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              marginTop: 2,
            }}>
              <span style={{ fontSize: 10.5, color: "#718096" }}>
                {entry.meta!.split("||SPLIT||")[0]}
              </span>
              <span style={{ fontSize: 10.5, color: "#718096" }}>
                {entry.meta!.split("||SPLIT||")[1]}
              </span>
            </div>
          ) : (
            <span style={{
              fontSize: 10.5,
              color: "#718096",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}>
              {entry.meta}
            </span>
          )
        )}
      </div>

      {/* Description */}
      {hasText(entry.description) && (
        <DescriptionBlock text={entry.description!} accent={accent} bodySize={bodySize} />
      )}
    </div>
  );
}

/* ─── Contact Row ────────────────────────────────────────── */

function ContactRow({ items }: { items: ContactItem[] }) {
  const sepColor = "rgba(255,255,255,0.3)";
  const contactText = "rgba(226,232,240,0.9)";

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap" as const,
      alignItems: "center",
      gap: "4px 0",
      marginTop: 10,
    }}>
      {items.map((item, i) => (
        <React.Fragment key={item.key}>
          {i > 0 && (
            <span style={{
              color: sepColor,
              fontSize: 11,
              padding: "0 8px",
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
            }}>·</span>
          )}

          {item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: contactText,
                fontSize: 11.5,
                fontWeight: 400,
                textDecoration: "none",
                lineHeight: 1,
              }}
            >
              {/* Icon wrapper: force 13×13 for perfect alignment */}
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 13,
                height: 13,
                flexShrink: 0,
              }}>
                {item.icon}
              </span>
              {item.label}
            </a>
          ) : (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              color: contactText,
              fontSize: 11.5,
              fontWeight: 400,
              lineHeight: 1,
            }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 13,
                height: 13,
                flexShrink: 0,
              }}>
                {item.icon}
              </span>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Contrast helper ────────────────────────────────────── */

/**
 * Returns true when the hex colour has a low luminance (i.e. is "dark"),
 * so we can decide whether to render light or dark text on top of it.
 */
function isDark(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.4;
}

/* ─── Main Template ──────────────────────────────────────── */

export function StarkTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  const primary = theme.primary ?? "#1b4332";
  const accent = theme.accent ?? "#2d6a4f";
  const headingSize = theme.headingSize ?? 10;
  const bodySize = theme.bodySize ?? 11;

  // Detect if the header background is dark so avatar border / text can adapt
  const headerDark = isDark(primary);

  const bgRight = "#f7faf8";
  const borderRight = "#e2ece6";

  return (
    <div style={{
      fontFamily: theme.font ?? "'DM Sans', 'Inter', system-ui, sans-serif",
      background: "#ffffff",
      width: "100%",
    }}>

      {/* ── HEADER ── */}
      <header style={{
        backgroundColor: primary,
        backgroundImage: `radial-gradient(ellipse at top right, ${accent}44 0%, transparent 60%)`,
        padding: "28px 36px 24px",
        color: "#ffffff",
        position: "relative" as const,
        overflow: "hidden",
      }}>
        {/* Decorative glow blob */}
        <div style={{
          position: "absolute" as const,
          bottom: -40, right: -40,
          width: 160, height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
          pointerEvents: "none" as const,
        }} />

        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          position: "relative" as const,
          zIndex: 1,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              color: "#ffffff",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              lineHeight: 1.05,
              margin: 0,
              wordBreak: "break-word" as const,
            }}>
              {data.fullName || "Your Name"}
            </h1>
            {contacts.length > 0 && <ContactRow items={contacts} />}
          </div>

          {hasText(data.profileImageUrl) && (
            <div
              data-avatar
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                flexShrink: 0,
                marginTop: 2,
                border: `2px solid ${headerDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"}`,
                boxShadow: `0 0 0 4px ${accent}40, 0 4px 16px rgba(0,0,0,0.3)`,
                backgroundImage: `url(${data.profileImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              } as React.CSSProperties}
            />
          )}
        </div>

        {hasText(data.summary) && (
          <div style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: 6,
            borderLeft: "2px solid rgba(255,255,255,0.22)",
            position: "relative" as const,
            zIndex: 1,
          }}>
            <p style={{
              margin: 0,
              fontSize: 11.5,
              lineHeight: 1.65,
              color: "rgba(203,213,225,0.95)",
              maxWidth: 600,
              wordBreak: "break-word" as const,
            }}>
              {data.summary}
            </p>
          </div>
        )}
      </header>

      {/* ── TWO-COLUMN BODY ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr" }}>

        {/* LEFT: Experience, Projects, non-right custom */}
        <div style={{ padding: "22px 20px 28px 36px" }}>
          {experience.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <SectionBar title="Experience" primary={primary} accent={accent} headingSize={headingSize} />
              {experience.map(e => <EntryBlock key={e.id} entry={e} accent={accent} bodySize={bodySize} />)}
            </section>
          )}
          {projects.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <SectionBar title="Projects" primary={primary} accent={accent} headingSize={headingSize} />
              {projects.map(e => <EntryBlock key={e.id} entry={e} accent={accent} bodySize={bodySize} />)}
            </section>
          )}
          {custom
            .filter(s => !RIGHT_SECTION_TITLES.includes(s.title.toLowerCase()))
            .map(s => (
              <section key={s.id} style={{ marginBottom: 20 }}>
                <SectionBar title={s.title} primary={primary} accent={accent} headingSize={headingSize} />
                {s.entries.map(e => <EntryBlock key={e.id} entry={e} accent={accent} bodySize={bodySize} />)}
              </section>
            ))
          }
        </div>

        {/* RIGHT: Skills, Education, right-keyword custom */}
        <div style={{
          padding: "22px 36px 28px 20px",
          background: bgRight,
          borderLeft: `1px solid ${borderRight}`,
        }}>
          {skills.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <SectionBar title="Skills" primary={primary} accent={accent} headingSize={headingSize} />
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                {skills.map(s => <SkillChip key={s} label={s} primary={primary} accent={accent} bodySize={bodySize} />)}
              </div>
            </section>
          )}
          {education.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <SectionBar title="Education" primary={primary} accent={accent} headingSize={headingSize} />
              {education.map(e => <EntryBlock key={e.id} entry={e} accent={accent} bodySize={bodySize} />)}
            </section>
          )}
          {custom
            .filter(s => RIGHT_SECTION_TITLES.includes(s.title.toLowerCase()))
            .map(s => (
              <section key={s.id} style={{ marginBottom: 20 }}>
                <SectionBar title={s.title} primary={primary} accent={accent} headingSize={headingSize} />
                {s.entries.map(e => <EntryBlock key={e.id} entry={e} accent={accent} bodySize={bodySize} />)}
              </section>
            ))
          }
        </div>
      </div>
    </div>
  );
}