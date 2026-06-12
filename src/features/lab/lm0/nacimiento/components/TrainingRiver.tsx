"use client";

/**
 * Beat 3 overlays — the honest % and the word counter.
 *
 * The displayed % is fedTo/total of the REAL model (feedToward advances actual
 * feedRange chunks per frame — the "throttle dirigido", never a timer; spec §4.6).
 * Text updates bypass React: textContent is written inside gsap.ticker.
 * The counter is real words while reading word-by-word; once the river
 * accelerates, a drama multiplier scales it toward the billions (theater the
 * copy never claims — spec §5).
 */

import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import { fmtInt } from "@/features/lab/data/trainableModel";
import { useI18n } from "@/i18n/context";

import { type BabbleLocale, feedToward, wordsRead } from "../engine/babbler";
import type { NacimientoState } from "../engine/progressMap";

const FEED_CHARS_PER_FRAME = 2600;
const DRAMA_START = 0.35;

interface TrainingRiverProps {
  active: boolean;
  locale: BabbleLocale;
  frameRef: React.RefObject<NacimientoState>;
}

export function TrainingRiver({ active, locale, frameRef }: TrainingRiverProps) {
  const { t } = useI18n();
  const readingRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      const st = frameRef.current;
      if (!st || (st.beat !== "training" && st.beat !== "silence")) return;
      const feed = feedToward(locale, st.bucket, FEED_CHARS_PER_FRAME);
      const pct = Math.min(100, Math.floor((feed.fedTo / feed.total) * 100));
      if (readingRef.current) {
        readingRef.current.textContent = t("lm0.training.reading", { pct });
      }
      if (barRef.current) barRef.current.style.width = `${pct}%`;
      if (counterRef.current) {
        const real = wordsRead(locale, feed.fedTo);
        const drama =
          st.beat === "training" && st.local > DRAMA_START
            ? Math.pow(10, ((st.local - DRAMA_START) / (1 - DRAMA_START)) * 5.3)
            : 1;
        const n = Math.floor(real * drama);
        counterRef.current.textContent = t("lm0.training.words", { n: fmtInt(n) });
        const mag = Math.log10(n + 1);
        counterRef.current.style.fontSize = `${Math.min(1.5, 0.78 + Math.max(0, mag - 2) * 0.085).toFixed(3)}rem`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [locale, frameRef, t]);

  return (
    <section className={`lm0-beat${active ? " is-active" : ""}`}>
      <div className="lm0-reading lm0-ui-font">
        <span ref={readingRef} />
        <span className="lm0-reading-bar">
          <span ref={barRef} />
        </span>
      </div>
      <div ref={counterRef} className="lm0-counter lm0-machine-font" />
    </section>
  );
}
