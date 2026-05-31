## HistoricalContextPanel (editorial-green collapsible)

### Files changed
- `src/features/lab/components/HistoricalContextPanel.tsx` — full re-theme + redesign.
- `src/app/lab/bigram/page.tsx` — pass localized chrome `labels` to the panel (call-site only).

### What I did
Rebuilt the panel from a slate/white-alpha "window" with an emerald header bar into a v8 `.xpand`
**disclosure** in the Bigram editorial-green language:

- **Header is one calm control**, not a chrome bar: a 2.5px accent dot, a serif (Source Serif) title,
  and a mono pill hint on the right. The whole row is the button. Resting state is a near-invisible
  `color-mix(ink 3%)`; **open/hover warms to `--bigram-accent-soft`** with a hairline `--bigram-rule`
  border — state by fill, not by piling on borders.
- **The pill carries the affordance**, Apple-style: a stable "Learn More" label plus an
  `accent`/`on-accent` disc whose `+` **springs to `×` (rotate 45°)** when open. No second "Close"
  string needed — the glyph is the state, which also avoided inventing a missing i18n key.
- **Body is typography-first**, one focal point per block:
  - *Description* — mono uppercase eyebrow over `--bigram-body` serif copy.
  - *Key Limitations* — carried by warm **`--bigram-wrong`** dot markers (honest "what it cannot do"
    voice, deliberately distinct from the accent), `ink-2` serif.
  - *Evolution to Modern AI* — the payoff, rendered as the **sage insight panel** the spec reserves for
    takeaways: `linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)` + 30% sage border,
    `r-lg`. This is the conceptual "where it leads" beat.
- **Motion (premium, reduced-motion safe):** `AnimatePresence` height+opacity collapse
  (0.42s height / 0.3s opacity, ease `[.2,.8,.2,1]`), a spring on the glyph rotate, and a 1px lift on
  header hover. Under `prefers-reduced-motion` everything snaps to final state (no height anim, no lift,
  instant glyph). Added `aria-expanded` / `aria-controls` + `useId` for correct disclosure semantics.

### How it meets the v8 spec + standards
- **Tokens only:** exclusively `--bigram-*` — `bg/text-bigram-*` utilities where bridged
  (`ink`, `ink-2`, `body`, `muted`, `accent`, `wrong`) and inline `var(--bigram-*)` for the rest
  (`accent-soft`, `accent-ink`, `on-accent`, `sage`, `sage-soft`, `rule`, `r-md/lg/pill`). No raw hex,
  no neon literals. Radii use `rounded-[var(--bigram-r-{sm,md,lg,pill})]` (matching `KeyTakeaway`/`narrative-primitives`)
  because the spec's `@theme` bridge intentionally maps only colors, not radii.
- **Scoped:** all green is reached via `var(--bigram-*)` and `*-bigram-*` utilities, which resolve only
  inside the page's `data-bigram-theme` wrapper. No `[data-lab-theme]` / `--lab-*` touched; no other
  chapter can regress.
- **i18n preserved:** the panel takes a typed `labels?: Partial<…>` (English defaults so it still works
  standalone). The bigram page feeds it the **existing** `models.ngram.historical.*` chrome keys
  (`title`, `learnMore`, `description`, `limitations`, `evolution`) — no i18n files edited; narrative
  copy unchanged. Data (description/limitations/evolution body) is still passed translated from the page.
- **Logic preserved:** same `collapsible` prop, same default-open-when-not-collapsible behavior,
  same `if (!data) return null` guard.
- **Apple-clean / anti-noise:** no traffic-light dots, no heavy frame, no stacked cards/borders — one
  hairline disclosure, one focal point, restraint over ornament.

### Before → after
- Before: `bg-slate-900/50`, `border-white/10`, `bg-white/5` header, `text-emerald-400` icon,
  `bg-emerald-500/10` evolution box, `bg-red-400` bullets, hardcoded English chrome.
- After: editorial-green disclosure; sage insight panel for evolution; `--bigram-wrong` limitation
  markers; spring +/× disc; localized chrome via existing i18n keys.

### Notable / needs human attention
- Replaced the `lucide-react` `BookOpen` icon with the accent dot marker (v8 vocabulary avoids decorative
  iconography in figure chrome). `ChevronDown` swapped for the rotating disc glyph.
- The "open/close" affordance intentionally uses **only the glyph** for state, so no `historical.close`
  i18n key was needed (and none exists). If a future design wants a text swap, add a `close` key to both
  locale files and re-introduce the optional `close` label.
- Verified with `tsc --noEmit` (0 errors in touched files; the one repo error is a pre-existing stale
  `.next/types` reference to `about/page.js`, unrelated) and `eslint` (0 errors; the lone warning is the
  pre-existing import-sort note on `page.tsx`, not from my edit). Did not build or run the dev server.
