"use client";

import React from "react";
import { ModernHeader } from "./ModernHeader";
import { ModernSkills } from "./ModernSkills";
import { ResumeSection } from "../shared/ResumeSection";
import { EntryBlock } from "../shared/EntryBlock";
import { pageBase } from "../shared/layout";
import { SPACING } from "../shared/spacing";
import {
  getContactItems,
  getExperienceEntries,
  getEducationEntries,
  getProjectEntries,
  getCustomSections,
  hasEntryContent,
  hasText,
} from "../shared/dataHelpers";
import type { TemplateProps } from "../shared/types";

export function ModernTemplate({ data, theme }: TemplateProps) {
  const contacts = getContactItems(data);
  const experience = getExperienceEntries(data).filter(hasEntryContent);
  const education = getEducationEntries(data).filter(hasEntryContent);
  const projects = getProjectEntries(data).filter(hasEntryContent);
  const customSections = getCustomSections(data);

  return (
    <div
      style={{
        ...pageBase,
        fontFamily: theme.font ?? "Inter, system-ui, sans-serif",
      }}
    >
      <ModernHeader data={data} theme={theme} contacts={contacts} />

      {/* Two-column body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.55fr 1fr",
        }}
      >
        {/* Left column — Experience + Projects */}
        <div
          style={{
            padding: `${SPACING.xl}px ${SPACING.lg}px ${SPACING.pagePaddingStd}px ${SPACING.pagePaddingRelaxed}px`,
          }}
        >
          {experience.length > 0 && (
            <ResumeSection
              title="Experience"
              headingVariant="bar"
              primaryColor={theme.primary}
              accentColor={theme.accent}
              marginBottom={SPACING.lg}
            >
              {experience.map((entry) => (
                <EntryBlock
                  key={entry.id}
                  entry={entry}
                  primaryColor={theme.primary}
                  secondaryColor={theme.secondary}
                />
              ))}
            </ResumeSection>
          )}

          {projects.length > 0 && (
            <ResumeSection
              title="Projects"
              headingVariant="bar"
              primaryColor={theme.primary}
              accentColor={theme.accent}
              marginBottom={SPACING.lg}
            >
              {projects.map((entry) => (
                <EntryBlock
                  key={entry.id}
                  entry={entry}
                  primaryColor={theme.primary}
                  secondaryColor={theme.secondary}
                />
              ))}
            </ResumeSection>
          )}
        </div>

        {/* Right column — tinted background + Skills + Education */}
        <div
          style={{
            padding: `${SPACING.xl}px ${SPACING.pagePaddingRelaxed}px ${SPACING.pagePaddingStd}px ${SPACING.lg}px`,
            backgroundColor: `${theme.primary}05`,
            borderLeft: `1px solid ${theme.primary}12`,
          }}
        >
          <ModernSkills skills={data.skills} theme={theme} />

          {education.length > 0 && (
            <ResumeSection
              title="Education"
              headingVariant="bar"
              primaryColor={theme.primary}
              accentColor={theme.accent}
              marginBottom={SPACING.lg}
            >
              {education.map((entry) => (
                <EntryBlock
                  key={entry.id}
                  entry={entry}
                  primaryColor={theme.primary}
                  secondaryColor={theme.secondary}
                />
              ))}
            </ResumeSection>
          )}

          {customSections.map((section) => (
            <ResumeSection
              key={section.id}
              title={section.title}
              headingVariant="bar"
              primaryColor={theme.primary}
              accentColor={theme.accent}
              marginBottom={SPACING.lg}
            >
              {section.entries.map((entry) => (
                <EntryBlock
                  key={entry.id}
                  entry={entry}
                  primaryColor={theme.primary}
                  secondaryColor={theme.secondary}
                />
              ))}
            </ResumeSection>
          ))}
        </div>
      </div>
    </div>
  );
}
