"use client";

import { motion } from "framer-motion";

/*
  SelfSimilarityViz v2 — The Trap

  Same 5×5 dot-product matrix, but the diagonal is dramatically highlighted
  in pulsing amber. An animated bar chart compares self-score vs best non-self
  score with gap percentages, and a verdict panel builds the emotional "aha."

  THE TRAP: learner discovers the dot product always ranks each word as
  most similar to itself. "That's useless!" — motivates Q/K in §04b.
*/

/* ─── Data ─── */
const WORDS = ["king", "wore", "golden", "crown", "wisely"];

const EMBEDDINGS: [number, number][] = [
    [0.9, 0.4],
    [0.1, 0.8],
    [-0.2, 0.7],
    [0.8, 0.5],
    [-0.5, 0.6],
];

const DOT_MATRIX = EMBEDDINGS.map((a) =>
    EMBEDDINGS.map((b) => a[0] * b[0] + a[1] * b[1]),
);

const MAX_VAL = Math.max(...DOT_MATRIX.flat().map(Math.abs));

const ROW_DATA = WORDS.map((word, r) => {
    const selfScore = DOT_MATRIX[r][r];
    const others = DOT_MATRIX[r].filter((_, c) => c !== r);
    const bestOther = Math.max(...others);
    const bestOtherIdx = DOT_MATRIX[r].findIndex((v, c) => c !== r && v === bestOther);
    const gap = selfScore > 0 ? Math.round(((selfScore - bestOther) / selfScore) * 100) : 0;
    return { word, selfScore, bestOther, bestOtherWord: WORDS[bestOtherIdx], gap };
});

/* ─── Cell styling ─── */
function cellBg(v: number, isDiag: boolean): string {
    if (isDiag) return "rgba(251,191,36,0.2)";
    const n = v / MAX_VAL;
    if (n > 0.5) return "rgba(255,255,255,0.06)";
    if (n > 0.1) return "rgba(255,255,255,0.03)";
    return "rgba(255,255,255,0.015)";
}

function cellTextColor(v: number, isDiag: boolean): string {
    if (isDiag) return "rgba(251,191,36,0.85)";
    if (v > 0.5) return "rgba(255,255,255,0.35)";
    return "rgba(255,255,255,0.18)";
}

/* ─── Component ─── */
export function SelfSimilarityViz() {
    return (
        <div className="py-6 sm:py-10 px-2 sm:px-4 space-y-6" style={{ minHeight: 370 }}>
            {/* ── 5×5 Table with pulsing diagonal ── */}
            <div className="flex justify-center">
                <div className="inline-block">
                    {/* Column headers */}
                    <div className="flex ml-16 sm:ml-20 mb-1">
                        {WORDS.map((word, c) => (
                            <div key={c} className="text-center" style={{ width: 54, minWidth: 54 }}>
                                <span className="text-[9px] sm:text-[10px] font-semibold text-white/25">
                                    {word}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {WORDS.map((rowWord, r) => (
                        <div key={r} className="flex items-center">
                            <span className="text-[10px] sm:text-[11px] font-semibold w-16 sm:w-20 text-right pr-2 shrink-0 text-white/25">
                                {rowWord}
                            </span>

                            {WORDS.map((_, c) => {
                                const val = DOT_MATRIX[r][c];
                                const isDiag = r === c;

                                return (
                                    <motion.div
                                        key={c}
                                        className="flex items-center justify-center"
                                        style={{
                                            width: 52,
                                            height: 46,
                                            minWidth: 52,
                                            margin: 1,
                                            borderRadius: 8,
                                            background: cellBg(val, isDiag),
                                            border: isDiag
                                                ? "1px solid rgba(251,191,36,0.4)"
                                                : "1px solid rgba(255,255,255,0.03)",
                                        }}
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            boxShadow: isDiag
                                                ? [
                                                    "0 0 14px -4px rgba(251,191,36,0.12)",
                                                    "0 0 22px -4px rgba(251,191,36,0.3)",
                                                    "0 0 14px -4px rgba(251,191,36,0.12)",
                                                ]
                                                : "0 0 0px 0px transparent",
                                        }}
                                        transition={{
                                            delay: (r + c) * 0.045,
                                            duration: 0.3,
                                            boxShadow: isDiag
                                                ? { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 + r * 0.15 }
                                                : undefined,
                                        }}
                                    >
                                        <span
                                            className="text-xs sm:text-sm font-mono font-bold"
                                            style={{ color: cellTextColor(val, isDiag) }}
                                        >
                                            {val.toFixed(2)}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Bar chart with gap stats ── */}
            <div className="space-y-3 max-w-md mx-auto pt-2">
                <p className="text-[10px] sm:text-[11px] text-white/25 text-center font-semibold uppercase tracking-wider">
                    Who does each word listen to most?
                </p>

                {/* Legend */}
                <div className="flex items-center justify-center gap-5 text-[10px]">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-sm" style={{ background: "rgba(251,191,36,0.5)" }} />
                        <span className="text-amber-300/50">itself</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-sm" style={{ background: "rgba(34,211,238,0.4)" }} />
                        <span className="text-cyan-300/40">best other word</span>
                    </span>
                </div>

                {ROW_DATA.map(({ word, selfScore, bestOther, bestOtherWord, gap }, i) => {
                    const maxBar = selfScore * 1.08;
                    return (
                        <motion.div
                            key={i}
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.08 }}
                        >
                            <span className="text-[11px] sm:text-xs text-white/40 w-14 text-right truncate font-semibold">
                                {word}
                            </span>
                            <div className="flex-1 space-y-1">
                                {/* Self score bar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-3 rounded-full bg-white/[0.03] overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                background: "linear-gradient(90deg, rgba(251,191,36,0.55), rgba(251,191,36,0.3))",
                                                boxShadow: "0 0 6px -1px rgba(251,191,36,0.25)",
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(selfScore / maxBar) * 100}%` }}
                                            transition={{ duration: 0.5, delay: 0.7 + i * 0.08 }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono text-amber-300/50 w-8 text-right">
                                        {selfScore.toFixed(2)}
                                    </span>
                                </div>
                                {/* Best other bar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-3 rounded-full bg-white/[0.03] overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                background: "linear-gradient(90deg, rgba(34,211,238,0.4), rgba(34,211,238,0.18))",
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(bestOther / maxBar) * 100}%` }}
                                            transition={{ duration: 0.5, delay: 0.8 + i * 0.08 }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono text-cyan-300/30 w-8 text-right">
                                        {bestOther.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            {/* Gap indicator */}
                            <motion.span
                                className="text-[9px] font-mono font-bold w-10 text-right"
                                style={{ color: "rgba(251,191,36,0.4)" }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.0 + i * 0.08 }}
                            >
                                +{gap}%
                            </motion.span>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Verdict panel ── */}
            <motion.div
                className="max-w-sm mx-auto text-center space-y-2 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
            >
                {/* Scoreboard */}
                <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{
                        background: "rgba(251,191,36,0.06)",
                        border: "1px solid rgba(251,191,36,0.15)",
                    }}
                >
                    <span className="text-amber-300/60 text-sm font-black font-mono">5 / 5</span>
                    <span className="text-[11px] text-white/30">words listen to themselves most</span>
                </div>

                {/* Punchline */}
                <motion.p
                    className="text-[12px] sm:text-[13px] leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.0 }}
                >
                    Every word pays the most attention to <strong className="text-amber-300/60">itself</strong>.
                    That&apos;s not useful &mdash; we need words to attend to <span className="text-cyan-300/50">other</span> words.
                </motion.p>
            </motion.div>
        </div>
    );
}
