"use client";

import { useState, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  ResidualHighwayVisual — v2
  Shows the correction-vs-replacement concept with REAL numbers.
  - 6 layers, each with concrete input/output values
  - Toggle: y=f(x) vs y=x+f(x)
  - Step through layers to see values at each point
  - Shows: input x, layer output f(x), correction f(x)-x, final y
  - Signal quality bar per layer (cosine similarity to original)
  - Layer 4 is intentionally "bad" to show resilience
*/

const NUM_LAYERS = 6;
const INPUT = [0.8, -0.3, 0.5, 0.9];

// Pre-computed layer transforms (deterministic for reproducibility)
const LAYER_TRANSFORMS: ((x: number[]) => number[])[] = [
    (x) => x.map(v => v * 0.92 + 0.08),                    // L1: gentle
    (x) => x.map(v => Math.tanh(v * 1.1)),                  // L2: activation
    (x) => x.map(v => v * 0.88 - 0.05),                     // L3: slight shift
    (x) => x.map((_, i) => (i % 2 === 0 ? 0.02 : -0.01)),  // L4: BAD — kills signal
    (x) => x.map(v => Math.tanh(v * 0.9 + 0.1)),            // L5: tries to recover
    (x) => x.map(v => v * 0.95),                             // L6: mild
];

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2;
    }
    return na === 0 || nb === 0 ? 0 : Math.max(0, dot / (Math.sqrt(na) * Math.sqrt(nb)));
}

interface LayerResult {
    input: number[];
    fOutput: number[];    // f(x) raw
    correction: number[]; // f(x) - input (what the layer "wants to change")
    output: number[];     // final output (either f(x) or x + scaled_correction)
    quality: number;      // cosine sim to original input
    isBad: boolean;
}

function computeLayers(useResidual: boolean): LayerResult[] {
    const results: LayerResult[] = [];
    let current = [...INPUT];

    for (let l = 0; l < NUM_LAYERS; l++) {
        const inp = [...current];
        const fOut = LAYER_TRANSFORMS[l](current);
        const isBad = l === 3;

        if (useResidual) {
            // y = x + α·(f(x) - x), where α=0.3 to simulate learned small corrections
            const corr = fOut.map((f, i) => f - inp[i]);
            const out = inp.map((x, i) => x + corr[i] * 0.3);
            current = out;
            results.push({ input: inp, fOutput: fOut, correction: corr, output: out, quality: cosineSimilarity(INPUT, out), isBad });
        } else {
            // y = f(x) — full replacement
            const corr = fOut.map((f, i) => f - inp[i]);
            current = fOut;
            results.push({ input: inp, fOutput: fOut, correction: corr, output: fOut, quality: cosineSimilarity(INPUT, fOut), isBad });
        }
    }
    return results;
}

export function ResidualHighwayVisual() {
    const [useResidual, setUseResidual] = useState(false);
    const [activeLayer, setActiveLayer] = useState<number | null>(null);

    const layers = useMemo(() => computeLayers(useResidual), [useResidual]);
    const finalQ = layers[NUM_LAYERS - 1].quality;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                    <button
                        onClick={() => setUseResidual(false)}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all ${!useResidual
                            ? "bg-red-500/20 text-red-400" : "bg-white/[0.02] text-white/30 hover:text-white/50"}`}
                    >
                        y = f(x) · replace
                    </button>
                    <button
                        onClick={() => setUseResidual(true)}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all border-l border-white/10 ${useResidual
                            ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.02] text-white/30 hover:text-white/50"}`}
                    >
                        y = x + f(x) · correct
                    </button>
                </div>
            </div>

            {/* Layer flow with real numbers */}
            <div className="space-y-1.5">
                {/* Input row */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-2 flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-amber-400 w-14 shrink-0">Input x</span>
                    <div className="flex gap-1 flex-1">
                        {INPUT.map((v, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tabular-nums bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                {v.toFixed(2)}
                            </span>
                        ))}
                    </div>
                    <QualityBar quality={1} />
                </div>

                {/* Layer rows */}
                {layers.map((lr, l) => {
                    const color = lr.isBad ? "#ef4444" : lr.quality > 0.7 ? "#22c55e" : lr.quality > 0.3 ? "#f59e0b" : "#ef4444";
                    const isActive = activeLayer === l;
                    return (
                        <motion.div
                            key={`${l}-${useResidual}`}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: l * 0.06 }}
                            className="rounded-lg border p-2 cursor-pointer transition-all"
                            style={{
                                borderColor: isActive ? color + "40" : color + "15",
                                backgroundColor: isActive ? color + "0a" : color + "04",
                            }}
                            onClick={() => setActiveLayer(isActive ? null : l)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono font-bold w-14 shrink-0" style={{ color }}>
                                    L{l + 1} {lr.isBad ? "⚠️" : ""}
                                </span>
                                <div className="flex gap-1 flex-1">
                                    {lr.output.map((v, i) => (
                                        <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tabular-nums border"
                                            style={{ backgroundColor: color + "0a", borderColor: color + "20", color }}>
                                            {v.toFixed(2)}
                                        </span>
                                    ))}
                                </div>
                                <QualityBar quality={lr.quality} />
                                <span className="text-[7px] font-mono font-bold tabular-nums w-8 text-right" style={{ color }}>
                                    {(lr.quality * 100).toFixed(0)}%
                                </span>
                            </div>

                            {/* Expanded detail */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-2 pt-2 border-t space-y-1.5" style={{ borderColor: color + "15" }}>
                                            {/* f(x) output */}
                                            <div className="flex items-center gap-1.5 text-[8px] font-mono">
                                                <span className="text-white/25 w-16 shrink-0">f(x) raw:</span>
                                                {lr.fOutput.map((v, i) => (
                                                    <span key={i} className="text-white/30 tabular-nums">{v.toFixed(3)}</span>
                                                ))}
                                            </div>
                                            {/* Correction */}
                                            <div className="flex items-center gap-1.5 text-[8px] font-mono">
                                                <span className="text-violet-400/40 w-16 shrink-0">correction:</span>
                                                {lr.correction.map((v, i) => (
                                                    <span key={i} className="tabular-nums" style={{ color: Math.abs(v) > 0.5 ? "#ef444480" : "#a78bfa60" }}>
                                                        {v > 0 ? "+" : ""}{(useResidual ? v * 0.3 : v).toFixed(3)}
                                                    </span>
                                                ))}
                                            </div>
                                            {/* Explanation */}
                                            <p className="text-[8px] font-mono text-white/20 leading-relaxed">
                                                {lr.isBad
                                                    ? useResidual
                                                        ? "Bad layer tried to kill the signal, but the skip connection kept the original. Damage limited to small corrections."
                                                        : "Bad layer REPLACED the entire signal. Original information is gone forever — no recovery possible."
                                                    : useResidual
                                                        ? `Layer applied a small correction (max Δ = ${Math.max(...lr.correction.map(c => Math.abs(c * 0.3))).toFixed(3)}). Original signal preserved.`
                                                        : `Layer replaced the signal entirely. Quality dropped to ${(lr.quality * 100).toFixed(0)}%.`
                                                }
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Final verdict */}
            <motion.div
                key={`verdict-${useResidual}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border p-3 text-center space-y-1"
                style={{
                    borderColor: finalQ > 0.5 ? "#22c55e25" : "#ef444425",
                    backgroundColor: finalQ > 0.5 ? "#22c55e08" : "#ef444408",
                }}
            >
                <p className="text-[10px] font-mono font-bold" style={{ color: finalQ > 0.5 ? "#22c55e" : "#ef4444" }}>
                    After {NUM_LAYERS} layers: {(finalQ * 100).toFixed(0)}% of original signal preserved
                </p>
                <p className="text-[8px] font-mono text-white/25">
                    {useResidual
                        ? "Each layer only corrects — never replaces. Even the bad layer (L4) couldn't destroy the signal. Click any layer to see the math."
                        : "Each layer replaces the signal entirely. Layer 4 destroyed the information and layers 5–6 couldn't recover it. Click any layer for details."
                    }
                </p>
            </motion.div>
        </div>
    );
}

function QualityBar({ quality }: { quality: number }) {
    const color = quality > 0.7 ? "#22c55e" : quality > 0.3 ? "#f59e0b" : "#ef4444";
    return (
        <div className="w-14 h-2 rounded-full bg-white/[0.04] overflow-hidden shrink-0">
            <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                animate={{ width: `${quality * 100}%`, opacity: 0.6 }}
                transition={{ duration: 0.4 }}
            />
        </div>
    );
}
