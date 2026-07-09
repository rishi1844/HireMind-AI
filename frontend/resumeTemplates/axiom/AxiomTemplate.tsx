"use client";

/**
 * AxiomTemplate.tsx — ATS-friendly single-column resume template.
 *
 * Design:
 * - Pure white background, no gradients
 * - Left 4px accent bar (position absolute)
 * - Single column — ATS safe, semantically ordered
 * - Name NOT uppercase (ATS friendly)
 * - Contact row: inline-flex, inline SVG icons, muted color
 * - Section headings: theme.headingSize, thin colored bottom border
 * - Entry block: "Role · Company" parsed, date right-aligned
 * - Skills: slightly square pill chips
 * - Newline → bullet list (same logic as Stark)
 * - All inline styles — no Tailwind, no CSS modules
 * - theme.headingSize / theme.bodySize drive font sizes (defaults: 10.5 / 11)
 *
 * ATS Rules strictly followed:
 * - No background colors on sections
 * - No multi-column layout
 * - All text in HTML, no SVG text
 * - Semantic order: name → contact → summary → experience → education → skills → custom
 * - Links as proper <a> tags
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

/* ─── Section Heading ────────────────────────────────────── */

function SectionHeading({ title, primary, headingSize }: { title: string; primary: string; headingSize: number }) {
  return (
    <div style={{
      fontSize: headingSize,
      fontWeight: 700,
      letterSpacing: "0.15em",
      textTransform: "uppercase" as const,
      color: primary,
      marginTop: 18,
      marginBottom: 2,
      paddingBottom: 4,
      borderBottom: `1px solid ${primary}20`,
    }}>
      {title}
    </div>
  );
}

/* ─── Skill Chip ─────────────────────────────────────────── */

function SkillChip({ label, primary, bodySize }: { label: string; primary: string; bodySize: number }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3px 8px",
      border: `1px solid ${primary}30`,
      borderRadius: 4,
      fontSize: Math.max(bodySize - 1, 9),
      fontWeight: 500,
      color: "#374151",
      lineHeight: 1,
      whiteSpace: "nowrap" as const,
    }}>
      {label}
    </span>
  );
}

/* ─── Description Block ──────────────────────────────────── */

function DescriptionBlock({ text, primary, bodySize }: { text: string; primary: string; bodySize: number }) {
  const lines = text
    .split(/\n/)
    .map(l => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return (
      <p style={{
        fontSize: bodySize,
        lineHeight: 1.6,
        color: "#374151",
        marginTop: 3,
        marginBottom: 0,
        wordBreak: "break-word" as const,
      }}>
        {text.trim()}
      </p>
    );
  }

  return (
    <ul style={{ marginTop: 4, paddingLeft: 0, listStyle: "none", marginBottom: 0 }}>
      {lines.map((line, i) => (
        <li key={i} style={{
          fontSize: bodySize,
          lineHeight: 1.6,
          color: "#374151",
          marginBottom: 2,
          paddingLeft: 14,
          position: "relative" as const,
          wordBreak: "break-word" as const,
        }}>
          <span style={{
            position: "absolute" as const,
            left: 0,
            color: primary,
            fontWeight: 700,
          }}>·</span>
          {line}
        </li>
      ))}
    </ul>
  );
}

/* ─── Entry Block ────────────────────────────────────────── */

function EntryBlock({
  entry,
  primary,
  secondary,
  bodySize,
}: {
  entry: NormalizedEntry;
  primary: string;
  secondary: string;
  bodySize: number;
}) {
  const hasLink = hasText(entry.linkUrl) && hasText(entry.linkLabel);

  return (
    <div style={{ marginTop: 10, marginBottom: 2 }}>
      {/* Title row: role + company on left, date/meta on right */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        flexWrap: "wrap" as const,
        gap: "2px 8px",
      }}>
        {/* Left: role + optional company + optional link */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap" as const,
          flex: 1,
          minWidth: 0,
        }}>
          {hasText(entry.title) && (() => {
            const parts = entry.title!.split(" · ");
            return (
              <span style={{ fontSize: 12.5, lineHeight: 1.3, wordBreak: "break-word" as const }}>
                <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{parts[0]}</span>
                {parts.length > 1 && (
                  <>
                    <span style={{ color: "#94a3b8", fontWeight: 400, margin: "0 5px" }}>—</span>
                    <span style={{ fontWeight: 400, color: primary }}>{parts.slice(1).join(" — ")}</span>
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
                color: primary,
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

        {/* Right: meta (date/year/techStack) */}
        {hasText(entry.meta) && (
          <span style={{
            fontSize: 10.5,
            color: secondary,
            whiteSpace: "nowrap" as const,
            flexShrink: 0,
          }}>
            {entry.meta!.replace(/\|\|SPLIT\|\|/g, "   ")}
          </span>
        )}
      </div>

      {/* Description */}
      {hasText(entry.description) && (
        <DescriptionBlock text={entry.description!} primary={primary} bodySize={bodySize} />
      )}
    </div>
  );
}

/* ─── Contact Row ────────────────────────────────────────── */

function ContactRow({ items, primary }: { items: ContactItem[]; primary: string }) {
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap" as const,
      gap: "4px 16px",
      marginTop: 10,
    }}>
      {items.map((item) => {
        const innerContent = (
          <>
            {/* Icon wrapper */}
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 12,
              height: 12,
              flexShrink: 0,
              color: "#64748b",
            }}>
              {item.icon}
            </span>
            <span style={{ color: "#64748b", fontSize: 11, fontWeight: 400 }}>
              {item.label}
            </span>
          </>
        );

        return item.href ? (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            {innerContent}
          </a>
        ) : (
          <span
            key={item.key}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              lineHeight: 1,
            }}
          >
            {innerContent}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Main Template ──────────────────────────────────────── */

export function AxiomTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  const primary = theme.primary ?? "#1E3A8A";
  const secondary = theme.secondary ?? "#6B7280";
  const headingSize = theme.headingSize ?? 10.5;
  const bodySize = theme.bodySize ?? 11;

  return (
    <div style={{
      fontFamily: theme.font ?? "'Inter', 'DM Sans', system-ui, sans-serif",
      background: "#ffffff",
      width: "100%",
      position: "relative" as const,
    }}>
      {/* Left accent bar */}
      <div style={{
        position: "absolute" as const,
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        background: primary,
      }} />

      {/* Content: padded to clear accent bar */}
      <div style={{ paddingLeft: 36, paddingRight: 40, paddingTop: 32, paddingBottom: 40 }}>

        {/* ── HEADER ── */}
        <header style={{
          paddingBottom: 20,
          borderBottom: `2px solid ${primary}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            {/* Left: name + contacts */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                margin: 0,
                wordBreak: "break-word" as const,
              }}>
                {data.fullName || "Your Name"}
              </h1>
              {contacts.length > 0 && <ContactRow items={contacts} primary={primary} />}
            </div>

            {/* Right: profile image (only if uploaded) */}
            {hasText((data as any).profileImageUrl) && (
              <div style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                flexShrink: 0,
                backgroundImage: `url(${(data as any).profileImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center top",
                border: `2px solid ${primary}30`,
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              } as React.CSSProperties} />
            )}
          </div>
        </header>

        {/* ── SUMMARY ── */}
        {hasText(data.summary) && (
          <section>
            <SectionHeading title="Summary" primary={primary} headingSize={headingSize} />
            <p style={{
              fontSize: bodySize,
              lineHeight: 1.65,
              color: "#374151",
              marginTop: 6,
              marginBottom: 0,
              wordBreak: "break-word" as const,
            }}>
              {data.summary}
            </p>
          </section>
        )}

        {/* ── EXPERIENCE ── */}
        {experience.length > 0 && (
          <section>
            <SectionHeading title="Experience" primary={primary} headingSize={headingSize} />
            {experience.map(e => (
              <EntryBlock key={e.id} entry={e} primary={primary} secondary={secondary} bodySize={bodySize} />
            ))}
          </section>
        )}

        {/* ── EDUCATION ── */}
        {education.length > 0 && (
          <section>
            <SectionHeading title="Education" primary={primary} headingSize={headingSize} />
            {education.map(e => {
              const titleParts = (e.title ?? "").split(" · ");
              const degreeText = titleParts[0] ?? "";
              const collegeText = titleParts.slice(1).join(" — ");

              const metaParts = (e.meta ?? "").split("||SPLIT||");
              const yearText = metaParts[0] ?? "";
              const scoreText = metaParts.slice(1).join(" ");

              return (
                <div key={e.id} style={{ marginTop: 10, marginBottom: 2 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    flexWrap: "wrap" as const,
                    gap: "2px 8px",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap" as const,
                      flex: 1,
                      minWidth: 0,
                    }}>
                      <span style={{ fontSize: 12.5, lineHeight: 1.3, wordBreak: "break-word" as const }}>
                        <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{degreeText}</span>
                        {hasText(collegeText) && (
                          <>
                            <span style={{ color: "#94a3b8", fontWeight: 400, margin: "0 5px" }}>—</span>
                            <span style={{ fontWeight: 400, color: primary }}>{collegeText}</span>
                          </>
                        )}
                        {hasText(yearText) && (
                          <span style={{ color: secondary, fontSize: 11, fontWeight: 400, marginLeft: 6 }}>
                            ({yearText})
                          </span>
                        )}
                      </span>
                    </div>
                    {hasText(scoreText) && (
                      <span style={{
                        fontSize: 10.5,
                        color: secondary,
                        whiteSpace: "nowrap" as const,
                        flexShrink: 0,
                      }}>
                        {scoreText}
                      </span>
                    )}
                  </div>
                  {hasText(e.description) && (
                    <p style={{ fontSize: 11, color: "#4a5568", marginTop: 3, lineHeight: 1.5, marginBottom: 0 }}>
                      {e.description}
                    </p>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ── PROJECTS ── */}
        {projects.length > 0 && (
          <section>
            <SectionHeading title="Projects" primary={primary} headingSize={headingSize} />
            {projects.map(e => (
              <EntryBlock key={e.id} entry={e} primary={primary} secondary={secondary} bodySize={bodySize} />
            ))}
          </section>
        )}

        {/* ── SKILLS ── */}
        {skills.length > 0 && (
          <section>
            <SectionHeading title="Skills" primary={primary} headingSize={headingSize} />
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginTop: 6 }}>
              {skills.map(s => <SkillChip key={s} label={s} primary={primary} bodySize={bodySize} />)}
            </div>
          </section>
        )}

        {/* ── CUSTOM SECTIONS ── */}
        {custom.map(s => {
          const titleLower = s.title.toLowerCase();
          const isTwoCol = ["languages", "language", "certifications", "certification"].includes(
            titleLower
          );
          const isCodingSection = titleLower.includes("coding") || titleLower.includes("profile") || titleLower.includes("platform") || titleLower.includes("competitive");

          return (
            <section key={s.id}>
              <SectionHeading title={s.title} primary={primary} headingSize={headingSize} />

              {isCodingSection ? (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, marginTop: 6 }}>
                  {s.entries.map(e => {
                    const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: bodySize, lineHeight: 1.5, color: "#374151" }}>
                        <div style={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 4, fontWeight: 600, color: "#1a1a2e" }}>
                          <span>{e.title}</span>
                          {hasLink && (
                            <a
                              href={e.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: 10.5,
                                fontWeight: 500,
                                color: primary,
                                textDecoration: "none",
                                lineHeight: 1,
                                whiteSpace: "nowrap" as const,
                                marginLeft: 2,
                              }}
                            >
                              <LinkIcon />
                              {e.linkLabel}
                            </a>
                          )}
                          {hasText(e.meta) && (
                            <span style={{ fontSize: 10.5, color: secondary, fontStyle: "italic", fontWeight: 400 }}>
                              ({e.meta})
                            </span>
                          )}
                          {hasText(e.description) && <span>:</span>}
                        </div>
                        <div style={{ flex: 1, wordBreak: "break-word" as const }}>
                          {e.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : isTwoCol ? (
                /* 2-column grid for certifications & languages */
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 12px",
                  marginTop: 6,
                }}>
                  {s.entries.map(e => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#0f172a" }}>
                        {e.title}
                      </span>
                      {hasText(e.meta) && (
                        <span style={{ fontSize: 10, color: "#718096", marginLeft: 2 }}>
                          {s.title.toLowerCase().includes("language") ? ` - ${e.meta}` : e.meta}
                        </span>
                      )}
                      {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                        <a
                          href={e.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            fontSize: 10,
                            color: primary,
                            textDecoration: "none",
                          }}
                        >
                          <LinkIcon />
                          {e.linkLabel}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Normal single-column entry block for all other custom sections */
                s.entries.map(e => (
                  <EntryBlock key={e.id} entry={e} primary={primary} secondary={secondary} bodySize={bodySize} />
                ))
              )}
            </section>
          );
        })}

      </div>
    </div>
  );
}
