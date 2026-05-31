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
 * CorpusCountingIdea — the "bw-corpus" visualizer (Bigram chapter, v8 · editorial-green).
 *
 * ONE concept: *count what follows a chosen character across real text, then bet on the most
 * frequent follower.* A calm scientific instrument — not a dashboard.
 *
 *  • the character picker is a SEGMENTED CONTROL (sunk --bigram-bg-2 rail, active cell filled accent);
 *  • the training phrase is the HERO (large, centered, in a sunk --bigram-bg-2 panel);
 *  • the current pair carries TWO highlights — origin filled (hot1), follower tinted (hot2);
 *  • the scan is slow (~950ms) so the eye can follow each match; auto → pause → manual stays;
 *  • running counts render as the shared HonestBar (winner marked `top`, brighter & last);
 *  • it ends with the plain-language Verdict ("After X, the most likely is Y").
 *
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 */

/* ─── Corpus text — a real English excerpt, short for visual clarity ─── */
const CORPUS =
    "the cat sat on the mat and the hat was flat the bat sat that the rat ate the fat cat";

/* ─── Characters the learner can choose ─── */
const SELECTABLE_CHARS = ["t", "a", "e", "h", "s", " "];

/* ─── Pacing ─── */
const SCAN_DELAY_MS = 950; // slow, legible scan — the eye follows each match
const FIRST_STEP_MS = 480; // settle before the first match lands
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
        if (index >= positions.length) {
            setScanning(false);
            setDone(true);
            return;
        }
        setScanIndex(index);
        const follower = CORPUS[positions[index] + 1];
        setTally((prev) => ({ ...prev, [follower]: (prev[follower] ?? 0) + 1 }));

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

    /* ── Cleanup on unmount ── */
    useEffect(() => clearTimer, [clearTimer]);

    /* ── Pause the auto-scan and hand control to the learner ── */
    const pauseScan = useCallback(() => {
        clearTimer();
        manualRef.current = true;
        setManualMode(true);
    }, [clearTimer]);

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

    const maxCount = ranked.length > 0 ? ranked[0][1] : 0;
    // Honest axis: the winner's share of matches becomes the full track, so every other bar
    // reads as its true proportion of the matches — never normalised to 100 %.
    const axis = totalFound > 0 ? Math.max(maxCount / totalFound, 0.0001) : 0.5;

    const winner = ranked[0];
    const winnerPct =
        winner && totalFound > 0
            ? `${Math.round((winner[1] / totalFound) * 100)}%`
            : "";

    const liveFollower =
        currentPos >= 0 ? CORPUS[currentPos + 1] : null;

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
                        const locked = scanning && !active;
                        return (
                            <button
                                key={ch}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                disabled={locked}
                                onClick={() => startScan(ch)}
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
                                    cursor: locked ? "default" : "pointer",
                                    background: "transparent",
                                    color: active
                                        ? "var(--bigram-on-accent)"
                                        : "var(--bigram-muted)",
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
                        margin: "16px 0 4px",
                    }}
                >
                    {t("bigramNarrative.corpusCounting.hint")}
                </p>
            )}

            {/* ── Stage: phrase hero + counts + verdict ── */}
            {selectedChar !== null && (
                <div style={{ marginTop: 8 }}>
                    {/* status line — current pair · match counter · pause/next */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 14,
                            flexWrap: "wrap",
                            minHeight: 26,
                            margin: "18px 0 2px",
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {scanning && liveFollower != null ? (
                                <motion.div
                                    key={`status-${scanIndex}`}
                                    initial={reduce ? false : { opacity: 0, y: -3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={reduce ? undefined : { opacity: 0, y: 3 }}
                                    transition={{ duration: 0.18 }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 14,
                                        flexWrap: "wrap",
                                        justifyContent: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "var(--font-jetbrains-mono)",
                                            fontSize: 19,
                                            fontWeight: 600,
                                            color: "var(--bigram-accent)",
                                        }}
                                    >
                                        {displayChar(selectedChar)}
                                        <span
                                            style={{
                                                margin: "0 4px",
                                                color: "var(--bigram-dim)",
                                                fontWeight: 400,
                                                fontSize: 14,
                                            }}
                                        >
                                            →
                                        </span>
                                        {displayChar(liveFollower)}
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
                                    {!manualMode ? (
                                        <button
                                            type="button"
                                            onClick={pauseScan}
                                            style={statusBtnStyle(false)}
                                        >
                                            {t("bigramNarrative.corpusCounting.pauseBtn")}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={advanceManual}
                                            style={statusBtnStyle(true)}
                                        >
                                            {t("bigramNarrative.corpusCounting.nextBtn")}
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                done && (
                                    <motion.span
                                        key="status-done"
                                        initial={reduce ? false : { opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{
                                            fontFamily: "var(--font-jetbrains-mono)",
                                            fontSize: 12.5,
                                            color: "var(--bigram-dim)",
                                            fontVariantNumeric: "tabular-nums",
                                            textAlign: "center",
                                        }}
                                    >
                                        {t("bigramNarrative.corpusCounting.found", {
                                            count: totalFound,
                                            char: displayChar(selectedChar),
                                        })}
                                    </motion.span>
                                )
                            )}
                        </AnimatePresence>
                    </div>

                    {/* THE HERO — the training phrase, large & centered in a sunk panel */}
                    <div style={{ marginTop: 12 }}>
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
                            {t("bigramNarrative.corpusCounting.corpusLabel")}
                        </p>
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
                                const isPastOrigin =
                                    !isOrigin &&
                                    char === selectedChar &&
                                    originPositions.includes(i) &&
                                    scanIndex > originPositions.indexOf(i);

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
                                } else if (isPastOrigin) {
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
                                        {isSpace ? (isOrigin || isFollower ? SPACE_GLYPH : " ") : char}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* RUNNING COUNTS — shared HonestBar; winner = top, brighter, last */}
                    <div style={{ marginTop: 20, minHeight: 36 }}>
                        <p
                            style={{
                                fontFamily: "var(--font-jetbrains-mono)",
                                fontSize: 11,
                                letterSpacing: ".2em",
                                textTransform: "uppercase",
                                color: "var(--bigram-muted)",
                                margin: "0 0 4px",
                                textAlign: "center",
                            }}
                        >
                            {t("bigramNarrative.corpusCounting.countsLabel")}
                        </p>
                        <AnimatePresence>
                            {ranked.map(([follower, count], rank) => {
                                const isWinner = done && rank === 0;
                                const fraction = totalFound > 0 ? count / totalFound : 0;
                                // Winner-last cascade only at the end: losers settle first, winner sweeps last.
                                const cascadeDelay = done
                                    ? (ranked.length - 1 - rank) * 0.08
                                    : 0;
                                return (
                                    <motion.div
                                        key={follower}
                                        layout={!reduce}
                                        initial={reduce ? false : { opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                                    >
                                        <HonestBar
                                            src={selectedChar}
                                            dst={follower}
                                            value={fraction}
                                            axis={axis}
                                            top={isWinner}
                                            glint={isWinner}
                                            countUp={done}
                                            delay={cascadeDelay}
                                        />
                                    </motion.div>
                                );
                            })}
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

                    {/* VERDICT + replay — plain-language conclusion in the sage voice */}
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
                                style={{ marginTop: 24, textAlign: "center" }}
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

                                <button
                                    type="button"
                                    onClick={() =>
                                        selectedChar && startScan(selectedChar)
                                    }
                                    style={{
                                        marginTop: 16,
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
                                    {t("bigramNarrative.corpusCounting.replay")}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
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
