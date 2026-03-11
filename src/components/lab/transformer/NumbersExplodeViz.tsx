"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V21 — NumbersExplodeViz (v3 — PREMIUM EDITORIAL)
  Shows:
  1. What a dot product IS: sum of products across dimensions
  2. WHY more dimensions = bigger sum (more terms to add)
  3. What that does to softmax (spiky = ignoring)
  Slider controls number of dimensions. Shows expanding computation.
*/

function softmax(scores: number[]): number[] {
    const max = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

/* Generate consistent pseudo-random products for a given dimension count.
   baseSim controls the AVERAGE product — words with higher similarity
   get bigger individual terms, so the GAP between totals grows with dim. */
function generateProducts(dim: number, seed: number, baseSim: number): number[] {
    const products: number[] = [];
    for (let i = 0; i < dim; i++) {
        const noise = Math.sin((i + 1) * seed * 9301 + 49297) * 0.35;
        const x = baseSim + noise;
        products.push(+(x).toFixed(2));
    }
    return products;
}

const WORDS = ["crown", "golden", "wore", "king", "the"];
const SEEDS = [1.7, 1.2, 0.9, 0.4, -0.2];
/* Average product per dimension — crown is most similar, "the" least */
const BASE_SIMS = [0.55, 0.42, 0.30, 0.18, 0.05];
/* Cyan-based palette: strongest → weakest attention */
const CYAN = "#22d3ee";
const AMBER = "#fbbf24";
const WORD_OPACITIES = [1, 0.75, 0.55, 0.4, 0.25];

export function NumbersExplodeViz() {
    const [dim, setDim] = useState(4);
    const [showSoftmax, setShowSoftmax] = useState(false);

    /* Compute dot product for each word */
    const wordData = useMemo(() => {
        return WORDS.map((word, wi) => {
            const products = generateProducts(dim, SEEDS[wi] + 1, BASE_SIMS[wi]);
            const dotProduct = products.reduce((sum, p) => sum + p, 0);
            return { word, products, dotProduct, opacity: WORD_OPACITIES[wi] };
        });
    }, [dim]);

    const scores = wordData.map(w => w.dotProduct);
    const probs = useMemo(() => softmax(scores), [scores]);
    const maxProb = Math.max(...probs);
    const isSpiky = maxProb > 0.80;
    const showableProducts = Math.min(dim, 8);
    const dimColor = dim > 32 ? AMBER : dim > 8 ? AMBER : CYAN;

    return (
        <div className="py-8 sm:py-10 px-4 sm:px-6 space-y-7" style={{ minHeight: 420 }}>
            {/* Lead text */}
            <p className="text-sm sm:text-base text-white/35 leading-relaxed max-w-lg mx-auto text-center">
                A dot product is a <span className="text-cyan-300/70 font-semibold">sum of products</span> across
                all dimensions. More dimensions = more terms = <span className="text-amber-400/70 font-semibold">bigger total</span>.
            </p>

            {/* Dimension control — hero-sized counter */}
            <div className="max-w-md mx-auto space-y-3">
                <div className="flex items-baseline justify-between">
                    <span className="text-sm text-white/30">Dimensions</span>
                    <motion.span
                        className="text-3xl sm:text-4xl font-mono font-bold tabular-nums"
                        style={{ color: dimColor }}
                        key={dim}
                    >
                        {dim}
                    </motion.span>
                </div>
                <input
                    type="range" min={2} max={128} step={1} value={dim}
                    onChange={e => setDim(Number(e.target.value))}
                    className="nev-slider w-full"
                    style={{ "--slider-accent": dimColor } as React.CSSProperties}
                />
                <div className="flex justify-between text-[10px] text-white/15">
                    <span>2</span>
                    <span>128</span>
                </div>
            </div>

            {/* Dot product expansion — clean inline layout */}
            <div className="max-w-lg mx-auto space-y-3">
                <p className="text-[11px] uppercase tracking-[0.15em] text-white/20 font-semibold text-center">
                    Q·K for "king" → "crown" — {dim} terms
                </p>

                <div
                    className="px-4 py-3"
                    style={{ borderLeft: `2px solid ${CYAN}40` }}
                >
                    <div className="flex items-center gap-1 flex-wrap">
                        {wordData[0].products.slice(0, showableProducts).map((p, i) => (
                            <motion.span
                                key={i}
                                className="text-sm sm:text-base font-mono"
                                style={{ color: `${CYAN}99` }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.02 }}
                            >
                                {p.toFixed(2)}{i < showableProducts - 1 && <span className="text-white/12 mx-0.5">+</span>}
                            </motion.span>
                        ))}
                        {dim > 8 && (
                            <span className="text-white/20 text-sm font-mono">
                                + {dim - 8} more
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline gap-2 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <span className="text-white/20 text-sm">=</span>
                        <motion.span
                            className="text-xl sm:text-2xl font-mono font-bold"
                            style={{ color: wordData[0].dotProduct > 10 ? AMBER : CYAN }}
                            key={dim}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {wordData[0].dotProduct.toFixed(1)}
                        </motion.span>
                        {dim > 16 && (
                            <span className="text-amber-400/40 text-xs">growing fast</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Softmax toggle */}
            <div className="flex justify-center">
                <motion.button
                    onClick={() => setShowSoftmax(!showSoftmax)}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                    style={{
                        background: showSoftmax
                            ? (isSpiky ? `${AMBER}14` : `${CYAN}14`)
                            : "transparent",
                        border: `1px solid ${showSoftmax
                            ? (isSpiky ? `${AMBER}35` : `${CYAN}35`)
                            : "rgba(255,255,255,0.08)"}`,
                        color: showSoftmax
                            ? (isSpiky ? AMBER : CYAN)
                            : "rgba(255,255,255,0.4)",
                    }}
                    whileTap={{ scale: 0.97 }}
                >
                    {showSoftmax ? (isSpiky ? "Softmax is broken" : "Softmax looks healthy") : "What does softmax do with these?"}
                </motion.button>
            </div>

            {/* Softmax results */}
            <AnimatePresence>
                {showSoftmax && (
                    <motion.div
                        className="max-w-md mx-auto space-y-2.5"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                    >
                        {wordData.map((wd, i) => {
                            const pct = Math.round(probs[i] * 100);
                            const barW = (probs[i] / maxProb) * 100;
                            const isDominant = isSpiky && probs[i] === maxProb;
                            return (
                                <motion.div
                                    key={wd.word}
                                    className="flex items-center gap-3"
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <span className="text-sm font-semibold w-16 text-right shrink-0"
                                        style={{ color: CYAN, opacity: wd.opacity }}>
                                        {wd.word}
                                    </span>
                                    <span className="text-xs font-mono text-white/20 w-12 text-right shrink-0">
                                        {wd.dotProduct.toFixed(1)}
                                    </span>
                                    <div className="flex-1 h-5 rounded bg-white/[0.04] overflow-hidden">
                                        <motion.div
                                            className="h-full rounded"
                                            style={{
                                                background: isDominant
                                                    ? `${AMBER}90`
                                                    : `${CYAN}50`,
                                                opacity: wd.opacity,
                                            }}
                                            animate={{ width: `${barW}%` }}
                                            transition={{ duration: 0.25 }}
                                        />
                                    </div>
                                    <span
                                        className="text-sm font-mono font-bold w-12 text-right shrink-0"
                                        style={{ color: isDominant ? AMBER : CYAN, opacity: isDominant ? 1 : wd.opacity }}
                                    >
                                        {pct}%
                                    </span>
                                </motion.div>
                            );
                        })}

                        <motion.p
                            className="text-center text-sm italic max-w-sm mx-auto pt-2"
                            style={{ color: isSpiky ? `${AMBER}80` : "rgba(255,255,255,0.25)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 }}
                        >
                            {dim <= 6
                                ? "Few dimensions → small scores → softmax spreads attention evenly. Good!"
                                : dim <= 24
                                    ? "More dimensions → bigger scores → softmax starts favoring one word..."
                                    : "Huge scores → softmax gives almost everything to one word. The model stops blending!"}
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
