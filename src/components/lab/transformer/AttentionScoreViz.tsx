"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/*
  AttentionScoreViz — Shows the full attention computation pipeline:
  Q×K^T → scale by √d_k → mask → softmax → multiply by V
  Uses a 3-token example with concrete numbers.
*/

const TOKENS = ["the", "cat", "sat"];
const D_K = 4;

/* Precomputed Q, K, V vectors (3 tokens × 4 dims) */
const Q = [[0.41, 0.52, -0.18, 0.33], [0.28, -0.15, 0.62, 0.44], [0.55, 0.31, 0.09, -0.22]];
const K = [[0.33, 0.48, -0.21, 0.15], [0.19, -0.38, 0.52, 0.27], [-0.12, 0.44, 0.31, 0.56]];

/* Dot products: Q[i] · K[j] */
function dot(a: number[], b: number[]): number {
    return +a.reduce((s, v, i) => s + v * b[i], 0).toFixed(3);
}

const RAW_SCORES = TOKENS.map((_, i) => TOKENS.map((_, j) => dot(Q[i], K[j])));
const SCALE = Math.sqrt(D_K);
const SCALED = RAW_SCORES.map(row => row.map(v => +(v / SCALE).toFixed(3)));

/* Apply causal mask: positions can only attend to ≤ their index */
const MASKED = SCALED.map((row, i) => row.map((v, j) => j <= i ? v : -Infinity));

/* Softmax per row */
function softmaxRow(row: number[]): number[] {
    const finite = row.map(v => (v === -Infinity ? -1e9 : v));
    const max = Math.max(...finite);
    const exps = finite.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => +(v / sum).toFixed(3));
}

const ATTN_WEIGHTS = MASKED.map(softmaxRow);

type Stage = 0 | 1 | 2 | 3;
const STAGE_LABELS = [
    "Step 1: Q × Kᵀ  →  raw scores",
    "Step 2: Scale by √d_k  →  stable scores",
    "Step 3: Mask future  →  −∞ for cheating positions",
    "Step 4: Softmax  →  attention weights (sum to 1)",
];

export function AttentionScoreViz() {
    const [stage, setStage] = useState<Stage>(0);

    const matrix = stage === 0 ? RAW_SCORES
        : stage === 1 ? SCALED
            : stage === 2 ? MASKED
                : ATTN_WEIGHTS;

    return (
        <div className="max-w-sm mx-auto py-4">
            {/* Stage selector */}
            <div className="flex items-center justify-center gap-1 mb-4">
                {[0, 1, 2, 3].map(s => (
                    <button key={s}
                        onClick={() => setStage(s as Stage)}
                        className="w-7 h-7 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                        style={{
                            background: stage === s ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.02)",
                            color: stage === s ? "#22d3ee" : "rgba(255,255,255,0.2)",
                            border: `1px solid ${stage === s ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.05)"}`,
                        }}>
                        {s + 1}
                    </button>
                ))}
            </div>

            <p className="text-center text-[11px] text-cyan-400/50 font-semibold mb-4 font-mono">
                {STAGE_LABELS[stage]}
            </p>

            {/* Matrix grid */}
            <div className="flex justify-center">
                <div>
                    {/* Column headers (Keys) */}
                    <div className="flex ml-14">
                        {TOKENS.map((t, j) => (
                            <div key={j} className="w-14 text-center text-[10px] font-mono text-amber-400/50 mb-1">
                                K:<span className="text-amber-400/70">{t}</span>
                            </div>
                        ))}
                    </div>

                    {/* Rows (Queries) */}
                    {TOKENS.map((t, i) => (
                        <div key={i} className="flex items-center gap-1 mb-1">
                            <div className="w-12 text-right text-[10px] font-mono text-cyan-400/50 pr-1">
                                Q:<span className="text-cyan-400/70">{t}</span>
                            </div>
                            {matrix[i].map((v, j) => {
                                const isInf = v === -Infinity;
                                const isMasked = stage >= 2 && j > i;
                                const isHighWeight = stage === 3 && v > 0.4;

                                return (
                                    <motion.div key={j}
                                        className="w-14 h-8 flex items-center justify-center rounded text-[11px] font-mono"
                                        style={{
                                            background: isMasked
                                                ? "rgba(244,63,94,0.06)"
                                                : isHighWeight
                                                    ? "rgba(34,211,238,0.15)"
                                                    : "rgba(255,255,255,0.03)",
                                            border: `1px solid ${isMasked
                                                ? "rgba(244,63,94,0.15)"
                                                : isHighWeight
                                                    ? "rgba(34,211,238,0.2)"
                                                    : "rgba(255,255,255,0.06)"}`,
                                            color: isMasked
                                                ? "rgba(244,63,94,0.5)"
                                                : isHighWeight
                                                    ? "rgba(34,211,238,0.9)"
                                                    : "rgba(255,255,255,0.4)",
                                        }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (i * 3 + j) * 0.03 }}
                                    >
                                        {isInf ? "−∞" : v.toFixed(stage === 3 ? 2 : 2)}
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Explanation per stage */}
            <div className="mt-4 px-2">
                {stage === 0 && (
                    <p className="text-[11px] text-white/30 text-center leading-relaxed">
                        Each Query dot-products with every Key. Higher score = more relevant.
                    </p>
                )}
                {stage === 1 && (
                    <p className="text-[11px] text-white/30 text-center leading-relaxed">
                        Divide by √{D_K} = {SCALE.toFixed(1)} to prevent scores from getting too large
                        (which would make softmax too &quot;spiky&quot;).
                    </p>
                )}
                {stage === 2 && (
                    <p className="text-[11px] text-white/30 text-center leading-relaxed">
                        <span className="text-rose-400/50">−∞</span> for future positions.
                        &quot;cat&quot; can see &quot;the&quot; and itself, but not &quot;sat&quot;.
                    </p>
                )}
                {stage === 3 && (
                    <p className="text-[11px] text-white/30 text-center leading-relaxed">
                        Each row sums to <span className="text-cyan-400/60">1.0</span>.
                        These weights determine how much each token listens to each other.
                    </p>
                )}
            </div>
        </div>
    );
}
