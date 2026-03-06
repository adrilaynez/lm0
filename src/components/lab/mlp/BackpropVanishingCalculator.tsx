"use client";

import { useCallback, useMemo, useState } from "react";

import { motion } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

/*
  BackpropVanishingCalculator — v2
  Shows the ACTUAL backpropagation chain rule with real operations:
  ∂L/∂W₁ = ∂L/∂a₄ × tanh'(z₄) × W₄ × tanh'(z₃) × W₃ × tanh'(z₂) × W₂
  User picks a scenario (vanishing / stable / exploding).
  Step-by-step reveals each multiplication with explanation.
*/

interface Scenario {
    name: string;
    desc: string;
    color: string;
    layers: { weight: number; activation: number; tanhDeriv: number }[];
}

const SCENARIOS: Record<string, Scenario> = {
    vanishing: {
        name: "Vanishing (Saturated tanh)",
        desc: "Large activations → tanh saturates → derivative ≈ 0",
        color: "#ef4444",
        layers: [
            { weight: 0.8, activation: 2.5, tanhDeriv: 0.01 },
            { weight: 1.1, activation: 1.9, tanhDeriv: 0.07 },
            { weight: 0.9, activation: 2.8, tanhDeriv: 0.004 },
            { weight: 1.0, activation: 3.1, tanhDeriv: 0.001 },
        ],
    },
    stable: {
        name: "Stable (Kaiming init)",
        desc: "Activations stay small → tanh' ≈ 0.6-0.9 → gradient flows",
        color: "#22c55e",
        layers: [
            { weight: 0.7, activation: 0.4, tanhDeriv: 0.86 },
            { weight: 0.8, activation: 0.6, tanhDeriv: 0.72 },
            { weight: 0.7, activation: 0.3, tanhDeriv: 0.91 },
            { weight: 0.8, activation: 0.5, tanhDeriv: 0.79 },
        ],
    },
    exploding: {
        name: "Exploding (Large weights)",
        desc: "Weights > 1 and derivatives compound → gradient explodes",
        color: "#f59e0b",
        layers: [
            { weight: 2.5, activation: 0.3, tanhDeriv: 0.91 },
            { weight: 2.8, activation: 0.4, tanhDeriv: 0.86 },
            { weight: 2.3, activation: 0.2, tanhDeriv: 0.96 },
            { weight: 2.6, activation: 0.3, tanhDeriv: 0.91 },
        ],
    },
};

const N_LAYERS = 4;

export function BackpropVanishingCalculator() {
    const [mode, setMode] = useState<"vanishing" | "stable" | "exploding">("vanishing");
    const [step, setStep] = useState(0);

    const scenario = SCENARIOS[mode];
    const maxStep = N_LAYERS + 1; // 0=start, 1..4=layers, 5=result

    const chainProducts = useMemo(() => {
        const prods: number[] = [1.0]; // initial gradient = 1.0
        let running = 1.0;
        for (let i = N_LAYERS - 1; i >= 0; i--) {
            const l = scenario.layers[i];
            const factor = l.tanhDeriv * Math.abs(l.weight);
            running *= factor;
            prods.push(running);
        }
        return prods;
    }, [scenario]);

    const finalGrad = chainProducts[chainProducts.length - 1];

    const advance = useCallback(() => {
        setStep(prev => Math.min(prev + 1, maxStep));
    }, [maxStep]);

    const reset = useCallback(() => {
        setStep(0);
    }, []);

    const switchMode = useCallback((m: "vanishing" | "stable" | "exploding") => {
        setMode(m);
        setStep(0);
    }, []);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* ── Scenario selector ── */}
            <div className="flex items-center gap-2">
                {(["vanishing", "stable", "exploding"] as const).map(m => {
                    const s = SCENARIOS[m];
                    const active = mode === m;
                    return (
                        <button
                            key={m}
                            onClick={() => switchMode(m)}
                            className="flex-1 text-[9px] font-mono font-bold py-1.5 px-2 rounded-lg border transition-all"
                            style={{
                                backgroundColor: active ? s.color + "15" : "transparent",
                                borderColor: active ? s.color + "40" : "rgba(255,255,255,0.06)",
                                color: active ? s.color : "rgba(255,255,255,0.25)",
                            }}
                        >
                            {m === "vanishing" ? "Vanishing" : m === "stable" ? "Stable" : "Exploding"}
                        </button>
                    );
                })}
            </div>

            {/* ── Scenario description ── */}
            <div className="text-[9px] font-mono text-center" style={{ color: scenario.color, opacity: 0.6 }}>
                {scenario.desc}
            </div>

            {/* ── Chain rule visualization ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 space-y-3">
                {/* Formula */}
                <div className="text-[9px] font-mono text-white/20 text-center leading-relaxed">
                    ∂L/∂W₁ = ∂L/∂a₄ × tanh&apos;(z₄) × W₄ × tanh&apos;(z₃) × W₃ × tanh&apos;(z₂) × W₂
                </div>

                {/* Starting gradient */}
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-white/15 w-20 text-right shrink-0">∂L/∂a₄</span>
                    <div className="flex-1 h-7 rounded-md bg-white/[0.03] relative overflow-hidden flex items-center px-2">
                        <span className="text-[10px] font-mono font-bold text-violet-400">1.000</span>
                        <span className="text-[8px] font-mono text-white/20 ml-2">← error starts here (output layer)</span>
                    </div>
                </div>

                {/* Per-layer chain */}
                {Array.from({ length: N_LAYERS }).map((_, idx) => {
                    const layerIdx = N_LAYERS - 1 - idx; // backward: layer 4 → 3 → 2 → 1
                    const l = scenario.layers[layerIdx];
                    const layerNum = layerIdx + 1;
                    const visible = step > idx;
                    const factor = l.tanhDeriv * Math.abs(l.weight);
                    const gradAfter = chainProducts[idx + 1];
                    const isTanhKill = l.tanhDeriv < 0.05;

                    return (
                        <motion.div
                            key={idx}
                            initial={false}
                            animate={{ opacity: visible ? 1 : 0.2 }}
                            className="space-y-1"
                        >
                            {/* Operation row */}
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-mono text-white/15 w-20 text-right shrink-0">
                                    Layer {layerNum}
                                </span>
                                <div className="flex-1 rounded-md bg-white/[0.03] overflow-hidden">
                                    {visible ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-1.5 px-2 py-1"
                                        >
                                            {/* tanh' value */}
                                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isTanhKill ? "bg-red-500/20 text-red-400" : "text-white/50"}`}>
                                                tanh&apos;({l.activation.toFixed(1)})={l.tanhDeriv.toFixed(3)}
                                            </span>
                                            <span className="text-white/15 text-[8px]">×</span>
                                            {/* Weight value */}
                                            <span className="text-[9px] font-mono text-white/40">
                                                W={Math.abs(l.weight).toFixed(1)}
                                            </span>
                                            <span className="text-white/15 text-[8px]">=</span>
                                            {/* Factor */}
                                            <span className="text-[9px] font-mono font-bold" style={{ color: scenario.color }}>
                                                ×{factor.toFixed(4)}
                                            </span>
                                            <span className="text-white/10 text-[8px] mx-1">→</span>
                                            {/* Running product */}
                                            <span className="text-[10px] font-mono font-bold" style={{ color: scenario.color }}>
                                                {gradAfter < 0.0001 ? gradAfter.toExponential(2) : gradAfter > 100 ? gradAfter.toFixed(0) : gradAfter.toFixed(4)}
                                            </span>
                                            {/* Kill indicator */}
                                            {isTanhKill && (
                                                <span className="text-[7px] font-mono text-red-400/80 ml-1 px-1 py-0.5 rounded bg-red-500/10">
                                                    KILLED
                                                </span>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <div className="h-7 flex items-center px-2">
                                            <span className="text-[8px] font-mono text-white/10">
                                                × tanh&apos;(z{layerNum}) × W{layerNum} = ?
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* ── Gradient bar comparison ── */}
                {step >= N_LAYERS && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 pt-2 border-t border-white/[0.04]"
                    >
                        {/* Visual bar: original vs final */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[7px] font-mono text-white/15 w-16 text-right">Original</span>
                                <div className="flex-1 h-3 rounded bg-violet-500/30" />
                                <span className="text-[8px] font-mono text-white/25 w-14">1.000</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[7px] font-mono text-white/15 w-16 text-right">At Layer 1</span>
                                <div className="flex-1 h-3 rounded bg-white/[0.03] relative overflow-hidden">
                                    <div
                                        className="h-full rounded"
                                        style={{
                                            backgroundColor: scenario.color,
                                            opacity: 0.4,
                                            width: `${Math.min(100, Math.max(0.5, finalGrad * 100))}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-[8px] font-mono font-bold w-14" style={{ color: scenario.color }}>
                                    {finalGrad < 0.0001 ? finalGrad.toExponential(1) : finalGrad > 100 ? finalGrad.toFixed(0) : finalGrad.toFixed(4)}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Final result + explanation ── */}
                {step >= maxStep && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border p-3 space-y-1.5"
                        style={{
                            borderColor: scenario.color + "30",
                            backgroundColor: scenario.color + "08",
                        }}
                    >
                        <p className="text-[10px] font-mono font-bold" style={{ color: scenario.color }}>
                            {mode === "vanishing" && `Gradient is ${finalGrad.toExponential(1)} — virtually ZERO`}
                            {mode === "stable" && `Gradient is ${finalGrad.toFixed(3)} — healthy learning signal`}
                            {mode === "exploding" && `Gradient is ${finalGrad.toFixed(1)}× — weights will DIVERGE`}
                        </p>
                        <p className="text-[8px] font-mono text-white/25 leading-relaxed">
                            {mode === "vanishing" && "When tanh saturates (|activation| > 2), its derivative drops to near 0. Each saturated layer multiplies the gradient by ~0. After 4 layers of this, the gradient reaching Layer 1 is essentially zero. The weights CANNOT update. Layer 1 is frozen — it will never learn."}
                            {mode === "stable" && "With proper initialization (Kaiming), activations stay small (|z| < 1). tanh' stays between 0.6–0.9. Each multiplication preserves most of the gradient. All layers receive enough signal to learn."}
                            {mode === "exploding" && `Gradient at Layer 1 is ${finalGrad.toFixed(1)}× the original. Each weight update will be ${finalGrad.toFixed(1)}× too large — the weights will overshoot wildly, creating even larger activations, even larger gradients. This positive feedback loop makes training impossible: loss spikes to infinity.`}
                        </p>
                    </motion.div>
                )}
            </div>

            {/* ── Controls ── */}
            <div className="flex items-center justify-between">
                <div className="text-[8px] font-mono text-white/15">
                    Step {step}/{maxStep}
                </div>
                <div className="flex items-center gap-1.5">
                    {step > 0 && (
                        <button onClick={reset} className="p-1.5 rounded-lg text-white/20 hover:text-white/40 transition-colors">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        onClick={step >= maxStep ? reset : advance}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-colors"
                        style={{
                            backgroundColor: step >= maxStep ? "#22c55e15" : "#a78bfa15",
                            borderColor: step >= maxStep ? "#22c55e30" : "#a78bfa30",
                            color: step >= maxStep ? "#22c55e" : "#a78bfa",
                        }}
                    >
                        <ChevronRight className="w-3 h-3" />
                        {step === 0 ? "Start Backprop" : step >= maxStep ? "Reset" : step === N_LAYERS ? "Show Result" : "Next Layer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
