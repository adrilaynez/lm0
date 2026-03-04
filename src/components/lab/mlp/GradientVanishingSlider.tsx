"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  GradientVanishingSlider
  Slider: "Number of Hidden Layers" (1 to 10).
  Horizontal bar chart showing gradient magnitude per layer during backprop.
  Gradient factor ~0.7 per layer (realistic for tanh without good init).
*/

const GRADIENT_FACTOR = 0.7;

export function GradientVanishingSlider() {
    const [numLayers, setNumLayers] = useState(4);

    // Compute gradient magnitudes: output layer = 100%, each earlier layer *= factor
    const layers = Array.from({ length: numLayers }, (_, i) => {
        const depth = numLayers - 1 - i; // 0 for output, numLayers-1 for input
        const magnitude = Math.pow(GRADIENT_FACTOR, depth) * 100;
        return {
            label: i === 0 ? "Input" : i === numLayers - 1 ? "Output" : `Layer ${i}`,
            magnitude,
        };
    });

    // Reverse so output is on top (right), input at bottom (left) — show backprop direction
    const reversed = [...layers].reverse();

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Slider */}
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-white/40 shrink-0 w-28">
                    Hidden Layers
                </span>
                <input
                    type="range"
                    min={1}
                    max={10}
                    value={numLayers}
                    onChange={e => setNumLayers(Number(e.target.value))}
                    className="flex-1 accent-violet-500 cursor-pointer"
                />
                <span className="text-sm font-mono font-bold text-white/70 w-6 text-right tabular-nums">
                    {numLayers}
                </span>
            </div>

            {/* Bar chart */}
            <div className="space-y-1.5">
                {reversed.map((layer, i) => {
                    const pct = layer.magnitude;
                    // Fade from bright (high gradient) to dim (low gradient)
                    const opacity = Math.max(0.15, pct / 100);
                    const barColor = pct > 50
                        ? `rgba(139,92,246,${opacity})`   // violet
                        : pct > 15
                            ? `rgba(251,146,60,${opacity * 1.3})`  // amber
                            : `rgba(251,113,133,${opacity * 2})`;  // rose

                    return (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-white/30 w-14 text-right shrink-0 truncate">
                                {layer.label}
                            </span>
                            <div className="flex-1 h-5 rounded bg-white/[0.04] overflow-hidden">
                                <motion.div
                                    className="h-full rounded"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(1, pct)}%` }}
                                    transition={{ duration: 0.4, delay: i * 0.03 }}
                                    style={{ backgroundColor: barColor }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-white/40 w-12 text-right tabular-nums shrink-0">
                                {pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Direction label */}
            <div className="flex items-center justify-between text-[9px] font-mono text-white/20 px-16">
                <span>← backprop direction</span>
                <span>output →</span>
            </div>

            {/* Annotation */}
            <p className="text-[11px] text-white/30 text-center italic">
                {numLayers >= 5
                    ? `With ${numLayers} layers, the first layer receives only ${layers[0].magnitude.toFixed(1)}% of the gradient signal.`
                    : "The deeper the network, the quieter the learning signal."}
            </p>
        </div>
    );
}
