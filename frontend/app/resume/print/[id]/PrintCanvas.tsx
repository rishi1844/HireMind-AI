"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ResumePreview } from "@/components/resume-builder/ResumePreview";
import { normalizeResumeData, normalizeTheme } from "@/components/resume-builder/types";

interface PrintCanvasProps {
  id: string;
  token: string;
}

export default function PrintCanvas({ id, token }: PrintCanvasProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token is required");
      setLoading(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    axios
      .get(`${apiUrl}/api/resume-builder/print-token/validate`, {
        params: { token },
      })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Error validating print token:", err);
        setError(err.response?.data?.message || err.message || "Failed to validate token");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, token]);

  if (loading) {
    return (
      <div id="resume-loading" className="flex items-center justify-center min-h-screen bg-white text-gray-500">
        <p className="text-lg animate-pulse font-medium">Loading resume preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div id="resume-error" className="flex items-center justify-center min-h-screen bg-white text-red-500">
        <p className="text-lg font-semibold">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div id="resume-no-data" className="flex items-center justify-center min-h-screen bg-white text-gray-500">
        <p className="text-lg">No data found</p>
      </div>
    );
  }

  const { resumeData, templateId, theme } = data;
  const normalizedData = normalizeResumeData(resumeData);
  const normalizedTheme = normalizeTheme(theme);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* 1. Screen view styles (so it looks clean in browser) */
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          min-height: 0 !important;
          height: auto !important;
          overflow: visible !important;
        }

        /* Use higher specificity to override globals.css #print-root { display: none !important } */
        html body #print-root {
          display: block !important;
          visibility: visible !important;
          background: #ffffff;
          width: 794px;
          margin: 0;
          padding: 0;
        }

        #resume-print {
          width: 794px !important;
          position: relative !important;
        }

        /* 2. Print view styles (when emulated or printing) */
        @media print {
          @page {
            size: A4;
            margin: 0mm;
          }
          
          html, body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Override globals.css's display: none on the ErrorBoundary wrapper */
          html body > *:not(#print-root) {
            display: block !important;
            visibility: hidden !important;
          }

          body * {
            visibility: hidden !important;
          }

          #print-root,
          #print-root * {
            visibility: visible !important;
          }

          #print-root {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          #resume-print,
          #resume-print * {
            visibility: visible !important;
          }

          #resume-print {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
        }

        /* 3. Force background colors and print adjustments */
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      `}} />

      <div id="print-root">
        <div id="resume-print" data-render-complete="true">
          <ResumePreview
            data={normalizedData}
            templateId={templateId}
            theme={normalizedTheme}
            scale={1}
            animate={false}
          />
        </div>
      </div>
    </>
  );
}
