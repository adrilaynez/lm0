# features/lab/components/transformer

Interactive visualizer components for the Transformer chapter (`/lab/transformer`). All lazy-loaded by `TransformerNarrative.tsx` (~3500 lines — the most complex chapter).

## What this chapter covers

The Transformer chapter picks up where MLP left off: the MLP has a fundamental architectural limit — it treats all context positions equally, averaging them into a fixed vector. It can't selectively attend to what matters. This chapter introduces the attention mechanism that solves it.

Topics covered:
1. Why the MLP hits a wall (fixed context window, no position awareness)
2. The "wishlist" — what the ideal architecture would do
3. Self-attention: queries, keys, values
4. Scaled dot-product attention + softmax
5. Positional encoding (why order matters)
6. Multi-head attention
7. The full Transformer block
8. Training dynamics

## Component index

### Core attention mechanics
| Component | What it shows |
|---|---|
| `AttentionHeatmapViz` | Q·K attention scores as a heatmap |
| `QueryKeyMatchViz` | How a query "searches" through keys |
| `ValueCompletesViz` | How values are weighted and summed |
| `SoftmaxAttentionViz` | Softmax applied to raw attention scores |
| `SoftmaxReturnsViz` | What the softmax output means |
| `WhyQKMattersViz` | Why separate Q and K matrices are needed |

### Building intuition
| Component | What it shows |
|---|---|
| `WishlistCallbackViz` | The "wishlist" framing — what attention is trying to do |
| `SpotlightViz` | Attention as a spotlight on the sequence |
| `SoftRetrievalViz` | Attention as soft database lookup |
| `StaticVsDynamicViz` | Static MLP embeddings vs dynamic attention-based ones |
| `ContextualEmbeddingViz` | How the same word gets different representations in context |

### Architecture
| Component | What it shows |
|---|---|
| `TransformerBlockExplorerViz` | Full Transformer block: attention → LayerNorm → FFN |
| `MultiHeadAttentionViz` | Multiple attention heads, each learning different patterns |
| `PositionalEncodingViz` | Sinusoidal encoding — why and how |
| `AttentionPatternGalleryViz` | Gallery of patterns learned by different heads |

### Training
| Component | What it shows |
|---|---|
| `TrainingDashboardViz` | Live training metrics |
| `TrainingTimelapseViz` | How attention patterns evolve during training |
| `TrainingEfficiencyViz` | Parallel training vs sequential (why Transformers scale) |

### Comparison with MLP
| Component | What it shows |
|---|---|
| `SequentialVsParallelViz` | RNN sequential vs Transformer parallel processing |
| `MLPvsTransformerViz` | Side-by-side architecture comparison |
| `BigModelLimitationViz` | Where the MLP fails that Transformer fixes |

### Other
| Component | What it shows |
|---|---|
| `WaveFingerprintViz` | Positional encoding as wave fingerprints |
| `TelephoneGameViz` | How information degrades without residual connections |
| `ShuffleDisasterViz` | What happens when you remove positional encoding |
