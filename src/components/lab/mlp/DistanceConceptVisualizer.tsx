"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { motion } from "framer-motion";

/*
  DistanceConceptVisualizer
  Interactive 2D canvas with two draggable points representing characters.
  Shows:
  - Euclidean distance as a visible line between them
  - Cosine similarity as the angle between vectors from origin
  - Both metrics update in real-time as user drags
*/

interface Point {
    x: number;
    y: number;
}

const W = 320;
const H = 320;
const PAD = 30;
const ORIGIN = { x: W / 2, y: H / 2 };

function toSvg(p: Point): { cx: number; cy: number } {
    return {
        cx: PAD + ((p.x + 1) / 2) * (W - 2 * PAD),
        cy: PAD + ((1 - (p.y + 1) / 2)) * (H - 2 * PAD),
    };
}

function fromSvg(cx: number, cy: number): Point {
    return {
        x: ((cx - PAD) / (W - 2 * PAD)) * 2 - 1,
        y: 1 - ((cy - PAD) / (H - 2 * PAD)) * 2,
    };
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

function euclidean(a: Point, b: Point): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function cosine(a: Point, b: Point): number {
    const dot = a.x * b.x + a.y * b.y;
    const magA = Math.sqrt(a.x ** 2 + a.y ** 2);
    const magB = Math.sqrt(b.x ** 2 + b.y ** 2);
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

function angleBetween(a: Point, b: Point): number {
    const cos = cosine(a, b);
    return Math.acos(clamp(cos, -1, 1)) * (180 / Math.PI);
}

const PRESETS: { label: string; a: Point; b: Point; desc: string }[] = [
    { label: "Close", a: { x: 0.3, y: 0.5 }, b: { x: 0.4, y: 0.6 }, desc: "Similar direction & distance" },
    { label: "Same direction", a: { x: 0.2, y: 0.3 }, b: { x: 0.6, y: 0.9 }, desc: "Cosine ≈ 1, Euclidean varies" },
    { label: "Opposite", a: { x: 0.5, y: 0.5 }, b: { x: -0.5, y: -0.5 }, desc: "Cosine ≈ -1" },
    { label: "Perpendicular", a: { x: 0.6, y: 0 }, b: { x: 0, y: 0.6 }, desc: "Cosine ≈ 0" },
];

export function DistanceConceptVisualizer() {
    const [pointA, setPointA] = useState<Point>({ x: 0.3, y: 0.5 });
    const [pointB, setPointB] = useState<Point>({ x: -0.4, y: 0.3 });
    const [dragging, setDragging] = useState<"a" | "b" | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const cx = ((e.clientX - rect.left) / rect.width) * W;
        const cy = ((e.clientY - rect.top) / rect.height) * H;
        const pt = fromSvg(clamp(cx, PAD, W - PAD), clamp(cy, PAD, H - PAD));
        if (dragging === "a") setPointA(pt);
        else setPointB(pt);
    }, [dragging]);

    const svgA = toSvg(pointA);
    const svgB = toSvg(pointB);
    const svgO = toSvg({ x: 0, y: 0 });

    const euclDist = useMemo(() => euclidean(pointA, pointB), [pointA, pointB]);
    const cosSim = useMemo(() => cosine(pointA, pointB), [pointA, pointB]);
    const angle = useMemo(() => angleBetween(pointA, pointB), [pointA, pointB]);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Preset buttons */}
            <div className="flex gap-2 justify-center flex-wrap">
                {PRESETS.map(p => (
                    <button
                        key={p.label}
                        onClick={() => { setPointA(p.a); setPointB(p.b); }}
                        className="px-2.5 py-1 rounded-full text-[10px] font-mono border border-white/[0.08] bg-white/[0.02] text-white/30 hover:text-white/50 hover:border-white/15 transition-all"
                        title={p.desc}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-5">
                {/* SVG canvas */}
                <div className="relative shrink-0">
                    <svg
                        ref={svgRef}
                        width={W}
                        height={H}
                        viewBox={`0 0 ${W} ${H}`}
                        className="bg-white/[0.02] rounded-xl border border-white/[0.06] select-none touch-none"
                        onPointerMove={handlePointerMove}
                        onPointerUp={() => setDragging(null)}
                        onPointerLeave={() => setDragging(null)}
                    >
                        {/* Grid */}
                        {[-1, -0.5, 0, 0.5, 1].map(v => {
                            const sv = toSvg({ x: v, y: 0 });
                            const sh = toSvg({ x: 0, y: v });
                            return (
                                <g key={v}>
                                    <line x1={sv.cx} y1={PAD} x2={sv.cx} y2={H - PAD} stroke="white" strokeOpacity={v === 0 ? 0.1 : 0.03} />
                                    <line x1={PAD} y1={sh.cy} x2={W - PAD} y2={sh.cy} stroke="white" strokeOpacity={v === 0 ? 0.1 : 0.03} />
                                </g>
                            );
                        })}

                        {/* Origin label */}
                        <text x={svgO.cx + 4} y={svgO.cy - 4} fill="white" fillOpacity={0.15} fontSize={9} fontFamily="monospace">O</text>

                        {/* Vectors from origin */}
                        <line x1={svgO.cx} y1={svgO.cy} x2={svgA.cx} y2={svgA.cy} stroke="#a78bfa" strokeWidth={1.5} strokeOpacity={0.4} strokeDasharray="4 3" />
                        <line x1={svgO.cx} y1={svgO.cy} x2={svgB.cx} y2={svgB.cy} stroke="#34d399" strokeWidth={1.5} strokeOpacity={0.4} strokeDasharray="4 3" />

                        {/* Euclidean distance line */}
                        <line x1={svgA.cx} y1={svgA.cy} x2={svgB.cx} y2={svgB.cy} stroke="#f59e0b" strokeWidth={2} strokeOpacity={0.6} />

                        {/* Angle arc */}
                        {angle > 1 && (() => {
                            const r = 25;
                            const angA = Math.atan2(-(svgA.cy - svgO.cy), svgA.cx - svgO.cx);
                            const angB = Math.atan2(-(svgB.cy - svgO.cy), svgB.cx - svgO.cx);
                            const startAngle = Math.min(angA, angB);
                            const endAngle = Math.max(angA, angB);
                            const sweep = endAngle - startAngle > Math.PI ? 0 : 1;
                            const x1 = svgO.cx + r * Math.cos(-startAngle);
                            const y1 = svgO.cy + r * Math.sin(-startAngle);
                            const x2 = svgO.cx + r * Math.cos(-endAngle);
                            const y2 = svgO.cy + r * Math.sin(-endAngle);
                            return (
                                <path
                                    d={`M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`}
                                    fill="none"
                                    stroke="#60a5fa"
                                    strokeWidth={1.5}
                                    strokeOpacity={0.5}
                                />
                            );
                        })()}

                        {/* Point A */}
                        <circle
                            cx={svgA.cx}
                            cy={svgA.cy}
                            r={dragging === "a" ? 10 : 8}
                            fill="#a78bfa"
                            fillOpacity={0.8}
                            stroke="#a78bfa"
                            strokeWidth={2}
                            className="cursor-grab active:cursor-grabbing"
                            onPointerDown={e => { e.preventDefault(); setDragging("a"); }}
                        />
                        <text x={svgA.cx + 12} y={svgA.cy + 4} fill="#a78bfa" fontSize={11} fontFamily="monospace" fontWeight="bold">A</text>

                        {/* Point B */}
                        <circle
                            cx={svgB.cx}
                            cy={svgB.cy}
                            r={dragging === "b" ? 10 : 8}
                            fill="#34d399"
                            fillOpacity={0.8}
                            stroke="#34d399"
                            strokeWidth={2}
                            className="cursor-grab active:cursor-grabbing"
                            onPointerDown={e => { e.preventDefault(); setDragging("b"); }}
                        />
                        <text x={svgB.cx + 12} y={svgB.cy + 4} fill="#34d399" fontSize={11} fontFamily="monospace" fontWeight="bold">B</text>

                        {/* Euclidean label on line */}
                        <text
                            x={(svgA.cx + svgB.cx) / 2 + 6}
                            y={(svgA.cy + svgB.cy) / 2 - 6}
                            fill="#f59e0b"
                            fontSize={10}
                            fontFamily="monospace"
                            fillOpacity={0.7}
                        >
                            {euclDist.toFixed(2)}
                        </text>
                    </svg>
                </div>

                {/* Metrics panel */}
                <div className="flex-1 space-y-4 min-w-[200px]">
                    {/* Euclidean */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-3 h-0.5 bg-amber-500 rounded" />
                            <span className="text-[10px] font-mono font-bold text-amber-400/80 uppercase tracking-widest">
                                Euclidean Distance
                            </span>
                        </div>
                        <motion.p
                            key={euclDist.toFixed(2)}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-mono font-bold text-amber-300 mb-1"
                        >
                            {euclDist.toFixed(3)}
                        </motion.p>
                        <p className="text-[10px] font-mono text-white/25 leading-relaxed">
                            &quot;How far apart?&quot; — The straight-line distance between two points.
                            Sensitive to magnitude: a vector 2× longer will be further away.
                        </p>
                    </div>

                    {/* Cosine */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.03] p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <svg width={12} height={12} viewBox="0 0 12 12">
                                <path d="M6 6 L10 6 A4 4 0 0 0 8 3" fill="none" stroke="#60a5fa" strokeWidth={1.5} />
                            </svg>
                            <span className="text-[10px] font-mono font-bold text-blue-400/80 uppercase tracking-widest">
                                Cosine Similarity
                            </span>
                        </div>
                        <motion.p
                            key={cosSim.toFixed(2)}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            className="text-2xl font-mono font-bold text-blue-300 mb-1"
                        >
                            {cosSim.toFixed(3)}
                            <span className="text-sm text-white/20 ml-2">({angle.toFixed(0)}°)</span>
                        </motion.p>
                        <p className="text-[10px] font-mono text-white/25 leading-relaxed">
                            &quot;How similar in direction?&quot; — The cosine of the angle between two vectors.
                            1 = same direction, 0 = perpendicular, -1 = opposite. Ignores magnitude.
                        </p>
                    </div>

                    {/* Instruction */}
                    <p className="text-[10px] font-mono text-white/20 text-center">
                        Drag the points to explore both metrics
                    </p>
                </div>
            </div>
        </div>
    );
}
