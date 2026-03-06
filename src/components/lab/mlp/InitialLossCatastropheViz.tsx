"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp } from "lucide-react";

/*
  InitialLossCatastropheViz
  Shows initial losses from depth comparison experiments.
  Deep models start WORSE than random guessing.
  Uses real initial val_loss data from depth_new_comparison training.
*/

interface DepthInitData {
    layers: number;
    initialValLoss: number;
    finalValLoss: number;
    params: number;
}

const RANDOM_LOSS = Math.log(27); // ≈ 3.296

const DEPTH_INIT_DATA: DepthInitData[] = [
    { layers: 1,  initialValLoss: 3.23, finalValLoss: 2.13, params: 9140 },
    { layers: 2,  initialValLoss: 5.12, finalValLoss: 2.31, params: 25652 },
    { layers: 3,  initialValLoss: 4.70, finalValLoss: 2.27, params: 42164 },
    { layers: 4,  initialValLoss: 2.82, finalValLoss: 2.21, params: 58676 },
    { layers: 6,  initialValLoss: 3.49, finalValLoss: 3.04, params: 91700 },
    { layers: 8,  initialValLoss: 3.04, finalValLoss: 2.92, params: 124724 },
    { layers: 10, initialValLoss: 3.87, finalValLoss: 3.00, params: 157748 },
    { layers: 12, initialValLoss: 4.20, finalValLoss: 3.00, params: 190772 },
    { layers: 16, initialValLoss: 3.76, finalValLoss: 2.90, params: 256820 },
    { layers: 20, initialValLoss: 3.17, finalValLoss: 3.15, params: 322868 },
];

const COLORS: Record<number, string> = {
    1: "#22c55e", 2: "#10b981", 3: "#14b8a6", 4: "#06b6d4",
    6: "#f59e0b", 8: "#f97316", 10: "#ef4444", 12: "#ec4899",
    16: "#a855f7", 20: "#6366f1",
};

function fmtParams(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

export function InitialLossCatastropheViz() {
    const [showFinal, setShowFinal] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const maxLoss = Math.max(...DEPTH_INIT_DATA.map(d => d.initialValLoss)) * 1.08;
    const worseCount = DEPTH_INIT_DATA.filter(d => d.initialValLoss > RANDOM_LOSS).length;
    const worstInit = DEPTH_INIT_DATA.reduce((a, b) => a.initialValLoss > b.initialValLoss ? a : b);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400/60" />
                    <span className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
                        Initial Loss at Step 0 — Before Any Training
                    </span>
                </div>
                <button
                    onClick={() => setShowFinal(!showFinal)}
                    className="text-[8px] font-mono px-2 py-1 rounded-lg border transition-colors"
                    style={{
                        borderColor: showFinal ? "#22c55e30" : "#a78bfa30",
                        color: showFinal ? "#22c55e" : "#a78bfa",
                        backgroundColor: showFinal ? "#22c55e08" : "#a78bfa08",
                    }}
                >
                    {showFinal ? "Showing: Initial + Final" : "Show Final Loss Too"}
                </button>
            </div>

            {/* Bar chart */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 space-y-1.5">
                {DEPTH_INIT_DATA.map((d, i) => {
                    const color = COLORS[d.layers] ?? "#a78bfa";
                    const pctInit = (d.initialValLoss / maxLoss) * 100;
                    const pctFinal = (d.finalValLoss / maxLoss) * 100;
                    const aboveRandom = d.initialValLoss > RANDOM_LOSS;
                    const isHov = hoveredIdx === i;

                    return (
                        <motion.div
                            key={d.layers}
                            className="flex items-center gap-2 cursor-default"
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <span className={`text-[10px] font-mono font-bold w-8 shrink-0 text-right ${aboveRandom ? "text-red-400/70" : "text-white/40"}`}>
                                {d.layers}L
                            </span>
                            <div className="flex-1 h-5 rounded-md bg-white/[0.03] relative overflow-hidden">
                                {/* Initial loss bar */}
                                <motion.div
                                    className="absolute inset-y-0 left-0 rounded-md"
                                    style={{
                                        background: aboveRandom ? `${color}` : `${color}80`,
                                        opacity: isHov ? 0.8 : 0.5,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pctInit}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.04 }}
                                />
                                {/* Final loss bar (overlay) */}
                                {showFinal && (
                                    <motion.div
                                        className="absolute inset-y-0 left-0 rounded-md border-r-2"
                                        style={{
                                            borderColor: "#22c55e",
                                            background: "#22c55e15",
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pctFinal}%` }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}
                                {/* Random baseline */}
                                <div
                                    className="absolute top-0 bottom-0 w-px"
                                    style={{ left: `${(RANDOM_LOSS / maxLoss) * 100}%`, background: "#ef444450" }}
                                />
                                {/* Value */}
                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold ${aboveRandom ? "text-red-300/80" : "text-white/35"}`}>
                                    {d.initialValLoss.toFixed(2)}
                                    {aboveRandom && " ⚠"}
                                    {showFinal && (
                                        <span className="text-emerald-400/60 ml-1">→ {d.finalValLoss.toFixed(2)}</span>
                                    )}
                                </span>
                            </div>
                            <span className="text-[8px] font-mono text-white/15 w-10 shrink-0 text-right">
                                {fmtParams(d.params)}
                            </span>
                        </motion.div>
                    );
                })}
                {/* Random baseline label */}
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-8" />
                    <div className="flex-1 relative h-3">
                        <span
                            className="absolute text-[7px] font-mono text-red-400/40"
                            style={{ left: `${(RANDOM_LOSS / maxLoss) * 100}%`, transform: "translateX(-50%)" }}
                        >
                            ↑ random guess ({RANDOM_LOSS.toFixed(2)})
                        </span>
                    </div>
                </div>
            </div>

            {/* Insight cards */}
            <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400/60" />
                        <span className="text-[10px] font-mono font-bold text-red-400/70">Worse Than Random</span>
                    </div>
                    <p className="text-lg font-mono font-black text-red-400/80">
                        {worseCount}/{DEPTH_INIT_DATA.length} models
                    </p>
                    <p className="text-[9px] font-mono text-white/25 leading-relaxed">
                        {worseCount} out of {DEPTH_INIT_DATA.length} models start with loss ABOVE random guessing ({RANDOM_LOSS.toFixed(2)}). The worst is L{worstInit.layers} at {worstInit.initialValLoss.toFixed(2)} — the model is confidently wrong from the start.
                    </p>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400/60" />
                        <span className="text-[10px] font-mono font-bold text-amber-400/70">Starting Handicap</span>
                    </div>
                    <p className="text-lg font-mono font-black text-amber-400/80">
                        {(worstInit.initialValLoss - RANDOM_LOSS).toFixed(1)}× worse
                    </p>
                    <p className="text-[9px] font-mono text-white/25 leading-relaxed">
                        A model starting at loss {worstInit.initialValLoss.toFixed(2)} must first UNLEARN its bad predictions before it can start learning good ones. Deep models dig themselves into a hole that they spend the entire training trying to climb out of.
                    </p>
                </div>
            </div>
        </div>
    );
}
