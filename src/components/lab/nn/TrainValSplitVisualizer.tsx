"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Animated visual: 20 data dots split into train (80%, filled) and val (20%, hollow).
  Arrow showing "model trains on these" → "model tested on these".
*/

const TOTAL = 20;
const VAL_COUNT = 4;
const TRAIN_COUNT = TOTAL - VAL_COUNT;

// Pre-generate dot positions in a grid-like layout
function makeDots() {
    const dots: { id: number; x: number; y: number }[] = [];
    const cols = 10;
    for (let i = 0; i < TOTAL; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        dots.push({
            id: i,
            x: 20 + col * 28,
            y: 20 + row * 28,
        });
    }
    return dots;
}

const ALL_DOTS = makeDots();

// Val indices (last 4)
const VAL_INDICES = new Set([3, 7, 14, 18]);

export function TrainValSplitVisualizer() {
    const { t } = useI18n();
    const [split, setSplit] = useState(false);

    const doSplit = useCallback(() => setSplit(true), []);
    const doReset = useCallback(() => setSplit(false), []);

    // When split, train dots shift left, val dots shift right
    const trainDots = ALL_DOTS.filter((_, i) => !VAL_INDICES.has(i));
    const valDots = ALL_DOTS.filter((_, i) => VAL_INDICES.has(i));

    return (
        <div className="space-y-4">
            <div className="relative rounded-xl bg-black/30 border border-white/[0.05] p-4 overflow-hidden" style={{ minHeight: 120 }}>
                <svg viewBox="0 0 300 80" className="w-full block">
                    {!split ? (
                        /* Unsplit: all dots together */
                        ALL_DOTS.map((dot, i) => (
                            <motion.circle
                                key={dot.id}
                                cx={dot.x}
                                cy={dot.y}
                                r="8"
                                fill={NN_COLORS.input.hex + "80"}
                                stroke={NN_COLORS.input.hex}
                                strokeWidth="1.5"
                                initial={false}
                                animate={{ cx: dot.x, cy: dot.y }}
                                transition={{ type: "spring", stiffness: 120, damping: 16 }}
                            />
                        ))
                    ) : (
                        <>
                            {/* Train dots - left side */}
                            {trainDots.map((dot, i) => {
                                const col = i % 8;
                                const row = Math.floor(i / 8);
                                const tx = 12 + col * 22;
                                const ty = 16 + row * 26;
                                return (
                                    <motion.circle
                                        key={dot.id}
                                        r="7"
                                        fill={NN_COLORS.input.hex + "80"}
                                        stroke={NN_COLORS.input.hex}
                                        strokeWidth="1.5"
                                        initial={{ cx: dot.x, cy: dot.y }}
                                        animate={{ cx: tx, cy: ty }}
                                        transition={{ type: "spring", stiffness: 100, damping: 14, delay: i * 0.02 }}
                                    />
                                );
                            })}

                            {/* Divider */}
                            <motion.line
                                x1="200" y1="4" x2="200" y2="76"
                                stroke="rgba(255,255,255,0.12)"
                                strokeWidth="1"
                                strokeDasharray="4 3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            />

                            {/* Val dots - right side */}
                            {valDots.map((dot, i) => {
                                const col = i % 2;
                                const row = Math.floor(i / 2);
                                const tx = 220 + col * 28;
                                const ty = 16 + row * 26;
                                return (
                                    <motion.circle
                                        key={dot.id}
                                        r="7"
                                        fill="none"
                                        stroke={NN_COLORS.target.hex}
                                        strokeWidth="2"
                                        initial={{ cx: dot.x, cy: dot.y }}
                                        animate={{ cx: tx, cy: ty }}
                                        transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.15 + i * 0.03 }}
                                    />
                                );
                            })}

                            {/* Labels */}
                            <motion.text
                                x="90" y="72"
                                textAnchor="middle"
                                fill={NN_COLORS.input.hex}
                                fontSize="8"
                                fontFamily="monospace"
                                fontWeight="bold"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 0.4 }}
                            >
                                {t("neuralNetworkNarrative.trainValSplit.trainLabel")} ({TRAIN_COUNT})
                            </motion.text>
                            <motion.text
                                x="240" y="72"
                                textAnchor="middle"
                                fill={NN_COLORS.target.hex}
                                fontSize="8"
                                fontFamily="monospace"
                                fontWeight="bold"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 0.4 }}
                            >
                                {t("neuralNetworkNarrative.trainValSplit.valLabel")} ({VAL_COUNT})
                            </motion.text>
                        </>
                    )}
                </svg>
            </div>

            {/* Arrow annotations */}
            <AnimatePresence>
                {split && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-3 text-[10px] font-mono"
                    >
                        <div className="flex-1 rounded-lg border px-3 py-2 text-center"
                            style={{ borderColor: NN_COLORS.input.hex + "25", background: NN_COLORS.input.hex + "06" }}>
                            <span style={{ color: NN_COLORS.input.hex }} className="opacity-70">
                                → {t("neuralNetworkNarrative.trainValSplit.trainArrow")}
                            </span>
                        </div>
                        <div className="flex-1 rounded-lg border px-3 py-2 text-center"
                            style={{ borderColor: NN_COLORS.target.hex + "25", background: NN_COLORS.target.hex + "06" }}>
                            <span style={{ color: NN_COLORS.target.hex }} className="opacity-70">
                                → {t("neuralNetworkNarrative.trainValSplit.valArrow")}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Button */}
            <div className="flex justify-center pt-1 pb-2">
                <button
                    onClick={split ? doReset : doSplit}
                    className="px-5 py-2.5 rounded-lg text-[11px] font-mono font-bold border transition-all bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"
                >
                    {split
                        ? t("neuralNetworkNarrative.trainValSplit.resetBtn")
                        : t("neuralNetworkNarrative.trainValSplit.splitBtn")
                    }
                </button>
            </div>
        </div>
    );
}
