"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";

/*
  V35 — PositionalSimilarityViz ⭐ — v2
  
  Heatmap showing cosine similarity between positional encodings.
  D=64 for smooth monotonic-like decay (D=16 had too few frequency
  components, causing oscillations that broke the visual intuition).
  
  Color: amber (low/negative) → dark teal → bright cyan → white (high).
  All fonts ≥ 13px. Premium dark-mode.
*/

const N = 30;
const D = 64;

function posEncoding(pos: number): number[] {
    return Array.from({ length: D }, (_, i) => {
        const freq = 1 / Math.pow(10000, (2 * Math.floor(i / 2)) / D);
        return i % 2 === 0 ? Math.sin(pos * freq) : Math.cos(pos * freq);
    });
}

function cosineSim(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

const ENCODINGS = Array.from({ length: N }, (_, i) => posEncoding(i));
const SIM_MATRIX = ENCODINGS.map((a) => ENCODINGS.map((b) => cosineSim(a, b)));

/*
  Color scale: amber (negative/low) → cyan (high) → white (self)
  Visible and vibrant on dark backgrounds — no purple.
*/
function simToColor(sim: number): string {
    const t = Math.max(0, Math.min(1, (sim + 1) / 2)); // map -1..1 → 0..1
    if (t >= 0.925) {
        // Very high: bright cyan → near-white glow
        const s = (t - 0.925) / 0.075;
        return lerpColor([34, 211, 238], [210, 250, 255], s);
    }
    if (t >= 0.75) {
        // High: medium cyan → bright cyan
        const s = (t - 0.75) / 0.175;
        return lerpColor([14, 116, 144], [34, 211, 238], s);
    }
    if (t >= 0.575) {
        // Medium: dark teal → medium cyan
        const s = (t - 0.575) / 0.175;
        return lerpColor([13, 74, 84], [14, 116, 144], s);
    }
    if (t >= 0.4) {
        // Low-medium: dark amber-teal blend → dark teal
        const s = (t - 0.4) / 0.175;
        return lerpColor([60, 50, 20], [13, 74, 84], s);
    }
    if (t >= 0.2) {
        // Low: warm dark amber → amber-teal blend
        const s = (t - 0.2) / 0.2;
        return lerpColor([80, 45, 10], [60, 50, 20], s);
    }
    // Very low / negative: deep dark brown → warm dark amber
    const s = t / 0.2;
    return lerpColor([40, 20, 5], [80, 45, 10], s);
}

function lerpColor(a: number[], b: number[], t: number): string {
    const c = Math.max(0, Math.min(1, t));
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * c)},${Math.round(a[1] + (b[1] - a[1]) * c)},${Math.round(a[2] + (b[2] - a[2]) * c)})`;
}

export function PositionalSimilarityViz() {
    const [hoveredPos, setHoveredPos] = useState<number | null>(null);
    const [lockedPos, setLockedPos] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const cellSize = 17;
    const labelPad = 40;
    const svgSize = labelPad + N * cellSize;

    const primaryPos = lockedPos;
    const comparePos = lockedPos !== null && hoveredPos !== null && hoveredPos !== lockedPos
        ? hoveredPos : null;
    const displayPos = lockedPos ?? hoveredPos ?? 15;
    const intersectionSim = primaryPos !== null && comparePos !== null
        ? SIM_MATRIX[primaryPos][comparePos] : null;

    const getRowFromEvent = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return null;
        const rect = svgRef.current.getBoundingClientRect();
        const scale = svgSize / rect.width;
        const y = (e.clientY - rect.top) * scale - labelPad;
        const row = Math.floor(y / cellSize);
        return row >= 0 && row < N ? row : null;
    }, [cellSize, svgSize]);

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        setHoveredPos(getRowFromEvent(e));
    }, [getRowFromEvent]);

    const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        const row = getRowFromEvent(e);
        if (row === null) return;
        setLockedPos(prev => prev === row ? null : row);
    }, [getRowFromEvent]);

    const handleMouseLeave = useCallback(() => setHoveredPos(null), []);

    const cellColors = useMemo(() =>
        SIM_MATRIX.map((row) => row.map((sim) => simToColor(sim))), []
    );

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6" style={{ minHeight: 540 }}>
            {/* Title */}
            <div className="text-center mb-4">
                <p className="text-[14px] uppercase tracking-[0.16em] text-white/30 font-semibold mb-1.5">
                    Position Similarity Matrix
                </p>
                <p className="text-[14px] text-white/50 leading-relaxed">
                    {lockedPos !== null ? (
                        <>
                            Locked: <strong className="text-cyan-400 font-mono">{lockedPos}</strong>
                            {comparePos !== null && (
                                <> — comparing with <strong className="text-amber-400 font-mono">{comparePos}</strong>
                                    <span className="text-white/30 ml-1">
                                        (similarity: <strong className={intersectionSim! > 0.5 ? "text-cyan-300" : "text-amber-400"}>
                                            {(intersectionSim! * 100).toFixed(0)}%
                                        </strong>)
                                    </span>
                                </>
                            )}
                        </>
                    ) : hoveredPos !== null ? (
                        <>Hovering: <strong className="text-cyan-400 font-mono">position {hoveredPos}</strong> <span className="text-white/20">— click to lock</span></>
                    ) : (
                        <span className="text-white/30 italic">Hover over the grid to explore · Click to lock &amp; compare</span>
                    )}
                </p>
            </div>

            {/* Color scale legend */}
            <div className="flex items-center justify-center gap-2.5 mb-4">
                <span className="text-[13px] text-white/30 font-mono">−1</span>
                <div
                    className="h-3 rounded-full w-48"
                    style={{
                        background: "linear-gradient(90deg, #281405, #503214, #0d4a54, #0e7490, #22d3ee, #d2faff)",
                    }}
                />
                <span className="text-[13px] text-white/30 font-mono">+1</span>
            </div>

            {/* ═══ Heatmap grid ═══ */}
            <div className="flex justify-center overflow-x-auto">
                <svg
                    ref={svgRef}
                    width={svgSize}
                    height={svgSize}
                    viewBox={`0 0 ${svgSize} ${svgSize}`}
                    className="max-w-full cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleClick}
                >
                    {/* Labels (every 5th) */}
                    {Array.from({ length: N }, (_, j) =>
                        j % 5 === 0 ? (
                            <text
                                key={`cl-${j}`}
                                x={labelPad + j * cellSize + cellSize / 2}
                                y={labelPad - 8}
                                textAnchor="middle" fontSize={13}
                                fontFamily="ui-monospace, monospace"
                                fill={j === primaryPos ? "#22d3ee" : j === comparePos ? "#fbbf24" : "white"}
                                fillOpacity={j === primaryPos || j === comparePos ? 1 : 0.35}
                                fontWeight={j === primaryPos || j === comparePos ? "bold" : "normal"}
                            >{j}</text>
                        ) : null
                    )}
                    {Array.from({ length: N }, (_, i) =>
                        i % 5 === 0 ? (
                            <text
                                key={`rl-${i}`}
                                x={labelPad - 8}
                                y={labelPad + i * cellSize + cellSize / 2 + 4}
                                textAnchor="end" fontSize={13}
                                fontFamily="ui-monospace, monospace"
                                fill={i === primaryPos ? "#22d3ee" : i === comparePos ? "#fbbf24" : "white"}
                                fillOpacity={i === primaryPos || i === comparePos ? 1 : 0.35}
                                fontWeight={i === primaryPos || i === comparePos ? "bold" : "normal"}
                            >{i}</text>
                        ) : null
                    )}

                    {/* Cells */}
                    {SIM_MATRIX.map((row, i) =>
                        row.map((_, j) => {
                            const isOnPrimary = i === primaryPos || j === primaryPos;
                            const isOnCompare = i === comparePos || j === comparePos;
                            const isIntersection = primaryPos !== null && comparePos !== null &&
                                ((i === primaryPos && j === comparePos) || (i === comparePos && j === primaryPos));
                            const isOnHover = lockedPos === null && (i === hoveredPos || j === hoveredPos);

                            return (
                                <rect
                                    key={`${i}-${j}`}
                                    x={labelPad + j * cellSize + 0.5}
                                    y={labelPad + i * cellSize + 0.5}
                                    width={cellSize - 1}
                                    height={cellSize - 1}
                                    rx={2}
                                    fill={cellColors[i][j]}
                                    opacity={
                                        isIntersection ? 1
                                            : isOnPrimary || isOnCompare || isOnHover ? 1
                                                : primaryPos !== null || hoveredPos !== null ? 0.5
                                                    : 0.75
                                    }
                                    style={{ transition: "opacity 0.12s" }}
                                />
                            );
                        })
                    )}

                    {/* Primary cross-hair (cyan) */}
                    {primaryPos !== null && (
                        <>
                            <rect
                                x={labelPad} y={labelPad + primaryPos * cellSize - 0.5}
                                width={N * cellSize} height={cellSize + 1}
                                fill="none" stroke="#22d3ee" strokeWidth={1.5} rx={2} strokeOpacity={0.5}
                            />
                            <rect
                                x={labelPad + primaryPos * cellSize - 0.5} y={labelPad}
                                width={cellSize + 1} height={N * cellSize}
                                fill="none" stroke="#22d3ee" strokeWidth={1.5} rx={2} strokeOpacity={0.5}
                            />
                        </>
                    )}

                    {/* Compare cross-hair (amber) */}
                    {comparePos !== null && (
                        <>
                            <rect
                                x={labelPad} y={labelPad + comparePos * cellSize - 0.5}
                                width={N * cellSize} height={cellSize + 1}
                                fill="none" stroke="#fbbf24" strokeWidth={1.5} rx={2} strokeOpacity={0.5}
                            />
                            <rect
                                x={labelPad + comparePos * cellSize - 0.5} y={labelPad}
                                width={cellSize + 1} height={N * cellSize}
                                fill="none" stroke="#fbbf24" strokeWidth={1.5} rx={2} strokeOpacity={0.5}
                            />
                        </>
                    )}

                    {/* Intersection glow */}
                    {primaryPos !== null && comparePos !== null && (
                        <>
                            <rect
                                x={labelPad + comparePos * cellSize - 1}
                                y={labelPad + primaryPos * cellSize - 1}
                                width={cellSize + 2} height={cellSize + 2}
                                rx={3} fill="none" stroke="white" strokeWidth={2} strokeOpacity={0.8}
                            />
                            <rect
                                x={labelPad + primaryPos * cellSize - 1}
                                y={labelPad + comparePos * cellSize - 1}
                                width={cellSize + 2} height={cellSize + 2}
                                rx={3} fill="none" stroke="white" strokeWidth={2} strokeOpacity={0.8}
                            />
                        </>
                    )}

                    {/* Hover line (when not locked) */}
                    {lockedPos === null && hoveredPos !== null && (
                        <>
                            <rect
                                x={labelPad} y={labelPad + hoveredPos * cellSize - 0.5}
                                width={N * cellSize} height={cellSize + 1}
                                fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} rx={2}
                            />
                            <rect
                                x={labelPad + hoveredPos * cellSize - 0.5} y={labelPad}
                                width={cellSize + 1} height={N * cellSize}
                                fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} rx={2}
                            />
                        </>
                    )}
                </svg>
            </div>

            {/* ═══ 1D row extract ═══ */}
            <div className="max-w-xl mx-auto mt-5">
                <p className="text-[13px] uppercase tracking-[0.14em] text-white/30 font-semibold text-center mb-2.5">
                    Position {displayPos} — similarity to each position
                </p>
                <div className="flex items-end gap-px justify-center" style={{ height: 70 }}>
                    {SIM_MATRIX[displayPos].map((sim, j) => {
                        const normalized = (sim + 1) / 2;
                        const h = Math.max(3, normalized * 65);
                        const isSelf = j === displayPos;
                        const isCompare = j === comparePos;

                        return (
                            <motion.div
                                key={j}
                                className="rounded-t-sm"
                                style={{
                                    width: Math.max(Math.floor(520 / N), 5),
                                    background: isSelf ? "#d2faff"
                                        : isCompare ? "#fbbf24"
                                            : simToColor(sim),
                                    boxShadow: isCompare ? "0 0 6px rgba(251,191,36,0.5)" : "none",
                                }}
                                initial={{ height: 0 }}
                                animate={{ height: h }}
                                transition={{
                                    type: "spring", stiffness: 150, damping: 18,
                                    delay: Math.abs(j - displayPos) * 0.003,
                                }}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-[13px] font-mono text-white/25">0</span>
                    <span className="text-[13px] font-mono text-white/25">{N - 1}</span>
                </div>
            </div>

            {/* Unlock button */}
            {lockedPos !== null && (
                <div className="flex justify-center mt-3">
                    <button
                        onClick={() => setLockedPos(null)}
                        className="px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all"
                        style={{
                            background: "rgba(34,211,238,0.08)",
                            border: "1px solid rgba(34,211,238,0.2)",
                            color: "#22d3ee",
                        }}
                    >
                        Unlock position {lockedPos}
                    </button>
                </div>
            )}

            {/* Caption */}
            <p className="max-w-sm mx-auto mt-4 text-center text-[14px] text-white/40 leading-relaxed">
                Nearby positions glow <strong className="text-cyan-300">bright cyan</strong>.
                Distant positions fade to <strong className="text-amber-400/70">warm amber</strong>.
                {lockedPos === null
                    ? " Click any row to lock it, then hover another to compare."
                    : " Hover another row to see the exact similarity at the intersection."
                }
            </p>
        </div>
    );
}
