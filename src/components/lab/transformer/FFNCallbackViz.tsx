"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  FFNCallbackViz — Premium structural comparison v6

  Side-by-side comparison: MLP (blind) vs FFN in Transformer (context-aware).
  Shows abstract pipeline with animated flowing particles, glassmorphism cards,
  glowing connectors, and a "same brain" bridge highlight.
  
  The point: same processing architecture, but attention feeds it rich context.
*/

type Mode = "mlp" | "ffn";

interface StageNode {
    id: string;
    label: string;
    sub: string;
    icon: string;
    accent: "cyan" | "amber";
    isCore?: boolean;
}

const STAGES_FFN: StageNode[] = [
    { id: "input", label: "Full Sequence", sub: "Every token visible", icon: "\uD83D\uDCE1", accent: "cyan" },
    { id: "attn", label: "Attention", sub: "Gather context", icon: "\uD83D\uDC42", accent: "cyan" },
    { id: "ffn", label: "FFN", sub: "Expand \u2192 ReLU \u2192 Compress", icon: "\uD83E\uDDE0", accent: "amber", isCore: true },
    { id: "out", label: "Prediction", sub: "Next character", icon: "\u2728", accent: "cyan" },
];

const STAGES_MLP: StageNode[] = [
    { id: "input", label: "Fixed Window", sub: "3 characters only", icon: "\uD83D\uDD0D", accent: "amber" },
    { id: "mlp", label: "MLP", sub: "Expand \u2192 ReLU \u2192 Compress", icon: "\uD83E\uDDE0", accent: "amber", isCore: true },
    { id: "out", label: "Prediction", sub: "Next character", icon: "\u2728", accent: "amber" },
];

const ACCENT = {
    cyan: { color: "#22d3ee", rgb: "34,211,238" },
    amber: { color: "#fbbf24", rgb: "251,191,36" },
} as const;

/* ── SVG flowing connector between nodes ── */
function FlowConnector({ rgb, index }: { rgb: string; index: number }) {
    const color = `rgba(${rgb}, 0.35)`;
    const particleColor = `rgba(${rgb}, 0.7)`;
    return (
        <div className="flex items-center justify-center h-8 relative">
            <svg width="2" height="32" viewBox="0 0 2 32" className="overflow-visible">
                {/* Static line */}
                <line x1="1" y1="0" x2="1" y2="32" stroke={color} strokeWidth={1} strokeDasharray="3 3" />
                {/* Animated glow pulse */}
                <motion.line
                    x1="1" y1="0" x2="1" y2="32"
                    stroke={`rgba(${rgb}, 0.15)`}
                    strokeWidth={6}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.3 }}
                />
                {/* Traveling dot */}
                <motion.circle
                    cx={1}
                    r={2.5}
                    fill={particleColor}
                    style={{ filter: `drop-shadow(0 0 6px rgba(${rgb},0.8))` }}
                    initial={{ cy: 0, opacity: 0 }}
                    animate={{ cy: [0, 32], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.3, ease: "easeInOut" }}
                />
            </svg>
        </div>
    );
}

/* ── Single stage card ── */
function StageCard({ stage, index, total }: { stage: StageNode; index: number; total: number }) {
    const { rgb, color } = ACCENT[stage.accent];
    const isCore = stage.isCore;

    return (
        <motion.div
            className="relative w-full"
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.35, type: "spring", stiffness: 120, damping: 16 }}
        >
            {/* Outer glow for core block */}
            {isCore && (
                <motion.div
                    className="absolute -inset-[1px] rounded-2xl pointer-events-none"
                    style={{
                        background: `linear-gradient(135deg, rgba(${rgb},0.15), rgba(${rgb},0.05), rgba(${rgb},0.15))`,
                        filter: `blur(8px)`,
                    }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
            )}

            <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                    background: isCore
                        ? `linear-gradient(135deg, rgba(${rgb},0.1), rgba(${rgb},0.04))`
                        : "rgba(255,255,255,0.015)",
                    border: `1px solid rgba(${rgb}, ${isCore ? 0.25 : 0.08})`,
                    backdropFilter: "blur(12px)",
                }}
            >
                {/* Top accent line */}
                {isCore && (
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: `linear-gradient(90deg, transparent 5%, rgba(${rgb},0.6) 50%, transparent 95%)` }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}

                <div className="px-5 py-4 flex items-center gap-3.5">
                    {/* Icon */}
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
                        style={{
                            background: `rgba(${rgb}, ${isCore ? 0.12 : 0.05})`,
                            boxShadow: isCore ? `0 0 16px rgba(${rgb},0.1)` : "none",
                        }}
                    >
                        {stage.icon}
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                        <div
                            className="text-[14px] sm:text-[15px] font-bold tracking-[-0.01em]"
                            style={{ color: `rgba(${rgb}, ${isCore ? 0.9 : 0.6})` }}
                        >
                            {stage.label}
                        </div>
                        <div
                            className="text-[11px] sm:text-[12px] mt-0.5"
                            style={{ color: `rgba(${rgb}, ${isCore ? 0.4 : 0.25})` }}
                        >
                            {stage.sub}
                        </div>
                    </div>

                    {/* Core badge */}
                    {isCore && (
                        <motion.div
                            className="ml-auto shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                            style={{
                                background: `rgba(${rgb},0.08)`,
                                color: `rgba(${rgb},0.6)`,
                                border: `1px solid rgba(${rgb},0.15)`,
                            }}
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                        >
                            Same brain
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export function FFNCallbackViz() {
    const [mode, setMode] = useState<Mode>("ffn");

    const stages = mode === "ffn" ? STAGES_FFN : STAGES_MLP;
    const mainAccent = ACCENT[mode === "ffn" ? "cyan" : "amber"];
    const verdict = mode === "ffn"
        ? "Same brain, now fed by attention \u2014 sees the entire sequence."
        : "Powerful brain, but almost blind \u2014 only sees a tiny window.";

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4">
            {/* Mode toggle */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {(["ffn", "mlp"] as const).map((m) => {
                    const on = mode === m;
                    const a = ACCENT[m === "ffn" ? "cyan" : "amber"];
                    const label = m === "ffn" ? "FFN in Transformer" : "MLP (Chapter 3)";
                    return (
                        <motion.button key={m}
                            onClick={() => setMode(m)}
                            className="relative px-5 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold cursor-pointer transition-all overflow-hidden"
                            style={{
                                background: on ? `rgba(${a.rgb},0.08)` : "rgba(255,255,255,0.02)",
                                color: on ? a.color : "rgba(255,255,255,0.2)",
                                border: `1.5px solid ${on ? `rgba(${a.rgb},0.3)` : "rgba(255,255,255,0.05)"}`,
                                boxShadow: on ? `0 0 20px rgba(${a.rgb},0.08)` : "none",
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {on && (
                                <motion.div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: `radial-gradient(ellipse at center, rgba(${a.rgb},0.06), transparent 70%)`,
                                    }}
                                    layoutId="toggle-glow"
                                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                />
                            )}
                            <span className="relative z-10">{label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Pipeline flow */}
            <AnimatePresence mode="wait">
                <motion.div key={mode}
                    className="flex flex-col items-center gap-0 max-w-[320px] sm:max-w-[360px] mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {stages.map((stage, i) => {
                        const { rgb } = ACCENT[stage.accent];
                        return (
                            <div key={`${mode}-${stage.id}`} className="w-full flex flex-col items-center">
                                {i > 0 && <FlowConnector rgb={rgb} index={i} />}
                                <StageCard stage={stage} index={i} total={stages.length} />
                            </div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {/* Verdict */}
            <AnimatePresence mode="wait">
                <motion.div key={mode}
                    className="mt-6 flex items-center justify-center gap-2.5"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                >
                    <motion.div
                        className="w-2 h-2 rounded-full"
                        style={{ background: `rgba(${mainAccent.rgb},0.5)`, boxShadow: `0 0 8px rgba(${mainAccent.rgb},0.3)` }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <p className="text-[12px] sm:text-[13px] font-medium"
                        style={{ color: `rgba(${mainAccent.rgb},0.5)` }}>
                        {verdict}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Subtle footer */}
            <p className="text-center text-[10px] mt-2"
                style={{ color: "rgba(255,255,255,0.08)" }}>
                Same processing architecture {"\u2014"} the only difference is what comes before it
            </p>
        </div>
    );
}
