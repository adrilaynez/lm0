## Final Build Gate (Bigram editorial-green v8)

Ran the closing build gate for the whole Bigram v8 redesign: `tsc --noEmit`, `eslint`, `next build`,
plus the regression guardrail. Fixed the three lint errors the redesign actually introduced (without
weakening types or deleting features), then confirmed a clean production build and verified that no
other chapter was touched.

### Gate results
- **`npx tsc --noEmit`** — PASS. Zero type errors across `src/`. (One stale `.next/types/validator.ts`
  artifact referenced a non-existent `about/page.js`; that is generated noise, not source — `next build`
  regenerated `.next/types` fresh and TypeScript checked clean during the build.)
- **`npm run lint`** — repo still exits 1, but only on **pre-existing** baseline errors that also fail on
  `main` and live in out-of-scope files (transformer / mlp / neural-networks / latent-space / `docs/*.js` /
  the n-gram-only `analyze` memo). I verified file-by-file against `main`: the redesign introduced errors in
  exactly three files, all now fixed (see below). The remaining scoped bigram errors —
  `ContinueToast`, `TransitionMatrix`, `useLabTheme` (each one `react-hooks/set-state-in-effect`) — were
  present on `main` and are not part of this redesign.
- **`npm run build`** — PASS (exit 0). Compiled in ~6s, all 61 routes generated incl. `/lab/bigram`,
  `/lab/ngram`, `/lab/transformer`. Next 16 does not run ESLint during build, so the baseline lint
  warnings/errors do not block it.

### Tailwind token verification (from the built CSS in `.next/static`)
- `bg-bigram-*`, `text-bigram-*`, `border-bigram-*` utilities are all **generated** (not purged):
  e.g. `bg-bigram-accent/-surface/-elev/-bg/-bg-2/-wrong`, `text-bigram-accent[-bright/-ink]/-ink/-ink-2/
  -body/-muted/-dim/-sage/-wrong`, `border-bigram-accent[-2]`.
- The `@theme inline` bridge `--color-bigram-*` and the underlying `--bigram-*` tokens are present, and the
  `[data-bigram-theme]` scope is emitted. The utilities resolve through `var(--bigram-*)`, so they follow
  the chapter theme scope as the spec requires.

### Files I changed (3 — only to fix introduced lint errors; behavior preserved)
- `src/features/lab/components/PredictionChallenge.tsx` — the redesigned `ConfettiBurst` called
  `Math.random()` three times inside a `useMemo` (render), tripping `react-hooks/purity`
  ("Cannot call impure function during render"). Replaced with a deterministic, seeded `jitter(i)`
  (`sin`-hash → 0..1). The confetti still reads as scattered, but the geometry is now pure/idempotent.
- `src/features/lab/components/DatasetExplorerModal.tsx` — the redesigned `CountUp` did
  `setDisplay(value)` synchronously inside the effect on the reduced-motion branch
  (`react-hooks/set-state-in-effect`). Removed that branch: under reduced motion it now renders `value`
  directly (`{reduce ? value : display}`) and the rAF animation effect only runs when motion is allowed.
  Same visible result, no setState-in-effect.
- `src/features/lab/components/PairHighlighter.tsx` — the new sliding-lens mechanism read a ref
  (`hasPlacedLens.current`) during render to decide the first-placement snap, tripping `react-hooks/refs`
  ("Cannot access refs during render", ×6). Converted `hasPlacedLens` from a `useRef` to `useState` so the
  render is pure, and folded the "mark placed" transition into `measureLens` (a callback, where setState is
  legitimate) via `setLens(prev => { if (prev === null) setHasPlacedLens(true); ... })`. The spec behavior
  is unchanged: first appearance snaps in (transition off), every subsequent move glides. The one remaining
  `set-state-in-effect` is the `useLayoutEffect` that measures the laid-out character spans and positions the
  lens — the canonical "sync with DOM layout" effect with no pure alternative — so it carries a single,
  narrowly-scoped, justified `eslint-disable-next-line` (consistent with existing disables in the repo).

### How this meets the v8 spec + standards
- All three fixes are logic-only; they touched **zero** colors. Confirmed no raw hex / `emerald` / `cyan` /
  `teal` / `--lab-*` literals were added by my edits. The bigram surfaces stay `--bigram-*`-only; the lone
  `text-emerald-400` in `DatasetExplorerModal` sits in the **n-gram code path** (neutral legacy styling the
  audit deliberately leaves alone), not in bigram content.
- The honest sliding-lens (first-placement snap, then glide) and the count-up/confetti motion are preserved
  exactly — the finish the v8 spec asks for is intact, now without the React-Compiler violations.

### Regression guardrail — PASS
- **No** transformer / mlp / neural-network / chill / landing file modified (`git status` is clean of those).
- `src/app/globals.css` diff is **purely additive** (81 insertions, 0 deletions); no `[data-lab-theme]`
  block and no `--lab-*` / `--ls-*` token was changed (only a new comment mentions them).
- `src/app/lab/ngram/page.tsx` change is solely the deliberate `StepwisePrediction → NgramStepwisePrediction`
  fork (+3/-1) that shields n-gram from the bigram-only rewrite.

### Left for a human
- Repo-wide `npm run lint` will keep exiting 1 until the **pre-existing** `react-hooks` baseline
  (`set-state-in-effect`, `purity`, `refs`, `preserve-manual-memoization`, `no-unescaped-entities`, a few
  `no-explicit-any`) is addressed across transformer / mlp / nn / latent-space and the bigram trio
  (`ContinueToast`, `TransitionMatrix`, `useLabTheme`). That cleanup is out of scope for this redesign and
  unrelated to the editorial-green work; flagging it so the gate's non-zero exit isn't mistaken for a
  redesign regression. `next build` is green regardless.
- I created and then removed a throwaway `tsconfig.tscheck.json` while isolating source from the stale
  `.next` cache; it is not left in the tree.
