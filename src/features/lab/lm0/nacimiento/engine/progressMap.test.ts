import { describe, expect, it } from "vitest";

import { BUCKETS } from "../data/script";

import { type Beat, BEAT_ORDER, beatStart, remapProgress, SEGMENTS, smooth01 } from "./progressMap";

describe("SEGMENTS", () => {
  it("sum to exactly 1", () => {
    const sum = Object.values(SEGMENTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("beatStart walks the order", () => {
    let acc = 0;
    for (const b of BEAT_ORDER) {
      expect(beatStart(b)).toBeCloseTo(acc, 10);
      acc += SEGMENTS[b];
    }
  });
});

describe("remapProgress", () => {
  it("hits each beat across its half-open range", () => {
    let acc = 0;
    for (const b of BEAT_ORDER) {
      expect(remapProgress(acc).beat).toBe(b);
      expect(remapProgress(acc + SEGMENTS[b] / 2).beat).toBe(b);
      acc += SEGMENTS[b];
    }
    expect(remapProgress(1).beat).toBe("camino");
    expect(remapProgress(1).local).toBe(1);
    expect(remapProgress(0).beat).toBe("hero");
  });

  it("clamps out-of-range raw", () => {
    expect(remapProgress(-1).raw).toBe(0);
    expect(remapProgress(2).raw).toBe(1);
  });

  it("keeps every local in [0,1] over a dense sweep", () => {
    for (let i = 0; i <= 2000; i++) {
      const s = remapProgress(i / 2000);
      expect(s.local).toBeGreaterThanOrEqual(0);
      expect(s.local).toBeLessThanOrEqual(1);
      expect(s.caminoLocal).toBeGreaterThanOrEqual(0);
      expect(s.caminoLocal).toBeLessThanOrEqual(1);
    }
  });

  it("dawn is 0 before reading, 1 at the end, and never decreases", () => {
    expect(remapProgress(0).dawn01).toBe(0);
    expect(remapProgress(beatStart("training")).dawn01).toBe(0);
    expect(remapProgress(1).dawn01).toBe(1);
    let prev = -1;
    for (let i = 0; i <= 5000; i++) {
      const d = remapProgress(i / 5000).dawn01;
      expect(d).toBeGreaterThanOrEqual(prev);
      prev = d;
    }
  });

  it("bucket ramps 0→23 across training and never decreases", () => {
    const start = beatStart("training");
    const end = start + SEGMENTS.training;
    expect(remapProgress(start).bucket).toBe(0);
    expect(remapProgress(end - 1e-6).bucket).toBe(BUCKETS - 1);
    let prev = -1;
    for (let i = 0; i <= 3000; i++) {
      const b = remapProgress(i / 3000).bucket;
      expect(b).toBeGreaterThanOrEqual(prev);
      expect(b).toBeLessThan(BUCKETS);
      prev = b;
    }
  });

  it("gears only shift up", () => {
    const order: Record<number, number> = { 0: 0, 1: 1, 2: 2 };
    let prev = 0;
    for (let i = 0; i <= 2000; i++) {
      const g = order[remapProgress(i / 2000).gear];
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
  });

  it("camino phases advance 0→3 with locals resetting", () => {
    const start = beatStart("camino");
    const phases = new Set<number>();
    let prev = 0;
    for (let i = 0; i <= 2000; i++) {
      const raw = start + (1 - start) * (i / 2000);
      const s = remapProgress(raw);
      phases.add(s.caminoPhase);
      expect(s.caminoPhase).toBeGreaterThanOrEqual(prev);
      prev = s.caminoPhase;
    }
    expect([...phases].sort()).toEqual([0, 1, 2, 3]);
    expect(remapProgress(1).caminoPhase).toBe(3);
    expect(remapProgress(1).caminoLocal).toBe(1);
  });

  it("outside camino the morph stays parked", () => {
    const beats: Beat[] = ["hero", "broken", "training", "silence", "voice", "dialogue"];
    for (const b of beats) {
      const s = remapProgress(beatStart(b) + SEGMENTS[b] / 2);
      expect(s.caminoPhase).toBe(0);
      expect(s.caminoLocal).toBe(0);
    }
  });
});

describe("smooth01", () => {
  it("clamps and has flat ends", () => {
    expect(smooth01(-1)).toBe(0);
    expect(smooth01(2)).toBe(1);
    expect(smooth01(0.5)).toBeCloseTo(0.5, 10);
    // derivative ~0 at the edges → settle, never brake
    expect(smooth01(0.01) - smooth01(0)).toBeLessThan(0.001);
    expect(smooth01(1) - smooth01(0.99)).toBeLessThan(0.001);
  });
});
