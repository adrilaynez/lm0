"use client";

import { useEffect, useState, useMemo } from "react";

import { motion } from "framer-motion";

/* ─────────────────────────────────────────────
   StabilityTechniqueGrid
   Matrix heatmap: rows = layer count, columns = technique.
   Fetches from /api/v1/mlp/stability-grid with mock fallback.
   Click cell → detail panel with loss curve + generated text.
   Shows improvement arrows between technique columns.
   ───────────────────────────────────────────── */

/* ─── Types ─── */
interface LossPoint { step: number; value: number }
interface StabilityModelAPI {
    label: string;
    config: {
        num_layers: number;
        emb_dim: number;
        hidden_size: number;
        context_size: number;
        init_strategy: string;
        use_batchnorm: boolean;
        use_residual: boolean;
        learning_rate: number;
        max_steps: number;
    };
    final_train_loss: number;
    final_val_loss: number;
    total_params: number;
    train_time_sec: number;
    diverged: boolean;
    techniques: { init_strategy: string; use_batchnorm: boolean; use_residual: boolean };
    generated_samples: string[];
    loss_curve: { train: LossPoint[]; val: LossPoint[] };
}

interface CellData {
    layers: number;
    technique: string;
    model: StabilityModelAPI | null;
    isMock: boolean;
}

/* ─── Constants ─── */
const TECHNIQUES = ["none", "kaiming", "kaiming+BN", "kaiming+BN+residual"] as const;
const TECHNIQUE_LABELS: Record<string, string> = {
    "none": "Random Init",
    "kaiming": "Kaiming",
    "kaiming+BN": "Kaiming + BN",
    "kaiming+BN+residual": "All Three",
};
const TECHNIQUE_EMOJI: Record<string, string> = {
    "none": "🎲", "kaiming": "⚖️", "kaiming+BN": "📊", "kaiming+BN+residual": "🏗️",
};
const TECHNIQUE_SHORT: Record<string, string> = {
    "none": "—", "kaiming": "K", "kaiming+BN": "K+BN", "kaiming+BN+residual": "K+BN+R",
};
const ALL_LAYERS = [1, 2, 3, 4, 8, 12];


/* ─── Helpers ─── */
function classifyTechnique(t: { init_strategy: string; use_batchnorm: boolean; use_residual: boolean }): string {
    if (t.init_strategy === "random") return "none";
    if (t.use_residual) return "kaiming+BN+residual";
    if (t.use_batchnorm) return "kaiming+BN";
    return "kaiming";
}

function lossToColor(loss: number | null, diverged: boolean): string {
    if (diverged || loss === null) return "rgba(239, 68, 68, 0.25)";
    const best = 1.60, worst = 1.90;
    const t = Math.min(1, Math.max(0, (loss - best) / (worst - best)));
    const r = Math.round(34 + t * 170);
    const g = Math.round(197 - t * 130);
    const b = Math.round(94 - t * 30);
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
}

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

/* ─── Main Component ─── */
export function StabilityTechniqueGrid() {
    const [apiModels, setApiModels] = useState<StabilityModelAPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCell, setSelectedCell] = useState<CellData | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/v1/mlp/stability-grid");
                if (!res.ok) throw new Error("API unavailable");
                const data = await res.json();
                const ms = data?.models ?? data;
                if (!cancelled && Array.isArray(ms) && ms.length > 0) {
                    setApiModels(ms);
                }
            } catch { /* use empty, will show mocks */ }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    /* ─── Build grid cells ─── */
    const grid = useMemo(() => {
        const cells: CellData[][] = [];
        for (const layers of ALL_LAYERS) {
            const row: CellData[] = [];
            for (const tech of TECHNIQUES) {
                const realModel = apiModels.find(m => {
                    const nLayers = m.config?.num_layers ?? 0;
                    const classified = classifyTechnique(m.techniques);
                    return nLayers === layers && classified === tech;
                });
                if (realModel) {
                    row.push({ layers, technique: tech, model: realModel, isMock: false });
                } else {
                    row.push({ layers, technique: tech, model: null, isMock: true });
                }
            }
            cells.push(row);
        }
        return cells;
    }, [apiModels]);

    /* ─── Best/worst stats ─── */
    const allCells = grid.flat().filter(c => c.model && !c.model.diverged);
    const bestCell = allCells.reduce<CellData | null>((best, c) => {
        if (!best || (c.model && best.model && c.model.final_val_loss < best.model.final_val_loss)) return c;
        return best;
    }, null);

    /* ─── Detail chart dimensions ─── */
    const DW = 340, DH = 100, dpx = 36, dpy = 10, dpr = 8, dpb = 16;
    const dPlotW = DW - dpx - dpr, dPlotH = DH - dpy - dpb;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400/30 border-t-violet-400" />
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 space-y-4">
            {/* ─── Technique headers ─── */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="text-[8px] font-mono text-white/15 p-1 text-right w-14">Layers ↓</th>
                            {TECHNIQUES.map((t, ti) => (
                                <th key={t} className="p-1 text-center">
                                    <div className="text-[9px] font-mono text-white/30 font-bold">{TECHNIQUE_EMOJI[t]}</div>
                                    <div className="text-[8px] font-mono text-white/25">{TECHNIQUE_LABELS[t]}</div>
                                    {ti > 0 && (
                                        <div className="text-[7px] font-mono text-emerald-400/30 mt-0.5">
                                            +{ti === 1 ? "init" : ti === 2 ? "norm" : "skip"}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {grid.map((row, ri) => (
                            <tr key={ri}>
                                <td className="text-[11px] font-mono font-bold text-white/25 p-1 text-right">
                                    {row[0].layers}L
                                </td>
                                {row.map((cell, ci) => {
                                    const m = cell.model;
                                    const loss = m?.final_val_loss ?? null;
                                    const diverged = m?.diverged ?? false;
                                    const isSelected = selectedCell?.layers === cell.layers && selectedCell?.technique === cell.technique;
                                    const isBest = bestCell && cell.layers === bestCell.layers && cell.technique === bestCell.technique;

                                    // Improvement from previous column
                                    const prev = ci > 0 ? row[ci - 1].model : null;
                                    const improvement = prev && !prev.diverged && m && !diverged && loss !== null
                                        ? prev.final_val_loss - loss : null;

                                    return (
                                        <td key={ci} className="p-0.5 relative">
                                            <button
                                                onClick={() => setSelectedCell(isSelected ? null : cell)}
                                                className={`w-full rounded-lg border transition-all text-center py-2 px-1 ${isSelected ? "border-white/25 ring-1 ring-violet-500/30" : "border-white/[0.04] hover:border-white/10"
                                                    } ${isBest ? "ring-1 ring-amber-500/30" : ""}`}
                                                style={{ backgroundColor: lossToColor(loss, diverged) }}
                                            >
                                                {!m ? (
                                                    <span className="text-[8px] font-mono text-white/10">—</span>
                                                ) : diverged ? (
                                                    <span className="text-[9px] font-mono text-rose-400/70">✗ NaN</span>
                                                ) : (
                                                    <div>
                                                        <span className={`text-[12px] font-mono font-black ${isBest ? "text-amber-300" : "text-white/60"
                                                            }`}>
                                                            {loss!.toFixed(3)}
                                                        </span>
                                                        {isBest && <span className="text-amber-400 text-[8px] ml-0.5">★</span>}
                                                        <div className="text-[7px] font-mono text-white/15 mt-0.5">
                                                            {fmtParams(m.total_params)}
                                                        </div>
                                                        {cell.isMock && (
                                                            <div className="text-[6px] font-mono text-violet-400/30">est.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                            {/* Improvement arrow */}
                                            {improvement !== null && improvement > 0.01 && (
                                                <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 -translate-x-full text-[7px] font-mono text-emerald-400/50 whitespace-nowrap">
                                                    ↓{(improvement * 100).toFixed(0)}‰
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ─── Color legend ─── */}
            <div className="flex items-center justify-center gap-3 text-[7px] font-mono text-white/15">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded" style={{ background: lossToColor(1.60, false) }} />
                    <span>1.60 (best)</span>
                </div>
                <div className="w-16 h-2 rounded" style={{
                    background: "linear-gradient(to right, rgba(34,197,94,0.2), rgba(200,150,50,0.2), rgba(239,68,68,0.25))"
                }} />
                <div className="flex items-center gap-1">
                    <div className="w-3 h-2 rounded" style={{ background: "rgba(239,68,68,0.25)" }} />
                    <span>diverged</span>
                </div>
                <span className="ml-2 text-violet-400/25 italic">est. = estimated (not yet trained)</span>
            </div>

            {/* ─── Column improvement summary ─── */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { from: "none", to: "kaiming", label: "Random → Kaiming", desc: "Proper weight scaling" },
                    { from: "kaiming", to: "kaiming+BN", label: "+ BatchNorm", desc: "Stabilize activations" },
                    { from: "kaiming+BN", to: "kaiming+BN+residual", label: "+ Residual", desc: "Gradient highway" },
                ].map(({ from, to, label, desc }) => {
                    const improvements: number[] = [];
                    for (const row of grid) {
                        const fCell = row.find(c => c.technique === from);
                        const tCell = row.find(c => c.technique === to);
                        if (fCell?.model && !fCell.model.diverged && tCell?.model && !tCell.model.diverged) {
                            improvements.push(fCell.model.final_val_loss - tCell.model.final_val_loss);
                        }
                    }
                    const avgImprovement = improvements.length > 0
                        ? improvements.reduce((a, b) => a + b, 0) / improvements.length : 0;
                    return (
                        <div key={to} className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-2 text-center">
                            <p className="text-[8px] font-mono font-bold text-white/30">{label}</p>
                            <p className={`text-sm font-mono font-black ${avgImprovement > 0.05 ? "text-emerald-400" : avgImprovement > 0 ? "text-white/40" : "text-white/20"}`}>
                                {avgImprovement > 0 ? `-${avgImprovement.toFixed(3)}` : "—"}
                            </p>
                            <p className="text-[7px] font-mono text-white/15">{desc}</p>
                            <p className="text-[7px] font-mono text-white/10">avg across {improvements.length} depth{improvements.length !== 1 ? "s" : ""}</p>
                        </div>
                    );
                })}
            </div>

            {/* ─── Detail panel ─── */}
            {selectedCell?.model && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-mono font-bold text-white/50">
                                {selectedCell.layers} layer{selectedCell.layers > 1 ? "s" : ""} · {TECHNIQUE_LABELS[selectedCell.technique]}
                                {selectedCell.isMock && <span className="text-violet-400/40 ml-2 text-[8px]">(estimated)</span>}
                            </p>
                            <p className="text-[9px] font-mono text-white/20">
                                {fmtParams(selectedCell.model.total_params)} params · {(selectedCell.model.train_time_sec / 60).toFixed(0)}min
                            </p>
                        </div>
                        <div className="text-right">
                            {selectedCell.model.diverged ? (
                                <span className="text-[10px] font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                                    DIVERGED
                                </span>
                            ) : (
                                <div>
                                    <span className="text-sm font-mono font-black text-emerald-400">
                                        {selectedCell.model.final_val_loss.toFixed(4)}
                                    </span>
                                    <p className="text-[7px] font-mono text-white/15">val loss</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Train vs Val stats */}
                    {!selectedCell.model.diverged && (
                        <div className="flex gap-4 text-[9px] font-mono">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-0.5 rounded" style={{ background: "#a78bfa" }} />
                                <span className="text-white/25">train: {selectedCell.model.final_train_loss.toFixed(4)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-0.5 rounded bg-white" />
                                <span className="text-white/25">val: {selectedCell.model.final_val_loss.toFixed(4)}</span>
                            </div>
                            <div className="text-white/15">
                                gap: {(selectedCell.model.final_val_loss - selectedCell.model.final_train_loss) >= 0 ? "+" : ""}
                                {(selectedCell.model.final_val_loss - selectedCell.model.final_train_loss).toFixed(4)}
                            </div>
                        </div>
                    )}

                    {/* Loss curve */}
                    <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-2">
                        <svg viewBox={`0 0 ${DW} ${DH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                            {(() => {
                                const m = selectedCell.model!;
                                const allPts = [...m.loss_curve.train, ...m.loss_curve.val];
                                if (allPts.length < 2) return null;
                                const maxStep = Math.max(...allPts.map(p => p.step));
                                const vals = allPts.map(p => p.value);
                                const sorted = [...vals].sort((a, b) => a - b);
                                const yMin = Math.max(1.0, sorted[Math.floor(sorted.length * 0.02)] - 0.05);
                                const yMax = Math.min(4.0, sorted[Math.floor(sorted.length * 0.98)] + 0.05);
                                const tx = (s: number) => dpx + (s / maxStep) * dPlotW;
                                const ty = (v: number) => dpy + (1 - (Math.max(yMin, Math.min(yMax, v)) - yMin) / (yMax - yMin)) * dPlotH;

                                return (
                                    <>
                                        {/* Grid */}
                                        {[yMin, (yMin + yMax) / 2, yMax].map(v => (
                                            <g key={v}>
                                                <line x1={dpx} y1={ty(v)} x2={dpx + dPlotW} y2={ty(v)} stroke="white" strokeOpacity={0.04} />
                                                <text x={dpx - 4} y={ty(v) + 3} textAnchor="end" fontSize={6} fill="white" fillOpacity={0.15} fontFamily="monospace">{v.toFixed(1)}</text>
                                            </g>
                                        ))}
                                        {/* Train curve */}
                                        <polyline
                                            points={subsample(m.loss_curve.train, 80).map(p => `${tx(p.step)},${ty(p.value)}`).join(" ")}
                                            fill="none" stroke="#a78bfa" strokeWidth={1.2} strokeOpacity={0.5} strokeDasharray="3 2"
                                            strokeLinecap="round" strokeLinejoin="round"
                                        />
                                        {/* Val curve */}
                                        <polyline
                                            points={subsample(m.loss_curve.val, 80).map(p => `${tx(p.step)},${ty(p.value)}`).join(" ")}
                                            fill="none" stroke="white" strokeWidth={1.5} strokeOpacity={0.6}
                                            strokeLinecap="round" strokeLinejoin="round"
                                        />
                                    </>
                                );
                            })()}
                        </svg>
                    </div>

                    {/* Generated text */}
                    {selectedCell.model.generated_samples.length > 0 && (
                        <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] px-3 py-2">
                            <p className="text-[8px] font-mono text-white/15 mb-1">GENERATED TEXT</p>
                            {selectedCell.model.generated_samples.slice(0, 2).map((s, si) => (
                                <p key={si} className={`text-[10px] font-mono leading-relaxed ${selectedCell.model!.diverged ? "text-rose-400/50" : "text-white/35"
                                    }`}>
                                    &ldquo;{s.trim().slice(0, 100)}{s.trim().length > 100 ? "…" : ""}&rdquo;
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Technique breakdown */}
                    <div className="flex gap-2 text-[8px] font-mono">
                        <span className={`px-1.5 py-0.5 rounded border ${selectedCell.model.techniques.init_strategy === "kaiming"
                            ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400/60" : "border-white/[0.05] text-white/15"
                            }`}>
                            init: {selectedCell.model.techniques.init_strategy}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border ${selectedCell.model.techniques.use_batchnorm
                            ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400/60" : "border-white/[0.05] text-white/15"
                            }`}>
                            BN: {selectedCell.model.techniques.use_batchnorm ? "✓" : "✗"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border ${selectedCell.model.techniques.use_residual
                            ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400/60" : "border-white/[0.05] text-white/15"
                            }`}>
                            Residual: {selectedCell.model.techniques.use_residual ? "✓" : "✗"}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* ─── Pattern insight ─── */}
            {/* Pedagogical insights */}
            <div className="rounded-xl border border-violet-500/10 bg-violet-500/[0.03] p-3 space-y-2">
                <p className="text-[9px] font-mono text-violet-300/60 font-bold">What the data reveals</p>
                <div className="space-y-1.5 text-[9px] font-mono text-white/30 leading-relaxed">
                    <p>
                        <span className="text-emerald-400/60 font-bold">Kaiming init is the hero.</span>{" "}
                        Random init fails completely at 4+ layers (NaN loss), but Kaiming alone makes even 12-layer networks train.
                        This single technique has by far the biggest impact.
                    </p>
                    <p>
                        <span className="text-amber-400/60 font-bold">Surprising: BN + Residual don&apos;t always help.</span>{" "}
                        For small networks (H=128), adding BatchNorm and residual connections often <em>hurts</em> slightly.
                        These techniques add overhead (extra parameters, computation) that only pays off in much larger models.
                        The best cell in this grid is typically Kaiming-only at moderate depth.
                    </p>
                    <p>
                        <span className="text-rose-400/60 font-bold">The depth wall is real.</span>{" "}
                        Without ANY technique, 4+ layers = guaranteed failure. The gradient must pass through every layer via chain rule multiplication &mdash;
                        random weights make this product explode or vanish exponentially.
                    </p>
                </div>
            </div>

            <p className="text-[8px] font-mono text-white/12 text-center">
                Click any cell for details · {apiModels.length > 0 ? `${apiModels.length} real models` : "using fallback data"} · emb=10 · H=128 · ctx=4
            </p>
        </div>
    );
}
