"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V19 — WeightsOfWhatViz — "The Missing Piece" moment

  Concept: We KNOW who matters (attention weights). But what information
  do we actually blend? The embeddings were used for Q and K (matching).
  We need something ELSE to carry the actual content.

  Design: Clean, mono-cyan with amber reveal. No rainbow.
  Premium minimalism — one idea, one beat, one reveal.
*/

const WEIGHTS = [
    { word: "crown", weight: 0.30 },
    { word: "golden", weight: 0.25 },
    { word: "wore", weight: 0.20 },
    { word: "king", weight: 0.13 },
    { word: "the", weight: 0.12 },
];

export function WeightsOfWhatViz() {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-8 max-w-lg mx-auto">
            {/* ── Header ── */}
            <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/40 font-semibold mb-2">
                    Attention weights for
                </p>
                <span
                    className="inline-block px-5 py-1.5 rounded-full text-base sm:text-lg font-bold"
                    style={{
                        color: "#67e8f9",
                        background: "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(34,211,238,0.03))",
                        border: "1px solid rgba(34,211,238,0.15)",
                    }}
                >
                    "king"
                </span>
            </motion.div>

            {/* ── Weight rows — clean, mono-color ── */}
            <div className="space-y-1.5">
                {WEIGHTS.map((item, i) => {
                    const pct = Math.round(item.weight * 100);
                    const barW = (item.weight / 0.30) * 100;
                    const intensity = 0.35 + item.weight * 1.5;

                    return (
                        <motion.div
                            key={item.word}
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            {/* Word */}
                            <span
                                className="text-[13px] sm:text-sm font-medium w-14 text-right shrink-0"
                                style={{ color: `rgba(255,255,255,${0.25 + item.weight * 0.8})` }}
                            >
                                {item.word}
                            </span>

                            {/* Bar */}
                            <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, rgba(34,211,238,${intensity * 0.6}), rgba(34,211,238,${intensity * 0.15}))`,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barW}%` }}
                                    transition={{ duration: 0.5, delay: 0.2 + i * 0.07, ease: "easeOut" }}
                                />
                            </div>

                            {/* Percentage */}
                            <span
                                className="text-xs font-mono w-8 text-right shrink-0 tabular-nums"
                                style={{ color: `rgba(34,211,238,${0.3 + item.weight * 1.2})` }}
                            >
                                {pct}%
                            </span>

                            {/* Question mark — fades in on each row */}
                            <motion.span
                                className="text-white/15 text-xs shrink-0 w-3 text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: revealed ? 0 : [0.1, 0.35, 0.1] }}
                                transition={revealed ? { duration: 0.2 } : { delay: 0.8 + i * 0.08, duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                ?
                            </motion.span>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── The reveal button ── */}
            <div className="flex justify-center pt-2">
                <motion.button
                    onClick={() => setRevealed(!revealed)}
                    className="px-5 py-2 rounded-xl text-[12px] sm:text-[13px] font-semibold cursor-pointer"
                    style={{
                        background: revealed
                            ? "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.02))"
                            : "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                        border: revealed
                            ? "1px solid rgba(251,191,36,0.18)"
                            : "1px solid rgba(255,255,255,0.08)",
                        color: revealed ? "rgba(251,191,36,0.7)" : "rgba(255,255,255,0.35)",
                    }}
                    whileTap={{ scale: 0.96 }}
                    whileHover={{
                        borderColor: revealed ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.15)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    {revealed ? "The gap is clear" : "But 30% of what? →"}
                </motion.button>
            </div>

            {/* ── Gap explanation ── */}
            <AnimatePresence>
                {revealed && (
                    <motion.div
                        className="rounded-xl px-5 sm:px-6 py-5 space-y-4"
                        style={{
                            background: "linear-gradient(145deg, rgba(251,191,36,0.04), rgba(251,191,36,0.01))",
                            border: "1px solid rgba(251,191,36,0.1)",
                        }}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 150, damping: 18 }}
                    >
                        {/* The Aha moment */}
                        <div className="text-center space-y-2">
                            <p className="text-[13px] sm:text-sm text-white/45 font-medium">
                                We know <span className="text-cyan-300/70 font-semibold">how much</span> each word matters
                            </p>

                            <div className="flex items-center justify-center gap-1.5">
                                {WEIGHTS.map(item => (
                                    <span
                                        key={item.word}
                                        className="px-2 py-0.5 rounded-md text-[10px] font-mono"
                                        style={{
                                            background: "rgba(34,211,238,0.06)",
                                            color: "rgba(34,211,238,0.5)",
                                            border: "1px solid rgba(34,211,238,0.08)",
                                        }}
                                    >
                                        {Math.round(item.weight * 100)}%
                                    </span>
                                ))}
                            </div>

                            <motion.div
                                className="w-12 h-px mx-auto rounded-full"
                                style={{ background: "rgba(255,255,255,0.06)" }}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.25 }}
                            />

                            <p className="text-[14px] sm:text-[15px] font-semibold text-amber-300/60">
                                But 30% <span className="text-amber-400/80">of what content?</span>
                            </p>
                        </div>

                        {/* Explanation */}
                        <p className="text-[12px] sm:text-[13px] text-white/30 leading-relaxed text-center max-w-sm mx-auto">
                            We used each word&apos;s embedding to create Query and Key —
                            but those were designed for <em className="text-white/40">matching</em>, not for sharing content.
                            We need a <span className="text-amber-300/60 font-medium">third representation</span> that
                            carries the actual information to blend.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
