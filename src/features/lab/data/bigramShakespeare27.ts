/**
 * bigramShakespeare27 — the §3/§4 shared bigram matrix.
 *
 * Precomputed 27×27 bigram counts from the first 300,000 characters of tinyShakespeare, folded to the
 * 27-symbol alphabet [space, a–z] with **consecutive whitespace collapsed** (a word boundary is one
 * boundary, regardless of how many spaces/newlines the typesetting used). Collapsing only removes
 * space→space pairs, so the «t» row here is byte-identical to what RowTally (VIS 4) counts live — §3
 * reads as the very same row VIS 4 just built.
 *
 * Why precomputed: VIS 5 (normalize), VIS 6 (always-max loop), VIS 7 (loaded die) all need the same
 * numbers, and following always-max from «t» on this matrix yields the iconic "the the the" loop
 * (after a space the likeliest letter is «t», once formatting spaces are collapsed).
 *
 * Generated offline; do not hand-edit the counts.
 */

/** The fixed 27-symbol alphabet: index 0 = space, 1..26 = a..z. */
export const ALPHA_27: string[] = " abcdefghijklmnopqrstuvwxyz".split("");

/** Index of «t» (the §3 protagonist) in ALPHA_27. */
export const T_INDEX = 20;

/** 27×27 counts. MATRIX_27_COUNTS[row][col] = times `col` followed `row`. Row 20 is the «t» row. */
export const MATRIX_27_COUNTS: number[][] = [
    [0, 4507, 2818, 2306, 2229, 989, 1975, 1455, 3928, 3495, 110, 539, 1757, 3515, 1620, 2419, 1480, 216, 1044, 4197, 8059, 611, 417, 3807, 0, 1906, 7],
    [842, 0, 262, 489, 636, 22, 94, 251, 10, 581, 19, 437, 1159, 579, 3311, 1, 173, 0, 2237, 1113, 2359, 276, 678, 134, 1, 676, 14],
    [43, 207, 20, 0, 4, 1215, 0, 0, 4, 101, 13, 0, 430, 1, 0, 277, 0, 0, 400, 34, 38, 669, 0, 0, 0, 327, 0],
    [24, 543, 0, 63, 0, 1228, 0, 0, 978, 556, 0, 337, 209, 0, 0, 1308, 0, 7, 145, 1, 216, 171, 0, 0, 0, 30, 0],
    [5385, 251, 0, 1, 36, 1079, 8, 32, 2, 618, 0, 2, 77, 11, 11, 581, 0, 0, 150, 406, 0, 156, 32, 95, 0, 158, 0],
    [10370, 1633, 37, 402, 1094, 1040, 234, 82, 46, 438, 5, 18, 1075, 502, 2761, 121, 240, 37, 3428, 2047, 905, 15, 332, 170, 97, 350, 2],
    [1483, 337, 0, 0, 0, 365, 141, 0, 0, 473, 0, 0, 86, 0, 0, 960, 0, 0, 320, 6, 94, 155, 0, 0, 0, 3, 0],
    [955, 253, 0, 0, 8, 510, 0, 31, 592, 193, 0, 0, 268, 67, 79, 566, 0, 0, 373, 151, 15, 110, 0, 0, 0, 3, 0],
    [1796, 3064, 14, 3, 3, 5343, 4, 0, 2, 1971, 0, 0, 7, 34, 9, 1351, 0, 0, 101, 24, 329, 171, 0, 6, 0, 400, 0],
    [1417, 207, 76, 768, 434, 598, 355, 339, 3, 217, 0, 147, 834, 628, 3279, 538, 84, 3, 828, 1873, 1784, 648, 358, 1, 22, 0, 248],
    [0, 7, 0, 0, 0, 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0],
    [665, 2, 1, 0, 0, 622, 4, 0, 0, 485, 0, 0, 19, 0, 189, 1, 0, 0, 1, 84, 0, 2, 0, 0, 0, 3, 0],
    [1990, 888, 9, 34, 695, 1299, 150, 3, 0, 811, 0, 37, 1659, 38, 6, 1140, 38, 0, 9, 205, 117, 148, 52, 5, 0, 427, 0],
    [1260, 1088, 129, 0, 0, 1811, 30, 0, 0, 455, 0, 0, 2, 75, 77, 577, 158, 0, 0, 106, 3, 261, 1, 0, 0, 853, 0],
    [3607, 310, 27, 584, 2404, 1285, 83, 1529, 14, 614, 19, 158, 79, 20, 181, 1597, 7, 13, 21, 525, 920, 210, 38, 14, 0, 123, 0],
    [2740, 89, 167, 90, 517, 65, 1157, 47, 8, 167, 2, 156, 694, 1032, 1821, 665, 230, 2, 2541, 389, 1112, 3824, 291, 976, 5, 112, 4],
    [316, 341, 3, 0, 0, 594, 3, 0, 35, 172, 0, 0, 318, 0, 0, 422, 104, 0, 547, 45, 86, 112, 0, 0, 0, 27, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 290, 0, 0, 0, 0, 0],
    [4237, 794, 39, 243, 911, 2806, 52, 156, 7, 1173, 3, 177, 112, 138, 191, 995, 50, 10, 192, 865, 609, 323, 165, 16, 0, 317, 0],
    [6809, 365, 89, 157, 15, 1694, 3, 9, 796, 581, 0, 25, 117, 50, 8, 794, 309, 2, 0, 509, 1998, 361, 0, 142, 0, 21, 0],
    [5670, 522, 0, 95, 2, 1401, 9, 1, 7071, 1033, 0, 0, 191, 5, 31, 1947, 1, 0, 548, 254, 246, 322, 0, 120, 0, 294, 0],
    [1293, 51, 88, 559, 97, 399, 99, 239, 0, 121, 0, 41, 651, 183, 614, 18, 225, 0, 1604, 1768, 837, 0, 0, 0, 1, 6, 1],
    [11, 119, 0, 0, 0, 1657, 0, 0, 0, 323, 0, 0, 0, 0, 0, 226, 0, 0, 0, 0, 0, 4, 0, 0, 0, 24, 0],
    [677, 620, 4, 0, 4, 1003, 11, 0, 1133, 1062, 0, 4, 12, 0, 191, 573, 0, 0, 65, 125, 4, 0, 0, 0, 0, 0, 0],
    [9, 7, 0, 21, 0, 21, 2, 0, 2, 6, 0, 0, 0, 0, 0, 0, 23, 0, 0, 1, 32, 1, 0, 0, 0, 1, 0],
    [3807, 41, 0, 1, 2, 226, 8, 0, 1, 42, 0, 0, 4, 8, 3, 1759, 3, 0, 27, 127, 0, 0, 0, 2, 0, 0, 0],
    [0, 108, 0, 0, 0, 163, 0, 0, 0, 1, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
];

/** Display glyph for a row/col index (space → ␣). */
export function dchar(i: number): string {
    return i === 0 ? "␣" : ALPHA_27[i];
}

/** Sum of a row (the denominator when normalizing). */
export function rowTotal(i: number): number {
    return MATRIX_27_COUNTS[i].reduce((a, b) => a + b, 0);
}

/** Row as probabilities (each cell ÷ row total). */
export function rowProbs(i: number): number[] {
    const total = rowTotal(i) || 1;
    return MATRIX_27_COUNTS[i].map((c) => c / total);
}

/** Index of the largest cell in a row (the "always pick the max" choice). */
export function argmaxRow(i: number): number {
    const row = MATRIX_27_COUNTS[i];
    let best = 0;
    for (let j = 1; j < row.length; j++) if (row[j] > row[best]) best = j;
    return best;
}

/** Sample a column from a row's distribution given r ∈ [0,1) (the "loaded die"). */
export function sampleRow(i: number, r: number): number {
    const row = MATRIX_27_COUNTS[i];
    const total = rowTotal(i);
    if (total === 0) return 0;
    const target = r * total;
    let acc = 0;
    for (let j = 0; j < row.length; j++) {
        acc += row[j];
        if (target < acc) return j;
    }
    return row.length - 1;
}

/** The top-`k` followers of a row, as {index, count, prob}, biggest first. */
export function topFollowers(i: number, k: number): { idx: number; count: number; prob: number }[] {
    const total = rowTotal(i) || 1;
    return MATRIX_27_COUNTS[i]
        .map((count, idx) => ({ idx, count, prob: count / total }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, k);
}
