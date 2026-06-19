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

import { HeroQuestion } from "./HeroQuestion";
import { TypedLine } from "./TypedLine";

const BOOT_KEYS = ["l1", "l2", "l3", "l4", "l5", "l6"] as const;
const BOOT_CPS = 38;

interface MachineFigureProps {
  beat: Beat;
  bucket: number;
  /** the corpus is up and the model is ingesting it — only now does the machine babble REAL
      numbered attempts. false through hero + the bridge (it keeps failing/erasing instead). */
  reading: boolean;
  locale: BabbleLocale;
  booted: boolean;
  onBootDone: () => void;
}

export function MachineFigure({
  beat,
  bucket,
  reading,
  locale,
  booted,
  onBootDone,
}: MachineFigureProps) {
  const { t } = useI18n();
  const [bootChars, setBootChars] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"type" | "stare" | "erase">("type");
  const [erased, setErased] = useState(0);
  // the just-erased attempt, kept as a burned-in phosphor ghost so a FROZEN frame
  // (mid-erase, the inter-attempt gap, the first chars of a new type) still shows
  // "something just happened". Seeded on boot so the screen is never an empty caret.
  const [prevText, setPrevText] = useState("");
  // the headline waits a beat AFTER the boot states the failure, so it reads as the
  // conclusion of the machine's failed attempt — not an independent sign.
  const [titleArmed, setTitleArmed] = useState(false);

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

  // ── after the boot states "la máquina no sabe hablar": seed a burned-in ghost of
  //    an aborted attempt (first frame is never empty) and bloom the headline a beat
  //    later, so the title lands as the CONCLUSION of the failure ──
  useEffect(() => {
    if (!booted) return;
    setPrevText((prev) => prev || brokenSample(locale, 0).slice(0, 4));
    const id = window.setTimeout(() => setTitleArmed(true), 500);
    return () => window.clearTimeout(id);
  }, [booted, locale]);

  // ── broken cycle (hero) ──
  // a LONGER broken attempt: the machine strains and produces a real run of morralla
  // (a line+ of garbage), HOLDS it on screen so the failure is felt, then erases and
  // tries again. It still must not read as a hacker terminal — it's struggle, not output.
  const morralla = brokenSample(locale, attempt).slice(0, 34);
  useEffect(() => {
    // the machine keeps failing through the hero AND the bridge — it only stops the broken
    // cycle once reading begins (the corpus is up), so training never precedes Don Quijote.
    if (!booted || reading) return;
    if (phase === "stare") {
      const id = window.setTimeout(() => {
        setPhase("erase");
        setErased(0);
      }, 2400); // HOLD the failed line on screen — let the silence sit before erasing
      return () => window.clearTimeout(id);
    }
    if (phase === "erase") {
      const id = window.setInterval(() => {
        setErased((e) => {
          if (e + 2 >= morralla.length) {
            window.clearInterval(id);
            window.setTimeout(() => {
              setPrevText(morralla); // the erased attempt lingers as a phosphor ghost
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
  }, [phase, booted, reading, morralla]);

  const training = beat === "training";
  const silence = beat === "silence";
  // the machine only shows REAL numbered attempts once reading has begun (corpus is up).
  // before that — hero + bridge — it shows the broken cycle, so training never precedes the book.
  const showTakes = reading && (training || silence);
  const heldBucket = silence ? BUCKETS - 1 : bucket;
  const take = showTakes ? generate(locale, heldBucket) : null;
  const attemptNo = 13 + heldBucket * 4;

  return (
    <>
      {/* the editorial hero text — a LEFT column (statement + support line + cue). It lives
          OUTSIDE .lm0-machine so the machine can slide right→centre independently, and is
          rendered through hero AND the early training beat so --lm0-hero-text can fade it
          out on scroll (the beat flips to "training" at raw 0.10, before the fade ends). */}
      {(beat === "hero" || beat === "training") && (
        <div className="lm0-herocol">
          <div className="lm0-herohead">
            <h1
              className="lm0-display"
              aria-label={`${t("lm0.hero.question")} ${t("lm0.hero.questionAccent")} ${t("lm0.hero.questionTail")}`}
            >
              <HeroQuestion
                lead={t("lm0.hero.question")}
                accent={t("lm0.hero.questionAccent")}
                tail={t("lm0.hero.questionTail")}
                play={titleArmed}
              />
            </h1>
            <div className="lm0-headline-sub">{t("lm0.hero.label")}</div>
          </div>
          <div className="lm0-herofoot">
            <div className="lm0-scrollcue" aria-hidden="true">
              <span>{t("lm0.hero.hint")}</span>
              <span className="lm0-cue-rule" />
            </div>
          </div>
        </div>
      )}
      <div className="lm0-machine" aria-hidden={beat === "voice" || beat === "eras"}>
        {/* the machine is now a single finished PLATE (machine + grounded shadow + green
          glow baked in, edges feathered into the room) — it moves/scales as ONE unit, so the
          shadow always travels with it. The live screen text is overlaid on its glass below. */}
        <div className="lm0-screenframe">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lm0/machine-plate-final.webp"
            alt=""
            className="lm0-machine-img"
            draggable={false}
          />
          <div className="lm0-screenbox">
            <div className="lm0-screen-content">
              {booted && !showTakes && prevText && (
                <span className="lm0-screen-ghost" key={attempt} aria-hidden="true">
                  {/* only a PARTIAL tail of the erased attempt — optical persistence, not
                    readable content (the CSS keeps it near-invisible) */}
                  {prevText.slice(-5)}
                </span>
              )}
              {!booted ? (
                <BootLines lines={bootLines} chars={bootChars} />
              ) : showTakes ? (
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
                  active={!reading}
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
        </div>
      </div>
      {/* the silence verdict — stage-absolute (OUTSIDE .lm0-machine) so it stays
          readable while the machine shrinks to a small specimen during training */}
      <div className="lm0-wall lm0-ui">{t("lm0.silence.wall")}</div>
    </>
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
