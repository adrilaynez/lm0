## TinyMatrixExample (Bigram §3 — the worked matrix grid)

### Files changed
- `src/features/lab/components/TinyMatrixExample.tsx` (full rewrite, ~430 lines)

Imported only by `BigramNarrative.tsx` (and `BigramDiagramExperience.tsx`), always with `showCounts`.
No other files touched. en.ts / es.ts untouched (all `tinyMatrix*` keys already existed in both locales).

### Concept it teaches (ONE thing)
The model is a grid of "what follows what" — read a row, and the brightness of each cell tells you how
likely that next character is. The heatmap is now built from **fill**, so a common pair literally glows
and a rare one fades: the intensity *is* the lesson, not a color-coded afterthought.

### What I did
- Replaced the generic emerald heatmap (raw `bg-emerald-*` / `text-white` Tailwind, ring-offset chrome,
  rotated `writing-mode` vertical label, 3-swatch legend) with a token-only editorial-green matrix.
- **Heatmap by fill, honest axis.** `cellFill(prob)` mixes `--bigram-accent` over `--bigram-accent-soft`
  on a **fixed 0.55 axis** (`t = min(1, prob/0.55)`), so weak pairs stay dim — never normalised up to
  look strong. Text flips to `--bigram-on-accent` only when the fill is strong enough to need it.
- **One focal point at a time.** Hovering/focusing a cell springs it up (scale 1.1), lights the full
  row+column cross (`--bigram-accent-ink`), and recedes every off-cross cell to 0.32 opacity. The row's
  focal "current character" letter brightens; the rest dim.
- **At-rest pattern read.** Each row's favourite next-char carries a faint inset `accent-bright` ring so
  the eye finds the favorites instantly before any interaction.
- **Editorial caption** (replaces the old tooltip) resolves live: *"After 'h', 'e' appears 49% of the
  time"* (or the count template under `showCounts`), with `{row}`/`{pct}`/`{count}` rendered as mono
  accent tokens — driven entirely through the existing i18n templates.
- **Single legend = an intensity ramp** (a `--bigram-accent-soft → accent-2 → accent-bright` gradient
  rail) instead of three bordered swatches — fill, not chrome.
- Mono uppercase axis labels (`next character →` / `current character →`) instead of a rotated label.
- `showCounts` contract preserved: same prop, swaps cell readout (`toLocaleString()` counts vs `%`) and
  the caption template; grid/state machine otherwise unchanged.

### How it meets the v8 spec + standards
- **--bigram-* tokens only** — verified zero matches for `emerald|cyan|#hex|rgba|text-white|ring-|--lab-*`.
  Every surface, ink, and ramp stop is a `var(--bigram-*)` (resolved via the page's `[data-bigram-theme]`
  scope), so other chapters keep their cyan/amber/violet. No `[data-lab-theme]` touched.
- **Apple-clean / typography-first** — no borders on cells, no cards, no traffic-light dots, no dashboard
  legend; hierarchy comes from the focal row letter (JetBrains Mono), fill intensity, and one serif caption.
- **Honest reading** — fixed-axis fill mirrors the spec's HonestBar philosophy (uncertainty stays visible).
- **Motion that explains** — spring scale + cross-lighting + caption cross-fade clarify "after THIS → THIS";
  all gated by `useReducedMotion()` (final state shown instantly, no scale/fade under reduced motion).
- **Responsive, no horizontal scroll** — cells use `clamp()` widths; grid is centered and only scrolls if
  the viewport is narrower than the minimum 5-column strip.

### Before → after
- Before: `bg-emerald-400 text-black` step-function `cellColor()`, `ring-2 ring-emerald-400 ring-offset-1
  ring-offset-black`, vertical rotated row label, 3 bordered legend swatches, percent-only emphasis.
- After: continuous accent-ramp fill on a fixed axis, single springing focus + row/col cross dimming,
  inset favourite-ring at rest, mono axis labels, one gradient intensity rail, live editorial caption.

### Notable
- The grid uses an explicit `gridTemplateColumns: auto repeat(5, max-content)` so 6 items/row auto-place
  deterministically; axis labels span columns 2–6.
- ARIA: every cell has a full readable label built from the same i18n template as the caption.

### Skipped / needs human attention
- Pre-existing unrelated TS error in `BigramNarrative.tsx:576` (`showWindowDots` was dropped from
  `FigureWrapper` by another agent's edit) — NOT from this file; my component typechecks clean. The
  Revision phase should reconcile the `FigureWrapper` prop. I did not touch `BigramNarrative.tsx`.
- The matrix probabilities/counts are the same hardcoded dataset as before (pedagogically intentional);
  no logic change was needed beyond the honest-fill mapping.
