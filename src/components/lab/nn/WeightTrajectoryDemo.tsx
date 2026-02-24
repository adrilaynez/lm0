"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";

/*
  2D heatmap + trajectory visualization.
  Shows loss = (w₁×1 + w₂×2 − 3)² as a heatmap.
  Animates the weight trajectory from (4,3) converging toward a solution.
  The user sees the "ball rolling downhill" metaphor come to life.
*/

const X1 = 1, X2 = 2, TARGET = 3;
const LR = 0.02;
const GRID_SIZE = 40;
const W_MIN = -1, W_MAX = 5;

function loss(w1: number, w2: number): number {
    const output = w1 * X1 + w2 * X2;
    return (output - TARGET) ** 2;
}

interface Point { w1: number; w2: number; loss: number; }

function simulateTrajectory(): Point[] {
    const path: Point[] = [];
    let w1 = 4, w2 = 3;
    for (let i = 0; i < 60; i++) {
        const l = loss(w1, w2);
        path.push({ w1, w2, loss: l });
        if (l < 0.01) break;
        const error = w1 * X1 + w2 * X2 - TARGET;
        w1 -= LR * 2 * error * X1;
        w2 -= LR * 2 * error * X2;
    }
    return path;
}

// Pre-compute loss grid
function computeGrid(): number[][] {
    const grid: number[][] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
        const row: number[] = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            const w1 = W_MIN + (i / (GRID_SIZE - 1)) * (W_MAX - W_MIN);
            const w2 = W_MIN + (j / (GRID_SIZE - 1)) * (W_MAX - W_MIN);
            row.push(loss(w1, w2));
        }
        grid.push(row);
    }
    return grid;
}

function lossToColor(l: number, maxL: number): string {
    const norm = Math.min(l / maxL, 1);
    // Dark blue (low loss) → yellow → red (high loss)
    if (norm < 0.15) {
        const t = norm / 0.15;
        const r = Math.round(10 + t * 20);
        const g = Math.round(20 + t * 40);
        const b = Math.round(80 + t * 30);
        return `rgb(${r},${g},${b})`;
    }
    if (norm < 0.5) {
        const t = (norm - 0.15) / 0.35;
        const r = Math.round(30 + t * 170);
        const g = Math.round(60 + t * 120);
        const b = Math.round(110 - t * 80);
        return `rgb(${r},${g},${b})`;
    }
    const t = (norm - 0.5) / 0.5;
    const r = Math.round(200 + t * 55);
    const g = Math.round(180 - t * 140);
    const b = Math.round(30 - t * 20);
    return `rgb(${r},${g},${b})`;
}

export function WeightTrajectoryDemo() {
    const { t } = useI18n();
    const [animStep, setAnimStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const trajectory = simulateTrajectory();
    const grid = computeGrid();
    const maxLoss = Math.max(...grid.flat());
    const maxStep = trajectory.length - 1;
    const current = trajectory[Math.min(animStep, maxStep)];

    const SVG_SIZE = 280;
    const PADDING = 0;

    function w1ToX(w1: number): number {
        return PADDING + ((w1 - W_MIN) / (W_MAX - W_MIN)) * (SVG_SIZE - 2 * PADDING);
    }
    function w2ToY(w2: number): number {
        return PADDING + ((w2 - W_MIN) / (W_MAX - W_MIN)) * (SVG_SIZE - 2 * PADDING);
    }

    const cellSize = (SVG_SIZE - 2 * PADDING) / GRID_SIZE;

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
        }, 150);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPlaying, maxStep]);

    // Path up to current step
    const pathPoints = trajectory.slice(0, animStep + 1);

    return (
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.02] to-transparent p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-white/30 mb-5">
                {t("neuralNetworkNarrative.howItLearns.trajectory.title")}
            </p>

            <div className="flex flex-col md:flex-row gap-5 items-center">
                {/* Heatmap + trajectory SVG */}
                <div className="relative shrink-0">
                    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="rounded-xl overflow-hidden">
                        {/* Heatmap cells */}
                        {grid.map((row, j) =>
                            row.map((l, i) => (
                                <rect
                                    key={`${i}-${j}`}
                                    x={PADDING + i * cellSize}
                                    y={PADDING + j * cellSize}
                                    width={cellSize + 0.5}
                                    height={cellSize + 0.5}
                                    fill={lossToColor(l, maxLoss)}
                                />
                            ))
                        )}

                        {/* Solution line (w1 + 2*w2 = 3) */}
                        <line
                            x1={w1ToX(W_MIN)}
                            y1={w2ToY((TARGET - W_MIN * X1) / X2)}
                            x2={w1ToX(W_MAX)}
                            y2={w2ToY((TARGET - W_MAX * X1) / X2)}
                            stroke="rgba(52,211,153,0.3)"
                            strokeWidth="1"
                            strokeDasharray="4 3"
                        />

                        {/* Trajectory path */}
                        {pathPoints.length > 1 && (
                            <polyline
                                fill="none"
                                stroke="rgba(255,255,255,0.7)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={pathPoints.map(p => `${w1ToX(p.w1)},${w2ToY(p.w2)}`).join(" ")}
                            />
                        )}

                        {/* Start point */}
                        <circle cx={w1ToX(4)} cy={w2ToY(3)} r="5" fill="rgba(251,113,133,0.9)" stroke="white" strokeWidth="1.5" />

                        {/* Current point */}
                        {animStep > 0 && (
                            <circle
                                cx={w1ToX(current.w1)}
                                cy={w2ToY(current.w2)}
                                r="5"
                                fill={current.loss < 1 ? "rgba(52,211,153,0.9)" : "rgba(255,255,255,0.9)"}
                                stroke="white"
                                strokeWidth="1.5"
                            />
                        )}

                        {/* Axis labels */}
                        <text x={SVG_SIZE / 2} y={SVG_SIZE - 2} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace">w₁</text>
                        <text x={4} y={SVG_SIZE / 2} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace" transform={`rotate(-90, 8, ${SVG_SIZE / 2})`}>w₂</text>

                        {/* Tick marks — w₁ (x-axis) */}
                        {[0, 1, 2, 3, 4, 5].map(v => (
                            <g key={`tx-${v}`}>
                                <line x1={w1ToX(v)} y1={SVG_SIZE - 1} x2={w1ToX(v)} y2={SVG_SIZE - 5} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <text x={w1ToX(v)} y={SVG_SIZE - 7} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">{v}</text>
                            </g>
                        ))}
                        {/* Tick marks — w₂ (y-axis) */}
                        {[0, 1, 2, 3, 4, 5].map(v => (
                            <g key={`ty-${v}`}>
                                <line x1={1} y1={w2ToY(v)} x2={5} y2={w2ToY(v)} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <text x={8} y={w2ToY(v) + 3} textAnchor="start" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">{v}</text>
                            </g>
                        ))}
                    </svg>

                    {/* Legend */}
                    <div className="flex items-center justify-between mt-2 px-1">
                        <span className="text-[9px] font-mono text-white/20">{t("neuralNetworkNarrative.howItLearns.trajectory.lowLoss")}</span>
                        <div className="flex-1 mx-2 h-2 rounded-full" style={{
                            background: `linear-gradient(to right, rgb(10,20,80), rgb(100,100,60), rgb(200,180,30), rgb(255,40,10))`
                        }} />
                        <span className="text-[9px] font-mono text-white/20">{t("neuralNetworkNarrative.howItLearns.trajectory.highLoss")}</span>
                    </div>
                </div>

                {/* Info panel */}
                <div className="flex-1 min-w-0 space-y-4">
                    <div className="space-y-3">
                        <div className="rounded-lg bg-black/20 border border-white/[0.05] p-3">
                            <span className="text-[9px] text-white/30 block font-mono mb-1">Step</span>
                            <span className="text-lg font-mono font-bold text-white/60">{animStep}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-rose-500/[0.04] border border-rose-500/15 p-3 text-center">
                                <span className="text-[9px] text-rose-400/50 block font-mono mb-1">w₁</span>
                                <span className="text-base font-mono font-bold text-rose-400">{current.w1.toFixed(2)}</span>
                            </div>
                            <div className="rounded-lg bg-rose-500/[0.04] border border-rose-500/15 p-3 text-center">
                                <span className="text-[9px] text-rose-400/50 block font-mono mb-1">w₂</span>
                                <span className="text-base font-mono font-bold text-rose-400">{current.w2.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="rounded-lg bg-black/20 border border-white/[0.05] p-3 text-center">
                            <span className="text-[9px] text-white/30 block font-mono mb-1">Loss</span>
                            <span className={`text-lg font-mono font-bold ${current.loss < 1 ? "text-emerald-400" : current.loss < 10 ? "text-amber-400" : "text-rose-400"}`}>
                                {current.loss.toFixed(1)}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={startAnimation}
                            disabled={isPlaying}
                            className="px-4 py-2 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            {isPlaying ? t("neuralNetworkNarrative.howItLearns.trajectory.running") : t("neuralNetworkNarrative.howItLearns.trajectory.play")}
                        </button>
                        <button
                            onClick={() => { setAnimStep(0); setIsPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); }}
                            className="px-3 py-2 rounded-full text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
                        >
                            {t("neuralNetworkNarrative.howItLearns.trajectory.reset")}
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-[11px] text-white/25 mt-4 italic text-center">
                {t("neuralNetworkNarrative.howItLearns.trajectory.hint")}
            </p>
        </div>
    );
}
