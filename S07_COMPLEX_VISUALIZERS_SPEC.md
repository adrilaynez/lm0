# §07 Complex Visualizers — Implementation Spec

These are the 4 remaining visualizers for §07 "The Transformer Block". Each is significantly more complex than V38-V41 and requires careful implementation.

---

## V42 — BlockBuilderViz ⭐⭐ (MOST INTERACTIVE)

**Concept:** The learner assembles the Transformer block themselves by placing tiles into correct order.

### Layout
- **LEFT: Component Bank** — 6 draggable tiles (or tap-to-select on mobile):
  1. LayerNorm ("Normalize") — `#a78bfa` (violet)
  2. Self-Attention ("Listen") — `#22d3ee` (cyan)
  3. Residual Add ("Add Original") — `#34d399` (emerald)
  4. LayerNorm ("Normalize") — `#a78bfa` (violet)
  5. FFN ("Think") — `#fbbf24` (amber)
  6. Residual Add ("Add Original") — `#34d399` (emerald)

- **RIGHT: Assembly Area** — 6 empty slots (Step 1→6) connected by downward arrows (Input → Output)

### Correct Order
```
LayerNorm → Self-Attention → Residual Add → LayerNorm → FFN → Residual Add
```

### Interaction Flow
1. **Desktop:** Drag tile from bank → drop onto slot. Use `@dnd-kit/core` + `@dnd-kit/sortable` OR custom pointer events (simpler, no dependency).
2. **Mobile:** Show "Place Next" button row. Current empty slot is highlighted. Tap a tile from remaining bank to place it.
3. **Wrong placement:** Tile bounces back with `spring` animation (stiffness: 300). Show contextual error toast:
   - Slot 1 expects LayerNorm → "Attention needs normalized input first!"
   - Slot 2 expects Attention → "After normalizing, it's time to listen!"
   - Slot 3 expects Add → "After attention, add the original input back (residual connection)!"
   - Slot 4 expects LayerNorm → "The FFN needs its own normalization!"
   - Slot 5 expects FFN → "Time to think about what was heard!"
   - Slot 6 expects Add → "One more residual connection to keep the signal alive!"
4. **Correct placement:** Satisfying snap with scale pulse (1 → 1.15 → 1, spring).
5. **All 6 correct:** 🎉 Celebration sequence:
   - Confetti burst (30-40 particles, multi-color, 2s fade)
   - Tiles morph into connected pipeline (animated transition)
   - Data particles begin flowing through the assembled block
   - Text appears: "You assembled a Transformer block!"

### Visual Spec
- Tiles: rounded-xl, glassmorphism bg, accent-colored border, 13px+ labels
- Empty slots: dashed border `rgba(255,255,255,0.10)`, subtle scale pulse on hover
- Snap animation: `type: "spring", stiffness: 300, damping: 20`
- Confetti: 30-40 `<motion.div>` circles/squares, random colors from HEAD_COLORS + pink/amber, random trajectories, fade out over 2s
- Height: ~480px
- Border style for each tile type:
  - Violet (LayerNorm): `border: 1.5px solid #a78bfa40`
  - Cyan (Attention): `border: 1.5px solid #22d3ee40`
  - Emerald (Add): `border: 1.5px solid #34d39940`
  - Amber (FFN): `border: 1.5px solid #fbbf2440`

### State Model
```tsx
type TileType = "norm" | "attention" | "add" | "ffn";
interface PlacedTile { type: TileType; slotIndex: number; }

const CORRECT_ORDER: TileType[] = ["norm", "attention", "add", "norm", "ffn", "add"];

const [placed, setPlaced] = useState<(TileType | null)[]>([null, null, null, null, null, null]);
const [bankRemaining, setBankRemaining] = useState<TileType[]>(["norm", "attention", "add", "norm", "ffn", "add"]);
const [errorMsg, setErrorMsg] = useState<string | null>(null);
const [complete, setComplete] = useState(false);
```

### Anti-patterns
- Do NOT add text explanations inside the viz
- Do NOT allow placing tiles in wrong order silently (feedback is mandatory)
- Do NOT skip mobile fallback
- Do NOT use external drag-drop library if custom pointer events are simpler

---

## V43 — DataFlowViz ⭐ (ANIMATED PIPELINE)

**Concept:** Complete assembled Transformer block with animated data particles flowing through all stages.

### Layout — Vertical Stack
```
┌─────────────────────────┐
│      Input Tokens        │  ← 6 token chips at top
├─────────────────────────┤
│      LayerNorm           │  ← violet
├─────────────────────────┤
│    Self-Attention        │  ← cyan, with attention beams between tokens
├─────────────────────────┤
│    Residual Add (⊕)      │  ← emerald
├─────────────────────────┤
│      LayerNorm           │  ← violet
├─────────────────────────┤
│    Feed-Forward          │  ← amber, private glow per token
├─────────────────────────┤
│    Residual Add (⊕)      │  ← emerald
├─────────────────────────┤
│     Output Tokens        │  ← 6 enriched token chips at bottom
└─────────────────────────┘
```

### Interaction
- **Click any token** to follow its path (highlighted in that token's color, all other paths dim)
- **Pause/Play/Step** controls at bottom
- At attention stage: bezier beams form between the selected token and others
- At FFN stage: private processing glow intensifies on selected token
- Each stage has a glassmorphism container with its label (13px+)

### Animation Sequence (auto-play or step)
1. Token particles enter from top
2. Pass through LayerNorm (brief normalization flash)
3. At Attention: beams form, particles travel along beams to gather info
4. Residual: bypass particle merges with main particle (flash)
5. LayerNorm again
6. FFN: token glows privately (expand → activate → compress visual)
7. Residual: bypass merges again
8. Enriched tokens emerge at bottom

### Visual Spec
- Animated particles: `<motion.circle>` following offset-path or interpolated positions
- Each stage container: `backdrop-filter: blur(8px)`, `rgba(255,255,255,0.03)` bg
- Beams pulse at attention stage (strokeOpacity animation)
- Height: ~520px
- MUST look premium — bbycroft.net quality
- All labels ≥ 13px

### State Model
```tsx
const [activeToken, setActiveToken] = useState<number | null>(null);
const [playing, setPlaying] = useState(true);
const [currentStage, setCurrentStage] = useState(0); // 0-7
```

### Anti-patterns
- Do NOT add matrix values
- Do NOT make it horizontally scrollable
- Do NOT show numbers inside — this is purely visual flow

---

## V44 — BeforeAfterBlockViz

**Concept:** Show how one Transformer block changes token representations. Input: 6 simple bars. Output: 6 enriched bars. Plus a cosine similarity heatmap before vs after.

### Layout
- **Top row:** Two side-by-side panels
  - LEFT: "Before" — 6 tokens with simple, similar bar charts (all look alike)
  - RIGHT: "After" — 6 tokens with differentiated, enriched bar charts (each unique)
- **Bottom:** 2×2 cosine similarity heatmaps
  - LEFT heatmap: "Before — all similar" (mostly uniform warm colors)
  - RIGHT heatmap: "After — differentiated" (varied, structured pattern)

### Visual Spec
- Before bars: uniform heights, muted colors (white/20)
- After bars: varied heights, vibrant accent colors matching token identity
- Heatmap cells: colored squares (cold=blue → hot=amber), size proportional to similarity
- Smooth toggle animation between before/after states
- Height: ~260px
- Labels ≥ 13px

### Data
```tsx
// Pre-computed fake embeddings (8-dim)
const BEFORE = [
  [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // all similar
  [0.5, 0.5, 0.5, 0.5, 0.6, 0.5, 0.5, 0.5],
  // ...
];
const AFTER = [
  [0.9, 0.1, 0.3, 0.8, 0.2, 0.7, 0.4, 0.6], // all different
  [0.2, 0.8, 0.7, 0.3, 0.9, 0.1, 0.5, 0.4],
  // ...
];
```

### Anti-patterns
- Do NOT show exact numbers — just visual bars
- Do NOT add technical explanations inside
- Keep it ONE idea: "the block makes tokens different from each other"

---

## V45 — BlockBlueprintViz

**Concept:** Clean reference diagram. The standard Transformer block layout. Clickable components reveal tooltip descriptions. Bookmarkable reference card.

### Layout — Vertical architecture diagram
```
         ┌── Input ──┐
         │            │
         ▼            │
    ┌─────────┐       │
    │LayerNorm│       │
    └────┬────┘       │
         ▼            │
   ┌──────────┐       │
   │ Self-    │       │  ← Residual
   │Attention │       │     bypass
   └────┬─────┘       │
         ▼            │
      ┌──⊕──┐ ◄──────┘
      └──┬──┘
         │         ┌──┐
         ▼         │  │
    ┌─────────┐    │  │
    │LayerNorm│    │  │
    └────┬────┘    │  │
         ▼         │  │  ← Residual
    ┌─────────┐    │  │     bypass
    │   FFN   │    │  │
    └────┬────┘    │  │
         ▼         │  │
      ┌──⊕──┐ ◄───┘  │
      └──┬──┘
         ▼
      Output
```

### Interaction
- **Click/hover any component** → tooltip appears with:
  - Component name (bold)
  - One-sentence description (simple language)
  - "Covered in §XX" reference link
- No auto-animation — this is a reference card, not a demo
- Subtle idle state: very gentle border glow on each component

### Component Tooltips
| Component | Description | Reference |
|-----------|-------------|-----------|
| LayerNorm | "Stabilizes values before each operation" | §07 |
| Self-Attention | "Tokens gather information from each other" | §03-§05 |
| Residual Add | "Adds the original input back — the gradient highway" | §07 (MLP callback) |
| FFN | "Each token privately processes what it learned" | §07 (MLP callback) |

### Visual Spec
- Clean SVG diagram, no clutter
- Components as rounded rectangles with accent-colored borders
- Residual arrows: dashed emerald lines curving around blocks
- Height: ~370px
- Tooltips: glassmorphism card, `backdrop-filter: blur(12px)`, `rgba(0,0,0,0.8)` bg
- All labels ≥ 13px
- Bookmark icon in top-right corner (visual only, or scroll-to-anchor)

### Anti-patterns
- Do NOT add animation that distracts from reference utility
- Do NOT add numbers or matrices
- Keep it as clean as a textbook diagram

---

## Implementation Order (Recommended)

1. **V44 — BeforeAfterBlockViz** (~30 min) — simplest of the 4, just bars + heatmap
2. **V45 — BlockBlueprintViz** (~45 min) — static SVG + tooltips
3. **V42 — BlockBuilderViz** (~90 min) — interaction-heavy, needs careful state management
4. **V43 — DataFlowViz** (~90 min) — animation-heavy, needs particle system

## Narrative Placement

After the assembly checklist (Beat 5), insert:
```tsx
{/* ═══ V42 — BlockBuilderViz ⭐⭐ ═══ */}
<FadeInView className="my-10 md:my-14">
    <Suspense fallback={<SectionSkeleton />}>
        <BlockBuilderViz />
    </Suspense>
</FadeInView>

{/* narrative bridge: "Watch data flow through YOUR creation" */}

{/* ═══ V43 — DataFlowViz ⭐ ═══ */}
<FadeInView className="my-10 md:my-14">
    <Suspense fallback={<SectionSkeleton />}>
        <DataFlowViz />
    </Suspense>
</FadeInView>

{/* narrative bridge: "Let's see what one block actually does to our tokens" */}

{/* ═══ V44 — BeforeAfterBlockViz ═══ */}
<FadeInView className="my-10 md:my-14">
    <Suspense fallback={<SectionSkeleton />}>
        <BeforeAfterBlockViz />
    </Suspense>
</FadeInView>

{/* ═══ V45 — BlockBlueprintViz ═══ */}
<FadeInView className="my-10 md:my-14">
    <Suspense fallback={<SectionSkeleton />}>
        <BlockBlueprintViz />
    </Suspense>
</FadeInView>
```
