"use client";

import { useState, useEffect, useMemo } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  OvertrainingTimelineViz
  Real backend data: single model trained for 200K steps.
  Shows train vs val loss divergence over time (overfitting curve),
  text quality snapshots at milestones, and the moment val loss stops improving.
  Fetches from /api/v1/mlp/overtraining-timeline with hardcoded fallback.
*/

// Uses relative URL — proxied by Next.js rewrites to backend

interface OTModel {
    label: string;
    config: { max_steps: number;[k: string]: unknown };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    diverged: boolean;
    generated_samples: string[];
    loss_curve: { train: { step: number; value: number }[]; val: { step: number; value: number }[] };
    text_snapshots: { step: number; text: string }[];
}

const FALLBACK: OTModel = {
    label: "overtraining_timeline",
    config: { max_steps: 200000 },
    final_train_loss: 1.30,
    final_val_loss: 1.52,
    total_params: 273116,
    diverged: false,
    generated_samples: ["lawdany away abound up that to the..."],
    loss_curve: { train: [], val: [] },
    text_snapshots: [],
};

export function OvertrainingTimelineViz() {
    const [model, setModel] = useState<OTModel>(FALLBACK);
    const [hoverStep, setHoverStep] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/v1/mlp/overtraining-timeline")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.models?.[0]) setModel(d.models[0]); })
            .catch(() => { });
    }, []);

    const W = 540, H = 240, px = 50, py = 20, plotW = W - px - 20, plotH = H - py - 40;
    const maxStep = model.config.max_steps;

    const { minY, maxY } = useMemo(() => {
        let mn = 1.0, mx = 3.5;
        for (const pts of [model.loss_curve.train, model.loss_curve.val]) {
            for (const pt of pts) {
                if (isFinite(pt.value) && pt.value < 10) { mn = Math.min(mn, pt.value); mx = Math.max(mx, pt.value); }
            }
        }
        return { minY: Math.floor(mn * 10) / 10 - 0.05, maxY: Math.min(3.5, Math.ceil(mx * 10) / 10 + 0.1) };
    }, [model]);

    const toX = (step: number) => px + (step / maxStep) * plotW;
    const toY = (val: number) => py + plotH - ((Math.min(val, maxY) - minY) / (maxY - minY)) * plotH;
    const makePath = (pts: { step: number; value: number }[]) => {
        const valid = pts.filter(p => isFinite(p.value) && p.value < 10);
        if (valid.length < 2) return "";
        return valid.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");
    };

    // Find best val loss point
    const bestVal = useMemo(() => {
        let best = { step: 0, value: Infinity };
        for (const pt of model.loss_curve.val) {
            if (pt.value < best.value) best = pt;
        }
        return best;
    }, [model]);

    // Compute gap over time (sampled)
    const gapAtEnd = model.final_val_loss - model.final_train_loss;

    // Snapshots (if available)
    const snapshots = model.text_snapshots ?? [];

    // Find closest snapshot to hover
    const closestSnapshot = useMemo(() => {
        if (hoverStep === null || snapshots.length === 0) return null;
        let closest = snapshots[0];
        for (const s of snapshots) {
            if (Math.abs(s.step - hoverStep) < Math.abs(closest.step - hoverStep)) closest = s;
        }
        return closest;
    }, [hoverStep, snapshots]);

    return (
        <div className="space-y-4">
            {/* Header stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
                    <p className="text-[7px] font-mono text-white/20 uppercase">Best Val Loss</p>
                    <p className="text-sm font-mono font-bold text-emerald-400">{bestVal.value.toFixed(2)}</p>
                    <p className="text-[7px] font-mono text-white/15">@ {(bestVal.step / 1000).toFixed(0)}K steps</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
                    <p className="text-[7px] font-mono text-white/20 uppercase">Final Gap</p>
                    <p className="text-sm font-mono font-bold text-amber-400">{gapAtEnd.toFixed(2)}</p>
                    <p className="text-[7px] font-mono text-white/15">val − train</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
                    <p className="text-[7px] font-mono text-white/20 uppercase">Wasted Steps</p>
                    <p className="text-sm font-mono font-bold text-rose-400">{((maxStep - bestVal.step) / 1000).toFixed(0)}K</p>
                    <p className="text-[7px] font-mono text-white/15">after best val</p>
                </div>
            </div>

            {/* SVG Chart */}
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-2 overflow-x-auto">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full"
                    style={{ minWidth: 420 }}
                    onMouseMove={(e) => {
                        const svg = e.currentTarget;
                        const rect = svg.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * W;
                        const step = Math.round(((x - px) / plotW) * maxStep);
                        if (step >= 0 && step <= maxStep) setHoverStep(step);
                    }}
                    onMouseLeave={() => setHoverStep(null)}
                >
                    {/* Y grid */}
                    {[minY, (minY + maxY) / 2, maxY].map(v => (
                        <g key={v}>
                            <line x1={px} y1={toY(v)} x2={px + plotW} y2={toY(v)} stroke="rgba(255,255,255,0.04)" />
                            <text x={px - 6} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{v.toFixed(1)}</text>
                        </g>
                    ))}
                    {/* X labels */}
                    {[0, maxStep / 4, maxStep / 2, (3 * maxStep) / 4, maxStep].map(s => (
                        <text key={s} x={toX(s)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">{(s / 1000).toFixed(0)}K</text>
                    ))}

                    {/* Gap shading between train and val */}
                    {model.loss_curve.train.length > 10 && model.loss_curve.val.length > 10 && (() => {
                        const trainPts = model.loss_curve.train.filter(p => isFinite(p.value) && p.value < 10);
                        const valPts = model.loss_curve.val.filter(p => isFinite(p.value) && p.value < 10);
                        const step = Math.max(1, Math.floor(trainPts.length / 50));
                        const sampledTrain = trainPts.filter((_, i) => i % step === 0);
                        const sampledVal = valPts.filter((_, i) => i % step === 0);
                        const minLen = Math.min(sampledTrain.length, sampledVal.length);
                        if (minLen < 2) return null;
                        const forward = sampledVal.slice(0, minLen).map(p => `${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`);
                        const backward = sampledTrain.slice(0, minLen).reverse().map(p => `${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`);
                        return <path d={`M${forward.join("L")}L${backward.join("L")}Z`} fill="#f59e0b" fillOpacity={0.06} />;
                    })()}

                    {/* Train curve */}
                    <path d={makePath(model.loss_curve.train)} fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="4 3" />
                    {/* Val curve */}
                    <path d={makePath(model.loss_curve.val)} fill="none" stroke="#f59e0b" strokeWidth={2} />

                    {/* Best val loss marker */}
                    {bestVal.step > 0 && (
                        <>
                            <line x1={toX(bestVal.step)} y1={py} x2={toX(bestVal.step)} y2={py + plotH} stroke="#22c55e" strokeWidth={1} strokeDasharray="4 4" strokeOpacity={0.4} />
                            <circle cx={toX(bestVal.step)} cy={toY(bestVal.value)} r={4} fill="#22c55e" />
                            <text x={toX(bestVal.step)} y={py - 4} textAnchor="middle" fill="#22c55e" fontSize={7} fontFamily="monospace">best val</text>
                        </>
                    )}

                    {/* "Overfitting zone" label */}
                    {bestVal.step > 0 && bestVal.step < maxStep * 0.85 && (
                        <text
                            x={toX((bestVal.step + maxStep) / 2)}
                            y={py + 14}
                            textAnchor="middle"
                            fill="rgba(239,68,68,0.3)"
                            fontSize={8}
                            fontFamily="monospace"
                        >
                            ← overfitting zone →
                        </text>
                    )}

                    {/* Hover line */}
                    {hoverStep !== null && (
                        <line x1={toX(hoverStep)} y1={py} x2={toX(hoverStep)} y2={py + plotH} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                    )}

                    {/* Text snapshot markers */}
                    {snapshots.map(s => (
                        <g key={s.step}>
                            <circle cx={toX(s.step)} cy={py + plotH + 10} r={3} fill="rgba(139,92,246,0.5)" stroke="rgba(139,92,246,0.3)" strokeWidth={1} />
                        </g>
                    ))}

                    {/* Legend */}
                    <line x1={px + plotW - 80} y1={py + 4} x2={px + plotW - 66} y2={py + 4} stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 3" strokeOpacity={0.7} />
                    <text x={px + plotW - 62} y={py + 7} fill="rgba(255,255,255,0.25)" fontSize={6} fontFamily="monospace">train</text>
                    <line x1={px + plotW - 38} y1={py + 4} x2={px + plotW - 24} y2={py + 4} stroke="#f59e0b" strokeWidth={2} />
                    <text x={px + plotW - 20} y={py + 7} fill="rgba(255,255,255,0.25)" fontSize={6} fontFamily="monospace">val</text>
                </svg>
            </div>

            {/* Text snapshot viewer */}
            {snapshots.length > 0 && (
                <div className="space-y-2">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-wider">Text Quality at Training Milestones</span>
                    <div className="grid gap-1.5">
                        {snapshots.slice(0, 6).map((s, i) => (
                            <motion.div
                                key={s.step}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`rounded-lg border bg-black/20 p-2.5 flex items-start gap-3 transition-all ${closestSnapshot?.step === s.step ? "border-violet-500/30" : "border-white/[0.04]"
                                    }`}
                            >
                                <span className="text-[8px] font-mono text-violet-400/60 w-12 flex-shrink-0 pt-0.5">{(s.step / 1000).toFixed(0)}K</span>
                                <p className="text-[9px] font-mono text-white/35 leading-relaxed line-clamp-2">{s.text.trim() || "—"}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Insight */}
            <AnimatePresence>
                {model.loss_curve.val.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 space-y-1"
                    >
                        <p className="text-[10px] font-mono font-bold text-amber-400">The Overfitting Story</p>
                        <p className="text-[9px] text-white/30 leading-relaxed">
                            Train loss keeps dropping (the model memorizes better), but validation loss stops improving at ~{(bestVal.step / 1000).toFixed(0)}K steps.
                            After that point, every additional step makes the model <em>worse</em> at generalizing — it&apos;s memorizing the training text instead of learning patterns.
                            The final gap of <span className="text-amber-400 font-bold">{gapAtEnd.toFixed(2)}</span> is pure memorization.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-[8px] text-white/15 text-center font-mono">
                273K params · 200K steps · No dropout · Real training data · Purple dots = text snapshots
            </p>
        </div>
    );
}
