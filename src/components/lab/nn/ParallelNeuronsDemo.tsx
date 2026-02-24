"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";

/* ── types ─────────────────────────────────────────────────── */

interface NeuronConfig {
    w1: number;
    w2: number;
    bias: number;
    color: string;
    label: string;
}

/* ── helpers ────────────────────────────────────────────────── */

function relu(x: number) {
    return Math.max(0, x);
}

function computePreActivation(x1: number, x2: number, n: NeuronConfig) {
    return n.w1 * x1 + n.w2 * x2 + n.bias;
}

function computeOutput(preActivation: number, reluEnabled: boolean) {
    return reluEnabled ? relu(preActivation) : preActivation;
}

const NEURON_PRESETS: NeuronConfig[] = [
    { w1: 1.2, w2: 0.3, bias: -0.5, color: "rose", label: "A" },
    { w1: -0.4, w2: 1.5, bias: 0.2, color: "indigo", label: "B" },
    { w1: 0.8, w2: -0.7, bias: 0.1, color: "emerald", label: "C" },
];

const COLOR_MAP: Record<string, { stroke: string; bg: string; border: string; text: string; fill: string }> = {
    rose: { stroke: "rgb(251,113,133)", bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", fill: "rgba(251,113,133,0.15)" },
    indigo: { stroke: "rgb(129,140,248)", bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", fill: "rgba(129,140,248,0.15)" },
    emerald: { stroke: "rgb(52,211,153)", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", fill: "rgba(52,211,153,0.15)" },
};

const FONT = "ui-monospace, SFMono-Regular, Menlo, monospace";

/* ── SVG layout ─────────────────────────────────────────────── */

const SVG_W = 600;
const SVG_H = 260;

// Input positions
const IN_X = 55;
const IN_Y1 = 80;
const IN_Y2 = 180;

// Neuron positions (spread vertically based on count)
function neuronPositions(count: number): { x: number; y: number }[] {
    const nx = 300;
    if (count === 1) return [{ x: nx, y: 130 }];
    if (count === 2) return [{ x: nx, y: 90 }, { x: nx, y: 170 }];
    return [{ x: nx, y: 60 }, { x: nx, y: 130 }, { x: nx, y: 200 }];
}

// Output positions
function outputPositions(count: number): { x: number; y: number }[] {
    const ox = 500;
    if (count === 1) return [{ x: ox, y: 130 }];
    if (count === 2) return [{ x: ox, y: 90 }, { x: ox, y: 170 }];
    return [{ x: ox, y: 60 }, { x: ox, y: 130 }, { x: ox, y: 200 }];
}

/* ── component ──────────────────────────────────────────────── */

export function ParallelNeuronsDemo() {
    const { t } = useI18n();
    const [neuronCount, setNeuronCount] = useState(1);
    const [x1, setX1] = useState(0.8);
    const [x2, setX2] = useState(0.6);
    const [reluEnabled, setReluEnabled] = useState(true);

    const activeNeurons = useMemo(
        () => NEURON_PRESETS.slice(0, neuronCount),
        [neuronCount],
    );

    const preActivations = useMemo(
        () => activeNeurons.map((n) => computePreActivation(x1, x2, n)),
        [activeNeurons, x1, x2],
    );

    const outputs = useMemo(
        () => preActivations.map((z) => computeOutput(z, reluEnabled)),
        [preActivations, reluEnabled],
    );

    const inactiveNeuronLabels = useMemo(() => {
        if (!reluEnabled) return [];
        return activeNeurons
            .map((n, i) => {
                const z = preActivations[i];
                const out = outputs[i];
                const clipped = out === 0 && z <= 0;
                return clipped ? n.label : null;
            })
            .filter((v): v is string => v !== null);
    }, [activeNeurons, preActivations, outputs, reluEnabled]);

    const nPos = neuronPositions(neuronCount);
    const oPos = outputPositions(neuronCount);

    const handleAdd = useCallback(() => setNeuronCount((c) => Math.min(3, c + 1)), []);
    const handleRemove = useCallback(() => setNeuronCount((c) => Math.max(1, c - 1)), []);

    return (
        <div className="rounded-2xl border border-emerald-500/[0.1] bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.03),transparent)] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-emerald-500/[0.08] bg-emerald-500/[0.02]">
                <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                    {t("neuralNetworkNarrative.parallelNeurons.title")}
                </span>
            </div>

            <div className="p-4 sm:p-6">
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4 mb-5">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">
                            {t("neuralNetworkNarrative.parallelNeurons.neuronCount").replace("{n}", String(neuronCount))}
                        </span>
                        <button
                            onClick={handleRemove}
                            disabled={neuronCount <= 1}
                            className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center"
                        >
                            −
                        </button>
                        <span className="w-5 text-center font-mono text-sm font-bold text-white/80">
                            {neuronCount}
                        </span>
                        <button
                            onClick={handleAdd}
                            disabled={neuronCount >= 3}
                            className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center"
                        >
                            +
                        </button>
                    </div>

                    <button
                        onClick={() => setReluEnabled((v) => !v)}
                        className={
                            reluEnabled
                                ? "px-3 py-1.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 transition-colors"
                                : "px-3 py-1.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.03] border border-white/[0.07] text-white/35 hover:text-white/55 transition-colors"
                        }
                    >
                        {t("neuralNetworkNarrative.parallelNeurons.reluToggle")}: {" "}
                        {reluEnabled
                            ? t("neuralNetworkNarrative.parallelNeurons.reluOn")
                            : t("neuralNetworkNarrative.parallelNeurons.reluOff")}
                    </button>
                </div>

                {/* SVG Diagram */}
                <div className="rounded-xl bg-black/30 border border-white/[0.05] overflow-hidden mb-4">
                    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full block">
                        {/* Input nodes */}
                        <g>
                            <circle cx={IN_X} cy={IN_Y1} r="24" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                            <text x={IN_X} y={IN_Y1 - 6} textAnchor="middle" fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.3)">x₁</text>
                            <text x={IN_X} y={IN_Y1 + 10} textAnchor="middle" fontSize="13" fontFamily={FONT} fill="rgba(255,255,255,0.7)" fontWeight="700">{x1.toFixed(1)}</text>
                        </g>
                        <g>
                            <circle cx={IN_X} cy={IN_Y2} r="24" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                            <text x={IN_X} y={IN_Y2 - 6} textAnchor="middle" fontSize="9" fontFamily={FONT} fill="rgba(255,255,255,0.3)">x₂</text>
                            <text x={IN_X} y={IN_Y2 + 10} textAnchor="middle" fontSize="13" fontFamily={FONT} fill="rgba(255,255,255,0.7)" fontWeight="700">{x2.toFixed(1)}</text>
                        </g>

                        {/* Neurons + connections */}
                        <AnimatePresence>
                            {activeNeurons.map((neuron, i) => {
                                const c = COLOR_MAP[neuron.color];
                                const pos = nPos[i];
                                const oP = oPos[i];
                                const out = outputs[i];
                                const z = preActivations[i];
                                const clipped = reluEnabled && out === 0 && z <= 0;

                                const nodeOpacity = clipped ? 0.35 : 0.8;
                                const textOpacity = clipped ? 0.35 : 0.7;

                                return (
                                    <motion.g
                                        key={neuron.label}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.4, type: "spring" }}
                                    >
                                        {/* Connections from inputs to neuron */}
                                        <line x1={IN_X + 24} y1={IN_Y1} x2={pos.x - 28} y2={pos.y}
                                            stroke={c.stroke} strokeWidth="1.2" opacity="0.3" />
                                        <line x1={IN_X + 24} y1={IN_Y2} x2={pos.x - 28} y2={pos.y}
                                            stroke={c.stroke} strokeWidth="1.2" opacity="0.3" />

                                        {/* Weight labels on connections */}
                                        <text
                                            x={(IN_X + 24 + pos.x - 28) / 2}
                                            y={(IN_Y1 + pos.y) / 2 - 6}
                                            textAnchor="middle" fontSize="8" fontFamily={FONT}
                                            fill={c.stroke} opacity="0.7"
                                        >
                                            w₁={neuron.w1.toFixed(1)}
                                        </text>
                                        <text
                                            x={(IN_X + 24 + pos.x - 28) / 2}
                                            y={(IN_Y2 + pos.y) / 2 + 10}
                                            textAnchor="middle" fontSize="8" fontFamily={FONT}
                                            fill={c.stroke} opacity="0.7"
                                        >
                                            w₂={neuron.w2.toFixed(1)}
                                        </text>

                                        {/* Neuron circle */}
                                        <circle cx={pos.x} cy={pos.y} r="28" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" opacity={nodeOpacity} />
                                        <text x={pos.x} y={pos.y - 8} textAnchor="middle" fontSize="9" fontFamily={FONT} fill={c.stroke} opacity={textOpacity}>
                                            Neuron {neuron.label}
                                        </text>
                                        <text x={pos.x} y={pos.y + 8} textAnchor="middle" fontSize="12" fontFamily={FONT} fill={c.stroke} fontWeight="700" opacity={clipped ? 0.45 : 1}>
                                            {out.toFixed(2)}
                                        </text>

                                        {/* Connection from neuron to output */}
                                        <line x1={pos.x + 28} y1={pos.y} x2={oP.x - 24} y2={oP.y}
                                            stroke={c.stroke} strokeWidth="1.2" opacity="0.3" />
                                        <polygon
                                            points={`${oP.x - 24},${oP.y} ${oP.x - 32},${oP.y - 5} ${oP.x - 32},${oP.y + 5}`}
                                            fill={c.stroke} opacity="0.3"
                                        />

                                        {/* Output circle */}
                                        <circle cx={oP.x} cy={oP.y} r="22" fill={c.fill} stroke={c.stroke} strokeWidth="1" opacity="0.6" />
                                        <text x={oP.x} y={oP.y - 5} textAnchor="middle" fontSize="8" fontFamily={FONT} fill="rgba(255,255,255,0.3)">
                                            y{neuron.label}
                                        </text>
                                        <text x={oP.x} y={oP.y + 10} textAnchor="middle" fontSize="12" fontFamily={FONT} fill={c.stroke} fontWeight="700">
                                            {out.toFixed(2)}
                                        </text>
                                    </motion.g>
                                );
                            })}
                        </AnimatePresence>

                        {/* "Same inputs" label */}
                        <text x={IN_X} y={IN_Y1 - 34} textAnchor="middle" fontSize="8" fontFamily={FONT} fill="rgba(255,255,255,0.2)">
                            {t("neuralNetworkNarrative.parallelNeurons.sameInputs")}
                        </text>

                        {/* "Multiple outputs" label */}
                        {neuronCount > 1 && (
                            <text x={oPos[0].x} y={oPos[0].y - 32} textAnchor="middle" fontSize="8" fontFamily={FONT} fill="rgba(255,255,255,0.2)">
                                {t("neuralNetworkNarrative.parallelNeurons.multipleOutputs")}
                            </text>
                        )}
                    </svg>
                </div>

                {/* Input sliders */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <label className="block">
                        <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-mono text-white/40">x₁</span>
                            <span className="text-[11px] font-mono font-bold text-white/60">{x1.toFixed(2)}</span>
                        </div>
                        <input type="range" min={-2} max={2} step={0.1} value={x1}
                            onChange={(e) => setX1(+e.target.value)}
                            className="w-full cursor-pointer accent-white" />
                    </label>
                    <label className="block">
                        <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-mono text-white/40">x₂</span>
                            <span className="text-[11px] font-mono font-bold text-white/60">{x2.toFixed(2)}</span>
                        </div>
                        <input type="range" min={-2} max={2} step={0.1} value={x2}
                            onChange={(e) => setX2(+e.target.value)}
                            className="w-full cursor-pointer accent-white" />
                    </label>
                </div>

                {/* Output bars */}
                <div className="space-y-2">
                    {activeNeurons.map((neuron, i) => {
                        const c = COLOR_MAP[neuron.color];
                        const out = outputs[i];
                        const z = preActivations[i];
                        const clipped = reluEnabled && out === 0 && z <= 0;
                        const pct = Math.min((out / 3) * 100, 100);
                        return (
                            <motion.div
                                key={neuron.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3"
                            >
                                <span className={`text-xs font-mono font-bold ${c.text} w-20 shrink-0`}>
                                    Neuron {neuron.label}
                                </span>
                                <div className="flex-1 h-5 bg-white/[0.03] rounded border border-white/[0.04] overflow-hidden">
                                    <motion.div
                                        className="h-full rounded"
                                        style={{ backgroundColor: c.stroke, opacity: 0.5 }}
                                        animate={{ width: `${Math.max(pct, 0)}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <span className={`text-sm font-mono font-bold ${c.text} w-14 text-right shrink-0 ${clipped ? "opacity-40" : ""}`}>
                                    {out.toFixed(2)}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {inactiveNeuronLabels.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3"
                        >
                            <p className="text-xs font-mono font-bold text-amber-300">
                                {t("neuralNetworkNarrative.parallelNeurons.inactiveTitle")}
                            </p>
                            <p className="text-[11px] text-white/45 mt-1">
                                {t("neuralNetworkNarrative.parallelNeurons.inactiveSummary").replace(
                                    "{neurons}",
                                    inactiveNeuronLabels.map((l) => `Neuron ${l}`).join(", "),
                                )}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Insight badge */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={neuronCount}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-white/[0.04] border-white/[0.08] text-white/50"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        {neuronCount === 1
                            ? t("neuralNetworkNarrative.parallelNeurons.insightOne")
                            : t("neuralNetworkNarrative.parallelNeurons.insightMultiple").replace("{n}", String(neuronCount))
                        }
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
