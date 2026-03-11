"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ATTENTION } from "./SpotlightViz";

/*
  FullContextualAssemblyViz — "The Living Sentence" v3
  Constellation-style: ALL arcs visible (like AttentionWebViz).
  Each word has a unique color. After "Contextualize", each word's
  color becomes a weighted RGB blend of its contributors' colors.
  Hover any word → composition breakdown with colored dots.
*/

const WORDS = ["The", "king", "who", "wore", "the", "golden", "crown", "ruled", "the", "vast", "kingdom", "wisely"];

/* ─── Unique color per word (HSL → RGB stored as [r,g,b] 0-255) ─── */
const WORD_HUES: number[] = [
    210,  // The      → steel blue
    45,   // king     → gold
    280,  // who      → purple
    175,  // wore     → teal
    310,  // the      → magenta-pink
    55,   // golden   → warm yellow
    25,   // crown    → orange
    220,  // ruled    → royal blue
    150,  // the      → seafoam green
    95,   // vast     → lime green
    0,    // kingdom  → crimson red
    260,  // wisely   → indigo
];

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/* Original colors: vivid, saturated */
const WORD_RGB: [number, number, number][] = WORD_HUES.map(h => hslToRgb(h, 0.75, 0.6));

/* Adaptive boost based on max attention weight per word */
const getAdaptiveBoost = (maxWeight: number): number => {
    if (maxWeight >= 0.50) return 0.85;  // Very strong: 85% to top contributors
    if (maxWeight >= 0.35) return 0.75;  // Strong: 75% to top contributors  
    return 0.70;                         // Default: 70% to top contributors
};

/* Blended colors after attention: adaptive boost for strong relationships */
const BLENDED_RGB: [number, number, number][] = WORDS.map((_, focusIdx) => {
    const weights = ATTENTION[focusIdx];

    // Find max weight (excluding self) for adaptive boost
    const maxWeight = Math.max(...weights.filter((_, i) => i !== focusIdx));
    const boost = getAdaptiveBoost(maxWeight);

    // Sort contributors by weight (excluding self)
    const sorted = weights
        .map((w, i) => ({ w, i }))
        .filter(d => d.i !== focusIdx)
        .sort((a, b) => b.w - a.w);

    // Top 3 contributors get boosted weight
    const topCount = Math.min(3, sorted.length);
    let r = 0, g = 0, b = 0;

    // Boosted contribution from top contributors
    for (let i = 0; i < topCount; i++) {
        const { w, i: idx } = sorted[i];
        const boostedWeight = (w / (1 - weights[focusIdx])) * boost;
        r += boostedWeight * WORD_RGB[idx][0];
        g += boostedWeight * WORD_RGB[idx][1];
        b += boostedWeight * WORD_RGB[idx][2];
    }

    // Remaining weight distributed to all others
    const remainingWeight = 1 - boost;
    for (let i = 0; i < WORDS.length; i++) {
        if (i === focusIdx) continue;
        const w = weights[i];
        const normalizedWeight = w / (1 - weights[focusIdx]);
        r += normalizedWeight * remainingWeight * WORD_RGB[i][0];
        g += normalizedWeight * remainingWeight * WORD_RGB[i][1];
        b += normalizedWeight * remainingWeight * WORD_RGB[i][2];
    }

    return [Math.round(r), Math.round(g), Math.round(b)] as [number, number, number];
});

/* Top contributors per word */
interface Contributor { i: number; w: number; rgb: [number, number, number] }
const TOP_CONTRIBUTORS: Contributor[][] = WORDS.map((_, focusIdx) => {
    return ATTENTION[focusIdx]
        .map((w, i) => ({ i, w, rgb: WORD_RGB[i] }))
        .filter(d => d.i !== focusIdx && d.w >= 0.04)
        .sort((a, b) => b.w - a.w)
        .slice(0, 5);
});

function rgbStr(c: [number, number, number], alpha = 1): string {
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

/* ─── Before/After feature data for click-to-inspect ─── */
const INSPECT_FEATURES = ["royalty", "action", "object", "quality", "context"];

const BEFORE_FEAT: Record<number, number[]> = {
    0: [0.05, 0.05, 0.05, 0.10, 0.08],
    1: [0.85, 0.20, 0.15, 0.12, 0.10],
    2: [0.10, 0.05, 0.08, 0.05, 0.06],
    3: [0.12, 0.75, 0.20, 0.15, 0.10],
    4: [0.05, 0.05, 0.05, 0.10, 0.08],
    5: [0.20, 0.10, 0.15, 0.90, 0.12],
    6: [0.65, 0.10, 0.85, 0.25, 0.12],
    7: [0.20, 0.88, 0.12, 0.10, 0.14],
    8: [0.05, 0.05, 0.05, 0.10, 0.08],
    9: [0.15, 0.08, 0.12, 0.78, 0.10],
    10: [0.80, 0.12, 0.72, 0.18, 0.15],
    11: [0.12, 0.10, 0.08, 0.72, 0.12],
};

const AFTER_FEAT: Record<number, number[]> = {
    1: [0.92, 0.55, 0.40, 0.70, 0.85],
    3: [0.25, 0.82, 0.45, 0.50, 0.65],
    5: [0.40, 0.18, 0.30, 0.95, 0.55],
    6: [0.78, 0.30, 0.90, 0.65, 0.80],
    7: [0.55, 0.92, 0.35, 0.45, 0.78],
    10: [0.88, 0.38, 0.80, 0.55, 0.82],
    11: [0.30, 0.35, 0.20, 0.80, 0.60],
};

/* Arc threshold */
const ARC_THRESHOLD = 0.06;

/* Arc path — above or below based on index order */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }, below = false): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.32, 80);
    const midX = (from.x + to.x) / 2;
    const midY = below
        ? Math.max(from.y, to.y) + curvature
        : Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

/* Precompute all arc pairs above threshold */
interface ArcData { from: number; to: number; weight: number }
const ALL_ARCS: ArcData[] = [];
for (let i = 0; i < WORDS.length; i++) {
    for (let j = 0; j < WORDS.length; j++) {
        if (i === j) continue;
        if (ATTENTION[i][j] >= ARC_THRESHOLD) {
            ALL_ARCS.push({ from: i, to: j, weight: ATTENTION[i][j] });
        }
    }
}

/* Bezier interpolation for particles */
function bezierPt(from: { x: number; y: number }, to: { x: number; y: number }, t: number, below: boolean) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.32, 80);
    const cx = (from.x + to.x) / 2;
    const cy = below ? Math.max(from.y, to.y) + curvature : Math.min(from.y, to.y) - curvature;
    const u = 1 - t;
    return { x: u * u * from.x + 2 * u * t * cx + t * t * to.x, y: u * u * from.y + 2 * u * t * cy + t * t * to.y };
}

type Phase = "idle" | "transporting" | "done";

export function FullContextualAssemblyViz() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [hovered, setHovered] = useState<number | null>(null);
    const [locked, setLocked] = useState<number | null>(null);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
    const [transportT, setTransportT] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const rafRef = useRef<number>(0);



    const active = phase === "done" ? (locked ?? hovered) : (locked ?? hovered);
    const isDone = phase === "done";

    /* Measure word positions */
    const measure = useCallback(() => {
        if (!containerRef.current) return;
        const cRect = containerRef.current.getBoundingClientRect();
        setPositions(
            wordRefs.current.map(el => {
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

    /* Transport animation */
    const startTransport = useCallback(() => {
        setPhase("transporting");
        setTransportT(0);
        setLocked(null);
        setHovered(null);
        const start = performance.now();
        const duration = 1800;
        const tick = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            setTransportT(t);
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setPhase("done");
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    const reset = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        setPhase("idle");
        setTransportT(0);
        setLocked(null);
        setHovered(null);
    }, []);

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    /* Contributors for active word */
    const contributors = useMemo(() => {
        if (active === null || !isDone) return [];
        return TOP_CONTRIBUTORS[active];
    }, [active, isDone]);

    return (
        <div className="py-8 sm:py-12 px-2 sm:px-4" style={{ minHeight: 360 }}>

            <div ref={containerRef} className="relative">
                {/* SVG arc constellation */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id="fca3-glow">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <filter id="fca3-particle">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* All arcs */}
                    {positions.length === WORDS.length && ALL_ARCS.map((arc, idx) => {
                        const p1 = positions[arc.from];
                        const p2 = positions[arc.to];
                        if (!p1 || !p2) return null;
                        const below = arc.from > arc.to;
                        const path = arcPath(p1, p2, below);
                        const srcRgb = WORD_RGB[arc.from];

                        /* Visibility logic */
                        const isFromActive = isDone && active === arc.from;
                        const isToActive = isDone && active === arc.to;
                        const isRelated = isDone && active !== null && (arc.from === active || arc.to === active);

                        let strokeOpacity: number;
                        let strokeWidth: number;

                        if (phase === "idle") {
                            strokeOpacity = 0.08 + arc.weight * 0.4;
                            strokeWidth = 0.4 + arc.weight * 2.5;
                        } else if (phase === "transporting") {
                            const fade = transportT < 0.3 ? 1 : Math.max(0.15, 1 - (transportT - 0.3) * 1.2);
                            strokeOpacity = (0.08 + arc.weight * 0.4) * fade;
                            strokeWidth = 0.4 + arc.weight * 2.5;
                        } else if (isToActive) {
                            strokeOpacity = 0.2 + arc.weight * 0.6;
                            strokeWidth = 0.5 + arc.weight * 3;
                        } else if (isFromActive) {
                            strokeOpacity = 0.06 + arc.weight * 0.15;
                            strokeWidth = 0.3 + arc.weight * 1.5;
                        } else if (isRelated) {
                            strokeOpacity = 0.04 + arc.weight * 0.1;
                            strokeWidth = 0.3 + arc.weight * 1;
                        } else if (isDone && active !== null) {
                            strokeOpacity = 0.015;
                            strokeWidth = 0.2;
                        } else {
                            /* done, no hover */
                            strokeOpacity = 0.04;
                            strokeWidth = 0.3;
                        }

                        return (
                            <motion.path
                                key={`${arc.from}-${arc.to}`}
                                d={path}
                                fill="none"
                                stroke={rgbStr(srcRgb, strokeOpacity)}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                filter={(isToActive && arc.weight > 0.12) ? "url(#fca3-glow)" : undefined}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: 1,
                                    strokeWidth,
                                    stroke: rgbStr(srcRgb, strokeOpacity),
                                }}
                                transition={{
                                    pathLength: { duration: 0.8, delay: idx * 0.01, ease: "easeOut" },
                                    opacity: { duration: 0.5, delay: idx * 0.01 },
                                    strokeWidth: { duration: 0.3 },
                                    stroke: { duration: 0.3 },
                                }}
                            />
                        );
                    })}

                    {/* Transport particles */}
                    {phase === "transporting" && positions.length === WORDS.length &&
                        ALL_ARCS.filter(a => a.weight >= 0.08).map((arc) => {
                            const p1 = positions[arc.from];
                            const p2 = positions[arc.to];
                            if (!p1 || !p2) return null;
                            const below = arc.from > arc.to;
                            const pt = bezierPt(p1, p2, transportT, below);
                            const size = 2 + arc.weight * 5;
                            const srcRgb = WORD_RGB[arc.from];
                            const alpha = transportT < 0.08
                                ? transportT / 0.08
                                : transportT > 0.85
                                    ? (1 - transportT) / 0.15
                                    : 0.7 + arc.weight * 0.3;

                            return (
                                <circle
                                    key={`p-${arc.from}-${arc.to}`}
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={size}
                                    fill={rgbStr(srcRgb, alpha)}
                                    filter="url(#fca3-particle)"
                                />
                            );
                        })
                    }
                </svg>

                {/* Words */}
                <div
                    className="flex items-baseline gap-x-[0.3em] sm:gap-x-[0.4em] flex-wrap justify-center relative z-10 py-12 sm:py-16 leading-[2.4] sm:leading-[2.6]"
                    onMouseLeave={() => { if (!locked) setHovered(null); }}
                >
                    {WORDS.map((word, i) => {

                        const origRgb = WORD_RGB[i];
                        const blendRgb = BLENDED_RGB[i];

                        /* In "done" state, use blended color; otherwise original */
                        const displayRgb = isDone ? blendRgb : origRgb;

                        const isActive = active === i;
                        const isTarget = isDone && active !== null && i !== active;
                        const w = isTarget ? ATTENTION[active!][i] : 0;

                        /* Color */
                        let color: string;
                        let textShadow: string;

                        if (phase === "idle") {
                            color = rgbStr(origRgb, 0.85);
                            textShadow = `0 0 12px ${rgbStr(origRgb, 0.2)}`;
                        } else if (phase === "transporting") {
                            /* Lerp from original to blended */
                            const t = transportT;
                            const lr = Math.round(origRgb[0] * (1 - t) + blendRgb[0] * t);
                            const lg = Math.round(origRgb[1] * (1 - t) + blendRgb[1] * t);
                            const lb = Math.round(origRgb[2] * (1 - t) + blendRgb[2] * t);
                            color = `rgba(${lr}, ${lg}, ${lb}, 0.85)`;
                            textShadow = `0 0 ${8 + t * 10}px rgba(${lr}, ${lg}, ${lb}, ${(0.15 + t * 0.2).toFixed(2)})`;
                        } else if (isActive) {
                            color = rgbStr(displayRgb, 1);
                            textShadow = `0 0 20px ${rgbStr(displayRgb, 0.45)}, 0 0 40px ${rgbStr(displayRgb, 0.15)}`;
                        } else if (isTarget && w > 0.10) {
                            color = rgbStr(displayRgb, 0.7 + w * 0.5);
                            textShadow = `0 0 ${Math.round(8 + w * 30)}px ${rgbStr(displayRgb, w * 0.35)}`;
                        } else if (isDone && active !== null) {
                            color = rgbStr(displayRgb, 0.2);
                            textShadow = "none";
                        } else {
                            /* done, no hover */
                            color = rgbStr(displayRgb, 0.8);
                            textShadow = `0 0 10px ${rgbStr(displayRgb, 0.15)}`;
                        }

                        return (
                            <motion.span
                                key={i}
                                ref={el => { wordRefs.current[i] = el; }}
                                className={`relative select-none font-medium tracking-[-0.01em] ${isDone ? "cursor-pointer" : ""}`}
                                style={{
                                    fontSize: "clamp(0.95rem, 2vw, 1.25rem)",
                                    color,
                                    textShadow,
                                    transition: phase === "transporting" ? "none" : "color 0.35s ease, text-shadow 0.4s ease",
                                }}
                                onMouseEnter={() => {
                                    if (phase === "idle" || isDone) {
                                        if (!locked) setHovered(i);
                                    }
                                    requestAnimationFrame(measure);
                                }}
                                onClick={() => {
                                    if (phase === "idle" || isDone) {
                                        setLocked(locked === i ? null : i);
                                        requestAnimationFrame(measure);
                                    }
                                }}
                                animate={{
                                    scale: isActive ? 1.08 : 1,
                                    y: phase === "idle" && !active ? [0, -1, 0] : 0,
                                }}
                                transition={
                                    phase === "idle" && !active
                                        ? { y: { duration: 3.5 + i * 0.3, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.25 } }
                                        : { duration: 0.25, ease: "easeOut" }
                                }
                            >
                                {/* Glow halo */}
                                {isActive && isDone && (
                                    <motion.span
                                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                        style={{
                                            background: `radial-gradient(ellipse at center, ${rgbStr(displayRgb, 0.15)} 0%, transparent 70%)`,
                                            filter: "blur(6px)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                {/* Active underline */}
                                {isActive && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{ background: `linear-gradient(90deg, transparent, ${rgbStr(displayRgb, 0.5)}, transparent)` }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                <span className="relative z-10">{word}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* ═══ Button / Composition ═══ */}
            <AnimatePresence mode="wait">
                {phase === "idle" ? (
                    <motion.div
                        key="idle-ui"
                        className="text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        transition={{ delay: 0.5 }}
                    >
                        <motion.button
                            onClick={startTransport}
                            className="px-5 py-2 rounded-xl text-[13px] font-semibold border cursor-pointer mb-3"
                            style={{
                                background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(251,191,36,0.04))",
                                borderColor: "rgba(34,211,238,0.2)",
                                color: "rgba(34,211,238,0.7)",
                                boxShadow: "0 0 16px -6px rgba(34,211,238,0.15)",
                            }}
                            whileHover={{ scale: 1.03, boxShadow: "0 0 20px -4px rgba(34,211,238,0.25)" }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {"Contextualize All \u2192"}
                        </motion.button>
                        <p className="text-[12px] text-white/20 italic">
                            Each word has its own color. Watch them blend.
                        </p>
                    </motion.div>
                ) : phase === "transporting" ? (
                    <motion.div
                        key="transport-ui"
                        className="text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {/* Progress bar */}
                        <div className="max-w-[200px] mx-auto h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    width: `${transportT * 100}%`,
                                    background: "linear-gradient(90deg, rgba(34,211,238,0.6), rgba(251,191,36,0.4))",
                                }}
                            />
                        </div>
                        <p className="text-[11px] text-white/20 mt-2 italic">
                            Transporting values...
                        </p>
                    </motion.div>
                ) : isDone && active !== null && contributors.length > 0 ? (
                    <motion.div
                        key={`inspect-${active}`}
                        className="max-w-md mx-auto"
                        initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -4, filter: "blur(4px)", transition: { duration: 0.15 } }}
                        transition={{ duration: 0.35 }}
                    >
                        {/* Word name */}
                        <p className="text-center text-[10px] uppercase tracking-[0.15em] text-white/25 font-semibold mb-2">
                            {`\u201C${WORDS[active]}\u201D is now a blend of`}
                        </p>

                        {/* Composition breakdown with colored dots */}
                        <div className="flex items-center justify-center gap-x-3 gap-y-1.5 flex-wrap mb-3">
                            {contributors.map(({ w, i, rgb }, rank) => {
                                const maxW = contributors[0]?.w || 1;
                                const rel = maxW > 0 ? w / maxW : 0;
                                const dotSize = Math.round(4 + rel * 4);
                                return (
                                    <motion.span
                                        key={i}
                                        className="inline-flex items-center gap-1.5"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 0.5 + rel * 0.5, scale: 1 }}
                                        transition={{ delay: rank * 0.04, duration: 0.25 }}
                                    >
                                        <span
                                            className="rounded-full shrink-0"
                                            style={{
                                                width: dotSize, height: dotSize,
                                                background: rgbStr(rgb, 0.4 + rel * 0.5),
                                                boxShadow: rel > 0.5 ? `0 0 ${dotSize * 2}px ${rgbStr(rgb, 0.3)}` : "none",
                                            }}
                                        />
                                        <span
                                            className="text-[12px] sm:text-[13px] font-medium"
                                            style={{ color: rgbStr(rgb, 0.5 + rel * 0.4) }}
                                        >
                                            {WORDS[i]}
                                        </span>
                                        <span className="text-[9px] font-mono text-white/20 tabular-nums">
                                            {Math.round(w * 100)}%
                                        </span>
                                    </motion.span>
                                );
                            })}
                        </div>

                        {/* Before / After feature bars */}
                        {(() => {
                            const before = BEFORE_FEAT[active] ?? [0.2, 0.2, 0.2, 0.2, 0.2];
                            const after = AFTER_FEAT[active] ?? before.map(v => Math.min(1, v + 0.25));
                            const strongest = contributors[0];
                            const displayRgbVal = BLENDED_RGB[active];

                            return (
                                <motion.div
                                    className="max-w-xs mx-auto mt-1 mb-3 space-y-3"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ delay: 0.2, duration: 0.35 }}
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Before column */}
                                        <div className="space-y-1">
                                            <p className="text-[8px] uppercase tracking-widest font-semibold text-white/15 text-center">Before</p>
                                            {INSPECT_FEATURES.map((feat, fi) => (
                                                <div key={fi} className="flex items-center gap-1.5">
                                                    <span className="text-[8px] text-white/18 w-10 text-right truncate shrink-0">{feat}</span>
                                                    <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                                        <div className="h-full rounded-full" style={{ width: `${before[fi] * 100}%`, background: "rgba(255,255,255,0.18)" }} />
                                                    </div>
                                                    <span className="text-[8px] font-mono text-white/15 w-5 text-right tabular-nums">{Math.round(before[fi] * 100)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* After column */}
                                        <div className="space-y-1">
                                            <p className="text-[8px] uppercase tracking-widest font-semibold text-center" style={{ color: rgbStr(displayRgbVal, 0.35) }}>After</p>
                                            {INSPECT_FEATURES.map((feat, fi) => {
                                                const changed = Math.abs(after[fi] - before[fi]) > 0.08;
                                                return (
                                                    <div key={fi} className="flex items-center gap-1.5">
                                                        <span className="text-[8px] text-white/18 w-10 text-right truncate shrink-0">{feat}</span>
                                                        <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                                            <motion.div
                                                                className="h-full rounded-full"
                                                                initial={{ width: `${before[fi] * 100}%` }}
                                                                animate={{ width: `${after[fi] * 100}%` }}
                                                                transition={{ type: "spring", stiffness: 80, damping: 14, delay: fi * 0.06 }}
                                                                style={{
                                                                    background: changed
                                                                        ? `linear-gradient(90deg, ${rgbStr(displayRgbVal, 0.35)}, ${rgbStr(displayRgbVal, 0.65)})`
                                                                        : rgbStr(displayRgbVal, 0.3),
                                                                    boxShadow: changed ? `0 0 6px ${rgbStr(displayRgbVal, 0.2)}` : "none",
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-[8px] font-mono tabular-nums w-5 text-right" style={{ color: changed ? rgbStr(displayRgbVal, 0.6) : "rgba(255,255,255,0.15)" }}>
                                                            {Math.round(after[fi] * 100)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {strongest && (
                                        <p className="text-[10px] text-center text-white/20">
                                            Strongest influence: <span className="font-medium" style={{ color: rgbStr(strongest.rgb, 0.6) }}>{WORDS[strongest.i]}</span>
                                            <span className="font-mono text-white/15 ml-1">{Math.round(strongest.w * 100)}%</span>
                                        </p>
                                    )}
                                </motion.div>
                            );
                        })()}

                        {/* Reset */}
                        <div className="text-center">
                            <button
                                onClick={reset}
                                className="text-[11px] text-white/15 hover:text-white/30 transition-colors cursor-pointer"
                            >
                                {"\u21BB Reset"}
                            </button>
                        </div>
                    </motion.div>
                ) : isDone ? (
                    <motion.div
                        key="done-idle"
                        className="text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <motion.p
                            className="text-[13px] text-white/25 mb-3"
                            animate={{ opacity: [0.15, 0.3, 0.15] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            Hover any word to see its new composition
                        </motion.p>
                        <button
                            onClick={reset}
                            className="text-[11px] text-white/15 hover:text-white/30 transition-colors cursor-pointer"
                        >
                            {"\u21BB Reset"}
                        </button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
