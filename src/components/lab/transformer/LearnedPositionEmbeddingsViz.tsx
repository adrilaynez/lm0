"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  V34b — LearnedPositionEmbeddingsViz
  Redesigned with comparison mode, visible data, larger fonts (min 13px).
  Click one position → see its embedding. Click another → side-by-side comparison with deltas.
*/

function seededRandom(seed: number) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const DIMS = 8;
const MAX_TRAINED = 10;
const TOTAL_POSITIONS = 15;

function getLearnedEmbedding(pos: number): number[] | null {
    if (pos >= MAX_TRAINED) return null;
    return Array.from({ length: DIMS }, (_, d) =>
        Math.round((seededRandom(pos * 73 + d * 17) * 2 - 1) * 100) / 100
    );
}

export function LearnedPositionEmbeddingsViz() {
    const [selectedPos, setSelectedPos] = useState(3);
    const [comparePos, setComparePos] = useState<number | null>(null);

    const embedding = useMemo(() => getLearnedEmbedding(selectedPos), [selectedPos]);
    const compareEmbedding = useMemo(
        () => (comparePos !== null ? getLearnedEmbedding(comparePos) : null),
        [comparePos]
    );
    const isOOB = embedding === null;
    const compareIsOOB = compareEmbedding === null;

    const maxVal = useMemo(() => {
        const vals: number[] = [];
        if (embedding) vals.push(...embedding.map(Math.abs));
        if (compareEmbedding) vals.push(...compareEmbedding.map(Math.abs));
        return Math.max(...vals, 0.01);
    }, [embedding, compareEmbedding]);

    const handlePosClick = (pos: number) => {
        if (pos === selectedPos) {
            // Clear comparison if clicking selected
            setComparePos(null);
        } else if (pos === comparePos) {
            // Clear comparison
            setComparePos(null);
        } else if (comparePos === null && pos !== selectedPos) {
            // First click sets selected, second sets compare
            setComparePos(pos);
        } else {
            // Move primary to this position, clear compare
            setSelectedPos(pos);
            setComparePos(null);
        }
    };

    const isComparing = comparePos !== null;

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-4" style={{ minHeight: 340 }}>
            {/* Position selector */}
            <div className="flex items-center justify-center gap-1.5 mb-5 flex-wrap">
                {Array.from({ length: TOTAL_POSITIONS }, (_, i) => {
                    const isSelected = i === selectedPos;
                    const isCompare = i === comparePos;
                    const active = isSelected || isCompare;
                    const outOfRange = i >= MAX_TRAINED;
                    return (
                        <motion.button
                            key={i}
                            onClick={() => handlePosClick(i)}
                            whileTap={{ scale: 0.93 }}
                            className="w-9 h-9 rounded-lg text-[13px] font-mono font-bold transition-all"
                            style={{
                                background: active
                                    ? (isCompare
                                        ? "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,191,36,0.06))"
                                        : outOfRange
                                            ? "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))"
                                            : "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(34,211,238,0.06))")
                                    : "rgba(255,255,255,0.04)",
                                border: active
                                    ? (isCompare
                                        ? "1.5px solid rgba(251,191,36,0.4)"
                                        : outOfRange
                                            ? "1.5px solid rgba(251,191,36,0.35)"
                                            : "1.5px solid rgba(34,211,238,0.35)")
                                    : "1px solid rgba(255,255,255,0.06)",
                                color: active
                                    ? (isCompare ? "#fbbf24" : outOfRange ? "#fbbf24" : "#22d3ee")
                                    : outOfRange
                                        ? "rgba(251,191,36,0.35)"
                                        : "rgba(255,255,255,0.35)",
                            }}
                        >
                            {i + 1}
                        </motion.button>
                    );
                })}
            </div>

            {/* Boundary label */}
            <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-white/08" />
                <span className="text-[13px] uppercase tracking-[0.12em] text-white/30 font-semibold">
                    Trained on positions 1–{MAX_TRAINED}
                </span>
                <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-white/08" />
            </div>

            {/* Comparison legend */}
            {isComparing && (
                <div className="flex items-center justify-center gap-5 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(34,211,238,0.5)" }} />
                        <span className="text-[13px] text-cyan-400/70 font-medium">Position {selectedPos + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(251,191,36,0.5)" }} />
                        <span className="text-[13px] text-amber-400/70 font-medium">Position {comparePos + 1}</span>
                    </div>
                </div>
            )}

            {/* Embedding display */}
            <AnimatePresence mode="wait">
                {isOOB && !isComparing ? (
                    <motion.div
                        key="oob"
                        className="max-w-md mx-auto text-center py-6"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                    >
                        <div
                            className="rounded-xl px-6 py-5 mx-auto max-w-sm"
                            style={{
                                background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.03))",
                                border: "1px solid rgba(251,191,36,0.2)",
                            }}
                        >
                            <p className="text-[15px] font-semibold text-amber-400 mb-1.5">
                                No embedding exists
                            </p>
                            <p className="text-[14px] text-white/45 leading-relaxed">
                                Position {selectedPos + 1} was never seen during training.
                                The model has no learned representation for it.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={`embed-${selectedPos}-${comparePos}`}
                        className="max-w-xl mx-auto"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                    >
                        {!isComparing && (
                            <p className="text-center text-[13px] uppercase tracking-[0.12em] text-white/35 font-semibold mb-3">
                                Position {selectedPos + 1} embedding
                            </p>
                        )}

                        <div className="space-y-2">
                            {Array.from({ length: DIMS }, (_, d) => {
                                const val = embedding ? embedding[d] : 0;
                                const cmpVal = compareEmbedding ? compareEmbedding[d] : null;
                                const absVal = Math.abs(val);
                                const barWidth = (absVal / maxVal) * 100;
                                const isPositive = val >= 0;

                                /* Comparison bar */
                                const cmpAbsVal = cmpVal !== null ? Math.abs(cmpVal) : 0;
                                const cmpBarWidth = cmpVal !== null ? (cmpAbsVal / maxVal) * 100 : 0;
                                const cmpIsPositive = cmpVal !== null ? cmpVal >= 0 : true;
                                const delta = cmpVal !== null ? Math.abs(val - cmpVal) : 0;

                                return (
                                    <div key={d} className="flex items-center gap-2.5">
                                        <span className="w-8 text-right text-[13px] font-mono text-white/40 shrink-0 font-medium">
                                            d{d + 1}
                                        </span>

                                        <div className="flex-1 flex flex-col gap-0.5">
                                            {/* Primary bar */}
                                            <div
                                                className="h-6 rounded-md overflow-hidden relative"
                                                style={{ background: "rgba(255,255,255,0.03)" }}
                                            >
                                                <div
                                                    className="absolute top-0 bottom-0 w-px"
                                                    style={{ left: "50%", background: "rgba(255,255,255,0.08)" }}
                                                />
                                                <motion.div
                                                    className="absolute top-0.5 bottom-0.5 rounded-sm"
                                                    style={{
                                                        background: embedding
                                                            ? `rgba(34,211,238,${0.25 + (absVal / maxVal) * 0.45})`
                                                            : "rgba(251,191,36,0.15)",
                                                        ...(isPositive ? { left: "50%" } : { right: "50%" }),
                                                    }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${barWidth / 2}%` }}
                                                    transition={{
                                                        type: "spring", stiffness: 180, damping: 20,
                                                        delay: d * 0.04,
                                                    }}
                                                />
                                            </div>

                                            {/* Comparison bar */}
                                            {isComparing && (
                                                <div
                                                    className="h-6 rounded-md overflow-hidden relative"
                                                    style={{ background: "rgba(255,255,255,0.03)" }}
                                                >
                                                    <div
                                                        className="absolute top-0 bottom-0 w-px"
                                                        style={{ left: "50%", background: "rgba(255,255,255,0.08)" }}
                                                    />
                                                    {compareIsOOB ? (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="text-[13px] text-amber-400/50 font-mono">—</span>
                                                        </div>
                                                    ) : (
                                                        <motion.div
                                                            className="absolute top-0.5 bottom-0.5 rounded-sm"
                                                            style={{
                                                                background: `rgba(251,191,36,${0.25 + (cmpAbsVal / maxVal) * 0.45})`,
                                                                ...(cmpIsPositive ? { left: "50%" } : { right: "50%" }),
                                                            }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${cmpBarWidth / 2}%` }}
                                                            transition={{
                                                                type: "spring", stiffness: 180, damping: 20,
                                                                delay: d * 0.04,
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Values column */}
                                        <div className="w-20 text-right shrink-0 flex flex-col gap-0.5">
                                            <span
                                                className="text-[13px] font-mono font-bold"
                                                style={{ color: `rgba(34,211,238,${0.4 + absVal * 0.55})` }}
                                            >
                                                {val > 0 ? "+" : ""}{val.toFixed(2)}
                                            </span>
                                            {isComparing && (
                                                <span
                                                    className="text-[13px] font-mono font-bold"
                                                    style={{ color: cmpVal !== null ? `rgba(251,191,36,${0.4 + cmpAbsVal * 0.55})` : "rgba(251,191,36,0.3)" }}
                                                >
                                                    {cmpVal !== null ? `${cmpVal > 0 ? "+" : ""}${cmpVal.toFixed(2)}` : "—"}
                                                </span>
                                            )}
                                        </div>

                                        {/* Delta */}
                                        {isComparing && cmpVal !== null && (
                                            <span className="w-12 text-right text-[13px] font-mono text-white/30 shrink-0">
                                                Δ{delta.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Instructions / caption */}
            <p className="max-w-sm mx-auto mt-5 text-center text-[13px] text-white/35 leading-relaxed">
                {isOOB && !isComparing
                    ? "Learned embeddings only work for positions seen in training."
                    : isComparing
                        ? compareIsOOB
                            ? `Position ${comparePos! + 1} has no learned embedding — it's beyond the training range.`
                            : `Comparing positions ${selectedPos + 1} and ${comparePos! + 1}. Each position has a unique learned pattern.`
                        : "Click another position to compare embeddings side by side."
                }
            </p>

            {/* Clear comparison */}
            {isComparing && (
                <div className="flex justify-center mt-3">
                    <button
                        onClick={() => setComparePos(null)}
                        className="px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all"
                        style={{
                            background: "rgba(251,191,36,0.08)",
                            border: "1px solid rgba(251,191,36,0.2)",
                            color: "#fbbf24",
                        }}
                    >
                        Clear comparison
                    </button>
                </div>
            )}
        </div>
    );
}
