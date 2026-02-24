"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";

/*
  LR Overshoot Visualizer — shows a 1D convex loss parabola L(w) = (w - w*)²
  and animates gradient descent steps on it. With small LR the ball rolls smoothly
  to the minimum; with large LR it bounces back and forth (overshoot); with very
  large LR it diverges off the curve.
  
  The user controls the learning rate with a slider and sees:
  - The loss parabola
  - A ball bouncing along the curve
  - Arrows showing each gradient step
  - A trail of previous positions
*/

const W_STAR = 0;            // Optimal weight (minimum of parabola)
const INIT_W = 4;            // Starting weight
const MAX_STEPS = 30;
const LOSS_FN = (w: number) => (w - W_STAR) ** 2;
const GRAD_FN = (w: number) => 2 * (w - W_STAR);

interface Step {
    w: number;
    loss: number;
    grad: number;
}

function simulate(lr: number): Step[] {
    const steps: Step[] = [];
    let w = INIT_W;
    for (let i = 0; i <= MAX_STEPS; i++) {
        const loss = LOSS_FN(w);
        const grad = GRAD_FN(w);
        steps.push({ w, loss, grad });
        if (Math.abs(loss) > 1e4) break;
        w = w - lr * grad;
    }
    return steps;
}

// SVG dimensions
const SVG_W = 400;
const SVG_H = 260;
const PAD_L = 30;
const PAD_R = 20;
const PAD_T = 20;
const PAD_B = 36;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

// Weight range for parabola drawing
const W_MIN = -5.5;
const W_MAX = 5.5;

export function LROvershootVisualizer() {
    const [lr, setLr] = useState(0.3);
    const [animStep, setAnimStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const history = useMemo(() => simulate(lr), [lr]);
    const maxStep = history.length - 1;
    const visibleHistory = history.slice(0, animStep + 1);
    const current = visibleHistory[visibleHistory.length - 1];

    // Determine behavior
    const finalLoss = history[maxStep].loss;
    const diverged = finalLoss > 100 || history.length < MAX_STEPS;
    const converged = finalLoss < 0.01;
    const oscillating = !diverged && !converged && history.length > 3 &&
        Math.sign(history[history.length - 1].w - W_STAR) !== Math.sign(history[history.length - 2].w - W_STAR);

    // Dynamic y-axis: cap at a reasonable value
    const yMax = useMemo(() => {
        const maxLoss = Math.max(...visibleHistory.map(s => s.loss), 16);
        return Math.min(maxLoss * 1.15, 50);
    }, [visibleHistory]);

    // Coordinate transforms
    const wToX = useCallback((w: number) => {
        return PAD_L + ((w - W_MIN) / (W_MAX - W_MIN)) * PLOT_W;
    }, []);

    const lossToY = useCallback((loss: number) => {
        const clamped = Math.min(loss, yMax);
        return PAD_T + (1 - clamped / yMax) * PLOT_H;
    }, [yMax]);

    // Generate parabola path
    const parabolaPath = useMemo(() => {
        const points: string[] = [];
        const numPoints = 100;
        for (let i = 0; i <= numPoints; i++) {
            const w = W_MIN + (i / numPoints) * (W_MAX - W_MIN);
            const loss = LOSS_FN(w);
            if (loss <= yMax * 1.2) {
                points.push(`${wToX(w)},${lossToY(loss)}`);
            }
        }
        return points.join(" ");
    }, [wToX, lossToY, yMax]);

    // Animation
    const startAnimation = useCallback(() => {
        setAnimStep(0);
        setIsPlaying(true);
    }, []);

    useEffect(() => {
        if (!isPlaying) return;
        intervalRef.current = setInterval(() => {
            setAnimStep(prev => {
                if (prev >= maxStep) {
                    setIsPlaying(false);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return maxStep;
                }
                return prev + 1;
            });
        }, 200);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, maxStep]);

    // Reset when LR changes
    useEffect(() => {
        setAnimStep(0);
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, [lr]);

    const accentHex = diverged ? "#fb7185" : converged ? "#34d399" : oscillating ? "#fbbf24" : "#a78bfa";
    const accentTextClass = diverged
        ? "text-rose-400"
        : converged
            ? "text-emerald-400"
            : oscillating
                ? "text-amber-400"
                : "text-violet-400";
    const runButtonClass = diverged
        ? "bg-gradient-to-r from-rose-500/20 to-rose-500/10 border-rose-500/30 text-rose-400 hover:from-rose-500/30"
        : converged
            ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30"
            : oscillating
                ? "bg-gradient-to-r from-amber-500/20 to-amber-500/10 border-amber-500/30 text-amber-400 hover:from-amber-500/30"
                : "bg-gradient-to-r from-violet-500/20 to-violet-500/10 border-violet-500/30 text-violet-400 hover:from-violet-500/30";

    return (
        <div className="space-y-4">
            {/* LR Slider */}
            <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-violet-500/[0.02] px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-white/50">Learning Rate</span>
                    <span className={`text-base font-mono font-bold ${diverged ? "text-rose-400" : converged ? "text-emerald-400" : "text-violet-400"
                        }`}>
                        η = {lr.toFixed(2)}
                    </span>
                </div>
                <Slider
                    min={0.01}
                    max={1.2}
                    step={0.01}
                    value={[lr]}
                    onValueChange={([v]) => setLr(v)}
                    trackColor={accentHex}
                    thumbColor={accentHex}
                />
                <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] font-mono text-white/20">0.01 (safe)</span>
                    <span className="text-[9px] font-mono text-white/20">1.20 (danger)</span>
                </div>
            </div>

            {/* Loss Landscape */}
            <div className="rounded-xl bg-black/30 border border-white/[0.05] p-3 overflow-hidden">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full block" aria-label="Loss landscape">
                    <defs>
                        <linearGradient id="overshootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(167,139,250,0.15)" />
                            <stop offset="100%" stopColor="rgba(167,139,250,0.02)" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Grid */}
                    {[0.2, 0.4, 0.6, 0.8].map(frac => (
                        <line key={`h-${frac}`}
                            x1={PAD_L} y1={PAD_T + frac * PLOT_H}
                            x2={SVG_W - PAD_R} y2={PAD_T + frac * PLOT_H}
                            stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"
                        />
                    ))}

                    {/* Axes */}
                    <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={SVG_H - PAD_B}
                        stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <line x1={PAD_L} y1={SVG_H - PAD_B} x2={SVG_W - PAD_R} y2={SVG_H - PAD_B}
                        stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                    {/* Axis labels */}
                    <text x={SVG_W / 2} y={SVG_H - 6} textAnchor="middle"
                        fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace">
                        weight (w)
                    </text>
                    <text x={10} y={SVG_H / 2 - 10} textAnchor="middle"
                        fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace"
                        transform={`rotate(-90 10 ${SVG_H / 2 - 10})`}>
                        L(w)
                    </text>

                    {/* Optimal weight marker */}
                    <line x1={wToX(W_STAR)} y1={PAD_T} x2={wToX(W_STAR)} y2={SVG_H - PAD_B}
                        stroke="rgba(52,211,153,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={wToX(W_STAR)} y={SVG_H - PAD_B + 14}
                        textAnchor="middle" fill="rgba(52,211,153,0.5)" fontSize="8" fontFamily="monospace">
                        w* = {W_STAR}
                    </text>

                    {/* Parabola fill */}
                    {parabolaPath && (
                        <polygon
                            points={`${parabolaPath} ${wToX(W_MAX)},${lossToY(0)} ${wToX(W_MIN)},${lossToY(0)}`}
                            fill="url(#overshootGrad)"
                        />
                    )}

                    {/* Parabola curve */}
                    <polyline
                        fill="none"
                        stroke="rgba(167,139,250,0.5)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        points={parabolaPath}
                    />

                    {/* Trail: lines connecting step positions on the curve */}
                    {visibleHistory.length > 1 && visibleHistory.map((s, i) => {
                        if (i === 0) return null;
                        const prev = visibleHistory[i - 1];
                        const x1 = wToX(Math.max(W_MIN, Math.min(W_MAX, prev.w)));
                        const y1 = lossToY(prev.loss);
                        const x2 = wToX(Math.max(W_MIN, Math.min(W_MAX, s.w)));
                        const y2 = lossToY(s.loss);
                        return (
                            <line key={`trail-${i}`}
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke={accentHex}
                                strokeWidth="1.5"
                                strokeDasharray="4 3"
                                opacity={0.4}
                            />
                        );
                    })}

                    {/* Step dots on the curve */}
                    {visibleHistory.map((s, i) => {
                        const isLast = i === visibleHistory.length - 1;
                        const w = Math.max(W_MIN, Math.min(W_MAX, s.w));
                        const loss = Math.min(s.loss, yMax);
                        return (
                            <g key={`dot-${i}`}>
                                <circle
                                    cx={wToX(w)}
                                    cy={lossToY(loss)}
                                    r={isLast ? 6 : 3}
                                    fill={isLast ? accentHex : accentHex}
                                    opacity={isLast ? 1 : 0.4}
                                    filter={isLast ? "url(#glow)" : undefined}
                                />
                                {isLast && (
                                    <circle
                                        cx={wToX(w)}
                                        cy={lossToY(loss)}
                                        r="9"
                                        fill="none"
                                        stroke={accentHex}
                                        strokeWidth="1"
                                        opacity={0.3}
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Current position label */}
                    {current && (
                        <text
                            x={wToX(Math.max(W_MIN, Math.min(W_MAX, current.w)))}
                            y={Math.max(PAD_T + 8, lossToY(Math.min(current.loss, yMax)) - 14)}
                            textAnchor="middle"
                            fill={accentHex}
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                        >
                            w = {Math.abs(current.w) > 99 ? "∞" : current.w.toFixed(2)}
                        </text>
                    )}
                </svg>
            </div>

            {/* Controls + Status */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Status card */}
                <div className={`flex-1 rounded-xl border p-3 text-center backdrop-blur-sm ${diverged
                    ? "border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-500/[0.03]"
                    : converged
                        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.03]"
                        : oscillating
                            ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/[0.03]"
                            : "border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-violet-500/[0.03]"
                    }`}>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/30 block mb-1">
                        Step {animStep} / {maxStep}
                    </span>
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={`${lr}-${animStep >= maxStep}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className={`text-sm font-mono font-bold block ${accentTextClass}`}
                        >
                            {animStep >= maxStep ? (
                                diverged ? "Diverged! The weight flew off 💥"
                                    : converged ? "Converged smoothly ✓"
                                        : oscillating ? "Oscillating around minimum ⟳"
                                            : `Loss: ${current.loss.toFixed(2)}`
                            ) : (
                                `Loss: ${current.loss > 9999 ? "∞" : current.loss.toFixed(2)}`
                            )}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 items-center">
                    <button
                        onClick={startAnimation}
                        disabled={isPlaying}
                        className={`px-4 py-2.5 rounded-lg text-[11px] font-mono font-bold border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${runButtonClass}`}
                    >
                        {isPlaying ? "Running..." : "▶ Run"}
                    </button>
                    <button
                        onClick={() => { setAnimStep(0); setIsPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); }}
                        className="px-4 py-2.5 rounded-lg text-[11px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
                    >
                        ↺ Reset
                    </button>
                </div>
            </div>

            {/* Insight */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${diverged}-${converged}-${oscillating}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`rounded-xl p-3.5 border text-center ${diverged
                        ? "bg-rose-500/[0.06] border-rose-500/20"
                        : converged
                            ? "bg-emerald-500/[0.06] border-emerald-500/20"
                            : oscillating
                                ? "bg-amber-500/[0.06] border-amber-500/20"
                                : "bg-violet-500/[0.06] border-violet-500/20"
                        }`}
                >
                    <p className="text-[11px] text-white/40 leading-relaxed italic">
                        {diverged
                            ? "With a learning rate this high, each step overshoots the minimum by more than the previous one. The weight bounces farther and farther — this is divergence. The model can never learn."
                            : converged
                                ? "The learning rate is small enough that each step lands closer to the minimum. The ball rolls smoothly down the bowl and settles at the bottom. This is stable convergence."
                                : oscillating
                                    ? "The learning rate is just barely too large — the weight overshoots the minimum on each step, bouncing back and forth. It might eventually settle, but training is inefficient and noisy."
                                    : "Press Run to watch gradient descent navigate the loss landscape. The ball starts at w = 4 and tries to reach the minimum at w* = 0."
                        }
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
