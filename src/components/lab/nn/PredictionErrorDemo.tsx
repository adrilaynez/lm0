"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";
import { NN_COLORS } from "./visualizer-theme";

/*
  Interactive challenge: user adjusts w₁, w₂, bias to match actual = 30 min.
  Inputs fixed: x₁ = 5 (distance km), x₂ = 7 (traffic level).
  Target = 30 min commute.
  Shows predicted vs actual bars, sensitivity, success state.
*/

const X1 = 5;
const X2 = 7;
const TARGET = 30;
const BAR_MAX = 60;

export function PredictionErrorDemo() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [w1, setW1] = useState(4.0);
    const [w2, setW2] = useState(3.0);
    const [bias, setBias] = useState(0.0);

    const predicted = +(w1 * X1 + w2 * X2 + bias).toFixed(1);
    const error = +(predicted - TARGET).toFixed(1);
    const absError = Math.abs(error);
    const isSuccess = absError < 1;
    const isClose = absError < 5;

    // Sensitivity: how much output changes per unit change in each weight
    const sensW1 = X1; // 5
    const sensW2 = X2; // 7

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 26 };

    const predictedPct = Math.min(Math.max(predicted / BAR_MAX, 0), 1) * 100;
    const targetPct = (TARGET / BAR_MAX) * 100;

    return (
        <div className="p-5 sm:p-6 space-y-5">
            {/* Challenge prompt */}
            <div className="rounded-xl bg-amber-500/[0.05] border border-amber-500/20 px-4 py-3">
                <p className="text-xs font-semibold text-amber-300/70 mb-0.5">
                    {t("neuralNetworkNarrative.howItLearns.predictionError.challenge")}
                </p>
                <p className="text-[11px] text-white/40">
                    {t("neuralNetworkNarrative.howItLearns.predictionError.challengeDesc")}
                </p>
            </div>

            {/* Sliders */}
            <div className="space-y-3">
                {[
                    { label: "w₁", sublabel: `(× distance ${X1} km)`, val: w1, set: setW1, min: -2, max: 8, step: 0.1, color: NN_COLORS.weight.hex, sens: sensW1, isWeight: true },
                    { label: "w₂", sublabel: `(× traffic ${X2})`, val: w2, set: setW2, min: -2, max: 8, step: 0.1, color: NN_COLORS.weight.hex, sens: sensW2, isWeight: true },
                    { label: "b", sublabel: "(bias)", val: bias, set: setBias, min: -20, max: 20, step: 0.5, color: NN_COLORS.bias.hex, sens: 1, isWeight: false },
                ].map(({ label, sublabel, val, set, min, max, step, color, sens, isWeight }) => (
                    <div key={label} className={`rounded-xl border px-4 py-3 ${isWeight ? "border-rose-500/15 bg-rose-500/[0.03]" : "border-violet-500/15 bg-violet-500/[0.03]"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-bold" style={{ color }}>{label}</span>
                                <span className="text-[10px] text-white/30">{sublabel}</span>
                            </div>
                            <span className="text-sm font-mono font-bold" style={{ color }}>{val.toFixed(1)}</span>
                        </div>
                        <Slider min={min} max={max} step={step} value={[val]} onValueChange={([v]) => set(v)} />
                        {label !== "b" && (
                            <p className="text-[10px] text-white/25 mt-1.5 font-mono">
                                {t("neuralNetworkNarrative.howItLearns.predictionError.sensitivity").replace("{w}", label).replace("{n}", String(sens))}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Predicted vs Actual bars */}
            <div className="space-y-3">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                    {t("neuralNetworkNarrative.howItLearns.predictionError.comparison")}
                </p>

                {/* Predicted bar */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-mono text-white/40">{t("neuralNetworkNarrative.howItLearns.predictionError.got")}</span>
                        <motion.span
                            key={predicted}
                            animate={{ scale: [1.1, 1] }}
                            transition={spring}
                            className="text-[10px] font-mono font-bold"
                            style={{ color: isSuccess ? NN_COLORS.output.hex : isClose ? NN_COLORS.target.hex : NN_COLORS.error.hex }}
                        >
                            {predicted} min
                        </motion.span>
                    </div>
                    <div className="relative h-4 rounded-full bg-white/[0.04] overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ background: isSuccess ? NN_COLORS.output.hex : isClose ? NN_COLORS.target.hex : NN_COLORS.error.hex }}
                            animate={{ width: `${predictedPct}%` }}
                            transition={spring}
                        />
                    </div>
                </div>

                {/* Actual bar */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-mono text-white/40">{t("neuralNetworkNarrative.howItLearns.predictionError.expected")}</span>
                        <span className="text-[10px] font-mono font-bold" style={{ color: NN_COLORS.output.hex }}>{TARGET} min</span>
                    </div>
                    <div className="relative h-4 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ width: `${targetPct}%`, background: NN_COLORS.output.hex + "60" }}
                        />
                    </div>
                </div>
            </div>

            {/* Sensitivity indicator */}
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-sky-500/[0.04] border border-sky-500/15 p-2.5 text-center">
                    <p className="text-[9px] font-mono text-sky-400/50 mb-0.5">w₁ +1 →</p>
                    <p className="text-sm font-mono font-bold text-sky-400">+{sensW1} min</p>
                </div>
                <div className="rounded-lg bg-amber-500/[0.04] border border-amber-500/15 p-2.5 text-center">
                    <p className="text-[9px] font-mono text-amber-400/50 mb-0.5">w₂ +1 →</p>
                    <p className="text-sm font-mono font-bold text-amber-400">+{sensW2} min</p>
                </div>
            </div>

            {/* Error readout / success state */}
            <motion.div
                className={`rounded-xl p-4 border text-center transition-colors ${isSuccess
                    ? "bg-emerald-500/[0.08] border-emerald-500/30 shadow-[0_0_24px_-6px_rgba(52,211,153,0.25)]"
                    : isClose
                        ? "bg-amber-500/[0.06] border-amber-500/20"
                        : "bg-rose-500/[0.05] border-rose-500/20"
                    }`}
            >
                <span className="text-[10px] font-mono uppercase tracking-widest block mb-1"
                    style={{ color: isSuccess ? NN_COLORS.output.hex : isClose ? NN_COLORS.target.hex : NN_COLORS.error.hex }}>
                    {t("neuralNetworkNarrative.howItLearns.predictionError.error")}
                </span>
                <motion.span
                    key={error}
                    animate={{ scale: [1.12, 1] }}
                    transition={spring}
                    className="text-3xl font-mono font-bold block"
                    style={{ color: isSuccess ? NN_COLORS.output.hex : isClose ? NN_COLORS.target.hex : NN_COLORS.error.hex }}
                >
                    {error > 0 ? "+" : ""}{error}
                </motion.span>
                {isSuccess ? (
                    <p className="text-xs font-semibold mt-2" style={{ color: NN_COLORS.output.hex }}>
                        {t("neuralNetworkNarrative.howItLearns.predictionError.success")}
                    </p>
                ) : (
                    <p className="text-[11px] text-white/30 mt-2">
                        {t("neuralNetworkNarrative.howItLearns.predictionError.offBy")}
                    </p>
                )}
            </motion.div>
        </div>
    );
}
