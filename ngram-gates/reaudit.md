# N-gram Widget Re-audit — Fresh-Eyes Review
**Date:** 2026-06-09  
**Method:** DOM inspection + source code analysis (screenshot renderer unavailable — prefers-reduced-motion off, Framer Motion confirmed active)  
**Auditor:** Independent fresh-eyes agent — no prior exposure to widget designs or narrative

---

## METHODOLOGY NOTE

The `preview_screenshot` tool timed out on every attempt (5+ retries, server restart, viewport resize — all failed). The audit was conducted via:
- Detailed DOM inspection: element positions, sizes, computed styles, background colors, transform values, font sizes
- Live state capture before and after every button click
- Full source code read of all four components (BigModelLimit.tsx, RowSummer.tsx, QuantumElephant.tsx, ExplosionZoom.tsx)

This gives a reliable picture of rendered geometry, element hierarchy, visual structure, and interaction flow, though it cannot capture animation timing or subtle color rendering nuances.

---

## ng-rowsummer (RowSummer)

### Initial state
A large number "0" (56px, accent-colored) with label "filas en la tabla" at 11px, and a single button "contar la «a»". Nothing else is visible.

### After clicking
The widget expands to show:
- **Hero count** climbs from 0 → 27 (one full family "a") as rows fill live
- **LEFT panel** (462×403px): A card with header "a / familia «a» · 27 filas" + 27 rows, each 11px tall with an 8px heat-strip bar (gradient background encoding count distribution) and a row total number at 10px
- **RIGHT wall** (200×403px): A smaller card showing "1 / 27 familias en la tabla" at 22px + a 27×27 grid (729 cells) where only the first column spine is lit

### 1. What is this and what do I do FIRST?
You see "0 / filas en la tabla" and a single button "contar la «a»". Action is obvious. You click the button.

### 2. HERO (single most important thing)?
The climbing number in the hero. It goes 0 → 1 → 2 ... → 27, and the rows visibly appear one-by-one in the left panel. The number is 56px and accent-colored — unmissable.

### 3. Step-by-step or lost?
Guided. After each family, the next button appears: "añadir la «b» · +27", then "añadir la «c»", then "completar el abecedario". The progression is explicit.

### 4. Competing / illegible / ugly elements

**Panels as surfaces:** The left and right panels DO render as distinct raised cards (background: var(--ngram-surface), border: 1px solid rule-2, subtle shadow). They are visually distinct from the page. This reads clearly as a panel.

**Row heights:** Each row is only 11px tall, strip bars only 8px. At 27 rows all simultaneously visible, these are very compact. The rows are readable but borderline — the context labels ("a␣", "ab", "ac"…) are 11px mono and the total numbers are 10px. At this density they function as a heat-map strip rather than individual readable rows. This is acceptable given the intent (you are watching a family, not reading individual rows), but it is dense.

**Empty vs filled rows:** UN-filled rows have `opacity: 0.4` and `transform: translateX(-5px)` — they appear faded and slightly indented. Filled rows snap to full opacity and translate back to 0. This is a clear, visible difference. The strip background switches from a near-transparent rule-2 tint to the actual heat gradient — the distinction IS there when rows fill. However, because the strips are only 8px tall, the visual "pop" of a new row appearing requires close attention.

**Right wall grid:** The 27×27 grid has cells that use `background: transparent` for unbuilt spines (opacity 0.14) vs colored heat values for built ones. The contrast between "has data" and "does not exist yet" is visible at the opacity level. However: the grid is 174×331px with 27×27 = 729 cells, each approximately 6×12px — the scale visualization IS there and does grow family by family. Unlit spines fade nearly to invisible (opacity 0.14) which is good but borderline for confirming "these slots exist and are empty."

**The "1/27" counter:** Shows "1 / 27 familias en la tabla" at 22px bold on the right wall. The fraction makes the growth readable and unambiguous.

**Clicking visibly changes things:** YES. Count climbs, rows fill, wall gains a column. The state change on click is immediately visible within ~2 seconds of animation.

**Biggest issue:** The left panel's row labels and strip heights (8px bars, 11px rows, 10px totals) are very small. A first-time viewer scanning quickly may not notice that the strips are heat-encoded counts rather than just decorative lines. The DISTRIBUTION information (the actual bigram probabilities) is easy to miss because the bars are barely taller than a hairline in proportion to the card. The viewer might read this as "rows appearing" without understanding what the color variation encodes.

**VERDICT: CLEAR**  
The core mechanic (count builds, wall grows) is immediately obvious. The small strip height is a legibility concern but does not prevent understanding.

---

## ng-zoom (ExplosionZoom)

### Initial state
- Hero eyebrow: "la tabla entera necesita" + large number "27" (56px, colored) + unit "filas"
- A 380×380px square frame containing a 1×27 heat-strip of cells (the bigram — very visible, colored cells 11px wide × 32px tall)
- A reference text "esto es un bigrama ·" at 19px
- A caption at 11px: "una letra más = la tabla ×27 · el bigrama amarillo no cambia de talla"
- A row of 6 buttons: **bigrama** (active), trigrama, 4-grama, 5-grama, 8-grama, 10-grama

### After clicking trigrama
- Counter → 729
- Frame still 380×380px but now contains a 27×27 matrix of small cells
- The yellow reference patch should shrink to 1/27 of the frame (one row's worth)

### After clicking 5-grama
- Counter → "531.441" (531,441)
- Frame still 380×380px
- Individual cells collapse to 0×0 — the matrix has more rows than pixels; it renders as a solid painted plane via CSS mesh
- Caption changes to indicate scale

### After clicking 10-grama
- Counter → "≈ 7,63 × 10¹²"
- A `nw-ez__break` overlay (182×139px, nearly-opaque dark background) appears with text: "Sigue subiendo y se requieren más filas que átomos en el universo observable."
- Yellow patch: 0×0 (sub-pixel speck, functionally invisible — which is the point)
- A speck callout label "ese punto es un bigrama entero" appears (190×38px) with a line pointing to the vanished yellow patch

### 1. What is this and what do I do FIRST?
You see "la tabla entera necesita 27 filas" and a row of buttons (bigrama · trigrama · …). The ladder is unmistakable. You click the next button.

### 2. HERO?
The number climbing (27 → 729 → 19.683 → 531.441 → ≈ 7.63×10¹²) is the obvious focal point. At bigrama the 27 cells in the frame are the visual explanation; the number and the picture match.

### 3. Step-by-step or lost?
The button row is clear. Each click changes the number and the frame content. At the low end (bigrama → trigrama → 4-grama) the picture changes dramatically and visibly. The scale growth reads.

### 4. Competing / illegible elements

**Does it start small and visibly EXPLODE?** At bigrama the frame shows 27 distinct colored cells — you can see individual cells and they look like "a small table." This is good. At trigrama the 27×27 matrix appears (729 cells, each ~13×13px) — distinctly denser than bigrama. At 4-grama and beyond, cells become sub-pixel and the frame fills as a solid painted mesh. The visual transition from "you can see individual cells" to "this is now a solid wall" happens between trigrama and 4-grama, and it reads as explosion.

**The yellow reference patch:** The design intent is for the bigram-sized yellow patch to shrink and become a speck. However, at trigrama the yellow element shows as 0×0 (not visually present). The yellow patch exists in the DOM as `.nw-ez__yellow` but its rendered size at multiple steps is 0×0. This is a potential issue: the "constant yellow reference that shrinks" may not be visible, which would mean the viewer cannot make the comparison that the bigram (27 rows) is getting dwarfed. If the yellow patch is not visible from trigrama onward, the scale comparison loses its visual anchor. At 10-grama there IS a callout "ese punto es un bigrama entero" but the point it refers to (the .nw-ez__yellow) is 0×0 — sub-pixel. The callout text at 190×38px is there but the POINT it points to may be invisible, making the callout orphaned. This needs verification in a real browser.

**The break overlay at 10-grama:** The `.nw-ez__break` element (182×139px, dark background at 0.9 opacity) appears inside the frame and contains the "más filas que átomos" text. This is readable at the center. The break is intentional (as per spec) and the text reads correctly.

**Caption at 11px:** All captions are 11px. At the trigrama step it reads "una letra más = la tabla ×27 · el bigrama amarillo no cambia de talla." The phrase "el bigrama amarillo" refers to the yellow patch — if the yellow patch is not visible, this caption makes no sense to a first-time viewer.

**Biggest issue:** The yellow reference patch (the "bigrama amarillo") appears to render at 0×0 from trigrama onward in the DOM measurements. If this is confirmed in the real browser, the central pedagogical device of the widget — comparing the growing table to a FIXED bigram-sized yellow patch — is invisible. A viewer would see the counter grow and the matrix fill, but without the yellow anchor the visual comparison fails. The caption references it, the callout references it, but the thing itself is gone.

**VERDICT: CONFUSING** (conditionally — if yellow patch is invisible from trigrama onward the core mechanic breaks; the number climbs but the visual SIZE comparison is lost)

---

## ng-elephant (QuantumElephant)

### Initial state
- Two tabs at top: "«the brown dog is here»" (active) and "«the quantum elephant sat»"
- Key area: "busca la fila de estas 4 letras" + a word display showing "the" broken into characters (t, h, e, space) at 47px height
- A table minimap on the left (30×162px, with 3px-tall tick marks)
- A histogram showing 6 rows: p(9%), s(9%), c(9%), w(7%), m(6%), t(6%) with "+18 letras más"
- Verdict area: "lee la fila y escribe ·"
- Output area: "lo que escribe: the_"
- Two buttons: "SIGUIENTE LETRA (1)" and "Auto"

### On tab 1 ("the brown dog is here")
Histogram bars are fully colored (all at max width = 477px = track width). The percentages shown at 18px mono are legible. The word being written fills the output area.

### On tab 2 ("the quantum elephant sat") — THE KEY STATE
After clicking Auto and advancing to the break point:
- The verdict reads: "no hay nada que leer → escribe··quan?????????????"
- The key area shows: "busca la fila de estas 4 letras" + the word "the" (still showing "the" as context) + a **break tag**: "se rompió en «quan» · sin fila desde aquí"
- The break tag is 309×25px, 11px font, weighted (600), colored (warm amber/orange accent color)
- The histogram still shows the old "the" data (p9%, s9%, c9%, all bars full-width) — it has NOT updated to show an empty row for the failed lookup

### 1. What is this and what do I do FIRST?
Two tabs with phrases, and a "SIGUIENTE LETRA" button. The mechanic is clear: advance through the phrase one letter at a time and watch what happens.

### 2. HERO?
On tab A, the hero is the growing output line (letters being written one by one). On tab B, the hero is the moment the output line dissolves into "?????????????" — a visceral visual collapse. The output text in the output area is the main attraction.

### 3. Step-by-step or lost?
On tab A, very guided — the word characters (47px, very readable) + the histogram + the output line tell the story clearly step by step. On tab B, after the break, the output shows ??? characters. This reads as broken/wrong immediately.

### 4. Competing / illegible elements

**Is it obvious WHICH word broke it on tab B?** The break tag reads "se rompió en «quan» · sin fila desde aquí" at 11px. The word «quan» IS named explicitly in the break tag. However:
1. The break tag is 11px — very small relative to the 47px word display above it and the overall widget
2. The histogram does NOT update to an empty/zero state — it still shows the "the" distribution with all bars full. A first-time viewer might be confused about what they are looking at: are these the percentages for the failed row (they look full and healthy) or for a previous step?
3. The key display continues showing "the" as the query word even after the break. The viewer may not immediately realize that the CONTEXT WINDOW has shifted and "quan" is now the failure point.

**The map (minimap):** 30px wide with 3px tick marks is functional but essentially decorative at this size. It's hard to read as a "position in the table" for a first-time viewer. The zoom element (11×27px) acts as a pointer between the map and the histogram, which is a nice design touch but easy to miss at this size.

**Bar chart legibility:** The hbars are 477px wide at max (full track width). At 9% vs 7% vs 6%, all bars appear at near-maximum width because they are normalized to the MAX value (the p=9% bar is 100% width, s=9% is also 100%, c=9% is 99.4%, w=7% is 78%, m=6% is 69%, t=6% is 69%). This is good design — the histogram shows RELATIVE distribution within the row, not absolute counts. A viewer can immediately see which letters are most likely.

**Histogram not resetting to empty on break:** This is the most significant issue. When the model hits the void ("quan" has no row), the histogram stays frozen at the last seen "the" distribution. The design says "no hay nada que leer" in the verdict, and the break tag says "sin fila," but the histogram still shows 6 full-looking bars at 9-6%. A first-time viewer may think: "wait, there IS data (6 bars), why does it say nothing to read?" The mismatch between the histogram state and the verdict creates confusion.

**"OTRA VEZ ↻" at completion:** Once the full phrase has been generated, the button changes to "OTRA VEZ ↻" — clear and appropriate.

**Biggest issue:** When the model breaks on tab B, the histogram should show a clearly empty/zero state (or be hidden/replaced) to make the "no hay fila" verdict coherent. Currently it shows the last real distribution (from "the") and the confusion between "I see data" and "it says no data" is the key legibility failure. The break tag text IS correct but is 11px and easy to miss.

**VERDICT: CONFUSING** (histogram stays full even when the model has broken — creates direct contradiction between what you see and what the verdict says)

---

## ng-limit (BigModelLimit)

### Initial state
- Pill badge: "ejemplo · ilustrativo" (10px mono)
- Caption: "la tabla vio «el perro duerme» muchas veces · nunca «el gato duerme»" (11px)
- A sidebar minimap ("la tabla / 19.683 filas") — a 40×296px column with 60 horizontal tick marks (1px each, spaced ~5px apart) — representing the 19,683 rows of the table
- Two prompts centered: «el perro ____» and «el gato ____» at ~19-21px serif
- Explanatory text: "Misma respuesta para ti. Para la tabla, dos filas distintas a miles de filas de distancia." at 14px serif, muted
- Button: "escribir «el perro»"

### After clicking "escribir «el perro»"
A RowCard appears for el perro:
- Header: "fila llena / fila n.º 13.623" (accent colored for "fila llena", muted for ordinal)
- Bar chart: 4 bars (duerme, ladra, corre, come) with percentages (70%, 16%, 9%, 5%)
- Output: "escribe «el perro duerme» 70%"
- The minimap's lens travels to row 13,623 position (a Framer Motion spring animation)

### After clicking "ahora «el gato»"
Two RowCards visible simultaneously with a separator:
- **Perro card** remains (unchanged)
- **Separator**: "12.339 filas de distancia · sin puente" (9.5px mono, with dashed lines)
- **Gato card** appears: "fila vacía / fila n.º 1284"
  - Bar labels: duerme, ladra, corre, come — all showing "0 %"
  - **Bar areas: hairline elements (1px tall, near-transparent rule color)** instead of colored bars
  - Output: "no escribe «el gato ____» · sin datos · 0 %"
  - The minimap lens travels FAR UP to row 1,284 (a long spring animation showing distance)
- Closing line appears: "sabe escribir «el perro» de memoria — nunca «el gato»"

### 1. What is this and what do I do FIRST?
Two blank sentence frames + a button "escribir «el perro»". The "ejemplo · ilustrativo" badge tells you this is demonstrating something. The action (click the button) is obvious.

### 2. HERO?
The comparison between the two RowCards once both are revealed: one card bright and filled with bars (el perro), one card dim and empty (el gato). The minimap lens traveling between them is a secondary hero.

### 3. Step-by-step or lost?
Very clearly guided: one button per phase. The reveal is deliberate — you see el perro succeed, THEN you see el gato fail. The distance separator makes the gulf between them explicit.

### 4. Competing / illegible elements

**Do empty "0%" bars clearly look EMPTY?** YES, definitively. The source code confirms and the DOM confirms:
- El perro bars: 13px tall tracks with a colored heat fill (Framer Motion `scaleX` animation from 0 to target)
- El gato bars: 1px hairlines (`height: 1px, background: var(--ngram-rule-2)`) — these replace the entire bar structure when `empty=true`

The design choice to use hairlines instead of zero-width bars is correct and clear. A first-time viewer will see el gato's bar chart as having no bars — just four thin scratches where bars should be. Combined with the "0 %" labels and "no escribe" text, the empty state is unambiguous.

**Note on animations:** The Framer Motion `scaleX` bars for el perro start at `scaleX(0)` and animate to their target values. This was observed in the DOM as still scaleX(0) (the JS eval captured a static snapshot before animation completed). In a real browser the bars animate in smoothly. Given the source confirms `transition: duration: 0.5, delay: 0.1`, the bars will fill in visibly within half a second of the card appearing.

**Minimap:** The lens travel between perro (row 13,623 = ~69% down) and gato (row 1,284 = ~6.5% down) uses a spring animation that traverses a large fraction of the minimap height. The 60 tick marks (1px each at 5px intervals) give scale to the minimap. However, the minimap is only 40px wide — it functions as a scale indicator but is not the focal element. The distance label "12.339 filas de distancia · sin puente" at 9.5px mono (uppercase, letter-spaced) is easy to skim past despite being important.

**"ejemplo · ilustrativo" badge:** This honest framing is clearly placed at the top but at 10px it could be missed. A viewer who skips the badge might think they are seeing measured Shakespeare data for dog/cat sentences, which they are not. The badge is styled in the accent color, which helps, but it is the smallest element on the page.

**Biggest issue:** The minimap tick marks and the distance separator both communicate the spatial gap between rows, but the minimap's 40px width limits how dramatically the lens travel reads. The spring animation (spring: stiffness 58, damping 18) will take ~1.5-2 seconds to settle — the lens travel IS the scale proof, and it needs to be watched to land. In a rushed reading, the distance could be missed.

**VERDICT: CLEAR**  
The empty vs full bar contrast is crisp and unambiguous. The comparison is well-paced. Minor concern about the small minimap and distance label size.

---

## Summary Table

| Slug | VERDICT | Biggest Remaining Issue |
|------|---------|------------------------|
| ng-rowsummer | CLEAR | Row strips (8px bars) are very small — distribution encoding in strips easy to miss; the pedagogical content is "rows appearing" not "read the bar values," so this is acceptable but dense |
| ng-zoom | CONFUSING | Yellow reference patch ("bigrama amarillo") appears to render at 0×0 from trigrama onward in DOM measurements — if invisible in the browser, the central scale-comparison mechanism is broken; caption references it but the patch is gone |
| ng-elephant | CONFUSING | On tab B (quantum elephant), the histogram does NOT update to empty/zero state when the model breaks — it stays frozen at the last seen "the" distribution (full-looking bars), directly contradicting the "no hay nada que leer" verdict; break tag naming the failure word is present but at 11px and easy to miss |
| ng-limit | CLEAR | Empty bars are hairlines (excellent — unambiguous); minor issue is the distance label at 9.5px and the minimap at 40px width are easy to skim past, but the two-card comparison is the dominant hero and it reads clearly |

---

## Priority Fixes

1. **ng-elephant (HIGH):** When the model breaks on an empty row, the histogram should switch to a clearly-empty state (all bars at 0, or the entire histogram replaced with a "fila vacía" indicator). Currently showing stale data from "the" row while saying "no hay nada que leer" is a direct contradiction that confuses the narrative.

2. **ng-zoom (HIGH):** Verify whether the yellow reference patch is visible at trigrama, 4-grama, and 5-grama in the real browser. If it is invisible (sub-pixel or 0×0), the scale comparison is lost and the caption/callout become orphaned references to a thing the viewer cannot see. The break-even point between "bigram as visible reference" and "bigram as invisible speck" is the heart of the widget's pedagogy.

3. **ng-elephant (MEDIUM):** The break tag "se rompió en «quan» · sin fila desde aquí" is 11px. Consider increasing its size or using the break tag as the dominant text in the key area when the phrase has broken, so the failure word is unmissable.

4. **ng-rowsummer (LOW):** The 8px strip bars are functional but tight. If this widget's goal includes teaching that each row has a real distribution (not just "a row exists"), consider increasing the strip height slightly or adding a hover interaction that reveals the top 3 followers for a row.
