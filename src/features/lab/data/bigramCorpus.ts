/**
 * bigramCorpus — REAL data for the Bigram chapter showpieces.
 *
 * Why this module exists: the showpieces (Caos y Orden, la matriz que crece leyendo, la máquina de
 * escribir) must SCAN real text and derive counts LIVE. Faking the climbing numbers is the exact
 * monotony we are rejecting. So we ship the text and count it on the client — the numbers the reader
 * watches climb are true.
 *
 * Coherence note: the corpus is English (a Shakespeare excerpt) so that "t" is followed by "h" most
 * of the time — the canonical payoff of §2. The NARRATIVE never names the language (doctrine N3): it
 * describes the *pattern* ("tras la t suele ir la h"), never "in English". The reader-facing examples
 * (manzana, HOLA MUNDO, fli fla) are the reader's own intuition, separate from this corpus.
 *
 * No dependencies, no DOM, deterministic. Matrices are computed once at module load from the text —
 * a single linear pass over a few KB, microseconds, so the data is provably real (derived from the
 * shipped text) instead of a stale hand-authored literal.
 */

import type { TransitionMatrixViz } from "@/features/lab/types/lmLab";

/* ════════════════════════════════════════════════════════════════════════
   1 · TEXT SAMPLES (public domain) — shipped so widgets scan real characters
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Lowercased, [a-z ] only, single-spaced. Source: Hamlet's soliloquy + Sonnet 18 (public domain).
 * Heavy in "th" words (the, that, this, thou, thee) so the t-row's winner is "h" — the §2 payoff.
 * Used by VIS 4 (Caos y Orden, scans t→*) and VIS 9 (27×27 grows while reading).
 */
export const SHAKESPEARE_SAMPLE: string =
    "to be or not to be that is the question whether tis nobler in the mind to suffer the slings and " +
    "arrows of outrageous fortune or to take arms against a sea of troubles and by opposing end them " +
    "to die to sleep no more and by a sleep to say we end the heartache and the thousand natural " +
    "shocks that flesh is heir to tis a consummation devoutly to be wished to die to sleep to sleep " +
    "perchance to dream ay theres the rub for in that sleep of death what dreams may come when we have " +
    "shuffled off this mortal coil must give us pause theres the respect that makes calamity of so " +
    "long life for who would bear the whips and scorns of time the oppressors wrong the proud mans " +
    "contumely the pangs of despised love the laws delay the insolence of office and the spurns that " +
    "patient merit of the unworthy takes when he himself might his quietus make with a bare bodkin " +
    "who would fardels bear to grunt and sweat under a weary life but that the dread of something " +
    "after death the undiscovered country from whose bourn no traveller returns puzzles the will and " +
    "makes us rather bear those ills we have than fly to others that we know not of thus conscience " +
    "does make cowards of us all shall i compare thee to a summers day thou art more lovely and more " +
    "temperate rough winds do shake the darling buds of may and summers lease hath all too short a " +
    "date sometime too hot the eye of heaven shines and often is his gold complexion dimmed and every " +
    "fair from fair sometime declines by chance or natures changing course untrimmed but thy eternal " +
    "summer shall not fade nor lose possession of that fair thou owest nor shall death brag thou " +
    "wanderst in his shade when in eternal lines to time thou growest so long as men can breathe or " +
    "eyes can see so long lives this and this gives life to thee";

/* ════════════════════════════════════════════════════════════════════════
   2 · ALPHABETS (fixed axes for the precomputed matrices)
   ════════════════════════════════════════════════════════════════════════ */

const LOWER = "abcdefghijklmnopqrstuvwxyz".split("");
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DIGITS = "0123456789".split("");
const PUNCT = ".,;:!?'\"()-—…/&%$#@*+=_<>[]«»".split(""); // 29 marks

/** 27 chars: space + a–z. The "small alphabet" the chapter starts with. */
export const ALPHABET_27: string[] = [" ", ...LOWER];

/** 92 chars: space + a–z + A–Z + 0–9 + 29 punctuation. The "real world" alphabet. */
export const ALPHABET_92: string[] = [" ", ...LOWER, ...UPPER, ...DIGITS, ...PUNCT];

export const SPACE_GLYPH = "␣";
export function displayChar(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}

/* ════════════════════════════════════════════════════════════════════════
   3 · PURE COUNTING HELPERS
   ════════════════════════════════════════════════════════════════════════ */

/** Count bigrams of `text` over a fixed `alphabet`. Chars outside the alphabet break the pair. */
export function buildCounts(text: string, alphabet: string[]): number[][] {
    const index = new Map(alphabet.map((c, i) => [c, i]));
    const n = alphabet.length;
    const counts: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    let prev = -1;
    for (const ch of text) {
        const i = index.get(ch);
        if (i === undefined) {
            prev = -1; // out-of-alphabet char (e.g. newline) breaks the adjacency
            continue;
        }
        if (prev !== -1) counts[prev][i] += 1;
        prev = i;
    }
    return counts;
}

/** Row-normalize counts into P(col | row) ∈ [0,1]. Empty rows stay all-zero (black cells). */
export function countsToViz(counts: number[][], alphabet: string[]): TransitionMatrixViz {
    const data = counts.map((row) => {
        const total = row.reduce((a, b) => a + b, 0);
        return total === 0 ? row.map(() => 0) : row.map((c) => c / total);
    });
    return { shape: [alphabet.length, alphabet.length], data, row_labels: alphabet, col_labels: alphabet };
}

export interface BigramMatrix {
    /** Row-normalized probabilities, ready for the canvas heatmap. */
    viz: TransitionMatrixViz;
    /** Raw integer counts, for the detective tooltip ("q→u ocurrió N veces"). */
    counts: number[][];
}

function buildMatrix(text: string, alphabet: string[]): BigramMatrix {
    const counts = buildCounts(text, alphabet);
    return { viz: countsToViz(counts, alphabet), counts };
}

/* ════════════════════════════════════════════════════════════════════════
   4 · PRECOMPUTED MATRICES (real, derived from the samples above)
   ════════════════════════════════════════════════════════════════════════ */

/** 27×27 from the Shakespeare sample. The end-state VIS 9 snaps to. */
export const MATRIX_27: BigramMatrix = buildMatrix(SHAKESPEARE_SAMPLE, ALPHABET_27);

/**
 * The detective table (VIS 10) no longer lives here. It now uses the backend's OWN training corpus
 * (Paul Graham essays) as real adjacency counts — see `bigramPaulGraham.ts` (`MATRIX_PG`,
 * `ALPHABET_PG`, `pgPairCount`). That gives honest integer counts ("N times"), true zeros (the dark
 * "deserts"), and clean patterns (q→u 100%), verified against `/dataset_lookup`.
 */

/** Look up the integer count for a pair in a precomputed matrix (detective tooltip). */
export function pairCount(m: BigramMatrix, row: string, col: string): number {
    const r = m.viz.row_labels.indexOf(row);
    const c = m.viz.col_labels.indexOf(col);
    return r === -1 || c === -1 ? 0 : m.counts[r][c];
}

/* ════════════════════════════════════════════════════════════════════════
   5 · LIVE STREAMING ACCUMULATOR — shared engine for VIS 4 and VIS 9
   The charset grows in first-seen order, so "a new follower adds a column"
   (VIS 4) and "a new char adds a row+column" (VIS 9) fall out of one place.
   ════════════════════════════════════════════════════════════════════════ */

export interface BigramAccumulator {
    charset: string[]; // distinct chars, first-seen order (grows as we scan)
    index: Map<string, number>;
    counts: number[][]; // square, grown to charset.length
    rowTotals: number[];
    total: number;
}

export function createAccumulator(): BigramAccumulator {
    return { charset: [], index: new Map(), counts: [], rowTotals: [], total: 0 };
}

function ensureChar(acc: BigramAccumulator, ch: string): boolean {
    if (acc.index.has(ch)) return false;
    acc.index.set(ch, acc.charset.length);
    acc.charset.push(ch);
    for (const row of acc.counts) row.push(0); // extend every existing row with the new column
    acc.counts.push(new Array(acc.charset.length).fill(0)); // new row, full current width
    acc.rowTotals.push(0);
    return true;
}

export interface FeedResult {
    newRow: boolean; // `prev` was first seen on this feed (a new origin row appeared)
    newCol: boolean; // `next` was first seen on this feed (a new follower column appeared)
    row: number;
    col: number;
    count: number; // running count for this exact pair
}

/** Feed one adjacency (prev → next). Returns what grew and the running count for the pair. */
export function feed(acc: BigramAccumulator, prev: string, next: string): FeedResult {
    const newRow = ensureChar(acc, prev);
    const newCol = ensureChar(acc, next);
    const row = acc.index.get(prev)!;
    const col = acc.index.get(next)!;
    acc.counts[row][col] += 1;
    acc.rowTotals[row] += 1;
    acc.total += 1;
    return { newRow, newCol, row, col, count: acc.counts[row][col] };
}

/** P(next | row) from the live accumulator. Empty row → 0. */
export function pct(acc: BigramAccumulator, row: number, col: number): number {
    const t = acc.rowTotals[row];
    return t ? acc.counts[row][col] / t : 0;
}

/* ════════════════════════════════════════════════════════════════════════
   6 · SCAN SCHEDULE — the "reading accelerates" idiom (shared, reduced-motion aware)
   Returns the delay (ms) before revealing character `i` of `total`, easing from
   slow (savor the first hits) to fast (blur to the finish). Pure, no rAF here.
   ════════════════════════════════════════════════════════════════════════ */

export function scanDelay(i: number, total: number, opts?: { first?: number; last?: number; ease?: number }): number {
    const first = opts?.first ?? 280;
    const last = opts?.last ?? 12;
    const ease = opts?.ease ?? 2.6;
    const t = total <= 1 ? 1 : i / (total - 1);
    return last + (first - last) * Math.pow(1 - t, ease);
}
