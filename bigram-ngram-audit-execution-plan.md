# Comprehensive Audit & Execution Plan — Bigram + N-gram + Landing Page

**Date:** 2025-02-28
**Core Philosophy:** "The learner should feel like they are inventing the ideas themselves."

---

## PART 1 — CROSS-REFERENCE: WHAT'S BEEN DONE vs WHAT HASN'T

### ✅ Already Implemented (Previous Sprint)

| ID | Task | Status |
|----|------|--------|
| T3 | Bigram hero — added description, eyebrow, readTime | ✅ Done |
| T4a | CorpusCountingIdea new visualizer | ✅ Done |
| T4b | PairHighlighter enhancement + placement | ✅ Done |
| T5 | §3 restructuring + StorageProblemVisualizer | ✅ Done |
| T6 | TransitionMatrix UX improvement | ✅ Done |
| T7 | NormalizationVisualizer full redesign | ✅ Done |
| T8 | PredictionPipelineDemo (replaces InferenceConsole in §4) | ✅ Done |
| T9 | SamplingMechanismVisualizer | ✅ Done |
| T10 | GenerationPlayground redesign (char reveal, temp presets) | ✅ Done |
| T11 | The Fatal Flaw redesign (bridging text, labeled FigureWrappers) | ✅ Done |
| T1 | LAB landing page opening adjustments (partial) | ✅ Partial |
| T2 | LAB page i18n rewrites (partial) | ✅ Partial |

### ❌ NOT Implemented from Audit Plan

| Audit ID | Task | Priority |
|----------|------|----------|
| A1 | N-gram §1 — Visualizer-first reorder | 🔴 HIGH |
| A2 | N-gram §2 — Show before tell | 🔴 HIGH |
| A3 | N-gram §3.5 — Merge orphan "Why Not N=100?" | 🔴 HIGH |
| A4 | N-gram §4 — Split into two sections | 🔴 HIGH |
| A5 | N-gram §6 — Strengthen conclusion | 🟡 MEDIUM |
| A8 | Landing page CTA — "Build your first predictor" | 🟡 MEDIUM |
| A9 | Landing page — Soften era descriptions (spoilers) | 🟡 MEDIUM |
| C1 | Fix ALL hardcoded English strings | 🔴 HIGH |
| C2 | Update SectionProgressBar for new sections | 🟡 MEDIUM |
| C3 | Rewrite KeyTakeaways as confirmations | 🟡 MEDIUM |
| C4 | Asymmetric CTAs at section endings | 🟡 MEDIUM |
| C5 | Add callback headers to section openings | 🟢 LOW |
| B1–B10 | All 10 new/redesigned visualizers | 🟡 VARIES |
| D1–D4 | All transitions + mode selection repositioning | 🟡 MEDIUM |

---

## PART 2 — USER-REPORTED BUGS & ISSUES

### BUG-1: PredictionChallenge ("Your Turn") is ugly/unimpressive
- **File:** `PredictionChallenge.tsx`
- **Problem:** This is the FIRST interactive element the learner sees. It looks plain — flat buttons, small text, no visual drama. It should feel exciting and game-like.
- **Fix:** Full visual redesign — larger display, animated letter reveal, satisfying correct/wrong feedback with confetti/shake, progress bar with color, bigger option buttons with hover effects, dramatic score display at end.
- **Priority:** 🔴 HIGH (first impression)

### BUG-2: CorpusCountingIdea text overflow
- **File:** `CorpusCountingIdea.tsx` line 149
- **Problem:** On the `grid-cols-2` layout, the corpus text panel overflows horizontally — the text wraps awkwardly and the scanning position can push content beyond the panel boundary (visible in screenshot 1: text goes behind the right panel).
- **Fix:** Add `overflow-hidden` + `break-all` or `overflow-wrap: break-word` to the corpus text container. Also ensure the grid doesn't collapse on smaller screens — current `grid-cols-1 md:grid-cols-2` may still overflow at medium widths. Consider making the corpus text container scrollable or using `text-wrap: balance`.
- **Priority:** 🔴 HIGH (visual bug)

### BUG-3: Missing narrative bridge before "The Full Picture"
- **File:** `BigramNarrative.tsx` §3
- **Problem:** Screenshot 2 shows "WHERE DOES THIS DATA COME FROM?" callout directly followed by "THE FULL PICTURE" FigureWrapper, with no textual bridge. The learner jumps from an explanation callout to the massive 96×96 matrix without motivation.
- **Fix:** Add a P block between the data source callout and the full TransitionMatrix. Something like: "Now that you understand where the data comes from, let's see the entire table. Every character pair, every transition, all at once."
- **Priority:** 🟡 MEDIUM

### BUG-4: PredictionPipelineDemo doesn't predict
- **File:** `PredictionPipelineDemo.tsx`
- **Problem:** The pipeline requires `onAnalyze` to be called which hits the backend. If the backend isn't running or the model isn't loaded, it silently fails. The component shows the 3-step pipeline but step 2→3 never completes.
- **Investigation needed:** Check if this is a backend issue or a wiring issue. The component receives `onAnalyze` from `BigramNarrative` props which come from the page. May need to verify the API endpoint.
- **Priority:** 🟡 MEDIUM (may be infrastructure)

### BUG-5: SamplingMechanismVisualizer needle doesn't land correctly
- **File:** `SamplingMechanismVisualizer.tsx` lines 59-87, 155-170
- **Problem:** The spinning animation cycles through candidates visually (highlighting each in turn), but when it "lands," the needle on the probability ruler may visually point to the wrong segment because the spin animation's `pickedIdx` during spinning doesn't correspond to the final random pick. The spinning highlights indices 0,1,2,3,4,0,1,2... but the final pick is based on `weightedPick()` which is random.
- **Fix:** During the "landing" phase, animate the needle from its current position to the correct segment. Currently the needle just appears at `rollValue * 100%` without the spinning animation being aware of it. Need to: (1) During spinning, animate the needle across the ruler. (2) On final pick, have the needle decelerate and land on the correct position. (3) Highlight the correct candidate bar simultaneously.
- **Priority:** 🔴 HIGH (pedagogically confusing)

### BUG-6: No visual showing "how a word is selected from the table"
- **Problem:** The learner never sees the actual lookup process: given a character, go to that ROW in the transition matrix, read the probability distribution, then sample. This is the core mechanism and it's never visualized as a connected flow.
- **Proposed:** New visualizer "TableLookupVisualizer" — shows: (1) input character highlighted, (2) arrow pointing to the row in a mini-matrix, (3) row extracted as a probability distribution, (4) sampling animation. This connects TransitionMatrix → NormalizationVisualizer → SamplingMechanism into one coherent flow.
- **Priority:** 🟡 MEDIUM (pedagogical gap)

---

## PART 3 — HARDCODED ENGLISH STRINGS AUDIT

### ExponentialGrowthAnimator.tsx
- Line 69: `"possible contexts"` — hardcoded
- Line 77: `"Most never seen in training"` — hardcoded
- Line 129: `"Each extra character ×96 — vocabulary size"` — hardcoded
- Line 145: `"Replay"` — hardcoded

### StatisticalEraTimeline.tsx
- Line 10: `"One character of memory"` — hardcoded
- Line 11: `"Statistical era begins"` — hardcoded
- Line 17: `"One character of memory. Fast and simple..."` — hardcoded (full summary)
- Line 22: `"More context, same limits"` — hardcoded
- Line 23: `"Dominant in NLP"` — hardcoded
- Line 29: `"More context, sharper predictions..."` — hardcoded (full summary)
- Line 34: `"Something different"` — hardcoded
- Line 35: `"A new era"` — hardcoded
- Line 41: `"Neural Networks. We stop counting..."` — hardcoded (full summary)
- Line 130: `"Hover a node to learn more"` — hardcoded

### NgramNarrative.tsx
- Lines 319-325: ContinueToast section names — hardcoded English ("More Context", "Counting With Context", etc.)
- Lines 329-335: SectionProgressBar names — hardcoded English
- Line 363: `"~15 min read · 8 interactive demos"` — hardcoded
- Line 614: KeyTakeaway §5 — full English paragraph hardcoded (not using `t()`)
- Line 650: KeyTakeaway §6 — full English paragraph hardcoded (not using `t()`)

### GenerationPlayground.tsx
- Lines 12-16: Temperature preset labels `"Focused"`, `"Balanced"`, `"Creative"`, `"Chaotic"` — hardcoded (should use i18n)

---

## PART 4 — N-GRAM SPECIFIC IMPROVEMENTS (PRIORITY FOCUS)

### N-FIX-1: §1 Visualizer-First Reorder
- **Current:** Lead → P → P → P → ContextWindowVisualizer → Callout
- **Target:** Lead (1 line) → ContextWindowVisualizer → P → P → Callout
- **File:** `NgramNarrative.tsx` lines 380-406
- **i18n:** Add `ngramNarrative.moreContext.tryPrompt` key

### N-FIX-2: §2 Show Before Tell
- **Current:** Lead → P → P → NgramMiniTransitionTable → P → CountingComparisonWidget
- **Target:** Lead → NgramMiniTransitionTable → P → P → CountingComparisonWidget
- **File:** `NgramNarrative.tsx` lines 410-440

### N-FIX-3: Merge §3.5 into §3
- **Current:** §3.5 is an orphan section with no ID, no progress tracking, text-only
- **Target:** Merge as a concluding "but wait..." moment inside §3, with a mini interactive preview
- **File:** `NgramNarrative.tsx` lines 474-479

### N-FIX-4: Split §4 into §4a + §4b
- **Current:** §4 contains ExponentialGrowthAnimator + SparsityHeatmap + NgramFiveGramScale + Callout + tokenization ExpandableSection + CombinatoricExplosionTable — way too dense
- **Target:**
  - §4a "The Explosion": ExponentialGrowthAnimator + bridge text + NgramFiveGramScale
  - §4b "The Empty Table": SparsityHeatmap + tokenization (promoted from expandable to main) + CombinatoricExplosionTable
- **Renumber:** §5 → §6, §6 → §7. Total sections: 7
- **Update:** SectionProgressBar and ContinueToast

### N-FIX-5: Add Participatory Generation (N-V3)
- **New component:** `NgramInteractiveGenerator.tsx`
- **Concept:** User types a seed, picks N value, generates text with typing animation
- **Placement:** Between §3 and §4 (after quality improvement, before cost)
- **Backend:** Uses existing N-gram generation endpoint
- **Priority:** 🔴 HIGH — this is the "you built something" celebration moment that's currently missing

### N-FIX-6: Strengthen §6 (End of Counting)
- **Current:** 3 paragraphs + 1 visualizer + pull quote. Too thin for the conclusion of the entire counting era.
- **Add:** (1) Consolidation text. (2) A "what you now know" summary. (3) Stronger emotional bridge to neural networks.
- **The "Similarity Blind Spot" concept** (audit B4/N-V5) would be ideal here but is complex. A simpler version: static comparison showing "dog" and "cat" are treated identically despite being semantically related.

### N-FIX-7: Asymmetric CTA
- **Current:** Free Lab and Neural Networks CTAs are equal-weight
- **Target:** "Continue to Neural Networks →" as dominant large button, "Or explore the free lab" as subtle text link below

### N-FIX-8: Fix hardcoded KeyTakeaways
- Lines 614 and 650 use raw English HTML, bypassing i18n entirely

---

## PART 5 — BIGRAM SPECIFIC IMPROVEMENTS

### B-FIX-1: PredictionChallenge Visual Redesign
- **Current:** Plain buttons, small display, minimal feedback
- **Target:** Game-like feel — large animated letter display, satisfying animations, bigger option buttons with glow on hover, animated progress dots, dramatic score reveal with gradient backgrounds
- **File:** `PredictionChallenge.tsx` — full rewrite of render

### B-FIX-2: CorpusCountingIdea Overflow Fix
- **Current:** Text overflows its container in the grid layout
- **Target:** `overflow-hidden`, `break-all`, possibly scrollable corpus container
- **File:** `CorpusCountingIdea.tsx` line 149

### B-FIX-3: Add narrative bridge before Full TransitionMatrix
- **Current:** Data source callout → immediately Full Matrix
- **Target:** Add a P block bridging them
- **File:** `BigramNarrative.tsx` §3, + i18n keys

### B-FIX-4: SamplingMechanismVisualizer Animation Fix
- **Current:** Spinning highlights random candidates, needle appears at roll position instantly
- **Target:** Needle should animate across the ruler during spinning, then decelerate to final position. The visual spinning and the needle should be synchronized.
- **File:** `SamplingMechanismVisualizer.tsx`

### B-FIX-5: New "TableLookupVisualizer" 
- **Concept:** Shows the full flow: input char → row lookup → probability distribution → sample
- **Connects:** TransitionMatrix concept → Normalization → Sampling in one visual
- **File:** New `TableLookupVisualizer.tsx`
- **Placement:** §4 after NormalizationVisualizer, before or replacing PredictionPipelineDemo

### B-FIX-6: PredictionPipelineDemo Backend Investigation
- Check if `onAnalyze` is actually wired to a working backend endpoint
- May need fallback to client-side prediction using the transition matrix data

### B-FIX-7: GenerationPlayground temp presets i18n
- Move "Focused", "Balanced", "Creative", "Chaotic" to i18n keys

---

## PART 6 — LANDING PAGE IMPROVEMENTS

### L-FIX-1: CTA Text — More Specific
- **Current:** "Start the Journey" 
- **Target:** "Build your first predictor →"
- **Files:** `en.ts`, `es.ts` (`lab.landing.modes.cta`)

### L-FIX-2: Soften Era Descriptions
- **Current Counting:** "You'll be surprised how far it gets — and fascinated by where it breaks."
- **Target:** "The question is: how far can counting take you?"
- **Current Learning:** "What if the machine could discover patterns on its own, without being told what to look for?"
- **Target:** Already good — it's a question, not a spoiler
- **Files:** `en.ts`, `es.ts`

### L-FIX-3: Model Card Descriptions
- Cards currently summarize solutions. Should tease problems instead.
- E.g. Bigram: instead of "Count character pairs..." → "Can you predict text by counting? Try it."

---

## PART 7 — ADDITIONAL PROPOSED IMPROVEMENTS

### ADD-1: "Greedy vs Random" Temperature Discovery (Bigram §5)
- Before SoftmaxTemperatureVisualizer, add a mini-demo showing greedy decoding produces boring loops. The learner discovers WHY temperature is needed.
- **Priority:** 🟡 MEDIUM

### ADD-2: N-gram "Memory Price Tag" Interactive Slider (replaces ExponentialGrowthAnimator)
- Current animator is passive (auto-play). Make it an interactive slider where the learner drags N and watches costs explode. Add RAM bar, fill-rate bar, screen-shake at N=6+.
- **Priority:** 🟡 MEDIUM (complex)

### ADD-3: "Similarity Blind Spot" Bridge Visualizer (N-gram §6→NN)
- Static or simple interactive: type "cat", see related words, demonstrate that N-gram treats them as unrelated. Toggle: "What if the model knew these were related?" → preview embedding concept.
- **Priority:** 🟡 MEDIUM (bridge to NN)

### ADD-4: N-gram Hero Callback to Bigram Limitation
- N-gram hero currently generic. Should reference: "Remember how 'th', 'sh', 'wh' all gave the same prediction? Let's fix that."
- **Priority:** 🟡 MEDIUM

### ADD-5: Bigram CTA Asymmetry
- Current Bigram CTA: equal-weight "Free Lab" and "N-gram" buttons
- Target: Large "Continue to N-gram →" + subtle "or explore the lab" link
- **Priority:** 🟢 LOW

---

## EXECUTION PLAN — PRIORITY ORDER

### Sprint 1: Critical N-gram Narrative Fixes (Highest Impact)

| # | Task | Type | Est. |
|---|------|------|------|
| 1 | **C1-ngram** — Fix all hardcoded English in N-gram (KeyTakeaways, ContinueToast, SectionProgressBar, hero readTime) | i18n | S |
| 2 | **C1-viz** — Fix hardcoded English in ExponentialGrowthAnimator + StatisticalEraTimeline | i18n | S |
| 3 | **N-FIX-1** — §1 Visualizer-first reorder | Narrative | S |
| 4 | **N-FIX-2** — §2 Show before tell | Narrative | S |
| 5 | **N-FIX-3** — Merge §3.5 into §3 | Narrative | S |
| 6 | **N-FIX-4** — Split §4 into §4a + §4b | Narrative | M |
| 7 | **N-FIX-8** — Fix hardcoded KeyTakeaways | i18n | S |

### Sprint 2: Critical Bug Fixes

| # | Task | Type | Est. |
|---|------|------|------|
| 8 | **BUG-1 / B-FIX-1** — PredictionChallenge visual redesign | Component | L |
| 9 | **BUG-2 / B-FIX-2** — CorpusCountingIdea overflow fix | CSS | S |
| 10 | **BUG-5 / B-FIX-4** — SamplingMechanismVisualizer animation fix | Component | M |
| 11 | **BUG-3 / B-FIX-3** — Add narrative bridge before Full Matrix | Narrative | S |

### Sprint 3: New N-gram Visualizers + Narrative Enhancements

| # | Task | Type | Est. |
|---|------|------|------|
| 12 | **N-FIX-5** — NgramInteractiveGenerator (participatory generation) | New Component | L |
| 13 | **N-FIX-6** — Strengthen §6 End of Counting | Narrative | M |
| 14 | **N-FIX-7** — Asymmetric CTA | UI | S |
| 15 | **ADD-4** — N-gram hero callback to bigram limitation | i18n | S |

### Sprint 4: Bigram Polish + New Components

| # | Task | Type | Est. |
|---|------|------|------|
| 16 | **B-FIX-5** — TableLookupVisualizer (how lookup works) | New Component | L |
| 17 | **B-FIX-6** — PredictionPipelineDemo backend investigation | Debug | S |
| 18 | **B-FIX-7** — GenerationPlayground temp presets i18n | i18n | S |
| 19 | **ADD-1** — Greedy vs Random temperature discovery | New Component | M |
| 20 | **ADD-5** — Bigram CTA asymmetry | UI | S |

### Sprint 5: Landing Page + Advanced Visualizers

| # | Task | Type | Est. |
|---|------|------|------|
| 21 | **L-FIX-1** — CTA text rewrite | i18n | S |
| 22 | **L-FIX-2** — Soften era descriptions | i18n | S |
| 23 | **L-FIX-3** — Model card description rewrites | i18n | S |
| 24 | **ADD-3** — Similarity Blind Spot bridge visualizer | New Component | L |
| 25 | **ADD-2** — Memory Price Tag interactive slider | Redesign | L |

### Sprint 6: Rewrite KeyTakeaways + Final Polish

| # | Task | Type | Est. |
|---|------|------|------|
| 26 | **C3** — Rewrite ALL KeyTakeaways as confirmations | i18n | M |
| 27 | **C5** — Add callback headers to section openings | i18n | S |
| 28 | **E1** — Full i18n grep audit | QA | S |
| 29 | **E5** — Build verification | QA | S |

---

**Size estimates:** S = <30 min, M = 30-60 min, L = 1-2 hours
**Total estimated: ~12-16 focused sessions**

**Recommended start: Sprint 1 (tasks 1-7) — all N-gram narrative fixes.**
