"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Verdict } from "@/features/lab/components/bigram/Verdict";
import {
    COMPARABLE_CHARS,
    CORPUS_A,
    CORPUS_B,
    displayChar,
    type FollowerCount,
    getCorpusRow,
    rowTotal,
} from "@/features/lab/data/bigramCorpora";
import { useI18n } from "@/i18n/context";

/**
 * TrainingTextComparison — §4 of the Bigram chapter (editorial-green).
 *
 * ONE concept: *the model is a mirror of the text you trained it on.* Same algorithm, same letter —
 * but feed it two different books and it learns two different rows. The point lands the instant the
 * two distributions sit side by side and visibly disagree.
 *
 * THE BEAT (predict → reveal → name it):
 *   1 · IDLE       — pick a letter from the segmented control.
 *   2 · PREDICT    — Shakespeare's row reveals first (honest bars on a SHARED axis). The user is asked
 *                    a yes/no: "will another book learn the same thing?" — they commit a guess.
 *   3 · REVEAL     — the Modern row slides in on the SAME honest axis, so the two panels are directly
 *                    comparable. Followers whose share or rank diverged glint sage and carry a Δ badge.
 *   4 · VERDICT    — the sage panel names it: "Same algorithm, different text, different machine."
 *
 * HONEST AXIS: both panels share one axis (the largest single share across BOTH rows of the chosen
 * letter), so a taller bar in one text literally means "this text leaned harder on that follower" —
 * never re-normalised per panel, which would hide the divergence.
 *
 * Auto-mountable: no required props (reads its corpora from `bigramCorpora`, its copy from i18n).
 * Reads only --bigram-* tokens + the registered fonts; gated by the chapter's [data-bigram-theme] scope.
 */

/* ─── Tuning ─── */
const EASE = [0.2, 0.8, 0.2, 1] as const;
const REVEAL_MS = 760; // pause on the prediction before the second text slides in (auto path)

/* Δ thresholds for flagging a follower as "diverged" between the two texts. */
const SHARE_DELTA = 0.04; // share moved by ≥4 percentage points
const RANK_DELTA = 1; // OR the follower climbed/dropped by ≥1 rank

type Phase = "idle" | "predict" | "reveal";

/** A follower aligned across both texts, with its share in each and a divergence verdict. */
interface AlignedFollower {
    char: string;
    /** share of the row in text A (0..1), or null if absent from that text's row. */
    shareA: number | null;
    /** share of the row in text B (0..1), or null if absent. */
    shareB: number | null;
    rankA: number | null;
    rankB: number | null;
    /** |shareB − shareA| in points; used for the Δ badge. */
    shareDelta: number;
    /** true when this follower meaningfully diverged between the two texts. */
    diverged: boolean;
}

/* ─── Helpers ─── */
function sharesOf(followers: FollowerCount[]): Map<string, { share: number; rank: number }> {
    const total = rowTotal(followers) || 1;
    const map = new Map<string, { share: number; rank: number }>();
    followers.forEach((f, i) => map.set(f.char, { share: f.count / total, rank: i }));
    return map;
}

/**
 * Align the two corpus rows of `origin` into one ordered list. Order follows text A's ranking, with
 * any followers unique to text B appended — so the eye reads A top-to-bottom and B's extras after.
 */
function alignRows(origin: string): AlignedFollower[] {
    const rowA = getCorpusRow(CORPUS_A, origin) ?? [];
    const rowB = getCorpusRow(CORPUS_B, origin) ?? [];
    const a = sharesOf(rowA);
    const b = sharesOf(rowB);

    const order: string[] = [];
    const seen = new Set<string>();
    for (const f of rowA) {
        if (!seen.has(f.char)) { order.push(f.char); seen.add(f.char); }
    }
    for (const f of rowB) {
        if (!seen.has(f.char)) { order.push(f.char); seen.add(f.char); }
    }

    return order.map((char) => {
        const ea = a.get(char) ?? null;
        const eb = b.get(char) ?? null;
        const shareA = ea ? ea.share : null;
        const shareB = eb ? eb.share : null;
        const rankA = ea ? ea.rank : null;
        const rankB = eb ? eb.rank : null;
        const shareDelta = Math.abs((shareB ?? 0) - (shareA ?? 0));
        const presenceFlip = (shareA === null) !== (shareB === null);
        const rankFlip =
            rankA !== null && rankB !== null && Math.abs(rankA - rankB) >= RANK_DELTA;
        const diverged = presenceFlip || shareDelta >= SHARE_DELTA || rankFlip;
        return { char, shareA, shareB, rankA, rankB, shareDelta, diverged };
    });
}

/* ─── Component ─── */
export const TrainingTextComparison = memo(function TrainingTextComparison() {
    const { t } = useI18n();
    const reduce = useReducedMotion();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [phase, setPhase] = useState<Phase>("idle");

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);
    useEffect(() => clearTimer, [clearTimer]);

    /* ── Pick a letter → show text A, ask the prediction ── */
    const pickChar = useCallback(
        (ch: string) => {
            clearTimer();
            setSelectedChar(ch);
            setPhase("predict");
        },
        [clearTimer]
    );

    /* ── Commit a guess (which corpus you bet on) → reveal text B after a short beat. The bet itself
       isn't graded — the truth (the two texts disagree) lands visually when B slides in beside A. ── */
    const commitGuess = useCallback(() => {
        clearTimer();
        if (reduce) {
            setPhase("reveal");
            return;
        }
        timerRef.current = setTimeout(() => setPhase("reveal"), REVEAL_MS);
    }, [clearTimer, reduce]);

    const aligned = useMemo(
        () => (selectedChar ? alignRows(selectedChar) : []),
        [selectedChar]
    );

    // Shared honest axis: the single largest share across BOTH rows, so the panels are comparable.
    const axis = useMemo(() => {
        let max = 0;
        for (const f of aligned) {
            max = Math.max(max, f.shareA ?? 0, f.shareB ?? 0);
        }
        return Math.max(max, 0.0001);
    }, [aligned]);

    const showB = phase === "reveal";

    return (
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
            {/* ── Picker label ── */}
            <p style={pickerLabelStyle}>{t("bigramNarrative.v2.trainingComparison.pickCharPrompt")}</p>

            {/* ── Segmented control: the letters present in BOTH texts ── */}
            <div style={{ textAlign: "center" }}>
                <div role="radiogroup" aria-label={t("bigramNarrative.v2.trainingComparison.pickCharPrompt")} style={railStyle}>
                    {COMPARABLE_CHARS.map((ch) => {
                        const active = selectedChar === ch;
                        return (
                            <button
                                key={ch}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                aria-label={ch === " " ? "espacio" : ch}
                                onClick={() => pickChar(ch)}
                                style={chipStyle(active)}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="ttc-seg"
                                        aria-hidden
                                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }}
                                        style={chipFillStyle}
                                    />
                                )}
                                <span style={{ position: "relative", zIndex: 1 }}>{displayChar(ch)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Idle hint ── */}
            {phase === "idle" && (
                <p style={idleHintStyle}>{t("bigramNarrative.v2.trainingComparison.idle")}</p>
            )}

            {/* ── Stage: two panels, shared honest axis ── */}
            {selectedChar !== null && (
                <div style={{ marginTop: 22 }}>
                    {/* The chosen letter, restated once so the data is never ambiguous. */}
                    <p style={rowForStyle}>
                        {t("bigramNarrative.v2.trainingComparison.rowFor", { char: displayChar(selectedChar) })}
                    </p>

                    {/* TEXT A — Shakespeare. Always present once a letter is chosen. */}
                    <CorpusPanel
                        title={t("bigramNarrative.v2.trainingComparison.corpusA")}
                        origin={selectedChar}
                        aligned={aligned}
                        axis={axis}
                        side="A"
                        revealed
                        reduce={!!reduce}
                    />

                    {/* THE PREDICTION — committed once, before text B exists. */}
                    <AnimatePresence initial={false}>
                        {phase === "predict" && (
                            <PredictionGate
                                key="predict"
                                question={t("bigramNarrative.v2.trainingComparison.toggleLabel")}
                                corpusAName={t("bigramNarrative.v2.trainingComparison.corpusA")}
                                corpusBName={t("bigramNarrative.v2.trainingComparison.corpusB")}
                                onGuess={commitGuess}
                                reduce={!!reduce}
                            />
                        )}
                    </AnimatePresence>

                    {/* TEXT B — Modern. Slides in only after the guess. */}
                    <AnimatePresence initial={false}>
                        {showB && (
                            <motion.div
                                key="panel-b"
                                initial={reduce ? false : { opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                                transition={{ duration: 0.42, ease: EASE }}
                            >
                                <CorpusPanel
                                    title={t("bigramNarrative.v2.trainingComparison.corpusB")}
                                    origin={selectedChar}
                                    aligned={aligned}
                                    axis={axis}
                                    side="B"
                                    revealed
                                    reduce={!!reduce}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* VERDICT — once both rows are on screen, name the idea. */}
                    <AnimatePresence>
                        {showB && (
                            <motion.div
                                key="verdict"
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: reduce ? 0 : 0.5, ease: EASE }}
                                style={{ marginTop: 26 }}
                            >
                                {/* The differences are already lit up sage in the bars above (show > tell);
                                    the verdict only names the idea. `verdict` = main sentence, `diffHint` =
                                    the one-line "why" sub. */}
                                <Verdict
                                    label={t("bigramNarrative.v2.trainingComparison.corpusA") + " · " + t("bigramNarrative.v2.trainingComparison.corpusB")}
                                    main={
                                        <VerdictSentence
                                            template={t("bigramNarrative.v2.trainingComparison.verdict")}
                                        />
                                    }
                                    sub={t("bigramNarrative.v2.trainingComparison.diffHint")}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
});

/* ─── One corpus panel: a titled row of comparison bars on the shared honest axis ─── */
const CorpusPanel = memo(function CorpusPanel({
    title,
    origin,
    aligned,
    axis,
    side,
    revealed,
    reduce,
}: {
    title: string;
    origin: string;
    aligned: AlignedFollower[];
    axis: number;
    side: "A" | "B";
    revealed: boolean;
    reduce: boolean;
}) {
    // Only show followers this text actually has a share for; keep the parent's order.
    const rows = aligned.filter((f) => (side === "A" ? f.shareA : f.shareB) !== null);

    return (
        <section
            aria-label={title}
            style={{
                marginTop: side === "B" ? 16 : 10,
                padding: "16px 18px 8px",
                borderRadius: "var(--bigram-r-lg)",
                background: "var(--bigram-bg-2)",
                boxShadow: "inset 0 1px 4px rgba(0,0,0,.22)",
            }}
        >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                <span style={panelTitleStyle}>{title}</span>
                <span style={panelTagStyle}>{side === "A" ? "01" : "02"}</span>
            </div>

            <div>
                {rows.map((f, i) => {
                    const share = (side === "A" ? f.shareA : f.shareB) ?? 0;
                    const isTop = i === 0;
                    // winner-last cascade, matching the rest of the chapter
                    const delay = reduce ? 0 : (rows.length - 1 - i) * 0.06;
                    return (
                        <ComparisonBar
                            key={f.char}
                            src={origin}
                            dst={f.char}
                            value={share}
                            axis={axis}
                            top={isTop}
                            // text B is where divergence is the story → glint diverged followers sage
                            diverged={side === "B" && f.diverged}
                            shareDelta={f.shareDelta}
                            countUp={revealed}
                            delay={delay}
                            reduce={reduce}
                        />
                    );
                })}
            </div>
        </section>
    );
});

/* ─── A single comparison bar — HonestBar geometry, plus a sage Δ glint when the follower diverged. ───
   We inline the bar (rather than reuse HonestBar) so a diverged follower in text B can carry a sage
   ring + Δ badge — the primitive has no notion of "this row disagrees with the other text". The track,
   axis honesty, label treatment and count-up all mirror HonestBar exactly. */
const ComparisonBar = memo(function ComparisonBar({
    src,
    dst,
    value,
    axis,
    top,
    diverged,
    shareDelta,
    countUp,
    delay,
    reduce,
}: {
    src: string;
    dst: string;
    value: number;
    axis: number;
    top: boolean;
    diverged: boolean;
    shareDelta: number;
    countUp: boolean;
    delay: number;
    reduce: boolean;
}) {
    const isSpace = dst === " ";
    const targetW = Math.min(100, (value / axis) * 100);
    const animate = countUp && !reduce;

    return (
        <div
            role="img"
            aria-label={`${src === " " ? "space" : src} followed by ${isSpace ? "space" : dst}, ${(
                value * 100
            ).toFixed(1)} percent${diverged ? ", diverges from the other text" : ""}`}
            style={{
                display: "grid",
                gridTemplateColumns: "92px 1fr auto",
                alignItems: "center",
                gap: 14,
                margin: "13px 0",
            }}
        >
            {/* label = src→dst pair */}
            <span style={pairLabelStyle}>
                <span style={{ color: "var(--bigram-dim)", fontWeight: 500 }}>{displayChar(src)}</span>
                <span style={{ color: "var(--bigram-dim)", fontWeight: 400, margin: "0 3px", fontSize: 13 }}>→</span>
                <span
                    style={
                        isSpace
                            ? { fontSize: 12, fontWeight: 600, letterSpacing: ".03em", color: "var(--bigram-dim)" }
                            : {
                                  color: diverged
                                      ? "var(--bigram-sage)"
                                      : top
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

            {/* sunk track + honest fill; diverged followers carry a sage ring */}
            <span
                style={{
                    position: "relative",
                    height: 12,
                    borderRadius: 6,
                    overflow: "hidden",
                    background: "color-mix(in oklab, var(--bigram-ink) 10%, transparent)",
                    display: "block",
                    boxShadow: diverged
                        ? "0 0 0 1.5px color-mix(in oklab, var(--bigram-sage) 55%, transparent)"
                        : "none",
                }}
            >
                <motion.span
                    initial={reduce ? false : { width: "0%" }}
                    animate={{ width: `${targetW}%` }}
                    transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay }}
                    style={{
                        position: "relative",
                        display: "block",
                        height: "100%",
                        borderRadius: 6,
                        overflow: "hidden",
                        background: diverged
                            ? "var(--bigram-sage)"
                            : top
                              ? "var(--bigram-accent-bright)"
                              : "var(--bigram-accent-2)",
                    }}
                >
                    {/* sage glint sweep on diverged followers — the "difference" lights up */}
                    {diverged && !reduce && (
                        <motion.span
                            aria-hidden
                            initial={{ left: "-45%", opacity: 0 }}
                            animate={{ left: ["-45%", "-45%", "115%"], opacity: [0, 1, 0] }}
                            transition={{ duration: 0.8, times: [0, 0.3, 1], ease: [0.16, 1, 0.3, 1], delay: delay + 0.36 }}
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                width: "45%",
                                pointerEvents: "none",
                                background: "linear-gradient(100deg, transparent, rgba(255,255,255,.5), transparent)",
                            }}
                        />
                    )}
                </motion.span>
            </span>

            {/* value + optional Δ badge */}
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 7,
                    justifyContent: "flex-end",
                    minWidth: 74,
                }}
            >
                <CountUpPct
                    key={`${value}:${delay}:${animate ? 1 : 0}`}
                    value={value}
                    animate={animate}
                    delay={delay}
                    top={top}
                    diverged={diverged}
                />
                {diverged && shareDelta > 0 && (
                    <motion.span
                        initial={reduce ? false : { opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: reduce ? 0 : delay + 0.45, ease: EASE }}
                        style={deltaBadgeStyle}
                    >
                        Δ{(shareDelta * 100).toFixed(0)}
                    </motion.span>
                )}
            </span>
        </div>
    );
});

/* ─── Count-up percentage (easeOutCubic), mirroring HonestBar's CountUpValue ─── */
const CountUpPct = memo(function CountUpPct({
    value,
    animate,
    delay,
    top,
    diverged,
}: {
    value: number;
    animate: boolean;
    delay: number;
    top: boolean;
    diverged: boolean;
}) {
    // Mirrors HonestBar.CountUpValue: at rest the value is shown instantly (progress = 1); only the
    // animate path runs the RAF. A changed target restarts cleanly because the caller keys this node,
    // so we never call setState synchronously in the effect body.
    const [progress, setProgress] = useState(animate ? 0 : 1);

    useEffect(() => {
        if (!animate) return;
        let cancelled = false;
        let raf = 0;
        let t0: number | null = null;
        const DUR = 620;
        const frame = (now: number) => {
            if (cancelled) return;
            if (t0 === null) t0 = now;
            const k = Math.min(1, (now - t0) / DUR);
            setProgress(1 - Math.pow(1 - k, 3));
            if (k < 1) raf = requestAnimationFrame(frame);
        };
        const timer = setTimeout(() => {
            raf = requestAnimationFrame(frame);
        }, Math.max(0, delay) * 1000);
        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            clearTimeout(timer);
        };
    }, [animate, delay]);

    return (
        <span
            aria-hidden
            style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 14,
                color: diverged ? "var(--bigram-sage)" : top ? "var(--bigram-muted)" : "var(--bigram-dim)",
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
            }}
        >
            {(value * progress * 100).toFixed(1)} %
        </span>
    );
});

/* ─── The prediction gate — bet which text the row will resemble, before text B exists (predict →
   reveal). The two buttons are the two corpus names; tapping either reveals B beside A. ─── */
const PredictionGate = memo(function PredictionGate({
    question,
    corpusAName,
    corpusBName,
    onGuess,
    reduce,
}: {
    question: string;
    corpusAName: string;
    corpusBName: string;
    onGuess: () => void;
    reduce: boolean;
}) {
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.34, ease: EASE }}
            style={{
                margin: "18px auto 0",
                maxWidth: 460,
                textAlign: "center",
            }}
        >
            <p style={gatePromptStyle}>
                {question}
                <span aria-hidden style={{ color: "var(--bigram-dim)" }}> ?</span>
            </p>
            <div style={{ display: "inline-flex", gap: 10 }}>
                <button type="button" onClick={onGuess} style={guessBtnStyle}>
                    {corpusAName}
                </button>
                <button type="button" onClick={onGuess} style={guessBtnStyle}>
                    {corpusBName}
                </button>
            </div>
        </motion.div>
    );
});

/* ─── Renders the verdict sentence, bolding any {x} placeholder (none expected, kept for parity) ─── */
function VerdictSentence({ template }: { template: string }) {
    const parts = template.split(/(\{[^}]+\})/g);
    return (
        <>
            {parts.map((part, i) =>
                /^\{[^}]+\}$/.test(part) ? <b key={i}>{part.replace(/[{}]/g, "")}</b> : <span key={i}>{part}</span>
            )}
        </>
    );
}

/* ─── Static styles ─── */
const pickerLabelStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 11,
    letterSpacing: ".2em",
    textTransform: "uppercase",
    color: "var(--bigram-muted)",
    margin: "0 0 10px",
    textAlign: "center",
};

const railStyle: React.CSSProperties = {
    display: "inline-flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    padding: 5,
    borderRadius: "var(--bigram-r-md)",
    background: "var(--bigram-bg-2)",
    boxShadow: "inset 0 1px 4px rgba(0,0,0,.28)",
};

function chipStyle(active: boolean): React.CSSProperties {
    return {
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
        cursor: active ? "default" : "pointer",
        background: "transparent",
        color: active ? "var(--bigram-on-accent)" : "var(--bigram-muted)",
        transition: "color .2s ease",
    };
}

const chipFillStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "var(--bigram-r-sm)",
    background: "var(--bigram-accent)",
    boxShadow: "0 5px 14px -5px color-mix(in oklab, var(--bigram-accent) 65%, transparent)",
    zIndex: 0,
};

const idleHintStyle: React.CSSProperties = {
    fontFamily: "var(--font-source-serif)",
    fontStyle: "italic",
    fontSize: 16,
    color: "var(--bigram-muted)",
    textAlign: "center",
    margin: "14px 0 4px",
};

const rowForStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 12,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: "var(--bigram-muted)",
    textAlign: "center",
    margin: "0 0 8px",
};

const panelTitleStyle: React.CSSProperties = {
    fontFamily: "var(--font-source-serif)",
    fontSize: 17,
    fontWeight: 600,
    color: "var(--bigram-ink)",
};

const panelTagStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 11,
    letterSpacing: ".1em",
    color: "var(--bigram-dim)",
    fontVariantNumeric: "tabular-nums",
};

const pairLabelStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 18,
    fontWeight: 600,
    color: "var(--bigram-ink)",
    display: "inline-flex",
    alignItems: "baseline",
    gap: 2,
    whiteSpace: "nowrap",
    fontVariantNumeric: "lining-nums tabular-nums",
};

const deltaBadgeStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: ".02em",
    color: "var(--bigram-sage)",
    background: "var(--bigram-sage-soft)",
    padding: "2px 6px",
    borderRadius: "var(--bigram-r-pill)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
};

const gatePromptStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 11,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    color: "var(--bigram-muted)",
    margin: "0 0 12px",
};

const guessBtnStyle: React.CSSProperties = {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: 12,
    letterSpacing: ".04em",
    padding: "9px 16px",
    border: 0,
    borderRadius: "var(--bigram-r-sm)",
    cursor: "pointer",
    background: "transparent",
    color: "var(--bigram-ink)",
    boxShadow: "inset 0 0 0 1px var(--bigram-rule-2)",
};
