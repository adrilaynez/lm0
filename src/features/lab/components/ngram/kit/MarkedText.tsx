"use client";

import { memo } from "react";

import { MONO } from "./tokens";

/**
 * ngram/kit · MarkedText — the chapter's signature "marking" idiom, in ONE place.
 *
 * The reader watches a machine read text letter by letter; the letter in focus gets a filled accent chip
 * (`hot1`) and the very next letter a soft accent tint with an inset ring (`hot2`). Read letters dim
 * (`past`), unread ones fade (`future`), and a plain reading cursor is `cur`. This exact treatment was
 * duplicated in PairHighlighter, IsolateT and RowTally — now they all share it, so the whole chapter
 * marks letters with one hand.
 *
 * The caller decides each letter's state via `stateOf(i)`, so the SAME component serves every flavour:
 * stepping through every pair (PairHighlighter), hunting one letter across a phrase (IsolateT), or a slow
 * scan inside a reader (RowTally). `wordGroup` keeps words unbroken (they never split across lines —
 * only spaces are wrap points), which is what makes a long phrase read like a sentence.
 *
 * Tokens-only; no motion of its own (the transition is a cheap CSS color/box fade) so it is inherently
 * reduced-motion safe. Self-contained `<style>` scoped by `.nw-mt`.
 */

export type MarkState = "hot1" | "hot2" | "cur" | "past" | "future" | "idle";

export interface MarkedTextProps {
    text: string;
    /** Per-index state. Default: everything idle. */
    stateOf?: (index: number) => MarkState;
    /** Keep words unbroken (spaces are the only wrap points). Default true. */
    wordGroup?: boolean;
    /** Font size — a number (px) or any CSS length/clamp string. Default a readable clamp. */
    size?: number | string;
    /** Line height. Default 1.55. */
    lineHeight?: number;
    /** Max width of the block. Default 540. */
    maxWidth?: number | string;
    className?: string;
}

export const MarkedText = memo(function MarkedText({
    text,
    stateOf,
    wordGroup = true,
    size = "clamp(17px, 2.2vw, 23px)",
    lineHeight = 1.55,
    maxWidth = 540,
    className,
}: MarkedTextProps) {
    const fontSize = typeof size === "number" ? `${size}px` : size;
    const get = stateOf ?? (() => "idle" as MarkState);

    const items: React.ReactNode[] = [];
    let word: React.ReactNode[] = [];
    const flush = (k: string) => {
        if (word.length) {
            items.push(
                <span key={`w${k}`} className="nw-mt__word">
                    {word}
                </span>,
            );
            word = [];
        }
    };

    text.split("").forEach((ch, i) => {
        const span = (
            <span key={i} className="nw-mt__ch" data-state={get(i)}>
                {ch === " " ? " " : ch}
            </span>
        );
        if (!wordGroup) {
            items.push(span);
            return;
        }
        if (ch === " " || ch === "\n") {
            flush(`${i}`);
            items.push(
                <span key={i} className="nw-mt__ch nw-mt__space" data-state={get(i)}>
                    {" "}
                </span>,
            );
        } else {
            word.push(span);
        }
    });
    flush("end");

    return (
        <p
            className={`nw-mt${className ? ` ${className}` : ""}`}
            style={{ fontSize, lineHeight }}
        >
            {items}
            <style>{`
                .nw-mt {
                    display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: ${wordGroup ? "7px 0" : "2px 1px"};
                    font-family: ${MONO}; letter-spacing: 0; margin: 0 auto; max-width: ${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth};
                    color: var(--ngram-dim);
                }
                .nw-mt__word { display: inline-flex; align-items: baseline; white-space: nowrap; }
                .nw-mt__ch {
                    border-radius: 6px; padding: 2px 1.5px; font-weight: 500; white-space: pre;
                    transition: background .16s ease, color .16s ease, box-shadow .16s ease, font-weight .16s;
                }
                .nw-mt__ch[data-state="idle"] { color: var(--ngram-dim); }
                .nw-mt__ch[data-state="past"] { color: color-mix(in oklab, var(--ngram-ink) 38%, var(--ngram-dim)); }
                .nw-mt__ch[data-state="future"] { color: color-mix(in oklab, var(--ngram-dim) 52%, transparent); }
                .nw-mt__ch[data-state="cur"] { color: var(--ngram-ink-2); background: color-mix(in oklab, var(--ngram-ink) 6%, transparent); }
                .nw-mt__ch[data-state="hot1"] { color: var(--ngram-on-accent); background: var(--ngram-accent); font-weight: 700; }
                .nw-mt__ch[data-state="hot2"] {
                    color: var(--ngram-accent-ink); background: var(--ngram-accent-soft); font-weight: 700;
                    box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ngram-accent) 38%, transparent);
                }
            `}</style>
        </p>
    );
});

export default MarkedText;
