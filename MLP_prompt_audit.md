# MLP Chapter — Prompt Audit

## Purpose

This document verifies that every improvement idea is correctly assigned to a prompt, confirms the prompt responsible, analyzes prompt selection optimality, and ensures no idea is lost.
## Prompt 1 — §03 "Inside the Eyes" Restructure
**Model:** Opus Thinking | **Credits:** ~8 | **Risk:** Medium

### Changes

| # | Idea | Action | Files |
|---|------|--------|-------|
| 3 | Embedding bottleneck visible | Move `EmbeddingBottleneckExplorer` out of panel into main flow | MLPNarrative.tsx, en.ts, es.ts |
| 4 | Category Analyzer with advanced data | Rewrite `EmbeddingCategoryAnalyzer` to compare 4 embedding dims (2D, 10D, 32D, 128D) using new `/api/v1/mlp/advanced-embeddings` | EmbeddingCategoryAnalyzer.tsx, lmLabClient.ts |
| 5 | Quality Comparison → panel | Move `EmbeddingQualityComparison` into TrainingChallengePanel | MLPNarrative.tsx, en.ts, es.ts |
| 6 | Word embedding analogy | Create `WordEmbeddingAnalogyDemo` (illustrative, clearly labeled) | NEW: WordEmbeddingAnalogyDemo.tsx |
| 1 | Arithmetic panel | Verify current panel state — should be fine | — |

### Execution Order
1. Verify BP-2 endpoint works (or add mock fallback)
2. Rewrite EmbeddingCategoryAnalyzer
3. Move bottleneck out of panel
4. Move quality comparison into panel
5. Create WordEmbeddingAnalogyDemo
6. Update narrative JSX + i18n
7. Test

### New §03 Flow
```
Lead → Training timelapse recap → 
pCategoryIntro → EmbeddingCategoryAnalyzer (4-model comparison) → 
pBottleneckIntro → EmbeddingBottleneckExplorer (main flow, real data) →
pDistanceIntro → EmbeddingDistanceCalculator →
pPredictionIntro → PredictionChallengeVisualizer →
pAnalogyIntro → WordEmbeddingAnalogyDemo →
KeyTakeaway →
Panel: EmbeddingQualityComparison →
Panel: EmbeddingArithmeticPlayground
```

### Files Modified
- `src/components/lab/MLPNarrative.tsx` — §03 restructure
- `src/components/lab/mlp/EmbeddingCategoryAnalyzer.tsx` — rewrite
- `src/components/lab/mlp/WordEmbeddingAnalogyDemo.tsx` — NEW
- `src/i18n/en.ts` — s03 keys
- `src/i18n/es.ts` — s03 keys
- `src/lib/lmLabClient.ts` — add fetchAdvancedEmbeddings

---

## Prompt 2 — §04 "Inside the Brain" Cleanup
**Model:** Sonnet 4 Thinking | **Credits:** ~5 | **Risk:** Low

### Changes

| # | Idea | Action | Files |
|---|------|--------|-------|
| 7 | Pipeline auto-select | Add default config selection in MLPPipelineVisualizer | MLPPipelineVisualizer.tsx |
| 8 | Improve softmax step | Add "why" labels to each step | SoftmaxStepVisualizer.tsx |
| 9 | Neuron data disclaimer | Add "illustrative" banner to NeuronActivationExplorer | NeuronActivationExplorer.tsx, en.ts, es.ts |
| 10 | Polysemanticity disclaimer | Add "illustrative" banner to PolysemanticitySplitDemo | PolysemanticitySplitDemo.tsx |
| 11 | Remove SAE + ActMax panels | Delete both TrainingChallengePanels from §04 | MLPNarrative.tsx |

### Files Modified
- `src/components/lab/MLPNarrative.tsx` — remove 2 panels
- `src/components/lab/mlp/MLPPipelineVisualizer.tsx` — auto-select
- `src/components/lab/mlp/SoftmaxStepVisualizer.tsx` — add "why" labels
- `src/components/lab/mlp/NeuronActivationExplorer.tsx` — disclaimer
- `src/components/lab/mlp/PolysemanticitySplitDemo.tsx` — disclaimer
- `src/i18n/en.ts` — disclaimer keys
- `src/i18n/es.ts` — disclaimer keys

---

---

## Master Tracking Matrix

| Idea # | Summary | Prompt | Status | Notes |
|--------|---------|--------|--------|-------|
| 1 | Embedding Arithmetic → panel | P1 | VERIFY | Already in panel, just confirm |
| 2 | Improve panel appearance | P8 | IMPLEMENT | TrainingChallengePanel redesign |
| 3 | Embedding Bottleneck visible | P1 | IMPLEMENT | Move out of panel into §03 main flow |
| 4 | Category Analyzer + mlp_advanced | P1 | IMPLEMENT | Rewrite with 4-model comparison |
| 5 | Quality Comparison → panel | P1 | IMPLEMENT | Move into panel |
| 6 | Word embedding analogy demo | P1 | IMPLEMENT | New illustrative component |
| 7 | Pipeline auto-select model | P2 | IMPLEMENT | Default config if none selected |
| 8 | Improve softmax step labels | P2 | IMPLEMENT | Add "why" annotations |
| 9 | Neuron data disclaimer | P2 | IMPLEMENT | "Illustrative" banner |
| 10 | Polysemanticity real data | P2 | PARTIAL | Add disclaimer now, defer real data |
| 11 | Remove SAE + ActMax panels | P2 | IMPLEMENT | Delete from §04 |
| 12 | Network shape + backend | P3 | IMPLEMENT | Rewrite with real data |
| 13 | Depth comparison + dead neurons | P3 | IMPLEMENT | Add dead neuron stats |
| 14 | Remove Depth×LR heatmap | P3 | IMPLEMENT | Delete from §05 |
| 15 | "WHAT is happening?" bridge | P3 | IMPLEMENT | Narrative text |
| 16 | Dead neuron visualizer | P3 | IMPLEMENT | New component |
| 17 | Activation battle audit | P3 | IMPLEMENT | Verify backend integration |
| 18 | Backend failure audit §05 | P3 | IMPLEMENT | Test all visualizers |
| 19 | Start §06 with failed curves | P4 | IMPLEMENT | Recap visualization |
| 20 | Worse-than-random real data | P4 | IMPLEMENT | Rewrite with depth-comparison data |
| 21 | Backprop calculator + tanh | P4 | IMPLEMENT | Add derivative visualization |
| 22 | Gradient flow labels | P4 | IMPLEMENT | Annotations + tooltips |
| 23 | Kaiming visual improvement | P5 | IMPLEMENT | Side-by-side comparison |
| 24 | Variance per layer labels | P5 | IMPLEMENT | Better annotations |
| 25 | Bad init → dead neurons text | P4 | IMPLEMENT | Narrative paragraph |
| 26 | BatchNorm discovery approach | P5 | IMPLEMENT | Restructure narrative |
| 27 | BatchNorm effect visualizer | P5 | IMPLEMENT | Improve visuals |
| 28 | Hide BatchNorm formula | P5 | IMPLEMENT | Move to panel |
| 29 | Move BN insights to main | P5 | IMPLEMENT | Panel → narrative |
| 30 | BN regularization explanation | P5 | IMPLEMENT | Narrative paragraph |
| 31 | Residual "correcting" framing | P5 | IMPLEMENT | Rewrite intro text |
| 32 | ResNet explanation f(x)+x | P5 | IMPLEMENT | Better explanation |
| 33 | Gradient highway animation | P5 | IMPLEMENT | Improve animation |
| 34 | Highway bypass labels | P5 | IMPLEMENT | Better labels |
| 35 | Replace gradient formula | P5 | IMPLEMENT | Visual explanation |
| 36 | Simplify residual panel | P5 | IMPLEMENT | Remove projection details |
| 37 | Architecture + BatchNorm | P5 | IMPLEMENT | Combined with 38 |
| 38 | Architecture + Residual | P5 | IMPLEMENT | New StabilizedArchitectureDiagram |
| 39 | BN→LayerNorm hidden panel | P5 | IMPLEMENT | End of §07 |
| 40 | Fix Stability Grid | P5 | IMPLEMENT | Audit data mapping |
| 41 | Improve Redemption | P5 | IMPLEMENT | Better model selection |
| 42 | Fix Scale Stability graphs | P5 | IMPLEMENT | Debug data loading |
| 43 | Remove EmbDim from §08 | P6 | IMPLEMENT | Delete (covered in §03) |
| 44 | Rewrite §08 entirely | P6 | IMPLEMENT | New narrative arc |
| 45 | Remove Hidden Size Explorer | P6 | IMPLEMENT | Delete (covered by Explorer) |
| 46 | Move dropout position | P6 | IMPLEMENT | After Explorer |
| 47 | Reduce §08 panels to 2 | P6 | IMPLEMENT | Keep Temp + Scatter only |
| 48 | Fix HyperparameterExplorer | P6 | IMPLEMENT | Debug text gen + invalid configs |
| 49 | Parameter Wall visualizer | P6 | IMPLEMENT | New component |
| 50 | Data size → panel | P7 | IMPLEMENT | Move to hidden section |
| 51 | Improve evolution ending | P7 | IMPLEMENT | Dramatic framing + metrics |
| 52 | ChatGPT connection text | P7 | IMPLEMENT | Narrative paragraph |
| 53 | Reduce §09 clutter | P7 | IMPLEMENT | Remove/consolidate visualizers |

### Audit Findings (from analysis document)

| ID | Finding | Prompt | Status |
|----|---------|--------|--------|
| A1 | 9 sections too many | — | DEFERRED | Keep 9, improve transitions |
| A2 | Mock data prevalence | P8 | IMPLEMENT | Add disclaimers everywhere |
| A3 | Backend data underutilized | BP | IMPLEMENT | New endpoints |
| A4 | Missing LR visual | P6 | IMPLEMENT | Inline or brief visualizer |
| A5 | Missing training progress §01 | — | DEFERRED | Future enhancement |
| A6 | §07 too long | P5 | IMPLEMENT | Combine architecture diagrams |
| A7 | Missing recap before §09 | P7 | IMPLEMENT | Victory lap text |
| A8 | i18n completeness | P8 | IMPLEMENT | Final verification |

---

## Prompt Selection Analysis

### P1 — §03 Restructure → **Opus Thinking**
**Justification:** High complexity. Multiple component rewrites, new component creation, API integration, narrative restructuring. Requires understanding embedding pedagogy deeply.
**Alternative:** Sonnet 4 Thinking could handle this but Opus reduces risk of subtle pedagogical errors in the analogy demo and multi-model comparison.
**Optimal?** YES — the embedding section is pedagogically critical.

### P2 — §04 Cleanup → **Sonnet 4 Thinking**
**Justification:** Low-medium complexity. Mostly small fixes (disclaimers, auto-select, panel removal). No new components.
**Alternative:** Sonnet 4 non-thinking could handle most changes but the softmax "why" labels benefit from reasoning.
**Optimal?** YES — straightforward enough for Sonnet but benefits from thinking for UX decisions.

### P3 — §05 Network Shape + Depth → **Sonnet 4 Thinking**
**Justification:** Medium complexity. One new component (DeadNeuronVisualizer), one major rewrite (NetworkShapeComparison), multiple improvements. Backend data integration.
**Alternative:** Opus would be safer for the NetworkShapeComparison rewrite since it must parse complex backend data correctly.
**Risk mitigation:** Strong fallback data in existing component reduces risk.
**Optimal?** YES — good balance of cost and capability.

### P4 — §06 Improvements → **Sonnet 4**
**Justification:** Low complexity. Mostly narrative text additions and visualizer improvements. No new components.
**Alternative:** Could use even cheaper model, but Sonnet 4 ensures quality i18n translations.
**Optimal?** YES — simple changes, fast execution.

### P5 — §07 Restructure → **Opus Thinking**
**Justification:** HIGHEST complexity prompt. 20 ideas touching 10+ files. New component (StabilizedArchitectureDiagram), narrative restructuring, bug fixes, discovery pedagogy redesign.
**Alternative:** NONE — this is too complex for Sonnet. Could split into P5a + P5b but that adds prompt overhead.
**Risk:** §07 currently has 12 visualizers + 2 panels. Restructuring all at once requires deep understanding of the section's flow.
**Split consideration:** If P5 fails or is too large:
- P5a: Ideas 23-30 (init + BatchNorm) — Opus Thinking (~5 credits)
- P5b: Ideas 31-42 (residual + grid + fixes) — Sonnet 4 Thinking (~4 credits)
- Total if split: ~9 credits vs ~8 as single prompt
**Optimal?** YES if kept as one prompt. MONITOR for complexity overflow.

### P6 — §08 Rewrite → **Sonnet 4 Thinking**
**Justification:** Medium-high complexity. Section rewrite with new component (ParameterWallVisualizer), bug fixes in HyperparameterExplorer.
**Alternative:** Opus would be safer for the HyperparameterExplorer debugging (970-line component).
**Risk mitigation:** P6 can request targeted debugging information if Explorer bugs are deep.
**Optimal?** ACCEPTABLE — may need upgrade to Opus if Explorer bugs are complex.

### P7 — §09 Cleanup → **Sonnet 4**
**Justification:** Low complexity. Mostly reorganization (moving visualizers to panels, adding text, removing components).
**Alternative:** Could use cheaper model.
**Optimal?** YES — simple and fast.

### P8 — Polish → **Sonnet 4**
**Justification:** Low complexity. CSS/visual improvements, verification, build testing.
**Optimal?** YES.

---

## Credit Analysis

| Prompt | Model | Estimated Credits | Ideas Covered |
|--------|-------|-------------------|---------------|
| BP | Manual/Sonnet 4 | 3 | A3 |
| P1 | Opus Thinking | 8 | 1, 3, 4, 5, 6 |
| P2 | Sonnet 4 Thinking | 5 | 7, 8, 9, 10, 11 |
| P3 | Sonnet 4 Thinking | 6 | 12, 13, 14, 15, 16, 17, 18 |
| P4 | Sonnet 4 | 4 | 19, 20, 21, 22, 25 |
| P5 | Opus Thinking | 8 | 23, 24, 26-42 (20 ideas!) |
| P6 | Sonnet 4 Thinking | 6 | 43-49, A4 |
| P7 | Sonnet 4 | 4 | 50-53, A7 |
| P8 | Sonnet 4 | 4 | 2, A2, A8 |
| **Total** | | **~48** | **53 ideas + 8 audit** |

### Optimization Opportunities

1. **Merge P4 into P3:** §05→§06 transition is the natural narrative flow. Saves 1 prompt but increases P3 complexity significantly.
   - **Verdict:** Keep separate — P3 already has 7 ideas.

2. **Merge P7 into P6:** §08→§09 are sequential. Could save 1 prompt.
   - **Verdict:** Possible if P6 finishes under budget. Monitor.

3. **Split P5:** If §07 is too complex, split into init+BN and residual+grid.
   - **Verdict:** Have contingency plan ready. Try as single prompt first.

4. **Downgrade P1 to Sonnet 4 Thinking:** The embedding work is important but Sonnet 4 Thinking could handle it.
   - **Verdict:** Risky — embedding pedagogy is the foundation. Keep Opus.

### Minimum viable prompt count: 7 (merge P4→P3 or P7→P6)
### Maximum safety prompt count: 10 (split P5 + extra debugging)
### Recommended: 9 prompts (BP + P1-P8)

---

## Verification Checklist (Post-Implementation)

### Per-Section Verification
- [ ] §03: EmbeddingCategoryAnalyzer shows 4 models from mlp_advanced
- [ ] §03: EmbeddingBottleneckExplorer is in main flow, not panel
- [ ] §03: EmbeddingQualityComparison is in panel
- [ ] §03: WordEmbeddingAnalogyDemo renders with "illustrative" label
- [ ] §04: SAE and ActMax panels removed
- [ ] §04: NeuronActivationExplorer has "illustrative" banner
- [ ] §04: MLPPipelineVisualizer auto-selects config
- [ ] §05: NetworkShapeComparison uses backend data with fallback
- [ ] §05: DepthLRInteractionHeatmap removed
- [ ] §05: DeadNeuronVisualizer renders with real data
- [ ] §06: Opens with failed training curve recap
- [ ] §06: WorseThanRandomVisualizer uses real depth-comparison data
- [ ] §07: BatchNorm presented as discovery (drift → question → solution)
- [ ] §07: BatchNormStepByStep in panel, not main flow
- [ ] §07: StabilizedArchitectureDiagram shows BN + Residual positions
- [ ] §07: StabilityTechniqueGrid renders correctly
- [ ] §07: ScaleStabilityExperiment graphs load
- [ ] §08: EmbeddingDimensionComparison removed
- [ ] §08: HiddenSizeExplorer removed
- [ ] §08: ParameterWallVisualizer renders with 108-model data
- [ ] §08: HyperparameterExplorer text generation works
- [ ] §08: Only 2 panels remain (Temperature + Scatter)
- [ ] §09: DataSizeExperiment in panel
- [ ] §09: BigModelLimitationViz removed from main flow
- [ ] §09: ChatGPT connection paragraph present
- [ ] §09: Victory recap before limitations

### Global Verification
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] All mock-data visualizers have "illustrative" indicator
- [ ] en.ts and es.ts have identical key structures
- [ ] All lazy imports match actual component usage
- [ ] No orphaned component files
- [ ] All TrainingChallengePanels have improved collapsed style
- [ ] Backend endpoints respond correctly when running
- [ ] All visualizers render with fallback when backend is down

---

## Idea Coverage Summary

- **53 ideas from original list:** All assigned to prompts
- **8 audit findings from analysis:** All assigned (6 implemented, 2 deferred)
- **0 ideas ignored or lost**
- **2 ideas deferred with rationale:** A1 (section count), A5 (§01 training progress)
- **1 idea partially implemented:** Idea 10 (disclaimer now, real data later)

---

## Prompt Execution Strategy

### Before starting each prompt:
1. Read the execution plan section for that prompt
2. Verify prerequisites are complete (dependency graph)
3. Confirm backend endpoints are running (for data-dependent prompts)

### After each prompt:
1. Run `npx tsc --noEmit`
2. Check browser rendering for affected sections
3. Update this audit's verification checklist
4. Note any issues for P8 (polish prompt)

### If a prompt fails:
1. Check if the failure is in a component rewrite → retry with more context
2. Check if the failure is in data parsing → debug backend first
3. Check if the prompt is too large → split per the contingency plan
4. Never skip a broken visualizer — always fix or add fallback
