"use client";

import { useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  V20 — ValueCompletesViz — "The Weighted Sum" 
  Redesign: Premium stepped visualization that clearly shows:
  
  Phase 1: Attention weights (who matters)
  Phase 2: Value vectors appear (what each word carries)
  Phase 3: Weight × Value (scaled contributions — the multiplication)
  Phase 4: SUM → final contextual representation

  Design principles:
  - Clean mono-color (cyan for primary, emerald for output)
  - Larger numbers, clear sum visualization
  - Emphasize that we're ADDING numbers together
  - Each phase reveals one idea
*/

const WORDS = ["king", "wore", "the", "golden", "crown"];

interface Target {
    word: string;
    weight: number;
    valueFeatures: [number, number, number];
}

const FEATURE_LABELS = ["royalty", "action", "object"];

const TARGETS_BY_QUERY: Record<string, Target[]> = {
    king: [
        { word: "crown", weight: 0.30, valueFeatures: [0.9, 0.2, 0.7] },
        { word: "golden", weight: 0.25, valueFeatures: [0.3, 0.8, 0.6] },
        { word: "wore", weight: 0.20, valueFeatures: [0.5, 0.4, 0.9] },
        { word: "king", weight: 0.13, valueFeatures: [0.8, 0.3, 0.5] },
        { word: "the", weight: 0.12, valueFeatures: [0.1, 0.1, 0.2] },
    ],
    crown: [
        { word: "king", weight: 0.35, valueFeatures: [0.8, 0.3, 0.5] },
        { word: "golden", weight: 0.28, valueFeatures: [0.3, 0.8, 0.6] },
        { word: "wore", weight: 0.18, valueFeatures: [0.5, 0.4, 0.9] },
        { word: "crown", weight: 0.10, valueFeatures: [0.9, 0.2, 0.7] },
        { word: "the", weight: 0.09, valueFeatures: [0.1, 0.1, 0.2] },
    ],
    wore: [
        { word: "king", weight: 0.28, valueFeatures: [0.8, 0.3, 0.5] },
        { word: "crown", weight: 0.25, valueFeatures: [0.9, 0.2, 0.7] },
        { word: "golden", weight: 0.22, valueFeatures: [0.3, 0.8, 0.6] },
        { word: "wore", weight: 0.15, valueFeatures: [0.5, 0.4, 0.9] },
        { word: "the", weight: 0.10, valueFeatures: [0.1, 0.1, 0.2] },
    ],
};

type Phase = 1 | 2 | 3 | 4;

const PHASE_META: { label: string; desc: string }[] = [
    { label: "Weights", desc: "How much each word matters to \"king\"" },
    { label: "Values", desc: "What each word's Value vector carries" },
    { label: "Scale", desc: "Multiply each Value by its attention weight" },
    { label: "Sum", desc: "Add all the scaled values together" },
];

export function ValueCompletesViz() {
    const [queryIdx, setQueryIdx] = useState(0);
    const [phase, setPhase] = useState<Phase>(1);

    const queryWord = WORDS[queryIdx];
    const targets = TARGETS_BY_QUERY[queryWord] || TARGETS_BY_QUERY["king"];
    const sorted = useMemo(() => [...targets].sort((a, b) => b.weight - a.weight), [targets]);

    const outputVec = useMemo(() =>
        FEATURE_LABELS.map((_, fi) =>
            sorted.reduce((sum, t) => sum + t.weight * t.valueFeatures[fi], 0)
        ), [sorted]);

    const changeQuery = useCallback((idx: number) => {
        if (TARGETS_BY_QUERY[WORDS[idx]]) {
            setQueryIdx(idx);
            setPhase(1);
        }
    }, []);

    const nextPhase = () => setPhase(p => (p < 4 ? (p + 1) as Phase : 1));
    const prevPhase = () => setPhase(p => (p > 1 ? (p - 1) as Phase : p));

    return (
        <div className="py-6 sm:py-10 px-2 sm:px-4 space-y-5" style={{ minHeight: 500 }}>
            {/* ── Query word selector ── */}
            <div className="flex items-center justify-center gap-5 sm:gap-7">
                <span className="text-[9px] text-white/15 uppercase tracking-[0.15em] font-semibold">Blending</span>
                {WORDS.map((word, i) => {
                    const isActive = queryIdx === i;
                    const hasData = !!TARGETS_BY_QUERY[word];
                    return (
                        <motion.button
                            key={i}
                            onClick={() => hasData && changeQuery(i)}
                            className="relative pb-1.5 text-[13px] sm:text-sm font-semibold transition-colors duration-300 cursor-pointer"
                            style={{
                                color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)",
                                opacity: hasData ? 1 : 0.3,
                            }}
                        >
                            {word}
                            {isActive && (
                                <motion.span
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                    style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.45), transparent)" }}
                                    layoutId="vcv-tab"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Phase stepper ── */}
            <div className="flex items-center justify-center gap-1.5">
                {PHASE_META.map((p, i) => {
                    const step = (i + 1) as Phase;
                    const isActive = phase === step;
                    const isPast = phase > step;
                    return (
                        <div key={i} className="flex items-center gap-1.5">
                            {i > 0 && (
                                <div
                                    className="w-5 sm:w-7 h-px"
                                    style={{ background: isPast ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.04)" }}
                                />
                            )}
                            <motion.button
                                onClick={() => setPhase(step)}
                                className="relative px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer"
                                style={{
                                    background: isActive ? "rgba(34,211,238,0.06)" : "transparent",
                                    border: isActive ? "1px solid rgba(34,211,238,0.18)" : "1px solid rgba(255,255,255,0.04)",
                                    color: isActive ? "rgba(165,243,252,0.85)" : isPast ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.18)",
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {p.label}
                            </motion.button>
                        </div>
                    );
                })}
            </div>

            {/* ── Phase description ── */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={phase}
                    className="text-center text-[13px] sm:text-sm"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.08 } }}
                >
                    {PHASE_META[phase - 1].desc}
                </motion.p>
            </AnimatePresence>

            {/* ── Word rows ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${queryWord}-${phase}`}
                    className="space-y-2.5 max-w-lg mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.08 } }}
                >
                    {sorted.map((item, rank) => {
                        const pct = Math.round(item.weight * 100);
                        const barW = (item.weight / sorted[0].weight) * 100;
                        const isTop = rank <= 1;
                        const scaled = item.valueFeatures.map(f => +(f * item.weight).toFixed(2));
                        const wordAlpha = 0.35 + item.weight * 1.2;

                        return (
                            <motion.div
                                key={item.word}
                                className="rounded-xl px-4 sm:px-5 py-3"
                                style={{
                                    background: isTop
                                        ? "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(34,211,238,0.015))"
                                        : "rgba(255,255,255,0.025)",
                                    border: isTop
                                        ? "1px solid rgba(34,211,238,0.14)"
                                        : "1px solid rgba(255,255,255,0.05)",
                                }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: rank * 0.05 }}
                            >
                                {/* Row: word + bar + percentage */}
                                <div className="flex items-center gap-3">
                                    <span
                                        className="text-sm sm:text-base font-semibold w-16 shrink-0"
                                        style={{ color: `rgba(255,255,255,${wordAlpha})` }}
                                    >
                                        {item.word}
                                    </span>
                                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                background: isTop
                                                    ? "linear-gradient(90deg, rgba(34,211,238,0.6), rgba(34,211,238,0.2))"
                                                    : "linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))",
                                                boxShadow: rank === 0 ? "0 0 10px -2px rgba(34,211,238,0.3)" : "none",
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${barW}%` }}
                                            transition={{ duration: 0.4, delay: rank * 0.05, ease: "easeOut" }}
                                        />
                                    </div>
                                    <span
                                        className="text-sm sm:text-base font-mono font-bold w-10 text-right shrink-0"
                                        style={{ color: isTop ? "rgba(34,211,238,0.8)" : "rgba(255,255,255,0.35)" }}
                                    >
                                        {pct}%
                                    </span>
                                </div>

                                {/* Value features (phase 2+) */}
                                {phase >= 2 && (
                                    <motion.div
                                        className="flex items-center gap-3 mt-2 ml-[76px]"
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + rank * 0.04 }}
                                    >
                                        <span className="text-[9px] text-white/25 font-mono w-4 shrink-0">V</span>
                                        <div className="flex items-center gap-2">
                                            {item.valueFeatures.map((f, fi) => (
                                                <div key={fi} className="flex items-center gap-1">
                                                    <span className="text-[9px] text-white/30">{FEATURE_LABELS[fi]}</span>
                                                    <span className="text-[11px] sm:text-xs font-mono text-white/40">{f.toFixed(1)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Scaled contribution (phase 3+) */}
                                {phase >= 3 && (
                                    <motion.div
                                        className="flex items-center gap-3 mt-1.5 ml-[76px]"
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + rank * 0.04 }}
                                    >
                                        <span className="text-[9px] font-mono w-4 shrink-0 text-cyan-400/50">×</span>
                                        <div className="flex items-center gap-2">
                                            {scaled.map((s, fi) => (
                                                <div key={fi} className="flex items-center gap-1">
                                                    <span className="text-[9px] text-white/20">{FEATURE_LABELS[fi]}</span>
                                                    <span
                                                        className="text-xs sm:text-[13px] font-mono font-bold"
                                                        style={{ color: `rgba(34,211,238,${0.45 + s * 2})` }}
                                                    >
                                                        {s.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}

                    {/* ── Sum visualization (phase 4) ── */}
                    {phase === 4 && (
                        <motion.div
                            className="mt-2 pt-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                        >
                            {/* Plus signs between rows */}
                            <div className="flex items-center justify-center gap-1 mb-3">
                                {sorted.map((item, i) => (
                                    <motion.span
                                        key={i}
                                        className="text-xs font-mono"
                                        style={{ color: "rgba(34,211,238,0.25)" }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + i * 0.06 }}
                                    >
                                        {Math.round(item.weight * 100)}%·V
                                        {i < sorted.length - 1 && (
                                            <span className="text-white/15 mx-1">+</span>
                                        )}
                                    </motion.span>
                                ))}
                            </div>

                            {/* Divider line with arrow */}
                            <div className="flex items-center justify-center mb-3">
                                <motion.div
                                    className="h-px rounded-full"
                                    style={{
                                        width: 120,
                                        background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.2), transparent)",
                                    }}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.4 }}
                                />
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* ── Output result (phase 4) ── */}
            <AnimatePresence>
                {phase === 4 && (
                    <motion.div
                        className="max-w-md mx-auto rounded-xl px-5 sm:px-6 py-5"
                        style={{
                            background: "linear-gradient(145deg, rgba(52,211,153,0.06), rgba(34,211,238,0.03))",
                            border: "1px solid rgba(52,211,153,0.18)",
                        }}
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
                    >
                        <p className="text-[9px] text-emerald-400/60 uppercase tracking-[0.2em] font-semibold text-center mb-4">
                            New representation of &ldquo;{queryWord}&rdquo;
                        </p>

                        <div className="space-y-2.5">
                            {outputVec.map((v, fi) => (
                                <motion.div
                                    key={fi}
                                    className="flex items-center gap-3"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.65 + fi * 0.1 }}
                                >
                                    <span className="text-xs sm:text-[13px] font-medium w-16 text-right text-emerald-300/55">
                                        {FEATURE_LABELS[fi]}
                                    </span>
                                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.025)" }}>
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                background: "linear-gradient(90deg, rgba(52,211,153,0.55), rgba(52,211,153,0.18))",
                                                boxShadow: "0 0 10px -2px rgba(52,211,153,0.3)",
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(v * 150, 100)}%` }}
                                            transition={{ duration: 0.5, delay: 0.75 + fi * 0.1 }}
                                        />
                                    </div>
                                    <span className="text-base sm:text-lg font-mono font-bold text-emerald-300/80 w-12 text-right tabular-nums">
                                        {v.toFixed(2)}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        <motion.p
                            className="mt-4 text-[12px] sm:text-[13px] text-emerald-300/40 text-center leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.1 }}
                        >
                            Each number is a <span className="text-emerald-300/60 font-medium">weighted sum</span> of
                            every word&apos;s Value — &ldquo;{queryWord}&rdquo; now carries context.
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Navigation ── */}
            <div className="flex justify-center gap-3">
                <motion.button
                    onClick={prevPhase}
                    disabled={phase === 1}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
                    style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        color: phase === 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.35)",
                        cursor: phase === 1 ? "not-allowed" : "pointer",
                    }}
                    whileTap={phase > 1 ? { scale: 0.95 } : undefined}
                >
                    ← Back
                </motion.button>
                <motion.button
                    onClick={nextPhase}
                    className="px-6 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
                    style={{
                        background: phase < 4 ? "rgba(34,211,238,0.05)" : "rgba(52,211,153,0.05)",
                        border: phase < 4 ? "1px solid rgba(34,211,238,0.15)" : "1px solid rgba(52,211,153,0.15)",
                        color: phase < 4 ? "rgba(165,243,252,0.65)" : "rgba(110,231,183,0.65)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                >
                    {phase < 4 ? "Next step →" : "↻ Restart"}
                </motion.button>
            </div>
        </div>
    );
}
