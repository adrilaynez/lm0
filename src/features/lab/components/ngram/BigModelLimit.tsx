"use client";

import { memo, useMemo, useState } from "react";

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
import { contextIndex, contextSpace } from "@/features/lab/data/ngramData";

/**
 * s6-limit · BigModelLimit — "La ceguera del conteo" (N-gram chapter FINALE).
 *
 * ONE idea: even when the answer effectively EXISTS, the model can't generalize. It writes by the SAME
 * recipe the reader just learned (localiza la fila → lee los % → escribe la letra), so here we WATCH it
 * search the giant table, read a row, and write — twice, with dramatically opposite outcomes:
 *   • «el perro ___» → la lente VIAJA a una fila LLENA (≈69 % abajo) → florece una distribución rica →
 *     lee "duerme 70 %" → ESCRIBE «duerme» letra a letra, con convicción.
 *   • «el gato ___»  → la lente recorre ~12.339 filas hacia arriba (≈6,5 % abajo), un viaje LARGO y
 *     visible → cae en una fila VACÍA → se apaga (gris) → 0 % → NO puede escribir nada.
 * El viaje de la lente ENTRE las dos filas, dibujado sobre la propia tabla con su distancia, es la prueba
 * de que no hay puente: lo que cayó en una casilla se queda en esa casilla.
 *
 * HONESTY: this is a SEMANTIC point (perro ≈ gato as animals). A character model over English Shakespeare
 * literally CANNOT show this with measured data, so the perro/gato distributions are an explicit
 * ILLUSTRATIVE thought-experiment — framed «ejemplo · ilustrativo» in the UI, never claimed as real counts.
 * The row ordinals (for the "filas de distancia" scale) DO come from the real 27^k geometry via
 * contextIndex, so the distance the lens travels is honest even though the cell values are hypothetical.
 */

const K = 3; // trigram — 27^3 = 19,683 possible rows
const TOTAL_ROWS = contextSpace(K); // 19,683

/**
 * Row ordinals for the table stage. We index the trailing 3-letter context of each phrase among the 27^3
 * possible rows (real base-27 geometry) so the two land on genuinely distant, fixed positions — the long
 * lens travel between them is the visual proof they are unconnected. ("perro" → "rro" ≈ 69 % down;
 * "gato" → "ato" ≈ 6.5 % down.)
 */
const ROW_PERRO = contextIndex("rro"); // 13,623 — a high row
const ROW_GATO = contextIndex("ato"); //  1,284 — far above it
const ROW_DIST = Math.abs(ROW_PERRO - ROW_GATO); // 12,339 rows apart

type Cell = { label: string; share: number };

/**
 * ILLUSTRATIVE distribution (NOT measured) for the perro row: populated and dominated by "duerme". The gato
 * row is empty (no cells). These are word-level continuations — the one deliberate step from letters to a
 * sentence-level illustration, owned openly via the «ejemplo · ilustrativo» framing.
 */
const PERRO_ROW: Cell[] = [
  { label: "duerme", share: 0.7 },
  { label: "ladra", share: 0.16 },
  { label: "corre", share: 0.09 },
  { label: "come", share: 0.05 },
];

const PERRO_TOP = PERRO_ROW.reduce((a, b) => (b.share > a.share ? b : a), PERRO_ROW[0]);
const PERRO_TOP_PCT = Math.round(PERRO_TOP.share * 100);
const PERRO_MAX = Math.max(...PERRO_ROW.map((c) => c.share));

// ── the table stage geometry ──────────────────────────────────────────────────
const STAGE_H = 360; // px — the giant table well; tall enough that distance is felt
const LENS_H = 30; // px — the travelling lens band

type Phase = "idle" | "perro" | "gato";

/** 0-based row ordinal → 0..1 vertical position inside the stage. */
function rowToY(ord: number): number {
  return ord / (TOTAL_ROWS - 1);
}

/** Lens top (px) for a given ordinal, clamped so the band stays inside the well. */
function lensTop(ord: number): number {
  return rowToY(ord) * (STAGE_H - LENS_H);
}

// ── THE TABLE STAGE — the giant table as a deep well; the lens travels it ──────

function TableStage({ phase, reduce }: { phase: Phase; reduce: boolean }) {
  // A deterministic sparse field of faint row-ticks so the SCALE of 19,683 rows is FELT, not stated.
  const ticks = useMemo(() => {
    const out: { y: number; w: number }[] = [];
    // pseudo-random but stable widths so the field reads like real, uneven data, not a ruler
    let s = 0x9e3779b9;
    for (let i = 0; i < TOTAL_ROWS; i += 137) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      out.push({ y: rowToY(i), w: 30 + (s % 55) });
    }
    return out;
  }, []);

  const visited = phase === "gato"; // the perro row keeps a faint marker once we've left it
  const lensOrd = phase === "perro" ? ROW_PERRO : phase === "gato" ? ROW_GATO : null;
  const empty = phase === "gato";
  const lensVisible = phase !== "idle";

  // band tops for the persistent perro marker + lens travel origin
  const perroTop = lensTop(ROW_PERRO);
  const gatoTop = lensTop(ROW_GATO);
  const targetTop = lensOrd === ROW_PERRO ? perroTop : lensOrd === ROW_GATO ? gatoTop : 0;
  const fromTop = phase === "gato" ? perroTop : phase === "perro" ? 0 : 0;

  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          color: "var(--ngram-muted)",
          whiteSpace: "nowrap",
        }}
      >
        la tabla entera
      </span>

      <div
        style={{
          position: "relative",
          width: 92,
          height: STAGE_H,
          background: "var(--ngram-bg-2)",
          borderRadius: "var(--ngram-r-md)",
          boxShadow: "inset 0 0 0 1px var(--ngram-rule)",
          overflow: "hidden",
        }}
      >
        {/* the sparse row field — uneven ticks so thousands of rows are felt */}
        {ticks.map((t, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: 8,
              width: `${t.w}%`,
              top: t.y * STAGE_H,
              height: 1.5,
              borderRadius: 1,
              background: "color-mix(in oklab, var(--ngram-accent) 16%, transparent)",
            }}
          />
        ))}

        {/* the tether between the two visited rows — drawn on the table once we travel to gato:
                    a long dashed line spanning the distance, the visible "no bridge" between them */}
        {visited && (
          <motion.span
            initial={reduce ? false : { scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.6, ease: STD }}
            style={{
              position: "absolute",
              left: "50%",
              top: Math.min(perroTop, gatoTop) + LENS_H / 2,
              height: Math.abs(perroTop - gatoTop),
              width: 0,
              transformOrigin: "top center",
              borderLeft: "1.5px dashed color-mix(in oklab, var(--ngram-muted) 60%, transparent)",
            }}
          />
        )}

        {/* the perro row stays VISIBLE and NAMED once we've left it — the answer is right there,
                    a few thousand rows up… and the machine cannot reach across. */}
        {visited && (
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: perroTop,
              height: LENS_H,
              border: "1px solid color-mix(in oklab, var(--ngram-accent) 46%, transparent)",
              background: "color-mix(in oklab, var(--ngram-accent) 10%, transparent)",
              borderRadius: 4,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                fontFamily: MONO,
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: ".06em",
                color: "var(--ngram-accent-ink)",
                whiteSpace: "nowrap",
              }}
            >
              perro ✓
            </span>
          </span>
        )}

        {/* the broken bridge — a literal ✕ at the midpoint of the tether: rows do not talk */}
        {visited && (
          <motion.span
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.3, ease: STD, delay: 0.7 }}
            style={{
              position: "absolute",
              left: "50%",
              top: (Math.min(perroTop, gatoTop) + Math.max(perroTop, gatoTop)) / 2 + LENS_H / 2,
              transform: "translate(-50%, -50%)",
              zIndex: 2,
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 800,
              lineHeight: 1,
              color: "var(--ngram-muted)",
              background: "var(--ngram-bg-2)",
              padding: "2px 4px",
              borderRadius: 4,
              boxShadow: "inset 0 0 0 1px var(--ngram-rule-2)",
            }}
          >
            ✕
          </motion.span>
        )}

        {/* the travelling lens — bright & lit when it lands on a full row, grey/dim when empty */}
        {lensVisible && lensOrd !== null && (
          <motion.div
            initial={reduce ? false : { top: fromTop }}
            animate={{ top: targetTop }}
            transition={
              reduce
                ? { duration: 0 }
                : // the gato journey is long → slower, more deliberate; perro is a confident drop
                  phase === "gato"
                  ? { type: "spring", stiffness: 32, damping: 16, mass: 1.4 }
                  : { type: "spring", stiffness: 70, damping: 18, mass: 1 }
            }
            style={{
              position: "absolute",
              left: -1,
              right: -1,
              height: LENS_H,
              zIndex: 3,
              borderRadius: 5,
              background: empty
                ? "color-mix(in oklab, var(--ngram-muted) 10%, transparent)"
                : "color-mix(in oklab, var(--ngram-accent-bright) 22%, transparent)",
              border: `2px solid ${empty ? "var(--ngram-dim)" : "var(--ngram-accent-bright)"}`,
              boxShadow: empty
                ? "none"
                : "0 0 18px color-mix(in oklab, var(--ngram-accent-bright) 35%, transparent)",
            }}
          >
            {/* a centred reticle line, so the band reads as a magnifier on one row */}
            <span
              style={{
                position: "absolute",
                left: 6,
                right: 6,
                top: "50%",
                height: 1.5,
                transform: "translateY(-50%)",
                background: empty ? "var(--ngram-dim)" : "var(--ngram-accent-bright)",
                opacity: 0.7,
              }}
            />
          </motion.div>
        )}
      </div>

      {/* the scale of the table — how many rows tall it is */}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: ".04em",
          color: "var(--ngram-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {TOTAL_ROWS.toLocaleString("es")} filas
      </span>
    </div>
  );
}

// ── THE ROW WELL — what the lens reads + what the model writes from it ─────────

/** The full, blooming distribution the model reads for «el perro». */
function FullRow({ reduce }: { reduce: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {PERRO_ROW.map((cell, i) => {
        const p = cell.share / PERRO_MAX;
        const isTop = cell.label === PERRO_TOP.label;
        return (
          <div key={cell.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 13.5,
                width: 56,
                flexShrink: 0,
                textAlign: "right",
                color: isTop ? "var(--ngram-ink)" : "var(--ngram-ink-2)",
                fontWeight: isTop ? 600 : 400,
              }}
            >
              {cell.label}
            </span>
            <div
              style={{
                position: "relative",
                flex: 1,
                height: 15,
                borderRadius: 4,
                background: "var(--ngram-bg-2)",
                overflow: "hidden",
              }}
            >
              <motion.span
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: p }}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.5, ease: STD, delay: 0.15 + i * 0.07 }
                }
                style={{
                  position: "absolute",
                  inset: 0,
                  transformOrigin: "left center",
                  borderRadius: 4,
                  background: isTop
                    ? "var(--ngram-accent-bright)"
                    : "color-mix(in oklab, var(--ngram-accent) 55%, var(--ngram-bg-2))",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11.5,
                width: 36,
                flexShrink: 0,
                textAlign: "right",
                color: isTop ? "var(--ngram-accent-ink)" : "var(--ngram-muted)",
                fontWeight: isTop ? 700 : 400,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(cell.share * 100)} %
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** The empty distribution the model reads for «el gato» — flat hairlines, no data. */
function EmptyRow() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {PERRO_ROW.map((cell) => (
        <div key={cell.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 13.5,
              width: 56,
              flexShrink: 0,
              textAlign: "right",
              color: "var(--ngram-dim)",
            }}
          >
            {cell.label}
          </span>
          <div style={{ flex: 1, height: 15, display: "flex", alignItems: "center" }}>
            <span
              style={{
                width: "100%",
                height: 1.5,
                borderRadius: 1,
                background: "var(--ngram-rule-2)",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11.5,
              width: 36,
              flexShrink: 0,
              textAlign: "right",
              color: "var(--ngram-dim)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            0 %
          </span>
        </div>
      ))}
    </div>
  );
}

/** The written word, revealed letter by letter — the model writing with conviction. */
function WriteWord({ word, reduce }: { word: string; reduce: boolean }) {
  return (
    <span style={{ display: "inline-flex" }}>
      {word.split("").map((ch, i) => (
        <motion.span
          key={i}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce ? { duration: 0 } : { duration: 0.22, ease: STD, delay: 0.55 + i * 0.05 }
          }
          style={{ color: "var(--ngram-accent-bright)", fontStyle: "italic" }}
        >
          {displayChar(ch)}
        </motion.span>
      ))}
    </span>
  );
}

/** One phrase's row well: the landed row state + what it WRITES (or can't). */
function RowWell({ phase, reduce }: { phase: "perro" | "gato"; reduce: boolean }) {
  const empty = phase === "gato";
  const prompt = empty ? "el gato" : "el perro";
  const ord = empty ? ROW_GATO : ROW_PERRO;

  return (
    <motion.div
      key={phase}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.4, ease: STD }}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        borderRadius: "var(--ngram-r-lg)",
        padding: "18px 20px",
        background: "var(--ngram-surface)",
        border: `1.5px solid ${
          empty
            ? "var(--ngram-rule-2)"
            : "color-mix(in oklab, var(--ngram-accent-bright) 50%, transparent)"
        }`,
      }}
    >
      {/* header — what kind of row the lens landed on */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10.5,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: empty ? "var(--ngram-muted)" : "var(--ngram-accent-ink)",
          }}
        >
          {empty ? "fila vacía" : "fila llena"}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9.5,
            letterSpacing: ".03em",
            color: "var(--ngram-muted)",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          fila n.º {ord.toLocaleString("es")}
        </span>
      </div>

      {/* WHY this row is what it is — the cause, named in the moment (not only in the eyebrow) */}
      <span
        style={{
          fontFamily: SERIF,
          fontSize: 13,
          lineHeight: 1.5,
          color: empty ? "var(--ngram-muted)" : "var(--ngram-ink-2)",
        }}
      >
        {empty ? (
          <>
            Nadie escribió nunca «el gato …» en el texto que leyó. Su fila existe — pero nació vacía
            y sigue a cero.
          </>
        ) : (
          <>El texto que leyó decía «el perro duerme» una y otra vez — esta fila se llenó sola.</>
        )}
      </span>

      {/* the row the lens read */}
      {empty ? <EmptyRow /> : <FullRow reduce={reduce} />}

      {/* the WRITE — the prompt with its blank filled (perro) or left empty (gato) */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 9,
          paddingTop: 12,
          borderTop: "1px solid var(--ngram-rule)",
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--ngram-dim)",
          }}
        >
          {empty ? "no escribe" : "escribe"}
        </span>
        <span
          style={{
            fontFamily: SERIF,
            fontSize: "clamp(18px, 2.8vw, 23px)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: empty ? "var(--ngram-muted)" : "var(--ngram-ink)",
          }}
        >
          «{prompt}{" "}
          {empty ? (
            <span style={{ color: "var(--ngram-dim)", fontWeight: 400 }}>____</span>
          ) : (
            <WriteWord word={PERRO_TOP.label} reduce={reduce} />
          )}
          »
        </span>
        {empty ? (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11.5,
              color: "var(--ngram-dim)",
              letterSpacing: ".03em",
            }}
          >
            · sin datos · 0 %
          </span>
        ) : (
          <motion.span
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 0.85 }}
            style={{
              fontFamily: MONO,
              fontSize: 11.5,
              color: "var(--ngram-accent)",
              fontWeight: 700,
            }}
          >
            · {PERRO_TOP_PCT} %
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export const BigModelLimit = memo(function BigModelLimit({ accent }: { accent?: "ngram" } = {}) {
  void accent;
  const reduce = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("idle");

  function handleNext() {
    if (phase === "idle") setPhase("perro");
    else if (phase === "perro") setPhase("gato");
    else setPhase("idle");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      {/* ── honest framing + the SPOILER, set before the reveal ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
          width: "100%",
          maxWidth: 560,
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "var(--ngram-accent-ink)",
            background: "var(--ngram-accent-soft)",
            padding: "3px 11px",
            borderRadius: "var(--ngram-r-pill)",
          }}
        >
          ejemplo · ilustrativo
        </span>
        <CaptionLine gap={0}>
          la tabla vio «el perro duerme» muchas veces · nunca «el gato duerme»
        </CaptionLine>
      </div>

      {/* ── the stage: the giant table on the left, the row well on the right ── */}
      <div
        style={{
          display: "flex",
          gap: 26,
          alignItems: "flex-start",
          width: "100%",
          maxWidth: 620,
          padding: "0 4px",
          boxSizing: "border-box",
        }}
      >
        <TableStage phase={phase} reduce={!!reduce} />

        {/* the row well — one phrase live at a time */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minHeight: STAGE_H,
            justifyContent: phase === "idle" ? "center" : "flex-start",
          }}
        >
          {phase === "idle" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {["el perro", "el gato"].map((p) => (
                <span
                  key={p}
                  style={{
                    fontFamily: SERIF,
                    fontSize: "clamp(18px, 2.8vw, 23px)",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: "var(--ngram-ink-2)",
                    padding: "13px 18px",
                    borderRadius: "var(--ngram-r-md)",
                    background: "var(--ngram-surface)",
                    border: "1.5px solid var(--ngram-rule-2)",
                  }}
                >
                  «{p} <span style={{ color: "var(--ngram-dim)", fontWeight: 400 }}>____</span>»
                </span>
              ))}
              <span
                style={{
                  fontFamily: SERIF,
                  fontSize: 14.5,
                  color: "var(--ngram-muted)",
                  lineHeight: 1.55,
                  paddingLeft: 2,
                }}
              >
                Misma respuesta para ti. Para la tabla, dos filas distintas a miles de filas de
                distancia.
              </span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {phase !== "idle" && <RowWell phase={phase} reduce={!!reduce} />}
          </AnimatePresence>

          {/* the distance — the proof of no bridge, named once we reach gato */}
          <AnimatePresence>
            {phase === "gato" && (
              <motion.div
                key="dist"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.4, ease: STD, delay: 0.5 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingTop: 2,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background:
                      "repeating-linear-gradient(90deg, var(--ngram-rule-2) 0 5px, transparent 5px 10px)",
                  }}
                />
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--ngram-muted)",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {ROW_DIST.toLocaleString("es")} filas de distancia · sin puente
                </span>
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background:
                      "repeating-linear-gradient(90deg, var(--ngram-rule-2) 0 5px, transparent 5px 10px)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* the rule that breaks it — the answer is RIGHT THERE and still unreachable */}
          <AnimatePresence>
            {phase === "gato" && (
              <motion.span
                key="rule"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.4, ease: STD, delay: 0.85 }}
                style={{
                  fontFamily: SERIF,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "var(--ngram-ink-2)",
                }}
              >
                Todo lo del perro sigue ahí, unas miles de filas más arriba — pero una fila solo se
                abre con su <b style={{ color: "var(--ngram-accent-ink)" }}>clave exacta</b>. Para
                la tabla, «el gato» y «el perro» no se parecen en <i>nada</i>.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── controls ── */}
      <div style={{ marginTop: 26, display: "flex", justifyContent: "center", gap: 12 }}>
        {phase === "idle" && <PlayButton onClick={handleNext}>buscar «el perro»</PlayButton>}
        {phase === "perro" && <PlayButton onClick={handleNext}>ahora «el gato»</PlayButton>}
        {phase === "gato" && <GhostButton onClick={handleNext}>reiniciar</GhostButton>}
      </div>

      {/* ── closing line — the parrot lesson, named once, at the climax ── */}
      <AnimatePresence>
        {phase === "gato" && (
          <motion.div
            key="closing"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: STD, delay: 0.7 }}
            style={{ marginTop: 20, maxWidth: 500, textAlign: "center" }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(15px, 2.2vw, 17px)",
                fontStyle: "italic",
                color: "var(--ngram-ink-2)",
                lineHeight: 1.5,
              }}
            >
              Un loro con muy buena memoria: recita «el perro» —{" "}
              <span style={{ color: "var(--ngram-accent-ink)", fontWeight: 600 }}>
                jamás deduce «el gato»
              </span>
              .
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default BigModelLimit;
