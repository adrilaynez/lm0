"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Neuron-based visualizer: shows a single neuron with input → weight → sum → activation → output → loss.
  User changes the weight and sees how the chain propagates: Δw → Δoutput → Δloss.
  No graphs — just the neuron diagram with animated values flowing through.
  Designed for people who don't like math.
*/

const INPUT = 2;
const BIAS = 0.5;
const TARGET = 0.8;

function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }

export function WeightImpactVisualizer() {
    const { t } = useI18n();
    const [weight, setWeight] = useState(0.5);

    const z = weight * INPUT + BIAS;
    const output = sigmoid(z);
    const error = output - TARGET;
    const loss = error * error;

    // Nudge to show derivative concept
    const DELTA = 0.1;
    const zNudge = (weight + DELTA) * INPUT + BIAS;
    const outputNudge = sigmoid(zNudge);
    const errorNudge = outputNudge - TARGET;
    const lossNudge = errorNudge * errorNudge;
    const lossChange = lossNudge - loss;
    const direction = lossChange > 0.001 ? "up" : lossChange < -0.001 ? "down" : "same";

    // Color for loss indicator
    const lossColor = loss < 0.01 ? NN_COLORS.output.hex : loss < 0.1 ? "#eab308" : NN_COLORS.error.hex;

    return (
        <div className="space-y-5">
            {/* Weight slider */}
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/40 shrink-0">weight w</span>
                <input
                    type="range"
                    min={-2} max={3} step={0.05}
                    value={weight}
                    onChange={e => setWeight(+e.target.value)}
                    className="flex-1 cursor-pointer"
                    style={{ accentColor: NN_COLORS.weight.hex }}
                />
                <span className="text-sm font-mono font-bold w-12 text-right" style={{ color: NN_COLORS.weight.hex }}>
                    {weight.toFixed(2)}
                </span>
            </div>

            {/* Neuron diagram — horizontal chain */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-4 overflow-x-auto">
                <div className="flex items-center gap-1 min-w-[500px] justify-center">
                    {/* INPUT */}
                    <div className="flex flex-col items-center shrink-0">
                        <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: NN_COLORS.input.hex + "60", background: NN_COLORS.input.hex + "10" }}>
                            <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.input.hex }}>
                                {INPUT}
                            </span>
                        </div>
                        <span className="text-[8px] font-mono text-white/25 mt-1">input x</span>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center gap-0.5 shrink-0">
                        <div className="w-4 h-0.5 bg-white/10" />
                        <span className="text-[8px] font-mono text-white/30">×</span>
                    </div>

                    {/* WEIGHT */}
                    <motion.div
                        key={weight.toFixed(2)}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center shrink-0"
                    >
                        <div className="w-12 h-12 rounded-lg border-2 flex items-center justify-center"
                            style={{ borderColor: NN_COLORS.weight.hex + "60", background: NN_COLORS.weight.hex + "10" }}>
                            <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.weight.hex }}>
                                {weight.toFixed(1)}
                            </span>
                        </div>
                        <span className="text-[8px] font-mono text-white/25 mt-1">weight w</span>
                    </motion.div>

                    {/* Arrow with + bias */}
                    <div className="flex items-center gap-0.5 shrink-0">
                        <div className="w-3 h-0.5 bg-white/10" />
                        <span className="text-[8px] font-mono text-white/30">+</span>
                        <div className="w-8 h-8 rounded border flex items-center justify-center"
                            style={{ borderColor: NN_COLORS.bias.hex + "40", background: NN_COLORS.bias.hex + "08" }}>
                            <span className="text-[10px] font-mono" style={{ color: NN_COLORS.bias.hex }}>{BIAS}</span>
                        </div>
                        <div className="w-2 h-0.5 bg-white/10" />
                        <span className="text-[7px] font-mono text-white/20">→</span>
                    </div>

                    {/* SUM (z) */}
                    <div className="flex flex-col items-center shrink-0">
                        <div className="w-12 h-12 rounded-full border flex items-center justify-center bg-white/[0.02]"
                            style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                            <span className="text-[10px] font-mono font-bold text-white/60">
                                {z.toFixed(2)}
                            </span>
                        </div>
                        <span className="text-[8px] font-mono text-white/25 mt-1">z = wx+b</span>
                    </div>

                    {/* Arrow → σ */}
                    <div className="flex items-center gap-0.5 shrink-0">
                        <div className="w-3 h-0.5 bg-white/10" />
                        <span className="text-[7px] font-mono text-white/20">σ→</span>
                    </div>

                    {/* OUTPUT */}
                    <motion.div
                        key={output.toFixed(4)}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center shrink-0"
                    >
                        <div className="w-14 h-12 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: NN_COLORS.output.hex + "50", background: NN_COLORS.output.hex + "10" }}>
                            <span className="text-[11px] font-mono font-bold" style={{ color: NN_COLORS.output.hex }}>
                                {output.toFixed(3)}
                            </span>
                        </div>
                        <span className="text-[8px] font-mono text-white/25 mt-1">output</span>
                    </motion.div>

                    {/* vs TARGET → LOSS */}
                    <div className="flex items-center gap-0.5 shrink-0">
                        <div className="w-3 h-0.5 bg-white/10" />
                        <span className="text-[7px] font-mono text-white/20">vs</span>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                        <div className="w-10 h-10 rounded-lg border flex items-center justify-center"
                            style={{ borderColor: NN_COLORS.target.hex + "40", background: NN_COLORS.target.hex + "08" }}>
                            <span className="text-[10px] font-mono font-bold" style={{ color: NN_COLORS.target.hex }}>
                                {TARGET}
                            </span>
                        </div>
                        <span className="text-[8px] font-mono text-white/25 mt-1">target</span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                        <span className="text-[7px] font-mono text-white/20">→</span>
                    </div>

                    {/* LOSS */}
                    <motion.div
                        key={loss.toFixed(4)}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center shrink-0"
                    >
                        <div className="w-14 h-12 rounded-lg border-2 flex items-center justify-center"
                            style={{ borderColor: lossColor + "60", background: lossColor + "10" }}>
                            <span className="text-[11px] font-mono font-bold" style={{ color: lossColor }}>
                                {loss.toFixed(4)}
                            </span>
                        </div>
                        <span className="text-[8px] font-mono mt-1" style={{ color: lossColor }}>loss</span>
                    </motion.div>
                </div>
            </div>

            {/* What happens if we nudge the weight? */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">
                    {t("neuralNetworkNarrative.weightImpact.nudgeTitle")}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-black/20 p-2">
                        <p className="text-[7px] font-mono text-white/20 mb-0.5">current w = {weight.toFixed(2)}</p>
                        <p className="text-[10px] font-mono font-bold" style={{ color: NN_COLORS.error.hex }}>
                            loss = {loss.toFixed(4)}
                        </p>
                    </div>
                    <div className="rounded-lg bg-black/20 p-2">
                        <p className="text-[7px] font-mono text-white/20 mb-0.5">nudge w = {(weight + DELTA).toFixed(2)}</p>
                        <p className="text-[10px] font-mono font-bold" style={{ color: NN_COLORS.error.hex }}>
                            loss = {lossNudge.toFixed(4)}
                        </p>
                    </div>
                    <div className="rounded-lg p-2" style={{
                        background: direction === "down" ? NN_COLORS.output.hex + "08" : direction === "up" ? NN_COLORS.error.hex + "08" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${direction === "down" ? NN_COLORS.output.hex + "25" : direction === "up" ? NN_COLORS.error.hex + "25" : "rgba(255,255,255,0.06)"}`,
                    }}>
                        <p className="text-[7px] font-mono text-white/20 mb-0.5">Δloss</p>
                        <p className="text-[10px] font-mono font-bold" style={{
                            color: direction === "down" ? NN_COLORS.output.hex : direction === "up" ? NN_COLORS.error.hex : "rgba(255,255,255,0.4)",
                        }}>
                            {lossChange > 0 ? "+" : ""}{lossChange.toFixed(4)}
                        </p>
                        <p className="text-[7px] font-mono mt-0.5" style={{
                            color: direction === "down" ? NN_COLORS.output.hex : direction === "up" ? NN_COLORS.error.hex : "rgba(255,255,255,0.25)",
                        }}>
                            {direction === "up" ? "↑ worse!" : direction === "down" ? "↓ better!" : "≈ no change"}
                        </p>
                    </div>
                </div>

                {/* Conclusion */}
                <div className="rounded-lg bg-black/20 p-3 text-center">
                    <p className="text-[10px] font-mono" style={{
                        color: direction === "up" ? NN_COLORS.error.hex : direction === "down" ? NN_COLORS.output.hex : "rgba(255,255,255,0.4)",
                    }}>
                        {direction === "up"
                            ? t("neuralNetworkNarrative.weightImpact.shouldDecrease")
                            : direction === "down"
                                ? t("neuralNetworkNarrative.weightImpact.shouldIncrease")
                                : t("neuralNetworkNarrative.weightImpact.atMinimum")
                        }
                    </p>
                </div>
            </div>

            {/* Key insight */}
            <p className="text-[11px] text-white/30 italic leading-relaxed text-center">
                {t("neuralNetworkNarrative.weightImpact.insight")}
            </p>
        </div>
    );
}
