"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

/*
  ActivationHistogramVisualizer — v2
  Shows activation value distributions per layer in a deep tanh network.
  5 layers with stats: saturation %, mean, std, avg derivative.
  Highlights how activations pile up at ±1 in deeper layers.
*/

interface LayerData {
    label: string;
    hist: number[];
    satPct: number;     // % of values at |x| > 0.95
    mean: number;
    std: number;
    avgDeriv: number;   // average derivative across all activations
    status: "healthy" | "warning" | "critical";
}

// Deterministic histograms for 5 layers (20 bins from -1 to +1)
const LAYERS: LayerData[] = [
    {
        label: "Layer 1", status: "healthy",
        hist: [8, 12, 18, 24, 30, 36, 42, 46, 48, 46, 46, 48, 46, 42, 36, 30, 24, 18, 12, 8],
        satPct: 4, mean: 0.02, std: 0.41, avgDeriv: 0.83,
    },
    {
        label: "Layer 2", status: "healthy",
        hist: [14, 18, 22, 28, 32, 36, 40, 42, 40, 36, 36, 40, 42, 40, 36, 32, 28, 22, 18, 14],
        satPct: 8, mean: -0.01, std: 0.48, avgDeriv: 0.72,
    },
    {
        label: "Layer 3", status: "warning",
        hist: [30, 24, 16, 12, 10, 8, 8, 10, 14, 18, 18, 14, 10, 8, 8, 10, 12, 16, 24, 30],
        satPct: 28, mean: 0.03, std: 0.67, avgDeriv: 0.45,
    },
    {
        label: "Layer 4", status: "critical",
        hist: [55, 35, 14, 8, 5, 3, 3, 4, 6, 8, 8, 6, 4, 3, 3, 5, 8, 14, 35, 55],
        satPct: 52, mean: -0.02, std: 0.82, avgDeriv: 0.22,
    },
    {
        label: "Layer 5", status: "critical",
        hist: [90, 50, 10, 4, 2, 1, 1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 4, 10, 50, 90],
        satPct: 78, mean: 0.01, std: 0.94, avgDeriv: 0.08,
    },
];

const STATUS_STYLES: Record<string, { border: string; bg: string; text: string; barColor: string; edgeColor: string }> = {
    healthy: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.03]", text: "text-emerald-400", barColor: "#8b5cf660", edgeColor: "#8b5cf640" },
    warning: { border: "border-amber-500/20", bg: "bg-amber-500/[0.03]", text: "text-amber-400", barColor: "#a78bfa50", edgeColor: "#f59e0b60" },
    critical: { border: "border-rose-500/20", bg: "bg-rose-500/[0.03]", text: "text-rose-400", barColor: "#a78bfa30", edgeColor: "#f43f5e60" },
};

export function ActivationHistogramVisualizer() {
    const [layerIdx, setLayerIdx] = useState(0);
    const data = LAYERS[layerIdx];
    const maxCount = useMemo(() => Math.max(...data.hist), [data]);
    const style = STATUS_STYLES[data.status];

    // Compute derivative for each bin center
    const binDerivatives = useMemo(() =>
        data.hist.map((_, i) => {
            const binCenter = -1 + (i + 0.5) * (2 / data.hist.length);
            const t = Math.tanh(binCenter * 2); // scale to make it more visible
            return 1 - t * t;
        }),
        [data]);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* ── Layer selector ── */}
            <div className="flex gap-1.5">
                {LAYERS.map((l, i) => {
                    const s = STATUS_STYLES[l.status];
                    const active = i === layerIdx;
                    return (
                        <button
                            key={i}
                            onClick={() => setLayerIdx(i)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold text-center transition-all border ${active
                                    ? `${s.border} ${s.bg} ${s.text}`
                                    : "bg-white/[0.02] border-white/[0.06] text-white/20 hover:text-white/30"
                                }`}
                        >
                            {l.label}
                            {active && l.status === "critical" && <span className="ml-1 text-rose-400/60">⚠</span>}
                        </button>
                    );
                })}
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-4 gap-2">
                <div className={`rounded-lg border ${style.border} ${style.bg} p-2 text-center`}>
                    <p className="text-[7px] font-mono uppercase text-white/20">Saturated</p>
                    <p className={`text-lg font-mono font-black ${data.satPct > 40 ? "text-rose-400" : data.satPct > 15 ? "text-amber-400" : "text-emerald-400"}`}>
                        {data.satPct}%
                    </p>
                    <p className="text-[6px] font-mono text-white/15">|x| &gt; 0.95</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                    <p className="text-[7px] font-mono uppercase text-white/20">Mean</p>
                    <p className="text-lg font-mono font-black text-white/40">{data.mean.toFixed(2)}</p>
                    <p className="text-[6px] font-mono text-white/15">center</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                    <p className="text-[7px] font-mono uppercase text-white/20">Std Dev</p>
                    <p className={`text-lg font-mono font-black ${data.std > 0.8 ? "text-amber-400/70" : "text-white/40"}`}>{data.std.toFixed(2)}</p>
                    <p className="text-[6px] font-mono text-white/15">spread</p>
                </div>
                <div className={`rounded-lg border ${style.border} ${style.bg} p-2 text-center`}>
                    <p className="text-[7px] font-mono uppercase text-white/20">Avg Deriv</p>
                    <p className={`text-lg font-mono font-black ${data.avgDeriv < 0.2 ? "text-rose-400" : data.avgDeriv < 0.5 ? "text-amber-400" : "text-emerald-400"}`}>
                        {data.avgDeriv.toFixed(2)}
                    </p>
                    <p className="text-[6px] font-mono text-white/15">tanh&apos;</p>
                </div>
            </div>

            {/* ── Histogram ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                <motion.div
                    key={layerIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-end gap-[2px] h-36"
                >
                    {data.hist.map((count, i) => {
                        const height = (count / maxCount) * 100;
                        const binCenter = -1 + (i + 0.5) * (2 / data.hist.length);
                        const isEdge = Math.abs(binCenter) > 0.8;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                                <motion.div
                                    className="w-full rounded-t-sm cursor-default"
                                    style={{
                                        background: isEdge ? style.edgeColor : style.barColor,
                                    }}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ duration: 0.3, delay: i * 0.015 }}
                                />
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                                    <div className="bg-black/90 border border-white/10 rounded px-1.5 py-0.5 text-[7px] font-mono text-white/50 whitespace-nowrap">
                                        {binCenter.toFixed(1)} → {count} neurons
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>

                {/* X-axis */}
                <div className="flex justify-between mt-1.5 text-[8px] font-mono text-white/20">
                    <span>−1.0</span>
                    <span>−0.5</span>
                    <span>0.0</span>
                    <span>+0.5</span>
                    <span>+1.0</span>
                </div>

                {/* Saturation zone markers */}
                <div className="flex mt-1">
                    <div className="w-[10%] h-1 rounded-l bg-rose-500/20" />
                    <div className="flex-1 h-1 bg-transparent" />
                    <div className="w-[10%] h-1 rounded-r bg-rose-500/20" />
                </div>
                <div className="flex justify-between text-[6px] font-mono text-rose-400/30">
                    <span>← saturation</span>
                    <span>saturation →</span>
                </div>
            </div>

            {/* ── Progressive insight ── */}
            <motion.div
                key={layerIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-3 ${style.border} ${style.bg}`}
            >
                {data.status === "healthy" && (
                    <p className="text-[9px] font-mono text-emerald-400/60 leading-relaxed">
                        <span className="font-bold">Healthy distribution.</span> Activations are spread across the full range. Only {data.satPct}% are saturated. The average derivative is {data.avgDeriv.toFixed(2)} — gradients flow through this layer without significant loss. This layer is learning normally.
                    </p>
                )}
                {data.status === "warning" && (
                    <p className="text-[9px] font-mono text-amber-400/60 leading-relaxed">
                        <span className="font-bold">Starting to saturate.</span> {data.satPct}% of activations are at the edges (±1). The histogram is becoming bimodal — values are piling up at the limits instead of staying in the middle. Average derivative dropped to {data.avgDeriv.toFixed(2)}: learning is slowing down for this layer.
                    </p>
                )}
                {data.status === "critical" && (
                    <p className="text-[9px] font-mono text-rose-400/60 leading-relaxed">
                        <span className="font-bold">Heavily saturated!</span> {data.satPct}% of activations are stuck at ±1. The distribution is strongly bimodal — most neurons output either -1 or +1 with nothing in between. Average derivative is just {data.avgDeriv.toFixed(2)}: the gradient signal through this layer is {data.avgDeriv < 0.15 ? "essentially dead" : "severely weakened"}. Neurons behind this layer are starved of learning signal.
                    </p>
                )}
            </motion.div>

            {/* ── All-layers comparison mini-bars ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider mb-2">Saturation % Across All Layers</p>
                <div className="space-y-1.5">
                    {LAYERS.map((l, i) => {
                        const s = STATUS_STYLES[l.status];
                        const active = i === layerIdx;
                        return (
                            <button
                                key={i}
                                onClick={() => setLayerIdx(i)}
                                className="flex items-center gap-2 w-full text-left group"
                            >
                                <span className={`text-[9px] font-mono w-12 shrink-0 ${active ? `${s.text} font-bold` : "text-white/25"}`}>
                                    {l.label}
                                </span>
                                <div className="flex-1 h-3 rounded bg-white/[0.03] overflow-hidden">
                                    <motion.div
                                        className="h-full rounded"
                                        style={{
                                            background: l.satPct > 40 ? "#f43f5e60" : l.satPct > 15 ? "#f59e0b50" : "#22c55e40",
                                            border: active ? `1px solid ${l.satPct > 40 ? "#f43f5e" : l.satPct > 15 ? "#f59e0b" : "#22c55e"}40` : "none",
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${l.satPct}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.05 }}
                                    />
                                </div>
                                <span className={`text-[8px] font-mono w-8 text-right ${active ? s.text : "text-white/20"}`}>
                                    {l.satPct}%
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
