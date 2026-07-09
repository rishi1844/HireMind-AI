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

function getResolvedProfileUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  const backendOrigin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${backendOrigin.replace(/\/+$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

/* ══════════════════════════════════════════════
   INLINE SVG ICONS — sharp, high-dpi PDF safe
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

// Section icons (white inside small colored squares)
const ProfileIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const EducationIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const ProjectsIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const ExperienceIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const HackathonsIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ══════════════════════════════════════════════
   BULLET LIST UTILITY
   ══════════════════════════════════════════════ */
function BulletList({ text, bodySize, color }: { text: string; bodySize: number; color: string }) {
  const lines = text
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);

  if (!lines.length) return null;

  return (
    <ul style={{ margin: "2px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 6,
          fontSize: bodySize,
          color: color,
          lineHeight: 1.4,
          marginBottom: 2,
          wordBreak: "break-word" as const,
        }}>
          <span style={{ flexShrink: 0, color: color, fontSize: 10 }}>•</span>
          <span style={{ flex: 1, color: color }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════════════
   RIGHT SIDE TIMELINE BULLET LIST (SQUARE DOTS)
   ══════════════════════════════════════════════ */
function TimelineBulletList({ text, bodySize, color, primary }: { text: string; bodySize: number; color: string; primary: string }) {
  const lines = text
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);

  if (!lines.length) return null;

  return (
    <ul style={{ margin: "2px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 7,
          fontSize: bodySize,
          color: color,
          lineHeight: 1.4,
          marginBottom: 2,
          wordBreak: "break-word" as const,
        }}>
          {/* Small filled square bullets */}
          <span style={{
            display: "inline-block",
            width: 5,
            height: 5,
            background: primary,
            flexShrink: 0,
            marginTop: 5,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }} />
          <span style={{ flex: 1, color: color }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ══════════════════════════════════════════════
   SIDEBAR SECTION TITLE
   ══════════════════════════════════════════════ */
function SidebarHeading({ title, primary, headingSize }: { title: string; primary: string; headingSize: number }) {
  return (
    <div style={{ marginBottom: 8, marginTop: 12 }}>
      <div style={{
        fontSize: headingSize - 0.5,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: "#1f2937",
        paddingBottom: 2,
        borderBottom: `2.5px solid ${primary}`, // Full width colored bottom border
      }}>
        {title}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   RIGHT COLUMN SECTION HEADER (TIMELINE ACCENT)
   ══════════════════════════════════════════════ */
function RightSectionHeader({ title, icon, primary, headingSize }: { title: string; icon: React.ReactNode; primary: string; headingSize: number }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
      marginTop: 12,
      position: "relative",
    }}>
      {/* Centered on the timeline vertical line */}
      <div style={{
        position: "absolute",
        left: -31.5,
        top: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        background: primary,
        color: "#ffffff",
        borderRadius: 2,
        flexShrink: 0,
        zIndex: 3,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      } as React.CSSProperties}>
        {icon}
      </div>

      <span style={{
        fontSize: headingSize + 1,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase" as const,
        color: "#111827",
        flexShrink: 0,
        marginLeft: 1,
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: `${primary}25` }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN TEMPLATE
   ══════════════════════════════════════════════ */
export function AcademiaTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);

  // Theme support: default primary color is maroon #6B1D3E
  const primary = theme.primary ?? "#6B1D3E";
  const headingSize = theme.headingSize ?? 10;
  const bodySize = theme.bodySize ?? 11;

  const hasImage = hasText((data as any).profileImageUrl);
  const resolvedProfileUrl = getResolvedProfileUrl((data as any).profileImageUrl);
  const jobTitle = (data as any).jobTitle ?? "";
  const initials = data.fullName
    ? data.fullName
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "";

  // Contact icon mapper
  const contactIcons: Record<string, React.ReactNode> = {
    email: <MailIcon />,
    phone: <PhoneIcon />,
    location: <MapIcon />,
    linkedin: <GlobeIcon />,
    github: <GlobeIcon />,
    portfolio: <GlobeIcon />,
  };

  // Skill categorization parser
  const softSkillKeywords = [
    "teamwork", "leadership", "communication", "time", "critical", "creativity",
    "collaboration", "adaptability", "problem", "organizat", "active", "interpersonal",
    "empathy", "negotiat", "conflict", "work ethic", "project management"
  ];
  const flatSkills = normalizeSkills(data.skills);
  const softSkills = flatSkills.filter(s =>
    softSkillKeywords.some(kw => s.toLowerCase().includes(kw))
  );
  const techSkills = flatSkills.filter(s => !softSkills.includes(s));

  // Determine levels dynamically for tech skills to match layout specifications
  const getTechSkillDisplay = (skill: string, index: number) => {
    if (skill.includes("(")) return skill;
    const levels = ["Expert", "Advanced", "Intermediate", "Advanced", "Expert"];
    const lvl = levels[index % levels.length];
    return `${skill} (${lvl})`;
  };

  // Custom sections mapping: languages + short lists go to sidebar; others go to right content area
  const sidebarCustom = custom.filter(s => {
    const t = s.title.toLowerCase();
    const hasAnyDescription = s.entries.some(e => hasText(e.description));
    if (hasAnyDescription) return false;
    return t.includes("lang") || t.includes("certif") || t.includes("interest") || t.includes("hobb");
  });
  const rightCustom = custom.filter(s => !sidebarCustom.some(sc => sc.id === s.id));

  return (
    <div style={{
      fontFamily: theme.font ?? "'Inter', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      width: "100%",
      minHeight: 1123,
      background: "#F8F8F8", // Overall page warm gray-white
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
      boxSizing: "border-box",
    } as React.CSSProperties}>

      {/* ══════════ HEADER AREA (160px) ══════════ */}
      <header style={{
        display: "flex",
        height: 120,
        width: "100%",
        boxSizing: "border-box",
        borderBottom: "1px solid #e5e7eb",
        flexShrink: 0,
      }}>
        {/* Left header background: light gray */}
        <div style={{
          width: 255,
          flexShrink: 0,
          background: "#EBEBEB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        } as React.CSSProperties}>
          {/* Circular profile photo */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: `2px solid ${primary}`,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            backgroundImage: hasImage ? `url(${resolvedProfileUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            flexShrink: 0,
            boxSizing: "border-box",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          } as React.CSSProperties}>
            {!hasImage && (
              <span style={{ fontSize: 22, fontWeight: 700, color: "#64748b" }}>{initials}</span>
            )}
          </div>
        </div>

        {/* Right header background: Maroon (or theme primary) */}
        <div style={{
          flex: 1,
          background: primary,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 30,
          paddingRight: 20,
          boxSizing: "border-box",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        } as React.CSSProperties}>
          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            lineHeight: 1.15,
            wordBreak: "break-word" as const,
          }}>
            {data.fullName || "Your Name"}
          </h1>
          {hasText(jobTitle) && (
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255,255,255,0.85)",
              marginTop: 6,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}>
              {jobTitle}
            </div>
          )}
        </div>
      </header>

      {/* ══════════ COLUMNS CONTAINER ══════════ */}
      <div style={{ display: "flex", flex: 1, width: "100%" }}>

        {/* ── LEFT SIDEBAR (255px) ── */}
        <div style={{
          width: 255,
          flexShrink: 0,
          background: "#F2F2F2", // Sidebar light background
          padding: "14px 14px 14px",
          boxSizing: "border-box",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        } as React.CSSProperties}>

          {/* CONTACT */}
          {contacts.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <SidebarHeading title="Contact" primary={primary} headingSize={headingSize} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {contacts.map(item => (
                  <div key={item.key} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{
                      marginTop: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: primary,
                      flexShrink: 0,
                    }}>
                      {contactIcons[item.key] || <GlobeIcon />}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#4b5563", textTransform: "uppercase" }}>
                        {item.key}
                      </span>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: 10,
                          color: "#1f2937",
                          textDecoration: "none",
                          wordBreak: "break-all" as const,
                          fontWeight: 500,
                          marginTop: 1,
                        }}>
                          {item.label}
                        </a>
                      ) : (
                        <span style={{
                          fontSize: 10,
                          color: "#1f2937",
                          wordBreak: "break-word" as const,
                          fontWeight: 500,
                          marginTop: 1,
                        }}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDUCATION */}
          {education.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <SidebarHeading title="Education" primary={primary} headingSize={headingSize} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 2 }}>
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
                    <div key={e.id} style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: bodySize - 0.5, fontWeight: 700, color: "#1f2937", lineHeight: 1.3 }}>
                        {degree}
                      </span>
                      <span style={{ fontSize: bodySize - 1, color: "#4b5563", fontWeight: 500, marginTop: 2 }}>
                        {college}
                      </span>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
                        {hasText(year) && (
                          <span style={{ fontSize: bodySize - 1.5, color: "#6b7280" }}>
                            {year}
                          </span>
                        )}
                        {hasText(cgpa) && (
                          <span style={{ fontSize: bodySize - 1.5, color: "#1f2937", fontStyle: "italic", fontWeight: 600 }}>
                            GPA: {cgpa}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SOFT SKILLS */}
          {softSkills.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <SidebarHeading title="Soft Skills" primary={primary} headingSize={headingSize} />
              <div style={{ paddingLeft: 2 }}>
                <BulletList text={softSkills.join("\n")} bodySize={bodySize - 0.5} color="#1f2937" />
              </div>
            </div>
          )}

          {/* TECH SKILLS */}
          {techSkills.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <SidebarHeading title="Tech Skills" primary={primary} headingSize={headingSize} />
              <div style={{ paddingLeft: 2 }}>
                <BulletList
                  text={techSkills.map((s, idx) => getTechSkillDisplay(s, idx)).join("\n")}
                  bodySize={bodySize - 0.5}
                  color="#1f2937"
                />
              </div>
            </div>
          )}

          {/* SIDEBAR CUSTOM SECTIONS (Languages, Certifications) */}
          {sidebarCustom.map(s => {
            const titleLower = s.title.toLowerCase();
            const isLang = titleLower.includes("lang");

            return (
              <div key={s.id} style={{ marginBottom: 12 }}>
                <SidebarHeading title={s.title} primary={primary} headingSize={headingSize} />
                <div style={{ paddingLeft: 2 }}>
                  {isLang ? (
                    <BulletList
                      text={s.entries.map(e => e.meta ? `${e.title} (${e.meta})` : e.title).join("\n")}
                      bodySize={bodySize - 0.5}
                      color="#1f2937"
                    />
                  ) : (
                    <ul style={{ margin: "5px 0 0", padding: 0, listStyle: "none" }}>
                      {s.entries.map((e, idx) => {
                        const hasLink = hasText(e.linkUrl);
                        return (
                          <li key={idx} style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 6,
                            fontSize: bodySize - 0.5,
                            color: "#1f2937",
                            lineHeight: 1.55,
                            marginBottom: 4,
                            wordBreak: "break-word" as const,
                          }}>
                            <span style={{ flexShrink: 0, color: "#1f2937", fontSize: 10, marginTop: 1 }}>•</span>
                            <span style={{ flex: 1 }}>
                              <span style={{ fontWeight: 500 }}>{e.title}</span>
                              {hasText(e.meta) && <span style={{ color: "#4b5563", fontSize: bodySize - 1.5 }}> ({e.meta})</span>}
                              {hasLink && (
                                <>
                                  {" : "}
                                  <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                                    color: primary,
                                    textDecoration: "underline",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}>
                                    {e.linkLabel || "Link"}
                                    <LinkIcon />
                                  </a>
                                </>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}

        </div>

        {/* ── RIGHT CONTENT AREA ── */}
        <div style={{
          flex: 1,
          background: "#ffffff", // Pure white content bg
          padding: "16px 20px 16px 28px",
          minWidth: 0,
          position: "relative",
          boxSizing: "border-box",
        } as React.CSSProperties}>

          {/* Vertical Timeline line running behind section square headers */}
          <div style={{
            position: "absolute",
            left: 13, // Centered relative to right column start padding
            top: 20,
            bottom: 20,
            width: 1.5,
            background: `${primary}25`, // light color accent track
            zIndex: 1,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          } as React.CSSProperties} />

          {/* PROFILE SUMMARY */}
          {hasText(data.summary) && (
            <section style={{ position: "relative", marginBottom: 12 }}>
              <RightSectionHeader title="Profile" icon={<ProfileIcon />} primary={primary} headingSize={headingSize} />
              <p style={{
                fontSize: bodySize,
                lineHeight: 1.4,
                color: "#374151",
                textAlign: "justify" as const,
                margin: "2px 0 0",
                wordBreak: "break-word" as const,
              }}>
                {data.summary}
              </p>
            </section>
          )}



          {/* EXPERIENCE */}
          {experience.length > 0 && (
            <section style={{ position: "relative", marginBottom: 12 }}>
              <RightSectionHeader title="Experience" icon={<ExperienceIcon />} primary={primary} headingSize={headingSize} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                {experience.map(e => {
                  const parts = (e.title ?? "").split(" · ");
                  const role = parts[0] ?? "";
                  const company = parts.slice(1).join(" — ");

                  return (
                    <div key={e.id} style={{ position: "relative" }}>
                      {/* Timeline square bullet */}
                      <div style={{
                        position: "absolute",
                        left: -17.5,
                        top: 5,
                        width: 5,
                        height: 5,
                        background: primary,
                        zIndex: 2,
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      } as React.CSSProperties} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                        <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#111827" }}>
                          {role} {hasText(company) && <span style={{ fontWeight: 500, color: "#4b5563" }}>— {company}</span>}
                        </span>
                        {hasText(e.meta) && (
                          <span style={{ fontSize: bodySize - 1, color: "#4b5563", whiteSpace: "nowrap" as const }}>
                            {e.meta}
                          </span>
                        )}
                      </div>
                      {hasText(e.description) && (
                        <TimelineBulletList text={e.description!} bodySize={bodySize} color="#374151" primary={primary} />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* PROJECTS */}
          {projects.length > 0 && (
            <section style={{ position: "relative", marginBottom: 12 }}>
              <RightSectionHeader title="Projects" icon={<ProjectsIcon />} primary={primary} headingSize={headingSize} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                {projects.map(e => {
                  const hasLink = hasText(e.linkUrl) && hasText(e.linkLabel);
                  return (
                    <div key={e.id} style={{ position: "relative" }}>
                      {/* Timeline square bullet */}
                      <div style={{
                        position: "absolute",
                        left: -17.5,
                        top: 5,
                        width: 5,
                        height: 5,
                        background: primary,
                        zIndex: 2,
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      } as React.CSSProperties} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                        <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#111827" }}>
                          {e.title}
                          {hasLink && (
                            <a href={e.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2,
                              fontSize: bodySize - 1.5,
                              color: primary,
                              textDecoration: "none",
                              fontWeight: 500,
                              marginLeft: 8,
                            }}>
                              <LinkIcon /> {e.linkLabel}
                            </a>
                          )}
                        </span>
                        {e.meta && hasText(e.meta) && !e.meta.includes(",") && (
                          <span style={{ fontSize: bodySize - 1, color: "#4b5563", whiteSpace: "nowrap" as const }}>
                            {e.meta}
                          </span>
                        )}
                      </div>
                      {hasText(e.description) && (
                        <p style={{ fontSize: bodySize - 0.5, color: "#374151", margin: "5px 0 0", lineHeight: 1.5 }}>
                          {e.description}
                        </p>
                      )}
                      {hasText(e.meta) && (
                        <div style={{ fontSize: bodySize - 0.5, marginTop: 4 }}>
                          <span style={{ fontWeight: 700, fontStyle: "italic", color: "#111827" }}>Technologies Used: </span>
                          <span style={{ fontStyle: "italic", color: "#4b5563" }}>{e.meta}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ACHIEVEMENTS & HACKATHONS (Right Column Custom Sections) */}
          {rightCustom.map(s => (
            <section key={s.id} style={{ position: "relative", marginBottom: 12 }}>
              <RightSectionHeader title={s.title} icon={<HackathonsIcon />} primary={primary} headingSize={headingSize} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
                {s.entries.map(e => (
                  <div key={e.id} style={{ position: "relative" }}>
                    {/* Timeline square bullet */}
                    <div style={{
                      position: "absolute",
                      left: -17.5,
                      top: 5,
                      width: 5,
                      height: 5,
                      background: primary,
                      zIndex: 2,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                      boxSizing: "border-box",
                    } as React.CSSProperties} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: bodySize + 0.5, fontWeight: 700, color: "#111827" }}>
                        {e.title}
                      </span>
                      {hasText(e.meta) && (
                        <span style={{ fontSize: bodySize - 1, color: "#4b5563", whiteSpace: "nowrap" as const }}>
                          {e.meta}
                        </span>
                      )}
                    </div>
                    {hasText(e.description) && (
                      <TimelineBulletList text={e.description!} bodySize={bodySize} color="#374151" primary={primary} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

        </div>

      </div>

    </div>
  );
}
