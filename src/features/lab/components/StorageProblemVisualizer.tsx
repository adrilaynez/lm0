"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

/**
 * StorageProblemVisualizer — the "storage problem" instrument (Bigram chapter, v8 · editorial-green).
 *
 * ONE concept: *every character can be followed by every character, so the number of pairs to track
 * explodes — which is exactly why we reach for a 2D table (rows × columns).* The piece is built to be
 * felt, not read: as you pick characters, a single odometer of "slots needed" climbs, and the resolution
 * is the transition table itself — the structural answer to the explosion.
 *
 *  • the picker is a SEGMENTED CONTROL (sunk --bigram-bg-2 rail, active cell filled accent);
 *  • the chosen character's real followers fan out as pair pills, with an honest "+N more" ghost
 *    standing in for the rest of the vocabulary row (we never pretend the row is only 5 wide);
 *  • the running total is a count-up ODOMETER — the single focal number that makes the explosion land;
 *  • once enough is explored, one quiet affordance opens the resolution: a transition-table preview
 *    (rows × columns, cells tinted by count) — the structural answer that motivates the whole grid.
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 * Fully reduced-motion safe (odometer + cell cascade settle instantly; no superfluous motion).
 */

/* ─── Model constants ─── */
const VOCAB_SIZE = 96; // size of the character vocabulary (rows = cols = V → V² cells)
const TOTAL_CELLS = VOCAB_SIZE * VOCAB_SIZE;
const CHARS_ROW = ["t", "h", "e", " ", "a", "s", "o", "n"];
const PREVIEW_N = 5; // how many chars the table preview shows per axis before "…"

/* Real-ish follower counts per origin char (a believable slice of an English corpus). */
const SAMPLE_FOLLOWERS: Record<string, { char: string; count: number }[]> = {
    t: [{ char: "h", count: 412 }, { char: "e", count: 189 }, { char: "o", count: 156 }, { char: " ", count: 98 }, { char: "i", count: 87 }],
    h: [{ char: "e", count: 481 }, { char: "a", count: 167 }, { char: "i", count: 112 }, { char: "o", count: 98 }, { char: " ", count: 45 }],
    e: [{ char: " ", count: 623 }, { char: "r", count: 198 }, { char: "n", count: 167 }, { char: "s", count: 145 }, { char: "d", count: 112 }],
    " ": [{ char: "t", count: 356 }, { char: "a", count: 245 }, { char: "s", count: 189 }, { char: "i", count: 167 }, { char: "o", count: 134 }],
    a: [{ char: "n", count: 312 }, { char: "t", count: 198 }, { char: "l", count: 167 }, { char: "r", count: 145 }, { char: "s", count: 112 }],
    s: [{ char: " ", count: 389 }, { char: "t", count: 198 }, { char: "e", count: 167 }, { char: "o", count: 112 }, { char: "i", count: 98 }],
    o: [{ char: "n", count: 312 }, { char: "r", count: 198 }, { char: "f", count: 145 }, { char: "u", count: 112 }, { char: " ", count: 98 }],
    n: [{ char: " ", count: 401 }, { char: "e", count: 198 }, { char: "d", count: 145 }, { char: "t", count: 112 }, { char: "g", count: 89 }],
};

const SPACE_GLYPH = "·"; // matches the storageProblem i18n copy, which quotes '{char}'
const CELL_TINT_MAX = 0.36; // strongest accent tint a populated table cell reaches
const ODO_MS = 620; // count-up duration, easeOutCubic — mirrors HonestBar
const STD_EASE = [0.2, 0.8, 0.2, 1] as const;

type Phase = "pick" | "growing" | "insight";

function lbl(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}

/**
 * Count-up odometer — eases `from`→`value` (easeOutCubic ~620ms). Mirrors HonestBar's CountUpValue:
 * every setState fires inside the RAF callback (never synchronously in the effect body), so the
 * React-compiler set-state-in-effect rule stays satisfied. The consumer keys it on `value` so a new
 * target remounts cleanly; `from` lets a remounted instance animate up from the previous total rather
 * than snapping back to zero. When `animate` is false the final number is shown instantly.
 */
const Odometer = memo(function Odometer({
    value,
    from,
    animate,
}: {
    value: number;
    from: number;
    animate: boolean;
}) {
    const [shown, setShown] = useState(animate ? from : value);

    useEffect(() => {
        if (!animate) return;
        let raf = 0;
        let t0: number | null = null;
        let cancelled = false;
        const frame = (now: number) => {
            if (cancelled) return;
            if (t0 === null) t0 = now;
            const k = Math.min(1, (now - t0) / ODO_MS);
            const eased = 1 - Math.pow(1 - k, 3);
            setShown(Math.round(from + (value - from) * eased));
            if (k < 1) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
        };
    }, [value, from, animate]);

    return <>{shown.toLocaleString()}</>;
});

/**
 * Renders the "{total} slots needed so far" sentence with {total} replaced by the count-up odometer,
 * styled as the focal number — a template split (like CorpusCountingIdea's VerdictSentence) so the
 * surrounding copy stays fully translatable and never gets sliced apart.
 */
function TotalSentence({
    template,
    value,
    from,
    animate,
}: {
    template: string;
    value: number;
    from: number;
    animate: boolean;
}) {
    const parts = template.split(/(\{total\})/g);
    return (
        <>
            {parts.map((part, i) =>
                part === "{total}" ? (
                    <span
                        key={i}
                        style={{
                            fontFamily: "var(--font-playfair)",
                            fontSize: "clamp(30px, 5vw, 44px)",
                            fontWeight: 600,
                            color: "var(--bigram-accent-ink)",
                            fontVariantNumeric: "tabular-nums",
                            lineHeight: 1,
                        }}
                    >
                        {/* keyed on the target so each new total remounts and animates from the previous one */}
                        <Odometer key={value} value={value} from={from} animate={animate} />
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

/* ─── Component ─── */
export const StorageProblemVisualizer = memo(function StorageProblemVisualizer() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [picked, setPicked] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>("pick");

    const lastPicked = picked[picked.length - 1];
    const followers = lastPicked ? SAMPLE_FOLLOWERS[lastPicked] ?? [] : [];

    const totalSlots = useMemo(() => picked.length * VOCAB_SIZE, [picked.length]);
    // The total *before* the most recent pick, so the odometer eases up from it instead of from zero.
    const prevTotalSlots = Math.max(0, totalSlots - VOCAB_SIZE);

    const handlePick = useCallback((ch: string) => {
        setPicked((prev) => {
            if (prev.includes(ch)) return prev; // already explored → keep it, just re-show its row
            const next = [...prev, ch];
            if (next.length >= 3) setPhase("growing");
            return next;
        });
    }, []);

    const handleInsight = useCallback(() => setPhase("insight"), []);

    return (
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
            {/* ── Picker label ── */}
            <p style={labelStyle}>{t("bigramNarrative.storageProblem.pickPrompt")}</p>

            {/* ── Segmented control: sunk rail, active cell filled accent ── */}
            <div style={{ textAlign: "center" }}>
                <div
                    role="group"
                    aria-label={t("bigramNarrative.storageProblem.pickPrompt")}
                    style={{
                        display: "inline-flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 4,
                        padding: 5,
                        borderRadius: "var(--bigram-r-md)",
                        background: "var(--bigram-bg-2)",
                        boxShadow: "inset 0 1px 4px rgba(0,0,0,.28)",
                    }}
                >
                    {CHARS_ROW.map((ch) => {
                        const isPicked = picked.includes(ch);
                        const isActive = lastPicked === ch;
                        return (
                            <button
                                key={ch}
                                type="button"
                                aria-pressed={isPicked}
                                onClick={() => handlePick(ch)}
                                style={{
                                    position: "relative",
                                    minWidth: 44,
                                    height: 44,
                                    padding: "0 12px",
                                    display: "grid",
                                    placeItems: "center",
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: 21,
                                    fontWeight: isActive ? 600 : 500,
                                    border: 0,
                                    borderRadius: "var(--bigram-r-sm)",
                                    cursor: "pointer",
                                    background: "transparent",
                                    color: isActive
                                        ? "var(--bigram-on-accent)"
                                        : isPicked
                                        ? "var(--bigram-accent-ink)"
                                        : "var(--bigram-muted)",
                                    transition: "color .2s ease",
                                }}
                            >
                                {/* a small dot marks chars already explored (but not currently active) */}
                                {isPicked && !isActive && (
                                    <span
                                        aria-hidden
                                        style={{
                                            position: "absolute",
                                            top: 6,
                                            right: 6,
                                            width: 5,
                                            height: 5,
                                            borderRadius: "50%",
                                            background: "var(--bigram-accent-2)",
                                        }}
                                    />
                                )}
                                {/* active fill rides between cells (shared layoutId = segmented feel) */}
                                {isActive && (
                                    <motion.span
                                        layoutId="bw-storage-seg"
                                        aria-hidden
                                        transition={
                                            reduce
                                                ? { duration: 0 }
                                                : { type: "spring", stiffness: 520, damping: 38 }
                                        }
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: "var(--bigram-r-sm)",
                                            background: "var(--bigram-accent)",
                                            boxShadow:
                                                "0 5px 14px -5px color-mix(in oklab, var(--bigram-accent) 65%, transparent)",
                                            zIndex: 0,
                                        }}
                                    />
                                )}
                                <span style={{ position: "relative", zIndex: 1 }}>{lbl(ch)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Followers fan for the active char ── one row of the would-be table ── */}
            <AnimatePresence mode="wait">
                {lastPicked && (
                    <motion.div
                        key={lastPicked}
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.3, ease: STD_EASE }}
                        style={{ marginTop: 22 }}
                    >
                        <p style={{ ...labelStyle, margin: "0 0 12px" }}>
                            {t("bigramNarrative.storageProblem.afterChar", { char: lbl(lastPicked) })}
                        </p>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center",
                                gap: 8,
                                padding: "20px 18px",
                                borderRadius: "var(--bigram-r-lg)",
                                background: "color-mix(in oklab, var(--bigram-surface) 55%, var(--bigram-bg))",
                            }}
                        >
                            {followers.map((f, i) => (
                                <motion.div
                                    key={f.char}
                                    initial={reduce ? false : { opacity: 0, scale: 0.88 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: reduce ? 0 : i * 0.05, duration: 0.3, ease: STD_EASE }}
                                    style={pillStyle}
                                >
                                    <span style={{ color: "var(--bigram-dim)", fontWeight: 500 }}>{lbl(lastPicked)}</span>
                                    <span style={{ color: "var(--bigram-dim)", fontSize: 13, margin: "0 4px" }}>→</span>
                                    <span style={{ color: "var(--bigram-accent-ink)", fontWeight: 600 }}>{lbl(f.char)}</span>
                                    <span
                                        style={{
                                            marginLeft: 8,
                                            fontSize: 11.5,
                                            color: "var(--bigram-dim)",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        ×{f.count}
                                    </span>
                                </motion.div>
                            ))}

                            {/* honest ghost: the rest of the vocabulary row we are NOT drawing */}
                            <motion.div
                                initial={reduce ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: reduce ? 0 : followers.length * 0.05 + 0.05 }}
                                style={ghostPillStyle}
                            >
                                +{VOCAB_SIZE - followers.length} {t("bigramNarrative.storageProblem.moreFollowers")}
                            </motion.div>
                        </div>

                        <p
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11.5,
                                letterSpacing: ".02em",
                                color: "var(--bigram-dim)",
                                textAlign: "center",
                                margin: "12px 0 0",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.needSlots", { char: lbl(lastPicked), count: VOCAB_SIZE })}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Running total — the focal odometer ── */}
            <AnimatePresence>
                {picked.length >= 2 && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, ease: STD_EASE }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6,
                            margin: "28px 0 0",
                        }}
                    >
                        {/* eyebrow — how many characters have been explored so far */}
                        <span
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11,
                                letterSpacing: ".2em",
                                textTransform: "uppercase",
                                color: "var(--bigram-muted)",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.charsExplored", { count: picked.length })}
                        </span>
                        {/* the focal odometer, woven into its localized sentence */}
                        <p
                            style={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                flexWrap: "wrap",
                                justifyContent: "center",
                                gap: 8,
                                margin: 0,
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 13,
                                letterSpacing: ".02em",
                                color: "var(--bigram-muted)",
                            }}
                        >
                            <TotalSentence
                                template={t("bigramNarrative.storageProblem.slotsTotal", { total: "{total}" })}
                                value={totalSlots}
                                from={prevTotalSlots}
                                animate={!reduce}
                            />
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Phase 2: growing realization + the single resolution affordance ── */}
            <AnimatePresence>
                {phase === "growing" && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.35, ease: STD_EASE }}
                        style={{ textAlign: "center", marginTop: 24 }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-source-serif)",
                                fontSize: 18,
                                lineHeight: 1.55,
                                color: "var(--bigram-body)",
                                maxWidth: 46 + "ch",
                                margin: "0 auto 18px",
                                textWrap: "pretty",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.growingRealization", {
                                count: picked.length,
                                slots: totalSlots.toLocaleString(),
                                total: TOTAL_CELLS.toLocaleString(),
                            })}
                        </p>
                        <button
                            type="button"
                            onClick={handleInsight}
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 12,
                                letterSpacing: ".1em",
                                textTransform: "uppercase",
                                fontWeight: 600,
                                padding: "12px 18px",
                                border: 0,
                                borderRadius: "var(--bigram-r-sm)",
                                cursor: "pointer",
                                background: "var(--bigram-accent)",
                                color: "var(--bigram-on-accent)",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.howToOrganize")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Phase 3: the resolution — a transition-table preview ── */}
            <AnimatePresence>
                {phase === "insight" && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.42, ease: STD_EASE }}
                        style={{ marginTop: 24 }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-playfair)",
                                fontSize: "clamp(22px, 3vw, 28px)",
                                fontWeight: 600,
                                lineHeight: 1.15,
                                color: "var(--bigram-ink)",
                                textAlign: "center",
                                margin: "0 0 10px",
                                textWrap: "balance",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.insightTitle")}
                        </p>
                        <p
                            style={{
                                fontFamily: "var(--font-source-serif)",
                                fontSize: 16.5,
                                lineHeight: 1.6,
                                color: "var(--bigram-body)",
                                textAlign: "center",
                                maxWidth: 48 + "ch",
                                margin: "0 auto 22px",
                                textWrap: "pretty",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.insightDesc")}
                        </p>

                        <TablePreview picked={picked} reduce={!!reduce} />

                        <p
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11.5,
                                letterSpacing: ".06em",
                                color: "var(--bigram-muted)",
                                textAlign: "center",
                                margin: "18px 0 0",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.fullSize", {
                                size: VOCAB_SIZE,
                                total: TOTAL_CELLS.toLocaleString(),
                            })}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/* ─── Transition-table preview ───
   Rows = starting char, columns = next char; the cell where they meet holds the count, tinted by
   magnitude. The picked chars seed both axes; "…" stands in for the rest of the V×V grid. The cell
   fill cascades in (row by row) so the structure assembles rather than appearing all at once. */
const TablePreview = memo(function TablePreview({ picked, reduce }: { picked: string[]; reduce: boolean }) {
    const { t } = useI18n();
    const axisChars = picked.slice(0, PREVIEW_N);
    const cell = 38;

    return (
        <div style={{ display: "flex", justifyContent: "center" }}>
            <div
                role="img"
                aria-label={t("bigramNarrative.storageProblem.insightTitle")}
                style={{
                    display: "inline-grid",
                    gridTemplateColumns: `28px repeat(${axisChars.length}, ${cell}px) 28px`,
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 12,
                    fontVariantNumeric: "tabular-nums",
                    background: "var(--bigram-bg-2)",
                    borderRadius: "var(--bigram-r-md)",
                    padding: 10,
                    boxShadow: "inset 0 1px 4px rgba(0,0,0,.26)",
                    rowGap: 2,
                    columnGap: 2,
                }}
            >
                {/* corner */}
                <div style={cornerStyle}>
                    <span style={{ fontSize: 10 }}>↓→</span>
                </div>
                {/* column headers (next char) */}
                {axisChars.map((c) => (
                    <div key={`col-${c}`} style={{ ...headStyle, color: "var(--bigram-accent-ink)" }}>
                        {lbl(c)}
                    </div>
                ))}
                <div style={{ ...headStyle, color: "var(--bigram-dim)" }}>…</div>

                {/* body rows */}
                {axisChars.map((r, ri) => (
                    <RowFragment key={`row-${r}`} r={r} ri={ri} axisChars={axisChars} cell={cell} reduce={reduce} />
                ))}

                {/* trailing "…" row standing in for the rest of the vocabulary */}
                <div style={{ ...headStyle, color: "var(--bigram-dim)" }}>…</div>
                {axisChars.map((c) => (
                    <div key={`tail-${c}`} style={{ ...cellBase, color: "var(--bigram-dim)" }}>
                        …
                    </div>
                ))}
                <div style={{ ...cellBase, color: "var(--bigram-dim)" }} />
            </div>
        </div>
    );
});

/* one table row: header cell + populated count cells, fill cascading in */
const RowFragment = memo(function RowFragment({
    r,
    ri,
    axisChars,
    cell,
    reduce,
}: {
    r: string;
    ri: number;
    axisChars: string[];
    cell: number;
    reduce: boolean;
}) {
    return (
        <>
            <div style={{ ...headStyle, color: "var(--bigram-accent-ink)" }}>{lbl(r)}</div>
            {axisChars.map((c, ci) => {
                const val = SAMPLE_FOLLOWERS[r]?.find((f) => f.char === c)?.count ?? 0;
                const tint = val > 0 ? Math.min(CELL_TINT_MAX, val / 700) : 0;
                return (
                    <motion.div
                        key={`${r}-${c}`}
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: reduce ? 0 : (ri * axisChars.length + ci) * 0.03, duration: 0.3 }}
                        style={{
                            ...cellBase,
                            minWidth: cell,
                            background:
                                val > 0
                                    ? `color-mix(in oklab, var(--bigram-accent) ${(tint * 100).toFixed(0)}%, transparent)`
                                    : "transparent",
                            color: val > 0 ? "var(--bigram-ink)" : "var(--bigram-dim)",
                            fontWeight: val > 0 ? 600 : 400,
                        }}
                    >
                        {val || "·"}
                    </motion.div>
                );
            })}
            {/* row tail */}
            <div style={{ ...cellBase, color: "var(--bigram-dim)" }}>…</div>
        </>
    );
});

/* ─── Shared inline styles ─── */
const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 11,
    letterSpacing: ".2em",
    textTransform: "uppercase",
    color: "var(--bigram-muted)",
    margin: "0 0 12px",
    textAlign: "center",
};

const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "baseline",
    padding: "7px 14px",
    borderRadius: "var(--bigram-r-pill)",
    background: "var(--bigram-accent-soft)",
    boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 22%, transparent)",
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 16,
    whiteSpace: "nowrap",
};

const ghostPillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 14px",
    borderRadius: "var(--bigram-r-pill)",
    boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 11.5,
    letterSpacing: ".04em",
    color: "var(--bigram-dim)",
    whiteSpace: "nowrap",
};

const cellBase: React.CSSProperties = {
    height: 32,
    display: "grid",
    placeItems: "center",
    borderRadius: 6,
    textAlign: "center",
};

const headStyle: React.CSSProperties = {
    ...cellBase,
    fontWeight: 600,
};

const cornerStyle: React.CSSProperties = {
    ...cellBase,
    color: "var(--bigram-dim)",
};
