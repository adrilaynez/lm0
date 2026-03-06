# Transformer Visualizer Catalog

60+ interactive visualizers — where they go, what they teach, and how they should look.

Visual philosophy: every visualizer should feel like a scientific instrument you want to play with. Inspired by [LLM Visualization](https://bbycroft.net/llm) (3D data flow), [attentionviz.com](http://attentionviz.com/) (explorable attention), and [Distill.pub](https://distill.pub) (interactive diagrams).

---

## Category 1 — Problem Discovery (§01)
*The learner feels the limitation of current models*

---

### V01 · The Isolated Tokens
| Where | §01 — opening |
|---|---|
| **Teaches** | Tokens in an MLP are processed independently — no relationships |
| **Interaction** | Sentence displayed with each token in a separate box. Walls between boxes pulse faintly. Hover over a token → it highlights, but no connection to other tokens. Learner clicks "connect?" button → nothing happens. The walls are impenetrable. |
| **Visual style** | Dark background, tokens as glowing cards in glass boxes, pulsing divider walls. Claustrophobic feel. |
| **Complexity** | ⬢⬡⬡ Low |

### V02 · Draw the Connections
| Where | §01 — after isolation demo |
|---|---|
| **Teaches** | Humans naturally see relationships between words — the model can't |
| **Interaction** | Sentence: "The cat sat on the warm mat." Learner draws lines between words they think are related (drag from word to word). Thickness = importance (drag length). After drawing, reveal: "You just designed attention. The lines you drew? Scientists had the same idea." |
| **Visual style** | Minimal background. Lines drawn by user glow cyan. When revealed, lines animate into proper attention curves. |
| **Complexity** | ⬢⬢⬡ Medium |

### V03 · MLP vs Human Understanding
| Where | §01 — synthesis |
|---|---|
| **Teaches** | Side-by-side comparison of how MLP and human process the same sentence |
| **Interaction** | Split screen. Left: MLP view — each token in its own pipeline, no connections. Right: Human view — connections between related words, implied meaning. Toggle between views. |
| **Visual style** | MLP side: mechanical, grey, isolated boxes. Human side: warm, connected, organic flowing lines. |
| **Complexity** | ⬢⬢⬡ Medium |

### V04 · The Architecture Wishlist (Callback)
| Where | §01 — closing |
|---|---|
| **Teaches** | Recap the limitations from MLP §09 and set up the chapter roadmap |
| **Interaction** | 4 items from the MLP wishlist. Each starts unchecked. As the chapter progresses, items check off with animation. §01 shows the empty checklist. |
| **Visual style** | Checklist on translucent card. Unchecked items pulse gently. A "progress: 0/4" counter. |
| **Complexity** | ⬢⬡⬡ Low |

---

## Category 2 — The Road Not Taken: RNN (~3 min)
*Brief historical context — why sequential processing fails*

---

### V05 · The Telephone Game
| Where | §02 — RNN concept |
|---|---|
| **Teaches** | Sequential processing compresses information into a bottleneck |
| **Interaction** | 10 tokens in a line. RNN processes left to right. A hidden state ball passes from token to token, changing color as it absorbs information. By token 10, the ball is murky — token 1's color is barely visible. Slider: sequence length (5→50) → see how token 1's contribution vanishes. |
| **Visual style** | Horizontal chain, glowing ball traveling left to right. Color mixing shows information blending. Long sequences make early colors disappear. |
| **Complexity** | ⬢⬢⬡ Medium |

### V06 · LSTM: The Bandage
| Where | §02 — LSTM mention |
|---|---|
| **Teaches** | LSTMs add gates to control memory, but don't fully solve the bottleneck |
| **Interaction** | Same as V05 but with a "gate" toggle. Gates slow the color degradation but don't eliminate it. Short annotation: "Better memory — but still one token at a time." No deep explanation — just the concept. |
| **Visual style** | Same chain as V05 with small gate icons between tokens. Toggle adds/removes gates. |
| **Complexity** | ⬢⬡⬡ Low (extension of V05) |

### V07 · Sequential vs Parallel
| Where | §02 — pivot to attention |
|---|---|
| **Teaches** | RNNs must process one-by-one (slow). What if we could process all at once? |
| **Interaction** | Side-by-side race. Left: RNN processes 20 tokens one by one (progress bar fills slowly). Right: "???" processes all 20 simultaneously (fills instantly). The "???" will be revealed as attention. |
| **Visual style** | Two racing progress bars. Left is painfully slow. Right is instantaneous. "?" box on the right builds anticipation. |
| **Complexity** | ⬢⬡⬡ Low |

---

## Category 3 — Attention Intuition (§03)
*The core "aha!" moment — no math yet*

---

### V08 · The Spotlight
| Where | §03 — first attention demo |
|---|---|
| **Teaches** | Each token can "look at" every other token with varying intensity |
| **Interaction** | Sentence with 8-10 words. Click any word → spotlight beams radiate to all other words. Beam brightness = pre-computed attention weight. Hover over a beam to see the weight value. Try different words → different spotlight patterns emerge. |
| **Visual style** | Dark theater setting. Selected word glows. Beams are volumetric light rays (CSS gradients or canvas). Brighter = more relevant. Beautiful, atmospheric. |
| **Complexity** | ⬢⬢⬢ High |

### V09 · Context Changes Everything
| Where | §03 — dynamic attention |
|---|---|
| **Teaches** | Attention patterns change depending on context — unlike fixed MLP weights |
| **Interaction** | Two sentences side by side, both containing "bank": ① "I deposited money at the bank" and ② "I sat on the bank of the river." Click "bank" in each → completely different attention patterns. Left: attends to "money", "deposited". Right: attends to "river", "sat". |
| **Visual style** | Split screen. Both spotlights active simultaneously. The contrast is visually striking. |
| **Complexity** | ⬢⬢⬡ Medium |

### V10 · Guess the Pattern
| Where | §03 — interactive challenge |
|---|---|
| **Teaches** | Attention follows linguistic intuition — learner can guess it |
| **Interaction** | 5 sentences presented one at a time. For each, the learner adjusts attention sliders (who attends to whom). Then clicks "reveal" to see the model's actual pattern. Score: how close were they? Celebrate correct intuitions. |
| **Visual style** | Quiz-like interface. Sliders on the left, reveal animation on the right. Confetti on high scores. |
| **Complexity** | ⬢⬢⬢ High |

### V11 · Static vs Dynamic Weights
| Where | §03 — key insight |
|---|---|
| **Teaches** | MLP weights are fixed after training. Attention weights change with every input. |
| **Interaction** | Two panels. Left: MLP — same input connections with fixed line thicknesses (weights don't change regardless of input). Right: Attention — line thicknesses change dramatically with each new sentence. Toggle between 3 sentences to see the difference. |
| **Visual style** | Side-by-side comparison. MLP side stays static (dull). Attention side dances with each sentence (vibrant). |
| **Complexity** | ⬢⬢⬡ Medium |

### V12 · Attention Heatmap Explorer
| Where | §03 — deep exploration |
|---|---|
| **Teaches** | The full attention matrix as a 2D heatmap — rows attend to columns |
| **Interaction** | Full sentence × sentence heatmap. Hover over any cell → see the exact attention weight. Click a row → highlight that token's attention distribution. Input field: type your own sentence → see the heatmap update (pre-computed for selected sentences). |
| **Visual style** | LLM Visualization inspired. Beautiful gradient heatmap (dark purple → cyan → white for intensity). Smooth hover effects. |
| **Complexity** | ⬢⬢⬢ High |

---

## Category 4 — The Scoring Mechanism (§04)
*How does a token know who is important?*

---

### V13 · How Similar Are Two Arrows?
| Where | §04 — dot product discovery |
|---|---|
| **Teaches** | The dot product measures directional similarity between two vectors |
| **Interaction** | 2D plane with two draggable arrows. As the learner rotates them: same direction → score climbs, perpendicular → score = 0, opposite → negative. Real-time score display. No formula initially — just visual. Then formula fades in after intuition is built. |
| **Visual style** | Clean geometric plane. Arrows with glow effects. Score counter with smooth animation. |
| **Complexity** | ⬢⬢⬡ Medium |

### V14 · Pairwise Scoring Table
| Where | §04 — applying dot product |
|---|---|
| **Teaches** | Computing similarity between all pairs of tokens |
| **Interaction** | 5 tokens shown as arrows. All pairwise dot products computed and displayed as a 5×5 table. Hover over a cell → the two arrows highlight and the angle between them is shown. |
| **Visual style** | Arrows in the top half, table in the bottom half. Connected by animated lines on hover. |
| **Complexity** | ⬢⬢⬡ Medium |

### V15 · The Self-Similarity Problem
| Where | §04 — motivating QKV |
|---|---|
| **Teaches** | Using raw embeddings → every token attends to itself the most |
| **Interaction** | Show dot product of each token with itself (diagonal of the matrix) → always the highest. Highlight the diagonal in red. "Every token just listens to itself. That's useless!" |
| **Visual style** | Heatmap with the diagonal highlighted in alarming red. Everything else is dim. Visual warning. |
| **Complexity** | ⬢⬡⬡ Low |

---

## Category 5 — Query, Key, Value (§04 continued)
*The three projections that make attention work*

---

### V16 · The Three Lenses
| Where | §04 — QKV introduction |
|---|---|
| **Teaches** | Each token creates three different representations of itself |
| **Interaction** | One token (word "cat") shown as a glowing sphere. Three projection paths diverge: Q (cyan), K (green), V (amber). Each path applies a different learned matrix transformation. Interactive: toggle between tokens to see how different words create different Q/K/V vectors. |
| **Visual style** | Central token with three beams splitting off, each going through a "lens" (matrix). Clean, geometric, tron-like aesthetic. |
| **Complexity** | ⬢⬢⬡ Medium |

### V17 · The QKV Factory
| Where | §04 — full QKV flow |
|---|---|
| **Teaches** | All tokens simultaneously get transformed into Q, K, V |
| **Interaction** | Full sentence (6 tokens). Each token passes through three parallel matrix multiplications. Animation shows all transformations happening simultaneously. The learner sees 6 embeddings become 6 Queries, 6 Keys, and 6 Values. |
| **Visual style** | Factory assembly line aesthetic. Three parallel conveyor belts (Q, K, V) with tokens flowing through. |
| **Complexity** | ⬢⬢⬢ High |

### V18 · Query Meets Key
| Where | §04 — attention scoring with QKV |
|---|---|
| **Teaches** | Dot product of Query with all Keys produces attention scores |
| **Interaction** | One token's Query arrow shown prominently. All tokens' Key arrows shown as targets. The Query "scans" across all Keys via dot product. Each match produces a score. Build the score row step by step with animation. |
| **Visual style** | Radar/scanning aesthetic. Query arrow sweeps across Keys, producing score readouts. |
| **Complexity** | ⬢⬢⬢ High |

### V19 · Why Q ≠ K Matters
| Where | §04 — justifying three projections |
|---|---|
| **Teaches** | Separating Q and K allows asymmetric relationships |
| **Interaction** | Toggle: "Use raw embeddings" vs. "Use Q/K projections." With raw embeddings → diagonal dominates (self-attention). With Q/K → rich cross-attention patterns emerge. The difference is dramatic. |
| **Visual style** | Before/after toggle. Dramatic visual shift. |
| **Complexity** | ⬢⬢⬡ Medium |

---

## Category 6 — Scaling & Softmax (§04 continued)
*Converting scores to probabilities*

---

### V20 · When Numbers Explode
| Where | §04 — scaling factor motivation |
|---|---|
| **Teaches** | Large dot products cause softmax to saturate |
| **Interaction** | Slider: dimension size (2 → 512). As dimension increases, dot product magnitudes grow. Softmax output becomes more extreme (one token → 99.99%). The learner sees the problem happening live. |
| **Visual style** | Dual display: top = raw scores (bar chart growing taller), bottom = softmax output (distribution collapsing to a spike). |
| **Complexity** | ⬢⬢⬡ Medium |

### V21 · The Scaling Fix
| Where | §04 — √d_k introduction |
|---|---|
| **Teaches** | Dividing by √d_k keeps scores in a good range |
| **Interaction** | Toggle: "Without scaling" vs. "With scaling (÷√d)". Before: extreme softmax. After: reasonable distribution. The fix is revealed as beautifully simple. |
| **Visual style** | Before/after with animation. Extreme spikes melt into reasonable bars. |
| **Complexity** | ⬢⬡⬡ Low |

### V22 · Softmax Returns
| Where | §04 — callback |
|---|---|
| **Teaches** | Softmax converts scores to probabilities (callback to MLP) |
| **Interaction** | Raw attention scores → softmax → attention weights. Step-by-step animation. "Remember this?" link to MLP chapter. |
| **Visual style** | Familiar MLP softmax style but with attention-colored theme (cyan). |
| **Complexity** | ⬢⬡⬡ Low |

### V23 · The Full Scoring Pipeline
| Where | §04 — synthesis |
|---|---|
| **Teaches** | The complete flow: Q·K → ÷√d_k → softmax → attention weights |
| **Interaction** | Full animated pipeline. Data flows through four stages. The learner can pause at any stage and inspect intermediate values. Click "replay" to watch again. |
| **Visual style** | Horizontal pipeline with data flowing left to right. Each stage is a distinct module. |
| **Complexity** | ⬢⬢⬢ High |

---

## Category 7 — Value Blending (§04 end)
*Using attention weights to blend information*

---

### V24 · The Attention Blender
| Where | §04 — weighted sum |
|---|---|
| **Teaches** | Attention weights determine how much of each Value to include |
| **Interaction** | 5 Value vectors shown as colored columns. 5 attention weight sliders. Output is a blended column. Learner adjusts weights → blended color/pattern changes. "Give 80% attention to token 2, 20% to token 4, 0% to the rest." |
| **Visual style** | Colorful mixer/blender metaphor. Values as paint colors being mixed. |
| **Complexity** | ⬢⬢⬡ Medium |

### V25 · Attention = Soft Retrieval
| Where | §04 — conceptual synthesis |
|---|---|
| **Teaches** | Attention is a soft version of array lookup |
| **Interaction** | Two panels. Left: Hard lookup — pick index 3, get only item 3. Right: Soft lookup — attention weights blend ALL items. Toggle between hard (one-hot) and soft (distributed) to see the difference. |
| **Visual style** | Database aesthetic for hard lookup, smooth gradient aesthetic for soft lookup. |
| **Complexity** | ⬢⬡⬡ Low |

### V26 · The Complete Attention Head
| Where | §04 — full single-head animation |
|---|---|
| **Teaches** | The entire single-head attention computation end-to-end |
| **Interaction** | Full animation: input → Q/K/V → Q·K → scale → softmax → ×V → output. All for one sentence. The learner picks which token to follow and watches its journey through the entire attention computation. Can be replayed. |
| **Visual style** | The flagship visualizer. Inspired by bbycroft's LLM Visualization: smooth 3D-like data flow, zoom in/out capability. Tokens as floating cards, computations as connecting streams. |
| **Complexity** | ⬢⬢⬢ Highest |

---

## Category 8 — Multi-Head Attention (§05)
*Multiple parallel attention systems*

---

### V27 · One Head's Dilemma
| Where | §05 — motivation |
|---|---|
| **Teaches** | A single attention head tries to capture all patterns → compromises on everything |
| **Interaction** | Complex sentence with multiple types of relationships. One attention head's pattern is shown — it partially captures syntax, partially captures meaning, but nails neither. Visual: connections are blurry, trying to do too much. |
| **Visual style** | Single head view that looks stressed/overloaded. Blurry, unfocused connections. |
| **Complexity** | ⬢⬢⬡ Medium |

### V28 · The Multi-Lens View
| Where | §05 — multi-head reveal |
|---|---|
| **Teaches** | Multiple heads each specialize in different patterns |
| **Interaction** | 4-8 attention heads displayed as separate heatmaps. Each has a distinct pattern. Learner can: (1) Toggle individual heads on/off (2) See the combined output (3) Click a head to zoom in and see what it specialized in. Labels auto-generated: "This head tracks adjacent words," "This head finds the subject." |
| **Visual style** | Gallery of small heatmaps surrounding a central combined view. Each head has a unique accent color. |
| **Complexity** | ⬢⬢⬢ High |

### V29 · Head Specialization Explorer
| Where | §05 — deep dive |
|---|---|
| **Teaches** | Different heads learn different linguistic patterns |
| **Interaction** | Select from 3-4 example sentences. For each, see all 4 heads' attention patterns. Discover: Head 1 always focuses on nearby tokens, Head 2 always connects subject-verb, etc. Pattern descriptions auto-populate. |
| **Visual style** | Each head represented as a colored lens. Click a lens → expand to see its attention matrix. |
| **Complexity** | ⬢⬢⬡ Medium |

### V30 · The Head Orchestra
| Where | §05 — concatenation + projection |
|---|---|
| **Teaches** | Head outputs are concatenated and projected to final dimension |
| **Interaction** | 4 head outputs (smaller vectors) shown side by side → animation concatenates them into one long vector → linear projection compresses to output dimension. Step by step with pause/play. |
| **Visual style** | Musical orchestra metaphor — individual instruments combine into a symphony. |
| **Complexity** | ⬢⬢⬡ Medium |

### V31 · Head Budget Calculator
| Where | §05 — engineering trade-off |
|---|---|
| **Teaches** | Heads share the total dimension — more heads = smaller per-head dimension |
| **Interaction** | Slider: number of heads (1, 2, 4, 8, 16, 32). Total dim = 512. Per-head dim auto-calculates. Graph shows expressiveness vs. pattern diversity trade-off. Sweet spot highlighted. |
| **Visual style** | Dashboard with animated slider and updating metrics. |
| **Complexity** | ⬢⬡⬡ Low |

---

## Category 9 — Positional Encoding (§06)
*Solving attention's order-blindness*

---

### V32 · The Shuffle Disaster
| Where | §06 — problem discovery |
|---|---|
| **Teaches** | Attention without positions treats "dog bites man" = "man bites dog" |
| **Interaction** | Two sentences with shuffled word order. Attention heatmap shown for both → identical patterns (just rearranged). "Shuffle" button randomly reorders tokens → attention doesn't change. Alarm bell. |
| **Visual style** | Warning aesthetic — red highlights, flashing "identical output!" alert. |
| **Complexity** | ⬢⬢⬡ Medium |

### V33 · Try Simple Numbers
| Where | §06 — first attempt |
|---|---|
| **Teaches** | Adding position integers to embeddings creates scale problems |
| **Interaction** | Add integers (1, 2, 3...) to each embedding dimension. For position 500 → the position value overwhelms the embedding. Show embedding values before (nice small numbers) and after adding position 500 (dominated by 500). |
| **Visual style** | Bar chart of embedding values with position number growing like a skyscraper dwarfing everything else. |
| **Complexity** | ⬢⬡⬡ Low |

### V34 · The Wave Fingerprint
| Where | §06 — sinusoidal encoding |
|---|---|
| **Teaches** | Different frequency waves create unique position fingerprints |
| **Interaction** | 4-6 sine/cosine waves of different frequencies overlaid. Vertical line for "current position" — reads each wave's value. Moving the position slider → different wave readings → unique fingerprint. Two positions side by side for comparison: nearby = similar, distant = different. |
| **Visual style** | Beautiful wave visualization. Smooth, ambient, scientific. Rainbow gradients on overlapping waves. |
| **Complexity** | ⬢⬢⬢ High |

### V35 · Position Similarity Map
| Where | §06 — position patterns |
|---|---|
| **Teaches** | Nearby positions have similar encodings, distant ones differ |
| **Interaction** | Heatmap: position × position. Color = similarity of positional encodings. Beautiful diagonal gradient: bright along diagonal, fading with distance. Hover over a cell to see the two positions and their similarity score. |
| **Visual style** | Heatmap with smooth gradient. Elegant, almost art-like. |
| **Complexity** | ⬢⬢⬡ Medium |

### V36 · Before/After Position Encoding
| Where | §06 — proof it works |
|---|---|
| **Teaches** | With positional encoding, order matters |
| **Interaction** | Toggle button: "Without PE" → "With PE." Without: shuffled sentence gives same output. With: shuffled sentence gives different output → order matters. |
| **Visual style** | Dramatic toggle. Without PE: gray, same. With PE: colors differentiate, outputs differ. |
| **Complexity** | ⬢⬡⬡ Low |

### V37 · Position Encoding Applied
| Where | §06 — embedding + position |
|---|---|
| **Teaches** | Position encodings are added to token embeddings |
| **Interaction** | Token embedding vectors shown as bars. Position encoding vectors shown below them. Animation: position vectors slide up and add to token vectors. Result: new vectors that encode both meaning AND position. |
| **Visual style** | Vertical addition animation. Color mixing: token color + position color = enriched color. |
| **Complexity** | ⬢⬢⬡ Medium |

---

## Category 10 — FFN & Stability (§07 part 1)
*Callbacks to MLP concepts*

---

### V38 · Communication vs Processing
| Where | §07 — FFN motivation |
|---|---|
| **Teaches** | Attention = tokens talking. FFN = tokens thinking. Two complementary operations. |
| **Interaction** | Animation: Phase 1: tokens exchange information (attention beams). Phase 2: each token independently processes what it learned (FFN). Two distinct phases, alternating. |
| **Visual style** | Social vs private metaphor. Phase 1: tokens in a meeting room, connecting. Phase 2: tokens in private offices, computing. |
| **Complexity** | ⬢⬢⬡ Medium |

### V39 · The FFN You Already Know
| Where | §07 — callback |
|---|---|
| **Teaches** | The feedforward network inside a Transformer is the MLP architecture |
| **Interaction** | MLP architecture diagram (callback from MLP chapter) appears with a "You built this!" badge. Input → hidden layer (4× expansion) → ReLU/GELU → output. Interactive: click to review what each layer does. |
| **Visual style** | MLP diagram from previous chapter, embedded in the Transformer block shell. Recognition moment. |
| **Complexity** | ⬢⬡⬡ Low |

### V40 · The Highway Returns
| Where | §07 — residual connections |
|---|---|
| **Teaches** | Residual connections prevent gradient vanishing (callback MLP §07) |
| **Interaction** | The gradient highway visualization from MLP §07, now labeled with "Self-Attention" and "FFN" as the blocks. Brief: "Remember this? Same trick, new context." |
| **Visual style** | Familiar highway visual with new labels. Nostalgia + recognition. |
| **Complexity** | ⬢⬡⬡ Low |

### V41 · LayerNorm Stabilizer
| Where | §07 — layer normalization |
|---|---|
| **Teaches** | LayerNorm keeps activations stable within each token |
| **Interaction** | Show activations before LayerNorm: wildly different scales. After: normalized, stable. Interactive comparison. Brief callback to MLP §07 batch norm → "Transformers use Layer Norm instead — it works per token, not per batch." |
| **Visual style** | Before: erratic bars. After: ordered, stable bars. Calming animation. |
| **Complexity** | ⬢⬡⬡ Low |

---

## Category 11 — Block Assembly & Architecture (§07-§08)
*Putting it all together*

---

### V42 · The Block Builder
| Where | §07 — assembly |
|---|---|
| **Teaches** | The full Transformer block assembled step by step |
| **Interaction** | Drag-and-drop workspace. Available components: LayerNorm, Self-Attention, Residual Add, FFN. The learner places them in order. Wrong order → gentle explanation ("Attention comes before FFN because we need to communicate before processing"). Correct → 🎉 animation + data flow. |
| **Visual style** | Blueprint/workbench aesthetic. Components as physical blocks/modules. Satisfying snap-into-place animation. |
| **Complexity** | ⬢⬢⬢ High |

### V43 · Inside the Block — Data Flow
| Where | §07 — understanding the block |
|---|---|
| **Teaches** | How data actually flows through a Transformer block |
| **Interaction** | Full block diagram with animated data flowing through. Pause at any stage to inspect: input values, attention weights, FFN activations, output values. Token-level view: pick a token and follow it through the entire block. |
| **Visual style** | LLM Visualization inspired. Smooth flowing particles/data streams. Color-coded by stage. |
| **Complexity** | ⬢⬢⬢ Highest |

### V44 · Before and After One Block
| Where | §07 — impact demonstration |
|---|---|
| **Teaches** | One Transformer block enriches token representations |
| **Interaction** | Input embeddings shown as simple colored bars (raw meaning). Output embeddings shown as enriched, more nuanced bars. Side-by-side comparison. Cosine similarity heatmap before → after: more structure emerges. |
| **Visual style** | Before: simple. After: complex, refined. Like comparing a sketch to a painting. |
| **Complexity** | ⬢⬢⬡ Medium |

### V45 · The Block Blueprint
| Where | §07 — reference diagram |
|---|---|
| **Teaches** | Clean standard block diagram for reference |
| **Interaction** | Standard architecture diagram with clickable areas. Each component → tooltip explaining what it does and which section covered it. A reference card the learner can always return to. |
| **Visual style** | Clean, technical diagram. Matches standard Transformer illustrations. Clickable nodes glow on hover. |
| **Complexity** | ⬢⬢⬡ Medium |

### V46 · Layer Evolution
| Where | §08 — stacking blocks |
|---|---|
| **Teaches** | Each layer refines understanding from local → syntactic → semantic |
| **Interaction** | Same sentence processed through 6+ blocks. At each block, show the attention heatmap. Block 1: mostly local attention. Block 3: syntactic structure. Block 6: semantic grouping. Slider to scrub through layers. |
| **Visual style** | Vertical tower with heat maps at each level. Smooth scroll animation. |
| **Complexity** | ⬢⬢⬢ High |

### V47 · The Architecture Tower
| Where | §08 — full architecture |
|---|---|
| **Teaches** | The complete Transformer architecture from embedding to output |
| **Interaction** | Full diagram: Input → Embedding → Positional Encoding → N × [Transformer Block] → Output Projection → Softmax → Probabilities. Each stage is clickable. Model size selector: tiny (1 block) → small (6) → medium (12) → GPT-scale (96). Parameter count and FLOP estimates update. |
| **Visual style** | Towering vertical diagram. More blocks = taller tower. Awe-inspiring at scale. |
| **Complexity** | ⬢⬢⬢ High |

### V48 · Depth vs Quality
| Where | §08 — why depth works |
|---|---|
| **Teaches** | More blocks = better quality generation |
| **Interaction** | Slider: number of blocks (1, 2, 4, 6, 12). For each setting, show pre-computed generation quality. 1 block: gibberish. 6 blocks: coherent. 12 blocks: impressive. Also show validation loss decreasing with depth. |
| **Visual style** | Quality meter/gauge that rises with depth. Generated text samples appear in typewriter animation. |
| **Complexity** | ⬢⬢⬡ Medium |

---

## Category 12 — Training & Generation (§09)
*How it learns and writes*

---

### V49 · The Cheating Problem
| Where | §09 — masking motivation |
|---|---|
| **Teaches** | Without masking, the model sees future tokens and "cheats" |
| **Interaction** | Sentence displayed. Token 5 is being predicted. Without mask: token 5 can see token 5 → just copies the answer → loss = 0 immediately. "That's not learning, that's cheating!" |
| **Visual style** | Warning red aesthetic. "CHEATING DETECTED" alarm. |
| **Complexity** | ⬢⬡⬡ Low |

### V50 · The Causal Mask
| Where | §09 — masking mechanism |
|---|---|
| **Teaches** | The triangular mask prevents looking at future tokens |
| **Interaction** | Attention matrix (N×N). Upper triangle blacked out. Click any token → see which past tokens it can attend to. Toggle mask on/off to see the difference. Animation: -∞ fills the future cells → softmax → 0 weights. |
| **Visual style** | Clean matrix view. Black triangle in upper right. Green in lower left (allowed). Beautiful geometric pattern. |
| **Complexity** | ⬢⬢⬡ Medium |

### V51 · Growing Masks
| Where | §09 — mask at each position |
|---|---|
| **Teaches** | Each position sees more context than the previous |
| **Interaction** | Animated: Position 1 — sees only itself. Position 2 — sees positions 1-2. Position N — sees everything. The visible area "grows" with each step. Step through positions 1→N to see the growing context. |
| **Visual style** | Triangle fills in step by step. Growing pool of accessible tokens. |
| **Complexity** | ⬢⬢⬡ Medium |

### V52 · Training Efficiency
| Where | §09 — parallel training |
|---|---|
| **Teaches** | Unlike MLP (one prediction per forward pass), Transformer generates N predictions simultaneously |
| **Interaction** | Side by side: MLP processes one input → one prediction. Transformer processes N tokens → N simultaneous predictions (one for each position). Efficiency multiplier display: "10 tokens → 10× more efficient." |
| **Visual style** | Split screen. MLP: single arrow. Transformer: N arrows simultaneously. |
| **Complexity** | ⬢⬡⬡ Low |

### V53 · Training Dashboard
| Where | §09 — training visualization |
|---|---|
| **Teaches** | How the model improves during training |
| **Interaction** | Simulated training loop. Loss curve descending. Attention patterns evolving (from random → structured). Generated text improving (from gibberish → coherent). Three panels updating together. |
| **Visual style** | Dashboard aesthetic. Three panels in a row: loss curve, attention heatmap, text output. All updating in sync. |
| **Complexity** | ⬢⬢⬢ High |

### V54 · Token by Token Generator
| Where | §09 — generation process |
|---|---|
| **Teaches** | Autoregressive generation one token at a time |
| **Interaction** | Starting from a prompt. At each step: (1) Process entire sequence through Transformer (2) See attention patterns (3) See probability distribution for next token (4) Sample a token (with temperature slider) (5) Add to sequence (6) Repeat. The learner controls the pace — step through manually or auto-play. |
| **Visual style** | The headline visualizer. Full animation with growing sequence, expanding attention matrix, probability bars, sampled token dropping into place. |
| **Complexity** | ⬢⬢⬢ Highest |

### V55 · Growing Context Window
| Where | §09 — context visualization |
|---|---|
| **Teaches** | Each new token enlarges the context for all future predictions |
| **Interaction** | As tokens are generated, the context window grows. Show the attention matrix expanding: 1×1 → 2×2 → 3×3... For each new token, show what it attends to. |
| **Visual style** | Growing square matrix. New row/column appears with each generated token. Satisfying expansion animation. |
| **Complexity** | ⬢⬢⬡ Medium |

---

## Category 13 — Closure & Celebration (§10)
*Look how far we've come*

---

### V56 · Generation Gallery
| Where | §10 — quality comparison |
|---|---|
| **Teaches** | The dramatic quality improvement from Bigram to Transformer |
| **Interaction** | All 5 models generate text from the same prompt simultaneously. Side-by-side comparison: Bigram (gibberish) → N-gram (slightly better) → MLP (coherent fragments) → Transformer (impressive coherence). Swap prompts to see multiple examples. |
| **Visual style** | Exhibition gallery aesthetic. Each model's output on a separate card. Quality gradient from left (poor) to right (excellent). |
| **Complexity** | ⬢⬢⬢ High |

### V57 · The Architecture Journey
| Where | §10 — evolution timeline |
|---|---|
| **Teaches** | The progression from simple counting to attention |
| **Interaction** | Horizontal timeline. Each architecture stage shows: icon, key innovation, capability gained. Animation scrolls through the journey. Monster emoji evolves at each stage. |
| **Visual style** | Beautiful timeline. Animated transitions between stages. Each stage lights up as you scroll past. |
| **Complexity** | ⬢⬢⬡ Medium |

### V58 · The Wishlist — Complete ✓
| Where | §10 — callback |
|---|---|
| **Teaches** | Every limitation from MLP has been addressed |
| **Interaction** | The Architecture Wishlist from V04 (and MLP §09). All 4 items now checked off with the component that solved each one. Satisfying check animation. |
| **Visual style** | Checklist card with all green checkmarks. Celebration animation. |
| **Complexity** | ⬢⬡⬡ Low |

### V59 · The Complete Architecture — Interactive Reference
| Where | §10 — reference |
|---|---|
| **Teaches** | The full Transformer as one explorable diagram |
| **Interaction** | Beautiful full-page interactive Transformer architecture. Click any component → zoom in → see its internals. Zoom back out. This is the "poster" visualizer — the one that captures the whole chapter in a single view. |
| **Visual style** | The crown jewel. bbycroft-inspired. Clean, modern, zoomable. A visual masterpiece that could be printed as a poster or shared as a reference. |
| **Complexity** | ⬢⬢⬢ Highest |

### V60 · Scaling Laws Teaser
| Where | §10 — bridge to next chapter |
|---|---|
| **Teaches** | Transformers scale predictably with more data and parameters |
| **Interaction** | Log-log plot: parameters vs. performance. Smooth curve showing predictable improvement. Point out where GPT-2, GPT-3, GPT-4 would sit. "More data + more parameters + the right architecture = reliably better performance." |
| **Visual style** | Clean scientific plot. Notable models marked. Curve continues into "the future" with a dotted line. |
| **Complexity** | ⬢⬡⬡ Low |

---

## Summary Statistics

| Category | Visualizers | Section |
|---|---|---|
| Problem Discovery | V01-V04 (4) | §01 |
| RNN Context | V05-V07 (3) | §02 |
| Attention Intuition | V08-V12 (5) | §03 |
| Scoring Mechanism | V13-V15 (3) | §04a |
| Query/Key/Value | V16-V19 (4) | §04b |
| Scaling & Softmax | V20-V23 (4) | §04c |
| Value Blending | V24-V26 (3) | §04d |
| Multi-Head Attention | V27-V31 (5) | §05 |
| Positional Encoding | V32-V37 (6) | §06 |
| FFN & Stability | V38-V41 (4) | §07a |
| Block Assembly & Architecture | V42-V48 (7) | §07-§08 |
| Training & Generation | V49-V55 (7) | §09 |
| Closure | V56-V60 (5) | §10 |
| **Total** | **60** | |
