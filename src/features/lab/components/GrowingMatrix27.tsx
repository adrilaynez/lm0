"use client";

import {
    memo,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
    displayChar,
    heat,
    MONO,
    ParchmentReader,
    SERIF,
    STD,
} from "@/features/lab/components/bigram/kit";
import { ALPHABET_27 } from "@/features/lab/data/bigramCorpus";
import { SHAKESPEARE_TEXT } from "@/features/lab/data/shakespeareText";
import { useI18n } from "@/i18n/context";

/**
 * GrowingMatrix27 — Bigram §4 (VIS 9). Reading a real book, the WHOLE 27×27 table heats up on its own.
 *
 * ONE concept, felt physically: *structure emerges from counting — it isn't imposed.* The §4 anchors
 * proved one row (the «t» row) is a tiny forecast. The reader leaves asking "what about ALL the other
 * letters at once?" This widget answers by streaming the literal book past a cursor: every adjacency
 * feeds a cell, that cell HEATS along the chapter's single accent ramp, and a live tally of every pair
 * counted climbs in the headline. The fixed alphabetical 27×27 board never reflows — the "build" is heat
 * rising in a stable, followable grid. It hands off to VIS10 with the `twist`: the real world isn't only
 * lowercase (capitals, periods, numbers…) → grow to 92×92.
 *
 * STATISTICS, not just color (the raised bar):
 *   • a headline total that CLIMBS as the scan runs — the true running count of pairs fed (raw tabular
 *     integer, never a one-shot count-up);
 *   • a fed-pair readout «row» → «col» · N showing that pair's running count as cells are fed, and the
 *     live cell ringed on the board;
 *   • hover ANY cell → its exact running count via the `cellCount` tooltip ("«x» → «y»: N").
 *
 * Coherence with VIS 4 (RowTally): SAME real book (SHAKESPEARE_TEXT), SAME 27-symbol normalization
 * (letters→lowercase, everything else→space), SAME kit `heat` ramp. VIS 4 built ONE row of this very
 * table; VIS 9 fills the whole square. Every number the reader sees is the TRUE running count — never faked.
 *
 * Assembled from the kit (heat / tokens) + its one unique mechanic (the streaming heat-fill of a fixed
 * alphabetical board). Token-only (--bigram-*), scoped to the page's [data-bigram-theme]; both themes.
 * Reduced-motion safe: settles instantly to the fully-counted heated grid with the final total, no scan,
 * no info lost (no synchronous setState in an effect body). Self-mounting: no required props.
 */

/* ── The real book, read in full, normalized to the 27-symbol counting alphabet exactly like VIS 4. ── */
const TEXT = SHAKESPEARE_TEXT;
const ALPHA = ALPHABET_27; // [' ', a–z] — the FIXED, never-reordering axis
const N27 = ALPHA.length; // 27
const COL_IDX = new Map(ALPHA.map((c, i) => [c, i] as const));

/** Fold any character to the 27-symbol counting alphabet (matches RowTally.norm exactly). */
function norm(c: string): number {
    const o = c.charCodeAt(0);
    if (o >= 97 && o <= 122) return COL_IDX.get(c)!; // a–z
    if (o >= 65 && o <= 90) return o - 65 + 1; // A–Z → its lowercase slot
    return 0; // space / punctuation / newline → space
}

/** The heat floor (kit `heat`'s second arg): a visible minimum for ANY non-zero cell so the dense
    matrix reads as POPULATED in dark instead of vanishing into bg-2. Bible-recommended ≈ 12–16. */
const HEAT_FLOOR = 14;

/* Teaching scan: a handful of pairs read slowly (you can follow each one fed) before the book races. */
const SCAN_HITS = 16;

/* The papiro reading window — the literal book shown streaming past the cursor, exactly like VIS 4. */
const SCAN_WIN = 200;

type Phase = "idle" | "scan" | "filling" | "done";

/* Grid geometry — sized so 27 columns + the row-header gutter sit within ~660px wide AND the whole
   figure + caption fits one 1280×800 laptop viewport below the bench picker. Measured, not eyeballed. */
const CELL = 18;
const GAP = 2;
const GUTTER = 22; // row-header column width
const PAD = 12; // board inner padding

/* ════════════════════════════════════════════════════════════════════════
   Cell — one square of the heatmap. Memoised on its heat + flags so a tick that touches a single row
   only re-styles that row's cells. The background animates via a cheap CSS transition, never JS — that
   is how 729 cells stay at 60fps. Hover reports its (row,col) up so the tooltip can read the live count.
   ════════════════════════════════════════════════════════════════════════ */
const Cell = memo(function Cell({
    p,
    active,
    hovered,
    settled,
    onHover,
}: {
    p: number;
    active: boolean;
    hovered: boolean;
    settled: boolean;
    onHover: (e: React.MouseEvent) => void;
}) {
    return (
        <span
            onMouseEnter={onHover}
            style={{
                width: CELL,
                height: CELL,
                borderRadius: 3,
                background: heat(p, HEAT_FLOOR),
                cursor: "default",
                boxShadow: active
                    ? "0 0 0 2px var(--bigram-accent-bright)"
                    : hovered
                      ? "inset 0 0 0 1.5px var(--bigram-accent-ink)"
                      : "none",
                transition: settled
                    ? "box-shadow .12s ease"
                    : "background .3s ease, box-shadow .15s ease",
            }}
        />
    );
});

export interface GrowingMatrix27Props {
    /** Parity with the chapter's opt-in accent convention. The component is already bigram-scoped. */
    accent?: "bigram";
}

export const GrowingMatrix27 = memo(function GrowingMatrix27(
    { accent = "bigram" }: GrowingMatrix27Props = {},
) {
    void accent;
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [phase, setPhase] = useState<Phase>("idle");

    /* The live 27×27 counts live in refs (mutated in the loops, never read in render). The render reads
       only STATE: a per-row version (React.memo repaints just the fed rows), the running total, the lit
       pair, and the hovered cell. The fixed alphabetical axis means nothing ever reflows. */
    const countsRef = useRef<Int32Array>(new Int32Array(N27 * N27));
    const rowTotRef = useRef<Int32Array>(new Int32Array(N27));
    const posRef = useRef(0); // chars read so far
    const prevRef = useRef(0); // normalized index of the previous char
    const hitsRef = useRef(0); // teaching pairs read so far in the close-up
    const totalRef = useRef(0); // pairs counted so far (the climbing tally)

    const [rowVers, setRowVers] = useState<number[]>(() => new Array(N27).fill(0));
    const [total, setTotal] = useState(0); // the climbing headline integer
    const [lit, setLit] = useState<{ r: number; c: number; n: number } | null>(null);
    const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
    /* Reading cursor into the literal book, for the papiro reader on top. */
    const [pos, setPos] = useState(0); // chars read so far (drives the papiro window)
    const [litPrev, setLitPrev] = useState(-1); // absolute index of the «hot1» letter being read
    const [litNext, setLitNext] = useState(-1); // absolute index of its «hot2» follower

    const toRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);
    const scanStepRef = useRef<() => void>(() => {});
    const fillStepRef = useRef<() => void>(() => {});

    const clearTimers = useCallback(() => {
        if (toRef.current != null) clearTimeout(toRef.current);
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        toRef.current = null;
        rafRef.current = null;
    }, []);

    /* ── CLOSE-UP scan: one char at a time. Each pair feeds the live counts, rings the cell it fed, and
          shows its running count in the readout. Starts visible, accelerates over the first SCAN_HITS. ── */
    const scanStep = useCallback(() => {
        const p = posRef.current;
        if (p >= TEXT.length) {
            setLit(null);
            setLitPrev(-1);
            setLitNext(-1);
            setPhase("done");
            return;
        }
        const cur = norm(TEXT[p]);
        if (p > 0) {
            const prev = prevRef.current;
            const k = prev * N27 + cur;
            countsRef.current[k] += 1;
            rowTotRef.current[prev] += 1;
            totalRef.current += 1;
            setTotal(totalRef.current);
            setLit({ r: prev, c: cur, n: countsRef.current[k] });
            setLitPrev(p - 1);
            setLitNext(p);
            setRowVers((vers) => {
                const nv = vers.slice();
                nv[prev] += 1;
                return nv;
            });
            hitsRef.current += 1;
        }
        prevRef.current = cur;
        posRef.current = p + 1;
        setPos(posRef.current);

        if (hitsRef.current >= SCAN_HITS) {
            // hand off to the wide shot: the rest of the book races by, the table fills out
            setPhase("filling");
            rafRef.current = requestAnimationFrame(() => fillStepRef.current());
            return;
        }
        // savor the first pairs, then accelerate
        const prog = hitsRef.current / SCAN_HITS;
        const delay = 240 - prog * 150;
        toRef.current = setTimeout(() => scanStepRef.current(), delay);
    }, []);

    /* ── WIDE SHOT fill: the rest of the book in accelerating batches, the tally climbing, the touched
          rows heating. Every batch bumps the running total and repaints only the rows it touched. ── */
    const fillStep = useCallback(() => {
        const prog = posRef.current / TEXT.length;
        const batch = Math.min(2600, Math.floor(180 + prog * prog * 3600));
        let p = posRef.current;
        let prev = prevRef.current;
        const end = Math.min(TEXT.length, p + batch);
        const counts = countsRef.current;
        const tot = rowTotRef.current;
        const touched = new Set<number>();
        let added = 0;
        for (; p < end; p += 1) {
            const cur = norm(TEXT[p]);
            if (p > 0) {
                counts[prev * N27 + cur] += 1;
                tot[prev] += 1;
                added += 1;
                touched.add(prev);
            }
            prev = cur;
        }
        posRef.current = p;
        prevRef.current = prev;
        totalRef.current += added;
        setTotal(totalRef.current);
        setPos(p);
        setLit(null);
        setLitPrev(-1);
        setLitNext(-1);
        if (touched.size) {
            setRowVers((vers) => {
                const nv = vers.slice();
                for (const r of touched) nv[r] += 1;
                return nv;
            });
        }
        if (p >= TEXT.length) {
            setPhase("done");
            return;
        }
        rafRef.current = requestAnimationFrame(() => fillStepRef.current());
    }, []);

    useEffect(() => {
        scanStepRef.current = scanStep;
        fillStepRef.current = fillStep;
    }, [scanStep, fillStep]);

    const reset = useCallback(() => {
        clearTimers();
        countsRef.current = new Int32Array(N27 * N27);
        rowTotRef.current = new Int32Array(N27);
        posRef.current = 0;
        prevRef.current = 0;
        hitsRef.current = 0;
        totalRef.current = 0;
        setRowVers(new Array(N27).fill(0));
        setTotal(0);
        setLit(null);
        setHover(null);
        setPos(0);
        setLitPrev(-1);
        setLitNext(-1);
    }, [clearTimers]);

    const play = useCallback(() => {
        reset();
        if (reduce) {
            // Reduced motion: read the whole book at once, settle on the full counted square.
            const counts = countsRef.current;
            const tot = rowTotRef.current;
            let prev = 0;
            let added = 0;
            for (let p = 0; p < TEXT.length; p += 1) {
                const cur = norm(TEXT[p]);
                if (p > 0) {
                    counts[prev * N27 + cur] += 1;
                    tot[prev] += 1;
                    added += 1;
                }
                prev = cur;
            }
            posRef.current = TEXT.length;
            totalRef.current = added;
            setTotal(added);
            setPos(TEXT.length);
            setPhase("done");
            return;
        }
        setPhase("scan");
        // start after a beat so the eye registers the empty board before it fills
        toRef.current = setTimeout(() => scanStepRef.current(), 420);
    }, [reset, reduce]);

    const replay = useCallback(() => {
        reset();
        setPhase("idle");
    }, [reset]);

    useEffect(() => clearTimers, [clearTimers]);

    /* ════════════════════════════════════════════════════════════════════
       Derived view models — the axis is ALWAYS the fixed alphabetical [space, a–z]; nothing reflows.
       ════════════════════════════════════════════════════════════════════ */

    const settled = phase === "done";
    const reading = phase === "scan" || phase === "filling";
    const progress = phase === "idle" ? 0 : settled ? 1 : pos / TEXT.length;

    /* The papiro reading window — a slice of the literal book around the cursor (kit ParchmentReader). */
    const head = pos - 1;
    const winStart = Math.max(0, Math.min(pos - 118, TEXT.length - SCAN_WIN));

    /* Stable heat accessor for one (row, col): live P(next | row) from the count buffer. Constant
       identity (reads live refs) so memoised rows only re-read when their version bumps. */
    const heatAt = useCallback((r: number, c: number): number => {
        const tot = rowTotRef.current[r];
        return tot ? countsRef.current[r * N27 + c] / tot : 0;
    }, []);

    /* The hovered cell's live RAW count (for the tooltip). Read directly off the ref. */
    const hoverCount = hover ? countsRef.current[hover.r * N27 + hover.c] : 0;

    const gridWidth = GUTTER + N27 * CELL + (N27 + 1) * GAP + PAD * 2;

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", fontFamily: SERIF }}>
            {/* No eyebrow: the narrative body frames it (texto = cuerpo). */}

            {/* ── IDLE — the lead + PLAY ── */}
            <AnimatePresence mode="wait">
                {phase === "idle" && (
                    <motion.div
                        key="idle"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease: STD }}
                        style={{ textAlign: "center", padding: "14px 0 10px" }}
                    >
                        <p
                            style={{
                                fontFamily: SERIF,
                                fontSize: "clamp(18px, 2.4vw, 23px)",
                                lineHeight: 1.5,
                                color: "var(--bigram-ink)",
                                margin: "0 auto 26px",
                                maxWidth: "34ch",
                                textWrap: "balance",
                            }}
                        >
                            {t("bigramNarrative.v2.growingMatrix.lead")}
                        </p>
                        <button type="button" onClick={play} style={primaryBtnStyle}>
                            <PlayGlyph />
                            {t("bigramNarrative.v2.growingMatrix.playLabel")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── READING / DONE — the live statistics header, the board, the meaning line ── */}
            {phase !== "idle" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {/* ── The papiro reader on top: the literal book streaming past the cursor, exactly
                          like the §4 counting showpiece. The matrix below is the focal point — if this
                          plus the board run past the fold, that's fine; reading is the story, fitting isn't. ── */}
                    <AnimatePresence>
                        {reading && (
                            <motion.div
                                key="papiro"
                                initial={reduce ? false : { opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.32, ease: STD }}
                                style={{ width: "100%", maxWidth: 560, marginBottom: 22 }}
                            >
                                <ParchmentReader
                                    text={TEXT}
                                    windowStart={winStart}
                                    windowSize={SCAN_WIN}
                                    head={head}
                                    hot1={litPrev}
                                    hot2={litNext}
                                    progress={progress}
                                    reading={reading}
                                    markerLabel={t("bigramNarrative.v2.growingMatrix.label")}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Live statistics bar: the climbing total + the fed-pair readout. ── */}
                    <div style={statBarStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <span style={statLabelStyle}>
                                {t("bigramNarrative.v2.growingMatrix.totalLabel")}
                            </span>
                            <span style={statTotalStyle}>{total.toLocaleString()}</span>
                        </div>

                        {/* the pair currently being fed, with its running count */}
                        <div style={{ minWidth: 132, textAlign: "right" }}>
                            <AnimatePresence mode="wait">
                                {lit ? (
                                    <motion.span
                                        key={`${lit.r}-${lit.c}`}
                                        initial={reduce ? false : { opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        style={fedPairStyle}
                                    >
                                        <span style={fedGlyphStyle}>{displayChar(ALPHA[lit.r])}</span>
                                        <span style={fedArrowStyle}>→</span>
                                        <span style={fedGlyphStyle}>{displayChar(ALPHA[lit.c])}</span>
                                        <span style={fedCountStyle}>{lit.n.toLocaleString()}</span>
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="readhint"
                                        initial={reduce ? false : { opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={readHintStyle}
                                    >
                                        27 × 27
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── THE BOARD — fixed alphabetical 27×27, never reflows; heat rises in place. ── */}
                    <div
                        style={{
                            position: "relative",
                            padding: PAD,
                            borderRadius: "var(--bigram-r-md)",
                            background: "var(--bigram-bg-2)",
                            boxShadow:
                                "inset 0 2px 12px color-mix(in oklab, var(--bigram-ink) 13%, transparent), inset 0 0 0 1px var(--bigram-rule)",
                            width: gridWidth,
                            maxWidth: "100%",
                        }}
                        onMouseLeave={() => setHover(null)}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: `${GUTTER}px repeat(${N27}, ${CELL}px)`,
                                gridAutoRows: `${CELL}px`,
                                columnGap: GAP,
                                rowGap: GAP,
                            }}
                        >
                            {/* top-left corner spacer */}
                            <span style={{ width: GUTTER, height: CELL }} aria-hidden />

                            {/* column headers */}
                            {ALPHA.map((ch, ci) => (
                                <AxisChar
                                    key={`col-${ch}`}
                                    ch={ch}
                                    active={
                                        (lit?.c === ci && reading) ||
                                        hover?.c === ci
                                    }
                                />
                            ))}

                            {/* rows: header glyph + a strip of heat cells. Each row gets only primitives
                                — its data `version`, the lit column if the cursor is on it, the hovered
                                column, and a stable heat accessor — so React.memo repaints just the fed
                                (or hovered) rows on a normal tick. */}
                            {ALPHA.map((rch, r) => (
                                <RowFragment
                                    key={`row-${rch}`}
                                    rch={rch}
                                    r={r}
                                    settled={settled}
                                    rowActive={
                                        (lit?.r === r && reading) || hover?.r === r
                                    }
                                    litCol={lit?.r === r && reading ? lit.c : -1}
                                    hoverCol={hover?.r === r ? hover.c : -1}
                                    version={rowVers[r] ?? 0}
                                    heatAt={heatAt}
                                    onHoverCell={(c) => setHover({ r, c })}
                                />
                            ))}
                        </div>

                        {/* ── HOVER TOOLTIP — the cell's exact running count, shown WHERE you look. ── */}
                        <AnimatePresence>
                            {hover && (
                                <motion.div
                                    key="tip"
                                    initial={reduce ? false : { opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.14 }}
                                    style={tooltipStyle}
                                >
                                    {t("bigramNarrative.v2.growingMatrix.cellCount", {
                                        row: displayChar(ALPHA[hover.r]),
                                        col: displayChar(ALPHA[hover.c]),
                                        n: hoverCount.toLocaleString(),
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Meaning line — the reading hint while scanning, the grid meaning + hover invite on done ── */}
                    <div
                        style={{
                            minHeight: 40,
                            marginTop: 16,
                            maxWidth: "56ch",
                            textAlign: "center",
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {reading ? (
                                <motion.p
                                    key="hint"
                                    initial={reduce ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={captionStyle}
                                >
                                    {t("bigramNarrative.v2.growingMatrix.scanningHint")}
                                </motion.p>
                            ) : (
                                <motion.p
                                    key="caption"
                                    initial={reduce ? false : { opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.45, ease: STD }}
                                    style={captionStyle}
                                >
                                    {t("bigramNarrative.v2.growingMatrix.hoverHint")}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── DONE — the twist (bridge to VIS10) + replay ── */}
                    <AnimatePresence>
                        {settled && (
                            <motion.div
                                key="twist"
                                initial={reduce ? false : { opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: reduce ? 0 : 0.2,
                                    ease: STD,
                                }}
                                style={{ marginTop: 14, width: "100%", maxWidth: 540 }}
                            >
                                <div style={twistPanelStyle}>
                                    <p style={twistTextStyle}>
                                        {t("bigramNarrative.v2.growingMatrix.twist")}
                                    </p>
                                </div>
                                {!reduce && (
                                    <div style={{ textAlign: "center", marginTop: 14 }}>
                                        <button
                                            type="button"
                                            onClick={replay}
                                            style={replayStyle}
                                        >
                                            ↻ {t("bigramNarrative.v2.growingMatrix.playLabel")}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
});

export default GrowingMatrix27;

/* ════════════════════════════════════════════════════════════════════════
   RowFragment — a row's header glyph + its strip of heat cells. Memoised on PRIMITIVES only (its data
   `version`, `litCol`, `hoverCol`, `settled`), so on a normal tick React re-renders ONLY the rows whose
   `version` bumped (or that are hovered). Heat is read through the stable `heatAt` accessor (live refs).
   ════════════════════════════════════════════════════════════════════════ */
const RowFragment = memo(function RowFragment({
    rch,
    r,
    settled,
    rowActive,
    litCol,
    hoverCol,
    onHoverCell,
    heatAt,
}: {
    rch: string;
    r: number;
    settled: boolean;
    rowActive: boolean;
    /** Column the cursor is feeding if it's on this row, else -1 (so the hot cell can ring). */
    litCol: number;
    /** Column hovered if the pointer is on this row, else -1. */
    hoverCol: number;
    onHoverCell: (c: number) => void;
    /** Bumps when this row's counts change → forces this row (only) to re-read its heat. */
    version: number;
    heatAt: (r: number, c: number) => number;
}) {
    return (
        <>
            <AxisChar ch={rch} active={rowActive} rowHead />
            {Array.from({ length: N27 }, (_, c) => (
                <Cell
                    key={c}
                    p={heatAt(r, c)}
                    active={litCol === c}
                    hovered={hoverCol === c}
                    settled={settled}
                    onHover={() => onHoverCell(c)}
                />
            ))}
        </>
    );
});

/* ════════════════════════════════════════════════════════════════════════
   AxisChar — a row/column header glyph. Mono, lights to accent when the cursor/hover is on its row/col.
   `rowHead` right-aligns the row label into its gutter.
   ════════════════════════════════════════════════════════════════════════ */
const AxisChar = memo(function AxisChar({
    ch,
    active,
    rowHead = false,
}: {
    ch: string;
    active: boolean;
    rowHead?: boolean;
}) {
    return (
        <span
            aria-hidden
            style={{
                width: rowHead ? GUTTER : CELL,
                height: CELL,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: rowHead ? "flex-end" : "center",
                paddingRight: rowHead ? 4 : 0,
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                lineHeight: 1,
                color: active ? "var(--bigram-accent-ink)" : "var(--bigram-ink-2)",
                transition: "color .2s ease, font-weight .2s ease",
            }}
        >
            {displayChar(ch)}
        </span>
    );
});

/* ─── Small glyphs ─── */
function PlayGlyph() {
    return (
        <span
            aria-hidden
            style={{
                display: "inline-block",
                width: 0,
                height: 0,
                marginRight: 9,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft: "8px solid var(--bigram-on-accent)",
            }}
        />
    );
}

/* ════════════════════════════════════════════════════════════════════════
   Inline styles
   ════════════════════════════════════════════════════════════════════════ */

const statBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 560,
    marginBottom: 10,
    gap: 16,
};

const statLabelStyle: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    color: "var(--bigram-muted)",
};

const statTotalStyle: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: "clamp(26px, 3.6vw, 34px)",
    fontWeight: 700,
    lineHeight: 1,
    color: "var(--bigram-accent-ink)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-.01em",
};

const fedPairStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: MONO,
    fontVariantNumeric: "tabular-nums",
};

const fedGlyphStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: "var(--bigram-ink)",
    minWidth: 12,
    textAlign: "center",
};

const fedArrowStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--bigram-muted)",
};

const fedCountStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--bigram-accent-ink)",
    marginLeft: 4,
    minWidth: 40,
    textAlign: "right",
};

const readHintStyle: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: ".16em",
    color: "var(--bigram-dim)",
    fontVariantNumeric: "tabular-nums",
};

const captionStyle: React.CSSProperties = {
    fontFamily: SERIF,
    fontSize: "clamp(14px, 1.6vw, 17px)",
    lineHeight: 1.5,
    color: "var(--bigram-ink-2)",
    margin: 0,
    textWrap: "pretty",
};

const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    top: -14,
    left: "50%",
    transform: "translate(-50%, -100%)",
    padding: "6px 12px",
    borderRadius: "var(--bigram-r-sm)",
    background: "var(--bigram-surface)",
    boxShadow:
        "0 8px 22px -10px color-mix(in oklab, var(--bigram-ink) 60%, transparent), inset 0 0 0 1px var(--bigram-rule)",
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--bigram-ink)",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
    pointerEvents: "none",
    zIndex: 4,
};

const twistPanelStyle: React.CSSProperties = {
    padding: "16px 22px",
    borderRadius: "var(--bigram-r-lg)",
    background: "linear-gradient(135deg, var(--bigram-sage-soft), transparent 84%)",
    boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 30%, transparent)",
    textAlign: "center",
};

const twistTextStyle: React.CSSProperties = {
    fontFamily: SERIF,
    fontSize: 16,
    lineHeight: 1.5,
    color: "var(--bigram-ink)",
    maxWidth: "46ch",
    margin: "0 auto",
    textWrap: "pretty",
};

const primaryBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: ".02em",
    padding: "11px 24px",
    border: 0,
    borderRadius: "var(--bigram-r-md)",
    cursor: "pointer",
    background: "var(--bigram-accent)",
    color: "var(--bigram-on-accent)",
    boxShadow:
        "0 6px 18px -7px color-mix(in oklab, var(--bigram-accent) 70%, transparent)",
};

const replayStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: ".06em",
    padding: "7px 14px",
    border: 0,
    borderRadius: "var(--bigram-r-sm)",
    cursor: "pointer",
    background: "transparent",
    color: "var(--bigram-muted)",
    boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
};
