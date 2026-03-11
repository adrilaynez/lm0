"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════
   ContextEnrichmentViz — v1
   Shows HOW attention enriches meaning.
   Arrows flow from context words into a target,
   progressively rewriting the thought bubble.
   ═══════════════════════════════════════════════ */

interface WordDef {
    text: string;
    id: string;
    enrichable?: boolean;
}

const WORDS: WordDef[] = [
    { text: "The", id: "the" },
    { text: "blue", id: "blue" },
    { text: "plush", id: "plush" },
    { text: "creature", id: "creature", enrichable: true },
    { text: "sat", id: "sat" },
    { text: "on", id: "on" },
    { text: "the", id: "the2" },
    { text: "shelf.", id: "shelf" },
];

/* Each clickable word and the enrichment it provides to other words */
interface EnrichmentEntry {
    target: string;
    sources: string[];
    thoughts: string[];
    finalThought: string;
}

const ENRICHMENTS: Record<string, EnrichmentEntry> = {
    creature: {
        target: "creature",
        sources: ["plush", "blue"],
        thoughts: [
            '"creature" = ???',
            '"creature" = something plush...',
            '"creature" = a soft blue thing...',
        ],
        finalThought: '"creature" = a soft blue stuffed toy',
    },
    shelf: {
        target: "shelf",
        sources: ["on", "sat"],
        thoughts: [
            '"shelf" = ???',
            '"shelf" = something you go on...',
            '"shelf" = a surface where something sits',
        ],
        finalThought: '"shelf" = a surface where something sits',
    },
    sat: {
        target: "sat",
        sources: ["creature"],
        thoughts: [
            '"sat" = ???',
            '"sat" = what the creature is doing',
        ],
        finalThought: '"sat" = what the creature is doing',
    },
    blue: {
        target: "blue",
        sources: [],
        thoughts: [
            '"blue" = the color blue',
        ],
        finalThought: '"blue" = the color blue (stays generic)',
    },
    plush: {
        target: "plush",
        sources: [],
        thoughts: [
            '"plush" = soft, stuffed',
        ],
        finalThought: '"plush" = soft, stuffed (stays generic)',
    },
};

/* Arc weights by importance (first source = strongest) */
const ARC_WEIGHTS = [0.55, 0.35];

/* Bezier arc above the sentence — matches §03 SpotlightViz curvature */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 70);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

export function ContextEnrichmentViz() {
    const [activeTarget, setActiveTarget] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [autoPlayed, setAutoPlayed] = useState(false);
    const [interactive, setInteractive] = useState(false);
    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<Record<string, HTMLSpanElement | null>>({});

    /* Measure word positions */
    const measure = useCallback(() => {
        if (!containerRef.current) return;
        const cRect = containerRef.current.getBoundingClientRect();
        const pos: Record<string, { x: number; y: number }> = {};
        for (const w of WORDS) {
            const el = wordRefs.current[w.id];
            if (el) {
                const r = el.getBoundingClientRect();
                pos[w.id] = {
                    x: r.left + r.width / 2 - cRect.left,
                    y: r.top + r.height / 2 - cRect.top,
                };
            }
        }
        setPositions(pos);
    }, []);

    useEffect(() => {
        measure();
        const t = setTimeout(measure, 500);
        window.addEventListener("resize", measure);
        return () => { window.removeEventListener("resize", measure); clearTimeout(t); };
    }, [measure]);

    /* Auto-play: creature enrichment sequence */
    useEffect(() => {
        if (autoPlayed || interactive) return;
        const timers: ReturnType<typeof setTimeout>[] = [];

        // Step 0: highlight creature
        timers.push(setTimeout(() => {
            setActiveTarget("creature");
            setStep(0);
        }, 800));

        // Step 1: arrow from plush
        timers.push(setTimeout(() => setStep(1), 2200));

        // Step 2: arrow from blue
        timers.push(setTimeout(() => setStep(2), 4000));

        // Step 3: final resolved
        timers.push(setTimeout(() => {
            setStep(3);
        }, 5800));

        // Step 4: show interactive prompt
        timers.push(setTimeout(() => {
            setAutoPlayed(true);
            setInteractive(true);
        }, 8000));

        return () => timers.forEach(clearTimeout);
    }, [autoPlayed, interactive]);

    const enrichment = activeTarget ? ENRICHMENTS[activeTarget] : null;
    const visibleSources = enrichment
        ? enrichment.sources.slice(0, Math.max(0, step))
        : [];
    const thoughtIdx = enrichment
        ? Math.min(step, enrichment.thoughts.length - 1)
        : 0;
    const currentThought = enrichment?.thoughts[thoughtIdx] ?? "";
    const isResolved = enrichment ? step >= enrichment.sources.length + 1 : false;

    /* Interactive mode: click a word */
    const handleWordClick = (id: string) => {
        if (!interactive) return;
        if (ENRICHMENTS[id]) {
            setActiveTarget(id);
            // Auto-advance through the steps
            setStep(0);
            const e = ENRICHMENTS[id];
            const timers: ReturnType<typeof setTimeout>[] = [];
            e.sources.forEach((_, i) => {
                timers.push(setTimeout(() => setStep(i + 1), (i + 1) * 1400));
            });
            timers.push(setTimeout(() => setStep(e.sources.length + 1), (e.sources.length + 1) * 1400));
            // cleanup is handled by component unmount
        }
    };

    return (
        <div className="py-8 sm:py-10 px-2 sm:px-4 space-y-5">
            {/* ── Sentence with arcs ── */}
            <div ref={containerRef} className="relative">
                {/* SVG arc layer */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 2 }}
                >
                    <defs>
                        <filter id="enrich-glow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Drawn arcs — §03 style: no arrowheads, weight-based opacity/width */}
                    <AnimatePresence>
                        {enrichment && visibleSources.map((srcId, i) => {
                            const from = positions[srcId];
                            const to = positions[enrichment.target];
                            if (!from || !to) return null;
                            const w = ARC_WEIGHTS[i] ?? 0.25;
                            const opacity = Math.max(0.08, w * 0.75);
                            const width = 0.5 + w * 2.5;
                            const arcRgb = w >= 0.45 ? "251, 191, 36" : "34, 211, 238";
                            return (
                                <motion.path
                                    key={`${srcId}-${enrichment.target}`}
                                    d={arcPath(from, to)}
                                    fill="none"
                                    stroke={`rgba(${arcRgb}, ${opacity})`}
                                    strokeWidth={width}
                                    strokeLinecap="round"
                                    filter="url(#enrich-glow)"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                    transition={{
                                        pathLength: { duration: 0.6, delay: i * 0.04, ease: "easeOut" },
                                        opacity: { duration: 0.4, delay: i * 0.04 },
                                    }}
                                />
                            );
                        })}
                    </AnimatePresence>
                </svg>

                {/* Words */}
                <div
                    className="flex items-baseline gap-x-[0.35em] sm:gap-x-[0.5em] flex-wrap justify-center relative z-10 py-10 sm:py-14 leading-[2.4]"
                    style={{ fontSize: "clamp(1.2rem, 2.8vw, 1.6rem)" }}
                >
                    {WORDS.map((w) => {
                        const isTarget = activeTarget === w.id;
                        const isSource = visibleSources.includes(w.id);
                        const isClickable = interactive && ENRICHMENTS[w.id];

                        let color = "rgba(255,255,255,0.45)";
                        if (isTarget && isResolved) color = "rgba(34,211,238,0.9)";
                        else if (isTarget) color = "rgba(251,191,36,0.85)";
                        else if (isSource) color = "rgba(34,211,238,0.7)";

                        return (
                            <motion.span
                                key={w.id}
                                ref={(el) => { wordRefs.current[w.id] = el; }}
                                className={`relative font-medium tracking-[-0.01em] select-none ${isClickable ? "cursor-pointer" : ""}`}
                                style={{
                                    color,
                                    fontWeight: isTarget || isSource ? 600 : 400,
                                    transition: "color 0.4s ease",
                                }}
                                onClick={() => handleWordClick(w.id)}
                                whileHover={isClickable ? { scale: 1.06 } : undefined}
                            >
                                {/* Glow */}
                                {(isTarget || isSource) && (
                                    <motion.span
                                        className="absolute -inset-x-2 -inset-y-1 rounded-full pointer-events-none -z-10"
                                        style={{
                                            background: isTarget
                                                ? (isResolved
                                                    ? "radial-gradient(ellipse, rgba(34,211,238,0.12), transparent 70%)"
                                                    : "radial-gradient(ellipse, rgba(251,191,36,0.1), transparent 70%)")
                                                : "radial-gradient(ellipse, rgba(34,211,238,0.08), transparent 70%)",
                                            filter: "blur(4px)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}
                                <span className="relative z-10">{w.text}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* ── Thought bubble ── */}
            <div className="flex justify-center" style={{ minHeight: 48 }}>
                <AnimatePresence mode="wait">
                    {enrichment && (
                        <motion.div
                            key={`thought-${activeTarget}-${thoughtIdx}`}
                            className="px-5 py-2.5 rounded-2xl text-center"
                            style={{
                                background: "rgba(0,0,0,0.4)",
                                border: `1px solid ${isResolved ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.08)"}`,
                                maxWidth: 380,
                            }}
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.4 }}
                        >
                            <p
                                className="text-[13px] sm:text-sm italic leading-relaxed"
                                style={{
                                    color: isResolved ? "rgba(34,211,238,0.7)" : "rgba(255,255,255,0.4)",
                                }}
                            >
                                {isResolved ? enrichment.finalThought : currentThought}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Pedagogical caption ── */}
            <AnimatePresence mode="wait">
                {!interactive ? (
                    <motion.p
                        key="auto-caption"
                        className="text-[12px] text-center italic"
                        style={{ color: "rgba(255,255,255,0.18)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Watch how nearby words rewrite the meaning of &ldquo;creature&rdquo;...
                    </motion.p>
                ) : (
                    <motion.div
                        key="interactive"
                        className="space-y-2"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p
                            className="text-[13px] text-center leading-relaxed max-w-md mx-auto"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                        >
                            Click any word to see what enriches it.
                        </p>
                        <p
                            className="text-[11px] text-center italic max-w-sm mx-auto"
                            style={{ color: "rgba(255,255,255,0.15)" }}
                        >
                            Every word gets enriched — but some more than others.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
