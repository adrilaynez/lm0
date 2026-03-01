"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  EmbeddingLookupAnimator
  Step-by-step animation: one-hot vector × Embedding matrix = embedding vector.
  Shows this is equivalent to a table lookup.
*/

const VOCAB = ["a", "b", "c", "d", "e", "f", "g"];
const V = VOCAB.length;
const D = 3; // embedding dimension for demo

// Hand-crafted small embedding matrix for illustration
const E_MATRIX: number[][] = [
    [0.82, -0.31, 0.55],   // a
    [-0.44, 0.67, -0.12],  // b
    [-0.21, 0.88, 0.34],   // c
    [0.15, -0.55, 0.91],   // d
    [0.78, -0.22, 0.48],   // e
    [-0.63, 0.11, -0.77],  // f
    [-0.38, 0.45, 0.29],   // g
];

type Stage = "select" | "onehot" | "multiply" | "result";

const STAGES: { id: Stage; label: string }[] = [
    { id: "select", label: "1. Select token" },
    { id: "onehot", label: "2. One-hot encode" },
    { id: "multiply", label: "3. Matrix multiply" },
    { id: "result", label: "4. Embedding vector" },
];

export function EmbeddingLookupAnimator() {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [stage, setStage] = useState<Stage>("select");

    const oneHot = Array.from({ length: V }, (_, i) => i === selectedIdx ? 1 : 0);
    const embedding = E_MATRIX[selectedIdx];

    const stageIdx = STAGES.findIndex(s => s.id === stage);

    const nextStage = () => {
        const next = stageIdx + 1;
        if (next < STAGES.length) {
            setStage(STAGES[next].id);
        }
    };

    const prevStage = () => {
        const prev = stageIdx - 1;
        if (prev >= 0) {
            setStage(STAGES[prev].id);
        }
    };

    const selectToken = (idx: number) => {
        setSelectedIdx(idx);
        setStage("select");
    };

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Stage indicator */}
            <div className="flex gap-1 items-center justify-center">
                {STAGES.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1">
                        <div
                            className="px-2 py-1 rounded text-[9px] font-mono transition-colors"
                            style={{
                                backgroundColor: i <= stageIdx ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
                                color: i <= stageIdx ? "#a78bfa" : "rgba(255,255,255,0.2)",
                                fontWeight: i === stageIdx ? 700 : 400,
                            }}
                        >
                            {s.label}
                        </div>
                        {i < STAGES.length - 1 && (
                            <span className="text-white/10 text-[10px]">→</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Token selector - always visible */}
            <div className="flex items-center gap-2 justify-center">
                <span className="text-[10px] font-mono text-white/30">Token:</span>
                {VOCAB.map((ch, i) => (
                    <button
                        key={ch}
                        onClick={() => selectToken(i)}
                        className="w-8 h-8 rounded-lg text-sm font-mono font-bold transition-all"
                        style={{
                            backgroundColor: i === selectedIdx ? "#a78bfa25" : "rgba(255,255,255,0.03)",
                            color: i === selectedIdx ? "#a78bfa" : "rgba(255,255,255,0.3)",
                            borderWidth: 1,
                            borderColor: i === selectedIdx ? "#a78bfa50" : "rgba(255,255,255,0.06)",
                        }}
                    >
                        {ch}
                    </button>
                ))}
            </div>

            {/* Visualization area */}
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 min-h-[180px] flex items-center justify-center gap-4 flex-wrap">
                {/* One-hot vector */}
                {(stage === "onehot" || stage === "multiply" || stage === "result") && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col items-center gap-1"
                    >
                        <span className="text-[9px] font-mono text-white/25 mb-1">one-hot</span>
                        {oneHot.map((val, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="w-8 h-5 rounded-sm flex items-center justify-center text-[10px] font-mono"
                                style={{
                                    backgroundColor: val === 1 ? "#a78bfa25" : "rgba(255,255,255,0.03)",
                                    color: val === 1 ? "#a78bfa" : "rgba(255,255,255,0.15)",
                                    fontWeight: val === 1 ? 700 : 400,
                                }}
                            >
                                {val}
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* × symbol */}
                {(stage === "multiply" || stage === "result") && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white/20 text-lg font-mono"
                    >
                        ×
                    </motion.span>
                )}

                {/* Embedding matrix */}
                {(stage === "multiply" || stage === "result") && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col items-center gap-1"
                    >
                        <span className="text-[9px] font-mono text-white/25 mb-1">E matrix ({V}×{D})</span>
                        {E_MATRIX.map((row, i) => (
                            <div key={i} className="flex gap-0.5">
                                {row.map((val, j) => (
                                    <motion.div
                                        key={j}
                                        className="w-11 h-5 rounded-sm flex items-center justify-center text-[9px] font-mono tabular-nums"
                                        style={{
                                            backgroundColor: i === selectedIdx
                                                ? `rgba(167,139,250,${0.1 + Math.abs(val) * 0.2})`
                                                : "rgba(255,255,255,0.02)",
                                            color: i === selectedIdx ? "#a78bfa" : "rgba(255,255,255,0.15)",
                                            fontWeight: i === selectedIdx ? 700 : 400,
                                        }}
                                        animate={{
                                            scale: stage === "result" && i === selectedIdx ? [1, 1.1, 1] : 1,
                                        }}
                                        transition={{ delay: j * 0.1, duration: 0.3 }}
                                    >
                                        {val.toFixed(2)}
                                    </motion.div>
                                ))}
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* = symbol */}
                {stage === "result" && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white/20 text-lg font-mono"
                    >
                        =
                    </motion.span>
                )}

                {/* Result embedding */}
                {stage === "result" && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col items-center gap-1"
                    >
                        <span className="text-[9px] font-mono text-emerald-400/50 mb-1">embedding</span>
                        {embedding.map((val, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="w-14 h-5 rounded-sm flex items-center justify-center text-[10px] font-mono font-bold tabular-nums"
                                style={{
                                    backgroundColor: `rgba(52,211,153,${0.1 + Math.abs(val) * 0.15})`,
                                    color: "#34d399",
                                }}
                            >
                                {val.toFixed(2)}
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Select stage message */}
                {stage === "select" && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-white/30 italic text-center"
                    >
                        Selected &apos;{VOCAB[selectedIdx]}&apos; — click Next to see the one-hot encoding
                    </motion.p>
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={prevStage}
                    disabled={stageIdx === 0}
                    className="text-[10px] font-mono px-3 py-1.5 rounded border border-white/[0.08] text-white/30 hover:text-white/50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                    ← Back
                </button>

                {stage === "result" && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-emerald-400/50 font-mono"
                    >
                        Row lookup = matrix multiply with one-hot!
                    </motion.p>
                )}

                <button
                    onClick={nextStage}
                    disabled={stageIdx === STAGES.length - 1}
                    className="text-[10px] font-mono px-3 py-1.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
