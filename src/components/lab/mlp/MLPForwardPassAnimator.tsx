"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

/*
  MLPForwardPassAnimator
  Walk through "hel" → predict "l" step by step:
  1. Input characters → token IDs
  2. Token IDs → embedding lookup
  3. Embeddings → concatenation
  4. Concatenated vector → hidden layer (W1x + b1 → tanh)
  5. Hidden → output layer (W2h + b2)
  6. Output → softmax → probabilities
  Client-side only — uses illustrative numbers.
*/

const STEPS = [
    { id: "input", label: "Input", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { id: "tokenize", label: "Tokenize", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { id: "embed", label: "Embed", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { id: "concat", label: "Concatenate", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: "hidden", label: "Hidden Layer", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "output", label: "Output + Softmax", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
] as const;

const INPUT_TEXT = "hel";
const TARGET = "l";
const TOKEN_IDS = [8, 5, 12]; // h=8, e=5, l=12
const EMBEDDINGS = [
    [0.42, -0.15, 0.78, 0.11],
    [-0.33, 0.91, 0.05, -0.62],
    [0.67, 0.23, -0.44, 0.55],
];
const CONCAT = [...EMBEDDINGS[0], ...EMBEDDINGS[1], ...EMBEDDINGS[2]];
const HIDDEN = [0.82, -0.14, 0.67, 0.03, -0.91, 0.45, 0.28, -0.56];
const TOP_PREDS = [
    { char: "l", prob: 0.42 },
    { char: "p", prob: 0.11 },
    { char: "o", prob: 0.09 },
    { char: "i", prob: 0.07 },
    { char: "e", prob: 0.05 },
];

export function MLPForwardPassAnimator() {
    const [step, setStep] = useState(0);

    const advance = useCallback(() => {
        setStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, []);

    const reset = useCallback(() => setStep(0), []);

    const currentStep = STEPS[step];

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {STEPS.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => setStep(i)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all border whitespace-nowrap ${
                            i <= step
                                ? `${s.bg} ${s.border} ${s.color}`
                                : "bg-white/[0.02] border-white/[0.06] text-white/20"
                        }`}
                    >
                        {s.label}
                        {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-white/15 ml-0.5" />}
                    </button>
                ))}
            </div>

            {/* Visualization area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className={`rounded-xl border ${currentStep.border} ${currentStep.bg} p-5 min-h-[140px]`}
                >
                    {step === 0 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">Input: 3 characters as context</p>
                            <div className="flex gap-2 justify-center">
                                {INPUT_TEXT.split("").map((ch, i) => (
                                    <span key={i} className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-lg font-mono font-bold text-amber-400">
                                        {ch}
                                    </span>
                                ))}
                                <span className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/[0.08] border-dashed flex items-center justify-center text-lg font-mono font-bold text-white/20">
                                    ?
                                </span>
                            </div>
                            <p className="text-center text-[10px] text-white/30">Predict: what comes after &quot;{INPUT_TEXT}&quot;?</p>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">Each character → integer token ID (alphabet index)</p>
                            <div className="flex gap-4 justify-center items-center">
                                {INPUT_TEXT.split("").map((ch, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <span className="text-sm font-mono text-white/50">&apos;{ch}&apos;</span>
                                        <span className="text-white/20">↓</span>
                                        <span className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-sm font-mono font-bold text-orange-400">
                                            {TOKEN_IDS[i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">Token ID → row lookup in embedding matrix E (4 dims each)</p>
                            <div className="space-y-2">
                                {INPUT_TEXT.split("").map((ch, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-white/40 w-12">E[{TOKEN_IDS[i]}]</span>
                                        <span className="text-white/20">→</span>
                                        <div className="flex gap-1">
                                            {EMBEDDINGS[i].map((v, j) => (
                                                <span key={j} className="px-2 py-1 rounded text-[10px] font-mono bg-violet-500/15 border border-violet-500/20 text-violet-400">
                                                    {v.toFixed(2)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">Concatenate 3 embeddings into one vector (3 × 4 = 12 dims)</p>
                            <div className="flex gap-0.5 flex-wrap justify-center">
                                {CONCAT.map((v, i) => (
                                    <span
                                        key={i}
                                        className={`px-1.5 py-1 rounded text-[9px] font-mono border ${
                                            i < 4 ? "bg-violet-500/10 border-violet-500/15 text-violet-400/70"
                                            : i < 8 ? "bg-violet-500/15 border-violet-500/20 text-violet-400/80"
                                            : "bg-violet-500/20 border-violet-500/25 text-violet-400"
                                        }`}
                                    >
                                        {v.toFixed(2)}
                                    </span>
                                ))}
                            </div>
                            <p className="text-center text-[10px] text-white/20">x ∈ ℝ¹²</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">h = tanh(W₁x + b₁) — hidden layer activation (8 neurons)</p>
                            <div className="flex gap-1.5 justify-center">
                                {HIDDEN.map((v, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div
                                            className="w-8 h-8 rounded-lg border border-emerald-500/30 flex items-center justify-center text-[9px] font-mono font-bold"
                                            style={{
                                                backgroundColor: `rgba(16, 185, 129, ${Math.abs(v) * 0.3})`,
                                                color: v > 0 ? "rgb(110, 231, 183)" : "rgb(248, 113, 113)",
                                            }}
                                        >
                                            {v.toFixed(1)}
                                        </div>
                                        <span className="text-[8px] text-white/15">h{i}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-[10px] text-white/20">tanh squashes values to [-1, +1]</p>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-3">
                            <p className="text-xs text-white/40">softmax(W₂h + b₂) → probability distribution over 27 characters</p>
                            <div className="space-y-1.5">
                                {TOP_PREDS.map((pred, i) => (
                                    <div key={pred.char} className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold ${
                                            i === 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "text-white/30"
                                        }`}>
                                            {pred.char}
                                        </span>
                                        <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${i === 0 ? "bg-rose-500/60" : "bg-white/10"}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pred.prob * 100 * 2}%` }}
                                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono text-white/30 w-10 text-right">{(pred.prob * 100).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-[10px] text-emerald-400/60 font-mono mt-2">
                                ✓ Top prediction: &apos;{TARGET}&apos; ({(TOP_PREDS[0].prob * 100).toFixed(0)}%)
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                    onClick={advance}
                    disabled={step >= STEPS.length - 1}
                    className="px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-mono font-bold text-violet-400 hover:bg-violet-500/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Next Step →
                </button>
            </div>
        </div>
    );
}
