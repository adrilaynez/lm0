"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

/*
  TanhSaturationDemo — v2
  Interactive tanh explorer with:
  - Dual-curve chart (tanh + derivative) with zone shading
  - Derivative explanation for non-mathematicians
  - Chain rule multiplication showing gradient death across layers
  - Status badges showing zone (linear / transition / dead)
*/

export function TanhSaturationDemo() {
    const [x, setX] = useState(0);

    const tanhVal = Math.tanh(x);
    const derivative = 1 - tanhVal * tanhVal; // sech²(x) = 1 - tanh²(x)

    // Zone classification
    const zone: "linear" | "transition" | "dead" =
        Math.abs(x) < 1 ? "linear" : Math.abs(x) < 2.2 ? "transition" : "dead";

    const zoneInfo = {
        linear: { label: "Linear Zone", color: "emerald", desc: "Output changes proportionally to input. Derivative ≈ 1. Gradients flow freely." },
        transition: { label: "Transition Zone", color: "amber", desc: "Output is curving toward the limits. Derivative is shrinking. Gradients are weakening." },
        dead: { label: "Dead Zone", color: "rose", desc: "Output is stuck at ±1. Derivative ≈ 0. Gradients are effectively ZERO. Learning stops." },
    };
    const zi = zoneInfo[zone];

    // Generate curve points
    const curvePoints = useMemo(() => {
        const pts: { x: number; y: number }[] = [];
        for (let xi = -4; xi <= 4; xi += 0.08) pts.push({ x: xi, y: Math.tanh(xi) });
        return pts;
    }, []);

    const derivPoints = useMemo(() => {
        const pts: { x: number; y: number }[] = [];
        for (let xi = -4; xi <= 4; xi += 0.08) {
            const t = Math.tanh(xi);
            pts.push({ x: xi, y: 1 - t * t });
        }
        return pts;
    }, []);

    // Chain rule: derivative through N layers
    const chainDerivatives = [1, 2, 3, 4, 5].map(n => Math.pow(derivative, n));

    const W = 400, H = 200, pad = 36, padR = 16;
    const plotW = W - pad - padR, plotH = H - pad * 2;
    const toSvgX = (v: number) => pad + ((v + 4) / 8) * plotW;
    const toSvgY = (v: number) => H / 2 - (v * plotH) / 2;
    const toDerivY = (v: number) => H - pad - v * plotH;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* ── What is a derivative? (non-mathematician explanation) ── */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-3 space-y-2">
                <p className="text-[10px] font-mono font-bold text-violet-400/70">What&apos;s a derivative? (No math degree needed)</p>
                <p className="text-[9px] font-mono text-white/35 leading-relaxed">
                    The <span className="text-violet-400/70 font-bold">derivative</span> tells you: <span className="text-white/50">&ldquo;if I nudge the input a tiny bit, how much does the output change?&rdquo;</span>
                </p>
                <div className="grid grid-cols-3 gap-2 text-[8px] font-mono">
                    <div className="rounded-lg bg-emerald-500/[0.05] border border-emerald-500/15 p-2 text-center">
                        <p className="text-emerald-400/70 font-bold">Derivative ≈ 1</p>
                        <p className="text-white/25 mt-0.5">Output changes a lot</p>
                        <p className="text-emerald-400/50">→ Strong learning signal</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/[0.05] border border-amber-500/15 p-2 text-center">
                        <p className="text-amber-400/70 font-bold">Derivative ≈ 0.5</p>
                        <p className="text-white/25 mt-0.5">Output changes a bit</p>
                        <p className="text-amber-400/50">→ Weakened signal</p>
                    </div>
                    <div className="rounded-lg bg-rose-500/[0.05] border border-rose-500/15 p-2 text-center">
                        <p className="text-rose-400/70 font-bold">Derivative ≈ 0</p>
                        <p className="text-white/25 mt-0.5">Output barely changes</p>
                        <p className="text-rose-400/50">→ No learning at all</p>
                    </div>
                </div>
            </div>

            {/* ── Interactive chart ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Zone shading */}
                    <rect x={toSvgX(-4)} y={pad} width={toSvgX(-2.2) - toSvgX(-4)} height={plotH}
                        fill="rgba(244,63,94,0.05)" />
                    <rect x={toSvgX(2.2)} y={pad} width={toSvgX(4) - toSvgX(2.2)} height={plotH}
                        fill="rgba(244,63,94,0.05)" />
                    <rect x={toSvgX(-1)} y={pad} width={toSvgX(1) - toSvgX(-1)} height={plotH}
                        fill="rgba(34,197,94,0.03)" />

                    {/* Zone labels */}
                    <text x={toSvgX(-3.1)} y={pad + 10} textAnchor="middle" fontSize={6} fill="#f43f5e" fillOpacity={0.3} fontFamily="monospace">DEAD ZONE</text>
                    <text x={toSvgX(3.1)} y={pad + 10} textAnchor="middle" fontSize={6} fill="#f43f5e" fillOpacity={0.3} fontFamily="monospace">DEAD ZONE</text>
                    <text x={toSvgX(0)} y={pad + 10} textAnchor="middle" fontSize={6} fill="#22c55e" fillOpacity={0.25} fontFamily="monospace">LINEAR</text>

                    {/* Grid */}
                    <line x1={pad} y1={H / 2} x2={W - padR} y2={H / 2} stroke="white" strokeOpacity={0.06} />
                    <line x1={toSvgX(0)} y1={pad} x2={toSvgX(0)} y2={H - pad} stroke="white" strokeOpacity={0.06} />
                    {[-1, 1].map(v => (
                        <line key={v} x1={pad} y1={toSvgY(v)} x2={W - padR} y2={toSvgY(v)} stroke="white" strokeOpacity={0.03} strokeDasharray="2 3" />
                    ))}

                    {/* Tanh curve */}
                    <polyline
                        points={curvePoints.map(p => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" ")}
                        fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round"
                    />

                    {/* Derivative curve */}
                    <polyline
                        points={derivPoints.map(p => `${toSvgX(p.x)},${toDerivY(p.y)}`).join(" ")}
                        fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7"
                    />

                    {/* Current x vertical line */}
                    <line x1={toSvgX(x)} y1={pad} x2={toSvgX(x)} y2={H - pad}
                        stroke="white" strokeOpacity={0.15} strokeDasharray="2 2" />

                    {/* Current point markers */}
                    <circle cx={toSvgX(x)} cy={toSvgY(tanhVal)} r="6"
                        fill="#8b5cf6" stroke="white" strokeWidth="1.5" />
                    <circle cx={toSvgX(x)} cy={toDerivY(derivative)} r="5"
                        fill={derivative < 0.1 ? "#f43f5e" : "#f59e0b"} stroke="white" strokeWidth="1.5" />

                    {/* Axis labels */}
                    <text x={W - padR + 2} y={toSvgY(1) + 3} fontSize={7} fill="white" fillOpacity={0.15} fontFamily="monospace">+1</text>
                    <text x={W - padR + 2} y={toSvgY(-1) + 3} fontSize={7} fill="white" fillOpacity={0.15} fontFamily="monospace">−1</text>
                    <text x={W - padR + 2} y={toSvgY(0) + 3} fontSize={7} fill="white" fillOpacity={0.1} fontFamily="monospace">0</text>
                    {[-4, -2, 0, 2, 4].map(v => (
                        <text key={v} x={toSvgX(v)} y={H - pad + 12} textAnchor="middle" fontSize={7} fill="white" fillOpacity={0.12} fontFamily="monospace">{v > 0 ? `+${v}` : v}</text>
                    ))}
                </svg>
            </div>

            {/* ── Slider ── */}
            <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono text-white/30">
                    <span>x = <span className="text-white/50 font-bold">{x.toFixed(1)}</span></span>
                    <span>← Drag to explore →</span>
                </div>
                <input
                    type="range" min={-4} max={4} step={0.1} value={x}
                    onChange={e => setX(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                />
            </div>

            {/* ── Values + Zone badge ── */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3 text-center">
                    <p className="text-[7px] font-mono uppercase tracking-widest text-violet-400/40">tanh(x)</p>
                    <motion.p key={`t-${x.toFixed(1)}`} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className="text-xl font-mono font-black text-violet-400">
                        {tanhVal.toFixed(3)}
                    </motion.p>
                    <p className="text-[7px] font-mono text-white/15 mt-0.5">output</p>
                </div>

                <div className={`rounded-xl border p-3 text-center ${zone === "dead" ? "border-rose-500/25 bg-rose-500/[0.04]"
                        : zone === "transition" ? "border-amber-500/20 bg-amber-500/[0.04]"
                            : "border-emerald-500/20 bg-emerald-500/[0.04]"
                    }`}>
                    <p className="text-[7px] font-mono uppercase tracking-widest text-amber-400/40">derivative</p>
                    <motion.p key={`d-${x.toFixed(1)}`} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className={`text-xl font-mono font-black ${zone === "dead" ? "text-rose-400"
                                : zone === "transition" ? "text-amber-400"
                                    : "text-emerald-400"
                            }`}>
                        {derivative.toFixed(3)}
                    </motion.p>
                    <p className={`text-[7px] font-mono mt-0.5 ${zone === "dead" ? "text-rose-400/50" : "text-white/15"
                        }`}>
                        {zone === "dead" ? "≈ 0 — DEAD!" : zone === "transition" ? "weakening..." : "healthy"}
                    </p>
                </div>

                <div className={`rounded-xl border p-3 text-center ${zone === "dead" ? "border-rose-500/25 bg-rose-500/[0.04]"
                        : zone === "transition" ? "border-amber-500/20 bg-amber-500/[0.04]"
                            : "border-emerald-500/20 bg-emerald-500/[0.04]"
                    }`}>
                    <p className="text-[7px] font-mono uppercase tracking-widest text-white/25">zone</p>
                    <p className={`text-sm font-mono font-bold mt-1 ${`text-${zi.color}-400`
                        }`} style={{ color: zone === "dead" ? "#f43f5e" : zone === "transition" ? "#f59e0b" : "#22c55e" }}>
                        {zi.label}
                    </p>
                    <p className="text-[7px] font-mono text-white/20 mt-0.5">|x| = {Math.abs(x).toFixed(1)}</p>
                </div>
            </div>

            {/* ── Chain rule: gradient through multiple layers ── */}
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.02] p-4 space-y-2">
                <p className="text-[10px] font-mono font-bold text-amber-400/70">Chain Rule: What happens across layers?</p>
                <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                    The gradient flows <span className="text-white/50">backward</span> through each layer, getting <span className="text-amber-400/60 font-bold">multiplied</span> by that layer&apos;s derivative.
                    If the derivative is {derivative.toFixed(2)}, then after N layers the gradient is {derivative.toFixed(2)}<sup>N</sup>:
                </p>
                <div className="flex items-end gap-1.5 mt-2">
                    {chainDerivatives.map((val, i) => {
                        const pct = Math.min(100, val * 100);
                        const dead = val < 0.01;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className={`text-[8px] font-mono font-bold ${dead ? "text-rose-400/60" : val < 0.1 ? "text-amber-400/60" : "text-emerald-400/60"}`}>
                                    {val < 0.001 ? "≈0" : val.toFixed(3)}
                                </span>
                                <motion.div
                                    className="w-full rounded-t-md"
                                    style={{
                                        background: dead ? "#f43f5e40" : val < 0.1 ? "#f59e0b60" : "#22c55e60",
                                        border: `1px solid ${dead ? "#f43f5e30" : val < 0.1 ? "#f59e0b30" : "#22c55e30"}`,
                                    }}
                                    animate={{ height: `${Math.max(4, pct * 0.5)}px` }}
                                    transition={{ duration: 0.3 }}
                                />
                                <span className="text-[7px] font-mono text-white/20">{i + 1}L</span>
                            </div>
                        );
                    })}
                </div>
                {derivative < 0.3 && (
                    <p className="text-[8px] font-mono text-rose-400/50 mt-1">
                        After {chainDerivatives.findIndex(v => v < 0.01) + 1 || 5} layers, the gradient is essentially zero. The early layers receive NO learning signal.
                    </p>
                )}
                {derivative >= 0.3 && (
                    <p className="text-[8px] font-mono text-emerald-400/40 mt-1">
                        Gradient stays usable through several layers. Move x toward ±3 to see what happens in the saturated zone.
                    </p>
                )}
            </div>

            {/* ── Legend ── */}
            <div className="flex gap-4 text-[8px] font-mono justify-center text-white/20">
                <span className="flex items-center gap-1">
                    <span className="w-4 h-1 bg-violet-500 inline-block rounded" /> tanh(x)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 inline-block rounded" style={{ borderTop: "2px dashed #f59e0b" }} /> derivative (tanh&apos;)
                </span>
            </div>
        </div>
    );
}
