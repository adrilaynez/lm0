"use client";

import { memo, useEffect, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

/**
 * HonestBar — a single fixed-axis probability bar row for the N-gram chapter (v8, editorial-amber).
 *
 * Honesty principle: the track is the *whole axis* (default 0.5), so a partial fill literally shows
 * how unsure the model is — we never normalise the winner to 100 %. A 31 % prediction reaches ~62 %
 * of the track; a 13 % one reaches ~26 % (the doubt is visible); a near-certain q→u (.92) fills it.
 *
 * Reads only --ngram-* tokens + the registered font vars; gated by the consumer's [data-ngram-theme]
 * scope. Premium-but-minimal: winner is brighter (accent-bright), sweeps a single glint, and the value
 * counts up with easeOutCubic. Fully reduced-motion safe (final state shown instantly, no glint/count-up).
 *
 * Mirrors styles-v8.css `.barrow` and bigram-widgets-v8.js exactly.
 */

const AXIS_DEFAULT = 0.5;
const COUNT_UP_MS = 620;
const FILL_EASE = [0.2, 0.7, 0.2, 1] as const;
const GLINT_EASE = [0.16, 1, 0.3, 1] as const;
const GLINT_OFFSET_S = 0.36; // glint sweeps ≈360ms into the .6s fill, once it has settled
const THIN_SPACE = " "; // narrow no-break space before %, per typographic convention
const SPACE_GLYPH = "␣";

/** fill width as a % of the fixed axis track, clamped to 100 (winner-last cascade keeps it honest) */
function barW(value: number, axis: number): number {
    return Math.min(100, (value / axis) * 100);
}

/** "31.2" — one decimal, matching the v8 reference number format */
function formatPct(value: number): string {
    return (value * 100).toFixed(1);
}

function label(ch: string): string {
    return ch === " " ? "space" : ch;
}

/**
 * The displayed percentage. When `animate` is true it eases 0→value (easeOutCubic ~620ms) after
 * `delay`. Mounted with a `key` derived from value+delay so a changed target cleanly restarts the
 * count from 0 — the only setState happens inside the RAF callback (never synchronously in render
 * or in the effect body), which keeps the React-compiler lint rules satisfied.
 */
const CountUpValue = memo(function CountUpValue({
    value,
    delay,
    animate,
    top,
}: {
    value: number;
    delay: number;
    animate: boolean;
    top: boolean;
}) {
    const [progress, setProgress] = useState(animate ? 0 : 1);

    useEffect(() => {
        if (!animate) return;
        let cancelled = false;
        let raf = 0;
        let t0: number | null = null;
        const frame = (now: number) => {
            if (cancelled) return;
            if (t0 === null) t0 = now;
            const k = Math.min(1, (now - t0) / COUNT_UP_MS);
            const eased = 1 - Math.pow(1 - k, 3); // easeOutCubic
            setProgress(eased);
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
                fontSize: "14px",
                color: top ? "var(--ngram-muted)" : "var(--ngram-dim)",
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
                minWidth: "46px",
            }}
        >
            {formatPct(value * progress)}
            {THIN_SPACE}%
        </span>
    );
});

export interface HonestBarProps {
    /** origin char ("q"); " " renders as ␣ and adds the .space treatment */
    src: string;
    /** destination char ("u") */
    dst: string;
    /** probability 0..1 (NOT a percentage) */
    value: number;
    /** fixed axis denominator (default 0.5) — the honest, shared scale */
    axis?: number;
    /** winner row — brighter fill + emphasised dst */
    top?: boolean;
    /** run the glint sweep on fill (default true; suppressed if reduced-motion) */
    glint?: boolean;
    /** animate value 0→target, easeOutCubic ~620ms (default true) */
    countUp?: boolean;
    /** delay (s) before the fill animates — lets a caller stage a winner-last cascade */
    delay?: number;
    /** overrides the default "src followed by dst, NN%" announcement */
    ariaLabel?: string;
}

export const HonestBar = memo(function HonestBar({
    src,
    dst,
    value,
    axis = AXIS_DEFAULT,
    top = false,
    glint = true,
    countUp = true,
    delay = 0,
    ariaLabel,
}: HonestBarProps) {
    const reduce = useReducedMotion();
    const isSpace = dst === " ";

    const srcGlyph = src === " " ? SPACE_GLYPH : src;
    const dstGlyph = isSpace ? SPACE_GLYPH : dst;

    const targetW = barW(value, axis);
    const safeDelay = Math.max(0, delay);
    const animate = countUp && !reduce;
    const runGlint = glint && !reduce;
    const aria = ariaLabel ?? `${label(src)} followed by ${label(dst)}, ${formatPct(value)}%`;

    return (
        <div
            role="img"
            aria-label={aria}
            style={{
                display: "grid",
                gridTemplateColumns: "104px 1fr auto",
                alignItems: "center",
                gap: "16px",
                margin: "17px 0",
            }}
        >
            {/* label = the bigram pair "q→u": src dim, arrow dim, dst bold ink */}
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "19px",
                    fontWeight: 600,
                    color: "var(--ngram-ink)",
                    textAlign: "left",
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: "2px",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "lining-nums tabular-nums",
                }}
            >
                <span style={{ color: "var(--ngram-dim)", fontWeight: 500 }}>{srcGlyph}</span>
                <span
                    style={{
                        color: "var(--ngram-dim)",
                        fontWeight: 400,
                        margin: "0 3px",
                        fontSize: "14px",
                    }}
                >
                    →
                </span>
                <span
                    style={
                        isSpace
                            ? {
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  letterSpacing: ".03em",
                                  color: "var(--ngram-dim)",
                                  textTransform: "lowercase",
                              }
                            : {
                                  color: "var(--ngram-ink)",
                                  fontWeight: 700,
                                  fontSize: "1.05em",
                              }
                    }
                >
                    {dstGlyph}
                </span>
            </span>

            {/* sunk track (the whole axis) + solid fill; intermediate thickness, legible not massive */}
            <span
                style={{
                    position: "relative",
                    height: "12px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    background: "color-mix(in oklab, var(--ngram-ink) 10%, transparent)",
                    display: "block",
                }}
            >
                <motion.span
                    initial={reduce ? false : { width: "0%" }}
                    animate={{ width: `${targetW}%` }}
                    transition={
                        reduce ? { duration: 0 } : { duration: 0.6, ease: FILL_EASE, delay: safeDelay }
                    }
                    style={{
                        position: "relative",
                        display: "block",
                        height: "100%",
                        borderRadius: "6px",
                        overflow: "hidden",
                        // winner = brighter accent-bright; rest = accent-2
                        background: top ? "var(--ngram-accent-bright)" : "var(--ngram-accent-2)",
                    }}
                >
                    {runGlint && (
                        <motion.span
                            aria-hidden
                            initial={{ left: "-45%", opacity: 0 }}
                            animate={{ left: ["-45%", "-45%", "115%"], opacity: [0, 1, 0] }}
                            transition={{
                                duration: 0.7,
                                times: [0, 0.3, 1],
                                ease: GLINT_EASE,
                                delay: safeDelay + GLINT_OFFSET_S,
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                width: "45%",
                                pointerEvents: "none",
                                background:
                                    "linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent)",
                            }}
                        />
                    )}
                </motion.span>
            </span>

            {/* value pinned to the end of the track — keyed so a changed target restarts the count-up */}
            <CountUpValue
                key={`${value}:${safeDelay}:${animate ? 1 : 0}`}
                value={value}
                delay={safeDelay}
                animate={animate}
                top={top}
            />
        </div>
    );
});
