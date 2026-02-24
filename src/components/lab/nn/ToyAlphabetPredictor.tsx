"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  5-vowel network: input = one vowel (a/e/i/o/u), predict next vowel.
  Tiny network: 5 inputs (one-hot) → 5 outputs (softmax).
  LIVE TRAINING in browser: "Train" button runs gradient descent steps in JS.
  Training data: repeating "aeiou" sequence.
*/

const VOWELS = ["a", "e", "i", "o", "u"];
const VOWEL_COLORS = [
    NN_COLORS.input.hex,
    NN_COLORS.weight.hex,
    NN_COLORS.bias.hex,
    NN_COLORS.target.hex,
    NN_COLORS.output.hex,
];

// Training data: "aeiou" repeating → pairs (a→e, e→i, i→o, o→u, u→a)
const TRAINING_PAIRS: [number, number][] = [
    [0, 1], // a → e
    [1, 2], // e → i
    [2, 3], // i → o
    [3, 4], // o → u
    [4, 0], // u → a
];

function softmax(logits: number[]): number[] {
    const max = Math.max(...logits);
    const exps = logits.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

function crossEntropyLoss(weights: number[][]): number {
    let totalLoss = 0;
    for (const [input, target] of TRAINING_PAIRS) {
        const logits = weights[input];
        const probs = softmax(logits);
        totalLoss -= Math.log(Math.max(probs[target], 1e-10));
    }
    return totalLoss / TRAINING_PAIRS.length;
}

function trainStep(weights: number[][], lr: number): number[][] {
    const newW = weights.map(row => [...row]);
    for (const [input, target] of TRAINING_PAIRS) {
        const probs = softmax(newW[input]);
        for (let j = 0; j < 5; j++) {
            const grad = probs[j] - (j === target ? 1 : 0);
            newW[input][j] -= lr * grad;
        }
    }
    return newW;
}

function initWeights(): number[][] {
    // Small random init
    const rng = (seed: number) => {
        let s = seed;
        return () => { s = (s * 16807) % 2147483647; return (s / 2147483647 - 0.5) * 0.4; };
    };
    const r = rng(123);
    return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => r()));
}

const MAX_LOSS_HISTORY = 60;

export function ToyAlphabetPredictor() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [weights, setWeights] = useState(initWeights);
    const [step, setStep] = useState(0);
    const [lossHistory, setLossHistory] = useState<number[]>([]);
    const [selectedInput, setSelectedInput] = useState(0);
    const [autoTraining, setAutoTraining] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loss = useMemo(() => crossEntropyLoss(weights), [weights]);
    const probs = useMemo(() => softmax(weights[selectedInput]), [weights, selectedInput]);
    const predictedIdx = probs.indexOf(Math.max(...probs));

    const doStep = useCallback((count: number = 1) => {
        setWeights(prev => {
            let w = prev;
            for (let i = 0; i < count; i++) w = trainStep(w, 0.3);
            return w;
        });
        setStep(s => s + count);
        setLossHistory(prev => {
            const next = [...prev, crossEntropyLoss(weights)];
            return next.length > MAX_LOSS_HISTORY ? next.slice(-MAX_LOSS_HISTORY) : next;
        });
    }, [weights]);

    const handleAutoTrain = useCallback(() => {
        if (autoTraining) {
            if (timerRef.current) clearInterval(timerRef.current);
            setAutoTraining(false);
        } else {
            setAutoTraining(true);
            timerRef.current = setInterval(() => {
                doStep(5);
            }, shouldReduceMotion ? 50 : 120);
        }
    }, [autoTraining, doStep, shouldReduceMotion]);

    // Stop auto-train if loss is very low
    if (autoTraining && loss < 0.05) {
        if (timerRef.current) clearInterval(timerRef.current);
        setAutoTraining(false);
    }

    const handleReset = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setAutoTraining(false);
        setWeights(initWeights());
        setStep(0);
        setLossHistory([]);
    }, []);

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 24 };

    // Loss chart
    const maxLoss = Math.max(...lossHistory, 1.8);
    const chartW = 240;
    const chartH = 50;
    const lossPath = lossHistory.length > 1
        ? lossHistory.map((l, i) => {
            const x = (i / (lossHistory.length - 1)) * chartW;
            const y = chartH - (l / maxLoss) * chartH;
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ")
        : "";

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Input selector */}
            <div>
                <p className="text-[8px] font-mono text-white/20 mb-2">{t("neuralNetworkNarrative.toyPredictor.inputLabel")}</p>
                <div className="flex gap-2">
                    {VOWELS.map((v, i) => (
                        <button
                            key={v}
                            onClick={() => setSelectedInput(i)}
                            className="w-10 h-10 rounded-lg text-sm font-mono font-bold border transition-all"
                            style={{
                                background: selectedInput === i ? VOWEL_COLORS[i] + "20" : "rgba(255,255,255,0.02)",
                                borderColor: selectedInput === i ? VOWEL_COLORS[i] + "50" : "rgba(255,255,255,0.06)",
                                color: selectedInput === i ? VOWEL_COLORS[i] : "rgba(255,255,255,0.3)",
                            }}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prediction bars */}
            <div className="rounded-xl bg-black/25 border border-white/[0.05] p-3">
                <p className="text-[8px] font-mono text-white/20 mb-2">
                    {t("neuralNetworkNarrative.toyPredictor.predictionLabel").replace("{v}", VOWELS[selectedInput])}
                </p>
                <div className="space-y-1.5">
                    {VOWELS.map((v, j) => {
                        const p = probs[j];
                        const isTarget = TRAINING_PAIRS[selectedInput][1] === j;
                        const isPredicted = j === predictedIdx;
                        return (
                            <div key={v} className="flex items-center gap-2">
                                <span className="w-4 text-[10px] font-mono font-bold text-center"
                                    style={{ color: VOWEL_COLORS[j] }}>{v}</span>
                                <div className="flex-1 h-4 rounded-full bg-white/[0.03] overflow-hidden relative">
                                    <motion.div
                                        className="absolute inset-y-0 left-0 rounded-full"
                                        style={{ background: VOWEL_COLORS[j] + (isPredicted ? "90" : "40") }}
                                        animate={{ width: `${Math.max(1, p * 100)}%` }}
                                        transition={spring}
                                    />
                                </div>
                                <span className="text-[9px] font-mono w-10 text-right"
                                    style={{ color: isPredicted ? VOWEL_COLORS[j] : "rgba(255,255,255,0.25)" }}>
                                    {(p * 100).toFixed(0)}%
                                </span>
                                {isTarget && (
                                    <span className="text-[7px] font-mono px-1 rounded bg-emerald-500/15 text-emerald-400/70">
                                        {t("neuralNetworkNarrative.toyPredictor.targetTag")}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Weight matrix (tiny) */}
            <div className="rounded-xl bg-black/15 border border-white/[0.04] p-3">
                <p className="text-[7px] font-mono text-white/15 mb-1.5">{t("neuralNetworkNarrative.toyPredictor.weightsLabel")}</p>
                <div className="overflow-x-auto">
                    <table className="mx-auto border-collapse">
                        <thead>
                            <tr>
                                <th className="p-0.5 text-[7px] font-mono text-white/15 w-5"></th>
                                {VOWELS.map((v, j) => (
                                    <th key={v} className="p-0.5 text-[7px] font-mono text-center" style={{ color: VOWEL_COLORS[j] + "80" }}>{v}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {VOWELS.map((v, i) => (
                                <tr key={v}>
                                    <td className="p-0.5 text-[7px] font-mono" style={{ color: VOWEL_COLORS[i] + "80" }}>{v}→</td>
                                    {weights[i].map((w, j) => {
                                        const intensity = Math.min(1, Math.abs(w) / 3);
                                        return (
                                            <td key={j} className="p-0.5">
                                                <div
                                                    className="w-7 h-5 rounded text-[6px] font-mono flex items-center justify-center transition-all"
                                                    style={{
                                                        background: w > 0
                                                            ? `rgba(52,211,153,${intensity * 0.3})`
                                                            : `rgba(244,63,94,${intensity * 0.3})`,
                                                        color: `rgba(255,255,255,${0.2 + intensity * 0.5})`,
                                                    }}
                                                >
                                                    {w.toFixed(1)}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Loss + chart */}
            <div className="flex items-end gap-4">
                <div>
                    <p className="text-[8px] font-mono text-white/20">{t("neuralNetworkNarrative.toyPredictor.lossLabel")}</p>
                    <motion.p
                        key={step}
                        animate={{ scale: [1.05, 1] }}
                        transition={spring}
                        className="text-lg font-mono font-bold"
                        style={{ color: loss < 0.2 ? NN_COLORS.output.hex : loss < 1 ? NN_COLORS.target.hex : NN_COLORS.error.hex }}
                    >
                        {loss.toFixed(3)}
                    </motion.p>
                    <p className="text-[8px] font-mono text-white/15">{t("neuralNetworkNarrative.toyPredictor.stepCount").replace("{n}", String(step))}</p>
                </div>
                {lossHistory.length > 1 && (
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="flex-1 h-12" aria-hidden>
                        <path d={lossPath} fill="none" stroke={NN_COLORS.error.hex} strokeWidth="1.5" opacity="0.6" />
                    </svg>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => doStep(1)}
                    disabled={autoTraining}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold font-mono border transition-all disabled:opacity-30"
                    style={{ background: NN_COLORS.output.hex + "12", borderColor: NN_COLORS.output.hex + "40", color: NN_COLORS.output.hex }}
                >
                    {t("neuralNetworkNarrative.toyPredictor.trainOne")}
                </button>
                <button
                    onClick={handleAutoTrain}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold font-mono border transition-all"
                    style={{ background: NN_COLORS.hidden.hex + "12", borderColor: NN_COLORS.hidden.hex + "40", color: NN_COLORS.hidden.hex }}
                >
                    {autoTraining ? t("neuralNetworkNarrative.toyPredictor.stop") : t("neuralNetworkNarrative.toyPredictor.autoTrain")}
                </button>
                <button
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold font-mono bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
                >
                    {t("neuralNetworkNarrative.toyPredictor.reset")}
                </button>
            </div>

            {loss < 0.2 && (
                <p className="text-[10px] text-center font-semibold" style={{ color: NN_COLORS.output.hex }}>
                    {t("neuralNetworkNarrative.toyPredictor.converged")}
                </p>
            )}
        </div>
    );
}
