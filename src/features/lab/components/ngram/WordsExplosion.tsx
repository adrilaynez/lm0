"use client";

import { memo, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { CaptionLine, MONO, PlayButton, SERIF, STD } from "@/features/lab/components/ngram/kit";

/**
 * §4 · WordsExplosion — "y si la unidad fueran PALABRAS, no letras" (restores the user's removed words idea).
 *
 * CONTEXT. The reader just felt the letters table explode (ExplosionZoom: 27 per step). The models of today
 * don't work in letters — they work in WORDS. THE ONE IDEA: swap the 27-symbol alphabet for a ~50.000-word
 * vocabulary and the table doesn't grow, it detonates: 27×27 = 729 becomes 50.000×50.000 = 2.500 millones,
 * and every extra word of memory multiplies it by 50.000 AGAIN.
 *
 * THE HERO is the side-by-side contrast of the two tables: the whole LETTERS table is a speck you can barely
 * find inside the WORDS table. A memory stepper (1→3 words) re-detonates both so the gap is felt as it grows.
 *
 * Honest math: lettersCells = 27^(M+1), wordsCells = 50000^(M+1) (M = words/letters of context). Assembled
 * from the kit (PlayButton · CaptionLine · MONO/SERIF/STD) + its one mechanic: the letters→words detonation.
 */

const LV = 27;       // letter vocabulary
const WV = 50_000;   // typical word vocabulary
const MAX_MEM = 3;   // up to 3 units of memory

/** Spanish magnitude formatting tuned to read at a glance (mil → millón → billón → trillón). */
function formatES(n: number): { v: string; u: string } {
    if (n < 1e6) return { v: Math.round(n).toLocaleString("es-ES"), u: "filas" };
    if (n < 1e12) return { v: Math.round(n / 1e6).toLocaleString("es-ES"), u: "millones de filas" };
    if (n < 1e18) return { v: (n / 1e12).toLocaleString("es-ES", { maximumFractionDigits: 1 }), u: "billones de filas" };
    return { v: (n / 1e18).toLocaleString("es-ES", { maximumFractionDigits: 1 }), u: "trillones de filas" };
}

/** "X veces más grande" — the ratio between the two tables, in graspable units. */
function ratioLabel(r: number): string {
    if (r < 1e6) return `${Math.round(r).toLocaleString("es-ES")} veces`;
    if (r < 1e9) return `${Math.round(r / 1e6).toLocaleString("es-ES")} millones de veces`;
    if (r < 1e12) return `${Math.round(r / 1e9).toLocaleString("es-ES")} mil millones de veces`;
    return `${Math.round(r / 1e12).toLocaleString("es-ES")} billones de veces`;
}

export interface WordsExplosionProps {
    accent?: "ngram";
}

export const WordsExplosion = memo(function WordsExplosion({ accent }: WordsExplosionProps) {
    void accent;
    const reduce = useReducedMotion() === true;

    const [mem, setMem] = useState(1); // units of memory (words/letters of context)

    const lettersCells = Math.pow(LV, mem + 1);
    const wordsCells = Math.pow(WV, mem + 1);
    const ratio = wordsCells / lettersCells;

    const L = formatES(lettersCells);
    const W = formatES(wordsCells);

    const atMax = mem >= MAX_MEM;
    const bump = () => setMem((m) => Math.min(MAX_MEM, m + 1));
    const reset = () => setMem(1);

    const tr = reduce ? { duration: 0.18, ease: STD } : { duration: 0.45, ease: STD };
    const memLabel = mem === 1 ? "una" : mem === 2 ? "dos" : "tres";

    return (
        <div className="nw-we" style={{ fontFamily: SERIF }}>
            <CaptionLine align="center">la misma idea, pero la unidad ya no es la letra</CaptionLine>

            <div className="nw-we__pair">
                {/* ── LETTERS — the small, knowable table ── */}
                <div className="nw-we__card nw-we__card--letters">
                    <div className="nw-we__head">
                        <span className="nw-we__unit">letras</span>
                        <span className="nw-we__vocab">{LV} símbolos</span>
                    </div>
                    <div className="nw-we__gridL" aria-hidden />
                    <div className="nw-we__dims">{LV.toLocaleString("es-ES")} × {LV.toLocaleString("es-ES")}{mem > 1 ? " ×…" : ""}</div>
                    <div className="nw-we__big">
                        <motion.span key={`l-${mem}`} className="nw-we__bignum" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={tr}>
                            {L.v}
                        </motion.span>
                        <span className="nw-we__bigunit">{L.u}</span>
                    </div>
                </div>

                {/* ── WORDS — the table that detonates ── */}
                <div className="nw-we__card nw-we__card--words">
                    <div className="nw-we__head">
                        <span className="nw-we__unit nw-we__unit--big">palabras</span>
                        <span className="nw-we__vocab">≈ {WV.toLocaleString("es-ES")} palabras</span>
                    </div>
                    {/* a vast field; the entire letters table is one barely-visible speck inside it */}
                    <div className="nw-we__gridW" aria-hidden>
                        <span className="nw-we__speck" />
                        <span className="nw-we__speckTag">toda la tabla de letras cabe aquí</span>
                    </div>
                    <div className="nw-we__dims">{WV.toLocaleString("es-ES")} × {WV.toLocaleString("es-ES")}{mem > 1 ? " ×…" : ""}</div>
                    <div className="nw-we__big">
                        <motion.span key={`w-${mem}`} className="nw-we__bignum nw-we__bignum--hot" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={tr}>
                            {W.v}
                        </motion.span>
                        <span className="nw-we__bigunit">{W.u}</span>
                    </div>
                </div>
            </div>

            {/* the ratio — the one line that makes the gap concrete */}
            <motion.div key={`r-${mem}`} className="nw-we__ratio" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={tr}>
                con {memLabel} de memoria, la tabla de palabras es <b>{ratioLabel(ratio)}</b> más grande que la de letras
            </motion.div>

            {/* control */}
            <div className="nw-we__controls">
                {!atMax ? (
                    <PlayButton onClick={bump}>añadir otra palabra de memoria · ×{WV.toLocaleString("es-ES")}</PlayButton>
                ) : (
                    <span className="nw-we__max">cada palabra más la multiplica por {WV.toLocaleString("es-ES")} otra vez</span>
                )}
                {mem > 1 && <button type="button" className="nw-we__reset" onClick={reset}>← volver a una</button>}
            </div>

            <style>{`
                .nw-we { width: 100%; max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }

                .nw-we__pair { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 14px; width: 100%; align-items: stretch; }
                @media (max-width: 560px) { .nw-we__pair { grid-template-columns: 1fr; } }

                .nw-we__card {
                    display: flex; flex-direction: column; gap: 10px; padding: 16px 16px 18px;
                    border-radius: var(--ngram-r-md); background: var(--ngram-bg-2);
                    box-shadow: inset 0 0 0 1px var(--ngram-rule-2);
                }
                .nw-we__card--words {
                    background: color-mix(in oklab, var(--ngram-accent) 8%, var(--ngram-bg-2));
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 32%, transparent),
                                0 18px 44px -24px color-mix(in oklab, var(--ngram-accent) 55%, transparent);
                }

                .nw-we__head { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
                .nw-we__unit { font-family: ${MONO}; font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-we__unit--big { color: var(--ngram-accent-ink); }
                .nw-we__vocab { font-family: ${MONO}; font-size: 11px; color: var(--ngram-dim); }

                /* letters table — a real small grid (decorative, conveys "small + knowable") */
                .nw-we__gridL {
                    height: 64px; border-radius: var(--ngram-r-sm);
                    background-image:
                        repeating-linear-gradient(0deg, transparent 0 7px, color-mix(in oklab, var(--ngram-accent) 22%, transparent) 7px 8px),
                        repeating-linear-gradient(90deg, transparent 0 7px, color-mix(in oklab, var(--ngram-accent) 22%, transparent) 7px 8px);
                    background-color: color-mix(in oklab, var(--ngram-accent) 5%, transparent);
                    box-shadow: inset 0 0 0 1px var(--ngram-rule);
                }
                /* words table — a far denser field; one speck = the whole letters table */
                .nw-we__gridW {
                    position: relative; height: 64px; border-radius: var(--ngram-r-sm); overflow: hidden;
                    background-image:
                        repeating-linear-gradient(0deg, transparent 0 1.5px, color-mix(in oklab, var(--ngram-accent-bright) 34%, transparent) 1.5px 2px),
                        repeating-linear-gradient(90deg, transparent 0 1.5px, color-mix(in oklab, var(--ngram-accent-bright) 34%, transparent) 1.5px 2px);
                    background-color: color-mix(in oklab, var(--ngram-accent) 12%, var(--ngram-bg));
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 40%, transparent),
                                inset 0 0 30px color-mix(in oklab, #000 35%, transparent);
                }
                .nw-we__speck {
                    position: absolute; left: 9px; bottom: 9px; width: 4px; height: 4px; border-radius: 1px;
                    background: #fff; box-shadow: 0 0 0 1px var(--ngram-accent-deep), 0 0 10px 3px color-mix(in oklab, #fff 60%, transparent);
                }
                .nw-we__speckTag {
                    position: absolute; left: 18px; bottom: 7px;
                    font-family: ${MONO}; font-size: 9px; letter-spacing: .04em; color: color-mix(in oklab, #fff 85%, transparent);
                    text-shadow: 0 1px 3px #000; white-space: nowrap;
                }

                .nw-we__dims { font-family: ${MONO}; font-size: 12px; color: var(--ngram-muted); letter-spacing: .02em; }

                .nw-we__big { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; margin-top: auto; }
                .nw-we__bignum {
                    font-family: ${MONO}; font-weight: 800; font-size: clamp(26px, 5vw, 40px); line-height: 1;
                    color: var(--ngram-ink); font-variant-numeric: tabular-nums; letter-spacing: -.01em;
                }
                .nw-we__bignum--hot { color: var(--ngram-accent-bright); text-shadow: 0 0 26px color-mix(in oklab, var(--ngram-accent-bright) 32%, transparent); }
                .nw-we__bigunit { font-family: ${MONO}; font-size: 11px; letter-spacing: .04em; color: var(--ngram-muted); }

                .nw-we__ratio {
                    max-width: 30em; font-family: ${SERIF}; font-size: clamp(15px, 2.3vw, 18px); line-height: 1.4;
                    color: var(--ngram-ink-2);
                }
                .nw-we__ratio b { color: var(--ngram-accent-ink); font-weight: 800; font-style: italic; }

                .nw-we__controls { display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .nw-we__max { font-family: ${MONO}; font-size: 12px; color: var(--ngram-muted); letter-spacing: .03em; max-width: 32ch; }
                .nw-we__reset { background: transparent; border: 0; cursor: pointer; font-family: ${MONO}; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--ngram-dim); transition: color .2s ease; }
                .nw-we__reset:hover { color: var(--ngram-accent-ink); }
            `}</style>
        </div>
    );
});

export default WordsExplosion;
