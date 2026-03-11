"use client";

import { useState, useMemo } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V44 — BeforeAfterBlockViz (v2 — BETTER)
  Side-by-side before/after with animated transition.
  Shows: token embedding bars, cosine similarity heatmaps, per-token
  change magnitude, and clear explanatory text.
  All text ≥ 13px. Professional glassmorphism aesthetic.
*/

const TOKENS = ["The", "professor", "published", "the", "paper"];
const COLORS = ["#67e8f9", "#818cf8", "#f472b6", "#fbbf24", "#34d399"];

const BEFORE: number[][] = [
    [0.50, 0.48, 0.52, 0.49, 0.51, 0.50, 0.48, 0.51],
    [0.51, 0.49, 0.50, 0.52, 0.48, 0.51, 0.50, 0.49],
    [0.49, 0.51, 0.48, 0.50, 0.52, 0.49, 0.51, 0.50],
    [0.50, 0.50, 0.51, 0.48, 0.49, 0.52, 0.50, 0.48],
    [0.52, 0.48, 0.50, 0.51, 0.50, 0.49, 0.48, 0.52],
];

const AFTER: number[][] = [
    [0.90, 0.12, 0.35, 0.78, 0.22, 0.68, 0.40, 0.55],
    [0.18, 0.85, 0.72, 0.30, 0.88, 0.15, 0.55, 0.42],
    [0.55, 0.42, 0.88, 0.62, 0.35, 0.75, 0.28, 0.80],
    [0.30, 0.65, 0.18, 0.85, 0.70, 0.40, 0.82, 0.22],
    [0.72, 0.28, 0.60, 0.45, 0.15, 0.90, 0.35, 0.78],
];

/* Per-token explanation of what changed */
const CHANGE_LABELS = [
    '"The" adapted — now it points toward "professor"',
    '"professor" absorbed its role as the subject',
    '"published" linked subject to object',
    '"the" disambiguated — it modifies "paper"',
    '"paper" learned it\'s the thing being published',
];

function cosineSim(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

function buildSimMatrix(vecs: number[][]): number[][] {
    return vecs.map((a) => vecs.map((b) => cosineSim(a, b)));
}

const SIM_BEFORE = buildSimMatrix(BEFORE);
const SIM_AFTER = buildSimMatrix(AFTER);

/* Mini bar chart */
function MiniBarChart({ values, color, muted }: { values: number[]; color: string; muted: boolean }) {
    return (
        <div className="flex items-end gap-px" style={{ height: 44 }}>
            {values.map((v, i) => (
                <motion.div
                    key={i}
                    className="rounded-t-sm"
                    style={{
                        width: 5,
                        background: muted ? "rgba(255,255,255,0.12)" : color,
                        opacity: muted ? 0.4 : 0.7,
                    }}
                    animate={{ height: v * 40 + 2 }}
                    transition={{ type: "spring", stiffness: 120, damping: 14 }}
                />
            ))}
        </div>
    );
}

/* Similarity heatmap */
function SimHeatmap({ matrix, label, accent }: { matrix: number[][]; label: string; accent: string }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-[13px] font-bold" style={{ color: accent }}>
                {label}
            </span>
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)" }}>
                {/* Column labels */}
                <div className="flex">
                    <div style={{ width: 38 }} />
                    {TOKENS.map((t, i) => (
                        <div key={i} className="flex-1 text-center py-0.5" style={{ minWidth: 28 }}>
                            <span className="text-[9px] font-semibold" style={{ color: COLORS[i], opacity: 0.5 }}>{t.slice(0, 3)}</span>
                        </div>
                    ))}
                </div>
                {/* Rows */}
                {matrix.map((row, ri) => (
                    <div key={ri} className="flex">
                        <div className="flex items-center justify-end pr-1" style={{ width: 38 }}>
                            <span className="text-[9px] font-semibold" style={{ color: COLORS[ri], opacity: 0.4 }}>{TOKENS[ri].slice(0, 3)}</span>
                        </div>
                        {row.map((val, ci) => {
                            const isDiag = ri === ci;
                            const intensity = isDiag ? 0.05 : Math.max(0, (val - 0.3) / 0.7) * 0.5;
                            return (
                                <motion.div
                                    key={ci}
                                    className="flex-1 flex items-center justify-center p-px"
                                    style={{ minWidth: 28 }}
                                >
                                    <div
                                        className="w-full aspect-square rounded-sm flex items-center justify-center"
                                        style={{
                                            background: isDiag
                                                ? "rgba(255,255,255,0.02)"
                                                : `rgba(${accent === "#94a3b8" ? "148,163,184" : "34,211,238"},${intensity})`,
                                        }}
                                    >
                                        <span className="text-[8px] font-mono" style={{ color: isDiag ? "rgba(255,255,255,0.1)" : `${accent}60` }}>
                                            {isDiag ? "—" : (val * 100).toFixed(0)}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function BeforeAfterBlockViz() {
    const [showAfter, setShowAfter] = useState(false);

    const data = showAfter ? AFTER : BEFORE;
    const simMatrix = showAfter ? SIM_AFTER : SIM_BEFORE;

    /* Average off-diagonal similarity */
    const avgSim = useMemo(() => {
        const m = showAfter ? SIM_AFTER : SIM_BEFORE;
        let sum = 0, count = 0;
        m.forEach((row, ri) => row.forEach((v, ci) => { if (ri !== ci) { sum += v; count++; } }));
        return sum / count;
    }, [showAfter]);

    /* Per-token self-change (before→after cosine similarity) */
    const tokenChanges = useMemo(() =>
        TOKENS.map((_, i) => 1 - cosineSim(BEFORE[i], AFTER[i])),
        []);

    /* Highlighted token */
    const [hoveredToken, setHoveredToken] = useState<number | null>(null);

    return (
        <div
            className="py-6 sm:py-8 px-3 sm:px-6 rounded-2xl"
            style={{
                background: "linear-gradient(180deg, rgba(15,23,42,0.5), rgba(15,23,42,0.25))",
                border: "1px solid rgba(255,255,255,0.04)",
            }}
        >
            {/* Header badge */}
            <div className="flex items-center justify-center mb-5">
                <div
                    className="px-4 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-2"
                    style={{
                        background: "linear-gradient(135deg, rgba(148,163,184,0.06), rgba(34,211,238,0.04))",
                        border: "1px solid rgba(148,163,184,0.12)",
                        color: "rgba(255,255,255,0.35)",
                    }}
                >
                    🔄 Before &amp; After One Block
                </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-3 mb-6">
                <motion.button
                    onClick={() => setShowAfter(false)}
                    className="px-5 py-2 rounded-xl text-[14px] font-bold transition-all"
                    style={{
                        background: !showAfter
                            ? "linear-gradient(135deg, rgba(148,163,184,0.12), rgba(148,163,184,0.04))"
                            : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${!showAfter ? "rgba(148,163,184,0.35)" : "rgba(255,255,255,0.04)"}`,
                        color: !showAfter ? "#94a3b8" : "rgba(255,255,255,0.2)",
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    Before Block
                </motion.button>

                <motion.div
                    className="text-[16px]"
                    style={{ color: "rgba(255,255,255,0.1)" }}
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    →
                </motion.div>

                <motion.button
                    onClick={() => setShowAfter(true)}
                    className="px-5 py-2 rounded-xl text-[14px] font-bold transition-all"
                    style={{
                        background: showAfter
                            ? "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.04))"
                            : "rgba(255,255,255,0.02)",
                        border: `1.5px solid ${showAfter ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.04)"}`,
                        color: showAfter ? "#22d3ee" : "rgba(255,255,255,0.2)",
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    After Block ✨
                </motion.button>
            </div>

            {/* Token embedding bars */}
            <div className="flex items-end justify-center gap-3 sm:gap-5 mb-3 flex-wrap">
                {TOKENS.map((token, i) => (
                    <motion.div
                        key={i}
                        className="flex flex-col items-center gap-1.5 cursor-pointer rounded-lg px-2 py-2"
                        style={{
                            background: hoveredToken === i ? "rgba(255,255,255,0.02)" : "transparent",
                            border: hoveredToken === i ? `1px solid ${COLORS[i]}15` : "1px solid transparent",
                        }}
                        onMouseEnter={() => setHoveredToken(i)}
                        onMouseLeave={() => setHoveredToken(null)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                    >
                        <MiniBarChart values={data[i]} color={COLORS[i]} muted={!showAfter} />
                        <span
                            className="text-[14px] font-bold"
                            style={{ color: showAfter ? COLORS[i] : "rgba(255,255,255,0.25)" }}
                        >
                            {token}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Hovered token insight */}
            <AnimatePresence mode="wait">
                {hoveredToken !== null && showAfter && (
                    <motion.p
                        key={hoveredToken}
                        className="text-center text-[13px] mb-4 px-4"
                        style={{ color: `${COLORS[hoveredToken]}80` }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {CHANGE_LABELS[hoveredToken]}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Two-panel: Heatmap + Stats */}
            <div className="flex flex-col sm:flex-row items-start justify-center gap-6 sm:gap-8 mt-4">
                {/* Similarity heatmap */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={showAfter ? "after-heat" : "before-heat"}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                    >
                        <SimHeatmap
                            matrix={simMatrix}
                            label={showAfter ? "After — differentiated" : "Before — all similar"}
                            accent={showAfter ? "#22d3ee" : "#94a3b8"}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Stats panel */}
                <div className="flex flex-col gap-3" style={{ minWidth: 180 }}>
                    {/* Average similarity metric */}
                    <div className="px-4 py-3 rounded-xl" style={{
                        background: showAfter ? "rgba(34,211,238,0.04)" : "rgba(148,163,184,0.04)",
                        border: `1px solid ${showAfter ? "rgba(34,211,238,0.12)" : "rgba(148,163,184,0.08)"}`,
                    }}>
                        <p className="text-[13px] font-semibold text-white/30 mb-1">Avg. similarity</p>
                        <motion.p
                            className="text-[28px] font-bold font-mono"
                            style={{ color: showAfter ? "#22d3ee" : "#94a3b8" }}
                            key={showAfter ? "a" : "b"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {(avgSim * 100).toFixed(0)}%
                        </motion.p>
                        <p className="text-[13px] mt-0.5" style={{ color: showAfter ? "rgba(34,211,238,0.4)" : "rgba(148,163,184,0.35)" }}>
                            {showAfter ? "Tokens are distinct" : "Tokens nearly identical"}
                        </p>
                    </div>

                    {/* Per-token change bars (only after) */}
                    {showAfter && (
                        <motion.div
                            className="px-4 py-3 rounded-xl"
                            style={{ background: "rgba(244,114,182,0.03)", border: "1px solid rgba(244,114,182,0.08)" }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <p className="text-[13px] font-semibold text-white/30 mb-2">Change per token</p>
                            {TOKENS.map((tok, i) => (
                                <div key={i} className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] font-semibold w-12 text-right" style={{ color: `${COLORS[i]}70` }}>{tok.slice(0, 4)}</span>
                                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: COLORS[i] }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${tokenChanges[i] * 100 * 2.5}%` }}
                                            transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 80, damping: 12 }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-mono w-8" style={{ color: `${COLORS[i]}50` }}>{(tokenChanges[i] * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Status */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={showAfter ? "after" : "before"}
                    className="text-center mt-5 px-4 py-3 rounded-xl mx-auto max-w-md"
                    style={{
                        background: showAfter ? "rgba(34,211,238,0.04)" : "rgba(148,163,184,0.03)",
                        border: `1px solid ${showAfter ? "rgba(34,211,238,0.1)" : "rgba(148,163,184,0.06)"}`,
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                >
                    <p className="text-[14px] font-bold" style={{ color: showAfter ? "rgba(34,211,238,0.6)" : "rgba(148,163,184,0.45)" }}>
                        {showAfter
                            ? "✨ Each token now carries unique, context-aware information"
                            : "All tokens look nearly identical — no context, no differentiation"}
                    </p>
                    <p className="text-[13px] mt-1" style={{ color: showAfter ? "rgba(34,211,238,0.3)" : "rgba(148,163,184,0.25)" }}>
                        {showAfter
                            ? "Attention gave them context. FFN gave them understanding. Residuals preserved the signal."
                            : "Raw position + word embeddings. The block hasn't processed them yet."}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
