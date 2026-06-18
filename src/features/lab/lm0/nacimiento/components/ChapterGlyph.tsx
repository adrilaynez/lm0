"use client";

/**
 * ChapterGlyph — a bespoke, minimal SVG "what this chapter does" mark, drawn in
 * the chapter's era accent (set as `color` on the card, so strokes use
 * currentColor). One per chapter, each reading at a glance:
 *
 *   bigram      → counting next-letter frequencies (a tiny bar chart)
 *   ngram       → a window of context cells feeding one prediction
 *   nn          → a little network that learns (nodes + edges + one lit path)
 *   mlp         → stacked layers that combine
 *   transformer → attention beams converging on one token
 *   gpt         → locked (coming soon)
 *
 * These are LM0's own marks — never the ngram/bigram chapter visualizers. The
 * static state already reads; hover (driven from CSS via .lm0-ch-card:hover)
 * adds the bloom/draw-in. No canvas, no rAF — crisp and screenshot-stable.
 */

export type GlyphKind = "bigram" | "ngram" | "nn" | "mlp" | "transformer" | "gpt";

const VB = "0 0 120 72";

export function ChapterGlyph({ kind }: { kind: GlyphKind }) {
  return (
    <svg className="lm0-glyph" data-kind={kind} viewBox={VB} fill="none" aria-hidden="true">
      {kind === "bigram" && (
        <>
          <line className="g-axis" x1="22" y1="54" x2="98" y2="54" />
          <rect className="g-bar" x="30" y="30" width="12" height="24" rx="1.5" />
          <rect className="g-bar" x="54" y="18" width="12" height="36" rx="1.5" />
          <rect className="g-bar" x="78" y="40" width="12" height="14" rx="1.5" />
        </>
      )}

      {kind === "ngram" && (
        <>
          <rect className="g-cell" x="14" y="20" width="15" height="15" rx="3" />
          <rect className="g-cell" x="33" y="20" width="15" height="15" rx="3" />
          <rect className="g-cell" x="52" y="20" width="15" height="15" rx="3" />
          <rect className="g-cell g-cell-active" x="71" y="20" width="15" height="15" rx="3" />
          <path className="g-arrow" d="M78.5 37 L78.5 50" />
          <circle className="g-out" cx="78.5" cy="55" r="4.5" />
        </>
      )}

      {kind === "nn" && (
        <>
          <g className="g-edges">
            {[18, 36, 54].map((y1) =>
              [26, 46].map((y2) => <line key={`a${y1}-${y2}`} x1="26" y1={y1} x2="60" y2={y2} />),
            )}
            {[26, 46].map((y1) => (
              <line key={`b${y1}`} x1="60" y1={y1} x2="96" y2="36" className="g-edge-out" />
            ))}
          </g>
          {[18, 36, 54].map((y) => (
            <circle key={`i${y}`} className="g-node" cx="26" cy={y} r="3.4" />
          ))}
          {[26, 46].map((y) => (
            <circle key={`h${y}`} className="g-node g-node-hidden" cx="60" cy={y} r="3.4" />
          ))}
          <circle className="g-node g-node-out" cx="96" cy="36" r="4.2" />
        </>
      )}

      {kind === "mlp" && (
        <>
          {[14, 31, 48].map((y, i) => (
            <g key={y} className="g-layer" style={{ ["--i" as string]: i }}>
              <rect x="26" y={y} width="68" height="11" rx="3" />
              {[36, 50, 64, 78].map((x) => (
                <circle key={x} cx={x} cy={y + 5.5} r="1.7" />
              ))}
            </g>
          ))}
          <path className="g-flow" d="M60 25 L60 31 M60 42 L60 48" />
        </>
      )}

      {kind === "transformer" && (
        <>
          {[20, 40, 60, 80, 100].map((x) => (
            <circle key={x} className="g-tok" cx={x} cy="56" r="3" />
          ))}
          <path className="g-beam" d="M20 53 Q44 20 80 53" />
          <path className="g-beam g-beam-strong" d="M40 53 Q60 12 80 53" />
          <path className="g-beam" d="M60 53 Q70 30 80 53" />
          <circle className="g-tok g-tok-focus" cx="80" cy="56" r="3.6" />
        </>
      )}

      {kind === "gpt" && (
        <>
          <rect className="g-lock-body" x="46" y="34" width="28" height="24" rx="5" />
          <path className="g-lock-shackle" d="M52 34 v-6 a8 8 0 0 1 16 0 v6" />
          <circle className="g-lock-hole" cx="60" cy="45" r="2.6" />
        </>
      )}
    </svg>
  );
}
