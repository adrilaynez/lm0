"use client";

import { useState, useMemo, useCallback } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  VarianceExplosionVisualizer
  Step-by-step walkthrough: a single neuron with N inputs.
  Shows WHY σ=1 weights cause variance to explode:
    - Step 1: Show N input values (drawn from previous layer, variance ~1)
    - Step 2: Show N random weights (drawn from σ=1 or Kaiming)
    - Step 3: Multiply each input × weight → products
    - Step 4: Sum all products → weighted sum (show variance = N)
    - Step 5: Apply tanh → saturated output
  Toggle between Naive (σ=1) and Kaiming (σ=√(2/N)).
  Adjustable N (8, 32, 64, 128).
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

const N_OPTIONS = [8, 32, 64, 128] as const;

const STEPS = [
    { id: 0, title: "Inputs from previous layer", desc: "Each input xᵢ comes from the previous layer with variance ≈ 1.0 (healthy activations)." },
    { id: 1, title: "Random weights", desc: "" }, // desc set dynamically
    { id: 2, title: "Multiply: xᵢ × wᵢ", desc: "Each input is multiplied by its weight. Each product has variance = Var(x) × Var(w)." },
    { id: 3, title: "Sum all products", desc: "" }, // desc set dynamically
    { id: 4, title: "Apply tanh activation", desc: "" }, // desc set dynamically
];

interface NeuronData {
    inputs: number[];
    weights: number[];
    products: number[];
    sum: number;
    tanhOut: number;
    inputVar: number;
    weightVar: number;
    productVar: number;
}

function generateNeuronData(N: number, useKaiming: boolean, seed: number): NeuronData {
    const rng = seededRng(seed);
    const sigma = useKaiming ? Math.sqrt(2 / N) : 1.0;

    const inputs: number[] = [];
    const weights: number[] = [];
    for (let i = 0; i < N; i++) {
        inputs.push(boxMuller(rng, 0, 1.0));
        weights.push(boxMuller(rng, 0, sigma));
    }

    const products = inputs.map((x, i) => x * weights[i]);
    const sum = products.reduce((a, b) => a + b, 0);
    const tanhOut = Math.tanh(sum);

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = (arr: number[]) => {
        const m = mean(arr);
        return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
    };

    return {
        inputs, weights, products, sum, tanhOut,
        inputVar: variance(inputs),
        weightVar: variance(weights),
        productVar: variance(products),
    };
}

function MiniBar({ value, maxAbs, color, width = 3 }: { value: number; maxAbs: number; color: string; width?: number }) {
    const pct = Math.min(1, Math.abs(value) / maxAbs);
    const isPos = value >= 0;
    return (
        <div className="flex items-center h-3" style={{ width: `${width}rem` }}>
            <div className="w-full h-full relative bg-white/[0.03] rounded-sm overflow-hidden">
                <div
                    className="absolute top-0 h-full rounded-sm"
                    style={{
                        backgroundColor: color,
                        opacity: 0.5,
                        width: `${pct * 50}%`,
                        left: isPos ? "50%" : `${50 - pct * 50}%`,
                    }}
                />
                <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
            </div>
        </div>
    );
}

export function VarianceExplosionVisualizer() {
    const [N, setN] = useState<number>(64);
    const [mode, setMode] = useState<"naive" | "kaiming">("naive");
    const [step, setStep] = useState(0);
    const [seed, setSeed] = useState(42);

    const data = useMemo(() => generateNeuronData(N, mode === "kaiming", seed), [N, mode, seed]);

    const resample = useCallback(() => setSeed(s => s + 1), []);

    // Show subset for display (max 12 rows)
    const displayCount = Math.min(N, 12);
    const showEllipsis = N > displayCount;

    const maxAbsInput = Math.max(...data.inputs.map(Math.abs), 0.1);
    const maxAbsWeight = Math.max(...data.weights.map(Math.abs), 0.1);
    const maxAbsProduct = Math.max(...data.products.map(Math.abs), 0.1);

    const sigma = mode === "kaiming" ? Math.sqrt(2 / N) : 1.0;
    const expectedVar = mode === "kaiming" ? 2.0 : N; // Var(sum) ≈ N * Var(x) * Var(w)

    // Dynamic step descriptions
    const stepDescs = [...STEPS];
    stepDescs[1] = { ...stepDescs[1], desc: mode === "kaiming"
        ? `Each weight wᵢ is drawn from N(0, √(2/${N})) = N(0, ${sigma.toFixed(3)}). Variance of each weight = ${(sigma ** 2).toFixed(4)}.`
        : `Each weight wᵢ is drawn from N(0, 1). Variance = 1.0 — no scaling for the number of inputs.`
    };
    stepDescs[3] = { ...stepDescs[3], desc: mode === "kaiming"
        ? `Sum of ${N} products. Expected variance ≈ N × Var(x) × Var(w) = ${N} × 1 × ${(sigma ** 2).toFixed(4)} ≈ ${expectedVar.toFixed(1)}. Actual: ${data.sum.toFixed(2)} (within healthy range).`
        : `Sum of ${N} products. Expected variance ≈ N × Var(x) × Var(w) = ${N} × 1 × 1 = ${N}. The sum is ${Math.abs(data.sum).toFixed(1)} — ${Math.abs(data.sum) > 3 ? "way too large!" : "already large."}`
    };
    stepDescs[4] = { ...stepDescs[4], desc: Math.abs(data.sum) > 3
        ? `tanh(${data.sum.toFixed(2)}) = ${data.tanhOut.toFixed(4)}. The input is so extreme that tanh saturates at ≈ ${data.tanhOut > 0 ? "+1" : "−1"}. Gradient = 1 − tanh² ≈ ${(1 - data.tanhOut ** 2).toFixed(6)}. ${(1 - data.tanhOut ** 2) < 0.01 ? "Essentially zero — this neuron is dead." : ""}`
        : `tanh(${data.sum.toFixed(2)}) = ${data.tanhOut.toFixed(4)}. The input is in the healthy range. Gradient = 1 − tanh² = ${(1 - data.tanhOut ** 2).toFixed(4)} — this neuron is alive and learning.`
    };

    const isSaturated = Math.abs(data.tanhOut) > 0.99;
    const gradient = 1 - data.tanhOut ** 2;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Mode toggle */}
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                    <button
                        onClick={() => { setMode("naive"); setStep(0); }}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all border-r border-white/10 ${
                            mode === "naive" ? "bg-red-500/20 text-red-400" : "bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                    >
                        Naive (σ=1)
                    </button>
                    <button
                        onClick={() => { setMode("kaiming"); setStep(0); }}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all ${
                            mode === "kaiming" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                    >
                        Kaiming (σ=√(2/N))
                    </button>
                </div>

                {/* N selector */}
                <div className="flex items-center gap-1">
                    <span className="text-[8px] font-mono text-white/20">N =</span>
                    {N_OPTIONS.map(n => (
                        <button
                            key={n}
                            onClick={() => { setN(n); setStep(0); }}
                            className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-all border ${
                                N === n
                                    ? "border-violet-500/40 bg-violet-500/15 text-violet-400"
                                    : "border-white/[0.06] bg-white/[0.02] text-white/20 hover:text-white/40"
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>

                {/* Resample */}
                <button
                    onClick={resample}
                    className="text-[8px] font-mono text-white/20 hover:text-white/40 transition-colors ml-auto"
                >
                    🎲 Resample
                </button>
            </div>

            {/* Step navigation */}
            <div className="flex gap-1">
                {stepDescs.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setStep(i)}
                        className={`flex-1 py-1.5 rounded-md text-[8px] font-mono text-center transition-all border ${
                            i === step
                                ? "border-violet-500/40 bg-violet-500/15 text-violet-400"
                                : i <= step
                                    ? "border-white/[0.08] bg-white/[0.03] text-white/30"
                                    : "border-white/[0.04] bg-white/[0.01] text-white/15"
                        }`}
                    >
                        {i + 1}. {s.title.split(":")[0]}
                    </button>
                ))}
            </div>

            {/* Main content area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${step}-${mode}-${N}-${seed}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                >
                    {/* Step title + desc */}
                    <div className="space-y-1">
                        <h4 className="text-[11px] font-mono font-bold text-white/50">
                            Step {step + 1}: {stepDescs[step].title}
                        </h4>
                        <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                            {stepDescs[step].desc}
                        </p>
                    </div>

                    {/* Data table */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
                        {/* Header */}
                        <div className="grid gap-0" style={{ gridTemplateColumns: "2rem 1fr 1fr 1fr" }}>
                            <div className="p-1.5 text-[7px] font-mono text-white/15 text-center border-b border-white/[0.04]">i</div>
                            <div className={`p-1.5 text-[7px] font-mono text-center border-b border-l border-white/[0.04] ${step >= 0 ? "text-blue-400/50" : "text-white/10"}`}>
                                xᵢ (input)
                            </div>
                            <div className={`p-1.5 text-[7px] font-mono text-center border-b border-l border-white/[0.04] ${step >= 1 ? (mode === "kaiming" ? "text-emerald-400/50" : "text-red-400/50") : "text-white/10"}`}>
                                wᵢ (weight)
                            </div>
                            <div className={`p-1.5 text-[7px] font-mono text-center border-b border-l border-white/[0.04] ${step >= 2 ? "text-amber-400/50" : "text-white/10"}`}>
                                xᵢ × wᵢ
                            </div>
                        </div>

                        {/* Rows */}
                        {Array.from({ length: displayCount }, (_, i) => (
                            <div key={i} className="grid gap-0" style={{ gridTemplateColumns: "2rem 1fr 1fr 1fr" }}>
                                <div className="px-1.5 py-0.5 text-[7px] font-mono text-white/10 text-center">
                                    {i + 1}
                                </div>
                                {/* Input */}
                                <div className="px-1.5 py-0.5 border-l border-white/[0.03] flex items-center gap-1">
                                    {step >= 0 ? (
                                        <>
                                            <span className="text-[8px] font-mono text-blue-400/60 w-10 text-right">
                                                {data.inputs[i].toFixed(2)}
                                            </span>
                                            <MiniBar value={data.inputs[i]} maxAbs={maxAbsInput} color="#3b82f6" />
                                        </>
                                    ) : <span className="text-[8px] font-mono text-white/5">—</span>}
                                </div>
                                {/* Weight */}
                                <div className="px-1.5 py-0.5 border-l border-white/[0.03] flex items-center gap-1">
                                    {step >= 1 ? (
                                        <>
                                            <span className={`text-[8px] font-mono w-10 text-right ${mode === "kaiming" ? "text-emerald-400/60" : "text-red-400/60"}`}>
                                                {data.weights[i].toFixed(3)}
                                            </span>
                                            <MiniBar value={data.weights[i]} maxAbs={maxAbsWeight} color={mode === "kaiming" ? "#10b981" : "#ef4444"} />
                                        </>
                                    ) : <span className="text-[8px] font-mono text-white/5">—</span>}
                                </div>
                                {/* Product */}
                                <div className="px-1.5 py-0.5 border-l border-white/[0.03] flex items-center gap-1">
                                    {step >= 2 ? (
                                        <>
                                            <span className="text-[8px] font-mono text-amber-400/60 w-10 text-right">
                                                {data.products[i].toFixed(3)}
                                            </span>
                                            <MiniBar value={data.products[i]} maxAbs={maxAbsProduct} color="#f59e0b" />
                                        </>
                                    ) : <span className="text-[8px] font-mono text-white/5">—</span>}
                                </div>
                            </div>
                        ))}

                        {/* Ellipsis row */}
                        {showEllipsis && (
                            <div className="grid gap-0" style={{ gridTemplateColumns: "2rem 1fr 1fr 1fr" }}>
                                <div className="px-1.5 py-0.5 text-[7px] font-mono text-white/10 text-center">⋮</div>
                                <div className="px-1.5 py-0.5 border-l border-white/[0.03] text-[7px] font-mono text-white/10 text-center">
                                    ⋮ ({N - displayCount} more)
                                </div>
                                <div className="px-1.5 py-0.5 border-l border-white/[0.03] text-[7px] text-white/10 text-center">⋮</div>
                                <div className="px-1.5 py-0.5 border-l border-white/[0.03] text-[7px] text-white/10 text-center">⋮</div>
                            </div>
                        )}
                    </div>

                    {/* Variance stats row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className={`rounded-lg border p-2 ${step >= 0 ? "border-blue-500/15 bg-blue-500/5" : "border-white/[0.04] bg-white/[0.01]"}`}>
                            <p className="text-[6px] font-mono text-white/20">VAR(inputs)</p>
                            <p className={`text-sm font-mono font-bold ${step >= 0 ? "text-blue-400" : "text-white/10"}`}>
                                {step >= 0 ? data.inputVar.toFixed(3) : "—"}
                            </p>
                            <p className="text-[6px] font-mono text-white/15">target: ~1.0</p>
                        </div>
                        <div className={`rounded-lg border p-2 ${step >= 1 ? (mode === "kaiming" ? "border-emerald-500/15 bg-emerald-500/5" : "border-red-500/15 bg-red-500/5") : "border-white/[0.04] bg-white/[0.01]"}`}>
                            <p className="text-[6px] font-mono text-white/20">VAR(weights)</p>
                            <p className={`text-sm font-mono font-bold ${step >= 1 ? (mode === "kaiming" ? "text-emerald-400" : "text-red-400") : "text-white/10"}`}>
                                {step >= 1 ? data.weightVar.toFixed(4) : "—"}
                            </p>
                            <p className="text-[6px] font-mono text-white/15">
                                σ² = {mode === "kaiming" ? (sigma ** 2).toFixed(4) : "1.0"}
                            </p>
                        </div>
                        <div className={`rounded-lg border p-2 ${step >= 2 ? "border-amber-500/15 bg-amber-500/5" : "border-white/[0.04] bg-white/[0.01]"}`}>
                            <p className="text-[6px] font-mono text-white/20">VAR(products)</p>
                            <p className={`text-sm font-mono font-bold ${step >= 2 ? "text-amber-400" : "text-white/10"}`}>
                                {step >= 2 ? data.productVar.toFixed(3) : "—"}
                            </p>
                            <p className="text-[6px] font-mono text-white/15">≈ Var(x)×Var(w)</p>
                        </div>
                    </div>

                    {/* Sum + tanh result (steps 3-4) */}
                    {step >= 3 && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                        >
                            <div className="grid grid-cols-2 gap-2">
                                {/* Sum */}
                                <div className={`rounded-lg border p-3 text-center ${
                                    Math.abs(data.sum) > 3
                                        ? "border-red-500/20 bg-red-500/5"
                                        : "border-emerald-500/20 bg-emerald-500/5"
                                }`}>
                                    <p className="text-[7px] font-mono text-white/20 mb-1">Σ (xᵢ × wᵢ) = weighted sum</p>
                                    <p className={`text-xl font-mono font-black ${
                                        Math.abs(data.sum) > 3 ? "text-red-400" : "text-emerald-400"
                                    }`}>
                                        {data.sum > 0 ? "+" : ""}{data.sum.toFixed(2)}
                                    </p>
                                    <p className="text-[7px] font-mono text-white/15 mt-1">
                                        expected |sum| ≈ √{mode === "kaiming" ? expectedVar.toFixed(0) : N} = {Math.sqrt(expectedVar).toFixed(1)}
                                    </p>
                                </div>

                                {/* tanh output */}
                                {step >= 4 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`rounded-lg border p-3 text-center ${
                                            isSaturated
                                                ? "border-red-500/20 bg-red-500/5"
                                                : "border-emerald-500/20 bg-emerald-500/5"
                                        }`}
                                    >
                                        <p className="text-[7px] font-mono text-white/20 mb-1">tanh(sum) = output</p>
                                        <p className={`text-xl font-mono font-black ${isSaturated ? "text-red-400" : "text-emerald-400"}`}>
                                            {data.tanhOut > 0 ? "+" : ""}{data.tanhOut.toFixed(4)}
                                        </p>
                                        <div className="mt-1 space-y-0.5">
                                            <p className={`text-[7px] font-mono ${isSaturated ? "text-red-400/60" : "text-emerald-400/60"}`}>
                                                gradient = {gradient.toFixed(6)}
                                            </p>
                                            <p className={`text-[8px] font-mono font-bold ${isSaturated ? "text-red-400" : "text-emerald-400"}`}>
                                                {isSaturated ? "💀 DEAD — saturated" : "✓ ALIVE — learning"}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Tanh curve mini-viz */}
                            {step >= 4 && (
                                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2">
                                    <svg viewBox="0 0 300 80" className="w-full h-auto">
                                        {/* Tanh curve */}
                                        <path
                                            d={Array.from({ length: 100 }, (_, i) => {
                                                const x = -6 + (i / 99) * 12;
                                                const y = Math.tanh(x);
                                                const sx = 30 + ((x + 6) / 12) * 240;
                                                const sy = 40 - y * 30;
                                                return `${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`;
                                            }).join(" ")}
                                            fill="none"
                                            stroke="white"
                                            strokeOpacity={0.15}
                                            strokeWidth={1.5}
                                        />
                                        {/* Dead zones */}
                                        <rect x={30} y={5} width={((6 - 2) / 12) * 240} height={70} fill="#ef4444" opacity={0.04} rx={2} />
                                        <rect x={30 + ((6 + 2) / 12) * 240} y={5} width={((6 - 2) / 12) * 240} height={70} fill="#ef4444" opacity={0.04} rx={2} />
                                        {/* Healthy zone */}
                                        <rect x={30 + ((6 - 2) / 12) * 240} y={5} width={(4 / 12) * 240} height={70} fill="#22c55e" opacity={0.04} rx={2} />
                                        {/* Current value marker */}
                                        <circle
                                            cx={30 + ((data.sum + 6) / 12) * 240}
                                            cy={40 - Math.tanh(data.sum) * 30}
                                            r={4}
                                            fill={isSaturated ? "#ef4444" : "#22c55e"}
                                            stroke="white"
                                            strokeWidth={1}
                                            strokeOpacity={0.3}
                                        />
                                        {/* Labels */}
                                        <text x={150} y={76} textAnchor="middle" fontSize={6} fill="white" fillOpacity={0.15} fontFamily="monospace">
                                            input to tanh
                                        </text>
                                        <text x={30 + ((6 - 2) / 12) * 240 + (2 / 12) * 240} y={15} textAnchor="middle" fontSize={5} fill="#22c55e" fillOpacity={0.3} fontFamily="monospace">
                                            healthy
                                        </text>
                                        <text x={50} y={15} textAnchor="middle" fontSize={5} fill="#ef4444" fillOpacity={0.3} fontFamily="monospace">
                                            dead zone
                                        </text>
                                        <text x={250} y={15} textAnchor="middle" fontSize={5} fill="#ef4444" fillOpacity={0.3} fontFamily="monospace">
                                            dead zone
                                        </text>
                                    </svg>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Formula at bottom */}
                    <div className="flex items-center justify-center gap-2 text-[8px] font-mono text-white/15">
                        <span>Var(sum) = N × Var(x) × Var(w) = {N} × 1 × {(sigma ** 2).toFixed(4)} = </span>
                        <span className={`font-bold ${mode === "kaiming" ? "text-emerald-400/50" : "text-red-400/50"}`}>
                            {(N * sigma ** 2).toFixed(1)}
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
