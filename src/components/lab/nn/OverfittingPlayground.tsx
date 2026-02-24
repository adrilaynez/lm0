"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  3-panel classification visual: Underfitting / Overfitting / Optimal
  Hardcoded balanced points (7 red + 7 green) for clean visuals.
  True boundary: diagonal sine wave for interesting but learnable pattern.
  Train points fade when test data is shown.
*/

interface Pt { x: number; y: number; cls: 0 | 1 }

// True boundary: diagonal with a gentle hump
function trueBoundary(x: number) {
    return 25 + x * 0.5 + 10 * Math.sin((x / 100) * Math.PI);
}

// Balanced hardcoded training points (7 red cls=0 below boundary, 7 green cls=1 above)
const TRAIN_PTS: Pt[] = [
    { x: 12, y: 15, cls: 0 }, { x: 28, y: 22, cls: 0 }, { x: 40, y: 30, cls: 0 },
    { x: 55, y: 40, cls: 0 }, { x: 68, y: 52, cls: 0 }, { x: 78, y: 48, cls: 0 },
    { x: 88, y: 62, cls: 0 },
    { x: 10, y: 72, cls: 1 }, { x: 22, y: 58, cls: 1 }, { x: 35, y: 75, cls: 1 },
    { x: 50, y: 82, cls: 1 }, { x: 62, y: 70, cls: 1 }, { x: 75, y: 88, cls: 1 },
    { x: 90, y: 78, cls: 1 },
];

// Balanced test points
const TEST_PTS: Pt[] = [
    { x: 18, y: 20, cls: 0 }, { x: 45, y: 35, cls: 0 },
    { x: 70, y: 55, cls: 0 }, { x: 83, y: 58, cls: 0 },
    { x: 15, y: 65, cls: 1 }, { x: 38, y: 80, cls: 1 },
    { x: 58, y: 75, cls: 1 }, { x: 80, y: 82, cls: 1 },
];

const PW = 100;
const PH = 100;
const PANEL_W = 110;
const PANEL_H = 110;
const PAD = 5;

function ptToSvg(pt: Pt) {
    return { cx: PAD + (pt.x / 100) * PW, cy: PAD + PH - (pt.y / 100) * PH };
}

function underfitBoundary(): string {
    // Straight line — too simple, doesn't follow the curve
    return `M${PAD},${PAD + PH - 42} L${PAD + PW},${PAD + PH - 60}`;
}

function optimalBoundary(): string {
    const pts: string[] = [];
    for (let i = 0; i <= 50; i++) {
        const rawX = (i / 50) * 100;
        const x = PAD + (i / 50) * PW;
        const y = PAD + PH - trueBoundary(rawX);
        pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${Math.max(PAD + 1, Math.min(PAD + PH - 1, y)).toFixed(1)}`);
    }
    return pts.join(" ");
}

function overfitBoundary(): string {
    // Smooth Catmull-Rom-style spline that threads tightly between training points
    const sorted = [...TRAIN_PTS].sort((a, b) => a.x - b.x);

    // Build control points: midway between each adjacent pair of different classes
    const ctrls: { x: number; y: number }[] = [{ x: 0, y: trueBoundary(0) }];
    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i], b = sorted[i + 1];
        if (a.cls !== b.cls) {
            // Boundary crosses here — make it hug the closer point tightly
            ctrls.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        } else {
            // Same class — add a waypoint through/near this point
            const offset = a.cls === 0 ? 8 : -8;
            ctrls.push({ x: a.x, y: a.y + offset });
        }
    }
    ctrls.push({ x: 100, y: trueBoundary(100) });

    // Convert to SVG coords and build smooth path with quadratic bezier segments
    const svgPts = ctrls.map(p => ({
        x: PAD + (p.x / 100) * PW,
        y: Math.max(PAD + 1, Math.min(PAD + PH - 1, PAD + PH - (p.y / 100) * PH)),
    }));

    let d = `M${svgPts[0].x.toFixed(1)},${svgPts[0].y.toFixed(1)}`;
    for (let i = 1; i < svgPts.length - 1; i++) {
        const mx = (svgPts[i].x + svgPts[i + 1].x) / 2;
        const my = (svgPts[i].y + svgPts[i + 1].y) / 2;
        d += ` Q${svgPts[i].x.toFixed(1)},${svgPts[i].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
    }
    const last = svgPts[svgPts.length - 1];
    d += ` L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
    return d;
}

type PanelType = "underfit" | "overfit" | "optimal";

const PANELS: { type: PanelType; boundary: string; color: string; trainAcc: number; testAcc: number }[] = [
    { type: "underfit", boundary: underfitBoundary(), color: "#f59e0b", trainAcc: 57, testAcc: 50 },
    { type: "overfit", boundary: overfitBoundary(), color: NN_COLORS.error.hex, trainAcc: 100, testAcc: 50 },
    { type: "optimal", boundary: optimalBoundary(), color: NN_COLORS.output.hex, trainAcc: 86, testAcc: 87 },
];

interface DataPointProps { pt: Pt; isTest: boolean; faded: boolean }

function DataPoint({ pt, isTest, faded }: DataPointProps) {
    const { cx, cy } = ptToSvg(pt);
    const size = isTest ? 3.5 : 2.8;
    const opacity = faded ? 0.2 : 1;

    if (pt.cls === 0) {
        return (
            <circle cx={cx} cy={cy} r={size}
                fill={`rgba(239,68,68,${isTest ? 0 : 0.75 * opacity})`}
                stroke={`rgba(239,68,68,${isTest ? 0.9 : 0.9 * opacity})`}
                strokeWidth={isTest ? 1.5 : 0.6}
            />
        );
    }
    return (
        <rect x={cx - size} y={cy - size} width={size * 2} height={size * 2}
            fill={`rgba(34,197,94,${isTest ? 0 : 0.75 * opacity})`}
            stroke={`rgba(34,197,94,${isTest ? 0.9 : 0.9 * opacity})`}
            strokeWidth={isTest ? 1.5 : 0.6}
            rx={0.8}
        />
    );
}

export function OverfittingPlayground() {
    const { t } = useI18n();
    const [showTest, setShowTest] = useState(false);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* 3-panel grid */}
            <div className="grid grid-cols-3 gap-2">
                {PANELS.map(({ type, boundary, color, trainAcc, testAcc }) => (
                    <div key={type} className="space-y-1.5">
                        <p className="text-[9px] font-bold text-center uppercase tracking-wider" style={{ color }}>
                            {t(`neuralNetworkNarrative.overfittingPlay.${type}`)}
                        </p>
                        <div className="rounded-lg bg-black/30 border border-white/[0.06] overflow-hidden">
                            <svg viewBox={`0 0 ${PANEL_W} ${PANEL_H}`} className="w-full block">
                                <rect x={PAD} y={PAD} width={PW} height={PH} fill="rgba(0,0,0,0.2)" rx="2" />
                                <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + PH} stroke="rgba(255,255,255,0.06)" />
                                <line x1={PAD} y1={PAD + PH} x2={PAD + PW} y2={PAD + PH} stroke="rgba(255,255,255,0.06)" />

                                {/* Decision boundary */}
                                <path d={boundary} fill="none" stroke={color} strokeWidth="1.8" opacity={0.85} />

                                {/* Training points — faded when test is shown */}
                                {TRAIN_PTS.map((pt, i) => (
                                    <DataPoint key={`tr-${i}`} pt={pt} isTest={false} faded={showTest} />
                                ))}

                                {/* Test points — prominent when shown */}
                                {showTest && TEST_PTS.map((pt, i) => (
                                    <DataPoint key={`te-${i}`} pt={pt} isTest={true} faded={false} />
                                ))}
                            </svg>
                        </div>

                        {/* Accuracy pills */}
                        <div className="flex justify-center gap-1.5 flex-wrap">
                            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded-full"
                                style={{ background: color + "18", color: color + "cc" }}>
                                tr {trainAcc}%
                            </span>
                            {showTest && (
                                <span className="text-[7px] font-mono px-1.5 py-0.5 rounded-full"
                                    style={{
                                        background: (testAcc > 75 ? NN_COLORS.output.hex : NN_COLORS.error.hex) + "18",
                                        color: (testAcc > 75 ? NN_COLORS.output.hex : NN_COLORS.error.hex) + "cc",
                                    }}>
                                    test {testAcc}%
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[8px] font-mono text-white/25">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500/70 inline-block" /> class A
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-green-500/70 inline-block" /> class B
                </span>
                {showTest && (
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full border border-white/50 inline-block" /> unseen test
                    </span>
                )}
            </div>

            {/* Test button */}
            <button
                onClick={() => setShowTest(!showTest)}
                className={`w-full px-4 py-2.5 rounded-xl text-[11px] font-mono font-bold border transition-all ${showTest
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80"
                    }`}
            >
                {showTest
                    ? t("neuralNetworkNarrative.overfittingPlay.hideTest")
                    : t("neuralNetworkNarrative.overfittingPlay.showTest")
                }
            </button>

            {/* Result insight */}
            <AnimatePresence>
                {showTest && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border border-rose-500/15 bg-rose-500/[0.03] p-3"
                    >
                        <p className="text-[11px] text-white/40 leading-relaxed">
                            {t("neuralNetworkNarrative.overfittingPlay.testInsight")}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
