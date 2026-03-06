"use client";

import { useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  ShallowVsDeepComparison
  Shows WHY 1-layer works fine with bad init but 20-layer doesn't.
  Fetches real training curves from /api/v1/mlp/depth-comparison,
  falls back to hardcoded representative data.
  Displays 3 panels: L=1, L=4, L=20 with loss curves + key stats.
*/

interface DepthModel {
    label: string;
    config: { num_layers: number; hidden_size: number; emb_dim: number; init_strategy: string; use_batchnorm: boolean; use_residual: boolean };
    final_val_loss: number;
    final_train_loss: number;
    initial_val_loss: number;
    diverged: boolean;
    total_params: number;
    loss_curve: { train: { step: number; value: number }[]; val: { step: number; value: number }[] };
    generated_samples: string[];
}

const TARGET_LAYERS = [1, 4, 20];

const FALLBACK: DepthModel[] = [
    {
        label: "depth_L1", config: { num_layers: 1, hidden_size: 128, emb_dim: 16, init_strategy: "random", use_batchnorm: false, use_residual: false },
        final_val_loss: 2.05, final_train_loss: 1.98, initial_val_loss: 3.35, diverged: false, total_params: 5200,
        loss_curve: {
            train: [{ step: 0, value: 3.35 }, { step: 1000, value: 2.8 }, { step: 5000, value: 2.3 }, { step: 10000, value: 2.1 }, { step: 20000, value: 2.0 }, { step: 50000, value: 1.98 }],
            val: [{ step: 0, value: 3.35 }, { step: 1000, value: 2.85 }, { step: 5000, value: 2.35 }, { step: 10000, value: 2.15 }, { step: 20000, value: 2.08 }, { step: 50000, value: 2.05 }],
        },
        generated_samples: ["the king was in"],
    },
    {
        label: "depth_L4", config: { num_layers: 4, hidden_size: 128, emb_dim: 16, init_strategy: "random", use_batchnorm: false, use_residual: false },
        final_val_loss: 2.85, final_train_loss: 2.75, initial_val_loss: 3.40, diverged: false, total_params: 56000,
        loss_curve: {
            train: [{ step: 0, value: 3.40 }, { step: 1000, value: 3.35 }, { step: 5000, value: 3.20 }, { step: 10000, value: 3.05 }, { step: 20000, value: 2.90 }, { step: 50000, value: 2.75 }],
            val: [{ step: 0, value: 3.40 }, { step: 1000, value: 3.36 }, { step: 5000, value: 3.22 }, { step: 10000, value: 3.08 }, { step: 20000, value: 2.95 }, { step: 50000, value: 2.85 }],
        },
        generated_samples: ["thend wor tha"],
    },
    {
        label: "depth_L20", config: { num_layers: 20, hidden_size: 128, emb_dim: 16, init_strategy: "random", use_batchnorm: false, use_residual: false },
        final_val_loss: 3.30, final_train_loss: 3.30, initial_val_loss: 3.30, diverged: true, total_params: 340000,
        loss_curve: {
            train: [{ step: 0, value: 3.30 }, { step: 1000, value: 3.30 }, { step: 5000, value: 3.30 }, { step: 10000, value: 3.30 }, { step: 20000, value: 3.30 }, { step: 50000, value: 3.30 }],
            val: [{ step: 0, value: 3.30 }, { step: 1000, value: 3.30 }, { step: 5000, value: 3.30 }, { step: 10000, value: 3.30 }, { step: 20000, value: 3.30 }, { step: 50000, value: 3.30 }],
        },
        generated_samples: ["qqqqqqqqqqqqq"],
    },
];

function fmtParams(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function LossCurve({ model, color }: { model: DepthModel; color: string }) {
    const W = 240, H = 100, px = 30, py = 8;
    const plotW = W - px - 6, plotH = H - py * 2;
    const yMin = 1.5, yMax = 3.5;

    const pts = model.loss_curve.val;
    const maxStep = pts[pts.length - 1]?.step ?? 50000;

    const toX = (step: number) => px + (step / maxStep) * plotW;
    const toY = (v: number) => py + (1 - (Math.min(yMax, Math.max(yMin, v)) - yMin) / (yMax - yMin)) * plotH;

    const trainPts = model.loss_curve.train;
    const trainPath = trainPts.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");
    const valPath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {/* Grid */}
            {[2.0, 2.5, 3.0].map(v => (
                <g key={v}>
                    <line x1={px} y1={toY(v)} x2={px + plotW} y2={toY(v)} stroke="white" strokeOpacity={0.04} />
                    <text x={px - 3} y={toY(v) + 3} textAnchor="end" fontSize={6} fill="white" fillOpacity={0.12} fontFamily="monospace">{v.toFixed(1)}</text>
                </g>
            ))}
            {/* Random baseline */}
            <line x1={px} y1={toY(3.3)} x2={px + plotW} y2={toY(3.3)} stroke="white" strokeOpacity={0.08} strokeDasharray="3 3" />
            <text x={px + plotW + 2} y={toY(3.3) + 3} fontSize={5} fill="white" fillOpacity={0.12} fontFamily="monospace">random</text>
            {/* Train curve (dimmer) */}
            <path d={trainPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.25} />
            {/* Val curve */}
            <path d={valPath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
            {/* Final dot */}
            <circle cx={toX(pts[pts.length - 1].step)} cy={toY(pts[pts.length - 1].value)} r={3} fill={color} />
        </svg>
    );
}

export function ShallowVsDeepComparison() {
    const [models, setModels] = useState<DepthModel[]>(FALLBACK);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/v1/mlp/depth-comparison");
                if (!res.ok) throw new Error("API unavailable");
                const data = await res.json();
                const ms: DepthModel[] = data?.models ?? data;
                if (!cancelled && Array.isArray(ms) && ms.length > 0) {
                    setModels(ms);
                }
            } catch { /* use fallback */ }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    // Find models closest to target layers
    const displayed = useMemo(() => {
        return TARGET_LAYERS.map(target => {
            const exact = models.find(m => m.config.num_layers === target);
            if (exact) return exact;
            // Find closest
            return models.reduce((best, m) => {
                const diff = Math.abs(m.config.num_layers - target);
                const bestDiff = Math.abs(best.config.num_layers - target);
                return diff < bestDiff ? m : best;
            }, models[0]);
        });
    }, [models]);

    const configs: { model: DepthModel; color: string; borderClass: string; bgClass: string; textClass: string; verdict: string }[] = [
        {
            model: displayed[0], color: "#22c55e",
            borderClass: "border-emerald-500/20", bgClass: "bg-emerald-500/5", textClass: "text-emerald-400",
            verdict: "Survives bad init — only 1 layer to go wrong",
        },
        {
            model: displayed[1], color: "#f59e0b",
            borderClass: "border-amber-500/20", bgClass: "bg-amber-500/5", textClass: "text-amber-400",
            verdict: "Struggles — errors compound across 4 layers",
        },
        {
            model: displayed[2], color: "#ef4444",
            borderClass: "border-red-500/20", bgClass: "bg-red-500/5", textClass: "text-red-400",
            verdict: "Dead on arrival — variance exploded through 20 layers",
        },
    ];

    if (loading && models === FALLBACK) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400/30 border-t-violet-400" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {configs.map(({ model, color, borderClass, bgClass, textClass, verdict }, i) => {
                    const layers = model.config.num_layers;
                    const improvement = ((model.initial_val_loss - model.final_val_loss) / model.initial_val_loss * 100);

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`rounded-xl border p-3 flex flex-col gap-2 ${borderClass} ${bgClass}`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-mono font-bold ${textClass}`}>
                                    {layers} Layer{layers > 1 ? "s" : ""}
                                </span>
                                <span className="text-[8px] font-mono text-white/20">
                                    {fmtParams(model.total_params)} params
                                </span>
                            </div>

                            {/* Loss curve */}
                            <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] overflow-hidden">
                                <LossCurve model={model} color={color} />
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-1.5">
                                <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5 text-center">
                                    <p className="text-[6px] font-mono text-white/15">FINAL LOSS</p>
                                    <p className={`text-sm font-mono font-bold ${textClass}`}>
                                        {model.diverged ? "NaN" : model.final_val_loss.toFixed(3)}
                                    </p>
                                </div>
                                <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5 text-center">
                                    <p className="text-[6px] font-mono text-white/15">IMPROVEMENT</p>
                                    <p className={`text-sm font-mono font-bold ${model.diverged ? "text-red-400" : textClass}`}>
                                        {model.diverged ? "0%" : `${improvement.toFixed(0)}%`}
                                    </p>
                                </div>
                            </div>

                            {/* Generated text */}
                            <div className={`text-[9px] font-mono p-2 rounded border ${borderClass} ${bgClass} leading-relaxed`}
                                style={{ color: `${color}99` }}
                            >
                                &ldquo;{model.generated_samples[0]}&rdquo;
                            </div>

                            {/* Verdict */}
                            <p className="text-[8px] font-mono leading-relaxed" style={{ color: `${color}80` }}>
                                {verdict}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Explanation */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                <p className="text-[9px] font-mono font-bold text-white/40">
                    Why does depth matter so much?
                </p>
                <p className="text-[8px] font-mono text-white/25 leading-relaxed">
                    Each layer multiplies the variance by a factor. With 1 layer, even if that factor is 10×, the output is just 10× too large — the network can recover during training. With 20 layers, that same 10× factor compounds: 10²⁰ = 10,000,000,000,000,000,000,000. The deeper the network, the more precise the initialization must be. Kaiming makes the per-layer factor ≈ 1.0×, so even 20²⁰ = 1.0 — no explosion, no matter how deep.
                </p>
            </div>
        </div>
    );
}
