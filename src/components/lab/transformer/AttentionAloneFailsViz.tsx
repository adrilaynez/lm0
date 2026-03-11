"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  V38b — AttentionAloneFailsViz (Redesign v4)
  Uses "Michael Jordan plays ???" to show:
  Attention gathers context perfectly (Michael + Jordan → plays)
  but can't REASON from it to produce "basketball".
  The FFN is what makes that leap.
*/

const WORDS = [
    { text: "Michael", id: "michael" },
    { text: "Jordan", id: "jordan" },
    { text: "plays", id: "plays" },
    { text: "???", id: "target" },
];

const SOURCES = ["jordan", "michael"];
const TARGET = "plays";

const THOUGHTS = [
    "\u201Cplays\u201D = some action\u2026",
    "\u201Cplays\u201D = Jordan does something\u2026",
    "\u201Cplays\u201D = blended with Michael Jordan",
];

/* Bezier arc — matches §03 SpotlightViz curvature */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 70);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

export function AttentionAloneFailsViz() {
    const [started, setStarted] = useState(false);
    const [step, setStep] = useState(0); // 0=idle, 1=plush arc, 2=blue arc, 3=limitation
    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<Record<string, HTMLSpanElement | null>>({});
    const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

    const measure = useCallback(() => {
        if (!containerRef.current) return;
        const cRect = containerRef.current.getBoundingClientRect();
        const pos: Record<string, { x: number; y: number }> = {};
        for (const w of WORDS) {
            const el = wordRefs.current[w.id];
            if (el) {
                const r = el.getBoundingClientRect();
                pos[w.id] = { x: r.left + r.width / 2 - cRect.left, y: r.top + r.height / 2 - cRect.top };
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

    /* Play enrichment sequence — only when user clicks Start */
    const runSequence = useCallback(() => {
        timerRefs.current.forEach(clearTimeout);
        timerRefs.current = [];
        setStarted(true);
        setStep(0);
        timerRefs.current.push(setTimeout(() => setStep(1), 1000));
        timerRefs.current.push(setTimeout(() => setStep(2), 2800));
        timerRefs.current.push(setTimeout(() => setStep(3), 5000));
    }, []);

    useEffect(() => {
        return () => timerRefs.current.forEach(clearTimeout);
    }, []);

    const visibleSources = SOURCES.slice(0, Math.max(0, step));
    const thoughtIdx = Math.min(step, THOUGHTS.length - 1);
    const isEnriched = step >= 2;
    const showLimit = step >= 3;

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4">
            {/* ── Start button overlay ── */}
            {!started && (
                <div className="flex flex-col items-center gap-4 mb-4">
                    <motion.button
                        onClick={runSequence}
                        className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer"
                        style={{
                            background: "rgba(34,211,238,0.08)",
                            border: "1.5px solid rgba(34,211,238,0.25)",
                            color: "rgba(34,211,238,0.7)",
                        }}
                        whileHover={{ scale: 1.03, borderColor: "rgba(34,211,238,0.4)" }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M3 1.5v11l9.5-5.5z" />
                        </svg>
                        Start
                    </motion.button>
                </div>
            )}

            {/* ── Sentence with arcs ── */}
            <div ref={containerRef} className="relative">
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 2 }}
                >
                    <defs>
                        <filter id="af-glow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <AnimatePresence>
                        {visibleSources.map((srcId, i) => {
                            const from = positions[srcId];
                            const to = positions[TARGET];
                            if (!from || !to) return null;
                            const w = i === 0 ? 0.55 : 0.35;
                            const opacity = Math.max(0.08, w * 0.75);
                            const width = 0.5 + w * 2.5;
                            const arcRgb = w >= 0.45 ? "251, 191, 36" : "34, 211, 238";
                            return (
                                <motion.path
                                    key={srcId}
                                    d={arcPath(from, to)}
                                    fill="none"
                                    stroke={`rgba(${arcRgb}, ${opacity})`}
                                    strokeWidth={width}
                                    strokeLinecap="round"
                                    filter="url(#af-glow)"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                    transition={{
                                        pathLength: { duration: 0.6, ease: "easeOut" },
                                        opacity: { duration: 0.4 },
                                    }}
                                />
                            );
                        })}
                    </AnimatePresence>
                </svg>

                {/* Words — elegant inline text like SpotlightViz */}
                <div
                    className="flex items-baseline gap-x-[0.35em] sm:gap-x-[0.5em] flex-wrap justify-center relative z-10 py-10 sm:py-14 leading-[2.4]"
                    style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.45rem)" }}
                >
                    {WORDS.map((w) => {
                        const isTarget = w.id === TARGET;
                        const isSource = visibleSources.includes(w.id);

                        let color = "rgba(255,255,255,0.4)";
                        if (isTarget && isEnriched) color = "rgba(34,211,238,0.85)";
                        else if (isTarget) color = "rgba(251,191,36,0.8)";
                        else if (isSource) color = "rgba(34,211,238,0.65)";

                        const glowBg = isTarget
                            ? isEnriched
                                ? "radial-gradient(ellipse, rgba(34,211,238,0.12), transparent 70%)"
                                : "radial-gradient(ellipse, rgba(251,191,36,0.1), transparent 70%)"
                            : "radial-gradient(ellipse, rgba(34,211,238,0.08), transparent 70%)";

                        return (
                            <motion.span
                                key={w.id}
                                ref={(el) => { wordRefs.current[w.id] = el; }}
                                className="relative font-medium tracking-[-0.01em] select-none"
                                style={{ color, fontWeight: isTarget || isSource ? 600 : 400, transition: "color 0.4s ease" }}
                            >
                                {(isTarget || isSource) && (
                                    <motion.span
                                        className="absolute -inset-x-2 -inset-y-1 rounded-full pointer-events-none -z-10"
                                        style={{ background: glowBg, filter: "blur(4px)" }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                )}
                                {isTarget && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{
                                            background: isEnriched
                                                ? "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)"
                                                : "linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent)",
                                        }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.3 }}
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
                    {step >= 1 && (
                        <motion.div
                            key={`thought-${thoughtIdx}`}
                            className="px-5 py-2.5 rounded-2xl text-center"
                            style={{
                                background: "rgba(0,0,0,0.4)",
                                border: `1px solid ${isEnriched ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.08)"}`,
                                maxWidth: 380,
                            }}
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.4 }}
                        >
                            <p
                                className="text-[13px] sm:text-sm italic leading-relaxed"
                                style={{ color: isEnriched ? "rgba(34,211,238,0.7)" : "rgba(255,255,255,0.4)" }}
                            >
                                {THOUGHTS[thoughtIdx]}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── THE LIMITATION REVEAL ── */}
            <AnimatePresence>
                {showLimit && (
                    <motion.div
                        className="mt-3 space-y-3 text-center"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <p className="text-[13px] font-semibold" style={{ color: "rgba(34,211,238,0.5)" }}>
                            {"\u2713"} Attention gathered the context perfectly
                        </p>

                        <div
                            className="max-w-sm mx-auto rounded-xl px-4 py-3"
                            style={{
                                background: "rgba(251,191,36,0.04)",
                                border: "1px solid rgba(251,191,36,0.12)",
                            }}
                        >
                            <p className="text-[13px] leading-relaxed" style={{ color: "rgba(251,191,36,0.5)" }}>
                                The embedding for {"\u201C"}plays{"\u201D"} now points toward{" "}
                                <strong style={{ color: "rgba(251,191,36,0.7)" }}>Michael Jordan</strong> in
                                vector space. But it hasn{"\u2019"}t made the leap to{" "}
                                <strong style={{ color: "rgba(251,191,36,0.7)" }}>basketball</strong>.
                                Attention can only blend {"\u2014"} it can{"\u2019"}t{" "}
                                <em>reason</em>.
                            </p>
                        </div>

                        <motion.button
                            onClick={runSequence}
                            className="text-[12px] font-semibold text-white/20 hover:text-white/35 cursor-pointer transition-colors"
                            whileTap={{ scale: 0.95 }}
                        >
                            {"\u21BB"} Replay
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
