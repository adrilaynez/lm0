"use client";

import { useState, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, RotateCcw } from "lucide-react";

/*
  ResidualDiscoveryVisualizer
  Discovery-based approach to residual connections.
  
  Phase 1: Show the problem — 4 layers, each replaces the signal.
           Layer 3 makes a bad transformation → original info gone forever.
           User sees signal quality degrade.
  
  Phase 2: User toggles "What if we keep the original?"
           Now y = x + f(x). Even with the bad layer, original signal survives.
           The "aha moment" — the user discovers residual connections.
  
  Phase 3: Show that f(x) = y - x, so the network learns CORRECTIONS, not outputs.
           Interactive: drag a slider to see how f(x) adjusts the correction.
*/

const LAYERS = 4;
const INPUT_SIGNAL = [0.8, -0.3, 0.5, 0.9, -0.6, 0.2, -0.7, 0.4];

// Each layer's transformation function
function layerTransform(input: number[], layerIdx: number, badLayer: number): number[] {
    // Simulate different transformations
    const transforms: ((x: number, i: number) => number)[] = [
        (x) => x * 0.9 + 0.1,           // Layer 1: slight change
        (x) => Math.tanh(x * 1.2),       // Layer 2: activation
        (x, i) => layerIdx === badLayer   // Layer 3: BAD transformation
            ? (i % 2 === 0 ? 0.01 : -0.01)  // Kills almost all information
            : x * 0.85 - 0.05,
        (x) => Math.tanh(x * 0.8),       // Layer 4: more activation
    ];
    const fn = transforms[layerIdx] ?? transforms[0];
    return input.map((v, i) => fn(v, i));
}

function signalQuality(original: number[], current: number[]): number {
    // Cosine similarity as quality measure
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < original.length; i++) {
        dot += original[i] * current[i];
        normA += original[i] * original[i];
        normB += current[i] * current[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return Math.max(0, dot / (Math.sqrt(normA) * Math.sqrt(normB)));
}

function InfoLoss({ quality }: { quality: number }) {
    const pct = (quality * 100).toFixed(0);
    const color = quality > 0.7 ? "#22c55e" : quality > 0.3 ? "#f59e0b" : "#ef4444";
    return (
        <div className="flex items-center gap-1.5">
            <div className="w-16 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ width: `${quality * 100}%`, opacity: 0.7 }}
                    transition={{ duration: 0.4 }}
                />
            </div>
            <span className="text-[8px] font-mono font-bold tabular-nums" style={{ color }}>
                {pct}%
            </span>
        </div>
    );
}

export function ResidualDiscoveryVisualizer() {
    const [useResidual, setUseResidual] = useState(false);
    const [badLayer, setBadLayer] = useState(2); // Which layer is "bad"
    const [showInsight, setShowInsight] = useState(false);

    const layerOutputs = useMemo(() => {
        const outputs: { values: number[]; quality: number; correction?: number[] }[] = [];
        let current = [...INPUT_SIGNAL];

        for (let l = 0; l < LAYERS; l++) {
            const transformed = layerTransform(current, l, badLayer);

            if (useResidual) {
                // y = x + f(x) where f(x) = transformed - current (the correction)
                const correction = transformed.map((t, i) => t - current[i]);
                const result = current.map((x, i) => x + correction[i] * 0.3); // Scaled correction
                current = result;
                outputs.push({
                    values: [...current],
                    quality: signalQuality(INPUT_SIGNAL, current),
                    correction,
                });
            } else {
                // y = f(x) — complete replacement
                current = transformed;
                outputs.push({
                    values: [...current],
                    quality: signalQuality(INPUT_SIGNAL, current),
                });
            }
        }
        return outputs;
    }, [useResidual, badLayer]);

    const finalQuality = layerOutputs[LAYERS - 1]?.quality ?? 0;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Problem setup */}
            <div className="flex items-center justify-between">
                <div className="text-[9px] font-mono text-white/30">
                    Bad layer: <button
                        onClick={() => setBadLayer(b => (b + 1) % LAYERS)}
                        className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold ml-1"
                    >
                        Layer {badLayer + 1}
                    </button>
                </div>
                <button
                    onClick={() => { setUseResidual(r => !r); setShowInsight(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all"
                    style={{
                        backgroundColor: useResidual ? "#22c55e15" : "#f59e0b15",
                        borderColor: useResidual ? "#22c55e30" : "#f59e0b30",
                        color: useResidual ? "#22c55e" : "#f59e0b",
                    }}
                >
                    {useResidual ? "✓ Keep original (y = x + f(x))" : "💡 What if we keep the original?"}
                </button>
            </div>

            {/* Signal flow visualization */}
            <div className="space-y-2">
                {/* Input */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-mono font-bold text-amber-400">Input signal x</span>
                        <InfoLoss quality={1.0} />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        {INPUT_SIGNAL.map((v, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tabular-nums bg-amber-500/10 border border-amber-500/15 text-amber-400">
                                {v.toFixed(2)}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Layers */}
                {layerOutputs.map((layer, l) => {
                    const isBad = l === badLayer;
                    const qualityDrop = l > 0
                        ? layer.quality - layerOutputs[l - 1].quality
                        : layer.quality - 1;
                    const accentColor = isBad
                        ? "#ef4444"
                        : layer.quality > 0.7
                            ? "#22c55e"
                            : layer.quality > 0.3
                                ? "#f59e0b"
                                : "#ef4444";

                    return (
                        <motion.div
                            key={`${l}-${useResidual}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: l * 0.1 }}
                            className="rounded-lg border p-2.5"
                            style={{
                                borderColor: accentColor + "20",
                                backgroundColor: accentColor + "05",
                            }}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono font-bold" style={{ color: accentColor }}>
                                        Layer {l + 1} {isBad ? "⚠️ BAD" : ""}
                                    </span>
                                    {useResidual && (
                                        <span className="text-[7px] font-mono text-emerald-400/50 bg-emerald-500/10 px-1 rounded">
                                            y = x + f(x)
                                        </span>
                                    )}
                                    {!useResidual && (
                                        <span className="text-[7px] font-mono text-white/20 bg-white/[0.03] px-1 rounded">
                                            y = f(x)
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[7px] font-mono" style={{ color: qualityDrop < -0.1 ? "#ef4444" : "#22c55e", opacity: 0.6 }}>
                                        {qualityDrop > 0 ? "+" : ""}{(qualityDrop * 100).toFixed(0)}%
                                    </span>
                                    <InfoLoss quality={layer.quality} />
                                </div>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {layer.values.map((v, i) => (
                                    <span
                                        key={i}
                                        className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tabular-nums border"
                                        style={{
                                            backgroundColor: accentColor + "08",
                                            borderColor: accentColor + "15",
                                            color: accentColor,
                                        }}
                                    >
                                        {v.toFixed(2)}
                                    </span>
                                ))}
                            </div>

                            {/* Show correction when residual is on */}
                            {useResidual && layer.correction && (
                                <div className="mt-1 flex items-center gap-1 text-[7px] font-mono text-violet-400/40">
                                    <span>correction f(x):</span>
                                    {layer.correction.slice(0, 4).map((c, i) => (
                                        <span key={i} className="text-violet-400/50">{c > 0 ? "+" : ""}{(c * 0.3).toFixed(3)}</span>
                                    ))}
                                    <span>…</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Result comparison */}
            <motion.div
                key={`result-${useResidual}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border p-3 text-center space-y-1"
                style={{
                    borderColor: finalQuality > 0.5 ? "#22c55e25" : "#ef444425",
                    backgroundColor: finalQuality > 0.5 ? "#22c55e08" : "#ef444408",
                }}
            >
                <p className="text-[10px] font-mono font-bold" style={{ color: finalQuality > 0.5 ? "#22c55e" : "#ef4444" }}>
                    After {LAYERS} layers: {(finalQuality * 100).toFixed(0)}% of original signal preserved
                </p>
                <p className="text-[8px] font-mono text-white/25">
                    {useResidual
                        ? "Even with a bad layer, the skip connection keeps the original signal alive. The bad layer's damage is limited to a small correction."
                        : `Layer ${badLayer + 1} replaced the signal entirely. All information from before it is gone — there's no undo button.`
                    }
                </p>
            </motion.div>

            {/* Aha moment insight */}
            <AnimatePresence>
                {showInsight && useResidual && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3 space-y-1.5"
                    >
                        <div className="flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-mono font-bold text-violet-300">The key insight</span>
                        </div>
                        <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                            With <span className="text-emerald-400/60 font-bold">y = x + f(x)</span>, each layer doesn&apos;t need to produce the full output.
                            It only learns <span className="text-violet-400/60 font-bold">f(x) = correction</span> — the small change needed.
                            If a layer has nothing useful to say, it can output f(x) ≈ 0 and the signal passes through untouched.
                            This is called a <span className="text-white/50 font-bold">residual connection</span> — He et al., December 2015.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reset */}
            {useResidual && (
                <button
                    onClick={() => { setUseResidual(false); setShowInsight(false); }}
                    className="flex items-center gap-1.5 text-[9px] font-mono text-white/25 hover:text-white/40 transition-colors"
                >
                    <RotateCcw className="w-3 h-3" /> See without residual again
                </button>
            )}
        </div>
    );
}
