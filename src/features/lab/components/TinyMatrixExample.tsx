"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
    CaptionLine,
    displayChar,
    GhostButton,
    heat,
    MarkedText,
    type MarkState,
    MONO,
    PlayButton,
    SERIF,
    STD,
} from "@/features/lab/components/bigram/kit";
import { ALPHABET_27 } from "@/features/lab/data/bigramCorpus";
import { useI18n } from "@/i18n/context";

/**
 * TinyMatrixExample — Bigram §3 (mechanics), the beat that turns "one row" into "the matrix".
 *
 * ONE new idea: a NEW origin letter creates a NEW row of 27 columns — and stacking those rows IS the
 * bigram table. The reader already knows the trick for ONE letter (count followers → %, choose with a
 * loaded die) and has seen the fixed row of 27 slots. This widget answers their open question — "how do
 * we do this for ALL letters, not just t?" — by reading a short phrase letter by letter: each time the
 * cursor lands on an origin letter it has never started from before, a brand-new row slides in (the
 * spring the whole chapter uses for a column/row being born); every pair heats its [origin][follower]
 * cell on the SAME heat ramp as RowTally and the real 27×27. The end state is a small stack of heated
 * rows that visibly equals "the matrix, made of the rows you already understand", then the hundir-la-
 * flota caption (left = letter you start from, top = letter you go to, the crossing cell = how often).
 *
 * The phrase ("the cat ate the hat") is counted LIVE — the cells and the row order are derived from the
 * real scan, never faked. `showCounts` (the only consumer passes it) shows the raw occurrence count in
 * each lit cell instead of leaving the heat to speak alone; both read off the same honest counts.
 *
 * Token-only (--bigram-*), scoped to the page's [data-bigram-theme]; reduced-motion settles straight to
 * the finished grid. Self-mounting (no required props), memoized, "use client".
 */

const COLS = ALPHABET_27; // [' ', a..z] — the 27 fixed columns, never reordered
const N = COLS.length; // 27
const COL_IDX = new Map(COLS.map((c, i) => [c, i] as const));

/* The short phrase. Chosen for good repeats and a small, legible set of distinct origin letters
   (t, h, e, ␣, c, a → 6 rows). The scan counts it honestly; nothing here is hand-authored. */
const PHRASE = "the cat ate the hat";

/** Fold to the 27-symbol counting alphabet: letters → lowercase, everything else → space. */
function norm(c: string): string {
    const o = c.charCodeAt(0);
    if (o >= 97 && o <= 122) return c; // a-z
    if (o >= 65 && o <= 90) return String.fromCharCode(o + 32); // A-Z → a-z
    return " ";
}

/* A row of the matrix being built: its origin letter + the 27 follower counts. */
interface BuiltRow {
    origin: string; // the letter you start from (left column)
    counts: number[]; // length N, one slot per follower (fixed order)
}

interface Settled {
    rows: BuiltRow[]; // rows in first-seen order
    order: string[]; // origin letters in first-seen order
}

/** Count the whole phrase at once — seeds reduced-motion + the replay's "final state" target. */
function settle(phrase: string): Settled {
    const byOrigin = new Map<string, number[]>();
    const order: string[] = [];
    for (let i = 0; i < phrase.length - 1; i++) {
        const o = norm(phrase[i]);
        const f = norm(phrase[i + 1]);
        if (!byOrigin.has(o)) {
            byOrigin.set(o, Array(N).fill(0));
            order.push(o);
        }
        byOrigin.get(o)![COL_IDX.get(f)!] += 1;
    }
    return {
        rows: order.map((origin) => ({ origin, counts: byOrigin.get(origin)! })),
        order,
    };
}

const SETTLED = settle(PHRASE);
const ROW_MAX = Math.max(
    1,
    ...SETTLED.rows.flatMap((r) => r.counts),
); // honest max across the whole table → one shared heat scale

type Phase = "idle" | "scanning" | "done";

export const TinyMatrixExample = memo(function TinyMatrixExample({
    showCounts = false,
}: {
    showCounts?: boolean;
}) {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [phase, setPhase] = useState<Phase>(reduce ? "done" : "idle");
    // Scan cursor: index of the ORIGIN letter currently in focus (its follower is i+1).
    const [scanI, setScanI] = useState(reduce ? PHRASE.length : -1);
    // Rows built so far, in first-seen order. Reduced-motion seeds the finished table.
    const [rows, setRows] = useState<BuiltRow[]>(reduce ? SETTLED.rows : []);

    // Latest-closure refs so the loop never re-binds mid-flight (kit contract: no setState in effect body).
    const posRef = useRef(0);
    const rowsRef = useRef<BuiltRow[]>([]);
    const orderRef = useRef<Map<string, number>>(new Map()); // origin → row index
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stepRef = useRef<() => void>(() => {});

    const step = useCallback(() => {
        const i = posRef.current;
        if (i >= PHRASE.length - 1) {
            setScanI(PHRASE.length);
            setPhase("done");
            return;
        }
        const o = norm(PHRASE[i]);
        const f = norm(PHRASE[i + 1]);

        // A NEW origin letter is born as a brand-new row of 27 slots; a known one heats one more cell.
        const next = rowsRef.current.map((r) => ({ origin: r.origin, counts: r.counts.slice() }));
        let ri = orderRef.current.get(o);
        let isNewRow = false;
        if (ri == null) {
            ri = next.length;
            orderRef.current.set(o, ri);
            next.push({ origin: o, counts: Array(N).fill(0) });
            isNewRow = true;
        }
        next[ri].counts[COL_IDX.get(f)!] += 1;
        rowsRef.current = next;
        setRows(next);

        posRef.current = i + 1;
        setScanI(i);

        // Temperature: a calm teaching scan (~visible, not sleepy). A new row earns a longer beat so the
        // eye sees it slide in; a known letter ticks faster.
        timerRef.current = setTimeout(() => stepRef.current(), isNewRow ? 620 : 360);
    }, []);

    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const play = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        posRef.current = 0;
        rowsRef.current = [];
        orderRef.current = new Map();
        if (reduce) {
            setRows(SETTLED.rows);
            setScanI(PHRASE.length);
            setPhase("done");
            return;
        }
        setRows([]);
        setScanI(-1);
        setPhase("scanning");
        timerRef.current = setTimeout(() => stepRef.current(), 380);
    }, [reduce]);

    /* ── Marking: origin letter = hot1, its follower = hot2; read letters dim, unread fade. ── */
    const scanning = phase === "scanning";
    const stateOf = useCallback(
        (i: number): MarkState => {
            if (!scanning && phase !== "done") return "idle";
            if (phase === "done") return i < PHRASE.length ? "past" : "idle";
            if (i === scanI) return "hot1";
            if (i === scanI + 1) return "hot2";
            if (i < scanI) return "past";
            return "future";
        },
        [scanning, phase, scanI],
    );

    // The origin letter currently being read — its row lifts as the single focal point.
    const activeOrigin = scanning && scanI >= 0 ? norm(PHRASE[scanI]) : null;

    return (
        <div
            className="bw-tm"
            style={{ fontFamily: SERIF }}
        >
            <CaptionLine>{t("bigramNarrative.mechanics.tinyMatrixColLabel")}</CaptionLine>

            {/* ── The phrase, read letter by letter (origin = hot1, follower = hot2) ── */}
            <div className="bw-tm__phrase">
                <MarkedText text={PHRASE} stateOf={stateOf} size="clamp(20px, 3vw, 27px)" maxWidth={460} />
            </div>

            {/* ── The grid, built one row at a time ── */}
            <AnimatePresence>
                {phase !== "idle" && (
                    <motion.div
                        key="grid"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, ease: STD }}
                        className="bw-tm__gridwrap"
                    >
                        {/* Column header — the 27 destinations (top axis: letter you go TO) */}
                        <div className="bw-tm__header">
                            <span className="bw-tm__corner" aria-hidden />
                            <div className="bw-tm__cols">
                                {COLS.map((c) => (
                                    <span key={c} className="bw-tm__collbl">
                                        {displayChar(c)}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Rows — each new origin letter slides in its own row of 27 slots. The slide-in
                            is a CSS keyframe (not a Framer rAF tween): the new-row birth is the chapter's
                            SPRING_SNAP feel, but driven by CSS so it never freezes mid-reveal. */}
                        <div className="bw-tm__rows">
                            {rows.map((row) => {
                                const isActive = row.origin === activeOrigin;
                                return (
                                    <div
                                        key={row.origin}
                                        className="bw-tm__row"
                                        data-active={isActive ? "1" : "0"}
                                        data-reduce={reduce ? "1" : "0"}
                                    >
                                        {/* left label — the letter you start FROM */}
                                        <span className="bw-tm__rowlbl" data-active={isActive ? "1" : "0"}>
                                            {displayChar(row.origin)}
                                        </span>
                                        {/* the 27 fixed slots — each pair heats its cell */}
                                        <div className="bw-tm__cells">
                                            {row.counts.map((n, ci) => {
                                                const lit = n > 0;
                                                return (
                                                    <span
                                                        key={ci}
                                                        className="bw-tm__cell"
                                                        data-lit={lit ? "1" : "0"}
                                                        style={{ background: heat(n / ROW_MAX, 14) }}
                                                        title={`${displayChar(row.origin)} → ${displayChar(COLS[ci])}: ${n}`}
                                                    >
                                                        {showCounts && lit ? n : ""}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Caption + controls ── */}
            <div className="bw-tm__below">
                {phase === "idle" && (
                    <PlayButton onClick={play}>{t("bigramNarrative.mechanics.tinyMatrixPlay")}</PlayButton>
                )}
                {scanning && (
                    <p className="bw-tm__building">{t("bigramNarrative.mechanics.tinyMatrixBuilding")}</p>
                )}
                {phase === "done" && (
                    /* CSS-driven reveal (not a from-0 Framer tween): the gentle fade comes from the
                       `bw-tm__done` transition keyed off the mount, so final visibility never depends on
                       a rAF tick that may not fire after the scan's last setTimeout. */
                    <div className="bw-tm__done">
                        <p className="bw-tm__grid">{t("bigramNarrative.mechanics.tinyMatrixGrid")}</p>
                        {!reduce && (
                            <GhostButton onClick={play}>
                                ↻ {t("bigramNarrative.mechanics.tinyMatrixReplay")}
                            </GhostButton>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .bw-tm { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 640px; margin: 0 auto; width: 100%; }
                .bw-tm__phrase { margin: 0 0 30px; }

                .bw-tm__gridwrap { display: flex; flex-direction: column; align-items: center; width: 100%; }

                /* Header row: a left gutter (matching the row labels) + 27 destination labels */
                .bw-tm__header { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 6px; }
                .bw-tm__corner { width: 18px; flex: none; }
                .bw-tm__cols { display: grid; grid-template-columns: repeat(${N}, 1fr); gap: 3px; width: min(440px, 72vw); }
                .bw-tm__collbl { font-family: ${MONO}; font-size: 9px; line-height: 1; color: var(--bigram-dim); text-align: center; }

                .bw-tm__rows { display: flex; flex-direction: column; gap: 4px; width: 100%; align-items: center; overflow: hidden; }
                /* a row is BORN: slide in from the left with the chapter's snap (cubic mirrors SPRING_SNAP). */
                .bw-tm__row { display: flex; align-items: center; gap: 8px; animation: bwTmRowIn .42s cubic-bezier(.34,1.3,.5,1) both; }
                .bw-tm__row[data-reduce="1"] { animation: none; }
                @keyframes bwTmRowIn { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
                .bw-tm__rowlbl {
                    width: 18px; flex: none; text-align: right; font-family: ${MONO};
                    font-size: clamp(15px, 2.4vw, 18px); font-weight: 600; line-height: 1;
                    color: var(--bigram-ink-2); transition: color .25s ease, font-weight .25s ease;
                }
                .bw-tm__rowlbl[data-active="1"] { color: var(--bigram-accent-ink); font-weight: 700; }
                .bw-tm__cells { display: grid; grid-template-columns: repeat(${N}, 1fr); gap: 3px; width: min(440px, 72vw); }
                .bw-tm__cell {
                    aspect-ratio: 1; border-radius: 3px; min-width: 0;
                    display: flex; align-items: center; justify-content: center;
                    font-family: ${MONO}; font-size: 8.5px; font-weight: 600; font-variant-numeric: tabular-nums;
                    color: var(--bigram-on-accent);
                    transition: background .3s ease;
                }
                /* the active row floats just slightly above the stack — one focal point */
                .bw-tm__row[data-active="1"] .bw-tm__cell[data-lit="1"] {
                    box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--bigram-accent-bright) 60%, transparent);
                }

                .bw-tm__below { min-height: 78px; margin-top: 26px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 14px; }
                .bw-tm__building { font-family: ${SERIF}; font-size: clamp(15px, 1.9vw, 17px); color: var(--bigram-muted); margin: 0; max-width: 40ch; }
                .bw-tm__done { display: flex; flex-direction: column; align-items: center; gap: 16px; animation: bwTmReveal .5s cubic-bezier(.2,.8,.2,1) both; }
                @keyframes bwTmReveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
                @media (prefers-reduced-motion: reduce) { .bw-tm__done { animation: none; } }
                .bw-tm__grid { font-family: ${SERIF}; font-size: clamp(16px, 2vw, 19px); color: var(--bigram-ink-2); margin: 0; max-width: 46ch; line-height: 1.5; }

                @media (max-width: 520px) {
                    .bw-tm__collbl { font-size: 7px; }
                    .bw-tm__cell { font-size: 6.5px; }
                }
            `}</style>
        </div>
    );
});

export default TinyMatrixExample;
