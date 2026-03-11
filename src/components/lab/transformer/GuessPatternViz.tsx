"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  GuessPatternViz — V10 ⭐⭐ (v2 — text-first, ghost arcs)
  Interactive challenge: 3 sentences. For each, a target word is highlighted.
  Learner picks 3 words they think the target attends to most.
  Clicking a word draws a ghost arc from target → word.
  Reveal shows glow on correct/missed/wrong with arcs. No pill boxes.
*/

interface Challenge {
    words: string[];
    targetIdx: number;
    top3: number[];
    top3Labels: string[];
}

const CHALLENGES: Challenge[] = [
    {
        words: ["The", "doctor", "said", "the", "patient", "needed", "immediate", "surgery"],
        targetIdx: 1,
        top3: [4, 7, 2],
        top3Labels: ["patient", "surgery", "said"],
    },
    {
        words: ["She", "picked", "up", "the", "heavy", "book", "from", "the", "dusty", "shelf"],
        targetIdx: 5,
        top3: [4, 8, 9],
        top3Labels: ["heavy", "dusty", "shelf"],
    },
    {
        words: ["The", "storm", "that", "destroyed", "the", "old", "bridge", "lasted", "three", "days"],
        targetIdx: 1,
        top3: [3, 6, 7],
        top3Labels: ["destroyed", "bridge", "lasted"],
    },
];

/* ─── Arc path ─── */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.35, 65);
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - curvature;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

type Phase = "guess" | "reveal";

export function GuessPatternViz() {
    const [step, setStep] = useState(0);
    const [phase, setPhase] = useState<Phase>("guess");
    const [guesses, setGuesses] = useState<number[]>([]);
    const [scores, setScores] = useState<number[]>([]);
    const [allDone, setAllDone] = useState(false);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

    const challenge = CHALLENGES[step];
    const totalScore = scores.reduce((a, b) => a + b, 0);

    /* Measure word positions for arcs */
    const measure = useCallback(() => {
        if (!containerRef.current) return;
        const cRect = containerRef.current.getBoundingClientRect();
        setPositions(
            wordRefs.current.map((el) => {
                if (!el) return { x: 0, y: 0 };
                const r = el.getBoundingClientRect();
                return { x: r.left + r.width / 2 - cRect.left, y: r.top + r.height / 2 - cRect.top };
            })
        );
    }, []);

    useEffect(() => {
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    /* Re-measure when step changes */
    useEffect(() => {
        requestAnimationFrame(measure);
    }, [step, measure]);

    const toggleGuess = (idx: number) => {
        if (phase !== "guess") return;
        if (idx === challenge.targetIdx) return;
        setGuesses((prev) => {
            if (prev.includes(idx)) return prev.filter((g) => g !== idx);
            if (prev.length >= 3) return prev;
            return [...prev, idx];
        });
        requestAnimationFrame(measure);
    };

    const reveal = () => {
        const correct = guesses.filter((g) => challenge.top3.includes(g)).length;
        setScores((prev) => [...prev, correct]);
        setPhase("reveal");
    };

    const next = () => {
        if (step >= CHALLENGES.length - 1) {
            setAllDone(true);
            return;
        }
        setStep((s) => s + 1);
        setPhase("guess");
        setGuesses([]);
    };

    /* ─── Final score screen ─── */
    if (allDone) {
        const maxScore = CHALLENGES.length * 3;
        const pct = Math.round((totalScore / maxScore) * 100);
        return (
            <div className="py-8 px-4 text-center space-y-4" style={{ minHeight: 380 }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="space-y-3"
                >
                    <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                        {totalScore}/{maxScore}
                    </p>
                    <p className="text-sm text-white/50">
                        {pct >= 80
                            ? "Incredible! Your linguistic intuition IS the attention mechanism."
                            : pct >= 50
                                ? "Great job! You naturally sense the patterns that attention captures."
                                : "Attention patterns can be surprising — but you're learning to see them!"
                        }
                    </p>
                    {pct >= 70 && (
                        <motion.p
                            className="text-xs text-cyan-400/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            ✨ Your brain already computes attention — you just didn&apos;t know its name.
                        </motion.p>
                    )}
                </motion.div>

                <motion.button
                    onClick={() => {
                        setStep(0);
                        setPhase("guess");
                        setGuesses([]);
                        setScores([]);
                        setAllDone(false);
                    }}
                    className="text-xs text-white/25 hover:text-white/45 transition-colors mt-4 cursor-pointer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    Try again
                </motion.button>
            </div>
        );
    }

    const correctGuesses = phase === "reveal" ? guesses.filter((g) => challenge.top3.includes(g)) : [];
    const wrongGuesses = phase === "reveal" ? guesses.filter((g) => !challenge.top3.includes(g)) : [];
    const missedCorrect = phase === "reveal" ? challenge.top3.filter((t) => !guesses.includes(t)) : [];
    const targetPos = positions[challenge.targetIdx];

    /* Which indices should have arcs */
    const arcIndices: { idx: number; color: string; dashed: boolean }[] = [];
    if (phase === "guess") {
        guesses.forEach((g) => arcIndices.push({ idx: g, color: "34, 211, 238", dashed: false }));
    } else {
        correctGuesses.forEach((g) => arcIndices.push({ idx: g, color: "52, 211, 153", dashed: false }));
        missedCorrect.forEach((g) => arcIndices.push({ idx: g, color: "251, 191, 36", dashed: true }));
        wrongGuesses.forEach((g) => arcIndices.push({ idx: g, color: "244, 63, 94", dashed: true }));
    }

    return (
        <div className="py-6 sm:py-8 px-2 sm:px-4 space-y-4" style={{ minHeight: 380 }}>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3">
                {CHALLENGES.map((_, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${i === step
                                    ? "border border-cyan-400/50 text-cyan-300"
                                    : i < step
                                        ? "text-cyan-400/50"
                                        : "text-white/15"
                                }`}
                        >
                            {i < step ? (
                                <span className="text-[10px]">{scores[i]}/3</span>
                            ) : (
                                i + 1
                            )}
                        </div>
                        {i < CHALLENGES.length - 1 && (
                            <div className={`w-5 h-px ${i < step ? "bg-cyan-400/15" : "bg-white/5"}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Instruction */}
            <p className="text-[13px] sm:text-sm text-center text-white/35">
                {phase === "guess" ? (
                    <>
                        Which 3 words does{" "}
                        <span className="text-cyan-300/80 font-semibold">
                            &quot;{challenge.words[challenge.targetIdx]}&quot;
                        </span>{" "}
                        pay the most attention to?
                        {guesses.length < 3 && (
                            <span className="text-white/20"> ({guesses.length}/3)</span>
                        )}
                    </>
                ) : (
                    <span className="text-cyan-300/60 font-medium">
                        {scores[scores.length - 1]}/3 correct
                    </span>
                )}
            </p>

            {/* ═══ Sentence + arcs ═══ */}
            <div ref={containerRef} className="relative">
                {/* Ghost arcs SVG layer */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible", zIndex: 1 }}
                >
                    <defs>
                        <filter id="guess-arc-glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>
                    <AnimatePresence>
                        {targetPos && positions.length === challenge.words.length &&
                            arcIndices.map(({ idx, color, dashed }) => {
                                const to = positions[idx];
                                if (!to) return null;
                                const path = arcPath(targetPos, to);
                                return (
                                    <motion.path
                                        key={`arc-${step}-${idx}-${phase}`}
                                        d={path}
                                        fill="none"
                                        stroke={`rgba(${color}, 0.4)`}
                                        strokeWidth={1.2}
                                        strokeLinecap="round"
                                        strokeDasharray={dashed ? "4 3" : "none"}
                                        filter="url(#guess-arc-glow)"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                        transition={{
                                            pathLength: { duration: 0.5, ease: "easeOut" },
                                            opacity: { duration: 0.3 },
                                        }}
                                    />
                                );
                            })
                        }
                    </AnimatePresence>
                </svg>

                {/* Words as inline text */}
                <div className="flex items-baseline gap-x-[0.35em] sm:gap-x-[0.45em] flex-wrap justify-center relative z-10 py-8 sm:py-12 leading-[2.4] sm:leading-[2.6]">
                    {challenge.words.map((word, i) => {
                        const isTarget = i === challenge.targetIdx;
                        const isGuessed = guesses.includes(i);
                        const isCorrect = phase === "reveal" && correctGuesses.includes(i);
                        const isWrong = phase === "reveal" && wrongGuesses.includes(i);
                        const isMissed = phase === "reveal" && missedCorrect.includes(i);
                        const isClickable = !isTarget && phase === "guess" && (isGuessed || guesses.length < 3);

                        /* Color states */
                        let color: string;
                        let textShadow = "none";

                        if (isTarget) {
                            color = "#67e8f9";
                            textShadow = "0 0 18px rgba(34, 211, 238, 0.4), 0 0 36px rgba(34, 211, 238, 0.15)";
                        } else if (isCorrect) {
                            color = "#6ee7b7";
                            textShadow = "0 0 16px rgba(52, 211, 153, 0.4), 0 0 32px rgba(52, 211, 153, 0.15)";
                        } else if (isWrong) {
                            color = "rgba(244, 63, 94, 0.5)";
                        } else if (isMissed) {
                            color = "rgba(251, 191, 36, 0.6)";
                            textShadow = "0 0 12px rgba(251, 191, 36, 0.25)";
                        } else if (isGuessed) {
                            color = "#a5f3fc";
                            textShadow = "0 0 12px rgba(34, 211, 238, 0.25)";
                        } else if (phase === "reveal") {
                            color = "rgba(255, 255, 255, 0.2)";
                        } else {
                            color = "rgba(255, 255, 255, 0.45)";
                        }

                        return (
                            <motion.span
                                key={`${step}-${i}`}
                                ref={(el) => { wordRefs.current[i] = el; }}
                                className={`relative font-medium tracking-[-0.01em] select-none ${isClickable ? "cursor-pointer" : phase === "guess" && !isTarget ? "cursor-pointer" : ""
                                    }`}
                                style={{
                                    fontSize: "clamp(1rem, 2.1vw, 1.3rem)",
                                    color,
                                    textShadow,
                                    transition: "color 0.3s ease, text-shadow 0.35s ease",
                                }}
                                onClick={() => toggleGuess(i)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03, duration: 0.25 }}
                                whileHover={isClickable ? { scale: 1.06 } : undefined}
                                whileTap={isClickable ? { scale: 0.96 } : undefined}
                            >
                                {/* Glow halo behind correct/guessed words */}
                                {(isCorrect || (isGuessed && phase === "guess")) && (
                                    <motion.span
                                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                        style={{
                                            background: isCorrect
                                                ? "radial-gradient(ellipse at center, rgba(52, 211, 153, 0.12) 0%, transparent 70%)"
                                                : "radial-gradient(ellipse at center, rgba(34, 211, 238, 0.1) 0%, transparent 70%)",
                                            filter: "blur(5px)",
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                {/* Missed glow */}
                                {isMissed && (
                                    <span
                                        className="absolute inset-0 -inset-x-2 -inset-y-1 rounded-full pointer-events-none"
                                        style={{
                                            background: "radial-gradient(ellipse at center, rgba(251, 191, 36, 0.1) 0%, transparent 70%)",
                                            filter: "blur(5px)",
                                        }}
                                    />
                                )}

                                {/* Target underline */}
                                {isTarget && (
                                    <motion.span
                                        className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full pointer-events-none"
                                        style={{
                                            background: "linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent)",
                                        }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}

                                <span className="relative z-10">{word}</span>
                            </motion.span>
                        );
                    })}
                </div>
            </div>

            {/* Reveal legend */}
            <AnimatePresence>
                {phase === "reveal" && (
                    <motion.div
                        className="flex items-center justify-center gap-4 text-[11px] text-white/25"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(52, 211, 153, 0.6)" }} /> Correct
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(244, 63, 94, 0.5)" }} /> Wrong
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(251, 191, 36, 0.5)" }} /> Missed
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action button */}
            <div className="flex justify-center">
                {phase === "guess" ? (
                    <motion.button
                        onClick={reveal}
                        disabled={guesses.length < 3}
                        className="px-5 py-2 rounded-xl text-[13px] sm:text-sm font-medium text-cyan-200/70
                            disabled:opacity-15 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                        style={{
                            background: "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(34,211,238,0.02))",
                            border: "1px solid rgba(34,211,238,0.15)",
                        }}
                        whileHover={guesses.length >= 3 ? { scale: 1.04 } : undefined}
                    >
                        Reveal {guesses.length < 3 && `(${guesses.length}/3)`}
                    </motion.button>
                ) : (
                    <motion.button
                        onClick={next}
                        className="px-5 py-2 rounded-xl text-[13px] sm:text-sm font-medium text-cyan-200/70 transition-all duration-200 cursor-pointer"
                        style={{
                            background: "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(34,211,238,0.02))",
                            border: "1px solid rgba(34,211,238,0.15)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.04 }}
                    >
                        {step >= CHALLENGES.length - 1 ? "See final score" : "Next sentence →"}
                    </motion.button>
                )}
            </div>
        </div>
    );
}
