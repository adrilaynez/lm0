"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V23 — SoftmaxReturnsViz
  Input: 5 raw scores. Animated: exponentiate → normalize → probabilities.
  "Remember this?" callback badge. Height: ~220px.
*/

const WORDS = ["crown", "golden", "wore", "king", "the"];
const COLORS = ["#f472b6", "#fbbf24", "#a78bfa", "#22d3ee", "#94a3b8"];
const SCALED_SCORES = [0.85, 0.60, 0.45, 0.20, -0.10];

type Phase = 0 | 1 | 2;
const PHASE_LABELS = ["Raw Scores", "Exponentiate (e^x)", "Normalize → %"];

export function SoftmaxReturnsViz() {
    const [phase, setPhase] = useState<Phase>(0);

    const exps = SCALED_SCORES.map(s => Math.exp(s));
    const expSum = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / expSum);

    const values = phase === 0 ? SCALED_SCORES : phase === 1 ? exps : probs;
    const maxVal = Math.max(...values.map(Math.abs));
    const isPercent = phase === 2;

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-4 space-y-5" style={{ minHeight: 220 }}>
            {/* "Remember this?" badge */}
            <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold"
                    style={{
                        background: "rgba(168,139,250,0.1)",
                        border: "1px solid rgba(168,139,250,0.2)",
                        color: "rgba(168,139,250,0.6)",
                    }}>
                    🔁 Remember softmax from earlier chapters?
                </span>
            </div>

            {/* Phase buttons */}
            <div className="flex justify-center gap-2">
                {PHASE_LABELS.map((label, i) => (
                    <motion.button
                        key={i}
                        onClick={() => setPhase(i as Phase)}
                        className="px-3 py-1 rounded-lg text-[10px] sm:text-xs font-semibold"
                        style={{
                            background: phase === i ? "rgba(168,139,250,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${phase === i ? "rgba(168,139,250,0.3)" : "rgba(255,255,255,0.06)"}`,
                            color: phase === i ? "#a78bfa" : "rgba(255,255,255,0.35)",
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {i + 1}. {label}
                    </motion.button>
                ))}
            </div>

            {/* Bars */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={phase}
                    className="space-y-1.5 max-w-md mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                    {WORDS.map((word, i) => {
                        const val = values[i];
                        const barW = Math.max(3, (Math.abs(val) / maxVal) * 100);
                        return (
                            <motion.div
                                key={word}
                                className="flex items-center gap-2"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <span className="text-xs sm:text-sm font-semibold w-14 text-right shrink-0" style={{ color: COLORS[i] }}>
                                    {word}
                                </span>
                                <div className="flex-1 h-6 rounded-md bg-white/[0.03] overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-md"
                                        style={{ background: `linear-gradient(90deg, ${COLORS[i]}70, ${COLORS[i]}25)` }}
                                        animate={{ width: `${barW}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <span className="text-xs font-mono font-bold w-12 text-right shrink-0" style={{ color: COLORS[i] }}>
                                    {isPercent ? `${Math.round(val * 100)}%` : val.toFixed(2)}
                                </span>
                            </motion.div>
                        );
                    })}

                    {/* Sum indicator for phase 1 */}
                    {phase === 1 && (
                        <motion.p
                            className="text-center text-[10px] text-white/20 mt-2 font-mono"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            Sum = {expSum.toFixed(2)} → divide each by this to get %
                        </motion.p>
                    )}

                    {/* Final message for phase 2 */}
                    {phase === 2 && (
                        <motion.p
                            className="text-center text-xs text-emerald-300/40 mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Probabilities sum to 100%. Bigger gaps → sharper distribution.
                        </motion.p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
