"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  LayerEvolutionViz — Redesign v3
  
  THE CONCEPT: Depth creates differentiation.
  
  With 1 Transformer block: every token's embedding looks almost the same.
  The model can't distinguish "professor" from "the" — predictions are generic.
  
  With 6 blocks: each token develops a unique "fingerprint" — 
  the model deeply understands each word's role in the sentence.
  
  Visual: 5 tokens shown as horizontal bar charts (8 features each).
  At depth 1: all bars are nearly identical (grey, flat).
  At depth 6: each token has vivid, unique bars.
  
  A "similarity grid" on the right shows pairwise similarity between tokens,
  making it OBVIOUS when they're all the same vs. all different.
*/

const TOKENS = ["The", "professor", "published", "the", "paper"];
const COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];

const N_FEATURES = 8;

/* Generate fingerprints per depth — start nearly identical, become unique */
function generateFingerprints(depth: number): number[][] {
    const base = [0.35, 0.38, 0.36, 0.37, 0.34, 0.39, 0.35, 0.37];
    const spread = Math.pow(depth / 6, 0.8); /* non-linear: slow start, fast divergence */

    return TOKENS.map((_, ti) => {
        return base.map((b, fi) => {
            const unique = Math.sin((ti + 1) * (fi + 1) * 1.4) * 0.5
                + Math.cos((ti + 2) * (fi + 0.5) * 0.9) * 0.3;
            const val = b * (1 - spread) + (b + unique) * spread;
            return Math.max(0.05, Math.min(1, val));
        });
    });
}

/* Average pairwise cosine similarity */
function avgPairwiseSim(fps: number[][]): number {
    let total = 0, count = 0;
    for (let i = 0; i < fps.length; i++) {
        for (let j = i + 1; j < fps.length; j++) {
            let dot = 0, ni = 0, nj = 0;
            for (let k = 0; k < N_FEATURES; k++) {
                dot += fps[i][k] * fps[j][k];
                ni += fps[i][k] ** 2;
                nj += fps[j][k] ** 2;
            }
            total += dot / (Math.sqrt(ni) * Math.sqrt(nj) + 1e-8);
            count++;
        }
    }
    return count > 0 ? total / count : 1;
}

const INSIGHTS: Record<number, { text: string; severity: "bad" | "mid" | "good" }> = {
    1: { text: "1 block: all tokens look almost identical. The model can\u2019t tell \u201Cprofessor\u201D from \u201Cthe\u201D. Predictions will be generic.", severity: "bad" },
    2: { text: "2 blocks: subtle differences emerging. Content words start to separate from function words.", severity: "bad" },
    3: { text: "3 blocks: clearer patterns. \u201Cprofessor\u201D and \u201Cpublished\u201D are developing distinct signatures.", severity: "mid" },
    4: { text: "4 blocks: strong differentiation. Each word\u2019s role in the sentence is becoming clear.", severity: "mid" },
    5: { text: "5 blocks: rich, unique representations. The model deeply understands each token\u2019s meaning.", severity: "good" },
    6: { text: "6 blocks: every token has a completely unique fingerprint. Maximum understanding.", severity: "good" },
};

const SEV_COLOR = {
    bad: { color: "#f43f5e", rgb: "244,63,94" },
    mid: { color: "#fbbf24", rgb: "251,191,36" },
    good: { color: "#34d399", rgb: "52,211,153" },
};

export function LayerEvolutionViz() {
    const [depth, setDepth] = useState(1);

    const fingerprints = useMemo(() => generateFingerprints(depth), [depth]);
    const similarity = useMemo(() => avgPairwiseSim(fingerprints), [fingerprints]);
    const diffPct = Math.min(Math.max((1 - similarity) / 0.6, 0), 1) * 100;
    const insight = INSIGHTS[depth];
    const sev = SEV_COLOR[insight.severity];

    return (
        <div className="py-5 sm:py-7 px-2 sm:px-4">
            {/* Depth selector */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
                <span className="text-[11px] text-white/25 font-semibold mr-2">Depth:</span>
                {[1, 2, 3, 4, 5, 6].map((n) => {
                    const active = depth === n;
                    const s = SEV_COLOR[INSIGHTS[n].severity];
                    return (
                        <motion.button key={n} onClick={() => setDepth(n)}
                            whileTap={{ scale: 0.9 }}
                            className="relative w-9 h-9 rounded-xl text-[13px] font-bold cursor-pointer"
                            animate={{
                                background: active ? `rgba(${s.rgb},0.15)` : "rgba(255,255,255,0.02)",
                                color: active ? s.color : "rgba(255,255,255,0.2)",
                                borderColor: active ? `rgba(${s.rgb},0.4)` : "rgba(255,255,255,0.05)",
                            }}
                            style={{ border: "1.5px solid" }}>
                            {n}
                            {active && (
                                <motion.div className="absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full"
                                    style={{ background: s.color }} layoutId="evo-depth" />
                            )}
                        </motion.button>
                    );
                })}
                <span className="text-[11px] text-white/15 ml-1">blocks</span>
            </div>

            {/* ── Token fingerprints ── */}
            <div className="max-w-md mx-auto space-y-1.5">
                {TOKENS.map((token, ti) => {
                    const fp = fingerprints[ti];
                    const color = COLORS[ti];
                    /* At low depth, desaturate to show "sameness" */
                    const vibrancy = 0.3 + (depth / 6) * 0.7;
                    return (
                        <div key={ti} className="flex items-center gap-2.5">
                            {/* Token label */}
                            <motion.span
                                className="text-[13px] font-semibold w-[72px] text-right shrink-0 font-mono"
                                animate={{
                                    color: depth >= 4 ? color : "rgba(255,255,255,0.35)",
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                {token}
                            </motion.span>

                            {/* Fingerprint bars */}
                            <div className="flex-1 flex items-end gap-[3px]" style={{ height: 36 }}>
                                {fp.map((val, fi) => (
                                    <motion.div key={fi}
                                        className="flex-1 rounded-t-sm"
                                        animate={{
                                            height: Math.max(3, val * 34),
                                            background: color,
                                            opacity: vibrancy * (0.25 + val * 0.65),
                                        }}
                                        transition={{
                                            type: "spring", stiffness: 120, damping: 14,
                                            delay: fi * 0.015 + ti * 0.025,
                                        }}
                                        style={depth >= 5 ? { filter: `drop-shadow(0 0 3px ${color}30)` } : {}}
                                    />
                                ))}
                            </div>

                            {/* Mini similarity to first token */}
                            {ti > 0 && (
                                <motion.span className="text-[9px] font-mono w-10 text-right shrink-0"
                                    animate={{
                                        color: depth <= 2 ? "rgba(244,63,94,0.5)" : depth >= 5 ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.25)",
                                    }}>
                                    {(() => {
                                        let dot = 0, n0 = 0, ni = 0;
                                        for (let k = 0; k < N_FEATURES; k++) {
                                            dot += fingerprints[0][k] * fp[k];
                                            n0 += fingerprints[0][k] ** 2;
                                            ni += fp[k] ** 2;
                                        }
                                        const sim = dot / (Math.sqrt(n0) * Math.sqrt(ni) + 1e-8);
                                        return `${(sim * 100).toFixed(0)}%`;
                                    })()}
                                </motion.span>
                            )}
                            {ti === 0 && <span className="text-[9px] text-white/10 w-10 text-right shrink-0">ref</span>}
                        </div>
                    );
                })}
                {/* Legend for similarity column */}
                <p className="text-[9px] text-white/15 text-right pr-0.5">
                    {"\u2190"} similarity to {"\u201C"}The{"\u201D"}
                </p>
            </div>

            {/* ── Differentiation meter ── */}
            <div className="max-w-xs mx-auto mt-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-white/25 font-semibold">Token differentiation</span>
                    <motion.span className="text-[13px] font-bold font-mono tabular-nums"
                        animate={{ color: sev.color }}>
                        {diffPct.toFixed(0)}%
                    </motion.span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <motion.div className="h-full rounded-full"
                        animate={{ width: `${diffPct}%`, background: sev.color }}
                        transition={{ type: "spring", stiffness: 100, damping: 14 }} />
                </div>
            </div>

            {/* ── Insight ── */}
            <AnimatePresence mode="wait">
                <motion.p key={depth}
                    className="text-center text-[13px] font-semibold mt-3 max-w-sm mx-auto leading-relaxed"
                    style={{ color: `rgba(${sev.rgb},0.6)` }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}>
                    {insight.text}
                </motion.p>
            </AnimatePresence>

            {/* Takeaway */}
            {depth >= 5 && (
                <motion.div
                    className="flex items-center justify-center gap-2 mt-3 px-4 py-2 rounded-xl mx-auto max-w-sm"
                    style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.1)" }}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-[12px] font-semibold" style={{ color: "rgba(52,211,153,0.6)" }}>
                        This is why depth matters: more blocks = richer, more unique token representations.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
