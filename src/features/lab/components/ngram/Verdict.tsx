"use client";

import { memo, type ReactNode } from "react";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Verdict — the plain-language sage verdict panel for the N-gram chapter (v8, editorial-amber).
 *
 * A calm sage panel that states the conclusion in human language: "After X, the most likely is Y."
 * It uses the SAGE voice (editorial insight) — a soft sage gradient with an inset sage ring — distinct
 * from the emerald accent of interactive elements, yet in the same green family. One centred column:
 * a mono sage eyebrow, a serif sentence (the bet), and a mono muted detail line (counts · percentage).
 *
 * Reads only --ngram-* tokens + the registered fonts. Reduced-motion safe.
 * Mirrors styles-v8.css `.nw-corpus__verdict` (.vk / .vmain / .vsub).
 */

export interface VerdictProps {
    /** mono sage eyebrow, e.g. "The model's bet" */
    label: string;
    /** serif sentence, e.g. After "<b>t</b>", the most likely is "<b>h</b>". */
    main: ReactNode;
    /** mono muted detail, e.g. "5 of 7 times · 71%" */
    sub: string;
}

export const Verdict = memo(function Verdict({ label, main, sub }: VerdictProps) {
    const reduce = useReducedMotion();

    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px",
                padding: "16px 22px",
                borderRadius: "var(--ngram-r-md)",
                background: "linear-gradient(135deg, var(--ngram-sage-soft), transparent 82%)",
                boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--ngram-sage) 32%, transparent)",
                textAlign: "center",
            }}
        >
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10.5px",
                    letterSpacing: ".2em",
                    textTransform: "uppercase",
                    color: "var(--ngram-sage)",
                }}
            >
                {label}
            </span>
            <span
                className="ngram-verdict__main"
                style={{
                    fontFamily: "var(--font-source-serif)",
                    fontSize: "20px",
                    lineHeight: 1.4,
                    color: "var(--ngram-ink)",
                    textWrap: "pretty",
                }}
            >
                {/* bold spans inside the sentence (e.g. the predicted chars) read in accent-ink */}
                <style>{".ngram-verdict__main b{color:var(--ngram-accent-ink);font-weight:600}"}</style>
                {main}
            </span>
            <span
                style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "12.5px",
                    color: "var(--ngram-muted)",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {sub}
            </span>
        </motion.div>
    );
});
