"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  CaptionLine,
  CountUpNumber,
  displayChar,
  heat,
  MONO,
  PlayButton,
  SERIF,
  SPRING_SNAP,
  STD,
} from "@/features/lab/components/ngram/kit";
import { getCounts } from "@/features/lab/data/ngramData";

/**
 * §2.3 · GrowingTable — "Otra letra más". The reader has just built the N=2 table (RowSummer's 729-cell map).
 * ONE idea, SEEN: one more letter of memory = EVERY row splits in 27 — the same map, 27× finer: 19.683.
 *
 * THE IMAGE. The right panel IS the table from RowSummer (same 27×27 map, same data, same heat). Pressing
 * «cada fila ×27» springs the panel taller while its grain multiplies: each CELL becomes a whole ROW of 27
 * (729 row-stripes × 27 = all 19.683 contexts — nothing is cut, it is ALL there, just 27× finer). The «th»
 * marker makes the split concrete: the cell you knew shrinks into a hairline row, and a LENS shows, at
 * readable size, the 27 real children that now live where that one cell was (tha, the, thi…). The left
 * panel keeps it concrete: the real top rows of the CURRENT table, named, with their true counts.
 *
 * Real data only (getCounts(2)/getCounts(3) over Shakespeare). Tokens-only, memo, reduced-motion safe.
 */

const LETTERS = "abcdefghijklmnopqrstuvwxyz ".split(""); // a..z then ␣ — same axis order as RowSummer's map
const VOCAB = LETTERS.length; // 27
const ANCHOR: [string, string] = ["t", "h"]; // the cell the reader knows — «th»

const SAMPLE_ROWS = 14; // named real rows in the left panel

/** totals for every context of length k, keyed by context (missing = 0). One pass over the sparse counts. */
function totalsOf(k: number): Map<string, number> {
  const out = new Map<string, number>();
  for (const [ctx, row] of getCounts(k)) {
    let t = 0;
    for (const v of row.values()) t += v;
    out.set(ctx, t);
  }
  return out;
}

/** One horizontal heat-strip: 27 hard-edged bands colored by `values` (normalized to the strip's own max). */
function stripGradient(values: number[], floorPct: number): string {
  let mx = 1;
  for (const v of values) if (v > mx) mx = v;
  const stops: string[] = [];
  for (let i = 0; i < values.length; i++) {
    const color = values[i] <= 0 ? "var(--ngram-bg-2)" : heat(values[i] / mx, floorPct);
    const from = ((i / values.length) * 100).toFixed(2);
    const to = (((i + 1) / values.length) * 100).toFixed(2);
    stops.push(`${color} ${from}%`, `${color} ${to}%`);
  }
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

interface Level {
  n: number; // letters of memory (= context length)
  rows: number; // 27^n — the true row count (729 / 19.683)
  stripes: string[]; // the map: one gradient per visual stripe (27 at N=2 · 729 at N=3)
  panelH: number; // map panel height (px) — the frame itself also grows
  samples: { key: string; total: number; gradient: string }[]; // left panel: top real rows, named
  rest: number; // rows beyond the named sample (true remainder)
}

function buildLevels(): [Level, Level] {
  const t2 = totalsOf(2);
  const t3 = totalsOf(3);

  // N=2 map: 27 stripes (first letter) × 27 bands (second letter) = the 729-cell map from RowSummer.
  const stripes2 = LETTERS.map((l1) =>
    stripGradient(
      LETTERS.map((l2) => t2.get(l1 + l2) ?? 0),
      14,
    ),
  );
  // N=3 map: 729 stripes (first two letters) × 27 bands (third) = ALL 19.683 contexts, none cut.
  const stripes3: string[] = [];
  for (const l1 of LETTERS) {
    for (const l2 of LETTERS) {
      stripes3.push(
        stripGradient(
          LETTERS.map((l3) => t3.get(l1 + l2 + l3) ?? 0),
          14,
        ),
      );
    }
  }

  const sample = (k: number, totals: Map<string, number>) => {
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, SAMPLE_ROWS);
    return top.map(([key, total]) => {
      const row = getCounts(k).get(key);
      const values = LETTERS.map((c) => row?.get(c) ?? 0);
      return { key, total, gradient: stripGradient(values, 18) };
    });
  };

  return [
    {
      n: 2,
      rows: VOCAB ** 2,
      stripes: stripes2,
      panelH: 330,
      samples: sample(2, t2),
      rest: VOCAB ** 2 - SAMPLE_ROWS,
    },
    {
      n: 3,
      rows: VOCAB ** 3,
      stripes: stripes3,
      panelH: 470,
      samples: sample(3, t3),
      rest: VOCAB ** 3 - SAMPLE_ROWS,
    },
  ];
}

/** Render a context with the space symbol shown (e.g. "th", "t␣h"). */
function labelKey(key: string): string {
  return key.split("").map(displayChar).join("");
}

export const GrowingTable = memo(function GrowingTable({ accent }: { accent?: "ngram" } = {}) {
  void accent;
  const reduce = useReducedMotion();

  const levels = useMemo(() => buildLevels(), []);
  const [li, setLi] = useState(0);
  const L = levels[li];
  const grown = li === 1;

  // «th» marker geometry (percentages of the map box).
  const r1 = LETTERS.indexOf(ANCHOR[0]); // 19
  const r2 = LETTERS.indexOf(ANCHOR[1]); // 7
  const marker = grown
    ? {
        top: ((r1 * VOCAB + r2) / (VOCAB * VOCAB)) * 100,
        height: 100 / (VOCAB * VOCAB),
        left: 0,
        width: 100,
      }
    : {
        top: (r1 / VOCAB) * 100,
        height: 100 / VOCAB,
        left: (r2 / VOCAB) * 100,
        width: 100 / VOCAB,
      };

  // The lens: the 27 real children that now live where the «th» cell was (totals of th+letter).
  const lens = useMemo(() => {
    const t3 = totalsOf(3);
    const values = LETTERS.map((l3) => t3.get(ANCHOR.join("") + l3) ?? 0);
    let w = 0;
    for (let i = 1; i < values.length; i++) if (values[i] > values[w]) w = i;
    return { values, max: Math.max(1, ...values), winner: w };
  }, []);

  const grow = useCallback(() => setLi(1), []);

  return (
    <div className="nw-gt" style={{ fontFamily: SERIF }}>
      {/* HERO — the true row count, named by its N. */}
      <div className="nw-gt__hero">
        <CountUpNumber
          key={L.rows}
          value={L.rows}
          durationMs={reduce ? 0 : 900}
          className="nw-gt__count"
          format={(v) => Math.round(v).toLocaleString("es-ES")}
        />
        <span className="nw-gt__herolbl">filas en la tabla · {L.n} letras de memoria</span>
      </div>

      {/* N pills — both sizes one tap apart, so the jump stays comparable/explorable. */}
      <div className="nw-gt__sel" role="group" aria-label="elegir N">
        {levels.map((lv, i) => (
          <button
            key={lv.n}
            type="button"
            className={`nw-gt__seln${i === li ? " is-on" : ""}`}
            onClick={() => setLi(i)}
            aria-pressed={i === li}
          >
            N={lv.n}
          </button>
        ))}
      </div>

      {/* STAGE — RowSummer's composition: named real rows (left) + the table itself (right). */}
      <div className="nw-gt__stage">
        {/* LEFT — the top rows of the CURRENT table, named, with true counts. */}
        <div className="nw-gt__panel">
          <div className="nw-gt__panelhd">
            <span className="nw-gt__famchip">{L.n}</span>
            <span className="nw-gt__panellbl">las filas más llenas · clave de {L.n} letras</span>
          </div>
          <div className="nw-gt__rows">
            {L.samples.map((s) => (
              <div key={s.key} className="nw-gt__row">
                <span className="nw-gt__key">{labelKey(s.key)}</span>
                <span className="nw-gt__strip" style={{ background: s.gradient }} />
                <span className="nw-gt__rtot">{s.total.toLocaleString("es-ES")}</span>
              </div>
            ))}
          </div>
          <div className="nw-gt__spill">+ {L.rest.toLocaleString("es-ES")} filas más</div>
        </div>

        {/* RIGHT — THE MAP: the same table you built, its grain ×27 when N grows. Nothing cut. */}
        <div className="nw-gt__mapwrap">
          <div className="nw-gt__maplbl">
            <span className="nw-gt__mapnum">{L.rows.toLocaleString("es-ES")}</span>
            <span className="nw-gt__mapcap">
              {grown ? "filas · el mismo marco, 27× más fino" : "filas · tu tabla de antes"}
            </span>
          </div>
          <motion.div
            className="nw-gt__map"
            animate={{ height: L.panelH }}
            initial={false}
            transition={reduce ? { duration: 0 } : SPRING_SNAP}
          >
            <div className="nw-gt__mapinner">
              <div className="nw-gt__stripes" data-grown={grown ? "1" : "0"}>
                {L.stripes.map((g, i) => (
                  <span key={i} className="nw-gt__stripe" style={{ background: g }} />
                ))}
              </div>
              {/* the «th» marker: the cell the reader knows → the hairline row it became */}
              <motion.span
                className="nw-gt__mark"
                initial={false}
                animate={{
                  top: `${marker.top}%`,
                  left: `${marker.left}%`,
                  width: `${marker.width}%`,
                  height: `${Math.max(marker.height, 0.32)}%`,
                }}
                transition={reduce ? { duration: 0 } : SPRING_SNAP}
                aria-hidden
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* the reading of the marker, always present so the eye has a name for it */}
      <p className="nw-gt__markread">
        {grown ? (
          <>
            la celda «th» ahora es <b>una fila entera de 27</b> — igual que todas las demás
          </>
        ) : (
          <>la celda «th» — una de las 729 filas de tu tabla</>
        )}
      </p>

      {/* THE LENS — only after growing: the 27 real children living where the «th» cell was. */}
      <AnimatePresence>
        {grown && (
          <motion.div
            key="lens"
            className="nw-gt__lens"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: STD }}
          >
            <span className="nw-gt__lenslbl">dentro de aquella celda, ahora:</span>
            <div className="nw-gt__lensrow" aria-hidden>
              {LETTERS.map((l3, i) => (
                <span key={l3} className="nw-gt__lenscell" data-win={i === lens.winner ? "1" : "0"}>
                  <i
                    style={{
                      background:
                        lens.values[i] > 0
                          ? heat(lens.values[i] / lens.max, 16)
                          : "var(--ngram-bg-2)",
                    }}
                  />
                  <b>th{displayChar(l3)}</b>
                </span>
              ))}
            </div>
            <span className="nw-gt__lenssub">
              27 filas nuevas donde había una · la más llena: «th{displayChar(LETTERS[lens.winner])}
              » · {lens.values[lens.winner].toLocaleString("es-ES")} veces
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <CaptionLine gap={0} className="nw-gt__caption">
        {grown ? (
          <>27 × 729 = 19.683 · todas las filas están ahí — solo que ya casi no se ven</>
        ) : (
          <>una letra más de memoria = cada fila se parte en {VOCAB}</>
        )}
      </CaptionLine>

      {/* the single discovery action */}
      <div className="nw-gt__controls">
        <PlayButton onClick={grown ? undefined : grow} disabled={grown}>
          {grown ? (
            <>cada fila ya partida ×{VOCAB}</>
          ) : (
            <>otra letra de memoria · cada fila ×{VOCAB}</>
          )}
        </PlayButton>
      </div>

      <style>{`
                .nw-gt {
                    width: 100%; max-width: 720px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: center; gap: 13px;
                    text-align: center;
                }

                /* HERO */
                .nw-gt__hero { display: flex; flex-direction: column; align-items: center; gap: 3px; }
                .nw-gt__count {
                    font-size: clamp(40px, 8vw, 58px); font-weight: 700; line-height: 1;
                    color: var(--ngram-accent-bright); letter-spacing: -0.01em; font-variant-numeric: tabular-nums;
                }
                .nw-gt__herolbl { font-family: ${MONO}; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--ngram-accent-2); }

                /* N pills */
                .nw-gt__sel {
                    display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--ngram-r-pill);
                    background: color-mix(in oklab, var(--ngram-bg-2) 70%, var(--ngram-bg));
                    box-shadow: inset 0 0 0 1px var(--ngram-rule);
                }
                .nw-gt__seln {
                    font-family: ${MONO}; font-variant-numeric: tabular-nums; font-weight: 700;
                    font-size: 12.5px; letter-spacing: .06em; padding: 6px 16px; border: 0;
                    border-radius: var(--ngram-r-pill); cursor: pointer; color: var(--ngram-muted); background: transparent;
                    transition: color .2s ease, background .2s ease, box-shadow .2s ease;
                }
                .nw-gt__seln:hover { color: var(--ngram-accent-ink); }
                .nw-gt__seln.is-on { color: var(--ngram-on-accent); background: var(--ngram-accent); box-shadow: 0 4px 16px -6px var(--ngram-accent); }

                /* STAGE — left sample rows + right map, RowSummer's surface language */
                .nw-gt__stage { display: grid; grid-template-columns: 1fr 250px; gap: 18px; align-items: start; width: 100%; }
                .nw-gt__panel {
                    display: flex; flex-direction: column; gap: 7px; padding: 11px 14px;
                    border-radius: var(--ngram-r-md); text-align: left;
                    background: var(--ngram-surface); border: 1px solid var(--ngram-rule-2);
                    box-shadow: 0 1px 3px -1px color-mix(in oklab, var(--ngram-bg-2) 80%, transparent),
                                0 8px 22px -12px color-mix(in oklab, var(--ngram-bg-2) 70%, transparent);
                }
                .nw-gt__panelhd { display: flex; align-items: center; gap: 9px; }
                .nw-gt__famchip {
                    font-family: ${MONO}; font-weight: 800; font-size: 14px; line-height: 1;
                    color: var(--ngram-on-accent); background: var(--ngram-accent-bright);
                    border-radius: 6px; padding: 4px 9px; min-width: 22px; text-align: center;
                }
                .nw-gt__panellbl { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .04em; color: var(--ngram-muted); }
                .nw-gt__rows { display: flex; flex-direction: column; gap: 3px; }
                .nw-gt__row { display: grid; grid-template-columns: 42px 1fr 50px; align-items: center; gap: 9px; height: 13px; }
                .nw-gt__key { font-family: ${MONO}; font-size: 11px; letter-spacing: .02em; color: var(--ngram-accent-ink); font-weight: 700; text-align: left; white-space: nowrap; line-height: 1; }
                .nw-gt__strip { display: block; height: 9px; border-radius: 2px; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 22%, transparent); }
                .nw-gt__rtot { font-family: ${MONO}; font-size: 10px; font-variant-numeric: tabular-nums; color: var(--ngram-dim); text-align: right; line-height: 1; }
                .nw-gt__spill { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .04em; color: var(--ngram-accent-2); padding-top: 3px; }

                /* MAP — the table itself; its grain multiplies, its frame springs taller. */
                .nw-gt__mapwrap { display: flex; flex-direction: column; gap: 8px; }
                .nw-gt__maplbl { display: flex; flex-direction: column; gap: 2px; text-align: left; }
                .nw-gt__mapnum { font-family: ${MONO}; font-variant-numeric: tabular-nums; font-weight: 800; font-size: 20px; line-height: 1; color: var(--ngram-accent-bright); }
                .nw-gt__mapcap { font-family: ${MONO}; font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--ngram-accent-2); }
                .nw-gt__map {
                    position: relative; width: 100%; overflow: hidden;
                    border-radius: var(--ngram-r-md);
                    background: var(--ngram-surface); border: 1px solid var(--ngram-rule-2);
                    box-shadow: 0 1px 3px -1px color-mix(in oklab, var(--ngram-bg-2) 80%, transparent),
                                0 8px 22px -12px color-mix(in oklab, var(--ngram-bg-2) 70%, transparent);
                    padding: 6px;
                }
                .nw-gt__mapinner { position: relative; height: 100%; }
                .nw-gt__stripes { display: flex; flex-direction: column; height: 100%; gap: 1px; }
                .nw-gt__stripes[data-grown="1"] { gap: 0; }
                .nw-gt__stripe { flex: 1 1 auto; min-height: 0; display: block; }
                .nw-gt__mark {
                    position: absolute; box-sizing: border-box; pointer-events: none;
                    box-shadow: 0 0 0 2px var(--ngram-accent-bright), 0 0 12px -2px var(--ngram-accent-bright);
                    border-radius: 1px;
                }
                .nw-gt__markread { margin: 0; font-family: ${MONO}; font-size: 11px; letter-spacing: .03em; color: var(--ngram-accent-2); min-height: 14px; }
                .nw-gt__markread b { color: var(--ngram-accent-ink); }

                /* LENS — the 27 children of the old «th» cell, readable. */
                .nw-gt__lens {
                    display: flex; flex-direction: column; gap: 7px; width: 100%; max-width: 620px;
                    padding: 12px 14px; border-radius: var(--ngram-r-md);
                    background: var(--ngram-surface); border: 1px solid var(--ngram-rule-2);
                }
                .nw-gt__lenslbl { font-family: ${MONO}; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--ngram-accent-2); }
                .nw-gt__lensrow { display: grid; grid-template-columns: repeat(27, 1fr); gap: 2px; }
                .nw-gt__lenscell { display: flex; flex-direction: column; gap: 2px; align-items: stretch; min-width: 0; }
                .nw-gt__lenscell i { display: block; height: 14px; border-radius: 2px; }
                .nw-gt__lenscell b { font-family: ${MONO}; font-weight: 400; font-size: 7px; color: var(--ngram-dim); transform: rotate(0); white-space: nowrap; overflow: hidden; }
                .nw-gt__lenscell[data-win="1"] i { box-shadow: 0 0 0 1.5px var(--ngram-accent-bright); }
                .nw-gt__lenscell[data-win="1"] b { color: var(--ngram-accent-ink); font-weight: 700; }
                .nw-gt__lenssub { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .02em; color: var(--ngram-muted); }

                .nw-gt__caption { color: var(--ngram-accent-2) !important; }
                .nw-gt__caption b { color: var(--ngram-accent-ink); font-weight: 800; }
                .nw-gt__controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }
                .nw-gt__controls button[disabled] { opacity: 0.72 !important; cursor: default !important; }

                @media (max-width: 620px) {
                    .nw-gt__stage { grid-template-columns: 1fr; }
                    .nw-gt__lenscell b { font-size: 5.5px; }
                }
            `}</style>
    </div>
  );
});

export default GrowingTable;
