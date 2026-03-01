"use client";

import { useMemo,useState } from "react";

/* ─────────────────────────────────────────────
   BatchNormEffectVisualizer
   Shows how Batch Normalization stabilizes
   activation distributions across layers.
   ───────────────────────────────────────────── */

const NUM_LAYERS = 5;
const NUM_BINS = 30;
const BIN_RANGE = { min: -6, max: 6 };

function seededRng(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// Box-Muller transform for gaussian samples
function gaussianSamples(mean: number, std: number, n: number, seed: number): number[] {
    const rng = seededRng(seed);
    const samples: number[] = [];
    for (let i = 0; i < n; i += 2) {
        const u1 = Math.max(1e-10, rng());
        const u2 = rng();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
        samples.push(z0 * std + mean);
        if (i + 1 < n) samples.push(z1 * std + mean);
    }
    return samples;
}

function histogram(samples: number[]): number[] {
    const bins = new Array(NUM_BINS).fill(0);
    const range = BIN_RANGE.max - BIN_RANGE.min;
    for (const s of samples) {
        const idx = Math.floor(((s - BIN_RANGE.min) / range) * NUM_BINS);
        if (idx >= 0 && idx < NUM_BINS) bins[idx]++;
    }
    const max = Math.max(...bins, 1);
    return bins.map((b) => b / max);
}

interface LayerDist {
    label: string;
    withoutBN: number[];
    withBN: number[];
    meanWithout: string;
    stdWithout: string;
}

function generateLayerDistributions(): LayerDist[] {
    return Array.from({ length: NUM_LAYERS }, (_, i) => {
        // Without BatchNorm: mean and std drift progressively
        const meanDrift = (i - 1) * 0.8;
        const stdDrift = 0.8 + i * 0.6;
        const samplesWithout = gaussianSamples(meanDrift, stdDrift, 500, 42 + i * 100);
        const withoutBN = histogram(samplesWithout);

        // With BatchNorm: stays near N(0,1)
        const samplesNormed = gaussianSamples(0, 1, 500, 137 + i * 100);
        const withBN = histogram(samplesNormed);

        const actualMean = samplesWithout.reduce((a, b) => a + b, 0) / samplesWithout.length;
        const actualStd = Math.sqrt(
            samplesWithout.reduce((a, b) => a + (b - actualMean) ** 2, 0) / samplesWithout.length
        );

        return {
            label: i === 0 ? "Layer 1" : i === NUM_LAYERS - 1 ? `Layer ${NUM_LAYERS}` : `Layer ${i + 1}`,
            withoutBN,
            withBN,
            meanWithout: actualMean.toFixed(2),
            stdWithout: actualStd.toFixed(2),
        };
    });
}

const BAR_W = 280;
const BAR_H = 40;

function MiniHistogram({ bins, color, enabled }: { bins: number[]; color: string; enabled: boolean }) {
    const binW = BAR_W / NUM_BINS;
    return (
        <svg viewBox={`0 0 ${BAR_W} ${BAR_H}`} className="w-full" style={{ maxHeight: 50 }}>
            {bins.map((h, i) => (
                <rect
                    key={i}
                    x={i * binW}
                    y={BAR_H - h * BAR_H}
                    width={binW - 0.5}
                    height={h * BAR_H}
                    fill={color}
                    opacity={enabled ? 0.7 : 0.15}
                    rx={0.5}
                />
            ))}
            {/* Center line */}
            <line
                x1={BAR_W / 2}
                y1={0}
                x2={BAR_W / 2}
                y2={BAR_H}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={0.5}
                strokeDasharray="2 2"
            />
        </svg>
    );
}

export function BatchNormEffectVisualizer() {
    const [bnEnabled, setBnEnabled] = useState(false);
    const layers = useMemo(() => generateLayerDistributions(), []);

    return (
        <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setBnEnabled(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        !bnEnabled
                            ? "text-rose-400 bg-rose-500/15 border border-rose-500/30"
                            : "text-white/30 bg-white/[0.02] border border-white/[0.06] hover:border-white/15"
                    }`}
                >
                    Without BatchNorm
                </button>
                <button
                    onClick={() => setBnEnabled(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        bnEnabled
                            ? "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30"
                            : "text-white/30 bg-white/[0.02] border border-white/[0.06] hover:border-white/15"
                    }`}
                >
                    With BatchNorm
                </button>
            </div>

            {/* Layer distributions */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">
                        Activation Distributions Per Layer
                    </span>
                    <span className="text-[10px] font-mono text-white/20">
                        range: [{BIN_RANGE.min}, {BIN_RANGE.max}]
                    </span>
                </div>

                {layers.map((layer, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-white/30 w-14 text-right shrink-0">
                            {layer.label}
                        </span>
                        <div className="flex-1">
                            <MiniHistogram
                                bins={bnEnabled ? layer.withBN : layer.withoutBN}
                                color={bnEnabled ? "rgb(52,211,153)" : "rgb(251,113,133)"}
                                enabled={true}
                            />
                        </div>
                        {!bnEnabled && (
                            <span className="text-[9px] font-mono text-white/20 w-24 text-right shrink-0">
                                μ={layer.meanWithout} σ={layer.stdWithout}
                            </span>
                        )}
                        {bnEnabled && (
                            <span className="text-[9px] font-mono text-emerald-400/40 w-24 text-right shrink-0">
                                μ≈0 σ≈1
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Explanation */}
            <p className="text-[11px] text-white/25 leading-relaxed">
                {bnEnabled
                    ? "With Batch Normalization, every layer's activations are re-centered to mean ≈ 0 and standard deviation ≈ 1. This keeps the distributions consistent regardless of depth, making training stable and fast."
                    : "Without normalization, activation distributions drift and spread as signals propagate through layers. Deeper layers may see saturated or wildly varying activations, making gradient-based learning unreliable."}
            </p>
        </div>
    );
}
