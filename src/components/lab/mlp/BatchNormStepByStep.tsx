"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

/*
  BatchNormStepByStep
  Takes a vector of 6 activations and walks through the normalization process:
  Step 1: Raw values (highlight extremes in red)
  Step 2: Compute mean μ, show as horizontal line
  Step 3: Subtract mean → centered at 0
  Step 4: Compute std σ, divide → variance = 1
  Step 5: Apply γ and β (user-adjustable sliders) → final output
  ~200 lines
*/

const RAW = [3.2, -1.5, 7.8, -0.3, 2.1, -4.6];

const STEPS = [
    { id: 0, title: "Raw activations", desc: "These values come from a hidden layer. Some are dangerously large." },
    { id: 1, title: "Compute mean (μ)", desc: "Average all values to find the center." },
    { id: 2, title: "Subtract mean", desc: "Shift everything so the center is 0." },
    { id: 3, title: "Divide by std (σ)", desc: "Scale so the spread is exactly 1." },
    { id: 4, title: "Apply γ and β", desc: "Learnable parameters let the network undo this if needed." },
];

function mean(arr: number[]): number {
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}
function std(arr: number[], mu: number): number {
    const variance = arr.reduce((s, v) => s + (v - mu) ** 2, 0) / arr.length;
    return Math.sqrt(variance + 1e-5);
}

function barColor(v: number, step: number): string {
    if (step === 0) {
        return Math.abs(v) > 4 ? "#ef4444" : Math.abs(v) > 2 ? "#f59e0b" : "#a78bfa";
    }
    if (step <= 2) return "#a78bfa";
    if (step === 3) return "#22c55e";
    return "#8b5cf6";
}

export function BatchNormStepByStep() {
    const [step, setStep] = useState(0);
    const [gamma, setGamma] = useState(1.2);
    const [beta, setBeta] = useState(0.3);

    const mu = mean(RAW);
    const sigma = std(RAW, mu);

    // Compute values at each step
    function getValues(): number[] {
        if (step === 0) return RAW;
        if (step === 1) return RAW; // show raw + mean line
        if (step === 2) return RAW.map(v => v - mu); // centered
        if (step === 3) return RAW.map(v => (v - mu) / sigma); // normalized
        return RAW.map(v => gamma * ((v - mu) / sigma) + beta); // γ·x̂ + β
    }

    const values = getValues();
    const maxAbs = Math.max(...values.map(Math.abs), 1);
    const barScale = 60; // max bar height in px

    const next = () => setStep(s => Math.min(4, s + 1));
    const reset = () => setStep(0);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-1 justify-center">
                {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1">
                        <button
                            onClick={() => setStep(i)}
                            className={`w-6 h-6 rounded-full text-[9px] font-mono font-bold border transition-all ${
                                i === step
                                    ? "bg-violet-500/20 border-violet-500/50 text-violet-400"
                                    : i < step
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400/60"
                                    : "bg-white/[0.02] border-white/10 text-white/20"
                            }`}
                        >
                            {i + 1}
                        </button>
                        {i < STEPS.length - 1 && <div className="w-3 h-px bg-white/10" />}
                    </div>
                ))}
            </div>

            {/* Step title + description */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-center"
                >
                    <p className="text-sm font-mono font-bold text-violet-400">{STEPS[step].title}</p>
                    <p className="text-[10px] font-mono text-white/30 mt-1">{STEPS[step].desc}</p>
                </motion.div>
            </AnimatePresence>

            {/* Statistics line */}
            {step >= 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-4 text-[10px] font-mono"
                >
                    <span className="text-amber-400/70">μ = {mu.toFixed(2)}</span>
                    {step >= 3 && <span className="text-emerald-400/70">σ = {sigma.toFixed(2)}</span>}
                    {step >= 4 && (
                        <>
                            <span className="text-violet-400/70">γ = {gamma.toFixed(1)}</span>
                            <span className="text-violet-400/70">β = {beta.toFixed(1)}</span>
                        </>
                    )}
                </motion.div>
            )}

            {/* Bar chart */}
            <div className="flex items-center justify-center gap-3 h-[160px] px-4">
                {values.map((v, i) => {
                    const h = Math.abs(v) / maxAbs * barScale;
                    const isNeg = v < 0;
                    const color = barColor(v, step);

                    return (
                        <div key={i} className="flex flex-col items-center" style={{ height: 160 }}>
                            {/* Value label */}
                            <motion.span
                                key={`${step}-${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[9px] font-mono font-bold mb-1"
                                style={{ color, marginTop: isNeg ? "auto" : undefined }}
                            >
                                {v.toFixed(2)}
                            </motion.span>

                            {/* The bar area — centered vertically */}
                            <div className="flex-1 flex flex-col items-center justify-center relative w-8">
                                {/* Mean line (step 1+) */}
                                {step === 1 && (
                                    <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        className="absolute w-10 h-px bg-amber-400/50"
                                        style={{ top: `${50 - (mu / maxAbs) * 50}%` }}
                                    />
                                )}

                                {/* Zero line */}
                                <div className="absolute w-10 h-px bg-white/10" style={{ top: "50%" }} />

                                {/* Bar */}
                                <motion.div
                                    key={`bar-${step}-${i}`}
                                    initial={{ height: 0 }}
                                    animate={{ height: h }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    className="w-6 rounded-sm absolute"
                                    style={{
                                        backgroundColor: `${color}40`,
                                        border: `1px solid ${color}60`,
                                        ...(isNeg
                                            ? { top: "50%", borderTop: "none" }
                                            : { bottom: "50%", borderBottom: "none" }),
                                    }}
                                />
                            </div>

                            {/* Index */}
                            <span className="text-[8px] font-mono text-white/15 mt-1">x{i + 1}</span>
                        </div>
                    );
                })}
            </div>

            {/* Formula display */}
            <div className="text-center text-[10px] font-mono text-white/25">
                {step === 0 && "x = [3.2, -1.5, 7.8, -0.3, 2.1, -4.6]"}
                {step === 1 && `μ = (${RAW.join(" + ")}) / 6 = ${mu.toFixed(2)}`}
                {step === 2 && "x̂ = x − μ"}
                {step === 3 && "x̂ = (x − μ) / √(σ² + ε)"}
                {step === 4 && "y = γ · x̂ + β"}
            </div>

            {/* γ/β sliders (step 4 only) */}
            {step === 4 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-col sm:flex-row gap-3 items-center justify-center"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-violet-400/60">γ</span>
                        <input
                            type="range" min={0.1} max={3} step={0.1} value={gamma}
                            onChange={e => setGamma(+e.target.value)}
                            className="w-24 h-1 accent-violet-500 bg-white/10 rounded-full"
                        />
                        <span className="text-[10px] font-mono text-violet-400 w-8">{gamma.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-violet-400/60">β</span>
                        <input
                            type="range" min={-2} max={2} step={0.1} value={beta}
                            onChange={e => setBeta(+e.target.value)}
                            className="w-24 h-1 accent-violet-500 bg-white/10 rounded-full"
                        />
                        <span className="text-[10px] font-mono text-violet-400 w-8">{beta.toFixed(1)}</span>
                    </div>
                </motion.div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="flex items-center gap-1 text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
                {step < 4 && (
                    <button
                        onClick={next}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-mono font-bold text-violet-400 hover:bg-violet-500/25 transition-colors"
                    >
                        Next <ChevronRight className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
