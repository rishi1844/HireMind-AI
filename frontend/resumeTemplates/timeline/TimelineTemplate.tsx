"use client";
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

/* ─── Fixed Color Tokens ─── */
const TEXT_DARK = "#1a1a2e";
const TEXT_MUTED = "#4a5568";
const TEXT_LIGHT = "#718096";
const BG_RIGHT = "#f8fafc";

/* ─── External Link Icon ─── */
function ExternalLinkIcon() {
  return (
    <svg
      width="9" height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/* ─── Section Heading ─── */
function TimelineSectionHeading({
  title,
  primary,
  accent,
  headingSize,
}: {
  title: string;
  primary: string;
  accent: string;
  headingSize: number;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginBottom: 10,
      marginTop: 0,
    }}>
      {/* Circular dot accent */}
      <div style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: primary,
        flexShrink: 0,
        opacity: 0.85,
      }} />
      <div style={{
        fontSize: headingSize,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase" as const,
        color: primary,
        flex: 1,
        paddingBottom: 3,
        borderBottom: `1px solid ${accent}35`,
      }}>
        {title}
      </div>
    </div>
  );
}

/* ─── Description Block ─── */
function DescriptionBlock({
  text,
  accent,
  bodySize,
}: {
  text: string;
  accent: string;
  bodySize: number;
}) {
  const normalized = text.replace(/\n(?=[a-z])/g, " ").trim();

  const lines = normalized
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);

  const bulletStyle: React.CSSProperties = {
    display: "inline-block",
    flexShrink: 0,
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: accent,
    opacity: 0.7,
    marginTop: 6,   /* centers dot with first text line at lineHeight 1.6 */
  };

  if (lines.length <= 1) {
    const hadBullet = /^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]/.test(text.trim());
    const clean = normalized
      .replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "")
      .trim();

    if (hadBullet) {
      return (
        <ul style={{ marginTop: 4, paddingLeft: 0, listStyle: "none", marginBottom: 0 }}>
          <li style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 7,
            fontSize: bodySize,
            lineHeight: 1.6,
            color: TEXT_MUTED,
            wordBreak: "break-word" as const,
          }}>
            <span style={bulletStyle} />
            <span>{clean}</span>
          </li>
        </ul>
      );
    }
    return (
      <p style={{
        fontSize: bodySize,
        lineHeight: 1.6,
        color: TEXT_MUTED,
        marginTop: 4,
        marginBottom: 0,
        wordBreak: "break-word" as const,
      }}>
        {clean}
      </p>
    );
  }

  return (
    <ul style={{ marginTop: 4, paddingLeft: 0, listStyle: "none", marginBottom: 0 }}>
      {lines.map((line, i) => (
        <li key={i} style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 7,
          fontSize: bodySize,
          lineHeight: 1.6,
          color: TEXT_MUTED,
          marginBottom: 3,
          wordBreak: "break-word" as const,
        }}>
          <span style={bulletStyle} />
          <span style={{ flex: 1 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── Timeline Experience Entry ─── */
function TimelineEntry({
  entry,
  primary,
  accent,
  secondary,
  bodySize,
}: {
  entry: NormalizedEntry;
  primary: string;
  accent: string;
  secondary: string;
  bodySize: number;
}) {
  const titleParts = (entry.title ?? "").split(" · ");
  const roleText = titleParts[0] ?? "";
  const companyText = titleParts.slice(1).join(" — ");

  return (
    <div style={{ position: "relative" as const, paddingLeft: 22, marginBottom: 14 }}>
      {/* Timeline dot — centered on the wrapper's border-left line */}
      <div style={{
        position: "absolute" as const,
        left: -7,       /* shifts dot center onto the border-left line */
        top: 5,
        width: 13,
        height: 13,
        borderRadius: "50%",
        background: "#ffffff",
        border: `2px solid ${primary}`,
        boxShadow: `0 0 0 2.5px ${primary}18`,
        zIndex: 1,
      }} />

      {/* Row 1: Title — Company + Date */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        flexWrap: "wrap" as const,
        gap: "2px 8px",
      }}>
        <span style={{ fontSize: 12.5, lineHeight: 1.3, wordBreak: "break-word" as const }}>
          <span style={{ fontWeight: 600, color: TEXT_DARK }}>{roleText}</span>
          {hasText(companyText) && (
            <>
              <span style={{ color: "#94a3b8", fontWeight: 400, margin: "0 4px" }}>—</span>
              <span style={{ fontWeight: 500, color: primary }}>{companyText}</span>
            </>
          )}
        </span>
        {hasText(entry.meta) && (
          <span style={{ fontSize: 10.5, color: TEXT_LIGHT, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
            {entry.meta}
          </span>
        )}
      </div>

      {/* Row 2: subtitle / location */}
      {(hasText((entry as any).meta2) || hasText((entry as any).location)) && (
        <div style={{ fontSize: 10.5, fontStyle: "italic" as const, color: TEXT_MUTED, marginTop: 1 }}>
          {(entry as any).meta2 || (entry as any).location}
        </div>
      )}

      {/* Description bullets */}
      {hasText(entry.description) && (
        <DescriptionBlock text={entry.description!} accent={accent} bodySize={bodySize} />
      )}
    </div>
  );
}

/* ─── Project Entry (no dots) ─── */
function ProjectEntry({
  entry,
  primary,
  accent,
  bodySize,
}: {
  entry: NormalizedEntry;
  primary: string;
  accent: string;
  bodySize: number;
}) {
  const hasLink = hasText(entry.linkUrl) && hasText(entry.linkLabel);

  return (
    <div style={{ marginBottom: 12, paddingLeft: 0 }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_DARK, wordBreak: "break-word" as const }}>
            {entry.title}
          </span>
          {hasLink && (
            <a
              href={entry.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                fontSize: 10.5,
                color: primary,
                textDecoration: "none",
              }}
            >
              <ExternalLinkIcon />
              {entry.linkLabel}
            </a>
          )}
        </div>
        {hasText(entry.meta) && (
          <span style={{ fontSize: 10, color: TEXT_LIGHT, fontStyle: "italic" as const, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
            {entry.meta}
          </span>
        )}
      </div>

      {hasText(entry.description) && (
        <DescriptionBlock text={entry.description!} accent={accent} bodySize={bodySize} />
      )}
    </div>
  );
}

/* ─── RIGHT_SECTION_TITLES — go to right column ─── */
const RIGHT_SECTION_TITLES = [
  "certifications", "certification",
  "languages", "language",
  "coding platform", "coding platforms", "coding profiles",
  "achievements", "awards",
  "volunteer", "interests", "hobbies",
];

/* ─── Main Template ─── */
export function TimelineTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  const primary = theme.primary ?? "#059669";
  const secondary = theme.secondary ?? "#6B7280";
  const accent = theme.accent ?? "#10b981";
  const headingSize = theme.headingSize ?? 10;
  const bodySize = theme.bodySize ?? 11;

  const hasImage = hasText((data as any).profileImageUrl);

  /* Split skills into categorized (contains ":") vs flat */
  const categorizedSkills = skills.filter(s => s.includes(":"));
  const flatSkills = skills.filter(s => !s.includes(":"));

  /* Split custom sections by column */
  const rightSections = custom.filter(s =>
    RIGHT_SECTION_TITLES.some(t => s.title.toLowerCase().includes(t))
  );
  const leftSections = custom.filter(s =>
    !RIGHT_SECTION_TITLES.some(t => s.title.toLowerCase().includes(t))
  );

  return (
    <div style={{
      fontFamily: theme.font ?? "'Inter', system-ui, sans-serif",
      background: "#ffffff",
      width: "100%",
    }}>

      {/* ══ HEADER ══ */}
      <header style={{
        padding: "24px 28px 16px",
        borderBottom: `2px solid ${primary}`,
        background: "#ffffff",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>

          {/* Left: name + contacts + summary */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: theme.font ?? "'Inter', system-ui, sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: primary,
              letterSpacing: "-0.01em",
              margin: 0,
              lineHeight: 1.15,
              wordBreak: "break-word" as const,
            }}>
              {data.fullName || "Your Name"}
            </h1>

            {/* Contact row */}
            {contacts.length > 0 && (
              <div style={{
                display: "flex",
                flexWrap: "wrap" as const,
                alignItems: "center",
                gap: "3px 0",
                marginTop: 6,
              }}>
                {contacts.map((item, i) => (
                  <React.Fragment key={item.key}>
                    {i > 0 && (
                      <span style={{ color: "#cbd5e0", padding: "0 7px", fontSize: 11 }}>·</span>
                    )}
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          color: TEXT_MUTED,
                          textDecoration: "none",
                        }}
                      >
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 12,
                          height: 12,
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
                        gap: 4,
                        fontSize: 11,
                        color: TEXT_MUTED,
                      }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 12,
                          height: 12,
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
            )}

            {/* Summary */}
            {hasText(data.summary) && (
              <div style={{
                marginTop: 8,
                padding: "8px 12px",
                background: `${primary}08`,
                borderLeft: `3px solid ${primary}`,
                borderRadius: "0 4px 4px 0",
                fontSize: 11,
                lineHeight: 1.6,
                color: TEXT_MUTED,
              }}>
                {data.summary}
              </div>
            )}
          </div>

          {/* Right: avatar (only if uploaded) */}
          {hasImage && (
            <div style={{
              width: 68,
              height: 68,
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

      {/* ══ TWO-COLUMN BODY ══ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.45fr 0.9fr",
        width: "100%",
      }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ padding: "20px 16px 28px 28px" }}>

          {/* Experience with timeline — continuous left line via wrapper */}
          {experience.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <TimelineSectionHeading
                title="Experience"
                primary={primary}
                accent={accent}
                headingSize={headingSize}
              />
              {/* Wrapper with continuous left border acting as the timeline track */}
              <div style={{
                borderLeft: `1.5px solid ${accent}50`,
                marginLeft: 6,
                paddingLeft: 0,
              }}>
                {experience.map((e, idx) => (
                  <TimelineEntry
                    key={e.id}
                    entry={e}
                    primary={primary}
                    accent={accent}
                    secondary={secondary}
                    bodySize={bodySize}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Projects — no timeline dots */}
          {projects.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <TimelineSectionHeading
                title="Projects"
                primary={primary}
                accent={accent}
                headingSize={headingSize}
              />
              {projects.map(e => (
                <ProjectEntry
                  key={e.id}
                  entry={e}
                  primary={primary}
                  accent={accent}
                  bodySize={bodySize}
                />
              ))}
            </section>
          )}

          {/* Left-column custom sections */}
          {leftSections.map(s => (
            <section key={s.id} style={{ marginBottom: 20 }}>
              <TimelineSectionHeading
                title={s.title}
                primary={primary}
                accent={accent}
                headingSize={headingSize}
              />
              {s.entries.map(e => (
                <ProjectEntry
                  key={e.id}
                  entry={e}
                  primary={primary}
                  accent={accent}
                  bodySize={bodySize}
                />
              ))}
            </section>
          ))}
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div style={{
          padding: "20px 28px 28px 16px",
          background: BG_RIGHT,
          borderLeft: "1px solid #e8edf2",
        }}>

          {/* Skills */}
          {skills.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <TimelineSectionHeading
                title="Skills"
                primary={primary}
                accent={accent}
                headingSize={headingSize}
              />

              {/* Categorized skills (Category: values) */}
              {categorizedSkills.length > 0 && (
                <div style={{ marginBottom: flatSkills.length > 0 ? 8 : 0 }}>
                  {categorizedSkills.map((s, idx) => {
                    const colonIdx = s.indexOf(":");
                    const cat = s.slice(0, colonIdx).trim();
                    const vals = s.slice(colonIdx + 1).trim();
                    return (
                      <div key={idx} style={{ marginBottom: 3, fontSize: bodySize }}>
                        <span style={{ fontWeight: 600, color: TEXT_DARK }}>{cat}:</span>
                        <span style={{ color: TEXT_MUTED, marginLeft: 4 }}>{vals}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Flat skill chips */}
              {flatSkills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                  {flatSkills.map(skill => (
                    <span key={skill} style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "3px 9px",
                      background: `${primary}12`,
                      border: `1px solid ${accent}40`,
                      borderRadius: 20,
                      fontSize: Math.max(bodySize - 1, 9),
                      fontWeight: 500,
                      color: primary,
                      lineHeight: 1,
                      whiteSpace: "nowrap" as const,
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <TimelineSectionHeading
                title="Education"
                primary={primary}
                accent={accent}
                headingSize={headingSize}
              />
              {education.map(e => {
                const titleParts = (e.title ?? "").split(" · ");
                const college = titleParts.slice(1).join(" · ") || titleParts[0] || "";
                const degree = titleParts.length > 1 ? titleParts[0] : "";

                let year = "", cgpa = "";
                if (e.meta?.includes("||SPLIT||")) {
                  [year, cgpa] = e.meta.split("||SPLIT||").map(s => s.trim());
                } else {
                  const parts = e.meta?.split(/\s*[–|]\s*/) ?? [];
                  year = parts[0]?.trim() ?? "";
                  cgpa = parts[1]?.trim() ?? "";
                }

                return (
                  <div key={e.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_DARK, lineHeight: 1.3 }}>
                      {college}
                    </div>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginTop: 1,
                    }}>
                      <span style={{ fontSize: 10.5, color: TEXT_MUTED }}>{degree}</span>
                      <span style={{ fontSize: 10.5, color: TEXT_LIGHT, whiteSpace: "nowrap" as const }}>
                        {year}
                      </span>
                    </div>
                    {hasText(cgpa) && (
                      <div style={{ fontSize: 10.5, color: TEXT_MUTED, marginTop: 1 }}>{cgpa}</div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Right-column custom sections */}
          {rightSections.map(s => {
            const titleLower = s.title.toLowerCase();
            const isCert = titleLower.includes("certif");
            const isLang = titleLower.includes("lang");
            const isCoding = titleLower.startsWith("coding");

            return (
              <section key={s.id} style={{ marginBottom: 20 }}>
                <TimelineSectionHeading
                  title={s.title}
                  primary={primary}
                  accent={accent}
                  headingSize={headingSize}
                />

                {/* Certifications */}
                {isCert && s.entries.map(e => (
                  <div key={e.id} style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_DARK }}>
                      {e.title}
                    </span>
                    {hasText(e.meta) && (
                      <div style={{ fontSize: 10, color: TEXT_MUTED }}>{e.meta}</div>
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
                          marginTop: 1,
                        }}
                      >
                        <ExternalLinkIcon />
                        {e.linkLabel}
                      </a>
                    )}
                  </div>
                ))}

                {/* Languages — inline flex spaced */}
                {isLang && (() => {
                  const n = s.entries.length;
                  const getAlign = (i: number): "left" | "center" | "right" => {
                    if (i === 0) return "left";
                    if (n === 2) return "left";
                    if (i === n - 1) return "right";
                    return "center";
                  };
                  return (
                    <div style={{ display: "flex", alignItems: "center", fontSize: bodySize }}>
                      {s.entries.map((e, i) => (
                        <div key={e.id} style={{ flex: 1, textAlign: getAlign(i) }}>
                          <span style={{ fontWeight: 600, color: TEXT_DARK }}>{e.title}</span>
                          {hasText(e.meta) && (
                            <span style={{ color: TEXT_MUTED }}> – {e.meta}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Coding platforms — inline description after colon */}
                {isCoding && (
                  <div>
                    {s.entries.map(e => (
                      <div key={e.id} style={{
                        fontSize: bodySize,
                        lineHeight: 1.55,
                        color: TEXT_MUTED,
                        marginBottom: 3,
                        paddingLeft: 14,
                        position: "relative" as const,
                      }}>
                        <span style={{
                          position: "absolute" as const,
                          left: 0,
                          top: 0,
                          color: accent,
                          fontWeight: 700,
                        }}>•</span>
                        <span style={{ fontWeight: 700, color: TEXT_DARK }}>{e.title}</span>
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
                              marginLeft: 4,
                              marginRight: 2,
                              verticalAlign: "middle",
                            }}
                          >
                            <ExternalLinkIcon />
                            {e.linkLabel}
                          </a>
                        )}
                        {hasText(e.description) && (
                          <span style={{ color: TEXT_MUTED }}>
                            : {e.description!.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Generic right-column sections */}
                {!isCert && !isLang && !isCoding && s.entries.map(e => (
                  <div key={e.id} style={{ marginBottom: 6 }}>
                    {hasText(e.title) && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_DARK }}>{e.title}</span>
                    )}
                    {hasText(e.meta) && (
                      <span style={{ fontSize: 10, color: TEXT_LIGHT, marginLeft: 4 }}>{e.meta}</span>
                    )}
                    {hasText(e.description) && (
                      <div style={{ fontSize: bodySize - 0.5, color: TEXT_MUTED, marginTop: 1 }}>
                        {e.description}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            );
          })}

        </div>
      </div>
    </div>
  );
}
