"use client";

/**
 * usePdfExport.ts — Print-based PDF export hook.
 *
 * Strategy: window.print()
 * - Produces ATS-readable, selectable-text PDFs (not images)
 * - Zero dependencies (no html2canvas, no jsPDF, no puppeteer)
 * - A4 layout + background color printing controlled by globals.css @media print
 * - Chrome uses document.title as the suggested filename in "Save as PDF"
 *
 * The #print-root portal in ResumeBuilderShell renders the full-scale resume
 * (scale=1, animate=false). The @media print block in globals.css hides everything
 * except #print-root and resets margins to zero.
 */

import { useCallback, useRef, useState } from "react";

interface PdfExportOptions {
  filename?: string;
}

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  /** Kept for API compatibility — not needed for window.print() approach */
  const containerRef = useRef<HTMLDivElement | null>(null);

  const exportPdf = useCallback(async (options: PdfExportOptions = {}) => {
    setIsExporting(true);
    try {
      // Chrome uses document.title as the default filename when saving via "Save as PDF"
      const prevTitle = document.title;
      document.title = options.filename ?? "resume";
      window.print();
      // Restore title after a tick (print dialog is synchronous in Chrome, async in Firefox)
      setTimeout(() => {
        document.title = prevTitle;
      }, 100);
    } finally {
      // Small delay so the loading indicator doesn't flash off instantly
      setTimeout(() => setIsExporting(false), 500);
    }
  }, []);

  return { exportPdf, isExporting, containerRef };
}
