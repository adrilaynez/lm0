"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Loader2, Target, Zap } from "lucide-react";

import { fetchMLPEmbedding } from "@/lib/lmLabClient";

/*
  EmbeddingQualityComparison — Enhanced
  Side-by-side 2D scatter plots comparing embeddings trained with different dimensions.
  Features: fallback data, group highlighting, cluster quality metrics, animated transitions.
*/

const CONFIGS = [
    { label: "2D", dimLabel: "2 dimensions", embedding_dim: 2, hidden_size: 64, learning_rate: 0.01, description: "Barely enough room — groups overlap" },
    { label: "10D", dimLabel: "10 dimensions", embedding_dim: 10, hidden_size: 64, learning_rate: 0.01, description: "Clusters start to separate cleanly" },
    { label: "32D", dimLabel: "32 dimensions", embedding_dim: 32, hidden_size: 64, learning_rate: 0.01, description: "Rich structure, tight groups, sub-clusters" },
];

const VOCAB = "abcdefghijklmnopqrstuvwxyz. ".split("");
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SPECIAL = new Set([".", " "]);
const COMMON_CONS = new Set(["t", "n", "s", "r", "h", "l", "d", "c"]);
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

// Curated fallback data — 2D PCA projections of representative trained embeddings
const FALLBACK_2D: Record<string, [number, number]> = {
    a: [-0.8, 1.2], e: [-0.6, 1.4], i: [-0.5, 1.0], o: [-0.9, 1.3], u: [-0.7, 0.9],
    b: [0.5, -0.3], c: [0.6, -0.1], d: [0.4, -0.4], f: [0.8, -0.6], g: [0.5, -0.2],
    h: [0.3, 0.1], j: [1.2, -1.0], k: [1.3, -0.9], l: [0.2, 0.0], m: [0.4, -0.1],
    n: [0.3, 0.2], p: [0.6, -0.3], q: [1.4, -1.1], r: [0.2, 0.3], s: [0.3, 0.1],
    t: [0.1, 0.4], v: [0.9, -0.7], w: [0.7, -0.5], x: [1.5, -1.2], y: [0.8, -0.4],
    z: [1.6, -1.3], ".": [-1.5, -1.0], " ": [-1.3, -0.8],
};
const FALLBACK_10D: Record<string, [number, number]> = {
    a: [-1.2, 1.8], e: [-1.0, 2.0], i: [-0.8, 1.6], o: [-1.3, 1.9], u: [-1.1, 1.5],
    b: [0.8, -0.5], c: [0.9, -0.3], d: [0.7, -0.6], f: [1.1, -0.9], g: [0.8, -0.4],
    h: [0.4, 0.2], j: [1.8, -1.5], k: [1.9, -1.4], l: [0.3, 0.1], m: [0.6, -0.2],
    n: [0.4, 0.3], p: [0.9, -0.5], q: [2.0, -1.6], r: [0.3, 0.4], s: [0.4, 0.2],
    t: [0.2, 0.5], v: [1.3, -1.1], w: [1.0, -0.8], x: [2.1, -1.7], y: [1.2, -0.7],
    z: [2.2, -1.8], ".": [-2.0, -1.5], " ": [-1.8, -1.2],
};
const FALLBACK_32D: Record<string, [number, number]> = {
    a: [-1.5, 2.2], e: [-1.3, 2.4], i: [-1.1, 2.0], o: [-1.6, 2.3], u: [-1.4, 1.9],
    b: [1.0, -0.7], c: [1.1, -0.5], d: [0.9, -0.8], f: [1.4, -1.2], g: [1.0, -0.6],
    h: [0.5, 0.3], j: [2.2, -1.9], k: [2.3, -1.8], l: [0.4, 0.1], m: [0.7, -0.3],
    n: [0.5, 0.4], p: [1.1, -0.7], q: [2.5, -2.0], r: [0.4, 0.5], s: [0.5, 0.3],
    t: [0.3, 0.6], v: [1.6, -1.4], w: [1.3, -1.0], x: [2.6, -2.1], y: [1.5, -0.9],
    z: [2.7, -2.2], ".": [-2.5, -1.8], " ": [-2.2, -1.5],
};
const FALLBACKS = [FALLBACK_2D, FALLBACK_10D, FALLBACK_32D];

function fallbackPoints(idx: number): { vocab: string[]; points: number[][] } {
    const fb = FALLBACKS[idx];
    return { vocab: VOCAB, points: VOCAB.map(ch => fb[ch] ?? [0, 0]) };
}

// PCA projection for dims > 2
function projectTo2D(matrix: number[][]): number[][] {
    if (matrix.length === 0) return [];
    const dims = matrix[0].length;
    if (dims <= 2) return matrix.map(row => [row[0] ?? 0, row[1] ?? 0]);

    const mean = new Array(dims).fill(0);
    for (const row of matrix) for (let j = 0; j < dims; j++) mean[j] += row[j];
    for (let j = 0; j < dims; j++) mean[j] /= matrix.length;

    const centered = matrix.map(row => row.map((v, j) => v - mean[j]));

    function powerIteration(data: number[][]): number[] {
        let vec = new Array(dims).fill(0).map(() => Math.random() - 0.5);
        let norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
        vec = vec.map(v => v / norm);
        for (let iter = 0; iter < 50; iter++) {
            const nv = new Array(dims).fill(0);
            for (const row of data) {
                const dot = row.reduce((s, v, j) => s + v * vec[j], 0);
                for (let j = 0; j < dims; j++) nv[j] += dot * row[j];
            }
            norm = Math.sqrt(nv.reduce((s, v) => s + v * v, 0)) || 1;
            vec = nv.map(v => v / norm);
        }
        return vec;
    }

    const pc1 = powerIteration(centered);
    const proj1 = centered.map(row => row.reduce((s, v, j) => s + v * pc1[j], 0));
    const deflected = centered.map((row, i) => row.map((v, j) => v - proj1[i] * pc1[j]));
    const pc2 = powerIteration(deflected);

    return centered.map(row => [
        row.reduce((s, v, j) => s + v * pc1[j], 0),
        row.reduce((s, v, j) => s + v * pc2[j], 0),
    ]);
}

// Compute average intra-group distance (cluster tightness)
function clusterTightness(vocab: string[], points: number[][], group: CharGroup): number {
    const indices = vocab.map((ch, i) => ({ ch, i })).filter(x => getGroup(x.ch) === group);
    if (indices.length < 2) return 0;
    const cx = indices.reduce((s, x) => s + points[x.i][0], 0) / indices.length;
    const cy = indices.reduce((s, x) => s + points[x.i][1], 0) / indices.length;
    const avgDist = indices.reduce((s, x) => {
        const dx = points[x.i][0] - cx, dy = points[x.i][1] - cy;
        return s + Math.sqrt(dx * dx + dy * dy);
    }, 0) / indices.length;
    return avgDist;
}

// Compute inter-group separation
function groupSeparation(vocab: string[], points: number[][], g1: CharGroup, g2: CharGroup): number {
    const i1 = vocab.map((ch, i) => ({ ch, i })).filter(x => getGroup(x.ch) === g1);
    const i2 = vocab.map((ch, i) => ({ ch, i })).filter(x => getGroup(x.ch) === g2);
    if (i1.length === 0 || i2.length === 0) return 0;
    const c1x = i1.reduce((s, x) => s + points[x.i][0], 0) / i1.length;
    const c1y = i1.reduce((s, x) => s + points[x.i][1], 0) / i1.length;
    const c2x = i2.reduce((s, x) => s + points[x.i][0], 0) / i2.length;
    const c2y = i2.reduce((s, x) => s + points[x.i][1], 0) / i2.length;
    return Math.sqrt((c1x - c2x) ** 2 + (c1y - c2y) ** 2);
}

interface PanelData {
    label: string;
    dimLabel: string;
    description: string;
    vocab: string[];
    points: number[][];
    loading: boolean;
    usingFallback: boolean;
}

export function EmbeddingQualityComparison() {
    const [panels, setPanels] = useState<PanelData[]>(
        CONFIGS.map((c, i) => ({
            label: c.label, dimLabel: c.dimLabel, description: c.description,
            vocab: [], points: [], loading: true, usingFallback: false,
        }))
    );
    const [highlightGroup, setHighlightGroup] = useState<CharGroup | null>(null);
    const [selectedPanel, setSelectedPanel] = useState(0);

    useEffect(() => {
        let cancelled = false;
        CONFIGS.forEach((config, idx) => {
            fetchMLPEmbedding(config.embedding_dim, config.hidden_size, config.learning_rate, undefined, true)
                .then(res => {
                    if (cancelled) return;
                    const projected = projectTo2D(res.embedding_matrix);
                    setPanels(prev => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], vocab: res.vocab, points: projected, loading: false, usingFallback: false };
                        return next;
                    });
                })
                .catch(() => {
                    if (cancelled) return;
                    const fb = fallbackPoints(idx);
                    setPanels(prev => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], vocab: fb.vocab, points: fb.points, loading: false, usingFallback: true };
                        return next;
                    });
                });
        });
        return () => { cancelled = true; };
    }, []);

    const metrics = useMemo(() => {
        return panels.map(p => {
            if (p.points.length === 0) return null;
            const vowelTight = clusterTightness(p.vocab, p.points, "vowels");
            const consTight = clusterTightness(p.vocab, p.points, "common");
            const separation = groupSeparation(p.vocab, p.points, "vowels", "common");
            // Quality score: higher separation / lower tightness = better
            const quality = separation / (Math.max(vowelTight, 0.01) + Math.max(consTight, 0.01));
            return { vowelTight, consTight, separation, quality };
        });
    }, [panels]);

    // Normalize quality scores for bar display
    const maxQuality = Math.max(...metrics.map(m => m?.quality ?? 0), 0.01);

    const groups: CharGroup[] = ["vowels", "common", "rare", "special"];

    return (
        <div className="p-4 sm:p-6 space-y-4">
            {/* Group filter buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
                <button
                    onClick={() => setHighlightGroup(null)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-mono transition-all border ${highlightGroup === null
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/[0.06] bg-transparent text-white/30 hover:text-white/50"
                        }`}
                >
                    All characters
                </button>
                {groups.map(g => (
                    <button
                        key={g}
                        onClick={() => setHighlightGroup(highlightGroup === g ? null : g)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-mono transition-all border flex items-center gap-1.5 ${highlightGroup === g
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-white/[0.06] bg-transparent text-white/30 hover:text-white/50"
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ background: GROUP_COLORS[g] }} />
                        {GROUP_LABELS[g]}
                    </button>
                ))}
            </div>

            {/* Dimension tab selector (mobile-friendly) */}
            <div className="flex gap-1 justify-center sm:hidden">
                {CONFIGS.map((c, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedPanel(i)}
                        className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${selectedPanel === i
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                            : "text-white/30 border border-white/[0.06] hover:text-white/50"
                            }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Scatter panels — grid on desktop, single on mobile */}
            <div className="hidden sm:grid grid-cols-3 gap-4">
                {panels.map((panel, idx) => (
                    <ScatterPanel
                        key={idx}
                        panel={panel}
                        highlightGroup={highlightGroup}
                        metric={metrics[idx]}
                        maxQuality={maxQuality}
                        isSelected={true}
                    />
                ))}
            </div>

            {/* Mobile: single panel view */}
            <div className="sm:hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedPanel}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ScatterPanel
                            panel={panels[selectedPanel]}
                            highlightGroup={highlightGroup}
                            metric={metrics[selectedPanel]}
                            maxQuality={maxQuality}
                            isSelected={true}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Quality comparison bar */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Cluster quality score</span>
                    <span className="ml-auto text-[9px] text-white/20">separation ÷ tightness</span>
                </div>
                <div className="space-y-2">
                    {panels.map((panel, idx) => {
                        const m = metrics[idx];
                        const pct = m ? (m.quality / maxQuality) * 100 : 0;
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="text-[10px] font-mono font-bold text-white/50 w-8 shrink-0">{panel.label}</span>
                                <div className="flex-1 h-5 rounded-md bg-white/[0.04] overflow-hidden relative">
                                    <motion.div
                                        className="h-full rounded-md"
                                        style={{ background: `linear-gradient(90deg, ${idx === 0 ? "#6b7280" : idx === 1 ? "#8b5cf6" : "#a78bfa"}, ${idx === 0 ? "#9ca3af" : idx === 1 ? "#a78bfa" : "#c4b5fd"})` }}
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

            {/* Insight row */}
            <div className="grid sm:grid-cols-3 gap-3">
                {panels.map((panel, idx) => {
                    const m = metrics[idx];
                    return (
                        <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg border border-white/[0.04] bg-white/[0.01]">
                            {idx === 0 ? <Target className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" /> :
                                idx === 1 ? <BarChart3 className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" /> :
                                    <Zap className="w-3.5 h-3.5 text-violet-300 mt-0.5 shrink-0" />}
                            <div>
                                <p className="text-[10px] font-mono font-bold text-white/50 mb-0.5">{panel.dimLabel}</p>
                                <p className="text-[10px] text-white/30 leading-relaxed">{panel.description}</p>
                                {m && (
                                    <p className="text-[9px] text-white/20 mt-1">
                                        Vowel spread: {m.vowelTight.toFixed(2)} · Separation: {m.separation.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {panels.some(p => p.usingFallback) && (
                <p className="text-[9px] text-amber-400/40 text-center font-mono">
                    ⚡ Using curated fallback data — backend unavailable
                </p>
            )}
        </div>
    );
}

function ScatterPanel({ panel, highlightGroup, metric, maxQuality, isSelected }: {
    panel: PanelData;
    highlightGroup: CharGroup | null;
    metric: { vowelTight: number; consTight: number; separation: number; quality: number } | null;
    maxQuality: number;
    isSelected: boolean;
}) {
    const [hovered, setHovered] = useState<string | null>(null);

    if (panel.loading) {
        return (
            <div className="aspect-square rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-white/20" />
            </div>
        );
    }

    if (panel.points.length === 0) {
        return (
            <div className="aspect-square rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-[10px] text-white/20">
                No data
            </div>
        );
    }

    // Compute bounds from all chars
    const xs = panel.points.map(p => p[0]);
    const ys = panel.points.map(p => p[1]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xRange = (xMax - xMin) || 1;
    const yRange = (yMax - yMin) || 1;
    const pad = 0.18;

    const toX = (x: number) => 12 + ((x - xMin + xRange * pad) / (xRange * (1 + 2 * pad))) * 276;
    const toY = (y: number) => 12 + ((yMax - y + yRange * pad) / (yRange * (1 + 2 * pad))) * 276;

    // Compute centroids for highlighted group
    const groupCentroids = highlightGroup ? (() => {
        const members = panel.vocab.map((ch, i) => ({ ch, i })).filter(x => getGroup(x.ch) === highlightGroup);
        if (members.length === 0) return null;
        const cx = members.reduce((s, x) => s + panel.points[x.i][0], 0) / members.length;
        const cy = members.reduce((s, x) => s + panel.points[x.i][1], 0) / members.length;
        const maxR = Math.max(...members.map(x => {
            const dx = panel.points[x.i][0] - cx, dy = panel.points[x.i][1] - cy;
            return Math.sqrt(dx * dx + dy * dy);
        }));
        return { cx: toX(cx), cy: toY(cy), r: Math.max((maxR / xRange) * 276 * 0.5, 15), color: GROUP_COLORS[highlightGroup] };
    })() : null;

    return (
        <div className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05]">
                <span className="text-[11px] font-mono font-bold text-violet-400/70">{panel.label}</span>
                <span className="text-[9px] text-white/20">{panel.dimLabel}</span>
            </div>
            <div className="p-2">
                <svg viewBox="0 0 300 300" className="w-full">
                    {/* Grid */}
                    <line x1="12" y1="150" x2="288" y2="150" stroke="white" strokeOpacity={0.04} strokeDasharray="4,4" />
                    <line x1="150" y1="12" x2="150" y2="288" stroke="white" strokeOpacity={0.04} strokeDasharray="4,4" />

                    {/* Cluster circle for highlighted group */}
                    {groupCentroids && (
                        <motion.circle
                            cx={groupCentroids.cx}
                            cy={groupCentroids.cy}
                            initial={{ r: 0, opacity: 0 }}
                            animate={{ r: groupCentroids.r + 8, opacity: 1 }}
                            exit={{ r: 0, opacity: 0 }}
                            fill={groupCentroids.color}
                            fillOpacity={0.06}
                            stroke={groupCentroids.color}
                            strokeOpacity={0.2}
                            strokeWidth={1}
                            strokeDasharray="3,3"
                        />
                    )}

                    {/* Points — all vocab chars */}
                    {panel.vocab.map((ch, i) => {
                        const group = getGroup(ch);
                        const dimmed = highlightGroup !== null && group !== highlightGroup;
                        const isHov = hovered === ch;
                        const sx = toX(panel.points[i][0]);
                        const sy = toY(panel.points[i][1]);
                        const color = GROUP_COLORS[group];
                        const showLabel = isHov || (highlightGroup === group);

                        return (
                            <g key={ch}>
                                <motion.circle
                                    cx={sx}
                                    cy={sy}
                                    r={isHov ? 8 : 4.5}
                                    fill={color}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: dimmed ? 0.15 : (isHov ? 1 : 0.7),
                                        scale: 1,
                                    }}
                                    transition={{ duration: 0.3, delay: i * 0.01 }}
                                    stroke={isHov ? "white" : "none"}
                                    strokeWidth={1.5}
                                    onMouseEnter={() => setHovered(ch)}
                                    onMouseLeave={() => setHovered(null)}
                                    className="cursor-pointer"
                                />
                                {showLabel && (
                                    <text
                                        x={sx}
                                        y={sy - (isHov ? 11 : 8)}
                                        textAnchor="middle"
                                        fontSize={isHov ? 11 : 9}
                                        fill={dimmed ? "rgba(255,255,255,0.15)" : "white"}
                                        fillOpacity={isHov ? 1 : 0.6}
                                        fontFamily="monospace"
                                        fontWeight={isHov ? "bold" : "normal"}
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
