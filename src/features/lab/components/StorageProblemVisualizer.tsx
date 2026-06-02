"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

/**
 * StorageProblemVisualizer — the "storage problem" instrument (Bigram chapter, v10 · editorial-green).
 *
 * ONE concept, made visceral: *every character is both a possible START and a possible FOLLOWER, so
 * the table is V wide AND V tall — the number of slots grows as V², which explodes.* The widget is the
 * grid itself: as you add characters to the vocabulary, each new character drops in as a NEW ROW and a
 * NEW COLUMN at once, and the lattice of cells multiplies in front of you. A single focal odometer reads
 * "V × V = N slots" — quadratic, not linear — and that is the whole point.
 *
 *  • the vocabulary is a SEGMENTED CONTROL (sunk --bigram-bg-2 rail, added cells filled accent);
 *  • adding a character animates a row + column into the grid simultaneously (the cross that lands);
 *  • the running cost is a count-up ODOMETER framed as V × V — the single focal number;
 *  • one quiet "+N more" ghost keeps the row honest about the rest of the alphabet we are not drawing;
 *  • once the explosion is felt, a calm SAGE takeaway names the resolution: it *is* a transition table.
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 * Fully reduced-motion safe (odometer + grid cascade settle instantly).
 *
 * NOTE — reuses every existing `storageProblem` i18n key (pickPrompt, charsExplored, slotsTotal,
 * growingRealization, howToOrganize, insightTitle, insightDesc, fullSize, afterChar, needSlots,
 * moreFollowers). Two short connective phrases are inlined because no key exists for them (see report).
 */

/* ─── Model constants ─── */
const VOCAB_SIZE = 96; // the full character vocabulary (rows = cols = V → V² cells)
const TOTAL_CELLS = VOCAB_SIZE * VOCAB_SIZE;
const ALPHABET = ["t", "h", "e", " ", "a", "s", "o", "n"]; // the chars the learner can add
const CELL = 34; // grid cell edge (px)
const ODO_MS = 620; // count-up duration, easeOutCubic — mirrors HonestBar / Odometer
const STD_EASE = [0.2, 0.8, 0.2, 1] as const;
const SPACE_GLYPH = "·";

/* A believable slice of follower counts for the "one row" honest aside (tints the diagonal-ish cells). */
const SAMPLE_FOLLOWERS: Record<string, { char: string; count: number }[]> = {
    t: [{ char: "h", count: 412 }, { char: "e", count: 189 }, { char: "o", count: 156 }, { char: " ", count: 98 }, { char: "a", count: 71 }],
    h: [{ char: "e", count: 481 }, { char: "a", count: 167 }, { char: "o", count: 98 }, { char: " ", count: 45 }, { char: "t", count: 33 }],
    e: [{ char: " ", count: 623 }, { char: "n", count: 167 }, { char: "s", count: 145 }, { char: "a", count: 92 }, { char: "t", count: 71 }],
    " ": [{ char: "t", count: 356 }, { char: "a", count: 245 }, { char: "s", count: 189 }, { char: "o", count: 134 }, { char: "h", count: 88 }],
    a: [{ char: "n", count: 312 }, { char: "t", count: 198 }, { char: "s", count: 112 }, { char: " ", count: 87 }, { char: "h", count: 41 }],
    s: [{ char: " ", count: 389 }, { char: "t", count: 198 }, { char: "e", count: 167 }, { char: "o", count: 112 }, { char: "h", count: 56 }],
    o: [{ char: "n", count: 312 }, { char: "s", count: 145 }, { char: " ", count: 98 }, { char: "t", count: 64 }, { char: "h", count: 38 }],
    n: [{ char: " ", count: 401 }, { char: "e", count: 198 }, { char: "t", count: 112 }, { char: "a", count: 73 }, { char: "o", count: 41 }],
};

type Phase = "build" | "insight";

function lbl(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}

/* tint a populated cell by its count (max ~0.34 of the accent) */
function cellTint(value: number): number {
    return value > 0 ? Math.min(0.34, value / 700) : 0;
}

/**
 * Count-up odometer — eases `from`→`value` (easeOutCubic ~620ms). Every setState fires inside the RAF
 * callback (never synchronously in the effect body), so the set-state-in-effect rule stays satisfied.
 * Keyed by the consumer on `value` so a new target remounts and animates up from the previous total.
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

/* ─── Component ─── */
export const StorageProblemVisualizer = memo(function StorageProblemVisualizer() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    // The vocabulary the learner has assembled, in add-order (each char is both a row and a column).
    const [vocab, setVocab] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>("build");
    const lastAdded = vocab[vocab.length - 1];

    const v = vocab.length;
    const slots = useMemo(() => v * v, [v]); // V × V — the quadratic cost
    const prevSlots = Math.max(0, (v - 1) * (v - 1)); // so the odometer eases up from the prior square

    const addChar = useCallback((ch: string) => {
        setVocab((prev) => {
            if (prev.includes(ch)) return prev; // each char joins the vocabulary once
            return [...prev, ch];
        });
    }, []);

    const reset = useCallback(() => {
        setVocab([]);
        setPhase("build");
    }, []);

    const handleInsight = useCallback(() => setPhase("insight"), []);

    // The honest "one row" aside fans out the real followers of the most-recently-added char.
    const followers = lastAdded ? SAMPLE_FOLLOWERS[lastAdded] ?? [] : [];
    const ready = v >= 3; // enough of the lattice is felt to offer the resolution

    return (
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
            {/* ── Prompt ── */}
            <p style={labelStyle}>{t("bigramNarrative.storageProblem.pickPrompt")}</p>

            {/* ── Vocabulary picker: sunk rail, added cells filled accent ── */}
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
                    {ALPHABET.map((ch) => {
                        const added = vocab.includes(ch);
                        const isLast = lastAdded === ch;
                        return (
                            <button
                                key={ch}
                                type="button"
                                aria-pressed={added}
                                aria-label={ch === " " ? "space" : ch}
                                onClick={() => addChar(ch)}
                                style={{
                                    position: "relative",
                                    minWidth: 44,
                                    height: 44,
                                    padding: "0 12px",
                                    display: "grid",
                                    placeItems: "center",
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: 21,
                                    fontWeight: added ? 600 : 500,
                                    border: 0,
                                    borderRadius: "var(--bigram-r-sm)",
                                    cursor: added ? "default" : "pointer",
                                    background: "transparent",
                                    color: added ? "var(--bigram-on-accent)" : "var(--bigram-muted)",
                                    transition: "color .2s ease",
                                }}
                            >
                                {/* added chars carry a soft persistent fill (no riding layoutId — each STAYS) */}
                                {added && (
                                    <motion.span
                                        aria-hidden
                                        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={
                                            reduce
                                                ? { duration: 0 }
                                                : { type: "spring", stiffness: 520, damping: 32 }
                                        }
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: "var(--bigram-r-sm)",
                                            background: isLast
                                                ? "var(--bigram-accent)"
                                                : "var(--bigram-accent-2)",
                                            boxShadow: isLast
                                                ? "0 5px 14px -5px color-mix(in oklab, var(--bigram-accent) 65%, transparent)"
                                                : "none",
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

            {/* ── Idle hint ── */}
            {v === 0 && (
                <p
                    style={{
                        fontFamily: "var(--font-source-serif)",
                        fontStyle: "italic",
                        fontSize: 16,
                        color: "var(--bigram-muted)",
                        textAlign: "center",
                        margin: "16px 0 0",
                    }}
                >
                    {t("bigramNarrative.storageProblem.figureHint")}
                </p>
            )}

            {/* ── THE HERO — the V×V lattice + the focal odometer ── */}
            <AnimatePresence>
                {v > 0 && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, ease: STD_EASE }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            marginTop: 26,
                        }}
                    >
                        {/* a char is both a START (row) and a FOLLOWER (column) — inlined connective copy */}
                        <p
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11,
                                letterSpacing: ".14em",
                                textTransform: "uppercase",
                                color: "var(--bigram-muted)",
                                margin: "0 0 14px",
                                textAlign: "center",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.charsExplored", { count: v })}
                            <span style={{ color: "var(--bigram-dim)", margin: "0 8px" }}>·</span>
                            <span style={{ color: "var(--bigram-accent-ink)" }}>{v}</span> rows ×{" "}
                            <span style={{ color: "var(--bigram-accent-ink)" }}>{v}</span> cols
                        </p>

                        <Lattice vocab={vocab} reduce={!!reduce} />

                        {/* the focal number — framed as the quadratic V × V, the odometer as its result */}
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                gap: 12,
                                margin: "24px 0 0",
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            <span style={{ fontSize: 18, color: "var(--bigram-muted)" }}>
                                {v} × {v} =
                            </span>
                            <span
                                style={{
                                    fontFamily: "var(--font-playfair)",
                                    fontSize: "clamp(34px, 6vw, 52px)",
                                    fontWeight: 600,
                                    lineHeight: 1,
                                    color: "var(--bigram-accent-ink)",
                                }}
                            >
                                <Odometer key={slots} value={slots} from={prevSlots} animate={!reduce} />
                            </span>
                        </div>
                        {/* caption — names what the focal number counts (key carries "{total} slots…"; the
                            {total} placeholder is stripped because the figure above already states it) */}
                        <p
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11,
                                letterSpacing: ".18em",
                                textTransform: "uppercase",
                                color: "var(--bigram-muted)",
                                margin: "10px 0 0",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.slotsTotal", { total: "" })
                                .replace("{total}", "")
                                .trim()}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── The honest "one row" aside — why a single char already costs V cells ── */}
            <AnimatePresence mode="wait">
                {lastAdded && phase === "build" && (
                    <motion.div
                        key={lastAdded}
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.28, ease: STD_EASE }}
                        style={{ marginTop: 26 }}
                    >
                        <p style={{ ...labelStyle, margin: "0 0 10px" }}>
                            {t("bigramNarrative.storageProblem.afterChar", { char: lbl(lastAdded) })}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center",
                                gap: 8,
                                padding: "16px 16px",
                                borderRadius: "var(--bigram-r-lg)",
                                background:
                                    "color-mix(in oklab, var(--bigram-surface) 55%, var(--bigram-bg))",
                            }}
                        >
                            {followers.map((f, i) => (
                                <motion.span
                                    key={f.char}
                                    initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        delay: reduce ? 0 : i * 0.045,
                                        duration: 0.26,
                                        ease: STD_EASE,
                                    }}
                                    style={chipStyle}
                                >
                                    {lbl(f.char)}
                                </motion.span>
                            ))}
                            <motion.span
                                initial={reduce ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: reduce ? 0 : followers.length * 0.045 + 0.05 }}
                                style={ghostChipStyle}
                            >
                                +{VOCAB_SIZE - followers.length}{" "}
                                {t("bigramNarrative.storageProblem.moreFollowers")}
                            </motion.span>
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
                            {t("bigramNarrative.storageProblem.needSlots", {
                                char: lbl(lastAdded),
                                count: VOCAB_SIZE,
                            })}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── The realization + the single resolution affordance ── */}
            <AnimatePresence>
                {ready && phase === "build" && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.34, ease: STD_EASE }}
                        style={{ textAlign: "center", marginTop: 28 }}
                    >
                        <p
                            style={{
                                fontFamily: "var(--font-source-serif)",
                                fontSize: 18,
                                lineHeight: 1.55,
                                color: "var(--bigram-body)",
                                maxWidth: "46ch",
                                margin: "0 auto 18px",
                                textWrap: "pretty",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.growingRealization", {
                                count: v,
                                slots: slots.toLocaleString(),
                                total: VOCAB_SIZE,
                            })}
                        </p>
                        <button type="button" onClick={handleInsight} style={ctaStyle}>
                            {t("bigramNarrative.storageProblem.howToOrganize")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── The resolution — a calm sage takeaway: it IS a transition table ── */}
            <AnimatePresence>
                {phase === "insight" && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.42, ease: STD_EASE }}
                        style={{ marginTop: 30 }}
                    >
                        <div
                            style={{
                                padding: "22px 24px",
                                borderRadius: "var(--bigram-r-lg)",
                                background:
                                    "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
                                boxShadow:
                                    "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 32%, transparent)",
                                textAlign: "center",
                            }}
                        >
                            <p
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: 10.5,
                                    letterSpacing: ".2em",
                                    textTransform: "uppercase",
                                    color: "var(--bigram-sage)",
                                    margin: "0 0 12px",
                                }}
                            >
                                {t("bigramNarrative.storageProblem.insightTitle")}
                            </p>
                            <p
                                style={{
                                    fontFamily: "var(--font-source-serif)",
                                    fontSize: 18,
                                    lineHeight: 1.6,
                                    color: "var(--bigram-ink)",
                                    maxWidth: "48ch",
                                    margin: "0 auto",
                                    textWrap: "pretty",
                                }}
                            >
                                {t("bigramNarrative.storageProblem.insightDesc")}
                            </p>
                        </div>

                        <p
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11.5,
                                letterSpacing: ".06em",
                                color: "var(--bigram-muted)",
                                textAlign: "center",
                                margin: "20px 0 0",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {t("bigramNarrative.storageProblem.fullSize", {
                                size: VOCAB_SIZE,
                                total: TOTAL_CELLS.toLocaleString(),
                            })}
                        </p>

                        <div style={{ textAlign: "center", marginTop: 18 }}>
                            <button type="button" onClick={reset} style={replayStyle}>
                                ↻ {t("bigramNarrative.storageProblem.pickPrompt")}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/* ─── The V×V lattice ───
   Rows = starting char, columns = next char. Each char in the vocabulary seeds BOTH axes at once, so
   adding the n-th char drops in a full new row AND a full new column — the cross that makes the V²
   growth physical. Cells on real follower pairs tint by count; a trailing "…" stands in for the rest
   of the alphabet so we never pretend the grid is only this wide. Cells cascade in by Chebyshev
   distance from the corner, so each new char's row+column sweep in together. */
const Lattice = memo(function Lattice({ vocab, reduce }: { vocab: string[]; reduce: boolean }) {
    const { t } = useI18n();
    const n = vocab.length;

    return (
        <div
            role="img"
            aria-label={t("bigramNarrative.storageProblem.insightTitle")}
            style={{
                display: "inline-grid",
                gridTemplateColumns: `26px repeat(${n}, ${CELL}px) 26px`,
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 12,
                fontVariantNumeric: "tabular-nums",
                background: "var(--bigram-bg-2)",
                borderRadius: "var(--bigram-r-md)",
                padding: 10,
                boxShadow: "inset 0 1px 4px rgba(0,0,0,.26)",
                rowGap: 3,
                columnGap: 3,
            }}
        >
            {/* corner glyph */}
            <div style={{ ...cellBase, color: "var(--bigram-dim)", fontSize: 10 }}>↓→</div>
            {/* column headers (next char) */}
            {vocab.map((c) => (
                <div key={`col-${c}`} style={{ ...headStyle, color: "var(--bigram-accent-ink)" }}>
                    {lbl(c)}
                </div>
            ))}
            <div style={{ ...headStyle, color: "var(--bigram-dim)" }}>…</div>

            {/* body rows */}
            {vocab.map((r, ri) => (
                <Row key={`row-${r}`} r={r} ri={ri} vocab={vocab} reduce={reduce} />
            ))}

            {/* trailing "…" row — the rest of the alphabet we are not drawing */}
            <div style={{ ...headStyle, color: "var(--bigram-dim)" }}>…</div>
            {vocab.map((c) => (
                <div key={`tail-${c}`} style={{ ...cellBase, color: "var(--bigram-dim)" }}>
                    …
                </div>
            ))}
            <div style={{ ...cellBase, color: "var(--bigram-dim)" }} />
        </div>
    );
});

/* one lattice row: header cell + count cells, each fading in on a Chebyshev-distance cascade */
const Row = memo(function Row({
    r,
    ri,
    vocab,
    reduce,
}: {
    r: string;
    ri: number;
    vocab: string[];
    reduce: boolean;
}) {
    return (
        <>
            <div style={{ ...headStyle, color: "var(--bigram-accent-ink)" }}>{lbl(r)}</div>
            {vocab.map((c, ci) => {
                const val = SAMPLE_FOLLOWERS[r]?.find((f) => f.char === c)?.count ?? 0;
                const tint = cellTint(val);
                // cascade by distance from the top-left corner so each new char's L-shape lands together
                const ring = Math.max(ri, ci);
                return (
                    <motion.div
                        key={`${r}-${c}`}
                        initial={reduce ? false : { opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            delay: reduce ? 0 : ring * 0.05 + Math.abs(ri - ci) * 0.012,
                            duration: 0.28,
                            ease: STD_EASE,
                        }}
                        style={{
                            ...cellBase,
                            background:
                                val > 0
                                    ? `color-mix(in oklab, var(--bigram-accent) ${(tint * 100).toFixed(0)}%, var(--bigram-elev))`
                                    : "var(--bigram-elev)",
                            color: val > 0 ? "var(--bigram-ink)" : "var(--bigram-dim)",
                            fontWeight: val > 0 ? 600 : 400,
                            fontSize: val > 0 ? 11 : 12,
                        }}
                    >
                        {val > 0 ? val : "·"}
                    </motion.div>
                );
            })}
            {/* row tail — the columns we are not drawing */}
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
    margin: "0 0 14px",
    textAlign: "center",
};

const chipStyle: React.CSSProperties = {
    display: "inline-grid",
    placeItems: "center",
    minWidth: 30,
    height: 30,
    padding: "0 8px",
    borderRadius: "var(--bigram-r-sm)",
    background: "var(--bigram-accent-soft)",
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--bigram-accent-ink)",
};

const ghostChipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "0 12px",
    height: 30,
    borderRadius: "var(--bigram-r-pill)",
    boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 11.5,
    letterSpacing: ".04em",
    color: "var(--bigram-dim)",
    whiteSpace: "nowrap",
};

const ctaStyle: React.CSSProperties = {
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
};

const replayStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "var(--font-jetbrains-mono)",
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

const cellBase: React.CSSProperties = {
    height: CELL,
    display: "grid",
    placeItems: "center",
    borderRadius: 6,
    textAlign: "center",
};

const headStyle: React.CSSProperties = {
    ...cellBase,
    fontWeight: 600,
};
