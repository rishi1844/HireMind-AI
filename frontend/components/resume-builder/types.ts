


export type TemplateId = "stark" | "axiom" | "pulse" | "timeline-v2" | "nova" | "executive" | "plasma" | "editorial" | "academia" | "prism" | "alchemy";

export type ResumeFont =
  | "sans-serif"
  | "'Inter', system-ui, sans-serif"
  | "'DM Sans', system-ui, sans-serif"
  | "'Outfit', system-ui, sans-serif"
  | "'Plus Jakarta Sans', system-ui, sans-serif"
  | "'Playfair Display', Georgia, serif"
  | "Georgia, 'Times New Roman', serif"
  | "'Times New Roman', Times, serif"
  | "'Courier New', Courier, monospace"
  | "Arial, Helvetica, sans-serif";

export interface ResumeTheme {
  primary: string;
  secondary: string;
  accent: string;
  font?: ResumeFont;
  /** Section heading font size (default: 10) */
  headingSize?: number;
  /** Body / description font size (default: 11) */
  bodySize?: number;
}

export const DEFAULT_THEME: ResumeTheme = {
  primary: "#1b4332",
  secondary: "#6B7280",
  accent: "#2d6a4f",
  font: "'DM Sans', system-ui, sans-serif",
  headingSize: 10,
  bodySize: 11,
};

export const PRESET_THEMES: Array<{ name: string; theme: ResumeTheme }> = [
  { name: "Forest", theme: { primary: "#1b4332", secondary: "#6B7280", accent: "#2d6a4f", headingSize: 10, bodySize: 11 } },
  { name: "Navy", theme: { primary: "#1E3A8A", secondary: "#6B7280", accent: "#2563EB", headingSize: 10, bodySize: 11 } },
  { name: "Rose Gold", theme: { primary: "#9F1239", secondary: "#78716C", accent: "#E11D48", headingSize: 10, bodySize: 11 } },
  { name: "Slate", theme: { primary: "#0F172A", secondary: "#64748B", accent: "#475569", headingSize: 10, bodySize: 11 } },
  { name: "Violet", theme: { primary: "#4C1D95", secondary: "#6B7280", accent: "#7C3AED", headingSize: 10, bodySize: 11 } },
  { name: "Amber", theme: { primary: "#78350F", secondary: "#6B7280", accent: "#D97706", headingSize: 10, bodySize: 11 } },
  { name: "Teal", theme: { primary: "#134E4A", secondary: "#6B7280", accent: "#0D9488", headingSize: 10, bodySize: 11 } },
  { name: "Crimson", theme: { primary: "#7F1D1D", secondary: "#78716C", accent: "#DC2626", headingSize: 10, bodySize: 11 } },
  { name: "Indigo", theme: { primary: "#312E81", secondary: "#6B7280", accent: "#6366F1", headingSize: 10, bodySize: 11 } },
  { name: "Charcoal", theme: { primary: "#111827", secondary: "#9CA3AF", accent: "#6B7280", headingSize: 10, bodySize: 11 } },
  { name: "Emerald", theme: { primary: "#064E3B", secondary: "#6B7280", accent: "#10B981", headingSize: 10, bodySize: 11 } },
  { name: "Sky", theme: { primary: "#0C4A6E", secondary: "#6B7280", accent: "#0EA5E9", headingSize: 10, bodySize: 11 } },
];

export interface EducationItem {
  id: string;
  degree: string;
  college: string;
  year: string;
  score: string;
  description: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  techStack: string;
  description: string;
  linkLabel: string;
  linkUrl: string;
}

export interface CustomSectionItem {
  id: string;
  heading: string;
  subheading: string;
  description: string;
  linkLabel: string;
  linkUrl: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  profileImageUrl: string;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: string[];
  customSections: CustomSection[];
}

export interface BuiltResume {
  id: number;
  title: string;
  templateId: TemplateId;
  resumeData: ResumeData;
  createdAt: string;
  updatedAt: string;
}

export interface BuiltResumeListItem {
  id: number;
  title: string;
  templateId: TemplateId;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderFormState {
  title: string;
  templateId: TemplateId;
  resumeData: ResumeData;
  theme: ResumeTheme;
}

export type BuilderStep =
  | "basics"
  | "summary"
  | "education"
  | "experience"
  | "projects"
  | "skills"
  | "custom";

export interface StepConfig {
  id: BuilderStep;
  label: string;
  badge: string;
  description: string;
}

export const BUILDER_STEPS: StepConfig[] = [
  { id: "basics", label: "Basics", badge: "01", description: "Name, contact, links, and photo" },
  { id: "summary", label: "Summary", badge: "02", description: "Professional snapshot" },
  { id: "education", label: "Education", badge: "03", description: "Academic background" },
  { id: "experience", label: "Experience", badge: "04", description: "Work history and impact" },
  { id: "projects", label: "Projects", badge: "05", description: "Key portfolio work" },
  { id: "skills", label: "Skills", badge: "06", description: "Core skills and tools" },
  { id: "custom", label: "Custom", badge: "07", description: "Certificates, awards, links, and more" },
];

export const TEMPLATE_OPTIONS: Array<{
  id: TemplateId;
  label: string;
  description: string;
  accent: string;
  category: string;
}> = [
    { id: "axiom", label: "Axiom", description: "ATS-friendly single-column layout", accent: "#1e3a8a", category: "ATS" },
    { id: "editorial", label: "Editorial", description: "Clean newspaper/editorial aesthetic with beige tone", accent: "#C8B99A", category: "Professional" },
    { id: "stark", label: "Stark", description: "Dark green header, two-column layout", accent: "#2d6a4f", category: "Professional" },
    { id: "pulse", label: "Pulse", description: "Classic single-column ATS resume with serif name", accent: "#1e3a8a", category: "ATS" },
    { id: "timeline-v2", label: "Timeline", description: "Timeline dots for experience, two-column layout", accent: "#059669", category: "Modern" },
    { id: "nova", label: "Nova", description: "Premium dark sidebar with clean right content", accent: "#3b82f6", category: "Modern" },
    { id: "executive", label: "Executive", description: "Corporate executive — main left, themed sidebar right", accent: "#2563eb", category: "Executive" },
    { id: "plasma", label: "Plasma", description: "Premium dark sidebar with customizable primary accent", accent: "#FFB800", category: "Modern" },
    { id: "academia", label: "Academia", description: "Structured academic style with maroon header and square bullets", accent: "#6B1D3E", category: "Executive" },
    { id: "prism", label: "Prism", description: "Bold dark banner header with chip-tag skills and single column layout", accent: "#0F4C81", category: "Modern" },
    { id: "alchemy", label: "Alchemy", description: "Deep sidebar with dot skill meters and card-style projects", accent: "#00B4D8", category: "Modern" },
  ];

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2, 10)}`;

export const mkEducation = (): EducationItem => ({
  id: createId(),
  degree: "",
  college: "",
  year: "",
  score: "",
  description: "",
});

export const mkExperience = (): ExperienceItem => ({
  id: createId(),
  company: "",
  role: "",
  duration: "",
  description: "",
});

export const mkProject = (): ProjectItem => ({
  id: createId(),
  title: "",
  techStack: "",
  description: "",
  linkLabel: "",
  linkUrl: "",
});

export const mkCustomSectionItem = (): CustomSectionItem => ({
  id: createId(),
  heading: "",
  subheading: "",
  description: "",
  linkLabel: "",
  linkUrl: "",
});

export const mkCustomSection = (): CustomSection => ({
  id: createId(),
  title: "",
  items: [mkCustomSectionItem()],
});

export const DEFAULT_FORM_STATE = (): BuilderFormState => ({
  title: "",
  templateId: "axiom",
  theme: { ...DEFAULT_THEME },
  resumeData: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    profileImageUrl: "",
    summary: "",
    education: [mkEducation()],
    experience: [mkExperience()],
    projects: [mkProject()],
    skills: [],
    customSections: [],
  },
});

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const toStringValue = (value: unknown): string => (typeof value === "string" ? value : "");

const hasText = (value: string) => value.trim().length > 0;

const hasCustomItemContent = (item: CustomSectionItem) =>
  [item.heading, item.subheading, item.description, item.linkLabel, item.linkUrl].some(hasText);

const normalizeList = <T>(
  items: unknown,
  fallbackFactory: () => T,
  mapItem: (item: unknown) => T,
  ensureAtLeastOne: boolean = true
): T[] => {
  const mapped = Array.isArray(items) ? items.map(mapItem) : [];
  if (mapped.length > 0) {
    return mapped;
  }

  return ensureAtLeastOne ? [fallbackFactory()] : [];
};

export function normalizeTheme(raw: unknown): ResumeTheme {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_THEME };
  const r = raw as Record<string, unknown>;
  return {
    primary: typeof r.primary === "string" ? r.primary : DEFAULT_THEME.primary,
    secondary: typeof r.secondary === "string" ? r.secondary : DEFAULT_THEME.secondary,
    accent: typeof r.accent === "string" ? r.accent : DEFAULT_THEME.accent,
    font: typeof r.font === "string" ? (r.font as ResumeFont) : DEFAULT_THEME.font,
    headingSize: typeof r.headingSize === "number" ? r.headingSize : DEFAULT_THEME.headingSize,
    bodySize: typeof r.bodySize === "number" ? r.bodySize : DEFAULT_THEME.bodySize,
  };
}

export function normalizeResumeData(data?: Partial<ResumeData> & { customSections?: unknown[]; _theme?: unknown }): ResumeData {
  const source = asRecord(data);

  return {
    fullName: toStringValue(source.fullName),
    email: toStringValue(source.email),
    phone: toStringValue(source.phone),
    location: toStringValue(source.location),
    linkedin: toStringValue(source.linkedin),
    github: toStringValue(source.github),
    portfolio: toStringValue(source.portfolio),
    profileImageUrl: toStringValue(source.profileImageUrl),
    summary: toStringValue(source.summary),
    education: normalizeList(source.education, mkEducation, (item) => {
      const record = asRecord(item);
      return {
        id: toStringValue(record.id) || createId(),
        degree: toStringValue(record.degree),
        college: toStringValue(record.college),
        year: toStringValue(record.year),
        score: toStringValue(record.score),
        description: toStringValue(record.description),
      };
    }),
    experience: normalizeList(source.experience, mkExperience, (item) => {
      const record = asRecord(item);
      return {
        id: toStringValue(record.id) || createId(),
        company: toStringValue(record.company),
        role: toStringValue(record.role),
        duration: toStringValue(record.duration),
        description: toStringValue(record.description),
      };
    }),
    projects: normalizeList(source.projects, mkProject, (item) => {
      const record = asRecord(item);
      return {
        id: toStringValue(record.id) || createId(),
        title: toStringValue(record.title),
        techStack: toStringValue(record.techStack),
        description: toStringValue(record.description),
        linkLabel: toStringValue(record.linkLabel),
        linkUrl: toStringValue(record.linkUrl),
      };
    }),
    skills: Array.isArray(source.skills)
      ? source.skills.map((skill) => toStringValue(skill).trim()).filter(Boolean)
      : [],
    customSections: normalizeList(
      source.customSections,
      mkCustomSection,
      (section) => {
        const record = asRecord(section);
        const legacyContent = toStringValue(record.content);
        const items = normalizeList(
          record.items ?? (legacyContent ? [{ description: legacyContent }] : []),
          mkCustomSectionItem,
          (item) => {
            const itemRecord = asRecord(item);
            return {
              id: toStringValue(itemRecord.id) || createId(),
              heading: toStringValue(itemRecord.heading),
              subheading: toStringValue(itemRecord.subheading),
              description: toStringValue(itemRecord.description),
              linkLabel: toStringValue(itemRecord.linkLabel),
              linkUrl: toStringValue(itemRecord.linkUrl),
            };
          }
        ).filter(hasCustomItemContent);

        return {
          id: toStringValue(record.id) || createId(),
          title: toStringValue(record.title),
          items: items.length > 0 ? items : [mkCustomSectionItem()],
        };
      },
      false
    ),
  };
}
