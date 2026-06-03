"use client";

import { memo } from "react";

import { MONO } from "./tokens";

/**
 * ngram/kit · ParchmentReader — the "papiro" reading surface (from RowTally): a masked, scrolling block
 * of the literal text with a reading cursor and, optionally, a lit «hot1» letter + its «hot2» follower
 * inside it (the marking idiom, applied in-place during a slow scan). Optional pulsing "reading…" marker
 * and a progress hairline.
 *
 * The caller owns the scan loop and passes absolute indices; this only renders the window. Reduced-motion
 * safe (no rAF here; the only animation is the marker dot pulse, which a consumer can hide).
 */
export interface ParchmentReaderProps {
    text: string;
    /** First absolute char index of the visible window. */
    windowStart: number;
    windowSize?: number;
    /** Absolute index of the most-recently-read char (the cursor). */
    head: number;
    /** Absolute index lit as the filled «hot1» letter (e.g. the current «t»). -1 = none. */
    hot1?: number;
    /** Absolute index lit as the «hot2» follower. -1 = none. */
    hot2?: number;
    /** 0..1 read progress for the hairline. Omit to hide. */
    progress?: number;
    /** Show the pulsing "reading" marker. */
    reading?: boolean;
    markerLabel?: React.ReactNode;
    maxWidth?: number;
}

export const ParchmentReader = memo(function ParchmentReader({
    text,
    windowStart,
    windowSize = 200,
    head,
    hot1 = -1,
    hot2 = -1,
    progress,
    reading = false,
    markerLabel,
    maxWidth = 560,
}: ParchmentReaderProps) {
    const win = text.slice(windowStart, windowStart + windowSize);

    return (
        <div className="nw-pr" style={{ maxWidth }}>
            {markerLabel != null && (
                <div className="nw-pr__mark" data-on={reading ? "1" : "0"}>
                    <span className="nw-pr__dot" aria-hidden />
                    {markerLabel}
                </div>
            )}
            <div className="nw-pr__reader" aria-hidden>
                {win.split("").map((ch, i) => {
                    const abs = windowStart + i;
                    const state =
                        abs === hot1
                            ? "hot1"
                            : abs === hot2
                              ? "hot2"
                              : abs === head && hot1 < 0
                                ? "cur"
                                : abs < head + 1
                                  ? "past"
                                  : "future";
                    return (
                        <span key={i} className="nw-pr__ch" data-state={state}>
                            {ch === "\n" ? " " : ch}
                        </span>
                    );
                })}
            </div>
            {progress != null && (
                <div className="nw-pr__progress" aria-hidden>
                    <span className="nw-pr__fill" style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }} />
                </div>
            )}

            <style>{`
                .nw-pr { width: 100%; margin: 0 auto; }
                .nw-pr__mark { display: inline-flex; align-items: center; gap: 8px; font-family: ${MONO}; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--ngram-accent); margin: 0 0 11px; opacity: 0; transition: opacity .3s ease; }
                .nw-pr__mark[data-on="1"] { opacity: 1; }
                .nw-pr__dot { width: 7px; height: 7px; border-radius: 999px; background: var(--ngram-accent-bright); animation: nwReadPulse 1s ease-in-out infinite; }
                @keyframes nwReadPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
                .nw-pr__reader {
                    font-family: ${MONO}; font-size: clamp(13px, 1.55vw, 16px); line-height: 1.85;
                    text-align: left; white-space: pre-wrap; word-break: break-word;
                    max-height: 10.5em; overflow: hidden; margin: 0 auto;
                    padding: 20px 24px; border-radius: var(--ngram-r-md); color: var(--ngram-muted);
                    background: var(--ngram-bg-2); border: 1px solid var(--ngram-rule);
                    box-shadow: inset 0 2px 12px color-mix(in oklab, var(--ngram-ink) 12%, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent);
                    mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent);
                }
                .nw-pr__ch { transition: background .12s ease, color .12s ease; color: var(--ngram-muted); }
                .nw-pr__ch[data-state="past"] { color: var(--ngram-dim); }
                .nw-pr__ch[data-state="future"] { color: color-mix(in oklab, var(--ngram-muted) 55%, transparent); }
                .nw-pr__ch[data-state="cur"] { color: var(--ngram-on-accent); background: var(--ngram-accent); border-radius: 3px; padding: 1px 2px; margin: 0 -1px; }
                .nw-pr__ch[data-state="hot1"] { color: var(--ngram-on-accent); background: var(--ngram-accent); border-radius: 3px; padding: 1px 2px; margin: 0 -1px; font-weight: 700; }
                .nw-pr__ch[data-state="hot2"] { color: var(--ngram-accent-ink); background: var(--ngram-accent-soft); border-radius: 3px; padding: 1px 2px; margin: 0 -1px; font-weight: 700; box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ngram-accent) 36%, transparent); }
                .nw-pr__progress { height: 3px; border-radius: 999px; background: var(--ngram-bg-2); margin: 14px auto 0; overflow: hidden; }
                .nw-pr__fill { display: block; height: 100%; background: var(--ngram-accent); border-radius: 999px; transition: width .1s linear; }
            `}</style>
        </div>
    );
});

export default ParchmentReader;
