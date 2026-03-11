"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V17 — QueryMeetsKeyViz
  One token's Query compared to ALL tokens' Keys.
  Select query token → see Q arrow sweep → scores appear → sorted bar chart.
  NO Value shown.
*/

const WORDS = ["king", "wore", "the", "golden", "crown"];

/* Mock Q/K projected vectors — Q and K are DIFFERENT from raw embeddings */
const Q_ANGLES: Record<string, number> = {
    king: 25, wore: 100, the: 170, golden: 60, crown: 45,
};
const K_ANGLES: Record<string, number> = {
    king: 115, wore: 30, the: 160, golden: 85, crown: 140,
};

/* Pre-computed Q·K scores (cosine-like, range -1 to 1) */
const QK_SCORES: Record<string, number[]> = {
    king: [0.15, 0.42, -0.18, 0.55, 0.88],
    wore: [0.35, 0.12, 0.28, 0.60, 0.40],
    the: [-0.10, 0.22, 0.08, 0.30, 0.15],
    golden: [0.48, 0.55, 0.10, 0.20, 0.72],
    crown: [0.85, 0.38, -0.12, 0.65, 0.18],
};

/* Rank-based colors: #1 = cyan, #2 = amber, rest = neutral */
function rankColor(rank: number, score: number): string {
    if (score < 0) return "rgba(244,63,94,0.6)";
    if (rank === 0) return "#22d3ee";
    if (rank === 1) return "#fbbf24";
    return "rgba(255,255,255,0.3)";
}

function rankBarGradient(rank: number, score: number): string {
    if (score < 0) return "linear-gradient(90deg, rgba(244,63,94,0.45), rgba(244,63,94,0.15))";
    if (rank === 0) return "linear-gradient(90deg, rgba(34,211,238,0.55), rgba(34,211,238,0.2))";
    if (rank === 1) return "linear-gradient(90deg, rgba(251,191,36,0.4), rgba(251,191,36,0.15))";
    return `linear-gradient(90deg, rgba(255,255,255,${0.12 - rank * 0.02}), rgba(255,255,255,0.04))`;
}

const SVG_SIZE = 300;
const SVG_HALF = SVG_SIZE / 2;
const ARROW_LEN = 90;

function degToXY(deg: number, len: number): [number, number] {
    const rad = (deg * Math.PI) / 180;
    return [Math.cos(rad) * len, -Math.sin(rad) * len];
}

export function QueryMeetsKeyViz() {
    const [queryIdx, setQueryIdx] = useState(0);
    const [sweepProgress, setSweepProgress] = useState(0); // 0-5 (which K we're comparing)
    const [showBars, setShowBars] = useState(false);

    const queryWord = WORDS[queryIdx];
    const scores = QK_SCORES[queryWord];

    /* Sort indices by score descending */
    const sortedIndices = useMemo(() =>
        scores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s).map(d => d.i),
        [scores]
    );

    const maxScore = useMemo(() => Math.max(...scores.map(Math.abs)), [scores]);

    /* Reset sweep on query change */
    const changeQuery = useCallback((idx: number) => {
        setQueryIdx(idx);
        setSweepProgress(0);
        setShowBars(false);
    }, []);

    /* Auto-sweep animation */
    useEffect(() => {
        if (sweepProgress < WORDS.length) {
            const t = setTimeout(() => setSweepProgress(p => p + 1), 350);
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(() => setShowBars(true), 200);
            return () => clearTimeout(t);
        }
    }, [sweepProgress]);

    const qAngle = Q_ANGLES[queryWord];
    const [qx, qy] = degToXY(qAngle, ARROW_LEN);

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4 space-y-5" style={{ minHeight: 320 }}>
            {/* Query selector — editorial tabs */}
            <div className="flex items-center justify-center gap-5 sm:gap-7">
                <span className="text-[10px] text-white/15 uppercase tracking-widest font-semibold">Query</span>
                {WORDS.map((word, i) => {
                    const isActive = queryIdx === i;
                    return (
                        <motion.button
                            key={i}
                            onClick={() => changeQuery(i)}
                            className="relative pb-1.5 text-[13px] sm:text-sm font-semibold transition-colors duration-300 cursor-pointer"
                            style={{ color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}
                        >
                            {word}
                            {isActive && (
                                <motion.span
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                    style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)" }}
                                    layoutId="qmk-tab"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                {/* SVG: Q arrow vs K arrows */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={queryIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                        <svg
                            width={SVG_SIZE}
                            height={SVG_SIZE}
                            viewBox={`${-SVG_HALF} ${-SVG_HALF} ${SVG_SIZE} ${SVG_SIZE}`}
                            style={{ maxWidth: "100%", height: "auto" }}
                        >
                            <defs>
                                <filter id="qmk-glow-q" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="6" result="blur" />
                                    <feFlood floodColor="#22d3ee" floodOpacity="0.6" result="color" />
                                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                                    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                                <filter id="qmk-glow-k" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feFlood floodColor="#34d399" floodOpacity="0.4" result="color" />
                                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                                    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>

                            {/* Subtle grid */}
                            <line x1={-SVG_HALF} y1={0} x2={SVG_HALF} y2={0} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                            <line x1={0} y1={-SVG_HALF} x2={0} y2={SVG_HALF} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                            <circle cx={0} cy={0} r={2} fill="rgba(255,255,255,0.08)" />

                            {/* K arrows (emerald) — show progressively */}
                            {WORDS.map((kWord, ki) => {
                                if (ki >= sweepProgress) return null;
                                const kAng = K_ANGLES[kWord];
                                const [kx, ky] = degToXY(kAng, ARROW_LEN * 0.75);
                                const score = scores[ki];
                                const isHighScore = score > 0.5;

                                return (
                                    <g key={`k-${ki}`}>
                                        <motion.line
                                            x1={0} y1={0} x2={kx} y2={ky}
                                            stroke="#34d399"
                                            strokeWidth={isHighScore ? 3 : 2}
                                            strokeLinecap="round"
                                            opacity={isHighScore ? 0.8 : 0.35}
                                            filter="url(#qmk-glow-k)"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: isHighScore ? 0.8 : 0.35 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                        <motion.circle
                                            cx={kx} cy={ky} r={3.5}
                                            fill="#34d399"
                                            opacity={isHighScore ? 0.8 : 0.4}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.1, type: "spring" }}
                                        />
                                        <motion.text
                                            x={kx + (kx > 0 ? 8 : -8)}
                                            y={ky + (ky > 0 ? 14 : -8)}
                                            textAnchor={kx > 0 ? "start" : "end"}
                                            fill={isHighScore ? "#34d399" : "rgba(52,211,153,0.4)"}
                                            fontSize="10"
                                            fontWeight="bold"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.15 }}
                                        >
                                            {kWord}
                                        </motion.text>
                                        {/* Score badge */}
                                        <motion.text
                                            x={kx + (kx > 0 ? 8 : -8)}
                                            y={ky + (ky > 0 ? 25 : -19)}
                                            textAnchor={kx > 0 ? "start" : "end"}
                                            fill={score > 0.5 ? "#22d3ee" : score < 0 ? "#f43f5e" : "rgba(255,255,255,0.3)"}
                                            fontSize="9"
                                            fontFamily="monospace"
                                            fontWeight="bold"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                        >
                                            {score >= 0 ? "+" : ""}{score.toFixed(2)}
                                        </motion.text>
                                    </g>
                                );
                            })}

                            {/* Q arrow (cyan) — always visible, prominent */}
                            <line
                                x1={0} y1={0} x2={qx} y2={qy}
                                stroke="#22d3ee"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                filter="url(#qmk-glow-q)"
                            />
                            <circle cx={qx} cy={qy} r={6} fill="#22d3ee" />
                            <text
                                x={Math.min(SVG_HALF - 20, Math.max(-SVG_HALF + 20, qx + (qx > 0 ? 10 : -10)))}
                                y={Math.min(SVG_HALF - 10, Math.max(-SVG_HALF + 14, qy - 10))}
                                textAnchor={qx > 0 ? "start" : "end"}
                                fill="#22d3ee"
                                fontSize="12"
                                fontWeight="bold"
                            >
                                Q({queryWord})
                            </text>
                        </svg>
                    </motion.div>
                </AnimatePresence>

                {/* Sorted score bars */}
                <AnimatePresence>
                    {showBars && (
                        <motion.div
                            className="w-full max-w-[220px] space-y-1.5"
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="text-[9px] text-white/18 uppercase tracking-widest font-semibold text-center mb-2">
                                Scores for &ldquo;{queryWord}&rdquo;
                            </p>
                            {sortedIndices.map((idx, rank) => {
                                const score = scores[idx];
                                const barW = Math.max(0, (score / maxScore) * 100);
                                const color = rankColor(rank, score);
                                const isTop = rank === 0;
                                return (
                                    <motion.div
                                        key={idx}
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: rank * 0.07 }}
                                    >
                                        <span
                                            className="text-[11px] font-semibold w-14 text-right truncate"
                                            style={{ color }}
                                        >
                                            {WORDS[idx]}
                                        </span>
                                        <div className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{
                                                    background: rankBarGradient(rank, score),
                                                    boxShadow: isTop ? "0 0 8px -2px rgba(34,211,238,0.3)" : "none",
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${barW}%` }}
                                                transition={{ duration: 0.4, delay: rank * 0.07, ease: "easeOut" }}
                                            />
                                        </div>
                                        <span
                                            className="text-[9px] font-mono font-bold w-8 text-right"
                                            style={{ color: isTop ? `${color}cc` : `${color}` }}
                                        >
                                            {score >= 0 ? "+" : ""}{score.toFixed(2)}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
