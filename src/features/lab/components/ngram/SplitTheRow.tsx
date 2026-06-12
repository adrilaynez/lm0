"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import {
  CaptionLine,
  displayChar,
  GhostButton,
  heat,
  MONO,
  PlayButton,
  SERIF,
  SPRING_SOFT,
} from "@/features/lab/components/ngram/kit";
import { contextRow, NGRAM_ALPHABET } from "@/features/lab/data/ngramData";

/**
 * §2 · SplitTheRow — VIS 2.2.5 "La revelación del bigrama"
 *
 * One idea: each FIRST-LETTER block of the trigram is itself a whole bigram table — that's why there are
 * 27 copies. The payoff is a size-match overlay, not a label.
 *
 * LEFT  — the «t» block: 27 rows for contexts "ta","tb",..."tz" (getCounts(2) / contextRow(2,"t"+L))
 * RIGHT — the full bigram table: 27 rows, one per first letter (getCounts(1) / contextRow(1,L))
 *
 * "Superponer" slides the left block onto the right. They snap to exactly the same size.
 * Hovering a row in either panel highlights its twin. SPRING_SOFT for the travel.
 */

const ALPHA = NGRAM_ALPHABET; // [space, a–z] — 27 symbols
const ANCHOR = "t"; // the letter whose block is shown on the left

// ── precompute all rows once (these are simple lookups, safe at module level) ──────────────────────

/** LEFT: 27 rows — each row is contextRow(2, ANCHOR + L), one per second letter L in ALPHA. */
function buildAnchorBlock(): { label: string; counts: number[]; mx: number }[] {
  return ALPHA.map((L) => {
    const counts = contextRow(2, ANCHOR + L);
    const mx = Math.max(1, ...counts);
    return { label: ANCHOR + L, counts, mx };
  });
}

/** RIGHT: 27 rows — each row is contextRow(1, L), the full bigram table. */
function buildBigramTable(): { label: string; counts: number[]; mx: number }[] {
  return ALPHA.map((L) => {
    const counts = contextRow(1, L);
    const mx = Math.max(1, ...counts);
    return { label: L, counts, mx };
  });
}

// ── component ──────────────────────────────────────────────────────────────────────────────────────

export const SplitTheRow = memo(function SplitTheRow({ accent }: { accent?: "ngram" } = {}) {
  void accent;

  const reduce = useReducedMotion();

  const anchorBlock = useMemo(() => buildAnchorBlock(), []);
  const bigramTable = useMemo(() => buildBigramTable(), []);

  // overlay state: false = side by side, true = overlaid
  const [overlaid, setOverlaid] = useState(false);
  // while overlaid, press-and-hold lets the reader SEE THROUGH to the bigram underneath — the two
  // tables are never blended; you always look at exactly ONE, crisp.
  const [peek, setPeek] = useState(false);

  // hovered row index (shared across both panels)
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  // ref to measure the right panel's position so we can animate the left on top of it
  const rightRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  // translation needed to move the left panel exactly onto the right one (x AND y — the stage
  // stacks vertically on small screens).
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const handleSuperponer = useCallback(() => {
    if (!overlaid && leftRef.current && rightRef.current) {
      const lRect = leftRef.current.getBoundingClientRect();
      const rRect = rightRef.current.getBoundingClientRect();
      setTranslate({ x: rRect.left - lRect.left, y: rRect.top - lRect.top });
    }
    setPeek(false);
    setOverlaid((v) => !v);
  }, [overlaid]);

  const reset = useCallback(() => {
    setOverlaid(false);
    setPeek(false);
    setHoverRow(null);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // travel = spring; the peek fade is a fast tween (per-value transitions)
  const travelTransition = {
    x: reduce ? { duration: 0 } : { ...SPRING_SOFT },
    y: reduce ? { duration: 0 } : { ...SPRING_SOFT },
    opacity: { duration: reduce ? 0 : 0.16 },
  };

  return (
    <div className="nw-spl" style={{ fontFamily: SERIF }}>
      {/* ── header caption ── */}
      <CaptionLine gap={2}>el bloque de la «{ANCHOR}» y la tabla del bigrama</CaptionLine>

      {/* ── two-panel layout ── */}
      <div
        className="nw-spl__stage"
        aria-label="Comparación: bloque de trigrama izquierda, tabla de bigrama derecha"
      >
        {/* LEFT — anchor block "t_". Travels FULLY OPAQUE onto the bigram; press-and-hold to peek. */}
        <motion.div
          ref={leftRef}
          className={`nw-spl__panel nw-spl__panel--left${overlaid ? " is-overlaid" : ""}`}
          animate={
            overlaid
              ? { x: translate.x, y: translate.y, opacity: peek ? 0 : 1, zIndex: 2 }
              : { x: 0, y: 0, opacity: 1, zIndex: 1 }
          }
          transition={travelTransition}
          onPointerDown={overlaid ? () => setPeek(true) : undefined}
          onPointerUp={overlaid ? () => setPeek(false) : undefined}
          onPointerLeave={overlaid ? () => setPeek(false) : undefined}
          aria-label={`Bloque de 27 filas para la «${ANCHOR}»: contextos ${ANCHOR}a, ${ANCHOR}b… ${ANCHOR}z`}
        >
          <div className="nw-spl__tablabel nw-spl__tablabel--left" aria-hidden>
            <span className="nw-spl__tableye">«{ANCHOR}_»</span>
            <span className="nw-spl__tabsub">
              {overlaid ? "encaja exacto sobre el bigrama" : "bloque del trigrama"}
            </span>
          </div>
          {/* column header — next-char labels (leading spacer keeps the 27 labels ON their columns) */}
          <div className="nw-spl__colheader" aria-hidden>
            <span className="nw-spl__colspacer" />
            {ALPHA.map((c) => (
              <span key={c} className="nw-spl__collbl">
                {displayChar(c)}
              </span>
            ))}
          </div>
          {/* 27 rows */}
          <div className="nw-spl__grid">
            {anchorBlock.map((row, ri) => (
              <div
                key={row.label}
                className={`nw-spl__row${hoverRow === ri ? " is-hover" : ""}${hoverRow !== null && hoverRow !== ri ? " is-dim" : ""}`}
                onMouseEnter={() => setHoverRow(ri)}
                onMouseLeave={() => setHoverRow(null)}
                onFocus={() => setHoverRow(ri)}
                onBlur={() => setHoverRow(null)}
                tabIndex={0}
                role="row"
                aria-label={`Contexto ${displayChar(row.label[0])}${displayChar(row.label[1])}: distribución de siguiente letra`}
              >
                <span className="nw-spl__rowlbl">
                  <span className="nw-spl__rowlbl-dim">{displayChar(ANCHOR)}</span>
                  <span className="nw-spl__rowlbl-accent">{displayChar(row.label[1])}</span>
                </span>
                <div className="nw-spl__strip">
                  {row.counts.map((c, ci) => (
                    <span
                      key={ci}
                      className="nw-spl__cell"
                      style={{ background: c > 0 ? heat(c / row.mx, 12) : "var(--ngram-bg-2)" }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* divider arrow — hides when overlaid */}
        <motion.div
          className="nw-spl__arrow"
          animate={{ opacity: overlaid ? 0 : 1 }}
          transition={reduce ? { duration: 0 } : { duration: 0.2 }}
          aria-hidden
        >
          <span className="nw-spl__arrowglyph">→</span>
          <span className="nw-spl__arrowlbl">mismo tamaño</span>
        </motion.div>

        {/* RIGHT — full bigram table. While covered, its label yields; during a peek it returns. */}
        <div
          ref={rightRef}
          className={`nw-spl__panel nw-spl__panel--right${overlaid && !peek ? " is-under" : ""}`}
          aria-label="Tabla completa del bigrama: 27 filas, una por cada primera letra"
        >
          <div className="nw-spl__tablabel nw-spl__tablabel--right" aria-hidden>
            <span className="nw-spl__tableye">bigrama</span>
            <span className="nw-spl__tabsub">tabla completa</span>
          </div>
          {/* column header */}
          <div className="nw-spl__colheader" aria-hidden>
            <span className="nw-spl__colspacer" />
            {ALPHA.map((c) => (
              <span key={c} className="nw-spl__collbl">
                {displayChar(c)}
              </span>
            ))}
          </div>
          {/* 27 rows */}
          <div className="nw-spl__grid">
            {bigramTable.map((row, ri) => (
              <div
                key={row.label}
                className={`nw-spl__row${hoverRow === ri ? " is-hover" : ""}${hoverRow !== null && hoverRow !== ri ? " is-dim" : ""}`}
                onMouseEnter={() => setHoverRow(ri)}
                onMouseLeave={() => setHoverRow(null)}
                onFocus={() => setHoverRow(ri)}
                onBlur={() => setHoverRow(null)}
                tabIndex={0}
                role="row"
                aria-label={`Primera letra ${displayChar(row.label)}: distribución de siguiente letra`}
              >
                <span className="nw-spl__rowlbl">
                  <span className="nw-spl__rowlbl-accent">{displayChar(row.label)}</span>
                </span>
                <div className="nw-spl__strip">
                  {row.counts.map((c, ci) => (
                    <span
                      key={ci}
                      className="nw-spl__cell"
                      style={{ background: c > 0 ? heat(c / row.mx, 12) : "var(--ngram-bg-2)" }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── reading line — twin rows side-by-side; press-to-peek hint while overlaid ── */}
      <div className="nw-spl__peek" aria-live="polite" aria-atomic="true">
        {overlaid ? (
          peek ? (
            <span className="nw-spl__peeknote">el bigrama — misma talla, mismo marco</span>
          ) : (
            <span className="nw-spl__peekhint">
              al mantener pulsada la tabla, se ve el bigrama de debajo
            </span>
          )
        ) : hoverRow !== null ? (
          <>
            <span className="nw-spl__peekctx">
              {displayChar(ANCHOR)}
              {displayChar(ALPHA[hoverRow])}
            </span>{" "}
            ↔{" "}
            <span className="nw-spl__peekctx nw-spl__peekctx--right">
              {displayChar(ALPHA[hoverRow])}
            </span>
            <span className="nw-spl__peeknote"> — la misma posición en ambas tablas</span>
          </>
        ) : (
          <span className="nw-spl__peekhint">cada fila tiene su gemela en la otra tabla</span>
        )}
      </div>

      {/* ── overlay confirmation message (only visible when overlaid) ── */}
      <motion.div
        className="nw-spl__confirm"
        initial={{ opacity: 0, y: 4 }}
        animate={overlaid ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
        transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 0.35 }}
        aria-live="polite"
      >
        <span className="nw-spl__confirminner">27 filas · 27 columnas · mismo tamaño</span>
      </motion.div>

      {/* ── controls ── */}
      <div className="nw-spl__controls">
        <PlayButton onClick={handleSuperponer}>{overlaid ? "separar" : "superponer"}</PlayButton>
        {overlaid && <GhostButton onClick={reset}>volver al principio</GhostButton>}
      </div>

      <style>{`
                /* ── root ── */
                .nw-spl {
                    width: 100%;
                    max-width: 700px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    text-align: center;
                }

                /* ── two-panel stage ── */
                .nw-spl__stage {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    gap: 20px;
                    width: 100%;
                }

                /* ── each panel ── */
                .nw-spl__panel {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    /* both panels must have the SAME computed width — flex 1 with equal min-width */
                    flex: 1;
                    min-width: 0;
                    max-width: 280px;
                }
                .nw-spl__panel--left {
                    /* will be animated on top of right; needs position for z-index to work */
                    position: relative;
                }
                /* overlaid: the travelling block is OPAQUE with a crisp frame — never a blur of two layers */
                .nw-spl__panel--left.is-overlaid { cursor: pointer; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
                .nw-spl__panel--left.is-overlaid .nw-spl__grid {
                    border-radius: 4px;
                    box-shadow: 0 0 0 2px var(--ngram-accent-bright),
                                0 18px 44px -20px color-mix(in oklab, var(--ngram-accent) 60%, transparent);
                }
                .nw-spl__panel--right {
                    position: relative;
                }
                /* while covered, the bigram's caption yields to the block's; it returns during a peek */
                .nw-spl__panel--right .nw-spl__tablabel { transition: opacity .18s ease; }
                .nw-spl__panel--right.is-under .nw-spl__tablabel { opacity: 0; }

                /* ── table label ── */
                .nw-spl__tablabel {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1px;
                    padding-bottom: 4px;
                    min-height: 32px;
                }
                .nw-spl__tableye {
                    font-family: ${MONO};
                    font-size: 13px;
                    font-weight: 800;
                    letter-spacing: .06em;
                    color: var(--ngram-accent-ink);
                }
                .nw-spl__tablabel--right .nw-spl__tableye {
                    color: var(--ngram-ink);
                }
                .nw-spl__tabsub {
                    font-family: ${MONO};
                    font-size: 9.5px;
                    font-weight: 500;
                    letter-spacing: .07em;
                    text-transform: uppercase;
                    color: var(--ngram-muted);
                }

                /* ── column header — a real spacer over the row-label gutter, then the 27 labels,
                      so every letter sits EXACTLY over its column ── */
                .nw-spl__colheader {
                    display: grid;
                    grid-template-columns: 28px repeat(27, 1fr);
                    gap: 1px;
                    padding-bottom: 1px;
                }
                .nw-spl__collbl {
                    font-family: ${MONO};
                    font-size: 7px;
                    font-weight: 600;
                    color: var(--ngram-dim);
                    text-align: center;
                    line-height: 1;
                    padding: 0 0 2px;
                }

                /* ── grid of rows ── */
                .nw-spl__grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }
                .nw-spl__row {
                    display: grid;
                    grid-template-columns: 28px 1fr;
                    gap: 2px;
                    align-items: center;
                    cursor: pointer;
                    outline: none;
                    border-radius: var(--ngram-r-sm);
                    transition: opacity .12s ease;
                }
                .nw-spl__row.is-hover {
                    background: color-mix(in oklab, var(--ngram-accent) 7%, transparent);
                }
                .nw-spl__row.is-dim {
                    opacity: .3;
                }

                /* ── row label ── */
                .nw-spl__rowlbl {
                    font-family: ${MONO};
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: .02em;
                    text-align: center;
                    line-height: 1;
                    color: var(--ngram-dim);
                    white-space: nowrap;
                }
                .nw-spl__rowlbl-dim {
                    opacity: .45;
                }
                .nw-spl__rowlbl-accent {
                    color: var(--ngram-accent-ink);
                }
                .nw-spl__row.is-hover .nw-spl__rowlbl-accent {
                    color: var(--ngram-accent-bright);
                }

                /* ── heat strip ── */
                .nw-spl__strip {
                    display: grid;
                    grid-template-columns: repeat(27, 1fr);
                    gap: 1px;
                    height: 11px;
                    border-radius: 2px;
                    overflow: hidden;
                    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 10%, transparent);
                }
                .nw-spl__cell {
                    display: block;
                    /* height fills the strip container */
                }
                .nw-spl__row.is-hover .nw-spl__strip {
                    box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent);
                }

                /* ── divider arrow ── */
                .nw-spl__arrow {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 3px;
                    padding-top: 48px;
                    flex-shrink: 0;
                    width: 36px;
                }
                .nw-spl__arrowglyph {
                    font-family: ${MONO};
                    font-size: 18px;
                    color: var(--ngram-dim);
                    line-height: 1;
                }
                .nw-spl__arrowlbl {
                    font-family: ${MONO};
                    font-size: 8px;
                    font-weight: 600;
                    letter-spacing: .06em;
                    text-transform: uppercase;
                    color: var(--ngram-muted);
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                    transform: rotate(180deg);
                    white-space: nowrap;
                }

                /* ── overlay confirmation ── */
                .nw-spl__confirm {
                    pointer-events: none;
                }
                .nw-spl__confirminner {
                    display: inline-block;
                    font-family: ${MONO};
                    font-size: 11.5px;
                    font-weight: 700;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                    color: var(--ngram-on-accent);
                    background: var(--ngram-accent);
                    border-radius: var(--ngram-r-pill);
                    padding: 6px 16px;
                }

                /* ── peek tooltip ── */
                .nw-spl__peek {
                    font-family: ${MONO};
                    font-size: clamp(11px, 1.5vw, 13px);
                    min-height: 18px;
                    color: var(--ngram-muted);
                    line-height: 1.4;
                }
                .nw-spl__peekhint {
                    color: var(--ngram-dim);
                    font-style: italic;
                }
                .nw-spl__peekctx {
                    font-weight: 800;
                    color: var(--ngram-on-accent);
                    background: var(--ngram-accent-bright);
                    border-radius: 4px;
                    padding: 1px 5px;
                }
                .nw-spl__peekctx--right {
                    background: color-mix(in oklab, var(--ngram-accent) 35%, transparent);
                    color: var(--ngram-accent-ink);
                }
                .nw-spl__peeknote {
                    color: var(--ngram-dim);
                }

                /* ── controls ── */
                .nw-spl__controls {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                /* ── responsive: stack vertically below 480px ── */
                @media (max-width: 480px) {
                    .nw-spl__stage { flex-direction: column; align-items: center; gap: 16px; }
                    .nw-spl__arrow { padding-top: 0; flex-direction: row; width: auto; writing-mode: initial; }
                    .nw-spl__arrowlbl { writing-mode: horizontal-tb; transform: none; }
                    .nw-spl__panel { max-width: 100%; }
                    .nw-spl__collbl { font-size: 6px; }
                    .nw-spl__rowlbl { font-size: 8px; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .nw-spl__row { transition: none; }
                }
            `}</style>
    </div>
  );
});

export default SplitTheRow;
