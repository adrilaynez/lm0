## TransitionMatrix — bigram accent (editorial-green)

### Files changed
- `src/features/lab/components/TransitionMatrix.tsx`

### What I did
Added a fourth, fully token-driven `accent="bigram"` option to `TransitionMatrix` so it renders
editorial-green when used inside the bigram chapter. Strictly additive — no existing accent
(`cyan` / `emerald` / `amber`) was touched. Token pass only; the heatmap/slice state machine,
canvas geometry, tooltip RAF logic, zoom and fullscreen behaviour are all unchanged.

Three surfaces needed a bigram branch:

1. **`accentStyles.bigram`** — new entry mirroring the established `LabSectionHeader` pattern:
   `bg-bigram-accent-soft`, `text-bigram-accent-ink`, `bg-bigram-accent`, and
   `border-[color-mix(in_oklab,var(--bigram-accent)_30%,transparent)]`. Drives the badge, search
   input focus ring, info-panel pulse, dataset/info cards, tooltip pair chips and the slice-view
   distribution bar.
2. **Canvas `draw()`** — the heatmap fill was hardcoded `rgba(r,g,b,alpha)`. For `bigram` I keep it
   token-correct: resolve the live `--bigram-accent` via `getComputedStyle(canvas)` (the canvas
   inherits from the `[data-bigram-theme]` wrapper, so it follows dark/light), set it as
   `fillStyle`, and apply cell intensity through `ctx.globalAlpha` (reset to 1 after each cell).
   No green literal is ever written into the canvas. The highlight stroke swaps the amber default
   for the `--bigram-sage` token only in the bigram branch.
3. **Color legend** — extracted a `legendSwatch(a)` helper. For `bigram` it returns
   `color-mix(in oklab, var(--bigram-accent) N%, transparent)` so the rare→common ramp stays in
   the token system and tracks the theme; literal accents keep their original rgba. Legend
   captions use `text-bigram-dim` instead of `text-white/25` under the bigram accent.

### How it meets the v8 spec + standards
- **`--bigram-*` tokens only.** Every green pixel resolves from `--bigram-accent` /
  `-accent-soft` / `-accent-ink` / `-sage` / `-dim` — no raw hex, no neon emerald literal.
- **Properly scoped.** All bigram colour is gated behind the opt-in `accent="bigram"` prop and the
  tokens themselves live under `[data-bigram-theme]`. The `[data-lab-theme]` / `--lab-*` blocks and
  the cyan/amber/emerald branches are byte-for-byte unchanged, so N-gram and other chapters keep
  their colour.
- **Apple-clean.** No new chrome, borders or cards added; the surface is identical to before, only
  the accent hue changes. Soft `accent-soft` fills and `color-mix` rings keep it calm, not neon.

### Before → after
- Before: only `cyan | emerald | amber`; the bigram chapter passed `accent="emerald"` (raw
  `emerald-500` literals + hardcoded `rgba(16,185,129,...)` heatmap).
- After: a `bigram` accent exists whose every colour is a `--bigram-*` token and theme-aware in
  both dark and light.

### Notable / needs human attention
- I did **not** switch the call sites (`BigramNarrative.tsx`, `BigramDiagramExperience.tsx` still
  pass `accent="emerald"`). My scope was to add the option without changing behaviour; flipping
  those two props to `accent="bigram"` is a one-line change the page/narrative agent should make so
  the matrix actually renders editorial-green in the chapter.
- Neutral chrome (`bg-white/[0.04]`, `border-white/10`, `bg-black/40`, the `bg-slate-900/95`
  tooltip panel) is shared across all four accents and was left untouched to avoid regressing
  cyan/amber. It reads fine over the bigram dark surface; if a human wants it themed for bigram,
  that should be a separately scoped follow-up.
- `accentStyles.bigram.barBg` is defined for consistency with the other entries but, like theirs,
  is currently unused in render.
- Type check (`tsc --noEmit`) surfaces only a pre-existing, unrelated stale
  `.next/types/validator.ts` error; nothing in the files I touched errors.
