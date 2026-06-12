"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  CaptionLine,
  displayChar,
  GhostButton,
  MarkedText,
  type MarkState,
  MONO,
  PlayButton,
  SERIF,
  STD,
} from "@/features/lab/components/ngram/kit";
import { NGRAM_ALPHABET } from "@/features/lab/data/ngramData";

/**
 * §4.3 · QuantumElephant — "contexto infinito te ROMPE en cuanto la frase es nueva".
 *
 * CONTEXT (after §4.2 the reader felt the table explode and saw it stay almost-empty even after "todo
 * Internet"). THE ONE NEW idea, the user's literal pitch: imagina un n-grama ENORME cuya ventana de contexto
 * es TAN LARGA como la frase entera — "contexto infinito" — y entrenado con todo Internet y todo el texto de
 * la humanidad. Le damos «the quantum elephant sat». Esa cadena EXACTA, así de larga, nunca se escribió, así
 * que su fila está VACÍA. Sin nada que leer, el dado sobre las 27 letras siguientes es UNIFORME (todas igual
 * de probables) → saca una al azar → escribe una letra basura. La ventana se desliza, la nueva cadena TAMBIÉN
 * es nueva → fila vacía otra vez → dado uniforme otra vez → más basura. Sale «xsfndafd…», no lenguaje.
 *
 * HONESTY: es un EXPERIMENTO MENTAL, y lo decimos en pantalla ("imagina…"). No existe una tabla real de todo
 * Internet — pero no hace falta fingir nada: una fila NUNCA vista tiene, por definición, distribución plana, y
 * un dado plano sobre 27 caras ES uniforme. Las letras basura se sacan de un RNG determinista (semilla fija)
 * que muestrea las 27 letras del alfabeto con probabilidad uniforme — exactamente lo que hace ese dado. Así el
 * resultado es reproducible (Auto y Siguiente recorren el mismo camino) y reduced-motion-safe.
 *
 * THE MECHANIC (user's spec, literal):
 *   1. Marco honesto arriba: "imagina un n-grama enorme con todo Internet y todo el texto de la humanidad".
 *   2. La frase «the quantum elephant sat» con un botón "completar la frase" → la máquina ESCRIBE basura
 *      inhumana (letras random «xsfndafd»), animada letra a letra como los widgets de generación.
 *   3. Un botón "ver por qué" → revela: esta cadena larga nunca apareció → fila VACÍA → el dado de las 27
 *      letras es UNIFORME (27 barras planas e iguales) → por eso elige al azar → basura. Y la siguiente igual.
 *   4. Cierre: el lenguaje es infinito — hay frases nuevas que un humano sí sabría continuar; la máquina, no.
 *
 * Assembled from the kit (MarkedText, CaptionLine, PlayButton/GhostButton, SERIF/MONO, STD) + its one unique
 * mechanic inline (the empty-row + uniform-27-die that emits uniform gibberish). Tokens-only, [data-ngram-theme],
 * memo, "use client", reduced-motion safe (no synchronous setState in an effect body; gibberish settles at once).
 */

// La frase del experimento. Su LONGITUD ENTERA es la ventana de contexto ("contexto infinito"): la máquina
// mira TODA la frase para predecir la siguiente letra. Por eso la cadena-clave nunca se ha visto.
const PHRASE = "the quantum elephant sat";

// Cuántas letras basura escribe al "completar". Suficiente para que se lea inhumano sin desbordar la columna.
const GIBBERISH_LEN = 9;

// El alfabeto del dado: las 27 caras (␣ + a–z). Un dado UNIFORME reparte 1/27 a cada una.
const FACES = NGRAM_ALPHABET; // [" ", "a", … "z"]
const FACE_COUNT = FACES.length; // 27
const UNIFORM_PROB = 1 / FACE_COUNT; // ≈ 0.037 — la misma para todas

/** RNG determinista (LCG) — mismo camino en "completar" y en "auto"; basura reproducible, no Math.random. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Pre-genera la tirada de basura: en cada paso el dado es UNIFORME sobre las 27 letras (la fila está vacía,
 * no hay nada que sesgue la elección), así que sacamos una cara al azar con probabilidad 1/27 cada una. El
 * resultado es ruido inhumano por construcción — y como toda cadena-ventana siguiente también es nueva, el
 * dado sigue siendo uniforme paso tras paso. Evitamos espacios seguidos al inicio para que se LEA basura.
 */
function rollGibberish(): string[] {
  const rng = makeRng(0x9e51a7); // semilla fija → siempre la misma basura legible ("xf…")
  const out: string[] = [];
  for (let i = 0; i < GIBBERISH_LEN; i++) {
    // muestreo uniforme de una de las 27 caras
    let idx = Math.floor(rng() * FACE_COUNT);
    // un retoque puramente cosmético: que la PRIMERA cara no sea espacio (para que la basura se vea)
    if (i === 0 && FACES[idx] === " ") idx = 1 + Math.floor(rng() * 26);
    out.push(FACES[idx]);
  }
  return out;
}

const AUTO_MS = 230; // cadencia rápida: la basura sale a chorro, como una máquina sin freno

export interface QuantumElephantProps {
  accent?: "ngram";
}

export const QuantumElephant = memo(function QuantumElephant({
  accent,
}: QuantumElephantProps = {}) {
  void accent;
  const reduce = useReducedMotion() === true;

  // La basura que va a escribir (fija, reproducible). Se revela letra a letra.
  const gibberish = useMemo(() => rollGibberish(), []);

  // written = cuántas letras basura se han revelado ya (0 = aún no ha empezado a completar).
  const [written, setWritten] = useState(0);
  const [running, setRunning] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const started = written > 0;
  const done = written >= gibberish.length;

  const clearAuto = useCallback(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    autoRef.current = null;
  }, []);

  // Auto-escritura: revela una letra basura por tick. NUNCA se llama setState en el cuerpo del efecto (solo
  // dentro del callback del timer) → reduced-motion-safe. El modo reduce ni siquiera arranca el bucle:
  // `running` solo se pone a true en la rama no-reduce de onComplete (reduce vuelca toda la basura de golpe).
  const autoActive = running && !done && !reduce;
  useEffect(() => {
    if (!autoActive) return;
    autoRef.current = setTimeout(
      () => setWritten((w) => Math.min(w + 1, gibberish.length)),
      AUTO_MS,
    );
    return clearAuto;
  }, [autoActive, written, gibberish.length, clearAuto]);

  useEffect(() => () => clearAuto(), [clearAuto]);

  // "Completar la frase": arranca (o reinicia) la escritura de basura.
  const onComplete = useCallback(() => {
    clearAuto();
    if (done) {
      // ya completó → reinicia
      setWritten(0);
      setRunning(false);
      setShowWhy(false);
      return;
    }
    if (reduce) {
      setWritten(gibberish.length);
      return;
    }
    setWritten(1); // primera letra ya
    setRunning(true); // y sigue solo
  }, [clearAuto, done, reduce, gibberish.length]);

  const onReset = useCallback(() => {
    clearAuto();
    setRunning(false);
    setWritten(0);
    setShowWhy(false);
  }, [clearAuto]);

  // ── la frase-clave: toda ella es el contexto ("contexto infinito"); la última letra real es "ahora" ──
  const phraseState = useCallback((i: number): MarkState => {
    const last = PHRASE.length - 1;
    if (i === last) return "hot1";
    if (i >= last - 3) return "hot2";
    return "idle";
  }, []);

  return (
    <div className="nw-qe" style={{ fontFamily: SERIF }}>
      {/* MARCO HONESTO — el experimento mental: un n-grama enorme con todo Internet (esto es funcional,
                no un eyebrow decorativo: nombra el supuesto que hace honesto al resto). */}
      <p className="nw-qe__frame">
        Imagina un n-grama <b>enorme</b>, con una ventana de contexto tan larga como la frase entera
        —<i>contexto infinito</i>— y entrenado con <b>todo Internet</b> y todo el texto de la
        humanidad. ¿Qué hace con esta frase?
      </p>

      {/* THE PHRASE — la frase a completar. TODA ella es el contexto que la máquina busca. */}
      <div className="nw-qe__phrase">
        <CaptionLine gap={6}>el contexto es la frase ENTERA</CaptionLine>
        <div className="nw-qe__phraseline">
          <MarkedText text={PHRASE} stateOf={phraseState} size={22} maxWidth={460} />
          {/* lo que escribe: la basura, en chips accent-2, revelada letra a letra */}
          <span className="nw-qe__cont" aria-live="polite">
            {gibberish.slice(0, written).map((c, i) => (
              <motion.span
                key={i}
                className="nw-qe__junk"
                initial={reduce ? false : { opacity: 0, y: -5, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 22 }
                }
              >
                {displayChar(c)}
              </motion.span>
            ))}
            {started && !reduce && !done && <span className="nw-qe__caret" />}
          </span>
        </div>
        {started && (
          <span className="nw-qe__verdict" data-on="1">
            {done ? "esto no es lenguaje · son letras al azar" : "está escribiendo letras al azar…"}
          </span>
        )}
        {!started && <span className="nw-qe__hint">«completar la frase» — a ver qué escribe</span>}
      </div>

      {/* CONTROLS — completar (acción dominante) + ver por qué (revela la causa) + reset. */}
      <div className="nw-qe__foot">
        <PlayButton onClick={onComplete}>{done ? "OTRA VEZ ↻" : "COMPLETAR LA FRASE"}</PlayButton>
        <GhostButton onClick={() => setShowWhy((v) => !v)}>
          {showWhy ? "Ocultar el porqué" : "Ver por qué"}
        </GhostButton>
        {started && (
          <button type="button" className="nw-qe__reset" onClick={onReset} aria-label="Reiniciar">
            ↻
          </button>
        )}
      </div>

      {/* THE WHY — la causa: la fila está VACÍA → el dado de las 27 letras es UNIFORME → elige al azar. */}
      <AnimatePresence initial={false}>
        {showWhy && (
          <motion.div
            className="nw-qe__why"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: STD }}
          >
            <div className="nw-qe__whyinner">
              {/* paso 1 · la fila vacía */}
              <div className="nw-qe__step">
                <span className="nw-qe__stepno">1</span>
                <div className="nw-qe__steptxt">
                  Esa frase exacta, así de larga, <b>nunca</b> se escribió —ni en todo Internet. Su
                  fila en la tabla está <b>vacía</b>.
                </div>
              </div>
              <div className="nw-qe__emptyrow" aria-hidden>
                <span className="nw-qe__emptylbl">fila de «{PHRASE}»</span>
                <span className="nw-qe__emptytracks">
                  {Array.from({ length: 3 }).map((_, r) => (
                    <span key={r} className="nw-qe__emptytrack" />
                  ))}
                </span>
                <span className="nw-qe__emptyzero">0 ejemplos</span>
              </div>

              {/* paso 2 · el dado uniforme — UNA barra plana partida en 27 tramos idénticos */}
              <div className="nw-qe__step">
                <span className="nw-qe__stepno">2</span>
                <div className="nw-qe__steptxt">
                  Sin nada que leer, las <b>27</b> letras siguientes son <b>igual de probables</b>.
                  El dado es <b>uniforme</b>: tira → sale una al azar.
                </div>
              </div>
              <div className="nw-qe__die" aria-hidden>
                <div className="nw-qe__diebar">
                  {FACES.map((c) => (
                    <span key={c} className="nw-qe__dieseg">
                      <i>{displayChar(c)}</i>
                    </span>
                  ))}
                </div>
                <span className="nw-qe__diemore">
                  27 tramos idénticos · {(UNIFORM_PROB * 100).toFixed(1)} % cada letra
                </span>
              </div>

              {/* paso 3 · y la siguiente, igual */}
              <div className="nw-qe__step">
                <span className="nw-qe__stepno">3</span>
                <div className="nw-qe__steptxt">
                  Escribe esa letra basura, la ventana se desliza… y la nueva frase <b>tampoco</b>{" "}
                  se vio nunca. Fila vacía otra vez → dado uniforme otra vez → más basura. Así,
                  hasta el final.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLOSING — el lenguaje es infinito: hay frases nuevas que un humano continúa y la máquina no. */}
      <p className="nw-qe__close">
        El lenguaje es <b>infinito</b>: siempre habrá frases nuevas, jamás escritas, que un humano
        sabría continuar de una forma razonable. Esta máquina, que solo copia lo que ya vio, no.
      </p>

      <style>{`
                .nw-qe {
                    display: flex; flex-direction: column; align-items: center;
                    width: 100%; max-width: 640px; margin: 0 auto; gap: 16px; text-align: center;
                }

                /* MARCO HONESTO — el supuesto del experimento, en serif, calmo. */
                .nw-qe__frame {
                    margin: 0; max-width: 540px; font-family: ${SERIF}; font-size: 14.5px; line-height: 1.6;
                    color: var(--ngram-body);
                }
                .nw-qe__frame b { color: var(--ngram-accent-ink); font-weight: 700; }
                .nw-qe__frame i { color: var(--ngram-accent-bright); font-style: italic; font-weight: 600; }

                /* THE PHRASE */
                .nw-qe__phrase {
                    display: flex; flex-direction: column; align-items: center; gap: 10px;
                    width: 100%; padding: 18px 18px; border-radius: var(--ngram-r-md);
                    background: color-mix(in oklab, var(--ngram-accent) 4%, var(--ngram-bg-2));
                    box-shadow: inset 0 0 0 1px var(--ngram-rule);
                }
                .nw-qe__phraseline {
                    display: inline-flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px 6px;
                    min-height: 38px;
                }
                .nw-qe__cont { display: inline-flex; align-items: center; gap: 3px; flex-wrap: wrap; justify-content: center; }
                /* la basura: chips calmados, sin glow — el "esto no es lenguaje" lo dice la irregularidad,
                   no un neón. Tinte sage (la voz "honesta" del capítulo), distinto del accent de la frase. */
                .nw-qe__junk {
                    display: inline-flex; align-items: center; justify-content: center; min-width: 20px;
                    font-family: ${MONO}; font-size: 21px; font-weight: 700; line-height: 1;
                    color: var(--ngram-sage); background: var(--ngram-sage-soft);
                    border-radius: 6px; padding: 3px 5px;
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-sage) 30%, transparent);
                }
                .nw-qe__caret {
                    display: inline-block; width: 3px; height: 22px; margin-left: 2px;
                    background: var(--ngram-sage); border-radius: 2px;
                    animation: nwQeBlink 1s steps(2) infinite;
                }
                @keyframes nwQeBlink { 50% { opacity: 0; } }
                .nw-qe__verdict {
                    font-family: ${MONO}; font-size: 12px; letter-spacing: .02em; font-weight: 700;
                    color: var(--ngram-accent-2);
                }
                .nw-qe__hint { font-family: ${MONO}; font-size: 11px; letter-spacing: .03em; color: var(--ngram-dim); }

                /* CONTROLS */
                .nw-qe__foot { display: inline-flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; }
                .nw-qe__reset {
                    font-family: ${MONO}; font-size: 16px; color: var(--ngram-dim); background: transparent; border: 0;
                    cursor: pointer; padding: 6px 10px; border-radius: var(--ngram-r-pill);
                    transition: color .16s ease, background .16s ease;
                }
                .nw-qe__reset:hover { color: var(--ngram-accent-bright); background: var(--ngram-accent-soft); }

                /* THE WHY */
                .nw-qe__why { width: 100%; overflow: hidden; }
                /* editorial, sin caja-dentro-de-caja: una regla a la izquierda marca el aparte */
                .nw-qe__whyinner {
                    display: flex; flex-direction: column; gap: 12px; text-align: left;
                    width: 100%; padding: 6px 0 6px 16px;
                    border-left: 2px solid color-mix(in oklab, var(--ngram-accent) 30%, transparent);
                }
                .nw-qe__step { display: grid; grid-template-columns: 22px 1fr; align-items: start; gap: 11px; }
                .nw-qe__stepno {
                    display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px;
                    font-family: ${MONO}; font-size: 12px; font-weight: 800; border-radius: 50%;
                    color: var(--ngram-on-accent); background: var(--ngram-accent-ink);
                }
                .nw-qe__steptxt { font-family: ${SERIF}; font-size: 13.5px; line-height: 1.55; color: var(--ngram-body); }
                .nw-qe__steptxt b { color: var(--ngram-accent-ink); font-weight: 700; }

                /* la fila vacía */
                .nw-qe__emptyrow {
                    display: flex; flex-direction: column; gap: 6px; margin-left: 33px;
                    padding: 10px 12px; border-radius: var(--ngram-r-sm);
                    background: color-mix(in oklab, var(--ngram-accent-2) 6%, transparent);
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-2) 26%, transparent);
                }
                .nw-qe__emptylbl { font-family: ${MONO}; font-size: 10px; letter-spacing: .04em; color: var(--ngram-muted); }
                .nw-qe__emptytracks { display: flex; flex-direction: column; gap: 5px; }
                .nw-qe__emptytrack {
                    height: 11px; border-radius: var(--ngram-r-sm);
                    background: repeating-linear-gradient(
                        -45deg,
                        color-mix(in oklab, var(--ngram-accent-2) 15%, transparent) 0 6px,
                        transparent 6px 12px
                    );
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-2) 22%, transparent);
                }
                .nw-qe__emptyzero {
                    font-family: ${MONO}; font-size: 11px; font-weight: 800; letter-spacing: .02em;
                    color: var(--ngram-accent-2);
                }

                /* el dado uniforme: UNA barra plana partida en 27 tramos idénticos — la uniformidad, de un vistazo. */
                .nw-qe__die { display: flex; flex-direction: column; gap: 6px; margin-left: 33px; }
                .nw-qe__diebar {
                    display: flex; width: 100%; height: 26px; gap: 1.5px;
                    border-radius: var(--ngram-r-sm); overflow: hidden;
                    box-shadow: inset 0 0 0 1px var(--ngram-rule);
                }
                .nw-qe__dieseg {
                    flex: 1 1 0; min-width: 0; display: grid; place-items: center;
                    background: color-mix(in oklab, var(--ngram-accent) 26%, var(--ngram-bg-2));
                }
                .nw-qe__dieseg i {
                    font-style: normal; font-family: ${MONO}; font-size: 8px; line-height: 1;
                    color: var(--ngram-accent-ink); opacity: .85;
                }
                .nw-qe__diemore {
                    font-family: ${MONO}; font-size: 10.5px; letter-spacing: .02em; color: var(--ngram-dim);
                }

                /* CLOSING */
                .nw-qe__close {
                    margin: 0; max-width: 540px; font-family: ${SERIF}; font-size: 14px; line-height: 1.62;
                    color: var(--ngram-body);
                }
                .nw-qe__close b { color: var(--ngram-accent-ink); font-weight: 700; }

                @media (max-width: 540px) {
                    .nw-qe__die { grid-template-columns: 1fr; gap: 4px; }
                    .nw-qe__junk { font-size: 19px; }
                    .nw-qe__frame, .nw-qe__close { font-size: 13.5px; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .nw-qe__caret { animation: none; }
                }
            `}</style>
    </div>
  );
});

export default QuantumElephant;
