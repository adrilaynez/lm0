/**
 * ngramData — local, REAL n-gram counts over the Shakespeare corpus (no backend).
 *
 * The N-gram chapter's narrative widgets run in the `/lab/bench` (which has no backend) and must show
 * TRUE numbers, exactly like the bigram chapter's narrative reads from local data modules. This module
 * counts n-grams on the client over `SHAKESPEARE_TEXT`, with the SAME normalization the bigram chapter
 * used, so the k=1 (bigram) counts are byte-identical to `bigramShakespeare27.MATRIX_27_COUNTS` (validated
 * by `validateAgainstBigram()`).
 *
 * Vocabulary: the 27 symbols [space, a–z]. "k letras de memoria" = the model looks at the last k letters
 * to predict the next (context length k). bigram = k=1, trigram = k=2, 4-gram = k=3, 5-gram = k=4. The
 * number of POSSIBLE contexts at level k is 27^k (that's the chapter's "explosion": 27, 729, 19 683,
 * 531 441…). Counting is sparse (Map<context, Map<next, count>>) so even k=4 is a few MB and <50 ms.
 *
 * Normalization (must match bigram exactly): lowercase, map every char NOT in [a-z] to a space, collapse
 * runs of spaces to one. Then count adjacent (k+1)-grams over that stream (space is a normal symbol; only
 * space→space pairs vanish, which is what the bigram precompute did too).
 */

import { ALPHA_27, MATRIX_27_COUNTS } from "./bigramShakespeare27";
import { SHAKESPEARE_TEXT } from "./shakespeareText";

/** The fixed 27-symbol alphabet: index 0 = space, 1..26 = a..z. */
export const NGRAM_ALPHABET: string[] = " abcdefghijklmnopqrstuvwxyz".split("");
const IN_ALPHABET = new Set(NGRAM_ALPHABET);

/** Space renders as ␣ everywhere (same glyph as the kit). */
export function displayChar(c: string): string {
  return c === " " ? "␣" : c;
}

/**
 * Fold arbitrary text onto the 27-symbol alphabet: lowercase, non-[a-z] → space, collapse spaces.
 * Matches the offline rule documented in bigramShakespeare27.ts so k=1 counts line up.
 */
export function normalizeNgram(text: string): string {
  let out = "";
  let prevSpace = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i].toLowerCase();
    const isLetter = c >= "a" && c <= "z";
    if (isLetter) {
      out += c;
      prevSpace = false;
    } else {
      // any non-letter (space, newline, punctuation, digit) folds to a single space
      if (!prevSpace) out += " ";
      prevSpace = true;
    }
  }
  return out;
}

/** The corpus, normalized once (the stream every count is taken over). */
let _stream: string | null = null;
export function ngramStream(): string {
  if (_stream === null) _stream = normalizeNgram(SHAKESPEARE_TEXT);
  return _stream;
}

/** context (length k) → (next char → count). k=0 means the single empty context "" (unigram). */
export type NextCounts = Map<string, number>;
export type NgramCounts = Map<string, NextCounts>;

const _countsCache = new Map<number, NgramCounts>();

/**
 * Build (memoized) the sparse counts for context length k: for every k-char window seen in the stream,
 * the distribution over the char that followed it. O(corpus). k=0 → one entry keyed "".
 */
export function getCounts(k: number): NgramCounts {
  const cached = _countsCache.get(k);
  if (cached) return cached;

  const s = ngramStream();
  const counts: NgramCounts = new Map();
  for (let i = k; i < s.length; i++) {
    const ctx = k === 0 ? "" : s.slice(i - k, i);
    const next = s[i];
    let row = counts.get(ctx);
    if (!row) {
      row = new Map();
      counts.set(ctx, row);
    }
    row.set(next, (row.get(next) ?? 0) + 1);
  }
  _countsCache.set(k, counts);
  return counts;
}

export interface Follower {
  ch: string;
  count: number;
  prob: number;
}

/**
 * Light distinct-context stats for level k (a Set of contexts, no follower maps) — cheaper than getCounts
 * for high k, which is all the sparsity view needs. distinct = how many k-char contexts actually appear.
 */
const _statsCache = new Map<number, { distinct: number; total: number }>();
export function contextStats(k: number): { distinct: number; total: number } {
  const cached = _statsCache.get(k);
  if (cached) return cached;
  const s = ngramStream();
  const set = new Set<string>();
  let totalN = 0;
  for (let i = k; i < s.length; i++) {
    set.add(s.slice(i - k, i));
    totalN++;
  }
  const r = { distinct: set.size, total: totalN };
  _statsCache.set(k, r);
  return r;
}

/**
 * Distribution after ONE specific context, found by a single linear scan of the stream (no full getCounts
 * map). Use for high-k probes (the §6 seen-vs-unseen demos) where only a couple of contexts are queried —
 * avoids materializing the entire k-gram table. Returns null if the context never occurs.
 */
export function scanContext(context: string): { followers: Follower[]; total: number } | null {
  const k = context.length;
  if (k === 0) return contextDistribution(0, "");
  const s = ngramStream();
  const row = new Map<string, number>();
  let total = 0;
  for (let i = k; i < s.length; i++) {
    if (s[i - k] === context[0] && s.slice(i - k, i) === context) {
      const ch = s[i];
      row.set(ch, (row.get(ch) ?? 0) + 1);
      total++;
    }
  }
  if (total === 0) return null;
  const followers: Follower[] = [];
  for (const [ch, count] of row) followers.push({ ch, count, prob: count / total });
  followers.sort((a, b) => b.count - a.count);
  return { followers, total };
}

/** Row total (denominator) for a context, or 0 if unseen. */
export function contextTotal(k: number, context: string): number {
  const row = getCounts(k).get(context);
  if (!row) return 0;
  let t = 0;
  for (const v of row.values()) t += v;
  return t;
}

/**
 * The full distribution after `context` (length k), sorted biggest-first. `null` if the context was
 * NEVER seen — the honest "the machine has nothing to say" case the §6 widgets need.
 */
export function contextDistribution(
  k: number,
  context: string,
): { followers: Follower[]; total: number } | null {
  const row = getCounts(k).get(context);
  if (!row) return null;
  let total = 0;
  for (const v of row.values()) total += v;
  const followers: Follower[] = [];
  for (const [ch, count] of row) followers.push({ ch, count, prob: count / total });
  followers.sort((a, b) => b.count - a.count);
  return { followers, total };
}

/** Top-N followers of a context (sorted), or [] if unseen. */
export function topFollowers(k: number, context: string, topN: number): Follower[] {
  const d = contextDistribution(k, context);
  return d ? d.followers.slice(0, topN) : [];
}

/** A full 27-length count vector for a context (one slot per NGRAM_ALPHABET symbol), zeros if unseen. */
export function contextRow(k: number, context: string): number[] {
  const row = getCounts(k).get(context);
  return NGRAM_ALPHABET.map((c) => row?.get(c) ?? 0);
}

/**
 * Predict the char that follows `text[pos]` using k letters of memory: normalizes the prefix up to and
 * including `pos`, takes its last k chars as the context, and returns that context's distribution (or
 * null if unseen). Used by the §1 ContextWindow predict game over the real text.
 */
export function predictAt(
  text: string,
  pos: number,
  k: number,
): { context: string; followers: Follower[]; total: number } | null {
  const prefixNorm = normalizeNgram(text.slice(0, pos + 1));
  if (prefixNorm.length < k) return null;
  const context = k === 0 ? "" : prefixNorm.slice(prefixNorm.length - k);
  const d = contextDistribution(k, context);
  if (!d) return { context, followers: [], total: 0 };
  return { context, followers: d.followers, total: d.total };
}

/** Diagnostics for level k: possible vs observed contexts, sparsity (the chapter's wall). */
export interface NgramDiagnostics {
  k: number;
  vocab: number;
  contextSpace: number; // 27^k — how many contexts COULD exist
  observedContexts: number; // how many actually appeared
  sparsity: number; // 1 - observed/space  (≈1 means almost all empty)
  totalNgrams: number; // how many (k+1)-grams were counted
}

export function diagnostics(k: number): NgramDiagnostics {
  // contextStats (a Set) is far lighter than getCounts (Map of Maps) for high k, and gives the same
  // distinct-context count + total the diagnostics need.
  const { distinct, total } = contextStats(k);
  const space = Math.pow(NGRAM_ALPHABET.length, k);
  return {
    k,
    vocab: NGRAM_ALPHABET.length,
    contextSpace: space,
    observedContexts: distinct,
    sparsity: space > 0 ? 1 - distinct / space : 0,
    totalNgrams: total,
  };
}

/** Number of possible contexts at level k (27^k) — the explosion figure. No counting needed. */
export function contextSpace(k: number): number {
  return Math.pow(NGRAM_ALPHABET.length, k);
}

/**
 * Ordinal of a context among the 27^k possible contexts of its length, in lexicographic (base-27) order
 * over the alphabet (space=0, a=1 … z=26). This is the "row number" the §3/§4/§5 table-lens minimaps point
 * at ("row N of 27^k"). Non-alphabet chars fold to space; pass an already-normalized context for exact rows.
 */
export function contextIndex(context: string): number {
  const base = NGRAM_ALPHABET.length; // 27
  let idx = 0;
  for (let i = 0; i < context.length; i++) {
    const c = context[i];
    const pos = c === " " ? 0 : c >= "a" && c <= "z" ? c.charCodeAt(0) - 96 : 0;
    idx = idx * base + pos;
  }
  return idx;
}

/**
 * Sample one char from a context's distribution with temperature. Higher temp = flatter (more random),
 * temp→0 = argmax. Returns null if the context is unseen (so the caller can decide to back off or stop).
 */
function sampleNext(
  k: number,
  context: string,
  temperature: number,
  rng: () => number,
): string | null {
  const d = contextDistribution(k, context);
  if (!d || d.followers.length === 0) return null;
  if (temperature <= 0.01) return d.followers[0].ch; // argmax
  // re-weight probs by 1/temp, renormalize, sample
  const weights = d.followers.map((f) => Math.pow(f.prob, 1 / temperature));
  let sum = 0;
  for (const w of weights) sum += w;
  let r = rng() * sum;
  for (let i = 0; i < d.followers.length; i++) {
    r -= weights[i];
    if (r <= 0) return d.followers[i].ch;
  }
  return d.followers[d.followers.length - 1].ch;
}

export interface GenerateOptions {
  /** Letters of memory (context length). bigram = 1, trigram = 2, 4-gram = 3, 5-gram = 4. */
  k: number;
  length?: number; // chars to generate (default 220)
  temperature?: number; // default 0.85
  /** Back off to shorter context when the current one is unseen (default true; the model still flows). */
  backoff?: boolean;
  /** Deterministic seed for reproducible output (default Math-free LCG seeded from the prompt). */
  rngSeed?: number;
}

/** Small deterministic RNG (LCG) so generation is reproducible without Math.random. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generate text LOCALLY from the real counts, sampling char by char with k letters of memory. With
 * `backoff` the model drops to a shorter context when it hits something unseen (so it keeps writing);
 * the §3 battle uses this. The §6 widgets instead read `contextDistribution` directly to SHOW the
 * dead-end honestly. The output reads like gibberish at k=1 and almost-words at k=4 — that's the point.
 */
export function generateLocal(prompt: string, opts: GenerateOptions): string {
  const { k, length = 220, temperature = 0.85, backoff = true } = opts;
  const rng = makeRng(opts.rngSeed ?? seedFrom(prompt + "|" + k));

  let stream = normalizeNgram(prompt) || " ";
  const startLen = stream.length;

  for (let n = 0; n < length; n++) {
    let ch: string | null = null;
    for (let kk = Math.min(k, stream.length); kk >= 0 && ch === null; kk--) {
      const ctx = kk === 0 ? "" : stream.slice(stream.length - kk);
      ch = sampleNext(kk, ctx, temperature, rng);
      if (!backoff) break; // no backoff: a single miss ends the run (honest dead-end)
    }
    if (ch === null) break; // truly nothing (even unigram empty) — stop
    stream += ch;
  }
  return stream.slice(startLen ? startLen : 0);
}

/**
 * Dev validation: the k=1 counts here must equal the bigram chapter's precomputed MATRIX_27_COUNTS
 * (same corpus, same normalization). Returns the number of mismatching cells (0 = identical).
 */
export function validateAgainstBigram(): { mismatches: number; sample: string[] } {
  const counts = getCounts(1);
  const sample: string[] = [];
  let mismatches = 0;
  for (let r = 0; r < ALPHA_27.length; r++) {
    const ctx = ALPHA_27[r];
    const row = counts.get(ctx);
    for (let c = 0; c < ALPHA_27.length; c++) {
      const next = ALPHA_27[c];
      const got = row?.get(next) ?? 0;
      const want = MATRIX_27_COUNTS[r][c];
      if (got !== want) {
        mismatches++;
        if (sample.length < 12)
          sample.push(`[${displayChar(ctx)}→${displayChar(next)}] got ${got}, want ${want}`);
      }
    }
  }
  return { mismatches, sample };
}
