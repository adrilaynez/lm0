"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  CountUpNumber,
  FixedAlphabetRow,
  GhostButton,
  heat,
  MONO,
  ParchmentReader,
  PlayButton,
  SERIF,
  STD,
} from "@/features/lab/components/ngram/kit";
import {
  contextRow,
  contextStats,
  displayChar,
  NGRAM_ALPHABET,
  ngramStream,
} from "@/features/lab/data/ngramData";

/**
 * §2.2 · RowSummer — "Sumando filas, una letra a la vez". 729 deja de ser un número impreso: es una TABLA
 * que el lector ve contarse DESDE EL LIBRO, familia a familia, y que al final recorre celda a celda.
 *
 * ARC: idle (la familia «a» espera, 27 filas vacías a la vista) → SCAN (el papiro: cada «a?» se ilumina y su
 * fila nace a mano) → SURGE ("leyendo el libro entero": las 27 filas trepan acelerando a sus totales reales)
 * → WALL (cada familia aterriza como banda horizontal: la tabla crece banda a banda hacia 27×27) → CASCADE
 * (las familias restantes caen una a una; el héroe rueda hasta 729) → EXPLORE (el muro se expande en el mapa
 * 27×27: hover → cuenta real, click → la fila se abre como FixedAlphabetRow; «th» abierta por defecto).
 * Entre familias («built») las filas del panel se pueden CURIOSEAR: hover → la nombra el caption.
 *
 * Datos 100% reales (contextRow/contextStats/ngramStream sobre Shakespeare). Kit: ParchmentReader ·
 * FixedAlphabetRow · PlayButton/GhostButton · CountUpNumber · heat. Tokens-only, memo, reduced-motion safe.
 */

const ALPHA = NGRAM_ALPHABET; // [space, a–z] — follower axis (the columns INSIDE a row)
const VOCAB = ALPHA.length; // 27
const TOTAL = VOCAB * VOCAB; // 729 — the trigram's possible rows

/* Families AND in-family row order: a–z then ␣ last, so panel rows, wall bands and the final map all read
   alphabetically and cell (r, c) is always context FIRST_LETTERS[r] + FIRST_LETTERS[c]. */
const FIRST_LETTERS = "abcdefghijklmnopqrstuvwxyz ".split("");
const MANUAL_FAMILIES = 3; // a, b, c are counted one-at-a-time before "the whole alphabet" unlocks

/* SCAN pacing — the by-hand phase over the real book. The FIRST family is deliberately unhurried (you
   watch each pair be born); later families need fewer hits at a brisker clip. */
const SCAN_HITS = [12, 5, 3]; // pairs counted by hand per manual family
const SCAN_MS = [460, 320, 250]; // per-hit cadence
const SCAN_WINDOW = 170; // parchment window size (chars)

/* SURGE pacing — "leyendo el libro entero": accelerating ticks. Faster than the hand-count but still
   READABLE for «a» (~2.5s of visible climbing); each later family a notch quicker. */
const SURGE_STEPS = 18;
const SURGE_FIRST_MS = 320;
const SURGE_LAST_MS = 40;
const FAMILY_SPEEDUP = 0.7;

const CASCADE_MS = 85; // one remaining family lands per tick (24 ticks ≈ 2s)

type Phase = "idle" | "scanning" | "surging" | "built" | "cascading" | "explore";

interface Row {
  ctx: string; // the 2-letter context, e.g. "ab", "a␣"
  second: string; // its second letter
  full: number[]; // its real 27-count follower distribution (ALPHA order)
  gradient: string; // that distribution painted left→right as one heat-strip
  total: number; // its real row total (how many times this context occurs)
  seen: boolean; // does this context occur at all in Shakespeare?
}

/** Paint a real 27-count row as ONE continuous horizontal heat gradient (same idiom as the matrix). */
function rowGradient(full: number[]): string {
  let mx = 1;
  for (const v of full) if (v > mx) mx = v;
  const n = full.length;
  const stops: string[] = [];
  for (let i = 0; i < n; i++) {
    const color =
      full[i] <= 0
        ? "color-mix(in oklab, var(--ngram-accent-bright) 9%, var(--ngram-bg-2))"
        : heat(full[i] / mx, 22);
    const from = ((i / n) * 100).toFixed(2);
    const to = (((i + 1) / n) * 100).toFixed(2);
    stops.push(`${color} ${from}%`, `${color} ${to}%`);
  }
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

/** Build one family's 27 real rows for first letter `f`, in FIRST_LETTERS second-order. */
function buildFamily(f: string): Row[] {
  return FIRST_LETTERS.map((second) => {
    const ctx = f + second;
    const full = contextRow(2, ctx);
    let total = 0;
    for (const v of full) total += v;
    return { ctx, second, full, gradient: rowGradient(full), total, seen: total > 0 };
  });
}

/** FIRST_LETTERS index of a raw second char (space sits last). */
function secondIdxOf(c: string): number {
  return c === " " ? FIRST_LETTERS.length - 1 : c.charCodeAt(0) - 97;
}

function surgeDelay(step: number, fam: number): number {
  const k = step / (SURGE_STEPS - 1);
  const eased = 1 - Math.pow(1 - k, 2.4); // ease-in on the interval → slow start, rushed finish
  const speed = Math.pow(FAMILY_SPEEDUP, fam);
  return Math.max(
    10,
    Math.round((SURGE_FIRST_MS + (SURGE_LAST_MS - SURGE_FIRST_MS) * eased) * speed),
  );
}

const ZEROS = () => new Array<number>(FIRST_LETTERS.length).fill(0);

/* ─── One row-band of the final map (memo so a hover only re-renders the 1–2 bands it touches) ─── */
const MapBand = memo(function MapBand({
  fi,
  rows,
  maxTotal,
  hovCol,
  pinCol,
  onEnter,
  onPick,
}: {
  fi: number;
  rows: Row[];
  maxTotal: number;
  hovCol: number; // -1 unless the hover sits on this band
  pinCol: number; // -1 unless the pin sits on this band
  onEnter: (r: number, c: number) => void;
  onPick: (r: number, c: number) => void;
}) {
  return (
    <div className="nw-rs__crow">
      {rows.map((r, ci) => (
        <span
          key={r.ctx}
          className="nw-rs__c"
          data-rc={`${fi}-${ci}`}
          data-hov={ci === hovCol ? "1" : "0"}
          data-pin={ci === pinCol ? "1" : "0"}
          style={{ background: r.seen ? heat(r.total / maxTotal, 14) : "var(--ngram-bg-2)" }}
          onMouseEnter={() => onEnter(fi, ci)}
          onClick={() => onPick(fi, ci)}
        />
      ))}
    </div>
  );
});

export const RowSummer = memo(function RowSummer({ accent }: { accent?: "ngram" } = {}) {
  void accent;
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [builtFamilies, setBuiltFamilies] = useState(0); // families fully committed to the wall (0..27)
  const [hitIdx, setHitIdx] = useState(-1); // scan: which by-hand hit just landed
  const [handCounts, setHandCounts] = useState<number[]>(ZEROS); // scan: per-row hand tally (FIRST_LETTERS idx)
  const [freshIdx, setFreshIdx] = useState(-1); // scan: row that just ticked (glows)
  const [fillStep, setFillStep] = useState(0); // surge: 0..SURGE_STEPS

  // Explorer state
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [pinned, setPinned] = useState<{ r: number; c: number } | null>(null);
  const [followHover, setFollowHover] = useState<number | null>(null);
  // Panel curiosity: between families ("built") the 27 finished rows invite poking — hovering one
  // names it in the caption; CLICKING one opens it below as a full readable row (the same detail the
  // final map uses), numbers included.
  const [rowHover, setRowHover] = useState<number | null>(null);
  const [rowPinned, setRowPinned] = useState<number | null>(null);

  // Honest footer figure: how many of the 729 trigram contexts actually occur in Shakespeare.
  const observed = useMemo(() => contextStats(2).distinct, []);
  // Precompute every family's real rows once (cheap: 27 × contextRow over a cached map).
  const families = useMemo(() => FIRST_LETTERS.map(buildFamily), []);
  const maxTotal = useMemo(() => {
    let m = 1;
    for (const fam of families) for (const r of fam) if (r.total > m) m = r.total;
    return m;
  }, [families]);

  // The literal book stream + the by-hand scan plan for each manual family: the first N positions of the
  // family letter, with a parchment window that advances page-wise (precomputed → no window state).
  const stream = useMemo(() => ngramStream(), []);
  const scanPlan = useMemo(
    () =>
      FIRST_LETTERS.slice(0, MANUAL_FAMILIES).map((f, i) => {
        const need = SCAN_HITS[i] ?? 3;
        const hits: number[] = [];
        const winStarts: number[] = [];
        let ws = 0;
        for (let p = 1; p < stream.length - 2 && hits.length < need; p++) {
          if (stream[p] !== f) continue;
          if (p + 1 > ws + SCAN_WINDOW - 12) ws = Math.max(0, p - 16);
          hits.push(p);
          winStarts.push(ws);
        }
        return { hits, winStarts };
      }),
    [stream],
  );

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  /* ── Loop refs (latest-closure pattern: timeouts never call a stale closure) ── */
  const scanRef = useRef<(fam: number, h: number) => void>(() => {});
  const startSurgeRef = useRef<(fam: number) => void>(() => {});
  const surgeRef = useRef<(fam: number, step: number) => void>(() => {});
  const cascadeRef = useRef<(f: number) => void>(() => {});

  /* ── SCAN: count the family's first pairs BY HAND, walking the real book ── */
  const scanTick = useCallback(
    (fam: number, h: number) => {
      const plan = scanPlan[fam];
      if (!plan || h >= plan.hits.length) {
        setFreshIdx(-1);
        timer.current = setTimeout(() => startSurgeRef.current(fam), 460);
        return;
      }
      const p = plan.hits[h];
      const si = secondIdxOf(stream[p + 1]);
      setHitIdx(h);
      setFreshIdx(si);
      setHandCounts((prev) => {
        const nx = prev.slice();
        nx[si] += 1;
        return nx;
      });
      timer.current = setTimeout(() => scanRef.current(fam, h + 1), SCAN_MS[fam] ?? 260);
    },
    [scanPlan, stream],
  );

  /* ── SURGE: the rest of the book lands in accelerating ticks ── */
  const surgeTick = useCallback((fam: number, step: number) => {
    if (step >= SURGE_STEPS) {
      // family complete: commit its 27 rows to the wall, settle.
      setBuiltFamilies(fam + 1);
      setFillStep(0);
      setHandCounts(ZEROS);
      setHitIdx(-1);
      setPhase("built");
      return;
    }
    setFillStep(step + 1);
    timer.current = setTimeout(() => surgeRef.current(fam, step + 1), surgeDelay(step, fam));
  }, []);

  const startSurge = useCallback((fam: number) => {
    setPhase("surging");
    setFillStep(0);
    timer.current = setTimeout(() => surgeRef.current(fam, 0), 120);
  }, []);

  // «th» opens by default on entering explore — the bigram chapter's old friend, one cell among 729.
  const enterExplore = useCallback(() => {
    setPhase("explore");
    setPinned((prev) => prev ?? { r: FIRST_LETTERS.indexOf("t"), c: FIRST_LETTERS.indexOf("h") });
  }, []);

  /* ── CASCADE: the remaining families pour in one after another — never an instant snap ── */
  const cascadeTick = useCallback(
    (f: number) => {
      if (f >= FIRST_LETTERS.length) {
        enterExplore();
        return;
      }
      setBuiltFamilies(f + 1);
      timer.current = setTimeout(() => cascadeRef.current(f + 1), CASCADE_MS);
    },
    [enterExplore],
  );

  useEffect(() => {
    scanRef.current = scanTick;
  }, [scanTick]);
  useEffect(() => {
    surgeRef.current = surgeTick;
  }, [surgeTick]);
  useEffect(() => {
    startSurgeRef.current = startSurge;
  }, [startSurge]);
  useEffect(() => {
    cascadeRef.current = cascadeTick;
  }, [cascadeTick]);

  /* ── Drivers ── */
  const countFamily = useCallback(
    (fam: number) => {
      clearTimer();
      if (reduce) {
        setBuiltFamilies(fam + 1);
        setPhase("built");
        return;
      }
      setPhase("scanning");
      setHitIdx(-1);
      setFreshIdx(-1);
      setHandCounts(ZEROS);
      setFillStep(0);
      setRowHover(null);
      setRowPinned(null);
      timer.current = setTimeout(() => scanRef.current(fam, 0), 360);
    },
    [clearTimer, reduce],
  );

  const start = useCallback(() => {
    setBuiltFamilies(0);
    countFamily(0);
  }, [countFamily]);

  const addOne = useCallback(() => {
    countFamily(builtFamilies);
  }, [countFamily, builtFamilies]);

  const completeAll = useCallback(() => {
    clearTimer();
    if (reduce) {
      setBuiltFamilies(FIRST_LETTERS.length);
      enterExplore();
      return;
    }
    setRowHover(null);
    setRowPinned(null);
    setPhase("cascading");
    timer.current = setTimeout(() => cascadeRef.current(builtFamilies), 220);
  }, [clearTimer, reduce, builtFamilies, enterExplore]);

  const replay = useCallback(() => {
    clearTimer();
    setPhase("idle");
    setBuiltFamilies(0);
    setHitIdx(-1);
    setFreshIdx(-1);
    setHandCounts(ZEROS);
    setFillStep(0);
    setHover(null);
    setPinned(null);
    setFollowHover(null);
    setRowHover(null);
    setRowPinned(null);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  /* ── Derived view state ── */
  const famIdx = builtFamilies; // the family being counted right now
  const counting = phase === "scanning" || phase === "surging";
  const spotlightIdx = counting ? famIdx : builtFamilies > 0 ? builtFamilies - 1 : 0;
  const spotlight = families[spotlightIdx];
  const spotlightLetter = FIRST_LETTERS[spotlightIdx];

  // Surge fill fraction (0 → 1), eased to match the tick intervals → counts surge late.
  const frac =
    phase === "surging"
      ? 1 - Math.pow(1 - fillStep / SURGE_STEPS, 2.4)
      : phase === "scanning"
        ? 0
        : 1;

  // Parchment view: during the scan the lit pair walks the page; during the surge the page sits read.
  const plan = scanPlan[Math.min(famIdx, scanPlan.length - 1)];
  const scanPos = phase === "scanning" && hitIdx >= 0 ? plan.hits[hitIdx] : -1;
  const windowStart =
    phase === "scanning" && hitIdx >= 0
      ? plan.winStarts[hitIdx]
      : plan
        ? (plan.winStarts[plan.winStarts.length - 1] ?? 0)
        : 0;
  const cascadeFrac =
    phase === "cascading"
      ? (builtFamilies - MANUAL_FAMILIES) / (FIRST_LETTERS.length - MANUAL_FAMILIES)
      : 0;
  const readProgress =
    phase === "scanning"
      ? scanPos > 0
        ? scanPos / stream.length
        : 0
      : phase === "surging"
        ? frac
        : phase === "cascading"
          ? cascadeFrac
          : 1;

  // The committed running total the hero rests on, plus the family entering live during a surge.
  const committed = builtFamilies * VOCAB;
  const liveCount = phase === "surging" ? committed + Math.round(frac * VOCAB) : committed;

  // The stage is visible from the FIRST frame: at idle the «a» family sits empty (27 labelled slots,
  // 0/27 wall) so the reader SEES the table they are about to fill before pressing anything.
  const showStage = phase !== "explore";
  const showParchment = showStage && phase !== "idle"; // the book opens when the counting starts
  const wallFamilies = builtFamilies;

  // The finished rows are pokeable between families — the curiosity that foreshadows the final map.
  const rowsInspectable = phase === "built";
  const hoveredRow = rowsInspectable && rowHover != null ? spotlight[rowHover] : null;
  // …and CLICKING one opens it below, full size, with its real numbers (same detail as the final map).
  const panelRow = rowsInspectable && rowPinned != null ? spotlight[rowPinned] : null;
  const panelWinner = useMemo(() => {
    if (!panelRow || !panelRow.seen) return -1;
    let w = 0;
    for (let i = 1; i < panelRow.full.length; i++) if (panelRow.full[i] > panelRow.full[w]) w = i;
    return w;
  }, [panelRow]);
  const pickPanelRow = useCallback((ci: number) => {
    setRowPinned((prev) => (prev === ci ? null : ci));
    setFollowHover(null);
  }, []);

  /* ── Explorer derived ── */
  const probe = hover ?? pinned;
  const probeRow = probe ? families[probe.r][probe.c] : null;
  const pinnedRow = pinned ? families[pinned.r][pinned.c] : null;
  const pinnedWinner = useMemo(() => {
    if (!pinnedRow || !pinnedRow.seen) return -1;
    let w = 0;
    for (let i = 1; i < pinnedRow.full.length; i++)
      if (pinnedRow.full[i] > pinnedRow.full[w]) w = i;
    return w;
  }, [pinnedRow]);

  const onCellEnter = useCallback((r: number, c: number) => setHover({ r, c }), []);
  const onCellPick = useCallback((r: number, c: number) => {
    setPinned({ r, c });
    setFollowHover(null);
  }, []);
  const onMapLeave = useCallback(() => setHover(null), []);
  // Touch scrub: sliding a finger across the map live-updates the readout (cells are tiny on phones);
  // a tap still pins (the synthetic click). Page scroll stays untouched.
  const onMapTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const rc =
      el instanceof HTMLElement ? el.closest<HTMLElement>("[data-rc]")?.dataset.rc : undefined;
    if (!rc) return;
    const [r, c] = rc.split("-").map(Number);
    if (Number.isFinite(r) && Number.isFinite(c)) setHover({ r, c });
  }, []);

  return (
    <div className="nw-rs" style={{ fontFamily: SERIF }}>
      {/* HERO — the climbing row total (0 → 27 → 54 → … → 729). */}
      <div className="nw-rs__hero">
        <span className="nw-rs__count" aria-live="polite">
          <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>
            {(phase === "explore" ? TOTAL : liveCount).toLocaleString("es-ES")}
          </span>
        </span>
        <span className="nw-rs__herolbl">
          {phase === "explore"
            ? "filas · la tabla entera"
            : phase === "scanning"
              ? `contando del libro · familia «${displayChar(spotlightLetter)}»`
              : phase === "surging"
                ? `leyendo el libro entero · familia «${displayChar(spotlightLetter)}»`
                : phase === "cascading"
                  ? "sumando familias"
                  : "filas en la tabla"}
        </span>
      </div>

      {/* THE BOOK — the parchment the counting visibly comes from (scan: lit pair; surge: sweep). */}
      {showParchment && (
        <div className="nw-rs__reader">
          <ParchmentReader
            text={stream}
            windowStart={windowStart}
            windowSize={SCAN_WINDOW}
            head={
              phase === "scanning"
                ? scanPos >= 0
                  ? scanPos + 1
                  : windowStart - 1
                : windowStart + SCAN_WINDOW
            }
            hot1={phase === "scanning" ? scanPos : -1}
            hot2={phase === "scanning" && scanPos >= 0 ? scanPos + 1 : -1}
            progress={readProgress}
            reading={phase === "scanning" || phase === "surging" || phase === "cascading"}
            markerLabel={
              phase === "scanning" ? (
                <>contando «{displayChar(spotlightLetter)}?» a mano</>
              ) : phase === "surging" ? (
                <>leyendo el libro entero</>
              ) : phase === "cascading" ? (
                <>las {FIRST_LETTERS.length - MANUAL_FAMILIES} familias restantes</>
              ) : (
                <>libro leído</>
              )
            }
            maxWidth={680}
          />
        </div>
      )}

      {showStage && (
        <div className="nw-rs__stage">
          {/* LEFT — the "now counting" family panel: ALL 27 real rows of one family, always fully
                        on screen. Scan: hand tallies tick in. Surge: counts climb to the book's totals. */}
          <div
            className="nw-rs__panel"
            data-done={phase === "built" && builtFamilies >= MANUAL_FAMILIES ? "1" : "0"}
          >
            <div className="nw-rs__panelhd">
              <span className="nw-rs__fam">{displayChar(spotlightLetter)}</span>
              <span className="nw-rs__panellbl">
                {phase === "scanning" ? (
                  <>familia «{displayChar(spotlightLetter)}» · contando del libro</>
                ) : (
                  <>familia «{displayChar(spotlightLetter)}» · 27 filas</>
                )}
              </span>
            </div>
            <div className="nw-rs__rows">
              {spotlight.map((r, ci) => {
                const hand = handCounts[ci];
                let on: boolean;
                let label: string;
                if (phase === "idle") {
                  on = false;
                  label = "";
                } else if (phase === "scanning") {
                  on = hand > 0;
                  label = hand > 0 ? hand.toLocaleString("es-ES") : "";
                } else if (phase === "surging") {
                  on = r.seen;
                  const live = Math.max(hand, Math.round(r.total * frac));
                  label = r.seen ? live.toLocaleString("es-ES") : "";
                } else {
                  on = true;
                  label = r.seen ? r.total.toLocaleString("es-ES") : "·";
                }
                const isFresh = phase === "scanning" && ci === freshIdx;
                const strip: React.CSSProperties =
                  phase === "idle" || phase === "scanning"
                    ? {
                        background: on
                          ? "color-mix(in oklab, var(--ngram-accent) 20%, var(--ngram-bg-2))"
                          : "color-mix(in oklab, var(--ngram-rule-2) 70%, transparent)",
                      }
                    : phase === "surging"
                      ? {
                          background: r.seen
                            ? r.gradient
                            : "color-mix(in oklab, var(--ngram-rule-2) 70%, transparent)",
                          opacity: r.seen ? 0.3 + 0.7 * frac : 1,
                        }
                      : {
                          background: r.seen
                            ? r.gradient
                            : "color-mix(in oklab, var(--ngram-rule-2) 70%, transparent)",
                        };
                return (
                  <div
                    key={r.ctx}
                    className={`nw-rs__row${on ? " is-on" : ""}${isFresh ? " is-fresh" : ""}${rowsInspectable && rowHover === ci ? " is-hov" : ""}${rowsInspectable && rowPinned === ci ? " is-pin" : ""}`}
                    data-poke={rowsInspectable ? "1" : "0"}
                    onMouseEnter={rowsInspectable ? () => setRowHover(ci) : undefined}
                    onMouseLeave={rowsInspectable ? () => setRowHover(null) : undefined}
                    onClick={rowsInspectable ? () => pickPanelRow(ci) : undefined}
                  >
                    <span className="nw-rs__ctx" aria-hidden>
                      <b>{displayChar(spotlightLetter)}</b>
                      {displayChar(r.second)}
                    </span>
                    <span className="nw-rs__strip" style={strip} aria-hidden />
                    <span className="nw-rs__rtot" aria-hidden>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — the wall: every counted family is a horizontal 27-cell BAND stacking top→down
                        toward 27 bands = a solid 27×27 block = 729 — the table itself, growing. */}
          <div className="nw-rs__wall" aria-hidden>
            <div className="nw-rs__walllbl">
              <span className="nw-rs__wallnum">
                {wallFamilies}
                <span className="nw-rs__wallden"> / 27</span>
              </span>
              <span className="nw-rs__wallcap">familias en la tabla</span>
            </div>
            <div className="nw-rs__grid">
              {FIRST_LETTERS.map((f, fi) => {
                const landed = fi < wallFamilies;
                const fam = families[fi];
                return (
                  <motion.div
                    key={f}
                    className="nw-rs__band"
                    initial={false}
                    animate={reduce ? undefined : { opacity: landed ? 1 : 0.14 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.32, ease: STD }}
                    style={reduce ? { opacity: landed ? 1 : 0.14 } : undefined}
                  >
                    {fam.map((r) => (
                      <span
                        key={r.ctx}
                        className="nw-rs__cell"
                        style={{
                          background: landed
                            ? r.seen
                              ? heat(r.total / maxTotal, 14)
                              : "var(--ngram-bg-2)"
                            : "transparent",
                        }}
                      />
                    ))}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ONE functional caption — names what the table is doing right now. */}
      {showStage && (
        <p className="nw-rs__caption">
          {phase === "idle" ? (
            <>la familia de la «a»: 27 filas, todavía vacías</>
          ) : phase === "scanning" ? (
            <>
              cada «{displayChar(spotlightLetter)}» del libro apunta su pareja —{" "}
              {displayChar(spotlightLetter)}a, {displayChar(spotlightLetter)}b …{" "}
              {displayChar(spotlightLetter)}z
            </>
          ) : phase === "surging" ? (
            <>a mano es lento — ahora el libro entero</>
          ) : phase === "cascading" ? (
            <>
              {wallFamilies} familias · {(wallFamilies * VOCAB).toLocaleString("es-ES")} filas
            </>
          ) : hoveredRow ? (
            hoveredRow.seen ? (
              <>
                «{displayChar(hoveredRow.ctx[0])}
                {displayChar(hoveredRow.ctx[1])}» aparece {hoveredRow.total.toLocaleString("es-ES")}{" "}
                veces{rowPinned == null ? <> · se abre con un toque</> : null}
              </>
            ) : (
              <>
                «{displayChar(hoveredRow.ctx[0])}
                {displayChar(hoveredRow.ctx[1])}» no aparece nunca en el libro — fila vacía
              </>
            )
          ) : (
            <>
              la «{displayChar(spotlightLetter)}» aportó sus 27 filas ·{" "}
              {FIRST_LETTERS.length - wallFamilies} familias por contar
            </>
          )}
        </p>
      )}

      {/* THE OPEN ROW (build phase) — a clicked panel row, unfolded exactly like in the final map:
                the real follower distribution, numbers on hover. "Que te deje ver." */}
      <AnimatePresence>
        {panelRow && rowPinned != null && (
          <motion.div
            key={`panelrow-${panelRow.ctx}`}
            className="nw-rs__detail"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={reduce ? { duration: 0 } : { duration: 0.32, ease: STD }}
          >
            <div className="nw-rs__dhead">
              <span className="nw-rs__dctx">
                fila «
                <span className="nw-rs__dglyph">
                  {displayChar(panelRow.ctx[0])}
                  {displayChar(panelRow.ctx[1])}
                </span>
                » · lo que sigue
              </span>
              <span className="nw-rs__dtot">
                {panelRow.seen ? panelRow.total.toLocaleString("es-ES") : "0"}
              </span>
            </div>
            <FixedAlphabetRow
              cols={ALPHA}
              counts={panelRow.full}
              winner={panelWinner}
              hoverIdx={followHover ?? -1}
              onHover={setFollowHover}
              height={64}
              maxWidth={640}
            />
            <p className="nw-rs__dcap">
              {!panelRow.seen ? (
                <>esta fila existe en la tabla, pero el libro nunca la usa</>
              ) : followHover != null ? (
                <>
                  «{displayChar(panelRow.ctx[0])}
                  {displayChar(panelRow.ctx[1])}» + «{displayChar(ALPHA[followHover])}» ·{" "}
                  {panelRow.full[followHover].toLocaleString("es-ES")} veces
                </>
              ) : (
                <>
                  lo más visto tras «{displayChar(panelRow.ctx[0])}
                  {displayChar(panelRow.ctx[1])}»: «{displayChar(ALPHA[panelWinner])}» ·{" "}
                  {panelRow.full[panelWinner]?.toLocaleString("es-ES")} de{" "}
                  {panelRow.total.toLocaleString("es-ES")}
                </>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTROLS — count «a», add a couple more, then the whole alphabet at once. */}
      {(phase === "idle" || phase === "built") && (
        <div className="nw-rs__controls">
          {phase === "idle" && <PlayButton onClick={start}>contar la «a»</PlayButton>}

          {phase === "built" && builtFamilies < MANUAL_FAMILIES && (
            <PlayButton onClick={addOne}>
              añadir la «{FIRST_LETTERS[builtFamilies]}» · +27
            </PlayButton>
          )}

          {phase === "built" &&
            builtFamilies >= MANUAL_FAMILIES &&
            builtFamilies < FIRST_LETTERS.length && (
              <PlayButton onClick={completeAll}>
                completar el abecedario · +{(FIRST_LETTERS.length - builtFamilies) * VOCAB}
              </PlayButton>
            )}
        </div>
      )}

      {/* ═══ EXPLORE — the table you built, whole, in your hands ═══ */}
      <AnimatePresence>
        {phase === "explore" && (
          <motion.div
            key="explore"
            className="nw-rs__explorer"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.45, ease: STD }}
          >
            {/* THE FORMULA — the build, resolved. */}
            <div className="nw-rs__eq" aria-hidden>
              <span className="nw-rs__eqterm">27</span>
              <span className="nw-rs__eqop">×</span>
              <span className="nw-rs__eqterm">27</span>
              <span className="nw-rs__eqop">=</span>
              <span className="nw-rs__eqsum">
                <CountUpNumber
                  value={TOTAL}
                  durationMs={760}
                  delayMs={reduce ? 0 : 200}
                  format={(n) => Math.round(n).toLocaleString("es-ES")}
                />
              </span>
            </div>

            {/* READOUT — names the cell under the finger (or the pinned one). */}
            <div className="nw-rs__readout" aria-live="polite">
              {probe && probeRow && (
                <>
                  <span className="nw-rs__roctx">
                    «{displayChar(FIRST_LETTERS[probe.r])}
                    {displayChar(FIRST_LETTERS[probe.c])}»
                  </span>
                  <span className="nw-rs__roval">
                    {probeRow.seen ? (
                      <>{probeRow.total.toLocaleString("es-ES")} veces en el libro</>
                    ) : (
                      <>nunca aparece en el libro</>
                    )}
                  </span>
                </>
              )}
            </div>

            {/* THE MAP — all 729 rows, one cell each: rows = first letter, columns = second. */}
            <div className="nw-rs__map">
              <span aria-hidden />
              <div className="nw-rs__colax" aria-hidden>
                {FIRST_LETTERS.map((c, ci) => (
                  <span
                    key={c}
                    className="nw-rs__axl"
                    data-hi={(hover ?? pinned)?.c === ci ? "1" : "0"}
                  >
                    {displayChar(c)}
                  </span>
                ))}
              </div>
              <div className="nw-rs__rowax" aria-hidden>
                {FIRST_LETTERS.map((f, fi) => (
                  <span
                    key={f}
                    className="nw-rs__axl"
                    data-hi={(hover ?? pinned)?.r === fi ? "1" : "0"}
                  >
                    {displayChar(f)}
                  </span>
                ))}
              </div>
              <div
                className="nw-rs__cells"
                onMouseLeave={onMapLeave}
                onTouchMove={onMapTouchMove}
                aria-hidden
              >
                {FIRST_LETTERS.map((f, fi) => (
                  <MapBand
                    key={f}
                    fi={fi}
                    rows={families[fi]}
                    maxTotal={maxTotal}
                    hovCol={hover?.r === fi ? hover.c : -1}
                    pinCol={pinned?.r === fi ? pinned.c : -1}
                    onEnter={onCellEnter}
                    onPick={onCellPick}
                  />
                ))}
              </div>
            </div>
            <div className="nw-rs__legend">
              <p className="nw-rs__legendmain">
                cada cuadradito es <b>una fila</b> de la tabla — la de una pareja: su 1.ª letra a la
                izquierda, la 2.ª arriba
              </p>
              <p className="nw-rs__legendsub">
                el color: cuántas veces aparece esa pareja en el libro · al tocar una celda, su fila
                se abre debajo
              </p>
            </div>

            {/* THE OPEN ROW — the pinned cell, unfolded into its real follower distribution. */}
            {pinned && pinnedRow && (
              <div className="nw-rs__detail">
                <div className="nw-rs__dhead">
                  <span className="nw-rs__dctx">
                    fila «
                    <span className="nw-rs__dglyph">
                      {displayChar(FIRST_LETTERS[pinned.r])}
                      {displayChar(FIRST_LETTERS[pinned.c])}
                    </span>
                    » · lo que sigue
                  </span>
                  <span className="nw-rs__dtot">
                    {pinnedRow.seen ? pinnedRow.total.toLocaleString("es-ES") : "0"}
                  </span>
                </div>
                <FixedAlphabetRow
                  cols={ALPHA}
                  counts={pinnedRow.full}
                  winner={pinnedWinner}
                  hoverIdx={followHover ?? -1}
                  onHover={setFollowHover}
                  height={64}
                  maxWidth={640}
                />
                <p className="nw-rs__dcap">
                  {!pinnedRow.seen ? (
                    <>esta fila existe en la tabla, pero el libro nunca la usa</>
                  ) : followHover != null ? (
                    <>
                      «{displayChar(FIRST_LETTERS[pinned.r])}
                      {displayChar(FIRST_LETTERS[pinned.c])}» + «{displayChar(ALPHA[followHover])}»
                      · {pinnedRow.full[followHover].toLocaleString("es-ES")} veces
                    </>
                  ) : (
                    <>
                      lo más visto tras «{displayChar(FIRST_LETTERS[pinned.r])}
                      {displayChar(FIRST_LETTERS[pinned.c])}»: «{displayChar(ALPHA[pinnedWinner])}»
                      · {pinnedRow.full[pinnedWinner]?.toLocaleString("es-ES")} de{" "}
                      {pinnedRow.total.toLocaleString("es-ES")}
                    </>
                  )}
                </p>
              </div>
            )}

            <p className="nw-rs__honest">
              729 parejas posibles · {observed.toLocaleString("es-ES")} aparecen de verdad en
              Shakespeare
            </p>
            <GhostButton onClick={replay}>↻ otra vez</GhostButton>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
                .nw-rs {
                    width: 100%; max-width: 680px; margin: 0 auto;
                    display: flex; flex-direction: column; align-items: center; gap: 13px;
                    text-align: center;
                }

                /* HERO */
                .nw-rs__hero { display: flex; flex-direction: column; align-items: center; gap: 3px; }
                .nw-rs__count { font-size: clamp(38px, 7.5vw, 56px); font-weight: 700; line-height: 1; color: var(--ngram-accent-bright); letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
                .nw-rs__herolbl { font-family: ${MONO}; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--ngram-accent-2); }
                .nw-rs__reader { width: 100%; }

                /* STAGE — the one focal composition: family panel (left) + 729 wall (right). */
                .nw-rs__stage { display: grid; grid-template-columns: 1fr 200px; gap: 18px; align-items: stretch; width: 100%; }

                /* LEFT PANEL — a whole family, all 27 rows always visible. */
                .nw-rs__panel {
                    display: flex; flex-direction: column; gap: 7px;
                    padding: 11px 14px; border-radius: var(--ngram-r-md); text-align: left;
                    background: var(--ngram-surface);
                    border: 1px solid var(--ngram-rule-2);
                    box-shadow: 0 1px 3px -1px color-mix(in oklab, var(--ngram-bg-2) 80%, transparent),
                                0 8px 22px -12px color-mix(in oklab, var(--ngram-bg-2) 70%, transparent);
                }
                .nw-rs__panel[data-done="1"] {
                    border-color: color-mix(in oklab, var(--ngram-accent) 32%, var(--ngram-rule-2));
                }
                .nw-rs__panelhd { display: flex; align-items: center; gap: 9px; }
                .nw-rs__fam { font-family: ${MONO}; font-weight: 800; font-size: 15px; line-height: 1; color: var(--ngram-on-accent); background: var(--ngram-accent-bright); border-radius: 6px; padding: 4px 9px; min-width: 24px; text-align: center; }
                .nw-rs__panellbl { font-family: ${MONO}; font-size: 11px; letter-spacing: .04em; color: var(--ngram-muted); }
                .nw-rs__rows { display: flex; flex-direction: column; gap: 2px; }
                /* Empty rows stay faint but PRESENT — all 27 slots visible from the first frame. */
                .nw-rs__row { display: grid; grid-template-columns: 30px 1fr 44px; align-items: center; gap: 9px; height: 11px; opacity: 0.4; transform: translateX(-5px); transition: opacity .16s ease, transform .16s ease; }
                .nw-rs__row.is-on { opacity: 1; transform: none; }
                .nw-rs__row[data-poke="1"] { cursor: pointer; }
                .nw-rs__row.is-hov { background: color-mix(in oklab, var(--ngram-accent) 10%, transparent); border-radius: 3px; }
                .nw-rs__row.is-hov .nw-rs__ctx, .nw-rs__row.is-hov .nw-rs__rtot { color: var(--ngram-accent-ink); }
                .nw-rs__row.is-pin { background: color-mix(in oklab, var(--ngram-accent) 16%, transparent); border-radius: 3px; }
                .nw-rs__row.is-pin .nw-rs__ctx, .nw-rs__row.is-pin .nw-rs__rtot { color: var(--ngram-accent-bright); }
                .nw-rs__row.is-pin .nw-rs__strip { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-bright) 50%, transparent); }
                .nw-rs__ctx { font-family: ${MONO}; font-size: 11px; letter-spacing: .02em; text-align: left; color: var(--ngram-dim); white-space: nowrap; line-height: 1; }
                .nw-rs__ctx b { color: var(--ngram-accent-ink); font-weight: 700; }
                .nw-rs__strip { display: block; height: 8px; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--ngram-rule-2); transition: opacity .14s ease; }
                .nw-rs__row.is-on .nw-rs__strip { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 22%, transparent); }
                .nw-rs__row.is-fresh .nw-rs__strip { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent-bright) 55%, transparent), 0 0 9px -2px var(--ngram-accent-bright); }
                .nw-rs__rtot { font-family: ${MONO}; font-size: 10px; font-variant-numeric: tabular-nums; color: var(--ngram-dim); text-align: right; line-height: 1; }

                /* RIGHT WALL — 27 family BANDS stacking top→down into a 27×27 = 729 block. */
                .nw-rs__wall {
                    display: flex; flex-direction: column; gap: 8px; align-self: stretch;
                    padding: 12px; border-radius: var(--ngram-r-md);
                    background: var(--ngram-surface);
                    border: 1px solid var(--ngram-rule-2);
                    box-shadow: 0 1px 3px -1px color-mix(in oklab, var(--ngram-bg-2) 80%, transparent),
                                0 8px 22px -12px color-mix(in oklab, var(--ngram-bg-2) 70%, transparent);
                }
                .nw-rs__walllbl { display: flex; flex-direction: column; gap: 2px; }
                .nw-rs__wallnum { font-family: ${MONO}; font-variant-numeric: tabular-nums; font-weight: 800; font-size: 22px; line-height: 1; color: var(--ngram-accent-bright); }
                .nw-rs__wallden { font-size: 13px; font-weight: 600; color: var(--ngram-muted); }
                .nw-rs__wallcap { font-family: ${MONO}; font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ngram-accent-2); }
                /* the wall grid: 27 bands (rows) × 27 cells — fills the panel; solid at 729. */
                .nw-rs__grid { flex: 1 1 auto; display: grid; grid-template-rows: repeat(27, 1fr); gap: 1px; align-content: stretch; min-height: 0; }
                .nw-rs__band { display: grid; grid-template-columns: repeat(27, 1fr); gap: 1px; min-height: 0; }
                .nw-rs__cell { border-radius: 0.5px; box-shadow: inset 0 0 0 0.5px color-mix(in oklab, var(--ngram-accent) 5%, transparent); }
                .nw-rs__caption { font-family: ${MONO}; font-size: 11px; letter-spacing: .03em; color: var(--ngram-accent-2); margin: 0; min-height: 14px; }

                .nw-rs__controls { display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; }

                /* ═══ EXPLORER ═══ */
                .nw-rs__explorer {
                    width: 100%; display: flex; flex-direction: column; align-items: center; gap: 13px;
                }
                .nw-rs__eq { display: inline-flex; align-items: baseline; gap: 12px; font-family: ${MONO}; font-variant-numeric: tabular-nums; }
                .nw-rs__eqterm { font-size: clamp(20px, 3.4vw, 26px); font-weight: 700; color: var(--ngram-ink); }
                .nw-rs__eqop { font-size: clamp(16px, 2.6vw, 20px); color: var(--ngram-dim); }
                .nw-rs__eqsum { font-size: clamp(26px, 4.4vw, 36px); font-weight: 800; color: var(--ngram-accent-bright); }
                .nw-rs__readout { display: flex; align-items: baseline; justify-content: center; gap: 12px; font-family: ${MONO}; min-height: 22px; }
                .nw-rs__roctx { font-size: 18px; font-weight: 800; color: var(--ngram-accent-bright); letter-spacing: .02em; }
                .nw-rs__roval { font-size: 12.5px; color: var(--ngram-muted); font-variant-numeric: tabular-nums; }

                /* THE MAP — labelled 27×27, hero-sized. */
                .nw-rs__map {
                    display: grid; grid-template-columns: 16px 1fr; grid-template-rows: 12px 1fr;
                    gap: 4px; width: 100%;
                }
                .nw-rs__colax { grid-column: 2; display: grid; grid-template-columns: repeat(27, 1fr); gap: 1.5px; }
                .nw-rs__rowax { grid-row: 2; display: grid; grid-template-rows: repeat(27, 1fr); gap: 1.5px; }
                .nw-rs__cells { grid-column: 2; grid-row: 2; display: grid; grid-template-rows: repeat(27, 1fr); gap: 1.5px; }
                .nw-rs__crow { display: grid; grid-template-columns: repeat(27, 1fr); gap: 1.5px; }
                .nw-rs__c {
                    aspect-ratio: 1; border-radius: 2px; cursor: pointer;
                    transition: box-shadow .12s ease;
                }
                .nw-rs__c[data-hov="1"] {
                    box-shadow: inset 0 0 0 2px var(--ngram-accent-ink),
                                0 0 10px -2px var(--ngram-accent-bright);
                }
                .nw-rs__c[data-pin="1"] { box-shadow: inset 0 0 0 2px var(--ngram-accent-bright); }
                .nw-rs__axl {
                    font-family: ${MONO}; font-size: 8.5px; line-height: 1; color: var(--ngram-dim);
                    display: grid; place-items: center; transition: color .12s ease;
                }
                .nw-rs__axl[data-hi="1"] { color: var(--ngram-accent-bright); font-weight: 800; }

                /* LEGEND — names what the map is, right under it (serif sentence + mono fine print). */
                .nw-rs__legend { display: flex; flex-direction: column; gap: 4px; max-width: 56ch; }
                .nw-rs__legendmain { margin: 0; font-family: ${SERIF}; font-size: 15px; line-height: 1.45; color: var(--ngram-ink-2); }
                .nw-rs__legendmain b { color: var(--ngram-accent-ink); }
                .nw-rs__legendsub { margin: 0; font-family: ${MONO}; font-size: 10.5px; letter-spacing: .03em; color: var(--ngram-muted); }

                /* THE OPEN ROW */
                .nw-rs__detail {
                    width: 100%; display: flex; flex-direction: column; gap: 9px;
                    padding: 13px 16px 11px; border-radius: var(--ngram-r-md);
                    background: var(--ngram-surface);
                    border: 1px solid var(--ngram-rule-2);
                    box-shadow: 0 1px 3px -1px color-mix(in oklab, var(--ngram-bg-2) 80%, transparent),
                                0 8px 22px -12px color-mix(in oklab, var(--ngram-bg-2) 70%, transparent);
                }
                .nw-rs__dhead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
                .nw-rs__dctx { font-family: ${MONO}; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ngram-accent-2); }
                /* the context glyphs stay lowercase — they are the chapter's symbols, not label text */
                .nw-rs__dglyph { text-transform: none; font-weight: 800; color: var(--ngram-accent-bright); }
                .nw-rs__dtot { font-family: ${MONO}; font-size: 16px; font-weight: 700; color: var(--ngram-accent-bright); font-variant-numeric: tabular-nums; }
                .nw-rs__dcap { margin: 0; font-family: ${MONO}; font-size: 11px; letter-spacing: .02em; color: var(--ngram-muted); min-height: 14px; }
                .nw-rs__honest { margin: 0; font-family: ${MONO}; font-size: 11px; letter-spacing: .02em; color: var(--ngram-muted); text-align: center; }

                @media (max-width: 600px) {
                    .nw-rs__stage { grid-template-columns: 1fr; }
                    .nw-rs__wall { flex-direction: row; align-items: center; gap: 12px; }
                    .nw-rs__grid { height: 132px; flex: 1 1 auto; }
                    .nw-rs__axl { font-size: 7px; }
                    .nw-rs__map { grid-template-columns: 11px 1fr; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .nw-rs__row, .nw-rs__strip, .nw-rs__c { transition: none; }
                }
            `}</style>
    </div>
  );
});

export default RowSummer;
