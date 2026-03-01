"use client";

import { memo, useState } from "react";

import { motion } from "framer-motion";

import { useI18n } from "@/i18n/context";

const VOCAB = ["t", "h", "e", "a", " "];
const DISPLAY = { " ": "·" } as Record<string, string>;

// Hardcoded 5×5 transition probabilities [row=current][col=next]
// Based on real English character statistics
const MATRIX: number[][] = [
    // t     h     e     a    " "
    [0.02, 0.52, 0.19, 0.05, 0.06], // after t
    [0.03, 0.01, 0.49, 0.14, 0.04], // after h
    [0.06, 0.02, 0.03, 0.10, 0.37], // after e
    [0.15, 0.02, 0.04, 0.02, 0.22], // after a
    [0.18, 0.05, 0.09, 0.14, 0.03], // after " "
];

function cellColor(prob: number): string {
    if (prob >= 0.40) return "bg-emerald-400 text-black";
    if (prob >= 0.25) return "bg-emerald-500/70 text-white";
    if (prob >= 0.15) return "bg-emerald-600/50 text-white";
    if (prob >= 0.08) return "bg-emerald-700/40 text-white/80";
    if (prob >= 0.03) return "bg-emerald-900/50 text-white/50";
    return "bg-white/[0.03] text-white/20";
}

// Simulated raw counts (probabilities × a plausible row total)
const ROW_TOTALS = [4200, 3800, 5100, 2900, 6200];
const RAW_COUNTS: number[][] = MATRIX.map((row, ri) =>
    row.map((prob) => Math.round(prob * ROW_TOTALS[ri]))
);

export const TinyMatrixExample = memo(function TinyMatrixExample({ showCounts = false }: { showCounts?: boolean }) {
    const { t } = useI18n();
    const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

    const hovRow = hovered ? VOCAB[hovered.row] : null;
    const hovCol = hovered ? VOCAB[hovered.col] : null;
    const hovProb = hovered ? MATRIX[hovered.row][hovered.col] : null;

    return (
        <div className="space-y-5">
            {/* Tooltip / explanation line */}
            <div className="h-8 flex items-center justify-center">
                <AnimatedTooltip
                    hovRow={hovRow}
                    hovCol={hovCol}
                    hovProb={hovProb}
                    hovCount={hovered ? RAW_COUNTS[hovered.row][hovered.col] : null}
                    showCounts={showCounts}
                    fallback={t("bigramNarrative.mechanics.tinyMatrixHover")}
                    t={t}
                />
            </div>

            {/* Matrix grid */}
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Column headers */}
                    <div className="flex ml-16 mb-1">
                        {VOCAB.map((col) => (
                            <div key={col} className="w-14 text-center text-[10px] font-mono font-bold text-white/35 uppercase tracking-widest">
                                {DISPLAY[col] ?? col}
                            </div>
                        ))}
                    </div>
                    <div className="text-center text-[9px] font-mono uppercase tracking-widest text-white/20 ml-16 mb-3">
                        {t("bigramNarrative.mechanics.tinyMatrixColLabel")}
                    </div>

                    {/* Rows */}
                    <div className="flex">
                        {/* Row label column */}
                        <div className="flex flex-col mr-4 justify-center">
                            <div
                                className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1"
                                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: `${VOCAB.length * 56}px`, display: "flex", alignItems: "center" }}
                            >
                                {t("bigramNarrative.mechanics.tinyMatrixRowLabel")}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            {VOCAB.map((row, ri) => (
                                <div key={row} className="flex items-center gap-1">
                                    {/* Row header */}
                                    <div className="w-10 text-right pr-3 text-[10px] font-mono font-bold text-white/35 uppercase tracking-widest">
                                        {DISPLAY[row] ?? row}
                                    </div>
                                    {/* Cells */}
                                    {VOCAB.map((col, ci) => {
                                        const prob = MATRIX[ri][ci];
                                        const isHovRow = hovered?.row === ri;
                                        const isHovCol = hovered?.col === ci;
                                        const isActive = hovered?.row === ri && hovered?.col === ci;
                                        return (
                                            <motion.button
                                                key={col}
                                                onMouseEnter={() => setHovered({ row: ri, col: ci })}
                                                onMouseLeave={() => setHovered(null)}
                                                whileHover={{ scale: 1.15 }}
                                                transition={{ duration: 0.12 }}
                                                className={`w-14 h-12 rounded-lg font-mono text-sm font-bold transition-all duration-150 border ${isActive
                                                    ? `${cellColor(prob)} ring-2 ring-emerald-400 ring-offset-1 ring-offset-black border-transparent`
                                                    : `${cellColor(prob)} border-white/[0.06] ${isHovRow || isHovCol ? "brightness-125" : ""}`
                                                    }`}
                                            >
                                                {showCounts ? RAW_COUNTS[ri][ci] : `${Math.round(prob * 100)}%`}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-emerald-400" />
                    <span className="text-[10px] text-white/30 font-mono">{t("bigramNarrative.mechanics.tinyMatrixHigh")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-emerald-900/50" />
                    <span className="text-[10px] text-white/30 font-mono">{t("bigramNarrative.mechanics.tinyMatrixLow")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-white/[0.03] border border-white/10" />
                    <span className="text-[10px] text-white/30 font-mono">{t("bigramNarrative.mechanics.tinyMatrixRare")}</span>
                </div>
            </div>
        </div>
    );
});

function AnimatedTooltip({
    hovRow, hovCol, hovProb, fallback, t, showCounts, hovCount,
}: {
    hovRow: string | null;
    hovCol: string | null;
    hovProb: number | null;
    fallback: string;
    t: (key: string) => string;
    showCounts?: boolean;
    hovCount?: number | null;
}) {
    if (hovRow === null || hovCol === null || hovProb === null) {
        return <p className="text-xs text-white/20 italic">{fallback}</p>;
    }

    const displayRow = hovRow === " " ? "·" : `'${hovRow}'`;
    const displayCol = hovCol === " " ? "·" : `'${hovCol}'`;
    const pct = Math.round(hovProb * 100);

    const templateKey = showCounts
        ? "bigramNarrative.mechanics.tinyMatrixCountTooltip"
        : "bigramNarrative.mechanics.tinyMatrixTooltip";
    const parts = t(templateKey)
        .split(/(\{row\}|\{col\}|\{pct\}|\{count\})/);

    return (
        <motion.p
            key={`${hovRow}-${hovCol}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-white/70 text-center"
        >
            {parts.map((part, i) => {
                if (part === "{row}") return <span key={i} className="font-mono font-bold text-emerald-400">{displayRow}</span>;
                if (part === "{col}") return <span key={i} className="font-mono font-bold text-white">{displayCol}</span>;
                if (part === "{pct}") return <span key={i} className="font-mono font-bold text-emerald-400">{pct}%</span>;
                if (part === "{count}") return <span key={i} className="font-mono font-bold text-emerald-400">{hovCount ?? 0}</span>;
                return <span key={i}>{part}</span>;
            })}
        </motion.p>
    );
}
