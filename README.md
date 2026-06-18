<div align="center">

# LM0

**An interactive lab on how language models work — from counting character pairs to attention.**

[![Live](https://img.shields.io/badge/Live-lm0.dev-black?style=flat-square&logo=vercel)](https://lm0.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Bilingual](https://img.shields.io/badge/i18n-EN%20%2F%20ES-orange?style=flat-square)](./src/i18n)

</div>

---

LM0 is a single-purpose site: watch a language model learn to speak, one idea at a time. The landing ("El
nacimiento") trains a real n-gram live in your browser, then five chapters walk the real history of language
modelling — each idea born from the one before, none skipped.

```
ERA I — Counting                ERA II — Learning              ERA III — Attention
─────────────────               ─────────────────              ───────────────────
/bigram   →   /ngram      →     /neural-networks  →  /mlp   →   /transformer
```

Every chapter has two modes, switchable from the toolbar:

- **Narrative** — a guided story, concepts introduced progressively, demos embedded in prose.
- **Lab** — all tools exposed, free exploration, no hand-holding.

## Chapters

| Route | Chapter | The one idea |
|---|---|---|
| `/` | **El nacimiento** (landing) | A machine that can't speak learns to, by counting which letter follows another |
| `/bigram` | **Bigram** | Look only at the last letter |
| `/ngram` | **N-Gram** | Look a few letters back — and watch the table explode |
| `/neural-networks` | **Neural Networks** | Learn instead of counting |
| `/mlp` | **MLP** | Layers that mix patterns (embeddings → training → a model you can run live) |
| `/transformer` | **Transformer** | Choose what to look at (self-attention, multi-head, positional encoding) |

## Backend

The interactive chapters call a FastAPI + PyTorch service (separate repo, deployed on Render) **proxied through
Next.js rewrites** (`/api/v1/*` → the backend) — no CORS, no backend URL in the browser, zero-config local dev
swap. The lab works fully **without** the backend: every visualizer has a client-side simulation mode, and a UI
warning handles cold starts. Client: `src/features/lab/lib/lmLabClient.ts`.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| i18n | next-intl (URL routing, `as-needed`) + a `useI18n()` shim |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion · GSAP · Lenis |
| MDX | @next/mdx (static import) + remark-math / rehype-katex |
| Math | KaTeX |
| Testing | Vitest (EN/ES parity + lab engine tests) |
| CI | GitHub Actions (typecheck · lint · test · build) |
| Hosting | Vercel |

## Getting started

```bash
git clone https://github.com/adrilaynez/lm0
cd lm0
npm install
npm run dev                  # → localhost:3000
```

Everything works without the backend (client-side simulation). In dev, API calls proxy to
`http://localhost:8000` (see the rewrite in `next.config.mjs`).

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm run test         # vitest
npm run lint         # eslint
```

### Environment

All variables are optional (sane defaults). For production set:

- `NEXT_PUBLIC_SITE_URL=https://lm0.dev` — canonical URLs / sitemap / OG.

## Project structure

```
src/
├── app/
│   ├── [locale]/               # App Router, locale-segmented (en | es)
│   │   ├── page.tsx            #   /            → the landing ("El nacimiento")
│   │   ├── bigram/ … transformer/   #   /bigram … /transformer (server page + client)
│   │   ├── _seo.ts             #   per-chapter metadata (canonical + hreflang + OG)
│   │   ├── layout.tsx          #   <html> + fonts + providers + KaTeX
│   │   ├── error.tsx · not-found.tsx
│   │   └── lab-landing-client.tsx
│   ├── layout.tsx · sitemap.ts · robots.ts
│   └── proxy.ts                # next-intl middleware (Next 16 renamed middleware→proxy)
│
├── features/lab/               # Self-contained lab module (~490 files)
│   ├── components/             #   visualizers (bigram, ngram, nn, mlp, transformer) + lm0 landing
│   ├── hooks/ · context/ · lib/ · data/ · types/
│   └── lm0/nacimiento/         #   the landing: machine, reader, eras, finale
│
├── content/lab/                # Chapter prose — <chapter>.{es,en}.mdx
├── i18n/                       # Bilingual EN/ES UI strings (prose is in content/*.mdx)
└── components/ · lib/          # Shared UI primitives + cn()
```

## i18n

Language is **URL-based** via next-intl: English unprefixed (`/bigram`), Spanish under `/es/` (`/es/bigram`),
persisted in the `NEXT_LOCALE` cookie. UI strings live in typed namespace modules
(`src/i18n/locales/<ns>/{en,es}.ts`); long-form chapter prose lives in bilingual MDX. A parity test
(`src/i18n/i18n.test.ts`) fails CI if the two dictionaries ever drift apart.

> ⚠️ All locale files must be saved as UTF-8 without BOM.
