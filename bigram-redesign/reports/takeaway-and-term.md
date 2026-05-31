# Takeaway + Glossary Term (v8 editorial-green)

## KeyTakeaway — SAGE editorial-insight voice

**Files changed**
- `src/features/lab/components/KeyTakeaway.tsx` — added a token-driven `accent="bigram"` variant.
- `src/features/lab/components/BigramNarrative.tsx` — switched the chapter's two takeaways
  (`keyTakeaways.normalization`, `keyTakeaways.fatalFlaw`) from `accent="emerald"` → `accent="bigram"`.

**What I did**
- Added `"bigram"` to the `accent` prop union and a dedicated `BigramTakeaway` sub-component, rendered via
  an early return so the existing literal accents (emerald/amber/rose/violet/cyan) are completely untouched.
- Reproduced the styles-v8 `.takeaway` rule exactly: `linear-gradient(135deg, var(--bigram-sage-soft),
  transparent 82%)`, border `1px solid color-mix(in oklab, var(--bigram-sage) 32%, transparent)`, radius
  `var(--bigram-r-lg)`, mono uppercase `.18em` label in `--bigram-sage`, serif body (19px) in `--bigram-ink`,
  sage-soft icon chip.
- Removed the old emerald variant's corner-glow, left accent-bar and box-shadow for the bigram path — the v8
  takeaway is a calm gradient panel, not a glowing card. Cleaned up the accent map (dropped an unused `kind`
  discriminant) so the literal branch stays lean.

**How it meets the spec**
- Uses the **SAGE family** (`--bigram-sage` / `--bigram-sage-soft`) per spec §5 ("Takeaway") — the editorial
  insight voice, distinct from the interactive emerald accent. Only `--bigram-*` tokens, no raw hex, no neon.
- Properly scoped: green resolves only inside `[data-bigram-theme]` (set on the page wrapper); every other
  chapter still passes its own literal accent and renders the original card unchanged.

**Before → after**
- Bigram takeaways were generic emerald glow-cards with a left accent bar.
- Now: a single airy sage gradient panel, sage mono eyebrow, serif insight body — Apple-clean, one focal point.

## GlossaryTooltip — v8 `.term`

**File changed**
- `src/features/lab/components/GlossaryTooltip.tsx`

**What I did**
- The underline span and the tooltip eyebrow keep their original `--lab-*` defaults (dotted
  `--lab-text-muted` underline, `--lab-text`). I added two stable hook classes
  (`glossary-term__underline`, `glossary-term__eyebrow`) and a one-time injected `<style>` block scoped to
  `[data-bigram-theme]` that overrides them to the v8 `.term`: **dashed `--bigram-accent-2` under-border** on
  `--bigram-ink`, plus eyebrow in `--bigram-accent-ink` (replacing the hardcoded `text-emerald-400/70` leak
  inside the bigram scope). `cursor: help` was already present and is preserved.
- The component's full state machine (hover, tap-to-toggle, outside-click close, above/below positioning,
  missing-definition passthrough) is unchanged.

**How it meets the spec**
- Matches styles-v8 `.term` (lines 623–627): `border-bottom: 1px dashed var(--accent-2)`, `cursor: help`.
- Green is gated **only** by the `[data-bigram-theme]` scope — Transformer/Ngram/MLP/Neural-Network terms keep
  the dotted `--lab-text-muted` underline and their tooltip eyebrow exactly as before. No `--lab-*` block edited.

**Before → after**
- Inside Bigram: dotted grey underline → dashed forest-green (`--bigram-accent-2`) underline; tooltip eyebrow
  went from a stray neon emerald to the on-theme `--bigram-accent-ink`.

## Notes / human attention
- I used a one-time injected `<style>` (rather than editing `globals.css`) to keep the change self-contained to
  the assigned two files and avoid a third-file touch. It is idempotent (guarded by element id) and renders
  identical HTML; if the team prefers, these two rules could later be promoted into `globals.css` next to the
  other `[data-bigram-theme]` rules with no markup change.
- Verified with `tsc --noEmit`: no type errors in any edited file. (The only reported error is a pre-existing
  stale `.next/types/validator.ts` cache entry for `about/page.js`, unrelated to this work.)
- BigramNarrative import order was auto-reformatted by the linter; the two `accent="bigram"` edits are intact.
