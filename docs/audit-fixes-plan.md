# Audit-fixes execution plan (autonomous, unattended)

> Second professional audit (4 Opus auditors) found a set of real issues. The user approved fixing
> **Rounds 1 + 2 + 3** and said: do it all, commit, don't stop, they're asleep. This file is the
> self-contained plan. Branch: `redesign/ngram-amber-v1`. Domain `adrianlaynez.dev`.

## Coordination with the parallel chat (IMPORTANT)
A second chat is editing the SAME repo concurrently (its zone: `src/features/lab/components/ngram/**`,
`src/content/lab/ngram.*.mdx`, `ngram-changelog.md`, `method-failure-book.md`, `ngram-v5-plan.md`). It reported
Turbopack dev-cache corruption from concurrent recompiles.
- **My verification builds use `NEXT_DIST_DIR=.next-verify`** → never touch the shared `.next`, so I don't
  corrupt their dev cache.
- **Never `git add -A`.** Stage only my explicit files so I never commit their uncommitted work.
- **Commit per block, push immediately** → minimal conflict window.
- **Shared files** (`narrative-primitives.tsx`, `globals.css`, `eslint.config.mjs`, `next.config.mjs`,
  `src/i18n/context.tsx`): touch carefully, commit immediately. Do NOT touch any `ngram/**` component or
  `ngram.*.mdx`.

## Autonomous contract (every block)
1. Implement.
2. Verify: `npx tsc --noEmit` exit 0; for routing/config/build/perf changes also
   `NEXT_DIST_DIR=.next-verify npx next build` then `Remove-Item -Recurse -Force .next-verify` +
   `git checkout -- tsconfig.json`. Lint touched files: `npx eslint <files> --fix`.
3. If green: `git add <explicit files>` → commit (Conventional Commit + `Co-Authored-By: Claude Opus 4.8
   <noreply@anthropic.com>`) → `git push origin redesign/ngram-amber-v1` → append a finish entry to
   `docs/PROJECT-LOG.md`.
4. If a block can't go green after a genuine attempt: revert just that block (`git checkout -- <files>` /
   `git clean -fd <new>`), log it as deferred, CONTINUE. Never leave the tree broken.
5. PowerShell commit messages: use `git commit -m @'...'@` here-string with NO inner double-quotes (they break
   parsing); if the message needs punctuation, write it to `_commitmsg.tmp` and `git commit -F _commitmsg.tmp`
   then delete the temp file.

---

## ROUND 1 — real bugs + security (highest ROI, low risk)

### R1a — Unify backend URL resolution
Problem: `lmLabClient.ts:17` defaults `BASE_URL` to `http://localhost:8000` (absolute → bypasses the `/api`
rewrite → inference breaks in prod if env unset). `useFeedback.ts:7` uses `""` (relative, correct). Two MLP
components inline `http://localhost:8000`.
Fix: default ALL to `""` so every call is relative `/api/v1/...` and goes through the next.config rewrite
(dev → localhost:8000, prod → Render). Files: `lmLabClient.ts:16-17`, `ActivationBattleVisualizer.tsx:111`,
`DepthLRInteractionHeatmap.tsx:66`. (Local `.env.local` uses wrong var name `NEXT_PUBLIC_API_URL` — it's
gitignored/personal; note it, don't commit it.)
Verify: tsc + build. Commit `fix(lab): route all backend calls through the /api rewrite`.

### R1b — Fix conditional hook in CompareMode
`src/features/lab/components/mlp/CompareMode.tsx` calls `useI18n()` inside JSX after an early return (rules-of-
hooks → crash). Hoist `const { t } = useI18n()` to the top of the component. Verify tsc + eslint that file.
Commit `fix(mlp): hoist useI18n in CompareMode to obey rules-of-hooks`.

### R1c — Bump next to 16.2.7
`npm install next@16.2.7` (clears postcss XSS + several advisories; same major, low risk). Run `npm run test` +
`NEXT_DIST_DIR=.next-verify npx next build`. If build/test break, revert (`npm install next@16.1.6`) and defer.
Commit `chore(deps): bump next to 16.2.7 (security)`.

### R1d — CI lint with teeth
`eslint.config.mjs`: keep noisy React-compiler rules at `warn`, set `react-hooks/rules-of-hooks` = `error` and
unused (`unused-imports/no-unused-vars` or equivalent) = `error`. Add `.shotprof_*/**` + `verify-ui.js` to
`globalIgnores`. `.github/workflows/ci.yml`: make lint blocking ONLY for errors — keep it simple: run
`npx eslint .` without `continue-on-error`, but ensure current errors are 0 after the rule retune (run eslint
locally; if residual real errors remain beyond rules-of-hooks/unused, either fix quickly or keep those specific
rules as warn). Goal: CI catches rules-of-hooks + unused going forward, lint step green now.
Verify: `npx eslint .` exits 0 (or only warnings). Commit `ci: make lint blocking for hooks + unused rules`.

### R1e — Safe nits
- Remove `console.log`s in `src/features/lab/components/mlp/MLPLivePredictor.tsx` (lines ~49,53,57,90,104).
- Remove the unused font: `Space_Grotesk` in `src/app/[locale]/layout.tsx` (import + var + body class) and the
  dead `--font-space-grotesk` in `globals.css:13`. (Confirm zero `font-space-grotesk` usages first.)
- `/notes` redirect conflict: `next.config.mjs` redirects `/notes` → `/latent-space?mode=essays`; the page
  `src/app/[locale]/notes/page.tsx` redirects to `/latent-space`. The config wins (edge). Align the page to the
  same target (or note it's dead). Keep behavior consistent.
Verify tsc (+ build since layout/config touched). Commit `chore: remove console logs, unused font, align /notes redirect`.

---

## ROUND 2 — performance wins

### R2a — KaTeX dynamic import
`src/features/lab/components/narrative-primitives.tsx:4` statically imports `react-katex` → 262 KB rides into
the eager bigram/ngram narrative chunk. Make the math components load `react-katex` via
`dynamic(() => import("react-katex").then(m => m.BlockMath/InlineMath), { ssr: false })` with a tiny fallback,
so KaTeX only loads when a formula renders. Check other consumers: `ArchitectureDeepDive.tsx`,
`NgramTechnicalExplanation.tsx` (ngram — AVOID, other chat's zone; if it imports react-katex directly handle
only via the shared primitive), `TransformerNarrative.tsx`, `NeuralNetworkNarrative.tsx`,
`MatrixMultiplyVisual.tsx`, `math-block.tsx`. Prefer centralizing through the shared primitive so I don't touch
ngram files. SHARED FILE — commit immediately.
Verify: build, confirm bigram first-load shrinks (KaTeX chunk no longer preloaded). Commit
`perf(lab): load KaTeX on demand (off bigram/ngram first paint)`.

### R2b — Re-export landing PNGs to WebP
`public/lab/chill/hero-facility.png` (4.3MB), `anti-hero.png` (3.3MB) loaded as CSS background in
`chill-lab.css`; `lm-lab-logo.png` (2.1MB) via raw `<img>` in `Masthead.tsx`/`Colophon.tsx`. Convert to WebP at
sane quality (use `sharp` via a one-off node script; install sharp as devDep if absent). Keep the originals OR
replace; update `chill-lab.css` background-image URLs to `.webp` and the `<img src>`/convert to next/image.
If `sharp` won't install cleanly, try the Windows `cwebp`/`magick` if present; if no tool works, DEFER R2b and
log it. Verify build. Commit `perf(lab): re-export landing images to WebP`.

---

## ROUND 3 — SEO / a11y / i18n polish

### R3a — SEO: x-default + Twitter card
Add `"x-default": <defaultLocale URL>` to every hreflang `languages` map: `layout.tsx`, `lab/_seo.ts`,
`projects/[slug]/page.tsx`, and `sitemap.ts`. Add a `twitter: { card: "summary_large_image", title,
description }` block in `[locale]/layout.tsx` (inherited) and in `_seo.ts` + `projects/[slug]`.
Verify build. Commit `feat(seo): x-default hreflang + Twitter Card metadata`.

### R3b — Missing route metadata + localized dates
Add `generateMetadata` (localized title/description + canonical + hreflang + OG, mirroring the lab `_seo`
pattern) to routes that lack it: `/lab` landing (`lab/page.tsx` — split server wrapper + client like chapters),
`/latent-space` (`latent-space/page.tsx`), `/latent-space/mind` (`mind/page.tsx`), `/projects`
(`projects/page.tsx`), and the detail pages `latent-space/essays/[slug]/page.tsx` +
`mind/[slug]/page.tsx` (add canonical/hreflang/OG). Localize dates: `toLocaleDateString("en-US",…)` → pass the
active `locale`. AVOID ngram. Verify build. Commit `feat(seo): per-route metadata for lab/latent-space/projects + localized dates`.

### R3c — i18n shim fixes
`src/i18n/context.tsx`: (1) `setLanguage` must preserve the query string — append `useSearchParams()` to the
path passed to `router.replace`. (2) interpolation: change `out.replace(re, String(v))` →
`out.replace(re, () => String(v))` so `$`-containing values aren't treated as regex replacement patterns.
SHARED FILE — commit immediately. Verify tsc. Commit `fix(i18n): preserve query string on locale switch + safe interpolation`.

### R3d — Global reduced-motion reset
`globals.css`: add a `@media (prefers-reduced-motion: reduce)` block zeroing animation/transition durations as a
safety net (covers home flip + latent-space which don't individually honor it). SHARED FILE — commit
immediately. Verify build. Commit `feat(a11y): global prefers-reduced-motion safety net`.

### R3e — MDX per-locale dynamic import
The 5 chapter shells statically import BOTH `<chapter>.es.mdx` + `.en.mdx` → both ship. Convert to a per-locale
`dynamic()` so only the active locale loads; toggling fetches the other once (toggle stays instant after).
Priority: `MLPNarrative.tsx` + `TransformerNarrative.tsx` (biggest, ~85-90KB each). Then bigram/nn if clean.
**AVOID `NgramNarrative.tsx`** (other chat's zone). Keep the pre-bound widgets map (mlp) working. Verify build +
that each touched chapter renders both locales. Commit `perf(lab): load only the active-locale MDX per chapter`.

### Deferred on purpose (logged, NOT done)
- **Contrast sweep** (~2000 `text-white/20-35`): a design decision, not a mechanical fix; a blind mass-replace
  would regress the flagship aesthetic. Needs human design judgment. Logged as deferred.
- **transformer.es.mdx Spanish translation**: content authoring, not code. User to decide.
- **CSP enforcing + report endpoint**: needs a collector + nonce middleware; out of scope for tonight.
- **Global chrome i18n** (navbar/footer/lab banner hardcoded EN): doable but lower priority; do if time permits
  as a bonus, else log.

---

## FINAL
After all blocks: `npx tsc --noEmit` + `NEXT_DIST_DIR=.next-verify npx next build` (clean up), confirm green,
ensure pushed, append a "Finished: audit fixes (Rounds 1-3)" entry to `docs/PROJECT-LOG.md` summarizing what
landed + what was deferred, post a concise summary.
