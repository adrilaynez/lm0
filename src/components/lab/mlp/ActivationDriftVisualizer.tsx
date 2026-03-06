"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ActivationDriftVisualizer
  Shows ONLY the problem: how activation distributions drift during training
  without any normalization. No BN toggle — just the drift getting worse.
  Now with: dead neuron counts, tanh curve overlay, layer-by-layer stats,
  richer explanations, and clearer zone annotations.
*/

const NUM_NEURONS = 128;
const NUM_LAYERS = 4;
const TOTAL_NEURONS = NUM_NEURONS * NUM_LAYERS;

const STEPS = [
    {
        label: "Step 0", mean: 0.0, std: 0.5, status: "Healthy",
        deadNeurons: 5, avgGrad: 0.045,
        desc: "Kaiming initialization: activations centered at 0 with narrow spread (σ=0.5). All neurons are in tanh's linear zone — each one contributes to learning. This is the ideal starting point.",
        detail: "Gradient is strong (0.045 avg). Every weight update is meaningful.",
        color: "#22c55e",
    },
    {
        label: "Step 1K", mean: 0.3, std: 0.7, status: "Drifting",
        deadNeurons: 18, avgGrad: 0.032,
        desc: "After 1,000 weight updates, the mean has shifted to +0.3. The distribution is widening — some activations are approaching the tanh dead zone. 18 neurons are now saturated.",
        detail: "Gradient weakened by 29%. The network is spending capacity correcting the drift instead of learning patterns.",
        color: "#f59e0b",
    },
    {
        label: "Step 5K", mean: -0.4, std: 1.0, status: "Unstable",
        deadNeurons: 65, avgGrad: 0.018,
        desc: "The mean has swung to −0.4 and std doubled to 1.0. The distribution now extends well into both dead zones. 65 neurons are saturated — they can't learn.",
        detail: "Gradient is 60% weaker than start. 13% of all neurons are dead. The network is wobbling — each layer's update destabilizes the next.",
        color: "#f97316",
    },
    {
        label: "Step 10K", mean: 0.6, std: 1.3, status: "Chaotic",
        deadNeurons: 142, avgGrad: 0.008,
        desc: "Mean jumped to +0.6, std expanded to 1.3 (2.6× original). Over a quarter of all neurons are saturated. The carefully calibrated Kaiming initialization is completely gone.",
        detail: "28% of neurons are dead. Gradient is 82% weaker. Deep layers receive almost no learning signal — they're frozen.",
        color: "#ef4444",
    },
    {
        label: "Step 50K", mean: 0.8, std: 1.6, status: "Saturated",
        deadNeurons: 210, avgGrad: 0.003,
        desc: "Activations are spread across the entire range. 41% of neurons are permanently saturated in tanh's flat zones. The gradient is essentially zero for most of the network.",
        detail: "Only 302 of 512 neurons are still learning. The rest are dead weight — consuming computation but contributing nothing. This is internal covariate shift.",
        color: "#dc2626",
    },
];

const NUM_BINS = 30;

function gaussianBins(mean: number, std: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < NUM_BINS; i++) {
        const x = -4 + (i / (NUM_BINS - 1)) * 8;
        const val = Math.exp(-0.5 * Math.pow((x - mean) / std, 2)) / (std * Math.sqrt(2 * Math.PI));
        result.push(val);
    }
    return result;
}

export function ActivationDriftVisualizer() {
    const [stepIdx, setStepIdx] = useState(0);

    const current = STEPS[stepIdx];
    const bins = gaussianBins(current.mean, current.std);
    const maxBin = Math.max(...bins);

    // Calculate % in dead zone
    const deadZonePct = (1 - (
        0.5 * (1 + erf((1.5 - current.mean) / (current.std * Math.SQRT2))) -
        0.5 * (1 + erf((-1.5 - current.mean) / (current.std * Math.SQRT2)))
    )) * 100;

    const aliveNeurons = TOTAL_NEURONS - current.deadNeurons;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Step selector */}
            <div className="flex gap-1">
                {STEPS.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setStepIdx(i)}
                        className={`flex-1 py-1.5 rounded-md text-[9px] font-mono text-center transition-all border ${i === stepIdx
                            ? ""
                            : "bg-white/[0.02] border-white/[0.06] text-white/20 hover:text-white/40"
                            }`}
                        style={i === stepIdx ? {
                            borderColor: s.color + "60",
                            backgroundColor: s.color + "15",
                            color: s.color,
                        } : undefined}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Histogram with tanh curve */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
                <div className="relative">
                    {/* Zone labels */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                        <div className="relative w-full h-full">
                            <span className="absolute text-[6px] font-mono text-red-400/30 top-0" style={{ left: "6%" }}>
                                DEAD ZONE
                            </span>
                            <span className="absolute text-[6px] font-mono text-emerald-400/25 top-0" style={{ left: "38%" }}>
                                HEALTHY ZONE
                            </span>
                            <span className="absolute text-[6px] font-mono text-red-400/30 top-0" style={{ right: "5%" }}>
                                DEAD ZONE
                            </span>
                        </div>
                    </div>

                    {/* Dead zone background */}
                    <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="w-full h-full relative">
                            <div className="absolute left-0 top-0 bottom-0 bg-red-500/[0.06] border-r border-red-500/10" style={{ width: `${((4 - 1.5) / 8) * 100}%` }} />
                            <div className="absolute right-0 top-0 bottom-0 bg-red-500/[0.06] border-l border-red-500/10" style={{ width: `${((4 - 1.5) / 8) * 100}%` }} />
                        </div>
                    </div>

                    {/* Tanh curve overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 300 112" preserveAspectRatio="none">
                        <path
                            d={Array.from({ length: 100 }, (_, i) => {
                                const x = -4 + (i / 99) * 8;
                                const y = Math.tanh(x);
                                const sx = (i / 99) * 300;
                                const sy = 56 - y * 40;
                                return `${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`;
                            }).join(" ")}
                            fill="none"
                            stroke="white"
                            strokeOpacity={0.06}
                            strokeWidth={1.5}
                        />
                    </svg>

                    {/* Histogram bars */}
                    <motion.div
                        key={stepIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-end gap-[2px] h-28 px-0.5 relative z-10"
                    >
                        {bins.map((val, i) => {
                            const height = (val / maxBin) * 100;
                            const x = -4 + (i / (bins.length - 1)) * 8;
                            const inDeadZone = Math.abs(x) > 1.5;
                            return (
                                <motion.div
                                    key={i}
                                    className="flex-1 rounded-t-sm"
                                    style={{
                                        backgroundColor: inDeadZone ? "#ef444450" : current.color + "50",
                                    }}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ duration: 0.3, delay: i * 0.01 }}
                                />
                            );
                        })}
                    </motion.div>
                </div>

                {/* Axis labels */}
                <div className="flex justify-between text-[7px] font-mono px-0.5 mt-1">
                    <span className="text-red-400/30">−4</span>
                    <span className="text-red-400/25">−1.5</span>
                    <span className="text-white/25">0</span>
                    <span className="text-red-400/25">+1.5</span>
                    <span className="text-red-400/30">+4</span>
                </div>
                <p className="text-[6px] font-mono text-white/10 text-center mt-0.5">
                    activation value → tanh output. |x| {">"} 1.5: tanh ≈ ±1, gradient ≈ 0 (neuron dead)
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-5 gap-1.5 text-center">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5">
                    <p className="text-[6px] font-mono text-white/15">MEAN (μ)</p>
                    <p className="text-sm font-mono font-bold" style={{ color: Math.abs(current.mean) > 0.2 ? current.color : "#22c55e" }}>
                        {current.mean > 0 ? "+" : ""}{current.mean.toFixed(2)}
                    </p>
                    <p className="text-[5px] font-mono text-white/10">target: 0</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5">
                    <p className="text-[6px] font-mono text-white/15">STD (σ)</p>
                    <p className="text-sm font-mono font-bold" style={{ color: current.std > 0.8 ? current.color : "#22c55e" }}>
                        {current.std.toFixed(2)}
                    </p>
                    <p className="text-[5px] font-mono text-white/10">{(current.std / 0.5).toFixed(1)}× init</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5">
                    <p className="text-[6px] font-mono text-white/15">IN DEAD ZONE</p>
                    <p className="text-sm font-mono font-bold" style={{ color: deadZonePct > 20 ? "#ef4444" : deadZonePct > 5 ? "#f59e0b" : "#22c55e" }}>
                        {deadZonePct.toFixed(0)}%
                    </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5">
                    <p className="text-[6px] font-mono text-white/15">DEAD NEURONS</p>
                    <p className="text-sm font-mono font-bold" style={{ color: current.deadNeurons > 100 ? "#ef4444" : current.deadNeurons > 30 ? "#f59e0b" : "#22c55e" }}>
                        {current.deadNeurons}
                    </p>
                    <p className="text-[5px] font-mono text-white/10">of {TOTAL_NEURONS}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5">
                    <p className="text-[6px] font-mono text-white/15">AVG GRADIENT</p>
                    <p className="text-[10px] font-mono font-bold" style={{ color: current.avgGrad > 0.02 ? "#22c55e" : current.avgGrad > 0.005 ? "#f59e0b" : "#ef4444" }}>
                        {current.avgGrad.toFixed(3)}
                    </p>
                    <p className="text-[5px] font-mono text-white/10">
                        {((current.avgGrad / 0.045) * 100).toFixed(0)}% of init
                    </p>
                </div>
            </div>

            {/* Alive/dead neuron bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[7px] font-mono">
                    <span className="text-emerald-400/50">{aliveNeurons} alive</span>
                    <span className="text-white/15">{NUM_LAYERS} layers × {NUM_NEURONS} neurons = {TOTAL_NEURONS}</span>
                    <span className="text-red-400/50">{current.deadNeurons} dead</span>
                </div>
                <div className="h-2 bg-red-500/15 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500/40 rounded-full"
                        animate={{ width: `${(aliveNeurons / TOTAL_NEURONS) * 100}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>
            </div>

            {/* Explanation card */}
            <motion.div
                key={`desc-${stepIdx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-3 space-y-1.5"
                style={{ borderColor: current.color + "20", backgroundColor: current.color + "08" }}
            >
                <p className="text-[9px] font-mono font-bold" style={{ color: current.color }}>
                    {current.status}: {current.label}
                </p>
                <p className="text-[8px] font-mono leading-relaxed" style={{ color: current.color + "aa" }}>
                    {current.desc}
                </p>
                <p className="text-[7px] font-mono text-white/20 leading-relaxed">
                    {current.detail}
                </p>
            </motion.div>
        </div>
    );
}

// Error function approximation
function erf(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}
