"use client";

import { useState, useMemo, useCallback } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  BatchNormDiscoveryVisualizer
  Interactive step-by-step BN calculation on a real batch.
  1. Show raw activations (drifted, bad)
  2. Compute mean μ
  3. Subtract mean → centered
  4. Compute std σ
  5. Divide by σ → normalized
  6. Apply γ and β (learnable) → final
  User can adjust sliders and see each operation live.
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

const BATCH_SIZE = 8;

const BN_STEPS = [
    { id: 0, title: "Raw activations", emoji: "📊" },
    { id: 1, title: "Compute mean μ", emoji: "📐" },
    { id: 2, title: "Center: x − μ", emoji: "⬅️" },
    { id: 3, title: "Compute std σ", emoji: "📏" },
    { id: 4, title: "Normalize: x̂ = (x−μ)/σ", emoji: "✅" },
    { id: 5, title: "Scale & shift: γx̂ + β", emoji: "🎛️" },
];

function generateBatch(seed: number): number[] {
    const rng = seededRng(seed);
    // Simulate drifted activations (mean ≈ 2.5, std ≈ 1.8) — NOT healthy
    return Array.from({ length: BATCH_SIZE }, () => boxMuller(rng, 2.5, 1.8));
}

function ValueBar({ value, minRange, maxRange, color, highlight }: {
    value: number; minRange: number; maxRange: number; color: string; highlight?: boolean;
}) {
    const range = maxRange - minRange;
    const pct = ((value - minRange) / range) * 100;
    const clampedPct = Math.max(2, Math.min(98, pct));

    return (
        <div className="relative h-5 bg-white/[0.03] rounded-sm overflow-hidden">
            {/* Zero line if in range */}
            {minRange < 0 && maxRange > 0 && (
                <div
                    className="absolute top-0 h-full w-px bg-white/10"
                    style={{ left: `${((0 - minRange) / range) * 100}%` }}
                />
            )}
            {/* Value marker */}
            <motion.div
                className="absolute top-0 h-full rounded-sm"
                style={{ width: 3, backgroundColor: color }}
                initial={{ left: "50%" }}
                animate={{ left: `${clampedPct}%`, opacity: highlight ? 1 : 0.7 }}
                transition={{ duration: 0.4 }}
            />
            {/* Value label */}
            <motion.span
                className="absolute top-0.5 text-[7px] font-mono font-bold"
                style={{ color, left: `${Math.min(85, Math.max(2, clampedPct + 1))}%` }}
                animate={{ opacity: 1 }}
            >
                {value.toFixed(2)}
            </motion.span>
        </div>
    );
}

export function BatchNormDiscoveryVisualizer() {
    const [step, setStep] = useState(0);
    const [seed, setSeed] = useState(42);
    const [gamma, setGamma] = useState(1.0);
    const [beta, setBeta] = useState(0.0);

    const resample = useCallback(() => { setSeed(s => s + 1); setStep(0); }, []);

    const raw = useMemo(() => generateBatch(seed), [seed]);

    // Computed values at each step
    const mu = useMemo(() => raw.reduce((a, b) => a + b, 0) / raw.length, [raw]);
    const centered = useMemo(() => raw.map(x => x - mu), [raw, mu]);
    const sigma = useMemo(() => {
        const variance = centered.reduce((a, b) => a + b * b, 0) / centered.length;
        return Math.sqrt(variance + 1e-5);
    }, [centered]);
    const normalized = useMemo(() => centered.map(x => x / sigma), [centered, sigma]);
    const scaled = useMemo(() => normalized.map(x => gamma * x + beta), [normalized, gamma, beta]);

    // Current values to display
    const currentValues = step === 0 ? raw
        : step <= 1 ? raw
        : step === 2 ? centered
        : step === 3 ? centered
        : step === 4 ? normalized
        : scaled;

    // Color and range per step
    const stepColor = step <= 1 ? "#ef4444" : step <= 3 ? "#f59e0b" : step === 4 ? "#22c55e" : "#8b5cf6";
    const allValues = [...raw, ...centered, ...normalized, ...scaled];
    const absMax = Math.max(...allValues.map(Math.abs), 1);
    const displayMin = step <= 1 ? Math.min(...raw) - 0.5 : -absMax - 0.5;
    const displayMax = step <= 1 ? Math.max(...raw) + 0.5 : absMax + 0.5;

    // Stats for current values
    const currentMean = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
    const currentVar = currentValues.reduce((a, b) => a + (b - currentMean) ** 2, 0) / currentValues.length;
    const currentStd = Math.sqrt(currentVar);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Step navigation */}
            <div className="flex gap-1 overflow-x-auto">
                {BN_STEPS.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setStep(i)}
                        className={`shrink-0 px-2 py-1.5 rounded-md text-[8px] font-mono text-center transition-all border ${
                            i === step
                                ? "border-violet-500/40 bg-violet-500/15 text-violet-400"
                                : i < step
                                    ? "border-white/[0.08] bg-white/[0.03] text-white/30"
                                    : "border-white/[0.04] bg-white/[0.01] text-white/15"
                        }`}
                    >
                        {s.emoji} {s.title}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${step}-${seed}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                >
                    {/* Step explanation */}
                    <div className="rounded-lg border p-3 space-y-1" style={{
                        borderColor: stepColor + "20",
                        backgroundColor: stepColor + "08",
                    }}>
                        <p className="text-[10px] font-mono font-bold" style={{ color: stepColor }}>
                            Step {step + 1}: {BN_STEPS[step].title}
                        </p>
                        <p className="text-[8px] font-mono text-white/30 leading-relaxed">
                            {step === 0 && "These are the raw activations from one neuron across 8 examples in a mini-batch. Notice: they're NOT centered at 0, and the spread is uneven. This is what happens after the weights drift during training."}
                            {step === 1 && `Compute the batch mean: μ = (1/${BATCH_SIZE}) × Σxᵢ = ${mu.toFixed(3)}. This tells us how far off-center the activations are. Ideally we want μ ≈ 0.`}
                            {step === 2 && `Subtract the mean from every value: x − μ. Now the activations are centered at 0 (mean = ${currentMean.toFixed(4)}). But the spread (variance) might still be wrong.`}
                            {step === 3 && `Compute the batch standard deviation: σ = √(Var + ε) = ${sigma.toFixed(3)}. The ε = 0.00001 prevents division by zero. σ tells us how spread out the values are.`}
                            {step === 4 && `Divide each centered value by σ: x̂ = (x − μ) / σ. Now mean ≈ 0 AND std ≈ 1. Every neuron sees a healthy, standardized distribution — no matter what the weights are doing.`}
                            {step === 5 && "But always forcing mean=0, std=1 would limit what the network can learn. So we add learnable parameters: y = γ·x̂ + β. The network can learn to shift (β) and scale (γ) the distribution. If it wants mean=0, it keeps β=0 and γ=1. If it needs something different, it adjusts."}
                        </p>
                    </div>

                    {/* Values display */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 space-y-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[8px] font-mono text-white/20">
                                {step === 0 ? "Raw activations (batch of 8)" :
                                 step === 1 ? "Computing μ from batch..." :
                                 step === 2 ? "After centering: x − μ" :
                                 step === 3 ? "Computing σ from centered values..." :
                                 step === 4 ? "After normalizing: (x − μ) / σ" :
                                 `After scale & shift: ${gamma.toFixed(1)}·x̂ + ${beta.toFixed(1)}`}
                            </span>
                            <button onClick={resample} className="text-[7px] font-mono text-white/15 hover:text-white/30 transition-colors">
                                🎲 New batch
                            </button>
                        </div>

                        {currentValues.map((val, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[7px] font-mono text-white/15 w-5 text-right shrink-0">
                                    x{i + 1}
                                </span>
                                <div className="flex-1">
                                    <ValueBar
                                        value={val}
                                        minRange={displayMin}
                                        maxRange={displayMax}
                                        color={stepColor}
                                    />
                                </div>
                                {/* Show operation */}
                                {step === 1 && (
                                    <span className="text-[7px] font-mono text-white/15 w-16 text-right shrink-0">
                                        {i < BATCH_SIZE - 1 ? "+" : `÷${BATCH_SIZE}`}
                                    </span>
                                )}
                                {step === 2 && (
                                    <span className="text-[7px] font-mono text-amber-400/40 w-20 text-right shrink-0">
                                        {raw[i].toFixed(2)} − {mu.toFixed(2)}
                                    </span>
                                )}
                                {step === 4 && (
                                    <span className="text-[7px] font-mono text-emerald-400/40 w-20 text-right shrink-0">
                                        {centered[i].toFixed(2)} ÷ {sigma.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        ))}

                        {/* Mean/Sigma result line */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-center gap-2"
                            >
                                <span className="text-[9px] font-mono text-red-400/60">μ = {mu.toFixed(3)}</span>
                                <span className="text-[7px] font-mono text-white/15">(should be ≈ 0)</span>
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-center gap-2"
                            >
                                <span className="text-[9px] font-mono text-amber-400/60">σ = {sigma.toFixed(3)}</span>
                                <span className="text-[7px] font-mono text-white/15">(should be ≈ 1)</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                            <p className="text-[6px] font-mono text-white/20">MEAN</p>
                            <p className="text-sm font-mono font-bold" style={{
                                color: Math.abs(currentMean) < 0.1 ? "#22c55e" : Math.abs(currentMean) < 1 ? "#f59e0b" : "#ef4444"
                            }}>
                                {currentMean.toFixed(3)}
                            </p>
                            <p className="text-[6px] font-mono text-white/10">target: 0</p>
                        </div>
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                            <p className="text-[6px] font-mono text-white/20">STD</p>
                            <p className="text-sm font-mono font-bold" style={{
                                color: Math.abs(currentStd - 1) < 0.2 ? "#22c55e" : Math.abs(currentStd - 1) < 1 ? "#f59e0b" : "#ef4444"
                            }}>
                                {currentStd.toFixed(3)}
                            </p>
                            <p className="text-[6px] font-mono text-white/10">target: 1</p>
                        </div>
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                            <p className="text-[6px] font-mono text-white/20">STATUS</p>
                            <p className={`text-[9px] font-mono font-bold ${
                                step >= 4 ? "text-emerald-400" : step >= 2 ? "text-amber-400" : "text-red-400"
                            }`}>
                                {step === 0 ? "Drifted" : step === 1 ? "Measuring" : step === 2 ? "Centered" : step === 3 ? "Measuring" : step === 4 ? "Normalized ✓" : "Learned ✓"}
                            </p>
                        </div>
                    </div>

                    {/* γ and β sliders (only on step 5) */}
                    {step === 5 && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-3 space-y-3"
                        >
                            <p className="text-[9px] font-mono font-bold text-violet-400">Learnable parameters</p>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-mono text-white/30 w-8">γ =</span>
                                    <input
                                        type="range" min={0.1} max={3.0} step={0.1} value={gamma}
                                        onChange={e => setGamma(+e.target.value)}
                                        className="flex-1 h-1 accent-violet-500 bg-white/10 rounded-full"
                                    />
                                    <span className="text-[10px] font-mono font-bold text-violet-400 w-8 text-right">
                                        {gamma.toFixed(1)}
                                    </span>
                                    <span className="text-[7px] font-mono text-white/15">(scale)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-mono text-white/30 w-8">β =</span>
                                    <input
                                        type="range" min={-3.0} max={3.0} step={0.1} value={beta}
                                        onChange={e => setBeta(+e.target.value)}
                                        className="flex-1 h-1 accent-violet-500 bg-white/10 rounded-full"
                                    />
                                    <span className="text-[10px] font-mono font-bold text-violet-400 w-8 text-right">
                                        {beta.toFixed(1)}
                                    </span>
                                    <span className="text-[7px] font-mono text-white/15">(shift)</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setGamma(1.0); setBeta(0.0); }}
                                    className="text-[8px] font-mono text-white/20 hover:text-white/40 px-2 py-1 rounded border border-white/[0.06] transition-colors"
                                >
                                    Reset (γ=1, β=0)
                                </button>
                                <button
                                    onClick={() => { setGamma(sigma); setBeta(mu); }}
                                    className="text-[8px] font-mono text-red-400/40 hover:text-red-400/60 px-2 py-1 rounded border border-red-500/10 transition-colors"
                                >
                                    Undo BN (γ=σ, β=μ) → back to raw
                                </button>
                            </div>

                            <p className="text-[7px] font-mono text-white/15 leading-relaxed">
                                Try clicking &ldquo;Undo BN&rdquo; — the network CAN learn to reverse normalization entirely. But it rarely does, because normalized inputs are easier to learn from. The γ and β give the network freedom without taking away the stability benefit.
                            </p>
                        </motion.div>
                    )}

                    {/* Formula at each step */}
                    <div className="text-center text-[8px] font-mono text-white/15">
                        {step === 0 && "x = raw activations from layer output"}
                        {step === 1 && `μ = (1/B) Σxᵢ = (1/${BATCH_SIZE}) × ${raw.reduce((a, b) => a + b, 0).toFixed(2)} = ${mu.toFixed(3)}`}
                        {step === 2 && `x_centered = x − μ = x − ${mu.toFixed(3)}`}
                        {step === 3 && `σ = √(Var(x_centered) + ε) = √(${(sigma ** 2 - 1e-5).toFixed(4)} + 0.00001) = ${sigma.toFixed(3)}`}
                        {step === 4 && `x̂ = (x − μ) / σ = (x − ${mu.toFixed(3)}) / ${sigma.toFixed(3)}`}
                        {step === 5 && `y = γ·x̂ + β = ${gamma.toFixed(1)}·x̂ + ${beta.toFixed(1)}`}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Step navigation buttons */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                    className="text-[10px] font-mono text-white/30 hover:text-white/50 disabled:text-white/10 disabled:cursor-not-allowed transition-colors"
                >
                    ← Previous
                </button>
                <span className="text-[8px] font-mono text-white/15">
                    {step + 1} / {BN_STEPS.length}
                </span>
                <button
                    onClick={() => setStep(Math.min(BN_STEPS.length - 1, step + 1))}
                    disabled={step === BN_STEPS.length - 1}
                    className="text-[10px] font-mono text-violet-400/60 hover:text-violet-400 disabled:text-white/10 disabled:cursor-not-allowed transition-colors"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
