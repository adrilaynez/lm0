"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  RNNChainViz v2 — Enhanced visualization of RNN vs MLP processing.
  Features:
  - Mode toggle: RNN | MLP | Compare
  - Explicit RNN cell with two inputs (word + hᵗ⁻¹) → processing → hᵗ
  - Word influence bars showing memory decay over time
  - MLP comparison: parallel independent processing, no memory transfer
*/

const WORDS = ["The", "cat", "sat", "on", "the", "warm", "mat"];
const WORD_COLORS = ["#67e8f9", "#34d399", "#a78bfa", "#fbbf24", "#22d3ee", "#f472b6", "#fb923c"];

/* How much influence each word retains in memory at each step (decay simulation) */
const INFLUENCE_AT_STEP: number[][] = [
    [1, 0, 0, 0, 0, 0, 0],         // step 0: only "The"
    [0.75, 1, 0, 0, 0, 0, 0],      // step 1: "The" fades a bit
    [0.5, 0.8, 1, 0, 0, 0, 0],     // step 2
    [0.3, 0.55, 0.8, 1, 0, 0, 0],  // step 3: "The" getting weak
    [0.18, 0.35, 0.6, 0.82, 1, 0, 0],    // step 4
    [0.1, 0.2, 0.42, 0.65, 0.85, 1, 0],  // step 5: "The" nearly gone
    [0.05, 0.1, 0.25, 0.45, 0.68, 0.88, 1], // step 6: all read
];

const STEP_ANNOTATIONS = [
    "",
    'The RNN reads "The" — its first word. With no prior context, this becomes the initial hidden state h₁.',
    '"cat" enters. The RNN combines its memory of "The" with "cat" to produce h₂ — a compressed summary of both words.',
    '"sat" arrives. h₂ already holds "The cat", so h₃ compresses all three. But "The" is starting to fade.',
    '"on" joins. The hidden state tries to remember everything, but the earliest words lose detail with each step.',
    'Another "the" is processed. By now, the original "The" retains only 18% influence — squeezed by compression.',
    '"warm" enters. The hidden state is one fixed-size vector holding six words — compression is severe.',
    'Final word "mat" completes the sequence. "The" started at 100% — now just 5%. This is the fundamental bottleneck.',
];

type Mode = "rnn" | "mlp";

export function RNNChainViz() {
    const [step, setStep] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<Mode>("rnn");
    const [processingCell, setProcessingCell] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const play = useCallback(() => {
        if (isPlaying) return;
        if (step >= WORDS.length - 1) {
            reset();
            return;
        }
        setProcessingCell(true);
        setTimeout(() => {
            setStep(step + 1);
            setProcessingCell(false);
        }, 500);
    }, [isPlaying, step]);

    const reset = useCallback(() => {
        if (intervalRef.current) clearTimeout(intervalRef.current);
        setIsPlaying(false);
        setStep(-1);
        setProcessingCell(false);
    }, []);


    const isFinished = step >= WORDS.length - 1 && step >= 0;

    return (
        <div className="py-6 px-3 sm:px-5 space-y-5 select-none">

            {/* Mode toggle — editorial tabs */}
            <div className="flex items-center justify-center gap-6">
                {(["rnn", "mlp"] as Mode[]).map((m) => {
                    const isActive = mode === m;
                    return (
                        <motion.button
                            key={m}
                            onClick={() => { reset(); setMode(m); }}
                            className="relative pb-1.5 text-sm font-semibold tracking-wide transition-colors duration-300 cursor-pointer"
                            style={{
                                color: isActive
                                    ? (m === "mlp" ? "rgba(167,139,250,0.85)" : "rgba(103,232,249,0.85)")
                                    : "rgba(255,255,255,0.3)",
                            }}
                        >
                            {m === "rnn" ? "RNN" : "MLP"}
                            {isActive && (
                                <motion.span
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full"
                                    style={{
                                        background: m === "mlp"
                                            ? "linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)"
                                            : "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)",
                                    }}
                                    layoutId="rnn-mode-indicator"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* ── RNN MODE ── */}
            {mode === "rnn" && (
                <div className="space-y-6">
                    <div className="text-center space-y-1.5">
                        <p className="text-[10px] text-cyan-400/50 tracking-widest uppercase font-semibold">Recurrent Neural Network</p>
                        <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                            Each word processed <strong className="text-white/75">one at a time</strong> — the hidden state carries memory forward, compressing all previous words into a single vector
                        </p>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-1.5">
                        {WORDS.map((_, i) => (
                            <div key={i} className="w-6 h-1 rounded-full transition-all duration-500"
                                style={{
                                    background: step >= i ? `${WORD_COLORS[i]}80` : "rgba(255,255,255,0.07)",
                                    boxShadow: step === i ? `0 0 8px ${WORD_COLORS[i]}50` : "none",
                                }} />
                        ))}
                    </div>

                    {/* Word cards */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                        {WORDS.map((word, i) => {
                            const isActive = step === i || (isPlaying && processingCell && step === i - 1 && i === (step + 1));
                            const isPast = step > i;
                            const isNext = isPlaying && processingCell && i === step + 1;
                            const color = WORD_COLORS[i];
                            return (
                                <motion.div key={i}
                                    className="relative flex flex-col items-center gap-1.5"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                >
                                    <motion.div
                                        className="px-3.5 py-2 rounded-xl text-sm font-semibold"
                                        style={{
                                            background: isNext || isActive
                                                ? `linear-gradient(135deg, ${color}20, ${color}08)`
                                                : isPast ? `${color}08` : "rgba(255,255,255,0.04)",
                                            border: isNext || isActive ? `1px solid ${color}50` : isPast ? `1px solid ${color}18` : "1px solid rgba(255,255,255,0.06)",
                                            color: isNext || isActive ? color : isPast ? `${color}aa` : "rgba(255,255,255,0.4)",
                                            boxShadow: isNext || isActive ? `0 0 16px -4px ${color}30` : "none",
                                        }}
                                        animate={isNext ? { scale: [1, 1.08, 1.04] } : isActive ? { scale: 1.04 } : { scale: 1 }}
                                        transition={{ duration: 0.35 }}
                                    >
                                        {word}
                                    </motion.div>

                                    {/* Arrow down to cell */}
                                    <AnimatePresence>
                                        {(isNext || isActive) && (
                                            <motion.div
                                                initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                                                animate={{ opacity: 1, scaleY: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="w-px h-4" style={{ background: `linear-gradient(to bottom, ${color}50, ${color}15)` }} />
                                                <svg className="w-2.5 h-2" viewBox="0 0 10 8" fill="none">
                                                    <path d="M1 1l4 5 4-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <span className="text-[10px] font-mono mt-0.5" style={{ color: `${color}60` }}>word{i + 1}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* RNN cell + hidden states pipeline — wraps instead of scrolling */}
                    <div className="flex flex-wrap items-center justify-center gap-y-3 py-3 px-1">
                        {WORDS.map((_, i) => {
                            const isCurrent = isPlaying && processingCell && i === step + 1;
                            const isStep = step === i;
                            const isPast = step > i;
                            const show = step >= i || isCurrent;
                            const color = WORD_COLORS[i];
                            const subscripts = ["₁", "₂", "₃", "₄", "₅", "₆", "₇"];

                            return (
                                <div key={i} className="flex items-center">
                                    {/* Connector line */}
                                    {i > 0 && (
                                        <div className="w-3 h-px"
                                            style={{
                                                background: show
                                                    ? `linear-gradient(90deg, ${color}${isPast ? "40" : "60"}, ${color}20)`
                                                    : "rgba(255,255,255,0.05)",
                                            }}
                                        />
                                    )}

                                    {/* RNN Cell box with inputs */}
                                    {show && (
                                        <div className="flex flex-col items-center gap-1">
                                            {/* Input labels */}
                                            <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                                <span style={{ color: `${color}70` }}>
                                                    {i === 0 ? "∅" : `h${subscripts[i - 1]}`}
                                                </span>
                                                <span style={{ color: `${color}40` }}>+</span>
                                                <span style={{ color: `${color}70` }}>word{i + 1}</span>
                                            </div>

                                            {/* RNN Cell */}
                                            <motion.div
                                                className="relative flex flex-col items-center justify-center rounded-xl"
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    background: isCurrent
                                                        ? `linear-gradient(135deg, ${color}18, ${color}08)`
                                                        : isStep
                                                            ? `linear-gradient(135deg, ${color}12, ${color}05)`
                                                            : isPast
                                                                ? "rgba(34,211,238,0.03)"
                                                                : "rgba(255,255,255,0.025)",
                                                    border: isCurrent
                                                        ? `1.5px solid ${color}55`
                                                        : isStep
                                                            ? `1px solid ${color}35`
                                                            : isPast
                                                                ? "1px solid rgba(34,211,238,0.1)"
                                                                : "1px solid rgba(255,255,255,0.05)",
                                                    boxShadow: isCurrent
                                                        ? `0 0 16px -4px ${color}35`
                                                        : isStep ? `0 0 10px -4px ${color}20` : "none",
                                                    color: isCurrent ? color : isStep ? color : isPast ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.18)",
                                                }}
                                                animate={isCurrent ? { scale: [1, 1.08, 1.04] } : { scale: isStep ? 1.02 : 1 }}
                                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                            >
                                                {isCurrent && (
                                                    <motion.div
                                                        className="absolute inset-0 rounded-xl"
                                                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                                                        transition={{ duration: 0.4, repeat: Infinity }}
                                                        style={{ background: `radial-gradient(circle, ${color}18, transparent)` }}
                                                    />
                                                )}
                                                <span className="font-bold text-xs font-mono">f</span>
                                                <span className="text-[9px] opacity-50 font-mono">RNN</span>
                                            </motion.div>
                                        </div>
                                    )}

                                    {/* Connector to h */}
                                    <div className="w-2 h-px"
                                        style={{ background: show ? `${color}${isCurrent ? "60" : isPast ? "35" : "50"}` : "rgba(255,255,255,0.03)" }}
                                    />

                                    {/* hᵢ output */}
                                    <AnimatePresence>
                                        {show && (
                                            <motion.div
                                                className="flex items-center justify-center rounded-lg font-mono text-sm"
                                                style={{
                                                    width: 34,
                                                    height: 34,
                                                    background: isStep
                                                        ? `${color}12`
                                                        : isPast ? "rgba(34,211,238,0.03)" : "rgba(255,255,255,0.025)",
                                                    border: isStep
                                                        ? `1px solid ${color}40`
                                                        : isPast ? "1px solid rgba(34,211,238,0.08)" : "1px solid rgba(255,255,255,0.05)",
                                                    color: isStep ? color : isPast ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.2)",
                                                    boxShadow: isStep ? `0 0 10px -3px ${color}25` : "none",
                                                }}
                                                initial={{ opacity: 0, scale: 0.7 }}
                                                animate={{ opacity: 1, scale: isStep ? 1.04 : 1 }}
                                                transition={{ type: "spring", stiffness: 250, damping: 18 }}
                                            >
                                                h{subscripts[i]}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* Step annotation — explanatory, below pipeline */}
                    <AnimatePresence mode="wait">
                        {step >= 0 && (
                            <motion.div
                                key={step}
                                className="max-w-lg mx-auto text-center"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p className="text-[13px] sm:text-sm text-white/45 leading-relaxed">
                                    {STEP_ANNOTATIONS[step + 1] || ""}
                                </p>
                                {step >= 0 && INFLUENCE_AT_STEP[step] && (
                                    <p className="text-[11px] text-white/20 mt-1.5">
                                        Memory of &ldquo;The&rdquo;: <span className="font-mono text-cyan-300/40">{Math.round(INFLUENCE_AT_STEP[step][0] * 100)}%</span>
                                        {step >= 2 && <> · &ldquo;cat&rdquo;: <span className="font-mono text-emerald-300/40">{Math.round(INFLUENCE_AT_STEP[step][1] * 100)}%</span></>}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="flex justify-center gap-3 pt-1">
                        <motion.button
                            onClick={play}
                            disabled={processingCell}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] sm:text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            style={{
                                background: "rgba(34,211,238,0.06)",
                                border: "1px solid rgba(34,211,238,0.2)",
                                color: "rgba(165,243,252,0.8)",
                            }}
                            whileHover={!processingCell ? { scale: 1.03, boxShadow: "0 0 16px -4px rgba(34,211,238,0.15)" } : undefined}
                            whileTap={!processingCell ? { scale: 0.97 } : undefined}
                        >
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 2l10 6-10 6V2z" />
                            </svg>
                            {isFinished ? "Replay" : step < 0 ? "Start" : "Next Step"}
                        </motion.button>
                        {step >= 0 && (
                            <motion.button
                                onClick={reset}
                                className="px-3 py-2 rounded-xl text-xs font-medium text-white/20 hover:text-white/40 transition-all cursor-pointer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                Reset
                            </motion.button>
                        )}
                    </div>

                    {/* Finished insight */}
                    <AnimatePresence>
                        {isFinished && (
                            <motion.div
                                className="text-center max-w-md mx-auto space-y-2 pt-2"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <p className="text-[13px] sm:text-sm text-amber-300/55 leading-relaxed">
                                    <strong className="text-amber-300/75">&ldquo;The&rdquo;</strong> started at 100% influence — it ends at just 5%.
                                    Seven words of context, all compressed into one fixed-size vector.
                                </p>
                                <p className="text-[11px] text-white/20 leading-relaxed">
                                    This is the fundamental bottleneck: the RNN must pass <em>everything</em> through a single hidden state.
                                    Early words inevitably get forgotten.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── MLP MODE ── */}
            {mode === "mlp" && (
                <div className="space-y-6">
                    <div className="text-center space-y-1.5">
                        <p className="text-[10px] text-violet-400/50 tracking-widest uppercase font-semibold">Multi-Layer Perceptron</p>
                        <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                            All words processed <strong className="text-white/75">simultaneously</strong> — but each position is completely <strong className="text-rose-300/70">independent</strong>. No information flows between words.
                        </p>
                    </div>

                    {/* Word cards with independent MLP boxes below */}
                    <div className="flex items-start justify-center gap-2.5 sm:gap-3.5 flex-wrap py-3">
                        {WORDS.map((word, i) => {
                            const color = WORD_COLORS[i];
                            return (
                                <motion.div
                                    key={i}
                                    className="flex flex-col items-center gap-2"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.35 }}
                                >
                                    {/* Word card */}
                                    <div className="px-3.5 py-2 rounded-xl text-sm font-semibold"
                                        style={{
                                            background: `${color}10`,
                                            border: `1px solid ${color}30`,
                                            color: color,
                                        }}>
                                        {word}
                                    </div>

                                    {/* Down arrow */}
                                    <div className="w-px h-4" style={{ background: `linear-gradient(to bottom, ${color}50, ${color}15)` }} />
                                    <svg className="w-2.5 h-2" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 1l4 5 4-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>

                                    {/* Individual MLP box */}
                                    <div className="flex flex-col items-center justify-center rounded-xl"
                                        style={{
                                            width: 44,
                                            height: 44,
                                            background: `linear-gradient(135deg, ${color}0c, ${color}04)`,
                                            border: `1px solid ${color}22`,
                                            color: `${color}80`,
                                        }}>
                                        <span className="font-bold text-[10px] font-mono">f</span>
                                        <span className="text-[8px] opacity-50 font-mono">MLP</span>
                                    </div>

                                    {/* Down arrow */}
                                    <div className="w-px h-4" style={{ background: `linear-gradient(to bottom, ${color}40, ${color}10)` }} />

                                    {/* Output vector */}
                                    <div className="px-2 py-1 rounded-lg text-[10px] font-mono"
                                        style={{
                                            background: `${color}08`,
                                            border: `1px solid ${color}18`,
                                            color: `${color}60`,
                                        }}>
                                        y{["₁", "₂", "₃", "₄", "₅", "₆", "₇"][i]}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Insight — no connections */}
                    <motion.div
                        className="text-center max-w-md mx-auto space-y-2 pt-1"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <p className="text-[13px] sm:text-sm text-rose-300/55 leading-relaxed">
                            <strong className="text-rose-300/75">No memory transfer between positions.</strong> Each word is processed in complete isolation — the model never sees relationships between words.
                        </p>
                        <p className="text-[11px] text-white/20 leading-relaxed">
                            &ldquo;The&rdquo; and &ldquo;mat&rdquo; go through completely separate pipelines.
                            The MLP has no mechanism to know they belong to the same sentence.
                        </p>
                    </motion.div>
                </div>
            )}

        </div>
    );
}
