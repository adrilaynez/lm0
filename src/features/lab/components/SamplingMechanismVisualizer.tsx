"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Dices, RotateCcw } from "lucide-react";

import { useI18n } from "@/i18n/context";

/* ────────────────────────────────────────────────────────────────────────────
 * SamplingMechanismVisualizer — Bigram §5 (sampling), v8 editorial-green.
 *
 * Concept (ONE): the next character is *drawn* from the probability distribution.
 * The model lays every candidate end-to-end on a single 0→1 lane (sized by its
 * probability), throws ONE uniform-random dart, and wherever the dart lands picks
 * the character. So "h" (53 %) owns half the lane and wins half the time — likely,
 * never guaranteed. Roll again and again and the tally below visibly drifts toward
 * the true probabilities: chance, not certainty, with the law of large numbers shown.
 *
 * Surface is one calm instrument: a probability lane (the focal point), a dropping
 * dart (the verb), a quiet roll readout, and a frequency memory. State is shown by
 * fill + brightness, never chrome. Only --bigram-* tokens + registered fonts; gated
 * by the chapter's [data-bigram-theme] scope. Fully reduced-motion safe.
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

const SPIN_STEPS = 9;
const SETTLE_MS = 640;

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

    const settled = phase === "picked";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            {/* ── Context: "After t" ── */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: "12px" }}>
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: "10.5px",
                        letterSpacing: ".2em",
                        textTransform: "uppercase",
                        color: "var(--bigram-muted)",
                    }}
                >
                    {t("bigramNarrative.samplingMechanism.after")}
                </span>
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: "34px",
                        fontWeight: 600,
                        lineHeight: 1,
                        color: "var(--bigram-accent-ink)",
                    }}
                >
                    {EXAMPLE_CHAR}
                </span>
            </div>

            {/* ── The probability lane (focal point): one 0→1 line, segments sized by p ── */}
            <ProbabilityLane
                segments={segments}
                dartPos={dartPos}
                pickedIdx={pickedIdx}
                phase={phase}
                reduce={!!reduce}
                t={t}
            />

            {/* ── Roll readout: ties the abstract number to the landed position ── */}
            <div style={{ minHeight: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <AnimatePresence>
                    {settled && rollValue !== null && pickedIdx !== null && (
                        <motion.p
                            key="readout"
                            initial={reduce ? false : { opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={reduce ? { duration: 0 } : { duration: 0.3 }}
                            style={{
                                margin: 0,
                                fontFamily: MONO,
                                fontSize: "14px",
                                color: "var(--bigram-muted)",
                                display: "inline-flex",
                                alignItems: "baseline",
                                gap: "8px",
                                fontVariantNumeric: "lining-nums tabular-nums",
                            }}
                        >
                            <span style={{ color: "var(--bigram-dim)" }}>
                                {t("bigramNarrative.samplingMechanism.rolled")}
                            </span>
                            <span style={{ color: "var(--bigram-ink-2)", fontWeight: 600 }}>
                                {rollValue.toFixed(3)}
                            </span>
                            <span style={{ color: "var(--bigram-dim)" }}>→</span>
                            <span style={{ color: "var(--bigram-accent-ink)", fontWeight: 700, fontSize: "16px" }}>
                                {displayChar(CANDIDATES[pickedIdx].char)}
                            </span>
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Roll control ── */}
            <div style={{ display: "flex", justifyContent: "center" }}>
                <motion.button
                    type="button"
                    onClick={handleRoll}
                    disabled={phase === "spinning" || phase === "landing"}
                    whileHover={reduce ? undefined : { y: -1 }}
                    whileTap={reduce ? undefined : { scale: 0.97 }}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "13px 22px",
                        border: 0,
                        borderRadius: "var(--bigram-r-sm)",
                        background: "var(--bigram-accent)",
                        color: "var(--bigram-on-accent)",
                        fontFamily: MONO,
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: ".1em",
                        textTransform: "uppercase",
                        cursor: phase === "spinning" || phase === "landing" ? "default" : "pointer",
                        opacity: phase === "spinning" || phase === "landing" ? 0.55 : 1,
                        transition: "opacity .2s, background .2s",
                    }}
                    aria-label={
                        settled
                            ? t("bigramNarrative.samplingMechanism.rollAgain")
                            : t("bigramNarrative.samplingMechanism.roll")
                    }
                >
                    <motion.span
                        animate={
                            phase === "spinning" && !reduce ? { rotate: 360 } : { rotate: 0 }
                        }
                        transition={
                            phase === "spinning" && !reduce
                                ? { repeat: Infinity, duration: 0.6, ease: "linear" }
                                : { duration: 0.2 }
                        }
                        style={{ display: "inline-flex" }}
                    >
                        <Dices style={{ width: 16, height: 16 }} aria-hidden />
                    </motion.span>
                    {settled
                        ? t("bigramNarrative.samplingMechanism.rollAgain")
                        : t("bigramNarrative.samplingMechanism.roll")}
                </motion.button>
            </div>

            {/* ── Frequency memory: rolls accumulate, counts drift toward the true p ── */}
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
        </div>
    );
});

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
            <p
                style={{
                    margin: "0 0 14px",
                    fontFamily: MONO,
                    fontSize: "10.5px",
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "var(--bigram-muted)",
                    textAlign: "center",
                }}
            >
                {t("bigramNarrative.samplingMechanism.probabilitySpace")}
            </p>

            {/* lane + dart share one positioned box */}
            <div style={{ position: "relative", padding: "26px 0 0" }}>
                {/* the dart that drops onto the lane */}
                <motion.div
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
                        position: "absolute",
                        top: 0,
                        left: `${dartPos * 100}%`,
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        zIndex: 2,
                        pointerEvents: "none",
                        opacity: phase === "idle" ? 0.55 : 1,
                    }}
                >
                    {/* downward triangle marker */}
                    <span
                        style={{
                            width: 0,
                            height: 0,
                            borderLeft: "6px solid transparent",
                            borderRight: "6px solid transparent",
                            borderTop: `9px solid ${settled ? "var(--bigram-accent-bright)" : "var(--bigram-ink-2)"}`,
                            transition: "border-top-color .25s",
                        }}
                    />
                    {/* the dart's stem cutting through the lane */}
                    <span
                        style={{
                            width: "2px",
                            height: "62px",
                            marginTop: "-1px",
                            background: settled
                                ? "var(--bigram-accent-bright)"
                                : "color-mix(in oklab, var(--bigram-ink) 45%, transparent)",
                            transition: "background .25s",
                        }}
                    />
                </motion.div>

                {/* the lane itself */}
                <div
                    role="img"
                    aria-label={
                        settled && pickedIdx !== null
                            ? `Dart landed on ${segments[pickedIdx].char === " " ? "space" : segments[pickedIdx].char}`
                            : "Probability lane from 0 to 1"
                    }
                    style={{
                        display: "flex",
                        height: "56px",
                        borderRadius: "var(--bigram-r-sm)",
                        overflow: "hidden",
                        background: "color-mix(in oklab, var(--bigram-ink) 8%, transparent)",
                    }}
                >
                    {segments.map((s) => {
                        const isPicked = pickedIdx === s.idx && active;
                        const dimmed = settled && pickedIdx !== s.idx;
                        const isSpace = s.char === " ";
                        return (
                            <motion.div
                                key={s.char}
                                animate={{ opacity: dimmed ? 0.32 : 1 }}
                                transition={{ duration: reduce ? 0 : 0.3 }}
                                style={{
                                    position: "relative",
                                    width: `${s.probability * 100}%`,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "2px",
                                    // fill brightness encodes p: winner-on-landing is brightest
                                    background: isPicked
                                        ? "var(--bigram-accent-bright)"
                                        : `color-mix(in oklab, var(--bigram-accent-2) ${42 + s.probability * 58}%, var(--bigram-surface))`,
                                    boxShadow:
                                        "inset -1px 0 0 0 color-mix(in oklab, var(--bigram-bg) 55%, transparent)",
                                    transition: "background .3s",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: MONO,
                                        fontSize: isSpace ? "10px" : "16px",
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        color: isPicked
                                            ? "var(--bigram-on-accent)"
                                            : "color-mix(in oklab, var(--bigram-on-accent) 78%, transparent)",
                                        letterSpacing: isSpace ? ".02em" : 0,
                                    }}
                                >
                                    {displayChar(s.char)}
                                </span>
                                {s.probability >= 0.085 && (
                                    <span
                                        style={{
                                            fontFamily: MONO,
                                            fontSize: "9px",
                                            fontWeight: 500,
                                            lineHeight: 1,
                                            color: isPicked
                                                ? "color-mix(in oklab, var(--bigram-on-accent) 80%, transparent)"
                                                : "color-mix(in oklab, var(--bigram-on-accent) 58%, transparent)",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {Math.round(s.probability * 100)}%
                                    </span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* 0 → 1 scale */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "7px",
                        fontFamily: MONO,
                        fontSize: "10px",
                        color: "var(--bigram-dim)",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    <span>0</span>
                    <span>1</span>
                </div>
            </div>
        </div>
    );
});

/* ════════════════════════════════════════════════════════════════════════════
 * FrequencyMemory — the payoff. Each roll adds a count; the observed frequency
 * (filled bar) drifts toward the true probability (a hairline tick) as rolls grow.
 * Honest fixed axis: the whole track is p = max(true p) so bars read as real shares.
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
    // track while every other bar reads as its real proportion (never normalised to 100%).
    const axis = useMemo(() => Math.max(...candidates.map((c) => c.probability)), [candidates]);

    return (
        <div style={{ paddingTop: "8px" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    margin: "0 0 16px",
                    paddingBottom: "11px",
                    borderBottom: "1px solid var(--bigram-rule)",
                }}
            >
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: "11px",
                        letterSpacing: ".2em",
                        textTransform: "uppercase",
                        color: "var(--bigram-muted)",
                    }}
                >
                    {t("bigramNarrative.samplingMechanism.history")}
                </span>
                <button
                    type="button"
                    onClick={onReset}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 11px",
                        border: 0,
                        borderRadius: "var(--bigram-r-sm)",
                        background: "transparent",
                        boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
                        color: "var(--bigram-muted)",
                        fontFamily: MONO,
                        fontSize: "10.5px",
                        letterSpacing: ".06em",
                        cursor: "pointer",
                        fontVariantNumeric: "tabular-nums",
                        transition: "color .2s, box-shadow .2s",
                    }}
                >
                    <RotateCcw style={{ width: 12, height: 12 }} aria-hidden />
                    {total}×
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
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
                            style={{
                                display: "grid",
                                gridTemplateColumns: "30px 1fr 64px",
                                alignItems: "center",
                                gap: "14px",
                                padding: "5px 0",
                            }}
                        >
                            {/* candidate glyph */}
                            <span
                                style={{
                                    fontFamily: MONO,
                                    fontSize: isSpace ? "12px" : "17px",
                                    fontWeight: 600,
                                    textAlign: "center",
                                    color: isJustPicked
                                        ? "var(--bigram-accent-ink)"
                                        : "var(--bigram-ink-2)",
                                    transition: "color .25s",
                                }}
                            >
                                {displayChar(c.char)}
                            </span>

                            {/* track: observed-frequency fill + a true-probability tick */}
                            <span
                                style={{
                                    position: "relative",
                                    height: "8px",
                                    borderRadius: "4px",
                                    overflow: "visible",
                                    background: "color-mix(in oklab, var(--bigram-ink) 9%, transparent)",
                                    display: "block",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                        display: "block",
                                    }}
                                >
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
                                            borderRadius: "4px",
                                            background: isJustPicked
                                                ? "var(--bigram-accent-bright)"
                                                : "var(--bigram-accent-2)",
                                            transition: "background .25s",
                                        }}
                                    />
                                </span>
                                {/* true-probability target tick — what the frequency converges to */}
                                <span
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        top: "-3px",
                                        bottom: "-3px",
                                        left: `${trueW}%`,
                                        width: "2px",
                                        marginLeft: "-1px",
                                        borderRadius: "1px",
                                        background: "var(--bigram-sage)",
                                        opacity: 0.85,
                                    }}
                                />
                            </span>

                            {/* observed % (counts up implicitly via re-render) */}
                            <span
                                style={{
                                    fontFamily: MONO,
                                    fontSize: "12.5px",
                                    textAlign: "right",
                                    color: isJustPicked ? "var(--bigram-accent)" : "var(--bigram-muted)",
                                    fontVariantNumeric: "tabular-nums",
                                    transition: "color .25s",
                                }}
                            >
                                {(observed * 100).toFixed(0)}
                                {" "}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
