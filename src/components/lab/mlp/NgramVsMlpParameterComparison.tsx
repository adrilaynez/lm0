"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  NgramVsMlpParameterComparison
  Compare parameter counts: N-gram table O(V^N) vs MLP (V×D + D×N×H + H×V).
  Interactive sliders for V, N, D, H.
*/

export function NgramVsMlpParameterComparison() {
    const [V, setV] = useState(27);
    const [N, setN] = useState(3);
    const [D, setD] = useState(10);
    const [H, setH] = useState(64);

    const ngramParams = Math.pow(V, N + 1);
    const embParams = V * D;
    const hiddenParams = (D * N) * H + H; // W1 + b1
    const outputParams = H * V + V; // W2 + b2
    const mlpTotal = embParams + hiddenParams + outputParams;

    const ratio = ngramParams / mlpTotal;
    const maxLog = Math.max(Math.log10(ngramParams), Math.log10(mlpTotal));

    return (
        <div className="p-5 sm:p-6 space-y-5">
            {/* Sliders */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SliderControl label="Vocab (V)" value={V} min={10} max={100} onChange={setV} />
                <SliderControl label="Context (N)" value={N} min={1} max={8} onChange={setN} />
                <SliderControl label="Emb Dim (D)" value={D} min={2} max={64} onChange={setD} />
                <SliderControl label="Hidden (H)" value={H} min={16} max={256} onChange={setH} />
            </div>

            {/* Comparison bars */}
            <div className="space-y-4">
                <BarRow
                    label="N-gram table"
                    formula={`V^(N+1) = ${V}^${N + 1}`}
                    count={ngramParams}
                    maxLog={maxLog}
                    color="rose"
                />
                <BarRow
                    label="MLP total"
                    formula={`E + W₁ + W₂`}
                    count={mlpTotal}
                    maxLog={maxLog}
                    color="emerald"
                />
            </div>

            {/* Breakdown */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-3">MLP Parameter Breakdown</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <p className="text-[9px] text-white/30">Embedding (V×D)</p>
                        <p className="text-sm font-mono font-bold text-violet-400">{embParams.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-white/30">Hidden (DN×H+H)</p>
                        <p className="text-sm font-mono font-bold text-blue-400">{hiddenParams.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-white/30">Output (H×V+V)</p>
                        <p className="text-sm font-mono font-bold text-emerald-400">{outputParams.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Ratio */}
            <div className="text-center">
                <p className="text-[10px] text-white/30">N-gram needs</p>
                <p className="text-xl font-mono font-bold text-amber-400">
                    {ratio >= 1000 ? `${(ratio / 1000).toFixed(0)}k` : ratio >= 1 ? `${ratio.toFixed(0)}` : `${(1/ratio).toFixed(0)}× fewer`}×
                </p>
                <p className="text-[10px] text-white/30">more parameters than MLP</p>
            </div>
        </div>
    );
}

function SliderControl({ label, value, min, max, onChange }: {
    label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex justify-between text-[9px] font-mono text-white/30 mb-1">
                <span>{label}</span>
                <span className="text-violet-400 font-bold">{value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
            />
        </div>
    );
}

function BarRow({ label, formula, count, maxLog, color }: {
    label: string; formula: string; count: number; maxLog: number; color: "rose" | "emerald";
}) {
    const pct = maxLog > 0 ? (Math.log10(Math.max(1, count)) / maxLog) * 100 : 0;
    const bgColor = color === "rose" ? "bg-rose-500/40" : "bg-emerald-500/40";
    const textColor = color === "rose" ? "text-rose-400" : "text-emerald-400";

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
                <span className="text-white/40">{label} <span className="text-white/20">({formula})</span></span>
                <span className={textColor}>{count >= 1e9 ? `${(count/1e9).toFixed(1)}B` : count >= 1e6 ? `${(count/1e6).toFixed(1)}M` : count >= 1e3 ? `${(count/1e3).toFixed(1)}K` : count.toLocaleString()}</span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${bgColor}`}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4 }}
                />
            </div>
        </div>
    );
}
