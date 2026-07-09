"use client";

import { useState } from "react";
import { Loader2, FileDown, Mail, X, Send, DownloadCloud, Save } from "lucide-react";
import toast from "react-hot-toast";
import { resumeBuilderService } from "@/services/api";
import { cn } from "@/lib/utils";
import { ResumeData, ResumeTheme, TemplateId } from "./types";

interface Props {
  resumeId: string | number | null;
  isSaving: boolean;
  onSave: () => Promise<void>;
  formData: ResumeData;
  templateId: TemplateId;
  theme: ResumeTheme;
  title?: string;
  /** Frontend html2canvas PDF export — captures the live preview with correct template & profile pic */
  onPdfExport?: (filename: string) => Promise<void>;
  pdfExporting?: boolean;
}

/** Helper: fetch a binary blob from a protected backend URL and trigger download */
async function downloadFromBackend(url: string, filename: string): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "Download failed");
    throw new Error(msg || `Server returned ${res.status}`);
  }
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objUrl);
}

export function ExportPanel({ resumeId, isSaving, onSave, formData, templateId, theme, title, onPdfExport, pdfExporting }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailFormat, setEmailFormat] = useState<"PDF" | "DOCX">("PDF");
  const [emailSending, setEmailSending] = useState(false);

  const safeFilename = `${(title || "resume").replace(/[^a-z0-9_\-\s]/gi, "_")}`;

  // ── Auto-save helper: ensures resumeId exists before export ─────────────────
  const ensureSaved = async (): Promise<number | null> => {
    const numId = resumeId != null ? Number(resumeId) : null;
    if (numId) return numId;
    toast("Saving resume before export…", { icon: "💾" });
    await onSave();
    // Wait a tick for savedResumeId to propagate (onSave updates parent state)
    await new Promise((r) => setTimeout(r, 600));
    return resumeId != null ? Number(resumeId) : null;
  };

  // ── PDF download: prefer frontend html2canvas (exact template + profile pic) ─
  const handlePdfExport = async () => {
    // If frontend capture hook is available, use it (correct template + images)
    if (onPdfExport) {
      try {
        await onPdfExport(safeFilename);
        toast.success("PDF downloaded!");
      } catch (err: any) {
        console.error(err);
        toast.error("PDF generation failed. Try again.");
      }
      return;
    }
    // Fallback: server-side PDF
    const id = resumeId != null ? Number(resumeId) : (await ensureSaved());
    if (!id) {
      toast.error("Save the resume first, then download PDF.");
      return;
    }
    setPdfLoading(true);
    try {
      await downloadFromBackend(
        resumeBuilderService.exportPdfUrl(id),
        `${safeFilename}.pdf`
      );
      toast.success("PDF downloaded!");
    } catch (err: any) {
      console.error(err);
      toast.error("PDF generation failed. Try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  // ── DOCX download (server-side with current templateId) ─────────────────────
  const downloadDocx = async () => {
    if (!resumeId) {
      toast.error("Save the resume first before downloading.");
      return;
    }
    const numId = Number(resumeId);
    setDocxLoading(true);
    try {
      await downloadFromBackend(
        resumeBuilderService.exportDocxUrl(numId, templateId),
        `${safeFilename}.docx`
      );
      toast.success("Downloaded as DOCX");
    } catch {
      toast.error("Failed to download DOCX");
    } finally {
      setDocxLoading(false);
    }
  };

  // ── Email ────────────────────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!resumeId) { toast.error("Save the resume first."); return; }
    if (!emailAddress.includes("@")) { toast.error("Enter a valid email address."); return; }
    setEmailSending(true);
    try {
      await resumeBuilderService.sendEmail(Number(resumeId), {
        recipientEmail: emailAddress,
        format: emailFormat,
        templateId,        // ← send the live selected template
      });
      toast.success(`Resume sent to ${emailAddress}`);
      setEmailOpen(false);
      setEmailAddress("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send email.");
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <>
      {/* Action buttons */}
      <div className="flex flex-col gap-2.5">
        {/* Save */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 px-4 py-2.5 text-sm font-semibold text-violet-200 ring-1 ring-inset ring-violet-500/20 transition-all hover:from-violet-600/30 hover:to-indigo-600/30 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Resume"}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* PDF — frontend html2canvas capture (exact template + profile pic) */}
          <button
            type="button"
            onClick={handlePdfExport}
            disabled={pdfExporting || pdfLoading}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-300 transition-all hover:bg-rose-500/20 disabled:opacity-40"
          >
            {(pdfExporting || pdfLoading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
            PDF
          </button>

          {/* DOCX — server-side */}
          <button
            disabled
            type="button"
            onClick={downloadDocx}
            // disabled={docxLoading || !resumeId}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm font-semibold text-sky-300 transition-all hover:bg-sky-500/20 disabled:opacity-40"
          >
            {docxLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            DOCX
          </button>
        </div>

        {/* Email */}
        <button
          disabled
          type="button"
          onClick={() => setEmailOpen(true)}
          // disabled={!resumeId}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-40"
        >
          <Mail className="h-4 w-4" />
          Send via Email
        </button>
      </div>

      {/* Email Modal */}
      {emailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#2a3548] bg-[#141c2b] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-semibold text-slate-200">Send Resume by Email</p>
              <button
                onClick={() => setEmailOpen(false)}
                className="rounded-xl p-1.5 text-slate-500 hover:bg-[#1a2235] hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Recipient Email</label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full rounded-xl border border-[#2a3548] bg-[#0f1623] px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Format</label>
                <div className="flex gap-2">
                  {(["PDF", "DOCX"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setEmailFormat(fmt)}
                      className={cn(
                        "flex-1 rounded-xl border py-2 text-sm font-semibold transition-all",
                        emailFormat === fmt
                          ? "border-violet-500/60 bg-violet-600/20 text-violet-200"
                          : "border-[#2a3548] bg-[#0f1623] text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={emailSending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
              >
                {emailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {emailSending ? "Sending..." : "Send Resume"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
