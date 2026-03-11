"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  BatchVsLayerNormViz (Redesign v3)
  Visual grid: batch of sentences × dimensions.
  - BatchNorm: highlights a COLUMN (normalize across batch) — bad for language
  - LayerNorm: highlights a ROW (normalize within one token) — correct for language
  - Toggle animates which axis gets highlighted
  - Clear explanation of why BatchNorm fails for variable-length language
*/

type NormMode = "batch" | "layer";

/* 4 sentences × 5 dimensions — values represent activations */
const SENTENCES = ["The cat sat", "I love dogs", "Why not?", "She quickly ran away"];
const DIMS = ["d₁", "d₂", "d₃", "d₄", "d₅"];

/* Raw activation values per sentence × dim */
const GRID: number[][] = [
    [120, -45, 200, 10, -80],
    [30, 160, -20, 90, 5],
    [300, 10, 40, -150, 70],
    [-60, 80, 110, 45, 190],
];

/* Cell color intensity based on value */
function cellOpacity(val: number): number {
    const maxV = 300;
    return Math.min(Math.abs(val) / maxV, 1) * 0.7 + 0.1;
}

function cellColor(val: number, accent: string): string {
    const op = cellOpacity(val);
    return val >= 0 ? `rgba(${accent},${op})` : `rgba(244,63,94,${op * 0.7})`;
}

export function BatchVsLayerNormViz() {
    const [mode, setMode] = useState<NormMode>("layer");
    const [hoverRow, setHoverRow] = useState<number | null>(null);
    const [hoverCol, setHoverCol] = useState<number | null>(null);

    const isLayer = mode === "layer";
    const accent = isLayer ? "34,211,238" : "251,191,36";
    const accentHex = isLayer ? "#22d3ee" : "#fbbf24";

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-6">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {([
                    { m: "layer" as NormMode, l: "LayerNorm", c: "#22d3ee", r: "34,211,238" },
                    { m: "batch" as NormMode, l: "BatchNorm", c: "#fbbf24", r: "251,191,36" },
                ]).map(({ m, l, c, r }) => {
                    const active = mode === m;
                    return (
                        <motion.button key={m} onClick={() => setMode(m)}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer"
                            style={{
                                background: active ? `rgba(${r},0.12)` : "rgba(255,255,255,0.03)",
                                color: active ? c : "rgba(255,255,255,0.25)",
                                border: `1.5px solid ${active ? `rgba(${r},0.3)` : "rgba(255,255,255,0.06)"}`,
                            }}>{l}</motion.button>
                    );
                })}
            </div>

            {/* Grid visualization */}
            <div className="max-w-md mx-auto overflow-x-auto">
                <table className="mx-auto border-separate" style={{ borderSpacing: 3 }}>
                    {/* Header row — dimensions */}
                    <thead>
                        <tr>
                            <th className="w-24" />
                            {DIMS.map((dim, ci) => {
                                const colHighlighted = !isLayer && (hoverCol === ci || hoverCol === null);
                                return (
                                    <th key={ci} className="text-center px-1 pb-1">
                                        <motion.span
                                            className="text-[11px] font-mono font-bold"
                                            animate={{
                                                color: colHighlighted && !isLayer
                                                    ? accentHex : "rgba(255,255,255,0.2)",
                                            }}
                                        >
                                            {dim}
                                        </motion.span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {SENTENCES.map((sentence, ri) => {
                            const rowHighlighted = isLayer && (hoverRow === ri || hoverRow === null);
                            return (
                                <tr key={ri}
                                    onMouseEnter={() => { setHoverRow(ri); setHoverCol(null); }}
                                    onMouseLeave={() => setHoverRow(null)}
                                >
                                    {/* Sentence label */}
                                    <td className="pr-2 text-right">
                                        <motion.span
                                            className="text-[11px] font-semibold whitespace-nowrap"
                                            animate={{
                                                color: rowHighlighted && isLayer
                                                    ? accentHex : "rgba(255,255,255,0.25)",
                                            }}
                                        >
                                            {sentence}
                                        </motion.span>
                                    </td>

                                    {/* Cells */}
                                    {GRID[ri].map((val, ci) => {
                                        const highlighted = isLayer ? rowHighlighted : (!isLayer && (hoverCol === ci || hoverCol === null));
                                        const dimmed = isLayer
                                            ? (hoverRow !== null && hoverRow !== ri)
                                            : (hoverCol !== null && hoverCol !== ci);

                                        return (
                                            <td key={ci}
                                                onMouseEnter={() => { if (!isLayer) setHoverCol(ci); }}
                                                onMouseLeave={() => { if (!isLayer) setHoverCol(null); }}
                                            >
                                                <motion.div
                                                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center cursor-default"
                                                    animate={{
                                                        background: cellColor(val, highlighted ? accent : "255,255,255"),
                                                        opacity: dimmed ? 0.3 : 1,
                                                        scale: highlighted && !dimmed ? 1.02 : 1,
                                                    }}
                                                    transition={{ type: "spring", stiffness: 150, damping: 16 }}
                                                    style={{
                                                        border: highlighted && !dimmed
                                                            ? `1.5px solid rgba(${accent},0.3)`
                                                            : "1px solid rgba(255,255,255,0.04)",
                                                    }}
                                                >
                                                    <span className="text-[10px] font-mono font-bold text-white/50">
                                                        {val}
                                                    </span>
                                                </motion.div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Direction indicator */}
            <div className="flex items-center justify-center mt-4 gap-2">
                <motion.div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{
                        background: `rgba(${accent},0.08)`,
                        border: `1px solid rgba(${accent},0.15)`,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        {isLayer ? (
                            <path d="M2 8h12M11 5l3 3-3 3" stroke={accentHex} strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                            <path d="M8 2v12M5 11l3 3 3-3" stroke={accentHex} strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round" />
                        )}
                    </svg>
                    <span className="text-[11px] font-semibold" style={{ color: accentHex }}>
                        {isLayer ? "Normalize across dimensions (→ row)" : "Normalize across batch (↓ column)"}
                    </span>
                </motion.div>
            </div>

            {/* Explanation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    className="max-w-sm mx-auto mt-4 space-y-2 text-center"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {isLayer ? (
                        <>
                            <p className="text-[13px] font-semibold" style={{ color: "rgba(34,211,238,0.55)" }}>
                                LayerNorm normalizes each token independently
                            </p>
                            <p className="text-[12px] text-white/25 leading-relaxed">
                                Each row is normalized on its own — no dependency on other sentences.
                                Works perfectly for variable-length sequences.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-[13px] font-semibold" style={{ color: "rgba(251,191,36,0.55)" }}>
                                BatchNorm averages across different sentences
                            </p>
                            <p className="text-[12px] text-white/25 leading-relaxed">
                                Each column is normalized across the batch.
                                {" \u201C"}The cat sat{"\u201D"} and {"\u201C"}Why not?{"\u201D"} are wildly different
                                — averaging their statistics makes no sense for language.
                            </p>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
