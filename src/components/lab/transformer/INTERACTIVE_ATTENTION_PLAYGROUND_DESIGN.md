# InteractiveAttentionPlaygroundViz — FLAGSHIP Design Document

## Vision
The ultimate interactive attention visualizer. The user selects a sentence, clicks any word, and sees the FULL attention mechanism play out in real-time: Q·K scores, softmax weights, value blending, and the resulting contextual embedding — all animated step by step.

## Why Not Free-Text Input
Free-text input would require a real model (backend/WASM). Instead, we use **5 pre-built sentences** with pre-computed attention data. This gives us:
- Perfect pedagogical control over what the user sees
- Rich, meaningful data that tells a story
- Zero latency, zero API dependency
- Ability to hand-craft weights that are instructive

## Core Interaction Flow

```
1. USER selects a sentence (5 options via tabs)
2. Sentence words appear as clickable pills
3. USER clicks a word (the "query word")
4. Animation plays in 4 stages:
   Stage 1: Q·K SCORES — raw dot product scores appear next to each word
   Stage 2: SOFTMAX — scores convert to percentages (bars animate)
   Stage 3: VALUE BLEND — weighted arcs flow from high-weight words to query word
   Stage 4: OUTPUT — the query word's new embedding strip appears (different from original)
5. USER can click a different word → animation replays for that word
6. USER can switch sentence → everything resets
```

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  INTERACTIVE ATTENTION PLAYGROUND                       │
│  "See attention happen — one word at a time"            │
│                                                         │
│  [Sentence 1] [Sentence 2] [Sentence 3] [Sentence 4]   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │    The   golden   king   wore   a   heavy   crown │  │
│  │                    ↑ clicked                      │  │
│  │                                                   │  │
│  │  ── STEP 1: Q·K Scores ──────────────────────     │  │
│  │  The     0.12                                     │  │
│  │  golden  3.85  ████████████                       │  │
│  │  king    1.20  ████                               │  │
│  │  wore    2.10  ███████                            │  │
│  │  a       0.05                                     │  │
│  │  heavy   1.80  ██████                             │  │
│  │  crown   4.20  █████████████                      │  │
│  │                                                   │  │
│  │  ── STEP 2: Softmax → Percentages ───────────     │  │
│  │  The      1%  ▪                                   │  │
│  │  golden  28%  ████████████████                    │  │
│  │  king     5%  ███                                 │  │
│  │  wore    12%  ███████                             │  │
│  │  a        1%  ▪                                   │  │
│  │  heavy   15%  █████████                           │  │
│  │  crown   38%  ██████████████████████              │  │
│  │                                                   │  │
│  │  ── STEP 3: Blend Values ─────────────────────    │  │
│  │  [Animated arcs from high-weight words to query]  │  │
│  │                                                   │  │
│  │  ── STEP 4: New Embedding ─────────────────────   │  │
│  │  "king" before: [▓▓▒░▓▒▓░]                       │  │
│  │  "king" after:  [░▓▓▒░▓▒▓]  ← context-shaped     │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  "Click any word to be the query. Watch attention       │
│   compute scores, weights, and the new embedding."      │
└─────────────────────────────────────────────────────────┘
```

## Data Structure

Each sentence needs:
```typescript
{
  words: string[],
  // For each possible query word, pre-compute:
  attention: {
    [queryIdx: number]: {
      qkScores: number[],       // raw Q·K dot products
      softmaxWeights: number[], // after softmax
      beforeEmbedding: number[], // 8-dim embedding before attention
      afterEmbedding: number[],  // 8-dim embedding after attention
    }
  }
}
```

## 5 Pre-built Sentences

1. **"The golden king wore a heavy crown"** — royalty context, crown/golden dominate for "king"
2. **"The river bank was covered in moss"** — nature context, river/moss dominate for "bank"  
3. **"She played the piano at the concert"** — music context, piano/concert dominate for "played"
4. **"The bright star shone above the dark city"** — astronomy vs metaphor
5. **"A cold wind blew across the frozen lake"** — nature/weather context

## Animation Timing
- Stage 1 (Q·K scores): 0.6s staggered bars
- Stage 2 (Softmax): 0.8s morph animation (scores → percentages)
- Stage 3 (Value blend): 1.0s flowing arcs
- Stage 4 (Output): 0.5s strip reveal
- Total: ~3s per word click
- Each stage has a clear visual separator and label

## Visual Style
- Sentence pills: large (14px), cyan-400 highlight on selected query word
- Score/weight bars: 8px tall, bright gradients, readable percentages (13px)
- Arcs: SVG curved lines, thickness ∝ weight, colored by sentence accent
- Embedding strips: consistent with other vizs (barColor/barHeight helpers)
- Steps: clear section labels with subtle dividers
- Background: very subtle card (white/3 border), no heavy boxes
- All text ≥ 12px, key numbers ≥ 13px

## What Makes This FLAGSHIP
1. **Full pipeline visible** — every step of attention in one place
2. **Interactive** — click ANY word to see its attention pattern
3. **Multiple sentences** — switch context to see different patterns
4. **Before/After** — concrete numerical proof of transformation
5. **Step-by-step** — not all at once, staged animation for learning
6. **Replayable** — click same word again to replay animation

## Technical Notes
- Use `useState` for selectedSentence, selectedWord, currentStage
- Framer Motion for all animations
- SVG for the blend arcs (stage 3)
- No external dependencies beyond framer-motion
- Pre-compute all data as constants (no runtime computation)
