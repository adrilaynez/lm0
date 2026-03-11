"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  ContextualWordViz — Capstone for §04b-c
  Shows: BEFORE attention, each word is isolated (same meaning always).
  AFTER attention, each word's representation is a weighted mix of ALL words.
  The user sees how "king" becomes different depending on its neighbors.
  Ultra-simple: just colored contribution bars showing what goes into the output.
*/

const SENTENCE = ["The", "king", "wore", "the", "golden", "crown"];
const COLORS = ["#94a3b8", "#22d3ee", "#a78bfa", "#94a3b8", "#fbbf24", "#f472b6"];

/* Attention weights FROM each word (rows sum to 1) */
const WEIGHTS: Record<string, number[]> = {
    "The":    [0.05, 0.35, 0.15, 0.05, 0.20, 0.20],
    "king":   [0.04, 0.10, 0.28, 0.03, 0.25, 0.30],
    "wore":   [0.05, 0.30, 0.08, 0.05, 0.22, 0.30],
    "the_2":  [0.06, 0.15, 0.10, 0.04, 0.35, 0.30],
    "golden": [0.03, 0.20, 0.10, 0.05, 0.12, 0.50],
    "crown":  [0.04, 0.30, 0.15, 0.03, 0.38, 0.10],
};
const KEYS = ["The", "king", "wore", "the_2", "golden", "crown"];

export function ContextualWordViz() {
    const [selectedIdx, setSelectedIdx] = useState(1); // king
    const [showAfter, setShowAfter] = useState(false);

    const weights = WEIGHTS[KEYS[selectedIdx]];
    const maxW = Math.max(...weights);

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-4 space-y-5" style={{ minHeight: 300 }}>
            {/* Word selector */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[9px] text-white/20 uppercase tracking-wider font-semibold mr-1">Focus on:</span>
                {SENTENCE.map((word, i) => (
                    <motion.button
                        key={i}
                        onClick={() => { setSelectedIdx(i); setShowAfter(false); }}
                        className="px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold"
                        style={{
                            background: selectedIdx === i ? `${COLORS[i]}18` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${selectedIdx === i ? `${COLORS[i]}40` : "rgba(255,255,255,0.06)"}`,
                            color: selectedIdx === i ? COLORS[i] : "rgba(255,255,255,0.4)",
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {word}
                    </motion.button>
                ))}
            </div>

            {/* Toggle */}
            <div className="flex justify-center">
                <motion.button
                    onClick={() => setShowAfter(!showAfter)}
                    className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold"
                    style={{
                        background: showAfter
                            ? "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(34,211,238,0.15))"
                            : "rgba(255,255,255,0.06)",
                        border: `1px solid ${showAfter ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                        color: showAfter ? "#34d399" : "rgba(255,255,255,0.5)",
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    {showAfter ? "✨ After Attention" : "Before Attention →"}
                </motion.button>
            </div>

            <AnimatePresence mode="wait">
                {!showAfter ? (
                    <motion.div
                        key="before"
                        className="max-w-md mx-auto text-center space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                        {/* Isolated word */}
                        <div
                            className="inline-block px-6 py-4 rounded-xl"
                            style={{
                                background: `${COLORS[selectedIdx]}0c`,
                                border: `1.5px solid ${COLORS[selectedIdx]}30`,
                            }}
                        >
                            <p className="text-xl sm:text-2xl font-bold mb-1" style={{ color: COLORS[selectedIdx] }}>
                                &quot;{SENTENCE[selectedIdx]}&quot;
                            </p>
                            <p className="text-xs text-white/30">
                                Same meaning no matter what surrounds it
                            </p>
                        </div>
                        <p className="text-xs sm:text-sm text-white/25 italic">
                            Just its own embedding. No context. No connections.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="after"
                        className="max-w-md mx-auto space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                        {/* Header */}
                        <p className="text-center text-xs text-white/30 mb-2">
                            <span className="font-bold" style={{ color: COLORS[selectedIdx] }}>&quot;{SENTENCE[selectedIdx]}&quot;</span>
                            {" "}is now a mix of all words:
                        </p>

                        {/* Contribution bars */}
                        {SENTENCE.map((word, i) => {
                            const w = weights[i];
                            const pct = Math.round(w * 100);
                            const barW = (w / maxW) * 100;
                            const isSelf = i === selectedIdx;

                            return (
                                <motion.div
                                    key={i}
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                >
                                    <span
                                        className="text-xs sm:text-sm font-semibold w-14 text-right shrink-0"
                                        style={{ color: COLORS[i] }}
                                    >
                                        {word}{isSelf ? " ←" : ""}
                                    </span>
                                    <div className="flex-1 h-6 rounded-md bg-white/[0.03] overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-md"
                                            style={{
                                                background: `linear-gradient(90deg, ${COLORS[i]}70, ${COLORS[i]}25)`,
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${barW}%` }}
                                            transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                                        />
                                    </div>
                                    <span
                                        className="text-xs sm:text-sm font-mono font-bold w-10 text-right shrink-0"
                                        style={{ color: COLORS[i] }}
                                    >
                                        {pct}%
                                    </span>
                                </motion.div>
                            );
                        })}

                        {/* Self-attention note */}
                        <motion.p
                            className="text-center text-[10px] sm:text-xs text-white/25 italic mt-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Notice: &quot;{SENTENCE[selectedIdx]}&quot; also includes
                            {" "}{Math.round(weights[selectedIdx] * 100)}% of <em>itself</em> — self-attention
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
