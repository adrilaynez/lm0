"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { NN_COLORS } from "./visualizer-theme";

/*
  Gamified: show a text context (e.g., "th"), user types prediction for next char.
  Network shows its top-3 predictions with confidence bars.
  Score: user vs network over 10 rounds.
  Uses pre-computed bigram probabilities (no live training).
*/

// Pre-computed bigram probabilities for common pairs
// Format: context → { char: probability }
const BIGRAM_TABLE: Record<string, Record<string, number>> = {
    "th": { e: 0.62, a: 0.12, i: 0.10, o: 0.06, r: 0.03, " ": 0.02 },
    "he": { " ": 0.45, r: 0.15, n: 0.10, a: 0.08, l: 0.06, s: 0.05 },
    "in": { g: 0.28, " ": 0.22, t: 0.12, e: 0.10, d: 0.08, s: 0.06 },
    "an": { d: 0.35, " ": 0.18, t: 0.12, c: 0.08, y: 0.07, o: 0.05 },
    "er": { " ": 0.30, e: 0.15, s: 0.12, i: 0.10, a: 0.08, y: 0.06 },
    "on": { " ": 0.32, e: 0.18, s: 0.10, t: 0.08, l: 0.06, c: 0.05 },
    "re": { " ": 0.25, s: 0.15, a: 0.12, d: 0.10, n: 0.08, e: 0.06 },
    "it": { h: 0.28, " ": 0.22, e: 0.12, s: 0.10, i: 0.08, y: 0.06 },
    "st": { " ": 0.25, a: 0.15, o: 0.12, i: 0.10, e: 0.08, r: 0.06 },
    "or": { " ": 0.28, e: 0.18, d: 0.10, t: 0.08, k: 0.06, s: 0.06 },
};

const CONTEXTS = Object.keys(BIGRAM_TABLE);
const TOTAL_ROUNDS = 10;

function getTop3(ctx: string): { char: string; prob: number }[] {
    const probs = BIGRAM_TABLE[ctx] || {};
    return Object.entries(probs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([char, prob]) => ({ char, prob }));
}

function shuffleContexts(seed: number): string[] {
    const arr = [...CONTEXTS];
    // Repeat to get 10 rounds
    while (arr.length < TOTAL_ROUNDS) arr.push(...CONTEXTS);
    // Fisher-Yates with seed
    let s = seed;
    const rng = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, TOTAL_ROUNDS);
}

export function BeatTheMachineChallenge() {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();
    const [gameContexts] = useState(() => shuffleContexts(42));
    const [round, setRound] = useState(0);
    const [userScore, setUserScore] = useState(0);
    const [machineScore, setMachineScore] = useState(0);
    const [userGuess, setUserGuess] = useState("");
    const [revealed, setRevealed] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    const ctx = gameContexts[round] || "th";
    const top3 = useMemo(() => getTop3(ctx), [ctx]);
    const trueAnswer = top3[0]?.char || "e";
    const machineCorrect = true; // machine always picks top-1

    const handleGuess = useCallback((char: string) => {
        if (revealed || gameOver) return;
        setUserGuess(char);
        setRevealed(true);

        const userCorrect = char === trueAnswer;
        if (userCorrect) setUserScore(s => s + 1);
        setMachineScore(s => s + 1); // machine always gets it right (top-1)
    }, [revealed, gameOver, trueAnswer]);

    const handleNext = useCallback(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
            setGameOver(true);
        } else {
            setRound(r => r + 1);
            setUserGuess("");
            setRevealed(false);
        }
    }, [round]);

    const handleRestart = useCallback(() => {
        setRound(0);
        setUserScore(0);
        setMachineScore(0);
        setUserGuess("");
        setRevealed(false);
        setGameOver(false);
    }, []);

    const spring = shouldReduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 24 };

    const CHAR_OPTIONS = "abcdefghijklmnopqrstuvwxyz ".split("");

    return (
        <div className="p-5 sm:p-6 space-y-4">
            {/* Score bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-center">
                        <p className="text-[7px] font-mono text-white/20">{t("neuralNetworkNarrative.beatMachine.you")}</p>
                        <p className="text-lg font-mono font-bold" style={{ color: NN_COLORS.input.hex }}>{userScore}</p>
                    </div>
                    <span className="text-white/15 text-xs font-mono">vs</span>
                    <div className="text-center">
                        <p className="text-[7px] font-mono text-white/20">{t("neuralNetworkNarrative.beatMachine.network")}</p>
                        <p className="text-lg font-mono font-bold" style={{ color: NN_COLORS.error.hex }}>{machineScore}</p>
                    </div>
                </div>
                <span className="text-[9px] font-mono text-white/25">
                    {t("neuralNetworkNarrative.beatMachine.round").replace("{n}", String(round + 1)).replace("{total}", String(TOTAL_ROUNDS))}
                </span>
            </div>

            {!gameOver ? (
                <>
                    {/* Context display */}
                    <div className="rounded-xl bg-black/30 border border-white/[0.06] p-4 text-center">
                        <p className="text-[9px] font-mono text-white/25 mb-2">{t("neuralNetworkNarrative.beatMachine.contextLabel")}</p>
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-3xl font-mono font-bold" style={{ color: NN_COLORS.input.hex }}>
                                &quot;{ctx}
                            </span>
                            <motion.span
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-3xl font-mono font-bold text-white/30"
                            >
                                _
                            </motion.span>
                            <span className="text-3xl font-mono font-bold text-white/15">&quot;</span>
                        </div>
                        <p className="text-[10px] text-white/30 mt-2">{t("neuralNetworkNarrative.beatMachine.prompt")}</p>
                    </div>

                    {/* Character input grid — responsive: larger touch targets on mobile */}
                    {!revealed && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-1 justify-center max-w-[320px] sm:max-w-none mx-auto">
                            {CHAR_OPTIONS.map(ch => (
                                <button
                                    key={ch}
                                    onClick={() => handleGuess(ch)}
                                    className="w-9 h-9 sm:w-7 sm:h-7 rounded text-xs sm:text-[10px] font-mono font-bold border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/80 hover:border-white/[0.15] hover:bg-white/[0.05] active:scale-95 transition-all"
                                >
                                    {ch === " " ? "␣" : ch}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Results */}
                    <AnimatePresence>
                        {revealed && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                {/* User's guess */}
                                <div className={`rounded-lg p-3 border text-center ${userGuess === trueAnswer
                                        ? "bg-emerald-500/[0.06] border-emerald-500/20"
                                        : "bg-rose-500/[0.06] border-rose-500/20"
                                    }`}>
                                    <p className="text-[9px] font-mono text-white/25">{t("neuralNetworkNarrative.beatMachine.yourGuess")}</p>
                                    <span className="text-xl font-mono font-bold"
                                        style={{ color: userGuess === trueAnswer ? NN_COLORS.output.hex : NN_COLORS.error.hex }}>
                                        {userGuess === " " ? "␣" : userGuess}
                                    </span>
                                    <span className="text-xs ml-2" style={{ color: userGuess === trueAnswer ? NN_COLORS.output.hex : NN_COLORS.error.hex }}>
                                        {userGuess === trueAnswer ? "✓" : "✗"}
                                    </span>
                                </div>

                                {/* Network's predictions */}
                                <div className="rounded-lg bg-black/20 border border-white/[0.05] p-3">
                                    <p className="text-[9px] font-mono text-white/25 mb-2">{t("neuralNetworkNarrative.beatMachine.networkPredictions")}</p>
                                    {top3.map(({ char, prob }, i) => (
                                        <div key={i} className="flex items-center gap-2 mb-1">
                                            <span className="w-4 text-[10px] font-mono font-bold"
                                                style={{ color: i === 0 ? NN_COLORS.output.hex : "rgba(255,255,255,0.3)" }}>
                                                {char === " " ? "␣" : char}
                                            </span>
                                            <div className="flex-1 h-3 rounded-full bg-white/[0.03] overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ background: i === 0 ? NN_COLORS.output.hex : NN_COLORS.hidden.hex + "60" }}
                                                    animate={{ width: `${prob * 100}%` }}
                                                    transition={spring}
                                                />
                                            </div>
                                            <span className="text-[9px] font-mono text-white/30 w-8 text-right">{(prob * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleNext}
                                    className="w-full py-2 rounded-full text-xs font-semibold font-mono border transition-all"
                                    style={{ background: NN_COLORS.hidden.hex + "12", borderColor: NN_COLORS.hidden.hex + "40", color: NN_COLORS.hidden.hex }}
                                >
                                    {round + 1 >= TOTAL_ROUNDS ? t("neuralNetworkNarrative.beatMachine.seeResults") : t("neuralNetworkNarrative.beatMachine.next")}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : (
                /* Game over */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl p-5 border text-center space-y-3"
                    style={{
                        background: userScore >= machineScore ? NN_COLORS.output.hex + "08" : NN_COLORS.error.hex + "08",
                        borderColor: userScore >= machineScore ? NN_COLORS.output.hex + "25" : NN_COLORS.error.hex + "25",
                    }}
                >
                    <p className="text-sm font-semibold"
                        style={{ color: userScore >= machineScore ? NN_COLORS.output.hex : NN_COLORS.error.hex }}>
                        {userScore >= machineScore
                            ? t("neuralNetworkNarrative.beatMachine.youWin")
                            : t("neuralNetworkNarrative.beatMachine.networkWins")}
                    </p>
                    <p className="text-2xl font-mono font-bold text-white/60">
                        {userScore} — {machineScore}
                    </p>
                    <p className="text-[10px] text-white/30">
                        {t("neuralNetworkNarrative.beatMachine.summary")}
                    </p>
                    <button
                        onClick={handleRestart}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold font-mono bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
                    >
                        {t("neuralNetworkNarrative.beatMachine.playAgain")}
                    </button>
                </motion.div>
            )}
        </div>
    );
}
