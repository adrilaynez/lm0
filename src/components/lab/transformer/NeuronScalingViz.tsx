"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  NeuronScalingViz — §08 Beat 7

  Shows that adding neurons (width) to a single block yields diminishing
  returns, then NEGATIVE returns (overfitting at 512d).
  Sets up the "go deeper" insight for §09.

  Real data from GPT grid training (single-block models, ctx=128).
  One concept: width has a ceiling — and exceeding it makes things WORSE.
*/

/* ── Real training data ── */
interface DataPoint {
    size: string;
    dim: number;
    params: string;
    val_loss: number;
    train_loss: number;
    sample: string;
}

const DATA: DataPoint[] = [
    {
        size: "32d", dim: 32, params: "20K", val_loss: 2.054, train_loss: 1.926,
        sample: "theng an thi whe ous\nthe tor ald and ber",
    },
    {
        size: "64d", dim: 64, params: "64K", val_loss: 1.781, train_loss: 1.669,
        sample: "and the shall not be\nthe king was in the",
    },
    {
        size: "128d", dim: 128, params: "227K", val_loss: 1.578, train_loss: 1.444,
        sample: "they neithers a special\nhave good in work and",
    },
    {
        size: "256d", dim: 256, params: "847K", val_loss: 1.400, train_loss: 1.251,
        sample: "the way to get started\nis to quit talking and",
    },
    {
        size: "512d", dim: 512, params: "3.3M", val_loss: 1.419, train_loss: 1.145,
        sample: "Thanks to Trevor Blackwell\nJessica Livingston Robert",
    },
];

const BEST_VAL = 1.400; /* ceiling line — best single-block */

/* ── Chart constants ── */
const SVG_W = 380;
const SVG_H = 200;
const PAD = { top: 24, right: 24, bottom: 36, left: 44 };
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;

const MIN_LOSS = 1.0;
const MAX_LOSS = 2.2;

export function NeuronScalingViz() {
    const [selectedIdx, setSelectedIdx] = useState(3); /* default: 256d (the best) */

    const d = DATA[selectedIdx];
    const isOverfit = selectedIdx === DATA.length - 1;
    const gap = d.val_loss - d.train_loss;

    /* ── Chart helpers ── */
    const toX = (i: number) => PAD.left + (i / (DATA.length - 1)) * PLOT_W;
    const toY = (loss: number) =>
        PAD.top + PLOT_H - ((loss - MIN_LOSS) / (MAX_LOSS - MIN_LOSS)) * PLOT_H;

    /* val loss path */
    const valPath = DATA.map((p, i) => `${toX(i)},${toY(p.val_loss)}`).join(" L ");
    /* train loss path */
    const trainPath = DATA.map((p, i) => `${toX(i)},${toY(p.train_loss)}`).join(" L ");

    /* Point color based on improvement */
    const pointColor = (i: number) => {
        if (i === DATA.length - 1) return "rgba(244,63,94,0.9)"; /* rose — worse */
        if (i === DATA.length - 2) return "rgba(52,211,153,0.9)"; /* emerald — best */
        return "rgba(52,211,153,0.7)";
    };

    return (
        <div className="flex flex-col items-center gap-5 w-full">
            {/* ── Slider ── */}
            <div className="flex items-center gap-1 w-full max-w-[400px]">
                {DATA.map((p, i) => {
                    const isActive = i === selectedIdx;
                    const isWorst = i === DATA.length - 1;
                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedIdx(i)}
                            className="flex-1 py-2 rounded-lg text-center transition-all duration-200"
                            style={{
                                background: isActive
                                    ? isWorst
                                        ? "rgba(244,63,94,0.08)"
                                        : "rgba(34,211,238,0.08)"
                                    : "rgba(255,255,255,0.02)",
                                border: `1px solid ${isActive
                                    ? isWorst
                                        ? "rgba(244,63,94,0.2)"
                                        : "rgba(34,211,238,0.15)"
                                    : "rgba(255,255,255,0.04)"}`,
                            }}
                        >
                            <span
                                className="text-[12px] font-mono font-semibold"
                                style={{
                                    color: isActive
                                        ? isWorst
                                            ? "rgba(244,63,94,0.8)"
                                            : "rgba(34,211,238,0.8)"
                                        : "rgba(255,255,255,0.25)",
                                }}
                            >
                                {p.size}
                            </span>
                            <br />
                            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                                {p.params}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── SVG chart ── */}
            <div className="w-full max-w-[420px]">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
                    {/* Grid lines */}
                    {[1.0, 1.4, 1.8, 2.2].map((v) => (
                        <g key={v}>
                            <line
                                x1={PAD.left} y1={toY(v)}
                                x2={SVG_W - PAD.right} y2={toY(v)}
                                stroke="rgba(255,255,255,0.04)"
                                strokeWidth={0.5}
                            />
                            <text
                                x={PAD.left - 6} y={toY(v) + 3}
                                textAnchor="end"
                                fill="rgba(255,255,255,0.15)"
                                fontSize={9}
                                fontFamily="monospace"
                            >
                                {v.toFixed(1)}
                            </text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {DATA.map((p, i) => (
                        <text
                            key={i}
                            x={toX(i)} y={SVG_H - 6}
                            textAnchor="middle"
                            fill={i === selectedIdx ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}
                            fontSize={9}
                            fontFamily="monospace"
                            fontWeight={i === selectedIdx ? 600 : 400}
                        >
                            {p.size}
                        </text>
                    ))}

                    {/* Ceiling line */}
                    <line
                        x1={PAD.left} y1={toY(BEST_VAL)}
                        x2={SVG_W - PAD.right} y2={toY(BEST_VAL)}
                        stroke="rgba(244,63,94,0.2)"
                        strokeWidth={1}
                        strokeDasharray="5 4"
                    />
                    <text
                        x={SVG_W - PAD.right} y={toY(BEST_VAL) - 5}
                        textAnchor="end"
                        fill="rgba(244,63,94,0.3)"
                        fontSize={8}
                        fontFamily="monospace"
                    >
                        ceiling (1.40)
                    </text>

                    {/* Train loss line (subtle) */}
                    <path
                        d={`M ${trainPath}`}
                        fill="none"
                        stroke="rgba(34,211,238,0.15)"
                        strokeWidth={1}
                        strokeDasharray="3 4"
                    />

                    {/* Val loss line (primary) */}
                    <path
                        d={`M ${valPath}`}
                        fill="none"
                        stroke="rgba(34,211,238,0.5)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Points */}
                    {DATA.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={toX(i)} cy={toY(p.val_loss)}
                                r={i === selectedIdx ? 6 : 4}
                                fill={pointColor(i)}
                                style={{
                                    filter: i === selectedIdx ? `drop-shadow(0 0 6px ${pointColor(i)})` : "none",
                                    transition: "r 0.2s",
                                }}
                                className="cursor-pointer"
                                onClick={() => setSelectedIdx(i)}
                            />
                            {/* Train loss point */}
                            <circle
                                cx={toX(i)} cy={toY(p.train_loss)}
                                r={2}
                                fill="rgba(34,211,238,0.3)"
                            />
                        </g>
                    ))}

                    {/* 512d annotation */}
                    {selectedIdx === DATA.length - 1 && (
                        <g>
                            <text
                                x={toX(DATA.length - 1)} y={toY(DATA[DATA.length - 1].val_loss) - 14}
                                textAnchor="middle"
                                fill="rgba(244,63,94,0.7)"
                                fontSize={9}
                                fontFamily="monospace"
                                fontWeight={600}
                            >
                                16× params... worse?
                            </text>
                        </g>
                    )}

                    {/* Legend */}
                    <g transform={`translate(${PAD.left + 4}, ${PAD.top + 2})`}>
                        <line x1={0} y1={0} x2={14} y2={0} stroke="rgba(34,211,238,0.5)" strokeWidth={2} />
                        <text x={18} y={3} fill="rgba(255,255,255,0.25)" fontSize={8} fontFamily="monospace">val</text>
                        <line x1={44} y1={0} x2={58} y2={0} stroke="rgba(34,211,238,0.15)" strokeWidth={1} strokeDasharray="3 4" />
                        <text x={62} y={3} fill="rgba(255,255,255,0.15)" fontSize={8} fontFamily="monospace">train</text>
                    </g>
                </svg>
            </div>

            {/* ── Stats + sample ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-[420px] rounded-xl overflow-hidden"
                    style={{
                        background: "rgba(0,0,0,0.2)",
                        border: `1px solid ${isOverfit ? "rgba(244,63,94,0.1)" : "rgba(255,255,255,0.04)"}`,
                    }}
                >
                    {/* Stats row */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b"
                        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] font-mono font-semibold"
                                style={{ color: isOverfit ? "rgba(244,63,94,0.8)" : "rgba(34,211,238,0.8)" }}>
                                {d.size}
                            </span>
                            <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                                {d.params} params
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono">
                            <span style={{ color: "rgba(255,255,255,0.3)" }}>
                                val: <strong style={{ color: isOverfit ? "rgba(244,63,94,0.7)" : "rgba(52,211,153,0.7)" }}>
                                    {d.val_loss.toFixed(3)}
                                </strong>
                            </span>
                            <span style={{ color: "rgba(255,255,255,0.2)" }}>
                                train: {d.train_loss.toFixed(3)}
                            </span>
                            {gap > 0.15 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px]"
                                    style={{
                                        background: "rgba(244,63,94,0.08)",
                                        color: "rgba(244,63,94,0.5)",
                                    }}>
                                    gap {gap.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Sample text */}
                    <div className="px-4 py-3">
                        <p className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                            style={{ color: isOverfit ? "rgba(244,63,94,0.45)" : "rgba(255,255,255,0.4)" }}>
                            {d.sample}
                        </p>
                    </div>

                    {/* Overfit warning */}
                    {isOverfit && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-2.5 border-t"
                            style={{
                                borderColor: "rgba(244,63,94,0.08)",
                                background: "rgba(244,63,94,0.03)",
                            }}
                        >
                            <p className="text-[11px] font-medium" style={{ color: "rgba(244,63,94,0.5)" }}>
                                Training loss is great (1.145) — but validation got worse.
                                The model memorized instead of learning.
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
