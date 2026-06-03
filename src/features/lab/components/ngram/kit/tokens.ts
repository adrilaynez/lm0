/**
 * ngram/kit · tokens — the single place the chapter's fonts, easing, heat ramp and glyph helper live.
 *
 * Every kit primitive and every visualizer imports from here instead of re-declaring `"var(--ngram-...)"`
 * strings inline. Tokens-only: never hardcode a hex; the values below are CSS custom properties resolved
 * under the chapter's `[data-ngram-theme]` scope (defined in globals.css), so they adapt to light/dark.
 */

/** Registered font families (resolve under [data-ngram-theme]). */
export const MONO = "var(--ngram-font-mono)";
export const SERIF = "var(--ngram-font-serif)";
export const DISPLAY = "var(--ngram-font-display)";

/** Canonical reveal / fade / entry easing (bigram-motion-bible §1). Use this, not ad-hoc cubics. */
export const STD: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

/** Landing springs (bigram-motion-bible §1) — FLIP, dice, a column being born. */
export const SPRING_SNAP = { type: "spring" as const, stiffness: 360, damping: 30 };
export const SPRING_SOFT = { type: "spring" as const, stiffness: 180, damping: 26 };

/** Space renders as ␣ (U+2423) everywhere in the chapter. */
export function displayChar(c: string): string {
    return c === " " ? "␣" : c;
}

/**
 * Heat ramp (bigram-motion-bible §4): empty → bg-2, hot → accent-bright, sqrt-lifted so a weak value
 * still reads instead of washing out. `p` is a 0..1 share (count / rowMax). The SAME ramp is used by the
 * 1-row foreshadow and the full matrix, so a row always looks like a row of the matrix.
 */
export function heat(p: number, floorPct = 0): string {
    if (p <= 0) return "var(--ngram-bg-2)";
    // floorPct: a visible minimum for ANY non-zero value. Dense matrices (27×27, 92×92) need it so a
    // low-but-real cell still reads in dark instead of vanishing into bg-2. The 1-row foreshadow uses
    // floor 0 (its values are large). Recommended matrix floor ≈ 12–16.
    const pct = Math.max(floorPct, Math.pow(p, 0.6) * 100).toFixed(1);
    return `color-mix(in oklab, var(--ngram-accent-bright) ${pct}%, var(--ngram-bg-2))`;
}
