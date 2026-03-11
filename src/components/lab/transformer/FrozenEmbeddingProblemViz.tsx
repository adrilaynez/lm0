"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  FrozenEmbeddingProblemViz — NEW-01 (v2 — Card-centric embedding strips)
  
  4 sentence cards in a 2×2 grid. Each card shows:
    1. The sentence with "bank" highlighted
    2. A mini embedding fingerprint strip below
  
  ALL 4 strips are IDENTICAL — the visual repetition is the lesson.
  Click 2+ cards → reveal "Identical" message.
  
  Emotional goal: "Wait... they're all the same?!"
*/

const SENTENCES = [
    { text: "I sat by the river ", keyword: "bank", suffix: ".", context: "nature", color: "#22d3ee" },
    { text: "I deposited money at the ", keyword: "bank", suffix: ".", context: "finance", color: "#fbbf24" },
    { text: "The blood ", keyword: "bank", suffix: " saved lives.", context: "medical", color: "#f87171" },
    { text: "The ", keyword: "bank", suffix: " of fog rolled in.", context: "weather", color: "#a78bfa" },
];

/* The frozen embedding — same for ALL sentences */
const FROZEN_EMBEDDING = [0.91, 0.45, -0.22, 0.68, -0.30, 0.15, 0.82, -0.55];

/* Map value → color. Positive = cyan, negative = amber */
function barColor(val: number): string {
    if (val >= 0) {
        const intensity = Math.min(val, 1);
        return `rgba(34, 211, 238, ${0.25 + intensity * 0.55})`;
    }
    const intensity = Math.min(Math.abs(val), 1);
    return `rgba(251, 191, 36, ${0.25 + intensity * 0.55})`;
}

function barHeight(val: number): number {
    return 6 + Math.abs(val) * 16;
}

/* Reusable embedding strip component */
function EmbeddingStrip({ values, animate, delay = 0 }: { values: number[]; animate?: boolean; delay?: number }) {
    return (
        <div className="flex items-end gap-[3px]">
            {values.map((v, i) => {
                const h = barHeight(v);
                const bg = barColor(v);
                if (animate) {
                    return (
                        <motion.div
                            key={i}
                            className="rounded-sm"
                            style={{ width: 14, background: bg }}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: h, opacity: 1 }}
                            transition={{ delay: delay + i * 0.04, duration: 0.35, ease: "easeOut" }}
                        />
                    );
                }
                return (
                    <div
                        key={i}
                        className="rounded-sm"
                        style={{ width: 14, height: h, background: bg }}
                    />
                );
            })}
        </div>
    );
}

export function FrozenEmbeddingProblemViz() {
    const [clickedSet, setClickedSet] = useState<Set<number>>(new Set());
    const uniqueClicks = clickedSet.size;
    const showReveal = uniqueClicks >= 2;

    const handleClick = (idx: number) => {
        setClickedSet(prev => {
            const next = new Set(prev);
            next.add(idx);
            return next;
        });
    };

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-5">

            {/* Sentence cards — 2×2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                {SENTENCES.map((s, i) => {
                    const isRevealed = clickedSet.has(i);
                    return (
                        <motion.button
                            key={i}
                            onClick={() => handleClick(i)}
                            className="relative text-left rounded-xl transition-all duration-300 cursor-pointer overflow-hidden"
                            style={{
                                border: `1px solid ${isRevealed ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
                                background: isRevealed ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Sentence */}
                            <div className="px-4 pt-4 pb-3">
                                <p className="text-[13px] leading-relaxed text-white/55">
                                    {s.text}
                                    <span className="font-bold text-cyan-400">{s.keyword}</span>
                                    {s.suffix}
                                </p>
                                <span className="text-[10px] uppercase tracking-widest font-semibold mt-1 block"
                                    style={{ color: `${s.color}50` }}>
                                    {s.context} context
                                </span>
                            </div>

                            {/* Embedding strip — appears on click */}
                            <AnimatePresence>
                                {isRevealed && (
                                    <motion.div
                                        className="px-4 pb-4 pt-1"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                    >
                                        <div className="flex items-end gap-2.5">
                                            <span className="text-[12px] font-mono font-semibold text-cyan-400/70 shrink-0 pb-0.5">
                                                bank =
                                            </span>
                                            <EmbeddingStrip values={FROZEN_EMBEDDING} animate delay={0.1} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Click hint */}
                            {!isRevealed && (
                                <div className="px-4 pb-3">
                                    <span className="text-[11px] text-white/20 italic">
                                        Click to reveal embedding
                                    </span>
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Connecting lines + message */}
            <AnimatePresence mode="wait">
                {showReveal ? (
                    <motion.div
                        key="reveal"
                        className="text-center space-y-2 pt-1"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        {/* Visual equality marker */}
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="h-px flex-1 max-w-16" style={{ background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.3))" }} />
                            <span className="text-amber-400/70 text-[13px] font-bold tracking-wide">
                                ← IDENTICAL →
                            </span>
                            <div className="h-px flex-1 max-w-16" style={{ background: "linear-gradient(270deg, transparent, rgba(251,191,36,0.3))" }} />
                        </div>

                        <p className="text-[14px] font-semibold text-white/55">
                            Same word. Same numbers. Every sentence.
                        </p>
                        <p className="text-[13px] text-white/35 max-w-md mx-auto leading-relaxed">
                            The MLP gives &ldquo;bank&rdquo; one fixed vector — it can&apos;t distinguish
                            river bank from money bank. They&apos;re mathematically identical.
                        </p>
                    </motion.div>
                ) : uniqueClicks === 1 ? (
                    <motion.p
                        key="hint"
                        className="text-center text-[13px] text-white/30 italic"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        Now click another sentence — will the embedding change?
                    </motion.p>
                ) : (
                    <motion.p
                        key="idle"
                        className="text-center text-[13px] text-white/25 italic"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.2, 0.35, 0.2] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        Click any sentence to see &ldquo;bank&apos;s&rdquo; embedding
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
