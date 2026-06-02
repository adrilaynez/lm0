"use client";

import { memo, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { MONO } from "./tokens";

/**
 * bigram/kit · CountUpNumber — a number that animates 0 → value once (easeOutCubic), tabular-nums so it
 * never dances. From HonestBar's `CountUpValue` / HeroAutoComplete's prediction rows.
 *
 * For a number that CLIMBS continuously (e.g. a live tally during a scan) don't use this — just render
 * the raw value in a `<Readout>`; this is for one-shot reveals. Reduced-motion shows the final value
 * immediately. The setState only ever runs inside the rAF callback (async), so it never trips
 * `react-hooks/set-state-in-effect`.
 */

const easeOutCubic = (k: number): number => 1 - Math.pow(1 - k, 3);

export interface CountUpNumberProps {
    value: number;
    /** Format the (possibly fractional) running value. Default: rounded with thousands separators. */
    format?: (n: number) => string;
    durationMs?: number;
    delayMs?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const CountUpNumber = memo(function CountUpNumber({
    value,
    format,
    durationMs = 620,
    delayMs = 0,
    className,
    style,
}: CountUpNumberProps) {
    const reduce = useReducedMotion();
    const [shown, setShown] = useState(0);
    const rafRef = useRef<number | null>(null);
    const toRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (reduce) return; // render `value` directly below — no setState in the effect body
        let t0: number | null = null;
        const frame = (now: number) => {
            if (t0 === null) t0 = now;
            const k = Math.min(1, (now - t0) / durationMs);
            setShown(value * easeOutCubic(k));
            if (k < 1) rafRef.current = requestAnimationFrame(frame);
        };
        toRef.current = setTimeout(() => {
            rafRef.current = requestAnimationFrame(frame);
        }, delayMs);
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            if (toRef.current != null) clearTimeout(toRef.current);
        };
    }, [value, reduce, durationMs, delayMs]);

    const fmt = format ?? ((n: number) => Math.round(n).toLocaleString());
    const display = reduce ? value : shown;

    return (
        <span className={className} style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", ...style }}>
            {fmt(display)}
        </span>
    );
});

export default CountUpNumber;
