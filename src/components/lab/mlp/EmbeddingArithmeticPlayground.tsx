"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Target, Zap } from "lucide-react";

import { fetchMLPEmbedding } from "@/lib/lmLabClient";
import type { MLPEmbeddingResponse } from "@/types/lmLab";

/*
  EmbeddingArithmeticPlayground — Redesigned
  Explains *what a centroid is* visually before showing the group comparison.
  Step 1: Pick a group → see letters → see their vectors → see the average.
  Step 2: Compare two group centroids and measure how different they are.
  Key improvements:
  - Visual "averaging" animation for centroid
  - Explains centroid = average = "typical member"
  - Clearer group comparison with interpretation
  - Per-member distance to centroid (cohesion metric)
*/

const DEFAULT_CONFIG = { embedding_dim: 10, hidden_size: 64, learning_rate: 0.01 };

const VOWELS = ["a", "e", "i", "o", "u"];
const COMMON_CONS = ["t", "n", "s", "r", "h", "l", "d", "c"];
const RARE_CONS = ["z", "x", "q", "j", "k"];

const GROUPS = [
    { key: "vowels" as const, label: "Vowels", chars: VOWELS, color: "#a78bfa", colorName: "violet" },
    { key: "common" as const, label: "Common consonants", chars: COMMON_CONS, color: "#60a5fa", colorName: "blue" },
    { key: "rare" as const, label: "Rare consonants", chars: RARE_CONS, color: "#f59e0b", colorName: "amber" },
];

// Fallback curated embedding data
const FALLBACK_EMBEDDINGS: Record<string, number[]> = {
    a: [0.82, -0.31, 0.55, -0.12, 0.38, -0.22, 0.45, 0.18, -0.35, 0.62],
    b: [-0.45, 0.71, -0.22, 0.38, -0.55, 0.42, -0.18, 0.65, 0.28, -0.35],
    c: [-0.38, 0.65, -0.18, 0.42, -0.48, 0.38, -0.15, 0.58, 0.22, -0.32],
    d: [-0.41, 0.68, -0.25, 0.35, -0.52, 0.45, -0.20, 0.62, 0.25, -0.38],
    e: [0.79, -0.28, 0.61, -0.15, 0.42, -0.18, 0.48, 0.22, -0.32, 0.58],
    f: [-0.52, 0.43, -0.31, 0.55, -0.62, 0.35, -0.28, 0.48, 0.35, -0.42],
    g: [-0.48, 0.55, -0.28, 0.41, -0.58, 0.40, -0.22, 0.52, 0.30, -0.38],
    h: [-0.35, 0.38, -0.15, 0.62, -0.42, 0.28, -0.12, 0.45, 0.18, -0.25],
    i: [0.75, -0.35, 0.58, -0.08, 0.35, -0.25, 0.42, 0.15, -0.38, 0.55],
    j: [-0.62, 0.32, -0.45, 0.28, -0.68, 0.25, -0.38, 0.35, 0.42, -0.52],
    k: [-0.55, 0.48, -0.38, 0.32, -0.62, 0.32, -0.32, 0.42, 0.38, -0.48],
    l: [-0.28, 0.52, -0.12, 0.48, -0.35, 0.38, -0.08, 0.55, 0.15, -0.22],
    m: [-0.32, 0.58, -0.22, 0.45, -0.38, 0.42, -0.15, 0.58, 0.20, -0.28],
    n: [-0.25, 0.62, -0.15, 0.52, -0.32, 0.45, -0.10, 0.62, 0.12, -0.22],
    o: [0.72, -0.25, 0.52, -0.18, 0.38, -0.15, 0.42, 0.25, -0.28, 0.52],
    p: [-0.48, 0.72, -0.28, 0.35, -0.55, 0.48, -0.22, 0.68, 0.28, -0.42],
    q: [-0.65, 0.28, -0.52, 0.22, -0.72, 0.22, -0.45, 0.32, 0.48, -0.58],
    r: [-0.22, 0.55, -0.08, 0.58, -0.28, 0.42, -0.05, 0.58, 0.10, -0.18],
    s: [-0.18, 0.48, -0.05, 0.62, -0.25, 0.38, -0.02, 0.52, 0.08, -0.15],
    t: [-0.15, 0.62, -0.08, 0.55, -0.22, 0.48, -0.05, 0.65, 0.05, -0.12],
    u: [0.68, -0.32, 0.48, -0.22, 0.32, -0.28, 0.38, 0.12, -0.35, 0.48],
    v: [-0.55, 0.42, -0.35, 0.38, -0.62, 0.35, -0.28, 0.45, 0.35, -0.48],
    w: [-0.42, 0.35, -0.25, 0.45, -0.48, 0.30, -0.18, 0.42, 0.25, -0.35],
    x: [-0.68, 0.25, -0.55, 0.18, -0.75, 0.18, -0.48, 0.28, 0.52, -0.62],
    y: [0.35, -0.15, 0.22, 0.28, 0.12, -0.08, 0.18, 0.32, -0.12, 0.25],
    z: [-0.72, 0.22, -0.58, 0.15, -0.78, 0.15, -0.52, 0.25, 0.55, -0.65],
    ".": [-0.85, -0.75, -0.62, -0.55, -0.82, -0.68, -0.58, -0.72, -0.65, -0.78],
    " ": [-0.78, -0.68, -0.55, -0.48, -0.75, -0.62, -0.52, -0.65, -0.58, -0.72],
};

function cosineSim(a: number[], b: number[]): number {
    const dot = a.reduce((s, v, i) => s + v * b[i], 0);
    const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

function simBarColor(sim: number): string {
    if (sim > 0.7) return "#22c55e";
    if (sim > 0.4) return "#f59e0b";
    return "#ef4444";
}

function computeCentroid(vecs: number[][]): number[] {
    if (vecs.length === 0) return [];
    const dim = vecs[0].length;
    const sum = new Array(dim).fill(0);
    for (const v of vecs) for (let i = 0; i < dim; i++) sum[i] += v[i];
    return sum.map(s => s / vecs.length);
}

export function EmbeddingArithmeticPlayground() {
    const [embedding, setEmbedding] = useState<MLPEmbeddingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);
    const [activeGroup, setActiveGroup] = useState(0);
    const [showCompare, setShowCompare] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchMLPEmbedding(DEFAULT_CONFIG.embedding_dim, DEFAULT_CONFIG.hidden_size, DEFAULT_CONFIG.learning_rate)
            .then(res => {
                if (!cancelled) {
                    if (!res?.embedding_matrix?.length) setUsingFallback(true);
                    else setEmbedding(res);
                }
            })
            .catch(() => { if (!cancelled) setUsingFallback(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const vocabMap = useMemo(() => {
        if (usingFallback) {
            const map = new Map<string, number[]>();
            for (const [ch, vec] of Object.entries(FALLBACK_EMBEDDINGS)) map.set(ch, vec);
            return map;
        }
        if (!embedding) return new Map<string, number[]>();
        const map = new Map<string, number[]>();
        embedding.vocab.forEach((ch, i) => map.set(ch, embedding.embedding_matrix[i]));
        return map;
    }, [embedding, usingFallback]);

    // Precompute group data
    const groupData = useMemo(() => {
        return GROUPS.map(g => {
            const vecs = g.chars.map(ch => vocabMap.get(ch)).filter(Boolean) as number[][];
            const cent = computeCentroid(vecs);
            const members = g.chars.map(ch => {
                const vec = vocabMap.get(ch);
                return { ch, sim: vec && cent.length > 0 ? cosineSim(vec, cent) : 0 };
            }).sort((a, b) => b.sim - a.sim);
            const avgCohesion = members.reduce((s, m) => s + m.sim, 0) / (members.length || 1);
            return { ...g, vecs, centroid: cent, members, avgCohesion };
        });
    }, [vocabMap]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 text-white/30">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm font-mono">Loading embeddings…</span>
            </div>
        );
    }

    if (!embedding && !usingFallback) {
        return <div className="text-center text-white/30 text-sm py-8 font-mono">No embedding data available.</div>;
    }

    const group = groupData[activeGroup];
    const dimsToShow = Math.min(4, group.centroid.length);

    return (
        <div className="p-4 sm:p-6 space-y-5">
            {usingFallback && (
                <p className="text-[10px] text-amber-300/50 font-mono text-center">
                    Using curated example data (backend unavailable)
                </p>
            )}

            {/* What is a centroid? — visual explanation */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-violet-400/60" />
                    <span className="text-xs font-mono text-white/50 font-bold">What&apos;s a centroid?</span>
                </div>

                {/* Group selector tabs */}
                <div className="flex gap-1.5 flex-wrap">
                    {GROUPS.map((g, i) => (
                        <button
                            key={g.key}
                            onClick={() => { setActiveGroup(i); setShowCompare(false); }}
                            className="text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all"
                            style={{
                                borderColor: activeGroup === i ? g.color + "50" : "rgba(255,255,255,0.06)",
                                backgroundColor: activeGroup === i ? g.color + "15" : "rgba(255,255,255,0.02)",
                                color: activeGroup === i ? g.color : "rgba(255,255,255,0.35)",
                                fontWeight: activeGroup === i ? 700 : 400,
                            }}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>

                {/* Group members → centroid animation */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={group.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-3"
                    >
                        {/* Letters row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono text-white/25">Members:</span>
                            {group.chars.map((ch, i) => (
                                <motion.span
                                    key={ch}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-mono font-bold"
                                    style={{
                                        backgroundColor: group.color + "20",
                                        color: group.color,
                                        borderWidth: 1,
                                        borderColor: group.color + "30",
                                    }}
                                >
                                    {ch}
                                </motion.span>
                            ))}
                        </div>

                        {/* Centroid formula */}
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 flex-wrap">
                            <span>centroid =</span>
                            <span className="text-white/15">(</span>
                            {group.chars.map((ch, i) => (
                                <span key={ch}>
                                    <span style={{ color: group.color }}>{ch}</span>
                                    {i < group.chars.length - 1 && <span className="text-white/15"> + </span>}
                                </span>
                            ))}
                            <span className="text-white/15">)</span>
                            <span>/ {group.chars.length}</span>
                            <span className="text-white/15">=</span>
                            <span style={{ color: group.color }} className="font-bold">average vector</span>
                        </div>

                        {/* Centroid values (first few dims) */}
                        {dimsToShow > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-mono text-white/20">≈</span>
                                <span className="text-[9px] font-mono text-white/15">[</span>
                                {group.centroid.slice(0, dimsToShow).map((v, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + i * 0.06 }}
                                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                                        style={{ color: group.color, backgroundColor: group.color + "10" }}
                                    >
                                        {v >= 0 ? "+" : ""}{v.toFixed(2)}
                                    </motion.span>
                                ))}
                                {group.centroid.length > dimsToShow && (
                                    <span className="text-[9px] font-mono text-white/15">…</span>
                                )}
                                <span className="text-[9px] font-mono text-white/15">]</span>
                            </div>
                        )}

                        {/* Per-member similarity to centroid */}
                        <div className="space-y-1">
                            <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
                                How close is each member to the group center?
                            </p>
                            {group.members.map(({ ch, sim }) => {
                                const barCol = simBarColor(sim);
                                return (
                                    <div key={ch} className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold w-4" style={{ color: group.color }}>{ch}</span>
                                        <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: barCol + "90" }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.max(0, sim * 100)}%` }}
                                                transition={{ duration: 0.4 }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-mono w-8 text-right tabular-nums" style={{ color: barCol }}>
                                            {sim.toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                            <p className="text-[8px] font-mono text-white/15 mt-1">
                                Group cohesion: <span className="font-bold" style={{ color: simBarColor(group.avgCohesion) }}>{(group.avgCohesion * 100).toFixed(0)}%</span>
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Compare centroids button */}
            <button
                onClick={() => setShowCompare(!showCompare)}
                className={`w-full py-2.5 rounded-xl text-[11px] font-mono font-bold border transition-all ${showCompare
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                    : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white/60 hover:border-white/15"
                    }`}
            >
                {showCompare ? "Hide comparison" : "Compare all group centroids"}
            </button>

            {/* Cross-group comparison */}
            <AnimatePresence>
                {showCompare && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-4 sm:p-5 space-y-3">
                            <p className="text-[10px] font-mono text-white/35 mb-2">
                                Cosine similarity between group centroids:
                            </p>
                            {groupData.map((gA, i) =>
                                groupData.slice(i + 1).map(gB => {
                                    const sim = gA.centroid.length > 0 && gB.centroid.length > 0
                                        ? cosineSim(gA.centroid, gB.centroid) : 0;
                                    const isDistinct = sim < 0.5;
                                    return (
                                        <div key={`${gA.key}-${gB.key}`} className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 shrink-0 w-36">
                                                <span className="text-[10px] font-mono font-bold" style={{ color: gA.color }}>{gA.label.split(" ")[0]}</span>
                                                <span className="text-white/15 text-[9px]">↔</span>
                                                <span className="text-[10px] font-mono font-bold" style={{ color: gB.color }}>{gB.label.split(" ")[0]}</span>
                                            </div>
                                            <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: isDistinct ? "#22c55e50" : "#f59e0b50" }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.max(2, ((sim + 1) / 2) * 100)}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono tabular-nums w-10 text-right"
                                                style={{ color: isDistinct ? "#22c55e" : "#f59e0b" }}>
                                                {sim.toFixed(2)}
                                            </span>
                                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${isDistinct ? "bg-emerald-500/10 text-emerald-400/60" : "bg-amber-500/10 text-amber-400/60"
                                                }`}>
                                                {isDistinct ? "distinct" : "overlap"}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom insight */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex items-start gap-2.5">
                <Zap className="w-3.5 h-3.5 text-violet-400/50 mt-0.5 shrink-0" />
                <p className="text-[10px] font-mono text-white/35 leading-relaxed">
                    Nobody told the network about vowels or consonants.
                    It discovered these groupings <strong className="text-white/55">entirely from context patterns</strong>.
                    Characters that appear in similar contexts get similar embeddings — and their centroids drift apart.
                </p>
            </div>
        </div>
    );
}
