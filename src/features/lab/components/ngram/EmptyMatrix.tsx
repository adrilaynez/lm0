"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
    CaptionLine,
    displayChar,
    MONO,
    PlayButton,
    SERIF,
    STD,
} from "@/features/lab/components/ngram/kit";
import { getCounts, NGRAM_ALPHABET } from "@/features/lab/data/ngramData";

/**
 * v3§5 · EmptyMatrix — DISCOVERY: "casi toda la tabla está vacía" (la causa de que un contexto nuevo enmudezca
 * y de que ni un océano de texto la llene).
 *
 * THE ONE IDEA (the reader must DISCOVER it, never read it at frame 0): the 4-letter-memory table has 19 683
 * rows but the corpus only ever filled ~3 859 of them. You don't TELL the reader 80% is empty — they ASOMARSE
 * (peek) at patch after patch of the giant table and keep landing on darkness, until they conclude it
 * themselves: "está casi toda vacía".
 *
 * WHY A MINIMAP + LENS (the chosen direction, beating 4 others):
 *   1) a number ("80% vacío") — rejected: announces the lesson, no discovery, fails Principio #1.
 *   2) a slider of fill-% per level — that's the PREVIOUS widget (InfiniteTable); would duplicate.
 *   3) one row shown empty — too small to FEEL "the whole table is empty"; reads as one unlucky context.
 *   4) auto camera flying over black — passive, no "I peeked HERE and HERE and it's STILL empty" agency.
 *   ✓ MINIMAP of all 19 683 rows as a pixel field (dark = never seen, amber = seen) + the reader drops a LENS
 *     on any patch → it magnifies into a readable sub-grid of real 4-letter contexts, almost all empty. The
 *     reader does the peeking, the emptiness is SEEN (pre-literal), and the counter of empty cells climbs as
 *     proof. The minimap itself is the rabbit hole: a vast dark field with a few amber freckles.
 *
 * THE HERO: the dark minimap (you see at a glance it's mostly black) → the magnified patch you peeked into.
 * The verdict ("casi toda vacía" + the emergent % of empty cells you've seen) only surfaces AFTER the reader
 * has peeked enough patches to have earned it (DISCOVER, don't announce).
 *
 * Real data only (getCounts(3) over Shakespeare): a cell is "seen" iff that exact 4-letter context exists in
 * the counts. Numbers are byte-true (19 683 rows, ~3 859 observed → ~80% empty).
 *
 * Assembled from the kit (PlayButton · CaptionLine · MONO/SERIF/STD/displayChar) + its one unique mechanic:
 * the minimap-and-lens peek. Tokens-only, [data-ngram-theme], memo, "use client", self-mounting, RM-safe.
 */

const K = 3; // 4 letras de memoria → 4-grama. 27^3 = 19 683 filas.
const ROWS_TOTAL = Math.pow(NGRAM_ALPHABET.length, K); // 19 683

// minimap geometry: a wide pixel field, one pixel per possible row. 162 × 122 ≈ 19 764 ≥ 19 683.
const MAP_COLS = 162;
const MAP_ROWS = Math.ceil(ROWS_TOTAL / MAP_COLS); // 122

// the magnified patch: an N×N block of contexts the reader peeks into and reads.
const PATCH = 7; // 49 contexts per peek — enough to SEE "almost all dark", small enough to read

// only after this many peeks do we let the verdict surface — the reader must EARN the conclusion.
const VERDICT_AFTER = 3;

const A = NGRAM_ALPHABET; // [space, a..z]

/**
 * Display-position → real row index. The minimap's SPATIAL layout is arbitrary (it's "one cell per possible
 * row"), so we SCATTER the rows with a deterministic multiplicative permutation. Without it, a context's 27
 * consecutive followers map to 27 consecutive indices → a bright horizontal DASH, and the dashes clump into
 * bands that misread as "half full". Scattering spreads the real 19.6% evenly as freckles, so the picture
 * tells the TRUE global sparsity (mostly empty) instead of lying with streaks. 19 683 = 3^9, so any multiplier
 * not divisible by 3 is coprime → a true bijection over [0, 19683). Positions ≥ 19 683 are void (off-table).
 */
const PERM_MULT = 7919; // a prime, not divisible by 3 → coprime to 19 683
function displayToRow(pos: number): number {
    return (pos * PERM_MULT) % ROWS_TOTAL;
}

/** Decode a row index 0..19682 into its 3-letter context (base-27, big-endian). */
function indexToContext(idx: number): string {
    let n = idx;
    const out: string[] = [];
    for (let p = 0; p < K; p++) {
        out.unshift(A[n % A.length]);
        n = Math.floor(n / A.length);
    }
    return out.join("");
}

export interface EmptyMatrixProps {
    accent?: "ngram";
}

export const EmptyMatrix = memo(function EmptyMatrix({ accent }: EmptyMatrixProps) {
    void accent;
    const reduce = useReducedMotion() === true;

    // Real counts: which of the 19 683 contexts were ever observed. Built once.
    const seenSet = useMemo(() => {
        const counts = getCounts(K);
        const set = new Set<number>();
        // map each observed context string back to its index — O(observed), cheap.
        for (const ctx of counts.keys()) {
            if (ctx.length !== K) continue;
            let idx = 0;
            let ok = true;
            for (let i = 0; i < K; i++) {
                const pos = A.indexOf(ctx[i]);
                if (pos < 0) { ok = false; break; }
                idx = idx * A.length + pos;
            }
            if (ok) set.add(idx);
        }
        return set;
    }, []);

    // The minimap as a flat array: for each display position, is its (scattered) row seen? Positions past
    // ROWS_TOTAL are void. 0 = empty, 1 = seen, 2 = void(outside the real table).
    const pixels = useMemo(() => {
        const arr = new Uint8Array(MAP_COLS * MAP_ROWS);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = i < ROWS_TOTAL ? (seenSet.has(displayToRow(i)) ? 1 : 0) : 2;
        }
        return arr;
    }, [seenSet]);

    // The lens: a PATCH×PATCH region anchored at a row index (top-left of the block within the minimap grid).
    // null until the reader peeks. We store the top-left CELL coordinates in the minimap.
    const [lens, setLens] = useState<{ col: number; row: number } | null>(null);
    const [peeks, setPeeks] = useState(0);
    const [emptySeen, setEmptySeen] = useState(0); // running tally of empty cells the reader has peeked at
    const [cellsSeen, setCellsSeen] = useState(0); // total cells peeked at (for the emergent %)
    const [filledSeen, setFilledSeen] = useState(0); // running tally of NON-empty cells peeked at
    const [rareSeen, setRareSeen] = useState(0);     // of those, how many were seen only once or twice (the WHY)
    const rngRef = useRef(0xc0ffee);

    // deterministic LCG so peeks are reproducible (no Math.random → stable captures)
    const nextRand = useCallback(() => {
        rngRef.current = (Math.imul(rngRef.current, 1664525) + 1013904223) >>> 0;
        return rngRef.current / 0xffffffff;
    }, []);

    // Count empty vs valid cells in a PATCH×PATCH block (the rows are scattered, so every patch is a fair,
    // representative sample of the table — no rigging needed, and the honest ~80% empty shows up in each peek).
    const computePatch = useCallback((col: number, row: number) => {
        let empties = 0, total = 0, filled = 0, rare = 0;
        const counts = getCounts(K);
        for (let dr = 0; dr < PATCH; dr++) {
            for (let dc = 0; dc < PATCH; dc++) {
                const c = col + dc;
                const r = row + dr;
                if (c >= MAP_COLS) continue;
                const pos = r * MAP_COLS + c;
                if (pos >= ROWS_TOTAL) continue; // outside the real table
                total++;
                const idx = displayToRow(pos);
                if (!seenSet.has(idx)) { empties++; continue; }
                filled++;
                // how many times this context was seen at all — the WHY: most filled rows are 1–2 times.
                const rc = counts.get(indexToContext(idx));
                let cnt = 0;
                if (rc) for (const v of rc.values()) cnt += v;
                if (cnt <= 2) rare++;
            }
        }
        return { empties, total, filled, rare };
    }, [seenSet]);

    const peekAt = useCallback((col: number, row: number) => {
        const c = Math.max(0, Math.min(MAP_COLS - PATCH, col));
        const r = Math.max(0, Math.min(MAP_ROWS - PATCH, row));
        setLens({ col: c, row: r });
        const { empties, total, filled, rare } = computePatch(c, r);
        setPeeks((p) => p + 1);
        setEmptySeen((e) => e + empties);
        setCellsSeen((s) => s + total);
        setFilledSeen((f) => f + filled);
        setRareSeen((rr) => rr + rare);
    }, [computePatch]);

    // "abrir otra zona" (matches the bench autoplay regex via `abrir`): jump the lens to a fresh random patch.
    // Rows are scattered, so every patch is a fair sample — each peek lands on a representative ~80%-empty
    // block. The first peek uses a fixed, central spot for a stable, readable opening; later peeks are random.
    const peekRandom = useCallback(() => {
        if (peeks === 0) {
            peekAt(Math.round(MAP_COLS * 0.5 - PATCH / 2), Math.round(MAP_ROWS * 0.4 - PATCH / 2));
            return;
        }
        const col = Math.floor(nextRand() * (MAP_COLS - PATCH));
        const row = Math.floor(nextRand() * (MAP_ROWS - PATCH));
        peekAt(col, row);
    }, [peeks, nextRand, peekAt]);

    // click anywhere on the minimap → peek there (direct manipulation, the affordance the cursor invites).
    const mapRef = useRef<HTMLDivElement | null>(null);
    const onMapClick = useCallback((e: React.MouseEvent) => {
        const el = mapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;
        peekAt(Math.round(fx * MAP_COLS - PATCH / 2), Math.round(fy * MAP_ROWS - PATCH / 2));
    }, [peekAt]);

    // the contexts in the current lens patch, as a readable PATCH×PATCH grid.
    const patchCells = useMemo(() => {
        if (!lens) return null;
        const cells: { idx: number; ctx: string; seen: boolean; count: number; valid: boolean }[] = [];
        const counts = getCounts(K);
        for (let dr = 0; dr < PATCH; dr++) {
            for (let dc = 0; dc < PATCH; dc++) {
                const c = lens.col + dc;
                const r = lens.row + dr;
                const pos = r * MAP_COLS + c;
                const valid = c < MAP_COLS && pos < ROWS_TOTAL;
                const idx = valid ? displayToRow(pos) : -1;
                const seen = valid && seenSet.has(idx);
                let count = 0;
                if (seen) {
                    const row = counts.get(indexToContext(idx));
                    if (row) for (const v of row.values()) count += v;
                }
                cells.push({ idx, ctx: valid ? indexToContext(idx) : "", seen, count, valid });
            }
        }
        return cells;
    }, [lens, seenSet]);

    const patchSeen = patchCells ? patchCells.filter((c) => c.seen).length : 0;
    const patchValid = patchCells ? patchCells.filter((c) => c.valid).length : 0;
    const patchEmpty = patchValid - patchSeen;

    // emergent % of empty cells across everything the reader has peeked at — earned, not announced.
    const emptyPct = cellsSeen > 0 ? Math.round((emptySeen / cellsSeen) * 100) : 0;
    // of the FEW filled rows, what share were seen only once or twice — the WHY (a count of 1 is an accident,
    // not a rule). This is the answer to "¿por qué importa que esté vacía?": even the filled part barely counts.
    const rarePct = filledSeen > 0 ? Math.round((rareSeen / filledSeen) * 100) : 0;
    const verdictReady = peeks >= VERDICT_AFTER;

    const tr = reduce ? { duration: 0.18, ease: STD } : { duration: 0.4, ease: STD };

    // lens overlay rectangle position (as % of the minimap box)
    const lensStyle: React.CSSProperties | undefined = lens
        ? {
              left: `${(lens.col / MAP_COLS) * 100}%`,
              top: `${(lens.row / MAP_ROWS) * 100}%`,
              width: `${(PATCH / MAP_COLS) * 100}%`,
              height: `${(PATCH / MAP_ROWS) * 100}%`,
          }
        : undefined;

    return (
        <div className="nw-em" style={{ fontFamily: SERIF }}>
            {/* ── THE HERO MINIMAP — the WHOLE 4-letter table, one cell per possible row, full width. Mostly
                 DARK: the eye hits a vast void freckled with amber before any words explain why. Click anywhere
                 (or the button) to drop the lens and magnify that patch. */}
            <div className="nw-em__map-cap">
                <span className="nw-em__map-num">{ROWS_TOTAL.toLocaleString("es-ES")}</span>
                <span className="nw-em__map-unit">filas posibles · 4 letras de memoria</span>
            </div>

            <div
                ref={mapRef}
                className="nw-em__map"
                role="button"
                tabIndex={0}
                aria-label="Asomarse a una zona de la tabla"
                onClick={onMapClick}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") peekRandom(); }}
            >
                <div className="nw-em__pixels" aria-hidden>
                    {Array.from(pixels).map((v, i) =>
                        v === 1 ? (
                            <span key={i} className="nw-em__px nw-em__px--seen" style={{ gridColumn: (i % MAP_COLS) + 1, gridRow: Math.floor(i / MAP_COLS) + 1 }} />
                        ) : null,
                    )}
                </div>

                {/* the lens rectangle — where the reader peeked. */}
                <AnimatePresence>
                    {lens && (
                        <motion.span
                            className="nw-em__lensbox"
                            style={lensStyle}
                            initial={reduce ? false : { opacity: 0, scale: 1.3 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={tr}
                        />
                    )}
                </AnimatePresence>

                {/* hint shown only before the first peek — the affordance, not the lesson */}
                {peeks === 0 && (
                    <span className="nw-em__maphint">asómate a cualquier zona →</span>
                )}
            </div>

            {/* ── BELOW: the magnified patch you peeked into + its readout, beside the running tally + control. */}
            <div className="nw-em__stage">
                {/* THE MAGNIFIED PATCH — the 49 real contexts in the lens. Read them: almost all empty. */}
                <div className="nw-em__patch-side">
                    <div className="nw-em__patch-cap">
                        {lens ? "lo que hay en esa zona" : "elige una zona para asomarte"}
                    </div>

                    <div className="nw-em__patch-frame">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={lens ? `${lens.col}-${lens.row}` : "empty"}
                                className="nw-em__patch"
                                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                                transition={tr}
                            >
                                {patchCells
                                    ? patchCells.map((c, i) => (
                                          <div
                                              key={i}
                                              className="nw-em__cell"
                                              data-seen={c.seen ? "1" : "0"}
                                              data-void={c.valid ? "0" : "1"}
                                              title={c.valid ? (c.seen ? `${displayChar(c.ctx)} · ${c.count.toLocaleString("es-ES")} veces` : `${displayChar(c.ctx)} · vacía`) : ""}
                                          >
                                              <span className="nw-em__cellctx">
                                                  {c.valid ? c.ctx.split("").map((ch, j) => (
                                                      <span key={j}>{displayChar(ch)}</span>
                                                  )) : ""}
                                              </span>
                                              {c.seen && (
                                                  <span className="nw-em__cellcount">{c.count.toLocaleString("es-ES")}</span>
                                              )}
                                          </div>
                                      ))
                                    : (
                                        // placeholder grid before first peek — silent, dark, inviting
                                        Array.from({ length: PATCH * PATCH }).map((_, i) => (
                                            <div key={i} className="nw-em__cell" data-seen="0" data-void="0" data-ghost="1" />
                                        ))
                                    )}
                            </motion.div>
                        </AnimatePresence>

                        {/* per-peek readout: how many of these 49 were empty — the local proof, every peek */}
                        {lens && (
                            <motion.div
                                key={`r-${peeks}`}
                                className="nw-em__patch-read"
                                initial={reduce ? false : { opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={tr}
                            >
                                <span className="nw-em__patch-empty">{patchEmpty}</span>
                                <span className="nw-em__patch-of"> de {patchValid} vacías aquí</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* THE TALLY + CONTROL — the empty-views counter climbs each peek; the verdict only surfaces
                    once the reader has peeked enough to have EARNED the conclusion (discover, don't announce). */}
                <div className="nw-em__foot">
                    <div className="nw-em__tally" data-on={peeks > 0 ? "1" : "0"}>
                        <span className="nw-em__tally-num">{emptySeen.toLocaleString("es-ES")}</span>
                        <span className="nw-em__tally-lbl">casillas vacías en {peeks} {peeks === 1 ? "vistazo" : "vistazos"}</span>
                    </div>

                    <PlayButton onClick={peekRandom}>
                        {peeks === 0 ? "asomarme a la tabla" : "abrir otra zona"}
                    </PlayButton>
                </div>
            </div>

            {/* the verdict — EMERGENT, never at frame 0. Surfaces only after a few peeks land on darkness. */}
            <AnimatePresence>
                {verdictReady && (
                    <motion.div
                        className="nw-em__verdict"
                        initial={reduce ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={tr}
                    >
                        <div className="nw-em__verdict-row">
                            <span className="nw-em__verdict-pct">{emptyPct}%</span>
                            <span className="nw-em__verdict-txt">
                                de lo que has mirado está vacío · te asomes donde te asomes, casi nada
                            </span>
                        </div>
                        {/* THE WHY — the empty isn't the problem; it's that even the filled rows barely count. */}
                        {filledSeen > 0 && (
                            <div className="nw-em__verdict-why">
                                y de las pocas que tienen algo, <b>{rarePct}%</b> las vio <b>una o dos veces</b> —
                                y una vez no es una regla, es una casualidad
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {!verdictReady && (
                <CaptionLine gap={0}>
                    {peeks === 0
                        ? "una rejilla con una fila por cada contexto posible"
                        : "sigue asomándote · ¿siempre encuentras lo mismo?"}
                </CaptionLine>
            )}

            <style>{`
                .nw-em {
                    width: 100%; max-width: 620px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: stretch; gap: 16px;
                }

                /* stage (below the hero map): magnified patch on the left, tally + control on the right */
                .nw-em__stage {
                    display: grid; grid-template-columns: auto 1fr; gap: 22px;
                    width: 100%; align-items: center;
                }

                /* ── hero map caption ── */
                .nw-em__map-cap { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
                .nw-em__map-num {
                    font-family: ${MONO}; font-weight: 700; font-size: clamp(22px, 4vw, 30px); line-height: 1;
                    color: var(--ngram-accent-bright); font-variant-numeric: tabular-nums;
                    text-shadow: 0 0 22px var(--ngram-accent-soft);
                }
                .nw-em__map-unit {
                    font-family: ${MONO}; font-size: 10.5px; letter-spacing: .06em; color: var(--ngram-muted);
                }

                /* The map substrate is DELIBERATELY a deep ink in BOTH themes (not bg-2): empty must read as
                   true VOID everywhere, so the lit fraction reads as sparse freckles, never "half full". This
                   is the one place the chapter goes dark-on-light on purpose — the field IS the table's void. */
                .nw-em__map {
                    position: relative; width: 100%; aspect-ratio: ${MAP_COLS} / ${MAP_ROWS};
                    max-height: 320px;
                    border-radius: var(--ngram-r-sm); overflow: hidden; cursor: crosshair;
                    background:
                        radial-gradient(120% 120% at 50% 50%,
                            color-mix(in oklab, var(--ngram-accent-deep) 22%, #0c0a06) 0%,
                            #0c0a06 70%);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-deep) 40%, transparent),
                                inset 0 0 50px color-mix(in oklab, #000 60%, transparent);
                }
                .nw-em__pixels {
                    position: absolute; inset: 0; display: grid;
                    grid-template-columns: repeat(${MAP_COLS}, 1fr);
                    grid-template-rows: repeat(${MAP_ROWS}, 1fr);
                    padding: 1px;
                    pointer-events: none;
                }
                /* only "seen" pixels are painted (a small bright dot, not a full cell): dense rows become a
                   dotted streak rather than a solid bar, so the eye reads "scattered freckles in the dark". */
                .nw-em__px--seen {
                    align-self: center; justify-self: center;
                    width: 52%; height: 52%; border-radius: 50%;
                    background: var(--ngram-accent-bright);
                    box-shadow: 0 0 2px color-mix(in oklab, var(--ngram-accent-bright) 70%, transparent);
                }
                /* the map is always dark, so the lens is a bright ring (light-on-dark) in both themes. */
                .nw-em__lensbox {
                    position: absolute; pointer-events: none; z-index: 3;
                    border-radius: 2px;
                    box-shadow: 0 0 0 1.5px #fff,
                                0 0 0 3px color-mix(in oklab, #0c0a06 80%, transparent),
                                0 0 20px 5px color-mix(in oklab, var(--ngram-accent-bright) 45%, transparent);
                    background: color-mix(in oklab, #fff 8%, transparent);
                }
                .nw-em__maphint {
                    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .08em;
                    color: color-mix(in oklab, #fff 88%, transparent);
                    background: color-mix(in oklab, #0c0a06 64%, transparent);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-bright) 35%, transparent);
                    padding: 5px 11px; border-radius: var(--ngram-r-pill); white-space: nowrap;
                    backdrop-filter: blur(3px); pointer-events: none; z-index: 4;
                }

                /* ── patch side ── */
                .nw-em__patch-side { display: flex; flex-direction: column; gap: 8px; width: 252px; flex: none; }
                .nw-em__patch-cap {
                    font-family: ${MONO}; font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase;
                    color: var(--ngram-dim); min-height: 14px;
                }
                .nw-em__patch-frame {
                    display: flex; flex-direction: column; gap: 9px;
                }
                .nw-em__patch {
                    display: grid; grid-template-columns: repeat(${PATCH}, 1fr); gap: 4px; width: 100%;
                }
                .nw-em__cell {
                    aspect-ratio: 1; border-radius: 4px; position: relative;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    background: var(--ngram-bg-2);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-ink) 7%, transparent);
                    overflow: hidden;
                }
                .nw-em__cell[data-ghost="1"] { opacity: .5; }
                .nw-em__cell[data-void="1"] { background: transparent; box-shadow: none; }
                .nw-em__cell[data-seen="1"] {
                    background: var(--ngram-accent);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-bright) 60%, transparent),
                                0 1px 8px color-mix(in oklab, var(--ngram-accent) 32%, transparent);
                }
                .nw-em__cellctx {
                    display: flex; gap: 0; font-family: ${MONO}; font-size: 8.5px; line-height: 1;
                    letter-spacing: -.02em; color: color-mix(in oklab, var(--ngram-ink) 34%, transparent);
                }
                .nw-em__cell[data-seen="1"] .nw-em__cellctx {
                    color: var(--ngram-on-accent); font-weight: 700; font-size: 9px;
                }
                .nw-em__cellcount {
                    font-family: ${MONO}; font-size: 8px; font-weight: 700; line-height: 1; margin-top: 2px;
                    color: color-mix(in oklab, var(--ngram-on-accent) 88%, transparent);
                    font-variant-numeric: tabular-nums;
                }

                .nw-em__patch-read {
                    font-family: ${MONO}; text-align: center;
                }
                .nw-em__patch-empty {
                    font-size: 20px; font-weight: 800; color: var(--ngram-ink);
                    font-variant-numeric: tabular-nums;
                }
                .nw-em__patch-of { font-size: 12px; color: var(--ngram-muted); }

                /* ── foot: tally + control (right column of the stage, stacked) ── */
                .nw-em__foot {
                    display: flex; flex-direction: column; align-items: flex-start;
                    gap: 16px; min-width: 0;
                }
                .nw-em__tally {
                    display: flex; flex-direction: column; gap: 0;
                    opacity: 0; transition: opacity .3s ease;
                }
                .nw-em__tally[data-on="1"] { opacity: 1; }
                .nw-em__tally-num {
                    font-family: ${MONO}; font-weight: 800; font-size: clamp(26px, 5vw, 38px); line-height: 1;
                    color: var(--ngram-ink); font-variant-numeric: tabular-nums;
                }
                .nw-em__tally-lbl {
                    font-family: ${MONO}; font-size: 10.5px; letter-spacing: .04em; color: var(--ngram-muted);
                }

                /* ── verdict (emergent) ── */
                .nw-em__verdict {
                    display: flex; flex-direction: column; gap: 10px;
                    width: 100%; padding: 14px 18px; border-radius: var(--ngram-r-md);
                    background: var(--ngram-sage-soft);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-sage) 30%, transparent);
                }
                .nw-em__verdict-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
                .nw-em__verdict-why {
                    font-family: ${SERIF}; font-size: 14px; line-height: 1.4; color: var(--ngram-ink-2);
                    padding-top: 10px; border-top: 1px solid color-mix(in oklab, var(--ngram-sage) 22%, transparent);
                }
                .nw-em__verdict-why b { color: var(--ngram-sage); font-weight: 800; font-style: normal; }
                .nw-em__verdict-pct {
                    font-family: ${MONO}; font-weight: 800; font-size: clamp(30px, 6vw, 44px); line-height: 1;
                    color: var(--ngram-sage); font-variant-numeric: tabular-nums;
                }
                .nw-em__verdict-txt {
                    font-family: ${SERIF}; font-size: 15px; font-style: italic; color: var(--ngram-ink-2);
                    line-height: 1.35; flex: 1; min-width: 200px;
                }

                @media (max-width: 560px) {
                    .nw-em__stage { grid-template-columns: 1fr; gap: 16px; justify-items: center; }
                    .nw-em__patch-side { width: 100%; max-width: 300px; }
                    .nw-em__foot { align-items: center; }
                    .nw-em__cellctx { font-size: 9px; }
                    .nw-em__cell[data-seen="1"] .nw-em__cellctx { font-size: 9.5px; }
                }
            `}</style>
        </div>
    );
});

export default EmptyMatrix;
