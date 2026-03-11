"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V27b — MultiHeadIdeaViz
  Redesign: Clean vertical flow showing one embedding splitting into 4 heads.
  SVG 4-way branching connector (like QKSplitViz but 4 outputs).
  Each head labeled with what it captures.
  Colors: cyan + amber + white only. Heads differentiated by opacity, not hue.
*/

const EMBEDDING_DIMS = [
    { label: "syntax", dims: "verb? noun?", value: 0.85 },
    { label: "meaning", dims: "royalty, action", value: 0.72 },
    { label: "position", dims: "where, dist", value: 0.88 },
    { label: "form", dims: "tense, case", value: 0.62 },
];

const HEADS = [
    {
        name: "Head 1",
        focus: "Syntax",
        desc: "Finds grammatical links — subject ↔ verb",
        example: "professor → published",
        dimIdx: 0,
    },
    {
        name: "Head 2",
        focus: "Meaning",
        desc: "Finds semantic connections — concept ↔ concept",
        example: "professor → Nature",
        dimIdx: 1,
    },
    {
        name: "Head 3",
        focus: "Position",
        desc: "Tracks nearby context — local proximity",
        example: "professor → who",
        dimIdx: 2,
    },
    {
        name: "Head 4",
        focus: "Identity",
        desc: "Remembers self — keeps the word's own signal",
        example: "professor → professor",
        dimIdx: 3,
    },
];

export function MultiHeadIdeaViz() {
    const [activeHead, setActiveHead] = useState<number | null>(null);

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-4" style={{ minHeight: 320 }}>
            {/* ═══ Source: the embedding ═══ */}
            <div className="flex justify-center mb-0">
                <div
                    className="px-5 py-2 rounded-xl text-center"
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.15)",
                    }}
                >
                    <p className="text-[13px] uppercase tracking-[0.2em] text-white/60 font-semibold mb-1">
                        One embedding
                    </p>
                    {/* Feature bar */}
                    <div className="flex items-center gap-1">
                        {EMBEDDING_DIMS.map((dim, i) => (
                            <motion.div
                                key={dim.label}
                                className="flex flex-col items-center"
                                animate={{
                                    opacity: activeHead !== null
                                        ? (activeHead === i ? 1 : 0.15)
                                        : 0.6,
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                <div
                                    className="rounded-sm"
                                    style={{
                                        width: 28,
                                        height: 28,
                                        background: `rgba(34, 211, 238, ${0.4 + dim.value * 0.4})`,
                                        border: `1px solid rgba(34, 211, 238, ${0.25 + dim.value * 0.3})`,
                                    }}
                                />
                                <span className="text-[11px] text-white/60 mt-1 uppercase tracking-wider leading-none">
                                    {dim.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ SVG 4-way branching connector ═══ */}
            <div className="flex justify-center">
                <svg width="400" height="50" viewBox="0 0 400 50" fill="none" className="max-w-full overflow-visible">
                    {/* Vertical stem */}
                    <line x1="200" y1="0" x2="200" y2="15" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

                    {/* 4 branches */}
                    {[50, 150, 250, 350].map((endX, i) => {
                        const isActive = activeHead === i;
                        const opacity = activeHead !== null
                            ? (isActive ? 0.6 : 0.1)
                            : 0.3;
                        return (
                            <motion.path
                                key={i}
                                d={`M 200 15 Q 200 35, ${endX} 48`}
                                stroke={`rgba(34, 211, 238, ${opacity})`}
                                strokeWidth={isActive ? 1.5 : 1}
                                fill="none"
                                strokeLinecap="round"
                                animate={{
                                    stroke: `rgba(34, 211, 238, ${opacity})`,
                                    strokeWidth: isActive ? 1.5 : 1,
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        );
                    })}

                    {/* Center dot */}
                    <circle cx="200" cy="15" r="2.5" fill="rgba(34, 211, 238, 0.5)" />
                </svg>
            </div>

            {/* ═══ 4 Head cards ═══ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
                {HEADS.map((head, i) => {
                    const isActive = activeHead === i;
                    const cyanOpacity = isActive ? 0.15 : 0.05;
                    const borderOpacity = isActive ? 0.3 : 0.1;

                    return (
                        <motion.button
                            key={head.name}
                            onClick={() => setActiveHead(activeHead === i ? null : i)}
                            className="px-3 py-3 text-left transition-all cursor-pointer"
                            style={{
                                borderLeft: `2px solid rgba(34, 211, 238, ${isActive ? 0.6 : 0.2})`,
                            }}
                            whileTap={{ scale: 0.97 }}
                            animate={{
                                opacity: activeHead !== null ? (isActive ? 1 : 0.35) : 1,
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Head number */}
                            <p
                                className="text-[13px] uppercase tracking-[0.15em] font-semibold mb-1"
                                style={{
                                    color: isActive ? "#22d3ee" : "rgba(255,255,255,0.5)",
                                }}
                            >
                                {head.name}
                            </p>

                            {/* Focus label */}
                            <p
                                className="text-sm font-semibold mb-1"
                                style={{
                                    color: isActive ? "#22d3ee" : "rgba(255,255,255,0.7)",
                                }}
                            >
                                {head.focus}
                            </p>

                            {/* Description */}
                            <p className="text-[13px] text-white/55 leading-snug mb-1.5">
                                {head.desc}
                            </p>

                            {/* Example */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.p
                                        className="text-[13px] font-mono text-cyan-400/70 italic"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        {head.example}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* ═══ Insight ═══ */}
            <AnimatePresence mode="wait">
                {activeHead !== null ? (
                    <motion.div
                        key={`insight-${activeHead}`}
                        className="max-w-sm mx-auto mt-5 text-center"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-sm text-white/50 leading-relaxed">
                            Each head gets its own Q, K, V matrices — free to specialize in{" "}
                            <strong className="text-cyan-400">
                                {HEADS[activeHead].focus.toLowerCase()}
                            </strong>{" "}
                            without compromising the others.
                        </p>
                    </motion.div>
                ) : (
                    <motion.p
                        key="idle"
                        className="text-center text-[13px] text-white/45 mt-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        Tap a head to see what it focuses on
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
