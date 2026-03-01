"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  TanhSaturationDemo
  Drag x value, see tanh output + derivative. Shows the "dead zone" where gradient ≈ 0.
*/

export function TanhSaturationDemo() {
    const [x, setX] = useState(0);

    const tanhVal = Math.tanh(x);
    const derivative = 1 - tanhVal * tanhVal; // sech²(x)

    // Generate curve points
    const curvePoints: { x: number; y: number }[] = [];
    for (let xi = -4; xi <= 4; xi += 0.1) {
        curvePoints.push({ x: xi, y: Math.tanh(xi) });
    }
    const derivPoints: { x: number; y: number }[] = [];
    for (let xi = -4; xi <= 4; xi += 0.1) {
        const t = Math.tanh(xi);
        derivPoints.push({ x: xi, y: 1 - t * t });
    }

    const W = 320;
    const H = 180;
    const pad = 30;
    const toSvgX = (v: number) => pad + ((v + 4) / 8) * (W - 2 * pad);
    const toSvgY = (v: number) => H / 2 - (v * (H - 2 * pad)) / 2;
    const toDerivSvgY = (v: number) => H - pad - v * (H - 2 * pad);

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Interactive chart */}
            <div className="flex justify-center">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm" style={{ overflow: "visible" }}>
                    {/* Grid */}
                    <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="rgba(255,255,255,0.06)" />
                    <line x1={toSvgX(0)} y1={pad} x2={toSvgX(0)} y2={H - pad} stroke="rgba(255,255,255,0.06)" />

                    {/* Dead zones */}
                    <rect x={toSvgX(-4)} y={pad} width={toSvgX(-2) - toSvgX(-4)} height={H - 2 * pad} fill="rgba(244,63,94,0.04)" />
                    <rect x={toSvgX(2)} y={pad} width={toSvgX(4) - toSvgX(2)} height={H - 2 * pad} fill="rgba(244,63,94,0.04)" />

                    {/* Tanh curve */}
                    <polyline
                        points={curvePoints.map(p => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" ")}
                        fill="none"
                        stroke="rgb(139,92,246)"
                        strokeWidth="2"
                    />

                    {/* Derivative curve */}
                    <polyline
                        points={derivPoints.map(p => `${toSvgX(p.x)},${toDerivSvgY(p.y)}`).join(" ")}
                        fill="none"
                        stroke="rgb(245,158,11)"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.6"
                    />

                    {/* Current point markers */}
                    <circle cx={toSvgX(x)} cy={toSvgY(tanhVal)} r="5" fill="rgb(139,92,246)" stroke="white" strokeWidth="1" />
                    <circle cx={toSvgX(x)} cy={toDerivSvgY(derivative)} r="4" fill="rgb(245,158,11)" stroke="white" strokeWidth="1" />

                    {/* Labels */}
                    <text x={W - pad + 4} y={toSvgY(1) + 4} fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace">+1</text>
                    <text x={W - pad + 4} y={toSvgY(-1) + 4} fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace">−1</text>
                    <text x={toSvgX(-4)} y={H - pad + 14} fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace">−4</text>
                    <text x={toSvgX(4) - 6} y={H - pad + 14} fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace">+4</text>
                </svg>
            </div>

            {/* Slider */}
            <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-white/30">
                    <span>x = {x.toFixed(1)}</span>
                    <span>Drag to explore</span>
                </div>
                <input
                    type="range"
                    min={-4}
                    max={4}
                    step={0.1}
                    value={x}
                    onChange={e => setX(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                />
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-center">
                    <p className="text-[8px] font-mono uppercase tracking-widest text-violet-400/50">tanh(x)</p>
                    <p className="text-xl font-mono font-bold text-violet-400">{tanhVal.toFixed(3)}</p>
                </div>
                <div className={`rounded-lg border p-3 text-center ${
                    derivative < 0.1
                        ? "border-rose-500/20 bg-rose-500/5"
                        : "border-amber-500/20 bg-amber-500/5"
                }`}>
                    <p className="text-[8px] font-mono uppercase tracking-widest text-amber-400/50">derivative</p>
                    <motion.p
                        key={x.toFixed(1)}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className={`text-xl font-mono font-bold ${derivative < 0.1 ? "text-rose-400" : "text-amber-400"}`}
                    >
                        {derivative.toFixed(3)}
                    </motion.p>
                    {derivative < 0.1 && (
                        <p className="text-[8px] text-rose-400/60 mt-1">Gradient ≈ 0 — learning stops!</p>
                    )}
                </div>
            </div>

            <div className="flex gap-3 text-[9px] font-mono justify-center">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 inline-block rounded" /> tanh(x)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block rounded border-dashed" style={{ borderTop: "1px dashed rgb(245,158,11)" }} /> derivative</span>
            </div>
        </div>
    );
}
