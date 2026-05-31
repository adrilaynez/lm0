"use client";

import { memo, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { HonestBar } from "@/features/lab/components/bigram/HonestBar";
import { Verdict } from "@/features/lab/components/bigram/Verdict";
import type { StepDetail } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";

/**
 * StepwisePrediction — Bigram chapter, v8 editorial-green.
 *
 * ONE concept: a language model writes one character at a time, and *each prediction becomes the
 * context for the next one*. The learner watches a seed phrase grow, character by character, while
 * every step shows — honestly — how sure the model was about that single choice.
 *
 * Design (simple surface, deep execution):
 *  - No card chrome. A single faint plane marks "this is interactive" (editorial figure, spec §5).
 *  - The focal point is the growing sequence ribbon: the seed in dim ink, each new char arriving in
 *    accent, so the eye reads the sentence extending. The per-step bars are secondary evidence.
 *  - Each step is a HonestBar (src→dst pair, fixed 0.5 axis): the fill literally shows the model's
 *    certainty for that one character — never normalised to 100 %.
 *  - The chain is made visible: step N's source char IS step N−1's prediction (highlighted in the
 *    ribbon as each bar reveals), reinforcing "the output feeds back as input".
 *  - A sage Verdict closes the loop in plain language: from "<seed>" it continued with "<tail>".
 *
 * Tokens only (--bigram-*) + registered fonts; lives inside the page's [data-bigram-theme] scope.
 * Reduced-motion safe throughout (cascade collapses, glints/count-ups suppressed by HonestBar).
 */

const SPACE_GLYPH = "␣";
const STEP_STAGGER_S = 0.14; // gap between successive step reveals — paced so the chain reads
const MIN_STEPS = 1;
const MAX_STEPS = 10;

function glyph(ch: string): string {
    return ch === " " ? SPACE_GLYPH : ch;
}

/** Build the per-step rows: each row's source is the char that preceded its prediction. */
function buildChain(seed: string, steps: StepDetail[]) {
    const lastSeedChar = seed.length > 0 ? seed[seed.length - 1] : " ";
    return steps.map((s, i) => ({
        step: s.step,
        src: i === 0 ? lastSeedChar : steps[i - 1].char,
        dst: s.char,
        probability: s.probability,
    }));
}

/* ─── Section label: italic Playfair numeral + mono uppercase label + hairline rule (spec §5) ─── */
const SectionLabel = memo(function SectionLabel({
    numeral,
    label,
}: {
    numeral: string;
    label: string;
}) {
    return (
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span
                style={{
                    fontFamily: "var(--font-playfair)",
                    fontStyle: "italic",
                    fontSize: "20px",
                    color: "var(--bigram-accent)",
                    lineHeight: 1,
                    flex: "none",
                }}
            >
                {numeral}
            </span>
            {/* label wraps on narrow widths so the row never forces horizontal scroll */}
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10.5px",
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "var(--bigram-dim)",
                    lineHeight: 1.5,
                    minWidth: 0,
                }}
            >
                {label}
            </span>
            <span
                aria-hidden
                style={{
                    flex: 1,
                    minWidth: "16px",
                    alignSelf: "center",
                    height: "1px",
                    background: "var(--bigram-rule)",
                }}
            />
        </div>
    );
});

/* ─── The growing sequence ribbon — the focal point. Seed dim, predictions accent. ─── */
const SequenceRibbon = memo(function SequenceRibbon({
    seed,
    chain,
    activeIndex,
    seedLabel,
    sequenceLabel,
}: {
    seed: string;
    chain: { dst: string }[];
    activeIndex: number;
    seedLabel: string;
    sequenceLabel: string;
}) {
    const reduce = useReducedMotion();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
                <span
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: "9.5px",
                        letterSpacing: ".22em",
                        textTransform: "uppercase",
                        color: "var(--bigram-dim)",
                    }}
                >
                    {seedLabel}
                </span>
                <span style={{ color: "var(--bigram-rule-2)" }}>·</span>
                <span
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: "9.5px",
                        letterSpacing: ".22em",
                        textTransform: "uppercase",
                        color: "var(--bigram-accent-ink)",
                    }}
                >
                    {sequenceLabel}
                </span>
            </div>

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    rowGap: "6px",
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "clamp(22px, 3vw, 30px)",
                    fontWeight: 600,
                    lineHeight: 1.25,
                    letterSpacing: ".01em",
                }}
            >
                {/* seed — the text the learner gave, calm and dim */}
                {seed.split("").map((c, i) => (
                    <span
                        key={`seed-${i}`}
                        style={{
                            color: "var(--bigram-muted)",
                            whiteSpace: "pre",
                        }}
                    >
                        {c === " " ? " " : c}
                    </span>
                ))}

                {/* predictions — each one arrives in accent; the current step pulses brighter */}
                <AnimatePresence initial={false}>
                    {chain.map((step, i) => {
                        if (i > activeIndex) return null;
                        const isCurrent = i === activeIndex;
                        return (
                            <motion.span
                                key={`pred-${i}`}
                                initial={reduce ? false : { opacity: 0, y: -6, scale: 0.6 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                    color: isCurrent
                                        ? "var(--bigram-accent-bright)"
                                        : "var(--bigram-accent)",
                                }}
                                transition={
                                    reduce
                                        ? { duration: 0 }
                                        : { type: "spring", stiffness: 420, damping: 26 }
                                }
                                style={{ whiteSpace: "pre" }}
                            >
                                {step.dst === " " ? " " : step.dst}
                            </motion.span>
                        );
                    })}
                </AnimatePresence>

                {/* a soft caret while the chain is still building */}
                {activeIndex < chain.length - 1 && !reduce && (
                    <motion.span
                        aria-hidden
                        animate={{ opacity: [0.15, 0.7, 0.15] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            display: "inline-block",
                            width: "2px",
                            height: "0.95em",
                            marginLeft: "2px",
                            alignSelf: "center",
                            background: "var(--bigram-accent)",
                            borderRadius: "1px",
                        }}
                    />
                )}
            </div>
        </div>
    );
});

interface StepwisePredictionProps {
    onPredict: (text: string, steps: number) => void;
    steps: StepDetail[] | null;
    /**
     * The API's single most-likely next char after the whole sequence. Retained for API
     * compatibility, but the v8 verdict shows the *full* continuation (derived from `steps`),
     * which is the pedagogically truthful "what the model wrote", so this is no longer consumed.
     */
    finalPrediction?: string | null;
    loading: boolean;
    error: string | null;
}

export function StepwisePrediction({
    onPredict,
    steps,
    loading,
    error,
}: StepwisePredictionProps) {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [text, setText] = useState("hel");
    const [numSteps, setNumSteps] = useState(5);
    // the seed actually submitted — keeps the ribbon stable while the input is edited
    const [submittedSeed, setSubmittedSeed] = useState("hel");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        setSubmittedSeed(trimmed);
        onPredict(trimmed, numSteps);
    };

    const chain = useMemo(
        () => (steps ? buildChain(submittedSeed, steps) : []),
        [steps, submittedSeed]
    );

    // chain is fully revealed once steps arrive; the ribbon's "active" char is the last one
    const activeIndex = chain.length - 1;
    const tail = useMemo(() => chain.map((c) => c.dst).join(""), [chain]);

    const rangePct = ((numSteps - MIN_STEPS) / (MAX_STEPS - MIN_STEPS)) * 100;

    return (
        <figure
            data-console="figure"
            style={{
                margin: 0,
                borderRadius: "var(--bigram-r-lg)",
                background: "color-mix(in oklab, var(--bigram-surface) 55%, var(--bigram-bg))",
                padding: "clamp(20px, 3vw, 32px)",
                display: "flex",
                flexDirection: "column",
                gap: "26px",
            }}
        >
            {/* ── Controls: input + steps, calm and typographic (no boxes-on-boxes) ── */}
            <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
                <SectionLabel numeral="i." label={t("models.bigram.stepwise.form.input")} />

                <div style={{ display: "grid", gap: "20px" }}>
                    {/* seed input */}
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={t("models.bigram.stepwise.form.placeholder")}
                        aria-label={t("models.bigram.stepwise.form.input")}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            background: "var(--bigram-bg-2)",
                            border: "1px solid var(--bigram-rule-2)",
                            borderRadius: "var(--bigram-r-md)",
                            padding: "13px 16px",
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: "16px",
                            color: "var(--bigram-ink)",
                            outline: "none",
                            transition: "border-color .2s ease, box-shadow .2s ease",
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = "var(--bigram-accent)";
                            e.currentTarget.style.boxShadow =
                                "0 0 0 3px var(--bigram-accent-soft)";
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--bigram-rule-2)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    />

                    {/* steps slider */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                            }}
                        >
                            <label
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: "10.5px",
                                    letterSpacing: ".18em",
                                    textTransform: "uppercase",
                                    color: "var(--bigram-dim)",
                                }}
                            >
                                {t("models.bigram.stepwise.form.steps")}
                            </label>
                            <span
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    color: "var(--bigram-accent-ink)",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {numSteps}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={MIN_STEPS}
                            max={MAX_STEPS}
                            value={numSteps}
                            onChange={(e) => setNumSteps(Number(e.target.value))}
                            aria-label={t("models.bigram.stepwise.form.steps")}
                            className="bigram-stepwise-range"
                            style={{
                                width: "100%",
                                background: `linear-gradient(to right, var(--bigram-accent) 0%, var(--bigram-accent) ${rangePct}%, color-mix(in oklab, var(--bigram-ink) 12%, transparent) ${rangePct}%, color-mix(in oklab, var(--bigram-ink) 12%, transparent) 100%)`,
                            }}
                        />
                    </div>

                    {/* submit */}
                    <button
                        type="submit"
                        disabled={loading || !text.trim()}
                        style={{
                            width: "100%",
                            border: "none",
                            borderRadius: "var(--bigram-r-md)",
                            padding: "13px 16px",
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: "11.5px",
                            letterSpacing: ".18em",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            cursor: loading || !text.trim() ? "default" : "pointer",
                            background: "var(--bigram-accent)",
                            color: "var(--bigram-on-accent)",
                            opacity: loading || !text.trim() ? 0.45 : 1,
                            transition: "opacity .2s ease, background .2s ease",
                        }}
                    >
                        {loading ? (
                            <motion.span
                                animate={{ opacity: [0.45, 1, 0.45] }}
                                transition={{ duration: 1.4, repeat: Infinity }}
                            >
                                {t("models.bigram.stepwise.form.predicting")}
                            </motion.span>
                        ) : (
                            t("models.bigram.stepwise.form.predict")
                        )}
                    </button>
                </div>
            </form>

            {/* ── Error ── */}
            {error && (
                <div
                    role="alert"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "var(--bigram-r-md)",
                        background: "var(--bigram-wrong-soft)",
                        boxShadow:
                            "inset 0 0 0 1px color-mix(in oklab, var(--bigram-wrong) 32%, transparent)",
                        fontFamily: "var(--font-source-serif)",
                        fontSize: "14px",
                        color: "var(--bigram-wrong)",
                    }}
                >
                    {error}
                </div>
            )}

            {/* ── Loading: ghost rows that read like the bars to come ── */}
            {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {Array.from({ length: numSteps }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={reduce ? undefined : { opacity: [0.35, 0.7, 0.35] }}
                            transition={{
                                duration: 1.4,
                                repeat: Infinity,
                                delay: i * 0.08,
                            }}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "104px 1fr auto",
                                alignItems: "center",
                                gap: "16px",
                            }}
                        >
                            <span
                                style={{
                                    height: "12px",
                                    borderRadius: "6px",
                                    background:
                                        "color-mix(in oklab, var(--bigram-ink) 8%, transparent)",
                                }}
                            />
                            <span
                                style={{
                                    height: "12px",
                                    borderRadius: "6px",
                                    width: `${70 - i * 5}%`,
                                    background:
                                        "color-mix(in oklab, var(--bigram-ink) 10%, transparent)",
                                }}
                            />
                            <span style={{ width: "46px" }} />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Results ── */}
            <AnimatePresence mode="wait">
                {steps && chain.length > 0 && !loading && (
                    <motion.div
                        key={`${submittedSeed}:${chain.length}`}
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: "flex", flexDirection: "column", gap: "26px" }}
                    >
                        {/* focal point — the growing sentence */}
                        <SequenceRibbon
                            seed={submittedSeed}
                            chain={chain}
                            activeIndex={activeIndex}
                            seedLabel={t("models.bigram.stepwise.seedLabel")}
                            sequenceLabel={t("models.bigram.stepwise.sequenceLabel")}
                        />

                        {/* per-step honest bars — the evidence behind each character */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <SectionLabel
                                numeral="ii."
                                label={t("models.bigram.stepwise.feedsNext")}
                            />
                            <div style={{ marginTop: "6px" }}>
                                {chain.map((row, i) => (
                                    <HonestBar
                                        key={`${row.step}-${row.src}-${row.dst}`}
                                        src={row.src}
                                        dst={row.dst}
                                        value={row.probability}
                                        top={i === activeIndex}
                                        delay={reduce ? 0 : i * STEP_STAGGER_S}
                                        ariaLabel={`${t("models.bigram.stepwise.stepLabel").replace(
                                            "{n}",
                                            String(row.step)
                                        )}: ${glyph(row.src)} → ${glyph(row.dst)}, ${(
                                            row.probability * 100
                                        ).toFixed(1)}%`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* sage verdict — the conclusion in human language */}
                        {tail.length > 0 && (
                            <Verdict
                                label={t("models.bigram.stepwise.verdictLabel")}
                                main={
                                    <>
                                        {renderVerdictMain(
                                            t("models.bigram.stepwise.verdictMain"),
                                            submittedSeed,
                                            tail
                                        )}
                                    </>
                                }
                                sub={t("models.bigram.stepwise.verdictSub").replace(
                                    "{n}",
                                    String(chain.length)
                                )}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Empty state hint ── */}
            {!steps && !loading && !error && (
                <p
                    style={{
                        fontFamily: "var(--font-source-serif)",
                        fontSize: "15px",
                        lineHeight: 1.6,
                        color: "var(--bigram-muted)",
                        textWrap: "pretty",
                        margin: 0,
                    }}
                >
                    {t("models.bigram.stepwise.emptyHint")}
                </p>
            )}

            {/* range thumb styling — token-driven, scoped to this figure's class */}
            <style>{rangeCss}</style>
        </figure>
    );
}

/**
 * Splits the verdictMain template ("From “{seed}”, it continued with “{tail}”.") into text + the two
 * emphasised tokens, rendering the tokens as <b> so the Verdict primitive paints them accent-ink.
 * Spaces in the tail are shown as ␣ so the conclusion stays legible.
 */
function renderVerdictMain(template: string, seed: string, tail: string) {
    const visibleTail = tail.replace(/ /g, SPACE_GLYPH);
    const parts = template.split(/(\{seed\}|\{tail\})/g);
    return parts.map((part, i) => {
        if (part === "{seed}") return <b key={i}>{seed}</b>;
        if (part === "{tail}") return <b key={i}>{visibleTail}</b>;
        return <span key={i}>{part}</span>;
    });
}

/* Native range input themed with --bigram-* tokens (thumb + track height). Scoped by class. */
const rangeCss = `
.bigram-stepwise-range {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}
.bigram-stepwise-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--bigram-accent-bright);
  border: 2px solid var(--bigram-surface);
  box-shadow: 0 1px 4px color-mix(in oklab, var(--bigram-accent) 40%, transparent);
  transition: transform .15s ease;
}
.bigram-stepwise-range:active::-webkit-slider-thumb { transform: scale(1.15); }
.bigram-stepwise-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--bigram-accent-bright);
  border: 2px solid var(--bigram-surface);
  box-shadow: 0 1px 4px color-mix(in oklab, var(--bigram-accent) 40%, transparent);
}
.bigram-stepwise-range::-moz-range-track { background: transparent; }
`;
