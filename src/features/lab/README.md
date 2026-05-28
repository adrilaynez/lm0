# features/lab

The LM Lab — a self-contained interactive educational platform teaching language models from the ground up. Everything this feature needs lives here and nowhere else.

## Structure

```
features/lab/
├── components/         # All interactive UI components
│   ├── (root)          # ~90 shared components used across chapters
│   ├── mlp/            # MLP chapter — ~60 specialized components
│   ├── transformer/    # Transformer chapter — ~60 specialized components
│   ├── nn/             # Neural Networks chapter components
│   └── chill/          # Lab landing page (editorial / magazine design)
├── hooks/              # Custom React hooks
├── context/            # React contexts
├── lib/                # API client
└── types/              # TypeScript types
```

## Entry points

Each chapter's narrative component is the main entry point for that chapter's content:

| File | Chapter | Lines |
|---|---|---|
| `components/BigramNarrative.tsx` | Bigram | ~600 |
| `components/NgramNarrative.tsx` | N-Gram | ~800 |
| `components/NeuralNetworkNarrative.tsx` | Neural Networks | ~1757 |
| `components/MLPNarrative.tsx` | MLP | ~1583 |
| `components/TransformerNarrative.tsx` | Transformer | ~3594 |

These are orchestrators — they import visualizers lazily (`React.lazy`) and embed them within the narrative flow.

## Components (root level)

Shared components used across multiple chapters:

| Component | Purpose |
|---|---|
| `LabShell` | Main wrapper: theme, progress bar, keyboard shortcuts |
| `ModeToggle` | Switch between Narrative and Lab mode |
| `LazySection` | Intersection-observer based lazy loading for heavy visualizers |
| `FadeInView` | Scroll-triggered fade-in animation wrapper |
| `KeyTakeaway` | Highlighted summary box at the end of a section |
| `SectionProgressBar` | Tracks how far through the chapter the user is |
| `GlossaryTooltip` | Inline `<Term>` component with hover definition |
| `ContinueToast` | "Continue where you left off" notification |
| `ErrorBoundary` | Catches visualizer crashes without breaking the whole page |
| `GenerationPlayground` | Live text generation with temperature control |
| `InferenceConsole` | Step-by-step model inference display |
| `TransitionMatrix` | Character-level bigram probability heatmap |

## Hooks

| Hook | Used for |
|---|---|
| `useProgressTracker` | Save/restore chapter progress across sessions |
| `useLabTheme` | Dark/light theme scoped to the lab |
| `useKeyboardShortcuts` | Arrow keys, Space for mode toggle |
| `useBigramGeneration` | Bigram model generation state + API calls |
| `useBigramVisualization` | Transition matrix data and animation state |
| `useNgramGeneration` | N-gram generation with variable context size |
| `useNgramVisualization` | Sparsity heatmap + dataset statistics |
| `useNgramStepwise` | Step-by-step prediction walkthrough |
| `useMLPGrid` | Hyperparameter grid training orchestration |
| `useNeuralNet` | Single neural network training loop (client-side) |
| `useBackendHealth` | Polling backend health, fallback to simulation |
| `useFeedback` | User feedback messages (correct/incorrect in challenges) |
| `useIdleHint` | Shows hint overlay after user inactivity |

## Context

**`LabModeContext`** — Tracks whether the user is in `narrative` or `lab` mode. Components read this to show/hide guided hints and explanations.

**`UserContext`** — Tracks session-level user state: chapter progress, completed interactions, feedback scores.

## lib/lmLabClient.ts

Typed API client for the Python backend. All lab API calls go through here.

```ts
import { predict, generate, visualize, getMLPEmbeddings } from '@/features/lab/lib/lmLabClient';
```

Features:
- Automatic retry on network errors (1 retry, 2s delay)
- 45s timeout with AbortController
- Typed responses via `@/features/lab/types/lmLab`
- Graceful error handling with `LmLabError` class

## Adding a new visualizer

1. Create the component in the appropriate subfolder (`mlp/`, `transformer/`, etc.)
2. Add it as a lazy import in the corresponding Narrative file:
   ```tsx
   const MyVisualizer = lazy(() =>
     import('@/features/lab/components/mlp/MyVisualizer')
       .then(m => ({ default: m.MyVisualizer }))
   );
   ```
3. Wrap it in `<LazySection>` + `<Suspense>` within the narrative
4. Add translations to `src/i18n/en.ts` and `src/i18n/es.ts`
