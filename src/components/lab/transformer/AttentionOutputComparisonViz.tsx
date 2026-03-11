"use client";

import { motion } from "framer-motion";

/*
  AttentionOutputComparisonViz — NEW-08
  §04c, after FullContextualAssemblyViz as a capstone.
  
  The ultimate proof that attention works:
  3 different sentences containing "king" → 3 different output embeddings.
  Same word, different context, different numbers. QED.
*/

interface ColumnData {
    sentence: { before: string; keyword: string; after: string };
    context: string;
    color: string;
    topWeights: { word: string; pct: number }[];
    embedding: number[];
}

const COLUMNS: ColumnData[] = [
    {
        sentence: { before: "The ", keyword: "king", after: " wore a golden crown" },
        context: "royalty",
        color: "#fbbf24",
        topWeights: [
            { word: "crown", pct: 35 },
            { word: "golden", pct: 25 },
            { word: "wore", pct: 20 },
        ],
        embedding: [0.85, 0.70, -0.10, 0.55, -0.35, 0.60, 0.15, -0.20],
    },
    {
        sentence: { before: "The ", keyword: "king", after: " was captured in chess" },
        context: "chess",
        color: "#22d3ee",
        topWeights: [
            { word: "captured", pct: 40 },
            { word: "chess", pct: 30 },
            { word: "was", pct: 10 },
        ],
        embedding: [-0.15, 0.30, 0.80, -0.25, 0.65, -0.10, 0.75, 0.40],
    },
    {
        sentence: { before: "He was the ", keyword: "king", after: " of comedy" },
        context: "metaphor",
        color: "#a78bfa",
        topWeights: [
            { word: "comedy", pct: 45 },
            { word: "of", pct: 15 },
            { word: "was", pct: 10 },
        ],
        embedding: [0.20, -0.30, 0.15, 0.85, 0.10, -0.45, 0.40, 0.70],
    },
];

/* Embedding strip helpers */
function barColor(val: number, accent: string): string {
    if (val >= 0) {
        const i = Math.min(val, 1);
        return `color-mix(in srgb, ${accent} ${Math.round(30 + i * 50)}%, rgba(34,211,238,0.5))`;
    }
    const i = Math.min(Math.abs(val), 1);
    return `rgba(251, 191, 36, ${0.25 + i * 0.55})`;
}

function barHeight(val: number): number {
    return 5 + Math.abs(val) * 14;
}

export function AttentionOutputComparisonViz() {
    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-6">

            {/* Title */}
            <div className="text-center">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-cyan-400/35 mb-1">
                    The Proof
                </p>
                <p className="text-base sm:text-lg font-semibold text-white/55">
                    Same word. Three contexts. Three different embeddings.
                </p>
            </div>

            {/* 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
                {COLUMNS.map((col, ci) => (
                    <motion.div
                        key={ci}
                        className="rounded-xl overflow-hidden"
                        style={{
                            border: `1px solid ${col.color}20`,
                            background: `${col.color}05`,
                        }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ci * 0.2, duration: 0.5, ease: "easeOut" }}
                    >
                        {/* Context label */}
                        <div className="px-4 pt-3 pb-1">
                            <span
                                className="text-[10px] uppercase tracking-widest font-bold"
                                style={{ color: `${col.color}60` }}
                            >
                                {col.context} context
                            </span>
                        </div>

                        {/* Sentence */}
                        <div className="px-4 pb-3">
                            <p className="text-[13px] leading-relaxed text-white/50">
                                {col.sentence.before}
                                <span className="font-bold" style={{ color: col.color }}>
                                    {col.sentence.keyword}
                                </span>
                                {col.sentence.after}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="mx-4 h-px" style={{ background: `${col.color}12` }} />

                        {/* Top attention weights */}
                        <div className="px-4 pt-3 pb-2">
                            <p className="text-[10px] text-white/20 mb-1.5">top influences:</p>
                            <div className="space-y-1">
                                {col.topWeights.map((w, wi) => {
                                    const barW = (w.pct / col.topWeights[0].pct) * 100;
                                    return (
                                        <motion.div
                                            key={wi}
                                            className="flex items-center gap-1.5"
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: ci * 0.2 + 0.3 + wi * 0.08, duration: 0.3 }}
                                        >
                                            <span
                                                className="text-[12px] font-medium w-16 text-right shrink-0"
                                                style={{ color: w.pct >= 25 ? `${col.color}aa` : "rgba(255,255,255,0.3)" }}
                                            >
                                                {w.word}
                                            </span>
                                            <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${barW}%` }}
                                                    transition={{ delay: ci * 0.2 + 0.4 + wi * 0.08, duration: 0.4, ease: "easeOut" }}
                                                    style={{
                                                        background: w.pct >= 20
                                                            ? `linear-gradient(90deg, ${col.color}30, ${col.color}80)`
                                                            : `${col.color}30`,
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className="text-[11px] font-mono tabular-nums w-7 text-right shrink-0"
                                                style={{ color: w.pct >= 25 ? `${col.color}80` : "rgba(255,255,255,0.2)" }}
                                            >
                                                {w.pct}%
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mx-4 h-px" style={{ background: `${col.color}12` }} />

                        {/* Output embedding strip */}
                        <div className="px-4 pt-3 pb-4">
                            <p className="text-[10px] mb-2" style={{ color: `${col.color}40` }}>
                                output for &ldquo;king&rdquo;:
                            </p>
                            <div className="flex items-end gap-[3px]">
                                {col.embedding.map((v, vi) => (
                                    <motion.div
                                        key={vi}
                                        className="rounded-sm flex-1"
                                        style={{
                                            background: barColor(v, col.color),
                                        }}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: barHeight(v), opacity: 1 }}
                                        transition={{
                                            delay: ci * 0.2 + 0.8 + vi * 0.04,
                                            duration: 0.35,
                                            ease: "easeOut",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Punchline */}
            <motion.div
                className="text-center space-y-1 pt-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
            >
                <p className="text-[14px] font-semibold text-white/45">
                    Three sentences. Three contexts. Three different versions of &ldquo;king.&rdquo;
                </p>
                <p className="text-[13px] text-white/30 max-w-md mx-auto leading-relaxed">
                    Attention did its job — each word&apos;s embedding is now shaped by the
                    words around it. The same token became three different mathematical objects.
                </p>
            </motion.div>
        </div>
    );
}
