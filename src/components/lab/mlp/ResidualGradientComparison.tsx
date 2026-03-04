"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ResidualGradientComparison
  Side-by-side 4-layer network:
    Left: y=f(x) with vanishing gradient bars
    Right: y=x+f(x) with healthy gradient bars
  Shows exactly why residuals fix vanishing gradients.
*/

const LAYERS = 4;

function gradientMagnitude(layer: number, useResidual: boolean): number {
    // layer 0 = closest to output (full gradient), layer 3 = closest to input
    const depth = layer;
    if (useResidual) {
        // Residual: gradient = 1 + f'(x) per layer → stays near 1
        return Math.max(0.7, 1 - depth * 0.05);
    }
    // Vanilla: gradient = f'(x) per layer ≈ 0.3^depth
    return Math.pow(0.35, depth);
}

const BAR_MAX_W = 80;
const ROW_H = 28;

function NetworkColumn({ label, useResidual, accentColor }: {
    label: string;
    useResidual: boolean;
    accentColor: string;
}) {
    return (
        <div className="flex-1 space-y-1.5">
            <p className="text-[9px] font-mono font-bold text-center" style={{ color: accentColor }}>
                {label}
            </p>
            <div className="space-y-0.5">
                {Array.from({ length: LAYERS }).map((_, i) => {
                    const layerIdx = LAYERS - 1 - i; // reverse: output first, input last
                    const grad = gradientMagnitude(layerIdx, useResidual);
                    const barW = Math.max(2, grad * BAR_MAX_W);
                    const pct = (grad * 100).toFixed(1);

                    return (
                        <div key={i} className="flex items-center gap-1.5" style={{ height: ROW_H }}>
                            <span className="text-[7px] font-mono text-white/15 w-8 text-right shrink-0">
                                L{i + 1}
                            </span>
                            <div className="flex-1 h-3 rounded bg-white/[0.03] relative overflow-hidden">
                                <motion.div
                                    className="h-full rounded"
                                    style={{ backgroundColor: accentColor }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(barW / BAR_MAX_W) * 100}%`, opacity: Math.max(0.2, grad) }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                />
                            </div>
                            <motion.span
                                className="text-[7px] font-mono font-bold w-10 shrink-0"
                                style={{ color: accentColor }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: grad < 0.1 ? 0.4 : 0.7 }}
                                transition={{ delay: i * 0.1 + 0.3 }}
                            >
                                {grad < 0.01 ? grad.toFixed(3) : `${pct}%`}
                            </motion.span>
                        </div>
                    );
                })}
            </div>
            {/* Arrow showing gradient direction */}
            <div className="flex items-center justify-center gap-1 text-[7px] font-mono text-white/15">
                <span>output</span>
                <span>→</span>
                <span>input</span>
                <span className="text-white/10">(gradient direction)</span>
            </div>
        </div>
    );
}

export function ResidualGradientComparison() {
    const [animKey, setAnimKey] = useState(0);

    return (
        <div className="p-4 sm:p-5 space-y-3">
            <div className="flex gap-3" key={animKey}>
                <NetworkColumn label="y = f(x)" useResidual={false} accentColor="#ef4444" />
                <div className="w-px bg-white/[0.06] self-stretch" />
                <NetworkColumn label="y = x + f(x)" useResidual={true} accentColor="#22c55e" />
            </div>

            {/* Explanation */}
            <div className="grid grid-cols-2 gap-3 text-[8px] font-mono text-white/20">
                <p className="text-center">
                    Without skip: gradient at Layer 1 is <span className="text-red-400 font-bold">{(gradientMagnitude(3, false) * 100).toFixed(1)}%</span> — barely learning.
                </p>
                <p className="text-center">
                    With skip: gradient at Layer 1 is <span className="text-emerald-400 font-bold">{(gradientMagnitude(3, true) * 100).toFixed(0)}%</span> — healthy signal throughout.
                </p>
            </div>

            <p className="text-[8px] font-mono text-white/15 text-center">
                The skip connection adds a direct path for gradients: ∂(x+f(x))/∂x = 1 + f&apos;(x). Even if f&apos;(x) ≈ 0, the gradient is at least 1.
            </p>
        </div>
    );
}
