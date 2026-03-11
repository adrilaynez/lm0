"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  V34 — SimpleNumbersViz
  Two separate bar columns (meaning + position) each at own scale,
  so meaning is ALWAYS visible. Proportion bar below shows the
  drowning / invisible effect dramatically. Cyan = meaning, amber = position.
*/

const WORDS = ["The", "dog", "bit", "the", "man"];
const EMBED_VALS = [0.4, 0.9, 0.7, 0.4, 0.8];
const MAX_EMBED = Math.max(...EMBED_VALS);

type ScaleMode = "big" | "small";

export function SimpleNumbersViz() {
    const [mode, setMode] = useState<ScaleMode>("big");

    const posValues = WORDS.map((_, i) =>
        mode === "big" ? (i + 1) * 100 : (i + 1) * 0.001
    );
    const combined = EMBED_VALS.map((e, i) => e + posValues[i]);
    const maxPos = Math.max(...posValues);

    /* For "dog" (index 1) proportion */
    const dogMeanPct = (EMBED_VALS[1] / combined[1]) * 100;
    const dogPosPct = (posValues[1] / combined[1]) * 100;

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-4">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {(["big", "small"] as const).map((m) => {
                    const active = mode === m;
                    return (
                        <motion.button
                            key={m}
                            onClick={() => setMode(m)}
                            whileTap={{ scale: 0.95 }}
                            className="px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-all cursor-pointer"
                            style={{
                                background: active
                                    ? "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(34,211,238,0.06))"
                                    : "rgba(255,255,255,0.04)",
                                color: active ? "#22d3ee" : "rgba(255,255,255,0.4)",
                                border: active
                                    ? "1.5px solid rgba(34,211,238,0.35)"
                                    : "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            {m === "big" ? "Big numbers (+100, +200…)" : "Tiny numbers (+0.001, +0.002…)"}
                        </motion.button>
                    );
                })}
            </div>

            {/* Column headers */}
            <div className="max-w-xl mx-auto grid grid-cols-[26px_44px_1fr_1fr_68px] sm:grid-cols-[30px_52px_1fr_1fr_76px] gap-x-2 mb-2 px-1">
                <span />
                <span />
                <span className="text-[11px] uppercase tracking-[0.1em] font-semibold text-cyan-400/50 pl-1">Meaning</span>
                <span className="text-[11px] uppercase tracking-[0.1em] font-semibold text-amber-400/50 pl-1">Position</span>
                <span className="text-[11px] uppercase tracking-[0.1em] font-semibold text-white/25 text-right">Sum</span>
            </div>

            {/* Rows — each column at its own scale */}
            <div className="space-y-2 max-w-xl mx-auto">
                {WORDS.map((word, i) => (
                    <motion.div
                        key={`${i}-${mode}`}
                        className="grid grid-cols-[26px_44px_1fr_1fr_68px] sm:grid-cols-[30px_52px_1fr_1fr_76px] gap-x-2 items-center px-1"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        {/* Position # */}
                        <span className="text-[13px] font-mono text-white/25 text-center">{i + 1}</span>

                        {/* Word */}
                        <span className="text-[14px] font-mono font-bold text-white/65 text-right">{word}</span>

                        {/* Meaning bar — scaled 0–1 (always clearly visible) */}
                        <div className="h-9 rounded-lg relative overflow-hidden" style={{ background: "rgba(34,211,238,0.04)" }}>
                            <motion.div
                                className="absolute inset-y-0 left-0 rounded-lg"
                                style={{ background: "linear-gradient(90deg, rgba(34,211,238,0.40), rgba(34,211,238,0.12))" }}
                                animate={{ width: `${(EMBED_VALS[i] / MAX_EMBED) * 88 + 8}%` }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-mono font-semibold text-cyan-300/90">
                                {EMBED_VALS[i].toFixed(1)}
                            </span>
                        </div>

                        {/* Position bar — scaled to max position */}
                        <div className="h-9 rounded-lg relative overflow-hidden" style={{ background: "rgba(251,191,36,0.04)" }}>
                            <motion.div
                                className="absolute inset-y-0 left-0 rounded-lg"
                                style={{ background: "linear-gradient(90deg, rgba(251,191,36,0.35), rgba(251,191,36,0.10))" }}
                                animate={{ width: `${(posValues[i] / maxPos) * 88 + 8}%` }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-mono font-semibold text-amber-300/90 whitespace-nowrap">
                                +{mode === "big" ? posValues[i] : posValues[i].toFixed(3)}
                            </span>
                        </div>

                        {/* Combined */}
                        <span className="text-[13px] font-mono font-semibold text-white/50 text-right">
                            = {mode === "big" ? combined[i].toFixed(0) : combined[i].toFixed(3)}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Proportion bar — what "dog" actually looks like combined */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    className="max-w-xl mx-auto mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <p className="text-[12px] text-white/35 mb-2 text-center font-medium">
                        What the model actually sees for &ldquo;dog&rdquo;:
                    </p>
                    <div className="h-7 rounded-lg overflow-hidden flex" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <motion.div
                            className="h-full flex items-center justify-center overflow-hidden"
                            style={{ background: "rgba(34,211,238,0.40)", minWidth: mode === "big" ? 2 : undefined }}
                            animate={{ width: `${Math.max(dogMeanPct, 1.5)}%` }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        >
                            {dogMeanPct > 10 && (
                                <span className="text-[11px] font-mono text-white/80 font-semibold whitespace-nowrap px-1">
                                    {dogMeanPct.toFixed(0)}% meaning
                                </span>
                            )}
                        </motion.div>
                        <motion.div
                            className="h-full flex items-center justify-center overflow-hidden"
                            style={{ background: "rgba(251,191,36,0.35)", minWidth: mode === "small" ? 2 : undefined }}
                            animate={{ width: `${Math.max(dogPosPct, 1.5)}%` }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        >
                            {dogPosPct > 10 && (
                                <span className="text-[11px] font-mono text-white/80 font-semibold whitespace-nowrap px-1">
                                    {dogPosPct.toFixed(0)}% position
                                </span>
                            )}
                        </motion.div>
                    </div>
                    {/* Annotation for the tiny sliver */}
                    <p className="text-[11px] font-mono text-center mt-1.5" style={{ color: mode === "big" ? "rgba(34,211,238,0.5)" : "rgba(251,191,36,0.5)" }}>
                        {mode === "big"
                            ? `← meaning is ${dogMeanPct.toFixed(1)}% of the combined value`
                            : `position is only ${dogPosPct.toFixed(1)}% of the combined value →`}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Explanation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`insight-${mode}`}
                    className="mt-4 rounded-xl p-5 max-w-xl mx-auto"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: 0.35 }}
                    style={{
                        background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(34,211,238,0.04))",
                        border: "1px solid rgba(251,191,36,0.18)",
                    }}
                >
                    <p className="text-[14px] font-semibold mb-1.5 text-amber-400">
                        {mode === "big" ? "Position drowns out meaning" : "Position signal is invisible"}
                    </p>
                    <p className="text-[14px] text-white/50 leading-relaxed">
                        {mode === "big"
                            ? `Look at "dog" — its meaning is 0.9, but position adds +200. The model sees 200.9 and thinks "that's basically just 200." It forgot what "dog" even means.`
                            : `The difference between position 1 (+0.001) and position 5 (+0.005) is just 0.004. The model's meaning values are around 0.4–0.9. That tiny position signal gets lost in the noise.`}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
