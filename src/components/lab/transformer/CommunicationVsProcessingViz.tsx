"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  V38 — CommunicationVsProcessingViz (Redesign v4)
  Listening: SpotlightViz-style arcs connecting all words with glows.
  Thinking: Each word isolated in dashed box, processing alone.
  Uses the same arc style as §03 SpotlightViz.
*/

const WORDS = ["The", "cat", "sat", "on", "mat"];

/* Simplified attention weights — each word attends to others */
const ATTENTION: number[][] = [
    [0.05, 0.35, 0.25, 0.15, 0.20],
    [0.10, 0.05, 0.30, 0.15, 0.40],
    [0.15, 0.40, 0.05, 0.20, 0.20],
    [0.10, 0.15, 0.30, 0.05, 0.40],
    [0.10, 0.35, 0.20, 0.30, 0.05],
];

const ARC_THRESHOLD = 0.12;
const AMBER_THRESHOLD = 0.35;

type Phase = "listening" | "thinking";

/* Bezier arc — matches §03 SpotlightViz */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 70);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

export function CommunicationVsProcessingViz() {
    const [phase, setPhase] = useState<Phase>("listening");

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-6">
            {/* Toggle */}
            <div className="flex items-center justify-center gap-2 mb-4">
                {([
                    { k: "listening" as Phase, l: "Listening", c: "#22d3ee", r: "34,211,238" },
                    { k: "thinking" as Phase, l: "Thinking", c: "#fbbf24", r: "251,191,36" },
                ]).map(({ k, l, c, r }) => {
                    const on = phase === k;
                    return (
                        <motion.button key={k} onClick={() => setPhase(k)} whileTap={{ scale: 0.95 }}
                            className="px-5 py-2 rounded-xl text-[14px] font-semibold cursor-pointer"
                            style={{
                                background: on ? `linear-gradient(135deg, rgba(${r},0.15), rgba(${r},0.05))` : "rgba(255,255,255,0.04)",
                                color: on ? c : "rgba(255,255,255,0.3)",
                                border: on ? `1.5px solid rgba(${r},0.3)` : "1px solid rgba(255,255,255,0.08)",
                            }}>{l}</motion.button>
                    );
                })}
            </div>

            {/* Main viz */}
            <AnimatePresence mode="wait">
                {phase === "listening" ? (
                    <motion.div key="listening"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}>
                        <ListeningView />
                    </motion.div>
                ) : (
                    <motion.div key="thinking"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}>
                        <ThinkingView />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Caption */}
            <AnimatePresence mode="wait">
                <motion.p key={phase}
                    className="text-center text-[13px] mt-4 max-w-sm mx-auto leading-relaxed"
                    style={{ color: phase === "listening" ? "rgba(34,211,238,0.4)" : "rgba(251,191,36,0.4)" }}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    {phase === "listening"
                        ? "Each token gathers context from the others. The output? Still embeddings \u2014 same shape, enriched with context."
                        : "Each token sits alone and processes what it heard. Private, independent \u2014 no more communication."}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}

/* ── Listening: SpotlightViz-style with arcs, glows, hover ── */
function ListeningView() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

    const active = hovered;
    const weights = active !== null ? ATTENTION[active] : null;
    const isIdle = active === null;

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

    /* Idle: show ALL arcs as ghost web. Active: show only that word's arcs */
    const arcsToShow: { from: number; to: number; w: number }[] = [];
    if (isIdle) {
        for (let i = 0; i < WORDS.length; i++) {
            for (let j = i + 1; j < WORDS.length; j++) {
                const avg = (ATTENTION[i][j] + ATTENTION[j][i]) / 2;
                if (avg >= ARC_THRESHOLD) arcsToShow.push({ from: i, to: j, w: avg });
            }
        }
    } else if (active !== null && weights) {
        for (let j = 0; j < WORDS.length; j++) {
            if (j === active) continue;
            if (weights[j] >= ARC_THRESHOLD) arcsToShow.push({ from: active, to: j, w: weights[j] });
        }
    }

    return (
        <div ref={containerRef} className="relative" style={{ minHeight: 120 }}>
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: "visible", zIndex: 1 }}
            >
                <defs>
                    <filter id="cvp-glow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                <AnimatePresence>
                    {positions.length === WORDS.length && arcsToShow.map((arc, idx) => {
                        const from = positions[arc.from];
                        const to = positions[arc.to];
                        if (!from || !to) return null;
                        const opacity = isIdle ? Math.max(0.04, arc.w * 0.3) : Math.max(0.08, arc.w * 0.7);
                        const width = isIdle ? 0.3 + arc.w * 1 : 0.5 + arc.w * 2.5;
                        const isAmber = !isIdle && arc.w >= AMBER_THRESHOLD;
                        const arcRgb = isAmber ? "251, 191, 36" : "34, 211, 238";
                        return (
                            <motion.path
                                key={`${arc.from}-${arc.to}-${isIdle ? "idle" : "active"}`}
                                d={arcPath(from, to)}
                                fill="none"
                                stroke={`rgba(${arcRgb}, ${opacity})`}
                                strokeWidth={width}
                                strokeLinecap="round"
                                filter="url(#cvp-glow)"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                transition={{
                                    pathLength: { duration: 0.5, delay: idx * 0.03, ease: "easeOut" },
                                    opacity: { duration: 0.3, delay: idx * 0.03 },
                                }}
                            />
                        );
                    })}
                </AnimatePresence>
            </svg>

            {/* Words — SpotlightViz style */}
            <div
                className="flex items-baseline gap-x-[0.6em] sm:gap-x-[0.8em] flex-wrap justify-center relative z-10 py-10 sm:py-14 leading-[2.4]"
                style={{ fontSize: "clamp(1.15rem, 2.8vw, 1.5rem)" }}
                onMouseLeave={() => setHovered(null)}
            >
                {WORDS.map((word, i) => {
                    const isActive = active === i;
                    const isTarget = active !== null && weights !== null && i !== active;
                    const w = isTarget ? weights[i] : 0;
                    const isStrong = w > 0.15;
                    const isAmber = isStrong && w >= AMBER_THRESHOLD;
                    const accentRgb = isAmber ? "251, 191, 36" : "34, 211, 238";

                    const color = isActive
                        ? "#67e8f9"
                        : isAmber
                            ? `rgba(251, 191, 36, ${0.7 + w * 0.6})`
                            : isStrong
                                ? `rgba(165, 243, 252, ${0.5 + w * 0.8})`
                                : active !== null
                                    ? "rgba(255,255,255,0.25)"
                                    : "rgba(255,255,255,0.6)";

                    const textShadow = isActive
                        ? "0 0 20px rgba(34,211,238,0.4), 0 0 40px rgba(34,211,238,0.15)"
                        : isStrong
                            ? `0 0 ${8 + w * 30}px rgba(${accentRgb}, ${(w * 0.5).toFixed(2)})`
                            : "none";

                    return (
                        <motion.span
                            key={i}
                            ref={(el) => { wordRefs.current[i] = el; }}
                            className="relative cursor-pointer select-none font-medium tracking-[-0.01em]"
                            style={{ color, textShadow, transition: "color 0.35s ease, text-shadow 0.4s ease" }}
                            onMouseEnter={() => { setHovered(i); requestAnimationFrame(measure); }}
                            animate={{
                                scale: isActive ? 1.08 : 1,
                                y: isIdle ? [0, -1.5, 0] : 0,
                            }}
                            transition={
                                isIdle
                                    ? { y: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.3 } }
                                    : { duration: 0.3, ease: "easeOut" }
                            }
                        >
                            {isStrong && (
                                <motion.span
                                    className="absolute -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                    style={{
                                        background: `radial-gradient(ellipse, rgba(${accentRgb}, ${(w * 0.15).toFixed(3)}), transparent 70%)`,
                                        filter: "blur(6px)",
                                    }}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4 }}
                                />
                            )}
                            {isActive && (
                                <motion.span
                                    className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                    style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)" }}
                                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                            <span className="relative z-10">{word}</span>
                        </motion.span>
                    );
                })}
            </div>

            {/* Hover hint */}
            <AnimatePresence mode="wait">
                {isIdle ? (
                    <motion.p key="idle"
                        className="text-center text-[12px] text-white/20"
                        initial={{ opacity: 0 }} animate={{ opacity: [0.15, 0.3, 0.15] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                        Hover a word to see its attention
                    </motion.p>
                ) : (
                    <motion.p key="label"
                        className="text-center text-[12px] text-cyan-400/30 font-semibold"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                        Everyone hears everyone
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Thinking: tokens isolated ── */
function ThinkingView() {
    return (
        <div className="flex flex-col items-center py-6" style={{ minHeight: 120 }}>
            <div className="flex items-center justify-center gap-2.5 sm:gap-4">
                {WORDS.map((w, i) => (
                    <motion.div key={i}
                        className="flex flex-col items-center gap-1.5"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}>
                        <motion.div
                            className="px-3.5 py-3 rounded-xl flex flex-col items-center gap-1.5 relative"
                            style={{
                                background: "rgba(251,191,36,0.04)",
                                border: "1.5px dashed rgba(251,191,36,0.2)",
                                minWidth: 54,
                            }}>
                            <span
                                className="text-[14px] sm:text-[15px] font-semibold"
                                style={{ color: "rgba(251,191,36,0.7)" }}
                            >{w}</span>
                            <div className="flex gap-1">
                                {[0, 1, 2].map(d => (
                                    <motion.div key={d}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ background: "rgba(251,191,36,0.3)" }}
                                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                                        transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.3 + i * 0.15 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                ))}
            </div>

            <p className="text-[12px] text-amber-400/30 mt-4 font-semibold">
                Each token processes alone
            </p>
        </div>
    );
}
