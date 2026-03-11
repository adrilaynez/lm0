"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════
   FrozenVsContextualViz — v1
   Phase 1: Dot frozen regardless of context
   Phase 2: Dot moves to match context cluster
   ═══════════════════════════════════════════════ */

const SENTENCES: {
    text: React.ReactNode;
    label: string;
    accent: string;
    accentRgb: string;
    cluster: string;
    dotTarget: { x: number; y: number };
}[] = [
        {
            text: <>The Eiffel <strong>tower</strong> gleamed in the Paris sunset.</>,
            label: "landmark",
            accent: "#22d3ee",
            accentRgb: "34,211,238",
            cluster: "landmark",
            dotTarget: { x: 72, y: 22 },
        },
        {
            text: <>She stacked another block on the <strong>tower</strong>.</>,
            label: "toy",
            accent: "#fbbf24",
            accentRgb: "251,191,36",
            cluster: "toy",
            dotTarget: { x: 22, y: 76 },
        },
        {
            text: <>The server <strong>tower</strong> hummed quietly in the corner.</>,
            label: "tech",
            accent: "#34d399",
            accentRgb: "52,211,153",
            cluster: "tech",
            dotTarget: { x: 78, y: 74 },
        },
    ];

const CLUSTERS: { word: string; x: number; y: number; group: number }[] = [
    /* Cyan cluster — landmarks (top-right) */
    { word: "monument", x: 65, y: 18, group: 0 },
    { word: "landmark", x: 78, y: 14, group: 0 },
    { word: "Paris", x: 82, y: 26, group: 0 },
    /* Amber cluster — toys (bottom-left) */
    { word: "toy", x: 16, y: 72, group: 1 },
    { word: "block", x: 28, y: 80, group: 1 },
    { word: "child", x: 12, y: 84, group: 1 },
    /* Emerald cluster — tech (bottom-right) */
    { word: "computer", x: 72, y: 70, group: 2 },
    { word: "data", x: 84, y: 78, group: 2 },
    { word: "server", x: 82, y: 66, group: 2 },
];

const CLUSTER_COLORS = ["rgba(34,211,238,0.35)", "rgba(251,191,36,0.35)", "rgba(52,211,153,0.35)"];
const CLUSTER_GLOW = ["rgba(34,211,238,0.12)", "rgba(251,191,36,0.12)", "rgba(52,211,153,0.12)"];

const FROZEN_POS = { x: 50, y: 48 };
const W = 340;
const H = 250;
const pct = (p: number, d: number) => (p / 100) * d;

const sPring = { type: "spring" as const, stiffness: 110, damping: 16 };

export function FrozenVsContextualViz() {
    const [sentIdx, setSentIdx] = useState(0);
    const [phase, setPhase] = useState<1 | 2>(1);
    const [seenCount, setSeenCount] = useState(1);

    const sent = SENTENCES[sentIdx];
    const dotPos = phase === 1 ? FROZEN_POS : sent.dotTarget;

    const switchSentence = (idx: number) => {
        if (idx === sentIdx) return;
        setSentIdx(idx);
        if (seenCount < 3) setSeenCount((p) => Math.min(p + 1, 3));
    };

    const togglePhase = () => {
        setPhase((p) => (p === 1 ? 2 : 1));
    };

    return (
        <div className="py-8 sm:py-10 px-2 sm:px-4 space-y-5">
            {/* ── Sentence display ── */}
            <div className="min-h-[3rem] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={`${sentIdx}-${phase}`}
                        className="text-center text-lg sm:text-xl leading-relaxed max-w-xl mx-auto"
                        style={{ color: "rgba(255,255,255,0.6)" }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35 }}
                    >
                        {sent.text}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* ── Sentence selector pills ── */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {SENTENCES.map((s, i) => {
                    const isActive = i === sentIdx;
                    return (
                        <motion.button
                            key={i}
                            onClick={() => switchSentence(i)}
                            className="px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-medium cursor-pointer transition-all duration-300 whitespace-nowrap"
                            style={{
                                border: `1px solid ${isActive ? `${s.accent}50` : "rgba(255,255,255,0.08)"}`,
                                background: isActive ? `${s.accent}10` : "rgba(255,255,255,0.02)",
                                color: isActive ? `${s.accent}dd` : "rgba(255,255,255,0.3)",
                            }}
                            whileHover={!isActive ? { borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)" } : undefined}
                            whileTap={{ scale: 0.96 }}
                        >
                            {s.label === "landmark" ? "🏛 Eiffel" : s.label === "toy" ? "🧱 Blocks" : "💻 Server"}
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Embedding space ── */}
            <div className="flex justify-center">
                <div className="relative" style={{ width: W, height: H }}>
                    {/* Grid */}
                    <svg width={W} height={H} className="absolute inset-0">
                        {[20, 40, 60, 80].map((p) => (
                            <React.Fragment key={p}>
                                <line x1={pct(p, W)} y1={0} x2={pct(p, W)} y2={H} stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                                <line x1={0} y1={pct(p, H)} x2={W} y2={pct(p, H)} stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                            </React.Fragment>
                        ))}
                        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    </svg>

                    {/* Cluster halos */}
                    {[0, 1, 2].map((g) => {
                        const dots = CLUSTERS.filter((c) => c.group === g);
                        const cx = dots.reduce((a, d) => a + d.x, 0) / dots.length;
                        const cy = dots.reduce((a, d) => a + d.y, 0) / dots.length;
                        const isActive = phase === 2 && SENTENCES[sentIdx].cluster === ["landmark", "toy", "tech"][g];
                        return (
                            <motion.div
                                key={g}
                                className="absolute rounded-full pointer-events-none"
                                style={{
                                    left: pct(cx, W) - 40,
                                    top: pct(cy, H) - 35,
                                    width: 80,
                                    height: 70,
                                    background: `radial-gradient(ellipse, ${CLUSTER_GLOW[g]}, transparent 70%)`,
                                    filter: "blur(8px)",
                                }}
                                animate={{ opacity: isActive ? 1 : 0.3 }}
                                transition={{ duration: 0.5 }}
                            />
                        );
                    })}

                    {/* Reference dots */}
                    {CLUSTERS.map((c) => {
                        const isActive = phase === 2 && SENTENCES[sentIdx].cluster === ["landmark", "toy", "tech"][c.group];
                        return (
                            <motion.div
                                key={c.word}
                                className="absolute"
                                style={{ left: pct(c.x, W) - 3, top: pct(c.y, H) - 3 }}
                                animate={{ opacity: isActive ? 0.8 : 0.35 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: CLUSTER_COLORS[c.group] }}
                                />
                                <span
                                    className="absolute left-3 -top-1 text-[11px] whitespace-nowrap pointer-events-none"
                                    style={{ color: "rgba(255,255,255,0.32)" }}
                                >
                                    {c.word}
                                </span>
                            </motion.div>
                        );
                    })}

                    {/* Faint trail (phase 2 only) */}
                    {phase === 2 && (
                        <motion.div
                            key={`trail-${sentIdx}`}
                            className="absolute w-1 h-1 rounded-full pointer-events-none"
                            style={{
                                left: pct(FROZEN_POS.x, W),
                                top: pct(FROZEN_POS.y, H),
                                background: sent.accent,
                                opacity: 0.15,
                            }}
                            initial={{ opacity: 0.2 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1.2 }}
                        />
                    )}

                    {/* THE tower dot */}
                    <motion.div
                        className="absolute z-10"
                        animate={{
                            left: pct(dotPos.x, W) - 7,
                            top: pct(dotPos.y, H) - 7,
                        }}
                        transition={phase === 2 ? sPring : { duration: 0.01 }}
                    >
                        <motion.div
                            className="w-[14px] h-[14px] rounded-full"
                            style={{
                                background: phase === 2 ? sent.accent : "#22d3ee",
                                boxShadow: phase === 2
                                    ? `0 0 20px rgba(${sent.accentRgb},0.35), 0 0 6px rgba(${sent.accentRgb},0.5)`
                                    : "0 0 20px rgba(34,211,238,0.35), 0 0 6px rgba(34,211,238,0.5)",
                            }}
                            animate={phase === 1 ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                            transition={phase === 1 ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                        />
                        <span
                            className="absolute left-5 -top-1 text-[11px] font-medium whitespace-nowrap pointer-events-none"
                            style={{ color: phase === 2 ? `${sent.accent}cc` : "rgba(34,211,238,0.8)" }}
                        >
                            tower
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* ── Verdict text ── */}
            <AnimatePresence mode="wait">
                {phase === 1 && seenCount >= 2 ? (
                    <motion.div
                        key="frozen-verdict"
                        className="text-center max-w-sm mx-auto space-y-1"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(251,191,36,0.55)" }}>
                            Same word. Same point. Every time.
                        </p>
                        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>
                            This is how the MLP sees it &mdash; one frozen address, regardless of context.
                        </p>
                    </motion.div>
                ) : phase === 2 ? (
                    <motion.p
                        key="contextual-verdict"
                        className="text-[13px] text-center max-w-sm mx-auto leading-relaxed"
                        style={{ color: "rgba(52,211,153,0.5)" }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.4 }}
                    >
                        Now the meaning adapts. This is what we need to build.
                    </motion.p>
                ) : (
                    <motion.p
                        key="hint"
                        className="text-[12px] text-center italic"
                        style={{ color: "rgba(255,255,255,0.18)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Switch sentences above — watch the dot
                    </motion.p>
                )}
            </AnimatePresence>

            {/* ── Phase toggle ── */}
            <div className="flex justify-center">
                <motion.button
                    onClick={togglePhase}
                    className="text-[12px] tracking-wide cursor-pointer px-5 py-2 rounded-full transition-all"
                    style={{
                        color: phase === 1 ? "rgba(52,211,153,0.55)" : "rgba(251,191,36,0.55)",
                        border: `1px solid ${phase === 1 ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}`,
                        background: phase === 1 ? "rgba(52,211,153,0.04)" : "rgba(251,191,36,0.04)",
                    }}
                    whileHover={{
                        borderColor: phase === 1 ? "rgba(52,211,153,0.4)" : "rgba(251,191,36,0.4)",
                        background: phase === 1 ? "rgba(52,211,153,0.08)" : "rgba(251,191,36,0.08)",
                    }}
                >
                    {phase === 1 ? "What if it could move?" : "← Back to frozen"}
                </motion.button>
            </div>
        </div>
    );
}
