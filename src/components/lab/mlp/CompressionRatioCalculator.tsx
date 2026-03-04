"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  CompressionRatioCalculator
  Shows parameter savings for different embedding dimensions.
  Compares one-hot input size vs embedding approach across vocab sizes.
*/

function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

export function CompressionRatioCalculator() {
    const [vocabSize, setVocabSize] = useState(27);
    const [contextSize, setContextSize] = useState(3);
    const [embDim, setEmbDim] = useState(10);
    const hiddenSize = 64;

    const stats = useMemo(() => {
        const oneHotInputDim = contextSize * vocabSize;
        const oneHotW1 = oneHotInputDim * hiddenSize;
        const oneHotTotal = oneHotW1 + hiddenSize + hiddenSize * vocabSize + vocabSize;

        const embInputDim = contextSize * embDim;
        const embMatrixParams = vocabSize * embDim;
        const embW1 = embInputDim * hiddenSize;
        const embTotal = embMatrixParams + embW1 + hiddenSize + hiddenSize * vocabSize + vocabSize;

        const compressionRatio = oneHotTotal / embTotal;
        const dimsReduction = oneHotInputDim / embInputDim;

        // N-gram table size: V^contextSize entries, each with V probabilities
        const ngramTableSize = Math.pow(vocabSize, contextSize) * vocabSize;
        const ngramOverflow = contextSize > 5 || ngramTableSize > 1e10;

        return { oneHotInputDim, oneHotTotal, embInputDim, embMatrixParams, embTotal, compressionRatio, dimsReduction, ngramTableSize, ngramOverflow };
    }, [vocabSize, contextSize, embDim]);

    const dims = [
        { label: "Vocab (V)", value: vocabSize, set: setVocabSize, min: 10, max: 200, step: 1, color: "#f59e0b" },
        { label: "Context (N)", value: contextSize, set: setContextSize, min: 1, max: 20, step: 1, color: "#60a5fa" },
        { label: "Emb dim (D)", value: embDim, set: setEmbDim, min: 2, max: 64, step: 1, color: "#a78bfa" },
    ];

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Sliders */}
            <div className="space-y-3">
                {dims.map(d => (
                    <div key={d.label} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono w-20 shrink-0" style={{ color: d.color + "90" }}>
                            {d.label}
                        </span>
                        <input
                            type="range"
                            min={d.min}
                            max={d.max}
                            step={d.step}
                            value={d.value}
                            onChange={e => d.set(Number(e.target.value))}
                            className="flex-1 accent-violet-500 cursor-pointer"
                        />
                        <span className="text-sm font-mono font-bold text-white/70 w-8 text-right tabular-nums">
                            {d.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Comparison cards */}
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-amber-500/[0.15] bg-amber-500/[0.04] p-3">
                    <p className="text-[9px] font-mono text-amber-400/60 uppercase tracking-widest mb-1">N-gram Table</p>
                    {stats.ngramOverflow ? (
                        <p className="text-sm font-mono font-bold text-amber-400 tabular-nums">Too large!</p>
                    ) : (
                        <p className="text-lg font-mono font-bold text-white tabular-nums">{fmt(stats.ngramTableSize)}</p>
                    )}
                    <p className="text-[9px] text-white/25 font-mono">entries</p>
                    <p className="text-[9px] text-white/20 font-mono mt-1">V^N = {vocabSize}^{contextSize}</p>
                </div>
                <div className="rounded-lg border border-rose-500/[0.15] bg-rose-500/[0.04] p-3">
                    <p className="text-[9px] font-mono text-rose-400/60 uppercase tracking-widest mb-1">One-Hot</p>
                    <p className="text-lg font-mono font-bold text-white tabular-nums">{fmt(stats.oneHotTotal)}</p>
                    <p className="text-[9px] text-white/25 font-mono">total params</p>
                    <p className="text-[9px] text-white/20 font-mono mt-1">input: {stats.oneHotInputDim} dims</p>
                </div>
                <div className="rounded-lg border border-emerald-500/[0.15] bg-emerald-500/[0.04] p-3">
                    <p className="text-[9px] font-mono text-emerald-400/60 uppercase tracking-widest mb-1">Embeddings</p>
                    <p className="text-lg font-mono font-bold text-white tabular-nums">{fmt(stats.embTotal)}</p>
                    <p className="text-[9px] text-white/25 font-mono">total params</p>
                    <p className="text-[9px] text-white/20 font-mono mt-1">
                        input: {stats.embInputDim} dims + E: {fmt(stats.embMatrixParams)}
                    </p>
                </div>
            </div>

            {/* Compression ratio */}
            <motion.div
                key={`${vocabSize}-${contextSize}-${embDim}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-2"
            >
                <div className="flex items-center gap-3 justify-center">
                    <div className="flex-1 h-3 rounded-full bg-rose-500/10 overflow-hidden">
                        <div className="h-full rounded-full bg-rose-500/30" style={{ width: "100%" }} />
                    </div>
                    <span className="text-xs font-mono text-white/30 shrink-0">vs</span>
                    <div className="flex-1 h-3 rounded-full bg-emerald-500/10 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-emerald-500/30"
                            animate={{ width: `${Math.min(100 / stats.compressionRatio * 100, 100)}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
                <p className="text-[10px] font-mono text-white/30">
                    Embeddings use{" "}
                    <span className="text-emerald-400 font-bold">{stats.compressionRatio.toFixed(1)}× fewer</span>{" "}
                    parameters · Input dims reduced{" "}
                    <span className="text-emerald-400 font-bold">{stats.dimsReduction.toFixed(1)}×</span>
                </p>
            </motion.div>
        </div>
    );
}
