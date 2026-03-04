"use client";

import { useCallback, useRef, useState } from "react";

import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

/*
  InitializationComparisonTrainer — IMPROVED
  3 columns: Too Small (σ=0.01), Random (σ=1.0), Kaiming (σ=√(2/N)).
  Bigger 200px loss charts, generated text samples, clear color coding.
*/

const STEPS = 60;

interface InitConfig {
    label: string;
    sigma: string;
    color: string;
    borderColor: string;
    bgColor: string;
    textColor: string;
    curve: number[];
    sample: string;
}

function makeCurve(mode: "tiny" | "random" | "kaiming"): number[] {
    const curve: number[] = [];
    let loss = 3.3;
    for (let i = 0; i < STEPS; i++) {
        if (mode === "kaiming") {
            loss = loss * 0.935 + 0.015 * Math.sin(i * 0.3);
            loss = Math.max(1.88, loss);
        } else if (mode === "random") {
            if (i < 15) loss = loss * 0.997 + 0.005;
            else if (i < 35) loss = loss * 0.975 + 0.04 * Math.sin(i * 0.4);
            else loss = loss * 0.965;
            loss = Math.max(2.28, loss);
        } else {
            // Too small: signal vanishes, barely learns
            loss = loss * 0.999 - 0.001;
            loss = Math.max(3.15, loss);
        }
        curve.push(loss);
    }
    return curve;
}

const CONFIGS: InitConfig[] = [
    {
        label: "Too Small", sigma: "σ = 0.01", color: "#f97316",
        borderColor: "border-orange-500/20", bgColor: "bg-orange-500/5", textColor: "text-orange-400",
        curve: makeCurve("tiny"),
        sample: "eeeeeeeeeeeeeeeeeeeeeeeeee",
    },
    {
        label: "Random", sigma: "σ = 1.0", color: "#f43f5e",
        borderColor: "border-rose-500/20", bgColor: "bg-rose-500/5", textColor: "text-rose-400",
        curve: makeCurve("random"),
        sample: "thend the wor tha saint of",
    },
    {
        label: "Kaiming", sigma: "σ = √(2/N)", color: "#10b981",
        borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5", textColor: "text-emerald-400",
        curve: makeCurve("kaiming"),
        sample: "the king was in the court",
    },
];

/* Mini SVG loss chart */
function LossChart({ data, step, color }: { data: number[]; step: number; color: string }) {
    const W = 220, H = 120, px = 28, py = 10;
    const plotW = W - 2 * px, plotH = H - 2 * py;
    const yMin = 1.5, yMax = 3.5;

    const toX = (i: number) => px + (i / (STEPS - 1)) * plotW;
    const toY = (v: number) => py + (1 - (Math.max(yMin, Math.min(yMax, v)) - yMin) / (yMax - yMin)) * plotH;

    const visible = data.slice(0, step + 1);
    const path = visible.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {/* Grid */}
            {[2.0, 2.5, 3.0].map(v => (
                <g key={v}>
                    <line x1={px} y1={toY(v)} x2={px + plotW} y2={toY(v)} stroke="white" strokeOpacity={0.04} />
                    <text x={px - 3} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="white" fillOpacity={0.12} fontFamily="monospace">{v.toFixed(1)}</text>
                </g>
            ))}
            {/* Random baseline */}
            <line x1={px} y1={toY(3.3)} x2={px + plotW} y2={toY(3.3)} stroke="white" strokeOpacity={0.1} strokeDasharray="3 3" />
            <text x={px + plotW + 2} y={toY(3.3) + 3} fontSize={5} fill="white" fillOpacity={0.15} fontFamily="monospace">rand</text>
            {/* Curve */}
            {path && <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />}
            {/* Current dot */}
            {step > 0 && <circle cx={toX(step)} cy={toY(visible[step])} r={3} fill={color} />}
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
            {/* 3-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CONFIGS.map((cfg) => (
                    <div key={cfg.label} className={`rounded-xl border p-3 flex flex-col gap-2 ${cfg.borderColor} ${cfg.bgColor}`}>
                        {/* Header */}
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-0.5 rounded" style={{ backgroundColor: cfg.color }} />
                            <span className={`text-[10px] font-mono font-bold ${cfg.textColor}`}>{cfg.label}</span>
                            <span className="text-[8px] font-mono text-white/20 ml-auto">{cfg.sigma}</span>
                        </div>

                        {/* Chart */}
                        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] overflow-hidden">
                            <LossChart data={cfg.curve} step={step} color={cfg.color} />
                        </div>

                        {/* Loss value */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-[9px] font-mono text-white/20">Loss:</span>
                            <motion.span
                                key={step}
                                className={`text-base font-mono font-bold ${cfg.textColor}`}
                            >
                                {cfg.curve[step].toFixed(2)}
                            </motion.span>
                        </div>

                        {/* Generated text (shown when done) */}
                        {done && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-[9px] font-mono p-2 rounded border ${cfg.borderColor} ${cfg.bgColor} leading-relaxed`}
                                style={{ color: `${cfg.color}99` }}
                            >
                                &ldquo;{cfg.sample}&rdquo;
                            </motion.div>
                        )}
                    </div>
                ))}
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
