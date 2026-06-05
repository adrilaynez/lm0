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
 * §1 · AmnesiaReplay — ONE idea, felt before reading a word: the machine from the last chapter keeps ONLY
 * the last letter, so three DIFFERENT words collapse into the SAME thing and get the SAME bet. The hero is
 * the LOSS, drawn as a FUNNEL: three distinct words pour in at the top → a blindfold crops each to its last
 * letter → all three merge into ONE bet at the bottom. Three roads in, one road out = "it can't tell them
 * apart". (Rebuild per user: the old version showed the collapse but not the loss.)
 *
 * The bet is REAL — argmax of the 1-letter count row over the Shakespeare corpus. «otra vez» cycles trios;
 * the «¿qué ve ella?» toggle masks the words down to the shared last letter so you SEE why the bet is one.
 */

interface Trio {
    shared: string;            // the surviving last letter
    words: { stem: string; rest: string }[]; // stem ends in `shared`; rest = the (faded) tail of a real word
}

// Curated so (a) the three words are clearly DIFFERENT, (b) all share their last letter, (c) the corpus
// argmax after that letter is a clean, confident LETTER (never a space): t→h · w→h · m→e (verified in v3).
const TRIOS: Trio[] = [
    {
        shared: "t",
        words: [
            { stem: "cat", rest: "alog" },  // catalog
            { stem: "hot", rest: "el" },    // hotel
            { stem: "art", rest: "ist" },   // artist
        ],
    },
    {
        shared: "w",
        words: [
            { stem: "how", rest: "l" },     // howl
            { stem: "new", rest: "s" },     // news
            { stem: "low", rest: "er" },    // lower
        ],
    },
    {
        shared: "m",
        words: [
            { stem: "arm", rest: "y" },     // army
            { stem: "aim", rest: "ing" },   // aiming
            { stem: "sum", rest: "mer" },   // summer
        ],
    },
];

export const AmnesiaReplay = memo(function AmnesiaReplay({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion() === true;

    const [idx, setIdx] = useState(0);
    const [blind, setBlind] = useState(false);
    const [interacted, setInteracted] = useState(false);

    const trio = TRIOS[idx % TRIOS.length];
    const shared = trio.shared;

    // The real machine bet after a 1-letter context.
    const row = useMemo(() => contextRow(1, shared), [shared]);
    const { betChar, betPct } = useMemo(() => {
        const total = row.reduce((a, b) => a + b, 0) || 1;
        let best = 0;
        for (let i = 1; i < row.length; i++) if (row[i] > row[best]) best = i;
        return { betChar: NGRAM_ALPHABET[best], betPct: Math.round((row[best] / total) * 100) };
    }, [row]);

    const next = () => {
        setIdx((i) => (i + 1) % TRIOS.length);
        setBlind(false);
        setInteracted(true);
    };

    return (
        <div style={{ width: "100%", maxWidth: 640, margin: "0 auto", padding: "6px 0 10px" }}>
            <CaptionLine align="center">{blind ? "lo único que recuerda" : "tres palabras distintas"}</CaptionLine>

            {/* ── TOP: three different words pour in ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`words-${idx}`}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? {} : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.3, ease: STD }}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "clamp(8px, 3vw, 28px)",
                        alignItems: "end",
                        marginTop: 14,
                    }}
                >
                    {trio.words.map((w, i) => (
                        <Word key={`${idx}-${i}`} stem={w.stem} rest={w.rest} shared={shared} blind={blind} reduce={reduce} delay={reduce ? 0 : i * 0.05} />
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* ── THE FUNNEL: three lanes converge to one node ── */}
            <Funnel reduce={reduce} />

            {/* ── THE NODE: "only sees the last letter" ── */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: -2 }}>
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "5px 13px",
                        borderRadius: 999,
                        border: "1px solid var(--ngram-rule-2)",
                        background: "color-mix(in oklab, var(--ngram-ink) 3%, transparent)",
                    }}
                >
                    <span style={{ fontFamily: MONO, fontSize: "clamp(10px,1.4vw,12px)", color: "var(--ngram-dim)", letterSpacing: ".02em" }}>
                        solo recuerda
                    </span>
                    <span
                        style={{
                            fontFamily: MONO,
                            fontWeight: 800,
                            fontSize: "clamp(18px,2.6vw,24px)",
                            lineHeight: 1,
                            color: "var(--ngram-on-accent)",
                            background: "var(--ngram-accent)",
                            borderRadius: 7,
                            padding: "1px 9px 3px",
                        }}
                    >
                        {displayChar(shared)}
                    </span>
                </div>
            </div>

            {/* the single stem from node → bet */}
            <div style={{ display: "flex", justifyContent: "center" }}>
                <svg viewBox="0 0 40 30" aria-hidden style={{ width: 40, height: 30 }}>
                    <motion.line
                        x1={20} y1={2} x2={20} y2={22}
                        stroke="var(--ngram-accent)" strokeWidth={2.5} strokeLinecap="round" opacity={0.65}
                        initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: STD }}
                    />
                    <path d="M14 16 L20 23 L26 16" fill="none" stroke="var(--ngram-accent-bright)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            {/* ── ONE BET for all three ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <CaptionLine align="center">una sola apuesta, igual para las tres</CaptionLine>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                    <span
                        style={{
                            fontFamily: MONO,
                            fontSize: "clamp(48px,8vw,76px)",
                            fontWeight: 900,
                            lineHeight: 0.85,
                            color: "var(--ngram-accent-bright)",
                            letterSpacing: "-0.03em",
                        }}
                    >
                        {displayChar(betChar)}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: "clamp(13px,1.9vw,17px)", fontWeight: 700, color: "var(--ngram-accent-ink)" }}>
                        {betPct}%
                    </span>
                </div>
            </div>

            {/* the gated verdict */}
            <AnimatePresence>
                {interacted && (
                    <motion.div
                        key="verdict"
                        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? {} : { opacity: 0 }}
                        transition={{ duration: 0.35, ease: STD }}
                        style={{ display: "flex", justifyContent: "center", marginTop: 12 }}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                            <span aria-hidden style={{ width: 14, height: 1, background: "var(--ngram-accent)", opacity: 0.5 }} />
                            <span style={{ fontFamily: MONO, fontSize: "clamp(11px,1.5vw,13px)", color: "var(--ngram-dim)", lineHeight: 1.4 }}>
                                <span style={{ color: "var(--ngram-accent-ink)", fontWeight: 700 }}>no las distingue</span>
                                : pierde por dónde iban
                            </span>
                        </span>
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
                <PlayButton onClick={next} aria-label="ver otras tres palabras que colapsan en la misma apuesta">
                    otra vez
                </PlayButton>
                <GhostButton
                    onClick={() => { setBlind((b) => !b); setInteracted(true); }}
                    aria-label={blind ? "ver las palabras enteras" : "ver solo lo que la máquina recuerda"}
                >
                    {blind ? "ver las palabras" : "¿qué ve ella?"}
                </GhostButton>
            </div>
        </div>
    );
});

/** One word: the real word, with the part the machine forgets dimmed and the surviving last letter lit.
 *  When `blind`, the forgotten head is replaced by a hatch so all three collapse to the same last letter. */
function Word({ stem, rest, shared, blind, reduce, delay }: { stem: string; rest: string; shared: string; blind: boolean; reduce: boolean; delay: number }) {
    const head = stem.slice(0, -1); // forgotten

    return (
        <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: STD, delay }}
            style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                fontFamily: MONO,
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: "nowrap",
                minWidth: 0,
            }}
        >
            <AnimatePresence mode="wait" initial={false}>
                {blind ? (
                    <motion.span
                        key="hatch"
                        initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? {} : { opacity: 0 }} transition={{ duration: 0.2 }}
                        aria-hidden
                        style={{
                            display: "inline-block",
                            width: "clamp(16px,2.4vw,26px)",
                            height: "clamp(22px,3vw,32px)",
                            marginRight: 2,
                            borderRadius: 4,
                            border: "1px solid var(--ngram-rule)",
                            background: "repeating-linear-gradient(135deg, var(--ngram-rule-2) 0 5px, transparent 5px 10px)",
                            alignSelf: "center",
                        }}
                    />
                ) : (
                    <motion.span
                        key="head"
                        initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? {} : { opacity: 0 }} transition={{ duration: 0.2 }}
                        style={{ fontSize: "clamp(20px,3vw,30px)", color: "var(--ngram-dim)" }}
                    >
                        {head}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* surviving last letter — lit */}
            <span
                style={{
                    fontSize: "clamp(22px,3.4vw,34px)",
                    fontWeight: 800,
                    color: "var(--ngram-on-accent)",
                    background: "var(--ngram-accent)",
                    borderRadius: 7,
                    padding: "1px 7px 3px",
                    alignSelf: "center",
                }}
            >
                {displayChar(shared)}
            </span>

            {/* faded rest of the real word — only when not blind */}
            {!blind && (
                <span style={{ fontSize: "clamp(15px,2vw,20px)", fontWeight: 500, color: "var(--ngram-muted)", opacity: 0.5 }}>
                    {rest}
                </span>
            )}
        </motion.div>
    );
}

/** The funnel: three lanes from the three words converge to a single point. The convergence is the loss. */
function Funnel({ reduce }: { reduce: boolean }) {
    return (
        <svg viewBox="0 0 300 56" aria-hidden preserveAspectRatio="none" style={{ width: "100%", height: 56, marginTop: 6, overflow: "visible" }}>
            {[50, 150, 250].map((x, i) => (
                <motion.path
                    key={i}
                    d={`M${x} 4 Q ${x} 34 150 52`}
                    fill="none"
                    stroke="var(--ngram-accent)"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    opacity={0.5}
                    initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 0.5, ease: STD, delay: i * 0.06 }}
                />
            ))}
            <circle cx={150} cy={52} r={3} fill="var(--ngram-accent-bright)" />
        </svg>
    );
}

export default AmnesiaReplay;
