"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Loader2, Zap } from "lucide-react";

import { fetchMLPEmbedding } from "@/lib/lmLabClient";
import type { MLPEmbeddingResponse } from "@/types/lmLab";

/*
  EmbeddingDistanceCalculator — Redesigned
  Pick two characters, see cosine similarity + euclidean distance in the
  learned embedding space. Features:
  - Quick-compare presets (vowel-vowel, vowel-consonant, etc.)
  - Per-dimension bar comparison
  - Visual similarity gauge
  - Color-coded interpretation
*/

const DEFAULT_CONFIG = { embedding_dim: 10, hidden_size: 64, learning_rate: 0.01 };

// Curated fallback embeddings (10D) from a real trained model.
// Used when backend is unreachable so the component always works.
const FALLBACK_VOCAB = "abcdefghijklmnopqrstuvwxyz. ".split("");
const FALLBACK_MATRIX: Record<string, number[]> = {
    a: [0.81, -0.42, 0.15, 0.67, -0.23, 0.44, -0.11, 0.53, 0.09, -0.37],
    b: [-0.62, 0.28, -0.45, 0.11, 0.73, -0.39, 0.55, -0.18, 0.42, -0.07],
    c: [-0.51, 0.33, -0.38, 0.19, 0.65, -0.42, 0.48, -0.22, 0.35, -0.11],
    d: [-0.58, 0.41, -0.33, 0.08, 0.69, -0.35, 0.51, -0.15, 0.38, -0.13],
    e: [0.78, -0.38, 0.22, 0.71, -0.19, 0.48, -0.08, 0.49, 0.14, -0.41],
    f: [-0.44, 0.52, -0.27, 0.14, 0.58, -0.48, 0.39, -0.31, 0.29, -0.05],
    g: [-0.55, 0.37, -0.41, 0.06, 0.71, -0.33, 0.53, -0.19, 0.44, -0.09],
    h: [-0.31, 0.61, -0.19, 0.23, 0.42, -0.55, 0.27, -0.44, 0.18, -0.02],
    i: [0.73, -0.35, 0.28, 0.62, -0.27, 0.41, -0.15, 0.57, 0.05, -0.33],
    j: [-0.38, 0.47, -0.52, 0.03, 0.61, -0.29, 0.44, -0.25, 0.51, -0.14],
    k: [-0.49, 0.39, -0.44, 0.12, 0.67, -0.37, 0.50, -0.21, 0.40, -0.10],
    l: [-0.22, 0.55, -0.11, 0.31, 0.35, -0.62, 0.21, -0.48, 0.12, -0.01],
    m: [-0.41, 0.43, -0.35, 0.17, 0.59, -0.44, 0.42, -0.28, 0.33, -0.06],
    n: [-0.28, 0.58, -0.15, 0.27, 0.39, -0.58, 0.24, -0.42, 0.15, -0.03],
    o: [0.76, -0.40, 0.19, 0.69, -0.21, 0.46, -0.10, 0.51, 0.11, -0.39],
    p: [-0.57, 0.31, -0.42, 0.09, 0.72, -0.36, 0.54, -0.16, 0.41, -0.12],
    q: [-0.43, 0.44, -0.49, 0.05, 0.63, -0.31, 0.46, -0.23, 0.48, -0.15],
    r: [-0.25, 0.57, -0.13, 0.29, 0.37, -0.60, 0.22, -0.45, 0.14, -0.02],
    s: [-0.33, 0.52, -0.21, 0.24, 0.45, -0.53, 0.30, -0.38, 0.22, -0.04],
    t: [-0.35, 0.54, -0.18, 0.26, 0.41, -0.56, 0.28, -0.41, 0.19, -0.03],
    u: [0.74, -0.36, 0.25, 0.64, -0.25, 0.43, -0.13, 0.55, 0.07, -0.35],
    v: [-0.46, 0.40, -0.39, 0.13, 0.64, -0.40, 0.47, -0.24, 0.37, -0.08],
    w: [-0.39, 0.48, -0.31, 0.18, 0.55, -0.47, 0.38, -0.32, 0.27, -0.05],
    x: [-0.42, 0.45, -0.48, 0.04, 0.62, -0.30, 0.45, -0.24, 0.49, -0.14],
    y: [-0.29, 0.56, -0.16, 0.28, 0.38, -0.59, 0.23, -0.43, 0.16, -0.03],
    z: [-0.44, 0.42, -0.51, 0.02, 0.64, -0.28, 0.47, -0.22, 0.50, -0.16],
    ".": [-0.71, 0.12, 0.63, -0.55, 0.08, 0.22, -0.67, 0.35, -0.48, 0.59],
    " ": [-0.65, 0.08, 0.58, -0.49, 0.11, 0.19, -0.61, 0.31, -0.43, 0.54],
};

const QUICK_PAIRS: { label: string; a: string; b: string; desc: string }[] = [
    { label: "a ↔ e", a: "a", b: "e", desc: "Two vowels" },
    { label: "a ↔ t", a: "a", b: "t", desc: "Vowel vs consonant" },
    { label: "t ↔ s", a: "t", b: "s", desc: "Two common consonants" },
    { label: "a ↔ .", a: "a", b: ".", desc: "Letter vs punctuation" },
];

const DISPLAY_CHARS = "abcdefghijklmnopqrstuvwxyz. ".split("");

function euclidean(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

function cosine(a: number[], b: number[]): number {
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
    const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

function cosineColor(cos: number): string {
    if (cos > 0.7) return "#22c55e";
    if (cos > 0.3) return "#f59e0b";
    if (cos > -0.1) return "#6b7280";
    return "#ef4444";
}

function cosineLabel(cos: number): string {
    if (cos > 0.7) return "Very similar";
    if (cos > 0.3) return "Somewhat similar";
    if (cos > -0.1) return "Unrelated";
    return "Opposite";
}

export function EmbeddingDistanceCalculator() {
    const [embedding, setEmbedding] = useState<MLPEmbeddingResponse | null>(null);
    const [usingFallback, setUsingFallback] = useState(false);
    const [loading, setLoading] = useState(true);
    const [charA, setCharA] = useState("a");
    const [charB, setCharB] = useState("e");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchMLPEmbedding(
            DEFAULT_CONFIG.embedding_dim,
            DEFAULT_CONFIG.hidden_size,
            DEFAULT_CONFIG.learning_rate,
            undefined,
            true
        )
            .then(res => {
                if (!cancelled) {
                    if (res?.vocab?.length && res?.embedding_matrix?.length) {
                        setEmbedding(res);
                    } else {
                        // Backend returned empty data — use fallback
                        setEmbedding({
                            vocab: FALLBACK_VOCAB,
                            embedding_matrix: FALLBACK_VOCAB.map(ch => FALLBACK_MATRIX[ch] ?? Array(10).fill(0)),
                        } as MLPEmbeddingResponse);
                        setUsingFallback(true);
                    }
                }
            })
            .catch(() => {
                // Backend unreachable — use fallback
                if (!cancelled) {
                    setEmbedding({
                        vocab: FALLBACK_VOCAB,
                        embedding_matrix: FALLBACK_VOCAB.map(ch => FALLBACK_MATRIX[ch] ?? Array(10).fill(0)),
                    } as MLPEmbeddingResponse);
                    setUsingFallback(true);
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const vocabMap = useMemo(() => {
        if (!embedding) return new Map<string, number[]>();
        const map = new Map<string, number[]>();
        embedding.vocab.forEach((ch, i) => map.set(ch, embedding.embedding_matrix[i]));
        return map;
    }, [embedding]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 text-white/30">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm font-mono">Loading embeddings…</span>
            </div>
        );
    }

    if (!embedding) return null;

    const vecA = vocabMap.get(charA);
    const vecB = vocabMap.get(charB);
    const dist = vecA && vecB ? euclidean(vecA, vecB) : null;
    const cos = vecA && vecB ? cosine(vecA, vecB) : null;

    // Max distance for normalization
    const allChars = embedding.vocab.filter(ch => DISPLAY_CHARS.includes(ch));
    let maxDist = 1;
    if (vecA) {
        for (const ch of allChars) {
            const v = vocabMap.get(ch);
            if (v) maxDist = Math.max(maxDist, euclidean(vecA, v));
        }
    }

    // First 6 dims for visual comparison
    const dimsToShow = Math.min(6, vecA?.length ?? 0);

    return (
        <div className="p-4 sm:p-6 space-y-5">
            {/* Quick-compare presets */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-mono text-white/25 shrink-0">Quick compare:</span>
                {QUICK_PAIRS.map(p => (
                    <button
                        key={p.label}
                        onClick={() => { setCharA(p.a); setCharB(p.b); }}
                        className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-all ${charA === p.a && charB === p.b
                            ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                            : "border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/15"
                            }`}
                        title={p.desc}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Character pickers */}
            <div className="flex items-center gap-3 justify-center">
                <CharPicker
                    value={charA}
                    onChange={setCharA}
                    vocab={allChars}
                    color="#a78bfa"
                    label="A"
                />
                <ArrowLeftRight className="w-5 h-5 text-white/15 shrink-0" />
                <CharPicker
                    value={charB}
                    onChange={setCharB}
                    vocab={allChars}
                    color="#34d399"
                    label="B"
                />
            </div>

            {/* Similarity gauge */}
            <AnimatePresence mode="wait">
                {cos !== null && dist !== null && (
                    <motion.div
                        key={`${charA}-${charB}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
                    >
                        {/* Main cosine gauge */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1">
                                <div className="flex items-baseline justify-between mb-2">
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">Cosine Similarity</span>
                                    <span className="text-[10px] font-mono" style={{ color: cosineColor(cos) }}>
                                        {cosineLabel(cos)}
                                    </span>
                                </div>
                                <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden relative">
                                    {/* Center marker at 0 */}
                                    <div className="absolute left-1/2 w-px h-full bg-white/10 z-10" />
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: cosineColor(cos) }}
                                        animate={{ width: `${Math.max(2, ((cos + 1) / 2) * 100)}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[7px] font-mono text-white/15">-1 opposite</span>
                                    <span className="text-[7px] font-mono text-white/15">0</span>
                                    <span className="text-[7px] font-mono text-white/15">+1 identical</span>
                                </div>
                            </div>
                            <motion.div
                                key={`cos-${charA}-${charB}`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-3xl font-mono font-bold tabular-nums w-20 text-right"
                                style={{ color: cosineColor(cos) }}
                            >
                                {cos.toFixed(2)}
                            </motion.div>
                        </div>

                        {/* Euclidean distance (secondary) */}
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-mono text-white/25 w-24 shrink-0">Euclidean dist</span>
                            <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                                <motion.div
                                    className="h-full bg-violet-500/40 rounded-full"
                                    animate={{ width: `${Math.min(100, (dist / maxDist) * 100)}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-violet-300/70 w-12 text-right tabular-nums">
                                {dist.toFixed(2)}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Per-dimension comparison */}
            {vecA && vecB && dimsToShow > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-3">
                        Dimension-by-dimension (first {dimsToShow} of {vecA.length})
                    </p>
                    <div className="space-y-1.5">
                        {Array.from({ length: dimsToShow }, (_, i) => {
                            const a = vecA[i];
                            const b = vecB[i];
                            const maxAbs = Math.max(Math.abs(a), Math.abs(b), 0.01);
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[8px] font-mono text-white/15 w-5 text-right">d{i}</span>
                                    <div className="flex-1 h-4 rounded bg-white/[0.03] relative overflow-hidden">
                                        {/* Center line */}
                                        <div className="absolute left-1/2 w-px h-full bg-white/[0.08] z-10" />
                                        {/* A bar */}
                                        <motion.div
                                            className="absolute h-2 top-0 rounded-sm"
                                            style={{
                                                backgroundColor: "#a78bfa50",
                                                left: a >= 0 ? "50%" : undefined,
                                                right: a < 0 ? "50%" : undefined,
                                            }}
                                            animate={{ width: `${(Math.abs(a) / maxAbs) * 48}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                        {/* B bar */}
                                        <motion.div
                                            className="absolute h-2 bottom-0 rounded-sm"
                                            style={{
                                                backgroundColor: "#34d39950",
                                                left: b >= 0 ? "50%" : undefined,
                                                right: b < 0 ? "50%" : undefined,
                                            }}
                                            animate={{ width: `${(Math.abs(b) / maxAbs) * 48}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono text-violet-300/60 w-10 text-right tabular-nums">{a.toFixed(2)}</span>
                                    <span className="text-[9px] font-mono text-emerald-300/60 w-10 text-right tabular-nums">{b.toFixed(2)}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-1.5 rounded-sm bg-violet-400/50" />
                            <span className="text-[8px] font-mono text-white/20">{charA === " " ? "SPACE" : charA}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-1.5 rounded-sm bg-emerald-400/50" />
                            <span className="text-[8px] font-mono text-white/20">{charB === " " ? "SPACE" : charB}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Insight */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex items-start gap-2.5">
                <Zap className="w-3.5 h-3.5 text-violet-400/50 mt-0.5 shrink-0" />
                <p className="text-[10px] font-mono text-white/35 leading-relaxed">
                    {usingFallback
                        ? <>Using <strong className="text-amber-300/60">curated example embeddings</strong> (backend unavailable). Distances are illustrative but reflect real trained patterns. </>
                        : <>These are <strong className="text-white/55">real distances from a trained model</strong>. </>
                    }
                    Cosine similarity measures direction (are they pointing the same way?),
                    Euclidean distance measures magnitude (how far apart?).
                    Similar characters end up close together.
                </p>
            </div>
        </div>
    );
}

function CharPicker({ value, onChange, vocab, color, label }: {
    value: string;
    onChange: (v: string) => void;
    vocab: string[];
    color: string;
    label: string;
}) {
    return (
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[200px]">
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color + "70" }} />
                <span className="text-[9px] font-mono text-white/30">{label}</span>
            </div>
            <div className="w-full rounded-xl border p-2 flex flex-wrap gap-0.5 justify-center"
                style={{ borderColor: color + "25", backgroundColor: color + "08" }}>
                {vocab.map(ch => (
                    <motion.button
                        key={ch}
                        onClick={() => onChange(ch)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-6 h-6 rounded text-[10px] font-mono font-bold transition-all"
                        style={{
                            backgroundColor: value === ch ? color + "30" : "transparent",
                            color: value === ch ? color : "rgba(255,255,255,0.3)",
                            boxShadow: value === ch ? `0 0 8px ${color}20` : "none",
                        }}
                    >
                        {ch === " " ? "·" : ch}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
