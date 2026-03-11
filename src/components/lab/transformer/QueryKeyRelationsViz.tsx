"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ATTENTION } from "./SpotlightViz";

const WORDS = ["The", "king", "who", "wore", "the", "golden", "crown", "ruled", "the", "vast", "kingdom", "wisely"];

/* Visual Q and K vectors for demonstration (not used for score calculation) */
const Q_VECTORS: number[][] = [
    [1.0, 0.0, 0.6, 0.2],
    [0.4, 0.6, 1.4, 0.6],
    [1.6, 0.4, 0.2, 0.0],
    [0.2, 0.2, 1.8, 0.4],
    [0.6, 0.0, 1.0, 0.6],
    [0.4, 0.0, 1.6, 0.2],
    [1.6, 0.8, 0.2, 0.4],
    [1.4, 0.2, 0.8, 0.4],
    [0.4, 0.0, 1.0, 0.8],
    [1.0, 0.0, 0.8, 0.4],
    [1.4, 0.6, 0.2, 0.2],
    [0.4, 1.6, 0.2, 0.2],
];

const K_VECTORS: number[][] = [
    [0.0, 0.0, 0.2, 0.0],
    [1.8, 0.4, 0.2, 0.2],
    [0.2, 0.0, 0.0, 0.0],
    [0.0, 1.8, 0.4, 0.0],
    [0.0, 0.0, 0.2, 0.0],
    [0.4, 0.0, 0.2, 1.8],
    [0.6, 0.0, 1.6, 0.4],
    [0.2, 1.6, 0.4, 0.2],
    [0.0, 0.0, 0.2, 0.0],
    [0.2, 0.0, 0.2, 1.6],
    [1.2, 0.2, 1.2, 0.2],
    [0.2, 0.2, 0.0, 1.4],
];

const DIM_LABELS = ["royalty", "action", "object", "quality"];

/* ─── Arrow helper (SS7-style clean grid) ─── */
function vecToXY(v: number[]): [number, number] {
    const x = v[0] - v[2];
    const y = v[1] - v[3];
    const len = Math.sqrt(x * x + y * y) || 1;
    return [x / len, y / len];
}

function aPts(tx: number, ty: number, s: number): string {
    const l = Math.sqrt(tx * tx + ty * ty);
    if (l < 2) return "0,0 0,0 0,0";
    const nx = tx / l, ny = ty / l;
    const bx = tx - nx * s, by = ty - ny * s;
    const px = -ny * (s * 0.45), py = nx * (s * 0.45);
    return `${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`;
}

function MiniVecArrow({ vec, color, size = 52, ghost, ghostColor }: {
    vec: number[]; color: string; size?: number;
    ghost?: number[]; ghostColor?: string;
}) {
    const h = size / 2, len = size * 0.38;
    const [nx, ny] = vecToXY(vec);
    const tx = nx * len, ty = -ny * len;
    const gx = ghost ? vecToXY(ghost)[0] * len : 0;
    const gy = ghost ? -vecToXY(ghost)[1] * len : 0;
    return (
        <svg width={size} height={size} viewBox={`${-h} ${-h} ${size} ${size}`} className="block mx-auto">
            <line x1={-h + 2} y1={0} x2={h - 2} y2={0} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1={0} y1={-h + 2} x2={0} y2={h - 2} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <circle cx={0} cy={0} r={len} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
            <circle cx={0} cy={0} r={1} fill="rgba(255,255,255,0.05)" />
            {ghost && ghostColor && (
                <>
                    <line x1={0} y1={0} x2={gx} y2={gy} stroke={ghostColor} strokeWidth={1.2} strokeLinecap="round" opacity={0.15} strokeDasharray="2.5 2.5" />
                    <polygon points={aPts(gx, gy, 3.5)} fill={ghostColor} opacity={0.1} />
                </>
            )}
            <line x1={0} y1={0} x2={tx} y2={ty} stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.06} />
            <line x1={0} y1={0} x2={tx} y2={ty} stroke={color} strokeWidth={1.8} strokeLinecap="round" opacity={0.85} />
            <polygon points={aPts(tx, ty, 4.5)} fill={color} opacity={0.8} />
        </svg>
    );
}

/* Raw compatibility scores derived from log(ATTENTION) — consistent with weights */
const RAW_SCORES: number[][] = ATTENTION.map(row => {
    const logRow = row.map(w => Math.log(Math.max(w, 0.001)));
    const maxVal = Math.max(...logRow);
    return logRow.map(v => +((v - maxVal) + 3).toFixed(2));
});

const ATTENTION_WEIGHTS: number[][] = ATTENTION;

const INTERPRETATIONS: Record<number, string> = {
    0: "\u201CThe\u201D is humble \u2014 it points straight to \u201Cking,\u201D introducing the protagonist of our story.",
    1: "\u201Cking\u201D sends out a powerful search \u2014 it finds \u201Ccrown\u201D (its symbol) and \u201Cruled\u201D (its action). The arrows tell the whole story.",
    2: "\u201Cwho\u201D looks back at \u201Cking\u201D \u2014 a grammatical bridge, connecting the relative clause to its true subject.",
    3: "\u201Cwore\u201D reaches hungrily for \u201Ccrown\u201D \u2014 every verb wants its object. The arrows practically overlap.",
    4: "\u201Cthe\u201D is a quiet servant \u2014 it anchors to \u201Cgolden\u201D and \u201Ccrown,\u201D framing the noun phrase without stealing attention.",
    5: "\u201Cgolden\u201D focuses on \u201Ccrown\u201D with laser precision \u2014 an adjective always knows what it describes.",
    6: "\u201Ccrown\u201D reaches back for \u201Cking\u201D \u2014 seeking its royal owner. The connection is mutual, bidirectional, alive.",
    7: "\u201Cruled\u201D casts a wide net \u2014 it finds \u201Cking\u201D (who rules) and \u201Ckingdom\u201D (what is ruled). Governance in two arrows.",
    8: "Another quiet \u201Cthe\u201D \u2014 it anchors to \u201Ckingdom\u201D and \u201Cvast,\u201D serving its noun phrase faithfully.",
    9: "\u201Cvast\u201D reaches for \u201Ckingdom\u201D \u2014 the thing it paints with grandeur. One arrow, one purpose.",
    10: "\u201Ckingdom\u201D connects to \u201Cking\u201D and \u201Cruled\u201D \u2014 the word carries the weight of ruler and governance both.",
    11: "\u201Cwisely\u201D reaches for \u201Cruled\u201D \u2014 the adverb finds the verb it modifies, completing the sentence\u2019s meaning.",
};

function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 70);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}


export function QueryKeyRelationsViz() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [locked, setLocked] = useState<number | null>(null);
    const [hoveredTarget, setHoveredTarget] = useState<number | null>(null);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

    const active = locked ?? hovered;
    const isIdle = active === null;
    const weights = active !== null ? ATTENTION_WEIGHTS[active] : null;
    const rawScores = active !== null ? RAW_SCORES[active] : null;

    const inspectTarget = useMemo(() => {
        if (active === null) return null;
        if (hoveredTarget !== null && hoveredTarget !== active) return hoveredTarget;
        if (weights) {
            const sorted = weights
                .map((w, i) => ({ w, i }))
                .filter(d => d.i !== active)
                .sort((a, b) => b.w - a.w);
            return sorted[0]?.i ?? null;
        }
        return null;
    }, [active, hoveredTarget, weights]);

    const measure = useCallback(() => {
        if (!containerRef.current) return;
        const cRect = containerRef.current.getBoundingClientRect();
        setPositions(
            wordRefs.current.map((el) => {
                if (!el) return { x: 0, y: 0 };
                const r = el.getBoundingClientRect();
                return { x: r.left + r.width / 2 - cRect.left, y: r.top + r.height / 2 - cRect.top };
            })
        );
    }, []);

    useEffect(() => {
        measure();
        const t = setTimeout(measure, 300);
        window.addEventListener("resize", measure);
        return () => { window.removeEventListener("resize", measure); clearTimeout(t); };
    }, [measure]);

    const topTargets = useMemo(() => {
        if (!weights || active === null) return [];
        return weights
            .map((w, i) => ({ w, i, score: rawScores?.[i] ?? 0 }))
            .filter(d => d.i !== active)
            .sort((a, b) => b.w - a.w);
    }, [weights, active, rawScores]);

    const maxWeight = topTargets.length > 0 ? topTargets[0].w : 1;

    return (
        <div className="py-8 sm:py-12 px-2 sm:px-4" style={{ minHeight: 420 }}>
            <div ref={containerRef} className="relative">
                {/* SVG arc layer */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id="qkr-glow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <AnimatePresence>
                        {active !== null && positions.length === WORDS.length && weights &&
                            WORDS.map((_, toIdx) => {
                                if (toIdx === active) return null;
                                const w = weights[toIdx];
                                if (w < 0.04) return null;
                                const from = positions[active];
                                const to = positions[toIdx];
                                if (!from || !to) return null;
                                const path = arcPath(from, to);
                                const isInspected = toIdx === inspectTarget;
                                const opacity = isInspected ? 0.8 : Math.max(0.06, w * 0.7);
                                const width = isInspected ? 3 : (0.5 + w * 2.5);
                                const arcRgb = w >= 0.30 ? "251, 191, 36" : "34, 211, 238";

                                return (
                                    <motion.path
                                        key={`arc-${active}-${toIdx}`}
                                        d={path}
                                        fill="none"
                                        stroke={`rgba(${arcRgb}, ${opacity})`}
                                        strokeWidth={width}
                                        strokeLinecap="round"
                                        filter="url(#qkr-glow)"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                        transition={{
                                            pathLength: { duration: 0.6, delay: toIdx * 0.03, ease: "easeOut" },
                                            opacity: { duration: 0.4, delay: toIdx * 0.03 },
                                        }}
                                    />
                                );
                            })
                        }
                    </AnimatePresence>
                </svg>

                {/* Sentence */}
                <div
                    className="flex items-baseline gap-x-[0.35em] sm:gap-x-[0.45em] flex-wrap justify-center relative z-10 py-10 sm:py-14 leading-[2.4] sm:leading-[2.6]"
                    onMouseLeave={() => { setHovered(null); setHoveredTarget(null); }}
                >
                    {WORDS.map((word, i) => {
                        const isActive = active === i;
                        const isTarget = active !== null && weights !== null && i !== active;
                        const w = isTarget ? weights[i] : 0;
                        const isStrong = w > 0.10;
                        const isMedium = w > 0.05 && w <= 0.10;
                        const isAmber = isStrong && w >= 0.30;
                        const isInspected = i === inspectTarget;
                        const accentRgb = isAmber ? "251, 191, 36" : "34, 211, 238";

                        const glowRadius = isStrong ? Math.round(8 + w * 40) : 0;
                        const glowOpacity = isStrong ? (w * 0.6).toFixed(2) : "0";

                        const color = isActive
                            ? "#67e8f9"
                            : isInspected
                                ? isAmber ? "#fbbf24" : "#67e8f9"
                                : isAmber
                                    ? `rgba(251, 191, 36, ${0.7 + w * 0.6})`
                                    : isStrong
                                        ? `rgba(165, 243, 252, ${0.6 + w * 0.8})`
                                        : isMedium
                                            ? "rgba(255, 255, 255, 0.45)"
                                            : active !== null && !isActive
                                                ? "rgba(255, 255, 255, 0.22)"
                                                : "rgba(255, 255, 255, 0.65)";

                        const textShadow = isActive
                            ? "0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.15)"
                            : isInspected
                                ? `0 0 18px rgba(${accentRgb}, 0.5)`
                                : isStrong
                                    ? `0 0 ${glowRadius}px rgba(${accentRgb}, ${glowOpacity})`
                                    : "none";

                        return (
                            <motion.span
                                key={i}
                                ref={(el) => { wordRefs.current[i] = el; }}
                                className="relative cursor-pointer select-none font-medium tracking-[-0.01em]"
                                style={{
                                    fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
                                    color,
                                    textShadow,
                                    transition: "color 0.35s ease, text-shadow 0.4s ease",
                                }}
                                onMouseEnter={() => {
                                    if (locked !== null) {
                                        setHoveredTarget(i);
                                    } else {
                                        setHovered(i);
                                    }
                                    requestAnimationFrame(measure);
                                }}
                                onClick={() => {
                                    if (locked === i) {
                                        setLocked(null);
                                        setHoveredTarget(null);
                                    } else {
                                        setLocked(i);
                                        setHoveredTarget(null);
                                    }
                                    requestAnimationFrame(measure);
                                }}
                                animate={{
                                    scale: isActive ? 1.08 : isInspected ? 1.04 : 1,
                                    y: isIdle ? [0, -1.5, 0] : 0,
                                }}
                                transition={
                                    isIdle
                                        ? { y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.3 } }
                                        : { duration: 0.3, ease: "easeOut" }
                                }
                            >
                                {isStrong && (
                                    <motion.span
                                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                        style={{
                                            background: `radial-gradient(ellipse at center, rgba(${accentRgb}, ${(w * 0.18).toFixed(3)}) 0%, transparent 70%)`,
                                            filter: "blur(6px)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}

                                {isActive && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{ background: "linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent)" }}
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        animate={{ scaleX: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                {isInspected && !isActive && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1px] rounded-full pointer-events-none"
                                        style={{ background: `linear-gradient(90deg, transparent, rgba(${accentRgb}, 0.35), transparent)` }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.25 }}
                                    />
                                )}

                                <span className="relative z-10">{word}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* Micro-inspector: Q · K = score */}
            <AnimatePresence mode="wait">
                {active !== null && inspectTarget !== null ? (
                    <motion.div
                        key={`inspect-${active}-${inspectTarget}`}
                        className="max-w-lg mx-auto mt-2 sm:mt-4"
                        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.15 } }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {/* Q · K comparison strip with arrows above numbers */}
                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-4">
                            {/* Q vector with arrow */}
                            <div className="flex flex-col items-center">
                                <div className="text-[9px] uppercase tracking-[0.15em] text-cyan-400/40 font-semibold mb-1">
                                    Q<span className="text-white/20">({WORDS[active]})</span>
                                </div>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <MiniVecArrow vec={Q_VECTORS[active]} color="#22d3ee" size={56} />
                                </motion.div>
                                <div className="flex gap-0.5 mt-1">
                                    {Q_VECTORS[active].map((v, d) => (
                                        <motion.div
                                            key={d}
                                            className="flex flex-col items-center"
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: d * 0.05 }}
                                        >
                                            <span className="text-[6px] text-white/12 mb-0.5 hidden sm:block">{DIM_LABELS[d]}</span>
                                            <span
                                                className="text-[9px] sm:text-[10px] font-mono font-bold px-1 py-0.5 rounded"
                                                style={{ color: "rgba(34, 211, 238, 0.75)", background: "rgba(34, 211, 238, 0.06)" }}
                                            >
                                                {v >= 0 ? "+" : ""}{v.toFixed(1)}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Dot operator */}
                            <motion.span
                                className="text-lg text-white/20 font-light self-center"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 }}
                            >
                                ·
                            </motion.span>

                            {/* K vector with arrow (ghost Q overlay) */}
                            <div className="flex flex-col items-center">
                                <div className="text-[9px] uppercase tracking-[0.15em] text-emerald-400/40 font-semibold mb-1">
                                    K<span className="text-white/20">({WORDS[inspectTarget]})</span>
                                </div>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.25, delay: 0.08 }}
                                >
                                    <MiniVecArrow
                                        vec={K_VECTORS[inspectTarget]}
                                        color="#34d399"
                                        size={56}
                                        ghost={Q_VECTORS[active]}
                                        ghostColor="#22d3ee"
                                    />
                                </motion.div>
                                <div className="flex gap-0.5 mt-1">
                                    {K_VECTORS[inspectTarget].map((v, d) => (
                                        <motion.div
                                            key={d}
                                            className="flex flex-col items-center"
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.08 + d * 0.05 }}
                                        >
                                            <span className="text-[6px] text-white/12 mb-0.5 hidden sm:block">{DIM_LABELS[d]}</span>
                                            <span
                                                className="text-[9px] sm:text-[10px] font-mono font-bold px-1 py-0.5 rounded"
                                                style={{ color: "rgba(52, 211, 153, 0.75)", background: "rgba(52, 211, 153, 0.06)" }}
                                            >
                                                {v >= 0 ? "+" : ""}{v.toFixed(1)}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Equals */}
                            <motion.span
                                className="text-lg text-white/20 font-light self-center"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25 }}
                            >
                                =
                            </motion.span>

                            {/* Score + weight */}
                            <motion.div
                                className="text-center self-center"
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                            >
                                {(() => {
                                    const score = rawScores?.[inspectTarget] ?? 0;
                                    const w = weights?.[inspectTarget] ?? 0;
                                    const isAmber = w >= 0.30;
                                    const scoreColor = isAmber ? "#fbbf24" : w > 0.10 ? "#22d3ee" : "rgba(255,255,255,0.5)";
                                    const scoreBg = isAmber ? "rgba(251,191,36,0.08)" : w > 0.10 ? "rgba(34,211,238,0.08)" : "rgba(255,255,255,0.03)";
                                    return (
                                        <div className="flex flex-col items-center">
                                            <span
                                                className="text-base sm:text-lg font-mono font-black px-2.5 py-1 rounded-lg"
                                                style={{ color: scoreColor, background: scoreBg }}
                                            >
                                                {score.toFixed(2)}
                                            </span>
                                            <span className="text-[9px] text-white/20 mt-0.5 font-mono">
                                                {Math.round(w * 100)}%
                                            </span>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </div>

                        {/* Insight: arrows explain scores */}
                        <div className="text-center mb-3">
                            <p className="text-[10px] text-white/18 italic">
                                The closer the arrows point, the higher the score. It&apos;s not magic &mdash; it&apos;s geometry.
                            </p>
                        </div>

                        {/* Top targets ranking */}
                        <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap mb-3">
                            {topTargets.slice(0, 4).map(({ w, i }, rank) => {
                                const rel = w / maxWeight;
                                const dotSize = Math.round(4 + rel * 4);
                                const isAmber = w >= 0.30;
                                const dotRgb = isAmber ? "251, 191, 36" : "34, 211, 238";
                                const isCurrentInspect = i === inspectTarget;
                                return (
                                    <motion.span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 cursor-pointer"
                                        style={{ opacity: isCurrentInspect ? 1 : 0.5 + rel * 0.3 }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: isCurrentInspect ? 1 : 0.5 + rel * 0.3, scale: 1 }}
                                        transition={{ delay: 0.4 + rank * 0.05, duration: 0.3 }}
                                        onMouseEnter={() => setHoveredTarget(i)}
                                    >
                                        <span
                                            className="rounded-full shrink-0"
                                            style={{
                                                width: dotSize,
                                                height: dotSize,
                                                background: `rgba(${dotRgb}, ${(0.3 + rel * 0.5).toFixed(2)})`,
                                                boxShadow: isCurrentInspect
                                                    ? `0 0 ${dotSize * 3}px rgba(${dotRgb}, 0.4)`
                                                    : rel > 0.5 ? `0 0 ${dotSize * 2}px rgba(${dotRgb}, ${(rel * 0.25).toFixed(2)})` : "none",
                                            }}
                                        />
                                        <span
                                            className="text-[13px] sm:text-sm font-medium"
                                            style={{
                                                color: isCurrentInspect
                                                    ? isAmber ? "#fbbf24" : "#67e8f9"
                                                    : `rgba(255,255,255, ${(0.25 + rel * 0.4).toFixed(2)})`,
                                            }}
                                        >
                                            {WORDS[i]}
                                        </span>
                                        <span className="text-[10px] font-mono text-white/15 tabular-nums">
                                            {Math.round(w * 100)}%
                                        </span>
                                    </motion.span>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : active !== null ? (
                    <motion.p
                        key="select-target"
                        className="text-center text-[13px] text-white/30 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.2, 0.45, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        Now hover another word to compare Q · K
                    </motion.p>
                ) : (
                    <motion.p
                        key="idle-hint"
                        className="text-center text-[13px] sm:text-sm text-white/30 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    >
                        Click any word to select it as Query
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Interpretive footer */}
            <AnimatePresence>
                {active !== null && INTERPRETATIONS[active] && (
                    <motion.p
                        key={`interp-${active}`}
                        className="text-center text-[12px] sm:text-[13px] leading-relaxed text-white/25 italic max-w-sm mx-auto mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                    >
                        {INTERPRETATIONS[active]}
                    </motion.p>
                )}
            </AnimatePresence>

        </div>
    );
}
