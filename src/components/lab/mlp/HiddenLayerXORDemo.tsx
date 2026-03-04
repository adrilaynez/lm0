"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Pre-computed data ─── */
const POINTS = [
    { x: 0, y: 0, label: "A", color: "#a78bfa" },
    { x: 0, y: 1, label: "B", color: "#34d399" },
    { x: 1, y: 0, label: "B", color: "#34d399" },
    { x: 1, y: 1, label: "A", color: "#a78bfa" },
] as const;

const SVG_PAD = 40;
const SVG_SIZE = 260;
const PLOT = SVG_SIZE - SVG_PAD * 2;

function toSvg(v: number) {
    return SVG_PAD + v * PLOT;
}

/* Linear boundary: a single straight line (rotates to show impossibility) */
function LinearBoundary({ angle }: { angle: number }) {
    const cx = SVG_SIZE / 2;
    const cy = SVG_SIZE / 2;
    const len = PLOT * 0.75;
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * len;
    const dy = Math.sin(rad) * len;
    return (
        <line
            x1={cx - dx} y1={cy - dy}
            x2={cx + dx} y2={cy + dy}
            stroke="#f87171" strokeWidth={2} strokeDasharray="6 4" opacity={0.8}
        />
    );
}

/* Non-linear boundary: curved region that perfectly separates XOR */
function NonLinearBoundary() {
    const c = (v: number) => toSvg(v);
    return (
        <g>
            <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.25 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                d={`M ${c(0.5)} ${c(-0.15)}
                    C ${c(-0.3)} ${c(0.3)}, ${c(-0.3)} ${c(0.7)}, ${c(0.5)} ${c(1.15)}
                    `}
                fill="none" stroke="#a78bfa" strokeWidth={2.5}
            />
            <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.25 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                d={`M ${c(0.5)} ${c(-0.15)}
                    C ${c(1.3)} ${c(0.3)}, ${c(1.3)} ${c(0.7)}, ${c(0.5)} ${c(1.15)}
                    `}
                fill="none" stroke="#34d399" strokeWidth={2.5}
            />
            {/* Shaded regions */}
            <motion.path
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.08 }}
                transition={{ duration: 0.8, delay: 1 }}
                d={`M ${c(0.5)} ${c(-0.15)}
                    C ${c(-0.3)} ${c(0.3)}, ${c(-0.3)} ${c(0.7)}, ${c(0.5)} ${c(1.15)}
                    C ${c(1.3)} ${c(0.7)}, ${c(1.3)} ${c(0.3)}, ${c(0.5)} ${c(-0.15)} Z`}
                fill="#34d399"
            />
        </g>
    );
}

export function HiddenLayerXORDemo() {
    const [mode, setMode] = useState<"linear" | "hidden">("linear");
    const [angle, setAngle] = useState(45);

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Mode toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => setMode("linear")}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
                        mode === "linear"
                            ? "bg-red-500/20 text-red-300 border border-red-500/40"
                            : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                    }`}
                >
                    Linear Only
                </button>
                <button
                    onClick={() => setMode("hidden")}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
                        mode === "hidden"
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                            : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                    }`}
                >
                    + Hidden Layer
                </button>
            </div>

            {/* Plot */}
            <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full max-w-[320px]">
                {/* Grid lines */}
                <line x1={SVG_PAD} y1={SVG_PAD} x2={SVG_PAD} y2={SVG_SIZE - SVG_PAD} stroke="white" strokeOpacity={0.08} />
                <line x1={SVG_PAD} y1={SVG_SIZE - SVG_PAD} x2={SVG_SIZE - SVG_PAD} y2={SVG_SIZE - SVG_PAD} stroke="white" strokeOpacity={0.08} />
                {/* Axis labels */}
                <text x={SVG_PAD - 8} y={SVG_SIZE - SVG_PAD + 16} fill="white" fillOpacity={0.3} fontSize={10} textAnchor="middle">0</text>
                <text x={SVG_SIZE - SVG_PAD} y={SVG_SIZE - SVG_PAD + 16} fill="white" fillOpacity={0.3} fontSize={10} textAnchor="middle">1</text>
                <text x={SVG_PAD - 12} y={SVG_PAD + 4} fill="white" fillOpacity={0.3} fontSize={10} textAnchor="end">1</text>

                {/* Boundary */}
                <AnimatePresence mode="wait">
                    {mode === "linear" ? (
                        <LinearBoundary key="lin" angle={angle} />
                    ) : (
                        <NonLinearBoundary key="nl" />
                    )}
                </AnimatePresence>

                {/* Data points */}
                {POINTS.map((p, i) => (
                    <g key={i}>
                        <motion.circle
                            cx={toSvg(p.x)} cy={toSvg(1 - p.y)}
                            r={14}
                            fill={p.color} fillOpacity={0.15}
                            stroke={p.color} strokeWidth={2}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                        />
                        <text
                            x={toSvg(p.x)} y={toSvg(1 - p.y) + 4}
                            fill={p.color} fontSize={12} fontWeight={700}
                            textAnchor="middle" className="font-mono select-none"
                        >
                            {p.label}
                        </text>
                    </g>
                ))}
            </svg>

            {/* Rotation slider for linear mode */}
            {mode === "linear" && (
                <div className="flex items-center gap-3 w-full max-w-[280px]">
                    <span className="text-[10px] font-mono text-white/40">Rotate line</span>
                    <input
                        type="range" min={0} max={180} value={angle}
                        onChange={e => setAngle(Number(e.target.value))}
                        className="flex-1 accent-red-400 h-1"
                    />
                </div>
            )}

            {/* Status message */}
            <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center text-xs font-mono px-4 py-2 rounded-lg border ${
                    mode === "linear"
                        ? "bg-red-500/10 border-red-500/20 text-red-300"
                        : "bg-violet-500/10 border-violet-500/20 text-violet-300"
                }`}
            >
                {mode === "linear"
                    ? "No straight line can separate A from B. Try rotating — it's impossible."
                    : "2 hidden neurons bend the space. A and B are perfectly separated."
                }
            </motion.div>
        </div>
    );
}
