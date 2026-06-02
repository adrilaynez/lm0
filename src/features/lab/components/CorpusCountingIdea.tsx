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

import { Verdict } from "@/features/lab/components/bigram/Verdict";
import { useI18n } from "@/i18n/context";

/**
 * CorpusCountingIdea — the "bw-corpus" visualizer (Bigram chapter, v10 · editorial-green).
 *
 * ONE concept: *count what follows a chosen character across real text, then bet on the most
 * frequent follower.* A calm scientific instrument — not a dashboard.
 *
 *  • the character picker is a SEGMENTED CONTROL (sunk --bigram-bg-2 rail, active cell filled accent);
 *  • the training phrase is the HERO (large, centered, in a sunk --bigram-bg-2 panel);
 *  • the current pair carries TWO highlights — origin filled (hot1), follower tinted (hot2);
 *  • the scan is slow (~950ms) so the eye can follow each match; auto → pause → manual stays;
 *  • running counts render as inline count-rows: INTEGER count `n`, width = n/max (max-normalized),
 *    6px track, per-step `pop` bounce on the changed follower, live `top` winner;
 *  • it ends with the plain-language Verdict ("After X, the most likely is Y") + a serif coda.
 *
 * Faithful port of v10 `mountCorpus` + `.bw-corpus` CSS. Reads only --bigram-* tokens + registered
 * fonts; gated by the chapter's [data-bigram-theme] scope.
 */

/* ─── Corpus text — exact v10 string (45 chars) ─── */
const CORPUS = "the cat sat on the mat the rat ate the fat hat";

/* ─── Characters the learner can choose (exact v10 order) ─── */
const SELECTABLE_CHARS = ["t", "a", "e", "h", "s", " "];

/* ─── Pacing (exact v10) ─── */
const SCAN_DELAY_MS = 950; // slow, legible scan — the eye follows each match
const FIRST_STEP_MS = 700; // settle before the first match lands
const SPACE_GLYPH = "␣";

/* ─── Helpers ─── */
function displayChar(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}

function findOriginPositions(text: string, originChar: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < text.length - 1; i++) {
        if (text[i] === originChar) positions.push(i);
    }
    return positions;
}

type Tally = Record<string, number>;

/* ─── Component ─── */
export const CorpusCountingIdea = memo(function CorpusCountingIdea() {
    const { t } = useI18n();
    const reduce = useReducedMotion();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [originPositions, setOriginPositions] = useState<number[]>([]);
    const [scanIndex, setScanIndex] = useState(-1); // which origin position we're inspecting
    const [scanning, setScanning] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [tally, setTally] = useState<Tally>({});
    const [changed, setChanged] = useState<string | null>(null); // follower bumped this step → pops
    const [done, setDone] = useState(false);

    // Refs the driver reads without re-creating callbacks each render — keeps the scan loop stable
    // and lets every setState fire from an event/timeout callback (never synchronously in an effect).
    const positionsRef = useRef<number[]>([]);
    const manualRef = useRef(false);
    // The recursive scan loop lives behind a ref so the timeout calls the latest `step` without
    // `step` having to reference itself (which the immutability lint rule forbids).
    const stepRef = useRef<(index: number) => void>(() => {});

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    /* ── Inspect match `index`: record its follower, then schedule the next (unless paused/done) ── */
    const step = useCallback((index: number) => {
        const positions = positionsRef.current;
        if (index < 0 || index >= positions.length) {
            setScanning(false);
            setScanIndex(-1);
            setChanged(null);
            setDone(true);
            return;
        }
        setScanIndex(index);
        const follower = CORPUS[positions[index] + 1];
        setTally((prev) => ({ ...prev, [follower]: (prev[follower] ?? 0) + 1 }));
        setChanged(follower);

        if (!manualRef.current) {
            timerRef.current = setTimeout(() => stepRef.current(index + 1), SCAN_DELAY_MS);
        }
    }, []);

    // Keep the loop ref pointing at the latest `step` (stable here, but assigned in an effect so the
    // ref is never read/written during render).
    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    /* ── Begin a scan for a chosen origin character ── */
    const startScan = useCallback(
        (char: string) => {
            clearTimer();
            const positions = findOriginPositions(CORPUS, char);
            positionsRef.current = positions;
            manualRef.current = false;
            setSelectedChar(char);
            setOriginPositions(positions);
            setTally({});
            setChanged(null);
            setScanIndex(-1);
            setManualMode(false);

            if (positions.length === 0) {
                setDone(true);
                return;
            }

            setDone(false);
            setScanning(true);
            timerRef.current = setTimeout(() => step(0), FIRST_STEP_MS);
        },
        [clearTimer, step]
    );

    /* ── Manual single step (active once paused) ── */
    const advanceManual = useCallback(() => {
        clearTimer();
        step(scanIndex + 1);
    }, [clearTimer, step, scanIndex]);

    /* ── Pause the auto-scan and hand control to the learner ── */
    const pauseScan = useCallback(() => {
        clearTimer();
        manualRef.current = true;
        setManualMode(true);
    }, [clearTimer]);

    /* ── Cleanup on unmount ── */
    useEffect(() => clearTimer, [clearTimer]);

    /* ── Derived view state ── */
    const currentPos =
        scanning && scanIndex >= 0 && scanIndex < originPositions.length
            ? originPositions[scanIndex]
            : -1;

    const totalFound = useMemo(
        () => Object.values(tally).reduce((a, b) => a + b, 0),
        [tally]
    );

    // Followers sorted by count (desc); ties broken alphabetically for a stable order.
    const ranked = useMemo(
        () =>
            Object.entries(tally).sort(
                (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
            ),
        [tally]
    );

    // Max-normalized: the leading count fills the track; every other bar is n/max — NOT n/total.
    const maxCount = ranked.length > 0 ? ranked[0][1] : 1;

    const winner = ranked[0];
    const winnerPct =
        winner && totalFound > 0
            ? `${Math.round((winner[1] / totalFound) * 100)} %`
            : "";

    const liveFollower = currentPos >= 0 ? CORPUS[currentPos + 1] : null;

    // Banner pair "t→h" + meta + button — visible only while scanning (or paused & not done) on last.
    const showBanner =
        (scanning || (manualMode && !done)) &&
        selectedChar != null &&
        liveFollower != null;

    return (
        <div className="bw-corpus" style={{ maxWidth: 720, margin: "0 auto" }}>
            {/* ── Picker label ── */}
            <p
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 11,
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "var(--bigram-muted)",
                    margin: "0 0 10px",
                    textAlign: "center",
                }}
            >
                {t("bigramNarrative.corpusCounting.selectChar")}
            </p>

            {/* ── Segmented control: sunk rail, active cell filled accent ── */}
            <div style={{ textAlign: "center" }}>
                <div
                    role="radiogroup"
                    aria-label={t("bigramNarrative.corpusCounting.selectChar")}
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
                    {SELECTABLE_CHARS.map((ch) => {
                        const active = selectedChar === ch;
                        const locked = scanning && !active; // chips disabled while scanning
                        return (
                            <button
                                key={ch}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                aria-label={ch === " " ? "espacio" : ch}
                                disabled={scanning}
                                onClick={() => {
                                    if (!scanning) startScan(ch);
                                }}
                                className="bw-corpus__chip"
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
                                    cursor: scanning ? "default" : "pointer",
                                    background: "transparent",
                                    color: active
                                        ? "var(--bigram-on-accent)"
                                        : "var(--bigram-muted)",
                                    // inactive chips dim to .35 while scanning
                                    opacity: locked ? 0.35 : 1,
                                    transition: "color .2s ease",
                                }}
                            >
                                {/* Active fill rides between cells (shared layoutId = segmented feel) */}
                                {active && (
                                    <motion.span
                                        layoutId="bw-corpus-seg"
                                        aria-hidden
                                        transition={
                                            reduce
                                                ? { duration: 0 }
                                                : {
                                                      type: "spring",
                                                      stiffness: 520,
                                                      damping: 38,
                                                  }
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
                                    {displayChar(ch)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Idle hint ── */}
            {selectedChar === null && (
                <p
                    style={{
                        fontFamily: "var(--font-source-serif)",
                        fontStyle: "italic",
                        fontSize: 16,
                        color: "var(--bigram-muted)",
                        textAlign: "center",
                        margin: "14px 0 4px",
                    }}
                >
                    {t("bigramNarrative.corpusCounting.hint")}
                </p>
            )}

            {/* ── Stage: phrase hero + counts + verdict ── */}
            {selectedChar !== null && (
                <div style={{ marginTop: 8 }}>
                    {/* THE HERO — the training phrase, large & centered in a sunk panel */}
                    <div style={{ margin: "4px 0 0" }}>
                        <div
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: "clamp(25px, 3.3vw, 35px)",
                                lineHeight: 1.7,
                                letterSpacing: ".005em",
                                textAlign: "center",
                                padding: "28px 24px",
                                borderRadius: "var(--bigram-r-lg)",
                                background: "var(--bigram-bg-2)",
                                boxShadow: "inset 0 2px 8px rgba(0,0,0,.30)",
                                wordBreak: "normal",
                                overflowWrap: "break-word",
                                userSelect: "none",
                            }}
                        >
                            {CORPUS.split("").map((char, i) => {
                                const isOrigin = i === currentPos; // hot1
                                const isFollower = i === currentPos + 1; // hot2
                                const positionIdx = originPositions.indexOf(i);
                                const isPast =
                                    !isOrigin &&
                                    !isFollower &&
                                    positionIdx >= 0 &&
                                    scanIndex > positionIdx;

                                const isSpace = char === " ";

                                let color = "var(--bigram-dim)";
                                let background = "transparent";
                                let boxShadow = "none";
                                let fontWeight: number = 400;

                                if (isOrigin) {
                                    color = "var(--bigram-on-accent)";
                                    background = "var(--bigram-accent)";
                                    fontWeight = 700;
                                } else if (isFollower) {
                                    color = "var(--bigram-accent-ink)";
                                    background = "var(--bigram-accent-soft)";
                                    boxShadow =
                                        "inset 0 0 0 2px color-mix(in oklab, var(--bigram-accent) 38%, transparent)";
                                    fontWeight = 700;
                                } else if (isPast) {
                                    color =
                                        "color-mix(in oklab, var(--bigram-accent) 42%, var(--bigram-dim))";
                                }

                                return (
                                    <span
                                        key={i}
                                        style={{
                                            color,
                                            background,
                                            boxShadow,
                                            fontWeight,
                                            padding: isSpace ? "3px 4px" : "3px 2px",
                                            borderRadius: 7,
                                            transition:
                                                "color .26s ease, background .26s ease, box-shadow .26s ease",
                                        }}
                                    >
                                        {/* spaces render as a LITERAL " " in the scanned text (never ␣) */}
                                        {char}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* status line — current pair · "Match X of Y" · pause/next */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 14,
                            flexWrap: "wrap",
                            minHeight: 26,
                            margin: "16px 0 2px",
                            visibility: showBanner ? "visible" : "hidden",
                        }}
                    >
                        {showBanner && (
                            <>
                                <span
                                    style={{
                                        fontFamily: "var(--font-jetbrains-mono)",
                                        fontSize: 19,
                                        fontWeight: 600,
                                        color: "var(--bigram-accent)",
                                    }}
                                >
                                    {displayChar(selectedChar)}→{displayChar(liveFollower)}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "var(--font-jetbrains-mono)",
                                        fontSize: 13,
                                        color: "var(--bigram-muted)",
                                        fontVariantNumeric: "tabular-nums",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {t("bigramNarrative.corpusCounting.stepExplain", {
                                        pos: scanIndex + 1,
                                        total: originPositions.length,
                                    })}
                                </span>
                                <button
                                    type="button"
                                    onClick={manualMode ? advanceManual : pauseScan}
                                    style={statusBtnStyle(manualMode)}
                                >
                                    {manualMode
                                        ? t("bigramNarrative.corpusCounting.nextBtn")
                                        : t("bigramNarrative.corpusCounting.pauseBtn")}
                                </button>
                            </>
                        )}
                    </div>

                    {/* RUNNING COUNTS — inline count-rows: integer count, max-normalized width */}
                    <div style={{ marginTop: 18 }}>
                        <p
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11,
                                letterSpacing: ".2em",
                                textTransform: "uppercase",
                                color: "var(--bigram-muted)",
                                margin: "0 0 10px",
                                textAlign: "center",
                            }}
                        >
                            {t("bigramNarrative.corpusCounting.countsLabel")}
                        </p>

                        <div style={{ minHeight: 36 }}>
                            <AnimatePresence>
                                {ranked.map(([follower, count], rank) => (
                                    <CountRow
                                        key={follower}
                                        src={selectedChar}
                                        dst={follower}
                                        count={count}
                                        max={maxCount}
                                        top={rank === 0}
                                        pop={!reduce && follower === changed}
                                        reduce={!!reduce}
                                    />
                                ))}
                            </AnimatePresence>

                            {ranked.length === 0 && (
                                <p
                                    style={{
                                        fontFamily: "var(--font-source-serif)",
                                        fontStyle: "italic",
                                        fontSize: 15,
                                        color: "var(--bigram-dim)",
                                        textAlign: "center",
                                        padding: "16px 0",
                                    }}
                                >
                                    {t("bigramNarrative.corpusCounting.empty")}
                                </p>
                            )}
                        </div>

                        {/* Total de pares — top rule, mono key + count */}
                        {totalFound > 0 && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    justifyContent: "space-between",
                                    margin: "14px 0 0",
                                    paddingTop: 12,
                                    borderTop: "1px solid var(--bigram-rule)",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "var(--font-jetbrains-mono)",
                                        fontSize: 11,
                                        letterSpacing: ".14em",
                                        textTransform: "uppercase",
                                        color: "var(--bigram-muted)",
                                    }}
                                >
                                    {t("bigramNarrative.corpusCounting.totalLabel")}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "var(--font-jetbrains-mono)",
                                        fontSize: 17,
                                        fontWeight: 600,
                                        color: "var(--bigram-ink)",
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {totalFound}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* VERDICT + coda + replay — plain-language conclusion in the sage voice */}
                    <AnimatePresence>
                        {done && winner && totalFound > 0 && (
                            <motion.div
                                key="verdict"
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: reduce ? 0 : 0.35,
                                    ease: [0.2, 0.8, 0.2, 1],
                                }}
                                style={{ marginTop: 22, textAlign: "center" }}
                            >
                                <Verdict
                                    label={t("bigramNarrative.corpusCounting.verdictLabel")}
                                    main={
                                        <VerdictSentence
                                            char={displayChar(selectedChar)}
                                            best={displayChar(winner[0])}
                                            template={t(
                                                "bigramNarrative.corpusCounting.verdictMain"
                                            )}
                                        />
                                    }
                                    sub={t("bigramNarrative.corpusCounting.verdictSub", {
                                        n: winner[1],
                                        total: totalFound,
                                        pct: winnerPct,
                                    })}
                                />

                                {/* serif italic coda — the whole algorithm in one sentence */}
                                <p
                                    style={{
                                        fontFamily: "var(--font-source-serif)",
                                        fontStyle: "italic",
                                        fontSize: 17,
                                        color: "var(--bigram-muted)",
                                        margin: "16px auto 18px",
                                        maxWidth: "42ch",
                                        textWrap: "pretty",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {t("bigramNarrative.corpusCounting.reveal")}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => selectedChar && startScan(selectedChar)}
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
                                    ↻ {t("bigramNarrative.corpusCounting.replay")}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
});

/* ─── Inline count-row — v10 `.bw-corpus__counts .barrow` (integer count, max-normalized) ─── */
const CountRow = memo(function CountRow({
    src,
    dst,
    count,
    max,
    top,
    pop,
    reduce,
}: {
    src: string;
    dst: string;
    count: number;
    max: number;
    top: boolean;
    pop: boolean;
    reduce: boolean;
}) {
    const isSpace = dst === " ";
    const width = `${Math.round((count / Math.max(max, 1)) * 100)}%`;

    return (
        <motion.div
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 34px",
                alignItems: "center",
                gap: 18,
                margin: "11px 0",
            }}
        >
            {/* label — src→dst pair */}
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 17,
                    fontWeight: 600,
                    color: "var(--bigram-ink)",
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 2,
                    whiteSpace: "nowrap",
                }}
            >
                <span style={{ color: "var(--bigram-dim)", fontWeight: 500 }}>
                    {displayChar(src)}
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
                              }
                            : {
                                  color: top
                                      ? "var(--bigram-accent-ink)"
                                      : "var(--bigram-ink)",
                                  fontWeight: 700,
                                  fontSize: "1.05em",
                              }
                    }
                >
                    {displayChar(dst)}
                </span>
            </span>

            {/* 6px sunk track + max-normalized fill */}
            <span
                style={{
                    position: "relative",
                    height: 6,
                    borderRadius: 6,
                    overflow: "hidden",
                    background: "color-mix(in oklab, var(--bigram-ink) 10%, transparent)",
                }}
            >
                <motion.i
                    animate={{ width }}
                    transition={
                        reduce
                            ? { duration: 0 }
                            : { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }
                    }
                    style={{
                        display: "block",
                        height: "100%",
                        borderRadius: 6,
                        background: top
                            ? "var(--bigram-accent-bright)"
                            : "var(--bigram-accent-2)",
                    }}
                />
            </span>

            {/* integer count — pops every step on the changed follower */}
            <motion.span
                key={`${dst}-${count}`}
                animate={pop ? { scale: [1.7, 1] } : { scale: 1 }}
                transition={
                    pop
                        ? { duration: 0.44, ease: [0.2, 0.8, 0.2, 1] }
                        : { duration: 0 }
                }
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 15,
                    fontWeight: 600,
                    color: top ? "var(--bigram-accent)" : "var(--bigram-muted)",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {count}
            </motion.span>
        </motion.div>
    );
});

/* ─── status-line control (pause / next) ─── */
function statusBtnStyle(isNext: boolean): React.CSSProperties {
    return {
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: 11,
        letterSpacing: ".06em",
        padding: "5px 12px",
        border: 0,
        borderRadius: "var(--bigram-r-sm)",
        cursor: "pointer",
        background: isNext ? "var(--bigram-accent)" : "transparent",
        color: isNext ? "var(--bigram-on-accent)" : "var(--bigram-muted)",
        boxShadow: isNext ? "none" : "inset 0 0 0 1px var(--bigram-rule-2)",
    };
}

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
    // Split on the two placeholders, keeping the surrounding copy intact and translatable.
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
