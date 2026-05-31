## SamplingMechanismVisualizer (Bigram §5 · how the next character is drawn)

### File changed
- `src/features/lab/components/SamplingMechanismVisualizer.tsx` — full rewrite (sole file touched).

### Concept it teaches (ONE)
The next character is *drawn* from the probability distribution — chance, not certainty. The model
lays every candidate end-to-end on a single 0→1 lane (sized by its probability), throws ONE
uniform-random dart, and wherever the dart lands picks the character. So "h" (53 %) owns half the
lane and wins about half the time — likely, never guaranteed. Roll repeatedly and the tally below
visibly drifts toward the true probabilities: the law of large numbers, shown not told.

### Design direction
- One **probability lane** (0→1) is the single focal point — segments sized by p, sorted
  descending, so "h" visibly owns half the line.
- A **dropping dart** is the verb. It sweeps the lane, decelerates, then springs onto the true
  uniform position; the segment it hits lights to `accent-bright` while the rest dim. "Weighted
  random" becomes physical.
- State by **fill + brightness**, never chrome: segment fill encodes p
  (`color-mix(accent-2 42→100%, surface)`), the just-landed segment is `accent-bright`.
- A quiet **roll readout** (`rolled 0.314 → h`) ties the abstract number to the landed position.
- A **frequency memory** below is the payoff: each roll adds a count; the observed-frequency bar
  (honest fixed axis = the largest true p) drifts toward a **sage true-probability tick**. Over many
  rolls the bars converge on the ticks.
- Typography-first, mono data, editorial calm; sage reserved for the convergence target (insight),
  emerald accent for the interactive draw.

### Interaction model
- Primary: press **Roll** → dart sweeps, springs to the uniform position, the segment lights, the
  pick is announced, and the tally records it.
- Repeat rolls accumulate; the frequency bars converge toward the sage ticks (true p) live.
- Reset (the `N×` chip in the memory header) clears the tally.
- Reduced-motion: dart lands instantly, no sweep/spin; bars snap; everything stays legible.

### How it meets the v8 spec + standards
- **`--bigram-*` tokens only.** 36 `var(--bigram-*)` references; every other colour is a `color-mix`
  over a bigram token. Verified: zero raw hex, zero `rgba/oklch` literals, zero `emerald/teal/cyan/
  sky/blue` or `text/bg/border-white` Tailwind classes (the original was built entirely from a
  5-colour `bg-emerald/teal/cyan/sky/blue` array + `text-white/NN`). Fonts are the registered
  `--font-jetbrains-mono` var.
- **Properly scoped / no regressions.** Self-contained inline-token styling (same approach as the
  shared bigram primitives). Touches no `[data-lab-theme]`, `--lab-*`, `--ls-*`, or any other
  chapter's files. Resolves under the chapter's `[data-bigram-theme]` scope set by the consumer.
- **Honest bars.** The frequency memory uses a fixed axis (`max true p`), so the lead bar can fill
  the track while every other reads as its real share — never normalised to 100 %. The sage tick is
  the honest convergence target.
- **Apple-clean / minimal.** One focal point (the lane), state by fill not borders, no cards, no
  traffic-light dots, no neon. Premium motion (sweep → spring landing, dim cascade, fill tweens) is
  used only where it clarifies the draw. Removed the old multi-colour ruler, the white needle, the
  bordered candidate cards, the ✓ badge, and the per-pick history chips.
- **i18n.** Uses only the existing `bigramNarrative.samplingMechanism.*` keys (`after`,
  `probabilitySpace`, `roll`, `rollAgain`, `rolled`, `history`). Did not edit `en.ts` / `es.ts`.
- **Lint/types.** `tsc --noEmit` clean for this file; `eslint` exits 0 (incl. the strict
  `react-hooks/refs` rule — the phase ref is synced in an effect, never during render).

### Before → after
- Before: a 5-segment ruler painted in `bg-emerald/teal/cyan/sky/blue` with `text-white/NN` labels, a
  white triangle needle, five bordered candidate rows with gradient bars and a ✓, and a row of
  per-pick history chips. Dashboard-ish, multi-hue, off-palette.
- After: one editorial-green lane with a dropping dart, a single-line roll readout, and a converging
  frequency memory with sage true-p ticks — the sampling idea plus its law-of-large-numbers payoff.

### Logic improvements (in service of the concept)
- Replaced the per-pick history strip with a **frequency tally + convergence ticks**, which directly
  demonstrates *why* sampling by probability is meaningful (frequencies approach probabilities). This
  is the deeper teaching beat the original lacked.
- The roll math is unchanged in spirit (inverse-CDF over the cumulative ranges) but cleaned into
  `buildSegments` / `segmentForRoll`; the dart sweep is decoupled from the final uniform value so the
  anticipation never lies about where it lands.

### Notes / human attention
- I kept token-driven **inline styles** (matching the shared bigram primitives) rather than adding
  `.bw-*` classes to `globals.css`, so the change is confined to this one file. If a later pass wants
  the CSS-class approach, values map cleanly.
- No new primitive was extracted: the memory bars are bespoke (they carry a second mark — the sage
  true-p tick — which `HonestBar` doesn't model), so reusing `HonestBar` here would have lost the
  convergence teaching. Left as a deliberate, self-contained variant.
- The sage tick has no dedicated i18n label (none exists in the allowed key set, and I must not edit
  the dictionaries), so it is self-explanatory by position/convergence rather than captioned. If a
  future i18n pass adds a "true probability" key, a one-line legend could be added.
