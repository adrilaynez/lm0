"use client";

import { memo, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
    CaptionLine,
    GhostButton,
    MONO,
    PlayButton,
    STD,
} from "@/features/lab/components/ngram/kit";
import { contextRow, displayChar, NGRAM_ALPHABET } from "@/features/lab/data/ngramData";

/**
 * §1 · AmnesiaReplay — ONE idea, seen without reading a paragraph:
 *
 * Three CLEARLY DIFFERENT words (am · him · them) that a person would continue in three different
 * directions. But the machine keeps ONLY the last letter — so it erases everything that made them
 * different, all three become the same "…m", and it is FORCED to give the exact SAME bet to all three.
 *
 * The punch is the LOSS, not the collapse: three distinct words on the left → the machine's blindfold
 * crops each to its last letter → one identical bet, STAMPED three times, the same letter and the same
 * percentage on every row. The reader sees "it can't tell these three apart" before reading anything.
 *
 * The bet is real (contextRow over the Shakespeare corpus). «OTRA VEZ» cycles trios. Reduced-motion safe:
 * the still already shows distinct-words → identical-bet; the toggle deepens it, it isn't required.
 */

interface Trio {
    /** Three different words sharing the same last letter, each with a different natural continuation. */
    rows: { word: string; tail: string }[]; // word as typed; tail = a human-plausible continuation
    shared: string;
}

// Curated so each trio's REAL argmax (over the Shakespeare corpus) is a clear, confident LETTER — never a
// space (after s/n/d/r/y the corpus bets a word boundary, which renders as an obscure glyph and breaks the
// "confident identical bet" read). Verified bets: m→e · o→u · t→h · w→h.
const TRIOS: Trio[] = [
    {
        shared: "m",
        rows: [
            { word: "am", tail: "ber" },   // amber
            { word: "him", tail: "self" }, // himself
            { word: "them", tail: "e" },   // theme
        ],
    },
    {
        shared: "t",
        rows: [
            { word: "cat", tail: "ch" }, // catch
            { word: "bit", tail: "e" },  // bite
            { word: "hot", tail: "el" }, // hotel
        ],
    },
    {
        shared: "o",
        rows: [
            { word: "to", tail: "wn" },  // town
            { word: "who", tail: "le" }, // whole
            { word: "no", tail: "se" },  // nose
        ],
    },
    {
        shared: "w",
        rows: [
            { word: "how", tail: "l" },  // howl
            { word: "new", tail: "s" },  // news
            { word: "low", tail: "er" }, // lower
        ],
    },
];

export const AmnesiaReplay = memo(function AmnesiaReplay({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion() === true;

    const [idx, setIdx] = useState(0);
    const trio = TRIOS[idx % TRIOS.length];
    const shared = trio.shared;

    // The real machine bet after a 1-letter context: argmax of the count row for `shared`.
    const row = useMemo(() => contextRow(1, shared), [shared]);
    const total = useMemo(() => row.reduce((a, b) => a + b, 0), [row]);
    const winIdx = useMemo(() => {
        let best = 0;
        for (let i = 1; i < row.length; i++) if (row[i] > row[best]) best = i;
        return best;
    }, [row]);
    const betChar = NGRAM_ALPHABET[winIdx];
    const betPct = Math.round((row[winIdx] / Math.max(1, total)) * 100);

    // DEFAULT shows the contrast in one still: three DIFFERENT words (left) → the SAME bet (right). The
    // interaction "tapar el contexto" then covers the forgotten prefixes, proving all three become the
    // literal same "▨ m" — that's WHY the bet is identical. Default false so the still carries the idea.
    const [blind, setBlind] = useState(false);

    // The verdict caption is gated: it must NOT appear on frame 0 — the reader has to interact first
    // and see the identical bets repeat across multiple words before the conclusion is confirmed.
    const [interacted, setInteracted] = useState(false);

    const next = () => {
        setIdx((i) => (i + 1) % TRIOS.length);
        setBlind(false);
        setInteracted(true);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                maxWidth: 720,
                margin: "0 auto",
                padding: "8px 0 12px",
            }}
        >
            {/* two tiny column headers — affordance for "left = the words / right = what the machine bets" */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 96px 1fr",
                    alignItems: "end",
                    marginBottom: 12,
                }}
            >
                <CaptionLine gap={0} align="left">tres palabras distintas</CaptionLine>
                <span />
                <CaptionLine gap={0} align="left">una sola apuesta</CaptionLine>
            </div>

            {/* ── THE DIAGRAM: 3 rows, each word → blindfold → identical bet ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`rows-${idx}`}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? {} : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.32, ease: STD }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "clamp(14px, 2.6vh, 26px)",
                    }}
                >
                    {trio.rows.map((r, i) => (
                        <WordRow
                            key={`${idx}-${i}`}
                            word={r.word}
                            tail={r.tail}
                            shared={shared}
                            betChar={betChar}
                            betPct={betPct}
                            blind={blind}
                            reduce={reduce}
                            delay={reduce ? 0 : i * 0.06}
                        />
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* the one-line verdict — gated: only appears AFTER the first interaction.
                On frame 0 the identical bets already insinuate the conclusion visually;
                the caption confirms it only once the reader has seen the pattern repeat. */}
            <AnimatePresence>
                {interacted && (
                    <motion.div
                        key="verdict"
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? {} : { opacity: 0 }}
                        transition={{ duration: 0.35, ease: STD }}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 96px 1fr",
                            marginTop: 10,
                        }}
                    >
                        <span />
                        <span />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    width: 14,
                                    height: 1,
                                    background: "var(--ngram-accent)",
                                    opacity: 0.5,
                                    flexShrink: 0,
                                }}
                            />
                            <span
                                style={{
                                    fontFamily: MONO,
                                    fontSize: "clamp(11px, 1.5vw, 13px)",
                                    letterSpacing: ".01em",
                                    color: "var(--ngram-dim)",
                                    lineHeight: 1.4,
                                }}
                            >
                                <span style={{ color: "var(--ngram-accent-ink)", fontWeight: 700 }}>
                                    no las distingue
                                </span>
                                : la misma apuesta para las tres
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CONTROLS ── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    borderTop: "1px solid var(--ngram-rule)",
                    marginTop: 18,
                    paddingTop: 16,
                }}
            >
                <PlayButton
                    onClick={next}
                    aria-label="ver otro trío de palabras que colapsan en la misma apuesta"
                >
                    otra vez
                </PlayButton>
                <GhostButton
                    onClick={() => { setBlind((b) => !b); setInteracted(true); }}
                    aria-label={blind ? "destapar lo que la máquina ignora del contexto" : "tapar el contexto otra vez"}
                >
                    {blind ? "destapar el contexto" : "tapar otra vez"}
                </GhostButton>
            </div>
        </div>
    );
});

/**
 * One row: [readable word, last letter lit] → [blindfold: keeps only the last letter] → [the bet chip].
 *
 * When `blind` is false the masked prefix is revealed (dim) WITH its human continuation, so you see what
 * the machine threw away — three different words heading three different places. When `blind` is true the
 * prefix is covered and only the shared last letter survives; the bet is identical on every row.
 */
function WordRow({
    word,
    tail,
    shared,
    betChar,
    betPct,
    blind,
    reduce,
    delay,
}: {
    word: string;
    tail: string;
    shared: string;
    betChar: string;
    betPct: number;
    blind: boolean;
    reduce: boolean;
    delay: number;
}) {
    const head = word.slice(0, -1); // the part the machine forgets

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 96px 1fr",
                alignItems: "center",
            }}
        >
            {/* LEFT — the word, RIGHT-aligned so the lit last-letter chip lands in a fixed vertical column.
                Reading the column down: am · him · them all funnel through the SAME amber "m". The faint
                tail (amBER, himSELF, theME) overflows to the right WITHOUT shifting the chip, hinting these
                are three different words a person would carry three different ways. */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    fontFamily: MONO,
                    fontWeight: 700,
                    lineHeight: 1,
                    minWidth: 0,
                    // the chip column sits this far from the centre arrow; tail overflows into the gap
                    paddingRight: "clamp(26px, 4vw, 48px)",
                }}
            >
                {/* the forgotten prefix — shown dim, or replaced by the blindfold hatch */}
                <AnimatePresence mode="wait" initial={false}>
                    {blind ? (
                        <motion.span
                            key="mask"
                            initial={reduce ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={reduce ? {} : { opacity: 0 }}
                            transition={{ duration: 0.22, ease: STD }}
                            aria-label="contexto tapado"
                            style={{ display: "inline-flex", alignItems: "center", gap: 2, marginRight: 3 }}
                        >
                            {head.split("").map((_, j) => (
                                <span
                                    key={j}
                                    style={{
                                        display: "inline-block",
                                        width: "clamp(20px, 2.8vw, 30px)",
                                        height: "clamp(30px, 4.2vw, 46px)",
                                        borderRadius: 4,
                                        background:
                                            "repeating-linear-gradient(135deg, var(--ngram-rule-2) 0 5px, transparent 5px 10px)",
                                        border: "1px solid var(--ngram-rule)",
                                    }}
                                />
                            ))}
                        </motion.span>
                    ) : (
                        <motion.span
                            key="head"
                            initial={reduce ? false : { opacity: 0, x: 6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={reduce ? {} : { opacity: 0, x: 6 }}
                            transition={{ duration: 0.22, ease: STD }}
                            style={{
                                fontSize: "clamp(30px, 4.2vw, 46px)",
                                color: "var(--ngram-dim)",
                                whiteSpace: "nowrap",
                                marginRight: 3,
                            }}
                        >
                            {head}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* the surviving last letter — the lit amber chip (the vertical-column anchor) */}
                <span
                    style={{
                        fontSize: "clamp(32px, 4.6vw, 48px)",
                        fontWeight: 800,
                        lineHeight: 1,
                        color: "var(--ngram-on-accent)",
                        background: "var(--ngram-accent)",
                        borderRadius: 9,
                        padding: "2px 10px 4px",
                        flexShrink: 0,
                    }}
                >
                    {displayChar(shared)}
                </span>

                {/* the human continuation — absolutely placed so it never pushes the chip column. Only when
                    the prefix is visible: the road a person would take, that the machine is about to lose. */}
                <AnimatePresence>
                    {!blind && tail && (
                        <motion.span
                            key="tail"
                            initial={reduce ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={reduce ? {} : { opacity: 0 }}
                            transition={{ duration: 0.22, ease: STD, delay: reduce ? 0 : 0.05 }}
                            style={{
                                position: "absolute",
                                left: "calc(100% - clamp(24px, 3.6vw, 44px))",
                                bottom: "clamp(2px, 0.8vh, 7px)",
                                fontSize: "clamp(14px, 1.8vw, 18px)",
                                fontWeight: 500,
                                color: "var(--ngram-accent-2)",
                                opacity: 0.7,
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                            }}
                        >
                            {tail}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* CENTRE — the blindfold arrow: "everything but the last letter is gone" */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <BlindArrow reduce={reduce} delay={delay} />
            </div>

            {/* RIGHT — the bet. IDENTICAL on every row: same letter, same %. The repetition IS the point. */}
            <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: STD, delay: reduce ? 0 : delay + 0.12 }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    justifyContent: "flex-start",
                }}
            >
                <span
                    aria-label={`apuesta: ${displayChar(betChar)}`}
                    style={{
                        fontFamily: MONO,
                        fontSize: "clamp(40px, 6vw, 64px)",
                        fontWeight: 900,
                        lineHeight: 0.9,
                        color: "var(--ngram-accent-bright)",
                        letterSpacing: "-0.03em",
                    }}
                >
                    {displayChar(betChar)}
                </span>
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: "clamp(12px, 1.7vw, 15px)",
                        fontWeight: 700,
                        color: "var(--ngram-accent-ink)",
                        letterSpacing: ".02em",
                        lineHeight: 1.1,
                    }}
                >
                    {betPct}%
                </span>
            </motion.div>
        </div>
    );
}

/** The blindfold connector: a short crop bracket + arrow saying "only the last letter survives". */
function BlindArrow({ reduce, delay }: { reduce: boolean; delay: number }) {
    return (
        <svg
            viewBox="0 0 96 40"
            aria-hidden
            style={{ width: "100%", maxWidth: 96, height: 40, overflow: "visible" }}
        >
            <motion.line
                x1={6}
                y1={20}
                x2={78}
                y2={20}
                stroke="var(--ngram-accent)"
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0.7}
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, ease: STD, delay }}
            />
            <motion.path
                d="M70 13 L80 20 L70 27"
                fill="none"
                stroke="var(--ngram-accent-bright)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: STD, delay: delay + 0.18 }}
            />
        </svg>
    );
}

export default AmnesiaReplay;
