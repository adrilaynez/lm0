"use client";

/**
 * ErasPanel — "el mismo punto": ONE pool of ~760 motes that the scroll re-forms
 * through the eras, ported faithfully from the approved prototype, then widened.
 * lm0 types the narration on the left; the same motes (now large & centred) become:
 *
 *   el cero     a tight point of light → blooms into loose dust (la nada)
 *   contar      the dust snaps into an even grid — the table of counts (1948)
 *   aprender    the grid re-forms into a layered network (6-10-10-5), wired in amber (1986)
 *   atención    the motes gather onto an ellipse-ring; faint blue chords cross it (2017)
 *   actualidad  everything streams into a cursor and a written sentence types itself (hoy)
 *
 * Tiny ADDITIVE dots (no glow blobs) + whisper-faint wiring = the clean look. The
 * canvas is full-bleed and transparent (the green screenworld shows through). A soft
 * dark "focus pool" under the figure lifts its contrast on any background, and an
 * ever-present faint DUST field fills the space so it never reads empty/isolated.
 * The figure is a pure function of scroll (scrub-safe); `time` only drifts the dust.
 */

import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import { useI18n } from "@/i18n/context";

import { clamp01, type NacimientoState } from "../engine/progressMap";

const ERA_KEYS = ["cero", "contar", "aprender", "atencion", "actualidad"] as const;
const N = 760;
const AMB = 520; // ambient dust motes
const COUNTS = [6, 10, 10, 5]; // MLP silhouette: input → 2 hidden → output (31 nodes)
// particle colour, travelling per state (a touch brighter for contrast):
// point cream · corpus sage · grid green · net amber · ring blue · cursor cream
const COLS: [number, number, number][] = [
  [238, 240, 235],
  [160, 212, 188],
  [70, 224, 150],
  [255, 190, 90],
  [120, 180, 255],
  [240, 242, 236],
];

function hash(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
function smooth(x: number): number {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
}

interface ErasPanelProps {
  eraIdx: number;
  frameRef: React.RefObject<NacimientoState>;
}

export function ErasPanel({ frameRef }: ErasPanelProps) {
  const { t } = useI18n();
  const cvRef = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const l1Ref = useRef<HTMLDivElement>(null);
  const l2Ref = useRef<HTMLDivElement>(null);
  const l3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = cvRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let W = 0;
    let H = 0;

    // stable per-mote randomness (deterministic ⇒ scrub-safe) + the "hot" subset
    const rA = new Float32Array(N);
    const rB = new Float32Array(N);
    const hot = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      rA[i] = hash(i * 3 + 1);
      rB[i] = hash(i * 5 + 2);
      hot[i] = hash(i * 2.3 + 1.1) > 0.93 ? 1 : 0; // ~53 motes
    }
    // ambient dust — fixed scattered positions + a phase for the slow drift
    const aX = new Float32Array(AMB);
    const aY = new Float32Array(AMB);
    const aPh = new Float32Array(AMB);
    for (let i = 0; i < AMB; i++) {
      aX[i] = hash(i * 1.7 + 0.3);
      aY[i] = hash(i * 2.9 + 0.6);
      aPh[i] = hash(i * 4.1 + 0.9) * 6.2832;
    }

    // the six target layouts (rebuilt on resize), the wiring anchors, and the centre
    let T: Float32Array[] = [];
    let layerNodes: number[][] = [];
    let ringAnchors: number[][] = [];
    let CX = 0;
    let CY = 0;

    const pts = (f: (i: number) => [number, number]): Float32Array => {
      const a = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) {
        const p = f(i);
        a[i * 2] = p[0];
        a[i * 2 + 1] = p[1];
      }
      return a;
    };

    const build = () => {
      CX = W * 0.56; // figure centred-right of the full-bleed canvas
      CY = H / 2;
      const cx = CX;
      const cy = CY;
      T = [];
      // 0 · point (tight)
      T.push(pts((i) => [cx + (rA[i] - 0.5) * 6, cy + (rB[i] - 0.5) * 6]));
      // 1 · corpus (loose full-field dust)
      T.push(pts((i) => [W * 0.14 + rA[i] * W * 0.82, H * 0.08 + rB[i] * H * 0.84]));
      // 2 · grid (30 cols, the table of counts) — wider
      const cols = 30;
      const gw = Math.min(W * 0.5, 640);
      const gh = H * 0.7;
      const gx = cx - gw / 2;
      const gy = cy - gh / 2;
      T.push(
        pts((i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          return [gx + c * (gw / (cols - 1)), gy + r * (gh / (Math.ceil(N / cols) - 1))];
        }),
      );
      // 3 · network (6-10-10-5 node clusters) — wider span
      layerNodes = [];
      const lspan = W * 0.44;
      const lx0 = cx - lspan / 2;
      COUNTS.forEach((n, li) => {
        for (let k = 0; k < n; k++) {
          layerNodes.push([lx0 + li * (lspan / 3), cy + (k - (n - 1) / 2) * (H * 0.084)]);
        }
      });
      T.push(
        pts((i) => {
          const nd = layerNodes[i % layerNodes.length];
          return [nd[0] + (rA[i] - 0.5) * 11, nd[1] + (rB[i] - 0.5) * 11];
        }),
      );
      // 4 · ring as a wide ELLIPSE (más alargada); motes spread around it
      const rx = Math.min(W * 0.46, H * 0.6) * 0.66;
      const ry = H * 0.36;
      ringAnchors = [];
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * 6.2832 - Math.PI / 2;
        ringAnchors.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
      }
      T.push(
        pts((i) => {
          const a = (i / N) * 6.2832;
          return [
            cx + Math.cos(a) * rx + (rA[i] - 0.5) * 8,
            cy + Math.sin(a) * ry + (rB[i] - 0.5) * 8,
          ];
        }),
      );
      // 5 · cursor bar (motes collapse to a vertical writing caret)
      const bx = cx - W * 0.2;
      const byTop = cy - 26;
      T.push(pts((i) => [bx + ((i % 4) - 1.5) * 1.8 + (rA[i] - 0.5) * 1.4, byTop + (i / N) * 52]));
    };

    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = Math.max(1, Math.min(4096, Math.round(r.width)));
      H = Math.max(1, Math.min(4096, Math.round(r.height)));
      const d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * d;
      cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      build();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const bell = (c: number, P: number): number => {
      const d = 1 - Math.abs(P - c);
      return d <= 0 ? 0 : smooth(d);
    };

    // ── typed left narration (lm0 writing it) ──
    const typeInto = (el: HTMLDivElement | null, text: string, p: number) => {
      if (!el) return;
      el.textContent = text.slice(0, Math.ceil(clamp01(p) * text.length));
      if (p > 0.01 && p < 0.999) el.setAttribute("data-caret", "1");
      else el.removeAttribute("data-caret");
    };
    const writeText = (seg: number, eLocal: number) => {
      const era = ERA_KEYS[seg];
      if (tagRef.current) tagRef.current.textContent = t(`lm0.eras.${era}.tag`);
      typeInto(l1Ref.current, t(`lm0.eras.${era}.l1`), (eLocal - 0.16) / 0.26);
      typeInto(l2Ref.current, t(`lm0.eras.${era}.l2`), (eLocal - 0.44) / 0.26);
      typeInto(l3Ref.current, t(`lm0.eras.${era}.l3`), (eLocal - 0.7) / 0.24);
    };

    const draw = (P: number, time: number) => {
      ctx.clearRect(0, 0, W, H); // transparent → the green screenworld shows through

      // contrast: a soft dark focus pool under the figure so it pops on any background
      const fg = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.52);
      fg.addColorStop(0, "rgba(3,12,8,0.16)");
      fg.addColorStop(1, "rgba(3,12,8,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = "lighter";

      // ever-present ambient dust (slow drift, faint starfield) — fills the space
      for (let i = 0; i < AMB; i++) {
        const x = aX[i] * W + Math.sin(time * 0.25 + aPh[i]) * 4;
        const y = aY[i] * H + Math.cos(time * 0.2 + aPh[i] * 1.3) * 4;
        const v = hash(i * 0.7 + 0.2);
        const da = 0.05 + v * 0.08; // a few motes read brighter, most are a whisper
        const sz = v > 0.86 ? 1.6 : 1;
        ctx.fillStyle = `rgba(168,214,184,${da.toFixed(3)})`;
        ctx.fillRect(x, y, sz, sz);
      }

      const k = Math.min(4, Math.floor(P));
      const f = P - k;
      const e = smooth(clamp01((f - 0.12) / 0.76)); // hold briefly, then morph
      const next = Math.min(5, k + 1);

      // whisper wiring — amber net, blue ring chords (a touch stronger for contrast)
      const w3 = bell(3, P);
      if (w3 > 0.02) {
        ctx.lineWidth = 1;
        let off = 0;
        for (let li = 0; li < 3; li++) {
          const a0 = off;
          const a1 = off + COUNTS[li];
          const bE = a1 + COUNTS[li + 1];
          for (let a = a0; a < a1; a++) {
            for (let b = a1; b < bE; b++) {
              ctx.strokeStyle = `rgba(255,193,90,${(0.06 * w3).toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(layerNodes[a][0], layerNodes[a][1]);
              ctx.lineTo(layerNodes[b][0], layerNodes[b][1]);
              ctx.stroke();
            }
          }
          off = a1;
        }
      }
      const w4 = bell(4, P);
      if (w4 > 0.02) {
        ctx.lineWidth = 1;
        for (let a = 0; a < 16; a++) {
          for (let b = a + 1; b < 16; b++) {
            ctx.strokeStyle = `rgba(130,190,255,${(0.06 * w4).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(ringAnchors[a][0], ringAnchors[a][1]);
            ctx.lineTo(ringAnchors[b][0], ringAnchors[b][1]);
            ctx.stroke();
          }
        }
      }

      // the one pool — tiny ADDITIVE dots morphing between layouts (brighter for contrast)
      const c0 = COLS[k];
      const c1 = COLS[next];
      const cr = Math.round(c0[0] + (c1[0] - c0[0]) * e);
      const cg = Math.round(c0[1] + (c1[1] - c0[1]) * e);
      const cb = Math.round(c0[2] + (c1[2] - c0[2]) * e);
      const w2 = bell(2, P); // "hot" motes pulse on the counting grid
      const t0 = T[k];
      const t1 = T[next];
      for (let i = 0; i < N; i++) {
        const x = t0[i * 2] + (t1[i * 2] - t0[i * 2]) * e;
        const y = t0[i * 2 + 1] + (t1[i * 2 + 1] - t0[i * 2 + 1]) * e;
        let sz = 1.5;
        let al = 0.7;
        if (w2 > 0 && hot[i]) {
          sz += 1.8 * w2;
          al += 0.3 * w2;
        }
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${(al > 1 ? 1 : al).toFixed(2)})`;
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
      ctx.globalCompositeOperation = "source-over";

      // hoy — the written sentence types itself out beside the cursor
      if (P > 4.5) {
        const tt = clamp01((P - 4.55) / 0.4);
        const sentence = t("lm0.eras.sentence");
        const nch = Math.floor(tt * sentence.length);
        ctx.font = "15px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "rgba(240,243,236,0.96)";
        ctx.fillText(sentence.slice(0, nch), CX - W * 0.2 + 12, CY + 4);
      }
    };

    const render = () => {
      const st = frameRef.current;
      if (!st || st.beat !== "eras") return;
      // compress the eras into the first ~0.58 of the beat so the sentence finishes
      // and HOLDS before the CRT power-off begins.
      const g = clamp01(st.local / 0.58);
      const P = g * 5;
      draw(P, performance.now() / 1000);
      // The canvas has 6 visual states (the extra one is the corpus, part of "el cero")
      // but the narration has 5. Map each narration span so its text shows while its
      // matching structure is SETTLED (grid@P2 · net@P3 · ring@P4 · cursor@P5).
      let seg: number;
      let e0: number;
      if (P < 1.5) {
        seg = 0; // cero — point → corpus dust
        e0 = P / 1.5;
      } else if (P < 2.5) {
        seg = 1; // contar — the grid
        e0 = P - 1.5;
      } else if (P < 3.5) {
        seg = 2; // aprender — the network
        e0 = P - 2.5;
      } else if (P < 4.3) {
        seg = 3; // atención — the ring
        e0 = (P - 3.5) / 0.8;
      } else {
        seg = 4; // actualidad — the cursor + sentence
        e0 = (P - 4.3) / 0.7;
      }
      writeText(seg, clamp01(e0));
    };
    gsap.ticker.add(render);
    return () => {
      gsap.ticker.remove(render);
      ro.disconnect();
    };
  }, [frameRef, t]);

  return (
    <div className="lm0-eras">
      <canvas ref={cvRef} className="lm0-eras-cv" aria-hidden="true" />
      <div className="lm0-eras-text">
        <div ref={tagRef} className="lm0-eras-tag" aria-hidden="true" />
        <div ref={l1Ref} className="lm0-eras-l1 lm0-voice-font" aria-hidden="true" />
        <div ref={l2Ref} className="lm0-eras-l2 lm0-voice-font" aria-hidden="true" />
        <div ref={l3Ref} className="lm0-eras-l3 lm0-voice-font" aria-hidden="true" />
      </div>
    </div>
  );
}
