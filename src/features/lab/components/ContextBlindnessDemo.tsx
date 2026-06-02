"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { HonestBar } from "@/features/lab/components/bigram/HonestBar";
import { Verdict } from "@/features/lab/components/bigram/Verdict";
import { useI18n } from "@/i18n/context";

/**
 * ContextBlindnessDemo — the bigram's FATAL FLAW (Bigram chapter, §6 · v10 · editorial-green).
 *
 * ONE concept, made physical: *the model's reading window is exactly ONE character wide.* It conditions
 * only on the trailing "h"; everything before it falls outside the window and is invisible. Feed it
 * "th", "sh" or "wh" and the answer is identical — because all three share the same one-char window.
 *
 * The teaching device is a single accent WINDOW (the model's eye) that hugs only the last glyph of the
 * prefix. Switch the prefix and the window stays clamped on the trailing position — the preceding letter
 * slides OUT of the window, dimming to a struck ghost — while the HonestBar predictions below do **not
 * move**. That stillness is the whole lesson: the context never reached the model.
 *
 *  • Phase 1 · Explore — segmented prefix picker; the in-sentence window (v10 hot-fill idiom) clamps to
 *    the last char; predictions render as the shared HonestBar and stay put across every switch.
 *  • Phase 2 · Reveal — three prefixes stack, each with its window on the same trailing "h", feeding ONE
 *    shared answer column; a sage rule names the collapse ("All three are identical!").
 *  • Phase 3 · Verdict — the SAGE Verdict names the flaw (one-letter amnesia) over a compact recap.
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 * Reused primitives: HonestBar, Verdict. Reuses existing bigramNarrative.contextBlindness.* i18n keys.
 */

/* ─── Static data (verbatim demo state — switching prefix must change NOTHING below the window) ─── */
const PREFIXES = ["th", "sh", "wh"] as const;

/**
 * Simulated next-char distribution after "h" — probabilities (0..1), NOT percentages. Identical for
 * every prefix on purpose: the model conditions on "h" alone, so the context "t"/"s"/"w" never enters.
 * Mirrors the BIGRAMS["h"] shape used elsewhere in the chapter (winner "e", honest partial fills).
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
const SPRING = { type: "spring", stiffness: 520, damping: 38 } as const;

const MONO = "var(--font-jetbrains-mono)";
const SERIF = "var(--font-source-serif)";

type Phase = 1 | 2 | 3;

/* ─── Component ─── */
export const ContextBlindnessDemo = memo(function ContextBlindnessDemo() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [selected, setSelected] = useState(0);
    const [tried, setTried] = useState<ReadonlySet<number>>(() => new Set([0]));
    const [phase, setPhase] = useState<Phase>(1);

    const prefix = PREFIXES[selected];
    const seen = prefix[1]; // the only letter inside the window ("h")

    const winnerIdx = useMemo(
        () => PREDICTIONS.reduce((best, cur, i) => (cur.p > PREDICTIONS[best].p ? i : best), 0),
        [],
    );
    const winner = PREDICTIONS[winnerIdx];
    const winnerPct = (winner.p * 100).toFixed(1);

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
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <AnimatePresence mode="wait">
                {/* ─────────── PHASE 1 · Explore: switch prefix, watch the window — and the answer — stay still ─────────── */}
                {phase === 1 && (
                    <motion.div
                        key="phase1"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduce ? undefined : { opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <EyebrowLine>{t("bigramNarrative.contextBlindness.pickPrompt")}</EyebrowLine>

                        {/* prefix picker — segmented control (sunk rail, sliding accent cell) */}
                        <div style={{ textAlign: "center", marginTop: 18 }}>
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
                                                minWidth: 74,
                                                height: 50,
                                                padding: "0 14px",
                                                display: "grid",
                                                placeItems: "center",
                                                fontFamily: MONO,
                                                fontSize: 22,
                                                fontWeight: active ? 600 : 500,
                                                border: 0,
                                                borderRadius: "var(--bigram-r-sm)",
                                                cursor: "pointer",
                                                background: "transparent",
                                                color: active
                                                    ? "var(--bigram-on-accent)"
                                                    : "var(--bigram-muted)",
                                                transition: "color .2s ease",
                                            }}
                                        >
                                            {active && (
                                                <motion.span
                                                    layoutId="cb-seg"
                                                    aria-hidden
                                                    transition={reduce ? { duration: 0 } : SPRING}
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
                                            <span style={{ position: "relative", zIndex: 1 }}>{p}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* The model's window — a width-1 lens clamped on the trailing char. The lead
                            letter sits OUTSIDE the lens, struck + dimmed: it never reaches the model. */}
                        <ModelWindow prefix={prefix} reduce={reduce} />

                        {/* one-line reading of the window state */}
                        <p
                            style={{
                                textAlign: "center",
                                fontFamily: MONO,
                                fontSize: 11.5,
                                letterSpacing: ".02em",
                                color: "var(--bigram-dim)",
                                margin: "0 0 28px",
                            }}
                        >
                            {t("bigramNarrative.contextBlindness.modelSees")}{" "}
                            <span style={{ color: "var(--bigram-accent-ink)", fontWeight: 600 }}>
                                &ldquo;{seen}&rdquo;
                            </span>{" "}
                            —{" "}
                            <span style={{ color: "var(--bigram-wrong)" }}>
                                &ldquo;{prefix[0]}&rdquo;
                            </span>{" "}
                            {t("bigramNarrative.contextBlindness.invisible")}
                        </p>

                        {/* predictions — shared HonestBar. Keyed to `selected` so a switch re-runs the
                            cascade … but every prefix yields the SAME distribution, so visually nothing
                            moves. That stillness is the lesson. */}
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
                        <div style={{ textAlign: "center", marginTop: 24, minHeight: 44 }}>
                            <AnimatePresence mode="wait">
                                {!allTried ? (
                                    <motion.p
                                        key="nudge"
                                        initial={reduce ? false : { opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={reduce ? undefined : { opacity: 0 }}
                                        style={{
                                            fontFamily: SERIF,
                                            fontStyle: "italic",
                                            fontSize: 16,
                                            color: "var(--bigram-muted)",
                                            margin: 0,
                                        }}
                                    >
                                        {t("bigramNarrative.contextBlindness.tryOthers")}
                                    </motion.p>
                                ) : (
                                    <PrimaryButton key="reveal" onClick={() => setPhase(2)} reduce={reduce}>
                                        {t("bigramNarrative.contextBlindness.revealButton")}
                                    </PrimaryButton>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* ─────────── PHASE 2 · Reveal: three windows on the same "h" → one shared answer ─────────── */}
                {phase === 2 && (
                    <motion.div
                        key="phase2"
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                    >
                        <EyebrowLine>{t("bigramNarrative.contextBlindness.prompt")}</EyebrowLine>

                        {/* three prefixes — each striking its blind lead, each window on the same "h" */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 12,
                                margin: "28px 0 10px",
                            }}
                        >
                            {PREFIXES.map((pfx, i) => (
                                <motion.div
                                    key={pfx}
                                    initial={reduce ? false : { opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.14, ease: EASE }}
                                >
                                    <WindowRow prefix={pfx} />
                                </motion.div>
                            ))}
                        </div>

                        {/* the bridge — same window → same answer (sage rule, no neon "=" chrome) */}
                        <motion.div
                            initial={reduce ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: reduce ? 0 : 0.5 }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                justifyContent: "center",
                                margin: "10px 0 24px",
                            }}
                        >
                            <span style={ruleStyle} />
                            <span
                                style={{
                                    fontFamily: MONO,
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

                        <div style={{ textAlign: "center", marginTop: 26 }}>
                            <GhostButton onClick={() => setPhase(3)}>
                                {t("bigramNarrative.contextBlindness.whyButton")}
                            </GhostButton>
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
                                marginBottom: 24,
                            }}
                        >
                            {PREFIXES.map((pfx) => (
                                <span
                                    key={pfx}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "baseline",
                                        gap: 7,
                                        fontFamily: MONO,
                                        fontSize: 14,
                                        padding: "7px 14px",
                                        borderRadius: "var(--bigram-r-pill)",
                                        background:
                                            "color-mix(in oklab, var(--bigram-ink) 5%, transparent)",
                                    }}
                                >
                                    <span
                                        aria-hidden
                                        style={{
                                            color: "var(--bigram-wrong)",
                                            opacity: 0.42,
                                            textDecoration: "line-through",
                                        }}
                                    >
                                        {pfx[0]}
                                    </span>
                                    <span style={{ color: "var(--bigram-accent-ink)", fontWeight: 600 }}>
                                        {pfx[1]}
                                    </span>
                                    <span style={{ color: "var(--bigram-dim)" }}>→</span>
                                    <span style={{ color: "var(--bigram-ink)", fontWeight: 600 }}>
                                        {winner.char}
                                    </span>
                                    <span style={{ color: "var(--bigram-dim)" }}>{winnerPct}&#8202;%</span>
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

/* ─── The model's window: a width-1 lens clamped on the trailing char (Phase 1, interactive) ───
   The lead char sits outside the lens (struck, dim, drifting left); the last char is wrapped by an
   accent window that slides between prefixes via a shared layoutId — visibly never widening past one
   glyph. A small "scope" caption under the lens names it as the model's entire field of view. */
const ModelWindow = memo(function ModelWindow({
    prefix,
    reduce,
}: {
    prefix: string;
    reduce: boolean | null;
}) {
    const blind = prefix[0];
    const seen = prefix[1];

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                margin: "30px 0 18px",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                {/* the typed prefix, with a sliding window over the last glyph */}
                <div
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: 4,
                        padding: "8px 6px",
                    }}
                >
                    {/* the blind lead — outside the window, struck + drifting out */}
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={`blind-${blind}`}
                            initial={reduce ? false : { opacity: 0.3, x: 0 }}
                            animate={reduce ? { opacity: 0.26 } : { opacity: 0.24, x: -6 }}
                            exit={reduce ? undefined : { opacity: 0, x: -16 }}
                            transition={{ duration: 0.4, ease: EASE }}
                            style={{
                                position: "relative",
                                zIndex: 2,
                                fontFamily: MONO,
                                fontSize: 44,
                                fontWeight: 600,
                                lineHeight: 1,
                                color: "var(--bigram-wrong)",
                                textDecoration: "line-through",
                                textDecorationColor:
                                    "color-mix(in oklab, var(--bigram-wrong) 50%, transparent)",
                            }}
                        >
                            {blind}
                        </motion.span>
                    </AnimatePresence>

                    {/* the surviving last char — inside the window, sharp accent */}
                    <span
                        style={{
                            position: "relative",
                            zIndex: 2,
                            fontFamily: MONO,
                            fontSize: 44,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: "var(--bigram-on-accent)",
                        }}
                    >
                        {/* the window: an accent fill clamped to exactly this one glyph; slides via layoutId */}
                        <motion.span
                            layoutId="cb-window"
                            aria-hidden
                            transition={reduce ? { duration: 0 } : SPRING}
                            style={{
                                position: "absolute",
                                inset: "-7px -8px",
                                zIndex: -1,
                                borderRadius: "var(--bigram-r-sm)",
                                background: "var(--bigram-accent)",
                                boxShadow:
                                    "0 6px 18px -8px color-mix(in oklab, var(--bigram-accent) 70%, transparent)",
                            }}
                        />
                        {seen}
                    </span>
                </div>

                <span style={{ color: "var(--bigram-dim)", fontSize: 20 }}>→</span>

                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 32,
                        fontWeight: 600,
                        color: "var(--bigram-dim)",
                    }}
                >
                    ?
                </span>
            </div>
        </div>
    );
});

/* ─── A static window row used in Phase 2 (three of them, no sliding) ─── */
const WindowRow = memo(function WindowRow({ prefix }: { prefix: string }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 4,
                fontFamily: MONO,
                fontSize: "clamp(28px, 6.5vw, 40px)",
                fontWeight: 600,
                lineHeight: 1,
            }}
        >
            <span
                aria-hidden
                style={{
                    color: "var(--bigram-wrong)",
                    opacity: 0.32,
                    textDecoration: "line-through",
                    textDecorationColor: "color-mix(in oklab, var(--bigram-wrong) 55%, transparent)",
                }}
            >
                {prefix[0]}
            </span>
            <span
                style={{
                    position: "relative",
                    color: "var(--bigram-on-accent)",
                    fontWeight: 700,
                    padding: "4px 7px",
                    borderRadius: "var(--bigram-r-sm)",
                    background: "var(--bigram-accent)",
                }}
            >
                {prefix[1]}
            </span>
            <span
                aria-hidden
                style={{ color: "var(--bigram-dim)", fontSize: "0.5em", margin: "0 0 0 8px" }}
            >
                →
            </span>
        </span>
    );
});

/* ─── small presentational helpers ─── */
const EyebrowLine = memo(function EyebrowLine({ children }: { children: React.ReactNode }) {
    return (
        <p
            style={{
                textAlign: "center",
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 17,
                lineHeight: 1.5,
                color: "var(--bigram-muted)",
                margin: "0 auto",
                maxWidth: "34ch",
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
                fontFamily: MONO,
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

/* ─── Buttons (token-only, v10 .btn vocabulary; hover lifts to accent-bright) ─── */
function PrimaryButton({
    children,
    onClick,
    reduce,
}: {
    children: React.ReactNode;
    onClick: () => void;
    reduce: boolean | null;
}) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{
                fontFamily: MONO,
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
                transition: "background .2s",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bigram-accent-bright)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bigram-accent)";
            }}
        >
            {children}
        </motion.button>
    );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                padding: "11px 18px",
                borderRadius: "var(--bigram-r-sm)",
                border: 0,
                background: "transparent",
                color: "var(--bigram-accent)",
                cursor: "pointer",
                fontWeight: 600,
                transition: "background .2s",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bigram-accent-soft)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
            }}
        >
            {children}
        </button>
    );
}
