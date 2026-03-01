"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  DimensionalityScaleVisualizer
  Slider from context=1 to context=20. Shows input vector size and
  weight matrix size exploding with one-hot encoding.
  Also shows the embedding alternative for comparison.
*/

const V = 27; // character vocab size

function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

interface MetricCardProps {
    label: string;
    value: string;
    sub: string;
    color: string;
    pct: number; // 0-100 for bar width
}

function MetricCard({ label, value, sub, color, pct }: MetricCardProps) {
    return (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 flex-1 min-w-[140px]">
            <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color }}>
                {label}
            </p>
            <motion.p
                key={value}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-mono font-bold text-white tabular-nums"
            >
                {value}
            </motion.p>
            <p className="text-[9px] text-white/25 font-mono mb-2">{sub}</p>
            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
    );
}

export function DimensionalityScaleVisualizer() {
    const [contextSize, setContextSize] = useState(3);
    const hiddenSize = 64;

    const metrics = useMemo(() => {
        const oneHotInput = contextSize * V;
        const oneHotW1 = oneHotInput * hiddenSize;
        const embDim = 10;
        const embInput = contextSize * embDim;
        const embW1 = embInput * hiddenSize;
        const embMatrix = V * embDim;

        return {
            oneHotInput,
            oneHotW1,
            embInput,
            embW1,
            embMatrix,
            embTotal: embW1 + embMatrix,
        };
    }, [contextSize]);

    // Max values for bars (at context=20)
    const maxOneHotW1 = 20 * V * hiddenSize;

    return (
        <div className="p-4 sm:p-5 space-y-5">
            {/* Context size slider */}
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest shrink-0">
                    Context window
                </span>
                <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={contextSize}
                    onChange={e => setContextSize(Number(e.target.value))}
                    className="flex-1 accent-violet-500 cursor-pointer"
                    aria-label="Context window size"
                />
                <motion.span
                    key={contextSize}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-mono font-bold text-violet-300 w-8 text-right"
                >
                    {contextSize}
                </motion.span>
            </div>

            {/* One-hot metrics */}
            <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-rose-400/60 mb-2">
                    One-Hot Encoding
                </p>
                <div className="flex gap-3 flex-wrap">
                    <MetricCard
                        label="Input dims"
                        value={fmt(metrics.oneHotInput)}
                        sub={`${contextSize} × ${V}`}
                        color="#f43f5e"
                        pct={(metrics.oneHotInput / (20 * V)) * 100}
                    />
                    <MetricCard
                        label="W₁ parameters"
                        value={fmt(metrics.oneHotW1)}
                        sub={`${fmt(metrics.oneHotInput)} × ${hiddenSize}`}
                        color="#f43f5e"
                        pct={(metrics.oneHotW1 / maxOneHotW1) * 100}
                    />
                </div>
            </div>

            {/* Embedding metrics */}
            <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/60 mb-2">
                    With Embeddings (D=10)
                </p>
                <div className="flex gap-3 flex-wrap">
                    <MetricCard
                        label="Input dims"
                        value={fmt(metrics.embInput)}
                        sub={`${contextSize} × 10`}
                        color="#34d399"
                        pct={(metrics.embInput / (20 * V)) * 100}
                    />
                    <MetricCard
                        label="W₁ + E params"
                        value={fmt(metrics.embTotal)}
                        sub={`${fmt(metrics.embW1)} + ${fmt(metrics.embMatrix)}`}
                        color="#34d399"
                        pct={(metrics.embTotal / maxOneHotW1) * 100}
                    />
                </div>
            </div>

            {/* Ratio callout */}
            <motion.div
                key={contextSize}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center rounded-lg border border-violet-500/[0.15] bg-violet-500/[0.04] p-3"
            >
                <span className="text-[10px] font-mono text-white/30">One-hot W₁ is </span>
                <span className="text-sm font-mono font-bold text-violet-300">
                    {(metrics.oneHotW1 / metrics.embTotal).toFixed(1)}×
                </span>
                <span className="text-[10px] font-mono text-white/30"> larger than embedding approach</span>
            </motion.div>

            {/* Visual scale comparison */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-rose-400/50 w-14 shrink-0">One-hot</span>
                    <div className="flex-1 h-4 bg-white/[0.03] rounded overflow-hidden">
                        <motion.div
                            className="h-full bg-rose-500/30 rounded"
                            animate={{ width: `${(metrics.oneHotW1 / maxOneHotW1) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <span className="text-[9px] font-mono text-white/25 w-12 text-right">{fmt(metrics.oneHotW1)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-emerald-400/50 w-14 shrink-0">Embed</span>
                    <div className="flex-1 h-4 bg-white/[0.03] rounded overflow-hidden">
                        <motion.div
                            className="h-full bg-emerald-500/30 rounded"
                            animate={{ width: `${(metrics.embTotal / maxOneHotW1) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <span className="text-[9px] font-mono text-white/25 w-12 text-right">{fmt(metrics.embTotal)}</span>
                </div>
            </div>
        </div>
    );
}
