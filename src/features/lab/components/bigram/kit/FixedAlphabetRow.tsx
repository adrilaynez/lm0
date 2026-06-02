"use client";

import { memo } from "react";

import { displayChar, heat, MONO } from "./tokens";

/**
 * bigram/kit · FixedAlphabetRow — the chapter's "store the data in a row" object (from RowTally).
 *
 * N fixed slots (e.g. space, a–z) that NEVER reorder: bars (magnitude), heat cells (the same row stored,
 * one cell per slot — literally one row of the matrix that's coming), and labels, all on one shared grid
 * so they align slot-for-slot. Empty slots stay visibly empty in their place. Hover any slot → `onHover`.
 *
 * Bars climb via a cheap CSS height transition (reduced-motion safe; no rAF). Tokens-only.
 */
export interface FixedAlphabetRowProps {
    /** Column glyphs (space rendered as ␣ automatically). Defines N. */
    cols: string[];
    /** Counts per column (same length as cols). */
    counts: number[];
    /** Index of the winning slot (brightest). Optional. */
    winner?: number;
    /** Index currently inspected. Optional. */
    hoverIdx?: number;
    onHover?: (index: number | null) => void;
    /** Normalisation max. Default max(1, …counts). */
    max?: number;
    /** Bars area height in px. Default 156. */
    height?: number;
    maxWidth?: number;
}

export const FixedAlphabetRow = memo(function FixedAlphabetRow({
    cols,
    counts,
    winner = -1,
    hoverIdx = -1,
    onHover,
    max,
    height = 156,
    maxWidth = 660,
}: FixedAlphabetRowProps) {
    const N = cols.length;
    const m = max ?? Math.max(1, ...counts);

    return (
        <div className="bw-far">
            <div className="bw-far__bars">
                {cols.map((c, i) => (
                    <div
                        key={c + i}
                        className="bw-far__bar"
                        data-win={i === winner && counts[i] > 0 ? "1" : "0"}
                        data-hover={i === hoverIdx ? "1" : "0"}
                        onMouseEnter={() => onHover?.(i)}
                        onMouseLeave={() => onHover?.(null)}
                    >
                        <span className="bw-far__fill" style={{ height: `${(counts[i] / m) * 100}%` }} />
                    </div>
                ))}
            </div>

            <div className="bw-far__heatrow">
                {cols.map((c, i) => (
                    <span
                        key={c + i}
                        className="bw-far__cell"
                        data-win={i === winner && counts[i] > 0 ? "1" : "0"}
                        data-hover={i === hoverIdx ? "1" : "0"}
                        style={{ background: heat(counts[i] / m) }}
                        onMouseEnter={() => onHover?.(i)}
                        onMouseLeave={() => onHover?.(null)}
                        title={`${displayChar(c)}: ${counts[i]}`}
                    />
                ))}
            </div>

            <div className="bw-far__axis" aria-hidden>
                {cols.map((c, i) => (
                    <span key={c + i} className="bw-far__lbl" data-hi={i === (hoverIdx >= 0 ? hoverIdx : winner) ? "1" : "0"}>
                        {displayChar(c)}
                    </span>
                ))}
            </div>

            <style>{`
                .bw-far { width: 100%; display: flex; flex-direction: column; align-items: center; }
                .bw-far__bars { display: grid; grid-template-columns: repeat(${N}, 1fr); gap: 3px; align-items: end; height: ${height}px; width: 100%; max-width: ${maxWidth}px; margin: 0 auto 5px; }
                .bw-far__bar { height: 100%; display: flex; align-items: flex-end; min-width: 0; cursor: default; }
                .bw-far__fill { width: 100%; border-radius: 3px 3px 0 0; min-height: 2px; background: color-mix(in oklab, var(--bigram-accent) 46%, transparent); transition: height .25s ease, background .2s ease; }
                .bw-far__bar[data-win="1"] .bw-far__fill { background: var(--bigram-accent-bright); }
                .bw-far__bar[data-hover="1"] .bw-far__fill { background: var(--bigram-accent); }
                .bw-far__heatrow { display: grid; grid-template-columns: repeat(${N}, 1fr); gap: 3px; width: 100%; max-width: ${maxWidth}px; margin: 0 auto; }
                .bw-far__cell { aspect-ratio: 1; border-radius: 3px; transition: background .25s ease, box-shadow .15s ease; cursor: default; }
                .bw-far__cell[data-win="1"] { box-shadow: inset 0 0 0 1.5px var(--bigram-accent-bright); }
                .bw-far__cell[data-hover="1"] { box-shadow: inset 0 0 0 1.5px var(--bigram-accent-ink); }
                .bw-far__axis { display: grid; grid-template-columns: repeat(${N}, 1fr); gap: 3px; width: 100%; max-width: ${maxWidth}px; margin: 6px auto 0; }
                .bw-far__lbl { font-family: ${MONO}; font-size: 9px; line-height: 1; color: var(--bigram-dim); text-align: center; transition: color .15s ease; }
                .bw-far__lbl[data-hi="1"] { color: var(--bigram-accent-ink); font-weight: 700; }
                @media (max-width: 560px) { .bw-far__lbl { font-size: 7px; } }
            `}</style>
        </div>
    );
});

export default FixedAlphabetRow;
