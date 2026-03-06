"use client";

import { useEffect, useState, useMemo } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  BigModelLimitationViz v2
  Dramatic visualization of the MLP's fundamental wall.
  Color-coded by context size, animated wall line, overfitting gap bars,
  best vs worst comparison, hover tooltips, richer design.
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

const CTX_COLORS: Record<number, string> = {
    4: "#3b82f6", 8: "#22c55e", 16: "#f59e0b", 32: "#f97316", 64: "#ef4444", 128: "#dc2626",
};
function ctxColor(ctx: number): string { return CTX_COLORS[ctx] ?? "#a78bfa"; }

export function BigModelLimitationViz() {
    const [models, setModels] = useState<BigModelAPI[]>(FALLBACK_MODELS);
    const [hovered, setHovered] = useState<number | null>(null);
    const [selected, setSelected] = useState<number | null>(null);

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

    const sorted = useMemo(() => [...models].sort((a, b) => a.total_params - b.total_params), [models]);

    // Chart layout
    const W = 460, H = 230, px = 44, py = 16, pr = 16, pb = 28;
    const plotW = W - px - pr, plotH = H - py - pb;

    // Scales
    const { yMin, yMax, xMin, xMax } = useMemo(() => {
        const allLosses = sorted.flatMap(m => [m.final_train_loss, m.final_val_loss]).filter(v => isFinite(v));
        return {
            yMin: Math.max(0.7, Math.min(...allLosses) - 0.08),
            yMax: Math.min(2.1, Math.max(...allLosses) + 0.08),
            xMin: Math.log10(Math.max(1, sorted[0]?.total_params ?? 1)),
            xMax: Math.log10(Math.max(2, sorted[sorted.length - 1]?.total_params ?? 2)),
        };
    }, [sorted]);

    const toX = (params: number) => px + Math.max(0, Math.min(1, (Math.log10(Math.max(1, params)) - xMin) / (xMax - xMin))) * plotW;
    const toY = (loss: number) => py + (1 - (loss - yMin) / (yMax - yMin)) * plotH;

    // Stats
    const bestVal = useMemo(() => sorted.reduce((best, m) => m.final_val_loss < best.final_val_loss ? m : best, sorted[0]), [sorted]);
    const worstOverfit = useMemo(() => sorted.reduce((worst, m) => {
        const gap = m.final_val_loss - m.final_train_loss;
        return gap > (worst.final_val_loss - worst.final_train_loss) ? m : worst;
    }, sorted[0]), [sorted]);
    const bestTrainModel = useMemo(() => sorted.reduce((best, m) => m.final_train_loss < best.final_train_loss ? m : best, sorted[0]), [sorted]);

    // Y-axis ticks
    const yTicks = useMemo(() => {
        const ticks: number[] = [];
        let v = Math.ceil(yMin / 0.2) * 0.2;
        while (v <= yMax) { ticks.push(v); v += 0.2; }
        return ticks;
    }, [yMin, yMax]);

    // Unique context sizes for legend
    const ctxSizes = useMemo(() => [...new Set(sorted.map(m => m.config.context_size))].sort((a, b) => a - b), [sorted]);

    const activeModel = selected !== null ? sorted[selected] : hovered !== null ? sorted[hovered] : null;

    return (
        <div className="space-y-4">
            {/* Context size legend */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[8px] font-mono text-white/20 mr-1">Color = context:</span>
                {ctxSizes.map(ctx => (
                    <span key={ctx} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/[0.06]"
                        style={{ color: ctxColor(ctx), backgroundColor: `${ctxColor(ctx)}10` }}>
                        ctx={ctx}
                    </span>
                ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-black/50 to-black/30 p-2">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 280 }}>
                    <defs>
                        <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.08} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    {/* Grid */}
                    {yTicks.map(v => (
                        <g key={v}>
                            <line x1={px} y1={toY(v)} x2={px + plotW} y2={toY(v)} stroke="rgba(255,255,255,0.04)" />
                            <text x={px - 5} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="rgba(255,255,255,0.15)" fontFamily="monospace">{v.toFixed(1)}</text>
                        </g>
                    ))}

                    {/* THE WALL — best val loss line */}
                    <motion.line
                        x1={px} y1={toY(bestVal.final_val_loss)} x2={px + plotW} y2={toY(bestVal.final_val_loss)}
                        stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="8 4" strokeOpacity={0.5}
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    {/* Wall fill above */}
                    <rect x={px} y={py} width={plotW} height={toY(bestVal.final_val_loss) - py}
                        fill="url(#wallGrad)" />
                    <text x={px + plotW - 4} y={toY(bestVal.final_val_loss) - 4} textAnchor="end"
                        fontSize={7} fill="#fbbf24" fillOpacity={0.5} fontFamily="monospace" fontWeight="bold">
                        THE WALL — val = {bestVal.final_val_loss.toFixed(2)}
                    </text>

                    {/* Train loss keeps dropping zone */}
                    <text x={px + 4} y={toY(0.9) + 10} fontSize={6} fill="rgba(16,185,129,0.3)" fontFamily="monospace">
                        ← train loss keeps dropping...
                    </text>

                    {/* Gap fill for each model */}
                    {sorted.map((m, i) => {
                        const cx = toX(m.total_params);
                        const cyT = toY(m.final_train_loss);
                        const cyV = toY(m.final_val_loss);
                        const gap = m.final_val_loss - m.final_train_loss;
                        const isActive = hovered === i || selected === i;
                        return (
                            <g key={`gap-${i}`}>
                                <line x1={cx} y1={cyT} x2={cx} y2={cyV}
                                    stroke={ctxColor(m.config.context_size)}
                                    strokeWidth={isActive ? 4 : 2} strokeOpacity={isActive ? 0.6 : 0.15}
                                    strokeLinecap="round" />
                                {isActive && gap > 0.1 && (
                                    <text x={cx + 6} y={(cyT + cyV) / 2 + 3} fontSize={6} fill="rgba(255,255,255,0.4)" fontFamily="monospace">
                                        +{gap.toFixed(2)}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Data points */}
                    {sorted.map((m, i) => {
                        const cx = toX(m.total_params);
                        const cyT = toY(m.final_train_loss);
                        const cyV = toY(m.final_val_loss);
                        const isActive = hovered === i || selected === i;
                        const isBest = m.label === bestVal.label;
                        const color = ctxColor(m.config.context_size);

                        return (
                            <g key={m.label} className="cursor-pointer"
                                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                                onClick={() => setSelected(selected === i ? null : i)}>
                                {/* Train dot */}
                                <circle cx={cx} cy={cyT} r={isActive ? 4 : 2.5}
                                    fill="none" stroke={color} strokeWidth={1.5}
                                    strokeOpacity={isActive ? 0.8 : 0.3} strokeDasharray="2 1" />
                                {/* Val dot */}
                                <circle cx={cx} cy={cyV} r={isActive ? 6 : 3.5}
                                    fill={color} fillOpacity={isActive ? 0.9 : 0.5}
                                    stroke={isActive ? "white" : "none"} strokeWidth={1} strokeOpacity={0.3} />
                                {isBest && (
                                    <text x={cx} y={cyV + (isActive ? 14 : 10)} textAnchor="middle"
                                        fontSize={7} fill="#fbbf24" fontFamily="monospace" fontWeight="bold">★ best</text>
                                )}
                            </g>
                        );
                    })}

                    {/* Axis labels */}
                    <text x={px + plotW / 2} y={H - 4} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.12)" fontFamily="monospace">
                        Total Parameters (log scale) →
                    </text>
                    <text x={6} y={py + plotH / 2} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.12)" fontFamily="monospace"
                        transform={`rotate(-90 6 ${py + plotH / 2})`}>Loss ↓</text>

                    {/* Legend */}
                    <circle cx={px + 6} cy={py + 6} r={3} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeDasharray="2 1" />
                    <text x={px + 12} y={py + 9} fontSize={6} fill="rgba(255,255,255,0.2)" fontFamily="monospace">train</text>
                    <circle cx={px + 40} cy={py + 6} r={3} fill="rgba(255,255,255,0.3)" />
                    <text x={px + 46} y={py + 9} fontSize={6} fill="rgba(255,255,255,0.2)" fontFamily="monospace">val</text>
                    <line x1={px + 64} y1={py + 3} x2={px + 64} y2={py + 9} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
                    <text x={px + 68} y={py + 9} fontSize={6} fill="rgba(255,255,255,0.2)" fontFamily="monospace">gap</text>
                </svg>
            </div>

            {/* Hover/selected detail */}
            <AnimatePresence mode="wait">
                {activeModel && (
                    <motion.div
                        key={activeModel.label}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ctxColor(activeModel.config.context_size) }} />
                                <span className="text-[10px] font-mono font-bold text-white/60">
                                    H={activeModel.config.hidden_size} · L={activeModel.config.num_layers} · ctx={activeModel.config.context_size} · E={activeModel.config.emb_dim}
                                </span>
                            </div>
                            <span className="text-[8px] font-mono text-white/20">{fmtParams(activeModel.total_params)} params</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                                <div className="text-xs font-mono font-bold text-emerald-400">{activeModel.final_train_loss.toFixed(3)}</div>
                                <div className="text-[7px] font-mono text-white/20">Train Loss</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-mono font-bold" style={{ color: ctxColor(activeModel.config.context_size) }}>
                                    {activeModel.final_val_loss.toFixed(3)}
                                </div>
                                <div className="text-[7px] font-mono text-white/20">Val Loss</div>
                            </div>
                            <div className="text-center">
                                {(() => {
                                    const gap = activeModel.final_val_loss - activeModel.final_train_loss;
                                    return (
                                        <>
                                            <div className={`text-xs font-mono font-bold ${gap > 0.5 ? "text-rose-400" : gap > 0.25 ? "text-amber-400" : "text-emerald-400"}`}>
                                                +{gap.toFixed(3)}
                                            </div>
                                            <div className="text-[7px] font-mono text-white/20">Overfit Gap</div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Best vs Worst comparison */}
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">★</span>
                        <span className="text-[9px] font-mono font-bold text-emerald-400">Best Generalization</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-emerald-400">{bestVal.final_val_loss.toFixed(3)}</div>
                    <div className="text-[8px] font-mono text-white/20 space-y-0.5">
                        <div>ctx={bestVal.config.context_size} · H={bestVal.config.hidden_size} · L={bestVal.config.num_layers}</div>
                        <div>{fmtParams(bestVal.total_params)} params · gap +{(bestVal.final_val_loss - bestVal.final_train_loss).toFixed(2)}</div>
                    </div>
                </div>
                <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.03] p-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">💀</span>
                        <span className="text-[9px] font-mono font-bold text-rose-400">Worst Overfitting</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-rose-400">+{(worstOverfit.final_val_loss - worstOverfit.final_train_loss).toFixed(2)}</div>
                    <div className="text-[8px] font-mono text-white/20 space-y-0.5">
                        <div>ctx={worstOverfit.config.context_size} · H={worstOverfit.config.hidden_size} · L={worstOverfit.config.num_layers}</div>
                        <div>train={worstOverfit.final_train_loss.toFixed(2)} val={worstOverfit.final_val_loss.toFixed(2)} · {fmtParams(worstOverfit.total_params)}</div>
                    </div>
                </div>
            </div>

            {/* Overfitting gap bars — sorted by gap */}
            <div className="space-y-1">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-wider">Overfitting gap per model (sorted)</span>
                {[...sorted].sort((a, b) => (b.final_val_loss - b.final_train_loss) - (a.final_val_loss - a.final_train_loss)).map((m, i) => {
                    const gap = m.final_val_loss - m.final_train_loss;
                    const maxGap = worstOverfit.final_val_loss - worstOverfit.final_train_loss;
                    const pct = maxGap > 0 ? (gap / maxGap) * 100 : 0;
                    return (
                        <div key={m.label} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ctxColor(m.config.context_size) }} />
                            <span className="text-[7px] font-mono text-white/15 w-6 text-right flex-shrink-0">ctx{m.config.context_size}</span>
                            <div className="flex-1 h-2.5 rounded-full bg-white/[0.03] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: gap > 0.5 ? "#ef4444" : gap > 0.25 ? "#f59e0b" : "#22c55e" }}
                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                    transition={{ delay: i * 0.04, duration: 0.5 }}
                                />
                            </div>
                            <span className="text-[7px] font-mono text-white/20 w-8 text-right flex-shrink-0">+{gap.toFixed(2)}</span>
                        </div>
                    );
                })}
            </div>

            {/* The paradox insight */}
            <div className="rounded-xl border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-4 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-base">🧱</span>
                    <span className="text-[10px] font-mono font-bold text-amber-300/70">The MLP Wall</span>
                </div>
                <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                    We threw <span className="text-white/50 font-bold">everything</span> at this: 250× more parameters ({fmtParams(sorted[0]?.total_params)} → {fmtParams(sorted[sorted.length - 1]?.total_params)}),
                    deeper networks, wider embeddings, longer context. The train loss plummeted to <span className="text-emerald-400/60 font-bold">{bestTrainModel.final_train_loss.toFixed(2)}</span>...
                    but val loss <span className="text-rose-400/60 font-bold">refused to go below ~{bestVal.final_val_loss.toFixed(2)}</span>.
                </p>
                <p className="text-[9px] font-mono text-white/20 leading-relaxed">
                    The bigger the context window, the worse the overfitting. ctx=128 models memorize perfectly (train=0.94) but generalize terribly (val=1.84).
                    This isn&apos;t a training problem — it&apos;s an <span className="text-amber-400/50 font-bold">architecture</span> problem.
                    The MLP fundamentally can&apos;t learn from context the way we need it to.
                </p>
            </div>

            <p className="text-[7px] font-mono text-white/10 text-center">
                {models.length} models · Kaiming + BN + Residual · 100K steps · Click/hover for details
            </p>
        </div>
    );
}
