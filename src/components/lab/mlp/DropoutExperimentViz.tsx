"use client";

import { useState, useEffect, useMemo } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  DropoutExperimentViz
  Real backend data: 3 dropout rates (0.0, 0.2, 0.5) trained on the same architecture.
  Shows train vs val loss curves, generalization gap comparison, and the
  overfitting-vs-regularization trade-off.
  Fetches from /api/v1/mlp/dropout-experiment with hardcoded fallback.
*/

// Uses relative URL — proxied by Next.js rewrites to backend

interface DropoutModel {
    label: string;
    config: { dropout_rate: number; max_steps: number;[k: string]: unknown };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    diverged: boolean;
    generated_samples: string[];
    loss_curve: { train: { step: number; value: number }[]; val: { step: number; value: number }[] };
}

const DROPOUT_META: Record<string, { label: string; color: string; emoji: string; verdict: string }> = {
    "0": { label: "No Dropout", color: "#ef4444", emoji: "🔴", verdict: "Memorizes training data — lowest train loss but biggest gap" },
    "0.2": { label: "Dropout 20%", color: "#22c55e", emoji: "🟢", verdict: "Sweet spot — small gap, best generalization trade-off" },
    "0.5": { label: "Dropout 50%", color: "#60a5fa", emoji: "🔵", verdict: "Too aggressive — can't learn complex patterns, underfits" },
};

const FALLBACK: DropoutModel[] = [
    { label: "dropout_0.0", config: { dropout_rate: 0.0, max_steps: 100000 }, final_train_loss: 1.21, final_val_loss: 1.45, total_params: 405468, diverged: false, generated_samples: ["aone and will us take..."], loss_curve: { train: [], val: [] } },
    { label: "dropout_0.2", config: { dropout_rate: 0.2, max_steps: 100000 }, final_train_loss: 1.47, final_val_loss: 1.60, total_params: 405468, diverged: false, generated_samples: ["the king hath spoken..."], loss_curve: { train: [], val: [] } },
    { label: "dropout_0.5", config: { dropout_rate: 0.5, max_steps: 100000 }, final_train_loss: 1.68, final_val_loss: 1.83, total_params: 405468, diverged: false, generated_samples: ["thend whe ris out..."], loss_curve: { train: [], val: [] } },
];

export function DropoutExperimentViz() {
    const [models, setModels] = useState<DropoutModel[]>(FALLBACK);
    const [selected, setSelected] = useState<number>(0);

    useEffect(() => {
        fetch("/api/v1/mlp/dropout-experiment")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.models?.length) setModels(d.models); })
            .catch(() => { });
    }, []);

    const sel = models[selected];
    const drStr = String(sel?.config?.dropout_rate ?? 0);
    const meta = DROPOUT_META[drStr] ?? { label: `Dropout ${drStr}`, color: "#888", emoji: "?", verdict: "" };

    // Chart
    const W = 520, H = 220, px = 50, py = 20, plotW = W - px - 20, plotH = H - py - 30;

    const { minY, maxY, maxStep } = useMemo(() => {
        let mn = 1.0, mx = 3.4;
        let ms = 100000;
        for (const m of models) {
            ms = Math.max(ms, m.config.max_steps);
            for (const pts of [m.loss_curve.train, m.loss_curve.val]) {
                for (const pt of pts) {
                    if (isFinite(pt.value) && pt.value < 10) { mn = Math.min(mn, pt.value); mx = Math.max(mx, pt.value); }
                }
            }
        }
        return { minY: Math.floor(mn * 10) / 10 - 0.1, maxY: Math.min(3.5, Math.ceil(mx * 10) / 10 + 0.1), maxStep: ms };
    }, [models]);

    const toX = (step: number) => px + (step / maxStep) * plotW;
    const toY = (val: number) => py + plotH - ((Math.min(val, maxY) - minY) / (maxY - minY)) * plotH;
    const makePath = (pts: { step: number; value: number }[]) => {
        const valid = pts.filter(p => isFinite(p.value) && p.value < 10);
        if (valid.length < 2) return "";
        return valid.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");
    };

    // Gap data for comparison
    const gaps = models.map(m => ({
        dr: String(m.config.dropout_rate),
        gap: m.final_val_loss - m.final_train_loss,
        train: m.final_train_loss,
        val: m.final_val_loss,
    }));
    const maxGap = Math.max(...gaps.map(g => g.gap), 0.01);

    return (
        <div className="space-y-4">
            {/* Dropout selector */}
            <div className="flex items-center justify-center gap-2">
                {models.map((m, i) => {
                    const dr = String(m.config.dropout_rate);
                    const dm = DROPOUT_META[dr] ?? { label: dr, color: "#888", emoji: "?" };
                    const active = i === selected;
                    return (
                        <button
                            key={m.label}
                            onClick={() => setSelected(i)}
                            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-2 ${active ? "bg-white/[0.06]" : "bg-white/[0.015] hover:bg-white/[0.04]"
                                }`}
                            style={{ borderColor: active ? `${dm.color}40` : "rgba(255,255,255,0.06)", color: active ? dm.color : "rgba(255,255,255,0.3)" }}
                        >
                            <span>{dm.emoji}</span>
                            {dm.label}
                        </button>
                    );
                })}
            </div>

            {/* SVG chart: train + val for selected, faded for others */}
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-2 overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 400 }}>
                    {/* Y grid */}
                    {[minY, (minY + maxY) / 2, maxY].map(v => (
                        <g key={v}>
                            <line x1={px} y1={toY(v)} x2={px + plotW} y2={toY(v)} stroke="rgba(255,255,255,0.04)" />
                            <text x={px - 6} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{v.toFixed(1)}</text>
                        </g>
                    ))}
                    {/* X labels */}
                    {[0, maxStep / 2, maxStep].map(s => (
                        <text key={s} x={toX(s)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">{(s / 1000).toFixed(0)}K</text>
                    ))}
                    {/* Background val curves */}
                    {models.map((m, i) => {
                        if (i === selected) return null;
                        const dr = String(m.config.dropout_rate);
                        const c = DROPOUT_META[dr]?.color ?? "#888";
                        return <path key={`bg-${m.label}`} d={makePath(m.loss_curve.val)} fill="none" stroke={c} strokeWidth={1} strokeOpacity={0.12} />;
                    })}

                    {/* Selected: overfitting gap shading */}
                    {sel && sel.loss_curve.train.length > 10 && sel.loss_curve.val.length > 10 && (() => {
                        const trainPts = sel.loss_curve.train.filter(p => isFinite(p.value) && p.value < 10);
                        const valPts = sel.loss_curve.val.filter(p => isFinite(p.value) && p.value < 10);
                        // Sample every Nth point for the fill area
                        const step = Math.max(1, Math.floor(trainPts.length / 40));
                        const sampledTrain = trainPts.filter((_, i) => i % step === 0);
                        const sampledVal = valPts.filter((_, i) => i % step === 0);
                        const minLen = Math.min(sampledTrain.length, sampledVal.length);
                        if (minLen < 2) return null;
                        const forward = sampledVal.slice(0, minLen).map(p => `${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`);
                        const backward = sampledTrain.slice(0, minLen).reverse().map(p => `${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`);
                        return <path d={`M${forward.join("L")}L${backward.join("L")}Z`} fill={meta.color} fillOpacity={0.06} />;
                    })()}

                    {/* Selected train curve */}
                    {sel?.loss_curve.train.length > 0 && (
                        <path d={makePath(sel.loss_curve.train)} fill="none" stroke={meta.color} strokeWidth={1.5} strokeOpacity={0.35} strokeDasharray="4 3" />
                    )}
                    {/* Selected val curve */}
                    {sel?.loss_curve.val.length > 0 && (
                        <motion.path
                            key={`val-${selected}`}
                            d={makePath(sel.loss_curve.val)}
                            fill="none"
                            stroke={meta.color}
                            strokeWidth={2.5}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                    )}
                    {/* Legend */}
                    <line x1={px + plotW - 80} y1={py + 4} x2={px + plotW - 66} y2={py + 4} stroke={meta.color} strokeWidth={1.5} strokeDasharray="4 3" strokeOpacity={0.5} />
                    <text x={px + plotW - 62} y={py + 7} fill="rgba(255,255,255,0.2)" fontSize={6} fontFamily="monospace">train</text>
                    <line x1={px + plotW - 38} y1={py + 4} x2={px + plotW - 24} y2={py + 4} stroke={meta.color} strokeWidth={2.5} />
                    <text x={px + plotW - 20} y={py + 7} fill="rgba(255,255,255,0.2)" fontSize={6} fontFamily="monospace">val</text>
                    {/* Axis labels */}
                    <text x={px + plotW / 2} y={H - 14} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize={7} fontFamily="monospace">Training Steps</text>
                </svg>
            </div>

            {/* Gap comparison bars */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-wider">Generalization Gap (val − train) — smaller is better</span>
                {gaps.map((g, i) => {
                    const dm = DROPOUT_META[g.dr] ?? { label: g.dr, color: "#888" };
                    const active = i === selected;
                    return (
                        <div key={g.dr} className={`flex items-center gap-3 transition-opacity ${active ? "opacity-100" : "opacity-40"}`}>
                            <span className="text-[9px] font-mono w-20 flex-shrink-0 text-right" style={{ color: dm.color }}>{dm.label}</span>
                            <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: dm.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(g.gap / maxGap) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span className="text-[10px] font-mono font-bold w-10 text-right" style={{ color: dm.color }}>{g.gap.toFixed(2)}</span>
                        </div>
                    );
                })}
            </div>

            {/* Verdict card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selected}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border p-3 flex items-start gap-3"
                    style={{ borderColor: `${meta.color}25`, backgroundColor: `${meta.color}08` }}
                >
                    <span className="text-lg">{meta.emoji}</span>
                    <div>
                        <p className="text-[11px] font-mono font-bold" style={{ color: meta.color }}>{meta.label}: train={sel?.final_train_loss.toFixed(2)} | val={sel?.final_val_loss.toFixed(2)}</p>
                        <p className="text-[9px] text-white/30 leading-relaxed mt-0.5">{meta.verdict}</p>
                    </div>
                </motion.div>
            </AnimatePresence>

            <p className="text-[8px] text-white/15 text-center font-mono">
                Same architecture (405K params, 6 layers) · 100K steps · The shaded area is the overfitting gap
            </p>
        </div>
    );
}
