/**
 * trainableModel — the pure engine behind the "entrena tu propio modelo" playgrounds
 * (TrainBigramLab / TrainNgramLab). No React, no DOM.
 *
 * The user pastes ARBITRARY text (up to several million chars — a whole book), we fold it onto the
 * chapters' canonical 27-symbol alphabet (space + a–z) and count (k+1)-grams over the folded stream,
 * exactly like `ngramData.ts` does over Shakespeare — but STREAMING (feedRange) so a UI can animate
 * the read and never block the main thread.
 *
 * Folding is smarter than `normalizeNgram` so Spanish text survives: NFD + strip diacritics (á→a,
 * ñ→n, ü→u), lowercase, anything else → space, collapse runs. The fold is REPORTED (counts of
 * accents folded / symbols dropped) so the UI can be honest about what the model actually reads.
 *
 * Memory model: `Map<context, Uint32Array(27)>` ≈ ~300 B per distinct context. That is what bounds
 * the maximum text per memory level k — see CHAR_CAPS. Besides level k we also count k'=1 and the
 * unigram (k'=0), both tiny, so generation can BACK OFF honestly when a context was never seen.
 */

/** The canonical 27-symbol alphabet: index 0 = space, 1..26 = a..z (same as both chapters). */
export const TRAIN_ALPHABET: string[] = " abcdefghijklmnopqrstuvwxyz".split("");
export const VOCAB = 27;

/** Space renders as ␣ everywhere (same glyph as the kits). */
export function displayChar(c: string): string {
  return c === " " ? "␣" : c;
}

/** alphabet index of a folded char (assumes already-folded input: space or a–z). */
export function charIdx(c: string): number {
  return c === " " ? 0 : c.charCodeAt(0) - 96;
}

/**
 * Honest per-level text caps (chars). The binding constraint is distinct contexts in RAM
 * (`Map<string, Uint32Array(27)>`): k≤2 is structurally bounded (≤729 rows), k=5 on a huge book can
 * reach hundreds of thousands of rows. Longer pastes are TRUNCATED with a notice, never rejected.
 */
export const CHAR_CAPS: Record<number, number> = {
  1: 12_000_000,
  2: 12_000_000,
  3: 8_000_000,
  4: 5_000_000,
  5: 2_000_000,
};

export interface FoldReport {
  /** chars of the original input that were read (≤ cap). */
  rawLength: number;
  /** true if the paste was longer than the cap and got cut. */
  truncated: boolean;
  /** letters that only needed lowercasing (or were already a–z). */
  letters: number;
  /** accented letters folded to their base (á→a, ñ→n…). */
  accentsFolded: number;
  /** chars that became a space (digits, punctuation, newlines… runs collapsed). */
  toSpace: number;
}

/** Fold arbitrary text onto the 27-symbol alphabet. Returns the stream the model will read. */
export function foldText(raw: string, cap: number): { stream: string; report: FoldReport } {
  const truncated = raw.length > cap;
  const src = (truncated ? raw.slice(0, cap) : raw).normalize("NFD").toLowerCase();
  const parts: string[] = [];
  let buf = "";
  let letters = 0;
  let accentsFolded = 0;
  let toSpace = 0;
  let prevSpace = true; // leading spaces collapse away
  let prevWasLetter = false;
  for (let i = 0; i < src.length; i++) {
    const code = src.charCodeAt(i);
    if (code >= 97 && code <= 122) {
      buf += src[i];
      letters++;
      prevSpace = false;
      prevWasLetter = true;
    } else if (code >= 0x300 && code <= 0x36f) {
      // combining mark from NFD (the accent of á/ñ/ü…) — drop it, keep the base letter
      if (prevWasLetter) accentsFolded++;
    } else {
      if (!prevSpace) buf += " ";
      prevSpace = true;
      prevWasLetter = false;
      toSpace++;
    }
    if (buf.length >= 65536) {
      parts.push(buf);
      buf = "";
    }
  }
  parts.push(buf);
  let stream = parts.join("");
  if (stream.endsWith(" ")) stream = stream.slice(0, -1);
  return { stream, report: { rawLength: src.length, truncated, letters, accentsFolded, toSpace } };
}

/**
 * A char-level n-gram model with k letters of memory, trained INCREMENTALLY over a folded stream.
 * Counts level k plus the backoff levels 1 and 0 (both tiny), so sampling never dead-ends silently.
 */
export class TrainedModel {
  readonly k: number;
  /** level-k rows: context (k chars) → counts over the 27 next-chars. */
  readonly counts = new Map<string, Uint32Array>();
  /** backoff: single-char context rows (27 × 27, only if k > 1). */
  readonly counts1 = new Map<string, Uint32Array>();
  /** backoff of last resort: distribution over all chars seen. */
  readonly counts0 = new Uint32Array(VOCAB);
  totalNgrams = 0;

  private _topCache: { ctx: string; total: number }[] | null = null;
  private _keysCache: string[] | null = null;

  constructor(k: number) {
    this.k = Math.max(1, Math.min(5, Math.floor(k)));
  }

  /**
   * Count the windows whose NEXT char lies in [from, to) of `stream`. Call with contiguous,
   * increasing ranges over the SAME stream (the UI's chunked read loop). O(to − from).
   */
  feedRange(stream: string, from: number, to: number): void {
    const k = this.k;
    const start = Math.max(from, k);
    const end = Math.min(to, stream.length);
    for (let i = start; i < end; i++) {
      const ctx = stream.slice(i - k, i);
      let row = this.counts.get(ctx);
      if (!row) {
        row = new Uint32Array(VOCAB);
        this.counts.set(ctx, row);
      }
      const idx = charIdx(stream[i]);
      row[idx]++;
      this.counts0[idx]++;
      if (k > 1) {
        const c1 = stream[i - 1];
        let row1 = this.counts1.get(c1);
        if (!row1) {
          row1 = new Uint32Array(VOCAB);
          this.counts1.set(c1, row1);
        }
        row1[idx]++;
      }
      this.totalNgrams++;
    }
    this._topCache = null;
    this._keysCache = null;
  }

  /** The level-k row for a context, or null if never seen. */
  row(ctx: string): Uint32Array | null {
    return this.counts.get(ctx) ?? null;
  }

  /** How many distinct level-k contexts were observed. */
  get observedContexts(): number {
    return this.counts.size;
  }

  /** 27^k — how many contexts COULD exist (the sparsity denominator). */
  get contextSpace(): number {
    return Math.pow(VOCAB, this.k);
  }

  /** Most frequent contexts (by row total), heaviest first. Computed once, cached. */
  topContexts(n: number): { ctx: string; total: number }[] {
    if (!this._topCache) {
      const all: { ctx: string; total: number }[] = [];
      for (const [ctx, row] of this.counts) all.push({ ctx, total: rowTotal(row) });
      all.sort((a, b) => b.total - a.total);
      this._topCache = all.slice(0, 64);
    }
    return this._topCache.slice(0, n);
  }

  /** A random OBSERVED context (for "fila al azar"). */
  randomContext(rng: () => number): string | null {
    if (this.counts.size === 0) return null;
    if (!this._keysCache) this._keysCache = Array.from(this.counts.keys());
    return this._keysCache[Math.floor(rng() * this._keysCache.length)];
  }
}

/** Sum of a count row. */
export function rowTotal(row: Uint32Array): number {
  let t = 0;
  for (let i = 0; i < row.length; i++) t += row[i];
  return t;
}

/** argmax index of a row (first max wins, like the chapters' argmaxRow). */
export function rowArgmax(row: Uint32Array): number {
  let best = 0;
  for (let i = 1; i < row.length; i++) if (row[i] > row[best]) best = i;
  return best;
}

/**
 * Sample a column from a count row with temperature. T ≤ 0.1 → argmax (the "always max" loop the
 * bigram chapter teaches); T = 1 → faithful to the counts; T > 1 → flattened toward chaos.
 * Weights are p^(1/T) renormalized, exactly like ngramData.sampleNext.
 */
export function sampleRow(row: Uint32Array, temperature: number, rng: () => number): number {
  const total = rowTotal(row);
  if (total === 0) return -1;
  if (temperature <= 0.1) return rowArgmax(row);
  const inv = 1 / temperature;
  let sum = 0;
  const weights = new Float64Array(row.length);
  for (let i = 0; i < row.length; i++) {
    if (row[i] > 0) {
      const w = Math.pow(row[i] / total, inv);
      weights[i] = w;
      sum += w;
    }
  }
  let r = rng() * sum;
  let last = 0;
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] <= 0) continue;
    last = i;
    r -= weights[i];
    if (r <= 0) return i;
  }
  return last;
}

export interface SampleStep {
  /** the char picked. */
  ch: string;
  /** its alphabet index. */
  idx: number;
  /** the context whose row actually produced it ("" = unigram). */
  usedCtx: string;
  /** memory actually used (k, 1, or 0). k means no backoff happened. */
  usedK: number;
}

/**
 * Sample the next char after `context` (the last k chars of the text so far), backing off
 * k → 1 → 0 when a row was never seen. Never returns null once ANY char was trained.
 */
export function sampleNext(
  model: TrainedModel,
  context: string,
  temperature: number,
  rng: () => number,
): SampleStep | null {
  const k = model.k;
  const tryRows: { row: Uint32Array | null; ctx: string; usedK: number }[] = [
    {
      row: context.length >= k ? model.row(context.slice(-k)) : null,
      ctx: context.slice(-k),
      usedK: k,
    },
  ];
  if (k > 1 && context.length >= 1) {
    tryRows.push({
      row: model.counts1.get(context.slice(-1)) ?? null,
      ctx: context.slice(-1),
      usedK: 1,
    });
  }
  tryRows.push({ row: model.counts0, ctx: "", usedK: 0 });
  for (const { row, ctx, usedK } of tryRows) {
    if (!row) continue;
    const idx = sampleRow(row, temperature, rng);
    if (idx >= 0) return { ch: TRAIN_ALPHABET[idx], idx, usedCtx: ctx, usedK };
  }
  return null;
}

/** Small deterministic RNG (LCG) — reproducible runs under reduced motion (same as ngramData). */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** FNV-1a hash → RNG seed from a string. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** "1.234.567" — the chapters' es-style thousands grouping, locale-independent. */
export function fmtInt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
