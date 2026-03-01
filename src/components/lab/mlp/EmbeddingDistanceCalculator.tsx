"use client";

import { useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { fetchMLPEmbedding } from "@/lib/lmLabClient";
import type { MLPEmbeddingResponse } from "@/types/lmLab";

/*
  EmbeddingDistanceCalculator
  Pick two characters and see their Euclidean and cosine distance
  in the learned embedding space. Uses a default config.
*/

const DEFAULT_CONFIG = { embedding_dim: 10, hidden_size: 64, learning_rate: 0.01 };

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

export function EmbeddingDistanceCalculator() {
    const [embedding, setEmbedding] = useState<MLPEmbeddingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [charA, setCharA] = useState("a");
    const [charB, setCharB] = useState("b");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchMLPEmbedding(
            DEFAULT_CONFIG.embedding_dim,
            DEFAULT_CONFIG.hidden_size,
            DEFAULT_CONFIG.learning_rate
        )
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

    const vecA = vocabMap.get(charA);
    const vecB = vocabMap.get(charB);
    const dist = vecA && vecB ? euclidean(vecA, vecB) : null;
    const cos = vecA && vecB ? cosine(vecA, vecB) : null;

    // Find max distance for normalization
    const allChars = embedding.vocab;
    let maxDist = 1;
    if (vecA) {
        for (const ch of allChars) {
            const v = vocabMap.get(ch);
            if (v) maxDist = Math.max(maxDist, euclidean(vecA, v));
        }
    }

    return (
        <div className="p-5 sm:p-6 space-y-5">
            {/* Character selectors */}
            <div className="flex items-center gap-4 justify-center">
                <CharSelector
                    label="Character A"
                    value={charA}
                    onChange={setCharA}
                    vocab={allChars}
                    color="violet"
                />
                <span className="text-white/20 text-lg font-mono">↔</span>
                <CharSelector
                    label="Character B"
                    value={charB}
                    onChange={setCharB}
                    vocab={allChars}
                    color="emerald"
                />
            </div>

            {/* Distance results */}
            {dist !== null && cos !== null && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">Euclidean Distance</p>
                        <motion.p
                            key={`${charA}-${charB}-euc`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-2xl font-mono font-bold text-violet-400"
                        >
                            {dist.toFixed(3)}
                        </motion.p>
                        <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                                className="h-full bg-violet-500/50 rounded-full"
                                animate={{ width: `${Math.min(100, (dist / maxDist) * 100)}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                    </div>
                    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">Cosine Similarity</p>
                        <motion.p
                            key={`${charA}-${charB}-cos`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`text-2xl font-mono font-bold ${cos > 0.5 ? "text-emerald-400" : cos > 0 ? "text-amber-400" : "text-rose-400"}`}
                        >
                            {cos.toFixed(3)}
                        </motion.p>
                        <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-500/50 rounded-full"
                                animate={{ width: `${Math.max(0, ((cos + 1) / 2) * 100)}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                        <p className="text-[8px] text-white/20 mt-1">-1 = opposite, 0 = unrelated, +1 = identical</p>
                    </div>
                </div>
            )}

            {/* Embedding vectors preview */}
            {vecA && vecB && (
                <div className="space-y-2">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/25">Embedding vectors (first 6 dims)</p>
                    <div className="grid grid-cols-2 gap-2">
                        <VectorPreview label={charA === " " ? "SPACE" : charA} vec={vecA} color="violet" />
                        <VectorPreview label={charB === " " ? "SPACE" : charB} vec={vecB} color="emerald" />
                    </div>
                </div>
            )}
        </div>
    );
}

function CharSelector({ label, value, onChange, vocab, color }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    vocab: string[];
    color: "violet" | "emerald";
}) {
    const borderColor = color === "violet" ? "border-violet-500/30" : "border-emerald-500/30";
    const bgColor = color === "violet" ? "bg-violet-500/10" : "bg-emerald-500/10";
    const textColor = color === "violet" ? "text-violet-400" : "text-emerald-400";

    return (
        <div className="flex flex-col items-center gap-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">{label}</p>
            <div className={`flex flex-wrap gap-1 max-w-[200px] justify-center p-2 rounded-lg border ${borderColor} ${bgColor}`}>
                {vocab.map(ch => (
                    <button
                        key={ch}
                        onClick={() => onChange(ch)}
                        className={`w-6 h-6 rounded text-[10px] font-mono font-bold transition-all ${
                            value === ch
                                ? `${textColor} bg-white/10 ring-1 ring-current`
                                : "text-white/40 hover:text-white/60"
                        }`}
                    >
                        {ch === " " ? "·" : ch}
                    </button>
                ))}
            </div>
        </div>
    );
}

function VectorPreview({ label, vec, color }: { label: string; vec: number[]; color: "violet" | "emerald" }) {
    const textColor = color === "violet" ? "text-violet-400" : "text-emerald-400";
    const dims = vec.slice(0, 6);
    return (
        <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2">
            <span className={`text-[10px] font-mono font-bold ${textColor}`}>{label}</span>
            <span className="text-[9px] font-mono text-white/30 ml-1">[</span>
            {dims.map((v, i) => (
                <span key={i} className="text-[9px] font-mono text-white/40">
                    {v.toFixed(2)}{i < dims.length - 1 ? ", " : ""}
                </span>
            ))}
            {vec.length > 6 && <span className="text-[9px] font-mono text-white/20"> …</span>}
            <span className="text-[9px] font-mono text-white/30">]</span>
        </div>
    );
}
