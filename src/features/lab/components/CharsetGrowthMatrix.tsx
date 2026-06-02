"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";
import { CHARSET_TIERS } from "@/features/lab/data/bigramCorpora";

/**
 * CharsetGrowthMatrix — the "the table grows" instrument (Bigram chapter, §4 · editorial-green).
 *
 * ONE concept, made physical: *every new KIND of character you let the model predict is one more row
 * AND one more column — so widening the vocabulary widens the table in both directions at once, and
 * the number of slots grows as V².* We start with lowercase (27), then accumulate capitals, numbers
 * and punctuation. Each step drops a fresh BAND of rows and columns into a miniature matrix — the
 * L-shaped cross that lands — while a single focal ODOMETER reads "V × V = N cells" and ticks up to
 * the new square. The sage takeaway names the lesson once the growth is felt: the more you want to
 * predict, the bigger the table.
 *
 *  • the four character classes are a SEGMENTED progress rail (sunk --bigram-bg-2; reached tiers fill);
 *  • a "predict before reveal" beat: before the first growth, the learner guesses how big it gets;
 *  • advancing animates a new band of rows + columns into the grid simultaneously (the band that lands);
 *  • each class owns a tone within the accent family so the bands read as distinct strata, not noise;
 *  • the running cost is a count-up ODOMETER framed as V × V — the single focal number;
 *  • once the table has quadrupled, a calm SAGE takeaway states the resolution.
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 * Sizes come from the typed CHARSET_TIERS dataset; copy comes from `bigramNarrative.v2.charsetGrowth.*`.
 * Fully reduced-motion safe (odometer + band cascade settle instantly).
 *
 * Self-mounting: renders with no required props. `accent` is accepted for parity with the chapter's
 * opt-in convention but the component already resolves every colour under the bigram scope.
 */

/* ─── Model constants ─── */
const STD_EASE = [0.2, 0.8, 0.2, 1] as const;
const ODO_MS = 720; // dimension count-up, easeOutCubic

/**
 * Each tier maps to a small block of *representative* grid units (rows = cols). The full table would
 * be 27→92 cells per side — far too dense to draw honestly — so we draw a proportional miniature: the
 * units accumulate roughly like the real sizes (27 ≈ 7 units, +26 ≈ +6, +10 ≈ +3, +29 ≈ +7), keeping
 * the *shape* of the growth (it roughly triples) while staying legible. The real size lives in the
 * odometer; the grid is the felt-shape of it.
 */
const TIER_UNITS = [7, 13, 16, 23] as const; // cumulative grid units per tier (lower→punct)

/** Per-class accent tone: lowercase is the base accent; later bands step toward sage so strata read. */
const BAND_TONE = [
    "var(--bigram-accent)",
    "color-mix(in oklab, var(--bigram-accent) 78%, var(--bigram-sage) 30%)",
    "color-mix(in oklab, var(--bigram-accent) 55%, var(--bigram-sage) 55%)",
    "var(--bigram-sage)",
] as const;

type Step = 0 | 1 | 2 | 3; // which tiers are revealed (we open already showing lowercase)

/* size of one grid unit (px), shrinks as the grid grows so the figure never overflows */
function unitPx(units: number): number {
    if (units <= 7) return 16;
    if (units <= 13) return 12;
    if (units <= 16) return 10;
    return 8;
}

/** Which tier a grid index belongs to (so a cell knows its band tone + entrance timing). */
function bandOf(index: number): number {
    for (let b = 0; b < TIER_UNITS.length; b += 1) {
        if (index < TIER_UNITS[b]) return b;
    }
    return TIER_UNITS.length - 1;
}

/**
 * Count-up odometer — eases `from`→`value` (easeOutCubic ~720ms). setState fires only inside the RAF
 * callback (never synchronously in the effect body), so the set-state-in-effect rule stays satisfied.
 * Keyed by the consumer on `value` so a new target remounts and animates up from the previous square.
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

export interface CharsetGrowthMatrixProps {
    /** Parity with the chapter's opt-in accent convention. The component is already bigram-scoped. */
    accent?: "bigram";
}

/* ─── Component ─── */
export const CharsetGrowthMatrix = memo(function CharsetGrowthMatrix(
    _props: CharsetGrowthMatrixProps = {},
) {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    // We open already showing lowercase (step 0) so there is a table to grow FROM; the CTA then
    // accumulates capitals → numbers → punctuation, each click landing a new band of rows + columns.
    const [step, setStep] = useState<Step>(0);

    const tier = CHARSET_TIERS[step];
    const size = tier.size;
    const units = TIER_UNITS[step];
    const slots = size * size;
    const prevSlots = step > 0 ? CHARSET_TIERS[step - 1].size ** 2 : Math.max(0, (size - 1) ** 2);

    const isLast = step >= CHARSET_TIERS.length - 1;
    const canAdvance = !isLast;

    const advance = useCallback(() => {
        setStep((s) => (s < CHARSET_TIERS.length - 1 ? ((s + 1) as Step) : s));
    }, []);

    const reset = useCallback(() => {
        setStep(0);
    }, []);

    // i18n step copy lives at charsetGrowth.steps.<i>.{label,note}. The dataset carries the canonical
    // `size`; we read label/note by index from i18n (same order as CHARSET_TIERS).
    const stepLabel = useCallback(
        (i: number) => t(`bigramNarrative.v2.charsetGrowth.steps.${i}.label`),
        [t],
    );
    const stepNote = useCallback(
        (i: number) => t(`bigramNarrative.v2.charsetGrowth.steps.${i}.note`),
        [t],
    );

    const dimensions = t("bigramNarrative.v2.charsetGrowth.dimensionsLabel", {
        size: size.toString(),
    });

    return (
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
            {/* ── Eyebrow ── */}
            <p style={labelStyle}>{t("bigramNarrative.v2.charsetGrowth.label")}</p>

            {/* ── Progress rail: the four character classes, reached tiers filled ── */}
            <div style={{ textAlign: "center" }}>
                <div
                    role="group"
                    aria-label={t("bigramNarrative.v2.charsetGrowth.hint")}
                    style={{
                        display: "inline-flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 5,
                        padding: 5,
                        borderRadius: "var(--bigram-r-md)",
                        background: "var(--bigram-bg-2)",
                        boxShadow: "inset 0 1px 4px rgba(0,0,0,.28)",
                    }}
                >
                    {CHARSET_TIERS.map((ct, i) => {
                        const reached = step >= i;
                        const current = step === i;
                        return (
                            <div
                                key={ct.id}
                                aria-current={current ? "step" : undefined}
                                style={{
                                    position: "relative",
                                    minWidth: 96,
                                    padding: "9px 14px",
                                    borderRadius: "var(--bigram-r-sm)",
                                    textAlign: "center",
                                }}
                            >
                                {reached && (
                                    <motion.span
                                        aria-hidden
                                        initial={reduce ? false : { scale: 0.7, opacity: 0 }}
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
                                            background: current
                                                ? BAND_TONE[i]
                                                : `color-mix(in oklab, ${BAND_TONE[i]} 24%, transparent)`,
                                            boxShadow: current
                                                ? "0 5px 14px -6px color-mix(in oklab, var(--bigram-accent) 60%, transparent)"
                                                : "none",
                                            zIndex: 0,
                                        }}
                                    />
                                )}
                                <span
                                    style={{
                                        position: "relative",
                                        zIndex: 1,
                                        display: "block",
                                        fontFamily: "var(--font-jetbrains-mono)",
                                        fontSize: 12.5,
                                        fontWeight: reached ? 600 : 500,
                                        letterSpacing: ".02em",
                                        color: current
                                            ? "var(--bigram-on-accent)"
                                            : reached
                                              ? "var(--bigram-accent-ink)"
                                              : "var(--bigram-muted)",
                                    }}
                                >
                                    {stepLabel(i)}
                                </span>
                                <span
                                    style={{
                                        position: "relative",
                                        zIndex: 1,
                                        display: "block",
                                        marginTop: 2,
                                        fontFamily: "var(--font-jetbrains-mono)",
                                        fontSize: 10,
                                        letterSpacing: ".01em",
                                        color: current
                                            ? "color-mix(in oklab, var(--bigram-on-accent) 80%, transparent)"
                                            : "var(--bigram-dim)",
                                    }}
                                >
                                    {stepNote(i)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── THE HERO — the growing miniature matrix + the focal dimension odometer ── */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: 26,
                }}
            >
                {/* a class is both a START (row) and a FOLLOWER (column) — names the axes */}
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
                    <span style={{ color: "var(--bigram-accent-ink)" }}>{size}</span> rows ×{" "}
                    <span style={{ color: "var(--bigram-accent-ink)" }}>{size}</span> cols
                </p>

                <GrowingGrid units={units} step={step} reduce={!!reduce} />

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
                        {size} × {size} =
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
                    {dimensions}
                </p>
            </div>

            {/* ── Advance control: name the next class, then land its band of rows + columns ── */}
            <AnimatePresence>
                {canAdvance && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: STD_EASE }}
                        style={{ textAlign: "center", marginTop: 26 }}
                    >
                        {step === 0 && (
                            <p
                                style={{
                                    fontFamily: "var(--font-source-serif)",
                                    fontStyle: "italic",
                                    fontSize: 17,
                                    lineHeight: 1.55,
                                    color: "var(--bigram-body)",
                                    maxWidth: "44ch",
                                    margin: "0 auto 16px",
                                    textWrap: "pretty",
                                }}
                            >
                                {t("bigramNarrative.v2.charsetGrowth.hint")}
                            </p>
                        )}
                        <button type="button" onClick={advance} style={ctaStyle}>
                            <span style={{ opacity: 0.72, marginRight: 9 }}>
                                {stepLabel(step + 1)}
                            </span>
                            {t("bigramNarrative.v2.charsetGrowth.addNextCta")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── The resolution — a calm sage takeaway once the table has grown all the way ── */}
            <AnimatePresence>
                {isLast && (
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
                                    fontFamily: "var(--font-source-serif)",
                                    fontSize: 19,
                                    lineHeight: 1.55,
                                    color: "var(--bigram-ink)",
                                    maxWidth: "44ch",
                                    margin: "0 auto",
                                    textWrap: "pretty",
                                }}
                            >
                                {t("bigramNarrative.v2.charsetGrowth.takeaway")}
                            </p>
                        </div>

                        <div style={{ textAlign: "center", marginTop: 18 }}>
                            <button type="button" onClick={reset} style={replayStyle}>
                                ↻ {t("bigramNarrative.v2.charsetGrowth.label")}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/* ─── The growing miniature matrix ───
   Rows = starting char-class, columns = next char-class. Each tier seeds BOTH axes at once, so
   advancing a tier drops in a full new BAND of rows AND columns — the L-shape that makes the V²
   growth physical. Cells are tinted by their band's tone; cells in the newest band cascade in by
   Chebyshev distance from the corner so the row+column sweep lands together. The figure is a
   proportional miniature (see TIER_UNITS) — the honest full size lives in the odometer. */
const GrowingGrid = memo(function GrowingGrid({
    units,
    step,
    reduce,
}: {
    units: number;
    step: Step;
    reduce: boolean;
}) {
    const u = unitPx(units);
    const gap = units > 16 ? 1 : 2;
    const currentBand = step; // the band that just landed (0..3) — its cells cascade in

    // Build the index list once per `units` so the cell map stays cheap on re-render.
    const indices = useMemo(() => Array.from({ length: units }, (_, i) => i), [units]);

    return (
        <div
            role="img"
            aria-label={`${units} by ${units} grid`}
            style={{
                display: "inline-grid",
                gridTemplateColumns: `repeat(${units}, ${u}px)`,
                gridTemplateRows: `repeat(${units}, ${u}px)`,
                gap,
                padding: 10,
                borderRadius: "var(--bigram-r-md)",
                background: "var(--bigram-bg-2)",
                boxShadow: "inset 0 1px 4px rgba(0,0,0,.26)",
            }}
        >
            {indices.map((ri) =>
                indices.map((ci) => {
                    const band = Math.max(bandOf(ri), bandOf(ci)); // the L-shape owner
                    const tone = BAND_TONE[band];
                    const isNew = band === currentBand;
                    // cascade the newest band by distance from the corner so its row+column land together
                    const prevUnits = currentBand > 0 ? TIER_UNITS[currentBand - 1] : 0;
                    const ring = Math.max(ri - prevUnits, ci - prevUnits);
                    const delay = isNew && !reduce ? Math.max(0, ring) * 0.03 : 0;
                    return (
                        <motion.span
                            key={`${ri}-${ci}`}
                            initial={isNew && !reduce ? { opacity: 0, scale: 0.5 } : false}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={
                                reduce
                                    ? { duration: 0 }
                                    : { delay, duration: 0.26, ease: STD_EASE }
                            }
                            style={{
                                width: u,
                                height: u,
                                borderRadius: gap > 1 ? 3 : 2,
                                // diagonal cells read a touch brighter so the matrix reads as a matrix
                                background:
                                    ri === ci
                                        ? `color-mix(in oklab, ${tone} 88%, white 8%)`
                                        : `color-mix(in oklab, ${tone} 46%, var(--bigram-elev))`,
                            }}
                        />
                    );
                }),
            )}
        </div>
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
