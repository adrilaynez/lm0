"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Lightbulb, RotateCcw } from "lucide-react";

/*
  SoftmaxStepVisualizer — v2 (Pipeline Deep-Dive)
  Shows the hidden→output→softmax pipeline step by step with much more detail:
  Step 0: Overview — mini network diagram showing hidden→output→softmax flow
  Step 1: Hidden layer output (128 neurons → show 8 representative values)
  Step 2: The output layer explained — each neuron reads ALL 128 hidden values
  Step 3: Raw logits (27 scores)
  Step 4: Exponentiate
  Step 5: Normalize → probabilities
  Step 6: Final prediction
  All data is illustrative for clarity.
*/

const STEPS = [
    { id: "overview", label: "Overview", color: "#94a3b8" },
    { id: "hidden", label: "Hidden", color: "#34d399" },
    { id: "output", label: "Output Layer", color: "#38bdf8" },
    { id: "logits", label: "Logits", color: "#60a5fa" },
    { id: "exp", label: "exp()", color: "#f59e0b" },
    { id: "normalize", label: "÷ sum", color: "#a78bfa" },
    { id: "predict", label: "Predict", color: "#f43f5e" },
] as const;

// Mock hidden layer output (8 representative neurons out of 128)
const HIDDEN_NEURONS = [
    { id: 0, label: "h₀", value: 0.82, desc: "vowel detector" },
    { id: 1, label: "h₁", value: -0.45, desc: "consonant cluster" },
    { id: 2, label: "h₂", value: 0.97, desc: "word ending" },
    { id: 3, label: "h₃", value: 0.03, desc: "rare pattern" },
    { id: 4, label: "h₄", value: -0.91, desc: "space predictor" },
    { id: 5, label: "h₅", value: 0.67, desc: "frequency" },
    { id: 6, label: "h₆", value: -0.28, desc: "digram history" },
    { id: 7, label: "h₇", value: 0.44, desc: "position sense" },
];

// Mock weights from hidden→output for character "e" (showing 8 out of 128)
const WEIGHTS_FOR_E = [0.42, -0.15, 0.38, 0.02, -0.71, 0.29, -0.11, 0.18];
const DOT_TERMS_E = HIDDEN_NEURONS.map((n, i) => n.value * WEIGHTS_FOR_E[i]);

// Mock top-6 logits (out of 27) after W2 multiplication
const TOP_CHARS = ["e", "t", "a", "s", "h", "n"];
const RAW_LOGITS = [3.2, 2.8, 2.1, 1.4, 0.7, 0.3];
const EXP_VALS = RAW_LOGITS.map(v => Math.exp(v));
const SUM_EXP = EXP_VALS.reduce((s, v) => s + v, 0) + 12.5;
const PROBS = EXP_VALS.map(v => v / SUM_EXP);

export function SoftmaxStepVisualizer() {
    const [step, setStep] = useState(0);

    const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const reset = () => setStep(0);

    const maxLogit = Math.max(...RAW_LOGITS);
    const maxExp = Math.max(...EXP_VALS);
    const maxProb = Math.max(...PROBS);

    return (
        <div className="space-y-4">
            {/* Step progress bar */}
            <div className="flex items-center gap-0.5">
                {STEPS.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => setStep(i)}
                        className="flex-1 h-7 rounded-md flex items-center justify-center text-[8px] font-mono font-bold transition-all"
                        style={{
                            backgroundColor: i === step ? s.color + "20" : i < step ? s.color + "08" : "rgba(255,255,255,0.02)",
                            borderWidth: 1,
                            borderColor: i === step ? s.color + "50" : i < step ? s.color + "15" : "rgba(255,255,255,0.04)",
                            color: i === step ? s.color : i < step ? s.color + "60" : "rgba(255,255,255,0.15)",
                        }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Main content area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 space-y-3"
                >
                    {/* Step 0: Overview diagram */}
                    {step === 0 && (
                        <>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                    The Pipeline: Hidden → Output → Softmax → Prediction
                                </p>
                                <p className="text-xs text-white/45 leading-relaxed">
                                    The hidden layer has already processed the input — it produced <strong className="text-emerald-400">128 numbers</strong>,
                                    each representing a detected pattern (vowel presence, word endings, letter frequency, etc.).
                                    Now we need to convert those 128 &quot;features&quot; into a probability for each of our <strong className="text-blue-400">27 characters</strong>.
                                </p>
                            </div>

                            {/* Mini network diagram */}
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                                <svg viewBox="0 0 400 140" className="w-full" style={{ maxHeight: 180 }}>
                                    {/* Hidden layer column */}
                                    {[0, 1, 2, 3, 4].map((n, i) => {
                                        const y = 20 + i * 22;
                                        return (
                                            <g key={`h${i}`}>
                                                <circle cx={60} cy={y} r={8} fill="#34d399" fillOpacity={0.3} stroke="#34d399" strokeWidth={0.5} strokeOpacity={0.5} />
                                                <text x={60} y={y + 3} textAnchor="middle" fill="#34d399" fontSize={6} fontFamily="monospace" fontWeight={600}>h{i}</text>
                                            </g>
                                        );
                                    })}
                                    <text x={60} y={135} textAnchor="middle" fill="#34d399" fontSize={6} fontFamily="monospace" opacity={0.5}>128 neurons</text>
                                    <text x={60} y={125} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={5} fontFamily="monospace">...</text>

                                    {/* Weight matrix symbol */}
                                    <rect x={130} y={30} width={40} height={60} rx={4} fill="rgba(56,189,248,0.1)" stroke="rgba(56,189,248,0.3)" strokeWidth={0.5} />
                                    <text x={150} y={55} textAnchor="middle" fill="#38bdf8" fontSize={7} fontFamily="monospace" fontWeight={700}>W₂</text>
                                    <text x={150} y={67} textAnchor="middle" fill="#38bdf8" fontSize={5} fontFamily="monospace" opacity={0.5}>128×27</text>

                                    {/* Connection lines: hidden → W2 */}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line key={`lh${i}`} x1={68} y1={20 + i * 22} x2={130} y2={55} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                                    ))}

                                    {/* Output neurons */}
                                    {["a", "b", "e", "t", "z"].map((ch, i) => {
                                        const y = 15 + i * 24;
                                        return (
                                            <g key={`o${ch}`}>
                                                <line x1={170} y1={55} x2={230} y2={y + 4} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                                                <circle cx={240} cy={y + 4} r={8} fill="#60a5fa" fillOpacity={ch === "e" ? 0.5 : 0.2} stroke="#60a5fa" strokeWidth={0.5} strokeOpacity={ch === "e" ? 0.7 : 0.3} />
                                                <text x={240} y={y + 7} textAnchor="middle" fill="#60a5fa" fontSize={7} fontFamily="monospace" fontWeight={ch === "e" ? 700 : 400} opacity={ch === "e" ? 1 : 0.5}>{ch}</text>
                                            </g>
                                        );
                                    })}
                                    <text x={240} y={135} textAnchor="middle" fill="#60a5fa" fontSize={6} fontFamily="monospace" opacity={0.5}>27 logits</text>

                                    {/* Softmax box */}
                                    <rect x={280} y={30} width={40} height={60} rx={4} fill="rgba(167,139,250,0.1)" stroke="rgba(167,139,250,0.3)" strokeWidth={0.5} />
                                    <text x={300} y={55} textAnchor="middle" fill="#a78bfa" fontSize={6} fontFamily="monospace" fontWeight={700}>soft</text>
                                    <text x={300} y={64} textAnchor="middle" fill="#a78bfa" fontSize={6} fontFamily="monospace" fontWeight={700}>max</text>

                                    {/* Connection lines: output → softmax */}
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <line key={`lo${i}`} x1={248} y1={15 + i * 24 + 4} x2={280} y2={55} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                                    ))}

                                    {/* Probability output */}
                                    <line x1={320} y1={55} x2={350} y2={55} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                                    <rect x={352} y={35} width={40} height={40} rx={4} fill="rgba(244,63,94,0.1)" stroke="rgba(244,63,94,0.3)" strokeWidth={0.5} />
                                    <text x={372} y={52} textAnchor="middle" fill="#f43f5e" fontSize={6} fontFamily="monospace" fontWeight={700}>P(e)</text>
                                    <text x={372} y={62} textAnchor="middle" fill="#f43f5e" fontSize={7} fontFamily="monospace" fontWeight={700}>28%</text>
                                </svg>
                            </div>

                            {/* Key concept callout */}
                            <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/[0.04] p-2.5">
                                <Lightbulb className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-mono text-blue-400/70 leading-relaxed">
                                    <strong>Key insight:</strong> Each of the 27 output neurons receives ALL 128 hidden values. It multiplies each one by its own learned weight, adds them up, and produces a single score — the <strong>&quot;logit&quot;</strong> for that character. The &quot;e&quot; neuron might learn: &quot;if vowel-detector is high AND word-ending is high → boost my score.&quot;
                                </p>
                            </div>
                        </>
                    )}

                    {/* Step 1: Hidden layer output */}
                    {step === 1 && (
                        <>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                    128 neurons → 128 numbers (showing 8)
                                </p>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Each hidden neuron outputs a number between <strong className="text-emerald-400">−1</strong> and <strong className="text-emerald-400">+1</strong> (because of tanh).
                                    Together, they form a <strong className="text-emerald-400">128-dimensional vector</strong> — a compressed representation of what the network has detected so far. Think of it as 128 different &quot;questions&quot; the network has answered about the input.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                {HIDDEN_NEURONS.map((n, i) => (
                                    <div key={n.id} className="flex items-center gap-2">
                                        <span className="w-6 text-[10px] font-mono text-emerald-400/70 text-right shrink-0">{n.label}</span>
                                        <div className="flex-1 h-5 relative rounded bg-white/[0.02]">
                                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
                                            <motion.div
                                                className="absolute top-0.5 bottom-0.5 rounded-sm"
                                                initial={{ width: 0 }}
                                                animate={{
                                                    left: n.value >= 0 ? "50%" : `${50 + (n.value / 1) * 50}%`,
                                                    width: `${Math.abs(n.value) * 50}%`,
                                                }}
                                                transition={{ duration: 0.4, delay: i * 0.04 }}
                                                style={{
                                                    backgroundColor: n.value >= 0 ? "#34d399" : "#f43f5e",
                                                    opacity: 0.5,
                                                }}
                                            />
                                            <span className="absolute right-1.5 top-0.5 text-[8px] font-mono text-white/30">
                                                {n.value.toFixed(2)}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-mono text-white/20 w-24 shrink-0 truncate">{n.desc}</span>
                                    </div>
                                ))}
                                <p className="text-[8px] font-mono text-white/15 text-center">... + 120 more neurons with their own detected features</p>
                            </div>
                        </>
                    )}

                    {/* Step 2: Output layer — the key explanation */}
                    {step === 2 && (
                        <>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                    How the &quot;e&quot; neuron computes its score
                                </p>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    The output neuron for <strong className="text-sky-400">&quot;e&quot;</strong> has <strong className="text-sky-400">128 weights</strong> — one per hidden neuron. It multiplies each hidden value by its weight, sums everything, and adds a bias. The result is the &quot;logit&quot; (raw score) for the letter &quot;e&quot;.
                                </p>
                            </div>

                            {/* Dot product visualization */}
                            <div className="rounded-lg border border-sky-500/15 bg-sky-500/[0.03] p-2.5 space-y-1">
                                <div className="flex items-center gap-1 text-[8px] font-mono text-white/25 mb-1">
                                    <span className="w-6 text-right">h</span>
                                    <span className="w-3 text-center">×</span>
                                    <span className="w-10 text-right">w</span>
                                    <span className="w-3 text-center">=</span>
                                    <span className="flex-1">contribution</span>
                                </div>
                                {HIDDEN_NEURONS.map((n, i) => {
                                    const w = WEIGHTS_FOR_E[i];
                                    const term = DOT_TERMS_E[i];
                                    const maxTerm = Math.max(...DOT_TERMS_E.map(Math.abs));
                                    return (
                                        <div key={n.id} className="flex items-center gap-1">
                                            <span className="w-6 text-[8px] font-mono text-emerald-400/50 text-right shrink-0">{n.value.toFixed(2)}</span>
                                            <span className="w-3 text-[8px] font-mono text-white/15 text-center">×</span>
                                            <span className="w-10 text-[8px] font-mono text-sky-400/50 text-right shrink-0">{w.toFixed(2)}</span>
                                            <span className="w-3 text-[8px] font-mono text-white/15 text-center">=</span>
                                            <div className="flex-1 h-3.5 relative bg-white/[0.02] rounded-sm overflow-hidden">
                                                {term >= 0 ? (
                                                    <motion.div
                                                        className="absolute top-0 left-1/2 h-full rounded-r-sm bg-sky-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(term / maxTerm) * 50}%` }}
                                                        transition={{ duration: 0.3, delay: i * 0.04 }}
                                                        style={{ opacity: 0.5 }}
                                                    />
                                                ) : (
                                                    <motion.div
                                                        className="absolute top-0 h-full rounded-l-sm bg-rose-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(Math.abs(term) / maxTerm) * 50}%`, right: "50%" }}
                                                        transition={{ duration: 0.3, delay: i * 0.04 }}
                                                        style={{ opacity: 0.5 }}
                                                    />
                                                )}
                                                <div className="absolute top-0 left-1/2 w-px h-full bg-white/10" />
                                            </div>
                                            <span className="w-10 text-[7px] font-mono text-right shrink-0 tabular-nums"
                                                style={{ color: term >= 0 ? "rgba(56,189,248,0.5)" : "rgba(244,63,94,0.5)" }}>
                                                {term >= 0 ? "+" : ""}{term.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div className="flex items-center gap-1 pt-1 border-t border-white/[0.06]">
                                    <span className="text-[8px] font-mono text-white/20">sum + bias + 120 more terms</span>
                                    <span className="ml-auto text-[9px] font-mono font-bold text-sky-400">= {RAW_LOGITS[0].toFixed(1)} (logit for &quot;e&quot;)</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 rounded-lg border border-sky-500/15 bg-sky-500/[0.03] p-2">
                                <Lightbulb className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-mono text-sky-400/60 leading-relaxed">
                                    Each of the <strong>27 output neurons</strong> does this SAME dot product with its own unique set of 128 weights. The &quot;t&quot; neuron has different weights, the &quot;a&quot; neuron has different weights, etc. Together, the 27 × 128 = <strong>3,456 weights</strong> in W₂ are what the network learns during training.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Step 3: Raw logits */}
                    {step === 3 && (
                        <>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                    27 logits — one score per character
                                </p>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Each output neuron has produced its score. <strong className="text-blue-400">&quot;e&quot; scored 3.2</strong> — the highest — meaning the hidden features strongly matched &quot;e&quot;-favoring weights. But these are raw numbers, not probabilities. They can be any value, and they don&apos;t sum to 1.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                {TOP_CHARS.map((ch, i) => (
                                    <div key={ch} className="flex items-center gap-2">
                                        <span className="w-5 text-right text-[10px] font-mono font-bold text-blue-400/70 shrink-0">{ch}</span>
                                        <div className="flex-1 h-5 relative rounded bg-white/[0.02]">
                                            <motion.div
                                                className="absolute top-0.5 bottom-0.5 left-0 rounded-sm bg-blue-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(RAW_LOGITS[i] / maxLogit) * 100}%` }}
                                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                                style={{ opacity: 0.5 }}
                                            />
                                            <span className="absolute right-1.5 top-0.5 text-[8px] font-mono text-blue-400/60">
                                                {RAW_LOGITS[i].toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[8px] font-mono text-white/15 text-center">... + 21 more characters with lower logits</p>
                            </div>
                            <p className="text-[10px] font-mono text-blue-400/50 leading-relaxed">
                                <strong>Problem:</strong> Logits aren&apos;t probabilities. &quot;e&quot; scored 3.2 and &quot;t&quot; scored 2.8 — but what does that mean in terms of % chance? We need softmax to convert these into proper probabilities.
                            </p>
                        </>
                    )}

                    {/* Step 4: Exponentiate */}
                    {step === 4 && (
                        <>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                    Step 1 of Softmax: exp(logit) → always positive
                                </p>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Compute <strong className="text-amber-400">e<sup>logit</sup></strong> for each score.
                                    This makes everything positive and amplifies differences — a logit of 3.2 becomes{" "}
                                    <strong className="text-amber-400">{Math.exp(3.2).toFixed(1)}</strong>, but 0.3 becomes just{" "}
                                    <strong className="text-amber-400">{Math.exp(0.3).toFixed(1)}</strong>. The winner pulls ahead.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                {TOP_CHARS.map((ch, i) => (
                                    <div key={ch} className="flex items-center gap-2">
                                        <span className="w-5 text-right text-[10px] font-mono font-bold text-amber-400/70 shrink-0">{ch}</span>
                                        <div className="flex-1 h-5 relative rounded bg-white/[0.02]">
                                            <motion.div
                                                className="absolute top-0.5 bottom-0.5 left-0 rounded-sm bg-amber-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(EXP_VALS[i] / maxExp) * 100}%` }}
                                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                                style={{ opacity: 0.5 }}
                                            />
                                            <span className="absolute right-1.5 top-0.5 text-[8px] font-mono text-amber-400/60">
                                                e^{RAW_LOGITS[i].toFixed(1)} = {EXP_VALS[i].toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] font-mono text-amber-400/50 leading-relaxed">
                                <strong>Why exp()?</strong> Probabilities must be positive. exp() guarantees this AND makes the model more &quot;decisive&quot; — a small logit difference becomes a large probability difference.
                            </p>
                        </>
                    )}

                    {/* Step 5: Normalize */}
                    {step === 5 && (
                        <>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                    Step 2 of Softmax: divide by total → proper probabilities
                                </p>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Divide each exp value by the sum of ALL 27 exp values (= <strong className="text-violet-400">{SUM_EXP.toFixed(1)}</strong>).
                                    Now every number is between 0 and 1, and they all add up to exactly <strong className="text-violet-400">1.0</strong> — proper probabilities.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                {TOP_CHARS.map((ch, i) => (
                                    <div key={ch} className="flex items-center gap-2">
                                        <span className="w-5 text-right text-[10px] font-mono font-bold text-violet-400/70 shrink-0">{ch}</span>
                                        <div className="flex-1 h-5 relative rounded bg-white/[0.02]">
                                            <motion.div
                                                className="absolute top-0.5 bottom-0.5 left-0 rounded-sm bg-violet-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(PROBS[i] / maxProb) * 100}%` }}
                                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                                style={{ opacity: 0.5 }}
                                            />
                                            <span className="absolute right-1.5 top-0.5 text-[8px] font-mono text-violet-400/60">
                                                {EXP_VALS[i].toFixed(1)} / {SUM_EXP.toFixed(1)} = {(PROBS[i] * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[8px] font-mono text-white/15 text-center">
                                    remaining 21 chars share {((1 - PROBS.reduce((s, v) => s + v, 0)) * 100).toFixed(1)}%
                                </p>
                            </div>
                        </>
                    )}

                    {/* Step 6: Final prediction */}
                    {step === 6 && (
                        <>
                            <div className="space-y-1.5">
                                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                    Final prediction: highest probability wins
                                </p>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    The model predicts <strong className="text-rose-400">&quot;{TOP_CHARS[0]}&quot;</strong> with{" "}
                                    <strong className="text-rose-400">{(PROBS[0] * 100).toFixed(1)}%</strong> confidence.
                                    During training, the loss function compares this distribution with the correct answer and adjusts all 3,456+ weights in W₂ to get it right next time.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                {TOP_CHARS.map((ch, i) => {
                                    const isTop = i === 0;
                                    return (
                                        <div key={ch} className="flex items-center gap-2">
                                            <span
                                                className="w-5 text-right text-[10px] font-mono font-bold shrink-0"
                                                style={{ color: isTop ? "#f43f5e" : "rgba(255,255,255,0.3)" }}
                                            >
                                                {ch}
                                            </span>
                                            <div className="flex-1 h-5 relative rounded bg-white/[0.02]">
                                                <motion.div
                                                    className="absolute top-0.5 bottom-0.5 left-0 rounded-sm"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(PROBS[i] / maxProb) * 100}%` }}
                                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                                    style={{
                                                        backgroundColor: isTop ? "#f43f5e" : "#94a3b8",
                                                        opacity: isTop ? 0.7 : 0.25,
                                                    }}
                                                />
                                                <span
                                                    className="absolute right-1.5 top-0.5 text-[8px] font-mono font-bold"
                                                    style={{ color: isTop ? "#f43f5e" : "rgba(255,255,255,0.2)" }}
                                                >
                                                    {(PROBS[i] * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            {isTop && (
                                                <span className="text-[9px] font-mono text-rose-400 font-bold shrink-0">
                                                    ← prediction
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Recap callout */}
                            <div className="flex items-start gap-2 rounded-lg border border-rose-500/15 bg-rose-500/[0.03] p-2">
                                <Lightbulb className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-mono text-rose-400/60 leading-relaxed">
                                    <strong>Full journey:</strong> 128 hidden features → each of 27 neurons reads all 128 → produces a logit → exp() makes it positive → divide by sum → probabilities. The network learned which hidden features predict which letters entirely on its own.
                                </p>
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={reset}
                    className="text-white/20 hover:text-white/40 transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <div className="flex gap-1 text-[7px] font-mono text-white/15">
                    <span className="text-emerald-400/40">hidden</span>
                    <span>→</span>
                    <span className="text-sky-400/40">× W₂</span>
                    <span>→</span>
                    <span className="text-blue-400/40">logits</span>
                    <span>→</span>
                    <span className="text-amber-400/40">exp()</span>
                    <span>→</span>
                    <span className="text-violet-400/40">÷ sum</span>
                    <span>→</span>
                    <span className="text-rose-400/40">P(char)</span>
                </div>
                <button
                    onClick={next}
                    disabled={step >= STEPS.length - 1}
                    className="h-7 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center gap-1 text-white/40 hover:text-white/60 text-xs font-mono transition-colors disabled:opacity-20"
                >
                    Next <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
