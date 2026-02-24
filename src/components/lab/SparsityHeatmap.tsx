"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Grid3X3, AlertTriangle } from "lucide-react";
import { useI18n } from "@/i18n/context";

/* ─────────────────────────────────────────────
   E8 — Sparsity Heatmap

   Visual grid showing filled vs empty cells in an N-gram
   probability table. For N=1 (bigram), shows a mostly-filled
   8×8 grid. For higher N, shows increasingly sparse grids
   with dramatic empty space.

   Uses a simplified 8×8 visual (mapping to 8 representative
   character groups) to make the concept tangible.
   ───────────────────────────────────────────── */

const CHAR_GROUPS = ["a-c", "d-g", "h-l", "m-p", "q-t", "u-z", "SPC", ".,!"];

// Simulated fill rates for each N. These represent realistic
// proportions based on English text statistics.
const FILL_DATA: Record<number, number[][]> = {
    1: [
        // Bigram: mostly filled (~60-80% of cells have data)
        [0.9, 0.7, 0.8, 0.7, 0.8, 0.6, 0.9, 0.4],
        [0.7, 0.5, 0.6, 0.5, 0.7, 0.4, 0.8, 0.3],
        [0.8, 0.6, 0.7, 0.6, 0.8, 0.5, 0.9, 0.3],
        [0.7, 0.5, 0.6, 0.4, 0.6, 0.4, 0.8, 0.2],
        [0.9, 0.7, 0.8, 0.7, 0.9, 0.6, 0.9, 0.4],
        [0.5, 0.3, 0.4, 0.3, 0.5, 0.2, 0.6, 0.1],
        [0.9, 0.5, 0.7, 0.6, 0.8, 0.4, 0.2, 0.5],
        [0.3, 0.1, 0.2, 0.1, 0.3, 0.1, 0.5, 0.05],
    ],
    2: [
        // Trigram: noticeably sparser (~15-30%)
        [0.4, 0.2, 0.3, 0.2, 0.3, 0.1, 0.4, 0.05],
        [0.2, 0.08, 0.1, 0.08, 0.15, 0.05, 0.2, 0.02],
        [0.3, 0.15, 0.2, 0.1, 0.25, 0.08, 0.3, 0.03],
        [0.2, 0.07, 0.1, 0.05, 0.1, 0.04, 0.15, 0.01],
        [0.35, 0.18, 0.25, 0.15, 0.3, 0.1, 0.35, 0.04],
        [0.1, 0.03, 0.05, 0.02, 0.08, 0.01, 0.1, 0.005],
        [0.4, 0.1, 0.2, 0.1, 0.25, 0.05, 0.02, 0.08],
        [0.05, 0.01, 0.02, 0.005, 0.03, 0.002, 0.08, 0.001],
    ],
    3: [
        // 4-gram: very sparse (~2-5%)
        [0.08, 0.02, 0.04, 0.02, 0.05, 0.01, 0.06, 0.003],
        [0.02, 0.005, 0.008, 0.004, 0.01, 0.002, 0.02, 0.001],
        [0.04, 0.01, 0.02, 0.008, 0.03, 0.005, 0.04, 0.002],
        [0.02, 0.003, 0.005, 0.002, 0.008, 0.001, 0.01, 0.0005],
        [0.06, 0.015, 0.03, 0.01, 0.04, 0.008, 0.05, 0.003],
        [0.008, 0.001, 0.002, 0.0008, 0.005, 0.0003, 0.006, 0.0001],
        [0.06, 0.008, 0.015, 0.006, 0.02, 0.003, 0.001, 0.005],
        [0.003, 0.0005, 0.001, 0.0002, 0.002, 0.0001, 0.005, 0.00005],
    ],
    4: [
        // 5-gram: almost completely empty (<0.5%)
        [0.005, 0.001, 0.002, 0.0008, 0.003, 0.0005, 0.004, 0.0001],
        [0.001, 0.0002, 0.0004, 0.0001, 0.0006, 0.00008, 0.001, 0.00003],
        [0.002, 0.0005, 0.001, 0.0003, 0.0015, 0.0002, 0.002, 0.00005],
        [0.0008, 0.0001, 0.0002, 0.00006, 0.0003, 0.00004, 0.0006, 0.00001],
        [0.003, 0.0008, 0.0015, 0.0005, 0.002, 0.0003, 0.003, 0.00008],
        [0.0003, 0.00005, 0.0001, 0.00003, 0.0002, 0.00001, 0.0003, 0.000005],
        [0.004, 0.0003, 0.0008, 0.0002, 0.001, 0.0001, 0.00005, 0.0002],
        [0.0001, 0.00002, 0.00005, 0.00001, 0.00008, 0.000005, 0.0002, 0.000002],
    ],
};

function cellColor(value: number): string {
    if (value >= 0.7) return "bg-emerald-600/50";
    if (value >= 0.4) return "bg-emerald-700/40";
    if (value >= 0.2) return "bg-amber-600/30";
    if (value >= 0.05) return "bg-amber-700/20";
    if (value >= 0.01) return "bg-red-700/18";
    if (value > 0.001) return "bg-red-800/10";
    return "bg-white/[0.02]";
}

function computeOverallFill(grid: number[][]): number {
    const total = grid.length * grid[0].length;
    const filled = grid.flat().filter((v) => v >= 0.01).length;
    return (filled / total) * 100;
}

export function SparsityHeatmap() {
    const { t } = useI18n();
    const [selectedN, setSelectedN] = useState(1);

    const grid = FILL_DATA[selectedN] ?? FILL_DATA[1];
    const overallFill = useMemo(() => computeOverallFill(grid), [grid]);

    const ngramName = selectedN === 1 ? "Bigram" : selectedN === 2 ? "Trigram" : selectedN === 3 ? "4-gram" : "5-gram";
    const tableEntries = Math.pow(96, selectedN).toLocaleString();

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15">
                    <Grid3X3 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                        {t("ngram.widgets.sparsityHeatmap.title")}
                    </h4>
                    <p className="text-[10px] text-white/40">
                        {t("ngram.widgets.sparsityHeatmap.subtitle")}
                    </p>
                </div>
            </div>

            {/* N selector */}
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((n) => {
                    const active = n === selectedN;
                    const label = n === 1 ? "Bigram" : n === 2 ? "Trigram" : n === 3 ? "4-gram" : "5-gram";
                    return (
                        <button
                            key={n}
                            onClick={() => setSelectedN(n)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors border ${active
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50"
                                }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                    <span className="text-white/40">
                        <span className="font-mono text-white/60">{ngramName}</span> · {tableEntries} {t("ngram.widgets.sparsityHeatmap.entriesSuffix")}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-white/30 font-bold">{t("ngram.widgets.sparsityHeatmap.fill")}</span>
                    <span className={`font-mono font-bold ${overallFill > 50 ? "text-emerald-400" : overallFill > 15 ? "text-amber-400" : "text-red-400"}`}>
                        {overallFill.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Heatmap grid */}
            <div className="rounded-xl border border-white/[0.08] bg-black/30 p-4 overflow-hidden">
                {/* Column labels */}
                <div className="flex mb-1 pl-12">
                    {CHAR_GROUPS.map((label) => (
                        <div key={label} className="flex-1 text-center text-[8px] font-mono text-white/25">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Grid rows */}
                <div className="space-y-1">
                    {grid.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex items-center gap-1">
                            {/* Row label */}
                            <span className="w-10 text-right text-[8px] font-mono text-white/25 shrink-0 pr-1">
                                {CHAR_GROUPS[rowIdx]}
                            </span>
                            {/* Cells */}
                            <div className="flex-1 flex gap-0.5">
                                {row.map((value, colIdx) => (
                                    <motion.div
                                        key={`${selectedN}-${rowIdx}-${colIdx}`}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            delay: (rowIdx * 8 + colIdx) * 0.008,
                                            duration: 0.25,
                                        }}
                                        className={`flex-1 aspect-square rounded-sm ${cellColor(value)} transition-colors`}
                                        title={`${CHAR_GROUPS[rowIdx]} → ${CHAR_GROUPS[colIdx]}: ${(value * 100).toFixed(1)}% filled`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-white/[0.04]">
                    <span className="text-[9px] text-white/25 font-bold uppercase tracking-widest">{t("ngram.widgets.sparsityHeatmap.density")}</span>
                    {[
                        { color: "bg-emerald-600/50", label: t("ngram.widgets.sparsityHeatmap.legend.high") },
                        { color: "bg-amber-600/30", label: t("ngram.widgets.sparsityHeatmap.legend.medium") },
                        { color: "bg-red-700/18", label: t("ngram.widgets.sparsityHeatmap.legend.low") },
                        { color: "bg-white/[0.03] border border-white/[0.06]", label: t("ngram.widgets.sparsityHeatmap.legend.empty") },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                            <span className="text-[9px] text-white/30">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Insight */}
            <motion.div
                key={selectedN}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3"
            >
                {selectedN <= 1 ? (
                    <p className="text-xs text-white/40 leading-relaxed">
                        {t("ngram.widgets.sparsityHeatmap.insights.n1")}
                    </p>
                ) : selectedN === 2 ? (
                    <>
                        <AlertTriangle className="w-4 h-4 text-amber-400/60 shrink-0 mt-0.5" />
                        <p className="text-xs text-white/40 leading-relaxed">
                            {t("ngram.widgets.sparsityHeatmap.insights.n2")}
                        </p>
                    </>
                ) : selectedN === 3 ? (
                    <>
                        <AlertTriangle className="w-4 h-4 text-red-400/60 shrink-0 mt-0.5" />
                        <p className="text-xs text-white/40 leading-relaxed">
                            {t("ngram.widgets.sparsityHeatmap.insights.n3")}
                        </p>
                    </>
                ) : (
                    <>
                        <AlertTriangle className="w-4 h-4 text-red-400/60 shrink-0 mt-0.5" />
                        <p className="text-xs text-white/40 leading-relaxed">
                            {t("ngram.widgets.sparsityHeatmap.insights.n4")}
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}
