/**
 * bigramCorpora — static bigram datasets for the rebuilt Bigram chapter (Phase 1 scaffolding).
 *
 * WHY THIS EXISTS
 * ----------------
 * The runtime API matrix (`BigramNarrative`'s `matrixData` prop) is async, comes from a Paul Graham
 * essay (not Shakespeare), and is not guaranteed to be loaded when the new widgets mount. The
 * blueprint's new visualizers need DETERMINISTIC, narrative-coherent material:
 *
 *   • ShakespeareRowCounter  → the `t → *` counts of a Shakespeare-like corpus.
 *   • MatrixRowByRowBuilder  → a small submatrix of 6–8 frequent letters, with real-ish counts.
 *   • TrainingTextComparison → TWO different training texts whose rows visibly differ.
 *   • §5 normalization / sampling → the same Shakespeare `t` row, as percentages.
 *
 * All counts below are HAND-AUTHORED to be plausible for English. They are NOT scraped from a real
 * corpus — they encode the well-known qualitative structure of English letter transitions (after
 * "t" comes "h"; after "q" comes "u"; "e" loves to end a word, i.e. be followed by a space; etc.).
 * The magnitudes are tuned for legible bars, not for statistical exactness.
 *
 * COORDINATE / GLYPH CONVENTION
 * -----------------------------
 * The space character is stored as a literal `" "` in keys/labels. Widgets render it as the visible
 * glyph `␣` (U+2423) — see `SPACE_GLYPH`. Mirrors CorpusCountingIdea's convention.
 *
 * PUBLIC API (see exports at the bottom for the typed surface):
 *
 *   SPACE_GLYPH                       "␣"
 *   ANCHOR_SENTENCE                   the small §2 corpus ("the cat sat on the mat …")
 *   SHAKESPEARE_ROW_T : BigramRow     full `t → *` distribution (counts), Shakespeare-scale
 *   SUBMATRIX_6       : SubMatrix     7×7 frequent-letter submatrix (counts), for the row-by-row build
 *   CORPUS_A          : Corpus        "Shakespeare" — rows for several letters
 *   CORPUS_B          : Corpus        "Modern text" — same letters, visibly different rows
 *   CORPORA           : Corpus[]      [CORPUS_A, CORPUS_B] for the comparison toggle
 *   CHARSET_TIERS     : CharsetTier[] vocab growth steps (27 → 53 → 63 → 92)
 *
 *   Helpers: rowTotal(), toPercentages(), topFollower(), getCorpusRow().
 */

/* ───────────────────────── Types ───────────────────────── */

/** A single bigram count: which character follows, and how many times we saw it. */
export interface FollowerCount {
    /** The next character. Space is the literal " ". */
    char: string;
    /** Raw occurrence count of (origin → char). */
    count: number;
}

/** One row of a transition table: the origin character and its full follower distribution. */
export interface BigramRow {
    /** The starting / "current" character this row describes. */
    origin: string;
    /** Followers, already sorted descending by count. */
    followers: FollowerCount[];
}

/** A small square submatrix over a fixed letter set (rows and columns share `chars`). */
export interface SubMatrix {
    /** Ordered axis labels — identical for rows and columns. */
    chars: string[];
    /**
     * counts[i][j] = how many times chars[j] followed chars[i].
     * Square: counts.length === chars.length and every row has chars.length entries.
     */
    counts: number[][];
}

/** A named training text, exposed as a set of pre-counted rows. */
export interface Corpus {
    /** Stable id, e.g. "shakespeare" / "modern". */
    id: string;
    /** i18n-independent short name for debugging; UI labels come from i18n. */
    name: string;
    /** Rows keyed by origin character; not every character needs a row. */
    rows: Record<string, FollowerCount[]>;
}

/** One step in the "the table grows" charset progression. */
export interface CharsetTier {
    id: string;
    /** Number of distinct characters at this tier (table is size × size). */
    size: number;
}

/* ───────────────────────── Constants ───────────────────────── */

/** Visible glyph for the space character in any widget that renders these datasets. */
export const SPACE_GLYPH = "␣";

/**
 * The small §2 anchor sentence. Kept identical to CorpusCountingIdea's CORPUS so the
 * "with so little text, counting lies" moment is coherent: here `t → space` beats `t → h`.
 */
export const ANCHOR_SENTENCE = "the cat sat on the mat the rat ate the fat hat";

/* ───────────────────────── Shakespeare `t → *` row ───────────────────────── */

/**
 * SHAKESPEARE_ROW_T — the full distribution of what follows "t" in a Shakespeare-scale corpus.
 *
 * Qualitatively faithful English: "h" dominates (the / that / this / they …), then a word-ending
 * space, then "o" (to), "e" (te-), "i" (ti-), etc. Counts are in the tens of thousands to feel
 * book-sized. Sorted descending. This is the canonical row reused by ShakespeareRowCounter and by
 * the §5 normalization / sampling beats.
 */
export const SHAKESPEARE_ROW_T: BigramRow = {
    origin: "t",
    followers: [
        { char: "h", count: 38420 },
        { char: "o", count: 12880 },
        { char: " ", count: 11260 },
        { char: "e", count: 9740 },
        { char: "i", count: 7180 },
        { char: "a", count: 6020 },
        { char: "r", count: 4310 },
        { char: "u", count: 3150 },
        { char: "s", count: 2270 },
        { char: "t", count: 1980 },
        { char: "y", count: 1640 },
        { char: "l", count: 1120 },
        { char: "w", count: 760 },
        { char: "c", count: 540 },
        { char: "f", count: 410 },
        { char: "m", count: 320 },
        { char: "n", count: 260 },
        { char: "'", count: 180 },
    ],
};

/* ───────────────────────── 7×7 frequent-letter submatrix ───────────────────────── */

/**
 * SUBMATRIX_6 — a compact, legible submatrix over the most frequent characters.
 *
 * Axis: 7 entries (the blueprint asks for 6–8). Chosen for maximum narrative payoff: "t", "h", "e",
 * "a", "o", "n", and the space. The "t" row's "h" peak, the "h" row's "e" peak, and the "e" row's
 * trailing space are all visible — the patterns the learner already felt.
 *
 * Despite the name (kept stable for the public API), the axis has 7 characters. counts[i][j] is how
 * often chars[j] followed chars[i] within this frequent-letter neighbourhood (Shakespeare-scale,
 * sub-sampled to readable magnitudes).
 */
const SUBMATRIX_CHARS = ["t", "h", "e", "a", "o", "n", " "];

export const SUBMATRIX_6: SubMatrix = {
    chars: SUBMATRIX_CHARS,
    // rows/cols order:   t      h      e      a      o      n     space
    counts: [
        /* t → */ [   180,  3840,   970,   600,  1290,    30,  1130 ],
        /* h → */ [    40,    60,  4910,  1380,   720,    50,   410 ],
        /* e → */ [    90,    20,   210,   340,    70,  1450,  3720 ],
        /* a → */ [  1210,    30,    60,    20,    10,  2030,   880 ],
        /* o → */ [   220,    20,    40,    30,   180,  1190,   910 ],
        /* n → */ [   410,    10,   720,   180,   260,    90,  2840 ],
        /* ␣ → */ [  1980,   910,   320,  1240,   640,   210,    20 ],
    ],
};

/* ───────────────────────── Two contrasting training corpora ───────────────────────── */

/**
 * Two training texts that share the same alphabet but learn visibly different rows. Pick a letter
 * in TrainingTextComparison and the two distributions diverge — the point being "the model is a
 * mirror of the text you gave it".
 *
 * CORPUS_A ("Shakespeare"): archaic English. After "t" → "h" dominates; "e" often ends a word.
 * CORPUS_B ("Modern text"): contemporary prose. Flatter, more vowels and "s"/"r"; "t→h" still leads
 *   but by less, and "o" (to) and "r" rise — enough that side-by-side rows clearly differ.
 */
export const CORPUS_A: Corpus = {
    id: "shakespeare",
    name: "Shakespeare",
    rows: {
        t: [
            { char: "h", count: 384 },
            { char: "o", count: 129 },
            { char: " ", count: 113 },
            { char: "e", count: 97 },
            { char: "i", count: 72 },
            { char: "a", count: 60 },
        ],
        h: [
            { char: "e", count: 491 },
            { char: "a", count: 138 },
            { char: "i", count: 96 },
            { char: "o", count: 72 },
            { char: " ", count: 41 },
            { char: "y", count: 28 },
        ],
        a: [
            { char: "n", count: 203 },
            { char: "t", count: 121 },
            { char: " ", count: 88 },
            { char: "r", count: 64 },
            { char: "s", count: 51 },
            { char: "l", count: 47 },
        ],
        e: [
            { char: " ", count: 372 },
            { char: "n", count: 145 },
            { char: "a", count: 34 },
            { char: "r", count: 88 },
            { char: "s", count: 62 },
            { char: "d", count: 40 },
        ],
        o: [
            { char: "n", count: 119 },
            { char: "u", count: 102 },
            { char: " ", count: 91 },
            { char: "r", count: 77 },
            { char: "f", count: 58 },
            { char: "t", count: 44 },
        ],
        s: [
            { char: " ", count: 241 },
            { char: "t", count: 118 },
            { char: "e", count: 96 },
            { char: "h", count: 74 },
            { char: "o", count: 52 },
            { char: "i", count: 39 },
        ],
    },
};

export const CORPUS_B: Corpus = {
    id: "modern",
    name: "Modern text",
    rows: {
        t: [
            { char: "h", count: 252 },
            { char: "o", count: 188 },
            { char: " ", count: 174 },
            { char: "e", count: 121 },
            { char: "i", count: 99 },
            { char: "r", count: 86 },
        ],
        h: [
            { char: "e", count: 318 },
            { char: "a", count: 176 },
            { char: "i", count: 142 },
            { char: "o", count: 88 },
            { char: " ", count: 96 },
            { char: "t", count: 31 },
        ],
        a: [
            { char: "n", count: 188 },
            { char: "t", count: 142 },
            { char: "s", count: 121 },
            { char: "r", count: 104 },
            { char: "l", count: 92 },
            { char: " ", count: 76 },
        ],
        e: [
            { char: " ", count: 281 },
            { char: "r", count: 168 },
            { char: "n", count: 124 },
            { char: "s", count: 113 },
            { char: "d", count: 97 },
            { char: "a", count: 58 },
        ],
        o: [
            { char: "u", count: 156 },
            { char: "n", count: 134 },
            { char: " ", count: 128 },
            { char: "r", count: 119 },
            { char: "o", count: 71 },
            { char: "m", count: 63 },
        ],
        s: [
            { char: " ", count: 214 },
            { char: "t", count: 142 },
            { char: "e", count: 118 },
            { char: "i", count: 87 },
            { char: "o", count: 71 },
            { char: "h", count: 44 },
        ],
    },
};

/** Both corpora, in display order, for the comparison toggle. */
export const CORPORA: Corpus[] = [CORPUS_A, CORPUS_B];

/**
 * The letters that exist as rows in BOTH corpora — the safe set for the side-by-side picker.
 * Computed from the intersection so the comparison widget never asks for a missing row.
 */
export const COMPARABLE_CHARS: string[] = Object.keys(CORPUS_A.rows).filter(
    (c) => c in CORPUS_B.rows,
);

/* ───────────────────────── Charset growth tiers ───────────────────────── */

/**
 * CHARSET_TIERS — the vocab sizes as character classes are added (CharsetGrowthMatrix).
 * 27 (lowercase + space) → 53 (+A–Z) → 63 (+0–9) → 92 (+punctuation), matching the i18n steps.
 * The table at each tier is size × size cells.
 */
export const CHARSET_TIERS: CharsetTier[] = [
    { id: "lower", size: 27 },
    { id: "upper", size: 53 },
    { id: "digits", size: 63 },
    { id: "punct", size: 92 },
];

/* ───────────────────────── Helpers ───────────────────────── */

/** Sum of all follower counts in a row (the denominator for normalization). */
export function rowTotal(followers: FollowerCount[]): number {
    return followers.reduce((sum, f) => sum + f.count, 0);
}

/**
 * Convert raw follower counts into percentages of the row total.
 * Returns the same followers with an added `pct` field (0–1), order preserved.
 */
export function toPercentages(
    followers: FollowerCount[],
): Array<FollowerCount & { pct: number }> {
    const total = rowTotal(followers) || 1;
    return followers.map((f) => ({ ...f, pct: f.count / total }));
}

/** The single most frequent follower of a row (assumes non-empty), or null if empty. */
export function topFollower(followers: FollowerCount[]): FollowerCount | null {
    if (followers.length === 0) return null;
    return followers.reduce((best, f) => (f.count > best.count ? f : best));
}

/** Look up a corpus row by origin character, or null if that corpus has no row for it. */
export function getCorpusRow(corpus: Corpus, origin: string): FollowerCount[] | null {
    return corpus.rows[origin] ?? null;
}

/** Render a character for display, mapping the literal space to its visible glyph. */
export function displayChar(c: string): string {
    return c === " " ? SPACE_GLYPH : c;
}
