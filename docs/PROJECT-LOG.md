# Project log

The living history of this site — every **important change or new capability**, newest on top, in plain
language. Routine tweaks (a single visualizer change, copy edits, bug fixes) are NOT logged; architecture,
new capabilities, and full chapter aesthetic renovations ARE. See the rule in `CLAUDE.md → Project log`.

Format: `## YYYY-MM-DD — title` · what changed · why · (optional) commit refs.

---

## 2026-06-18 — LM0 "El nacimiento" promoted to the lab landing (`/lab`) + repo cleanup ✅

The LM0 v3 landing graduated from its `noindex` preview gate to **the real `/lab` landing**. `/lab/page.tsx`
now renders `NacimientoLanding` (via the repurposed `lab-landing-client.tsx`), indexable, with the existing
`LM-Lab` SEO metadata; the throwaway `lab/lm0-preview/` route was removed. The former "chill" editorial landing
(`components/chill/*`, `chill-lab.css`) is retired (left in tree, no longer mounted). Navbar, home, and sitemap
already pointed at `/lab`, so no link changes were needed; `LayoutShell` already hides global chrome for `/lab`.
Verified in-browser (hero + reader + finale render, no console errors) and with a production `next build`.

Working-tree cleanup the same pass: deleted scratch (dev/lint log dumps, 6 raw AI image exports, superseded
`maquina*.webp` renders keeping only `maquina-front.webp`, throwaway HTML previews, the orphan `HeroChrome.tsx`),
and `.gitignore` now excludes the local asset/brand/build scratch (`.lm0-caps/`, `.lm0-logo/`, `lm0-brand/`,
`_caps/`, `start-frontend.bat`, log dumps). Next milestone: extract the whole lab to a standalone site at
**lm0.dev** (own repo + Vercel project).

## 2026-06-18 — LM0 finale to awwwards level: framed letter, phosphor-switch CTA, centered coda ✅

On `redesign/lm0-landing-v3`, the warm epilogue (note · CTA · footer) was rebuilt to SOTD craft, and the
creator's note was rewritten from his real letter. Three reworks:

- **The note** is no longer a sticky line-by-line fade (which read as ephemeral). It's now a **framed cream
  letter-sheet** (thin graphite hairline + a tiny `una carta · adri` label — the "sección pro" the user asked
  for, but warm) that **lm0 types and leaves written**: lines accumulate and stay at full ink, one serif
  pull-line ("ninguna de estas máquinas apareció de golpe."), signed `adrian laynez · a través de lm0`. The
  text is SSR-rendered (selectable, no-JS safe); JS clears and types it when it scrolls into view; clicking the
  sheet completes it instantly. The **copy is new** — the creator's letter in first person, synthesised from his
  real note by a multi-agent run (analyze → 8 drafts → 4-lens judging → synthesis), ES + EN.
- **The CTA** drops the glowing pill for **"el interruptor de fósforo"**: a left-aligned typeset line (kicker
  `cruzar al capítulo 01` + label + hairline rule + arrow) whose rule lights phosphor green only on hover/focus;
  lm0's caret types the label as its last words. Magnetic JS removed.
- **The footer** is a quiet credit zone: lm0's living postscript with a parked green caret, an editorial
  colophon naming the live corpus, and a studio colophon row with a click-to-copy github. Green stays precious.

Reveals are driven by a scroll listener, not IntersectionObserver (which proved unreliable under Lenis here and
had left elements clipped/invisible). Directions were chosen with the user via live `show_widget` mockups +
research/judge workflows.

**Revision 2 (same day) — composition fixed after a 4-lens critique graded the first build 4.5/10.** The
materials were right but composed upside-down. Fixes: (1) the whole epilogue now sits in ONE **centered reading
column** (~720px) instead of three left-flush blocks → symmetric whitespace (killed the "todo a la izquierda");
(2) the **giant `adrian laynez` signature was removed entirely** — it was dwarfing the CTA and the author
considers his name irrelevant; it now appears only small (the `AUTOR` credit + the in-letter signature);
(3) the **CTA is the visual climax** (`clamp(2rem,4vw,2.8rem)`, generous air); (4) a left-anchored **`el
epílogo`** eyebrow anchors the section and the dawn was trimmed (40→30vh) so the chapters→note gap reads
intentional, not a void; (5) the corpus underline went ink (not green) so the one bright phosphor is the CTA on
hover. Verified in-browser (ES + EN, desktop + mobile, reduced-motion safe); tsc + eslint green.

## 2026-06-18 — LM0 eras beat reworked: faithful port of the "el mismo punto" particle widget ✅

On `redesign/lm0-landing-v3`, the eras beat ("04 — las eras", `ErasPanel.tsx`) was fully rewritten to be a
faithful copy of the approved "el mismo punto" prototype: ONE pool of ~720 motes the scroll re-forms through
six shapes — point → corpus dust → counting **grid** (30×24) → **network** (6-10-10-5) → attention **ring**
(16) → a **cursor** that types the closing sentence. The clean look = tiny ADDITIVE square dots (no glow
blobs) + whisper-faint wiring (amber net, blue ring chords) over the page's green screenworld (transparent
canvas, no dark panel). Pure function of scroll (no time-based motion) → scrub-safe + reversible. The left
lm0 narration is remapped so each era's text shows while its structure is settled (grid↔contar, net↔aprender,
ring↔atención, cursor↔actualidad). Two earlier attempts this session (heavy sprite-glow + dense wiring; and a
mis-copied "clean" version) were discarded after the user found them too busy.

**Polish pass (same day):** the figure was floating isolated in the right corner — fixed by making the canvas
**full-bleed**, the figure **larger and centred** (`CX = W*0.56`, ring now a wide ellipse), plus an
ever-present faint **ambient dust starfield** so the space never reads empty. Contrast lifted with a soft dark
**focus pool** under the figure (pops on any background) + slightly brighter dots/wiring; the narration column
sits on top via `z-index` + `text-shadow`. Direction validated with the user through interactive `show_widget`
mockups before coding. tsc/eslint/82 tests green.

## 2026-06-13 — LM0 landing v3: premium pass + finale "ss4" rebuilt 🚧

Milestones on `redesign/lm0-landing-v3` (`/lab/lm0-preview`). **Transitions made Apple-smooth:** the
machine's choreography (rise into training, zoom-into-its-own-screen for the dark act) is now scrub-linked
per-frame from scroll (CSS vars written in `onProgress`) instead of discrete `data-beat` CSS transitions —
the "horrible, 0 smooth" jump the user flagged. **Training** gained a Pulsar-style instrument frame + corpus
HUD (corpus % + knowledge bars + context k) with a letters odometer. **Cooler Mac render**
(`public/lm0/maquina-cool.webp`) to match the cool ivory. **The finale was fully rebuilt** into two movements:
a DARK close that continues the act — "el viaje" (a horizontal era timeline coloured per era) and "los
capítulos" (6 chapter cards each with a bespoke SVG mini-visualizer + hover reveal, gpt locked) — then a warm
LIGHT epilogue (the creator's note rewritten in lm0's voice, the CTA, and a scoped footer). New components:
`EraTimeline`, `ChapterCards`, `ChapterGlyph`, `FinaleSection` rewrite. Verified in Chrome (es + en); tsc /
eslint / i18n-parity green. Still pending: lm0 interludes (narrating from the start) and a foreground
motion pass. The previous v2 (3D world) stays parked on `redesign/lm0-landing-v2`.

## 2026-06-12 — STARTED: LM0 landing v3 "El nacimiento" 🚧

Began the full rebuild of the lab landing on `redesign/lm0-landing-v3` (spec: `lm0-landing-v3-spec.md`).
The previous direction (v2, top-down 3D world with vitrines) is PARKED intact on `redesign/lm0-landing-v2`.
The new concept: the visitor trains a REAL char-level n-gram in the browser (Quijote es / Hamlet en),
watches it improve through real escalones, and LM0 — a pure narrator voice (IBM Plex Mono) — takes over:
"De ese balbuceo a mí: 70 años." Stack: DOM + Canvas 2D + Lenis + GSAP (no Three.js). Builds behind
`/lab/lm0-preview` (noindex) through user-validated gates; `/lab` swaps only at the end.

## 2026-06-06 — Second-audit fixes (Rounds 1–3) ✅

Acted on a fresh 4-auditor professional review. Plan: `docs/audit-fixes-plan.md`. Each item was its own
verified commit (tsc + build green) on `redesign/ngram-amber-v1`.

**Round 1 — real bugs + security:** unified the backend URL so every lab call goes through the `/api` rewrite
(it defaulted to an absolute `localhost:8000` that broke inference in prod); fixed a conditional-hook crash in
`CompareMode`; bumped **next 16.1.6 → 16.2.7** + `npm audit fix` (cleared the High advisory + yaml; prod vulns
3→2, the remaining two live inside next's own deps); retuned ESLint so CI lint is **blocking on errors**
(`rules-of-hooks` stays an error) while the React-Compiler/style backlog is `warn`, and dropped
`continue-on-error`; removed debug logs, the unused Space Grotesk font, and a `/notes` redirect mismatch.

**Round 2 — performance:** KaTeX (~260 KB) now loads on demand via a shared `LazyMath` wrapper instead of riding
the eager narrative chunk (verified: 0 katex refs in the bigram first-load HTML); re-exported the three landing
PNGs to WebP (**~9.5 MB → ~0.5 MB**, ~95% smaller).

**Round 3 — SEO / a11y / i18n:** added `x-default` hreflang + Twitter Cards; gave the `/lab` landing,
`/projects`, `/latent-space`, `/latent-space/mind` and the essay/mind detail pages proper localized metadata
(canonical/hreflang/OG) via a shared `localizedMetadata` helper, and localized the article dates; fixed the
`useI18n` shim to preserve the query string on locale switch and to interpolate `$`-containing values safely;
added a global `prefers-reduced-motion` CSS safety net; and made each chapter (bigram, nn, mlp, transformer)
ship **only the active-locale MDX** (one `dynamic()` per locale, SSR preserved — verified prose renders in the
prerendered HTML in the active locale only). n-gram chapter files were left untouched (worked on in parallel).

**Deferred on purpose:** the low-contrast-text sweep (~2000 `text-white/20–35` — a design decision, not a
mechanical find-replace, would regress the lab aesthetic); the real Spanish translation of `transformer.es.mdx`
(content authoring); an enforcing CSP + report endpoint; and migrating the hardcoded-English global chrome
(navbar/footer/lab banner) to i18n.

## 2026-06-05 — Prettier + husky/lint-staged pre-commit (Phase 11) ✅

Added **Prettier** (`.prettierrc`: 100 print width, 2-space, double quotes, trailing commas — 2-space matches
the repo's plurality and Prettier's default, minimizing churn) and a **husky** `pre-commit` hook running
**lint-staged**. lint-staged only touches **staged** files (never the whole repo — a hard rule): `*.{ts,tsx}` →
`eslint --fix` + `prettier --write`, `*.{json,css}` → `prettier --write`. **MD/MDX are deliberately excluded**
from auto-formatting (and `.prettierignore` lists `**/*.mdx`) so the hand-authored lab narratives and prose docs
are never silently rewrapped. Added a `format` script for manual full-repo formatting (not run automatically).

## 2026-06-05 — .env.example (Phase 10) ✅

Added a documented `.env.example` listing every environment variable the code reads — `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_LM_LAB_API_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `ANALYZE` — each with its default and a one-line note.
All are optional (the app runs with defaults, no secrets needed). Added a `!.env.example` exception to
`.gitignore` so the template is tracked while real `.env*` files stay ignored.

## 2026-06-05 — README refresh (Phase 9) ✅

Brought `README.md` up to date with the current architecture: it predated next-intl and the MDX migration.
Rewrote the stale parts — the i18n design-decision (now "next-intl + `useI18n` shim"), the project-structure
tree (`app/[locale]/`, `content/lab` + `content/projects` MDX, i18n namespaces, instrumentation, sitemap/robots,
error boundaries, OG image), the i18n/content section (URL routing + UI-vs-prose split + parity test), the tech
stack (added next-intl, zod, Vitest, GitHub Actions CI, Vercel Analytics, gated Sentry), Getting Started
(scripts + `.env.example`), and "Adding a New Lab Chapter" (server/client split + MDX prose). Added a
"Quality & CI" section. Kept the chapter write-ups, backend API table, and latent-space docs intact.

## 2026-06-05 — Enable reactStrictMode (Phase 8) ✅

Flipped `reactStrictMode` to `true` in `next.config.mjs`. Strict mode double-invokes effects in development to
surface side-effect bugs early; production builds are unaffected. Build is green with it on (123/123 pages).

## 2026-06-05 — MDX content validation (Phase 7) ✅

Added a **zod** schema for note frontmatter (`noteFrontmatterSchema` in `src/lib/mdx.ts`): `title` required,
`kind`/`status` constrained to their known values, the rest optional — lenient toward the existing 20 notes.
The content test now validates every note's frontmatter against it (and the wikilink-integrity check from
Phase 1 is already active), so malformed content fails CI. The runtime loader stays tolerant on purpose, so a
bad note can never crash the live site. Test count: 38 green.

## 2026-06-05 — Per-page SEO: metadata + OG image + JSON-LD (Phase 6) ✅

Each lab chapter now has its own search-engine identity. The 5 chapter routes (bigram, ngram, neural-networks,
mlp, transformer) were each split into a thin **server** `page.tsx` (exports `generateMetadata`) + a
`<chapter>-client.tsx` holding the existing interactive UI — necessary because the pages are client components
and `generateMetadata` must run on the server. A shared helper (`lab/_seo.ts`) emits per-chapter localized
title/description (from the `models.<chapter>` i18n block), canonical URL, and hreflang alternates (EN
unprefixed / ES `/es`), plus an article OpenGraph card. Added `models.transformer.{title,description}` (EN/ES),
which didn't exist. Added a branded **dynamic OG image** (`[locale]/opengraph-image.tsx`, `next/og`) used as
the default social card, and **JSON-LD** (Person + WebSite schema) in the locale layout. Build generates all
123 pages + the OG image route cleanly.

## 2026-06-05 — Analytics + observability (Phase 5) ✅

Added traffic + performance telemetry and gated error reporting. **Vercel Analytics** + **Speed Insights**
(`<Analytics/>` + `<SpeedInsights/>` in the locale layout) — zero-config, and a no-op off Vercel, so safe
everywhere. **Sentry**, fully **gated behind `NEXT_PUBLIC_SENTRY_DSN`**: with no DSN the SDK is never imported
(server) and tree-shaken out of the client bundle (the var is inlined at build time), so it has zero build/
runtime/bundle cost until a DSN is provided. Wired via `src/instrumentation.ts` (server/edge `register` +
`onRequestError`) and `src/instrumentation-client.ts` (client init) — no `withSentryConfig` wrapper needed.
Added `.npmrc` (`legacy-peer-deps=true`) to resolve an unrelated optional-peer conflict from `@vercel/analytics`.

## 2026-06-05 — HTTP security headers (Phase 4) ✅

Added real security headers via `next.config.mjs → headers()` on every route: HSTS (2-year, includeSubDomains,
preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation off), `X-DNS-Prefetch-Control:
on`. Plus a **Content-Security-Policy in Report-Only mode** — it never blocks anything, it only reports
violations, so it's safe to ship; once the report is clean we flip the header name to enforce. The policy
already whitelists the backend API origin and Vercel analytics so the eventual switch is low-friction.

## 2026-06-05 — Perf hardening, safe subset (Phase 3) ✅

Enabled `experimental.optimizePackageImports` for `lucide-react` and `framer-motion` in `next.config.mjs` —
Next now tree-shakes those big barrel imports to their deep paths at build time, so each page ships only the
icons/animation primitives it actually uses. No behavior change. **Deferred on purpose (future work):** the
bigger win — making the lab chapters load their MDX via a locale-aware dynamic import from a *server* boundary
(today both language bundles are shipped to the client, and ~91% of the tree is client) — was NOT attempted in
this unattended run because it can break the instant in-place language toggle; it needs interactive validation.

## 2026-06-05 — Error boundaries + 404 pages (Phase 2) ✅

Broken pages no longer show a blank screen. Added a last-resort `global-error.tsx` (renders its own document
with inline styles — works even when the root layout itself fails), an in-app `[locale]/error.tsx` with a
"try again" button, a localized `[locale]/not-found.tsx` 404 (EN/ES, locale-aware link home), and a
self-contained root `not-found.tsx` for non-locale paths. New i18n keys: `common.notFound{Title,Body,Cta}`.

## 2026-06-05 — Tests + CI (Phase 1) ✅

The site now has an automated test suite and a CI robot. **Tests** (`vitest`): an i18n **parity test**
(`src/i18n/i18n.test.ts`) that guarantees the Spanish and English dictionaries have the exact same structure
— same nested keys, same array-of-object lengths, no value empty in one language but filled in the other, no
stray non-string leaves — so a translation can never silently drift; plus a **content test**
(`src/content/content.test.ts`) verifying every lab chapter and every project has BOTH `.es.mdx` and `.en.mdx`,
and that every latent-space `[[wikilink]]` points at a real note. **CI** (`.github/workflows/ci.yml`): on every
push / PR, GitHub runs typecheck → lint → test → build on Node 22. Lint is non-blocking for now (pre-existing
lint errors unrelated to this work); typecheck, test and build are blocking. 17 tests green locally.

## 2026-06-05 — Finished: professional production hardening (all 11 phases) ✅

All 11 phases of `docs/pro-upgrade-plan.md` landed, each its own verified commit on
`redesign/ngram-amber-v1` (typecheck + build green per phase). What shipped:

1. **Tests + CI** — Vitest (i18n parity + content/frontmatter/wikilink validation, 38 tests) + GitHub Actions.
2. **Error boundaries** — `global-error`, in-app `error`, localized `not-found` (+ root fallback).
3. **Perf (safe)** — `optimizePackageImports` for icons/animation (MDX-2× refactor logged as deferred).
4. **Security headers** — HSTS, nosniff, frame, referrer, permissions + **CSP report-only**.
5. **Analytics + observability** — Vercel Analytics + Speed Insights; **Sentry gated** behind a DSN (inert without).
6. **Per-page SEO** — per-chapter metadata + hreflang via a server/client split, dynamic OG image, JSON-LD.
7. **MDX validation** — zod frontmatter schema, validated in the content test.
8. **reactStrictMode** — enabled.
9. **README** — refreshed for the real architecture.
10. **.env.example** — every env var documented.
11. **Prettier + husky/lint-staged** — staged-only formatting; MD/MDX protected.

**Nothing deferred for failure** — the only intentional deferral is the larger MDX client→server perf refactor
(Phase 3), which needs interactive validation. Final state: `tsc` clean, 38 tests green, production build green
(123 pages + OG image route). New deps: `@vercel/analytics`, `@vercel/speed-insights`, `@sentry/nextjs`, `zod`
(runtime); `prettier`, `husky`, `lint-staged` (dev). Added `.npmrc` (`legacy-peer-deps`) for an optional-peer
conflict.

## 2026-06-05 — Started: professional production hardening (P0 + P1 + selected P2)

Began a multi-phase upgrade to take the site from "high-craft demo" to "production-grade". Plan lives in
`docs/pro-upgrade-plan.md`. Phases (each committed + verified separately, finish entries added below as they land):
tests + CI, error boundaries, perf hardening, security headers, analytics + observability, per-page SEO,
MDX content validation, reactStrictMode, README refresh, `.env.example`, Prettier + pre-commit hook.

## 2026-06-05 — Project log + logging rule introduced

Added this file (`docs/PROJECT-LOG.md`) and a mandatory rule in `CLAUDE.md` requiring every important change /
new capability (and full chapter aesthetic renovations) to be recorded here, so the project's history is always
legible.

---

## Earlier milestones (reconstructed — the i18n / MDX / next-intl effort)

## 2026-06-05 — projects: MDX scaffold for per-project prose
Each project's long-form overview moved to `src/content/projects/<slug>.{es,en}.mdx` (markdown), loaded via
`src/lib/projectContent.ts`; short fields stay in `projects-data.ts`. Ready to grow into long explanatory text.

## 2026-06-05 — next-intl: URL-based locale routing + SEO
Migrated language from client-only (localStorage) to **server-resolved URL routing** with next-intl
(`localePrefix: 'as-needed'` → English unprefixed, Spanish under `/es/`). App moved under `src/app/[locale]/`;
`useI18n()` became a compatibility shim over next-intl (all ~374 call-sites unchanged); locale-aware links via
`@/i18n/navigation`. Added per-locale `sitemap.xml` + `robots.txt` with hreflang, and localized project metadata.
Eliminates the language "flash" and makes both languages indexable by search engines.

## 2026-06-05 — i18n: split by area
`home`, `projects`, `latent-space` extracted from the catch-all `lab` namespace into their own modules under
`src/i18n/locales/*` (keys unchanged, verified lossless).

## 2026-06-05 — Lab narrative migrated to MDX (all 5 chapters)
bigram, ngram, neural-networks, mlp, transformer narratives moved from fragmented i18n strings to readable
bilingual MDX in `src/content/lab/*.{es,en}.mdx`, rendered by thin shell components through
`labMdxComponents()`. Plus one-line pedagogical-intent comments per widget in every chapter MDX. Separated UI
strings (i18n) from long-form prose (MDX). The i18n monolith was also split into per-feature namespaces.
Note: `transformer.es.mdx` still carries the English body (Spanish translation pending).
