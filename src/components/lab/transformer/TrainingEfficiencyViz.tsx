"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  V52 — TrainingEfficiencyViz
  Side-by-side: MLP (1 input → 1 prediction) vs Transformer (N tokens → N predictions).
  Slider for sequence length. Shows training examples per forward pass.
*/

const ACCENT = "#22d3ee";
const MLP_COLOR = "#a78bfa";
const TF_COLOR = "#34d399";

export function TrainingEfficiencyViz() {
    const [seqLen, setSeqLen] = useState(8);

    return (
        <div className="py-5 px-4 sm:px-6">
            {/* Sequence length slider */}
            <div className="flex items-center justify-center gap-3 mb-5">
                <span className="text-[12px] text-white/20 font-semibold">Sequence length:</span>
                <input
                    type="range"
                    min={4}
                    max={32}
                    value={seqLen}
                    onChange={(e) => setSeqLen(Number(e.target.value))}
                    className="w-32 accent-cyan-400"
                />
                <span className="text-[14px] font-bold font-mono" style={{ color: ACCENT }}>{seqLen}</span>
            </div>

            {/* Side by side comparison */}
            <div className="grid grid-cols-2 gap-4">
                {/* MLP */}
                <div className="rounded-xl p-4" style={{ background: `${MLP_COLOR}06`, border: `1px solid ${MLP_COLOR}15` }}>
                    <p className="text-[14px] font-bold mb-3" style={{ color: MLP_COLOR }}>MLP</p>

                    <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-1">
                            <div className="flex gap-px flex-1">
                                {Array.from({ length: Math.min(seqLen, 12) }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-1 h-5 rounded-sm"
                                        style={{ background: `${MLP_COLOR}20`, border: `1px solid ${MLP_COLOR}10` }}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] font-mono text-white/15">input</span>
                        </div>
                        <div className="text-center text-[10px] text-white/15">↓</div>
                        <div className="flex items-center gap-1">
                            <div className="flex gap-px flex-1">
                                <motion.div
                                    className="h-5 rounded-sm"
                                    style={{
                                        width: `${100 / Math.min(seqLen, 12)}%`,
                                        background: `${MLP_COLOR}40`,
                                        border: `1px solid ${MLP_COLOR}30`,
                                    }}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.3 }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-white/15">output</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-[20px] font-bold font-mono" style={{ color: MLP_COLOR }}>1</p>
                        <p className="text-[11px] text-white/20">prediction per pass</p>
                    </div>
                </div>

                {/* Transformer */}
                <div className="rounded-xl p-4" style={{ background: `${TF_COLOR}06`, border: `1px solid ${TF_COLOR}15` }}>
                    <p className="text-[14px] font-bold mb-3" style={{ color: TF_COLOR }}>Transformer</p>

                    <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-1">
                            <div className="flex gap-px flex-1">
                                {Array.from({ length: Math.min(seqLen, 12) }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-1 h-5 rounded-sm"
                                        style={{ background: `${TF_COLOR}20`, border: `1px solid ${TF_COLOR}10` }}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] font-mono text-white/15">input</span>
                        </div>
                        <div className="text-center text-[10px] text-white/15">↓</div>
                        <div className="flex items-center gap-1">
                            <div className="flex gap-px flex-1">
                                {Array.from({ length: Math.min(seqLen, 12) }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-1 h-5 rounded-sm"
                                        style={{ background: `${TF_COLOR}40`, border: `1px solid ${TF_COLOR}30` }}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{ delay: 0.3 + i * 0.03 }}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] font-mono text-white/15">output</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <motion.p
                            className="text-[20px] font-bold font-mono"
                            style={{ color: TF_COLOR }}
                            key={seqLen}
                            initial={{ scale: 1.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            {seqLen}
                        </motion.p>
                        <p className="text-[11px] text-white/20">predictions per pass</p>
                    </div>
                </div>
            </div>

            {/* Efficiency comparison */}
            <motion.div
                className="mt-4 rounded-xl px-4 py-3 text-center"
                style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.1)" }}
                key={seqLen}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <p className="text-[14px] font-bold" style={{ color: TF_COLOR }}>
                    {seqLen}× more efficient
                </p>
                <p className="text-[12px] text-white/25 mt-1">
                    One sequence of {seqLen} tokens = {seqLen} training examples simultaneously.
                    {seqLen >= 16 && " GPT-3 uses sequences of 2048 tokens — 2048 examples per forward pass!"}
                </p>
            </motion.div>
        </div>
    );
}
