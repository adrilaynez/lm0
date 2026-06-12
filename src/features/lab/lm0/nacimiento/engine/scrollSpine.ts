/* ─────────────────────────────────────────────
   LM0 v3 — engine/scrollSpine.ts
   The validated scroll backbone, ported verbatim from the v2 engine
   (lm0-landing-v3-spec §6 · v2 lessons §9):

   · Lenis + ONE progress-only ScrollTrigger over the tall wrapper; the
     sticky stage does the pinning in CSS (no GSAP pin → no jank).
   · lenis.on('scroll', ScrollTrigger.update)
   · gsap.ticker.add(t => lenis.raf(t * 1000))   ← single clock
   · lagSmoothing(0)
   · ScrollTrigger.refresh() after document.fonts.ready (webfonts move
     layout and would leave the trigger miscalibrated).
   ───────────────────────────────────────────── */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export interface ScrollSpine {
  lenis: Lenis;
  destroy(): void;
}

export interface ScrollSpineInit {
  wrapper: HTMLElement;
  onProgress: (raw: number) => void;
}

export function initScrollSpine({ wrapper, onProgress }: ScrollSpineInit): ScrollSpine {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);

  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  const trigger = ScrollTrigger.create({
    trigger: wrapper,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => onProgress(self.progress),
  });

  let cancelled = false;
  document.fonts.ready.then(() => {
    if (!cancelled) ScrollTrigger.refresh();
  });

  // initial position (deep links / restored scroll)
  onProgress(trigger.progress);

  return {
    lenis,
    destroy() {
      cancelled = true;
      trigger.kill();
      gsap.ticker.remove(raf);
      lenis.destroy();
    },
  };
}
