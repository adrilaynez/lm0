"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

/* ── data points ────────────────────────────────────────────── */

interface Point {
    x: number;
    y: number;
    label: 0 | 1;
}

// Simple linearly separable data
const LINEAR_DATA: Point[] = [
    { x: 0.2, y: 0.8, label: 1 }, { x: 0.3, y: 0.9, label: 1 },
    { x: 0.1, y: 0.7, label: 1 }, { x: 0.4, y: 0.7, label: 1 },
    { x: 0.2, y: 0.6, label: 1 }, { x: 0.35, y: 0.85, label: 1 },
    { x: 0.15, y: 0.75, label: 1 }, { x: 0.25, y: 0.95, label: 1 },
    { x: 0.6, y: 0.2, label: 0 }, { x: 0.7, y: 0.3, label: 0 },
    { x: 0.8, y: 0.1, label: 0 }, { x: 0.9, y: 0.4, label: 0 },
    { x: 0.75, y: 0.25, label: 0 }, { x: 0.85, y: 0.15, label: 0 },
    { x: 0.65, y: 0.35, label: 0 }, { x: 0.7, y: 0.1, label: 0 },
];

// XOR-like data (not linearly separable)
const XOR_DATA: Point[] = [
    { x: 0.15, y: 0.15, label: 0 }, { x: 0.25, y: 0.2, label: 0 },
    { x: 0.2, y: 0.3, label: 0 }, { x: 0.1, y: 0.25, label: 0 },
    { x: 0.85, y: 0.85, label: 0 }, { x: 0.75, y: 0.8, label: 0 },
    { x: 0.8, y: 0.7, label: 0 }, { x: 0.9, y: 0.75, label: 0 },
    { x: 0.15, y: 0.85, label: 1 }, { x: 0.25, y: 0.8, label: 1 },
    { x: 0.2, y: 0.7, label: 1 }, { x: 0.1, y: 0.75, label: 1 },
    { x: 0.85, y: 0.15, label: 1 }, { x: 0.75, y: 0.2, label: 1 },
    { x: 0.8, y: 0.3, label: 1 }, { x: 0.9, y: 0.25, label: 1 },
];

/* ── SVG helpers ────────────────────────────────────────────── */

const SVG_SIZE = 300;
const PAD = 30;
const PLOT = SVG_SIZE - 2 * PAD;

function toSvg(v: number) {
    return PAD + v * PLOT;
}
function toSvgY(v: number) {
    return PAD + (1 - v) * PLOT;
}

/* ── component ──────────────────────────────────────────────── */

type Scenario = "linear" | "xor";

export function DecisionBoundaryIntro() {
    const { t } = useI18n();
    const [scenario, setScenario] = useState<Scenario>("linear");

    // The "neuron's line" parameters: w1*x + w2*y + b = 0
    // For linear: a nice diagonal. For xor: user can try to move it.
    const [w1, setW1] = useState(1.0);
    const [w2, setW2] = useState(1.0);
    const [bias, setBias] = useState(-0.9);

    const data = scenario === "linear" ? LINEAR_DATA : XOR_DATA;

    // Compute decision boundary line endpoints (w1*x + w2*y + b = 0 → y = (-w1*x - b) / w2)
    const linePoints = useMemo(() => {
        if (Math.abs(w2) < 0.001) return null;
        const x0 = 0, x1val = 1;
        const y0 = (-w1 * x0 - bias) / w2;
        const y1val = (-w1 * x1val - bias) / w2;
        return {
            x1: toSvg(x0), y1: toSvgY(y0),
            x2: toSvg(x1val), y2: toSvgY(y1val),
        };
    }, [w1, w2, bias]);

    // Classify each point
    const classifications = useMemo(() => {
        return data.map((p) => {
            const z = w1 * p.x + w2 * p.y + bias;
            const predicted = z > 0 ? 1 : 0;
            return predicted === p.label;
        });
    }, [data, w1, w2, bias]);

    const accuracy = useMemo(() => {
        const correct = classifications.filter(Boolean).length;
        return Math.round((correct / classifications.length) * 100);
    }, [classifications]);

    const handleScenarioChange = useCallback((s: Scenario) => {
        setScenario(s);
        if (s === "linear") {
            setW1(1.0); setW2(1.0); setBias(-0.9);
        } else {
            setW1(1.0); setW2(1.0); setBias(-0.9);
        }
    }, []);

    // Background classification regions
    const regionPath = useMemo(() => {
        const res = 20;
        const rects: { x: number; y: number; cls: number }[] = [];
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                const px = (i + 0.5) / res;
                const py = (j + 0.5) / res;
                const z = w1 * px + w2 * py + bias;
                rects.push({ x: px, y: py, cls: z > 0 ? 1 : 0 });
            }
        }
        return rects;
    }, [w1, w2, bias]);

    return (
        <div className="rounded-2xl border border-emerald-500/[0.1] bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.03),transparent)] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-emerald-500/[0.08] bg-emerald-500/[0.02]">
                <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                    {t("neuralNetworkNarrative.decisionBoundary.title")}
                </span>
            </div>

            <div className="p-4 sm:p-6">
                {/* Scenario toggle */}
                <div className="flex gap-2 mb-5">
                    <button
                        onClick={() => handleScenarioChange("linear")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${scenario === "linear"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                            }`}
                    >
                        {t("neuralNetworkNarrative.decisionBoundary.simpleBtn")}
                    </button>
                    <button
                        onClick={() => handleScenarioChange("xor")}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all ${scenario === "xor"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                            }`}
                    >
                        {t("neuralNetworkNarrative.decisionBoundary.complexBtn")}
                    </button>
                </div>

                {/* SVG Plot */}
                <div className="flex flex-col md:flex-row gap-5">
                    <div className="flex-1 rounded-xl bg-black/30 border border-white/[0.05] overflow-hidden">
                        <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full block">
                            {/* Background classification regions */}
                            {regionPath.map((r, i) => {
                                const size = PLOT / 20;
                                return (
                                    <rect
                                        key={i}
                                        x={toSvg(r.x) - size / 2}
                                        y={toSvgY(r.y) - size / 2}
                                        width={size}
                                        height={size}
                                        fill={r.cls === 1 ? "rgba(129,140,248,0.06)" : "rgba(251,113,133,0.06)"}
                                    />
                                );
                            })}

                            {/* Grid */}
                            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                                <g key={v}>
                                    <line x1={toSvg(v)} y1={PAD} x2={toSvg(v)} y2={SVG_SIZE - PAD}
                                        stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                                    <line x1={PAD} y1={toSvgY(v)} x2={SVG_SIZE - PAD} y2={toSvgY(v)}
                                        stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                                </g>
                            ))}

                            {/* Decision boundary line */}
                            {linePoints && (
                                <motion.line
                                    x1={linePoints.x1} y1={linePoints.y1}
                                    x2={linePoints.x2} y2={linePoints.y2}
                                    stroke="rgba(255,255,255,0.5)"
                                    strokeWidth="2"
                                    strokeDasharray="6 4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}

                            {/* Data points */}
                            {data.map((p, i) => {
                                const correct = classifications[i];
                                const isClassA = p.label === 1;
                                return (
                                    <motion.g key={`${scenario}-${i}`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.02, type: "spring", stiffness: 300 }}
                                    >
                                        {/* Error ring */}
                                        {!correct && (
                                            <circle
                                                cx={toSvg(p.x)} cy={toSvgY(p.y)} r="9"
                                                fill="none" stroke="rgba(239,68,68,0.6)" strokeWidth="2"
                                            />
                                        )}
                                        <circle
                                            cx={toSvg(p.x)} cy={toSvgY(p.y)} r="5"
                                            fill={isClassA ? "rgb(129,140,248)" : "rgb(251,113,133)"}
                                            stroke="rgba(0,0,0,0.3)" strokeWidth="1.5"
                                        />
                                    </motion.g>
                                );
                            })}

                            {/* Legend */}
                            <circle cx={PAD + 5} cy={SVG_SIZE - 10} r="4" fill="rgb(129,140,248)" />
                            <text x={PAD + 14} y={SVG_SIZE - 7} fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="ui-monospace, monospace">
                                {t("neuralNetworkNarrative.decisionBoundary.classA")}
                            </text>
                            <circle cx={PAD + 75} cy={SVG_SIZE - 10} r="4" fill="rgb(251,113,133)" />
                            <text x={PAD + 84} y={SVG_SIZE - 7} fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="ui-monospace, monospace">
                                {t("neuralNetworkNarrative.decisionBoundary.classB")}
                            </text>
                        </svg>
                    </div>

                    {/* Controls panel */}
                    <div className="w-full md:w-56 space-y-3">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-mono text-white/40">w₁</span>
                                <span className="text-[11px] font-mono font-bold text-white/60">{w1.toFixed(2)}</span>
                            </div>
                            <input type="range" min={-2} max={2} step={0.1} value={w1}
                                onChange={(e) => setW1(+e.target.value)}
                                className="w-full cursor-pointer" style={{ accentColor: '#fb7185' }} />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-mono text-white/40">w₂</span>
                                <span className="text-[11px] font-mono font-bold text-white/60">{w2.toFixed(2)}</span>
                            </div>
                            <input type="range" min={-2} max={2} step={0.1} value={w2}
                                onChange={(e) => setW2(+e.target.value)}
                                className="w-full cursor-pointer" style={{ accentColor: '#fb7185' }} />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-mono text-white/40">{t("neuralNetworkNarrative.decisionBoundary.biasLabel")}</span>
                                <span className="text-[11px] font-mono font-bold text-white/60">{bias.toFixed(2)}</span>
                            </div>
                            <input type="range" min={-2} max={2} step={0.1} value={bias}
                                onChange={(e) => setBias(+e.target.value)}
                                className="w-full cursor-pointer" style={{ accentColor: '#a78bfa' }} />
                        </div>

                        {/* Accuracy indicator */}
                        <div className={`rounded-lg border p-3 text-center ${accuracy === 100
                            ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                            : accuracy >= 75
                                ? "border-amber-500/30 bg-amber-500/[0.06]"
                                : "border-rose-500/30 bg-rose-500/[0.06]"
                            }`}>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-white/30 block mb-1">
                                {t("neuralNetworkNarrative.decisionBoundary.accuracyLabel")}
                            </span>
                            <span className={`text-2xl font-mono font-bold ${accuracy === 100 ? "text-emerald-400" : accuracy >= 75 ? "text-amber-400" : "text-rose-400"
                                }`}>
                                {accuracy}%
                            </span>
                        </div>

                        {/* Scenario-specific insight */}
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={`${scenario}-${accuracy}`}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="text-[11px] text-white/35 italic leading-relaxed"
                            >
                                {scenario === "linear" && accuracy === 100
                                    ? t("neuralNetworkNarrative.decisionBoundary.insightLinearPerfect")
                                    : scenario === "linear"
                                        ? t("neuralNetworkNarrative.decisionBoundary.insightLinearTry")
                                        : t("neuralNetworkNarrative.decisionBoundary.insightXor")
                                }
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
