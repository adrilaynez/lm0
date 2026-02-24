"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";
import { NN_COLORS } from "./visualizer-theme";

/*
  Batch size slider: 1 → 8 → 32 → 256 → full.
  2D plot: gradient arrows from different batches.
  Small batch → scattered arrows. Large batch → aligned arrows. Full → single clean arrow.
  Overlay: true gradient direction (dashed line).
*/

const SVG_W = 300;
const SVG_H = 240;
const CX = SVG_W / 2;
const CY = SVG_H / 2;

// True gradient direction (pointing down-left toward minimum)
const TRUE_ANGLE = -2.4; // radians (~-137°)
const TRUE_MAG = 60;

// Seeded pseudo-random for consistent arrows
function seededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return s / 2147483647;
    };
}

const BATCH_SIZES = [1, 8, 32, 256, 512]; // 512 = "full"
const BATCH_LABELS: Record<number, string> = { 1: "1", 8: "8", 32: "32", 256: "256", 512: "full" };

function generateArrows(batchSize: number, count: number = 8) {
    const rng = seededRandom(42 + batchSize);
    const noise = batchSize === 512 ? 0 : Math.max(0.05, 1.2 / Math.sqrt(batchSize));
    const arrows: { angle: number; mag: number }[] = [];

    if (batchSize === 512) {
        // Full batch: single clean arrow
        arrows.push({ angle: TRUE_ANGLE, mag: TRUE_MAG });
    } else {
        const n = batchSize <= 8 ? count : Math.min(count, 6);
        for (let i = 0; i < n; i++) {
            const angleNoise = (rng() - 0.5) * Math.PI * noise;
            const magNoise = 0.5 + rng() * 0.8;
            arrows.push({
                angle: TRUE_ANGLE + angleNoise,
                mag: TRUE_MAG * magNoise * (0.6 + 0.4 / noise),
            });
        }
    }
    return arrows;
}

export function GradientNoiseVisualizer() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [batchIdx, setBatchIdx] = useState(1); // index into BATCH_SIZES

    const batchSize = BATCH_SIZES[batchIdx];
    const arrows = useMemo(() => generateArrows(batchSize), [batchSize]);

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 200, damping: 22 };

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Batch size slider */}
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.hidden.hex }}>
                    {t("neuralNetworkNarrative.gradientNoise.batchSizeLabel")}
                </span>
                <div className="flex-1">
                    <Slider
                        min={0} max={BATCH_SIZES.length - 1} step={1}
                        value={[batchIdx]}
                        onValueChange={([v]) => setBatchIdx(v)}
                    />
                </div>
                <span className="text-sm font-mono font-bold w-10 text-right" style={{ color: NN_COLORS.hidden.hex }}>
                    {BATCH_LABELS[batchSize]}
                </span>
            </div>

            {/* SVG arrow plot */}
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" aria-hidden>
                {/* Background */}
                <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="rgba(0,0,0,0.25)" rx="8" />

                {/* Grid lines */}
                <line x1={CX} y1="10" x2={CX} y2={SVG_H - 10} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="10" y1={CY} x2={SVG_W - 10} y2={CY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Origin dot */}
                <circle cx={CX} cy={CY} r="3" fill="rgba(255,255,255,0.2)" />

                {/* True gradient direction (dashed) */}
                <line
                    x1={CX} y1={CY}
                    x2={CX + Math.cos(TRUE_ANGLE) * TRUE_MAG}
                    y2={CY + Math.sin(TRUE_ANGLE) * TRUE_MAG}
                    stroke={NN_COLORS.output.hex}
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    opacity="0.5"
                />
                <text
                    x={CX + Math.cos(TRUE_ANGLE) * (TRUE_MAG + 14)}
                    y={CY + Math.sin(TRUE_ANGLE) * (TRUE_MAG + 14)}
                    textAnchor="middle"
                    fill={NN_COLORS.output.hex}
                    fontSize="7"
                    fontFamily="monospace"
                    opacity="0.6"
                >
                    {t("neuralNetworkNarrative.gradientNoise.trueGradient")}
                </text>

                {/* Batch gradient arrows */}
                <defs>
                    <marker id="gn-arrow" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                        <polygon points="0 0, 6 2.5, 0 5" fill={NN_COLORS.weight.hex} />
                    </marker>
                </defs>

                {arrows.map((a, i) => {
                    const endX = CX + Math.cos(a.angle) * Math.min(a.mag, 90);
                    const endY = CY + Math.sin(a.angle) * Math.min(a.mag, 90);
                    return (
                        <motion.line
                            key={`${batchSize}-${i}`}
                            x1={CX} y1={CY}
                            x2={endX} y2={endY}
                            stroke={NN_COLORS.weight.hex}
                            strokeWidth="1.5"
                            markerEnd="url(#gn-arrow)"
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{ opacity: 0.7, pathLength: 1 }}
                            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, delay: i * 0.05 }}
                        />
                    );
                })}

                {/* Label */}
                <text x={SVG_W - 8} y={SVG_H - 8} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace">
                    batch={BATCH_LABELS[batchSize]}
                </text>
            </svg>

            {/* Description */}
            <div className="rounded-lg bg-black/15 border border-white/[0.05] px-3 py-2 text-center">
                <p className="text-[10px] font-mono text-white/35">
                    {batchSize === 1
                        ? t("neuralNetworkNarrative.gradientNoise.noise1")
                        : batchSize <= 8
                            ? t("neuralNetworkNarrative.gradientNoise.noise8")
                            : batchSize <= 32
                                ? t("neuralNetworkNarrative.gradientNoise.noise32")
                                : batchSize <= 256
                                    ? t("neuralNetworkNarrative.gradientNoise.noise256")
                                    : t("neuralNetworkNarrative.gradientNoise.noiseFull")}
                </p>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[9px] font-mono text-white/25">
                <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 rounded" style={{ background: NN_COLORS.weight.hex }} />
                    {t("neuralNetworkNarrative.gradientNoise.batchGradient")}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 rounded border-b border-dashed" style={{ borderColor: NN_COLORS.output.hex }} />
                    {t("neuralNetworkNarrative.gradientNoise.trueGradient")}
                </span>
            </div>
        </div>
    );
}
