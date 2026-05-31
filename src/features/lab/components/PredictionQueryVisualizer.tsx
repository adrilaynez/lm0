"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Divide, RotateCcw } from "lucide-react";

import { HonestBar } from "@/features/lab/components/bigram/HonestBar";
import { Verdict } from "@/features/lab/components/bigram/Verdict";
import { useI18n } from "@/i18n/context";

/**
 * PredictionQueryVisualizer — Section 4 "How a bigram predicts" (v8 · editorial-green).
 *
 * ONE concept: *querying a single row of the count matrix and normalizing it into a
 * next-character distribution.* Not a multi-screen wizard, not a casino — a single calm
 * instrument that reveals the pipeline in place:
 *
 *   1 · PICK     — segmented control (sunk --bigram-bg-2 rail, active cell filled accent);
 *   2 · LOOKUP   — the chosen row of the matrix as ONE horizontal strip of count cells,
 *                  bracketed and summed to a row total (this is "querying one row");
 *   3 · COUNTS   — the row's followers as shared HonestBars, scaled to the largest count;
 *   4 · NORMALIZE— the SAME bars morph in place (count ÷ total) onto the honest fixed axis,
 *                  with a formula well — the single act the section is about;
 *   5 · PREDICT  — the plain-language Verdict ("After X, the most likely is Y").
 *
 * The two redundant raw/normalized bar charts of the old wizard are fused into one set that
 * transforms; the weighted-dice step is dropped because sampling has its own dedicated widget
 * later in the chapter, and a second concept here would compete with normalization.
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme]
 * scope. All copy through i18n (bigramNarrative.queryViz.*). Reduced-motion safe throughout.
 */

/* ─── Realistic bigram frequencies (unchanged) ─── */
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
    const winnerPct = winner && total > 0 ? `${((winner.count / total) * 100).toFixed(0)}%` : "";

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
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
            {/* ─── 1 · PICK — segmented control ─── */}
            <Eyebrow num={1} label={t("bigramNarrative.queryViz.step0Label")} />
            <p style={leadHintStyle}>{t("bigramNarrative.queryViz.pickChar")}</p>

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
                                aria-label={`${ch === " " ? "space" : ch}`}
                                onClick={() => selectChar(ch)}
                                style={{
                                    position: "relative",
                                    minWidth: 44,
                                    height: 44,
                                    padding: "0 12px",
                                    display: "grid",
                                    placeItems: "center",
                                    fontFamily: "var(--font-jetbrains-mono)",
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

            {/* ─── idle invitation ─── */}
            <AnimatePresence mode="wait">
                {selectedChar === null ? (
                    <motion.div
                        key="idle"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduce ? undefined : { opacity: 0 }}
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 12,
                            margin: "32px 0 4px",
                        }}
                        aria-hidden
                    >
                        {/* a calm, faint placeholder strip — the only "this is interactive" cue while idle */}
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
                    </motion.div>
                ) : (
                    <motion.div
                        key={`stage-${selectedChar}`}
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                    >
                        {/* ─── 2 · LOOKUP — the queried row as one horizontal strip ─── */}
                        <div style={{ marginTop: 38 }}>
                            <Eyebrow num={2} label={t("bigramNarrative.queryViz.step1Label")} />
                            <p style={leadHintStyle}>
                                {t("bigramNarrative.queryViz.lookingUp", {
                                    char: displayChar(selectedChar),
                                })}
                            </p>
                            <RowStrip row={rowData} src={selectedChar} total={total} reduce={!!reduce} t={t} />
                        </div>

                        {/* ─── 3 · COUNTS → 4 · NORMALIZE — one bar stack that morphs ─── */}
                        <div style={{ marginTop: 40 }}>
                            <Eyebrow
                                num={normalized ? 4 : 3}
                                label={t(
                                    normalized
                                        ? "bigramNarrative.queryViz.step3Label"
                                        : "bigramNarrative.queryViz.step2Label"
                                )}
                            />
                            <p style={leadHintStyle}>
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

                            {/* total / normalize control */}
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
                                        fontFamily: "var(--font-jetbrains-mono)",
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
                                    <button
                                        type="button"
                                        onClick={() => setNormalized(true)}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 9,
                                            fontFamily: "var(--font-jetbrains-mono)",
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
                                    >
                                        <Divide style={{ width: 15, height: 15 }} aria-hidden />
                                        {t("bigramNarrative.queryViz.step3Label")}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ─── 5 · PREDICT — the plain-language verdict ─── */}
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
                                    style={{ marginTop: 34 }}
                                >
                                    <Eyebrow num={5} label={t("bigramNarrative.queryViz.step4Label")} />
                                    <div style={{ marginTop: 14 }}>
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
                                    </div>

                                    <div style={{ textAlign: "center", marginTop: 18 }}>
                                        <button
                                            type="button"
                                            onClick={reset}
                                            style={{
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
                                            }}
                                        >
                                            <RotateCcw style={{ width: 13, height: 13 }} aria-hidden />
                                            {t("bigramNarrative.queryViz.tryAnother")}
                                        </button>
                                    </div>
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

/** Section eyebrow — italic Playfair numeral (accent) + mono uppercase label + hairline rule. */
const Eyebrow = memo(function Eyebrow({ num, label }: { num: number; label: string }) {
    return (
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
            <span
                style={{
                    fontFamily: "var(--font-playfair)",
                    fontStyle: "italic",
                    fontWeight: 600,
                    fontSize: 18,
                    color: "var(--bigram-accent)",
                    lineHeight: 1,
                }}
            >
                {num}
            </span>
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "var(--bigram-muted)",
                }}
            >
                {label}
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--bigram-rule)" }} />
        </div>
    );
});

/**
 * RowStrip — the queried row as one horizontal strip of count cells, bracketed under a single
 * row label and summing to the row total. This makes "look up the row of the matrix" literal:
 * a row pulled out of the table, with its members and its sum.
 */
const RowStrip = memo(function RowStrip({
    row,
    src,
    total,
    reduce,
    t,
}: {
    row: Row[];
    src: string;
    total: number;
    reduce: boolean;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 16,
                padding: "18px 18px",
                borderRadius: "var(--bigram-r-md)",
                background: "color-mix(in oklab, var(--bigram-surface) 55%, var(--bigram-bg))",
                overflowX: "auto",
            }}
        >
            {/* row key — the starting character, in accent */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "none" }}>
                <span
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 9.5,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                        color: "var(--bigram-dim)",
                    }}
                >
                    {t("bigramNarrative.queryViz.step0Label")}
                </span>
                <span
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 30,
                        fontWeight: 700,
                        color: "var(--bigram-accent)",
                        lineHeight: 1,
                    }}
                >
                    {displayChar(src)}
                </span>
            </div>

            <span
                aria-hidden
                style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 18, color: "var(--bigram-dim)" }}
            >
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
                                    : "color-mix(in oklab, var(--bigram-ink) 4%, transparent)",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 17,
                                fontWeight: 600,
                                color: i === 0 ? "var(--bigram-accent-ink)" : "var(--bigram-ink-2)",
                                lineHeight: 1,
                            }}
                        >
                            {displayChar(d.char)}
                        </span>
                        <span
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11,
                                color: "var(--bigram-dim)",
                                fontVariantNumeric: "lining-nums tabular-nums",
                            }}
                        >
                            {d.count.toLocaleString()}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* row total — the denominator we are about to divide by */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "none" }}>
                <span
                    style={{
                        fontFamily: "var(--font-jetbrains-mono)",
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
                        fontFamily: "var(--font-jetbrains-mono)",
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

/** FormulaWell — the normalization equation, v8 formula block (bg-2 well, centered, mono accent). */
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
                border: "1px solid var(--bigram-rule-2)",
                textAlign: "center",
            }}
        >
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
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
                    fontFamily: "var(--font-jetbrains-mono)",
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

/* ─── shared lead-hint style (editorial caption under each eyebrow) ─── */
const leadHintStyle: React.CSSProperties = {
    fontFamily: "var(--font-source-serif)",
    fontSize: 16,
    lineHeight: 1.6,
    color: "var(--bigram-body)",
    textAlign: "center",
    margin: "0 auto",
    maxWidth: "44ch",
};
