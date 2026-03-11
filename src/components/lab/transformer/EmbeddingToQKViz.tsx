"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════
   EmbeddingToQKViz — Shows how a trained matrix
   remixes embedding features into Query or Key.

   Same feature labels in all views — the bars grow
   and shrink to show the remixing. Ghost bars show
   the original embedding as a reference.

   Ultra-visual, zero math jargon.
   ═══════════════════════════════════════════════ */

type WordKey = "king" | "crown" | "ruled" | "golden";
type ViewMode = "embedding" | "query" | "key";

const FEATURE_LABELS = ["Royal?", "Action?", "Person?", "Object?", "Describes?"];

const DATA: Record<WordKey, { emb: number[]; q: number[]; k: number[] }> = {
    king: {
        emb: [0.9, 0.15, 0.85, 0.1, 0.05],
        q:   [0.2, 0.82, 0.3, 0.55, 0.4],
        k:   [0.92, 0.1, 0.8, 0.05, 0.08],
    },
    crown: {
        emb: [0.75, 0.05, 0.1, 0.9, 0.15],
        q:   [0.3, 0.25, 0.72, 0.2, 0.6],
        k:   [0.72, 0.05, 0.08, 0.88, 0.35],
    },
    ruled: {
        emb: [0.2, 0.9, 0.15, 0.1, 0.1],
        q:   [0.4, 0.1, 0.85, 0.7, 0.15],
        k:   [0.28, 0.92, 0.12, 0.08, 0.18],
    },
    golden: {
        emb: [0.6, 0.05, 0.05, 0.15, 0.9],
        q:   [0.5, 0.08, 0.18, 0.85, 0.12],
        k:   [0.58, 0.05, 0.05, 0.12, 0.92],
    },
};

const INSIGHTS: Record<WordKey, { q: string; k: string }> = {
    king: {
        q: "\u201cKing\u201d stops advertising its royalty and starts searching for actions and objects \u2014 what did the king DO?",
        k: "\u201cKing\u201d keeps its royalty bright and adds personhood \u2014 it tells others: I\u2019m a royal person.",
    },
    crown: {
        q: "\u201cCrown\u201d stops offering itself as an object and searches for people and descriptions \u2014 WHO wears me? HOW am I described?",
        k: "\u201cCrown\u201d doubles down on being an object with royal status \u2014 it tells others: I\u2019m a royal thing.",
    },
    ruled: {
        q: "\u201cRuled\u201d suppresses its action and searches for people and objects \u2014 WHO ruled? WHAT did they rule?",
        k: "\u201cRuled\u201d keeps its action at full blast \u2014 it tells others: I\u2019m something someone DID.",
    },
    golden: {
        q: "\u201cGolden\u201d stops offering description and searches for objects \u2014 WHAT does golden describe?",
        k: "\u201cGolden\u201d keeps describing at maximum \u2014 it tells others: I\u2019m a modifier, I describe things.",
    },
};

const VIEW_META: Record<ViewMode, { label: string; icon: string; rgb: string }> = {
    embedding: { label: "Embedding", icon: "\uD83D\uDCCA", rgb: "255,255,255" },
    query:     { label: "Query lens", icon: "\uD83D\uDD0D", rgb: "34,211,238" },
    key:       { label: "Key lens",   icon: "\uD83D\uDD11", rgb: "52,211,153" },
};

export function EmbeddingToQKViz() {
    const [word, setWord] = useState<WordKey>("king");
    const [view, setView] = useState<ViewMode>("embedding");

    const d = DATA[word];
    const values = view === "embedding" ? d.emb : view === "query" ? d.q : d.k;
    const meta = VIEW_META[view];
    const insight = view !== "embedding" ? INSIGHTS[word][view === "query" ? "q" : "k"] : null;

    return (
        <div className="py-6 sm:py-8 px-2" style={{ minHeight: 280 }}>
            {/* Word selector */}
            <div className="flex items-center justify-center gap-2 mb-6" data-int>
                {(Object.keys(DATA) as WordKey[]).map((w) => (
                    <button
                        key={w}
                        onClick={() => setWord(w)}
                        className="px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all"
                        style={{
                            color: w === word ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                            border: `1px solid ${w === word ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)"}`,
                            background: w === word ? "rgba(34,211,238,0.08)" : "transparent",
                        }}
                    >
                        {w}
                    </button>
                ))}
            </div>

            {/* Feature bars */}
            <div className="max-w-sm mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        className="text-[10px] uppercase tracking-widest text-center mb-3"
                        style={{ color: `rgba(${meta.rgb}, 0.3)` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {meta.icon}{" "}
                        {view === "embedding"
                            ? `What \u201c${word}\u201d is`
                            : view === "query"
                                ? `What \u201c${word}\u201d searches for`
                                : `What \u201c${word}\u201d offers`
                        }
                    </motion.div>
                </AnimatePresence>

                {FEATURE_LABELS.map((label, i) => {
                    const val = values[i];
                    const embVal = d.emb[i];
                    const diff = view !== "embedding" ? val - embVal : 0;
                    const showDiff = view !== "embedding" && Math.abs(diff) > 0.1;

                    return (
                        <div key={label} className="flex items-center gap-2 mb-2.5 last:mb-0">
                            <span
                                className="text-[10px] w-[70px] text-right shrink-0 transition-colors duration-300"
                                style={{ color: `rgba(${meta.rgb}, ${val > 0.5 ? 0.5 : 0.2})` }}
                            >
                                {label}
                            </span>
                            <div className="flex-1 relative h-[8px] rounded-full overflow-hidden" style={{ background: `rgba(${meta.rgb}, 0.04)` }}>
                                {/* Ghost bar: embedding reference */}
                                {view !== "embedding" && (
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${embVal * 100}%`,
                                            background: "rgba(255,255,255,0.04)",
                                        }}
                                    />
                                )}
                                {/* Active bar */}
                                <motion.div
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{
                                        background: `rgba(${meta.rgb}, ${0.12 + val * 0.35})`,
                                        boxShadow: val > 0.7 ? `0 0 8px rgba(${meta.rgb}, 0.15)` : "none",
                                    }}
                                    animate={{ width: `${val * 100}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.04 }}
                                />
                            </div>
                            <span className="text-[9px] tabular-nums w-7 text-right shrink-0" style={{ color: `rgba(${meta.rgb}, 0.18)` }}>
                                {(val * 100).toFixed(0)}%
                            </span>
                            {/* Change indicator */}
                            <AnimatePresence>
                                {showDiff && (
                                    <motion.span
                                        className="text-[9px] w-3 shrink-0"
                                        style={{ color: diff > 0 ? "rgba(52,211,153,0.55)" : "rgba(244,63,94,0.55)" }}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: 0.3 + i * 0.05 }}
                                    >
                                        {diff > 0 ? "\u2191" : "\u2193"}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* View toggle */}
            <div className="flex items-center justify-center gap-2 mt-6" data-int>
                {(["embedding", "query", "key"] as ViewMode[]).map((v) => {
                    const m = VIEW_META[v];
                    const isActive = view === v;
                    return (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className="text-[11px] font-medium cursor-pointer px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                            style={{
                                color: isActive ? `rgba(${m.rgb}, 0.85)` : `rgba(${m.rgb}, 0.3)`,
                                border: `1px solid rgba(${m.rgb}, ${isActive ? 0.3 : 0.08})`,
                                background: `rgba(${m.rgb}, ${isActive ? 0.07 : 0.02})`,
                                boxShadow: isActive ? `0 0 10px rgba(${m.rgb}, 0.08)` : "none",
                            }}
                        >
                            {m.icon} {m.label}
                        </button>
                    );
                })}
            </div>

            {/* Insight text */}
            <AnimatePresence mode="wait">
                {insight ? (
                    <motion.p
                        key={`${word}-${view}`}
                        className="text-center text-[11px] mt-4 max-w-sm mx-auto leading-relaxed"
                        style={{ color: `rgba(${meta.rgb}, 0.32)` }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        {insight}
                    </motion.p>
                ) : (
                    <motion.p
                        key="idle"
                        className="text-center text-[11px] mt-4 max-w-sm mx-auto leading-relaxed text-white/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        Switch to a lens to see how the features get remixed.
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Matrix note */}
            <p className="text-center text-[10px] text-white/12 mt-4">
                Each lens is a trained matrix — the model learns how to remix features automatically.
            </p>
        </div>
    );
}
