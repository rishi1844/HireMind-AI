"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface Props {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadedFile?: File | null;
  onRemove?: () => void;
}

export function ResumeDropzone({ onFileSelect, isUploading, uploadedFile, onRemove }: Props) {
  const [dragError, setDragError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setDragError(null);

      if (rejected.length > 0) {
        setDragError("Only PDF files under 10MB are accepted.");
        return;
      }

      if (accepted[0]) {
        onFileSelect(accepted[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled: isUploading || !!uploadedFile,
  });

  const rootProps = getRootProps();

  if (uploadedFile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl border border-emerald-500/20 p-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <FileText className="h-6 w-6 text-emerald-400" />
          </div>

          <div className="flex-1 overflow-hidden">
            <p className="truncate font-medium text-white">{uploadedFile.name}</p>
            <p className="text-sm text-slate-400">
              {formatFileSize(uploadedFile.size)} | PDF
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            {onRemove && !isUploading && (
              <button
                onClick={onRemove}
                className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-rose-500/10 hover:text-rose-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-slate-400">
              <span>Uploading...</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                animate={{ width: ["0%", "90%"] }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div>
      <motion.div
        {...(rootProps as any)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          isDragActive
            ? "border-violet-500 bg-violet-500/5"
            : "border-white/10 hover:border-violet-500/40 hover:bg-white/2"
        }`}
      >
        <input {...getInputProps()} />

        {isDragActive && (
          <div className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl bg-violet-500/5" />
        )}

        <motion.div
          animate={isDragActive ? { y: -5 } : { y: 0 }}
          transition={{ type: "spring" }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
              isDragActive ? "bg-violet-500/20" : "bg-white/5"
            }`}
          >
            <Upload className={`h-8 w-8 transition-colors ${isDragActive ? "text-violet-400" : "text-slate-400"}`} />
          </div>

          <div>
            <p className="mb-1 text-lg font-medium text-white">
              {isDragActive ? "Drop your resume here" : "Drag and drop your resume"}
            </p>
            <p className="text-sm text-slate-400">
              or <span className="font-medium text-violet-400 transition-colors hover:text-violet-300">click to browse</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> PDF only
            </span>
            <span>|</span>
            <span>Max 10 MB</span>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {dragError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {dragError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
