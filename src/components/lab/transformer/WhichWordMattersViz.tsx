"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  WhichWordMattersViz — 3-round interactive game
  "Which word matters most for understanding X?"
  Discovers: multiple answers are always valid → need for multi-head attention.
  Colors: cyan-400 (#22d3ee) + amber-400 (#fbbf24) + emerald-400 (#34d399).
*/

interface Choice {
    word: string;
    feedback: string;
    counter: string;
}

interface Round {
    sentence: string;
    target: string;
    targetIdx: number;
    question: string;
    choices: Choice[];
}

const ROUNDS: Round[] = [
    {
        sentence: "The small dog that chased the cat under the old wooden table barked loudly.",
        target: "dog",
        targetIdx: 2,
        question: "Which word matters most for understanding \"dog\"?",
        choices: [
            {
                word: "small",
                feedback: "Good — \"small\" tells us the dog's size. It's a description.",
                counter: "But what about \"chased\"? That tells us what the dog did — its action.",
            },
            {
                word: "chased",
                feedback: "Good — \"chased\" tells us the dog's action. It's a verb.",
                counter: "But what about \"barked\"? That's also something the dog did.",
            },
            {
                word: "barked",
                feedback: "Good — \"barked\" is the main verb. The dog barked.",
                counter: "But what about \"small\"? That describes what kind of dog it is.",
            },
            {
                word: "table",
                feedback: "Interesting — \"table\" sets the scene. The dog is under it.",
                counter: "But what about \"chased\"? That tells us the dog's behavior directly.",
            },
        ],
    },
    {
        sentence: "The painting hanging in the museum that Picasso created last summer was sold.",
        target: "painting",
        targetIdx: 1,
        question: "Which word matters most for understanding \"painting\"?",
        choices: [
            {
                word: "museum",
                feedback: "Good — \"museum\" tells us where the painting is. Location matters.",
                counter: "But what about \"Picasso\"? That tells us who created it — its origin.",
            },
            {
                word: "Picasso",
                feedback: "Good — \"Picasso\" tells us the creator. That changes everything about its value.",
                counter: "But what about \"sold\"? That tells us the painting's fate.",
            },
            {
                word: "hanging",
                feedback: "Good — \"hanging\" describes its state — it's displayed, on view.",
                counter: "But what about \"museum\"? That adds crucial context about where it hangs.",
            },
            {
                word: "sold",
                feedback: "Good — \"sold\" tells us what happened to it. A major event.",
                counter: "But what about \"hanging\"? That describes how it exists right now.",
            },
        ],
    },
    {
        sentence: "The astronaut who repaired the broken satellite above the blue planet waved.",
        target: "astronaut",
        targetIdx: 1,
        question: "Which word matters most for understanding \"astronaut\"?",
        choices: [
            {
                word: "repaired",
                feedback: "Good — \"repaired\" is the astronaut's action. It defines what they did.",
                counter: "But what about \"satellite\"? That tells us what they repaired — the object.",
            },
            {
                word: "satellite",
                feedback: "Good — \"satellite\" is the object they worked on. It gives context to their task.",
                counter: "But what about \"waved\"? That's also something the astronaut did.",
            },
            {
                word: "planet",
                feedback: "Good — \"planet\" sets the cosmic scene. They're in orbit.",
                counter: "But what about \"repaired\"? That directly describes the astronaut's action.",
            },
            {
                word: "waved",
                feedback: "Good — \"waved\" is the main verb. That's what the astronaut ultimately does.",
                counter: "But what about \"satellite\"? That gives crucial context to the astronaut's mission.",
            },
        ],
    },
];

const ACCENTS = ["#22d3ee", "#fbbf24", "#34d399"];

export function WhichWordMattersViz() {
    const [round, setRound] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showCounter, setShowCounter] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [roundsCompleted, setRoundsCompleted] = useState(0);

    const current = ROUNDS[round];
    const accent = ACCENTS[round];

    const handleSelect = useCallback((idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        setTimeout(() => setShowCounter(true), 1200);
    }, [selected]);

    const handleNext = useCallback(() => {
        if (round < ROUNDS.length - 1) {
            setRound((r) => r + 1);
            setSelected(null);
            setShowCounter(false);
            setRoundsCompleted((c) => c + 1);
        } else {
            setCompleted(true);
            setRoundsCompleted(3);
        }
    }, [round]);

    const handleRestart = useCallback(() => {
        setRound(0);
        setSelected(null);
        setShowCounter(false);
        setCompleted(false);
        setRoundsCompleted(0);
    }, []);

    const words = current.sentence.split(" ");

    return (
        <div className="py-6 sm:py-8 px-3 sm:px-4 max-w-xl mx-auto">
            {/* Round indicator */}
            <div className="flex items-center justify-center gap-2 mb-5">
                {ROUNDS.map((_, i) => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full transition-all duration-300"
                        style={{
                            background: i < roundsCompleted
                                ? ACCENTS[i]
                                : i === round && !completed
                                    ? `${ACCENTS[i]}80`
                                    : "rgba(255,255,255,0.08)",
                            boxShadow: i === round && !completed ? `0 0 8px ${ACCENTS[i]}30` : "none",
                        }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {!completed ? (
                    <motion.div
                        key={round}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Sentence display */}
                        <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-1 mb-6">
                            {words.map((w, i) => {
                                const isTarget = i === current.targetIdx;
                                const cleanWord = w.replace(/[.,!?]/g, "");
                                const isChoice = current.choices.some((c) => c.word === cleanWord);
                                return (
                                    <span
                                        key={i}
                                        className="text-sm sm:text-base transition-all duration-300"
                                        style={{
                                            color: isTarget
                                                ? accent
                                                : isChoice
                                                    ? "rgba(255,255,255,0.7)"
                                                    : "rgba(255,255,255,0.3)",
                                            fontWeight: isTarget ? 700 : isChoice ? 500 : 400,
                                            textDecoration: isTarget ? "underline" : "none",
                                            textDecorationColor: `${accent}40`,
                                            textUnderlineOffset: "4px",
                                        }}
                                    >
                                        {w}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Question */}
                        <p
                            className="text-center text-sm sm:text-base font-medium mb-5"
                            style={{ color: `${accent}cc` }}
                        >
                            {current.question}
                        </p>

                        {/* Choices */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-5">
                            {current.choices.map((choice, i) => {
                                const isSelected = selected === i;
                                const isOther = selected !== null && !isSelected;
                                return (
                                    <motion.button
                                        key={choice.word}
                                        onClick={() => handleSelect(i)}
                                        disabled={selected !== null}
                                        className="relative px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                                        style={{
                                            background: isSelected
                                                ? `${accent}15`
                                                : "rgba(255,255,255,0.02)",
                                            border: isSelected
                                                ? `1.5px solid ${accent}50`
                                                : "1px solid rgba(255,255,255,0.06)",
                                            color: isSelected
                                                ? accent
                                                : isOther
                                                    ? "rgba(255,255,255,0.2)"
                                                    : "rgba(255,255,255,0.6)",
                                            opacity: isOther ? 0.5 : 1,
                                        }}
                                        whileHover={selected === null ? { scale: 1.02, borderColor: `${accent}30` } : undefined}
                                        whileTap={selected === null ? { scale: 0.98 } : undefined}
                                    >
                                        {choice.word}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Feedback */}
                        <AnimatePresence>
                            {selected !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="space-y-3"
                                >
                                    <div
                                        className="rounded-xl px-4 py-3"
                                        style={{
                                            background: `${accent}08`,
                                            borderLeft: `2px solid ${accent}40`,
                                        }}
                                    >
                                        <p className="text-[13px] leading-relaxed" style={{ color: `${accent}cc` }}>
                                            {current.choices[selected].feedback}
                                        </p>
                                    </div>

                                    {showCounter && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <div
                                                className="rounded-xl px-4 py-3"
                                                style={{
                                                    background: "rgba(251,191,36,0.06)",
                                                    borderLeft: "2px solid rgba(251,191,36,0.3)",
                                                }}
                                            >
                                                <p className="text-[13px] leading-relaxed text-amber-300/80">
                                                    {current.choices[selected].counter}
                                                </p>
                                            </div>

                                            <motion.button
                                                onClick={handleNext}
                                                className="mt-4 mx-auto block px-5 py-2 rounded-full text-xs font-semibold cursor-pointer"
                                                style={{
                                                    background: `${accent}15`,
                                                    border: `1px solid ${accent}30`,
                                                    color: accent,
                                                }}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                {round < ROUNDS.length - 1 ? "Next round →" : "See the pattern →"}
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    /* ── Conclusion ── */
                    <motion.div
                        key="conclusion"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center space-y-4"
                    >
                        <p className="text-lg sm:text-xl font-semibold text-white/80">
                            There was no wrong answer.
                        </p>
                        <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
                            Every round, multiple words were equally valid. Grammar, meaning, location,
                            action &mdash; they all matter <em>at the same time</em>.
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "#22d3ee99" }}>
                            A single attention head produces <em>one</em> set of weights. One ranking.
                            One compromise. It can&apos;t capture all these relationships at once.
                        </p>
                        <button
                            onClick={handleRestart}
                            className="mt-2 px-4 py-1.5 rounded-full text-[11px] font-medium cursor-pointer text-white/25 hover:text-white/40 transition-colors border border-white/6 hover:border-white/12"
                        >
                            Play again
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
