<div align="center">

# adrianlaynez.dev

**Personal site · Interactive AI/ML Lab · Digital notebook**

[![Live](https://img.shields.io/badge/Live-adrianlaynez.dev-black?style=flat-square&logo=vercel)](https://adrianlaynez.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Bilingual](https://img.shields.io/badge/i18n-EN%20%2F%20ES-orange?style=flat-square)](./src/i18n)

<br/>

![Home](./docs/screenshots/home.png)

</div>

---

Three things built as one:

| | | |
|---|---|---|
| **Portfolio** | `/` `/projects` | Who I am and what I've built |
| **LM Lab** | `/lab` | Interactive ML education — 5 chapters, real trained models |
| **Latent Space** | `/latent-space` | Personal essays and Zettelkasten notes |

---

## Portfolio

![About section](./docs/screenshots/home-about.png)

The home page is a full-screen editorial experience: animated character reveal on load, a bento-grid with project cards, and an EN/ES language toggle that persists across sessions. The `/projects` page showcases LM-Lab as the flagship project with a live demo CTA, plus a section for upcoming experiments.

---

## LM Lab

> *An interactive educational platform that teaches how language models work — from counting character pairs in 1948 to the Transformer architecture behind GPT.*

**Live:** [adrianlaynez.dev/lab](https://adrianlaynez.dev/lab)  
**Backend:** [lm-lab.onrender.com/api/v1](https://lm-lab.onrender.com/api/v1)

![LM Lab landing](./docs/screenshots/lab-landing.png)

### The Journey

```
ERA I — Counting                ERA II — Learning              ERA III — Attention
─────────────────               ─────────────────              ───────────────────
Ch.01  Bigram         →         Ch.03  Neural Nets    →        Ch.05  Transformer
Ch.02  N-Gram                   Ch.04  MLP
```

Each chapter has two modes, switchable at any time from the toolbar:

- **Narrative** — guided story, concepts introduced progressively, demos embedded in prose
- **Lab** — all tools exposed, free exploration, no hand-holding

### Landing Page (`/lab`)

An editorial-style landing page introduces the three eras of language modelling. Custom CSS (`chill-lab.css`) gives it a distinct monospace + brutalist aesthetic separate from the rest of the site.

---

### Chapter 01 — Bigram (`/lab/bigram`)

The simplest possible model: count how often character B follows character A, then pick the most common one. Built on a real PyTorch bigram model trained on name datasets.

**Interactions:**
- Live transition matrix heatmap — fetched from the backend, rendered as an interactive canvas
- Character-by-character generation with temperature control
- Context blindness demo — shows exactly why a 1-gram window fails

---

### Chapter 02 — N-Gram (`/lab/ngram`)

Extend the context window from 1 to N characters. The chapter physically shows the table exploding: as N grows, most cells are empty (sparsity), and the table size grows exponentially until it's useless.

**Interactions:**
- N-gram table explorer with live sparsity heatmaps
- Side-by-side generation battles across different N values
- Memory limit demonstrations — why you can't just make N larger

---

### Chapter 03 — Neural Networks (`/lab/neural-networks`)

From a single perceptron to full backpropagation. No shortcuts — every component of the learning algorithm is made interactive.

**Interactions:**
- Single perceptron: nudge weights with a slider, watch the output change
- Loss landscape explorer: 3D surface, draggable current position
- Activation function comparisons: sigmoid, tanh, ReLU side-by-side
- XOR problem demo — shows exactly why you need non-linearity
- Full backprop walkthrough: one forward pass animated step by step

---

### Chapter 04 — MLP (`/lab/mlp`)

![MLP chapter](./docs/screenshots/lab-mlp.png)

The core chapter. 99 components, ~30,000 lines. A complete treatment of the multilayer perceptron: from raw character embeddings through training dynamics to a model you can run live.

**Standout components:**

| Component | What it does |
|---|---|
| `MLPHyperparameterExplorer` | Train any config, compare loss curves live |
| `TrainingRace4gramVsMLP` | N-gram vs MLP side-by-side with live loss |
| `TripleModelRace` | Three model configurations competing simultaneously |
| `BackpropEmbeddingVisualizer` | Watch embedding vectors self-organize during training |
| `EmbeddingBottleneckExplorer` | 2D / 10D / 32D / 128D embedding space comparison |
| `MLPPipelineVisualizer` | Animated step-by-step forward pass |
| `SoftmaxStepVisualizer` | Interactive softmax calculation walkthrough |
| `WordEmbeddingAnalogyDemo` | king − man + woman ≈ queen with real learned vectors |
| `StabilityTechniqueGrid` | Kaiming + BatchNorm + Residual connections, togglable |
| `PolysemanticitySandbox` | Shows how neurons encode multiple features at once |

**Topics covered:** Character embeddings → hidden layers → BatchNorm → Kaiming initialization → residual connections → depth experiments → polysemanticity → the full training loop.

---

### Chapter 05 — Transformer (`/lab/transformer`)

The architecture behind every modern LLM. 114 components, structured around a single 3500-line interactive narrative plus modular visualizers.

**Topics covered:**
- Self-attention from scratch: Q, K, V matrices built interactively
- Positional encoding: why and how positions are injected as sine/cosine signals
- Multi-head attention: multiple attention patterns running simultaneously
- The full Transformer block: residual + LayerNorm + FFN
- Scaling laws overview

**Standout components:**
- `AttentionPatternVisualizer` — interactive attention matrix you can modify token by token
- `QKVMatrixBuilder` — assemble the query/key/value decomposition manually
- `MultiHeadAttentionDemo` — see multiple heads attending to different patterns
- `PositionalEncodingExplorer` — sine/cosine encoding at every position

---

### Backend API

The backend is a FastAPI + PyTorch service deployed on Render (free tier — cold starts ~30s, handled with a UI warning in the lab). All requests are proxied through Next.js rewrites: no CORS, no backend URL exposed to the browser, zero-config local dev swap.

**Client:** `src/features/lab/lib/lmLabClient.ts` — 45s timeout, 1 automatic retry on network failure.

| Endpoint | Used for |
|---|---|
| `POST /bigram/visualize` | Transition matrix heatmap data |
| `POST /bigram/generate` | Character-level text generation |
| `POST /ngram/inference` | N-gram predictions + probability distributions |
| `POST /mlp/predict` | MLP next-character prediction |
| `POST /mlp/grid` | Hyperparameter grid training results |
| `POST /mlp/embeddings` | 2D embedding space coordinates |
| `POST /mlp/internals` | Hidden layer activations per neuron |

The lab works fully without a backend — every visualizer has a client-side simulation mode.

---

## Latent Space

![Latent Space](./docs/screenshots/latent-space-essays.png)

> *Personal writing at the intersection of AI, cognition, and design.*

**Live:** [adrianlaynez.dev/latent-space](https://adrianlaynez.dev/latent-space)

Two modes, toggle with `Space` or `← →` on the landing page:

### Essays

Long-form writing rendered with MDX. Each essay gets a custom SVG illustration (`public/essays/`). Features: KaTeX math, Shiki syntax highlighting, custom callout blocks, reading progress bar.

### Mind (Zettelkasten)

The same notes reimagined as a navigable knowledge graph:
- **Graph view** — nodes are notes, edges are `[[wikilink]]` references, force-directed layout
- **Backlinks panel** — shows what links here
- **Tag filtering** — sidebar taxonomy browser
- **Reading progress bar**

Currently 20 published notes/essays, including:

> *The Geometry of Intelligence · Attention is all you need (in life too) · The Observer Effect in AI · The Loss Landscape of Understanding · Latent Spaces as Maps · What is Intelligence, Really? · Pattern Language of Xanadu · The Shape of a Thought · Why I Write · Writing is a Search Procedure*

### Adding content

Drop an `.mdx` file in `src/content/notes/`:

```mdx
---
title: "Your Note Title"
date: "2026-05-28"
tags: ["ai", "cognition"]
description: "One line that captures the idea."
---

Your content. Math: $E = mc^2$. Code with syntax highlighting. [[wikilinks]] create graph edges.
```

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── lab/                    # Lab routes: bigram, ngram, neural-networks, mlp, transformer
│   ├── latent-space/           # Essays + Mind graph
│   ├── projects/
│   └── page.tsx                # Home / Portfolio
│
├── features/
│   └── lab/                    # Self-contained lab module
│       ├── components/         # ~340 visualizer components
│       │   ├── bigram/
│       │   ├── ngram/
│       │   ├── nn/
│       │   ├── mlp/            # 99 components · ~30k lines
│       │   ├── transformer/    # 114 components
│       │   └── chill/          # Lab landing page
│       ├── hooks/              # 15 custom hooks (training loops, generation, viz)
│       ├── context/            # LabModeContext (narrative/lab), UserContext
│       ├── lib/                # lmLabClient.ts — typed API client
│       └── types/              # TypeScript types for all API responses
│
├── components/                 # Shared globals only
│   ├── layout/                 # Navbar, footer
│   ├── ui/                     # Design system primitives (Button, Card, BentoGrid…)
│   └── mdx/                    # MDX renderers (callout, math, code)
│
├── context/
│   └── ScrollContext.tsx       # Shared scroll state (home + lab + latent-space)
│
├── content/
│   └── notes/                  # 20 MDX source files
│
├── i18n/                       # Bilingual EN/ES
│   ├── en.ts                   # ~4300 lines of English strings
│   ├── es.ts                   # ~4300 lines of Spanish strings
│   ├── context.tsx             # useI18n() hook
│   └── types.ts                # TranslationDictionary type
│
└── lib/
    ├── mdx.ts                  # MDX parsing utilities
    └── utils.ts                # cn() — Tailwind class merger
```

### Design Decisions

**Why `features/lab/` instead of `components/lab/`?** The lab is a self-contained product with its own hooks, context, API client, and types. Nothing outside `features/lab/` imports from inside it (except the `app/lab/` pages that mount it). This makes the boundary explicit and the module independently understandable.

**Why not next-intl or i18next?** The translation surface is large but static. A custom `useI18n()` hook over two typed dictionaries is ~40 lines vs a full library setup, and gives full TypeScript autocomplete on every key via `TranslationDictionary`. Acceptable tradeoff for a solo project.

**Why Next.js rewrites for the API?** Keeps the backend URL out of the browser (no CORS preflight), allows a zero-config local dev swap, and lets `useBackendHealth` detect cold starts the same way in both environments.

---

## i18n

Every user-facing string lives in `src/i18n/en.ts` and `src/i18n/es.ts`. Language toggle in the navbar, preference persists in `localStorage`.

```tsx
const { t, language } = useI18n();
<p>{t('lab.mlp.sections.hidden.pWhyHiddenLayers')}</p>
```

Keys mirror the app structure: `nav`, `landing`, `lab.bigram`, `lab.mlp.sections.*`, `latentSpace`, etc.

> ⚠️ **Encoding:** these files must be saved as UTF-8 without BOM. If you see `?` characters in the UI, check the file encoding first — Windows editors sometimes corrupt them silently.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| UI Primitives | Radix UI |
| MDX | next-mdx-remote + gray-matter |
| Math | KaTeX |
| Code highlighting | Shiki via rehype-pretty-code |
| Icons | Lucide React |
| Backend | FastAPI + PyTorch (separate repo) |
| Hosting | Vercel (frontend) · Render (backend) |

---

## Getting Started

```bash
git clone https://github.com/adrianlaynez/adrian-v2-web
cd adrian-v2-web
npm install
npm run dev          # → localhost:3000
```

The site works fully without the backend — every interactive visualizer has a client-side simulation mode. To enable real model inference:

```bash
# .env.local — point to local backend (optional)
NEXT_PUBLIC_LM_LAB_API_URL=http://localhost:8000
```

```bash
# Analyze bundle
ANALYZE=true npm run build
```

---

## Adding a New Lab Chapter

1. **Page** — `src/app/lab/[chapter]/page.tsx`
2. **Narrative** — `src/features/lab/components/[Chapter]Narrative.tsx`
3. **Visualizers** — `src/features/lab/components/[chapter]/`
4. **Translations** — add `lab.[chapter]` to both `src/i18n/en.ts` and `src/i18n/es.ts`
5. **Nav link** — edit `src/app/lab/page.tsx` → add to the `EraSection` chapters array

---

## Internal Documentation

| File | Covers |
|---|---|
| [`src/features/lab/README.md`](./src/features/lab/README.md) | Lab module internals: entry points, hooks, context, API client |
| [`src/features/lab/components/mlp/README.md`](./src/features/lab/components/mlp/README.md) | MLP chapter: 8-section structure, full component index |
| [`src/features/lab/components/transformer/README.md`](./src/features/lab/components/transformer/README.md) | Transformer chapter: topics, component index by category |
| [`src/i18n/README.md`](./src/i18n/README.md) | i18n system: usage, key structure, encoding warning |
