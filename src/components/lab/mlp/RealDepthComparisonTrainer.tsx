"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   RealDepthComparisonTrainer
   Rich depth comparison with overlaid loss curves,
   comparison cards, generated text gallery, stats.
   Fetches from /api/v1/mlp/depth-comparison.
   ───────────────────────────────────────────── */

/* ─── Types ─── */
interface LossPoint { step: number; value: number }
interface DepthModelAPI {
    label: string;
    config: {
        num_layers: number;
        emb_dim: number;
        hidden_size: number;
        context_size: number;
        learning_rate: number;
        max_steps: number;
        batch_size: number;
    };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    train_time_sec: number;
    diverged: boolean;
    expected_uniform_loss?: number;
    techniques: { init_strategy: string; use_batchnorm: boolean; use_residual: boolean };
    generated_samples: string[];
    loss_curve: { train: LossPoint[]; val: LossPoint[] };
}

/* ─── Fallback data ─── */
function mockCurve(final: number): LossPoint[] {
    return Array.from({ length: 80 }, (_, i) => ({
        step: (i + 1) * 1000,
        value: 3.3 - (3.3 - final) * (1 - Math.exp(-i / 20)),
    }));
}
const FALLBACK_MODELS: DepthModelAPI[] = [
    { label: "depth_L1", config: { num_layers: 1, emb_dim: 10, hidden_size: 128, context_size: 4, learning_rate: 0.001, max_steps: 80000, batch_size: 64 }, final_train_loss: 1.772, final_val_loss: 1.845, total_params: 9140, train_time_sec: 288, diverged: false, techniques: { init_strategy: "random", use_batchnorm: false, use_residual: false }, generated_samples: ["the mont and the sain.t ofed the kin"], loss_curve: { train: mockCurve(1.772), val: mockCurve(1.845) } },
    { label: "depth_L3", config: { num_layers: 3, emb_dim: 10, hidden_size: 128, context_size: 4, learning_rate: 0.001, max_steps: 80000, batch_size: 64 }, final_train_loss: 1.618, final_val_loss: 1.871, total_params: 42164, train_time_sec: 389, diverged: false, techniques: { init_strategy: "random", use_batchnorm: false, use_residual: false }, generated_samples: [], loss_curve: { train: mockCurve(1.618), val: mockCurve(1.871) } },
    { label: "depth_L5", config: { num_layers: 5, emb_dim: 10, hidden_size: 128, context_size: 4, learning_rate: 0.001, max_steps: 80000, batch_size: 64 }, final_train_loss: 1.502, final_val_loss: 1.638, total_params: 75188, train_time_sec: 420, diverged: false, techniques: { init_strategy: "random", use_batchnorm: false, use_residual: false }, generated_samples: [], loss_curve: { train: mockCurve(1.502), val: mockCurve(1.638) } },
    { label: "depth_L6", config: { num_layers: 6, emb_dim: 10, hidden_size: 128, context_size: 4, learning_rate: 0.001, max_steps: 80000, batch_size: 64 }, final_train_loss: 1.665, final_val_loss: 1.773, total_params: 91700, train_time_sec: 450, diverged: false, techniques: { init_strategy: "random", use_batchnorm: false, use_residual: false }, generated_samples: [], loss_curve: { train: mockCurve(1.665), val: mockCurve(1.773) } },
];

/* ─── Constants ─── */
const LAYER_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];
const LAYER_LABELS_MAP: Record<number, string> = { 1: "1 layer", 2: "2 layers", 3: "3 layers", 4: "4 layers", 5: "5 layers", 6: "6 layers", 8: "8 layers", 12: "12 layers", 16: "16 layers" };

/* ─── Helpers ─── */
function fmtParams(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function subsample(arr: LossPoint[], maxPts: number): LossPoint[] {
    if (arr.length <= maxPts) return arr;
    const step = Math.ceil(arr.length / maxPts);
    const result: LossPoint[] = [];
    for (let i = 0; i < arr.length; i += step) result.push(arr[i]);
    if (result[result.length - 1] !== arr[arr.length - 1]) result.push(arr[arr.length - 1]);
    return result;
}

type ViewTab = "curves" | "cards" | "text";

/* ─── Main Component ─── */
export function RealDepthComparisonTrainer() {
    const [models, setModels] = useState<DepthModelAPI[]>(FALLBACK_MODELS);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ViewTab>("curves");
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [showTrain, setShowTrain] = useState(true);
    const [showVal, setShowVal] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/v1/mlp/depth-comparison");
                if (!res.ok) throw new Error("API unavailable");
                const data = await res.json();
                const ms = data?.models ?? data;
                if (!cancelled && Array.isArray(ms) && ms.length > 0) {
                    setModels(ms.sort((a: DepthModelAPI, b: DepthModelAPI) =>
                        (a.config?.num_layers ?? 0) - (b.config?.num_layers ?? 0)));
                }
            } catch { /* fallback */ }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    /* ─── Derived stats (skip diverged) ─── */
    const trainable = useMemo(() => models.filter(m => !m.diverged && isFinite(m.final_val_loss)), [models]);
    const diverged = useMemo(() => models.filter(m => m.diverged || !isFinite(m.final_val_loss)), [models]);
    const stats = useMemo(() => {
        const validIndices = models.map((m, i) => (!m.diverged && isFinite(m.final_val_loss)) ? i : -1).filter(i => i >= 0);
        const bestIdx = validIndices.length > 0 ? validIndices.reduce((bi, i) => models[i].final_val_loss < models[bi].final_val_loss ? i : bi, validIndices[0]) : 0;
        const worstIdx = validIndices.length > 0 ? validIndices.reduce((wi, i) => models[i].final_val_loss > models[wi].final_val_loss ? i : wi, validIndices[0]) : 0;
        const gaps = models.map(m => (!m.diverged && isFinite(m.final_val_loss)) ? m.final_val_loss - m.final_train_loss : 0);
        const maxGapIdx = validIndices.length > 0 ? validIndices.reduce((gi, i) => gaps[i] > gaps[gi] ? i : gi, validIndices[0]) : 0;
        return { bestIdx, worstIdx, maxGapIdx, gaps };
    }, [models]);

    /* ─── Chart dimensions ─── */
    const W = 520, H = 220, px = 48, py = 18, pr = 14, pb = 28;
    const plotW = W - px - pr, plotH = H - py - pb;

    /* ─── Chart scales (only trainable models) ─── */
    const chartData = useMemo(() => {
        const allVals: number[] = [];
        const maxStep = Math.max(...trainable.map(m =>
            Math.max(
                m.loss_curve.train.length > 0 ? m.loss_curve.train[m.loss_curve.train.length - 1].step : 0,
                m.loss_curve.val.length > 0 ? m.loss_curve.val[m.loss_curve.val.length - 1].step : 0,
            )
        ), 80000);
        trainable.forEach(m => {
            if (showTrain) m.loss_curve.train.forEach(p => { if (isFinite(p.value)) allVals.push(p.value); });
            if (showVal) m.loss_curve.val.forEach(p => { if (isFinite(p.value)) allVals.push(p.value); });
        });
        if (allVals.length === 0) return { yMin: 1.4, yMax: 3.4, maxStep: 80000 };
        const sorted = [...allVals].sort((a, b) => a - b);
        const p5 = sorted[Math.floor(sorted.length * 0.02)];
        const p95 = sorted[Math.floor(sorted.length * 0.98)];
        const margin = (p95 - p5) * 0.1;
        return { yMin: Math.max(1.0, p5 - margin), yMax: Math.min(4.0, p95 + margin), maxStep };
    }, [trainable, showTrain, showVal]);

    const toX = (step: number) => px + (step / chartData.maxStep) * plotW;
    const toY = (val: number) => py + (1 - (val - chartData.yMin) / (chartData.yMax - chartData.yMin)) * plotH;

    /* ─── Y-axis grid ─── */
    const yTicks = useMemo(() => {
        const ticks: number[] = [];
        const step = 0.2;
        let v = Math.ceil(chartData.yMin / step) * step;
        while (v <= chartData.yMax) { ticks.push(v); v += step; }
        return ticks;
    }, [chartData]);

    /* ─── X-axis ticks ─── */
    const xTicks = useMemo(() => {
        const ticks: number[] = [];
        const step = 20000;
        for (let v = 0; v <= chartData.maxStep; v += step) ticks.push(v);
        return ticks;
    }, [chartData]);

    const uniformLoss = models[0]?.expected_uniform_loss ?? Math.log(28);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400/30 border-t-violet-400" />
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 space-y-3">
            {/* ─── Tab bar ─── */}
            <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-1 w-fit">
                {([["curves", "📈 Loss Curves"], ["cards", "📊 Compare"], ["text", "📝 Text"]] as [ViewTab, string][]).map(([tab, label]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${activeTab === tab
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                            : "text-white/30 hover:text-white/50 border border-transparent"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ═══ TAB: LOSS CURVES ═══ */}
            {activeTab === "curves" && (
                <div className="space-y-3">
                    {/* Toggle buttons */}
                    <div className="flex items-center gap-3 text-[9px] font-mono">
                        <button
                            onClick={() => setShowTrain(v => !v)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${showTrain ? "border-white/20 text-white/60 bg-white/[0.04]" : "border-white/[0.04] text-white/20"
                                }`}
                        >
                            <span className="w-3 h-0.5 rounded" style={{ background: showTrain ? "#a78bfa" : "#444" }} />
                            Train
                        </button>
                        <button
                            onClick={() => setShowVal(v => !v)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${showVal ? "border-white/20 text-white/60 bg-white/[0.04]" : "border-white/[0.04] text-white/20"
                                }`}
                        >
                            <span className="w-3 h-0.5 rounded" style={{ background: showVal ? "#fff" : "#444" }} />
                            Validation
                        </button>
                        <span className="text-white/15 ml-2">
                            {models.length} models · {models[0]?.config?.hidden_size ?? 128}H · emb={models[0]?.config?.emb_dim ?? 10} · ctx={models[0]?.config?.context_size ?? 4} · no stability
                        </span>
                    </div>

                    {/* SVG chart */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                            {/* Grid lines */}
                            {yTicks.map(v => (
                                <g key={v}>
                                    <line x1={px} y1={toY(v)} x2={px + plotW} y2={toY(v)} stroke="white" strokeOpacity={0.04} />
                                    <text x={px - 6} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">
                                        {v.toFixed(1)}
                                    </text>
                                </g>
                            ))}
                            {xTicks.map(v => (
                                <g key={v}>
                                    <line x1={toX(v)} y1={py} x2={toX(v)} y2={py + plotH} stroke="white" strokeOpacity={0.03} />
                                    <text x={toX(v)} y={py + plotH + 14} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.15} fontFamily="monospace">
                                        {v >= 1000 ? `${v / 1000}K` : v}
                                    </text>
                                </g>
                            ))}

                            {/* Random baseline */}
                            {uniformLoss >= chartData.yMin && uniformLoss <= chartData.yMax && (
                                <g>
                                    <line x1={px} y1={toY(uniformLoss)} x2={px + plotW} y2={toY(uniformLoss)}
                                        stroke="#ef4444" strokeOpacity={0.25} strokeDasharray="4 3" />
                                    <text x={px + plotW + 2} y={toY(uniformLoss) + 3} fontSize={6} fill="#ef4444" fillOpacity={0.4} fontFamily="monospace">
                                        random
                                    </text>
                                </g>
                            )}

                            {/* Axis labels */}
                            <text x={px + plotW / 2} y={H - 2} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.15} fontFamily="monospace">
                                Training Steps →
                            </text>
                            <text x={8} y={py + plotH / 2} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.15} fontFamily="monospace"
                                transform={`rotate(-90 8 ${py + plotH / 2})`}>
                                Loss ↓
                            </text>

                            {/* Loss curves */}
                            {models.map((m, i) => {
                                const color = LAYER_COLORS[i % LAYER_COLORS.length];
                                const isSelected = selectedIdx === i;
                                const opacity = selectedIdx === null ? 0.7 : isSelected ? 1 : 0.15;
                                return (
                                    <g key={m.label} className="cursor-pointer" onClick={() => setSelectedIdx(isSelected ? null : i)}>
                                        {showTrain && (
                                            <polyline
                                                points={subsample(m.loss_curve.train, 100).map(p =>
                                                    `${toX(p.step)},${toY(p.value)}`).join(" ")}
                                                fill="none" stroke={color} strokeWidth={isSelected ? 2.5 : 1.5}
                                                strokeOpacity={opacity * 0.6} strokeDasharray="3 2"
                                                strokeLinecap="round" strokeLinejoin="round"
                                            />
                                        )}
                                        {showVal && (
                                            <polyline
                                                points={subsample(m.loss_curve.val, 100).map(p =>
                                                    `${toX(p.step)},${toY(p.value)}`).join(" ")}
                                                fill="none" stroke={color} strokeWidth={isSelected ? 2.5 : 1.5}
                                                strokeOpacity={opacity}
                                                strokeLinecap="round" strokeLinejoin="round"
                                            />
                                        )}
                                        {/* End dot */}
                                        {showVal && m.loss_curve.val.length > 0 && (
                                            <circle
                                                cx={toX(m.loss_curve.val[m.loss_curve.val.length - 1].step)}
                                                cy={toY(m.loss_curve.val[m.loss_curve.val.length - 1].value)}
                                                r={isSelected ? 4 : 3} fill={color} fillOpacity={opacity}
                                            />
                                        )}
                                    </g>
                                );
                            })}

                            {/* Best model star */}
                            {showVal && models[stats.bestIdx]?.loss_curve.val.length > 0 && (() => {
                                const best = models[stats.bestIdx];
                                const lastPt = best.loss_curve.val[best.loss_curve.val.length - 1];
                                return (
                                    <text x={toX(lastPt.step) + 8} y={toY(lastPt.value) + 3}
                                        fontSize={9} fill="#fbbf24" fontFamily="monospace" fontWeight="bold">
                                        ★ best
                                    </text>
                                );
                            })()}
                        </svg>
                    </div>

                    {/* Legend row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-mono">
                        {models.map((m, i) => {
                            const layers = m.config?.num_layers ?? (i + 1);
                            const isSelected = selectedIdx === i;
                            const isBest = i === stats.bestIdx;
                            return (
                                <button
                                    key={m.label}
                                    onClick={() => setSelectedIdx(isSelected ? null : i)}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all ${isSelected ? "bg-white/[0.06] border border-white/10" : "border border-transparent hover:bg-white/[0.03]"
                                        }`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: LAYER_COLORS[i % LAYER_COLORS.length] }} />
                                    <span className={isSelected ? "text-white/70 font-bold" : "text-white/35"}>
                                        {LAYER_LABELS_MAP[layers] ?? `${layers}L`}
                                    </span>
                                    {isBest && <span className="text-amber-400">★</span>}
                                </button>
                            );
                        })}
                        <span className="text-white/10 ml-1">|</span>
                        <span className="text-white/15">dashed = train · solid = val</span>
                    </div>
                </div>
            )}

            {/* ═══ TAB: COMPARISON CARDS ═══ */}
            {activeTab === "cards" && (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        <AnimatePresence>
                            {models.map((m, i) => {
                                const layers = m.config?.num_layers ?? (i + 1);
                                const gap = stats.gaps[i];
                                const isBest = i === stats.bestIdx;
                                const isWorst = i === stats.worstIdx;
                                const color = LAYER_COLORS[i % LAYER_COLORS.length];
                                return (
                                    <motion.div
                                        key={m.label}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08, duration: 0.3 }}
                                        className={`rounded-xl border p-3 flex flex-col gap-1.5 transition-all ${m.diverged ? "border-rose-500/30 bg-rose-500/[0.04] opacity-70"
                                            : isBest ? "border-amber-500/40 bg-amber-500/[0.06] ring-1 ring-amber-500/20"
                                                : isWorst ? "border-red-500/30 bg-red-500/[0.04]"
                                                    : "border-white/[0.06] bg-white/[0.02]"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                                <span className="text-[10px] font-mono font-bold text-white/60">
                                                    {LAYER_LABELS_MAP[layers] ?? `${layers}L`}
                                                </span>
                                            </span>
                                            {isBest && <span className="text-amber-400 text-xs">★</span>}
                                            {m.diverged && <span className="text-rose-400 text-[9px]">✗</span>}
                                            {!m.diverged && isWorst && <span className="text-red-400 text-[9px]">⚠</span>}
                                        </div>

                                        {/* Val loss — big number */}
                                        <div className="text-center py-1">
                                            {m.diverged ? (
                                                <>
                                                    <span className="text-sm font-mono font-black text-rose-400/80">NaN</span>
                                                    <p className="text-[7px] font-mono text-rose-400/40">DIVERGED</p>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-lg font-mono font-black" style={{ color }}>
                                                        {m.final_val_loss.toFixed(3)}
                                                    </span>
                                                    <p className="text-[7px] font-mono text-white/15">val loss</p>
                                                </>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        {!m.diverged ? (
                                            <div className="space-y-0.5 text-[8px] font-mono text-white/25">
                                                <div className="flex justify-between">
                                                    <span>train</span>
                                                    <span className="text-white/40">{m.final_train_loss.toFixed(3)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>overfit gap</span>
                                                    <span className={gap > 0.2 ? "text-red-400/60 font-bold" : "text-white/40"}>
                                                        {gap >= 0 ? "+" : ""}{gap.toFixed(3)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>params</span>
                                                    <span className="text-white/40">{fmtParams(m.total_params)}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-[8px] font-mono text-rose-400/40 text-center py-1">
                                                <p>Gradients exploded</p>
                                                <p className="text-white/20 mt-0.5">{fmtParams(m.total_params)} params wasted</p>
                                            </div>
                                        )}

                                        {/* Overfitting bar */}
                                        {!m.diverged && (
                                            <div className="mt-1">
                                                <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(100, (gap / 0.4) * 100)}%`,
                                                            background: gap > 0.25 ? "#ef4444" : gap > 0.15 ? "#f59e0b" : "#22c55e",
                                                            opacity: 0.6,
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-[6px] font-mono text-white/10 mt-0.5 text-center">overfit</p>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Insights panel */}
                    <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-3 space-y-2">
                        <p className="text-[10px] font-mono font-bold text-violet-300/70">Key Insights</p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[9px] font-mono">
                            <div className="rounded-lg bg-amber-500/[0.05] border border-amber-500/15 p-2">
                                <p className="text-amber-300/60 font-bold">🏆 Sweet Spot</p>
                                <p className="text-white/40">
                                    {LAYER_LABELS_MAP[models[stats.bestIdx]?.config?.num_layers ?? 1]} — val {models[stats.bestIdx]?.final_val_loss.toFixed(3)}
                                </p>
                                <p className="text-white/20 mt-0.5">Best depth before instability kicks in</p>
                            </div>
                            <div className="rounded-lg bg-rose-500/[0.05] border border-rose-500/15 p-2">
                                <p className="text-rose-300/60 font-bold">💀 Depth Wall</p>
                                <p className="text-white/40">
                                    {diverged.length} model{diverged.length !== 1 ? "s" : ""} completely diverged
                                </p>
                                <p className="text-white/20 mt-0.5">8+ layers with random init = NaN loss</p>
                            </div>
                            <div className="rounded-lg bg-red-500/[0.05] border border-red-500/15 p-2">
                                <p className="text-red-300/60 font-bold">📉 Overfitting</p>
                                <p className="text-white/40">
                                    {LAYER_LABELS_MAP[models[stats.maxGapIdx]?.config?.num_layers ?? 1]} — gap +{stats.gaps[stats.maxGapIdx]?.toFixed(3)}
                                </p>
                                <p className="text-white/20 mt-0.5">Train loss drops but val doesn&apos;t follow</p>
                            </div>
                            <div className="rounded-lg bg-violet-500/[0.05] border border-violet-500/15 p-2">
                                <p className="text-violet-300/60 font-bold">⚡ Diminishing Returns</p>
                                <p className="text-white/40">
                                    {fmtParams(trainable[0]?.total_params ?? 0)} → {fmtParams(trainable[trainable.length - 1]?.total_params ?? 0)}
                                </p>
                                <p className="text-white/20 mt-0.5">{((trainable[trainable.length - 1]?.total_params ?? 1) / (trainable[0]?.total_params ?? 1)).toFixed(0)}× params for marginal gain</p>
                            </div>
                        </div>
                    </div>

                    {/* Pedagogical explanation */}
                    <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-3 space-y-1.5">
                        <p className="text-[9px] font-mono text-amber-300/60 font-bold">Why does this happen?</p>
                        <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                            Without stability techniques (Kaiming init, BatchNorm, residual connections), gradients must travel through every layer via the chain rule.
                            With random initialization, each layer multiplies gradients by random weights &mdash; as depth grows, gradients either shrink (vanish) or explode.
                            This is the <span className="text-white/50 font-bold">vanishing/exploding gradient problem</span>.
                        </p>
                        <p className="text-[9px] font-mono text-white/20 leading-relaxed">
                            There&apos;s a <span className="text-white/40 font-bold">sweet spot</span>: 5 layers beats both shallower (not enough capacity) and deeper (gradient degradation).
                            Beyond that, more layers with random init actually hurt &mdash; 6L trains worse than 5L despite having 22% more parameters.
                            Deeper models (8+ layers) would diverge entirely without techniques we&apos;ll explore next.
                        </p>
                    </div>

                    {/* LR inconsistency note */}
                    {(() => {
                        const lrs = new Set(trainable.map(m => m.config?.learning_rate));
                        if (lrs.size <= 1) return null;
                        const outliers = trainable.filter(m => m.config?.learning_rate !== 0.001);
                        return (
                            <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.02] px-3 py-2">
                                <p className="text-[8px] font-mono text-amber-400/50">
                                    <span className="font-bold">Note:</span>{" "}
                                    {outliers.map(m => `${LAYER_LABELS_MAP[m.config?.num_layers ?? 0] ?? m.label} (LR=${m.config?.learning_rate})`).join(", ")}{" "}
                                    used a different learning rate than the rest (LR=0.001).
                                    Their higher loss is partly due to the LR mismatch, not just depth.
                                    For a perfectly fair comparison, all models should share the same hyperparameters except the one being tested.
                                </p>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ═══ TAB: GENERATED TEXT ═══ */}
            {activeTab === "text" && (
                <div className="space-y-2">
                    {models.map((m, i) => {
                        const layers = m.config?.num_layers ?? (i + 1);
                        const color = LAYER_COLORS[i % LAYER_COLORS.length];
                        const isBest = i === stats.bestIdx;
                        const samples = m.generated_samples ?? [];
                        return (
                            <motion.div
                                key={m.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className={`rounded-xl border p-3 ${isBest ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-white/[0.06] bg-white/[0.015]"
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                    <span className="text-[10px] font-mono font-bold text-white/60">
                                        {LAYER_LABELS_MAP[layers] ?? `${layers}L`}
                                    </span>
                                    <span className="text-[8px] font-mono text-white/20">
                                        val={isFinite(m.final_val_loss) ? m.final_val_loss.toFixed(3) : "DIVERGED"} · {fmtParams(m.total_params)}
                                    </span>
                                    {isBest && <span className="text-amber-400 text-[9px] font-bold ml-auto">★ BEST</span>}
                                </div>
                                <div className="space-y-1.5">
                                    {samples.slice(0, 3).map((s, si) => (
                                        <div key={si}
                                            className={`text-[10px] font-mono leading-relaxed px-2.5 py-2 rounded-lg border ${isBest
                                                ? "border-amber-500/10 bg-amber-500/[0.02] text-amber-200/70"
                                                : "border-white/[0.04] bg-white/[0.01] text-white/35"
                                                }`}
                                        >
                                            &ldquo;{s.trim().slice(0, 120)}{s.trim().length > 120 ? "…" : ""}&rdquo;
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ─── Bottom stats bar ─── */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[8px] font-mono text-white/20 pt-1">
                <span>emb_dim={models[0]?.config?.emb_dim ?? 10}</span>
                <span>hidden={models[0]?.config?.hidden_size ?? 128}</span>
                <span>ctx={models[0]?.config?.context_size ?? 4}</span>
                <span>lr={models[0]?.config?.learning_rate ?? 0.001}</span>
                <span>steps={((models[0]?.config?.max_steps ?? 80000) / 1000).toFixed(0)}K</span>
                <span className="text-violet-400/30">init=random · no BN · no residual</span>
            </div>
        </div>
    );
}
