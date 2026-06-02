"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    AnimatePresence,
    LayoutGroup,
    motion,
    useReducedMotion,
} from "framer-motion";

import {
    createAccumulator,
    displayChar,
    feed,
    scanDelay,
    SHAKESPEARE_SAMPLE,
} from "@/features/lab/data/bigramCorpus";
import { useI18n } from "@/i18n/context";

/**
 * ChaosAndOrder — the Bigram chapter SHOWPIECE that dramatizes WHY counts become a table.
 *
 * ONE idea, felt before it is named: structure is BORN from necessity, not imposed. The
 * reader watches a machine "read" Shakespeare, ejecting a floating chip for every `t→*`
 * pair. The chips pile into a drifting, ungovernable cloud ("this is getting out of hand").
 * Then — the hero beat — the cloud SNAPS into a single ordered row: each chip flies (FLIP,
 * shared layout) into a column keyed by its follower letter; duplicates merge into a count.
 * Finally the counter races over the REST of the text on an accelerating schedule, the
 * real counts climbing (never jumping) to their true Shakespeare totals. The payoff: you
 * just watched a model being trained.
 *
 * Sits between "…let it read Shakespeare." and "You just watched a model being trained."
 * Emotional arc: awe → chaos → relief/clarity.
 *
 * The numbers are REAL: every count is derived live from SHAKESPEARE_SAMPLE via the shared
 * streaming accumulator (createAccumulator/feed), the same engine the matrix uses. No faked totals.
 *
 * Token-only (--bigram-*), works in both themes via the page's [data-bigram-theme] scope.
 * Reduced-motion safe: skips reading/chaos/FLIP and renders the finished ordered table with
 * the true final totals + the payoff — no information lost.
 *
 * Motion bible: STD easing for reveals, SPRING_SNAP for the FLIP, scanDelay() for the
 * accelerating read, the count-tick pop for climbing numbers, the scan glyph idiom.
 */

/* ─── Motion constants (canonical — bigram motion bible §1) ─── */
const STD = [0.2, 0.8, 0.2, 1] as const;
const SPRING_SNAP = { type: "spring", stiffness: 380, damping: 32 } as const;

/* ─── Pacing ─── */
const READ_STEP_MS = 150; // cursor cadence in the slow "reading" sweep
const CHIP_CAP = 32; // floating chips capped so the cloud stays 60fps
const CHAOS_HOLD_MS = 900; // beat after the last chip ejects before the pause line

/* ─── Layout of the chaos cloud (bounded drift field) ─── */
const STAGE_H = 320; // px — the fixed-height stage so chips never cause layout shift
const ORIGIN = "t"; // the single row we dramatize: t → *

type Phase =
    | "idle"
    | "reading"
    | "chaos"
    | "pause"
    | "ordering"
    | "scanning"
    | "done";

/** A single ejected pair, with a stable id used as the FLIP layoutId. */
interface Chip {
    id: number;
    follower: string;
    /* bounded random resting spot in the chaos cloud (percent of stage) */
    x: number;
    y: number;
    /* gentle drift amplitude + phase, so each chip floats on its own rhythm */
    driftX: number;
    driftY: number;
    rot: number;
    dur: number;
}

/** A column in the ordered table: a follower letter, in first-seen order. */
interface Column {
    follower: string;
    chipIds: number[]; // chips that merged into this column (first owns the layout slot)
    count: number; // TRUE running count from the accumulator
}

/* ════════════════════════════════════════════════════════════════════════
   Precompute (module-load, microseconds): the t→* positions in the corpus,
   and the TRUE final totals as a cross-check for the climbing scan.
   ════════════════════════════════════════════════════════════════════════ */

/** Indices i where text[i] === "t" and a follower exists. */
function originPositions(text: string): number[] {
    const out: number[] = [];
    for (let i = 0; i < text.length - 1; i++) {
        if (text[i] === ORIGIN) out.push(i);
    }
    return out;
}

const T_POSITIONS = originPositions(SHAKESPEARE_SAMPLE);

/** TRUE final t→* totals (descending), derived from the corpus — the scan lands here. */
function trueTotals(): { follower: string; count: number }[] {
    const tally: Record<string, number> = {};
    const order: string[] = [];
    for (const i of T_POSITIONS) {
        const f = SHAKESPEARE_SAMPLE[i + 1];
        if (!(f in tally)) order.push(f);
        tally[f] = (tally[f] ?? 0) + 1;
    }
    return order
        .map((f) => ({ follower: f, count: tally[f] }))
        .sort((a, b) => b.count - a.count);
}

const TRUE_TOTALS = trueTotals();
const TRUE_TOTAL_SUM = TRUE_TOTALS.reduce((s, t) => s + t.count, 0);

/* deterministic pseudo-random so the cloud is stable across renders but feels organic */
function seeded(n: number): number {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

/* ════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════ */

export const ChaosAndOrder = memo(function ChaosAndOrder({
    accent = "bigram",
}: {
    accent?: "bigram";
}) {
    void accent; // single-accent chapter; prop kept for API symmetry
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [phase, setPhase] = useState<Phase>("idle");
    const [cursor, setCursor] = useState(-1); // index into SHAKESPEARE_SAMPLE the reader is on
    const [chips, setChips] = useState<Chip[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);
    const [poppedFollower, setPoppedFollower] = useState<string | null>(null);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stepRef = useRef<(i: number) => void>(() => {});
    const chipSeq = useRef(0);
    /* mirror of `chips` so the ordering hand-off reads fresh chips without re-creating callbacks */
    const chipsRef = useRef<Chip[]>([]);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    /* keep the chips ref in lockstep with state for the (deferred) ordering read */
    useEffect(() => {
        chipsRef.current = chips;
    }, [chips]);

    /* ── reset to a clean slate ── */
    const reset = useCallback(() => {
        clearTimer();
        chipSeq.current = 0;
        chipsRef.current = [];
        setCursor(-1);
        setChips([]);
        setColumns([]);
        setPoppedFollower(null);
    }, [clearTimer]);

    /* ── eject one chip for the t→follower pair at corpus index i ── */
    const ejectChip = useCallback((follower: string) => {
        const id = chipSeq.current++;
        const r1 = seeded(id + 1);
        const r2 = seeded(id + 53);
        const r3 = seeded(id + 131);
        const r4 = seeded(id + 211);
        const chip: Chip = {
            id,
            follower,
            // bounded cloud: keep a margin so chips never clip the stage edge
            x: 10 + r1 * 80,
            y: 12 + r2 * 70,
            driftX: (r3 - 0.5) * 5.2,
            driftY: (r4 - 0.5) * 5.2,
            rot: (r1 - 0.5) * 10,
            dur: 5 + r3 * 4,
        };
        setChips((prev) => {
            const next = [...prev, chip];
            return next.length > CHIP_CAP ? next.slice(next.length - CHIP_CAP) : next;
        });
    }, []);

    /* ════════════════════════════════════════════════════════════════════
       PHASE: reading — sweep the corpus char by char; on each "t", eject a chip.
       We only read far enough into the text to accumulate ~CHIP_CAP chips so the
       cloud is dense but bounded; the REST of the text is consumed in "scanning".
       ════════════════════════════════════════════════════════════════════ */
    const readStep = useCallback(
        (i: number) => {
            // stop reading once we have a full cloud (or run out of text)
            if (
                chipSeq.current >= CHIP_CAP ||
                i >= SHAKESPEARE_SAMPLE.length - 1
            ) {
                setCursor(i);
                // let the last chip settle, then transition to the pause beat
                timerRef.current = setTimeout(() => {
                    setPhase("pause");
                }, CHAOS_HOLD_MS);
                return;
            }
            setCursor(i);
            if (SHAKESPEARE_SAMPLE[i] === ORIGIN) {
                ejectChip(SHAKESPEARE_SAMPLE[i + 1]);
                // we entered chaos the moment the first chip flew
                setPhase((p) => (p === "reading" ? "chaos" : p));
            }
            timerRef.current = setTimeout(
                () => stepRef.current(i + 1),
                READ_STEP_MS,
            );
        },
        [ejectChip],
    );

    useEffect(() => {
        stepRef.current = readStep;
    }, [readStep]);

    /* ════════════════════════════════════════════════════════════════════
       PHASE: ordering — collapse the chaos cloud into a single ordered ROW.
       Each chip's layoutId is preserved, so swapping it from the absolutely-
       positioned cloud into a table column makes Framer FLIP it into place.
       Columns are created in first-seen order; duplicates merge into a count.
       The counts shown here are the chips already ejected (a real partial tally).
       ════════════════════════════════════════════════════════════════════ */
    const startOrdering = useCallback(() => {
        clearTimer();
        // Build columns from the chips currently floating, in first-seen order. The chips
        // themselves stay mounted (same layoutIds) — they FLIP from the cloud into the table.
        const floating = chipsRef.current;
        const cols: Column[] = [];
        const byFollower = new Map<string, Column>();
        for (const c of floating) {
            let col = byFollower.get(c.follower);
            if (!col) {
                col = { follower: c.follower, chipIds: [], count: 0 };
                byFollower.set(c.follower, col);
                cols.push(col);
            }
            col.chipIds.push(c.id);
            col.count += 1;
        }
        setColumns(cols);
        setPhase("ordering");
    }, [clearTimer]);

    /* ════════════════════════════════════════════════════════════════════
       PHASE: scanning — race the counter over the REST of the corpus on the
       canonical accelerating schedule. Each tick feeds one (prev→next) pair to
       the live accumulator; when prev === "t" we bump that follower's column to
       its TRUE running count and pop it. The cursor races ahead, blurring.
       ════════════════════════════════════════════════════════════════════ */
    const scanRef = useRef<(i: number) => void>(() => {});

    const startScanning = useCallback(() => {
        clearTimer();
        setPhase("scanning");

        // ONE real accumulator (the shared streaming engine the matrix uses) drives the WHOLE
        // corpus. We only ever read its t-row, so the climbing counts are provably TRUE — the
        // same arithmetic the rest of the chapter trusts. We pre-feed the corpus up to the point
        // the cloud already represents, so the live row resumes from the partial tally on screen
        // (no reset to zero) and then keeps climbing to the full Shakespeare totals.
        const acc = createAccumulator();
        const total = SHAKESPEARE_SAMPLE.length - 1;

        // chipsAlready = how many t→* pairs the floating cloud already showed; we silently
        // feed the corpus until exactly that many t-origins have passed, so the visible counts
        // line up with the chips, then start animating from there.
        const chipsAlready = chipsRef.current.length;
        let tSeen = 0;
        let resumeFrom = 0;
        // pre-feed silently up to (and including) the chip-th t-origin pair
        for (let i = 0; i < total; i++) {
            feed(acc, SHAKESPEARE_SAMPLE[i], SHAKESPEARE_SAMPLE[i + 1]);
            if (SHAKESPEARE_SAMPLE[i] === ORIGIN) {
                tSeen += 1;
                if (tSeen >= chipsAlready) {
                    resumeFrom = i + 1; // resume animating from the next adjacency
                    break;
                }
            }
        }

        const tRow = () => acc.index.get(ORIGIN);

        /** refresh a columns array off the live t-row of the REAL accumulator. Preserves the
         *  ordered columns' first-seen order + chip ownership (for layout stability); appends any
         *  follower born after ordering as a newborn column. Built off React's authoritative prev
         *  state via the functional updater, so it never drifts on a stale ref. */
        const liveColumns = (prevCols: Column[]): Column[] => {
            const row = tRow();
            if (row === undefined) return prevCols;
            const seen = new Set(prevCols.map((c) => c.follower));
            const out: Column[] = prevCols.map((c) => {
                const col = acc.index.get(c.follower);
                return {
                    ...c,
                    count: col !== undefined ? acc.counts[row][col] : c.count,
                };
            });
            for (let ci = 0; ci < acc.charset.length; ci++) {
                const f = acc.charset[ci];
                if (acc.counts[row][ci] > 0 && !seen.has(f)) {
                    out.push({ follower: f, chipIds: [], count: acc.counts[row][ci] });
                    seen.add(f);
                }
            }
            return out;
        };

        const tick = (i: number) => {
            if (i >= total) {
                // settle on the canonical TRUE totals, descending — the real Shakespeare answer.
                setColumns(
                    TRUE_TOTALS.map((tt) => ({
                        follower: tt.follower,
                        chipIds: [],
                        count: tt.count,
                    })),
                );
                setPhase("done");
                return;
            }
            const prev = SHAKESPEARE_SAMPLE[i];
            const next = SHAKESPEARE_SAMPLE[i + 1];
            feed(acc, prev, next); // advance the REAL counts by one adjacency
            setCursor(i);

            if (prev === ORIGIN) {
                setColumns((prevCols) => liveColumns(prevCols));
                setPoppedFollower(next);
            }

            timerRef.current = setTimeout(
                () => scanRef.current(i + 1),
                Math.max(8, scanDelay(i, total, { first: 90, last: 8, ease: 2.8 })),
            );
        };

        scanRef.current = tick;
        timerRef.current = setTimeout(() => scanRef.current(resumeFrom), 260);
    }, [clearTimer]);

    /* ── drivers ── */
    const play = useCallback(() => {
        reset();
        if (reduce) {
            // Reduced motion: jump straight to the finished, ordered, TRUE table.
            setPhase("done");
            setColumns(
                TRUE_TOTALS.map((tt) => ({
                    follower: tt.follower,
                    chipIds: [],
                    count: tt.count,
                })),
            );
            return;
        }
        setPhase("reading");
        timerRef.current = setTimeout(() => stepRef.current(0), 360);
    }, [reset, reduce]);

    const replay = useCallback(() => {
        reset();
        setPhase("idle");
    }, [reset]);

    /* clear every pending timeout on unmount (the timeout-ref idiom) */
    useEffect(() => clearTimer, [clearTimer]);

    /* clear the per-tick pop shortly after it fires so it can re-fire on the next bump */
    useEffect(() => {
        if (!poppedFollower) return;
        const id = setTimeout(() => setPoppedFollower(null), 360);
        return () => clearTimeout(id);
    }, [poppedFollower]);

    /* ── derived view state ── */
    const inCloud = phase === "reading" || phase === "chaos" || phase === "pause";
    const inTable =
        phase === "ordering" || phase === "scanning" || phase === "done";
    const chipCount = chips.length;

    const caption = useMemo(() => {
        switch (phase) {
            case "reading":
                return t("bigramNarrative.v2.chaosOrder.readingHint");
            case "chaos":
                return t("bigramNarrative.v2.chaosOrder.chaosHint");
            case "ordering":
                return t("bigramNarrative.v2.chaosOrder.orderingHint");
            case "scanning":
                return t("bigramNarrative.v2.chaosOrder.scanningHint");
            default:
                return "";
        }
    }, [phase, t]);

    /* max for the column bars — normalized to the running leader so the winner fills */
    const colMax = useMemo(
        () => columns.reduce((m, c) => Math.max(m, c.count), 1),
        [columns],
    );
    const colTotal = useMemo(
        () => columns.reduce((s, c) => s + c.count, 0),
        [columns],
    );
    const leader = useMemo(
        () =>
            columns.reduce(
                (best, c) => (c.count > (best?.count ?? -1) ? c : best),
                null as Column | null,
            ),
        [columns],
    );

    return (
        <div className="bw-chaos" style={{ fontFamily: "var(--bigram-font-serif)" }}>
            <BwStyle />

            {/* ── eyebrow label ── */}
            <p className="bw-chaos__label">
                {t("bigramNarrative.v2.chaosOrder.label")}
            </p>

            {/* ── idle: the invitation + PLAY ── */}
            <AnimatePresence mode="wait">
                {phase === "idle" && (
                    <motion.div
                        key="idle"
                        className="bw-chaos__idle"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease: STD }}
                    >
                        <button
                            type="button"
                            className="bw-chaos__play"
                            onClick={play}
                        >
                            <span className="bw-chaos__play-tri" aria-hidden>
                                ▶
                            </span>
                            {t("bigramNarrative.v2.chaosOrder.playLabel")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── the stage (cloud + table share it via LayoutGroup for the FLIP) ── */}
            {phase !== "idle" && (
                <LayoutGroup>
                    {/* THE READING STRIP — the corpus the cursor sweeps */}
                    {(phase === "reading" ||
                        phase === "chaos" ||
                        phase === "pause" ||
                        phase === "scanning") && (
                        <ReadingStrip
                            cursor={cursor}
                            blurred={phase === "scanning"}
                        />
                    )}

                    {/* THE CLOUD — floating chips while reading/chaos/pause */}
                    {inCloud && (
                        <div
                            className="bw-chaos__stage"
                            style={{ height: STAGE_H }}
                            aria-hidden
                        >
                            <AnimatePresence>
                                {chips.map((c) => (
                                    <FloatingChip
                                        key={c.id}
                                        chip={c}
                                        reduce={!!reduce}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* THE ORDERED ROW — chips FLIP into columns; counts climb live */}
                    {inTable && (
                        <OrderedRow
                            columns={columns}
                            chips={chips}
                            colMax={colMax}
                            colTotal={colTotal}
                            leader={leader}
                            poppedFollower={poppedFollower}
                            phase={phase}
                            reduce={!!reduce}
                            rowLabel={t("bigramNarrative.v2.chaosOrder.rowLabel")}
                        />
                    )}
                </LayoutGroup>
            )}

            {/* ── live caption (one focal line under the stage) ── */}
            <div className="bw-chaos__caption-wrap" aria-live="polite">
                <AnimatePresence mode="wait">
                    {caption && (
                        <motion.p
                            key={phase}
                            className="bw-chaos__caption"
                            initial={reduce ? false : { opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.36, ease: STD }}
                            data-tone={phase === "chaos" ? "hot" : "calm"}
                        >
                            {caption}
                            {(phase === "reading" || phase === "chaos") && (
                                <span className="bw-chaos__count">
                                    {" "}
                                    · {chipCount}
                                </span>
                            )}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* ── pause: a serif line + the "Let's order this" CTA ── */}
            <AnimatePresence>
                {phase === "pause" && (
                    <motion.div
                        key="pause"
                        className="bw-chaos__pause"
                        initial={reduce ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: STD }}
                    >
                        <p className="bw-chaos__pause-line">
                            {t("bigramNarrative.v2.chaosOrder.chaosHint")}
                        </p>
                        <button
                            type="button"
                            className="bw-chaos__order-cta"
                            onClick={startOrdering}
                        >
                            {t("bigramNarrative.v2.chaosOrder.orderLabel")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── ordering → scanning hand-off: once the FLIP settles, auto-run the scan ── */}
            {phase === "ordering" && (
                <OrderingGate onSettled={startScanning} reduce={!!reduce} />
            )}

            {/* ── done: the sage payoff panel + replay ── */}
            <AnimatePresence>
                {phase === "done" && (
                    <motion.div
                        key="done"
                        className="bw-chaos__payoff"
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: reduce ? 0 : 0.25, ease: STD }}
                    >
                        <p className="bw-chaos__payoff-text">
                            {t("bigramNarrative.v2.chaosOrder.payoff")}
                        </p>
                        {leader && colTotal > 0 && (
                            <p className="bw-chaos__payoff-sub">
                                t&nbsp;→&nbsp;
                                <b>{displayChar(leader.follower)}</b>
                                {" · "}
                                {Math.round((leader.count / TRUE_TOTAL_SUM) * 100)}%
                            </p>
                        )}
                        <button
                            type="button"
                            className="bw-chaos__replay"
                            onClick={replay}
                        >
                            ↻ {t("bigramNarrative.v2.chaosOrder.replay")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default ChaosAndOrder;

/* ════════════════════════════════════════════════════════════════════════
   ReadingStrip — the corpus the cursor sweeps (scan glyph idiom, bible §2)
   Shows a window around the cursor so the strip never overflows horizontally.
   ════════════════════════════════════════════════════════════════════════ */
const WINDOW = 38; // chars shown around the cursor

const ReadingStrip = memo(function ReadingStrip({
    cursor,
    blurred,
}: {
    cursor: number;
    blurred: boolean;
}) {
    const safe = Math.max(0, cursor);
    const start = Math.max(0, safe - Math.floor(WINDOW * 0.55));
    const end = Math.min(SHAKESPEARE_SAMPLE.length, start + WINDOW);
    const slice: { ch: string; i: number }[] = [];
    for (let i = start; i < end; i++) {
        slice.push({ ch: SHAKESPEARE_SAMPLE[i], i });
    }

    return (
        <div
            className="bw-chaos__strip"
            data-blur={blurred ? "1" : "0"}
            aria-hidden
        >
            {slice.map(({ ch, i }) => {
                const isCursor = i === cursor;
                const isFollower = i === cursor + 1;
                const isOrigin = isCursor && ch === ORIGIN;
                let cls = "bw-chaos__ch";
                if (isCursor) cls += isOrigin ? " is-origin" : " is-cursor";
                else if (isFollower && SHAKESPEARE_SAMPLE[cursor] === ORIGIN)
                    cls += " is-follower";
                else if (i < cursor) cls += " is-past";
                else cls += " is-future";
                return (
                    <span key={i} className={cls}>
                        {displayChar(ch)}
                    </span>
                );
            })}
        </div>
    );
});

/* ════════════════════════════════════════════════════════════════════════
   FloatingChip — an ejected t→follower pair, drifting gently in the cloud.
   Carries a stable layoutId (its id) so it FLIPs into the table on ordering.
   ════════════════════════════════════════════════════════════════════════ */
const FloatingChip = memo(function FloatingChip({
    chip,
    reduce,
}: {
    chip: Chip;
    reduce: boolean;
}) {
    return (
        <motion.div
            layoutId={`chip-${chip.id}`}
            className="bw-chaos__chip"
            initial={
                reduce
                    ? false
                    : { scale: 0.5, opacity: 0 }
            }
            animate={
                reduce
                    ? { scale: 1, opacity: 1 }
                    : {
                          scale: 1,
                          opacity: 1,
                          x: [0, chip.driftX, -chip.driftX, 0],
                          y: [0, -chip.driftY, chip.driftY, 0],
                          rotate: [chip.rot, -chip.rot, chip.rot],
                      }
            }
            transition={
                reduce
                    ? { duration: 0 }
                    : {
                          scale: { duration: 0.4, ease: STD },
                          opacity: { duration: 0.4, ease: STD },
                          x: {
                              duration: chip.dur,
                              repeat: Infinity,
                              ease: "easeInOut",
                          },
                          y: {
                              duration: chip.dur * 1.1,
                              repeat: Infinity,
                              ease: "easeInOut",
                          },
                          rotate: {
                              duration: chip.dur * 1.3,
                              repeat: Infinity,
                              ease: "easeInOut",
                          },
                      }
            }
            style={{
                position: "absolute",
                left: `${chip.x}%`,
                top: `${chip.y}%`,
            }}
        >
            <ChipFace follower={chip.follower} />
        </motion.div>
    );
});

/* The visual face of a chip — reused floating and (as the lead chip) inside a column. */
const ChipFace = memo(function ChipFace({ follower }: { follower: string }) {
    const isSpace = follower === " ";
    return (
        <span className="bw-chaos__chip-face">
            <span className="bw-chaos__chip-src">t</span>
            <span className="bw-chaos__chip-arr">→</span>
            <span
                className="bw-chaos__chip-dst"
                data-space={isSpace ? "1" : "0"}
            >
                {displayChar(follower)}
            </span>
        </span>
    );
});

/* ════════════════════════════════════════════════════════════════════════
   OrderedRow — the single 1×N table the chips snap into. The first chip of each
   follower owns the column's layout slot (it FLIPs from the cloud via its
   layoutId). Duplicates merge into the climbing count + a bar. Columns appear
   left→right in first-seen order; the leader brightens.
   ════════════════════════════════════════════════════════════════════════ */
const OrderedRow = memo(function OrderedRow({
    columns,
    chips,
    colMax,
    colTotal,
    leader,
    poppedFollower,
    phase,
    reduce,
    rowLabel,
}: {
    columns: Column[];
    chips: Chip[];
    colMax: number;
    colTotal: number;
    leader: Column | null;
    poppedFollower: string | null;
    phase: Phase;
    reduce: boolean;
    rowLabel: string;
}) {
    const chipById = useMemo(() => {
        const m = new Map<number, Chip>();
        for (const c of chips) m.set(c.id, c);
        return m;
    }, [chips]);

    return (
        <motion.div
            className="bw-chaos__table"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: STD }}
        >
            <div className="bw-chaos__row-label">{rowLabel}</div>

            <div className="bw-chaos__columns">
                {columns.map((col) => {
                    const lead = col.chipIds[0];
                    const leadChip =
                        lead !== undefined ? chipById.get(lead) : undefined;
                    const isLeader =
                        leader?.follower === col.follower && col.count > 0;
                    const popped = poppedFollower === col.follower;
                    const h = `${Math.round((col.count / Math.max(colMax, 1)) * 100)}%`;
                    return (
                        <motion.div
                            key={col.follower}
                            className="bw-chaos__col"
                            data-leader={isLeader ? "1" : "0"}
                            layout
                            initial={
                                reduce ? false : { width: 0, opacity: 0 }
                            }
                            animate={{ width: "auto", opacity: 1 }}
                            transition={reduce ? { duration: 0 } : SPRING_SNAP}
                        >
                            {/* the bar (column height encodes the count, normalized to leader) */}
                            <div className="bw-chaos__col-track">
                                <motion.div
                                    className="bw-chaos__col-fill"
                                    data-leader={isLeader ? "1" : "0"}
                                    animate={{ height: h }}
                                    transition={
                                        reduce
                                            ? { duration: 0 }
                                            : { duration: 0.32, ease: STD }
                                    }
                                />
                            </div>

                            {/* the climbing count (odometer that climbs, with a pop) */}
                            <Odometer
                                value={col.count}
                                pop={!reduce && popped}
                                leader={isLeader}
                            />

                            {/* the lead chip — FLIPs in from the cloud (shared layoutId) */}
                            <div className="bw-chaos__col-chip">
                                {leadChip ? (
                                    <motion.div
                                        layoutId={`chip-${leadChip.id}`}
                                        className="bw-chaos__chip is-seated"
                                        transition={reduce ? { duration: 0 } : SPRING_SNAP}
                                    >
                                        <ChipFace follower={col.follower} />
                                    </motion.div>
                                ) : (
                                    // born mid-scan (no chip): render a static face
                                    <div className="bw-chaos__chip is-seated">
                                        <ChipFace follower={col.follower} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* the total — a quiet rule under the row */}
            <div className="bw-chaos__total">
                <span className="bw-chaos__total-label">{rowLabel}</span>
                <span className="bw-chaos__total-num">
                    {colTotal.toLocaleString()}
                    {phase === "done" && (
                        <span className="bw-chaos__total-of">
                            {" "}
                            / {TRUE_TOTAL_SUM.toLocaleString()}
                        </span>
                    )}
                </span>
            </div>
        </motion.div>
    );
});

/* ════════════════════════════════════════════════════════════════════════
   Odometer — a number that CLIMBS to `value` (rAF easeOutCubic), never jumps.
   Mirrors the ShakespeareRowCounter / HonestBar count-tick pattern.
   ════════════════════════════════════════════════════════════════════════ */
const Odometer = memo(function Odometer({
    value,
    pop,
    leader,
}: {
    value: number;
    pop: boolean;
    leader: boolean;
}) {
    const [shown, setShown] = useState(value);
    /* the value the digits are CURRENTLY displaying — so a new target resumes the climb from
       where it visually is, never snapping back. Critical for the accelerating finale where
       targets arrive faster than a single 280ms climb can finish. */
    const shownRef = useRef(value);

    useEffect(() => {
        const from = shownRef.current;
        const to = value;
        if (from === to) return;
        let raf = 0;
        let t0: number | null = null;
        const DUR = 280;
        const frame = (now: number) => {
            if (t0 === null) t0 = now;
            const k = Math.min(1, (now - t0) / DUR);
            const eased = 1 - Math.pow(1 - k, 3); // easeOutCubic
            const v = Math.round(from + (to - from) * eased);
            shownRef.current = v;
            setShown(v);
            if (k < 1) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [value]);

    return (
        <motion.span
            className="bw-chaos__odo"
            data-leader={leader ? "1" : "0"}
            animate={pop ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={pop ? { duration: 0.42, ease: STD } : { duration: 0 }}
        >
            {shown}
        </motion.span>
    );
});

/* ════════════════════════════════════════════════════════════════════════
   OrderingGate — waits for the FLIP to settle, then triggers the scan.
   A tiny effect-only component so the parent stays declarative.
   ════════════════════════════════════════════════════════════════════════ */
const OrderingGate = memo(function OrderingGate({
    onSettled,
    reduce,
}: {
    onSettled: () => void;
    reduce: boolean;
}) {
    const fired = useRef(false);
    useEffect(() => {
        if (fired.current) return;
        fired.current = true;
        const id = setTimeout(onSettled, reduce ? 0 : 1000); // let the spring land
        return () => clearTimeout(id);
    }, [onSettled, reduce]);
    return null;
});

/* ════════════════════════════════════════════════════════════════════════
   Scoped styles — token-only, .bw-* (works in both themes via [data-bigram-theme]).
   ════════════════════════════════════════════════════════════════════════ */
const BwStyle = memo(function BwStyle() {
    return (
        <style>{`
.bw-chaos {
  max-width: 760px;
  margin: 0 auto;
  color: var(--bigram-ink);
}
.bw-chaos__label {
  font-family: var(--bigram-font-mono);
  font-size: 11px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--bigram-muted);
  text-align: center;
  margin: 0 0 18px;
}

/* ── idle / play ── */
.bw-chaos__idle { text-align: center; padding: 28px 0 12px; }
.bw-chaos__play {
  display: inline-flex; align-items: center; gap: 11px;
  font-family: var(--bigram-font-mono);
  font-size: 14px; font-weight: 600; letter-spacing: .02em;
  padding: 13px 26px; border: 0; cursor: pointer;
  border-radius: var(--bigram-r-md);
  background: var(--bigram-accent); color: var(--bigram-on-accent);
  box-shadow: 0 8px 22px -8px color-mix(in oklab, var(--bigram-accent) 70%, transparent);
  transition: transform .2s ease, box-shadow .2s ease;
}
.bw-chaos__play:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px -8px color-mix(in oklab, var(--bigram-accent) 78%, transparent);
}
.bw-chaos__play-tri { font-size: 10px; transform: translateY(.5px); }

/* ── reading strip ── */
.bw-chaos__strip {
  display: flex; justify-content: center; flex-wrap: nowrap;
  font-family: var(--bigram-font-mono);
  font-size: clamp(15px, 1.9vw, 19px);
  line-height: 1.7;
  letter-spacing: .01em;
  padding: 16px 18px;
  border-radius: var(--bigram-r-lg);
  background: var(--bigram-bg-2);
  box-shadow: inset 0 2px 8px color-mix(in oklab, var(--bigram-ink) 14%, transparent);
  margin: 0 auto 8px;
  overflow: hidden;
  white-space: pre;
  transition: filter .4s ease, opacity .4s ease;
  user-select: none;
}
.bw-chaos__strip[data-blur="1"] { filter: blur(.4px); opacity: .9; }
.bw-chaos__ch {
  padding: 1px 0;
  border-radius: 5px;
  transition: color .2s ease, background .2s ease, box-shadow .2s ease;
  color: var(--bigram-dim);
}
.bw-chaos__ch.is-future { color: var(--bigram-muted); }
.bw-chaos__ch.is-past { color: var(--bigram-dim); opacity: .7; }
.bw-chaos__ch.is-cursor,
.bw-chaos__ch.is-origin {
  color: var(--bigram-on-accent);
  background: var(--bigram-accent);
  font-weight: 700;
  padding: 1px 4px;
  margin: 0 1px;
}
.bw-chaos__ch.is-follower {
  color: var(--bigram-accent-ink);
  background: var(--bigram-accent-soft);
  font-weight: 700;
  padding: 1px 4px;
  margin: 0 1px;
}

/* ── chaos stage / floating chips ── */
.bw-chaos__stage {
  position: relative;
  width: 100%;
  margin: 4px 0;
  overflow: hidden;
  -webkit-mask-image: radial-gradient(120% 100% at 50% 45%, #000 72%, transparent 100%);
  mask-image: radial-gradient(120% 100% at 50% 45%, #000 72%, transparent 100%);
}
.bw-chaos__chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 11px;
  border-radius: var(--bigram-r-pill);
  background: var(--bigram-surface);
  box-shadow:
    0 4px 14px -6px color-mix(in oklab, var(--bigram-ink) 30%, transparent),
    inset 0 0 0 1px var(--bigram-rule);
  will-change: transform;
}
.bw-chaos__chip.is-seated {
  box-shadow:
    0 2px 8px -4px color-mix(in oklab, var(--bigram-ink) 22%, transparent),
    inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 22%, transparent);
  background: var(--bigram-accent-soft);
}
.bw-chaos__chip-face {
  display: inline-flex; align-items: baseline; gap: 2px;
  font-family: var(--bigram-font-mono);
  font-size: 15px;
  white-space: nowrap;
}
.bw-chaos__chip-src { color: var(--bigram-dim); font-weight: 500; }
.bw-chaos__chip-arr { color: var(--bigram-dim); font-size: 11px; margin: 0 2px; }
.bw-chaos__chip-dst { color: var(--bigram-accent-ink); font-weight: 700; }
.bw-chaos__chip-dst[data-space="1"] {
  font-size: 12px; font-weight: 600; letter-spacing: .03em;
  color: var(--bigram-dim);
}

/* ── caption ── */
.bw-chaos__caption-wrap {
  min-height: 26px; text-align: center; margin: 12px 0 0;
}
.bw-chaos__caption {
  font-family: var(--bigram-font-mono);
  font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--bigram-muted); margin: 0;
  font-variant-numeric: tabular-nums;
}
.bw-chaos__caption[data-tone="hot"] { color: var(--bigram-accent-ink); }
.bw-chaos__count { color: var(--bigram-accent); font-weight: 700; }

/* ── pause ── */
.bw-chaos__pause { text-align: center; margin: 18px 0 4px; }
.bw-chaos__pause-line {
  font-family: var(--bigram-font-serif);
  font-size: clamp(19px, 2.4vw, 24px);
  line-height: 1.45;
  color: var(--bigram-ink);
  max-width: 28ch;
  margin: 0 auto 22px;
  text-wrap: balance;
}
.bw-chaos__order-cta {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--bigram-font-mono);
  font-size: 13px; font-weight: 600; letter-spacing: .02em;
  padding: 12px 24px; border: 0; cursor: pointer;
  border-radius: var(--bigram-r-md);
  background: var(--bigram-accent); color: var(--bigram-on-accent);
  box-shadow: 0 6px 18px -7px color-mix(in oklab, var(--bigram-accent) 70%, transparent);
  transition: transform .2s ease;
}
.bw-chaos__order-cta:hover { transform: translateY(-1px); }

/* ── ordered table ── */
.bw-chaos__table { margin: 10px 0 0; }
.bw-chaos__row-label {
  font-family: var(--bigram-font-mono);
  font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--bigram-muted);
  margin: 0 0 14px;
  text-align: center;
}
.bw-chaos__columns {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  min-height: 200px;
  padding: 0 4px;
  overflow: hidden;
}
.bw-chaos__col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}
.bw-chaos__col-track {
  position: relative;
  width: 26px;
  height: 140px;
  border-radius: 7px;
  background: color-mix(in oklab, var(--bigram-ink) 8%, transparent);
  display: flex; align-items: flex-end;
  overflow: hidden;
}
.bw-chaos__col-fill {
  width: 100%;
  border-radius: 7px;
  background: var(--bigram-accent-2);
}
.bw-chaos__col-fill[data-leader="1"] { background: var(--bigram-accent-bright); }
.bw-chaos__odo {
  font-family: var(--bigram-font-mono);
  font-size: 14px; font-weight: 700;
  color: var(--bigram-muted);
  font-variant-numeric: tabular-nums;
  min-width: 1.5em; text-align: center;
}
.bw-chaos__odo[data-leader="1"] { color: var(--bigram-accent); }
.bw-chaos__col-chip { display: flex; }

/* ── total ── */
.bw-chaos__total {
  display: flex; align-items: baseline; justify-content: space-between;
  margin: 16px 0 0; padding-top: 12px;
  border-top: 1px solid var(--bigram-rule);
}
.bw-chaos__total-label {
  font-family: var(--bigram-font-mono);
  font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--bigram-muted);
}
.bw-chaos__total-num {
  font-family: var(--bigram-font-mono);
  font-size: 17px; font-weight: 600; color: var(--bigram-ink);
  font-variant-numeric: tabular-nums;
}
.bw-chaos__total-of { color: var(--bigram-dim); font-weight: 400; font-size: 14px; }

/* ── payoff ── */
.bw-chaos__payoff {
  text-align: center;
  margin: 26px auto 6px;
  max-width: 34ch;
  padding: 20px 22px;
  border-radius: var(--bigram-r-lg);
  background: var(--bigram-sage-soft);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 26%, transparent);
}
.bw-chaos__payoff-text {
  font-family: var(--bigram-font-serif);
  font-size: clamp(17px, 2.2vw, 21px);
  line-height: 1.5;
  color: var(--bigram-ink);
  margin: 0;
  text-wrap: balance;
}
.bw-chaos__payoff-sub {
  font-family: var(--bigram-font-mono);
  font-size: 13px;
  color: var(--bigram-sage);
  margin: 10px 0 0;
  font-variant-numeric: tabular-nums;
}
.bw-chaos__payoff-sub b { color: var(--bigram-accent-ink); }
.bw-chaos__replay {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--bigram-font-mono);
  font-size: 11px; letter-spacing: .06em;
  padding: 8px 16px; margin-top: 18px;
  border: 0; cursor: pointer;
  border-radius: var(--bigram-r-sm);
  background: transparent; color: var(--bigram-muted);
  box-shadow: inset 0 0 0 1px var(--bigram-rule-2);
  transition: color .2s ease, box-shadow .2s ease;
}
.bw-chaos__replay:hover {
  color: var(--bigram-ink);
  box-shadow: inset 0 0 0 1px var(--bigram-accent);
}

@media (max-width: 560px) {
  .bw-chaos__col-track { width: 20px; height: 110px; }
  .bw-chaos__chip-face { font-size: 13px; }
  .bw-chaos__columns { gap: 4px; }
}

@media (prefers-reduced-motion: reduce) {
  .bw-chaos__chip { will-change: auto; }
}
        `}</style>
    );
});
