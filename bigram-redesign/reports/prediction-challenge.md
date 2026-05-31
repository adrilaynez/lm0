## PredictionChallenge (v8 · bw-game)

### Files changed
- `src/features/lab/components/PredictionChallenge.tsx` — full rewrite into the v8 editorial-green "bw-game" language.

### Concept (ONE idea)
Your gut already bets on the same next character the model does. The reader guesses; the model's
answer is revealed by **fill**, not outline. One focal point per round: the large context line with
the blank that fills to its verdict.

### What I did
- **States by FILL, not outline.** Correct option = solid `--bigram-accent` on `--bigram-on-accent`;
  the chosen-wrong cell tints `--bigram-wrong-soft` with `--bigram-wrong` text; unchosen options dim by
  opacity (0.45, transparent bg). Zero borders on any state — exactly per the spec's `.bw-opt` rules.
- **Removed the dashed-border blank.** The blank is now a quiet ghost `?` (gently pulsing) that, once
  answered, fills solid `--bigram-accent` (correct) or `--bigram-wrong` (incorrect) with on-accent text —
  mirrors `.bw-game__blank.ok/.no`. No outline, no neon glow.
- **Progress dot ELONGATES instead of glowing.** The active dot animates `width 7px → 20px` as an
  accent pill; done dots are `--bigram-accent-2`; future dots are a faint `--bigram-ink` mix. Spring
  motion on width/color only — no scale, no box-shadow (matches `.bw-game__dots i.current`).
- **Feedback box tints to its state.** Accent path → `--bigram-accent-soft` fill + accent hairline +
  `--bigram-accent-ink` mono title; wrong path → `--bigram-wrong-soft` fill + terracotta hairline +
  `--bigram-wrong` title. Serif explanation in `--bigram-ink-2`. Never grey.
- **Confetti recolored to the bigram accent/sage family** (`--bigram-accent`, `-accent-bright`, `-sage`,
  `-accent-2`) — radial pop that fades + shrinks, suppressed under reduced motion. Removed the old
  `bg-emerald-400 / bg-teal-300` literals.
- **Done state** is editorial: calm `n/m` mono numeral, a thin honest 140px track that fills to the
  score (`--bigram-accent` if good, else `--bigram-muted`), an italic serif message, and a ghost
  `Try again` button. Dropped the glowing trophy/sparkles badge and the `from-emerald-500/25` gradients.
- **Next/Finish** is a solid `--bigram-accent` button → `--bigram-accent-bright` on hover; the i18n
  strings already carry their "→", so no lucide arrow icon was added (less chrome).
- **Keyboard preserved**: 1–4 picks, Enter/Space advances. Added an `aria-label` per option and kept the
  `role="img"`-style announcements via the blank/answer text.

### Standards compliance
- **Apple-clean / typography-first**: hierarchy from type + fill + spacing; one focal point (the context
  line); no dashboard layout, no cards, no excess borders.
- **`--bigram-*` tokens only** — every color, radius and font is a token (`var(--bigram-*)`,
  `var(--font-jetbrains-mono)` / `-source-serif`). No raw hex, no neon emerald/cyan/rose literals.
  `lucide-react` import removed entirely.
- **Scoped**: the component renders inside the chapter's `[data-bigram-theme]` wrapper (set in
  `page.tsx`), so the tokens resolve in both dark and light and never touch `--lab-*` or another accent.
- **Reduced-motion safe**: `useReducedMotion()` gates confetti, the blank pulse, fill/stagger entrances,
  and count-style transitions; final states show instantly.

### Before → after
- Before: dashed-border blank, neon `shadow-[0_0_20px...rgba(52,211,153)]` glows, scale+glow progress
  dots, `text-rose-400` errors, white/opacity literals, lucide check/x/trophy icons.
- After: fill-only states, elongating accent pill dot, tinted feedback, token-only color, terracotta
  `--bigram-wrong` for mistakes, icon-free.

### Notes / human attention
- No i18n keys were edited; all visible text routes through existing `bigramNarrative.predictionChallenge.*`
  keys. The `next`/`finish`/`wrong` strings already embed their punctuation ("→", "—").
- Used scoped inline styles + one tiny injected `@media (max-width:560px)` rule for the options grid
  (4-col → 2-col), consistent with the spec's `.bw-game__opts` responsive breakpoint. No global CSS added.
- Did not run dev server / build (per phase rules); `tsc --noEmit` reports no errors for this file.
