"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  FFNDeepDiveViz — Redesign v3
  Visual neural network diagram: Input(4) → Expand(16) → ReLU → Compress(4)
  Shows actual nodes, connections, and data flow.
  Click through steps. Select word presets.
  Priority: show the STRUCTURE clearly — layers, nodes, flow.
*/

const INPUT_LABELS = ["royalty", "action", "relation", "function"];
const HIDDEN_LABELS = [
    "noble?", "ruler?", "throne?", "crown?",
    "move?", "past?", "physical?", "state?",
    "spatial?", "causal?", "temporal?", "social?",
    "article?", "prep?", "conj?", "det?",
];

interface Preset {
    label: string;
    input: number[];
    hidden: number[];
    output: number[];
    insight: string;
}

const PRESETS: Preset[] = [
    {
        label: "\u201Cking\u201D",
        input: [0.9, 0.2, 0.8, 0.1],
        hidden: [1.2, 0.8, 0.9, 1.1, -0.3, -0.1, 0.2, -0.5, 0.1, -0.4, -0.2, 0.3, -0.6, 0.0, -0.3, 0.1],
        output: [0.85, 0.15, 0.72, 0.08],
        insight: "Royalty neurons fired strongly \u2192 output amplifies noble features",
    },
    {
        label: "\u201Csat\u201D",
        input: [0.0, 0.8, 0.1, 0.3],
        hidden: [-0.4, 0.1, -0.2, -0.3, 0.9, 1.1, 0.7, 0.8, -0.1, 0.3, -0.5, 0.0, -0.2, -0.3, 0.1, -0.1],
        output: [0.05, 0.78, 0.12, 0.08],
        insight: "Action neurons fired \u2192 output emphasizes verb features",
    },
    {
        label: "\u201Cthe\u201D",
        input: [0.1, 0.0, 0.0, 0.8],
        hidden: [-0.3, -0.5, -0.1, -0.2, -0.2, -0.4, -0.1, 0.1, -0.1, -0.3, -0.2, -0.1, 0.4, -0.2, 0.1, -0.3],
        output: [0.08, 0.01, 0.02, 0.62],
        insight: "Almost nothing fired \u2192 function word passes through quietly",
    },
];

type Step = 0 | 1 | 2 | 3;

const STEP_META = [
    { title: "Input", sub: "4 features", desc: "The token\u2019s embedding: 4 numbers describing what this word means.", color: "#22d3ee", rgb: "34,211,238" },
    { title: "Expand", sub: "\u00d7 W\u2081 \u2192 16 neurons", desc: "Each of the 16 neurons checks for a specific pattern by combining all 4 inputs.", color: "#fbbf24", rgb: "251,191,36" },
    { title: "ReLU", sub: "kill negatives", desc: "Negative values become zero. Only neurons that detected something survive.", color: "#f97316", rgb: "249,115,22" },
    { title: "Compress", sub: "\u00d7 W\u2082 \u2192 4 features", desc: "Surviving signals are mixed back down to 4 refined features.", color: "#34d399", rgb: "52,211,153" },
];

/* Node position helpers */
const NODE_R = 16;
const SVG_W = 500;
const SVG_H = 320;
const LAYER_X = [70, 200, 310, 440]; /* x centers for 4 layers */

function inputY(i: number) { return 60 + i * 60; }
function hiddenY(i: number) { return 22 + i * 18.5; }
function outputY(i: number) { return 60 + i * 60; }

export function FFNDeepDiveViz() {
    const [pi, setPi] = useState(0);
    const [step, setStep] = useState<Step>(0);
    const p = PRESETS[pi];

    const afterRelu = useMemo(() => p.hidden.map((v) => Math.max(0, v)), [p]);
    const activeCount = afterRelu.filter((v) => v > 0).length;

    const showHidden = step >= 1;
    const showRelu = step >= 2;
    const showOutput = step >= 3;

    /* Values to display in hidden layer */
    const hiddenVals = showRelu ? afterRelu : p.hidden;

    return (
        <div className="py-5 sm:py-7 px-2 sm:px-4">
            {/* Preset selector */}
            <div className="flex items-center justify-center gap-2 mb-3">
                {PRESETS.map((pr, i) => (
                    <button key={i} onClick={() => { setPi(i); setStep(0); }}
                        className="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
                        style={{
                            background: pi === i ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)",
                            color: pi === i ? "#22d3ee" : "rgba(255,255,255,0.3)",
                            border: pi === i ? "1.5px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.06)",
                        }}>{pr.label}</button>
                ))}
            </div>

            {/* Step pipeline */}
            <div className="flex items-center justify-center gap-0 mb-1">
                {STEP_META.map((s, i) => (
                    <div key={i} className="flex items-center">
                        <button onClick={() => setStep(i as Step)}
                            className="flex flex-col items-center px-2 py-1 rounded-lg transition-all cursor-pointer"
                            style={{
                                background: step === i ? `rgba(${s.rgb},0.1)` : "transparent",
                            }}>
                            <span className="text-[12px] font-bold"
                                style={{ color: step >= i ? s.color : "rgba(255,255,255,0.15)" }}>
                                {s.title}
                            </span>
                            <span className="text-[9px]"
                                style={{ color: step >= i ? `rgba(${s.rgb},0.5)` : "rgba(255,255,255,0.1)" }}>
                                {s.sub}
                            </span>
                        </button>
                        {i < 3 && <span className="text-[10px] mx-0.5"
                            style={{ color: step > i ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)" }}>{"\u2192"}</span>}
                    </div>
                ))}
            </div>

            {/* Step description */}
            <AnimatePresence mode="wait">
                <motion.p key={step}
                    className="text-center text-[13px] mb-3 max-w-md mx-auto"
                    style={{ color: `rgba(${STEP_META[step].rgb},0.6)` }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {STEP_META[step].desc}
                </motion.p>
            </AnimatePresence>

            {/* ── SVG Network Diagram ── */}
            <div className="w-full max-w-[540px] mx-auto overflow-x-auto">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ minWidth: 380 }}>
                    {/* ── Layer labels ── */}
                    <text x={LAYER_X[0]} y={14} textAnchor="middle" fontSize={10} fontWeight={700}
                        fill={step >= 0 ? "#22d3ee" : "rgba(255,255,255,0.12)"}>Input</text>
                    {showHidden && (
                        <text x={LAYER_X[1]} y={14} textAnchor="middle" fontSize={10} fontWeight={700}
                            fill={showRelu ? "#f97316" : "#fbbf24"}>{showRelu ? "Expand \u2192 ReLU" : "Expand"}</text>
                    )}
                    {showOutput && (
                        <text x={LAYER_X[3]} y={14} textAnchor="middle" fontSize={10} fontWeight={700}
                            fill="#34d399">Output</text>
                    )}

                    {/* ── Connections: Input → Hidden ── */}
                    {showHidden && p.input.map((_, ii) =>
                        hiddenVals.map((hv, hi) => {
                            const dead = showRelu && p.hidden[hi] <= 0;
                            const strength = dead ? 0 : Math.abs(showRelu ? afterRelu[hi] : p.hidden[hi]);
                            const opacity = dead ? 0.02 : Math.min(strength / 1.5, 0.35) + 0.03;
                            return (
                                <motion.line key={`ih-${ii}-${hi}`}
                                    x1={LAYER_X[0] + NODE_R} y1={inputY(ii)}
                                    x2={LAYER_X[1] - 8} y2={hiddenY(hi)}
                                    stroke={dead ? "rgba(255,255,255,0.02)" : "rgba(251,191,36,0.3)"}
                                    strokeWidth={dead ? 0.3 : 0.6}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity }}
                                    transition={{ duration: 0.3, delay: hi * 0.01 }}
                                />
                            );
                        })
                    )}

                    {/* ── Connections: Hidden → Output ── */}
                    {showOutput && hiddenVals.map((hv, hi) => {
                        const dead = p.hidden[hi] <= 0;
                        return p.output.map((_, oi) => {
                            const opacity = dead ? 0 : Math.min(Math.abs(afterRelu[hi]) / 1.5, 0.3) + 0.03;
                            return (
                                <motion.line key={`ho-${hi}-${oi}`}
                                    x1={LAYER_X[1] + 8} y1={hiddenY(hi)}
                                    x2={LAYER_X[3] - NODE_R} y2={outputY(oi)}
                                    stroke={dead ? "rgba(255,255,255,0.01)" : "rgba(52,211,153,0.25)"}
                                    strokeWidth={dead ? 0.3 : 0.6}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity }}
                                    transition={{ duration: 0.3, delay: 0.1 + hi * 0.01 }}
                                />
                            );
                        });
                    })}

                    {/* ── Input nodes ── */}
                    {p.input.map((v, i) => {
                        const t = Math.abs(v);
                        return (
                            <g key={`in-${i}`}>
                                <motion.circle cx={LAYER_X[0]} cy={inputY(i)} r={NODE_R}
                                    animate={{
                                        fill: `rgba(34,211,238,${(0.08 + t * 0.2).toFixed(2)})`,
                                        stroke: `rgba(34,211,238,${(0.2 + t * 0.4).toFixed(2)})`,
                                    }}
                                    strokeWidth={1.5}
                                    style={{ filter: step === 0 ? `drop-shadow(0 0 6px rgba(34,211,238,${t * 0.3}))` : "none" }}
                                />
                                <text x={LAYER_X[0]} y={inputY(i) + 1} textAnchor="middle" dominantBaseline="middle"
                                    fontSize={11} fontFamily="monospace" fontWeight={700} fill={`rgba(34,211,238,${0.5 + t * 0.4})`}>
                                    {v.toFixed(1)}
                                </text>
                                <text x={LAYER_X[0] - NODE_R - 6} y={inputY(i) + 1} textAnchor="end" dominantBaseline="middle"
                                    fontSize={8} fill="rgba(255,255,255,0.25)">
                                    {INPUT_LABELS[i]}
                                </text>
                            </g>
                        );
                    })}

                    {/* ── Hidden/ReLU nodes ── */}
                    {showHidden && hiddenVals.map((v, i) => {
                        const dead = showRelu && p.hidden[i] <= 0;
                        const t = dead ? 0 : Math.min(Math.abs(v) / 1.3, 1);
                        const cx = LAYER_X[1];
                        const nodeColor = dead ? "rgba(255,255,255," : "rgba(251,191,36,";
                        return (
                            <g key={`hid-${i}`}>
                                <motion.circle cx={cx} cy={hiddenY(i)} r={8}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: 1, opacity: 1,
                                        fill: dead ? "rgba(255,255,255,0.02)" : `rgba(251,191,36,${(0.06 + t * 0.3).toFixed(2)})`,
                                        stroke: dead ? "rgba(255,255,255,0.04)" : `rgba(251,191,36,${(0.15 + t * 0.35).toFixed(2)})`,
                                    }}
                                    strokeWidth={dead ? 0.5 : 1}
                                    transition={{ delay: i * 0.015, duration: 0.25 }}
                                    style={!dead && t > 0.5 ? { filter: `drop-shadow(0 0 4px rgba(251,191,36,${t * 0.2}))` } : {}}
                                />
                                {/* Dead X mark */}
                                {dead && (
                                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.25 }} transition={{ delay: 0.2 + i * 0.01 }}>
                                        <line x1={cx - 3} y1={hiddenY(i) - 3} x2={cx + 3} y2={hiddenY(i) + 3}
                                            stroke="rgba(244,63,94,0.5)" strokeWidth={1.5} />
                                        <line x1={cx + 3} y1={hiddenY(i) - 3} x2={cx - 3} y2={hiddenY(i) + 3}
                                            stroke="rgba(244,63,94,0.5)" strokeWidth={1.5} />
                                    </motion.g>
                                )}
                                {!dead && (
                                    <text x={cx} y={hiddenY(i) + 1} textAnchor="middle" dominantBaseline="middle"
                                        fontSize={7} fontFamily="monospace" fontWeight={600}
                                        fill={`rgba(251,191,36,${(0.4 + t * 0.5).toFixed(2)})`}>
                                        {v.toFixed(1)}
                                    </text>
                                )}
                                {/* Labels (right side) */}
                                <text x={cx + 12} y={hiddenY(i) + 1} dominantBaseline="middle"
                                    fontSize={7} fill={dead ? "rgba(255,255,255,0.08)" : "rgba(251,191,36,0.35)"}>
                                    {HIDDEN_LABELS[i]}
                                </text>
                            </g>
                        );
                    })}

                    {/* ── Output nodes ── */}
                    {showOutput && p.output.map((v, i) => {
                        const t = Math.abs(v);
                        return (
                            <g key={`out-${i}`}>
                                <motion.circle cx={LAYER_X[3]} cy={outputY(i)} r={NODE_R}
                                    initial={{ scale: 0 }}
                                    animate={{
                                        scale: 1,
                                        fill: `rgba(52,211,153,${(0.08 + t * 0.2).toFixed(2)})`,
                                        stroke: `rgba(52,211,153,${(0.2 + t * 0.4).toFixed(2)})`,
                                    }}
                                    strokeWidth={1.5}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                    style={{ filter: `drop-shadow(0 0 6px rgba(52,211,153,${t * 0.2}))` }}
                                />
                                <motion.text x={LAYER_X[3]} y={outputY(i) + 1} textAnchor="middle" dominantBaseline="middle"
                                    fontSize={11} fontFamily="monospace" fontWeight={700}
                                    fill={`rgba(52,211,153,${(0.5 + t * 0.4).toFixed(2)})`}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 + i * 0.05 }}>
                                    {v.toFixed(2)}
                                </motion.text>
                                <text x={LAYER_X[3] + NODE_R + 6} y={outputY(i) + 1} dominantBaseline="middle"
                                    fontSize={8} fill="rgba(255,255,255,0.25)">
                                    {INPUT_LABELS[i]}
                                </text>
                            </g>
                        );
                    })}

                    {/* ReLU counter badge */}
                    {showRelu && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            <rect x={LAYER_X[1] - 28} y={SVG_H - 22} width={56} height={18} rx={6}
                                fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.2)" strokeWidth={1} />
                            <text x={LAYER_X[1]} y={SVG_H - 10} textAnchor="middle" fontSize={9} fontWeight={700}
                                fill="rgba(249,115,22,0.7)">
                                {activeCount}/16 alive
                            </text>
                        </motion.g>
                    )}
                </svg>
            </div>

            {/* Insight */}
            {showOutput && (
                <AnimatePresence mode="wait">
                    <motion.p key={pi}
                        className="text-center text-[13px] font-medium max-w-sm mx-auto mt-1"
                        style={{ color: "rgba(52,211,153,0.55)" }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}>
                        {p.insight}
                    </motion.p>
                </AnimatePresence>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-center gap-3 mt-4">
                {step > 0 && (
                    <button onClick={() => setStep((step - 1) as Step)}
                        className="px-3 py-1.5 rounded-lg text-[12px] text-white/30 hover:text-white/50 cursor-pointer transition-colors"
                        style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                        {"\u2190"} Back
                    </button>
                )}
                {step < 3 && (
                    <button onClick={() => setStep((step + 1) as Step)}
                        className="px-4 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer"
                        style={{
                            background: `rgba(${STEP_META[step + 1].rgb},0.1)`,
                            border: `1px solid rgba(${STEP_META[step + 1].rgb},0.25)`,
                            color: STEP_META[step + 1].color,
                        }}>
                        {STEP_META[step + 1].title} {"\u2192"}
                    </button>
                )}
            </div>
        </div>
    );
}
