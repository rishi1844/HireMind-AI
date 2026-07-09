"use client";

/**
 * TemplateRenderer.tsx — Routes templateId → template component.
 *
 * This is the single entry point for rendering any resume template.
 * It handles scale transforms and the fixed A4 width container.
 */

import React from "react";
import { StarkTemplate } from "./stark/StarkTemplate";
import { AxiomTemplate } from "./axiom/AxiomTemplate";
import { PulseTemplate } from "./pulse/PulseTemplate";
import { PlasmaTemplate } from "./plasma/PlasmaTemplate";
import { EditorialTemplate } from "./editorial/EditorialTemplate";
import { AcademiaTemplate } from "./academia/AcademiaTemplate";
import type { ResumeData, ResumeTheme, TemplateId } from "@/components/resume-builder/types";

interface Props {
  data: ResumeData;
  theme: ResumeTheme;
  templateId: TemplateId;
  scale?: number;
}

export function TemplateRenderer({ data, theme, templateId, scale = 1 }: Props) {
  const style: React.CSSProperties = {
    width: 794,
    minHeight: 1123,
    transformOrigin: "top left",
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    background: "#ffffff",
  };

  return (
    <div style={style}>
      {templateId === "stark" && <StarkTemplate data={data} theme={theme} />}
      {templateId === "axiom" && <AxiomTemplate data={data} theme={theme} />}
      {templateId === "pulse" && <PulseTemplate data={data} theme={theme} />}
      {templateId === "plasma" && <PlasmaTemplate data={data} theme={theme} />}
      {templateId === "editorial" && <EditorialTemplate data={data} theme={theme} />}
      {templateId === "academia" && <AcademiaTemplate data={data} theme={theme} />}
    </div>
  );
}
