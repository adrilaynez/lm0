"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  V31 — HeadBudgetViz
  Total dim: 512. Slider: number of heads (1,2,4,8,16,32).
  Per-head dim auto-calculates. Sweet spot annotation at 8.
*/

const TOTAL_DIM = 512;
const HEAD_OPTIONS = [1, 2, 4, 8, 16, 32, 64];

function getVerdict(heads: number): { text: string; color: string } {
    if (heads === 1) return { text: "One head — sees one thing well, misses everything else", color: "#fbbf24" };
    if (heads === 2) return { text: "Two perspectives — better, but still limited", color: "#fbbf24" };
    if (heads === 4) return { text: "Four heads — starting to capture multiple patterns", color: "rgba(34,211,238,0.7)" };
    if (heads === 8) return { text: "Sweet spot — rich perspectives, each head still has room to learn", color: "#22d3ee" };
    if (heads === 16) return { text: "Many perspectives — each head is narrower but still useful", color: "rgba(34,211,238,0.7)" };
    if (heads === 32) return { text: "Very fine-grained — some heads might be redundant", color: "#fbbf24" };
    return { text: "Extreme — each head can barely represent anything (8 dims each)", color: "#fbbf24" };
}

export function HeadBudgetViz() {
    const [headIdx, setHeadIdx] = useState(3); // default = 8 heads
    const heads = HEAD_OPTIONS[headIdx];
    const perHead = TOTAL_DIM / heads;
    const verdict = getVerdict(heads);
    const isSweetSpot = heads === 8;
    const pct = headIdx / (HEAD_OPTIONS.length - 1);

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-4 space-y-6" style={{ minHeight: 260 }}>
            {/* Slider */}
            <div className="max-w-md mx-auto space-y-3">
                <div className="flex items-baseline justify-between">
                    <span className="text-[13px] text-white/50 font-medium">Number of heads</span>
                    <motion.span
                        className="text-2xl sm:text-3xl font-mono font-bold tabular-nums"
                        style={{ color: isSweetSpot ? "#22d3ee" : "rgba(255,255,255,0.7)" }}
                        key={heads}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {heads}
                    </motion.span>
                </div>
                <div className="relative">
                    <input
                        type="range"
                        min={0} max={HEAD_OPTIONS.length - 1} step={1}
                        value={headIdx}
                        onChange={e => setHeadIdx(Number(e.target.value))}
                        className="nev-slider w-full"
                        style={{
                            background: `linear-gradient(90deg, rgba(34,211,238,0.45) ${pct * 100}%, rgba(255,255,255,0.06) ${pct * 100}%)`,
                        }}
                    />
                </div>
                <div className="flex justify-between text-[11px] text-white/30 font-mono">
                    <span>1 head</span>
                    <span>64 heads</span>
                </div>
            </div>

            {/* Visual: head blocks */}
            <div className="max-w-lg mx-auto">
                <div className="flex gap-1 flex-wrap justify-center">
                    {Array.from({ length: Math.min(heads, 32) }).map((_, i) => {
                        const t = i / Math.max(1, Math.min(heads, 32) - 1);
                        /* Interpolate cyan → amber across the heads */
                        const r = Math.round(34 + t * (251 - 34));
                        const g = Math.round(211 + t * (191 - 211));
                        const b = Math.round(238 + t * (36 - 238));
                        return (
                            <motion.div
                                key={i}
                                className="rounded-md"
                                style={{
                                    width: Math.max(10, Math.min(44, 360 / heads)),
                                    height: Math.max(28, Math.min(48, perHead / 3.5)),
                                    background: `rgba(${r},${g},${b},0.35)`,
                                    border: `1px solid rgba(${r},${g},${b},0.3)`,
                                    boxShadow: `0 0 ${6 + t * 4}px rgba(${r},${g},${b},0.12)`,
                                }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.012, type: "spring", stiffness: 200 }}
                            />
                        );
                    })}
                    {heads > 32 && (
                        <span className="text-white/30 text-[11px] self-center ml-1.5 font-mono">+{heads - 32}</span>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center items-center gap-3 sm:gap-5">
                <div
                    className="text-center px-4 py-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <p className="text-xl sm:text-2xl font-mono font-bold text-white/70 tabular-nums">{heads}</p>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider font-medium">heads</p>
                </div>
                <span className="text-white/20 text-sm font-light">&times;</span>
                <div
                    className="text-center px-4 py-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <p className="text-xl sm:text-2xl font-mono font-bold text-white/70 tabular-nums">{perHead}</p>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider font-medium">dims per head</p>
                </div>
                <span className="text-white/20 text-sm font-light">=</span>
                <div
                    className="text-center px-4 py-2.5 rounded-xl"
                    style={{
                        background: "rgba(34,211,238,0.06)",
                        border: "1px solid rgba(34,211,238,0.15)",
                    }}
                >
                    <p className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 tabular-nums">{TOTAL_DIM}</p>
                    <p className="text-[10px] text-cyan-400/50 uppercase tracking-wider font-medium">total dims</p>
                </div>
            </div>

            {/* Verdict */}
            <motion.div
                className="max-w-md mx-auto px-5 py-3 rounded-xl text-center"
                style={{
                    background: isSweetSpot
                        ? "rgba(34,211,238,0.06)"
                        : "rgba(255,255,255,0.02)",
                    borderLeft: isSweetSpot
                        ? "3px solid rgba(34,211,238,0.5)"
                        : "3px solid rgba(255,255,255,0.1)",
                }}
                key={heads}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <p className="text-[14px] font-medium leading-relaxed" style={{ color: verdict.color }}>
                    {verdict.text}
                </p>
            </motion.div>
        </div>
    );
}
