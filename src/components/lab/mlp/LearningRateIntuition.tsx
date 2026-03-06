"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────
   LearningRateIntuition
   
   Ball-on-landscape animation showing 3 learning rates:
   - Too small (0.001): ball barely moves
   - Just right (0.01): ball rolls smoothly to minimum
   - Too large (0.1+): ball bounces over minimum, diverges
   
   Uses a simple quadratic-ish loss landscape and simulates
   gradient descent steps with each LR.
   ───────────────────────────────────────────────────────── */

interface BallState {
    x: number;      // position on landscape
    loss: number;    // current loss value
    history: { x: number; loss: number }[];
    status: "running" | "converged" | "diverged";
    step: number;
}

const SCENARIOS = [
    { lr: 0.001, label: "lr = 0.001", verdict: "Too slow", color: "#3b82f6", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30", textColor: "text-blue-400" },
    { lr: 0.01, label: "lr = 0.01", verdict: "Just right", color: "#22c55e", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30", textColor: "text-emerald-400" },
    { lr: 0.15, label: "lr = 0.15", verdict: "Too fast!", color: "#f43f5e", bgColor: "bg-rose-500/10", borderColor: "border-rose-500/30", textColor: "text-rose-400" },
];

// Loss landscape: double-well with a clear minimum
// f(x) = 0.3*(x-0.1)^2 + 0.05*sin(3x) + 2.0
function landscape(x: number): number {
    return 0.3 * (x - 0.1) ** 2 + 0.05 * Math.sin(3 * x) + 2.0;
}

// Gradient: f'(x) = 0.6*(x-0.1) + 0.15*cos(3x)
function gradient(x: number): number {
    return 0.6 * (x - 0.1) + 0.15 * Math.cos(3 * x);
}

const START_X = 3.5;
const MAX_STEPS = 120;

function initBall(): BallState {
    const loss = landscape(START_X);
    return {
        x: START_X,
        loss,
        history: [{ x: START_X, loss }],
        status: "running",
        step: 0,
    };
}

function stepBall(ball: BallState, lr: number): BallState {
    if (ball.status !== "running") return ball;

    const grad = gradient(ball.x);
    const newX = ball.x - lr * grad * 25; // scale factor for visible movement (slower for drama)
    const newLoss = landscape(newX);
    const newStep = ball.step + 1;

    // Check for divergence (ball flew off) — higher threshold so we see the oscillation
    if (Math.abs(newX) > 12 || newLoss > 30) {
        return {
            ...ball,
            x: newX,
            loss: newLoss,
            history: [...ball.history, { x: newX, loss: newLoss }],
            status: "diverged",
            step: newStep,
        };
    }

    // Check for convergence (near minimum, small gradient)
    const converged = Math.abs(grad) < 0.02 && newStep > 5;

    return {
        x: newX,
        loss: newLoss,
        history: [...ball.history, { x: newX, loss: newLoss }],
        status: converged || newStep >= MAX_STEPS ? "converged" : "running",
        step: newStep,
    };
}

// SVG landscape path
function landscapePath(xMin: number, xMax: number, steps: number, toSvgX: (x: number) => number, toSvgY: (y: number) => number): string {
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        const y = landscape(x);
        pts.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
    }
    return `M${pts.join(" L")}`;
}

export function LearningRateIntuition() {
    const [balls, setBalls] = useState<BallState[]>(SCENARIOS.map(() => initBall()));
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const reset = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setBalls(SCENARIOS.map(() => initBall()));
        setRunning(false);
    }, []);

    const start = useCallback(() => {
        reset();
        setRunning(true);
    }, [reset]);

    useEffect(() => {
        if (!running) return;
        intervalRef.current = setInterval(() => {
            setBalls(prev => {
                const next = prev.map((ball, i) => stepBall(ball, SCENARIOS[i].lr));
                // Stop if all finished
                if (next.every(b => b.status !== "running")) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    setRunning(false);
                }
                return next;
            });
        }, 200);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [running]);

    // SVG layout
    const W = 480, H = 180, padL = 10, padR = 10, padT = 20, padB = 30;
    const xMin = -2, xMax = 5;
    const yMin = 1.8, yMax = 5.5;

    const toSvgX = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * (W - padL - padR);
    const toSvgY = (y: number) => padT + (1 - (y - yMin) / (yMax - yMin)) * (H - padT - padB);

    const path = landscapePath(xMin, xMax, 100, toSvgX, toSvgY);

    // Minimum position
    const minX = 0.1;
    const minY = landscape(minX);

    return (
        <div className="space-y-3">
            {/* SVG Landscape */}
            <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
                    {/* Landscape curve */}
                    <path d={path} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={2} />

                    {/* Fill below landscape */}
                    <path
                        d={`${path} L${toSvgX(xMax).toFixed(1)},${H} L${toSvgX(xMin).toFixed(1)},${H} Z`}
                        fill="rgba(139,92,246,0.04)"
                    />

                    {/* Minimum marker */}
                    <circle cx={toSvgX(minX)} cy={toSvgY(minY)} r={3}
                        fill="rgba(52,211,153,0.4)" stroke="rgba(52,211,153,0.6)" strokeWidth={1} />
                    <text x={toSvgX(minX)} y={toSvgY(minY) + 14} textAnchor="middle"
                        fill="rgba(52,211,153,0.5)" fontSize={7} fontFamily="monospace">
                        minimum
                    </text>

                    {/* Ball trails and balls */}
                    {balls.map((ball, si) => {
                        const scenario = SCENARIOS[si];
                        const hist = ball.history;

                        // Trail
                        const trailPts = hist
                            .filter(p => Math.abs(p.x) < 8)
                            .map(p => `${toSvgX(p.x).toFixed(1)},${toSvgY(landscape(p.x)).toFixed(1)}`)
                            .join(" ");

                        // Current ball position (clamped for display)
                        const displayX = Math.max(xMin, Math.min(xMax, ball.x));
                        const displayY = landscape(displayX);
                        const ballSvgX = toSvgX(displayX);
                        const ballSvgY = toSvgY(Math.min(displayY, yMax));

                        return (
                            <g key={si}>
                                {hist.length > 1 && (
                                    <polyline points={trailPts} fill="none"
                                        stroke={scenario.color} strokeWidth={1.5}
                                        strokeOpacity={0.3} strokeLinejoin="round" />
                                )}
                                {ball.status !== "diverged" && (
                                    <motion.circle
                                        cx={ballSvgX} cy={ballSvgY}
                                        r={7}
                                        fill={scenario.color}
                                        fillOpacity={0.8}
                                        stroke="white" strokeWidth={1.5} strokeOpacity={0.5}
                                        animate={ball.status === "running" ? {
                                            scale: [1, 1.1, 1],
                                        } : {}}
                                        transition={{ duration: 0.3, repeat: Infinity }}
                                    />
                                )}
                                {ball.status === "diverged" && (
                                    <text x={toSvgX(xMax) - 10} y={padT + 15 + si * 14} textAnchor="end"
                                        fill={scenario.color} fontSize={9} fontFamily="monospace" fontWeight={700}>
                                        💥 DIVERGED
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Labels */}
                    <text x={toSvgX(START_X)} y={padT - 4} textAnchor="middle"
                        fill="rgba(255,255,255,0.3)" fontSize={7} fontFamily="monospace">
                        start
                    </text>
                    <text x={W / 2} y={H - 4} textAnchor="middle"
                        fill="rgba(255,255,255,0.15)" fontSize={8} fontFamily="monospace">
                        Loss Landscape
                    </text>
                </svg>
            </div>

            {/* Controls */}
            <div className="flex justify-center">
                <button
                    onClick={running ? reset : start}
                    className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 transition-all"
                >
                    {running ? "Reset" : balls[0].step > 0 ? "Run Again" : "Run Gradient Descent"}
                </button>
            </div>

            {/* Verdict cards */}
            <div className="grid grid-cols-3 gap-2">
                {SCENARIOS.map((scenario, i) => {
                    const ball = balls[i];
                    return (
                        <div key={scenario.lr}
                            className={`rounded-lg border ${scenario.borderColor} ${scenario.bgColor} p-2.5 text-center`}
                        >
                            <div className={`text-[10px] font-mono font-bold ${scenario.textColor}`}>
                                {scenario.label}
                            </div>
                            <div className="text-[9px] font-mono text-white/30 mt-1">
                                {ball.step > 0 ? (
                                    <>
                                        <span>{ball.step} steps</span>
                                        <span className="mx-1">·</span>
                                        <span>loss: {ball.status === "diverged" ? "∞" : ball.loss.toFixed(3)}</span>
                                    </>
                                ) : "—"}
                            </div>
                            {ball.step > 0 && (
                                <div className={`text-[9px] font-mono font-bold mt-1 ${ball.status === "diverged" ? "text-rose-400"
                                        : ball.status === "converged" && ball.loss < 2.1 ? "text-emerald-400"
                                            : "text-amber-400"
                                    }`}>
                                    {ball.status === "diverged" ? "💥 Diverged"
                                        : ball.status === "converged" && ball.loss < 2.1 ? "✓ Converged"
                                            : ball.step >= MAX_STEPS ? "Still going..."
                                                : "Running..."}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
