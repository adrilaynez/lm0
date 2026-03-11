"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { ATTENTION } from "./SpotlightViz";

/*
  AttentionHeatmapViz — V12 ⭐
  Full 12×12 attention matrix as explorable heatmap. Data-art quality.
  Hover highlights row+column crosshair. Click locks a row and shows bar chart.
  Color gradient: deep purple → cyan → white for intensity.
*/

const WORDS = ["The", "king", "who", "wore", "the", "golden", "crown", "ruled", "the", "vast", "kingdom", "wisely"];

function weightToColor(w: number): string {
    /* purple → cyan → white ramp */
    if (w < 0.05) return "rgba(88, 28, 135, 0.3)";   // very dark purple
    if (w < 0.10) return "rgba(126, 34, 206, 0.45)";  // purple
    if (w < 0.15) return "rgba(139, 92, 246, 0.5)";   // violet
    if (w < 0.20) return "rgba(34, 211, 238, 0.35)";  // cyan dim
    if (w < 0.30) return "rgba(34, 211, 238, 0.55)";  // cyan mid
    if (w < 0.40) return "rgba(34, 211, 238, 0.75)";  // cyan bright
    if (w < 0.50) return "rgba(103, 232, 249, 0.85)";  // cyan-200
    return "rgba(207, 250, 254, 0.95)";                 // near white
}

function weightToGlow(w: number): string {
    if (w < 0.2) return "none";
    const intensity = Math.min(w * 0.6, 0.4);
    return `0 0 ${w * 20}px -2px rgba(34,211,238,${intensity})`;
}

export function AttentionHeatmapViz() {
    const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
    const [lockedRow, setLockedRow] = useState<number | null>(null);

    const activeRow = lockedRow ?? hoveredCell?.r ?? null;

    /* Bar chart data for locked/hovered row */
    const barData = activeRow !== null
        ? ATTENTION[activeRow]
            .map((w, i) => ({ w, i }))
            .sort((a, b) => b.w - a.w)
            .slice(0, 6)
        : [];

    return (
        <div className="py-6 sm:py-8 px-1 sm:px-4 space-y-4" style={{ minHeight: 300 }}>

            {/* Recipe banner */}
            <motion.div
                className="rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4"
                style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)" }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <span className="text-[9px] uppercase tracking-widest font-bold text-cyan-400/40 shrink-0">The Recipe</span>
                <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] sm:text-[13px] font-medium text-white/50">
                        This matrix tells each word <span className="text-cyan-300/65">where to look</span>.
                    </p>
                    <p className="text-[11px] text-white/25 italic">
                        The next section shows what we <span className="text-cyan-300/45 not-italic font-medium">cook with it</span> — new contextual embeddings.
                    </p>
                </div>
            </motion.div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto pb-2 flex justify-center">
                <div className="inline-block">
                    {/* Column axis label */}
                    <div className="flex items-center ml-16 sm:ml-20 mb-0.5">
                        <span className="text-[9px] text-cyan-400/25 uppercase tracking-[0.15em] font-medium w-full text-center">
                            attends to →
                        </span>
                    </div>

                    {/* Column headers */}
                    <div className="flex items-end ml-16 sm:ml-20 mb-1">
                        {WORDS.map((word, c) => (
                            <div
                                key={c}
                                className="flex-shrink-0 text-center"
                                style={{ width: 34, minWidth: 34 }}
                            >
                                <span
                                    className={`text-[9px] sm:text-[10px] font-medium transition-colors duration-200 block truncate ${hoveredCell?.c === c || (lockedRow !== null && ATTENTION[lockedRow][c] > 0.15)
                                        ? "text-cyan-300/70"
                                        : "text-white/25"
                                        }`}
                                    style={{
                                        writingMode: "vertical-rl",
                                        transform: "rotate(180deg)",
                                        height: 50,
                                        lineHeight: "34px",
                                    }}
                                >
                                    {word}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Grid rows */}
                    <div className="flex">
                        {/* Row axis label */}
                        <div className="flex items-center justify-center w-4 mr-0.5" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                            <span className="text-[9px] text-cyan-400/25 uppercase tracking-[0.15em] font-medium">from ↓</span>
                        </div>

                        <div>
                            {WORDS.map((rowWord, r) => (
                                <div key={r} className="flex items-center gap-0">
                                    {/* Row label */}
                                    <span
                                        className={`text-[9px] sm:text-[11px] font-medium w-14 sm:w-16 text-right pr-2 shrink-0 truncate transition-colors duration-200 ${activeRow === r
                                            ? "text-cyan-300/80"
                                            : "text-white/25"
                                            }`}
                                        style={{
                                            textShadow: activeRow === r ? "0 0 10px rgba(34,211,238,0.2)" : "none",
                                        }}
                                    >
                                        {rowWord}
                                    </span>

                                    {/* Cells */}
                                    {ATTENTION[r].map((w, c) => {
                                        const isHoveredRow = hoveredCell?.r === r;
                                        const isHoveredCol = hoveredCell?.c === c;
                                        const isExact = hoveredCell?.r === r && hoveredCell?.c === c;
                                        const isLockedRow = lockedRow === r;
                                        const isCrosshair = isHoveredRow || isHoveredCol;

                                        return (
                                            <motion.div
                                                key={c}
                                                className="flex-shrink-0 rounded-[3px] sm:rounded cursor-pointer relative"
                                                style={{
                                                    width: 32,
                                                    height: 28,
                                                    minWidth: 32,
                                                    margin: 1,
                                                    background: weightToColor(w),
                                                    boxShadow: isExact
                                                        ? `0 0 12px -2px rgba(34,211,238,0.5), inset 0 0 0 1.5px rgba(34,211,238,0.6)`
                                                        : isLockedRow
                                                            ? weightToGlow(w)
                                                            : isCrosshair
                                                                ? "inset 0 0 0 1px rgba(255,255,255,0.12)"
                                                                : "none",
                                                    transition: "box-shadow 0.15s, background 0.15s",
                                                }}
                                                onMouseEnter={() => setHoveredCell({ r, c })}
                                                onMouseLeave={() => setHoveredCell(null)}
                                                onClick={() => setLockedRow(lockedRow === r ? null : r)}
                                                initial={{ opacity: 0, scale: 0.6 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{
                                                    delay: r * 0.03 + c * 0.015,
                                                    duration: 0.25,
                                                    type: "spring",
                                                    stiffness: 200,
                                                    damping: 18,
                                                }}
                                            >
                                                {isExact && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-white/90 font-bold z-10">
                                                        {Math.round(w * 100)}
                                                    </span>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom panel: hover tooltip / locked row caption / idle hint */}
            <AnimatePresence mode="wait">
                {hoveredCell && !lockedRow ? (
                    <motion.div
                        key="hover"
                        className="text-center"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.12 }}
                    >
                        <span className="text-[13px] font-medium text-cyan-300/60">{WORDS[hoveredCell.r]}</span>
                        <span className="text-[11px] text-white/20 mx-1.5">→</span>
                        <span className="text-[13px] font-medium text-cyan-300/60">{WORDS[hoveredCell.c]}</span>
                        <span className="text-[11px] text-white/15 mx-1.5">·</span>
                        <span className="text-[12px] font-mono text-white/40 tabular-nums">{Math.round(ATTENTION[hoveredCell.r][hoveredCell.c] * 100)}%</span>
                    </motion.div>
                ) : lockedRow !== null ? (
                    <motion.div
                        key={`locked-${lockedRow}`}
                        className="space-y-2.5 max-w-md mx-auto"
                        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Inline dot-strength caption (same style as SpotlightViz) */}
                        <div className="flex items-center justify-center gap-x-3 gap-y-1.5 flex-wrap">
                            {barData.map(({ w, i }) => {
                                const maxW = barData[0]?.w || 1;
                                const rel = w / maxW;
                                const dotSize = Math.round(3 + rel * 5);
                                return (
                                    <motion.span
                                        key={i}
                                        className="inline-flex items-center gap-1"
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <span
                                            className="rounded-full shrink-0"
                                            style={{
                                                width: dotSize,
                                                height: dotSize,
                                                background: `rgba(34,211,238, ${(0.25 + rel * 0.55).toFixed(2)})`,
                                                boxShadow: rel > 0.5 ? `0 0 ${dotSize * 2}px rgba(34,211,238, ${(rel * 0.25).toFixed(2)})` : "none",
                                            }}
                                        />
                                        <span
                                            className="text-[12px] sm:text-[13px] font-medium"
                                            style={{ color: `rgba(255,255,255, ${(0.25 + rel * 0.4).toFixed(2)})` }}
                                        >
                                            {WORDS[i]}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/15 tabular-nums">
                                            {Math.round(w * 100)}%
                                        </span>
                                    </motion.span>
                                );
                            })}
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={() => setLockedRow(null)}
                                className="text-[10px] text-white/15 hover:text-white/30 transition-colors cursor-pointer"
                            >
                                click row again to dismiss
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.p
                        key="hint"
                        className="text-center text-[12px] text-white/20 italic"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Hover to explore · Click a row to see its connections
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Color legend */}
            <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-[9px] text-white/20">Low</span>
                <div className="flex gap-px">
                    {[0.03, 0.08, 0.13, 0.18, 0.25, 0.35, 0.45, 0.55].map((w, i) => (
                        <div
                            key={i}
                            className="w-4 h-2 rounded-sm"
                            style={{ background: weightToColor(w) }}
                        />
                    ))}
                </div>
                <span className="text-[9px] text-white/20">High</span>
            </div>

            {/* Forward pointer */}
            <motion.div
                className="flex flex-col items-center gap-1.5 pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
            >
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                <div className="flex items-center gap-2 text-[11px] text-white/20">
                    <span>Now we use this recipe</span>
                    <span className="text-cyan-400/35 font-bold">→</span>
                    <span className="text-cyan-300/40 font-medium">to build new embeddings</span>
                </div>
            </motion.div>
        </div>
    );
}
