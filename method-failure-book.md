# Method failure book — why a chapter ships "looks good" but fails to teach

Permanent, **chapter-agnostic** record of *why the method failed* on the N-gram v1 redesign, and the
**enforceable gates** added so it cannot happen again. Companion to `narrative-guidelines.md` (story/pedagogy)
and the two `kit/AGENTS.md` (build process). Non-negotiable reading before redesigning any chapter (n-gram,
MLP, neural networks, …).

> One line: **the manuals already said the right things; v1 failed anyway because every gate was self-graded
> by the same model that built the widget — and that model knows the answer, so it always passes itself.**
> The fix is not more prose. It is *independent, adversarial enforcement* + three principles the manuals
> under-specified (construction must COST, failure must be DISCOVERED, scale must be SHOWN).

---

## 1. The proof that the gate was decorative (cold-eyes test · 2026-06-03)

The build manuals (`kit/AGENTS.md`) already require, as the first checklist item:
*"One idea, clear in ~5s. A stranger gets the point from the visual + one interaction."*
N-gram v1 shipped with that box checked on every widget.

So we tested it honestly: each flagged widget was screenshotted in its **cold first-impression state** (no
narrative around it) and shown to a **fresh agent that never saw the chapter, the spine, or the intended
lesson** — instructed to react as an ordinary adult with no math/programming, given ~5 seconds. (Captures:
`bash _shot.sh "/lab/bench?w=<slug>&theme=dark"`; one blind agent per image; the agent is told only the
generic premise "a page about phone-keyboard letter prediction".)

| Widget | The ONE idea it was built to teach | What a blind stranger actually perceived in 5s | 5s verdict |
|---|---|---|---|
| §1 `ContextWindow` | "more memory → the bet climbs from coin-flip to near-certain" — the **growing %** is the hero | Eye hits the **big sentence** first; the % is "small and faint, nothing pops." Read it as a generic "it ranks next letters." **Missed the actual lesson.** | **SORT-OF** |
| §2 `ContextCounter` | "a longer key sharpens the row: after «h» anything, after «th» almost always «e»" | Bars + the two %s pop; *did* guess the lesson — but "two competing numbers (36/49)", "1 letra/2 letras" vague, tab clutter; "couldn't quickly tell why one is bigger." | **SORT-OF** |
| §4 `ContextExplosion` | "each extra letter ×27 the rows → the table explodes" — felt **size** | "With one letter it's just 27 small squares… looks small. **Nothing signals things blowing up.**" Hero number caught mid-count-up as "0". | **SORT-OF** |
| §5a `SparsityView` | "almost every possible context never occurs — the table is nearly empty", at huge scale | "36.1%" dominates (good) but "not what it means or why it matters." Size: "mostly just a grid of dim dots. **No 'tiny piece of something huge' punch.**" | **SORT-OF** |
| §5b `InfiniteTable` | "more data won't fill the long-context tables" + a felt sense of an ocean of text | Bars collapsing is the point, but "have to work to connect 1/2/3/4/5 letras to why coverage crashes." "**No felt 'huge ocean of data' punch.**" | **SORT-OF** |

**Five widgets. Zero "YES". Every one had the 5s box checked at ship.** That gap — *self-graded PASS vs.
blind-stranger SORT-OF/NO* — is the whole failure in one table. The author cannot grade legibility, because
the author already knows what the widget shows. Legibility must be judged by **someone who doesn't.**

---

## 2. Why the STRUCTURE failed (the chapter as a whole)

Reading the full v1 mirror (`ngram-narrative.md`) straight through exposes four structural breaks the
per-beat checklist never catches:

**2.1 · Three-plus failure sections in a row → "crítica, crítica, crítica."**
v1's back half is §4 *the cost (explosion)* → §5 *the wall (sparsity + infinite)* → §6 *doesn't generalize
(unseen + typo)* → §7 *diagnosis*. That is **five failure widgets back to back** against **one** real
build/celebrate beat. The emotional arc is a short up-ramp and a long downhill. (Pillar 13 says celebrate the
win *then* the single honest anticlimax — not pile five anticlimaxes on one win.)

**2.2 · Construction is *given*, not *built*.** The closest thing to "you build it" is §2, whose own prose
says: *"La llave del cajón es más larga, eso es todo."* That **tells** the reader the trigram exists; the
widget just reveals a deeper pre-computed row on hover. There is no moment where the reader splits the
t-row ×27, watches the table grow, and *realizes* "I just built a trigram." Building costs nothing, so the
win is unearned. (User: *"te tiene que costar… no puede ser un camino de rosas."*)

**2.3 · Every failure is *pre-announced by the narrator* → discovery killed.** The body hands the reader the
conclusion before the widget can let them find it:
- §4 lead: *"Aquí es donde la idea… se estampa contra un muro… de aritmética pura."* (the wall, announced)
- §5 lead: *"Una tabla de veinte mil filas no vale nada si está vacía."* (sparsity, announced)
- §6 lead: *"Le cambias una sola letra… y se queda en blanco."* (the generalization failure, announced)

Each widget then *demonstrates* a verdict the reader was just told. That is the opposite of the brief:
*"que el propio usuario sea el que encuentre el error, que él sienta que ha encontrado el error."* The
spinning top was handed over, not discovered.

**2.4 · Size is a separate lecture (§4), not discovered while writing (§3).** The user wanted the reader to
bump into the size *while pushing a working machine to write more* (§3). v1 instead makes scale its own
arithmetic section (§4) whose punchline is narrated — *"Diez letras de memoria… son billones de filas"* —
over a grid that, per the cold-eyes test, "looks small."

**The spine encoded all of this.** `ngramSpine.ts` `tone` fields literally read *"empieza el muro"*,
*"el muro"*, *"vive la decepción"*, and the §4/§5/§6 `newIdea`s are stated as facts the widget will *show*.
The blueprint was a **beat-checklist of "present idea → present failure"**, never a **discovery design** of
"what does the reader do, fail at, and conclude *themselves*."

---

## 3. Root causes (confirmed)

- **RC-0 (the meta-cause) · Self-graded gates.** Every "is it clear / is it discovered / is it the hero"
  check was answered by the builder, who knows too much to fail it. No independent eyes, ever. → §1 proves it.
- **RC-1 · Blueprint as beat-list, not discovery design.** Each beat *presented* its idea; the spine's job
  stopped at "what idea goes here," never "how does the reader deduce it." → §2.3, §2.4.
- **RC-2 · Parity over best-fit.** The method optimized "reuse the kit / match bigram" above "what is the
  single best way to show *this* idea." Widgets came out correct-but-not-optimal and timid. → all SORT-OFs.
- **RC-3 · Construction-cost principle missing.** Nothing forced each level-up to be *earned* by a felt
  failure of the previous level. → §2.2.
- **RC-4 · Scale principle missing.** A big number was allowed to stand alone; nothing forced a *visual of
  magnitude*. → §4, §5a, §5b all "looks small / no punch."
- **RC-5 · Speed over mimo.** The narrative — where the most went wrong — got the least time. The blueprint
  was produced fast; the prose was never read end-to-end as a *journey* before building.

---

## 4. The gates that now make it impossible (where each lives)

These are **enforceable** (an artifact or an independent agent must sign off), not aspirational prose.

1. **Fresh-eyes cold-screenshot gate (the keystone).** Before a widget is "done", a *new* agent that has NOT
   seen the narrative/spine/intended lesson is given ONLY the screenshot and asked: what is this and what do I
   do FIRST? what's the important thing (the hero)? if it's complex, does it take me by the hand (press this →
   watch this number)? what competes? **Not the whole concept in 5s — but in 5s the blind stranger must know
   what to DO and what MATTERS, and name the hero unprompted** (a complex widget may then guide them step by
   step). Doesn't know where to start / hero hidden = rebuild. → `kit/AGENTS.md` (HARD GATES) + `narrative-guidelines.md`.
2. **Judge panel (3 independent lenses).** A child (no jargon), an aesthetics/visual-hierarchy critic, and a
   teacher (is the ONE idea taught and *discovered*?). Ships only if all three pass. → `kit/AGENTS.md`,
   `narrative-guidelines.md`.
3. **Explicit build → critique → REBUILD loop.** Rebuild is the rule, not failure. At least one rebuild per
   key widget is expected. → `kit/AGENTS.md` QUALITY PASSES, pillar 18.
4. **Scale / magnitude gate.** Any large number ships with a *visual of magnitude* that actually changes with
   the number (a table that grows; a zoom/lens that says "you see 0.000…% of this"). A static figure whose
   picture is identical for 729 and 14,000,000 = fail. → `CLAUDE.md` quality protocol + `kit/AGENTS.md` Bar-v2.
5. **Construction-must-cost gate.** Each level-up must repair a failure the reader *just felt*, not "let's try
   more for fun." → `narrative-guidelines.md` pillar 12.
6. **Discovery-at-arc-level + narrate-don't-announce.** The narrator never states the conclusion a widget can
   let the reader find. The body sets the scene and asks; the reader concludes. Added to the FLOW GATE:
   *"does the reader DISCOVER this, or are they told?"* → `narrative-guidelines.md`.
7. **Blueprint discipline (narrative gets the MOST time).** Before any widget: (a) list everything the page
   must teach; (b) write each idea ~4 ways; (c) pick the clearest, least-chrome framing; (d) design the
   idea→idea bridges as a *journey map*; (e) only then spec widgets. → `narrative-guidelines.md`.
8. **Empowered widget agent + aesthetics/hierarchy study.** The agent reads the whole beat, brainstorms ~5
   visual directions, studies the visual-hierarchy tricks (what the eye hits first, contrast, size, focal
   point, Gestalt) *as the tool to teach the idea*, picks one with a written reason, and **has final say** —
   it does not reflexively copy bigram. Works in **priority order: idea → express it brilliantly (visual-first,
   the mandatory floor) → interactive → a curiosity rabbit hole the reader gets lost in (the high bar,
   optional)** — never trade the floor for the ceiling. → both `kit/AGENTS.md` BUILD CONTRACT.
9. **Emotional-arc map (separate artifact).** Draw a beat-by-beat line of what the reader FEELS, apart from
   the logical "¿y si?" ladder; verify it rises/falls (v1's logic was fine, its emotional arc was flat — five
   downhills; this is what actually broke). → `narrative-guidelines.md` blueprint discipline (2b·d2).
10. **Risk-first spike.** Prototype the riskiest hero (e.g. "can scale be FELT?") as a throwaway BEFORE the
   narrative commits prose to it; if it can't be made legible, change the plan early. → `narrative-guidelines.md`
   (2b·f) + `kit/AGENTS.md`.
11. **Proportional rigor.** The full panel runs on the 2-3 HERO widgets; simple widgets get only the fresh-eyes
   5s gate. Pick a framing by which one a blind reader explains back / fewest pieces, not by taste. → `kit/AGENTS.md`.
12. **Generation panel (heroes) — generate by committee, don't solo-default.** Ideas for hero widgets come from
   a PARALLEL idea-panel (3-5 blind agents, each the beat goal + the method, not each other's output → pick/merge
   the best), not one mind defaulting to parity. The 5 directions + the choice are an artifact
   (`<chapter>-gates/<slug>.directions.md`) for ANY widget. **Seed ideas are inspiration to BEAT, not a spec;
   generate MORE where a complex idea warrants; thread the set as a journey.** → `kit/AGENTS.md`. Proven (§4d).

---

## 4b. Make the gates REAL — evidence, not honor system (red-team verdict, 2026-06-03)

Three independent agents stress-tested the hardened method (none had built it). They converged on ONE
verdict: **the new independent gates leave no auditable trace, so a self-graded pass is indistinguishable
from a real one — RC-0 reincarnated at the meta level.** A model under pressure can write "fresh-eyes passed"
with nothing proving the agent ran or was truly blind. And the gate that matters most — the NARRATIVE (where
v1 failed most, §2) — was named but never *sequenced* or *operationalized*. As written, v2 could ship nine
individually-legible widgets on a flat, told-not-discovered, failure-stacked arc: **the same failure, one
altitude up.** The fixes:

1. **Every independent gate leaves a persisted ARTIFACT.** Verdicts go to `<chapter>-gates/` (e.g.
   `ngram-gates/<slug>.fresh-eyes.md`, `…judge.md`, `narrative.fresh-eyes.md`). Each records: what was shown
   (screenshot path / prose), the agent's RAW answer, the spec's hero string, and PASS/FAIL. **Artifact-existence
   gate:** nothing is "done" if its gate file is missing. "I ran it" is not a pass; the file is.
2. **Blind-agent recipe (operational).** Spawn a SUB-AGENT (fresh context = naturally blind). Give it ONLY the
   screenshot path (or the plain prose) + the generic premise ("a page about phone-keyboard letter prediction").
   NEVER paste the narrative, spine, lesson, or hero. It returns free text (what is this / what do I do first /
   what's the hero), saved verbatim; the hero must MATCH the spec or it's a fail. (Exactly the test that
   exposed v1: 5 widgets, 0 clear.)
3. **The blind NARRATIVE read is a sequenced pass with teeth.** After the mirror regen and BEFORE building
   widgets, a blind reader reads the plain-language story and writes `narrative.fresh-eyes.md`: where did I get
   lost? where was I TOLD vs. where did I DISCOVER? **did I BUILD the model or was it handed to me?** did I see
   the failures coming or were they sprung? what did I feel beat by beat (does the arc rise)? Closes the two
   causes still self-graded: the arc (§2) and construction-cost (RC-3).
4. **Proportional rigor without the loophole.** The HERO widgets (2-3) are DECLARED in the blueprint up front
   (carry the central/hardest idea, a big number/scale, or a new mechanic) — NOT chosen at grading time (that's
   how a widget gets demoted to dodge the panel). Even "simple" widgets still get the cheap **blind fresh-eyes**
   gate; only the 3-judge panel + 5-directions are hero-only.
5. **Arbiters for the tensions (so two rules don't cancel out).**
   - *maximize-visualizers vs. one-idea→one-widget vs. don't-stack-failures:* one idea = one widget; a second
     only if it adds a genuinely new facet; never 3+ failure widgets in a row. Coverage = IDEAS covered, not count.
   - *floor vs. ceiling:* the floor (express the idea brilliantly, visual-first) is mandatory and never traded
     for the ceiling (rabbit hole); aim for the ceiling only after the floor is met.
   - *fork-the-kit vs. don't-copy-bigram:* reuse the kit's LOOK/primitives always; the MECHANIC is free — don't
     copy bigram's mechanic by reflex.

## 4c. The ONE master ladder (chapter-level — nests the per-widget loop)

The docs had two overlapping numbered ladders (narrative protocol 1–7 vs. build contract 1–7) and chapter-level
gates buried in a per-widget file. This is the single sequence:

**0** regenerate + READ the mirror · **1** blueprint discipline (2b: list → ~4 framings → pick by evidence →
journey map → **emotional-arc map** → spec widgets → **risk-first spike** of the hardest hero) · **2** blind
NARRATIVE read → `narrative.fresh-eyes.md` (PASS required before any widget) · **3** declare the 2-3 HERO
widgets · **4** per widget: BUILD CONTRACT 1→2.5→7 · self-gate (bench, both themes) · **blind fresh-eyes →
artifact** · (heroes only: 3-judge panel → artifacts) · **rebuild if not a clear YES** · **5** integrate (wire
into the route, i18n `copyNs`, register in `bench/page.tsx`) · **6** FLOW GATE over the whole regenerated
mirror · **7** regression (other accents/chapters untouched; `[data-<ch>-theme]` scoped) · tsc + eslint ·
**8** chapter definition-of-done = every gate artifact exists AND all PASS. Skipping a step = its artifact is
missing = not done.

---

## 4d. Generation, not just validation — the experiment (2026-06-03)

The method was validation-heavy (gates) but its GENERATIVE step (build-contract 2.5) was solo — one mind,
which under pressure defaults to parity. Test: 4 blind agents each got ONLY a beat's teaching goal + the
method (never the human's idea) and were asked to ideate. They independently produced — or beat — the human's
own designs: a recursive **drill-down** for felt scale ("you see 0.000007%"); **split-the-row** for the
gradual self-build (one row fractures into 27, tally 1→27→729, "you built it"); a **text firehose** for felt
data-quantity (Shakespeare pours/blurs, high-n gauges refuse to fill); a **lookup-loop** (giant table + a
traveling lens) for "writing = reading a number". Conclusion: the hardened method DOES generate the right
ideas — **if the ideation is actually done** — because 2.5 + the scale gate + discover/cost + the antipattern
warnings in this book steer away from the v1 defaults. So we (a) make the 5-directions+choice an **artifact**
(can't be skipped), and (b) for HERO widgets, run the ideation as a **parallel panel** and pick/merge — the
symmetric twin of the judge panel. Generation by committee, validation by committee.

---

## 5. Generalizable checklist for the NEXT chapter (MLP, NN, …)

Before building anything:
- [ ] The chapter reads, in plain language with no widgets, as a **journey of discovery** end-to-end.
- [ ] **Failure sections are not stacked.** One honest wall after the celebrated win, not a downhill of five.
- [ ] At least one beat where the reader **builds** the model and it **costs** something.
- [ ] No conclusion the narrator states that a widget could let the reader **find**.
- [ ] Every large number has a magnitude visual that **changes with the number**.

Per widget, it is not done until:
- [ ] It **expresses its idea brilliantly, visual-first** (the mandatory floor) — and reaches for a curiosity
      rabbit hole the reader gets lost in (the high bar) when the idea supports it.
- [ ] A **blind fresh agent**, in 5s, knows **what to do and what matters** and names the hero unprompted
      (the full concept may unfold through guided steps — press this → watch this number).
- [ ] The **3-lens judge panel** (child / aesthetics / teacher) all pass.
- [ ] It was **rebuilt at least once** if the first pass fell short for anyone.

**Generational (it compounds).** This method is meant to carry forward: when you touch a later chapter (it is
already further along than n-gram v1 was), run a light pass against these gates — text walls? missing
callbacks/boxes? visual variety? is each turn DISCOVERED or told? does scale read? — and fix what regressed.

> The single sentence to remember: **you cannot grade your own legibility — ask someone who doesn't already
> know the answer.**

---

## 6. Reglas FIJAS de calidad estética (la vara que un visualizador debe pasar) — web design

No negociables, para CUALQUIER visualizador del proyecto (se chequean en el gate de ojos-frescos + usabilidad):
1. **Un solo HÉROE.** Una cosa domina el ojo. Nada de dos números/dos gráficas/dos controles compitiendo.
2. **La idea se VE, no se rotula.** El mecanismo (multiplicar, afilar, colapsar, crecer) es visible
   pre-literalmente. *Pero* vale TEXTO junto/encima del widget si hace falta para que se entienda (regla
   relajada: el cuerpo lo explica, o un rótulo funcional corto). Lo no-evidente SE ETIQUETA.
3. **Nada flotando/inconexo.** Piezas relacionadas van juntas y alineadas (p.ej. la palabra + la ventana de
   memoria + la ranura siguiente = UNA línea, no 3 cajas sueltas). Conectar visualmente causa→efecto, fila→número.
4. **Nada de espacio muerto.** Sin ~60% de lienzo vacío; composición equilibrada.
5. **Afordancia.** Lo pulsable parece pulsable (chips/botones con estado hover/selected); un botón parece botón.
6. **Contraste flagship.** Legible a brillo normal; nada muddy/near-black-on-black; sin glifos crípticos (etiquetar «␣» = "espacio").
7. **Escala en un STILL.** Un número grande cambia la IMAGEN (crece/zoom), nunca igual para 729 que 14M.
8. **El estado interactivo CAMBIA de verdad.** Al usarlo, el estado muta visiblemente y correcto. Probarlo.

## 6b. Gate de USABILIDAD/FUNCIONAL (multi-estado — "que lo USEN") — obligatorio
El gate de ojos-frescos NO basta con la captura inicial. El revisor debe **USAR** el widget: capturar varios
estados (`/lab/bench?w=<slug>&bare=1&play=1&clicks=N`, N=1..6 pulsa el botón primario N veces) y comparar.
Verifica: (a) FUNCIONAL — al interactuar el estado cambia de forma correcta (no idéntico/roto/atascado);
(b) USABILIDAD — es obvio qué hacer y responde como se espera; (c) enseña en cada estado. **Bug real cazado
así:** WriteFromMatrix tenía "Paso" que no avanzaba (2 capturas idénticas) — un gate de solo-inicial lo habría dado por bueno.
> **El gate que valida esto está REDEFINIDO en §8 (v2)** tras un fallo grave (ExplosionZoom pasó dos filtros
> siendo un desastre). El contrato §8 es vinculante; sustituye cualquier definición anterior del gate de ojos-frescos.

## 6c. Política de MODELOS (revisada 2026-06-03 — el fallo de ExplosionZoom NO fue de modelo, fue de PRIMING)
- **La palanca del gate NO es el modelo: es la independencia (sin priming).** Un Sonnet CIEGO (sin que le
  filtren la lección) habría suspendido ExplosionZoom; un Opus PRIMADO lo aprobó. Así que el gate de
  ojos-frescos puede ser **Sonnet**, siempre que sea ciego según §8 (solo capturas + contexto previo, nunca la
  lección). Cualquier modelo VE el desastre en la captura; lo que no podía era juzgar con la respuesta soplada.
- **Sonnet por DEFECTO para casi todo:** gate ciego, capturas, de-dups/contraste, listados **y también
  build/rework de widgets**. (Lección 2026-06-03: una tanda de 11 builds en Opus fundió ~50% de la sesión.)
- **Opus solo como ESCALADA rara y puntual:** un widget concreto que Sonnet no consigue dejar bien tras un
  par de intentos. NO Opus por defecto, NO Opus para todos los widgets a la vez. "No uses Opus siempre."

## 7. El fallo del método de NARRATIVA: no puedes revisar tu propio contexto (independencia de mente)
**Descubierto (2026-06-03):** si TÚ escribes el blueprint/prosa (revisándolo mientras lo escribes) y luego
mandas un agente a "revisarlo", ese agente arranca con/comparte tu encuadre y SIEMPRE te da la razón — sabe por
qué pusiste cada cosa. Prueba: un auditor anti-IA dio "limpio" a una prosa que el usuario marcó como
**super-AI** (ritmo de metralleta: "No cambió la máquina. Cambió cuánto la dejaste recordar." + moraleja). La
revisión con contexto compartido es teatro.
**Arreglo (obligatorio para narrativa):**
- **Escritura por mente independiente:** la prosa la escribe un agente (Opus) en un **dynamic workflow** (o un
  agente aparte), NO yo revisándola al vuelo. Idealmente varias voces → elegir/fundir.
- **Revisión por OTRA mente que NO vio el porqué:** un agente distinto, sin el contexto de por qué se escribió,
  audita anti-IA + flujo. Si comparte memoria con el autor, no vale.
- **El borrador `ngram-narrative-draft.md` (v3) suena a IA y hay que REESCRIBIRLO así** (independiente), no
  fiándose de auto-auditorías. Aplicar los 7 delatores de verdad (sobre todo ritmo de metralleta + moraleja).

## 8. El gate de ojos-frescos falló OTRA VEZ — por PRIMING + propagación (caso ExplosionZoom, 2026-06-03)
**Qué pasó.** `ExplosionZoom` (ng-zoom) se marcó ✅ PASS y era un desastre: dos números dorados de 8 cifras
compitiendo sin héroe (`14.348.907` en el header + `×387.420.489` en el botón), una columna de fichas
tapando el texto ("5 LETRAS DE MEMORIA" salía como "ETRAS DE MEMORIA"), un "27" flotando sobre el borde, una
rejilla 2×2 indescifrable, todo muddy. Pasó **DOS supuestos filtros**. Ninguno funcionó. El texto del propio
revisor es la prueba del delito.

**Filtro 1 — el agente revisor. Falló por 6 cosas (su propio texto las prueba):**
1. **PRIMING en el prompt.** Se le dio la respuesta: *«it's about how a prediction table is astronomically
   large… the multiplier climbs ×19.683→×531.441… the grid bleeding off all edges»*. Le dijimos QUÉ enseña,
   QUÉ buscar y QUÉ números esperar → salió a confirmarlo y lo "confirmó" ("TEACHING — Strong" es circular).
   Reencarna §B0 (el juez comparte la respuesta = gate decorativo). La independencia era de pega: metimos un
   agente aparte y luego le filtramos la conclusión en el prompt.
2. **Excusó el defecto peor.** Llamó *«bench-only chrome, not shipped»* a las fichas n/o/t/u + la columna
   izquierda — que SON el widget (captura `bare=1`). Racionalizó el desorden en vez de juzgarlo.
3. **Contradijo su propia regla.** Con "Default REWORK; PASS only if flawless" listó 4 defectos y dio PASS
   igual. El listón estricto fue decorativo (otra vez).
4. **Midió "funciona", no "se entiende".** Con briefing, juzgar comprensión es imposible: ya sabía la respuesta.
5. **Solo 2 estados elegidos a dedo** (los que YO escogí); ni esos limpios.
6. **Sin bucle:** "PASS con pulido menor" cerró con defectos conocidos sin arreglar; el "pulido" nunca ocurrió.

**Filtro 2 — el "control de calidad" (el orquestador). No existió como filtro independiente.** Acepté el
veredicto verbatim, **degradé** 4 defectos a "Minor: dos números redundantes", y **propagué la alucinación**
del agente a mi propio informe (`widget-state-analysis.md`: *"el overlay = chrome del bench, confirmar que no
se shippea"*). Los "dos filtros" eran UN juicio confiado dos veces; el segundo nunca miró el estado real.

**Lección dura:** un gate que comparte la respuesta, o un orquestador que confía sin mirar, NO son control de
calidad — son sellos de goma. Escribir "never the lesson/hero" en el manual NO bastó: la regla estaba y se
violó. Hay que hacerla **imposible de violar** (plantilla fija + verificación).

### GATE DE OJOS-FRESCOS v2 — contrato VINCULANTE (sustituye toda definición anterior)
1. **Solo captura, nunca el código.** El revisor juzga PNGs renderizados (`bare=1`, sin chrome). Ver el `.tsx`
   = reconstruye la intención = deja de ser usuario. PROHIBIDO pasarle el código.
2. **Una captura por CADA funcionalidad/estado** — no 2 a dedo: inicial + cada interacción (clicks=1..N), cada
   tab/modo, **ambos temas**. El builder entrega el set COMPLETO; si falta un estado, el gate NO puede dar PASS.
3. **Contexto = SOLO lo que PRECEDE al widget** (el lead-in narrativo que un lector ya leyó al llegar).
   PROHIBIDO nombrar qué enseña el widget, su héroe, el número clave, o "busca X". Si el prompt nombra la
   lección → gate inválido, se repite. **Plantilla fija:** el orquestador rellena `<contexto-previo>` +
   `<capturas>`; NUNCA existe un campo "la idea es…".
4. **El revisor DERIVA la lección a ciegas** y responde: «¿qué crees que intenta mostrar? ¿lo entendería una
   persona NORMAL que llega aquí? ¿cuál es el héroe? ¿qué estorba/compite?». DESPUÉS el orquestador compara la
   lectura del revisor con la idea intencionada: si no coincide → FALLA (no comunica). Esa comparación la hace
   el orquestador, no el revisor.
5. **Todo lo que se ve es el producto.** PROHIBIDO excusar nada como "será chrome del bench / no se shippea".
   Con `bare=1` no hay chrome: si está en pantalla, cuenta y se juzga.
6. **Cero defectos = PASS.** No existe "PASS con pulido menor". Cualquier defecto listado = REWORK. El revisor
   no puede dar PASS y a la vez listar problemas.
7. **El flujo NO termina hasta que TODOS los widgets son PASS limpio.** Bucle build→gate→rework→re-gate sin
   tope blando. Si tras N rondas uno sigue fallando, se ESCALA al usuario — no se aparca como "minor".
   **Checkpoint del orquestador cada ≤2 reworks:** el bucle NO corre solo en automático hasta el final — cada
   2 rondas de rework el orquestador PARA, MIRA él mismo las capturas reales y DECIDE (PASS / seguir / escalar).
   Así el juicio humano-equivalente entra periódicamente, no solo de adorno al cierre. (Operativamente: cada
   tanda de workflow hace ≤2 reworks y devuelve; el orquestador revisa y relanza solo los que sigan fallando.)
8. **El modelo del revisor NO es la palanca — la independencia sí.** Un Sonnet CIEGO basta para ver el
   desastre en la captura; un Opus PRIMADO lo aprobó. Usa **Sonnet para el gate ciego**; reserva Opus para
   construir. (Lo que rompe el gate es soplarle la lección, no el tier del modelo.)
9. **El builder NO se auto-aprueba.** Su auto-captura es para iterar; el PASS lo da el gate ciego + la
   verificación del orquestador.
10. **El orquestador es un filtro REAL, no un sello.** Antes de registrar PASS: (a) confirma que el prompt del
    gate NO contenía la lección; (b) mira ÉL MISMO el estado shippeado real (la página, no solo capturas del
    bench elegidas); (c) NUNCA copia excusas/alucinaciones del gate a los informes. Si el orquestador no miró,
    no hay segundo filtro.

### El gate también da FALSOS-NEGATIVOS por ARTEFACTO DE CAPTURA (el espejo del priming, 2026-06-03)
Un triaje ciego marcó los 12 widgets REWORK (0 PASS). Al mirarlos, ~la mitad de las críticas eran **artefactos
de la captura, no defectos del producto** — el gate "no puede estar siempre mal", y no lo estaba: estaba
juzgando basura de captura. Hay que decirle al revisor que IGNORE:
- **Fondo de página vacío DEBAJO del widget** = la captura (alto fijo) es más alta que el componente; en la
  página real le sigue prosa. Se juzga el espacio muerto SOLO DENTRO del marco del widget, no el fondo de abajo.
- **Badge «N»/«Compiling…» en una esquina** = indicador del dev server de Next.js, no es del producto.
- **Texto en INGLÉS** = el corpus literario de la máquina y su salida real (intencional; no es placeholder ni
  bug de idioma). Se juzga legibilidad/claridad, no el idioma.
- **Saltos de números entre estados** = algunos botones generan otro ejemplo (re-roll); se juzga la claridad de
  CADA estado y si la interacción CLAVE cambia el estado, no que los números progresen en monótono.
Y **capturar el estado correcto**: si la interacción que enseña es un selector/tab (no el botón primario), el
auto-click no la ejercita → el gate ve "no cambia". Asegúrate de que el estado por defecto ya enseña, o captura
el control correcto. Moraleja simétrica al priming: **un gate con la respuesta soplada da falso-PASS; un gate
con capturas-basura da falso-REWORK. Las dos se arreglan con el orquestador mirando de verdad.**

### El ORQUESTADOR también falla por SOBRE-INDULGENCIA (espejo del rubber-stamp, 2026-06-03)
Tras ver el gate pasarse de estricto (suspender 11/12 siendo varios buenos), el orquestador (yo) se fue al
OTRO extremo: dio por buenos `amnesia`, `split` y `zoom` que el **USUARIO no entendía**. El usuario: *"no
todos son buenos, fallas más que el gate... tu criterio no es bueno."* Lecciones FIJAS:
- **El juez final es el USUARIO**, no el gate ni el orquestador. Si el usuario no lo pilla, está mal — punto.
- **El listón es "¿una persona normal pilla LA idea (sin leer un párrafo)?"**, NO "cero defectos" (el gate se
  pasa ahí) NI "a mí me parece bien" (indulgencia). Juzgar CADA widget contra ese listón, en frío, sin querer
  cantar victoria ni ahorrar trabajo.
- **No declarar PASS lo que no has MIRADO.** Pasé `split`/`zoom` "fiándome de las notas de cambios" → error.
- **Patrón observado:** los widgets de mecánica CONCRETA (barras, contraste, lookup, columnas que crecen)
  caen solos; los de idea ABSTRACTA (colapso de contextos, explosión combinatoria, escala astronómica) se
  resisten y necesitan **repensar el MECANISMO** (2-3 direcciones, elegir la más clara), no pulir. Si uno
  falla 2 rondas, no es polish: es mecanismo.
