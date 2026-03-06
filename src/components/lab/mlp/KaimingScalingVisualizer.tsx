"use client";

import { useMemo, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  KaimingScalingVisualizer — REBUILT
  Vertical variance bars per layer. Toggle Naive vs Kaiming mode.
  Slider: neurons per layer (16-256). Animated transitions.
  Green = healthy variance (0.5-2.0), red = unhealthy.
*/

const NUM_LAYERS = 6;

function simulateVariance(N: number, useKaiming: boolean): number[] {
    const variances: number[] = [1.0];
    for (let i = 1; i <= NUM_LAYERS; i++) {
        const prev = variances[i - 1];
        if (useKaiming) {
            // Kaiming: Var(w) = 2/N → each layer preserves variance
            // With tanh (gain ≈ 5/3): factor ≈ 1.0 per layer
            variances.push(prev * (0.98 + Math.random() * 0.04)); // ~1.0 with tiny jitter
        } else {
            // Naive σ=1: Var(w)=1, output var = N * Var(w) * input_var
            // The factor per layer is N * 1 * tanh_gain² ≈ N * 0.67
            const factor = N * 0.67;
            variances.push(prev * factor);
        }
    }
    return variances;
}

function barColor(v: number): string {
    if (v >= 0.5 && v <= 2.0) return "#22c55e"; // green — healthy
    if (v > 2.0 && v <= 10) return "#f59e0b";   // amber — drifting
    return "#ef4444";                             // red — exploding/dead
}

function formatVar(v: number): string {
    if (v >= 1e6) return v.toExponential(1);
    if (v >= 100) return Math.round(v).toLocaleString();
    if (v >= 10) return v.toFixed(1);
    return v.toFixed(2);
}

export function KaimingScalingVisualizer() {
    const [N, setN] = useState(64);
    const [mode, setMode] = useState<"naive" | "kaiming">("naive");

    const variances = useMemo(() => simulateVariance(N, mode === "kaiming"), [N, mode]);

    const sigmaLabel = mode === "kaiming"
        ? `σ = √(2/${N}) ≈ ${Math.sqrt(2 / N).toFixed(3)}`
        : "σ = 1.0";

    // Max bar height = 120px, scale relative to max variance (capped for display)
    const maxDisplay = Math.min(Math.max(...variances), 1e6);
    const logMax = Math.log10(Math.max(maxDisplay, 2));

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Controls row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Mode toggle */}
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                    <button
                        onClick={() => setMode("naive")}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all ${mode === "naive"
                            ? "bg-red-500/20 text-red-400 border-r border-white/10"
                            : "bg-white/[0.02] text-white/30 border-r border-white/10 hover:text-white/50"
                            }`}
                    >
                        Naive (σ=1)
                    </button>
                    <button
                        onClick={() => setMode("kaiming")}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all ${mode === "kaiming"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/[0.02] text-white/30 hover:text-white/50"
                            }`}
                    >
                        Kaiming (σ=√(2/N))
                    </button>
                </div>

                {/* Neurons slider */}
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-[9px] font-mono text-white/25 shrink-0">N =</span>
                    <input
                        type="range" min={16} max={256} step={16} value={N}
                        onChange={e => setN(+e.target.value)}
                        className="flex-1 h-1 accent-violet-500 bg-white/10 rounded-full"
                    />
                    <span className="text-[11px] font-mono font-bold text-violet-400 min-w-[2.5rem] text-right">
                        {N}
                    </span>
                </div>
            </div>

            {/* σ value */}
            <div className="text-center text-[10px] font-mono text-white/30">
                Weight std: <span className={mode === "kaiming" ? "text-emerald-400" : "text-red-400"}>{sigmaLabel}</span>
            </div>

            {/* Variance bars */}
            <div className="flex items-end justify-center gap-2 sm:gap-3 h-[140px] px-2">
                <AnimatePresence mode="wait">
                    {variances.map((v, i) => {
                        const clampedLog = Math.log10(Math.max(v, 0.01));
                        const barH = Math.max(4, Math.min(130, (clampedLog / logMax) * 120 + 10));
                        const color = barColor(v);
                        const isExploding = v > 10;

                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                                {/* Variance value */}
                                <motion.span
                                    key={`${mode}-${N}-${i}`}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[8px] font-mono font-bold"
                                    style={{ color }}
                                >
                                    {formatVar(v)}
                                </motion.span>

                                {/* Bar */}
                                <motion.div
                                    key={`bar-${mode}-${N}-${i}`}
                                    initial={{ height: 4 }}
                                    animate={{
                                        height: barH,
                                        backgroundColor: `${color}30`,
                                        borderColor: `${color}50`,
                                    }}
                                    transition={{ duration: 0.5, delay: i * 0.06 }}
                                    className="w-8 sm:w-10 rounded-t-md border border-b-0 relative overflow-hidden"
                                >
                                    {/* Inner glow */}
                                    <motion.div
                                        className="absolute inset-x-0 bottom-0 rounded-t-md"
                                        animate={{
                                            height: "100%",
                                            backgroundColor: `${color}20`,
                                        }}
                                        transition={{ duration: 0.5 }}
                                    />

                                    {/* Pulse for exploding values */}
                                    {isExploding && mode === "naive" && (
                                        <motion.div
                                            className="absolute inset-0 rounded-t-md"
                                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            style={{ backgroundColor: color }}
                                        />
                                    )}
                                </motion.div>

                                {/* Layer label */}
                                <span className="text-[8px] font-mono text-white/20">
                                    {i === 0 ? "In" : `L${i}`}
                                </span>
                            </div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Healthy zone reference */}
            <div className="flex items-center justify-center gap-4 text-[8px] font-mono text-white/20">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e60" }} />
                    Healthy (0.5–2.0)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b60" }} />
                    Drifting (2–10)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ef444460" }} />
                    Exploding ({">"}10)
                </span>
            </div>

            {/* Explanation card */}
            <motion.div
                key={`${mode}-${N}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-3 space-y-1.5"
                style={{
                    borderColor: mode === "kaiming" ? "#22c55e20" : "#ef444420",
                    backgroundColor: mode === "kaiming" ? "#22c55e08" : "#ef444408",
                }}
            >
                <p className="text-[9px] font-mono font-bold" style={{ color: mode === "kaiming" ? "#22c55e" : "#ef4444" }}>
                    {mode === "kaiming"
                        ? `✓ Variance stays at ~1.0 across all ${NUM_LAYERS} layers`
                        : `✗ Layer ${NUM_LAYERS} variance: ${formatVar(variances[NUM_LAYERS])}× the input`
                    }
                </p>
                <p className="text-[8px] font-mono text-white/25 leading-relaxed">
                    {mode === "kaiming"
                        ? `Each weight is drawn from σ = √(2/${N}) ≈ ${Math.sqrt(2 / N).toFixed(3)}. The factor 2/N exactly compensates for the summation of N inputs, keeping variance at ~1.0 per layer. No matter how deep the network, activations stay in the healthy range.`
                        : `Each layer multiplies variance by ~${(N * 0.67).toFixed(0)}× (= N × tanh gain²). After ${NUM_LAYERS} layers: ${formatVar(variances[NUM_LAYERS])}. ${variances[NUM_LAYERS] > 1000 ? "Activations are astronomically large — every neuron is saturated at ±1, gradient ≈ 0." : "Activations are growing dangerously — neurons are starting to saturate."}`
                    }
                </p>
            </motion.div>
        </div>
    );
}
