"use client";

import { useCallback, useMemo, useState } from "react";

import { motion } from "framer-motion";

/*
  SquaredVsCrossEntropy — Compact redesign
  Smooth SVG curves comparing squared error vs cross-entropy.
  Slider for P(correct). Small footprint.
*/

const W = 320;
const H = 150;
const PL = 32;
const PR = 8;
const PT = 8;
const PB = 18;
const PW = W - PL - PR;
const PH = H - PT - PB;

function sqErr(p: number) { return (1 - p) ** 2; }
function crossEnt(p: number) { return -Math.log(Math.max(p, 1e-6)); }

const CE_CAP = 4.6; // cap display at ~ce(0.01) for visual
function toX(p: number) { return PL + p * PW; }
function toYSq(v: number) { return PT + (1 - Math.min(v, 1)) * PH; }
function toYCe(v: number) { return PT + (1 - Math.min(v / CE_CAP, 1)) * PH; }

function smoothPath(fn: (p: number) => number, toY: (v: number) => number, steps = 80): string {
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
        const p = 0.01 + (i / steps) * 0.99;
        pts.push([toX(p), toY(fn(p))]);
    }
    // Catmull-Rom → cubic bezier for smooth curve
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
}

export function SquaredVsCrossEntropy() {
    const [prob, setProb] = useState(0.3);

    const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setProb(Number(e.target.value));
    }, []);

    const sqVal = sqErr(prob);
    const ceVal = crossEnt(prob);
    const mx = toX(prob);

    const sqPath = useMemo(() => smoothPath(sqErr, toYSq), []);
    const cePath = useMemo(() => smoothPath(crossEnt, toYCe), []);

    const ratio = sqVal > 0.001 ? ceVal / sqVal : 0;

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {/* Compact slider */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-white/30 shrink-0">P(correct)</span>
                <input
                    type="range" min={0.01} max={0.99} step={0.01}
                    value={prob} onChange={handleSlider}
                    className="flex-1 accent-violet-500 h-1.5"
                />
                <span className="text-sm font-mono font-bold tabular-nums text-violet-400 w-10 text-right">{prob.toFixed(2)}</span>
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map(t => (
                        <line key={t} x1={toX(t)} y1={PT} x2={toX(t)} y2={PT + PH}
                            stroke="white" strokeOpacity={0.03} />
                    ))}

                    {/* Axes */}
                    <line x1={PL} y1={PT + PH} x2={PL + PW} y2={PT + PH} stroke="white" strokeOpacity={0.06} />
                    <line x1={PL} y1={PT} x2={PL} y2={PT + PH} stroke="white" strokeOpacity={0.06} />

                    {/* Filled area under curves */}
                    <path d={`${sqPath} L${toX(1)},${PT + PH} L${toX(0.01)},${PT + PH} Z`}
                        fill="#60a5fa" fillOpacity={0.04} />
                    <path d={`${cePath} L${toX(1)},${PT + PH} L${toX(0.01)},${PT + PH} Z`}
                        fill="#f43f5e" fillOpacity={0.04} />

                    {/* Curves */}
                    <path d={sqPath} fill="none" stroke="#60a5fa" strokeWidth={2.5} strokeOpacity={0.8} strokeLinecap="round" />
                    <path d={cePath} fill="none" stroke="#f43f5e" strokeWidth={2.5} strokeOpacity={0.8} strokeLinecap="round" />

                    {/* Marker */}
                    <line x1={mx} y1={PT} x2={mx} y2={PT + PH}
                        stroke="white" strokeOpacity={0.08} strokeDasharray="2,3" />
                    <motion.circle r={4.5} fill="#60a5fa" stroke="#0f172a" strokeWidth={1.5}
                        animate={{ cx: mx, cy: toYSq(sqVal) }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                    <motion.circle r={4.5} fill="#f43f5e" stroke="#0f172a" strokeWidth={1.5}
                        animate={{ cx: mx, cy: toYCe(ceVal) }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }} />

                    {/* Axis labels */}
                    <text x={PL} y={H - 3} fontSize={6} fill="white" fillOpacity={0.15} fontFamily="monospace">0</text>
                    <text x={PL + PW} y={H - 3} fontSize={6} fill="white" fillOpacity={0.15} fontFamily="monospace" textAnchor="end">1.0</text>
                    <text x={PL + PW / 2} y={H - 3} fontSize={6} fill="white" fillOpacity={0.12} fontFamily="monospace" textAnchor="middle">P(correct)</text>
                </svg>
            </div>

            {/* Legend + values — compact row */}
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-blue-500/10 bg-blue-500/[0.03] px-3 py-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400/80 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[8px] font-mono text-blue-400/60">Squared Error (1−p)²</p>
                        <p className="text-sm font-mono font-bold text-blue-300 tabular-nums">{sqVal.toFixed(3)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/10 bg-rose-500/[0.03] px-3 py-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[8px] font-mono text-rose-400/60">Cross-Entropy −log(p)</p>
                        <p className="text-sm font-mono font-bold text-rose-300 tabular-nums">{ceVal.toFixed(3)}</p>
                    </div>
                </div>
            </div>

            {/* Dynamic insight — one line */}
            <p className="text-[9px] font-mono text-white/25 text-center leading-relaxed">
                {prob < 0.15 ? (
                    <>Cross-entropy is <strong className="text-rose-400">{ratio.toFixed(0)}× larger</strong> — it punishes confident mistakes brutally</>
                ) : prob < 0.5 ? (
                    <>Cross-entropy ({ceVal.toFixed(2)}) is <strong className="text-white/40">{ratio.toFixed(1)}×</strong> the squared error ({sqVal.toFixed(2)}) — stronger learning signal</>
                ) : prob < 0.9 ? (
                    <>Both are small, but cross-entropy still pushes harder toward certainty</>
                ) : (
                    <>Near-perfect prediction — both losses approach zero</>
                )}
            </p>
        </div>
    );
}
