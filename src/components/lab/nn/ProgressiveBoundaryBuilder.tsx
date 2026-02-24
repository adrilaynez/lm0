"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { Slider } from "@/components/ui/slider";
import { NN_COLORS } from "./visualizer-theme";

/*
  Slider: 1→2→4 neurons. 2D scatter plot with animated decision boundaries.
  As neuron count increases, boundaries carve more complex regions.
  Shows how more neurons = more expressive power.
*/

const SVG_W = 320;
const SVG_H = 240;
const PAD = 20;
const PLOT_W = SVG_W - PAD * 2;
const PLOT_H = SVG_H - PAD * 2;

// Fixed data points (two classes: circles and crosses)
const DATA: { x: number; y: number; cls: 0 | 1 }[] = [
    // Class 0 (bottom-left cluster + top-right outlier)
    { x: 0.15, y: 0.2, cls: 0 }, { x: 0.25, y: 0.15, cls: 0 }, { x: 0.1, y: 0.35, cls: 0 },
    { x: 0.3, y: 0.25, cls: 0 }, { x: 0.2, y: 0.3, cls: 0 }, { x: 0.85, y: 0.85, cls: 0 },
    { x: 0.9, y: 0.75, cls: 0 }, { x: 0.8, y: 0.9, cls: 0 },
    // Class 1 (top-left + bottom-right — XOR-like)
    { x: 0.15, y: 0.8, cls: 1 }, { x: 0.2, y: 0.7, cls: 1 }, { x: 0.1, y: 0.9, cls: 1 },
    { x: 0.25, y: 0.85, cls: 1 }, { x: 0.8, y: 0.15, cls: 1 }, { x: 0.75, y: 0.25, cls: 1 },
    { x: 0.85, y: 0.2, cls: 1 }, { x: 0.9, y: 0.1, cls: 1 },
];

// Decision boundaries for each neuron count
// Each boundary is a line: ax + by + c = 0 → y = -(ax + c) / b
type Line = { a: number; b: number; c: number };

const BOUNDARIES: Record<number, Line[]> = {
    1: [{ a: 1, b: -1, c: 0 }], // diagonal y = x
    2: [{ a: 1, b: -1, c: -0.1 }, { a: -1, b: -1, c: 1.1 }], // two diagonals
    4: [
        { a: 1, b: 0, c: -0.45 },  // vertical at x=0.45
        { a: 1, b: 0, c: -0.55 },  // vertical at x=0.55
        { a: 0, b: 1, c: -0.45 },  // horizontal at y=0.45
        { a: 0, b: 1, c: -0.55 },  // horizontal at y=0.55
    ],
};

function toSvgX(x: number) { return PAD + x * PLOT_W; }
function toSvgY(y: number) { return PAD + (1 - y) * PLOT_H; }

// Classify a point based on which side of each boundary it falls
function classifyPoint(px: number, py: number, lines: Line[]): number {
    if (lines.length === 1) {
        const l = lines[0];
        return (l.a * px + l.b * py + l.c) > 0 ? 1 : 0;
    }
    if (lines.length === 2) {
        const s0 = lines[0].a * px + lines[0].b * py + lines[0].c > 0;
        const s1 = lines[1].a * px + lines[1].b * py + lines[1].c > 0;
        return (s0 !== s1) ? 1 : 0; // XOR of two half-planes
    }
    // 4 neurons: inside the box = class 0, outside = class 1
    const inX = px > 0.45 && px < 0.55;
    const inY = py > 0.45 && py < 0.55;
    if (inX && inY) return 0;
    // Check quadrants
    const isTopLeft = px < 0.45 && py > 0.55;
    const isBottomRight = px > 0.55 && py < 0.45;
    const isTopRight = px > 0.55 && py > 0.55;
    const isBottomLeft = px < 0.45 && py < 0.45;
    return (isTopLeft || isBottomRight) ? 1 : 0;
}

// Generate filled region path for the "class 1" region
function generateRegionGrid(lines: Line[], resolution: number = 20): string {
    const rects: string[] = [];
    const cellW = PLOT_W / resolution;
    const cellH = PLOT_H / resolution;
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const px = (i + 0.5) / resolution;
            const py = (j + 0.5) / resolution;
            if (classifyPoint(px, py, lines) === 1) {
                const sx = PAD + i * cellW;
                const sy = PAD + (resolution - 1 - j) * cellH;
                rects.push(`M${sx},${sy}h${cellW}v${cellH}h${-cellW}Z`);
            }
        }
    }
    return rects.join(" ");
}

export function ProgressiveBoundaryBuilder() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [neuronCount, setNeuronCount] = useState(1);

    const lines = BOUNDARIES[neuronCount] || BOUNDARIES[1];
    const regionPath = useMemo(() => generateRegionGrid(lines, 24), [neuronCount]);

    // Compute accuracy
    const accuracy = useMemo(() => {
        let correct = 0;
        for (const d of DATA) {
            if (classifyPoint(d.x, d.y, lines) === d.cls) correct++;
        }
        return Math.round((correct / DATA.length) * 100);
    }, [neuronCount]);

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 200, damping: 22 };

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Neuron count slider */}
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-bold" style={{ color: NN_COLORS.hidden.hex }}>
                    {t("neuralNetworkNarrative.progressiveBoundary.neuronsLabel")}
                </span>
                <div className="flex-1">
                    <Slider
                        min={1} max={4} step={1}
                        value={[neuronCount]}
                        onValueChange={([v]) => setNeuronCount(v === 3 ? 4 : v)}
                    />
                </div>
                <span className="text-sm font-mono font-bold w-6 text-right" style={{ color: NN_COLORS.hidden.hex }}>
                    {neuronCount}
                </span>
            </div>

            {/* SVG scatter plot */}
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" aria-hidden>
                {/* Background */}
                <rect x={PAD} y={PAD} width={PLOT_W} height={PLOT_H} fill="rgba(0,0,0,0.3)" rx="4" />

                {/* Region fill */}
                <motion.path
                    d={regionPath}
                    fill={NN_COLORS.hidden.hex}
                    opacity={0.12}
                    initial={false}
                    animate={{ opacity: 0.12 }}
                    transition={{ duration: 0.3 }}
                />

                {/* Decision boundary lines */}
                {lines.map((l, i) => {
                    // Compute line endpoints clipped to [0,1]
                    let x1: number, y1: number, x2: number, y2: number;
                    if (Math.abs(l.b) > 0.01) {
                        x1 = 0; y1 = -(l.a * 0 + l.c) / l.b;
                        x2 = 1; y2 = -(l.a * 1 + l.c) / l.b;
                    } else {
                        const xVal = -l.c / l.a;
                        x1 = xVal; y1 = 0; x2 = xVal; y2 = 1;
                    }
                    return (
                        <motion.line
                            key={`${neuronCount}-${i}`}
                            x1={toSvgX(x1)} y1={toSvgY(y1)}
                            x2={toSvgX(x2)} y2={toSvgY(y2)}
                            stroke={NN_COLORS.hidden.hex}
                            strokeWidth="2"
                            strokeDasharray="6 3"
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{ opacity: 0.7, pathLength: 1 }}
                            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: i * 0.15 }}
                        />
                    );
                })}

                {/* Data points */}
                {DATA.map((d, i) => (
                    <g key={i}>
                        {d.cls === 0 ? (
                            <circle
                                cx={toSvgX(d.x)} cy={toSvgY(d.y)} r="5"
                                fill={NN_COLORS.input.hex + "80"}
                                stroke={NN_COLORS.input.hex}
                                strokeWidth="1.5"
                            />
                        ) : (
                            <>
                                <line
                                    x1={toSvgX(d.x) - 4} y1={toSvgY(d.y) - 4}
                                    x2={toSvgX(d.x) + 4} y2={toSvgY(d.y) + 4}
                                    stroke={NN_COLORS.target.hex} strokeWidth="2" strokeLinecap="round"
                                />
                                <line
                                    x1={toSvgX(d.x) + 4} y1={toSvgY(d.y) - 4}
                                    x2={toSvgX(d.x) - 4} y2={toSvgY(d.y) + 4}
                                    stroke={NN_COLORS.target.hex} strokeWidth="2" strokeLinecap="round"
                                />
                            </>
                        )}
                    </g>
                ))}

                {/* Axis labels */}
                <text x={SVG_W / 2} y={SVG_H - 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">x₁</text>
                <text x={6} y={SVG_H / 2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace" transform={`rotate(-90 6 ${SVG_H / 2})`}>x₂</text>
            </svg>

            {/* Info row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-mono text-white/30">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: NN_COLORS.input.hex }} />
                        {t("neuralNetworkNarrative.progressiveBoundary.class0")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: NN_COLORS.target.hex }}>✕</span>
                        {t("neuralNetworkNarrative.progressiveBoundary.class1")}
                    </span>
                </div>
                <div className="rounded-lg px-2.5 py-1 border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[9px] font-mono text-white/25">{t("neuralNetworkNarrative.progressiveBoundary.accuracy")} </span>
                    <motion.span
                        key={accuracy}
                        animate={{ scale: [1.15, 1] }}
                        transition={spring}
                        className="text-sm font-mono font-bold"
                        style={{ color: accuracy >= 90 ? NN_COLORS.output.hex : accuracy >= 70 ? NN_COLORS.target.hex : NN_COLORS.error.hex }}
                    >
                        {accuracy}%
                    </motion.span>
                </div>
            </div>

            <p className="text-[10px] text-white/25 text-center">
                {t("neuralNetworkNarrative.progressiveBoundary.hint")}
            </p>
        </div>
    );
}
