"use client";

/**
 * MachineFigure — the protagonist: the premium CRT render (public/lm0/maquina.webp)
 * with a LIVE phosphor screen overlaid on its glass.
 *
 * Screen contents by phase:
 *  · boot (on mount, time-based, once): the Zajno-style startup lines — real specs
 *    of the model — ending on "la máquina no sabe hablar".
 *  · hero: the broken cycle — real untrained samples typed, stared at, erased.
 *  · training: numbered attempts ("intento nº N — así habla ahora:") — REAL takes
 *    from the ladder, longer as the model learns.
 *  · silence: the best memorized take, held; the wall line appears under the machine.
 */

import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/context";

import { BUCKETS } from "../data/script";
import { type BabbleLocale, brokenSample, generate } from "../engine/babbler";
import type { Beat } from "../engine/progressMap";

import { TypedLine } from "./TypedLine";

const BOOT_KEYS = ["l1", "l2", "l3", "l4", "l5", "l6"] as const;
const BOOT_CPS = 38;

interface MachineFigureProps {
  beat: Beat;
  bucket: number;
  locale: BabbleLocale;
  booted: boolean;
  onBootDone: () => void;
}

export function MachineFigure({ beat, bucket, locale, booted, onBootDone }: MachineFigureProps) {
  const { t } = useI18n();
  const [bootChars, setBootChars] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"type" | "stare" | "erase">("type");
  const [erased, setErased] = useState(0);

  const bootLines = BOOT_KEYS.map((k) => t(`lm0.boot.${k}`));
  const bootTotal = bootLines.reduce((a, l) => a + l.length, 0);

  // ── boot (time-based, plays once on mount) ──
  useEffect(() => {
    if (booted) return;
    let raf = 0;
    let start = -1;
    const tick = (ts: number) => {
      if (start < 0) start = ts;
      const n = Math.floor(((ts - start) / 1000) * BOOT_CPS);
      setBootChars(n);
      if (n < bootTotal + 14) raf = requestAnimationFrame(tick);
      else onBootDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted]);

  // ── broken cycle (hero) ──
  const morralla = brokenSample(locale, attempt);
  useEffect(() => {
    if (!booted || beat !== "hero") return;
    if (phase === "stare") {
      const id = window.setTimeout(() => {
        setPhase("erase");
        setErased(0);
      }, 700);
      return () => window.clearTimeout(id);
    }
    if (phase === "erase") {
      const id = window.setInterval(() => {
        setErased((e) => {
          if (e + 2 >= morralla.length) {
            window.clearInterval(id);
            window.setTimeout(() => {
              setAttempt((a) => a + 1);
              setPhase("type");
            }, 360);
            return morralla.length;
          }
          return e + 2;
        });
      }, 26);
      return () => window.clearInterval(id);
    }
  }, [phase, booted, beat, morralla.length]);

  const training = beat === "training";
  const silence = beat === "silence";
  const heldBucket = silence ? BUCKETS - 1 : bucket;
  const take = training || silence ? generate(locale, heldBucket) : null;
  const attemptNo = 13 + heldBucket * 4;

  return (
    <div className="lm0-machine" aria-hidden={beat === "voice" || beat === "eras"}>
      <div className="lm0-screen-glow" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/lm0/maquina.webp" alt="" className="lm0-machine-img" draggable={false} />
      <div className="lm0-screenbox">
        <div className="lm0-screen-content">
          {!booted ? (
            <BootLines lines={bootLines} chars={bootChars} />
          ) : training || silence ? (
            <>
              <span className="lm0-attempt-label">
                {t("lm0.training.attempt", { n: attemptNo })}
              </span>
              {silence ? (
                <span aria-label={take?.text}>
                  <span aria-hidden="true">{take?.text}</span>
                  <span className="lm0-caret" data-blink="true" aria-hidden="true" />
                </span>
              ) : (
                <TypedLine
                  key={`${locale}-${heldBucket}`}
                  text={take?.text ?? ""}
                  active
                  cps={take && take.stage === "frequencies" ? 30 : 48}
                  cadence={take && take.stage === "frequencies" ? "stutter" : "human"}
                />
              )}
            </>
          ) : phase === "type" ? (
            <TypedLine
              key={`${locale}-${attempt}`}
              text={morralla}
              active={beat === "hero"}
              cps={26}
              cadence="stutter"
              onDone={() => setPhase("stare")}
            />
          ) : (
            <span aria-hidden="true">
              {morralla.slice(0, Math.max(0, morralla.length - erased))}
              <span className="lm0-caret" data-blink="false" />
            </span>
          )}
        </div>
      </div>
      <div className="lm0-under">
        <div className="lm0-odometer" id="lm0-odo" />
      </div>
      <div className="lm0-wall lm0-ui">{t("lm0.silence.wall")}</div>
    </div>
  );
}

function BootLines({ lines, chars }: { lines: string[]; chars: number }) {
  const offsets: number[] = [];
  lines.reduce((acc, line) => {
    offsets.push(acc);
    return acc + line.length;
  }, 0);
  return (
    <>
      {lines.map((line, i) => {
        const take = Math.max(0, Math.min(line.length, chars - offsets[i]));
        if (take <= 0) return null;
        const typing = take < line.length;
        return (
          <span key={i} className="lm0-bootline" data-final={i === lines.length - 1}>
            {line.slice(0, take)}
            {typing && <span className="lm0-caret" data-blink="false" aria-hidden="true" />}
          </span>
        );
      })}
    </>
  );
}
