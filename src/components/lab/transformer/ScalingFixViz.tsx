"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V22 — ScalingFixViz (v3 — PREMIUM EDITORIAL DISCOVERY)
  You get exploding scores (64 dimensions → huge numbers).
  Slider: "Divide all scores by ___" (1→16).
  Discovery: when you reach √64 = 8, softmax becomes healthy.
  Celebration effect when you find the sweet spot.
*/

function softmax(scores: number[]): number[] {
    const max = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

const WORDS = ["crown", "golden", "wore", "king", "the"];
const CYAN = "#22d3ee";
const AMBER = "#fbbf24";
const WORD_OPACITIES = [1, 0.75, 0.55, 0.4, 0.25];

/* Raw Q·K scores at 64 dimensions (large, exploding) */
const RAW_SCORES = [6.8, 4.8, 3.6, 1.6, -0.8];
const DIMENSIONS = 64;
const IDEAL_DIVISOR = Math.sqrt(DIMENSIONS); // 8

export function ScalingFixViz() {
    const [divisor, setDivisor] = useState(1);

    const scores = useMemo(() => RAW_SCORES.map(s => s / divisor), [divisor]);
    const probs = useMemo(() => softmax(scores), [scores]);
    const maxProb = Math.max(...probs);
    const isSpiky = maxProb > 0.75;
    const isGood = maxProb < 0.45;
    const isIdeal = Math.abs(divisor - IDEAL_DIVISOR) < 0.5;

    /* Health score: how balanced is the distribution? */
    const entropy = -probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
    const maxEntropy = Math.log2(WORDS.length);
    const healthPct = Math.round((entropy / maxEntropy) * 100);

    const divisorColor = isIdeal ? "#34d399"
        : isGood ? CYAN
            : divisor < 3 ? AMBER : "rgba(255,255,255,0.5)";

    return (
        <div className="py-8 sm:py-10 px-4 sm:px-6 space-y-7" style={{ minHeight: 380 }}>
            {/* Lead text */}
            <p className="text-sm sm:text-base text-white/35 leading-relaxed max-w-lg mx-auto text-center">
                With <span className="text-cyan-300/70 font-semibold">{DIMENSIONS} dimensions</span>, our
                scores are huge. Can you find the right number to divide by?
            </p>

            {/* Divisor control — hero-sized counter */}
            <div className="max-w-md mx-auto space-y-3">
                <div className="flex items-baseline justify-between">
                    <span className="text-sm text-white/30">Divide all scores by</span>
                    <motion.span
                        className="text-3xl sm:text-4xl font-mono font-bold tabular-nums"
                        style={{ color: divisorColor }}
                        key={divisor}
                    >
                        ÷{divisor.toFixed(1)}
                    </motion.span>
                </div>
                <input
                    type="range" min={1} max={16} step={0.5} value={divisor}
                    onChange={e => setDivisor(Number(e.target.value))}
                    className="nev-slider w-full"
                    style={{ "--slider-accent": divisorColor } as React.CSSProperties}
                />
                <div className="flex justify-between text-[10px] text-white/15">
                    <span>÷1 (no change)</span>
                    <span>÷16</span>
                </div>
            </div>

            {/* Health meter — minimal inline bar */}
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-white/25 shrink-0">Health</span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                background: isIdeal ? "#34d399"
                                    : isSpiky ? AMBER
                                        : CYAN,
                            }}
                            animate={{ width: `${healthPct}%` }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                    <span className="text-sm font-mono font-bold w-10 text-right"
                        style={{ color: isIdeal ? "#34d399" : isSpiky ? AMBER : CYAN }}>
                        {healthPct}%
                    </span>
                </div>
            </div>

            {/* Softmax bars */}
            <div className="space-y-2 max-w-md mx-auto">
                {WORDS.map((word, i) => {
                    const pct = Math.round(probs[i] * 100);
                    const barW = (probs[i] / maxProb) * 100;
                    const isDominant = isSpiky && probs[i] === maxProb;
                    return (
                        <motion.div key={word} className="flex items-center gap-3">
                            <span className="text-sm font-semibold w-16 text-right shrink-0"
                                style={{ color: CYAN, opacity: WORD_OPACITIES[i] }}>
                                {word}
                            </span>
                            <div className="flex-1 h-5 rounded bg-white/[0.04] overflow-hidden">
                                <motion.div
                                    className="h-full rounded"
                                    style={{
                                        background: isDominant
                                            ? `${AMBER}90`
                                            : `${CYAN}50`,
                                        opacity: WORD_OPACITIES[i],
                                    }}
                                    animate={{ width: `${barW}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                            <span
                                className="text-sm font-mono font-bold w-12 text-right shrink-0"
                                style={{ color: isDominant ? AMBER : CYAN, opacity: isDominant ? 1 : WORD_OPACITIES[i] }}
                            >
                                {pct}%
                            </span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Score display */}
            <p className="text-center text-xs text-white/15 font-mono">
                Scores after ÷{divisor.toFixed(1)}: [{scores.map(s => s.toFixed(2)).join(", ")}]
            </p>

            {/* Discovery message */}
            <AnimatePresence mode="wait">
                {isIdeal ? (
                    <motion.div
                        key="ideal"
                        className="max-w-md mx-auto px-5 py-4"
                        style={{ borderLeft: "2px solid rgba(52,211,153,0.4)" }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-base sm:text-lg font-bold text-emerald-400/80">
                            You found it! ÷{IDEAL_DIVISOR} = ÷√{DIMENSIONS}
                        </p>
                        <p className="text-sm text-white/30 mt-1.5 leading-relaxed">
                            Dividing by the square root of the number of dimensions
                            keeps scores in a healthy range no matter how big the vectors get.
                        </p>
                    </motion.div>
                ) : isSpiky ? (
                    <motion.p
                        key="spiky"
                        className="text-center text-sm italic"
                        style={{ color: `${AMBER}80` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Too spiky — one word gets almost everything. Try dividing by more.
                    </motion.p>
                ) : divisor > 10 ? (
                    <motion.p
                        key="over"
                        className="text-center text-sm italic text-cyan-300/45"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Too flat — differences between words are washed out. Try a smaller divisor.
                    </motion.p>
                ) : (
                    <motion.p
                        key="searching"
                        className="text-center text-sm italic text-white/25"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Getting closer... keep adjusting the slider.
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
