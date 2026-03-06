"use client";

import { useMemo, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   BatchNormEffectVisualizer v2
   Shows how Batch Normalization stabilizes
   activation distributions across layers.
   Now with: overlaid histograms, dead zone %,
   animated transitions, layer health indicators.
   ───────────────────────────────────────────── */

const NUM_LAYERS = 5;
const NUM_BINS = 30;
const BIN_RANGE = { min: -6, max: 6 };
const DEAD_THRESHOLD = 1.5;

function seededRng(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function gaussianSamples(mean: number, std: number, n: number, seed: number): number[] {
    const rng = seededRng(seed);
    const samples: number[] = [];
    for (let i = 0; i < n; i += 2) {
        const u1 = Math.max(1e-10, rng());
        const u2 = rng();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
        samples.push(z0 * std + mean);
        if (i + 1 < n) samples.push(z1 * std + mean);
    }
    return samples;
}

function histogram(samples: number[]): number[] {
    const bins = new Array(NUM_BINS).fill(0);
    const range = BIN_RANGE.max - BIN_RANGE.min;
    for (const s of samples) {
        const idx = Math.floor(((s - BIN_RANGE.min) / range) * NUM_BINS);
        if (idx >= 0 && idx < NUM_BINS) bins[idx]++;
    }
    const max = Math.max(...bins, 1);
    return bins.map((b) => b / max);
}

function erf(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

function deadZonePct(mean: number, std: number): number {
    return (1 - (
        0.5 * (1 + erf((DEAD_THRESHOLD - mean) / (std * Math.SQRT2))) -
        0.5 * (1 + erf((-DEAD_THRESHOLD - mean) / (std * Math.SQRT2)))
    )) * 100;
}

interface LayerDist {
    label: string;
    withoutBN: number[];
    withBN: number[];
    meanWithout: number;
    stdWithout: number;
    deadPctWithout: number;
    deadPctWithBN: number;
}

function generateLayerDistributions(): LayerDist[] {
    return Array.from({ length: NUM_LAYERS }, (_, i) => {
        const meanDrift = (i - 1) * 0.8;
        const stdDrift = 0.8 + i * 0.6;
        const samplesWithout = gaussianSamples(meanDrift, stdDrift, 500, 42 + i * 100);
        const withoutBN = histogram(samplesWithout);

        const samplesNormed = gaussianSamples(0, 1, 500, 137 + i * 100);
        const withBN = histogram(samplesNormed);

        const actualMean = samplesWithout.reduce((a, b) => a + b, 0) / samplesWithout.length;
        const actualStd = Math.sqrt(
            samplesWithout.reduce((a, b) => a + (b - actualMean) ** 2, 0) / samplesWithout.length
        );

        return {
            label: `Layer ${i + 1}`,
            withoutBN,
            withBN,
            meanWithout: actualMean,
            stdWithout: actualStd,
            deadPctWithout: deadZonePct(actualMean, actualStd),
            deadPctWithBN: deadZonePct(0, 1),
        };
    });
}

const BAR_W = 300;
const BAR_H = 44;

function LayerHistogram({ layer, bnEnabled }: { layer: LayerDist; bnEnabled: boolean }) {
    const bins = bnEnabled ? layer.withBN : layer.withoutBN;
    const color = bnEnabled ? "#34d399" : "#fb7185";
    const binW = BAR_W / NUM_BINS;
    const deadBinStart = Math.floor(((BIN_RANGE.min + DEAD_THRESHOLD - BIN_RANGE.min) / (BIN_RANGE.max - BIN_RANGE.min)) * NUM_BINS);
    const deadBinEnd = NUM_BINS - deadBinStart;

    return (
        <svg viewBox={`0 0 ${BAR_W} ${BAR_H}`} className="w-full" style={{ maxHeight: 50 }}>
            {/* Dead zone backgrounds */}
            <rect x={0} y={0} width={deadBinStart * binW} height={BAR_H} fill="#ef4444" opacity={0.04} />
            <rect x={deadBinEnd * binW} y={0} width={(NUM_BINS - deadBinEnd) * binW} height={BAR_H} fill="#ef4444" opacity={0.04} />
            {/* Bars */}
            {bins.map((h, i) => {
                const inDead = i < deadBinStart || i >= deadBinEnd;
                return (
                    <motion.rect
                        key={i}
                        x={i * binW}
                        width={binW - 0.5}
                        rx={0.5}
                        fill={inDead ? "#ef4444" : color}
                        opacity={0.6}
                        animate={{
                            y: BAR_H - h * BAR_H,
                            height: h * BAR_H,
                        }}
                        transition={{ duration: 0.35, delay: i * 0.008 }}
                    />
                );
            })}
            {/* Center line */}
            <line x1={BAR_W / 2} y1={0} x2={BAR_W / 2} y2={BAR_H} stroke="white" strokeOpacity={0.08} strokeWidth={0.5} strokeDasharray="2 2" />
        </svg>
    );
}

function healthColor(deadPct: number): string {
    if (deadPct > 25) return "#ef4444";
    if (deadPct > 10) return "#f59e0b";
    return "#22c55e";
}

export function BatchNormEffectVisualizer() {
    const [bnEnabled, setBnEnabled] = useState(false);
    const layers = useMemo(() => generateLayerDistributions(), []);

    const totalDeadWithout = layers.reduce((a, l) => a + l.deadPctWithout, 0) / layers.length;
    const totalDeadWithBN = layers.reduce((a, l) => a + l.deadPctWithBN, 0) / layers.length;
    const currentTotalDead = bnEnabled ? totalDeadWithBN : totalDeadWithout;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setBnEnabled(false)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold transition-all border ${!bnEnabled
                        ? "text-rose-400 bg-rose-500/15 border-rose-500/30"
                        : "text-white/20 bg-white/[0.02] border-white/[0.06] hover:border-white/10"
                        }`}
                >
                    ✗ Without BatchNorm
                </button>
                <button
                    onClick={() => setBnEnabled(true)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold transition-all border ${bnEnabled
                        ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                        : "text-white/20 bg-white/[0.02] border-white/[0.06] hover:border-white/10"
                        }`}
                >
                    ✓ With BatchNorm
                </button>
            </div>

            {/* Layer distributions */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-[8px] font-mono text-white/20 pb-1">
                    <span>LAYER</span>
                    <div className="flex gap-8">
                        <span>DISTRIBUTION</span>
                        <span className="w-12 text-right">μ</span>
                        <span className="w-12 text-right">σ</span>
                        <span className="w-16 text-right">DEAD ZONE</span>
                    </div>
                </div>

                {layers.map((layer, i) => {
                    const mean = bnEnabled ? 0 : layer.meanWithout;
                    const std = bnEnabled ? 1 : layer.stdWithout;
                    const dead = bnEnabled ? layer.deadPctWithBN : layer.deadPctWithout;
                    const hc = healthColor(dead);

                    return (
                        <motion.div
                            key={i}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            {/* Layer label + health dot */}
                            <div className="flex items-center gap-1 w-14 shrink-0">
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full"
                                    animate={{ backgroundColor: hc }}
                                    transition={{ duration: 0.3 }}
                                />
                                <span className="text-[9px] font-mono text-white/30">{layer.label}</span>
                            </div>

                            {/* Histogram */}
                            <div className="flex-1">
                                <LayerHistogram layer={layer} bnEnabled={bnEnabled} />
                            </div>

                            {/* Stats */}
                            <div className="flex gap-2 shrink-0 items-center">
                                <span className="text-[8px] font-mono w-12 text-right" style={{ color: Math.abs(mean) > 0.5 ? "#f59e0b" : "#ffffff40" }}>
                                    {mean > 0 ? "+" : ""}{mean.toFixed(2)}
                                </span>
                                <span className="text-[8px] font-mono w-10 text-right" style={{ color: std > 1.5 ? "#ef4444" : "#ffffff40" }}>
                                    {std.toFixed(2)}
                                </span>
                                <motion.span
                                    className="text-[8px] font-mono font-bold w-12 text-right"
                                    animate={{ color: hc }}
                                >
                                    {dead.toFixed(0)}%
                                </motion.span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[6px] font-mono text-white/15">AVG DEAD ZONE</p>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={bnEnabled ? "bn" : "no"}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-lg font-mono font-black"
                            style={{ color: healthColor(currentTotalDead) }}
                        >
                            {currentTotalDead.toFixed(0)}%
                        </motion.p>
                    </AnimatePresence>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[6px] font-mono text-white/15">LAYER 5 SPREAD</p>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={bnEnabled ? "bn" : "no"}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-lg font-mono font-black"
                            style={{ color: bnEnabled ? "#22c55e" : "#ef4444" }}
                        >
                            {bnEnabled ? "1.0σ" : `${layers[4].stdWithout.toFixed(1)}σ`}
                        </motion.p>
                    </AnimatePresence>
                    <p className="text-[5px] font-mono text-white/10">
                        {bnEnabled ? "stable" : `${(layers[4].stdWithout / 0.5).toFixed(1)}× original`}
                    </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[6px] font-mono text-white/15">HEALTH</p>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={bnEnabled ? "bn" : "no"}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-[10px] font-mono font-bold"
                            style={{ color: bnEnabled ? "#22c55e" : "#ef4444" }}
                        >
                            {bnEnabled ? "All layers healthy ✓" : "Deep layers dying ✗"}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            {/* Explanation card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={bnEnabled ? "bn-card" : "no-card"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="rounded-lg border p-3 space-y-1.5"
                    style={{
                        borderColor: bnEnabled ? "#22c55e20" : "#ef444420",
                        backgroundColor: bnEnabled ? "#22c55e08" : "#ef444408",
                    }}
                >
                    <p className="text-[9px] font-mono font-bold" style={{ color: bnEnabled ? "#22c55e" : "#ef4444" }}>
                        {bnEnabled
                            ? "BatchNorm: every layer sees healthy inputs"
                            : "Without BN: deeper layers see increasingly distorted inputs"
                        }
                    </p>
                    <p className="text-[8px] font-mono text-white/25 leading-relaxed">
                        {bnEnabled
                            ? `After each layer, BN forces activations to μ≈0, σ≈1. Dead zone drops from ${totalDeadWithout.toFixed(0)}% to ${totalDeadWithBN.toFixed(0)}%. Every neuron stays in tanh's linear zone where gradients flow freely. Toggle back to see the difference.`
                            : `Without normalization, Layer 5 has mean=${layers[4].meanWithout.toFixed(2)} and σ=${layers[4].stdWithout.toFixed(1)} (${(layers[4].stdWithout / 0.5).toFixed(1)}× the original spread). ${layers[4].deadPctWithout.toFixed(0)}% of activations fall in tanh's dead zone — those neurons produce zero gradient. Toggle "With BatchNorm" to fix this.`
                        }
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
