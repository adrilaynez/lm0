"use client";

import { memo } from "react";

import { MONO } from "./tokens";

/**
 * ngram/kit · CaptionLine — the mono uppercase eyebrow that labels a widget ("INTERACTIVO · …",
 * "LA MÁQUINA LEE"). Duplicated in FillTheBlank/IsolateT/RowTally as `.nw-*__label`/`__eyebrow`.
 *
 * One focal point: this is a quiet hairline label, never a heading. Tokens-only, no motion.
 */
export interface CaptionLineProps {
    children: React.ReactNode;
    /** Bottom margin in px. Default 18. */
    gap?: number;
    align?: "center" | "left";
    className?: string;
}

export const CaptionLine = memo(function CaptionLine({
    children,
    gap = 18,
    align = "center",
    className,
}: CaptionLineProps) {
    return (
        <p
            className={className}
            style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "var(--ngram-dim)",
                margin: `0 0 ${gap}px`,
                textAlign: align,
            }}
        >
            {children}
        </p>
    );
});

export default CaptionLine;
