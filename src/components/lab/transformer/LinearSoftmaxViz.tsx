"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  LinearSoftmaxViz — Redesign v2
  
  THE QUESTION THIS ANSWERS:
  "The Transformer produced a vector of numbers. How does that become
  a prediction like 'the next character is probably e'?"
  
  3 steps, crystal clear:
  
  1. EMBEDDING: After all blocks, we have a vector (128 numbers).
     This is the model's "understanding" of what should come next.
     
  2. LINEAR HEAD: Multiply by a weight matrix → get ONE SCORE per character
     in the vocabulary. High score = the model thinks this char is likely.
     
  3. SOFTMAX: Convert raw scores into probabilities that sum to 100%.
     The highest score gets amplified. The lowest become near-zero.
  
  Visual: all 3 steps shown as a VERTICAL FLOW on one screen,
  each step revealed progressively. No confusing abstract matrix diagrams.
*/

const PRESETS = [
    {
        label: "after \u201Cth\u201D",
        context: "th",
        vocab: [
            { char: "e", score: 4.1 }, { char: "a", score: 2.8 }, { char: "i", score: 2.2 },
            { char: "o", score: 1.9 }, { char: "r", score: 1.1 }, { char: "u", score: 0.6 },
            { char: " ", score: 0.2 }, { char: "n", score: -0.3 }, { char: "s", score: -0.8 },
            { char: "t", score: -1.2 }, { char: ".", score: -2.4 }, { char: "z", score: -3.5 },
        ],
    },
    {
        label: "after \u201Cthe ca\u201D",
        context: "the ca",
        vocab: [
            { char: "t", score: 3.9 }, { char: "r", score: 2.5 }, { char: "n", score: 2.3 },
            { char: "s", score: 1.7 }, { char: "l", score: 1.4 }, { char: "m", score: 0.8 },
            { char: "p", score: 0.3 }, { char: "d", score: -0.6 }, { char: "e", score: -1.0 },
            { char: "a", score: -1.9 }, { char: ".", score: -2.3 }, { char: "z", score: -3.4 },
        ],
    },
    {
        label: "after \u201CKing\u201D",
        context: "King",
        vocab: [
            { char: " ", score: 4.5 }, { char: "s", score: 2.4 }, { char: "'", score: 1.8 },
            { char: "d", score: 1.2 }, { char: "l", score: 0.7 }, { char: ",", score: 0.4 },
            { char: ".", score: 0.1 }, { char: "e", score: -0.4 }, { char: "a", score: -0.9 },
            { char: "t", score: -1.3 }, { char: "o", score: -2.1 }, { char: "z", score: -3.6 },
        ],
    },
];

function softmax(scores: number[]): number[] {
    const maxScore = Math.max(...scores);
    const exps = scores.map((s) => Math.exp(s - maxScore));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
}

const displayChar = (ch: string) => (ch === " " ? "\u23B5" : ch);

type Step = 0 | 1 | 2;

export function LinearSoftmaxViz() {
    const [step, setStep] = useState<Step>(0);
    const [pi, setPi] = useState(0);

    const preset = PRESETS[pi];
    const probs = useMemo(() => {
        const raw = preset.vocab.map((v) => v.score);
        const p = softmax(raw);
        return preset.vocab.map((v, i) => ({ char: v.char, prob: p[i] }));
    }, [preset]);

    const winnerChar = displayChar(probs[0].char);
    const winnerProb = (probs[0].prob * 100).toFixed(1);
    const maxScore = Math.max(...preset.vocab.map((v) => Math.abs(v.score)));
    const maxProb = Math.max(...probs.map((p) => p.prob));

    const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, 2) as Step), []);
    const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 0) as Step), []);

    return (
        <div className="py-5 sm:py-7 px-2 sm:px-4 max-w-lg mx-auto">
            {/* Preset selector */}
            <div className="flex items-center justify-center gap-2 mb-4">
                {PRESETS.map((p, i) => (
                    <button key={i} onClick={() => { setPi(i); setStep(0); }}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-mono transition-all"
                        style={{
                            background: pi === i ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)",
                            color: pi === i ? "#22d3ee" : "rgba(255,255,255,0.25)",
                            border: pi === i ? "1px solid rgba(34,211,238,0.2)" : "1px solid rgba(255,255,255,0.05)",
                        }}>{p.label}</button>
                ))}
            </div>

            {/* ══════════════════════════════════════ */}
            {/* STEP 1: THE EMBEDDING                  */}
            {/* ══════════════════════════════════════ */}
            <div className="rounded-xl px-4 py-3 mb-2"
                style={{
                    background: step === 0 ? "rgba(34,211,238,0.03)" : "rgba(255,255,255,0.01)",
                    border: step === 0 ? "1px solid rgba(34,211,238,0.1)" : "1px solid rgba(255,255,255,0.03)",
                    transition: "all 0.3s",
                }}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{
                            background: step >= 0 ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)",
                            color: step >= 0 ? "#22d3ee" : "rgba(255,255,255,0.2)",
                        }}>1</span>
                    <span className="text-[13px] font-semibold" style={{ color: step >= 0 ? "#22d3ee" : "rgba(255,255,255,0.2)" }}>
                        The Embedding
                    </span>
                    <span className="text-[10px] text-white/15 ml-auto font-mono">128 numbers</span>
                </div>

                <p className="text-[12px] text-white/30 leading-relaxed mb-2">
                    After all Transformer blocks, the model produces a vector for the position after
                    <span className="font-mono text-cyan-400/60"> {"\u201C"}{preset.context}{"\u201D"}</span>.
                    This vector encodes everything the model knows about what should come next.
                </p>

                {/* Mini embedding bars */}
                <div className="flex items-end gap-[1.5px] h-8 overflow-hidden rounded">
                    {Array.from({ length: 40 }, (_, i) => {
                        const v = Math.sin(i * 0.7 + pi * 2.1) * 0.5 + Math.cos(i * 0.3 + pi) * 0.3;
                        return (
                            <motion.div key={i} className="flex-1 rounded-[1px]"
                                animate={{
                                    height: `${Math.max(Math.abs(v) * 100, 8)}%`,
                                    opacity: step === 0 ? 0.4 + Math.abs(v) * 0.5 : 0.15,
                                }}
                                style={{
                                    background: v >= 0 ? "rgba(34,211,238,0.5)" : "rgba(251,191,36,0.4)",
                                    alignSelf: v >= 0 ? "flex-end" : "flex-start",
                                }}
                                transition={{ delay: step === 0 ? i * 0.008 : 0, duration: 0.3 }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Arrow */}
            {step >= 1 && (
                <motion.div className="flex items-center justify-center gap-2 py-1"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <span className="text-[10px] text-white/15">{"\u2193"}</span>
                    <span className="text-[9px] text-amber-400/30 font-mono">
                        {"\u00d7"} W<sub>head</sub> (128{"\u00d7"}96)
                    </span>
                    <span className="text-[10px] text-white/15">{"\u2193"}</span>
                </motion.div>
            )}

            {/* ══════════════════════════════════════ */}
            {/* STEP 2: RAW SCORES (LOGITS)            */}
            {/* ══════════════════════════════════════ */}
            {step >= 1 && (
                <motion.div className="rounded-xl px-4 py-3 mb-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{
                        background: step === 1 ? "rgba(251,191,36,0.03)" : "rgba(255,255,255,0.01)",
                        border: step === 1 ? "1px solid rgba(251,191,36,0.1)" : "1px solid rgba(255,255,255,0.03)",
                    }}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                            style={{
                                background: "rgba(251,191,36,0.15)",
                                color: "#fbbf24",
                            }}>2</span>
                        <span className="text-[13px] font-semibold" style={{ color: "#fbbf24" }}>
                            Linear Head \u2192 Raw Scores
                        </span>
                        <span className="text-[10px] text-white/15 ml-auto font-mono">1 per character</span>
                    </div>

                    <p className="text-[12px] text-white/30 leading-relaxed mb-3">
                        Multiply the embedding by a weight matrix. Result: <strong className="text-amber-400/50">one score per character</strong> in the vocabulary.
                        High score = the model thinks this character is likely next. Negative = unlikely.
                    </p>

                    {/* Score bars */}
                    <div className="space-y-[4px]">
                        {preset.vocab.map((item, i) => {
                            const barWidth = Math.abs(item.score) / maxScore * 100;
                            const isPos = item.score >= 0;
                            const t = Math.abs(item.score) / maxScore;
                            return (
                                <motion.div key={item.char}
                                    className="flex items-center gap-1.5"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}>
                                    <span className="w-5 text-right font-mono text-[12px] shrink-0"
                                        style={{ color: `rgba(255,255,255,${0.25 + t * 0.4})` }}>
                                        {displayChar(item.char)}
                                    </span>
                                    <div className="flex-1 h-[14px] rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                                        <motion.div className="h-full rounded"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(barWidth, 1)}%` }}
                                            transition={{ type: "spring", stiffness: 120, damping: 16, delay: i * 0.03 }}
                                            style={{
                                                background: isPos
                                                    ? `rgba(34,211,238,${0.15 + t * 0.45})`
                                                    : `rgba(251,191,36,${0.1 + t * 0.3})`,
                                            }}
                                        />
                                    </div>
                                    <span className="w-10 text-right font-mono text-[11px] shrink-0"
                                        style={{
                                            color: isPos
                                                ? `rgba(34,211,238,${0.3 + t * 0.5})`
                                                : `rgba(251,191,36,${0.2 + t * 0.4})`,
                                        }}>
                                        {item.score > 0 ? "+" : ""}{item.score.toFixed(1)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>

                    <p className="text-[10px] text-white/15 mt-2 text-center">
                        These are raw numbers \u2014 they don\u2019t sum to 100%. We need to convert them to probabilities.
                    </p>
                </motion.div>
            )}

            {/* Arrow */}
            {step >= 2 && (
                <motion.div className="flex items-center justify-center gap-2 py-1"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <span className="text-[10px] text-white/15">{"\u2193"}</span>
                    <span className="text-[9px] text-emerald-400/30 font-mono">
                        softmax(scores)
                    </span>
                    <span className="text-[10px] text-white/15">{"\u2193"}</span>
                </motion.div>
            )}

            {/* ══════════════════════════════════════ */}
            {/* STEP 3: SOFTMAX → PROBABILITIES        */}
            {/* ══════════════════════════════════════ */}
            {step >= 2 && (
                <motion.div className="rounded-xl px-4 py-3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{
                        background: "rgba(52,211,153,0.03)",
                        border: "1px solid rgba(52,211,153,0.1)",
                    }}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                            style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>3</span>
                        <span className="text-[13px] font-semibold" style={{ color: "#34d399" }}>
                            Softmax \u2192 Probabilities
                        </span>
                        <span className="text-[10px] text-white/15 ml-auto font-mono">sum = 100%</span>
                    </div>

                    <p className="text-[12px] text-white/30 leading-relaxed mb-3">
                        Softmax converts raw scores to probabilities: <strong className="text-emerald-400/50">e<sup>score</sup></strong> for each, then divide by the total.
                        The biggest score dominates. Small scores become near-zero.
                    </p>

                    {/* Winner callout */}
                    <motion.div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-3"
                        style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)" }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
                        <span className="text-xl font-mono text-cyan-400 font-bold">{winnerChar}</span>
                        <div>
                            <span className="text-[14px] text-cyan-400 font-bold">{winnerProb}%</span>
                            <span className="text-[11px] text-white/25 ml-1.5">most likely next</span>
                        </div>
                    </motion.div>

                    {/* Probability bars */}
                    <div className="space-y-[4px]">
                        {probs.map((item, i) => {
                            const barWidth = item.prob / maxProb * 100;
                            const isWinner = i === 0;
                            return (
                                <motion.div key={item.char}
                                    className="flex items-center gap-1.5"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + i * 0.03 }}>
                                    <span className="w-5 text-right font-mono text-[12px] shrink-0"
                                        style={{ color: isWinner ? "#22d3ee" : "rgba(255,255,255,0.25)" }}>
                                        {displayChar(item.char)}
                                    </span>
                                    <div className="flex-1 h-[14px] rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                                        <motion.div className="h-full rounded"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(barWidth, 0.5)}%` }}
                                            transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.15 + i * 0.03 }}
                                            style={{
                                                background: isWinner ? "rgba(34,211,238,0.6)" : `rgba(52,211,153,${0.1 + (item.prob / maxProb) * 0.4})`,
                                                boxShadow: isWinner ? "0 0 8px rgba(34,211,238,0.25)" : "none",
                                            }}
                                        />
                                    </div>
                                    <span className="w-12 text-right font-mono text-[11px] shrink-0"
                                        style={{ color: isWinner ? "#22d3ee" : `rgba(52,211,153,${0.2 + (item.prob / maxProb) * 0.4})` }}>
                                        {(item.prob * 100).toFixed(1)}%
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>

                    <motion.p className="text-[10px] text-white/15 mt-2 text-center"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        The model samples from this distribution to pick the next character.
                    </motion.p>
                </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-center gap-3 mt-5">
                {step > 0 && (
                    <button onClick={prevStep}
                        className="px-3 py-1.5 rounded-lg text-[12px] text-white/30 hover:text-white/50 cursor-pointer transition-colors"
                        style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                        {"\u2190"} Back
                    </button>
                )}
                {step < 2 && (
                    <button onClick={nextStep}
                        className="px-4 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer"
                        style={{
                            background: step === 0 ? "rgba(251,191,36,0.1)" : "rgba(52,211,153,0.1)",
                            border: step === 0 ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(52,211,153,0.25)",
                            color: step === 0 ? "#fbbf24" : "#34d399",
                        }}>
                        {step === 0 ? "Apply Linear Head \u2192" : "Apply Softmax \u2192"}
                    </button>
                )}
            </div>
        </div>
    );
}
