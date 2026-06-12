import { describe, expect, it } from "vitest";

import { foldText } from "@/features/lab/data/trainableModel";

import { corpusEn } from "./corpus.en";
import { corpusEs } from "./corpus.es";
import type { Corpus } from "./corpusTypes";

const CAP = 1_000_000; // far above any landing corpus; truncation must never trigger

function foldPhrase(phrase: string): string {
  return foldText(phrase, CAP).stream;
}

describe.each([
  ["es", corpusEs],
  ["en", corpusEn],
] as const)("landing corpus %s", (locale, corpus: Corpus) => {
  it("stays within the packaging budget (8k–30k chars)", () => {
    expect(corpus.raw.length).toBeGreaterThanOrEqual(8_000);
    expect(corpus.raw.length).toBeLessThanOrEqual(30_000);
  });

  it("folds cleanly onto the 27-letter alphabet", () => {
    const { stream, report } = foldText(corpus.raw, CAP);
    expect(report.truncated).toBe(false);
    expect(stream.length).toBeGreaterThan(0);
    // mostly letters — a corpus that folds away into spaces would starve the model
    expect(report.letters / corpus.raw.length).toBeGreaterThan(0.7);
  });

  it("contains the memorized phrase after folding", () => {
    const { stream } = foldText(corpus.raw, CAP);
    expect(stream).toContain(foldPhrase(corpus.memorizedPhrase));
  });

  it("carries an attribution for the colophon", () => {
    expect(corpus.attribution.length).toBeGreaterThan(10);
  });
});

describe("locale flavour", () => {
  it("es corpus actually folds accents (it is real Spanish)", () => {
    const { report } = foldText(corpusEs.raw, CAP);
    expect(report.accentsFolded).toBeGreaterThan(50);
  });

  it("en memorized phrase is the soliloquy", () => {
    expect(corpusEn.memorizedPhrase).toBe("to be, or not to be, that is the question");
  });
});
