"use client";

import { useCallback, useRef, useState } from "react";

import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

/*
  InitializationComparisonTrainer — v3
  3 columns: Too Small (σ=0.01), Random (σ=1.0), Kaiming (σ=√(2/N)).
  Now includes: dead neuron %, gradient magnitude, variance drift,
  wasted steps counter, improvement from random, and richer stats.
  4-layer network with N=128 neurons per layer.
*/

const STEPS = 60;
const NUM_LAYERS = 4;
const NEURONS_PER_LAYER = 128;

interface StepMetrics {
    loss: number;
    deadNeuronPct: number;     // % of neurons with |activation| > 0.99 (saturated tanh)
    gradMagnitude: number;      // average gradient norm
    varianceDrift: number;      // how far layer-4 variance is from 1.0
}

interface InitConfig {
    label: string;
    sigma: string;
    color: string;
    borderColor: string;
    bgColor: string;
    textColor: string;
    metrics: StepMetrics[];
    sample: string;
    diagnosis: string;
    emoji: string;
}

function makeMetrics(mode: "tiny" | "random" | "kaiming"): StepMetrics[] {
    const metrics: StepMetrics[] = [];
    let loss = 3.3;

    for (let i = 0; i < STEPS; i++) {
        let deadNeuronPct: number;
        let gradMagnitude: number;
        let varianceDrift: number;

        if (mode === "kaiming") {
            loss = loss * 0.935 + 0.015 * Math.sin(i * 0.3);
            loss = Math.max(1.88, loss);
            // Kaiming: healthy throughout
            deadNeuronPct = 3 + 2 * Math.sin(i * 0.2);
            gradMagnitude = 0.05 + 0.02 * Math.cos(i * 0.15);
            varianceDrift = 0.02 + 0.01 * Math.sin(i * 0.1);
        } else if (mode === "random") {
            if (i < 15) loss = loss * 0.997 + 0.005;
            else if (i < 35) loss = loss * 0.975 + 0.04 * Math.sin(i * 0.4);
            else loss = loss * 0.965;
            loss = Math.max(2.28, loss);
            // Random: starts bad, slowly recovers some neurons
            deadNeuronPct = Math.max(15, 85 - i * 1.2 + 5 * Math.sin(i * 0.3));
            gradMagnitude = Math.min(0.04, 0.001 + i * 0.0007);
            varianceDrift = Math.max(2, 45 - i * 0.8);
        } else {
            // Too small: signal vanishes, barely learns
            loss = loss * 0.999 - 0.001;
            loss = Math.max(3.15, loss);
            deadNeuronPct = 0; // not saturated — just near zero
            gradMagnitude = 0.0001 + 0.00005 * Math.sin(i * 0.2);
            varianceDrift = 0.98 - 0.001 * i; // variance → 0
        }

        metrics.push({
            loss,
            deadNeuronPct: Math.max(0, Math.min(100, deadNeuronPct)),
            gradMagnitude: Math.max(0, gradMagnitude),
            varianceDrift: Math.max(0, varianceDrift),
        });
    }
    return metrics;
}

const CONFIGS: InitConfig[] = [
    {
        label: "Too Small", sigma: "σ = 0.01", color: "#f97316",
        borderColor: "border-orange-500/20", bgColor: "bg-orange-500/5", textColor: "text-orange-400",
        metrics: makeMetrics("tiny"),
        sample: "eeeeeeeeeeeeeeeeeeeeeeeeee",
        diagnosis: "Signal vanishes — all outputs ≈ 0. Gradient ≈ 0. Nothing learns.",
        emoji: "🫥",
    },
    {
        label: "Random (σ=1)", sigma: "σ = 1.0", color: "#f43f5e",
        borderColor: "border-rose-500/20", bgColor: "bg-rose-500/5", textColor: "text-rose-400",
        metrics: makeMetrics("random"),
        sample: "thend the wor tha saint of",
        diagnosis: "Variance explodes → neurons saturate → first 15 steps wasted recovering.",
        emoji: "💀",
    },
    {
        label: "Kaiming", sigma: "σ = √(2/N)", color: "#10b981",
        borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5", textColor: "text-emerald-400",
        metrics: makeMetrics("kaiming"),
        sample: "the king was in the court",
        diagnosis: "Healthy from step 0. All neurons alive and learning immediately.",
        emoji: "✅",
    },
];

/* Mini SVG loss chart */
function LossChart({ data, step, color }: { data: StepMetrics[]; step: number; color: string }) {
    const W = 220, H = 100, px = 28, py = 8;
    const plotW = W - 2 * px, plotH = H - 2 * py;
    const yMin = 1.5, yMax = 3.5;

    const toX = (i: number) => px + (i / (STEPS - 1)) * plotW;
    const toY = (v: number) => py + (1 - (Math.max(yMin, Math.min(yMax, v)) - yMin) / (yMax - yMin)) * plotH;

    const visible = data.slice(0, step + 1);
    const path = visible.map((m, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(m.loss).toFixed(1)}`).join(" ");

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {[2.0, 2.5, 3.0].map(v => (
                <g key={v}>
                    <line x1={px} y1={toY(v)} x2={px + plotW} y2={toY(v)} stroke="white" strokeOpacity={0.04} />
                    <text x={px - 3} y={toY(v) + 3} textAnchor="end" fontSize={6} fill="white" fillOpacity={0.12} fontFamily="monospace">{v.toFixed(1)}</text>
                </g>
            ))}
            <line x1={px} y1={toY(3.3)} x2={px + plotW} y2={toY(3.3)} stroke="white" strokeOpacity={0.08} strokeDasharray="3 3" />
            <text x={px + plotW + 2} y={toY(3.3) + 3} fontSize={5} fill="white" fillOpacity={0.12} fontFamily="monospace">rand</text>
            {path && <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />}
            {step > 0 && <circle cx={toX(step)} cy={toY(visible[step].loss)} r={3} fill={color} />}
        </svg>
    );
}

export function InitializationComparisonTrainer() {
    const [step, setStep] = useState(0);
    const [playing, setPlaying] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const play = useCallback(() => {
        setPlaying(true);
        setStep(0);
        let s = 0;
        intervalRef.current = setInterval(() => {
            s++;
            if (s >= STEPS - 1) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setPlaying(false);
            }
            setStep(s);
        }, 70);
    }, []);

    const reset = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStep(0);
        setPlaying(false);
    }, []);

    const done = step >= STEPS - 1;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Config label */}
            <div className="text-[8px] font-mono text-white/15 text-center">
                {NUM_LAYERS}-layer MLP · {NEURONS_PER_LAYER} neurons/layer · same data, same architecture — only the initialization changes
            </div>

            {/* 3-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CONFIGS.map((cfg) => {
                    const m = cfg.metrics[step];
                    const deadNeurons = Math.round(m.deadNeuronPct / 100 * NEURONS_PER_LAYER * NUM_LAYERS);
                    const totalNeurons = NEURONS_PER_LAYER * NUM_LAYERS;
                    const improvementPct = ((3.3 - m.loss) / 3.3 * 100);

                    return (
                        <div key={cfg.label} className={`rounded-xl border p-3 flex flex-col gap-2 ${cfg.borderColor} ${cfg.bgColor}`}>
                            {/* Header */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{cfg.emoji}</span>
                                <span className={`text-[10px] font-mono font-bold ${cfg.textColor}`}>{cfg.label}</span>
                                <span className="text-[8px] font-mono text-white/20 ml-auto">{cfg.sigma}</span>
                            </div>

                            {/* Chart */}
                            <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] overflow-hidden">
                                <LossChart data={cfg.metrics} step={step} color={cfg.color} />
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 gap-1.5">
                                {/* Loss */}
                                <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5 text-center">
                                    <p className="text-[6px] font-mono text-white/15">LOSS</p>
                                    <p className={`text-sm font-mono font-bold ${cfg.textColor}`}>
                                        {m.loss.toFixed(2)}
                                    </p>
                                </div>
                                {/* Dead neurons */}
                                <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5 text-center">
                                    <p className="text-[6px] font-mono text-white/15">DEAD NEURONS</p>
                                    <p className={`text-sm font-mono font-bold ${m.deadNeuronPct > 50 ? "text-red-400" :
                                            m.deadNeuronPct > 10 ? "text-amber-400" : "text-emerald-400"
                                        }`}>
                                        {deadNeurons}/{totalNeurons}
                                    </p>
                                    <p className={`text-[6px] font-mono ${m.deadNeuronPct > 50 ? "text-red-400/40" :
                                            m.deadNeuronPct > 10 ? "text-amber-400/40" : "text-emerald-400/40"
                                        }`}>
                                        {m.deadNeuronPct.toFixed(0)}%
                                    </p>
                                </div>
                                {/* Gradient */}
                                <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5 text-center">
                                    <p className="text-[6px] font-mono text-white/15">AVG GRADIENT</p>
                                    <p className={`text-[10px] font-mono font-bold ${m.gradMagnitude > 0.01 ? "text-emerald-400" :
                                            m.gradMagnitude > 0.001 ? "text-amber-400" : "text-red-400"
                                        }`}>
                                        {m.gradMagnitude < 0.001 ? m.gradMagnitude.toExponential(1) : m.gradMagnitude.toFixed(4)}
                                    </p>
                                </div>
                                {/* Improvement */}
                                <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5 text-center">
                                    <p className="text-[6px] font-mono text-white/15">VS RANDOM</p>
                                    <p className={`text-[10px] font-mono font-bold ${improvementPct > 20 ? "text-emerald-400" :
                                            improvementPct > 5 ? "text-amber-400" : "text-red-400"
                                        }`}>
                                        {improvementPct > 0 ? `−${improvementPct.toFixed(0)}%` : "0%"}
                                    </p>
                                </div>
                            </div>

                            {/* Variance drift bar */}
                            <div className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[6px] font-mono text-white/15">L{NUM_LAYERS} variance drift</span>
                                    <span className="text-[7px] font-mono" style={{ color: cfg.color }}>
                                        {m.varianceDrift < 0.1 ? "≈0 (vanished)" : m.varianceDrift > 5 ? `${m.varianceDrift.toFixed(0)}× (exploded)` : `${m.varianceDrift.toFixed(2)}× (healthy)`}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: cfg.color }}
                                        animate={{ width: `${Math.min(100, (Math.log10(Math.max(m.varianceDrift, 0.01)) + 2) / 4 * 100)}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>

                            {/* Generated text (shown when done) */}
                            {done && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-1"
                                >
                                    <div className={`text-[9px] font-mono p-2 rounded border ${cfg.borderColor} ${cfg.bgColor} leading-relaxed`}
                                        style={{ color: `${cfg.color}99` }}
                                    >
                                        &ldquo;{cfg.sample}&rdquo;
                                    </div>
                                    <p className="text-[7px] font-mono text-white/20 leading-relaxed">
                                        {cfg.diagnosis}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    );
                })}
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
