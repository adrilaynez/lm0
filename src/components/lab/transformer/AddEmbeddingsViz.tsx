"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  V36 — AddEmbeddingsViz — v2
  Step-by-step: word meaning + position encoding = combined.
  Colored tile cells. Cyan=meaning, Amber=position, Emerald=combined.
*/

const WORDS = ["The", "king", "wore", "the", "crown"];

/* Hand-crafted 5-dim embeddings for pedagogical clarity */
const MEANING: number[][] = [
    [0.1, 0.0, 0.0, 0.8, 0.1],
    [0.9, 0.2, 0.8, 0.6, -0.1],
    [0.0, 0.8, -0.1, 0.3, 0.5],
    [0.1, 0.0, 0.0, 0.8, 0.1],
    [0.7, 0.0, 0.0, 0.5, 0.9],
];

/* Position encodings — each position has a unique pattern */
const POSITION: number[][] = [
    [0.0, 1.0, 0.0, 0.5, 0.2],
    [0.8, 0.5, 0.1, 1.0, 0.0],
    [0.9, -0.4, 0.6, -0.2, 0.5],
    [0.1, -0.9, 0.8, -0.7, -0.3],
    [-0.8, -0.5, 1.0, 0.1, 0.7],
];

function VectorTiles({ values, rgb, maxVal, delay = 0 }: {
    values: number[]; rgb: string; maxVal: number; delay?: number;
}) {
    return (
        <div className="flex gap-1.5 sm:gap-2 justify-center">
            {values.map((val, i) => {
                const t = Math.abs(val) / maxVal;
                return (
                    <motion.div
                        key={i}
                        className="w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-lg flex items-center justify-center"
                        style={{
                            background: `rgba(${rgb}, ${(0.06 + t * 0.25).toFixed(2)})`,
                            border: `1px solid rgba(${rgb}, ${(0.1 + t * 0.22).toFixed(2)})`,
                            boxShadow: t > 0.6 ? `0 0 10px rgba(${rgb}, 0.1)` : "none",
                        }}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: delay + i * 0.05, type: "spring", stiffness: 200, damping: 18 }}
                    >
                        <span
                            className="text-[11px] sm:text-[13px] font-mono font-bold"
                            style={{ color: `rgba(${rgb}, ${(0.5 + t * 0.45).toFixed(2)})` }}
                        >
                            {val >= 0 ? "+" : ""}{val.toFixed(1)}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
}

export function AddEmbeddingsViz() {
    const [selIdx, setSelIdx] = useState(1);
    const [phase, setPhase] = useState<0 | 1 | 2>(0);

    const m = MEANING[selIdx];
    const p = POSITION[selIdx];
    const c = useMemo(
        () => m.map((v, i) => Math.round((v + p[i]) * 100) / 100),
        [m, p]
    );
    const maxVal = useMemo(() =>
        Math.max(...[...m, ...p, ...c].map(Math.abs), 0.01),
        [m, p, c]
    );

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-4" style={{ minHeight: 340 }}>
            {/* Word selector */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
                {WORDS.map((w, i) => (
                    <motion.button
                        key={i}
                        onClick={() => { setSelIdx(i); setPhase(0); }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 rounded-lg text-[14px] font-mono font-bold transition-all cursor-pointer"
                        style={{
                            background: i === selIdx ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)",
                            color: i === selIdx ? "#22d3ee" : "rgba(255,255,255,0.4)",
                            border: i === selIdx ? "1.5px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {w}
                    </motion.button>
                ))}
            </div>

            <div className="space-y-4 text-center">
                {/* Meaning row */}
                <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-2" style={{ color: "rgba(34,211,238,0.7)" }}>
                        &ldquo;{WORDS[selIdx]}&rdquo; meaning
                    </p>
                    <VectorTiles values={m} rgb="34,211,238" maxVal={maxVal} />
                </div>

                {/* + button or separator */}
                <div className="flex items-center justify-center">
                    {phase === 0 ? (
                        <motion.button
                            onClick={() => setPhase(1)}
                            className="px-5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer"
                            style={{
                                background: "rgba(251,191,36,0.08)",
                                border: "1px solid rgba(251,191,36,0.2)",
                                color: "rgba(251,191,36,0.8)",
                            }}
                            whileHover={{ scale: 1.02, boxShadow: "0 0 16px rgba(251,191,36,0.12)" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            + Add position encoding
                        </motion.button>
                    ) : (
                        <div className="flex items-center gap-3 w-40">
                            <div className="flex-1 h-px bg-amber-400/20" />
                            <span className="text-lg font-bold text-amber-400/50">+</span>
                            <div className="flex-1 h-px bg-amber-400/20" />
                        </div>
                    )}
                </div>

                {/* Position row */}
                <AnimatePresence>
                    {phase >= 1 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            style={{ overflow: "hidden" }}
                        >
                            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-2" style={{ color: "rgba(251,191,36,0.7)" }}>
                                Position {selIdx}
                            </p>
                            <VectorTiles values={p} rgb="251,191,36" maxVal={maxVal} delay={0.1} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* = button or separator */}
                <AnimatePresence>
                    {phase === 1 && (
                        <motion.div
                            className="flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <motion.button
                                onClick={() => setPhase(2)}
                                className="px-5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer"
                                style={{
                                    background: "rgba(52,211,153,0.08)",
                                    border: "1px solid rgba(52,211,153,0.2)",
                                    color: "rgba(52,211,153,0.8)",
                                }}
                                whileHover={{ scale: 1.02, boxShadow: "0 0 16px rgba(52,211,153,0.12)" }}
                                whileTap={{ scale: 0.98 }}
                            >
                                = See combined vector
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {phase >= 2 && (
                    <div className="flex items-center gap-3 w-40 mx-auto">
                        <div className="flex-1 h-px bg-emerald-400/20" />
                        <span className="text-lg font-bold text-emerald-400/50">=</span>
                        <div className="flex-1 h-px bg-emerald-400/20" />
                    </div>
                )}

                {/* Combined row */}
                <AnimatePresence>
                    {phase >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            style={{ overflow: "hidden" }}
                        >
                            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-2" style={{ color: "rgba(52,211,153,0.7)" }}>
                                Combined input
                            </p>
                            <VectorTiles values={c} rgb="52,211,153" maxVal={maxVal} delay={0.15} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Insight */}
            <AnimatePresence>
                {phase >= 2 && (
                    <motion.p
                        className="max-w-sm mx-auto mt-6 text-center text-[14px] text-white/45 leading-relaxed"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        This vector carries <strong className="text-cyan-400/80">what the word means</strong>{" "}
                        and <strong className="text-amber-400/80">where it sits</strong>. Try another word &mdash; each position creates a unique combination.
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
