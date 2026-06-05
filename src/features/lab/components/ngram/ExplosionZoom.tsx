"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import {
    CaptionLine,
    MONO,
    PlayButton,
    SERIF,
    STD,
} from "@/features/lab/components/ngram/kit";
import { contextSpace } from "@/features/lab/data/ngramData";

/**
 * §4 · ExplosionZoom — "the table is ASTRONOMICALLY large" (spine `s4-zoom`).
 *
 * THE ONE IDEA (must read pre-literally, no prose required): the prediction table is a GRID so vast that the
 * one cell you can actually see is a vanishing speck of it — and every extra letter EXPLODES the grid ×27
 * bigger, flooding far past the edges of the screen.
 *
 * WHY THE OLD BUILD FAILED (user, final judge: "no lo entiendo · ¿qué es el cuadrado?"): a big amber square
 * that SHRANK read as "it gets small", not "the table explodes", and an abstract square answered no question.
 *
 * THE NEW MECHANISM — ZOOM OUT, the camera pulls back and the TABLE explodes outward:
 *   • The hero is a literal GRID of cells (a table — that answers "what is the square?": it's ONE cell).
 *   • ONE cell is lit amber and pinned to the centre with a leader to the tag "esto es lo que ves".
 *   • Each dive multiplies the cell count ×27: cells flood outward, getting denser and smaller, and the grid
 *     bleeds far PAST the lens edges (it visibly continues off-screen). The MOTION is the table GROWING, not a
 *     square shrinking — and the lit cell becomes a ridiculous speck inside an ocean that runs off every edge.
 *   • So the picture is unmistakably different at every depth (sparse big cells → a dense sea bleeding off
 *     screen) and a still can never look "finite": you SEE you are looking at almost nothing of something huge.
 *
 * ONE HERO: the climbing table size up top. The percentage is a small tag pinned to the lit cell, not a second
 * big number. ONE primary control (caer más hondo). Fixed layout at every depth — nothing reflows. Assembled
 * from the kit (PlayButton · CaptionLine + SERIF/MONO/STD) + its one unique mechanic: the exploding zoom-out
 * grid. Tokens-only, [data-ngram-theme], memo, "use client", self-mounting, reduced-motion safe.
 */

const VOCAB = 27; // [space, a–z]

/** The dive path. Each click pulls the camera back to the next stop. The first stops show a readable grid;
 *  the deep stops fast-forward through magnitudes, each anchored to something a person can actually picture —
 *  because "387 millones" means nothing, but "más que átomos en el universo" lands. Real math: rows = 27^n. */
const STAGES: { n: number; cells: number; cmp?: string }[] = [
    { n: 3,  cells: 13 },
    { n: 4,  cells: 22 },
    { n: 5,  cells: 38 },
    { n: 6,  cells: 64 },
    { n: 8,  cells: 104, cmp: "más filas que estrellas en la Vía Láctea" },
    { n: 14, cells: 104, cmp: "más filas que granos de arena en toda la Tierra" },
    { n: 17, cells: 104, cmp: "más filas que estrellas en el universo entero" },
    { n: 35, cells: 104, cmp: "más filas que átomos hay en la Tierra" },
    { n: 56, cells: 104, cmp: "más filas que átomos hay en el universo observable" },
];
const LAST = STAGES.length - 1;

export interface ExplosionZoomProps {
    accent?: "ngram";
}

export const ExplosionZoom = memo(function ExplosionZoom({ accent }: ExplosionZoomProps) {
    void accent;
    const reduce = useReducedMotion();

    // stageIdx = which stop on the dive path. depth = letters of memory at that stop.
    const [stageIdx, setStageIdx] = useState<number>(0);
    const stage = STAGES[stageIdx];
    const depth = stage.n;

    const atBottom = stageIdx >= LAST;
    const atSurface = stageIdx <= 0;

    // Real math: 27^depth = how many rows the whole table COULD have. This is the HERO number.
    const rows = useMemo(() => contextSpace(depth), [depth]);

    // The share you can SEE = 100 / rows, rendered "0,000…%" with a zero-run that GROWS each dive. It is the
    // tag on the lit cell, not a second hero.
    const fraction = useMemo(() => buildFraction(rows), [rows]);
    // The hero number — a real grouped figure while it's still graspable, then "10ⁿ" once it isn't.
    const big = useMemo(() => buildBig(rows), [rows]);

    const cells = stage.cells;

    // The lit cell IS exactly one cell of the visible grid: its edge = 1 / cells of the lens width. As the grid
    // densifies each dive, that single cell collapses toward a speck — the picture you can see shrinks while the
    // table around it floods denser. The cell sits ON the grid (aligned to a cell), so it reads as "this one".
    const litFrac = 1 / cells;
    // Leader starts just under the lit cell (cell is centred): bottom edge = 50% + half the cell height.
    const litEdge = 50 + (litFrac * 100) / 2;

    const dive = useCallback(() => setStageIdx((s) => Math.min(LAST, s + 1)), []);
    const climb = useCallback(() => setStageIdx((s) => Math.max(0, s - 1)), []);

    const tr = reduce ? { duration: 0.2, ease: STD } : { duration: 0.62, ease: STD };

    return (
        <div className="nw-ez" style={{ fontFamily: SERIF }}>
            {/* HERO — one climbing number: the size of the whole table. Nothing else competes at this scale. */}
            <div className="nw-ez__hero">
                <span className="nw-ez__hero-eyebrow">la tabla entera tiene</span>
                <div className="nw-ez__hero-row">
                    <motion.span
                        key={depth}
                        className="nw-ez__hero-num"
                        initial={reduce ? false : { y: 12, opacity: 0, filter: "blur(4px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        transition={reduce ? { duration: 0.18 } : { duration: 0.42, ease: STD }}
                    >
                        {big.kind === "num"
                            ? big.v
                            : <>10<sup className="nw-ez__sup">{big.zeros}</sup></>}
                    </motion.span>
                    <span className="nw-ez__hero-unit">filas</span>
                </div>
                <span className="nw-ez__hero-sub">
                    {big.kind === "exp" ? <>un 1 seguido de {big.zeros} ceros · </> : null}
                    {depth} letras de memoria
                </span>
                {/* the comparison anchor — what makes "astronomical" actually mean something. */}
                {stage.cmp && (
                    <motion.span
                        key={`cmp-${depth}`}
                        className="nw-ez__cmp"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.34, ease: STD }}
                    >
                        {stage.cmp}
                    </motion.span>
                )}
            </div>

            {/* THE LENS — a fixed window onto the table. The grid PLANE inside is bigger than the lens and
                bleeds past every edge, so the table visibly continues off-screen. Each dive pulls the camera
                back: cells multiply and shrink, flooding the frame, and the one lit cell collapses to a speck. */}
            <div
                className="nw-ez__lens"
                aria-hidden
                style={{ "--lit": `${litFrac * 100}%`, "--lit-edge": `${litEdge}%` } as React.CSSProperties}
            >
                {/* the exploding grid plane — fills the lens, drawn as a grid of accent cells. Each dive swaps
                    in a DENSER grid (more, smaller cells): the table visibly floods from a readable grid into a
                    fine sea. The swap animates from slightly-zoomed-in → settle, so cells appear to RUSH outward
                    and multiply (the table exploding), not a square shrinking. Keyed swap = no overlapping clone
                    in a frozen still. `--cell` = one cell as a % of the lens (so the lit cell == one cell). */}
                <motion.div
                    key={cells}
                    className="nw-ez__plane"
                    style={{ "--cell": `${litFrac * 100}%` } as React.CSSProperties}
                    initial={reduce ? false : { scale: 1.35, opacity: 0.35 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={tr}
                />

                {/* the ONE lit cell — the sliver you can actually see. Stays centred and pinned to the grid;
                    shrinks with the camera pull-back into a speck. A soft halo keeps even a pinprick findable. */}
                <motion.span
                    className="nw-ez__cell-halo"
                    animate={{ width: `calc(${litFrac * 100}% + 10px)`, height: `calc(${litFrac * 100}% + 10px)` }}
                    transition={tr}
                />
                <motion.span
                    className="nw-ez__cell"
                    animate={{ width: `${litFrac * 100}%`, height: `${litFrac * 100}%` }}
                    transition={tr}
                />

                {/* leader from just under the lit cell down to the tag — ties the speck to its label at any depth */}
                <span className="nw-ez__leader" aria-hidden />

                {/* the tag — pinned bottom-centre, under the always-centred cell: "this cell = X % of the table".
                    The critical idea is annotated ON the picture, aligned to the cell. */}
                <div className="nw-ez__tag">
                    <span className="nw-ez__tag-eyebrow">esto es lo que ves</span>
                    <motion.span
                        key={fraction}
                        className="nw-ez__tag-num"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, ease: STD }}
                    >
                        {fraction}
                    </motion.span>
                    <span className="nw-ez__tag-foot">de la tabla entera</span>
                </div>

                {/* off-screen markers — corner chevrons + label that say the grid keeps going past the glass. */}
                <span className="nw-ez__bleed nw-ez__bleed--tl" aria-hidden />
                <span className="nw-ez__bleed nw-ez__bleed--tr" aria-hidden />
                <span className="nw-ez__bleed nw-ez__bleed--bl" aria-hidden />
                <span className="nw-ez__bleed nw-ez__bleed--br" aria-hidden />
                <span className="nw-ez__offscreen">la tabla sigue fuera de pantalla →</span>
            </div>

            <div className="nw-ez__caption">
                <CaptionLine gap={2}>
                    {atBottom
                        ? "y la tabla sigue creciendo · esto no toca fondo"
                        : "cada letra más multiplica la tabla ×27 · casi toda queda fuera de pantalla"}
                </CaptionLine>
            </div>

            {/* ONE primary control. Climb-out is a quiet hairline link, never a second CTA competing for the eye. */}
            <div className="nw-ez__controls">
                {!atBottom ? (
                    <PlayButton onClick={dive}>{stageIdx < 3 ? <>caer más hondo · ×{VOCAB} la tabla</> : "seguir alejándote"}</PlayButton>
                ) : (
                    <span className="nw-ez__bottom">y ni así cabría en ningún ordenador del mundo</span>
                )}
                {!atSurface && (
                    <button type="button" className="nw-ez__climb" onClick={climb}>
                        ← subir un nivel
                    </button>
                )}
            </div>

            <style>{`
                .nw-ez {
                    width: 100%; max-width: 480px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: center; gap: 20px;
                    text-align: center;
                }

                /* HERO — the climbing size of the whole table, the first and biggest thing the eye hits. */
                .nw-ez__hero {
                    display: flex; flex-direction: column; align-items: center; gap: 5px;
                }
                .nw-ez__hero-eyebrow {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
                    color: var(--ngram-muted);
                }
                .nw-ez__hero-row {
                    display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; justify-content: center;
                }
                .nw-ez__hero-num {
                    font-family: ${MONO}; font-weight: 700;
                    font-size: clamp(42px, 9.5vw, 66px); line-height: 1;
                    color: var(--ngram-accent-bright);
                    font-variant-numeric: tabular-nums;
                    text-shadow: 0 0 28px var(--ngram-accent-soft);
                    will-change: transform, opacity, filter;
                }
                .nw-ez__hero-unit {
                    font-family: ${MONO}; font-size: 13px; letter-spacing: .08em; text-transform: uppercase;
                    color: var(--ngram-muted);
                }
                .nw-ez__hero-sub {
                    font-family: ${MONO}; font-size: 12px; letter-spacing: .06em;
                    color: var(--ngram-ink-2);
                }
                .nw-ez__sup { font-size: 0.5em; vertical-align: super; font-weight: 800; margin-left: 1px; }
                /* the comparison anchor — the line that makes the number mean something. */
                .nw-ez__cmp {
                    margin-top: 4px; max-width: 22em;
                    font-family: ${SERIF}; font-style: italic; font-weight: 600;
                    font-size: clamp(15px, 2.4vw, 19px); line-height: 1.25;
                    color: var(--ngram-accent-ink);
                }

                /* THE LENS — a fixed square window. overflow:hidden so the oversized grid plane is clipped at
                   the glass: the table is seen THROUGH a small window and continues past it. */
                .nw-ez__lens {
                    position: relative;
                    width: min(420px, 84vw); aspect-ratio: 1;
                    border-radius: var(--ngram-r-md); overflow: hidden;
                    background: var(--ngram-bg-2);
                    box-shadow: inset 0 0 0 1px var(--ngram-rule-2),
                                inset 0 0 60px color-mix(in oklab, #000 38%, transparent);
                    isolation: isolate;
                }
                /* the exploding grid plane — FILLS the lens with a clearly visible grid of accent cells, aligned
                   to centre so the lit centre cell sits exactly on a cell. Two repeating-line gradients = the
                   grid. A soft edge-only vignette dims just the borders so the field reads as continuing past
                   the glass, without erasing the grid in the middle. */
                .nw-ez__plane {
                    position: absolute; inset: 0;
                    pointer-events: none;
                    background-image:
                        linear-gradient(to right,  color-mix(in oklab, var(--ngram-accent-deep) 72%, transparent) 0 1px, transparent 1px),
                        linear-gradient(to bottom, color-mix(in oklab, var(--ngram-accent-deep) 72%, transparent) 0 1px, transparent 1px);
                    background-size: var(--cell) var(--cell);
                    background-position: center center;
                    -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 68%, transparent 100%);
                    mask-image: radial-gradient(circle at 50% 50%, #000 68%, transparent 100%);
                    transform-origin: center center;
                    will-change: transform, opacity;
                }
                /* a ring + glow hugging the lit cell — keeps a deep-dive pinprick findable and marks "look here". */
                .nw-ez__cell-halo {
                    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
                    border-radius: 4px; pointer-events: none; z-index: 2;
                    box-shadow: 0 0 0 1px color-mix(in oklab, var(--ngram-accent-bright) 65%, transparent),
                                0 0 34px 12px color-mix(in oklab, var(--ngram-accent-bright) 32%, transparent);
                    will-change: width, height;
                }
                /* the ONE lit cell — the sliver you can actually see. Centred; its size collapses to a speck as
                   the camera pulls back, so the IMAGE itself shows you seeing less and less of the whole. */
                .nw-ez__cell {
                    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
                    border-radius: 2px; z-index: 3; min-width: 7px; min-height: 7px;
                    background: var(--ngram-accent-bright);
                    box-shadow: 0 0 0 2px var(--ngram-bg),
                                0 0 0 3.5px var(--ngram-accent-deep),
                                0 0 24px 6px color-mix(in oklab, var(--ngram-accent-bright) 85%, transparent);
                    will-change: width, height;
                }

                /* the leader hairline — from just below the lit cell's bottom edge down to the tag. */
                .nw-ez__leader {
                    position: absolute; left: 50%; top: var(--lit-edge); bottom: 78px; width: 1px;
                    transform: translateX(-50%); pointer-events: none; z-index: 2;
                    background: linear-gradient(to bottom,
                        color-mix(in oklab, var(--ngram-accent-bright) 80%, transparent),
                        color-mix(in oklab, var(--ngram-accent-bright) 22%, transparent));
                }
                /* the tag — bottom-centre, under the always-centred cell. */
                .nw-ez__tag {
                    position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%);
                    display: flex; flex-direction: column; align-items: center; gap: 1px;
                    padding: 7px 14px; border-radius: var(--ngram-r-sm); z-index: 4;
                    background: color-mix(in oklab, var(--ngram-bg) 94%, transparent);
                    box-shadow: inset 0 0 0 1px var(--ngram-rule-2),
                                0 2px 12px color-mix(in oklab, #000 30%, transparent);
                    text-align: center; white-space: nowrap;
                    backdrop-filter: blur(4px);
                    pointer-events: none;
                }
                .nw-ez__tag-eyebrow {
                    font-family: ${MONO}; font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
                    color: var(--ngram-accent-bright);
                }
                .nw-ez__tag-num {
                    font-family: ${MONO}; font-weight: 700;
                    font-size: clamp(19px, 4vw, 26px); line-height: 1.1;
                    color: var(--ngram-ink);
                }
                .nw-ez__tag-foot {
                    font-family: ${MONO}; font-size: 10px; letter-spacing: .1em;
                    color: var(--ngram-ink-2);
                }

                /* off-screen chevrons — small corner ticks that point outward, reinforcing "it keeps going". */
                .nw-ez__bleed {
                    position: absolute; width: 14px; height: 14px; pointer-events: none; z-index: 2;
                    border-color: color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent);
                    border-style: solid; border-width: 0;
                }
                .nw-ez__bleed--tl { top: 9px; left: 9px; border-top-width: 2px; border-left-width: 2px; }
                .nw-ez__bleed--tr { top: 9px; right: 9px; border-top-width: 2px; border-right-width: 2px; }
                .nw-ez__bleed--bl { bottom: 9px; left: 9px; border-bottom-width: 2px; border-left-width: 2px; }
                .nw-ez__bleed--br { bottom: 9px; right: 9px; border-bottom-width: 2px; border-right-width: 2px; }
                .nw-ez__offscreen {
                    position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
                    font-family: ${MONO}; font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase;
                    color: color-mix(in oklab, var(--ngram-accent-bright) 78%, transparent);
                    white-space: nowrap; pointer-events: none; z-index: 2;
                }

                .nw-ez__caption { display: flex; justify-content: center; max-width: 380px; }

                .nw-ez__controls {
                    display: flex; flex-direction: column; gap: 8px; align-items: center;
                }
                .nw-ez__bottom {
                    font-family: ${MONO}; font-size: 12px; letter-spacing: .06em; color: var(--ngram-muted);
                }
                .nw-ez__climb {
                    background: transparent; border: 0; cursor: pointer;
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .08em; text-transform: uppercase;
                    color: var(--ngram-dim);
                    transition: color .2s ease;
                }
                .nw-ez__climb:hover { color: var(--ngram-accent-ink); }
            `}</style>
        </div>
    );
});

/**
 * buildFraction — render the share of the table you can see (100 / rows) as a "0,000…%" string whose run of
 * zeros GROWS each dive, so the fraction visibly shrinks. Always honest: the leading-zero count is the true
 * order of magnitude of the percentage; deep dives collapse to "0,000…1 %" so it reads as "almost nothing".
 */
function buildFraction(rows: number): string {
    if (rows <= 1) return "100 %";
    const pct = 100 / rows; // percent of the table visible
    if (pct >= 1) return `${Math.round(pct)} %`;
    // leading zeros after the decimal point before the first significant digit
    const zeros = Math.floor(-Math.log10(pct));
    if (zeros <= 3) {
        // shallow: show the real digits, e.g. "0,014 %"
        return `${pct.toPrecision(2)} %`.replace(".", ",");
    }
    if (zeros <= 8) {
        // a growing run of zeros ending in 1 — "vanishing", a zero longer each dive
        return `0,${"0".repeat(zeros)}1 %`;
    }
    // beyond readable: an explicit ellipsis so the tag never becomes an 80-char string
    return "0,000…1 %";
}

/** The hero figure: a real grouped number while it's still graspable (≤ ~hundreds of millions), then an
 *  order-of-magnitude "10ⁿ" once a literal digit string would be meaningless (and unrenderable). */
function buildBig(rows: number): { kind: "num"; v: string } | { kind: "exp"; zeros: number } {
    if (rows < 1e9) return { kind: "num", v: Math.round(rows).toLocaleString("es-ES") };
    return { kind: "exp", zeros: Math.round(Math.log10(rows)) };
}

export default ExplosionZoom;
