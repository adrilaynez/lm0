"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  V47 — ArchitectureTowerViz
  Clean vertical tower showing the full decoder architecture:
  Input → Embedding → +PE → [Block × N] → Linear → Softmax → Output
  Slider for N (1-6 blocks). Each block is a mini-card.
  Arrows between stages. One idea: see the full pipeline.
  Height: ~420px. All text ≥ 13px.
*/

interface StageDef {
    label: string;
    color: string;
    icon: string;
}

const PRE_STAGES: StageDef[] = [
    { label: "Input Tokens", color: "#94a3b8", icon: "📝" },
    { label: "Embedding + PE", color: "#f9a8d4", icon: "📥" },
];

const BLOCK_STAGE: StageDef = { label: "Transformer Block", color: "#22d3ee", icon: "🔄" };

const POST_STAGES: StageDef[] = [
    { label: "Linear Head", color: "#a78bfa", icon: "📊" },
    { label: "Softmax", color: "#a78bfa", icon: "📤" },
    { label: "Next-Word Prediction", color: "#34d399", icon: "✨" },
];

function StageCard({ stage, index, isBlock, blockNum }: { stage: StageDef; index: number; isBlock?: boolean; blockNum?: number }) {
    return (
        <motion.div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full max-w-xs mx-auto"
            style={{
                background: `${stage.color}08`,
                border: `1.5px solid ${stage.color}25`,
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, type: "spring", stiffness: 150, damping: 16 }}
        >
            <span className="text-[16px]">{stage.icon}</span>
            <div className="flex-1 min-w-0">
                <span className="text-[14px] font-bold" style={{ color: stage.color }}>
                    {stage.label}
                    {isBlock && blockNum !== undefined && (
                        <span className="ml-1.5 text-[12px] font-mono" style={{ color: `${stage.color}60` }}>
                            #{blockNum}
                        </span>
                    )}
                </span>
            </div>
            {isBlock && (
                <div className="flex gap-1">
                    {["👂", "🧠", "⊕"].map((e, i) => (
                        <span key={i} className="text-[10px] opacity-40">{e}</span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function Arrow({ delay }: { delay: number }) {
    return (
        <motion.div
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
        >
            <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div
                className="absolute"
                style={{
                    width: 0,
                    height: 0,
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderTop: "5px solid rgba(255,255,255,0.1)",
                    marginTop: 14,
                }}
            />
        </motion.div>
    );
}

export function ArchitectureTowerViz() {
    const [numBlocks, setNumBlocks] = useState(3);

    let stageIdx = 0;

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-6" style={{ minHeight: 420 }}>
            {/* Block count selector */}
            <div className="flex items-center justify-center gap-3 mb-5">
                <span className="text-[13px] font-semibold text-white/25">N× blocks:</span>
                {[1, 2, 3, 4, 6].map((n) => (
                    <motion.button
                        key={n}
                        onClick={() => setNumBlocks(n)}
                        className="w-9 h-9 rounded-lg text-[14px] font-bold"
                        style={{
                            background: numBlocks === n
                                ? "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(139,92,246,0.1))"
                                : "rgba(255,255,255,0.02)",
                            border: `1.5px solid ${numBlocks === n ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.05)"}`,
                            color: numBlocks === n ? "#22d3ee" : "rgba(255,255,255,0.2)",
                        }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {n}
                    </motion.button>
                ))}
            </div>

            {/* Tower */}
            <div className="flex flex-col items-center gap-0">
                {/* Pre-stages */}
                {PRE_STAGES.map((stage) => {
                    const idx = stageIdx++;
                    return (
                        <div key={stage.label} className="w-full">
                            <StageCard stage={stage} index={idx} />
                            <Arrow delay={idx * 0.06 + 0.03} />
                        </div>
                    );
                })}

                {/* Nx bracket with block cards */}
                <motion.div
                    className="w-full max-w-xs mx-auto rounded-xl px-3 py-2 my-1"
                    style={{
                        background: "rgba(34,211,238,0.02)",
                        border: "1px solid rgba(34,211,238,0.08)",
                    }}
                    layout
                    transition={{ type: "spring", stiffness: 120, damping: 16 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-mono font-bold" style={{ color: "rgba(34,211,238,0.35)" }}>
                            N× = {numBlocks}
                        </span>
                        <span className="text-[11px] text-white/15">
                            {numBlocks * 2} sub-layers total
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        {Array.from({ length: numBlocks }, (_, i) => {
                            const idx = stageIdx++;
                            return (
                                <div key={`block-${i}`} className="w-full">
                                    <StageCard stage={BLOCK_STAGE} index={idx} isBlock blockNum={i + 1} />
                                    {i < numBlocks - 1 && (
                                        <div className="flex justify-center">
                                            <div className="w-px h-2" style={{ background: "rgba(34,211,238,0.1)" }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <Arrow delay={stageIdx * 0.06} />

                {/* Post-stages */}
                {POST_STAGES.map((stage, i) => {
                    const idx = stageIdx++;
                    return (
                        <div key={stage.label} className="w-full">
                            <StageCard stage={stage} index={idx} />
                            {i < POST_STAGES.length - 1 && <Arrow delay={idx * 0.06 + 0.03} />}
                        </div>
                    );
                })}
            </div>

            {/* Parameter count hint */}
            <motion.p
                className="text-center text-[13px] text-white/20 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {numBlocks === 1 && "Tiny model — good for learning, not for language."}
                {numBlocks === 2 && "Can capture basic syntax patterns."}
                {numBlocks === 3 && "Enough for simple language tasks."}
                {numBlocks === 4 && "Starting to understand semantics."}
                {numBlocks === 6 && "Approaching GPT-2 scale (12 blocks)."}
            </motion.p>
        </div>
    );
}
