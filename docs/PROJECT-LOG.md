# Project log

The living history of this site — every **important change or new capability**, newest on top, in plain
language. Routine tweaks (a single visualizer change, copy edits, bug fixes) are NOT logged; architecture,
new capabilities, and full chapter aesthetic renovations ARE. See the rule in `CLAUDE.md → Project log`.

Format: `## YYYY-MM-DD — title` · what changed · why · (optional) commit refs.

---

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
