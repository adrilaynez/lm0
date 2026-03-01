"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  DepthExplorer
  Add 1-4 hidden layers and see how params, loss, and text quality change.
  Uses illustrative data since we don't have multi-layer configs in the grid for all depths.
*/

const DEPTH_CONFIGS = [
    { layers: 1, params: 2_431, loss: 2.12, quality: "Decent patterns, some real words", color: "emerald" },
    { layers: 2, params: 6_559, loss: 1.98, quality: "Better word boundaries, smoother text", color: "violet" },
    { layers: 3, params: 10_687, loss: 2.15, quality: "Sometimes good, sometimes training stalls", color: "amber" },
    { layers: 4, params: 14_815, loss: 2.45, quality: "Unstable training, often worse than 1 layer", color: "rose" },
];

export function DepthExplorer() {
    const [selectedDepth, setSelectedDepth] = useState(0);
    const config = DEPTH_CONFIGS[selectedDepth];

    return (
        <div className="p-5 sm:p-6 space-y-5">
            {/* Depth selector */}
            <div className="flex gap-2">
                {DEPTH_CONFIGS.map((c, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedDepth(i)}
                        className={`flex-1 py-3 rounded-xl border text-center transition-all ${
                            i === selectedDepth
                                ? `bg-${c.color}-500/10 border-${c.color}-500/30 text-${c.color}-400`
                                : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:bg-white/[0.04]"
                        }`}
                        style={i === selectedDepth ? {
                            backgroundColor: `rgba(${c.color === "emerald" ? "16,185,129" : c.color === "violet" ? "139,92,246" : c.color === "amber" ? "245,158,11" : "244,63,94"}, 0.1)`,
                            borderColor: `rgba(${c.color === "emerald" ? "16,185,129" : c.color === "violet" ? "139,92,246" : c.color === "amber" ? "245,158,11" : "244,63,94"}, 0.3)`,
                        } : {}}
                    >
                        <p className="text-2xl font-mono font-bold">{c.layers}</p>
                        <p className="text-[9px] font-mono mt-0.5">{c.layers === 1 ? "layer" : "layers"}</p>
                    </button>
                ))}
            </div>

            {/* Architecture visualization */}
            <div className="flex items-center justify-center gap-1 py-3">
                <Block label="Input" color="text-white/30" />
                <Arrow />
                <Block label="Embed" color="text-violet-400/60" />
                <Arrow />
                {Array.from({ length: config.layers }).map((_, i) => (
                    <span key={i} className="contents">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400"
                        >
                            H{i + 1}
                        </motion.div>
                        <Arrow />
                    </span>
                ))}
                <Block label="Output" color="text-rose-400/60" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <StatCard label="Parameters" value={config.params.toLocaleString()} />
                <StatCard label="Val Loss" value={config.loss.toFixed(2)} highlight={config.loss <= 2.0} />
                <StatCard label="Layers" value={String(config.layers)} />
            </div>

            {/* Quality description */}
            <motion.div
                key={selectedDepth}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
            >
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1">Generation Quality</p>
                <p className="text-sm text-white/50">{config.quality}</p>
            </motion.div>

            {config.layers >= 3 && (
                <p className="text-[10px] text-amber-400/50 text-center">
                    ⚠ With {config.layers} layers, training becomes unstable. Why?
                </p>
            )}
        </div>
    );
}

function Block({ label, color }: { label: string; color: string }) {
    return (
        <div className={`px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[9px] font-mono ${color}`}>
            {label}
        </div>
    );
}

function Arrow() {
    return <span className="text-white/10 text-xs mx-0.5">→</span>;
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <p className="text-[8px] font-mono uppercase tracking-widest text-white/20">{label}</p>
            <p className={`text-lg font-mono font-bold mt-1 ${highlight ? "text-emerald-400" : "text-white/50"}`}>{value}</p>
        </div>
    );
}
