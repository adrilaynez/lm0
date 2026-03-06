"use client";

import { useState, useMemo, useCallback } from "react";

import { motion } from "framer-motion";

/*
  BatchNormRegularizerVisualizer
  Shows how BN acts as a regularizer: each mini-batch has slightly different
  μ and σ, so the same input gets slightly different normalization each time.
  This acts like built-in data augmentation — reducing overfitting.
  
  - Shows 5 different mini-batches drawn from the same dataset
  - For each batch: different μ, σ → different normalized output for the SAME input
  - Visualizes the noise this introduces
*/

function seededRng(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function boxMuller(rng: () => number, mean: number, std: number): number {
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const NUM_BATCHES = 6;
const BATCH_SIZE_OPTIONS = [4, 8, 32, 128] as const;

interface BatchInfo {
    id: number;
    examples: number[];
    mu: number;
    sigma: number;
    targetNormalized: number;
    color: string;
}

const BATCH_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

function generateBatches(batchSize: number, seed: number): { batches: BatchInfo[]; targetValue: number } {
    const rng = seededRng(seed);
    
    // The "true" distribution of the dataset (mean=2.5, std=1.8 — drifted)
    const datasetMean = 2.5;
    const datasetStd = 1.8;
    
    // Our target input value (the same example appearing in each batch)
    const targetValue = 3.2;
    
    const batches: BatchInfo[] = [];
    
    for (let b = 0; b < NUM_BATCHES; b++) {
        // Generate a random batch (the target value is always one of them)
        const examples = [targetValue];
        for (let i = 1; i < batchSize; i++) {
            examples.push(boxMuller(rng, datasetMean, datasetStd));
        }
        
        const mu = examples.reduce((a, v) => a + v, 0) / examples.length;
        const variance = examples.reduce((a, v) => a + (v - mu) ** 2, 0) / examples.length;
        const sigma = Math.sqrt(variance + 1e-5);
        const targetNormalized = (targetValue - mu) / sigma;
        
        batches.push({
            id: b,
            examples,
            mu,
            sigma,
            targetNormalized,
            color: BATCH_COLORS[b],
        });
    }
    
    return { batches, targetValue };
}

export function BatchNormRegularizerVisualizer() {
    const [batchSize, setBatchSize] = useState<number>(8);
    const [seed, setSeed] = useState(42);
    
    const resample = useCallback(() => setSeed(s => s + 1), []);
    
    const { batches, targetValue } = useMemo(
        () => generateBatches(batchSize, seed),
        [batchSize, seed]
    );
    
    // Stats across batches
    const normalizedValues = batches.map(b => b.targetNormalized);
    const normMean = normalizedValues.reduce((a, b) => a + b, 0) / normalizedValues.length;
    const normStd = Math.sqrt(
        normalizedValues.reduce((a, b) => a + (b - normMean) ** 2, 0) / normalizedValues.length
    );
    
    const muValues = batches.map(b => b.mu);
    const muMin = Math.min(...muValues);
    const muMax = Math.max(...muValues);
    const muSpread = muMax - muMin;
    
    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                    <span className="text-[8px] font-mono text-white/20">Batch size:</span>
                    {BATCH_SIZE_OPTIONS.map(bs => (
                        <button
                            key={bs}
                            onClick={() => setBatchSize(bs)}
                            className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-all border ${
                                batchSize === bs
                                    ? "border-violet-500/40 bg-violet-500/15 text-violet-400"
                                    : "border-white/[0.06] bg-white/[0.02] text-white/20 hover:text-white/40"
                            }`}
                        >
                            {bs}
                        </button>
                    ))}
                </div>
                <button onClick={resample} className="text-[8px] font-mono text-white/20 hover:text-white/40 transition-colors ml-auto">
                    🎲 New batches
                </button>
            </div>
            
            {/* Target value highlight */}
            <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3 flex items-center gap-3">
                <span className="text-lg font-mono font-black text-amber-400">x = {targetValue.toFixed(1)}</span>
                <span className="text-[9px] font-mono text-amber-400/60 leading-relaxed">
                    Same input value, same neuron — but each mini-batch normalizes it differently because the OTHER examples in the batch are different.
                </span>
            </div>
            
            {/* Batch comparison */}
            <div className="space-y-2">
                {batches.map((batch) => (
                    <motion.div
                        key={batch.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: batch.id * 0.05 }}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 flex items-center gap-3"
                    >
                        {/* Batch label */}
                        <div className="shrink-0 w-14 text-center">
                            <span className="text-[8px] font-mono font-bold" style={{ color: batch.color }}>
                                Batch {batch.id + 1}
                            </span>
                        </div>
                        
                        {/* μ and σ */}
                        <div className="shrink-0 w-24 space-y-0.5">
                            <p className="text-[7px] font-mono text-white/20">
                                μ = <span style={{ color: batch.color }}>{batch.mu.toFixed(3)}</span>
                            </p>
                            <p className="text-[7px] font-mono text-white/20">
                                σ = <span style={{ color: batch.color }}>{batch.sigma.toFixed(3)}</span>
                            </p>
                        </div>
                        
                        {/* Arrow */}
                        <span className="text-[8px] text-white/10 shrink-0">→</span>
                        
                        {/* Normalized result on a number line */}
                        <div className="flex-1 relative h-6 bg-white/[0.03] rounded-sm overflow-hidden">
                            {/* Zero line */}
                            <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
                            {/* Value marker */}
                            <motion.div
                                className="absolute top-1 h-4 w-1 rounded-sm"
                                style={{ backgroundColor: batch.color }}
                                animate={{
                                    left: `${50 + batch.targetNormalized * 15}%`,
                                }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                        
                        {/* Normalized value */}
                        <span className="shrink-0 w-12 text-right text-[9px] font-mono font-bold" style={{ color: batch.color }}>
                            {batch.targetNormalized > 0 ? "+" : ""}{batch.targetNormalized.toFixed(3)}
                        </span>
                    </motion.div>
                ))}
            </div>
            
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[6px] font-mono text-white/20">μ SPREAD</p>
                    <p className={`text-sm font-mono font-bold ${muSpread > 0.5 ? "text-amber-400" : "text-emerald-400"}`}>
                        {muSpread.toFixed(3)}
                    </p>
                    <p className="text-[6px] font-mono text-white/10">max−min of batch means</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[6px] font-mono text-white/20">OUTPUT NOISE</p>
                    <p className={`text-sm font-mono font-bold ${normStd > 0.1 ? "text-amber-400" : "text-emerald-400"}`}>
                        ±{normStd.toFixed(3)}
                    </p>
                    <p className="text-[6px] font-mono text-white/10">std of normalized x</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <p className="text-[6px] font-mono text-white/20">EFFECT</p>
                    <p className={`text-[9px] font-mono font-bold ${normStd > 0.1 ? "text-amber-400" : "text-emerald-400"}`}>
                        {normStd > 0.2 ? "Strong regularizer" : normStd > 0.05 ? "Mild regularizer" : "Minimal noise"}
                    </p>
                    <p className="text-[6px] font-mono text-white/10">
                        {batchSize < 16 ? "small batch = more noise" : "large batch = less noise"}
                    </p>
                </div>
            </div>
            
            {/* Explanation */}
            <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-3 space-y-1.5">
                <p className="text-[9px] font-mono font-bold text-violet-400">
                    Why this prevents memorization
                </p>
                <p className="text-[8px] font-mono text-white/25 leading-relaxed">
                    The same input x = {targetValue.toFixed(1)} gets normalized to {NUM_BATCHES} different values ({normalizedValues.map(v => v.toFixed(2)).join(", ")}). 
                    The network can&apos;t memorize the exact mapping for this input because the output changes slightly every time. 
                    {batchSize <= 8
                        ? ` With batch size ${batchSize}, the noise is significant (±${normStd.toFixed(3)}). This acts like strong data augmentation — each example looks slightly different each epoch. Try batch size 128 to see how larger batches reduce this noise.`
                        : ` With batch size ${batchSize}, the noise is smaller (±${normStd.toFixed(3)}) because more examples → more stable statistics. Try batch size 4 to see dramatic regularization.`
                    }
                </p>
            </div>
        </div>
    );
}
