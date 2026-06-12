/**
 * script — the directed "screenplay" data of the training beat: the babble ladder.
 *
 * 24 buckets span the training segment of the scroll. Each bucket fixes how much
 * corpus the model has read (its prefix), how much memory it gets (k) and how
 * daring the sampling is (temperature). The five qualitative escalones the visitor
 * recognises (frequencies → invented syllables → real words → weird order →
 * memorized phrase) FALL OUT of this ramp — none of them is scripted text.
 *
 * Temperature floor is 0.5: at T ≤ 0.1 sampleRow goes argmax and greedy chains
 * loop — the wall we deliberately do NOT show (outputs sí, mecanismos no).
 */

export const BUCKETS = 24;

export type BabbleStage = "frequencies" | "syllables" | "words" | "weirdOrder" | "memorized";

export interface LadderRung {
  /** memory the model gets at this point of the scroll (1–5 letters of context). */
  k: 1 | 2 | 3 | 4 | 5;
  /** sampling temperature (≥ 0.5 — see note above). */
  temperature: number;
  /** which escalón this rung belongs to (drives labels + tests, not the output). */
  stage: BabbleStage;
}

function rungs(
  n: number,
  k: LadderRung["k"],
  temperature: number,
  stage: BabbleStage,
): LadderRung[] {
  return Array.from({ length: n }, () => ({ k, temperature, stage }));
}

/** One rung per bucket. k only ever grows; temperature only ever drops. */
export const LADDER: readonly LadderRung[] = [
  ...rungs(5, 1, 1.3, "frequencies"),
  ...rungs(5, 2, 1.1, "syllables"),
  ...rungs(5, 3, 0.9, "words"),
  ...rungs(5, 4, 0.75, "weirdOrder"),
  ...rungs(4, 5, 0.6, "memorized"),
];
