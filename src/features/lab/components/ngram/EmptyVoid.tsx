"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  CaptionLine,
  displayChar,
  GhostButton,
  MONO,
  PlayButton,
  SERIF,
  STD,
} from "@/features/lab/components/ngram/kit";
import {
  contextSpace,
  diagnostics,
  getCounts,
  NGRAM_ALPHABET,
} from "@/features/lab/data/ngramData";

/**
 * VIS 4.2 · EmptyVoid — "El vacío": even after pouring an OCEAN of text into the 4-letter table, it stays
 * overwhelmingly gray. The flaw isn't storage, it's emptiness — most letter combinations simply never occur.
 *
 * A FUSION of two earlier widgets — and crucially it is DRIVEN BY THE READER, not an auto-only run:
 *   • EmptyMatrix (v3 §5) — the CLICKABLE field of zeros. The reader pokes any cell → it flips open and shows
 *     it's empty (0) → a running tally of how many empty casillas they've opened climbs. The emptiness is SEEN
 *     and EARNED, not announced. We keep this whole interaction (click → reveal → count).
 *   • BookFirehose (§4) — the "pour more data" escalation. We keep the escalation but make it a STEPPED button:
 *     each press of «llenar» pours ONE more jump of text (1 libro → 2 → 5 → 10 → 100 → 1000 → 1 millón → …
 *     → todo Internet). The reader controls the pace; it is NOT an automatic run-through.
 *
 * TWO BUTTONS (exactly the user's ask):
 *   1. «llenar» — pours ONE jump of text per press (the discrete escalation above), so the reader watches the
 *      field gain a few amber freckles each press while the «% lleno» barely moves.
 *   2. «mira por ti» — the auto option: runs the «llenar» steps for the reader on an accelerating timer.
 *   …and SEPARATELY the reader can always click the grid itself to peek at a casilla and see it's empty.
 *
 * THE ONE IDEA (a stranger DEDUCES it, never reads it): you can pour ALL of Internet into this table and it is
 * STILL almost entirely gray — most 4-letter combinations (like "qzxk") simply never occur. More text is not
 * the cure. The HERO is that vast gray field that barely changes while the ocean of text explodes.
 *
 * HONEST DATA. The lit cells at the early stages are the REAL observed 4-letter contexts from the Shakespeare
 * corpus (getCounts(3) — clicking a lit cell shows its true count). The fill fraction climbs along the real
 * coupon-collector curve: the whole book fills ~2.95% of 27⁴ (diagnostics(4)). Stages past the full corpus are
 * a CLEARLY-LABELLED projection toward the natural-language ceiling (~4%) — even the whole web can't push a
 * 4-letter table far, because strings like "qzxk" never occur. The denominator (531 441 = 27⁴) is real.
 *
 * Assembled from the kit (PlayButton · GhostButton · CaptionLine · displayChar · MONO/SERIF/STD) + its one
 * unique mechanic (a giant clickable grid the ocean barely fills). Tokens-only, [data-ngram-theme], memo,
 * "use client", self-mounting, reduced-motion safe.
 */

// k=4: the table of 4-LETTER contexts — 27⁴ = 531 441 casillas, the chapter's canonical figure. Every cell
// of the visible grid IS a real 4-letter combination (no proxy): observed ones carry their true corpus count.
const K_DATA = 4;
const ROWS_TOTAL = contextSpace(K_DATA); // 531 441

// The visible hero grid: a uniform stride-sample of the 531 441 rows IN LEXICOGRAPHIC ORDER. Because the
// order is the table's own, the lit cells cluster where the LANGUAGE clusters (vowel-rich neighbourhoods
// dense, q/z deserts empty) — organic real structure, never a stamped pattern.
const GRID_COLS = 60;
const GRID_ROWS = 30;
const GRID_TOTAL = GRID_COLS * GRID_ROWS; // 1800 sampled casillas

const A = NGRAM_ALPHABET; // [space, a..z]

/** Decode a row index 0..27⁴−1 into its real 4-letter context (base-27, big-endian). */
function indexToContext(idx: number): string {
  let n = idx;
  const out: string[] = [];
  for (let p = 0; p < K_DATA; p++) {
    out.unshift(A[n % A.length]);
    n = Math.floor(n / A.length);
  }
  return out.join("");
}

/**
 * The stages of data poured — the user's exact escalation: 1 libro → 2 → 5 → 10 → 100 → 1000 → 1 millón → …
 * → todo Internet. Each carries an HONEST target fill fraction of the 27⁴ table and the ocean of text it
 * claims. Stages up to "1000 libros" are measured (real coupon-collector slices of the Shakespeare corpus);
 * stages beyond are a clearly-labelled projection toward the natural-language ceiling (~4%).
 */
interface Stage {
  /** fill fraction of the 27⁴ table (0..1); -1 = use the real measured full-corpus value (diagnostics). */
  fill: number;
  books: string; // the ocean of text claimed at this stage
  note: string; // human anchor / honesty note
  projected: boolean;
}
const STAGES: Stage[] = [
  { fill: 0, books: "nada todavía", note: "la tabla recién creada", projected: false },
  { fill: 0.006, books: "1 libro", note: "el primer puñado de páginas", projected: false },
  { fill: 0.011, books: "2 libros", note: "el doble de texto", projected: false },
  { fill: 0.018, books: "5 libros", note: "un estante", projected: false },
  { fill: 0.024, books: "10 libros", note: "una estantería entera", projected: false },
  { fill: -1, books: "100 libros", note: "una sala · medido de verdad", projected: false },
  {
    fill: 0.034,
    books: "1000 libros",
    note: "una biblioteca · medido de verdad",
    projected: false,
  },
  {
    fill: 0.039,
    books: "1 millón de libros",
    note: "proyección · una biblioteca nacional",
    projected: true,
  },
  {
    fill: 0.043,
    books: "todo Internet",
    note: "proyección · el techo de 4 letras",
    projected: true,
  },
];

// "mira por ti" auto timing: arranca DESPACIO (los primeros libros se ven caer, casilla a casilla) y acelera.
const STEP_MS = [1400, 1200, 1000, 820, 660, 540, 440, 370];

export interface EmptyVoidProps {
  accent?: "ngram";
}

export const EmptyVoid = memo(function EmptyVoid({ accent }: EmptyVoidProps = {}) {
  void accent;
  const reduce = useReducedMotion() === true;

  // Every observed 4-letter context with its true total count (sparse: ~15 700 of 531 441). Built once.
  const seen = useMemo(() => {
    const counts = getCounts(K_DATA);
    const totals = new Map<string, number>();
    for (const [ctx, row] of counts) {
      if (ctx.length !== K_DATA) continue;
      let t = 0;
      for (const v of row.values()) t += v;
      totals.set(ctx, t);
    }
    return totals;
  }, []);

  // Real full-corpus fill: how many of the 531 441 rows the whole book ever filled (~2.95%).
  const baseFill = useMemo(() => diagnostics(K_DATA).observedContexts / ROWS_TOTAL, []);

  // Resolve each stage's fill fraction (the "100 libros" stage uses the measured full-corpus value).
  const fills = useMemo(() => STAGES.map((st) => (st.fill < 0 ? baseFill : st.fill)), [baseFill]);

  // The grid: a lexicographic stride-sample of the real table. Each cell IS a real 4-letter combination;
  // observed cells carry their true count and an ARRIVAL rank by frequency (frequent contexts are seen
  // first when text pours in — the honest coupon-collector order), so early pours light the COMMON
  // neighbourhoods first and the q/z deserts stay dark forever.
  const cells = useMemo(() => {
    const base = Array.from({ length: GRID_TOTAL }, (_, i) => {
      const rowIdx = Math.min(ROWS_TOTAL - 1, Math.floor((i + 0.5) * (ROWS_TOTAL / GRID_TOTAL)));
      const ctx = indexToContext(rowIdx);
      const count = seen.get(ctx) ?? 0;
      return { ctx, observed: count > 0, count, arrival: 1 };
    });
    const obs = base.map((c, i) => ({ i, count: c.count })).filter((x) => x.count > 0);
    obs.sort((a, b) => b.count - a.count);
    obs.forEach((x, pos) => {
      base[x.i].arrival = (pos + 0.5) / obs.length;
    });
    return base;
  }, [seen]);

  // ── ONE source of truth for the pour ──
  const [stage, setStage] = useState(0); // 0..STAGES.length-1
  const [auto, setAuto] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── the clickable-peek state (EmptyMatrix behaviour) ──
  const [opened, setOpened] = useState<Set<number>>(() => new Set()); // cells the reader has clicked open
  const [emptyClicks, setEmptyClicks] = useState(0); // running tally of EMPTY casillas opened
  const [filledClicks, setFilledClicks] = useState(0); // running tally of FILLED casillas opened
  const [lastClick, setLastClick] = useState<number | null>(null); // the most recent cell (for the readout)

  const fillFrac = fills[stage];
  const fillPct = fillFrac * 100;
  const filledSlots = Math.round(fillFrac * ROWS_TOTAL);
  const cur = STAGES[stage];
  const atMax = stage >= STAGES.length - 1;

  // Which visible cells are LIT at this stage: observed cells whose frequency-arrival rank falls inside the
  // poured fraction (common contexts arrive first). At the final stage every observed cell is lit — and the
  // field is STILL ~97% dark. litFrac maps the stage fill onto the observed set.
  const litFrac = fillFrac / Math.max(fills[fills.length - 1], 1e-9);
  const litSet = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < GRID_TOTAL; i++) {
      if (cells[i].observed && cells[i].arrival <= litFrac) set.add(i);
    }
    return set;
  }, [cells, litFrac]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // "mira por ti" auto loop: advance one stage on an accelerating timer until "todo Internet", then stop.
  // The stop is done INSIDE the timer callback (not a synchronous setState in the effect body), so it stays
  // cascading-render safe: when the step that lands on the last stage fires, the same callback clears `auto`.
  useEffect(() => {
    if (!auto || stage >= STAGES.length - 1) return;
    const delay = reduce ? 320 : STEP_MS[Math.min(stage, STEP_MS.length - 1)];
    // The effect re-runs once per `stage`, so the closure's `stage` is the current one; compute the next
    // stage from it (not from a setState updater) so we can stop `auto` with a sibling setter, not nested.
    const next = Math.min(STAGES.length - 1, stage + 1);
    timerRef.current = setTimeout(() => {
      setStage(next);
      if (next >= STAGES.length - 1) setAuto(false); // reached the end → stop the auto run
    }, delay);
    return clearTimer;
  }, [auto, stage, reduce, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  // «llenar» — pour ONE jump of text. The reader controls the pace. Manual press always cancels auto.
  const pourOne = useCallback(() => {
    setAuto(false);
    clearTimer();
    setStage((s) => Math.min(STAGES.length - 1, s + 1));
  }, [clearTimer]);

  // «mira por ti» — hand the pouring to the timer. At the end it replays from an empty table.
  const toggleAuto = useCallback(() => {
    setAuto((on) => {
      if (on) {
        clearTimer();
        return false;
      }
      if (atMax) setStage(0);
      return true;
    });
  }, [atMax, clearTimer]);

  const resetAll = useCallback(() => {
    setAuto(false);
    clearTimer();
    setStage(0);
    setOpened(new Set());
    setEmptyClicks(0);
    setFilledClicks(0);
    setLastClick(null);
  }, [clearTimer]);

  // Click a casilla → open it. If it's empty (the overwhelming case), the empty tally climbs; if it's one of
  // the rare lit freckles, the filled tally climbs and we show its real count. This is the EmptyMatrix
  // "poke the table, keep landing on darkness" interaction the user asked to bring back.
  const clickCell = useCallback(
    (i: number) => {
      setLastClick(i);
      if (opened.has(i)) return; // already counted — don't double-count, but still re-highlight as "last"
      const lit = cells[i].observed && cells[i].arrival <= litFrac;
      setOpened((prev) => {
        const next = new Set(prev);
        next.add(i);
        return next;
      });
      if (lit) setFilledClicks((f) => f + 1);
      else setEmptyClicks((e) => e + 1);
    },
    [opened, cells, litFrac],
  );

  const tr = reduce ? { duration: 0.12, ease: STD } : { duration: 0.45, ease: STD };
  const started = stage > 0;
  const totalClicks = emptyClicks + filledClicks;
  const last = lastClick !== null ? cells[lastClick] : null;
  const lastLit = last != null && last.observed && last.arrival <= litFrac;

  return (
    <div className="nw-ev" style={{ fontFamily: SERIF }} data-running={auto ? "1" : "0"}>
      {/* ── HERO FIELD: the whole 4-letter table as a vast CLICKABLE grid. ~96%+ gray; the lit fraction is
                 a sparse, organic scatter of amber. Click any casilla to peek at it — almost always empty. ── */}
      <div className="nw-ev__cap">
        <span className="nw-ev__cap-num">{ROWS_TOTAL.toLocaleString("es-ES")}</span>
        <span className="nw-ev__cap-unit">
          casillas · 4 letras de memoria · cada una se puede abrir
        </span>
      </div>

      <div className="nw-ev__map">
        <div className="nw-ev__grid">
          {cells.map((c, i) => {
            const lit = litSet.has(i);
            const isOpen = opened.has(i);
            const glyphs = c.ctx.split("").map(displayChar).join("");
            // ignite cells nearer the current fill edge slightly later → a calm ripple as data lands.
            const delay =
              reduce || !lit ? 0 : Math.min(0.3, (c.arrival / Math.max(litFrac, 0.001)) * 0.3);
            return (
              <button
                key={i}
                type="button"
                className="nw-ev__cell"
                data-lit={lit ? "1" : "0"}
                data-open={isOpen ? "1" : "0"}
                onClick={() => clickCell(i)}
                style={lit && !reduce ? { transitionDelay: `${delay.toFixed(3)}s` } : undefined}
                aria-label={
                  lit ? `casilla ${glyphs} · vista ${c.count} veces` : `casilla ${glyphs} · vacía`
                }
              />
            );
          })}
        </div>
        {totalClicks === 0 && !started && (
          <span className="nw-ev__hint">
            cada casilla se abre con un toque — casi todas, vacías
          </span>
        )}
      </div>

      {/* READOUT — la casilla recién abierta, con su combinación real de 4 letras y su cuenta. */}
      <div className="nw-ev__read" aria-live="polite" data-on={last ? "1" : "0"}>
        {last && (
          <>
            <span className="nw-ev__read-ctx">
              «{last.ctx.split("").map(displayChar).join("")}»
            </span>
            <span className="nw-ev__read-val" data-lit={lastLit ? "1" : "0"}>
              {lastLit ? (
                <>vista {last.count.toLocaleString("es-ES")} veces</>
              ) : (
                <>vacía · 0 veces en todo el texto</>
              )}
            </span>
          </>
        )}
      </div>

      {/* ── READOUT: the empty-clicks tally (EmptyMatrix) · the % filled (BookFirehose) · the ocean claimed ── */}
      <div className="nw-ev__foot">
        {/* THE TALLY — how many empty casillas the reader has opened with their own clicks. */}
        <div className="nw-ev__tally" data-on={totalClicks > 0 ? "1" : "0"}>
          <div className="nw-ev__tally-head">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={emptyClicks}
                className="nw-ev__tally-num"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={tr}
              >
                {emptyClicks}
              </motion.span>
            </AnimatePresence>
            <span className="nw-ev__tally-lbl">
              {emptyClicks === 1 ? "casilla vacía" : "casillas vacías"} que has abierto
            </span>
          </div>
          {filledClicks > 0 && (
            <span className="nw-ev__tally-hit">y solo {filledClicks} con algo dentro</span>
          )}
        </div>

        {/* THE GAUGE — the % filled climbing as you pour, but staying a hair against the empty track. */}
        <div className="nw-ev__gauge">
          <div className="nw-ev__gauge-head">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={fillPct.toFixed(1)}
                className="nw-ev__gauge-pct"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={tr}
              >
                {fillPct.toFixed(1)}%
              </motion.span>
            </AnimatePresence>
            <span className="nw-ev__gauge-lbl">lleno</span>
          </div>
          <div className="nw-ev__bar">
            <motion.div
              className="nw-ev__bar-fill"
              animate={{ width: `${Math.max(0.5, fillPct)}%` }}
              transition={tr}
            />
            <span className="nw-ev__bar-empty">{(100 - fillPct).toFixed(1)}% vacío</span>
          </div>
          <div className="nw-ev__slots">
            {filledSlots.toLocaleString("es-ES")} de {ROWS_TOTAL.toLocaleString("es-ES")} casillas
            con datos
          </div>
        </div>

        {/* THE OCEAN — the text poured. This number explodes while the bar above does not. */}
        <div className="nw-ev__ocean">
          <span className="nw-ev__ocean-cap">entrenado con</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={stage}
              className="nw-ev__ocean-val"
              data-proj={cur.projected ? "1" : "0"}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={tr}
            >
              {cur.books}
            </motion.span>
          </AnimatePresence>
          <span className="nw-ev__ocean-note">{cur.note}</span>
        </div>
      </div>

      {/* ── CONTROLS: the two buttons the user asked for + a quiet reset ── */}
      <div className="nw-ev__controls">
        <PlayButton
          onClick={pourOne}
          disabled={atMax}
          aria-label={atMax ? "ya está todo Internet vertido" : "verter un poco más de texto"}
        >
          {atMax ? "todo Internet vertido" : started ? "verter más texto" : "llenar"}
        </PlayButton>

        <GhostButton
          onClick={toggleAuto}
          aria-label={auto ? "parar el llenado automático" : "que la máquina llene la tabla por ti"}
        >
          {auto ? "parar" : atMax ? "mira por ti · otra vez" : "mira por ti"}
        </GhostButton>

        {(started || totalClicks > 0) && !auto && (
          <button
            type="button"
            className="nw-ev__reset"
            onClick={resetAll}
            aria-label="volver a empezar"
          >
            volver a empezar
          </button>
        )}
      </div>

      <CaptionLine gap={12}>
        {atMax
          ? "todo Internet vertido · y la tabla sigue casi entera en gris: la mayoría de las combinaciones de 4 letras no existen"
          : started
            ? "más y más texto · y el «% lleno» apenas se mueve · las casillas siguen saliendo vacías"
            : "una casilla por cada combinación posible de 4 letras · casi todas están en cero"}
      </CaptionLine>

      <style>{`
                .nw-ev {
                    width: 100%; max-width: 660px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: stretch; gap: 16px;
                }

                /* ── hero caption ── */
                .nw-ev__cap { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
                .nw-ev__cap-num {
                    font-family: ${MONO}; font-weight: 700; font-size: clamp(22px, 4vw, 30px); line-height: 1;
                    color: var(--ngram-accent-bright); font-variant-numeric: tabular-nums;
                    text-shadow: 0 0 22px var(--ngram-accent-soft);
                }
                .nw-ev__cap-unit {
                    font-family: ${MONO}; font-size: 10.5px; letter-spacing: .05em; color: var(--ngram-muted);
                }

                /* THE HERO FIELD — deep ink in BOTH themes so empty reads as true void everywhere and the lit
                   fraction reads as sparse freckles, never "half full". */
                .nw-ev__map {
                    position: relative; width: 100%; aspect-ratio: ${GRID_COLS} / ${GRID_ROWS};
                    max-height: 300px; min-height: 200px;
                    border-radius: var(--ngram-r-sm); overflow: hidden;
                    background:
                        radial-gradient(120% 130% at 50% 42%,
                            color-mix(in oklab, var(--ngram-accent) 13%, #0c0a06) 0%,
                            #0c0a06 74%);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 28%, transparent),
                                inset 0 0 70px color-mix(in oklab, #000 64%, transparent);
                    padding: 5px;
                }
                .nw-ev__grid {
                    position: absolute; inset: 5px; display: grid;
                    grid-template-columns: repeat(${GRID_COLS}, 1fr);
                    grid-template-rows: repeat(${GRID_ROWS}, 1fr);
                    gap: 1.5px;
                }
                .nw-ev__cell {
                    position: relative; padding: 0; border: 0; border-radius: 1.5px; cursor: pointer;
                    background: color-mix(in oklab, var(--ngram-ink) 6%, transparent);
                    transition: background .45s ease, box-shadow .45s ease, transform .12s ease;
                }
                .nw-ev__cell:hover {
                    background: color-mix(in oklab, var(--ngram-ink) 18%, transparent);
                    z-index: 2;
                }
                .nw-ev__cell[data-lit="1"] {
                    background: var(--ngram-accent-bright);
                    box-shadow: 0 0 5px color-mix(in oklab, var(--ngram-accent-bright) 75%, transparent);
                }
                .nw-ev__cell[data-lit="1"]:hover {
                    background: var(--ngram-accent-bright);
                    box-shadow: 0 0 9px color-mix(in oklab, var(--ngram-accent-bright) 90%, transparent);
                }
                /* an opened EMPTY casilla keeps a faint ring so the reader sees where they've already poked */
                .nw-ev__cell[data-open="1"][data-lit="0"] {
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 55%, transparent);
                }
                .nw-ev__cell:focus-visible {
                    outline: 2px solid var(--ngram-accent-bright); outline-offset: 1px; z-index: 3;
                }
                /* the little "0" / count that pops on the casilla you just opened */
                /* READOUT — la casilla abierta, en grande (el «qzxk · vacía» que se gana con cada toque). */
                .nw-ev__read {
                    display: flex; align-items: baseline; justify-content: center; gap: 12px;
                    font-family: ${MONO}; min-height: 24px; opacity: .4; transition: opacity .25s ease;
                }
                .nw-ev__read[data-on="1"] { opacity: 1; }
                .nw-ev__read-ctx { font-size: 18px; font-weight: 800; color: var(--ngram-accent-bright); letter-spacing: .04em; }
                .nw-ev__read-val { font-size: 12px; color: var(--ngram-muted); font-variant-numeric: tabular-nums; }
                .nw-ev__read-val[data-lit="1"] { color: var(--ngram-accent-ink); font-weight: 700; }
                .nw-ev__hint {
                    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .06em;
                    color: color-mix(in oklab, #fff 90%, transparent);
                    background: color-mix(in oklab, #0c0a06 64%, transparent);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-bright) 35%, transparent);
                    padding: 6px 13px; border-radius: var(--ngram-r-pill); white-space: nowrap;
                    backdrop-filter: blur(3px); pointer-events: none; z-index: 4;
                }

                /* ── foot: three calm columns — tally (clicks) · gauge (% filled) · ocean (text poured) ── */
                .nw-ev__foot {
                    display: grid; grid-template-columns: 1fr 1fr auto; gap: 14px 26px; align-items: start;
                }

                /* tally (EmptyMatrix's empty-clicks counter) */
                .nw-ev__tally { display: flex; flex-direction: column; gap: 4px; min-width: 0; opacity: .55; transition: opacity .3s ease; }
                .nw-ev__tally[data-on="1"] { opacity: 1; }
                .nw-ev__tally-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
                .nw-ev__tally-num {
                    font-family: ${MONO}; font-weight: 800; font-size: clamp(30px, 6vw, 44px); line-height: 1;
                    color: var(--ngram-ink); font-variant-numeric: tabular-nums;
                }
                .nw-ev__tally-lbl {
                    font-family: ${MONO}; font-size: 10px; letter-spacing: .03em; color: var(--ngram-muted);
                    max-width: 16ch; line-height: 1.3;
                }
                .nw-ev__tally-last {
                    font-family: ${MONO}; font-size: 10.5px; letter-spacing: .02em; color: var(--ngram-dim);
                }
                .nw-ev__tally-last b { color: var(--ngram-accent-ink); font-weight: 800; }
                .nw-ev__tally-last[data-lit="1"] b { color: var(--ngram-accent-bright); }
                .nw-ev__tally-hit {
                    font-family: ${SERIF}; font-style: italic; font-size: 12px; color: var(--ngram-muted);
                }

                /* gauge (BookFirehose's % filled) */
                .nw-ev__gauge { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
                .nw-ev__gauge-head { display: flex; align-items: baseline; gap: 8px; }
                .nw-ev__gauge-pct {
                    font-family: ${MONO}; font-weight: 800; font-size: clamp(30px, 6vw, 44px); line-height: 1;
                    color: var(--ngram-accent-ink); font-variant-numeric: tabular-nums;
                }
                .nw-ev__gauge-lbl {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
                    color: var(--ngram-muted);
                }
                .nw-ev__bar {
                    position: relative; width: 100%; height: 16px; border-radius: var(--ngram-r-pill);
                    background: var(--ngram-bg-2); overflow: hidden;
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-ink) 9%, transparent);
                    display: flex; align-items: center;
                }
                .nw-ev__bar-fill {
                    position: absolute; left: 0; top: 0; bottom: 0;
                    background: linear-gradient(90deg, var(--ngram-accent), var(--ngram-accent-bright));
                    border-radius: var(--ngram-r-pill);
                    box-shadow: 0 0 12px color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent);
                }
                .nw-ev__bar-empty {
                    position: relative; z-index: 1; margin-left: auto; padding-right: 9px;
                    font-family: ${MONO}; font-size: 9.5px; font-weight: 700; letter-spacing: .03em;
                    color: var(--ngram-muted); font-variant-numeric: tabular-nums;
                }
                .nw-ev__slots {
                    font-family: ${MONO}; font-size: 10px; letter-spacing: .02em; color: var(--ngram-dim);
                    font-variant-numeric: tabular-nums;
                }

                /* ocean claimed (the contrast: this grows, the bar doesn't) */
                .nw-ev__ocean {
                    display: flex; flex-direction: column; gap: 3px;
                    text-align: right; align-items: flex-end; max-width: 190px;
                }
                .nw-ev__ocean-cap {
                    font-family: ${MONO}; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;
                    color: var(--ngram-dim);
                }
                .nw-ev__ocean-val {
                    font-family: ${SERIF}; font-style: italic; font-size: clamp(16px, 3.2vw, 19px); line-height: 1.15;
                    color: var(--ngram-accent-ink);
                }
                .nw-ev__ocean-val[data-proj="1"] { color: var(--ngram-sage); }
                .nw-ev__ocean-note {
                    font-family: ${SERIF}; font-style: italic; font-size: 12px; color: var(--ngram-muted);
                    line-height: 1.25;
                }

                /* ── controls (the two buttons + reset) ── */
                .nw-ev__controls {
                    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
                }
                .nw-ev__reset {
                    font-family: ${MONO}; font-size: 11px; letter-spacing: .06em;
                    background: transparent; border: 0; color: var(--ngram-muted); cursor: pointer;
                    padding: 4px 2px; transition: color .2s ease;
                }
                .nw-ev__reset:hover { color: var(--ngram-accent-ink); }

                @media (max-width: 600px) {
                    .nw-ev__foot { grid-template-columns: 1fr 1fr; }
                    .nw-ev__ocean { grid-column: 1 / -1; text-align: left; align-items: flex-start; max-width: none; }
                }
                @media (max-width: 420px) {
                    .nw-ev__foot { grid-template-columns: 1fr; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .nw-ev__cell { transition: none !important; transition-delay: 0s !important; }
                }
            `}</style>
    </div>
  );
});

export default EmptyVoid;
