"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Verdict } from "@/features/lab/components/bigram/Verdict";
import {
    SHAKESPEARE_ROW_T,
    displayChar,
} from "@/features/lab/data/bigramCorpora";
import { useI18n } from "@/i18n/context";

/**
 * ShakespeareRowCounter — Bigram §2, the "and what about a whole book?" beat
 * (editorial-green design language).
 *
 * ONE concept: *with enough text, counting stops lying.* The §2 anchor sentence was
 * too small — there, a space beat "h" after "t". So we scale up. The widget makes the
 * leap viscerally: first you count "t" pairs BY HAND, slow and legible, until the tally
 * becomes a MESS (~28 pairs). That mess is the motivation — "what if we jot it in a
 * table?" — and the manual pile collapses into a single 1×N ROW (the `t → *` row of a
 * Shakespeare-scale corpus). That row then FILLS, accelerating (slow → fast, ease-in),
 * the counts climbing from near-zero to full-Shakespeare totals, until "h" pulls
 * decisively ahead. The verdict names what your head already knew: after "t" comes "h".
 *
 * Two ideas the learner *feels* before either is named:
 *   • structure is INVENTED, not imposed — the row is born from the mess (narrative pillar 12);
 *   • scale fixes the lie — the same count that misled on a tiny sentence tells the truth on a book.
 *
 * Aesthetic mirrors CorpusCountingIdea / TinyMatrixExample: a calm scientific instrument,
 * not a dashboard. Manual pairs read as accent-tinted pills (pattern pops on repeat);
 * the table reads as max-normalized count-rows (integer count, per-increment `pop`,
 * live winner). Token-only (--bigram-*), scoped to the page's [data-bigram-theme];
 * fully reduced-motion safe. Auto-mountable: no required props, reads its data from the
 * dataset and its copy via useI18n.
 */

/* ─── A Shakespeare-flavoured fragment to scan by hand (the manual phase) ───
   Archaic English so the "t" pairs feel like the real corpus we then scale to. Long
   enough that the hand-count visibly becomes a mess (~28 origin "t"s) before we give up
   and reach for a table. */
const FRAGMENT =
    "to be or not to be that is the question whether tis nobler in the mind to suffer the thousand thrills that flesh is heir to";

/* ─── Pacing (manual scan) — slow & legible early, like CorpusCountingIdea ─── */
const FIRST_STEP_MS = 640; // settle before the first match lands
const SCAN_DELAY_MS = 360; // brisk-but-followable per-pair cadence (many "t"s to get through)
const MESSY_THRESHOLD = 22; // pairs counted by hand before the "jot it in a table?" prompt unlocks

/* ─── Pacing (table fill) — accelerating ease-in toward the full corpus ─── */
const FILL_STEPS = 26; // discrete increments from ~0 → full Shakespeare totals
const FILL_FIRST_MS = 520; // the first table tick is slow (didactic)
const FILL_LAST_MS = 34; // by the end it's a blur — the book lands at once
const SERIF = "var(--font-source-serif)";
const MONO = "var(--font-jetbrains-mono)";

type Phase = "idle" | "manual" | "organize" | "filling" | "done";

/* ─── Helpers ─── */
function findTPositions(text: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < text.length - 1; i++) {
        if (text[i] === "t") positions.push(i);
    }
    return positions;
}

/**
 * easeInQuad mapped across [0, FILL_STEPS): the gap between ticks shrinks, so the table
 * starts slow (one column at a time, readable) and finishes in a rush — "Shakespeare,
 * all at once". Returns the delay in ms before tick `i` runs.
 */
function fillDelay(i: number): number {
    const k = i / (FILL_STEPS - 1); // 0 → 1
    const eased = 1 - Math.pow(1 - k, 2.4); // ease-in feel on the *interval*, accelerating
    return Math.round(FILL_FIRST_MS + (FILL_LAST_MS - FILL_FIRST_MS) * eased);
}

/* ─── Component ─── */
export const ShakespeareRowCounter = memo(function ShakespeareRowCounter() {
    const { t } = useI18n();
    const reduce = useReducedMotion();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [phase, setPhase] = useState<Phase>("idle");

    // Manual phase state
    const [scanIndex, setScanIndex] = useState(-1); // which "t" position we're inspecting
    const [tally, setTally] = useState<Record<string, number>>({}); // follower → hand-count
    const [order, setOrder] = useState<string[]>([]); // first-seen order of followers (stable pill layout)
    const [changedFollower, setChangedFollower] = useState<string | null>(null); // bumped this step → pops

    // Table phase state
    const [fillStep, setFillStep] = useState(0); // 0..FILL_STEPS
    const [bumpedCol, setBumpedCol] = useState<string | null>(null); // column that grew this tick → pops

    // The §2 anchor's "t" origin positions, computed once.
    const tPositions = useMemo(() => findTPositions(FRAGMENT), []);

    // The canonical Shakespeare `t → *` row, descending — the table's target.
    const row = SHAKESPEARE_ROW_T.followers;
    const rowMax = row.length > 0 ? row[0].count : 1; // max-normalized bars (the leader fills the track)
    const rowTotal = useMemo(
        () => row.reduce((s, f) => s + f.count, 0),
        [row],
    );

    // Refs the timeout-driven loops read without re-creating callbacks each render.
    const scanRef = useRef<(index: number) => void>(() => {});
    const fillRef = useRef<(step: number) => void>(() => {});

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    /* ── Manual scan: inspect "t" at position `index`, record its follower ── */
    const scanStep = useCallback(
        (index: number) => {
            if (index < 0 || index >= tPositions.length) {
                // Ran out of "t"s before the threshold — still offer the table.
                setScanIndex(-1);
                setChangedFollower(null);
                setPhase("organize");
                return;
            }
            setScanIndex(index);
            const follower = FRAGMENT[tPositions[index] + 1];
            setTally((prev) => ({ ...prev, [follower]: (prev[follower] ?? 0) + 1 }));
            setOrder((prev) => (prev.includes(follower) ? prev : [...prev, follower]));
            setChangedFollower(follower);

            // Once the hand-count is a mess, stop and surface the "jot it in a table?" prompt.
            if (index + 1 >= MESSY_THRESHOLD) {
                timerRef.current = setTimeout(() => {
                    setScanIndex(-1);
                    setChangedFollower(null);
                    setPhase("organize");
                }, SCAN_DELAY_MS + 220);
                return;
            }

            timerRef.current = setTimeout(
                () => scanRef.current(index + 1),
                SCAN_DELAY_MS,
            );
        },
        [tPositions],
    );

    /* ── Table fill: one accelerating tick toward the full corpus ── */
    const fillTick = useCallback(
        (step: number) => {
            if (step >= FILL_STEPS) {
                setFillStep(FILL_STEPS);
                setBumpedCol(null);
                setPhase("done");
                return;
            }
            setFillStep(step + 1);
            // Each tick, the leader (h) is what visibly grows — pop the column that moved most.
            setBumpedCol(row.length > 0 ? row[0].char : null);
            timerRef.current = setTimeout(
                () => fillRef.current(step + 1),
                reduce ? 0 : fillDelay(step),
            );
        },
        [row, reduce],
    );

    // Keep the loop refs pointing at the latest closures (assigned in effects, never in render).
    useEffect(() => {
        scanRef.current = scanStep;
    }, [scanStep]);
    useEffect(() => {
        fillRef.current = fillTick;
    }, [fillTick]);

    /* ── Drivers ── */
    const startManual = useCallback(() => {
        clearTimer();
        setPhase("manual");
        setScanIndex(-1);
        setTally({});
        setOrder([]);
        setChangedFollower(null);
        setFillStep(0);
        setBumpedCol(null);
        if (tPositions.length === 0) {
            setPhase("organize");
            return;
        }
        if (reduce) {
            // Reduced motion: skip the slow scan, jump straight to the "organize" decision.
            // Still populate a representative hand-tally so the mess is legible.
            const t0: Record<string, number> = {};
            const ord: string[] = [];
            for (let i = 0; i < Math.min(MESSY_THRESHOLD, tPositions.length); i++) {
                const f = FRAGMENT[tPositions[i] + 1];
                t0[f] = (t0[f] ?? 0) + 1;
                if (!ord.includes(f)) ord.push(f);
            }
            setTally(t0);
            setOrder(ord);
            setPhase("organize");
            return;
        }
        timerRef.current = setTimeout(() => scanRef.current(0), FIRST_STEP_MS);
    }, [clearTimer, tPositions, reduce]);

    const startFilling = useCallback(() => {
        clearTimer();
        setPhase("filling");
        setFillStep(0);
        setBumpedCol(null);
        if (reduce) {
            setFillStep(FILL_STEPS);
            setPhase("done");
            return;
        }
        timerRef.current = setTimeout(() => fillRef.current(0), FILL_FIRST_MS);
    }, [clearTimer, reduce]);

    const replay = useCallback(() => {
        clearTimer();
        setPhase("idle");
        setScanIndex(-1);
        setTally({});
        setOrder([]);
        setChangedFollower(null);
        setFillStep(0);
        setBumpedCol(null);
    }, [clearTimer]);

    /* ── Cleanup on unmount ── */
    useEffect(() => clearTimer, [clearTimer]);

    /* ── Derived view state ── */
    const handPairs = useMemo(
        () => Object.values(tally).reduce((a, b) => a + b, 0),
        [tally],
    );

    // Hand-tally pills in first-seen order (stable layout; the mess grows left→right, wraps).
    const pills = useMemo(
        () => order.map((f) => ({ follower: f, count: tally[f] ?? 0 })),
        [order, tally],
    );

    const currentPos =
        phase === "manual" && scanIndex >= 0 && scanIndex < tPositions.length
            ? tPositions[scanIndex]
            : -1;

    // Table fill fraction (0 → 1), eased so early ticks barely move and late ticks surge.
    const fillFrac = useMemo(() => {
        if (phase === "done") return 1;
        if (phase !== "filling") return 0;
        const k = fillStep / FILL_STEPS;
        return 1 - Math.pow(1 - k, 2.4); // matches the interval easing → counts surge late
    }, [phase, fillStep]);

    const winner = row[0];
    const winnerPct =
        winner && rowTotal > 0
            ? `${Math.round((winner.count / rowTotal) * 100)} %`
            : "";

    const showTable = phase === "filling" || phase === "done";

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", fontFamily: SERIF }}>
            {/* ── Eyebrow + prompt ── */}
            <p
                style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "var(--bigram-muted)",
                    margin: "0 0 10px",
                    textAlign: "center",
                }}
            >
                {t("bigramNarrative.v2.shakespeareRow.label")}
            </p>

            {/* ── Idle: the invitation + start ── */}
            <AnimatePresence mode="wait">
                {phase === "idle" && (
                    <motion.div
                        key="idle"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{ textAlign: "center", padding: "12px 0 4px" }}
                    >
                        <p
                            style={{
                                fontFamily: SERIF,
                                fontSize: "clamp(19px, 2.4vw, 23px)",
                                lineHeight: 1.45,
                                color: "var(--bigram-ink)",
                                margin: "0 auto 22px",
                                maxWidth: "30ch",
                                textWrap: "balance",
                            }}
                        >
                            {t("bigramNarrative.v2.shakespeareRow.prompt")}
                        </p>
                        <button
                            type="button"
                            onClick={startManual}
                            style={primaryBtnStyle()}
                        >
                            {t("bigramNarrative.v2.shakespeareRow.countingManually")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Manual & organize phases: the fragment hero + the growing hand-tally ── */}
            {(phase === "manual" || phase === "organize") && (
                <div>
                    {/* THE FRAGMENT — large, centered, the "t" lit accent, its follower tinted */}
                    <div
                        style={{
                            fontFamily: MONO,
                            fontSize: "clamp(17px, 2.1vw, 22px)",
                            lineHeight: 1.85,
                            letterSpacing: ".005em",
                            textAlign: "center",
                            padding: "26px 22px",
                            borderRadius: "var(--bigram-r-lg)",
                            background: "var(--bigram-bg-2)",
                            boxShadow: "inset 0 2px 8px rgba(0,0,0,.30)",
                            wordBreak: "normal",
                            overflowWrap: "break-word",
                            userSelect: "none",
                        }}
                    >
                        {FRAGMENT.split("").map((char, i) => {
                            const isOrigin = i === currentPos; // hot1 — the "t" under inspection
                            const isFollower = i === currentPos + 1; // hot2 — what follows it
                            // "t"s already counted recede to a faint accent tint.
                            const tIdx = tPositions.indexOf(i);
                            const isPast =
                                !isOrigin &&
                                !isFollower &&
                                tIdx >= 0 &&
                                scanIndex > tIdx;

                            let color = "var(--bigram-dim)";
                            let background = "transparent";
                            let boxShadow = "none";
                            let fontWeight = 400;

                            if (isOrigin) {
                                color = "var(--bigram-on-accent)";
                                background = "var(--bigram-accent)";
                                fontWeight = 700;
                            } else if (isFollower) {
                                color = "var(--bigram-accent-ink)";
                                background = "var(--bigram-accent-soft)";
                                boxShadow =
                                    "inset 0 0 0 2px color-mix(in oklab, var(--bigram-accent) 38%, transparent)";
                                fontWeight = 700;
                            } else if (isPast) {
                                color =
                                    "color-mix(in oklab, var(--bigram-accent) 40%, var(--bigram-dim))";
                            }

                            return (
                                <span
                                    key={i}
                                    style={{
                                        color,
                                        background,
                                        boxShadow,
                                        fontWeight,
                                        padding: char === " " ? "2px 3px" : "2px 1px",
                                        borderRadius: 6,
                                        transition:
                                            "color .24s ease, background .24s ease, box-shadow .24s ease",
                                    }}
                                >
                                    {char}
                                </span>
                            );
                        })}
                    </div>

                    {/* HAND-TALLY — pairs counted by hand, as accent-tinted pills that pile up.
                        This is the MESS: many pills, no order, the eye can't find the winner. */}
                    <div style={{ marginTop: 22 }}>
                        <p
                            style={{
                                fontFamily: MONO,
                                fontSize: 11,
                                letterSpacing: ".16em",
                                textTransform: "uppercase",
                                color: "var(--bigram-muted)",
                                margin: "0 0 12px",
                                textAlign: "center",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {t("bigramNarrative.v2.shakespeareRow.messyHint", {
                                count: handPairs,
                            })}
                        </p>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center",
                                gap: 8,
                                minHeight: 40,
                            }}
                        >
                            <AnimatePresence>
                                {pills.map(({ follower, count }) => (
                                    <TallyPill
                                        key={follower}
                                        dst={follower}
                                        count={count}
                                        pop={!reduce && follower === changedFollower}
                                        reduce={!!reduce}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* "What if we jot it in a table?" — the structure-inventing prompt.
                        Only once the hand-count is a genuine mess. */}
                    <AnimatePresence>
                        {phase === "organize" && (
                            <motion.div
                                key="organize"
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: reduce ? 0 : 0.15,
                                    ease: [0.2, 0.8, 0.2, 1],
                                }}
                                style={{ marginTop: 26, textAlign: "center" }}
                            >
                                <button
                                    type="button"
                                    onClick={startFilling}
                                    style={primaryBtnStyle()}
                                >
                                    {t("bigramNarrative.v2.shakespeareRow.organizeCta")}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Table phase: the single 1×N row, filling accelerating to full Shakespeare ── */}
            {showTable && (
                <motion.div
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                >
                    {/* status line — counting-up framing, switches to "Full Shakespeare" at the end */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            minHeight: 24,
                            margin: "4px 0 18px",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: MONO,
                                fontSize: 11,
                                letterSpacing: ".16em",
                                textTransform: "uppercase",
                                color:
                                    phase === "done"
                                        ? "var(--bigram-sage)"
                                        : "var(--bigram-muted)",
                                transition: "color .3s ease",
                            }}
                        >
                            {phase === "done"
                                ? t("bigramNarrative.v2.shakespeareRow.fullCorpus")
                                : t("bigramNarrative.v2.shakespeareRow.fillingTable")}
                        </span>
                    </div>

                    {/* The 1×N row label */}
                    <p
                        style={{
                            fontFamily: MONO,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--bigram-ink)",
                            margin: "0 0 12px",
                            textAlign: "left",
                        }}
                    >
                        {t("bigramNarrative.v2.shakespeareRow.rowLabel")}
                    </p>

                    {/* The row of count-rows — integer count, max-normalized bar, per-tick pop */}
                    <div>
                        {row.map((f, rank) => {
                            // Each column grows from ~0 to its true count along the eased fill.
                            const live = Math.round(f.count * fillFrac);
                            return (
                                <TableRow
                                    key={f.char}
                                    dst={f.char}
                                    count={live}
                                    max={Math.max(Math.round(rowMax * fillFrac), 1)}
                                    top={rank === 0}
                                    pop={
                                        !reduce &&
                                        phase === "filling" &&
                                        f.char === bumpedCol
                                    }
                                    reduce={!!reduce}
                                />
                            );
                        })}
                    </div>

                    {/* total — top rule, mono key + count */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            margin: "14px 0 0",
                            paddingTop: 12,
                            borderTop: "1px solid var(--bigram-rule)",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: MONO,
                                fontSize: 11,
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                color: "var(--bigram-muted)",
                            }}
                        >
                            {t("bigramNarrative.v2.shakespeareRow.rowLabel")}
                        </span>
                        <span
                            style={{
                                fontFamily: MONO,
                                fontSize: 17,
                                fontWeight: 600,
                                color: "var(--bigram-ink)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {Math.round(rowTotal * fillFrac).toLocaleString()}
                        </span>
                    </div>

                    {/* VERDICT — sage panel: after "t", "h" wins. Plus replay. */}
                    <AnimatePresence>
                        {phase === "done" && winner && (
                            <motion.div
                                key="verdict"
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: reduce ? 0 : 0.35,
                                    ease: [0.2, 0.8, 0.2, 1],
                                }}
                                style={{ marginTop: 24, textAlign: "center" }}
                            >
                                <Verdict
                                    label={t("bigramNarrative.v2.shakespeareRow.label")}
                                    main={
                                        <VerdictSentence
                                            text={t(
                                                "bigramNarrative.v2.shakespeareRow.verdict",
                                            )}
                                        />
                                    }
                                    sub={t("bigramNarrative.v2.shakespeareRow.verdictSub", {
                                        best: displayChar(winner.char),
                                        pct: winnerPct,
                                    })}
                                />

                                <button
                                    type="button"
                                    onClick={replay}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontFamily: MONO,
                                        fontSize: 11,
                                        letterSpacing: ".06em",
                                        padding: "7px 14px",
                                        marginTop: 18,
                                        border: 0,
                                        borderRadius: "var(--bigram-r-sm)",
                                        cursor: "pointer",
                                        background: "transparent",
                                        color: "var(--bigram-muted)",
                                        boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
                                    }}
                                >
                                    ↻ {t("bigramNarrative.v2.shakespeareRow.countingManually")}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
});

/* ─── Hand-tally pill — a follower counted by hand; tints accent once seen twice ─── */
const TallyPill = memo(function TallyPill({
    dst,
    count,
    pop,
    reduce,
}: {
    dst: string;
    count: number;
    pop: boolean;
    reduce: boolean;
}) {
    const repeated = count >= 2;
    const isSpace = dst === " ";

    return (
        <motion.div
            layout={!reduce}
            initial={reduce ? false : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={
                reduce ? { duration: 0 } : { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }
            }
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                padding: "6px 8px 6px 13px",
                borderRadius: "var(--bigram-r-pill)",
                background: repeated
                    ? "var(--bigram-accent-soft)"
                    : "color-mix(in oklab, var(--bigram-ink) 5%, transparent)",
                boxShadow: repeated
                    ? "inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 26%, transparent)"
                    : "none",
            }}
        >
            <span
                style={{
                    fontFamily: MONO,
                    fontSize: 16,
                    display: "inline-flex",
                    alignItems: "baseline",
                }}
            >
                <span
                    style={{
                        color: repeated
                            ? "color-mix(in oklab, var(--bigram-accent) 60%, var(--bigram-dim))"
                            : "var(--bigram-dim)",
                        fontWeight: repeated ? 500 : 400,
                    }}
                >
                    t
                </span>
                <span
                    style={{
                        color: repeated
                            ? "color-mix(in oklab, var(--bigram-accent) 60%, var(--bigram-dim))"
                            : "var(--bigram-dim)",
                        fontSize: 12,
                        margin: "0 3px",
                    }}
                >
                    →
                </span>
                <span
                    style={
                        isSpace
                            ? {
                                  fontSize: 11,
                                  fontWeight: 600,
                                  letterSpacing: ".03em",
                                  color: repeated
                                      ? "var(--bigram-accent-ink)"
                                      : "var(--bigram-dim)",
                              }
                            : {
                                  color: repeated
                                      ? "var(--bigram-accent-ink)"
                                      : "var(--bigram-ink)",
                                  fontWeight: repeated ? 600 : 500,
                              }
                    }
                >
                    {displayChar(dst)}
                </span>
            </span>

            {/* count disc — pops on each increment */}
            <motion.span
                key={`${dst}-${count}`}
                animate={pop ? { scale: [1.55, 1] } : { scale: 1 }}
                transition={
                    pop ? { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } : { duration: 0 }
                }
                style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    color: repeated
                        ? "var(--bigram-on-accent)"
                        : "var(--bigram-dim)",
                    fontVariantNumeric: "tabular-nums",
                    minWidth: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "inline-grid",
                    placeItems: "center",
                    background: repeated
                        ? "var(--bigram-accent)"
                        : "color-mix(in oklab, var(--bigram-ink) 9%, transparent)",
                }}
            >
                {count}
            </motion.span>
        </motion.div>
    );
});

/* ─── Table count-row — the 1×N row's cell: pair label, max-normalized bar, integer count ─── */
const TableRow = memo(function TableRow({
    dst,
    count,
    max,
    top,
    pop,
    reduce,
}: {
    dst: string;
    count: number;
    max: number;
    top: boolean;
    pop: boolean;
    reduce: boolean;
}) {
    const isSpace = dst === " ";
    const width = `${Math.round((count / Math.max(max, 1)) * 100)}%`;

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr 56px",
                alignItems: "center",
                gap: 16,
                margin: "9px 0",
            }}
        >
            {/* label — t→dst pair */}
            <span
                style={{
                    fontFamily: MONO,
                    fontSize: 16,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 2,
                    whiteSpace: "nowrap",
                }}
            >
                <span style={{ color: "var(--bigram-dim)", fontWeight: 500 }}>t</span>
                <span
                    style={{
                        color: "var(--bigram-dim)",
                        fontWeight: 400,
                        margin: "0 2px",
                        fontSize: 13,
                    }}
                >
                    →
                </span>
                <span
                    style={
                        isSpace
                            ? {
                                  fontSize: 12,
                                  fontWeight: 600,
                                  letterSpacing: ".03em",
                                  color: "var(--bigram-dim)",
                              }
                            : {
                                  color: top
                                      ? "var(--bigram-accent-ink)"
                                      : "var(--bigram-ink)",
                                  fontWeight: 700,
                                  fontSize: "1.05em",
                              }
                    }
                >
                    {displayChar(dst)}
                </span>
            </span>

            {/* 6px sunk track + max-normalized fill */}
            <span
                style={{
                    position: "relative",
                    height: 6,
                    borderRadius: 6,
                    overflow: "hidden",
                    background: "color-mix(in oklab, var(--bigram-ink) 10%, transparent)",
                }}
            >
                <motion.i
                    animate={{ width }}
                    transition={
                        reduce
                            ? { duration: 0 }
                            : { duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }
                    }
                    style={{
                        display: "block",
                        height: "100%",
                        borderRadius: 6,
                        background: top
                            ? "var(--bigram-accent-bright)"
                            : "var(--bigram-accent-2)",
                    }}
                />
            </span>

            {/* integer count — pops on each tick of the column that grew */}
            <motion.span
                animate={pop ? { scale: [1.35, 1] } : { scale: 1 }}
                transition={
                    pop ? { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] } : { duration: 0 }
                }
                style={{
                    fontFamily: MONO,
                    fontSize: 14,
                    fontWeight: 600,
                    color: top ? "var(--bigram-accent)" : "var(--bigram-muted)",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {count.toLocaleString()}
            </motion.span>
        </div>
    );
});

/* ─── primary CTA button style — accent fill, the chapter's call-to-action ─── */
function primaryBtnStyle(): React.CSSProperties {
    return {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: MONO,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: ".02em",
        padding: "11px 22px",
        border: 0,
        borderRadius: "var(--bigram-r-md)",
        cursor: "pointer",
        background: "var(--bigram-accent)",
        color: "var(--bigram-on-accent)",
        boxShadow:
            "0 6px 18px -7px color-mix(in oklab, var(--bigram-accent) 70%, transparent)",
    };
}

/**
 * Renders the verdict sentence, wrapping the single-letter glyphs "t" and "h" in bold
 * spans so they read in accent-ink inside the sage Verdict panel. Works for both the ES
 * ("…tras la «t» gana la «h».") and EN ("…\"h\" wins after \"t\".") copy by bolding the
 * quoted letters wherever they appear.
 */
function VerdictSentence({ text }: { text: string }) {
    // Match the letters as they appear quoted in copy: «t»/«h» (es) or "t"/"h" (en).
    const parts = text.split(/(«[th]»|"[th]")/g);
    return (
        <>
            {parts.map((part, i) => {
                if (/^(«[th]»|"[th]")$/.test(part)) {
                    return <b key={i}>{part}</b>;
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}
