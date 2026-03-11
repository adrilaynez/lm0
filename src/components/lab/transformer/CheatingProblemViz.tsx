"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  V49 — CheatingProblemViz
  Shows how without masking, the model can see future tokens and "cheat".
  Toggle: mask on/off. Without mask → 100% accuracy (cheating). With mask → real prediction.
*/

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];
const COLORS = ["#67e8f9", "#34d399", "#a78bfa", "#fbbf24", "#f472b6", "#fb923c"];

export function CheatingProblemViz() {
    const [masked, setMasked] = useState(false);
    const targetIdx = 4; // predicting "the" (index 4)

    return (
        <div className="py-5 px-4 sm:px-6">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 mb-5">
                <motion.button
                    onClick={() => setMasked(false)}
                    className="px-4 py-2 rounded-lg text-[13px] font-bold transition-all"
                    style={{
                        background: !masked ? "rgba(244,63,94,0.12)" : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${!masked ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.06)"}`,
                        color: !masked ? "#f43f5e" : "rgba(255,255,255,0.2)",
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    No Mask (Cheating)
                </motion.button>
                <motion.button
                    onClick={() => setMasked(true)}
                    className="px-4 py-2 rounded-lg text-[13px] font-bold transition-all"
                    style={{
                        background: masked ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${masked ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.06)"}`,
                        color: masked ? "#34d399" : "rgba(255,255,255,0.2)",
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    With Mask (Honest)
                </motion.button>
            </div>

            {/* Sentence with attention visualization */}
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                {TOKENS.map((tok, i) => {
                    const isTarget = i === targetIdx;
                    const isFuture = i >= targetIdx;
                    const canSee = !masked || i < targetIdx;
                    const isHidden = masked && isFuture;

                    return (
                        <motion.div
                            key={i}
                            className="relative px-3 py-2 rounded-lg text-[14px] font-bold text-center"
                            style={{
                                background: isTarget
                                    ? (masked ? "rgba(52,211,153,0.12)" : "rgba(244,63,94,0.15)")
                                    : isHidden
                                        ? "rgba(255,255,255,0.01)"
                                        : "rgba(255,255,255,0.04)",
                                border: isTarget
                                    ? `2px solid ${masked ? "rgba(52,211,153,0.4)" : "rgba(244,63,94,0.4)"}`
                                    : `1px solid ${isHidden ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)"}`,
                                color: isHidden ? "rgba(255,255,255,0.08)" : COLORS[i],
                                opacity: isHidden ? 0.3 : 1,
                                minWidth: 48,
                            }}
                            animate={{
                                scale: isTarget ? 1.05 : 1,
                                opacity: isHidden ? 0.3 : 1,
                            }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                            {tok}
                            {isHidden && (
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-center rounded-lg"
                                    style={{ background: "rgba(0,0,0,0.6)" }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <span className="text-[16px]">🚫</span>
                                </motion.div>
                            )}
                            {isTarget && !masked && (
                                <motion.div
                                    className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{ background: "rgba(244,63,94,0.2)", color: "#f43f5e" }}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    I can see myself!
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Prediction result */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={masked ? "masked" : "unmasked"}
                    className="rounded-xl px-5 py-4 text-center"
                    style={{
                        background: masked ? "rgba(52,211,153,0.04)" : "rgba(244,63,94,0.06)",
                        border: `1px solid ${masked ? "rgba(52,211,153,0.15)" : "rgba(244,63,94,0.15)"}`,
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                >
                    <p className="text-[13px] font-semibold mb-1" style={{ color: masked ? "#34d399" : "#f43f5e" }}>
                        {masked ? "Predicting position 5:" : "🚨 CHEATING DETECTED"}
                    </p>
                    <p className="text-[14px] font-bold" style={{ color: masked ? "rgba(255,255,255,0.6)" : "#f43f5e" }}>
                        {masked
                            ? "Model sees \"The cat sat on\" → predicts \"the\" with 62% confidence"
                            : "Model sees \"the\" right there → copies it → 100% accuracy, 0% learning"
                        }
                    </p>
                    {!masked && (
                        <motion.p
                            className="text-[12px] mt-2"
                            style={{ color: "rgba(244,63,94,0.5)" }}
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            This is fake learning — useless for generation!
                        </motion.p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
