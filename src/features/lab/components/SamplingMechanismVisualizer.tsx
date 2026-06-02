"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

/* ────────────────────────────────────────────────────────────────────────────
 * SamplingMechanismVisualizer — Bigram chapter · sampling (v10 design language).
 *
 * This widget has no v10 prototype counterpart, so it is brought up to the v10
 * DESIGN LANGUAGE established by the four flagship widgets (HeroAutoComplete,
 * CorpusCountingIdea, PairHighlighter, PredictionChallenge): a single scoped
 * `<style>` block under a `.bw-sample` namespace, clamp() responsive type,
 * Playfair / Source Serif / JetBrains Mono, states by FILL + typography (never
 * chrome), one focal point, premium spring motion, fully reduced-motion safe.
 * Token-only (--bigram-*) so it follows the chapter's [data-bigram-theme] scope.
 *
 * ONE idea: the next character is *drawn* from the distribution, not always the
 * most likely one. Every candidate is laid end-to-end on one 0→1 lane, sized by
 * its probability. ONE uniform-random dart drops; wherever it lands is the pick.
 * "h" (53 %) owns half the lane and wins ~half the time — likely, never
 * guaranteed. Roll again and again and the tally below visibly drifts toward the
 * true probabilities: the law of large numbers, made watchable. This is *why* a
 * bigram can write fresh text every run instead of one frozen most-likely string.
 * ──────────────────────────────────────────────────────────────────────────── */

interface CandidateData {
    char: string;
    probability: number;
}

const EXAMPLE_CHAR = "t";

/* Sorted descending so the lane reads as a clean ranking; sums to 1.0. */
const CANDIDATES: CandidateData[] = [
    { char: "h", probability: 0.525 },
    { char: "e", probability: 0.192 },
    { char: "i", probability: 0.101 },
    { char: " ", probability: 0.096 },
    { char: "o", probability: 0.086 },
];

const SPACE_GLYPH = "␣";

const MONO = "var(--font-jetbrains-mono)";
const SERIF = "var(--font-source-serif)";
const EASE = "cubic-bezier(.22, .8, .26, 1)";

const SPIN_STEPS = 9;
const SETTLE_MS = 620;

function displayChar(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}

/* Cumulative [start, end) range per candidate — the segments of the 0→1 lane. */
interface Segment extends CandidateData {
    start: number;
    end: number;
    idx: number;
}

function buildSegments(cands: CandidateData[]): Segment[] {
    let cursor = 0;
    return cands.map((c, idx) => {
        const start = cursor;
        cursor += c.probability;
        return { ...c, start, end: cursor, idx };
    });
}

/* Which segment a uniform roll lands in. */
function segmentForRoll(segments: Segment[], roll: number): number {
    for (const s of segments) {
        if (roll < s.end) return s.idx;
    }
    return segments.length - 1;
}

type Phase = "idle" | "spinning" | "landing" | "picked";

export const SamplingMechanismVisualizer = memo(function SamplingMechanismVisualizer() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [phase, setPhase] = useState<Phase>("idle");
    const [pickedIdx, setPickedIdx] = useState<number | null>(null);
    const [rollValue, setRollValue] = useState<number | null>(null);
    /** dart x-position on the lane, 0..1 (decoupled from rollValue so the spin can sweep) */
    const [dartPos, setDartPos] = useState(0.5);
    /** running tally of how often each candidate has been drawn */
    const [tally, setTally] = useState<number[]>(() => CANDIDATES.map(() => 0));

    const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const phaseRef = useRef<Phase>("idle");
    // Mirror the live phase into a ref (in an effect, never during render) so the
    // memoised handler can guard against a re-entrant roll without re-creating itself.
    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    const segments = useMemo(() => buildSegments(CANDIDATES), []);
    const totalRolls = useMemo(() => tally.reduce((a, b) => a + b, 0), [tally]);

    const clearTimer = useCallback(() => {
        if (spinTimerRef.current) {
            clearTimeout(spinTimerRef.current);
            spinTimerRef.current = null;
        }
    }, []);

    const handleRoll = useCallback(() => {
        if (phaseRef.current === "spinning" || phaseRef.current === "landing") return;
        clearTimer();

        const roll = Math.random();
        const finalIdx = segmentForRoll(segments, roll);

        const land = () => {
            setPickedIdx(finalIdx);
            setRollValue(roll);
            setDartPos(roll);
            setPhase("landing");
            spinTimerRef.current = setTimeout(() => {
                setPhase("picked");
                setTally((prev) => {
                    const next = prev.slice();
                    next[finalIdx] += 1;
                    return next;
                });
            }, SETTLE_MS);
        };

        // Reduced motion: skip the suspense sweep, land immediately.
        if (reduce) {
            setPickedIdx(finalIdx);
            setRollValue(roll);
            setDartPos(roll);
            setPhase("picked");
            setTally((prev) => {
                const next = prev.slice();
                next[finalIdx] += 1;
                return next;
            });
            return;
        }

        // Anticipation sweep: the dart skates across the lane a few times, decelerating,
        // before it settles on the true uniform position — chance made visible.
        setPhase("spinning");
        setPickedIdx(null);
        setRollValue(null);

        let step = 0;
        const sweep = () => {
            if (step >= SPIN_STEPS) {
                land();
                return;
            }
            // pseudo-random sweep positions, biased to roam the whole lane
            const p = (Math.sin(step * 2.7) * 0.5 + 0.5) * 0.86 + 0.07;
            setDartPos(p);
            setPickedIdx(segmentForRoll(segments, p));
            step += 1;
            spinTimerRef.current = setTimeout(sweep, 70 + step * 22);
        };
        sweep();
    }, [clearTimer, reduce, segments]);

    const handleReset = useCallback(() => {
        clearTimer();
        setPhase("idle");
        setPickedIdx(null);
        setRollValue(null);
        setDartPos(0.5);
        setTally(CANDIDATES.map(() => 0));
    }, [clearTimer]);

    useEffect(() => () => clearTimer(), [clearTimer]);

    const busy = phase === "spinning" || phase === "landing";
    const settled = phase === "picked";

    return (
        <div className="bw-sample">
            {/* ── Context: "After t" ─────────────────────────────────────────── */}
            <p className="bw-sample__ctx">
                <span className="lbl">{t("bigramNarrative.samplingMechanism.after")}</span>
                <span className="char">{EXAMPLE_CHAR}</span>
            </p>

            {/* ── The probability lane (focal point) ──────────────────────────── */}
            <ProbabilityLane
                segments={segments}
                dartPos={dartPos}
                pickedIdx={pickedIdx}
                phase={phase}
                reduce={!!reduce}
                t={t}
            />

            {/* ── Roll readout: ties the abstract number to the landed position ── */}
            <div className="bw-sample__readout">
                <AnimatePresence>
                    {settled && rollValue !== null && pickedIdx !== null && (
                        <motion.p
                            key="readout"
                            initial={reduce ? false : { opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={reduce ? { duration: 0 } : { duration: 0.3 }}
                        >
                            <span className="lbl">
                                {t("bigramNarrative.samplingMechanism.rolled")}
                            </span>
                            <span className="num">{rollValue.toFixed(3)}</span>
                            <span className="arr">→</span>
                            <span className="hit">{displayChar(CANDIDATES[pickedIdx].char)}</span>
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Roll control ────────────────────────────────────────────────── */}
            <div className="bw-sample__act">
                <motion.button
                    type="button"
                    className="bw-sample__roll"
                    onClick={handleRoll}
                    disabled={busy}
                    whileHover={reduce || busy ? undefined : { y: -2 }}
                    whileTap={reduce || busy ? undefined : { scale: 0.97 }}
                    aria-label={
                        settled
                            ? t("bigramNarrative.samplingMechanism.rollAgain")
                            : t("bigramNarrative.samplingMechanism.roll")
                    }
                >
                    <motion.span
                        className="dice"
                        aria-hidden
                        animate={busy && !reduce ? { rotate: 360 } : { rotate: 0 }}
                        transition={
                            busy && !reduce
                                ? { repeat: Infinity, duration: 0.6, ease: "linear" }
                                : { duration: 0.2 }
                        }
                    >
                        <DiceGlyph />
                    </motion.span>
                    {settled
                        ? t("bigramNarrative.samplingMechanism.rollAgain")
                        : t("bigramNarrative.samplingMechanism.roll")}
                </motion.button>
            </div>

            {/* ── Frequency memory: rolls accumulate, counts drift toward true p ── */}
            <AnimatePresence>
                {totalRolls > 0 && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <FrequencyMemory
                            candidates={CANDIDATES}
                            tally={tally}
                            total={totalRolls}
                            pickedIdx={settled ? pickedIdx : null}
                            reduce={!!reduce}
                            t={t}
                            onReset={handleReset}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .bw-sample {
                    --ease-s: ${EASE};
                    display: flex;
                    flex-direction: column;
                    gap: clamp(24px, 4vw, 34px);
                    font-family: ${SERIF};
                }

                /* ── context line ── */
                .bw-sample__ctx {
                    display: flex; align-items: baseline; justify-content: center;
                    gap: clamp(10px, 2vw, 14px); margin: 0;
                }
                .bw-sample__ctx .lbl {
                    font-family: ${MONO}; font-size: 10.5px; letter-spacing: .22em;
                    text-transform: uppercase; color: var(--bigram-muted);
                }
                .bw-sample__ctx .char {
                    font-family: ${MONO}; font-size: clamp(30px, 6vw, 38px); font-weight: 600;
                    line-height: 1; color: var(--bigram-accent-ink);
                }

                /* ── roll readout (mono, drives the convergence story) ── */
                .bw-sample__readout {
                    min-height: 22px; display: flex; align-items: center; justify-content: center;
                }
                .bw-sample__readout p {
                    margin: 0; font-family: ${MONO}; font-size: 14px;
                    display: inline-flex; align-items: baseline; gap: 9px;
                    font-variant-numeric: lining-nums tabular-nums;
                }
                .bw-sample__readout .lbl { color: var(--bigram-dim); }
                .bw-sample__readout .num { color: var(--bigram-ink-2); font-weight: 600; }
                .bw-sample__readout .arr { color: var(--bigram-dim); }
                .bw-sample__readout .hit {
                    color: var(--bigram-accent-ink); font-weight: 700; font-size: 16px;
                }

                /* ── primary action ── */
                .bw-sample__act { display: flex; justify-content: center; }
                .bw-sample__roll {
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 13px 24px; border: 0; border-radius: var(--bigram-r-sm);
                    background: var(--bigram-accent); color: var(--bigram-on-accent);
                    font-family: ${MONO}; font-size: 12px; font-weight: 600;
                    letter-spacing: .1em; text-transform: uppercase; cursor: pointer;
                    transition: opacity .2s, background .2s;
                }
                .bw-sample__roll:hover { background: var(--bigram-accent-bright); }
                .bw-sample__roll:disabled { opacity: .55; cursor: default; }
                .bw-sample__roll:focus-visible {
                    outline: none; box-shadow: 0 0 0 3px var(--bigram-accent-soft);
                }
                .bw-sample__roll .dice { display: inline-flex; }

                /* ── probability lane ── */
                .bw-sample__lane-cap {
                    margin: 0 0 14px; font-family: ${MONO}; font-size: 10.5px;
                    letter-spacing: .22em; text-transform: uppercase;
                    color: var(--bigram-muted); text-align: center;
                }
                .bw-sample__stage { position: relative; padding-top: 28px; }
                .bw-sample__dart {
                    position: absolute; top: 0; display: flex; flex-direction: column;
                    align-items: center; z-index: 2; pointer-events: none;
                }
                .bw-sample__dart .head {
                    width: 0; height: 0;
                    border-left: 6px solid transparent; border-right: 6px solid transparent;
                    border-top: 9px solid var(--bigram-ink-2);
                    transition: border-top-color .25s var(--ease-s);
                }
                .bw-sample__dart.lit .head { border-top-color: var(--bigram-accent-bright); }
                .bw-sample__dart .stem {
                    width: 2px; height: 64px; margin-top: -1px;
                    background: color-mix(in oklab, var(--bigram-ink) 45%, transparent);
                    transition: background .25s var(--ease-s);
                }
                .bw-sample__dart.lit .stem { background: var(--bigram-accent-bright); }

                .bw-sample__lane {
                    display: flex; height: 58px; border-radius: var(--bigram-r-sm);
                    overflow: hidden;
                    background: color-mix(in oklab, var(--bigram-ink) 8%, transparent);
                }
                .bw-sample__seg {
                    position: relative; height: 100%;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 2px;
                    box-shadow: inset -1px 0 0 0 color-mix(in oklab, var(--bigram-bg) 55%, transparent);
                    transition: background .3s var(--ease-s), opacity .3s var(--ease-s);
                }
                .bw-sample__seg .g {
                    font-family: ${MONO}; font-weight: 700; line-height: 1;
                    color: color-mix(in oklab, var(--bigram-on-accent) 78%, transparent);
                }
                .bw-sample__seg .p {
                    font-family: ${MONO}; font-size: 9px; font-weight: 500; line-height: 1;
                    color: color-mix(in oklab, var(--bigram-on-accent) 58%, transparent);
                    font-variant-numeric: tabular-nums;
                }
                .bw-sample__seg.hot .g { color: var(--bigram-on-accent); }
                .bw-sample__seg.hot .p {
                    color: color-mix(in oklab, var(--bigram-on-accent) 80%, transparent);
                }
                /* glint sweep across the winning segment on land */
                .bw-sample__seg .glint {
                    position: absolute; inset: 0; pointer-events: none;
                    background: linear-gradient(105deg, transparent 30%,
                        color-mix(in oklab, var(--bigram-on-accent) 38%, transparent) 50%, transparent 70%);
                    transform: translateX(-130%);
                }
                .bw-sample__seg.hot .glint { animation: bwSampleGlint .62s var(--ease-s) .04s both; }

                .bw-sample__scale {
                    display: flex; justify-content: space-between; margin-top: 8px;
                    font-family: ${MONO}; font-size: 10px; color: var(--bigram-dim);
                    font-variant-numeric: tabular-nums;
                }

                /* ── frequency memory (the payoff) ── */
                .bw-sample__mem { padding-top: 6px; }
                .bw-sample__mem-head {
                    display: flex; align-items: baseline; justify-content: space-between;
                    margin: 0 0 16px; padding-bottom: 11px;
                    border-bottom: 1px solid var(--bigram-rule);
                }
                .bw-sample__mem-head .ttl {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .22em;
                    text-transform: uppercase; color: var(--bigram-muted);
                }
                .bw-sample__reset {
                    display: inline-flex; align-items: center; gap: 7px;
                    padding: 5px 12px; border: 0; border-radius: var(--bigram-r-pill);
                    background: transparent;
                    box-shadow: inset 0 0 0 1px var(--bigram-rule-2);
                    color: var(--bigram-muted); font-family: ${MONO}; font-size: 10.5px;
                    letter-spacing: .06em; cursor: pointer;
                    font-variant-numeric: tabular-nums;
                    transition: color .2s var(--ease-s), box-shadow .2s var(--ease-s);
                }
                .bw-sample__reset:hover {
                    color: var(--bigram-accent);
                    box-shadow: inset 0 0 0 1px var(--bigram-accent);
                }
                .bw-sample__reset:focus-visible {
                    outline: none; box-shadow: 0 0 0 3px var(--bigram-accent-soft);
                }

                .bw-sample__rows { display: flex; flex-direction: column; gap: 3px; }
                .bw-sample__row {
                    display: grid; grid-template-columns: 28px 1fr 56px;
                    align-items: center; gap: clamp(10px, 2.4vw, 14px); padding: 5px 0;
                }
                .bw-sample__row .glyph {
                    font-family: ${MONO}; font-size: 17px; font-weight: 600;
                    text-align: center; color: var(--bigram-ink-2);
                    transition: color .25s var(--ease-s);
                }
                .bw-sample__row .glyph.space { font-size: 12px; }
                .bw-sample__row.lit .glyph { color: var(--bigram-accent-ink); }

                .bw-sample__track {
                    position: relative; height: 8px; border-radius: var(--bigram-r-pill);
                    background: color-mix(in oklab, var(--bigram-ink) 9%, transparent);
                    display: block;
                }
                .bw-sample__track .clip {
                    position: absolute; inset: 0; border-radius: var(--bigram-r-pill);
                    overflow: hidden; display: block;
                }
                /* the true-probability target — what the observed frequency converges to */
                .bw-sample__tick {
                    position: absolute; top: -3px; bottom: -3px; width: 2px;
                    margin-left: -1px; border-radius: 1px;
                    background: var(--bigram-sage); opacity: .85;
                }

                .bw-sample__pct {
                    font-family: ${MONO}; font-size: 12.5px; text-align: right;
                    color: var(--bigram-muted); font-variant-numeric: tabular-nums;
                    transition: color .25s var(--ease-s);
                }
                .bw-sample__row.lit .bw-sample__pct { color: var(--bigram-accent); }

                @keyframes bwSampleGlint {
                    from { transform: translateX(-130%); }
                    to   { transform: translateX(130%); }
                }

                @media (max-width: 460px) {
                    .bw-sample__seg .p { display: none; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .bw-sample__seg.hot .glint { animation: none !important; }
                    .bw-sample__seg .glint { display: none; }
                }
            `}</style>
        </div>
    );
});

/* ════════════════════════════════════════════════════════════════════════════
 * DiceGlyph — a tiny inline die (currentColor) so the control needs no icon dep.
 * ════════════════════════════════════════════════════════════════════════════ */
function DiceGlyph() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="5" cy="5" r="1.15" fill="currentColor" />
            <circle cx="11" cy="5" r="1.15" fill="currentColor" />
            <circle cx="8" cy="8" r="1.15" fill="currentColor" />
            <circle cx="5" cy="11" r="1.15" fill="currentColor" />
            <circle cx="11" cy="11" r="1.15" fill="currentColor" />
        </svg>
    );
}

/* ════════════════════════════════════════════════════════════════════════════
 * ProbabilityLane — the single focal point. A 0→1 line cut into segments sized by
 * each candidate's probability. The dart drops onto it; wherever it lands lights up.
 * ════════════════════════════════════════════════════════════════════════════ */

const ProbabilityLane = memo(function ProbabilityLane({
    segments,
    dartPos,
    pickedIdx,
    phase,
    reduce,
    t,
}: {
    segments: Segment[];
    dartPos: number;
    pickedIdx: number | null;
    phase: Phase;
    reduce: boolean;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    const active = phase === "landing" || phase === "picked";
    const settled = phase === "picked";

    return (
        <div>
            <p className="bw-sample__lane-cap">
                {t("bigramNarrative.samplingMechanism.probabilitySpace")}
            </p>

            {/* lane + dart share one positioned box */}
            <div className="bw-sample__stage">
                {/* the dart that drops onto the lane */}
                <motion.div
                    className={"bw-sample__dart" + (settled ? " lit" : "")}
                    aria-hidden
                    initial={false}
                    animate={{
                        left: `${dartPos * 100}%`,
                        y: phase === "spinning" ? -2 : 0,
                    }}
                    transition={
                        phase === "landing" && !reduce
                            ? { type: "spring", stiffness: 130, damping: 16 }
                            : phase === "spinning"
                              ? { duration: 0.08, ease: "linear" }
                              : { duration: reduce ? 0 : 0.3, ease: [0.2, 0.8, 0.2, 1] }
                    }
                    style={{
                        left: `${dartPos * 100}%`,
                        transform: "translateX(-50%)",
                        opacity: phase === "idle" ? 0.55 : 1,
                    }}
                >
                    <span className="head" />
                    <span className="stem" />
                </motion.div>

                {/* the lane itself */}
                <div
                    className="bw-sample__lane"
                    role="img"
                    aria-label={
                        settled && pickedIdx !== null
                            ? `Dart landed on ${segments[pickedIdx].char === " " ? "space" : segments[pickedIdx].char}`
                            : "Probability lane from 0 to 1"
                    }
                >
                    {segments.map((s) => {
                        const isPicked = pickedIdx === s.idx && active;
                        const dimmed = settled && pickedIdx !== s.idx;
                        const isSpace = s.char === " ";
                        return (
                            <motion.div
                                key={s.char}
                                className={"bw-sample__seg" + (isPicked ? " hot" : "")}
                                animate={{ opacity: dimmed ? 0.32 : 1 }}
                                transition={{ duration: reduce ? 0 : 0.3 }}
                                style={{
                                    width: `${s.probability * 100}%`,
                                    // fill brightness encodes p; winner-on-landing is brightest
                                    background: isPicked
                                        ? "var(--bigram-accent-bright)"
                                        : `color-mix(in oklab, var(--bigram-accent-2) ${42 + s.probability * 58}%, var(--bigram-surface))`,
                                }}
                            >
                                {isPicked && !reduce && <span className="glint" />}
                                <span
                                    className="g"
                                    style={{
                                        fontSize: isSpace ? "10px" : "16px",
                                        letterSpacing: isSpace ? ".02em" : 0,
                                    }}
                                >
                                    {displayChar(s.char)}
                                </span>
                                {s.probability >= 0.085 && (
                                    <span className="p">{Math.round(s.probability * 100)}%</span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* 0 → 1 scale */}
                <div className="bw-sample__scale">
                    <span>0</span>
                    <span>1</span>
                </div>
            </div>
        </div>
    );
});

/* ════════════════════════════════════════════════════════════════════════════
 * FrequencyMemory — the payoff. Each roll adds a count; the observed frequency
 * (filled bar) drifts toward the true probability (a sage hairline tick) as rolls
 * grow. Honest FIXED axis: the whole track is p = max(true p) so bars read as real
 * shares, never normalised to 100 %.
 * ════════════════════════════════════════════════════════════════════════════ */

const FrequencyMemory = memo(function FrequencyMemory({
    candidates,
    tally,
    total,
    pickedIdx,
    reduce,
    t,
    onReset,
}: {
    candidates: CandidateData[];
    tally: number[];
    total: number;
    pickedIdx: number | null;
    reduce: boolean;
    t: (key: string, params?: Record<string, string | number>) => string;
    onReset: () => void;
}) {
    // Honest axis: the most-probable candidate's true p, so the lead bar can fill the
    // track while every other bar reads as its real proportion (never normalised to 100 %).
    const axis = useMemo(() => Math.max(...candidates.map((c) => c.probability)), [candidates]);

    return (
        <div className="bw-sample__mem">
            <div className="bw-sample__mem-head">
                <span className="ttl">{t("bigramNarrative.samplingMechanism.history")}</span>
                <button type="button" className="bw-sample__reset" onClick={onReset}>
                    <ResetGlyph />
                    {total}×
                </button>
            </div>

            <div className="bw-sample__rows">
                {candidates.map((c, idx) => {
                    const count = tally[idx];
                    const observed = count / total;
                    const isJustPicked = pickedIdx === idx;
                    const isSpace = c.char === " ";
                    const fillW = Math.min(100, (observed / axis) * 100);
                    const trueW = Math.min(100, (c.probability / axis) * 100);
                    return (
                        <div
                            key={c.char}
                            className={"bw-sample__row" + (isJustPicked ? " lit" : "")}
                        >
                            <span className={"glyph" + (isSpace ? " space" : "")}>
                                {displayChar(c.char)}
                            </span>

                            {/* track: observed-frequency fill + a true-probability tick */}
                            <span className="bw-sample__track">
                                <span className="clip">
                                    <motion.span
                                        initial={false}
                                        animate={{ width: `${fillW}%` }}
                                        transition={
                                            reduce
                                                ? { duration: 0 }
                                                : { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }
                                        }
                                        style={{
                                            display: "block",
                                            height: "100%",
                                            borderRadius: "var(--bigram-r-pill)",
                                            background: isJustPicked
                                                ? "var(--bigram-accent-bright)"
                                                : "var(--bigram-accent-2)",
                                            transition: "background .25s var(--ease-s)",
                                        }}
                                    />
                                </span>
                                {/* true-probability target tick — what the frequency converges to */}
                                <span
                                    className="bw-sample__tick"
                                    aria-hidden
                                    style={{ left: `${trueW}%` }}
                                />
                            </span>

                            {/* observed % (counts up implicitly via re-render) */}
                            <span className="bw-sample__pct">
                                {(observed * 100).toFixed(0)} %
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

/* tiny rotate-counterclockwise glyph (currentColor) for the reset control */
function ResetGlyph() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
                d="M2.2 4.4A4 4 0 1 1 1.8 7"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M1 2.2v2.4h2.4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}
