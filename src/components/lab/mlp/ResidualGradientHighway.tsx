"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  ResidualGradientHighway
  Animated visualization of y = x + F(x) vs y = F(x).
  - Left: input x flows in
  - Center: F(x) processes it (transform block that may weaken signal)
  - Right: x arrives directly via glowing bypass highway
  - Bottom: sum x + F(x) as output
  - Toggle "With Skip" / "Without Skip"
  - Shows ∂y/∂x equation: without = F'(x), with = 1 + F'(x)
  - Gradient flows backward: WITHOUT → dims and vanishes; WITH → stays bright via highway
  ~180 lines
*/

const SVG_W = 400;
const SVG_H = 220;

// Layout positions
const INPUT_X = 40;
const BLOCK_X = 150;
const BLOCK_W = 100;
const OUTPUT_X = 360;
const MAIN_Y = 110;
const SKIP_Y = 40;
const GRAD_Y = 180;

export function ResidualGradientHighway() {
    const [useSkip, setUseSkip] = useState(true);
    const [showGrad, setShowGrad] = useState(false);

    const fPrime = 0.15; // F'(x) — weak gradient through the block
    const totalGrad = useSkip ? 1 + fPrime : fPrime;
    const gradBrightness = Math.min(1, totalGrad);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                    <button
                        onClick={() => { setUseSkip(false); setShowGrad(false); }}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all ${
                            !useSkip
                                ? "bg-red-500/20 text-red-400"
                                : "bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                    >
                        Without Skip
                    </button>
                    <button
                        onClick={() => { setUseSkip(true); setShowGrad(false); }}
                        className={`px-3 py-1.5 text-[10px] font-mono font-bold transition-all border-l border-white/10 ${
                            useSkip
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/[0.02] text-white/30 hover:text-white/50"
                        }`}
                    >
                        With Skip
                    </button>
                </div>
                <button
                    onClick={() => setShowGrad(g => !g)}
                    className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg border transition-all ${
                        showGrad
                            ? "bg-violet-500/20 border-violet-500/30 text-violet-400"
                            : "bg-white/[0.02] border-white/10 text-white/30 hover:text-white/50"
                    }`}
                >
                    {showGrad ? "Hide" : "Show"} Gradient ←
                </button>
            </div>

            {/* Main SVG */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" preserveAspectRatio="xMidYMid meet">

                    {/* ── Forward path: x → F(x) block → output ── */}
                    {/* Input arrow */}
                    <motion.line
                        x1={INPUT_X} y1={MAIN_Y} x2={BLOCK_X - 5} y2={MAIN_Y}
                        stroke={useSkip ? "#22c55e" : "#a78bfa"}
                        strokeWidth={2} animate={{ strokeOpacity: 0.5 }}
                    />
                    <text x={INPUT_X - 5} y={MAIN_Y + 4} textAnchor="end" fontSize={10} fill="white" fillOpacity={0.4} fontFamily="monospace" fontWeight="bold">x</text>

                    {/* F(x) block */}
                    <rect
                        x={BLOCK_X} y={MAIN_Y - 25} width={BLOCK_W} height={50} rx={8}
                        fill="white" fillOpacity={0.03}
                        stroke={useSkip ? "#a78bfa" : "#ef4444"} strokeOpacity={0.3} strokeWidth={1.5}
                    />
                    <text x={BLOCK_X + BLOCK_W / 2} y={MAIN_Y - 4} textAnchor="middle" fontSize={10} fill="white" fillOpacity={0.3} fontFamily="monospace">F(x)</text>
                    <text x={BLOCK_X + BLOCK_W / 2} y={MAIN_Y + 12} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.15} fontFamily="monospace">transform</text>

                    {/* Block → output arrow */}
                    <motion.line
                        x1={BLOCK_X + BLOCK_W + 5} y1={MAIN_Y} x2={OUTPUT_X - 25} y2={MAIN_Y}
                        stroke={useSkip ? "#a78bfa" : "#ef4444"}
                        strokeWidth={2}
                        animate={{ strokeOpacity: useSkip ? 0.3 : 0.5 }}
                    />

                    {/* F'(x) label on main path */}
                    <text
                        x={BLOCK_X + BLOCK_W + 40} y={MAIN_Y - 8}
                        textAnchor="middle" fontSize={7} fill="#ef4444" fillOpacity={0.4} fontFamily="monospace"
                    >
                        F&apos;(x) = {fPrime}
                    </text>

                    {/* ── Skip connection highway ── */}
                    <AnimatePresence>
                        {useSkip && (
                            <>
                                {/* Highway path: arcs over the block */}
                                <motion.path
                                    d={`M${INPUT_X + 30},${MAIN_Y - 15} Q${INPUT_X + 30},${SKIP_Y} ${BLOCK_X + BLOCK_W / 2},${SKIP_Y} Q${OUTPUT_X - 30},${SKIP_Y} ${OUTPUT_X - 30},${MAIN_Y - 15}`}
                                    fill="none" stroke="#22c55e" strokeWidth={3}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.5 }}
                                    exit={{ pathLength: 0, opacity: 0 }}
                                    transition={{ duration: 0.6 }}
                                />
                                {/* "1" label on highway */}
                                <motion.text
                                    x={BLOCK_X + BLOCK_W / 2} y={SKIP_Y - 6}
                                    textAnchor="middle" fontSize={12} fontFamily="monospace" fontWeight="bold"
                                    fill="#22c55e"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.7 }}
                                    exit={{ opacity: 0 }}
                                >
                                    1
                                </motion.text>
                                <motion.text
                                    x={BLOCK_X + BLOCK_W / 2} y={SKIP_Y + 12}
                                    textAnchor="middle" fontSize={6} fontFamily="monospace"
                                    fill="#22c55e" fillOpacity={0.4}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    skip highway
                                </motion.text>
                            </>
                        )}
                    </AnimatePresence>

                    {/* ── Sum / Output node ── */}
                    <circle cx={OUTPUT_X - 10} cy={MAIN_Y} r={12} fill="white" fillOpacity={0.03}
                        stroke={useSkip ? "#22c55e" : "#a78bfa"} strokeOpacity={0.4} strokeWidth={1.5} />
                    <text x={OUTPUT_X - 10} y={MAIN_Y + 3} textAnchor="middle" fontSize={10} fill="white" fillOpacity={0.4} fontFamily="monospace">
                        {useSkip ? "+" : "="}
                    </text>
                    <text x={OUTPUT_X + 8} y={MAIN_Y + 4} fontSize={9} fill="white" fillOpacity={0.4} fontFamily="monospace" fontWeight="bold">y</text>

                    {/* ── Gradient flow (backward) ── */}
                    {showGrad && (
                        <>
                            {/* Main path gradient (always weak) */}
                            <motion.line
                                x1={OUTPUT_X - 25} y1={GRAD_Y} x2={INPUT_X + 5} y2={GRAD_Y}
                                stroke="#ef4444"
                                strokeWidth={2}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: fPrime * 2 }}
                                strokeDasharray="4 3"
                            />
                            <text x={(OUTPUT_X + INPUT_X) / 2} y={GRAD_Y + 12} textAnchor="middle" fontSize={7}
                                fill="#ef4444" fillOpacity={0.5} fontFamily="monospace">
                                F&apos;(x) = {fPrime} {!useSkip && "← vanishing!"}
                            </text>

                            {/* Skip gradient highway (bright) */}
                            {useSkip && (
                                <motion.line
                                    x1={OUTPUT_X - 25} y1={GRAD_Y - 12} x2={INPUT_X + 5} y2={GRAD_Y - 12}
                                    stroke="#22c55e"
                                    strokeWidth={3}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.7 }}
                                />
                            )}
                            {useSkip && (
                                <text x={(OUTPUT_X + INPUT_X) / 2} y={GRAD_Y - 16} textAnchor="middle" fontSize={7}
                                    fill="#22c55e" fillOpacity={0.6} fontFamily="monospace">
                                    1 (highway)
                                </text>
                            )}

                            {/* Arrow label */}
                            <text x={OUTPUT_X - 15} y={GRAD_Y - 2} textAnchor="end" fontSize={7} fill="white" fillOpacity={0.2} fontFamily="monospace">
                                ← ∂y/∂x
                            </text>
                        </>
                    )}
                </svg>
            </div>

            {/* Equation */}
            <div className="text-center space-y-1">
                <p className="text-[11px] font-mono font-bold" style={{ color: useSkip ? "#22c55e" : "#ef4444" }}>
                    {useSkip ? "y = x + F(x)" : "y = F(x)"}
                </p>
                <p className="text-[10px] font-mono text-white/25">
                    ∂y/∂x = {useSkip ? `1 + F'(x) = 1 + ${fPrime} = ` : `F'(x) = `}
                    <span className="font-bold" style={{ color: gradBrightness > 0.5 ? "#22c55e" : "#ef4444" }}>
                        {totalGrad.toFixed(2)}
                    </span>
                    {!useSkip && <span className="text-red-400/60"> ← nearly zero!</span>}
                </p>
            </div>
        </div>
    );
}
