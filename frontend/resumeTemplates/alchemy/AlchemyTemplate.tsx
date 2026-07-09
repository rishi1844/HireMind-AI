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
import type { TemplateProps } from "../shared/types";

/* ══════════════════════════════════════════════
   INLINE SVG ICONS — PDF/Puppeteer safe
   ══════════════════════════════════════════════ */
const MailIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MapIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
  </svg>
);
const LinkIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", flexShrink: 0 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* ══════════════════════════════════════════════
   BULLET LIST
   ══════════════════════════════════════════════ */
function BulletList({ text, accent, bodySize }: { text: string; accent: string; bodySize: number }) {
  const lines = text
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: bodySize, color: "#374151", lineHeight: 1.6, marginBottom: 3, wordBreak: "break-word" as const }}>
          <span style={{
            display: "inline-block", width: 4, height: 4,
            borderRadius: "50%", background: accent,
            flexShrink: 0, marginTop: 7,
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }} />
          <span style={{ flex: 1 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════════════
   SIDEBAR SECTION HEADING
   ══════════════════════════════════════════════ */
function SidebarSection({ title, accent }: { title: string; accent: string }) {
  return (
    <div style={{ marginBottom: 12, marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 18, height: 2, background: "#ffffff", borderRadius: 1, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties} />
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#ffffff" }}>
          {title}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   RIGHT SECTION HEADING — horizontal underline style
   ══════════════════════════════════════════════ */
function RightSection({ title, accent, headingSize }: { title: string; accent: string; headingSize: number }) {
  return (
    <div style={{ marginBottom: 14, marginTop: 22, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: headingSize + 1, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: "#111827" }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SKILL DONUT METER (using CSS border trick)
   ══════════════════════════════════════════════ */
function SkillDots({ level, accent }: { level: number; accent: string }) {
  const total = 5;
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: i < level ? accent : "rgba(255,255,255,0.15)",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN TEMPLATE
   ══════════════════════════════════════════════ */
export function AlchemyTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  const primary = theme.primary ?? "#0D1B2A";
  const accent = theme.accent ?? "#00B4D8";
  const headingSize = theme.headingSize ?? 10;
  const bodySize = theme.bodySize ?? 11;

  const hasImage = hasText((data as any).profileImageUrl);
  const jobTitle = (data as any).jobTitle ?? "";

  const skillLevels = [5, 4, 5, 3, 4, 5, 4, 3, 5, 4];

  const contactIcons: Record<string, React.ReactNode> = {
    email: <MailIcon />, phone: <PhoneIcon />, location: <MapIcon />,
    linkedin: <GlobeIcon />, github: <GlobeIcon />, portfolio: <GlobeIcon />,
  };

  // Split custom: languages / interests → sidebar; rest → right
  const sidebarCustom = custom.filter(s => {
    const t = s.title.toLowerCase();
    const hasAnyDescription = s.entries.some(e => hasText(e.description));
    if (hasAnyDescription) return false;
    return t.includes("lang") || t.includes("interest") || t.includes("hobb") || t.includes("certif");
  });
  const rightCustom = custom.filter(s => !sidebarCustom.some(sc => sc.id === s.id));

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
        width: 240,
        flexShrink: 0,
        background: primary,
        display: "flex",
        flexDirection: "column" as const,
        boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}>

        {/* Header block inside sidebar */}
        <div style={{
          background: accent,
          padding: "32px 22px 24px",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        } as React.CSSProperties}>
          {/* Profile photo */}
          {hasImage ? (
            <div style={{
              width: 80, height: 80,
              borderRadius: "50%",
              overflow: "hidden",
              margin: "0 auto 16px",
              border: "3px solid rgba(255,255,255,0.5)",
              backgroundImage: `url(${(data as any).profileImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            } as React.CSSProperties} />
          ) : (
            <div style={{
              width: 72, height: 72,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              border: "2px solid rgba(255,255,255,0.4)",
              margin: "0 auto 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "#ffffff",
            }}>
              {data.fullName ? data.fullName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : ""}
            </div>
          )}
          <h1 style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            textAlign: "center",
            lineHeight: 1.2,
            wordBreak: "break-word" as const,
          }}>
            {data.fullName || "Your Name"}
          </h1>
          {hasText(jobTitle) && (
            <div style={{
              fontSize: 10,
              fontWeight: 500,
              color: "rgba(255,255,255,0.85)",
              marginTop: 5,
              textAlign: "center",
              letterSpacing: "0.04em",
            }}>
              {jobTitle}
            </div>
          )}
        </div>

        {/* Sidebar content */}
        <div style={{ padding: "8px 22px 28px", flex: 1 }}>

          {/* CONTACT */}
          {contacts.length > 0 && (
            <div>
              <SidebarSection title="Contact" accent={accent} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {contacts.map(item => (
                  <div key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                    <span style={{ color: accent, marginTop: 1, flexShrink: 0 }}>
                      {contactIcons[item.key] || <GlobeIcon />}
                    </span>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9.5, color: "rgba(255,255,255,0.75)", textDecoration: "none", wordBreak: "break-all" as const, lineHeight: 1.4 }}>
                        {item.label}
                      </a>
                    ) : (
                      <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.4, wordBreak: "break-word" as const }}>
                        {item.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDUCATION in sidebar (placed right under Contact) */}
          {education.length > 0 && (
            <div>
              <SidebarSection title="Education" accent={accent} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map(e => {
                  const titleParts = (e.title ?? "").split(" · ");
                  const college = titleParts.slice(1).join(" · ") || titleParts[0] || "";
                  const degree = titleParts.length > 1 ? titleParts[0] : "";
                  let year = "";
                  if (e.meta?.includes("||SPLIT||")) {
                    year = e.meta.split("||SPLIT||")[0].trim();
                  } else if (e.meta) {
                    year = e.meta.split(/\s*[–|]\s*/)[0]?.trim() ?? "";
                  }
                  return (
                    <div key={e.id}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.3 }}>{degree}</div>
                      <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{college}</div>
                      {hasText(year) && <div style={{ fontSize: 9, color: accent, marginTop: 2 }}>{year}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SKILLS with dot meters */}
          {skills.length > 0 && (
            <div>
              <SidebarSection title="Skills" accent={accent} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {skills.map((skill, idx) => (
                  <div key={skill} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", wordBreak: "break-word" as const, flex: 1 }}>{skill}</span>
                    <SkillDots level={skillLevels[idx % skillLevels.length]} accent={accent} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar custom sections (e.g. Certifications) with Link display */}
          {sidebarCustom.map(s => (
            <div key={s.id}>
              <SidebarSection title={s.title} accent={accent} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {s.entries.map(e => (
                  <div key={e.id}>
                    <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 4, lineHeight: 1.35 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.90)" }}>{e.title}</span>
                      {hasText(e.meta) && <span style={{ fontSize: 9.5, color: accent, marginLeft: 5 }}>— {e.meta}</span>}
                      {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                        <>
                          <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.5)" }}>:</span>
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
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ RIGHT CONTENT AREA ══════════ */}
      <div style={{
        flex: 1,
        background: "#ffffff",
        padding: "32px 32px 32px 36px",
        minWidth: 0,
        boxSizing: "border-box",
      } as React.CSSProperties}>

        {/* SUMMARY */}
        {hasText(data.summary) && (
          <section style={{ marginTop: 0 }}>
            <RightSection title="Profile" accent={accent} headingSize={headingSize} />
            <p style={{ fontSize: bodySize, lineHeight: 1.7, color: "#374151", margin: 0, wordBreak: "break-word" as const }}>
              {data.summary}
            </p>
          </section>
        )}

        {/* EXPERIENCE */}
        {experience.length > 0 && (
          <section>
            <RightSection title="Experience" accent={accent} headingSize={headingSize} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {experience.map((e, idx) => {
                const parts = (e.title ?? "").split(" · ");
                const role = parts[0] ?? "";
                const company = parts.slice(1).join(" — ");
                return (
                  <div key={e.id} style={{ paddingLeft: 16, borderLeft: `3px solid ${idx === 0 ? accent : "#e5e7eb"}`, position: "relative" }}>
                    {/* Accent dot on border */}
                    <div style={{
                      position: "absolute", left: -5, top: 5,
                      width: 7, height: 7, borderRadius: "50%",
                      background: idx === 0 ? accent : "#d1d5db",
                      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                    } as React.CSSProperties} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 1, fontWeight: 700, color: "#111827" }}>{role}</span>
                      {hasText(e.meta) && (
                        <span style={{ fontSize: bodySize - 1, color: "#6b7280", fontStyle: "italic", whiteSpace: "nowrap" as const }}>{e.meta}</span>
                      )}
                    </div>
                    {hasText(company) && (
                      <div style={{ fontSize: bodySize - 0.5, color: accent, fontWeight: 600, marginTop: 1 }}>{company}</div>
                    )}
                    {hasText(e.description) && (
                      <BulletList text={e.description!} accent={accent} bodySize={bodySize} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* PROJECTS */}
        {projects.length > 0 && (
          <section>
            <RightSection title="Projects" accent={accent} headingSize={headingSize} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {projects.map(e => {
                const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                return (
                  <div key={e.id} style={{
                    background: "#f8fafc",
                    borderRadius: 6,
                    padding: "10px 14px",
                    borderTop: `3px solid ${accent}`,
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  } as React.CSSProperties}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#111827" }}>
                        {e.title}
                      </span>
                      {hasLink && (
                        <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          fontSize: bodySize - 1, color: accent, textDecoration: "none", fontWeight: 600,
                        }}>
                          <LinkIcon /> {e.linkLabel}
                        </a>
                      )}
                    </div>
                    {hasText(e.meta) && (
                      <div style={{ fontSize: bodySize - 1.5, color: "#6b7280", fontStyle: "italic", marginTop: 2 }}>{e.meta}</div>
                    )}
                    {hasText(e.description) && (
                      <div style={{ marginTop: 6 }}>
                        {e.description!.split("\n").map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim()).filter(Boolean).map((line, i) => (
                          <div key={i} style={{ fontSize: bodySize - 0.5, color: "#374151", lineHeight: 1.55, marginBottom: 2 }}>• {line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* RIGHT CUSTOM SECTIONS */}
        {rightCustom.map(s => (
          <section key={s.id}>
            <RightSection title={s.title} accent={accent} headingSize={headingSize} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {s.entries.map(e => {
                const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                return (
                  <div key={e.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#111827" }}>
                        {e.title}
                        {hasLink && (
                          <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            fontSize: bodySize - 1.5, color: accent, textDecoration: "none", fontWeight: 500, marginLeft: 8,
                          }}>
                            <LinkIcon /> {e.linkLabel}
                          </a>
                        )}
                      </span>
                      {hasText(e.meta) && (
                        <span style={{ fontSize: bodySize - 1, color: "#6b7280", fontStyle: "italic", whiteSpace: "nowrap" as const }}>{e.meta}</span>
                      )}
                    </div>
                    {hasText(e.description) && (
                      <BulletList text={e.description!} accent={accent} bodySize={bodySize} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
