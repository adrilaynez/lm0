"use client";

import { useState, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  NormComparisonDiagram — v2
  Visual comparison: BatchNorm (normalize across batch / columns) vs
  LayerNorm (normalize within each example / rows).
  Shows a batch×features matrix with highlighted normalization axes.
  Now includes: computed μ/σ stats, normalized values, inference comparison.
  ~220 lines
*/

const BATCH = 4;
const FEATURES = 5;

// Mock activation values
const DATA = [
    [2.1, -0.8, 5.3, 1.2, -2.0],
    [0.5, 3.1, -1.4, 0.8, 1.7],
    [-1.2, 0.3, 4.8, -0.5, -3.1],
    [1.8, -2.4, 3.2, 2.0, 0.1],
];

type Mode = "batch" | "layer";

function mean(arr: number[]): number { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function std(arr: number[]): number {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}
function normalize(v: number, m: number, s: number): number { return s === 0 ? 0 : (v - m) / s; }

export function NormComparisonDiagram() {
    const [mode, setMode] = useState<Mode>("batch");
    const [hovCol, setHovCol] = useState<number | null>(null);
    const [hovRow, setHovRow] = useState<number | null>(null);
    const [showNormalized, setShowNormalized] = useState(false);

    const isHighlighted = (r: number, c: number): boolean => {
        if (mode === "batch") return hovCol !== null && c === hovCol;
        return hovRow !== null && r === hovRow;
    };

    // Pre-compute stats for each column (BN) and each row (LN)
    const colStats = useMemo(() => Array.from({ length: FEATURES }, (_, c) => {
        const col = DATA.map(row => row[c]);
        return { mean: mean(col), std: std(col) };
    }), []);

    const rowStats = useMemo(() => DATA.map(row => ({
        mean: mean(row), std: std(row),
    })), []);

    const activeStats = mode === "batch" && hovCol !== null
        ? colStats[hovCol]
        : mode === "layer" && hovRow !== null
            ? rowStats[hovRow]
            : null;

    const getNormalizedValue = (r: number, c: number): number => {
        if (mode === "batch") return normalize(DATA[r][c], colStats[c].mean, colStats[c].std);
        return normalize(DATA[r][c], rowStats[r].mean, rowStats[r].std);
    };

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                    <button
                        onClick={() => { setMode("batch"); setHovCol(null); setHovRow(null); }}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all ${mode === "batch"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-white/[0.02] text-white/30 hover:text-white/50"
                            }`}
                    >
                        BatchNorm
                    </button>
                    <button
                        onClick={() => { setMode("layer"); setHovCol(null); setHovRow(null); }}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all border-l border-white/10 ${mode === "layer"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/[0.02] text-white/30 hover:text-white/50"
                            }`}
                    >
                        LayerNorm
                    </button>
                </div>
                <button
                    onClick={() => setShowNormalized(n => !n)}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold border transition-all ${showNormalized
                            ? "bg-violet-500/15 border-violet-500/25 text-violet-400"
                            : "bg-white/[0.02] border-white/10 text-white/25 hover:text-white/40"
                        }`}
                >
                    {showNormalized ? "Normalized" : "Raw values"}
                </button>
            </div>

            {/* Description */}
            <p className="text-center text-[10px] font-mono text-white/30">
                {mode === "batch"
                    ? "Normalizes each FEATURE across the batch (↓ vertical). Hover a column to see stats."
                    : "Normalizes each EXAMPLE across its features (→ horizontal). Hover a row to see stats."
                }
            </p>

            {/* Matrix */}
            <div className="flex justify-center">
                <div className="inline-block">
                    {/* Column headers */}
                    <div className="flex ml-16">
                        {Array.from({ length: FEATURES }).map((_, c) => (
                            <div
                                key={c}
                                className="w-12 text-center text-[8px] font-mono text-white/20 pb-1 cursor-pointer"
                                onMouseEnter={() => mode === "batch" ? setHovCol(c) : null}
                                onMouseLeave={() => setHovCol(null)}
                            >
                                f{c + 1}
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {DATA.map((row, r) => (
                        <div
                            key={r}
                            className="flex items-center cursor-pointer"
                            onMouseEnter={() => mode === "layer" ? setHovRow(r) : null}
                            onMouseLeave={() => setHovRow(null)}
                        >
                            {/* Row label */}
                            <span className="w-16 text-right pr-2 text-[8px] font-mono text-white/20">
                                ex {r + 1}
                            </span>
                            {row.map((v, c) => {
                                const lit = isHighlighted(r, c);
                                const accentColor = mode === "batch" ? "#f59e0b" : "#22c55e";
                                const normV = getNormalizedValue(r, c);
                                const displayV = showNormalized ? normV : v;
                                return (
                                    <motion.div
                                        key={`${r}-${c}-${showNormalized}`}
                                        className="w-12 h-8 flex items-center justify-center text-[9px] font-mono border border-white/[0.04] m-px rounded-sm tabular-nums"
                                        animate={{
                                            backgroundColor: lit ? `${accentColor}20` : "rgba(255,255,255,0.015)",
                                            borderColor: lit ? `${accentColor}40` : "rgba(255,255,255,0.04)",
                                            color: lit ? accentColor : "rgba(255,255,255,0.3)",
                                        }}
                                        transition={{ duration: 0.2 }}
                                        onMouseEnter={() => {
                                            if (mode === "batch") setHovCol(c);
                                            else setHovRow(r);
                                        }}
                                        onMouseLeave={() => { setHovCol(null); setHovRow(null); }}
                                    >
                                        {showNormalized ? (normV >= 0 ? "+" : "") + normV.toFixed(2) : v.toFixed(1)}
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Normalization direction arrows */}
                    <div className="mt-2 flex items-center justify-center gap-2 text-[9px] font-mono">
                        {mode === "batch" ? (
                            <span className="text-amber-400/60">↓ normalize each column (across batch)</span>
                        ) : (
                            <span className="text-emerald-400/60">→ normalize each row (within example)</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats panel when hovering */}
            <AnimatePresence mode="wait">
                {activeStats && (
                    <motion.div
                        key={`stats-${mode}-${hovCol}-${hovRow}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-lg border p-2.5 flex items-center justify-center gap-6 text-[9px] font-mono"
                            style={{
                                borderColor: (mode === "batch" ? "#f59e0b" : "#22c55e") + "20",
                                backgroundColor: (mode === "batch" ? "#f59e0b" : "#22c55e") + "06",
                            }}
                        >
                            <span style={{ color: mode === "batch" ? "#f59e0b" : "#22c55e", opacity: 0.7 }}>
                                μ = {activeStats.mean.toFixed(3)}
                            </span>
                            <span style={{ color: mode === "batch" ? "#f59e0b" : "#22c55e", opacity: 0.7 }}>
                                σ = {activeStats.std.toFixed(3)}
                            </span>
                            <span className="text-white/20">
                                x̂ = (x − μ) / σ
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Key insight cards */}
            <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
            >
                <div className={`rounded-lg border p-2.5 text-[9px] font-mono ${mode === "batch"
                        ? "border-amber-500/15 bg-amber-500/[0.04] text-amber-400/60"
                        : "border-emerald-500/15 bg-emerald-500/[0.04] text-emerald-400/60"
                    }`}>
                    <p className="font-bold mb-1">
                        {mode === "batch" ? "BatchNorm: feature-wise statistics" : "LayerNorm: example-wise statistics"}
                    </p>
                    <p className="text-white/25 leading-relaxed">
                        {mode === "batch"
                            ? "Computes μ and σ for each feature ACROSS the batch. With batch=32, you get stable statistics. But at inference (batch=1), there's only ONE value per feature — you can't compute meaningful statistics. Solution: use running averages from training, which adds complexity and can cause train/test mismatch."
                            : "Computes μ and σ for each example across ITS OWN features. Each example normalizes itself independently — no dependency on other examples. Works identically with batch=1, batch=32, or batch=1024. This is why Transformers use LayerNorm."
                        }
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
