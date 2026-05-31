## Bigram shared primitives (HonestBar · PairChip · Verdict)

New folder `src/features/lab/components/bigram/` with three token-only, business-logic-free primitives,
implemented to the exact prop names in `bigram-design-spec.md` §6 so the widget agents can import them as-is.

### Files created
- `src/features/lab/components/bigram/HonestBar.tsx`
- `src/features/lab/components/bigram/PairChip.tsx`
- `src/features/lab/components/bigram/Verdict.tsx`

### What I did

**HonestBar.tsx** — fixed-axis probability bar row (`.barrow` in styles-v8.css).
- Grid `104px 1fr auto`: pair label · sunk track · value, exactly per the v8 `.barrow` layout.
- Honest axis: `barW = min(100, value/axis*100)`, `axis` default `0.5`. The track is the *whole axis*, so a
  partial fill literally shows the model's uncertainty — never normalised to 100 %.
- Label is the bigram pair `src → dst`: src dim, arrow dim, dst bold ink. `dst === " "` renders `␣` with the
  smaller lowercase `.space` treatment; `src === " "` shows `␣` too.
- Winner (`top`) fills with `--bigram-accent-bright` (brighter), the rest with `--bigram-accent-2`. Fill width
  transitions `0.6s cubic-bezier(.2,.7,.2,1)` and honours an optional `delay` (s) so callers can stage the
  winner-last cascade.
- `glint` runs a single white sweep ≈360 ms into the fill (suppressed under reduced-motion).
- `countUp` eases the displayed number `0→value` with easeOutCubic over ~620 ms; format is `(value*100).toFixed(1)`
  + thin no-break space + `%`, matching the JS reference. Default ariaLabel `"src followed by dst, NN%"` is
  overridable via `ariaLabel`.

**PairChip.tsx** — the pair pill (`.bw-pairs__pair` / `.rep`).
- `r-pill` pill: `src → dst` (mono) left, count disc right. Space renders as `·` (the highlighter glyph).
- `repeated` (count ≥ 2) tints the whole pill `--bigram-accent-soft` with an inset accent ring; the disc
  flips to `--bigram-accent` / `--bigram-on-accent`, and src/arrow shift to a mixed accent, dst to accent-ink —
  so a repeated pattern pops. Gentle scale/opacity entrance.

**Verdict.tsx** — sage verdict panel (`.bw-corpus__verdict`).
- Centred column: mono sage `label` eyebrow, serif `main` sentence, mono muted `sub` line.
- SAGE voice: `linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)` + inset sage ring, `r-md` —
  the editorial-insight green, distinct from the interactive emerald.
- `main` is `ReactNode`; a scoped `<style>` colours any `<b>` inside it `--bigram-accent-ink` (matching the spec's
  `.vmain b`) so the predicted chars read in accent without the consumer wiring up CSS.

### How it meets the v8 spec + standards
- **--bigram-* tokens only.** Every color is `var(--bigram-*)` (or a `color-mix` over `--bigram-ink`/accent/sage),
  resolved by the consumer's `[data-bigram-theme]` scope. No raw hex, no neon emerald/cyan literals. Fonts use the
  registered `--font-jetbrains-mono` / `--font-source-serif` vars.
- **Properly scoped / no regressions.** Self-contained primitives; they touch no `[data-lab-theme]`, `--lab-*`, or
  any other chapter's files. Green only appears when rendered inside a bigram-themed wrapper.
- **Honest bars / verdict.** Fixed-axis fill (no normalisation), winner-last via `delay`, brighter winner, glint,
  count-up; sage verdict exactly per `.bw-corpus__verdict`. (The sliding lens belongs to the PairHighlighter widget,
  not these primitives.)
- **Apple-clean.** Typography-first, one focal point per row/pill/panel; state shown by fill + weight, not borders;
  premium motion (spring entrances, easeOutCubic count-up, glint) used only where it clarifies. No cards/chrome.
- **Reduced-motion safe.** `useReducedMotion()` everywhere: no glint, no count-up, no entrance — final state shown
  instantly.

### Before → after
- Before: no shared bigram primitives existed; widgets each rolled their own bars/pills. After: one canonical
  `HonestBar` / `PairChip` / `Verdict` matching the spec's APIs, ready for HeroAutoComplete, CorpusCountingIdea,
  InferenceConsole, StepwisePrediction, PairHighlighter to consume.

### Notes / human attention
- Count-up uses a `key`-remount `CountUpValue` child so a changed target cleanly restarts from 0. This was required
  to satisfy the project's strict React-compiler ESLint rules (`react-hooks/set-state-in-effect`, `react-hooks/refs`)
  — synchronous setState-in-effect and render-phase ref reads are both forbidden here. setState now only fires inside
  the RAF callback.
- Verified: ESLint clean on all three files; `tsc --noEmit` reports no errors in `components/bigram`. (Pre-existing,
  unrelated: a stale `.next/types/validator.ts` error about `src/app/about/page.js` — not from this work.)
- I did **not** edit `globals.css`, i18n, or any widget/page — those belong to other phases. These primitives assume
  the `--bigram-*` tokens and `[data-bigram-theme]` scope are added by the tokens agent.
