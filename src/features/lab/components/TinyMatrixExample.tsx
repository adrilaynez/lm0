"use client";

import { memo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

/**
 * TinyMatrixExample — Bigram §3 (mechanics), the small worked grid that introduces
 * the matrix idea (v8, editorial-green).
 *
 * ONE concept: the whole model is a grid of "what follows what" — read a row, and the
 * brightness of each cell tells you how likely that next character is. The heatmap is
 * built from FILL, not borders or default-chart chrome: a cell's tint slides along a
 * single accent ramp keyed to its probability, so a common pair literally glows and a
 * rare one fades — the intensity IS the lesson.
 *
 * One focal point at a time: hovering a cell scales it up, lights the full row+column
 * cross, recedes the rest of the grid, and resolves a calm editorial caption ("After
 * 'h', 'e' appears 49% of the time"). At rest, each row's favourite carries a faint
 * emphasis so the eye finds the pattern instantly.
 *
 * `showCounts` (the only consumer passes it) swaps the cell readout + caption to raw
 * occurrence counts — same grid, the "counting" framing of the section. Token-only
 * (--bigram-*), gated by the page's [data-bigram-theme] scope; no neon, no raw hex, no
 * traffic-light dots, no legend swatches. Reduced-motion safe.
 */

const VOCAB = ["t", "h", "e", "a", " "] as const;
const DISPLAY: Record<string, string> = { " ": "␣" };

// Hardcoded 5×5 transition probabilities [row=current][col=next], rows ~sum to 1.
// Based on real English character statistics.
const MATRIX: number[][] = [
    // t     h     e     a    " "
    [0.02, 0.52, 0.19, 0.05, 0.06], // after t
    [0.03, 0.01, 0.49, 0.14, 0.04], // after h
    [0.06, 0.02, 0.03, 0.10, 0.37], // after e
    [0.15, 0.02, 0.04, 0.02, 0.22], // after a
    [0.18, 0.05, 0.09, 0.14, 0.03], // after " "
];

// Simulated raw counts (probabilities × a plausible row total).
const ROW_TOTALS = [4200, 3800, 5100, 2900, 6200];
const RAW_COUNTS: number[][] = MATRIX.map((row, ri) =>
    row.map((prob) => Math.round(prob * ROW_TOTALS[ri])),
);

// The brightest next-char in each row (its favourite) — used for the at-rest emphasis.
const ROW_BEST: number[] = MATRIX.map((row) =>
    row.reduce((best, p, i, arr) => (p > arr[best] ? i : best), 0),
);

/**
 * Heatmap by FILL: a cell's surface slides along a single accent ramp keyed to prob.
 * Fixed axis (0.55) so the colour reads honestly — a weak pair stays dim, never
 * normalised up to look strong. Returns a layered background + the ink colour.
 */
function cellFill(prob: number): { background: string; color: string } {
    // 0 → transparent tint on the sunken plane; 1 → solid accent.
    const t = Math.min(1, prob / 0.55);
    if (prob < 0.04) {
        return {
            background: "color-mix(in oklab, var(--bigram-ink) 4%, transparent)",
            color: "var(--bigram-dim)",
        };
    }
    // mix(accent-soft → accent) by intensity; text flips to on-accent when fill is strong.
    const mix = Math.round(18 + t * 82); // 18%..100% of accent over the soft tint
    return {
        background: `color-mix(in oklab, var(--bigram-accent) ${mix}%, var(--bigram-accent-soft))`,
        color: t > 0.62 ? "var(--bigram-on-accent)" : "var(--bigram-ink)",
    };
}

export const TinyMatrixExample = memo(function TinyMatrixExample({
    showCounts = false,
}: {
    showCounts?: boolean;
}) {
    const { t } = useI18n();
    const reduce = useReducedMotion();
    const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);

    return (
        <div
            className="flex flex-col items-center"
            style={{ fontFamily: "var(--font-source-serif)" }}
        >
            {/* ── Editorial caption · resolves with hover, one calm line ────────── */}
            <div className="flex min-h-[2.25rem] items-center justify-center px-2 text-center">
                <Caption
                    hovered={hovered}
                    showCounts={showCounts}
                    fallback={t("bigramNarrative.mechanics.tinyMatrixHover")}
                    countTemplate={t("bigramNarrative.mechanics.tinyMatrixCountTooltip")}
                    probTemplate={t("bigramNarrative.mechanics.tinyMatrixTooltip")}
                    reduce={!!reduce}
                />
            </div>

            {/* ── The matrix · headers + grid, scrolls only if truly narrow ────── */}
            <div className="flex w-full justify-center overflow-x-auto">
                <div
                    className="mt-5 grid gap-x-1.5 gap-y-1.5"
                    style={{ gridTemplateColumns: "auto repeat(5, max-content)" }}
                >
                    {/* Column axis label (next character →) */}
                    <AxisLabel className="col-start-2 col-span-5 mb-0.5 text-center">
                        {t("bigramNarrative.mechanics.tinyMatrixColLabel")}
                    </AxisLabel>

                    {/* Column headers */}
                    <div className="col-start-1" aria-hidden />
                    {VOCAB.map((col, ci) => {
                        const lit = hovered?.col === ci;
                        return (
                            <HeaderCell key={`col-${col}`} lit={lit}>
                                {DISPLAY[col] ?? col}
                            </HeaderCell>
                        );
                    })}

                    {/* Rows */}
                    {VOCAB.map((row, ri) => {
                        const rowTotal = ROW_TOTALS[ri];
                        return (
                            <Row
                                key={`row-${row}`}
                                row={row}
                                ri={ri}
                                hovered={hovered}
                                showCounts={showCounts}
                                rowTotal={rowTotal}
                                reduce={!!reduce}
                                setHovered={setHovered}
                                t={t}
                            />
                        );
                    })}

                    {/* Row axis label (current character →) */}
                    <AxisLabel className="col-start-2 col-span-5 mt-1.5 text-center">
                        {t("bigramNarrative.mechanics.tinyMatrixRowLabel")}
                    </AxisLabel>
                </div>
            </div>

            {/* ── Intensity ramp · the single legend, by fill not swatches ─────── */}
            <div className="mt-6 flex items-center gap-3">
                <span
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: "10px",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--bigram-dim)",
                    }}
                >
                    {t("bigramNarrative.mechanics.tinyMatrixRare")}
                </span>
                <span
                    aria-hidden
                    style={{
                        width: "clamp(96px, 30vw, 160px)",
                        height: "8px",
                        borderRadius: "var(--bigram-r-pill)",
                        background:
                            "linear-gradient(90deg, color-mix(in oklab, var(--bigram-ink) 6%, transparent), var(--bigram-accent-soft) 28%, var(--bigram-accent-2) 72%, var(--bigram-accent-bright))",
                    }}
                />
                <span
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: "10px",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--bigram-muted)",
                    }}
                >
                    {t("bigramNarrative.mechanics.tinyMatrixHigh")}
                </span>
            </div>
        </div>
    );
});

/* ─────────────────────────────────────────────
   Row — focal letter header + the cell strip
   ───────────────────────────────────────────── */

function Row({
    row,
    ri,
    hovered,
    showCounts,
    rowTotal,
    reduce,
    setHovered,
    t,
}: {
    row: string;
    ri: number;
    hovered: { row: number; col: number } | null;
    showCounts: boolean;
    rowTotal: number;
    reduce: boolean;
    setHovered: (h: { row: number; col: number } | null) => void;
    t: (key: string) => string;
}) {
    const rowLit = hovered?.row === ri;
    const anyHover = hovered !== null;

    return (
        <>
            {/* Row focal letter — the "current character" anchor */}
            <div
                className="flex items-center justify-end pr-3"
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "clamp(18px, 5vw, 22px)",
                    fontWeight: 600,
                    lineHeight: 1,
                    color: rowLit ? "var(--bigram-accent-ink)" : "var(--bigram-ink-2)",
                    opacity: anyHover && !rowLit ? 0.4 : 1,
                    transition: "color .25s ease, opacity .25s ease",
                }}
            >
                {DISPLAY[row] ?? row}
            </div>

            {/* Cells */}
            {VOCAB.map((col, ci) => {
                const prob = MATRIX[ri][ci];
                const count = RAW_COUNTS[ri][ci];
                const isActive = hovered?.row === ri && hovered?.col === ci;
                const inCross = hovered?.row === ri || hovered?.col === ci;
                const isBest = ROW_BEST[ri] === ci;
                const fill = cellFill(prob);

                // Focal logic: when something is hovered, only the cross stays full;
                // everything else recedes. The active cell scales up.
                const dim = anyHover && !inCross;
                const readout = showCounts ? count.toLocaleString() : `${Math.round(prob * 100)}%`;

                return (
                    <motion.button
                        key={`${row}-${col}`}
                        type="button"
                        onMouseEnter={() => setHovered({ row: ri, col: ci })}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered({ row: ri, col: ci })}
                        onBlur={() => setHovered(null)}
                        aria-label={buildAria(row, col, prob, count, showCounts, t)}
                        animate={
                            reduce
                                ? undefined
                                : { scale: isActive ? 1.1 : 1, opacity: dim ? 0.32 : 1 }
                        }
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        style={{
                            position: "relative",
                            width: "clamp(46px, 12vw, 58px)",
                            height: "clamp(40px, 10vw, 48px)",
                            borderRadius: "var(--bigram-r-sm)",
                            border: "none",
                            outline: "none",
                            cursor: "pointer",
                            background: fill.background,
                            color: fill.color,
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: "clamp(12px, 3vw, 14px)",
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                            // at-rest emphasis: the row favourite gets a hair of weight via inset ring
                            boxShadow:
                                isActive
                                    ? "0 0 0 2px var(--bigram-accent-bright), 0 8px 20px -8px color-mix(in oklab, var(--bigram-accent) 50%, transparent)"
                                    : !anyHover && isBest
                                        ? "inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent-bright) 55%, transparent)"
                                        : "none",
                            zIndex: isActive ? 2 : 1,
                            opacity: reduce && dim ? 0.32 : undefined,
                            transition: reduce
                                ? "none"
                                : "box-shadow .2s ease, background .25s ease, color .25s ease",
                        }}
                    >
                        {readout}
                    </motion.button>
                );
            })}
        </>
    );
}

/* ─────────────────────────────────────────────
   Column header cell — mono, lights with its column
   ───────────────────────────────────────────── */

function HeaderCell({ children, lit }: { children: React.ReactNode; lit: boolean }) {
    return (
        <div
            className="flex items-end justify-center pb-1"
            style={{
                width: "clamp(46px, 12vw, 58px)",
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: lit ? "var(--bigram-accent-ink)" : "var(--bigram-muted)",
                transition: "color .25s ease",
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
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={className}
            style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "9.5px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--bigram-dim)",
            }}
        >
            {children}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Caption — the editorial line, resolves with hover
   ───────────────────────────────────────────── */

function Caption({
    hovered,
    showCounts,
    fallback,
    countTemplate,
    probTemplate,
    reduce,
}: {
    hovered: { row: number; col: number } | null;
    showCounts: boolean;
    fallback: string;
    countTemplate: string;
    probTemplate: string;
    reduce: boolean;
}) {
    if (hovered === null) {
        return (
            <p
                style={{
                    fontFamily: "var(--font-source-serif)",
                    fontStyle: "italic",
                    fontSize: "15px",
                    lineHeight: 1.5,
                    color: "var(--bigram-muted)",
                    margin: 0,
                }}
            >
                {fallback}
            </p>
        );
    }

    const rowChar = VOCAB[hovered.row];
    const colChar = VOCAB[hovered.col];
    const prob = MATRIX[hovered.row][hovered.col];
    const count = RAW_COUNTS[hovered.row][hovered.col];

    const displayRow = rowChar === " " ? "␣" : `'${rowChar}'`;
    const displayCol = colChar === " " ? "␣" : `'${colChar}'`;
    const pct = `${Math.round(prob * 100)}%`;

    const template = showCounts ? countTemplate : probTemplate;
    const parts = template.split(/(\{row\}|\{col\}|\{pct\}|\{count\})/);

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.p
                key={`${hovered.row}-${hovered.col}`}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                    fontFamily: "var(--font-source-serif)",
                    fontSize: "16px",
                    lineHeight: 1.5,
                    color: "var(--bigram-ink-2)",
                    margin: 0,
                }}
            >
                {parts.map((part, i) => {
                    if (part === "{row}")
                        return (
                            <Token key={i} accent>
                                {displayRow}
                            </Token>
                        );
                    if (part === "{col}")
                        return <Token key={i}>{displayCol}</Token>;
                    if (part === "{pct}")
                        return (
                            <Token key={i} accent>
                                {pct}
                            </Token>
                        );
                    if (part === "{count}")
                        return (
                            <Token key={i} accent>
                                {count.toLocaleString()}
                            </Token>
                        );
                    return <span key={i}>{part}</span>;
                })}
            </motion.p>
        </AnimatePresence>
    );
}

function Token({
    children,
    accent = false,
}: {
    children: React.ReactNode;
    accent?: boolean;
}) {
    return (
        <span
            style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontWeight: 600,
                color: accent ? "var(--bigram-accent-ink)" : "var(--bigram-ink)",
            }}
        >
            {children}
        </span>
    );
}

/* ─────────────────────────────────────────────
   ARIA — full readable label per cell
   ───────────────────────────────────────────── */

function buildAria(
    row: string,
    col: string,
    prob: number,
    count: number,
    showCounts: boolean,
    t: (key: string) => string,
): string {
    const r = row === " " ? "space" : row;
    const c = col === " " ? "space" : col;
    const template = showCounts
        ? t("bigramNarrative.mechanics.tinyMatrixCountTooltip")
        : t("bigramNarrative.mechanics.tinyMatrixTooltip");
    return template
        .replace("{row}", `'${r}'`)
        .replace("{col}", `'${c}'`)
        .replace("{pct}", `${Math.round(prob * 100)}%`)
        .replace("{count}", String(count));
}
