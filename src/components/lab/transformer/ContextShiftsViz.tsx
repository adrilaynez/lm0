"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  ContextShiftsViz — v6
  - No embedding pill, no collapsible button
  - Always-visible embedding panels below the sentence
  - Clean, minimal layout
*/

interface ContextPair {
    word: string;
    contexts: [ContextExample, ContextExample];
}

interface ContextExample {
    sentence: string[];
    targetIdx: number;
    meaning: string;
    color: string;
    glowColor: string;
    highlightIdxs: number[];
    clusterLabel: string;
    dotPosition: { x: number; y: number };
}

const EXAMPLES: ContextPair[] = [
    {
        word: "bank",
        contexts: [
            {
                sentence: ["I", "sat", "by", "the", "river", "bank"],
                targetIdx: 5,
                meaning: "Edge of a river",
                color: "#22d3ee",
                glowColor: "rgba(34,211,238,0.07)",
                highlightIdxs: [4],
                clusterLabel: "nature cluster",
                dotPosition: { x: 25, y: 32 },
            },
            {
                sentence: ["I", "went", "to", "the", "bank", "to", "deposit", "money"],
                targetIdx: 4,
                meaning: "Financial institution",
                color: "#fbbf24",
                glowColor: "rgba(251,191,36,0.07)",
                highlightIdxs: [6, 7],
                clusterLabel: "finance cluster",
                dotPosition: { x: 74, y: 65 },
            },
        ],
    },
    {
        word: "light",
        contexts: [
            {
                sentence: ["The", "light", "from", "the", "window", "was", "warm"],
                targetIdx: 1,
                meaning: "Brightness",
                color: "#fbbf24",
                glowColor: "rgba(251,191,36,0.07)",
                highlightIdxs: [4, 6],
                clusterLabel: "perception cluster",
                dotPosition: { x: 28, y: 28 },
            },
            {
                sentence: ["This", "bag", "is", "very", "light", "and", "easy", "to", "carry"],
                targetIdx: 4,
                meaning: "Not heavy",
                color: "#22d3ee",
                glowColor: "rgba(34,211,238,0.07)",
                highlightIdxs: [1, 8],
                clusterLabel: "physical cluster",
                dotPosition: { x: 72, y: 62 },
            },
        ],
    },
];

const REFERENCE_DOTS: Record<string, { label: string; x: number; y: number }[]> = {
    bank: [
        { label: "river", x: 18, y: 20 },
        { label: "shore", x: 34, y: 42 },
        { label: "nature", x: 14, y: 58 },
        { label: "deposit", x: 66, y: 72 },
        { label: "money", x: 80, y: 52 },
        { label: "finance", x: 84, y: 76 },
    ],
    light: [
        { label: "bright", x: 20, y: 18 },
        { label: "glow", x: 38, y: 38 },
        { label: "warm", x: 16, y: 52 },
        { label: "weight", x: 64, y: 70 },
        { label: "easy", x: 78, y: 52 },
        { label: "carry", x: 82, y: 76 },
    ],
};

/* ─── Embedding Space ─── */
function EmbeddingSpace({
    word, exampleIdx, contextIdx, frozen,
}: {
    word: string; exampleIdx: number; contextIdx: number; frozen: boolean;
}) {
    const example = EXAMPLES[exampleIdx];
    const ctx0 = example.contexts[0];
    const ctx1 = example.contexts[1];
    const refs = REFERENCE_DOTS[word] ?? [];

    const targetCtx = frozen ? ctx0 : (contextIdx === 0 ? ctx0 : ctx1);
    const dotPos = targetCtx.dotPosition;
    const dotColor = frozen ? "#94a3b8" : targetCtx.color;

    return (
        <div className="relative w-full" style={{ paddingBottom: "48%" }}>
            <div className="absolute inset-0 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.28)" }}>
                {/* Subtle grid */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }}>
                    {[25, 50, 75].map(v => (
                        <g key={v}>
                            <line x1={`${v}%`} y1="0" x2={`${v}%`} y2="100%" stroke="white" strokeWidth="0.5" />
                            <line x1="0" y1={`${v}%`} x2="100%" y2={`${v}%`} stroke="white" strokeWidth="0.5" />
                        </g>
                    ))}
                </svg>

                {/* Cluster halos */}
                {!frozen && (
                    <>
                        <div className="absolute rounded-full blur-2xl pointer-events-none"
                            style={{ width: "50%", height: "120%", left: "-2%", top: "-10%", background: `radial-gradient(circle, ${ctx0.color}18, transparent 65%)` }} />
                        <div className="absolute rounded-full blur-2xl pointer-events-none"
                            style={{ width: "50%", height: "120%", right: "-2%", bottom: "-10%", background: `radial-gradient(circle, ${ctx1.color}18, transparent 65%)` }} />
                    </>
                )}

                {/* Reference dots */}
                {refs.map((ref) => (
                    <div key={ref.label} className="absolute" style={{ left: `${ref.x}%`, top: `${ref.y}%`, transform: "translate(-50%, -50%)" }}>
                        <div className="w-[4px] h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                        <span className="absolute top-2.5 left-1/2 -translate-x-1/2 text-[9px] text-white/25 whitespace-nowrap font-medium">{ref.label}</span>
                    </div>
                ))}

                {/* Main word dot */}
                <motion.div
                    className="absolute"
                    animate={{ left: `${dotPos.x}%`, top: `${dotPos.y}%` }}
                    transition={frozen ? {} : { type: "spring", stiffness: 110, damping: 16 }}
                    style={{ transform: "translate(-50%, -50%)" }}
                >
                    <motion.div className="absolute rounded-full blur-lg pointer-events-none"
                        style={{ width: 36, height: 36, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, ${dotColor}50, transparent 70%)` }}
                        animate={frozen ? { opacity: [0.3, 0.6, 0.3] } : { opacity: 1 }}
                        transition={frozen ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : {}}
                    />
                    <motion.div className="relative rounded-full z-10"
                        style={{ width: 12, height: 12, background: dotColor, boxShadow: `0 0 10px ${dotColor}80` }}
                    />
                    <motion.span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap z-20"
                        style={{ color: dotColor, textShadow: `0 0 6px ${dotColor}50` }}
                    >
                        &ldquo;{word}&rdquo;
                    </motion.span>
                </motion.div>

                {/* Frozen stamp */}
                {frozen && (
                    <span className="absolute bottom-1.5 left-2 text-[7px] uppercase tracking-[0.18em] font-bold" style={{ color: "rgba(251,191,36,0.18)" }}>
                        frozen
                    </span>
                )}
            </div>
        </div>
    );
}

export function ContextShiftsViz() {
    const [exampleIdx, setExampleIdx] = useState(0);
    const [contextIdx, setContextIdx] = useState(0);
    const pair = EXAMPLES[exampleIdx];
    const activeCtx = pair.contexts[contextIdx];

    return (
        <div className="py-8 sm:py-10 px-2 sm:px-4 space-y-5">

            {/* ── Word selector ── */}
            <div className="flex flex-col items-center gap-2">
                <p className="text-[11px] text-white/30 tracking-widest uppercase font-semibold">
                    Same word. Different context.
                </p>
                <div className="flex items-center justify-center gap-6">
                    {EXAMPLES.map((ex, i) => {
                        const isActive = i === exampleIdx;
                        return (
                            <button key={i} onClick={() => { setExampleIdx(i); setContextIdx(0); }}
                                className="relative pb-1 text-sm font-semibold transition-colors duration-300 cursor-pointer"
                                style={{ color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)" }}>
                                &ldquo;{ex.word}&rdquo;
                                {isActive && (
                                    <motion.span className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }}
                                        layoutId="csv6-tab" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Context toggle buttons ── */}
            <div className="flex items-center justify-center gap-3">
                {pair.contexts.map((ctx, ci) => {
                    const isActive = ci === contextIdx;
                    return (
                        <button key={ci} onClick={() => setContextIdx(ci)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer"
                            style={{
                                border: `1px solid ${isActive ? ctx.color + "40" : "rgba(255,255,255,0.06)"}`,
                                background: isActive ? `${ctx.color}0d` : "rgba(255,255,255,0.02)",
                                color: isActive ? ctx.color : "rgba(255,255,255,0.3)",
                            }}>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: isActive ? ctx.color : "rgba(255,255,255,0.15)" }} />
                            {ctx.meaning}
                        </button>
                    );
                })}
            </div>

            {/* ── Active sentence ── */}
            <AnimatePresence mode="wait">
                <motion.div key={`${exampleIdx}-${contextIdx}`}
                    className="rounded-2xl p-4 sm:p-5"
                    style={{ border: `1px solid ${activeCtx.color}18`, background: `linear-gradient(145deg, ${activeCtx.glowColor}, transparent 70%)` }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 justify-center">
                        {activeCtx.sentence.map((word, wi) => {
                            const isTarget = wi === activeCtx.targetIdx;
                            const isHighlight = activeCtx.highlightIdxs.includes(wi);
                            return (
                                <motion.span key={wi} className="text-base sm:text-lg font-medium px-0.5"
                                    style={{
                                        color: isTarget ? activeCtx.color : isHighlight ? `${activeCtx.color}99` : "rgba(255,255,255,0.4)",
                                        fontWeight: isTarget ? 700 : isHighlight ? 600 : 400,
                                        textDecoration: isTarget ? "underline" : "none",
                                        textDecorationColor: isTarget ? `${activeCtx.color}50` : undefined,
                                        textUnderlineOffset: "4px",
                                    }}
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: wi * 0.04, duration: 0.2 }}>
                                    {word}
                                </motion.span>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ── Embedding panels — always visible ── */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {/* LEFT — MLP (frozen) */}
                <div className="space-y-2">
                    <p className="text-[10px] text-center uppercase tracking-widest font-semibold text-amber-400/50">
                        What the MLP sees
                    </p>
                    <EmbeddingSpace word={pair.word} exampleIdx={exampleIdx} contextIdx={contextIdx} frozen={true} />
                    <p className="text-[11px] text-center text-white/22 italic leading-relaxed">
                        Same word → same numbers. Always.
                    </p>
                </div>
                {/* RIGHT — What we need */}
                <div className="space-y-2">
                    <p className="text-[10px] text-center uppercase tracking-widest font-semibold text-cyan-400/50">
                        What we need
                    </p>
                    <EmbeddingSpace word={pair.word} exampleIdx={exampleIdx} contextIdx={contextIdx} frozen={false} />
                    <AnimatePresence mode="wait">
                        <motion.p key={`${exampleIdx}-${contextIdx}`}
                            className="text-[11px] text-center leading-relaxed"
                            style={{ color: activeCtx.color + "88" }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                            → moves to {activeCtx.clusterLabel}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            <p className="text-[11px] sm:text-xs text-center text-white/25 leading-relaxed max-w-md mx-auto">
                The dot on the left <span className="text-amber-400/60 font-semibold">never moves</span> — that&apos;s the MLP&apos;s blind spot.
                The dot on the right <span className="text-cyan-400/60 font-semibold">is what attention makes possible</span>.
            </p>
        </div>
    );
}
