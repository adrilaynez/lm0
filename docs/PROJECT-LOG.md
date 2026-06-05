# Project log

The living history of this site — every **important change or new capability**, newest on top, in plain
language. Routine tweaks (a single visualizer change, copy edits, bug fixes) are NOT logged; architecture,
new capabilities, and full chapter aesthetic renovations ARE. See the rule in `CLAUDE.md → Project log`.

Format: `## YYYY-MM-DD — title` · what changed · why · (optional) commit refs.

---

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
