"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

/*
  Visual bridge: shows how a bigram (two letters) becomes numbers
  that flow through a weighted sum to produce a prediction.

  Step 1: Pick two letters (e.g., "t" and "h")
  Step 2: See them converted to numbers (their ASCII-based indices)
  Step 3: Watch the numbers flow through weights → sum → output
  Step 4: The output is a score for what comes next

  This connects the N-gram chapter ("counting pairs") with the neural
  network chapter ("computing with numbers").
*/

const ALPHABET = "abcdefghijklmnopqrstuvwxyz ".split("");

const COMMON_PAIRS: [string, string, string][] = [
    ["t", "h", "e"],
    ["h", "e", " "],
    ["i", "n", " "],
    ["a", "n", "d"],
    ["t", "o", " "],
];

function charToIndex(c: string): number {
    if (c === " ") return 26;
    return c.charCodeAt(0) - 97;
}

export function LetterToNumberDemo() {
    const { t } = useI18n();
    const [pair, setPair] = useState(0);
    const [showFlow, setShowFlow] = useState(false);

    const [c1, c2, expected] = COMMON_PAIRS[pair];
    const n1 = charToIndex(c1);
    const n2 = charToIndex(c2);

    // Simple weights for illustration (not real — just to show the concept)
    const w1 = 0.3;
    const w2 = 0.5;
    const bias = 1.2;
    const rawOutput = w1 * n1 + w2 * n2 + bias;

    return (
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.02] to-transparent p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-white/30 mb-5">
                {t("neuralNetworkNarrative.discovery.letterDemo.title")}
            </p>

            {/* Pair selector */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {COMMON_PAIRS.map(([a, b, c], i) => (
                    <button
                        key={i}
                        onClick={() => { setPair(i); setShowFlow(false); }}
                        className={`px-4 py-2 rounded-full text-xs font-mono font-semibold transition-all border ${pair === i
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                            : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.12]"
                            }`}
                    >
                        &quot;{a}{b}&quot; → ?
                    </button>
                ))}
            </div>

            {/* Step 1: Letters */}
            <div className="mb-5">
                <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-3">
                    {t("neuralNetworkNarrative.discovery.letterDemo.step1")}
                </p>
                <div className="flex items-center justify-center gap-4">
                    <motion.div
                        key={`${c1}-${c2}`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-16 h-16 rounded-xl bg-sky-500/10 border-2 border-sky-500/30 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-sky-400 font-mono">{c1}</span>
                        </div>
                        <div className="w-16 h-16 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-amber-400 font-mono">{c2}</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Step 2: Conversion arrow + numbers */}
            <div className="flex items-center justify-center gap-2 mb-5">
                <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-white/15 text-xl"
                >
                    ↓
                </motion.div>
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                    {t("neuralNetworkNarrative.discovery.letterDemo.step2")}
                </span>
                <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-white/15 text-xl"
                >
                    ↓
                </motion.div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-5">
                <motion.div
                    key={`n-${n1}-${n2}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2"
                >
                    <div className="w-16 h-16 rounded-xl bg-sky-500/10 border border-sky-500/25 flex flex-col items-center justify-center">
                        <span className="text-[9px] text-sky-400/60 font-mono">&quot;{c1}&quot;</span>
                        <span className="text-2xl font-bold text-sky-400 font-mono">{n1}</span>
                    </div>
                    <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col items-center justify-center">
                        <span className="text-[9px] text-amber-400/60 font-mono">&quot;{c2}&quot;</span>
                        <span className="text-2xl font-bold text-amber-400 font-mono">{n2}</span>
                    </div>
                </motion.div>
            </div>

            {/* Button to show computation */}
            {!showFlow && (
                <div className="text-center mb-5">
                    <button
                        onClick={() => setShowFlow(true)}
                        className="px-5 py-2.5 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 transition-all"
                    >
                        {t("neuralNetworkNarrative.discovery.letterDemo.showComputation")}
                    </button>
                </div>
            )}

            {/* Step 3: The computation flow */}
            <AnimatePresence>
                {showFlow && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-xl bg-black/30 border border-white/[0.05] p-5 mb-4">
                            <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-4">
                                {t("neuralNetworkNarrative.discovery.letterDemo.step3")}
                            </p>
                            <div className="flex items-center justify-center gap-2 flex-wrap font-mono text-sm">
                                <div className="flex items-center gap-1">
                                    <span className="text-rose-400/70 text-xs">w₁</span>
                                    <span className="text-rose-400 font-bold">{w1}</span>
                                    <span className="text-white/20">×</span>
                                    <span className="text-sky-400">{n1}</span>
                                </div>
                                <span className="text-white/20">+</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-rose-400/70 text-xs">w₂</span>
                                    <span className="text-rose-400 font-bold">{w2}</span>
                                    <span className="text-white/20">×</span>
                                    <span className="text-amber-400">{n2}</span>
                                </div>
                                <span className="text-white/20">+</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-violet-400/70 text-xs">b</span>
                                    <span className="text-violet-400">{bias}</span>
                                </div>
                                <span className="text-white/20">=</span>
                                <motion.span
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="text-xl font-bold text-white/80"
                                >
                                    {rawOutput.toFixed(1)}
                                </motion.span>
                            </div>
                            <p className="text-center text-xs text-white/25 mt-3 font-mono">
                                {w1} × {n1} + {w2} × {n2} + {bias} = {(w1 * n1).toFixed(1)} + {(w2 * n2).toFixed(1)} + {bias} = {rawOutput.toFixed(1)}
                            </p>
                        </div>

                        {/* Step 4: This score represents a prediction */}
                        <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 p-5 text-center">
                            <p className="text-xs text-emerald-400/80 font-semibold mb-2">
                                {t("neuralNetworkNarrative.discovery.letterDemo.step4")}
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-sm text-white/40 font-mono">
                                    &quot;{c1}{c2}&quot; →
                                </span>
                                <span className="text-sm text-white/40">
                                    {t("neuralNetworkNarrative.discovery.letterDemo.scoreFor")}
                                </span>
                                <span className="text-lg font-bold text-emerald-400 font-mono">
                                    &quot;{expected}&quot;
                                </span>
                            </div>
                            <p className="text-[11px] text-white/30 mt-3">
                                {t("neuralNetworkNarrative.discovery.letterDemo.insight")}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
