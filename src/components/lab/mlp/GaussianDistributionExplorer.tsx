"use client";

import { useMemo, useState } from "react";

/*
  GaussianDistributionExplorer
  Drag the standard deviation slider to see how the bell curve changes
  and what "random weights" actually look like at different scales.
*/

function gaussianPDF(x: number, std: number): number {
    return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * (x / std) ** 2);
}

// Deterministic pseudo-random samples for consistency
function seededSamples(std: number, count: number): number[] {
    const samples: number[] = [];
    // Box-Muller with fixed seed sequence
    for (let i = 0; i < count; i++) {
        const u1 = ((i * 2654435761) % 2147483647) / 2147483647;
        const u2 = ((i * 340573321 + 1) % 2147483647) / 2147483647;
        const z = Math.sqrt(-2 * Math.log(Math.max(u1, 0.001))) * Math.cos(2 * Math.PI * u2);
        samples.push(z * std);
    }
    return samples;
}

const W = 320;
const H = 140;
const PAD = { top: 10, bottom: 25, left: 10, right: 10 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const X_RANGE = 4; // -4 to +4

function toSvgX(x: number): number {
    return PAD.left + ((x + X_RANGE) / (2 * X_RANGE)) * PLOT_W;
}

export function GaussianDistributionExplorer() {
    const [std, setStd] = useState(0.5);

    const curvePath = useMemo(() => {
        const steps = 100;
        const pts: string[] = [];
        for (let i = 0; i <= steps; i++) {
            const x = -X_RANGE + (i / steps) * 2 * X_RANGE;
            const y = gaussianPDF(x, std);
            const maxY = gaussianPDF(0, Math.max(std, 0.05));
            const svgX = toSvgX(x);
            const svgY = PAD.top + PLOT_H - (y / Math.max(maxY, 0.01)) * PLOT_H * 0.9;
            pts.push(`${i === 0 ? "M" : "L"}${svgX.toFixed(1)},${svgY.toFixed(1)}`);
        }
        return pts.join(" ");
    }, [std]);

    const fillPath = useMemo(() => {
        const steps = 100;
        const maxY = gaussianPDF(0, Math.max(std, 0.05));
        let d = `M${toSvgX(-X_RANGE).toFixed(1)},${(PAD.top + PLOT_H).toFixed(1)}`;
        for (let i = 0; i <= steps; i++) {
            const x = -X_RANGE + (i / steps) * 2 * X_RANGE;
            const y = gaussianPDF(x, std);
            const svgX = toSvgX(x);
            const svgY = PAD.top + PLOT_H - (y / Math.max(maxY, 0.01)) * PLOT_H * 0.9;
            d += ` L${svgX.toFixed(1)},${svgY.toFixed(1)}`;
        }
        d += ` L${toSvgX(X_RANGE).toFixed(1)},${(PAD.top + PLOT_H).toFixed(1)} Z`;
        return d;
    }, [std]);

    const samples = useMemo(() => seededSamples(std, 30), [std]);

    const label = std <= 0.15 ? "tiny" : std <= 0.4 ? "small" : std <= 0.8 ? "medium" : "large";
    const labelColor = std <= 0.15 ? "#22c55e" : std <= 0.4 ? "#a78bfa" : std <= 0.8 ? "#f59e0b" : "#ef4444";

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {/* Slider */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-white/25 shrink-0">σ =</span>
                <input
                    type="range" min={0.05} max={1.5} step={0.01} value={std}
                    onChange={e => setStd(+e.target.value)}
                    className="flex-1 h-1 accent-violet-500 bg-white/10 rounded-full"
                />
                <span className="text-[11px] font-mono font-bold min-w-[3rem] text-right" style={{ color: labelColor }}>
                    {std.toFixed(2)}
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: labelColor, backgroundColor: labelColor + "15" }}>
                    {label}
                </span>
            </div>

            {/* Bell curve + samples */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                    {/* Axis */}
                    <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="white" strokeOpacity={0.08} />
                    <line x1={toSvgX(0)} y1={PAD.top} x2={toSvgX(0)} y2={PAD.top + PLOT_H} stroke="white" strokeOpacity={0.06} strokeDasharray="2,3" />

                    {/* Tick marks */}
                    {[-3, -2, -1, 0, 1, 2, 3].map(v => (
                        <g key={v}>
                            <line x1={toSvgX(v)} y1={PAD.top + PLOT_H} x2={toSvgX(v)} y2={PAD.top + PLOT_H + 3} stroke="white" strokeOpacity={0.15} />
                            <text x={toSvgX(v)} y={PAD.top + PLOT_H + 12} textAnchor="middle" fontSize={6} fill="white" fillOpacity={0.2} fontFamily="monospace">{v}</text>
                        </g>
                    ))}

                    {/* Filled area */}
                    <path d={fillPath} fill="#a78bfa" fillOpacity={0.08} />

                    {/* Curve */}
                    <path d={curvePath} fill="none" stroke="#a78bfa" strokeWidth={1.5} strokeOpacity={0.6} />

                    {/* Sample dots */}
                    {samples.map((s, i) => {
                        const inRange = Math.abs(s) <= X_RANGE;
                        if (!inRange) return null;
                        const sx = toSvgX(s);
                        const jitter = ((i * 7 + 3) % 13) / 13;
                        const sy = PAD.top + PLOT_H - 4 - jitter * 12;
                        const dead = Math.abs(s) > 2;
                        return (
                            <circle
                                key={i} cx={sx} cy={sy} r={2}
                                fill={dead ? "#ef4444" : "#a78bfa"}
                                fillOpacity={dead ? 0.7 : 0.5}
                            />
                        );
                    })}

                    {/* Dead zone indicators */}
                    <rect x={toSvgX(-X_RANGE)} y={PAD.top} width={toSvgX(-2) - toSvgX(-X_RANGE)} height={PLOT_H} fill="#ef4444" fillOpacity={0.03} />
                    <rect x={toSvgX(2)} y={PAD.top} width={toSvgX(X_RANGE) - toSvgX(2)} height={PLOT_H} fill="#ef4444" fillOpacity={0.03} />
                    <text x={toSvgX(-3)} y={PAD.top + 10} textAnchor="middle" fontSize={5} fill="#ef4444" fillOpacity={0.3} fontFamily="monospace">tanh dead zone</text>
                    <text x={toSvgX(3)} y={PAD.top + 10} textAnchor="middle" fontSize={5} fill="#ef4444" fillOpacity={0.3} fontFamily="monospace">tanh dead zone</text>
                </svg>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-[8px] font-mono text-white/20">
                <span>30 sampled weights</span>
                <span>
                    <span style={{ color: "#ef4444" }}>{samples.filter(s => Math.abs(s) > 2).length}</span> in tanh dead zone (|w| &gt; 2)
                </span>
                <span>Range: [{Math.min(...samples).toFixed(2)}, {Math.max(...samples).toFixed(2)}]</span>
            </div>

            {/* Neuron fate preview */}
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-3 space-y-2">
                <div className="text-[8px] font-mono text-white/25 font-bold">What happens to a neuron with these weights?</div>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: "Healthy (|w| < 1)", count: samples.filter(s => Math.abs(s) < 1).length, color: "#22c55e", desc: "tanh' > 0.4 → learns normally" },
                        { label: "At Risk (1 < |w| < 2)", count: samples.filter(s => Math.abs(s) >= 1 && Math.abs(s) < 2).length, color: "#f59e0b", desc: "tanh' dropping → slow learning" },
                        { label: "Dead (|w| > 2)", count: samples.filter(s => Math.abs(s) >= 2).length, color: "#ef4444", desc: "tanh' ≈ 0 → frozen forever" },
                    ].map(({ label, count, color, desc }) => (
                        <div key={label} className="text-center space-y-0.5">
                            <div className="text-[14px] font-mono font-black" style={{ color }}>{count}</div>
                            <div className="text-[7px] font-mono" style={{ color, opacity: 0.7 }}>{label}</div>
                            <div className="text-[6px] font-mono text-white/15">{desc}</div>
                        </div>
                    ))}
                </div>
                {std > 0.8 && (
                    <div className="text-[7px] font-mono text-red-400/50 text-center pt-1">
                        With σ={std.toFixed(2)}, {((samples.filter(s => Math.abs(s) >= 2).length / 30) * 100).toFixed(0)}% of weights start in the dead zone — these neurons will never contribute to learning.
                    </div>
                )}
                {std <= 0.15 && (
                    <div className="text-[7px] font-mono text-emerald-400/50 text-center pt-1">
                        With σ={std.toFixed(2)}, all weights are tiny — safe from saturation, but the signal may be too weak for deep networks.
                    </div>
                )}
            </div>
        </div>
    );
}
