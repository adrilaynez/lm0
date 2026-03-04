"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  DimensionalityScaleVisualizer
  Slider from context=1 to context=20. Shows input vector size and
  weight matrix size exploding with one-hot encoding.
  Focuses purely on the dimensionality explosion problem — embeddings
  are introduced later in §02.
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
    warn?: boolean;
}

function MetricCard({ label, value, sub, color, pct, warn }: MetricCardProps) {
    return (
        <div className={`rounded-lg border bg-white/[0.02] p-3 flex-1 min-w-[140px] transition-colors ${warn ? "border-rose-500/30" : "border-white/[0.08]"}`}>
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

        return {
            oneHotInput,
            oneHotW1,
        };
    }, [contextSize]);

    // Max values for bars (at context=20)
    const maxOneHotW1 = 20 * V * hiddenSize;
    const isExplosive = contextSize >= 8;
    const isCritical = contextSize >= 15;

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
                <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 transition-colors ${isCritical ? "text-rose-400" : "text-rose-400/60"}`}>
                    One-Hot Encoding {isCritical ? "⚠️" : ""}
                </p>
                <div className="flex gap-3 flex-wrap">
                    <MetricCard
                        label="Input dims"
                        value={fmt(metrics.oneHotInput)}
                        sub={`${contextSize} × ${V}`}
                        color="#f43f5e"
                        pct={(metrics.oneHotInput / (20 * V)) * 100}
                        warn={isExplosive}
                    />
                    <MetricCard
                        label="W₁ parameters"
                        value={fmt(metrics.oneHotW1)}
                        sub={`${fmt(metrics.oneHotInput)} × ${hiddenSize}`}
                        color="#f43f5e"
                        pct={(metrics.oneHotW1 / maxOneHotW1) * 100}
                        warn={isExplosive}
                    />
                </div>
            </div>

            {/* Visual scale bar */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-rose-400/50 w-20 shrink-0">W₁ params</span>
                    <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden">
                        <motion.div
                            className={`h-full rounded ${isCritical ? "bg-rose-500/50" : "bg-rose-500/30"}`}
                            animate={{ width: `${(metrics.oneHotW1 / maxOneHotW1) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                    <span className="text-[9px] font-mono text-white/25 w-12 text-right">{fmt(metrics.oneHotW1)}</span>
                </div>
            </div>

            {/* Escalating warning callout */}
            <motion.div
                key={contextSize}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center rounded-lg border p-3 transition-colors ${isCritical
                        ? "border-rose-500/30 bg-rose-500/[0.06]"
                        : isExplosive
                            ? "border-amber-500/20 bg-amber-500/[0.04]"
                            : "border-violet-500/[0.15] bg-violet-500/[0.04]"
                    }`}
            >
                {isCritical ? (
                    <p className="text-[11px] font-mono text-rose-300/80">
                        🚨 <span className="font-bold">{fmt(metrics.oneHotW1)}</span> parameters just for the first layer!
                        {" "}This approach clearly doesn&apos;t scale.
                    </p>
                ) : isExplosive ? (
                    <p className="text-[11px] font-mono text-amber-300/70">
                        ⚠️ Already <span className="font-bold">{fmt(metrics.oneHotW1)}</span> parameters — and we only have {V} characters.
                        {" "}Imagine a real vocabulary of 50,000+ words…
                    </p>
                ) : (
                    <p className="text-[11px] font-mono text-white/40">
                        With context={contextSize}: <span className="font-bold text-violet-300">{metrics.oneHotInput}</span> input dimensions
                        {" "}→ <span className="font-bold text-violet-300">{fmt(metrics.oneHotW1)}</span> W₁ parameters.
                        {" "}Try sliding right…
                    </p>
                )}
            </motion.div>
        </div>
    );
}
