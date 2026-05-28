# features/lab/components/mlp

Interactive visualizer components for the MLP chapter (`/lab/mlp`). All of these are lazy-loaded by `MLPNarrative.tsx`.

The MLP chapter is the most technically dense in the lab. It covers embeddings, forward pass mechanics, depth problems, and three stability techniques (Kaiming init, BatchNorm, Residual connections).

## Chapter structure

The narrative has 8 sections (§01–§08):

| Section | Topic | Key components |
|---|---|---|
| §01 | The input problem (one-hot encoding) | `OneHotVisualizer`, `ContextConcatenationExplorer` |
| §02 | Embeddings — giving the model eyes | `EmbeddingSpaceVisualizer`, `CharacterFeatureScoring`, `EmbeddingTrainingTimelapse` |
| §02b | Embedding quality + comparison | `EmbeddingQualityComparison`, `EmbeddingBottleneckExplorer`, `WordEmbeddingAnalogyDemo` |
| §03 | The hidden layer — bending space | `MLPForwardPassAnimator`, `NgramVsMlpBrain`, `PolysemanticitySplitDemo` |
| §04 | Going deep — depth failures | `ShallowVsDeepComparison`, `DeadNeuronVisualizer`, `ActivationHistogramVisualizer` |
| §05 | Fixing depth — stability techniques | `StabilityTechniqueGrid`, `BatchNormDiscoveryVisualizer`, `ResidualBNArchitectureVisualizer` |
| §06 | Hyperparameter tuning | `MLPHyperparameterExplorer`, `OvertrainingTimelineViz` |
| §07 | MLP limits + what comes next | `BigModelLimitationViz`, `ParameterWallVisualizer` |

## Most important components

### Training & comparison
- **`MLPHyperparameterExplorer`** (967 lines) — The centerpiece. Train models with configurable embedding dim, hidden size, learning rate, dropout, context window. Compare multiple runs with live loss curves. Connects to real backend.
- **`TrainingRace4gramVsMLP`** (648 lines) — Races a 4-gram counting model against an MLP with the same data. The moment the user sees the N-gram lose.
- **`TripleModelRace`** (574 lines) — Three MLP configurations competing: small/medium/large. Shows why bigger isn't always better.
- **`SingleExampleTrainer`** (538 lines) — Train on a single example step-by-step. Makes gradient descent tangible.

### Embeddings
- **`BackpropEmbeddingVisualizer`** (633 lines) — Animated visualization of embedding vectors reorganizing during training. Random noise → meaningful clusters.
- **`EmbeddingBottleneckExplorer`** (507 lines) — Compare 2D, 10D, 32D, 128D embedding spaces. Why more dimensions help up to a point.
- **`EmbeddingCategoryAnalyzer`** (486 lines) — Shows that the network discovers vowels/consonants/punctuation clusters without being told about them.
- **`WordEmbeddingAnalogyDemo`** (539 lines) — Vector arithmetic: king − man + woman ≈ queen. With the actual learned character vectors.

### Forward pass mechanics
- **`MLPPipelineVisualizer`** (546 lines) — Animated forward pass: embedding lookup → concatenation → hidden layer → softmax.
- **`SoftmaxStepVisualizer`** (500 lines) — Step through softmax: raw logits → exponentiate → normalize → probabilities.
- **`MLPForwardPassAnimator`** — Full forward pass with activations highlighted per layer.

### Stability techniques
- **`StabilityTechniqueGrid`** (492 lines) — Three toggles: Kaiming init ON/OFF, BatchNorm ON/OFF, Residual ON/OFF. Watch what each one fixes.
- **`ResidualBNArchitectureVisualizer`** (491 lines) — Architecture diagram showing how residual connections + BN interact.
- **`BatchNormDiscoveryVisualizer`** — The "discovery" of BatchNorm told as a problem-solving story.
- **`VarianceExplosionVisualizer`** — What happens to activation variance as you go deeper without Kaiming.

### Polysemanticity
- **`PolysemanticitySplitDemo`** — Shows that neurons respond to multiple unrelated patterns. One neuron fires for both vowel pairs AND common digraphs.
- **`NeuronAblationExplorer`** — Turn off individual neurons and see what the model loses.
