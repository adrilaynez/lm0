"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { HonestBar } from "@/features/lab/components/bigram/HonestBar";
import { Verdict } from "@/features/lab/components/bigram/Verdict";
import { useI18n } from "@/i18n/context";

/**
 * NormalizationVisualizer — §4 of the Bigram chapter (v8 · editorial-green).
 *
 * ONE concept: *turning a row of raw counts into probabilities by dividing the whole row by its total.*
 * Conservation of mass — nothing is added or removed; the same row is simply re-expressed as fractions
 * of the whole. The visual carries that idea through THREE lenses on a single persistent object (the
 * row of followers of "t"):
 *
 *   1 · COUNTS    — the raw counts as shared HonestBar rows on an honest axis (true proportions, no
 *                   normalising to 100 %); a sunk "total" line states the denominator.
 *   2 · DIVIDE    — the focal point: ONE unity bar (the whole row = the total) splits into proportional
 *                   accent slices. Hover/tap a slice to read its `count ÷ total`. This is the act of
 *                   division made literal — the whole becomes its parts without changing size.
 *   3 · PROBABILITIES — the same followers as HonestBar rows, now probabilities; winner marked `top`
 *                   (brighter, glint, count-up, last), closing with the plain-language sage Verdict.
 *
 * The step picker is a segmented control (sunk --bigram-bg-2 rail, active cell filled accent). The
 * surrounding figure chrome / label / hint come from FigureWrapper in BigramNarrative — this component
 * renders only the demo body.
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 */

/* ─── Data — followers of "t" (counts, deliberately summing to a clean total) ─── */
const EXAMPLE_CHAR = "t";

interface CountData {
    char: string;
    count: number;
}

const COUNTS: CountData[] = [
    { char: "h", count: 520 },
    { char: "e", count: 190 },
    { char: "i", count: 100 },
    { char: " ", count: 95 },
    { char: "o", count: 85 },
];
const TOTAL = COUNTS.reduce((sum, c) => sum + c.count, 0);
const MAX_COUNT = Math.max(...COUNTS.map((c) => c.count));

/* Honest axis for the count/probability rows: the winner's share becomes the full track, so every
   other bar reads as its true proportion of the row — never normalised so the winner alone hits 100 %. */
const WINNER_FRACTION = MAX_COUNT / TOTAL;

const SPACE_GLYPH = "␣";
const EASE = [0.2, 0.8, 0.2, 1] as const;

function displayChar(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}

type Step = 0 | 1 | 2;

/* ─── Component ─── */
export const NormalizationVisualizer = memo(function NormalizationVisualizer() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [step, setStep] = useState<Step>(0);
    // which slice of the unity bar (phase 2) is being inspected; -1 = none (then "= 100%" reads)
    const [activeSlice, setActiveSlice] = useState(-1);

    const followers = useMemo(
        () =>
            COUNTS.map((c) => ({
                char: c.char,
                count: c.count,
                fraction: c.count / TOTAL,
            })),
        []
    );

    const winner = followers[0]; // "h" — the highest-count follower

    const selectStep = useCallback((next: Step) => {
        setStep(next);
        setActiveSlice(-1);
    }, []);

    // Phase 2 auto-tour: gently walk the inspector across each slice once, then rest on the whole.
    const tourRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    useEffect(() => {
        tourRef.current.forEach(clearTimeout);
        tourRef.current = [];
        // Only the auto-tour lives here; activeSlice is reset to -1 by selectStep on every step change,
        // so the reduced-motion path simply skips scheduling (no synchronous setState in the effect body).
        if (step !== 1 || reduce) return;
        const SLICE_MS = 620;
        const FIRST_MS = 760; // let the unity bar split first
        followers.forEach((_, i) => {
            tourRef.current.push(
                setTimeout(() => setActiveSlice(i), FIRST_MS + i * SLICE_MS)
            );
        });
        tourRef.current.push(
            setTimeout(() => setActiveSlice(-1), FIRST_MS + followers.length * SLICE_MS)
        );
        return () => {
            tourRef.current.forEach(clearTimeout);
            tourRef.current = [];
        };
    }, [step, reduce, followers]);

    return (
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
            {/* ── Context line — the question this whole figure answers ── */}
            <p
                style={{
                    fontFamily: "var(--font-source-serif)",
                    fontStyle: "italic",
                    fontSize: 16,
                    lineHeight: 1.5,
                    color: "var(--bigram-muted)",
                    textAlign: "center",
                    margin: "0 0 22px",
                    textWrap: "pretty",
                }}
            >
                {t("bigramNarrative.normalizationViz.context", { char: EXAMPLE_CHAR })}
            </p>

            {/* ── Step picker — segmented control: sunk rail, active cell filled accent ── */}
            <div style={{ textAlign: "center" }}>
                <div
                    role="radiogroup"
                    aria-label="normalization step"
                    style={{
                        display: "inline-flex",
                        gap: 4,
                        padding: 5,
                        borderRadius: "var(--bigram-r-md)",
                        background: "var(--bigram-bg-2)",
                        boxShadow: "inset 0 1px 4px rgba(0,0,0,.28)",
                    }}
                >
                    {STEP_LABELS.map((labelKey, i) => {
                        const active = step === i;
                        return (
                            <button
                                key={labelKey}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => selectStep(i as Step)}
                                style={{
                                    position: "relative",
                                    padding: "9px 16px",
                                    border: 0,
                                    borderRadius: "var(--bigram-r-sm)",
                                    cursor: active ? "default" : "pointer",
                                    background: "transparent",
                                    color: active
                                        ? "var(--bigram-on-accent)"
                                        : "var(--bigram-muted)",
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: 10.5,
                                    fontWeight: active ? 600 : 500,
                                    letterSpacing: ".14em",
                                    textTransform: "uppercase",
                                    transition: "color .2s ease",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="norm-seg"
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
                                <span style={{ position: "relative", zIndex: 1 }}>
                                    {t(labelKey)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Stage — one focal point per phase, the row persists across all three ── */}
            <div style={{ marginTop: 26, minHeight: 312 }}>
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <PhaseShell key="counts" reduce={reduce}>
                            <PhaseCaption
                                text={t("bigramNarrative.normalizationViz.step1Desc", {
                                    char: EXAMPLE_CHAR,
                                })}
                            />
                            <div style={{ marginTop: 18 }}>
                                {followers.map((f) => (
                                    <CountRow
                                        key={f.char}
                                        char={f.char}
                                        count={f.count}
                                        reduce={!!reduce}
                                    />
                                ))}
                            </div>
                            <TotalLine
                                label={t("bigramNarrative.normalizationViz.totalLabel", {
                                    char: EXAMPLE_CHAR,
                                })}
                                value={String(TOTAL)}
                            />
                        </PhaseShell>
                    )}

                    {step === 1 && (
                        <PhaseShell key="divide" reduce={reduce}>
                            <PhaseCaption
                                text={t("bigramNarrative.normalizationViz.step2Desc")}
                            />
                            <UnityBar
                                followers={followers}
                                activeSlice={activeSlice}
                                onInspect={setActiveSlice}
                                reduce={!!reduce}
                                totalLabel={t("bigramNarrative.normalizationViz.sumLabel")}
                            />
                        </PhaseShell>
                    )}

                    {step === 2 && (
                        <PhaseShell key="probs" reduce={reduce}>
                            <PhaseCaption
                                text={t("bigramNarrative.normalizationViz.step3Desc", {
                                    total: String(TOTAL),
                                })}
                            />
                            <div style={{ marginTop: 18 }}>
                                <AnimatePresence>
                                    {followers.map((f, rank) => {
                                        const isWinner = rank === 0;
                                        // winner-last cascade: losers settle first, winner sweeps last
                                        const delay = reduce
                                            ? 0
                                            : (followers.length - 1 - rank) * 0.08;
                                        return (
                                            <motion.div
                                                key={f.char}
                                                initial={reduce ? false : { opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.28, ease: EASE }}
                                            >
                                                <HonestBar
                                                    src={EXAMPLE_CHAR}
                                                    dst={f.char}
                                                    value={f.fraction}
                                                    axis={WINNER_FRACTION}
                                                    top={isWinner}
                                                    glint={isWinner}
                                                    countUp
                                                    delay={delay}
                                                />
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            <motion.div
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: reduce ? 0 : 0.55,
                                    ease: EASE,
                                }}
                                style={{ marginTop: 22 }}
                            >
                                <Verdict
                                    label={t("bigramNarrative.corpusCounting.verdictLabel")}
                                    main={
                                        <VerdictSentence
                                            template={t(
                                                "bigramNarrative.corpusCounting.verdictMain"
                                            )}
                                            char={displayChar(EXAMPLE_CHAR)}
                                            best={displayChar(winner.char)}
                                        />
                                    }
                                    sub={t("bigramNarrative.corpusCounting.verdictSub", {
                                        n: winner.count,
                                        total: TOTAL,
                                        pct: `${(winner.fraction * 100).toFixed(1)}%`,
                                    })}
                                />
                            </motion.div>
                        </PhaseShell>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

/* ─── Step labels (i18n keys) ─── */
const STEP_LABELS = [
    "bigramNarrative.normalizationViz.step1Title",
    "bigramNarrative.normalizationViz.step2Title",
    "bigramNarrative.normalizationViz.step3Title",
] as const;

/* ─── Phase wrapper — uniform enter/exit so the row "morphs lens" rather than hard-cutting ─── */
const PhaseShell = memo(function PhaseShell({
    children,
    reduce,
}: {
    children: React.ReactNode;
    reduce: boolean | null;
}) {
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: EASE }}
        >
            {children}
        </motion.div>
    );
});

/* ─── Phase caption — quiet serif line explaining the current lens ─── */
const PhaseCaption = memo(function PhaseCaption({ text }: { text: string }) {
    return (
        <p
            style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: 15.5,
                lineHeight: 1.5,
                color: "var(--bigram-muted)",
                textAlign: "center",
                margin: 0,
                textWrap: "pretty",
            }}
        >
            {text}
        </p>
    );
});

/* ─── Phase 1 row — a raw count rendered like a HonestBar, but the value is the COUNT (not a %). ───
   We reuse the bar geometry/feel but show the integer count at the end, so it visually rhymes with
   the probability rows of phase 3 (same object, different lens). */
const CountRow = memo(function CountRow({
    char,
    count,
    reduce,
}: {
    char: string;
    count: number;
    reduce: boolean;
}) {
    const isSpace = char === " ";
    const targetW = (count / MAX_COUNT) * 100;
    const [shown, setShown] = useState(reduce ? count : 0);

    useEffect(() => {
        if (reduce) return;
        let cancelled = false;
        let raf = 0;
        let t0: number | null = null;
        const DUR = 620;
        const frame = (now: number) => {
            if (cancelled) return;
            if (t0 === null) t0 = now;
            const k = Math.min(1, (now - t0) / DUR);
            const eased = 1 - Math.pow(1 - k, 3);
            setShown(Math.round(eased * count));
            if (k < 1) raf = requestAnimationFrame(frame);
        };
        const timer = setTimeout(() => {
            raf = requestAnimationFrame(frame);
        }, 140);
        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            clearTimeout(timer);
        };
    }, [count, reduce]);

    return (
        <div
            role="img"
            aria-label={`${char === " " ? "space" : char} appeared ${count} times`}
            style={{
                display: "grid",
                gridTemplateColumns: "104px 1fr auto",
                alignItems: "center",
                gap: 16,
                margin: "17px 0",
            }}
        >
            {/* label = t→x pair, matching HonestBar */}
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 19,
                    fontWeight: 600,
                    color: "var(--bigram-ink)",
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 2,
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "lining-nums tabular-nums",
                }}
            >
                <span style={{ color: "var(--bigram-dim)", fontWeight: 500 }}>
                    {EXAMPLE_CHAR}
                </span>
                <span
                    style={{
                        color: "var(--bigram-dim)",
                        fontWeight: 400,
                        margin: "0 3px",
                        fontSize: 14,
                    }}
                >
                    →
                </span>
                <span
                    style={
                        isSpace
                            ? {
                                  fontSize: 12,
                                  fontWeight: 600,
                                  letterSpacing: ".03em",
                                  color: "var(--bigram-dim)",
                                  textTransform: "lowercase",
                              }
                            : { color: "var(--bigram-ink)", fontWeight: 700, fontSize: "1.05em" }
                    }
                >
                    {displayChar(char)}
                </span>
            </span>

            {/* track + fill */}
            <span
                style={{
                    position: "relative",
                    height: 12,
                    borderRadius: 6,
                    overflow: "hidden",
                    background: "color-mix(in oklab, var(--bigram-ink) 10%, transparent)",
                    display: "block",
                }}
            >
                <motion.span
                    initial={reduce ? false : { width: "0%" }}
                    animate={{ width: `${targetW}%` }}
                    transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                    style={{
                        display: "block",
                        height: "100%",
                        borderRadius: 6,
                        background: "var(--bigram-accent-2)",
                    }}
                />
            </span>

            {/* the raw count (integer, counting up) */}
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 14,
                    color: "var(--bigram-dim)",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    minWidth: 46,
                }}
            >
                {shown}
            </span>
        </div>
    );
});

/* ─── Phase 1 total line — the denominator, stated plainly in a hairline well ─── */
const TotalLine = memo(function TotalLine({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px solid var(--bigram-rule)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 14,
            }}
        >
            <span
                style={{
                    fontFamily: "var(--font-source-serif)",
                    fontSize: 15.5,
                    color: "var(--bigram-muted)",
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--bigram-ink)",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </span>
        </motion.div>
    );
});

/* ─── Phase 2 — the unity bar: the whole row (the total) splits into proportional slices. ───
   This is the focal teaching moment: ONE bar = 100 % of the transitions, divided into named parts.
   Conservation of mass — the bar never changes size; the division only re-expresses it. Inspect a
   slice (hover / tap / auto-tour) to read its `count ÷ total = pct`. */
const UnityBar = memo(function UnityBar({
    followers,
    activeSlice,
    onInspect,
    reduce,
    totalLabel,
}: {
    followers: { char: string; count: number; fraction: number }[];
    activeSlice: number;
    onInspect: (i: number) => void;
    reduce: boolean;
    totalLabel: string;
}) {
    const active = activeSlice >= 0 ? followers[activeSlice] : null;

    return (
        <div style={{ marginTop: 30 }}>
            {/* the unity bar — single track, slices grow from 0 to their share, staggered */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    width: "100%",
                    height: 56,
                    borderRadius: "var(--bigram-r-md)",
                    overflow: "hidden",
                    background: "var(--bigram-bg-2)",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,.30)",
                }}
            >
                {followers.map((f, i) => {
                    const isActive = activeSlice === i;
                    const dim = activeSlice >= 0 && !isActive;
                    return (
                        <motion.button
                            key={f.char}
                            type="button"
                            aria-label={`${f.char === " " ? "space" : f.char}: ${f.count} of ${TOTAL}, ${(
                                f.fraction * 100
                            ).toFixed(1)} percent`}
                            onMouseEnter={() => onInspect(i)}
                            onFocus={() => onInspect(i)}
                            onClick={() => onInspect(i)}
                            initial={reduce ? false : { flexGrow: 0, opacity: 0 }}
                            animate={{ flexGrow: f.fraction, opacity: 1 }}
                            transition={
                                reduce
                                    ? { duration: 0 }
                                    : {
                                          flexGrow: { duration: 0.7, ease: EASE, delay: 0.1 + i * 0.09 },
                                          opacity: { duration: 0.3, delay: 0.1 + i * 0.09 },
                                      }
                            }
                            style={{
                                flexBasis: 0,
                                position: "relative",
                                height: "100%",
                                border: 0,
                                cursor: "pointer",
                                padding: 0,
                                // alternating accent depth so adjacent slices read apart without extra chrome
                                background:
                                    i % 2 === 0
                                        ? "var(--bigram-accent-2)"
                                        : "var(--bigram-accent-deep)",
                                opacity: dim ? 0.42 : 1,
                                boxShadow: isActive
                                    ? "inset 0 0 0 2px var(--bigram-accent-bright)"
                                    : "inset -1px 0 0 0 color-mix(in oklab, var(--bigram-bg-2) 55%, transparent)",
                                transition: "opacity .25s ease, box-shadow .2s ease",
                                display: "grid",
                                placeItems: "center",
                                overflow: "hidden",
                            }}
                        >
                            {/* glyph inside the slice — fades in once the slice is wide enough to hold it */}
                            <motion.span
                                initial={reduce ? false : { opacity: 0 }}
                                animate={{ opacity: f.fraction > 0.06 ? 1 : 0 }}
                                transition={{ delay: reduce ? 0 : 0.5 + i * 0.09, duration: 0.3 }}
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: f.char === " " ? 12 : 18,
                                    fontWeight: 700,
                                    color: "var(--bigram-on-accent)",
                                    lineHeight: 1,
                                    pointerEvents: "none",
                                }}
                            >
                                {displayChar(f.char)}
                            </motion.span>
                        </motion.button>
                    );
                })}
            </div>

            {/* the inspector readout — `count ÷ total = pct` for the active slice, else "= 100 %" ── */}
            <div
                style={{
                    marginTop: 22,
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <AnimatePresence mode="wait">
                    {active ? (
                        <motion.div
                            key={`slice-${activeSlice}`}
                            initial={reduce ? false : { opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                gap: 10,
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--bigram-ink)" }}>
                                {active.count}
                            </span>
                            <span style={{ fontSize: 17, color: "var(--bigram-dim)" }}>÷</span>
                            <span style={{ fontSize: 20, color: "var(--bigram-muted)" }}>{TOTAL}</span>
                            <span style={{ fontSize: 17, color: "var(--bigram-dim)" }}>=</span>
                            <span
                                style={{
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: "var(--bigram-accent-ink)",
                                }}
                            >
                                {(active.fraction * 100).toFixed(1)}
                                {" "}%
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="whole"
                            initial={reduce ? false : { opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                gap: 10,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-source-serif)",
                                    fontSize: 15.5,
                                    color: "var(--bigram-muted)",
                                }}
                            >
                                {totalLabel}
                            </span>
                            <span
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: "var(--bigram-sage)",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                100{" "}%
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

/**
 * Renders the verdict sentence from the i18n template, replacing {char}/{best} with bold spans.
 * Verdict colours any <b> in `main` with --bigram-accent-ink, so the predicted chars read in accent.
 */
function VerdictSentence({
    template,
    char,
    best,
}: {
    template: string;
    char: string;
    best: string;
}) {
    const parts = template.split(/(\{char\}|\{best\})/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part === "{char}") return <b key={i}>{char}</b>;
                if (part === "{best}") return <b key={i}>{best}</b>;
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}
