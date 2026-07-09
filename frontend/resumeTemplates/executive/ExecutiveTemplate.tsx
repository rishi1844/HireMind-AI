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

/* ══════════════════════════════════════
   INLINE SVG ICONS — PDF / Puppeteer safe
══════════════════════════════════════ */
const PhoneIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const MailIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const MapIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
const LinkedIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>;
const GitHubIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>;
const GlobeIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>;
const LinkIcon = () => <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", flexShrink: 0 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
const StarIcon = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;

/* ══════════════════════════════════════
   BULLET NORMALIZER
══════════════════════════════════════ */
function normalizeBullets(text: string): string[] {
  return text
    .replace(/\n(?=[a-z])/g, " ")
    .trim()
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);
}

/* ══════════════════════════════════════
   SIDEBAR SECTION HEADING
══════════════════════════════════════ */
function SBHeading({ title, accent }: { title: string; accent: string }) {
  return (
    <div style={{ marginBottom: 9, marginTop: 16 }}>
      <div style={{
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.20em",
        textTransform: "uppercase" as const,
        color: accent,
        marginBottom: 5,
      }}>
        {title}
      </div>
      <div style={{ height: 1, background: `${accent}45` }} />
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN SECTION HEADING
══════════════════════════════════════ */
function MainHeading({ title, primary, accent, headingSize }: {
  title: string; primary: string; accent: string; headingSize: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, marginBottom: 10 }}>
      <div style={{ width: 4, height: 16, background: accent, borderRadius: 2, flexShrink: 0 }} />
      <div style={{
        flex: 1,
        fontSize: headingSize,
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase" as const,
        color: primary,
        borderBottom: `1.5px solid ${primary}12`,
        paddingBottom: 4,
      }}>
        {title}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BULLET LIST — RIGHT-COLUMN BULLETS
══════════════════════════════════════ */
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
            opacity: 0.75,
            flexShrink: 0,
            marginTop: 6,
          }} />
          <span style={{ flex: 1 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════
   WHICH SECTIONS GO TO SIDEBAR?
══════════════════════════════════════ */
const SIDEBAR_KEYS = [
  "achieve", "award",
  "certif", "training", "course",
  "interest", "hobbi",
];
function isSidebarSection(title: string) {
  const t = title.toLowerCase();
  return SIDEBAR_KEYS.some(k => t.includes(k));
}

/* ══════════════════════════════════════
   MAIN TEMPLATE
══════════════════════════════════════ */
export function ExecutiveTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  const primary = theme.primary ?? "#0f172a";
  const accent = theme.accent ?? "#2563eb";
  const headingSize = theme.headingSize ?? 9.5;
  const bodySize = theme.bodySize ?? 11;

  const hasImage = hasText((data as any).profileImageUrl);
  const jobTitle = (data as any).jobTitle ?? "";

  /* Sidebar is always the same dark bg as primary */
  const sbText = "#f1f5f9";
  const sbMuted = "rgba(241,245,249,0.62)";
  const sbBorder = "rgba(241,245,249,0.13)";
  const chipBg = "rgba(255,255,255,0.10)";
  const sbAccent = accent;

  /* Split custom sections */
  const sidebarCustom = custom.filter(s => isSidebarSection(s.title));
  const langSections = custom.filter(s => s.title.toLowerCase().includes("lang"));
  const codingSections = custom.filter(s => s.title.toLowerCase().startsWith("coding") || s.title.toLowerCase().includes("profile"));
  const mainCustom = custom.filter(s =>
    !isSidebarSection(s.title) &&
    !s.title.toLowerCase().includes("lang") &&
    !(s.title.toLowerCase().startsWith("coding") || s.title.toLowerCase().includes("profile"))
  );

  /* Split skills into categorized vs flat */
  const catSkills = skills.filter(s => s.includes(":"));
  const flatSkills = skills.filter(s => !s.includes(":"));

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

      {/* ══════════ LEFT MAIN (70%) ══════════ */}
      <div style={{ flex: "0 0 70%", maxWidth: "70%", background: "#ffffff" }}>

        {/* ── HEADER ── */}
        <div style={{
          padding: "26px 24px 18px",
          borderBottom: `3px solid ${primary}`,
        }}>
          {/* Name */}
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: primary,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            wordBreak: "break-word" as const,
          }}>
            {data.fullName || "Your Name"}
          </h1>

          {/* Job Title */}
          {hasText(jobTitle) && (
            <div style={{
              fontSize: 13,
              fontWeight: 500,
              color: accent,
              marginTop: 4,
              letterSpacing: "0.01em",
            }}>
              {jobTitle}
            </div>
          )}

          {/* Separator line */}
          {contacts.length > 0 && (
            <div style={{ height: 1, background: `${primary}15`, margin: "10px 0 8px" }} />
          )}

          {/* Contact Row — horizontal, inline */}
          {contacts.length > 0 && (
            <div style={{
              display: "flex",
              flexWrap: "wrap" as const,
              alignItems: "center",
              gap: "3px 0",
              rowGap: 3,
            }}>
              {contacts.map((item, i) => (
                <React.Fragment key={item.key}>
                  {i > 0 && (
                    <span style={{ color: "#cbd5e1", padding: "0 7px", fontSize: 10, flexShrink: 0 }}>·</span>
                  )}
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      color: "#64748b",
                      textDecoration: "none",
                      flexShrink: 0,
                    }}>
                      <span style={{ color: accent, display: "inline-flex", alignItems: "center" }}>
                        {item.icon}
                      </span>
                      {item.label}
                    </a>
                  ) : (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      color: "#64748b",
                      flexShrink: 0,
                    }}>
                      <span style={{ color: accent, display: "inline-flex", alignItems: "center" }}>
                        {item.icon}
                      </span>
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ padding: "4px 24px 28px" }}>

          {/* PROFESSIONAL SUMMARY */}
          {hasText(data.summary) && (
            <section>
              <MainHeading title="Summary" primary={primary} accent={accent} headingSize={headingSize} />
              <div style={{
                padding: "10px 14px",
                background: `${primary}06`,
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

          {/* EXPERIENCE */}
          {experience.length > 0 && (
            <section>
              <MainHeading title="Experience" primary={primary} accent={accent} headingSize={headingSize} />
              {experience.map((e, idx) => {
                const parts = (e.title ?? "").split(" · ");
                const role = parts[0] ?? "";
                const company = parts.slice(1).join(" — ");
                return (
                  <div key={e.id} style={{
                    marginBottom: idx < experience.length - 1 ? 14 : 0,
                    paddingBottom: idx < experience.length - 1 ? 14 : 0,
                    borderBottom: idx < experience.length - 1 ? `1px solid ${primary}0d` : "none",
                  }}>
                    {/* Role + Date */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{role}</div>
                        {hasText(company) && (
                          <div style={{ fontSize: 11.5, fontWeight: 500, color: accent, marginTop: 1 }}>{company}</div>
                        )}
                      </div>
                      {hasText(e.meta) && (
                        <span style={{
                          fontSize: 9.5,
                          color: "#94a3b8",
                          whiteSpace: "nowrap" as const,
                          flexShrink: 0,
                          fontStyle: "italic" as const,
                          marginTop: 1,
                        }}>
                          {e.meta}
                        </span>
                      )}
                    </div>
                    {/* Location/subtitle */}
                    {hasText((e as any).meta2) && (
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, fontStyle: "italic" as const }}>
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

          {/* PROJECTS */}
          {projects.length > 0 && (
            <section>
              <MainHeading title="Projects" primary={primary} accent={accent} headingSize={headingSize} />
              {projects.map((e, idx) => {
                const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                return (
                  <div key={e.id} style={{
                    marginBottom: idx < projects.length - 1 ? 12 : 0,
                    paddingBottom: idx < projects.length - 1 ? 12 : 0,
                    borderBottom: idx < projects.length - 1 ? `1px solid ${primary}0d` : "none",
                  }}>
                    {/* Title + Link + Tech Stack — all on one row */}
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                      {/* Left: title + link */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{e.title}</span>
                        {hasLink && (
                          <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 9.5,
                            color: accent,
                            textDecoration: "none",
                            fontWeight: 500,
                          }}>
                            <LinkIcon /> {e.linkLabel}
                          </a>
                        )}
                      </div>
                      {/* Right: tech stack in parens */}
                      {hasText(e.meta) && (
                        <span style={{
                          fontSize: 9.5,
                          color: "#94a3b8",
                          fontStyle: "italic" as const,
                          whiteSpace: "nowrap" as const,
                          flexShrink: 0,
                        }}>
                          ({e.meta})
                        </span>
                      )}
                    </div>
                    {hasText(e.description) && (
                      <BulletList text={e.description!} accent={accent} bodySize={bodySize} />
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* CODING PROFILES — in main */}
          {codingSections.map(s => (
            <section key={s.id}>
              <MainHeading title={s.title} primary={primary} accent={accent} headingSize={headingSize} />
              {s.entries.map(e => (
                <div key={e.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" as const }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a" }}>{e.title}</span>
                    {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                      <>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>:</span>
                        <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 9.5,
                          color: accent,
                          textDecoration: "none",
                        }}>
                          <LinkIcon /> {e.linkLabel}
                        </a>
                      </>
                    )}
                  </div>
                  {hasText(e.description) && (
                    <div style={{ fontSize: bodySize - 0.5, color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>
                      {e.description?.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim()}
                    </div>
                  )}
                </div>
              ))}
            </section>
          ))}



          {/* MAIN CUSTOM — remaining */}
          {mainCustom.map(s => (
            <section key={s.id}>
              <MainHeading title={s.title} primary={primary} accent={accent} headingSize={headingSize} />
              {s.entries.map((e, idx) => (
                <div key={e.id} style={{ marginBottom: 8 }}>
                  {hasText(e.title) && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{e.title}</div>
                  )}
                  {hasText(e.meta) && (
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{e.meta}</div>
                  )}
                  {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                    <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: 9.5,
                      color: accent,
                      textDecoration: "none",
                      marginTop: 2,
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

      {/* ══════════ RIGHT SIDEBAR (30%) ══════════ */}
      <div style={{
        flex: "0 0 30%",
        maxWidth: "30%",
        background: primary,
        display: "flex",
        flexDirection: "column" as const,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}>

        {/* ── SIDEBAR HEADER: Profile Image ── */}
        <div style={{
          padding: "26px 18px 18px",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          borderBottom: `1px solid ${sbBorder}`,
        }}>
          {hasImage ? (
            <div style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              overflow: "hidden",
              backgroundImage: `url(${(data as any).profileImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              border: `3px solid ${sbBorder}`,
              flexShrink: 0,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            } as React.CSSProperties} />
          ) : (
            /* Placeholder initials circle if no image */
            <div style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.10)",
              border: `2px solid ${sbBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "rgba(255,255,255,0.50)",
              letterSpacing: "-0.01em",
            }}>
              {(data.fullName || "U").split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
          )}
        </div>

        {/* ── SIDEBAR BODY ── */}
        <div style={{ padding: "0 18px 28px", flex: 1 }}>

          {/* ── EDUCATION (first) ── */}
          {education.length > 0 && (
            <div>
              <SBHeading title="Education" accent={sbAccent} />
              {education.map(e => {
                const parts = (e.title ?? "").split(" · ");
                const college = parts.slice(1).join(" · ") || parts[0] || "";
                const degree = parts.length > 1 ? parts[0] : "";
                let year = "", cgpa = "";
                if (e.meta?.includes("||SPLIT||")) {
                  [year, cgpa] = e.meta.split("||SPLIT||").map(s => s.trim());
                } else if (e.meta) {
                  const p = e.meta.split(/\s*[–|]\s*/);
                  year = p[0]?.trim() ?? "";
                  cgpa = p[1]?.trim() ?? "";
                }
                return (
                  <div key={e.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: sbText, lineHeight: 1.3 }}>{college}</div>
                    {hasText(degree) && (
                      <div style={{ fontSize: 9.5, color: sbMuted, marginTop: 1 }}>{degree}</div>
                    )}
                    <div style={{ fontSize: 9.5, color: sbMuted, marginTop: 2 }}>
                      {[year, cgpa].filter(Boolean).join(" | ")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SKILLS (second) ── */}
          {skills.length > 0 && (
            <div>
              <SBHeading title="Skills" accent={sbAccent} />
              {catSkills.length > 0 && (
                <div style={{ marginBottom: flatSkills.length > 0 ? 8 : 0 }}>
                  {catSkills.map((s, i) => {
                    const ci = s.indexOf(":");
                    const cat = s.slice(0, ci).trim();
                    const vals = s.slice(ci + 1).trim();
                    return (
                      <div key={i} style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: sbAccent, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 2 }}>{cat}</div>
                        <div style={{ fontSize: 10, color: sbText, lineHeight: 1.4 }}>{vals}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {flatSkills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                  {flatSkills.map(skill => (
                    <span key={skill} style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 9px",
                      background: chipBg,
                      border: `1px solid rgba(255,255,255,0.20)`,
                      borderRadius: 20,
                      fontSize: 9.5,
                      fontWeight: 500,
                      color: sbText,
                      whiteSpace: "nowrap" as const,
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CUSTOM SECTIONS (achievements, interests etc — NOT cert/lang) ── */}
          {sidebarCustom
            .filter(s => {
              const tl = s.title.toLowerCase();
              return !tl.includes("certif") && !tl.includes("training") && !tl.includes("course") && !tl.includes("lang");
            })
            .map(s => {
              const tl = s.title.toLowerCase();
              const isAchieve = tl.includes("achieve") || tl.includes("award");
              const isInterest = tl.includes("interest") || tl.includes("hobbi");
              return (
                <div key={s.id}>
                  <SBHeading title={s.title} accent={sbAccent} />
                  {isAchieve && (
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                      {s.entries.map(e => (
                        <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ color: sbAccent, flexShrink: 0, marginTop: 1 }}><StarIcon /></span>
                          <div>
                            {hasText(e.title) && <div style={{ fontSize: 10.5, fontWeight: 700, color: sbText, lineHeight: 1.3 }}>{e.title}</div>}
                            {hasText(e.description) && <div style={{ fontSize: 9.5, color: sbMuted, marginTop: 1, lineHeight: 1.45 }}>{e.description?.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim()}</div>}
                            {hasText(e.meta) && <div style={{ fontSize: 9, color: sbMuted, fontStyle: "italic" as const }}>{e.meta}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isInterest && (
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
                      {s.entries.map(e => (
                        <div key={e.id} style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", background: chipBg, border: `1px solid rgba(255,255,255,0.18)`, borderRadius: 20, fontSize: 9.5, color: sbText, fontWeight: 500 }}>
                          {e.title}
                        </div>
                      ))}
                    </div>
                  )}
                  {!isAchieve && !isInterest && (
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                      {s.entries.map(e => (
                        <div key={e.id} style={{ fontSize: 10, color: sbMuted, lineHeight: 1.4 }}>
                          {hasText(e.title) && <span style={{ fontWeight: 600, color: sbText }}>{e.title} </span>}
                          {hasText(e.meta) && <span>{e.meta}</span>}
                          {hasText(e.description) && <div style={{ marginTop: 1 }}>{e.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

          {/* ── CERTIFICATIONS (second-to-last) ── */}
          {sidebarCustom
            .filter(s => {
              const tl = s.title.toLowerCase();
              return tl.includes("certif") || tl.includes("training") || tl.includes("course");
            })
            .map(s => (
              <div key={s.id}>
                <SBHeading title={s.title} accent={sbAccent} />
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                  {s.entries.map(e => (
                    <div key={e.id}>
                      <div style={{ display: "flex", flexWrap: "wrap" as const, alignItems: "baseline", gap: 3 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: sbText }}>{e.title}</span>
                        {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                          <>
                            <span style={{ fontSize: 9, color: sbMuted }}>:</span>
                            <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 9, color: sbAccent, textDecoration: "none" }}>
                              <LinkIcon /> {e.linkLabel}
                            </a>
                          </>
                        )}
                      </div>
                      {hasText(e.meta) && <div style={{ fontSize: 9.5, color: sbMuted, marginTop: 1 }}>{e.meta}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {/* ── LANGUAGES (last) ── */}
          {langSections.map(s => (
            <div key={s.id}>
              <SBHeading title={s.title} accent={sbAccent} />
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                {s.entries.map(e => (
                  <div key={e.id} style={{ fontSize: 10, color: sbMuted, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600, color: sbText }}>{e.title}</span>
                    {hasText(e.meta) && <span> — {e.meta}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
