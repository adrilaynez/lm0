/**
 * babbler — the deterministic voice of the baby machine.
 *
 * Pure TS (no React, no DOM). Every take shown on screen is REAL output of the
 * real n-gram engine (`trainableModel`); direction happens only through seeds,
 * temperature and re-rolls — "documental, no improvisación" (spec v3 §4.5).
 *
 * Determinism contract: `generate(locale, bucket, attempt)` is a pure function of
 * its arguments. Models are cached per (locale, k) and re-fed incrementally on
 * forward scroll; asking for a SMALLER prefix rebuilds from zero — the model
 * genuinely forgets when the visitor scrolls back.
 */

import {
  foldText,
  makeRng,
  sampleNext,
  seedFrom,
  TRAIN_ALPHABET,
  TrainedModel,
} from "@/features/lab/data/trainableModel";

import { BABBLE_BLACKLIST } from "../data/blacklist";
import { corpusEn } from "../data/corpus.en";
import { corpusEs } from "../data/corpus.es";
import { type BabbleStage, BUCKETS, LADDER, type LadderRung } from "../data/script";

export type BabbleLocale = "es" | "en";

/** Far above any landing corpus — folding must never truncate. */
const FOLD_CAP = 1_000_000;
/** Length of one take (chars). Short enough to read in a beat, long enough to judge. */
const OUTPUT_CHARS = 64;
/** Re-roll budget when a take hits the blacklist. */
const MAX_REROLLS = 6;

const CORPORA = { es: corpusEs, en: corpusEn } as const;

const streams = new Map<BabbleLocale, string>();

/** The folded 27-letter stream the models read (memoized per locale). */
export function streamFor(locale: BabbleLocale): string {
  let s = streams.get(locale);
  if (s === undefined) {
    s = foldText(CORPORA[locale].raw, FOLD_CAP).stream;
    streams.set(locale, s);
  }
  return s;
}

/** How many chars of the stream bucket b has read: (b+1)/BUCKETS of the corpus. */
export function prefixFor(locale: BabbleLocale, bucket: number): number {
  const stream = streamFor(locale);
  const b = clampBucket(bucket);
  return Math.round((stream.length * (b + 1)) / BUCKETS);
}

function clampBucket(bucket: number): number {
  return Math.max(0, Math.min(BUCKETS - 1, Math.floor(bucket)));
}

interface ModelSlot {
  model: TrainedModel;
  fedTo: number;
}

const slots = new Map<string, ModelSlot>();

/**
 * The model for (locale, k) fed exactly `prefix` chars. Forward = incremental
 * feedRange (counts are additive, so chunked feeding ≡ one-shot feeding);
 * backward = rebuild from zero (real forgetting). Either path lands on the
 * identical state for a given prefix.
 */
function modelFor(locale: BabbleLocale, k: LadderRung["k"], prefix: number): TrainedModel {
  const key = `${locale}|${k}`;
  let slot = slots.get(key);
  if (!slot || slot.fedTo > prefix) {
    slot = { model: new TrainedModel(k), fedTo: 0 };
    slots.set(key, slot);
  }
  if (slot.fedTo < prefix) {
    slot.model.feedRange(streamFor(locale), slot.fedTo, prefix);
    slot.fedTo = prefix;
  }
  return slot.model;
}

export interface BabbleTake {
  /** the take itself — folded alphabet, single spaces. */
  text: string;
  stage: BabbleStage;
  k: LadderRung["k"];
  temperature: number;
  bucket: number;
  /** >0 when earlier takes were re-rolled by the blacklist. */
  attempt: number;
}

/** One real take of the model at this point of the scroll. Deterministic. */
export function generate(
  locale: BabbleLocale,
  bucket: number,
  attempt = 0,
  blacklist: readonly string[] = BABBLE_BLACKLIST[locale],
): BabbleTake {
  const b = clampBucket(bucket);
  const rung = LADDER[b];
  const temperature = Math.max(0.5, rung.temperature);
  const model = modelFor(locale, rung.k, prefixFor(locale, b));
  const rng = makeRng(seedFrom(`${locale}|${b}|${attempt}`));

  let text = model.randomContext(rng) ?? "";
  while (text.length < OUTPUT_CHARS) {
    const step = sampleNext(model, text, temperature, rng);
    if (!step) break;
    text += step.ch;
  }
  text = text.trim().replace(/ {2,}/g, " ");

  if (attempt < MAX_REROLLS && blacklist.some((w) => text.includes(w))) {
    return generate(locale, bucket, attempt + 1, blacklist);
  }
  return { text, stage: rung.stage, k: rung.k, temperature, bucket: b, attempt };
}

/**
 * The broken machine's morralla (beat 2): the model BEFORE training knows nothing,
 * i.e. a uniform prior over the 27-symbol alphabet. Real, seeded, honest.
 */
export function brokenSample(locale: BabbleLocale, attempt = 0): string {
  const rng = makeRng(seedFrom(`${locale}|broken|${attempt}`));
  let out = "";
  for (let i = 0; i < 18; i++) {
    out += TRAIN_ALPHABET[Math.floor(rng() * TRAIN_ALPHABET.length)];
  }
  return out.trim().replace(/ {2,}/g, " ");
}

/** Drop every cached model (full reset — e.g. locale switch in dev). */
export function resetBabbler(): void {
  slots.clear();
}
