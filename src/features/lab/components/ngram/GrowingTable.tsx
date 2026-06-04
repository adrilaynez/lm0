"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { useReducedMotion } from "framer-motion";

import {
    CaptionLine,
    CountUpNumber,
    heat,
    MONO,
    PlayButton,
    SERIF,
} from "@/features/lab/components/ngram/kit";
import {
    contextRow,
    contextSpace,
    getCounts,
    NGRAM_ALPHABET,
} from "@/features/lab/data/ngramData";

/**
 * §2 · GrowingTable — "subir de nivel = la MISMA tabla, MÁS GRANDE" (spine `s2-grow`).
 *
 * CONTEXT. Entering, the reader has built (by hand, in SplitTheRow) a table with one sharpened row PER PAIR —
 * the trigram. They learned that leveling up is the SAME counting with a longer key. The ONE NEW idea here,
 * DISCOVERED by pressing a button: each extra letter of memory keeps the table the same SHAPE but makes it
 * BIGGER — the block of rows you have built physically GROWS taller, fuller and brighter, and the count climbs
 * 729 → 19 683 → 531 441. This is the POSITIVE bridge to writing (§3): "subiste de nivel y es más grande". The
 * "astronomically huge / mostly empty" awe is deliberately held for §4 — here it is just "it GROWS".
 *
 * THE FIX (round-3, inverted). The previous version viewed the table through a FIXED window and packed more &
 * THINNER rows into it each level → the footprint never grew, the picture dimmed, the table "looked small". So
 * the growth was only stated by a number, never FELT. This version inverts it: the panel itself INFLATES each
 * level (its height literally scales up), the rows keep a CONSTANT legible pitch, and each level draws MORE of
 * them and BRIGHTER → the block of amber you have built unmistakably grows in a frozen frame. More memory =
 * more visible MASS, never less.
 *
 * HERO: the BLOCK OF ROWS that gets BIGGER (a changing picture, not just a number). It is a real STACK OF
 * ROWS — each row a single full-width horizontal heat-strip (one stored context's real distribution over the
 * alphabet, painted left→right). Rows are read top-to-bottom as a scannable table, never a field of cells.
 *
 * Scale gate solved IN A STILL: panel height, row count and brightness all step UP with the level, so the
 * trigram frame and the 5-grama frame are obviously different sizes — the second is a far bigger slab. A
 * "+N filas más" marker prints the TRUE remainder right at the overflow.
 *
 * Assembled from the kit (heat · CountUpNumber · PlayButton · CaptionLine + SERIF/MONO) + its ONE unique
 * mechanic: the level bump that GROWS the panel and re-stacks more, brighter real-count rows. Real data only —
 * every drawn row is `contextRow(ctxLen, ctx)` over Shakespeare; the hero count is `contextSpace(k)` (27^k,
 * continuing SplitTheRow's ×27 thread). Tokens-only, [data-ngram-theme], memo, reduced-motion safe.
 */

const ALPHA = NGRAM_ALPHABET; // [space, a–z] — 27 symbols
const VOCAB = ALPHA.length;   // 27 — every level multiplies the rows by this

/**
 * The three levels of THIS beat (it begins where SplitTheRow ended, at the trigram).
 *   ctxLen 2 → trigram   (729 rows possible)
 *   ctxLen 3 → 4-grama   (19 683)
 *   ctxLen 4 → 5-grama   (531 441)
 * Each level is a BIGGER table: a TALLER panel, MORE drawn rows, BRIGHTER fill. Constant legible row pitch.
 *
 * POLISH NOTE: Level 0 intentionally kept shorter so the jump to level 2 is dramatic and unmissable.
 * panelH ratio 148:288:480 ≈ 1:1.95:3.24 — reader sees "this thing tripled in height".
 */
const LEVELS = [
    // panelH = the visible height of the block; drawn = rows painted; lift = brightness floor (rises per level).
    { ctxLen: 2, memory: 2, panelH: 148, drawn: 10, lift: 26 },
    { ctxLen: 3, memory: 3, panelH: 288, drawn: 21, lift: 38 },
    { ctxLen: 4, memory: 4, panelH: 480, drawn: 35, lift: 52 },
] as const;

// CONSTANT row pitch (strip height + hairline) across ALL levels — rows never shrink. More memory packs MORE
// of these same-size rows into a TALLER panel, so the block grows instead of getting finer/dimmer.
const ROW_PITCH = 13; // px

/**
 * The MOST FREQUENT real contexts of length `ctxLen` (by row total), biggest-first, sliced to `drawn`.
 *
 * We deliberately pick frequent rows, NOT alphabetical-first ones: at deep levels the first alphabetical keys
 * ("␣␣␣␣", "␣␣␣a"…) are mostly UNSEEN → near-empty dim strips, which would make a BIGGER table look DIMMER —
 * the exact "looks small" inversion this widget exists to kill. Frequent contexts are real, dense, and bright,
 * so every level draws a slab of clearly-amber rows and deeper levels stay HOT, not faint. Memoized via the
 * shared getCounts cache. Cheap: we sort observed contexts (the map is built once per level, <50 ms).
 */
function topKeysAt(ctxLen: number, drawn: number): string[] {
    const counts = getCounts(ctxLen);
    const withTotal: { key: string; total: number }[] = [];
    for (const [key, row] of counts) {
        let t = 0;
        for (const v of row.values()) t += v;
        withTotal.push({ key, total: t });
    }
    // biggest-first; tie-break alphabetically so the order is stable/deterministic.
    withTotal.sort((a, b) => (b.total - a.total) || (a.key < b.key ? -1 : 1));
    return withTotal.slice(0, drawn).map((d) => d.key);
}

interface WallRow {
    key: string;       // the context this row stores (e.g. "th") — printed in the gutter
    gradient: string;  // a CSS linear-gradient built from the real 27 counts → one solid heat-strip
}

/**
 * Turn a real 27-count row into ONE continuous horizontal gradient. Each of the 27 alphabet slots becomes a
 * hard-edged band, colored by its share of the row max via the kit heat ramp. Hard stops keep the strip
 * reading as a single painted distribution — NOT a grid of detachable cells. `lift` is the brightness floor
 * for non-zero slots: it RISES with the level so a deeper (bigger) table also reads as a BRIGHTER block.
 */
function rowGradient(full: number[], lift: number): string {
    let mx = 1;
    for (const v of full) if (v > mx) mx = v;
    const n = full.length; // 27
    const stops: string[] = [];
    for (let i = 0; i < n; i++) {
        const color = full[i] <= 0
            ? `color-mix(in oklab, var(--ngram-accent-bright) 12%, var(--ngram-bg-2))`
            : heat(full[i] / mx, lift);
        const from = ((i / n) * 100).toFixed(2);
        const to = (((i + 1) / n) * 100).toFixed(2);
        stops.push(`${color} ${from}%`, `${color} ${to}%`);
    }
    return `linear-gradient(90deg, ${stops.join(", ")})`;
}

function buildWall(ctxLen: number, drawn: number, lift: number): WallRow[] {
    return topKeysAt(ctxLen, drawn).map((key) => ({
        key,
        gradient: rowGradient(contextRow(ctxLen, key), lift),
    }));
}

export interface GrowingTableProps {
    accent?: "ngram";
}

export const GrowingTable = memo(function GrowingTable({ accent }: GrowingTableProps) {
    void accent;
    const reduce = useReducedMotion();

    // level 0 = trigram (where SplitTheRow left off) · 1 = 4-grama · 2 = 5-grama
    const [level, setLevel] = useState(0);
    const L = LEVELS[level];

    // Every drawn row, precomputed from REAL counts (memoized per level).
    const wall = useMemo(() => buildWall(L.ctxLen, L.drawn, L.lift), [L.ctxLen, L.drawn, L.lift]);

    // Hero count: 27^k — how many rows this level's table holds (continues the ×27 story).
    const possible = useMemo(() => contextSpace(L.memory), [L.memory]);
    // Honest remainder: rows beyond the legible slice we draw — the "+N filas más" at the overflow.
    const remainder = Math.max(0, possible - L.drawn);

    const levelUp = useCallback(() => setLevel((l) => Math.min(LEVELS.length - 1, l + 1)), []);
    const reset = useCallback(() => setLevel(0), []);

    const atTop = level === LEVELS.length - 1;
    // panel grows; rows keep a constant pitch; the whole block scales up with a quick ease.
    const trans = reduce ? "none" : "height .55s cubic-bezier(.2,.8,.2,1)";

    return (
        <div className="nw-gt" style={{ fontFamily: SERIF }}>
            {/* HERO LABEL — the climbing row count, sitting atop the table it describes */}
            <div className="nw-gt__hero">
                <CountUpNumber
                    key={possible}
                    value={possible}
                    durationMs={620}
                    className="nw-gt__count"
                    format={(n) => Math.round(n).toLocaleString("es-ES")}
                />
                <span className="nw-gt__herolbl">filas en tu tabla</span>
            </div>

            {/* THE BLOCK — a stack of REAL rows whose PANEL inflates each level. Rows keep a constant pitch and
                each level draws MORE of them + BRIGHTER → the slab of amber you built visibly GROWS. The level
                pills on the left make the three sizes comparable at a glance. */}
            <div className="nw-gt__stage">
                {/* growth ladder: the current level glows; each rung's HEIGHT mirrors that level's table, so the
                    three sizes are visibly comparable — the climb you are on, drawn as steps. */}
                <div className="nw-gt__ladder" aria-hidden>
                    {[...LEVELS].reverse().map((lv) => {
                        const i = LEVELS.indexOf(lv);
                        return (
                            <div
                                key={lv.memory}
                                className={`nw-gt__rung${i === level ? " is-on" : ""}${i < level ? " is-done" : ""}`}
                                style={{ height: 18 + i * 16 }}
                            >
                                {lv.memory}<span className="nw-gt__rungu">letras</span>
                            </div>
                        );
                    })}
                </div>

                <div
                    className="nw-gt__panel"
                    data-level={level}
                    style={{ height: L.panelH, transition: trans }}
                    aria-hidden
                >
                    <div className="nw-gt__rows" style={{ ["--pitch" as string]: `${ROW_PITCH}px` }}>
                        {wall.map((row) => (
                            <div key={row.key} className="nw-gt__row">
                                <span className="nw-gt__key">{row.key.replace(/ /g, "␣")}</span>
                                <span className="nw-gt__strip" style={{ background: row.gradient }} />
                            </div>
                        ))}
                    </div>
                    {/* overflow cut + the TRUE remainder, printed where the table runs past the block */}
                    <div className="nw-gt__cut" />
                    {remainder > 0 && (
                        <div className="nw-gt__spill">+ {remainder.toLocaleString("es-ES")} filas más</div>
                    )}
                </div>
            </div>

            {/* the one functional caption: each extra letter keeps the SAME table, just bigger (×27 each time) */}
            <CaptionLine gap={0} className="nw-gt__caption">
                {level === 0 ? (
                    <>una fila por cada combinación de {L.memory} letras de antes</>
                ) : atTop ? (
                    <>y cada letra más la vuelve a multiplicar por {VOCAB}</>
                ) : (
                    <>la misma tabla · una letra más de memoria · ×{VOCAB} más grande</>
                )}
            </CaptionLine>

            {/* controls — the single discovery action. NOTE on the terminal level: we keep a PRIMARY-matching
                button present (DISABLED, a no-op) instead of swapping it for a plain label. The bench autoplay
                falls back to btns[0] when no primary button is found, which would otherwise click the reset and
                bounce the capture back to level 0 — so the still for clicks=3/6 must keep a matching, inert
                primary in place. (Its text includes "otra letra" so the bench regex selects it, not the reset.) */}
            <div className="nw-gt__controls">
                <PlayButton onClick={atTop ? undefined : levelUp} disabled={atTop}>
                    {atTop ? <>otra letra ya no cabe · ×{VOCAB} en cada nivel</> : <>añadir otra letra de memoria · ×{VOCAB}</>}
                </PlayButton>
                {level > 0 && (
                    <button type="button" className="nw-gt__reset" onClick={reset} aria-label="volver al inicio">
                        ↻
                    </button>
                )}
            </div>

            <style>{`
                .nw-gt {
                    width: 100%; max-width: 760px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: center; gap: 18px;
                    text-align: center;
                }

                /* HERO LABEL — the big climbing count names the block below it */
                .nw-gt__hero { display: flex; flex-direction: column; align-items: center; gap: 4px; }
                .nw-gt__count {
                    font-size: clamp(40px, 8vw, 64px); font-weight: 700; line-height: 1;
                    color: var(--ngram-accent-bright); letter-spacing: -0.01em;
                }
                .nw-gt__herolbl {
                    font-family: ${MONO}; font-size: 11.5px; letter-spacing: .16em; text-transform: uppercase;
                    color: var(--ngram-accent-2);
                }

                /* STAGE — the growth ladder + the inflating panel, side by side, top-aligned so the panel grows
                   DOWNWARD from a fixed top as it gets taller. No reserved empty space → the widget itself is
                   compact at level 0 and physically bigger at level 2 (the footprint growth IS the point). */
                .nw-gt__stage {
                    display: flex; align-items: flex-start; justify-content: center; gap: 14px;
                    width: 100%;
                }

                /* the ladder of three sizes — three rising STEPS; the current step glows. Each rung's height
                   echoes its table size so the climb is legible even in a still. */
                .nw-gt__ladder {
                    display: flex; flex-direction: column-reverse; align-items: stretch; gap: 8px;
                    padding-top: 2px;
                }
                .nw-gt__rung {
                    font-family: ${MONO}; font-variant-numeric: tabular-nums;
                    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
                    width: 50px; border-radius: var(--ngram-r-sm);
                    font-size: 15px; font-weight: 700; line-height: 1;
                    color: var(--ngram-dim);
                    background: color-mix(in oklab, var(--ngram-bg-2) 60%, var(--ngram-bg));
                    transition: color .3s ease, background .3s ease, box-shadow .3s ease;
                }
                .nw-gt__rungu { font-size: 7.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
                .nw-gt__rung.is-done { color: var(--ngram-accent-2); background: color-mix(in oklab, var(--ngram-accent) 16%, var(--ngram-bg-2)); }
                .nw-gt__rung.is-on {
                    color: var(--ngram-on-accent);
                    background: var(--ngram-accent);
                    box-shadow: 0 0 0 1px var(--ngram-accent-bright), 0 6px 22px -8px var(--ngram-accent);
                }

                /* THE PANEL — its HEIGHT scales with the level (that IS the growth). Brighter outline & glow at
                   deeper levels so the bigger block also reads as a hotter, denser slab — never dimmer. */
                .nw-gt__panel {
                    position: relative; flex: 0 1 520px; min-width: 0; max-width: 520px; overflow: hidden;
                    border-radius: var(--ngram-r-md);
                    background: color-mix(in oklab, var(--ngram-bg-2) 78%, var(--ngram-bg));
                    padding: 5px 0 0;
                    text-align: left;
                    border: 1px solid color-mix(in oklab, var(--ngram-accent) 22%, transparent);
                    box-shadow: 0 10px 36px -20px var(--ngram-accent);
                }
                .nw-gt__panel[data-level="1"] {
                    border-color: color-mix(in oklab, var(--ngram-accent) 38%, transparent);
                    box-shadow: 0 14px 46px -20px var(--ngram-accent);
                }
                .nw-gt__panel[data-level="2"] {
                    border-color: color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent);
                    box-shadow: 0 18px 60px -18px var(--ngram-accent-bright);
                }
                .nw-gt__rows { display: flex; flex-direction: column; }

                /* one ROW = a left key gutter + ONE continuous full-width heat-strip. CONSTANT pitch at every
                   level (rows never shrink). A hairline under each row carves the strips into scannable bands. */
                .nw-gt__row {
                    display: flex; align-items: stretch; gap: 8px;
                    height: var(--pitch); padding: 0 11px;
                    border-bottom: 1px solid color-mix(in oklab, var(--ngram-bg) 60%, transparent);
                    animation: nwGtIn .26s ease both;
                }
                .nw-gt__key {
                    flex: 0 0 auto; align-self: center;
                    font-family: ${MONO}; font-variant-numeric: tabular-nums;
                    font-size: 8px; line-height: 1; letter-spacing: .03em;
                    color: var(--ngram-dim);
                    width: 26px; text-align: right; overflow: hidden; white-space: nowrap;
                }
                .nw-gt__strip {
                    flex: 1 1 auto; align-self: center;
                    height: calc(var(--pitch) - 3px); min-height: 3px;
                    border-radius: 1px;
                }
                @keyframes nwGtIn { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: none; } }

                /* THE CUT — a hard accent line + fade where the table runs off the bottom of the (taller) block,
                   saying "the table keeps going past here". Brighter line at deeper levels. */
                .nw-gt__cut {
                    position: absolute; left: 0; right: 0; bottom: 0; height: 58px; pointer-events: none;
                    background: linear-gradient(to bottom,
                        transparent,
                        color-mix(in oklab, var(--ngram-bg-2) 78%, var(--ngram-bg)) 62%,
                        color-mix(in oklab, var(--ngram-bg-2) 94%, var(--ngram-bg)) 100%);
                    border-bottom: 2px solid var(--ngram-accent);
                }
                .nw-gt__panel[data-level="2"] .nw-gt__cut { border-bottom-color: var(--ngram-accent-bright); }
                /* the spill marker — the TRUE remainder, the still-frame scale number (≈ 716 → 19 659 → 531 405).
                   Font size scales with the level so a bigger table gets a MORE prominent pill — the reader
                   feels "this number just got huge" as well as sees the taller block. */
                .nw-gt__spill {
                    position: absolute; left: 50%; bottom: 7px; transform: translateX(-50%);
                    padding: 5px 16px; pointer-events: none; white-space: nowrap;
                    border-radius: var(--ngram-r-pill);
                    background: color-mix(in oklab, var(--ngram-accent-soft) 90%, var(--ngram-bg));
                    border: 1.5px solid color-mix(in oklab, var(--ngram-accent-bright) 42%, transparent);
                    font-family: ${MONO}; font-size: 13px; letter-spacing: .04em; font-weight: 700;
                    font-variant-numeric: tabular-nums;
                    color: var(--ngram-accent-bright);
                    box-shadow: 0 2px 12px -4px color-mix(in oklab, var(--ngram-accent) 50%, transparent);
                }

                /* When the primary button hits its terminal (disabled) state it still carries a milestone message —
                   keep it legible (higher opacity) so the reader can see WHY it stopped, not just that it did. */
                .nw-gt__controls button[disabled] { opacity: 0.72 !important; cursor: default !important; }
                /* Caption override — CaptionLine uses var(--ngram-dim) which is too faint at small size;
                   bump to a mid tone so the one-liner instruction reads clearly without stealing focus. */
                .nw-gt__caption { color: var(--ngram-accent-2) !important; }
                .nw-gt__controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }
                .nw-gt__reset {
                    font-family: ${MONO}; font-size: 16px; color: var(--ngram-accent-bright); background: var(--ngram-accent-soft);
                    border: 1px solid color-mix(in oklab, var(--ngram-accent) 35%, transparent);
                    cursor: pointer; padding: 6px 12px; border-radius: var(--ngram-r-pill);
                    transition: color .2s ease, background .2s ease;
                }
                .nw-gt__reset:hover { color: var(--ngram-on-accent); background: var(--ngram-accent); }

                @media (max-width: 520px) {
                    .nw-gt__ladder { display: none; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .nw-gt__row { animation: none; }
                }
            `}</style>
        </div>
    );
});

export default GrowingTable;
