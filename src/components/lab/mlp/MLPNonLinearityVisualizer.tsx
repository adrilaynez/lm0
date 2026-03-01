"use client";

import { useCallback,useMemo, useState } from "react";

/* ─────────────────────────────────────────────
   MLPNonLinearityVisualizer
   Demonstrates how stacking non-linear layers
   allows an MLP to model complex decision boundaries.
   ───────────────────────────────────────────── */

type ActivationFn = "relu" | "tanh";
type DepthMode = "linear" | "shallow" | "deep";

const GRID = 40;
const CANVAS = { w: 400, h: 320 };
const PAD = 32;

// Synthetic 2-class dataset (XOR-like)
const DATA_POINTS: { x: number; y: number; cls: 0 | 1 }[] = [
    // Cluster A — class 0
    { x: 0.15, y: 0.15, cls: 0 }, { x: 0.25, y: 0.20, cls: 0 },
    { x: 0.20, y: 0.30, cls: 0 }, { x: 0.10, y: 0.25, cls: 0 },
    { x: 0.30, y: 0.15, cls: 0 }, { x: 0.18, y: 0.10, cls: 0 },
    // Cluster B — class 0
    { x: 0.80, y: 0.80, cls: 0 }, { x: 0.85, y: 0.75, cls: 0 },
    { x: 0.75, y: 0.85, cls: 0 }, { x: 0.90, y: 0.90, cls: 0 },
    { x: 0.70, y: 0.78, cls: 0 }, { x: 0.82, y: 0.88, cls: 0 },
    // Cluster C — class 1
    { x: 0.80, y: 0.20, cls: 1 }, { x: 0.75, y: 0.15, cls: 1 },
    { x: 0.85, y: 0.25, cls: 1 }, { x: 0.90, y: 0.10, cls: 1 },
    { x: 0.78, y: 0.30, cls: 1 }, { x: 0.88, y: 0.18, cls: 1 },
    // Cluster D — class 1
    { x: 0.15, y: 0.80, cls: 1 }, { x: 0.20, y: 0.85, cls: 1 },
    { x: 0.25, y: 0.75, cls: 1 }, { x: 0.10, y: 0.90, cls: 1 },
    { x: 0.22, y: 0.88, cls: 1 }, { x: 0.30, y: 0.82, cls: 1 },
];

// Simple simulated decision boundary functions
function linearBoundary(_x: number, _y: number): number {
    return _x + _y - 1.0; // straight line
}

function relu(x: number) { return Math.max(0, x); }
function tanh(x: number) { return Math.tanh(x); }

function shallowBoundary(x: number, y: number, hiddenSize: number, activation: ActivationFn): number {
    const act = activation === "relu" ? relu : tanh;
    const scale = 6 / Math.max(hiddenSize, 1);
    let sum = 0;
    for (let i = 0; i < hiddenSize; i++) {
        const angle = (i / hiddenSize) * Math.PI * 2;
        const w1 = Math.cos(angle) * 4;
        const w2 = Math.sin(angle) * 4;
        const bias = -2 + (i / hiddenSize) * 4;
        sum += act(w1 * x + w2 * y + bias) * scale * (i % 2 === 0 ? 1 : -1);
    }
    // XOR-like: class 1 when x and y are on opposite sides
    const xor = (x - 0.5) * (y - 0.5);
    return sum * 0.3 + xor * -4;
}

function deepBoundary(x: number, y: number, hiddenSize: number, activation: ActivationFn): number {
    const act = activation === "relu" ? relu : tanh;
    // Layer 1
    const h1: number[] = [];
    for (let i = 0; i < hiddenSize; i++) {
        const angle = (i / hiddenSize) * Math.PI * 2;
        h1.push(act(Math.cos(angle) * 4 * x + Math.sin(angle) * 4 * y - 1.5 + i * 0.3));
    }
    // Layer 2
    const h2: number[] = [];
    for (let j = 0; j < hiddenSize; j++) {
        let s = 0;
        for (let i = 0; i < hiddenSize; i++) {
            s += h1[i] * Math.sin((i + j) * 1.2) * (2 / hiddenSize);
        }
        h2.push(act(s - 0.5));
    }
    // Output
    let out = 0;
    for (let j = 0; j < hiddenSize; j++) {
        out += h2[j] * (j % 2 === 0 ? 1 : -1) * (2 / hiddenSize);
    }
    // Bias toward XOR structure
    const xor = (x - 0.5) * (y - 0.5);
    return out + xor * -6;
}

function computeGrid(
    depth: DepthMode,
    hiddenSize: number,
    activation: ActivationFn,
): number[][] {
    const grid: number[][] = [];
    for (let r = 0; r < GRID; r++) {
        const row: number[] = [];
        for (let c = 0; c < GRID; c++) {
            const x = c / (GRID - 1);
            const y = r / (GRID - 1);
            let v: number;
            if (depth === "linear") {
                v = linearBoundary(x, y);
            } else if (depth === "shallow") {
                v = shallowBoundary(x, y, hiddenSize, activation);
            } else {
                v = deepBoundary(x, y, hiddenSize, activation);
            }
            row.push(v);
        }
        grid.push(row);
    }
    return grid;
}

function gridToColor(v: number): string {
    const t = 1 / (1 + Math.exp(-v * 2)); // sigmoid squash
    const r = Math.round(139 * (1 - t) + 52 * t);
    const g = Math.round(92 * (1 - t) + 211 * t);
    const b = Math.round(246 * (1 - t) + 153 * t);
    return `rgb(${r},${g},${b})`;
}

const DEPTH_OPTIONS: { value: DepthMode; label: string; desc: string }[] = [
    { value: "linear", label: "Linear", desc: "No hidden layers" },
    { value: "shallow", label: "1 Hidden Layer", desc: "Single non-linear layer" },
    { value: "deep", label: "2 Hidden Layers", desc: "Deeper composition" },
];

const POINT_RING: Record<0 | 1, string> = {
    0: "rgb(139,92,246)",
    1: "rgb(52,211,153)",
};

export function MLPNonLinearityVisualizer() {
    const [depth, setDepth] = useState<DepthMode>("linear");
    const [hiddenSize, setHiddenSize] = useState(6);
    const [activation, setActivation] = useState<ActivationFn>("relu");

    const grid = useMemo(() => computeGrid(depth, hiddenSize, activation), [depth, hiddenSize, activation]);

    const cellW = (CANVAS.w - PAD * 2) / GRID;
    const cellH = (CANVAS.h - PAD * 2) / GRID;

    const toX = useCallback((v: number) => PAD + v * (CANVAS.w - PAD * 2), []);
    const toY = useCallback((v: number) => PAD + v * (CANVAS.h - PAD * 2), []);

    // Count correct classifications
    const accuracy = useMemo(() => {
        let correct = 0;
        for (const p of DATA_POINTS) {
            const r = Math.min(GRID - 1, Math.floor(p.y * (GRID - 1)));
            const c = Math.min(GRID - 1, Math.floor(p.x * (GRID - 1)));
            const pred = grid[r][c] > 0 ? 1 : 0;
            if (pred === p.cls) correct++;
        }
        return (correct / DATA_POINTS.length * 100).toFixed(0);
    }, [grid]);

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-2">
                {DEPTH_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setDepth(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${depth === opt.value
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                                : "bg-white/[0.03] text-white/40 border border-white/[0.08] hover:border-white/20"
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {depth !== "linear" && (
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-white/30">Hidden Size</label>
                        <input
                            type="range"
                            min={2}
                            max={16}
                            value={hiddenSize}
                            onChange={(e) => setHiddenSize(Number(e.target.value))}
                            className="w-24 accent-violet-500"
                        />
                        <span className="text-xs font-mono text-violet-400 w-6 text-right">{hiddenSize}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-white/30">Activation</label>
                        {(["relu", "tanh"] as ActivationFn[]).map((fn) => (
                            <button
                                key={fn}
                                onClick={() => setActivation(fn)}
                                className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${activation === fn
                                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                                        : "bg-white/[0.03] text-white/40 border border-white/[0.08] hover:border-white/20"
                                    }`}
                            >
                                {fn === "relu" ? "ReLU" : "Tanh"}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* SVG Canvas */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
                <svg
                    viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
                    className="w-full"
                    style={{ maxHeight: 360 }}
                >
                    {/* Background grid */}
                    {grid.map((row, r) =>
                        row.map((v, c) => (
                            <rect
                                key={`${r}-${c}`}
                                x={PAD + c * cellW}
                                y={PAD + r * cellH}
                                width={cellW + 0.5}
                                height={cellH + 0.5}
                                fill={gridToColor(v)}
                                opacity={0.25}
                            />
                        ))
                    )}
                    {/* Data points */}
                    {DATA_POINTS.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={toX(p.x)}
                                cy={toY(p.y)}
                                r={6}
                                fill="rgba(0,0,0,0.55)"
                                stroke="rgba(255,255,255,0.65)"
                                strokeWidth={2}
                            />
                            <circle
                                cx={toX(p.x)}
                                cy={toY(p.y)}
                                r={4.25}
                                fill="rgba(0,0,0,0)"
                                stroke={POINT_RING[p.cls]}
                                strokeWidth={2}
                            />
                        </g>
                    ))}
                    {/* Axis labels */}
                    <text x={CANVAS.w / 2} y={CANVAS.h - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={9} fontFamily="monospace">x₁</text>
                    <text x={8} y={CANVAS.h / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={9} fontFamily="monospace" transform={`rotate(-90,8,${CANVAS.h / 2})`}>x₂</text>
                </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
                            <circle cx="7" cy="7" r="6" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.65)" strokeWidth="2" />
                            <circle cx="7" cy="7" r="4.2" fill="none" stroke={POINT_RING[0]} strokeWidth="2" />
                        </svg>
                        <span className="text-white/40 font-mono">Class 0</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
                            <circle cx="7" cy="7" r="6" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.65)" strokeWidth="2" />
                            <circle cx="7" cy="7" r="4.2" fill="none" stroke={POINT_RING[1]} strokeWidth="2" />
                        </svg>
                        <span className="text-white/40 font-mono">Class 1</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white/30 font-mono">Accuracy:</span>
                    <span className={`font-mono font-bold ${Number(accuracy) >= 90 ? "text-emerald-400" : Number(accuracy) >= 70 ? "text-amber-400" : "text-rose-400"}`}>
                        {accuracy}%
                    </span>
                </div>
            </div>

            <p className="text-[11px] text-white/25 leading-relaxed">
                {depth === "linear"
                    ? "A linear model can only draw a straight boundary — it fails on XOR-like data where classes are interleaved."
                    : depth === "shallow"
                        ? "A single hidden layer introduces non-linearity, allowing curved boundaries. Increase the hidden size to see more complex shapes."
                        : "Two hidden layers compose non-linearities, enabling the model to learn intricate region boundaries. Notice how deeper networks separate the XOR clusters more cleanly."}
            </p>
        </div>
    );
}
