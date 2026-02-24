"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";
import { NN_COLORS } from "./visualizer-theme";

/*
  Interactive: bias slider starting very negative (e.g., -10).
  ReLU applied: show that output is always 0 regardless of input.
  "This neuron is dead — it will never learn." Label.
  Slider to increase bias → neuron "comes alive".
*/

const INPUTS = [1, 3, 5, 7, 9]; // sample inputs to show

export function DeadNeuronDemo() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [bias, setBias] = useState(-10);
    const weight = 1; // fixed weight

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 24 };

    // For each input, compute weighted_sum = w*x + b, then ReLU
    const results = INPUTS.map(x => {
        const pre = weight * x + bias;
        const post = Math.max(0, pre);
        return { x, pre: +pre.toFixed(1), post: +post.toFixed(1) };
    });

    const allDead = results.every(r => r.post === 0);
    const allAlive = results.every(r => r.post > 0);
    const maxPost = Math.max(...results.map(r => r.post), 1);

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Bias slider */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.bias.hex }}>
                        bias (b)
                    </span>
                    <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.bias.hex }}>
                        {bias.toFixed(1)}
                    </span>
                </div>
                <Slider min={-12} max={5} step={0.5} value={[bias]} onValueChange={([v]) => setBias(v)} trackColor={NN_COLORS.bias.hex} thumbColor={NN_COLORS.bias.hex} />
                <p className="text-[9px] font-mono text-white/25 mt-1">
                    w = {weight} (fixed) · ReLU(w·x + b)
                </p>
            </div>

            {/* Output bars for each input */}
            <div className="space-y-2">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                    {t("neuralNetworkNarrative.deadNeuron.outputsLabel")}
                </p>
                {results.map(({ x, pre, post }) => (
                    <div key={x} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-white/30 w-12 shrink-0">
                            x={x}
                        </span>
                        <div className="flex-1 relative h-4 rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                    background: post > 0 ? NN_COLORS.output.hex : NN_COLORS.error.hex + "40",
                                }}
                                animate={{ width: `${(post / maxPost) * 100}%` }}
                                transition={spring}
                            />
                        </div>
                        <span
                            className="text-[10px] font-mono font-bold w-8 text-right shrink-0"
                            style={{ color: post > 0 ? NN_COLORS.output.hex : NN_COLORS.error.hex }}
                        >
                            {post}
                        </span>
                    </div>
                ))}
            </div>

            {/* Status indicator */}
            <motion.div
                className={`rounded-xl p-3 border text-center transition-colors ${allDead
                        ? "bg-rose-500/[0.06] border-rose-500/20"
                        : allAlive
                            ? "bg-emerald-500/[0.06] border-emerald-500/20"
                            : "bg-amber-500/[0.05] border-amber-500/20"
                    }`}
            >
                <motion.p
                    key={allDead ? "dead" : allAlive ? "alive" : "partial"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-semibold"
                    style={{
                        color: allDead ? NN_COLORS.error.hex
                            : allAlive ? NN_COLORS.output.hex
                                : NN_COLORS.target.hex,
                    }}
                >
                    {allDead
                        ? t("neuralNetworkNarrative.deadNeuron.deadLabel")
                        : allAlive
                            ? t("neuralNetworkNarrative.deadNeuron.aliveLabel")
                            : t("neuralNetworkNarrative.deadNeuron.partialLabel")}
                </motion.p>
                <p className="text-[10px] text-white/30 mt-1">
                    {allDead
                        ? t("neuralNetworkNarrative.deadNeuron.deadExplain")
                        : t("neuralNetworkNarrative.deadNeuron.aliveExplain")}
                </p>
            </motion.div>
        </div>
    );
}
