"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

/*
  DeadLayerCascadeVisualizer — v2
  Shows a 4-layer network where tanh saturation cascades backward.
  Each step shows: derivative values, gradient flow %, and explanatory text.
  Enhanced with numerical displays and pedagogical step descriptions.
*/

const LAYERS = 4;
const NEURONS_PER_LAYER = 4;

interface NeuronState {
    activation: number;
    derivative: number;
    gradientFlow: number;
    health: number;
}

function getNeuronState(layer: number, neuron: number, step: number): NeuronState {
    const depthFromOutput = LAYERS - 1 - layer;

    if (step === 0) {
        return { activation: 0.3 + neuron * 0.1, derivative: 0.82, gradientFlow: 1.0, health: 1.0 };
    }

    const stepsToSaturate = depthFromOutput + 1;

    if (step < stepsToSaturate) {
        const mild = Math.max(0, 1 - (step - depthFromOutput) * 0.2);
        return {
            activation: 0.3 + neuron * 0.1,
            derivative: Math.max(0.6, mild),
            gradientFlow: Math.max(0.5, mild),
            health: Math.max(0.7, mild),
        };
    }

    const stepsSinceSaturation = step - stepsToSaturate;
    const saturationProgress = Math.min(1, (stepsSinceSaturation + 1) * 0.4);
    const neuronVariation = neuron % 2 === 0 ? 0.15 : 0;
    const effectiveSat = Math.min(1, saturationProgress + neuronVariation);

    return {
        activation: effectiveSat > 0.5 ? (neuron % 2 === 0 ? 0.98 : -0.98) : 0.3 + neuron * 0.1,
        derivative: Math.max(0.02, 1 - effectiveSat * 0.98),
        gradientFlow: Math.max(0.01, 1 - effectiveSat * 0.99),
        health: Math.max(0.05, 1 - effectiveSat * 0.95),
    };
}

function healthColor(h: number): string {
    if (h > 0.7) return "#22c55e";
    if (h > 0.4) return "#f59e0b";
    if (h > 0.15) return "#f97316";
    return "#ef4444";
}

function healthBg(h: number): string {
    if (h > 0.7) return "#22c55e20";
    if (h > 0.4) return "#f59e0b15";
    if (h > 0.15) return "#f9731610";
    return "#ef444410";
}

interface StepInfo {
    title: string;
    desc: string;
    math: string;
}

const STEPS: StepInfo[] = [
    {
        title: "Initial state — all neurons healthy",
        desc: "All neurons output values in the linear zone of tanh. Derivative ≈ 0.82 for each. Gradients will flow freely backward through the network.",
        math: "gradient = 1.0 × 0.82 × 0.82 × 0.82 × 0.82 = 0.45 ✓",
    },
    {
        title: "Layer 4 starts saturating",
        desc: "The deepest layer receives large accumulated inputs. Tanh is pushed toward ±1. Its derivative begins dropping toward zero.",
        math: "Layer 4: tanh(x) → ±0.97, tanh'(x) → 0.06",
    },
    {
        title: "Layer 4 saturated → gradient dies here",
        desc: "Layer 4's derivative ≈ 0. The gradient flowing backward is multiplied by ~0 at this layer. Layer 3 receives almost no learning signal.",
        math: "gradient at L3 = 1.0 × 0.02 = 0.02 (98% lost!)",
    },
    {
        title: "Layer 3 loses gradient → starts dying too",
        desc: "Without gradient signal, Layer 3's weights can't update properly. Its neurons begin saturating as well, amplifying the problem.",
        math: "gradient at L2 = 1.0 × 0.02 × 0.15 = 0.003",
    },
    {
        title: "Cascade reaches Layer 2",
        desc: "Layer 2 now receives essentially zero gradient. Two saturated layers in series multiply the gradient by ~0 twice. Learning has effectively stopped.",
        math: "gradient at L1 = 1.0 × 0.02 × 0.05 × 0.10 = 0.0001",
    },
    {
        title: "Complete cascade — network is dead",
        desc: "All layers are saturated. The gradient from the output reaches Layer 1 at 0.0001× its original strength. The early layers will NEVER learn. The network is frozen.",
        math: "gradient at L1 ≈ 0.0000 — training is meaningless",
    },
];

const W = 440, H = 240;
const LAYER_X = [50, 140, 230, 320, 410];
const NEURON_SPACING = 44;
const NEURON_R = 17;
const INPUT_COUNT = 3;

export function DeadLayerCascadeVisualizer() {
    const [step, setStep] = useState(0);
    const maxStep = STEPS.length - 1;

    const advance = useCallback(() => {
        setStep(prev => Math.min(prev + 1, maxStep));
    }, [maxStep]);

    const reset = useCallback(() => {
        setStep(0);
    }, []);

    const neuronY = (idx: number, count: number) => {
        const totalH = (count - 1) * NEURON_SPACING;
        return H / 2 - totalH / 2 + idx * NEURON_SPACING;
    };

    // Compute layer-average gradient flow
    const layerGradientFlow = Array.from({ length: LAYERS }, (_, l) => {
        let sum = 0;
        for (let n = 0; n < NEURONS_PER_LAYER; n++) {
            sum += getNeuronState(l, n, step).gradientFlow;
        }
        return sum / NEURONS_PER_LAYER;
    });

    const currentStep = STEPS[step];

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {/* ── Step controls ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-[9px] font-mono text-white/25">
                        Step <span className="text-white/50 font-bold">{step}</span> / {maxStep}
                    </p>
                    {/* Progress dots */}
                    <div className="flex gap-1">
                        {STEPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-violet-400 scale-125" : i < step ? "bg-violet-400/30" : "bg-white/10"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {step > 0 && (
                        <button onClick={reset} className="p-1.5 rounded-lg text-white/20 hover:text-white/40 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={step >= maxStep ? reset : advance}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-colors"
                        style={{
                            backgroundColor: step >= maxStep ? "#22c55e15" : "#a78bfa15",
                            borderColor: step >= maxStep ? "#22c55e30" : "#a78bfa30",
                            color: step >= maxStep ? "#22c55e" : "#a78bfa",
                        }}
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                        {step === 0 ? "Start" : step >= maxStep ? "Reset" : "Next Step"}
                    </button>
                </div>
            </div>

            {/* ── Network visualization ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Connections: input → layer 0 */}
                    {Array.from({ length: INPUT_COUNT }).map((_, iIdx) =>
                        Array.from({ length: NEURONS_PER_LAYER }).map((_, nIdx) => {
                            const state = getNeuronState(0, nIdx, step);
                            return (
                                <motion.line
                                    key={`ci-${iIdx}-${nIdx}`}
                                    x1={LAYER_X[0]} y1={neuronY(iIdx, INPUT_COUNT)}
                                    x2={LAYER_X[1]} y2={neuronY(nIdx, NEURONS_PER_LAYER)}
                                    stroke="white"
                                    animate={{ strokeOpacity: state.gradientFlow * 0.15 }}
                                    transition={{ duration: 0.6 }}
                                />
                            );
                        })
                    )}

                    {/* Connections between hidden layers */}
                    {[0, 1, 2].map(layerIdx =>
                        Array.from({ length: NEURONS_PER_LAYER }).map((_, srcIdx) =>
                            Array.from({ length: NEURONS_PER_LAYER }).map((_, dstIdx) => {
                                const state = getNeuronState(layerIdx + 1, dstIdx, step);
                                return (
                                    <motion.line
                                        key={`c-${layerIdx}-${srcIdx}-${dstIdx}`}
                                        x1={LAYER_X[layerIdx + 1]} y1={neuronY(srcIdx, NEURONS_PER_LAYER)}
                                        x2={LAYER_X[layerIdx + 2]} y2={neuronY(dstIdx, NEURONS_PER_LAYER)}
                                        stroke="white"
                                        animate={{ strokeOpacity: state.gradientFlow * 0.15 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                );
                            })
                        )
                    )}

                    {/* Input nodes */}
                    {Array.from({ length: INPUT_COUNT }).map((_, i) => (
                        <g key={`in-${i}`}>
                            <circle cx={LAYER_X[0]} cy={neuronY(i, INPUT_COUNT)} r={12} fill="#8b5cf620" stroke="#8b5cf640" strokeWidth={1} />
                            <text x={LAYER_X[0]} y={neuronY(i, INPUT_COUNT) + 3.5} textAnchor="middle" fontSize={7} fill="#8b5cf6" fontFamily="monospace">x{i + 1}</text>
                        </g>
                    ))}

                    {/* Hidden layer neurons */}
                    {Array.from({ length: LAYERS }).map((_, layerIdx) =>
                        Array.from({ length: NEURONS_PER_LAYER }).map((_, nIdx) => {
                            const state = getNeuronState(layerIdx, nIdx, step);
                            const cx = LAYER_X[layerIdx + 1];
                            const cy = neuronY(nIdx, NEURONS_PER_LAYER);
                            const color = healthColor(state.health);
                            const bg = healthBg(state.health);

                            return (
                                <g key={`n-${layerIdx}-${nIdx}`}>
                                    <motion.circle cx={cx} cy={cy} r={NEURON_R}
                                        animate={{ fill: bg, stroke: color + "60" }}
                                        transition={{ duration: 0.6 }} strokeWidth={1.5}
                                    />
                                    <motion.circle cx={cx} cy={cy} r={NEURON_R - 3}
                                        fill="none" strokeWidth={2.5} strokeLinecap="round"
                                        animate={{ stroke: color, strokeDasharray: `${state.health * 88} 88`, strokeOpacity: 0.7 }}
                                        transition={{ duration: 0.6 }}
                                        transform={`rotate(-90, ${cx}, ${cy})`}
                                    />
                                    <motion.text x={cx} y={cy + 2}
                                        textAnchor="middle" fontSize={7} fontFamily="monospace" fontWeight="bold"
                                        animate={{ fill: color }} transition={{ duration: 0.6 }}
                                    >
                                        {state.derivative.toFixed(2)}
                                    </motion.text>
                                    <text x={cx} y={cy + 10} textAnchor="middle" fontSize={4.5} fill="white" fillOpacity={0.12} fontFamily="monospace">
                                        tanh&apos;
                                    </text>
                                </g>
                            );
                        })
                    )}

                    {/* Layer labels + gradient flow % */}
                    <text x={LAYER_X[0]} y={16} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">Input</text>
                    {Array.from({ length: LAYERS }).map((_, i) => {
                        const flow = layerGradientFlow[i];
                        const flowColor = flow > 0.5 ? "#22c55e" : flow > 0.2 ? "#f59e0b" : "#ef4444";
                        return (
                            <g key={`lbl-${i}`}>
                                <text x={LAYER_X[i + 1]} y={14} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.25} fontFamily="monospace">
                                    Layer {i + 1}
                                </text>
                                {step > 0 && (
                                    <text x={LAYER_X[i + 1]} y={H - 10} textAnchor="middle" fontSize={7} fill={flowColor} fillOpacity={0.6} fontFamily="monospace" fontWeight="bold">
                                        {(flow * 100).toFixed(0)}%
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Gradient flow arrow */}
                    {step > 0 && (
                        <>
                            <defs>
                                <marker id="arrowL2" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                                    <path d="M6 0 L0 2 L6 4" fill="#f59e0b" fillOpacity={0.4} />
                                </marker>
                            </defs>
                            <motion.line
                                x1={LAYER_X[4] + 15} y1={H - 24} x2={LAYER_X[0] - 10} y2={H - 24}
                                stroke="#f59e0b" strokeOpacity={0.3} strokeWidth={1.5}
                                strokeDasharray="4,3" markerEnd="url(#arrowL2)"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            />
                            <motion.text x={W / 2} y={H - 30} textAnchor="middle" fontSize={6} fill="#f59e0b" fillOpacity={0.35} fontFamily="monospace"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            >
                                ← gradient flow (backpropagation)
                            </motion.text>
                        </>
                    )}
                </svg>
            </div>

            {/* ── Step description card ── */}
            <motion.div
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-3 space-y-1.5 ${step >= 4 ? "border-rose-500/20 bg-rose-500/[0.03]"
                    : step >= 2 ? "border-amber-500/20 bg-amber-500/[0.03]"
                        : "border-emerald-500/20 bg-emerald-500/[0.03]"
                    }`}
            >
                <p className={`text-[10px] font-mono font-bold ${step >= 4 ? "text-rose-400/70" : step >= 2 ? "text-amber-400/70" : "text-emerald-400/70"
                    }`}>
                    Step {step}: {currentStep.title}
                </p>
                <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                    {currentStep.desc}
                </p>
                <p className={`text-[8px] font-mono px-2 py-1 rounded bg-black/20 ${step >= 4 ? "text-rose-400/50" : step >= 2 ? "text-amber-400/50" : "text-emerald-400/50"
                    }`}>
                    {currentStep.math}
                </p>
            </motion.div>

            {/* ── Layer gradient flow bars ── */}
            {step > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                    <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider mb-2">Gradient Flow Reaching Each Layer</p>
                    <div className="space-y-1.5">
                        {layerGradientFlow.map((flow, i) => {
                            const pct = flow * 100;
                            const color = flow > 0.5 ? "#22c55e" : flow > 0.2 ? "#f59e0b" : "#ef4444";
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-white/25 w-12 shrink-0">L{i + 1}</span>
                                    <div className="flex-1 h-3 rounded bg-white/[0.03] overflow-hidden">
                                        <motion.div
                                            className="h-full rounded"
                                            style={{ background: `${color}60` }}
                                            animate={{ width: `${Math.max(2, pct)}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono font-bold w-10 text-right" style={{ color }}>
                                        {pct.toFixed(0)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Legend ── */}
            <div className="flex items-center justify-center gap-4 text-[8px] font-mono text-white/20">
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" /> healthy (tanh&apos; ≈ 0.8)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" /> weakening
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" /> dead (tanh&apos; ≈ 0)
                </span>
                <span className="text-white/10">|</span>
                <span>% = gradient flow</span>
            </div>
        </div>
    );
}
