"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, FileText } from "lucide-react";

export interface ResumeOption {
  resumeId: string | number;
  fileName: string;
}

interface CustomResumeDropdownProps {
  value: string | number;
  onChange: (value: string) => void;
  resumes: ResumeOption[];
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
  className?: string;
}

export function CustomResumeDropdown({
  value,
  onChange,
  resumes,
  allowNone = false,
  noneLabel = "— No resume (generic letter) —",
  placeholder = "Select a resume...",
  className = "",
}: CustomResumeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Find the selected resume or "none" option
  const selectedResume = resumes.find(
    (r) => String(r.resumeId) === String(value)
  );

  const displayLabel =
    value === "" && allowNone
      ? noneLabel
      : selectedResume
      ? selectedResume.fileName
      : placeholder;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 px-4 py-3.5 text-sm text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-left"
      >
        <span className="flex items-center gap-2.5 truncate">
          <FileText className="h-4 w-4 text-violet-400 flex-shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-[999] max-h-60 overflow-y-auto rounded-2xl border border-white/12 bg-[#0e0a26]/95 backdrop-blur-xl shadow-2xl p-1.5 scrollbar-thin scrollbar-thumb-white/10 transition-all animate-in fade-in slide-in-from-top-1 duration-150">
          {allowNone && (
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm text-left transition-colors ${
                value === ""
                  ? "bg-gradient-to-r from-violet-600/30 to-cyan-600/30 text-white font-medium"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="truncate">{noneLabel}</span>
              {value === "" && <Check className="h-4 w-4 text-cyan-400" />}
            </button>
          )}

          {resumes.map((r) => {
            const isSelected = String(r.resumeId) === String(value);
            return (
              <button
                key={r.resumeId}
                type="button"
                onClick={() => handleSelect(String(r.resumeId))}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm text-left transition-colors ${
                  isSelected
                    ? "bg-gradient-to-r from-violet-600/30 to-cyan-600/30 text-white font-medium"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className="truncate flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  {r.fileName}
                </span>
                {isSelected && <Check className="h-4 w-4 text-cyan-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
