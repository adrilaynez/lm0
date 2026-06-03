"use client";

import { memo } from "react";

import { motion, useReducedMotion } from "framer-motion";

/**
 * PairChip — the pair pill for the N-gram chapter (v8, editorial-amber).
 *
 * A pill (`r-pill`) reading `src → dst` (mono) on the left and an occurrence count in a disc on the
 * right. When the pair has been seen more than once (`repeated`, i.e. count >= 2) the whole pill tints
 * to --ngram-accent-soft with an inset accent ring and the disc fills accent / on-accent — so the
 * pattern *pops* the moment language starts repeating itself. One idea, shown by fill not chrome.
 *
 * Reads only --ngram-* tokens + the registered mono font. Reduced-motion safe.
 * Mirrors styles-v8.css `.nw-pairs__pair` / `.nw-pairs__pair.rep`.
 */

const SPACE_GLYPH = "·"; // matches the pair-highlighter glyph for a space in the v8 reference

function disp(ch: string): string {
    return ch === " " ? SPACE_GLYPH : ch;
}

export interface PairChipProps {
    /** origin char */
    src: string;
    /** destination char */
    dst: string;
    /** occurrences; rendered in the disc */
    count: number;
    /** count >= 2 → accent-tinted pill + on-accent disc (pattern pops) */
    repeated?: boolean;
}

export const PairChip = memo(function PairChip({ src, dst, count, repeated = false }: PairChipProps) {
    const reduce = useReducedMotion();

    return (
        <motion.div
            initial={reduce ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            aria-label={`${src === " " ? "space" : src} followed by ${dst === " " ? "space" : dst}, ${count}${
                repeated ? " times" : " time"
            }`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "11px",
                padding: "7px 8px 7px 15px",
                borderRadius: "var(--ngram-r-pill)",
                background: repeated
                    ? "var(--ngram-accent-soft)"
                    : "color-mix(in oklab, var(--ngram-ink) 5%, transparent)",
                boxShadow: repeated
                    ? "inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 26%, transparent)"
                    : "none",
            }}
        >
            {/* src → dst (mono) */}
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "18px",
                    display: "inline-flex",
                    alignItems: "baseline",
                }}
            >
                <span
                    style={{
                        color: repeated
                            ? "color-mix(in oklab, var(--ngram-accent) 60%, var(--ngram-dim))"
                            : "var(--ngram-dim)",
                        fontWeight: repeated ? 500 : 400,
                    }}
                >
                    {disp(src)}
                </span>
                <span
                    style={{
                        color: repeated
                            ? "color-mix(in oklab, var(--ngram-accent) 60%, var(--ngram-dim))"
                            : "var(--ngram-dim)",
                        fontSize: "13px",
                        margin: "0 3px",
                    }}
                >
                    →
                </span>
                <span
                    style={{
                        color: repeated ? "var(--ngram-accent-ink)" : "var(--ngram-ink)",
                        fontWeight: repeated ? 600 : 500,
                    }}
                >
                    {disp(dst)}
                </span>
            </span>

            {/* count disc */}
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: repeated ? "var(--ngram-on-accent)" : "var(--ngram-dim)",
                    fontVariantNumeric: "tabular-nums",
                    minWidth: "23px",
                    height: "23px",
                    borderRadius: "50%",
                    display: "inline-grid",
                    placeItems: "center",
                    background: repeated
                        ? "var(--ngram-accent)"
                        : "color-mix(in oklab, var(--ngram-ink) 9%, transparent)",
                }}
            >
                {count}
            </span>
        </motion.div>
    );
});
