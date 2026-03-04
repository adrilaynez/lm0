"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

/*
  DeadLayerCascadeVisualizer
  Shows a 3-layer network where tanh saturation → derivative ≈ 0 → gradient dies → 
  neuron goes dark → downstream neurons lose learning signal.
  Animated step-through that builds the intuition for vanishing gradients.
*/

const LAYERS = 3;
const NEURONS_PER_LAYER = 4;

// Simulated health for each neuron at each step
// Step 0: all healthy
// Step 1: layer 3 neurons start saturating (tanh → ±1)
// Step 2: derivatives drop → gradient through layer 3 ≈ 0
// Step 3: layer 2 neurons lose gradient signal → start dying
// Step 4: cascade reaches layer 1 → early layers completely dead
function getNeuronState(layer: number, neuron: number, step: number): {
    activation: number;
    derivative: number;
    gradientFlow: number;
    health: number; // 0 = dead, 1 = healthy
} {
    // Layer is 0-indexed from input side
    // Saturation starts at the deepest layer and cascades backward
    const depthFromOutput = LAYERS - 1 - layer;

    if (step === 0) {
        return { activation: 0.3 + neuron * 0.1, derivative: 0.8, gradientFlow: 1.0, health: 1.0 };
    }

    // Each step, the deepest unsaturated layer starts saturating
    const stepsToSaturate = depthFromOutput + 1;

    if (step < stepsToSaturate) {
        // Not yet affected
        const mild = Math.max(0, 1 - (step - depthFromOutput) * 0.3);
        return {
            activation: 0.3 + neuron * 0.1,
            derivative: Math.max(0.6, mild),
            gradientFlow: Math.max(0.5, mild),
            health: Math.max(0.7, mild),
        };
    }

    // Saturating or dead
    const stepsSinceSaturation = step - stepsToSaturate;
    const saturationProgress = Math.min(1, (stepsSinceSaturation + 1) * 0.5);

    // Some neurons saturate faster (variation)
    const neuronVariation = neuron % 2 === 0 ? 0.2 : 0;
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

const STEP_LABELS = [
    "All neurons healthy — activations in the linear zone of tanh",
    "Deepest layer (Layer 3): large inputs push tanh toward ±1...",
    "Layer 3 saturated: tanh'(x) ≈ 0 → gradients through these neurons die",
    "Layer 2 receives near-zero gradient → can't update → starts dying too",
    "Cascade complete: Layer 1 gets essentially zero gradient. Training stops.",
];

const W = 400;
const H = 220;
const LAYER_X = [60, 150, 240, 330]; // input + 3 hidden layers positions
const NEURON_SPACING = 42;
const NEURON_R = 16;

export function DeadLayerCascadeVisualizer() {
    const [step, setStep] = useState(0);
    const [playing, setPlaying] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const maxStep = STEP_LABELS.length - 1;

    const advance = useCallback(() => {
        setStep(prev => Math.min(prev + 1, maxStep));
    }, [maxStep]);

    const reset = useCallback(() => {
        setStep(0);
        setPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const playAll = useCallback(() => {
        reset();
        setPlaying(true);
        let s = 0;
        timerRef.current = setInterval(() => {
            s++;
            if (s > maxStep) {
                if (timerRef.current) clearInterval(timerRef.current);
                setPlaying(false);
                return;
            }
            setStep(s);
        }, 1200);
    }, [maxStep, reset]);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // Compute neuron Y positions (centered)
    const neuronY = (idx: number, count: number) => {
        const totalH = (count - 1) * NEURON_SPACING;
        return H / 2 - totalH / 2 + idx * NEURON_SPACING;
    };

    // Input layer has 3 "input" nodes
    const INPUT_COUNT = 3;

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {/* Step controls */}
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-mono text-white/25">
                    Step <span className="text-white/50 font-bold">{step}</span> / {maxStep}
                </p>
                <div className="flex items-center gap-1.5">
                    {step > 0 && (
                        <button onClick={reset} className="p-1.5 rounded-lg text-white/20 hover:text-white/40 transition-colors">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        onClick={step >= maxStep ? reset : playing ? undefined : step === 0 ? playAll : advance}
                        disabled={playing}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold border transition-colors"
                        style={{
                            backgroundColor: step >= maxStep ? "#22c55e15" : "#a78bfa15",
                            borderColor: step >= maxStep ? "#22c55e30" : "#a78bfa30",
                            color: step >= maxStep ? "#22c55e" : "#a78bfa",
                            opacity: playing ? 0.5 : 1,
                        }}
                    >
                        <Play className="w-3 h-3" />
                        {step === 0 ? "Start" : step >= maxStep ? "Reset" : "Next"}
                    </button>
                </div>
            </div>

            {/* Network visualization */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Connections: input → layer 0 */}
                    {Array.from({ length: INPUT_COUNT }).map((_, iIdx) =>
                        Array.from({ length: NEURONS_PER_LAYER }).map((_, nIdx) => {
                            const state = getNeuronState(0, nIdx, step);
                            return (
                                <motion.line
                                    key={`conn-in-${iIdx}-${nIdx}`}
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
                    {[0, 1].map(layerIdx =>
                        Array.from({ length: NEURONS_PER_LAYER }).map((_, srcIdx) =>
                            Array.from({ length: NEURONS_PER_LAYER }).map((_, dstIdx) => {
                                const state = getNeuronState(layerIdx + 1, dstIdx, step);
                                return (
                                    <motion.line
                                        key={`conn-${layerIdx}-${srcIdx}-${dstIdx}`}
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
                        <g key={`input-${i}`}>
                            <circle
                                cx={LAYER_X[0]} cy={neuronY(i, INPUT_COUNT)}
                                r={12} fill="#8b5cf620" stroke="#8b5cf640" strokeWidth={1}
                            />
                            <text
                                x={LAYER_X[0]} y={neuronY(i, INPUT_COUNT) + 3.5}
                                textAnchor="middle" fontSize={7} fill="#8b5cf6" fontFamily="monospace"
                            >
                                x{i + 1}
                            </text>
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
                                <g key={`neuron-${layerIdx}-${nIdx}`}>
                                    {/* Neuron body */}
                                    <motion.circle
                                        cx={cx} cy={cy} r={NEURON_R}
                                        animate={{ fill: bg, stroke: color + "60" }}
                                        transition={{ duration: 0.6 }}
                                        strokeWidth={1.5}
                                    />

                                    {/* Health meter (arc) */}
                                    <motion.circle
                                        cx={cx} cy={cy} r={NEURON_R - 3}
                                        fill="none"
                                        strokeWidth={2.5}
                                        strokeLinecap="round"
                                        animate={{
                                            stroke: color,
                                            strokeDasharray: `${state.health * 82} 82`,
                                            strokeOpacity: 0.7,
                                        }}
                                        transition={{ duration: 0.6 }}
                                        transform={`rotate(-90, ${cx}, ${cy})`}
                                    />

                                    {/* Derivative label */}
                                    <motion.text
                                        x={cx} y={cy + 2}
                                        textAnchor="middle" fontSize={7} fontFamily="monospace" fontWeight="bold"
                                        animate={{ fill: color }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        {state.derivative.toFixed(2)}
                                    </motion.text>

                                    {/* tanh' label below */}
                                    <text
                                        x={cx} y={cy + 10}
                                        textAnchor="middle" fontSize={5} fill="white" fillOpacity={0.15} fontFamily="monospace"
                                    >
                                        tanh&apos;
                                    </text>
                                </g>
                            );
                        })
                    )}

                    {/* Layer labels */}
                    <text x={LAYER_X[0]} y={16} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">Input</text>
                    {Array.from({ length: LAYERS }).map((_, i) => (
                        <text key={`lbl-${i}`} x={LAYER_X[i + 1]} y={16} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">
                            Layer {i + 1}
                        </text>
                    ))}

                    {/* Gradient flow arrow (backward direction) */}
                    {step > 0 && (
                        <>
                            <defs>
                                <marker id="arrowLeft" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                                    <path d="M6 0 L0 2 L6 4" fill="#f59e0b" fillOpacity={0.4} />
                                </marker>
                            </defs>
                            <motion.line
                                x1={LAYER_X[3] + 25} y1={H - 16} x2={LAYER_X[0] - 15} y2={H - 16}
                                stroke="#f59e0b" strokeOpacity={0.3} strokeWidth={1.5}
                                strokeDasharray="4,3" markerEnd="url(#arrowLeft)"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            />
                            <motion.text
                                x={W / 2} y={H - 8} textAnchor="middle" fontSize={6}
                                fill="#f59e0b" fillOpacity={0.4} fontFamily="monospace"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            >
                                ← gradient flow (backpropagation)
                            </motion.text>
                        </>
                    )}
                </svg>
            </div>

            {/* Step description */}
            <motion.p
                key={step}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[9px] font-mono text-white/30 text-center leading-relaxed min-h-[2rem]"
            >
                {STEP_LABELS[step]}
            </motion.p>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[8px] font-mono text-white/20">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/60" /> healthy (tanh&apos; ≈ 0.8)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500/60" /> weakening
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500/60" /> dead (tanh&apos; ≈ 0)
                </span>
            </div>
        </div>
    );
}
