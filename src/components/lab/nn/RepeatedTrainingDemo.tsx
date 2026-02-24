"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";

/*
  Shows many training steps on the running example.
  Starts with w₁=4, w₂=3. Target = 3. x₁=1, x₂=2.
  Each step: compute output → loss → gradients → update weights.
  User clicks "Train one step" or "Auto-train" and watches loss decrease.
*/

const X1 = 1, X2 = 2, TARGET = 3;
const LR = 0.02;

interface Snapshot {
    step: number;
    w1: number;
    w2: number;
    output: number;
    loss: number;
}

function trainStep(w1: number, w2: number): { w1: number; w2: number; output: number; loss: number } {
    const output = w1 * X1 + w2 * X2;
    const error = output - TARGET;
    const loss = error * error;
    const dLdw1 = 2 * error * X1;
    const dLdw2 = 2 * error * X2;
    return {
        w1: w1 - LR * dLdw1,
        w2: w2 - LR * dLdw2,
        output: (w1 - LR * dLdw1) * X1 + (w2 - LR * dLdw2) * X2,
        loss,
    };
}

export function RepeatedTrainingDemo() {
    const { t } = useI18n();
    const [history, setHistory] = useState<Snapshot[]>([
        { step: 0, w1: 4, w2: 3, output: 10, loss: 49 },
    ]);
    const [autoRunning, setAutoRunning] = useState(false);

    const latest = history[history.length - 1];
    const maxLoss = Math.max(...history.map(s => s.loss), 1);

    const doStep = useCallback(() => {
        setHistory(prev => {
            const last = prev[prev.length - 1];
            const next = trainStep(last.w1, last.w2);
            return [...prev, {
                step: last.step + 1,
                w1: next.w1,
                w2: next.w2,
                output: next.output,
                loss: next.loss,
            }];
        });
    }, []);

    const doAutoTrain = useCallback(() => {
        setAutoRunning(true);
        let count = 0;
        const interval = setInterval(() => {
            doStep();
            count++;
            if (count >= 30) {
                clearInterval(interval);
                setAutoRunning(false);
            }
        }, 120);
    }, [doStep]);

    const reset = useCallback(() => {
        setHistory([{ step: 0, w1: 4, w2: 3, output: 10, loss: 49 }]);
        setAutoRunning(false);
    }, []);

    // Loss bar chart (last 20 steps)
    const displayHistory = history.slice(-25);

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-indigo-950/20 via-black/40 to-rose-950/10 p-6 shadow-[0_0_80px_-20px_rgba(139,92,246,0.15)]">
            <p className="text-xs font-mono uppercase tracking-widest text-indigo-300/40 mb-6">
                {t("neuralNetworkNarrative.howItLearns.repeated.title")}
            </p>

            {/* Metrics grid with gradient cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {/* Step */}
                <motion.div
                    key={`step-${latest.step}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] p-3 backdrop-blur-sm"
                >
                    <span className="text-[9px] text-white/40 block font-mono uppercase tracking-wider mb-1">Step</span>
                    <motion.span
                        key={latest.step}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-mono font-bold text-white/70 block"
                    >
                        {latest.step}
                    </motion.span>
                </motion.div>

                {/* Output */}
                <motion.div
                    key={`output-${latest.step}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className={`rounded-xl bg-gradient-to-br p-3 backdrop-blur-sm border transition-all duration-300 ${Math.abs(latest.output - TARGET) < 0.5
                            ? "from-emerald-500/[0.15] to-emerald-500/[0.05] border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(52,211,153,0.3)]"
                            : "from-sky-500/[0.08] to-sky-500/[0.02] border-sky-500/15"
                        }`}
                >
                    <span className="text-[9px] text-white/40 block font-mono uppercase tracking-wider mb-1">Output</span>
                    <motion.span
                        key={`${latest.step}-${latest.output}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-2xl font-mono font-bold block ${Math.abs(latest.output - TARGET) < 0.5 ? "text-emerald-400" : "text-sky-300"
                            }`}
                    >
                        {latest.output.toFixed(1)}
                    </motion.span>
                </motion.div>

                {/* Target */}
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/[0.12] to-emerald-500/[0.04] border border-emerald-500/25 p-3 backdrop-blur-sm shadow-[0_0_20px_-8px_rgba(52,211,153,0.2)]">
                    <span className="text-[9px] text-emerald-300/50 block font-mono uppercase tracking-wider mb-1">Target</span>
                    <span className="text-2xl font-mono font-bold text-emerald-400 block">{TARGET}</span>
                </div>

                {/* Loss */}
                <motion.div
                    key={`loss-${latest.step}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className={`rounded-xl bg-gradient-to-br p-3 backdrop-blur-sm border transition-all duration-300 ${latest.loss < 1
                            ? "from-emerald-500/[0.15] to-emerald-500/[0.05] border-emerald-500/30 shadow-[0_0_24px_-6px_rgba(52,211,153,0.35)]"
                            : latest.loss < 10
                                ? "from-amber-500/[0.12] to-amber-500/[0.04] border-amber-500/25 shadow-[0_0_20px_-8px_rgba(251,191,36,0.25)]"
                                : "from-rose-500/[0.12] to-rose-500/[0.04] border-rose-500/25 shadow-[0_0_20px_-8px_rgba(244,63,94,0.25)]"
                        }`}
                >
                    <span className="text-[9px] text-white/40 block font-mono uppercase tracking-wider mb-1">Loss</span>
                    <motion.span
                        key={`${latest.step}-${latest.loss}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-2xl font-mono font-bold block ${latest.loss < 1 ? "text-emerald-400" : latest.loss < 10 ? "text-amber-400" : "text-rose-400"
                            }`}
                    >
                        {latest.loss.toFixed(1)}
                    </motion.span>
                </motion.div>
            </div>

            {/* Weights display */}
            <div className="flex items-center justify-center gap-5 mb-6 text-sm font-mono">
                <motion.span
                    key={`w1-${latest.step}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-white/35"
                >
                    w₁ = <span className="text-rose-400 font-bold">{latest.w1.toFixed(2)}</span>
                </motion.span>
                <span className="text-white/15">•</span>
                <motion.span
                    key={`w2-${latest.step}`}
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-white/35"
                >
                    w₂ = <span className="text-rose-400 font-bold">{latest.w2.toFixed(2)}</span>
                </motion.span>
            </div>

            {/* Loss curve chart */}
            <div className="rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-white/[0.08] p-4 mb-6 overflow-hidden">
                <p className="text-[9px] font-mono text-white/30 mb-3 uppercase tracking-widest">Loss over time</p>
                <svg viewBox="0 0 400 80" className="w-full h-20" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="lossGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(244,63,94,0.4)" />
                            <stop offset="50%" stopColor="rgba(251,191,36,0.3)" />
                            <stop offset="100%" stopColor="rgba(52,211,153,0.2)" />
                        </linearGradient>
                        <linearGradient id="lossFillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(244,63,94,0.15)" />
                            <stop offset="50%" stopColor="rgba(251,191,36,0.1)" />
                            <stop offset="100%" stopColor="rgba(52,211,153,0.05)" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 20, 40, 60, 80].map(y => (
                        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    ))}

                    {/* Loss curve path */}
                    {displayHistory.length > 1 && (
                        <>
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                d={`M ${displayHistory.map((s, i) => {
                                    const x = (i / Math.max(displayHistory.length - 1, 1)) * 400;
                                    const y = 80 - Math.min((s.loss / maxLoss) * 70, 70);
                                    return `${i === 0 ? "" : "L"}${x},${y}`;
                                }).join(" ")}`}
                                fill="none"
                                stroke="url(#lossGradient)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                d={`M ${displayHistory.map((s, i) => {
                                    const x = (i / Math.max(displayHistory.length - 1, 1)) * 400;
                                    const y = 80 - Math.min((s.loss / maxLoss) * 70, 70);
                                    return `${i === 0 ? "" : "L"}${x},${y}`;
                                }).join(" ")} L 400,80 L 0,80 Z`}
                                fill="url(#lossFillGradient)"
                            />
                        </>
                    )}

                    {/* Current position indicator */}
                    {displayHistory.length > 0 && (
                        <motion.circle
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            cx={(displayHistory.length - 1) / Math.max(displayHistory.length - 1, 1) * 400}
                            cy={80 - Math.min((latest.loss / maxLoss) * 70, 70)}
                            r="4"
                            fill={latest.loss < 1 ? "rgba(52,211,153,0.9)" : latest.loss < 10 ? "rgba(251,191,36,0.9)" : "rgba(244,63,94,0.9)"}
                            className="drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                        />
                    )}
                </svg>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
                <button
                    onClick={doStep}
                    disabled={autoRunning}
                    className="group px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-emerald-500/15 hover:border-emerald-500/40 hover:shadow-[0_0_20px_-5px_rgba(52,211,153,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-mono"
                >
                    {t("neuralNetworkNarrative.howItLearns.repeated.oneStep")}
                </button>
                <button
                    onClick={doAutoTrain}
                    disabled={autoRunning}
                    className="group px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:from-indigo-500/30 hover:to-indigo-500/15 hover:border-indigo-500/40 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-mono"
                >
                    {autoRunning ? (
                        <span className="flex items-center gap-2">
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                ⟳
                            </motion.span>
                            {t("neuralNetworkNarrative.howItLearns.repeated.training")}
                        </span>
                    ) : (
                        t("neuralNetworkNarrative.howItLearns.repeated.auto")
                    )}
                </button>
                <button
                    onClick={reset}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold bg-white/[0.05] border border-white/[0.1] text-white/50 hover:bg-white/[0.08] hover:text-white/80 hover:border-white/[0.15] transition-all duration-200 font-mono"
                >
                    {t("neuralNetworkNarrative.howItLearns.repeated.reset")}
                </button>
            </div>

            {latest.loss < 0.5 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="mt-5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-500/15 border border-emerald-500/30 p-4 text-center shadow-[0_0_30px_-10px_rgba(52,211,153,0.4)]"
                >
                    <motion.p
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-sm text-emerald-400 font-bold font-mono"
                    >
                        ✓ {t("neuralNetworkNarrative.howItLearns.repeated.converged")}
                    </motion.p>
                </motion.div>
            )}
        </div>
    );
}
