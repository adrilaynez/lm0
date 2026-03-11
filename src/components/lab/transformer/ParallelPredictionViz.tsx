"use client";

import { useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  ParallelPredictionViz — §08 Beat 2

  Shows that one sequence creates N training examples simultaneously.
  Each position predicts the next character. Hover any position to see
  what it CAN SEE (chars to its left) and what it PREDICTS (next char).

  Teaches: Transformer training efficiency vs MLP.
  One concept: parallel next-token prediction.
*/

const SEQUENCE = "the cat sat";
const CHARS = SEQUENCE.split("");

/* ── Color constants ── */
const CYAN = "rgba(34,211,238,";
const EMERALD = "rgba(52,211,153,";
const AMBER = "rgba(251,191,36,";

export function ParallelPredictionViz() {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    const numExamples = CHARS.length - 1;

    const handleHover = useCallback((idx: number | null) => {
        setHoveredIdx(idx);
        if (idx !== null && !hasInteracted) setHasInteracted(true);
    }, [hasInteracted]);

    /* For a given hovered position, compute what it can see and what it predicts */
    const context = useMemo(() => {
        if (hoveredIdx === null) return null;
        const canSee = CHARS.slice(0, hoveredIdx + 1);
        const predicts = hoveredIdx < CHARS.length - 1 ? CHARS[hoveredIdx + 1] : null;
        return { canSee, predicts, predictIdx: hoveredIdx + 1 };
    }, [hoveredIdx]);

    /* Display char helper — make spaces visible */
    const displayChar = (ch: string) => (ch === " " ? "␣" : ch);

    return (
        <div className="flex flex-col items-center gap-8 w-full">
            {/* ── Character sequence ── */}
            <div className="w-full max-w-[620px] overflow-x-auto">
                <div className="flex items-start justify-center gap-0 min-w-fit mx-auto px-4">
                    {CHARS.map((ch, i) => {
                        const isHovered = hoveredIdx === i;
                        const isVisible = hoveredIdx !== null && i <= hoveredIdx;
                        const isPredicted = hoveredIdx !== null && i === hoveredIdx + 1;
                        const isDimmed = hoveredIdx !== null && !isVisible && !isPredicted;

                        return (
                            <div key={i} className="flex flex-col items-center" style={{ width: 44 }}>
                                {/* Character box */}
                                <motion.div
                                    onMouseEnter={() => handleHover(i < CHARS.length - 1 ? i : null)}
                                    onMouseLeave={() => handleHover(null)}
                                    className="relative flex items-center justify-center cursor-pointer select-none"
                                    style={{
                                        width: 36,
                                        height: 44,
                                        borderRadius: 8,
                                        fontSize: 16,
                                        fontFamily: "monospace",
                                        fontWeight: 600,
                                        background: isPredicted
                                            ? `${EMERALD}0.12)`
                                            : isHovered
                                                ? `${CYAN}0.15)`
                                                : isVisible
                                                    ? `${CYAN}0.06)`
                                                    : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${isPredicted
                                            ? `${EMERALD}0.35)`
                                            : isHovered
                                                ? `${CYAN}0.4)`
                                                : isVisible
                                                    ? `${CYAN}0.15)`
                                                    : "rgba(255,255,255,0.07)"
                                            }`,
                                        color: isPredicted
                                            ? `${EMERALD}0.9)`
                                            : isHovered
                                                ? `${CYAN}0.95)`
                                                : isDimmed
                                                    ? "rgba(255,255,255,0.15)"
                                                    : "rgba(255,255,255,0.6)",
                                        boxShadow: isHovered
                                            ? `0 0 16px ${CYAN}0.2)`
                                            : isPredicted
                                                ? `0 0 12px ${EMERALD}0.15)`
                                                : "none",
                                        transition: "all 0.2s ease",
                                    }}
                                    animate={{
                                        scale: isPredicted ? [1, 1.08, 1] : 1,
                                    }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {displayChar(ch)}

                                    {/* Position label */}
                                    <span
                                        className="absolute -top-5 text-[9px] font-mono"
                                        style={{
                                            color: isHovered
                                                ? `${CYAN}0.7)`
                                                : "rgba(255,255,255,0.15)",
                                        }}
                                    >
                                        {i + 1}
                                    </span>
                                </motion.div>

                                {/* Arrow to next — only if not last char */}
                                {i < CHARS.length - 1 && (
                                    <div className="flex flex-col items-center mt-1.5" style={{ height: 32 }}>
                                        <motion.svg
                                            width="12" height="28" viewBox="0 0 12 28"
                                            style={{
                                                opacity: isDimmed ? 0.08 : hoveredIdx === null ? 0.2 : isVisible && !isPredicted ? 0.5 : 0.08,
                                                transition: "opacity 0.2s",
                                            }}
                                        >
                                            <line x1="6" y1="0" x2="6" y2="22"
                                                stroke={isHovered ? `${CYAN}0.6)` : "rgba(255,255,255,0.3)"}
                                                strokeWidth="1.5"
                                            />
                                            <path d="M2 18 L6 24 L10 18"
                                                fill="none"
                                                stroke={isHovered ? `${CYAN}0.6)` : "rgba(255,255,255,0.3)"}
                                                strokeWidth="1.5"
                                                strokeLinejoin="round"
                                            />
                                        </motion.svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Hover detail ── */}
            <div className="w-full max-w-[500px] min-h-[56px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {context && context.predicts !== null ? (
                        <motion.div
                            key={`detail-${hoveredIdx}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="text-center"
                        >
                            <p className="text-[13px] font-mono leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                                <span style={{ color: `${CYAN}0.6)` }}>
                                    sees: &ldquo;{context.canSee.map(displayChar).join("")}&rdquo;
                                </span>
                                <span className="mx-3" style={{ color: "rgba(255,255,255,0.15)" }}>→</span>
                                <span style={{ color: `${EMERALD}0.8)` }}>
                                    predicts: &ldquo;{displayChar(context.predicts)}&rdquo;
                                </span>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[12px] italic"
                            style={{ color: "rgba(255,255,255,0.15)" }}
                        >
                            {hasInteracted ? "Hover a character to explore" : "Hover any character to see what it can see"}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Counter + comparison ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col items-center gap-3"
            >
                {/* Main counter */}
                <div className="flex items-center gap-2 text-[14px] font-medium">
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>1 sequence</span>
                    <span style={{ color: "rgba(255,255,255,0.15)" }}>→</span>
                    <span className="font-semibold" style={{ color: `${CYAN}0.85)` }}>
                        {numExamples} training examples
                    </span>
                </div>

                {/* Comparison */}
                <div className="flex items-center gap-6 text-[12px]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: `${AMBER}0.5)` }} />
                        <span style={{ color: `${AMBER}0.5)` }}>
                            MLP: 1 window → 1 example
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: `${CYAN}0.7)` }} />
                        <span className="font-medium" style={{ color: `${CYAN}0.7)` }}>
                            Transformer: 1 sequence → {numExamples} examples
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
