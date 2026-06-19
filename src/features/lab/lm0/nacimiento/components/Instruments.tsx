"use client";

/**
 * Instruments — the live, honest readings of the training beat, all updated INSIDE one
 * gsap.ticker (per-frame values never pass through React state):
 *
 *  · a thin "vitrine" frame (.lm0-tframe) with FOUR DRY corner readouts (instrument under
 *    glass): tl lm0·n-grama · tr corpus · bl alphabet · br = how much corpus is LEFT — the
 *    ONLY moving number, faint + peripheral (never a dashboard).
 *  · the CORPUS FEED-TAPE under the machine: a legible window of the REAL corpus that the
 *    reading head crosses GRANULARLY with scroll — read text in ink, the active word lit
 *    phosphor-green, future text barely-there, the ribbon rising like a tape.
 *
 * HONESTY: the read text + the % follow the REAL ingested corpus prefix (feedToward advances
 * the real model every frame). Never a timer. The big letters odometer and the foot progress
 * bar were removed — they pulled the eye to a number instead of the screen + the corpus.
 */

import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import { useI18n } from "@/i18n/context";

import { corpusEn } from "../data/corpus.en";
import { corpusEs } from "../data/corpus.es";
import { LADDER } from "../data/script";
import { type BabbleLocale, feedToward, streamFor } from "../engine/babbler";
import { clamp01, type NacimientoState, smooth01 } from "../engine/progressMap";

const FEED_CHARS_PER_FRAME = 2600;
/** The feed-tape: a legible window of the REAL corpus. TAPE_CHARS = how much of the book the
    reading head crosses across the whole training beat — kept LOW + tunable so a small gesture
    moves a few words, never a whole phrase (granular, causal). */
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
  // the bottom reading bar: fill, % read, letters read
  const fillRef = useRef<HTMLDivElement>(null);
  const pctTextRef = useRef<HTMLSpanElement>(null);
  const lettersRef = useRef<HTMLSpanElement>(null);
  // the curious-reader corners: k (memory) + temperature, live with the ladder rung
  const kRef = useRef<HTMLSpanElement>(null);
  const tempRef = useRef<HTMLSpanElement>(null);
  // change-guards (so we only touch the DOM when a value actually moves)
  const pctRef = useRef(-1);
  const wsRef = useRef(-1);
  const bucketRef = useRef(-1);

  useEffect(() => {
    const excerpt = excerptFor(locale);
    // total LETTERS (non-space chars) in the folded corpus — the readout climbs toward this
    const stream = streamFor(locale);
    let lettersTotal = 0;
    for (let i = 0; i < stream.length; i++) if (stream[i] !== " ") lettersTotal++;

    const tick = () => {
      const st = frameRef.current;
      if (!st || (st.beat !== "training" && st.beat !== "silence")) return;

      // keep feeding the REAL model so the CRT take stays honest (motor intact)
      feedToward(locale, st.bucket, FEED_CHARS_PER_FRAME);

      // ── ONE continuous reading progress drives the tape + the bar + the words count.
      //    Keyed to readLocal (the READING window, not the whole beat) so it opens at 0 on the
      //    first sentence of Don Quijote and plateaus at 1; eased so the start is tentative. ──
      const read01 = smooth01(clamp01(st.readLocal));
      const pct = Math.min(100, Math.floor(read01 * 100));

      // the bottom reading bar: fill + "% leído" + the real letters-read count (climbs into
      // the thousands → honest SCALE, in lockstep with the bar). DOM touched only on change.
      if (pct !== pctRef.current) {
        pctRef.current = pct;
        if (fillRef.current) fillRef.current.style.width = `${pct}%`;
        if (pctTextRef.current) pctTextRef.current.textContent = t("lm0.training.pctRead", { pct });
        if (lettersRef.current) {
          const n = Math.floor(read01 * lettersTotal).toLocaleString(
            locale === "es" ? "es-ES" : "en-US",
          );
          lettersRef.current.textContent = t("lm0.training.letters", { n });
        }
      }

      // the curious-reader corners — k (memory) + temperature, change only when the rung does
      if (st.bucket !== bucketRef.current) {
        bucketRef.current = st.bucket;
        const rung = LADDER[Math.max(0, Math.min(LADDER.length - 1, st.bucket))];
        if (kRef.current)
          kRef.current.textContent = t("lm0.training.barLeftK", {
            k: rung.k,
            stage: t(`lm0.training.stages.${rung.stage}`),
          });
        if (tempRef.current)
          tempRef.current.textContent = t("lm0.training.teleTemp", {
            t: rung.temperature.toFixed(2),
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
      {/* the vitrine frame: bounds the machine + tape; the corners sit on it */}
      <div className="lm0-tframe" aria-hidden="true" />

      {/* four DRY corner readouts — instrument under glass. TL/TR name the experiment;
          BL/BR expose k (memory) + temperature for the curious, live with the rung. */}
      <div className="lm0-tele-c lm0-tele-tl" aria-hidden="true">
        {t("lm0.training.teleTL")}
      </div>
      <div className="lm0-tele-c lm0-tele-tr" aria-hidden="true">
        {t("lm0.training.teleCorpus")}
      </div>
      <div className="lm0-tele-c lm0-tele-bl" aria-hidden="true">
        <span ref={kRef}>
          {t("lm0.training.barLeftK", {
            k: LADDER[0].k,
            stage: t(`lm0.training.stages.${LADDER[0].stage}`),
          })}
        </span>
      </div>
      <div className="lm0-tele-c lm0-tele-br" aria-hidden="true">
        <span ref={tempRef}>
          {t("lm0.training.teleTemp", { t: LADDER[0].temperature.toFixed(2) })}
        </span>
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

      {/* the bottom reading bar — a real, legible progress bar (% read on the left) with the
          letters-read count on the right. Replaces the old documentary chrome hairline. */}
      <div className="lm0-readbar" aria-hidden="true">
        <div className="lm0-readbar-left">
          <div className="lm0-readbar-track">
            <div ref={fillRef} className="lm0-readbar-fill" />
          </div>
          <span ref={pctTextRef} className="lm0-readbar-pct">
            {t("lm0.training.pctRead", { pct: 0 })}
          </span>
        </div>
        <span ref={lettersRef} className="lm0-readbar-words">
          {t("lm0.training.letters", { n: "0" })}
        </span>
      </div>
    </>
  );
}
