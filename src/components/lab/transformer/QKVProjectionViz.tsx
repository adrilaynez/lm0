"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  QKVProjectionViz — Shows how a single embedding vector gets multiplied
  by three learned weight matrices to produce Query, Key, and Value vectors.
  Step-through animation with matrix multiplication visualization.
*/

const EMB = [0.42, 0.78, 0.15, 0.63]; // 4-dim embedding (simplified)
const LABELS = ["Q", "K", "V"] as const;
const COLORS = { Q: "#22d3ee", K: "#fbbf24", V: "#34d399" };

/* Fake weight matrices (4×4 → 4-dim output) */
const W: Record<string, number[][]> = {
    Q: [
        [0.3, -0.1, 0.5, 0.2],
        [0.1, 0.4, -0.2, 0.3],
        [-0.3, 0.2, 0.6, -0.1],
        [0.4, -0.3, 0.1, 0.5],
    ],
    K: [
        [0.2, 0.3, -0.1, 0.4],
        [-0.2, 0.5, 0.3, -0.1],
        [0.4, -0.1, 0.2, 0.3],
        [0.1, 0.2, -0.3, 0.6],
    ],
    V: [
        [-0.1, 0.4, 0.2, 0.3],
        [0.3, -0.2, 0.5, 0.1],
        [0.2, 0.3, -0.1, 0.4],
        [-0.3, 0.1, 0.4, 0.2],
    ],
};

function matVecMul(mat: number[][], vec: number[]): number[] {
    return mat.map(row => +row.reduce((s, w, i) => s + w * vec[i], 0).toFixed(3));
}

const RESULTS: Record<string, number[]> = {
    Q: matVecMul(W.Q, EMB),
    K: matVecMul(W.K, EMB),
    V: matVecMul(W.V, EMB),
};

export function QKVProjectionViz() {
    const [active, setActive] = useState<"Q" | "K" | "V">("Q");
    const color = COLORS[active];
    const result = RESULTS[active];
    const weights = W[active];

    return (
        <div className="max-w-md mx-auto py-4">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-1 mb-5">
                {LABELS.map(l => (
                    <button key={l}
                        onClick={() => setActive(l)}
                        className="px-4 py-1.5 rounded-lg text-[12px] font-bold font-mono cursor-pointer transition-all"
                        style={{
                            background: active === l ? `${COLORS[l]}15` : "transparent",
                            color: active === l ? COLORS[l] : "rgba(255,255,255,0.2)",
                            border: `1px solid ${active === l ? `${COLORS[l]}30` : "rgba(255,255,255,0.05)"}`,
                        }}>
                        W<sub>{l}</sub>
                    </button>
                ))}
            </div>

            {/* Matrix multiplication visualization */}
            <AnimatePresence mode="wait">
                <motion.div key={active}
                    className="flex items-center justify-center gap-3"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Embedding vector */}
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] text-white/25 mb-1">embedding</span>
                        {EMB.map((v, i) => (
                            <motion.div key={i}
                                className="w-10 h-6 flex items-center justify-center rounded text-[10px] font-mono"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                {v.toFixed(2)}
                            </motion.div>
                        ))}
                    </div>

                    {/* × symbol */}
                    <span className="text-white/15 text-[16px] font-mono">×</span>

                    {/* Weight matrix */}
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] mb-1" style={{ color: `${color}60` }}>W<sub>{active}</sub></span>
                        {weights.map((row, r) => (
                            <div key={r} className="flex gap-0.5">
                                {row.map((v, c) => (
                                    <motion.div key={c}
                                        className="w-10 h-6 flex items-center justify-center rounded text-[9px] font-mono"
                                        style={{
                                            background: `${color}08`,
                                            border: `1px solid ${color}15`,
                                            color: `${color}70`,
                                        }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (r * 4 + c) * 0.02 + 0.1 }}
                                    >
                                        {v > 0 ? `${v.toFixed(1)}` : v.toFixed(1)}
                                    </motion.div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* = symbol */}
                    <span className="text-white/15 text-[16px] font-mono">=</span>

                    {/* Result vector */}
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] mb-1 font-bold" style={{ color: `${color}80` }}>{active}</span>
                        {result.map((v, i) => (
                            <motion.div key={i}
                                className="w-12 h-6 flex items-center justify-center rounded text-[10px] font-mono font-bold"
                                style={{
                                    background: `${color}12`,
                                    border: `1px solid ${color}25`,
                                    color: `${color}90`,
                                }}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 + 0.3 }}
                            >
                                {v.toFixed(2)}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            <p className="text-center text-[10px] text-white/20 mt-4">
                Same embedding, three different projections — each learned during training
            </p>
        </div>
    );
}
