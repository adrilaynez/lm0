"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { GhostButton, PlayButton } from "@/features/lab/components/bigram/kit/Buttons";
import { FixedAlphabetRow } from "@/features/lab/components/bigram/kit/FixedAlphabetRow";
import { MarkedText, type MarkState } from "@/features/lab/components/bigram/kit/MarkedText";
import { displayChar, MONO, SERIF, STD } from "@/features/lab/components/bigram/kit/tokens";
import {
    ALPHA_27,
    dchar,
    MATRIX_27_COUNTS,
    rowProbs,
    rowTotal,
    sampleRow,
} from "@/features/lab/data/bigramShakespeare27";
import { useI18n } from "@/i18n/context";

/**
 * LetterByLetter (VIS 10.5) — "Letra a letra, paso a paso".
 *
 * BRIDGE between §4 (the full 27×27 table = the rules) and §5 (writing at full speed). Entering, the reader
 * already knows: count → percentages → loaded-die FOR A SINGLE LETTER (§3), and the whole table (§4). What is
 * new here is the LOOP made visible: ONE complete generation step, in slow motion, repeated — so "writing"
 * stops being magic and becomes "this one gesture, over and over".
 *
 * The ONE concept: a single generation step has five named moments, and the OUTPUT of the step (the picked
 * letter) becomes the INPUT of the next. Watch it once slowly and you've understood generation.
 *
 *   1 · LOOK   — the current letter's row is pulled from the table as a FixedAlphabetRow (27 fixed slots).
 *   2 · COUNT  — the real integer follower counts read out on that row (winner emphasised).
 *   3 · CALC   — counts → percentages: the same row, re-expressed (echoes NormalizationVisualizer).
 *   4 · ROLL   — a 0–100 die lands weighted by the % onto a cumulative bar (echoes LoadedDie); honest.
 *   5 · APPEND — the picked letter springs into the growing word and becomes the new current letter.
 *
 * PACING (reworked): the step is READER-DRIVEN. One "Siguiente" tap reveals the NEXT moment of the step, so
 * each phase is read at the reader's own pace; the FIRST whole letter is fully manual, phase by phase. Only
 * after that first letter completes does "Seguir solo" appear — and auto mode dwells long enough to READ each
 * phase (longest on the count/percentage/die moments). The figure never races.
 *
 * FIT (reworked): instead of stacking row + die + caption all at once (too tall), a SINGLE focal panel morphs
 * as the step advances — the growing word stays pinned at the top, and below it one panel shows ONLY the
 * current moment's visual (the row → the row as % → the die → the append). Fits a 1280×800 laptop viewport
 * without shrinking the hero: chrome is removed/condensed, not the focal visual.
 *
 * Real data: the shared 27×27 Shakespeare matrix (bigramShakespeare27) — the SAME table §3/§4 use.
 * Tokens-only (--bigram-*), scoped by [data-bigram-theme]. Reduced-motion settles to a finished word with
 * the final row shown (no info lost). Self-mounting, memo, "use client".
 */

/* ─── Phases of one step ─── */
type Phase = "look" | "count" | "calc" | "roll" | "append";
const PHASE_ORDER: Phase[] = ["look", "count", "calc", "roll", "append"];

/* Auto-run dwell (ms) per phase — paced by how much there is to read; never a blur.
   The count / percentage / die moments carry the most to read, so they dwell longest. */
const AUTO_DWELL: Record<Phase, number> = {
    look: 1700,
    count: 2200,
    calc: 2200,
    roll: 2400,
    append: 1700,
};
const AUTO_BETWEEN = 600; // pause between one letter's APPEND and the next letter's LOOK

const TOP_K_BAR = 8; // faces drawn on the die bar; the long tail is one "rest" slab
const MAX_LETTERS = 14; // cap the word length so it stays one tidy line
const REDUCED_LEN = 7; // letters pre-generated in the reduced-motion settled state

/** A default seed that has a rich, recognisable row (after «t» → «h» dominates). */
const DEFAULT_SEED = 20; // «t»
/** Letters offered as start chips (common, expressive rows). */
const SEED_CHOICES = [20, 1, 19, 23, 8, 15]; // t a s w h o
const FALLBACK_SEED = 1; // «a» — if a sampled letter has an empty row, restart from here

/* ─── Cumulative die layout for a given row (echo of LoadedDie's SEGS, computed per current letter). ─── */
interface Seg {
    idx: number; // -1 = the long-tail rest slab
    prob: number;
    start: number; // cumulative left edge 0..1
    isRest: boolean;
}
/** Every present follower of a row, biggest-first, with cumulative ranges (the 0→1 number line). */
function rangedFollowers(rowIndex: number): Seg[] {
    const total = rowTotal(rowIndex) || 1;
    const full = MATRIX_27_COUNTS[rowIndex]
        .map((count, idx) => ({ idx, prob: count / total }))
        .filter((x) => x.prob > 0)
        .sort((a, b) => b.prob - a.prob);
    let acc = 0;
    return full.map((f) => {
        const it = { idx: f.idx, prob: f.prob, start: acc, isRest: false };
        acc += f.prob;
        return it;
    });
}
function dieSegsFor(rowIndex: number): { segs: Seg[]; maxP: number } {
    const ranged = rangedFollowers(rowIndex);
    const top = ranged.slice(0, TOP_K_BAR);
    const restStart = ranged[TOP_K_BAR] ? ranged[TOP_K_BAR].start : 1;
    const rest = 1 - restStart;
    if (rest > 0.002) top.push({ idx: -1, prob: rest, start: restStart, isRest: true });
    const maxP = ranged.length ? ranged[0].prob : 1;
    return { segs: top, maxP };
}
/**
 * Which displayed segment a roll r∈[0,1) lights, and the letter it picks. Both derive from the SAME
 * probability-sorted cumulative ranges (like LoadedDie), so the visible landing and the chosen letter
 * always agree — never the index-order walk of sampleRow, which would disagree with the sorted bar.
 */
function landFor(rowIndex: number, r: number): { letter: number; seg: number } {
    const ranged = rangedFollowers(rowIndex);
    let rank = ranged.findIndex((f) => r >= f.start && r < f.start + f.prob);
    if (rank < 0) rank = ranged.length - 1;
    const letter = ranged.length ? ranged[rank].idx : FALLBACK_SEED;
    const seg = rank < TOP_K_BAR ? rank : TOP_K_BAR; // top-K exact, else the rest slab (last index)
    return { letter, seg };
}
function segColor(s: Seg, maxP: number): string {
    if (s.isRest) return "color-mix(in oklab, var(--bigram-accent) 16%, var(--bigram-bg-2))";
    const k = Math.round(34 + (s.prob / maxP) * 66);
    return `color-mix(in oklab, var(--bigram-accent-bright) ${k}%, var(--bigram-bg-2))`;
}

export interface LetterByLetterProps {
    accent?: "bigram";
}

export const LetterByLetter = memo(function LetterByLetter({ accent = "bigram" }: LetterByLetterProps) {
    void accent;
    const { t } = useI18n();
    const reduce = useReducedMotion();

    /* The written word as a list of alphabet indices. Last element = the latest committed letter. */
    const [letters, setLetters] = useState<number[]>([DEFAULT_SEED]);
    // phaseIdx: -1 = idle (between letters, nothing showing). 0..4 = the active moment of the step.
    const [phaseIdx, setPhaseIdx] = useState<number>(-1);
    const [running, setRunning] = useState(false); // "Seguir solo" auto-chaining
    const [firstDone, setFirstDone] = useState(false); // the first whole letter has been stepped through
    const [roll, setRoll] = useState<number>(-1); // the die number 0..99 for the current step
    const [picked, setPicked] = useState<number>(-1); // the letter the die landed on this step
    // the letter THIS step is reading FROM; the row + die stay on it through APPEND, even after the
    // chosen letter has sprung into the word, so the figure never flips to the next letter mid-step.
    const [source, setSource] = useState<number>(DEFAULT_SEED);

    const active = phaseIdx >= 0;
    const phase: Phase | null = active ? PHASE_ORDER[phaseIdx] : null;

    // while a step is active the figure reads its pinned `source`; at idle it reads the latest committed letter.
    const current = active ? source : letters[letters.length - 1];
    const probs = useMemo(() => rowProbs(current), [current]);
    const total = useMemo(() => rowTotal(current), [current]);
    const { segs, maxP } = useMemo(() => dieSegsFor(current), [current]);

    // CALC onward re-expresses the row as % — the SHAPE is identical to counts (prob = count/total is a
    // uniform scaling); the point of the phase is that the UNITS change, not the bars.
    const asPct = phase === "calc" || phase === "roll" || phase === "append";

    /* ── timers (latest-closure refs; the callback sets state — never the effect body) ── */
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const clearTimers = useCallback(() => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    }, []);
    useEffect(() => clearTimers, [clearTimers]);

    /** Roll the die for a fresh letter: decide the outcome up front so the bar + word agree. */
    const rollFor = useCallback((from: number) => {
        const r = Math.random();
        const { letter } = landFor(from, r);
        setRoll(Math.floor(r * 100));
        setPicked(letter);
        return letter;
    }, []);

    /** Commit the picked letter into the word; reseed if its own row is empty (would dead-end). */
    const commit = useCallback((letter: number) => {
        setLetters((prev) => {
            const safe = rowTotal(letter) > 0 ? letter : FALLBACK_SEED;
            const list = [...prev, safe];
            return list.length > MAX_LETTERS ? list.slice(list.length - MAX_LETTERS) : list;
        });
    }, []);

    /**
     * Advance ONE moment. Pure-ish state transition (no timers) so it serves both the manual tap and the
     * auto driver. Returns the phase index it moved TO (so the auto driver can schedule the next dwell).
     */
    const advance = useCallback((): number => {
        if (phaseIdx < 0) {
            // idle → start the step on the latest committed letter: pin it, roll, show LOOK.
            const from = letters[letters.length - 1];
            setSource(from);
            rollFor(from);
            setPhaseIdx(0);
            return 0;
        }
        if (phaseIdx < PHASE_ORDER.length - 1) {
            const next = phaseIdx + 1;
            // entering APPEND commits the picked letter into the word and ends the first-letter milestone.
            if (PHASE_ORDER[next] === "append") {
                if (picked >= 0) commit(picked);
                setFirstDone(true);
            }
            setPhaseIdx(next);
            return next;
        }
        // we were on APPEND → begin the NEXT letter's step on the freshly committed source.
        const from = letters[letters.length - 1];
        setSource(from);
        rollFor(from);
        setPhaseIdx(0);
        return 0;
    }, [phaseIdx, letters, picked, rollFor, commit]);

    /* ── auto-run driver: when `running` is on, schedule the next advance after this phase's dwell ──
       Latest-closure ref + setTimeout (never a synchronous setState in the effect body). The dwell is the
       reading time for the phase we're currently SHOWING; entering APPEND-then-next adds AUTO_BETWEEN. ── */
    useEffect(() => {
        if (!running || reduce) return;
        if (letters.length >= MAX_LETTERS) {
            const stop = setTimeout(() => setRunning(false), 0);
            timers.current.push(stop);
            return () => clearTimeout(stop);
        }
        const showing = phaseIdx >= 0 ? PHASE_ORDER[phaseIdx] : "append";
        const dwell = (phaseIdx >= 0 ? AUTO_DWELL[showing] : AUTO_BETWEEN) + (showing === "append" ? AUTO_BETWEEN : 0);
        const id = setTimeout(() => advance(), dwell);
        timers.current.push(id);
        return () => clearTimeout(id);
    }, [running, reduce, phaseIdx, letters.length, advance]);

    const onNext = useCallback(() => {
        if (running) return;
        advance();
    }, [running, advance]);

    const onAuto = useCallback(() => {
        if (running) {
            setRunning(false);
            return;
        }
        if (letters.length >= MAX_LETTERS) return;
        setRunning(true);
    }, [running, letters.length]);

    const onReset = useCallback(
        (seed?: number) => {
            clearTimers();
            setRunning(false);
            setFirstDone(false);
            setPhaseIdx(-1);
            setRoll(-1);
            setPicked(-1);
            const s = seed ?? DEFAULT_SEED;
            setSource(s);
            setLetters([s]);
        },
        [clearTimers],
    );

    /* ── reduced motion: settle to a finished word + show the final letter's row, no animation ── */
    const reducedWord = useMemo(() => {
        if (!reduce) return null;
        let cur = DEFAULT_SEED;
        const out = [cur];
        for (let i = 0; i < REDUCED_LEN - 1; i++) {
            const next = sampleRow(cur, (i * 0.137 + 0.21) % 1); // deterministic, no rng in render
            cur = rowTotal(next) > 0 ? next : FALLBACK_SEED;
            out.push(cur);
        }
        return out;
    }, [reduce]);

    const shownLetters = reducedWord ?? letters;
    const shownCurrent = shownLetters[shownLetters.length - 1];

    /* ── the growing word: every letter `past`, the current one `hot1` ── */
    const wordText = shownLetters.map((i) => (i === 0 ? " " : ALPHA_27[i])).join("");
    const wordState = useCallback(
        (i: number): MarkState => {
            const last = wordText.length - 1;
            if (i === last) return "hot1";
            return "past";
        },
        [wordText],
    );

    // For reduced motion, render the final row as percentages (no phases).
    const effPhase: Phase = reduce ? "calc" : phase ?? "look";
    const effAsPct = reduce ? true : asPct;
    const effCurrent = reduce ? shownCurrent : current;
    const effCounts = MATRIX_27_COUNTS[effCurrent];
    const effProbs = reduce ? rowProbs(effCurrent) : probs;
    const effTotal = reduce ? rowTotal(effCurrent) : total;
    const effWinner = useMemo(() => {
        let w = 0;
        for (let i = 1; i < effCounts.length; i++) if (effCounts[i] > effCounts[w]) w = i;
        return w;
    }, [effCounts]);

    // bars data for the row: counts (LOOK/COUNT) or % scaled to per-mille for legible integers (CALC+)
    const rowDisplayCounts = effAsPct ? effProbs.map((p) => Math.round(p * 1000)) : effCounts;

    // which face of the panel is showing: the row (look/count/calc) or the die (roll/append).
    const showDie = !reduce && (effPhase === "roll" || effPhase === "append");
    const panelFace = reduce ? "row" : showDie ? "die" : "row";

    const captionText = t(`bigramNarrative.v2.letterStep.${captionKeyMap[effPhase]}`);

    // controls: idle vs mid-step copy; "Seguir solo" only after the first letter has been stepped through.
    const idle = phaseIdx < 0;
    const nextLabel = idle
        ? letters.length <= 1
            ? t("bigramNarrative.v2.letterStep.startStep")
            : t("bigramNarrative.v2.letterStep.nextLetter")
        : t("bigramNarrative.v2.letterStep.nextPhase");
    const showAuto = firstDone && !reduce;

    return (
        <div className="bw-lbl" style={{ fontFamily: SERIF }}>
            {/* No eyebrow / lead: the narrative body before this widget frames it (texto = cuerpo). */}

            {/* ── THE WORD (pinned hero on top) — grows letter by letter; current letter highlighted ── */}
            <div className="bw-lbl__wordwrap">
                <span className="bw-lbl__wordlbl">{t("bigramNarrative.v2.letterStep.wordLabel")}</span>
                <div className="bw-lbl__word">
                    <MarkedText
                        text={wordText}
                        stateOf={wordState}
                        size="clamp(26px, 4vw, 40px)"
                        maxWidth={760}
                    />
                    {!reduce && active && <span className="bw-lbl__caret" aria-hidden />}
                </div>
            </div>

            {/* ── THE STEP TRACK — five named moments; the active one fills (compact) ── */}
            <div className="bw-lbl__track" aria-hidden>
                {PHASE_ORDER.map((p, i) => {
                    const idx = active ? phaseIdx : reduce ? 2 : -1;
                    const state = idx < 0 ? "0" : i < idx ? "done" : i === idx ? "on" : "0";
                    return (
                        <span key={p} className="bw-lbl__step" data-state={state}>
                            {t(`bigramNarrative.v2.letterStep.${STEP_LABEL[p]}`)}
                        </span>
                    );
                })}
            </div>

            {/* ── THE SINGLE FOCAL PANEL — shows ONLY the current moment's visual; it morphs as the step
                advances (the row → row as % → the die → the append), reusing the same vertical space. ── */}
            <div className="bw-lbl__panel">
                <AnimatePresence mode="wait" initial={false}>
                    {panelFace === "row" ? (
                        <motion.div
                            key="face-row"
                            className="bw-lbl__face"
                            initial={reduce ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                            transition={{ duration: 0.26, ease: STD }}
                        >
                            <div className="bw-lbl__rowhead">
                                <span className="bw-lbl__rowfrom">{displayChar(ALPHA_27[effCurrent])} →</span>
                                <span className="bw-lbl__rowtotal">
                                    {effAsPct ? "100.0 %" : `${effTotal.toLocaleString()} ×`}
                                </span>
                            </div>
                            <FixedAlphabetRow
                                cols={ALPHA_27}
                                counts={rowDisplayCounts}
                                winner={effWinner}
                                height={118}
                                maxWidth={680}
                            />
                            <div className="bw-lbl__rowreadout">
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                        key={`${effCurrent}-${effAsPct ? "p" : "c"}`}
                                        className="bw-lbl__rowstat"
                                        initial={reduce ? false : { opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {displayChar(ALPHA_27[effCurrent])} → <b>{dchar(effWinner)}</b>
                                        {effAsPct ? (
                                            <>
                                                {"  "}
                                                {(effProbs[effWinner] * 100).toFixed(1)} %
                                            </>
                                        ) : (
                                            <>
                                                {"  "}
                                                {effCounts[effWinner].toLocaleString()} ×
                                            </>
                                        )}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="face-die"
                            className="bw-lbl__face"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.26, ease: STD }}
                        >
                            <div className="bw-lbl__flaglane" aria-hidden>
                                <motion.div
                                    className="bw-lbl__flag"
                                    data-on={roll >= 0 ? "1" : "0"}
                                    animate={{ left: `${roll >= 0 ? roll : 50}%` }}
                                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 26 }}
                                >
                                    <span className="bw-lbl__num">{roll >= 0 ? roll : "·"}</span>
                                    <span className="bw-lbl__needle" />
                                </motion.div>
                            </div>
                            <div className="bw-lbl__bar">
                                {segs.map((s) => {
                                    const isLanded =
                                        !s.isRest && picked === s.idx
                                            ? true
                                            : s.isRest && picked >= 0 && !segs.some((g) => !g.isRest && g.idx === picked);
                                    const wide = s.prob > 0.07;
                                    return (
                                        <div
                                            key={s.isRest ? "rest" : s.idx}
                                            className="bw-lbl__seg"
                                            data-landed={isLanded ? "1" : "0"}
                                            data-rest={s.isRest ? "1" : "0"}
                                            style={{ flexGrow: s.prob, background: segColor(s, maxP) }}
                                        >
                                            {wide && !s.isRest && (
                                                <span className="bw-lbl__segface">
                                                    <b>{dchar(s.idx)}</b>
                                                    <i>{(s.prob * 100).toFixed(0)}%</i>
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                <span className="bw-lbl__baridx" aria-hidden>
                                    {[0, 25, 50, 75, 100].map((n) => (
                                        <span key={n} style={{ left: `${n}%` }}>
                                            {n}
                                        </span>
                                    ))}
                                </span>
                            </div>
                            <div className="bw-lbl__lands">
                                {roll >= 0 && picked >= 0 && (
                                    <span>
                                        {t("bigramNarrative.v2.letterStep.rollReadout", { n: roll })}{" "}
                                        <b className="bw-lbl__landch" data-space={picked === 0 ? "1" : "0"}>
                                            {dchar(picked)}
                                        </b>
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── the live caption (one line, explains the active moment) ── */}
            <div className="bw-lbl__caption">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                        key={effPhase}
                        initial={reduce ? false : { opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -5 }}
                        transition={{ duration: 0.24, ease: STD }}
                    >
                        {captionText}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* ── controls ── */}
            {!reduce && (
                <div className="bw-lbl__foot">
                    <PlayButton onClick={onNext} disabled={running}>
                        {nextLabel}
                    </PlayButton>
                    {showAuto && (
                        <GhostButton onClick={onAuto} disabled={letters.length >= MAX_LETTERS}>
                            {running ? t("bigramNarrative.v2.letterStep.pause") : t("bigramNarrative.v2.letterStep.auto")}
                        </GhostButton>
                    )}
                    <button type="button" className="bw-lbl__reset" onClick={() => onReset()}>
                        ↻ {t("bigramNarrative.v2.letterStep.replay")}
                    </button>
                </div>
            )}

            {/* ── start-letter chips (the seed) — quiet, below the action, only before the first step ── */}
            {!reduce && letters.length <= 1 && idle && (
                <div className="bw-lbl__seeds">
                    <span className="bw-lbl__seedlbl">{t("bigramNarrative.v2.letterStep.seedPrompt")}</span>
                    <div className="bw-lbl__chips">
                        {SEED_CHOICES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className="bw-lbl__chip"
                                data-on={s === current ? "1" : "0"}
                                onClick={() => onReset(s)}
                            >
                                {dchar(s)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── the coda — only once the word has grown a few letters, the lesson named ── */}
            {(reduce || letters.length >= 4) && (
                <motion.p
                    className="bw-lbl__coda"
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {t("bigramNarrative.v2.letterStep.coda")}
                </motion.p>
            )}

            <style>{`
                .bw-lbl { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 760px; margin: 0 auto; width: 100%; }
                .bw-lbl__lead { font-family: ${SERIF}; font-style: italic; font-size: clamp(14px, 1.7vw, 16px); color: var(--bigram-muted); margin: 0 auto 14px; max-width: 46ch; line-height: 1.45; }

                /* THE WORD — pinned hero */
                .bw-lbl__wordwrap { width: 100%; margin: 0 auto 10px; }
                .bw-lbl__wordlbl { display: block; font-family: ${MONO}; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 6px; }
                .bw-lbl__word { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-height: 46px; }
                .bw-lbl__caret { display: inline-block; width: 3px; height: 0.9em; background: var(--bigram-accent); border-radius: 2px; animation: bwLblBlink 1s steps(2) infinite; }
                @keyframes bwLblBlink { 50% { opacity: 0; } }

                /* THE STEP TRACK (compact) */
                .bw-lbl__track { display: inline-flex; align-items: center; gap: 5px; margin: 0 auto 12px; flex-wrap: wrap; justify-content: center; }
                .bw-lbl__step { font-family: ${MONO}; font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; padding: 5px 10px; border-radius: var(--bigram-r-pill); color: var(--bigram-dim); background: color-mix(in oklab, var(--bigram-ink) 5%, transparent); transition: color .25s ease, background .25s ease, opacity .25s ease; }
                .bw-lbl__step[data-state="on"] { color: var(--bigram-on-accent); background: var(--bigram-accent); font-weight: 700; }
                .bw-lbl__step[data-state="done"] { color: var(--bigram-accent-ink); background: var(--bigram-accent-soft); }

                /* THE SINGLE FOCAL PANEL — one moment at a time, fixed height so the layout never jumps */
                .bw-lbl__panel { position: relative; width: 100%; max-width: 700px; min-height: 214px; margin: 0 auto; display: flex; align-items: flex-start; justify-content: center; }
                .bw-lbl__face { width: 100%; }

                /* THE ROW face */
                .bw-lbl__rowhead { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin-bottom: 10px; }
                .bw-lbl__rowfrom { font-family: ${MONO}; font-size: 18px; font-weight: 700; color: var(--bigram-accent); letter-spacing: .04em; }
                .bw-lbl__rowtotal { font-family: ${MONO}; font-size: 14px; font-weight: 600; color: var(--bigram-muted); font-variant-numeric: tabular-nums; }
                .bw-lbl__rowreadout { min-height: 26px; margin-top: 10px; display: flex; align-items: center; justify-content: center; }
                .bw-lbl__rowstat { font-family: ${MONO}; font-size: 15.5px; color: var(--bigram-muted); font-variant-numeric: tabular-nums; display: inline-flex; align-items: baseline; gap: 2px; }
                .bw-lbl__rowstat b { color: var(--bigram-accent-bright); font-weight: 700; font-size: 18px; margin: 0 4px; }

                /* THE DIE face */
                .bw-lbl__flaglane { position: relative; height: 48px; width: 100%; max-width: 560px; margin: 0 auto; }
                .bw-lbl__flag { position: absolute; bottom: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; opacity: 0; transition: opacity .2s ease; }
                .bw-lbl__flag[data-on="1"] { opacity: 1; }
                .bw-lbl__num { font-family: ${MONO}; font-size: 17px; font-weight: 700; line-height: 1; min-width: 34px; display: inline-flex; align-items: center; justify-content: center; padding: 6px 8px; color: var(--bigram-on-accent); background: var(--bigram-accent-ink); border-radius: var(--bigram-r-sm); box-shadow: 0 4px 12px -4px color-mix(in oklab, var(--bigram-ink) 50%, transparent); font-variant-numeric: tabular-nums; }
                .bw-lbl__needle { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid var(--bigram-accent-ink); }
                .bw-lbl__bar { position: relative; display: flex; width: 100%; max-width: 560px; height: 56px; gap: 2px; border-radius: var(--bigram-r-md); overflow: hidden; background: var(--bigram-bg-2); box-shadow: inset 0 1px 6px color-mix(in oklab, var(--bigram-ink) 14%, transparent); margin: 0 auto; }
                .bw-lbl__seg { position: relative; min-width: 0; height: 100%; display: flex; align-items: center; justify-content: center; flex-basis: 0; transition: filter .15s ease, box-shadow .2s ease; overflow: hidden; }
                .bw-lbl__seg[data-landed="1"] { box-shadow: inset 0 0 0 2.5px var(--bigram-accent-ink); filter: brightness(1.12); z-index: 2; }
                .bw-lbl__segface { display: inline-flex; flex-direction: column; align-items: center; line-height: 1.05; pointer-events: none; }
                .bw-lbl__segface b { font-family: ${MONO}; font-size: 16px; font-weight: 700; color: var(--bigram-on-accent); }
                .bw-lbl__segface i { font-family: ${MONO}; font-style: normal; font-size: 9.5px; color: color-mix(in oklab, var(--bigram-on-accent) 78%, transparent); margin-top: 2px; }
                .bw-lbl__baridx { position: absolute; inset: 0; pointer-events: none; }
                .bw-lbl__baridx span { position: absolute; bottom: -18px; transform: translateX(-50%); font-family: ${MONO}; font-size: 9.5px; color: var(--bigram-dim); }
                .bw-lbl__lands { min-height: 26px; margin-top: 24px; font-family: ${MONO}; font-size: 16px; color: var(--bigram-muted); display: flex; align-items: baseline; justify-content: center; }
                .bw-lbl__landch { color: var(--bigram-accent-bright); font-weight: 700; font-size: 20px; margin-left: 4px; }
                .bw-lbl__landch[data-space="1"] { color: var(--bigram-accent); }

                /* CAPTION */
                .bw-lbl__caption { min-height: 40px; margin: 10px auto 0; max-width: 48ch; }
                .bw-lbl__caption p { font-family: ${SERIF}; font-size: clamp(14.5px, 1.8vw, 16px); line-height: 1.4; color: var(--bigram-muted); margin: 0; text-wrap: pretty; }

                /* CONTROLS */
                .bw-lbl__foot { display: inline-flex; align-items: center; gap: 14px; margin-top: 12px; flex-wrap: wrap; justify-content: center; }
                .bw-lbl__reset { font-family: ${MONO}; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--bigram-accent); background: transparent; border: 0; cursor: pointer; padding: 6px; }
                .bw-lbl__reset:hover { color: var(--bigram-accent-bright); }

                /* SEEDS */
                .bw-lbl__seeds { margin-top: 12px; }
                .bw-lbl__seedlbl { display: block; font-family: ${MONO}; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 8px; }
                .bw-lbl__chips { display: inline-flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
                .bw-lbl__chip { font-family: ${MONO}; font-size: 16px; font-weight: 700; width: 38px; height: 38px; border-radius: var(--bigram-r-sm); border: 0; cursor: pointer; color: var(--bigram-ink-2); background: var(--bigram-bg-2); transition: background .2s ease, color .2s ease; }
                .bw-lbl__chip:hover { background: var(--bigram-accent-soft); color: var(--bigram-accent-ink); }
                .bw-lbl__chip[data-on="1"] { background: var(--bigram-accent); color: var(--bigram-on-accent); }

                /* CODA */
                .bw-lbl__coda { font-family: ${SERIF}; font-size: clamp(14.5px, 1.9vw, 17px); color: var(--bigram-ink); margin: 14px auto 0; max-width: 44ch; line-height: 1.4; text-wrap: pretty; }

                @media (max-width: 520px) {
                    .bw-lbl__bar { height: 50px; }
                    .bw-lbl__segface b { font-size: 14px; }
                    .bw-lbl__panel { min-height: 200px; }
                }
            `}</style>
        </div>
    );
});

/* caption key + step-label key maps (avoid string concat collisions) */
const captionKeyMap: Record<Phase, string> = {
    look: "lookCaption",
    count: "countCaption",
    calc: "calcCaption",
    roll: "rollCaption",
    append: "appendCaption",
};
const STEP_LABEL: Record<Phase, string> = {
    look: "stepLook",
    count: "stepCount",
    calc: "stepCalc",
    roll: "stepRoll",
    append: "stepAppend",
};

export default LetterByLetter;
