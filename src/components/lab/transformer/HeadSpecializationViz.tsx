"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V29 — HeadSpecializationViz (merged with MultiLensView concept)
  Shows 3 different sentences. For each, displays a compact attention web
  per head. The learner sees that EACH head consistently captures the
  SAME TYPE of relationship across different sentences.
  Colors: cyan + amber + white only.
*/

const SENTENCES: {
    text: string;
    words: string[];
    query: string;
    queryIdx: number;
    heads: { focus: string; weights: number[] }[];
}[] = [
        {
            text: "The professor published the paper",
            words: ["The", "professor", "published", "the", "paper"],
            query: "professor",
            queryIdx: 1,
            heads: [
                { focus: "Syntax", weights: [0.05, 0.08, 0.48, 0.04, 0.35] },
                { focus: "Meaning", weights: [0.03, 0.06, 0.12, 0.05, 0.74] },
                { focus: "Position", weights: [0.35, 0.10, 0.38, 0.12, 0.05] },
                { focus: "Self", weights: [0.08, 0.55, 0.15, 0.10, 0.12] },
            ],
        },
        {
            text: "The king wore the golden crown",
            words: ["The", "king", "wore", "the", "golden", "crown"],
            query: "king",
            queryIdx: 1,
            heads: [
                { focus: "Syntax", weights: [0.04, 0.06, 0.50, 0.03, 0.05, 0.32] },
                { focus: "Meaning", weights: [0.02, 0.05, 0.08, 0.02, 0.15, 0.68] },
                { focus: "Position", weights: [0.40, 0.08, 0.35, 0.10, 0.04, 0.03] },
                { focus: "Self", weights: [0.06, 0.52, 0.18, 0.08, 0.08, 0.08] },
            ],
        },
        {
            text: "The dog chased the ball quickly",
            words: ["The", "dog", "chased", "the", "ball", "quickly"],
            query: "dog",
            queryIdx: 1,
            heads: [
                { focus: "Syntax", weights: [0.04, 0.07, 0.52, 0.03, 0.28, 0.06] },
                { focus: "Meaning", weights: [0.03, 0.05, 0.10, 0.03, 0.72, 0.07] },
                { focus: "Position", weights: [0.38, 0.10, 0.35, 0.12, 0.03, 0.02] },
                { focus: "Self", weights: [0.07, 0.50, 0.18, 0.10, 0.08, 0.07] },
            ],
        },
    ];

/* Arc path */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 45);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

/* Mini attention web for one head + one sentence */
function MiniWeb({
    words,
    queryIdx,
    weights,
    headFocus,
    headIdx,
}: {
    words: string[];
    queryIdx: number;
    weights: number[];
    headFocus: string;
    headIdx: number;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);

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

    return (
        <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-semibold mb-1">
                {headFocus}
            </p>
            <div ref={containerRef} className="relative">
                {/* Arcs */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id={`spec-glow-${headIdx}`}>
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {positions.length === words.length &&
                        words.map((_, toIdx) => {
                            if (toIdx === queryIdx) return null;
                            const w = weights[toIdx];
                            if (w < 0.06) return null;
                            const from = positions[queryIdx];
                            const to = positions[toIdx];
                            if (!from || !to) return null;
                            const path = arcPath(from, to);
                            const opacity = Math.max(0.04, w * 0.55);
                            const width = 0.3 + w * 2;
                            const isAmber = w >= 0.30;
                            const rgb = isAmber ? "251, 191, 36" : "34, 211, 238";
                            return (
                                <motion.path
                                    key={`${headIdx}-${toIdx}`}
                                    d={path}
                                    fill="none"
                                    stroke={`rgba(${rgb}, ${opacity})`}
                                    strokeWidth={width}
                                    strokeLinecap="round"
                                    filter={`url(#spec-glow-${headIdx})`}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{
                                        pathLength: { duration: 0.5, delay: toIdx * 0.04, ease: "easeOut" },
                                        opacity: { duration: 0.3, delay: toIdx * 0.04 },
                                    }}
                                />
                            );
                        })}
                </svg>

                {/* Words */}
                <div className="flex items-baseline gap-x-[0.25em] flex-wrap justify-center relative z-10 py-4 leading-[2]">
                    {words.map((word, i) => {
                        const isQuery = i === queryIdx;
                        const w = weights[i];
                        const isStrong = i !== queryIdx && w > 0.2;
                        const isAmber = i !== queryIdx && w >= 0.30;
                        const accentRgb = isAmber ? "251, 191, 36" : "34, 211, 238";

                        const color = isQuery
                            ? "#67e8f9"
                            : isAmber
                                ? `rgba(251, 191, 36, ${0.6 + w * 0.5})`
                                : isStrong
                                    ? `rgba(34, 211, 238, ${0.5 + w * 0.7})`
                                    : `rgba(255, 255, 255, ${0.25 + w * 1.2})`;

                        return (
                            <span
                                key={i}
                                ref={(el) => { wordRefs.current[i] = el; }}
                                className="relative select-none font-medium"
                                style={{
                                    fontSize: "clamp(0.65rem, 1.2vw, 0.85rem)",
                                    color,
                                    textShadow: isStrong
                                        ? `0 0 ${5 + w * 20}px rgba(${accentRgb}, ${(w * 0.3).toFixed(2)})`
                                        : isQuery
                                            ? "0 0 10px rgba(34,211,238,0.2)"
                                            : "none",
                                }}
                            >
                                <span className="relative z-10">{word}</span>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ═══ Main Component ═══ */
export function HeadSpecializationViz() {
    const [sentIdx, setSentIdx] = useState(0);
    const sent = SENTENCES[sentIdx];

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4" style={{ minHeight: 320 }}>
            {/* Sentence selector */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
                {SENTENCES.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setSentIdx(i)}
                        className="px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold transition-all"
                        style={{
                            background: i === sentIdx ? "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.04))" : "rgba(255,255,255,0.04)",
                            border: i === sentIdx
                                ? "1.5px solid rgba(34,211,238,0.25)"
                                : "1px solid rgba(255,255,255,0.06)",
                            color: i === sentIdx ? "#22d3ee" : "rgba(255,255,255,0.35)",
                        }}
                    >
                        &quot;{s.query}&quot;
                    </button>
                ))}
            </div>

            {/* Full sentence display */}
            <div className="text-center mb-4">
                <p className="text-[13px] text-white/35 italic">{sent.text}</p>
            </div>

            {/* 4 mini attention webs — 2×2 grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={sentIdx}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                >
                    {sent.heads.map((head, hi) => (
                        <MiniWeb
                            key={`${sentIdx}-${hi}`}
                            words={sent.words}
                            queryIdx={sent.queryIdx}
                            weights={head.weights}
                            headFocus={head.focus}
                            headIdx={hi}
                        />
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Insight */}
            <motion.div
                className="max-w-md mx-auto mt-5 text-center"
                key={sentIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <p className="text-[12px] sm:text-[13px] text-white/35 leading-relaxed">
                    Switch between sentences — notice how{" "}
                    <strong className="text-cyan-400/80">Syntax</strong> always finds the verb,{" "}
                    <strong className="text-cyan-400/80">Meaning</strong> always finds the object.
                    Each head <em>consistently</em> specializes.
                </p>
            </motion.div>
        </div>
    );
}
