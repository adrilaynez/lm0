"use client";

import dynamic from "next/dynamic";

/**
 * Lazy KaTeX. `react-katex` (with KaTeX) is ~260 KB and was riding into the eager
 * narrative chunk on bigram/ngram first paint. These dynamic wrappers split it into
 * its own chunk that only loads when a formula actually renders (formulas are below
 * the fold). Drop-in replacements for `react-katex`'s BlockMath/InlineMath.
 *
 * The KaTeX *stylesheet* is loaded separately and eagerly (in app/[locale]/lab/layout
 * and components/mdx/math-block), so formulas are styled the moment the JS arrives —
 * only the heavy JS is deferred here.
 */
export const BlockMath = dynamic(() => import("react-katex").then((m) => m.BlockMath), {
  ssr: false,
});

export const InlineMath = dynamic(() => import("react-katex").then((m) => m.InlineMath), {
  ssr: false,
});
