"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { GhostButton, PlayButton } from "@/features/lab/components/bigram/kit/Buttons";
import { MarkedText, type MarkState } from "@/features/lab/components/bigram/kit/MarkedText";
import { heat, MONO, SERIF, STD } from "@/features/lab/components/bigram/kit/tokens";
import {
    ALPHA_27,
    dchar,
    rowTotal,
    sampleRow,
    topFollowers,
} from "@/features/lab/data/bigramShakespeare27";
import { useI18n } from "@/i18n/context";

/**
 * TableWriter (VIS 11) — "La máquina de escribir".
 *
 * The full-speed pair to VIS 10.5 (LetterByLetter). Entering, the reader has seen ONE generation step in slow
 * motion: look at the current letter's row → count → % → roll the die → append; and the picked letter becomes
 * the next input. What is NEW here is the LOOP run without brakes: chain that one gesture and the machine
 * writes a whole passage on its own. The honest payoff — "looks like a language from afar, gibberish up close"
 * — sets up the anticlimax ("vaya mierda… pero es increíble") and the naming "modelo de bigramas".
 *
 * The ONE concept: that single step, chained → it writes by itself, and it is STILL just looking up the table.
 *
 * Final image: a big serif line of generated text has streamed out letter by letter (the hero); below it a
 * compact, fast "from the table" glimpse shows the current source letter and its top followers as a small
 * heat strip, with the just-picked cell flashing — quiet proof that every letter still came from the table.
 *
 * Why local generation (not the backend GenerationPlayground): the backend bigram is an undertrained neural
 * softmax → noisy. The real count-table (the SAME 27×27 Shakespeare matrix §3/§4/VIS10.5 use) gives the clean,
 * honest "language-like gibberish" the narrative needs, offline.
 *
 * Reuses VIS 10.5's visual language so they read as siblings: same data, same heat ramp, same dchar/space
 * idiom, the source→picked pairing. But the glimpse is SECONDARY and FAST — VIS 10.5 is the explained version;
 * here the streaming text is the focal point.
 *
 * Tokens-only (--bigram-*), scoped by [data-bigram-theme]. Reduced-motion settles to a finished passage with
 * the final glimpse (no rng in render, no synchronous setState in an effect body — a keyed rAF/timer driver).
 * Self-mounting, memo, "use client".
 */

const DEFAULT_SEED = 20; // «t»
const SEED_CHOICES = [20, 19, 23, 8]; // t s w h — expressive starts
const FALLBACK_SEED = 1; // «a» — reseed if a sampled letter dead-ends (empty row)
const PASSAGE_LEN = 56; // letters in a full generated passage
const STEP_MS = 105; // pace: ~9–10 letters/sec — fast but you see each one land
const GLIMPSE_TOP_K = 6; // followers shown in the compact "from the table" strip
const REDUCED_LEN = 48; // letters pre-generated in the settled reduced-motion state

/** Generate a passage of alphabet indices by repeatedly sampling the real table. */
function generatePassage(seed: number, len: number, rng: () => number): number[] {
    let prev = rowTotal(seed) > 0 ? seed : FALLBACK_SEED;
    const out = [prev];
    for (let i = 1; i < len; i++) {
        let next = sampleRow(prev, rng());
        if (rowTotal(next) === 0) next = FALLBACK_SEED; // never dead-end the chain
        out.push(next);
        prev = next;
    }
    return out;
}

/** Deterministic stream for reduced motion (no Math.random in render). */
function deterministicPassage(seed: number, len: number): number[] {
    let s = 0.123;
    return generatePassage(seed, len, () => {
        s = (s * 9301 + 0.49297) % 1; // cheap LCG-ish, stable across renders
        return s;
    });
}

export interface TableWriterProps {
    accent?: "bigram";
}

export const TableWriter = memo(function TableWriter({ accent = "bigram" }: TableWriterProps) {
    void accent;
    const { t } = useI18n();
    const reduce = useReducedMotion();

    /** The whole passage to play (decided up front so the stream + glimpse always agree). */
    const [passage, setPassage] = useState<number[]>(() => [DEFAULT_SEED]);
    /** How many of `passage` have streamed out so far. */
    const [shown, setShown] = useState(1);
    const [running, setRunning] = useState(false);
    const [seed, setSeed] = useState(DEFAULT_SEED);

    /* ── timer driver (latest-closure ref; the callback sets state — never the effect body) ── */
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);
    const stopTimer = useCallback(() => {
        if (timer.current) {
            clearInterval(timer.current);
            timer.current = null;
        }
    }, []);
    useEffect(() => stopTimer, [stopTimer]);

    /** Begin a fresh passage from `from` and stream it letter by letter. */
    const begin = useCallback(
        (from: number) => {
            stopTimer();
            const full = generatePassage(from, PASSAGE_LEN, Math.random);
            setPassage(full);
            setShown(1);
            setRunning(true);
            // stream the rest on an interval; the callback sets state (effect body never does)
            timer.current = setInterval(() => {
                setShown((n) => {
                    const next = n + 1;
                    if (next >= full.length) {
                        stopTimer();
                        setRunning(false);
                        return full.length;
                    }
                    return next;
                });
            }, STEP_MS);
        },
        [stopTimer],
    );

    const onWrite = useCallback(() => {
        if (running) return;
        begin(seed);
    }, [running, begin, seed]);

    const onAgain = useCallback(() => {
        begin(seed); // fresh random draw from the same seed
    }, [begin, seed]);

    const onSeed = useCallback(
        (s: number) => {
            stopTimer();
            setSeed(s);
            setRunning(false);
            setPassage([s]);
            setShown(1);
        },
        [stopTimer],
    );

    /* ── what to render: live stream, or (reduced motion) a settled deterministic passage ── */
    const reducedPassage = useMemo(
        () => (reduce ? deterministicPassage(DEFAULT_SEED, REDUCED_LEN) : null),
        [reduce],
    );
    const stream = reducedPassage ?? passage;
    const visible = reduce ? stream.length : Math.min(shown, stream.length);
    const letters = stream.slice(0, visible);
    const lastIdx = letters.length - 1;

    /* The letter just produced (the wet ink) and the one it was sampled FROM (the glimpse source). */
    const picked = letters[lastIdx];
    const source = letters.length >= 2 ? letters[lastIdx - 1] : seed;
    // before any letter beyond the seed exists, the glimpse previews the SEED's row (no pick yet)
    const hasPick = letters.length >= 2 || reduce;

    /* ── the growing text (the hero): the freshest letter is hot1 (wet ink), the rest past ── */
    const text = letters.map((i) => (i === 0 ? " " : ALPHA_27[i])).join("");
    const textState = useCallback(
        (i: number): MarkState => (i === text.length - 1 ? "hot1" : "past"),
        [text],
    );

    /* ── the glimpse: the source letter's top followers as a compact heat strip ── */
    const followers = useMemo(() => topFollowers(source, GLIMPSE_TOP_K), [source]);
    const glimpseMax = followers.length ? followers[0].count : 1;

    return (
        <div className="bw-tw" style={{ fontFamily: SERIF }}>
            {/* No eyebrow / lead here on purpose: the narrative BODY before this widget frames it.
                In-widget text stays at the functional minimum (the visual speaks for itself). */}

            {/* ── THE PASSAGE (the hero) — streams letter by letter, big and legible ── */}
            <div className="bw-tw__pagewrap">
                <div className="bw-tw__page">
                    <MarkedText
                        text={text}
                        stateOf={textState}
                        size="clamp(22px, 3.1vw, 32px)"
                        lineHeight={1.5}
                        maxWidth={760}
                    />
                    {!reduce && running && <span className="bw-tw__caret" aria-hidden />}
                </div>
            </div>

            {/* ── THE GLIMPSE (secondary) — proof each letter still came from the table:
                the source letter's row of top followers; the picked cell lights. ── */}
            <div className="bw-tw__glimpse" data-on={letters.length >= 1 ? "1" : "0"}>
                <span className="bw-tw__glimpselbl">{t("bigramNarrative.v2.tableWriter.glimpseLabel")}</span>
                <div className="bw-tw__strip">
                    <span className="bw-tw__source">
                        <i>{t("bigramNarrative.v2.tableWriter.glimpseFrom")}</i>
                        <b data-space={source === 0 ? "1" : "0"}>{dchar(source)}</b>
                    </span>
                    <span className="bw-tw__arrow" aria-hidden>→</span>
                    <div className="bw-tw__cells">
                        <AnimatePresence initial={false} mode="wait">
                            <motion.div
                                key={source}
                                className="bw-tw__cellrow"
                                initial={reduce ? false : { opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                                transition={{ duration: 0.18, ease: STD }}
                            >
                                {followers.map((f) => {
                                    const landed = hasPick && f.idx === picked;
                                    return (
                                        <span
                                            key={f.idx}
                                            className="bw-tw__cell"
                                            data-landed={landed ? "1" : "0"}
                                            data-space={f.idx === 0 ? "1" : "0"}
                                        >
                                            <motion.span
                                                className="bw-tw__chip"
                                                style={{ background: heat(f.count / glimpseMax) }}
                                                animate={
                                                    landed && !reduce
                                                        ? { scale: [1, 1.18, 1] }
                                                        : { scale: 1 }
                                                }
                                                transition={{ duration: 0.32, ease: STD }}
                                            >
                                                {dchar(f.idx)}
                                            </motion.span>
                                        </span>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── controls ── */}
            {!reduce && (
                <div className="bw-tw__foot">
                    <PlayButton onClick={onWrite} disabled={running}>
                        {t("bigramNarrative.v2.tableWriter.write")}
                    </PlayButton>
                    <GhostButton onClick={onAgain} disabled={running}>
                        ↻ {t("bigramNarrative.v2.tableWriter.again")}
                    </GhostButton>
                </div>
            )}

            {/* ── seed chips (quiet, below the action; only when idle at the start) ── */}
            {!reduce && !running && letters.length <= 1 && (
                <div className="bw-tw__seeds">
                    <span className="bw-tw__seedlbl">{t("bigramNarrative.v2.tableWriter.seedPrompt")}</span>
                    <div className="bw-tw__chips">
                        {SEED_CHOICES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className="bw-tw__chip"
                                data-on={s === seed ? "1" : "0"}
                                onClick={() => onSeed(s)}
                            >
                                {dchar(s)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── the honest coda — once a real passage exists ── */}
            {(reduce || (!running && letters.length >= 8)) && (
                <motion.p
                    className="bw-tw__coda"
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {t("bigramNarrative.v2.tableWriter.coda")}
                </motion.p>
            )}

            <style>{`
                .bw-tw { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 780px; margin: 0 auto; width: 100%; }
                .bw-tw__lead { font-family: ${SERIF}; font-style: italic; font-size: clamp(15px, 1.9vw, 17px); color: var(--bigram-muted); margin: 0 auto 32px; max-width: 48ch; line-height: 1.5; }

                /* THE PASSAGE — the hero */
                .bw-tw__pagewrap { width: 100%; margin: 0 auto 30px; }
                .bw-tw__pagelbl { display: block; font-family: ${MONO}; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 14px; }
                .bw-tw__page { position: relative; display: flex; align-items: baseline; justify-content: center; min-height: 132px; padding: 0 4px; }
                .bw-tw__caret { display: inline-block; width: 3px; height: 0.86em; margin-left: 2px; align-self: center; background: var(--bigram-accent); border-radius: 2px; animation: bwTwBlink 1s steps(2) infinite; }
                @keyframes bwTwBlink { 50% { opacity: 0; } }

                /* THE GLIMPSE — secondary proof */
                .bw-tw__glimpse { width: 100%; max-width: 560px; margin: 0 auto; opacity: 0; transition: opacity .3s ease; }
                .bw-tw__glimpse[data-on="1"] { opacity: 1; }
                .bw-tw__glimpselbl { display: block; font-family: ${MONO}; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 12px; }
                .bw-tw__strip { display: inline-flex; align-items: center; gap: 12px; padding: 12px 18px; border-radius: var(--bigram-r-md); background: color-mix(in oklab, var(--bigram-surface) 60%, var(--bigram-bg)); }
                .bw-tw__source { display: inline-flex; align-items: baseline; gap: 6px; }
                .bw-tw__source i { font-family: ${MONO}; font-style: normal; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--bigram-dim); }
                .bw-tw__source b { font-family: ${MONO}; font-size: 22px; font-weight: 700; color: var(--bigram-accent); }
                .bw-tw__source b[data-space="1"] { color: var(--bigram-accent); }
                .bw-tw__arrow { font-family: ${MONO}; font-size: 16px; color: var(--bigram-dim); }
                .bw-tw__cells { min-width: 0; }
                .bw-tw__cellrow { display: inline-flex; gap: 6px; }
                .bw-tw__cell { position: relative; }
                .bw-tw__chip { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: var(--bigram-r-sm); font-family: ${MONO}; font-size: 16px; font-weight: 700; color: var(--bigram-on-accent); box-shadow: inset 0 0 0 0 transparent; transition: box-shadow .2s ease, filter .2s ease; }
                .bw-tw__cell[data-landed="1"] .bw-tw__chip { box-shadow: inset 0 0 0 2.5px var(--bigram-accent-ink); filter: brightness(1.1); }
                .bw-tw__cell[data-landed="0"] .bw-tw__chip { opacity: .82; }

                /* CONTROLS */
                .bw-tw__foot { display: inline-flex; align-items: center; gap: 14px; margin-top: 30px; flex-wrap: wrap; justify-content: center; }

                /* SEEDS */
                .bw-tw__seeds { margin-top: 24px; }
                .bw-tw__seedlbl { display: block; font-family: ${MONO}; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 12px; }
                .bw-tw__chips { display: inline-flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
                .bw-tw__chip { font-family: ${MONO}; font-size: 16px; font-weight: 700; width: 38px; height: 38px; border-radius: var(--bigram-r-sm); border: 0; cursor: pointer; color: var(--bigram-ink-2); background: var(--bigram-bg-2); transition: background .2s ease, color .2s ease; }
                .bw-tw__chip:hover { background: var(--bigram-accent-soft); color: var(--bigram-accent-ink); }
                .bw-tw__chip[data-on="1"] { background: var(--bigram-accent); color: var(--bigram-on-accent); }

                /* CODA */
                .bw-tw__coda { font-family: ${SERIF}; font-size: clamp(15px, 2vw, 18px); color: var(--bigram-ink); margin: 34px auto 0; max-width: 46ch; line-height: 1.5; text-wrap: pretty; }

                @media (max-width: 520px) {
                    .bw-tw__chip, .bw-tw__cell .bw-tw__chip { width: 32px; height: 32px; font-size: 14px; }
                    .bw-tw__strip { gap: 8px; padding: 10px 12px; }
                }
            `}</style>
        </div>
    );
});

export default TableWriter;
