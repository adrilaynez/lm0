"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  AttentionWebViz — Flagship full-attention constellation
  Shows ALL attention connections at once as a web of ultra-thin ghost arcs.
  Sentence: "The king who wore the golden crown ruled the vast kingdom wisely"
  Hover/click a word → its outgoing arcs brighten, targets illuminate, everything else recedes.
  Idle state: beautiful web of faint connections, words glow by total incoming attention.
  Cyan for most connections, amber highlights for the strongest.
*/

const WORDS = ["The", "king", "who", "wore", "the", "golden", "crown", "ruled", "the", "vast", "kingdom", "wisely"];

/* Realistic attention matrix (each row sums to ~1) */
const ATTENTION: number[][] = [
    /* The(0)     */[0.03, 0.45, 0.08, 0.05, 0.04, 0.06, 0.12, 0.05, 0.03, 0.02, 0.05, 0.02],
    /* king(1)    */[0.04, 0.03, 0.12, 0.06, 0.03, 0.05, 0.22, 0.15, 0.03, 0.03, 0.18, 0.06],
    /* who(2)     */[0.05, 0.42, 0.03, 0.25, 0.04, 0.03, 0.08, 0.04, 0.02, 0.01, 0.02, 0.01],
    /* wore(3)    */[0.03, 0.20, 0.10, 0.03, 0.06, 0.15, 0.30, 0.04, 0.02, 0.02, 0.03, 0.02],
    /* the(4)     */[0.04, 0.05, 0.03, 0.04, 0.03, 0.32, 0.40, 0.03, 0.02, 0.01, 0.02, 0.01],
    /* golden(5)  */[0.03, 0.08, 0.02, 0.05, 0.06, 0.03, 0.55, 0.04, 0.03, 0.02, 0.06, 0.03],
    /* crown(6)   */[0.04, 0.25, 0.05, 0.18, 0.05, 0.22, 0.03, 0.06, 0.02, 0.02, 0.05, 0.03],
    /* ruled(7)   */[0.03, 0.30, 0.05, 0.04, 0.03, 0.03, 0.08, 0.03, 0.03, 0.04, 0.25, 0.09],
    /* the(8)     */[0.03, 0.04, 0.02, 0.02, 0.04, 0.03, 0.03, 0.05, 0.03, 0.30, 0.35, 0.06],
    /* vast(9)    */[0.02, 0.05, 0.01, 0.02, 0.02, 0.02, 0.03, 0.05, 0.06, 0.03, 0.60, 0.09],
    /* kingdom(10)*/[0.03, 0.28, 0.03, 0.03, 0.03, 0.03, 0.08, 0.20, 0.04, 0.12, 0.03, 0.10],
    /* wisely(11) */[0.02, 0.22, 0.03, 0.02, 0.02, 0.02, 0.05, 0.40, 0.03, 0.03, 0.12, 0.04],
];

/* Precompute total incoming attention per word (for base glow) */
const INCOMING = WORDS.map((_, colIdx) =>
    ATTENTION.reduce((sum, row) => sum + row[colIdx], 0) / WORDS.length
);
const MAX_INCOMING = Math.max(...INCOMING);

/* Arc threshold — only show arcs with weight above this */
const ARC_THRESHOLD = 0.06;

/* Amber threshold — arcs above this weight get amber tint */
const AMBER_THRESHOLD = 0.30;

/* ─── Arc path — above or below ─── */
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
interface ArcData { from: number; to: number; weight: number; isAmber: boolean }
const ALL_ARCS: ArcData[] = [];
for (let i = 0; i < WORDS.length; i++) {
    for (let j = 0; j < WORDS.length; j++) {
        if (i === j) continue;
        const w = ATTENTION[i][j];
        if (w >= ARC_THRESHOLD) {
            ALL_ARCS.push({ from: i, to: j, weight: w, isAmber: w >= AMBER_THRESHOLD });
        }
    }
}

export function AttentionWebViz() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [locked, setLocked] = useState<number | null>(null);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

    const active = locked ?? hovered;
    const isIdle = active === null;

    /* Measure word positions */
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

    /* Outgoing weights for active word */
    const activeWeights = active !== null ? ATTENTION[active] : null;

    return (
        <div className="py-8 sm:py-12 px-2 sm:px-4 space-y-3">
            {/* ═══ Sentence + arc web ═══ */}
            <div ref={containerRef} className="relative">
                {/* SVG arc web */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id="web-glow-cyan">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <filter id="web-glow-amber">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {positions.length === WORDS.length && ALL_ARCS.map((arc, idx) => {
                        const p1 = positions[arc.from];
                        const p2 = positions[arc.to];
                        if (!p1 || !p2) return null;

                        /* Arcs from lower→higher index go above, higher→lower go below */
                        const below = arc.from > arc.to;
                        const path = arcPath(p1, p2, below);
                        const isFromActive = active === arc.from;
                        const isRelated = active !== null && (arc.from === active || arc.to === active);

                        /* Idle: faint web. Active: bright for active word's arcs, ghost for others */
                        let strokeOpacity: number;
                        let strokeWidth: number;
                        let rgb: string;

                        if (isIdle) {
                            /* Idle constellation: clearly visible dense web */
                            strokeOpacity = 0.12 + arc.weight * 0.5;
                            strokeWidth = 0.5 + arc.weight * 2.8;
                            rgb = arc.isAmber ? "251, 191, 36" : "34, 211, 238";
                        } else if (isFromActive) {
                            /* This arc originates from the hovered/locked word */
                            strokeOpacity = 0.25 + arc.weight * 0.6;
                            strokeWidth = 0.6 + arc.weight * 3;
                            rgb = arc.isAmber ? "251, 191, 36" : "34, 211, 238";
                        } else if (isRelated) {
                            /* Arc involves the active word but is incoming */
                            strokeOpacity = 0.08 + arc.weight * 0.2;
                            strokeWidth = 0.4 + arc.weight * 1.5;
                            rgb = arc.isAmber ? "251, 191, 36" : "34, 211, 238";
                        } else {
                            /* Unrelated arc — dim heavily */
                            strokeOpacity = 0.02;
                            strokeWidth = 0.2;
                            rgb = "34, 211, 238";
                        }

                        return (
                            <motion.path
                                key={`${arc.from}-${arc.to}`}
                                d={path}
                                fill="none"
                                stroke={`rgba(${rgb}, ${strokeOpacity})`}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                filter={isFromActive && arc.weight > 0.15 ? (arc.isAmber ? "url(#web-glow-amber)" : "url(#web-glow-cyan)") : undefined}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: 1,
                                    opacity: 1,
                                    strokeWidth,
                                    stroke: `rgba(${rgb}, ${strokeOpacity})`,
                                }}
                                transition={{
                                    pathLength: { duration: 0.8, delay: idx * 0.012, ease: "easeOut" },
                                    opacity: { duration: 0.5, delay: idx * 0.012 },
                                    strokeWidth: { duration: 0.3, ease: "easeOut" },
                                    stroke: { duration: 0.3, ease: "easeOut" },
                                }}
                            />
                        );
                    })}
                </svg>

                {/* Words as inline text */}
                <div
                    className="flex items-baseline gap-x-[0.3em] sm:gap-x-[0.4em] flex-wrap justify-center relative z-10 py-12 sm:py-16 leading-[2.4] sm:leading-[2.6]"
                    onMouseLeave={() => setHovered(null)}
                >
                    {WORDS.map((word, i) => {
                        const isActive = active === i;
                        const isTarget = active !== null && i !== active;
                        const w = isTarget && activeWeights ? activeWeights[i] : 0;
                        const isStrong = w > 0.12;
                        const isMedium = w > 0.06 && w <= 0.12;
                        const incomingNorm = INCOMING[i] / MAX_INCOMING;

                        /* Color logic */
                        const color = isActive
                            ? "#67e8f9"
                            : isStrong
                                ? w >= AMBER_THRESHOLD
                                    ? `rgba(251, 191, 36, ${0.7 + w * 0.6})`
                                    : `rgba(165, 243, 252, ${0.6 + w * 0.8})`
                                : isMedium
                                    ? "rgba(255, 255, 255, 0.45)"
                                    : active !== null && !isActive
                                        ? "rgba(255, 255, 255, 0.18)"
                                        : `rgba(255, 255, 255, ${0.35 + incomingNorm * 0.35})`;

                        /* Glow */
                        const glowR = isStrong ? Math.round(8 + w * 40) : 0;
                        const textShadow = isActive
                            ? "0 0 22px rgba(34, 211, 238, 0.5), 0 0 44px rgba(34, 211, 238, 0.2)"
                            : isStrong
                                ? w >= AMBER_THRESHOLD
                                    ? `0 0 ${glowR}px rgba(251, 191, 36, ${(w * 0.5).toFixed(2)})`
                                    : `0 0 ${glowR}px rgba(34, 211, 238, ${(w * 0.5).toFixed(2)})`
                                : "none";

                        return (
                            <motion.span
                                key={i}
                                ref={(el) => { wordRefs.current[i] = el; }}
                                className="relative cursor-pointer select-none font-medium tracking-[-0.01em]"
                                style={{
                                    fontSize: "clamp(0.95rem, 2vw, 1.25rem)",
                                    color,
                                    textShadow,
                                    transition: "color 0.35s ease, text-shadow 0.4s ease",
                                }}
                                onMouseEnter={() => {
                                    setHovered(i);
                                    requestAnimationFrame(measure);
                                }}
                                onClick={() => {
                                    setLocked(locked === i ? null : i);
                                    requestAnimationFrame(measure);
                                }}
                                animate={{
                                    scale: isActive ? 1.08 : 1,
                                    y: isIdle ? [0, -1, 0] : 0,
                                }}
                                transition={
                                    isIdle
                                        ? { y: { duration: 3.5 + i * 0.3, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.25 } }
                                        : { duration: 0.25, ease: "easeOut" }
                                }
                            >
                                {/* Diffused glow halo */}
                                {isStrong && (
                                    <motion.span
                                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                        style={{
                                            background: w >= AMBER_THRESHOLD
                                                ? `radial-gradient(ellipse at center, rgba(251, 191, 36, ${(w * 0.16).toFixed(3)}) 0%, transparent 70%)`
                                                : `radial-gradient(ellipse at center, rgba(34, 211, 238, ${(w * 0.16).toFixed(3)}) 0%, transparent 70%)`,
                                            filter: "blur(6px)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}

                                {/* Active underline */}
                                {isActive && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{ background: "linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent)" }}
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

            {/* ═══ Focus caption / idle hint ═══ */}
            <AnimatePresence mode="wait">
                {active !== null && activeWeights ? (
                    <motion.div
                        key={`focus-${active}`}
                        className="max-w-lg mx-auto text-center"
                        initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -4, filter: "blur(4px)", transition: { duration: 0.15 } }}
                        transition={{ duration: 0.35 }}
                    >
                        {/* Top-3 targets inline */}
                        <div className="flex items-center justify-center gap-x-3 gap-y-1 flex-wrap">
                            {activeWeights
                                .map((w, i) => ({ w, i }))
                                .filter((d) => d.i !== active)
                                .sort((a, b) => b.w - a.w)
                                .slice(0, 4)
                                .map(({ w, i }) => {
                                    const isAmber = w >= AMBER_THRESHOLD;
                                    const rgb = isAmber ? "251,191,36" : "34,211,238";
                                    const maxW = activeWeights.filter((_, idx) => idx !== active).sort((a, b) => b - a)[0] || 1;
                                    const rel = w / maxW;
                                    const dotSize = Math.round(3 + rel * 4);
                                    return (
                                        <span key={i} className="inline-flex items-center gap-1">
                                            <span
                                                className="rounded-full shrink-0"
                                                style={{
                                                    width: dotSize,
                                                    height: dotSize,
                                                    background: `rgba(${rgb}, ${(0.3 + rel * 0.5).toFixed(2)})`,
                                                    boxShadow: rel > 0.5 ? `0 0 ${dotSize * 2}px rgba(${rgb}, ${(rel * 0.2).toFixed(2)})` : "none",
                                                }}
                                            />
                                            <span
                                                className="text-[12px] sm:text-[13px] font-medium"
                                                style={{ color: `rgba(255,255,255, ${(0.25 + rel * 0.4).toFixed(2)})` }}
                                            >
                                                {WORDS[i]}
                                            </span>
                                            <span className="text-[10px] font-mono text-white/15 tabular-nums">
                                                {Math.round(w * 100)}%
                                            </span>
                                        </span>
                                    );
                                })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.p
                        key="idle-hint"
                        className="text-[13px] text-white/25 text-center italic"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        transition={{ duration: 0.4, delay: 1.5 }}
                    >
                        Every word is connected to every other. Hover any word to see its attention.
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
