# adrian-v2-web

Personal site and interactive AI/ML learning platform. Three things in one: a portfolio, an educational lab that teaches language models from scratch, and a personal notebook.

**Live →** [adrianlaynez.dev](https://adrianlaynez.dev)

---

## What's inside

| Section | Route | Description |
|---|---|---|
| **Portfolio** | `/` `/projects` | Who I am, what I've built |
| **LM Lab** | `/lab` | Interactive ML education — 5 chapters, real trained models |
| **Latent Space** | `/latent-space` | Personal essays and Zettelkasten notes |

---

## Getting started

```bash
npm install
npm run dev          # → localhost:3000
```

The site works without a backend — all interactive visualizers have client-side simulation. The backend unlocks real model inference in the lab:

```bash
# Optional: point to local backend
NEXT_PUBLIC_LM_LAB_API_URL=http://localhost:8000
```

---

## Project structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── lab/                    # LM Lab routes (bigram, ngram, nn, mlp, transformer)
│   ├── latent-space/           # Notes + Essays (with _components co-located)
│   ├── projects/
│   └── page.tsx                # Home / Portfolio
│
├── features/
│   └── lab/                    # Everything the lab needs, fully self-contained
│       ├── components/         # ~340 interactive visualizer components
│       │   ├── mlp/            # MLP chapter (~60 components)
│       │   ├── transformer/    # Transformer chapter (~60 components)
│       │   ├── nn/             # Neural Networks chapter
│       │   └── chill/          # Lab landing page (editorial design)
│       ├── hooks/              # 15 custom hooks (training loops, generation, viz)
│       ├── context/            # LabModeContext (narrative/lab mode), UserContext
│       ├── lib/                # lmLabClient.ts — typed API client, retry + timeout
│       └── types/              # TypeScript types for all API responses
│
├── components/                 # Shared global components only
│   ├── layout/                 # Navbar, footer, layout shell
│   ├── ui/                     # Design system primitives
│   └── mdx/                    # MDX rendering (callout, math, code)
│
├── content/
│   └── notes/                  # MDX source files for Latent Space
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

---

## The LM Lab

The main feature. An interactive educational platform that teaches how language models work — from counting character pairs in 1948 to the Transformer architecture behind GPT.

### The journey

```
ERA I — Counting                ERA II — Learning              ERA III — Attention
─────────────────               ─────────────────              ───────────────────
Ch.01  Bigram         →         Ch.03  Neural Nets    →        Ch.05  Transformer
Ch.02  N-Gram                   Ch.04  MLP
```

Each chapter has two modes, switchable at any time:

- **Narrative** — guided story, concepts introduced progressively, demos embedded in prose
- **Lab** — all tools exposed, free exploration, no hand-holding

### What each chapter teaches

**Bigram** (`/lab/bigram`) — The simplest possible model: count character pairs, predict what comes next. Interactive transition matrix, live generation, context blindness demo.

**N-Gram** (`/lab/ngram`) — Extend context from 1 to N characters. Watch the combinatorial explosion kill the table. Sparsity heatmaps, N-gram generation battles, memory limit demos.

**Neural Networks** (`/lab/neural-networks`) — From single perceptron to backprop. Weight nudging, loss landscapes, activation functions, the XOR problem. Why linearity isn't enough.

**MLP** (`/lab/mlp`) — The core chapter. Embeddings, hidden layers, BatchNorm, Kaiming initialization, residual connections, depth experiments. Live N-gram vs MLP training race, polysemanticity demos, full hyperparameter explorer with real training.

**Transformer** (`/lab/transformer`) — Attention mechanisms, Q/K/V matrices, positional encoding, multi-head attention. The architecture behind every modern LLM.

### Backend API

```
Production:  https://lm-lab.onrender.com/api/v1/
Development: http://localhost:8000/api/v1/
```

Proxied via Next.js rewrites in `next.config.mjs`. All requests: 45s timeout, 1 automatic retry on network failure.

| Endpoint | Used for |
|---|---|
| `POST /bigram/visualize` | Transition matrix heatmap |
| `POST /bigram/generate` | Character-level text generation |
| `POST /ngram/inference` | N-gram predictions + probability distributions |
| `POST /mlp/predict` | MLP next-character prediction |
| `POST /mlp/grid` | Hyperparameter grid training |
| `POST /mlp/embeddings` | 2D embedding space coordinates |
| `POST /mlp/internals` | Hidden layer activations per neuron |

### Most interesting components

| Component | What it does |
|---|---|
| `MLPHyperparameterExplorer` | Train models with any config, compare loss curves live |
| `TrainingRace4gramVsMLP` | N-gram vs MLP side-by-side with live loss |
| `TripleModelRace` | Three model configurations competing simultaneously |
| `BackpropEmbeddingVisualizer` | Watch embedding vectors self-organize during training |
| `EmbeddingBottleneckExplorer` | Compare 2D / 10D / 32D / 128D embedding spaces |
| `MLPPipelineVisualizer` | Animated step-by-step forward pass |
| `SoftmaxStepVisualizer` | Interactive softmax calculation walkthrough |
| `WordEmbeddingAnalogyDemo` | king − man + woman ≈ queen, with real learned vectors |
| `StabilityTechniqueGrid` | Kaiming + BatchNorm + Residual connections, togglable |
| `TransformerNarrative` | 3500-line interactive Transformer chapter |

---

## Latent Space (`/latent-space`)

Personal writing and notes. Two modes, toggle with Space or ← →:

- **Essays** — Long-form opinionated writing. MDX with KaTeX math, Shiki code highlighting, custom callouts.
- **Mind** — Zettelkasten notes. Graph view, backlinks panel, tag filtering, reading progress bar.

To add content, drop an `.mdx` file in `src/content/notes/`:

```mdx
---
title: "The Geometry of Intelligence"
date: "2024-11-15"
tags: ["ai", "geometry"]
description: "How high-dimensional spaces encode meaning."
---

Your content here. Math: $E = mc^2$. Code with syntax highlighting.
```

---

## i18n

Every user-facing string lives in `src/i18n/en.ts` and `src/i18n/es.ts`. Language toggle in the navbar, preference persists in localStorage.

```tsx
const { t, language } = useI18n();
<p>{t('lab.mlp.sections.hidden.pWhyHiddenLayers')}</p>
```

Keys mirror the app's structure: `nav`, `landing`, `lab.bigram`, `lab.mlp.sections.*`, `latentSpace`, etc.

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| UI primitives | Radix UI |
| MDX | next-mdx-remote + gray-matter |
| Math | KaTeX |
| Code highlighting | Shiki via rehype-pretty-code |
| Icons | Lucide React |

---

## Adding a new lab chapter

1. Page: `src/app/lab/[chapter]/page.tsx`
2. Narrative: `src/features/lab/components/[Chapter]Narrative.tsx`
3. Visualizers: `src/features/lab/components/[chapter]/`
4. Translations: add `lab.[chapter]` to both `src/i18n/en.ts` and `src/i18n/es.ts`
5. Link from landing: edit `src/app/lab/page.tsx` → add to the `EraSection` chapters array

```bash
# Analyze bundle size
ANALYZE=true npm run build
```
