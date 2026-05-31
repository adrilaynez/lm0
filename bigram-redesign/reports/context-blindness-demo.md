## ContextBlindnessDemo (§6 · The Fatal Flaw)

Re-themed the bigram cliffhanger visualizer into the v8 editorial-green language.

### Files changed
- `src/features/lab/components/ContextBlindnessDemo.tsx` (full rewrite, ~470 lines)

No other files touched. `en.ts` / `es.ts` untouched — the component reuses the existing
`bigramNarrative.contextBlindness.*` keys verbatim. No `[data-lab-theme]` / `--lab-*` / other-chapter
files were modified.

### Concept (taught ONE thing)
The bigram only ever sees the **last character**, so longer context is invisible to it. `th`, `sh`, `wh`
all collapse to the same answer because the model only reads the trailing `h`.

### What I did
- **Phase 1 · Explore** — prefix picker is now the v8 **segmented control** (sunk `--bigram-bg-2` rail,
  active cell filled `--bigram-accent` with a shared `layoutId` slider) instead of three bordered keycaps.
  "What the model sees" is editorial, not boxed: the leading letter dims to a struck ghost and **drifts out
  of the model's eye** (`AnimatePresence` popLayout) while only the surviving `h` stays sharp in
  `accent-ink`. Predictions now render with the shared **`HonestBar`** primitive (honest fixed axis 0.5,
  winner `top` + brighter + glint + count-up) — and because every prefix yields the *same* distribution,
  switching the prefix visibly moves **nothing**, which is the lesson.
- **Phase 2 · Reveal** — the three prefixes stack vertically, each striking out its blind first letter,
  feeding into **ONE shared `HonestBar` column**. The old neon `=  identical  =` chrome is replaced by a
  calm **sage rule line** ("All three are identical!") in the editorial-insight voice.
- **Phase 3 · Verdict** — the red callout box became the SAGE **`Verdict`** primitive naming the flaw
  ("One-Letter Amnesia"), over a compact `th/sh/wh → e 32.0%` recap with struck blind letters.

### How it meets the v8 spec + standards
- **Tokens only** — every color is a `--bigram-*` variable (`accent`, `accent-ink`, `on-accent`, `bg-2`,
  `ink`, `muted`, `dim`, `sage`, `rule-2`, and `--bigram-wrong` used *sparingly* only as the "blind" tint).
  No raw hex, no neon emerald/rose literals, no `lucide-react` Eye/EyeOff icons (removed).
- **Properly scoped** — pure inline `var(--bigram-*)` reads; inherits the chapter's `[data-bigram-theme]`
  scope. Nothing leaks to other chapters.
- **Honest bars** — uses the canonical `HonestBar` (fixed axis, partial fill = real model uncertainty,
  winner-last, glint, count-up). **Verdict** is the sage-voice primitive. No sliding lens applies here.
- **Apple-clean** — typography-first, one focal point per phase, segmented control + sage rule instead of
  card/border clutter, generous space, premium spring/drift motion that *explains* (the blind char
  literally leaving the eye) rather than decorates.
- **Reduced-motion safe** — `useReducedMotion()` gates every entrance, drift, count-up and glint; final
  state shows instantly.

### Before → after
- Picker: 3 bordered emerald/white keycaps → sunk segmented rail with a sliding accent fill.
- Bars: bespoke `bg-emerald-400/70` divs normalised to 100% → shared honest `HonestBar` (fixed axis,
  winner marked, count-up).
- Phase 2 closer: rose neon `=` badge → sage hairline rule.
- Phase 3: red `bg-red-500` callout → sage `Verdict` panel.
- All `text-white/40`, `text-emerald-300`, `text-rose-400` etc. → `--bigram-*` tokens.

### Notes / human attention
- The `Verdict` primitive requires a `sub` prop; this view has no count/percentage tail, so `sub=""` is
  passed (renders an empty mono line, visually inert). If a tail is ever wanted, an i18n key would be
  needed — out of scope here since copy must not change.
- `PREDICTIONS` are illustrative/simulated (same as the original), kept identical across prefixes by
  design — that identity *is* the teaching point.
- Pre-existing unrelated tsc errors remain in the repo (`.next/types/validator.ts`, and a
  `showWindowDots` prop on `FigureWrapper` at `BigramNarrative.tsx:576` in the Normalization section) —
  **not** introduced by this change and not in §6. `tsc --noEmit` reports zero errors for this file.
