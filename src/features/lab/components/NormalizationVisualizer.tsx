"use client";

import {
    memo,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Verdict } from "@/features/lab/components/bigram/Verdict";
import {
    dchar,
    MATRIX_27_COUNTS,
    rowTotal,
    T_INDEX,
    topFollowers,
} from "@/features/lab/data/bigramShakespeare27";
import { useI18n } from "@/i18n/context";

/**
 * NormalizationVisualizer — §4 of the Bigram chapter (editorial-green).
 *
 * ONE concept: *take THE ROW — the row of counts for what follows «t» (the very row VIS 4 just built) —
 * and turn raw counts into probabilities by dividing the whole row by its total.* Conservation of mass:
 * nothing is added or removed; the same row is re-expressed as fractions of the whole.
 *
 * The «t» row is a PERSISTENT, BIGGER hero — a strip of labelled follower cells that stays on screen the
 * whole time as the clear protagonist. The normalization visibly acts ON that strip: each cell's value
 * morphs counts → % as you move through the three lenses, while its fill (the share of the whole) never
 * changes — only the units do.
 *
 *   1 · COUNTS    — the hero strip reads raw integer counts; a sunk denominator line states the total.
 *   2 · DIVIDE    — the focal moment: ONE unity bar (the whole row = the total) splits into proportional
 *                   slices, anchored by the `count(t→•) ⁄ total` formula well. Inspect a slice to read its
 *                   `count ÷ total = pct`. The hero strip above shows the same act mid-flight (count→%).
 *   3 · PROBABILITIES — the hero strip now reads percentages; the winner glows; a plain-language Verdict closes.
 *
 * Real data: the «t» row of the shared 27×27 Shakespeare matrix (`bigramShakespeare27`) — byte-identical
 * to the row VIS 4 counts live. total = 19763; top follower h = 7071 (35.8 %).
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 */

const EXAMPLE_CHAR = "t";
const TOP_K = 8; // top followers shown in detail; the long tail is a single "…" rest cell
const EASE = [0.2, 0.8, 0.2, 1] as const;

/* ─── Real data — the «t» row, derived once from the shared matrix ─── */
const TOTAL = rowTotal(T_INDEX); // 19763
const TOP = topFollowers(T_INDEX, TOP_K); // [{idx,count,prob}] biggest first — h, ␣, o, e, …

interface Follower {
    idx: number;
    glyph: string; // display glyph (space → ␣)
    isSpace: boolean;
    count: number;
    fraction: number;
}

const FOLLOWERS: Follower[] = TOP.map((f) => ({
    idx: f.idx,
    glyph: dchar(f.idx),
    isSpace: f.idx === 0,
    count: f.count,
    fraction: f.prob,
}));

const WINNER = FOLLOWERS[0]; // "h" — the highest-count follower
// share of the row covered by the detailed top-K; the remainder is the long tail
const TOP_COUNT = FOLLOWERS.reduce((s, f) => s + f.count, 0);
const REST_COUNT = TOTAL - TOP_COUNT;
const REST_FRACTION = REST_COUNT / TOTAL;

type Step = 0 | 1 | 2;

/* ─── Step labels (i18n keys for the segmented control) ─── */
const STEP_LABELS = [
    "bigramNarrative.normalizationViz.step1Title",
    "bigramNarrative.normalizationViz.step2Title",
    "bigramNarrative.normalizationViz.step3Title",
] as const;

function fmtPct(fraction: number): string {
    return `${(fraction * 100).toFixed(1)}`;
}

/* ─── The FULL «t» row in fixed order [space, a..z] — the 27 columns, exactly like §2 / VIS 4. ─── */
const ROW_27 = MATRIX_27_COUNTS[T_INDEX];
const MAX_27 = Math.max(1, ...ROW_27);
const WINNER_27 = (() => {
    let w = 0;
    for (let i = 1; i < ROW_27.length; i++) if (ROW_27[i] > ROW_27[w]) w = i;
    return w;
})();

/** Heat ramp — identical to VIS 4: empty → bg-2, hot → accent-bright, sqrt-lifted. */
function heat(p: number): string {
    if (p <= 0) return "var(--bigram-bg-2)";
    const pct = (Math.pow(p, 0.6) * 100).toFixed(1);
    return `color-mix(in oklab, var(--bigram-accent-bright) ${pct}%, var(--bigram-bg-2))`;
}
/** Compact count: 7071 → "7.1k". */
function abbr(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ─── Component ─── */
export const NormalizationVisualizer = memo(function NormalizationVisualizer() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [step, setStep] = useState<Step>(0);
    // which slice of the unity bar (step 1) is being inspected; -1 = none (then "= 100%" reads)
    const [activeSlice, setActiveSlice] = useState(-1);

    const selectStep = useCallback((next: Step) => {
        setStep(next);
        setActiveSlice(-1);
    }, []);

    // Step 1 auto-tour: gently walk the inspector across each slice once, then rest on the whole.
    const tourRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    useEffect(() => {
        tourRef.current.forEach(clearTimeout);
        tourRef.current = [];
        // The auto-tour is the only thing scheduled here; activeSlice is reset to -1 by selectStep on
        // every step change, so the reduced-motion path simply skips scheduling (no synchronous setState
        // in the effect body).
        if (step !== 1 || reduce) return;
        const SLICE_MS = 460;
        const FIRST_MS = 720; // let the unity bar split first
        FOLLOWERS.forEach((_, i) => {
            tourRef.current.push(
                setTimeout(() => setActiveSlice(i), FIRST_MS + i * SLICE_MS)
            );
        });
        tourRef.current.push(
            setTimeout(() => setActiveSlice(-1), FIRST_MS + FOLLOWERS.length * SLICE_MS)
        );
        return () => {
            tourRef.current.forEach(clearTimeout);
            tourRef.current = [];
        };
    }, [step, reduce]);

    return (
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
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

            {/* ── THE HERO: the «t» row, persistent across all three steps. It never unmounts — the
                normalization visibly acts ON it as the step changes (counts → divide → %). ── */}
            <TRowHero
                step={step}
                activeSlice={activeSlice}
                reduce={!!reduce}
                rowLabel={t("bigramNarrative.normalizationViz.theRowLabel")}
                totalLabel={t("bigramNarrative.normalizationViz.totalLabel", {
                    char: EXAMPLE_CHAR,
                })}
                sumLabel={t("bigramNarrative.normalizationViz.sumLabel")}
            />

            {/* ── Step picker — segmented control: sunk rail, active cell filled accent ── */}
            <div style={{ textAlign: "center", marginTop: 30 }}>
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

            {/* ── Stage — per-step detail under the persistent hero; one focal point per phase ── */}
            <div style={{ marginTop: 24, minHeight: 264 }}>
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <PhaseShell key="counts" reduce={reduce}>
                            <PhaseCaption
                                text={t("bigramNarrative.normalizationViz.step1Desc", {
                                    char: EXAMPLE_CHAR,
                                })}
                            />
                            <TotalLine
                                label={t("bigramNarrative.normalizationViz.totalLabel", {
                                    char: EXAMPLE_CHAR,
                                })}
                                value={TOTAL.toLocaleString()}
                            />
                        </PhaseShell>
                    )}

                    {step === 1 && (
                        <PhaseShell key="divide" reduce={reduce}>
                            <PhaseCaption
                                text={t("bigramNarrative.normalizationViz.step2Desc")}
                            />
                            <UnityBar
                                activeSlice={activeSlice}
                                onInspect={setActiveSlice}
                                reduce={!!reduce}
                                totalLabel={t("bigramNarrative.normalizationViz.sumLabel")}
                                formulaNumerator={t(
                                    "bigramNarrative.normalizationViz.step2Formula",
                                    { char: EXAMPLE_CHAR, next: "x" }
                                )}
                                formulaDenominator={t(
                                    "bigramNarrative.normalizationViz.step2Total"
                                )}
                            />
                        </PhaseShell>
                    )}

                    {step === 2 && (
                        <PhaseShell key="probs" reduce={reduce}>
                            <PhaseCaption
                                text={t("bigramNarrative.normalizationViz.step3Desc", {
                                    total: TOTAL.toLocaleString(),
                                })}
                            />
                            <motion.div
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: reduce ? 0 : 0.2,
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
                                            char={dchar(T_INDEX)}
                                            best={WINNER.glyph}
                                        />
                                    }
                                    sub={t("bigramNarrative.corpusCounting.verdictSub", {
                                        n: WINNER.count.toLocaleString(),
                                        total: TOTAL.toLocaleString(),
                                        pct: `${fmtPct(WINNER.fraction)}%`,
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

/* ─────────────────────────────────────────────────────────────────────────────
   THE HERO — the persistent, bigger «t» row.

   A single horizontal strip of follower cells (the top followers of «t», biggest first), plus one quiet
   "rest" cell for the long tail and one trailing total cap. It NEVER unmounts: as the step changes, each
   cell's VALUE morphs (count → % ) while its fill height — the cell's share of the whole — stays put.
   That is the lesson made literal: same row, same proportions, re-expressed as fractions of the total.
   ───────────────────────────────────────────────────────────────────────────── */
const TRowHero = memo(function TRowHero({
    step,
    activeSlice,
    reduce,
    rowLabel,
    totalLabel,
    sumLabel,
}: {
    step: Step;
    activeSlice: number;
    reduce: boolean;
    rowLabel: string;
    totalLabel: string;
    sumLabel: string;
}) {
    const [hoverCol, setHoverCol] = useState(-1);
    const asPct = step === 2;
    // step 1 reads the denominator (we're dividing by it); steps 0/2 read the total / sum.
    const footLabel = step === 1 ? totalLabel : asPct ? sumLabel : totalLabel;
    const footValue = asPct ? "100.0 %" : TOTAL.toLocaleString();
    // which column reads "hot": the hovered one, else the step-1 toured follower, else the winner (h)
    const tourCol = step === 1 && activeSlice >= 0 ? FOLLOWERS[activeSlice].idx : -1;
    const hiCol = hoverCol >= 0 ? hoverCol : tourCol >= 0 ? tourCol : WINNER_27;

    return (
        <div>
            {/* row caption — the protagonist, named */}
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 14,
                    marginBottom: 12,
                }}
            >
                <span
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 11,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                        color: "var(--bigram-dim)",
                    }}
                >
                    {rowLabel}
                </span>
                <span
                    aria-hidden
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 17,
                        fontWeight: 700,
                        color: "var(--bigram-accent)",
                        letterSpacing: ".04em",
                    }}
                >
                    {EXAMPLE_CHAR} →
                </span>
            </div>

            {/* THE ROW — the full 27 fixed columns (space, a–z) + the heat row, exactly like §2 / VIS 4.
                Bars never reorder; the winner (h) glows; hover any slot to inspect it. The printed value
                over each tall bar morphs counts → % as you move through the steps. */}
            <div
                role="img"
                aria-label={`the row of followers of ${EXAMPLE_CHAR}, ${
                    asPct ? "as probabilities" : "as counts"
                }`}
            >
                <div className="nv-bars">
                    {ROW_27.map((count, ci) => {
                        const prob = count / TOTAL;
                        const h = (count / MAX_27) * 90; // headroom up top for the value
                        const val = asPct ? `${fmtPct(prob)}%` : abbr(count);
                        return (
                            <div
                                key={ci}
                                className="nv-bar"
                                data-win={ci === WINNER_27 && count > 0 ? "1" : "0"}
                                data-hover={ci === hiCol && ci !== WINNER_27 ? "1" : "0"}
                                onMouseEnter={() => setHoverCol(ci)}
                                onMouseLeave={() => setHoverCol(-1)}
                            >
                                {h >= 6 && count > 0 && (
                                    <span className="nv-barnum" style={{ bottom: `${h}%` }}>
                                        {val}
                                    </span>
                                )}
                                <motion.span
                                    className="nv-barfill"
                                    initial={reduce ? false : { height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={reduce ? { duration: 0 } : { duration: 0.55, ease: EASE }}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="nv-heatrow">
                    {ROW_27.map((count, ci) => (
                        <span
                            key={ci}
                            className="nv-heatcell"
                            data-win={ci === WINNER_27 && count > 0 ? "1" : "0"}
                            data-hover={ci === hiCol && ci !== WINNER_27 ? "1" : "0"}
                            style={{ background: heat(count / MAX_27) }}
                            onMouseEnter={() => setHoverCol(ci)}
                            onMouseLeave={() => setHoverCol(-1)}
                            title={`${EXAMPLE_CHAR} → ${dchar(ci)}: ${count.toLocaleString()}`}
                        />
                    ))}
                </div>
                <div className="nv-heataxis" aria-hidden>
                    {ROW_27.map((_, ci) => (
                        <span key={ci} className="nv-heatlbl" data-hi={ci === hiCol ? "1" : "0"}>
                            {dchar(ci)}
                        </span>
                    ))}
                </div>

                <style>{`
                    .nv-bars { display: grid; grid-template-columns: repeat(27, 1fr); gap: 3px; align-items: end; height: 150px; width: 100%; margin: 0 auto 5px; }
                    .nv-bar { position: relative; height: 100%; display: flex; align-items: flex-end; min-width: 0; cursor: default; }
                    .nv-barfill { width: 100%; border-radius: 3px 3px 0 0; min-height: 2px; background: color-mix(in oklab, var(--bigram-accent) 46%, transparent); transition: background .2s ease; }
                    .nv-bar[data-win="1"] .nv-barfill { background: var(--bigram-accent-bright); }
                    .nv-bar[data-hover="1"] .nv-barfill { background: var(--bigram-accent); }
                    .nv-barnum { position: absolute; left: -6px; right: -6px; text-align: center; font-family: var(--font-jetbrains-mono); font-size: 9px; line-height: 1; color: var(--bigram-muted); font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; transform: translateY(-3px); transition: color .2s ease; }
                    .nv-bar[data-win="1"] .nv-barnum { color: var(--bigram-accent-ink); font-weight: 700; }
                    .nv-bar[data-hover="1"] .nv-barnum { color: var(--bigram-accent-ink); }
                    .nv-heatrow { display: grid; grid-template-columns: repeat(27, 1fr); gap: 3px; width: 100%; margin: 0 auto; }
                    .nv-heatcell { aspect-ratio: 1; border-radius: 3px; transition: background .25s ease, box-shadow .15s ease; cursor: default; }
                    .nv-heatcell[data-win="1"] { box-shadow: inset 0 0 0 1.5px var(--bigram-accent-bright); }
                    .nv-heatcell[data-hover="1"] { box-shadow: inset 0 0 0 1.5px var(--bigram-accent-ink); }
                    .nv-heataxis { display: grid; grid-template-columns: repeat(27, 1fr); gap: 3px; width: 100%; margin: 6px auto 0; }
                    .nv-heatlbl { font-family: var(--font-jetbrains-mono); font-size: 9px; line-height: 1; color: var(--bigram-dim); text-align: center; transition: color .15s ease; }
                    .nv-heatlbl[data-hi="1"] { color: var(--bigram-accent-ink); font-weight: 700; }
                `}</style>
            </div>

            {/* the denominator / sum, stated plainly under the row — the thing we divide by */}
            <div
                style={{
                    marginTop: 14,
                    paddingTop: 12,
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
                        fontSize: 14.5,
                        color: "var(--bigram-muted)",
                    }}
                >
                    {footLabel}
                </span>
                <span
                    style={{
                        position: "relative",
                        display: "inline-grid",
                        justifyItems: "end",
                    }}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={footValue}
                            initial={reduce ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                            transition={{ duration: 0.26, ease: EASE }}
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 20,
                                fontWeight: 700,
                                color: asPct
                                    ? "var(--bigram-sage)"
                                    : "var(--bigram-ink)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {footValue}
                        </motion.span>
                    </AnimatePresence>
                </span>
            </div>
        </div>
    );
});


/* ─── Phase wrapper — uniform enter/exit so the detail under the hero morphs rather than hard-cutting ─── */
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

/* ─── Step 0 total line — the denominator, stated plainly in a hairline well ─── */
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
            transition={{ delay: 0.25, duration: 0.4 }}
            style={{
                marginTop: 22,
                padding: "16px 20px",
                borderRadius: "var(--bigram-r-md)",
                background: "var(--bigram-bg-2)",
                boxShadow:
                    "inset 0 1px 0 0 color-mix(in oklab, var(--bigram-ink) 6%, transparent)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 14,
                maxWidth: 360,
                margin: "22px auto 0",
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

/* ─── Step 1 — the unity bar: the whole row (the total) splits into proportional slices. ───
   The focal teaching moment: ONE bar = 100 % of the transitions, divided into named parts. Conservation
   of mass — the bar never changes size; the division only re-expresses it. Inspect a slice (hover / tap /
   auto-tour) to read its `count ÷ total = pct`. Uses the SAME real followers as the hero strip. */
const UnityBar = memo(function UnityBar({
    activeSlice,
    onInspect,
    reduce,
    totalLabel,
    formulaNumerator,
    formulaDenominator,
}: {
    activeSlice: number;
    onInspect: (i: number) => void;
    reduce: boolean;
    totalLabel: string;
    formulaNumerator: string;
    formulaDenominator: string;
}) {
    const active = activeSlice >= 0 ? FOLLOWERS[activeSlice] : null;

    // Live numerator: at rest the formula is symbolic (count(t→x)); inspecting a slice resolves the
    // generic "x" to that follower's glyph, so the algebra and the bar read as one object.
    const liveNumerator = active
        ? formulaNumerator.replace("x", active.glyph)
        : formulaNumerator;

    // include the long-tail as a final quiet slice so the bar truly sums to the whole
    const slices = [
        ...FOLLOWERS.map((f, i) => ({ key: String(f.idx), glyph: f.glyph, isSpace: f.isSpace, fraction: f.fraction, interactiveIndex: i })),
        { key: "rest", glyph: "…", isSpace: false, fraction: REST_FRACTION, interactiveIndex: -1 },
    ];

    return (
        <div style={{ marginTop: 26 }}>
            {/* the unity bar — single track, slices grow from 0 to their share, staggered */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    width: "100%",
                    height: 52,
                    borderRadius: "var(--bigram-r-md)",
                    overflow: "hidden",
                    background: "var(--bigram-bg-2)",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,.30)",
                }}
            >
                {slices.map((s, i) => {
                    const interactive = s.interactiveIndex >= 0;
                    const isActive = interactive && activeSlice === s.interactiveIndex;
                    const dim = activeSlice >= 0 && !isActive;
                    return (
                        <motion.button
                            key={s.key}
                            type="button"
                            disabled={!interactive}
                            aria-label={
                                interactive
                                    ? `${s.isSpace ? "space" : s.glyph}: ${(
                                          s.fraction * 100
                                      ).toFixed(1)} percent`
                                    : `the rest: ${(s.fraction * 100).toFixed(1)} percent`
                            }
                            onMouseEnter={
                                interactive ? () => onInspect(s.interactiveIndex) : undefined
                            }
                            onFocus={
                                interactive ? () => onInspect(s.interactiveIndex) : undefined
                            }
                            onClick={
                                interactive ? () => onInspect(s.interactiveIndex) : undefined
                            }
                            initial={reduce ? false : { flexGrow: 0, opacity: 0 }}
                            animate={{ flexGrow: s.fraction, opacity: 1 }}
                            transition={
                                reduce
                                    ? { duration: 0 }
                                    : {
                                          flexGrow: { duration: 0.7, ease: EASE, delay: 0.1 + i * 0.07 },
                                          opacity: { duration: 0.3, delay: 0.1 + i * 0.07 },
                                      }
                            }
                            style={{
                                flexBasis: 0,
                                position: "relative",
                                height: "100%",
                                border: 0,
                                cursor: interactive ? "pointer" : "default",
                                padding: 0,
                                // alternating accent depth so adjacent slices read apart without extra chrome;
                                // the long tail is the quiet "everything else" wash
                                background: !interactive
                                    ? "color-mix(in oklab, var(--bigram-accent-2) 36%, transparent)"
                                    : i % 2 === 0
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
                                animate={{ opacity: s.fraction > 0.06 ? 1 : 0 }}
                                transition={{ delay: reduce ? 0 : 0.5 + i * 0.07, duration: 0.3 }}
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: s.isSpace ? 12 : 16,
                                    fontWeight: 700,
                                    color: interactive
                                        ? "var(--bigram-on-accent)"
                                        : "var(--bigram-dim)",
                                    lineHeight: 1,
                                    pointerEvents: "none",
                                }}
                            >
                                {s.glyph}
                            </motion.span>
                        </motion.button>
                    );
                })}
            </div>

            {/* the rule made literal — the `.formula` well: every slice is count(t→•) over the total.
                Symbolic at rest; the numerator resolves to the inspected follower's glyph on hover. */}
            <div
                style={{
                    margin: "22px auto 0",
                    maxWidth: 320,
                    padding: "16px 20px",
                    borderRadius: "var(--bigram-r-md)",
                    background: "var(--bigram-bg-2)",
                    boxShadow:
                        "inset 0 1px 0 0 color-mix(in oklab, var(--bigram-ink) 6%, transparent)",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1.25,
                    }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={liveNumerator}
                            initial={reduce ? false : { opacity: 0, y: 3 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -3 }}
                            transition={{ duration: 0.18 }}
                            style={{
                                fontSize: 15,
                                color: active
                                    ? "var(--bigram-accent-ink)"
                                    : "var(--bigram-accent)",
                                padding: "0 8px",
                            }}
                        >
                            {liveNumerator}
                        </motion.span>
                    </AnimatePresence>
                    <span
                        aria-hidden
                        style={{
                            display: "block",
                            width: "100%",
                            height: 1,
                            margin: "5px 0",
                            background: "var(--bigram-rule-2)",
                        }}
                    />
                    <span style={{ fontSize: 15, color: "var(--bigram-muted)" }}>
                        {formulaDenominator}
                    </span>
                </div>
            </div>

            {/* the inspector readout — `count ÷ total = pct` for the active slice, else "= 100 %" ── */}
            <div
                style={{
                    marginTop: 20,
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
                                flexWrap: "wrap",
                                justifyContent: "center",
                            }}
                        >
                            <span style={{ fontSize: 19, fontWeight: 700, color: "var(--bigram-ink)" }}>
                                {active.count.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 16, color: "var(--bigram-dim)" }}>÷</span>
                            <span style={{ fontSize: 19, color: "var(--bigram-muted)" }}>
                                {TOTAL.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 16, color: "var(--bigram-dim)" }}>=</span>
                            <span
                                style={{
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: "var(--bigram-accent-ink)",
                                }}
                            >
                                {fmtPct(active.fraction)}
                                {" "}%
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
                                100{" "}%
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
