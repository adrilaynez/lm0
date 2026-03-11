"use client";

import { useCallback, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  DotProductArrowsViz — V13 ⭐
  2D coordinate plane with two draggable arrows from origin.
  Real-time dot product score. Angle arc. Preset buttons.
  "Show the math" toggle reveals A₁×B₁ + A₂×B₂ = score.
  
  DISCOVERY-FIRST: the learner sees arrows, drags them, and FEELS the dot product
  before any formula appears. A 15-year-old should get it instantly.
*/

const SIZE = 320;
const HALF = SIZE / 2;
const ARROW_LEN = 120;

interface Vec2 { x: number; y: number }

/* Presets as angles in degrees */
const PRESETS: { label: string; a: number; b: number }[] = [
    { label: "Same", a: 45, b: 45 },
    { label: "60°", a: 30, b: 90 },
    { label: "Perpendicular", a: 0, b: 90 },
    { label: "Almost parallel", a: 40, b: 48 },
    { label: "Opposite", a: 45, b: 225 },
];

function degToVec(deg: number, len: number = ARROW_LEN): Vec2 {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.cos(rad) * len, y: -Math.sin(rad) * len }; // SVG y is inverted
}

function vecToAngle(v: Vec2): number {
    return (Math.atan2(-v.y, v.x) * 180) / Math.PI;
}

function dot(a: Vec2, b: Vec2): number {
    return a.x * b.x + a.y * b.y;
}

function mag(v: Vec2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function angleBetween(a: Vec2, b: Vec2): number {
    const d = dot(a, b);
    const m = mag(a) * mag(b);
    if (m === 0) return 0;
    return (Math.acos(Math.min(1, Math.max(-1, d / m))) * 180) / Math.PI;
}

function normalize(v: Vec2): Vec2 {
    const m = mag(v);
    if (m === 0) return { x: 1, y: 0 };
    return { x: v.x / m, y: v.y / m };
}

/* Score color: green (positive) → gray (zero) → red (negative) */
function scoreColor(score: number, maxScore: number): string {
    const norm = maxScore === 0 ? 0 : score / maxScore;
    if (norm > 0.1) return `rgba(52, 211, 153, ${0.4 + norm * 0.5})`;  // green
    if (norm < -0.1) return `rgba(244, 63, 94, ${0.4 + Math.abs(norm) * 0.5})`; // red
    return "rgba(255,255,255,0.25)"; // gray
}

function scoreLabel(score: number, maxScore: number): { text: string; emoji: string } {
    const norm = maxScore === 0 ? 0 : score / maxScore;
    if (norm > 0.85) return { text: "Same direction", emoji: "✓" };
    if (norm > 0.3) return { text: "Similar", emoji: "↗" };
    if (norm > -0.3) return { text: "Perpendicular", emoji: "⊥" };
    if (norm > -0.85) return { text: "Different", emoji: "↙" };
    return { text: "Opposite", emoji: "✗" };
}

export function DotProductArrowsViz() {
    const [vecA, setVecA] = useState<Vec2>(degToVec(45));
    const [vecB, setVecB] = useState<Vec2>(degToVec(135));
    const [dragging, setDragging] = useState<"a" | "b" | null>(null);
    const [showMath, setShowMath] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const maxScore = ARROW_LEN * ARROW_LEN; // max possible dot product
    const score = dot(vecA, vecB);
    const normScore = score / maxScore;
    const angle = angleBetween(vecA, vecB);
    const { text: simLabel, emoji } = scoreLabel(score, maxScore);

    /* Normalized components for display */
    const nA = normalize(vecA);
    const nB = normalize(vecB);
    const dotNorm = nA.x * nB.x + nA.y * nB.y;

    /* Pointer tracking */
    const getPointerPos = useCallback((e: React.PointerEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left - HALF,
            y: e.clientY - rect.top - HALF,
        };
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging) return;
        const pos = getPointerPos(e);
        const m = mag(pos);
        const clamped = m < 30
            ? { x: pos.x / (m || 1) * 30, y: pos.y / (m || 1) * 30 }
            : m > ARROW_LEN
                ? { x: pos.x / m * ARROW_LEN, y: pos.y / m * ARROW_LEN }
                : pos;
        if (dragging === "a") setVecA(clamped);
        else setVecB(clamped);
    }, [dragging, getPointerPos]);

    const onPointerUp = useCallback(() => setDragging(null), []);

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setVecA(degToVec(preset.a));
        setVecB(degToVec(preset.b));
    };

    /* Arrow head path */
    const arrowHead = (tip: Vec2, color: string) => {
        const n = normalize(tip);
        const headLen = 12;
        const headWidth = 6;
        const base = { x: tip.x - n.x * headLen, y: tip.y - n.y * headLen };
        const perp = { x: -n.y * headWidth, y: n.x * headWidth };
        return (
            <polygon
                points={`${tip.x},${tip.y} ${base.x + perp.x},${base.y + perp.y} ${base.x - perp.x},${base.y - perp.y}`}
                fill={color}
            />
        );
    };

    /* Angle arc */
    const arcPath = () => {
        const r = 35;
        const angA = vecToAngle(vecA);
        const angB = vecToAngle(vecB);
        let start = angA;
        let end = angB;
        // Ensure we draw the smaller arc
        let diff = end - start;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        end = start + diff;

        const startRad = (start * Math.PI) / 180;
        const endRad = (end * Math.PI) / 180;
        const x1 = Math.cos(startRad) * r;
        const y1 = -Math.sin(startRad) * r;
        const x2 = Math.cos(endRad) * r;
        const y2 = -Math.sin(endRad) * r;
        const largeArc = Math.abs(diff) > 180 ? 1 : 0;
        const sweep = diff > 0 ? 0 : 1;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
    };

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4 space-y-4" style={{ minHeight: 380 }}>
            {/* Preset buttons */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {PRESETS.map((p) => (
                    <motion.button
                        key={p.label}
                        onClick={() => applyPreset(p)}
                        className="px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all duration-200"
                        style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.5)",
                        }}
                        whileHover={{
                            borderColor: "rgba(34,211,238,0.3)",
                            color: "rgba(255,255,255,0.8)",
                            scale: 1.05,
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {p.label}
                    </motion.button>
                ))}
            </div>

            {/* SVG Canvas */}
            <div className="flex justify-center">
                <svg
                    ref={svgRef}
                    width={SIZE}
                    height={SIZE}
                    viewBox={`${-HALF} ${-HALF} ${SIZE} ${SIZE}`}
                    className="touch-none select-none"
                    style={{ maxWidth: "100%", height: "auto" }}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                >
                    {/* No SVG filters — they don't render reliably */}

                    {/* Grid lines */}
                    {[-120, -80, -40, 40, 80, 120].map((v) => (
                        <g key={v}>
                            <line x1={v} y1={-HALF} x2={v} y2={HALF} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                            <line x1={-HALF} y1={v} x2={HALF} y2={v} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        </g>
                    ))}
                    {/* Axes — thin dashed so arrows always stand out */}
                    <line x1={-HALF} y1={0} x2={HALF} y2={0} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="6 4" />
                    <line x1={0} y1={-HALF} x2={0} y2={HALF} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="6 4" />

                    {/* Origin dot */}
                    <circle cx={0} cy={0} r={3} fill="rgba(255,255,255,0.12)" />

                    {/* Angle arc */}
                    <path
                        d={arcPath()}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                    />
                    {/* Angle label */}
                    {angle > 3 && (
                        <text
                            x={Math.cos(((vecToAngle(vecA) + vecToAngle(vecB)) / 2) * Math.PI / 180) * 50}
                            y={-Math.sin(((vecToAngle(vecA) + vecToAngle(vecB)) / 2) * Math.PI / 180) * 50}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="rgba(255,255,255,0.25)"
                            fontSize="10"
                            fontFamily="monospace"
                        >
                            {Math.round(angle)}°
                        </text>
                    )}

                    {/* Arrow A (cyan) — wide glow layer + solid line on top */}
                    <line x1={0} y1={0} x2={vecA.x} y2={vecA.y} stroke="rgba(34,211,238,0.25)" strokeWidth={16} strokeLinecap="round" />
                    <line x1={0} y1={0} x2={vecA.x} y2={vecA.y} stroke="#22d3ee" strokeWidth={5} strokeLinecap="round" />
                    {arrowHead(vecA, "#22d3ee")}

                    {/* Arrow B (amber) — wide glow layer + solid line on top */}
                    <line x1={0} y1={0} x2={vecB.x} y2={vecB.y} stroke="rgba(251,191,36,0.25)" strokeWidth={16} strokeLinecap="round" />
                    <line x1={0} y1={0} x2={vecB.x} y2={vecB.y} stroke="#fbbf24" strokeWidth={5} strokeLinecap="round" />
                    {arrowHead(vecB, "#fbbf24")}

                    {/* Draggable tip A */}
                    <circle
                        cx={vecA.x} cy={vecA.y} r={14}
                        fill="rgba(34,211,238,0.15)"
                        stroke="rgba(34,211,238,0.4)"
                        strokeWidth="1.5"
                        className="cursor-grab active:cursor-grabbing"
                        style={{ touchAction: "none" }}
                        onPointerDown={(e) => { e.preventDefault(); setDragging("a"); (e.target as SVGCircleElement).setPointerCapture(e.pointerId); }}
                    />
                    <text x={vecA.x} y={vecA.y - 20} textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="bold" className="pointer-events-none">A</text>

                    {/* Draggable tip B */}
                    <circle
                        cx={vecB.x} cy={vecB.y} r={14}
                        fill="rgba(251,191,36,0.15)"
                        stroke="rgba(251,191,36,0.4)"
                        strokeWidth="1.5"
                        className="cursor-grab active:cursor-grabbing"
                        style={{ touchAction: "none" }}
                        onPointerDown={(e) => { e.preventDefault(); setDragging("b"); (e.target as SVGCircleElement).setPointerCapture(e.pointerId); }}
                    />
                    <text x={vecB.x} y={vecB.y - 20} textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold" className="pointer-events-none">B</text>
                </svg>
            </div>

            {/* Score display */}
            <div className="text-center space-y-2">
                <motion.div
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl"
                    style={{
                        background: `linear-gradient(135deg, ${scoreColor(score, maxScore)}15, transparent)`,
                        border: `1.5px solid ${scoreColor(score, maxScore)}`,
                    }}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 0.3 }}
                    key={Math.round(normScore * 100)}
                >
                    <span className="text-3xl sm:text-4xl font-black font-mono" style={{ color: scoreColor(score, maxScore) }}>
                        {dotNorm >= 0 ? "+" : ""}{dotNorm.toFixed(2)}
                    </span>
                    <div className="text-left">
                        <span className="text-sm font-semibold text-white/60 block">{simLabel} {emoji}</span>
                        <span className="text-[10px] text-white/25 font-mono block">{Math.round(angle)}° apart</span>
                    </div>
                </motion.div>
            </div>

            {/* Show the math toggle */}
            <div className="text-center">
                <button
                    onClick={() => setShowMath(!showMath)}
                    className="text-[11px] sm:text-xs text-white/30 hover:text-white/50 transition-colors underline underline-offset-2 decoration-white/10"
                >
                    {showMath ? "Hide the math" : "Show the math"}
                </button>
            </div>

            <AnimatePresence>
                {showMath && (
                    <motion.div
                        className="text-center space-y-1 max-w-sm mx-auto"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="flex items-center justify-center gap-1 text-sm font-mono flex-wrap">
                            <span className="text-cyan-300/70">A₁</span>
                            <span className="text-white/20">×</span>
                            <span className="text-amber-300/70">B₁</span>
                            <span className="text-white/20">+</span>
                            <span className="text-cyan-300/70">A₂</span>
                            <span className="text-white/20">×</span>
                            <span className="text-amber-300/70">B₂</span>
                            <span className="text-white/30">=</span>
                            <span className="text-white/50">score</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs font-mono flex-wrap">
                            <span className="text-cyan-300/50">{nA.x.toFixed(2)}</span>
                            <span className="text-white/15">×</span>
                            <span className="text-amber-300/50">{nB.x.toFixed(2)}</span>
                            <span className="text-white/15">+</span>
                            <span className="text-cyan-300/50">{nA.y.toFixed(2)}</span>
                            <span className="text-white/15">×</span>
                            <span className="text-amber-300/50">{nB.y.toFixed(2)}</span>
                            <span className="text-white/20">=</span>
                            <span className="font-bold" style={{ color: scoreColor(score, maxScore) }}>
                                {dotNorm.toFixed(2)}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
