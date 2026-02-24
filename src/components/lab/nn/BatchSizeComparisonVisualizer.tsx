"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Redesigned: 3 side-by-side panels showing the same 10 training steps
  with batch size 1, 4, and ALL simultaneously.
  Each panel shows a prediction line bouncing toward the true mean.
  With batch=1 it's wild/noisy, batch=4 is smoother, ALL is a straight path.
  User clicks "Run 10 steps" and watches all 3 animate together.
*/

function seededRng(seed: number) {
    let s = seed;
    return () => { s = (s * 16807 + 12345) % 2147483647; return (s & 0x7fffffff) / 2147483647; };
}

const TRUE_MEAN = 170;
const DATA_RNG = seededRng(42);
const DATA = Array.from({ length: 12 }, () => Math.round(TRUE_MEAN + (DATA_RNG() - 0.5) * 40));
const ACTUAL_MEAN = DATA.reduce((a, b) => a + b, 0) / DATA.length;

// Pre-compute all 3 histories for 20 steps
function simulateTraining(batchSize: number, seed: number): number[] {
    const rng = seededRng(seed);
    let pred = 155; // start far from mean
    const hist = [pred];
    const lr = 0.3;
    for (let s = 0; s < 20; s++) {
        const batch: number[] = [];
        for (let i = 0; i < batchSize; i++) {
            batch.push(DATA[Math.floor(rng() * DATA.length)]);
        }
        const batchMean = batch.reduce((a, b) => a + b, 0) / batch.length;
        const gradient = pred - batchMean;
        pred = Math.max(145, Math.min(195, pred - lr * gradient));
        hist.push(pred);
    }
    return hist;
}

const HIST_1 = simulateTraining(1, 100);
const HIST_4 = simulateTraining(4, 100);
const HIST_ALL = simulateTraining(DATA.length, 100);

const SVG_W = 200;
const SVG_H = 80;
const PAD = { l: 6, r: 6, t: 8, b: 14 };
const MIN_V = 148;
const MAX_V = 192;

function valToY(v: number) {
    return PAD.t + (1 - (v - MIN_V) / (MAX_V - MIN_V)) * (SVG_H - PAD.t - PAD.b);
}

function MiniChart({ history, steps, color, label }: {
    history: number[]; steps: number; color: string; label: string;
}) {
    const visible = history.slice(0, steps + 1);
    const meanY = valToY(ACTUAL_MEAN);

    return (
        <div className="space-y-1">
            <p className="text-[9px] font-mono font-bold text-center" style={{ color }}>{label}</p>
            <div className="rounded-lg bg-black/30 border border-white/[0.04] p-1">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full block">
                    {/* True mean reference */}
                    <line x1={PAD.l} y1={meanY} x2={SVG_W - PAD.r} y2={meanY}
                        stroke="rgba(52,211,153,0.2)" strokeDasharray="3 2" />
                    <text x={SVG_W - PAD.r} y={meanY - 3} textAnchor="end"
                        fill="rgba(52,211,153,0.3)" fontSize="5" fontFamily="monospace">true mean</text>

                    {/* Prediction line */}
                    {visible.length > 1 && (
                        <polyline
                            fill="none"
                            stroke={color}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={visible.map((v, i) => {
                                const x = PAD.l + (i / 20) * (SVG_W - PAD.l - PAD.r);
                                return `${x},${valToY(v)}`;
                            }).join(" ")}
                        />
                    )}

                    {/* Current point */}
                    {visible.length > 0 && (
                        <circle
                            cx={PAD.l + ((visible.length - 1) / 20) * (SVG_W - PAD.l - PAD.r)}
                            cy={valToY(visible[visible.length - 1])}
                            r="3" fill={color} stroke="white" strokeWidth="0.8"
                        />
                    )}

                    {/* Step label */}
                    <text x={SVG_W / 2} y={SVG_H - 2} textAnchor="middle"
                        fill="rgba(255,255,255,0.15)" fontSize="5" fontFamily="monospace">
                        step {Math.min(steps, 20)}
                    </text>
                </svg>
            </div>
            {/* Final value */}
            <p className="text-[8px] font-mono text-center text-white/25">
                pred: <span style={{ color }} className="font-bold">
                    {visible[visible.length - 1].toFixed(0)}
                </span>
                <span className="text-white/15"> (target: {ACTUAL_MEAN.toFixed(0)})</span>
            </p>
        </div>
    );
}

export function BatchSizeComparisonVisualizer() {
    const { t } = useI18n();
    const [steps, setSteps] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const doStep = useCallback(() => {
        setSteps(s => Math.min(s + 1, 20));
    }, []);

    const doRun = useCallback(() => {
        setIsPlaying(true);
        let count = steps;
        const interval = setInterval(() => {
            count++;
            setSteps(count);
            if (count >= 20) {
                clearInterval(interval);
                setIsPlaying(false);
            }
        }, 200);
        return () => clearInterval(interval);
    }, [steps]);

    const doReset = useCallback(() => {
        setSteps(0);
        setIsPlaying(false);
    }, []);

    return (
        <div className="space-y-4">
            {/* 3 side-by-side panels */}
            <div className="grid grid-cols-3 gap-2">
                <MiniChart history={HIST_1} steps={steps} color={NN_COLORS.error.hex} label="batch = 1" />
                <MiniChart history={HIST_4} steps={steps} color="#eab308" label="batch = 4" />
                <MiniChart history={HIST_ALL} steps={steps} color={NN_COLORS.output.hex} label="batch = ALL" />
            </div>

            {/* Controls */}
            <div className="flex gap-2 justify-center">
                <button
                    onClick={doStep}
                    disabled={isPlaying || steps >= 20}
                    className="px-3 py-2 rounded-lg text-[11px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 disabled:opacity-30 transition-all"
                >
                    Step →
                </button>
                <button
                    onClick={doRun}
                    disabled={isPlaying || steps >= 20}
                    className="px-4 py-2 rounded-lg text-[11px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-30 transition-all"
                >
                    {isPlaying ? "Running..." : "▶ Run all 20"}
                </button>
                <button
                    onClick={doReset}
                    className="px-3 py-2 rounded-lg text-[11px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
                >
                    ↺
                </button>
            </div>

            {/* Insight */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[11px] text-white/35 leading-relaxed">
                    {steps < 5
                        ? t("neuralNetworkNarrative.batchComparison.insightStart")
                        : steps >= 20
                            ? t("neuralNetworkNarrative.batchComparison.insightEnd")
                            : t("neuralNetworkNarrative.batchComparison.insightMid")
                    }
                </p>
            </div>
        </div>
    );
}
