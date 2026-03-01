"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ActivationDriftVisualizer
  Shows how activation distributions shift without batch normalization vs. stabilize with it.
  Toggle between "Without BN" and "With BN" to see the effect on layer distributions over training steps.
*/

// Simulated activation distributions at different training steps
const STEPS_LABELS = ["Step 0", "Step 1K", "Step 10K", "Step 50K"];

// Without BN: distributions drift and widen unpredictably
const WITHOUT_BN = [
    { mean: 0.0, std: 0.5, label: "Centered" },
    { mean: 0.3, std: 0.8, label: "Drifting right" },
    { mean: -0.5, std: 1.2, label: "Drifting left, wider" },
    { mean: 0.7, std: 1.5, label: "Unstable" },
];

// With BN: distributions stay centered and consistent
const WITH_BN = [
    { mean: 0.0, std: 0.5, label: "Centered" },
    { mean: 0.02, std: 0.52, label: "Stable" },
    { mean: -0.01, std: 0.48, label: "Stable" },
    { mean: 0.03, std: 0.51, label: "Stable" },
];

function gaussianBins(mean: number, std: number, bins: number = 20): number[] {
    const result: number[] = [];
    for (let i = 0; i < bins; i++) {
        const x = -3 + (i / (bins - 1)) * 6;
        const val = Math.exp(-0.5 * Math.pow((x - mean) / std, 2)) / (std * Math.sqrt(2 * Math.PI));
        result.push(val);
    }
    return result;
}

export function ActivationDriftVisualizer() {
    const [useBN, setUseBN] = useState(false);
    const [stepIdx, setStepIdx] = useState(0);

    const data = useBN ? WITH_BN : WITHOUT_BN;
    const current = data[stepIdx];
    const bins = gaussianBins(current.mean, current.std);
    const maxBin = Math.max(...bins);

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Toggle */}
            <div className="flex gap-2 justify-center">
                <button
                    onClick={() => setUseBN(false)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                        !useBN ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-white/[0.02] border-white/[0.06] text-white/20"
                    }`}
                >
                    Without Batch Norm
                </button>
                <button
                    onClick={() => setUseBN(true)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                        useBN ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/[0.02] border-white/[0.06] text-white/20"
                    }`}
                >
                    With Batch Norm
                </button>
            </div>

            {/* Step selector */}
            <div className="flex gap-1">
                {STEPS_LABELS.map((label, i) => (
                    <button
                        key={i}
                        onClick={() => setStepIdx(i)}
                        className={`flex-1 py-1.5 rounded-md text-[9px] font-mono text-center transition-all border ${
                            i === stepIdx
                                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.02] border-white/[0.06] text-white/20"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Histogram */}
            <motion.div
                key={`${useBN}-${stepIdx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-end gap-[2px] h-28 px-2"
            >
                {bins.map((val, i) => {
                    const height = (val / maxBin) * 100;
                    return (
                        <motion.div
                            key={i}
                            className={`flex-1 rounded-t-sm ${useBN ? "bg-emerald-500/30" : "bg-rose-500/30"}`}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 0.3, delay: i * 0.01 }}
                        />
                    );
                })}
            </motion.div>

            {/* Stats */}
            <div className="flex justify-between text-[9px] font-mono px-2">
                <span className="text-white/20">−3σ</span>
                <span className="text-white/20">0</span>
                <span className="text-white/20">+3σ</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[7px] font-mono text-white/20">MEAN</p>
                    <p className={`text-sm font-mono font-bold ${Math.abs(current.mean) > 0.3 ? "text-rose-400" : "text-emerald-400"}`}>
                        {current.mean.toFixed(2)}
                    </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[7px] font-mono text-white/20">STD</p>
                    <p className={`text-sm font-mono font-bold ${current.std > 1.0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {current.std.toFixed(2)}
                    </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[7px] font-mono text-white/20">STATUS</p>
                    <p className={`text-[10px] font-mono font-bold ${useBN || stepIdx === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {current.label}
                    </p>
                </div>
            </div>
        </div>
    );
}
