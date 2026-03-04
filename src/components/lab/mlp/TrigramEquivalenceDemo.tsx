"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  TrigramEquivalenceDemo
  Demonstrates that an MLP WITHOUT a hidden layer is mathematically
  equivalent to the trigram counting table. Shows:
  - Left: Trigram count table (mock data)
  - Right: Flat MLP predictions converging to match
  - Key insight: hidden layer enables GENERALIZATION beyond counting
*/

// Mock trigram data for a few common contexts
const TRIGRAM_DATA: Record<string, Record<string, number>> = {
    "th": { e: 0.62, a: 0.12, i: 0.08, o: 0.06, r: 0.04, " ": 0.03, other: 0.05 },
    "he": { " ": 0.35, r: 0.15, n: 0.10, l: 0.08, a: 0.07, s: 0.06, other: 0.19 },
    "in": { g: 0.28, " ": 0.20, e: 0.12, t: 0.10, d: 0.08, s: 0.06, other: 0.16 },
    "an": { d: 0.32, " ": 0.18, t: 0.12, e: 0.08, y: 0.06, c: 0.05, other: 0.19 },
    "er": { " ": 0.28, e: 0.14, s: 0.12, i: 0.08, a: 0.07, n: 0.06, other: 0.25 },
    "on": { " ": 0.25, e: 0.18, s: 0.10, t: 0.08, l: 0.06, g: 0.05, other: 0.28 },
};

const CONTEXTS = Object.keys(TRIGRAM_DATA);

// Simulate a flat MLP "training" — starts random, converges to trigram distribution
function simulateTraining(target: Record<string, number>, step: number): Record<string, number> {
    const maxStep = 100;
    const t = Math.min(step / maxStep, 1);
    // Ease-in-out interpolation
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const result: Record<string, number> = {};
    const keys = Object.keys(target);
    const uniform = 1 / keys.length;

    for (const k of keys) {
        result[k] = uniform + (target[k] - uniform) * ease;
    }
    return result;
}

export function TrigramEquivalenceDemo() {
    const [selectedContext, setSelectedContext] = useState("th");
    const [trainingStep, setTrainingStep] = useState(0);
    const [isTraining, setIsTraining] = useState(false);

    const trigramDist = TRIGRAM_DATA[selectedContext];
    const mlpDist = useMemo(() => simulateTraining(trigramDist, trainingStep), [trigramDist, trainingStep]);

    // Compute max absolute error
    const maxError = useMemo(() => {
        let max = 0;
        for (const k of Object.keys(trigramDist)) {
            max = Math.max(max, Math.abs(trigramDist[k] - mlpDist[k]));
        }
        return max;
    }, [trigramDist, mlpDist]);

    const startTraining = () => {
        setTrainingStep(0);
        setIsTraining(true);
        let step = 0;
        const interval = setInterval(() => {
            step += 2;
            setTrainingStep(step);
            if (step >= 100) {
                clearInterval(interval);
                setIsTraining(false);
            }
        }, 50);
    };

    const isConverged = trainingStep >= 100;

    return (
        <div className="p-4 sm:p-5 space-y-5">
            {/* Context selector */}
            <div className="flex items-center gap-3 justify-center flex-wrap">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Context:</span>
                {CONTEXTS.map(ctx => (
                    <button
                        key={ctx}
                        onClick={() => { setSelectedContext(ctx); setTrainingStep(0); setIsTraining(false); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold border transition-all ${
                            selectedContext === ctx
                                ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                                : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white/60"
                        }`}
                    >
                        &quot;{ctx}&quot;
                    </button>
                ))}
            </div>

            {/* Side by side */}
            <div className="grid grid-cols-2 gap-3">
                {/* Trigram table */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-mono font-bold text-amber-400/80 uppercase tracking-widest">
                            Trigram Table
                        </span>
                    </div>
                    <p className="text-[9px] text-white/25 font-mono">P(next | &quot;{selectedContext}&quot;) from counting</p>
                    <div className="space-y-1.5">
                        {Object.entries(trigramDist).map(([char, prob]) => (
                            <DistBar key={char} char={char} prob={prob} color="amber" />
                        ))}
                    </div>
                </div>

                {/* Flat MLP */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-[10px] font-mono font-bold text-violet-400/80 uppercase tracking-widest">
                            Flat MLP (no hidden layer)
                        </span>
                    </div>
                    <p className="text-[9px] text-white/25 font-mono">
                        Step {trainingStep}/100 · Error: {(maxError * 100).toFixed(1)}%
                    </p>
                    <div className="space-y-1.5">
                        {Object.entries(mlpDist).map(([char, prob]) => (
                            <DistBar key={char} char={char} prob={prob} color="violet" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Train button */}
            <div className="flex justify-center">
                <button
                    onClick={startTraining}
                    disabled={isTraining}
                    className={`px-5 py-2 rounded-lg font-mono text-sm font-bold border transition-all ${
                        isTraining
                            ? "border-white/10 bg-white/[0.03] text-white/20 cursor-not-allowed"
                            : "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
                    }`}
                >
                    {isTraining ? "Training…" : trainingStep > 0 ? "Train again" : "▶ Train the flat MLP"}
                </button>
            </div>

            {/* Insight callout */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isConverged ? 1 : 0.3 }}
                className={`text-center rounded-lg border p-4 transition-colors ${
                    isConverged
                        ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                        : "border-white/[0.06] bg-white/[0.02]"
                }`}
            >
                {isConverged ? (
                    <div className="space-y-2">
                        <p className="text-sm font-mono text-emerald-300/80 font-bold">
                            ✓ Perfect match!
                        </p>
                        <p className="text-[11px] font-mono text-white/40 leading-relaxed max-w-md mx-auto">
                            Without a hidden layer, the MLP just learns the same counts as the trigram table.
                            It&apos;s a fancier way to count. The <span className="text-violet-300 font-bold">hidden layer</span> is
                            what lets the MLP <span className="text-emerald-300 font-bold">generalize</span> —
                            making predictions for contexts it&apos;s never seen, by learning shared patterns between characters.
                        </p>
                    </div>
                ) : (
                    <p className="text-[11px] font-mono text-white/25">
                        {trainingStep === 0
                            ? "Click \"Train\" to watch the flat MLP converge to the trigram distribution"
                            : "Training in progress…"
                        }
                    </p>
                )}
            </motion.div>
        </div>
    );
}

function DistBar({ char, prob, color }: { char: string; prob: number; color: "amber" | "violet" }) {
    const bgColor = color === "amber" ? "bg-amber-500/40" : "bg-violet-500/40";
    const textColor = color === "amber" ? "text-amber-300" : "text-violet-300";

    return (
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-bold ${textColor} w-8 text-right`}>
                {char === " " ? "⎵" : char}
            </span>
            <div className="flex-1 h-3 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${bgColor}`}
                    animate={{ width: `${prob * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
            <span className="text-[9px] font-mono text-white/25 w-10 text-right">
                {(prob * 100).toFixed(1)}%
            </span>
        </div>
    );
}
