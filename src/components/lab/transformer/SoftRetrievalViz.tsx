"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V25 — SoftRetrievalViz
  LEFT: "Hard Lookup" — click index → get exactly that one item
  RIGHT: "Soft Lookup (Attention)" — weighted selection → blend
  Height: ~240px.
*/

const ITEMS = [
    { label: "crown", color: "#f472b6", value: "👑 royalty" },
    { label: "golden", color: "#fbbf24", value: "✨ wealth" },
    { label: "wore", color: "#a78bfa", value: "👔 action" },
    { label: "king", color: "#22d3ee", value: "🏰 power" },
    { label: "the", color: "#94a3b8", value: "📎 filler" },
];

const SOFT_WEIGHTS = [0.30, 0.25, 0.20, 0.15, 0.10];

export function SoftRetrievalViz() {
    const [hardIdx, setHardIdx] = useState<number | null>(null);

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-4 space-y-4" style={{ minHeight: 240 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
                {/* LEFT: Hard Lookup */}
                <div className="space-y-3">
                    <p className="text-xs sm:text-sm font-semibold text-center text-white/40 uppercase tracking-wider">
                        Hard Lookup
                    </p>
                    <p className="text-[10px] text-center text-white/20">
                        Click one → get exactly that
                    </p>
                    <div className="space-y-1.5">
                        {ITEMS.map((item, i) => {
                            const isSelected = hardIdx === i;
                            return (
                                <motion.button
                                    key={i}
                                    onClick={() => setHardIdx(hardIdx === i ? null : i)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left"
                                    style={{
                                        background: isSelected ? `${item.color}15` : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${isSelected ? `${item.color}40` : "rgba(255,255,255,0.06)"}`,
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="text-xs sm:text-sm font-mono w-4 text-white/20">{i}</span>
                                    <span className="text-xs sm:text-sm font-semibold flex-1" style={{ color: isSelected ? item.color : "rgba(255,255,255,0.4)" }}>
                                        {item.label}
                                    </span>
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.span
                                                className="text-xs sm:text-sm"
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                {item.value}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Result */}
                    <div className="h-10 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {hardIdx !== null ? (
                                <motion.p
                                    key={hardIdx}
                                    className="text-sm font-bold"
                                    style={{ color: ITEMS[hardIdx].color }}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    Result: {ITEMS[hardIdx].value}
                                </motion.p>
                            ) : (
                                <motion.p key="none" className="text-xs text-white/15 italic"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    Click a row
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* RIGHT: Soft Lookup */}
                <div className="space-y-3">
                    <p className="text-xs sm:text-sm font-semibold text-center uppercase tracking-wider"
                       style={{ color: "rgba(52,211,153,0.6)" }}>
                        Soft Lookup (Attention)
                    </p>
                    <p className="text-[10px] text-center text-white/20">
                        Weighted blend of everything
                    </p>
                    <div className="space-y-1.5">
                        {ITEMS.map((item, i) => {
                            const w = SOFT_WEIGHTS[i];
                            const pct = Math.round(w * 100);
                            return (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                    style={{
                                        background: `${item.color}${Math.round(w * 80).toString(16).padStart(2, "0")}`,
                                        border: `1px solid ${item.color}20`,
                                    }}
                                >
                                    <span className="text-xs sm:text-sm font-semibold flex-1" style={{ color: item.color }}>
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-white/30">{item.value}</span>
                                    <span className="text-xs font-mono font-bold w-8 text-right" style={{ color: item.color }}>
                                        {pct}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Blended result */}
                    <div className="h-10 flex items-center justify-center">
                        <motion.div
                            className="px-4 py-1.5 rounded-lg"
                            style={{
                                background: "linear-gradient(90deg, rgba(244,114,182,0.1), rgba(251,191,36,0.1), rgba(168,139,250,0.1), rgba(34,211,238,0.1))",
                                border: "1px solid rgba(52,211,153,0.2)",
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <p className="text-xs sm:text-sm text-emerald-300/60 font-semibold">
                                Result: a blend of all five
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
