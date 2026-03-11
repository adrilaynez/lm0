"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  DepthBreakthroughViz — §09 Beat 1 ⭐⭐⭐⭐

  Shows that depth breaks through the width ceiling.
  Slider: 1/2/4/6 blocks. Ceiling line from §08 NeuronScalingViz.
  The dramatic moment: at 2 blocks the ceiling cracks, at 4 it shatters.

  Real data from GPT grid (128d, ctx=256).
  One concept: depth unlocks what width cannot.
*/

/* ── Real training data ── */
interface DataPoint {
    blocks: number;
    params: string;
    val_loss: number;
    sample: string;
    annotation: string;
    annotationColor: string;
}

const DATA: DataPoint[] = [
    {
        blocks: 1, params: "243K", val_loss: 1.538,
        sample: "they neithers a special have\ngood in work and the be the",
        annotation: "The ceiling from §08",
        annotationColor: "rgba(255,255,255,0.3)",
    },
    {
        blocks: 2, params: "441K", val_loss: 1.373,
        sample: "the most important thing is to\nstart working on something that",
        annotation: "The ceiling cracks!",
        annotationColor: "rgba(251,191,36,0.7)",
    },
    {
        blocks: 4, params: "836K", val_loss: 1.301,
        sample: "evolve was starting in the two\ninterests a project that would\nchange the way people think",
        annotation: "Shattered!",
        annotationColor: "rgba(52,211,153,0.8)",
    },
    {
        blocks: 6, params: "1.2M", val_loss: 1.307,
        sample: "the thing I remember best about\nmy time there was how much\neveryone cared about the work",
        annotation: "Sweet spot passed",
        annotationColor: "rgba(255,255,255,0.35)",
    },
];

const CEILING = 1.400; /* best single-block val loss from §08 */

/* ── Chart constants ── */
const SVG_W = 380;
const SVG_H = 200;
const PAD = { top: 24, right: 24, bottom: 36, left: 44 };
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;

const MIN_LOSS = 1.15;
const MAX_LOSS = 1.65;

export function DepthBreakthroughViz() {
    const [selectedIdx, setSelectedIdx] = useState(0);

    const d = DATA[selectedIdx];
    const isBelowCeiling = d.val_loss < CEILING;
    const isBest = selectedIdx === 2;

    /* ── Chart helpers ── */
    const toX = (i: number) => PAD.left + (i / (DATA.length - 1)) * PLOT_W;
    const toY = (loss: number) =>
        PAD.top + PLOT_H - ((loss - MIN_LOSS) / (MAX_LOSS - MIN_LOSS)) * PLOT_H;

    const valPath = DATA.map((p, i) => `${toX(i)},${toY(p.val_loss)}`).join(" L ");

    /* Drawn portion up to selected index */
    const drawnPath = DATA.slice(0, selectedIdx + 1)
        .map((p, i) => `${toX(i)},${toY(p.val_loss)}`)
        .join(" L ");

    /* Future portion */
    const futurePath = selectedIdx < DATA.length - 1
        ? DATA.slice(selectedIdx)
            .map((p, i) => `${toX(selectedIdx + i)},${toY(p.val_loss)}`)
            .join(" L ")
        : "";

    /* Point color */
    const pointColor = (i: number) => {
        const p = DATA[i];
        if (p.val_loss < CEILING) return "rgba(52,211,153,0.9)";
        return "rgba(255,255,255,0.4)";
    };

    /* Shatter particles — shown when selected is at or past idx 2 */
    const showShatter = selectedIdx >= 2;

    return (
        <div className="flex flex-col items-center gap-5 w-full">
            {/* ── Block selector ── */}
            <div className="flex items-center gap-1.5 w-full max-w-[400px]">
                {DATA.map((p, i) => {
                    const isActive = i === selectedIdx;
                    const belowCeil = p.val_loss < CEILING;
                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedIdx(i)}
                            className="flex-1 py-2 rounded-lg text-center transition-all duration-200"
                            style={{
                                background: isActive
                                    ? belowCeil
                                        ? "rgba(52,211,153,0.08)"
                                        : "rgba(34,211,238,0.06)"
                                    : "rgba(255,255,255,0.02)",
                                border: `1px solid ${isActive
                                    ? belowCeil
                                        ? "rgba(52,211,153,0.2)"
                                        : "rgba(34,211,238,0.12)"
                                    : "rgba(255,255,255,0.04)"}`,
                            }}
                        >
                            <span
                                className="text-[13px] font-semibold"
                                style={{
                                    color: isActive
                                        ? belowCeil
                                            ? "rgba(52,211,153,0.85)"
                                            : "rgba(34,211,238,0.7)"
                                        : "rgba(255,255,255,0.25)",
                                }}
                            >
                                {p.blocks}
                            </span>
                            <br />
                            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                                {p.blocks === 1 ? "block" : "blocks"}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── SVG chart ── */}
            <div className="w-full max-w-[420px] relative">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
                    {/* Grid lines */}
                    {[1.2, 1.3, 1.4, 1.5, 1.6].map((v) => (
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
                            {p.blocks}B
                        </text>
                    ))}

                    {/* Ceiling line */}
                    <line
                        x1={PAD.left} y1={toY(CEILING)}
                        x2={SVG_W - PAD.right} y2={toY(CEILING)}
                        stroke="rgba(244,63,94,0.2)"
                        strokeWidth={1.5}
                        strokeDasharray="6 4"
                    />
                    <text
                        x={SVG_W - PAD.right} y={toY(CEILING) - 6}
                        textAnchor="end"
                        fill="rgba(244,63,94,0.35)"
                        fontSize={8}
                        fontFamily="monospace"
                    >
                        width ceiling (1.40)
                    </text>

                    {/* Shatter effect — tiny particles when ceiling is broken */}
                    {showShatter && (
                        <g>
                            {Array.from({ length: 8 }, (_, pi) => {
                                const cx = PAD.left + PLOT_W * 0.35 + (pi - 4) * 18;
                                const cy = toY(CEILING);
                                return (
                                    <motion.circle
                                        key={pi}
                                        cx={cx}
                                        cy={cy}
                                        r={1.5}
                                        fill="rgba(244,63,94,0.3)"
                                        initial={{ cy, opacity: 0.5 }}
                                        animate={{
                                            cy: cy + (pi % 2 === 0 ? -12 : 12) + Math.sin(pi) * 8,
                                            cx: cx + (pi - 4) * 6,
                                            opacity: 0,
                                        }}
                                        transition={{ duration: 1.2, delay: pi * 0.05 }}
                                    />
                                );
                            })}
                        </g>
                    )}

                    {/* Future line (faint) */}
                    {futurePath && (
                        <path
                            d={`M ${futurePath}`}
                            fill="none"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                            strokeDasharray="3 5"
                        />
                    )}

                    {/* Drawn line */}
                    <motion.path
                        d={`M ${drawnPath}`}
                        fill="none"
                        stroke={isBelowCeiling ? "rgba(52,211,153,0.6)" : "rgba(34,211,238,0.4)"}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                    />

                    {/* Points */}
                    {DATA.map((p, i) => {
                        const shown = i <= selectedIdx;
                        const isSel = i === selectedIdx;
                        return (
                            <g key={i}>
                                <circle
                                    cx={toX(i)} cy={toY(p.val_loss)}
                                    r={isSel ? 6 : shown ? 4 : 3}
                                    fill={shown ? pointColor(i) : "rgba(255,255,255,0.1)"}
                                    style={{
                                        filter: isSel ? `drop-shadow(0 0 8px ${pointColor(i)})` : "none",
                                        transition: "all 0.2s",
                                    }}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedIdx(i)}
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* ── Annotation badge ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedIdx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-1.5 rounded-xl"
                    style={{
                        background: isBest
                            ? "rgba(52,211,153,0.06)"
                            : isBelowCeiling
                                ? "rgba(251,191,36,0.05)"
                                : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isBest
                            ? "rgba(52,211,153,0.15)"
                            : isBelowCeiling
                                ? "rgba(251,191,36,0.1)"
                                : "rgba(255,255,255,0.04)"}`,
                    }}
                >
                    <span
                        className="text-[13px] font-semibold"
                        style={{ color: d.annotationColor }}
                    >
                        {d.annotation}
                    </span>
                </motion.div>
            </AnimatePresence>

            {/* ── Stats + sample card ── */}
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
                        border: `1px solid ${isBelowCeiling
                            ? "rgba(52,211,153,0.08)"
                            : "rgba(255,255,255,0.04)"}`,
                    }}
                >
                    {/* Stats */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b"
                        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] font-semibold"
                                style={{ color: isBelowCeiling ? "rgba(52,211,153,0.8)" : "rgba(34,211,238,0.7)" }}>
                                {d.blocks} {d.blocks === 1 ? "block" : "blocks"}
                            </span>
                            <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                                {d.params} params
                            </span>
                        </div>
                        <span className="text-[12px] font-mono font-semibold"
                            style={{ color: isBelowCeiling ? "rgba(52,211,153,0.7)" : "rgba(255,255,255,0.35)" }}>
                            val: {d.val_loss.toFixed(3)}
                        </span>
                    </div>

                    {/* Sample */}
                    <div className="px-4 py-3">
                        <p className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                            style={{ color: isBelowCeiling ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.35)" }}>
                            {d.sample}
                        </p>
                    </div>

                    {/* Best badge */}
                    {isBest && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-2 border-t"
                            style={{
                                borderColor: "rgba(52,211,153,0.08)",
                                background: "rgba(52,211,153,0.03)",
                            }}
                        >
                            <p className="text-[11px] font-medium" style={{ color: "rgba(52,211,153,0.5)" }}>
                                The sweet spot — best generation quality with efficient parameter use.
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
