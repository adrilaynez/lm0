# SectionDivider — free-lab branch re-themed to editorial-green (v8)

## Section Divider (chapter free-lab divider)

### Files changed
- `src/features/lab/components/SectionDivider.tsx` — added an opt-in `accent?: "bigram"` branch.
- `src/app/lab/bigram/page.tsx` — the three free-lab `<SectionDivider>` calls (01 / 02 / 03) now pass `accent="bigram"`.

### What I did
`SectionDivider` is a SHARED component: the bigram, mlp and neural-networks free-lab pages all use it, and the
educational vs. free-lab look is driven by `useLabMode()` (educational = amber, free = cyan). I did **not**
rewrite the cyan/amber logic — I added a third, opt-in branch following the exact precedent already set by
`LabSectionHeader` (`accent="bigram"`):

- **Numbered marker** — fill + hairline disc (never a heavy ring): `bg-[var(--bigram-accent-soft)]`,
  `text-bigram-accent-ink`, a `color-mix(var(--bigram-accent) 30%)` hairline border, and a soft
  `color-mix(var(--bigram-accent) 45%)` glow. Mono numeral. Replaces the cyan
  `border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-300/70` disc.
- **Gradient rule** — the full-width hairline now fades through
  `color-mix(in oklab, var(--bigram-accent) 22%, transparent)` instead of `via-cyan-500/20`. Same fade-in-from-left
  motion, kept verbatim.
- **Title** — editorial Playfair (`var(--font-playfair)`), `clamp(30px,4.6vw,46px)`, semibold, tight leading,
  with a restrained warm-ink → deep-green `bg-clip-text` gradient (`--bigram-ink` → `--bigram-accent-ink`).
  Hierarchy comes from type, not a loud all-green headline.
- **Description** — Source Serif (`var(--font-source-serif)`), `text-bigram-muted`.

### How it meets the v8 spec + standards
- **`--bigram-*` tokens only.** No raw hex, no neon emerald/cyan literals in the bigram branch. Colors come via
  `bg-bigram-*` / `text-bigram-*` utilities and `var(--bigram-*)` arbitrary values, so they follow the theme scope
  in both dark and light.
- **Properly scoped / no regressions.** The bigram token classes only resolve inside a `[data-bigram-theme]`
  ancestor (the bigram page wrapper). mlp and neural-networks call `SectionDivider` with NO accent prop, so they
  fall through to the untouched amber/cyan branches and keep their look. `[data-lab-theme]` / `--lab-*` are never
  touched, and no existing accent value was overwritten — this is purely additive.
- **Apple-clean.** One focal point (the numeral → title → description column), generous space, hierarchy from
  typography and a single calm accent. The disc is fill + hairline (no heavy chrome), the rule is a single
  hairline, no extra cards or borders. The accent appears once, quietly.
- **Bridge note.** `--color-bigram-accent-soft` is intentionally NOT in the `@theme inline` bridge (matches the
  spec list), so I used the arbitrary `bg-[var(--bigram-accent-soft)]` form rather than a `bg-bigram-accent-soft`
  utility, which would have produced an undefined color.

### Before → after (bigram free-lab dividers)
- Disc: cyan ring `cyan-500/20 + cyan-300/70 text` → editorial-green fill disc (`accent-soft` bg, `accent-ink`
  text, soft accent glow).
- Rule: `via-cyan-500/20` → `via color-mix(var(--bigram-accent) 22%)`.
- Title: white-to-60% gradient, sans bold → Playfair semibold ink→deep-green editorial gradient.
- Description: `text-white/40` light sans → Source Serif `text-bigram-muted`.

### Notes / human attention
- `i18n` untouched: the three dividers keep their existing `t("models.bigram.sections.*")` keys.
- `useLabMode()` logic is preserved exactly; `isEdu` still selects amber for any future educational consumer.
- Pre-existing, unrelated lint warning in `page.tsx` (`simple-import-sort/imports`) lives in the top import block
  I never edited — left as-is. `tsc --noEmit` reports only a pre-existing Next.js generated-types error
  (`.next/types/validator.ts` → `about/page.js`), not from these changes.
- The `accent` prop type is deliberately narrow (`"bigram"`) so other chapters cannot accidentally opt into green;
  widen the union if another chapter ever needs a token-based divider.
