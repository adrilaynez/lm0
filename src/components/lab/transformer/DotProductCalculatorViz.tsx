"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  DotProductCalculatorViz v2 — Combined numerical + geometric dot product explorer

  Two synchronized views of the same operation:
    Left:   2D arrows on a grid — drag tips to feel the geometry
    Right:  Feature sliders with per-element products — see the algebra

  Changes in either view instantly update the other. The learner discovers
  that "multiply matching features and add them up" IS the same thing as
  "how much do two arrows point the same way."

  This replaces the old DotProductCalculatorViz AND DotProductArrowsViz.
  Colors: cyan (A) + amber (B). Premium editorial dark-mode.
*/

/* ─── Helpers ─── */
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function arrowHeadPts(tx: number, ty: number): string {
    const len = Math.sqrt(tx * tx + ty * ty);
    if (len < 5) return "0,0 0,0 0,0";
    const nx = tx / len, ny = ty / len;
    const bx = tx - nx * 9, by = ty - ny * 9;
    const px = -ny * 4, py = nx * 4;
    return `${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`;
}

function angleBetween(a: number[], b: number[]): number {
    const dot = a[0] * b[0] + a[1] * b[1];
    const mA = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
    const mB = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
    if (mA < 0.01 || mB < 0.01) return 0;
    return (Math.acos(clamp(dot / (mA * mB), -1, 1)) * 180) / Math.PI;
}

function arcPath(ax: number, ay: number, bx: number, by: number): string {
    const r = 28;
    const angA = Math.atan2(ay, ax);
    const angB = Math.atan2(by, bx);
    let diff = angB - angA;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    const end = angA + diff;
    const x1 = Math.cos(angA) * r, y1 = Math.sin(angA) * r;
    const x2 = Math.cos(end) * r, y2 = Math.sin(end) * r;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${Math.abs(diff) > Math.PI ? 1 : 0} ${diff > 0 ? 1 : 0} ${x2} ${y2}`;
}

/* ─── Data ─── */
const PRESETS: { label: string; a: number[]; b: number[]; hint: string }[] = [
    { label: "Same", a: [0.8, 0.6], b: [0.8, 0.6], hint: "Identical features → maximum score" },
    { label: "Similar", a: [0.8, 0.6], b: [0.6, 0.8], hint: "Close but not identical → high score" },
    { label: "Perpendicular", a: [0.8, 0.6], b: [-0.6, 0.8], hint: "90° apart → exactly zero" },
    { label: "Opposite", a: [0.8, 0.6], b: [-0.8, -0.6], hint: "Opposite features → strong negative" },
];

const DIM_LABELS = ["Feature 1", "Feature 2"];

/* ─── Layout constants ─── */
const SVG_SIZE = 220;
const SVG_HALF = SVG_SIZE / 2;
const ARROW_SCALE = 85;

/* ─── Score colors ─── */
function scoreColors(s: number) {
    if (s > 0.3) return { text: "rgba(52,211,153,0.8)", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)" };
    if (s < -0.3) return { text: "rgba(244,63,94,0.8)", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)" };
    return { text: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" };
}

function productColor(p: number): string {
    if (p > 0.05) return "rgba(52,211,153,0.7)";
    if (p < -0.05) return "rgba(244,63,94,0.7)";
    return "rgba(255,255,255,0.2)";
}

/* ─── Component ─── */
export function DotProductCalculatorViz() {
    const [vecA, setVecA] = useState([0.8, 0.6]);
    const [vecB, setVecB] = useState([0.5, 0.7]);
    const [dragging, setDragging] = useState<"a" | "b" | null>(null);
    const [showMath, setShowMath] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const products = useMemo(() => vecA.map((a, i) => a * vecB[i]), [vecA, vecB]);
    const dotProduct = useMemo(() => products.reduce((s, p) => s + p, 0), [products]);
    const angle = angleBetween(vecA, vecB);
    const sc = scoreColors(dotProduct);

    /* Active preset detection */
    const activePreset = PRESETS.findIndex(
        (p) => p.a.every((v, i) => Math.abs(v - vecA[i]) < 0.02) && p.b.every((v, i) => Math.abs(v - vecB[i]) < 0.02),
    );

    /* Slider handlers */
    const setA = (d: number, v: number) => { const n = [...vecA]; n[d] = clamp(v, -1, 1); setVecA(n); };
    const setB = (d: number, v: number) => { const n = [...vecB]; n[d] = clamp(v, -1, 1); setVecB(n); };

    /* Arrow drag */
    const getPointerPos = useCallback((e: React.PointerEvent) => {
        if (!svgRef.current) return null;
        const rect = svgRef.current.getBoundingClientRect();
        const sx = SVG_SIZE / rect.width, sy = SVG_SIZE / rect.height;
        return { x: (e.clientX - rect.left) * sx - SVG_HALF, y: (e.clientY - rect.top) * sy - SVG_HALF };
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging) return;
        const pos = getPointerPos(e);
        if (!pos) return;
        const nv = [clamp(pos.x / ARROW_SCALE, -1, 1), clamp(-pos.y / ARROW_SCALE, -1, 1)];
        if (dragging === "a") setVecA(nv); else setVecB(nv);
    }, [dragging, getPointerPos]);

    const onPointerUp = useCallback(() => setDragging(null), []);

    /* Arrow SVG coordinates */
    const aX = vecA[0] * ARROW_SCALE, aY = -vecA[1] * ARROW_SCALE;
    const bX = vecB[0] * ARROW_SCALE, bY = -vecB[1] * ARROW_SCALE;

    /* Angle label position */
    const midAng = (() => {
        const a1 = Math.atan2(aY, aX), a2 = Math.atan2(bY, bX);
        let d = a2 - a1;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        return a1 + d / 2;
    })();

    return (
        <div className="py-6 sm:py-10 px-2 sm:px-4 space-y-5" style={{ minHeight: 400 }}>
            {/* ── Preset tabs ── */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
                {PRESETS.map((p, i) => {
                    const isActive = i === activePreset;
                    return (
                        <motion.button
                            key={p.label}
                            onClick={() => { setVecA([...p.a]); setVecB([...p.b]); }}
                            className="relative pb-1.5 text-[12px] sm:text-sm font-medium cursor-pointer"
                            style={{ color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}
                            whileHover={{ color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)" }}
                        >
                            {p.label}
                            {isActive && (
                                <motion.span
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                    style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)" }}
                                    layoutId="dp-combined-tab"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Hint */}
            {activePreset >= 0 && (
                <motion.p
                    key={activePreset}
                    className="text-center text-[11px] text-white/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {PRESETS[activePreset].hint}
                </motion.p>
            )}

            {/* ── Two-panel layout ── */}
            <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-5 md:gap-6 max-w-3xl mx-auto">
                {/* ─ Left: Arrow panel ─ */}
                <div
                    className="rounded-2xl p-3 sm:p-4 shrink-0"
                    style={{
                        background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <svg
                        ref={svgRef}
                        width={SVG_SIZE}
                        height={SVG_SIZE}
                        viewBox={`${-SVG_HALF} ${-SVG_HALF} ${SVG_SIZE} ${SVG_SIZE}`}
                        className="touch-none select-none"
                        style={{ maxWidth: "100%", height: "auto" }}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                    >
                        {/* Grid */}
                        {[-80, -40, 40, 80].map((v) => (
                            <g key={v}>
                                <line x1={v} y1={-SVG_HALF} x2={v} y2={SVG_HALF} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                                <line x1={-SVG_HALF} y1={v} x2={SVG_HALF} y2={v} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                            </g>
                        ))}

                        {/* Axes */}
                        <line x1={-SVG_HALF} y1={0} x2={SVG_HALF} y2={0} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="4 3" />
                        <line x1={0} y1={-SVG_HALF} x2={0} y2={SVG_HALF} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="4 3" />
                        <circle cx={0} cy={0} r={2.5} fill="rgba(255,255,255,0.1)" />

                        {/* Angle arc */}
                        {angle > 3 && (
                            <>
                                <path
                                    d={arcPath(aX, aY, bX, bY)}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.15)"
                                    strokeWidth="1"
                                    strokeDasharray="3 3"
                                />
                                <text
                                    x={Math.cos(midAng) * 44}
                                    y={Math.sin(midAng) * 44}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="rgba(255,255,255,0.25)"
                                    fontSize="10"
                                    fontFamily="monospace"
                                >
                                    {Math.round(angle)}°
                                </text>
                            </>
                        )}

                        {/* Arrow A (cyan) — glow + line + arrowhead */}
                        <line x1={0} y1={0} x2={aX} y2={aY} stroke="rgba(34,211,238,0.12)" strokeWidth={14} strokeLinecap="round" />
                        <line x1={0} y1={0} x2={aX} y2={aY} stroke="#22d3ee" strokeWidth={2.5} strokeLinecap="round" />
                        <polygon points={arrowHeadPts(aX, aY)} fill="#22d3ee" opacity={0.85} />

                        {/* Arrow B (amber) — glow + line + arrowhead */}
                        <line x1={0} y1={0} x2={bX} y2={bY} stroke="rgba(251,191,36,0.12)" strokeWidth={14} strokeLinecap="round" />
                        <line x1={0} y1={0} x2={bX} y2={bY} stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round" />
                        <polygon points={arrowHeadPts(bX, bY)} fill="#fbbf24" opacity={0.85} />

                        {/* Draggable tip A */}
                        <circle
                            cx={aX} cy={aY} r={13}
                            fill="rgba(34,211,238,0.1)"
                            stroke="rgba(34,211,238,0.3)"
                            strokeWidth="1.5"
                            className="cursor-grab active:cursor-grabbing"
                            style={{ touchAction: "none" }}
                            onPointerDown={(e) => { e.preventDefault(); setDragging("a"); (e.target as SVGCircleElement).setPointerCapture(e.pointerId); }}
                        />
                        <text x={aX} y={aY - 18} textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="bold" className="pointer-events-none">A</text>

                        {/* Draggable tip B */}
                        <circle
                            cx={bX} cy={bY} r={13}
                            fill="rgba(251,191,36,0.1)"
                            stroke="rgba(251,191,36,0.3)"
                            strokeWidth="1.5"
                            className="cursor-grab active:cursor-grabbing"
                            style={{ touchAction: "none" }}
                            onPointerDown={(e) => { e.preventDefault(); setDragging("b"); (e.target as SVGCircleElement).setPointerCapture(e.pointerId); }}
                        />
                        <text x={bX} y={bY - 18} textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold" className="pointer-events-none">B</text>
                    </svg>

                    <p className="text-center text-[9px] text-white/12 mt-1.5">drag the arrow tips</p>
                </div>

                {/* ─ Right: Slider panel ─ */}
                <div className="flex-1 max-w-xs space-y-3 pt-1">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_76px_76px_56px] gap-x-2 items-center">
                        <span />
                        <span className="text-[10px] text-cyan-400/40 uppercase tracking-widest font-semibold text-center">A</span>
                        <span className="text-[10px] text-amber-400/40 uppercase tracking-widest font-semibold text-center">B</span>
                        <span className="text-[10px] text-white/15 uppercase tracking-widest font-semibold text-center">A×B</span>
                    </div>

                    {/* Dimension rows */}
                    {[0, 1].map((d) => {
                        const prod = products[d];
                        return (
                            <motion.div
                                key={d}
                                className="grid grid-cols-[1fr_76px_76px_56px] gap-x-2 items-center"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: d * 0.06 }}
                            >
                                <span className="text-[10px] sm:text-[11px] text-white/25 truncate font-medium">
                                    {DIM_LABELS[d]}
                                </span>

                                {/* Slider A */}
                                <div className="flex flex-col items-center gap-0.5">
                                    <input
                                        type="range"
                                        min={-100} max={100}
                                        value={Math.round(vecA[d] * 100)}
                                        onChange={(e) => setA(d, Number(e.target.value) / 100)}
                                        className="w-full h-1 appearance-none rounded-full cursor-pointer"
                                        style={{
                                            background: `linear-gradient(90deg, rgba(34,211,238,0.1), rgba(34,211,238,0.4) ${(vecA[d] + 1) * 50}%, rgba(34,211,238,0.1))`,
                                        }}
                                    />
                                    <span className="text-[9px] font-mono text-cyan-300/45">{vecA[d].toFixed(2)}</span>
                                </div>

                                {/* Slider B */}
                                <div className="flex flex-col items-center gap-0.5">
                                    <input
                                        type="range"
                                        min={-100} max={100}
                                        value={Math.round(vecB[d] * 100)}
                                        onChange={(e) => setB(d, Number(e.target.value) / 100)}
                                        className="w-full h-1 appearance-none rounded-full cursor-pointer"
                                        style={{
                                            background: `linear-gradient(90deg, rgba(251,191,36,0.1), rgba(251,191,36,0.4) ${(vecB[d] + 1) * 50}%, rgba(251,191,36,0.1))`,
                                        }}
                                    />
                                    <span className="text-[9px] font-mono text-amber-300/45">{vecB[d].toFixed(2)}</span>
                                </div>

                                {/* Product */}
                                <motion.span
                                    className="text-center text-xs font-mono font-bold"
                                    style={{ color: productColor(prod) }}
                                    key={prod.toFixed(2)}
                                    initial={{ scale: 1.15 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    {prod >= 0 ? "+" : ""}{prod.toFixed(2)}
                                </motion.span>
                            </motion.div>
                        );
                    })}

                    {/* Sum line */}
                    <div className="pt-2.5 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="grid grid-cols-[1fr_76px_76px_56px] gap-x-2 items-center">
                            <span className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">
                                Score
                            </span>
                            <span />
                            <span className="text-center text-[9px] text-white/12 font-mono">
                                {products.map((p) => (p >= 0 ? "+" : "") + p.toFixed(1)).join(" ")}
                            </span>
                            <motion.div
                                className="flex items-center justify-center px-2 py-1.5 rounded-xl"
                                style={{
                                    background: sc.bg,
                                    border: `1px solid ${sc.border}`,
                                    boxShadow: Math.abs(dotProduct) > 0.3 ? `0 0 12px -4px ${sc.text}` : "none",
                                }}
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 0.3 }}
                            >
                                <span className="text-sm sm:text-base font-black font-mono" style={{ color: sc.text }}>
                                    {dotProduct >= 0 ? "+" : ""}{dotProduct.toFixed(2)}
                                </span>
                            </motion.div>
                        </div>
                    </div>

                    {/* Angle readout */}
                    <p className="text-[10px] text-white/15 text-center font-mono">
                        {Math.round(angle)}° apart
                    </p>
                </div>
            </div>

            {/* ── Score insight ── */}
            <motion.p
                className="text-center text-[11px] sm:text-xs max-w-sm mx-auto leading-relaxed"
                style={{ color: sc.text }}
                key={dotProduct > 0.3 ? "pos" : dotProduct < -0.3 ? "neg" : "zero"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                {dotProduct > 1.5
                    ? "Very similar — the features agree strongly."
                    : dotProduct > 0.3
                        ? "Somewhat similar — some features align."
                        : dotProduct > -0.3
                            ? "Near zero — these have little in common."
                            : dotProduct > -1.5
                                ? "Somewhat opposite — features disagree."
                                : "Very opposite — features point in different directions."}
            </motion.p>

            {/* ── Show the math ── */}
            <div className="text-center">
                <button
                    onClick={() => setShowMath(!showMath)}
                    className="text-[11px] text-white/25 hover:text-white/45 transition-colors underline underline-offset-2 decoration-white/10 cursor-pointer"
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
                            <span className="text-cyan-300/50">{vecA[0].toFixed(2)}</span>
                            <span className="text-white/15">×</span>
                            <span className="text-amber-300/50">{vecB[0].toFixed(2)}</span>
                            <span className="text-white/15">+</span>
                            <span className="text-cyan-300/50">{vecA[1].toFixed(2)}</span>
                            <span className="text-white/15">×</span>
                            <span className="text-amber-300/50">{vecB[1].toFixed(2)}</span>
                            <span className="text-white/20">=</span>
                            <span className="font-bold" style={{ color: sc.text }}>
                                {dotProduct.toFixed(2)}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
