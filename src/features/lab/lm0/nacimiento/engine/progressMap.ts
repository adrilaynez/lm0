/* ─────────────────────────────────────────────
   LM0 v3 — engine/progressMap.ts
   The single source of truth of the scroll narrative: a PURE function
   raw progress (0..1) → typed NacimientoState. Deterministic and
   reversible by construction — scrubbing back replays the exact states.
   Everything downstream (DOM beats, the eras canvas, the babbler feeder)
   reads THIS, never the scrollbar.
   ───────────────────────────────────────────── */

import { BUCKETS } from "../data/script";

/** Scroll share of each beat, in page order. MUST sum to exactly 1.
    (hero = the unified composition: machine + title + broken cycle.
     The finale lives OUTSIDE the sticky stage, in normal document flow.) */
export const SEGMENTS = {
  hero: 0.18,
  training: 0.34,
  silence: 0.06,
  voice: 0.16,
  eras: 0.26,
} as const;

export type Beat = keyof typeof SEGMENTS;

export const BEAT_ORDER: readonly Beat[] = ["hero", "training", "silence", "voice", "eras"];

/** Where a beat starts, as a fraction of total scroll (for lenis.scrollTo targets). */
export function beatStart(beat: Beat): number {
  let acc = 0;
  for (const b of BEAT_ORDER) {
    if (b === beat) return acc;
    acc += SEGMENTS[b];
  }
  return acc;
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** smoothstep with clamped input — C1 at both ends (plateau edges settle, never brake). */
export function smooth01(x: number): number {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
}

/** Training gears: word-by-word read → fast → light streaks. */
export const GEAR_THRESHOLDS = { fast: 0.3, streaks: 0.6 } as const;

/** Sub-scenes of the eras beat (4 morph transitions between 5 states). */
export const ERA_COUNT = 5;

export interface NacimientoState {
  /** raw scroll progress, clamped 0..1. */
  raw: number;
  beat: Beat;
  /** 0..1 inside the current beat. */
  local: number;
  /** training only: 0 = word-by-word, 1 = fast, 2 = streaks. 2 stays after training. */
  gear: 0 | 1 | 2;
  /** which ladder bucket the model should be at (0..BUCKETS-1). Caps at the end of training. */
  bucket: number;
  /** eras beat: which era state the narration shows (0..4). 0 elsewhere. */
  eraIdx: number;
  /** the page-wide warm light — monotonic, luz = conocimiento. */
  dawn01: number;
}

const TRAINING_START = beatStart("training");

/** The pure remap. */
export function remapProgress(rawIn: number): NacimientoState {
  const raw = clamp01(rawIn);

  // locate the beat (half-open ranges; the last beat closes at 1 inclusive)
  let beat: Beat = BEAT_ORDER[BEAT_ORDER.length - 1];
  let local = 1;
  let acc = 0;
  for (const b of BEAT_ORDER) {
    const len = SEGMENTS[b];
    if (raw < acc + len || b === BEAT_ORDER[BEAT_ORDER.length - 1]) {
      beat = b;
      local = clamp01((raw - acc) / len);
      break;
    }
    acc += len;
  }
  if (raw === 1) local = 1; // float-accumulation guard: the journey ends exactly closed

  // training locals — bucket ramps with an eased read so escalones land on plateaus
  const trainLocal = clamp01((raw - TRAINING_START) / SEGMENTS.training);
  const bucket = Math.min(BUCKETS - 1, Math.floor(smooth01(trainLocal) * BUCKETS));
  const gear: 0 | 1 | 2 =
    trainLocal < GEAR_THRESHOLDS.fast ? 0 : trainLocal < GEAR_THRESHOLDS.streaks ? 1 : 2;

  // eras narration index: 5 states across the beat (matches the canvas morph)
  const eraIdx =
    beat === "eras" ? Math.max(0, Math.min(ERA_COUNT - 1, Math.round(local * (ERA_COUNT - 1)))) : 0;

  // dawn: 0 until the machine starts reading, then a single monotonic ease to 1
  const dawn01 = smooth01((raw - TRAINING_START) / (1 - TRAINING_START));

  return { raw, beat, local, gear, bucket, eraIdx, dawn01 };
}
