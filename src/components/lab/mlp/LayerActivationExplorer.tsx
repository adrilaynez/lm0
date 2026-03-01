"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  LayerActivationExplorer
  Per-layer activation heatmaps showing how activations change through depth.
  Uses illustrative data — simulates what activation patterns look like at each layer.
*/

const LAYERS_DATA = [
    {
        label: "Layer 1",
        desc: "Detects basic character patterns",
        activations: [0.8, -0.3, 0.6, 0.1, -0.9, 0.4, -0.2, 0.7, 0.5, -0.6, 0.3, -0.1, 0.9, -0.4, 0.2, 0.6],
    },
    {
        label: "Layer 2",
        desc: "Combines patterns into features",
        activations: [0.5, 0.7, -0.8, 0.2, 0.1, -0.5, 0.9, -0.3, 0.4, 0.6, -0.7, 0.1, -0.2, 0.8, -0.4, 0.3],
    },
    {
        label: "Layer 3",
        desc: "Saturated — many values near ±1",
        activations: [0.99, -0.97, 0.98, -0.95, 0.01, -0.99, 0.96, 0.02, -0.98, 0.97, -0.01, 0.99, -0.96, 0.03, 0.98, -0.97],
    },
];

export function LayerActivationExplorer() {
    const [selectedLayer, setSelectedLayer] = useState(0);
    const layer = LAYERS_DATA[selectedLayer];

    const saturated = layer.activations.filter(v => Math.abs(v) > 0.9).length;
    const saturatedPct = ((saturated / layer.activations.length) * 100).toFixed(0);

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Layer tabs */}
            <div className="flex gap-2">
                {LAYERS_DATA.map((l, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedLayer(i)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold text-center transition-all border ${
                            i === selectedLayer
                                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.02] border-white/[0.06] text-white/20"
                        }`}
                    >
                        {l.label}
                    </button>
                ))}
            </div>

            {/* Activation heatmap */}
            <motion.div
                key={selectedLayer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
            >
                <p className="text-xs text-white/40">{layer.desc}</p>
                <div className="grid grid-cols-8 gap-1">
                    {layer.activations.map((v, i) => (
                        <div
                            key={i}
                            className="aspect-square rounded-md flex items-center justify-center text-[8px] font-mono font-bold border border-white/[0.06]"
                            style={{
                                backgroundColor: v > 0
                                    ? `rgba(16, 185, 129, ${Math.abs(v) * 0.4})`
                                    : `rgba(244, 63, 94, ${Math.abs(v) * 0.4})`,
                                color: Math.abs(v) > 0.5 ? (v > 0 ? "rgb(110, 231, 183)" : "rgb(251, 113, 133)") : "rgba(255,255,255,0.2)",
                            }}
                        >
                            {v.toFixed(1)}
                        </div>
                    ))}
                </div>

                {/* Stats */}
                <div className="flex gap-3 text-[10px] font-mono">
                    <span className="text-white/30">Mean: <span className="text-white/50">{(layer.activations.reduce((a, b) => a + b, 0) / layer.activations.length).toFixed(2)}</span></span>
                    <span className="text-white/30">Std: <span className="text-white/50">{Math.sqrt(layer.activations.reduce((a, b) => a + b * b, 0) / layer.activations.length).toFixed(2)}</span></span>
                    <span className={`${saturated > 8 ? "text-amber-400" : "text-white/30"}`}>
                        Saturated: <span className="font-bold">{saturatedPct}%</span>
                    </span>
                </div>

                {selectedLayer === 2 && (
                    <p className="text-[10px] text-amber-400/60 text-center mt-2">
                        ⚠ {saturatedPct}% of neurons are saturated (|tanh(x)| {">"} 0.9). Gradients here are nearly zero!
                    </p>
                )}
            </motion.div>
        </div>
    );
}
