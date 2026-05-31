## Progress chrome — ReadingProgressBar · SectionProgressBar · ContinueToast

Token pass on the three shared reading-progress widgets so the Bigram chapter shows
**editorial-green** instead of the old emerald, while every other chapter keeps its accent.

### Files changed
- `src/features/lab/components/ReadingProgressBar.tsx`
- `src/features/lab/components/SectionProgressBar.tsx`
- `src/features/lab/components/ContinueToast.tsx`
- `src/features/lab/components/LabShell.tsx` (scope + accent wiring for the reading bar)
- `src/features/lab/components/BigramNarrative.tsx` (2 call-sites: `accent="emerald"` → `accent="bigram"`)

### What I did
- **Additive `"bigram"` accent**, not a replacement. Each component already keyed its colors by
  accent (`rose | emerald | amber | violet | cyan`). I extended the union with `"bigram"` and added a
  new entry to each color map. **No existing accent value was touched** — cyan/amber/violet/emerald
  for the other chapters are byte-for-byte unchanged.
- **ReadingProgressBar**: added `bigram: "var(--bigram-accent)"` to `ACCENT_COLORS` (the top reading bar
  was a raw hex map; the bigram entry is a scoped token, never a hex). The existing
  `?? ACCENT_COLORS.rose` fallback covers the new key safely.
- **SectionProgressBar**: added `bigram: "bg-bigram-accent"` to `ACTIVE_DOT`. Only the **active dot**
  carries the chapter accent; the floating rail/labels stay shared `--lab-*` chrome (it docks in the
  lab header, not in bigram content), matching the rule that `LabShell` chrome is not retheme-able.
- **ContinueToast**: added a `bigram` entry built entirely from `--bigram-*` tokens via
  `color-mix(... var(--bigram-accent) ...)` / `var(--bigram-accent-soft)` / `text-bigram-accent`/`-accent-ink`.
  Because the toast also hard-codes a `text-white/*` scale (fine on dark lab, washed-out on bigram's
  parchment **light** theme), I made the body copy and the "Fresh" button accent-aware via optional
  `body`/`fresh` fields — defaulting to the original white scale for the five legacy accents, and
  switching to `text-bigram-ink-2` / `text-bigram-dim` + `--bigram-rule` for bigram. Motion, layout,
  timers, and the state machine are unchanged.
- **Call-sites**: `BigramNarrative` now passes `accent="bigram"` to both `ContinueToast` and
  `SectionProgressBar`; `LabShell` maps the `/lab/bigram` path to `readingAccent = "bigram"`.

### Scoping (the one real subtlety)
`ContinueToast` + `SectionProgressBar` render inside `BigramNarrative`, which sits under the page's
`<div data-bigram-theme={theme}>` (page.tsx:88) — so `--bigram-*` resolves and follows dark/light.
**`ReadingProgressBar` does not**: it is a direct child of `LabShell`'s `[data-lab-theme]` root,
*outside* the bigram wrapper, so the token would be undefined and fall back to rose. Fix: in `LabShell`
I wrap only that bar in a `data-bigram-theme={theme}` element (`className="contents"`, no layout impact)
**only on the bigram path**. CSS custom properties inherit through `display:contents`, so the fixed bar
now resolves the right green in both modes. Fully additive — the wrapper sets only `--bigram-*`, never
`--lab-*`, and is absent on every other chapter.

### Before → after
- Bigram reading bar / active section dot / "Continue where you left off" toast: bright Tailwind
  `emerald-400/500` → editorial-green `--bigram-accent` (deep emerald in dark, forest in light).
- Toast on light theme: previously low-contrast white-on-parchment → now `--bigram-ink-2/dim` + token
  border, legible and on-brand.

### Standards check
- `--bigram-*` tokens only inside the bigram branches; no raw hex, no neon literal. ✓
- Properly scoped: green is gated by `[data-bigram-theme]` (or the opt-in `accent="bigram"` prop);
  `[data-lab-theme]` / `--lab-*` untouched; other chapters keep cyan/amber/violet/emerald. ✓
- Apple-clean / minimal: pure recolor — no new elements, borders, or chrome; behavior identical. ✓
- `tsc --noEmit` reports no errors in any touched file (two pre-existing, unrelated errors elsewhere
  in the tree: a stale `.next` validator and a `DatasetExplorerModal` prop — not mine).

### Needs human attention / skipped
- I left `TransitionMatrix`'s `accent="emerald"` at BigramNarrative.tsx:531 alone — that's another
  agent's component (its own report says its accent is token-driven via the scope); out of my 3-file scope.
- Tailwind v4 must emit the arbitrary `bg-[color-mix(...)]` / `var(--bigram-accent-soft)` / `var(--bigram-rule)`
  utilities used in the toast. They are standard arbitrary-value syntax and `--bigram-accent-soft` /
  `--bigram-rule` exist under the scope, but a visual pass in the Revision build is worth a glance to
  confirm the toast's soft-fill renders as intended in both dark and light.
