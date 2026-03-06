"use client";

import { useState, useEffect, useMemo } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  WeightTyingVisualizer
  Compares tied vs untied weights on two corpora:
    - Base corpus (vocab=28, Shakespeare-like)
    - Paul Graham corpus (vocab=96)
  Shows loss curves, parameter counts, generalization gaps,
  and how tying becomes more beneficial with larger vocabularies.
  Fetches from /api/v1/mlp/weight-tying + /api/v1/mlp/weight-tying-graham.
*/

// Uses relative URL — proxied by Next.js rewrites to backend

interface WTModel {
    label: string;
    config: { vocab_size: number; tie_weights: boolean; emb_dim: number; max_steps: number;[k: string]: unknown };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    diverged: boolean;
    generated_samples: string[];
    loss_curve: { train: { step: number; value: number }[]; val: { step: number; value: number }[] };
}

interface CorpusData {
    corpus: string;
    vocab_size: number;
    models: WTModel[];
}

const FALLBACK_BASE: CorpusData = {
    corpus: "base", vocab_size: 28,
    models: [
        { label: "weights_untied", config: { vocab_size: 28, tie_weights: false, emb_dim: 64, max_steps: 80000 }, final_train_loss: 1.63, final_val_loss: 1.77, total_params: 82268, diverged: false, generated_samples: ["culboir abll..."], loss_curve: { train: [], val: [] } },
        { label: "weights_tied", config: { vocab_size: 28, tie_weights: true, emb_dim: 64, max_steps: 80000 }, final_train_loss: 1.65, final_val_loss: 1.75, total_params: 80476, diverged: false, generated_samples: ["the king hath..."], loss_curve: { train: [], val: [] } },
    ],
};
const FALLBACK_GRAHAM: CorpusData = {
    corpus: "paul_graham", vocab_size: 96,
    models: [
        { label: "weights_graham_tied", config: { vocab_size: 96, tie_weights: true, emb_dim: 64, max_steps: 100000 }, final_train_loss: 1.44, final_val_loss: 1.55, total_params: 84800, diverged: false, generated_samples: ["fekney only arving..."], loss_curve: { train: [], val: [] } },
        { label: "weights_graham_untied", config: { vocab_size: 96, tie_weights: false, emb_dim: 64, max_steps: 100000 }, final_train_loss: 1.40, final_val_loss: 1.54, total_params: 90944, diverged: false, generated_samples: ["think you fand..."], loss_curve: { train: [], val: [] } },
    ],
};

export function WeightTyingVisualizer() {
    const [baseData, setBaseData] = useState<CorpusData>(FALLBACK_BASE);
    const [grahamData, setGrahamData] = useState<CorpusData>(FALLBACK_GRAHAM);
    const [activeCorpus, setActiveCorpus] = useState<"base" | "graham">("base");

    useEffect(() => {
        fetch("/api/v1/mlp/weight-tying")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.models?.length) setBaseData(d); })
            .catch(() => { });
        fetch("/api/v1/mlp/weight-tying-graham")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.models?.length) setGrahamData(d); })
            .catch(() => { });
    }, []);

    const data = activeCorpus === "base" ? baseData : grahamData;
    const tied = data.models.find(m => m.config.tie_weights === true || m.label.includes("tied"));
    const untied = data.models.find(m => m.config.tie_weights === false || m.label.includes("untied"));

    // Chart dimensions
    const W = 520, H = 200, px = 50, py = 20, plotW = W - px - 20, plotH = H - py - 30;

    const maxStep = Math.max(tied?.config.max_steps ?? 80000, untied?.config.max_steps ?? 80000);

    const { minY, maxY } = useMemo(() => {
        let mn = 1.0, mx = 3.0;
        for (const m of [tied, untied]) {
            if (!m) continue;
            for (const pts of [m.loss_curve.train, m.loss_curve.val]) {
                for (const pt of pts) {
                    if (isFinite(pt.value) && pt.value < 10) { mn = Math.min(mn, pt.value); mx = Math.max(mx, pt.value); }
                }
            }
        }
        return { minY: Math.floor(mn * 10) / 10 - 0.05, maxY: Math.min(3.5, Math.ceil(mx * 10) / 10 + 0.1) };
    }, [tied, untied]);

    const toX = (step: number) => px + (step / maxStep) * plotW;
    const toY = (val: number) => py + plotH - ((Math.min(val, maxY) - minY) / (maxY - minY)) * plotH;
    const makePath = (pts: { step: number; value: number }[]) => {
        const valid = pts.filter(p => isFinite(p.value) && p.value < 10);
        if (valid.length < 2) return "";
        return valid.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.step).toFixed(1)},${toY(p.value).toFixed(1)}`).join(" ");
    };

    const paramSaved = (untied?.total_params ?? 0) - (tied?.total_params ?? 0);
    const paramSavedPct = untied?.total_params ? ((paramSaved / untied.total_params) * 100).toFixed(1) : "?";
    const embParams = (data.vocab_size ?? 28) * (tied?.config.emb_dim ?? 64);
    const valDiff = (untied?.final_val_loss ?? 0) - (tied?.final_val_loss ?? 0);

    return (
        <div className="space-y-4">
            {/* Corpus toggle */}
            <div className="flex items-center justify-center gap-2">
                {[
                    { key: "base" as const, label: "Shakespeare (V=28)", emoji: "🎭" },
                    { key: "graham" as const, label: "Paul Graham (V=96)", emoji: "📝" },
                ].map(c => (
                    <button
                        key={c.key}
                        onClick={() => setActiveCorpus(c.key)}
                        className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all flex items-center gap-2 ${activeCorpus === c.key ? "bg-violet-500/10 border-violet-500/30 text-violet-300 font-bold" : "bg-white/[0.015] border-white/[0.06] text-white/30 hover:bg-white/[0.04]"
                            }`}
                    >
                        <span>{c.emoji}</span>
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Architecture diagram: input → embed → hidden → output */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-center gap-1 text-[9px] font-mono">
                    <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        E ({data.vocab_size}×{tied?.config.emb_dim ?? 64})
                    </span>
                    <span className="text-white/15">→ hidden →</span>
                    <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        W_out ({tied?.config.emb_dim ?? 64}×{data.vocab_size})
                    </span>
                </div>
                <div className="flex items-center justify-center mt-2 gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                        <span className="text-[8px] font-mono text-white/25">Untied: E ≠ W_out</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-[8px] font-mono text-white/25">Tied: W_out = E<sup>T</sup></span>
                    </div>
                </div>
            </div>

            {/* SVG Chart: tied vs untied val loss */}
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

                    {/* Untied val */}
                    {untied && untied.loss_curve.val.length > 0 && (
                        <motion.path
                            key={`untied-val-${activeCorpus}`}
                            d={makePath(untied.loss_curve.val)}
                            fill="none"
                            stroke="#fb7185"
                            strokeWidth={2}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                    )}
                    {/* Tied val */}
                    {tied && tied.loss_curve.val.length > 0 && (
                        <motion.path
                            key={`tied-val-${activeCorpus}`}
                            d={makePath(tied.loss_curve.val)}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth={2}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        />
                    )}

                    {/* End dots */}
                    {untied && isFinite(untied.final_val_loss) && (
                        <circle cx={toX(maxStep)} cy={toY(untied.final_val_loss)} r={3.5} fill="#fb7185" />
                    )}
                    {tied && isFinite(tied.final_val_loss) && (
                        <circle cx={toX(maxStep)} cy={toY(tied.final_val_loss)} r={3.5} fill="#34d399" />
                    )}

                    {/* Legend */}
                    <circle cx={px + plotW - 75} cy={py + 5} r={3} fill="#fb7185" />
                    <text x={px + plotW - 68} y={py + 8} fill="rgba(255,255,255,0.25)" fontSize={7} fontFamily="monospace">untied</text>
                    <circle cx={px + plotW - 30} cy={py + 5} r={3} fill="#34d399" />
                    <text x={px + plotW - 23} y={py + 8} fill="rgba(255,255,255,0.25)" fontSize={7} fontFamily="monospace">tied</text>

                    {/* Axis labels */}
                    <text x={px + plotW / 2} y={H - 14} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize={7} fontFamily="monospace">Training Steps</text>
                </svg>
            </div>

            {/* Comparison cards */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeCorpus}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-2 gap-2"
                >
                    {/* Untied card */}
                    <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.03] p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-rose-400" />
                            <span className="text-[10px] font-mono font-bold text-rose-300">Untied</span>
                        </div>
                        <div className="text-[9px] font-mono text-white/30 space-y-0.5">
                            <p>Params: <span className="text-white/50">{untied?.total_params?.toLocaleString() ?? "?"}</span></p>
                            <p>Val loss: <span className="text-rose-300 font-bold">{untied?.final_val_loss?.toFixed(3) ?? "?"}</span></p>
                            <p>Train loss: <span className="text-white/40">{untied?.final_train_loss?.toFixed(3) ?? "?"}</span></p>
                            <p>Gap: <span className="text-white/40">{((untied?.final_val_loss ?? 0) - (untied?.final_train_loss ?? 0)).toFixed(3)}</span></p>
                        </div>
                    </div>
                    {/* Tied card */}
                    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-[10px] font-mono font-bold text-emerald-300">Tied (W_out = E<sup>T</sup>)</span>
                        </div>
                        <div className="text-[9px] font-mono text-white/30 space-y-0.5">
                            <p>Params: <span className="text-white/50">{tied?.total_params?.toLocaleString() ?? "?"}</span></p>
                            <p>Val loss: <span className="text-emerald-300 font-bold">{tied?.final_val_loss?.toFixed(3) ?? "?"}</span></p>
                            <p>Train loss: <span className="text-white/40">{tied?.final_train_loss?.toFixed(3) ?? "?"}</span></p>
                            <p>Gap: <span className="text-white/40">{((tied?.final_val_loss ?? 0) - (tied?.final_train_loss ?? 0)).toFixed(3)}</span></p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Savings / verdict */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.04] p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-white/25">Parameters saved by tying</span>
                    <span className="text-[11px] font-mono font-bold text-violet-300">{paramSaved.toLocaleString()} ({paramSavedPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-white/25">Embedding layer (V×D = {data.vocab_size}×{tied?.config.emb_dim ?? 64})</span>
                    <span className="text-[10px] font-mono text-white/40">{embParams.toLocaleString()} params</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-white/25">Val loss difference (untied − tied)</span>
                    <span className={`text-[11px] font-mono font-bold ${valDiff > 0 ? "text-emerald-400" : valDiff < -0.01 ? "text-rose-400" : "text-white/40"}`}>
                        {valDiff > 0 ? "+" : ""}{valDiff.toFixed(3)} {valDiff > 0 ? "→ tied wins" : valDiff < -0.01 ? "→ untied wins" : "≈ tie"}
                    </span>
                </div>
            </div>

            {/* Insight */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[9px] text-white/30 leading-relaxed">
                    {activeCorpus === "base"
                        ? `With a tiny vocabulary (V=28), the embedding matrix E is only ${embParams.toLocaleString()} parameters — tying saves little. The quality difference is minimal.`
                        : `With a larger vocabulary (V=96), tying saves ${paramSaved.toLocaleString()} parameters while maintaining quality. In real Transformers (V=50K+), tying saves millions of parameters — a crucial design choice.`
                    }
                </p>
            </div>

            <p className="text-[8px] text-white/15 text-center font-mono">
                Same architecture (E={tied?.config.emb_dim ?? 64}, H=64, L=4) · Switch corpus to see how vocab size changes the trade-off
            </p>
        </div>
    );
}
