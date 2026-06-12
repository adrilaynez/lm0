/**
 * riverPainter — the corpus flowing INTO the machine's caret (spec §3.3).
 *
 * Canvas-only: the river is visual material, not content (the text-in-DOM law
 * covers what the visitor reads as content). Gear 0 draws real corpus words
 * tile by tile with the swallow highlight; gears 1-2 accelerate into rows of
 * light streaks. The offset is time-based (the river flows even at scroll
 * rest) but SPEED and visibility are pure functions of NacimientoState —
 * scrubbing back slows and fades it deterministically.
 */

import type { NacimientoState } from "../engine/progressMap";

/** next/font family names aren't public (v2 lesson §9.6) — real fallbacks only. */
const MONO = "13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const STREAK_THRESHOLD = 420;

interface WordTile {
  w: string;
  x: number;
  ww: number;
}

function hash01(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

export function paintGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
): void {
  if (alpha <= 0) return;
  const g = ctx.createRadialGradient(x, y, 2, x, y, radius);
  g.addColorStop(0, `rgba(242, 233, 216, ${alpha.toFixed(3)})`);
  g.addColorStop(1, "rgba(242, 233, 216, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export interface RiverPainter {
  /** drop the measured word cache (resize / font load). */
  invalidate(): void;
  paint(ctx: CanvasRenderingContext2D, w: number, h: number, st: NacimientoState, dt: number): void;
}

export function createRiverPainter(stream: string): RiverPainter {
  let tiles: WordTile[] | null = null;
  let loopW = 0;
  let offset = 0;

  function buildTiles(ctx: CanvasRenderingContext2D): void {
    ctx.font = MONO;
    const words = stream.split(" ").slice(0, 1400);
    tiles = [];
    let x = 0;
    for (const w of words) {
      const ww = ctx.measureText(`${w} `).width;
      tiles.push({ w, x, ww });
      x += ww;
    }
    loopW = x;
  }

  /** px/s — a pure function of the journey state. */
  function speedFor(st: NacimientoState): number {
    if (st.beat === "training") {
      const l = st.local;
      if (l < 0.3) return 70;
      if (l < 0.6) return 70 + ((l - 0.3) / 0.3) * 760;
      return 830 + Math.pow((l - 0.6) / 0.4, 1.6) * 2600;
    }
    if (st.beat === "silence") {
      return Math.max(0, 1 - st.local * 2.5) * 700;
    }
    return 0;
  }

  return {
    invalidate() {
      tiles = null;
    },
    paint(ctx, w, h, st, dt) {
      const speed = speedFor(st);
      if (speed <= 0) return;
      if (!tiles || loopW <= 0) buildTiles(ctx);
      if (!tiles || loopW <= 0) return;

      offset += speed * dt;
      const fade = st.beat === "silence" ? Math.max(0, 1 - st.local * 2.2) : 1;
      const eat = w * 0.5 - 6;
      const y = h * 0.42;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, eat, h);
      ctx.clip();

      if (speed < STREAK_THRESHOLD) {
        ctx.font = MONO;
        const off = offset % loopW;
        for (let tile = -1; tile <= 1; tile++) {
          const bx = -off + tile * loopW;
          for (const t of tiles) {
            const x = bx + t.x;
            if (x + t.ww < -20 || x > eat + 10) continue;
            const zone = x + t.ww > eat - 64;
            if (zone) {
              const pull = Math.min(1, Math.max(0, (x + t.ww - (eat - 64)) / 64));
              ctx.fillStyle = `rgba(242, 236, 220, ${((0.5 + pull * 0.45) * fade).toFixed(2)})`;
              ctx.fillRect(x - 2, y + 5, Math.max(0, t.ww - 8), 1.5);
              ctx.fillText(t.w, x, y - pull * 2);
            } else {
              ctx.fillStyle = `rgba(155, 232, 192, ${(0.5 * fade).toFixed(2)})`;
              ctx.fillText(t.w, x, y);
            }
          }
        }
      } else {
        const rows = 2 + Math.min(4, Math.floor((speed - STREAK_THRESHOLD) / 520));
        const ys = [0, -26, 26, -50, 50, -72];
        for (let r = 0; r < rows; r++) {
          const yy = y + ys[r];
          const a = (r === 0 ? 0.5 : 0.2) * fade;
          ctx.fillStyle = `rgba(155, 232, 192, ${a.toFixed(2)})`;
          const seed = offset * (1 - r * 0.06) + r * 317;
          let cell = Math.floor(seed / 46);
          let xx = -(seed % 46);
          while (xx < eat) {
            const len = 12 + hash01(cell * 3 + r) * 32;
            ctx.fillRect(xx, yy - 5, len, 2);
            xx += 46 + hash01(cell * 7 + r) * 18;
            cell++;
          }
        }
      }
      ctx.restore();

      // the machine's glow grows with what it eats
      paintGlow(
        ctx,
        eat + 6,
        y - 4,
        26 + Math.min(110, speed / 32),
        (0.05 + Math.min(0.3, speed / 8000)) * fade,
      );
    },
  };
}
