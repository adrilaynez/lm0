"use client";

import { useCallback, useMemo, useState } from "react";

import { motion } from "framer-motion";

import type { MLPTimelineResponse } from "@/types/lmLab";

/* ─────────────────────────────────────────────
   InitializationSensitivityVisualizer
   Continuous sigma slider that morphs loss curves
   smoothly. Zone-highlighted slider track.
   Uses real timeline data for Kaiming curve when available.
   ───────────────────────────────────────────── */

export interface InitializationSensitivityVisualizerProps {
    timeline: MLPTimelineResponse | null;
}

const STEPS = 50;

function seededRng(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/** Pre-generate anchor curves at key sigma values for interpolation. */
function generateAnchorCurve(sigma: number, realKaimingCurve?: number[]): number[] {
    if (sigma >= 0.1 && sigma <= 0.3 && realKaimingCurve && realKaimingCurve.length > 0) {
        // Resample real data to STEPS points
        return resample(realKaimingCurve, STEPS);
    }

    const rng = seededRng(Math.round(sigma * 10000));
    const curve: number[] = [];
    let loss: number;

    if (sigma < 0.05) {
        // Dead zone: flat/high, barely moves
        loss = 3.3 + (0.05 - sigma) * 20;
        for (let i = 0; i < STEPS; i++) {
            loss -= 0.003 * sigma * 100 + rng() * 0.002;
            loss = Math.max(loss, 3.0);
            loss += (rng() - 0.5) * 0.01;
            curve.push(loss);
        }
    } else if (sigma <= 0.4) {
        // Sweet spot: nice convergence
        loss = 3.3;
        const rate = 0.05 + (0.3 - Math.abs(sigma - 0.2)) * 0.15;
        const floor = 2.0 + Math.abs(sigma - 0.2) * 2;
        for (let i = 0; i < STEPS; i++) {
            loss -= rate * Math.exp(-i * 0.06) + rng() * 0.005;
            loss = Math.max(floor, loss + (rng() - 0.5) * 0.02);
            curve.push(loss);
        }
    } else if (sigma <= 1.5) {
        // Transition: increasingly unstable
        loss = 3.3;
        const chaos = (sigma - 0.4) / 1.1;
        for (let i = 0; i < STEPS; i++) {
            loss -= 0.03 * (1 - chaos * 0.7) * Math.exp(-i * 0.04);
            loss += (rng() - 0.5) * chaos * 1.5;
            loss = Math.max(2.5, Math.min(8, loss));
            curve.push(loss);
        }
    } else {
        // Chaotic zone: wild oscillations
        loss = 3.3;
        for (let i = 0; i < STEPS; i++) {
            if (i < 5) {
                loss += (rng() - 0.3) * sigma * 0.8;
            } else {
                loss = 4 + sigma + (rng() - 0.5) * sigma * 1.5;
            }
            curve.push(Math.max(2.5, Math.min(12, loss)));
        }
    }
    return curve;
}

function resample(arr: number[], targetLen: number): number[] {
    if (arr.length === targetLen) return arr;
    const result: number[] = [];
    for (let i = 0; i < targetLen; i++) {
        const t = (i / (targetLen - 1)) * (arr.length - 1);
        const lo = Math.floor(t);
        const hi = Math.min(lo + 1, arr.length - 1);
        const frac = t - lo;
        result.push(arr[lo] * (1 - frac) + arr[hi] * frac);
    }
    return result;
}

/** Interpolate between two curves element-wise. */
function lerpCurves(a: number[], b: number[], t: number): number[] {
    return a.map((v, i) => v * (1 - t) + (b[i] ?? v) * t);
}

type Zone = "dead" | "sweet" | "chaotic" | "transition";
function getZone(sigma: number): { zone: Zone; label: string; color: string } {
    if (sigma < 0.05) return { zone: "dead", label: "Dead Zone — Gradients vanish", color: "text-rose-400" };
    if (sigma <= 0.35) return { zone: "sweet", label: "Sweet Spot — Stable convergence", color: "text-emerald-400" };
    if (sigma <= 1.0) return { zone: "transition", label: "Unstable — Increasing chaos", color: "text-amber-400" };
    return { zone: "chaotic", label: "Chaotic Zone — Activations explode", color: "text-rose-400" };
}

// Anchor sigma values for interpolation
const ANCHORS = [0.001, 0.01, 0.03, 0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 2.0, 3.5, 5.0];

const W = 380, H = 180, PAD = { l: 40, r: 12, t: 12, b: 24 };

export function InitializationSensitivityVisualizer({ timeline }: InitializationSensitivityVisualizerProps) {
    // Logarithmic slider: 0..1 maps to 0.001..5.0
    const [sliderVal, setSliderVal] = useState(0.38); // ~0.2 = Kaiming zone

    const sigma = useMemo(() => {
        // log scale: 0.001 to 5.0
        return 0.001 * Math.pow(5000, sliderVal);
    }, [sliderVal]);

    // Pre-compute anchor curves
    const anchorCurves = useMemo(() => {
        const realLoss = timeline?.metrics_log?.train_loss?.map(e => e.value) ?? [];
        return ANCHORS.map(s => ({
            sigma: s,
            curve: generateAnchorCurve(s, realLoss.length > 0 ? realLoss : undefined),
        }));
    }, [timeline]);

    // Interpolate curve for current sigma
    const curve = useMemo(() => {
        // Find bracketing anchors
        let lo = anchorCurves[0], hi = anchorCurves[0];
        for (let i = 0; i < anchorCurves.length - 1; i++) {
            if (sigma >= anchorCurves[i].sigma && sigma <= anchorCurves[i + 1].sigma) {
                lo = anchorCurves[i];
                hi = anchorCurves[i + 1];
                break;
            }
            if (sigma > anchorCurves[i + 1].sigma) {
                lo = anchorCurves[i + 1];
                hi = anchorCurves[Math.min(i + 2, anchorCurves.length - 1)];
            }
        }
        if (lo.sigma === hi.sigma) return lo.curve;
        const t = (sigma - lo.sigma) / (hi.sigma - lo.sigma);
        return lerpCurves(lo.curve, hi.curve, Math.max(0, Math.min(1, t)));
    }, [sigma, anchorCurves]);

    const zoneInfo = useMemo(() => getZone(sigma), [sigma]);

    // Y range
    const yMin = Math.min(...curve) * 0.9;
    const yMax = Math.max(...curve) * 1.05;
    const yRange = yMax - yMin || 1;

    const toX = useCallback((i: number) => PAD.l + (i / (STEPS - 1)) * (W - PAD.l - PAD.r), []);
    const toY = useCallback((v: number) => PAD.t + (1 - (v - yMin) / yRange) * (H - PAD.t - PAD.b), [yMin, yRange]);

    const pts = curve.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");

    // Y-axis ticks
    const yTicks = useMemo(() => {
        const ticks: number[] = [];
        const step = Math.max(1, Math.ceil(yRange / 4));
        for (let v = Math.ceil(yMin); v <= yMax; v += step) ticks.push(v);
        return ticks;
    }, [yMin, yMax, yRange]);

    // Stroke color based on zone
    const strokeColor = zoneInfo.zone === "sweet" ? "rgb(52,211,153)"
        : zoneInfo.zone === "dead" ? "rgb(251,113,133)"
            : zoneInfo.zone === "chaotic" ? "rgb(251,113,133)"
                : "rgb(251,146,60)";

    // Zone explanation
    const zoneExplanation = useMemo(() => {
        const z = zoneInfo.zone;
        if (z === "dead") return {
            title: "Dead Zone",
            what: "All weights are tiny → activations are near 0 → tanh'(0) ≈ 1 but the signal itself is negligible.",
            why: `With σ=${sigma < 0.01 ? sigma.toExponential(1) : sigma.toFixed(3)}, weights are ~${(sigma * 100).toFixed(1)}× smaller than needed. The input to each neuron sums to ≈0. Gradients exist but carry no useful information — the network outputs random noise and stays there.`,
            result: "Loss stays flat near random baseline. The network has capacity but can't use it.",
            hex: "#fb7185",
        };
        if (z === "sweet") return {
            title: "Sweet Spot (Kaiming Region)",
            what: "Weights are scaled so activations stay in tanh's linear zone (|x| < 1).",
            why: `With σ=${sigma.toFixed(3)}, pre-activations have variance ≈1. tanh'(x) stays between 0.6–1.0. Gradients flow cleanly through all layers — each layer learns at a proportional rate.`,
            result: "Loss drops steadily and converges to a good minimum. This is where Kaiming initialization (σ = √(2/N)) lives.",
            hex: "#34d399",
        };
        if (z === "transition") return {
            title: "Unstable Zone",
            what: "Weights are getting too large → some activations saturate → gradients become noisy.",
            why: `With σ=${sigma.toFixed(2)}, many neurons see inputs |x| > 1.5. tanh starts saturating, derivatives drop. Some gradients vanish while others spike. The network oscillates between learning and forgetting.`,
            result: "Loss curve is jagged and unpredictable. Final loss is much higher than the sweet spot. Training is unreliable.",
            hex: "#fbbf24",
        };
        return {
            title: "Chaotic Zone",
            what: "Weights are so large that ALL activations saturate immediately → training diverges.",
            why: `With σ=${sigma.toFixed(1)}, even the first layer's pre-activations are |x| >> 2. Every neuron is stuck at tanh(x) ≈ ±1. Gradients are either zero (vanishing) or enormous (exploding). Weight updates are chaotic and destructive.`,
            result: "Loss spikes, oscillates wildly, or NaNs. The network is broken from step 0 and never recovers.",
            hex: "#fb7185",
        };
    }, [zoneInfo, sigma]);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Sigma slider with zone coloring */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/40">Init Scale (σ)</span>
                    <span className="text-sm font-mono font-bold text-white/70 tabular-nums">
                        σ = {sigma < 0.01 ? sigma.toExponential(1) : sigma.toFixed(3)}
                    </span>
                </div>
                {/* Zone-colored track */}
                <div className="relative h-6 flex items-center">
                    <div className="absolute inset-x-0 h-2 rounded-full overflow-hidden flex">
                        <div className="h-full bg-rose-500/30" style={{ width: "18%" }} />
                        <div className="h-full bg-emerald-500/30" style={{ width: "22%" }} />
                        <div className="h-full bg-amber-500/30" style={{ width: "30%" }} />
                        <div className="h-full bg-rose-500/30" style={{ width: "30%" }} />
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.005}
                        value={sliderVal}
                        onChange={e => setSliderVal(Number(e.target.value))}
                        className="relative w-full h-6 appearance-none bg-transparent cursor-pointer z-10
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2
                            [&::-webkit-slider-thumb]:border-violet-500 [&::-webkit-slider-thumb]:shadow-lg"
                    />
                </div>
                {/* Zone labels */}
                <div className="flex text-[8px] font-mono text-white/20">
                    <span className="w-[18%] text-center text-rose-400/50">Dead</span>
                    <span className="w-[22%] text-center text-emerald-400/50">Sweet Spot</span>
                    <span className="w-[30%] text-center text-amber-400/50">Unstable</span>
                    <span className="w-[30%] text-center text-rose-400/50">Chaotic</span>
                </div>
            </div>

            {/* Zone label */}
            <motion.div
                key={zoneInfo.zone}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <span className={`text-xs font-mono font-bold ${zoneInfo.color}`}>{zoneInfo.label}</span>
            </motion.div>

            {/* SVG chart */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
                    {yTicks.map(v => (
                        <g key={v}>
                            <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                            <text x={PAD.l - 4} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{v}</text>
                        </g>
                    ))}
                    <text x={PAD.l - 4} y={PAD.t - 2} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">Loss</text>
                    <text x={W / 2} y={H - 2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">Training Step</text>

                    <polyline
                        points={pts}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={2}
                        strokeLinejoin="round"
                        opacity={0.85}
                    />
                </svg>
            </div>

            {/* ── Zone explanation card ── */}
            <motion.div
                key={zoneInfo.zone + sigma.toFixed(2)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border p-3 space-y-2"
                style={{
                    borderColor: zoneExplanation.hex + "25",
                    backgroundColor: zoneExplanation.hex + "08",
                }}
            >
                <p className="text-[10px] font-mono font-bold" style={{ color: zoneExplanation.hex }}>
                    {zoneExplanation.title}
                </p>
                <div className="space-y-1.5 text-[8px] font-mono text-white/25 leading-relaxed">
                    <p><span className="text-white/35 font-bold">What happens:</span> {zoneExplanation.what}</p>
                    <p><span className="text-white/35 font-bold">Why:</span> {zoneExplanation.why}</p>
                    <p><span className="text-white/35 font-bold">Result:</span> {zoneExplanation.result}</p>
                </div>
            </motion.div>
        </div>
    );
}
