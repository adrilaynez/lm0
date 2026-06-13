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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

import { ChromeBar } from "./components/ChromeBar";
import { ErasPanel } from "./components/ErasPanel";
import { FinaleSection } from "./components/FinaleSection";
import { HeroTitle } from "./components/HeroTitle";
import { Instruments } from "./components/Instruments";
import { MachineFigure } from "./components/MachineFigure";
import { VoiceMonologue } from "./components/VoiceMonologue";
import { BUCKETS } from "./data/script";
import { type BabbleLocale, generate } from "./engine/babbler";
import { beatStart, type NacimientoState, remapProgress, SEGMENTS } from "./engine/progressMap";
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
        stageEl.style.setProperty("--lm0-raw", st.raw.toFixed(4));
        stageEl.style.setProperty("--lm0-dawn", st.dawn01.toFixed(4));
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

  const handleTeach = useCallback(() => {
    const wrapper = wrapperRef.current;
    const spine = spineRef.current;
    if (!wrapper || !spine) return;
    const target =
      wrapper.offsetTop +
      (wrapper.offsetHeight - window.innerHeight) * (beatStart("training") + 0.015);
    spine.lenis.scrollTo(target, { duration: 1.5 });
  }, []);

  if (reduced) {
    // static fallback: the full story, readable, no motion machinery at all
    return (
      <div data-lm0>
        <div className="lm0-static">
          <div className="lm0-ui">{t("lm0.hero.eyebrow")}</div>
          <h1 className="lm0-serif" style={{ fontSize: "clamp(2rem,5vw,3.4rem)", margin: 0 }}>
            {t("lm0.hero.question")}
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lm0/maquina.webp" alt="" style={{ width: "min(420px, 80vw)" }} />
          <div className="lm0-mono" style={{ color: "var(--lm0-ink-soft)" }}>
            {generate(locale, BUCKETS - 1).text}
          </div>
          <div className="lm0-voice-font" style={{ display: "grid", gap: "0.7rem" }}>
            <span>{t("lm0.voice.a1")}</span>
            <span>
              {t("lm0.voice.b1")} {t("lm0.voice.b2")} {t("lm0.voice.b3")}
            </span>
            <span style={{ fontSize: "1.3rem" }}>{t("lm0.voice.c1")}</span>
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
          <div className="lm0-paper" />
          <div className="lm0-warm" />
          <HeroTitle onTeach={handleTeach} />
          <MachineFigure
            beat={stage.beat}
            bucket={stage.bucket}
            locale={locale}
            booted={booted}
            onBootDone={() => setBooted(true)}
          />
          <Instruments locale={locale} frameRef={frameRef} />
          <VoiceMonologue frameRef={frameRef} />
          <ErasPanel eraIdx={stage.eraIdx} frameRef={frameRef} />
          <div className="lm0-grain" />
          <div className="lm0-scan" />
          <div className="lm0-vignette" />
          <ChromeBar beat={stage.beat} />
        </div>
      </div>
      <FinaleSection />
    </div>
  );
}
