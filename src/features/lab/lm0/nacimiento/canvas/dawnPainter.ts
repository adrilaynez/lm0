/**
 * dawnPainter — the page-wide warm light: luz = conocimiento (spec §3.3).
 * The gradient is pre-rendered offscreen at resize; per frame it is composited
 * with alpha = dawn01. Cheap, cacheable, monotonic with the scroll.
 */

export interface DawnPainter {
  resize(w: number, h: number): void;
  paint(ctx: CanvasRenderingContext2D, dawn01: number): void;
}

export function createDawnPainter(): DawnPainter {
  let layer: HTMLCanvasElement | null = null;
  let lw = 0;
  let lh = 0;

  return {
    resize(w, h) {
      lw = Math.max(1, Math.round(w));
      lh = Math.max(1, Math.round(h));
      layer = document.createElement("canvas");
      layer.width = lw;
      layer.height = lh;
      const c = layer.getContext("2d");
      if (!c) return;
      const g = c.createRadialGradient(lw / 2, lh * 1.22, 10, lw / 2, lh * 1.22, lh * 1.15);
      g.addColorStop(0, "rgba(216, 166, 90, 0.55)");
      g.addColorStop(1, "rgba(216, 166, 90, 0)");
      c.fillStyle = g;
      c.fillRect(0, 0, lw, lh);
    },
    paint(ctx, dawn01) {
      if (!layer || dawn01 <= 0) return;
      ctx.save();
      ctx.globalAlpha = 0.3 * Math.min(1, dawn01);
      ctx.drawImage(layer, 0, 0, lw, lh);
      ctx.restore();
    },
  };
}
