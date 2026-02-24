"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";
import { NN_COLORS } from "./visualizer-theme";

/* Fixed commute inputs: distance = 5 km, traffic = 7 (scale 1-10) */
const X1 = 5;   // distance_km
const X2 = 7;   // traffic_level
const MAX_MINUTES = 80;

export function BiasDemo() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [w1, setW1] = useState(1.2);
    const [w2, setW2] = useState(2.0);
    const [bias, setBias] = useState(4.0);

    const contrib1 = +(w1 * X1).toFixed(1);
    const contrib2 = +(w2 * X2).toFixed(1);
    const total = +(contrib1 + contrib2 + bias).toFixed(1);
    const clampedTotal = Math.max(0, total);

    // Segmented bar: proportion of each positive contribution
    const posSum = Math.max(0.01, Math.abs(contrib1) + Math.abs(contrib2) + Math.abs(bias));
    const pct1 = (Math.abs(contrib1) / posSum) * 100;
    const pct2 = (Math.abs(contrib2) / posSum) * 100;
    const pctB = (Math.abs(bias) / posSum) * 100;

    // Thermometer fill 0–MAX_MINUTES
    const thermoPct = Math.min(Math.max(clampedTotal / MAX_MINUTES, 0), 1) * 100;
    const thermoColor = thermoPct > 75 ? "#f43f5e" : thermoPct > 45 ? "#fbbf24" : "#34d399";

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 280, damping: 28 };

    return (
        <div className="p-5 sm:p-6 space-y-5">
            {/* Inputs row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] px-3 py-2.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-sky-400/50 mb-0.5">
                        {t("neuralNetworkNarrative.discovery.weights.inputLabel1")}
                    </p>
                    <p className="text-xl font-mono font-bold" style={{ color: NN_COLORS.input.hex }}>
                        {X1} <span className="text-xs font-normal text-white/30">km</span>
                    </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-amber-400/50 mb-0.5">
                        {t("neuralNetworkNarrative.discovery.weights.inputLabel2")}
                    </p>
                    <p className="text-xl font-mono font-bold" style={{ color: NN_COLORS.target.hex }}>
                        {X2} <span className="text-xs font-normal text-white/30">/ 10</span>
                    </p>
                </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
                {/* w₁ */}
                <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.weight.hex }}>
                            w₁ <span className="text-white/30 font-normal text-[10px]">({t("neuralNetworkNarrative.discovery.weights.weightLabel")} distance)</span>
                        </span>
                        <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.weight.hex }}>{w1.toFixed(1)}</span>
                    </div>
                    <Slider min={-1} max={4} step={0.1} value={[w1]} onValueChange={([v]) => setW1(v)} trackColor={NN_COLORS.weight.hex} thumbColor={NN_COLORS.weight.hex} />
                    <p className="text-[10px] font-mono text-white/30 mt-1.5">
                        {w1.toFixed(1)} × {X1} = <span className="text-sky-300/70 font-bold">{contrib1} min</span>
                    </p>
                </div>

                {/* w₂ */}
                <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.weight.hex }}>
                            w₂ <span className="text-white/30 font-normal text-[10px]">({t("neuralNetworkNarrative.discovery.weights.weightLabel")} traffic)</span>
                        </span>
                        <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.weight.hex }}>{w2.toFixed(1)}</span>
                    </div>
                    <Slider min={-1} max={4} step={0.1} value={[w2]} onValueChange={([v]) => setW2(v)} trackColor={NN_COLORS.weight.hex} thumbColor={NN_COLORS.weight.hex} />
                    <p className="text-[10px] font-mono text-white/30 mt-1.5">
                        {w2.toFixed(1)} × {X2} = <span className="text-amber-300/70 font-bold">{contrib2} min</span>
                    </p>
                </div>

                {/* bias — hero element */}
                <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.bias.hex }}>
                            b <span className="text-white/30 font-normal text-[10px]">({t("neuralNetworkNarrative.discovery.weights.biasLabel")})</span>
                        </span>
                        <span className="text-sm font-mono font-bold" style={{ color: NN_COLORS.bias.hex }}>{bias.toFixed(1)}</span>
                    </div>
                    <Slider min={-10} max={20} step={0.5} value={[bias]} onValueChange={([v]) => setBias(v)} trackColor={NN_COLORS.bias.hex} thumbColor={NN_COLORS.bias.hex} />
                </div>
            </div>

            {/* Arithmetic display */}
            <div className="rounded-xl bg-black/30 border border-white/[0.06] px-4 py-3">
                <p className="text-[10px] font-mono text-white/30 mb-1">{t("neuralNetworkNarrative.discovery.weights.formula")}</p>
                <p className="text-sm font-mono text-white/60 leading-relaxed">
                    <span style={{ color: NN_COLORS.input.hex }}>{X1}</span>
                    <span className="text-white/30"> × </span>
                    <span style={{ color: NN_COLORS.weight.hex }}>{w1.toFixed(1)}</span>
                    <span className="text-white/30"> + </span>
                    <span style={{ color: NN_COLORS.target.hex }}>{X2}</span>
                    <span className="text-white/30"> × </span>
                    <span style={{ color: NN_COLORS.weight.hex }}>{w2.toFixed(1)}</span>
                    <span className="text-white/30"> + </span>
                    <span style={{ color: NN_COLORS.bias.hex }}>{bias.toFixed(1)}</span>
                    <span className="text-white/30"> = </span>
                    <motion.span
                        key={total}
                        animate={{ scale: [1.15, 1] }}
                        transition={spring}
                        className="text-base font-bold"
                        style={{ color: NN_COLORS.output.hex }}
                    >
                        {total}
                    </motion.span>
                    <span className="text-white/30 text-xs"> min</span>
                </p>
            </div>

            {/* Segmented contribution bar */}
            <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1.5">
                    {t("neuralNetworkNarrative.discovery.weights.contributionLabel")}
                </p>
                <div className="flex h-3 rounded-full overflow-hidden gap-px">
                    <motion.div
                        className="rounded-l-full"
                        style={{ background: NN_COLORS.input.hex + "99" }}
                        animate={{ width: `${pct1}%` }}
                        transition={spring}
                    />
                    <motion.div
                        style={{ background: NN_COLORS.target.hex + "99" }}
                        animate={{ width: `${pct2}%` }}
                        transition={spring}
                    />
                    <motion.div
                        className="rounded-r-full"
                        style={{ background: NN_COLORS.bias.hex + "99" }}
                        animate={{ width: `${pctB}%` }}
                        transition={spring}
                    />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[9px] font-mono" style={{ color: NN_COLORS.input.hex + "99" }}>distance</span>
                    <span className="text-[9px] font-mono" style={{ color: NN_COLORS.target.hex + "99" }}>traffic</span>
                    <span className="text-[9px] font-mono" style={{ color: NN_COLORS.bias.hex + "99" }}>bias</span>
                </div>
            </div>

            {/* Thermometer output */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex justify-between mb-1">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                            {t("neuralNetworkNarrative.discovery.weights.outputLabel")}
                        </span>
                        <span className="text-[9px] font-mono text-white/25">0 – {MAX_MINUTES} min</span>
                    </div>
                    <div className="relative h-5 rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.06]">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ background: thermoColor }}
                            animate={{ width: `${thermoPct}%` }}
                            transition={spring}
                        />
                    </div>
                </div>
                <motion.div
                    className="text-2xl font-mono font-bold shrink-0 w-20 text-right"
                    animate={{ color: thermoColor }}
                    transition={{ duration: 0.3 }}
                >
                    {clampedTotal > 0 ? clampedTotal.toFixed(0) : "—"}
                    <span className="text-xs font-normal text-white/30 ml-1">min</span>
                </motion.div>
            </div>
        </div>
    );
}
