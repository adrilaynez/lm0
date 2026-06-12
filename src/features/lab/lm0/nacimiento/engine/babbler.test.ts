import { beforeEach, describe, expect, it } from "vitest";

import { BUCKETS, LADDER } from "../data/script";

import {
  type BabbleLocale,
  brokenSample,
  feedToward,
  generate,
  resetBabbler,
  streamFor,
  wordsRead,
} from "./babbler";

beforeEach(() => resetBabbler());

const ALPHABET_RE = /^[a-z ]+$/;

/** Words (≥3 chars) of `text` that exist verbatim in the folded corpus. */
function realWordRatio(locale: BabbleLocale, text: string): number {
  const vocab = new Set(
    streamFor(locale)
      .split(" ")
      .filter((w) => w.length >= 3),
  );
  const words = text.split(" ").filter((w) => w.length >= 3);
  if (words.length === 0) return 0;
  return words.filter((w) => vocab.has(w)).length / words.length;
}

/** Longest substring of `text` (windows of `len`) found verbatim in the corpus stream. */
function sharesSubstring(locale: BabbleLocale, text: string, len: number): boolean {
  const stream = streamFor(locale);
  for (let i = 0; i + len <= text.length; i++) {
    if (stream.includes(text.slice(i, i + len))) return true;
  }
  return false;
}

describe("the ladder (data/script)", () => {
  it("has one rung per bucket", () => {
    expect(LADDER.length).toBe(BUCKETS);
  });

  it("memory only grows, temperature only drops", () => {
    for (let i = 1; i < LADDER.length; i++) {
      expect(LADDER[i].k).toBeGreaterThanOrEqual(LADDER[i - 1].k);
      expect(LADDER[i].temperature).toBeLessThanOrEqual(LADDER[i - 1].temperature);
    }
  });

  it("covers the five escalones in order", () => {
    const stages = [...new Set(LADDER.map((r) => r.stage))];
    expect(stages).toEqual(["frequencies", "syllables", "words", "weirdOrder", "memorized"]);
  });

  it("never reaches the greedy-loop zone (T floor 0.5)", () => {
    for (const rung of LADDER) expect(rung.temperature).toBeGreaterThanOrEqual(0.5);
  });
});

describe.each(["es", "en"] as const)("babbler %s", (locale) => {
  it("is deterministic for the same (bucket, attempt)", () => {
    const a = generate(locale, 12);
    resetBabbler();
    const b = generate(locale, 12);
    expect(a).toEqual(b);
  });

  it("is scrub-stable: backward scroll lands on the identical model", () => {
    const fresh = generate(locale, 20).text;
    resetBabbler();
    generate(locale, 23); // scroll to the end…
    const rebuilt = generate(locale, 20).text; // …then back (forces rebuild)
    expect(rebuilt).toBe(fresh);
  });

  it("speaks only the 27-letter alphabet", () => {
    for (const bucket of [0, 5, 12, 19, 23]) {
      const take = generate(locale, bucket);
      expect(take.text).toMatch(ALPHABET_RE);
      expect(take.text.length).toBeGreaterThan(30);
    }
  });

  it("re-rolls takes that hit the blacklist", () => {
    const base = generate(locale, 8);
    const poisoned = generate(locale, 8, 0, [base.text.slice(0, 6)]);
    expect(poisoned.attempt).toBeGreaterThan(0);
    expect(poisoned.text).not.toBe(base.text);
  });

  it("early babble is proto-language, late babble is the book", () => {
    expect(realWordRatio(locale, generate(locale, 2).text)).toBeLessThan(0.6);
    expect(realWordRatio(locale, generate(locale, 22).text)).toBeGreaterThan(0.5);
    expect(sharesSubstring(locale, generate(locale, 22).text, 10)).toBe(true);
  });

  it("broken machine morralla is real untrained output (uniform prior)", () => {
    const a = brokenSample(locale);
    expect(a).toMatch(ALPHABET_RE);
    expect(a).toBe(brokenSample(locale));
    expect(brokenSample(locale, 1)).not.toBe(a);
  });

  it("feedToward is honest: monotonic, capped per step, converges on the target", () => {
    let prev = 0;
    let status = feedToward(locale, 5, 2000);
    for (let guard = 0; guard < 100 && status.fedTo < status.target; guard++) {
      expect(status.fedTo).toBeGreaterThan(prev);
      expect(status.fedTo - prev).toBeLessThanOrEqual(2000);
      expect(status.fedTo).toBeLessThanOrEqual(status.target);
      prev = status.fedTo;
      status = feedToward(locale, 5, 2000);
    }
    expect(status.fedTo).toBe(status.target);
  });

  it("a partially prefed model still produces the canonical take", () => {
    const fresh = generate(locale, 23).text;
    resetBabbler();
    feedToward(locale, 23, 500); // throttled choreography starts…
    expect(generate(locale, 23).text).toBe(fresh); // …generate completes the rest
  });

  it("wordsRead matches the folded stream's word count", () => {
    const stream = streamFor(locale);
    expect(wordsRead(locale, 0)).toBe(0);
    expect(wordsRead(locale, stream.length)).toBe(stream.split(" ").length);
    let prev = 0;
    for (let i = 0; i <= stream.length; i += 997) {
      const w = wordsRead(locale, i);
      expect(w).toBeGreaterThanOrEqual(prev);
      prev = w;
    }
  });
});

describe("the directed takes (one per escalón — eyeball these in review)", () => {
  it("es ladder", () => {
    expect(generate("es", 2).text).toMatchInlineSnapshot(
      `"ma es s elguezo flvo el esto equiguibale pellay eto erral asmaer"`,
    );
    expect(generate("es", 7).text).toMatchInlineSnapshot(
      `"spara y o nor el salmestarleernomas gracazonte iguscas lambres s"`,
    );
    expect(generate("es", 12).text).toMatchInlineSnapshot(
      `"e fuertos su famoso caballeria sembredia ninguna del caballego d"`,
    );
    expect(generate("es", 17).text).toMatchInlineSnapshot(
      `"ho esto que traidas que semejando fuera en todo aquella caso el"`,
    );
    expect(generate("es", 22).text).toMatchInlineSnapshot(
      `"o a roldan el mundo pueblo de la mancha el mundo busca porque en"`,
    );
  });

  it("en ladder", () => {
    expect(generate("en", 2).text).toMatchInlineSnapshot(
      `"heusth ter angrind d berswhirh athext prdonisiandiformam g tenng"`,
    );
    expect(generate("en", 7).text).toMatchInlineSnapshot(
      `"ky fritherous outleting th art throneemarbuting ack that buts ou"`,
    );
    expect(generate("en", 12).text).toMatchInlineSnapshot(
      `"k so pleavenst now ophelps a bad see to his dier deary poorseles"`,
    );
    expect(generate("en", 17).text).toMatchInlineSnapshot(
      `"hemself where hamlet not but yet do hamlet s visage and seen we"`,
    );
    expect(generate("en", 22).text).toMatchInlineSnapshot(
      `"e pregnant of his was declining on with give hue of nothing to l"`,
    );
  });
});
