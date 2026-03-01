"use client";

import { useMemo,useState } from "react";

import type { MLPTimelineResponse } from "@/types/lmLab";

/* ─────────────────────────────────────────────
   InitializationSensitivityVisualizer
   Shows how different weight initialization scales
   affect training loss curves. Uses real timeline
   data for the "kaiming" (well-scaled) curve when
   available, with simulated curves for comparison.
   ───────────────────────────────────────────── */

export interface InitializationSensitivityVisualizerProps {
    timeline: MLPTimelineResponse | null;
}

type InitMode = "too_small" | "kaiming" | "too_large";

const MODES: { value: InitMode; label: string; color: string; stroke: string; desc: string }[] = [
    {
        value: "too_small",
        label: "Too Small (σ=0.001)",
        color: "text-rose-400",
        stroke: "rgb(251,113,133)",
        desc: "Gradients vanish — the network barely learns.",
    },
    {
        value: "kaiming",
        label: "Kaiming (σ=√(2/n))",
        color: "text-emerald-400",
        stroke: "rgb(52,211,153)",
        desc: "Well-scaled initialization — stable, fast convergence.",
    },
    {
        value: "too_large",
        label: "Too Large (σ=5.0)",
        color: "text-amber-400",
        stroke: "rgb(251,146,60)",
        desc: "Activations explode — loss is chaotic and may diverge.",
    },
];

function seededRng(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateSimulatedCurve(mode: "too_small" | "too_large", realFinalLoss?: number): number[] {
    const rng = seededRng(mode === "too_small" ? 42 : 999);
    const steps = 50;
    const curve: number[] = [];
    let loss: number;

    if (mode === "too_small") {
        const startLoss = realFinalLoss ? realFinalLoss + 0.5 : 4.5;
        loss = startLoss;
        for (let i = 0; i < steps; i++) {
            loss -= 0.005 + rng() * 0.003;
            loss = Math.max(startLoss - 0.4, loss + (rng() - 0.5) * 0.02);
            curve.push(loss);
        }
    } else {
        loss = 4.5;
        for (let i = 0; i < steps; i++) {
            if (i < 5) {
                loss += (rng() - 0.3) * 2;
            } else if (i < 15) {
                loss = 8 + (rng() - 0.5) * 4;
            } else {
                loss = 5 + (rng() - 0.5) * 1.5 - (i - 15) * 0.03;
            }
            curve.push(Math.max(2.5, Math.min(12, loss)));
        }
    }
    return curve;
}

const W = 380, H = 180, PAD = { l: 40, r: 12, t: 12, b: 24 };

export function InitializationSensitivityVisualizer({ timeline }: InitializationSensitivityVisualizerProps) {
    const [active, setActive] = useState<Set<InitMode>>(new Set(["too_small", "kaiming", "too_large"]));

    const curves = useMemo(() => {
        // Use real timeline data for the "kaiming" (well-scaled) curve when available
        const realLoss = timeline?.metrics_log?.train_loss?.map((e) => e.value) ?? [];
        const finalLoss = realLoss.length > 0 ? realLoss[realLoss.length - 1] : undefined;

        const result: Record<InitMode, number[]> = {
            too_small: generateSimulatedCurve("too_small", finalLoss),
            kaiming: realLoss.length > 0 ? realLoss : generateSimulatedCurve("too_small"), // fallback won't happen if timeline loaded
            too_large: generateSimulatedCurve("too_large", finalLoss),
        };
        return result;
    }, [timeline]);

    // Compute global y-range across active curves
    const allVals = useMemo(() => {
        const vals: number[] = [];
        for (const mode of active) vals.push(...curves[mode]);
        return vals.length ? vals : [0, 5];
    }, [active, curves]);

    const yMin = Math.min(...allVals) * 0.9;
    const yMax = Math.max(...allVals) * 1.05;
    const yRange = yMax - yMin || 1;

    function toX(i: number, len: number) {
        return PAD.l + (i / (len - 1)) * (W - PAD.l - PAD.r);
    }
    function toY(v: number) {
        return PAD.t + (1 - (v - yMin) / yRange) * (H - PAD.t - PAD.b);
    }

    const toggle = (mode: InitMode) => {
        setActive((prev) => {
            const next = new Set(prev);
            if (next.has(mode)) { if (next.size > 1) next.delete(mode); }
            else next.add(mode);
            return next;
        });
    };

    // Y-axis ticks
    const yTicks = useMemo(() => {
        const ticks: number[] = [];
        const step = Math.ceil(yRange / 4);
        for (let v = Math.ceil(yMin); v <= yMax; v += step) ticks.push(v);
        return ticks;
    }, [yMin, yMax, yRange]);

    return (
        <div className="space-y-4">
            {/* Toggle buttons */}
            <div className="flex flex-wrap gap-2">
                {MODES.map((m) => {
                    const isActive = active.has(m.value);
                    return (
                        <button
                            key={m.value}
                            onClick={() => toggle(m.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${isActive
                                ? `${m.color} bg-white/[0.06] border border-white/20`
                                : "text-white/25 bg-white/[0.02] border border-white/[0.06] hover:border-white/15"
                                }`}
                        >
                            {m.label}
                        </button>
                    );
                })}
            </div>

            {/* SVG chart */}
            <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
                    {/* Y-axis grid + labels */}
                    {yTicks.map((v) => (
                        <g key={v}>
                            <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                            <text x={PAD.l - 4} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">{v}</text>
                        </g>
                    ))}
                    {/* Axis label */}
                    <text x={PAD.l - 4} y={PAD.t - 2} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">Loss</text>
                    <text x={W / 2} y={H - 2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={7} fontFamily="monospace">Training Step</text>

                    {/* Curves */}
                    {MODES.map((m) => {
                        if (!active.has(m.value)) return null;
                        const data = curves[m.value];
                        const pts = data.map((v, i) => `${toX(i, data.length).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
                        return (
                            <polyline
                                key={m.value}
                                points={pts}
                                fill="none"
                                stroke={m.stroke}
                                strokeWidth={2}
                                strokeLinejoin="round"
                                opacity={0.85}
                            />
                        );
                    })}
                </svg>
            </div>

            {/* Descriptions */}
            <div className="space-y-2">
                {MODES.filter((m) => active.has(m.value)).map((m) => (
                    <div key={m.value} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: m.stroke }} />
                        <p className="text-[11px] text-white/35 leading-relaxed">
                            <span className={`font-bold ${m.color}`}>{m.label}:</span>{" "}
                            {m.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
