"use client";

import { useState, useMemo } from "react";

import { motion } from "framer-motion";

/*
  GammaBetaVisualizer
  Interactive demo of BatchNorm's learnable parameters γ (scale) and β (shift).
  Shows a normalized distribution (mean=0, std=1) and lets the user adjust γ and β
  to see how the output distribution changes. Includes presets and explanation.
  For use in the hidden panel.
*/

const NUM_BINS = 30;
const X_RANGE = { min: -5, max: 5 };

function gaussianBins(mean: number, std: number): number[] {
    const bins: number[] = [];
    for (let i = 0; i < NUM_BINS; i++) {
        const x = X_RANGE.min + (i / (NUM_BINS - 1)) * (X_RANGE.max - X_RANGE.min);
        const val = Math.exp(-0.5 * ((x - mean) / std) ** 2) / (std * Math.sqrt(2 * Math.PI));
        bins.push(val);
    }
    return bins;
}

const PRESETS = [
    { label: "Default (no change)", gamma: 1.0, beta: 0.0, desc: "γ=1, β=0: output equals normalized input. The network chose to keep BN's normalization." },
    { label: "Wider spread", gamma: 2.0, beta: 0.0, desc: "γ=2: the network learned it needs more variance in this feature — maybe to differentiate rare vs common patterns." },
    { label: "Shifted right", gamma: 1.0, beta: 1.5, desc: "γ=1, β=1.5: the network learned this feature should be biased positive — maybe this neuron detects vowels." },
    { label: "Undo BN entirely", gamma: 1.8, beta: 2.5, desc: "The network CAN learn to reverse normalization. But it almost never does — normalized inputs are easier to learn from." },
    { label: "Narrow & precise", gamma: 0.3, beta: 0.0, desc: "γ=0.3: the network squeezes this feature into a narrow range. Useful for features that should be near-binary (on/off)." },
];

export function GammaBetaVisualizer() {
    const [gamma, setGamma] = useState(1.0);
    const [beta, setBeta] = useState(0.0);

    // Normalized distribution (input to γ/β transform)
    const normalizedBins = useMemo(() => gaussianBins(0, 1), []);
    // Output distribution after γ·x̂ + β
    const outputBins = useMemo(() => gaussianBins(beta, Math.abs(gamma)), [gamma, beta]);
    const maxBin = Math.max(...normalizedBins, ...outputBins, 0.01);

    // Find closest preset
    const activePreset = PRESETS.findIndex(p =>
        Math.abs(p.gamma - gamma) < 0.15 && Math.abs(p.beta - beta) < 0.15
    );

    return (
        <div className="space-y-4">
            {/* Formula display */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-4 text-center space-y-2">
                <div className="space-y-1">
                    <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">BatchNorm Output</p>
                    <div className="flex items-center justify-center gap-1.5 text-lg font-mono">
                        <span className="text-white/30">y =</span>
                        <span className="text-violet-400 font-bold">{gamma.toFixed(1)}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-emerald-400">x̂</span>
                        <span className="text-white/20">+</span>
                        <span className="text-amber-400 font-bold">{beta >= 0 ? "" : ""}{beta.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-[8px] font-mono text-white/20">
                        <span><span className="text-violet-400">γ</span> = learned scale</span>
                        <span>·</span>
                        <span><span className="text-emerald-400">x̂</span> = normalized</span>
                        <span>·</span>
                        <span><span className="text-amber-400">β</span> = learned shift</span>
                    </div>
                </div>
            </div>

            {/* Distribution comparison */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-[8px] font-mono text-white/20">
                    <span>Distribution comparison</span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 rounded bg-emerald-400/50" /> x̂ (normalized)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 rounded bg-violet-400/80" /> y = γx̂ + β
                        </span>
                    </div>
                </div>

                {/* Overlaid histograms */}
                <svg viewBox={`0 0 ${NUM_BINS * 10} 60`} className="w-full h-auto" style={{ maxHeight: 100 }}>
                    {/* Normalized (green, behind) */}
                    {normalizedBins.map((h, i) => (
                        <rect
                            key={`n-${i}`}
                            x={i * 10}
                            y={60 - (h / maxBin) * 55}
                            width={9}
                            height={(h / maxBin) * 55}
                            fill="#10b981"
                            opacity={0.2}
                            rx={1}
                        />
                    ))}
                    {/* Output (violet, front) */}
                    {outputBins.map((h, i) => (
                        <motion.rect
                            key={`o-${i}`}
                            x={i * 10 + 1}
                            width={7}
                            rx={1}
                            fill="#8b5cf6"
                            opacity={0.5}
                            animate={{
                                y: 60 - (h / maxBin) * 55,
                                height: (h / maxBin) * 55,
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    ))}
                    {/* Center line */}
                    <line
                        x1={NUM_BINS * 5}
                        y1={0}
                        x2={NUM_BINS * 5}
                        y2={60}
                        stroke="white"
                        strokeOpacity={0.08}
                        strokeDasharray="2 2"
                    />
                    {/* Zero label */}
                    <text x={NUM_BINS * 5} y={58} textAnchor="middle" fontSize={5} fill="white" fillOpacity={0.15} fontFamily="monospace">0</text>
                </svg>

                {/* Output stats */}
                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5">
                        <p className="text-[6px] font-mono text-white/15">OUTPUT MEAN</p>
                        <p className="text-sm font-mono font-bold text-amber-400">{beta.toFixed(1)}</p>
                    </div>
                    <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5">
                        <p className="text-[6px] font-mono text-white/15">OUTPUT STD</p>
                        <p className="text-sm font-mono font-bold text-violet-400">{Math.abs(gamma).toFixed(1)}</p>
                    </div>
                </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-violet-400 font-bold w-6">γ</span>
                    <input
                        type="range" min={0.1} max={3.0} step={0.1} value={gamma}
                        onChange={e => setGamma(+e.target.value)}
                        className="flex-1 h-1.5 accent-violet-500 bg-white/10 rounded-full"
                    />
                    <span className="text-[11px] font-mono font-bold text-violet-400 w-8 text-right">{gamma.toFixed(1)}</span>
                    <span className="text-[7px] font-mono text-white/15 w-10">(scale)</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-amber-400 font-bold w-6">β</span>
                    <input
                        type="range" min={-3.0} max={3.0} step={0.1} value={beta}
                        onChange={e => setBeta(+e.target.value)}
                        className="flex-1 h-1.5 accent-amber-500 bg-white/10 rounded-full"
                    />
                    <span className="text-[11px] font-mono font-bold text-amber-400 w-8 text-right">{beta.toFixed(1)}</span>
                    <span className="text-[7px] font-mono text-white/15 w-10">(shift)</span>
                </div>
            </div>

            {/* Presets */}
            <div className="space-y-1">
                <p className="text-[8px] font-mono text-white/15 uppercase tracking-widest">Presets — what might the network learn?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {PRESETS.map((preset, i) => (
                        <button
                            key={i}
                            onClick={() => { setGamma(preset.gamma); setBeta(preset.beta); }}
                            className={`text-left p-2 rounded-lg border transition-all ${
                                activePreset === i
                                    ? "border-violet-500/30 bg-violet-500/10"
                                    : "border-white/[0.04] bg-white/[0.02] hover:border-white/10"
                            }`}
                        >
                            <p className={`text-[9px] font-mono font-bold ${activePreset === i ? "text-violet-400" : "text-white/30"}`}>
                                {preset.label}
                            </p>
                            <p className="text-[7px] font-mono text-white/15 leading-relaxed mt-0.5">
                                {preset.desc}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
