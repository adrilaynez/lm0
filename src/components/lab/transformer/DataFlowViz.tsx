"use client";

import { useCallback, useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V43 — DataFlowViz ⭐ (ANIMATED PIPELINE)
  Complete Transformer block with animated data flowing through all stages.
  Click any token to follow its path. Pause/Play/Step controls.
  Height: ~520px. All text ≥ 13px. Premium quality.
  NO matrix values. Purely visual flow.
*/

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];
const TOKEN_COLORS = ["#67e8f9", "#34d399", "#a78bfa", "#fbbf24", "#67e8f9", "#fb923c"];

/* Pipeline stages */
interface StageDef {
    id: string;
    label: string;
    color: string;
    type: "norm" | "attn" | "add" | "ffn" | "io";
}

const STAGES: StageDef[] = [
    { id: "input",  label: "Input Tokens",    color: "#94a3b8", type: "io" },
    { id: "norm1",  label: "LayerNorm",        color: "#a78bfa", type: "norm" },
    { id: "attn",   label: "Self-Attention",   color: "#22d3ee", type: "attn" },
    { id: "add1",   label: "Residual Add  ⊕",  color: "#34d399", type: "add" },
    { id: "norm2",  label: "LayerNorm",        color: "#a78bfa", type: "norm" },
    { id: "ffn",    label: "Feed-Forward",     color: "#fbbf24", type: "ffn" },
    { id: "add2",   label: "Residual Add  ⊕",  color: "#34d399", type: "add" },
    { id: "output", label: "Output Tokens",    color: "#f472b6", type: "io" },
];

const TOTAL_STAGES = STAGES.length;

/* Some attention connections for visual effect */
const ATTN_BEAMS = [
    { from: 1, to: 0, w: 0.5 }, { from: 1, to: 2, w: 0.8 },
    { from: 2, to: 1, w: 0.7 }, { from: 5, to: 1, w: 0.9 },
    { from: 5, to: 2, w: 0.5 }, { from: 3, to: 1, w: 0.4 },
    { from: 0, to: 1, w: 0.5 }, { from: 4, to: 5, w: 0.6 },
];

export function DataFlowViz() {
    const [activeToken, setActiveToken] = useState<number | null>(null);
    const [currentStage, setCurrentStage] = useState(0);
    const [playing, setPlaying] = useState(true);

    /* Auto-advance stages */
    useEffect(() => {
        if (!playing) return;
        const timer = setInterval(() => {
            setCurrentStage(s => (s + 1) % TOTAL_STAGES);
        }, 1400);
        return () => clearInterval(timer);
    }, [playing]);

    const handleStep = useCallback(() => {
        setPlaying(false);
        setCurrentStage(s => (s + 1) % TOTAL_STAGES);
    }, []);

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-6" style={{ minHeight: 520 }}>
            {/* Token selector */}
            <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
                <span className="text-[13px] text-white/25 font-semibold mr-1">Follow token:</span>
                {TOKENS.map((t, i) => {
                    const isActive = activeToken === i;
                    return (
                        <motion.button
                            key={i}
                            onClick={() => setActiveToken(isActive ? null : i)}
                            className="px-3 py-1.5 rounded-lg text-[14px] font-bold transition-all"
                            style={{
                                background: isActive ? `${TOKEN_COLORS[i]}15` : "rgba(255,255,255,0.02)",
                                border: `1.5px solid ${isActive ? `${TOKEN_COLORS[i]}50` : "rgba(255,255,255,0.05)"}`,
                                color: isActive ? TOKEN_COLORS[i] : "rgba(255,255,255,0.25)",
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t}
                        </motion.button>
                    );
                })}
            </div>

            {/* Pipeline stages */}
            <div className="flex flex-col items-center gap-0 max-w-lg mx-auto">
                {STAGES.map((stage, si) => {
                    const isCurrent = si === currentStage;
                    const isPast = si < currentStage;
                    const isAttn = stage.type === "attn" && isCurrent;
                    const isFFN = stage.type === "ffn" && isCurrent;
                    const isNorm = stage.type === "norm" && isCurrent;
                    const isAdd = stage.type === "add" && isCurrent;

                    return (
                        <div key={stage.id} className="flex flex-col items-center w-full">
                            {/* Connector */}
                            {si > 0 && (
                                <motion.div
                                    className="w-px"
                                    style={{ height: 12 }}
                                    animate={{
                                        background: isPast || isCurrent
                                            ? `${stage.color}40`
                                            : "rgba(255,255,255,0.04)",
                                    }}
                                />
                            )}

                            {/* Stage container */}
                            <motion.div
                                className="w-full rounded-xl px-4 py-3 relative"
                                style={{
                                    backdropFilter: "blur(8px)",
                                    overflow: "hidden",
                                }}
                                animate={{
                                    background: isCurrent
                                        ? `linear-gradient(135deg, ${stage.color}10, ${stage.color}05)`
                                        : isPast
                                            ? `${stage.color}05`
                                            : "rgba(255,255,255,0.015)",
                                    borderWidth: 1.5,
                                    borderStyle: "solid" as const,
                                    borderColor: isCurrent
                                        ? `${stage.color}40`
                                        : isPast ? `${stage.color}15` : "rgba(255,255,255,0.04)",
                                    boxShadow: isCurrent
                                        ? `0 0 24px -6px ${stage.color}25`
                                        : "none",
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Stage label */}
                                <p
                                    className="text-[14px] font-bold mb-2 text-center"
                                    style={{ color: isCurrent || isPast ? stage.color : "rgba(255,255,255,0.15)" }}
                                >
                                    {stage.label}
                                </p>

                                {/* Token chips row */}
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    {TOKENS.map((token, ti) => {
                                        const isDimmed = activeToken !== null && activeToken !== ti;
                                        const isHighlighted = activeToken === ti;
                                        const c = TOKEN_COLORS[ti];

                                        return (
                                            <motion.div
                                                key={ti}
                                                className="relative flex items-center justify-center rounded-lg px-2 py-1"
                                                style={{
                                                    minWidth: 42,
                                                    background: isDimmed
                                                        ? "rgba(255,255,255,0.02)"
                                                        : `${c}10`,
                                                    border: `1px solid ${isDimmed ? "rgba(255,255,255,0.03)" : `${c}25`}`,
                                                }}
                                                animate={{
                                                    opacity: isDimmed ? 0.25 : 1,
                                                }}
                                            >
                                                <span
                                                    className="text-[13px] font-semibold"
                                                    style={{ color: isDimmed ? "rgba(255,255,255,0.15)" : c }}
                                                >
                                                    {token}
                                                </span>

                                                {/* Norm flash */}
                                                {isNorm && !isDimmed && (
                                                    <motion.div
                                                        className="absolute inset-0 rounded-lg"
                                                        style={{ background: `${stage.color}15`, border: `1px solid ${stage.color}30` }}
                                                        animate={{ opacity: [0, 0.6, 0] }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                    />
                                                )}

                                                {/* FFN private glow */}
                                                {isFFN && !isDimmed && (
                                                    <motion.div
                                                        className="absolute inset-0 rounded-lg"
                                                        style={{
                                                            background: isHighlighted
                                                                ? `${c}20`
                                                                : `${stage.color}10`,
                                                            boxShadow: isHighlighted
                                                                ? `0 0 16px ${c}30`
                                                                : `0 0 8px ${stage.color}15`,
                                                        }}
                                                        animate={{
                                                            opacity: [0.3, 0.8, 0.3],
                                                            scale: [1, 1.08, 1],
                                                        }}
                                                        transition={{ duration: 1.2, repeat: Infinity, delay: ti * 0.1 }}
                                                    />
                                                )}

                                                {/* Add merge flash */}
                                                {isAdd && !isDimmed && (
                                                    <motion.div
                                                        className="absolute inset-0 rounded-lg"
                                                        style={{ background: `${stage.color}12` }}
                                                        animate={{ opacity: [0, 0.5, 0] }}
                                                        transition={{ duration: 0.8, repeat: Infinity }}
                                                    />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Attention beams (SVG overlay) */}
                                {isAttn && (
                                    <svg
                                        className="absolute inset-0 pointer-events-none"
                                        viewBox="0 0 400 60"
                                        style={{ width: "100%", height: "100%" }}
                                        preserveAspectRatio="none"
                                    >
                                        {ATTN_BEAMS
                                            .filter(b => activeToken === null || b.from === activeToken || b.to === activeToken)
                                            .map((beam, bi) => {
                                                const x1 = 50 + beam.from * 55;
                                                const x2 = 50 + beam.to * 55;
                                                const midX = (x1 + x2) / 2;
                                                const curveY = 8 - beam.w * 8;
                                                const isRelevant = activeToken === null || beam.from === activeToken;
                                                return (
                                                    <motion.path
                                                        key={bi}
                                                        d={`M ${x1} 38 Q ${midX} ${curveY}, ${x2} 38`}
                                                        fill="none"
                                                        stroke="#22d3ee"
                                                        strokeWidth={beam.w * 2.5 + 0.5}
                                                        strokeLinecap="round"
                                                        animate={{
                                                            strokeOpacity: isRelevant
                                                                ? [0.1, beam.w * 0.5, 0.1]
                                                                : 0.03,
                                                        }}
                                                        transition={{
                                                            duration: 1.5,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                            delay: bi * 0.1,
                                                        }}
                                                    />
                                                );
                                            })}
                                    </svg>
                                )}
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-5">
                <motion.button
                    onClick={() => setPlaying(p => !p)}
                    className="px-4 py-2 rounded-xl text-[14px] font-bold transition-all"
                    style={{
                        background: playing
                            ? "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.04))"
                            : "rgba(255,255,255,0.03)",
                        border: `1.5px solid ${playing ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)"}`,
                        color: playing ? "#22d3ee" : "rgba(255,255,255,0.3)",
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    {playing ? "⏸ Pause" : "▶ Play"}
                </motion.button>
                <motion.button
                    onClick={handleStep}
                    className="px-4 py-2 rounded-xl text-[14px] font-bold transition-all"
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1.5px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.3)",
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    Step →
                </motion.button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
                {STAGES.map((s, i) => (
                    <motion.div
                        key={i}
                        className="rounded-full cursor-pointer"
                        style={{
                            width: i === currentStage ? 16 : 6,
                            height: 6,
                            background: i === currentStage ? s.color : i < currentStage ? `${s.color}40` : "rgba(255,255,255,0.06)",
                            boxShadow: i === currentStage ? `0 0 8px ${s.color}35` : "none",
                        }}
                        layout
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => { setPlaying(false); setCurrentStage(i); }}
                    />
                ))}
            </div>
        </div>
    );
}
