"use client";

import { memo } from "react";

import { displayChar, MONO } from "./tokens";

/**
 * ngram/kit · Readout — the one-line "DESPUÉS DE «t» · h · 7.071" header (from RowTally's `.nw-rt__readout`):
 * a quiet mono label, the focused follower glyph in accent, and a big climbing number. Pass `value` raw
 * (the consumer owns the live count); this just types it tabular-nums so it never jitters.
 */
export interface ReadoutProps {
    label: React.ReactNode;
    /** The focused character (space rendered as ␣ automatically). */
    char: string;
    value: number;
    className?: string;
}

export const Readout = memo(function Readout({ label, char, value, className }: ReadoutProps) {
    return (
        <div
            className={className}
            style={{ display: "flex", alignItems: "baseline", gap: 14, fontFamily: MONO }}
        >
            <span style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ngram-dim)" }}>
                {label}
            </span>
            <span style={{ fontSize: 18, color: "var(--ngram-ink-2)" }}>
                <b style={{ color: "var(--ngram-accent-bright)" }}>{displayChar(char)}</b>
            </span>
            <span
                style={{
                    fontSize: "clamp(22px, 3vw, 30px)",
                    fontWeight: 600,
                    color: "var(--ngram-accent-bright)",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value.toLocaleString()}
            </span>
        </div>
    );
});

export default Readout;
