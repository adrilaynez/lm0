"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import {
  CaptionLine,
  heat,
  MONO,
  SERIF,
  SPRING_SNAP,
  STD,
} from "@/features/lab/components/ngram/kit";
import { contextRow, displayChar, getCounts, NGRAM_ALPHABET } from "@/features/lab/data/ngramData";

/**
 * §4.1 · ExplosionZoom — "la tabla no tiene fondo".
 *
 * ONE idea: cada letra extra de memoria multiplica la tabla ×27 — y eso deja de caber en ningún sitio.
 *
 * LA ESCALERA (pocos saltos, cada uno con una IMAGEN distinta — nunca dos peldaños iguales):
 *   c=1 (bigrama)  → la matriz 27×27 real, etiquetada — la que el lector ya construyó. El marco la abraza.
 *   c=2 (trigrama) → el mapa real de 729 filas (27 franjas) — la imagen de RowSummer. La referencia «un
 *                    bigrama entero» se vuelve UNA BANDA (27 filas = 1 franja = 3,7% del alto).
 *   c=3 (4-grama)  → el mapa real de 19.683 filas (729 franjas, grano 27× más fino). La banda ya es un hilo.
 *   c=4 (5-grama)  → 531.441: el grano se pierde — una malla finísima; el bigrama ya es un punto con halo.
 *   c=9 / c=19     → 10-grama / 20-grama: la malla se funde en sólido; la CINTA DE CEROS (el % literal que
 *                    ocupa un bigrama, con todos sus ceros impresos) crece un tramo brutal por salto.
 *   c=56 (57-grama)→ más filas que átomos en el universo observable. La escalera termina ahí a propósito.
 *
 * Honesto siempre: las cifras son 27^c exactas (BigInt); los mapas de c=2/c=3 son datos reales; la banda y
 * la cinta de ceros derivan de 27^(1−c) exacto. Tokens-only, memo, reduced-motion safe.
 */

const ALPHA = NGRAM_ALPHABET; // [space, a–z]
const VOCAB = ALPHA.length; // 27
const VOCAB_BIG = BigInt(VOCAB);
const SIDE = VOCAB;

/* La escalera: pocos saltos, órdenes con nombre (bigrama→trigrama→4→5→10→20→57-grama). El último cruza
   los ~10^80 átomos del universo observable (56·log10 27 ≈ 80,1). */
const LADDER = [1, 2, 3, 4, 9, 19, 56] as const;
const SCI_DIGITS = 12;
const ATOMS_EXP = 80;

const MAP_LETTERS = "abcdefghijklmnopqrstuvwxyz ".split(""); // a..z, ␣ último — el orden visual del capítulo

/** Franjas-gradiente reales para el mapa del nivel k (27 franjas si k=2 · 729 si k=3). */
function buildStripes(k: 2 | 3): string[] {
  const totals = new Map<string, number>();
  for (const [ctx, row] of getCounts(k)) {
    let t = 0;
    for (const v of row.values()) t += v;
    totals.set(ctx, t);
  }
  const prefixes: string[] = [];
  if (k === 2) {
    for (const l1 of MAP_LETTERS) prefixes.push(l1);
  } else {
    for (const l1 of MAP_LETTERS) for (const l2 of MAP_LETTERS) prefixes.push(l1 + l2);
  }
  return prefixes.map((p) => {
    const values = MAP_LETTERS.map((last) => totals.get(p + last) ?? 0);
    let mx = 1;
    for (const v of values) if (v > mx) mx = v;
    const stops: string[] = [];
    for (let i = 0; i < values.length; i++) {
      const color = values[i] <= 0 ? "var(--ngram-bg-2)" : heat(values[i] / mx, 13);
      const from = ((i / values.length) * 100).toFixed(2);
      const to = (((i + 1) / values.length) * 100).toFixed(2);
      stops.push(`${color} ${from}%`, `${color} ${to}%`);
    }
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  });
}

export interface ExplosionZoomProps {
  accent?: "ngram";
}

export const ExplosionZoom = memo(function ExplosionZoom({ accent }: ExplosionZoomProps) {
  void accent;
  const reduce = useReducedMotion();

  // El único control: el peldaño de la escalera. c = letras de memoria; la tabla tiene 27^c filas.
  const [idx, setIdx] = useState(0);
  const c = LADDER[idx];
  const atTop = idx >= LADDER.length - 1;
  const next = atTop ? null : LADDER[idx + 1];

  const grow = useCallback(() => setIdx((v) => Math.min(LADDER.length - 1, v + 1)), []);
  const resetC = useCallback(() => setIdx(0), []);

  const order = c + 1;
  const orderLabel = ngramLabel(order);

  // Cifras EXACTAS (BigInt, jamás aproximadas a escondidas).
  const rowsBig = useMemo(() => pow27(c), [c]);
  const hero = useMemo(() => buildHero(rowsBig), [rowsBig]);
  const bigramsBig = useMemo(() => pow27(c - 1), [c]);
  const beatsAtoms = rowsBig.toString().length - 1 >= ATOMS_EXP;
  const breaking = atTop || beatsAtoms;

  // Los mapas reales de los primeros peldaños.
  const stripes2 = useMemo(() => buildStripes(2), []);
  const stripes3 = useMemo(() => buildStripes(3), []);

  // La referencia constante: UN bigrama = 27 filas = fracción 27^(1−c) del alto de la tabla.
  const bandFrac = Math.pow(VOCAB, 1 - c); // 1 · 1/27 · 1/729 · …
  const bandPct = bandFrac * 100;
  const showBand = c === 2 || c === 3;
  const speck = c >= 4;

  // La CINTA DE CEROS: el % literal que ocupa un bigrama dentro de la tabla, con TODOS sus ceros.
  const tape = useMemo(() => pctTape(c), [c]);

  // La malla esquemática del fondo (c≥4): cada salto la hace más fina hasta fundirse en sólido.
  const meshCells = c >= 4 ? Math.min(4000, Math.round(SIDE * Math.pow(VOCAB, (c - 1) / 2))) : SIDE;
  const meshOpacity = c >= 4 ? Math.min(0.85, 0.3 + (idx - 3) * 0.18) : 0;

  const tr = reduce ? { duration: 0.2, ease: STD } : SPRING_SNAP;

  return (
    <div className="nw-ez" style={{ fontFamily: SERIF }} data-broken={breaking ? "" : undefined}>
      {/* HERO — la cifra exacta que trepa. */}
      <div className="nw-ez__hero">
        <span className="nw-ez__hero-eyebrow">
          el <b>{orderLabel}</b> necesita una tabla de
        </span>
        <div className="nw-ez__counter">
          <motion.span
            key={hero.kind === "sci" ? `sci-${hero.exp}` : hero.v}
            className="nw-ez__counter-num"
            initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={reduce ? { duration: 0.16 } : { duration: 0.36, ease: STD }}
          >
            {hero.kind === "num" ? (
              hero.v
            ) : (
              <>
                ≈&nbsp;{hero.mantissa}&nbsp;×&nbsp;10<sup className="nw-ez__sup">{hero.exp}</sup>
              </>
            )}
          </motion.span>
        </div>
        <span className="nw-ez__hero-unit">
          filas · {c} {c === 1 ? "letra" : "letras"} de memoria
        </span>
      </div>

      {/* EL MARCO — la misma ventana siempre; lo que hay dentro cambia de verdad en cada salto. */}
      <div className="nw-ez__frame" data-c1={c === 1 ? "" : undefined} aria-hidden>
        {/* c=1: la matriz real etiquetada (el bigrama que ya conoces) */}
        <BigramMatrix visible={c === 1} reduce={!!reduce} />

        {/* c=2: el mapa real de 729 (27 franjas) · c=3: el de 19.683 (729 franjas) — y a partir de
                    c=4 el último mapa queda al fondo, apagado, bajo la malla (el grano ya no se distingue). */}
        <div className="nw-ez__map" data-on={c === 2 ? "1" : "0"}>
          {stripes2.map((g, i) => (
            <span key={i} className="nw-ez__stripe" style={{ background: g }} />
          ))}
        </div>
        <div className="nw-ez__map" data-on={c === 3 ? "1" : c >= 4 ? "dim" : "0"}>
          {stripes3.map((g, i) => (
            <span key={i} className="nw-ez__stripe" style={{ background: g }} />
          ))}
        </div>

        {/* la malla esquemática del fondo del pozo — más fina por salto hasta fundirse */}
        <motion.div
          className="nw-ez__mesh"
          style={{ "--cell": `${100 / meshCells}%` } as React.CSSProperties}
          animate={{ opacity: meshOpacity }}
          transition={{ duration: reduce ? 0.2 : 0.5, ease: STD }}
        />

        {/* LA REFERENCIA — un bigrama entero. c=2/3: una BANDA de 27 filas que se adelgaza ×27. */}
        {showBand && (
          <motion.div
            className="nw-ez__band"
            initial={false}
            animate={{ height: `max(${bandPct}%, 3px)` }}
            transition={tr}
          >
            <span className="nw-ez__band-tag">un bigrama entero</span>
          </motion.div>
        )}
        {/* c≥4: ni banda se puede dibujar — un punto con halo y su leyenda */}
        {speck && !breaking && (
          <motion.div
            className="nw-ez__speck-callout"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: STD }}
          >
            <span className="nw-ez__speck-dot" />
            <span className="nw-ez__speck-label">ese punto es un bigrama entero</span>
          </motion.div>
        )}

        {/* el panel del cruce de los átomos — el final intencionado de la escalera */}
        {breaking && (
          <motion.div
            className="nw-ez__break"
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0.16 : 0.4, ease: STD }}
          >
            Se requieren más filas que átomos en el universo observable.
          </motion.div>
        )}
      </div>

      {/* LA ESCALA, en dos líneas honestas: cuántos bigramas caben · qué % ocupa UNO (ceros incluidos). */}
      <div className="nw-ez__ref-slot">
        {c === 1 ? (
          <motion.span
            key="base"
            className="nw-ez__ref"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: STD }}
          >
            esto es <b>un</b> bigrama — la tabla entera del capítulo anterior
          </motion.span>
        ) : (
          <motion.span
            key={`ref-${c}`}
            className="nw-ez__ref"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: STD }}
          >
            cabrían <b>{bigramsHero(bigramsBig)}</b> bigramas enteros aquí dentro
          </motion.span>
        )}
      </div>

      {/* LA CINTA DE CEROS — el % que ocupa un bigrama, con todos los ceros impresos. Crece de verdad. */}
      <motion.div
        key={`tape-${c}`}
        className="nw-ez__tape"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: STD }}
      >
        <span className="nw-ez__tape-lead">un bigrama es</span>
        <span className="nw-ez__tape-num">{tape}&nbsp;%</span>
        <span className="nw-ez__tape-lead">de la tabla</span>
      </motion.div>

      <div className="nw-ez__caption">
        <CaptionLine gap={0}>
          {breaking
            ? "el ×27 no se detiene · la tabla ya no cabe en ningún sitio"
            : "una letra más de memoria = la tabla ×27 · el bigrama no cambia de talla"}
        </CaptionLine>
      </div>

      {/* EL CONTROL — la escalera entera en unos pocos saltos con nombre. */}
      <div className="nw-ez__controls">
        <button
          type="button"
          className={`nw-ez__grow${breaking ? " is-break" : ""}`}
          onClick={atTop ? undefined : grow}
          disabled={atTop}
          aria-label={
            atTop ? "más filas que átomos en el universo" : `saltar al ${(next ?? 0) + 1}-grama`
          }
        >
          {atTop ? (
            <>más filas que átomos · {c} letras de memoria</>
          ) : next === c + 1 ? (
            <>
              <span className="nw-ez__grow-plus">+1</span> letra de memoria · tabla ×{VOCAB}
            </>
          ) : (
            <>
              <span className="nw-ez__grow-plus">+{(next ?? 0) - c}</span> letras · al{" "}
              {ngramLabel((next ?? 0) + 1)}
            </>
          )}
        </button>
        {c > 1 && (
          <button
            type="button"
            className="nw-ez__reset"
            onClick={resetC}
            aria-label="volver al bigrama"
          >
            volver al bigrama
          </button>
        )}
      </div>

      <style>{`
                .nw-ez {
                    width: 100%; max-width: 480px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: center; gap: 14px;
                    text-align: center;
                }

                /* HERO */
                .nw-ez__hero { display: flex; flex-direction: column; align-items: center; gap: 3px; width: 100%; }
                .nw-ez__hero-eyebrow { font-family: ${MONO}; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-ez__hero-eyebrow b { color: var(--ngram-accent-ink); font-weight: 800; }
                .nw-ez__counter { position: relative; max-width: 100%; display: flex; justify-content: center; align-items: baseline; }
                .nw-ez__counter-num {
                    font-family: ${MONO}; font-weight: 700; font-size: clamp(32px, 7.6vw, 54px); line-height: 1;
                    color: var(--ngram-accent-bright); font-variant-numeric: tabular-nums;
                    text-shadow: 0 0 28px var(--ngram-accent-soft); white-space: nowrap;
                    will-change: transform, opacity, filter;
                }
                .nw-ez__sup { font-size: 0.5em; vertical-align: super; font-weight: 800; margin-left: 1px; }
                .nw-ez__hero-unit { font-family: ${MONO}; font-size: 12px; letter-spacing: .06em; color: var(--ngram-ink-2); }

                /* EL MARCO — ventana fija; en c=1 SU borde es la talla del bigrama (sin marco interior). */
                .nw-ez__frame {
                    position: relative; width: min(380px, 82vw); aspect-ratio: 1;
                    border-radius: var(--ngram-r-md); overflow: hidden;
                    background: var(--ngram-bg-2);
                    box-shadow: inset 0 0 0 1px var(--ngram-rule-2), inset 0 0 60px color-mix(in oklab, #000 30%, transparent);
                    isolation: isolate; transition: box-shadow .4s ease;
                }
                .nw-ez__frame[data-c1] {
                    box-shadow: inset 0 0 0 2px var(--ngram-accent-bright),
                                0 0 26px -6px color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent),
                                inset 0 0 60px color-mix(in oklab, #000 24%, transparent);
                }
                .nw-ez[data-broken] .nw-ez__frame {
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-bright) 48%, transparent),
                                inset 0 0 70px color-mix(in oklab, #000 44%, transparent);
                }

                /* la matriz real (c=1) */
                .nw-ez__matrix {
                    position: absolute; inset: 0; display: grid;
                    grid-template-columns: 13px 1fr; grid-template-rows: 13px 1fr;
                    gap: 2px; padding: 7px; transition: opacity .45s ease; will-change: opacity;
                }
                .nw-ez__mx-corner { grid-column: 1; grid-row: 1; }
                .nw-ez__mx-cols { grid-column: 2; grid-row: 1; display: grid; grid-template-columns: repeat(${SIDE}, 1fr); gap: 1px; }
                .nw-ez__mx-rows { grid-column: 1; grid-row: 2; display: grid; grid-template-rows: repeat(${SIDE}, 1fr); gap: 1px; }
                .nw-ez__mx-grid { grid-column: 2; grid-row: 2; display: grid; grid-template-columns: repeat(${SIDE}, 1fr); grid-template-rows: repeat(${SIDE}, 1fr); gap: 1px; }
                .nw-ez__mx-head { display: grid; place-items: center; font-family: ${MONO}; font-size: 7px; line-height: 1; font-weight: 600; color: var(--ngram-muted); overflow: hidden; }
                .nw-ez__cell { border-radius: 0.5px; }

                /* los mapas reales (c=2: 27 franjas · c=3: 729 franjas) */
                .nw-ez__map {
                    position: absolute; inset: 0; padding: 7px;
                    display: flex; flex-direction: column; gap: 1px;
                    opacity: 0; transition: opacity .45s ease; pointer-events: none;
                }
                .nw-ez__map[data-on="1"] { opacity: 1; }
                .nw-ez__map[data-on="dim"] { opacity: .22; }
                .nw-ez__stripe { flex: 1 1 auto; min-height: 0; display: block; }

                /* la malla del fondo (c≥4) */
                .nw-ez__mesh {
                    position: absolute; inset: 0; pointer-events: none;
                    background-image:
                        linear-gradient(to right,  color-mix(in oklab, var(--ngram-accent) 58%, transparent) 0 1px, transparent 1px),
                        linear-gradient(to bottom, color-mix(in oklab, var(--ngram-accent) 58%, transparent) 0 1px, transparent 1px);
                    background-size: var(--cell) var(--cell);
                    background-position: center center;
                    -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 64%, transparent 100%);
                    mask-image: radial-gradient(circle at 50% 50%, #000 64%, transparent 100%);
                    will-change: opacity;
                }

                /* LA BANDA — un bigrama entero = 27 filas = una franja; pegada arriba, se adelgaza ×27. */
                .nw-ez__band {
                    position: absolute; left: 7px; right: 7px; top: 7px; z-index: 3;
                    border-radius: 2px;
                    box-shadow: 0 0 0 2px var(--ngram-accent-bright), 0 0 18px -2px var(--ngram-accent-bright);
                    background: color-mix(in oklab, var(--ngram-accent-bright) 10%, transparent);
                    will-change: height;
                }
                .nw-ez__band-tag {
                    position: absolute; right: -2px; top: 50%; transform: translate(100%, -50%);
                    display: none;
                }
                .nw-ez__speck-callout {
                    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
                    z-index: 4; display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;
                }
                .nw-ez__speck-dot {
                    width: 4px; height: 4px; border-radius: 999px; background: var(--ngram-accent-bright);
                    box-shadow: 0 0 0 2px color-mix(in oklab, var(--ngram-bg) 70%, transparent),
                                0 0 16px 5px color-mix(in oklab, var(--ngram-accent-bright) 70%, transparent);
                }
                .nw-ez__speck-label {
                    font-family: ${MONO}; font-size: 10.5px; letter-spacing: .04em; color: var(--ngram-accent-ink);
                    background: color-mix(in oklab, var(--ngram-bg) 82%, transparent);
                    padding: 3px 9px; border-radius: var(--ngram-r-pill);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-bright) 40%, transparent);
                }

                /* el panel del cruce de los átomos */
                .nw-ez__break {
                    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
                    max-width: 86%; padding: 13px 17px; border-radius: var(--ngram-r-sm); z-index: 5;
                    background: color-mix(in oklab, var(--ngram-bg) 90%, transparent);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-bright) 50%, transparent),
                                0 6px 22px color-mix(in oklab, #000 40%, transparent);
                    backdrop-filter: blur(5px);
                    font-family: ${SERIF}; font-style: italic; font-weight: 600;
                    font-size: clamp(14px, 2.8vw, 18px); line-height: 1.32; color: var(--ngram-accent-ink);
                }

                /* las dos líneas de escala */
                .nw-ez__ref-slot { min-height: 26px; display: flex; align-items: center; justify-content: center; }
                .nw-ez__ref {
                    max-width: 28em; font-family: ${SERIF}; font-style: italic; font-weight: 600;
                    font-size: clamp(15px, 2.4vw, 19px); line-height: 1.3; color: var(--ngram-ink-2);
                    display: inline-flex; align-items: center; gap: 7px; flex-wrap: wrap; justify-content: center;
                }
                .nw-ez__ref b { font-style: normal; color: var(--ngram-accent-bright); font-variant-numeric: tabular-nums; font-weight: 800; }

                /* LA CINTA DE CEROS — el % literal; los ceros SON la imagen de la escala. */
                .nw-ez__tape {
                    max-width: 100%; display: inline-flex; align-items: baseline; gap: 8px; flex-wrap: wrap; justify-content: center;
                    font-family: ${MONO};
                }
                .nw-ez__tape-lead { font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-ez__tape-num {
                    font-size: 12.5px; font-weight: 700; color: var(--ngram-accent-ink);
                    font-variant-numeric: tabular-nums; word-break: break-all; line-height: 1.5;
                    max-width: 34em; text-align: center;
                }

                .nw-ez__caption { display: flex; justify-content: center; max-width: 380px; }

                /* control */
                .nw-ez__controls { display: flex; flex-direction: column; align-items: center; gap: 9px; }
                .nw-ez__grow {
                    display: inline-flex; align-items: center; gap: 9px;
                    font-family: ${MONO}; font-variant-numeric: tabular-nums; font-weight: 700;
                    font-size: 13px; letter-spacing: .04em; padding: 12px 22px; border: 0;
                    border-radius: var(--ngram-r-pill); cursor: pointer;
                    color: var(--ngram-on-accent); background: var(--ngram-accent);
                    box-shadow: 0 6px 20px -8px var(--ngram-accent);
                    transition: background .2s ease, box-shadow .2s ease, color .2s ease, transform .12s ease;
                }
                .nw-ez__grow:hover { background: var(--ngram-accent-bright); }
                .nw-ez__grow:active { transform: translateY(1px); }
                .nw-ez__grow-plus {
                    display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 5px;
                    border-radius: var(--ngram-r-pill); font-weight: 800; font-size: 12px;
                    background: color-mix(in oklab, var(--ngram-on-accent) 22%, transparent);
                }
                .nw-ez__grow.is-break {
                    background: color-mix(in oklab, var(--ngram-bg-2) 70%, var(--ngram-bg));
                    color: var(--ngram-accent-bright); cursor: default;
                    box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent);
                    opacity: 0.92;
                }
                .nw-ez__reset {
                    font-family: ${MONO}; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase;
                    border: 0; background: transparent; color: var(--ngram-muted); cursor: pointer;
                    padding: 2px 6px; transition: color .2s ease;
                }
                .nw-ez__reset:hover { color: var(--ngram-accent-ink); }

                @media (prefers-reduced-motion: reduce) {
                    .nw-ez__matrix, .nw-ez__map, .nw-ez__mesh { transition: none; }
                }
            `}</style>
    </div>
  );
});

/** La matriz bigrama real, etiquetada (c=1) — la misma estructura que el lector construyó. */
const BigramMatrix = memo(function BigramMatrix({
  visible,
  reduce,
}: {
  visible: boolean;
  reduce: boolean;
}) {
  const cells = useMemo(() => {
    const out: { key: string; bg: string }[] = [];
    for (let r = 0; r < SIDE; r++) {
      const row = contextRow(1, ALPHA[r]);
      let mx = 1;
      for (const v of row) if (v > mx) mx = v;
      for (let col = 0; col < SIDE; col++) {
        out.push({ key: `${r}-${col}`, bg: heat(row[col] / mx, 14) });
      }
    }
    return out;
  }, []);

  return (
    <div
      className="nw-ez__matrix"
      style={{ opacity: visible ? 1 : 0, transition: reduce ? "none" : undefined }}
    >
      <span className="nw-ez__mx-corner" />
      <div className="nw-ez__mx-cols">
        {ALPHA.map((ch) => (
          <span key={`c-${ch}`} className="nw-ez__mx-head">
            {displayChar(ch)}
          </span>
        ))}
      </div>
      <div className="nw-ez__mx-rows">
        {ALPHA.map((ch) => (
          <span key={`r-${ch}`} className="nw-ez__mx-head">
            {displayChar(ch)}
          </span>
        ))}
      </div>
      <div className="nw-ez__mx-grid">
        {cells.map((cell) => (
          <span key={cell.key} className="nw-ez__cell" style={{ background: cell.bg }} />
        ))}
      </div>
    </div>
  );
});

/** 27^c exacto con BigInt. */
function pow27(c: number): bigint {
  let r = BigInt(1);
  for (let i = 0; i < Math.max(0, c); i++) r *= VOCAB_BIG;
  return r;
}

/** Nombre del n-grama por ORDEN: bigrama (2), trigrama (3), luego "k-grama". */
function ngramLabel(order: number): string {
  if (order === 2) return "bigrama";
  if (order === 3) return "trigrama";
  return `${order}-grama`;
}

/** La cifra del héroe: dígitos agrupados mientras sea decible, luego "m × 10^x" honesto. */
function buildHero(
  rows: bigint,
): { kind: "num"; v: string } | { kind: "sci"; mantissa: string; exp: number } {
  const digits = rows.toString();
  if (digits.length < SCI_DIGITS) return { kind: "num", v: groupDigits(digits) };
  const exp = digits.length - 1;
  const padded = digits + "0000";
  let three = Math.round(Number(padded.slice(0, 4)) / 10);
  let mExp = exp;
  if (three >= 1000) {
    three = Math.round(three / 10);
    mExp += 1;
  }
  const s = String(three).padStart(3, "0");
  return { kind: "sci", mantissa: `${s[0]},${s.slice(1)}`, exp: mExp };
}

/** "cabrían N bigramas" — agrupado mientras quepa, luego notación científica. */
function bigramsHero(v: bigint): string {
  const digits = v.toString();
  if (digits.length < SCI_DIGITS) return groupDigits(digits);
  const exp = digits.length - 1;
  const padded = digits + "0000";
  let three = Math.round(Number(padded.slice(0, 4)) / 10);
  let mExp = exp;
  if (three >= 1000) {
    three = Math.round(three / 10);
    mExp += 1;
  }
  const s = String(three).padStart(3, "0");
  return `${s[0]},${s.slice(1)} × 10^${mExp}`;
}

/**
 * La cinta de ceros: 100·27^(1−c) como decimal LITERAL ("0,0000…0037"), exacto vía BigInt — los ceros
 * impresos son la imagen de la escala. En c=1 es "100"; en c=56 lleva ~76 ceros.
 */
function pctTape(c: number): string {
  if (c === 1) return "100";
  const den = pow27(c - 1); // 27^(c-1)
  const K = den.toString().length + 3; // dígitos decimales suficientes
  const scaled = (BigInt(100) * BigInt(10) ** BigInt(K)) / den; // 100/den · 10^K
  const s = scaled.toString().padStart(K + 1, "0");
  const intPart = s.slice(0, s.length - K).replace(/^0+(?=\d)/, "");
  let frac = s.slice(s.length - K);
  // recorta la cola: deja los ceros + 2 cifras significativas
  const firstSig = frac.search(/[1-9]/);
  if (firstSig >= 0) frac = frac.slice(0, Math.min(frac.length, firstSig + 2));
  frac = frac.replace(/0+$/, (m) => (firstSig >= 0 ? "" : m));
  return frac.length > 0 ? `${intPart},${frac}` : intPart;
}

/** Agrupa una cadena de dígitos con puntos de millar es-ES (BigInt-safe). */
function groupDigits(s: string): string {
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default ExplosionZoom;
