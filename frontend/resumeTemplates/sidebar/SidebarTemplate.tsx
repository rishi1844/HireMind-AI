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
import type { TemplateProps, NormalizedEntry } from "../shared/types";

/* ══════════════════════════════════════════════
   INLINE SVG ICONS — PDF/Puppeteer safe
══════════════════════════════════════════════ */
const MailIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MapIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const LinkedInIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
  </svg>
);
const GitHubIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
  </svg>
);
const LinkIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", flexShrink: 0 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* ══════════════════════════════════════════════
   BULLET NORMALIZER
   Strips: -, •, *, –, ·, and leading spaces
══════════════════════════════════════════════ */
function normalizeBullets(text: string): string[] {
  // Join continuation lines (newline followed by lowercase = word-wrap artifact)
  const joined = text.replace(/\n(?=[a-z])/g, " ").trim();
  return joined
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);
}

/* ══════════════════════════════════════════════
   SIDEBAR SECTION HEADING
══════════════════════════════════════════════ */
function SidebarHeading({ title, accent }: { title: string; accent: string }) {
  return (
    <div style={{ marginBottom: 10, marginTop: 18 }}>
      <div style={{
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase" as const,
        color: accent,
        marginBottom: 5,
      }}>
        {title}
      </div>
      <div style={{ height: 1, background: `${accent}40`, width: "100%" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   RIGHT SECTION HEADING
══════════════════════════════════════════════ */
function RightHeading({
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
    <div style={{ marginBottom: 10, marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 3, height: 14, background: accent, borderRadius: 2, flexShrink: 0 }} />
      <div style={{
        fontSize: headingSize,
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase" as const,
        color: primary,
        flex: 1,
        paddingBottom: 4,
        borderBottom: `1.5px solid ${primary}15`,
      }}>
        {title}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   BULLET LIST (right column)
══════════════════════════════════════════════ */
function BulletList({ text, accent, bodySize }: { text: string; accent: string; bodySize: number }) {
  const lines = normalizeBullets(text);
  if (!lines.length) return null;
  return (
    <ul style={{ margin: "5px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 7,
          fontSize: bodySize,
          color: "#475569",
          lineHeight: 1.6,
          marginBottom: 2,
          wordBreak: "break-word" as const,
        }}>
          <span style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: accent,
            opacity: 0.8,
            flexShrink: 0,
            marginTop: 6,
          }} />
          <span style={{ flex: 1 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════════════
   SECTIONS THAT BELONG ON THE SIDEBAR
══════════════════════════════════════════════ */
const SIDEBAR_SECTION_KEYS = [
  "certif", "lang", "coding", "achieve", "award",
  "volunteer", "interest", "hobb", "profile",
];

function isSidebarSection(title: string) {
  const t = title.toLowerCase();
  return SIDEBAR_SECTION_KEYS.some(k => t.includes(k));
}

/* ══════════════════════════════════════════════
   MAIN TEMPLATE
══════════════════════════════════════════════ */
export function SidebarTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  const primary = theme.primary ?? "#1e3a5f";
  const accent = theme.accent ?? "#3b82f6";
  const headingSize = theme.headingSize ?? 9.5;
  const bodySize = theme.bodySize ?? 11;

  const hasImage = hasText((data as any).profileImageUrl);
  const jobTitle = (data as any).jobTitle ?? "";

  // Sidebar text colors — always light for dark sidebar bg
  const sidebarText = "#f1f5f9";
  const sidebarMuted = "rgba(241,245,249,0.65)";
  const sidebarBorder = "rgba(241,245,249,0.14)";
  const chipBg = "rgba(255,255,255,0.10)";
  const chipBorder = "rgba(255,255,255,0.22)";
  // Sidebar accent: slightly lighter/brighter version — use theme.accent
  const sidebarAccent = accent;

  // Split custom sections
  const sidebarCustom = custom.filter(s => isSidebarSection(s.title));
  const rightCustom = custom.filter(s => !isSidebarSection(s.title));

  // Contact icon map
  const iconMap: Record<string, React.ReactNode> = {
    email: <MailIcon />,
    phone: <PhoneIcon />,
    location: <MapIcon />,
    linkedin: <LinkedInIcon />,
    github: <GitHubIcon />,
    portfolio: <GlobeIcon />,
  };

  return (
    <div style={{
      fontFamily: theme.font ?? "'Inter', 'DM Sans', system-ui, sans-serif",
      display: "flex",
      width: "100%",
      minHeight: 1123,
      background: "#ffffff",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    } as React.CSSProperties}>

      {/* ══════════ LEFT SIDEBAR ══════════ */}
      <div style={{
        width: "28%",
        flexShrink: 0,
        background: primary,
        display: "flex",
        flexDirection: "column" as const,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}>

        {/* ── SIDEBAR HEADER ── */}
        <div style={{
          padding: "28px 20px 20px",
          borderBottom: `1px solid ${sidebarBorder}`,
        }}>
          {/* Profile image */}
          {hasImage && (
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 14,
              border: `2px solid ${chipBorder}`,
              flexShrink: 0,
              backgroundImage: `url(${(data as any).profileImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            } as React.CSSProperties} />
          )}

          {/* Name */}
          <h1 style={{
            fontSize: 20,
            fontWeight: 800,
            color: sidebarText,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            wordBreak: "break-word" as const,
          }}>
            {data.fullName || "Your Name"}
          </h1>

          {/* Job title */}
          {hasText(jobTitle) && (
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: sidebarAccent,
              marginTop: 4,
              lineHeight: 1.3,
            }}>
              {jobTitle}
            </div>
          )}
        </div>

        {/* ── SIDEBAR BODY ── */}
        <div style={{ padding: "0 20px 28px", flex: 1 }}>

          {/* CONTACT */}
          {contacts.length > 0 && (
            <div>
              <SidebarHeading title="Contact" accent={sidebarAccent} />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                {contacts.map(item => (
                  <div key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 16,
                      height: 16,
                      flexShrink: 0,
                      marginTop: 1,
                      color: sidebarAccent,
                      opacity: 0.9,
                    }}>
                      {item.icon}
                    </span>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" style={{
                        fontSize: 10,
                        color: sidebarMuted,
                        textDecoration: "none",
                        lineHeight: 1.5,
                        wordBreak: "break-all" as const,
                        flex: 1,
                      }}>
                        {item.label}
                      </a>
                    ) : (
                      <span style={{
                        fontSize: 10,
                        color: sidebarMuted,
                        lineHeight: 1.5,
                        flex: 1,
                        wordBreak: "break-word" as const,
                      }}>
                        {item.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SKILLS */}
          {skills.length > 0 && (
            <div>
              <SidebarHeading title="Skills" accent={sidebarAccent} />
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                {skills.map(skill => (
                  <span key={skill} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 8px",
                    background: chipBg,
                    border: `1px solid ${chipBorder}`,
                    borderRadius: 20,
                    fontSize: Math.max(bodySize - 2, 8.5),
                    fontWeight: 500,
                    color: sidebarText,
                    lineHeight: 1.3,
                    whiteSpace: "nowrap" as const,
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SIDEBAR CUSTOM SECTIONS */}
          {sidebarCustom.map(s => {
            const tl = s.title.toLowerCase();
            const isCert = tl.includes("certif");
            const isLang = tl.includes("lang");
            const isCoding = tl.startsWith("coding") || tl.includes("profile");

            return (
              <div key={s.id}>
                <SidebarHeading title={s.title} accent={sidebarAccent} />

                {/* Certifications */}
                {isCert && s.entries.map(e => (
                  <div key={e.id} style={{ marginBottom: 7 }}>
                    {/* Title + link on same row */}
                    <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" as const, gap: 4, lineHeight: 1.35 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: sidebarText }}>{e.title}</span>
                      {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                        <>
                          <span style={{ fontSize: 9, color: sidebarMuted }}>:</span>
                          <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            fontSize: 9,
                            color: sidebarAccent,
                            textDecoration: "none",
                          }}>
                            <LinkIcon /> {e.linkLabel}
                          </a>
                        </>
                      )}
                    </div>
                    {hasText(e.meta) && (
                      <div style={{ fontSize: 9.5, color: sidebarMuted, marginTop: 1 }}>{e.meta}</div>
                    )}
                  </div>
                ))}

                {/* Languages */}
                {isLang && (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                    {s.entries.map(e => (
                      <div key={e.id} style={{ fontSize: 10, color: sidebarMuted, lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 600, color: sidebarText }}>{e.title}</span>
                        {hasText(e.meta) && (
                          <span style={{ color: sidebarMuted }}> — {e.meta}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Coding profiles */}
                {isCoding && (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                    {s.entries.map(e => (
                      <div key={e.id}>
                        {/* Title + link on same row */}
                        <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" as const, gap: 4, lineHeight: 1.35 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: sidebarText }}>{e.title}</span>
                          {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                            <>
                              <span style={{ fontSize: 9, color: sidebarMuted }}>:</span>
                              <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 2,
                                fontSize: 9,
                                color: sidebarAccent,
                                textDecoration: "none",
                              }}>
                                <LinkIcon /> {e.linkLabel}
                              </a>
                            </>
                          )}
                        </div>
                        {hasText(e.description) && (
                          <div style={{ fontSize: 9.5, color: sidebarMuted, marginTop: 2, lineHeight: 1.4 }}>
                            {e.description?.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Generic sidebar section */}
                {!isCert && !isLang && !isCoding && (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                    {s.entries.map(e => (
                      <div key={e.id} style={{ fontSize: 10, color: sidebarMuted, lineHeight: 1.4 }}>
                        {hasText(e.title) && (
                          <span style={{ fontWeight: 600, color: sidebarText }}>{e.title} </span>
                        )}
                        {hasText(e.meta) && <span>{e.meta}</span>}
                        {hasText(e.description) && (
                          <div style={{ marginTop: 1 }}>{e.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* ══════════ RIGHT CONTENT ══════════ */}
      <div style={{
        flex: 1,
        background: "#ffffff",
        padding: "28px 28px 28px 24px",
        minWidth: 0,
      }}>

        {/* ── PROFESSIONAL SUMMARY ── */}
        {hasText(data.summary) && (
          <section style={{ marginTop: 0 }}>
            <RightHeading title="Summary" primary={primary} accent={accent} headingSize={headingSize} />
            <div style={{
              padding: "10px 14px",
              background: `${primary}07`,
              borderLeft: `3px solid ${accent}`,
              borderRadius: "0 6px 6px 0",
              fontSize: bodySize,
              lineHeight: 1.7,
              color: "#374151",
            }}>
              {data.summary}
            </div>
          </section>
        )}

        {/* ── EXPERIENCE ── */}
        {experience.length > 0 && (
          <section>
            <RightHeading title="Experience" primary={primary} accent={accent} headingSize={headingSize} />
            {experience.map((e, idx) => {
              const parts = (e.title ?? "").split(" · ");
              const role = parts[0] ?? "";
              const company = parts.slice(1).join(" — ");
              return (
                <div key={e.id} style={{
                  marginBottom: idx < experience.length - 1 ? 14 : 0,
                  paddingBottom: idx < experience.length - 1 ? 14 : 0,
                  borderBottom: idx < experience.length - 1 ? `1px solid ${primary}10` : "none",
                }}>
                  {/* Role + Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{role}</span>
                      {hasText(company) && (
                        <>
                          <span style={{ color: "#94a3b8", margin: "0 5px", fontWeight: 400 }}>—</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: accent }}>{company}</span>
                        </>
                      )}
                    </div>
                    {hasText(e.meta) && (
                      <span style={{
                        fontSize: 10,
                        color: "#94a3b8",
                        whiteSpace: "nowrap" as const,
                        flexShrink: 0,
                        fontStyle: "italic" as const,
                      }}>
                        {e.meta}
                      </span>
                    )}
                  </div>
                  {/* Location / subtitle */}
                  {hasText((e as any).meta2) && (
                    <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1, fontStyle: "italic" as const }}>
                      {(e as any).meta2}
                    </div>
                  )}
                  {hasText(e.description) && (
                    <BulletList text={e.description!} accent={accent} bodySize={bodySize} />
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ── PROJECTS ── */}
        {projects.length > 0 && (
          <section>
            <RightHeading title="Projects" primary={primary} accent={accent} headingSize={headingSize} />
            {projects.map((e, idx) => {
              const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
              return (
                <div key={e.id} style={{
                  marginBottom: idx < projects.length - 1 ? 12 : 0,
                  paddingBottom: idx < projects.length - 1 ? 12 : 0,
                  borderBottom: idx < projects.length - 1 ? `1px solid ${primary}10` : "none",
                }}>
                  {/* Project title + link */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{e.title}</span>
                      {hasLink && (
                        <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          fontSize: 9.5,
                          color: accent,
                          textDecoration: "none",
                          fontWeight: 500,
                        }}>
                          <LinkIcon /> {e.linkLabel}
                        </a>
                      )}
                    </div>
                  </div>
                  {/* Tech stack */}
                  {hasText(e.meta) && (
                    <div style={{
                      fontSize: 10,
                      color: "#64748b",
                      fontStyle: "italic" as const,
                      marginTop: 2,
                    }}>
                      {e.meta}
                    </div>
                  )}
                  {hasText(e.description) && (
                    <BulletList text={e.description!} accent={accent} bodySize={bodySize} />
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ── EDUCATION ── */}
        {education.length > 0 && (
          <section>
            <RightHeading title="Education" primary={primary} accent={accent} headingSize={headingSize} />
            {education.map((e, idx) => {
              const titleParts = (e.title ?? "").split(" · ");
              const college = titleParts.slice(1).join(" · ") || titleParts[0] || "";
              const degree = titleParts.length > 1 ? titleParts[0] : "";

              let year = "", cgpa = "";
              if (e.meta?.includes("||SPLIT||")) {
                [year, cgpa] = e.meta.split("||SPLIT||").map(s => s.trim());
              } else if (e.meta) {
                const p = e.meta.split(/\s*[–|]\s*/);
                year = p[0]?.trim() ?? "";
                cgpa = p[1]?.trim() ?? "";
              }

              return (
                <div key={e.id} style={{
                  marginBottom: idx < education.length - 1 ? 12 : 0,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", flex: 1 }}>{college}</span>
                    {hasText(year) && (
                      <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" as const, fontStyle: "italic" as const }}>
                        {year}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
                    <span style={{ fontSize: 10.5, color: "#64748b" }}>{degree}</span>
                    {hasText(cgpa) && (
                      <span style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" as const }}>
                        {cgpa}
                      </span>
                    )}
                  </div>
                  {hasText(e.description) && (
                    <div style={{ fontSize: bodySize - 0.5, color: "#94a3b8", marginTop: 2 }}>{e.description}</div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ── RIGHT-SIDE CUSTOM SECTIONS ── */}
        {rightCustom.map(s => (
          <section key={s.id}>
            <RightHeading title={s.title} primary={primary} accent={accent} headingSize={headingSize} />
            {s.entries.map((e, idx) => (
              <div key={e.id} style={{ marginBottom: idx < s.entries.length - 1 ? 10 : 0 }}>
                {hasText(e.title) && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{e.title} </span>
                )}
                {hasText(e.meta) && (
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{e.meta}</span>
                )}
                {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                  <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                    fontSize: 9.5,
                    color: accent,
                    textDecoration: "none",
                    marginLeft: 6,
                  }}>
                    <LinkIcon /> {e.linkLabel}
                  </a>
                )}
                {hasText(e.description) && (
                  <BulletList text={e.description!} accent={accent} bodySize={bodySize} />
                )}
              </div>
            ))}
          </section>
        ))}

      </div>
    </div>
  );
}
