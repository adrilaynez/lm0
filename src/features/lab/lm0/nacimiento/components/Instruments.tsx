"use client";

/**
 * Instruments — the live, honest readings of the training beat, all updated INSIDE
 * one gsap.ticker (per-frame values never pass through React state):
 *
 *  · a thin "vitrine" frame (.lm0-tframe) with FOUR DRY corner readouts — instrument
 *    under glass, each UNIQUE (never duplicated with the CRT): tl lm0·n-grama ·
 *    tr corpus · bl alphabet · br temperature (real, drops as it learns).
 *  · the letters odometer (centred just under the BIG machine).
 *  · the CORPUS FEED-TAPE under the machine: a legible window of the REAL corpus that
 *    the reading head crosses GRANULARLY with scroll (a small gesture = a few words,
 *    never a whole phrase). NOT karaoke/teleprompter: real flowing text, the active
 *    word lit phosphor-green, future text barely-there, the ribbon rising like a tape.
 *  · one instrumental foot line: "k = N · aprendiendo {stage} ━●── {pct}% leído ·
 *    queda el {rest}%".
 *
 * HONESTY (futuro visible ≠ futuro leído): the tape may show un-read corpus ahead,
 * very dim, but never AS read. The read text, the counter and the % follow the REAL
 * ingested corpus prefix (feedToward advances the real model every frame). Never a timer.
 */

import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import { fmtInt } from "@/features/lab/data/trainableModel";
import { useI18n } from "@/i18n/context";

import { corpusEn } from "../data/corpus.en";
import { corpusEs } from "../data/corpus.es";
import { BUCKETS, LADDER } from "../data/script";
import { type BabbleLocale, feedToward, streamFor } from "../engine/babbler";
import { clamp01, type NacimientoState, smooth01 } from "../engine/progressMap";

const FEED_CHARS_PER_FRAME = 2600;
/** The feed-tape: a legible window of the REAL corpus. TAPE_CHARS = how much of the
    book the reading head crosses across the whole training beat — kept LOW + tunable so
    a small gesture moves a few words, never a whole phrase (granular, causal). */
const TAPE_CHARS = 1800;
/** always keep some un-read (future) corpus past the head, so the ribbon never empties. */
const TAPE_TAIL = 260;

const excerptCache = new Map<string, string>();
/** A contiguous slice of the REAL corpus (real punctuation + case, single spaces) — the
    legible book the tape shows, NOT the folded lowercase training stream. Memoized. */
function excerptFor(locale: "es" | "en"): string {
  const cached = excerptCache.get(locale);
  if (cached) return cached;
  const raw = (locale === "en" ? corpusEn.raw : corpusEs.raw).replace(/\s+/g, " ").trim();
  const out = raw.slice(0, TAPE_CHARS + TAPE_TAIL + 600);
  excerptCache.set(locale, out);
  return out;
}

interface InstrumentsProps {
  locale: BabbleLocale;
  frameRef: React.RefObject<NacimientoState>;
}

export function Instruments({ locale, frameRef }: InstrumentsProps) {
  const { t } = useI18n();
  // tape
  const flowRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);
  const curRef = useRef<HTMLSpanElement>(null);
  const futureRef = useRef<HTMLSpanElement>(null);
  // readouts
  const odoRef = useRef<HTMLSpanElement>(null);
  const tempRef = useRef<HTMLSpanElement>(null);
  const botLeftRef = useRef<HTMLSpanElement>(null);
  const botRightRef = useRef<HTMLSpanElement>(null);
  const botFillRef = useRef<HTMLDivElement>(null);
  // change-guards (so we only touch the DOM when a value actually moves)
  const pctRef = useRef(-1);
  const bRef = useRef(-1);
  const wsRef = useRef(-1);

  useEffect(() => {
    const excerpt = excerptFor(locale);
    const streamTotal = streamFor(locale).length;
    const lastB = BUCKETS - 1;

    const tick = () => {
      const st = frameRef.current;
      if (!st || (st.beat !== "training" && st.beat !== "silence")) return;

      // keep feeding the REAL model so the CRT take stays honest (motor intact)
      feedToward(locale, st.bucket, FEED_CHARS_PER_FRAME);

      const b = Math.min(lastB, Math.max(0, st.bucket));
      const rung = LADDER[b];

      // ── ONE continuous reading progress drives the tape + the honest counters.
      //    Eased (smooth01) so the start is tentative and it plateaus at the ceiling —
      //    the emotional arc. In silence it is parked at 1 (training is done). ──
      const read01 = st.beat === "silence" ? 1 : smooth01(clamp01(st.local));
      // HONEST: letters/% are the REAL corpus prefix the head has reached (≤ what the
      // model actually ingested for this bucket — never a timer, never over-claiming).
      const letters = Math.round(read01 * streamTotal);
      const pct = Math.min(100, Math.floor(read01 * 100));

      if (odoRef.current)
        odoRef.current.textContent = t("lm0.training.letters", { n: fmtInt(letters) });

      // foot line — only rewrite labels when the % actually moves
      if (pct !== pctRef.current) {
        pctRef.current = pct;
        if (botFillRef.current) botFillRef.current.style.width = `${pct}%`;
        if (botRightRef.current)
          botRightRef.current.textContent = t("lm0.training.barProgress", { pct, rest: 100 - pct });
      }
      // k + stage (foot) and temperature (BR corner) — change with the bucket/escalón
      if (b !== bRef.current) {
        bRef.current = b;
        if (botLeftRef.current)
          botLeftRef.current.textContent = t("lm0.training.barLeftK", {
            k: rung.k,
            stage: t(`lm0.training.stages.${rung.stage}`),
          });
        if (tempRef.current)
          tempRef.current.textContent = t("lm0.training.teleTemp", {
            t: rung.temperature.toFixed(1),
          });
      }

      // ── the feed-tape: the head advances granularly with scroll ──
      const head = Math.min(
        excerpt.length - TAPE_TAIL,
        Math.max(0, Math.floor(read01 * TAPE_CHARS)),
      );
      // the word boundaries around the head (the active word is lit, inline — NOT isolated)
      let ws = head;
      while (ws > 0 && excerpt[ws - 1] !== " ") ws--;
      let we = head;
      while (we < excerpt.length && excerpt[we] !== " ") we++;
      if (ws !== wsRef.current) {
        wsRef.current = ws;
        if (readRef.current) readRef.current.textContent = excerpt.slice(0, ws);
        if (curRef.current) curRef.current.textContent = excerpt.slice(ws, we);
        if (futureRef.current) futureRef.current.textContent = excerpt.slice(we);
        // scroll the ribbon so the active word's line sits on the window's 2nd line
        // (offsetTop/offsetHeight read only on a word change — not per frame). The CSS
        // transition smooths the line-to-line rise, so it reads as a tape, not a jump.
        const cur = curRef.current;
        const flow = flowRef.current;
        if (cur && flow) {
          const lh = cur.offsetHeight || 0;
          const y = cur.offsetTop;
          flow.style.transform = `translateY(${-(y - lh)}px)`;
        }
      }
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [locale, frameRef, t]);

  return (
    <>
      {/* the vitrine frame: bounds the machine + odometer + tape; the corners sit on it */}
      <div className="lm0-tframe" aria-hidden="true" />

      {/* four DRY corner readouts — each unique, instrument under glass */}
      <div className="lm0-tele-c lm0-tele-tl" aria-hidden="true">
        {t("lm0.training.teleTL")}
      </div>
      <div className="lm0-tele-c lm0-tele-tr" aria-hidden="true">
        {t("lm0.training.teleCorpus")}
      </div>
      <div className="lm0-tele-c lm0-tele-bl" aria-hidden="true">
        {t("lm0.training.teleAlphabet")}
      </div>
      <div className="lm0-tele-c lm0-tele-br" aria-hidden="true">
        <span ref={tempRef}>{t("lm0.training.teleTemp", { t: "1.3" })}</span>
      </div>

      {/* "N letras leídas" — centred just under the big machine */}
      <div className="lm0-odo-line" aria-hidden="true">
        <span ref={odoRef} className="lm0-odometer" />
      </div>

      {/* the corpus feed-tape: a legible window of the real book, rising into the machine */}
      <div className="lm0-tape" aria-hidden="true">
        <div className="lm0-ui lm0-tape-caption">
          <span className="lm0-dot" aria-hidden="true" />
          {t("lm0.training.tapeTag")}
        </div>
        <div className="lm0-tape-window">
          <div ref={flowRef} className="lm0-tape-flow">
            <span ref={readRef} className="r-read" />
            <span ref={curRef} className="r-cur" />
            <span ref={futureRef} className="r-future" />
          </div>
        </div>
      </div>

      {/* one instrumental foot line: k · learning {stage} ━●── {pct}% read · {rest}% to go */}
      <div className="lm0-botline" aria-hidden="true">
        <span ref={botLeftRef} className="lm0-botline-lab" />
        <div className="lm0-botline-track">
          <div ref={botFillRef} className="lm0-botline-fill" />
        </div>
        <span ref={botRightRef} className="lm0-botline-lab lm0-botline-r" />
      </div>
    </>
  );
}
