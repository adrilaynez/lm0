"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ResidualHighwayVisual
  Animated highway metaphor: data flows through the main road (f(x))
  but also has a highway bypass (skip connection). Signal always gets through.
  Toggle between y=f(x) and y=x+f(x) to see the difference.
*/

const W = 360;
const H = 140;

const LAYERS = 4;
const LAYER_X = [40, 120, 200, 280, 340]; // 4 layers + output
const LAYER_Y = 70;

// Simulated signal strength through each layer
function getSignalStrength(layer: number, useResidual: boolean): number {
    if (useResidual) return Math.max(0.6, 1 - layer * 0.05); // stays healthy
    return Math.max(0.05, 1 - layer * 0.25); // degrades fast
}

export function ResidualHighwayVisual() {
    const [useResidual, setUseResidual] = useState(false);
    const [animKey, setAnimKey] = useState(0);

    const toggle = () => {
        setUseResidual(prev => !prev);
        setAnimKey(k => k + 1);
    };

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={toggle}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-all"
                    style={{
                        backgroundColor: useResidual ? "#22c55e15" : "#ef444415",
                        borderColor: useResidual ? "#22c55e30" : "#ef444430",
                        color: useResidual ? "#22c55e" : "#ef4444",
                    }}
                >
                    {useResidual ? "y = x + f(x)" : "y = f(x)"}
                </button>
                <span className="text-[8px] font-mono text-white/20">
                    {useResidual ? "Skip connection ON — signal always gets through" : "No skip — signal degrades at each toll booth"}
                </span>
            </div>

            {/* Visual */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Main road (bottom path) */}
                    {LAYERS.toString() && Array.from({ length: LAYERS }).map((_, i) => {
                        const x1 = LAYER_X[i];
                        const x2 = LAYER_X[i + 1];
                        const signal = getSignalStrength(i, useResidual);
                        return (
                            <g key={`road-${i}`}>
                                {/* Road segment */}
                                <motion.line
                                    x1={x1 + 20} y1={LAYER_Y} x2={x2 - 20} y2={LAYER_Y}
                                    stroke={useResidual ? "#22c55e" : "#ef4444"}
                                    animate={{ strokeOpacity: signal * 0.5 }}
                                    strokeWidth={3}
                                    transition={{ duration: 0.5 }}
                                />

                                {/* Layer box (toll booth) */}
                                <motion.rect
                                    x={x1 - 16} y={LAYER_Y - 16} width={32} height={32} rx={6}
                                    fill="white" fillOpacity={0.03}
                                    animate={{
                                        stroke: useResidual ? "#22c55e" : signal > 0.3 ? "#a78bfa" : "#ef4444",
                                        strokeOpacity: signal * 0.4,
                                    }}
                                    strokeWidth={1.5}
                                    transition={{ duration: 0.5 }}
                                />

                                {/* f(x) label */}
                                <text x={x1} y={LAYER_Y + 3} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.3} fontFamily="monospace">
                                    f{i + 1}(x)
                                </text>

                                {/* Signal bar below */}
                                <rect
                                    x={x1 - 12} y={LAYER_Y + 22} width={24} height={3} rx={1.5}
                                    fill="white" fillOpacity={0.05}
                                />
                                <motion.rect
                                    x={x1 - 12} y={LAYER_Y + 22}
                                    height={3} rx={1.5}
                                    fill={signal > 0.5 ? "#22c55e" : signal > 0.2 ? "#f59e0b" : "#ef4444"}
                                    animate={{ width: signal * 24, fillOpacity: signal * 0.8 }}
                                    transition={{ duration: 0.5 }}
                                />
                            </g>
                        );
                    })}

                    {/* Skip connections (highway bypass) */}
                    {useResidual && Array.from({ length: LAYERS }).map((_, i) => {
                        const x1 = LAYER_X[i] + 20;
                        const x2 = LAYER_X[i + 1] - 20;
                        const midX = (x1 + x2) / 2;
                        const curveY = LAYER_Y - 35;
                        return (
                            <motion.path
                                key={`skip-${i}`}
                                d={`M${x1},${LAYER_Y} Q${midX},${curveY} ${x2},${LAYER_Y}`}
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth={1.5}
                                strokeDasharray="4,3"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.4 }}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                            />
                        );
                    })}

                    {/* Highway label */}
                    {useResidual && (
                        <motion.text
                            x={W / 2} y={28}
                            textAnchor="middle" fontSize={6} fill="#22c55e" fillOpacity={0.4} fontFamily="monospace"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                            skip connections — original signal always passes through
                        </motion.text>
                    )}

                    {/* Input / Output labels */}
                    <text x={LAYER_X[0] - 25} y={LAYER_Y + 3} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">x</text>
                    <text x={LAYER_X[LAYERS] + 15} y={LAYER_Y + 3} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">ŷ</text>

                    {/* Signal strength labels */}
                    {Array.from({ length: LAYERS }).map((_, i) => {
                        const signal = getSignalStrength(i, useResidual);
                        return (
                            <motion.text
                                key={`sig-${i}`}
                                x={LAYER_X[i]} y={LAYER_Y + 34}
                                textAnchor="middle" fontSize={6} fontFamily="monospace" fontWeight="bold"
                                animate={{
                                    fill: signal > 0.5 ? "#22c55e" : signal > 0.2 ? "#f59e0b" : "#ef4444",
                                    fillOpacity: 0.5,
                                }}
                                transition={{ duration: 0.5 }}
                            >
                                {(signal * 100).toFixed(0)}%
                            </motion.text>
                        );
                    })}
                </svg>
            </div>

            {/* Description */}
            <p className="text-[9px] font-mono text-white/25 text-center">
                {useResidual
                    ? "Each layer adds its contribution: y = x + f(x). Even if f(x) learns nothing, the original signal x passes through untouched."
                    : "Each layer replaces the signal: y = f(x). If a layer is weak, the signal degrades — and there's no recovery."
                }
            </p>
        </div>
    );
}
