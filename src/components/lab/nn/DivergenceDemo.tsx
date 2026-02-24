"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Shows what happens when you use the full gradient (lr=1) vs a small
  learning rate (lr=0.01). With lr=1 the loss explodes after 1-2 steps;
  with lr=0.01 it smoothly converges. Same setup as RepeatedTrainingDemo.
*/

const X1 = 1, X2 = 2, TARGET = 3;

interface Snapshot {
    step: number;
    w1: number;
    w2: number;
    output: number;
    loss: number;
}

function simulate(lr: number, steps: number): Snapshot[] {
    const path: Snapshot[] = [];
    let w1 = 2.5, w2 = 1.8; // smaller init → takes ~4 steps to explode with lr=1
    for (let i = 0; i <= steps; i++) {
        const output = w1 * X1 + w2 * X2;
        const error = output - TARGET;
        const loss = error * error;
        path.push({ step: i, w1, w2, output: +output.toFixed(2), loss: +Math.min(loss, 1e6).toFixed(1) });
        if (i < steps) {
            const dLdw1 = 2 * error * X1;
            const dLdw2 = 2 * error * X2;
            w1 = w1 - lr * dLdw1;
            w2 = w2 - lr * dLdw2;
        }
    }
    return path;
}

type Mode = "full" | "small";

const SVG_W = 340;
const SVG_H = 210;
const PAD_L = 40;
const PAD_R = 10;
const PAD_T = 24;
const PAD_B = 28;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

export function DivergenceDemo() {
    const { t } = useI18n();
    const [mode, setMode] = useState<Mode>("full");
    const [animStep, setAnimStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const lr = mode === "full" ? 1 : 0.01;
    const totalSteps = mode === "full" ? 8 : 40;
    const history = useMemo(() => simulate(lr, totalSteps), [lr, totalSteps]);

    const visibleHistory = history.slice(0, animStep + 1);
    const current = visibleHistory[visibleHistory.length - 1];

    // Determine y-axis max for chart
    const maxLoss = useMemo(() => {
        const allLosses = visibleHistory.map(s => s.loss);
        return Math.max(50, ...allLosses);
    }, [visibleHistory]);

    const doStep = useCallback(() => {
        setAnimStep(prev => Math.min(prev + 1, totalSteps));
    }, [totalSteps]);

    const doAutoRun = useCallback(() => {
        setIsPlaying(true);
        let count = animStep;
        const interval = setInterval(() => {
            count++;
            setAnimStep(count);
            if (count >= totalSteps) {
                clearInterval(interval);
                setIsPlaying(false);
            }
        }, mode === "full" ? 400 : 80);
        return () => clearInterval(interval);
    }, [animStep, totalSteps, mode]);

    const reset = useCallback(() => {
        setAnimStep(0);
        setIsPlaying(false);
    }, []);

    const handleModeChange = useCallback((m: Mode) => {
        setMode(m);
        setAnimStep(0);
        setIsPlaying(false);
    }, []);

    // Chart helpers
    function stepToX(step: number) {
        return PAD_L + (step / totalSteps) * PLOT_W;
    }
    function lossToY(loss: number) {
        const clamped = Math.min(loss, maxLoss);
        return PAD_T + (1 - clamped / maxLoss) * PLOT_H;
    }

    const diverged = current.loss > 1000;

    return (
        <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => handleModeChange("full")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${mode === "full"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                >
                    {t("neuralNetworkNarrative.divergence.fullBtn")}
                </button>
                <button
                    onClick={() => handleModeChange("small")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${mode === "small"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                >
                    {t("neuralNetworkNarrative.divergence.smallBtn")}
                </button>
            </div>

            {/* Loss chart */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-3 overflow-hidden">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full block">
                    {/* Axes */}
                    <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={SVG_H - PAD_B} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1={PAD_L} y1={SVG_H - PAD_B} x2={SVG_W - PAD_R} y2={SVG_H - PAD_B} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <text x={SVG_W / 2} y={SVG_H - 4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="monospace">step</text>
                    <text x={12} y={SVG_H / 2} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="monospace" transform={`rotate(-90 12 ${SVG_H / 2})`}>loss</text>

                    {/* Reference: loss = 0 line */}
                    <line x1={PAD_L} y1={lossToY(0)} x2={SVG_W - PAD_R} y2={lossToY(0)} stroke="rgba(52,211,153,0.15)" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Loss curve */}
                    {visibleHistory.length > 1 && (
                        <polyline
                            fill="none"
                            stroke={diverged ? NN_COLORS.error.hex : NN_COLORS.output.hex}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={visibleHistory.map(s => `${stepToX(s.step)},${lossToY(s.loss)}`).join(" ")}
                        />
                    )}

                    {/* Step points with loss labels */}
                    {visibleHistory.map((s, i) => {
                        const isLast = i === visibleHistory.length - 1;
                        const color = s.loss > 1000 ? NN_COLORS.error.hex : NN_COLORS.output.hex;
                        const showLabel = mode === "full" || isLast;
                        return (
                            <g key={s.step}>
                                <circle
                                    cx={stepToX(s.step)}
                                    cy={lossToY(s.loss)}
                                    r={isLast ? 4.5 : 3}
                                    fill={color}
                                    stroke={isLast ? "white" : "none"}
                                    strokeWidth={isLast ? 1.5 : 0}
                                    opacity={isLast ? 1 : 0.6}
                                />
                                {showLabel && (
                                    <text
                                        x={Math.min(stepToX(s.step), SVG_W - PAD_R - 20)}
                                        y={Math.max(PAD_T + 4, lossToY(s.loss) - 10)}
                                        textAnchor="middle"
                                        fill={color}
                                        fontSize={isLast ? "9" : "7"}
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                        opacity={isLast ? 1 : 0.5}
                                    >
                                        {s.loss > 9999 ? "∞" : s.loss > 99 ? Math.round(s.loss).toString() : s.loss.toFixed(1)}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Status + controls */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Status card */}
                <div className={`flex-1 rounded-lg border p-3 text-center ${diverged
                    ? "border-rose-500/30 bg-rose-500/[0.06]"
                    : current.loss < 1
                        ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                        : "border-white/[0.08] bg-white/[0.02]"
                    }`}>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/30 block mb-1">
                        η = {lr}
                    </span>
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={`${mode}-${diverged}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className={`text-sm font-mono font-bold block ${diverged ? "text-rose-400" : current.loss < 1 ? "text-emerald-400" : "text-white/60"}`}
                        >
                            {diverged
                                ? t("neuralNetworkNarrative.divergence.exploded")
                                : current.loss < 1
                                    ? t("neuralNetworkNarrative.divergence.converged")
                                    : `Loss: ${current.loss.toFixed(1)}`
                            }
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 items-center">
                    <button
                        onClick={doStep}
                        disabled={isPlaying || animStep >= totalSteps}
                        className="px-3 py-2 rounded-lg text-[11px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Step →
                    </button>
                    <button
                        onClick={doAutoRun}
                        disabled={isPlaying || animStep >= totalSteps}
                        className="px-3 py-2 rounded-lg text-[11px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        {isPlaying ? "Running..." : "▶ Run all"}
                    </button>
                    <button
                        onClick={reset}
                        className="px-3 py-2 rounded-lg text-[11px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
                    >
                        ↺
                    </button>
                </div>
            </div>

            {/* Insight text */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={mode}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[11px] text-white/35 italic leading-relaxed"
                >
                    {mode === "full"
                        ? t("neuralNetworkNarrative.divergence.insightFull")
                        : t("neuralNetworkNarrative.divergence.insightSmall")
                    }
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
