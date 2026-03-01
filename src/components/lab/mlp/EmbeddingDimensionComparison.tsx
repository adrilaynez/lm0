"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  EmbeddingDimensionComparison
  Compare loss curves for different embedding dimensions (2, 4, 10, 32).
  Uses illustrative data matching real grid patterns.
*/

const CONFIGS = [
    { dim: 2, finalLoss: 2.45, color: "rose", curveData: [3.3, 3.1, 2.9, 2.7, 2.6, 2.55, 2.5, 2.48, 2.46, 2.45] },
    { dim: 4, finalLoss: 2.25, color: "amber", curveData: [3.3, 2.9, 2.7, 2.5, 2.4, 2.35, 2.3, 2.27, 2.26, 2.25] },
    { dim: 10, finalLoss: 2.05, color: "emerald", curveData: [3.3, 2.8, 2.5, 2.3, 2.2, 2.15, 2.1, 2.07, 2.06, 2.05] },
    { dim: 32, finalLoss: 2.02, color: "violet", curveData: [3.3, 2.7, 2.4, 2.2, 2.12, 2.08, 2.05, 2.03, 2.02, 2.02] },
];

export function EmbeddingDimensionComparison() {
    const [selected, setSelected] = useState<number[]>([0, 1, 2, 3]);

    const toggle = (i: number) => {
        setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    };

    const W = 300;
    const H = 140;
    const pad = 30;
    const toX = (i: number) => pad + (i / 9) * (W - 2 * pad);
    const toY = (v: number) => pad + ((3.5 - v) / (3.5 - 1.8)) * (H - 2 * pad);

    const colorMap: Record<string, string> = {
        rose: "rgb(244,63,94)", amber: "rgb(245,158,11)", emerald: "rgb(16,185,129)", violet: "rgb(139,92,246)",
    };

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Toggle buttons */}
            <div className="flex gap-2 flex-wrap">
                {CONFIGS.map((c, i) => (
                    <button
                        key={c.dim}
                        onClick={() => toggle(i)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                            selected.includes(i)
                                ? `bg-${c.color}-500/10 border-${c.color}-500/30 text-${c.color}-400`
                                : "bg-white/[0.02] border-white/[0.06] text-white/15 line-through"
                        }`}
                        style={selected.includes(i) ? {
                            backgroundColor: `${colorMap[c.color]}15`,
                            borderColor: `${colorMap[c.color]}40`,
                            color: colorMap[c.color],
                        } : {}}
                    >
                        D={c.dim}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="flex justify-center">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md">
                    {[2.0, 2.5, 3.0, 3.5].map(v => (
                        <g key={v}>
                            <line x1={pad} y1={toY(v)} x2={W - pad} y2={toY(v)} stroke="rgba(255,255,255,0.04)" />
                            <text x={pad - 3} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="7" fontFamily="monospace">{v.toFixed(1)}</text>
                        </g>
                    ))}
                    {CONFIGS.map((c, ci) => selected.includes(ci) && (
                        <polyline
                            key={c.dim}
                            points={c.curveData.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
                            fill="none"
                            stroke={colorMap[c.color]}
                            strokeWidth="2"
                            opacity="0.8"
                        />
                    ))}
                    {CONFIGS.map((c, ci) => selected.includes(ci) && (
                        <circle key={`dot-${c.dim}`} cx={toX(9)} cy={toY(c.finalLoss)} r="3" fill={colorMap[c.color]} />
                    ))}
                    <text x={W / 2} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace">Training steps →</text>
                </svg>
            </div>

            {/* Final loss comparison */}
            <div className="grid grid-cols-4 gap-2">
                {CONFIGS.map((c, i) => (
                    <div key={c.dim} className={`rounded-lg border p-2 text-center transition-opacity ${
                        selected.includes(i) ? "border-white/[0.08] bg-white/[0.02]" : "opacity-30"
                    }`}>
                        <p className="text-[8px] font-mono text-white/20">D={c.dim}</p>
                        <p className="text-sm font-mono font-bold" style={{ color: colorMap[c.color] }}>{c.finalLoss.toFixed(2)}</p>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-white/20 text-center">
                Going from D=2 to D=10 gives a big improvement. D=32 barely helps further — diminishing returns.
            </p>
        </div>
    );
}
