"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

/*
  SequentialVsParallelViz — V07
  Two progress bars racing. LEFT "Sequential (RNN)": fills slowly, token by token.
  RIGHT "Parallel (???)": fills ALL AT ONCE, instantly. "Race" button.
  After race: reveal text. "???" pulses in cyan.
*/

const TOKEN_COUNT = 12;

type Phase = "idle" | "racing" | "done";

export function SequentialVsParallelViz() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [seqProgress, setSeqProgress] = useState(0);
    const [parProgress, setParProgress] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startRace = useCallback(() => {
        if (phase === "racing") return;
        setSeqProgress(0);
        setParProgress(0);
        setPhase("racing");
    }, [phase]);

    const reset = useCallback(() => {
        if (intervalRef.current) clearTimeout(intervalRef.current);
        setSeqProgress(0);
        setParProgress(0);
        setPhase("idle");
    }, []);

    useEffect(() => {
        if (phase !== "racing") return;

        /* Parallel fills instantly after a tiny dramatic delay */
        const parTimer = setTimeout(() => setParProgress(TOKEN_COUNT), 400);

        /* Sequential fills one by one */
        let step = 0;
        const tick = () => {
            step++;
            setSeqProgress(step);
            if (step >= TOKEN_COUNT) {
                setPhase("done");
                return;
            }
            intervalRef.current = setTimeout(tick, 220);
        };
        intervalRef.current = setTimeout(tick, 400);

        return () => {
            clearTimeout(parTimer);
            if (intervalRef.current) clearTimeout(intervalRef.current);
        };
    }, [phase]);

    const seqPct = (seqProgress / TOKEN_COUNT) * 100;
    const parPct = (parProgress / TOKEN_COUNT) * 100;

    return (
        <div className="py-6 px-3 sm:px-6 space-y-6">
            {/* Two tracks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Sequential (RNN) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white/60">Sequential</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/30">(RNN)</span>
                    </div>
                    <div className="relative h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-lg"
                            style={{
                                background: "linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
                            }}
                            animate={{ width: `${seqPct}%` }}
                            transition={{ duration: 0.15 }}
                        />
                        {/* Token markers */}
                        <div className="absolute inset-0 flex items-center px-1">
                            {Array.from({ length: TOKEN_COUNT }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="flex-1 flex items-center justify-center"
                                    animate={{
                                        opacity: i < seqProgress ? 1 : 0.15,
                                    }}
                                    transition={{ duration: 0.1 }}
                                >
                                    <div
                                        className="w-1.5 h-1.5 rounded-full transition-colors duration-150"
                                        style={{
                                            background: i < seqProgress ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/30">
                        <span>Token 1</span>
                        <span className="font-mono">{seqProgress}/{TOKEN_COUNT}</span>
                        <span>Token {TOKEN_COUNT}</span>
                    </div>
                </div>

                {/* Parallel (???) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white/60">Parallel</span>
                        <motion.span
                            className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-400/30 text-cyan-300/70 font-bold"
                            style={{ background: "rgba(34,211,238,0.06)" }}
                            animate={phase === "idle" ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
                            transition={phase === "idle" ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                        >
                            (???)
                        </motion.span>
                    </div>
                    <div className="relative h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-lg"
                            style={{
                                background: "linear-gradient(90deg, rgba(34,211,238,0.2), rgba(52,211,153,0.15))",
                            }}
                            animate={{ width: `${parPct}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                        {/* Token markers — all at once */}
                        <div className="absolute inset-0 flex items-center px-1">
                            {Array.from({ length: TOKEN_COUNT }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="flex-1 flex items-center justify-center"
                                    animate={{
                                        opacity: i < parProgress ? 1 : 0.15,
                                    }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div
                                        className="w-1.5 h-1.5 rounded-full transition-colors duration-150"
                                        style={{
                                            background: i < parProgress ? "#22d3ee" : "rgba(255,255,255,0.15)",
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/30">
                        <span>Token 1</span>
                        <span className="font-mono" style={{ color: parProgress >= TOKEN_COUNT ? "#22d3ee" : undefined }}>
                            {parProgress}/{TOKEN_COUNT}
                        </span>
                        <span>Token {TOKEN_COUNT}</span>
                    </div>
                </div>
            </div>

            {/* Race button */}
            <div className="flex justify-center">
                {phase === "done" ? (
                    <motion.button
                        onClick={reset}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium
                            border border-white/[0.08] text-white/30 hover:text-white/50 hover:border-white/15 transition-all"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        Race again
                    </motion.button>
                ) : (
                    <motion.button
                        onClick={startRace}
                        disabled={phase === "racing"}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold
                            border border-cyan-400/40 text-cyan-200
                            hover:border-cyan-400/60 hover:shadow-[0_0_24px_-4px_rgba(34,211,238,0.2)]
                            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                        style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(34,211,238,0.03))" }}
                        whileHover={phase !== "racing" ? { scale: 1.05 } : undefined}
                        whileTap={phase !== "racing" ? { scale: 0.95 } : undefined}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 2l10 6-10 6V2z" />
                        </svg>
                        {phase === "racing" ? "Racing..." : "Start the race"}
                    </motion.button>
                )}
            </div>

            {/* Result text */}
            <AnimatePresence>
                {phase === "done" && (
                    <motion.p
                        className="text-xs sm:text-sm text-center max-w-md mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    >
                        <span className="text-white/40">The parallel approach processes </span>
                        <strong className="text-cyan-300">all tokens simultaneously</strong>
                        <span className="text-white/40">. What architecture does that? </span>
                        <span className="text-cyan-400/70">You&apos;re about to find out.</span>
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
