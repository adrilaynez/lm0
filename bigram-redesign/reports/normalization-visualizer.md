## NormalizationVisualizer (§4 — counts → probabilities)

### Files changed
- `src/features/lab/components/NormalizationVisualizer.tsx` — full re-theme + re-think into the v8 editorial-green language. (Only file changed. No edits to i18n, globals.css, `[data-lab-theme]`, or any other chapter.)

### The ONE concept
Turning a row of raw counts into probabilities = **dividing the whole row by its total** (conservation of mass — the same row, re-expressed as fractions; nothing added or removed).

### What I did
Kept the pedagogical 3-phase arc but unified it around a single persistent object (the row of followers of `t`), shown through three lenses, with one focal point per phase:

1. **Counts** — raw counts as HonestBar-style rows (same 104px / track / value geometry as the shared `HonestBar`), value shown as the integer count counting up; a hairline `TotalLine` states the denominator (990).
2. **Divide** (the focal teaching moment) — ONE **unity bar** = 100% of the transitions that splits into proportional accent slices. The bar never changes size; division only re-expresses it. Hover / focus / tap / a gentle auto-tour inspects a slice and the readout shows `count ÷ total = pct`; with nothing active it reads `= 100%` (sage). This is the "divide the row" act made literal and direct-manipulable.
3. **Probabilities** — the same followers rendered with the shared **`HonestBar`** primitive on an honest axis (`WINNER_FRACTION`, so bars read as true proportions, never normalised to 100%), winner marked `top` (brighter `accent-bright`, glint, count-up, winner-last cascade), closing with the sage **`Verdict`** ("After t, the most likely is h. · 520 of 990 times · 52.5%").

Step picker is now a **segmented control** (sunk `--bigram-bg-2` rail, `layoutId` spring fill on the active cell in `--bigram-accent`) instead of the old check-marked button strip with arrow icons.

### How it meets the v8 spec + standards
- **`--bigram-*` tokens only.** Removed the entire 5-hue neon `COLORS` table (emerald/teal/cyan/sky/blue gradients + glows) and every `bg-white/[…]`, `text-emerald-*`, `border-white/*`. No raw hex, no neon, no Tailwind color literals. Slices alternate `accent-2` / `accent-deep` for separation without extra chrome.
- **Apple-clean / typography-first.** No outer frame/border/card (the surrounding `FigureWrapper` owns the chrome); no window dots; no `lucide` icons; hierarchy from type + spacing. Mono for data/labels, source-serif for captions, accent-ink for the `=` result, sage for the unity total and verdict.
- **Honest bars.** Phases 1 & 3 use the shared `HonestBar` / its geometry on a fixed honest axis — partial fills show the model's true proportions, never inflated to 100%. The verdict is the spec's plain-language `Verdict` primitive.
- **Properly scoped.** Reads only `--bigram-*` (resolved through the chapter's `[data-bigram-theme]` scope on `app/lab/bigram/page.tsx`) — no `[data-lab-theme]` touched, no other accent altered.
- **Motion that explains.** Slice growth = the row being partitioned; winner-last glint = "this is the bet"; segmented spring = which lens you're in. Fully `prefers-reduced-motion` safe (no auto-tour, no count-up, final state instant).
- **i18n.** All visible text via `t()`; reuses the existing `normalizationViz.*` narrative keys and the spec's `corpusCounting.verdict*` keys. Did not edit en.ts / es.ts.

### Notable before → after
- 5-color neon gradient bars + per-bar glows  →  single editorial-green palette, fill-and-typography states.
- Step 2 was a static stack of `count ÷ total = pct%` text lines  →  an interactive **unity bar that physically splits**, with a live `count ÷ total = pct` inspector (the division you can touch).
- Step 3 hand-rolled `motion.div` width bars + a green "✓ 100%" card  →  shared `HonestBar` (honest axis, winner-last glint, count-up) + sage `Verdict`.
- Stepper buttons with `Check`/`ArrowRight` icons + Play/Reset CTA pair  →  one clean segmented control (any step jumpable; no separate Next/Reset needed).

### Verification
- `eslint NormalizationVisualizer.tsx` → exit 0 (clean; fixed a `set-state-in-effect` finding by removing a synchronous `setActiveSlice(-1)` — `selectStep` already resets it on step change).
- `tsc --noEmit` → 0 errors in this file. (The only repo-wide tsc error is a pre-existing stale `.next/types/validator.ts` build artifact referencing `about/page.js`, unrelated to this change.)

### Skipped / human attention
- Did not run the dev server or `npm run build` (reserved for the Revision phase).
- Removed the `lucide-react` icon imports from this file; if no other file used them that import is now unused project-wide, but that is out of scope to verify here.
- The component now has no explicit "reset" button — re-selecting a step (incl. the first) replays its animation, which I judged cleaner and sufficient. Flag if the narrative wants an explicit replay affordance.
