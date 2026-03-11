"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  ContextualEmbeddingShiftViz — NEW-02 (v2 — Card-centric embedding strips)
  
  Same layout as FrozenEmbeddingProblemViz, but now each card reveals
  a DIFFERENT embedding strip. The visual contrast is immediate:
  same layout, opposite result.
  
  Emotional goal: RELIEF — "Yes! The numbers changed! This is what we need."
*/

interface SentenceData {
    text: string;
    keyword: string;
    suffix: string;
    context: string;
    color: string;
    embedding: number[];
}

const SENTENCES: SentenceData[] = [
    {
        text: "I sat by the river ",
        keyword: "bank",
        suffix: ".",
        context: "nature",
        color: "#22d3ee",
        embedding: [0.25, 0.82, -0.10, 0.15, -0.65, 0.90, 0.30, -0.15],
    },
    {
        text: "I deposited money at the ",
        keyword: "bank",
        suffix: ".",
        context: "finance",
        color: "#fbbf24",
        embedding: [0.88, -0.15, 0.70, 0.55, 0.20, -0.40, 0.65, 0.42],
    },
    {
        text: "The blood ",
        keyword: "bank",
        suffix: " saved lives.",
        context: "medical",
        color: "#f87171",
        embedding: [0.40, 0.15, 0.85, -0.25, 0.72, 0.10, -0.35, 0.60],
    },
    {
        text: "The ",
        keyword: "bank",
        suffix: " of fog rolled in.",
        context: "weather",
        color: "#a78bfa",
        embedding: [-0.30, 0.55, 0.10, 0.80, 0.35, -0.50, 0.48, 0.70],
    },
];

/* Map value → color. Positive = cyan, negative = amber */
function barColor(val: number, accentColor?: string): string {
    if (val >= 0) {
        if (accentColor) {
            const intensity = Math.min(val, 1);
            return `color-mix(in srgb, ${accentColor} ${Math.round(30 + intensity * 50)}%, rgba(34,211,238,0.5))`;
        }
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
function EmbeddingStrip({ values, accentColor, delay = 0 }: { values: number[]; accentColor?: string; delay?: number }) {
    return (
        <div className="flex items-end gap-[3px]">
            {values.map((v, i) => {
                const h = barHeight(v);
                const bg = barColor(v, v >= 0 ? accentColor : undefined);
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
            })}
        </div>
    );
}

export function ContextualEmbeddingShiftViz() {
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
                                border: `1px solid ${isRevealed ? s.color + "30" : "rgba(255,255,255,0.07)"}`,
                                background: isRevealed ? `${s.color}08` : "rgba(255,255,255,0.02)",
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Sentence */}
                            <div className="px-4 pt-4 pb-3">
                                <p className="text-[13px] leading-relaxed text-white/55">
                                    {s.text}
                                    <span className="font-bold" style={{ color: s.color }}>{s.keyword}</span>
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
                                            <span className="text-[12px] font-mono font-semibold shrink-0 pb-0.5"
                                                style={{ color: `${s.color}90` }}>
                                                bank =
                                            </span>
                                            <EmbeddingStrip
                                                values={s.embedding}
                                                accentColor={s.color}
                                                delay={0.1}
                                            />
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

            {/* Message */}
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
                        {/* Visual difference marker */}
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="h-px flex-1 max-w-16" style={{ background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.3))" }} />
                            <span className="text-emerald-400/70 text-[13px] font-bold tracking-wide">
                                ← DIFFERENT →
                            </span>
                            <div className="h-px flex-1 max-w-16" style={{ background: "linear-gradient(270deg, transparent, rgba(52,211,153,0.3))" }} />
                        </div>

                        <p className="text-[14px] font-semibold text-emerald-400/60">
                            Same word. Different context. Different numbers.
                        </p>
                        <p className="text-[13px] text-white/35 max-w-md mx-auto leading-relaxed">
                            This is what we need — a mechanism that rewrites a word&apos;s embedding
                            based on context. That mechanism is called{" "}
                            <span className="text-cyan-400/70 font-semibold">attention</span>.
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
                        Click any sentence to see &ldquo;bank&apos;s&rdquo; contextual embedding
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
