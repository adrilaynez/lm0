"use client";

import { useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";

/*
  OverfittingDetectiveChallenge
  Gamified: show train+val loss curves, user must identify overfitting/underfitting/good fit.
*/

interface Challenge {
    id: string;
    trainCurve: number[];
    valCurve: number[];
    answer: "overfit" | "underfit" | "good";
    explanation: string;
}

const CHALLENGES: Challenge[] = [
    {
        id: "a",
        trainCurve: [3.3, 2.5, 2.0, 1.6, 1.3, 1.0, 0.8, 0.6, 0.5, 0.4],
        valCurve:   [3.3, 2.6, 2.2, 2.1, 2.1, 2.15, 2.2, 2.3, 2.4, 2.5],
        answer: "overfit",
        explanation: "Train loss keeps dropping but val loss increases after step 4 — classic overfitting. The model memorizes training data.",
    },
    {
        id: "b",
        trainCurve: [3.3, 3.1, 3.0, 2.95, 2.92, 2.9, 2.88, 2.87, 2.86, 2.85],
        valCurve:   [3.3, 3.15, 3.05, 3.0, 2.97, 2.95, 2.93, 2.92, 2.91, 2.90],
        answer: "underfit",
        explanation: "Both curves are high and barely improve — the model doesn't have enough capacity to learn the patterns.",
    },
    {
        id: "c",
        trainCurve: [3.3, 2.7, 2.3, 2.1, 2.0, 1.95, 1.92, 1.90, 1.89, 1.88],
        valCurve:   [3.3, 2.75, 2.4, 2.2, 2.1, 2.05, 2.02, 2.0, 1.99, 1.98],
        answer: "good",
        explanation: "Both curves decrease together with a small gap — the model generalizes well to unseen data.",
    },
];

const OPTIONS = [
    { value: "overfit" as const, label: "Overfitting", color: "rose" },
    { value: "underfit" as const, label: "Underfitting", color: "amber" },
    { value: "good" as const, label: "Good Fit", color: "emerald" },
];

export function OverfittingDetectiveChallenge() {
    const [challengeIdx, setChallengeIdx] = useState(0);
    const [guess, setGuess] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [revealed, setRevealed] = useState(false);

    const challenge = CHALLENGES[challengeIdx];
    const isCorrect = guess === challenge.answer;

    const handleGuess = useCallback((g: string) => {
        if (revealed) return;
        setGuess(g);
        setRevealed(true);
        if (g === challenge.answer) setScore(prev => prev + 1);
    }, [revealed, challenge.answer]);

    const next = useCallback(() => {
        if (challengeIdx < CHALLENGES.length - 1) {
            setChallengeIdx(prev => prev + 1);
            setGuess(null);
            setRevealed(false);
        }
    }, [challengeIdx]);

    const reset = useCallback(() => {
        setChallengeIdx(0);
        setGuess(null);
        setRevealed(false);
        setScore(0);
    }, []);

    const W = 280;
    const H = 110;
    const pad = 25;
    const toX = (i: number) => pad + (i / 9) * (W - 2 * pad);
    const toY = (v: number) => pad + ((3.5 - v) / (3.5 - 0.2)) * (H - 2 * pad);

    const done = challengeIdx === CHALLENGES.length - 1 && revealed;

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono text-white/25">Challenge {challengeIdx + 1} / {CHALLENGES.length}</span>
                <span className="text-[9px] font-mono text-violet-400">Score: {score}/{CHALLENGES.length}</span>
            </div>

            {/* Chart */}
            <div className="flex justify-center">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md">
                    <polyline
                        points={challenge.trainCurve.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
                        fill="none" stroke="rgb(16,185,129)" strokeWidth="2"
                    />
                    <polyline
                        points={challenge.valCurve.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
                        fill="none" stroke="rgb(139,92,246)" strokeWidth="2" strokeDasharray="5 3"
                    />
                </svg>
            </div>

            <div className="flex gap-3 justify-center text-[9px] font-mono">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 rounded" /> Train</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 rounded" /> Validation</span>
            </div>

            {/* Options */}
            <div className="flex gap-2">
                {OPTIONS.map(opt => {
                    const isThis = guess === opt.value;
                    const showCorrect = revealed && opt.value === challenge.answer;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => handleGuess(opt.value)}
                            disabled={revealed}
                            className={`flex-1 py-2.5 rounded-lg text-[10px] font-mono font-bold text-center transition-all border ${
                                showCorrect ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" :
                                isThis && !isCorrect ? "bg-rose-500/15 border-rose-500/40 text-rose-400" :
                                "bg-white/[0.02] border-white/[0.06] text-white/30 hover:bg-white/[0.04]"
                            } disabled:cursor-default`}
                        >
                            {opt.label}
                            {showCorrect && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
                            {isThis && !isCorrect && revealed && <XCircle className="w-3 h-3 inline ml-1" />}
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
                {revealed && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-lg border p-3 ${
                            isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"
                        }`}
                    >
                        <p className={`text-[10px] font-mono font-bold mb-1 ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                            {isCorrect ? "Correct!" : "Not quite."}
                        </p>
                        <p className="text-[10px] text-white/40">{challenge.explanation}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-white/50">
                    <RotateCcw className="w-3 h-3" /> Restart
                </button>
                {revealed && !done && (
                    <button onClick={next} className="px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-mono font-bold text-violet-400 hover:bg-violet-500/25">
                        Next Challenge →
                    </button>
                )}
                {done && (
                    <p className="text-xs font-mono text-violet-400">{score === CHALLENGES.length ? "Perfect score!" : `${score}/${CHALLENGES.length} correct`}</p>
                )}
            </div>
        </div>
    );
}
