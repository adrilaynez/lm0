"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  InteractiveAttentionPlaygroundViz — FLAGSHIP
  §04d, the crown jewel of the Transformer chapter.
  
  The user selects a sentence, clicks any word, and sees the FULL
  attention mechanism play out step by step:
    Step 1: Q·K raw scores
    Step 2: Softmax → percentage weights
    Step 3: Before/After embedding strip
  
  3 pre-built sentences with hand-crafted score matrices.
  Everything computed client-side from pre-defined data.
*/

/* ── Data types ── */
interface SentenceData {
    words: string[];
    label: string;
    color: string;
    embeddings: number[][]; // N × 8
    scores: number[][];     // N × N pre-softmax logits
}

/* ── 3 Sentences with hand-crafted attention data ── */
const SENTENCES: SentenceData[] = [
    {
        words: ["The", "golden", "king", "wore", "a", "heavy", "crown"],
        label: "royalty",
        color: "#fbbf24",
        embeddings: [
            [0.05, 0.02, 0.01, 0.03, -0.01, 0.02, 0.01, 0.04],
            [0.80, 0.60, 0.30, -0.10, 0.40, 0.20, 0.70, -0.20],
            [0.70, 0.50, 0.60, 0.30, 0.20, 0.40, 0.50, 0.10],
            [0.30, 0.40, 0.20, 0.50, 0.10, 0.30, 0.40, 0.20],
            [0.03, 0.01, 0.02, 0.01, -0.02, 0.01, 0.03, 0.01],
            [0.20, 0.30, 0.10, 0.60, -0.10, 0.50, 0.20, 0.40],
            [0.85, 0.55, 0.40, 0.10, 0.50, 0.15, 0.75, -0.10],
        ],
        scores: [
            [-1.0, -0.5, 0.2, 0.1, -1.0, 0.1, 0.2],
            [-0.8, 0.5, 1.5, 0.3, -0.9, 0.8, 2.0],
            [-1.0, 1.7, 0.5, 0.9, -1.0, 0.7, 2.1],
            [-0.5, 0.8, 1.5, 0.3, -0.8, 1.2, 1.0],
            [-1.0, -0.3, 0.1, 0.2, -1.5, 0.3, 0.1],
            [-0.5, 0.6, 0.8, 1.5, -0.8, 0.3, 1.8],
            [-0.7, 1.8, 1.5, 0.5, -0.9, 1.3, 0.4],
        ],
    },
    {
        words: ["The", "river", "bank", "was", "covered", "in", "moss"],
        label: "nature",
        color: "#22d3ee",
        embeddings: [
            [0.04, 0.03, 0.01, 0.02, -0.01, 0.03, 0.02, 0.01],
            [0.10, 0.70, -0.20, 0.60, 0.40, 0.80, -0.10, 0.30],
            [0.50, 0.40, 0.30, 0.20, 0.10, 0.35, 0.45, 0.15],
            [0.08, 0.05, 0.12, 0.06, 0.03, 0.07, 0.04, 0.09],
            [0.20, 0.55, 0.10, 0.40, 0.30, 0.65, 0.15, 0.25],
            [0.02, 0.04, 0.01, 0.03, -0.01, 0.02, 0.01, 0.02],
            [0.15, 0.60, -0.15, 0.50, 0.35, 0.75, 0.05, 0.45],
        ],
        scores: [
            [-1.0, 0.1, 0.2, -0.5, 0.0, -1.0, 0.1],
            [-0.5, 0.5, 1.8, -0.3, 1.0, -0.7, 1.5],
            [-0.8, 2.2, 0.4, -0.2, 1.0, -0.5, 1.2],
            [-0.5, 0.2, 0.3, -0.3, 0.4, -0.5, 0.2],
            [-0.6, 1.3, 0.8, -0.1, 0.3, -0.4, 1.5],
            [-1.0, -0.2, 0.1, -0.5, 0.2, -1.5, 0.0],
            [-0.5, 1.8, 1.0, -0.2, 1.2, -0.4, 0.5],
        ],
    },
    {
        words: ["She", "played", "piano", "at", "the", "grand", "concert"],
        label: "music",
        color: "#a78bfa",
        embeddings: [
            [0.15, 0.10, 0.25, 0.05, 0.12, 0.08, 0.20, 0.06],
            [0.60, 0.35, 0.70, 0.20, 0.45, 0.55, 0.40, 0.30],
            [0.55, 0.65, 0.50, 0.15, 0.70, 0.40, 0.60, 0.25],
            [0.03, 0.02, 0.04, 0.01, 0.02, 0.03, 0.01, 0.02],
            [0.04, 0.03, 0.02, 0.05, -0.01, 0.02, 0.03, 0.01],
            [0.40, 0.50, 0.35, 0.25, 0.55, 0.60, 0.45, 0.20],
            [0.65, 0.60, 0.55, 0.10, 0.75, 0.35, 0.70, 0.15],
        ],
        scores: [
            [-0.5, 0.8, 0.6, -1.0, -1.0, 0.3, 0.5],
            [-0.3, 0.4, 2.0, -0.8, -0.9, 0.9, 1.6],
            [-0.2, 1.8, 0.5, -0.9, -0.8, 1.0, 1.9],
            [-1.0, 0.0, 0.1, -1.5, -1.0, 0.2, 0.3],
            [-1.0, -0.3, -0.2, -0.8, -1.5, 0.1, 0.0],
            [-0.4, 1.0, 1.2, -0.7, -0.5, 0.3, 1.5],
            [-0.2, 1.5, 1.8, -0.8, -0.7, 1.2, 0.4],
        ],
    },
];

/* ── Math helpers ── */
function softmax(logits: number[]): number[] {
    const max = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

function weightedSum(weights: number[], embeddings: number[][]): number[] {
    const dim = embeddings[0].length;
    const result = new Array(dim).fill(0);
    for (let i = 0; i < weights.length; i++) {
        for (let d = 0; d < dim; d++) {
            result[d] += weights[i] * embeddings[i][d];
        }
    }
    return result;
}

/* ── Embedding strip helpers ── */
function barColor(val: number, accent?: string): string {
    if (val >= 0) {
        if (accent) {
            const i = Math.min(val, 1);
            return `color-mix(in srgb, ${accent} ${Math.round(30 + i * 50)}%, rgba(34,211,238,0.5))`;
        }
        const i = Math.min(val, 1);
        return `rgba(34, 211, 238, ${0.25 + i * 0.55})`;
    }
    const i = Math.min(Math.abs(val), 1);
    return `rgba(251, 191, 36, ${0.25 + i * 0.55})`;
}

function eBarH(val: number): number {
    return 5 + Math.abs(val) * 16;
}

/* ── Main Component ── */
export function InteractiveAttentionPlaygroundViz() {
    const [sentIdx, setSentIdx] = useState(0);
    const [queryIdx, setQueryIdx] = useState<number | null>(null);
    const [stage, setStage] = useState(0); // 0=idle, 1=scores, 2=softmax, 3=output

    const sent = SENTENCES[sentIdx];

    /* Computed attention data */
    const rawScores = queryIdx !== null ? sent.scores[queryIdx] : null;
    const weights = useMemo(() => rawScores ? softmax(rawScores) : null, [rawScores]);
    const beforeEmb = queryIdx !== null ? sent.embeddings[queryIdx] : null;
    const afterEmb = useMemo(
        () => weights ? weightedSum(weights, sent.embeddings) : null,
        [weights, sent.embeddings],
    );

    /* Auto-advance stages */
    useEffect(() => {
        if (stage === 0 || stage >= 3) return;
        const delays = [0, 1500, 1500];
        const t = setTimeout(() => setStage(s => s + 1), delays[stage]);
        return () => clearTimeout(t);
    }, [stage]);

    /* Handle word click */
    const handleWordClick = useCallback((idx: number) => {
        setQueryIdx(idx);
        setStage(1);
    }, []);

    /* Handle sentence switch */
    const handleSentSwitch = useCallback((idx: number) => {
        setSentIdx(idx);
        setQueryIdx(null);
        setStage(0);
    }, []);

    /* Derived values */
    const maxScore = rawScores ? Math.max(...rawScores) : 1;
    const minScore = rawScores ? Math.min(...rawScores) : 0;
    const scoreRange = Math.max(maxScore - minScore, 0.01);

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-5 max-w-2xl mx-auto">

            {/* Title */}
            <div className="text-center">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-cyan-400/40 mb-1">
                    Interactive Playground
                </p>
                <p className="text-base sm:text-lg font-semibold text-white/55">
                    Click any word — watch attention happen
                </p>
            </div>

            {/* Sentence tabs */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {SENTENCES.map((s, i) => {
                    const isActive = i === sentIdx;
                    return (
                        <button
                            key={i}
                            onClick={() => handleSentSwitch(i)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-300 cursor-pointer"
                            style={{
                                border: `1px solid ${isActive ? s.color + "40" : "rgba(255,255,255,0.08)"}`,
                                background: isActive ? `${s.color}0c` : "rgba(255,255,255,0.02)",
                                color: isActive ? `${s.color}cc` : "rgba(255,255,255,0.35)",
                            }}
                        >
                            {s.label}
                        </button>
                    );
                })}
            </div>

            {/* Word pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap py-2">
                {sent.words.map((word, wi) => {
                    const isQuery = queryIdx === wi;
                    const hasWeight = weights && weights[wi] > 0.10;
                    return (
                        <motion.button
                            key={`${sentIdx}-${wi}`}
                            onClick={() => handleWordClick(wi)}
                            className="px-3 py-1.5 rounded-lg text-[14px] font-medium transition-all duration-200 cursor-pointer"
                            style={{
                                border: `1px solid ${isQuery ? sent.color + "60" : hasWeight && stage >= 2 ? sent.color + "25" : "rgba(255,255,255,0.08)"}`,
                                background: isQuery ? `${sent.color}15` : hasWeight && stage >= 2 ? `${sent.color}08` : "rgba(255,255,255,0.03)",
                                color: isQuery ? sent.color : "rgba(255,255,255,0.55)",
                                fontWeight: isQuery ? 700 : 400,
                            }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            {word}
                        </motion.button>
                    );
                })}
            </div>

            {/* Idle hint */}
            {stage === 0 && (
                <motion.p
                    className="text-center text-[13px] text-white/25 italic"
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    Click any word to see its attention pattern
                </motion.p>
            )}

            {/* ── STEP 1: Q·K Scores ── */}
            <AnimatePresence>
                {stage >= 1 && rawScores && (
                    <motion.div
                        key={`scores-${sentIdx}-${queryIdx}`}
                        className="space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: `${sent.color}50` }}>
                                Step 1
                            </span>
                            <span className="text-[12px] text-white/30">
                                Q·K raw scores — how much does &ldquo;{sent.words[queryIdx!]}&rdquo; attend to each word?
                            </span>
                        </div>
                        <div className="space-y-1">
                            {sent.words.map((word, wi) => {
                                const score = rawScores[wi];
                                const barW = Math.max(((score - minScore) / scoreRange) * 100, 2);
                                const isStrong = score > (maxScore - scoreRange * 0.4);
                                return (
                                    <motion.div
                                        key={wi}
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: wi * 0.06, duration: 0.3 }}
                                    >
                                        <span
                                            className="text-[13px] font-medium w-16 text-right shrink-0"
                                            style={{ color: isStrong ? `${sent.color}aa` : "rgba(255,255,255,0.3)" }}
                                        >
                                            {word}
                                        </span>
                                        <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${barW}%` }}
                                                transition={{ delay: wi * 0.06, duration: 0.4, ease: "easeOut" }}
                                                style={{
                                                    background: isStrong
                                                        ? `linear-gradient(90deg, ${sent.color}30, ${sent.color}80)`
                                                        : `${sent.color}25`,
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="text-[12px] font-mono tabular-nums w-10 text-right shrink-0"
                                            style={{ color: isStrong ? `${sent.color}80` : "rgba(255,255,255,0.2)" }}
                                        >
                                            {score.toFixed(1)}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── STEP 2: Softmax → Weights ── */}
            <AnimatePresence>
                {stage >= 2 && weights && (
                    <motion.div
                        key={`weights-${sentIdx}-${queryIdx}`}
                        className="space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Softmax arrow divider */}
                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${sent.color}20, transparent)` }} />
                            <span className="text-[11px] font-semibold" style={{ color: `${sent.color}50` }}>
                                ↓ softmax
                            </span>
                            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${sent.color}20, transparent)` }} />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: `${sent.color}50` }}>
                                Step 2
                            </span>
                            <span className="text-[12px] text-white/30">
                                Attention weights — the recipe
                            </span>
                        </div>
                        <div className="space-y-1">
                            {sent.words.map((word, wi) => {
                                const w = weights[wi];
                                const pct = Math.round(w * 100);
                                const barW = w * 100 * 2.5; // scale for visibility
                                const isStrong = w > 0.12;
                                return (
                                    <motion.div
                                        key={wi}
                                        className="flex items-center gap-2"
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: wi * 0.06, duration: 0.3 }}
                                    >
                                        <span
                                            className="text-[13px] font-medium w-16 text-right shrink-0"
                                            style={{ color: isStrong ? `${sent.color}bb` : "rgba(255,255,255,0.3)" }}
                                        >
                                            {word}
                                        </span>
                                        <div className="flex-1 h-[8px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(barW, 100)}%` }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 80,
                                                    damping: 14,
                                                    delay: wi * 0.06,
                                                }}
                                                style={{
                                                    background: isStrong
                                                        ? `linear-gradient(90deg, ${sent.color}40, ${sent.color}95)`
                                                        : `${sent.color}30`,
                                                    boxShadow: isStrong ? `0 0 8px ${sent.color}20` : "none",
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="text-[13px] font-mono font-semibold tabular-nums w-8 text-right shrink-0"
                                            style={{ color: isStrong ? `${sent.color}90` : "rgba(255,255,255,0.2)" }}
                                        >
                                            {pct}%
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── STEP 3: Before/After Embedding ── */}
            <AnimatePresence>
                {stage >= 3 && beforeEmb && afterEmb && (
                    <motion.div
                        key={`output-${sentIdx}-${queryIdx}`}
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Divider */}
                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${sent.color}20, transparent)` }} />
                            <span className="text-[11px] font-semibold" style={{ color: `${sent.color}50` }}>
                                ↓ weighted sum of values
                            </span>
                            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${sent.color}20, transparent)` }} />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: `${sent.color}50` }}>
                                Step 3
                            </span>
                            <span className="text-[12px] text-white/30">
                                New embedding for &ldquo;{sent.words[queryIdx!]}&rdquo;
                            </span>
                        </div>

                        {/* Before strip */}
                        <div className="space-y-1">
                            <p className="text-[11px] text-white/25">before attention:</p>
                            <div className="flex items-end gap-[3px]">
                                {beforeEmb.map((v, i) => (
                                    <div
                                        key={i}
                                        className="rounded-sm"
                                        style={{
                                            width: 14,
                                            height: eBarH(v),
                                            background: barColor(v),
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* After strip */}
                        <div className="space-y-1">
                            <p className="text-[11px]" style={{ color: `${sent.color}45` }}>after attention:</p>
                            <div className="flex items-end gap-[3px]">
                                {afterEmb.map((v, i) => (
                                    <motion.div
                                        key={i}
                                        className="rounded-sm"
                                        style={{
                                            width: 14,
                                            background: barColor(v, sent.color),
                                        }}
                                        initial={{ height: eBarH(beforeEmb[i]), opacity: 0.5 }}
                                        animate={{ height: eBarH(v), opacity: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 14,
                                            delay: i * 0.04,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Insight */}
                        <motion.p
                            className="text-[13px] text-white/30 leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            The embedding changed — &ldquo;{sent.words[queryIdx!]}&rdquo; absorbed
                            context from the words it attended to most.
                            {weights && (() => {
                                const topIdx = weights.indexOf(Math.max(...weights));
                                const topWord = sent.words[topIdx];
                                const topPct = Math.round(weights[topIdx] * 100);
                                return (
                                    <span style={{ color: `${sent.color}60` }}>
                                        {" "}Especially &ldquo;{topWord}&rdquo; ({topPct}%).
                                    </span>
                                );
                            })()}
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom hint */}
            {stage >= 3 && (
                <motion.p
                    className="text-center text-[12px] text-white/20 italic pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    Click another word to see its attention pattern — or switch sentences
                </motion.p>
            )}
        </div>
    );
}
