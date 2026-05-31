## StorageProblemVisualizer (Bigram §3 · Mechanics)

Re-themed the storage-problem visualizer into the v8 editorial-green language. It teaches ONE
concept: *every character can follow every character, so the number of pairs to track explodes —
which is exactly why we reach for a 2D table (rows × columns).*

### Files changed
- `src/features/lab/components/StorageProblemVisualizer.tsx` (full rewrite; same export, same place in `BigramNarrative.tsx`, same i18n keys).

### What I did
- **Picker → segmented control.** The 8 character keys now live in a sunk `--bigram-bg-2` rail; the
  active cell is a filled-accent pill that *rides* between cells via a shared `layoutId` spring —
  identical idiom to the redesigned `CorpusCountingIdea`. Already-explored chars carry a small
  `accent-2` dot, so re-picking reads as "revisit", not "new".
- **Followers fan.** The chosen char's real followers fan out as pair pills (`src → dst ×count`) on a
  single faint sunk plane (`color-mix(surface 55%, bg)`) — the one "this is interactive" signal, no
  border/card stacking. A ghost `+N more` pill stands in for the rest of the vocabulary row, so we
  stay **honest** (we never pretend a row is only 5 wide).
- **The explosion is felt, not stated.** Added a count-up **odometer** (easeOutCubic ~620ms) as the
  single focal number, woven into its localized `slotsTotal` sentence via a template split (like
  `VerdictSentence`) so copy stays translatable. It eases *from the previous total* to the new one on
  each pick, so the climb is visible.
- **Resolution = the table itself.** Phase 3 reveals a real transition-table preview built from
  `--bigram-*` tokens: rows = origin char, columns = next char, cells tinted by count
  (`color-mix(accent N%)`), assembling row-by-row in a gentle cascade. This is the structural answer
  that motivates the whole grid/matrix the chapter then builds.
- One focal point at a time, fading cleanly between phases: picker → fan → odometer → table.

### How it meets the v8 spec + standards
- **`--bigram-*` tokens only.** Zero hex, zero neon emerald/teal literals, zero `white/` Tailwind
  opacity utilities. Verified by grep. The only literal colors are the standard black inset
  shadows (`rgba(0,0,0,…)`) used for sunk panels — matching `CorpusCountingIdea`.
- **Properly scoped.** All green resolves through the chapter's `[data-bigram-theme]` wrapper (set on
  the page). No `[data-lab-theme]` / `--lab-*` touched; the `FigureWrapper` chrome is left alone.
- **Honest pattern, not a dashboard.** Honest `+N more` ghost; segmented control; sunk rails; fill +
  typography over borders/cards. Fonts: Playfair for the focal numeral/title, Source Serif for body,
  JetBrains Mono for labels/data — per the spec scale.
- **Reduced-motion safe.** Odometer + cell cascade settle instantly; segmented spring → instant; no
  superfluous motion. Every `setState` fires inside a RAF callback (mirrors `HonestBar.CountUpValue`),
  so the `react-hooks/set-state-in-effect` rule passes.

### Before → after
- Before: `bg-emerald-500/20`, `border-emerald-500/40`, `text-teal-300`, `text-white/40`, raw
  `rgba(16,185,129,…)` cell tints, lucide `ArrowRight`/`Lightbulb` icons, dashed-border chips, a
  bordered HTML `<table>` — none token-scoped (would render emerald in every chapter).
- After: token-only editorial-green, segmented picker, odometer, faint-plane fan, token-built table
  preview; icons dropped (typography carries it).

### Verification
- `eslint StorageProblemVisualizer.tsx` → 0 errors / 0 warnings.
- `tsc --noEmit` → my file is clean (no diagnostics).

### Needs human attention (out of my scope — did NOT touch)
- `tsc` reports `BigramNarrative.tsx(571): showWindowDots does not exist on FigureWrapper props`.
  Stashing the working tree makes it vanish, so a sibling agent's in-flight edit to `BigramNarrative.tsx`
  passes a `showWindowDots` prop that `FigureWrapper` doesn't declare. Not caused by this component,
  but the Revision-phase build will fail until either the prop is added to `FigureWrapper` or the call
  site is reverted.
- Pre-existing stale Next artifact: `.next/types/validator.ts` references a missing `about/page.js`
  (unrelated; clears on a fresh build).
