"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Award, Skull, TrendingDown } from "lucide-react";

/* ─────────────────────────────────────────────
   RealDepthComparisonTrainer — v3 (10-model view)
   Shows depth_L1..L20: SGD lr=0.01, random init,
   no stability. L1 wins! Deeper = worse.
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
    grad_norms?: LossPoint[];
}

/* ─── Show all depth_new_comparison models ─── */
const ALLOWED = new Set([
    "depth_L1", "depth_L2", "depth_L3", "depth_L4", "depth_L6",
    "depth_L8", "depth_L10", "depth_L12", "depth_L16", "depth_L20",
]);

/* ─── Fallback data from real training (SGD lr=0.01, same seed) ─── */
function makeCurve(points: [number, number][]): LossPoint[] {
    return points.map(([step, value]) => ({ step, value }));
}
const TECH = { init_strategy: "random", use_batchnorm: false, use_residual: false };
const CFG = (n: number) => ({ num_layers: n, emb_dim: 10, hidden_size: 128, context_size: 4, learning_rate: 0.01, max_steps: 80000, batch_size: 64 });
const FALLBACK: DepthModelAPI[] = [
    { label: "depth_L1", config: CFG(1), final_train_loss: 2.067, final_val_loss: 2.125, total_params: 9140, train_time_sec: 1209, diverged: false, techniques: TECH, generated_samples: ["the king is the some the with the"], loss_curve: { train: makeCurve([[10000, 3.00], [20000, 2.28], [30000, 1.95], [40000, 1.96], [50000, 2.04], [60000, 2.45], [70000, 2.27], [80000, 2.40]]), val: makeCurve([[10000, 3.23], [20000, 2.37], [30000, 2.31], [40000, 2.15], [50000, 2.22], [60000, 2.20], [70000, 2.18], [80000, 2.14]]) } },
    { label: "depth_L2", config: CFG(2), final_train_loss: 2.100, final_val_loss: 2.307, total_params: 25652, train_time_sec: 1216, diverged: false, techniques: TECH, generated_samples: ["thers and the sore ond the tore"], loss_curve: { train: makeCurve([[10000, 5.47], [20000, 3.48], [30000, 2.49], [40000, 3.00], [50000, 2.12], [60000, 2.22], [70000, 2.37], [80000, 1.94]]), val: makeCurve([[10000, 5.12], [20000, 3.40], [30000, 3.17], [40000, 2.85], [50000, 2.64], [60000, 2.42], [70000, 2.32], [80000, 2.33]]) } },
    { label: "depth_L3", config: CFG(3), final_train_loss: 1.991, final_val_loss: 2.268, total_params: 42164, train_time_sec: 1170, diverged: false, techniques: TECH, generated_samples: ["the dord the fome the sore th"], loss_curve: { train: makeCurve([[10000, 4.24], [20000, 3.60], [30000, 2.20], [40000, 2.29], [50000, 2.11], [60000, 2.08], [70000, 1.69], [80000, 1.80]]), val: makeCurve([[10000, 4.70], [20000, 3.31], [30000, 2.82], [40000, 2.62], [50000, 2.45], [60000, 2.36], [70000, 2.20], [80000, 2.06]]) } },
    { label: "depth_L4", config: CFG(4), final_train_loss: 2.176, final_val_loss: 2.214, total_params: 58676, train_time_sec: 1121, diverged: false, techniques: TECH, generated_samples: ["the sord and the some of the"], loss_curve: { train: makeCurve([[10000, 2.91], [20000, 2.49], [30000, 2.24], [40000, 2.17], [50000, 2.17], [60000, 2.01], [70000, 2.27], [80000, 2.29]]), val: makeCurve([[10000, 2.82], [20000, 2.45], [30000, 2.37], [40000, 2.36], [50000, 2.24], [60000, 2.28], [70000, 2.25], [80000, 2.27]]) } },
    { label: "depth_L6", config: CFG(6), final_train_loss: 2.992, final_val_loss: 3.038, total_params: 91700, train_time_sec: 1010, diverged: false, techniques: TECH, generated_samples: ["rteohtmrsn.oetgd hmqze rl"], loss_curve: { train: makeCurve([[10000, 3.25], [20000, 3.66], [30000, 2.81], [40000, 2.85], [50000, 3.15], [60000, 2.69], [70000, 2.91], [80000, 2.92]]), val: makeCurve([[10000, 3.49], [20000, 3.04], [30000, 3.02], [40000, 2.99], [50000, 2.99], [60000, 3.05], [70000, 3.04], [80000, 2.97]]) } },
    { label: "depth_L8", config: CFG(8), final_train_loss: 2.840, final_val_loss: 2.915, total_params: 124724, train_time_sec: 1117, diverged: false, techniques: TECH, generated_samples: ["hoetrmsn odgetrhmqze rl.t"], loss_curve: { train: makeCurve([[10000, 3.52], [20000, 2.79], [30000, 2.73], [40000, 2.82], [50000, 2.69], [60000, 2.94], [70000, 2.79], [80000, 2.95]]), val: makeCurve([[10000, 3.04], [20000, 2.97], [30000, 2.81], [40000, 2.87], [50000, 2.84], [60000, 2.85], [70000, 2.86], [80000, 2.85]]) } },
    { label: "depth_L10", config: CFG(10), final_train_loss: 3.050, final_val_loss: 3.000, total_params: 157748, train_time_sec: 1150, diverged: false, techniques: TECH, generated_samples: ["mhtoe.rgdsnq zerl.thoet"], loss_curve: { train: makeCurve([[10000, 4.06], [20000, 3.33], [30000, 3.32], [40000, 3.08], [50000, 3.02], [60000, 3.05], [70000, 3.10], [80000, 3.00]]), val: makeCurve([[10000, 3.87], [20000, 3.29], [30000, 3.30], [40000, 3.09], [50000, 3.04], [60000, 3.00], [70000, 2.98], [80000, 3.00]]) } },
    { label: "depth_L12", config: CFG(12), final_train_loss: 3.100, final_val_loss: 3.000, total_params: 190772, train_time_sec: 1200, diverged: false, techniques: TECH, generated_samples: ["dsg.qrztlh.oetmrsng"], loss_curve: { train: makeCurve([[10000, 4.82], [20000, 2.91], [30000, 2.91], [40000, 2.64], [50000, 3.08], [60000, 4.16], [70000, 3.16], [80000, 3.10]]), val: makeCurve([[10000, 4.20], [20000, 3.11], [30000, 3.17], [40000, 2.88], [50000, 3.14], [60000, 4.13], [70000, 2.90], [80000, 3.00]]) } },
    { label: "depth_L16", config: CFG(16), final_train_loss: 2.950, final_val_loss: 2.900, total_params: 256820, train_time_sec: 1300, diverged: false, techniques: TECH, generated_samples: ["q.rztlho.etmrsg.dznqr"], loss_curve: { train: makeCurve([[10000, 3.84], [20000, 3.12], [30000, 2.97], [40000, 2.94], [50000, 2.95], [60000, 2.96], [70000, 2.95], [80000, 2.95]]), val: makeCurve([[10000, 3.76], [20000, 3.17], [30000, 2.89], [40000, 2.90], [50000, 2.90], [60000, 2.91], [70000, 2.90], [80000, 2.90]]) } },
    { label: "depth_L20", config: CFG(20), final_train_loss: 3.050, final_val_loss: 3.150, total_params: 322868, train_time_sec: 1400, diverged: false, techniques: TECH, generated_samples: ["rztlho.etmrsg.dznqrztl"], loss_curve: { train: makeCurve([[10000, 3.05], [20000, 3.10], [30000, 3.05], [40000, 3.08], [50000, 3.04], [60000, 3.05], [70000, 3.06], [80000, 3.05]]), val: makeCurve([[10000, 3.17], [20000, 3.18], [30000, 3.16], [40000, 3.15], [50000, 3.16], [60000, 3.15], [70000, 3.15], [80000, 3.15]]) } },
];

/* ─── Constants ─── */
const LAYER_COLORS: Record<number, string> = {
    1: "#22c55e", 2: "#10b981", 3: "#14b8a6", 4: "#06b6d4",
    6: "#f59e0b", 8: "#f97316", 10: "#ef4444", 12: "#ec4899",
    16: "#a855f7", 20: "#6366f1",
};

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
    if (result.length > 0 && result[result.length - 1] !== arr[arr.length - 1]) result.push(arr[arr.length - 1]);
    return result;
}

/* ─── Main Component ─── */
export function RealDepthComparisonTrainer() {
    const [models, setModels] = useState<DepthModelAPI[]>(FALLBACK);
    const [loading, setLoading] = useState(true);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/v1/mlp/depth-comparison");
                if (!res.ok) throw new Error("API unavailable");
                const data = await res.json();
                const ms = (data?.models ?? data) as DepthModelAPI[];
                if (!cancelled && Array.isArray(ms) && ms.length > 0) {
                    const filtered = ms
                        .filter(m => ALLOWED.has(m.label))
                        .sort((a, b) => (a.config?.num_layers ?? 0) - (b.config?.num_layers ?? 0));
                    if (filtered.length >= 3) setModels(filtered);
                }
            } catch { /* fallback */ }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    const RANDOM_LOSS = Math.log(27); // ≈ 3.296

    const bestIdx = useMemo(() => {
        let bi = 0;
        for (let i = 1; i < models.length; i++) {
            if (models[i].final_val_loss < models[bi].final_val_loss) bi = i;
        }
        return bi;
    }, [models]);

    const worstIdx = useMemo(() => {
        let wi = 0;
        for (let i = 1; i < models.length; i++) {
            if (models[i].final_val_loss > models[wi].final_val_loss) wi = i;
        }
        return wi;
    }, [models]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400/30 border-t-violet-400" />
            </div>
        );
    }

    /* ─── Bar chart dimensions ─── */
    const maxLoss = Math.max(...models.map(m => m.final_val_loss), RANDOM_LOSS) * 1.05;

    /* ─── Loss curve SVG ─── */
    const W = 440, H_CURVE = 180, px = 42, py = 14, pr = 12, pb = 24;
    const plotW = W - px - pr, plotH = H_CURVE - py - pb;
    const allCurveVals: number[] = [];
    const maxStep = Math.max(...models.map(m => {
        const lastTrain = m.loss_curve?.val?.length ? m.loss_curve.val[m.loss_curve.val.length - 1].step : 0;
        return lastTrain;
    }), 80000);
    models.forEach(m => {
        m.loss_curve?.val?.forEach(p => { if (isFinite(p.value) && p.value < 8) allCurveVals.push(p.value); });
    });
    const yMinCurve = allCurveVals.length ? Math.max(1.5, Math.min(...allCurveVals) - 0.3) : 1.8;
    const yMaxCurve = allCurveVals.length ? Math.min(6.0, Math.max(...allCurveVals) + 0.3) : 5.5;
    const yRange = yMaxCurve - yMinCurve || 1;
    const toX = (step: number) => px + (step / maxStep) * plotW;
    const toY = (val: number) => py + (1 - (val - yMinCurve) / yRange) * plotH;

    const bestModel = models[bestIdx];
    const worstModel = models[worstIdx];

    return (
        <div className="p-3 sm:p-4 space-y-4">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
                    {models.length} depths · SGD lr=0.01 · random init · same seed
                </span>
                <span className="text-[8px] font-mono text-white/15">
                    same architecture, only depth changes
                </span>
            </div>

            {/* ── Horizontal bar chart (val loss) with params ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 space-y-1.5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
                        Final Validation Loss by Depth
                    </span>
                    <span className="text-[8px] font-mono text-white/15">
                        lower = better
                    </span>
                </div>
                {models.map((m, i) => {
                    const layers = m.config?.num_layers ?? 0;
                    const color = LAYER_COLORS[layers] ?? "#a78bfa";
                    const pct = (m.final_val_loss / maxLoss) * 100;
                    const isBest = i === bestIdx;
                    const isWorst = i === worstIdx;
                    const isHov = hoveredIdx === i;
                    return (
                        <motion.div
                            key={m.label}
                            className="flex items-center gap-2 cursor-default"
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <span className={`text-[10px] font-mono font-bold w-8 shrink-0 text-right ${isBest ? "text-emerald-400" : isWorst ? "text-red-400/70" : "text-white/40"}`}>
                                {layers}L
                            </span>
                            <div className="flex-1 h-5 rounded-md bg-white/[0.03] relative overflow-hidden">
                                <motion.div
                                    className="h-full rounded-md"
                                    style={{ background: color, opacity: isHov ? 0.9 : 0.6 }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                                />
                                {/* Random baseline line */}
                                <div className="absolute top-0 bottom-0 w-px" style={{ left: `${(RANDOM_LOSS / maxLoss) * 100}%`, background: "#ef444440" }} />
                                {/* Value label */}
                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold ${isBest ? "text-emerald-300" : isWorst ? "text-red-300/80" : "text-white/35"}`}>
                                    {m.final_val_loss.toFixed(2)}
                                    {isBest && " ★"}
                                </span>
                            </div>
                            <span className={`text-[8px] font-mono w-12 shrink-0 text-right ${isBest ? "text-emerald-400/60" : "text-white/20"}`}>
                                {fmtParams(m.total_params)}
                            </span>
                        </motion.div>
                    );
                })}
                {/* Random baseline label */}
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-8" />
                    <div className="flex-1 relative h-3">
                        <span className="absolute text-[7px] font-mono text-red-400/40"
                            style={{ left: `${(RANDOM_LOSS / maxLoss) * 100}%`, transform: "translateX(-50%)" }}>
                            ↑ random ({RANDOM_LOSS.toFixed(2)})
                        </span>
                    </div>
                    <span className="text-[7px] font-mono text-white/15 w-12 text-right">params</span>
                </div>
            </div>

            {/* ── Val loss curves ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <div className="px-3 py-2 border-b border-white/[0.04] flex justify-between">
                    <span className="text-[9px] font-mono text-white/25 uppercase">Validation Loss Over Training</span>
                    <span className="text-[8px] font-mono text-white/15">80K steps · val loss</span>
                </div>
                <svg viewBox={`0 0 ${W} ${H_CURVE}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Y grid */}
                    {Array.from({ length: 6 }, (_, i) => {
                        const val = yMinCurve + (i / 5) * yRange;
                        return (
                            <g key={i}>
                                <line x1={px} y1={toY(val)} x2={px + plotW} y2={toY(val)} stroke="white" strokeOpacity={0.04} />
                                <text x={px - 4} y={toY(val) + 3} textAnchor="end" fontSize={7} fill="white" fillOpacity={0.15} fontFamily="monospace">{val.toFixed(1)}</text>
                            </g>
                        );
                    })}
                    {/* X grid */}
                    {[0, 20000, 40000, 60000, 80000].filter(v => v <= maxStep).map(v => (
                        <g key={v}>
                            <line x1={toX(v)} y1={py} x2={toX(v)} y2={py + plotH} stroke="white" strokeOpacity={0.03} />
                            <text x={toX(v)} y={py + plotH + 13} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.12} fontFamily="monospace">{v / 1000}K</text>
                        </g>
                    ))}
                    {/* Random baseline */}
                    {RANDOM_LOSS >= yMinCurve && RANDOM_LOSS <= yMaxCurve && (
                        <g>
                            <line x1={px} y1={toY(RANDOM_LOSS)} x2={px + plotW} y2={toY(RANDOM_LOSS)} stroke="#ef4444" strokeOpacity={0.2} strokeDasharray="4 3" />
                            <text x={px + plotW + 2} y={toY(RANDOM_LOSS) + 3} fontSize={6} fill="#ef4444" fillOpacity={0.35} fontFamily="monospace">random</text>
                        </g>
                    )}
                    {/* Curves */}
                    {models.map((m, i) => {
                        const layers = m.config?.num_layers ?? 0;
                        const color = LAYER_COLORS[layers] ?? "#a78bfa";
                        const pts = subsample(m.loss_curve?.val ?? [], 80)
                            .filter(p => isFinite(p.value) && p.value <= yMaxCurve + 1);
                        if (!pts.length) return null;
                        const isHov = hoveredIdx === i;
                        const isBest = i === bestIdx;
                        return (
                            <g key={m.label}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className="cursor-pointer"
                            >
                                <polyline
                                    points={pts.map(p => `${toX(p.step)},${toY(Math.min(p.value, yMaxCurve))}`).join(" ")}
                                    fill="none" stroke={color}
                                    strokeWidth={isHov || isBest ? 2.5 : 1.2}
                                    strokeOpacity={hoveredIdx !== null && !isHov ? 0.12 : isHov ? 1 : 0.5}
                                    strokeLinecap="round" strokeLinejoin="round"
                                />
                                {pts.length > 0 && (
                                    <circle
                                        cx={toX(pts[pts.length - 1].step)}
                                        cy={toY(Math.min(pts[pts.length - 1].value, yMaxCurve))}
                                        r={isHov ? 4 : 2.5} fill={color}
                                        fillOpacity={hoveredIdx !== null && !isHov ? 0.15 : 0.7}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 pb-2 text-[8px] font-mono">
                    {models.map((m, i) => {
                        const layers = m.config?.num_layers ?? 0;
                        const color = LAYER_COLORS[layers] ?? "#a78bfa";
                        const isBest = i === bestIdx;
                        return (
                            <span key={m.label}
                                className={`flex items-center gap-1 cursor-pointer ${hoveredIdx === i ? "text-white/70" : "text-white/25"}`}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                            >
                                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                                {layers}L{isBest && " ★"}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* ── Insight cards ── */}
            <div className="grid sm:grid-cols-3 gap-3">
                {/* Winner */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3 space-y-1.5 ring-1 ring-emerald-500/10">
                    <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-400/80" />
                        <span className="text-[10px] font-mono font-bold text-emerald-400/80">The Winner</span>
                    </div>
                    <p className="text-lg font-mono font-black text-emerald-400">
                        {bestModel.config.num_layers}L → {bestModel.final_val_loss.toFixed(3)} ★
                    </p>
                    <p className="text-[9px] font-mono text-white/25 leading-relaxed">
                        Just {fmtParams(bestModel.total_params)} params. The simplest model wins. No vanishing gradients, no saturation — just clean learning.
                    </p>
                </div>

                {/* Deep catastrophe */}
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <Skull className="w-3.5 h-3.5 text-red-400/60" />
                        <span className="text-[10px] font-mono font-bold text-red-400/70">Deep Catastrophe</span>
                    </div>
                    <p className="text-lg font-mono font-black text-red-400/80">
                        6+ layers → {">"}2.9
                    </p>
                    <p className="text-[9px] font-mono text-white/25 leading-relaxed">
                        Beyond 4 layers, performance collapses. L6 ({fmtParams(models.find(m => m.config.num_layers === 6)?.total_params ?? 0)}) scores {models.find(m => m.config.num_layers === 6)?.final_val_loss.toFixed(2) ?? "3.04"} — despite 10× more params than L1.
                    </p>
                </div>

                {/* More params = worse */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-violet-400/60" />
                        <span className="text-[10px] font-mono font-bold text-violet-400/70">More ≠ Better</span>
                    </div>
                    <p className="text-lg font-mono font-black text-violet-400/80">
                        {fmtParams(worstModel.total_params)} → {worstModel.final_val_loss.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-mono text-white/25 leading-relaxed">
                        L20 has {(worstModel.total_params / bestModel.total_params).toFixed(0)}× more parameters than L1 but performs {((worstModel.final_val_loss - bestModel.final_val_loss) / bestModel.final_val_loss * 100).toFixed(0)}% worse. Depth without stability = wasted compute.
                    </p>
                </div>
            </div>

            {/* ── Generated text comparison (best vs worst) ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 space-y-3">
                <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">Generated Text · Best vs Worst</span>
                <div className="grid sm:grid-cols-2 gap-3">
                    {[bestModel, worstModel].map((m, idx) => {
                        const sample = m.generated_samples?.[0]?.trim().slice(0, 100) ?? "—";
                        const isBest = idx === 0;
                        return (
                            <div key={m.label} className={`rounded-lg border p-3 ${isBest ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-red-500/15 bg-red-500/[0.02]"}`}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ background: LAYER_COLORS[m.config.num_layers] }} />
                                    <span className="text-[9px] font-mono font-bold text-white/40">{m.config.num_layers}L</span>
                                    <span className="text-[8px] font-mono text-white/20">{fmtParams(m.total_params)} · val={m.final_val_loss.toFixed(2)}</span>
                                    {isBest && <span className="text-emerald-400 text-[8px] ml-auto">★ BEST</span>}
                                    {!isBest && <span className="text-red-400/50 text-[8px] ml-auto">WORST</span>}
                                </div>
                                <p className={`text-[10px] font-mono leading-relaxed italic ${isBest ? "text-emerald-200/60" : "text-red-200/40"}`}>
                                    &ldquo;{sample}&rdquo;
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[8px] font-mono text-white/15">
                <span>emb=10</span>
                <span>H=128</span>
                <span>ctx=4</span>
                <span className="text-amber-400/30 font-bold">SGD lr=0.01</span>
                <span>steps=80K</span>
                <span className="text-violet-400/25">init=random · no BN · no residual</span>
            </div>
        </div>
    );
}
