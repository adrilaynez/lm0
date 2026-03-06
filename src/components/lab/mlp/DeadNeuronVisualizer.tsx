"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Skull, Zap, ShieldAlert } from "lucide-react";

/*
  DeadNeuronVisualizer
  Shows how dead neurons accumulate in deep networks with tanh + random init.
  Uses pedagogical data based on real depth_comparison experiments:
  deeper networks → more saturated neurons → more "dead" neurons that output ±1
  and have derivative ≈ 0, blocking all gradient flow.

  The visualizer shows:
  1. A grid of neurons per layer, colored by health
  2. Dead neuron % per depth
  3. An explanation of WHY dead neurons matter
*/

/* ─── Pedagogical data derived from depth comparison experiments ─── */
interface DepthDeadData {
    layers: number;
    deadPct: number;       // % of neurons effectively dead (tanh' < 0.05)
    saturatedPct: number;  // % of neurons saturated (|tanh(x)| > 0.95)
    avgDerivative: number; // average tanh' across all neurons
    status: "healthy" | "struggling" | "dying" | "critical";
}

const DEPTH_DATA: DepthDeadData[] = [
    { layers: 1, deadPct: 0, saturatedPct: 3, avgDerivative: 0.85, status: "healthy" },
    { layers: 2, deadPct: 4, saturatedPct: 10, avgDerivative: 0.74, status: "healthy" },
    { layers: 3, deadPct: 10, saturatedPct: 22, avgDerivative: 0.60, status: "healthy" },
    { layers: 4, deadPct: 18, saturatedPct: 35, avgDerivative: 0.48, status: "struggling" },
    { layers: 6, deadPct: 35, saturatedPct: 52, avgDerivative: 0.30, status: "dying" },
    { layers: 8, deadPct: 45, saturatedPct: 62, avgDerivative: 0.22, status: "dying" },
    { layers: 10, deadPct: 55, saturatedPct: 70, avgDerivative: 0.16, status: "critical" },
    { layers: 12, deadPct: 65, saturatedPct: 78, avgDerivative: 0.11, status: "critical" },
    { layers: 16, deadPct: 78, saturatedPct: 88, avgDerivative: 0.06, status: "critical" },
    { layers: 20, deadPct: 88, saturatedPct: 94, avgDerivative: 0.03, status: "critical" },
];

const STATUS_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
    healthy: { border: "border-emerald-500/30", bg: "bg-emerald-500/[0.04]", text: "text-emerald-400", dot: "#22c55e" },
    struggling: { border: "border-amber-500/30", bg: "bg-amber-500/[0.04]", text: "text-amber-400", dot: "#f59e0b" },
    dying: { border: "border-orange-500/30", bg: "bg-orange-500/[0.04]", text: "text-orange-400", dot: "#f97316" },
    critical: { border: "border-red-500/30", bg: "bg-red-500/[0.04]", text: "text-red-400", dot: "#ef4444" },
};

const STATUS_LABELS: Record<string, string> = {
    healthy: "Mostly healthy",
    struggling: "Struggling",
    dying: "Dying",
    critical: "Critical",
};

/* ─── Generate neuron grid for a given depth ─── */
function generateNeuronGrid(depth: DepthDeadData, neuronsPerLayer: number = 8): boolean[][] {
    const grid: boolean[][] = [];
    for (let l = 0; l < depth.layers && l < 6; l++) {
        const layerFrac = l / Math.max(1, depth.layers - 1);
        // Dead neurons concentrate in deeper layers
        const layerDeadPct = depth.deadPct * (0.3 + 0.7 * layerFrac);
        const row: boolean[] = [];
        for (let n = 0; n < neuronsPerLayer; n++) {
            // Deterministic: use a simple hash to decide if dead
            const hash = ((l * 31 + n * 17 + depth.layers * 7) % 100);
            row.push(hash < layerDeadPct);
        }
        grid.push(row);
    }
    return grid;
}

export function DeadNeuronVisualizer() {
    const [selectedIdx, setSelectedIdx] = useState(4); // default to 6L
    const data = DEPTH_DATA[selectedIdx];
    const style = STATUS_COLORS[data.status];
    const NEURONS = 8;
    const grid = useMemo(() => generateNeuronGrid(data, NEURONS), [data]);
    const displayLayers = Math.min(data.layers, 6);
    const showTruncated = data.layers > 6;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* ── Depth selector ── */}
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider mr-2">Depth:</span>
                {DEPTH_DATA.map((d, i) => {
                    const s = STATUS_COLORS[d.status];
                    const active = i === selectedIdx;
                    return (
                        <button
                            key={d.layers}
                            onClick={() => setSelectedIdx(i)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${active
                                ? `${s.border} ${s.bg} ${s.text}`
                                : "border-white/[0.06] bg-white/[0.02] text-white/25 hover:text-white/40"
                                }`}
                        >
                            {d.layers}L
                        </button>
                    );
                })}
            </div>

            {/* ── Main panel: neuron grid + stats ── */}
            <div className="grid sm:grid-cols-2 gap-4">
                {/* Neuron grid */}
                <div className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-mono font-bold ${style.text}`}>
                            {data.layers}-Layer Network
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${style.bg} ${style.border} border ${style.text}`}>
                            {STATUS_LABELS[data.status]}
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        {grid.map((row, l) => (
                            <motion.div
                                key={l}
                                className="flex items-center gap-1"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: l * 0.05 }}
                            >
                                <span className="text-[7px] font-mono text-white/15 w-5 shrink-0 text-right">
                                    L{l + 1}
                                </span>
                                <div className="flex gap-1">
                                    {row.map((isDead, n) => (
                                        <motion.div
                                            key={n}
                                            className={`w-5 h-5 rounded-md border flex items-center justify-center text-[6px] font-mono ${isDead
                                                ? "border-red-500/30 bg-red-500/20"
                                                : "border-emerald-500/20 bg-emerald-500/10"
                                                }`}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: l * 0.05 + n * 0.02 }}
                                        >
                                            {isDead ? (
                                                <span className="text-red-400/70">✗</span>
                                            ) : (
                                                <span className="text-emerald-400/50">·</span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                        {showTruncated && (
                            <div className="flex items-center gap-1 text-[7px] font-mono text-white/15">
                                <span className="w-5" />
                                <span>... +{data.layers - 6} more layers</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-[7px] font-mono text-white/20">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-sm bg-emerald-500/30 border border-emerald-500/20" /> alive
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-sm bg-red-500/30 border border-red-500/20" /> dead (tanh&apos; ≈ 0)
                        </span>
                    </div>
                </div>

                {/* Stats panel */}
                <div className="space-y-3">
                    {/* Dead neurons % */}
                    <div className={`rounded-xl border ${style.border} ${style.bg} p-3`}>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Skull className={`w-3.5 h-3.5 ${style.text}`} style={{ opacity: 0.7 }} />
                            <span className="text-[10px] font-mono font-bold text-white/40">Dead Neurons</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <motion.span
                                key={data.deadPct}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className={`text-3xl font-mono font-black ${style.text}`}
                            >
                                {data.deadPct}%
                            </motion.span>
                            <span className="text-[9px] font-mono text-white/20 mb-1">
                                of all neurons
                            </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: style.dot }}
                                initial={{ width: 0 }}
                                animate={{ width: `${data.deadPct}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Saturated + derivative */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.02] p-2.5">
                            <div className="flex items-center gap-1 mb-1">
                                <ShieldAlert className="w-3 h-3 text-amber-400/50" />
                                <span className="text-[8px] font-mono text-amber-400/50">Saturated</span>
                            </div>
                            <p className={`text-lg font-mono font-black ${data.saturatedPct > 60 ? "text-amber-400" : "text-amber-400/60"}`}>
                                {data.saturatedPct}%
                            </p>
                            <p className="text-[7px] font-mono text-white/15">|tanh(x)| &gt; 0.95</p>
                        </div>

                        <div className="rounded-lg border border-violet-500/15 bg-violet-500/[0.02] p-2.5">
                            <div className="flex items-center gap-1 mb-1">
                                <Zap className="w-3 h-3 text-violet-400/50" />
                                <span className="text-[8px] font-mono text-violet-400/50">Avg Derivative</span>
                            </div>
                            <p className={`text-lg font-mono font-black ${data.avgDerivative < 0.2 ? "text-red-400" : data.avgDerivative < 0.4 ? "text-amber-400" : "text-violet-400/70"}`}>
                                {data.avgDerivative.toFixed(2)}
                            </p>
                            <p className="text-[7px] font-mono text-white/15">tanh&apos;(x) mean</p>
                        </div>
                    </div>

                    {/* Interpretation */}
                    <motion.div
                        key={selectedIdx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-lg border p-2.5 ${style.border} ${style.bg}`}
                    >
                        <p className={`text-[9px] font-mono leading-relaxed ${style.text}`} style={{ opacity: 0.7 }}>
                            {data.status === "healthy" && data.deadPct === 0 && (
                                <>Zero dead neurons. With just 1 layer, there&apos;s no depth to cause saturation cascades. Every neuron contributes — and this model has the BEST val_loss of all 10 depths.</>
                            )}
                            {data.status === "healthy" && data.deadPct > 0 && (
                                <>Only {data.deadPct}% of neurons are dead. The network is shallow enough that gradients flow through without major issues. Most neurons contribute to learning.</>
                            )}
                            {data.status === "struggling" && (
                                <>Nearly 1 in 5 neurons is dead. The deeper layers are starting to saturate — their outputs are stuck at ±1. Learning is slowing down for these neurons.</>
                            )}
                            {data.status === "dying" && (
                                <>{data.deadPct}% dead neurons means the gradient signal is severely degraded. The early layers barely receive any learning signal. The network is wasting {data.deadPct}% of its capacity.</>
                            )}
                            {data.status === "critical" && (
                                <>{data.deadPct}% of all neurons are dead — the network is barely learning. Only {100 - data.deadPct}% of its {data.layers * NEURONS} neurons actually contribute. The rest are frozen forever at ±1.</>
                            )}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* ── Bottom bar chart: dead % across all depths ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">Dead Neuron % vs Depth</span>
                <div className="flex items-end gap-2 mt-3 h-20">
                    {DEPTH_DATA.map((d, i) => {
                        const s = STATUS_COLORS[d.status];
                        const active = i === selectedIdx;
                        return (
                            <button
                                key={d.layers}
                                onClick={() => setSelectedIdx(i)}
                                className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                            >
                                <span className={`text-[7px] font-mono font-bold ${active ? s.text : "text-white/20"}`}>
                                    {d.deadPct}%
                                </span>
                                <motion.div
                                    className="w-full rounded-t-md"
                                    style={{
                                        background: active ? s.dot : `${s.dot}40`,
                                        border: active ? `1px solid ${s.dot}60` : "1px solid transparent",
                                    }}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(d.deadPct / 100) * 64}px` }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                />
                                <span className={`text-[8px] font-mono ${active ? "text-white/50 font-bold" : "text-white/20"}`}>
                                    {d.layers}L
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Key insight ── */}
            <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.03] p-3 space-y-1.5">
                <p className="text-[10px] font-mono font-bold text-rose-400/70">Why Dead Neurons Are Permanent</p>
                <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                    When tanh saturates at ±1, its derivative is essentially <span className="text-white/50 font-bold">zero</span>.
                    Zero derivative × any gradient = <span className="text-white/50 font-bold">zero update</span>.
                    The neuron&apos;s weights never change. It&apos;s <span className="text-rose-400/60 font-bold">frozen forever</span> — it will NEVER recover, never learn again.
                    Every dead neuron is wasted capacity that the network paid for (in parameters and compute) but gets nothing back.
                </p>
                <p className="text-[9px] font-mono text-white/20 leading-relaxed">
                    Worse: a dead neuron in an early layer blocks gradient flow for ALL neurons behind it.
                    One dead neuron can kill the learning signal for an entire downstream chain. This is why deeper networks
                    don&apos;t just have more dead neurons — they have <span className="text-white/40 font-bold">cascading</span> dead neurons.
                </p>
            </div>
        </div>
    );
}
