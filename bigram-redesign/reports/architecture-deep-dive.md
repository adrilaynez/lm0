## ArchitectureDeepDive — v8 editorial-green retheme

### Files changed
- `src/features/lab/components/ArchitectureDeepDive.tsx` — full rewrite into the v8 language (the only file I changed; `page.tsx` import order was touched only by `eslint --fix` and the `data-bigram-theme` wrapper/`accent="bigram"` props there are pre-existing orchestration work, not mine).

### What I did
Rebuilt the three-column "Technical Specification" figure as three calm editorial movements, all token-only:
- **Section header** — replaced the `Cpu` icon + bold title with the v8 vocabulary: italic Playfair `§` numeral in accent + mono uppercase label + hairline `--bigram-rule` line, then a Source-Serif lead in `ink-2`. No box, no icon chrome.
- **1 · Mechanism** — a numbered editorial timeline. Step prose is Source Serif on `body`; numerals sit in a quiet `surface` disc with a `rule-2` ring and a `rule` connector spine. Each equation lives in a sunken `bg-2` formula well (`rule-2` hairline, `r-md`) with the KaTeX math forced to `--bigram-accent` (wrapper color + `[&_.katex]` override). The old per-step copy-pasted tooltip markup is now one typed `StepTooltip` component: a single quiet `?` disc that reveals an `elev` panel with a mono accent title + accent dot (the v8 callout voice) and, for softmax, an inline accent-ink equation.
- **2 · Analysis** — collapsed the two competing section accents (emerald + amber) into the **single-accent rule**: Capabilities = emerald `accent`, Constraints = terracotta `--bigram-wrong`. State is carried by a small fill dot + a hairline rule under each label and typography — no `CheckCircle2`/`AlertTriangle` icons, no boxes.
- **3 · Model card** — one calm `surface` panel (`rule-2`, `r-lg`); Playfair title, mono `muted` eyebrows in a real `<dl>`, `ink` values, the complexity as a hairline pill, and use-cases as `accent-soft` / `accent-ink` pills. Replaced the shadcn `Badge` + indigo pills entirely.

### How it meets the v8 spec + standards
- **Apple-clean / typography-first**: hierarchy comes from Playfair/Source Serif/JetBrains Mono and spacing; removed all borders-as-decoration, icons, and the `bg-white/[0.02]` card washes. One focal point per movement.
- **`--bigram-*` tokens only**: every color is a token (`bg-bigram-surface`, `text-bigram-accent`, `text-bigram-wrong`, `border-[color:var(--bigram-rule-2)]`, `bg-[var(--bigram-accent-soft)]`, etc.). No raw hex, no neon, no indigo/emerald/amber literals.
- **Properly scoped**: resolves through the existing `[data-bigram-theme]` chapter wrapper; no `[data-lab-theme]`/`--lab-*` touched; no other chapter's accent altered. Fonts use the registered `--bigram-font-*` vars.
- **Honest / minimal**: no fabricated bars here (this section has no probabilities); the single-accent can/cannot split is the honest "verdict" of the architecture. Reduced-motion safe — `FadeInView` and the lone tooltip fade both collapse to instant.

### Before → after
- Header: `Cpu` icon + `text-2xl font-bold text-white` → editorial numeral + mono label + hairline + serif lead.
- Three section labels in three colors (indigo / emerald / amber) → one accent system (emerald + terracotta), the v8 single-accent rule.
- Tooltip: 3× duplicated `bg-slate-900 border-white/10 rounded-2xl` blocks → one typed, accessible `StepTooltip` (`aria-expanded`/`aria-describedby`, keyboard focus, `role="tooltip"`).
- Model card: `bg-white/[0.02]` + shadcn `Badge` + indigo chips → calm `surface` panel + `<dl>` + accent-soft pills.

### Notes / human attention
- KaTeX color: math inherits `color` from its container, so the accent wrapper drives it; I added a `[&_.katex]` selector as belt-and-suspenders. Worth an eyeball pass in both light and dark themes to confirm the equation contrast reads well on the `bg-2` well.
- Accessibility: tooltip opens on hover **and** keyboard focus; the `?` is a real `<button>`. On touch it opens via focus (tap). No behavior/state machine existed to preserve beyond the tooltip, which I improved rather than copied.
- I did not edit i18n files; all strings reference existing `models.bigram.architecture.*` keys. The `architecture.steps.predicts/optimizes` keys exist in i18n but were unused by the original component and remain unused.
