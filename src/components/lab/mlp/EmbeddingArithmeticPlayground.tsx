"use client";

import { useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { fetchMLPEmbedding } from "@/lib/lmLabClient";
import type { MLPEmbeddingResponse } from "@/types/lmLab";

/*
  EmbeddingArithmeticPlayground
  Explore group centroids and vector arithmetic on learned embeddings.
  E.g., centroid(vowels) vs centroid(consonants), or "b" - "a" + "e" ≈ ?
*/

const DEFAULT_CONFIG = { embedding_dim: 10, hidden_size: 64, learning_rate: 0.01 };

const VOWELS = ["a", "e", "i", "o", "u"];
const CONSONANTS = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z"];

function vecAdd(a: number[], b: number[]): number[] {
    return a.map((v, i) => v + b[i]);
}

function vecSub(a: number[], b: number[]): number[] {
    return a.map((v, i) => v - b[i]);
}

function vecScale(a: number[], s: number): number[] {
    return a.map(v => v * s);
}

function cosine(a: number[], b: number[]): number {
    const dot = a.reduce((s, v, i) => s + v * b[i], 0);
    const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

function centroid(vecs: number[][]): number[] {
    if (vecs.length === 0) return [];
    const dim = vecs[0].length;
    const sum = new Array(dim).fill(0);
    for (const v of vecs) {
        for (let i = 0; i < dim; i++) sum[i] += v[i];
    }
    return sum.map(s => s / vecs.length);
}

type Mode = "centroids" | "arithmetic";

export function EmbeddingArithmeticPlayground() {
    const [embedding, setEmbedding] = useState<MLPEmbeddingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<Mode>("centroids");

    // Arithmetic mode state
    const [charA, setCharA] = useState("b");
    const [charB, setCharB] = useState("a");
    const [charC, setCharC] = useState("e");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchMLPEmbedding(DEFAULT_CONFIG.embedding_dim, DEFAULT_CONFIG.hidden_size, DEFAULT_CONFIG.learning_rate)
            .then(res => { if (!cancelled) setEmbedding(res); })
            .catch(() => {})
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
                Loading embeddings…
            </div>
        );
    }

    if (!embedding) {
        return <div className="text-center text-white/30 text-sm py-8">No embedding data available.</div>;
    }

    const allChars = embedding.vocab;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
                {(["centroids", "arithmetic"] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all border ${
                            mode === m
                                ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
                                : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60"
                        }`}
                    >
                        {m === "centroids" ? "Group Centroids" : "Vector Arithmetic"}
                    </button>
                ))}
            </div>

            {mode === "centroids" ? (
                <CentroidsView vocabMap={vocabMap} />
            ) : (
                <ArithmeticView
                    vocabMap={vocabMap}
                    allChars={allChars}
                    charA={charA} charB={charB} charC={charC}
                    setCharA={setCharA} setCharB={setCharB} setCharC={setCharC}
                />
            )}
        </div>
    );
}

function CentroidsView({ vocabMap }: { vocabMap: Map<string, number[]> }) {
    const vowelVecs = VOWELS.map(c => vocabMap.get(c)).filter(Boolean) as number[][];
    const consVecs = CONSONANTS.map(c => vocabMap.get(c)).filter(Boolean) as number[][];

    const vowelCentroid = centroid(vowelVecs);
    const consCentroid = centroid(consVecs);

    const dist = vowelCentroid.length > 0 && consCentroid.length > 0
        ? cosine(vowelCentroid, consCentroid)
        : null;

    // How close is each vowel to the vowel centroid?
    const vowelDistances = VOWELS.map(ch => {
        const vec = vocabMap.get(ch);
        if (!vec || vowelCentroid.length === 0) return { ch, similarity: 0 };
        return { ch, similarity: cosine(vec, vowelCentroid) };
    }).sort((a, b) => b.similarity - a.similarity);

    const consDistances = CONSONANTS.slice(0, 8).map(ch => {
        const vec = vocabMap.get(ch);
        if (!vec || consCentroid.length === 0) return { ch, similarity: 0 };
        return { ch, similarity: cosine(vec, consCentroid) };
    }).sort((a, b) => b.similarity - a.similarity);

    return (
        <div className="space-y-4">
            {/* Centroid distance */}
            {dist !== null && (
                <div className="text-center p-4 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">
                        Cosine similarity: vowel centroid ↔ consonant centroid
                    </p>
                    <p className="text-2xl font-mono font-bold text-amber-400">{dist.toFixed(3)}</p>
                    <p className="text-[10px] text-white/30 mt-1">
                        {dist < 0.5 ? "Distinct groups — the network separates vowels from consonants!" : "Some overlap — groups partially distinct."}
                    </p>
                </div>
            )}

            {/* Vowel distances */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <p className="text-[9px] font-mono font-bold text-amber-400/70 uppercase tracking-widest">Vowels → vowel centroid</p>
                    {vowelDistances.map(({ ch, similarity }) => (
                        <div key={ch} className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400 w-4">{ch}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                <motion.div
                                    className="h-full bg-amber-500/50 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(0, similarity * 100)}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-white/30 w-10 text-right">{similarity.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-mono font-bold text-violet-400/70 uppercase tracking-widest">Consonants → cons centroid</p>
                    {consDistances.map(({ ch, similarity }) => (
                        <div key={ch} className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-violet-400 w-4">{ch}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                <motion.div
                                    className="h-full bg-violet-500/50 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(0, similarity * 100)}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-white/30 w-10 text-right">{similarity.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ArithmeticView({ vocabMap, allChars, charA, charB, charC, setCharA, setCharB, setCharC }: {
    vocabMap: Map<string, number[]>;
    allChars: string[];
    charA: string; charB: string; charC: string;
    setCharA: (v: string) => void;
    setCharB: (v: string) => void;
    setCharC: (v: string) => void;
}) {
    const vecA = vocabMap.get(charA);
    const vecB = vocabMap.get(charB);
    const vecC = vocabMap.get(charC);

    // Compute A - B + C
    const resultVec = vecA && vecB && vecC ? vecAdd(vecSub(vecA, vecB), vecC) : null;

    // Find nearest neighbors to result
    const nearest = useMemo(() => {
        if (!resultVec) return [];
        return allChars
            .map(ch => ({ ch, similarity: cosine(vocabMap.get(ch) ?? [], resultVec) }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);
    }, [resultVec, allChars, vocabMap]);

    return (
        <div className="space-y-4">
            {/* Formula display */}
            <div className="flex items-center justify-center gap-2 text-lg font-mono">
                <MiniSelector value={charA} onChange={setCharA} vocab={allChars} color="text-violet-400" />
                <span className="text-white/30">−</span>
                <MiniSelector value={charB} onChange={setCharB} vocab={allChars} color="text-rose-400" />
                <span className="text-white/30">+</span>
                <MiniSelector value={charC} onChange={setCharC} vocab={allChars} color="text-emerald-400" />
                <span className="text-white/30">=</span>
                <span className="text-amber-400 font-bold">?</span>
            </div>

            {/* Results */}
            {nearest.length > 0 && (
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-3">Nearest characters to result vector</p>
                    <div className="space-y-2">
                        {nearest.map(({ ch, similarity }, i) => (
                            <div key={ch} className="flex items-center gap-3">
                                <span className={`text-sm font-mono font-bold ${i === 0 ? "text-amber-400" : "text-white/50"}`}>
                                    {ch === " " ? "·" : ch}
                                </span>
                                <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${i === 0 ? "bg-amber-500/60" : "bg-white/10"}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(0, ((similarity + 1) / 2) * 100)}%` }}
                                        transition={{ duration: 0.4, delay: i * 0.05 }}
                                    />
                                </div>
                                <span className="text-[9px] font-mono text-white/30 w-12 text-right">
                                    {similarity.toFixed(3)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[10px] text-white/25 text-center">
                Character-level embeddings don&apos;t have the same rich semantics as word embeddings, but you can still see structural relationships emerge.
            </p>
        </div>
    );
}

function MiniSelector({ value, onChange, vocab, color }: {
    value: string;
    onChange: (v: string) => void;
    vocab: string[];
    color: string;
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`bg-white/[0.05] border border-white/[0.1] rounded-md px-2 py-1 text-sm font-mono font-bold ${color} cursor-pointer appearance-none text-center`}
        >
            {vocab.map(ch => (
                <option key={ch} value={ch}>{ch === " " ? "·" : ch}</option>
            ))}
        </select>
    );
}
