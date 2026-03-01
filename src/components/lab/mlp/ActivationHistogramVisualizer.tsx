"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ActivationHistogramVisualizer
  Shows activation value distributions per layer — reveals how values pile up at ±1 (saturation) in deeper layers.
  Client-side only with illustrative data.
*/

function generateHistogram(layer: number): number[] {
    // Layer 1: roughly uniform/gaussian spread
    // Layer 2: starting to concentrate at edges
    // Layer 3: heavily bimodal at ±1
    const bins = 20; // from -1 to +1
    const counts = new Array(bins).fill(0);
    const n = 500;
    for (let i = 0; i < n; i++) {
        let val: number;
        if (layer === 0) {
            val = (Math.random() - 0.5) * 1.4; // wide spread
        } else if (layer === 1) {
            val = Math.random() < 0.3 ? (Math.random() > 0.5 ? 0.85 + Math.random() * 0.15 : -0.85 - Math.random() * 0.15) : (Math.random() - 0.5) * 1.2;
        } else {
            val = Math.random() < 0.7 ? (Math.random() > 0.5 ? 0.9 + Math.random() * 0.1 : -0.9 - Math.random() * 0.1) : (Math.random() - 0.5) * 0.4;
        }
        val = Math.max(-1, Math.min(1, val));
        const bin = Math.min(bins - 1, Math.floor((val + 1) / 2 * bins));
        counts[bin]++;
    }
    return counts;
}

// Pre-generate for determinism in SSR
const LAYER_HISTS = [0, 1, 2].map(l => {
    // Use a simple deterministic pseudo-histogram
    if (l === 0) return [15, 20, 25, 30, 35, 38, 40, 42, 40, 38, 38, 40, 42, 40, 38, 35, 30, 25, 20, 15];
    if (l === 1) return [35, 28, 18, 12, 10, 8, 8, 10, 12, 15, 15, 12, 10, 8, 8, 10, 12, 18, 28, 35];
    return [80, 45, 12, 5, 3, 2, 2, 3, 4, 5, 5, 4, 3, 2, 2, 3, 5, 12, 45, 80];
});

const LAYER_LABELS = [
    { label: "Layer 1", desc: "Healthy: activations spread across range", warning: false },
    { label: "Layer 2", desc: "Starting to concentrate at edges", warning: false },
    { label: "Layer 3", desc: "Saturated: most values at ±1", warning: true },
];

export function ActivationHistogramVisualizer() {
    const [layer, setLayer] = useState(0);
    const hist = LAYER_HISTS[layer];
    const maxCount = Math.max(...hist);
    const info = LAYER_LABELS[layer];

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Layer selector */}
            <div className="flex gap-2">
                {LAYER_LABELS.map((l, i) => (
                    <button
                        key={i}
                        onClick={() => setLayer(i)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold text-center transition-all border ${
                            i === layer
                                ? i === 2 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.02] border-white/[0.06] text-white/20"
                        }`}
                    >
                        {l.label}
                    </button>
                ))}
            </div>

            <p className={`text-xs ${info.warning ? "text-amber-400/60" : "text-white/40"}`}>
                {info.warning && "⚠ "}{info.desc}
            </p>

            {/* Histogram */}
            <motion.div
                key={layer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-end gap-[2px] h-32 px-2"
            >
                {hist.map((count, i) => {
                    const height = (count / maxCount) * 100;
                    const binCenter = -1 + (i + 0.5) * (2 / hist.length);
                    const isEdge = Math.abs(binCenter) > 0.8;
                    return (
                        <motion.div
                            key={i}
                            className={`flex-1 rounded-t-sm ${
                                isEdge && layer === 2
                                    ? "bg-amber-500/40"
                                    : isEdge && layer === 1
                                    ? "bg-amber-500/20"
                                    : "bg-violet-500/30"
                            }`}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 0.3, delay: i * 0.01 }}
                        />
                    );
                })}
            </motion.div>

            {/* X-axis labels */}
            <div className="flex justify-between px-2 text-[8px] font-mono text-white/20">
                <span>-1.0</span>
                <span>-0.5</span>
                <span>0.0</span>
                <span>+0.5</span>
                <span>+1.0</span>
            </div>

            {layer === 2 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-[10px] text-amber-400/70">
                        When tanh outputs are at ±1, the derivative is nearly 0. Gradients flowing backward through this layer get multiplied by ~0, effectively killing the learning signal.
                    </p>
                </div>
            )}
        </div>
    );
}
