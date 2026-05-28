<div align="center">

# adrianlaynez.dev

**Personal site · Interactive AI/ML Lab · Digital notebook**

[![Live](https://img.shields.io/badge/Live-adrianlaynez.dev-black?style=flat-square&logo=vercel)](https://adrianlaynez.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Bilingual](https://img.shields.io/badge/i18n-EN%20%2F%20ES-orange?style=flat-square)](./src/i18n)

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

The home page is a full-screen editorial experience: animated character reveal on load, a bento-grid with project cards, and an EN/ES language toggle that persists across sessions. The `/projects` page showcases LM-Lab as the flagship project with a live demo CTA, plus a section for upcoming experiments.

---

## LM Lab

> *An interactive educational platform that teaches how language models work — from counting character pairs in 1948 to the Transformer architecture behind GPT.*

**Live:** [adrianlaynez.dev/lab](https://adrianlaynez.dev/lab)  
**Backend:** [lm-lab.onrender.com/api/v1](https://lm-lab.onrender.com/api/v1)

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

Drop an `.