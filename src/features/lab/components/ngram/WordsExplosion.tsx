"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { CaptionLine, heat, MONO, SERIF, STD } from "@/features/lab/components/ngram/kit";
import { getCounts } from "@/features/lab/data/ngramData";

/**
 * §4 · WordsExplosion — "27 contra 50.000" (el expandible de tokens).
 *
 * ONE idea: con PALABRAS en vez de letras, la misma tabla explota muchísimo antes — porque el alfabeto ya no
 * tiene 27 símbolos sino ~50.000.
 *
 * LA IMAGEN — un CAMPO DE BALDOSAS, no dos barras: a igual memoria, la tabla de palabras contiene exactamente
 * (50.000/27)^m tablas de letras. El marco se llena con 1.852 baldosas — el multiplicador REAL de cada paso —
 * y una baldosa destacada se nombra:
 *   m=1 (bigrama):  1 baldosa = TU tabla de letras ENTERA (las 27 filas — en miniatura, con sus datos reales).
 *   m=2 (trigrama): 1 baldosa = el CAMPO ENTERO de antes (1.852 campos de 1.852 → 3,4 millones).
 *   m=3 (4-grama):  otra vez → 6.350 millones de tablas de letras.
 * El campo es siempre la MISMA multiplicación vista una vez; la recursión (cada baldosa contiene el campo
 * anterior) es lo que hace explotar el total — y la cifra exacta lo acompaña.
 *
 * Cifras exactas (BigInt): letras 27^m · palabras 50.000^m · cociente entero. La miniatura de la tabla de
 * letras usa datos reales. Tokens-only, memo, reduced-motion safe.
 */

const LV = 27; // letras: ␣ + a–z
const WV = 50_000; // palabras: vocabulario típico

const STEPS = [
  { m: 1, name: "bigrama" },
  { m: 2, name: "trigrama" },
  { m: 3, name: "4-grama" },
] as const;

/* el multiplicador del hueco POR PASO: 50.000/27 ≈ 1.852 — el campo dibuja exactamente estas baldosas */
const TILES = Math.round(WV / LV); // 1.852
const FIELD_COLS = 48; // 48 × ~39 — llena el marco

const ONE = BigInt(1);
const MILLION = BigInt(1_000_000);
const BILLION_ES = BigInt(1_000_000_000_000); // 10¹² = un billón (escala larga)

function powBig(base: number, exp: number): bigint {
  let r = ONE;
  const b = BigInt(base);
  for (let i = 0; i < exp; i++) r *= b;
  return r;
}
function group(v: bigint): string {
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
/** Nombre castellano de una magnitud ("729" · "2.500 millones" · "125 billones"). */
function magnitudeES(v: bigint): string {
  if (v < MILLION) return group(v);
  if (v < BILLION_ES) return `${group(v / MILLION)} millones`;
  return `${group(v / BILLION_ES)} billones`;
}

/** El cociente como frase: "1.852 veces" · "3,4 millones de veces" · "6.350 millones de veces". */
function ratioText(v: bigint): string {
  if (v < MILLION) return `${group(v)} veces`;
  if (v < BILLION_ES) {
    const tenths = (v * BigInt(10)) / MILLION; // 34 → "3,4"
    const whole = tenths / BigInt(10);
    const dec = tenths % BigInt(10);
    const num = dec === BigInt(0) || whole >= BigInt(100) ? group(whole) : `${group(whole)},${dec}`;
    return `${num} millones de veces`;
  }
  return `${group(v / BILLION_ES)} billones de veces`;
}

/** La tabla de letras real, en miniatura: 27 franjas-gradiente (datos reales del bigrama). */
function thumbStripes(): string[] {
  const LETTERS = "abcdefghijklmnopqrstuvwxyz ".split("");
  const counts = getCounts(1);
  return LETTERS.map((l1) => {
    const row = counts.get(l1);
    const values = LETTERS.map((l2) => row?.get(l2) ?? 0);
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

export const WordsExplosion = memo(function WordsExplosion({ accent }: { accent?: "ngram" } = {}) {
  void accent;
  const reduce = useReducedMotion() === true;
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const atTop = stepIdx >= STEPS.length - 1;

  const lRows = useMemo(() => powBig(LV, step.m), [step.m]);
  const wRows = useMemo(() => powBig(WV, step.m), [step.m]);
  // cociente redondeado (no truncado): 50.000/27 → 1.852
  const ratio = useMemo(() => (wRows + lRows / BigInt(2)) / lRows, [wRows, lRows]);

  const thumb = useMemo(() => thumbStripes(), []);
  const deeper = useCallback(() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1)), []);

  // la baldosa destacada — fija (estable entre pasos), cerca del centro óptico
  const SPOT = FIELD_COLS * 14 + 11;

  return (
    <div className="nw-wx" style={{ fontFamily: SERIF }}>
      {/* LA COMPARACIÓN — el mismo modelo, dos alfabetos. */}
      <div className="nw-wx__duel">
        <div className="nw-wx__side">
          <span className="nw-wx__sidelbl">letras · 27 símbolos</span>
          <span className="nw-wx__sidenum nw-wx__sidenum--l">{magnitudeES(lRows)}</span>
          <span className="nw-wx__sidesub">filas</span>
        </div>
        <span className="nw-wx__vs">contra</span>
        <div className="nw-wx__side">
          <span className="nw-wx__sidelbl">palabras · 50.000 símbolos</span>
          <span className="nw-wx__sidenum nw-wx__sidenum--w">{magnitudeES(wRows)}</span>
          <span className="nw-wx__sidesub">filas</span>
        </div>
      </div>

      {/* EL CAMPO — la tabla de palabras como un mar de baldosas; cada baldosa, una tabla de letras
                (m=1) o el campo entero de antes (m≥2). Exactamente 1.852: el multiplicador real por paso. */}
      <div className="nw-wx__stage">
        <div className="nw-wx__field" data-m={step.m} aria-hidden>
          {Array.from({ length: TILES }).map((_, i) => (
            <span key={i} className={`nw-wx__tile${i === SPOT ? " is-spot" : ""}`} />
          ))}
        </div>

        {/* la lupa: qué ES una baldosa, con la tabla real en miniatura cuando m=1 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.m}
            className="nw-wx__spot"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: STD }}
          >
            <span className="nw-wx__spotarrow" aria-hidden>
              ⌐
            </span>
            {step.m === 1 ? (
              <>
                <div className="nw-wx__thumb" aria-hidden>
                  {thumb.map((g, i) => (
                    <span key={i} style={{ background: g }} />
                  ))}
                </div>
                <span className="nw-wx__spottxt">
                  <b>una baldosa</b> = tu tabla de letras <b>entera</b> (27 filas)
                </span>
              </>
            ) : (
              <span className="nw-wx__spottxt">
                <b>una baldosa</b> = el campo entero de antes
                {step.m === 3 ? <> · y cada una de aquellas, otro campo</> : null}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* EL COCIENTE — la única cifra que importa, exacta. */}
      <p className="nw-wx__ratio">
        la tabla de palabras es <b>{ratioText(ratio)}</b> más grande
      </p>

      <CaptionLine gap={0} className="nw-wx__cap">
        {step.m === 1 ? (
          <>mismo modelo, otro alfabeto · 1.852 tablas de letras por cada tabla de palabras</>
        ) : (
          <>cada paso de memoria multiplica el hueco ×1.852</>
        )}
      </CaptionLine>

      {/* CONTROLS — los tres niveles a un toque + el paso primario. */}
      <div className="nw-wx__controls">
        <div className="nw-wx__pills" role="group" aria-label="memoria">
          {STEPS.map((s, i) => (
            <button
              key={s.m}
              type="button"
              className={`nw-wx__pill${i === stepIdx ? " is-on" : ""}`}
              onClick={() => setStepIdx(i)}
              aria-pressed={i === stepIdx}
            >
              {s.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="nw-wx__grow"
          onClick={atTop ? undefined : deeper}
          disabled={atTop}
        >
          {atTop ? <>el hueco ya es de {ratioText(ratio)}</> : <>+1 de memoria · hueco ×1.852</>}
        </button>
      </div>

      <style>{`
                .nw-wx { width: 100%; max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }

                /* LA COMPARACIÓN */
                .nw-wx__duel { display: flex; align-items: baseline; justify-content: center; gap: 18px; flex-wrap: wrap; }
                .nw-wx__side { display: flex; flex-direction: column; align-items: center; gap: 2px; }
                .nw-wx__sidelbl { font-family: ${MONO}; font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-wx__sidenum { font-family: ${MONO}; font-weight: 800; line-height: 1.05; font-variant-numeric: tabular-nums; }
                .nw-wx__sidenum--l { font-size: clamp(17px, 3vw, 22px); color: var(--ngram-ink-2); }
                .nw-wx__sidenum--w { font-size: clamp(24px, 4.6vw, 34px); color: var(--ngram-accent-bright); }
                .nw-wx__sidesub { font-family: ${MONO}; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--ngram-accent-2); }
                .nw-wx__vs { font-family: ${SERIF}; font-style: italic; font-size: 13px; color: var(--ngram-dim); }

                /* EL CAMPO — 1.852 baldosas exactas en el marco */
                .nw-wx__stage { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
                .nw-wx__field {
                    width: 100%; display: grid; grid-template-columns: repeat(${FIELD_COLS}, 1fr); gap: 1.5px;
                    padding: 8px; border-radius: var(--ngram-r-md);
                    background: var(--ngram-surface); border: 1px solid var(--ngram-rule-2);
                    box-shadow: 0 1px 3px -1px color-mix(in oklab, var(--ngram-bg-2) 80%, transparent),
                                0 8px 22px -12px color-mix(in oklab, var(--ngram-bg-2) 70%, transparent);
                }
                .nw-wx__tile {
                    aspect-ratio: 1; border-radius: 1px;
                    background: color-mix(in oklab, var(--ngram-accent) 22%, var(--ngram-bg-2));
                }
                /* el grano cambia con la memoria: a más profundidad, baldosas con más "contenido" dentro */
                .nw-wx__field[data-m="2"] .nw-wx__tile {
                    background: linear-gradient(135deg,
                        color-mix(in oklab, var(--ngram-accent) 30%, var(--ngram-bg-2)) 0 50%,
                        color-mix(in oklab, var(--ngram-accent) 14%, var(--ngram-bg-2)) 50% 100%);
                }
                .nw-wx__field[data-m="3"] .nw-wx__tile {
                    background: repeating-linear-gradient(135deg,
                        color-mix(in oklab, var(--ngram-accent) 32%, var(--ngram-bg-2)) 0 1px,
                        color-mix(in oklab, var(--ngram-accent) 12%, var(--ngram-bg-2)) 1px 3px);
                }
                .nw-wx__tile.is-spot {
                    background: color-mix(in oklab, var(--ngram-accent-bright) 55%, var(--ngram-bg-2));
                    box-shadow: 0 0 0 2px var(--ngram-accent-bright), 0 0 12px -1px var(--ngram-accent-bright);
                    border-radius: 2px; z-index: 1;
                }

                /* la lupa */
                .nw-wx__spot { display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; min-height: 34px; }
                .nw-wx__spotarrow { display: none; }
                .nw-wx__thumb {
                    display: flex; flex-direction: column; gap: 0.5px; width: 56px; height: 34px;
                    padding: 2px; border-radius: 3px;
                    background: var(--ngram-bg-2);
                    box-shadow: 0 0 0 1.5px var(--ngram-accent-bright);
                }
                .nw-wx__thumb span { flex: 1 1 auto; min-height: 0; display: block; }
                .nw-wx__spottxt { font-family: ${MONO}; font-size: 11px; letter-spacing: .02em; color: var(--ngram-muted); }
                .nw-wx__spottxt b { color: var(--ngram-accent-ink); font-weight: 800; }

                /* EL COCIENTE */
                .nw-wx__ratio { margin: 0; font-family: ${SERIF}; font-style: italic; font-weight: 600; font-size: clamp(16px, 2.6vw, 20px); color: var(--ngram-ink-2); }
                .nw-wx__ratio b { font-style: normal; font-family: ${MONO}; color: var(--ngram-accent-bright); font-weight: 800; font-variant-numeric: tabular-nums; }

                .nw-wx__cap { color: var(--ngram-accent-2) !important; }

                /* CONTROLS */
                .nw-wx__controls { display: flex; flex-direction: column; align-items: center; gap: 10px; }
                .nw-wx__pills { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--ngram-r-pill); background: color-mix(in oklab, var(--ngram-bg-2) 70%, var(--ngram-bg)); box-shadow: inset 0 0 0 1px var(--ngram-rule); }
                .nw-wx__pill { font-family: ${MONO}; font-size: 12px; font-weight: 700; letter-spacing: .04em; padding: 6px 14px; border: 0; border-radius: var(--ngram-r-pill); cursor: pointer; color: var(--ngram-muted); background: transparent; transition: color .2s ease, background .2s ease; }
                .nw-wx__pill:hover { color: var(--ngram-accent-ink); }
                .nw-wx__pill.is-on { color: var(--ngram-on-accent); background: var(--ngram-accent); }
                .nw-wx__grow {
                    display: inline-flex; align-items: center; gap: 8px;
                    font-family: ${MONO}; font-weight: 700; font-size: 12.5px; letter-spacing: .04em;
                    padding: 11px 20px; border: 0; border-radius: var(--ngram-r-pill); cursor: pointer;
                    color: var(--ngram-on-accent); background: var(--ngram-accent);
                    box-shadow: 0 6px 20px -8px var(--ngram-accent);
                    transition: background .2s ease, opacity .2s ease;
                    font-variant-numeric: tabular-nums;
                }
                .nw-wx__grow:hover { background: var(--ngram-accent-bright); }
                .nw-wx__grow[disabled] { opacity: 0.72; cursor: default; }

                @media (max-width: 560px) {
                    .nw-wx__field { grid-template-columns: repeat(34, 1fr); }
                }
            `}</style>
    </div>
  );
});

export default WordsExplosion;
