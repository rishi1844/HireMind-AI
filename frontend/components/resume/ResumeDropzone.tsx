"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface Props {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadedFile?: File | null;
  onRemove?: () => void;
}

export function ResumeDropzone({ onFileSelect, isUploading, uploadedFile, onRemove }: Props) {
  const [dragError, setDragError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setDragError(null);
    if (rejected.length > 0) {
      setDragError("Only PDF files under 10MB are accepted.");
      return;
    }
    if (accepted[0]) onFileSelect(accepted[0]);
  }, [onFileSelect]);

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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-6 border border-emerald-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-white font-medium truncate">{uploadedFile.name}</p>
            <p className="text-slate-400 text-sm">{formatFileSize(uploadedFile.size)} · PDF</p>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            {onRemove && !isUploading && (
              <button onClick={onRemove}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {isUploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Uploading…</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                animate={{ width: ["0%", "90%"] }} transition={{ duration: 2, ease: "easeOut" }} />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div>
      <motion.div {...(rootProps as any)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all
          ${isDragActive
            ? "border-violet-500 bg-violet-500/5"
            : "border-white/10 hover:border-violet-500/40 hover:bg-white/2"}`}>
        <input {...getInputProps()} />

        {/* Ambient glow when dragging */}
        {isDragActive && (
          <div className="absolute inset-0 rounded-2xl bg-violet-500/5 animate-pulse pointer-events-none" />
        )}

        <motion.div animate={isDragActive ? { y: -5 } : { y: 0 }} transition={{ type: "spring" }}
          className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all
            ${isDragActive ? "bg-violet-500/20" : "bg-white/5"}`}>
            <Upload className={`w-8 h-8 transition-colors ${isDragActive ? "text-violet-400" : "text-slate-400"}`} />
          </div>

          <div>
            <p className="text-white font-medium text-lg mb-1">
              {isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
            </p>
            <p className="text-slate-400 text-sm">
              or{" "}
              <span className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                click to browse
              </span>
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> PDF only
            </span>
            <span>·</span>
            <span>Max 10 MB</span>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {dragError && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {dragError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
