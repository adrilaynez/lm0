"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  ValueDriftViz — Redesign v5
  
  THE PROBLEM: stacking attention + FFN operations without normalization
  makes values explode, destroying the original meaning.
  
  Shows 8 embedding dimensions as vertical bars.
  Left: original embedding. Right: after N ops.
  Values grow, range expands, bars shoot off-screen.
  Clear captions explain exactly what's happening and why it's bad.
  
  One concept: repeated transformations without normalization = explosion.
*/

const N_DIMS = 8;
const DIM_LABELS = ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"];
const DIM_COLORS = [
    "#22d3ee", "#38bdf8", "#818cf8", "#a78bfa",
    "#c084fc", "#f472b6", "#fb923c", "#fbbf24",
];

/* Original embedding — moderate, balanced values */
const ORIGINAL = [0.42, -0.31, 0.68, -0.15, 0.55, -0.48, 0.22, 0.37];

/* Simulate stacking ops: each op amplifies, shifts, and ROTATES values */
function simulateOps(n: number): number[] {
    let vals = [...ORIGINAL];
    for (let op = 0; op < n; op++) {
        vals = vals.map((v, i) => {
            /* Strong directional noise that rotates the vector */
            const noise = Math.sin((op + 1) * (i + 1) * 1.7) * (0.3 + op * 0.15);
            /* Cross-dimension mixing destroys original direction */
            const neighbor = vals[(i + op + 1) % N_DIMS] * 0.3;
            const scale = 1.15 + Math.abs(Math.sin(op * 0.9 + i * 0.7)) * 0.3;
            return (v * scale + noise + neighbor) * (1 + op * 0.05);
        });
    }
    return vals;
}

function cosineSim(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function maxAbsVal(arr: number[]): number {
    return Math.max(...arr.map(Math.abs), 0.01);
}

function healthColor(sim: number): { color: string; rgb: string } {
    if (sim > 0.85) return { color: "#22d3ee", rgb: "34,211,238" };
    if (sim > 0.5) return { color: "#fbbf24", rgb: "251,191,36" };
    return { color: "#f43f5e", rgb: "244,63,94" };
}

const CAPTIONS: Record<number, { title: string; detail: string }> = {
    0: {
        title: "Original embedding of \"king\"",
        detail: "8 numbers, all between -0.5 and 0.7. This is what the token means.",
    },
    1: {
        title: "After 1 block (attention + FFN)",
        detail: "Values grew slightly. Range: still manageable. Meaning: intact.",
    },
    2: {
        title: "After 2 blocks",
        detail: "Values are larger. Some dimensions starting to dominate others.",
    },
    3: {
        title: "After 3 blocks",
        detail: "Range is 5\u00d7 wider. The original balance is breaking apart.",
    },
    4: {
        title: "After 4 blocks",
        detail: "Values are exploding. Gradients become unstable \u2014 training slows or fails.",
    },
    5: {
        title: "After 5 blocks",
        detail: "The original meaning is buried under numerical noise. Similarity plummeting.",
    },
    6: {
        title: "After 6 blocks \u2014 destroyed",
        detail: "The embedding bears almost no resemblance to the original. Training would collapse.",
    },
};

/* Bar chart helpers */
const BAR_SVG_W = 180;
const BAR_SVG_H = 180;
const BAR_PAD = { top: 14, bottom: 14, left: 4, right: 4 };
const BAR_W_EACH = (BAR_SVG_W - BAR_PAD.left - BAR_PAD.right) / N_DIMS;
const BAR_MID_Y = BAR_SVG_H / 2;

export function ValueDriftViz() {
    const [ops, setOps] = useState(0);

    const currentVals = useMemo(() => simulateOps(ops), [ops]);
    const similarity = useMemo(() => Math.max(0, cosineSim(ORIGINAL, currentVals)), [currentVals]);
    const { color: accent, rgb } = healthColor(similarity);

    /* Use same scale for both charts so you can SEE the explosion */
    const maxOrig = maxAbsVal(ORIGINAL);
    const maxCur = maxAbsVal(currentVals);
    const globalMax = Math.max(maxOrig, maxCur);

    const origRange = `\u00b1${maxOrig.toFixed(2)}`;
    const curRange = `\u00b1${maxCur.toFixed(1)}`;
    const rangeRatio = maxCur / maxOrig;

    return (
        <div className="py-5 sm:py-7 px-2 sm:px-4">
            {/* Step selector */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
                {[0, 1, 2, 3, 4, 5, 6].map((n) => {
                    const active = ops === n;
                    const h = healthColor(Math.max(0, cosineSim(ORIGINAL, simulateOps(n))));
                    return (
                        <motion.button key={n} onClick={() => setOps(n)}
                            whileTap={{ scale: 0.9 }}
                            className="relative w-9 h-9 rounded-xl text-[13px] font-bold cursor-pointer"
                            animate={{
                                background: active ? `rgba(${h.rgb},0.15)` : "rgba(255,255,255,0.02)",
                                color: active ? h.color : "rgba(255,255,255,0.2)",
                                borderColor: active ? `rgba(${h.rgb},0.35)` : "rgba(255,255,255,0.05)",
                            }}
                            style={{ border: "1.5px solid" }}>
                            {n}
                            {active && (
                                <motion.div className="absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full"
                                    style={{ background: h.color }} layoutId="drift-step" />
                            )}
                        </motion.button>
                    );
                })}
                <span className="text-[11px] text-white/20 ml-2 font-semibold">blocks</span>
            </div>

            {/* ── Side-by-side bar charts ── */}
            <div className="flex items-start justify-center gap-2 sm:gap-4 max-w-lg mx-auto">
                {/* Original */}
                <div className="flex flex-col items-center flex-1 max-w-[200px]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/60 mb-1">
                        Original
                    </span>
                    <svg viewBox={`0 0 ${BAR_SVG_W} ${BAR_SVG_H}`} className="w-full">
                        {/* Zero line */}
                        <line x1={BAR_PAD.left} y1={BAR_MID_Y} x2={BAR_SVG_W - BAR_PAD.right} y2={BAR_MID_Y}
                            stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
                        {/* Bars */}
                        {ORIGINAL.map((v, i) => {
                            const x = BAR_PAD.left + i * BAR_W_EACH + 2;
                            const barH = Math.abs(v) / globalMax * (BAR_SVG_H / 2 - BAR_PAD.top);
                            const y = v >= 0 ? BAR_MID_Y - barH : BAR_MID_Y;
                            return (
                                <g key={i}>
                                    <motion.rect
                                        x={x} width={BAR_W_EACH - 4} rx={3}
                                        animate={{ y, height: barH }}
                                        transition={{ type: "spring", stiffness: 140, damping: 16 }}
                                        fill={DIM_COLORS[i]} opacity={0.5}
                                    />
                                    <text x={x + (BAR_W_EACH - 4) / 2} y={BAR_SVG_H - 2}
                                        textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.2)"
                                        fontFamily="monospace">{DIM_LABELS[i]}</text>
                                </g>
                            );
                        })}
                        {/* Range label */}
                        <text x={BAR_SVG_W / 2} y={10} textAnchor="middle" fontSize={9}
                            fill="rgba(34,211,238,0.4)" fontFamily="monospace" fontWeight={600}>
                            range: {origRange}
                        </text>
                    </svg>
                </div>

                {/* Arrow / comparison */}
                <div className="flex flex-col items-center justify-center pt-12 gap-1.5">
                    <motion.div animate={{ color: accent }} className="text-[18px] font-light">{"\u2192"}</motion.div>
                    {ops > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center"
                        >
                            <motion.span className="text-[16px] font-bold font-mono tabular-nums"
                                animate={{ color: accent }}>
                                {(similarity * 100).toFixed(0)}%
                            </motion.span>
                            <span className="text-[9px] text-white/20">similar</span>
                            {rangeRatio > 2 && (
                                <span className="text-[9px] font-mono mt-1"
                                    style={{ color: `rgba(${rgb},0.5)` }}>
                                    {rangeRatio.toFixed(1)}{"\u00d7"} wider
                                </span>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Current */}
                <div className="flex flex-col items-center flex-1 max-w-[200px]">
                    <motion.span className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                        animate={{ color: `rgba(${rgb},0.6)` }}>
                        {ops === 0 ? "Same" : `After ${ops} block${ops > 1 ? "s" : ""}`}
                    </motion.span>
                    <svg viewBox={`0 0 ${BAR_SVG_W} ${BAR_SVG_H}`} className="w-full">
                        {/* Zero line */}
                        <line x1={BAR_PAD.left} y1={BAR_MID_Y} x2={BAR_SVG_W - BAR_PAD.right} y2={BAR_MID_Y}
                            stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
                        {/* Ghost original (faint) */}
                        {ops > 0 && ORIGINAL.map((v, i) => {
                            const x = BAR_PAD.left + i * BAR_W_EACH + 2;
                            const barH = Math.abs(v) / globalMax * (BAR_SVG_H / 2 - BAR_PAD.top);
                            const y = v >= 0 ? BAR_MID_Y - barH : BAR_MID_Y;
                            return (
                                <rect key={`g-${i}`} x={x} y={y} width={BAR_W_EACH - 4} height={barH} rx={3}
                                    fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth={1} strokeDasharray="2 2" />
                            );
                        })}
                        {/* Current bars */}
                        {currentVals.map((v, i) => {
                            const x = BAR_PAD.left + i * BAR_W_EACH + 2;
                            const clampedV = Math.max(-globalMax, Math.min(globalMax, v));
                            const barH = Math.abs(clampedV) / globalMax * (BAR_SVG_H / 2 - BAR_PAD.top);
                            const y = clampedV >= 0 ? BAR_MID_Y - barH : BAR_MID_Y;
                            const overflow = Math.abs(v) > globalMax * 0.9;
                            return (
                                <g key={i}>
                                    <motion.rect
                                        x={x} width={BAR_W_EACH - 4} rx={3}
                                        animate={{ y, height: barH }}
                                        transition={{ type: "spring", stiffness: 100, damping: 14, delay: i * 0.03 }}
                                        fill={DIM_COLORS[i]}
                                        opacity={overflow ? 0.8 : 0.5}
                                        style={overflow ? { filter: `drop-shadow(0 0 4px ${DIM_COLORS[i]}40)` } : {}}
                                    />
                                    <text x={x + (BAR_W_EACH - 4) / 2} y={BAR_SVG_H - 2}
                                        textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.2)"
                                        fontFamily="monospace">{DIM_LABELS[i]}</text>
                                </g>
                            );
                        })}
                        {/* Range label */}
                        <motion.text x={BAR_SVG_W / 2} y={10} textAnchor="middle" fontSize={9}
                            fontFamily="monospace" fontWeight={600}
                            animate={{ fill: `rgba(${rgb},0.5)` }}>
                            range: {curRange}
                        </motion.text>
                    </svg>
                </div>
            </div>

            {/* ── Caption ── */}
            <AnimatePresence mode="wait">
                <motion.div key={ops}
                    className="text-center mt-3 max-w-md mx-auto"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <p className="text-[14px] font-semibold" style={{ color: accent }}>
                        {CAPTIONS[ops].title}
                    </p>
                    <p className="text-[12px] mt-1 leading-relaxed" style={{ color: `rgba(${rgb},0.5)` }}>
                        {CAPTIONS[ops].detail}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Takeaway */}
            {ops >= 4 && (
                <motion.div
                    className="flex items-center justify-center gap-2 mt-4 px-4 py-2 rounded-xl mx-auto max-w-sm"
                    style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.1)" }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span className="text-[20px]">{"\u26A0"}</span>
                    <p className="text-[12px] font-semibold" style={{ color: "rgba(244,63,94,0.6)" }}>
                        Values explode without normalization. Training becomes impossible.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
