"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  SpotlightViz — V08 ⭐⭐⭐ (v2 — FLAGSHIP)
  THE first time the learner sees attention weights.
  Text-first, hover-driven, premium feel.
  Hover a word → target words bloom with soft cyan glow.
  Ghost-like arcs connect source to targets.
  Premium focus card replaces utilitarian bar chart.
*/

const WORDS = ["The", "king", "who", "wore", "the", "golden", "crown", "ruled", "the", "vast", "kingdom", "wisely"];

/* Pre-computed 12×12 attention matrix (linguistically plausible, rows sum ≈ 1) */
export const ATTENTION: number[][] = [
    /*  The    king   who    wore   the    golden crown  ruled  the    vast   kingdom wisely */
    [0.04, 0.35, 0.05, 0.04, 0.04, 0.05, 0.10, 0.08, 0.04, 0.05, 0.12, 0.04], // The
    [0.03, 0.08, 0.12, 0.06, 0.02, 0.04, 0.18, 0.22, 0.02, 0.03, 0.15, 0.05], // king → crown, ruled, kingdom
    [0.02, 0.38, 0.04, 0.18, 0.02, 0.03, 0.08, 0.12, 0.02, 0.02, 0.05, 0.04], // who → king, wore
    [0.02, 0.15, 0.10, 0.05, 0.03, 0.25, 0.28, 0.03, 0.02, 0.02, 0.03, 0.02], // wore → crown, golden
    [0.05, 0.04, 0.03, 0.03, 0.04, 0.32, 0.35, 0.03, 0.03, 0.02, 0.04, 0.02], // the → golden, crown
    [0.02, 0.05, 0.02, 0.08, 0.05, 0.05, 0.52, 0.04, 0.02, 0.03, 0.08, 0.04], // golden → crown
    [0.03, 0.22, 0.03, 0.12, 0.04, 0.28, 0.06, 0.08, 0.02, 0.02, 0.07, 0.03], // crown → golden, king, wore
    [0.02, 0.30, 0.05, 0.03, 0.02, 0.03, 0.08, 0.05, 0.03, 0.06, 0.22, 0.11], // ruled → king, kingdom, wisely
    [0.04, 0.03, 0.02, 0.02, 0.05, 0.03, 0.04, 0.05, 0.04, 0.28, 0.32, 0.08], // the → kingdom, vast
    [0.02, 0.04, 0.02, 0.02, 0.03, 0.03, 0.03, 0.05, 0.05, 0.05, 0.58, 0.08], // vast → kingdom
    [0.03, 0.18, 0.03, 0.03, 0.03, 0.04, 0.10, 0.20, 0.04, 0.12, 0.08, 0.12], // kingdom → king, ruled, vast
    [0.02, 0.12, 0.03, 0.03, 0.02, 0.03, 0.05, 0.42, 0.02, 0.04, 0.15, 0.07], // wisely → ruled, kingdom
];

/* Short interpretive captions per word (shown in focus card) */
const INTERPRETATIONS: Record<number, string> = {
    0: "\u201CThe\u201D is a function word \u2014 it barely focuses on anything meaningful.",
    1: "\u201Cking\u201D reaches for \u201Ccrown\u201D and \u201Cruled\u201D \u2014 the symbols that define royalty.",
    2: "\u201Cwho\u201D looks back at \u201Cking\u201D \u2014 connecting the clause to its subject.",
    3: "\u201Cwore\u201D attends to \u201Ccrown\u201D and \u201Cgolden\u201D \u2014 the object and its quality.",
    4: "\u201Cthe\u201D points toward \u201Ccrown\u201D and \u201Cgolden\u201D \u2014 anchoring to its noun.",
    5: "\u201Cgolden\u201D focuses almost entirely on \u201Ccrown\u201D \u2014 the thing it describes.",
    6: "\u201Ccrown\u201D connects to \u201Cgolden\u201D, \u201Cking\u201D, and \u201Cwore\u201D \u2014 its quality, owner, and action.",
    7: "\u201Cruled\u201D reaches for \u201Cking\u201D and \u201Ckingdom\u201D \u2014 the ruler and the domain.",
    8: "\u201Cthe\u201D attends to \u201Ckingdom\u201D and \u201Cvast\u201D \u2014 its noun phrase.",
    9: "\u201Cvast\u201D focuses almost entirely on \u201Ckingdom\u201D \u2014 the noun it modifies.",
    10: "\u201Ckingdom\u201D connects to \u201Cking\u201D, \u201Cruled\u201D, and \u201Cvast\u201D \u2014 ruler, governance, scale.",
    11: "\u201Cwisely\u201D attends strongly to \u201Cruled\u201D \u2014 the action it modifies.",
};

/* ─── Arc path between two word positions ─── */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 70);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

export function SpotlightViz() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [locked, setLocked] = useState<number | null>(null);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

    /* Active word = locked takes priority, then hovered */
    const active = locked ?? hovered;
    const weights = active !== null ? ATTENTION[active] : null;
    const isIdle = active === null;

    /* Measure word center positions for SVG arcs */
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
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    /* Sorted targets for focus card */
    const topTargets = weights
        ? weights
            .map((w, i) => ({ w, i }))
            .filter((d) => d.i !== active)
            .sort((a, b) => b.w - a.w)
            .slice(0, 4)
        : [];

    /* Max weight for normalization in focus card */
    const maxWeight = topTargets.length > 0 ? topTargets[0].w : 1;

    return (
        <div className="py-8 sm:py-12 px-2 sm:px-4" style={{ minHeight: 320 }}>
            {/* ═══ Sentence + Arcs container ═══ */}
            <div ref={containerRef} className="relative">
                {/* SVG ghost arcs layer */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id="arc-glow-v2">
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
                                const opacity = Math.max(0.06, w * 0.7);
                                const width = 0.5 + w * 2.5;
                                const arcRgb = w >= 0.30 ? "251, 191, 36" : "34, 211, 238";

                                return (
                                    <motion.path
                                        key={`arc-${active}-${toIdx}`}
                                        d={path}
                                        fill="none"
                                        stroke={`rgba(${arcRgb}, ${opacity})`}
                                        strokeWidth={width}
                                        strokeLinecap="round"
                                        filter="url(#arc-glow-v2)"
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

                {/* ═══ Sentence as elegant inline text ═══ */}
                <div
                    className="flex items-baseline gap-x-[0.35em] sm:gap-x-[0.45em] flex-wrap justify-center relative z-10 py-10 sm:py-14 leading-[2.4] sm:leading-[2.6]"
                    onMouseLeave={() => setHovered(null)}
                >
                    {WORDS.map((word, i) => {
                        const isActive = active === i;
                        const isTarget = active !== null && weights !== null && i !== active;
                        const w = isTarget ? weights[i] : 0;
                        const isStrong = w > 0.1;
                        const isMedium = w > 0.05 && w <= 0.1;

                        /* Compute glow intensity for targets */
                        const glowRadius = isStrong ? Math.round(8 + w * 40) : 0;
                        const glowOpacity = isStrong ? (w * 0.6).toFixed(2) : "0";
                        const isAmber = isStrong && w >= 0.30;
                        const accentRgb = isAmber ? "251, 191, 36" : "34, 211, 238";

                        /* Text color states */
                        const color = isActive
                            ? "#67e8f9"                                                    // cyan-300
                            : isAmber
                                ? `rgba(251, 191, 36, ${0.7 + w * 0.6})`                  // amber scaled
                                : isStrong
                                    ? `rgba(165, 243, 252, ${0.6 + w * 0.8})`             // cyan-200 scaled
                                    : isMedium
                                        ? "rgba(255, 255, 255, 0.45)"                      // dim
                                        : active !== null && !isActive
                                            ? "rgba(255, 255, 255, 0.22)"                  // receded
                                            : "rgba(255, 255, 255, 0.65)";                 // idle

                        /* Text shadow for glow effect */
                        const textShadow = isActive
                            ? "0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.15)"
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
                                    setHovered(i);
                                    requestAnimationFrame(measure);
                                }}
                                onClick={() => {
                                    setLocked(locked === i ? null : i);
                                    requestAnimationFrame(measure);
                                }}
                                animate={{
                                    scale: isActive ? 1.08 : 1,
                                    y: isIdle ? [0, -1.5, 0] : 0,
                                }}
                                transition={
                                    isIdle
                                        ? {
                                            y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" },
                                            scale: { duration: 0.3 },
                                        }
                                        : { duration: 0.3, ease: "easeOut" }
                                }
                            >
                                {/* Diffused background glow behind strongly-attended words */}
                                {isStrong && (
                                    <motion.span
                                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                        style={{
                                            background: `radial-gradient(ellipse at center, rgba(${accentRgb}, ${(w * 0.18).toFixed(3)}) 0%, transparent 70%)`,
                                            filter: "blur(6px)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}

                                {/* Active word underline accent */}
                                {isActive && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{
                                            background: "linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent)",
                                        }}
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        animate={{ scaleX: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                <span className="relative z-10">{word}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* ═══ Focus caption / Idle hint ═══ */}
            <AnimatePresence mode="wait">
                {active !== null && topTargets.length > 0 ? (
                    <motion.div
                        key={`focus-${active}`}
                        className="max-w-md mx-auto mt-1 sm:mt-3 text-center"
                        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.15 } }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {/* Inline word strengths — editorial, not tabular */}
                        <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap mb-3">
                            {topTargets.map(({ w, i }, rank) => {
                                const relativeStrength = w / maxWeight;
                                const dotOpacity = (0.25 + relativeStrength * 0.65).toFixed(2);
                                const dotSize = Math.round(4 + relativeStrength * 4);
                                const textOpacity = (0.3 + relativeStrength * 0.4).toFixed(2);
                                const dotAmber = w >= 0.30;
                                const dotRgb = dotAmber ? "251, 191, 36" : "34, 211, 238";
                                return (
                                    <motion.span
                                        key={i}
                                        className="inline-flex items-center gap-1.5"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: rank * 0.06, duration: 0.3 }}
                                    >
                                        {/* Glowing strength dot */}
                                        <span
                                            className="rounded-full shrink-0"
                                            style={{
                                                width: dotSize,
                                                height: dotSize,
                                                background: `rgba(${dotRgb}, ${dotOpacity})`,
                                                boxShadow: relativeStrength > 0.5
                                                    ? `0 0 ${dotSize * 2}px rgba(${dotRgb}, ${(relativeStrength * 0.3).toFixed(2)})`
                                                    : "none",
                                            }}
                                        />
                                        <span
                                            className="text-[13px] sm:text-sm font-medium"
                                            style={{ color: `rgba(255, 255, 255, ${textOpacity})` }}
                                        >
                                            {WORDS[i]}
                                        </span>
                                        <span className="text-[11px] font-mono text-white/15 tabular-nums">
                                            {Math.round(w * 100)}%
                                        </span>
                                    </motion.span>
                                );
                            })}
                        </div>

                        {/* Interpretive caption — the primary content */}
                        {INTERPRETATIONS[active] && (
                            <motion.p
                                className="text-[13px] sm:text-sm leading-relaxed text-white/30 italic max-w-xs mx-auto"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 }}
                            >
                                {INTERPRETATIONS[active]}
                            </motion.p>
                        )}
                    </motion.div>
                ) : (
                    <motion.p
                        key="idle-hint"
                        className="text-center text-[13px] sm:text-sm text-white/30 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    >
                        Hover over any word to see what it pays attention to
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Subtle secondary hint */}
            <AnimatePresence>
                {active !== null && (
                    <motion.p
                        className="text-center text-[13px] text-white/15 mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                    >
                        Try other words — every pattern is different
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
