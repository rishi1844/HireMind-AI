"use client";

import Link from "next/link";
import { useState } from "react";
import { Edit2, FileDown, Trash2, Loader2, Clock, LayoutTemplate } from "lucide-react";
import toast from "react-hot-toast";
import { BuiltResumeListItem, TemplateId } from "./types";
import { resumeBuilderService } from "@/services/api";
import { cn } from "@/lib/utils";

interface Props {
  resume: BuiltResumeListItem;
  onDeleted: (id: number) => void;
}

const TEMPLATE_COLORS: Record<TemplateId, string> = {
  stark:           "border-green-200 bg-green-50 text-green-800",
  axiom:           "border-blue-200 bg-blue-50 text-blue-800",
  pulse:           "border-purple-200 bg-purple-50 text-purple-800",
  "timeline-v2":   "border-orange-200 bg-orange-50 text-orange-800",
  nova:            "border-indigo-200 bg-indigo-50 text-indigo-800",
  executive:       "border-teal-200 bg-teal-50 text-teal-800",
  plasma:          "border-amber-200 bg-amber-50 text-amber-800",
  editorial:       "border-yellow-200 bg-yellow-50 text-yellow-800",
  academia:        "border-rose-200 bg-rose-50 text-rose-800",
  prism:           "border-sky-200 bg-sky-50 text-sky-800",
  alchemy:         "border-cyan-200 bg-cyan-50 text-cyan-800",
};

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ResumeCard({ resume, onDeleted }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const downloadFile = async (format: "pdf" | "docx") => {
    const setLoading = format === "pdf" ? setPdfLoading : setDocxLoading;
    setLoading(true);
    try {
      const url = format === "pdf"
        ? resumeBuilderService.exportPdfUrl(resume.id)
        : resumeBuilderService.exportDocxUrl(resume.id);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${resume.title}.${format}`;
      a.click();
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error(`Download failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await resumeBuilderService.delete(resume.id);
      onDeleted(resume.id);
      toast.success("Resume deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="group flex flex-col rounded-[1.5rem] border border-white/8 bg-white/3 p-5 transition-all duration-200 hover:border-amber-500/20 hover:bg-white/5 hover:shadow-lg hover:shadow-amber-500/5">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
          <LayoutTemplate className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{resume.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize", TEMPLATE_COLORS[resume.templateId])}>
              {resume.templateId}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              {formatRelative(resume.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          href={`/resume/builder/${resume.id}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 transition-all hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Link>

        <button
          onClick={() => downloadFile("pdf")}
          disabled={pdfLoading}
          className="flex items-center gap-1 rounded-xl border border-rose-500/25 bg-rose-500/8 px-3 py-2 text-xs font-medium text-rose-300 transition-all hover:bg-rose-500/15 disabled:opacity-40"
        >
          {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
          PDF
        </button>

        <button
          onClick={() => downloadFile("docx")}
          disabled={docxLoading}
          className="flex items-center gap-1 rounded-xl border border-blue-500/25 bg-blue-500/8 px-3 py-2 text-xs font-medium text-blue-300 transition-all hover:bg-blue-500/15 disabled:opacity-40"
        >
          {docxLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
          DOCX
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
          className={cn(
            "flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all disabled:opacity-40",
            confirmDelete
              ? "border-rose-400/50 bg-rose-500/20 text-rose-200"
              : "border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15"
          )}
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {confirmDelete ? "Sure?" : "Delete"}
        </button>
      </div>
    </div>
  );
}
