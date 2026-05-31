"use client";

import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { PairChip } from "@/features/lab/components/bigram/PairChip";
import { useI18n } from "@/i18n/context";

/* ─── Types ─── */
type PairTally = { src: string; dst: string; key: string; count: number };
type LensRect = { left: number; top: number; width: number; height: number };

/* ─── Defaults ─── */
const DEFAULT_TEXT = "the cat sat";
const SPACE_GLYPH = "·"; // matches PairChip's space rendering

const disp = (ch: string): string => (ch === " " ? SPACE_GLYPH : ch);

/* Lens glide — sage frame slides pair→pair (the model's gaze moving forward). */
const LENS_EASE = [0.4, 0.85, 0.3, 1] as const;

/**
 * PairHighlighter — a meditative walk through a phrase, two letters at a time.
 *
 * ONE concept: scanning a phrase pair by pair, some pairs start *repeating*.
 *
 * A single persistent sage LENS glides from one pair to the next, framing the two
 * active characters (measured live from their span refs). A narrated line names the
 * current pair and whether it is new or a repeat. The running tally renders as
 * PairChips that tint the instant a pair appears a second time — so the pattern
 * pops out on its own. A closing summary names the repeated pairs explicitly.
 *
 * Replaces the old per-character connection line + sweeping "+1" badge with the
 * single sliding lens called for by the v8 spec ("bw-pairs").
 *
 * Reads only --bigram-* tokens (gated by the chapter's [data-bigram-theme] scope)
 * and the registered fonts. Reduced-motion safe.
 */
export const PairHighlighter = memo(function PairHighlighter() {
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const [text, setText] = useState(DEFAULT_TEXT);
    const [step, setStep] = useState(-1); // -1 = not started · 0..totalPairs-1 = current pair index
    const [finished, setFinished] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customText, setCustomText] = useState("");

    const chars = useMemo(() => text.split(""), [text]);
    const totalPairs = chars.length - 1;

    /* ── Active pair indices ── */
    const currentPairIdx = step >= 0 && step < totalPairs ? step : -1;

    /* ── Tally accumulated up to (and including) the current step ──
       Insertion order preserved; count tracked per pair key. */
    const { tally, currentKey, currentSeenCount } = useMemo(() => {
        if (step < 0) {
            return { tally: [] as PairTally[], currentKey: "", currentSeenCount: 0 };
        }
        const counts: Record<string, number> = {};
        const order: string[] = [];
        let curKey = "";
        let curSeen = 0;
        for (let i = 0; i <= step && i < totalPairs; i++) {
            const src = chars[i];
            const dst = chars[i + 1];
            const key = `${src}→${dst}`;
            if (!(key in counts)) order.push(key);
            counts[key] = (counts[key] ?? 0) + 1;
            if (i === step) {
                curKey = key;
                curSeen = counts[key];
            }
        }
        const built: PairTally[] = order.map((key) => {
            const [src, dst] = key.split("→");
            return { src, dst, key, count: counts[key] };
        });
        return { tally: built, currentKey: curKey, currentSeenCount: curSeen };
    }, [chars, step, totalPairs]);

    /* ── Final pattern: which pairs repeat (count >= 2), in first-seen order ── */
    const repeatedPairs = useMemo(
        () => tally.filter((p) => p.count >= 2),
        [tally],
    );

    /* ───────────────────────── Sliding lens ─────────────────────────
       The lens is ONE absolutely-positioned element. We measure the two
       active character spans relative to the rail and place the lens to
       frame them. First appearance snaps into place (no slide from 0,0);
       every advance after that glides via CSS transition. */
    const railRef = useRef<HTMLDivElement | null>(null);
    const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const [lens, setLens] = useState<LensRect | null>(null);
    // Whether the lens has been placed once — kept in state (not a ref) so the
    // render stays pure. Suppresses the slide on first placement.
    const [hasPlacedLens, setHasPlacedLens] = useState(false);

    const measureLens = useCallback(() => {
        const rail = railRef.current;
        if (!rail || currentPairIdx < 0) {
            setLens(null);
            setHasPlacedLens(false);
            return;
        }
        const a = charRefs.current[currentPairIdx];
        const b = charRefs.current[currentPairIdx + 1];
        if (!a || !b) return;

        const railBox = rail.getBoundingClientRect();
        const aBox = a.getBoundingClientRect();
        const bBox = b.getBoundingClientRect();

        const padX = 8; // breathing room so the frame hugs, not clips
        const padY = 6;
        const left = aBox.left - railBox.left - padX;
        const top = Math.min(aBox.top, bBox.top) - railBox.top - padY;
        const width = bBox.right - aBox.left + padX * 2;
        const height = Math.max(aBox.height, bBox.height) + padY * 2;

        // Mark "placed" only after the first real placement so the very first
        // appearance snaps in (no slide) and every subsequent move glides.
        setLens((prev) => {
            if (prev === null) setHasPlacedLens(true);
            return { left, top, width, height };
        });
    }, [currentPairIdx]);

    // Measure after layout commits (fonts/wrap settled) and on resize. Reading
    // the rendered span geometry and storing it in state is the canonical
    // "synchronize with the DOM layout" effect — there is no pure alternative,
    // since the lens position is only known once the characters have laid out.
    useLayoutEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- layout measurement, see above
        measureLens();
    }, [measureLens, text]);

    useEffect(() => {
        if (currentPairIdx < 0) return;
        const onResize = () => measureLens();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [measureLens, currentPairIdx]);

    // First placement = lens exists but has not yet been marked placed, so the
    // initial frame disables the slide transition (it snaps into position).
    const lensFirstPlacement = lens !== null && !hasPlacedLens;

    /* ── Controls ── */
    const advance = useCallback(() => {
        setStep((prev) => {
            const next = prev + 1;
            if (next >= totalPairs) {
                setFinished(true);
                return prev;
            }
            return next;
        });
    }, [totalPairs]);

    const start = useCallback(() => {
        setHasPlacedLens(false);
        setStep(0);
        setFinished(false);
    }, []);

    const reset = useCallback(() => {
        setHasPlacedLens(false);
        setStep(-1);
        setFinished(false);
        setLens(null);
    }, []);

    const handleCustomSubmit = useCallback(() => {
        const cleaned = customText.trim().toLowerCase().slice(0, 16);
        if (cleaned.length >= 2) {
            setHasPlacedLens(false);
            setText(cleaned);
            setShowCustomInput(false);
            setCustomText("");
            setStep(-1);
            setFinished(false);
            setLens(null);
        }
    }, [customText]);

    /* ── Token style helpers (inline so they follow [data-bigram-theme]) ── */
    const monoFont = "var(--font-jetbrains-mono)";
    const serifFont = "var(--font-source-serif)";

    const lensTransition = reduce || lensFirstPlacement
        ? { duration: 0 }
        : { duration: 0.46, ease: LENS_EASE };

    return (
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
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
                            {t("bigramNarrative.pairHighlighter.stepPrompt")}
                        </p>
                        <StartButton onClick={start}>
                            {t("bigramNarrative.pairHighlighter.startButton")}
                        </StartButton>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── The phrase, with the sliding lens ── */}
            {step >= 0 && (
                <div
                    ref={railRef}
                    style={{
                        position: "relative",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 0,
                        padding: "34px 10px 18px",
                    }}
                >
                    {/* Persistent sage lens (one element, glides pair→pair) */}
                    {lens && (
                        <motion.div
                            aria-hidden
                            initial={false}
                            animate={{
                                left: lens.left,
                                top: lens.top,
                                width: lens.width,
                                height: lens.height,
                                opacity: 1,
                            }}
                            transition={lensTransition}
                            style={{
                                position: "absolute",
                                borderRadius: 14,
                                background: "var(--bigram-sage-soft)",
                                boxShadow:
                                    "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 32%, transparent)",
                                pointerEvents: "none",
                                zIndex: 0,
                            }}
                        />
                    )}

                    {chars.map((char, i) => {
                        const isActive = i === currentPairIdx || i === currentPairIdx + 1;
                        const isDone = i < currentPairIdx;
                        const color = isActive
                            ? "var(--bigram-accent-ink)"
                            : isDone
                                ? "color-mix(in oklab, var(--bigram-ink) 40%, var(--bigram-dim))"
                                : "color-mix(in oklab, var(--bigram-dim) 52%, transparent)";

                        return (
                            <span
                                key={`${text}-${i}`}
                                ref={(el) => {
                                    charRefs.current[i] = el;
                                }}
                                style={{
                                    position: "relative",
                                    zIndex: 1,
                                    fontFamily: monoFont,
                                    fontSize: "clamp(40px, 8vw, 58px)",
                                    fontWeight: isActive ? 600 : 500,
                                    lineHeight: 1,
                                    color,
                                    padding: "7px 3px",
                                    userSelect: "none",
                                    transition: "color .3s ease, font-weight .3s ease",
                                }}
                            >
                                {disp(char)}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* ── Narrated current pair: "Current pair  t→h  · seen 2× · it repeats!" ── */}
            {step >= 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                        flexWrap: "wrap",
                        minHeight: 30,
                        margin: "0 0 30px",
                    }}
                >
                    <AnimatePresence mode="wait">
                        {currentPairIdx >= 0 && (
                            <motion.div
                                key={`now-${currentPairIdx}-${currentKey}`}
                                initial={reduce ? false : { opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.28 }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: monoFont,
                                        fontSize: 10.5,
                                        letterSpacing: ".2em",
                                        textTransform: "uppercase",
                                        color: "var(--bigram-muted)",
                                    }}
                                >
                                    {t("bigramNarrative.pairHighlighter.currentPairLabel")}
                                </span>

                                {/* the pair itself: src dim → dst accent */}
                                <span
                                    style={{
                                        fontFamily: monoFont,
                                        fontSize: 24,
                                        display: "inline-flex",
                                        alignItems: "baseline",
                                    }}
                                >
                                    <span style={{ color: "var(--bigram-dim)" }}>
                                        {disp(chars[currentPairIdx])}
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
                                        {disp(chars[currentPairIdx + 1])}
                                    </span>
                                </span>

                                {/* first time / it repeats */}
                                <span
                                    style={{
                                        fontFamily: monoFont,
                                        fontSize: 12.5,
                                        fontWeight: currentSeenCount >= 2 ? 600 : 400,
                                        color:
                                            currentSeenCount >= 2
                                                ? "var(--bigram-accent)"
                                                : "var(--bigram-dim)",
                                    }}
                                >
                                    {currentSeenCount >= 2
                                        ? t("bigramNarrative.pairHighlighter.seenRepeats").replace(
                                            "{n}",
                                            String(currentSeenCount),
                                        )
                                        : t("bigramNarrative.pairHighlighter.firstTime")}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Running tally ── */}
            {step >= 0 && (
                <div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            margin: "0 0 18px",
                            paddingBottom: 11,
                            borderBottom: "1px solid var(--bigram-rule)",
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
                            {t("bigramNarrative.pairHighlighter.countsLabel")}
                        </span>
                        <span
                            style={{
                                fontFamily: monoFont,
                                fontSize: 12,
                                color: "var(--bigram-dim)",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {Math.min(step + 1, totalPairs)} / {totalPairs}
                        </span>
                    </div>

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
                            {tally.map(({ key, src, dst, count }) => (
                                <motion.div
                                    key={key}
                                    layout={!reduce}
                                    transition={
                                        reduce
                                            ? { duration: 0 }
                                            : { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }
                                    }
                                    style={{
                                        // gently lift the just-touched pair
                                        zIndex: key === currentKey ? 1 : 0,
                                    }}
                                >
                                    <PairChip
                                        src={src}
                                        dst={dst}
                                        count={count}
                                        repeated={count >= 2}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>
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
                            {t("bigramNarrative.pairHighlighter.patternLabel")}
                        </span>

                        {repeatedPairs.length > 0 ? (
                            <>
                                <span>
                                    {t("bigramNarrative.pairHighlighter.patternRepeats")}
                                </span>
                                {repeatedPairs.map(({ key, src, dst }) => (
                                    <RepeatToken key={key} src={src} dst={dst} mono={monoFont} />
                                ))}
                            </>
                        ) : (
                            <span>
                                {t("bigramNarrative.pairHighlighter.patternUnique")}
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
                        marginTop: 34,
                        flexWrap: "wrap",
                    }}
                >
                    {!finished ? (
                        <StartButton onClick={advance}>
                            {t("bigramNarrative.pairHighlighter.nextStep")}
                            <span
                                style={{
                                    marginLeft: 9,
                                    opacity: 0.55,
                                    fontSize: 11,
                                    fontWeight: 500,
                                }}
                            >
                                {step + 1} / {totalPairs}
                            </span>
                        </StartButton>
                    ) : (
                        <>
                            <GhostButton
                                onClick={() => {
                                    reset();
                                    setTimeout(start, 60);
                                }}
                            >
                                {t("bigramNarrative.pairHighlighter.replay")}
                            </GhostButton>
                            <GhostButton onClick={() => setShowCustomInput((v) => !v)}>
                                {t("bigramNarrative.pairHighlighter.tryOwn")}
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
                                onChange={(e) => setCustomText(e.target.value.slice(0, 16))}
                                onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                                placeholder={t("bigramNarrative.pairHighlighter.placeholder")}
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
                                {t("bigramNarrative.pairHighlighter.go")}
                            </StartButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/* ─────────────── Local buttons (token-only, v8 .btn vocabulary) ─────────────── */

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

/* Repeated-pair token used in the closing summary (mirrors .bw-pairs__summary .rp). */
function RepeatToken({
    src,
    dst,
    mono,
}: {
    src: string;
    dst: string;
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
        </span>
    );
}
