"use client";

/**
 * NacimientoLanding — root of the LM0 v3 landing (spec: lm0-landing-v3-spec.md).
 *
 * Structure: a tall wrapper (800vh) + a sticky 100vh stage (CSS does the pinning,
 * no GSAP pin — v2 lesson). One scroll spine drives ONE pure progressMap; per-frame
 * values go to CSS variables on the stage, discrete state goes to the stageStore.
 * Beats are always-mounted layers revealed by opacity (SEO/a11y: the h1 and all
 * copy exist in the DOM regardless of scroll position).
 *
 * Reduced motion mounts a static page instead — no Lenis, no GSAP, no canvas.
 * (Minimal for Gate 1; the full NacimientoStatic lands in Phase 4.)
 */

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useReducedMotion } from "framer-motion";

import { useI18n } from "@/i18n/context";

import { CanvasLayer } from "./canvas/CanvasLayer";
import { BrokenMachine } from "./components/BrokenMachine";
import { Escalones } from "./components/Escalones";
import { HeroQuestion } from "./components/HeroQuestion";
import { Phase2Placeholder } from "./components/Phase2Placeholder";
import { TrainingRiver } from "./components/TrainingRiver";
import { BUCKETS } from "./data/script";
import { type BabbleLocale, brokenSample, generate } from "./engine/babbler";
import { beatStart, type NacimientoState, remapProgress } from "./engine/progressMap";
import { initScrollSpine, type ScrollSpine } from "./engine/scrollSpine";
import { createStageStore, useStage } from "./engine/stageStore";

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
          caminoPhase: st.caminoPhase,
        });
      },
    });
    spineRef.current = spine;
    return () => {
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
      (wrapper.offsetHeight - window.innerHeight) * (beatStart("training") + 0.012);
    spine.lenis.scrollTo(target, { duration: 1.4 });
  }, []);

  if (reduced) {
    // static fallback (Gate-1 minimal; full static version is Phase 4)
    return (
      <div data-lm0>
        <div className="lm0-static">
          <h1 className="lm0-serif lm0-hero-q">{t("lm0.hero.question")}</h1>
          <div className="lm0-machine-font">{brokenSample(locale)}</div>
          <div className="lm0-ui-font">{t("lm0.broken.label")}</div>
          <div className="lm0-machine-font">{generate(locale, BUCKETS - 1).text}</div>
          <div className="lm0-voice-font" style={{ display: "grid", gap: "0.8rem" }}>
            <span>{t("lm0.voice.notBad")}</span>
            <span>{t("lm0.voice.firstIdea")}</span>
            <span>{t("lm0.voice.gap")}</span>
            <span style={{ fontSize: "1.3rem", fontWeight: 500 }}>{t("lm0.voice.hello")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-lm0 ref={wrapperRef} className="lm0-wrapper">
      <div ref={stageRef} className="lm0-stage">
        <CanvasLayer frameRef={frameRef} locale={locale} />
        <HeroQuestion active={stage.beat === "hero"} />
        <BrokenMachine active={stage.beat === "broken"} locale={locale} onTeach={handleTeach} />
        <TrainingRiver active={stage.beat === "training"} locale={locale} frameRef={frameRef} />
        <Escalones beat={stage.beat} bucket={stage.bucket} locale={locale} />
        <Phase2Placeholder beat={stage.beat} />
      </div>
    </div>
  );
}
