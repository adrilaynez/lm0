"use client";

import { useCallback, useState } from "react";

import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

/*
  InitializationComparisonTrainer
  Side-by-side: random init vs Kaiming init — simulated loss curves showing
  how proper initialization enables faster, more stable convergence.
*/

const STEPS = 50;
function generateCurve(mode: "random" | "kaiming"): number[] {
    const curve: number[] = [];
    let loss = mode === "random" ? 3.3 : 3.3;
    for (let i = 0; i < STEPS; i++) {
        if (mode === "kaiming") {
            loss = loss * 0.94 + 0.02 * (Math.sin(i * 0.3) * 0.1);
            loss = Math.max(1.85, loss);
        } else {
            // Random init: slow start, plateau, then eventual slow descent
            if (i < 15) loss = loss * 0.995 + 0.01; // barely moves
            else if (i < 30) loss = loss * 0.97 + 0.05 * Math.sin(i * 0.5); // jerky
            else loss = loss * 0.96;
            loss = Math.max(2.25, loss);
        }
        curve.push(loss);
    }
    return curve;
}

const KAIMING_CURVE = generateCurve("kaiming");
const RANDOM_CURVE = generateCurve("random");

export function InitializationComparisonTrainer() {
    const [step, setStep] = useState(0);
    const [playing, setPlaying] = useState(false);

    const play = useCallback(() => {
        setPlaying(true);
        setStep(0);
        let s = 0;
        const interval = setInterval(() => {
            s++;
            if (s >= STEPS - 1) {
                clearInterval(interval);
                setPlaying(false);
            }
            setStep(s);
        }, 80);
    }, []);

    const reset = useCallback(() => {
        setStep(0);
        setPlaying(false);
    }, []);

    const W = 280;
    const H = 120;
    const pad = 25;

    const toX = (i: number) => pad + (i / (STEPS - 1)) * (W - 2 * pad);
    const toY = (v: number) => pad + ((3.5 - v) / (3.5 - 1.5)) * (H - 2 * pad);

    const kaimingPath = KAIMING_CURVE.slice(0, step + 1).map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
    const randomPath = RANDOM_CURVE.slice(0, step + 1).map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Chart */}
            <div className="flex justify-center">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md">
                    {/* Grid lines */}
                    {[1.5, 2.0, 2.5, 3.0, 3.5].map(v => (
                        <g key={v}>
                            <line x1={pad} y1={toY(v)} x2={W - pad} y2={toY(v)} stroke="rgba(255,255,255,0.04)" />
                            <text x={pad - 3} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="7" fontFamily="monospace">{v.toFixed(1)}</text>
                        </g>
                    ))}

                    {/* Curves */}
                    <path d={randomPath} fill="none" stroke="rgb(244,63,94)" strokeWidth="2" opacity="0.7" />
                    <path d={kaimingPath} fill="none" stroke="rgb(16,185,129)" strokeWidth="2" />

                    {/* Current points */}
                    {step > 0 && (
                        <>
                            <circle cx={toX(step)} cy={toY(KAIMING_CURVE[step])} r="3" fill="rgb(16,185,129)" />
                            <circle cx={toX(step)} cy={toY(RANDOM_CURVE[step])} r="3" fill="rgb(244,63,94)" />
                        </>
                    )}
                </svg>
            </div>

            {/* Legend + values */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-0.5 bg-rose-500 rounded" />
                        <span className="text-[9px] font-mono font-bold text-rose-400">Random Init (σ=0.5)</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-rose-400">{RANDOM_CURVE[step].toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-0.5 bg-emerald-500 rounded" />
                        <span className="text-[9px] font-mono font-bold text-emerald-400">Kaiming Init</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-emerald-400">{KAIMING_CURVE[step].toFixed(2)}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <span className="text-[9px] font-mono text-white/20">Step {step}/{STEPS - 1}</span>
                <button
                    onClick={play}
                    disabled={playing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-mono font-bold text-violet-400 hover:bg-violet-500/25 transition-colors disabled:opacity-30"
                >
                    <Play className="w-3 h-3" /> Train
                </button>
            </div>
        </div>
    );
}
