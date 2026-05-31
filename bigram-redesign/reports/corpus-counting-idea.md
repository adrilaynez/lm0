## CorpusCountingIdea (bw-corpus · §2 confirmation widget)

### File changed
- `src/features/lab/components/CorpusCountingIdea.tsx` — full rewrite (sole file touched).

### Concept it teaches (ONE)
Count what follows a chosen character across real text, then bet on the most frequent follower. The
phrase is the single focal point; the picker, counts and verdict are quiet support around it.

### What I did
- **Segmented control picker.** Replaced the six beige bordered keycaps with a sunk `--bigram-bg-2`
  rail (`inset 0 1px 4px`), `r-md`, with `radiogroup`/`radio` semantics. The active cell is filled
  `--bigram-accent` (`on-accent` glyph) and the fill *rides between cells* via a shared Framer
  `layoutId` spring — a real segmented-control feel, not six independent buttons. Inactive cells are
  muted text on transparent; while scanning, the non-active cells dim to 0.35 and lock.
- **The phrase is the HERO.** Moved from a cramped 16px left column to a large centered well:
  `clamp(25px, 3.3vw, 35px)`, lh 1.7, in a sunk `--bigram-bg-2` panel (`r-lg`, inset shadow),
  word-wrapping. It now reads as the protagonist.
- **Two highlights on the current pair.** Origin = filled (`accent` / `on-accent`, weight 700) =
  `hot1`; follower = tinted (`accent-soft` + inset `accent 38%` ring, `accent-ink`) = `hot2`. Past
  origins fade to `color-mix(accent 42%, dim)`. Reads instantly as "this → what follows". Spaces in
  the highlighted pair render as `␣` so a space-origin/follower is legible.
- **Slowed the scan to 950ms** (`SCAN_DELAY_MS`, was 550), with a 480ms settle before the first
  match — the eye can actually follow each step.
- **Counts are the shared `HonestBar`.** Each follower is a row; `value = count/total` (its true
  conditional probability) and `axis = maxCount/total` so the winner fills the track and every other
  bar reads as its honest proportion of the matches — never normalised to 100%. The winner is marked
  `top` (brighter `accent-bright`), gets the `glint`, and fills **last** via a winner-last `delay`
  cascade `(rank distance) × 0.08s`. The displayed value counts up only on completion.
- **Plain-language `Verdict`.** Ends with the sage panel using `verdictLabel` / `verdictMain`
  (`{char}`/`{best}` swapped to bold accent-ink spans) / `verdictSub` (`{n}`/`{total}`/`{pct}`).
- **Auto → pause → manual flow preserved.** A calm status line shows the live pair + `stepExplain`
  match counter + a "Pause" control; once paused it becomes a "Next" control that steps manually.
  Replay re-scans the same character.

### How it meets the v8 spec + standards
- **`--bigram-*` tokens only.** Every colour is `var(--bigram-*)` or a `color-mix` over a bigram
  token; fonts are the registered `--font-*` vars. No raw hex, no emerald/teal/cyan literals (the old
  version was full of `emerald-500/20`, `teal-300`, `bg-white/[0.04]`). Resolves under the chapter's
  `[data-bigram-theme]` scope.
- **Properly scoped / no regressions.** Self-contained; touches no `[data-lab-theme]`, `--lab-*`, or
  any other chapter's files. Consumes only the shared bigram primitives (`HonestBar`, `Verdict`).
- **Honest bars / verdict.** Fixed-axis fill (no per-row normalisation), brighter winner-last with
  glint and count-up; sage verdict exactly per the spec primitive.
- **Apple-clean.** Typography-first, one focal point (the phrase), state shown by fill + weight not
  borders. Removed the two-column split, both bordered cards, the beige selector, the pulsing dot, the
  custom gradient bars and the right-hand "Total" block. Premium motion (segmented-fill spring,
  winner-last cascade, glint, count-up) is used only where it clarifies.
- **Reduced-motion safe.** `useReducedMotion()` gates the segmented spring, status/verdict
  entrances and the cascade; `HonestBar`/`Verdict` already handle their own reduced-motion.

### Before → after
- Before: cramped 2-col split, 16px corpus in a scrollable box, beige `emerald-500/20` keycaps,
  550ms scan, ad-hoc gradient bars normalised to the max count, a generic "reveal" line + total.
- After: one calm instrument — segmented picker, hero phrase with dual highlights, 950ms scan, honest
  shared bars with a winner-last cascade, and a sage plain-language verdict.

### Notes / human attention
- The scan loop is driven by event/timeout callbacks (`step`) with a `stepRef` held current via an
  effect — this is the shape required to satisfy the project's strict React-compiler lint rules
  (`react-hooks/set-state-in-effect`, `react-hooks/immutability`, `react-hooks/refs`); the original
  recorded the tally synchronously inside a render effect, which those rules now forbid. Verified
  ESLint clean and `tsc --noEmit` reports no errors for this file.
- I styled with token-driven inline styles (the same approach as the shared primitives) rather than
  adding `.bw-corpus__*` classes to `globals.css`, keeping the change to this one file and avoiding
  any global-CSS edits. If a later pass prefers the CSS classes from styles-v8.css, the inline values
  map 1:1 to them.
- i18n: used the existing `bigramNarrative.corpusCounting.*` keys only (incl. `verdict*`,
  `stepExplain`, `pauseBtn`, `nextBtn`); did not edit `en.ts` / `es.ts`.
