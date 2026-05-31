## BigramMatrixBuilder — "build the transition matrix yourself" (§3 mechanics)

Re-themed the §3 build-your-own-matrix visualizer into the v8 editorial-green language.

### Files changed
- `src/features/lab/components/BigramMatrixBuilder.tsx` — full rewrite (orchestrating component + state machine).
- `src/features/lab/components/BigramMatrixBuilderParts.tsx` — NEW co-located presentational parts
  (`PhrasePanel`, `EditPanel`, `SpeedControl`, `MatrixGrid` + `MatrixCell` + `CountValue`, `IconBtn`,
  `primaryBtnStyle`, shared `Step` type / `glyph` / `SPACE_GLYPH`). Split out so the main file stays
  focused and under the 800-line `max-lines` ceiling (427 + 546 lines).

No i18n, narrative, `[data-lab-theme]`, or other-chapter files were touched.

### What I did
- The **ONE concept** is now unmistakable: *every adjacent pair drops a `+1` into one cell — count
  them all and the matrix builds itself.* The grid is the single focal point.
- The source phrase is the instrument: a sunk `--bigram-bg-2` panel with the current pair
  **double-highlighted** (origin filled `accent`/`on-accent`, follower tinted `accent-soft` with an
  inset accent ring), exactly mirroring the sibling `CorpusCountingIdea`. Past chars dim to a faint
  accent/dim mix.
- As the sweep advances, the pair line shows `from → to  +1`, the **target cell pulses** (scale
  1→1.14→1) while its **count ticks up** (a small y-cross-fade), and the matching **row + column
  headers brighten** to `accent-ink` — so the eye traces the pair straight to its (from, to) address.
- **Cell heat is honest:** tint scales with the cell's share of the running max, capped at ~30% accent
  mix over `surface` (8% floor) so a busy cell glows without ever screaming. Empty cells stay a quiet
  flat plane with a `·`.
- Controls collapsed to a calm set: one **accent Start**, then quiet **inset-ring icon controls**
  (step / play-pause / skip / reset) with hairline dividers. Speed is a **sunk segmented control**
  (the v8 pattern, shared `layoutId` spring fill), replacing the old ghost `1×/2×/4×` toggle.
- Completion reads as a calm **sage** italic line (editorial-insight voice), not a loud emerald banner.
- A thin 2px accent progress hairline replaces the old gradient bar.

### How it meets the v8 spec + standards
- **Apple-clean / typography-first:** meaning comes from fill + type, not borders. The old design had
  4 bordered cards, ring-1 outlines on every state, and a `border-collapse` table with a border on
  every cell; now there are zero figure borders — just one sunk phrase well and one airy grid
  (`border-spacing` gaps, rounded cells, no rules).
- **`--bigram-*` tokens only, properly scoped:** every color is a `--bigram-*` token (or a `color-mix`
  on one); resolves through the `[data-bigram-theme]` scope already set on the page wrapper
  (`page.tsx` / `LabShell`), dark + light. Verified zero `emerald`/`teal`/`cyan`/`amber`/raw-hex/
  `--lab-*` literals remain (only the spec's `rgba(0,0,0,…)` inset-well shadows).
- **Honest visualization:** cell heat is relative to the running max and capped — never normalized to a
  fake 100% — consistent with the chapter's honest-bar principle.
- **Motion that explains:** the pulse + count-tick + axis-brighten all clarify *where this pair lands*;
  the segmented-control spring is the only decorative flourish and it's subtle. Fully reduced-motion
  safe (no pulse / tick / spring; final state shown instantly).
- **Engineering:** React + TS + Framer Motion, typed throughout, responsive (grid scrolls horizontally
  only inside its own overflow container — no page horizontal scroll), `tsc` and `eslint` both clean.

### Before → after (notable)
- Heatmap `rgba(16,185,129,…)` literals → honest `color-mix(--bigram-accent …)` capped tint.
- `bg-black/30` + `border-white/[0.06]` + `var(--lab-viz-bg)` table chrome → token-only, frameless grid.
- Plain row-of-chars with emerald/teal ring highlights → sunk phrase well with double-highlight + ␣ glyph.
- Ghost speed toggle → sunk segmented control. Flat `✓` line → sage editorial completion line.

### Logic
Behavior and the step/play/skip/reset/edit state machine are preserved. One correctness fix: the
autoplay `useEffect` no longer calls `setState` synchronously in its body (it was tripping
`react-hooks/set-state-in-effect`); the final-step stop now happens inside the timeout callback. The
completion line now correctly replaces the pair line on the last step (the old `done && !active`
guard could never be true since `active` is non-null on the final step).

### Skipped / needs human attention
- The legacy `BigramDiagramExperience.tsx` still wraps this widget in cyan/amber/fuchsia chapter
  chrome (out of scope — not a bigram-themed surface). The widget itself renders correctly there
  because the whole `/lab/bigram` page is under `[data-bigram-theme]`, but that file's surrounding
  cards were intentionally left untouched per the rules.
- `FigureWrapper` in `BigramNarrative.tsx` still shows the old traffic-light window dots + `--lab-*`
  frame around this figure; that wrapper is a separate concern owned by the narrative-shell pass.
- No new i18n keys were needed — the existing `bigramBuilder.*` keys cover all visible copy
  (`en.ts` / `es.ts` left untouched as instructed). The icon-control tooltips/aria-labels use short
  English strings (they were hardcoded before too); promoting them to i18n would need new keys.
