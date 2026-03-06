"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";

/*
  ResidualBNArchitectureVisualizer
  Shows the full forward pass of a deep MLP with BOTH BatchNorm AND Residual connections.
  Architecture: Input → Concat → [Linear → BN → tanh + skip] × 3 → Output
  Step through to see data flowing, with BN normalizing and residual corrections.
  The diagram shows the full network with skip connection arcs.
*/

const STEPS = [
    { id: "input", label: "Input", color: "#f59e0b" },
    { id: "concat", label: "Concat 12d", color: "#f59e0b" },
    { id: "linear1", label: "W₁x+b₁", color: "#60a5fa" },
    { id: "bn1", label: "BN₁", color: "#a78bfa" },
    { id: "act1", label: "tanh₁", color: "#34d399" },
    { id: "res1", label: "x + f₁(x)", color: "#06b6d4" },
    { id: "linear2", label: "W₂h+b₂", color: "#60a5fa" },
    { id: "bn2", label: "BN₂", color: "#a78bfa" },
    { id: "act2", label: "tanh₂", color: "#34d399" },
    { id: "res2", label: "x + f₂(x)", color: "#06b6d4" },
    { id: "linear3", label: "W₃h+b₃", color: "#60a5fa" },
    { id: "bn3", label: "BN₃", color: "#a78bfa" },
    { id: "act3", label: "tanh₃", color: "#34d399" },
    { id: "res3", label: "x + f₃(x)", color: "#06b6d4" },
    { id: "output", label: "softmax", color: "#f43f5e" },
] as const;

const STAGE_DATA: Record<string, { values: number[]; label: string; detail: string }> = {
    input: {
        values: [0.42, -0.15, 0.78, 0.11, -0.33, 0.91, 0.05, -0.62],
        label: "Concatenated embeddings (subset of 12D)",
        detail: "3 characters × 4D embedding = 12D input vector",
    },
    concat: {
        values: [0.42, -0.15, 0.78, 0.11, -0.33, 0.91, 0.05, -0.62],
        label: "Concatenated 12D → ready for first layer",
        detail: "Flattened embedding vector, this is x₀ — the residual 'highway' starts here",
    },
    linear1: {
        values: [3.8, -7.2, 12.1, -0.4, 5.6, -9.3, 1.2, 8.4],
        label: "Raw pre-activation (8 neurons)",
        detail: "W₁(8×12) · x + b₁ — values can be HUGE (12.1!) or tiny",
    },
    bn1: {
        values: [0.31, -1.12, 1.85, -0.52, 0.54, -1.55, -0.18, 0.97],
        label: "After BatchNorm₁",
        detail: "Centered at 0, spread ≈ 1. The 12.1 became 1.85 — explosions prevented!",
    },
    act1: {
        values: [0.30, -0.81, 0.95, -0.48, 0.49, -0.91, -0.18, 0.75],
        label: "After tanh₁ — this is f₁(x)",
        detail: "All values in [-1,1]. This is the CORRECTION f₁(x), not the full output",
    },
    res1: {
        values: [0.72, -0.96, 1.73, -0.37, 0.16, 0.00, -0.13, 0.13],
        label: "y₁ = x₀ + f₁(x₀) — residual add!",
        detail: "Original signal PRESERVED + small correction. Even if f₁ was bad, x₀ survives!",
    },
    linear2: {
        values: [5.1, -3.8, 8.7, 1.2, -6.4, 2.9, -1.1, 4.5],
        label: "Raw pre-activation layer 2",
        detail: "W₂ · y₁ + b₂ — operating on the residual-corrected signal",
    },
    bn2: {
        values: [0.62, -0.93, 1.41, -0.22, -1.38, 0.15, -0.61, 0.45],
        label: "After BatchNorm₂",
        detail: "Normalized AGAIN. No matter what W₂ did, BN keeps it healthy",
    },
    act2: {
        values: [0.55, -0.73, 0.89, -0.22, -0.88, 0.15, -0.54, 0.42],
        label: "After tanh₂ — this is f₂(x)",
        detail: "Another small correction vector. The network learns refinements, not replacements",
    },
    res2: {
        values: [1.27, -1.69, 2.62, -0.59, -0.72, 0.15, -0.67, 0.55],
        label: "y₂ = y₁ + f₂(y₁) — second residual add",
        detail: "Original info from x₀ STILL present, now refined twice. Signal quality stays high!",
    },
    linear3: {
        values: [4.2, -2.1, 6.8, -5.3, 3.1, -0.8, 7.2, -3.6],
        label: "Raw pre-activation layer 3",
        detail: "Layer 3 can still produce big values — BN will handle it",
    },
    bn3: {
        values: [0.38, -0.71, 1.15, -1.22, 0.14, -0.49, 1.25, -0.85],
        label: "After BatchNorm₃",
        detail: "Three layers deep and STILL healthy. BN + Residual = unbreakable",
    },
    act3: {
        values: [0.36, -0.61, 0.82, -0.84, 0.14, -0.45, 0.85, -0.69],
        label: "After tanh₃ — this is f₃(x)",
        detail: "Final correction. Every neuron active because BN kept inputs in tanh's sweet spot",
    },
    res3: {
        values: [1.63, -2.30, 3.44, -1.43, -0.58, -0.30, 0.18, -0.14],
        label: "y₃ = y₂ + f₃(y₂) — final residual",
        detail: "Three corrections stacked. y₃ = x₀ + f₁ + f₂ + f₃. Original signal never lost!",
    },
    output: {
        values: [0.38, 0.14, 0.11, 0.08, 0.06],
        label: "Softmax probabilities",
        detail: "Clean predictions: BN kept activations healthy, residuals preserved information",
    },
};

const TOP_PREDS = [
    { char: "l", prob: 0.38 },
    { char: "p", prob: 0.14 },
    { char: "o", prob: 0.11 },
    { char: "i", prob: 0.08 },
    { char: "e", prob: 0.06 },
];

// Network diagram layout — 5 visual columns + skip arcs
const NET_COLS = [
    { label: "Input", n: 3, x: 60 },
    { label: "12d", n: 1, x: 155 },
    { label: "Block 1", n: 8, x: 290 },
    { label: "Block 2", n: 8, x: 430 },
    { label: "Block 3", n: 8, x: 570 },
    { label: "Output", n: 5, x: 700 },
];
const NET_W = 760, NET_H = 260;
const NET_CHARS = ["h", "e", "l"];
const NET_OUTS = ["P(l)", "P(p)", "P(o)", "…", "P(z)"];

function netY(idx: number, total: number): number {
    if (total === 1) return NET_H / 2;
    const m = 35;
    return m + idx * ((NET_H - 2 * m) / (total - 1));
}

// Map step to which visual column is active
function colState(ci: number, s: number): "off" | "active" | "done" {
    // Steps: 0=input, 1=concat, 2-5=block1, 6-9=block2, 10-13=block3, 14=output
    const ranges: [number, number][] = [[0, 0], [1, 1], [2, 5], [6, 9], [10, 13], [14, 14]];
    const [lo, hi] = ranges[ci];
    if (s < lo) return "off";
    if (s > hi) return "done";
    return "active";
}

function blockSubState(ci: number, s: number): "linear" | "bn" | "act" | "res" | "none" {
    if (ci < 2 || ci > 4) return "none";
    const blockStart = [2, 6, 10][ci - 2];
    const local = s - blockStart;
    if (local === 0) return "linear";
    if (local === 1) return "bn";
    if (local === 2) return "act";
    if (local === 3) return "res";
    return "none";
}

function blockColor(ci: number, s: number): string {
    const sub = blockSubState(ci, s);
    if (sub === "bn") return "#a78bfa";
    if (sub === "act") return "#34d399";
    if (sub === "res") return "#06b6d4";
    if (ci >= 2 && ci <= 4) return "#60a5fa";
    if (ci === 5) return "#f43f5e";
    return "#f59e0b";
}

export function ResidualBNArchitectureVisualizer() {
    const [step, setStep] = useState(0);

    const advance = useCallback(() => setStep(prev => Math.min(prev + 1, STEPS.length - 1)), []);
    const reset = useCallback(() => setStep(0), []);

    const currentData = STAGE_DATA[STEPS[step].id];
    const isBN = STEPS[step].id.startsWith("bn");
    const isRes = STEPS[step].id.startsWith("res");
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

            {/* Network architecture diagram with skip connections */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-x-auto">
                <svg viewBox={`0 0 ${NET_W} ${NET_H}`} className="w-full" style={{ minHeight: 160 }}>
                    {/* Column headers */}
                    {NET_COLS.map((col, ci) => {
                        const st = colState(ci, step);
                        const c = blockColor(ci, step);
                        return (
                            <text key={`h-${ci}`} x={col.x} y={16} textAnchor="middle"
                                fill={st === "off" ? "white" : c}
                                fillOpacity={st === "active" ? 0.7 : st === "done" ? 0.35 : 0.12}
                                fontSize={8} fontFamily="monospace" fontWeight="bold">
                                {col.label}
                            </text>
                        );
                    })}

                    {/* Skip connection arcs (residual) */}
                    {[2, 3, 4].map(ci => {
                        const col = NET_COLS[ci];
                        const blockStart = [2, 6, 10][ci - 2];
                        const resStep = blockStart + 3;
                        const isResActive = step >= resStep;
                        const isResCurrent = step === resStep;
                        // Arc from left side of block back to right side (self-loop representing skip)
                        const arcY1 = netY(0, 8) - 8;
                        return (
                            <g key={`skip-${ci}`}>
                                <motion.path
                                    d={`M ${col.x - 30} ${arcY1} C ${col.x - 30} ${arcY1 - 20}, ${col.x + 30} ${arcY1 - 20}, ${col.x + 30} ${arcY1}`}
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth={isResCurrent ? 2.5 : 1.5}
                                    strokeDasharray={isResActive ? "none" : "4 3"}
                                    animate={{
                                        strokeOpacity: isResCurrent ? 0.6 : isResActive ? 0.2 : 0.05,
                                    }}
                                    transition={{ duration: 0.3 }}
                                />
                                {/* Arrow head */}
                                <motion.polygon
                                    points={`${col.x + 30},${arcY1} ${col.x + 25},${arcY1 - 5} ${col.x + 25},${arcY1 + 5}`}
                                    fill="#06b6d4"
                                    animate={{ fillOpacity: isResCurrent ? 0.6 : isResActive ? 0.15 : 0.03 }}
                                />
                                {/* "skip" label */}
                                <text x={col.x} y={arcY1 - 16} textAnchor="middle"
                                    fill="#06b6d4"
                                    fillOpacity={isResCurrent ? 0.7 : isResActive ? 0.2 : 0.06}
                                    fontSize={6} fontFamily="monospace" fontWeight="bold">
                                    x + f(x)
                                </text>
                            </g>
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
                                            stroke={active ? blockColor(ci, step) : "white"}
                                            strokeOpacity={active ? 0.05 : 0.015}
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
                        const c = blockColor(ci, step);
                        const isBlock = ci >= 2 && ci <= 4;
                        const sub = blockSubState(ci, step);
                        const isBNNow = sub === "bn";
                        const isResNow = sub === "res";
                        return Array.from({ length: col.n }).map((_, ni) => (
                            <g key={`n-${ci}-${ni}`}>
                                <motion.circle
                                    cx={col.x} cy={netY(ni, col.n)} r={7}
                                    fill={c}
                                    animate={{
                                        fillOpacity: st === "active" ? 0.22 : st === "done" ? 0.07 : 0.02,
                                        strokeOpacity: st === "active" ? 0.5 : st === "done" ? 0.15 : 0.05,
                                    }}
                                    stroke={isBNNow ? "#a78bfa" : isResNow ? "#06b6d4" : c}
                                    strokeWidth={isBNNow || isResNow ? 2.5 : st === "active" ? 1.5 : 1}
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
                                {ci === 1 && (
                                    <text x={col.x} y={netY(ni, col.n) + 3} textAnchor="middle"
                                        fill="#f59e0b" fillOpacity={st !== "off" ? 0.5 : 0.1}
                                        fontSize={6} fontFamily="monospace" fontWeight="bold">
                                        12d
                                    </text>
                                )}
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

                    {/* State badges under active blocks */}
                    {[2, 3, 4].map(ci => {
                        const sub = blockSubState(ci, step);
                        const col = NET_COLS[ci];
                        const badges: Record<string, { color: string; text: string }> = {
                            linear: { color: "#60a5fa", text: "Linear" },
                            bn: { color: "#a78bfa", text: "BN" },
                            act: { color: "#34d399", text: "tanh" },
                            res: { color: "#06b6d4", text: "x+f(x)" },
                        };
                        const badge = badges[sub];
                        if (!badge) return null;
                        return (
                            <g key={`badge-${ci}`}>
                                <rect x={col.x - 18} y={NET_H - 20} width={36} height={14} rx={3}
                                    fill={badge.color} fillOpacity={0.15} stroke={badge.color} strokeOpacity={0.3} />
                                <text x={col.x} y={NET_H - 10} textAnchor="middle"
                                    fill={badge.color} fillOpacity={0.7} fontSize={7} fontFamily="monospace" fontWeight="bold">
                                    {badge.text}
                                </text>
                            </g>
                        );
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
                    <div className="flex items-center justify-between flex-wrap gap-2">
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
                        {isRes && (
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/25 text-cyan-400">
                                RESIDUAL ADD
                            </span>
                        )}
                    </div>

                    {/* Values grid */}
                    <div className="flex gap-1.5 flex-wrap justify-center">
                        {(isOutput ? TOP_PREDS.map(p => p.prob) : currentData.values).map((v, i) => {
                            const absV = Math.abs(v);
                            const isDangerous = absV > 3;
                            const isHealthy = absV < 1.5;
                            let borderCol = STEPS[step].color + "30";
                            let bgCol = STEPS[step].color + "12";

                            if (STEPS[step].id.startsWith("linear")) {
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

                    {/* BN stats */}
                    {isBN && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center justify-center gap-4 text-[8px] font-mono"
                        >
                            <span className="text-violet-400/60">μ = {(currentData.values.reduce((a, b) => a + b, 0) / currentData.values.length).toFixed(3)}</span>
                            <span className="text-violet-400/60">σ = {Math.sqrt(currentData.values.reduce((a, b) => a + b * b, 0) / currentData.values.length - Math.pow(currentData.values.reduce((a, b) => a + b, 0) / currentData.values.length, 2)).toFixed(3)}</span>
                        </motion.div>
                    )}

                    {/* Residual insight */}
                    {isRes && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] p-2.5 text-center"
                        >
                            <p className="text-[8px] font-mono text-cyan-400/60">
                                The original signal is never lost — each layer only adds a small correction.
                                <br />
                                <span className="text-cyan-400/80 font-bold">y = x + f(x)</span> means even a terrible f(x) can&apos;t destroy x.
                            </p>
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
                        className="px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
                    >
                        <span className="flex items-center gap-1.5"><RotateCcw className="w-3 h-3" /> Replay</span>
                    </button>
                )}
            </div>
        </div>
    );
}
