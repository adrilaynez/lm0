# QuerySearchViz — 5 Design Options (v2)

Constraint: MUST be visually DIFFERENT from QueryKeyRelationsViz (which uses sentence + arcs).
Must show ONE word searching/comparing against all others. Super clean.

---

## Option A: "Radar Scan" — One word at center, targets orbit around it

- Selected word sits large in the CENTER of a circle
- Other words arranged radially around it like a radar/compass
- Distance from center = relevance (closer = higher attention)
- Thin lines from center to each word, brightness = score
- Arrow comparison overlay appears on hover for any target
- Score pills next to each orbiting word

**Aesthetics**: 9/10 — Very visual, unique layout  
**Pedagogy**: 8/10 — Spatial metaphor (closer = more relevant) is intuitive  
**Understanding**: 7/10 — Radial layout less natural than reading order  
**Modernity**: 9/10 — Feels like a data visualization from a sci-fi UI  
**Total: 33/40**

---

## Option B: "Spotlight Row" — Horizontal bar comparison

- Selected word on the LEFT, large and glowing
- All other words in a vertical list to the RIGHT
- Each target word has a horizontal bar showing attention weight
- Bars glow cyan/amber based on strength
- Hovering a target word reveals the Q·K arrow comparison inline
- Ultra clean, reads like a leaderboard

**Aesthetics**: 7/10 — Clean but conventional  
**Pedagogy**: 9/10 — Direct, clear ranking  
**Understanding**: 9/10 — Bar charts are universally understood  
**Modernity**: 6/10 — Feels like a standard chart  
**Total: 31/40**

---

## Option C: "Arrow Field" — Grid of arrow comparisons

- Selected word's Q arrow shown LARGE at top
- Below: a row of cards for each other word
- Each card shows: word name, K arrow (same scale/style as SS7), score
- The Q arrow is OVERLAID faintly on each card for comparison
- Cards sorted by score, brightest first
- Clicking a card expands to show full dot product math

**Aesthetics**: 8/10 — Clean grid, consistent visual language  
**Pedagogy**: 10/10 — Directly shows "Q searches, K answers" with arrows  
**Understanding**: 9/10 — Arrow similarity is the whole point  
**Modernity**: 8/10 — Card grid is modern  
**Total: 35/40** ⭐

---

## Option D: "Gravity Well" — 2D scatter with pull lines

- All words plotted as dots in a 2D embedding space
- Selected word pulses, gravity lines pull toward high-attention targets
- Line thickness = attention weight
- Hover shows score tooltip
- Unique spatial layout but hard to read exact values

**Aesthetics**: 8/10 — Beautiful particle physics feel  
**Pedagogy**: 6/10 — 2D projection can be misleading  
**Understanding**: 5/10 — Abstract, hard to connect to dot product  
**Modernity**: 9/10 — Very modern  
**Total: 28/40**

---

## Option E: "Stack Compare" — Vertical stack with inline arrows

- Selected word at top with its Q arrow (large, clean, SS7-style)
- Below: vertical stack of target words, each with:
  - Word label | mini K arrow | score bar | percentage
- Sorted by score descending
- Hover any target → Q arrow + K arrow overlay appears between them
- Very compact, reads top-to-bottom

**Aesthetics**: 8/10 — Compact and elegant  
**Pedagogy**: 9/10 — Clear flow from Q to each K  
**Understanding**: 8/10 — Good but less visual than Option C  
**Modernity**: 7/10 — List-based  
**Total: 32/40**

---

## Winner: Option C — "Arrow Field" (35/40)

Best pedagogy (10/10) because it DIRECTLY shows what we're teaching:
"The Query arrow searches, each Key arrow answers, and similarity = score."

Uses the same clean arrow grid style as EmbeddingToArrowViz (SS7).
Each card is a self-contained comparison unit.
Sorted by score so the ranking is obvious.

Implementation plan:
1. Word selector row at top (click to pick query word)
2. Large Q arrow displayed prominently
3. Grid of K cards below, each with: word, K arrow, score, bar
4. Q arrow ghost overlaid on each K card for instant comparison
5. Click card → expand to show dot product math
