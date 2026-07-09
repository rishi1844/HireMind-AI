"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface IssueAnnotation {
    section: string;
    severity: "high" | "medium" | "low";
    issue: string;
    suggestion: string;
    lineHint: string;
    magicReplacement?: string;
}

interface ResumeViewerProps {
    filePath: string;
    annotations: IssueAnnotation[];
    activeCategory: string | null;
    onAnnotationApply: (lineHint: string, replacement: string) => void;
    onFixWithMagicWrite: (annIdx: number) => void;
}

interface TextItem {
    str: string;
    transform: number[];
    width: number;
    height: number;
    fontName: string;
}

interface HighlightBox {
    x: number;
    y: number;
    width: number;
    height: number;
    annotation: IssueAnnotation;
    annIdx: number;
}

// Used inside renderPage to track each PDF text item's viewport position
interface PositionedItem {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

const SEV_COLORS = {
    high: { bg: "rgba(239,68,68,0.18)", border: "#ef4444", tooltip: "border-rose-500/30 bg-[#0d1220]" },
    medium: { bg: "rgba(245,158,11,0.18)", border: "#f59e0b", tooltip: "border-amber-500/30 bg-[#0d1220]" },
    low: { bg: "rgba(59,130,246,0.18)", border: "#3b82f6", tooltip: "border-blue-500/30 bg-[#0d1220]" },
};

const SEV_BADGE = {
    high: "bg-rose-500/15 text-rose-300 border-rose-500/25",
    medium: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    low: "bg-blue-500/15 text-blue-300 border-blue-500/25",
};

function Tooltip({
    ann, annIdx, onFixWithMagicWrite, onClose,
}: { ann: IssueAnnotation; annIdx: number; onFixWithMagicWrite: (idx: number) => void; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className={`absolute z-50 w-72 rounded-2xl border p-3.5 shadow-2xl shadow-black/60 ${SEV_COLORS[ann.severity].tooltip}`}
            style={{ top: "calc(100% + 6px)", left: 0 }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEV_BADGE[ann.severity]}`}>
                        {ann.severity === "high" ? "Critical" : ann.severity === "medium" ? "Medium" : "Low"}
                    </span>
                    {ann.section && (
                        <span className="rounded-full border border-slate-700/50 bg-white/4 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            {ann.section}
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
            <p className="mb-1 text-sm font-semibold text-white">{ann.issue}</p>
            <p className="mb-3 text-xs text-slate-400 leading-relaxed">💡 {ann.suggestion}</p>
            <button
                onClick={() => { onFixWithMagicWrite(annIdx); onClose(); }}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2 text-xs font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500"
            >
                ✨ Fix with Magic Write →
            </button>
        </motion.div>
    );
}

export function ResumeViewer({ filePath, annotations, activeCategory, onAnnotationApply, onFixWithMagicWrite }: ResumeViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [highlights, setHighlights] = useState<HighlightBox[]>([]);
    const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.4);
    const [loading, setLoading] = useState(true);
    const [pdfjsLib, setPdfjsLib] = useState<any>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const renderTaskRef = useRef<any>(null);

    // Load pdf.js dynamically
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
            const lib = (window as any).pdfjsLib;
            lib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            setPdfjsLib(lib);
        };
        document.head.appendChild(script);
        return () => { document.head.removeChild(script); };
    }, []);

    // Load PDF document
    useEffect(() => {
        if (!pdfjsLib || !filePath) return;
        const url = filePath.startsWith("http") ? filePath : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || ""}${filePath}`;
        pdfjsLib.getDocument(url).promise.then((doc: any) => {
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [pdfjsLib, filePath]);

    // Render page + extract text for highlights
    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdfDoc || !canvasRef.current) return;

        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;

        try {
            await renderTask.promise;
        } catch {
            return; // cancelled
        }

        // Extract text positions for highlight overlay
        const textContent = await page.getTextContent();
        const newHighlights: HighlightBox[] = [];

        // Build a flat array of text items with their viewport positions
        const posItems: PositionedItem[] = [];
        for (const item of textContent.items as TextItem[]) {
            if (!item.str || !item.str.trim()) continue;
            const [, , , , tx, ty] = item.transform;
            const pt = viewport.convertToViewportPoint(tx, ty);
            posItems.push({
                str: item.str,
                x: pt[0],
                y: pt[1] - Math.max(item.height * scale, 12),
                width: item.width * scale,
                height: Math.max(item.height * scale, 12),
            });
        }

        // Build a single searchable string from all items
        const fullText = posItems.map((i) => i.str).join(" ").toLowerCase();

        annotations.forEach((ann, annIdx) => {
            if (!ann.lineHint || !ann.lineHint.trim()) return;
            const hint = ann.lineHint.toLowerCase().trim();

            // ── Strategy 1: exact substring match in full concatenated text ──
            const exactIdx = fullText.indexOf(hint);
            if (exactIdx !== -1) {
                // Find which posItems cover this range
                let charCount = 0;
                let startItemIdx = -1;
                let endItemIdx = -1;
                for (let i = 0; i < posItems.length; i++) {
                    const itemEnd = charCount + posItems[i].str.length + (i > 0 ? 1 : 0);
                    if (startItemIdx === -1 && itemEnd > exactIdx) startItemIdx = i;
                    if (startItemIdx !== -1 && charCount <= exactIdx + hint.length) endItemIdx = i;
                    charCount += posItems[i].str.length + 1; // +1 for the space separator
                }
                if (startItemIdx !== -1) {
                    const si = posItems[startItemIdx];
                    const ei = endItemIdx >= 0 ? posItems[endItemIdx] : si;
                    const rawWidth = (ei.x + ei.width) - si.x;
                    // Guard against negative width (items on different lines)
                    const width = rawWidth > 20 ? rawWidth : hint.length * 6;
                    const height = Math.max(si.height, ei.height);
                    newHighlights.push({ x: si.x, y: si.y, width, height: height + 3, annotation: ann, annIdx });
                    return;
                }
            }

            // ── Strategy 2: fuzzy word-overlap match (handles slight spacing diffs) ──
            const hintWords = hint.split(/\s+/).filter(Boolean);
            if (hintWords.length === 0) return;
            const firstWord = hintWords[0];
            const lastWord = hintWords[hintWords.length - 1];

            // Find all candidate start items that contain the first hint word
            for (let si = 0; si < posItems.length; si++) {
                if (!posItems[si].str.toLowerCase().includes(firstWord)) continue;

                // Try to accumulate enough items to cover the full hint
                let accumulated = "";
                let ei = si;
                for (let k = si; k < posItems.length && k < si + 20; k++) {
                    accumulated += (accumulated ? " " : "") + posItems[k].str.toLowerCase();
                    ei = k;
                    // Check if we have enough overlap with the hint (≥60% of hint words present)
                    const matchedWords = hintWords.filter((w) => accumulated.includes(w)).length;
                    if (matchedWords >= Math.ceil(hintWords.length * 0.6) && accumulated.includes(lastWord)) {
                        const startI = posItems[si];
                        const endI = posItems[ei];
                        const rawWidth = (endI.x + endI.width) - startI.x;
                        const width = rawWidth > 20 ? rawWidth : hint.length * 6;
                        const height = Math.max(startI.height, endI.height);
                        newHighlights.push({ x: startI.x, y: Math.min(startI.y, endI.y), width, height: height + 3, annotation: ann, annIdx });
                        return;
                    }
                }
            }
            // If neither strategy found a match, skip silently (no crash)
        });

        setHighlights(newHighlights);
    }, [pdfDoc, scale, annotations]);

    useEffect(() => {
        if (pdfDoc) renderPage(currentPage);
    }, [pdfDoc, currentPage, renderPage]);

    // Filter highlights by active category
    const visibleHighlights = activeCategory
        ? highlights.filter((h) =>
            h.annotation.section.toLowerCase() === activeCategory.toLowerCase() ||
            (activeCategory === "impact" && h.annotation.severity === "high") ||
            (activeCategory === "readability" && h.annotation.severity === "medium")
        )
        : highlights;

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
                    <p className="text-sm text-slate-500">Loading PDF…</p>
                </div>
            </div>
        );
    }

    if (!filePath) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">No PDF available. Resume text view only.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Toolbar */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-[#060b18] px-4 py-2">
                <p className="text-xs text-slate-500">
                    📄 Click underlined text to see issues
                </p>
                <div className="flex items-center gap-2">
                    {/* Zoom */}
                    <button
                        onClick={() => setScale((s) => Math.max(0.8, s - 0.2))}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
                    >−</button>
                    <span className="text-xs text-slate-500 w-10 text-center">{Math.round(scale * 100)}%</span>
                    <button
                        onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
                    >+</button>
                </div>
            </div>

            {/* PDF Canvas + Overlay */}
            <div ref={containerRef} className="relative flex-1 overflow-auto bg-[#060b18] p-4">
                <div className="relative mx-auto w-fit">
                    <canvas ref={canvasRef} className="rounded-lg shadow-2xl shadow-black/40" />

                    {/* Highlight overlays */}
                    {visibleHighlights.map((h) => {
                        const colors = SEV_COLORS[h.annotation.severity];
                        const isActive = activeTooltip === h.annIdx;
                        return (
                            <div
                                key={h.annIdx}
                                className="absolute cursor-pointer"
                                style={{
                                    left: h.x,
                                    top: h.y,
                                    width: h.width,
                                    height: h.height,
                                    background: colors.bg,
                                    borderBottom: `2px solid ${colors.border}`,
                                    borderRadius: 2,
                                }}
                                onClick={() => setActiveTooltip(isActive ? null : h.annIdx)}
                            >
                                <AnimatePresence>
                                    {isActive && (
                                        <Tooltip
                                            ann={h.annotation}
                                            annIdx={h.annIdx}
                                            onFixWithMagicWrite={onFixWithMagicWrite}
                                            onClose={() => setActiveTooltip(null)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Page Navigation */}
            {numPages > 1 && (
                <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/5 py-2">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400 transition-colors hover:bg-white/5 disabled:opacity-40"
                    >
                        Prev
                    </button>
                    <span className="text-xs text-slate-500">{currentPage} / {numPages}</span>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                        disabled={currentPage === numPages}
                        className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400 transition-colors hover:bg-white/5 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}