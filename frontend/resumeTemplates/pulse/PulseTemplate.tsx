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

/* ─── Design Tokens ─── */
const FONTS = {
  name: "'Georgia', 'Times New Roman', serif",
  body: "'Inter', 'Arial', system-ui, sans-serif",
};

/* ─── Inline SVG Icons ─── */
function MailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block" }}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block" }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.29 6.29l.9-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block" }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block" }}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block" }}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block" }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "inline-block" }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/* ─── Section Heading Component ─── */
function PulseSectionHeading({ title, theme }: { title: string; theme: any }) {
  const primary = theme.primary ?? "#1e3a8a";
  const headingSize = theme.headingSize ?? 10.5;

  return (
    <div style={{ marginBottom: 6, marginTop: 12 }}>
      <div style={{
        fontSize: headingSize,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        color: primary,
        paddingBottom: 3,
        borderBottom: `1.5px solid ${primary}`,
      }}>
        {title}
      </div>
    </div>
  );
}

/* ─── Description Block Component ─── */
function PulseDescriptionBlock({ text, theme }: { text: string; theme: any }) {
  const bodySize = theme.bodySize ?? 11;
  const accent = theme.accent ?? theme.primary ?? "#1e3a8a";

  // Join lines where \n is followed by lowercase (word-wrap artifact)
  const normalized = text.replace(/\n(?=[a-z])/g, " ").trim();

  // Split on newlines only
  const lines = normalized
    .split("\n")
    .map(l => l.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <ul style={{ marginTop: 4, paddingLeft: 0, listStyle: "none", marginBottom: 0 }}>
      {lines.map((line, i) => (
        <li
          key={i}
          style={{
            fontSize: bodySize,
            lineHeight: 1.6,
            color: "#374151",
            marginBottom: 3,
            paddingLeft: 16,
            position: "relative" as const,
            wordBreak: "break-word" as const,
          }}
        >
          <span style={{
            position: "absolute" as const,
            left: 0,
            color: accent,
          }}>•</span>
          {line}
        </li>
      ))}
    </ul>
  );
}

/* ─── Entry Block Component ─── */
function EntryBlock({
  entry,
  theme,
  primary,
  secondary,
  bodySize,
  isProject = false,
}: {
  entry: NormalizedEntry;
  theme: any;
  primary: string;
  secondary: string;
  bodySize: number;
  isProject?: boolean;
}) {
  const hasLink = hasText(entry.linkUrl) && hasText(entry.linkLabel);

  // Parse "Role · Company" → split on " · "
  const titleParts = (entry.title ?? "").split(" · ");
  const roleText = titleParts[0] ?? "";
  const companyText = titleParts.slice(1).join(" — ");

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Line 1: Title & Date */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        flexWrap: "wrap" as const,
        gap: "2px 8px",
      }}>
        {/* Left: Role — Company + Link + Tech Stack */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          flexWrap: "wrap" as const,
          flex: 1,
          minWidth: 0,
        }}>
          <span style={{ fontSize: 12.5, lineHeight: 1.3, wordBreak: "break-word" as const }}>
            <span style={{ fontWeight: 600, color: "#0f172a" }}>{roleText}</span>
            {hasText(companyText) && (
              <>
                <span style={{ color: "#94a3b8", fontWeight: 400, margin: "0 4px" }}>—</span>
                <span style={{ fontWeight: 600, color: primary }}>{companyText}</span>
              </>
            )}
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
                  color: theme.accent ?? primary,
                  marginLeft: 6,
                  textDecoration: "none",
                }}
              >
                <ExternalLinkIcon /> {entry.linkLabel}
              </a>
            )}
            {isProject && hasText(entry.meta) && (
              <span style={{ fontSize: 10.5, color: "#6b7280", fontStyle: "normal" as const, marginLeft: 4 }}>
                | {entry.meta}
              </span>
            )}
          </span>
        </div>

        {/* Right: Date (if not a project) */}
        {!isProject && hasText(entry.meta) && (
          <span style={{
            fontSize: 11,
            color: secondary,
            whiteSpace: "nowrap" as const,
            flexShrink: 0,
          }}>
            {entry.meta}
          </span>
        )}
        {isProject && hasText((entry as any).year) && (
          <span style={{
            fontSize: 11,
            color: secondary,
            whiteSpace: "nowrap" as const,
            flexShrink: 0,
          }}>
            {(entry as any).year}
          </span>
        )}
      </div>

      {/* Line 2: Optional Subtitle & Location */}
      {(hasText((entry as any).meta2) || hasText((entry as any).meta2Right) || hasText((entry as any).location)) && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 1,
        }}>
          <span style={{ fontSize: 11, fontStyle: "italic" as const, color: "#374151" }}>
            {(entry as any).meta2 || (entry as any).subheading}
          </span>
          {(hasText((entry as any).meta2Right) || hasText((entry as any).location)) && (
            <span style={{ fontSize: 11, color: secondary }}>
              {(entry as any).meta2Right || (entry as any).location}
            </span>
          )}
        </div>
      )}

      {/* Description Bullets */}
      {hasText(entry.description) && (
        <PulseDescriptionBlock text={entry.description!} theme={theme} />
      )}
    </div>
  );
}

/* ─── Skill Categorizer Helper ─── */
function categorizeSkills(skills: string[]) {
  const categories: Record<string, string[]> = {
    Languages: [],
    Frontend: [],
    Backend: [],
    Database: [],
    Tools: [],
    Skills: [],
  };

  const mapping = [
    {
      category: "Frontend",
      keywords: [
        "html", "css", "react", "reactjs", "react js", "react native", "react-native",
        "next.js", "nextjs", "next js", "vue", "vuejs", "vue js",
        "angular", "angularjs", "angular js", "svelte", "sveltejs",
        "tailwind", "bootstrap", "sass", "jquery", "redux",
      ],
    },
    {
      category: "Backend",
      keywords: [
        "node", "nodejs", "node js", "express", "expressjs", "express js",
        "django", "flask", "fastapi", "nest", "nestjs",
        "spring", "spring boot", "springboot", "spring mvc", "spring security", "spring data jpa",
        "laravel", "asp.net", "asp net", "asp.netcore", "rest api", "rest apis", "jwt",
      ],
    },
    {
      category: "Database",
      keywords: [
        "mysql", "postgresql", "postgres", "mongodb", "mongo db",
        "firebase", "sqlite", "oracle", "redis", "sql", "dynamodb",
      ],
    },
    {
      category: "Tools",
      keywords: [
        "git", "github", "gitlab", "postman", "vs code", "vscode",
        "docker", "kubernetes", "aws", "azure", "gcp", "jira", "npm",
      ],
    },
    {
      category: "Languages",
      keywords: [
        "c", "c++", "cpp", "java", "javascript", "js", "javascript(es6+)",
        "typescript", "python", "php", "ruby", "rust", "go", "golang", "c#", "swift", "kotlin",
      ],
    },
  ];

  skills.forEach(skill => {
    const normalized = skill.toLowerCase().trim();

    if (skill.includes(":")) {
      const [cat, val] = skill.split(":").map(s => s.trim());
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(val);
      return;
    }

    let matched = false;
    for (const group of mapping) {
      if (group.keywords.some(keyword => normalized === keyword)) {
        categories[group.category].push(skill);
        matched = true;
        break;
      }
    }

    if (!matched) categories.Skills.push(skill);
  });

  return Object.entries(categories)
    .filter(([_, vals]) => vals.length)
    .map(([category, values]) => ({ category, values: values.join(", ") }));
}

/* ─── Main Template ─── */
export function PulseTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const custom = getCustomSections(data);
  const skills = normalizeSkills(data.skills);

  const primary = theme.primary ?? "#1e3a8a";
  const secondary = theme.secondary ?? "#6b7280";
  const bodySize = theme.bodySize ?? 11;

  const hasImage = hasText((data as any).profileImageUrl);

  return (
    <div style={{
      fontFamily: theme.font ?? FONTS.body,
      background: "#ffffff",
      width: "100%",
      paddingLeft: 36,
      paddingRight: 36,
      paddingTop: 32,
      paddingBottom: 28,
    }}>
      {/* ── HEADER ── */}
      <header style={{ marginBottom: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 0,
        }}>
          {/* Avatar — only if image uploaded */}
          {hasImage && (
            <div style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              flexShrink: 0,
              backgroundImage: `url(${(data as any).profileImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              border: `2px solid ${theme.primary ?? "#1e3a8a"}30`,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            } as React.CSSProperties} />
          )}

          {/* Name + contacts */}
          <div style={{
            flex: 1,
            textAlign: hasImage ? "left" : "center",
          }}>
            <h1 style={{
              fontFamily: FONTS.name,
              fontSize: 28,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.01em",
              margin: 0,
              lineHeight: 1.1,
              wordBreak: "break-word" as const,
            }}>
              {data.fullName || "Your Name"}
            </h1>

            {contacts.length > 0 && (
              <div style={{
                display: "flex",
                flexWrap: "wrap" as const,
                justifyContent: hasImage ? "flex-start" : "center",
                alignItems: "center",
                gap: "3px 0",
                marginTop: 8,
              }}>
                {contacts.map((item, i) => (
                  <React.Fragment key={item.key}>
                    {i > 0 && <span style={{ padding: "0 8px", color: "#d1d5db" }}>|</span>}
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
                          color: "#374151",
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
                          color: theme.accent ?? primary,
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
                        color: "#374151",
                      }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 12,
                          height: 12,
                          flexShrink: 0,
                          color: theme.accent ?? primary,
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
          </div>
        </div>

        {/* <div style={{
          width: "100%",
          borderTop: `1.5px solid ${primary}`,
          marginTop: 10,
        }} /> */}
      </header>

      {/* ── PROFESSIONAL SUMMARY ── */}
      {hasText(data.summary) && (
        <section>
          <PulseSectionHeading title="Professional Summary" theme={theme} />
          <p style={{
            fontSize: bodySize,
            color: "#374151",
            lineHeight: 1.6,
            margin: 0,
          }}>
            {data.summary}
          </p>
        </section>
      )}

      {/* ── EDUCATION ── */}
      {education.length > 0 && (
        <section>
          <PulseSectionHeading title="Education" theme={theme} />
          {education.map(e => {
            const titleParts = e.title?.split(" · ") ?? [];
            const college = titleParts.slice(1).join(" · ") || titleParts[0];
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
              <div key={e.id} style={{ marginBottom: 8 }}>
                {/* Row 1: College + Year */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 600, fontSize: 12.5, color: "#0f172a" }}>{college}</span>
                  <span style={{ fontSize: 11, color: secondary, whiteSpace: "nowrap" as const }}>{year}</span>
                </div>
                {/* Row 2: Degree + CGPA */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 1 }}>
                  <span style={{ fontSize: 11, fontStyle: "italic" as const, color: "#374151" }}>{degree}</span>
                  {hasText(cgpa) && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", fontStyle: "italic" as const }}>
                      CGPA: {cgpa}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── SKILLS ── */}
      {skills.length > 0 && (
        <section>
          <PulseSectionHeading title="Technical Skills" theme={theme} />
          <div style={{ marginTop: 6 }}>
            {categorizeSkills(skills).map((group, idx) => (
              <div key={idx} style={{ marginBottom: 2, fontSize: bodySize, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{group.category}:</span>
                <span style={{ color: "#374151", marginLeft: 4 }}>{group.values}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXPERIENCE ── */}
      {experience.length > 0 && (
        <section>
          <PulseSectionHeading title="Experience" theme={theme} />
          {experience.map(e => (
            <EntryBlock key={e.id} entry={e} theme={theme} primary={primary} secondary={secondary} bodySize={bodySize} />
          ))}
        </section>
      )}

      {/* ── PROJECTS ── */}
      {projects.length > 0 && (
        <section>
          <PulseSectionHeading title="Projects" theme={theme} />
          {projects.map(e => (
            <EntryBlock key={e.id} entry={e} theme={theme} primary={primary} secondary={secondary} bodySize={bodySize} isProject={true} />
          ))}
        </section>
      )}

      {/* ── CUSTOM SECTIONS ── */}
      {custom.map(s => {
        const titleLower = s.title.toLowerCase();
        const isCert = titleLower === "certifications" || titleLower === "certification";
        // Match any coding-related section title (handles typos like "Plateform")
        const isProfile = titleLower.startsWith("coding");
        const isLang = titleLower === "languages";

        return (
          <section key={s.id}>
            <PulseSectionHeading title={s.title} theme={theme} />

            {isCert && (
              <ul style={{ marginTop: 6, paddingLeft: 0, listStyle: "none", marginBottom: 0 }}>
                {s.entries.map(e => (
                  <li key={e.id} style={{
                    fontSize: bodySize,
                    lineHeight: 1.6,
                    color: "#374151",
                    marginBottom: 3,
                    paddingLeft: 16,
                    position: "relative" as const,
                  }}>
                    <span style={{ position: "absolute" as const, left: 0, color: theme.accent ?? primary }}>•</span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{e.title}</span>
                    {hasText(e.linkUrl) && hasText(e.linkLabel) && (
                      <a
                        href={e.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                          fontSize: 10.5,
                          color: theme.accent ?? primary,
                          marginLeft: 6,
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLinkIcon /> {e.linkLabel}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {isProfile && (
              <div style={{ marginTop: 6 }}>
                {s.entries.map(e => (
                  <div key={e.id} style={{
                    fontSize: bodySize,
                    lineHeight: 1.55,
                    color: "#374151",
                    marginBottom: 3,
                    paddingLeft: 14,
                    position: "relative" as const,
                  }}>
                    <span style={{
                      position: "absolute" as const,
                      left: 0,
                      top: 0,
                      color: theme.accent ?? primary,
                      fontWeight: 700,
                    }}>•</span>

                    {/* Platform name bold */}
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{e.title}</span>

                    {/* Link inline */}
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
                          color: theme.accent ?? primary,
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

                    {/* Colon + description inline — strip leading bullet chars */}
                    {hasText(e.description) && (
                      <span style={{ color: "#374151" }}>: {e.description!.replace(/^[\s\u2022\u2013\u2014\u2212\u00b7\-\*·•]+/, "").trim()}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isLang && (() => {
              const n = s.entries.length;
              // Each item gets equal flex:1 slot.
              // 2 items → both left-align → land at 0% and 50% (start + mid)
              // 3+ items → first left, middle center, last right (start + mid + end)
              const getAlign = (i: number): "left" | "center" | "right" => {
                if (i === 0) return "left";
                if (n === 2) return "left";   // second item left inside its 50% slot = mid
                if (i === n - 1) return "right";
                return "center";
              };
              return (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 6,
                  fontSize: bodySize,
                }}>
                  {s.entries.map((e, i) => (
                    <div key={e.id} style={{ flex: 1, textAlign: getAlign(i) }}>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{e.title}</span>
                      {hasText(e.meta) && (
                        <span style={{ color: "#374151" }}> – {e.meta}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {!isCert && !isProfile && !isLang && (
              s.entries.map(e => (
                <EntryBlock key={e.id} entry={e} theme={theme} primary={primary} secondary={secondary} bodySize={bodySize} />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
