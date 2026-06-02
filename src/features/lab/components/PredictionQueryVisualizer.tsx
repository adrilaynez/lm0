"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { HonestBar } from "@/features/lab/components/bigram/HonestBar";
import { Verdict } from "@/features/lab/components/bigram/Verdict";
import { useI18n } from "@/i18n/context";

/**
 * PredictionQueryVisualizer — Bigram chapter · "How a bigram predicts" (v10 design language).
 *
 * ONE idea, shown almost instantly: *querying the model is just looking up ONE row of the count
 * table and reading off the distribution.* Indexing by the starting character pulls a single row
 * out of the table; dividing that row by its own total turns counts into probabilities.
 *
 * This is a redesign into the v10 editorial-green vocabulary (not the old 5-eyebrow stack):
 *
 *   • PICK   — segmented control (sunk --bigram-bg-2 rail, active cell rides on a spring layoutId).
 *   • LOOKUP — THE HERO. The chosen row is pulled out of the table into one sunk panel: the row key
 *              in accent, its followers as count cells, bracketed to a Σ total. A mono micro-label
 *              ("query · row {char}") narrates it the way the flagships narrate, not a big numeral.
 *   • READ   — the row's distribution as shared HonestBars (bigram accent). One act — "Normalize" —
 *              morphs the SAME bars in place from max-normalized counts onto the honest fixed axis
 *              (0.5), winner-last cascade + glint. A formula well names the division.
 *   • VERDICT— the plain-language Verdict + a serif italic coda (the whole mechanism in one line),
 *              matching CorpusCountingIdea's close.
 *
 * Calm, one focal point at a time: while idle, only the picker + a faint invitation strip; the row
 * hero appears on pick; the bars + verdict appear in sequence. States read by fill + typography, not
 * borders. Reuses the shared HonestBar / Verdict primitives via their --bigram-* accent (no primitive
 * edits). Token-only (--bigram-* / --bigram-r-*), gated by the chapter's [data-bigram-theme] scope,
 * all copy through existing i18n keys, reduced-motion safe throughout.
 */

/* ─── Realistic bigram frequencies (unchanged data — verbatim from prior version) ─── */
const QUERY_DATA: Record<string, Record<string, number>> = {
    h: { e: 3481, i: 1892, a: 1544, o: 987, " ": 432, t: 201 },
    e: { " ": 4012, r: 2156, n: 1423, s: 1198, d: 987, a: 654 },
    t: { h: 5621, e: 2034, i: 1567, o: 1234, " ": 987, a: 654 },
    " ": { t: 3456, a: 2678, s: 2134, i: 1890, o: 1567, h: 1234 },
    a: { n: 2890, t: 2345, r: 1567, s: 1234, l: 987, " ": 876 },
    o: { n: 2345, r: 1890, f: 1567, u: 1234, t: 987, " ": 876 },
    i: { n: 3456, t: 1890, s: 1567, o: 1234, c: 987, l: 876 },
    n: { " ": 3890, g: 1890, t: 1567, d: 1234, e: 987, o: 876 },
    s: { " ": 2890, t: 2345, e: 1890, i: 1234, o: 987, h: 654 },
};

const CHARS = Object.keys(QUERY_DATA);
const SPACE_GLYPH = "␣";
const PROB_AXIS = 0.5; // honest fixed axis — doubt stays visible, winner never normalises to 100%
const EASE = [0.2, 0.8, 0.2, 1] as const;

const MONO = "var(--font-jetbrains-mono)";
const SERIF = "var(--font-source-serif)";

function displayChar(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}

interface Row {
    char: string;
    count: number;
}

/* ─── Component ─── */
export const PredictionQueryVisualizer = memo(function PredictionQueryVisualizer() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [normalized, setNormalized] = useState(false);

    /* ── Derived: the queried row, sorted by count ── */
    const rowData = useMemo<Row[]>(() => {
        if (!selectedChar) return [];
        const raw = QUERY_DATA[selectedChar];
        if (!raw) return [];
        return Object.entries(raw)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([char, count]) => ({ char, count }));
    }, [selectedChar]);

    const total = useMemo(() => rowData.reduce((s, d) => s + d.count, 0), [rowData]);
    const maxCount = rowData.length > 0 ? rowData[0].count : 1;

    /* ── Honest axis: before normalizing, the largest count fills the track so each bar reads as
          its true share of the row's max; after normalizing, the fixed probability axis (0.5)
          keeps the model's doubt visible. ── */
    const axis = normalized ? PROB_AXIS : 1;
    const winner = rowData[0];
    const winnerPct = winner && total > 0 ? `${((winner.count / total) * 100).toFixed(0)} %` : "";

    /* ── Selection (resets the morph) ── */
    const selectChar = useCallback((ch: string) => {
        setSelectedChar(ch);
        setNormalized(false);
    }, []);

    const reset = useCallback(() => {
        setSelectedChar(null);
        setNormalized(false);
    }, []);

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", fontFamily: SERIF }}>
            {/* ─── PICK — segmented control · the single focal point while idle ─── */}
            <MicroLabel>{t("bigramNarrative.queryViz.pickChar")}</MicroLabel>

            <div style={{ textAlign: "center", marginTop: 14 }}>
                <div
                    role="radiogroup"
                    aria-label={t("bigramNarrative.queryViz.pickChar")}
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
                    {CHARS.map((ch) => {
                        const active = selectedChar === ch;
                        return (
                            <button
                                key={ch}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                aria-label={ch === " " ? "espacio" : ch}
                                onClick={() => selectChar(ch)}
                                style={{
                                    position: "relative",
                                    minWidth: 44,
                                    height: 44,
                                    padding: "0 12px",
                                    display: "grid",
                                    placeItems: "center",
                                    fontFamily: MONO,
                                    fontSize: 21,
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
                                        layoutId="pqv-seg"
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
                                <span style={{ position: "relative", zIndex: 1 }}>{displayChar(ch)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {selectedChar === null ? (
                    /* ─── idle invitation — a calm serif line + faint placeholder strip ─── */
                    <motion.div
                        key="idle"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduce ? undefined : { opacity: 0 }}
                    >
                        <p
                            style={{
                                fontFamily: SERIF,
                                fontStyle: "italic",
                                fontSize: 16,
                                lineHeight: 1.55,
                                color: "var(--bigram-muted)",
                                textAlign: "center",
                                margin: "20px auto 0",
                                maxWidth: "40ch",
                                textWrap: "pretty",
                            }}
                        >
                            {t("bigramNarrative.queryViz.hint")}
                        </p>
                        <div
                            aria-hidden
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 12,
                                margin: "26px 0 4px",
                            }}
                        >
                            {[0, 1, 2, 3].map((i) => (
                                <span
                                    key={i}
                                    style={{
                                        width: i === 1 ? 96 : 56,
                                        height: 12,
                                        borderRadius: 6,
                                        background: "color-mix(in oklab, var(--bigram-ink) 6%, transparent)",
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={`stage-${selectedChar}`}
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                    >
                        {/* ─── LOOKUP — THE HERO: the indexed row pulled out of the table ─── */}
                        <div style={{ marginTop: 34 }}>
                            <MicroLabel>
                                {t("bigramNarrative.queryViz.lookingUp", {
                                    char: displayChar(selectedChar),
                                })}
                            </MicroLabel>
                            <RowStrip
                                row={rowData}
                                src={selectedChar}
                                total={total}
                                reduce={!!reduce}
                                rowLabel={t("bigramNarrative.queryViz.step0Label")}
                            />
                        </div>

                        {/* ─── READ — one bar stack that morphs counts → probabilities ─── */}
                        <div style={{ marginTop: 38 }}>
                            <MicroLabel>
                                {normalized
                                    ? t("bigramNarrative.queryViz.step3Label")
                                    : t("bigramNarrative.queryViz.step2Label")}
                            </MicroLabel>

                            <p
                                style={{
                                    fontFamily: SERIF,
                                    fontSize: 16,
                                    lineHeight: 1.6,
                                    color: "var(--bigram-body)",
                                    textAlign: "center",
                                    margin: "10px auto 0",
                                    maxWidth: "46ch",
                                    textWrap: "pretty",
                                }}
                            >
                                {normalized
                                    ? t("bigramNarrative.queryViz.normalizeIntro")
                                    : t("bigramNarrative.queryViz.rawCountsIntro", {
                                          char: displayChar(selectedChar),
                                      })}
                            </p>

                            {/* formula well — appears with normalization */}
                            <AnimatePresence>
                                {normalized && (
                                    <motion.div
                                        key="formula"
                                        initial={reduce ? false : { opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: "auto", marginTop: 18 }}
                                        exit={reduce ? undefined : { opacity: 0, height: 0, marginTop: 0 }}
                                        transition={{ duration: 0.4, ease: EASE }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <FormulaWell total={total} t={t} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div style={{ marginTop: 22 }}>
                                {rowData.map((d, i) => {
                                    const value = normalized ? d.count / total : d.count / maxCount;
                                    const isTop = i === 0;
                                    // winner-last cascade only when normalizing (the payoff moment)
                                    const delay = normalized ? (rowData.length - 1 - i) * 0.07 : 0;
                                    return (
                                        <HonestBar
                                            key={`${d.char}-${normalized ? "p" : "c"}`}
                                            src={selectedChar}
                                            dst={d.char}
                                            value={value}
                                            axis={axis}
                                            top={isTop}
                                            glint={isTop && normalized}
                                            countUp={normalized}
                                            delay={delay}
                                            ariaLabel={
                                                normalized
                                                    ? `${selectedChar === " " ? "space" : selectedChar} followed by ${
                                                          d.char === " " ? "space" : d.char
                                                      }, ${((d.count / total) * 100).toFixed(1)} percent`
                                                    : `${selectedChar === " " ? "space" : selectedChar} followed by ${
                                                          d.char === " " ? "space" : d.char
                                                      }, ${d.count.toLocaleString()} times`
                                            }
                                        />
                                    );
                                })}
                            </div>

                            {/* total / normalize control — top hairline rule, fill-not-border button */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 14,
                                    marginTop: 18,
                                    paddingTop: 14,
                                    borderTop: "1px solid var(--bigram-rule)",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: MONO,
                                        fontSize: 11.5,
                                        letterSpacing: ".14em",
                                        textTransform: "uppercase",
                                        color: "var(--bigram-muted)",
                                        fontVariantNumeric: "lining-nums tabular-nums",
                                    }}
                                >
                                    {t("bigramNarrative.queryViz.totalRaw", {
                                        total: total.toLocaleString(),
                                    })}
                                </span>

                                {!normalized && (
                                    <NormalizeButton onClick={() => setNormalized(true)}>
                                        <span aria-hidden style={{ fontSize: "1.15em", lineHeight: 1 }}>
                                            ÷
                                        </span>
                                        {t("bigramNarrative.queryViz.step3Label")}
                                    </NormalizeButton>
                                )}
                            </div>
                        </div>

                        {/* ─── VERDICT — plain-language conclusion + serif italic coda ─── */}
                        <AnimatePresence>
                            {normalized && winner && (
                                <motion.div
                                    key="verdict"
                                    initial={reduce ? false : { opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: reduce ? 0 : 0.35,
                                        ease: EASE,
                                    }}
                                    style={{ marginTop: 30, textAlign: "center" }}
                                >
                                    <Verdict
                                        label={t("bigramNarrative.corpusCounting.verdictLabel")}
                                        main={
                                            <VerdictSentence
                                                template={t("bigramNarrative.corpusCounting.verdictMain")}
                                                char={displayChar(selectedChar)}
                                                best={displayChar(winner.char)}
                                            />
                                        }
                                        sub={t("bigramNarrative.corpusCounting.verdictSub", {
                                            n: winner.count.toLocaleString(),
                                            total: total.toLocaleString(),
                                            pct: winnerPct,
                                        })}
                                    />

                                    {/* serif italic coda — the whole query mechanism in one sentence */}
                                    <p
                                        style={{
                                            fontFamily: SERIF,
                                            fontStyle: "italic",
                                            fontSize: 17,
                                            lineHeight: 1.5,
                                            color: "var(--bigram-muted)",
                                            margin: "16px auto 18px",
                                            maxWidth: "42ch",
                                            textWrap: "pretty",
                                        }}
                                    >
                                        {t("bigramNarrative.corpusCounting.reveal")}
                                    </p>

                                    <GhostButton onClick={reset}>
                                        ↻ {t("bigramNarrative.queryViz.tryAnother")}
                                    </GhostButton>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

/** MicroLabel — centered mono uppercase tracked label (v10 section-label idiom, no big numeral). */
const MicroLabel = memo(function MicroLabel({ children }: { children: React.ReactNode }) {
    return (
        <p
            style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color: "var(--bigram-muted)",
                textAlign: "center",
                margin: "0 0 2px",
            }}
        >
            {children}
        </p>
    );
});

/**
 * RowStrip — THE HERO. The indexed row pulled out of the table into ONE sunk panel: the row key
 * (the starting char) in accent, an arrow, the followers as count cells (winner tinted), bracketed
 * to a Σ total. This makes "query = look up one row of the table" literal and is the focal point.
 */
const RowStrip = memo(function RowStrip({
    row,
    src,
    total,
    reduce,
    rowLabel,
}: {
    row: Row[];
    src: string;
    total: number;
    reduce: boolean;
    rowLabel: string;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 16,
                padding: "20px 18px",
                borderRadius: "var(--bigram-r-lg)",
                background: "var(--bigram-bg-2)",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,.30)",
                overflowX: "auto",
            }}
        >
            {/* row key — the starting character, in accent */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    flex: "none",
                }}
            >
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 9.5,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                        color: "var(--bigram-dim)",
                    }}
                >
                    {rowLabel}
                </span>
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 30,
                        fontWeight: 700,
                        color: "var(--bigram-accent)",
                        lineHeight: 1,
                    }}
                >
                    {displayChar(src)}
                </span>
            </div>

            <span aria-hidden style={{ fontFamily: MONO, fontSize: 18, color: "var(--bigram-dim)" }}>
                →
            </span>

            {/* the followers — one cell each: glyph over count */}
            <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "flex-start" }}>
                {row.map((d, i) => (
                    <motion.div
                        key={d.char}
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, delay: reduce ? 0 : 0.1 + i * 0.05, ease: EASE }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 5,
                            minWidth: 46,
                            padding: "8px 6px",
                            borderRadius: "var(--bigram-r-sm)",
                            background:
                                i === 0
                                    ? "var(--bigram-accent-soft)"
                                    : "color-mix(in oklab, var(--bigram-ink) 5%, transparent)",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: MONO,
                                fontSize: 17,
                                fontWeight: i === 0 ? 700 : 600,
                                color: i === 0 ? "var(--bigram-accent-ink)" : "var(--bigram-ink-2)",
                                lineHeight: 1,
                            }}
                        >
                            {displayChar(d.char)}
                        </span>
                        <span
                            style={{
                                fontFamily: MONO,
                                fontSize: 11,
                                color: i === 0 ? "var(--bigram-accent)" : "var(--bigram-dim)",
                                fontVariantNumeric: "lining-nums tabular-nums",
                            }}
                        >
                            {d.count.toLocaleString()}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* row total — the denominator we are about to divide by */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    flex: "none",
                }}
            >
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 9.5,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                        color: "var(--bigram-dim)",
                    }}
                >
                    Σ
                </span>
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--bigram-ink)",
                        lineHeight: 1,
                        fontVariantNumeric: "lining-nums tabular-nums",
                    }}
                >
                    {total.toLocaleString()}
                </span>
            </div>
        </div>
    );
});

/** FormulaWell — the normalization equation in a sunk well (mono accent, centered). */
const FormulaWell = memo(function FormulaWell({
    total,
    t,
}: {
    total: number;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    return (
        <div
            style={{
                padding: "16px 20px",
                borderRadius: "var(--bigram-r-md)",
                background: "var(--bigram-bg-2)",
                boxShadow: "inset 0 1px 4px rgba(0,0,0,.26)",
                textAlign: "center",
            }}
        >
            <span
                style={{
                    fontFamily: MONO,
                    fontSize: 15,
                    color: "var(--bigram-accent)",
                    fontVariantNumeric: "lining-nums tabular-nums",
                    letterSpacing: ".01em",
                }}
            >
                count&nbsp;&divide;&nbsp;{total.toLocaleString()}&nbsp;=&nbsp;probability
            </span>
            <p
                style={{
                    margin: "8px 0 0",
                    fontFamily: MONO,
                    fontSize: 10.5,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: "var(--bigram-muted)",
                }}
            >
                {t("bigramNarrative.queryViz.step3Label")}
            </p>
        </div>
    );
});

/* ─── Buttons (token-only, v10 .btn vocabulary) ─── */

function NormalizeButton({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                fontWeight: 600,
                padding: "11px 18px",
                border: 0,
                borderRadius: "var(--bigram-r-sm)",
                cursor: "pointer",
                background: "var(--bigram-accent)",
                color: "var(--bigram-on-accent)",
                transition: "background .2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bigram-accent-bright)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bigram-accent)";
            }}
        >
            {children}
        </button>
    );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                fontWeight: 600,
                padding: "11px 18px",
                border: 0,
                borderRadius: "var(--bigram-r-sm)",
                cursor: "pointer",
                background: "transparent",
                color: "var(--bigram-muted)",
                boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
                transition: "color .2s ease, box-shadow .2s ease, background .2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--bigram-accent)";
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--bigram-accent)";
                e.currentTarget.style.background = "var(--bigram-accent-soft)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--bigram-muted)";
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--bigram-rule-2)";
                e.currentTarget.style.background = "transparent";
            }}
        >
            {children}
        </button>
    );
}

/**
 * VerdictSentence — fills the i18n template, replacing {char}/{best} with bold spans. Verdict
 * colours any <b> in `main` with --bigram-accent-ink, so the predicted chars read in accent.
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
