"use client";

import { useEffect, useState, useMemo } from "react";

import { motion } from "framer-motion";

/*
  BigModelLimitationViz
  Shows that even with stability techniques + big config, MLP hits a wall.
  Two views: params vs val_loss chart AND overfitting gap chart.
  Key insight: large context_size causes massive overfitting on small datasets.
  Fetches from /api/v1/mlp/big-models with hardcoded fallback.
*/

interface BigModelAPI {
    label: string;
    config: {
        context_size: number;
        emb_dim: number;
        hidden_size: number;
        num_layers: number;
        learning_rate: number;
        max_steps: number;
    };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    train_time_sec: number;
    diverged: boolean;
    generated_samples: string[];
}

const FALLBACK_MODELS: BigModelAPI[] = [
    { label: "big_H128_L2_CTX8_E16", config: { context_size: 8, emb_dim: 16, hidden_size: 128, num_layers: 2, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.44, final_val_loss: 1.67, total_params: 37596, train_time_sec: 2441, diverged: false, generated_samples: [] },
    { label: "big_H256_L2_CTX8_E16", config: { context_size: 8, emb_dim: 16, hidden_size: 256, num_layers: 2, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.31, final_val_loss: 1.51, total_params: 140508, train_time_sec: 3200, diverged: false, generated_samples: [] },
    { label: "big_H256_L4_CTX4_E16", config: { context_size: 4, emb_dim: 16, hidden_size: 256, num_layers: 4, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.30, final_val_loss: 1.56, total_params: 240348, train_time_sec: 3500, diverged: false, generated_samples: [] },
    { label: "big_H256_L4_CTX8_E16", config: { context_size: 8, emb_dim: 16, hidden_size: 256, num_layers: 4, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.33, final_val_loss: 1.46, total_params: 273116, train_time_sec: 3600, diverged: false, generated_samples: [] },
    { label: "big_H256_L4_CTX16_E16", config: { context_size: 16, emb_dim: 16, hidden_size: 256, num_layers: 4, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.26, final_val_loss: 1.54, total_params: 272860, train_time_sec: 3800, diverged: false, generated_samples: [] },
    { label: "big_H256_L4_CTX32_E16", config: { context_size: 32, emb_dim: 16, hidden_size: 256, num_layers: 4, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.27, final_val_loss: 1.60, total_params: 469724, train_time_sec: 4100, diverged: false, generated_samples: [] },
    { label: "big_H512_L4_CTX8_E16", config: { context_size: 8, emb_dim: 16, hidden_size: 512, num_layers: 4, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.14, final_val_loss: 1.49, total_params: 938972, train_time_sec: 5000, diverged: false, generated_samples: [] },
    { label: "big_H256_L4_CTX64_E32", config: { context_size: 64, emb_dim: 32, hidden_size: 256, num_layers: 4, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.12, final_val_loss: 1.66, total_params: 1256604, train_time_sec: 5500, diverged: false, generated_samples: [] },
    { label: "big_H512_L6_CTX8_E16", config: { context_size: 8, emb_dim: 16, hidden_size: 512, num_layers: 6, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.18, final_val_loss: 1.55, total_params: 1466332, train_time_sec: 6000, diverged: false, generated_samples: [] },
    { label: "big_H512_L6_CTX64_E32", config: { context_size: 64, emb_dim: 32, hidden_size: 512, num_layers: 6, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.12, final_val_loss: 1.64, total_params: 3432860, train_time_sec: 7500, diverged: false, generated_samples: [] },
    { label: "big_H256_L4_CTX128_E64", config: { context_size: 128, emb_dim: 64, hidden_size: 256, num_layers: 4, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 1.06, final_val_loss: 1.78, total_params: 4403228, train_time_sec: 8000, diverged: false, generated_samples: [] },
    { label: "big_H512_L6_CTX128_E64", config: { context_size: 128, emb_dim: 64, hidden_size: 512, num_layers: 6, learning_rate: 0.001, max_steps: 100000 }, final_train_loss: 0.94, final_val_loss: 1.84, total_params: 9725212, train_time_sec: 10000, diverged: false, generated_samples: [] },
];

function fmtParams(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
}

type ChartView = "params" | "context";

export function BigModelLimitationViz() {
    const [models, setModels] = useState<BigModelAPI[]>(FALLBACK_MODELS);
    const [selected, setSelected] = useState<number | null>(null);
    const [chartView, setChartView] = useState<ChartView>("params");

    useEffect(() => {
        let cancelled = false;
        fetch("/api/v1/mlp/big-models")
            .then(r => r.ok ? r.json() : Promise.reject())
            .then((data) => {
                const ms = data?.models ?? data;
                if (!cancelled && Array.isArray(ms) && ms.length > 0) {
                    setModels(ms.sort((a: BigModelAPI, b: BigModelAPI) => (a.total_params ?? 0) - (b.total_params ?? 0)));
                }
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, []);

    const sorted = useMemo(() => [...models].sort((a, b) =>
        chartView === "params" ? a.total_params - b.total_params : a.config.context_size - b.config.context_size
    ), [models, chartView]);

    // Chart layout
    const W = 440, H = 200, px = 48, py = 18, pr = 12, pb = 24;
    const plotW = W - px - pr, plotH = H - py - pb;

    // Scales
    const chartScales = useMemo(() => {
        const allLosses = sorted.flatMap(m => [m.final_train_loss, m.final_val_loss]).filter(v => isFinite(v));
        const yMin = Math.max(0.8, Math.min(...allLosses) - 0.05);
        const yMax = Math.min(2.2, Math.max(...allLosses) + 0.05);

        if (chartView === "params") {
            const minP = Math.log10(Math.max(1, sorted[0]?.total_params ?? 1));
            const maxP = Math.log10(Math.max(2, sorted[sorted.length - 1]?.total_params ?? 2));
            return { yMin, yMax, xMin: minP, xMax: maxP, xType: "log" as const };
        } else {
            const ctxs = sorted.map(m => m.config.context_size);
            return { yMin, yMax, xMin: Math.min(...ctxs), xMax: Math.max(...ctxs), xType: "linear" as const };
        }
    }, [sorted, chartView]);

    const toX = (v: number) => {
        const { xMin, xMax, xType } = chartScales;
        const norm = xType === "log"
            ? (Math.log10(Math.max(1, v)) - xMin) / (xMax - xMin)
            : (v - xMin) / (xMax - xMin);
        return px + Math.max(0, Math.min(1, norm)) * plotW;
    };
    const toY = (v: number) => py + (1 - (v - chartScales.yMin) / (chartScales.yMax - chartScales.yMin)) * plotH;

    // Stats
    const bestVal = useMemo(() => sorted.reduce((best, m) => m.final_val_loss < best.final_val_loss ? m : best, sorted[0]), [sorted]);
    const worstOverfit = useMemo(() => sorted.reduce((worst, m) => {
        const gap = m.final_val_loss - m.final_train_loss;
        const worstGap = worst.final_val_loss - worst.final_train_loss;
        return gap > worstGap ? m : worst;
    }, sorted[0]), [sorted]);

    // Y-axis ticks
    const yTicks = useMemo(() => {
        const ticks: number[] = [];
        let v = Math.ceil(chartScales.yMin / 0.2) * 0.2;
        while (v <= chartScales.yMax) { ticks.push(v); v += 0.2; }
        return ticks;
    }, [chartScales]);

    return (
        <div className="p-3 sm:p-4 space-y-3">
            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-1 w-fit">
                {([["params", "Parameters vs Loss"], ["context", "Context Size vs Overfitting"]] as [ChartView, string][]).map(([view, label]) => (
                    <button
                        key={view}
                        onClick={() => { setChartView(view); setSelected(null); }}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${chartView === view
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                            : "text-white/30 hover:text-white/50 border border-transparent"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Grid */}
                    {yTicks.map(v => (
                        <g key={v}>
                            <line x1={px} y1={toY(v)} x2={px + plotW} y2={toY(v)} stroke="white" strokeOpacity={0.04} />
                            <text x={px - 5} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">{v.toFixed(1)}</text>
                        </g>
                    ))}

                    {/* Axes labels */}
                    <text x={px + plotW / 2} y={H - 2} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">
                        {chartView === "params" ? "Parameters (log scale) →" : "Context Size →"}
                    </text>
                    <text x={8} y={py + plotH / 2} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace"
                        transform={`rotate(-90 8 ${py + plotH / 2})`}>Loss ↓</text>

                    {/* Data points */}
                    {sorted.map((m, i) => {
                        const xVal = chartView === "params" ? m.total_params : m.config.context_size;
                        const cx = toX(xVal);
                        const cyTrain = toY(m.final_train_loss);
                        const cyVal = toY(m.final_val_loss);
                        const gap = m.final_val_loss - m.final_train_loss;
                        const isSelected = selected === i;
                        const isBest = m.label === bestVal.label;

                        return (
                            <g key={m.label} className="cursor-pointer" onClick={() => setSelected(isSelected ? null : i)}>
                                {/* Overfitting gap line */}
                                <line x1={cx} y1={cyTrain} x2={cx} y2={cyVal}
                                    stroke={gap > 0.4 ? "#ef4444" : gap > 0.2 ? "#f59e0b" : "#22c55e"}
                                    strokeWidth={isSelected ? 3 : 2} strokeOpacity={isSelected ? 0.7 : 0.3} />

                                {/* Train dot (dashed outline) */}
                                <circle cx={cx} cy={cyTrain} r={isSelected ? 4 : 2.5}
                                    fill="none" stroke="#a78bfa" strokeWidth={1.5} strokeOpacity={isSelected ? 0.8 : 0.4}
                                    strokeDasharray="2 1" />

                                {/* Val dot (solid) */}
                                <circle cx={cx} cy={cyVal} r={isSelected ? 5 : 3}
                                    fill={isBest ? "#fbbf24" : "#a78bfa"} fillOpacity={isSelected ? 1 : 0.6}
                                    stroke={isSelected ? "#c4b5fd" : "none"} strokeWidth={1.5} />

                                {/* Label */}
                                {isSelected && (
                                    <text x={cx} y={cyVal - 9} textAnchor="middle" fontSize={6} fill="white" fillOpacity={0.5} fontFamily="monospace">
                                        ctx={m.config.context_size} gap={gap.toFixed(2)}
                                    </text>
                                )}
                                {isBest && !isSelected && (
                                    <text x={cx + 6} y={cyVal + 3} fontSize={7} fill="#fbbf24" fontFamily="monospace" fontWeight="bold">★</text>
                                )}
                            </g>
                        );
                    })}

                    {/* Legend */}
                    <circle cx={px + 8} cy={py + 8} r={3} fill="none" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="2 1" />
                    <text x={px + 14} y={py + 11} fontSize={6} fill="white" fillOpacity={0.3} fontFamily="monospace">train</text>
                    <circle cx={px + 45} cy={py + 8} r={3} fill="#a78bfa" />
                    <text x={px + 51} y={py + 11} fontSize={6} fill="white" fillOpacity={0.3} fontFamily="monospace">val</text>
                    <line x1={px + 75} y1={py + 5} x2={px + 75} y2={py + 11} stroke="#f59e0b" strokeWidth={2} strokeOpacity={0.5} />
                    <text x={px + 79} y={py + 11} fontSize={6} fill="white" fillOpacity={0.3} fontFamily="monospace">gap</text>
                </svg>
            </div>

            {/* Key stats row */}
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-center">
                    <p className="text-[8px] font-mono text-amber-400/60">Best Val Loss</p>
                    <p className="text-sm font-mono font-bold text-amber-400">{bestVal.final_val_loss.toFixed(3)}</p>
                    <p className="text-[7px] font-mono text-white/20">ctx={bestVal.config.context_size} · {fmtParams(bestVal.total_params)}</p>
                </div>
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 text-center">
                    <p className="text-[8px] font-mono text-rose-400/60">Worst Overfitting</p>
                    <p className="text-sm font-mono font-bold text-rose-400">+{(worstOverfit.final_val_loss - worstOverfit.final_train_loss).toFixed(2)}</p>
                    <p className="text-[7px] font-mono text-white/20">ctx={worstOverfit.config.context_size} · {fmtParams(worstOverfit.total_params)}</p>
                </div>
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-2 text-center">
                    <p className="text-[8px] font-mono text-violet-400/60">Param Range</p>
                    <p className="text-sm font-mono font-bold text-violet-400">{(sorted[sorted.length - 1]?.total_params / sorted[0]?.total_params).toFixed(0)}×</p>
                    <p className="text-[7px] font-mono text-white/20">{fmtParams(sorted[0]?.total_params)} → {fmtParams(sorted[sorted.length - 1]?.total_params)}</p>
                </div>
            </div>

            {/* Selected model detail */}
            {(() => {
                const m = selected !== null ? sorted[selected] : null;
                if (!m) return null;
                const gap = m.final_val_loss - m.final_train_loss;
                const samples = m.generated_samples ?? [];
                return (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-3 space-y-2"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-violet-400">{m.label}</span>
                            <span className="text-[8px] font-mono text-white/20">
                                ctx={m.config.context_size} · L={m.config.num_layers} · H={m.config.hidden_size} · E={m.config.emb_dim}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-mono">
                            <span className="text-white/30">{fmtParams(m.total_params)} params</span>
                            <span className="text-white/30">train=<span className="text-violet-400/70">{m.final_train_loss.toFixed(3)}</span></span>
                            <span className="text-white/30">val=<span className="text-violet-400 font-bold">{m.final_val_loss.toFixed(3)}</span></span>
                            <span className={`font-bold ${gap > 0.4 ? "text-rose-400/70" : gap > 0.2 ? "text-amber-400/70" : "text-emerald-400/70"}`}>
                                gap={gap >= 0 ? "+" : ""}{gap.toFixed(3)}
                            </span>
                        </div>
                        {samples.length > 0 && (
                            <div className="text-[10px] font-mono text-violet-400/50 p-2 rounded border border-violet-500/10 bg-violet-500/[0.02] leading-relaxed max-h-20 overflow-y-auto">
                                &ldquo;{samples[0].trim().slice(0, 150)}{samples[0].trim().length > 150 ? "…" : ""}&rdquo;
                            </div>
                        )}
                    </motion.div>
                );
            })()}

            {/* Pedagogical insight */}
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-3 space-y-1.5">
                <p className="text-[9px] font-mono text-amber-300/60 font-bold">The context trap</p>
                <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                    <span className="text-white/50 font-bold">More context doesn&apos;t mean better generalization.</span>{" "}
                    Models with ctx=128 achieve amazing train loss (0.94!) but terrible val loss (1.84) &mdash; a gap of +0.90.
                    They&apos;re memorizing the training data verbatim instead of learning patterns.
                    Meanwhile, ctx=8 models generalize best (val ~1.46) despite higher train loss.
                </p>
                <p className="text-[9px] font-mono text-white/20 leading-relaxed">
                    This is the <span className="text-white/40 font-bold">overfitting paradox</span>: with a small dataset (~300K chars),
                    large context windows give the model enough information to &quot;cheat&quot; by memorizing sequences rather than learning language rules.
                    The MLP architecture lacks the inductive biases (like attention) that help larger models generalize with more context.
                </p>
            </div>

            <p className="text-[8px] font-mono text-white/12 text-center">
                {models.length} models · all with kaiming + residual · Click dots for details · Vertical lines show train→val gap
            </p>
        </div>
    );
}
