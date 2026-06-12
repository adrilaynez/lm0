# Blind Fresh-Eyes Audit — N-gram Widgets
**Date:** 2026-06-09  
**Auditor context:** Independent reviewer. Only knows these are figures from a lesson about simple language models that count letter patterns, progressing from small to bigger models. No source code read. Judgment based purely on screenshots and DOM-derived text.  
**Method:** Navigate each slug at `/es/lab/bench?w=<slug>&theme=dark&bare=1`, screenshot initial state, exercise main button(s), screenshot resulting state(s). Answer 4 questions blind, give a one-word verdict.

---

## ng-rowsummer

### Screenshots / Observed States

**Initial state:** Near-empty dark screen. Only visible elements: a large "0" with label "FILAS EN LA TABLA" in amber mono, and a single amber pill-button "CONTAR LA «A»". The rest of the canvas is invisible — a large dark rectangle with no discernible content.

**After one click:** Still appears empty. Counter still reads 0. The DOM confirms rows are loading (13 rows added) but they render with very low contrast in the dark theme — panel background `oklab(0.15)` against body background `lab(2.75)` makes the panel nearly invisible. Screenshot captures this as a blank area.

**After many clicks (all 27 rows fully animated):** Now the full layout is visible: left panel "a / familia «a» · 27 filas" with a list of 27 rows, each showing a 2-letter context key (e.g., "a."), a horizontal gradient bar, and a count number on the right. Right panel: "1 / 27 FAMILIAS EN LA TABLA" with a thin colored side strip. Large amber counter: "27 FILAS EN LA TABLA". At bottom: "la «a» aportó sus 27 filas · 26 familias por contar" and next button "AÑADIR LA «B» → +27".

**After progressing to «B»:** Counter now "54", the left panel updates to show the «b» family rows with its 27 entries, same layout.

### Four-question assessment

**1. What is this, and what do I do FIRST?**  
There is a big "0" and a button labeled "CONTAR LA «A»". I click that button. The entry point is immediately obvious. However, for the first ~2 clicks nothing visibly changes — the counter stays at 0 and the area below remains dark. A first-time viewer would likely click once and think nothing happened, then click again wondering if it's broken. The reveal only becomes visible after the full animation (27 clicks worth of progress) completes. The step-by-step counting that "slowly builds" is essentially invisible until completion.

**2. What is the single most important thing — the HERO?**  
Once visible, the hero is: *one letter of the alphabet owns 27 rows in this table, and you're adding all 27 letters one by one*. The counter "27 FILAS EN LA TABLA" and the gradient bar-chart panel together communicate "rows are accumulating." The concept is about table size growing family by family.

**3. Does it take you by the hand step-by-step, or are you lost?**  
Conceptually, yes — the button text always tells you the exact next action ("CONTAR LA «A»", "AÑADIR LA «B»"). The step-by-step flow is good. But the visual execution of each step is nearly invisible: the row-by-row animation happens inside a panel whose background blends into the page. You must trust the process blindly. The right-side panel ("1/27 FAMILIAS EN LA TABLA") is hard to read and its purpose isn't immediately apparent.

**4. What competes for attention or gets in the way? Anything illegible, too small, cluttered, or ugly?**  
- **Critical:** The entire lower stage area (panel + row bars) is nearly invisible in dark mode. The low-contrast panel background (dark brown on near-black) makes the content unreadable during intermediate states. You only see the result after the final animation completes and even then it took many clicks.  
- The gradient bar strips in each row are attractive when visible but the text labels (2-letter context keys, numbers) are tiny (11px mono) and hard to read.  
- The right-side "wall" panel (1/27 families counter) is a thin strip — its purpose is unclear without reading the counter label.  
- The initial state communicates nothing except "click me" — there is no preview of what will be built, so a stranger doesn't know if this is a counter, a chart, a matrix, or something else.

### Verdict: **CONFUSING**  
The main idea (building a table family by family) doesn't land until after full completion, and the intermediate states are visually invisible due to near-zero contrast between panel background and page background. The step-by-step guidance is there but it's guiding you through darkness.

---

## ng-counting

### Screenshots / Observed States

**Initial state:** "the cat sat on the mat" displayed large at the top. Subtitle: "la misma cuenta que el bigrama · solo cambia la clave de la fila". Label in amber: "CLAVE DE LA FILA: 2 LETRAS · COLUMNA: LA LETRA SIGUIENTE". Two buttons: amber "SIGUIENTE →" and ghost "COMPLETAR". Panel below says: "pulsa **siguiente** y mira crecer la tabla, pareja a pareja." Clear and inviting.

**After clicking SIGUIENTE once:** "th" highlighted in the sentence, arrow "→ e +1" shown. The label still shows, the counter says "1 fila · 1 / 20 parejas". A matrix row appears: row key "th →", columns showing letter headers (_ a c e h m n o s t), with a "1" in the "e" column highlighted.

**After clicking COMPLETAR:** Full matrix revealed. Counter: "15 filas · 20 / 20 parejas". Each word in "the cat sat on the mat" is highlighted in sequence (currently "mat"). The matrix shows all 15 distinct 2-letter contexts (th, he, e_, _c, ca, at, t_, _s, sa, on, n_, _t, _m, ma) with count dots in the appropriate columns. Final label: "20 parejas contadas · la tabla es el trigrama". Button "REINICIAR".

### Four-question assessment

**1. What is this, and what do I do FIRST?**  
I read "the cat sat on the mat" and see instructions telling me to "pulsa siguiente y mira crecer la tabla, pareja a pareja." The amber "SIGUIENTE →" button is the obvious entry point. Very clear — this is the best-signposted entry point of all six widgets.

**2. What is the single most important thing — the HERO?**  
The hero is: *each 2-letter chunk in the sentence becomes a row in a table, and the next letter after it becomes a tally mark in that row's column.* The matrix growing pair by pair is exactly that concept made visible. Well executed.

**3. Does it take you by the hand step-by-step, or are you lost?**  
Completely hand-held. The sentence highlights the current pair, the matrix cell highlights where the count goes, the counter tracks progress. COMPLETAR lets you skip to the end. Reiniciar resets it. No confusion about what to do at any point.

**4. What competes for attention or gets in the way? Anything illegible, too small, cluttered, or ugly?**  
- The matrix rows and column headers are small (11px mono) but legible enough at 1040px width.  
- The column header row ("PAREJA: _ a c e h m n o s t") is a bit cryptic on first read — "PAREJA:" label with underscore as a column is not immediately intuitive (is underscore a space character? a wildcard?).  
- The count dots in the matrix are dim when zero — they look like placeholder circles and could be confused with visual decoration rather than empty cells.  
- Minor: the "la misma cuenta que el bigrama" subtitle disappears after clicking and is replaced by "CLAVE DE LA FILA: 2 LETRAS" — slight narrative discontinuity but not a problem.  
- The overall layout is clean and elegant.

### Verdict: **CLEAR**  
The concept (pairs of letters map to rows, the next letter maps to a column) is immediately grasped from the animated reveal. A stranger understands it in under 5 seconds of interaction.

---

## ng-void

### Screenshots / Observed States

**Initial state:** Top: "531.441 casillas · 4 letras de memoria" in large amber number. A large dark grid with a faint hint overlay "pulsa AUTO y vierte texto →". Below: "0.0% LLENO", progress bar showing "100.0% vacío", "0 de 531.441 casillas con datos". Right side: "ENTRENADO CON / *nada todavía* / la tabla recién creada". Button "▶ AUTO". Bottom caption: "UNA CASILLA POR CADA COMBINACIÓN POSIBLE DE 4 LETRAS · CASI TODAS EN CERO".

**After clicking AUTO (completed):** The grid now has scattered golden/amber dots — maybe ~4% of cells lit. Bottom: "4.3% LLENO", progress bar with a tiny sliver filled (95.7% empty), "22.852 de 531.441 casillas con datos". Right: "ENTRENADO CON / *todo Internet* / *proyección · el techo de 4 letras*". Button "▶ OTRA VEZ". Caption: "TODO INTERNET VERTIDO · Y LA TABLA SIGUE CASI ENTERA EN GRIS: LA MAYORÍA DE LAS COMBINACIONES DE 4 LETRAS NO EXISTEN".

### Four-question assessment

**1. What is this, and what do I do FIRST?**  
The hint inside the grid "pulsa AUTO y vierte texto →" and the button "▶ AUTO" give a clear directive. The number "531.441" is prominent and immediately signals scale. I click AUTO and watch what happens. Entry point is clear. The visual before clicking is deliberately void — which is thematically appropriate.

**2. What is the single most important thing — the HERO?**  
The hero is: *even after training on all of the internet, this table — which has 531,441 slots — is 95.7% empty.* The constellation of scattered dots on an almost-completely-dark grid is a beautiful, immediate visual metaphor for "almost nothing was seen." The 4.3% / 95.7% readout reinforces this.

**3. Does it take you by the hand step-by-step, or are you lost?**  
There is only one action (click AUTO) and then you watch an animation. No confusion about sequence. The before/after is stark and immediate. The explanatory caption at the bottom reinforces the meaning after the fact. Well-paced.

**4. What competes for attention or gets in the way? Anything illegible, too small, cluttered, or ugly?**  
- The "531.441" hero number is genuinely striking, but it appears as a bare number without any visual sense of magnitude before clicking. You have to know what 531,441 looks like to feel its size. However, once the full grid reveals and you see all those dark cells, the magnitude becomes visceral. This resolves on interaction.  
- The right-side readout ("ENTRENADO CON / *proyección · el techo de 4 letras*") uses italic serif for labels — it's elegant but "proyección · el techo de 4 letras" is a bit abstract on first read. What is "el techo"? In context it makes sense but cold it's slightly obscure.  
- Progress bar: the fill is so tiny (4.3%) that the bar barely registers as filled. This is intentional but could make the percentage hard to read visually. The text backup helps.  
- The grid dots are very small — individually illegible — but that's appropriate: they're meant to communicate density pattern, not individual values. Works.

### Verdict: **CLEAR**  
The main idea (the table is almost entirely empty) is communicated instantly and viscerally by the sparse-dot grid. One of the strongest visualizations in the set.

---

## ng-elephant

### Screenshots / Observed States

**Initial state:** Two sentence tabs at top: "«the brown dog sat»" (selected, amber) and "«the quantum elephant sat»". Label "BUSCA LA FILA DE ESTAS 4 LETRAS". Highlighted sequence: "the " (current 4-letter key). Bar chart: top predictions with labels p, s, c, w, m, t and percentages 9%, 9%, 9%, 7%, 6%, 6%. "+18 letras más" beneath. Instructional text: "lee la fila y escribe ►" with a cursor icon and "LO QUE ESCRIBE: the_|". Buttons "SIGUIENTE LETRA (1)" and "AUTO".

**During AUTO animation (mid-state, step 2):** Sequence "the b" now highlighted in "LO QUE ESCRIBE". Counter shows "SIGUIENTE LETRA (2)". Bar chart updated. "b 5%" visible near the cursor.

**After AUTO completes (step 9+):** "LO QUE ESCRIBE: the brown do" shown with highlighted sliding window. Final result: "the brown dog sa?" with a "?" at the end. Final 4-letter key is "n_do". Caption: "no hay nada que leer → e 0 ►". Buttons "OTRA VEZ ↺" and "AUTO".

**After switching to «the quantum elephant sat» and running AUTO:** The result shows a striped/diagonal pattern in the bar chart area ("fila vacía · 0% / nadie escribió nunca «_sa?»") and the output is stuck at "the brown dog sa?" still... wait, it appears the second sentence actually runs but encounters blank rows immediately. The final state shows: "no hay nada que teer → e ? ►" and the text written is "the brown dog sa?" still showing. It seems after switching to quantum elephant the initial letters "the " work but as soon as it hits an unusual sequence ("quan" or similar), it gets a "fila vacía" and stops.

### Four-question assessment

**1. What is this, and what do I do FIRST?**  
The two sentence tabs at top are clear tabs — I pick a sentence. The label "BUSCA LA FILA DE ESTAS 4 LETRAS" plus the highlighted "the " makes the mechanism immediately apparent: it's finding the row for these 4 letters. I click AUTO. Entry point is clear though the "lee la fila y escribe ►" instruction area with the cursor feels slightly redundant — it's telling me what the widget will do rather than showing me.

**2. What is the single most important thing — the HERO?**  
The hero is: *the model reads 4 letters at a time, looks up the next most likely letter, writes it, then shifts the window by one and repeats.* The typing animation makes this concrete. The sliding window is the key insight: "the_", then "he_b", then "e_br", etc.

**3. Does it take you by the hand step-by-step, or are you lost?**  
For the common "brown dog" sentence: yes, it steps you through clearly. The counter "SIGUIENTE LETRA (N)" tracks progress. You can also do it manually one step at a time.  

For the "quantum elephant" tab: this is where it gets confusing. After switching tabs and running AUTO, the output still shows "the brown dog sa?" — it's not obvious whether this is a reset, a continuation, or a stale display. The "fila vacía" state (diagonal-stripe pattern in the bar chart, all percentages at 0%) is dramatic and informative, but a cold viewer looking at the widget after it finishes on the second sentence doesn't know *which* sentence was being run or *where* it got stuck. The widget seems to end on the same final-state visual regardless of which tab caused the failure.

**4. What competes for attention or gets in the way? Anything illegible, too small, cluttered, or ugly?**  
- The sliding 4-letter window on the left side of the bar chart (showing which matrix row is active) is visually small and dim. The left "matrix context" panel (showing the column bars) goes nearly invisible during the animation — rows appear but the bars lose their labels.  
- The left panel (showing context letter rows like "p, s, c, w, m, t") and bar percentages is excellent when visible but the column labels disappear when the animation is running fast — too much visual change too quickly.  
- The "lee la fila y escribe ►" / "LO QUE ESCRIBE" section: the cursor indicator "►" next to a small number feels cryptic. The percentage shown (e.g., "b 5%") next to the cursor isn't obviously the probability for that choice.  
- The bar chart area goes almost entirely dark between steps — not just dimmed but nearly invisible, making the sliding-window concept hard to follow in real time.  
- Two-tab structure is elegant but the tabs are small and the difference between them isn't explained in the widget itself.

### Verdict: **CLEAR** (with caveats)  
The main concept — the model slides a 4-letter window and picks the most likely next character — lands clearly through the animation. The "el perro" happy path is clean. The second tab / failure mode is ambiguous in its final state display. Verdict is CLEAR for the primary use case, with a flag for the secondary.

---

## ng-limit

### Screenshots / Observed States

**Initial state:** Amber pill label "EJEMPLO · ILUSTRATIVO". Text: "LA TABLA VIO «EL PERRO DUERME» MUCHAS VECES · NUNCA «EL GATO DUERME»". Two sentence rows: "«el perro _____»" and "«el gato _____»". Explanatory text: "Misma respuesta para ti. Para la tabla, dos filas distintas a miles de filas de distancia." Thin left-side element (table position indicator, labeled "19.485 filas"). Button "ESCRIBIR «EL PERRO»".

**After clicking ESCRIBIR «EL PERRO»:** A panel appears: "FILA LLENA / fila n.º 13.623". Bar chart: duerme 70%, ladra 16%, corre 9%, come 5%. Caption: "ESCRIBE «el perro *duerme*» 70%". New button "AHORA «EL GATO»".

**After clicking AHORA «EL GATO»:** Two panels now visible. Top: "FILA LLENA / fila n.º 13.623" with duerme 70% bar. Separator: "12.339 FILAS DE DISTANCIA · SIN PUENTE". Bottom: "FILA VACÍA / fila n.º 1284" with all bars at 0% (duerme 0%, ladra 0%, corre 0%, come 0%). Caption: "NO ESCRIBE «el gato _____» · sin datos · 0%". Footer: "SABE ESCRIBIR «EL PERRO» DE MEMORIA — NUNCA «EL GATO»". Button "REINICIAR".

### Four-question assessment

**1. What is this, and what do I do FIRST?**  
The setup text at top tells me exactly what to expect: the table saw "el perro duerme" many times, never "el gato duerme." There is one button "ESCRIBIR «EL PERRO»". Completely clear entry point. I click it. Then a second button "AHORA «EL GATO»" appears. Two-step reveal is very logical.

**2. What is the single most important thing — the HERO?**  
The hero is: *for "el perro" the model is 70% confident it writes "duerme"; for "el gato" it has zero data and writes nothing.* The contrast between the full bar chart and the empty bar chart — side by side with "12.339 FILAS DE DISTANCIA · SIN PUENTE" between them — is extremely effective. The key idea (what the model knows vs. what it doesn't) is immediately obvious.

**3. Does it take you by the hand step-by-step, or are you lost?**  
Two-step guided reveal. Step 1: click → see perro result. Step 2: click → see gato result for comparison. Couldn't be simpler. The separator label "12.339 filas de distancia · sin puente" is a surprisingly poetic and clear explanation of why they're different. The final summary caption is a clean payoff.

**4. What competes for attention or gets in the way? Anything illegible, too small, cluttered, or ugly?**  
- The left-side thin element (table scroller / position indicator) is cryptic. At initial state it just looks like a thin bar with "19.485 filas" in tiny text. After clicking it animates to show a highlighted position indicator — but without context, a first-time viewer doesn't know what it represents. It looks like a mobile scrollbar. The label "19.485 filas" alone doesn't explain "this shows where in the 19,485-row table these two entries sit."  
- The bar chart "FILA VACÍA" bars at 0% all show as identical-length zero-bars — these read as "full" bars at first glance because the bars fill the container width. A closer look shows they go to 0% but the visual impression is "bars = data." The bars need to visually register as empty (they should be just a thin line or no bar, not full-width zero-bars). **This is a moderate misleading affordance.**  
- The "ESCRIBE / NO ESCRIBE" captions below each panel are small and easy to miss.  
- Otherwise: clean, focused, no clutter.

### Verdict: **CLEAR**  
The contrast between "el perro" (confident, 70%) and "el gato" (no data, 0%) lands immediately. The zero-width bars rendering as full-width is a visual bug worth fixing but doesn't prevent the concept from landing.

---

## ng-grow

### Screenshots / Observed States

**Initial state (N=3 tab active):** Tabs "N=3" (amber, selected) and "N=4". Large text: "solo la **t** = 729 FILAS". Label: "= el N=2 entero · y la «t» es solo 1 de 27 ramas". A compact heatmap showing many rows under the "t" branch with partial visibility. Pill overlay: "+ 714 filas más, solo bajo la «t»". Below: "× 27 LETRAS = **19.683** FILAS EN TOTAL". Explanatory text: "Y ESTO ES SOLO LA «T» · SUBE A N=4 Y CADA FILA SE PARTE EN 27". Button "SUBIR A N=4 · CADA FILA ×27".

**After switching to N=4 tab (animation in progress):** Counter animates from 0 to reveal. Heatmap expands dramatically — many more visible rows in the "t" branch. "+ 19.653 filas más, solo bajo la «t»". Counter shows "× 27 LETRAS = **531.441** FILAS EN TOTAL". Explanatory text: "CADA FILA DE ANTES, PARTIDA EN 27 OTRA VEZ · Y ESTO SOLO CRECE". Button "N=4 · CADA FILA YA PARTIDA ×27".

### Four-question assessment

**1. What is this, and what do I do FIRST?**  
Two tabs at top. N=3 is pre-selected. I see a large "729 FILAS" number and a heatmap. The button "SUBIR A N=4 · CADA FILA ×27" is an explicit call to action. Entry point is very clear. I either click the N=4 tab or the button.

**2. What is the single most important thing — the HERO?**  
The hero is: *adding one more letter to your "memory window" multiplies the table size by 27, so 19,683 rows becomes 531,441 rows.* The side-by-side numerical comparison (729 → 19,683 → 531,441) is the core insight. The heatmap growing visually between N=3 and N=4 reinforces this.

**3. Does it take you by the hand step-by-step, or are you lost?**  
Two-step: see N=3, click to see N=4. The transition is clean. The explanatory text after each step explains the mathematical relationship ("= el N=2 entero · y la «t» es solo 1 de 27 ramas"). A careful reader will follow this. A casual reader will see big-number → even-bigger-number and grasp "this grows fast."

**4. What competes for attention or gets in the way? Anything illegible, too small, cluttered, or ugly?**  
- The heatmap rows are labeled on the left (e.g., "the ", "that", "th_", "they", etc.) but these labels are very small (~11px) and many are truncated. A cold viewer doesn't know if these are words, letter sequences, or categories. The heatmap communicates "many rows" but not "these are specific 4-letter sequences" without reading the labels.  
- The label "solo la **t** = 19.683 FILAS / = el N=3 entero · y la «t» es solo 1 de 27 ramas" is elegant but requires knowing what N=3 means — it assumes you've read prior sections. Cold, this is confusing: why is "1 of 27 branches" relevant?  
- The "+ 19.653 filas más, solo bajo la «t»" pill overlay inside the heatmap is confusing — it says the subtracted count but the relationship between "solo bajo la «t»" (only under 't') and the total table size isn't immediately obvious without the N=3 context.  
- "× 27 LETRAS = 531.441 FILAS EN TOTAL" is the clearest formula on the page but it floats below the heatmap and may be missed if a viewer focuses on the big number.  
- The "SUBIR A N=4 · CADA FILA ×27" button text is excellent — the most informative button label of all six widgets.  
- The heatmap itself is beautiful but somewhat overwhelming: it shows many rows with varying amber intensities and the viewer doesn't immediately know what the columns represent.

### Verdict: **CLEAR**  
The scale explosion (19,683 → 531,441) is the message and it lands. The button label "CADA FILA ×27" is the clearest single explanation in the set. Minor confusion about what the heatmap rows/columns mean, but the big-number comparison carries the concept.

---

## Summary Table

| Slug | Verdict | Single Biggest Issue |
|---|---|---|
| `ng-rowsummer` | **CONFUSING** | Intermediate states are nearly invisible: the accumulating rows render in near-black on near-black in dark mode. Multiple clicks produce no visible change until the full animation completes, making the step-by-step reveal feel broken. |
| `ng-counting` | **CLEAR** | Minor: column header label "PAREJA: _" (underscore as a space character) is cryptic on first read. Otherwise excellent. |
| `ng-void` | **CLEAR** | "el techo de 4 letras" label is abstract for a cold reader, but the sparse-dot grid visual makes the 95.7%-empty concept viscerally immediate. |
| `ng-elephant` | **CLEAR** | The second-tab "quantum elephant" failure mode leaves ambiguous final state — unclear which sentence caused the failure and where the model got stuck. Primary use case is clean. |
| `ng-limit` | **CLEAR** | "FILA VACÍA" bars render at 0% but visually appear as full-width bars — misleading affordance (zero percentage looks like a full bar). Also the table scroller on the left is cryptic. |
| `ng-grow` | **CLEAR** | Heatmap row labels are tiny and unexplained (cold viewer doesn't know rows = 4-letter sequences). Scale comparison (19,683 → 531,441) lands clearly despite this. |
