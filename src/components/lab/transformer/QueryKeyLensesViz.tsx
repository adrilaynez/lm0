"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V16 — QueryKeyLensesViz (v2)
  Shows how one word's embedding features get transformed into Q and K.
  Uses 2 simple features (royalty, action) as horizontal bars.
  Embedding → Q (highlights what it's looking for) → K (highlights what it offers).
  Clear, simple, no confusing radial arrows.
*/

interface WordData {
    word: string;
    color: string;
    embedding: [number, number]; // [royalty, action]
    query: [number, number];     // Q projection
    key: [number, number];       // K projection
    qLabel: string;
    kLabel: string;
}

const FEATURES = ["royalty", "action"];

const WORD_DATA: WordData[] = [
    {
        word: "king",
        color: "#22d3ee",
        embedding: [0.9, 0.3],
        query: [0.2, 0.9],     // king ASKS for actions
        key: [0.95, 0.1],      // king OFFERS royalty
        qLabel: "Looking for actions & descriptions",
        kLabel: "I'm a powerful person",
    },
    {
        word: "crown",
        color: "#fbbf24",
        embedding: [0.85, 0.1],
        query: [0.8, 0.15],    // crown asks for royalty context
        key: [0.9, 0.05],      // crown offers royalty
        qLabel: "Looking for who wears me",
        kLabel: "I'm a royal object",
    },
    {
        word: "ruled",
        color: "#34d399",
        embedding: [0.4, 0.9],
        query: [0.85, 0.2],    // ruled asks for royal actors
        key: [0.1, 0.95],      // ruled offers action
        qLabel: "Looking for who did the ruling",
        kLabel: "I'm an action of power",
    },
    {
        word: "the",
        color: "#a78bfa",
        embedding: [0.05, 0.05],
        query: [0.3, 0.3],     // the weakly asks for anything
        key: [0.05, 0.05],     // the offers almost nothing
        qLabel: "Looking for a noun to attach to",
        kLabel: "I'm just a function word",
    },
    {
        word: "wisely",
        color: "#f472b6",
        embedding: [0.1, 0.7],
        query: [0.15, 0.85],   // wisely asks for actions
        key: [0.05, 0.8],      // wisely offers action-modifier
        qLabel: "Looking for what was done wisely",
        kLabel: "I describe how something happened",
    },
];

const BAR_MAX_W = 160;

function FeatureBar({ value, maxW, color, delay }: { value: number; maxW: number; color: string; delay: number }) {
    const isHigh = value >= 0.6;
    return (
        <div className="flex items-center gap-2">
            <div className="w-full h-5 rounded-full overflow-hidden" style={{ maxWidth: maxW, background: "rgba(255,255,255,0.03)" }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        background: `linear-gradient(90deg, ${color}${isHigh ? "70" : "35"}, ${color}${isHigh ? "30" : "12"})`,
                        boxShadow: isHigh ? `0 0 8px -2px ${color}40` : "none",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: 0.5, delay, ease: "easeOut" }}
                />
            </div>
            <span className="text-[10px] font-mono w-7 text-right" style={{ color: isHigh ? `${color}90` : "rgba(255,255,255,0.2)" }}>
                {value.toFixed(1)}
            </span>
        </div>
    );
}

export function QueryKeyLensesViz() {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const w = WORD_DATA[selectedIdx];

    return (
        <div className="py-6 sm:py-10 px-2 sm:px-4 space-y-6" style={{ minHeight: 300 }}>
            {/* Word selector — editorial tabs */}
            <div className="flex items-center justify-center gap-5 sm:gap-7">
                {WORD_DATA.map((wd, i) => {
                    const isActive = i === selectedIdx;
                    return (
                        <motion.button
                            key={i}
                            onClick={() => setSelectedIdx(i)}
                            className="relative pb-1.5 text-[13px] sm:text-sm font-semibold transition-colors duration-300 cursor-pointer"
                            style={{
                                color: isActive ? wd.color : "rgba(255,255,255,0.3)",
                            }}
                        >
                            {wd.word}
                            {isActive && (
                                <motion.span
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                    style={{ background: `linear-gradient(90deg, transparent, ${wd.color}80, transparent)` }}
                                    layoutId="qk-tab-indicator"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Three columns: Embedding → Q → K */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedIdx}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 sm:gap-0 max-w-3xl mx-auto items-stretch"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.25 }}
                >
                    {/* Embedding column */}
                    <div
                        className="rounded-2xl px-4 py-4"
                        style={{
                            background: `linear-gradient(145deg, ${w.color}08, transparent 60%)`,
                            border: `1px solid ${w.color}15`,
                        }}
                    >
                        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2 text-center" style={{ color: `${w.color}70` }}>
                            Embedding
                        </p>
                        <p className="text-center text-base sm:text-lg font-bold tracking-tight mb-3" style={{ color: w.color }}>
                            &ldquo;{w.word}&rdquo;
                        </p>
                        <div className="space-y-2.5">
                            {FEATURES.map((feat, fi) => (
                                <div key={feat}>
                                    <span className="text-[10px] sm:text-[11px] text-white/30 block mb-1 font-medium">{feat}</span>
                                    <FeatureBar value={w.embedding[fi]} maxW={BAR_MAX_W} color={w.color} delay={fi * 0.1} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Arrow → */}
                    <div className="hidden sm:flex items-center justify-center px-1">
                        <span className="text-white/10 text-lg">→</span>
                    </div>

                    {/* Query column */}
                    <div
                        className="rounded-2xl px-4 py-4"
                        style={{
                            background: "linear-gradient(145deg, rgba(34,211,238,0.06), transparent 60%)",
                            border: "1px solid rgba(34,211,238,0.12)",
                        }}
                    >
                        <p className="text-[10px] text-cyan-400/50 uppercase tracking-widest font-semibold mb-2 text-center">
                            Query
                        </p>
                        <p className="text-center text-xs sm:text-sm text-cyan-200/35 mb-3">
                            &ldquo;What I need&rdquo;
                        </p>
                        <div className="space-y-2.5">
                            {FEATURES.map((feat, fi) => (
                                <div key={feat}>
                                    <span className="text-[10px] sm:text-[11px] text-white/30 block mb-1 font-medium">{feat}</span>
                                    <FeatureBar value={w.query[fi]} maxW={BAR_MAX_W} color="#22d3ee" delay={0.2 + fi * 0.1} />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-cyan-200/30 mt-3 text-center leading-relaxed">{w.qLabel}</p>
                    </div>

                    {/* Arrow → */}
                    <div className="hidden sm:flex items-center justify-center px-1">
                        <span className="text-white/10 text-lg">→</span>
                    </div>

                    {/* Key column */}
                    <div
                        className="rounded-2xl px-4 py-4"
                        style={{
                            background: "linear-gradient(145deg, rgba(52,211,153,0.06), transparent 60%)",
                            border: "1px solid rgba(52,211,153,0.12)",
                        }}
                    >
                        <p className="text-[10px] text-emerald-400/50 uppercase tracking-widest font-semibold mb-2 text-center">
                            Key
                        </p>
                        <p className="text-center text-xs sm:text-sm text-emerald-200/35 mb-3">
                            &ldquo;What I offer&rdquo;
                        </p>
                        <div className="space-y-2.5">
                            {FEATURES.map((feat, fi) => (
                                <div key={feat}>
                                    <span className="text-[10px] sm:text-[11px] text-white/30 block mb-1 font-medium">{feat}</span>
                                    <FeatureBar value={w.key[fi]} maxW={BAR_MAX_W} color="#34d399" delay={0.35 + fi * 0.1} />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-emerald-200/30 mt-3 text-center leading-relaxed">{w.kLabel}</p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Insight */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={selectedIdx}
                    className="text-center text-[12px] sm:text-[13px] max-w-md mx-auto leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    {w.word === "king"
                        ? <>&ldquo;king&rdquo; has high royalty, but its Query asks for <span className="text-cyan-300/50">actions</span> &mdash; it wants verbs.</>
                        : w.word === "ruled"
                            ? <>&ldquo;ruled&rdquo; is an action, but its Query asks for <span className="text-cyan-300/50">royalty</span> &mdash; it wants who ruled.</>
                            : w.word === "the"
                                ? <>&ldquo;the&rdquo; barely offers anything &mdash; its Key is <span className="text-emerald-300/45">nearly empty</span>.</>
                                : <>Notice how &ldquo;{w.word}&rdquo;&apos;s Q and K emphasize <span className="text-white/40">different features</span>.</>
                    }
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
