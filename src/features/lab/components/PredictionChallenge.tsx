"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

/**
 * PredictionChallenge — the Bigram chapter's "your turn" game (v8 · bw-game · editorial-green).
 *
 * ONE idea: your gut already bets on the same next character the model does. The reader guesses;
 * the model's answer is then revealed by FILL, not outline. Correct = solid --bigram-accent on
 * --bigram-on-accent; the chosen-wrong cell tints --bigram-wrong-soft; the rest dim by opacity.
 *
 * Mirrors styles-v8.css `.bw-game`: progress dot ELONGATES (never glows), the blank fills solid to
 * its state, the feedback box tints to accent/terracotta, the confetti burst stays in the accent/sage
 * family. Token-only (--bigram-*) so it follows the consumer's [data-bigram-theme] scope (dark + light)
 * and never touches another chapter's accent. Keyboard (1–4, Enter/Space) and a11y preserved; fully
 * reduced-motion safe.
 */

type Round = {
    context: string;
    answer: string;
    /** the visible context glyphs preceding the blank, already display-ready ("t", "h") */
    context_glyphs: string[];
    options: string[];
    explanationKey: string;
};

const ROUNDS: Round[] = [
    {
        context: "th",
        answer: "e",
        context_glyphs: ["t", "h"],
        options: ["e", "a", "x", "z"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.0",
    },
    {
        context: "q",
        answer: "u",
        context_glyphs: ["q"],
        options: ["u", "i", "a", "e"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.1",
    },
    {
        context: "i",
        answer: "n",
        context_glyphs: ["i"],
        options: ["n", "f", "p", "b"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.2",
    },
    {
        context: " ",
        answer: "t",
        context_glyphs: ["␣"],
        options: ["t", "q", "z", "x"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.3",
    },
    {
        context: "e",
        answer: " ",
        context_glyphs: ["e"],
        options: ["␣", "x", "q", "z"],
        explanationKey: "bigramNarrative.predictionChallenge.explanations.4",
    },
];

const SPACE_GLYPH = "␣";

/** "␣" for a literal space, else the char itself */
function displayChar(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}

/** an option token ("u" or "␣") → the real character it stands for */
function optionValue(opt: string): string {
    return opt === SPACE_GLYPH ? " " : opt;
}

const MONO = "var(--font-jetbrains-mono)";
const SERIF = "var(--font-source-serif)";

const QUESTION_EASE = [0.2, 0.8, 0.2, 1] as const;

/* ─── Confetti burst ───
   Recolored entirely into the bigram accent / sage family (no neon emerald literals). A radial
   pop of small discs that fade and shrink, exactly like styles-v8.css `.bw-confetti`. Suppressed
   under prefers-reduced-motion. */
const CONFETTI_TONES = [
    "var(--bigram-accent)",
    "var(--bigram-accent-bright)",
    "var(--bigram-sage)",
    "var(--bigram-accent-2)",
];

/* Deterministic 0..1 jitter from an integer seed — keeps the burst pure (no
   Math.random during render) while reading as scattered confetti to the eye. */
function jitter(seed: number) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function ConfettiBurst() {
    const particles = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => {
                const angle = (i / 14) * 360 + jitter(i) * 18;
                const dist = 38 + jitter(i + 7) * 34;
                return {
                    dx: Math.cos((angle * Math.PI) / 180) * dist,
                    dy: Math.sin((angle * Math.PI) / 180) * dist,
                    tone: CONFETTI_TONES[i % CONFETTI_TONES.length],
                    size: 4 + jitter(i + 13) * 3,
                };
            }),
        [],
    );

    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
            }}
        >
            {particles.map((p, i) => (
                <motion.span
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0 }}
                    transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
                    style={{
                        position: "absolute",
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        background: p.tone,
                    }}
                />
            ))}
        </div>
    );
}

export const PredictionChallenge = memo(function PredictionChallenge() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [roundIdx, setRoundIdx] = useState(0);
    const [chosen, setChosen] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [revealAnswer, setRevealAnswer] = useState(false);

    const round = ROUNDS[roundIdx];
    const isCorrect = chosen !== null && optionValue(chosen) === round.answer;

    const handleChoice = useCallback(
        (opt: string) => {
            if (chosen) return;
            setChosen(opt);
            if (optionValue(opt) === round.answer) {
                setScore((s) => s + 1);
                if (!reduce) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 720);
                }
            }
            setTimeout(() => setRevealAnswer(true), reduce ? 0 : 280);
        },
        [chosen, round.answer, reduce],
    );

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

    // Keyboard: 1–4 picks an option, Enter/Space advances once answered.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (done) return;
            if (chosen && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleNext();
                return;
            }
            if (!chosen) {
                const idx = parseInt(e.key, 10) - 1;
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
        const tone = isGood ? "var(--bigram-accent)" : "var(--bigram-muted)";
        const message = isPerfect
            ? t("bigramNarrative.predictionChallenge.perfect")
            : isGood
              ? t("bigramNarrative.predictionChallenge.good")
              : t("bigramNarrative.predictionChallenge.tryAgain");

        return (
            <motion.div
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: QUESTION_EASE }}
                style={{ textAlign: "center", padding: "28px 0 16px", position: "relative" }}
            >
                {isPerfect && !reduce && <ConfettiBurst />}

                {/* score — calm editorial numeral, no glow badge */}
                <div
                    style={{
                        fontFamily: MONO,
                        fontSize: "56px",
                        fontWeight: 600,
                        lineHeight: 1,
                        marginBottom: "16px",
                        color: "var(--bigram-muted)",
                        fontVariantNumeric: "lining-nums tabular-nums",
                    }}
                >
                    <b style={{ color: tone, fontWeight: 700 }}>{score}</b>
                    <span style={{ color: "var(--bigram-dim)", margin: "0 6px" }}>/</span>
                    {ROUNDS.length}
                </div>

                {/* honest thin track — fills to the score, no gradient neon */}
                <div
                    style={{
                        width: "140px",
                        height: "4px",
                        borderRadius: "2px",
                        background: "color-mix(in oklab, var(--bigram-ink) 8%, transparent)",
                        overflow: "hidden",
                        margin: "0 auto 22px",
                    }}
                >
                    <motion.div
                        initial={reduce ? false : { width: "0%" }}
                        animate={{ width: `${pct}%` }}
                        transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 }}
                        style={{
                            height: "100%",
                            borderRadius: "2px",
                            background: isGood ? "var(--bigram-accent)" : "var(--bigram-muted)",
                        }}
                    />
                </div>

                <p
                    style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: "18px",
                        color: "var(--bigram-ink-2)",
                        margin: "0 auto 26px",
                        maxWidth: "380px",
                        lineHeight: 1.55,
                        textWrap: "pretty",
                    }}
                >
                    {message}
                </p>

                <button
                    onClick={handleRestart}
                    style={{
                        fontFamily: MONO,
                        fontSize: "12px",
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        padding: "12px 18px",
                        borderRadius: "var(--bigram-r-sm)",
                        border: 0,
                        background: "transparent",
                        color: "var(--bigram-accent)",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "background .2s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bigram-accent-soft)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                    }}
                >
                    {t("bigramNarrative.predictionChallenge.restart")}
                </button>
            </motion.div>
        );
    }

    /* ─── GAME STATE ─── */
    return (
        <div>
            {/* top — progress dots + score */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                }}
            >
                <div style={{ display: "flex", gap: "7px" }}>
                    {ROUNDS.map((_, i) => {
                        const isCurrent = i === roundIdx;
                        const isDoneDot = i < roundIdx;
                        return (
                            <motion.span
                                key={i}
                                // the active dot ELONGATES into a pill — never scales/glows
                                animate={{
                                    width: isCurrent ? 20 : 7,
                                    backgroundColor: isCurrent
                                        ? "var(--bigram-accent)"
                                        : isDoneDot
                                          ? "var(--bigram-accent-2)"
                                          : "color-mix(in oklab, var(--bigram-ink) 16%, transparent)",
                                }}
                                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                                style={{
                                    height: 7,
                                    borderRadius: "var(--bigram-r-pill)",
                                    display: "block",
                                }}
                            />
                        );
                    })}
                </div>
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: "11.5px",
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "var(--bigram-dim)",
                        fontVariantNumeric: "lining-nums tabular-nums",
                    }}
                >
                    {t("bigramNarrative.predictionChallenge.score")}
                    <b style={{ color: "var(--bigram-accent-ink)", fontWeight: 700, marginLeft: "8px" }}>{score}</b>
                </span>
            </div>

            {/* question — large, single focal point; re-mounts (and re-animates) only on round change */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={roundIdx}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.42, ease: QUESTION_EASE }}
                    style={{ textAlign: "center", padding: "30px 0 32px", position: "relative" }}
                >
                    <p
                        style={{
                            fontFamily: MONO,
                            fontSize: "11px",
                            letterSpacing: ".22em",
                            textTransform: "uppercase",
                            color: "var(--bigram-dim)",
                            margin: "0 0 24px",
                        }}
                    >
                        {t("bigramNarrative.predictionChallenge.prompt")}
                    </p>

                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "14px",
                            position: "relative",
                        }}
                    >
                        {showConfetti && <ConfettiBurst />}

                        {round.context_glyphs.map((g, i) => (
                            <span
                                key={`${roundIdx}-ctx-${i}`}
                                style={{
                                    fontFamily: MONO,
                                    fontSize: "52px",
                                    fontWeight: 600,
                                    lineHeight: 1,
                                    color: "var(--bigram-ink)",
                                }}
                            >
                                {g}
                            </span>
                        ))}

                        {/* the blank — marked by FILL, not by a dashed outline */}
                        <span
                            style={{
                                minWidth: "52px",
                                padding: "2px 12px",
                                borderRadius: "var(--bigram-r-sm)",
                                display: "inline-grid",
                                placeItems: "center",
                                fontFamily: MONO,
                                fontSize: "52px",
                                fontWeight: 600,
                                lineHeight: 1,
                                background: !chosen
                                    ? "transparent"
                                    : isCorrect
                                      ? "var(--bigram-accent)"
                                      : "var(--bigram-wrong)",
                                color: !chosen ? "var(--bigram-dim)" : "var(--bigram-on-accent)",
                            }}
                        >
                            {chosen ? (
                                <motion.span
                                    key="answer"
                                    initial={reduce ? false : { scale: 0.6, rotate: -8, opacity: 0 }}
                                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 460, damping: 22 }}
                                >
                                    {displayChar(round.answer)}
                                </motion.span>
                            ) : (
                                <motion.span
                                    aria-hidden
                                    animate={reduce ? undefined : { opacity: [0.45, 0.75, 0.45] }}
                                    transition={{ duration: 1.6, repeat: Infinity }}
                                >
                                    ?
                                </motion.span>
                            )}
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* options — fill-state cells, no borders; correct fills accent, chosen-wrong tints terracotta */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                }}
                className="bw-opts-grid"
            >
                {round.options.map((opt, i) => {
                    const isChosen = chosen === opt;
                    const correct = optionValue(opt) === round.answer;
                    const revealed = !!chosen;

                    let background = "color-mix(in oklab, var(--bigram-ink) 6%, transparent)";
                    let color = "var(--bigram-ink)";
                    let keyColor = "var(--bigram-dim)";
                    let keyOpacity = 1;
                    let cellOpacity = 1;

                    if (revealed) {
                        if (correct) {
                            background = "var(--bigram-accent)";
                            color = "var(--bigram-on-accent)";
                            keyColor = "var(--bigram-on-accent)";
                            keyOpacity = 0.55;
                        } else if (isChosen) {
                            background = "var(--bigram-wrong-soft)";
                            color = "var(--bigram-wrong)";
                            keyColor = "var(--bigram-wrong)";
                            keyOpacity = 0.7;
                        } else {
                            background = "transparent";
                            color = "var(--bigram-muted)";
                            cellOpacity = 0.45;
                        }
                    }

                    return (
                        <button
                            key={opt}
                            onClick={() => handleChoice(opt)}
                            disabled={revealed}
                            aria-label={`Option ${i + 1}: ${optionValue(opt) === " " ? "space" : opt}`}
                            style={{
                                position: "relative",
                                padding: "22px 0",
                                borderRadius: "var(--bigram-r-sm)",
                                border: 0,
                                background,
                                color,
                                fontFamily: MONO,
                                fontSize: "28px",
                                fontWeight: 600,
                                opacity: cellOpacity,
                                cursor: revealed ? "default" : "pointer",
                                transition:
                                    "background .25s, color .25s, opacity .25s, box-shadow .2s, transform .2s",
                            }}
                            onMouseEnter={(e) => {
                                if (revealed) return;
                                e.currentTarget.style.background =
                                    "color-mix(in oklab, var(--bigram-ink) 12%, transparent)";
                                if (!reduce) e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                                if (revealed) return;
                                e.currentTarget.style.background =
                                    "color-mix(in oklab, var(--bigram-ink) 6%, transparent)";
                                e.currentTarget.style.transform = "none";
                            }}
                            onFocus={(e) => {
                                if (revealed) return;
                                e.currentTarget.style.boxShadow = "0 0 0 2px var(--bigram-accent)";
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            {opt === SPACE_GLYPH ? SPACE_GLYPH : opt}
                            {/* the key numeral stays on the active cells (unanswered, or the
                                correct + chosen-wrong reveals); dimmed cells drop it as chrome */}
                            {(!revealed || correct || isChosen) && (
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "9px",
                                        right: "12px",
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        color: keyColor,
                                        opacity: keyOpacity,
                                    }}
                                >
                                    {i + 1}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* feedback — the box takes the TINT of its state (accent / terracotta), never grey */}
            <AnimatePresence>
                {revealAnswer && chosen && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: QUESTION_EASE }}
                        style={{ overflow: "hidden" }}
                    >
                        <div
                            style={{
                                marginTop: "24px",
                                padding: "18px 20px",
                                borderRadius: "var(--bigram-r-sm)",
                                background: isCorrect ? "var(--bigram-accent-soft)" : "var(--bigram-wrong-soft)",
                                border: `1px solid ${
                                    isCorrect
                                        ? "color-mix(in oklab, var(--bigram-accent) 26%, transparent)"
                                        : "color-mix(in oklab, var(--bigram-wrong) 28%, transparent)"
                                }`,
                            }}
                        >
                            <p
                                style={{
                                    fontFamily: MONO,
                                    fontSize: "13px",
                                    letterSpacing: ".04em",
                                    fontWeight: 600,
                                    margin: "0 0 7px",
                                    color: isCorrect ? "var(--bigram-accent-ink)" : "var(--bigram-wrong)",
                                }}
                            >
                                {isCorrect
                                    ? t("bigramNarrative.predictionChallenge.correct")
                                    : t("bigramNarrative.predictionChallenge.wrong").replace(
                                          "{answer}",
                                          displayChar(round.answer),
                                      )}
                            </p>
                            <p
                                style={{
                                    fontFamily: SERIF,
                                    fontSize: "16px",
                                    lineHeight: 1.6,
                                    color: "var(--bigram-ink-2)",
                                    margin: 0,
                                }}
                            >
                                {t(round.explanationKey)}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* next — solid accent button, fills last, no glow */}
            <AnimatePresence>
                {chosen && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: QUESTION_EASE }}
                        style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}
                    >
                        <button
                            onClick={handleNext}
                            style={{
                                fontFamily: MONO,
                                fontSize: "12px",
                                letterSpacing: ".1em",
                                textTransform: "uppercase",
                                padding: "12px 18px",
                                borderRadius: "var(--bigram-r-sm)",
                                border: 0,
                                background: "var(--bigram-accent)",
                                color: "var(--bigram-on-accent)",
                                cursor: "pointer",
                                fontWeight: 600,
                                transition: "background .2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--bigram-accent-bright)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--bigram-accent)";
                            }}
                        >
                            {roundIdx < ROUNDS.length - 1
                                ? t("bigramNarrative.predictionChallenge.next")
                                : t("bigramNarrative.predictionChallenge.finish")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @media (max-width: 560px) {
                    .bw-opts-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}</style>
        </div>
    );
});
