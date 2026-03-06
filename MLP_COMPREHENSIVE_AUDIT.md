# MLP Narrative — Comprehensive Audit

> Generated 2026-03-06. Covers: MLPNarrative.tsx (1581 lines), 124 component files,  
> en.ts + es.ts i18n keys, NeuralNetworkNarrative.tsx §09 bridge, backend API endpoints.

---

## 1. Structural Overview

### 1.1 Section Map

| § | ID | Title | Visualizers (main) | Panels | Est. scroll |
|---|-----|-------|-------|--------|-------------|
| 01 | mlp-01 | Meet the Monster | 7 | 0 | Long |
| 02 | mlp-02 | Teaching It to See | 8 | 2 | Very long |
| 03 | mlp-03 | Inside the Eyes | 9 | 3 (incl. WeightTying) | Very long |
| 04 | mlp-04 | Inside the Brain | 6 | 0 | Medium |
| 05 | mlp-05 | Going Big | 7 | 1 | Long |
| 06 | mlp-06 | When It Breaks | 6 | 0 | Medium |
| 07 | mlp-07 | Taming the Beast | 14 | 4 | **Extremely long** |
| 08 | mlp-08 | The Perfect Recipe | 8 | 2 | Long |
| 09 | mlp-09 | The Monster That Can't See | 8 + inline SVG | 1 | Long |
| — | — | **TOTAL** | **73 main + panels** | **13** | — |

### 1.2 Component Inventory

- **124 .tsx files** in `src/components/lab/mlp/`
- **87 used in MLPNarrative** (lazy imports + JSX)
- **2 used in NeuralNetworkNarrative** (SquaredVsCrossEntropy, CrossEntropyVisualizer)
- **1 used inside other components** (EmbeddingSpaceVisualizer → inside MLPHyperparameterExplorer)
- **~34 orphaned** — not imported anywhere in the narrative

---

## 2. Critical Issues

### 2.1 Orphaned Import — `HiddenLayerXORDemo`
- **Imported** at line 42 of MLPNarrative.tsx but **never used in JSX**.
- Originally from §03/§04 restructuring. Should be removed or repurposed.
- **Fix:** Remove lazy import line, or add it to §04 "Why Hidden Layers Exist" section where it's pedagogically relevant.

### 2.2 Cross-Section i18n Key Naming
Several §04 JSX elements reference **`s03.*`** i18n keys:
- `s03.figLabelForwardPass` / `s03.figHintForwardPass` — used in §04
- `s03.pPipelineIntro` — used in §04
- `s03.figLabelTrigram` / `s03.figHintTrigram` — used in §04
- `s03.pHiddenLayerSecret` — used in §04
- `s03.figLabelNeurons` / `s03.figHintNeurons` — used in §04
- `s03.pNeuronInsight` — used in §04
- `s03.pChatGPTCheck1` / `s03.chatGPTCheck1Sub` — used in §04

**Impact:** Not a runtime bug (keys exist), but creates confusion during maintenance. These should be migrated to `s04.*` namespace.

### 2.3 Missing FigureWrapper on `DistanceConceptVisualizer`
At line ~631, DistanceConceptVisualizer renders inside `<LazySection>` without a `<FigureWrapper>`, unlike every other visualizer. This means no label, no hint, and no consistent card styling.

### 2.4 §07 Length Problem
§07 "Taming the Beast" has **14 main visualizers + 4 hidden panels** — nearly double any other section. This creates:
- **Scroll fatigue** — user may abandon before reaching Residual Connections
- **Cognitive overload** — three major topics (Kaiming, BatchNorm, Residuals) compete for attention
- **Recommendation:** Split into §07a "Normalization" (Kaiming + BN) and §07b "Residual Connections" — or move Kaiming init to end of §06 as a natural "here's the first fix" closure.

---

## 3. Orphaned Components (34 files)

These files exist in `src/components/lab/mlp/` but are **not imported or used** in the narrative or any other file:

### Potentially Reusable (good pedagogical value)
| Component | Purpose | Suggested Reuse |
|-----------|---------|-----------------|
| `ModelEvolutionComparison.tsx` | Side-by-side model evolution | §09 "look how far we've come" |
| `DepthGenerationGallery.tsx` | Text samples at different depths | §05 or §07 panel |
| `LearningRateScheduleExplorer.tsx` | LR schedule visualization | §08 panel alongside LRSweepVisualizer |
| `SoftmaxTemperatureVisualizer.tsx` | Temperature parameter | §04 panel after SoftmaxStepVisualizer |
| `LayerActivationExplorer.tsx` | Per-layer activation patterns | §05 or §06 |
| `SnapshotDiagnostics.tsx` | Training snapshot analysis | §08 panel |
| `GradientProductSimulator.tsx` | Interactive gradient chain | §06 panel |
| `ResidualConnectionIntuition.tsx` | Residual concept intro | §07 — could replace or supplement ResidualDiscovery |
| `PositionWeightShareDemo.tsx` | Position sensitivity proof | §09 limitation 2 enhancement |
| `NgramVsMlpParameterComparison.tsx` | Parameter count comparison | §01 or §02 |

### Likely Superseded (can be deleted)
| Component | Superseded By |
|-----------|---------------|
| `ContextVsNoContextDemo.tsx` | ContextWindowVisualizer |
| `ContextWindowExperiment.tsx` | ContextWindowVisualizer + LongRangeDependencyDemo |
| `DeepModelFailureDemo.tsx` | DeepModelRedemptionDemo |
| `DepthLRInteractionHeatmap.tsx` | Explicitly removed per code comment |
| `EmbeddingTrainingEvolution.tsx` | EmbeddingTrainingTimelapse (comment says "removed from §02") |
| `JourneyBreadcrumb.tsx` | TrainingRace4gramVsMLP (replaced per restructure) |
| `ResidualGradientComparison.tsx` | ResidualGradientHighway (removed per restructure) |
| `MLPLimitationPlayground.tsx` | §09 individual limitation visualizers |
| `MLPGuidedExperiments.tsx` | MLPHyperparameterExplorer |
| `MLPArchitectureDiagram.tsx` | MLPNetworkDiagram |
| `OneHotDimensionalityVisual.tsx` | DimensionalityScaleVisualizer |
| `GradientVanishingSlider.tsx` | BackpropVanishingCalculator |
| `EmbeddingDimVsLoss.tsx` | EmbeddingBottleneckExplorer |
| `EmbeddingQualityComparison.tsx` | EmbeddingCategoryAnalyzer |
| `EmbeddingDimensionComparison.tsx` | EmbeddingBottleneckExplorer |
| `LossIntuitionVisualizer.tsx` | WorseThanRandomVisualizer |
| `CrossConfigScatterPlot.tsx` | MLPHyperparameterExplorer |
| `GeneralizationGapHeatmap.tsx` | MLPHyperparameterExplorer |
| `HiddenSizeExplorer.tsx` | NetworkShapeComparison |
| `DepthExplorer.tsx` | RealDepthComparisonTrainer |
| `NearestNeighborExplorer.tsx` | EmbeddingDistanceCalculator |
| `TrainingProgressRace.tsx` | TrainingRace4gramVsMLP |
| `ParameterSharingMotivation.tsx` | PositionSensitivityVisualizer |
| `MLPNonLinearityVisualizer.tsx` | TanhSaturationDemo + ActivationBattleVisualizer |

### Used Elsewhere / Utility
| Component | Usage |
|-----------|-------|
| `EmbeddingSpaceVisualizer.tsx` | Inside MLPHyperparameterExplorer (§08) |
| `PedagogicalEmbeddingVisualizer.tsx` | Possibly used in free-lab mode |
| `CompareMode.tsx` | Utility component |
| `ThinkFirst.tsx` | Utility component |
| `SquaredVsCrossEntropy.tsx` | NeuralNetworkNarrative §08 |
| `CrossEntropyVisualizer.tsx` | NeuralNetworkNarrative §08 |

---

## 4. Pedagogical Flow Analysis

### 4.1 Narrative Arc

```
§01 HOOK     → "Meet the Monster" — shock: 4-gram beats MLP, why?
§02 PROBLEM  → "Teaching It to See" — embeddings solve blindness
§03 EVIDENCE → "Inside the Eyes" — what embeddings actually learned
§04 MECHANICS→ "Inside the Brain" — forward pass, neurons, polysemanticity
§05 AMBITION → "Going Big" — depth promise → depth failure (dead neurons)
§06 DIAGNOSIS→ "When It Breaks" — init, gradients, vanishing
§07 SOLUTION → "Taming the Beast" — Kaiming, BN, Residuals, Redemption
§08 MASTERY  → "The Perfect Recipe" — hyperparameters, overfitting, dropout
§09 LIMITS   → "The Monster That Can't See" — 4 limitations → Transformer tease
```

**Strengths:**
- ✅ Excellent dramatic arc: hook → problem → solution → mastery → limits
- ✅ Monster metaphor provides emotional continuity
- ✅ MonsterInterludes between sections are effective perspective shifts
- ✅ Discovery-based approach (user finds the problem before the solution)
- ✅ Hidden panels keep optional depth without breaking flow
- ✅ Real backend data (loss curves, embeddings) adds authenticity

**Weaknesses:**
- ❌ §03 and §04 feel like a single section split awkwardly — §03 ends with embeddings, §04 starts with forward pass which is really a continuation
- ❌ §05→§06 transition is abrupt — "Going Big" ends with dead neurons, §06 restarts diagnosis from initialization which feels like a step backward
- ❌ §07 is exhaustingly long (see §2.4 above)
- ❌ §08 lacks emotional stakes — after the dramatic §07 redemption, hyperparameter tuning feels anticlimactic
- ❌ §09 doesn't reference NN §09 backward — user coming from NN narrative may not feel the connection

### 4.2 Section-by-Section Recommendations

#### §01 — Meet the Monster ✅ Strong
- Race visualizer is an excellent hook
- SingleExampleTrainer gives hands-on immediately
- Similarity blindness discovery is effective
- **Minor:** Could add a "bookmark" for the 4-gram loss to reference in §09 when showing progress

#### §02 — Teaching It to See ✅ Strong
- Feature explorer → scoring → manual builder → lookup flow is superb
- Triple race proves embeddings matter empirically
- **Gap:** No mention of how embedding dimension D is chosen (deferred to §03 bottleneck, but the question arises here)

#### §03 — Inside the Eyes ✅ Good (slightly long)
- EmbeddingTrainingTimelapse is a powerful "watch them learn" moment
- CategoryAnalyzer proves the clustering claim
- Word embedding analogy is clearly labeled as illustrative (good)
- **Issue:** DistanceConceptVisualizer lacks FigureWrapper (see §2.3)
- **Issue:** WeightTying panel now at end of §03 — thematically it belongs more with §04 (shared E and W matrices involve the hidden layer)

#### §04 — Inside the Brain ✅ Good
- ForwardPass → Pipeline → Softmax flow is clean
- Polysemanticity + Ablation give mechanistic interpretability exposure
- **Gap:** HiddenLayerXORDemo imported but never used — would strengthen the "Why Hidden Layers Exist" argument
- **Issue:** i18n keys from `s03.*` namespace (see §2.2)

#### §05 — Going Big ⚠️ Good but transition weak
- Depth motivation with real-world proof is effective
- Dead neuron reveal is dramatic
- Tanh saturation → histogram → cascade is a great detective flow
- **Issue:** Ends with "the network can never learn again" then `pEndBridge` — no emotional payoff. Needs a stronger "but there IS a solution" hook
- **Suggestion:** Add a "MonsterStatus" gradient text like: "The monster is broken. Can it be fixed?"

#### §06 — When It Breaks ⚠️ Solid but feels redundant with §05
- Initial loss catastrophe is compelling
- Gaussian init + sensitivity slider is interactive
- Backprop vanishing calculator is excellent pedagogy
- **Issue:** Overlaps with §05's dead neuron content. §05 showed symptoms, §06 shows causes — but the user may feel like retreading
- **Suggestion:** Tighten the bridge: "§05 showed WHAT breaks. Now let's find out WHY — the root cause is in the math."

#### §07 — Taming the Beast 🔴 Too long, needs splitting
- Individual components are excellent:
  - VarianceExplosion → KaimingScaling is a perfect problem→solution pair
  - BN discovery approach (drift → question → reveal) is top-tier
  - ResidualDiscovery → Highway → GradientHighway → BNArchitectureVisualizer flow is comprehensive
  - ResidualBNArchitectureVisualizer (NEW) shows full picture
- **Critical:** 14 visualizers + 4 panels is overwhelming
- **Recommendation A (preferred):** Split at the BNArchitectureVisualizer boundary:
  - §07 "Stabilization" → Kaiming + BatchNorm (8 viz + 2 panels)
  - §08 "The Highway" → Residuals + Stability Grid + Redemption (6 viz + 2 panels)
  - Renumber §08→§09, §09→§10
- **Recommendation B (minimal):** Move Kaiming (4 viz) to end of §06 as "first fix"

#### §08 — The Perfect Recipe ⚠️ Anticlimax risk
- HyperparameterAnatomy → Explorer → ParameterWall flow is informative
- Overfitting detective challenge is engaging
- LR intuition + sweep experiment provides hands-on
- **Issue:** After §07's dramatic redemption ("Monster tamed!"), tuning feels flat
- **Suggestion:** Reframe as "The Monster's Final Exam" — the monster must prove it can train well with the right recipe. Stakes: can we beat the 4-gram we lost to in §01?

#### §09 — The Monster That Can't See ✅ Strong but could be more connected
- BigModelLimitation → 4 specific limitations → Wishlist → Transformer tease is excellent structure
- Monster's closing monologue is emotionally powerful
- Generation gallery shows progress effectively
- **Gap 1:** No explicit callback to NN §09 — user who just finished NN chapter doesn't see the connection
- **Gap 2:** No comparison with the bigram/n-gram from chapters 1-2 showing measurable improvement
- **Gap 3:** The `pEvolutionIntro` i18n key exists but isn't used in JSX — the "model evolution" section was cut
- **Suggestion:** Add a brief "journey so far" panel showing: Bigram → N-gram → NN → MLP progression with loss numbers

---

## 5. i18n Analysis

### 5.1 Key Naming Consistency
- **Old style:** `p1`, `p2`, `p3`, `figLabel1`, `figLabel2` — opaque
- **New style:** `pMonsterIntro`, `pKaimingProblem`, `figLabelRace` — semantic
- **Mixed sections:** §02 and §03 still use old `p1`/`p2`/`p3` style extensively
- **Recommendation:** Migrate old-style keys to semantic names for maintainability

### 5.2 Missing/Unused i18n Keys
- `s09.p1` / `s09.figLabel1` / `s09.figHint1` — defined but not used in JSX
- `s09.pEvolutionIntro` — defined but not used in JSX
- `s09.pJourneyReflection` — defined but not used in JSX
- `s09.figLabelEvolution` / `s09.figHintEvolution` — defined but not used
- `s09.pMonsterClosureSub` — defined but not used
- `s09.pChapterComplete` — defined but not used
- `s09.calloutTitle` / `s09.calloutText` — defined but not used

### 5.3 ES ↔ EN Parity
Both files appear to be in sync for all active keys. No missing translations detected during review.

---

## 6. NN §09 → MLP §01 Bridge Analysis

### Current State
- **NN §09** ends with: "You've built the engine. Now let's build something massive with it." + 3 forward-looking questions about context, layers, and self-discovered representations
- **NN CTA** has an "MLP" button: "Next: Building a Language Model" with "Meet the monster. 👾"
- **MLP §01** starts with: "Meet the Monster" — architecture diagram → encoding → one-hot → concat → training step → race

### Gap
The NN chapter asks 3 questions. MLP §01 answers none of them explicitly:
1. "What if we fed 3/5/10 letters?" → MLP uses 3 (context_length=3) but doesn't call back to this question
2. "What if we stacked many layers?" → Deferred to §05, not mentioned in §01
3. "What if the network could invent its own way to describe each character?" → Embeddings in §02, not connected to NN's question

### Recommendation
Add a brief "Previously on…" callback in MLP §01 after the MonsterIntro, referencing the 3 questions from NN §09: "In the last chapter, we asked three questions. This chapter answers all of them — and discovers problems we never imagined."

---

## 7. New Visualizer Opportunities

### High Priority
| Visualizer | Section | Rationale |
|-----------|---------|-----------|
| **ModelJourneyTimeline** | §09 (or §01 callback) | Show Bigram → N-gram → NN → MLP progression with loss, params, generated text. The `pEvolutionIntro` text exists but the viz was cut. |
| **BN vs No-BN Training Race** | §07 | Side-by-side animated training: same architecture with/without BN. Loss curves diverge dramatically. Would be the "proof" after the theory. |
| **AttentionTeaser** | §09 ending | Expand the inline SVG attention lines into a proper interactive: user selects a word, sees attention weights to all other words. Bridges to Transformer chapter. |

### Medium Priority
| Visualizer | Section | Rationale |
|-----------|---------|-----------|
| **HiddenLayerXORDemo** (exists, unused) | §04 | Already imported. Add after `pWhyHiddenLayers` to prove XOR requires hidden layers. |
| **SoftmaxTemperature** (exists, unused) | §04 panel | Temperature parameter is important for generation — fits after SoftmaxStepVisualizer. |
| **LearningRateSchedule** (exists, unused) | §08 panel | Complements LRSweepVisualizer — shows warmup, cosine decay, etc. |
| **EmbeddingDim → Loss** curve | §03 | Show how loss changes with embedding dimension. Currently explained in text (bottleneck) but no curve. |

### Low Priority
| Visualizer | Section | Rationale |
|-----------|---------|-----------|
| **DepthGenerationGallery** (exists, unused) | §05 or §07 panel | Text quality at different depths. Fun but not critical. |
| **GradientProductSimulator** (exists, unused) | §06 panel | Interactive chain rule multiplication. Supplements BackpropVanishingCalculator. |

---

## 8. Performance Considerations

### 8.1 Bundle Size
- 87 lazy-loaded components per section
- Each uses `<Suspense>` with `<SectionSkeleton />`
- All wrapped in `<LazySection>` (intersection observer)
- **Status:** Well-optimized. No eager loading of heavy components.

### 8.2 API Calls
- Components that fetch from backend: ScaleStabilityExperiment, LRSweepVisualizer, DropoutExperimentViz, OvertrainingTimelineViz, WeightTyingVisualizer, TrainingRace4gramVsMLP, MLPHyperparameterExplorer (via useMLPGrid), BigModelLimitationViz, DataSizeExperiment
- All now use relative URLs (`/api/v1/mlp/...`) through Next.js proxy ✅
- All have fallback data for offline/error states ✅

### 8.3 Scroll Performance
- §07 with 14 visualizers may cause frame drops on low-end devices
- MonsterInterludes between sections provide natural "breath" points
- **Recommendation:** Consider virtualizing §07 if split is not implemented

---

## 9. Action Items (Prioritized)

### P0 — Bugs/Issues
1. ~~Fix orphaned `HiddenLayerXORDemo` import~~ → Either remove or add to §04 JSX
2. Fix missing `FigureWrapper` on `DistanceConceptVisualizer` in §03
3. Remove unused i18n keys from s09 (p1, figLabel1, pEvolutionIntro, etc.)

### P1 — Structural Improvements
4. Split §07 into two sections (Normalization + Residuals) OR move Kaiming to §06
5. Migrate §04 i18n keys from `s03.*` to `s04.*` namespace
6. Add "Previously on…" NN→MLP bridge in §01

### P2 — New Visualizers
7. Add HiddenLayerXORDemo to §04 (already exists)
8. Create ModelJourneyTimeline for §09
9. Create BN vs No-BN Training Race for §07
10. Expand §09 attention teaser into full interactive

### P3 — Polish
11. Migrate old-style i18n keys (p1/p2/p3) to semantic names in §02, §03
12. Add MonsterStatus text at end of §05: "The monster is broken. Can it be fixed?"
13. Reframe §08 as "Final Exam" with callback to §01 race
14. Clean up ~24 superseded component files
15. Add `pEvolutionIntro` + ModelEvolutionComparison back to §09

---

## 10. Summary

The MLP narrative is **excellent** — one of the best interactive ML educational resources I've seen. The monster metaphor, discovery-based approach, and real data integration are standout features. The main structural issue is **§07 length** (14+ visualizers covering 3 major topics). The NN→MLP bridge could be stronger. There are ~34 orphaned components (24 can be safely deleted, 10 could be reused). The i18n is comprehensive and bilingual but has some legacy naming inconsistencies and ~7 unused keys in s09.

**If I had to pick 3 changes that would have the biggest impact:**
1. Split §07 into two sections
2. Add "Previously on…" NN→MLP bridge to §01
3. Add HiddenLayerXORDemo to §04 + ModelJourneyTimeline to §09
