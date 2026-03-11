"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  BeforeAfterAttentionViz — NEW-03
  §04c, right after ValueCompletesViz, before ContextAssemblyFilmViz.
  
  Two columns: Before / After attention.
  6 feature bars animate from generic to context-shifted values.
  Sentence selector changes the "After" column but NOT the "Before".
  
  Key insight: "Same starting embedding. Different context. Different output."
*/

const FEATURES = ["royalty", "action", "person", "object", "abstract", "location"];

interface SentenceConfig {
    text: string;
    word: string;
    label: string;
    color: string;
    after: number[];
    insight: string;
}

const SENTENCES: SentenceConfig[] = [
    {
        text: "The king who wore the golden crown ruled wisely.",
        word: "king",
        label: "royalty context",
        color: "#fbbf24",
        after: [0.92, 0.58, 0.85, 0.30, 0.25, 0.40],
        insight: "\"crown\" and \"ruled\" boost royalty and action features.",
    },
    {
        text: "The king moved to e4, threatening the queen.",
        word: "king",
        label: "chess context",
        color: "#22d3ee",
        after: [0.35, 0.72, 0.30, 0.88, 0.45, 0.82],
        insight: "\"e4\" and \"threatening\" boost object and location features.",
    },
    {
        text: "The king of pop changed music forever.",
        word: "king",
        label: "metaphor context",
        color: "#a78bfa",
        after: [0.48, 0.35, 0.90, 0.20, 0.85, 0.18],
        insight: "\"pop\" and \"music\" boost person and abstract features.",
    },
];

/* Before values — same for all sentences (base embedding of "king") */
const BEFORE: number[] = [0.70, 0.25, 0.60, 0.15, 0.20, 0.18];

export function BeforeAfterAttentionViz() {
    const [sentenceIdx, setSentenceIdx] = useState(0);
    const [hasInteracted, setHasInteracted] = useState(false);
    const s = SENTENCES[sentenceIdx];

    const handleSelect = (idx: number) => {
        setSentenceIdx(idx);
        if (!hasInteracted) setHasInteracted(true);
    };

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-6">

            {/* Word label */}
            <div className="text-center">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-white/25 mb-1">
                    Embedding of
                </p>
                <p className="text-lg sm:text-xl font-bold text-white/70">
                    &ldquo;{s.word}&rdquo;
                </p>
            </div>

            {/* Two-column feature bars */}
            <div className="grid grid-cols-2 gap-6 sm:gap-10 max-w-lg mx-auto">

                {/* Before column */}
                <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-white/25 text-center mb-3">
                        Before Attention
                    </p>
                    {FEATURES.map((feat, fi) => (
                        <div key={fi} className="space-y-0.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-white/30">{feat}</span>
                                <span className="text-[10px] font-mono text-white/20 tabular-nums">{Math.round(BEFORE[fi] * 100)}</span>
                            </div>
                            <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${BEFORE[fi] * 100}%`,
                                        background: "rgba(255,255,255,0.2)",
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    <p className="text-[10px] text-center text-white/15 italic pt-1">
                        Always the same
                    </p>
                </div>

                {/* After column */}
                <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-center mb-3" style={{ color: `${s.color}60` }}>
                        After Attention
                    </p>
                    {FEATURES.map((feat, fi) => {
                        const afterVal = s.after[fi];
                        const diff = afterVal - BEFORE[fi];
                        const changed = Math.abs(diff) > 0.1;
                        return (
                            <div key={fi} className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-medium" style={{ color: changed ? `${s.color}88` : "rgba(255,255,255,0.3)" }}>
                                        {feat}
                                    </span>
                                    <span className="text-[10px] font-mono tabular-nums flex items-center gap-1" style={{ color: changed ? `${s.color}80` : "rgba(255,255,255,0.2)" }}>
                                        {Math.round(afterVal * 100)}
                                        {changed && (
                                            <motion.span
                                                className="text-[8px] font-bold"
                                                initial={{ opacity: 0, x: -3 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: fi * 0.06 + 0.3 }}
                                                style={{ color: `${s.color}70` }}
                                            >
                                                {diff > 0 ? "↑" : "↓"}
                                            </motion.span>
                                        )}
                                    </span>
                                </div>
                                <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                    {/* Ghost before bar */}
                                    <div className="relative h-full">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full"
                                            style={{
                                                width: `${BEFORE[fi] * 100}%`,
                                                background: "rgba(255,255,255,0.08)",
                                            }}
                                        />
                                        <motion.div
                                            className="absolute inset-y-0 left-0 rounded-full"
                                            initial={{ width: `${BEFORE[fi] * 100}%` }}
                                            animate={{ width: `${afterVal * 100}%` }}
                                            transition={{ type: "spring", stiffness: 80, damping: 14, delay: fi * 0.06 }}
                                            style={{
                                                background: changed
                                                    ? `linear-gradient(90deg, ${s.color}50, ${s.color}90)`
                                                    : `${s.color}35`,
                                                boxShadow: changed ? `0 0 8px ${s.color}30` : "none",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={sentenceIdx}
                            className="text-[10px] text-center italic pt-1"
                            style={{ color: `${s.color}45` }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {s.insight}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            {/* Sentence selector */}
            <div className="flex flex-col items-center gap-2 pt-1">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-white/18">
                    Change the context
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {SENTENCES.map((sent, i) => {
                        const isActive = i === sentenceIdx;
                        return (
                            <button
                                key={i}
                                onClick={() => handleSelect(i)}
                                className="px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-medium transition-all duration-300 cursor-pointer leading-snug"
                                style={{
                                    border: `1px solid ${isActive ? sent.color + "40" : "rgba(255,255,255,0.06)"}`,
                                    background: isActive ? `${sent.color}0c` : "rgba(255,255,255,0.02)",
                                    color: isActive ? `${sent.color}cc` : "rgba(255,255,255,0.35)",
                                }}
                            >
                                {sent.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Key insight */}
            <AnimatePresence>
                {hasInteracted && (
                    <motion.p
                        className="text-center text-[12px] sm:text-[13px] font-medium text-white/35 max-w-sm mx-auto"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                    >
                        Same starting embedding. Different context. Different output.
                        <span className="block text-[11px] text-white/20 italic mt-1">
                            That&apos;s what attention does.
                        </span>
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
