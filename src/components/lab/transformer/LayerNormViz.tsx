"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  LayerNormViz — Redesign v3
  
  Shows WHY LayerNorm matters with clear bar-chart histograms.
  
  Left side:  the embedding values as colored vertical bars
  Right side: stats (range, mean, std) that change per step
  
  3 steps: Raw → Center (−μ) → Scale (÷σ)
  Each step shows the bars physically moving + a clear before/after.
  
  The key insight: raw values span -280 to 340 (chaos).
  After LayerNorm: values span -1.5 to 1.5 (stable).
  
  One concept: normalization tames explosive values so training works.
*/

const DIM_COLORS = ["#22d3ee", "#fbbf24", "#34d399", "#a78bfa", "#fb923c", "#f472b6"];
const DIM_NAMES = ["d1", "d2", "d3", "d4", "d5", "d6"];

/* Raw embedding values — intentionally extreme to show the problem */
const RAW_VALUES = [340, -120, 85, -280, 15, 210];

function computeStats(values: number[]) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance + 1e-5);
    const centered = values.map((v) => v - mean);
    const scaled = centered.map((v) => v / std);
    return { mean, std, centered, scaled };
}

const STATS = computeStats(RAW_VALUES);

type StepKey = 0 | 1 | 2;

const STEP_CONFIG = [
    {
        label: "Raw values",
        formula: "x",
        color: "#fbbf24",
        rgb: "251,191,36",
        title: "The problem: wildly different magnitudes",
        detail: `Values range from ${Math.min(...RAW_VALUES)} to ${Math.max(...RAW_VALUES)}. Dimension 1 is ${Math.abs(RAW_VALUES[0])} while dimension 5 is just ${RAW_VALUES[4]}. The large values dominate gradients \u2014 small values get ignored. Training is unstable.`,
    },
    {
        label: "Subtract mean",
        formula: "x \u2212 \u03BC",
        color: "#22d3ee",
        rgb: "34,211,238",
        title: "Step 1: center around zero",
        detail: `Subtract the mean (\u03BC = ${STATS.mean.toFixed(0)}) from every value. Now they\u2019re balanced around zero \u2014 no positive or negative bias. But the SPREAD is still huge.`,
    },
    {
        label: "Divide by \u03C3",
        formula: "(x \u2212 \u03BC) / \u03C3",
        color: "#34d399",
        rgb: "52,211,153",
        title: "Step 2: compress the range",
        detail: `Divide by standard deviation (\u03C3 = ${STATS.std.toFixed(0)}). Now ALL values live between roughly \u22121.5 and +1.5. Every dimension contributes equally. Gradients are stable.`,
    },
] as const;

/* SVG bar chart constants */
const CHART_W = 300;
const CHART_H = 220;
const BAR_AREA_TOP = 24;
const BAR_AREA_BOT = 30;
const MID_Y = (CHART_H - BAR_AREA_TOP - BAR_AREA_BOT) / 2 + BAR_AREA_TOP;
const BAR_HALF_H = (CHART_H - BAR_AREA_TOP - BAR_AREA_BOT) / 2;
const BAR_GAP = 6;
const BAR_W = (CHART_W - BAR_GAP * (RAW_VALUES.length + 1)) / RAW_VALUES.length;

export function LayerNormViz() {
    const [step, setStep] = useState<StepKey>(0);

    const values: number[] = step === 0 ? RAW_VALUES : step === 1 ? STATS.centered : STATS.scaled;
    const maxAbs = useMemo(() => Math.max(...values.map(Math.abs), 0.01), [values]);
    const cfg = STEP_CONFIG[step];

    /* Range info for display */
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const rangeStr = step === 2
        ? `${minVal.toFixed(1)} to ${maxVal.toFixed(1)}`
        : `${minVal.toFixed(0)} to ${maxVal.toFixed(0)}`;

    return (
        <div className="py-5 sm:py-7 px-2 sm:px-4">
            {/* Step buttons */}
            <div className="flex items-center justify-center gap-1 mb-4">
                {STEP_CONFIG.map((s, i) => {
                    const active = step === i;
                    const past = step > i;
                    return (
                        <div key={i} className="flex items-center gap-1">
                            <motion.button
                                onClick={() => setStep(i as StepKey)}
                                whileTap={{ scale: 0.95 }}
                                className="relative px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer"
                                animate={{
                                    background: active ? `rgba(${s.rgb},0.12)` : "transparent",
                                    color: active ? s.color : past ? `rgba(${s.rgb},0.4)` : "rgba(255,255,255,0.2)",
                                }}
                            >
                                <span className="text-[10px] font-mono mr-1 opacity-50">{i + 1}.</span>
                                {s.label}
                                {active && (
                                    <motion.div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                                        style={{ background: s.color }} layoutId="ln-step" />
                                )}
                            </motion.button>
                            {i < 2 && (
                                <span className="text-[10px] mx-0.5" style={{ color: step > i ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)" }}>{"\u2192"}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Bar chart ── */}
            <div className="max-w-md mx-auto">
                <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full">
                    {/* Zero line */}
                    <line x1={0} y1={MID_Y} x2={CHART_W} y2={MID_Y}
                        stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
                    <text x={CHART_W - 2} y={MID_Y - 4} textAnchor="end"
                        fontSize={8} fill="rgba(255,255,255,0.12)" fontFamily="monospace">0</text>

                    {/* Healthy zone (step 2) */}
                    {step === 2 && (
                        <motion.rect
                            x={0} width={CHART_W} rx={4}
                            initial={{ y: MID_Y, height: 0, opacity: 0 }}
                            animate={{
                                y: MID_Y - BAR_HALF_H * 0.5,
                                height: BAR_HALF_H,
                                opacity: 1,
                            }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            fill="rgba(52,211,153,0.04)"
                            stroke="rgba(52,211,153,0.08)"
                            strokeWidth={1}
                            strokeDasharray="4 3"
                        />
                    )}

                    {/* Bars */}
                    {values.map((v, i) => {
                        const x = BAR_GAP + i * (BAR_W + BAR_GAP);
                        const normalizedH = (Math.abs(v) / maxAbs) * BAR_HALF_H;
                        const barH = Math.max(normalizedH, 2);
                        const y = v >= 0 ? MID_Y - barH : MID_Y;

                        return (
                            <g key={i}>
                                <motion.rect
                                    x={x} width={BAR_W} rx={4}
                                    animate={{ y, height: barH }}
                                    transition={{ type: "spring", stiffness: 100, damping: 14, delay: i * 0.04 }}
                                    fill={DIM_COLORS[i]}
                                    opacity={0.6}
                                    style={{ filter: `drop-shadow(0 0 4px ${DIM_COLORS[i]}25)` }}
                                />
                                {/* Value label */}
                                <motion.text
                                    x={x + BAR_W / 2}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fontFamily="monospace"
                                    fontWeight={700}
                                    animate={{
                                        y: v >= 0 ? MID_Y - barH - 5 : MID_Y + barH + 12,
                                        fill: `${DIM_COLORS[i]}`,
                                        opacity: 0.7,
                                    }}
                                    transition={{ type: "spring", stiffness: 100, damping: 14, delay: i * 0.04 }}
                                >
                                    {step === 2 ? v.toFixed(1) : v.toFixed(0)}
                                </motion.text>
                                {/* Dim label at bottom */}
                                <text x={x + BAR_W / 2} y={CHART_H - 6}
                                    textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.2)"
                                    fontFamily="monospace">{DIM_NAMES[i]}</text>
                            </g>
                        );
                    })}

                    {/* Range annotation */}
                    <motion.text x={CHART_W / 2} y={14} textAnchor="middle" fontSize={10}
                        fontFamily="monospace" fontWeight={600}
                        animate={{ fill: cfg.color }}>
                        range: {rangeStr}
                    </motion.text>
                </svg>
            </div>

            {/* ── Formula + explanation ── */}
            <AnimatePresence mode="wait">
                <motion.div key={step}
                    className="text-center mt-2 max-w-md mx-auto"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <p className="text-[18px] font-mono font-bold" style={{ color: cfg.color }}>
                        {cfg.formula}
                    </p>
                    <p className="text-[14px] font-semibold mt-2" style={{ color: cfg.color }}>
                        {cfg.title}
                    </p>
                    <p className="text-[12px] mt-1 leading-relaxed max-w-sm mx-auto" style={{ color: `rgba(${cfg.rgb},0.5)` }}>
                        {cfg.detail}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Takeaway at step 2 */}
            {step === 2 && (
                <motion.div
                    className="flex items-center justify-center gap-2 mt-4 px-4 py-2.5 rounded-xl mx-auto max-w-sm"
                    style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.1)" }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="text-[18px]">{"\u2705"}</span>
                    <p className="text-[12px] font-semibold" style={{ color: "rgba(52,211,153,0.65)" }}>
                        Every dimension now has comparable magnitude. Gradients flow smoothly, training is stable.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
