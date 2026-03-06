"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  ResidualProjectionVisualizer
  For the "Residual Details" hidden panel.
  Explains:
  1. Why it's called "residual" — the network learns the RESIDUAL (difference)
     between desired output and input: F(x) = y_desired - x
  2. Projection layers — when dimensions don't match, a linear projection
     W_s·x is used to make the skip connection work
  3. Interactive: show a numerical example of both concepts
  ~180 lines
*/

type Tab = "why_residual" | "projection";

// Example data for "why residual"
const X_INPUT = [0.8, -0.3, 0.5, 0.9];
const Y_DESIRED = [1.0, -0.1, 0.7, 0.85];
const RESIDUAL = Y_DESIRED.map((y, i) => y - X_INPUT[i]); // [0.2, 0.2, 0.2, -0.05]

// Example data for projection
const X_3D = [0.8, -0.3, 0.5];
const W_PROJ = [
    [0.6, 0.2, -0.1, 0.3],
    [-0.3, 0.8, 0.4, 0.1],
    [0.1, -0.2, 0.7, 0.5],
]; // 3×4 projection matrix
const X_PROJ = W_PROJ[0].map((_, j) =>
    X_3D.reduce((sum, x, i) => sum + x * W_PROJ[i][j], 0)
); // 4D output

export function ResidualProjectionVisualizer() {
    const [tab, setTab] = useState<Tab>("why_residual");

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Tab selector */}
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
                <button
                    onClick={() => setTab("why_residual")}
                    className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold transition-all ${
                        tab === "why_residual"
                            ? "bg-violet-500/20 text-violet-400"
                            : "bg-white/[0.02] text-white/30 hover:text-white/50"
                    }`}
                >
                    Why &quot;Residual&quot;?
                </button>
                <button
                    onClick={() => setTab("projection")}
                    className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold transition-all border-l border-white/10 ${
                        tab === "projection"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-white/[0.02] text-white/30 hover:text-white/50"
                    }`}
                >
                    Dimension Projection
                </button>
            </div>

            <AnimatePresence mode="wait">
                {tab === "why_residual" ? (
                    <motion.div
                        key="residual"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-3"
                    >
                        {/* Equation */}
                        <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.04] p-3 text-center space-y-2">
                            <p className="text-[11px] font-mono font-bold text-violet-400">
                                y = x + F(x) &nbsp;⟹&nbsp; F(x) = y − x
                            </p>
                            <p className="text-[9px] font-mono text-white/25">
                                The network learns F(x) = <span className="text-violet-400/60">the residual</span> (difference between desired output and input)
                            </p>
                        </div>

                        {/* Numerical example */}
                        <div className="space-y-1.5">
                            <VectorRow label="Input x" values={X_INPUT} color="#f59e0b" />
                            <VectorRow label="Desired y" values={Y_DESIRED} color="#22c55e" />
                            <div className="flex items-center gap-2 px-2">
                                <span className="text-[8px] font-mono text-white/15 w-20">y − x =</span>
                                <div className="flex-1 border-t border-dashed border-white/10" />
                            </div>
                            <VectorRow label="Residual F(x)" values={RESIDUAL} color="#a78bfa" highlight />
                        </div>

                        {/* Explanation */}
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-1.5">
                            <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                                Instead of learning the full transformation x → y, the network only learns the <span className="text-violet-400/50 font-bold">small correction</span> needed.
                            </p>
                            <p className="text-[9px] font-mono text-white/25 leading-relaxed">
                                In this example, the corrections are tiny: <span className="text-violet-400/50">{RESIDUAL.map(r => (r >= 0 ? "+" : "") + r.toFixed(2)).join(", ")}</span>.
                                Learning small corrections is much easier than learning the entire mapping from scratch.
                            </p>
                            <p className="text-[8px] font-mono text-white/15 leading-relaxed">
                                If a layer has nothing useful to add, it can learn F(x) ≈ 0, and the output equals the input — the layer becomes an identity function. This is impossible without residual connections.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="projection"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-3"
                    >
                        {/* Problem statement */}
                        <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3 text-center space-y-1">
                            <p className="text-[10px] font-mono font-bold text-amber-400">
                                Problem: y = x + F(x) requires same dimensions!
                            </p>
                            <p className="text-[9px] font-mono text-white/25">
                                If x is 3D but F(x) outputs 4D, we can&apos;t add them. Solution: <span className="text-amber-400/60">project x</span>
                            </p>
                        </div>

                        {/* Numerical example */}
                        <div className="space-y-1.5">
                            <VectorRow label="Input x (3D)" values={X_3D} color="#f59e0b" />

                            {/* Projection matrix */}
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                                <p className="text-[8px] font-mono text-white/20 mb-1.5 text-center">W_s projection matrix (3×4)</p>
                                <div className="flex justify-center gap-px">
                                    {W_PROJ.map((row, r) => (
                                        <div key={r} className="flex flex-col gap-px">
                                            {row.map((v, c) => (
                                                <span key={c} className="w-10 h-5 flex items-center justify-center text-[7px] font-mono text-white/20 bg-white/[0.02] rounded-sm tabular-nums">
                                                    {v.toFixed(1)}
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <VectorRow label="W_s·x (4D)" values={X_PROJ} color="#a78bfa" />
                        </div>

                        {/* Result */}
                        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3 text-center space-y-1">
                            <p className="text-[10px] font-mono font-bold text-emerald-400">
                                y = W_s·x + F(x)
                            </p>
                            <p className="text-[9px] font-mono text-white/25">
                                Now both terms are 4D — the addition works! W_s is learned during training.
                            </p>
                        </div>

                        <p className="text-[8px] font-mono text-white/15 leading-relaxed text-center">
                            This is called a <span className="text-white/30 font-bold">1×1 convolution</span> or <span className="text-white/30 font-bold">linear projection</span>.
                            It only adds one small matrix per dimension change — minimal overhead.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function VectorRow({ label, values, color, highlight }: {
    label: string; values: number[]; color: string; highlight?: boolean;
}) {
    return (
        <div className="flex items-center gap-2 px-2">
            <span className="text-[8px] font-mono font-bold w-20 shrink-0" style={{ color }}>{label}</span>
            <div className="flex gap-1 flex-1">
                {values.map((v, i) => (
                    <motion.span
                        key={i}
                        initial={highlight ? { scale: 0 } : undefined}
                        animate={highlight ? { scale: 1 } : undefined}
                        transition={highlight ? { delay: i * 0.08, type: "spring" } : undefined}
                        className="px-2 py-1 rounded text-[9px] font-mono font-bold tabular-nums border"
                        style={{
                            backgroundColor: color + (highlight ? "15" : "0a"),
                            borderColor: color + (highlight ? "30" : "15"),
                            color,
                        }}
                    >
                        {v >= 0 ? "+" : ""}{v.toFixed(2)}
                    </motion.span>
                ))}
            </div>
        </div>
    );
}
