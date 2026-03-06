"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Database, TrendingUp, AlertTriangle } from "lucide-react";

/**
 * DataSizeExperiment
 * Shows how dataset size affects model performance.
 * Same architecture (H=256, L=4, ctx=8) trained on 100K→1.7M chars with SGD.
 * 
 * Fetches from /api/v1/mlp/data-size, falls back to hardcoded data.
 */

interface DataSizeModel {
    label: string;
    config: {
        hidden_size: number;
        num_layers: number;
        context_size: number;
        emb_dim: number;
        learning_rate: number;
        optimizer_type: string;
    };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    diverged: boolean;
    generated_samples?: string[];
}

interface DataPoint {
    label: string;
    chars: string;
    charsNum: number;
    model: DataSizeModel;
    trainLoss: number;
    valLoss: number;
    gap: number;
}

const SIZE_META: Record<string, { chars: string; charsNum: number; color: string }> = {
    "datasize_100K": { chars: "100K", charsNum: 100_000, color: "#3b82f6" },
    "datasize_300K": { chars: "300K", charsNum: 300_000, color: "#22c55e" },
    "datasize_500K": { chars: "500K", charsNum: 500_000, color: "#f59e0b" },
    "datasize_1M": { chars: "1M", charsNum: 1_000_000, color: "#ef4444" },
    "datasize_1.7M": { chars: "1.7M", charsNum: 1_700_000, color: "#a855f7" },
};

const FALLBACK: DataSizeModel[] = [
    { label: "datasize_100K", config: { hidden_size: 256, num_layers: 4, context_size: 8, emb_dim: 16, learning_rate: 0.001, optimizer_type: "sgd" }, final_train_loss: 1.857, final_val_loss: 1.942, total_params: 273116, diverged: false },
    { label: "datasize_300K", config: { hidden_size: 256, num_layers: 4, context_size: 8, emb_dim: 16, learning_rate: 0.001, optimizer_type: "sgd" }, final_train_loss: 1.925, final_val_loss: 1.987, total_params: 273116, diverged: false },
    { label: "datasize_500K", config: { hidden_size: 256, num_layers: 4, context_size: 8, emb_dim: 16, learning_rate: 0.001, optimizer_type: "sgd" }, final_train_loss: 1.934, final_val_loss: 2.126, total_params: 273116, diverged: false },
    { label: "datasize_1M", config: { hidden_size: 256, num_layers: 4, context_size: 8, emb_dim: 16, learning_rate: 0.001, optimizer_type: "sgd" }, final_train_loss: 1.962, final_val_loss: 2.074, total_params: 273116, diverged: false },
    { label: "datasize_1.7M", config: { hidden_size: 256, num_layers: 4, context_size: 8, emb_dim: 16, learning_rate: 0.001, optimizer_type: "sgd" }, final_train_loss: 2.193, final_val_loss: 2.367, total_params: 273116, diverged: false },
];

export function DataSizeExperiment() {
    const [models, setModels] = useState<DataSizeModel[]>(FALLBACK);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/v1/mlp/data-size")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.models?.length) setModels(d.models); })
            .catch(() => {});
    }, []);

    const data: DataPoint[] = useMemo(() => {
        return models
            .map(m => {
                const meta = SIZE_META[m.label];
                if (!meta) return null;
                return {
                    label: m.label,
                    chars: meta.chars,
                    charsNum: meta.charsNum,
                    model: m,
                    trainLoss: m.final_train_loss,
                    valLoss: m.final_val_loss,
                    gap: m.final_val_loss - m.final_train_loss,
                };
            })
            .filter(Boolean)
            .sort((a, b) => a!.charsNum - b!.charsNum) as DataPoint[];
    }, [models]);

    const minLoss = Math.min(...data.map(d => d.trainLoss)) * 0.95;
    const maxLoss = Math.max(...data.map(d => d.valLoss)) * 1.05;
    const lossRange = maxLoss - minLoss || 0.1;
    const chartH = 180;

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-4 space-y-4 font-mono text-[10px]">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-bold text-white/70">Data Size Impact — Same Model, Different Data</span>
            </div>

            <div className="text-[8px] text-white/25">
                H=256 · L=4 · ctx=8 · emb=16 · SGD lr=0.001 · 100K steps · Kaiming + BN + Residual
            </div>

            {/* Chart */}
            <div className="relative bg-white/[0.02] rounded-xl border border-white/[0.04] p-3" style={{ height: chartH + 40 }}>
                {/* Y axis */}
                <div className="absolute left-0 top-3 w-10 flex flex-col justify-between text-[7px] text-white/20" style={{ height: chartH }}>
                    <span>{maxLoss.toFixed(2)}</span>
                    <span>{((maxLoss + minLoss) / 2).toFixed(2)}</span>
                    <span>{minLoss.toFixed(2)}</span>
                </div>

                {/* Chart area */}
                <div className="ml-10 relative" style={{ height: chartH }}>
                    {/* Grid */}
                    {[0, 0.25, 0.5, 0.75, 1].map(p => (
                        <div key={p} className="absolute w-full border-t border-white/[0.04]" style={{ top: `${p * 100}%` }} />
                    ))}

                    {/* Data points and connecting lines */}
                    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${data.length * 100} ${chartH}`} preserveAspectRatio="none">
                        {/* Train loss line */}
                        <polyline
                            points={data.map((d, i) => {
                                const x = (i + 0.5) * (100);
                                const y = chartH - ((d.trainLoss - minLoss) / lossRange) * chartH;
                                return `${x},${y}`;
                            }).join(" ")}
                            fill="none"
                            stroke="rgba(59, 130, 246, 0.4)"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                        />
                        {/* Val loss line */}
                        <polyline
                            points={data.map((d, i) => {
                                const x = (i + 0.5) * (100);
                                const y = chartH - ((d.valLoss - minLoss) / lossRange) * chartH;
                                return `${x},${y}`;
                            }).join(" ")}
                            fill="none"
                            stroke="rgba(239, 68, 68, 0.6)"
                            strokeWidth="2"
                        />
                        {/* Gap area */}
                        <polygon
                            points={[
                                ...data.map((d, i) => {
                                    const x = (i + 0.5) * 100;
                                    const y = chartH - ((d.valLoss - minLoss) / lossRange) * chartH;
                                    return `${x},${y}`;
                                }),
                                ...data.map((d, i) => {
                                    const x = (data.length - 1 - i + 0.5) * 100;
                                    const y = chartH - ((data[data.length - 1 - i].trainLoss - minLoss) / lossRange) * chartH;
                                    return `${x},${y}`;
                                }),
                            ].join(" ")}
                            fill="rgba(245, 158, 11, 0.06)"
                        />
                    </svg>

                    {/* Interactive columns */}
                    <div className="absolute inset-0 flex">
                        {data.map((d, i) => {
                            const meta = SIZE_META[d.label];
                            const trainY = ((d.trainLoss - minLoss) / lossRange) * 100;
                            const valY = ((d.valLoss - minLoss) / lossRange) * 100;
                            const isHovered = hoveredIdx === i;

                            return (
                                <div
                                    key={d.label}
                                    className="flex-1 relative cursor-pointer"
                                    onMouseEnter={() => setHoveredIdx(i)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                >
                                    {/* Train dot */}
                                    <motion.div
                                        className="absolute w-2 h-2 rounded-full border border-blue-400/60 bg-blue-500/30 -translate-x-1/2 -translate-y-1/2"
                                        style={{ left: "50%", bottom: `${trainY}%` }}
                                        animate={{ scale: isHovered ? 1.5 : 1 }}
                                    />
                                    {/* Val dot */}
                                    <motion.div
                                        className="absolute w-2.5 h-2.5 rounded-full border border-red-400/60 bg-red-500/40 -translate-x-1/2 -translate-y-1/2"
                                        style={{ left: "50%", bottom: `${valY}%` }}
                                        animate={{ scale: isHovered ? 1.5 : 1 }}
                                    />

                                    {/* Tooltip */}
                                    {isHovered && (
                                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded-lg px-2 py-1.5 z-10 whitespace-nowrap">
                                            <div className="text-[8px] font-bold" style={{ color: meta?.color }}>{d.chars} chars</div>
                                            <div className="text-[7px] text-blue-300/50">Train: {d.trainLoss.toFixed(3)}</div>
                                            <div className="text-[7px] text-red-300/50">Val: {d.valLoss.toFixed(3)}</div>
                                            <div className="text-[7px] text-amber-300/50">Gap: +{d.gap.toFixed(3)}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* X labels */}
                    <div className="absolute -bottom-5 left-0 right-0 flex">
                        {data.map(d => {
                            const meta = SIZE_META[d.label];
                            return (
                                <div key={d.label} className="flex-1 text-center text-[7px] text-white/25">
                                    {meta?.chars || d.label}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[8px]">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-400/60" />
                    <span className="text-white/30">Train Loss</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40 border border-red-400/60" />
                    <span className="text-white/30">Val Loss</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-2 bg-amber-500/10 rounded-sm" />
                    <span className="text-white/30">Generalization Gap</span>
                </div>
            </div>

            {/* Summary table */}
            <div className="space-y-0.5">
                <div className="grid grid-cols-5 gap-1 text-[7px] text-white/30 font-bold border-b border-white/[0.06] pb-1">
                    <div>Dataset</div>
                    <div className="text-right">Train</div>
                    <div className="text-right">Val</div>
                    <div className="text-right">Gap</div>
                    <div className="text-right">Overfit?</div>
                </div>
                {data.map(d => {
                    const meta = SIZE_META[d.label];
                    const gapLevel = d.gap < 0.1 ? "low" : d.gap < 0.15 ? "med" : "high";
                    return (
                        <div key={d.label} className="grid grid-cols-5 gap-1 text-[7px] py-0.5">
                            <div className="font-bold" style={{ color: meta?.color + "99" }}>{meta?.chars}</div>
                            <div className="text-right text-blue-300/40">{d.trainLoss.toFixed(3)}</div>
                            <div className="text-right text-red-300/40">{d.valLoss.toFixed(3)}</div>
                            <div className={`text-right ${gapLevel === "low" ? "text-emerald-400/50" : gapLevel === "med" ? "text-amber-400/50" : "text-red-400/50"}`}>
                                +{d.gap.toFixed(3)}
                            </div>
                            <div className={`text-right ${gapLevel === "low" ? "text-emerald-400/40" : gapLevel === "med" ? "text-amber-400/40" : "text-red-400/40"}`}>
                                {gapLevel === "low" ? "minimal" : gapLevel === "med" ? "moderate" : "significant"}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Insight */}
            <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.02] p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-blue-400/60" />
                    <span className="text-[9px] font-bold text-blue-300/60">Data vs. optimizer capacity</span>
                </div>
                <p className="text-[8px] text-white/30 leading-relaxed">
                    With a <span className="text-white/50 font-bold">fixed training budget</span> (100K steps, SGD lr=0.001), smaller datasets
                    achieve lower loss — the model can memorize them. But look at the
                    <span className="text-amber-300/50"> generalization gap</span>: it stays small for small data (easy to memorize = easy
                    to generalize) but grows with data complexity.
                </p>
                <p className="text-[8px] text-white/20 leading-relaxed">
                    The real lesson: <span className="text-white/40">more data needs a better optimizer</span> (Adam, not SGD) or
                    much more training time. Data alone doesn&apos;t help — you need the capacity to learn from it.
                </p>
            </div>
        </div>
    );
}
