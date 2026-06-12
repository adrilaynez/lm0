"use client";

/**
 * CanvasLayer — the single canvas behind the DOM beats. Paints ONLY visual
 * material (dawn, river, glow); everything the visitor reads lives in the DOM.
 * Renders inside gsap.ticker (the page's single clock — v2 lesson §9.1),
 * DPR capped at 2, paused while the tab is hidden.
 */

import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import { type BabbleLocale, streamFor } from "../engine/babbler";
import type { NacimientoState } from "../engine/progressMap";

import { createDawnPainter } from "./dawnPainter";
import { createRiverPainter, paintGlow } from "./riverPainter";

interface CanvasLayerProps {
  frameRef: React.RefObject<NacimientoState>;
  locale: BabbleLocale;
}

export function CanvasLayer({ frameRef, locale }: CanvasLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const dawn = createDawnPainter();
    const river = createRiverPainter(streamFor(locale));
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dawn.resize(w, h);
      river.invalidate();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const paint = (dt: number) => {
      const st = frameRef.current;
      if (!st) return;
      ctx.clearRect(0, 0, w, h);
      dawn.paint(ctx, st.dawn01);
      river.paint(ctx, w, h, st, dt);
      if (st.beat === "hero" || st.beat === "broken") {
        // the machine breathing in the dark, before anyone teaches it
        paintGlow(ctx, w * 0.5, h * 0.42, 34, st.beat === "broken" ? 0.07 : 0.04);
      }
    };
    const render = (_time: number, deltaTime: number) => {
      if (document.hidden) return;
      paint(Math.min(0.05, deltaTime / 1000));
    };
    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
      ro.disconnect();
    };
  }, [frameRef, locale]);

  return <canvas ref={canvasRef} className="lm0-canvas" aria-hidden="true" />;
}
