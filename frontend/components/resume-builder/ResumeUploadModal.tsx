"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { resumeBuilderService } from "@/services/api";

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export function ResumeUploadModal({ isOpen, onClose, onImport }: ResumeUploadModalProps) {
  const [importingState, setImportingState] = useState<'idle' | 'extracting' | 'ai_reading' | 'mapping'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are accepted.");
      return;
    }

    setImportingState('extracting');

    // Simulate state transitions for progress steps
    const timer1 = setTimeout(() => setImportingState('ai_reading'), 1800);
    const timer2 = setTimeout(() => setImportingState('mapping'), 4000);

    try {
      const { data } = await resumeBuilderService.extractResume(file);

      clearTimeout(timer1);
      clearTimeout(timer2);
      setImportingState('mapping');
      await new Promise(resolve => setTimeout(resolve, 800));

      onImport(data);
      onClose();
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const errMsg = err.response?.data?.message || err.message || "Failed to parse resume";
      toast.error(errMsg);
    } finally {
      setImportingState('idle');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Modal card */}
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/40 bg-[#0d1424] shadow-[0_0_30px_rgba(168,85,247,0.25),0_10px_40px_rgba(0,0,0,0.7)]"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e2940] bg-[#0a0f1c] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                  <Upload className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Import from Resume</p>
                  <p className="text-[11px] text-slate-500">Auto-fill your details instantly</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-[#1a2235] hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
              {importingState === 'idle' ? (
                <div className="space-y-5">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer.files?.[0]) {
                        await handleImportFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all hover:bg-violet-950/5 ${
                      dragActive 
                        ? "border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                        : "border-[#2a3548] bg-[#111827]/40 hover:border-violet-500/55 hover:shadow-[0_0_12px_rgba(168,85,247,0.12)]"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          await handleImportFile(e.target.files[0]);
                        }
                      }}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-3">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mb-1 text-center">
                      Drag & drop your resume file here or click to browse
                    </p>
                    <p className="text-[10px] text-slate-500 text-center">
                      Accepts PDF, JPG, PNG (Max 5MB)
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed text-center font-medium">
                    Upload your existing resume — we'll fill in your details automatically
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-5">
                  <div className="relative flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
                    <Sparkles className="absolute h-5 w-5 text-violet-400 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-200 animate-pulse">
                      {importingState === 'extracting' && "Extracting text from your resume..."}
                      {importingState === 'ai_reading' && "AI is reading your resume..."}
                      {importingState === 'mapping' && "Filling in your details..."}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                      <span className={importingState === 'extracting' ? "text-violet-400 font-bold" : "opacity-40"}>Extract</span>
                      <span>→</span>
                      <span className={importingState === 'ai_reading' ? "text-violet-400 font-bold" : "opacity-40"}>Analyze</span>
                      <span>→</span>
                      <span className={importingState === 'mapping' ? "text-violet-400 font-bold" : "opacity-40"}>Map</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
