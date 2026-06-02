"use client";

import { memo } from "react";

import { MONO } from "./tokens";

/**
 * bigram/kit · ParchmentReader — the "papiro" reading surface (from RowTally): a masked, scrolling block
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
        <div className="bw-pr" style={{ maxWidth }}>
            {markerLabel != null && (
                <div className="bw-pr__mark" data-on={reading ? "1" : "0"}>
                    <span className="bw-pr__dot" aria-hidden />
                    {markerLabel}
                </div>
            )}
            <div className="bw-pr__reader" aria-hidden>
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
                        <span key={i} className="bw-pr__ch" data-state={state}>
                            {ch === "\n" ? " " : ch}
                        </span>
                    );
                })}
            </div>
            {progress != null && (
                <div className="bw-pr__progress" aria-hidden>
                    <span className="bw-pr__fill" style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }} />
                </div>
            )}

            <style>{`
                .bw-pr { width: 100%; margin: 0 auto; }
                .bw-pr__mark { display: inline-flex; align-items: center; gap: 8px; font-family: ${MONO}; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--bigram-accent); margin: 0 0 11px; opacity: 0; transition: opacity .3s ease; }
                .bw-pr__mark[data-on="1"] { opacity: 1; }
                .bw-pr__dot { width: 7px; height: 7px; border-radius: 999px; background: var(--bigram-accent-bright); animation: bwReadPulse 1s ease-in-out infinite; }
                @keyframes bwReadPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
                .bw-pr__reader {
                    font-family: ${MONO}; font-size: clamp(13px, 1.55vw, 16px); line-height: 1.85;
                    text-align: left; white-space: pre-wrap; word-break: break-word;
                    max-height: 10.5em; overflow: hidden; margin: 0 auto;
                    padding: 20px 24px; border-radius: var(--bigram-r-md); color: var(--bigram-muted);
                    background: var(--bigram-bg-2); border: 1px solid var(--bigram-rule);
                    box-shadow: inset 0 2px 12px color-mix(in oklab, var(--bigram-ink) 12%, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent);
                    mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent);
                }
                .bw-pr__ch { transition: background .12s ease, color .12s ease; color: var(--bigram-muted); }
                .bw-pr__ch[data-state="past"] { color: var(--bigram-dim); }
                .bw-pr__ch[data-state="future"] { color: color-mix(in oklab, var(--bigram-muted) 55%, transparent); }
                .bw-pr__ch[data-state="cur"] { color: var(--bigram-on-accent); background: var(--bigram-accent); border-radius: 3px; padding: 1px 2px; margin: 0 -1px; }
                .bw-pr__ch[data-state="hot1"] { color: var(--bigram-on-accent); background: var(--bigram-accent); border-radius: 3px; padding: 1px 2px; margin: 0 -1px; font-weight: 700; }
                .bw-pr__ch[data-state="hot2"] { color: var(--bigram-accent-ink); background: var(--bigram-accent-soft); border-radius: 3px; padding: 1px 2px; margin: 0 -1px; font-weight: 700; box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--bigram-accent) 36%, transparent); }
                .bw-pr__progress { height: 3px; border-radius: 999px; background: var(--bigram-bg-2); margin: 14px auto 0; overflow: hidden; }
                .bw-pr__fill { display: block; height: 100%; background: var(--bigram-accent); border-radius: 999px; transition: width .1s linear; }
            `}</style>
        </div>
    );
});

export default ParchmentReader;
