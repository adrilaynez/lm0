"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { ANCHOR_SENTENCE, SPACE_GLYPH } from "@/features/lab/data/bigramCorpora";
import { useI18n } from "@/i18n/context";

/* ─── Default phrase (§2 anchor coherence) ───
   The §2 anchor is ANCHOR_SENTENCE ("the cat sat on the mat …"), the same corpus
   CorpusCountingIdea counts. To keep the example thread coherent (narrative pillar
   16) we walk the *opening* of that very sentence — not a separate toy string. The
   first 14 chars give a short phrase ("the cat sat on") with two clear repeats —
   `a→t` and `t→␣` — both touching the letter «t», so the eye is already on «t»
   right before the narrative pivots to "fijémonos en la «t»". Derived, never
   invented inline. Space renders as the glyph ␣ (U+2423), the dataset convention. */
const DEFAULT_TEXT = ANCHOR_SENTENCE.slice(0, 14); // "the cat sat on"
const MULT = "×"; // ×

const disp = (ch: string): string => (ch === " " ? SPACE_GLYPH : ch);
const keyOf = (a: string, b: string): string => `${a}→${b}`;

/* tallyUpTo — counts pairs keyed a→b in first-appearance order, up to `step`. */
function tallyUpTo(
    step: number,
    text: string,
): { counts: Record<string, number>; order: string[] } {
    const counts: Record<string, number> = {};
    const order: string[] = [];
    for (let i = 0; i <= step && i < text.length - 1; i++) {
        const k = keyOf(text[i], text[i + 1]);
        if (!(k in counts)) order.push(k);
        counts[k] = (counts[k] ?? 0) + 1;
    }
    return { counts, order };
}

/**
 * PairHighlighter — §2 "encuentra el patrón" (rework).
 *
 * ONE concept: walking a phrase two letters at a time, some pairs start *repeating*
 * — and a repeated pair is the whole secret of "what usually comes next".
 *
 * §2 rework (vs. the earlier port):
 *   • Anchor coherence — the walked phrase is the OPENING of the §2 anchor sentence
 *     (ANCHOR_SENTENCE, the corpus CorpusCountingIdea counts), not a separate toy
 *     string. The repeats it surfaces (`a→t`, `t→␣`) both touch «t», priming the
 *     immediate pivot to the t-focus widget that follows.
 *   • Copy reads from the Phase-1 keys `bigramNarrative.v2.pairHighlighter.*`.
 *
 * The current pair is highlighted IN the sentence: the origin char gets a filled
 * accent chip (hot1), the next char a soft accent tint with an inset ring (hot2). A
 * narrated line names the pair and whether it is new or a repeat. The running tally
 * renders as pills (appearance order) that tint the instant a pair appears a second
 * time — with a whole-pill heartbeat (bwPairCelebrate) at the 1→2 instant and a
 * count bounce (bwCountPop) on the current pair. A closing summary names the
 * repeated pairs explicitly.
 *
 * Self-mounting: no required props. Reads its data from the dataset and its copy via
 * useI18n. `accent` is accepted for call-site parity but the widget is already
 * fully scoped to --bigram-* (gated by [data-bigram-theme]); it never restyles.
 *
 * Reads only --bigram-* tokens and registered fonts. Reduced-motion disables the
 * heartbeat/pop beats and the layout animation.
 */
export interface PairHighlighterProps {
    /** Call-site parity only — the widget is permanently bigram-scoped. */
    accent?: "bigram";
}
export const PairHighlighter = memo(function PairHighlighter(
    // accent is accepted for call-site parity; the widget is already bigram-scoped.
    {}: PairHighlighterProps = {},
) {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [text, setText] = useState(DEFAULT_TEXT);
    const [step, setStep] = useState(-1); // -1 = prompt · 0..total-1 = current pair index
    const [finished, setFinished] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customText, setCustomText] = useState("");

    /* freshPair — true only when this exact step was reached via advance/start
       (v10's `freshPair` arg to update()). Drives the heartbeat + count pop. We
       record the step that was *freshly* advanced to; an incidental re-render at
       the same step does not match because it does not re-run the click handler.
       finish / count-all / replay / custom set freshStep = -1 (update(false)). */
    const [freshStep, setFreshStep] = useState(-1);

    const chars = useMemo(() => text.split(""), [text]);
    const total = chars.length - 1;
    const cur = step >= 0 && step < total ? step : -1;

    const { counts, order } = useMemo(
        () => tallyUpTo(step, text),
        [step, text],
    );

    const curKey = cur >= 0 ? keyOf(chars[cur], chars[cur + 1]) : null;
    const curSeen = curKey ? counts[curKey] : 0;
    const freshPair = !finished && cur >= 0 && cur === freshStep;

    /* ── Controls (v10 advance / start / replay / count-all / custom) ── */
    const start = useCallback(() => {
        setFreshStep(0);
        setStep(0);
        setFinished(false);
    }, []);

    const advance = useCallback(() => {
        const nx = step + 1;
        if (nx >= total) {
            setFinished(true); // freshPair stays false on finish (matches update())
            setFreshStep(-1);
        } else {
            setFreshStep(nx);
            setStep(nx);
        }
    }, [step, total]);

    const countAll = useCallback(() => {
        setFreshStep(-1);
        setStep(total - 1);
        setFinished(true);
    }, [total]);

    const replay = useCallback(() => {
        setFreshStep(-1);
        setStep(-1);
        setFinished(false);
        setShowCustomInput(false);
    }, []);

    const handleCustomSubmit = useCallback(() => {
        const v = customText.trim().toLowerCase().slice(0, 18);
        if (v.length >= 2) {
            setText(v);
            setFreshStep(-1);
            setStep(-1);
            setFinished(false);
            setShowCustomInput(false);
            setCustomText("");
        }
    }, [customText]);

    /* repeated pairs for the closing summary, in first-seen order */
    const repeats = useMemo(
        () => order.filter((k) => counts[k] >= 2),
        [order, counts],
    );

    const monoFont = "var(--font-jetbrains-mono)";
    const serifFont = "var(--font-source-serif)";

    return (
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
            {/* Component-scoped keyframes (cannot edit globals.css). Reduced-motion
                disables their use at the call sites below. */}
            <style>{`
@keyframes bwPairCelebrate {
  0% { transform: scale(1); }
  32% { transform: scale(1.2); }
  62% { transform: scale(.97); }
  100% { transform: scale(1); }
}
@keyframes bwCountPop { from { transform: scale(1.7); } to { transform: scale(1); } }
`}</style>

            {/* ── Opening prompt + start ── */}
            <AnimatePresence>
                {step === -1 && !finished && (
                    <motion.div
                        key="prompt"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: "center" }}
                    >
                        <p
                            style={{
                                fontFamily: serifFont,
                                fontStyle: "italic",
                                fontSize: 17,
                                lineHeight: 1.55,
                                color: "var(--bigram-muted)",
                                margin: "0 auto 22px",
                                maxWidth: "34ch",
                                textWrap: "pretty",
                            }}
                        >
                            {t("bigramNarrative.v2.pairHighlighter.stepPrompt")}
                        </p>
                        <StartButton onClick={start}>
                            {t("bigramNarrative.v2.pairHighlighter.startButton")}
                        </StartButton>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── RAIL · the phrase; current pair highlighted in place (hot1 + hot2) ── */}
            {step >= 0 && (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 3,
                        padding: "14px 10px 20px",
                    }}
                >
                    {chars.map((char, i) => {
                        const isSpace = char === " ";
                        const isHot1 = cur >= 0 && i === cur;
                        const isHot2 = cur >= 0 && i === cur + 1;
                        const isDone = cur >= 0 && i < cur;
                        const isAhead = cur >= 0 && i > cur + 1;

                        let color = "var(--bigram-dim)";
                        let background = "transparent";
                        let boxShadow: string | undefined;
                        let fontWeight = 500;

                        if (isHot1) {
                            color = "var(--bigram-on-accent)";
                            background = "var(--bigram-accent)";
                            fontWeight = 700;
                        } else if (isHot2) {
                            color = "var(--bigram-accent-ink)";
                            background = "var(--bigram-accent-soft)";
                            boxShadow =
                                "inset 0 0 0 2px color-mix(in oklab, var(--bigram-accent) 38%, transparent)";
                            fontWeight = 700;
                        } else if (isDone) {
                            color =
                                "color-mix(in oklab, var(--bigram-ink) 40%, var(--bigram-dim))";
                        } else if (isAhead) {
                            color =
                                "color-mix(in oklab, var(--bigram-dim) 52%, transparent)";
                        }

                        return (
                            <span
                                key={`${text}-${i}`}
                                style={{
                                    fontFamily: monoFont,
                                    fontSize: "clamp(38px, 7.6vw, 54px)",
                                    fontWeight,
                                    lineHeight: 1,
                                    color,
                                    background,
                                    boxShadow,
                                    padding: isSpace ? "5px 7px" : "5px 4px",
                                    borderRadius: 10,
                                    userSelect: "none",
                                    transition:
                                        "color .26s ease, background .26s ease, box-shadow .26s ease, font-weight .26s",
                                }}
                            >
                                {disp(char)}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* ── Narrated current pair: "Par actual  t→h  · visto 2× · ¡se repite!" ── */}
            {step >= 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 14,
                        flexWrap: "wrap",
                        minHeight: 26,
                        margin: "0 0 20px",
                        opacity: cur >= 0 ? 1 : 0,
                    }}
                >
                    {cur >= 0 ? (
                        <>
                            <span
                                style={{
                                    fontFamily: monoFont,
                                    fontSize: 10.5,
                                    letterSpacing: ".2em",
                                    textTransform: "uppercase",
                                    color: "var(--bigram-muted)",
                                }}
                            >
                                {t("bigramNarrative.v2.pairHighlighter.currentPairLabel")}
                            </span>

                            {/* the pair itself: src dim → dst accent-ink */}
                            <span
                                style={{
                                    fontFamily: monoFont,
                                    fontSize: 24,
                                    display: "inline-flex",
                                    alignItems: "baseline",
                                }}
                            >
                                <span style={{ color: "var(--bigram-dim)" }}>
                                    {disp(chars[cur])}
                                </span>
                                <span
                                    style={{
                                        color: "var(--bigram-dim)",
                                        fontSize: 15,
                                        margin: "0 4px",
                                    }}
                                >
                                    →
                                </span>
                                <span
                                    style={{
                                        color: "var(--bigram-accent-ink)",
                                        fontWeight: 600,
                                    }}
                                >
                                    {disp(chars[cur + 1])}
                                </span>
                            </span>

                            {/* first time / it repeats */}
                            <span
                                style={{
                                    fontFamily: monoFont,
                                    fontSize: 12.5,
                                    fontWeight: curSeen >= 2 ? 600 : 400,
                                    color:
                                        curSeen >= 2
                                            ? "var(--bigram-accent)"
                                            : "var(--bigram-dim)",
                                }}
                            >
                                {curSeen >= 2
                                    ? t("bigramNarrative.v2.pairHighlighter.seenRepeats", {
                                        n: curSeen,
                                    })
                                    : t("bigramNarrative.v2.pairHighlighter.firstTime")}
                            </span>
                        </>
                    ) : (
                        <span aria-hidden>&nbsp;</span>
                    )}
                </div>
            )}

            {/* ── Count header (no bottom border) ── */}
            {step >= 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        margin: "0 0 14px",
                    }}
                >
                    <span
                        style={{
                            fontFamily: monoFont,
                            fontSize: 11,
                            letterSpacing: ".2em",
                            textTransform: "uppercase",
                            color: "var(--bigram-muted)",
                        }}
                    >
                        {t("bigramNarrative.v2.pairHighlighter.countsLabel")}
                    </span>
                    <span
                        style={{
                            fontFamily: monoFont,
                            fontSize: 12,
                            color: "var(--bigram-dim)",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {step >= 0 ? Math.min(step + 1, total) : 0} / {total}
                    </span>
                </div>
            )}

            {/* ── Running tally · pills in appearance order ── */}
            {step >= 0 && (
                <motion.div
                    layout={!reduce}
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 10,
                        minHeight: 44,
                    }}
                >
                    <AnimatePresence initial={false}>
                        {order.map((k) => {
                            const n = counts[k];
                            const [src, dst] = k.split("→");
                            const isCur = k === curKey && freshPair;
                            const justRep = isCur && n === 2; // the 1→2 instant: the heartbeat
                            const popCount = isCur; // count bounce on the current pair
                            const rep = n >= 2;

                            return (
                                <motion.div
                                    key={k}
                                    layout={!reduce}
                                    transition={
                                        reduce
                                            ? { duration: 0 }
                                            : { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }
                                    }
                                    style={{
                                        zIndex: k === curKey ? 1 : 0,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 11,
                                        padding: "7px 8px 7px 15px",
                                        borderRadius: "var(--bigram-r-pill)",
                                        background: rep
                                            ? "var(--bigram-accent-soft)"
                                            : "color-mix(in oklab, var(--bigram-ink) 5%, transparent)",
                                        boxShadow: rep
                                            ? "inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 26%, transparent)"
                                            : undefined,
                                        animation:
                                            justRep && !reduce
                                                ? "bwPairCelebrate .64s cubic-bezier(.2,.8,.2,1)"
                                                : undefined,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: monoFont,
                                            fontSize: 18,
                                            display: "inline-flex",
                                            alignItems: "baseline",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: rep
                                                    ? "color-mix(in oklab, var(--bigram-accent) 60%, var(--bigram-dim))"
                                                    : "var(--bigram-dim)",
                                            }}
                                        >
                                            {disp(src)}
                                        </span>
                                        <span
                                            style={{
                                                color: rep
                                                    ? "color-mix(in oklab, var(--bigram-accent) 60%, var(--bigram-dim))"
                                                    : "var(--bigram-dim)",
                                                fontSize: 13,
                                                margin: "0 3px",
                                            }}
                                        >
                                            →
                                        </span>
                                        <span
                                            style={{
                                                color: rep
                                                    ? "var(--bigram-accent-ink)"
                                                    : "var(--bigram-ink)",
                                                fontWeight: rep ? 600 : 500,
                                            }}
                                        >
                                            {disp(dst)}
                                        </span>
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: monoFont,
                                            fontSize: 12.5,
                                            fontWeight: 700,
                                            color: rep
                                                ? "var(--bigram-on-accent)"
                                                : "var(--bigram-dim)",
                                            fontVariantNumeric: "tabular-nums",
                                            minWidth: 23,
                                            height: 23,
                                            borderRadius: "50%",
                                            display: "inline-grid",
                                            placeItems: "center",
                                            background: rep
                                                ? "var(--bigram-accent)"
                                                : "color-mix(in oklab, var(--bigram-ink) 9%, transparent)",
                                            animation:
                                                popCount && !reduce
                                                    ? "bwCountPop .44s cubic-bezier(.2,.8,.2,1)"
                                                    : undefined,
                                        }}
                                    >
                                        {n}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Closing pattern summary ── */}
            <AnimatePresence>
                {finished && (
                    <motion.div
                        key="summary"
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 9,
                            flexWrap: "wrap",
                            marginTop: 30,
                            paddingTop: 24,
                            borderTop: "1px solid var(--bigram-rule)",
                            fontFamily: serifFont,
                            fontSize: 16,
                            lineHeight: 1.5,
                            color: "var(--bigram-ink-2)",
                            textAlign: "center",
                            textWrap: "pretty",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: monoFont,
                                fontSize: 11,
                                letterSpacing: ".16em",
                                textTransform: "uppercase",
                                color: "var(--bigram-accent)",
                            }}
                        >
                            {t("bigramNarrative.v2.pairHighlighter.patternLabel")}
                        </span>

                        {repeats.length > 0 ? (
                            <>
                                <span>
                                    {t("bigramNarrative.v2.pairHighlighter.patternRepeats")}
                                </span>
                                {repeats.map((k) => {
                                    const [src, dst] = k.split("→");
                                    return (
                                        <RepeatToken
                                            key={k}
                                            src={src}
                                            dst={dst}
                                            count={counts[k]}
                                            mono={monoFont}
                                        />
                                    );
                                })}
                            </>
                        ) : (
                            <span>
                                {t("bigramNarrative.v2.pairHighlighter.patternUnique")}
                            </span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Step controls ── */}
            {step >= 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 14,
                        marginTop: 22,
                        flexWrap: "wrap",
                    }}
                >
                    {!finished ? (
                        <>
                            <StartButton onClick={advance}>
                                {t("bigramNarrative.v2.pairHighlighter.nextStep")}
                                <span
                                    style={{
                                        marginLeft: 9,
                                        opacity: 0.55,
                                        fontSize: 11,
                                        fontWeight: 500,
                                    }}
                                >
                                    {step + 1}/{total}
                                </span>
                            </StartButton>
                            <GhostButton onClick={countAll}>
                                {t("bigramNarrative.v2.pairHighlighter.countAll")} →
                            </GhostButton>
                        </>
                    ) : (
                        <>
                            <GhostButton onClick={replay}>
                                ↻ {t("bigramNarrative.v2.pairHighlighter.replay")}
                            </GhostButton>
                            <GhostButton onClick={() => setShowCustomInput((v) => !v)}>
                                {t("bigramNarrative.v2.pairHighlighter.tryOwn")}
                            </GhostButton>
                        </>
                    )}
                </div>
            )}

            {/* ── Custom phrase input ── */}
            <AnimatePresence>
                {showCustomInput && (
                    <motion.div
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden" }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                marginTop: 20,
                            }}
                        >
                            <input
                                type="text"
                                value={customText}
                                maxLength={18}
                                onChange={(e) => setCustomText(e.target.value.slice(0, 18))}
                                onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                                placeholder={t("bigramNarrative.v2.pairHighlighter.placeholder")}
                                aria-label={t("bigramNarrative.v2.pairHighlighter.tryOwn")}
                                autoFocus
                                style={{
                                    fontFamily: monoFont,
                                    fontSize: 17,
                                    width: 190,
                                    padding: "12px 16px",
                                    textAlign: "center",
                                    border: 0,
                                    borderRadius: "var(--bigram-r-sm)",
                                    background: "var(--bigram-bg-2)",
                                    color: "var(--bigram-ink)",
                                    boxShadow: "inset 0 -2px 0 0 var(--bigram-rule-2)",
                                    outline: "none",
                                }}
                            />
                            <StartButton
                                onClick={handleCustomSubmit}
                                disabled={customText.trim().length < 2}
                            >
                                {t("bigramNarrative.v2.pairHighlighter.go")}
                            </StartButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/* ─────────────── Local buttons (token-only, v10 .btn vocabulary) ─────────────── */

function StartButton({
    children,
    onClick,
    disabled,
}: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 12,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                fontWeight: 600,
                padding: "12px 18px",
                borderRadius: "var(--bigram-r-sm)",
                border: 0,
                background: "var(--bigram-accent)",
                color: "var(--bigram-on-accent)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                whiteSpace: "nowrap",
                transition: "background .2s, box-shadow .2s, opacity .2s",
            }}
            onMouseEnter={(e) => {
                if (!disabled)
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

function GhostButton({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 12,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                fontWeight: 600,
                padding: "12px 18px",
                borderRadius: "var(--bigram-r-sm)",
                border: 0,
                background: "transparent",
                color: "var(--bigram-accent)",
                cursor: "pointer",
                whiteSpace: "nowrap",
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

/* Repeated-pair token used in the closing summary (mirrors .bw-pairs__summary .rp,
   including the ×N count). */
function RepeatToken({
    src,
    dst,
    count,
    mono,
}: {
    src: string;
    dst: string;
    count: number;
    mono: string;
}) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 4,
                fontFamily: mono,
                fontSize: 15,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: "var(--bigram-r-pill)",
                background: "var(--bigram-accent-soft)",
                color: "var(--bigram-accent-ink)",
                boxShadow:
                    "inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 24%, transparent)",
            }}
        >
            <span
                style={{
                    color: "color-mix(in oklab, var(--bigram-accent) 55%, var(--bigram-dim))",
                    fontWeight: 500,
                }}
            >
                {disp(src)}
            </span>
            <span
                style={{
                    color: "color-mix(in oklab, var(--bigram-accent) 55%, var(--bigram-dim))",
                    fontSize: 12,
                    margin: "0 1px",
                }}
            >
                →
            </span>
            <span>{disp(dst)}</span>
            {MULT}
            {count}
        </span>
    );
}
