"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  GradientProductSimulator
  Slider: multiplication factor × number of layers → log-scale magnitude.
  Shows how gradients vanish or explode through deep chains.
*/

export function GradientProductSimulator() {
    const [factor, setFactor] = useState(0.7);
    const [layers, setLayers] = useState(4);

    const product = Math.pow(factor, layers);
    const logProduct = Math.log10(Math.max(1e-15, product));

    const isVanishing = product < 0.01;
    const isExploding = product > 100;
    const isHealthy = !isVanishing && !isExploding;

    // Generate per-layer values
    const layerValues = Array.from({ length: layers }, (_, i) => Math.pow(factor, i + 1));

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Sliders */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="flex justify-between text-[9px] font-mono text-white/30 mb-1">
                        <span>Gradient factor per layer</span>
                        <span className={`font-bold ${factor < 1 ? "text-blue-400" : factor > 1 ? "text-rose-400" : "text-emerald-400"}`}>
                            {factor.toFixed(2)}×
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0.1}
                        max={2.0}
                        step={0.05}
                        value={factor}
                        onChange={e => setFactor(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                    />
                    <div className="flex justify-between text-[7px] text-white/15 mt-0.5">
                        <span>0.1 (vanish)</span>
                        <span>1.0</span>
                        <span>2.0 (explode)</span>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[9px] font-mono text-white/30 mb-1">
                        <span>Number of layers</span>
                        <span className="text-violet-400 font-bold">{layers}</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={layers}
                        onChange={e => setLayers(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                    />
                </div>
            </div>

            {/* Per-layer gradient bars */}
            <div className="space-y-1">
                <p className="text-[9px] font-mono text-white/25 mb-2">Gradient magnitude at each layer (backward)</p>
                {layerValues.map((val, i) => {
                    const barWidth = Math.min(100, Math.max(1, (Math.log10(Math.max(1e-10, val)) + 10) * 10));
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[8px] font-mono text-white/20 w-12">Layer {layers - i}</span>
                            <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${
                                        val < 0.01 ? "bg-blue-500/40" : val > 100 ? "bg-rose-500/40" : "bg-emerald-500/40"
                                    }`}
                                    animate={{ width: `${barWidth}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <span className="text-[8px] font-mono text-white/30 w-16 text-right">
                                {val < 0.001 ? val.toExponential(1) : val > 1000 ? val.toExponential(1) : val.toFixed(3)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Result */}
            <div className={`rounded-xl border p-4 text-center ${
                isVanishing ? "border-blue-500/20 bg-blue-500/5" :
                isExploding ? "border-rose-500/20 bg-rose-500/5" :
                "border-emerald-500/20 bg-emerald-500/5"
            }`}>
                <p className="text-[8px] font-mono uppercase tracking-widest text-white/20 mb-1">
                    Total gradient: {factor.toFixed(2)}^{layers}
                </p>
                <p className={`text-2xl font-mono font-bold ${
                    isVanishing ? "text-blue-400" : isExploding ? "text-rose-400" : "text-emerald-400"
                }`}>
                    {product < 0.001 ? product.toExponential(2) : product > 1000 ? product.toExponential(2) : product.toFixed(4)}
                </p>
                <p className={`text-[10px] mt-1 ${
                    isVanishing ? "text-blue-400/60" : isExploding ? "text-rose-400/60" : "text-emerald-400/60"
                }`}>
                    {isVanishing && "⚠ Vanishing gradient — early layers barely learn"}
                    {isExploding && "⚠ Exploding gradient — training diverges"}
                    {isHealthy && "✓ Healthy gradient flow"}
                </p>
            </div>
        </div>
    );
}
