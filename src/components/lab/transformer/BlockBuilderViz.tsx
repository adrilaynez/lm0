"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  V42 — BlockBuilderViz (Redesign v2)
  Sequential quiz: build the Transformer block step by step.
  At each step, pick the correct component from 4 options.
  Pipeline builds from top to bottom as you go.
  Wrong → hint. All correct → celebration.
*/

interface Component {
    id: string;
    label: string;
    icon: string;
    color: string;
    rgb: string;
}

const COMPONENTS: Component[] = [
    { id: "norm", label: "Normalize", icon: "\u2696\uFE0F", color: "#a78bfa", rgb: "167,139,250" },
    { id: "attn", label: "Listen", icon: "\uD83D\uDC42", color: "#22d3ee", rgb: "34,211,238" },
    { id: "add", label: "Add Original", icon: "\u2295", color: "#34d399", rgb: "52,211,153" },
    { id: "ffn", label: "Think", icon: "\uD83E\uDDE0", color: "#fbbf24", rgb: "251,191,36" },
];

const CORRECT: string[] = ["norm", "attn", "add", "norm", "ffn", "add"];

const HINTS: string[] = [
    "Clean the input first \u2014 normalize before processing!",
    "Now it\u2019s time to gather context \u2014 listen!",
    "Preserve the original signal \u2014 add it back!",
    "The FFN needs clean input too \u2014 normalize again!",
    "Process what was heard \u2014 time to think!",
    "One more residual \u2014 preserve the signal!",
];

const STEP_LABELS: string[] = [
    "What comes first?",
    "Input is clean. What\u2019s next?",
    "Tokens listened. Now what?",
    "Before the FFN, we need to\u2026",
    "Input is clean again. Now\u2026",
    "Almost done! Last step\u2026",
];

export function BlockBuilderViz() {
    const [step, setStep] = useState(0);
    const [placed, setPlaced] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [wrongId, setWrongId] = useState<string | null>(null);
    const done = placed.length === 6;

    const handlePick = useCallback((id: string) => {
        if (done) return;
        if (id !== CORRECT[step]) {
            setError(HINTS[step]);
            setWrongId(id);
            setTimeout(() => { setError(null); setWrongId(null); }, 1800);
            return;
        }
        setError(null);
        setWrongId(null);
        setPlaced(prev => [...prev, id]);
        setStep(s => s + 1);
    }, [step, done]);

    const handleReset = useCallback(() => {
        setStep(0);
        setPlaced([]);
        setError(null);
        setWrongId(null);
    }, []);

    const getComp = (id: string) => COMPONENTS.find(c => c.id === id)!;

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-6">
            {/* Built pipeline */}
            <div className="flex flex-col items-center gap-1 mb-5">
                {/* Input */}
                <div className="px-3.5 py-1 rounded-full text-[12px] font-semibold text-white/25"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    {"\u2193"} Input
                </div>

                {placed.map((id, i) => {
                    const comp = getComp(id);
                    return (
                        <motion.div key={i}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{
                                background: `rgba(${comp.rgb}, 0.06)`,
                                border: `1px solid rgba(${comp.rgb}, 0.2)`,
                                minWidth: 160,
                            }}
                            initial={{ opacity: 0, scale: 0.85, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 16 }}>
                            <span className="text-[15px]">{comp.icon}</span>
                            <span className="text-[13px] font-bold" style={{ color: comp.color }}>{comp.label}</span>
                        </motion.div>
                    );
                })}

                {/* Next slot indicator */}
                {!done && (
                    <motion.div
                        className="px-4 py-2 rounded-xl flex items-center justify-center"
                        style={{
                            border: "1.5px dashed rgba(255,255,255,0.12)",
                            minWidth: 160, minHeight: 40,
                        }}
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}>
                        <span className="text-[12px] text-white/15 font-semibold">Step {step + 1}</span>
                    </motion.div>
                )}

                {/* Remaining empty slots */}
                {Array.from({ length: Math.max(0, 5 - step) }).map((_, i) => (
                    <div key={`empty-${i}`}
                        className="px-4 py-2 rounded-xl"
                        style={{
                            border: "1px dashed rgba(255,255,255,0.04)",
                            minWidth: 160, minHeight: 40,
                        }} />
                ))}

                {/* Output */}
                <div className="px-3.5 py-1 rounded-full text-[12px] font-semibold"
                    style={{
                        color: done ? "#a78bfa" : "rgba(255,255,255,0.25)",
                        border: `1px solid ${done ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    {"\u2193"} Output
                </div>
            </div>

            {/* Question + options OR success */}
            {done ? (
                <motion.div className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                    <p className="text-[18px] font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent mb-2">
                        You assembled a Transformer block!
                    </p>
                    <p className="text-[13px] text-white/30">
                        normalize {"\u2192"} attend {"\u2192"} add {"\u2192"} normalize {"\u2192"} FFN {"\u2192"} add
                    </p>
                    <motion.button onClick={handleReset}
                        className="mt-3 text-[13px] text-white/25 hover:text-white/40 cursor-pointer transition-colors"
                        whileTap={{ scale: 0.95 }}>
                        {"\u21BB"} Try again
                    </motion.button>
                </motion.div>
            ) : (
                <div className="text-center">
                    <p className="text-[14px] text-white/40 font-semibold mb-3">
                        {STEP_LABELS[step]}
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {COMPONENTS.map(comp => {
                            const isWrong = wrongId === comp.id;
                            return (
                                <motion.button key={comp.id}
                                    onClick={() => handlePick(comp.id)}
                                    whileTap={{ scale: 0.92 }}
                                    animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                                    transition={isWrong ? { duration: 0.35 } : {}}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer"
                                    style={{
                                        background: isWrong ? "rgba(244,63,94,0.08)" : `rgba(${comp.rgb}, 0.05)`,
                                        border: isWrong
                                            ? "1px solid rgba(244,63,94,0.3)"
                                            : `1px solid rgba(${comp.rgb}, 0.15)`,
                                        color: isWrong ? "#f43f5e" : comp.color,
                                    }}>
                                    <span className="text-[14px]">{comp.icon}</span>
                                    {comp.label}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Error hint */}
                    <AnimatePresence>
                        {error && (
                            <motion.p className="text-[13px] text-rose-400/60 mt-3 font-semibold"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}>
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Reset (during quiz) */}
            {!done && placed.length > 0 && (
                <div className="flex justify-center mt-4">
                    <motion.button onClick={handleReset}
                        className="text-[12px] text-white/15 hover:text-white/30 cursor-pointer transition-colors"
                        whileTap={{ scale: 0.95 }}>
                        {"\u21BB"} Reset
                    </motion.button>
                </div>
            )}
        </div>
    );
}
