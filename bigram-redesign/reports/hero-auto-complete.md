## Hero Auto-Complete (`bw-auto`)

The Bigram chapter's opening visualizer — type one letter, the model predicts the next character from
counts → probabilities. Rebuilt into the v8 editorial-green language.

### Files changed
- `src/features/lab/components/HeroAutoComplete.tsx` — full redesign (the only file touched).

No CSS, i18n, or other component was modified. The `data-bigram-theme` scope is already set on the
page wrapper (`src/app/lab/bigram/page.tsx`), so `--bigram-*` tokens resolve correctly with no new
plumbing. Existing i18n keys (`bigramWidgets.heroAutoComplete.placeholder | after | hint`) were reused.

### What I did
- **Removed all neon and raw hex.** Deleted the cyan→teal→emerald **gradient focus border**, the
  `bg-emerald-500/20` idle ring, the `bg-[#0a0a0a]` input, the `from-emerald-500 to-emerald-400` bar
  gradient, and every `text-white/xx` literal. Dropped the now-unused `cn` import.
- **Keycap input** (per `.bw-auto__input`): a square `--bigram-accent-soft` fill with a `2px
  --bigram-accent-2` border and a large mono letter inside; caret is `--bigram-accent`. On focus the
  border brightens to `--bigram-accent` + a soft `--bigram-accent-soft` ring — the only highlight.
  The letter settles in with a gentle spring; an idle `--bigram-accent-soft` pulse invites the first
  keystroke and is removed entirely under reduced-motion.
- **Honest predictions via the shared `HonestBar`.** Replaced the bespoke bars with the canonical
  primitive on its FIXED axis (default 0.5). Each row passes `src`, `dst`, `value` (0..1, not a %),
  and `top`. Numbers count up; the winner bar fills brightest with a glint — all handled by the
  primitive, so the hero now matches the rest of the chapter exactly.
- **Winner-last cascade.** Bars are staged with `delay = (n-1-i) * 0.12s`, so the runners fill first
  and the most-likely bar lands LAST (brightest `accent-bright` + glint sweep) — the eye finishes on
  the model's bet.
- **Calm editorial framing.** Mono uppercase eyebrow (`After "x", likely next`), serif-italic empty
  state, no card/border chrome of its own (the `FigureWrapper` already frames the figure). One focal
  point: the keycap, with the distribution reading out beside it. Space is rendered as `␣` in the
  eyebrow and (via the primitive) in the bar label.

### How it meets the v8 spec + standards
- **Honesty preserved (the whole point):** bars are no longer normalized so the top is always 100%.
  `q` now fills the track almost completely (.92) while a `.13` runner reaches only ~26% — weak
  guesses look weak. This is the single concept the hero teaches, made visible.
- **Apple-clean / one focal point:** typography-first, generous space, one keycap anchor, no neon, no
  dashboard, no competing elements. The extra premium is in finish (spring settle, soft focus ring,
  winner-last glint) not in added chrome.
- **Tokens only / properly scoped:** every color is a `--bigram-*` token (or `--bigram-r-*` radius);
  no `--lab-*`, no hex, no Tailwind color literals. All green is gated by the page's
  `[data-bigram-theme]` scope, so other chapters keep their accents untouched.
- **Reduced-motion safe:** the spring, idle pulse, and enter/exit transitions are all suppressed when
  `prefers-reduced-motion` is set; the primitive already drops glint + count-up.

### Before → after
- Focus border: cyan/teal/emerald gradient → none (soft `--bigram-accent` ring only).
- Input: black `#0a0a0a` box, white letter → `--bigram-accent-soft` keycap, accent-2 border, ink letter.
- Bars: normalized-to-100% emerald gradient, integer `%` → fixed-axis `HonestBar`, one-decimal count-up,
  winner brighter and last.

### Notes / left for humans
- The surrounding `FigureWrapper` (in `BigramNarrative.tsx`) still renders the older `--lab-*` figure
  chrome **with traffic-light window dots** for this figure (`showWindowDots` defaults to true). That
  is outside this widget's scope but conflicts with the v8 "editorial figure: no dots" rule — worth a
  separate pass on the wrapper / its call site.
- Responsive: the keycap uses `clamp()` and the row wraps (`flex-wrap`) with a 260px min on the
  predictions, matching the v8 `@media (max-width: 460px)` stacking behavior; no horizontal scroll.
- Typecheck: clean for this file. The only project-wide `tsc` error is a pre-existing stale
  `.next/types/validator.ts` reference to `about/page` — unrelated to this change.
