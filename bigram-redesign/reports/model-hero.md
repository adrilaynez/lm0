# Model Hero — editorial-green redesign (v8)

## ModelHero

The chapter hero was the most off-brand surface in the Bigram chapter: an indigo→blue→violet
gradient title, three large blurred color blobs, a pulsing indigo eyebrow pill, centered layout.
It is now a calm, confident, typography-first editorial hero in the v8 editorial-green language —
**without disturbing the three other chapters that share this component**.

### Files changed
- `src/features/lab/components/ModelHero.tsx` — split into two private renderers behind one opt-in
  `accent` prop: `BigramHero` (new editorial-green) and `DefaultHero` (the original, byte-for-byte).
- `src/app/lab/bigram/page.tsx` — the Bigram free-lab hero now calls `<ModelHero accent="bigram" />`.

### What I did
- **Opt-in, additive, zero regression.** `ModelHero` is shared by `bigram`, `ngram`, `mlp`, and
  `neural-networks`. Added `accent?: "default" | "bigram"`. When the prop is absent (or `"default"`)
  the component renders the *exact* original markup — the N-gram / MLP / Neural-Networks heroes keep
  their indigo identity untouched. Only the Bigram page passes `accent="bigram"`.
- **Tokens only.** The Bigram branch reads exclusively `--bigram-*` tokens (`bigram-ink`, `bigram-ink-2`,
  `bigram-accent`, `bigram-dim`, the `--bigram-font-*` families) and `color-mix(... var(--bigram-accent))`.
  No raw hex, no neon emerald/cyan literals. All green resolves through the page's `[data-bigram-theme]`
  scope, so it follows dark/light and never touches another accent.
- **Editorial Playfair title with an accent word.** `splitAccentTitle()` puts the final word of the
  title in `--bigram-accent`, italic 500, while the lead words stay `bigram-ink`. For the default copy
  "Bigram Language Model" this reads *Bigram Language* + *Model* (accent). Sizing matches the spec's
  editorial hero exactly: Playfair 600, `clamp(46px, 7vw, 92px)`, line-height 1.0, `-0.018em`.
- **One faint glow, not blobs.** The three indigo/violet/blue blur blobs are gone. A single
  `--bigram-accent` radial at 16% mix, top-left, `blur-120px`, fading in once over 1.4s — present but
  almost subliminal, exactly "at most a faint single accent glow."
- **Mono kicker.** The pulsing indigo pill is replaced by the v8 `.kicker`: an accent hairline + a small
  accent dot + mono uppercase label (`var(--bigram-font-mono)`, 0.2em tracking) in `bigram-accent`.
- **Lead + chrome.** Lead is Source Serif, `bigram-ink-2`, `clamp(21px,2.2vw,25px)`, 33em measure.
  Left-aligned, `max-w-880px` reading column (matches the `--maxw` editorial column), replacing the old
  centered layout. The scroll cue is a quiet `bigram-dim` arrow with a soft 6px bob.
- **Motion that is calm, not decorative.** A single staggered rise (kicker → title → lead → toggle →
  cue) with the v8 easing `cubic-bezier(.2,.7,.2,1)`. Fully `prefers-reduced-motion` safe: rise becomes
  a plain fade, the glow appears instantly, and the scroll-cue bob is disabled.
- `ModeToggle` is preserved as-is (it is shared lab chrome and renders identically in both branches).

### Before → after
- Title: indigo→blue→violet gradient + indigo glow drop-shadow → Playfair editorial, `bigram-ink` with a
  single italic `bigram-accent` word.
- Background: 3 blurred indigo/violet/blue blobs + dark gradient scrim → 1 faint accent radial.
- Eyebrow: pulsing indigo pill → mono kicker with accent hairline + dot.
- Layout: centered, `max-w-5xl` → left-aligned editorial column, `max-w-880px`.

### Verification
- `tsc --noEmit` produces **no errors for ModelHero** (or `bigram/page.tsx`). The default branch is the
  original code path, so the other three chapters are unaffected.

### Notes / needs human attention
- Pre-existing, out of scope: `tsc` reports `DatasetExplorerModal.tsx(318): Cannot find name 'closeLabel'`
  (another agent's in-progress edit) and a stale `.next/types/validator.ts` reference to `about/page.js`
  (build artifact). Neither is in the ModelHero area and neither was introduced here.
- The accent word is the *last* token of the title. For the current i18n copy this lands on "Model",
  which reads well. If a future title's last word is awkward to accent, swap to an explicit
  title/accent split rather than the heuristic — left as-is to avoid editing locked i18n copy.
- `showExplanationCta` / `customStats` remain in the props for API compatibility; the Bigram branch is
  intentionally minimal (no stat cards) per the calm, one-focal-point editorial brief.
