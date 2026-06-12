"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  CaptionLine,
  displayChar,
  GhostButton,
  heat,
  MarkedText,
  type MarkState,
  MONO,
  PlayButton,
  SERIF,
  STD,
} from "@/features/lab/components/ngram/kit";
import {
  contextDistribution,
  contextSpace,
  type Follower,
  getCounts,
  normalizeNgram,
} from "@/features/lab/data/ngramData";

/**
 * §3 · WriteFromMatrix — "escribir = mirar la fila, tirar un DADO CARGADO, escribir esa letra, repetir".
 *
 * CONTEXT (spine s3-write). The reader has BUILT, by hand, a giant table of sharpened rows. The ONE NEW idea:
 * when the machine writes there is no magic — it (1) localiza el contexto actual en esa tabla gigante, (2) lee
 * la distribución de esa fila como porcentajes, (3) TIRA UN DADO CARGADO según esos porcentajes, (4) escribe
 * la letra que sale y (5) desliza la ventana una posición. No "piensa": lee una fila y tira un dado.
 *
 * THE HERO (4 acordes amber, izquierda→derecha):
 *   · MINIMAPA + LENTE — un sliver de la tabla de 19.683 filas; una LENTE señala la fila EXACTA del contexto
 *     (contextIndex(ctx) sobre contextSpace(3)=19.683) → "fila n.º X de 19.683". Muestra ESCALA, no un número.
 *   · HISTOGRAMA — la fila leída como % reales (contextDistribution): e 80%, i 10%, a 5%…
 *   · DADO CARGADO — una barra 0→100 segmentada por esos %; un número rueda y CAE; la letra que sale está
 *     SAMPLEADA de esa misma distribución, así el dado NUNCA contradice el histograma (el tramo donde cae es,
 *     por construcción, el de la letra elegida).
 * Debajo, la línea que se va escribiendo (MarkedText: las últimas 3 letras = la ventana = el contexto).
 *
 * Seed "th" (the). Real data: cada paso lee la fila REAL (contextDistribution(K, ctx)); el muestreo usa esas
 * mismas probabilidades. Determinista (LCG sembrado) para que "Auto" y "Siguiente" recorran el mismo camino y
 * el camino tenga sentido (no callejones sin salida). BUG conocido del bench evitado: "Siguiente letra" SIEMPRE
 * avanza el estado en cada pulsación (writeOne hace setStep((s) => s + 1), nada lo bloquea salvo "rodando").
 *
 * Assembled from the kit (MarkedText, heat-free amber bars, PlayButton/GhostButton, CaptionLine, SERIF/MONO,
 * STD) + its dos mecanismos propios inline (la lente sobre el minimapa y el dado cargado que samplea la fila).
 * Tokens-only, [data-ngram-theme]. memo, "use client", reduced-motion safe (el dado se asienta al instante,
 * sin perder información; cada pulsación sigue mutando el estado).
 */

// K = 3 letras de memoria (4-grama). Espacio de contextos = 27^3 = 19.683 filas posibles — la cifra que cita
// el minimapa. Con 3 letras la escritura suena casi a palabras y cada fila tiene una forma clara de leer.
const K = 3;
const SEED = "the"; // empieza por "th" (la semilla pedida); sus últimas 3 letras dan la primera fila real
const STEPS = 18;
const ROW_SPACE = contextSpace(K); // 19.683

const TOPN = 7; // caras nombradas del dado; la cola rara se agrupa en un tramo "resto"

const RECIPE: { n: string; label: string }[] = [
  { n: "1", label: "localiza la fila" },
  { n: "2", label: "lee los %" },
  { n: "3", label: "tira el dado" },
  { n: "4", label: "escribe la letra" },
];

/** Determinista (LCG) — el mismo camino en "Siguiente" y en "Auto", y un camino con sentido. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/* ── LA TABLA, de verdad — la misma imagen que el lector ya construyó (RowSummer/GrowingTable):
      las 19.683 filas del N=3 como 729 franjas-gradiente (cada franja = 27 filas, eje a→z→␣). ── */
const MAP_LETTERS = "abcdefghijklmnopqrstuvwxyz ".split(""); // a..z, ␣ último — el orden visual del capítulo

/** Índice VISUAL de un contexto de 3 letras en ese orden (0..19682) — donde está su fila en el mapa. */
function visualRow(ctx: string): number {
  const idx = (c: string) => (c === " " ? MAP_LETTERS.length - 1 : c.charCodeAt(0) - 97);
  return (idx(ctx[0]) * 27 + idx(ctx[1])) * 27 + idx(ctx[2]);
}

/** Una franja = 27 filas pintadas como gradiente duro por sus totales reales. */
function mapStripes(): string[] {
  const totals = new Map<string, number>();
  for (const [ctx, row] of getCounts(K)) {
    let t = 0;
    for (const v of row.values()) t += v;
    totals.set(ctx, t);
  }
  const stripes: string[] = [];
  for (const l1 of MAP_LETTERS) {
    for (const l2 of MAP_LETTERS) {
      const values = MAP_LETTERS.map((l3) => totals.get(l1 + l2 + l3) ?? 0);
      let mx = 1;
      for (const v of values) if (v > mx) mx = v;
      const stops: string[] = [];
      for (let i = 0; i < values.length; i++) {
        const color = values[i] <= 0 ? "var(--ngram-bg-2)" : heat(values[i] / mx, 13);
        const from = ((i / values.length) * 100).toFixed(2);
        const to = (((i + 1) / values.length) * 100).toFixed(2);
        stops.push(`${color} ${from}%`, `${color} ${to}%`);
      }
      stripes.push(`linear-gradient(90deg, ${stops.join(", ")})`);
    }
  }
  return stripes;
}

interface DieSeg {
  ch: string; // letra de la cara (o "" si es el tramo "resto")
  prob: number; // su probabilidad (ancho del tramo)
  start: number; // borde izquierdo acumulado, 0..1
  isRest: boolean;
}

/** Un paso pre-decidido: el contexto, su distribución real, el dado (tramos) y la letra que CAE. */
interface Step {
  ctx: string; // el contexto de K letras (la "clave" que busca la fila)
  rowNo: number; // contextIndex(ctx) + 1 → "fila n.º X de 19.683" (escala real)
  followers: Follower[]; // la fila como distribución, mayor→menor (contextDistribution)
  total: number; // denominador de la fila
  segs: DieSeg[]; // el dado: top-N caras + un tramo "resto"
  roll: number; // el número 0..99 que sale el dado
  landSeg: number; // índice del tramo donde cae (en `segs`)
  pick: string; // la letra escrita — SAMPLEADA de `followers` (coincide con el tramo)
  pickRank: number; // su posición en `followers` (para no contradecir el histograma)
}

/** Construye los tramos visibles del dado: top-N caras + un tramo "resto" para la cola larga. */
function buildSegs(followers: Follower[]): DieSeg[] {
  let acc = 0;
  const segs: DieSeg[] = [];
  const top = followers.slice(0, TOPN);
  for (const f of top) {
    segs.push({ ch: f.ch, prob: f.prob, start: acc, isRest: false });
    acc += f.prob;
  }
  const restProb = Math.max(0, 1 - acc);
  if (restProb > 0.004) segs.push({ ch: "", prob: restProb, start: acc, isRest: true });
  return segs;
}

/**
 * Pre-genera el bucle UNA vez, muestreando de las filas REALES con un RNG determinista. En cada paso:
 *   1) ctx = últimas K letras;  2) lee contextDistribution(K, ctx) (con back-off de 1 letra si la fila full-K
 *   está vacía, para no morir);  3) tira un número 0..99 y lo mapea por rangos acumulados → la letra que CAE;
 *   4) anota el tramo del dado para resaltarlo. La letra elegida ES la del tramo donde cae el número, así el
 *   dado JAMÁS contradice los porcentajes mostrados. Solo se EMITE un Step cuando la fila es full-K honesta.
 */
function buildSteps(): Step[] {
  const rng = makeRng(0x7a31c9); // semilla fija → camino reproducible y con sentido
  let stream = normalizeNgram(SEED);
  const steps: Step[] = [];
  let guard = 0;
  while (steps.length < STEPS && guard++ < STEPS * 8) {
    const ctx = stream.slice(-K);
    const dist = contextDistribution(K, ctx);
    if (dist && dist.followers.length > 0) {
      const followers = dist.followers; // ya viene mayor→menor
      const roll = Math.floor(rng() * 100); // el dado: 0..99
      const r = (roll + 0.5) / 100;
      // mapear r∈[0,1) a su letra por rangos acumulados sobre la distribución REAL
      let acc = 0;
      let pickRank = followers.length - 1;
      for (let i = 0; i < followers.length; i++) {
        if (r >= acc && r < acc + followers[i].prob) {
          pickRank = i;
          break;
        }
        acc += followers[i].prob;
      }
      const pick = followers[pickRank].ch;
      const segs = buildSegs(followers);
      // el tramo resaltado: la cara propia si está en top-N, si no el tramo "resto"
      const landSeg = pickRank < TOPN ? pickRank : segs.length - 1;
      steps.push({
        ctx,
        rowNo: visualRow(ctx) + 1,
        followers,
        total: dist.total,
        segs,
        roll,
        landSeg,
        pick,
        pickRank,
      });
      stream += pick;
    } else {
      // back-off de una letra solo para seguir caminando (no se muestra como paso)
      const shorter = stream.slice(-(K - 1));
      const d2 = contextDistribution(K - 1, shorter);
      if (!d2 || d2.followers.length === 0) break;
      stream += d2.followers[0].ch;
    }
  }
  return steps;
}

const SPIN_STEPS = 16;
const SPIN_MIN = 42;
const SPIN_MAX = 190;

export interface WriteFromMatrixProps {
  accent?: "ngram";
}

export const WriteFromMatrix = memo(function WriteFromMatrix({
  accent,
}: WriteFromMatrixProps = {}) {
  void accent;
  const reduce = useReducedMotion();

  const steps = useMemo(() => buildSteps(), []);
  const stripes = useMemo(() => mapStripes(), []);

  // step: cuántas letras del bucle se han confirmado. 0 = la fila de la semilla ya está en pantalla (el
  // mecanismo está completo desde el frame 0). Cada pulsación confirma una letra REAL más.
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  // estado del dado para el paso ACTUAL: el número que muestra ahora, y si ya aterrizó.
  const [dieNum, setDieNum] = useState<number>(-1);
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(true); // la semilla arranca ya "aterrizada" (mecanismo completo)

  const spinRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // la fila en el hero: en step=0 es la fila de la semilla (paso 0); tras una pulsación, la que produjo la
  // ÚLTIMA letra confirmada. Así el hero siempre muestra la fila que se está LEYENDO ahora.
  const si = step === 0 ? 0 : (step - 1) % steps.length;
  const cur = steps[si];

  /* ── la línea que se va escribiendo: semilla + cada letra confirmada, en orden ── */
  const written = useMemo(() => {
    let s = normalizeNgram(SEED);
    for (let i = 0; i < step; i++) s += steps[i % steps.length].pick;
    return s;
  }, [step, steps]);

  const clearSpin = useCallback(() => {
    if (spinRef.current) clearTimeout(spinRef.current);
    spinRef.current = null;
  }, []);
  const clearAuto = useCallback(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    autoRef.current = null;
  }, []);

  /**
   * Una pulsación = un ciclo entero = una letra REAL. Avanza el estado SIEMPRE (el bug del bench era que el
   * botón no avanzaba; aquí setStep((s)=>s+1) es incondicional salvo mientras el dado rueda). Tras avanzar,
   * el dado del NUEVO paso actual rueda y cae en su letra (consistente con la fila mostrada).
   */
  const writeOne = useCallback(() => {
    clearSpin();
    // la nueva letra a escribir es la del step `nextSi` (la fila que pasará a ser la actual)
    const nextStep = step + 1;
    const nextSi = (nextStep - 1) % steps.length;
    const target = steps[nextSi];
    setStep(nextStep);
    setLanded(false);

    const settle = () => {
      setDieNum(target.roll);
      setRolling(false);
      setLanded(true);
    };

    if (reduce) {
      settle();
      return;
    }

    setRolling(true);
    let k = 0;
    const tick = () => {
      if (k >= SPIN_STEPS) {
        settle();
        return;
      }
      const p = k / SPIN_STEPS;
      // números aleatorios al rodar; los últimos se acercan al real
      setDieNum(
        p > 0.7
          ? Math.max(
              0,
              Math.min(99, Math.round(target.roll + (Math.random() - 0.5) * 22 * (1 - p))),
            )
          : Math.floor(Math.random() * 100),
      );
      k += 1;
      spinRef.current = setTimeout(tick, SPIN_MIN + (SPIN_MAX - SPIN_MIN) * (p * p));
    };
    tick();
  }, [step, steps, reduce, clearSpin]);

  // al montar, fija el dado de la semilla en su número real (sin animar) para no nacer en estado muerto.
  useEffect(() => {
    setDieNum(steps[0].roll);
  }, [steps]);

  /* ── Auto: sigue escribiendo a una cadencia legible; pausa al rodar para no pisarse ── */
  useEffect(() => {
    if (!running || reduce) return;
    if (rolling) return;
    autoRef.current = setTimeout(() => writeOne(), 1100);
    return () => clearAuto();
  }, [running, reduce, rolling, step, writeOne, clearAuto]);

  // limpieza al desmontar
  useEffect(
    () => () => {
      if (spinRef.current) clearTimeout(spinRef.current);
      if (autoRef.current) clearTimeout(autoRef.current);
    },
    [],
  );

  const onStep = useCallback(() => {
    if (rolling) return; // mientras un dado rueda, ignorar (no es "no avanzar": ya está avanzando)
    if (running) {
      setRunning(false);
      clearAuto();
    }
    writeOne();
  }, [rolling, running, writeOne, clearAuto]);

  const onAuto = useCallback(() => setRunning((r) => !r), []);

  const onReset = useCallback(() => {
    clearSpin();
    clearAuto();
    setRunning(false);
    setRolling(false);
    setStep(0);
    setLanded(true);
    setDieNum(steps[0].roll);
  }, [clearSpin, clearAuto, steps]);

  /* ── la línea escrita: las últimas K letras son la ventana viva (la más reciente = hot1) ── */
  const lineState = useCallback(
    (i: number): MarkState => {
      const last = written.length - 1;
      if (i === last) return "hot1";
      if (i > last - K) return "hot2";
      return "past";
    },
    [written.length],
  );

  /* ── el contexto mostrado SOBRE la tabla (la clave que se busca; última letra = "ahora") ── */
  const ctxState = useCallback((i: number): MarkState => (i === K - 1 ? "hot1" : "hot2"), []);

  const ctxGlyphs = cur.ctx.split("").map(displayChar).join("");
  const pick = cur.pick;
  const pickLabel = pick === " " ? "el espacio «␣»" : `«${pick}»`;
  const pickPct = Math.round(cur.followers[cur.pickRank].prob * 100);

  // posición 0..1 de la banderita del dado: mientras rueda usa dieNum; al caer, el centro del tramo elegido.
  const landStart = cur.segs[cur.landSeg]?.start ?? 0;
  const landProb = cur.segs[cur.landSeg]?.prob ?? 0;
  const flagPos = landed ? landStart + landProb / 2 : dieNum >= 0 ? dieNum / 100 : 0.5;
  const shownNum = landed ? cur.roll : dieNum;

  const segColor = (s: DieSeg): string => {
    if (s.isRest) return "color-mix(in oklab, var(--ngram-accent) 14%, var(--ngram-bg-2))";
    // más probable → más brillante (28%..96%)
    const k = Math.round(28 + Math.min(1, s.prob / (cur.followers[0]?.prob || 1)) * 68);
    return `color-mix(in oklab, var(--ngram-accent-bright) ${k}%, var(--ngram-bg-2))`;
  };

  return (
    <div className="nw-wfm" style={{ fontFamily: SERIF }}>
      {/* THE KEY — el contexto de K letras que elige la fila (la última letra es "ahora"). */}
      <div className="nw-wfm__key">
        <CaptionLine gap={5}>las últimas {K} letras eligen la fila</CaptionLine>
        <div className="nw-wfm__keychips">
          <MarkedText text={cur.ctx} stateOf={ctxState} size={26} maxWidth={200} />
        </div>
      </div>

      {/* THE HERO — minimapa+lente (la fila EXACTA dentro de 19.683) → histograma de % → dado cargado. */}
      <div className="nw-wfm__hero">
        {/* LA TABLA + LA LENTE — la matriz real (las 19.683 filas, todas) y la lente que VUELA a la
                    fila exacta del contexto: «se busca en la tabla grande» hecho visible. */}
        <div className="nw-wfm__matrix" aria-hidden>
          <span className="nw-wfm__minicap">
            la tabla · {ROW_SPACE.toLocaleString("es-ES")} filas
          </span>
          <div className="nw-wfm__mapbox">
            {stripes.map((g, i) => (
              <span key={i} className="nw-wfm__mapstripe" style={{ background: g }} />
            ))}
            {/* la LENTE: vuela a la fila VERDADERA del contexto actual */}
            <motion.span
              className="nw-wfm__lens"
              animate={{ top: `${((cur.rowNo - 0.5) / ROW_SPACE) * 100}%` }}
              transition={
                reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 }
              }
            />
          </div>
          <span className="nw-wfm__minilbl">
            fila n.º <b>{cur.rowNo.toLocaleString("es-ES")}</b>
            <br />
            de {ROW_SPACE.toLocaleString("es-ES")}
          </span>
        </div>

        <span className="nw-wfm__zoom" aria-hidden>
          ›
        </span>

        <div className="nw-wfm__card">
          <div className="nw-wfm__cardhead">
            <span className="nw-wfm__cardlbl">
              la fila de <b>«{ctxGlyphs}»</b>
            </span>
          </div>

          {/* HISTOGRAMA — la fila como % reales (contextDistribution), mayor→menor. */}
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={`hist-${si}-${cur.ctx}`}
              className="nw-wfm__hist"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: STD }}
            >
              {cur.followers.slice(0, TOPN).map((f, i) => {
                const pct = Math.round(f.prob * 100);
                const isPick = i === cur.pickRank && landed;
                const wPct = (f.prob / (cur.followers[0]?.prob || 1)) * 100;
                return (
                  <span key={f.ch} className="nw-wfm__hrow" data-pick={isPick ? "1" : "0"}>
                    <span className="nw-wfm__hglyph">{displayChar(f.ch)}</span>
                    <span className="nw-wfm__htrack">
                      <motion.span
                        className="nw-wfm__hbar"
                        style={{ background: segColor(cur.segs[i] ?? cur.segs[0]) }}
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${Math.max(4, wPct)}%` }}
                        transition={{ duration: 0.3, ease: STD, delay: reduce ? 0 : i * 0.02 }}
                      />
                    </span>
                    <span className="nw-wfm__hpct">{pct}%</span>
                  </span>
                );
              })}
              {cur.followers.length > TOPN && (
                <span className="nw-wfm__hrest">
                  + {cur.followers.length - TOPN} letras más raras
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* EL DADO CARGADO — una barra 0→100 partida por esos %; el número cae en el tramo de la
                        letra elegida (por construcción coincide con el histograma). */}
          <div className="nw-wfm__dice">
            <div className="nw-wfm__flaglane" aria-hidden>
              <motion.div
                className="nw-wfm__flag"
                data-on={shownNum >= 0 ? "1" : "0"}
                animate={{ left: `${flagPos * 100}%` }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : landed
                      ? { type: "spring", stiffness: 420, damping: 24 }
                      : { type: "spring", stiffness: 700, damping: 30 }
                }
              >
                <span className="nw-wfm__num">{shownNum >= 0 ? shownNum : "·"}</span>
                <span className="nw-wfm__needle" />
              </motion.div>
            </div>

            <div className="nw-wfm__bar">
              {cur.segs.map((s, i) => {
                const isLanded = i === cur.landSeg && landed;
                const wide = s.prob > 0.085 && !s.isRest;
                return (
                  <div
                    key={s.isRest ? "rest" : s.ch}
                    className="nw-wfm__seg"
                    data-landed={isLanded ? "1" : "0"}
                    style={{ flexGrow: Math.max(0.01, s.prob), background: segColor(s) }}
                  >
                    {wide && <span className="nw-wfm__segface">{displayChar(s.ch)}</span>}
                  </div>
                );
              })}
            </div>
            <div className="nw-wfm__scale" aria-hidden>
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          {/* EL VEREDICTO — el dado cayó en N → escribe «X» (N%). El clímax, atado bajo el dado. */}
          <div className="nw-wfm__readout">
            <span className="nw-wfm__rlabel">
              {rolling ? "el dado rueda…" : `cae en ${cur.roll}`}
            </span>
            {!rolling && (
              <>
                <span className="nw-wfm__rarrow" aria-hidden>
                  →
                </span>
                <span className="nw-wfm__rletter">escribe {pickLabel}</span>
                <span className="nw-wfm__rpct">({pickPct}%)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* THE OUTPUT — la página llenándose, letra a letra; las últimas K son la ventana viva. */}
      <div className="nw-wfm__out">
        <span className="nw-wfm__outlead">lo que lleva escrito</span>
        <div className="nw-wfm__outline">
          <MarkedText
            text={written}
            stateOf={lineState}
            size="clamp(22px, 3.2vw, 30px)"
            maxWidth={640}
          />
          {!reduce && <span className="nw-wfm__caret" />}
        </div>
      </div>

      {/* THE RECIPE — los 4 pasos del bucle, leyenda legible (una vez). */}
      <div className="nw-wfm__recipe">
        {RECIPE.map((r, i) => (
          <span key={r.n} className="nw-wfm__rstep">
            <span className="nw-wfm__rnum">{r.n}.</span>
            {r.label}
            {i < RECIPE.length - 1 && (
              <span className="nw-wfm__rsep" aria-hidden>
                →
              </span>
            )}
          </span>
        ))}
        <span className="nw-wfm__rloop">↻ y repite</span>
      </div>

      {/* CONTROLS — una acción dominante; Auto + reset, compañeros discretos. */}
      <div className="nw-wfm__foot">
        <PlayButton onClick={onStep} disabled={rolling}>
          {`SIGUIENTE LETRA (${step + 1})`}
        </PlayButton>
        {!reduce && (
          <GhostButton onClick={onAuto} disabled={rolling && !running}>
            {running ? "Pausa" : "Auto"}
          </GhostButton>
        )}
        {step > 0 && (
          <button type="button" className="nw-wfm__reset" onClick={onReset} aria-label="Reiniciar">
            ↻
          </button>
        )}
      </div>

      <style>{`
                .nw-wfm { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 740px; margin: 0 auto; gap: 18px; text-align: center; }

                /* THE KEY */
                .nw-wfm__key { display: flex; flex-direction: column; align-items: center; gap: 2px; }
                .nw-wfm__keychips { display: inline-flex; }

                /* THE HERO — minimapa+lente, un bracket de zoom, y la tarjeta con la fila leída + el dado. */
                .nw-wfm__hero { position: relative; width: 100%; max-width: 624px; margin: 0 auto; display: flex; align-items: stretch; justify-content: center; gap: 14px; }

                /* LA TABLA — la matriz real (729 franjas-gradiente = 19.683 filas), la misma imagen del
                   capítulo; la lente vuela a la fila exacta. */
                .nw-wfm__matrix { flex: 0 0 148px; display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
                .nw-wfm__minicap { font-family: ${MONO}; font-size: 8.5px; line-height: 1.25; letter-spacing: .12em; text-transform: uppercase; text-align: center; color: var(--ngram-accent-2); }
                .nw-wfm__minilbl { font-family: ${MONO}; font-size: 9px; line-height: 1.35; letter-spacing: .02em; text-align: center; color: var(--ngram-muted); }
                .nw-wfm__minilbl b { color: var(--ngram-accent-ink); font-weight: 700; font-variant-numeric: tabular-nums; }
                .nw-wfm__mapbox {
                    position: relative; flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;
                    padding: 5px; border-radius: var(--ngram-r-md);
                    background: var(--ngram-surface); border: 1px solid var(--ngram-rule-2);
                    box-shadow: 0 1px 3px -1px color-mix(in oklab, var(--ngram-bg-2) 80%, transparent),
                                0 8px 22px -12px color-mix(in oklab, var(--ngram-bg-2) 70%, transparent);
                    overflow: hidden;
                }
                .nw-wfm__mapstripe { flex: 1 1 auto; min-height: 0; display: block; }
                .nw-wfm__lens {
                    position: absolute; left: 1px; right: 1px; height: 9px; transform: translateY(-50%);
                    border-radius: 2px; pointer-events: none;
                    box-shadow: 0 0 0 1.5px var(--ngram-accent-bright), 0 0 10px -1px var(--ngram-accent-bright);
                    background: color-mix(in oklab, var(--ngram-accent-bright) 10%, transparent);
                }
                .nw-wfm__zoom { flex: 0 0 auto; align-self: center; font-family: ${MONO}; font-size: 18px; font-weight: 700; color: var(--ngram-dim); }

                /* la tarjeta: el foco. Relleno calmo + una hairline; sin drop-shadow gritón ni borde brillante. */
                .nw-wfm__card {
                    position: relative; flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 14px;
                    padding: 16px 18px 16px; border-radius: var(--ngram-r-md);
                    background: color-mix(in oklab, var(--ngram-accent) 4%, var(--ngram-bg-2));
                    box-shadow: inset 0 0 0 1px var(--ngram-rule);
                }
                .nw-wfm__cardhead { display: flex; align-items: baseline; justify-content: center; }
                .nw-wfm__cardlbl { font-family: ${MONO}; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-wfm__cardlbl b { color: var(--ngram-accent-ink); font-weight: 700; }

                /* HISTOGRAMA — % reales por letra, mayor→menor; barras horizontales legibles. */
                .nw-wfm__hist { display: flex; flex-direction: column; gap: 5px; width: 100%; }
                .nw-wfm__hrow { display: grid; grid-template-columns: 20px 1fr 40px; align-items: center; gap: 10px; }
                .nw-wfm__hglyph { font-family: ${MONO}; font-size: 13px; font-weight: 700; color: var(--ngram-muted); text-align: center; transition: color .2s ease; }
                .nw-wfm__htrack { position: relative; height: 12px; border-radius: var(--ngram-r-sm); background: var(--ngram-bg-2); overflow: hidden; }
                .nw-wfm__hbar { position: absolute; left: 0; top: 0; bottom: 0; border-radius: var(--ngram-r-sm); }
                .nw-wfm__hpct { font-family: ${MONO}; font-size: 12px; font-weight: 600; color: var(--ngram-muted); text-align: right; font-variant-numeric: tabular-nums; transition: color .2s ease; }
                .nw-wfm__hrow[data-pick="1"] .nw-wfm__hglyph,
                .nw-wfm__hrow[data-pick="1"] .nw-wfm__hpct { color: var(--ngram-accent-bright); font-weight: 700; }
                .nw-wfm__hrest { font-family: ${MONO}; font-size: 10px; color: var(--ngram-dim); padding-left: 30px; text-align: left; }

                /* EL DADO — banderita con un número que cae sobre la barra segmentada por %. */
                .nw-wfm__dice { display: flex; flex-direction: column; width: 100%; }
                .nw-wfm__flaglane { position: relative; height: 34px; }
                .nw-wfm__flag { position: absolute; bottom: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; opacity: 0; transition: opacity .2s ease; }
                .nw-wfm__flag[data-on="1"] { opacity: 1; }
                .nw-wfm__num {
                    font-family: ${MONO}; font-size: 13px; font-weight: 700; line-height: 1; min-width: 26px;
                    display: inline-flex; align-items: center; justify-content: center; padding: 4px 7px;
                    color: var(--ngram-on-accent); background: var(--ngram-accent-ink); border-radius: var(--ngram-r-sm);
                    font-variant-numeric: tabular-nums;
                }
                .nw-wfm__needle { width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid var(--ngram-accent-ink); }
                .nw-wfm__bar { position: relative; display: flex; width: 100%; height: 32px; gap: 2px; border-radius: var(--ngram-r-sm); overflow: hidden; background: var(--ngram-bg-2); box-shadow: inset 0 0 0 1px var(--ngram-rule); }
                .nw-wfm__seg { position: relative; min-width: 0; height: 100%; display: flex; align-items: center; justify-content: center; flex-basis: 0; transition: filter .15s ease, box-shadow .2s ease; overflow: hidden; }
                .nw-wfm__seg[data-landed="1"] { box-shadow: inset 0 0 0 2px var(--ngram-accent-ink); filter: brightness(1.1); z-index: 2; }
                .nw-wfm__segface { font-family: ${MONO}; font-size: 13px; font-weight: 700; color: var(--ngram-on-accent); pointer-events: none; }
                .nw-wfm__scale { display: flex; justify-content: space-between; width: 100%; margin-top: 5px; font-family: ${MONO}; font-size: 9px; letter-spacing: .04em; color: var(--ngram-dim); opacity: .65; }

                /* EL VEREDICTO — cae en N → escribe «X» (N%). El clímax: la única línea acentuada del bloque. */
                .nw-wfm__readout { display: flex; align-items: baseline; justify-content: center; flex-wrap: wrap; gap: 9px; font-family: ${MONO}; min-height: 24px; }
                .nw-wfm__rlabel { font-size: 12px; letter-spacing: .01em; color: var(--ngram-muted); }
                .nw-wfm__rarrow { font-size: 15px; color: var(--ngram-dim); }
                .nw-wfm__rletter { font-size: clamp(16px, 2.2vw, 19px); font-weight: 800; color: var(--ngram-accent-bright); }
                .nw-wfm__rpct { font-size: 12px; font-weight: 600; color: var(--ngram-accent); }

                /* THE OUTPUT — la línea creciendo; co-ancla, grande para leerse como el resultado. */
                .nw-wfm__out { display: flex; flex-direction: column; align-items: center; gap: 5px; width: 100%; }
                .nw-wfm__outlead { font-family: ${MONO}; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--ngram-dim); }
                .nw-wfm__outline { display: inline-flex; align-items: baseline; justify-content: center; flex-wrap: wrap; gap: 6px; min-height: 44px; }
                .nw-wfm__caret { display: inline-block; width: 3px; height: 1em; background: var(--ngram-accent); border-radius: 2px; align-self: center; animation: nwWfmBlink 1s steps(2) infinite; }
                @keyframes nwWfmBlink { 50% { opacity: 0; } }

                /* THE RECIPE — leyenda callada, una sola línea de chrome de apoyo (sin tarjeta ni borde). */
                .nw-wfm__recipe {
                    display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px 12px;
                    font-family: ${MONO}; font-size: 11.5px; letter-spacing: .02em; color: var(--ngram-muted);
                }
                .nw-wfm__rstep { display: inline-flex; align-items: center; gap: 6px; }
                .nw-wfm__rnum { color: var(--ngram-accent-ink); font-weight: 700; font-variant-numeric: tabular-nums; }
                .nw-wfm__rsep { color: var(--ngram-dim); margin-left: 4px; font-size: 12px; }
                .nw-wfm__rloop { color: var(--ngram-dim); font-weight: 600; font-size: 11.5px; }

                /* CONTROLS */
                .nw-wfm__foot { display: inline-flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center; }
                .nw-wfm__reset { font-family: ${MONO}; font-size: 16px; color: var(--ngram-dim); background: transparent; border: 0; cursor: pointer; padding: 6px 10px; border-radius: var(--ngram-r-pill); transition: color .16s ease, background .16s ease; }
                .nw-wfm__reset:hover { color: var(--ngram-accent-bright); background: var(--ngram-accent-soft); }

                @media (max-width: 560px) {
                    .nw-wfm__bar { height: 30px; }
                    .nw-wfm__matrix { flex-basis: 84px; }
                    .nw-wfm__zoom { display: none; }
                    .nw-wfm__hrow { grid-template-columns: 20px 1fr 38px; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .nw-wfm__caret { animation: none; }
                }
            `}</style>
    </div>
  );
});

export default WriteFromMatrix;
