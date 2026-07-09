"use client";

/**
 * ResumePreview.tsx — Routes to TemplateRenderer with animated template switch.
 *
 * - AnimatePresence + motion.div for smooth fade+scale on template change
 * - id="resume-preview" on the outer div for @media print CSS targeting
 * - Only renders "stark" and "axiom" — all other old templates removed
 */

import { motion, AnimatePresence } from "framer-motion";
import { TemplateRenderer } from "@/resumeTemplates/TemplateRenderer";
import { PulseTemplate } from "@/resumeTemplates/pulse/PulseTemplate";
import { TimelineTemplate } from "@/resumeTemplates/timeline/TimelineTemplate";
import { SidebarTemplate } from "@/resumeTemplates/sidebar/SidebarTemplate";
import { ExecutiveTemplate } from "@/resumeTemplates/executive/ExecutiveTemplate";
import { PlasmaTemplate } from "@/resumeTemplates/plasma/PlasmaTemplate";
import { EditorialTemplate } from "@/resumeTemplates/editorial/EditorialTemplate";
import { AcademiaTemplate } from "@/resumeTemplates/academia/AcademiaTemplate";
import { PrismTemplate } from "@/resumeTemplates/prism/PrismTemplate";
import { AlchemyTemplate } from "@/resumeTemplates/alchemy/AlchemyTemplate";
import type { ResumeData, ResumeTheme, TemplateId } from "./types";

interface Props {
  data: ResumeData;
  templateId: TemplateId;
  theme: ResumeTheme;
  scale?: number;
  id?: string;
  /** Set to false to skip the animation (e.g., hidden PDF capture container) */
  animate?: boolean;
}

export function ResumePreview({ data, templateId, theme, scale = 1, id, animate = true }: Props) {
  /** A4 page width at 96 DPI = 794px. Height auto to allow multi-page. */
  const wrapStyle: React.CSSProperties = {
    width: 794,
    height: scale !== 1 ? 1123 * scale : "auto",
    minHeight: scale !== 1 ? 1123 * scale : 1123,
    overflow: "hidden",
    position: "relative",
    transformOrigin: "top left",
  };

  if (templateId === "pulse") {
    return (
      <div style={wrapStyle} id={id}>
        <div style={{
          width: 794,
          minHeight: 1123,
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          background: "#ffffff",
        }}>
          <PulseTemplate data={data} theme={theme} />
        </div>
      </div>
    );
  }

  if (templateId === "timeline-v2") {
    return (
      <div style={wrapStyle} id={id}>
        <div style={{
          width: 794,
          minHeight: 1123,
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          background: "#ffffff",
        }}>
          <TimelineTemplate data={data} theme={theme} />
        </div>
      </div>
    );
  }

  if (templateId === "nova") {
    return (
      <div style={wrapStyle} id={id}>
        <div style={{
          width: 794,
          minHeight: 1123,
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          display: "flex",
        }}>
          <SidebarTemplate data={data} theme={theme} />
        </div>
      </div>
    );
  }

  if (templateId === "executive") {
    return (
      <div style={wrapStyle} id={id}>
        <div style={{
          width: 794,
          minHeight: 1123,
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          display: "flex",
        }}>
          <ExecutiveTemplate data={data} theme={theme} />
        </div>
      </div>
    );
  }

  if (templateId === "plasma") {
    return (
      <div style={wrapStyle} id={id}>
        <div style={{
          width: 794,
          minHeight: 1123,
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          display: "flex",
        }}>
          <PlasmaTemplate data={data} theme={theme} />
        </div>
      </div>
    );
  }

  if (templateId === "editorial") {
    return (
      <div style={wrapStyle} id={id}>
        <div style={{
          width: 794,
          minHeight: 1123,
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          display: "flex",
        }}>
          <EditorialTemplate data={data} theme={theme} />
        </div>
      </div>
    );
  }

  if (templateId === "academia") {
    return (
      <div style={wrapStyle} id={id}>
        <div style={{
          width: 794,
          minHeight: 1123,
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          display: "flex",
          flexDirection: "column",
        }}>
          <AcademiaTemplate data={data} theme={theme} />
        </div>
      </div>
    );
  }

  if (templateId === "prism") {
    return (
      <div style={wrapStyle} id={id}>
        <div style={{
          width: 794,
          minHeight: 1123,
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
        }}>
          <PrismTemplate data={data} theme={theme} />
        </div>
      </div>
    );
  }

  if (templateId === "alchemy") {
    return (
      <div style={wrapStyle} id={id}>
        <div style={{
          width: 794,
          minHeight: 1123,
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          display: "flex",
        }}>
          <AlchemyTemplate data={data} theme={theme} />
        </div>
      </div>
    );
  }

  const content = (
    <TemplateRenderer
      data={data}
      theme={theme}
      templateId={templateId}
      scale={scale}
    />
  );

  return (
    <div style={wrapStyle} id={id}>
      {animate ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={templateId}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{ originX: 0, originY: 0, willChange: "transform" }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      ) : (
        content
      )}
    </div>
  );
}
