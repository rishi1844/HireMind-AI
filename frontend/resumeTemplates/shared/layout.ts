/**
 * layout.ts — A4 page layout constants and utilities
 * All templates must import from here instead of hard-coding dimensions.
 */

/** Fixed A4 width at 96 dpi — ensures consistent PDF output */
export const A4_WIDTH_PX = 794;

/** A4 height at 96 dpi */
export const A4_HEIGHT_PX = 1122;

/** A4 width in mm (for jsPDF) */
export const A4_WIDTH_MM = 210;

/** A4 height in mm (for jsPDF) */
export const A4_HEIGHT_MM = 297;

/**
 * Base page style applied to every template's root div.
 * Intentionally does NOT set fontFamily — that is the caller's responsibility.
 */
export const pageBase: React.CSSProperties = {
  width: `${A4_WIDTH_PX}px`,
  minHeight: `${A4_HEIGHT_PX}px`,
  backgroundColor: "#ffffff",
  color: "#0f172a",
  boxSizing: "border-box",
  position: "relative",
  // overflow must be 'visible' so multi-page content flows naturally
  overflow: "visible",
};

/**
 * Returns the outer wrapper style used in ResumePreview to clip/scale
 * the template for screen display. Not used for PDF capture.
 */
export function wrapStyle(scale: number): React.CSSProperties {
  if (scale === 1) return {};
  return {
    width: `${A4_WIDTH_PX * scale}px`,
    height: `${A4_HEIGHT_PX * scale}px`,
    overflow: "hidden",
    position: "relative",
  };
}

/**
 * Returns the inner scale transform style for screen display.
 */
export function scaleStyle(scale: number): React.CSSProperties {
  if (scale === 1) return {};
  return {
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    width: `${A4_WIDTH_PX}px`,
  };
}

// Re-export React so callers don't need a separate import for CSSProperties
import type React from "react";
