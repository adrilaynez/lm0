"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { DatasetExplorerModal } from "@/features/lab/components/DatasetExplorerModal";
import { displayChar } from "@/features/lab/data/bigramCorpora";
import { useI18n } from "@/i18n/context";

/* ═══════════════════════════════════════════════════════════════════════════
   MatrixCuriosityGame — §4 "the real table, as a game" (editorial-green, opt-in)
   ═══════════════════════════════════════════════════════════════════════════

   The curiosity-GAME layer of TransitionMatrix, split into this companion file (same pattern as
   BigramMatrixBuilderParts) so the orchestrating TransitionMatrix stays focused. Mounted ONLY when
   <TransitionMatrix game accent="bigram" /> is used; the legacy canvas/slice renderer is untouched.

   ONE idea: the real transition table is mostly EMPTY. Most cells are black gaps — transitions that
   never happen — and those gaps are not noise, they are the SHAPE of the language. The learner
   plays: black gaps glow, a prompt invites "find a cell that never happens", and clicking a cell
   reveals WHY (an in-place sage curiosity) or opens corpus evidence (DatasetExplorerModal) when the
   pair genuinely occurs.

   Self-mounting: reads its copy via useI18n (bigramNarrative.v2.matrixGame.*) and builds a
   deterministic matrix from a small, legible vocabulary (space · frequent lowercase · two capitals ·
   two digits · the q/u pair). No props, no async data. Hand-authored counts are plausible English,
   in the same spirit as the bigramCorpora dataset, tuned so the four curiosity ZONES are visibly
   empty: capital-after-lowercase, q-without-u, digit-after-letter, space-after-space. Reads only
   --bigram-* tokens; lives inside the chapter's [data-bigram-theme] scope (same contract as
   CorpusCountingIdea). Reduced-motion safe.
   ─────────────────────────────────────────────────────────────────────────── */

/** Curiosity zone a clicked black cell belongs to → which i18n curiosity to surface. */
type CuriosityKey = "upperAfterLower" | "qWithoutU" | "digitAfterLetter" | "spaceAfterSpace";

/** The compact game vocabulary (rows == cols). Chosen so every curiosity zone is reachable. */
const GAME_AXIS: string[] = [" ", "t", "h", "e", "a", "o", "q", "u", "n", "T", "A", "0", "1"];

const LOWER = new Set(["t", "h", "e", "a", "o", "q", "u", "n"]);
const UPPER = new Set(["T", "A"]);
const DIGIT = new Set(["0", "1"]);

/**
 * Deterministic count for the (row → col) transition in the game vocabulary. Returns 0 for the
 * structural gaps (the black cells the game is about) and a plausible positive count otherwise.
 * Counts are hand-authored, NOT scraped — just large enough to drive a legible intensity ramp.
 */
function gameCount(row: string, col: string): number {
    // ── Structural ZEROS (the black gaps, by zone) ──────────────────────────
    // A capital almost never follows a lowercase letter.
    if (LOWER.has(row) && UPPER.has(col)) return 0;
    // Letters and digits rarely touch (either direction).
    if ((LOWER.has(row) || UPPER.has(row)) && DIGIT.has(col)) return 0;
    if (DIGIT.has(row) && (LOWER.has(col) || UPPER.has(col))) return 0;
    // Two spaces in a row essentially never happen.
    if (row === " " && col === " ") return 0;
    // After "q", almost everything except "u" is a gap.
    if (row === "q" && col !== "u") return 0;

    // ── Strong, named peaks (the patterns the learner already felt) ─────────
    if (row === "q" && col === "u") return 920; // q → u, near-certain
    if (row === "t" && col === "h") return 880; // t → h
    if (row === "h" && col === "e") return 760; // h → e
    if (row === "e" && col === " ") return 690; // e → (word end)
    if (row === " " && col === "t") return 540; // word often starts with t
    if (row === "T" && col === "h") return 410; // "Th…" at sentence start
    if (row === "A" && col === " ") return 120;
    if (row === "0" && col === "1") return 60;  // digits cluster with digits
    if (row === "1" && col === "0") return 58;

    // ── A deterministic but uneven sprinkle for the remaining real cells ────
    const a = GAME_AXIS.indexOf(row);
    const b = GAME_AXIS.indexOf(col);
    const h = (a * 31 + b * 17 + 7) % 100;
    if (h < 34) return 0;                 // many remaining cells are also empty — the table is sparse
    return 6 + ((a * 13 + b * 29) % 46);  // 6..51, small legible counts
}

/** Which curiosity a black (zero) cell illustrates; null if the cell is not a "teaching" gap. */
function curiosityFor(row: string, col: string): CuriosityKey | null {
    if (row === " " && col === " ") return "spaceAfterSpace";
    if (row === "q" && col !== "u") return "qWithoutU";
    if (LOWER.has(row) && UPPER.has(col)) return "upperAfterLower";
    if (
        ((LOWER.has(row) || UPPER.has(row)) && DIGIT.has(col)) ||
        (DIGIT.has(row) && (LOWER.has(col) || UPPER.has(col)))
    ) {
        return "digitAfterLetter";
    }
    return null;
}

interface GameCell {
    row: string;
    col: string;
    count: number;
    /** 0..1 intensity for fill, sqrt-eased against the matrix max (matches the canvas ramp). */
    intensity: number;
    /** True when count === 0 (a black gap the game is about). */
    empty: boolean;
    /** For empty cells that teach a named pattern. */
    curiosity: CuriosityKey | null;
}

type GameMatrix = { cells: GameCell[][]; emptyCount: number; total: number };

function buildGameMatrix(): GameMatrix {
    const raw = GAME_AXIS.map((row) => GAME_AXIS.map((col) => gameCount(row, col)));
    const max = Math.max(1, ...raw.flat());
    let emptyCount = 0;
    const cells = GAME_AXIS.map((row, r) =>
        GAME_AXIS.map((col, c) => {
            const count = raw[r][c];
            const empty = count === 0;
            if (empty) emptyCount += 1;
            return {
                row,
                col,
                count,
                intensity: empty ? 0 : Math.sqrt(count / max),
                empty,
                curiosity: empty ? curiosityFor(row, col) : null,
            } satisfies GameCell;
        }),
    );
    return { cells, emptyCount, total: GAME_AXIS.length * GAME_AXIS.length };
}

const CELL_EASE = [0.2, 0.7, 0.2, 1] as const;

export const MatrixCuriosityGame = memo(function MatrixCuriosityGame() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const { cells, emptyCount, total } = useMemo(() => buildGameMatrix(), []);

    // Selected cell drives the reveal. A black teaching cell shows an inline sage curiosity; a
    // cell with a real count opens corpus evidence (DatasetExplorerModal) — the "count, don't
    // reason" through-line of the chapter.
    const [selected, setSelected] = useState<GameCell | null>(null);
    const [evidence, setEvidence] = useState<{ row: string; col: string } | null>(null);
    const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);

    const handleCell = useCallback((cell: GameCell) => {
        if (cell.empty) {
            // Black gap → teach why (or, if not a named zone, still acknowledge the emptiness).
            setEvidence(null);
            setSelected(cell);
        } else {
            // Real transition → ground it in the corpus. Keep the cell selected for context.
            setSelected(cell);
            setEvidence({ row: cell.row, col: cell.col });
        }
    }, []);

    const fillFor = (cell: GameCell) =>
        `color-mix(in oklab, var(--bigram-accent) ${Math.round(
            (0.12 + cell.intensity * 0.88) * 100,
        )}%, transparent)`;

    return (
        <div className="flex flex-col gap-5" style={{ fontFamily: "var(--font-source-serif)" }}>
            {/* Eyebrow + the playful invitation. Typography-first; no toolbar, no chrome. */}
            <div className="flex flex-col gap-2">
                <span
                    className="text-[11px] font-medium uppercase text-bigram-accent-ink"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: ".2em" }}
                >
                    {t("bigramNarrative.v2.matrixGame.label")}
                </span>
                <p className="text-[15px] leading-snug text-bigram-muted">
                    {t("bigramNarrative.v2.matrixGame.hint")}
                </p>
            </div>

            {/* The prompt — a quiet sage line that frames the hunt. */}
            <div
                className="self-start px-4 py-2.5 text-[14px] text-bigram-ink"
                style={{
                    borderRadius: "var(--bigram-r-md)",
                    background: "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
                    boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 30%, transparent)",
                }}
            >
                {t("bigramNarrative.v2.matrixGame.blackCellPrompt")}
            </div>

            {/* The grid — a sunk field; cells are fill-only (no per-cell borders). */}
            <div
                className="relative w-full overflow-x-auto custom-scrollbar p-4"
                style={{
                    borderRadius: "var(--bigram-r-lg)",
                    background: "var(--bigram-bg-2)",
                    border: "1px solid var(--bigram-rule)",
                }}
            >
                <div className="inline-grid gap-[3px] mx-auto" style={{ gridTemplateColumns: `28px repeat(${GAME_AXIS.length}, minmax(28px, 1fr))` }}>
                    {/* corner + column axis labels */}
                    <span aria-hidden />
                    {GAME_AXIS.map((col) => (
                        <span
                            key={`col-${col}`}
                            className="grid place-items-center text-[11px] text-bigram-dim"
                            style={{ fontFamily: "var(--font-jetbrains-mono)", height: "20px" }}
                        >
                            {displayChar(col)}
                        </span>
                    ))}

                    {/* rows */}
                    {cells.map((rowCells, r) => (
                        <RowFragment
                            key={`row-${GAME_AXIS[r]}`}
                            label={displayChar(GAME_AXIS[r])}
                            rowCells={rowCells}
                            r={r}
                            reduce={!!reduce}
                            hovered={hovered}
                            selected={selected}
                            fillFor={fillFor}
                            onHover={setHovered}
                            onCell={handleCell}
                        />
                    ))}
                </div>
            </div>

            {/* Legend: what "black" vs "filled" means. Quiet, mono, no boxes. */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <LegendSwatch
                    fill="var(--bigram-bg-2)"
                    ring
                    label={`${t("models.bigram.matrix.legendRare")} · ${emptyCount}/${total}`}
                />
                <LegendSwatch
                    fill="color-mix(in oklab, var(--bigram-accent) 100%, transparent)"
                    label={t("models.bigram.matrix.legendCommon")}
                />
            </div>

            {/* The reveal — a sage curiosity panel for black cells (the heart of the game). */}
            <AnimatePresence mode="wait">
                {selected && selected.empty && (
                    <CuriosityReveal
                        key={`${selected.row}:${selected.col}`}
                        cell={selected}
                        reduce={!!reduce}
                        onDismiss={() => setSelected(null)}
                        t={t}
                    />
                )}
                {selected && !selected.empty && (
                    <RealCellHint
                        key={`real:${selected.row}:${selected.col}`}
                        cell={selected}
                        reduce={!!reduce}
                        t={t}
                    />
                )}
            </AnimatePresence>

            {/* Corpus evidence for real (non-empty) pairs — reuses the chapter's modal verbatim. */}
            <DatasetExplorerModal
                isOpen={evidence !== null}
                onClose={() => setEvidence(null)}
                contextChar={evidence?.row ?? ""}
                nextChar={evidence?.col ?? ""}
                modelType="bigram"
            />
        </div>
    );
});

/** One matrix row: a sticky-ish axis label + its cells. Kept as a fragment for the CSS grid. */
function RowFragment({
    label,
    rowCells,
    r,
    reduce,
    hovered,
    selected,
    fillFor,
    onHover,
    onCell,
}: {
    label: string;
    rowCells: GameCell[];
    r: number;
    reduce: boolean;
    hovered: { r: number; c: number } | null;
    selected: GameCell | null;
    fillFor: (cell: GameCell) => string;
    onHover: (h: { r: number; c: number } | null) => void;
    onCell: (cell: GameCell) => void;
}) {
    return (
        <>
            <span
                className="grid place-items-center text-[11px] text-bigram-dim"
                style={{ fontFamily: "var(--font-jetbrains-mono)" }}
            >
                {label}
            </span>
            {rowCells.map((cell, c) => {
                const isHovered = hovered?.r === r && hovered?.c === c;
                const isSelected = selected?.row === cell.row && selected?.col === cell.col;
                const inCross = hovered !== null && (hovered.r === r || hovered.c === c);
                const dim = hovered !== null && !inCross;
                return (
                    <motion.button
                        key={`${cell.row}-${cell.col}`}
                        type="button"
                        aria-label={`${cell.row === " " ? "space" : cell.row} then ${
                            cell.col === " " ? "space" : cell.col
                        } — ${cell.empty ? "never happens" : `${cell.count}`}`}
                        onMouseEnter={() => onHover({ r, c })}
                        onMouseLeave={() => onHover(null)}
                        onFocus={() => onHover({ r, c })}
                        onBlur={() => onHover(null)}
                        onClick={() => onCell(cell)}
                        className="relative aspect-square min-w-[28px] cursor-pointer outline-none"
                        style={{
                            borderRadius: "5px",
                            background: cell.empty
                                ? "color-mix(in oklab, var(--bigram-ink) 6%, transparent)"
                                : fillFor(cell),
                            opacity: dim ? 0.32 : 1,
                            boxShadow: isSelected
                                ? "inset 0 0 0 2px var(--bigram-sage)"
                                : isHovered
                                  ? "inset 0 0 0 2px color-mix(in oklab, var(--bigram-accent) 55%, transparent)"
                                  : cell.empty && cell.curiosity
                                    ? "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 26%, transparent)"
                                    : "none",
                        }}
                        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                        animate={{ opacity: dim ? 0.32 : 1, scale: 1 }}
                        transition={
                            reduce
                                ? { duration: 0 }
                                : { duration: 0.34, ease: CELL_EASE, delay: Math.min(0.5, (r + c) * 0.012) }
                        }
                    />
                );
            })}
        </>
    );
}

/** Tiny legend swatch with an optional inset ring (for the "empty" sample). */
function LegendSwatch({ fill, label, ring = false }: { fill: string; label: string; ring?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <span
                className="w-3.5 h-3.5"
                style={{
                    borderRadius: "4px",
                    background: fill,
                    boxShadow: ring ? "inset 0 0 0 1px var(--bigram-rule-2)" : "none",
                }}
            />
            <span
                className="text-[10px] uppercase text-bigram-dim"
                style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: ".12em" }}
            >
                {label}
            </span>
        </div>
    );
}

/**
 * The sage reveal for a black cell — the payoff of the game. A mono eyebrow naming the pair
 * (After "q" → "z"), the plain-language curiosity in serif, and a quiet dismiss affordance.
 * Uses the SAGE insight voice (matches the Verdict primitive), distinct from the emerald accent.
 */
function CuriosityReveal({
    cell,
    reduce,
    onDismiss,
    t,
}: {
    cell: GameCell;
    reduce: boolean;
    onDismiss: () => void;
    t: (key: string, vars?: Record<string, string | number>) => string;
}) {
    // Named zones get their specific curiosity; any other black gap states the honest, generic
    // truth (never a borrowed-and-wrong explanation): this transition simply never happened.
    const body = cell.curiosity
        ? t(`bigramNarrative.v2.matrixGame.curiosities.${cell.curiosity}`)
        : t("bigramNarrative.v2.matrixGame.blackCellPrompt");

    return (
        <motion.button
            type="button"
            onClick={onDismiss}
            className="block w-full text-left cursor-pointer"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
                padding: "18px 22px",
                borderRadius: "var(--bigram-r-md)",
                background: "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
                boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 32%, transparent)",
            }}
        >
            <div className="flex items-center justify-between gap-4">
                <span
                    className="inline-flex items-baseline gap-1.5"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "16px", fontWeight: 600 }}
                >
                    <span className="text-bigram-dim">{t("bigramNarrative.v2.matrixGame.cellAfter", { row: displayChar(cell.row) })}</span>
                    <span className="text-bigram-dim text-[13px]" aria-hidden>→</span>
                    <span className="text-bigram-ink" style={{ fontWeight: 700 }}>
                        {t("bigramNarrative.v2.matrixGame.cellNext", { col: displayChar(cell.col) })}
                    </span>
                </span>
                <span
                    className="flex-none text-[10px] uppercase text-bigram-sage"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", letterSpacing: ".16em" }}
                >
                    {t("bigramNarrative.v2.matrixGame.clickToDismiss")}
                </span>
            </div>
            <p className="mt-2.5 text-[17px] leading-relaxed text-bigram-ink" style={{ textWrap: "pretty" }}>
                {body}
            </p>
        </motion.button>
    );
}

/**
 * Lightweight hint shown when a REAL (non-empty) cell is clicked: it names the pair and points to
 * the corpus evidence that just opened. Mono pair + serif caption, sunk-well surface (fill, no box).
 */
function RealCellHint({
    cell,
    reduce,
    t,
}: {
    cell: GameCell;
    reduce: boolean;
    t: (key: string, vars?: Record<string, string | number>) => string;
}) {
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={reduce ? { duration: 0 } : { duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex items-center gap-3 px-5 py-3.5"
            style={{
                borderRadius: "var(--bigram-r-md)",
                background: "var(--bigram-surface)",
                boxShadow: "inset 0 1px 0 0 color-mix(in oklab, var(--bigram-ink) 6%, transparent)",
            }}
        >
            <span
                className="inline-flex items-baseline gap-1.5"
                style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "16px", fontWeight: 600 }}
            >
                <span className="text-bigram-dim">{t("bigramNarrative.v2.matrixGame.cellAfter", { row: displayChar(cell.row) })}</span>
                <span className="text-bigram-dim text-[13px]" aria-hidden>→</span>
                <span className="text-bigram-accent-ink" style={{ fontWeight: 700 }}>
                    {t("bigramNarrative.v2.matrixGame.cellNext", { col: displayChar(cell.col) })}
                </span>
            </span>
            <span
                className="text-[14px] text-bigram-muted"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {cell.count.toLocaleString()}
            </span>
        </motion.div>
    );
}
