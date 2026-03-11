"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════
   PronounResolutionViz — v3 (complete rewrite)
   Premium floating style. SVG arc "it"→"trophy"
   on correct answer. Model-view text. Subtle retry.
   ═══════════════════════════════════════════════ */

const SENTENCE_PARTS = [
    { text: "The", plain: true, id: "the1" },
    { text: "trophy", plain: false, id: "trophy" },
    { text: "doesn\u2019t fit in the", plain: true, id: "mid" },
    { text: "suitcase", plain: false, id: "suitcase" },
    { text: "because", plain: true, id: "because" },
    { text: "it", plain: false, id: "it" },
    { text: "is too big.", plain: true, id: "end" },
];

/* Bezier arc above the sentence */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dist = Math.abs(dx);
    const curvature = Math.min(dist * 0.45, 90);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

export function PronounResolutionViz() {
    const [choice, setChoice] = useState<"trophy" | "suitcase" | null>(null);
    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<Record<string, HTMLSpanElement | null>>({});
    const correct = choice === "trophy";

    /* Measure word positions for SVG arc */
    const measure = useCallback(() => {
        if (!containerRef.current) return;
        const cRect = containerRef.current.getBoundingClientRect();
        const pos: Record<string, { x: number; y: number }> = {};
        for (const part of SENTENCE_PARTS) {
            const el = wordRefs.current[part.id];
            if (el) {
                const r = el.getBoundingClientRect();
                pos[part.id] = {
                    x: r.left + r.width / 2 - cRect.left,
                    y: r.top + r.height * 0.3 - cRect.top,
                };
            }
        }
        setPositions(pos);
    }, []);

    useEffect(() => {
        measure();
        const t = setTimeout(measure, 400);
        window.addEventListener("resize", measure);
        return () => { window.removeEventListener("resize", measure); clearTimeout(t); };
    }, [measure, choice]);

    const reset = () => setChoice(null);

    return (
        <div className="py-10 sm:py-14 px-3 sm:px-6 space-y-7">
            {/* ── Sentence with optional arc ── */}
            <div ref={containerRef} className="relative">
                {/* SVG arc layer */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 2 }}
                >
                    <defs>
                        <filter id="pronoun-arc-glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Arc from "it" → "trophy" on correct answer */}
                    {correct && positions.it && positions.trophy && (
                        <motion.path
                            d={arcPath(positions.it, positions.trophy)}
                            fill="none"
                            stroke="rgba(34,211,238,0.45)"
                            strokeWidth={2}
                            strokeLinecap="round"
                            filter="url(#pronoun-arc-glow)"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{
                                pathLength: { duration: 0.7, ease: "easeOut", delay: 0.3 },
                                opacity: { duration: 0.3, delay: 0.3 },
                            }}
                        />
                    )}
                </svg>

                {/* Words */}
                <div
                    className="flex items-baseline gap-x-[0.3em] gap-y-2 flex-wrap justify-center relative z-10 leading-[2]"
                    style={{ fontSize: "clamp(1.2rem, 2.8vw, 1.6rem)" }}
                >
                    {SENTENCE_PARTS.map((part, i) => {
                        const isTrophy = part.id === "trophy";
                        const isSuitcase = part.id === "suitcase";
                        const isIt = part.id === "it";

                        /* Color logic */
                        let color = "rgba(255,255,255,0.45)";
                        let weight = 400;

                        if (part.plain) {
                            color = "rgba(255,255,255,0.4)";
                        } else if (isIt) {
                            color = choice
                                ? (correct ? "rgba(34,211,238,0.9)" : "rgba(251,191,36,0.7)")
                                : "rgba(251,191,36,0.85)";
                            weight = 600;
                        } else if (isTrophy) {
                            color = choice
                                ? (correct ? "rgba(34,211,238,0.9)" : "rgba(255,255,255,0.3)")
                                : "rgba(34,211,238,0.7)";
                            weight = choice ? (correct ? 700 : 400) : 600;
                        } else if (isSuitcase) {
                            color = choice
                                ? (choice === "suitcase" ? "rgba(251,191,36,0.8)" : "rgba(255,255,255,0.3)")
                                : "rgba(251,191,36,0.5)";
                            weight = choice === "suitcase" ? 600 : 400;
                        }

                        return (
                            <motion.span
                                key={part.id}
                                ref={(el) => { wordRefs.current[part.id] = el; }}
                                className="relative tracking-[-0.01em] select-none"
                                style={{
                                    color,
                                    fontWeight: weight,
                                    transition: "color 0.4s ease",
                                }}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                            >
                                {/* Pulse glow under "it" before choice */}
                                {isIt && !choice && (
                                    <motion.span
                                        className="absolute -inset-x-3 -inset-y-1.5 rounded-full -z-10"
                                        style={{
                                            background: "radial-gradient(ellipse, rgba(251,191,36,0.1), transparent 70%)",
                                            filter: "blur(5px)",
                                        }}
                                        animate={{ opacity: [0.4, 0.9, 0.4] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                )}

                                {/* Subtle underline on key words before choice */}
                                {(isTrophy || isSuitcase) && !choice && (
                                    <span
                                        className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] rounded-full"
                                        style={{
                                            background: isTrophy
                                                ? "linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent)"
                                                : "linear-gradient(90deg, transparent, rgba(251,191,36,0.15), transparent)",
                                        }}
                                    />
                                )}

                                {/* Connection glow on correct answer */}
                                {correct && (isTrophy || isIt) && (
                                    <motion.span
                                        className="absolute -inset-x-2 -inset-y-1 rounded-full -z-10"
                                        style={{
                                            background: "radial-gradient(ellipse, rgba(34,211,238,0.1), transparent 70%)",
                                            filter: "blur(4px)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                    />
                                )}

                                <span className="relative z-10">{part.text}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* ── Question / Answer ── */}
            <AnimatePresence mode="wait">
                {!choice ? (
                    <motion.div
                        key="question"
                        className="flex flex-col items-center gap-5"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                    >
                        <p className="text-[13px] sm:text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                            What does <span className="font-medium" style={{ color: "rgba(251,191,36,0.7)" }}>&ldquo;it&rdquo;</span> refer to?
                        </p>
                        <div className="flex items-center gap-4">
                            <motion.button
                                onClick={() => setChoice("trophy")}
                                className="px-5 py-2.5 rounded-xl text-[13px] sm:text-sm font-medium cursor-pointer transition-all duration-200"
                                style={{
                                    border: "1px solid rgba(34,211,238,0.15)",
                                    background: "rgba(34,211,238,0.04)",
                                    color: "rgba(34,211,238,0.65)",
                                }}
                                whileHover={{ scale: 1.03, boxShadow: "0 0 20px -4px rgba(34,211,238,0.15)" }}
                                whileTap={{ scale: 0.97 }}
                            >
                                The trophy
                            </motion.button>
                            <motion.button
                                onClick={() => setChoice("suitcase")}
                                className="px-5 py-2.5 rounded-xl text-[13px] sm:text-sm font-medium cursor-pointer transition-all duration-200"
                                style={{
                                    border: "1px solid rgba(251,191,36,0.15)",
                                    background: "rgba(251,191,36,0.04)",
                                    color: "rgba(251,191,36,0.65)",
                                }}
                                whileHover={{ scale: 1.03, boxShadow: "0 0 20px -4px rgba(251,191,36,0.15)" }}
                                whileTap={{ scale: 0.97 }}
                            >
                                The suitcase
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="answer"
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                    >
                        {/* Result */}
                        {correct ? (
                            <motion.p
                                className="text-sm font-medium"
                                style={{ color: "rgba(34,211,238,0.8)" }}
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                            >
                                ✓ Exactly — the trophy.
                            </motion.p>
                        ) : (
                            <motion.p
                                className="text-sm font-medium"
                                style={{ color: "rgba(251,191,36,0.8)" }}
                                animate={{ x: [0, -3, 3, -3, 0] }}
                                transition={{ duration: 0.3 }}
                            >
                                ✗ Not quite — it&apos;s the trophy that&apos;s too big.
                            </motion.p>
                        )}

                        {/* Human explanation */}
                        <motion.p
                            className="text-[13px] text-center max-w-md mx-auto leading-relaxed"
                            style={{ color: "rgba(255,255,255,0.3)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            You resolved that <span className="font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>instantly</span> — connecting
                            &ldquo;it&rdquo; back to &ldquo;trophy&rdquo; across six words using meaning, grammar,
                            and common sense.
                        </motion.p>

                        {/* Model-view text */}
                        <motion.p
                            className="text-[13px] text-center max-w-md mx-auto leading-relaxed mt-1"
                            style={{ color: "rgba(251,191,36,0.35)" }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                        >
                            The model sees &ldquo;it&rdquo; and always produces the same embedding — it has no mechanism
                            to look back at &ldquo;trophy&rdquo; and figure out the reference.
                        </motion.p>

                        {/* Try again */}
                        <motion.button
                            onClick={reset}
                            className="text-[11px] cursor-pointer transition-colors mt-1"
                            style={{ color: "rgba(255,255,255,0.15)" }}
                            whileHover={{ color: "rgba(255,255,255,0.35)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                        >
                            Try again
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
