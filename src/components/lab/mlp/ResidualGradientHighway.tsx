"use client";

import { useState, useMemo } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  ResidualGradientHighway — v2
  Step-by-step backpropagation through a 4-layer network.
  - Each layer has 4 neurons, some randomly "dead" (gradient ≈ 0)
  - Toggle: with/without skip connections
  - Step backward from output to input, seeing gradient at each layer
  - Shows: neuron status (alive/dead), layer gradient, cumulative gradient
  - Dead neurons kill gradient WITHOUT skip; WITH skip, highway saves it
  ~280 lines
*/

const NUM_LAYERS = 4;
const NEURONS_PER_LAYER = 4;

// Pre-defined neuron states: true = alive, false = dead
// Layer 2 has 3 dead neurons (worst case)
const NEURON_ALIVE: boolean[][] = [
    [true, true, false, true],   // L1: 1 dead
    [true, false, false, false], // L2: 3 dead (worst!)
    [true, true, true, false],   // L3: 1 dead
    [true, true, true, true],    // L4: all alive
];

// Gradient contribution per alive neuron
const ALIVE_GRAD = 0.25; // Each alive neuron contributes ~0.25 to layer gradient
const DEAD_GRAD = 0.01;  // Dead neuron: gradient ≈ 0

interface LayerGradInfo {
    layerIdx: number;
    neurons: { alive: boolean; grad: number }[];
    layerGrad: number;        // Product of neuron grads for this layer
    cumulativeGrad: number;   // Gradient reaching this layer from output
    cumulativeWithSkip: number;
    aliveCount: number;
    deadCount: number;
}

function computeGradients(): LayerGradInfo[] {
    const results: LayerGradInfo[] = [];
    let cumWithout = 1.0;
    let cumWith = 1.0;

    // Backward: from layer 4 (closest to output) to layer 1
    for (let l = NUM_LAYERS - 1; l >= 0; l--) {
        const neurons = NEURON_ALIVE[l].map(alive => ({
            alive,
            grad: alive ? ALIVE_GRAD : DEAD_GRAD,
        }));

        const aliveCount = neurons.filter(n => n.alive).length;
        const deadCount = NEURONS_PER_LAYER - aliveCount;

        // Layer's effective gradient = sum of neuron contributions
        const layerGrad = neurons.reduce((sum, n) => sum + n.grad, 0);

        // Without skip: multiply through
        cumWithout *= layerGrad;

        // With skip: gradient = 1 (skip) + layerGrad (through block), capped at reasonable value
        cumWith *= Math.min(2, 1 + layerGrad);

        results.push({
            layerIdx: l,
            neurons,
            layerGrad,
            cumulativeGrad: cumWithout,
            cumulativeWithSkip: cumWith,
            aliveCount,
            deadCount,
        });
    }

    return results.reverse(); // Return in L1→L4 order
}

export function ResidualGradientHighway() {
    const [useSkip, setUseSkip] = useState(false);
    const [backpropStep, setBackpropStep] = useState(-1); // -1 = not started, 0-3 = layers
    const [showAll, setShowAll] = useState(false);

    const gradients = useMemo(() => computeGradients(), []);

    const startBackprop = () => {
        setBackpropStep(NUM_LAYERS - 1); // Start from output layer
        setShowAll(false);
    };

    const stepBackward = () => {
        if (backpropStep > 0) {
            setBackpropStep(s => s - 1);
        } else {
            setShowAll(true);
        }
    };

    const reset = () => {
        setBackpropStep(-1);
        setShowAll(false);
    };

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                    <button
                        onClick={() => { setUseSkip(false); reset(); }}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all ${!useSkip
                            ? "bg-red-500/20 text-red-400" : "bg-white/[0.02] text-white/30 hover:text-white/50"}`}
                    >
                        Without Skip
                    </button>
                    <button
                        onClick={() => { setUseSkip(true); reset(); }}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all border-l border-white/10 ${useSkip
                            ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.02] text-white/30 hover:text-white/50"}`}
                    >
                        With Skip
                    </button>
                </div>

                {backpropStep === -1 ? (
                    <button
                        onClick={startBackprop}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-violet-500/15 border border-violet-500/25 text-violet-400 hover:bg-violet-500/25 transition-all"
                    >
                        ← Start Backprop
                    </button>
                ) : !showAll ? (
                    <button
                        onClick={stepBackward}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-violet-500/15 border border-violet-500/25 text-violet-400 hover:bg-violet-500/25 transition-all"
                    >
                        ← Step Backward {backpropStep > 0 ? `(→ L${backpropStep})` : "(finish)"}
                    </button>
                ) : (
                    <button
                        onClick={reset}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-white/[0.05] border border-white/10 text-white/40 hover:text-white/60 transition-all"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Layer-by-layer gradient visualization */}
            <div className="space-y-1.5">
                {/* Output label */}
                <div className="rounded-lg border border-violet-500/15 bg-violet-500/[0.04] p-2 flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-violet-400">∂Loss/∂output = 1.000</span>
                    <span className="text-[8px] font-mono text-white/20">← gradient starts here</span>
                </div>

                {/* Layers (displayed output→input order) */}
                {[...gradients].reverse().map((g, displayIdx) => {
                    const l = g.layerIdx;
                    const isReached = showAll || (backpropStep !== -1 && l >= backpropStep);
                    const isActive = backpropStep === l && !showAll;
                    const grad = useSkip ? g.cumulativeWithSkip : g.cumulativeGrad;
                    const gradColor = grad > 0.5 ? "#22c55e" : grad > 0.1 ? "#f59e0b" : "#ef4444";
                    const isVanished = grad < 0.01;

                    return (
                        <motion.div
                            key={l}
                            initial={false}
                            animate={{
                                opacity: isReached ? 1 : 0.3,
                                scale: isActive ? 1.02 : 1,
                            }}
                            transition={{ duration: 0.3 }}
                            className="rounded-lg border p-2.5 space-y-2"
                            style={{
                                borderColor: isActive ? gradColor + "40" : isReached ? gradColor + "20" : "rgba(255,255,255,0.04)",
                                backgroundColor: isActive ? gradColor + "08" : "transparent",
                            }}
                        >
                            {/* Layer header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold" style={{ color: isReached ? gradColor : "rgba(255,255,255,0.2)" }}>
                                        Layer {l + 1}
                                    </span>
                                    <span className="text-[8px] font-mono text-white/20">
                                        {g.aliveCount} alive · {g.deadCount} dead
                                    </span>
                                </div>
                                {isReached && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-1.5"
                                    >
                                        <span className="text-[8px] font-mono text-white/20">∂L/∂x =</span>
                                        <span className="text-[10px] font-mono font-bold tabular-nums" style={{ color: gradColor }}>
                                            {isVanished ? grad.toExponential(1) : grad.toFixed(4)}
                                        </span>
                                        {isVanished && !useSkip && (
                                            <span className="text-[7px] font-mono text-red-400/60">≈ 0 💀</span>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            {/* Neurons */}
                            <div className="flex items-center gap-1.5">
                                {g.neurons.map((n, ni) => (
                                    <motion.div
                                        key={ni}
                                        className="flex-1 flex flex-col items-center gap-0.5 p-1.5 rounded-md border"
                                        style={{
                                            borderColor: n.alive ? "#22c55e20" : "#ef444420",
                                            backgroundColor: n.alive ? "#22c55e06" : "#ef444406",
                                        }}
                                        animate={{
                                            scale: isActive ? (n.alive ? 1.05 : 0.95) : 1,
                                        }}
                                    >
                                        <div
                                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                            style={{
                                                borderColor: n.alive ? "#22c55e50" : "#ef444450",
                                                backgroundColor: n.alive ? "#22c55e15" : "#ef444415",
                                            }}
                                        >
                                            <span className="text-[7px] font-mono font-bold" style={{ color: n.alive ? "#22c55e" : "#ef4444" }}>
                                                {n.alive ? "✓" : "✗"}
                                            </span>
                                        </div>
                                        <span className="text-[7px] font-mono tabular-nums" style={{ color: n.alive ? "#22c55e80" : "#ef444480" }}>
                                            {n.grad.toFixed(2)}
                                        </span>
                                    </motion.div>
                                ))}

                                {/* Skip connection indicator */}
                                {useSkip && isReached && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06]"
                                    >
                                        <div className="w-5 h-5 rounded-full border-2 border-emerald-500/50 bg-emerald-500/15 flex items-center justify-center">
                                            <span className="text-[7px] font-mono font-bold text-emerald-400">⟶</span>
                                        </div>
                                        <span className="text-[7px] font-mono text-emerald-400/60 tabular-nums">1.00</span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Layer gradient calculation */}
                            {isReached && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-[8px] font-mono text-white/20 bg-white/[0.02] rounded px-2 py-1"
                                >
                                    {useSkip ? (
                                        <span>
                                            layer gradient = <span className="text-emerald-400/60">1 (skip)</span> + <span className="text-white/30">{g.layerGrad.toFixed(2)} (neurons)</span> = <span className="font-bold text-emerald-400/70">{(1 + g.layerGrad).toFixed(2)}</span>
                                            {g.deadCount > 0 && <span className="text-white/15"> · {g.deadCount} dead neurons don&apos;t matter!</span>}
                                        </span>
                                    ) : (
                                        <span>
                                            layer gradient = <span className="text-white/30">{g.layerGrad.toFixed(2)}</span> ({g.aliveCount}×{ALIVE_GRAD} + {g.deadCount}×{DEAD_GRAD})
                                            {g.deadCount >= 3 && <span className="text-red-400/50"> · {g.deadCount} dead neurons → gradient collapses!</span>}
                                        </span>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}

                {/* Input label */}
                <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-2 flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-amber-400">Input layer</span>
                    {showAll && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[9px] font-mono font-bold tabular-nums"
                            style={{ color: (useSkip ? gradients[0].cumulativeWithSkip : gradients[0].cumulativeGrad) > 0.1 ? "#22c55e" : "#ef4444" }}
                        >
                            gradient received: {(useSkip ? gradients[0].cumulativeWithSkip : gradients[0].cumulativeGrad).toFixed(6)}
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Final verdict */}
            <AnimatePresence>
                {showAll && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border p-3 space-y-2"
                        style={{
                            borderColor: useSkip ? "#22c55e25" : "#ef444425",
                            backgroundColor: useSkip ? "#22c55e08" : "#ef444408",
                        }}
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                                <p className="text-[8px] font-mono text-white/20 mb-0.5">Without skip</p>
                                <p className="text-[12px] font-mono font-bold text-red-400">{gradients[0].cumulativeGrad.toExponential(2)}</p>
                                <p className="text-[7px] font-mono text-red-400/40">gradient vanished</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-mono text-white/20 mb-0.5">With skip</p>
                                <p className="text-[12px] font-mono font-bold text-emerald-400">{gradients[0].cumulativeWithSkip.toFixed(4)}</p>
                                <p className="text-[7px] font-mono text-emerald-400/40">gradient healthy</p>
                            </div>
                        </div>
                        <p className="text-[8px] font-mono text-white/20 text-center leading-relaxed">
                            {useSkip
                                ? "Even with dead neurons in every layer, the skip highway guarantees gradient ≥ 1 per layer. The input layer can still learn."
                                : `3 dead neurons in Layer 2 reduced its gradient to ${gradients.find(g => g.layerIdx === 1)?.layerGrad.toFixed(2)}. After 4 layers of multiplication, the gradient is essentially zero. The input layer is frozen.`
                            }
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
