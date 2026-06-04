# n-gram — la visión del usuario + catálogo de visualizadores

Captura **fiel** de cómo el usuario quiere el capítulo (de su audio largo) + TODOS los visualizadores que
propone. Es el INPUT de la Fase 2/3. Los widgets actuales **se pueden borrar enteros**; lo que manda es
enseñar estas ideas de esta forma. (Por qué falló v1 y los gates: `method-failure-book.md`; trazabilidad del
feedback: `ngram-feedback-trazabilidad.md`.)

## Principios rectores (sus palabras)
- **Todo se DESCUBRE; nada por sabido, nunca.** El usuario encuentra los fallos él mismo y se siente
  inteligente (peonza de *Inception*: la conclusión está delante, pero cree que la dedujo él). Pistas ocultas
  «piénsalo un poco» para que intente la solución antes de revelarla.
- **Entendible por sus padres / un niño.** Sin mates, sin nombres técnicos que asusten. Para todo el mundo.
- **Construir CUESTA y se SIENTE** (poco a poco, con las manos). Nada instantáneo. **Celebrar antes de
  criticar.** **No apilar fallos** (v1 tenía 5 secciones de pega contra 1 de logro → "el usuario se pega un tiro").
- **Mostrar TAMAÑO visualmente** (grande y pequeño), nunca solo un número ("14 millones no significa nada").
- **Interactivo y jugable**, que el usuario **se pierda explorando** (madriguera): pasar por los huecos
  vacíos, ver los ceros, investigar. Capa extra más allá de lo que enseña por defecto.
- **Divertido**, humor que rompe el hielo aunque el tema sea serio.
- **Showpieces** donde impresione (y además enseñe). No todos increíbles, pero **todos se entienden**.
- **Escribir = leer un número de una matriz gigante.** Esa es la esencia, hay que verla.
- **El agente del visualizador tiene la última palabra**, no copia bigram por copiar; estética similar,
  mecánica libre (incluso técnicas de Transformer si expresan mejor).

## El arco (5 secciones, sus palabras)
1. **Qué vamos a construir** (la actual §1 "no está mal"). + descubrir la amnesia del bigrama él mismo.
2. **Construir poco a poco — lo hace ÉL.** Empezar por la T; sentir que crea el trigrama; ver crecer la tabla.
3. **Escribir + CELEBRAR + descubrir el TAMAÑO.** "Mira lo que has construido, cabrón." Y al escalar, el tamaño.
4. **Descubre el sparsity y que NO generaliza — ÉL.** Empuja (10-grama), se topa con el muro, concluye solo.
5. **Puente espectacular.** "La era del conteo ha terminado, la era del aprendizaje comienza."

---

## ARQUITECTURA CANDIDATA — "La fila que creció demasiado" (síntesis de 3 arquitectos ciegos)

3 agentes ciegos (solo objetivos + método, sin las semillas) diseñaron el capítulo entero por separado.
**Convergieron** en la misma espina; y el arquitecto de "hilado" aportó la mejor idea, que NO estaba en las
semillas: **un objeto recurrente que se transforma de principio a fin.**

> **OBJETO RECURRENTE = LA FILA.** Una `FixedAlphabetRow` de 27 ranuras ("lo que suele seguir"). **Nace** en
> §1, **gana una llave más larga** en §2, **se apila** en una tabla en §3, **explota** en §4, se queda **a
> oscuras** (vacía) en §4, y una ranura vacía **mata la máquina** en §5 (la fila vuelve plana → cierra el
> círculo de §1). El lector ve UN objeto morfar de punta a punta → el capítulo es un viaje continuo, no un
> pase de diapositivas. Esto es "hilarlo todo".

> ⚠️ **CORRECCIÓN DE RUMBO (el usuario insistió: MÁS visualizadores, no menos).** La primera síntesis se fue
> a 7 (lente "elegancia/consolidar") — y eso contradice lo que pidió y la memoria `lab-chapters-maximize-visualizers`
> (muchos visualizadores focales, show-don't-tell). Se **EXPANDE a ~13**: más en *construir / escribir /
> explorar*; se consolida **SOLO** la repetición de FALLOS (en v1 eran ~7 widgets de pega → aquí 1, que era su
> queja). El objeto recurrente **LA FILA** sigue hilando casi todos.

**Widgets (~13 focales, casi todos estados de la fila):**

*§1 · Mirar más atrás (2)*
1. **AmnesiaReplay** — re-sentir el fallo del bigrama: con 1 letra «th»/«sh»/«wh» son iguales → imposible; lo
   descubre él. DESCUBRE.
2. **WidenWindow** — palabra difícil letra a letra; la apuesta sube de volado a casi-segura al ensanchar 1→4.
   Héroe: **el % que sube**. PLAY/DESCUBRE.

*§2 · Construirla tú (3 — aquí el usuario pidió MUCHO más)*
3. **SplitTheRow** — **CONSTRUIR CUESTA**: partes a mano la fila «h» en 27 hijas; tally **1→27→729**. BUILD.
4. **RowSharpens** (ContextCounter reworked) — la fila «th»→e afiladísima vs la ancha «h»; **jugable, investigar**. PLAY.
5. **GrowingTable** — entrena trigrama→4-grama→5-grama, MISMO widget, la tabla **CRECE a la vista** cada vez;
   descubre que crece (el usuario lo pidió explícito, A3.2). DISCOVER.

*§3 · Lo que has construido (2)*
6. **WriteFromMatrix** (lookup-loop) — escribir = **leer un número de la matriz gigante**, flujo completo; lente que viaja. PLAY.
7. **LookWhatYouBuilt** (Battle 1→4) — **LA ÚNICA CELEBRACIÓN**: galimatías → casi-frases. "Mira lo que has construido." PLAY.

*§4 · Hasta dónde llega — ASOMBRO PURO de TAMAÑO, descubierto empujando (2)*
8. **ExplosionZoom** — empujas n; la tabla **crece** + drill-down "ves el 0,000007% de las filas posibles". DISCOVER.
9. **BookFirehose** — viertes texto (**libros consumiéndose**, contador disparado) y la tabla apenas se inmuta:
    es así de inmensa. Showpiece "sentir la cantidad" (A7.6/A10.3). PLAY/DISCOVER.
   *(El gate v3 detectó que un widget de "vacío" en §4 spoileaba §5 → el vacío se mueve a §5, donde es la CAUSA
   del mute. §4 queda en asombro PURO de tamaño.)*

*§5 · El hueco — EL ÚNICO MURO (aquí SÍ consolidado: su queja era 7 fallos) (1)*
10. **MuteSlot** (unseen+typo+sparsity fundidos) — contexto seguro → afilado; cambias una letra → celda vacía →
    **muda**; y al **asomarte a los huecos** ves que casi toda la tabla está vacía (esa es la CAUSA). Madriguera
    de exploración (pasar por los ceros). Bookend de §1. DISCOVER/PLAY.

*§6 · Puente (2 + Historia)*
11. **Progression** — cabezazos → bigrama → palabras; "mira cuánto has avanzado" (A10.5). Showpiece de progreso.
12. **BigModelLimit / CatAndDog** — un modelo grande escribe genial; gato/perro = lo mismo para él (el límite
    mostrado **con la buena máquina**, A11). + foldout **Historia** (50 años, autocompletar). → CTA redes.

**Total: 12 visualizadores focales** (sigue siendo MÁS de los 7 leanos y de las 14 semillas sin repetir fallo;
EmptyTable se fundió en MuteSlot por el gate). Hilados por LA FILA.

**Through-line (¿y si? + arco):** amnesia (W1, bajo) → más memoria salva la apuesta (W2) → **CONSTRUIR cuesta**
(W3) → afila + **crece** (W4, W5) → escribir (W6) → **TRIUNFO celebrado** (W7) → **asombro**: tamaño + vacío +
"más datos no arregla" (W8–W10, en tono de *wonder*, no de fallo) → **el MURO**: muda (W11) → progreso (W12) →
el límite + puente (W13). **Una** celebración (W7), **un** muro (W11); fallos NO apilados (el §4 es asombro);
todo descubierto; escala mostrada de varias formas; LA FILA hila casi todo.

**Lo NUEVO (más allá de tus semillas):** (a) **LA FILA como objeto recurrente** que se transforma = hilado
total; (b) §1 partido en re-sentir-amnesia + juego de apuesta; (c) **bookend** (la fila vuelve plana en W11
cierra W1); (d) §4 como **asombro de 3 widgets** (no un solo fallo): la escala se enseña creciendo, vaciándose
y consumiéndose; (e) la pega de v1 (~7 widgets) → **1**. De **14 semillas → ~13 héroes focales hilados por un
objeto**: MÁS visualizadores (lo que pediste) pero SIN repetir el fallo.

---

## Ideas SEMILLA de visualizadores (del usuario) — NO son el spec, SUPÉRALAS

> ⚠️ **Esto NO es una lista cerrada ni un "hazlo así".** Son las ideas que se le ocurrieron al usuario:
> **semillas** para inspirar. El panel de generación debe **proponer los suyos** —mejores, diferentes y
> **MÁS** de los que hay si una idea lo merece— y, si una idea del builder supera la semilla, **se usa la del
> builder, no la del usuario**. Lo FIRME son las IDEAS a enseñar y el arco de 5 secciones; el visualizador
> concreto es **libre**. Y hay que **HILAR** el conjunto como un viaje, no dejar widgets sueltos.
>
> Estado: 🆕 nuevo · ♻️ mejora uno actual · 🗑️ el actual se puede borrar. **[método✓]** = un agente ciego lo
> regeneró solo con el método (prueba de que el método llega — y suele MEJORAR la semilla).

### §1 · Qué vamos a construir
- **V1 · Amnesia descubierta.** El usuario escribe con el bigrama, ve que falla, y **razona él**: «th» y «sh»
  con una sola letra son lo mismo → imposible acertar. El fallo del bigrama lo descubre él, no se le cuenta.
  ♻️ mejora `ContextWindow` (hoy ilegible: frase gigante, % diminuto). Héroe = el **%** (la (im)posibilidad).
- (La promesa/qué-vamos-a-hacer de la §1 actual se mantiene.)

### §2 · Construir poco a poco (lo hace él)
- **V2 · TrigramBuilder gradual** 🆕 [método✓ "split-the-row"]. Centrarse en la T (o reusar la fila «h» que
  ya conoce). Añade una letra → la fila **se fractura en 27** hijas (th, ti, to…), cada una recontada real;
  el tally sube 1→27. Añade otra → cada una ×27 → 729, la pila cae más allá del pliegue. **Descubre solo**
  que ha hecho un trigrama ("para la T ahora necesitas una pareja → 27 → un bigrama por cada letra"). Cuesta
  (arrastrar + recontar; nada gratis). Héroe = la **pila de filas multiplicándose bajo sus manos**.
- **V3 · GrowingTable a través de n** 🆕/merge. Entrena un trigrama (tabla Shakespeare) → la siente crecer →
  4-grama → descubre que solo "añade otra tabla / la hace más grande" → 5-grama → **enorme**. Mismo
  visualizador, sube n. Aquí empieza a asomar el tamaño.

### §3 · Escribir + celebrar + descubrir el tamaño
- **V4 · MatrixWriter (escribir = leer un número)** 🆕 (reusa patrón `LetterByLetter`/`TableWriter`). Flujo
  completo como el de bigrama: contexto → su **fila en la matriz GIGANTE** → lee un número → muestrea → siguiente
  → repite. "Estás literalmente leyendo un número." Ver la matriz enorme y cómo se lee de ella. [método✓
  "lookup-loop": muro de tabla gigante + lente que viaja a la fila del contexto, la enciende, lee el número,
  muestrea, desliza la ventana, repite; el héroe es la LENTE saltando de fila, no el texto].
- **V5 · Battle 1→2→3→4** ♻️ `NgramBattle`. Construida **una a una** (no n=4 de golpe); más impresionante;
  quizá cada columna mira su tabla. Celebración: "mira lo que has construido, escribe palabras".
- **V6 · ContextExplosion (tamaño felt)** ♻️ `ContextExplosion` 🗑️ [método✓ "drill-down"]. La tabla **CRECE**
  y se hace un **zoom/drill-down recursivo**: cada celda contiene la rejilla entera anterior; migas de pan de
  marcos que encogen; readout "estás viendo el 0,000007%". Madriguera: clic en cualquier celda para bajar.
  Héroe = **el descenso sin fondo**, no el número. (Hoy la rejilla tapa a 729 → idéntica para 729 y 14M = fallo.)

### §4 · Descubre sparsity + no-generaliza (él)
- **V7 · Tamaño descubierto empujando** (parte de V6/V3). El usuario sube a 10/20-grama y **descubre solo**
  el crecimiento exponencial. No se le cuenta el fallo: lo construye.
- **V8 · Sparsity descubierto** ♻️ `SparsityView` 🗑️. Con la tabla 4/5-grama de Shakespeare: "fíjate, está
  casi toda vacía" → el usuario pregunta por qué → concluye que está vacía. Zoom: esto es **un cuadradito**
  de la tabla gigante (tamaño otra vez). Madriguera: pasar por los huecos, ver los ceros él mismo.
- **V9 · BookConsumption / firehose** ♻️ `InfiniteTable` 🗑️ [método✓ "bottomless table"]. Arreglar que los %
  no suben (llegar a un **billón/trillón**) + **torrente de texto real** de Shakespeare que cae/se acelera/se
  emborrona, contador "libros leídos" disparado, y los medidores de n alto que **se niegan a llenarse** por
  mucho que viertas. El usuario **siente** la cantidad de texto y la futilidad. Descubre el muro vertiendo, no leyéndolo.
- **V10 · No-generaliza descubierto** ♻️ consolida `UnseenContext`+`TypoBreaker` 🗑️ (eran ~7 widgets de pega
  → 1 momento). Con un modelo grande, el usuario intenta escribir → de repente **escribe peor/falla** →
  "¿por qué peor si es más grande?" → mira → la tabla está vacía para ese contexto → concluye. Luego escribe
  algo que Shakespeare no vio («cute») → la máquina **muda**. Él llega a la conclusión.

### §5 · Puente espectacular
- **V11 · Progresión** 🆕. Cabezazos al teclado → bigrama → ahora **palabras**. "Mira lo que has construido."
- **V12 · Modelo grande showpiece** 🆕 (puede reusar `SimilarityBridge`). Un 10-grama al límite que escribe
  genial → "mira lo que has construido". Y los fallos se muestran **con esa máquina** (gato/perro = lo mismo
  para ella), no de golpe.
- **V13 · Historia** ♻️ (el "spandrel" es una basura). Reinó ~50 años; el autocompletar de tu móvil era esto;
  una anécdota real (alguien que se volvió loco con trigramas / problemas reales). Con mimo.
- **V14 · Puente final.** "La era del conteo ha terminado, la era del aprendizaje comienza." → cómo hacer que
  una máquina **aprenda** (no cuente) → embeddings = capítulo siguiente (leerlo antes para no spoilear).

### Transversal
- **Pistas ocultas** «¿cómo lo harías tú? piénsalo» antes de revelar soluciones (V2, V8, V10).
- **Capa de exploración** en toda matriz: jugar, pasar por los ceros, investigar.

---

## Mapeo a los widgets actuales (se pueden borrar enteros)
`ContextWindow`→V1 (rework/replace) · `ContextCounter`→ integra en V2/V3 (su juego de "afila la fila" sirve) ·
`NgramBattle`→V5 · `ContextExplosion`→V6 · `SparsityView`→V8 · `InfiniteTable`→V9 ·
`UnseenContext`+`TypoBreaker`→V10 (consolidar) · `SimilarityBridge`→V12/V14 · historia→V13.

## Por qué esta visión es mejor que v1
| v1 (falló) | visión |
|---|---|
| 5 secciones de fallo, 1 de logro | construir+celebrar primero, 1 muro descubierto |
| construcción dada ("la llave es más larga, eso es todo") | construcción **gradual, con las manos**, descubierta |
| fallos anunciados por el narrador | fallos **descubiertos** por el usuario |
| tamaño contado ("billones de filas") | tamaño **mostrado** (drill-down, firehose) |
| widgets ilegibles (5/5 "más-o-menos") | héroe claro + gate de ojos-frescos |
| ~7 widgets de pega | consolidados a los justos |

---

## Prueba del método: ¿se habrían generado estos sin el usuario?
4 agentes CIEGOS recibieron solo el objetivo de enseñanza de un beat + el método (nunca la idea del usuario)
y se les pidió idear. Resultado — **4 de 4 reinventaron (o mejoraron) las ideas del usuario**:
- **Escala** → "drill-down recursivo" (cada celda contiene la rejilla anterior, "ves el 0,000007%") ≈ el
  zoom/átomo del usuario, o mejor. ✓
- **Construir** → "split-the-row" (la fila se fractura en 27, tally 1→27→729, lo construye él) ≈ T→27-parejas. ✓
- **Datos** → "firehose / bottomless table" (torrente de Shakespeare, n alto no se llena) ≈ consumir libros. ✓
- **Escribir = leer un número** → "lookup-loop" (tabla gigante + lente que viaja a la fila) ≈ leer de la matriz. ✓

**Conclusión honesta:** el método endurecido **SÍ genera** las ideas del usuario sin su ayuda — *si la
ideación se hace de verdad*. El riesgo residual (que bajo prisa se haga una sola dirección, no 5) se cierra
con: (a) las 5 direcciones + elección como **artefacto** (`<cap>-gates/<slug>.directions.md`); (b) para los
HÉROES, **panel de generación en paralelo** (3-5 agentes idean → se elige/funde lo mejor) — el gemelo del
panel de jueces. Detalle: `method-failure-book.md` §4d.
