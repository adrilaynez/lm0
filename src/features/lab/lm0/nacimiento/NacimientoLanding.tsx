"use client";

/**
 * NacimientoLanding — root of the LM0 v3 landing (frozen design 2026-06-13).
 *
 * One tall wrapper (720vh) + a sticky 100vh stage (CSS pins, no GSAP pin).
 * One scroll spine → one pure progressMap; per-frame values go to CSS vars,
 * discrete state to the stage store. Five beats inside the stage
 * (hero · training · silence · voice · eras) + the finale in normal flow.
 *
 * The boot plays once on mount (time-based, Zajno-style) inside the machine's
 * screen; the title fades in when it ends. Reduced motion mounts a static page.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

import { ChromeBar } from "./components/ChromeBar";
import { ErasPanel } from "./components/ErasPanel";
import { FinaleSection } from "./components/FinaleSection";
import { HeroTitle } from "./components/HeroTitle";
import { Instruments } from "./components/Instruments";
import { MachineFigure } from "./components/MachineFigure";
import { ScreenHack } from "./components/ScreenHack";
import { VoiceMonologue } from "./components/VoiceMonologue";
import { BUCKETS } from "./data/script";
import { type BabbleLocale, brokenSample } from "./engine/babbler";
import {
  clamp01,
  type NacimientoState,
  remapProgress,
  SEGMENTS,
  smooth01,
} from "./engine/progressMap";
import { initScrollSpine, type ScrollSpine } from "./engine/scrollSpine";
import { createStageStore, useStage } from "./engine/stageStore";

const NUDGE_AFTER_MS = 9000;

export function NacimientoLanding() {
  const { t, language } = useI18n();
  const locale: BabbleLocale = language === "en" ? "en" : "es";
  const reduced = useReducedMotion();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<NacimientoState>(remapProgress(0));
  const spineRef = useRef<ScrollSpine | null>(null);
  const store = useMemo(() => createStageStore(), []);
  const stage = useStage(store);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const wrapper = wrapperRef.current;
    const stageEl = stageRef.current;
    if (!wrapper || !stageEl) return;
    const spine = initScrollSpine({
      wrapper,
      onProgress(raw) {
        const st = remapProgress(raw);
        frameRef.current = st;
        const r = st.raw;
        // ── scrub-linked machine choreography (Apple-smooth, tied to scroll, NOT
        //    discrete beat CSS-transitions). hero(centered) → training(rises, recedes)
        //    → dark act(zooms INTO its own screen + fades while the green world fills). ──
        const tIn = smooth01((r - 0.1) / (0.18 - 0.1)); // hero(→0.15) → training
        // the screen-hack DIVE. Spans the (now longer) silence beat after a clean hold:
        // silence is 0.43→0.56, so 0.43→0.47 holds the best phrase clean, then 0.47→0.60
        // the page tears (RGB/blur/datamosh) and hands off to green right before lm0 speaks
        // (voice-local 0.18 ≈ raw 0.60). Drives the machine fade + scanlines.
        const dive = smooth01((r - 0.47) / (0.6 - 0.47));
        // the steady green BED (screenworld) is held back behind the "broken screen" phase:
        // it stays ~0 while the page tears (raw < 0.55), then fills and locks at 1 for the
        // whole dark act (voice + eras). The ScreenHack canvas paints the dramatic flood on top.
        const green = smooth01((r - 0.55) / (0.6 - 0.55));
        // training: the machine stays the PROTAGONIST (it does NOT recede to a small
        // specimen). It settles only slightly and RISES into the upper-centre so the CRT
        // dominates and there is room beneath it for the corpus feed-tape + the foot. The
        // instrumentation lives at the edges (stage-absolute), so it never competes.
        const base = 1 - 0.2 * tIn; // 1 (hero, identical) → 0.80 (training: big, ~50vh tall)
        // NO zoom into the computer: the dark act is lm0 hacking YOUR screen, not a
        // dive into the Mac. The machine just settles a hair and GLITCHES OUT while the
        // ScreenHack canvas tears the viewport and floods it green.
        const machScale = base * (1 - 0.06 * dive); // ~flat (tiny settle), never a zoom
        const machShift = -21 * tIn; // vh, rises into the upper third (clears room beneath for the tape)
        const machOp = clamp01(1 - dive * 1.5); // stays visible while it CORRUPTS, then the green covers it
        const trainVis = clamp01(tIn) * (1 - dive); // instruments fade in for training, out at the dive
        // conocimiento = luz: the phosphor screen brightens with the REAL model bucket
        // and PLATEAUS at the ceiling (unlike dawn01, which keeps rising all page).
        const light = Math.min(1, st.bucket / (BUCKETS - 1)); // 0 (hero) → 1 (de memoria)
        stageEl.style.setProperty("--lm0-raw", r.toFixed(4));
        stageEl.style.setProperty("--lm0-dawn", st.dawn01.toFixed(4));
        stageEl.style.setProperty("--lm0-light", light.toFixed(4));
        stageEl.style.setProperty("--lm0-mach-shift", `${machShift.toFixed(2)}vh`);
        stageEl.style.setProperty("--lm0-mach-scale", machScale.toFixed(3));
        stageEl.style.setProperty("--lm0-mach-op", machOp.toFixed(3));
        stageEl.style.setProperty("--lm0-sw", dive.toFixed(3));
        stageEl.style.setProperty("--lm0-screenworld-op", green.toFixed(3));
        stageEl.style.setProperty("--lm0-train", trainVis.toFixed(3));
        // CRT POWER-OFF at the very end of the eras: the green world collapses to a
        // bright horizontal line → pinches to a dot → blooms cream (an old TV switching
        // off). The eras now FINISH and hold their converged sentence (readable) BEFORE
        // this starts (ErasPanel compresses its content to ~raw 0.89, so it holds a real
        // beat first), so the power-off never cuts the lesson short. It ends on the EXACT
        // cream the finale opens with, and the climax + el viaje live in the finale
        // (normal flow) — one continuation, never a centred card stranded in the stage.
        const off = smooth01((r - 0.94) / (1.0 - 0.94));
        const slit = smooth01(off / 0.45); // top + bottom bars CLOSE toward the centre line
        const pinch = smooth01((off - 0.45) / 0.25); // the bright line pinches to a dot
        const flash = smooth01((off - 0.62) / 0.26); // dot → FULL cream (the finale's colour)
        stageEl.style.setProperty("--off-on", off > 0.001 ? "1" : "0");
        // the half-height of the still-open band (50vh open → 0 closed)
        stageEl.style.setProperty("--off-slit", `${((1 - slit) * 50).toFixed(2)}vh`);
        stageEl.style.setProperty(
          "--off-line",
          (smooth01((off - 0.25) / 0.2) * (1 - flash)).toFixed(3),
        );
        stageEl.style.setProperty("--off-w", `${((1 - pinch) * 100).toFixed(2)}%`);
        stageEl.style.setProperty("--off-flash", flash.toFixed(3));
        // the climax surfaces ON the cream once the bloom is established — the screen
        // powers back ON into the sentence, so "ya conoces el final" is the first thing
        // you read when it lights up (then el viaje follows as the stage releases).
        stageEl.style.setProperty("--off-words", smooth01((off - 0.8) / 0.18).toFixed(3));
        store.set({
          ...store.get(),
          ready: true,
          beat: st.beat,
          gear: st.gear,
          bucket: st.bucket,
          eraIdx: st.eraIdx,
        });
      },
    });
    spineRef.current = spine;

    // the gentle nudge: if the visitor hasn't moved after the boot settles, drift them in
    const nudge = window.setTimeout(() => {
      if (frameRef.current.raw < 0.01 && wrapper.offsetHeight > window.innerHeight) {
        spine.lenis.scrollTo(
          wrapper.offsetTop + (wrapper.offsetHeight - window.innerHeight) * (SEGMENTS.hero * 0.45),
          { duration: 1.8 },
        );
      }
    }, NUDGE_AFTER_MS);

    return () => {
      window.clearTimeout(nudge);
      spine.destroy();
      spineRef.current = null;
    };
  }, [reduced, store]);

  if (reduced) {
    // static fallback: the full story, readable, no motion machinery at all
    return (
      <div data-lm0>
        <div className="lm0-static">
          <div className="lm0-ui">lm0 — {t("lm0.hero.eyebrow")}</div>
          <h1
            className="lm0-display"
            style={{
              margin: 0,
              fontWeight: 400,
              fontSize: "clamp(1.6rem,4vw,2.6rem)",
              lineHeight: 1.12,
              color: "var(--lm0-ink)",
            }}
          >
            {t("lm0.hero.question")} <em>{t("lm0.hero.questionAccent")}</em>{" "}
            {t("lm0.hero.questionTail")}
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lm0/maquina-front.webp" alt="" style={{ width: "min(340px, 72vw)" }} />
          <div className="lm0-ui" style={{ color: "var(--lm0-ink-dim)" }}>
            {t("lm0.hero.label")}
          </div>
          {/* the machine's BROKEN babble + a static caret — NOT the trained phrase
              (that would contradict "la máquina no sabe hablar"); the static poster
              must show the failure, with the corpus-missing state below it. */}
          <div className="lm0-mono" style={{ color: "var(--lm0-ink-soft)" }}>
            {brokenSample(locale)}
            <span className="lm0-caret" data-blink="true" aria-hidden="true" />
          </div>
          <div className="lm0-ui">{t("lm0.hero.state")}</div>
          <div className="lm0-voice-font" style={{ display: "grid", gap: "0.7rem" }}>
            <span>{t("lm0.voice.g1l1")}</span>
            <span>
              {t("lm0.voice.g2l1")} {t("lm0.voice.g2l3")} {t("lm0.voice.g2l4")}
            </span>
            <span style={{ fontSize: "1.3rem" }}>{t("lm0.voice.g3l1")}</span>
          </div>
        </div>
        <FinaleSection />
      </div>
    );
  }

  return (
    <div data-lm0>
      <div ref={wrapperRef} className="lm0-wrapper">
        <div ref={stageRef} className="lm0-stage" data-beat={stage.beat} data-booted={booted}>
          {/* the actual PAGE — wrapped so the dark-act screen-hack can corrupt it
              (RGB split + datamosh, via the SVG filter ScreenHack drives) the way it
              breaks the user's own screen. The green takeover is drawn OVER it. */}
          <div className="lm0-glitchwrap">
            <div className="lm0-paper" />
            <div className="lm0-floor" />
            <div className="lm0-warm" />
            <HeroTitle />
            <MachineFigure
              beat={stage.beat}
              bucket={stage.bucket}
              locale={locale}
              booted={booted}
              onBootDone={() => setBooted(true)}
            />
            <Instruments locale={locale} frameRef={frameRef} />
          </div>
          {/* the green-black CRT world that fills the viewport in the dark act:
              "the machine is gone — now we are inside its screen" */}
          <div className="lm0-screenworld" aria-hidden="true" />
          <ScreenHack frameRef={frameRef} />
          <VoiceMonologue frameRef={frameRef} />
          <ErasPanel eraIdx={stage.eraIdx} frameRef={frameRef} />
          <div className="lm0-grain" />
          <div className="lm0-scan" />
          <div className="lm0-vignette" />
          <ChromeBar beat={stage.beat} />
          {/* the CRT power-off — top + bottom bars close to a line → dot → FULL cream
              bloom (the exact colour the finale opens with, so the climax + el viaje
              that follow in normal flow are one seamless continuation, no stranded card) */}
          <div className="lm0-crtoff">
            <div className="lm0-crtoff-bar lm0-crtoff-top" aria-hidden="true" />
            <div className="lm0-crtoff-bar lm0-crtoff-bottom" aria-hidden="true" />
            <div className="lm0-crtoff-line" aria-hidden="true" />
            <div className="lm0-crtoff-flash" aria-hidden="true" />
            {/* the climax is BORN on the bloom: as the CRT powers back on into cream, the
                words fade in centred — the first thing read when the screen lights up. The
                finale (normal flow) then carries the same words off into el viaje. */}
            <div className="lm0-crtoff-climax" aria-hidden="true">
              <h2 className="lm0-serif lm0-finale-h1">{t("lm0.finale.h1")}</h2>
              <p className="lm0-serif lm0-finale-h2">{t("lm0.finale.h2")}</p>
              <p className="lm0-finale-sub">{t("lm0.finale.sub")}</p>
            </div>
          </div>
        </div>
      </div>
      <FinaleSection />
    </div>
  );
}
