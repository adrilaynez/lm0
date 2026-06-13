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
/** reading scan: a full passage sits STILL while the head sweeps it start→end,
    holds a beat at the end, then the next passage takes its place. */
const READ_CPS = 32;
const END_HOLD_MS = 1100;

const passageCache = new Map<string, string[]>();
function passagesFor(locale: "es" | "en"): string[] {
  const cached = passageCache.get(locale);
  if (cached) return cached;
  const raw = (locale === "en" ? corpusEn.raw : corpusEs.raw).replace(/\s+/g, " ").trim();
  const sentences = raw.match(/[^.;:!?]+[.;:!?]?/g) ?? [raw];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && (cur + s).length > 190) {
      out.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  const passages = out.filter((p) => p.length > 40);
  passageCache.set(locale, passages);
  return passages;
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
  const passageRef = useRef(0);
  const holdRef = useRef(0);

  useEffect(() => {
    const passages = passagesFor(locale);
    headRef.current = 0;
    passageRef.current = 0;
    holdRef.current = 0;
    const tick = (_time: number, deltaMs: number) => {
      const st = frameRef.current;
      if (!st || (st.beat !== "training" && st.beat !== "silence")) return;
      const dt = Math.min(50, deltaMs) / 1000;

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

      // the reading scan: the passage stays STILL; the head sweeps it start→end,
      // holds a beat at the end, then the next passage takes over.
      const p = passages[passageRef.current % passages.length] ?? "";
      headRef.current += dt * READ_CPS;
      let head: number;
      if (headRef.current >= p.length) {
        head = p.length - 1; // parked on the last char while we hold
        holdRef.current += deltaMs;
        if (holdRef.current >= END_HOLD_MS) {
          passageRef.current += 1;
          headRef.current = 0;
          holdRef.current = 0;
        }
      } else {
        head = Math.floor(headRef.current);
      }
      if (readRef.current) readRef.current.textContent = p.slice(0, head);
      if (curRef.current) curRef.current.textContent = p[head] ?? "";
      if (futureRef.current) futureRef.current.textContent = p.slice(head + 1);
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
