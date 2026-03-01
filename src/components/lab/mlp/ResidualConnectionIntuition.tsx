"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ResidualConnectionIntuition
  Brief visual: x + f(x) vs f(x) alone.
  Shows how residual connections ensure gradient flow even when f(x) is weak.
  Seeds the Transformer narrative.
*/

export function ResidualConnectionIntuition() {
    const [useResidual, setUseResidual] = useState(false);

    // Simulated signal through 4 layers
    const signal = [1.0];
    const factor = 0.3; // Each layer attenuates by this much
    for (let i = 0; i < 4; i++) {
        const prev = signal[signal.length - 1];
        if (useResidual) {
            signal.push(prev + prev * factor * (0.5 + Math.random() * 0.2)); // x + f(x)
        } else {
            signal.push(prev * factor); // just f(x)
        }
    }
    // Normalize for display
    const maxSignal = Math.max(...signal);

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Toggle */}
            <div className="flex gap-2 justify-center">
                <button
                    onClick={() => setUseResidual(false)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                        !useResidual ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-white/[0.02] border-white/[0.06] text-white/20"
                    }`}
                >
                    y = f(x) only
                </button>
                <button
                    onClick={() => setUseResidual(true)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                        useResidual ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/[0.02] border-white/[0.06] text-white/20"
                    }`}
                >
                    y = x + f(x)
                </button>
            </div>

            {/* Signal flow visualization */}
            <div className="flex items-end justify-center gap-3 h-32">
                {signal.map((val, i) => {
                    const height = Math.max(3, (val / maxSignal) * 100);
                    return (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <motion.div
                                className={`w-10 rounded-t-md ${useResidual ? "bg-emerald-500/30" : "bg-rose-500/30"}`}
                                animate={{ height: `${height}%` }}
                                transition={{ duration: 0.4 }}
                                style={{ minHeight: 4 }}
                            />
                            <span className="text-[8px] font-mono text-white/20">
                                {i === 0 ? "Input" : `L${i}`}
                            </span>
                            <span className={`text-[8px] font-mono ${val < 0.05 ? "text-rose-400" : "text-white/30"}`}>
                                {val.toFixed(2)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Explanation */}
            <div className={`rounded-lg border p-3 text-center ${
                useResidual ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"
            }`}>
                {useResidual ? (
                    <p className="text-[10px] text-emerald-400/70">
                        With <span className="font-bold">y = x + f(x)</span>, the original signal always passes through.
                        Even if f(x) contributes nothing, the gradient has a direct path back to early layers.
                    </p>
                ) : (
                    <p className="text-[10px] text-rose-400/70">
                        With <span className="font-bold">y = f(x)</span> only, each layer attenuates the signal.
                        After 4 layers, the original information is nearly gone — and so are the gradients.
                    </p>
                )}
            </div>

            <p className="text-[9px] text-white/20 text-center">
                This &quot;skip connection&quot; idea, introduced by He et al. (2015), is the foundation of Transformers.
            </p>
        </div>
    );
}
