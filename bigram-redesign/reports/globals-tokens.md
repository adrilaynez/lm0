# Bigram v8 — Foundations (shared/global files)

## Tokens, theme scope, accent map, page scoping, i18n keys

Owns all shared/global files for the editorial-green redesign. Five tasks completed in order, then typecheck.

### Files changed
- `src/app/globals.css` — added the `--color-bigram-*` bridge + the `[data-bigram-theme]` scope blocks.
- `src/features/lab/hooks/useLabTheme.ts` — system `prefers-color-scheme` fallback.
- `src/features/lab/components/LabSectionHeader.tsx` — added the `bigram` accent entry.
- `src/app/lab/bigram/page.tsx` — wrapped both modes in the bigram scope, repainted footer CTA, switched 3 headers to `accent="bigram"`.
- `src/i18n/en.ts` and `src/i18n/es.ts` — added the new visualizer keys (verbatim per spec).

### What I did
1. **globals.css** — Inside the existing `@theme inline` block I added the 15 `--color-bigram-*` bridge vars (each `var(--bigram-*)`, not raw values) so `bg-bigram-*` / `text-bigram-*` / `border-bigram-*` utilities generate and still follow the theme scope. After `[data-lab-theme="light"]` (untouched) I inserted a base `[data-bigram-theme]` block (radii + font aliases reusing existing `--font-*` registrations) plus the full `[data-bigram-theme="dark"]` and `[data-bigram-theme="light"]` token sets, **verbatim** from the spec.
2. **useLabTheme.ts** — When no `localStorage` value exists, it now falls back to `window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"` instead of hard "dark". Manual `setTheme`/`toggle`, persistence, and `isInitialized` are intact.
3. **LabSectionHeader.tsx** — Added `"bigram"` to the `Accent` union and a token-driven `ACCENT_MAP.bigram` entry (`bg-bigram-accent-soft` numeral, accent-ink→accent-2 title gradient, accent→accent-2 bar, `text-bigram-muted` desc). The emerald/violet/amber/indigo/blue/rose entries are unchanged.
4. **page.tsx** — Read `theme` from `useLabTheme()`; wrapped the **entire** educational/free-lab ternary (inside `<LabShell>`, modals left outside) in `<div data-bigram-theme={theme} className="bg-bigram-bg text-bigram-ink min-h-screen">`, so the scope applies in both modes. Repainted the footer CTA from amber to bigram tokens. Switched the three `LabSectionHeader` calls (2.1/2.2/2.3) from emerald/violet/amber to `accent="bigram"`.
5. **i18n** — Added the new keys at the exact spec paths in both files with identical nesting.

### How it meets the v8 spec + standards
- **Apple-clean / single accent:** the three section headers collapse to one editorial-green accent — no more competing emerald/violet/amber.
- **`--bigram-*` tokens only:** no raw hex or neon literals in the components; color flows through tokens, so dark/light both work and follow `useLabTheme`.
- **Properly scoped & additive:** all green lives under `[data-bigram-theme]` or the opt-in `accent="bigram"` prop. `[data-lab-theme]` / `--lab-*` blocks are untouched; no existing accent value was overwritten — other chapters keep cyan/amber/violet.
- **Narrative copy unchanged:** only new visualizer keys were added; existing keys left as-is.

### Notable before → after
- Footer CTA: `bg-amber-500/10 … border-amber-500/20 … text-amber-300` → `bg-bigram-accent-soft … text-bigram-accent-ink` (theme-aware).
- Chapter chrome: previously inherited generic lab/white tones → now sits on `bg-bigram-bg text-bigram-ink` in both educational and free-lab modes.

### New i18n key paths (for downstream widget agents)
```
bigramNarrative.pairHighlighter.currentPairLabel
bigramNarrative.pairHighlighter.firstTime
bigramNarrative.pairHighlighter.seenRepeats        // {n}
bigramNarrative.pairHighlighter.patternLabel
bigramNarrative.pairHighlighter.patternRepeats
bigramNarrative.pairHighlighter.patternUnique
bigramNarrative.corpusCounting.verdictLabel
bigramNarrative.corpusCounting.verdictMain         // {char} {best}
bigramNarrative.corpusCounting.verdictSub          // {n} {total} {pct}
```

### Skipped / needs human attention
- `npx tsc --noEmit` reports exactly one error: `.next/types/validator.ts(42,39): Cannot find module '../../src/app/about/page.js'`. This is a **stale Next.js generated artifact** (there is no `src/app/about` directory and none of the six edited files relate to it). It pre-exists my changes; a `.next` cache clear / rebuild will clear it. All six source files I touched typecheck clean.
- New shared primitives (`HonestBar`, `PairChip`, `Verdict`) under `src/features/lab/components/bigram/` are out of scope for this foundations task — left for the widget agents, which can now rely on the tokens, accent, scope, and i18n keys above.
