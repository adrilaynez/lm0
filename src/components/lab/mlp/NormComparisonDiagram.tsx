"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  NormComparisonDiagram
  Visual comparison: BatchNorm (normalize across batch / columns) vs
  LayerNorm (normalize within each example / rows).
  Shows a batch×features matrix with highlighted normalization axes.
  ~100 lines
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

export function NormComparisonDiagram() {
    const [mode, setMode] = useState<Mode>("batch");
    const [hovCol, setHovCol] = useState<number | null>(null);
    const [hovRow, setHovRow] = useState<number | null>(null);

    const isHighlighted = (r: number, c: number): boolean => {
        if (mode === "batch") return hovCol !== null && c === hovCol;
        return hovRow !== null && r === hovRow;
    };

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Toggle */}
            <div className="flex justify-center">
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                    <button
                        onClick={() => setMode("batch")}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all ${
                            mode === "batch"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                    >
                        BatchNorm
                    </button>
                    <button
                        onClick={() => setMode("layer")}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all border-l border-white/10 ${
                            mode === "layer"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                    >
                        LayerNorm
                    </button>
                </div>
            </div>

            {/* Description */}
            <p className="text-center text-[10px] font-mono text-white/30">
                {mode === "batch"
                    ? "Normalizes each FEATURE across the batch (↓ vertical). Depends on batch size."
                    : "Normalizes each EXAMPLE across its features (→ horizontal). Works with batch=1."
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
                                className="w-12 text-center text-[8px] font-mono text-white/20 pb-1"
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
                            className="flex items-center"
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
                                return (
                                    <motion.div
                                        key={`${r}-${c}`}
                                        className="w-12 h-8 flex items-center justify-center text-[9px] font-mono border border-white/[0.04] m-px rounded-sm"
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
                                        {v.toFixed(1)}
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

            {/* Key insight */}
            <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center text-[10px] font-mono ${mode === "batch" ? "text-amber-400/50" : "text-emerald-400/50"}`}
            >
                {mode === "batch"
                    ? "Problem: needs multiple examples → breaks with batch=1 at inference"
                    : "Each token normalizes its OWN features → works with any batch size"
                }
            </motion.div>
        </div>
    );
}
