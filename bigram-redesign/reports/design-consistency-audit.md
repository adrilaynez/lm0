## Design-Consistency Audit + Fix (Bigram editorial-green v8)

Full cross-file audit of every file touched in the Bigram redesign against `bigram-design-spec.md`.
Two genuine drifts found and fixed; the rest of the chapter was already clean and well-scoped.

### Files changed by this audit
- `src/features/lab/components/BigramNarrative.tsx`
  - Line 536: `<TransitionMatrix accent="emerald" />` → `accent="bigram"`. The full transition
    matrix in §3 was still rendering the legacy literal-Tailwind emerald accent inside the bigram
    narrative. It now uses the token-driven editorial-green branch (`--bigram-*`), matching the
    rest of the chapter.
  - CTA + footer block (the closing "what's next" section): completely rewritten from hardcoded
    `teal-500/teal-950/teal-300/teal-400`, `emerald-500/emerald-300`, `white/[0.08]`, and
    `var(--lab-text)` / `var(--lab-viz-bg)` / `var(--lab-border)` literals to pure `--bigram-*`
    tokens. This block lives inside the bigram chapter and was the only place still leaking another
    palette and `--lab-*` chrome into bigram content.

### Before → after (CTA + footer)
- Before: a teal gradient card with a neon teal glow (`shadow-[0_0_40px_-12px_rgba(20,184,166,…)]`),
  a teal icon well, an emerald secondary button, and a `--lab-*`/`--lab-border` footer — three
  different off-palette accents in one block, plus a dashboard-y glow.
- After: an Apple-clean editorial card — `bigram-surface` panel, `rule-2` hairline, an
  `accent-soft` icon well with an accent ring that warms on hover, Playfair title, Source-Serif
  copy. A single soft `accent-soft` wash replaces the neon glow; the arrow nudges +0.5px on hover
  (motion that signals, not decorates). Secondary is a quiet `ink 3%` row that tints `accent-soft`
  on hover. Footer hairline + label are now `--bigram-rule` / `--bigram-dim` in mono.

### Checklist results
1. **No stray neon / hardcoded palette / `--lab-*` leaks in bigram content** — FIXED. After the
   two fixes, every bigram-rendered file (narrative + free-lab page + all widgets + the
   `bigram/` primitives) is `--bigram-*` only. Confirmed by sweep: zero `var(--lab-*)`, zero
   colored `rgb()/hsl()`, zero Tailwind hue literals in pure-bigram files.
2. **Single accent (no leftover emerald/violet/amber in bigram)** — PASS. The lone exception was
   the `accent="emerald"` matrix call (now fixed). `ArchitectureDeepDive` uses the single-accent
   rule via `--bigram-accent` (can-do) / `--bigram-wrong` terracotta (cannot) — correct.
3. **No traffic-light dots** — PASS. The only matches are comments confirming their removal
   (`FigureWrapper`, `DatasetExplorerModal`, `TinyMatrixExample`). None render.
4. **Green properly scoped (other chapters unaffected)** — PASS. All shared components branch on
   `accent="bigram"` / `modelType="bigram"` and keep their literal accents in the other branches:
   `narrative-primitives` (emerald/amber/cyan/violet/rose defaults intact), `KeyTakeaway`,
   `LabSectionHeader`, `SectionDivider`, `TransitionMatrix`, `InferenceConsole`,
   `GenerationPlayground` (neutral palette), `ModelHero` (`DefaultHero` keeps indigo/violet),
   `DatasetExplorerModal` (N-Gram path keeps red/emerald/indigo). `ngram/page.tsx` forks
   `NgramStepwisePrediction` (cyan, untouched) so the bigram-only `StepwisePrediction` rewrite does
   not regress n-gram. globals.css tokens are additive under `[data-bigram-theme]` only; no
   `[data-lab-theme]` / `--lab-*` / `--ls-*` block was modified. Zero bigram references in the
   ngram page.
5. **Look matches the spec** — PASS. Verified the load-bearing primitives:
   `HonestBar` (fixed axis 0.5, `barW = min(100, value/axis*100)`, winner brighter `accent-bright`
   filling last, single glint sweep, easeOutCubic ~620ms count-up, reduced-motion safe);
   `PairHighlighter` (one persistent sage lens measured from active spans, first-placement no-sweep);
   `Verdict` + `CorpusCountingIdea` ("After X, the most likely is Y", sage gradient + inset sage
   ring); `KeyTakeaway` bigram = sage voice; segmented controls / typography / hairlines all
   token-driven. Clean, minimal, premium.

### Notes / left for a human
- `KeyTakeaway` renders the literal label "Key Takeaway" in both the bigram and the legacy
  branches (it was hardcoded before the redesign too — not new drift). i18n files are out of scope
  per the task, so I left it; if a human wants it localized, add a `key`/`label` prop and a key.
- `ArchitectureDeepDive`'s header comment loosely says "can-do is emerald" — the *code* uses
  `--bigram-accent` (the token), so it's only imprecise wording in a comment, not a visual leak.
- I did not run the dev server or a build (Revision phase only). All my edits are className/JSX
  string changes with no type-surface changes, so they are type-safe; the touched lucide imports
  (`Beaker`, `ArrowRight`, `FlaskConical`) remain used.
