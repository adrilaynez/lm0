"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { ALPHABET_27, displayChar } from "@/features/lab/data/bigramCorpus";
import { SHAKESPEARE_TEXT } from "@/features/lab/data/shakespeareText";
import { useI18n } from "@/i18n/context";

/**
 * RowTally (VIS 4) — counting what follows «t» across a WHOLE book, gathered into one tidy row.
 *
 * ONE idea: a single row — a slot for every letter that could come next — fills with real counts as the
 * machine reads a real book; the tallest bar (h) is what usually follows a «t», and that row is one row
 * of the table we're about to build.
 *
 * Two reading registers, one gesture:
 *   1. CLOSE-UP (scan) — a window of the literal book in big letters, read letter by letter with the
 *      SAME marking as PairHighlighter: the «t» gets a filled accent chip, the next letter a soft tint.
 *      Each «t» nudges its bar up by one, with a beat, so the mechanism is unmistakable. It starts
 *      visible and speeds up over the first ~30 hits.
 *   2. WIDE SHOT (filling) — the rest of the book races by as a paragraph, a reading cursor sweeping,
 *      the bars climbing into the thousands. A hairline marks how far we've read.
 *
 * Result: vertical bars (sorted, the readable ranking) + a horizontal heat row (one full row of the
 * matrix coming next, fixed columns, deserts and all). Real data, honest counts.
 */

const MONO = "var(--bigram-font-mono)";
const SERIF = "var(--bigram-font-serif)";
const STD: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

const TEXT = SHAKESPEARE_TEXT;
const COLS = ALPHABET_27; // [' ', a..z] — fixed columns of the row
const N = COLS.length; // 27
const COL_IDX = new Map(COLS.map((c, i) => [c, i] as const));
const T_IDX = COL_IDX.get("t")!;

const SCAN_HITS = 12; // how many «t»-hits the close read teaches before we let it race
const WIN = 200; // reader window, in characters

/** Fold any character to the 27-symbol counting alphabet: letters → lowercase, everything else → space. */
function norm(c: string): number {
    const o = c.charCodeAt(0);
    if (o >= 97 && o <= 122) return COL_IDX.get(c)!; // a-z
    if (o >= 65 && o <= 90) return o - 65 + 1; // A-Z → a-z index (1..26)
    return 0; // space
}

/** Heat ramp — identical to the matrix (bib §4): empty → bg-2, hot → accent-bright, sqrt-lifted. */
function heat(p: number): string {
    if (p <= 0) return "var(--bigram-bg-2)";
    const pct = (Math.pow(p, 0.6) * 100).toFixed(1);
    return `color-mix(in oklab, var(--bigram-accent-bright) ${pct}%, var(--bigram-bg-2))`;
}

/** Compact number for the bar caps so it climbs in place without overflowing a 21px column. */
function abbr(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

type Phase = "idle" | "scan" | "prompt" | "filling" | "done";

export interface RowTallyProps {
    accent?: "bigram";
}

export const RowTally = memo(function RowTally({ accent = "bigram" }: RowTallyProps) {
    void accent;
    const { t } = useI18n();
    const reduce = useReducedMotion();

    // Full 27×27 counts live in a ref (mutated during the scan, never read in render). The render reads
    // only state: the displayed row, the scan position, and the highlighted chars.
    const countsRef = useRef<Int32Array>(new Int32Array(N * N));
    const posRef = useRef(0);
    const prevRef = useRef(0); // normalized index of the previous char
    const hitsRef = useRef(0); // «t»-hits seen so far in the close-up
    const rafRef = useRef<number | null>(null);
    const toRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [phase, setPhase] = useState<Phase>("idle");
    const [origin] = useState("t");
    const [rowCounts, setRowCounts] = useState<number[]>(() => Array(N).fill(0));
    const [pos, setPos] = useState(0);
    const [litT, setLitT] = useState(-1); // absolute index of the «t» lit in the close-up
    const [litF, setLitF] = useState(-1); // absolute index of its follower
    const [hoverIdx, setHoverIdx] = useState(-1); // column the reader is inspecting

    const rowFrom = useCallback((oi: number) => {
        const r = new Array(N);
        for (let c = 0; c < N; c++) r[c] = countsRef.current[oi * N + c];
        return r;
    }, []);

    /** Feed `count` characters into the full matrix (fast path, no per-char display). */
    const advance = useCallback((count: number) => {
        let p = posRef.current;
        let prev = prevRef.current;
        const end = Math.min(TEXT.length, p + count);
        const counts = countsRef.current;
        for (; p < end; p++) {
            const cur = norm(TEXT[p]);
            if (p > 0) counts[prev * N + cur] += 1;
            prev = cur;
        }
        posRef.current = p;
        prevRef.current = prev;
    }, []);

    const clearTimers = useCallback(() => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        if (toRef.current != null) clearTimeout(toRef.current);
        rafRef.current = null;
        toRef.current = null;
    }, []);

    // Latest-closure refs so the loops never re-bind mid-flight.
    const scanStepRef = useRef<() => void>(() => {});
    const fillStepRef = useRef<() => void>(() => {});

    /* CLOSE-UP — one char at a time, lighting each «t» + its follower, bars climbing one by one. */
    const scanStep = useCallback(() => {
        const p = posRef.current;
        if (p >= TEXT.length) {
            setPhase("done");
            return;
        }
        const cur = norm(TEXT[p]);
        let hit = false;
        if (p > 0) {
            const prev = prevRef.current;
            countsRef.current[prev * N + cur] += 1;
            if (prev === T_IDX) hit = true;
        }
        prevRef.current = cur;
        posRef.current = p + 1;

        if (hit) {
            hitsRef.current += 1;
            setLitT(p - 1);
            setLitF(p);
        } else {
            setLitT(-1);
            setLitF(-1);
        }
        setPos(posRef.current);
        setRowCounts(rowFrom(T_IDX));

        if (hitsRef.current >= SCAN_HITS) {
            setPhase("prompt");
            return;
        }
        // start visible, then accelerate over the first SCAN_HITS hits
        const prog = hitsRef.current / SCAN_HITS;
        const delay = hit ? 200 - prog * 110 : 40 - prog * 22;
        toRef.current = setTimeout(() => scanStepRef.current(), delay);
    }, [rowFrom]);

    /* WIDE SHOT — the rest of the book, accelerating but a touch calmer than before, with a cursor. */
    const fillStep = useCallback(() => {
        const prog = posRef.current / TEXT.length;
        const batch = Math.min(1500, Math.floor(140 + prog * prog * 2400));
        advance(batch);
        setRowCounts(rowFrom(T_IDX));
        setPos(posRef.current);
        if (posRef.current >= TEXT.length) {
            setPhase("done");
            return;
        }
        rafRef.current = requestAnimationFrame(() => fillStepRef.current());
    }, [advance, rowFrom]);

    useEffect(() => {
        scanStepRef.current = scanStep;
        fillStepRef.current = fillStep;
    }, [scanStep, fillStep]);

    const reset = useCallback(() => {
        clearTimers();
        countsRef.current = new Int32Array(N * N);
        posRef.current = 0;
        prevRef.current = 0;
        hitsRef.current = 0;
        setRowCounts(Array(N).fill(0));
        setPos(0);
        setLitT(-1);
        setLitF(-1);
    }, [clearTimers]);

    const play = useCallback(() => {
        reset();
        if (reduce) {
            advance(TEXT.length);
            setRowCounts(rowFrom(T_IDX));
            setPos(TEXT.length);
            setPhase("done");
            return;
        }
        setPhase("scan");
        toRef.current = setTimeout(() => scanStepRef.current(), 360);
    }, [reset, reduce, advance, rowFrom]);

    const readRest = useCallback(() => {
        setLitT(-1);
        setLitF(-1);
        setPhase("filling");
        rafRef.current = requestAnimationFrame(() => fillStepRef.current());
    }, []);

    useEffect(() => clearTimers, [clearTimers]);

    /* ── Derived (from state only) ── */
    const max = Math.max(1, ...rowCounts);
    let winner = -1;
    for (let c = 0; c < N; c++) if (rowCounts[c] > (winner < 0 ? 0 : rowCounts[winner])) winner = c;

    // The row is stored in FIXED order — every follower always lives in the same slot (space, a–z).
    // That fixed layout is the whole point: it's how you store "what follows t" as one row of numbers,
    // and how rows stack into the matrix later. Bars never reorder; empty slots stay visibly empty.
    const fixedRow = COLS.map((c, ci) => ({ c, ci, n: rowCounts[ci] }));
    const shown = hoverIdx >= 0 ? hoverIdx : winner;
    const shownCount = shown >= 0 ? rowCounts[shown] : 0;

    const showStage = phase === "scan" || phase === "prompt" || phase === "filling" || phase === "done";
    const progress = pos / TEXT.length;
    const reading = phase === "scan" || phase === "filling";

    /* ── One reader window for the whole read; scrolls to keep the read head in view ── */
    const head = pos - 1; // last character read
    const winStart = Math.max(0, Math.min(pos - 118, TEXT.length - WIN));
    const windowText = TEXT.slice(winStart, winStart + WIN);

    return (
        <div className="bw-rt" style={{ fontFamily: SERIF }}>
            <p className="bw-rt__eyebrow">{t("bigramNarrative.v2.chaosOrder.label")}</p>

            {/* ── IDLE ── */}
            <AnimatePresence mode="wait">
                {phase === "idle" && (
                    <motion.div
                        key="idle"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: STD }}
                        className="bw-rt__idle"
                    >
                        <button type="button" className="bw-rt__play" onClick={play}>
                            <span className="bw-rt__playdot" aria-hidden />
                            {t("bigramNarrative.v2.chaosOrder.playLabel")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── PAPYRUS READER: the literal book, read in place. Slow at first (each «t» and its
                follower lit, exactly like the pair-hunter), then racing. One parchment for the whole
                read, so it reads like the page the machine is actually scanning. ── */}
            {showStage && (
                <div className="bw-rt__wide">
                    <div className="bw-rt__readmark" data-on={reading ? "1" : "0"}>
                        <span className="bw-rt__readdot" aria-hidden />
                        {t("bigramNarrative.v2.chaosOrder.readingNow")}
                    </div>
                    <div className="bw-rt__reader" aria-hidden>
                        {windowText.split("").map((ch, i) => {
                            const abs = winStart + i;
                            const state =
                                abs === litT
                                    ? "t"
                                    : abs === litF
                                      ? "follower"
                                      : abs === head && litT < 0
                                        ? "cur"
                                        : abs < pos
                                          ? "past"
                                          : "future";
                            return (
                                <span key={i} className="bw-rt__rchar" data-state={state}>
                                    {ch === "\n" ? " " : ch}
                                </span>
                            );
                        })}
                    </div>
                    <div className="bw-rt__progress" aria-hidden>
                        <span className="bw-rt__progressfill" style={{ width: `${progress * 100}%` }} />
                    </div>
                </div>
            )}

            {/* ── THE ROW: bars (ranking) + heat row (matrix foreshadow) ── */}
            {showStage && (
                <motion.div
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: STD }}
                    className="bw-rt__rowwrap"
                >
                    <div className="bw-rt__readout">
                        <span className="bw-rt__roLabel">
                            {t("bigramNarrative.v2.chaosOrder.rowLabel", { char: displayChar(origin) })}
                        </span>
                        <span className="bw-rt__roPair">
                            <b className="bw-rt__roWin">{shown >= 0 ? displayChar(COLS[shown]) : "·"}</b>
                        </span>
                        <span className="bw-rt__roNum">{shownCount.toLocaleString()}</span>
                    </div>

                    {/* THE ROW — 27 fixed slots (space, a–z). Bars never reorder: each follower keeps
                        its place, so the eye learns the layout is stable. Bar height = how often; the
                        heat cell below is the same slot, stored. */}
                    <div className="bw-rt__bars">
                        {fixedRow.map(({ c, ci, n }) => {
                            const h = (n / max) * 92; // leave headroom up top for the climbing count
                            return (
                                <div
                                    key={c}
                                    className="bw-rt__bar"
                                    data-win={ci === winner && n > 0 ? "1" : "0"}
                                    data-hover={ci === hoverIdx ? "1" : "0"}
                                    onMouseEnter={() => setHoverIdx(ci)}
                                    onMouseLeave={() => setHoverIdx(-1)}
                                >
                                    {/* the count climbs in place, riding just above the bar's top */}
                                    {h >= 5 && (
                                        <span className="bw-rt__barnum" style={{ bottom: `${h}%` }}>
                                            {abbr(n)}
                                        </span>
                                    )}
                                    <motion.span
                                        className="bw-rt__barfill"
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 0.25, ease: STD }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* the same row, stored: one cell per slot — literally one row of the matrix */}
                    <div className="bw-rt__heatrow">
                        {fixedRow.map(({ c, ci, n }) => (
                            <span
                                key={c}
                                className="bw-rt__heatcell"
                                data-win={ci === winner && n > 0 ? "1" : "0"}
                                data-hover={ci === hoverIdx ? "1" : "0"}
                                style={{ background: heat(n / max) }}
                                onMouseEnter={() => setHoverIdx(ci)}
                                onMouseLeave={() => setHoverIdx(-1)}
                                title={`${displayChar(origin)} → ${displayChar(c)}: ${n}`}
                            />
                        ))}
                    </div>
                    <div className="bw-rt__heataxis" aria-hidden>
                        {COLS.map((c, ci) => (
                            <span key={c} className="bw-rt__heatlbl" data-hi={ci === shown ? "1" : "0"}>
                                {displayChar(c)}
                            </span>
                        ))}
                    </div>

                    {/* caption per phase */}
                    <div className="bw-rt__below">
                        {phase === "scan" && (
                            <p className="bw-rt__hint">{t("bigramNarrative.v2.chaosOrder.readingHint")}</p>
                        )}
                        {phase === "prompt" && (
                            <motion.div
                                initial={reduce ? false : { opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: STD }}
                                className="bw-rt__prompt"
                            >
                                <p className="bw-rt__q">{t("bigramNarrative.v2.chaosOrder.chaosHint")}</p>
                                <button type="button" className="bw-rt__cta" onClick={readRest}>
                                    {t("bigramNarrative.v2.chaosOrder.orderLabel")}
                                    <span aria-hidden className="bw-rt__glyph">
                                        →
                                    </span>
                                </button>
                            </motion.div>
                        )}
                        {phase === "filling" && (
                            <p className="bw-rt__hint">{t("bigramNarrative.v2.chaosOrder.scanningHint")}</p>
                        )}
                        {phase === "done" && (
                            <motion.div
                                initial={reduce ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="bw-rt__done"
                            >
                                <p className="bw-rt__rowis">{t("bigramNarrative.v2.chaosOrder.rowIsTable")}</p>
                                <p className="bw-rt__inspect">{t("bigramNarrative.v2.chaosOrder.inspectHint")}</p>
                                <button type="button" className="bw-rt__replay" onClick={play}>
                                    ↻ {t("bigramNarrative.v2.chaosOrder.replay")}
                                </button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}

            <style>{`
                .bw-rt { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 760px; margin: 0 auto; width: 100%; }
                .bw-rt__eyebrow { font-family: ${MONO}; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--bigram-dim); margin: 0 0 22px; }
                .bw-rt__idle { padding: 18px 0 8px; }
                .bw-rt__play, .bw-rt__cta {
                    font-family: ${MONO}; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; font-weight: 600;
                    display: inline-flex; align-items: center; gap: 11px; cursor: pointer;
                    padding: 13px 26px; border-radius: var(--bigram-r-pill); color: var(--bigram-on-accent);
                    background: var(--bigram-accent); border: 0; transition: transform .15s ease, background .2s ease;
                }
                .bw-rt__play:hover, .bw-rt__cta:hover { background: var(--bigram-accent-bright); transform: translateY(-1px); }
                .bw-rt__playdot { width: 8px; height: 8px; border-radius: 999px; background: var(--bigram-on-accent); }
                .bw-rt__glyph { transition: transform .2s ease; }
                .bw-rt__cta:hover .bw-rt__glyph { transform: translateX(3px); }

                /* the papyrus reader — one parchment for the whole read */
                .bw-rt__wide { width: 100%; max-width: 560px; margin: 0 auto 28px; }
                .bw-rt__readmark { display: inline-flex; align-items: center; gap: 8px; font-family: ${MONO}; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--bigram-accent); margin: 0 0 11px; opacity: 0; transition: opacity .3s ease; }
                .bw-rt__readmark[data-on="1"] { opacity: 1; }
                .bw-rt__readdot { width: 7px; height: 7px; border-radius: 999px; background: var(--bigram-accent-bright); animation: bwReadPulse 1s ease-in-out infinite; }
                @keyframes bwReadPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
                .bw-rt__reader {
                    font-family: ${MONO}; font-size: clamp(13px, 1.55vw, 16px); line-height: 1.85;
                    text-align: left; white-space: pre-wrap; word-break: break-word;
                    max-height: 10.5em; overflow: hidden; margin: 0 auto;
                    padding: 20px 24px; border-radius: var(--bigram-r-md); color: var(--bigram-muted);
                    background: var(--bigram-bg-2); border: 1px solid var(--bigram-rule);
                    box-shadow: inset 0 2px 12px color-mix(in oklab, var(--bigram-ink) 12%, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent);
                    mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent);
                }
                .bw-rt__rchar { color: var(--bigram-muted); transition: background .12s ease, color .12s ease; }
                .bw-rt__rchar[data-state="past"] { color: var(--bigram-dim); }
                .bw-rt__rchar[data-state="future"] { color: color-mix(in oklab, var(--bigram-muted) 55%, transparent); }
                .bw-rt__rchar[data-state="cur"] { color: var(--bigram-on-accent); background: var(--bigram-accent); border-radius: 3px; padding: 1px 2px; margin: 0 -1px; }
                .bw-rt__rchar[data-state="t"] { color: var(--bigram-on-accent); background: var(--bigram-accent); border-radius: 3px; padding: 1px 2px; margin: 0 -1px; font-weight: 700; }
                .bw-rt__rchar[data-state="follower"] { color: var(--bigram-accent-ink); background: var(--bigram-accent-soft); border-radius: 3px; padding: 1px 2px; margin: 0 -1px; font-weight: 700; box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--bigram-accent) 36%, transparent); }
                .bw-rt__progress { height: 3px; border-radius: 999px; background: var(--bigram-bg-2); margin: 14px auto 0; overflow: hidden; }
                .bw-rt__progressfill { display: block; height: 100%; background: var(--bigram-accent); border-radius: 999px; transition: width .1s linear; }

                .bw-rt__rowwrap { width: 100%; display: flex; flex-direction: column; align-items: center; }
                .bw-rt__readout { display: flex; align-items: baseline; gap: 14px; margin-bottom: 16px; font-family: ${MONO}; }
                .bw-rt__roLabel { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--bigram-dim); }
                .bw-rt__roPair { font-size: 18px; color: var(--bigram-ink-2); }
                .bw-rt__roPair b { color: var(--bigram-accent-bright); }
                .bw-rt__roNum { font-size: clamp(22px, 3vw, 30px); font-weight: 600; color: var(--bigram-accent-bright); font-variant-numeric: tabular-nums; }

                /* THE ROW — 27 fixed columns; bars, heat cells and labels share the grid so they
                   align slot-for-slot. Bars never reorder: that fixed layout IS the lesson. */
                .bw-rt__bars { display: grid; grid-template-columns: repeat(${N}, 1fr); gap: 3px; align-items: end; height: 156px; width: 100%; max-width: 660px; margin: 0 auto 5px; }
                .bw-rt__bar { position: relative; height: 100%; display: flex; align-items: flex-end; min-width: 0; cursor: default; }
                .bw-rt__barfill { width: 100%; border-radius: 3px 3px 0 0; min-height: 2px; background: color-mix(in oklab, var(--bigram-accent) 46%, transparent); transition: background .2s ease; }
                .bw-rt__bar[data-win="1"] .bw-rt__barfill { background: var(--bigram-accent-bright); }
                .bw-rt__bar[data-hover="1"] .bw-rt__barfill { background: var(--bigram-accent); }
                .bw-rt__barnum { position: absolute; left: -5px; right: -5px; text-align: center; font-family: ${MONO}; font-size: 8.5px; line-height: 1; color: var(--bigram-muted); font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; transform: translateY(-3px); transition: color .2s ease; }
                .bw-rt__bar[data-win="1"] .bw-rt__barnum { color: var(--bigram-accent-ink); font-weight: 700; }
                .bw-rt__bar[data-hover="1"] .bw-rt__barnum { color: var(--bigram-accent-ink); }

                .bw-rt__heatrow { display: grid; grid-template-columns: repeat(${N}, 1fr); gap: 3px; width: 100%; max-width: 660px; margin: 0 auto; }
                .bw-rt__heatcell { aspect-ratio: 1; border-radius: 3px; transition: background .25s ease, box-shadow .15s ease; cursor: default; }
                .bw-rt__heatcell[data-win="1"] { box-shadow: inset 0 0 0 1.5px var(--bigram-accent-bright); }
                .bw-rt__heatcell[data-hover="1"] { box-shadow: inset 0 0 0 1.5px var(--bigram-accent-ink); }
                .bw-rt__heataxis { display: grid; grid-template-columns: repeat(${N}, 1fr); gap: 3px; width: 100%; max-width: 660px; margin: 6px auto 0; }
                .bw-rt__heatlbl { font-family: ${MONO}; font-size: 9px; line-height: 1; color: var(--bigram-dim); text-align: center; transition: color .15s ease; }
                .bw-rt__heatlbl[data-hi="1"] { color: var(--bigram-accent-ink); font-weight: 700; }

                .bw-rt__below { min-height: 64px; margin-top: 20px; display: flex; align-items: flex-start; justify-content: center; }
                .bw-rt__hint, .bw-rt__rowis { font-family: ${SERIF}; font-size: clamp(16px, 1.9vw, 19px); color: var(--bigram-ink-2); margin: 0; max-width: 42ch; }
                .bw-rt__prompt { display: flex; flex-direction: column; align-items: center; gap: 16px; }
                .bw-rt__q { font-family: ${SERIF}; font-size: clamp(18px, 2.2vw, 22px); color: var(--bigram-ink); margin: 0; max-width: 28ch; }
                .bw-rt__done { display: flex; flex-direction: column; align-items: center; gap: 10px; }
                .bw-rt__inspect { font-family: ${MONO}; font-size: 11px; letter-spacing: .06em; color: var(--bigram-dim); margin: 0; }
                .bw-rt__replay { font-family: ${MONO}; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--bigram-accent); background: transparent; border: 0; cursor: pointer; padding: 6px; margin-top: 4px; }

                @media (max-width: 560px) {
                    .bw-rt__heatlbl { font-size: 7px; }
                }
            `}</style>
        </div>
    );
});

export default RowTally;
