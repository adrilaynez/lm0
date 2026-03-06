"use client";

import { useMemo, useState } from "react";

import type { MLPTimelineResponse } from "@/types/lmLab";

/* ─────────────────────────────────────────────
   GradientFlowVisualizer — v2
   Shows gradient magnitudes across layers with
   detailed per-layer annotations, raw values,
   and explanations of what each scenario means.
   ───────────────────────────────────────────── */

export interface GradientFlowVisualizerProps {
    timeline: MLPTimelineResponse | null;
}

type GradientMode = "vanishing" | "stable" | "exploding";

interface ModeConfig {
    value: GradientMode;
    label: string;
    color: string;
    hex: string;
}

const MODES: ModeConfig[] = [
    { value: "vanishing", label: "Vanishing", color: "text-rose-400", hex: "#fb7185" },
    { value: "stable", label: "Stable", color: "text-emerald-400", hex: "#34d399" },
    { value: "exploding", label: "Exploding", color: "text-amber-400", hex: "#fbbf24" },
];

function getSimulatedData(mode: GradientMode, numLayers: number): { rawMag: number; normalized: number; annotation: string }[] {
    const result: { rawMag: number; normalized: number; annotation: string }[] = [];
    for (let i = 0; i < numLayers; i++) {
        const layerFromOutput = numLayers - 1 - i;
        let rawMag: number;
        let annotation: string;
        if (mode === "vanishing") {
            rawMag = Math.pow(0.25, layerFromOutput);
            if (rawMag < 0.001) annotation = "Gradient ≈ 0 — layer frozen, cannot learn";
            else if (rawMag < 0.05) annotation = "Almost no signal — weights barely change";
            else if (rawMag < 0.3) annotation = "Weak signal — slow, unreliable learning";
            else annotation = "Gradient starts strong near output";
        } else if (mode === "stable") {
            rawMag = 0.8 + Math.sin(i * 0.7) * 0.15;
            annotation = "Healthy — proportional learning across all layers";
        } else {
            rawMag = Math.pow(2.2, layerFromOutput);
            if (rawMag > 50) annotation = "Gradient explosion — weights diverge to ±∞";
            else if (rawMag > 10) annotation = "Dangerous — weight updates wildly too large";
            else if (rawMag > 3) annotation = "Growing fast — updates becoming unstable";
            else annotation = "Gradient starts normal at output";
        }
        result.push({ rawMag, normalized: 0, annotation });
    }
    const max = Math.max(...result.map(r => r.rawMag));
    result.forEach(r => { r.normalized = r.rawMag / (max || 1); });
    return result;
}

function extractRealGradNorms(timeline: MLPTimelineResponse): { labels: string[]; magnitudes: number[] } | null {
    const snapKeys = Object.keys(timeline.snapshots ?? {}).sort(
        (a, b) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1])
    );
    for (let i = snapKeys.length - 1; i >= 0; i--) {
        const snap = timeline.snapshots[snapKeys[i]];
        const gn = snap?.grad_norms as Record<string, number> | undefined;
        if (gn && Object.keys(gn).length > 0) {
            const labels = Object.keys(gn);
            const raw = labels.map((k) => gn[k]);
            const max = Math.max(...raw);
            const magnitudes = raw.map((m) => m / (max || 1));
            return { labels, magnitudes };
        }
    }
    const gnLog = timeline.metrics_log?.grad_norms ?? [];
    for (let i = gnLog.length - 1; i >= 0; i--) {
        const entry = gnLog[i] as unknown as { step: number; value: Record<string, number> };
        if (entry.value && Object.keys(entry.value).length > 0) {
            const labels = Object.keys(entry.value);
            const raw = labels.map((k) => entry.value[k]);
            const max = Math.max(...raw);
            const magnitudes = raw.map((m) => m / (max || 1));
            return { labels, magnitudes };
        }
    }
    return null;
}

function getBarColor(hex: string, magnitude: number): string {
    const alpha = 0.15 + magnitude * 0.85;
    return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

export function GradientFlowVisualizer({ timeline }: GradientFlowVisualizerProps) {
    const [mode, setMode] = useState<GradientMode>("vanishing");
    const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

    const modeConfig = MODES.find(m => m.value === mode)!;
    const realGrads = useMemo(() => (timeline ? extractRealGradNorms(timeline) : null), [timeline]);
    const defaultNumLayers = realGrads ? realGrads.labels.length : 6;

    const layerData = useMemo(() => {
        if (mode === "stable" && realGrads) {
            return realGrads.labels.map((label, i) => ({
                label,
                rawMag: realGrads.magnitudes[i],
                normalized: realGrads.magnitudes[i],
                annotation: "Real gradient norm from trained model",
            }));
        }
        const numLayers = defaultNumLayers;
        const simData = getSimulatedData(mode, numLayers);
        return simData.map((d, i) => ({
            label: i === 0 ? "Layer 1 (deepest)" : i === numLayers - 1 ? `Layer ${numLayers} (output)` : `Layer ${i + 1}`,
            ...d,
        }));
    }, [mode, realGrads, defaultNumLayers]);

    const totalRatio = layerData.length > 1
        ? layerData[layerData.length - 1].rawMag / Math.max(layerData[0].rawMag, 1e-10)
        : 1;

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* ── Mode selector ── */}
            <div className="flex items-center gap-2">
                {MODES.map((m) => {
                    const active = mode === m.value;
                    return (
                        <button
                            key={m.value}
                            onClick={() => setMode(m.value)}
                            className="flex-1 text-[9px] font-mono font-bold py-1.5 px-2 rounded-lg border transition-all"
                            style={{
                                backgroundColor: active ? m.hex + "15" : "transparent",
                                borderColor: active ? m.hex + "40" : "rgba(255,255,255,0.06)",
                                color: active ? m.hex : "rgba(255,255,255,0.25)",
                            }}
                        >
                            {m.label}
                        </button>
                    );
                })}
            </div>

            {/* ── What are we showing ── */}
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
                <p className="text-[8px] font-mono text-white/25 leading-relaxed">
                    <span className="font-bold text-white/35">What this shows:</span> During backpropagation, the error signal flows backward from the output layer to the input. Each bar shows how much gradient (learning signal) reaches that layer. A full bar means strong learning; an empty bar means the layer is frozen.
                </p>
            </div>

            {/* ── Layer bars ── */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 space-y-1.5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-wider">
                        Gradient flows ← backward from output
                    </span>
                    <span className="text-[8px] font-mono text-white/15">
                        |∇W| = gradient magnitude
                    </span>
                </div>

                {layerData.map((layer, i) => {
                    const barWidth = Math.max(2, layer.normalized * 100);
                    const isHov = hoveredLayer === i;
                    const isOutput = i === layerData.length - 1;

                    return (
                        <div
                            key={i}
                            className="group cursor-default"
                            onMouseEnter={() => setHoveredLayer(i)}
                            onMouseLeave={() => setHoveredLayer(null)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-mono text-white/20 w-28 text-right shrink-0">
                                    {layer.label}
                                </span>
                                <div className="flex-1 h-5 rounded-md bg-white/[0.03] overflow-hidden relative">
                                    <div
                                        className="h-full rounded-md transition-all duration-500 ease-out"
                                        style={{
                                            width: `${barWidth}%`,
                                            backgroundColor: getBarColor(modeConfig.hex, layer.normalized),
                                            opacity: isHov ? 1 : 0.8,
                                        }}
                                    />
                                    {isOutput && mode !== "stable" && (
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-mono text-white/15">
                                            ← error starts here
                                        </span>
                                    )}
                                </div>
                                <span className="text-[8px] font-mono font-bold w-14 text-right shrink-0" style={{ color: modeConfig.hex }}>
                                    {layer.rawMag < 0.001 ? layer.rawMag.toExponential(0) : layer.rawMag > 100 ? layer.rawMag.toFixed(0) : layer.rawMag.toFixed(2)}
                                </span>
                            </div>
                            {/* Annotation on hover */}
                            {isHov && (
                                <div className="ml-[7.5rem] mt-0.5 text-[7px] font-mono leading-relaxed" style={{ color: modeConfig.hex, opacity: 0.5 }}>
                                    {layer.annotation}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Summary card ── */}
            <div
                className="rounded-xl border p-3 space-y-1.5"
                style={{
                    borderColor: modeConfig.hex + "25",
                    backgroundColor: modeConfig.hex + "08",
                }}
            >
                <p className="text-[10px] font-mono font-bold" style={{ color: modeConfig.hex }}>
                    {mode === "vanishing" && `Output→Input ratio: ${totalRatio < 0.001 ? totalRatio.toExponential(1) : totalRatio.toFixed(3)} — gradient collapses`}
                    {mode === "stable" && "All layers receive comparable gradient — healthy training"}
                    {mode === "exploding" && `Output→Input ratio: ${totalRatio.toFixed(0)}× — gradient explodes`}
                </p>
                <p className="text-[8px] font-mono text-white/25 leading-relaxed">
                    {mode === "vanishing" && "Each layer multiplies the gradient by a factor < 1 (because tanh' < 1 and weights are small). After several layers, the gradient reaching Layer 1 is essentially zero. Result: the earliest layers — which set the foundation for all later processing — cannot learn. The network only trains its last few layers."}
                    {mode === "stable" && "With Kaiming initialization and/or BatchNorm, the per-layer multiplication factor stays close to 1.0. The gradient neither shrinks nor grows as it flows backward. Every layer — from output to input — receives meaningful learning signal and updates its weights proportionally."}
                    {mode === "exploding" && "Each layer multiplies the gradient by a factor > 1. After several layers, the gradient grows exponentially. Weight updates become enormous → weights overshoot → activations become even larger → gradients grow even more. This positive feedback loop causes loss to spike to infinity (NaN). Training crashes."}
                </p>
            </div>
        </div>
    );
}
