"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Scaling, TrendingDown, AlertTriangle } from "lucide-react";

/**
 * ScaleStabilityExperiment
 * Shows how model scale (H=256 vs H=512) and depth interact with
 * stability techniques (kaiming vs kaiming+BN+residual) using SGD.
 * 
 * Fetches from /api/v1/mlp/scale-stability, falls back to hardcoded data.
 */

interface ScaleModel {
    label: string;
    config: {
        hidden_size: number;
        num_layers: number;
        context_size: number;
        emb_dim: number;
        learning_rate: number;
        use_batchnorm: boolean;
        use_residual: boolean;
        init_strategy: string;
        optimizer_type: string;
    };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    diverged: boolean;
    loss_curve?: { train: { step: number; value: number }[]; val: { step: number; value: number }[] };
    generated_samples?: string[];
}

const FALLBACK: ScaleModel[] = [
    { label: "scale_H256_L4_kaiming", config: { hidden_size: 256, num_layers: 4, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.954, final_val_loss: 1.995, total_params: 273116, diverged: false },
    { label: "scale_H256_L4_kaiming+BN+residual", config: { hidden_size: 256, num_layers: 4, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 2.062, final_val_loss: 2.081, total_params: 280000, diverged: false },
    { label: "scale_H256_L8_kaiming", config: { hidden_size: 256, num_layers: 8, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.781, final_val_loss: 1.915, total_params: 535000, diverged: false },
    { label: "scale_H256_L8_kaiming+BN+residual", config: { hidden_size: 256, num_layers: 8, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.922, final_val_loss: 1.981, total_params: 550000, diverged: false },
    { label: "scale_H256_L12_kaiming", config: { hidden_size: 256, num_layers: 12, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.716, final_val_loss: 1.896, total_params: 800000, diverged: false },
    { label: "scale_H256_L12_kaiming+BN+residual", config: { hidden_size: 256, num_layers: 12, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.951, final_val_loss: 1.966, total_params: 820000, diverged: false },
    { label: "scale_H256_L16_kaiming", config: { hidden_size: 256, num_layers: 16, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.574, final_val_loss: 1.744, total_params: 1060000, diverged: false },
    { label: "scale_H256_L16_kaiming+BN+residual", config: { hidden_size: 256, num_layers: 16, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.790, final_val_loss: 1.969, total_params: 1090000, diverged: false },
    { label: "scale_H256_L20_kaiming", config: { hidden_size: 256, num_layers: 20, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.593, final_val_loss: 1.802, total_params: 1320000, diverged: false },
    { label: "scale_H256_L20_kaiming+BN+residual", config: { hidden_size: 256, num_layers: 20, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.865, final_val_loss: 1.911, total_params: 1360000, diverged: false },
    { label: "scale_H512_L4_kaiming", config: { hidden_size: 512, num_layers: 4, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.889, final_val_loss: 1.967, total_params: 940000, diverged: false },
    { label: "scale_H512_L4_kaiming+BN+residual", config: { hidden_size: 512, num_layers: 4, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.912, final_val_loss: 2.024, total_params: 960000, diverged: false },
    { label: "scale_H512_L8_kaiming", config: { hidden_size: 512, num_layers: 8, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.647, final_val_loss: 1.786, total_params: 1990000, diverged: false },
    { label: "scale_H512_L8_kaiming+BN+residual", config: { hidden_size: 512, num_layers: 8, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.818, final_val_loss: 1.888, total_params: 2040000, diverged: false },
    { label: "scale_H512_L12_kaiming", config: { hidden_size: 512, num_layers: 12, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.573, final_val_loss: 1.754, total_params: 3050000, diverged: false },
    { label: "scale_H512_L12_kaiming+BN+residual", config: { hidden_size: 512, num_layers: 12, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.726, final_val_loss: 1.887, total_params: 3120000, diverged: false },
    { label: "scale_H512_L16_kaiming", config: { hidden_size: 512, num_layers: 16, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.497, final_val_loss: 1.745, total_params: 4100000, diverged: false },
    { label: "scale_H512_L16_kaiming+BN+residual", config: { hidden_size: 512, num_layers: 16, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.715, final_val_loss: 1.989, total_params: 4190000, diverged: false },
    { label: "scale_H512_L20_kaiming", config: { hidden_size: 512, num_layers: 20, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: false, use_residual: false, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.437, final_val_loss: 1.712, total_params: 5150000, diverged: false },
    { label: "scale_H512_L20_kaiming+BN+residual", config: { hidden_size: 512, num_layers: 20, context_size: 8, emb_dim: 16, learning_rate: 0.001, use_batchnorm: true, use_residual: true, init_strategy: "kaiming", optimizer_type: "sgd" }, final_train_loss: 1.614, final_val_loss: 1.821, total_params: 5260000, diverged: false },
];

const DEPTHS = [4, 8, 12, 16, 20];
const HIDDEN_SIZES = [256, 512];
const DEPTH_COLORS: Record<number, string> = { 4: "#3b82f6", 8: "#22c55e", 12: "#f59e0b", 16: "#ef4444", 20: "#a855f7" };

function fmtParams(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return `${n}`;
}

export function ScaleStabilityExperiment() {
    const [models, setModels] = useState<ScaleModel[]>(FALLBACK);
    const [selectedH, setSelectedH] = useState<number>(256);
    const [showMetric, setShowMetric] = useState<"val" | "train" | "gap">("val");
    const [hoveredDepth, setHoveredDepth] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/v1/mlp/scale-stability")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.models?.length) setModels(d.models); })
            .catch(() => { });
    }, []);

    const grouped = useMemo(() => {
        const result: Record<number, Record<string, ScaleModel>> = {};
        for (const m of models) {
            const h = m.config.hidden_size;
            const key = m.config.use_batchnorm ? "bn_res" : "kaiming";
            if (!result[h]) result[h] = {};
            const depthKey = `${m.config.num_layers}_${key}`;
            result[h][depthKey] = m;
        }
        return result;
    }, [models]);

    const currentModels = grouped[selectedH] || {};

    // Find min/max for chart scaling — use fixed bottom at 0 for gap, or a reasonable baseline for loss
    const allVals = models.filter(m => m.config.hidden_size === selectedH).map(m => {
        if (showMetric === "gap") return m.final_val_loss - m.final_train_loss;
        return showMetric === "val" ? m.final_val_loss : m.final_train_loss;
    });
    const maxVal = Math.max(...allVals) * 1.05;
    const minVal = showMetric === "gap" ? 0 : Math.min(...allVals) * 0.85;
    const range = maxVal - minVal || 0.1;

    const getVal = (m: ScaleModel) => {
        if (showMetric === "gap") return m.final_val_loss - m.final_train_loss;
        return showMetric === "val" ? m.final_val_loss : m.final_train_loss;
    };

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-4 space-y-4 font-mono text-[10px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Scaling className="w-4 h-4 text-violet-400" />
                    <span className="text-[11px] font-bold text-white/70">Scale Stability — SGD, No Clipping</span>
                </div>
                <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
                    {HIDDEN_SIZES.map(h => (
                        <button
                            key={h}
                            onClick={() => setSelectedH(h)}
                            className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all ${selectedH === h
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                : "text-white/30 hover:text-white/50"
                                }`}
                        >
                            H={h}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric toggle */}
            <div className="flex items-center gap-1">
                {(["val", "train", "gap"] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setShowMetric(m)}
                        className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${showMetric === m
                            ? "bg-white/10 text-white/70"
                            : "text-white/20 hover:text-white/40"
                            }`}
                    >
                        {m === "val" ? "Val Loss" : m === "train" ? "Train Loss" : "Gap (overfit)"}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="relative h-52 bg-white/[0.02] rounded-xl border border-white/[0.04] p-3">
                {/* Y axis labels */}
                <div className="absolute left-0 top-3 bottom-6 w-10 flex flex-col justify-between text-[8px] text-white/25">
                    <span>{maxVal.toFixed(2)}</span>
                    <span>{((maxVal + minVal) / 2).toFixed(2)}</span>
                    <span>{minVal.toFixed(2)}</span>
                </div>

                {/* Chart area */}
                <div className="ml-10 h-full relative">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(p => (
                        <div
                            key={p}
                            className="absolute w-full border-t border-white/[0.04]"
                            style={{ top: `${p * 100}%` }}
                        />
                    ))}

                    {/* X axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between translate-y-4 text-[7px] text-white/20">
                        {DEPTHS.map(d => (
                            <span key={d} className="text-center" style={{ width: `${100 / DEPTHS.length}%` }}>
                                L={d}
                            </span>
                        ))}
                    </div>

                    {/* Bars */}
                    <div className="absolute inset-0 bottom-4 flex items-end gap-1">
                        {DEPTHS.map((depth, di) => {
                            const kaiming = currentModels[`${depth}_kaiming`];
                            const bnRes = currentModels[`${depth}_bn_res`];
                            const isHovered = hoveredDepth === depth;

                            return (
                                <div
                                    key={depth}
                                    className="flex-1 h-full flex items-end justify-center gap-0.5 relative"
                                    onMouseEnter={() => setHoveredDepth(depth)}
                                    onMouseLeave={() => setHoveredDepth(null)}
                                >
                                    {/* Kaiming bar */}
                                    {kaiming && (
                                        <div className="w-[35%] h-full relative flex flex-col items-end justify-end">
                                            <span className={`text-[7px] font-bold mb-0.5 transition-opacity ${isHovered ? 'text-white/70' : 'text-white/30'}`}>
                                                {getVal(kaiming).toFixed(2)}
                                            </span>
                                            <motion.div
                                                className="w-full rounded-t-sm"
                                                style={{
                                                    backgroundColor: DEPTH_COLORS[depth],
                                                    opacity: isHovered ? 1 : 0.7,
                                                }}
                                                initial={{ height: 0 }}
                                                animate={{
                                                    height: `${Math.max(8, ((getVal(kaiming) - minVal) / range) * 100)}%`,
                                                }}
                                                transition={{ duration: 0.5, delay: di * 0.05 }}
                                            />
                                        </div>
                                    )}
                                    {/* BN+Res bar */}
                                    {bnRes && (
                                        <div className="w-[35%] h-full relative flex flex-col items-end justify-end">
                                            <span className={`text-[7px] font-bold mb-0.5 transition-opacity ${isHovered ? 'text-white/50' : 'text-white/15'}`}>
                                                {getVal(bnRes).toFixed(2)}
                                            </span>
                                            <motion.div
                                                className="w-full rounded-t-sm"
                                                style={{
                                                    backgroundColor: DEPTH_COLORS[depth],
                                                    opacity: isHovered ? 0.5 : 0.3,
                                                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
                                                }}
                                                initial={{ height: 0 }}
                                                animate={{
                                                    height: `${Math.max(8, ((getVal(bnRes) - minVal) / range) * 100)}%`,
                                                }}
                                                transition={{ duration: 0.5, delay: di * 0.05 + 0.1 }}
                                            />
                                        </div>
                                    )}

                                    {/* Hover tooltip */}
                                    <AnimatePresence>
                                        {isHovered && kaiming && bnRes && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded-lg px-2 py-1.5 z-10 whitespace-nowrap"
                                            >
                                                <div className="text-[8px] font-bold text-white/60 mb-0.5">L={depth} · H={selectedH}</div>
                                                <div className="text-[7px] text-white/40">
                                                    Kaiming: {getVal(kaiming).toFixed(3)} · {fmtParams(kaiming.total_params)}
                                                </div>
                                                <div className="text-[7px] text-white/30">
                                                    BN+Res: {getVal(bnRes).toFixed(3)} · {fmtParams(bnRes.total_params)}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[8px]">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-sm bg-violet-400/70" />
                    <span className="text-white/40">Kaiming only</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-sm bg-violet-400/30" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)" }} />
                    <span className="text-white/40">Kaiming + BN + Residual</span>
                </div>
            </div>

            {/* Summary table */}
            <div className="space-y-1">
                <div className="grid grid-cols-6 gap-1 text-[7px] text-white/30 font-bold border-b border-white/[0.06] pb-1">
                    <div>Depth</div>
                    <div>Technique</div>
                    <div className="text-right">Train</div>
                    <div className="text-right">Val</div>
                    <div className="text-right">Gap</div>
                    <div className="text-right">Params</div>
                </div>
                {DEPTHS.map(depth => {
                    const k = currentModels[`${depth}_kaiming`];
                    const b = currentModels[`${depth}_bn_res`];
                    if (!k || !b) return null;
                    const kGap = k.final_val_loss - k.final_train_loss;
                    const bGap = b.final_val_loss - b.final_train_loss;
                    const kWins = k.final_val_loss < b.final_val_loss;
                    return (
                        <div key={depth} className="space-y-0.5">
                            <div className={`grid grid-cols-6 gap-1 text-[7px] py-0.5 rounded px-1 ${kWins ? "bg-emerald-500/[0.05]" : ""}`}>
                                <div className="text-white/50 font-bold" style={{ color: DEPTH_COLORS[depth] }}>L={depth}</div>
                                <div className="text-white/40">Kaiming</div>
                                <div className="text-right text-white/30">{k.final_train_loss.toFixed(3)}</div>
                                <div className={`text-right font-bold ${kWins ? "text-emerald-400/70" : "text-white/40"}`}>{k.final_val_loss.toFixed(3)}</div>
                                <div className="text-right text-amber-400/50">{kGap > 0 ? "+" : ""}{kGap.toFixed(3)}</div>
                                <div className="text-right text-white/20">{fmtParams(k.total_params)}</div>
                            </div>
                            <div className={`grid grid-cols-6 gap-1 text-[7px] py-0.5 rounded px-1 ${!kWins ? "bg-emerald-500/[0.05]" : ""}`}>
                                <div />
                                <div className="text-white/30">+BN+Res</div>
                                <div className="text-right text-white/25">{b.final_train_loss.toFixed(3)}</div>
                                <div className={`text-right font-bold ${!kWins ? "text-emerald-400/70" : "text-white/35"}`}>{b.final_val_loss.toFixed(3)}</div>
                                <div className="text-right text-emerald-400/40">{bGap > 0 ? "+" : ""}{bGap.toFixed(3)}</div>
                                <div className="text-right text-white/15">{fmtParams(b.total_params)}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pedagogical insight */}
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400/60" />
                    <span className="text-[9px] font-bold text-amber-300/60">Surprising result — technique ≠ magic</span>
                </div>
                <p className="text-[8px] text-white/30 leading-relaxed">
                    With plain SGD (no Adam, no momentum), <span className="text-white/50 font-bold">Kaiming alone outperforms BN+Residual</span> at
                    every depth. BN+Residual were designed for adaptive optimizers like Adam — with SGD, the batch noise from
                    BN and the capacity overhead from residual projections actually <span className="text-amber-300/50">hurt performance</span>.
                </p>
                <p className="text-[8px] text-white/20 leading-relaxed">
                    However, BN+Residual models show <span className="text-white/40">smaller generalization gaps</span> — they overfit less.
                    The techniques provide regularization even when they don&apos;t help convergence speed.
                    This is why modern deep learning uses Adam + BN + Residual together — each piece needs the others.
                </p>
            </div>
        </div>
    );
}
