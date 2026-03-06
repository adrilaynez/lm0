"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Loader2, Target, Zap } from "lucide-react";

import { fetchAdvancedEmbeddings } from "@/lib/lmLabClient";
import type { AdvancedEmbeddingModel } from "@/lib/lmLabClient";

/*
  EmbeddingBottleneckExplorer — v3 (Side-by-Side Comparator)
  Shows the "U-shaped" validation loss curve across embedding dimensions,
  then a 3-panel side-by-side scatter plot (like EmbeddingQualityComparison)
  with group-colored dots, cluster quality scores, and insight cards.
  Merges the best of the old BottleneckExplorer + QualityComparison.
*/

/* ─── Character groups & colors (matching QualityComparison) ─── */
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SPECIAL = new Set([".", " "]);
const COMMON_CONS = new Set("tnrshdlc".split(""));

type CharGroup = "vowels" | "common" | "rare" | "special";
function getGroup(ch: string): CharGroup {
    if (VOWELS.has(ch)) return "vowels";
    if (SPECIAL.has(ch)) return "special";
    if (COMMON_CONS.has(ch)) return "common";
    return "rare";
}
const GROUP_COLORS: Record<CharGroup, string> = {
    vowels: "#f59e0b",
    common: "#8b5cf6",
    rare: "#ec4899",
    special: "#6b7280",
};
const GROUP_LABELS: Record<CharGroup, string> = {
    vowels: "Vowels",
    common: "Common consonants",
    rare: "Rare consonants",
    special: "Special",
};
const GROUPS: CharGroup[] = ["vowels", "common", "rare", "special"];

/* ─── Key dimensions for the 3-panel scatter ─── */
const SCATTER_DIMS = [2, 10, 32];
const SCATTER_META: Record<number, { label: string; dimLabel: string; description: string; icon: typeof Target }> = {
    2: { label: "2D", dimLabel: "2 dimensions", description: "Barely enough room — groups overlap", icon: Target },
    10: { label: "10D", dimLabel: "10 dimensions", description: "Clusters start to separate cleanly", icon: BarChart3 },
    32: { label: "32D", dimLabel: "32 dimensions", description: "Rich structure, tight groups, sub-clusters", icon: Zap },
};

/* ─── All dims for the bottleneck curve ─── */
const ALL_DIMS = [2, 4, 6, 10, 16, 24, 32, 50, 128];

// Fallback loss data
const FALLBACK_LOSSES: Record<number, { train: number; val: number }> = {
    2: { train: 1.312, val: 1.541 }, 4: { train: 1.222, val: 1.416 },
    6: { train: 1.291, val: 1.449 }, 10: { train: 1.247, val: 1.443 },
    16: { train: 1.265, val: 1.429 }, 24: { train: 1.262, val: 1.521 },
    32: { train: 1.165, val: 1.480 }, 50: { train: 1.230, val: 1.464 },
    128: { train: 1.284, val: 1.537 },
};

/* ─── PCA ─── */
function pca2d(matrix: number[][]): [number, number][] {
    if (!matrix.length) return [];
    const d = matrix[0].length;
    if (d <= 2) return matrix.map(r => [r[0] ?? 0, r[1] ?? 0] as [number, number]);
    const n = matrix.length;
    const mean = Array(d).fill(0) as number[];
    for (const row of matrix) for (let j = 0; j < d; j++) mean[j] += row[j] / n;
    const centered = matrix.map(row => row.map((v, j) => v - mean[j]));
    function powerIter(deflated?: number[]): number[] {
        let v = Array.from({ length: d }, (_, i) => Math.sin(i * 7 + 1));
        const norm0 = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
        v = v.map(x => x / norm0);
        for (let iter = 0; iter < 60; iter++) {
            const nv = Array(d).fill(0) as number[];
            for (const row of centered) {
                const dot = row.reduce((s, x, j) => s + x * v[j], 0);
                for (let j = 0; j < d; j++) nv[j] += dot * row[j];
            }
            if (deflated) {
                const dot2 = nv.reduce((s, x, j) => s + x * deflated[j], 0);
                for (let j = 0; j < d; j++) nv[j] -= dot2 * deflated[j];
            }
            const norm = Math.sqrt(nv.reduce((s, x) => s + x * x, 0)) || 1;
            v = nv.map(x => x / norm);
        }
        return v;
    }
    const pc1 = powerIter();
    const pc2 = powerIter(pc1);
    return centered.map(row => [
        row.reduce((s, v, j) => s + v * pc1[j], 0),
        row.reduce((s, v, j) => s + v * pc2[j], 0),
    ]);
}

/* ─── Cluster metrics ─── */
function clusterTightness(vocab: string[], points: number[][], group: CharGroup): number {
    const idx = vocab.map((ch, i) => ({ ch, i })).filter(x => getGroup(x.ch) === group);
    if (idx.length < 2) return 0;
    const cx = idx.reduce((s, x) => s + points[x.i][0], 0) / idx.length;
    const cy = idx.reduce((s, x) => s + points[x.i][1], 0) / idx.length;
    return idx.reduce((s, x) => {
        const dx = points[x.i][0] - cx, dy = points[x.i][1] - cy;
        return s + Math.sqrt(dx * dx + dy * dy);
    }, 0) / idx.length;
}
function groupSeparation(vocab: string[], points: number[][], g1: CharGroup, g2: CharGroup): number {
    const i1 = vocab.map((ch, i) => ({ ch, i })).filter(x => getGroup(x.ch) === g1);
    const i2 = vocab.map((ch, i) => ({ ch, i })).filter(x => getGroup(x.ch) === g2);
    if (!i1.length || !i2.length) return 0;
    const c1x = i1.reduce((s, x) => s + points[x.i][0], 0) / i1.length;
    const c1y = i1.reduce((s, x) => s + points[x.i][1], 0) / i1.length;
    const c2x = i2.reduce((s, x) => s + points[x.i][0], 0) / i2.length;
    const c2y = i2.reduce((s, x) => s + points[x.i][1], 0) / i2.length;
    return Math.sqrt((c1x - c2x) ** 2 + (c1y - c2y) ** 2);
}

/* ─── Scatter panel (reused 3x) ─── */
function ScatterPanel({ vocab, points, highlightGroup, label, dimLabel }: {
    vocab: string[]; points: number[][]; highlightGroup: CharGroup | null;
    label: string; dimLabel: string;
}) {
    const [hovered, setHovered] = useState<string | null>(null);
    if (!points.length) return <div className="aspect-square rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-[10px] text-white/20">No data</div>;

    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs), yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xR = (xMax - xMin) || 1, yR = (yMax - yMin) || 1;
    const pad = 0.18;
    const toX = (x: number) => 12 + ((x - xMin + xR * pad) / (xR * (1 + 2 * pad))) * 276;
    const toY = (y: number) => 12 + ((yMax - y + yR * pad) / (yR * (1 + 2 * pad))) * 276;

    // Cluster circle for highlighted group
    const groupCircle = highlightGroup ? (() => {
        const members = vocab.map((ch, i) => ({ ch, i })).filter(x => getGroup(x.ch) === highlightGroup);
        if (!members.length) return null;
        const cx = members.reduce((s, x) => s + points[x.i][0], 0) / members.length;
        const cy = members.reduce((s, x) => s + points[x.i][1], 0) / members.length;
        const maxR = Math.max(...members.map(x => {
            const dx = points[x.i][0] - cx, dy = points[x.i][1] - cy;
            return Math.sqrt(dx * dx + dy * dy);
        }));
        return { cx: toX(cx), cy: toY(cy), r: Math.max((maxR / xR) * 276 * 0.5, 15), color: GROUP_COLORS[highlightGroup] };
    })() : null;

    return (
        <div className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05]">
                <span className="text-[11px] font-mono font-bold text-violet-400/70">{label}</span>
                <span className="text-[9px] text-white/20">{dimLabel}</span>
            </div>
            <div className="p-2">
                <svg viewBox="0 0 300 300" className="w-full">
                    <line x1="12" y1="150" x2="288" y2="150" stroke="white" strokeOpacity={0.04} strokeDasharray="4,4" />
                    <line x1="150" y1="12" x2="150" y2="288" stroke="white" strokeOpacity={0.04} strokeDasharray="4,4" />
                    {groupCircle && (
                        <motion.circle
                            cx={groupCircle.cx} cy={groupCircle.cy}
                            initial={{ r: 0, opacity: 0 }}
                            animate={{ r: groupCircle.r + 8, opacity: 1 }}
                            fill={groupCircle.color} fillOpacity={0.06}
                            stroke={groupCircle.color} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="3,3"
                        />
                    )}
                    {vocab.map((ch, i) => {
                        const group = getGroup(ch);
                        const dimmed = highlightGroup !== null && group !== highlightGroup;
                        const isHov = hovered === ch;
                        const sx = toX(points[i][0]), sy = toY(points[i][1]);
                        const color = GROUP_COLORS[group];
                        const showLabel = isHov || highlightGroup === group;
                        return (
                            <g key={ch}>
                                <motion.circle
                                    cx={sx} cy={sy} r={isHov ? 8 : 4.5}
                                    fill={color}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: dimmed ? 0.15 : isHov ? 1 : 0.7, scale: 1 }}
                                    transition={{ duration: 0.3, delay: i * 0.01 }}
                                    stroke={isHov ? "white" : "none"} strokeWidth={1.5}
                                    onMouseEnter={() => setHovered(ch)}
                                    onMouseLeave={() => setHovered(null)}
                                    className="cursor-pointer"
                                />
                                {showLabel && (
                                    <text x={sx} y={sy - (isHov ? 11 : 8)} textAnchor="middle"
                                        fontSize={isHov ? 11 : 9}
                                        fill={dimmed ? "rgba(255,255,255,0.15)" : "white"}
                                        fillOpacity={isHov ? 1 : 0.6}
                                        fontFamily="monospace" fontWeight={isHov ? "bold" : "normal"}
                                    >
                                        {ch === " " ? "␣" : ch === "." ? "·" : ch}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*  Main component                            */
/* ═══════════════════════════════════════════ */
export function EmbeddingBottleneckExplorer() {
    const [models, setModels] = useState<AdvancedEmbeddingModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFallback, setIsFallback] = useState(false);
    const [highlightGroup, setHighlightGroup] = useState<CharGroup | null>(null);
    const [mobilePanel, setMobilePanel] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetchAdvancedEmbeddings(ALL_DIMS);
                if (cancelled) return;
                if (res.models.length >= 3) {
                    setModels(res.models.sort((a, b) => a.emb_dim - b.emb_dim));
                } else throw new Error("insufficient");
            } catch {
                if (cancelled) return;
                setIsFallback(true);
                setModels(ALL_DIMS.map(dim => ({
                    emb_dim: dim,
                    vocab: " .abcdefghijklmnopqrstuvwxyz".split(""),
                    vocab_size: 28,
                    embedding_matrix: [],
                    config: { emb_dim: dim, context_size: 8, hidden_size: 256, num_layers: 3, max_steps: 50000 },
                    final_train_loss: FALLBACK_LOSSES[dim]?.train ?? null,
                    final_val_loss: FALLBACK_LOSSES[dim]?.val ?? null,
                    total_params: null,
                    generated_samples: [],
                })));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Best val loss
    const bestValLoss = useMemo(() =>
        Math.min(...models.map(m => m.final_val_loss ?? Infinity)), [models]);
    const bestDim = models.find(m => m.final_val_loss === bestValLoss)?.emb_dim;

    // PCA projections for the 3 scatter panels
    const scatterPanels = useMemo(() => {
        return SCATTER_DIMS.map(dim => {
            const m = models.find(x => x.emb_dim === dim);
            if (!m || !m.embedding_matrix?.length) return { dim, vocab: [] as string[], points: [] as number[][] };
            const pts = pca2d(m.embedding_matrix);
            return { dim, vocab: m.vocab, points: pts };
        });
    }, [models]);

    // Cluster metrics for scatter panels
    const scatterMetrics = useMemo(() => {
        return scatterPanels.map(p => {
            if (!p.points.length) return null;
            const vowelTight = clusterTightness(p.vocab, p.points, "vowels");
            const consTight = clusterTightness(p.vocab, p.points, "common");
            const separation = groupSeparation(p.vocab, p.points, "vowels", "common");
            const quality = separation / (Math.max(vowelTight, 0.01) + Math.max(consTight, 0.01));
            return { vowelTight, separation, quality };
        });
    }, [scatterPanels]);
    const maxQuality = Math.max(...scatterMetrics.map(m => m?.quality ?? 0), 0.01);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 text-white/30">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading bottleneck data…
            </div>
        );
    }

    /* ─── Bottleneck curve SVG ─── */
    const W = 400, H = 140, PAD = { t: 18, r: 30, b: 26, l: 42 };
    const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
    const valLosses = models.map(m => m.final_val_loss ?? 0);
    const trainLosses = models.map(m => m.final_train_loss ?? 0);
    const allLosses = [...valLosses, ...trainLosses].filter(v => v > 0);
    const minLoss = Math.min(...allLosses) - 0.02;
    const maxLoss = Math.max(...allLosses) + 0.02;
    const lossRange = maxLoss - minLoss || 1;
    const toX = (i: number) => PAD.l + (i / (models.length - 1)) * plotW;
    const toY = (loss: number) => PAD.t + (1 - (loss - minLoss) / lossRange) * plotH;
    const valPath = models.map((_, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(valLosses[i]).toFixed(1)}`).join(" ");
    const trainPath = models.map((_, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(trainLosses[i]).toFixed(1)}`).join(" ");

    return (
        <div className="space-y-4">
            {/* ── Bottleneck curve ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">The Bottleneck Curve</span>
                    <span className="text-[8px] font-mono text-white/15 ml-auto">val loss vs embedding dimension</span>
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 180 }}>
                    {[0, 0.25, 0.5, 0.75, 1].map(f => {
                        const y = PAD.t + f * plotH;
                        const loss = maxLoss - f * lossRange;
                        return (
                            <g key={f}>
                                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
                                <text x={PAD.l - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">{loss.toFixed(2)}</text>
                            </g>
                        );
                    })}
                    <path d={trainPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} strokeDasharray="3,3" />
                    <path d={valPath} fill="none" stroke="#a78bfa" strokeWidth={2} />
                    {bestDim && (() => {
                        const idx = models.findIndex(m => m.emb_dim === bestDim);
                        if (idx < 0) return null;
                        const cx = toX(idx);
                        return (
                            <g>
                                <line x1={cx} y1={PAD.t} x2={cx} y2={PAD.t + plotH} stroke="#10b981" strokeWidth={0.5} strokeDasharray="2,3" opacity={0.4} />
                                <text x={cx} y={PAD.t - 5} textAnchor="middle" fill="#10b981" fontSize={6} fontFamily="monospace" opacity={0.7}>sweet spot</text>
                            </g>
                        );
                    })()}
                    {/* Highlight the 3 scatter dims */}
                    {models.map((m, i) => {
                        const cx = toX(i);
                        const cyVal = toY(valLosses[i]);
                        const isBest = m.final_val_loss === bestValLoss;
                        const isScatter = SCATTER_DIMS.includes(m.emb_dim);
                        return (
                            <g key={m.emb_dim}>
                                <circle cx={cx} cy={toY(trainLosses[i])} r={2} fill="rgba(255,255,255,0.12)" />
                                <circle cx={cx} cy={cyVal}
                                    r={isScatter ? 4.5 : 3}
                                    fill={isBest ? "#10b981" : isScatter ? "#a78bfa" : "#a78bfa"}
                                    opacity={isScatter ? 1 : 0.5}
                                    stroke={isScatter ? "white" : "none"} strokeWidth={isScatter ? 1 : 0}
                                />
                                <text x={cx} y={PAD.t + plotH + 13} textAnchor="middle"
                                    fill={isScatter ? "#a78bfa" : "rgba(255,255,255,0.2)"}
                                    fontSize={7} fontFamily="monospace" fontWeight={isScatter ? 700 : 400}
                                >{m.emb_dim}D</text>
                            </g>
                        );
                    })}
                    {/* Legend */}
                    <circle cx={W - PAD.r - 60} cy={PAD.t + 4} r={3} fill="#a78bfa" />
                    <text x={W - PAD.r - 54} y={PAD.t + 7} fill="rgba(255,255,255,0.3)" fontSize={6} fontFamily="monospace">Val loss</text>
                    <circle cx={W - PAD.r - 60} cy={PAD.t + 14} r={2} fill="rgba(255,255,255,0.15)" />
                    <text x={W - PAD.r - 54} y={PAD.t + 17} fill="rgba(255,255,255,0.15)" fontSize={6} fontFamily="monospace">Train loss</text>
                </svg>
            </div>

            {/* ── Group filter buttons ── */}
            <div className="flex flex-wrap gap-2 justify-center">
                <button
                    onClick={() => setHighlightGroup(null)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-mono transition-all border ${!highlightGroup
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/[0.06] bg-transparent text-white/30 hover:text-white/50"}`}
                >
                    All characters
                </button>
                {GROUPS.map(g => (
                    <button key={g}
                        onClick={() => setHighlightGroup(highlightGroup === g ? null : g)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-mono transition-all border flex items-center gap-1.5 ${highlightGroup === g
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-white/[0.06] bg-transparent text-white/30 hover:text-white/50"}`}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ background: GROUP_COLORS[g] }} />
                        {GROUP_LABELS[g]}
                    </button>
                ))}
            </div>

            {/* ── Mobile tab selector ── */}
            <div className="flex gap-1 justify-center sm:hidden">
                {SCATTER_DIMS.map((dim, i) => (
                    <button key={dim}
                        onClick={() => setMobilePanel(i)}
                        className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${mobilePanel === i
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                            : "text-white/30 border border-white/[0.06] hover:text-white/50"}`}
                    >
                        {SCATTER_META[dim].label}
                    </button>
                ))}
            </div>

            {/* ── Side-by-side scatter (desktop) ── */}
            <div className="hidden sm:grid grid-cols-3 gap-3">
                {scatterPanels.map((p, idx) => (
                    <ScatterPanel
                        key={p.dim}
                        vocab={p.vocab}
                        points={p.points}
                        highlightGroup={highlightGroup}
                        label={SCATTER_META[p.dim].label}
                        dimLabel={SCATTER_META[p.dim].dimLabel}
                    />
                ))}
            </div>

            {/* ── Mobile: single panel ── */}
            <div className="sm:hidden">
                <AnimatePresence mode="wait">
                    <motion.div key={mobilePanel}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {scatterPanels[mobilePanel] && (
                            <ScatterPanel
                                vocab={scatterPanels[mobilePanel].vocab}
                                points={scatterPanels[mobilePanel].points}
                                highlightGroup={highlightGroup}
                                label={SCATTER_META[scatterPanels[mobilePanel].dim].label}
                                dimLabel={SCATTER_META[scatterPanels[mobilePanel].dim].dimLabel}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Cluster quality bar ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Cluster quality score</span>
                    <span className="ml-auto text-[9px] text-white/20">separation ÷ tightness</span>
                </div>
                <div className="space-y-2">
                    {scatterPanels.map((p, idx) => {
                        const m = scatterMetrics[idx];
                        const pct = m ? (m.quality / maxQuality) * 100 : 0;
                        const gradients = [
                            "linear-gradient(90deg, #6b7280, #9ca3af)",
                            "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                            "linear-gradient(90deg, #a78bfa, #c4b5fd)",
                        ];
                        return (
                            <div key={p.dim} className="flex items-center gap-3">
                                <span className="text-[10px] font-mono font-bold text-white/50 w-8 shrink-0">{SCATTER_META[p.dim].label}</span>
                                <div className="flex-1 h-5 rounded-md bg-white/[0.04] overflow-hidden relative">
                                    <motion.div
                                        className="h-full rounded-md"
                                        style={{ background: gradients[idx] }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, delay: idx * 0.15, ease: "easeOut" }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-mono text-white/50">
                                        {m ? m.quality.toFixed(1) : "—"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Insight cards ── */}
            <div className="grid sm:grid-cols-3 gap-3">
                {scatterPanels.map((p, idx) => {
                    const meta = SCATTER_META[p.dim];
                    const m = scatterMetrics[idx];
                    const model = models.find(x => x.emb_dim === p.dim);
                    const Icon = meta.icon;
                    return (
                        <div key={p.dim} className="flex items-start gap-2.5 p-3 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                            <Icon className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-mono font-bold text-white/50 mb-0.5">{meta.dimLabel}</p>
                                <p className="text-[10px] text-white/30 leading-relaxed">{meta.description}</p>
                                {m && (
                                    <p className="text-[9px] text-white/20 mt-1">
                                        Vowel spread: {m.vowelTight.toFixed(2)} · Separation: {m.separation.toFixed(2)}
                                    </p>
                                )}
                                {model && (
                                    <p className="text-[9px] font-mono mt-1" style={{ color: model.final_val_loss === bestValLoss ? "#10b981" : "rgba(255,255,255,0.2)" }}>
                                        val: {model.final_val_loss?.toFixed(3)} · gap: {((model.final_val_loss ?? 0) - (model.final_train_loss ?? 0)).toFixed(3)}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Footer ── */}
            <p className="text-[7px] font-mono text-white/15 text-right">
                {isFallback ? "Fallback loss data" : "Real embeddings · 3-layer H=256 · L1 reg · 50K steps"}
            </p>
        </div>
    );
}
