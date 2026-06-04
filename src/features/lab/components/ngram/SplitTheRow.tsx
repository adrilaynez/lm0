"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { useReducedMotion } from "framer-motion";

import {
    GhostButton,
    heat,
    MONO,
    PlayButton,
    SERIF,
} from "@/features/lab/components/ngram/kit";
import { contextRow, displayChar, NGRAM_ALPHABET } from "@/features/lab/data/ngramData";

/**
 * §2 · SplitTheRow — looking ALSO at the previous letter splits ONE row into 27 (one per previous letter),
 * and doing that for all 27 letters is 27 × 27 = 729. The trigram is born: the table multiplies.
 *
 * THE ONE IDEA a stranger must DEDUCE from a still, WITHOUT reading: one horizontal heat-strip (the «·h» row)
 * literally COMES APART into 27 stacked strips, each TAGGED by the letter now in front of it — a·h, b·h, c·h …
 * z·h. The 27 LABELLED rows are the hero: "one row for every previous letter". Repeat the gesture and the
 * 27-tall stack becomes a 729-tall slab that towers over the single strip it grew from — scale you can SEE.
 *
 * WHY THE OLD VERSION FAILED (twice): a 27×27 grid of mostly-empty grey cells read as "one empty box", not as
 * "1 row splitting into 27". There were no labelled rows, so the multiplication was invisible. New mechanism:
 * a literal split of one strip into 27 labelled strips — the labels make "one per previous letter" undeniable,
 * and the growth (1 → 27 → 729) is shown by a stack that physically gets taller, never a static empty grid.
 *
 * Three discrete stages, so every bench press is a visibly different picture (and it works under forced
 * reduced-motion — no relying on tween playback):
 *   0 · ONE mother strip «·h»            — "1 fila"
 *   1 · the strip SPLIT into 27 labelled strips a·h … z·h, stacked — "27 filas · una por cada letra de antes"
 *   2 · split AGAIN ×27 → the 729-slab towering beside the 27 — "27 × 27 = 729 · así nace el trigrama"
 *
 * Real data only: every strip is a real contextRow over Shakespeare. Assembled from the kit (heat · PlayButton ·
 * GhostButton · SERIF/MONO) + its ONE mechanic (the splitting stack).
 */

const ALPHA = NGRAM_ALPHABET; // [space, a–z] — 27 symbols
const ANCHOR = "h"; // the protagonist letter carried over from the bigram chapter
const VOCAB = ALPHA.length; // 27
const FULL_729 = VOCAB * VOCAB; // 729 — the climax figure
const MAX_STAGE = 2;

/** A context row («prev + h») rendered as N coloured segments — the recognisable "row of the table" object.
 *  Returns the css `background` gradient string. Busy contexts brightest; a never-seen slot a faint base. */
function rowGradient(prev: string): string {
    const counts = contextRow(2, prev + ANCHOR); // 27-length vector of what follows "·h"
    let mx = 1;
    for (const v of counts) if (v > mx) mx = v;
    const n = counts.length;
    const stops: string[] = [];
    for (let i = 0; i < n; i++) {
        const color = counts[i] <= 0
            ? "color-mix(in oklab, var(--ngram-accent-bright) 9%, var(--ngram-bg-2))"
            : heat(counts[i] / mx, 30);
        stops.push(`${color} ${((i / n) * 100).toFixed(2)}%`, `${color} ${(((i + 1) / n) * 100).toFixed(2)}%`);
    }
    return `linear-gradient(90deg, ${stops.join(", ")})`;
}

export const SplitTheRow = memo(function SplitTheRow({ accent }: { accent?: "ngram" }) {
    void accent;
    const reduce = useReducedMotion();

    const [stage, setStage] = useState(0);

    // The 27 daughter rows: one per possible previous letter, each a real «prev·h» heat-strip + its tag.
    const rows = useMemo(
        () => ALPHA.map((prev) => ({ prev, tag: `${displayChar(prev)}·${ANCHOR}`, grad: rowGradient(prev) })),
        [],
    );

    const split = useCallback(() => setStage((s) => Math.min(MAX_STAGE, s + 1)), []);
    const reset = useCallback(() => setStage(0), []);

    const atEnd = stage >= MAX_STAGE;
    const tally = stage === 0 ? 1 : stage === 1 ? VOCAB : FULL_729;

    // button copy evolves so consecutive presses never look like "nothing happened".
    // includes "abrir" so the bench autoplay (?play=1) targets it as the primary action.
    const btnLabel = stage === 0 ? "abrir la fila en 27" : "y partir cada una otra vez";

    return (
        <div className="nw-spl" data-stage={stage} style={{ fontFamily: SERIF }}>
            {/* TITLE — states the question/answer for the current beat. The idea is carried by the visual; this
               only names it. */}
            <h3 className="nw-spl__title">
                {stage === 0 ? <>una fila de la tabla: <span className="nw-spl__pill">·h</span></>
                 : stage === 1 ? <>1 fila se abre en <em>27</em> — una por cada letra de antes</>
                 : <>27 × 27 = <strong>729</strong> filas — así nace el trigrama</>}
            </h3>

            {/* HERO — stages 0/1: the strip splitting into 27 LABELLED rows (the core idea). stage 2: a
               magnitude staircase 1 → 27 → 729 where each block is visibly ~27× the previous, so 729 is SEEN
               as size, never read as a lone number. */}
            {stage < 2 ? (
                <div className="nw-spl__hero">
                    {/* THE SPLITTING STACK — one strip at stage 0, then 27 labelled strips ·h … z·h. */}
                    <div className="nw-spl__stack" data-stage={stage} aria-hidden>
                        {stage === 0 ? (
                            <div className="nw-spl__one">
                                <span className="nw-spl__tag nw-spl__tag--big">·{ANCHOR}</span>
                                <span className="nw-spl__strip nw-spl__strip--tall" style={{ background: rows[ALPHA.indexOf(ANCHOR)]?.grad }} />
                            </div>
                        ) : (
                            <>
                                {/* Column header — makes «letra de antes» explicit at a glance. */}
                                <div className="nw-spl__colhdr" aria-hidden>
                                    <span className="nw-spl__colhdr-lbl">letra de antes</span>
                                    <span className="nw-spl__colhdr-lbl nw-spl__colhdr-lbl--right">frecuencias de qué sigue</span>
                                </div>
                                {rows.map((r, i) => (
                                    <div
                                        key={r.prev}
                                        className="nw-spl__daughter"
                                        style={{ animationDelay: reduce ? "0s" : `${i * 12}ms` }}
                                    >
                                        {/* The tag: a chip for the previous letter + ·h suffix.
                                            The chip makes "one slot per previous letter" unmissable. */}
                                        <span className="nw-spl__tag">
                                            <span className="nw-spl__chip">{displayChar(r.prev)}</span>
                                            <span className="nw-spl__tagdot">·h</span>
                                        </span>
                                        <span className="nw-spl__strip" style={{ background: r.grad }} />
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            ) : (
                /* MAGNITUDE STAIRCASE — three blocks side by side, baseline-aligned, each ~27× the area of the
                   one before it: a single tile (1) → a slim 27-tall stack → a dense 27×27 = 729 block that
                   dwarfs both. The growth is the whole point; the eye reads "tiny → small → huge". */
                <div className="nw-spl__stair" aria-hidden>
                    {/* 1 */}
                    <figure className="nw-spl__step nw-spl__step--one">
                        <div className="nw-spl__stepfig">
                            <span className="nw-spl__bit nw-spl__bit--one" style={{ background: rows[ALPHA.indexOf(ANCHOR)]?.grad }} />
                        </div>
                        <figcaption className="nw-spl__steplbl"><b>1</b> fila<br /><span>·h</span></figcaption>
                    </figure>

                    <span className="nw-spl__mul">×27</span>

                    {/* 27 */}
                    <figure className="nw-spl__step nw-spl__step--mid">
                        <div className="nw-spl__stepfig nw-spl__col27">
                            {rows.map((r) => (
                                <span key={r.prev} className="nw-spl__bit" style={{ background: r.grad }} />
                            ))}
                        </div>
                        <figcaption className="nw-spl__steplbl"><b>27</b> filas<br /><span>·· una por letra</span></figcaption>
                    </figure>

                    <span className="nw-spl__mul">×27</span>

                    {/* 729 — a dense, fully-packed 27×27 block that visibly towers over the other two. */}
                    <figure className="nw-spl__step nw-spl__step--big">
                        <div className="nw-spl__stepfig nw-spl__block729">
                            {rows.map((r) => (
                                <span
                                    key={r.prev}
                                    className="nw-spl__col"
                                    style={{ backgroundImage: r.grad.replace("90deg", "180deg") }}
                                />
                            ))}
                        </div>
                        <figcaption className="nw-spl__steplbl nw-spl__steplbl--big"><b>729</b> filas<br /><span>27 × 27</span></figcaption>
                    </figure>
                </div>
            )}

            {/* SCALE COMPANION — the count climbs 1 → 27 → 729 alongside the growing stack, never a lone giant. */}
            <div className="nw-spl__tally" aria-live="polite">
                <span key={stage} className="nw-spl__count">{tally.toLocaleString("es-ES")}</span>
                <span className="nw-spl__tallylbl">
                    {stage === 0 ? "fila"
                     : stage === 1 ? "filas — una por cada letra de antes"
                     : "filas — una por cada pareja de antes"}
                </span>
            </div>

            {/* CONTROLS — one dominant action; reset is a quiet hairline, clearly secondary. */}
            <div className="nw-spl__controls">
                <PlayButton onClick={split} disabled={atEnd}>
                    {btnLabel}{!atEnd && <span className="nw-spl__x">×27</span>}
                </PlayButton>
                {stage > 0 && <GhostButton onClick={reset}>volver a 1 fila</GhostButton>}
            </div>

            <style>{`
                .nw-spl {
                    width: 100%; max-width: 620px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: center; gap: 16px;
                    text-align: center;
                }

                /* TITLE — a true heading, large and high-contrast. */
                .nw-spl__title {
                    margin: 0; font-family: ${SERIF}; font-weight: 600;
                    font-size: clamp(20px, 3.4vw, 27px); line-height: 1.18; letter-spacing: -0.01em;
                    color: var(--ngram-ink);
                }
                .nw-spl__title em { font-style: italic; color: var(--ngram-accent-ink); }
                .nw-spl__title strong { font-weight: 800; color: var(--ngram-accent-bright); }
                .nw-spl__pill {
                    font-family: ${MONO}; font-weight: 800; font-size: 0.86em;
                    color: var(--ngram-on-accent); background: var(--ngram-accent-bright);
                    border-radius: 7px; padding: 2px 9px; letter-spacing: 0;
                }

                /* HERO — the stack (and, at the climax, the slab beside it). */
                .nw-spl__hero {
                    width: 100%; display: flex; align-items: flex-start; justify-content: center; gap: 20px;
                }

                /* THE STACK — one strip, then 27 labelled strips. Fixed-ish height block so the layout is calm. */
                .nw-spl__stack {
                    flex: 1 1 auto; min-width: 0; max-width: 460px;
                    display: flex; flex-direction: column; gap: 2px;
                }
                .nw-spl__stack[data-stage="0"] { justify-content: center; min-height: 92px; gap: 0; }

                /* stage 0 — the single recognisable mother strip, tall and tagged. */
                .nw-spl__one { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; }
                .nw-spl__strip--tall { height: 56px !important; border-radius: 7px !important; }
                .nw-spl__tag--big {
                    font-size: 22px !important; padding: 10px 13px !important; border-radius: 9px !important;
                }

                /* Column header above the 27 rows — labels the two columns. */
                .nw-spl__colhdr {
                    display: grid; grid-template-columns: 60px 1fr; gap: 8px;
                    margin-bottom: 5px; padding: 0 0 5px;
                    border-bottom: 1px solid color-mix(in oklab, var(--ngram-accent) 22%, transparent);
                }
                .nw-spl__colhdr-lbl {
                    font-family: ${MONO}; font-size: 9px; font-weight: 700; letter-spacing: .07em;
                    text-transform: uppercase; color: var(--ngram-accent-ink); line-height: 1;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: .8;
                }
                .nw-spl__colhdr-lbl--right { text-align: left; color: var(--ngram-muted); opacity: .5; }

                /* one daughter row = tag (the previous letter, bold chip + ·h suffix) + its heat-strip. The 27
                   stacked rows ARE the hero: "one row per previous letter". */
                .nw-spl__daughter {
                    display: grid; grid-template-columns: 60px 1fr; align-items: center; gap: 8px;
                    animation: nwSplIn .22s cubic-bezier(.2,.8,.2,1) both;
                }
                /* The tag wraps a letter chip + ·h suffix — clearly reads "a·h", "b·h", etc. */
                .nw-spl__tag {
                    font-family: ${MONO}; line-height: 1; white-space: nowrap;
                    display: flex; align-items: center; justify-content: flex-end; gap: 3px;
                }
                /* Chip: small colored square with just the previous letter — instantly scannable down the column. */
                .nw-spl__chip {
                    display: inline-flex; align-items: center; justify-content: center;
                    width: 20px; height: 20px; border-radius: 4px;
                    background: color-mix(in oklab, var(--ngram-accent-bright) 22%, var(--ngram-bg-2));
                    border: 1px solid color-mix(in oklab, var(--ngram-accent-bright) 45%, transparent);
                    font-size: 12px; font-weight: 900; color: var(--ngram-accent-bright);
                    letter-spacing: 0; flex-shrink: 0;
                }
                .nw-spl__tagdot {
                    font-size: 11px; color: var(--ngram-accent-ink); opacity: .65; font-weight: 600;
                    letter-spacing: -0.02em;
                }
                .nw-spl__tag--big {
                    font-family: ${MONO}; font-weight: 800; color: var(--ngram-on-accent);
                    background: var(--ngram-accent-bright); text-align: center;
                }
                .nw-spl__strip {
                    display: block; width: 100%; height: 15px; border-radius: 3px;
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 22%, transparent);
                }
                .nw-spl__stack[data-stage="1"] .nw-spl__strip,
                .nw-spl__stack[data-stage="2"] .nw-spl__strip {
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 18%, transparent),
                                0 2px 8px -6px var(--ngram-accent-bright);
                }

                @keyframes nwSplIn { from { opacity: 0; transform: translateY(-4px) scaleY(.6); } to { opacity: 1; transform: none; } }

                /* MAGNITUDE STAIRCASE (stage 2) — 1 → 27 → 729, each block ~27× the previous. Baseline-aligned
                   so the eye reads pure growth: a dot, a slim stack, a towering block. */
                .nw-spl__stair {
                    width: 100%; max-width: 540px;
                    display: flex; align-items: flex-end; justify-content: center; gap: 10px;
                    animation: nwSplIn .34s cubic-bezier(.2,.8,.2,1) both;
                }
                .nw-spl__step { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .nw-spl__stepfig {
                    border-radius: 4px; overflow: hidden;
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 30%, transparent);
                }
                /* 1 — a single tiny tile. */
                .nw-spl__step--one .nw-spl__stepfig { width: 26px; height: 14px; }
                .nw-spl__bit--one { display: block; width: 100%; height: 100%; }
                /* 27 — a slim stack of 27 thin strips. */
                .nw-spl__col27 { display: flex; flex-direction: column; gap: 1px; width: 60px; padding: 2px;
                    background: color-mix(in oklab, var(--ngram-accent) 12%, var(--ngram-bg-2)); }
                .nw-spl__col27 .nw-spl__bit { display: block; width: 100%; height: 4px; border-radius: 1px; }
                /* 729 — a dense, fully-packed 27×27 block that towers over both. */
                .nw-spl__block729 {
                    display: grid; grid-template-columns: repeat(${VOCAB}, 1fr); gap: 0;
                    width: 210px; height: 210px; padding: 4px;
                    background: color-mix(in oklab, var(--ngram-accent) 16%, var(--ngram-bg-2));
                    box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent),
                                0 20px 56px -20px var(--ngram-accent-bright);
                }
                .nw-spl__block729 .nw-spl__col {
                    display: block; width: 100%; height: 100%;
                    background-size: 100% 100%; background-repeat: no-repeat;
                }
                .nw-spl__steplbl {
                    font-family: ${MONO}; font-size: 11px; line-height: 1.35; color: var(--ngram-muted);
                    text-align: center; letter-spacing: .01em;
                }
                .nw-spl__steplbl b { display: block; font-size: 16px; font-weight: 800; color: var(--ngram-accent-ink); }
                .nw-spl__steplbl span { color: var(--ngram-dim); font-size: 10px; }
                .nw-spl__steplbl--big b { font-size: 22px; color: var(--ngram-accent-bright); }
                .nw-spl__mul {
                    align-self: center; margin-bottom: 26px;
                    font-family: ${MONO}; font-weight: 800; font-size: 14px; color: var(--ngram-accent-ink);
                }

                /* SCALE COMPANION — the climbing count. */
                .nw-spl__tally { display: flex; align-items: baseline; gap: 10px; justify-content: center; }
                .nw-spl__count {
                    font-family: ${MONO}; font-variant-numeric: tabular-nums;
                    font-size: clamp(26px, 3.8vw, 36px); line-height: 1; font-weight: 800;
                    color: var(--ngram-accent-bright);
                    animation: nwSplCount .45s cubic-bezier(.2,.8,.2,1) both;
                }
                @keyframes nwSplCount { 0% { transform: scale(.72); opacity: .4; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
                .nw-spl__tallylbl { font-family: ${MONO}; font-size: 12px; letter-spacing: .02em; color: var(--ngram-muted); white-space: nowrap; }

                .nw-spl__controls { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; justify-content: center; margin-top: 2px; }
                .nw-spl__x { opacity: .82; font-weight: 800; margin-left: 2px; }

                @media (max-width: 520px) {
                    .nw-spl__chip { width: 17px; height: 17px; font-size: 10px; }
                    .nw-spl__tagdot { font-size: 10px; }
                    .nw-spl__daughter { grid-template-columns: 50px 1fr; }
                    .nw-spl__colhdr { grid-template-columns: 50px 1fr; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .nw-spl__daughter, .nw-spl__count, .nw-spl__stair { animation: none; }
                }
            `}</style>
        </div>
    );
});

export default SplitTheRow;
