"use client";

import { motion } from "framer-motion";
import { ChevronRight, Lock } from "lucide-react";

interface Category {
    score: number;
    issues: string[];
}

interface ScoreSidebarProps {
    atsScore: number;
    categories: {
        readability?: Category;
        impact?: Category;
        brevity?: Category;
        style?: Category;
    };
    activeCategory: string | null;
    onCategoryClick: (key: string) => void;
    onJdMatchClick: () => void;
}

function getScoreColor(score: number) {
    if (score >= 8) return "#10b981";
    if (score >= 6) return "#22d3ee";
    if (score >= 4) return "#f59e0b";
    return "#f43f5e";
}

function getAtsColor(score: number) {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#f43f5e";
}

function getAtsLabel(score: number) {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Poor";
}

const CATEGORY_META: Record<string, { label: string; desc: string }> = {
    readability: { label: "Readability", desc: "Scannability for recruiters" },
    impact: { label: "Impact", desc: "Achievements & results" },
    brevity: { label: "Brevity", desc: "Conciseness & length" },
    style: { label: "Style", desc: "Language & consistency" },
};

export function ScoreSidebar({
    atsScore,
    categories,
    activeCategory,
    onCategoryClick,
    onJdMatchClick,
}: ScoreSidebarProps) {
    const color = getAtsColor(atsScore);
    const circumference = 2 * Math.PI * 40;
    const offset = circumference * (1 - atsScore / 100);

    const sorted = Object.entries(CATEGORY_META).map(([key, meta]) => ({
        key,
        meta,
        data: categories[key as keyof typeof categories],
    }));

    const topFixes = sorted.filter((c) => (c.data?.score ?? 10) < 7);
    const completed = sorted.filter((c) => (c.data?.score ?? 0) >= 7);

    return (
        <div className="flex h-full flex-col gap-0 overflow-y-auto">
            {/* Score Ring */}
            <div className="border-b border-white/6 px-5 py-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative flex h-28 w-28 items-center justify-center">
                        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                            <motion.circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke={color}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: offset }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="text-center">
                            <p className="text-3xl font-bold leading-none" style={{ color }}>{atsScore}</p>
                            <p className="mt-0.5 text-[10px] text-slate-500 uppercase tracking-widest">overall</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold" style={{ color }}>{getAtsLabel(atsScore)}</p>
                        <p className="text-xs text-slate-500">ATS Score</p>
                    </div>
                </div>
            </div>

            {/* Top Fixes */}
            {topFixes.length > 0 && (
                <div className="border-b border-white/6 px-4 py-4">
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Top Fixes
                    </p>
                    <div className="space-y-1">
                        {topFixes.map(({ key, meta, data }) => {
                            const score = data?.score ?? 0;
                            const isActive = activeCategory === key;
                            return (
                                <motion.button
                                    key={key}
                                    onClick={() => onCategoryClick(key)}
                                    whileHover={{ x: 2 }}
                                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${isActive
                                        ? "bg-white/8 ring-1 ring-white/10"
                                        : "hover:bg-white/4"
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: getScoreColor(score) }} />
                                        <span className="truncate text-sm text-slate-300 group-hover:text-white transition-colors">
                                            {meta.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-sm font-bold tabular-nums" style={{ color: getScoreColor(score) }}>
                                            {score}
                                        </span>
                                        <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
                <div className="border-b border-white/6 px-4 py-4">
                    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Completed
                    </p>
                    <div className="space-y-1">
                        {completed.map(({ key, meta, data }) => {
                            const score = data?.score ?? 0;
                            return (
                                <button
                                    key={key}
                                    onClick={() => onCategoryClick(key)}
                                    className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-white/4 transition-all"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                        <span className="truncate text-sm text-slate-500 group-hover:text-slate-400 transition-colors">
                                            {meta.label}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold tabular-nums text-emerald-400">{score}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tools */}
            <div className="px-4 py-4">
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Tools</p>
                <button
                    onClick={onJdMatchClick}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/8 px-3 py-2.5 text-left transition-all hover:bg-cyan-500/12"
                >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
                        <svg className="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-cyan-300">JD Match</p>
                        <p className="text-xs text-slate-500 truncate">Paste job description</p>
                    </div>
                </button>
            </div>

            {/* Active category detail */}
            {activeCategory && categories[activeCategory as keyof typeof categories] && (
                <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-4 rounded-2xl border border-white/8 bg-white/3 p-4"
                >
                    <p className="mb-2 text-xs font-semibold text-white">
                        {CATEGORY_META[activeCategory]?.label} Issues
                    </p>
                    <ul className="space-y-1.5">
                        {(categories[activeCategory as keyof typeof categories]?.issues ?? []).map((issue, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed">
                                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                                {issue}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </div>
    );
}