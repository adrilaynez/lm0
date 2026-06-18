"use client";

/**
 * ScreenHack — the dark act's ARRIVAL: lm0 hacks the USER's own screen (no zoom into
 * the Mac). It runs in two layers, copying the approved widget:
 *
 *  1. The REAL page (`.lm0-glitchwrap`) is CORRUPTED in place via an SVG filter this
 *     component drives per-frame: first a chromatic RGB split builds ("the background
 *     starts to look wrong"), then a fast datamosh displacement tears it apart.
 *  2. ON TOP, this canvas paints the green takeover — code bands bleeding in, the
 *     bright green raya sweeping, and the phosphor flood — which comes in fast once
 *     the page is breaking, then hands off to the steady `.lm0-screenworld` green.
 *
 * Everything is a pure function of the dive position (scroll `raw`), so it is fully
 * scrub-linked + reversible; time only adds shimmer. Active in silence-dive + voice.
 */

import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import { clamp01, type NacimientoState } from "../engine/progressMap";

function smoothstep(a: number, b: number, v: number): number {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}
function hash(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface ScreenHackProps {
  frameRef: React.RefObject<NacimientoState>;
}

export function ScreenHack({ frameRef }: ScreenHackProps) {
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = cvRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let W = 0;
    let H = 0;

    const parent = cv.parentElement ?? cv;
    const resize = () => {
      const r = parent.getBoundingClientRect();
      W = Math.max(1, Math.min(4096, Math.round(r.width)));
      H = Math.max(1, Math.min(4096, Math.round(r.height)));
      const d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * d;
      cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    // the real-page corruption layer (SVG filter on the page wrap)
    const wrap = document.querySelector<HTMLElement>(".lm0-glitchwrap");
    const disp = document.getElementById("lm0-gl-disp");
    const gblur = document.getElementById("lm0-gl-blur");
    const roff = document.getElementById("lm0-gl-roff");
    const coff = document.getElementById("lm0-gl-coff");
    const noise = document.getElementById("lm0-gl-noise");
    const setWrapFilter = (on: boolean) => {
      if (wrap) wrap.style.filter = on ? "url(#lm0-glitch)" : "none";
    };

    const drawCanvas = (sw: number, tms: number) => {
      ctx.clearRect(0, 0, W, H);
      // green/binary are pushed LATE so the first ~60% of the dive is the BROKEN PAGE alone
      // (RGB split + blur + datamosh, no green) — the cinematic "your screen is breaking" beat.
      const G = smoothstep(0.6, 0.8, sw) * (1 - smoothstep(0.9, 0.98, sw)); // canvas breaking energy (binary/bands)
      const flood = smoothstep(0.62, 0.95, sw); // green coverage — held back so the page tears alone first
      const seed = Math.floor(tms * 0.006);

      const BANDS = 40;
      const bh = H / BANDS;
      for (let i = 0; i < BANDS; i++) {
        const th = hash(i * 1.7);
        const y = i * bh;
        if (th < flood) {
          let off = 0;
          if (G > 0.04 && hash(i * 4.2 + seed * 0.7) < G * 0.5)
            off = (hash(i * 9.1) - 0.5) * 72 * G;
          ctx.fillStyle = i % 3 === 0 ? "#12241a" : i % 3 === 1 ? "#0e1f17" : "#0a160f";
          ctx.fillRect(off, y, W, bh + 1);
          if (off !== 0) {
            ctx.fillStyle = "#06100a";
            if (off > 0) ctx.fillRect(0, y, off, bh + 1);
            else ctx.fillRect(W + off, y, -off, bh + 1);
            ctx.fillStyle = `rgba(130,240,180,${(0.5 * G).toFixed(3)})`;
            ctx.fillRect(off > 0 ? off : W + off, y, 2, bh + 1);
          }
        } else if (th < flood + 0.05) {
          ctx.fillStyle = "rgba(40,92,66,0.4)";
          ctx.fillRect(0, y, W, bh + 1);
        }
      }

      if (flood > 0.04) {
        ctx.globalAlpha = flood;
        const g = ctx.createRadialGradient(W * 0.5, H * 0.42, 30, W * 0.5, H * 0.44, W * 0.8);
        g.addColorStop(0, "rgba(52,108,78,0.55)");
        g.addColorStop(0.7, "rgba(20,41,31,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      if (G > 0.5 && hash(seed * 1.7 + 5) < (G - 0.5) * 0.6) {
        ctx.fillStyle = `rgba(196,250,218,${(0.1 + (G - 0.5) * 0.18).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (flood > 0.04) {
        const a = 0.6 * Math.min(1, flood * 1.5);
        const raya = (sy: number, m: number) => {
          ctx.fillStyle = `rgba(120,235,170,${(a * 0.16 * m).toFixed(3)})`;
          ctx.fillRect(0, sy - 16, W, 32);
          ctx.fillStyle = `rgba(150,245,185,${(a * 0.4 * m).toFixed(3)})`;
          ctx.fillRect(0, sy - 4, W, 9);
          ctx.fillStyle = `rgba(214,255,228,${(a * m).toFixed(3)})`;
          ctx.fillRect(0, sy - 1, W, 2);
        };
        raya(((tms * 0.13) % (H + 160)) - 80, 1);
        raya(((tms * 0.062 + 240) % (H + 160)) - 80, 0.62);
      }

      if (G > 0.02) {
        ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
        for (let i = 0; i < 4; i++) {
          if (hash(i * 3.3 + 1) > G) continue;
          const y = hash(i * 5.1 + 2 + seed * 0.25) * (H - 18);
          const off = (hash(i * 9.3) - 0.5) * 60 * G;
          ctx.fillStyle = `rgba(8,22,15,${(0.4 * G).toFixed(3)})`;
          ctx.fillRect(off, y, W, 16);
          ctx.fillStyle = `rgba(135,240,182,${(0.62 * G).toFixed(3)})`;
          for (let x = 6; x < W; x += 21) {
            if (hash(x * 0.11 + i + seed) > 0.55) continue;
            ctx.fillText(hash(x + i) > 0.5 ? "1" : "0", x + off, y + 12);
          }
        }
      }

      if (flood > 0.08) {
        ctx.fillStyle = `rgba(0,0,0,${(0.1 * flood).toFixed(3)})`;
        for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.3);
      }
    };

    // self-computed scroll speed: a FAST flick should make the hack tear HARDER (so you
    // can't blow past it), and a faint shimmer keeps it alive even when the scroll is held —
    // so the glitch is not a pure function of position. Smoothed to avoid jitter.
    let lastRaw = frameRef.current?.raw ?? 0;
    let velSmooth = 0;

    const tick = () => {
      const st = frameRef.current;
      const rawNow = st?.raw ?? lastRaw;
      const instVel = Math.abs(rawNow - lastRaw);
      lastRaw = rawNow;
      velSmooth += (instVel - velSmooth) * 0.18;

      if (!st || (st.beat !== "silence" && st.beat !== "voice")) {
        cv.style.opacity = "0";
        setWrapFilter(false);
        return;
      }
      const sw = smoothstep(0.47, 0.6, st.raw); // the dive (mirror of onProgress)
      if (sw <= 0.001 || sw >= 0.997) {
        cv.style.opacity = "0";
        setWrapFilter(false);
        return;
      }
      const tms = performance.now();
      // velBoost ≈ 1 at a fast flick (~0.006 raw/frame); shimmer is a faint resting twitch.
      const velBoost = clamp01(velSmooth / 0.006);
      const shimmer = 0.5 + 0.5 * Math.sin(tms * 0.011);

      // ── 1. corrupt the REAL page FIRST (the "broken screen" beat): the chromatic split
      //    builds fast and the page goes blurry + datamosh-torn well BEFORE any green. A
      //    fast scroll tears it HARDER; the shimmer keeps it twitching while held. ──
      const aberr = smoothstep(0.0, 0.22, sw);
      const tear = smoothstep(0.12, 0.5, sw);
      const corrupt = 1 - smoothstep(0.82, 0.99, sw);
      const live = corrupt * (1 + velBoost * 1.3 + 0.12 * shimmer * smoothstep(0.05, 0.4, sw));
      const rgbOff = Math.min(28, (aberr * 5.5 + tear * 10) * live);
      const dispScale = Math.min(120, tear * 80 * live);
      const blur = smoothstep(0.08, 0.5, sw) * 5.5 * corrupt;
      if (disp) disp.setAttribute("scale", dispScale.toFixed(1));
      if (gblur) gblur.setAttribute("stdDeviation", blur.toFixed(2));
      if (roff) roff.setAttribute("dx", (-rgbOff).toFixed(2));
      if (coff) coff.setAttribute("dx", rgbOff.toFixed(2));
      if (noise && dispScale > 0.4)
        noise.setAttribute("seed", String(Math.floor(tms * 0.012) % 97));
      setWrapFilter(rgbOff > 0.25 || dispScale > 0.4 || blur > 0.2);

      // ── 2. the green takeover canvas — held back so the broken page reads alone first,
      //    then floods in and hands off to the steady screenworld green. ──
      const op = smoothstep(0.58, 0.74, sw) * (1 - smoothstep(0.94, 0.99, sw));
      cv.style.opacity = op.toFixed(3);
      drawCanvas(sw, tms);
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      setWrapFilter(false);
    };
  }, [frameRef]);

  return (
    <>
      {/* the glitch filter the dark act drives onto the real page: a datamosh
          displacement + a red/cyan chromatic split. scale + dx are animated per-frame. */}
      <svg className="lm0-glitch-svg" aria-hidden="true" focusable="false">
        <filter
          id="lm0-glitch"
          x="-8%"
          y="-3%"
          width="116%"
          height="106%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            id="lm0-gl-noise"
            type="fractalNoise"
            baseFrequency="0.00001 0.55"
            numOctaves={1}
            seed={1}
            result="noise"
          />
          <feDisplacementMap
            id="lm0-gl-disp"
            in="SourceGraphic"
            in2="noise"
            scale={0}
            xChannelSelector="R"
            yChannelSelector="G"
            result="disp"
          />
          <feGaussianBlur id="lm0-gl-blur" in="disp" stdDeviation={0} result="blurred" />
          <feColorMatrix
            in="blurred"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="rch"
          />
          <feOffset id="lm0-gl-roff" in="rch" dx={0} dy={0} result="roffset" />
          <feColorMatrix
            in="blurred"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="cch"
          />
          <feOffset id="lm0-gl-coff" in="cch" dx={0} dy={0} result="coffset" />
          <feBlend in="roffset" in2="coffset" mode="screen" />
        </filter>
      </svg>
      <canvas ref={cvRef} className="lm0-screenhack" aria-hidden="true" />
    </>
  );
}
