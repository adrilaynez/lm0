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
const WINDOW_CHARS = 230;

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
  const winStartRef = useRef(0);

  useEffect(() => {
    const raw = locale === "en" ? corpusEn.raw : corpusEs.raw;
    const tick = () => {
      const st = frameRef.current;
      if (!st || (st.beat !== "training" && st.beat !== "silence")) return;
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

      // the reader window follows the REAL read position (mapped onto the raw text)
      const rawPos = Math.min(raw.length - 1, Math.floor((feed.fedTo / feed.total) * raw.length));
      if (rawPos > winStartRef.current + WINDOW_CHARS - 60 || rawPos < winStartRef.current) {
        winStartRef.current = Math.max(0, rawPos - 36);
      }
      const ws = winStartRef.current;
      if (readRef.current) readRef.current.textContent = raw.slice(ws, rawPos);
      if (curRef.current) curRef.current.textContent = raw[rawPos] ?? "";
      if (futureRef.current)
        futureRef.current.textContent = raw.slice(rawPos + 1, ws + WINDOW_CHARS);
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
