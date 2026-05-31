## PredictionQueryVisualizer (Section 4 · querying a row → normalization)

### Files changed
- `src/features/lab/components/PredictionQueryVisualizer.tsx` — full re-theme + structural redesign.

No i18n files, no `[data-lab-theme]` blocks, no shared primitives, and no other-chapter
files were touched. The visualizer reuses the existing `HonestBar` and `Verdict` bigram
primitives unchanged.

### Design direction
- **One concept, one canvas.** The old 4–5 screen wizard (step rail + mini-matrix + two
  near-identical bar charts + dice) was replaced by a single calm instrument that reveals the
  pipeline in place: Pick → Lookup → Counts → Normalize → Predict.
- **Querying one row is now literal.** Step 2 renders the chosen character's matrix row as a
  single horizontal strip: row key (`t→`, accent) · follower cells (glyph over count, winner
  tinted `accent-soft`) · `Σ` row total. That total is the denominator we are about to divide by.
- **Normalization is the act, not a re-draw.** Steps 3–4 are fused: ONE stack of `HonestBar`s
  morphs in place from raw-count proportions to true probabilities when the learner presses the
  Normalize control. The formula well (`count ÷ total = probability`) slides in at that moment.
- **Honest bars.** Before normalizing, the largest count fills the track (axis = max). After,
  the bars sit on the fixed probability axis (0.5), so a 46% winner reaches ~92% of the track
  and the model's doubt stays visible — never normalised to 100%. Winner is `top` (brighter
  `accent-bright`), fills last via a winner-last cascade, sweeps one glint, value counts up.
- **Verdict close.** Step 5 is the sage `Verdict` panel ("After X, the most likely is Y") —
  editorial-green insight voice, distinct from the interactive emerald.
- **Eyebrows, not a rail.** Each beat is introduced by the v8 section-label motif: italic
  Playfair numeral (accent) + mono uppercase label + hairline `rule` — no dashboard step tracker.

### Interaction model
- Segmented control (sunk `bg-2` rail, active cell filled `accent` with a shared `layoutId`
  spring) picks the starting character — the v8 corpus-picker pattern.
- A single "Normalize" button performs the division; the same bars animate, the formula appears,
  the verdict reveals. Direct manipulation, one tap, one idea.
- "Try another character" resets cleanly. Selecting a new character re-runs from raw counts.
- Idle state shows a faint placeholder bar strip — the one quiet "this is interactive" cue.

### Standards compliance
- **Tokens only.** Every colour is `--bigram-*` (bg-2, surface, ink, ink-2, body, muted, dim,
  accent, accent-ink, accent-bright, accent-soft, on-accent, rule, rule-2) plus the registered
  Playfair / Source Serif / JetBrains Mono font vars. No raw hex, no neon, no `emerald`, no
  `--lab-*`. Verified by grep. Depth shadows reuse the same `rgba(0,0,0,.28)` inset as the
  sibling `CorpusCountingIdea`.
- **Scoped.** Resolves through the chapter's `[data-bigram-theme]` wrapper; nothing global,
  no other accent altered.
- **Honest bars / verdict.** Uses the shared `HonestBar` (fixed axis, winner-last, glint,
  count-up) and `Verdict` (sage panel) primitives — the canonical v8 honesty + close.
- **i18n.** All copy via `useI18n` `t(...)` with native `{...}` param interpolation. Reuses the
  existing `bigramNarrative.queryViz.*` keys (label/hint/step labels/pickChar/lookingUp/
  rawCountsIntro/totalRaw/normalizeIntro/tryAnother) and `bigramNarrative.corpusCounting.*`
  (verdictLabel/verdictMain/verdictSub) for the verdict pattern. **No i18n files edited.**
- **Reduced-motion safe** throughout (segmented spring, morph, glint, count-up, formula reveal
  all degrade to instant final state).
- Type-checks clean (`tsc --noEmit` — only a pre-existing unrelated `.next` validator cache
  error remains) and ESLint passes with no warnings.

### Before → after
- 5-step wizard with a numbered step-indicator rail → continuous single-canvas instrument with
  editorial eyebrows.
- Mini transition-table table with ghost `···` rows on `--lab-viz-bg` + emerald literals →
  one elegant matrix-row strip on a faint `surface`-mix panel.
- Two separate bar charts (raw counts, then probabilities) → one `HonestBar` stack that morphs
  in place; the fixed honest axis replaces the old max-normalised gradient bars.
- Weighted-dice "casino" roll → removed (see below); verdict + honest distribution is the close.

### Deliberate logic change (clarifies the one concept)
The weighted-dice / sampling step was dropped. Sampling has its own dedicated widget later in
the chapter (`SamplingMechanismVisualizer`); keeping a stochastic roll here introduced a second
concept that competed with normalization — exactly the "competing ideas" the quality protocol
warns against. The section's job is to read a distribution off one row; the verdict states the
model's most-likely bet, which is the honest endpoint of that pipeline. The now-unused
`predictionIntro`, `topPrediction`, `diceExplain`, `rollDice`, `rolled` keys remain in the i18n
files (untouched) and harm nothing.

### Needs human attention
- `FigureWrapper` (in `BigramNarrative.tsx`) still wraps this widget in `--lab-*` chrome with
  traffic-light window dots — that is shared narrative chrome owned by a separate task, not this
  visualizer, so it was intentionally left alone.
- The dropped-dice copy keys are now orphaned in `en.ts`/`es.ts`; a future i18n cleanup pass
  could prune `queryViz.predictionIntro/topPrediction/diceExplain/rollDice/rolled/next` if no
  other consumer references them.
