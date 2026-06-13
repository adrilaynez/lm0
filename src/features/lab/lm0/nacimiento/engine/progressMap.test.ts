import { describe, expect, it } from "vitest";

import { BUCKETS } from "../data/script";

import { BEAT_ORDER, beatStart, ERA_COUNT, remapProgress, SEGMENTS, smooth01 } from "./progressMap";

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
    expect(remapProgress(1).beat).toBe("eras");
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
    let prev = 0;
    for (let i = 0; i <= 2000; i++) {
      const g = remapProgress(i / 2000).gear;
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
  });

  it("eras index advances 0→4 and stays parked elsewhere", () => {
    const start = beatStart("eras");
    const seen = new Set<number>();
    let prev = 0;
    for (let i = 0; i <= 2000; i++) {
      const raw = start + (1 - start) * (i / 2000);
      const s = remapProgress(raw);
      seen.add(s.eraIdx);
      expect(s.eraIdx).toBeGreaterThanOrEqual(prev);
      prev = s.eraIdx;
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
    expect(remapProgress(1).eraIdx).toBe(ERA_COUNT - 1);
    for (const b of ["hero", "training", "silence", "voice"] as const) {
      expect(remapProgress(beatStart(b) + SEGMENTS[b] / 2).eraIdx).toBe(0);
    }
  });
});

describe("smooth01", () => {
  it("clamps and has flat ends", () => {
    expect(smooth01(-1)).toBe(0);
    expect(smooth01(2)).toBe(1);
    expect(smooth01(0.5)).toBeCloseTo(0.5, 10);
    expect(smooth01(0.01) - smooth01(0)).toBeLessThan(0.001);
    expect(smooth01(1) - smooth01(0.99)).toBeLessThan(0.001);
  });
});
