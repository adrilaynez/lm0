"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  AttentionRecipeViz — NEW-04 (v2 — Recipe + Before/After with deltas)
  §03, right before KeyTakeaway.
  
  Two sections stacked:
  1. THE RECIPE — attention weights as horizontal bars (who matters)
  2. THE TRANSFORMATION — before/after feature values with delta arrows
  
  Shows BOTH the recipe AND the concrete numerical change.
  Animated in sequence: recipe appears → then transformation morphs.
*/

const WORD = "king";

const RECIPE = [
    { word: "crown", weight: 0.30, color: "#fbbf24" },
    { word: "golden", weight: 0.25, color: "#eab308" },
    { word: "wore", weight: 0.20, color: "#a3a3a3" },
    { word: "ruled", weight: 0.15, color: "#22d3ee" },
    { word: "wisely", weight: 0.07, color: "#a78bfa" },
    { word: "the", weight: 0.03, color: "#737373" },
];

const FEATURES = [
    { name: "royalty", before: 0.30, after: 0.85 },
    { name: "power", before: 0.25, after: 0.70 },
    { name: "wealth", before: 0.15, after: 0.55 },
    { name: "ceremony", before: 0.20, after: 0.60 },
    { name: "nature", before: 0.45, after: 0.10 },
    { name: "generic", before: 0.35, after: 0.12 },
];

export function AttentionRecipeViz() {
    const [phase, setPhase] = useState<"recipe" | "transform" | "done">("recipe");

    /* Auto-advance: recipe → transform → done */
    useEffect(() => {
        if (phase === "recipe") {
            const t = setTimeout(() => setPhase("transform"), 1800);
            return () => clearTimeout(t);
        }
        if (phase === "transform") {
            const t = setTimeout(() => setPhase("done"), 1600);
            return () => clearTimeout(t);
        }
    }, [phase]);

    const replay = useCallback(() => {
        setPhase("recipe");
    }, []);

    const showTransform = phase === "transform" || phase === "done";

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-6 max-w-xl mx-auto">

            {/* Title */}
            <div className="text-center">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-cyan-400/35 mb-1">
                    From spotlight to meaning
                </p>
                <p className="text-base sm:text-lg font-semibold text-white/55">
                    &ldquo;{WORD}&rdquo; — how attention weights reshape meaning
                </p>
            </div>

            {/* ── SECTION 1: The Recipe ── */}
            <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-widest font-bold text-amber-400/50">
                    The Recipe — who matters to &ldquo;{WORD}&rdquo;
                </p>
                <div className="space-y-1.5">
                    {RECIPE.map((r, i) => {
                        const pct = Math.round(r.weight * 100);
                        const barW = (r.weight / 0.30) * 100;
                        const isStrong = r.weight >= 0.15;
                        return (
                            <motion.div
                                key={i}
                                className="flex items-center gap-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.35 }}
                            >
                                <span
                                    className="text-[13px] font-medium w-14 text-right shrink-0"
                                    style={{ color: isStrong ? `${r.color}bb` : `${r.color}60` }}
                                >
                                    {r.word}
                                </span>
                                <div className="flex-1 h-[8px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${barW}%` }}
                                        transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                                        style={{
                                            background: isStrong
                                                ? `linear-gradient(90deg, ${r.color}40, ${r.color}90)`
                                                : `${r.color}35`,
                                            boxShadow: isStrong ? `0 0 6px ${r.color}20` : "none",
                                        }}
                                    />
                                </div>
                                <span
                                    className="text-[12px] font-mono tabular-nums w-8 text-right shrink-0"
                                    style={{ color: isStrong ? `${r.color}90` : "rgba(255,255,255,0.25)" }}
                                >
                                    {pct}%
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
                <motion.span
                    className="text-[11px] font-semibold"
                    animate={{
                        color: showTransform ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.15)",
                    }}
                    transition={{ duration: 0.4 }}
                >
                    ↓ apply recipe
                </motion.span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
            </div>

            {/* ── SECTION 2: The Transformation ── */}
            <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-widest font-bold text-cyan-400/50">
                    The Transformation — what changed in &ldquo;{WORD}&rdquo;
                </p>

                {/* Feature table */}
                <div className="space-y-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-1 mb-1">
                        <span className="text-[11px] text-white/20 w-16 shrink-0">feature</span>
                        <span className="text-[11px] text-white/20 flex-1 text-center">before → after</span>
                        <span className="text-[11px] text-white/20 w-14 text-right shrink-0">change</span>
                    </div>

                    {FEATURES.map((f, i) => {
                        const delta = f.after - f.before;
                        const grew = delta > 0;
                        const deltaColor = grew ? "rgba(52,211,153,0.7)" : "rgba(251,191,36,0.7)";
                        const deltaSign = grew ? "+" : "";
                        const beforeW = f.before * 100;
                        const afterW = f.after * 100;

                        return (
                            <motion.div
                                key={i}
                                className="flex items-center gap-2 px-1 py-0.5 rounded-lg"
                                initial={{ opacity: 0.3 }}
                                animate={{ opacity: showTransform ? 1 : 0.3 }}
                                transition={{ delay: i * 0.06, duration: 0.3 }}
                                style={{
                                    background: showTransform && Math.abs(delta) > 0.3
                                        ? grew ? "rgba(52,211,153,0.04)" : "rgba(251,191,36,0.04)"
                                        : "transparent",
                                }}
                            >
                                {/* Feature name */}
                                <span className="text-[13px] font-medium w-16 shrink-0 text-white/40">
                                    {f.name}
                                </span>

                                {/* Before/After bars */}
                                <div className="flex-1 space-y-0.5">
                                    {/* Before bar */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-white/20 w-7 shrink-0">pre</span>
                                        <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${beforeW}%`,
                                                    background: "rgba(148,163,184,0.35)",
                                                }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono text-white/20 w-7 text-right tabular-nums shrink-0">
                                            {f.before.toFixed(2)}
                                        </span>
                                    </div>
                                    {/* After bar */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] w-7 shrink-0" style={{ color: showTransform ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.15)" }}>
                                            post
                                        </span>
                                        <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                animate={{ width: showTransform ? `${afterW}%` : `${beforeW}%` }}
                                                transition={{ type: "spring", stiffness: 80, damping: 14, delay: i * 0.06 }}
                                                style={{
                                                    background: showTransform
                                                        ? "linear-gradient(90deg, rgba(34,211,238,0.3), rgba(34,211,238,0.65))"
                                                        : "rgba(148,163,184,0.35)",
                                                }}
                                            />
                                        </div>
                                        <motion.span
                                            className="text-[10px] font-mono w-7 text-right tabular-nums shrink-0"
                                            animate={{
                                                color: showTransform ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.2)",
                                            }}
                                        >
                                            {showTransform ? f.after.toFixed(2) : f.before.toFixed(2)}
                                        </motion.span>
                                    </div>
                                </div>

                                {/* Delta */}
                                <AnimatePresence>
                                    {showTransform && (
                                        <motion.span
                                            className="text-[12px] font-mono font-semibold w-14 text-right tabular-nums shrink-0"
                                            style={{ color: deltaColor }}
                                            initial={{ opacity: 0, x: 5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
                                        >
                                            {deltaSign}{delta.toFixed(2)} {grew ? "↑" : "↓"}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Caption + Replay ── */}
            <div className="text-center space-y-2 pt-1">
                <AnimatePresence mode="wait">
                    {phase === "done" ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-2"
                        >
                            <p className="text-[13px] text-white/35 max-w-md mx-auto leading-relaxed">
                                The spotlight pattern isn&apos;t the answer — it&apos;s the <em className="text-cyan-400/50">recipe</em>.
                                What comes out is a brand new version of &ldquo;{WORD}&rdquo; — reshaped by its context.
                            </p>
                            <button
                                onClick={replay}
                                className="text-[12px] text-cyan-400/25 hover:text-cyan-400/45 transition-colors cursor-pointer"
                            >
                                ↻ Replay
                            </button>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="progress"
                            className="text-[13px] text-white/20 italic"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {phase === "recipe" ? "Building the recipe..." : "Applying to embedding..."}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
