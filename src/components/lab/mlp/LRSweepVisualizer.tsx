"use client";

import { useState, useEffect, useMemo } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  LRSweepVisualizer
  Real backend data: 5 learning rates trained on the same architecture.
  Shows loss curves (train+val), final stats, divergence detection, and a verdict.
  Fetches from /api/v1/mlp/lr-sweep with hardcoded fallback.
*/

// Uses relative URL — proxied by Next.js rewrites to backend

interface LRModel {
    label: string;
    config: { learning_rate: number; max_steps: number;[k: string]: unknown };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    diverged: boolean;
    generated_samples: string[];
    loss_curve: { train: { step: number; value: number }[]; val: { step: number; value: number }[] };
}

const LR_COLORS: Record<string, string> = {
    "0.0001": "#60a5fa",
    "0.001": "#22c55e",
    "0.005": "#f59e0b",
    "0.01": "#f97316",
    "0.1": "#ef4444",
};

const LR_ZONES: Record<string, { zone: string; color: string; emoji: string }> = {
    "0.0001": { zone: "Too slow", color: "#60a5fa", emoji: "🐌" },
    "0.001": { zone: "Goldilocks", color: "#22c55e", emoji: "✅" },
    "0.005": { zone: "Aggressive", color: "#f59e0b", emoji: "⚠️" },
    "0.01": { zone: "Noisy", color: "#f97316", emoji: "🔥" },
    "0.1": { zone: "Exploded", color: "#ef4444", emoji: "💥" },
};

const FALLBACK: LRModel[] = [
    { label: "lr_sweep_0.0001", config: { learning_rate: 0.0001, max_steps: 20000 }, final_train_loss: 1.72, final_val_loss: 1.84, total_params: 273116, diverged: false, generated_samples: ["ased sweape boun bount and..."], loss_curve: { train: [], val: [] } },
    { label: "lr_sweep_0.001", config: { learning_rate: 0.001, max_steps: 20000 }, final_train_loss: 1.49, final_val_loss: 1.74, total_params: 273116, diverged: false, generated_samples: ["the king of the land and..."], loss_curve: { train: [], val: [] } },
    { label: "lr_sweep_0.005", config: { learning_rate: 0.005, max_steps: 20000 }, final_train_loss: 1.64, final_val_loss: 1.89, total_params: 273116, diverged: false, generated_samples: ["thend whe ris outhend..."], loss_curve: { train: [], val: [] } },
    { label: "lr_sweep_0.01", config: { learning_rate: 0.01, max_steps: 20000 }, final_train_loss: 1.91, final_val_loss: 1.91, total_params: 273116, diverged: false, generated_samples: ["kinge the whan of..."], loss_curve: { train: [], val: [] } },
    { label: "lr_sweep_0.1", config: { learning_rate: 0.1, max_steps: 20000 }, final_train_loss: Infinity, final_val_loss: Infinity, total_params: 273116, diverged: true, generated_samples: ["NaN"], loss_curve: { train: [], val: [] } },
];

export function LRSweepVisualizer() {
    const [models, setModels] = useState<LRModel[]>(FALLBACK);
    const [selected, setSelected] = useState<number>(1); // default to 0.001

    useEffect(() => {
        fetch("/api/v1/mlp/lr-sweep")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.models?.length) setModels(d.models); })
            .catch(() => { });
    }, []);

    const sel = models[selected];
    const lrStr = String(sel?.config?.learning_rate ?? "?");
    const zone = LR_ZONES[lrStr] ?? { zone: "Unknown", color: "#888", emoji: "?" };

    // Chart dimensions
    const W = 520, H = 200, px = 50, py = 20, plotW = W - px - 20, plotH = H - py - 30;

    // Compute Y range across all non-diverged models
    const { minY, maxY } = useMemo(() => {
        let mn = 1.2, mx = 3.4;
        for (const m of models) {
            if (m.diverged) continue;
            for (const pt of m.loss_curve.val) {
                if (isFinite(pt.value)) { mn = Math.min(mn, pt.value); mx = Math.max(mx, pt.value); }
            }
        }
        return { minY: Math.floor(mn * 10) / 10 - 0.1, maxY: Math.ceil(mx * 10) / 10 + 0.1 };
    }, [models]);

    const maxStep = models[0]?.config?.max_steps ?? 20000;

    const toX = (step: number) => px + (step / maxStep) * plotW;
    const toY = (val: number) => py + plotH - ((val - minY) / (maxY - minY)) * plotH;

    const makePath = (pts: { step: number; value: number }[]) => {
        const valid = pts.filter(p => isFinite(p.value) && p.value < 10);
        if (valid.length < 2) return "";
        return valid.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");
    };

    // Best model (lowest val loss)
    const bestIdx = useMemo(() => {
        let best = 0, bestVal = Infinity;
        models.forEach((m, i) => { if (!m.diverged && m.final_val_loss < bestVal) { bestVal = m.final_val_loss; best = i; } });
        return best;
    }, [models]);

    return (
        <div className="space-y-4">
            {/* LR selector pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {models.map((m, i) => {
                    const lr = String(m.config.learning_rate);
                    const c = LR_COLORS[lr] ?? "#888";
                    const z = LR_ZONES[lr];
                    const active = i === selected;
                    return (
                        <button
                            key={m.label}
                            onClick={() => setSelected(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${active ? "bg-white/[0.06]" : "bg-white/[0.015] hover:bg-white/[0.04]"
                                }`}
                            style={{ borderColor: active ? `${c}50` : "rgba(255,255,255,0.06)", color: active ? c : "rgba(255,255,255,0.3)" }}
                        >
                            <span className="text-[10px]">{z?.emoji}</span>
                            lr={lr}
                            {i === bestIdx && <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-1 rounded">BEST</span>}
                        </button>
                    );
                })}
            </div>

            {/* SVG Chart: all val curves, selected highlighted */}
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-2 overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 400 }}>
                    {/* Y grid */}
                    {[minY, (minY + maxY) / 2, maxY].map(v => (
                        <g key={v}>
                            <line x1={px} y1={toY(v)} x2={px + plotW} y2={toY(v)} stroke="rgba(255,255,255,0.04)" />
                            <text x={px - 6} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{v.toFixed(1)}</text>
                        </g>
                    ))}
                    {/* X axis labels */}
                    {[0, maxStep / 2, maxStep].map(s => (
                        <text key={s} x={toX(s)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">{(s / 1000).toFixed(0)}K</text>
                    ))}
                    {/* Background curves (all non-selected) */}
                    {models.map((m, i) => {
                        if (i === selected || m.diverged) return null;
                        const lr = String(m.config.learning_rate);
                        const c = LR_COLORS[lr] ?? "#888";
                        return <path key={m.label} d={makePath(m.loss_curve.val)} fill="none" stroke={c} strokeWidth={1} strokeOpacity={0.15} />;
                    })}
                    {/* Selected train curve */}
                    {!sel?.diverged && sel?.loss_curve.train.length > 0 && (
                        <path d={makePath(sel.loss_curve.train)} fill="none" stroke={zone.color} strokeWidth={1} strokeOpacity={0.2} strokeDasharray="3 3" />
                    )}
                    {/* Selected val curve */}
                    {!sel?.diverged && sel?.loss_curve.val.length > 0 && (
                        <motion.path
                            key={`val-${selected}`}
                            d={makePath(sel.loss_curve.val)}
                            fill="none"
                            stroke={zone.color}
                            strokeWidth={2}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                    )}
                    {/* Diverged indicator */}
                    {sel?.diverged && (
                        <text x={px + plotW / 2} y={py + plotH / 2} textAnchor="middle" fill="#ef4444" fontSize={16} fontFamily="monospace" fontWeight="bold">
                            💥 DIVERGED → ∞
                        </text>
                    )}
                    {/* Final val dot */}
                    {!sel?.diverged && isFinite(sel?.final_val_loss) && (
                        <motion.circle
                            key={`dot-${selected}`}
                            cx={toX(maxStep)}
                            cy={toY(sel.final_val_loss)}
                            r={4}
                            fill={zone.color}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.8 }}
                        />
                    )}
                    {/* Axis labels */}
                    <text x={px + plotW / 2} y={H - 14} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize={7} fontFamily="monospace">Training Steps</text>
                    <text x={12} y={py + plotH / 2} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize={7} fontFamily="monospace" transform={`rotate(-90, 12, ${py + plotH / 2})`}>Val Loss</text>
                    {/* Legend: train vs val */}
                    <line x1={px + plotW - 80} y1={py + 4} x2={px + plotW - 66} y2={py + 4} stroke={zone.color} strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.5} />
                    <text x={px + plotW - 62} y={py + 7} fill="rgba(255,255,255,0.2)" fontSize={6} fontFamily="monospace">train</text>
                    <line x1={px + plotW - 38} y1={py + 4} x2={px + plotW - 24} y2={py + 4} stroke={zone.color} strokeWidth={2} />
                    <text x={px + plotW - 20} y={py + 7} fill="rgba(255,255,255,0.2)" fontSize={6} fontFamily="monospace">val</text>
                </svg>
            </div>

            {/* Stats cards */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selected}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                    <StatCard label="Learning Rate" value={lrStr} color={zone.color} />
                    <StatCard label="Zone" value={`${zone.emoji} ${zone.zone}`} color={zone.color} />
                    <StatCard
                        label="Train Loss"
                        value={sel?.diverged ? "∞" : sel?.final_train_loss?.toFixed(2) ?? "—"}
                        color={zone.color}
                    />
                    <StatCard
                        label="Val Loss"
                        value={sel?.diverged ? "∞" : sel?.final_val_loss?.toFixed(2) ?? "—"}
                        color={zone.color}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Gap / divergence bar */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-white/25">Generalization Gap (val − train)</span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: zone.color }}>
                        {sel?.diverged ? "N/A" : ((sel?.final_val_loss ?? 0) - (sel?.final_train_loss ?? 0)).toFixed(2)}
                    </span>
                </div>
                {!sel?.diverged && (
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: zone.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(5, ((sel?.final_val_loss ?? 0) - (sel?.final_train_loss ?? 0)) * 200))}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                )}
            </div>

            {/* Generated sample */}
            {sel?.generated_samples?.[0] && (
                <div className="rounded-lg bg-black/30 border border-white/[0.04] p-3">
                    <span className="text-[7px] font-mono text-white/15 uppercase tracking-wider block mb-1">Generated Text</span>
                    <p className="text-[10px] font-mono text-white/40 leading-relaxed line-clamp-2">
                        {sel.diverged ? "💥 Model produced NaN — complete divergence" : sel.generated_samples[0].trim()}
                    </p>
                </div>
            )}

            <p className="text-[8px] text-white/15 text-center font-mono">
                Same architecture (273K params) · 5 learning rates · 20K steps · Real training data from our experiments
            </p>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
            <p className="text-[7px] font-mono text-white/20 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-mono font-bold" style={{ color }}>{value}</p>
        </div>
    );
}
