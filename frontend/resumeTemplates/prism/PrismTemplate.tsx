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
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MapIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
function BulletList({ text, primary, bodySize }: { text: string; primary: string; bodySize: number }) {
  const lines = text
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return (
    <ul style={{ margin: "4px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: bodySize, color: "#374151", lineHeight: 1.45, marginBottom: 2, wordBreak: "break-word" as const }}>
          <span style={{ display: "inline-block", width: 4, height: 4, background: primary, borderRadius: "50%", flexShrink: 0, marginTop: 7, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <span style={{ flex: 1 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════════════
   SECTION HEADING — left edge color band
   ══════════════════════════════════════════════ */
function SectionHeading({ title, primary, headingSize }: { title: string; primary: string; headingSize: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, marginTop: 14 }}>
      <div style={{
        width: 3,
        height: headingSize + 6,
        background: primary,
        flexShrink: 0,
        borderRadius: 1.5,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties} />
      <span style={{
        fontSize: headingSize + 0.5,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
        color: "#0f172a",
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN TEMPLATE
   ══════════════════════════════════════════════ */
export function PrismTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  const primary = theme.primary ?? "#0F4C81";
  const headingSize = theme.headingSize ?? 10;
  const bodySize = theme.bodySize ?? 11;
  const jobTitle = (data as any).jobTitle ?? "";
  const hasImage = hasText((data as any).profileImageUrl);

  const contactIcons: Record<string, React.ReactNode> = {
    email: <MailIcon />, phone: <PhoneIcon />, location: <MapIcon />,
    linkedin: <GlobeIcon />, github: <GlobeIcon />, portfolio: <GlobeIcon />,
  };

  return (
    <div style={{
      fontFamily: theme.font ?? "'Inter', system-ui, sans-serif",
      width: "100%",
      minHeight: 1123,
      background: "#ffffff",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
      boxSizing: "border-box",
    } as React.CSSProperties}>

      {/* ══════════ HEADER ══════════ */}
      <header style={{
        background: "#f8fafc",
        padding: "24px 40px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        borderLeft: `6px solid ${primary}`,
        borderBottom: "1px solid #e2e8f0",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}>
        {/* Profile photo */}
        {hasImage && (
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 6,
            border: `2px solid ${primary}`,
            overflow: "hidden",
            flexShrink: 0,
            backgroundImage: `url(${(data as any).profileImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          } as React.CSSProperties} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#0f172a",
            margin: 0,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            wordBreak: "break-word" as const,
          }}>
            {data.fullName || "Your Name"}
          </h1>
          {hasText(jobTitle) && (
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: primary,
              marginTop: 4,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              {jobTitle}
            </div>
          )}
          {/* Contact row inline */}
          {contacts.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px 16px", marginTop: 10 }}>
              {contacts.map(item => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 5, color: "#475569", fontSize: 10 }}>
                  <span style={{ color: primary, display: "inline-flex", alignItems: "center" }}>{contactIcons[item.key] || <GlobeIcon />}</span>
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "none", fontSize: 10, fontWeight: 500 }}>
                      {item.label}
                    </a>
                  ) : (
                    <span style={{ fontWeight: 500 }}>{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ══════════ BODY ══════════ */}
      <div style={{ padding: "7px 40px 20px", boxSizing: "border-box" } as React.CSSProperties}>

        {/* SUMMARY */}
        {hasText(data.summary) && (
          <section>
            <SectionHeading title="Summary" primary={primary} headingSize={headingSize} />
            <p style={{
              fontSize: bodySize,
              lineHeight: 1.6,
              color: "#374151",
              margin: 0,
              wordBreak: "break-word" as const,
              paddingLeft: 10,
            }}>
              {data.summary}
            </p>
          </section>
        )}

        {/* EXPERIENCE */}
        {experience.length > 0 && (
          <section>
            <SectionHeading title="Experience" primary={primary} headingSize={headingSize} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 10 }}>
              {experience.map(e => {
                const parts = (e.title ?? "").split(" · ");
                const role = parts[0] ?? "";
                const company = parts.slice(1).join(" — ");
                return (
                  <div key={e.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                      <div>
                        <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#0f172a" }}>{role}</span>
                        {hasText(company) && (
                          <span style={{ fontSize: bodySize - 0.5, fontWeight: 500, color: primary, marginLeft: 6 }}>
                            — @{company}
                          </span>
                        )}
                      </div>
                      {hasText(e.meta) && (
                        <span style={{
                          fontSize: bodySize - 1.5,
                          color: "#475569",
                          background: "#f1f5f9",
                          padding: "1px 8px",
                          borderRadius: 12,
                          whiteSpace: "nowrap" as const,
                          fontWeight: 500,
                        }}>
                          {e.meta}
                        </span>
                      )}
                    </div>
                    {hasText(e.description) && (
                      <BulletList text={e.description!} primary={primary} bodySize={bodySize} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* EDUCATION */}
        {education.length > 0 && (
          <section>
            <SectionHeading title="Education" primary={primary} headingSize={headingSize} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 10 }}>
              {education.map(e => {
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
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" as const }}>
                    <div>
                      <div style={{ fontSize: bodySize, fontWeight: 700, color: "#0f172a" }}>{degree}</div>
                      <div style={{ fontSize: bodySize - 1, color: "#475569", marginTop: 1 }}>{college}</div>
                      {hasText(cgpa) && <div style={{ fontSize: bodySize - 1.5, color: "#64748b", fontStyle: "italic", marginTop: 1 }}>GPA: {cgpa}</div>}
                    </div>
                    {hasText(year) && (
                      <span style={{
                        fontSize: bodySize - 1.5,
                        color: "#ffffff",
                        background: primary,
                        padding: "1.5px 8px",
                        borderRadius: 12,
                        whiteSpace: "nowrap" as const,
                        fontWeight: 600,
                        flexShrink: 0,
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      } as React.CSSProperties}>
                        {year}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SKILLS */}
        {skills.length > 0 && (
          <section>
            <SectionHeading title="Skills" primary={primary} headingSize={headingSize} />
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "5px 6px", paddingLeft: 10 }}>
              {skills.map((skill, i) => (
                <span key={i} style={{
                  fontSize: bodySize - 1,
                  color: i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? primary : "#334155",
                  background: i % 3 === 0 ? primary : i % 3 === 1 ? `${primary}12` : "#f1f5f9",
                  border: `1px solid ${i % 3 === 0 ? primary : i % 3 === 1 ? `${primary}30` : "#e2e8f0"}`,
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontWeight: i % 3 === 0 ? 600 : 500,
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                } as React.CSSProperties}>
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* PROJECTS */}
        {projects.length > 0 && (
          <section>
            <SectionHeading title="Projects" primary={primary} headingSize={headingSize} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 10 }}>
              {projects.map(e => {
                const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                return (
                  <div key={e.id} style={{ borderLeft: `2.5px solid ${primary}20`, paddingLeft: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#0f172a" }}>
                        {e.title}
                        {hasLink && (
                          <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            fontSize: bodySize - 1.5, color: primary, textDecoration: "none", fontWeight: 600, marginLeft: 8,
                          }}>
                            <LinkIcon /> {e.linkLabel}
                          </a>
                        )}
                        {hasText(e.meta) && (
                          <span style={{ fontSize: bodySize - 1.5, color: "#475569", fontStyle: "italic", fontWeight: 400, marginLeft: 8 }}>
                            | {e.meta}
                          </span>
                        )}
                      </span>
                      {hasText((e as any).year) && (
                        <span style={{
                          fontSize: bodySize - 1.5,
                          color: "#475569",
                          background: "#f1f5f9",
                          padding: "1px 8px",
                          borderRadius: 12,
                          whiteSpace: "nowrap" as const,
                          fontWeight: 500,
                        }}>
                          {(e as any).year}
                        </span>
                      )}
                    </div>
                    {hasText(e.description) && (
                      <BulletList text={e.description!} primary={primary} bodySize={bodySize} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CUSTOM SECTIONS */}
        {custom.map(s => {
          const titleLower = s.title.toLowerCase();
          const isCert = titleLower.includes("certif");
          const isLang = titleLower.includes("lang");
          const isCodingSection = titleLower.includes("coding") || titleLower.includes("profile") || titleLower.includes("platform") || titleLower.includes("competitive");
          const isGridSection = isCert || isLang;

          return (
            <section key={s.id}>
              <SectionHeading title={s.title} primary={primary} headingSize={headingSize} />
              <div style={isGridSection ? {
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px 24px",
                paddingLeft: 10,
              } : {
                display: "flex",
                flexDirection: "column",
                gap: isCodingSection ? 6 : 12,
                paddingLeft: 10,
              }}>
                {s.entries.map(e => {
                  const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);

                  if (isCodingSection) {
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: bodySize, lineHeight: 1.45, color: "#374151" }}>
                        <div style={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 4, fontWeight: 700, color: "#0f172a" }}>
                          <span>{e.title}</span>
                          {hasLink && (
                            <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              fontSize: bodySize - 1.5, color: primary, textDecoration: "none", fontWeight: 600,
                            }}>
                              <LinkIcon /> {e.linkLabel}
                            </a>
                          )}
                          {hasText(e.meta) && (
                            <span style={{ fontSize: bodySize - 1.5, color: "#475569", fontStyle: "italic", fontWeight: 500 }}>
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
                  }

                  if (isLang) {
                    return (
                      <div key={e.id} style={{ fontSize: bodySize, lineHeight: 1.4, color: "#374151" }}>
                        <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#0f172a" }}>
                          {e.title}
                        </span>
                        {hasText(e.meta) && (
                          <span style={{ fontSize: bodySize - 1, color: "#475569", fontWeight: 500, marginLeft: 6 }}>
                            — {e.meta}
                          </span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={e.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                        <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#0f172a" }}>
                          {e.title}
                          {hasLink && (
                            <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              fontSize: bodySize - 1.5, color: primary, textDecoration: "none", fontWeight: 600, marginLeft: 8,
                            }}>
                              <LinkIcon /> {e.linkLabel}
                            </a>
                          )}
                        </span>
                        {hasText(e.meta) && !isGridSection && (
                          <span style={{ fontSize: bodySize - 1.5, color: "#475569", fontStyle: "italic", whiteSpace: "nowrap" as const }}>{e.meta}</span>
                        )}
                      </div>
                      {isGridSection && hasText(e.meta) && (
                        <div style={{ fontSize: bodySize - 1.5, color: "#475569", fontStyle: "italic", marginTop: 1 }}>
                          {e.meta}
                        </div>
                      )}
                      {hasText(e.description) && (
                        <BulletList text={e.description!} primary={primary} bodySize={bodySize} />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
