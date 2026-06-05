# Pro-upgrade execution plan (autonomous, unattended)

> **You (the agent) are executing this UNATTENDED after a /compact.** Read this whole file first. Then do
> every phase in order, autonomously, WITHOUT asking the user (they are away). Follow the Autonomous Contract
> below to the letter. Branch: `redesign/ngram-amber-v1`. Domain: `adrianlaynez.dev`
> (`NEXT_PUBLIC_SITE_URL`, fallback already hardcoded in code).

## Autonomous contract (apply to EVERY phase)
1. Implement the phase.
2. **Verify:** `npx tsc --noEmit` must be exit 0; for anything touching routing/config/build, also run a build:
   `NEXT_DIST_DIR=.next-verify npx next build` → then `rm -rf .next-verify` and `git checkout tsconfig.json`
   (the build re-adds `.next-verify` lines to tsconfig — always restore it). Lint touched files:
   `npx eslint <files> --fix`.
3. **If green:** `git add` the phase's files → commit (Conventional Commit, with the
   `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer) → `git push origin redesign/ngram-amber-v1`
   → **append a finish entry to `docs/PROJECT-LOG.md`** (newest on top, plain language).
4. **If a phase cannot go green** after a genuine attempt: `git checkout -- <touched>` / `git clean -fd <new>`
   to fully revert THAT phase, log it in PROJECT-LOG.md as "deferred (reason)", and CONTINUE to the next phase.
   Never leave the tree broken. Never block the rest on one phase.
5. Commit messages + log entries in the established style. Do NOT commit `_*.png` / `.shotprof_*` (already
   gitignored). Do NOT stop the user's dev server unless a file-move requires it (none here should).
6. The user's machine is on; keep going until all phases are done, then post a final summary.

## Git note
A dev server may hold port 3000; that's fine — use the `NEXT_DIST_DIR=.next-verify` build to avoid the `.next`
lock. Don't kill it unless strictly necessary.

---

## PHASE 1 — Tests + CI  (P0, highest priority)

**Goal:** a test suite (i18n-focused) + a GitHub Actions robot that runs typecheck/lint/test/build on every push/PR.

1. `npm i -D vitest @vitejs/plugin-react` (vitest is already a dep; ensure config exists).
2. Create `vitest.config.ts` (node environment is fine for the i18n/content tests; use `esbuild` to load the
   `.ts` dicts, OR import them directly — direct import is simplest now that they're plain TS):
   ```ts
   import { defineConfig } from "vitest/config";
   export default defineConfig({ test: { environment: "node", include: ["src/**/*.test.ts"] } });
   ```
3. **i18n parity test** `src/i18n/i18n.test.ts` — THE key test:
   - import `{ en }` and `{ es }` from the barrels.
   - flatten both to dotted-key sets; assert `es` keys === `en` keys (no missing, no extra). On failure, print
     the offending keys.
   - assert no value is an empty string.
   - assert every value is a string or string[] (no accidental objects/undefined leaves).
   - sanity: a few known keys exist (`common.toggleLanguage`, `lab.bigram`, `projects.summary`).
4. **MDX content test** `src/content/content.test.ts`:
   - every lab chapter has BOTH `<chapter>.es.mdx` and `<chapter>.en.mdx` (fs check of `src/content/lab`).
   - every project slug in `projects-data.ts` has both `src/content/projects/<slug>.{es,en}.mdx`.
   - (light) latent-space wikilink check: for each note, extract `[[slug]]` and assert the target note exists
     (reuse `getNoteSlugs`/`extractWikilinks` from `src/lib/mdx.ts`). If this is noisy/slow, keep it but mark
     `.skip` with a TODO comment rather than failing the suite.
5. Add scripts to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`.
6. **CI** `.github/workflows/ci.yml`: on push + pull_request → node 22 → `npm ci` →
   `npx tsc --noEmit` → `npx eslint .` (allow warnings, fail on errors via `--max-warnings` left generous) →
   `npm run test` → `npm run build`. Use `actions/checkout@v4`, `actions/setup-node@v4` with `cache: npm`.
   Set `env: NEXT_TELEMETRY_DISABLED: 1`. Build needs no secrets (SITE_URL has a fallback).
   - NOTE: lint currently has PRE-EXISTING errors in some files (React-compiler memoization rules, etc.).
     To avoid CI being red on day 1 for unrelated reasons, make the lint step **non-blocking** for now
     (`continue-on-error: true` on the lint step) OR scope it; tsc/test/build stay blocking. Log this caveat.
7. Verify: `npm run test` passes locally; `npx tsc`. Commit `test(i18n): parity + content tests + CI workflow`.

---

## PHASE 2 — Error boundaries  (P0)

**Goal:** graceful error/404 screens instead of blank pages. Root layout is a pass-through (no `<html>`), so
`global-error.tsx` is essential.

1. `src/app/global-error.tsx` — a CLIENT component (`"use client"`) rendering its OWN `<html><body>` with a
   minimal styled "something went wrong" + a reset button (`reset()` prop). No providers (it runs when the
   tree is broken). Keep it dependency-light (no i18n, no theme).
2. `src/app/[locale]/error.tsx` — `"use client"`, friendlier in-app error with a retry button; can use plain
   text (avoid `useI18n` to stay robust). Accent-neutral.
3. `src/app/[locale]/not-found.tsx` — a styled 404 with a link home (use `@/i18n/navigation` `Link`).
4. Optional: `src/app/not-found.tsx` (root) minimal fallback.
5. Verify build (these are special files Next picks up). Commit `feat(app): error boundaries + 404 pages`.

---

## PHASE 3 — Perf hardening (SAFE subset)  (P0)

**Goal:** safe, no-risk perf wins. **Do NOT do the risky client→server / MDX-2× refactor unattended** — it can
break the instant language toggle. Instead:
1. `next.config.mjs` → add `experimental: { optimizePackageImports: ["lucide-react", "framer-motion"] }`
   (tree-shakes big icon/animation imports — safe, large win). Verify build.
2. Confirm `next/font` is already used (it is) — no change.
3. In `docs/pro-upgrade-plan.md` / PROJECT-LOG, record the **MDX-2× and 91%-client** items as a documented
   FUTURE optimization (locale-aware dynamic MDX import from a server boundary) — do NOT attempt now.
4. Commit `perf: optimizePackageImports for icons/animation`.

---

## PHASE 4 — Security headers  (P1)

**Goal:** real security headers; do NOT break the site → CSP in **Report-Only**.
1. `next.config.mjs` → `async headers()` returning, for `/(.*)`:
   `Strict-Transport-Security` (max-age 2y; includeSubDomains; preload),
   `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
   `Referrer-Policy: strict-origin-when-cross-origin`,
   `Permissions-Policy: camera=(), microphone=(), geolocation=()`,
   `X-DNS-Prefetch-Control: on`.
2. Add a **Content-Security-Policy-Report-Only** header with a reasonable policy (allow self, inline styles for
   Next, the backend API origin `https://lm-lab.onrender.com`, images data:/blob:/https:, fonts). Report-Only
   means it NEVER blocks — it only surfaces violations, so it's safe unattended. Leave a comment to flip to
   enforcing CSP later once clean.
3. Verify build + that pages still load (the headers build into the output). Commit `feat(security): HTTP
   security headers (+ CSP report-only)`.

---

## PHASE 5 — Analytics + observability  (P1)

**Goal:** know your traffic + get notified on errors — without requiring secrets to function.
1. `npm i @vercel/analytics @vercel/speed-insights`. In `app/[locale]/layout.tsx` add `<Analytics />` and
   `<SpeedInsights />` (from `@vercel/analytics/next` and `@vercel/speed-insights/next`) inside `<body>`.
   Zero-config; inert off-Vercel. (If the user isn't on Vercel it simply no-ops — safe.)
2. **Sentry, gated:** `npm i @sentry/nextjs`. Add `sentry.client.config.ts` / `sentry.server.config.ts` (or the
   `instrumentation.ts` approach) that **only initialize when `process.env.NEXT_PUBLIC_SENTRY_DSN` is set** —
   so it's completely inert without the DSN (no build/runtime breakage). Do NOT run the Sentry wizard, do NOT
   wrap next.config with `withSentryConfig` (it can complain without an org/project). Keep it minimal + gated.
   Document `NEXT_PUBLIC_SENTRY_DSN` in `.env.example` (Phase 10).
3. Verify build with NO Sentry DSN set → must build clean. Commit `feat(observability): Vercel analytics +
   gated Sentry`.

---

## PHASE 6 — Per-page SEO  (P1)

**Goal:** each lab chapter + key pages get their own title/description, hreflang, OpenGraph; add OG images + JSON-LD.
1. For each lab chapter route `src/app/[locale]/lab/<chapter>/page.tsx` (bigram, ngram, neural-networks, mlp,
   transformer): add `export async function generateMetadata({params})` reading the chapter title/description
   from i18n (`getTranslations({locale, namespace})`) — use the existing `models.<chapter>.*` or
   `<chapter>Narrative.*.hero.*` keys for title/desc — with `alternates.languages` (hreflang, en unprefixed /
   es prefixed), canonical, and localized `openGraph`. Pattern already used in `app/[locale]/projects/[slug]/page.tsx`.
   - These pages are `"use client"`; `generateMetadata` must live in a SERVER file. If a page is a client
     component default export, add `generateMetadata` to the SAME file ONLY IF it has no `"use client"` at top
     — most `page.tsx` here ARE client. SOLUTION: keep the client component but move it to a child (e.g.
     `<chapter>-client.tsx`) and make `page.tsx` a thin SERVER wrapper that exports `generateMetadata` +
     renders the client child. Do this per chapter. Verify each.
2. **Dynamic OG image:** `src/app/[locale]/opengraph-image.tsx` using `next/og` `ImageResponse` — a clean
   branded card (site name + tagline, dark bg, accent). Keep it font-safe (use a single weight or the default).
   Optionally per-chapter OG images later. If `next/og` font loading risks breaking the build, ship a simpler
   static-ish card or skip per-route and keep one site-level OG image — log the choice.
3. **JSON-LD:** in `app/[locale]/layout.tsx` (or home page) add a `<script type="application/ld+json">` with a
   `Person` / `WebSite` schema (name, url, sameAs links). Safe, static.
4. Verify build (metadata renders). Commit `feat(seo): per-chapter metadata + OG image + JSON-LD`.

---

## PHASE 7 — MDX content validation  (P1)

**Goal:** catch malformed content. Largely covered by Phase 1's content test; extend it:
1. If notes have frontmatter, validate required fields with a small `zod` schema in `src/lib/mdx.ts`
   (title, date/kind, etc.) — fail the loader (or a test) on missing fields. Keep it lenient to current data.
2. Ensure the wikilink-integrity check from Phase 1 is enabled (un-skip if it was skipped, once confirmed clean).
3. Commit `test(content): MDX frontmatter + wikilink validation` (may fold into Phase 1 if trivial — then just
   log it).

---

## PHASE 8 — reactStrictMode: true  (P1)

1. `next.config.mjs` → `reactStrictMode: true`. Run `npx tsc` + `next build`. Strict mode is dev-only double-
   invoke; production build is unaffected, so build will pass. If it surfaces an obvious effect bug, note it in
   the log but keep strict mode on (it's the correct default). Commit `chore: enable reactStrictMode`.

---

## PHASE 9 — README refresh  (P2, requested)

1. Rewrite the stale parts of `README.md`: it predates next-intl and the MDX migration. Document the real
   current architecture: Next 16 App Router under `app/[locale]/`, next-intl URL routing (en unprefixed / es
   `/es/`), i18n namespaces in `src/i18n/locales/*` + the `useI18n` shim, lab narrative in `src/content/lab/*.mdx`,
   projects prose in `src/content/projects/*.mdx`, the test/CI setup, scripts, and how to run dev/build/test.
   Keep it concise and accurate. Commit `docs: refresh README for current architecture`.

---

## PHASE 10 — .env.example  (P2, requested)

1. Create `.env.example` listing every env var the project reads, with placeholder values + a one-line comment
   each: `NEXT_PUBLIC_SITE_URL` (default https://adrianlaynez.dev), the backend API base if any, the dev/prod
   API rewrite target, `NEXT_PUBLIC_SENTRY_DSN` (optional — analytics/Sentry inert if unset), `ANALYZE`.
   Grep the codebase for `process.env.` to find them all. Do NOT include real secrets. Commit
   `chore: add .env.example`.

---

## PHASE 11 — Prettier + pre-commit hook  (P2, requested)

1. `npm i -D prettier husky lint-staged`. Add `.prettierrc` (match existing style: 4-space indent? check a few
   files — the repo uses 4-space in TS; set `"tabWidth": 4` where applicable, `"printWidth": 100`,
   double quotes). Add `.prettierignore` (.next, node_modules, build artifacts, `*.png`).
2. `npx husky init` → `.husky/pre-commit` runs `npx lint-staged`.
3. `package.json` → `"lint-staged": { "*.{ts,tsx}": ["eslint --fix", "prettier --write"], "*.{md,mdx,json,css}": ["prettier --write"] }`.
   - **CAUTION:** do NOT run `prettier --write` across the WHOLE repo (it would reformat thousands of lines and
     bury real history). Only wire it for staged files going forward. Add a `format` script but don't run it
     globally.
4. Verify a trivial staged commit triggers the hook. Commit `chore: prettier + husky/lint-staged pre-commit`.

---

## FINAL
After all phases: run one last `npx tsc --noEmit` + `NEXT_DIST_DIR=.next-verify npx next build` (clean up after),
confirm green, ensure everything is pushed, append a "Finished: professional production hardening" entry to
`docs/PROJECT-LOG.md` summarizing what landed and what was deferred, and post a concise final summary to the user.
