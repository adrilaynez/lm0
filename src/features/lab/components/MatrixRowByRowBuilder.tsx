"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Verdict } from "@/features/lab/components/bigram/Verdict";
import { displayChar,SUBMATRIX_6 } from "@/features/lab/data/bigramCorpora";
import { useI18n } from "@/i18n/context";

/**
 * MatrixRowByRowBuilder — Bigram §3 ("Nace la matriz"), the row-by-row construction of the
 * transition table (editorial-green). Replaces BigramMatrixBuilder.
 *
 * ONE concept: a transition table is nothing more than ONE ROW PER LETTER, stacked. The structure
 * is *invented* by the learner stacking rows — never imposed as a finished grid. We open with the
 * single «t» row already known from §2 ("we have a row for t… what about a? what about h?"), then add
 * one starting-letter row at a time until the 7×7 grid forms. Only then do the axis headers ignite and
 * the cells fill — in an accelerating Shakespeare cascade — with real sub-sampled counts. The coda
 * finally names what was built: a transition table.
 *
 * Built from FILL + typography, not borders or chart chrome. A cell's surface slides along a single
 * accent ramp keyed to its share of the matrix max (honest heat — a rare pair stays dim, never
 * normalised up). Row/column headers light only once the grid is whole, so the axes read as a
 * consequence of the build, not a given. The conclusion is the sage Verdict voice (insight), distinct
 * from the emerald accent of the interactive surface.
 *
 * Self-mounting: no required props. Reads its data from SUBMATRIX_6 and its copy from useI18n under
 * `bigramNarrative.v2.rowByRow.*`. Token-only (--bigram-*), scoped to the page's [data-bigram-theme];
 * reduced-motion safe (cascade collapses to an instant fill, slide-ins become fades).
 */

const MONO = "var(--font-jetbrains-mono)";
const SERIF = "var(--font-source-serif)";

/* The submatrix axis: 7 frequent letters + space (rows and columns share this order). */
const CHARS = SUBMATRIX_6.chars;
const COUNTS = SUBMATRIX_6.counts;
const N = CHARS.length;

/* The matrix-wide maximum count — the honest denominator for the heat ramp. */
const MAX_COUNT = Math.max(...COUNTS.flat());

/* Pacing — the cascade accelerates row by row so the fill feels alive, not metronomic. */
const STACK_STEP_MS = 360; // delay between auto-added rows ("add them all")
const FILL_BASE_MS = 320; // first filled row settles slowly (didactic)
const FILL_ACCEL = 0.78; // each subsequent row lands faster (geometric ease-in)
const FILL_FLOOR_MS = 90; // never quicker than this

/** How long the fill cascade lingers on row `r` before lighting the next one. */
function fillDelayForRow(r: number): number {
    return Math.max(FILL_FLOOR_MS, FILL_BASE_MS * Math.pow(FILL_ACCEL, r));
}

type Phase = "stacking" | "grid" | "filling" | "full";

/* Honest heat: a cell's tint scales with its share of the matrix max, capped so the busiest pair
   glows (~38% accent) without ever screaming. Empty / not-yet-filled cells stay a quiet sunk well. */
function cellFill(value: number, filled: boolean): { background: string; color: string } {
    if (!filled || value <= 0) {
        return {
            background: "color-mix(in oklab, var(--bigram-ink) 5%, transparent)",
            color: "var(--bigram-dim)",
        };
    }
    const t = value / MAX_COUNT; // 0..1 share of the loudest pair
    const mix = Math.max(9, Math.round(t * 38)); // 9%..38% accent over the surface — honest, never neon
    return {
        background: `color-mix(in oklab, var(--bigram-accent) ${mix}%, var(--bigram-surface))`,
        color: t > 0.55 ? "var(--bigram-ink)" : "var(--bigram-ink-2)",
    };
}

export const MatrixRowByRowBuilder = memo(function MatrixRowByRowBuilder({
    accent = "bigram",
}: {
    /** Opt-in accent scope. Only "bigram" is supported; present so the widget reads as themable. */
    accent?: "bigram";
}) {
    void accent; // single-accent widget; the prop documents the chapter scope (see CLAUDE.md)
    const { t } = useI18n();
    const reduce = useReducedMotion();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // How many starting-letter rows are present (always ≥1 — the «t» row from §2 is the seed).
    const [rowsShown, setRowsShown] = useState(1);
    // Up to which row the Shakespeare fill has reached (-1 = nothing filled yet).
    const [filledThrough, setFilledThrough] = useState(-1);
    const [phase, setPhase] = useState<Phase>("stacking");
    // Which row slid in most recently — its header letter gets a brief emphasis.
    const [justAdded, setJustAdded] = useState<number | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Refs let the recursive auto-stack / fill loops read the latest value without re-creating
    // callbacks each render, and keep every setState inside a timeout callback (never in render).
    const rowsRef = useRef(1);
    const stackLoopRef = useRef<() => void>(() => {});
    const fillLoopRef = useRef<(r: number) => void>(() => {});

    useEffect(() => {
        rowsRef.current = rowsShown;
    }, [rowsShown]);

    /* ── Add the next starting-letter row (manual, one at a time) ── */
    const addRow = useCallback(() => {
        clearTimer();
        setRowsShown((prev) => {
            if (prev >= N) return prev;
            const next = prev + 1;
            setJustAdded(prev); // 0-based index of the row that just appeared
            if (next >= N) setPhase("grid"); // grid complete → headers may ignite
            return next;
        });
    }, [clearTimer]);

    /* ── Auto-stack every remaining row in an accelerating cascade ── */
    const stackLoop = useCallback(() => {
        const current = rowsRef.current;
        if (current >= N) {
            setPhase("grid");
            return;
        }
        const next = current + 1;
        rowsRef.current = next;
        setRowsShown(next);
        setJustAdded(current);
        if (next >= N) {
            setPhase("grid");
            return;
        }
        timerRef.current = setTimeout(() => stackLoopRef.current(), STACK_STEP_MS);
    }, []);

    useEffect(() => {
        stackLoopRef.current = stackLoop;
    }, [stackLoop]);

    const addAll = useCallback(() => {
        clearTimer();
        if (reduce) {
            // No motion budget: snap straight to the whole grid.
            rowsRef.current = N;
            setRowsShown(N);
            setJustAdded(null);
            setPhase("grid");
            return;
        }
        timerRef.current = setTimeout(() => stackLoopRef.current(), STACK_STEP_MS);
    }, [clearTimer, reduce]);

    /* ── Fill the whole grid with Shakespeare counts, row by row, accelerating ── */
    const fillLoop = useCallback((r: number) => {
        if (r >= N) {
            setPhase("full");
            return;
        }
        setFilledThrough(r);
        timerRef.current = setTimeout(() => fillLoopRef.current(r + 1), fillDelayForRow(r));
    }, []);

    useEffect(() => {
        fillLoopRef.current = fillLoop;
    }, [fillLoop]);

    const fill = useCallback(() => {
        clearTimer();
        if (reduce) {
            setFilledThrough(N - 1);
            setPhase("full");
            return;
        }
        setPhase("filling");
        timerRef.current = setTimeout(() => fillLoopRef.current(0), FILL_BASE_MS);
    }, [clearTimer, reduce]);

    /* ── Reset to the seed «t» row ── */
    const reset = useCallback(() => {
        clearTimer();
        rowsRef.current = 1;
        setRowsShown(1);
        setFilledThrough(-1);
        setJustAdded(null);
        setPhase("stacking");
    }, [clearTimer]);

    /* ── Cleanup on unmount ── */
    useEffect(() => clearTimer, [clearTimer]);

    const gridComplete = rowsShown >= N;
    const headersLit = gridComplete; // axes light only once the grid is whole
    const filled = phase === "filling" || phase === "full";

    // The «t» row's winning column (h) — used to anchor the final verdict in a concrete pair.
    const verdictPair = useMemo(() => {
        const tRow = COUNTS[0];
        let best = 0;
        for (let j = 1; j < tRow.length; j++) if (tRow[j] > tRow[best]) best = j;
        return { from: CHARS[0], to: CHARS[best] };
    }, []);

    return (
        <div style={{ maxWidth: 660, margin: "0 auto", fontFamily: SERIF }}>
            {/* ── Opening beat — the §2 → §3 question that motivates stacking rows ── */}
            <AnimatePresence initial={false}>
                {!gridComplete && (
                    <motion.p
                        key="seed-prompt"
                        initial={reduce ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{
                            fontFamily: SERIF,
                            fontStyle: "italic",
                            fontSize: 16,
                            lineHeight: 1.5,
                            color: "var(--bigram-muted)",
                            textAlign: "center",
                            margin: "0 0 18px",
                        }}
                    >
                        {t("bigramNarrative.v2.rowByRow.startRow")}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* ── The matrix — column axis label, headers, and the stacked rows ── */}
            <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `auto repeat(${N}, max-content)`,
                        gap: 5,
                        alignItems: "center",
                    }}
                >
                    {/* Column axis caption (next letter →) */}
                    <AxisLabel className="" style={{ gridColumn: `2 / span ${N}`, textAlign: "center", marginBottom: 2 }}>
                        {t("bigramNarrative.v2.rowByRow.colAxisLabel")}
                    </AxisLabel>

                    {/* Column headers — lit only when the grid is whole */}
                    <div aria-hidden />
                    {CHARS.map((col, ci) => (
                        <HeaderCell key={`col-${ci}`} lit={headersLit}>
                            {displayChar(col)}
                        </HeaderCell>
                    ))}

                    {/* Rows — one starting letter each; new rows slide in from below */}
                    <AnimatePresence initial={false}>
                        {CHARS.slice(0, rowsShown).map((rowChar, ri) => (
                            <MatrixRow
                                key={`row-${ri}`}
                                rowChar={rowChar}
                                ri={ri}
                                counts={COUNTS[ri]}
                                rowFilled={filled && filledThrough >= ri}
                                justAdded={justAdded === ri}
                                headersLit={headersLit}
                                reduce={!!reduce}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Row axis caption (starting letter ↓) — only meaningful once >1 row */}
                    <AxisLabel
                        className=""
                        style={{
                            gridColumn: `2 / span ${N}`,
                            textAlign: "center",
                            marginTop: 4,
                            opacity: rowsShown > 1 ? 1 : 0,
                            transition: "opacity .3s ease",
                        }}
                    >
                        {t("bigramNarrative.v2.rowByRow.rowAxisLabel")}
                    </AxisLabel>
                </div>
            </div>

            {/* ── Controls — stack rows, then fill ── */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                    minHeight: 44,
                    marginTop: 22,
                }}
            >
                {!gridComplete && (
                    <>
                        <PrimaryButton onClick={addRow}>
                            {t("bigramNarrative.v2.rowByRow.addRowCta")}
                        </PrimaryButton>
                        <GhostButton onClick={addAll}>
                            {t("bigramNarrative.v2.rowByRow.addAllCta")}
                        </GhostButton>
                    </>
                )}

                {gridComplete && phase === "grid" && (
                    <PrimaryButton onClick={fill}>
                        {t("bigramNarrative.v2.rowByRow.fillCta")}
                    </PrimaryButton>
                )}

                {phase === "filling" && (
                    <span
                        style={{
                            fontFamily: MONO,
                            fontSize: 11,
                            letterSpacing: ".14em",
                            textTransform: "uppercase",
                            color: "var(--bigram-accent-ink)",
                        }}
                    >
                        {t("bigramNarrative.v2.rowByRow.filling")}
                    </span>
                )}

                {phase === "full" && (
                    <GhostButton onClick={reset}>
                        ↻ {t("bigramNarrative.v2.rowByRow.startRow")}
                    </GhostButton>
                )}
            </div>

            {/* ── Verdict + coda — names what was built: a transition table ── */}
            <AnimatePresence>
                {phase === "full" && (
                    <motion.div
                        key="coda"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.45,
                            delay: reduce ? 0 : 0.2,
                            ease: [0.2, 0.8, 0.2, 1],
                        }}
                        style={{ marginTop: 24, textAlign: "center" }}
                    >
                        <Verdict
                            label={t("bigramNarrative.v2.rowByRow.label")}
                            main={t("bigramNarrative.v2.rowByRow.verdict")}
                            sub={`${displayChar(verdictPair.from)} → ${displayChar(verdictPair.to)}  ·  ${N} × ${N}`}
                        />
                        <p
                            style={{
                                fontFamily: SERIF,
                                fontStyle: "italic",
                                fontSize: 17,
                                lineHeight: 1.5,
                                color: "var(--bigram-muted)",
                                maxWidth: "42ch",
                                margin: "16px auto 0",
                                textWrap: "pretty",
                            }}
                        >
                            {t("bigramNarrative.v2.rowByRow.coda")}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/* ─────────────────────────────────────────────
   MatrixRow — a starting-letter header + its strip of 7 cells.
   New rows slide in from below; cells heat in the fill cascade.
   ───────────────────────────────────────────── */

const MatrixRow = memo(function MatrixRow({
    rowChar,
    ri,
    counts,
    rowFilled,
    justAdded,
    headersLit,
    reduce,
}: {
    rowChar: string;
    ri: number;
    counts: number[];
    rowFilled: boolean;
    justAdded: boolean;
    headersLit: boolean;
    reduce: boolean;
}) {
    return (
        <>
            {/* Row header — the "starting letter" anchor; lights with the completed axis */}
            <motion.div
                initial={reduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 12,
                    fontFamily: MONO,
                    fontSize: "clamp(16px, 4.5vw, 20px)",
                    fontWeight: justAdded ? 700 : 600,
                    lineHeight: 1,
                    color:
                        justAdded || headersLit
                            ? "var(--bigram-accent-ink)"
                            : "var(--bigram-ink-2)",
                    transition: "color .3s ease, font-weight .3s ease",
                }}
            >
                {displayChar(rowChar)}
            </motion.div>

            {/* Cells — slide in with the row, then heat by honest fill on the cascade */}
            {counts.map((value, ci) => {
                const skin = cellFill(value, rowFilled);
                return (
                    <motion.div
                        key={`${ri}-${ci}`}
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.2, 0.8, 0.2, 1],
                            delay: reduce ? 0 : ci * 0.018, // cells settle left→right as the row enters
                        }}
                        style={{ position: "relative" }}
                    >
                        <motion.div
                            // pop once when this row's cells receive their Shakespeare count
                            animate={
                                reduce || !rowFilled
                                    ? { scale: 1 }
                                    : { scale: [1, 1.12, 1] }
                            }
                            transition={{ duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
                            style={{
                                width: "clamp(40px, 10.5vw, 50px)",
                                height: "clamp(36px, 9vw, 44px)",
                                display: "grid",
                                placeItems: "center",
                                borderRadius: "var(--bigram-r-sm)",
                                background: skin.background,
                                color: skin.color,
                                fontFamily: MONO,
                                fontSize: "clamp(11px, 2.6vw, 13px)",
                                fontWeight: rowFilled && value / MAX_COUNT > 0.55 ? 700 : 500,
                                fontVariantNumeric: "tabular-nums",
                                transition: reduce
                                    ? "none"
                                    : "background .34s ease, color .34s ease",
                            }}
                        >
                            {rowFilled ? (
                                <CellValue value={value} pop={!reduce} />
                            ) : (
                                <span style={{ opacity: 0.5 }}>·</span>
                            )}
                        </motion.div>
                    </motion.div>
                );
            })}
        </>
    );
});

/* ─── Cell count that pops up into place when its row fills ─── */
const CellValue = memo(function CellValue({ value, pop }: { value: number; pop: boolean }) {
    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
                key={value}
                initial={pop ? { y: 7, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ display: "inline-block" }}
            >
                {value.toLocaleString()}
            </motion.span>
        </AnimatePresence>
    );
});

/* ─────────────────────────────────────────────
   Header cell — mono axis glyph; ignites when the grid is whole
   ───────────────────────────────────────────── */

function HeaderCell({ children, lit }: { children: React.ReactNode; lit: boolean }) {
    return (
        <div
            style={{
                width: "clamp(40px, 10.5vw, 50px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 4,
                fontFamily: MONO,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: lit ? "var(--bigram-accent-ink)" : "var(--bigram-muted)",
                transition: "color .35s ease",
            }}
        >
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Axis label — mono uppercase hairline caption
   ───────────────────────────────────────────── */

function AxisLabel({
    children,
    className,
    style,
}: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={className}
            style={{
                fontFamily: MONO,
                fontSize: 9.5,
                letterSpacing: ".22em",
                textTransform: "uppercase",
                color: "var(--bigram-dim)",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Buttons — primary accent + quiet ghost (token-only, no piled borders)
   ───────────────────────────────────────────── */

function PrimaryButton({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                fontWeight: 600,
                padding: "11px 20px",
                border: 0,
                borderRadius: "var(--bigram-r-sm)",
                cursor: "pointer",
                background: "var(--bigram-accent)",
                color: "var(--bigram-on-accent)",
                boxShadow:
                    "0 6px 16px -8px color-mix(in oklab, var(--bigram-accent) 60%, transparent)",
                transition: "background .2s ease, box-shadow .2s ease",
            }}
        >
            {children}
        </button>
    );
}

function GhostButton({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                padding: "10px 16px",
                border: 0,
                borderRadius: "var(--bigram-r-sm)",
                cursor: "pointer",
                background: "transparent",
                color: "var(--bigram-muted)",
                boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
                transition: "color .2s ease, box-shadow .2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--bigram-ink)";
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--bigram-accent-2)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--bigram-muted)";
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--bigram-rule-2)";
            }}
        >
            {children}
        </button>
    );
}
