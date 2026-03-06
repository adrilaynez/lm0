"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Award, TrendingDown } from "lucide-react";

/*
  NetworkShapeComparison — v2
  Uses REAL training results from /api/v1/mlp/network-shape.
  Data hardcoded to avoid backend dependency — same budget (~240K params),
  same hyperparams, three shapes: pyramid, cylinder, funnel.
*/

interface ShapeModel {
    id: string;
    label: string;
    icon: string;
    layers: number[];
    color: string;
    trainLoss: number;
    valLoss: number;
    params: number;
    trainTime: number;
    sample: string;
    insight: string;
    flowNote: string;
}

const SHAPES: ShapeModel[] = [
    {
        id: "pyramid",
        label: "Pyramid",
        icon: "🔺",
        layers: [512, 256, 128, 64],
        color: "#f59e0b",
        trainLoss: 1.554,
        valLoss: 1.793,
        params: 242716,
        trainTime: 1615,
        sample: "liven know himsents what hale ta voly the aclhame hettenorby",
        insight: "Starts wide (512) and narrows aggressively. The first layer captures rich representations, but each successive layer throws away information — the 64-neuron bottleneck at the end can't reconstruct everything layer 1 learned. Result: decent training, but overfits (gap = 0.24).",
        flowNote: "512 → 256 → 128 → 64: information narrows at each step",
    },
    {
        id: "cylinder",
        label: "Cylinder",
        icon: "🟩",
        layers: [256, 256, 256, 256],
        color: "#10b981",
        trainLoss: 1.594,
        valLoss: 1.708,
        params: 240092,
        trainTime: 1677,
        sample: "fellow the ray agst ofrent and with he them on the sammate",
        insight: "Uniform width at every layer — no bottleneck. Each layer has the same capacity, so information flows freely without compression. Best validation loss (1.71) and smallest overfit gap (0.11). The consistent width means each layer can build on the previous one without losing detail.",
        flowNote: "256 → 256 → 256 → 256: information flows freely",
    },
    {
        id: "funnel",
        label: "Funnel",
        icon: "⏳",
        layers: [128, 354, 354, 128],
        color: "#a855f7",
        trainLoss: 1.674,
        valLoss: 1.850,
        params: 239276,
        trainTime: 1764,
        sample: "ll a womureds. sollour owno ferthers quick comedter tell",
        insight: "Narrow → wide → narrow. The 128-neuron input creates an information bottleneck right at the start — the inner layers (354) have capacity to process, but they're starved of signal from the narrow entry point. Worst of the three despite similar parameter budget.",
        flowNote: "128 → 354 → 354 → 128: bottleneck at entry chokes information",
    },
];

const INPUT_DIM = 128; // 8 context × 16 emb
const OUTPUT_DIM = 28;

export function NetworkShapeComparison() {
    const [selected, setSelected] = useState("cylinder");
    const shape = SHAPES.find(s => s.id === selected)!;
    const allLayers = [INPUT_DIM, ...shape.layers, OUTPUT_DIM];
    const maxSize = Math.max(...allLayers);
    const bestVal = Math.min(...SHAPES.map(s => s.valLoss));
    const worstVal = Math.max(...SHAPES.map(s => s.valLoss));

    return (
        <div className="space-y-4">
            {/* Shape selector cards */}
            <div className="grid grid-cols-3 gap-2">
                {SHAPES.map(s => {
                    const isBest = s.valLoss === bestVal;
                    const isSelected = selected === s.id;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setSelected(s.id)}
                            className={`rounded-xl border p-3 text-left transition-all relative ${isSelected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                                }`}
                            style={{
                                borderColor: isSelected ? s.color + "60" : "rgba(255,255,255,0.06)",
                            }}
                        >
                            {isBest && (
                                <span className="absolute -top-1.5 -right-1.5 text-amber-400"><Award className="w-4 h-4" /></span>
                            )}
                            <div className="text-sm font-bold" style={{ color: s.color }}>
                                {s.icon} {s.label}
                            </div>
                            <div className="text-[10px] font-mono text-white/30 mt-1">
                                val = <span className="font-bold" style={{ color: s.valLoss === bestVal ? "#10b981" : s.valLoss === worstVal ? "#ef4444" : s.color }}>
                                    {s.valLoss.toFixed(3)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={selected}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                >
                    {/* Architecture SVG */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
                        <div className="text-[9px] font-mono text-white/25 mb-2">{shape.flowNote}</div>
                        <div className="flex items-end justify-center gap-1" style={{ minHeight: 100 }}>
                            {allLayers.map((size, i) => {
                                const isIO = i === 0 || i === allLayers.length - 1;
                                const barH = Math.max(16, (size / maxSize) * 80);
                                const color = isIO ? "#64748b" : shape.color;
                                const label = i === 0 ? "In" : i === allLayers.length - 1 ? "Out" : `H${i}`;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <motion.div
                                            className="rounded-md"
                                            style={{ width: 32, backgroundColor: color, opacity: isIO ? 0.4 : 0.7 }}
                                            initial={{ height: 0 }}
                                            animate={{ height: barH }}
                                            transition={{ delay: i * 0.08, duration: 0.4 }}
                                        />
                                        <span className="text-[7px] font-mono text-white/25">{label}</span>
                                        <span className="text-[8px] font-mono font-bold" style={{ color: isIO ? "#64748b" : color }}>{size}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Loss comparison bars (all 3 shapes) */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 space-y-2">
                        <div className="text-[9px] font-mono text-white/25">Validation Loss (lower = better)</div>
                        {SHAPES.map(s => {
                            const barW = ((s.valLoss - 1.6) / (worstVal - 1.6 + 0.1)) * 100;
                            const isCurrent = s.id === selected;
                            return (
                                <div key={s.id} className={`flex items-center gap-2 transition-opacity ${isCurrent ? "opacity-100" : "opacity-40"}`}>
                                    <span className="text-[8px] font-mono w-14 text-right" style={{ color: s.color }}>{s.label}</span>
                                    <div className="flex-1 h-4 rounded bg-white/[0.03] overflow-hidden relative">
                                        <motion.div
                                            className="h-full rounded"
                                            style={{ backgroundColor: s.color, opacity: 0.7 }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(8, barW)}%` }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono font-bold w-10 text-right" style={{ color: s.color }}>
                                        {s.valLoss.toFixed(3)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: "Params", value: (shape.params / 1000).toFixed(1) + "K" },
                            { label: "Train Loss", value: shape.trainLoss.toFixed(3) },
                            { label: "Val Loss", value: shape.valLoss.toFixed(3) },
                            { label: "Overfit Gap", value: "+" + (shape.valLoss - shape.trainLoss).toFixed(3) },
                        ].map(({ label, value }) => (
                            <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-2 text-center">
                                <div className="text-[7px] font-mono text-white/25">{label}</div>
                                <div className="text-[11px] font-mono font-bold mt-0.5" style={{ color: shape.color }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Generated text sample */}
                    <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5">
                        <div className="text-[7px] font-mono text-white/20 mb-1">Generated sample</div>
                        <p className="text-[10px] font-mono text-white/40 italic leading-relaxed">
                            &ldquo;{shape.sample}&rdquo;
                        </p>
                    </div>

                    {/* Insight */}
                    <div
                        className="rounded-xl border px-4 py-3"
                        style={{ borderColor: shape.color + "25", backgroundColor: shape.color + "08" }}
                    >
                        <div className="flex items-start gap-2">
                            <TrendingDown className="w-4 h-4 shrink-0 mt-0.5" style={{ color: shape.color }} />
                            <p className="text-[10px] font-mono leading-relaxed" style={{ color: shape.color + "cc" }}>
                                {shape.insight}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Bottom callout: key lesson */}
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] px-4 py-3">
                <p className="text-[10px] font-mono text-emerald-400/70 leading-relaxed">
                    <strong className="text-emerald-400/90">Key lesson:</strong> With the SAME parameter budget (~240K), shape matters enormously. The <strong>cylinder</strong> (uniform width) wins because it avoids information bottlenecks — every layer can pass full-fidelity signal to the next. Pyramids lose information at each narrowing step; funnels choke the signal at entry. When designing networks, avoid bottlenecks unless you want compression.
                </p>
            </div>

            {/* Config footer */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[7px] font-mono text-white/15">
                <span>ctx=8 · emb=16 · 4 layers · kaiming+BN · tanh · lr=0.003 · AdamW · 100K steps</span>
                <span className="text-emerald-400/20">Real training data</span>
            </div>
        </div>
    );
}
