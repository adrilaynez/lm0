"use client";

import { useState, useCallback } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  V55 — GrowingContextViz
  Autoregressive generation demo. Click "Generate" to add one token at a time.
  Shows expanding attention matrix as context grows.
*/

const PROMPT = ["The", "professor", "published"];
const GENERATED = ["the", "groundbreaking", "paper", "on", "neural", "networks"];
const ALL_TOKENS = [...PROMPT, ...GENERATED];
const COLORS = ["#67e8f9", "#34d399", "#a78bfa", "#fbbf24", "#f472b6", "#fb923c", "#60a5fa", "#f9a8d4", "#86efac"];

function getColor(i: number) {
    return COLORS[i % COLORS.length];
}

export function GrowingContextViz() {
    const [generated, setGenerated] = useState(0); // how many tokens generated so far
    const totalVisible = PROMPT.length + generated;

    const generateNext = useCallback(() => {
        if (generated < GENERATED.length) {
            setGenerated((g) => g + 1);
        }
    }, [generated]);

    const reset = useCallback(() => setGenerated(0), []);

    const visibleTokens = ALL_TOKENS.slice(0, totalVisible);
    const nextToken = generated < GENERATED.length ? GENERATED[generated] : null;

    return (
        <div className="py-5 px-4 sm:px-6">
            {/* Token sequence */}
            <div className="flex items-center justify-center gap-1.5 mb-5 flex-wrap">
                {visibleTokens.map((tok, i) => {
                    const isPrompt = i < PROMPT.length;
                    const isLatest = i === totalVisible - 1 && generated > 0;
                    const c = getColor(i);

                    return (
                        <motion.div
                            key={i}
                            className="px-2.5 py-1.5 rounded-lg text-[13px] font-bold"
                            style={{
                                background: isLatest ? `${c}18` : isPrompt ? "rgba(255,255,255,0.04)" : `${c}08`,
                                border: `1.5px solid ${isLatest ? `${c}50` : isPrompt ? "rgba(255,255,255,0.08)" : `${c}15`}`,
                                color: isPrompt ? "rgba(255,255,255,0.5)" : c,
                            }}
                            initial={!isPrompt ? { opacity: 0, scale: 0.8, y: 8 } : undefined}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                            {tok}
                        </motion.div>
                    );
                })}

                {/* Next token placeholder */}
                {nextToken && (
                    <motion.div
                        className="px-2.5 py-1.5 rounded-lg text-[13px] font-bold"
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1.5px dashed rgba(34,211,238,0.2)",
                            color: "rgba(34,211,238,0.3)",
                        }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        ?
                    </motion.div>
                )}
            </div>

            {/* Mini attention matrix */}
            <div className="mx-auto mb-4" style={{ maxWidth: Math.min(totalVisible * 36 + 50, 360) }}>
                <p className="text-[10px] text-white/15 text-center mb-2 font-semibold">
                    Attention map ({totalVisible} tokens)
                </p>
                {visibleTokens.map((_, row) => (
                    <div key={row} className="flex items-center gap-px mb-px">
                        <div style={{ width: 28 }} className="text-right pr-1">
                            <span className="text-[8px] font-mono" style={{ color: `${getColor(row)}40` }}>
                                {visibleTokens[row].slice(0, 3)}
                            </span>
                        </div>
                        {visibleTokens.map((_, col) => {
                            const canSee = col <= row;
                            const isLastRow = row === totalVisible - 1;
                            const weight = canSee ? (0.3 + Math.random() * 0.7) * (isLastRow ? 1 : 0.4) : 0;

                            return (
                                <motion.div
                                    key={col}
                                    className="flex-1 aspect-square rounded-sm"
                                    style={{
                                        background: canSee
                                            ? `rgba(34,211,238,${weight * 0.4})`
                                            : "rgba(0,0,0,0.3)",
                                        border: isLastRow && canSee
                                            ? "1px solid rgba(34,211,238,0.2)"
                                            : "1px solid rgba(255,255,255,0.02)",
                                    }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: (row * totalVisible + col) * 0.005 }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Current prediction explanation */}
            <AnimatePresence mode="wait">
                {generated > 0 && (
                    <motion.div
                        key={generated}
                        className="rounded-xl px-4 py-3 text-center mb-4"
                        style={{ background: "rgba(34,211,238,0.03)", border: "1px solid rgba(34,211,238,0.08)" }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                    >
                        <p className="text-[13px] text-white/30">
                            To predict{" "}
                            <span className="font-bold" style={{ color: getColor(totalVisible - 1) }}>
                                &quot;{visibleTokens[totalVisible - 1]}&quot;
                            </span>
                            , the model attended to{" "}
                            <span className="font-bold text-white/50">{totalVisible - 1}</span> previous tokens
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                <motion.button
                    onClick={generateNext}
                    disabled={!nextToken}
                    className="px-5 py-2 rounded-xl text-[13px] font-bold"
                    style={{
                        background: nextToken ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${nextToken ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.04)"}`,
                        color: nextToken ? "#22d3ee" : "rgba(255,255,255,0.1)",
                        cursor: nextToken ? "pointer" : "default",
                    }}
                    whileHover={nextToken ? { scale: 1.03 } : {}}
                    whileTap={nextToken ? { scale: 0.97 } : {}}
                >
                    {nextToken ? `Generate → "${nextToken}"` : "✓ Complete"}
                </motion.button>

                {generated > 0 && (
                    <motion.button
                        onClick={reset}
                        className="text-[12px] font-semibold text-white/15 hover:text-white/30"
                        whileTap={{ scale: 0.95 }}
                    >
                        ↻ Reset
                    </motion.button>
                )}
            </div>

            {/* Final message */}
            {generated >= GENERATED.length && (
                <motion.div
                    className="mt-4 rounded-xl px-4 py-3 text-center"
                    style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.1)" }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <p className="text-[13px] font-bold" style={{ color: "#34d399" }}>
                        Each new word saw the entire history.
                    </p>
                    <p className="text-[11px] text-white/20 mt-1">
                        Word {totalVisible} attended to all {totalVisible - 1} previous words — full context, every step.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
