"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

/*
  CombinatorialExplosionViz — NEW-10
  §01, in the MLP critique block (after MLPvsAttentionArchitectureViz).
  
  Split view:
  - Left: MLP must MEMORIZE every word×position×context combination.
    Counter grows rapidly as patterns accumulate.
  - Right: Attention just computes Q·K dynamically. One mechanism, reusable.
  
  The visual contrast is the lesson: exponential memorization vs elegant reuse.
*/

interface Pattern {
    word: string;
    pos: number;
    neighbor: string;
    neighborPos: number;
}

/* Pre-built combinations that auto-accumulate */
const ALL_PATTERNS: Pattern[] = [
    { word: "bank", pos: 3, neighbor: "river", neighborPos: 2 },
    { word: "bank", pos: 3, neighbor: "money", neighborPos: 2 },
    { word: "bank", pos: 3, neighbor: "blood", neighborPos: 4 },
    { word: "bank", pos: 3, neighbor: "fog", neighborPos: 4 },
    { word: "bank", pos: 1, neighbor: "river", neighborPos: 2 },
    { word: "bank", pos: 1, neighbor: "money", neighborPos: 2 },
    { word: "bank", pos: 5, neighbor: "river", neighborPos: 3 },
    { word: "bank", pos: 5, neighbor: "money", neighborPos: 4 },
    { word: "bank", pos: 2, neighbor: "blood", neighborPos: 1 },
    { word: "bank", pos: 2, neighbor: "fog", neighborPos: 3 },
    { word: "bank", pos: 4, neighbor: "river", neighborPos: 1 },
    { word: "bank", pos: 4, neighbor: "money", neighborPos: 5 },
    { word: "bank", pos: 1, neighbor: "blood", neighborPos: 3 },
    { word: "bank", pos: 1, neighbor: "fog", neighborPos: 5 },
    { word: "bank", pos: 5, neighbor: "blood", neighborPos: 2 },
    { word: "bank", pos: 5, neighbor: "money", neighborPos: 1 },
];

function formatPattern(p: Pattern): string {
    return `"${p.word}" at pos ${p.pos} + "${p.neighbor}" at pos ${p.neighborPos}`;
}

export function CombinatorialExplosionViz() {
    const [count, setCount] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    /* Auto-start after mount */
    useEffect(() => {
        const t = setTimeout(() => {
            setIsRunning(true);
            setHasStarted(true);
        }, 600);
        return () => clearTimeout(t);
    }, []);

    /* Accumulate patterns */
    useEffect(() => {
        if (!isRunning || count >= ALL_PATTERNS.length) {
            if (count >= ALL_PATTERNS.length) setIsRunning(false);
            return;
        }
        const delay = count < 4 ? 600 : count < 8 ? 400 : 250;
        const t = setTimeout(() => setCount(c => c + 1), delay);
        return () => clearTimeout(t);
    }, [isRunning, count]);

    const restart = useCallback(() => {
        setCount(0);
        setIsRunning(true);
    }, []);

    const visiblePatterns = ALL_PATTERNS.slice(0, count);
    const isDone = count >= ALL_PATTERNS.length;

    /* Extrapolated total: words × positions × context combinations */
    const vocabSize = 50000;
    const positions = 512;
    const extrapolated = isDone
        ? `${vocabSize.toLocaleString()} × ${positions} × ${positions} = too many to count`
        : null;

    return (
        <div className="py-8 sm:py-10 px-3 sm:px-6 space-y-6">

            {/* Split view */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">

                {/* ── LEFT: MLP must memorize ── */}
                <div
                    className="rounded-xl px-4 py-5 space-y-3 overflow-hidden"
                    style={{ border: "1px solid rgba(251,191,36,0.15)", background: "rgba(251,191,36,0.03)" }}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] uppercase tracking-widest font-bold text-amber-400/50">
                            MLP must memorize
                        </p>
                        <motion.span
                            className="text-[14px] font-mono font-bold tabular-nums text-amber-400/70"
                            key={count}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            {count} patterns
                        </motion.span>
                    </div>

                    {/* Pattern list (scrollable, max height) */}
                    <div
                        className="space-y-0.5 overflow-y-auto pr-1"
                        style={{ maxHeight: 200 }}
                    >
                        <AnimatePresence>
                            {visiblePatterns.map((p, i) => (
                                <motion.div
                                    key={i}
                                    className="text-[12px] font-mono py-0.5 px-2 rounded"
                                    style={{
                                        color: "rgba(251,191,36,0.55)",
                                        background: i === count - 1 ? "rgba(251,191,36,0.08)" : "transparent",
                                    }}
                                    initial={{ opacity: 0, x: -8, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: "auto" }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {formatPattern(p)}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Overflow indicator */}
                    {count >= 8 && (
                        <motion.p
                            className="text-[11px] text-amber-400/30 italic text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            ...and this is just &ldquo;bank&rdquo; with 4 neighbors
                        </motion.p>
                    )}

                    {/* Extrapolation */}
                    <AnimatePresence>
                        {isDone && (
                            <motion.div
                                className="pt-2 space-y-1"
                                style={{ borderTop: "1px solid rgba(251,191,36,0.1)" }}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                            >
                                <p className="text-[12px] text-amber-400/40">
                                    Real vocabulary?
                                </p>
                                <p className="text-[13px] font-mono font-semibold text-amber-400/60">
                                    {extrapolated}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── RIGHT: Attention computes ── */}
                <div
                    className="rounded-xl px-4 py-5 flex flex-col items-center justify-center gap-4"
                    style={{ border: "1px solid rgba(34,211,238,0.15)", background: "rgba(34,211,238,0.03)" }}
                >
                    <p className="text-[11px] uppercase tracking-widest font-bold text-cyan-400/50">
                        Attention computes
                    </p>

                    {/* The formula — clean and elegant */}
                    <div className="text-center space-y-3 py-4">
                        <motion.div
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl"
                            style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.12)" }}
                            animate={{
                                boxShadow: hasStarted
                                    ? ["0 0 0px rgba(34,211,238,0)", "0 0 20px rgba(34,211,238,0.1)", "0 0 0px rgba(34,211,238,0)"]
                                    : "none",
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <span className="text-[16px] font-mono font-bold text-cyan-400/80">
                                bank.Q · river.K
                            </span>
                        </motion.div>

                        <p className="text-[13px] text-white/35 max-w-[200px] mx-auto leading-relaxed">
                            One formula. Any word. Any position. Computed fresh every time.
                        </p>
                    </div>

                    {/* Counter comparison */}
                    <div className="text-center space-y-1">
                        <p className="text-[12px] font-mono text-cyan-400/50">
                            Mechanisms needed:
                        </p>
                        <p className="text-[20px] font-mono font-bold text-cyan-400/70">
                            1
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom insight */}
            <AnimatePresence>
                {isDone && (
                    <motion.div
                        className="text-center space-y-2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <p className="text-[13px] font-semibold text-white/40">
                            Memorization doesn&apos;t scale. Computation does.
                        </p>
                        <p className="text-[13px] text-white/30 max-w-md mx-auto leading-relaxed">
                            MLPs need a separate learned weight for every combination they&apos;ve
                            seen. Attention uses one reusable mechanism —
                            <span className="text-cyan-400/50 font-semibold"> Q·K </span>
                            — that works for any word in any position.
                        </p>
                        <button
                            onClick={restart}
                            className="text-[12px] text-cyan-400/25 hover:text-cyan-400/45 transition-colors cursor-pointer mt-1"
                        >
                            ↻ Replay
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
