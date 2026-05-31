## DatasetExplorerModal — Corpus Evidence (editorial-green v8)

### Files changed
- `src/features/lab/components/DatasetExplorerModal.tsx` (full rewrite, logic preserved)

### What I did
Re-themed the "Corpus Evidence" modal into the v8 editorial-green language, gated so the
non-bigram consumer path is byte-for-byte unaffected.

- **Split by `modelType`.** The component now branches early:
  - `ngram` path → the **original neutral lab styling** (slate-900 panel, indigo accents,
    `text-white/*`) is kept intact, just routed through the existing `datasetExplorer.*` i18n
    keys instead of hardcoded English. Nothing green leaks into it.
  - `bigram` path (default) → a new editorial-green panel using **only `--bigram-*` tokens**
    (`bg-bigram-surface`, `text-bigram-ink/-muted/-dim/-body/-accent-ink/-accent-bright/-wrong`,
    plus `var(--bigram-r-*)` radii and `var(--bigram-rule*)` hairlines). No raw hex, no neon.
- **Scoping.** The bigram overlay is a fixed-position dialog rendered *outside* the page's
  `[data-bigram-theme]` wrapper, so it sets its **own** `data-bigram-theme={theme}` (from
  `useLabTheme()`) on its root. Every `--bigram-*` var resolves dark/light from that scope and
  nothing else on the page is touched. `[data-lab-theme]` / `--lab-*` are never referenced in the
  bigram branch.
- **i18n.** All visible strings go through `useI18n()` `t("datasetExplorer.*")` (title, subtitle,
  scanning, occurrencesFound, source, contextSnippets, noExamples, fetchError) — keys already
  existed; `en.ts` / `es.ts` were **not** edited. The error fallback now uses
  `t("datasetExplorer.fetchError")` instead of a hardcoded English string.
- **Logic untouched.** Same `useEffect` fetch, same `bigramDatasetLookup` / `datasetLookup`
  contract, same `contextTokens` dependency key, same `displayContext` construction, same
  `"pre[[match]]post"` snippet parsing (factored into a shared `parseSnippet` helper).

### How it meets the v8 spec + standards
- **Apple-clean / one focal point.** The panel leads to a single honest number — the raw
  occurrence **count**, counted up (easeOutCubic ~620ms) in `accent-bright` mono, with the source
  as a quiet caption. This is the "why did it learn this?" evidence, shown as a real count (never
  normalized) — same honesty principle as the HonestBar.
- **Typography-first, minimal chrome.** Header is a mono accent eyebrow + the literal bigram pair
  `c → n` (src dim, arrow dim, dst bold ink) — mirrors the `.barrow` label voice. Section uses the
  v8 "mono uppercase label + trailing hairline rule, no box" pattern. No traffic-light dots, no
  card-soup, no excess borders.
- **Sage/accent lens on snippets.** The matched pair in each corpus snippet is lifted by ONE calm
  `accent-soft` lens with a subtle inset accent ring — the editorial "sliding lens" voice, not a
  heavy neon pill. Snippets stagger in (40ms steps) so the evidence reads in sequence.
- **Premium, reduced-motion-safe motion.** Backdrop fade + panel spring-in (`AnimatePresence`),
  count-up, staggered snippets — all gated by `useReducedMotion()`, which shows the final state
  instantly (no count-up, no stagger, no transform). Motion clarifies, never decorates.
- **Materials.** Scrim is `color-mix(bigram-bg-2, black)` with a light blur (not pure black);
  panel carries the v8 top-bevel + deep drop shadow.

### Notable before → after
- Before: hardcoded English ("Corpus Evidence", "Scanning training corpus…"), `bg-slate-900`,
  `text-emerald-400`, `bg-indigo-500`, `Database` icon in an indigo chip, traffic-light-free but
  dashboard-ish two-card grid, no enter/exit animation, no i18n, no reduced-motion handling.
- After: token-only editorial-green panel, full i18n, count-up focal number, lens-highlighted
  snippets, spring entrance + exit, reduced-motion safe — while the ngram branch keeps the old look.

### Skipped / needs human attention
- **Close-button aria-label:** there is no `common.close` i18n key and I was instructed not to edit
  `en.ts` / `es.ts`, so the close `<button>` (both branches) has no `aria-label` — matching the
  original (which also had none). If desired, add `common.close` ("Close" / "Cerrar") later and wire
  it into both buttons for a small a11y win.
- **Verification:** `tsc --noEmit` reports **no errors in this file**. Two pre-existing, unrelated
  errors remain in the repo (`.next/types/validator.ts` stale generated file, and
  `CorpusCountingIdea.tsx` `advanceManual` — another agent's in-flight work); neither involves this
  modal. Did not run the dev server or `npm run build` per instructions.
- The `ngram` `modelType` path appears currently unused by the shipped pages (the N-Gram chapter
  uses the separate `DatasetExplorer.tsx`), but I preserved it fully so any future caller keeps the
  neutral lab look.
