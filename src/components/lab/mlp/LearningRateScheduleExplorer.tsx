"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  LearningRateScheduleExplorer
  Compare constant vs decay vs warmup+decay learning rate schedules.
  Illustrative loss curves showing how schedule affects convergence.
*/

const SCHEDULES = [
    {
        id: "constant",
        label: "Constant (0.01)",
        color: "rgb(244,63,94)",
        lrCurve: Array(10).fill(0.01),
        lossCurve: [3.3, 2.8, 2.5, 2.3, 2.2, 2.15, 2.12, 2.11, 2.12, 2.13],
        desc: "Fast start, but oscillates near the minimum — can't settle.",
        detail: "",
    },
    {
        id: "decay",
        label: "Step Decay",
        color: "rgb(245,158,11)",
        lrCurve: [0.01, 0.01, 0.01, 0.005, 0.005, 0.005, 0.002, 0.002, 0.001, 0.001],
        lossCurve: [3.3, 2.8, 2.5, 2.25, 2.12, 2.05, 2.0, 1.98, 1.97, 1.97],
        desc: "Explores broadly, then fine-tunes. Better final loss.",
        detail: "",
    },
    {
        id: "warmup",
        label: "Warmup + Cosine",
        color: "rgb(16,185,129)",
        lrCurve: [0.001, 0.005, 0.01, 0.009, 0.007, 0.005, 0.003, 0.002, 0.001, 0.0005],
        lossCurve: [3.3, 3.0, 2.6, 2.3, 2.1, 2.0, 1.95, 1.92, 1.91, 1.90],
        desc: "Gentle start avoids early instability. Best final loss.",
        detail: "At the start, weights are random garbage. Large updates could send them wildly off course. Warmup starts with tiny steps, letting the network find a reasonable neighborhood before accelerating.",
    },
];

export function LearningRateScheduleExplorer() {
    const [selected, setSelected] = useState(2);
    const schedule = SCHEDULES[selected];

    const W = 300;
    const H = 120;
    const pad = 30;
    const toX = (i: number) => pad + (i / 9) * (W - 2 * pad);
    const toLossY = (v: number) => pad + ((3.5 - v) / (3.5 - 1.7)) * (H - 2 * pad);
    const toLrY = (v: number) => pad + ((0.012 - v) / 0.012) * (H - 2 * pad);

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Schedule selector */}
            <div className="flex gap-2">
                {SCHEDULES.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => setSelected(i)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold text-center transition-all border ${i === selected
                            ? "bg-white/[0.04] border-white/[0.12]"
                            : "bg-white/[0.02] border-white/[0.06] text-white/20"
                            }`}
                        style={i === selected ? { color: s.color, borderColor: `${s.color}40` } : {}}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Dual chart: LR on top, Loss below */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H + 55}`} className="w-full max-w-md mx-auto">
                    {/* LR mini-chart (top) */}
                    <text x={pad - 3} y={14} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">LR</text>
                    <rect x={pad} y={5} width={W - 2 * pad} height={40} fill="white" fillOpacity={0.01} rx={3} />
                    <polyline
                        points={schedule.lrCurve.map((v, i) => `${toX(i)},${8 + ((0.012 - v) / 0.012) * 34}`).join(" ")}
                        fill="none"
                        stroke={schedule.color}
                        strokeWidth="2"
                        opacity="0.7"
                    />
                    {/* Warmup annotation */}
                    {schedule.id === "warmup" && (
                        <>
                            <rect x={toX(0) - 1} y={6} width={toX(2) - toX(0) + 2} height={38} fill={schedule.color} fillOpacity={0.06} rx={2} />
                            <text x={(toX(0) + toX(2)) / 2} y={48} textAnchor="middle" fill={schedule.color} fillOpacity={0.5} fontSize="5.5" fontFamily="monospace">warmup</text>
                        </>
                    )}

                    {/* Loss chart (bottom) */}
                    <text x={pad - 3} y={68} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">Loss</text>
                    {/* All loss curves (faded) */}
                    {SCHEDULES.map((s, i) => (
                        <polyline
                            key={s.id}
                            points={s.lossCurve.map((v, j) => `${toX(j)},${55 + toLossY(v)}`).join(" ")}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={i === selected ? "2.5" : "1"}
                            opacity={i === selected ? 1 : 0.15}
                        />
                    ))}
                    {/* Y-axis labels */}
                    <text x={pad - 3} y={55 + toLossY(2.0) + 3} textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="6" fontFamily="monospace">2.0</text>
                    <text x={pad - 3} y={55 + toLossY(3.0) + 3} textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="6" fontFamily="monospace">3.0</text>
                    {/* X-axis */}
                    <text x={toX(0)} y={H + 50} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize="6" fontFamily="monospace">0</text>
                    <text x={toX(9)} y={H + 50} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize="6" fontFamily="monospace">steps</text>
                </svg>
            </div>

            {/* Legend */}
            <div className="flex gap-4 justify-center text-[9px] font-mono">
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 rounded" style={{ backgroundColor: schedule.color }} /> Loss</span>
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 rounded" style={{ backgroundColor: schedule.color, opacity: 0.7 }} /> Learning Rate</span>
            </div>

            {/* Description + final loss */}
            <motion.div
                key={selected}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-2"
            >
                <div className="flex justify-between items-start">
                    <p className="text-xs font-mono font-bold" style={{ color: schedule.color }}>{schedule.label}</p>
                    <p className="text-xs font-mono text-white/30">Final: <span className="font-bold" style={{ color: schedule.color }}>{schedule.lossCurve[9].toFixed(2)}</span></p>
                </div>
                <p className="text-[11px] text-white/40">{schedule.desc}</p>
                {schedule.detail && (
                    <p className="text-[10px] text-white/25 leading-relaxed border-t border-white/[0.04] pt-2">{schedule.detail}</p>
                )}
            </motion.div>
        </div>
    );
}
