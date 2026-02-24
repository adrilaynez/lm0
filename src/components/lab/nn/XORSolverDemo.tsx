"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

/* ── XOR data points ──────────────────────────────────────── */

interface Point {
    x: number;
    y: number;
    label: 0 | 1; // 0 = class A (same corners), 1 = class B (opposite corners)
}

const XOR_POINTS: Point[] = [
    // Class A — same-side corners (bottom-left + top-right)
    { x: 0.15, y: 0.15, label: 0 }, { x: 0.25, y: 0.2, label: 0 },
    { x: 0.2, y: 0.3, label: 0 },  { x: 0.1, y: 0.25, label: 0 },
    { x: 0.85, y: 0.85, label: 0 }, { x: 0.75, y: 0.8, label: 0 },
    { x: 0.8, y: 0.7, label: 0 },  { x: 0.9, y: 0.75, label: 0 },
    // Class B — cross corners (top-left + bottom-right)
    { x: 0.15, y: 0.85, label: 1 }, { x: 0.25, y: 0.8, label: 1 },
    { x: 0.2, y: 0.7, label: 1 },  { x: 0.1, y: 0.75, label: 1 },
    { x: 0.85, y: 0.15, label: 1 }, { x: 0.75, y: 0.2, label: 1 },
    { x: 0.8, y: 0.3, label: 1 },  { x: 0.9, y: 0.25, label: 1 },
];

/* ── SVG layout ───────────────────────────────────────────── */

const SVG_SIZE = 300;
const PAD = 30;
const PLOT = SVG_SIZE - 2 * PAD;

function toX(v: number) { return PAD + v * PLOT; }
function toY(v: number) { return PAD + (1 - v) * PLOT; }

/* ── Network math ─────────────────────────────────────────── */

// 2-neuron hidden layer + 1 output, designed to solve XOR
// h1 = ReLU( x + y − 1.2)  → fires for top-right cluster
// h2 = ReLU(−x − y + 0.8)  → fires for bottom-left cluster
// out = h1 + h2 − 0.1       → positive for class A, negative for class B

function relu(x: number) { return Math.max(0, x); }

function classifyWithRelu(px: number, py: number): number {
    const h1 = relu(px + py - 1.2);
    const h2 = relu(-px - py + 0.8);
    return h1 + h2 - 0.1;
}

// Linear (no activation) — best single line for XOR is always ~50%
function classifyLinear(px: number, py: number): number {
    return px + py - 1.0;
}

/* ── Component ────────────────────────────────────────────── */

type Mode = "linear" | "relu";

export function XORSolverDemo() {
    const { t } = useI18n();
    const [mode, setMode] = useState<Mode>("linear");

    const classifyFn = mode === "relu" ? classifyWithRelu : classifyLinear;

    // Background classification regions
    const regions = useMemo(() => {
        const res = 24;
        const cells: { x: number; y: number; cls: number }[] = [];
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                const px = (i + 0.5) / res;
                const py = (j + 0.5) / res;
                const z = classifyFn(px, py);
                cells.push({ x: px, y: py, cls: z > 0 ? 0 : 1 });
            }
        }
        return cells;
    }, [classifyFn]);

    // Classify each data point
    const results = useMemo(() => {
        return XOR_POINTS.map((p) => {
            const z = classifyFn(p.x, p.y);
            const predicted = z > 0 ? 0 : 1;
            return predicted === p.label;
        });
    }, [classifyFn]);

    const accuracy = useMemo(() => {
        const correct = results.filter(Boolean).length;
        return Math.round((correct / results.length) * 100);
    }, [results]);

    return (
        <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => setMode("linear")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${mode === "linear"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                >
                    {t("neuralNetworkNarrative.xorSolver.linearBtn")}
                </button>
                <button
                    onClick={() => setMode("relu")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${mode === "relu"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                >
                    {t("neuralNetworkNarrative.xorSolver.reluBtn")}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-5">
                {/* SVG plot */}
                <div className="flex-1 rounded-xl bg-black/30 border border-white/[0.05] overflow-hidden">
                    <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full block">
                        {/* Background classification regions */}
                        <AnimatePresence mode="wait">
                            <motion.g
                                key={mode}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                {regions.map((r, i) => {
                                    const size = PLOT / 24;
                                    return (
                                        <rect
                                            key={i}
                                            x={toX(r.x) - size / 2}
                                            y={toY(r.y) - size / 2}
                                            width={size}
                                            height={size}
                                            fill={r.cls === 0
                                                ? "rgba(129,140,248,0.08)"
                                                : "rgba(251,113,133,0.08)"
                                            }
                                        />
                                    );
                                })}
                            </motion.g>
                        </AnimatePresence>

                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                            <g key={v}>
                                <line x1={toX(v)} y1={PAD} x2={toX(v)} y2={SVG_SIZE - PAD}
                                    stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                                <line x1={PAD} y1={toY(v)} x2={SVG_SIZE - PAD} y2={toY(v)}
                                    stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                            </g>
                        ))}

                        {/* Decision boundaries */}
                        <AnimatePresence mode="wait">
                            {mode === "linear" ? (
                                <motion.line
                                    key="linear-line"
                                    x1={toX(0)} y1={toY(1)}
                                    x2={toX(1)} y2={toY(0)}
                                    stroke="rgba(255,255,255,0.5)"
                                    strokeWidth="2"
                                    strokeDasharray="6 4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                            ) : (
                                <motion.g
                                    key="relu-lines"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* x + y = 1.2 boundary */}
                                    <line
                                        x1={toX(0.2)} y1={toY(1)}
                                        x2={toX(1)} y2={toY(0.2)}
                                        stroke="rgba(52,211,153,0.6)"
                                        strokeWidth="2"
                                        strokeDasharray="6 4"
                                    />
                                    {/* x + y = 0.8 boundary */}
                                    <line
                                        x1={toX(0)} y1={toY(0.8)}
                                        x2={toX(0.8)} y2={toY(0)}
                                        stroke="rgba(52,211,153,0.6)"
                                        strokeWidth="2"
                                        strokeDasharray="6 4"
                                    />
                                    {/* Labels for the two boundary lines */}
                                    <text x={toX(0.65)} y={toY(0.72)} fontSize="8" fill="rgba(52,211,153,0.5)" fontFamily="ui-monospace, monospace">
                                        h₁
                                    </text>
                                    <text x={toX(0.3)} y={toY(0.35)} fontSize="8" fill="rgba(52,211,153,0.5)" fontFamily="ui-monospace, monospace">
                                        h₂
                                    </text>
                                </motion.g>
                            )}
                        </AnimatePresence>

                        {/* Data points */}
                        {XOR_POINTS.map((p, i) => {
                            const correct = results[i];
                            const isA = p.label === 0;
                            return (
                                <motion.g
                                    key={`${mode}-${i}`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.02, type: "spring", stiffness: 300 }}
                                >
                                    {/* Error ring */}
                                    {!correct && (
                                        <circle
                                            cx={toX(p.x)} cy={toY(p.y)} r="9"
                                            fill="none" stroke="rgba(239,68,68,0.6)" strokeWidth="2"
                                        />
                                    )}
                                    <circle
                                        cx={toX(p.x)} cy={toY(p.y)} r="5"
                                        fill={isA ? "rgb(129,140,248)" : "rgb(251,113,133)"}
                                        stroke="rgba(0,0,0,0.3)" strokeWidth="1.5"
                                    />
                                </motion.g>
                            );
                        })}

                        {/* Legend */}
                        <circle cx={PAD + 5} cy={SVG_SIZE - 10} r="4" fill="rgb(129,140,248)" />
                        <text x={PAD + 14} y={SVG_SIZE - 7} fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="ui-monospace, monospace">
                            {t("neuralNetworkNarrative.xorSolver.classA")}
                        </text>
                        <circle cx={PAD + 75} cy={SVG_SIZE - 10} r="4" fill="rgb(251,113,133)" />
                        <text x={PAD + 84} y={SVG_SIZE - 7} fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="ui-monospace, monospace">
                            {t("neuralNetworkNarrative.xorSolver.classB")}
                        </text>
                    </svg>
                </div>

                {/* Info panel */}
                <div className="w-full md:w-56 space-y-3">
                    {/* Accuracy */}
                    <div className={`rounded-lg border p-3 text-center ${accuracy === 100
                        ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                        : "border-rose-500/30 bg-rose-500/[0.06]"
                        }`}>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/30 block mb-1">
                            {t("neuralNetworkNarrative.xorSolver.accuracy")}
                        </span>
                        <span className={`text-2xl font-mono font-bold ${accuracy === 100 ? "text-emerald-400" : "text-rose-400"
                            }`}>
                            {accuracy}%
                        </span>
                    </div>

                    {/* Network diagram mini */}
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2">
                            {t("neuralNetworkNarrative.xorSolver.networkLabel")}
                        </p>
                        <div className="flex items-center justify-center gap-3 text-[10px] font-mono">
                            <div className="text-center">
                                <div className="w-6 h-6 rounded-full border border-sky-400/30 bg-sky-400/10 flex items-center justify-center text-sky-400 text-[8px]">x</div>
                                <div className="w-6 h-6 rounded-full border border-sky-400/30 bg-sky-400/10 flex items-center justify-center text-sky-400 text-[8px] mt-1">y</div>
                            </div>
                            <div className="text-white/20">→</div>
                            <div className="text-center">
                                <div className="w-6 h-6 rounded-full border border-rose-400/30 bg-rose-400/10 flex items-center justify-center text-rose-400 text-[8px]">h₁</div>
                                <div className="w-6 h-6 rounded-full border border-rose-400/30 bg-rose-400/10 flex items-center justify-center text-rose-400 text-[8px] mt-1">h₂</div>
                            </div>
                            <div className="text-white/20">→</div>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[8px] ${mode === "relu"
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                                : "border-white/20 bg-white/5 text-white/40"
                                }`}>
                                out
                            </div>
                        </div>
                        {mode === "relu" && (
                            <p className="text-[9px] text-emerald-400/50 text-center mt-2 font-mono">
                                + ReLU
                            </p>
                        )}
                    </div>

                    {/* Insight text */}
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={mode}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-[11px] text-white/35 italic leading-relaxed"
                        >
                            {mode === "linear"
                                ? t("neuralNetworkNarrative.xorSolver.insightLinear")
                                : t("neuralNetworkNarrative.xorSolver.insightRelu")
                            }
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
