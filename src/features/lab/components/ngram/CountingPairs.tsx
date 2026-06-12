"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  CaptionLine,
  displayChar,
  GhostButton,
  heat,
  MONO,
  PlayButton,
  SERIF,
  STD,
} from "@/features/lab/components/ngram/kit";

/**
 * VIS 2.1 · CountingPairs — "Contando parejas" (spine §2 bridge into the trigram).
 *
 * CONTEXT. The reader has just met the bigram counting widget (BigramMatrixBuilder): every adjacent pair
 * dropped a +1 into a cell keyed by ONE letter. The ONE NEW idea here — and the whole point of this beat —
 * is that building the trigram is the EXACT SAME counting gesture; only the row KEY grows from 1 letter to 2.
 * So this widget deliberately wears the bigram interface (same toy phrase "the cat sat on the mat", same sunk
 * phrase panel, same +1 → table mechanic) and changes exactly one thing: the table's row key is now the
 * 2-letter context ("th →", "he →", …) instead of a single letter.
 *
 * MECHANIC (ported from BigramMatrixBuilder, dressed in ngram/kit · amber):
 *   • the source phrase is a sunk --ngram-bg-2 panel. The moving window highlights the current PAIR: the
 *     origin char filled accent (hot1), the second char of the pair tinted accent-soft (hot2), past chars dim.
 *     The NEXT char (the trigram target, = the table column) gets a faint outline so the eye traces
 *     "this pair → that letter".
 *   • "Siguiente" advances ONE step (manual first — the reader sets the pace). Each step lands a +1: the pair
 *     line prints "th → a  +1", the matching cell in the growing table pulses and its count ticks up, and a new
 *     ROW is born the first time a 2-letter context is seen — so the table visibly GROWS row by row.
 *   • after a first manual pass the reader can hand it to a slow auto-play; a reset returns to the start.
 *   • cell heat is honest (tint scales with the cell's share of the running max) — never neon, never a border grid.
 *
 * HONEST DATA. Counts are tallies over the FIXED toy phrase only, computed inline from the string (this short
 * phrase is honest — it is a toy, not the corpus). No faked numbers; the table only ever shows what the 21
 * trigram windows of "the cat sat on the mat" actually produce.
 *
 * Tokens-only under [data-ngram-theme]; memo; reduced-motion safe (no fly/pulse; final state shown instantly).
 */

const TEXT = "the cat sat on the mat"; // the SAME toy phrase the bigram widget used
const K = 2; // letters of context (the row key) — a trigram: pair → next char
const AUTO_MS = 760; // slow auto-play cadence, offered only after a manual pass

/** One step of the sweep: the 2-letter context, the next char, and the row it lands in. */
interface Step {
  ctx: string; // the 2-letter context, e.g. "th"
  next: string; // the following char (the column), e.g. "e"
  pos: number; // index in TEXT of the context's first char
}

/** Every trigram window of the toy phrase, in reading order (deterministic, never random). */
function buildSteps(text: string): Step[] {
  const out: Step[] = [];
  for (let i = 0; i + K < text.length; i++) {
    out.push({ ctx: text.slice(i, i + K), next: text[i + K], pos: i });
  }
  return out;
}

/** Render a 2-letter context with spaces shown as ␣ (e.g. "th", "e␣", "␣c"). */
function labelCtx(ctx: string): string {
  return displayChar(ctx[0]) + displayChar(ctx[1]);
}

export const CountingPairs = memo(function CountingPairs({ accent }: { accent?: "ngram" } = {}) {
  void accent;
  const reduce = useReducedMotion();

  const steps = useMemo(() => buildSteps(TEXT), []);

  // -1 = not started; otherwise index of the step just landed.
  const [stepIdx, setStepIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  // Hover probe — reading a cell by hand: fila «th» · columna «e» → 2 veces (the how-to-read lesson).
  const [probe, setProbe] = useState<{ ctx: string; col: string } | null>(null);
  const started = stepIdx >= 0;
  const active = started ? steps[stepIdx] : null;
  const done = stepIdx >= steps.length - 1;
  // auto-play is offered only AFTER the reader has stepped through once by hand.
  const [didManualPass, setDidManualPass] = useState(false);

  // The set of distinct columns (next chars) that ever occur — the table's columns, alphabetical.
  const columns = useMemo(() => {
    const set = new Set<string>();
    for (const s of steps) set.add(s.next);
    return Array.from(set).sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0));
  }, [steps]);

  // The set of distinct contexts (row keys), in the order they FIRST appear — so the table grows top-down
  // in the same order the reader meets each pair while sweeping the phrase.
  const rowOrder = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const s of steps) {
      if (!seen.has(s.ctx)) {
        seen.add(s.ctx);
        order.push(s.ctx);
      }
    }
    return order;
  }, [steps]);

  // The live tally: counts[ctx][next] over the steps landed so far. Rebuilt from stepIdx so reset/auto/
  // manual all share one honest source of truth. Also returns which rows are alive (seen ≥ once).
  const { counts, liveRows, maxCount } = useMemo(() => {
    const c = new Map<string, Map<string, number>>();
    let mx = 1;
    for (let i = 0; i <= Math.min(stepIdx, steps.length - 1); i++) {
      const s = steps[i];
      let row = c.get(s.ctx);
      if (!row) {
        row = new Map();
        c.set(s.ctx, row);
      }
      const v = (row.get(s.next) ?? 0) + 1;
      row.set(s.next, v);
      if (v > mx) mx = v;
    }
    // keep rows in first-appearance order (rowOrder), filtered to those alive now.
    const ordered = rowOrder.filter((ctx) => c.has(ctx));
    return { counts: c, liveRows: ordered, maxCount: mx };
  }, [stepIdx, steps, rowOrder]);

  const counted = started ? Math.min(stepIdx + 1, steps.length) : 0;

  /* ── controls ── */
  const stepOnce = useCallback(() => {
    setStepIdx((i) => {
      const next = Math.min(i + 1, steps.length - 1);
      if (next >= steps.length - 1) setDidManualPass(true);
      return next;
    });
  }, [steps.length]);

  const toggleAuto = useCallback(() => setPlaying((p) => !p), []);

  const reset = useCallback(() => {
    setPlaying(false);
    setStepIdx(-1);
  }, []);

  // "Completar" — fill every pair at once (the shortcut the reader wants after a few manual steps).
  const completeAll = useCallback(() => {
    setPlaying(false);
    setDidManualPass(true);
    setStepIdx(steps.length - 1);
  }, [steps.length]);

  /* auto-play timer — fires setState only from the timeout callback, clears its own `playing`
       when it reaches the final pair, and is cleaned up on unmount / dependency change. */
  useEffect(() => {
    if (!playing || done) return;
    const timer = setTimeout(
      () => {
        setStepIdx((i) => {
          const next = Math.min(i + 1, steps.length - 1);
          if (next >= steps.length - 1) setPlaying(false);
          return next;
        });
      },
      reduce ? 0 : AUTO_MS,
    );
    return () => clearTimeout(timer);
  }, [playing, done, stepIdx, steps.length, reduce]);

  const nextPos = active ? active.pos + K : -1; // index of the NEXT char (the table column / trigram target)

  return (
    <div className="nw-cp" style={{ fontFamily: SERIF }}>
      {/* ── THE SOURCE PHRASE — sunk panel, current pair double-highlighted, next char outlined ── */}
      <div className="nw-cp__phrase" role="img" aria-label={`Frase de juguete: ${TEXT}`}>
        {Array.from(TEXT).map((ch, i) => {
          const isOrigin = active != null && active.pos === i; // hot1
          const isFollower = active != null && active.pos + 1 === i; // hot2
          const isNext = active != null && nextPos === i; // the column target
          const isPast = started && active != null && i < active.pos;
          const isSpace = ch === " ";
          const cls =
            "nw-cp__ch" +
            (isOrigin ? " is-o" : "") +
            (isFollower ? " is-f" : "") +
            (isNext ? " is-n" : "") +
            (isPast ? " is-p" : "");
          return (
            <span key={i} className={cls}>
              {isSpace ? (isOrigin || isFollower || isNext ? "␣" : " ") : ch}
            </span>
          );
        })}
      </div>

      {/* ── WHAT JUST HAPPENED — the current pair AS the table-reading gesture: fila → columna → +1 ── */}
      <div className="nw-cp__line" aria-live="polite">
        <AnimatePresence mode="wait">
          {active && (
            <motion.span
              key={stepIdx}
              className="nw-cp__pair"
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: STD }}
            >
              <span className="nw-cp__grp">
                <span className="nw-cp__ctx">{labelCtx(active.ctx)}</span>
                <i className="nw-cp__sub">fila</i>
              </span>
              <span className="nw-cp__arr">→</span>
              <span className="nw-cp__grp">
                <span className="nw-cp__nxt">{displayChar(active.next)}</span>
                <i className="nw-cp__sub">columna</i>
              </span>
              <span className="nw-cp__plus">+1</span>
            </motion.span>
          )}
        </AnimatePresence>
        {!active && (
          <span className="nw-cp__hint">
            la misma cuenta que el bigrama · solo cambia la clave de la fila
          </span>
        )}
      </div>

      {/* the one functional caption: the row key grew from 1 letter to 2 */}
      <CaptionLine gap={0} className="nw-cp__cap">
        clave de la fila: <b>2 letras</b> · columna: la letra siguiente
      </CaptionLine>

      {/* ── controls — kept ABOVE the table so they never move while rows are born below.
                Manual "Siguiente" first; slow auto-play offered only after one full pass. ── */}
      <div className="nw-cp__controls">
        {!done ? (
          <>
            <PlayButton onClick={stepOnce}>siguiente →</PlayButton>
            <GhostButton onClick={completeAll}>completar</GhostButton>
          </>
        ) : (
          <span className="nw-cp__final">
            {steps.length} parejas contadas · la tabla es el trigrama
          </span>
        )}
        {started && !done && didManualPass && (
          <GhostButton onClick={toggleAuto}>{playing ? "pausa" : "auto"}</GhostButton>
        )}
        {started && <GhostButton onClick={reset}>reiniciar</GhostButton>}
      </div>

      {/* ── running tally — reserves its row so nothing jumps as the first pair lands ── */}
      <div className="nw-cp__tally" aria-hidden={!started}>
        {started && (
          <>
            <span className="nw-cp__rows">{liveRows.length}</span>
            <span className="nw-cp__rowslbl">{liveRows.length === 1 ? "fila" : "filas"}</span>
            <span className="nw-cp__sep" aria-hidden>
              ·
            </span>
            <span className="nw-cp__count">{counted}</span>
            <span className="nw-cp__countlbl">/ {steps.length} parejas</span>
          </>
        )}
      </div>

      {/* ── THE GROWING TABLE — the hero. A row is BORN (fades in) the moment its pair is first counted,
                never pre-drawn — so the reader literally watches the trigram table grow, one pair at a time.
                The controls sit ABOVE, so nothing under the cursor moves; 15 compact rows fit with no scrollbar.
                It ends up visibly TALLER than the bigram's 10-row matrix — which is exactly the point. ── */}
      <div className="nw-cp__tablewrap">
        {!started ? (
          <p className="nw-cp__empty">
            con <b>siguiente</b>, la tabla nace aquí — pareja a pareja
          </p>
        ) : (
          <table className="nw-cp__table">
            <thead>
              <tr>
                <th className="nw-cp__corner" aria-hidden>
                  pareja<span>↓</span>
                </th>
                {columns.map((col) => {
                  const on =
                    (active != null && active.next === col) || (probe != null && probe.col === col);
                  return (
                    <th key={col} className={`nw-cp__colh${on ? " is-on" : ""}`}>
                      {displayChar(col)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {liveRows.map((ctx) => {
                const rowOn = active != null && active.ctx === ctx;
                const rowProbed = probe != null && probe.ctx === ctx;
                const row = counts.get(ctx);
                return (
                  <motion.tr
                    key={ctx}
                    className="nw-cp__tr"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.26, ease: STD }}
                  >
                    <th className={`nw-cp__rowh${rowOn || rowProbed ? " is-on" : ""}`}>
                      <span className="nw-cp__key">{labelCtx(ctx)}</span>
                      <span className="nw-cp__rowarr">→</span>
                    </th>
                    {columns.map((col) => {
                      const v = row?.get(col) ?? 0;
                      const isCell = active != null && active.ctx === ctx && active.next === col;
                      // The reading gesture made visible: the landing pair's row AND
                      // column tint as an L-path the eye follows to the cell.
                      const inPath =
                        (active != null && (active.ctx === ctx || active.next === col)) ||
                        (probe != null && (probe.ctx === ctx || probe.col === col));
                      return (
                        <Cell
                          key={col}
                          value={v}
                          maxCount={maxCount}
                          isActive={isCell}
                          inPath={inPath && !isCell}
                          probed={rowProbed && probe.col === col}
                          onProbe={(on) => setProbe(on ? { ctx, col } : null)}
                          reduce={!!reduce}
                        />
                      );
                    })}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── HOW TO READ — fixed line: names the cell under the finger, or the rule when idle ── */}
      {started && (
        <p className="nw-cp__read" aria-live="polite">
          {probe ? (
            <>
              fila «<b>{labelCtx(probe.ctx)}</b>» · columna «<b>{displayChar(probe.col)}</b>» →{" "}
              {(counts.get(probe.ctx)?.get(probe.col) ?? 0).toLocaleString("es-ES")}{" "}
              {(counts.get(probe.ctx)?.get(probe.col) ?? 0) === 1 ? "vez" : "veces"}
            </>
          ) : (
            <>cada celda: cuántas veces esa pareja precedió a esa letra</>
          )}
        </p>
      )}

      <style>{`
                .nw-cp {
                    width: 100%; max-width: 640px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: center; gap: 16px;
                    text-align: center;
                }

                /* ── source phrase — sunk panel, double-highlighted pair ── */
                .nw-cp__phrase {
                    font-family: ${MONO}; font-size: clamp(20px, 3vw, 28px);
                    line-height: 1.7; letter-spacing: .005em;
                    padding: 20px 22px; border-radius: var(--ngram-r-lg);
                    background: var(--ngram-bg-2);
                    box-shadow: inset 0 2px 8px color-mix(in oklab, var(--ngram-bg) 70%, transparent);
                    user-select: none; max-width: 100%;
                }
                .nw-cp__ch {
                    display: inline-block; color: var(--ngram-body);
                    padding: 2px 3px; border-radius: 6px;
                    transition: color .26s ease, background .26s ease, box-shadow .26s ease;
                }
                .nw-cp__phrase .is-p { color: var(--ngram-dim); }
                .nw-cp__ch.is-o {
                    color: var(--ngram-on-accent); background: var(--ngram-accent);
                    font-weight: 700;
                }
                .nw-cp__ch.is-f {
                    color: var(--ngram-accent-ink); background: var(--ngram-accent-soft);
                    box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ngram-accent) 38%, transparent);
                    font-weight: 700;
                }
                .nw-cp__ch.is-n {
                    color: var(--ngram-accent-ink);
                    box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent);
                    font-weight: 700;
                }

                /* ── what-just-happened line ── */
                .nw-cp__line { min-height: 30px; display: flex; align-items: center; justify-content: center; }
                .nw-cp__pair {
                    display: inline-flex; align-items: center; gap: 9px;
                    font-family: ${MONO}; font-size: 17px; font-weight: 700;
                }
                .nw-cp__ctx {
                    color: var(--ngram-on-accent); background: var(--ngram-accent);
                    border-radius: 6px; padding: 2px 9px; letter-spacing: .04em;
                }
                .nw-cp__arr { color: var(--ngram-dim); font-weight: 400; font-size: 14px; }
                /* chip groups: the pair chip + its role under it (fila / columna) — the reading lesson */
                .nw-cp__grp { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }
                .nw-cp__sub {
                    font-style: normal; font-size: 8.5px; font-weight: 600; letter-spacing: .14em;
                    text-transform: uppercase; color: var(--ngram-dim); line-height: 1;
                }
                .nw-cp__nxt {
                    color: var(--ngram-accent-ink); background: var(--ngram-accent-soft);
                    border-radius: 6px; padding: 2px 9px;
                    box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ngram-accent) 38%, transparent);
                }
                .nw-cp__plus {
                    color: var(--ngram-accent-ink); font-size: 13px; font-weight: 700;
                    font-variant-numeric: tabular-nums;
                    background: var(--ngram-accent-soft); border-radius: var(--ngram-r-pill);
                    padding: 2px 9px;
                }
                .nw-cp__hint { font-family: ${MONO}; font-size: 12px; color: var(--ngram-dim); }

                .nw-cp__cap { color: var(--ngram-accent-2) !important; }
                .nw-cp__cap b { color: var(--ngram-accent-ink); font-weight: 800; }

                /* ── the growing table — the hero. Raised card, same surface language as RowSummer. ── */
                .nw-cp__tablewrap {
                    width: 100%; padding: 16px 12px; overflow: visible;
                    display: flex; justify-content: center;
                    border-radius: var(--ngram-r-md);
                    background: var(--ngram-surface);
                    border: 1px solid var(--ngram-rule-2);
                    box-shadow: 0 1px 3px -1px color-mix(in oklab, var(--ngram-bg-2) 80%, transparent),
                                0 8px 22px -12px color-mix(in oklab, var(--ngram-bg-2) 70%, transparent);
                }
                .nw-cp__read {
                    margin: 0; min-height: 15px; font-family: ${MONO}; font-size: 11px;
                    letter-spacing: .03em; color: var(--ngram-muted);
                }
                .nw-cp__read b { color: var(--ngram-accent-ink); font-weight: 800; }
                .nw-cp__empty {
                    margin: 0; padding: 28px 0; font-family: ${SERIF};
                    font-size: 15px; color: var(--ngram-muted);
                }
                .nw-cp__empty b { color: var(--ngram-accent-ink); font-weight: 700; }
                .nw-cp__table {
                    margin: 0 auto; border-collapse: separate; border-spacing: 3px;
                    font-family: ${MONO}; font-variant-numeric: tabular-nums lining-nums;
                }
                .nw-cp__corner {
                    height: 30px; font-size: 9px; font-weight: 600; letter-spacing: .08em;
                    text-transform: uppercase; color: var(--ngram-dim);
                    text-align: right; padding-right: 4px; white-space: nowrap;
                }
                .nw-cp__corner span { margin-left: 3px; opacity: .6; }
                .nw-cp__colh {
                    width: 26px; height: 20px; text-align: center;
                    font-size: 12px; font-weight: 500; color: var(--ngram-muted);
                    transition: color .2s ease, font-weight .2s ease;
                }
                .nw-cp__colh.is-on { color: var(--ngram-accent-ink); font-weight: 800; }
                .nw-cp__rowh {
                    display: flex; align-items: center; justify-content: flex-end; gap: 4px;
                    height: 18px; padding-right: 2px; white-space: nowrap;
                    transition: opacity .2s ease;
                }
                /* uniform fixed-size chip (every pair label is the SAME box regardless of glyphs), soft by
                   default so the column reads calm — only the row being counted goes bright. */
                .nw-cp__key {
                    display: inline-grid; place-items: center;
                    width: 30px; height: 17px; box-sizing: border-box;
                    font-size: 11px; font-weight: 800; letter-spacing: .02em;
                    color: var(--ngram-accent-ink); background: var(--ngram-accent-soft);
                    border-radius: 4px;
                    transition: background .2s ease, color .2s ease;
                }
                .nw-cp__rowh.is-on .nw-cp__key { background: var(--ngram-accent-bright); color: var(--ngram-on-accent); }
                .nw-cp__rowarr { color: var(--ngram-dim); font-size: 12px; }
                .nw-cp__rowh.is-on .nw-cp__rowarr { color: var(--ngram-accent-ink); }

                /* ── tally ── */
                .nw-cp__tally {
                    display: flex; align-items: baseline; justify-content: center; gap: 7px;
                    min-height: 28px;
                    font-family: ${MONO}; font-variant-numeric: tabular-nums;
                }
                .nw-cp__rows { font-size: 26px; font-weight: 800; color: var(--ngram-accent-bright); line-height: 1; }
                .nw-cp__rowslbl { font-size: 12px; color: var(--ngram-muted); }
                .nw-cp__sep { color: var(--ngram-dim); margin: 0 2px; }
                .nw-cp__count { font-size: 16px; font-weight: 700; color: var(--ngram-accent-ink); }
                .nw-cp__countlbl { font-size: 11px; color: var(--ngram-dim); }

                /* ── controls ── */
                .nw-cp__controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }
                .nw-cp__final {
                    font-family: ${SERIF}; font-size: 15px; color: var(--ngram-accent-ink);
                    font-style: italic;
                }

                @media (max-width: 520px) {
                    .nw-cp__phrase { font-size: 18px; padding: 16px 14px; }
                    .nw-cp__corner { font-size: 8px; }
                }
            `}</style>
    </div>
  );
});

/* ── one table cell — honest heat by fill; pulse on landing; L-path ring while its row/col is read;
      hoverable so the reader can READ any cell by hand (fila · columna → n veces). ── */
const Cell = memo(function Cell({
  value,
  maxCount,
  isActive,
  inPath,
  probed,
  onProbe,
  reduce,
}: {
  value: number;
  maxCount: number;
  isActive: boolean;
  inPath: boolean;
  probed: boolean;
  onProbe: (on: boolean) => void;
  reduce: boolean;
}) {
  const filled = value > 0;
  const intensity = maxCount > 0 ? value / maxCount : 0;

  let background: string;
  let color: string;
  let boxShadow = "none";

  if (isActive) {
    background = "var(--ngram-accent)";
    color = "var(--ngram-on-accent)";
    boxShadow = "0 4px 14px -6px color-mix(in oklab, var(--ngram-accent) 70%, transparent)";
  } else if (filled) {
    background = heat(intensity, 16); // honest tint, never neon
    color = intensity > 0.6 ? "var(--ngram-on-accent)" : "var(--ngram-accent-ink)";
  } else {
    background = "color-mix(in oklab, var(--ngram-ink) 5%, transparent)";
    color = "var(--ngram-dim)";
  }
  if (probed) {
    boxShadow = "inset 0 0 0 2px var(--ngram-accent-ink)";
  } else if (inPath) {
    boxShadow = "inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 30%, transparent)";
  }

  return (
    <td style={{ padding: 0 }}>
      <motion.div
        animate={reduce ? undefined : isActive ? { scale: [1, 1.16, 1] } : { scale: 1 }}
        transition={{ duration: 0.34, ease: STD }}
        onMouseEnter={() => onProbe(true)}
        onMouseLeave={() => onProbe(false)}
        style={{
          width: 26,
          height: 21,
          display: "grid",
          placeItems: "center",
          borderRadius: "var(--ngram-r-sm)",
          fontFamily: MONO,
          fontSize: 11.5,
          fontWeight: isActive || (filled && intensity > 0.6) ? 800 : 600,
          fontVariantNumeric: "tabular-nums",
          background,
          color,
          boxShadow,
          cursor: "default",
          transition: reduce ? "none" : "background .3s ease, color .3s ease, box-shadow .2s ease",
        }}
      >
        {filled ? value : <span style={{ opacity: 0.4 }}>·</span>}
      </motion.div>
    </td>
  );
});

export default CountingPairs;
