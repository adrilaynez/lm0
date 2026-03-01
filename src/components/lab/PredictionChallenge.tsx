"use client";

import { memo, useCallback, useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle, RefreshCw, Sparkles, Trophy, XCircle } from "lucide-react";

import { useI18n } from "@/i18n/context";

type Round = {
    context: string;
    answer: string;
    display: string;
    options: string[];
    explanationKey: string;
};

const ROUNDS: Round[] = [
    {
        context: "th",
        answer: "e",
        display: "t h __",
        options: ["e", "a", "x", "z"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.0",
    },
    {
        context: "q",
        answer: "u",
        display: "q __",
        options: ["u", "i", "a", "e"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.1",
    },
    {
        context: "i",
        answer: "n",
        display: "i __",
        options: ["n", "f", "p", "b"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.2",
    },
    {
        context: " ",
        answer: "t",
        display: "␣ __",
        options: ["t", "q", "z", "x"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.3",
    },
    {
        context: "e",
        answer: " ",
        display: "e __",
        options: ["␣", "x", "q", "z"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.4",
    },
];

function displayChar(c: string) {
    return c === " " ? "␣" : c;
}

/* ─── Confetti burst (lightweight) ─── */
function ConfettiBurst() {
    const particles = Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360;
        const dist = 40 + Math.random() * 30;
        const x = Math.cos((angle * Math.PI) / 180) * dist;
        const y = Math.sin((angle * Math.PI) / 180) * dist;
        const colors = ["bg-emerald-400", "bg-teal-300", "bg-green-400", "bg-emerald-300"];
        return { x, y, color: colors[i % colors.length], size: 3 + Math.random() * 3 };
    });

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {particles.map((p, i) => (
                <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`absolute rounded-full ${p.color}`}
                    style={{ width: p.size, height: p.size }}
                />
            ))}
        </div>
    );
}

export const PredictionChallenge = memo(function PredictionChallenge() {
    const { t } = useI18n();
    const [roundIdx, setRoundIdx] = useState(0);
    const [chosen, setChosen] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [revealAnswer, setRevealAnswer] = useState(false);

    const round = ROUNDS[roundIdx];
    const isCorrect = chosen !== null && (chosen === round.answer || (chosen === "␣" && round.answer === " "));

    const handleChoice = useCallback((opt: string) => {
        if (chosen) return;
        const actualOpt = opt === "␣" ? " " : opt;
        setChosen(opt);
        const correct = actualOpt === round.answer;
        if (correct) {
            setScore((s) => s + 1);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 700);
        }
        setTimeout(() => setRevealAnswer(true), 300);
    }, [chosen, round.answer]);

    const handleNext = useCallback(() => {
        if (roundIdx < ROUNDS.length - 1) {
            setRoundIdx((i) => i + 1);
            setChosen(null);
            setRevealAnswer(false);
        } else {
            setDone(true);
        }
    }, [roundIdx]);

    const handleRestart = useCallback(() => {
        setRoundIdx(0);
        setChosen(null);
        setScore(0);
        setDone(false);
        setRevealAnswer(false);
    }, []);

    // Keyboard support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (done) return;
            if (chosen && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleNext();
                return;
            }
            if (!chosen) {
                const idx = parseInt(e.key) - 1;
                if (idx >= 0 && idx < round.options.length) {
                    handleChoice(round.options[idx]);
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [chosen, done, round.options, handleChoice, handleNext]);

    /* ─── DONE STATE ─── */
    if (done) {
        const pct = Math.round((score / ROUNDS.length) * 100);
        const isPerfect = score === ROUNDS.length;
        const isGood = score >= 3;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="text-center py-10 relative"
            >
                {isPerfect && <ConfettiBurst />}

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
                    className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${isPerfect
                        ? "bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border border-emerald-500/30 shadow-[0_0_40px_-8px_rgba(52,211,153,0.4)]"
                        : isGood
                            ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500/20"
                            : "bg-white/[0.04] border border-white/[0.08]"
                        }`}
                >
                    {isPerfect ? (
                        <Trophy className="w-8 h-8 text-emerald-300" />
                    ) : (
                        <Sparkles className={`w-8 h-8 ${isGood ? "text-emerald-400" : "text-white/30"}`} />
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="text-6xl font-black font-mono mb-1">
                        <span className={isPerfect ? "text-emerald-300" : isGood ? "text-emerald-400" : "text-white/60"}>
                            {score}
                        </span>
                        <span className="text-white/15 mx-1">/</span>
                        <span className="text-white/25">{ROUNDS.length}</span>
                    </div>
                    <div className="h-1.5 w-32 mx-auto rounded-full bg-white/[0.06] overflow-hidden mb-4">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                            className={`h-full rounded-full ${isPerfect ? "bg-gradient-to-r from-emerald-400 to-teal-300" : isGood ? "bg-emerald-500/70" : "bg-white/20"}`}
                        />
                    </div>
                    <p className="text-sm text-white/40 mb-8 max-w-xs mx-auto leading-relaxed">
                        {isPerfect
                            ? t("bigramNarrative.predictionChallenge.perfect")
                            : isGood
                                ? t("bigramNarrative.predictionChallenge.good")
                                : t("bigramNarrative.predictionChallenge.tryAgain")}
                    </p>
                </motion.div>

                <button
                    onClick={handleRestart}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t("bigramNarrative.predictionChallenge.restart")}
                </button>
            </motion.div>
        );
    }

    /* ─── GAME STATE ─── */
    return (
        <div className="space-y-6 py-2">
            {/* Progress dots + score */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {ROUNDS.map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: i === roundIdx ? 1.3 : 1,
                                backgroundColor:
                                    i < roundIdx
                                        ? "rgb(52, 211, 153)"
                                        : i === roundIdx
                                            ? "rgba(52, 211, 153, 0.5)"
                                            : "rgba(255, 255, 255, 0.08)",
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="w-2.5 h-2.5 rounded-full"
                        />
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-white/20">
                        {roundIdx + 1}/{ROUNDS.length}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400/70">
                        {t("bigramNarrative.predictionChallenge.score")}: {score}
                    </span>
                </div>
            </div>

            {/* Question display — large and dramatic */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={roundIdx}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="relative text-center py-8"
                >
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 mb-6">
                        {t("bigramNarrative.predictionChallenge.prompt")}
                    </p>

                    <div className="inline-flex items-center gap-1 relative">
                        {showConfetti && <ConfettiBurst />}

                        {round.display.split(" ").map((token, i) => (
                            <motion.span
                                key={`${roundIdx}-${i}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 25 }}
                                className={`font-mono font-black ${token === "__"
                                    ? "text-5xl md:text-6xl"
                                    : "text-5xl md:text-6xl"
                                    }`}
                            >
                                {token === "__" ? (
                                    <span className="inline-flex items-center justify-center w-14 h-16 md:w-16 md:h-20 rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/[0.06] mx-1">
                                        {chosen ? (
                                            <motion.span
                                                initial={{ scale: 0, rotate: -10 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                                className={isCorrect ? "text-emerald-300" : "text-rose-400"}
                                            >
                                                {displayChar(round.answer)}
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="text-emerald-500/40"
                                            >
                                                ?
                                            </motion.span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-white px-0.5">{token}</span>
                                )}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Options — large buttons with glow */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {round.options.map((opt, i) => {
                    const isChosen = chosen === opt;
                    const actualOpt = opt === "␣" ? " " : opt;
                    const correct = actualOpt === round.answer;
                    const revealed = !!chosen;

                    let borderCls = "border-white/[0.08]";
                    let bgCls = "bg-white/[0.03]";
                    let textCls = "text-white/70";
                    let shadowCls = "";
                    let scaleFactor = 1;

                    if (revealed) {
                        if (correct) {
                            borderCls = "border-emerald-500/50";
                            bgCls = "bg-emerald-500/15";
                            textCls = "text-emerald-300";
                            shadowCls = "shadow-[0_0_20px_-4px_rgba(52,211,153,0.35)]";
                            scaleFactor = 1.05;
                        } else if (isChosen && !correct) {
                            borderCls = "border-rose-500/50";
                            bgCls = "bg-rose-500/10";
                            textCls = "text-rose-400";
                        } else {
                            borderCls = "border-white/[0.03]";
                            bgCls = "bg-white/[0.01]";
                            textCls = "text-white/15";
                        }
                    }

                    return (
                        <motion.button
                            key={opt}
                            onClick={() => handleChoice(opt)}
                            disabled={revealed}
                            whileHover={!revealed ? { scale: 1.06, borderColor: "rgba(52, 211, 153, 0.3)" } : undefined}
                            whileTap={!revealed ? { scale: 0.95 } : undefined}
                            animate={{ scale: scaleFactor }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className={`relative py-5 rounded-xl border font-mono text-2xl sm:text-3xl font-black transition-colors duration-300 ${borderCls} ${bgCls} ${textCls} ${shadowCls} ${!revealed ? "hover:bg-white/[0.06] cursor-pointer" : "cursor-default"}`}
                        >
                            {opt === "␣" ? "␣" : opt}
                            {!revealed && (
                                <span className="absolute top-1.5 right-2 text-[9px] font-mono text-white/15 font-normal">
                                    {i + 1}
                                </span>
                            )}
                            {revealed && correct && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1.5 -right-1.5"
                                >
                                    <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                                </motion.div>
                            )}
                            {revealed && isChosen && !correct && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1.5 -right-1.5"
                                >
                                    <XCircle className="w-5 h-5 text-rose-400 fill-rose-400/20" />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
                {revealAnswer && chosen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="overflow-hidden"
                    >
                        <div className={`rounded-xl border px-5 py-4 flex gap-3 ${isCorrect
                            ? "border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] to-transparent"
                            : "border-rose-500/15 bg-gradient-to-r from-rose-500/[0.04] to-transparent"
                            }`}>
                            {isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className={`text-xs font-bold mb-1 ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                                    {isCorrect
                                        ? t("bigramNarrative.predictionChallenge.correct")
                                        : t("bigramNarrative.predictionChallenge.wrong").replace("{answer}", displayChar(round.answer))}
                                </p>
                                <p className="text-xs text-white/40 leading-relaxed">{t(round.explanationKey)}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Next button */}
            <AnimatePresence>
                {chosen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-end"
                    >
                        <motion.button
                            onClick={handleNext}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
                        >
                            {roundIdx < ROUNDS.length - 1
                                ? t("bigramNarrative.predictionChallenge.next")
                                : t("bigramNarrative.predictionChallenge.finish")}
                            <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
