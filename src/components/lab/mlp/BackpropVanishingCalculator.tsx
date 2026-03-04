"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

/*
  BackpropVanishingCalculator
  Step-by-step: ∂L/∂W₁ = factor₁ × factor₂ × factor₃
  Each factor adjustable. Shows how the product vanishes or explodes.
  Animated multiplication chain.
*/

const LAYERS = 4;

export function BackpropVanishingCalculator() {
    const [factor, setFactor] = useState(0.3);
    const [step, setStep] = useState(0);
    const [playing, setPlaying] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const maxStep = LAYERS;

    const factors = Array.from({ length: LAYERS }, () => factor);
    const products: number[] = [];
    let running = 1;
    for (let i = 0; i < LAYERS; i++) {
        running *= factors[i];
        products.push(running);
    }

    const finalProduct = products[LAYERS - 1];
    const regime = finalProduct < 0.01 ? "vanishing" : finalProduct > 10 ? "exploding" : "stable";
    const regimeColor = regime === "vanishing" ? "#ef4444" : regime === "exploding" ? "#f59e0b" : "#22c55e";

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
        }, 700);
    }, [maxStep, reset]);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // Reset step when factor changes
    useEffect(() => {
        setStep(0);
        setPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
    }, [factor]);

    const barMaxW = 200;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Factor slider */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-white/25 shrink-0">Per-layer factor:</span>
                <input
                    type="range" min={0.1} max={2.0} step={0.05} value={factor}
                    onChange={e => setFactor(+e.target.value)}
                    className="flex-1 h-1 accent-violet-500 bg-white/10 rounded-full"
                />
                <span className="text-[11px] font-mono font-bold min-w-[2.5rem] text-right" style={{ color: regimeColor }}>
                    {factor.toFixed(2)}
                </span>
            </div>

            {/* Chain rule formula */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 space-y-3">
                {/* Formula header */}
                <div className="text-[10px] font-mono text-white/30 text-center">
                    ∂L/∂W₁ = {factors.map((f, i) => (
                        <span key={i}>
                            {i > 0 && <span className="text-white/15"> × </span>}
                            <motion.span
                                animate={{
                                    color: step > i ? regimeColor : "rgba(255,255,255,0.3)",
                                    fontWeight: step > i ? 700 : 400,
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                {f.toFixed(2)}
                            </motion.span>
                        </span>
                    ))}
                    {step >= maxStep && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold"
                            style={{ color: regimeColor }}
                        >
                            {" "}= {finalProduct.toFixed(6)}
                        </motion.span>
                    )}
                </div>

                {/* Step-by-step bars */}
                <div className="space-y-1.5">
                    {factors.map((_, i) => {
                        const visible = step > i;
                        const product = products[i];
                        const barW = Math.min(barMaxW, Math.max(2, (product / Math.max(finalProduct, 1)) * barMaxW * 0.8));
                        const normalizedW = Math.min(1, product) * barMaxW;

                        return (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[8px] font-mono text-white/15 w-16 text-right shrink-0">
                                    Layer {LAYERS - i} →
                                </span>
                                <div className="flex-1 h-4 rounded bg-white/[0.03] relative overflow-hidden">
                                    {visible && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(1, (normalizedW / barMaxW) * 100)}%` }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            className="h-full rounded"
                                            style={{ backgroundColor: regimeColor + "30", minWidth: 2 }}
                                        />
                                    )}
                                    {visible && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute inset-y-0 flex items-center text-[8px] font-mono font-bold pl-2"
                                            style={{ color: regimeColor }}
                                        >
                                            {product < 0.0001 ? product.toExponential(1) : product.toFixed(4)}
                                        </motion.span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Result */}
                {step >= maxStep && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-[9px] font-mono pt-1"
                        style={{ color: regimeColor }}
                    >
                        {regime === "vanishing" && `Gradient at Layer 1 is ${(finalProduct * 100).toFixed(3)}% of the original — early layers barely learn.`}
                        {regime === "exploding" && `Gradient at Layer 1 is ${finalProduct.toFixed(1)}× the original — weights will diverge!`}
                        {regime === "stable" && `Gradient stays healthy — each layer receives useful learning signal.`}
                    </motion.div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[8px] font-mono text-white/15">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ef4444" }} /> &lt; 1.0: vanishing
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} /> ≈ 1.0: stable
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} /> &gt; 1.0: exploding
                    </span>
                </div>
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
                        {step === 0 ? "Trace Gradient" : step >= maxStep ? "Reset" : "Next Layer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
