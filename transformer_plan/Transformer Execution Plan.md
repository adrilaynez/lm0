# Transformer Chapter — Master Execution Plan

The optimal strategy to implement 60 visualizers and 10 narrative sections.

---

## Why 3 Phases (Not 4+ or 2)

**3 phases balances** parallelism (within each phase) **with** dependency management (between phases).

- **Phase 1** establishes the narrative scaffold and the most important emotional beat (§03)
- **Phase 2** builds the mathematical engine — attention mechanism + multi-head + position — all of which depend on §03's intuition being established
-  **Phase 3** assembles everything, trains, generates, and closes

Each phase produces a working, demo-able chunk of the chapter. You can review and adjust after each phase before continuing.

---

## Phase Overview

| Phase | Sections | Visualizers | Prompts | Core goal |
|---|---|---|---|---|
| **1 — Foundation** | §01, §02, §03 | V01-V12 (12) | 6 | Narrative scaffold + attention intuition AHA! |
| **2 — Core Mechanism** | §04, §05, §06 | V13-V37 (25) | 8 | Attention math + multi-head + positional encoding |
| **3 — Architecture & Generation** | §07, §08, §09, §10 | V38-V60 (23) | 5 | Block assembly + full architecture + training + closure |
| **Total** | 10 sections | 60 visualizers | **19 prompts** | |

---

## Dependency Graph

```
Phase 1 ─────────────────────────────────────────────────────────
  P1.1 (scaffold + color) ──┐
  P1.2 (§01 narrative)  ────┤
  P1.3 (§01 V01-V04)   ────┤──→ P1.4 (§02 narr + V05-V07)
  P1.4 (§02 narr+viz)  ────┤
  P1.5 (§03 narrative)  ────┤──→ P1.6 (§03 V08-V12)
  P1.6 (§03 vizs)      ────┘

Phase 2 ─────────────────────────────────────────────────────────
  P2.1 (§04a narr+V13-V15) ─┐
  P2.2 (§04b narr+V16-V19) ─┤
  P2.3 (§04c-d narr+V20-V26) ┤──→ P2.4 (§05 narr + V27-V31)
  P2.4 (§05 narr+viz)  ─────┤
  P2.5 (§06 narrative)  ─────┤──→ P2.6 (§06 V32-V37)
  P2.6 (§06 vizs)      ─────┤
  P2.7 (V26 flagship)  ─────┤
  P2.8 (integration)   ─────┘

Phase 3 ─────────────────────────────────────────────────────────
  P3.1 (§07 narr+V38-V45) ──┐
  P3.2 (§08+§09 narr+V46-V55) ┤
  P3.3 (V54 flagship gen) ──┤
  P3.4 (§10 narr+V56-V60) ──┤
  P3.5 (polish+integration) ─┘
```

---

## Critical Path

The most important prompts (if they go wrong, everything is delayed):

1. **P1.1** — Scaffold. Wrong structure here means every subsequent prompt adds to the wrong foundation.
2. **P1.5** — §03 narrative (AHA moment). This is the emotional center of the chapter. If the voice is wrong, nothing feels right.
3. **P2.3** — V20-V26 (attention pipeline). These 7 visualizers form the core educational pipeline. V26 is the flagship.
4. **P3.1** — §07 Block Builder (V42). The drag-and-drop assembly is the most interaction-heavy visualizer.

---

## Model Selection Philosophy

| Task type | Best model | Why |
|---|---|---|
| **Narrative voice** (emotional, discovery-based, specific tone) | Opus Thinking | Only model that can maintain the discovery pedagogy, emotional beats, and monster metaphor across long narrative sections. Must nail the voice on first try. |
| **Complex visualizers** (multi-state, animated, interactive pipeline) | Opus | Deep understanding of React patterns, state management, animation sequences. |
| **Medium visualizers** (clear specs, moderate interactivity) | Sonnet 4.6 Thinking | Good enough for well-defined components with clear inputs/outputs. |
| **Simple visualizers** (static diagrams, toggles, callbacks) | Sonnet 4.5 Thinking | Low risk, clear specs, mostly display logic. |
| **Integration/wiring** (connecting components, routing, imports) | Sonnet 4.5 | Mechanical, well-defined, low reasoning. |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Narrative voice inconsistency | HIGH | P1.5 and all narrative prompts use Opus Thinking with full MLP chapter excerpts as reference. |
| V26 (flagship attention head) too complex | HIGH | Dedicated prompt (P2.7) with full specs. If it fails, simplify to step-by-step instead of continuous animation. |
| V42 (Block Builder drag-and-drop) breaks | MED | Use proven library (@dnd-kit). Fallback: ordered buttons instead of drag-drop. |
| Color system needs extending | LOW | P1.1 handles this as first step. One-line change to `narrative-primitives.tsx`. |
| Chapter too long (54 min) | MED | Use `TrainingChallengePanel` for optional deep-dives. Mark some visualizers as expandable. |
| Mobile responsiveness of complex visualizers | MED | Each visualizer prompt includes "must work at 375px width" constraint. |

---

## File Creation Order

```
Phase 1:
  1. narrative-primitives.tsx (extend with cyan)
  2. TransformerNarrative.tsx (scaffold with §01-§03)
  3. transformer/ directory with V01-V12

Phase 2:
  4. V13-V37 in transformer/ directory
  5. Extend TransformerNarrative.tsx with §04-§06

Phase 3:
  6. V38-V60 in transformer/ directory
  7. Extend TransformerNarrative.tsx with §07-§10
  8. page.tsx rewrite (replace "Coming Soon")
  9. glossary.ts extension
  10. i18n conversion (post-launch polish)
```

---

## Total Cost Estimate

| Model | Prompts | Cost per prompt | Subtotal |
|---|---|---|---|
| Opus Thinking | 4 | 8 | 32 |
| Opus | 4 | 6 | 24 |
| Sonnet 4.6 Thinking | 5 | 6 | 30 |
| Sonnet 4.5 Thinking | 4 | 3 | 12 |
| Sonnet 4.5 | 2 | 2 | 4 |
| **Total** | **19** | | **102 credits** |

Detailed prompt assignments are in the per-phase documents.
