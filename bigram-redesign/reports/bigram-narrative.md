## BigramNarrative — v8 editorial-green re-theme (presentation only)

**File changed:** `src/features/lab/components/BigramNarrative.tsx`
**Scope:** aesthetic only — prose, structure, and the number/identity of embedded visualizers are unchanged. No i18n copy was edited; no `[data-lab-theme]` / `--lab-*` block was touched; no other chapter's accent was altered. All new color is `--bigram-*`, resolved under the chapter's `[data-bigram-theme]` scope.

### What I did

1. **Removed the traffic-light window dots.** Deleted the local `FigureWrapper` (which rendered red/yellow/green `.dots` and a framed `--lab-*` card) and routed every figure through the shared `narrative-primitives` `FigureWrapper` with `accent="bigram"` — the v8 editorial figure: no frame, no chrome, no dots, just a numbered mono caption over a single faint plane (`color-mix(surface 55%, bg)`). The one call that passed `showWindowDots={false}` had the now-defunct prop removed.

2. **Re-themed `ExpandableSection` to the v8 `.xpand` disclosure.** The summary is now a full card-row control: `r-md` bordered row over a faint `ink 3%` fill, a 9px accent dot, a Source-Serif 600 title, and an explicit **expand/collapse pill** (mono, accent-tinted) ending in a `+`/`−` **disc** (accent fill, `on-accent` glyph). Hover fills with `accent-soft`; focus-visible shows the `0 0 0 3px accent-soft` ring. The original height/opacity expand animation is preserved.

3. **Recolored `BigramHistorySidebar` rainbow dots to the green/sage family.** The four timeline markers and per-era rules/numerals moved from teal/emerald/amber/rose to a single editorial scale: `accent-bright → accent → accent-2 → sage` (still chronologically distinct, never leaving the palette). The four duplicated era blocks were collapsed into one `eras.map(...)` driven by the same i18n `history.pN` keys (identical copy, identical stagger). The shell, header, and connector line moved off raw `emerald-*` / `white/*` / `--lab-*` onto `--bigram-*` surface/rule/muted/sage tokens.

4. **Editorial Playfair hero.** Eyebrow → mono accent uppercase; `h1` → Playfair `clamp(46px,7vw,92px)`, weight 600, `ink`, with the title suffix as an **italic 500 accent** span (replacing the emerald→teal gradient text); lead → Source Serif `ink-2`; read-time → mono muted. Centered composition kept (presentation-only).

5. **Inline formulas through the shared `FormulaBlock`.** The three hand-typed Unicode `<div>` equations (`bg-black/30` + `emerald-500/15`) became `FormulaBlock accent="bigram"` calls rendering real KaTeX — the bigram `P(c_n | c_{n-1})` definition and both softmax forms — over the v8 `.formula` tokens (sunken `bg-2` well, `rule-2` hairline, mono accent equation, mono muted caption). Captions still come from the existing `coreIdea.formulaCaption` / `sampling.softmaxFormulaCaption` / `sampling.softmaxTempCaption` keys.

### How it meets the spec / standards
- **Apple-clean, typography-first:** hierarchy now comes from Playfair/Source Serif/Mono and spacing, not boxes or dots. No neon, no dashboard chrome, no traffic-light decoration.
- **Tokens only / properly scoped:** every value is a bridged `bg/text/border-bigram-*` utility or an explicit `var(--bigram-*)` arbitrary value (used for `accent-soft` and `on-accent`, which are intentionally not in the `@theme inline` bridge). Nothing leaks outside `[data-bigram-theme]`.
- **Behavior preserved:** state machines, animation timings, and the disclosure/sidebar open-close logic are unchanged.

### Notable before → after
- Figure: framed `--lab-card` card + RGB window dots → frameless editorial plane, numbered caption.
- Disclosure: faint header + loose chevron → affordant card-row with accent dot + expand/collapse pill + +/− disc.
- History: teal/emerald/amber/rose rainbow → green→sage scale, tokenized shell.
- Hero: emerald→teal gradient sans-serif title → editorial Playfair with italic accent suffix.
- Formulas: hand-typed Unicode on `bg-black/30` → KaTeX in the v8 `.formula` well.

### Skipped / needs human attention
- **CTA section + `TransitionMatrix accent="emerald"`** were left untouched — they fall outside the five assigned items and are owned by other agents in the orchestration. The "free lab" CTA button still has a literal `text-emerald-300/70` icon; flag for whoever owns the CTA re-theme.
- **`expand`/`collapse` labels** remain hardcoded English literals exactly as the original component had them (they were never wired to i18n, and `bigramNarrative.ui.*` keys do not exist — `ui.expand/collapse` live under `ngramNarrative`). Left as-is to avoid changing copy or editing i18n files. If localized labels are wanted, a human should add `bigramNarrative.ui.{expand,collapse}` to en/es.
- **`--color-bigram-accent-soft` / `-on-accent` are not in the `@theme inline` bridge** in `globals.css`, so I used `var(--bigram-*)` arbitrary values for those two. Note the shared `narrative-primitives.tsx` still uses the bare `bg-bigram-accent-soft` utility in a couple of places — if those ever render blank, the bridge (or those utilities) need a token owner's attention. Out of scope here.
- Verified: `tsc --noEmit` reports no errors in this file; `eslint` reports 0 errors (only a pre-existing unused-`trainingData` prop warning).
