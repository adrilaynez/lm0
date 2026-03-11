"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  OverfittingDualCurveViz — VIZ 11

  Train vs val loss diverging at higher model depths.
  The 12-block model memorizes: train=0.78 but val=1.48.
  Teaches the fundamental ML concept of overfitting through real Transformer data.

  - SVG chart with two lines (train solid cyan, val dashed rose)
  - Gap region colored green→rose as it grows
  - Annotations at sweet spot (4 blocks) and overfitting zone (12 blocks)
  - Hover any point for exact values
  - Lines draw themselves left to right
*/

interface DataPoint {
    blocks: number;
    train_loss: number;
    val_loss: number;
    label: string;
}

const DATA: DataPoint[] = [
    { blocks: 1,  train_loss: 1.424, val_loss: 1.538, label: "1 block" },
    { blocks: 2,  train_loss: 1.274, val_loss: 1.373, label: "2 blocks" },
    { blocks: 4,  train_loss: 1.154, val_loss: 1.301, label: "4 blocks" },
    { blocks: 8,  train_loss: 0.948, val_loss: 1.343, label: "8 blocks" },
    { blocks: 12, train_loss: 0.783, val_loss: 1.482, label: "12 blocks" },
];

/* Chart dimensions */
const W = 440;
const H = 220;
const PAD = { top: 28, right: 30, bottom: 36, left: 52 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

/* Scale helpers */
const xPositions = DATA.map((_, i) => PAD.left + (i / (DATA.length - 1)) * CW);
const yMin = 0.6;
const yMax = 1.7;
const yScale = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * CH;

/* Build path strings */
function buildPath(key: "train_loss" | "val_loss"): string {
    return DATA.map((d, i) => `${i === 0 ? "M" : "L"}${xPositions[i].toFixed(1)},${yScale(d[key]).toFixed(1)}`).join(" ");
}

/* Build gap polygon */
function buildGapPath(): string {
    const top = DATA.map((d, i) => `${xPositions[i].toFixed(1)},${yScale(d.val_loss).toFixed(1)}`);
    const bot = DATA.map((d, i) => `${xPositions[i].toFixed(1)},${yScale(d.train_loss).toFixed(1)}`).reverse();
    return `M${top.join(" L")} L${bot.join(" L")} Z`;
}

export function OverfittingDualCurveViz() {
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [progress, setProgress] = useState(0); /* 0→1 for draw animation */
    const animRef = useRef<number>(0);

    /* Animate lines drawing */
    useEffect(() => {
        let start: number | null = null;
        const duration = 1800;
        const tick = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            setProgress(p);
            if (p < 1) animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const trainPath = buildPath("train_loss");
    const valPath = buildPath("val_loss");
    const gapPath = buildGapPath();
    const totalLen = 600; /* approximate path length for dash animation */

    const hovered = hoverIdx !== null ? DATA[hoverIdx] : null;
    const gap = hovered ? (hovered.val_loss - hovered.train_loss).toFixed(3) : null;

    /* Y-axis ticks */
    const yTicks = [0.8, 1.0, 1.2, 1.4, 1.6];

    return (
        <div className="flex flex-col items-center gap-4 w-full py-4 px-2">
            {/* ── SVG Chart ── */}
            <div className="w-full max-w-[480px] mx-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
                    <defs>
                        {/* Gap gradient: green at left, rose at right */}
                        <linearGradient id="gap-grad" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stopColor="rgba(52,211,153,0.08)" />
                            <stop offset="40%" stopColor="rgba(52,211,153,0.06)" />
                            <stop offset="70%" stopColor="rgba(244,63,94,0.08)" />
                            <stop offset="100%" stopColor="rgba(244,63,94,0.15)" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {yTicks.map(v => (
                        <g key={v}>
                            <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)}
                                stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
                            <text x={PAD.left - 8} y={yScale(v) + 3} textAnchor="end"
                                fontSize={9} fontFamily="monospace" fill="rgba(255,255,255,0.2)">
                                {v.toFixed(1)}
                            </text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {DATA.map((d, i) => (
                        <text key={i} x={xPositions[i]} y={H - 10} textAnchor="middle"
                            fontSize={9} fontFamily="monospace"
                            fill={hoverIdx === i ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}>
                            {d.blocks}
                        </text>
                    ))}
                    <text x={W / 2} y={H - 0} textAnchor="middle"
                        fontSize={8} fill="rgba(255,255,255,0.15)">blocks</text>
                    <text x={12} y={H / 2} textAnchor="middle"
                        fontSize={8} fill="rgba(255,255,255,0.15)"
                        transform={`rotate(-90,12,${H / 2})`}>loss</text>

                    {/* Gap region */}
                    <motion.path
                        d={gapPath}
                        fill="url(#gap-grad)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: progress > 0.5 ? 0.8 : 0 }}
                        transition={{ duration: 0.6 }}
                    />

                    {/* Train line (solid cyan) */}
                    <motion.path
                        d={trainPath}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={totalLen}
                        animate={{ strokeDashoffset: totalLen * (1 - progress) }}
                        style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.3))" }}
                    />

                    {/* Val line (dashed rose) */}
                    <motion.path
                        d={valPath}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={`${totalLen} ${totalLen}`}
                        animate={{ strokeDashoffset: totalLen * (1 - progress) }}
                        style={{ filter: "drop-shadow(0 0 4px rgba(244,63,94,0.25))" }}
                    />
                    {/* Dashed overlay for val line */}
                    {progress > 0.95 && (
                        <path
                            d={valPath}
                            fill="none"
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            strokeLinecap="round"
                        />
                    )}
                    {progress > 0.95 && (
                        <path
                            d={valPath}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            strokeLinecap="round"
                            style={{ filter: "drop-shadow(0 0 4px rgba(244,63,94,0.25))" }}
                        />
                    )}

                    {/* Data points */}
                    {DATA.map((d, i) => {
                        const visible = progress >= (i / (DATA.length - 1)) * 0.8 + 0.15;
                        if (!visible) return null;
                        const isHov = hoverIdx === i;
                        return (
                            <g key={i}
                                onMouseEnter={() => setHoverIdx(i)}
                                onMouseLeave={() => setHoverIdx(null)}
                                style={{ cursor: "pointer" }}>
                                {/* Hover target (invisible larger area) */}
                                <rect x={xPositions[i] - 18} y={PAD.top - 5}
                                    width={36} height={CH + 10}
                                    fill="transparent" />

                                {/* Vertical guide on hover */}
                                {isHov && (
                                    <line x1={xPositions[i]} y1={PAD.top}
                                        x2={xPositions[i]} y2={PAD.top + CH}
                                        stroke="rgba(255,255,255,0.08)" strokeWidth={1}
                                        strokeDasharray="3 3" />
                                )}

                                {/* Train dot */}
                                <motion.circle
                                    cx={xPositions[i]} cy={yScale(d.train_loss)} r={isHov ? 5 : 3.5}
                                    fill="#22d3ee"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    style={{ filter: isHov ? "drop-shadow(0 0 6px rgba(34,211,238,0.5))" : "none" }}
                                />
                                {/* Val dot */}
                                <motion.circle
                                    cx={xPositions[i]} cy={yScale(d.val_loss)} r={isHov ? 5 : 3.5}
                                    fill="#f43f5e"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.15 }}
                                    style={{ filter: isHov ? "drop-shadow(0 0 6px rgba(244,63,94,0.5))" : "none" }}
                                />
                            </g>
                        );
                    })}

                    {/* ── Annotation: Sweet spot at 4 blocks ── */}
                    {progress > 0.9 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            <rect x={xPositions[2] - 28} y={yScale(DATA[2].val_loss) - 20}
                                width={56} height={16} rx={5}
                                fill="rgba(52,211,153,0.12)" stroke="rgba(52,211,153,0.3)" strokeWidth={0.8} />
                            <text x={xPositions[2]} y={yScale(DATA[2].val_loss) - 9}
                                textAnchor="middle" fontSize={8} fontWeight={700} fill="#34d399">
                                Sweet spot {"\u2713"}
                            </text>
                        </motion.g>
                    )}

                    {/* ── Annotation: Overfitting at 12 blocks ── */}
                    {progress > 0.95 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                            <rect x={xPositions[4] - 48} y={yScale((DATA[4].train_loss + DATA[4].val_loss) / 2) - 8}
                                width={96} height={30} rx={6}
                                fill="rgba(244,63,94,0.08)" stroke="rgba(244,63,94,0.2)" strokeWidth={0.8} />
                            <text x={xPositions[4]} y={yScale((DATA[4].train_loss + DATA[4].val_loss) / 2) + 3}
                                textAnchor="middle" fontSize={7.5} fontWeight={600} fill="rgba(244,63,94,0.7)">
                                Train: 0.78 {"\u2014"} amazing!
                            </text>
                            <text x={xPositions[4]} y={yScale((DATA[4].train_loss + DATA[4].val_loss) / 2) + 14}
                                textAnchor="middle" fontSize={7.5} fontWeight={600} fill="rgba(244,63,94,0.7)">
                                Val: 1.48 {"\u2014"} terrible.
                            </text>
                        </motion.g>
                    )}
                </svg>
            </div>

            {/* ── Legend ── */}
            <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-0.5 rounded-full" style={{ background: "#22d3ee" }} />
                    <span className="text-[11px] text-white/35 font-semibold">Train loss</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-0.5 rounded-full" style={{ background: "#f43f5e", backgroundImage: "repeating-linear-gradient(90deg, #f43f5e 0 4px, transparent 4px 7px)" }} />
                    <span className="text-[11px] text-white/35 font-semibold">Val loss</span>
                </div>
            </div>

            {/* ── Hover detail ── */}
            <AnimatePresence mode="wait">
                {hovered && (
                    <motion.div
                        key={hoverIdx}
                        className="flex items-center gap-4 px-4 py-2 rounded-xl"
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                    >
                        <span className="text-[12px] font-bold text-white/50">{hovered.label}</span>
                        <span className="text-[11px]">
                            <span className="text-cyan-400/70 font-mono">{hovered.train_loss.toFixed(3)}</span>
                            <span className="text-white/15 mx-1">/</span>
                            <span className="text-rose-400/70 font-mono">{hovered.val_loss.toFixed(3)}</span>
                        </span>
                        <span className="text-[10px] font-mono"
                            style={{
                                color: Number(gap) > 0.2 ? "rgba(244,63,94,0.6)" : "rgba(52,211,153,0.5)",
                            }}>
                            gap: {gap}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Caption ── */}
            <p className="text-[12px] text-center text-white/25 max-w-sm leading-relaxed">
                Training loss always decreases with more parameters. But{" "}
                <span className="font-semibold text-rose-400/50">validation loss</span>{" "}
                reveals the truth: past 4 blocks, the model memorizes instead of learning.
            </p>
        </div>
    );
}
