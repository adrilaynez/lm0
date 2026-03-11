"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  V51 — GrowingMasksViz
  Step through positions 1→8. Growing visible area (lower triangle expands).
  Shows how each position sees progressively more context.
*/

const TOKENS = ["The", "cat", "sat", "on", "the", "mat", "and", "slept"];
const COLORS = ["#67e8f9", "#34d399", "#a78bfa", "#fbbf24", "#f472b6", "#fb923c", "#60a5fa", "#f9a8d4"];

export function GrowingMasksViz() {
    const [position, setPosition] = useState(0);
    const N = TOKENS.length;

    return (
        <div className="py-5 px-4 sm:px-6">
            {/* Position stepper */}
            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-[12px] text-white/20 font-semibold mr-1">Position:</span>
                {TOKENS.map((tok, i) => (
                    <motion.button
                        key={i}
                        onClick={() => setPosition(i)}
                        className="px-2 py-1 rounded-md text-[12px] font-bold"
                        style={{
                            background: i === position ? `${COLORS[i]}15` : "rgba(255,255,255,0.02)",
                            border: `1.5px solid ${i === position ? `${COLORS[i]}40` : "rgba(255,255,255,0.04)"}`,
                            color: i === position ? COLORS[i] : "rgba(255,255,255,0.15)",
                        }}
                        whileTap={{ scale: 0.93 }}
                    >
                        {tok.slice(0, 3)}
                    </motion.button>
                ))}
            </div>

            {/* Growing triangle visualization */}
            <div className="mx-auto" style={{ maxWidth: 340 }}>
                {Array.from({ length: N }).map((_, row) => (
                    <div key={row} className="flex items-center gap-px mb-px">
                        {Array.from({ length: N }).map((_, col) => {
                            const isVisible = col <= row;
                            const isCurrentRow = row === position;
                            const isInVisibleArea = isCurrentRow && isVisible;
                            const brightness = isVisible
                                ? isCurrentRow ? 0.5 : 0.15
                                : 0;

                            return (
                                <motion.div
                                    key={col}
                                    className="flex-1 aspect-square rounded-sm flex items-center justify-center"
                                    animate={{
                                        backgroundColor: isVisible
                                            ? isInVisibleArea
                                                ? `rgba(34,211,238,${brightness})`
                                                : `rgba(34,211,238,${brightness})`
                                            : "rgba(0,0,0,0.3)",
                                        borderColor: isInVisibleArea
                                            ? "rgba(34,211,238,0.4)"
                                            : "rgba(255,255,255,0.03)",
                                    }}
                                    style={{
                                        border: "1px solid rgba(255,255,255,0.03)",
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    {!isVisible && (
                                        <span className="text-[7px] text-white/8">✕</span>
                                    )}
                                    {isVisible && isCurrentRow && (
                                        <span className="text-[8px] font-bold" style={{ color: COLORS[col] }}>
                                            {TOKENS[col].slice(0, 2)}
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Explanation */}
            <motion.div
                className="mt-4 rounded-xl px-4 py-3 text-center"
                style={{ background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.08)" }}
                key={position}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <p className="text-[13px]">
                    <span className="font-bold" style={{ color: COLORS[position] }}>
                        &quot;{TOKENS[position]}&quot;
                    </span>
                    <span className="text-white/30">
                        {" "}(position {position + 1}) sees{" "}
                        <span className="font-bold text-white/50">{position + 1}</span> token{position > 0 ? "s" : ""}
                    </span>
                </p>
                <p className="text-[11px] text-white/15 mt-1">
                    The visible triangle grows one row at a time — each new token sees everything before it.
                </p>
            </motion.div>

            {/* Auto-play buttons */}
            <div className="flex items-center justify-center gap-2 mt-3">
                <motion.button
                    onClick={() => setPosition(Math.max(0, position - 1))}
                    className="px-3 py-1 rounded-md text-[12px] font-bold text-white/20 hover:text-white/40"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                    whileTap={{ scale: 0.95 }}
                    disabled={position === 0}
                >
                    ← Prev
                </motion.button>
                <motion.button
                    onClick={() => setPosition(Math.min(N - 1, position + 1))}
                    className="px-3 py-1 rounded-md text-[12px] font-bold text-white/20 hover:text-white/40"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                    whileTap={{ scale: 0.95 }}
                    disabled={position === N - 1}
                >
                    Next →
                </motion.button>
            </div>
        </div>
    );
}
