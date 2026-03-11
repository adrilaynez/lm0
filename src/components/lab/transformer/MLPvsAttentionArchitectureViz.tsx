"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  MLPvsAttentionArchitectureViz — NEW-07 (v2 — Weight Bars + Output Strips)
  §01, right after IsolatedTokensViz.
  
  Split view: MLP (equal bars, same output) vs Attention (dynamic bars, different output).
  Toggle between two sentences. MLP side never changes. Attention side animates.
  Output shown as embedding strips matching the Frozen/Contextual viz style.
*/

interface SentenceConfig {
    words: string[];
    targetWord: string;
    label: string;
    color: string;
    attentionWeights: number[];
    attentionOutput: number[];
}

const SENTENCES: SentenceConfig[] = [
    {
        words: ["The", "bank", "by", "the", "river"],
        targetWord: "bank",
        label: "river context",
        color: "#22d3ee",
        attentionWeights: [0.03, 0.08, 0.15, 0.04, 0.70],
        attentionOutput: [0.25, 0.82, -0.10, 0.15, -0.65, 0.90, 0.30, -0.15],
    },
    {
        words: ["The", "bank", "gave", "a", "loan"],
        targetWord: "bank",
        label: "finance context",
        color: "#fbbf24",
        attentionWeights: [0.04, 0.10, 0.16, 0.05, 0.65],
        attentionOutput: [0.88, -0.15, 0.70, 0.55, 0.20, -0.40, 0.65, 0.42],
    },
];

/* MLP: equal weights, always. And always the same output. */
const MLP_WEIGHT = 0.20;
const MLP_OUTPUT = [0.91, 0.45, -0.22, 0.68, -0.30, 0.15, 0.82, -0.55];

/* ── Embedding strip helpers (same as Frozen/Contextual viz) ── */
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

function barHeight(val: number): number {
    return 5 + Math.abs(val) * 14;
}

function EmbeddingStrip({ values, accent, label }: { values: number[]; accent?: string; label: string }) {
    return (
        <div className="space-y-1">
            <div className="flex items-end gap-[2px]">
                {values.map((v, i) => (
                    <motion.div
                        key={i}
                        className="rounded-sm"
                        style={{ width: 10, background: barColor(v, v >= 0 ? accent : undefined) }}
                        animate={{ height: barHeight(v) }}
                        transition={{ type: "spring", stiffness: 120, damping: 16, delay: i * 0.02 }}
                    />
                ))}
            </div>
            <p className="text-[11px] italic" style={{ color: accent ? `${accent}60` : "rgba(255,255,255,0.25)" }}>
                {label}
            </p>
        </div>
    );
}

/* ── Weight bar row ── */
function WeightRow({
    word, weight, maxWeight, isTarget, color, animate,
}: {
    word: string; weight: number; maxWeight: number; isTarget: boolean; color: string; animate: boolean;
}) {
    const pct = Math.round(weight * 100);
    const barW = (weight / maxWeight) * 100;
    const isStrong = weight > 0.20;

    return (
        <div className="flex items-center gap-2">
            <span
                className="text-[13px] font-medium w-10 text-right shrink-0"
                style={{
                    color: isTarget ? "rgba(255,255,255,0.7)" : isStrong ? `${color}aa` : "rgba(255,255,255,0.35)",
                    fontWeight: isTarget ? 700 : 400,
                }}
            >
                {word}
            </span>
            <div className="flex-1 h-[8px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${barW}%` }}
                    transition={animate
                        ? { type: "spring", stiffness: 100, damping: 16 }
                        : { duration: 0 }
                    }
                    style={{
                        background: isStrong
                            ? `linear-gradient(90deg, ${color}40, ${color}90)`
                            : `${color}35`,
                        boxShadow: isStrong ? `0 0 6px ${color}25` : "none",
                    }}
                />
            </div>
            <span
                className="text-[12px] font-mono tabular-nums w-8 text-right shrink-0"
                style={{ color: isStrong ? `${color}90` : "rgba(255,255,255,0.25)" }}
            >
                {pct}%
            </span>
        </div>
    );
}

export function MLPvsAttentionArchitectureViz() {
    const [sentenceIdx, setSentenceIdx] = useState(0);
    const [hasToggled, setHasToggled] = useState(false);
    const s = SENTENCES[sentenceIdx];

    const handleToggle = (idx: number) => {
        setSentenceIdx(idx);
        if (!hasToggled) setHasToggled(true);
    };

    const maxAttWeight = Math.max(...s.attentionWeights);

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-6">

            {/* Sentence toggle */}
            <div className="flex items-center justify-center gap-2">
                {SENTENCES.map((sent, i) => {
                    const isActive = i === sentenceIdx;
                    return (
                        <button
                            key={i}
                            onClick={() => handleToggle(i)}
                            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 cursor-pointer"
                            style={{
                                border: `1px solid ${isActive ? sent.color + "40" : "rgba(255,255,255,0.08)"}`,
                                background: isActive ? `${sent.color}0c` : "rgba(255,255,255,0.02)",
                                color: isActive ? `${sent.color}cc` : "rgba(255,255,255,0.4)",
                            }}
                        >
                            {sent.words.join(" ")}
                        </button>
                    );
                })}
            </div>

            {/* Split view */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">

                {/* ── LEFT: MLP ── */}
                <div className="rounded-xl px-4 py-5 space-y-3" style={{ border: "1px solid rgba(251,191,36,0.12)", background: "rgba(251,191,36,0.03)" }}>
                    <p className="text-[11px] uppercase tracking-widest font-bold text-amber-400/50 text-center">
                        MLP Architecture
                    </p>

                    <p className="text-[12px] text-white/30 text-center">
                        Influence on &ldquo;<span className="font-semibold text-white/50">bank</span>&rdquo;:
                    </p>

                    <div className="space-y-1.5">
                        {s.words.map((word, wi) => (
                            <WeightRow
                                key={wi}
                                word={word}
                                weight={MLP_WEIGHT}
                                maxWeight={0.25}
                                isTarget={word === s.targetWord}
                                color="#94a3b8"
                                animate={false}
                            />
                        ))}
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <p className="text-[11px] text-white/25 mb-1">Output for &ldquo;bank&rdquo;:</p>
                        <EmbeddingStrip values={MLP_OUTPUT} label="Always the same output" />
                    </div>
                </div>

                {/* ── RIGHT: Attention ── */}
                <div className="rounded-xl px-4 py-5 space-y-3" style={{ border: `1px solid ${s.color}18`, background: `${s.color}05` }}>
                    <p className="text-[11px] uppercase tracking-widest font-bold text-center" style={{ color: `${s.color}60` }}>
                        What We Need
                    </p>

                    <p className="text-[12px] text-white/30 text-center">
                        Influence on &ldquo;<span className="font-semibold text-white/50">bank</span>&rdquo;:
                    </p>

                    <div className="space-y-1.5">
                        {s.words.map((word, wi) => (
                            <WeightRow
                                key={wi}
                                word={word}
                                weight={s.attentionWeights[wi]}
                                maxWeight={maxAttWeight}
                                isTarget={word === s.targetWord}
                                color={s.color}
                                animate={true}
                            />
                        ))}
                    </div>

                    <div className="pt-2" style={{ borderTop: `1px solid ${s.color}10` }}>
                        <p className="text-[11px] mb-1" style={{ color: `${s.color}40` }}>Output for &ldquo;bank&rdquo;:</p>
                        <EmbeddingStrip values={s.attentionOutput} accent={s.color} label="Changes with context!" />
                    </div>
                </div>
            </div>

            {/* Insight text */}
            <AnimatePresence mode="wait">
                {hasToggled ? (
                    <motion.div
                        key="toggled"
                        className="text-center space-y-1"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    >
                        <p className="text-[13px] font-semibold text-white/45">
                            MLP: same weights, same output. Always.
                        </p>
                        <p className="text-[13px] text-white/30 max-w-md mx-auto leading-relaxed">
                            We need a mechanism that <em>routes information differently</em> depending
                            on what surrounds the word. That&apos;s what <span className="text-cyan-400/60 font-semibold">attention</span> does.
                        </p>
                    </motion.div>
                ) : (
                    <motion.p
                        key="idle"
                        className="text-center text-[13px] text-white/25 italic"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.2, 0.35, 0.2] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        Toggle between sentences — watch which side changes
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
