"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  MatrixProjectionViz — Shows HOW embedding × W matrix = Q or K
  Ultra-simple: 2 features in, 2 features out.
  The matrix re-weights features. User sees the multiplication step by step.
  No math notation — just colored bars and arrows.
*/

const WORDS: { word: string; emb: [number, number]; color: string }[] = [
    { word: "king", emb: [0.9, 0.3], color: "#22d3ee" },
    { word: "ruled", emb: [0.4, 0.9], color: "#34d399" },
];

/* W_Q matrix: amplifies action (row 2), dampens royalty for Query */
const W_Q: [[number, number], [number, number]] = [
    [0.2, 0.8],  // output feature 1 = 0.2 × royalty + 0.8 × action
    [0.9, 0.1],  // output feature 2 = 0.9 × royalty + 0.1 × action
];

/* W_K matrix: amplifies royalty for Key */
const W_K: [[number, number], [number, number]] = [
    [0.9, 0.1],  // output feature 1 = 0.9 × royalty + 0.1 × action
    [0.1, 0.9],  // output feature 2 = 0.1 × royalty + 0.9 × action
];

function matMul(emb: [number, number], W: [[number, number], [number, number]]): [number, number] {
    return [
        emb[0] * W[0][0] + emb[1] * W[0][1],
        emb[0] * W[1][0] + emb[1] * W[1][1],
    ];
}

const FEATURES = ["royalty", "action"];

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
    const w = Math.max(5, (Math.abs(value) / max) * 100);
    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-[10px] text-white/25 w-14 text-right shrink-0">{label}</span>}
            <div className="flex-1 h-5 rounded bg-white/[0.03] overflow-hidden" style={{ maxWidth: 120 }}>
                <motion.div
                    className="h-full rounded"
                    style={{ background: `linear-gradient(90deg, ${color}80, ${color}30)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${w}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>
            <span className="text-[10px] font-mono text-white/40 w-8 font-semibold">{value.toFixed(2)}</span>
        </div>
    );
}

export function MatrixProjectionViz() {
    const [wordIdx, setWordIdx] = useState(0);
    const [matrix, setMatrix] = useState<"Q" | "K">("Q");

    const { word, emb, color } = WORDS[wordIdx];
    const W = matrix === "Q" ? W_Q : W_K;
    const result = matMul(emb, W);
    const maxVal = 1.2;

    const matrixColor = matrix === "Q" ? "#22d3ee" : "#34d399";
    const matrixLabel = matrix === "Q" ? "W_Q" : "W_K";
    const roleLabel = matrix === "Q" ? "Query (what it needs)" : "Key (what it offers)";

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4 space-y-4" style={{ minHeight: 260 }}>
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider font-semibold">Word:</span>
                    {WORDS.map((w, i) => (
                        <motion.button
                            key={i}
                            onClick={() => setWordIdx(i)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{
                                background: wordIdx === i ? `${w.color}18` : "rgba(255,255,255,0.04)",
                                border: `1px solid ${wordIdx === i ? `${w.color}40` : "rgba(255,255,255,0.06)"}`,
                                color: wordIdx === i ? w.color : "rgba(255,255,255,0.4)",
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {w.word}
                        </motion.button>
                    ))}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider font-semibold">Matrix:</span>
                    {(["Q", "K"] as const).map(m => (
                        <motion.button
                            key={m}
                            onClick={() => setMatrix(m)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{
                                background: matrix === m
                                    ? `${m === "Q" ? "#22d3ee" : "#34d399"}18`
                                    : "rgba(255,255,255,0.04)",
                                border: `1px solid ${matrix === m
                                    ? `${m === "Q" ? "#22d3ee" : "#34d399"}40`
                                    : "rgba(255,255,255,0.06)"}`,
                                color: matrix === m
                                    ? (m === "Q" ? "#22d3ee" : "#34d399")
                                    : "rgba(255,255,255,0.4)",
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            W{m === "Q" ? "Q" : "K"}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Visual: Embedding → × Matrix → Result */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${wordIdx}-${matrix}`}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                    {/* Embedding */}
                    <div className="rounded-lg px-3 py-3 min-w-[140px]" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                        <p className="text-[9px] uppercase tracking-wider font-semibold text-center mb-2" style={{ color: `${color}80` }}>
                            Embedding
                        </p>
                        {FEATURES.map((f, i) => (
                            <Bar key={f} value={emb[i]} max={maxVal} color={color} label={f} />
                        ))}
                    </div>

                    {/* × symbol */}
                    <div className="text-white/15 text-lg font-bold">×</div>

                    {/* Matrix */}
                    <div className="rounded-lg px-3 py-3 min-w-[120px]" style={{ background: `${matrixColor}08`, border: `1px solid ${matrixColor}20` }}>
                        <p className="text-[9px] uppercase tracking-wider font-semibold text-center mb-2" style={{ color: `${matrixColor}80` }}>
                            {matrixLabel}
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                            {W.flat().map((v, i) => (
                                <motion.div
                                    key={i}
                                    className="w-10 h-8 rounded flex items-center justify-center"
                                    style={{
                                        background: `${matrixColor}${Math.round(v * 40).toString(16).padStart(2, "0")}`,
                                        border: `1px solid ${matrixColor}20`,
                                    }}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <span className="text-[10px] font-mono font-bold" style={{ color: `${matrixColor}bb` }}>
                                        {v.toFixed(1)}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                        <p className="text-[8px] text-white/15 text-center mt-1.5">
                            {matrix === "Q" ? "amplifies action" : "amplifies royalty"}
                        </p>
                    </div>

                    {/* = symbol */}
                    <div className="text-white/15 text-lg font-bold">=</div>

                    {/* Result */}
                    <div className="rounded-lg px-3 py-3 min-w-[140px]" style={{ background: `${matrixColor}08`, border: `1px solid ${matrixColor}20` }}>
                        <p className="text-[9px] uppercase tracking-wider font-semibold text-center mb-2" style={{ color: `${matrixColor}80` }}>
                            {matrix === "Q" ? "Query" : "Key"}
                        </p>
                        {FEATURES.map((f, i) => (
                            <Bar key={f} value={result[i]} max={maxVal} color={matrixColor} label={f} />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Explanation */}
            <motion.p
                className="text-center text-[10px] sm:text-[11px] text-white/25 italic max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                The matrix re-weights the features → {roleLabel}
            </motion.p>
        </div>
    );
}
