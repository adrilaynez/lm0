"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

/*
  BNArchitectureVisualizer
  Shows the full forward pass of a deep MLP WITH BatchNorm layers inserted.
  Based on MLPForwardPassAnimator but adapted to show:
  - Input → Hidden1 → BN1 → tanh → Hidden2 → BN2 → tanh → Hidden3 → BN3 → tanh → Output
  Step through to see data flowing, with BN layers highlighted showing normalization.
  ~300 lines
*/

const STEPS = [
    { id: "input", label: "Input", color: "#f59e0b" },
    { id: "hidden1", label: "W₁x+b₁", color: "#60a5fa" },
    { id: "bn1", label: "BN₁", color: "#a78bfa" },
    { id: "act1", label: "tanh", color: "#34d399" },
    { id: "hidden2", label: "W₂h+b₂", color: "#60a5fa" },
    { id: "bn2", label: "BN₂", color: "#a78bfa" },
    { id: "act2", label: "tanh", color: "#34d399" },
    { id: "hidden3", label: "W₃h+b₃", color: "#60a5fa" },
    { id: "bn3", label: "BN₃", color: "#a78bfa" },
    { id: "act3", label: "tanh", color: "#34d399" },
    { id: "output", label: "softmax", color: "#f43f5e" },
] as const;

// Simulated values at each stage
const STAGE_DATA: Record<string, { values: number[]; label: string; detail: string }> = {
    input: {
        values: [0.42, -0.15, 0.78, 0.11, -0.33, 0.91, 0.05, -0.62, 0.67, 0.23, -0.44, 0.55],
        label: "Concatenated embeddings (12D)",
        detail: "3 characters × 4D embedding = 12D input vector",
    },
    hidden1: {
        values: [3.8, -7.2, 12.1, -0.4, 5.6, -9.3, 1.2, 8.4],
        label: "Raw pre-activation (8 neurons)",
        detail: "W₁(8×12) · x + b₁ — values can be HUGE (12.1!) or tiny",
    },
    bn1: {
        values: [0.31, -1.12, 1.85, -0.52, 0.54, -1.55, -0.18, 0.97],
        label: "After BatchNorm₁",
        detail: "Centered at 0, spread ≈ 1. The 12.1 became 1.85 — no more explosions!",
    },
    act1: {
        values: [0.30, -0.81, 0.95, -0.48, 0.49, -0.91, -0.18, 0.75],
        label: "After tanh₁",
        detail: "All values in [-1,1]. Since BN kept inputs small, tanh works in its HEALTHY zone",
    },
    hidden2: {
        values: [5.1, -3.8, 8.7, 1.2, -6.4, 2.9, -1.1, 4.5],
        label: "Raw pre-activation layer 2",
        detail: "Without BN, these would compound the drift. But we'll normalize again...",
    },
    bn2: {
        values: [0.62, -0.93, 1.41, -0.22, -1.38, 0.15, -0.61, 0.45],
        label: "After BatchNorm₂",
        detail: "Reset to healthy range AGAIN. No matter what W₂ did, BN undoes the drift",
    },
    act2: {
        values: [0.55, -0.73, 0.89, -0.22, -0.88, 0.15, -0.54, 0.42],
        label: "After tanh₂",
        detail: "Still in the healthy zone! Without BN, by layer 2 many neurons would be saturated",
    },
    hidden3: {
        values: [4.2, -2.1, 6.8, -5.3, 3.1, -0.8, 7.2, -3.6],
        label: "Raw pre-activation layer 3",
        detail: "Layer 3 can still produce big values — that's fine, BN will fix it",
    },
    bn3: {
        values: [0.38, -0.71, 1.15, -1.22, 0.14, -0.49, 1.25, -0.85],
        label: "After BatchNorm₃",
        detail: "Three layers deep and STILL healthy. This is the magic of BN",
    },
    act3: {
        values: [0.36, -0.61, 0.82, -0.84, 0.14, -0.45, 0.85, -0.69],
        label: "After tanh₃",
        detail: "Every neuron is active (|x| < 1). Without BN at depth 3: ~40% would be dead",
    },
    output: {
        values: [0.42, 0.11, 0.09, 0.07, 0.05],
        label: "Softmax probabilities",
        detail: "Clean predictions because every layer was healthy",
    },
};

const TOP_PREDS = [
    { char: "l", prob: 0.42 },
    { char: "p", prob: 0.11 },
    { char: "o", prob: 0.09 },
    { char: "i", prob: 0.07 },
    { char: "e", prob: 0.05 },
];

// Network architecture diagram
const NET_COLS = [
    { label: "Input", n: 3, x: 55 },
    { label: "12d", n: 1, x: 145 },
    { label: "Layer 1", n: 8, x: 270 },
    { label: "Layer 2", n: 8, x: 400 },
    { label: "Layer 3", n: 8, x: 530 },
    { label: "Output", n: 5, x: 660 },
];
const NET_W = 720, NET_H = 220;
const NET_CHARS = ["h", "e", "l"];
const NET_OUTS = ["P(l)", "P(p)", "P(o)", "…", "P(z)"];

function netY(idx: number, total: number): number {
    if (total === 1) return NET_H / 2;
    const m = 28;
    return m + idx * ((NET_H - 2 * m) / (total - 1));
}

function colState(ci: number, s: number): "off" | "active" | "done" {
    const ranges: [number, number][] = [[0, 0], [1, 1], [1, 3], [4, 6], [7, 9], [10, 10]];
    const [lo, hi] = ranges[ci];
    if (s < lo) return "off";
    if (s > hi) return "done";
    return "active";
}

function colColor(ci: number, s: number): string {
    const isH = ci >= 2 && ci <= 4;
    if (!isH) return ci === 5 ? "#f43f5e" : "#f59e0b";
    const hIdx = ci - 2;
    const bnStep = [2, 5, 8][hIdx];
    const actStep = [3, 6, 9][hIdx];
    if (s === bnStep) return "#a78bfa";
    if (s === actStep) return "#34d399";
    return "#60a5fa";
}

export function BNArchitectureVisualizer() {
    const [step, setStep] = useState(0);

    const advance = useCallback(() => setStep(prev => Math.min(prev + 1, STEPS.length - 1)), []);
    const reset = useCallback(() => setStep(0), []);

    const currentData = STAGE_DATA[STEPS[step].id];
    const isBN = STEPS[step].id.startsWith("bn");
    const isAct = STEPS[step].id.startsWith("act");
    const isOutput = STEPS[step].id === "output";

    return (
        <div className="p-4 sm:p-6 space-y-3">
            {/* Step selector - scrollable */}
            <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
                {STEPS.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => setStep(i)}
                        className="flex items-center gap-0.5 px-1.5 sm:px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-mono font-bold transition-all border whitespace-nowrap"
                        style={{
                            backgroundColor: i <= step ? s.color + "18" : "rgba(255,255,255,0.02)",
                            borderColor: i <= step ? s.color + "40" : "rgba(255,255,255,0.06)",
                            color: i <= step ? s.color : "rgba(255,255,255,0.2)",
                        }}
                    >
                        {s.label}
                        {i < STEPS.length - 1 && <ChevronRight className="w-2 h-2 opacity-30" />}
                    </button>
                ))}
            </div>

            {/* Network architecture diagram */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-x-auto">
                <svg viewBox={`0 0 ${NET_W} ${NET_H}`} className="w-full" style={{ minHeight: 140 }}>
                    {/* Column headers */}
                    {NET_COLS.map((col, ci) => {
                        const st = colState(ci, step);
                        const c = colColor(ci, step);
                        return (
                            <text key={`h-${ci}`} x={col.x} y={14} textAnchor="middle"
                                fill={st === "off" ? "white" : c}
                                fillOpacity={st === "active" ? 0.7 : st === "done" ? 0.35 : 0.12}
                                fontSize={8} fontFamily="monospace" fontWeight="bold">
                                {col.label}
                            </text>
                        );
                    })}

                    {/* Connections between adjacent columns */}
                    {NET_COLS.map((col, ci) => {
                        if (ci === 0) return null;
                        const prev = NET_COLS[ci - 1];
                        const st = colState(ci, step);
                        const active = st !== "off";
                        return (
                            <g key={`conns-${ci}`}>
                                {Array.from({ length: prev.n }).flatMap((_, pi) =>
                                    Array.from({ length: col.n }).map((_, ni) => (
                                        <line key={`c-${ci}-${pi}-${ni}`}
                                            x1={prev.x + 9} y1={netY(pi, prev.n)}
                                            x2={col.x - 9} y2={netY(ni, col.n)}
                                            stroke={active ? colColor(ci, step) : "white"}
                                            strokeOpacity={active ? 0.06 : 0.015}
                                            strokeWidth={0.5}
                                        />
                                    ))
                                )}
                            </g>
                        );
                    })}

                    {/* Neurons */}
                    {NET_COLS.map((col, ci) => {
                        const st = colState(ci, step);
                        const c = colColor(ci, step);
                        const isH = ci >= 2 && ci <= 4;
                        const hIdx = ci - 2;
                        const isBNNow = isH && step === [2, 5, 8][hIdx];
                        return Array.from({ length: col.n }).map((_, ni) => (
                            <g key={`n-${ci}-${ni}`}>
                                <motion.circle
                                    cx={col.x} cy={netY(ni, col.n)} r={7}
                                    fill={c}
                                    animate={{
                                        fillOpacity: st === "active" ? 0.22 : st === "done" ? 0.07 : 0.02,
                                        strokeOpacity: st === "active" ? 0.5 : st === "done" ? 0.15 : 0.05,
                                    }}
                                    stroke={isBNNow ? "#a78bfa" : c}
                                    strokeWidth={isBNNow ? 2.5 : st === "active" ? 1.5 : 1}
                                    transition={{ duration: 0.3 }}
                                />
                                {/* Input char labels */}
                                {ci === 0 && (
                                    <text x={col.x} y={netY(ni, col.n) + 3} textAnchor="middle"
                                        fill="#f59e0b" fillOpacity={st !== "off" ? 0.6 : 0.15}
                                        fontSize={7} fontFamily="monospace" fontWeight="bold">
                                        {NET_CHARS[ni]}
                                    </text>
                                )}
                                {/* Concat label */}
                                {ci === 1 && (
                                    <text x={col.x} y={netY(ni, col.n) + 3} textAnchor="middle"
                                        fill="#f59e0b" fillOpacity={st !== "off" ? 0.5 : 0.1}
                                        fontSize={6} fontFamily="monospace" fontWeight="bold">
                                        12d
                                    </text>
                                )}
                                {/* Output prediction labels */}
                                {ci === 5 && (
                                    <text x={col.x + 16} y={netY(ni, col.n) + 3} textAnchor="start"
                                        fill="#f43f5e" fillOpacity={st !== "off" ? 0.45 : 0.1}
                                        fontSize={6} fontFamily="monospace">
                                        {NET_OUTS[ni]}
                                    </text>
                                )}
                            </g>
                        ));
                    })}

                    {/* BN/Activation state badges under active hidden columns */}
                    {[2, 3, 4].map(ci => {
                        const hIdx = ci - 2;
                        const bnStep = [2, 5, 8][hIdx];
                        const actStep = [3, 6, 9][hIdx];
                        const col = NET_COLS[ci];
                        if (step === bnStep) return (
                            <g key={`bn-badge-${ci}`}>
                                <rect x={col.x - 16} y={NET_H - 18} width={32} height={14} rx={3}
                                    fill="#a78bfa" fillOpacity={0.15} stroke="#a78bfa" strokeOpacity={0.3} />
                                <text x={col.x} y={NET_H - 8} textAnchor="middle"
                                    fill="#a78bfa" fillOpacity={0.7} fontSize={7} fontFamily="monospace" fontWeight="bold">
                                    BN
                                </text>
                            </g>
                        );
                        if (step === actStep) return (
                            <g key={`act-badge-${ci}`}>
                                <rect x={col.x - 16} y={NET_H - 18} width={32} height={14} rx={3}
                                    fill="#34d399" fillOpacity={0.15} stroke="#34d399" strokeOpacity={0.3} />
                                <text x={col.x} y={NET_H - 8} textAnchor="middle"
                                    fill="#34d399" fillOpacity={0.7} fontSize={7} fontFamily="monospace" fontWeight="bold">
                                    tanh
                                </text>
                            </g>
                        );
                        return null;
                    })}
                </svg>
            </div>

            {/* Detail panel */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl border p-4 sm:p-5 min-h-[160px] space-y-3"
                    style={{
                        borderColor: STEPS[step].color + "25",
                        backgroundColor: STEPS[step].color + "08",
                    }}
                >
                    {/* Stage label */}
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-mono font-bold" style={{ color: STEPS[step].color }}>
                            Step {step + 1} · {currentData.label}
                        </p>
                        {isBN && (
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-mono font-bold bg-violet-500/15 border border-violet-500/25 text-violet-400">
                                NORMALIZE
                            </span>
                        )}
                        {isAct && (
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                                ACTIVATE
                            </span>
                        )}
                    </div>

                    {/* Values grid */}
                    <div className="flex gap-1.5 flex-wrap justify-center">
                        {(isOutput ? TOP_PREDS.map(p => p.prob) : currentData.values).map((v, i) => {
                            const absV = Math.abs(v);
                            const isHealthy = absV < 1.5;
                            const isDangerous = absV > 3;
                            let borderCol = STEPS[step].color + "30";
                            let bgCol = STEPS[step].color + "12";

                            if (!isBN && !isAct && !isOutput && STEPS[step].id !== "input") {
                                // Raw pre-activation: color by danger
                                borderCol = isDangerous ? "#ef444450" : isHealthy ? "#22c55e30" : "#f59e0b30";
                                bgCol = isDangerous ? "#ef444415" : isHealthy ? "#22c55e10" : "#f59e0b10";
                            }

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.03, type: "spring", stiffness: 200 }}
                                    className="flex flex-col items-center gap-0.5"
                                >
                                    {isOutput && (
                                        <span className="text-[7px] font-mono text-white/20">{TOP_PREDS[i].char}</span>
                                    )}
                                    <span
                                        className="px-2 py-1.5 rounded-md text-[10px] font-mono font-bold tabular-nums border"
                                        style={{ backgroundColor: bgCol, borderColor: borderCol, color: STEPS[step].color }}
                                    >
                                        {isOutput ? `${(v * 100).toFixed(1)}%` : v.toFixed(2)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    <p className="text-[9px] font-mono text-white/30 text-center leading-relaxed">
                        {currentData.detail}
                    </p>

                    {/* BN stats when showing a BN step */}
                    {isBN && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center justify-center gap-4 text-[8px] font-mono"
                        >
                            <span className="text-violet-400/60">μ = {(currentData.values.reduce((a, b) => a + b, 0) / currentData.values.length).toFixed(3)}</span>
                            <span className="text-violet-400/60">σ = {Math.sqrt(currentData.values.reduce((a, b) => a + b * b, 0) / currentData.values.length - Math.pow(currentData.values.reduce((a, b) => a + b, 0) / currentData.values.length, 2)).toFixed(3)}</span>
                            <span className="text-violet-400/40">|max| = {Math.max(...currentData.values.map(Math.abs)).toFixed(2)}</span>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-white/50 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
                {step < STEPS.length - 1 ? (
                    <button
                        onClick={advance}
                        className="px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors border"
                        style={{
                            backgroundColor: STEPS[step + 1].color + "18",
                            borderColor: STEPS[step + 1].color + "40",
                            color: STEPS[step + 1].color,
                        }}
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        onClick={reset}
                        className="px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors bg-violet-500/15 border border-violet-500/30 text-violet-400 hover:bg-violet-500/25"
                    >
                        <span className="flex items-center gap-1.5"><RotateCcw className="w-3 h-3" /> Replay</span>
                    </button>
                )}
            </div>
        </div>
    );
}
