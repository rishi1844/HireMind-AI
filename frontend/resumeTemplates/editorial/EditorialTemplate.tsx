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
   INLINE SVG LINK ICON
   ══════════════════════════════════════════════ */
const LinkIcon = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", flexShrink: 0 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* ══════════════════════════════════════════════
   DASH BULLET LIST
   ══════════════════════════════════════════════ */
function DashBulletList({ text, bodySize, color }: { text: string; bodySize: number; color: string }) {
  const lines = text
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);

  if (!lines.length) return null;

  return (
    <ul style={{ margin: "4px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 6,
          fontSize: bodySize,
          color: color,
          lineHeight: 1.5,
          marginBottom: 3,
          wordBreak: "break-word" as const,
        }}>
          <span style={{ flexShrink: 0, color: color }}>-</span>
          <span style={{ flex: 1 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════════════
   SECTION HEADING
   ══════════════════════════════════════════════ */
function SectionHeading({ title, primary, headingSize, color, borderColor }: { title: string; primary: string; headingSize: number; color: string; borderColor: string }) {
  return (
    <div style={{ marginBottom: 12, marginTop: 18 }}>
      <div style={{
        fontSize: headingSize - 0.5,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        color: color,
        display: "inline-block",
        paddingBottom: 2,
        borderBottom: `2.5px solid ${primary}`, // Accent color bottom border under text
      }}>
        {title}
      </div>
      <div style={{ height: 1, background: borderColor, marginTop: 1 }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   SIDEBAR CUSTOM PARTITIONING
   ══════════════════════════════════════════════ */
const SIDEBAR_SECTION_KEYS = [
  "certif", "lang", "interest", "hobb",
];

function isSidebarSection(title: string) {
  const t = title.toLowerCase();
  return SIDEBAR_SECTION_KEYS.some(k => t.includes(k));
}

/* ══════════════════════════════════════════════
   MAIN EDITORIAL TEMPLATE
   ══════════════════════════════════════════════ */
export function EditorialTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  // Theme integration & defaults
  const primary = theme.primary ?? "#FFB800"; // Accent color: underlines, skill tag borders
  const headingSize = theme.headingSize ?? 10;
  const bodySize = theme.bodySize ?? 11;

  // Editorial palette
  const pageBg = "#F5F1EA";             // Warm cream background
  const leftColBg = "#EDE8DC";          // Light beige/cream left column background
  const borderCol = "#C8B99A";          // Divider/borders color
  const darkText = "#1A1A1A";           // Name & section title text
  const bodyText = "#2D2D2D";           // Descriptions & summaries text
  const metaText = "#7A7060";           // Dates & small subtitles
  const tagBg = "#E8E0D0";              // Skill tags background

  // Custom sections partition
  const sidebarCustom = custom.filter(s => {
    const t = s.title.toLowerCase();
    const hasAnyDescription = s.entries.some(e => hasText(e.description));
    if (hasAnyDescription) return false;
    return isSidebarSection(s.title);
  });
  const rightCustom = custom.filter(s => !sidebarCustom.some(sc => sc.id === s.id));

  return (
    <div style={{
      fontFamily: theme.font ?? "Georgia, 'Times New Roman', serif",
      display: "flex",
      width: "100%",
      minHeight: 1123,
      background: pageBg,
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
      boxSizing: "border-box",
    } as React.CSSProperties}>

      {/* ══════════ LEFT COLUMN (~35% width / ~270px) ══════════ */}
      <div style={{
        width: 270,
        flexShrink: 0,
        background: leftColBg,
        borderRight: `1px solid ${borderCol}`,
        display: "flex",
        flexDirection: "column" as const,
        padding: "24px 20px",
        boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}>


        {/* SKILLS */}
        {skills.length > 0 && (
          <div>
            <SectionHeading title="Skills" primary={primary} headingSize={headingSize} color={darkText} borderColor={borderCol} />
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 4 }}>
              {skills.map(skill => (
                <span key={skill} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 8px",
                  background: tagBg,
                  border: `1.2px solid ${primary}`, // Accent color border
                  borderRadius: 4,
                  fontSize: Math.max(bodySize - 2.5, 8.5),
                  fontWeight: 600,
                  color: bodyText,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap" as const,
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                } as React.CSSProperties}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* EDUCATION */}
        {education.length > 0 && (
          <div>
            <SectionHeading title="Education" primary={primary} headingSize={headingSize} color={darkText} borderColor={borderCol} />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
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
                  <div key={e.id}>
                    <div style={{ fontSize: bodySize, fontWeight: 700, color: darkText, lineHeight: 1.3 }}>
                      {degree}
                    </div>
                    <div style={{ fontSize: bodySize - 0.5, fontWeight: 500, color: bodyText, marginTop: 2 }}>
                      {college}
                    </div>
                    {hasText(year) && (
                      <div style={{ fontSize: bodySize - 1.5, color: metaText, marginTop: 1 }}>
                        {year}
                      </div>
                    )}
                    {hasText(cgpa) && (
                      <div style={{ fontSize: bodySize - 1.5, color: metaText, fontStyle: "italic", marginTop: 1 }}>
                        {cgpa}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SIDEBAR CUSTOM SECTIONS (Certifications, Languages, Coursework) */}
        {sidebarCustom.map(s => {
          const titleLower = s.title.toLowerCase();
          const isLang = titleLower.includes("lang");
          const isCert = titleLower.includes("certif") || titleLower.includes("course");

          return (
            <div key={s.id}>
              <SectionHeading title={s.title} primary={primary} headingSize={headingSize} color={darkText} borderColor={borderCol} />

              {/* Coursework & Certifications */}
              {isCert && (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  {s.entries.map(e => (
                    <div key={e.id} style={{ fontSize: bodySize - 0.5, lineHeight: 1.35 }}>
                      <span style={{ fontWeight: 700, color: darkText }}>{e.title}</span>
                      {hasText(e.meta) && (
                        <span style={{ color: metaText }}> ({e.meta})</span>
                      )}
                      {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                        <>
                          <span style={{ color: darkText, margin: "0 4px" }}>:</span>
                          <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            fontSize: bodySize - 2,
                            color: primary,
                            textDecoration: "none",
                            fontWeight: 600,
                          }}>
                            <LinkIcon /> {e.linkLabel}
                          </a>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Languages */}
              {isLang && (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  {s.entries.map(e => (
                    <div key={e.id} style={{ fontSize: bodySize - 0.5, lineHeight: 1.4, color: bodyText }}>
                      <span style={{ fontWeight: 700, color: darkText }}>{e.title}</span>
                      {hasText(e.meta) && <span> — {e.meta}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* General Interest lists */}
              {!isCert && !isLang && (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  {s.entries.map(e => (
                    <div key={e.id} style={{ fontSize: bodySize - 0.5, color: bodyText, lineHeight: 1.4 }}>
                      {e.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* ══════════ RIGHT COLUMN (65% width) ══════════ */}
      <div style={{
        flex: 1,
        padding: "28px 24px 24px 28px",
        minWidth: 0,
        boxSizing: "border-box",
      } as React.CSSProperties}>

        {/* Header: Name */}
        <h1 style={{
          fontFamily: theme.font ?? "Georgia, 'Times New Roman', serif",
          fontSize: 32,
          fontWeight: 800,
          color: darkText,
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          wordBreak: "break-word" as const,
        }}>
          {data.fullName || "Your Name"}
        </h1>

        {/* Contact info list */}
        {contacts.length > 0 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap" as const,
            alignItems: "center",
            gap: "2px 0",
            marginTop: 6,
          }}>
            {contacts.map((item, i) => (
              <React.Fragment key={item.key}>
                {i > 0 && (
                  <span style={{ color: borderCol, padding: "0 6px", fontSize: 10 }}>·</span>
                )}
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 10,
                    color: metaText,
                    textDecoration: "none",
                  }}>
                    {item.label}
                  </a>
                ) : (
                  <span style={{ fontSize: 10, color: metaText }}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Horizontal rule after contact info */}
        <div style={{ height: 1, background: borderCol, width: "100%", marginTop: 8, marginBottom: 14 }} />

        {/* PROFILE / SUMMARY */}
        {hasText(data.summary) && (
          <section>
            <SectionHeading title="Profile" primary={primary} headingSize={headingSize} color={darkText} borderColor={borderCol} />
            <p style={{
              fontSize: bodySize,
              lineHeight: 1.65,
              color: bodyText,
              textAlign: "justify" as const,
              margin: "6px 0 0",
              wordBreak: "break-word" as const,
            }}>
              {data.summary}
            </p>
          </section>
        )}

        {/* EXPERIENCE */}
        {experience.length > 0 && (
          <section>
            <SectionHeading title="Experience" primary={primary} headingSize={headingSize} color={darkText} borderColor={borderCol} />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
              {experience.map(e => {
                const parts = (e.title ?? "").split(" · ");
                const role = parts[0] ?? "";
                const company = parts.slice(1).join(" — ");

                return (
                  <div key={e.id}>
                    {/* Role + Company Title */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: darkText }}>
                        {role} {hasText(company) && <span style={{ fontWeight: 500, color: bodyText }}> — {company}</span>}
                      </span>
                      {hasText(e.meta) && (
                        <span style={{ fontSize: bodySize - 1.5, color: metaText, fontStyle: "italic", whiteSpace: "nowrap" as const }}>
                          {e.meta}
                        </span>
                      )}
                    </div>

                    {/* Bullet descriptions */}
                    {hasText(e.description) && (
                      <DashBulletList text={e.description!} bodySize={bodySize} color={bodyText} />
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
            <SectionHeading title="Projects" primary={primary} headingSize={headingSize} color={darkText} borderColor={borderCol} />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {projects.map(e => {
                const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                return (
                  <div key={e.id}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: darkText }}>
                        {e.title}
                      </span>
                      {hasLink && (
                        <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          fontSize: bodySize - 1.5,
                          color: primary,
                          textDecoration: "none",
                          fontWeight: 500,
                        }}>
                          <LinkIcon /> {e.linkLabel}
                        </a>
                      )}
                    </div>
                    {hasText(e.meta) && (
                      <div style={{ fontSize: bodySize - 1.5, color: metaText, fontStyle: "italic", marginTop: 1 }}>
                        Stack: {e.meta}
                      </div>
                    )}
                    {hasText(e.description) && (
                      <DashBulletList text={e.description!} bodySize={bodySize} color={bodyText} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Right column custom sections */}
        {rightCustom.map(s => (
          <section key={s.id}>
            <SectionHeading title={s.title} primary={primary} headingSize={headingSize} color={darkText} borderColor={borderCol} />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              {s.entries.map(e => {
                const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                return (
                  <div key={e.id}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: darkText }}>
                        {e.title}
                      </span>
                      {hasLink && (
                        <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          fontSize: bodySize - 1.5,
                          color: primary,
                          textDecoration: "none",
                          fontWeight: 500,
                        }}>
                          <LinkIcon /> {e.linkLabel}
                        </a>
                      )}
                    </div>
                    {hasText(e.meta) && (
                      <div style={{ fontSize: bodySize - 1.5, color: metaText, fontStyle: "italic" as const, marginTop: 1 }}>
                        {e.meta}
                      </div>
                    )}
                    {hasText(e.description) && (
                      <DashBulletList text={e.description!} bodySize={bodySize} color={bodyText} />
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
