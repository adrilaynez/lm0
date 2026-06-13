"use client";

/**
 * ErasPanel — the dark act's journey: lm0 narrates on the left (era tag + three
 * lines) while the SAME motes regroup on the right canvas:
 * loose letters → the counting grid (green) → a network of dot-cluster nodes
 * (amber) → attention beams over the sentence (violet, weighted, with a pulse
 * travelling the strongest beam) → everything collapses into a caret that
 * types the final line.
 *
 * The canvas is a pure function of the eras beat's local progress — scrub-safe.
 */

import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import { useI18n } from "@/i18n/context";

import { clamp01, type NacimientoState } from "../engine/progressMap";

const ERA_KEYS = ["cero", "contar", "aprender", "atencion", "actualidad"] as const;
const MONO = "13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const N = 460;
const LETTERS = "abcdefghijklmnopqrstuvz";
const NETCOLS = [6, 8, 8, 6];
const TOTAL_NODES = NETCOLS.reduce((a, b) => a + b, 0);
const COLORS: [number, number, number][] = [
  [150, 150, 140],
  [82, 227, 145],
  [255, 184, 77],
  [143, 123, 255],
  [236, 229, 214],
];

function hash(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function ease(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

interface ErasPanelProps {
  eraIdx: number;
  frameRef: React.RefObject<NacimientoState>;
}

export function ErasPanel({ eraIdx, frameRef }: ErasPanelProps) {
  const { t } = useI18n();
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = cvRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let W = 0;
    let H = 0;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      const d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * d;
      cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const chaosPos = (i: number): [number, number] => [
      16 + hash(i * 3 + 1) * (W - 32),
      20 + hash(i * 5 + 2) * (H - 60),
    ];
    const gridPos = (i: number): [number, number] => {
      const cols = 26;
      const rows = 16;
      const c = i % cols;
      const r = Math.floor(i / cols) % rows;
      return [W * 0.06 + c * ((W * 0.88) / (cols - 1)), H * 0.08 + r * ((H * 0.8) / (rows - 1))];
    };
    const netNodePos = (n: number): [number, number] => {
      let acc = 0;
      for (let c = 0; c < NETCOLS.length; c++) {
        if (n < acc + NETCOLS[c]) {
          const idx = n - acc;
          const xs = [0.12, 0.38, 0.62, 0.88];
          return [W * xs[c], H * 0.12 + idx * ((H * 0.74) / (NETCOLS[c] - 1))];
        }
        acc += NETCOLS[c];
      }
      return [W / 2, H / 2];
    };
    const clusterPos = (i: number): [number, number] => {
      const p = netNodePos(i % TOTAL_NODES);
      const a = hash(i * 7) * 6.28;
      const r = hash(i * 9) * 9;
      return [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r];
    };
    const sentence = t("lm0.eras.sentence");
    const words = sentence.replace(/\.$/, "").split(" ");
    const wordPos = (s: number): [number, number] => [
      W * 0.09 + (s % words.length) * ((W * 0.82) / Math.max(1, words.length - 1)),
      H * 0.46,
    ];
    const attnPos = (i: number): [number, number] => {
      const p = wordPos(i % words.length);
      return [p[0] + (hash(i * 3) - 0.5) * 22, p[1] - 12 + (hash(i * 5) - 0.5) * 6];
    };
    const centerPos = (): [number, number] => [W * 0.4, H * 0.46];
    const layouts = [chaosPos, gridPos, clusterPos, attnPos, () => centerPos()];
    const quad = (
      p0: [number, number],
      p1: [number, number],
      cpY: number,
      q: number,
    ): [number, number] => {
      const mx = (p0[0] + p1[0]) / 2;
      return [
        (1 - q) * (1 - q) * p0[0] + 2 * (1 - q) * q * mx + q * q * p1[0],
        (1 - q) * (1 - q) * p0[1] + 2 * (1 - q) * q * cpY + q * q * p1[1],
      ];
    };

    const draw = (g: number) => {
      ctx.clearRect(0, 0, W, H);
      const seg = Math.max(0, Math.min(3, Math.floor(g * 4)));
      const f = ease(clamp01(g * 4 - seg));
      const ca = COLORS[seg];
      const cb = COLORS[Math.min(4, seg + 1)];
      const col = [
        Math.round(ca[0] + (cb[0] - ca[0]) * f),
        Math.round(ca[1] + (cb[1] - ca[1]) * f),
        Math.round(ca[2] + (cb[2] - ca[2]) * f),
      ];

      // amber network edges (era ii)
      if (seg === 1 && f > 0.25) {
        ctx.lineWidth = 0.4;
        let acc = 0;
        for (let c = 0; c < 3; c++) {
          for (let a = 0; a < NETCOLS[c]; a++) {
            for (let b = 0; b < NETCOLS[c + 1]; b++) {
              const p1 = netNodePos(acc + a);
              const p2 = netNodePos(acc + NETCOLS[c] + b);
              ctx.strokeStyle = `rgba(255,184,77,${((f - 0.25) * 0.13 * (0.4 + hash(a * 13 + b) * 0.6)).toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(p1[0], p1[1]);
              ctx.lineTo(p2[0], p2[1]);
              ctx.stroke();
            }
          }
          acc += NETCOLS[c];
        }
      }

      // attention beams (era iii): focus sweeps; strongest beam carries a pulse
      if (seg === 2) {
        ctx.font = MONO;
        ctx.textAlign = "center";
        const focus = Math.max(1, Math.min(words.length - 1, Math.floor(f * words.length)));
        for (let w = 0; w < words.length; w++) {
          const wp = wordPos(w);
          ctx.fillStyle =
            w === focus ? "rgba(236,229,214,.97)" : `rgba(143,123,255,${w < focus ? ".7" : ".28"})`;
          ctx.fillText(words[w], wp[0], wp[1] + 28);
        }
        const cur = wordPos(focus);
        let maxW = -1;
        let maxI = 0;
        const weights: number[] = [];
        for (let pv = 0; pv < focus; pv++) {
          const wgt = hash(pv * 17 + focus * 7);
          weights.push(wgt);
          if (wgt > maxW) {
            maxW = wgt;
            maxI = pv;
          }
        }
        for (let pv = 0; pv < focus; pv++) {
          const pp = wordPos(pv);
          const wgt = weights[pv];
          const strong = pv === maxI;
          const cpY = pp[1] - 60 - wgt * 42;
          ctx.strokeStyle = `rgba(143,123,255,${(strong ? 0.85 : 0.1 + wgt * 0.3).toFixed(2)})`;
          ctx.lineWidth = strong ? 1.6 : 0.5 + wgt * 0.8;
          ctx.beginPath();
          ctx.moveTo(pp[0], pp[1] - 2);
          ctx.quadraticCurveTo((pp[0] + cur[0]) / 2, cpY, cur[0], cur[1] - 2);
          ctx.stroke();
          if (strong) {
            const tt = (Date.now() % 1100) / 1100;
            const pt = quad([pp[0], pp[1] - 2], [cur[0], cur[1] - 2], cpY, tt);
            ctx.fillStyle = "rgba(236,229,214,.95)";
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], 2.4, 0, 7);
            ctx.fill();
          }
        }
        ctx.textAlign = "left";
      }

      // the final caret typing the sentence (actualidad)
      if (seg === 3 && f > 0.4) {
        const cp = centerPos();
        const lf = clamp01((f - 0.4) / 0.6);
        ctx.fillStyle = "rgba(236,229,214,.95)";
        if (Math.floor(Date.now() / 420) % 2 === 0) ctx.fillRect(cp[0] - 18, cp[1] - 12, 9, 22);
        ctx.font = `15px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.fillStyle = `rgba(236,229,214,${Math.min(0.96, lf * 1.3).toFixed(2)})`;
        ctx.fillText(sentence.slice(0, Math.floor(lf * sentence.length)), cp[0], cp[1] + 4);
      }

      // the motes — always the same material, regrouping
      const pAlpha = seg === 3 ? (1 - f) * 0.5 : seg === 2 ? 0.28 : 0.55;
      for (let i = 0; i < N; i++) {
        if (seg === 2 && i % 4 !== 0) continue;
        const pa = layouts[seg](i);
        const pb = layouts[Math.min(4, seg + 1)](i);
        const st = ease(clamp01(f * 1.3 - hash(i * 11) * 0.25));
        const x = pa[0] + (pb[0] - pa[0]) * st;
        const y = pa[1] + (pb[1] - pa[1]) * st;
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${((0.3 + hash(i * 7) * 0.6) * pAlpha).toFixed(2)})`;
        if (seg === 0 && st < 0.45) {
          ctx.font = `${(9 + hash(i * 13) * 4).toFixed(0)}px ui-monospace, monospace`;
          ctx.fillText(LETTERS[i % LETTERS.length], x, y);
        } else {
          const bright = seg === 1 && hash(i * 17) > 0.94;
          if (bright) {
            ctx.fillStyle = "rgba(82,227,145,.95)";
            ctx.fillRect(x, y, 4, 4);
          } else {
            ctx.fillRect(x, y, 2.1, 2.1);
          }
        }
      }
    };

    const render = () => {
      if (document.hidden) return;
      const st = frameRef.current;
      if (!st || st.beat !== "eras") return;
      draw(st.local);
    };
    gsap.ticker.add(render);
    return () => {
      gsap.ticker.remove(render);
      ro.disconnect();
    };
  }, [frameRef, t]);

  const era = ERA_KEYS[Math.max(0, Math.min(ERA_KEYS.length - 1, eraIdx))];

  return (
    <div className="lm0-eras">
      <div className="lm0-eras-text">
        <div className="lm0-eras-tag">{t(`lm0.eras.${era}.tag`)}</div>
        <div className="lm0-eras-l1 lm0-voice-font">{t(`lm0.eras.${era}.l1`)}</div>
        <div className="lm0-eras-l2 lm0-voice-font">{t(`lm0.eras.${era}.l2`)}</div>
        <div className="lm0-eras-l3 lm0-voice-font">{t(`lm0.eras.${era}.l3`)}</div>
      </div>
      <canvas ref={cvRef} className="lm0-eras-cv" aria-hidden="true" />
    </div>
  );
}
