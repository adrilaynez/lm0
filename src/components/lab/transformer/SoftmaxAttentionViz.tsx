"use client";

import { motion } from "framer-motion";

/*
  SoftmaxAttentionViz — Ultra-simple, beautiful viz showing:
  king's raw Q·K scores → softmax → attention percentages
  Rank-based colors: #1 = cyan, #2 = amber, rest = neutral.
*/

const WORDS = ["crown", "golden", "wore", "king", "the"];

const RAW_SCORES = [0.88, 0.55, 0.42, 0.15, -0.18];

/* softmax */
function softmax(scores: number[]): number[] {
    const maxS = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - maxS));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

const WEIGHTS = softmax(RAW_SCORES);

/* Pre-sort indices by weight descending for rank assignment */
const SORTED_INDICES = WEIGHTS
    .map((w, i) => ({ w, i }))
    .sort((a, b) => b.w - a.w)
    .map(d => d.i);

function getRank(i: number): number {
    return SORTED_INDICES.indexOf(i);
}

function rankColor(rank: number): string {
    if (rank === 0) return "#22d3ee";
    if (rank === 1) return "#fbbf24";
    return "rgba(255,255,255,0.3)";
}

function rankBarGradient(rank: number): string {
    if (rank === 0) return "linear-gradient(90deg, rgba(34,211,238,0.55), rgba(34,211,238,0.18))";
    if (rank === 1) return "linear-gradient(90deg, rgba(251,191,36,0.4), rgba(251,191,36,0.12))";
    return "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))";
}

export function SoftmaxAttentionViz() {
    const maxWeight = Math.max(...WEIGHTS);

    return (
        <div className="py-6 sm:py-10 px-3 sm:px-4 space-y-5" style={{ minHeight: 220 }}>
            {/* Header */}
            <p className="text-center text-[10px] text-white/20 uppercase tracking-widest font-semibold">
                How much does <span className="text-cyan-300/50">&ldquo;king&rdquo;</span> attend to each word?
            </p>

            {/* Bars */}
            <div className="space-y-2 max-w-md mx-auto">
                {WORDS.map((word, i) => {
                    const pct = Math.round(WEIGHTS[i] * 100);
                    const barW = (WEIGHTS[i] / maxWeight) * 100;
                    const rank = getRank(i);
                    const color = rankColor(rank);
                    const isTop = rank === 0;

                    return (
                        <motion.div
                            key={word}
                            className="flex items-center gap-2.5"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.3 }}
                        >
                            {/* Word */}
                            <span className="text-xs sm:text-sm font-semibold w-14 text-right shrink-0" style={{ color }}>
                                {word}
                            </span>

                            {/* Bar */}
                            <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: rankBarGradient(rank),
                                        boxShadow: isTop ? "0 0 10px -3px rgba(34,211,238,0.3)" : "none",
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barW}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: "easeOut" }}
                                />
                            </div>

                            {/* Percentage */}
                            <motion.span
                                className="text-xs sm:text-sm font-mono font-bold w-10 text-right shrink-0"
                                style={{ color: isTop ? `${color}cc` : color }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + i * 0.08 }}
                            >
                                {pct}%
                            </motion.span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Small note */}
            <motion.p
                className="text-center text-[11px] leading-relaxed max-w-sm mx-auto"
                style={{ color: "rgba(255,255,255,0.2)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                Softmax converts raw scores into percentages that sum to 100%
            </motion.p>
        </div>
    );
}
