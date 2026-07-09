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
const ProfileIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const SkillsIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5.5 5.5 0 0 0 7 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" /><path d="M10 22h4" />
  </svg>
);

const InterestsIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const ExperienceIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const EducationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const ProjectIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const CertificationsIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const LanguagesIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
  </svg>
);

const CustomIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const LinkIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", flexShrink: 0 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* ══════════════════════════════════════════════
   BULLET NORMALIZER
   ══════════════════════════════════════════════ */
function normalizeBullets(text: string): string[] {
  const joined = text.replace(/\n(?=[a-z])/g, " ").trim();
  return joined
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);
}

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
          color: "#374151",
          lineHeight: 1.6,
          marginBottom: 3,
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
   SIDEBAR SECTION HEADING
   ══════════════════════════════════════════════ */
function SidebarHeading({ title, icon, accent }: { title: string; icon: React.ReactNode; accent: string }) {
  return (
    <div style={{ marginBottom: 12, marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: accent,
          color: "#1a1a2e", // Dark icon symbol
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.10em",
          textTransform: "uppercase" as const,
          color: accent,
        }}>
          {title}
        </div>
      </div>
      <div style={{ height: 1.5, background: accent, width: "100%" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   RIGHT SECTION HEADING
   ══════════════════════════════════════════════ */
function RightHeading({
  title,
  icon,
  primary,
  headingSize,
}: {
  title: string;
  icon: React.ReactNode;
  primary: string;
  headingSize: number;
}) {
  return (
    <div style={{ marginBottom: 14, marginTop: 22, display: "flex", alignItems: "center", gap: 10 }}>
      {/* Accent color circular background with white symbol */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: primary,
        color: "#ffffff",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      {/* Title */}
      <span style={{
        fontSize: headingSize + 1.5,
        fontWeight: 700,
        letterSpacing: "0.03em",
        color: "#000000",
        flexShrink: 0,
      }}>
        {title}
      </span>
      {/* Divider line */}
      <div style={{ flex: 1, height: 1, background: "#e2e8f0", marginLeft: 4 }} />
    </div>
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
export function PlasmaTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  // theme.primary is the user-customized accent color (yellow/gold preset, or Navy, Forest etc.)
  const primary = theme.primary ?? "#FFB800";
  const headingSize = theme.headingSize ?? 10;
  const bodySize = theme.bodySize ?? 11;

  const hasImage = hasText((data as any).profileImageUrl);
  const jobTitle = (data as any).jobTitle ?? "";

  // Left sidebar is hardcoded dark (NOT theme color)
  const sidebarBg = "rgb(174 147 72 / 78%)";
  const sidebarText = "#ffffff";
  const sidebarMuted = "rgba(255,255,255,0.7)";

  // Split custom sections:
  // 1. "coding" sections go to the right
  // 2. Any section with a description/summary goes to the right
  // 3. Languages, Certifications, and Interests (with no description) go to the sidebar
  const sidebarCustom = custom.filter(s => {
    const t = s.title.toLowerCase();
    if (t.includes("coding") || t.includes("profile")) return false;
    const hasAnyDescription = s.entries.some(e => hasText(e.description));
    if (hasAnyDescription) return false;
    return t.includes("certif") || t.includes("lang") || t.includes("interest") || t.includes("hobb");
  });
  const rightCustom = custom.filter(s => !sidebarCustom.some(sc => sc.id === s.id));

  // Skill progress fill levels
  const fillLevels = [80, 70, 90, 65, 85, 75, 60, 95];

  // Map custom icons to section titles
  const getSidebarIcon = (title: string): React.ReactNode => {
    const t = title.toLowerCase();
    if (t.includes("certif")) return <CertificationsIcon />;
    if (t.includes("lang")) return <LanguagesIcon />;
    if (t.includes("interest") || t.includes("hobb")) return <InterestsIcon />;
    return <CustomIcon />;
  };

  const getRightIcon = (title: string): React.ReactNode => {
    const t = title.toLowerCase();
    if (t.includes("certif")) return <CertificationsIcon />;
    if (t.includes("lang")) return <LanguagesIcon />;
    return <CustomIcon />;
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

      {/* ══════════ LEFT SIDEBAR (30%) ══════════ */}
      <div style={{
        width: "30%",
        flexShrink: 0,
        background: sidebarBg,
        display: "flex",
        flexDirection: "column" as const,
        padding: "32px 20px 24px",
        boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}>

        {/* Profile Image with Accent Border */}
        {hasImage && (
          <div style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            overflow: "hidden",
            margin: "0 auto 20px",
            border: `3px solid ${primary}`,
            flexShrink: 0,
            backgroundImage: `url(${(data as any).profileImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          } as React.CSSProperties} />
        )}

        {/* Name in Accent Color */}
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: primary,
          margin: 0,
          textAlign: "center",
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
          wordBreak: "break-word" as const,
        }}>
          {data.fullName || "Your Name"}
        </h1>

        {/* Job Title */}
        {hasText(jobTitle) && (
          <div style={{
            fontSize: 12,
            fontWeight: 400,
            color: "#cbd5e1",
            marginTop: 5,
            textAlign: "center",
            lineHeight: 1.3,
            letterSpacing: "0.02em",
          }}>
            {jobTitle}
          </div>
        )}

        {/* Contact info */}
        {contacts.length > 0 && (
          <div>
            <SidebarHeading title="Contact" icon={<PhoneIcon />} accent={primary} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {contacts.map(item => {
                let labelText = "Contact";
                if (item.key === "email") labelText = "Email";
                else if (item.key === "phone") labelText = "Phone";
                else if (item.key === "location") labelText = "Location";
                else if (item.key === "linkedin") labelText = "LinkedIn";
                else if (item.key === "github") labelText = "GitHub";
                else if (item.key === "portfolio") labelText = "Website";

                return (
                  <div key={item.key} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      color: primary,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.05em",
                    }}>
                      {labelText}
                    </span>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" style={{
                        fontSize: 10,
                        color: sidebarText,
                        textDecoration: "none",
                        lineHeight: 1.4,
                        wordBreak: "break-all" as const,
                      }}>
                        {item.label}
                      </a>
                    ) : (
                      <span style={{
                        fontSize: 10,
                        color: sidebarText,
                        lineHeight: 1.4,
                        wordBreak: "break-word" as const,
                      }}>
                        {item.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills with Progress Bars */}
        {skills.length > 0 && (
          <div>
            <SidebarHeading title="Skills" icon={<SkillsIcon />} accent={primary} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {skills.map((skill, idx) => {
                const fillPercent = fillLevels[idx % fillLevels.length];
                return (
                  <div key={skill} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 500,
                      color: sidebarText,
                      wordBreak: "break-word" as const,
                      flex: 1,
                    }}>
                      {skill}
                    </span>
                    <div style={{
                      width: 70,
                      height: 5,
                      borderRadius: 2.5,
                      background: "rgba(255,255,255,0.15)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}>
                      <div style={{
                        width: `${fillPercent}%`,
                        height: "100%",
                        background: primary,
                        borderRadius: 2.5,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sidebar custom sections (Certifications, Languages, Interests) */}
        {sidebarCustom.map(s => {
          const titleLower = s.title.toLowerCase();
          const isLang = titleLower.includes("lang");
          const isCert = titleLower.includes("certif");

          return (
            <div key={s.id}>
              <SidebarHeading title={s.title} icon={getSidebarIcon(s.title)} accent={primary} />

              {/* Language listing */}
              {isLang && (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  {s.entries.map(e => (
                    <div key={e.id} style={{ fontSize: 10.5, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600, color: sidebarText }}>{e.title}</span>
                      {hasText(e.meta) && (
                        <span style={{ color: sidebarMuted }}> — {e.meta}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications listing */}
              {isCert && (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  {s.entries.map(e => (
                    <div key={e.id} style={{ fontSize: 10.5, lineHeight: 1.35 }}>
                      <span style={{ fontWeight: 600, color: sidebarText }}>{e.title}</span>
                      {hasText(e.meta) && (
                        <span style={{ color: sidebarMuted }}> ({e.meta})</span>
                      )}
                      {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                        <>
                          <span style={{ color: sidebarMuted, margin: "0 4px" }}>•</span>
                          <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            fontSize: 9.5,
                            color: primary,
                            textDecoration: "none",
                          }}>
                            <LinkIcon /> {e.linkLabel}
                          </a>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Other/Interests list */}
              {!isLang && !isCert && (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  {s.entries.map(e => (
                    <div key={e.id} style={{ fontSize: 10.5, color: sidebarText, lineHeight: 1.4 }}>
                      {e.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* ══════════ RIGHT CONTENT AREA (70%) ══════════ */}
      <div style={{
        flex: 1,
        background: "#ffffff",
        padding: "10px 32px 32px 28px",
        minWidth: 0,
        boxSizing: "border-box",
      } as React.CSSProperties}>

        {/* Profile Summary */}
        {hasText(data.summary) && (
          <section style={{ marginTop: 0 }}>
            <RightHeading title="Profile" icon={<ProfileIcon />} primary={primary} headingSize={headingSize} />
            <p style={{
              fontSize: bodySize,
              lineHeight: 1.65,
              color: "#374151",
              margin: "8px 0 0",
              wordBreak: "break-word" as const,
            }}>
              {data.summary}
            </p>
          </section>
        )}

        {/* Experience with Timeline */}
        {experience.length > 0 && (
          <section>
            <RightHeading title="Experience" icon={<ExperienceIcon />} primary={primary} headingSize={headingSize} />

            {/* Timeline wrapper */}
            <div style={{
              borderLeft: "1.5px solid #e2e8f0",
              marginLeft: 11,
              paddingLeft: 22,
              position: "relative",
            }}>
              {experience.map((e, idx) => {
                const parts = (e.title ?? "").split(" · ");
                const role = parts[0] ?? "";
                const company = parts.slice(1).join(" — ");

                return (
                  <div key={e.id} style={{
                    marginBottom: idx < experience.length - 1 ? 18 : 0,
                    position: "relative",
                  }}>
                    {/* Timeline bullet dot */}
                    <div style={{
                      position: "absolute" as const,
                      left: -27.5, // Center it exactly on the 1.5px borderLeft line
                      top: 4,
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: primary,
                      zIndex: 2,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    } as React.CSSProperties} />

                    {/* Role / Job Title */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 1, fontWeight: 700, color: "#111827" }}>
                        {role}
                      </span>
                      {hasText(e.meta) && (
                        <span style={{
                          fontSize: bodySize - 1,
                          color: "#6b7280",
                          whiteSpace: "nowrap" as const,
                          fontStyle: "italic" as const,
                        }}>
                          {e.meta}
                        </span>
                      )}
                    </div>

                    {/* Company info */}
                    {hasText(company) && (
                      <div style={{ fontSize: bodySize - 0.5, fontWeight: 500, color: "#4b5563", marginTop: 2 }}>
                        {company}
                      </div>
                    )}

                    {/* Bullet descriptions */}
                    {hasText(e.description) && (
                      <BulletList text={e.description!} accent={primary} bodySize={bodySize} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <RightHeading title="Education" icon={<EducationIcon />} primary={primary} headingSize={headingSize} />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#111827" }}>
                        {degree}
                      </span>
                      {hasText(year) && (
                        <span style={{ fontSize: bodySize - 1, color: "#6b7280", whiteSpace: "nowrap" as const, fontStyle: "italic" as const }}>
                          {year}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize - 0.5, color: "#4b5563", fontWeight: 500 }}>
                        {college}
                      </span>
                      {hasText(cgpa) && (
                        <span style={{ fontSize: bodySize - 1, color: "#6b7280", fontStyle: "italic" as const }}>
                          {cgpa}
                        </span>
                      )}
                    </div>
                    {hasText(e.description) && (
                      <p style={{ fontSize: bodySize - 0.5, color: "#4b5563", marginTop: 4, margin: "4px 0 0", lineHeight: 1.5 }}>
                        {e.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section>
            <RightHeading title="Projects" icon={<ProjectIcon />} primary={primary} headingSize={headingSize} />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {projects.map(e => {
                const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                return (
                  <div key={e.id}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#111827" }}>
                        {e.title}
                      </span>
                      {hasLink && (
                        <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          fontSize: bodySize - 1,
                          color: primary,
                          textDecoration: "none",
                          fontWeight: 500,
                        }}>
                          <LinkIcon /> {e.linkLabel}
                        </a>
                      )}
                    </div>
                    {hasText(e.meta) && (
                      <div style={{ fontSize: bodySize - 1.5, color: "#6b7280", fontStyle: "italic" as const, marginTop: 1 }}>
                        {e.meta}
                      </div>
                    )}
                    {hasText(e.description) && (
                      <BulletList text={e.description!} accent={primary} bodySize={bodySize} />
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
            <RightHeading title={s.title} icon={getRightIcon(s.title)} primary={primary} headingSize={headingSize} />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              {s.entries.map(e => {
                const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                return (
                  <div key={e.id}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#111827" }}>
                        {e.title}
                      </span>
                      {hasLink && (
                        <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          fontSize: bodySize - 1,
                          color: primary,
                          textDecoration: "none",
                          fontWeight: 500,
                        }}>
                          <LinkIcon /> {e.linkLabel}
                        </a>
                      )}
                    </div>
                    {hasText(e.meta) && (
                      <div style={{ fontSize: bodySize - 1.5, color: "#6b7280", fontStyle: "italic" as const, marginTop: 1 }}>
                        {e.meta}
                      </div>
                    )}
                    {hasText(e.description) && (
                      <BulletList text={e.description!} accent={primary} bodySize={bodySize} />
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
