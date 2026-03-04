"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  ContextWindowExperiment
  Compare MLP models trained with different context sizes.
  Shows loss curves, generated text quality, and diminishing returns + cost.
  Uses realistic mock data (replace with backend when available).
*/

// Realistic mock data based on expected training outcomes
// context_size → { loss curve points, final losses, sample text, params }
const CONTEXT_DATA: Record<number, {
    label: string;
    params: string;
    lossCurve: { step: number; train: number; val: number }[];
    finalTrain: number;
    finalVal: number;
    samples: string[];
    color: string;
}> = {
    1: {
        label: "N=1",
        params: "2,970",
        lossCurve: [
            { step: 0, train: 3.30, val: 3.30 },
            { step: 1000, train: 2.72, val: 2.74 },
            { step: 5000, train: 2.55, val: 2.58 },
            { step: 10000, train: 2.48, val: 2.52 },
            { step: 20000, train: 2.44, val: 2.49 },
            { step: 50000, train: 2.42, val: 2.48 },
        ],
        finalTrain: 2.42,
        finalVal: 2.48,
        samples: ["theng an thi whe the", "sor an ofo the he ca", "te alin whe an the s"],
        color: "#9ca3af",
    },
    2: {
        label: "N=2",
        params: "3,240",
        lossCurve: [
            { step: 0, train: 3.30, val: 3.30 },
            { step: 1000, train: 2.58, val: 2.61 },
            { step: 5000, train: 2.35, val: 2.40 },
            { step: 10000, train: 2.26, val: 2.33 },
            { step: 20000, train: 2.20, val: 2.28 },
            { step: 50000, train: 2.16, val: 2.25 },
        ],
        finalTrain: 2.16,
        finalVal: 2.25,
        samples: ["the wor and the king", "of then we the and s", "he said ther the kin"],
        color: "#f59e0b",
    },
    3: {
        label: "N=3",
        params: "3,510",
        lossCurve: [
            { step: 0, train: 3.30, val: 3.30 },
            { step: 1000, train: 2.45, val: 2.49 },
            { step: 5000, train: 2.18, val: 2.25 },
            { step: 10000, train: 2.08, val: 2.17 },
            { step: 20000, train: 2.00, val: 2.11 },
            { step: 50000, train: 1.94, val: 2.06 },
        ],
        finalTrain: 1.94,
        finalVal: 2.06,
        samples: ["the throne of the ki", "alling into the dark", "we should not have t"],
        color: "#10b981",
    },
    5: {
        label: "N=5",
        params: "4,050",
        lossCurve: [
            { step: 0, train: 3.30, val: 3.30 },
            { step: 1000, train: 2.38, val: 2.43 },
            { step: 5000, train: 2.08, val: 2.17 },
            { step: 10000, train: 1.96, val: 2.08 },
            { step: 20000, train: 1.87, val: 2.02 },
            { step: 50000, train: 1.80, val: 1.96 },
        ],
        finalTrain: 1.80,
        finalVal: 1.96,
        samples: ["the king ordered his", "falling into the dar", "we should never have"],
        color: "#8b5cf6",
    },
    8: {
        label: "N=8",
        params: "4,860",
        lossCurve: [
            { step: 0, train: 3.30, val: 3.30 },
            { step: 1000, train: 2.35, val: 2.42 },
            { step: 5000, train: 2.04, val: 2.15 },
            { step: 10000, train: 1.92, val: 2.06 },
            { step: 20000, train: 1.83, val: 1.99 },
            { step: 50000, train: 1.76, val: 1.94 },
        ],
        finalTrain: 1.76,
        finalVal: 1.94,
        samples: ["the king ordered his", "falling into the dar", "we should never have"],
        color: "#ec4899",
    },
};

const CONTEXT_SIZES = [1, 2, 3, 5, 8];
const W = 300;
const H = 130;
const PAD = 35;

export function ContextWindowExperiment() {
    const [selected, setSelected] = useState<Set<number>>(new Set([1, 3, 8]));

    const toggle = (ctx: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(ctx)) next.delete(ctx);
            else next.add(ctx);
            return next;
        });
    };

    const toX = (step: number) => PAD + ((step / 50000) * (W - 2 * PAD));
    const toY = (loss: number) => PAD + ((loss - 1.5) / (3.3 - 1.5)) * (H - 2 * PAD);

    // Diminishing returns data
    const improvements = CONTEXT_SIZES.map((ctx, i) => {
        const d = CONTEXT_DATA[ctx];
        const prev = i > 0 ? CONTEXT_DATA[CONTEXT_SIZES[i - 1]].finalVal : 3.30;
        return { ctx, loss: d.finalVal, improvement: prev - d.finalVal, params: d.params };
    });

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Context size toggles */}
            <div className="flex flex-wrap gap-2">
                {CONTEXT_SIZES.map(ctx => {
                    const d = CONTEXT_DATA[ctx];
                    const active = selected.has(ctx);
                    return (
                        <button
                            key={ctx}
                            onClick={() => toggle(ctx)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                                active ? "bg-white/[0.04] border-white/[0.12]" : "bg-white/[0.02] border-white/[0.05] text-white/20"
                            }`}
                            style={active ? { color: d.color, borderColor: `${d.color}40` } : {}}
                        >
                            {d.label}
                        </button>
                    );
                })}
            </div>

            {/* Loss curves */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                    {/* Grid lines */}
                    {[2.0, 2.5, 3.0].map(v => (
                        <line key={v} x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)} stroke="white" strokeOpacity={0.03} />
                    ))}
                    {/* Y-axis labels */}
                    <text x={PAD - 3} y={toY(2.0) + 3} textAnchor="end" fill="rgba(255,255,255,0.1)" fontSize="6" fontFamily="monospace">2.0</text>
                    <text x={PAD - 3} y={toY(2.5) + 3} textAnchor="end" fill="rgba(255,255,255,0.1)" fontSize="6" fontFamily="monospace">2.5</text>
                    <text x={PAD - 3} y={toY(3.0) + 3} textAnchor="end" fill="rgba(255,255,255,0.1)" fontSize="6" fontFamily="monospace">3.0</text>
                    {/* X-axis */}
                    <text x={toX(0)} y={H - 3} textAnchor="middle" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="monospace">0</text>
                    <text x={toX(50000)} y={H - 3} textAnchor="middle" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="monospace">50K steps</text>

                    {/* Loss curves (val) */}
                    {CONTEXT_SIZES.filter(ctx => selected.has(ctx)).map(ctx => {
                        const d = CONTEXT_DATA[ctx];
                        return (
                            <polyline
                                key={ctx}
                                points={d.lossCurve.map(p => `${toX(p.step)},${toY(p.val)}`).join(" ")}
                                fill="none"
                                stroke={d.color}
                                strokeWidth="2"
                                opacity={0.8}
                            />
                        );
                    })}

                    {/* Endpoint dots */}
                    {CONTEXT_SIZES.filter(ctx => selected.has(ctx)).map(ctx => {
                        const d = CONTEXT_DATA[ctx];
                        const last = d.lossCurve[d.lossCurve.length - 1];
                        return (
                            <circle key={`dot-${ctx}`} cx={toX(last.step)} cy={toY(last.val)} r={3}
                                fill={d.color} fillOpacity={0.6} stroke={d.color} strokeWidth={1} />
                        );
                    })}
                </svg>
            </div>

            {/* Legend + final losses */}
            <div className="flex flex-wrap gap-3 text-[8px] font-mono">
                {CONTEXT_SIZES.filter(ctx => selected.has(ctx)).map(ctx => {
                    const d = CONTEXT_DATA[ctx];
                    return (
                        <span key={ctx} className="flex items-center gap-1">
                            <span className="w-3 h-0.5 rounded" style={{ backgroundColor: d.color }} />
                            <span style={{ color: d.color }}>{d.label}: {d.finalVal.toFixed(2)}</span>
                        </span>
                    );
                })}
            </div>

            {/* Diminishing returns bar */}
            <div className="space-y-1">
                <p className="text-[8px] font-mono text-white/15 uppercase tracking-wider">Improvement over previous</p>
                {improvements.map(({ ctx, improvement, params }) => {
                    const d = CONTEXT_DATA[ctx];
                    return (
                        <div key={ctx} className="flex items-center gap-2">
                            <span className="text-[8px] font-mono w-8" style={{ color: d.color }}>{d.label}</span>
                            <div className="flex-1 h-3 rounded bg-white/[0.02] overflow-hidden">
                                <div className="h-full rounded transition-all" style={{
                                    width: `${Math.max(2, (improvement / 1.1) * 100)}%`,
                                    backgroundColor: `${d.color}40`,
                                }} />
                            </div>
                            <span className="text-[7px] font-mono text-white/15 w-10 text-right">
                                {improvement > 0 ? `-${improvement.toFixed(2)}` : "base"}
                            </span>
                            <span className="text-[7px] font-mono text-white/10 w-12 text-right">{params} p</span>
                        </div>
                    );
                })}
            </div>

            {/* Sample text comparison */}
            <div className="space-y-1.5">
                <p className="text-[8px] font-mono text-white/15 uppercase tracking-wider">Generated text quality</p>
                {CONTEXT_SIZES.filter(ctx => selected.has(ctx)).map(ctx => {
                    const d = CONTEXT_DATA[ctx];
                    return (
                        <motion.div key={ctx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-2 flex items-start gap-2"
                        >
                            <span className="text-[9px] font-mono font-bold shrink-0 w-8" style={{ color: d.color }}>{d.label}</span>
                            <p className="text-[10px] font-mono text-white/30">&quot;{d.samples[0]}&quot;</p>
                        </motion.div>
                    );
                })}
            </div>

            <p className="text-[8px] font-mono text-white/15 text-center">
                More context consistently improves loss — but the gains shrink with each step. Going from N=1 to N=3 saves 0.42 loss; N=3 to N=8 only saves 0.12.
            </p>
        </div>
    );
}
