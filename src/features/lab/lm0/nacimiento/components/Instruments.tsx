"use client";

/**
 * Instruments — the two honest live readings of the training beat, updated
 * inside gsap.ticker (per-frame values never pass through React):
 *
 *  · the corpus thermometer (left edge): one hairline + a green fill + the %
 *    travelling with its tip — fed by REAL feedRange chunks (never a timer).
 *  · the corpus reader (under the machine): the ParchmentReader gesture from
 *    the bigram chapter — the ACTUAL slice of the book around the real read
 *    position, head highlighted, read text fixed in ink, future text ghosted.
 *  · the words odometer (under the machine, by id — owned by MachineFigure).
 */

import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import { fmtInt } from "@/features/lab/data/trainableModel";
import { useI18n } from "@/i18n/context";

import { corpusEn } from "../data/corpus.en";
import { corpusEs } from "../data/corpus.es";
import { type BabbleLocale, feedToward, wordsRead } from "../engine/babbler";
import type { NacimientoState } from "../engine/progressMap";

const FEED_CHARS_PER_FRAME = 2600;
/** Two independent motions, like a real terminal:
    · the head sweeps the visible block BY ITSELF (time-based, loops) — "se mueve solo".
    · SCROLL chooses which chunk of the corpus is shown (the static multi-line block);
      sit still and the block stays put, scroll and the text changes.  */
const READ_SPAN = 2400; // chars of the corpus the scroll travels across the whole training
const WINDOW_CHARS = 108; // the static block (~3 lines)
const HEAD_CPS = 28; // the self-moving head's sweep speed

const streamCache = new Map<string, string>();
function streamText(locale: "es" | "en"): string {
  const cached = streamCache.get(locale);
  if (cached) return cached;
  const raw = (locale === "en" ? corpusEn.raw : corpusEs.raw).replace(/\s+/g, " ").trim();
  streamCache.set(locale, raw);
  return raw;
}

interface InstrumentsProps {
  locale: BabbleLocale;
  frameRef: React.RefObject<NacimientoState>;
}

export function Instruments({ locale, frameRef }: InstrumentsProps) {
  const { t } = useI18n();
  const fillRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);
  const curRef = useRef<HTMLSpanElement>(null);
  const futureRef = useRef<HTMLSpanElement>(null);
  const headRef = useRef(0);

  useEffect(() => {
    const stream = streamText(locale);
    const span = Math.max(1, Math.min(READ_SPAN, stream.length - WINDOW_CHARS - 1));
    const tick = (_time: number, deltaMs: number) => {
      const st = frameRef.current;
      if (!st || (st.beat !== "training" && st.beat !== "silence")) return;

      // % and word count stay tied to the REAL feeding (honest)
      const feed = feedToward(locale, st.bucket, FEED_CHARS_PER_FRAME);
      const pct = Math.min(100, Math.floor((feed.fedTo / feed.total) * 100));
      if (fillRef.current) fillRef.current.style.height = `${pct}%`;
      if (tipRef.current) {
        tipRef.current.style.bottom = `${pct}%`;
        tipRef.current.textContent = `${pct}%`;
      }
      const odo = document.getElementById("lm0-odo");
      if (odo)
        odo.textContent = t("lm0.training.words", { n: fmtInt(wordsRead(locale, feed.fedTo)) });

      // SCROLL picks the static block (sit still → fixed; scroll → the text changes)
      const local = st.beat === "silence" ? 1 : st.local;
      const blockStart = Math.floor(local * span);
      // the head sweeps that block BY ITSELF on a time loop ("se mueve solo")
      headRef.current += (Math.min(50, deltaMs) / 1000) * HEAD_CPS;
      if (headRef.current >= WINDOW_CHARS) headRef.current -= WINDOW_CHARS;
      const h = Math.floor(headRef.current);
      if (readRef.current) readRef.current.textContent = stream.slice(blockStart, blockStart + h);
      if (curRef.current) curRef.current.textContent = stream[blockStart + h] ?? "";
      if (futureRef.current)
        futureRef.current.textContent = stream.slice(blockStart + h + 1, blockStart + WINDOW_CHARS);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [locale, frameRef, t]);

  return (
    <>
      <div className="lm0-thermo" aria-hidden="true">
        <div className="lm0-ui lm0-thermo-caption">{t("lm0.training.corpus")}</div>
        <div className="lm0-thermo-track">
          <div ref={fillRef} className="lm0-thermo-fill" />
          <div ref={tipRef} className="lm0-mono lm0-thermo-tip">
            0%
          </div>
        </div>
      </div>
      <div className="lm0-reader">
        <div className="lm0-ui lm0-reader-caption">
          <span className="lm0-dot" aria-hidden="true" />
          {t("lm0.training.reading")}
        </div>
        <div className="lm0-mono lm0-reader-text" aria-hidden="true">
          <span ref={readRef} className="r-read" />
          <span ref={curRef} className="r-cur" />
          <span ref={futureRef} className="r-future" />
        </div>
      </div>
    </>
  );
}
