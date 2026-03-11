"use client";

import { useRef, useCallback, useEffect, useState } from "react";

import { motion } from "framer-motion";

/*
  ContextChangesViz — V09 (v2 — text-first, premium)
  Same word "bank" in two contexts with completely different attention patterns.
  Text-first layout (no pill boxes), "bank" pre-selected, ghost arcs, glow on targets.
  Side-by-side (stacked on mobile).
*/

interface SentenceData {
    words: string[];
    bankIdx: number;
    weights: number[];
    label: string;
    accentRgb: string;
}

const LEFT: SentenceData = {
    words: ["I", "deposited", "money", "at", "the", "bank", "last", "Tuesday"],
    bankIdx: 5,
    weights: [0.02, 0.12, 0.35, 0.04, 0.03, 0.06, 0.08, 0.04],
    label: "Financial context",
    accentRgb: "251,191,36",
};

const RIGHT: SentenceData = {
    words: ["I", "sat", "on", "the", "river", "bank", "at", "sunset"],
    bankIdx: 5,
    weights: [0.02, 0.10, 0.04, 0.03, 0.40, 0.05, 0.04, 0.32],
    label: "Nature context",
    accentRgb: "34,211,238",
};

/* ─── Arc path ─── */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 55);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

/* ─── Single sentence panel ─── */
function SentencePanel({ data, side }: { data: SentenceData; side: "left" | "right" }) {
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

    const bankPos = positions[data.bankIdx];
    const rgb = data.accentRgb;
    const baseDelay = side === "left" ? 0.2 : 0.5;

    /* Top-3 targets for inline caption */
    const top3 = data.weights
        .map((w, i) => ({ w, i }))
        .filter((d) => d.i !== data.bankIdx)
        .sort((a, b) => b.w - a.w)
        .slice(0, 3);
    const maxW = top3.length > 0 ? top3[0].w : 1;

    return (
        <div className="flex-1 space-y-2">
            {/* Context label */}
            <motion.p
                className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-center"
                style={{ color: `rgba(${rgb}, 0.45)` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: baseDelay }}
            >
                {data.label}
            </motion.p>

            {/* Sentence + arcs */}
            <div ref={containerRef} className="relative">
                {/* Ghost arcs */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id={`ctx-glow-${side}`}>
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>
                    {bankPos && positions.length === data.words.length &&
                        data.words.map((_, i) => {
                            if (i === data.bankIdx) return null;
                            const w = data.weights[i];
                            if (w < 0.04) return null;
                            const to = positions[i];
                            if (!to) return null;
                            const path = arcPath(bankPos, to);
                            const opacity = Math.max(0.06, w * 0.65);
                            const width = 0.5 + w * 2.2;
                            const arcColor = w >= 0.30 ? "251,191,36" : rgb;

                            return (
                                <motion.path
                                    key={i}
                                    d={path}
                                    fill="none"
                                    stroke={`rgba(${arcColor}, ${opacity})`}
                                    strokeWidth={width}
                                    strokeLinecap="round"
                                    filter={`url(#ctx-glow-${side})`}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{
                                        pathLength: { duration: 0.6, delay: baseDelay + i * 0.04, ease: "easeOut" },
                                        opacity: { duration: 0.4, delay: baseDelay + i * 0.04 },
                                    }}
                                />
                            );
                        })
                    }
                </svg>

                {/* Words as inline text */}
                <div className="flex items-baseline gap-x-[0.3em] sm:gap-x-[0.4em] flex-wrap justify-center relative z-10 py-7 sm:py-10 leading-[2.2] sm:leading-[2.4]">
                    {data.words.map((word, i) => {
                        const isBank = i === data.bankIdx;
                        const w = data.weights[i];
                        const isStrong = !isBank && w > 0.1;
                        const glowR = isStrong ? Math.round(6 + w * 35) : 0;
                        const isAmber = isStrong && w >= 0.30;
                        const wordRgb = isAmber ? "251,191,36" : rgb;

                        const color = isBank
                            ? `rgb(${rgb})`
                            : isAmber
                                ? `rgba(251,191,36, ${0.7 + w * 0.6})`
                                : isStrong
                                    ? `rgba(${rgb}, ${0.6 + w * 0.8})`
                                    : "rgba(255, 255, 255, 0.22)";

                        const textShadow = isBank
                            ? `0 0 18px rgba(${rgb}, 0.4), 0 0 36px rgba(${rgb}, 0.15)`
                            : isStrong
                                ? `0 0 ${glowR}px rgba(${wordRgb}, ${(w * 0.55).toFixed(2)})`
                                : "none";

                        return (
                            <motion.span
                                key={i}
                                ref={(el) => { wordRefs.current[i] = el; }}
                                className="relative font-medium tracking-[-0.01em]"
                                style={{
                                    fontSize: "clamp(0.85rem, 1.8vw, 1.1rem)",
                                    color,
                                    textShadow,
                                    transition: "color 0.3s ease, text-shadow 0.3s ease",
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: baseDelay + i * 0.03, duration: 0.3 }}
                            >
                                {/* Glow halo behind strong targets */}
                                {isStrong && (
                                    <span
                                        className="absolute inset-0 -inset-x-1.5 -inset-y-0.5 rounded-full pointer-events-none"
                                        style={{
                                            background: `radial-gradient(ellipse at center, rgba(${wordRgb}, ${(w * 0.15).toFixed(3)}) 0%, transparent 70%)`,
                                            filter: "blur(5px)",
                                        }}
                                    />
                                )}

                                {/* Underline for bank */}
                                {isBank && (
                                    <motion.span
                                        className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb}, 0.5), transparent)` }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.4, delay: baseDelay + 0.1 }}
                                    />
                                )}

                                <span className="relative z-10">{word}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* Inline dot-strength caption */}
            <motion.div
                className="flex items-center justify-center gap-x-3 gap-y-1 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: baseDelay + 0.6 }}
            >
                {top3.map(({ w, i }) => {
                    const rel = w / maxW;
                    const dotSize = Math.round(3 + rel * 4);
                    const dotAmber = w >= 0.30;
                    const dotRgb = dotAmber ? "251,191,36" : rgb;
                    return (
                        <span key={i} className="inline-flex items-center gap-1">
                            <span
                                className="rounded-full shrink-0"
                                style={{
                                    width: dotSize,
                                    height: dotSize,
                                    background: `rgba(${dotRgb}, ${(0.3 + rel * 0.55).toFixed(2)})`,
                                    boxShadow: rel > 0.5 ? `0 0 ${dotSize * 2}px rgba(${dotRgb}, ${(rel * 0.25).toFixed(2)})` : "none",
                                }}
                            />
                            <span className="text-[12px] sm:text-[13px] font-medium" style={{ color: `rgba(255,255,255, ${(0.25 + rel * 0.35).toFixed(2)})` }}>
                                {data.words[i]}
                            </span>
                            <span className="text-[10px] font-mono text-white/15 tabular-nums">
                                {Math.round(w * 100)}%
                            </span>
                        </span>
                    );
                })}
            </motion.div>

            {/* Result badge */}
            <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: baseDelay + 1.0, duration: 0.4 }}
            >
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
                    style={{
                        background: `rgba(${rgb}, 0.07)`,
                        border: `1px solid rgba(${rgb}, 0.2)`,
                    }}
                >
                    <span className="font-mono text-[10px]" style={{ color: `rgba(${rgb}, 0.5)` }}>bank</span>
                    <span style={{ color: `rgba(${rgb}, 0.3)` }}>→</span>
                    <span style={{ color: `rgba(${rgb}, 0.7)` }}>
                        {data.label === "Financial context" ? "financial meaning" : "nature meaning"}
                    </span>
                    <span className="text-white/20">·</span>
                    <span className="italic" style={{ color: `rgba(${rgb}, 0.4)` }}>embedding shifted</span>
                </div>
            </motion.div>
        </div>
    );
}

export function ContextChangesViz() {
    return (
        <div className="py-6 sm:py-10 px-2 sm:px-4 space-y-4" style={{ minHeight: 300 }}>
            {/* Two sentence panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <SentencePanel data={LEFT} side="left" />
                <SentencePanel data={RIGHT} side="right" />
            </div>

            {/* Tagline */}
            <motion.div
                className="text-center max-w-sm mx-auto space-y-1 pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
            >
                <p className="text-sm sm:text-base italic text-white/40">
                    Same word. Different context.
                </p>
                <p className="text-sm sm:text-base font-bold bg-gradient-to-r from-amber-300/60 via-white/50 to-cyan-300/60 bg-clip-text text-transparent">
                    Completely different attention.
                </p>
            </motion.div>
        </div>
    );
}
