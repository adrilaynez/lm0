"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  ConceptRecallViz — §10

  Interactive 6-question quiz validating the reader's understanding
  of the Transformer architecture. Multiple choice, one question at
  a time, with score tracking and celebration at the end.

  Framed as "let's see how much stuck" — not a stressful exam.
  Premium glass styling, calm pace, celebratory tone.
*/

/* ── Question data ── */
interface Question {
    component: string;
    section: string;
    correct: string;
    options: string[];
}

const QUESTIONS: Question[] = [
    {
        component: "Token Embedding",
        section: "§03",
        correct: "Converts each token into a learnable vector",
        options: [
            "Converts each token into a learnable vector",
            "Prevents the model from seeing future tokens",
            "Normalizes the output of each layer",
        ],
    },
    {
        component: "Positional Encoding",
        section: "§06",
        correct: "Tells the model where each token sits in the sequence",
        options: [
            "Compresses the sequence into a fixed-size vector",
            "Tells the model where each token sits in the sequence",
            "Splits the input into multiple parallel streams",
        ],
    },
    {
        component: "Multi-Head Attention",
        section: "§04",
        correct: "Lets every token examine every other token for patterns",
        options: [
            "Lets every token examine every other token for patterns",
            "Maps each token to a probability distribution",
            "Adds position information to the embeddings",
        ],
    },
    {
        component: "Feed-Forward Network",
        section: "§07",
        correct: "Processes each position independently to extract features",
        options: [
            "Compares every pair of tokens in the sequence",
            "Creates shortcuts for gradient flow",
            "Processes each position independently to extract features",
        ],
    },
    {
        component: "Residual Connection",
        section: "§07",
        correct: "Creates shortcuts so information flows through deep networks",
        options: [
            "Generates the final probability distribution",
            "Creates shortcuts so information flows through deep networks",
            "Splits attention into multiple parallel heads",
        ],
    },
    {
        component: "Causal Mask",
        section: "§08",
        correct: "Prevents the model from seeing future tokens",
        options: [
            "Converts raw scores into probabilities",
            "Adds the input back to the output of each layer",
            "Prevents the model from seeing future tokens",
        ],
    },
];

/* ── Single option pill ── */
function OptionPill({ text, state, onClick }: {
    text: string;
    state: "idle" | "correct" | "wrong" | "revealed";
    onClick: () => void;
}) {
    const isClickable = state === "idle";

    const bg = state === "correct"
        ? "rgba(34,211,238,0.1)"
        : state === "wrong"
            ? "rgba(244,63,94,0.08)"
            : state === "revealed"
                ? "rgba(34,211,238,0.06)"
                : "rgba(255,255,255,0.02)";

    const border = state === "correct"
        ? "1.5px solid rgba(34,211,238,0.3)"
        : state === "wrong"
            ? "1.5px solid rgba(244,63,94,0.2)"
            : state === "revealed"
                ? "1.5px solid rgba(34,211,238,0.15)"
                : "1.5px solid rgba(255,255,255,0.06)";

    const color = state === "correct"
        ? "rgba(34,211,238,0.8)"
        : state === "wrong"
            ? "rgba(244,63,94,0.5)"
            : state === "revealed"
                ? "rgba(34,211,238,0.5)"
                : "rgba(255,255,255,0.35)";

    return (
        <motion.button
            className={`w-full text-left px-4 py-3 rounded-xl text-[12px] leading-relaxed transition-all duration-200 ${isClickable ? "cursor-pointer hover:bg-white/[0.04]" : "cursor-default"}`}
            style={{ background: bg, border, color }}
            onClick={isClickable ? onClick : undefined}
            whileTap={isClickable ? { scale: 0.98 } : undefined}
        >
            <span className="flex items-center gap-2.5">
                {state === "correct" && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="text-[14px]"
                    >
                        ✓
                    </motion.span>
                )}
                {state === "wrong" && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-[12px]"
                    >
                        ✗
                    </motion.span>
                )}
                {text}
            </span>
        </motion.button>
    );
}

export function ConceptRecallViz() {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const q = QUESTIONS[currentQ];

    const handleAnswer = useCallback((option: string) => {
        if (answered) return;
        setAnswered(option);

        const isCorrect = option === q.correct;
        if (isCorrect) setScore(s => s + 1);

        /* Auto-advance after brief pause */
        setTimeout(() => {
            if (currentQ < QUESTIONS.length - 1) {
                setCurrentQ(i => i + 1);
                setAnswered(null);
            } else {
                setDone(true);
            }
        }, isCorrect ? 800 : 1400);
    }, [answered, q.correct, currentQ]);

    const restart = () => {
        setCurrentQ(0);
        setScore(0);
        setAnswered(null);
        setDone(false);
    };

    /* ── Score celebration message ── */
    const celebrationMsg = score === 6
        ? "Every single one. You didn\u2019t just read about these \u2014 you understood them."
        : score >= 4
            ? "Most of them! The architecture clearly stuck."
            : score >= 2
                ? "Some stuck, some need a refresher. The knowledge is there."
                : "The concepts are in there somewhere. Try scrolling back through the sections!";

    return (
        <div className="w-full max-w-md mx-auto py-4 px-2">
            <AnimatePresence mode="wait">
                {!done ? (
                    <motion.div
                        key={`q-${currentQ}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Progress dots */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {QUESTIONS.map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                        background: i < currentQ
                                            ? "rgba(34,211,238,0.5)"
                                            : i === currentQ
                                                ? "rgba(34,211,238,0.8)"
                                                : "rgba(255,255,255,0.1)",
                                        boxShadow: i === currentQ
                                            ? "0 0 8px rgba(34,211,238,0.3)"
                                            : "none",
                                    }}
                                />
                            ))}
                            <span className="text-[9px] font-mono text-white/15 ml-2">
                                {currentQ + 1}/{QUESTIONS.length}
                            </span>
                        </div>

                        {/* Component name */}
                        <div className="text-center mb-5">
                            <p className="text-[10px] font-mono text-cyan-400/30 mb-1">
                                {q.section}
                            </p>
                            <h3 className="text-[18px] font-bold text-white/60">
                                {q.component}
                            </h3>
                            <p className="text-[11px] text-white/15 mt-1">
                                What does this do?
                            </p>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col gap-2">
                            {q.options.map((opt) => {
                                let state: "idle" | "correct" | "wrong" | "revealed" = "idle";
                                if (answered) {
                                    if (opt === q.correct) state = answered === opt ? "correct" : "revealed";
                                    else if (opt === answered) state = "wrong";
                                }
                                return (
                                    <OptionPill
                                        key={opt}
                                        text={opt}
                                        state={state}
                                        onClick={() => handleAnswer(opt)}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                ) : (
                    /* ── Score screen ── */
                    <motion.div
                        key="score"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="text-center py-6"
                    >
                        {/* Score */}
                        <motion.p
                            className="text-[42px] font-bold tabular-nums"
                            style={{
                                background: "linear-gradient(135deg, #22d3ee, #fbbf24)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 12 }}
                        >
                            {score}/{QUESTIONS.length}
                        </motion.p>

                        <motion.p
                            className="text-[12px] text-white/30 mt-3 leading-relaxed max-w-[280px] mx-auto"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {celebrationMsg}
                        </motion.p>

                        <motion.button
                            className="mt-5 text-[10px] font-mono text-white/15 hover:text-white/30 transition-colors cursor-pointer"
                            onClick={restart}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            try again
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
