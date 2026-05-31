"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { HonestBar } from "@/features/lab/components/bigram/HonestBar";
import { Verdict } from "@/features/lab/components/bigram/Verdict";
import { useI18n } from "@/i18n/context";

/**
 * ContextBlindnessDemo — the bigram's fatal flaw (Bigram chapter, §6 · v8 · editorial-green).
 *
 * ONE concept: *the bigram only ever sees the last character, so longer context is invisible to it.*
 * Feed it "th", "sh" or "wh" and it answers identically — because all it reads is the trailing "h".
 *
 *  • the prefix picker is a v8 SEGMENTED CONTROL (sunk --bigram-bg-2 rail, active cell filled accent);
 *  • "what the model sees" is editorial, not boxed: the leading letter dims to a struck ghost and
 *    drifts out of the model's eye; only the surviving last char stays sharp in accent;
 *  • predictions render as the shared HonestBar (honest fixed axis, winner `top`, brighter & last) —
 *    and they *do not move* when you switch prefix, which is the whole point;
 *  • the reveal stacks all three prefixes over ONE shared bar column so "same answer" is undeniable;
 *  • it closes on the SAGE Verdict naming the flaw — one-letter amnesia.
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 */

/* ─── Static data ─── */
const PREFIXES = ["th", "sh", "wh"] as const;

/**
 * Simulated next-char distribution after "h" — probabilities (0..1), NOT percentages. Identical for
 * every prefix on purpose: the model conditions on "h" alone, so the context "t"/"s"/"w" never enters.
 */
const PREDICTIONS: { char: string; p: number }[] = [
    { char: "e", p: 0.32 },
    { char: "a", p: 0.15 },
    { char: "i", p: 0.11 },
    { char: "o", p: 0.09 },
    { char: " ", p: 0.08 },
    { char: "r", p: 0.05 },
];

const EASE = [0.2, 0.8, 0.2, 1] as const;

type Phase = 1 | 2 | 3;

/* ─── Component ─── */
export const ContextBlindnessDemo = memo(function ContextBlindnessDemo() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [selected, setSelected] = useState(0);
    const [tried, setTried] = useState<ReadonlySet<number>>(() => new Set([0]));
    const [phase, setPhase] = useState<Phase>(1);

    const prefix = PREFIXES[selected];
    const blind = prefix[0]; // the letter the model can NOT see
    const seen = prefix[1]; // the only letter it conditions on ("h")

    const winnerIdx = useMemo(
        () => PREDICTIONS.reduce((best, cur, i) => (cur.p > PREDICTIONS[best].p ? i : best), 0),
        []
    );

    const handleSelect = useCallback((i: number) => {
        setSelected(i);
        setTried((prev) => {
            if (prev.has(i)) return prev;
            const next = new Set(prev);
            next.add(i);
            return next;
        });
    }, []);

    const allTried = tried.size === PREFIXES.length;

    return (
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <AnimatePresence mode="wait">
                {/* ─────────── PHASE 1 · Explore: switch prefix, watch nothing change ─────────── */}
                {phase === 1 && (
                    <motion.div
                        key="phase1"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduce ? undefined : { opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* prompt */}
                        <EyebrowLine>{t("bigramNarrative.contextBlindness.pickPrompt")}</EyebrowLine>

                        {/* prefix picker — segmented control */}
                        <div style={{ textAlign: "center", marginTop: 16 }}>
                            <div
                                role="radiogroup"
                                aria-label={t("bigramNarrative.contextBlindness.pickPrompt")}
                                style={{
                                    display: "inline-flex",
                                    gap: 4,
                                    padding: 5,
                                    borderRadius: "var(--bigram-r-md)",
                                    background: "var(--bigram-bg-2)",
                                    boxShadow: "inset 0 1px 4px rgba(0,0,0,.28)",
                                }}
                            >
                                {PREFIXES.map((p, i) => {
                                    const active = selected === i;
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            onClick={() => handleSelect(i)}
                                            style={{
                                                position: "relative",
                                                minWidth: 78,
                                                height: 52,
                                                padding: "0 14px",
                                                display: "grid",
                                                placeItems: "center",
                                                fontFamily: "var(--font-jetbrains-mono)",
                                                fontSize: 24,
                                                fontWeight: active ? 600 : 500,
                                                border: 0,
                                                borderRadius: "var(--bigram-r-sm)",
                                                cursor: "pointer",
                                                background: "transparent",
                                                color: active ? "var(--bigram-on-accent)" : "var(--bigram-muted)",
                                                transition: "color .2s ease",
                                            }}
                                        >
                                            {active && (
                                                <motion.span
                                                    layoutId="cb-seg"
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
                                                {p}
                                                <span style={{ opacity: 0.4 }}>_</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* what the model sees — the blind letter drifts out of the eye */}
                        <ModelEye blind={blind} seen={seen} reduce={reduce} />

                        <p
                            style={{
                                textAlign: "center",
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11.5,
                                letterSpacing: ".02em",
                                color: "var(--bigram-dim)",
                                margin: "0 0 26px",
                            }}
                        >
                            {t("bigramNarrative.contextBlindness.modelSees")}{" "}
                            <span style={{ color: "var(--bigram-accent-ink)", fontWeight: 600 }}>
                                &ldquo;{seen}&rdquo;
                            </span>{" "}
                            —{" "}
                            <span style={{ color: "var(--bigram-wrong)" }}>&ldquo;{blind}&rdquo;</span>{" "}
                            {t("bigramNarrative.contextBlindness.invisible")}
                        </p>

                        {/* predictions — shared HonestBar; keyed to selected so a switch would re-run …
                            except the values are identical, so visually nothing moves: the lesson. */}
                        <SectionEyebrow>
                            {t("bigramNarrative.contextBlindness.topPredictions")}
                        </SectionEyebrow>
                        <div>
                            {PREDICTIONS.map(({ char, p }, i) => (
                                <HonestBar
                                    key={`${selected}-${char}`}
                                    src={seen}
                                    dst={char}
                                    value={p}
                                    top={i === winnerIdx}
                                    glint={i === winnerIdx}
                                    countUp={i === winnerIdx}
                                    delay={reduce ? 0 : i * 0.04}
                                />
                            ))}
                        </div>

                        {/* nudge → reveal */}
                        <div style={{ textAlign: "center", marginTop: 22, minHeight: 40 }}>
                            <AnimatePresence mode="wait">
                                {!allTried ? (
                                    <motion.p
                                        key="nudge"
                                        initial={reduce ? false : { opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={reduce ? undefined : { opacity: 0 }}
                                        style={{
                                            fontFamily: "var(--font-source-serif)",
                                            fontStyle: "italic",
                                            fontSize: 16,
                                            color: "var(--bigram-muted)",
                                            margin: 0,
                                        }}
                                    >
                                        {t("bigramNarrative.contextBlindness.tryOthers")}
                                    </motion.p>
                                ) : (
                                    <motion.button
                                        key="reveal"
                                        type="button"
                                        onClick={() => setPhase(2)}
                                        initial={reduce ? false : { opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: EASE }}
                                        style={primaryBtnStyle}
                                    >
                                        {t("bigramNarrative.contextBlindness.revealButton")}
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* ─────────── PHASE 2 · Reveal: three prefixes → one shared answer ─────────── */}
                {phase === 2 && (
                    <motion.div
                        key="phase2"
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                    >
                        <EyebrowLine>{t("bigramNarrative.contextBlindness.prompt")}</EyebrowLine>

                        {/* three prefixes — each fades its blind letter into a drifting ghost */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 10,
                                margin: "26px 0 8px",
                            }}
                        >
                            {PREFIXES.map((pfx, i) => (
                                <motion.div
                                    key={pfx}
                                    initial={reduce ? false : { opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.14, ease: EASE }}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "baseline",
                                        gap: 2,
                                        fontFamily: "var(--font-jetbrains-mono)",
                                        fontSize: "clamp(30px, 7vw, 44px)",
                                        fontWeight: 600,
                                        lineHeight: 1,
                                    }}
                                >
                                    <span
                                        aria-hidden
                                        style={{
                                            color: "var(--bigram-wrong)",
                                            opacity: 0.34,
                                            textDecoration: "line-through",
                                            textDecorationColor:
                                                "color-mix(in oklab, var(--bigram-wrong) 55%, transparent)",
                                        }}
                                    >
                                        {pfx[0]}
                                    </span>
                                    <span style={{ color: "var(--bigram-accent-ink)" }}>{pfx[1]}</span>
                                    <span
                                        aria-hidden
                                        style={{ color: "var(--bigram-dim)", fontSize: "0.5em", margin: "0 0 0 8px" }}
                                    >
                                        →
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* the bridge — same input → same answer (sage rule, no neon "=" chrome) */}
                        <motion.div
                            initial={reduce ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: reduce ? 0 : 0.5 }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                justifyContent: "center",
                                margin: "8px 0 22px",
                            }}
                        >
                            <span style={ruleStyle} />
                            <span
                                style={{
                                    fontFamily: "var(--font-jetbrains-mono)",
                                    fontSize: 10.5,
                                    letterSpacing: ".2em",
                                    textTransform: "uppercase",
                                    color: "var(--bigram-sage)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {t("bigramNarrative.contextBlindness.identical")}
                            </span>
                            <span style={ruleStyle} />
                        </motion.div>

                        {/* ONE shared answer column */}
                        <motion.div
                            initial={reduce ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: reduce ? 0 : 0.62, ease: EASE }}
                        >
                            <SectionEyebrow>
                                {t("bigramNarrative.contextBlindness.topPredictions")}
                            </SectionEyebrow>
                            {PREDICTIONS.map(({ char, p }, i) => (
                                <HonestBar
                                    key={char}
                                    src={seen}
                                    dst={char}
                                    value={p}
                                    top={i === winnerIdx}
                                    glint={i === winnerIdx}
                                    countUp={i === winnerIdx}
                                    delay={reduce ? 0 : 0.7 + i * 0.05}
                                />
                            ))}
                        </motion.div>

                        <div style={{ textAlign: "center", marginTop: 24 }}>
                            <button type="button" onClick={() => setPhase(3)} style={ghostBtnStyle}>
                                {t("bigramNarrative.contextBlindness.whyButton")}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ─────────── PHASE 3 · Verdict: name the flaw ─────────── */}
                {phase === 3 && (
                    <motion.div
                        key="phase3"
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                    >
                        {/* compact recap — three prefixes, one outcome */}
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center",
                                gap: 10,
                                marginBottom: 22,
                            }}
                        >
                            {PREFIXES.map((pfx) => (
                                <span
                                    key={pfx}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "baseline",
                                        gap: 6,
                                        fontFamily: "var(--font-jetbrains-mono)",
                                        fontSize: 14,
                                        padding: "7px 14px",
                                        borderRadius: "var(--bigram-r-pill)",
                                        background: "color-mix(in oklab, var(--bigram-ink) 5%, transparent)",
                                    }}
                                >
                                    <span
                                        aria-hidden
                                        style={{
                                            color: "var(--bigram-wrong)",
                                            opacity: 0.4,
                                            textDecoration: "line-through",
                                        }}
                                    >
                                        {pfx[0]}
                                    </span>
                                    <span style={{ color: "var(--bigram-accent-ink)", fontWeight: 600 }}>
                                        {pfx[1]}
                                    </span>
                                    <span style={{ color: "var(--bigram-dim)" }}>→</span>
                                    <span style={{ color: "var(--bigram-ink)", fontWeight: 600 }}>e</span>
                                    <span style={{ color: "var(--bigram-dim)" }}>32.0&#8202;%</span>
                                </span>
                            ))}
                        </div>

                        {/* the flaw — sage verdict */}
                        <Verdict
                            label={t("bigramNarrative.contextBlindness.calloutTitle")}
                            main={t("bigramNarrative.contextBlindness.explanation")}
                            sub=""
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/* ─── "What the model sees": the blind letter drifts out of the eye, only the last char survives ─── */
const ModelEye = memo(function ModelEye({
    blind,
    seen,
    reduce,
}: {
    blind: string;
    seen: string;
    reduce: boolean | null;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                margin: "30px 0 16px",
            }}
        >
            {/* the typed prefix */}
            <div style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={`blind-${blind}`}
                        initial={reduce ? false : { opacity: 0.34, x: 0 }}
                        animate={reduce ? { opacity: 0.34 } : { opacity: 0.22, x: -6 }}
                        exit={reduce ? undefined : { opacity: 0, x: -14 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        style={{
                            fontFamily: "var(--font-jetbrains-mono)",
                            fontSize: 40,
                            fontWeight: 600,
                            lineHeight: 1,
                            color: "var(--bigram-wrong)",
                            textDecoration: "line-through",
                            textDecorationColor: "color-mix(in oklab, var(--bigram-wrong) 50%, transparent)",
                        }}
                    >
                        {blind}
                    </motion.span>
                </AnimatePresence>
                <motion.span
                    key={`seen-${seen}`}
                    layout={!reduce}
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 40,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "var(--bigram-accent-ink)",
                    }}
                >
                    {seen}
                </motion.span>
            </div>

            <span style={{ color: "var(--bigram-dim)", fontSize: 18 }}>→</span>

            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 32,
                    fontWeight: 600,
                    color: "var(--bigram-dim)",
                }}
            >
                ?
            </span>
        </div>
    );
});

/* ─── small presentational helpers ─── */
const EyebrowLine = memo(function EyebrowLine({ children }: { children: React.ReactNode }) {
    return (
        <p
            style={{
                textAlign: "center",
                fontFamily: "var(--font-source-serif)",
                fontStyle: "italic",
                fontSize: 17,
                color: "var(--bigram-muted)",
                margin: 0,
                textWrap: "pretty",
            }}
        >
            {children}
        </p>
    );
});

const SectionEyebrow = memo(function SectionEyebrow({ children }: { children: React.ReactNode }) {
    return (
        <p
            style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 11,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color: "var(--bigram-muted)",
                margin: "0 0 8px",
            }}
        >
            {children}
        </p>
    );
});

const ruleStyle: React.CSSProperties = {
    flex: 1,
    maxWidth: 96,
    height: 1,
    background: "color-mix(in oklab, var(--bigram-sage) 40%, transparent)",
};

const primaryBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 12,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    padding: "12px 20px",
    borderRadius: "var(--bigram-r-sm)",
    border: 0,
    background: "var(--bigram-accent)",
    color: "var(--bigram-on-accent)",
    cursor: "pointer",
    fontWeight: 600,
};

const ghostBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 12,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    padding: "10px 18px",
    borderRadius: "var(--bigram-r-sm)",
    border: 0,
    background: "transparent",
    color: "var(--bigram-accent)",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 30%, var(--bigram-rule-2))",
};
