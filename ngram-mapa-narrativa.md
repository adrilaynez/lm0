# N-gram — narrativa definitiva del capítulo (blueprint)

> El capítulo entero, en orden, con la **prosa escrita** (borrador es, calidad de publicación → se porta a
> i18n) y **cada visualizador marcado**. Esto es lo que se construye; el diseño no se inventa por el camino.
> Método: **narrativa primero, visualizadores después** (mostrar > contar; maximizar visualizadores,
> minimizar texto; reusar/rehacer, borrar sólo dupes y cromo de dashboard). Revisar mil veces, sección a sección.
>
> **Leyenda:** ✅ vale · 🔧 rehacer (re-skin kit ámbar + faked→real, misma mecánica) · ♻️ rebuild (mecánica
> nueva) · ⬜ construir · ❌ quitar.
>
> **Objetivo:** el lector, que llega de bigram con la AMNESIA (la máquina sólo veía una letra atrás; «th»,
> «sh», «wh» le parecían iguales), descubre que **ampliar la ventana de contexto mejora la predicción**…
> y luego SIENTE el coste: la tabla explota (~27^n), se vacía (sparsity), y nunca generaliza (un contexto
> no visto, aunque casi idéntico a uno visto, la deja muda). Ese fallo es la puerta a las redes neuronales.
> Acento ÁMBAR con el MISMO sistema visual de bigram. Humor por todo (la máquina que predice sin entender).
>
> **Arco emocional:** curiosidad → triunfo → triunfo mayor → muro → decepción → nueva curiosidad.
> **Continuidad:** la «t»/«th» de bigram se arrastra; callbacks a la amnesia y al «fli fla».

---

## HERO
- Eyebrow: **«Capítulo 2 · La era del conteo»** (sigue la misma era que bigram)
- **Título: «Una ventana más *ancha*»** (acento en «ancha»). *(Alternativas a sopesar: «Más memoria»,
  «Mirar más atrás». No nombrar «n-grama» en el hero: se gana en §1.)*
- **Subtítulo:** «El bigrama recordaba una sola letra. Vamos a darle un poco más.»
- *(Sin widget. Hereda el cierre de bigram con un golpe limpio.)*

---

## §1 · Mirar más atrás   *(curiosidad → primer triunfo)*

**Prosa (recap-amnesia in media res, sin lección).** ⬜ escribir
> «Al final, el bigrama se quedó corto. Escribía letra a letra, pero solo se acordaba de la última. Para
> él, «th», «sh» y «wh» eran la misma cosa: acababan en h, y punto.»
>
> «Tú no funcionas así. Cuando lees «th», no empiezas de cero: arrastras la t. Llevas un trozo de frase en
> la cabeza, no una letra suelta.»
>
> «Eso que arrastras ya lo intuyes: es el **contexto**. Y la pregunta es tonta de lo evidente que parece.
> ¿Y si le dejamos mirar más de una letra atrás?»

**VIS §1 · ContextWindow** — el juego de adivinar con contexto creciente. ♻️ **rebuild** (de
`ContextWindowVisualizer`, que está inline y con datos inventados).
- *Idea (una):* con poco contexto vas a ciegas; con más, casi cantas la respuesta.
- *Qué muestra:* un texto real revelado letra a letra. Con UNA letra de contexto, la distribución de «qué
  viene después» es plana (un volado entre muchas). Al ampliar la ventana a 2, 3, 4 letras, la apuesta se
  concentra hasta volverse casi segura. El lector **apuesta antes de revelar** (pilar 10).
- *Caso DIFÍCIL (pilar 10+11):* una palabra rara revelada letra a letra, donde con poca pista NO se acierta
  y solo el contexto tardío fuerza la respuesta. Un caso que se clava a la primera mata la lección.
- *Mecánica:* ventana deslizante de n + barras honestas (`HonestBar`) con prob REAL + adivina→revela.
- *Datos:* `SHAKESPEARE_TEXT` (fragmento elegido) + `ngramData` counts n=1..4 reales.
- *Temperatura:* quiet (avance manual).

**Prosa (payoff + se gana «n-grama»).** ⬜ escribir
> «Con una letra, ibas a ciegas. Con cuatro, casi cantabas la respuesta. La diferencia no es magia, es
> contexto.»
>
> «El bigrama miraba una letra. Mira dos y es un trigrama; tres, un 4-grama; n letras, un **n-grama**. El
> bigrama no era otro modelo: era el n-grama más pequeño, con n igual a dos.»

**Frase destacada (pull-quote, bookend).** «El bigrama no era un modelo aparte. Era un n-grama diminuto.»

**Puente → §2:** «Mirar más atrás ayuda. ¿Pero cómo aprende a hacerlo una máquina que solo sabe contar?»

---

## §2 · Contar con contexto   *(el cómo: misma mecánica, llave más larga)*

**Prosa.** ⬜ escribir
> «Buenas noticias: no hay truco nuevo. Es el mismo de antes, contar. Solo cambia una cosa.»
>
> «Antes guardaba una fila por cada letra: lo que viene después de la t. Ahora guarda una fila por cada par
> de letras: lo que viene después de t-h. La llave de la fila es más larga, nada más.»
>
> «Y eso lo cambia todo, porque una llave más larga es una llave más específica.»

**VIS §2 · ContextCounter** — lee el libro y construye la fila de un contexto de 2 letras. 🔧/♻️ **rework**
(de `NgramMiniTransitionTable`; absorbe la idea de `ConcreteImprovementExample`/`CountingComparisonWidget`).
- *Idea (una):* un contexto más largo afila la distribución (de «de todo un poco» a «casi siempre esto»).
- *Qué muestra:* lee el libro (papiro, MISMO idioma que bigram VIS4) contando «lo que sigue a TH». Sale una
  fila ESTRECHA, casi toda la probabilidad en la e. Al lado, la fila ANCHA de «H» del bigrama (de todo un
  poco). El contraste salta a la vista. El % del ganador sube en su sitio.
- *Mecánica:* `ParchmentReader` + `FixedAlphabetRow` (fila «th» afilada) + comparación con la fila «h» ancha
  + `Readout`.
- *Datos:* `ngramData` n=2 (fila «h») vs n=3 (fila «th») reales sobre Shakespeare.
- *Temperatura:* showpiece tranquilo (lectura).

**Prosa (payoff).** ⬜ escribir
> «La fila de la t apostaba por la h, pero a medias: ganaba con holgura y aun así había vida en muchas otras
> casillas. La fila de t-h no duda. Después de «th» viene «e», y casi nada más. Más contexto, menos dudas.»

**Puente → §3:** «Si cada letra de contexto afila la apuesta, ¿qué pasa si la dejamos escribir párrafos
enteros recordando dos, tres, cuatro letras?»

---

## §3 · El salto se siente   *(clímax / triunfo mayor)*

**Prosa (corta, monta el showpiece).** ⬜ escribir
> «Lo justo es verlo. Cuatro máquinas, la misma semilla, y a cada una le dejamos recordar un poco más que a
> la anterior.»

**VIS §3 · NgramBattle** — n=1..4 generan a la vez, en LOCAL. 🔧 **rework** (de `NgramGenerationBattle`:
datos locales + kit + ámbar; sin backend, sin texto de error en inglés hardcodeado).
- *Idea (una):* más contexto → texto legible. El salto se SIENTE de izquierda a derecha.
- *Qué muestra:* 4 columnas (n=1,2,3,4), misma semilla. n=1 escupe sopa de letras; n=2 tiene sílabas; n=3
  suelta palabras reconocibles; n=4 casi frases.
- *Mecánica:* `MarkedText` typewriter por columna + reveal escalonado + generación local con backoff. El
  lector cambia la semilla (el «tú prueba» va integrado, no es widget aparte → absorbe `NgramInteractiveGenerator`).
- *Datos:* `ngramData.generateLocal(seed, len, temp, n)` n=1..4.
- *Temperatura:* showpiece (PLAY).

**Prosa (triunfo + semilla de la duda; celebrar ANTES del muro, pilar 13).** ⬜ escribir
> «De sopa de letras a casi-palabras, solo por recordar tres letras más. Acabas de hacer que escriba mejor
> sin enseñarle ni una palabra nueva. Solo le diste memoria.»
>
> «Y la tentación es inmediata. Si cuatro es mejor que uno, ¿por qué parar? ¿Por qué no diez letras de
> memoria? ¿Por qué no cien?»

---

## §4 · El coste   *(empieza el muro)*

**Prosa.** ⬜ escribir
> «Aquí la idea, tan buena, se da contra un muro. Y el muro es de matemáticas, no de ingenio.»
>
> «La tabla del bigrama tenía una fila por letra. Veintisiete filas, manejable. El trigrama necesita una por
> cada par de letras: veintisiete por veintisiete, setecientas veintinueve. El 4-grama, una por cada trío:
> casi veinte mil. Cada letra de memoria que añades multiplica la tabla por veintisiete.»

**VIS §4a · ContextExplosion** — el número de filas posibles trepa hasta lo absurdo. 🔧 **rework** (de
`ExponentialGrowthAnimator`; absorbe `NgramFiveGramScale`).
- *Idea (una):* cada letra de contexto multiplica las filas por 27 (~27^n).
- *Qué muestra:* 27 → 729 → 19.683 → 531.441 → 14M… un número que crece con el idioma de conteo (odómetro)
  y una rejilla que se multiplica ×27 por paso.
- *Mecánica:* avanza n (manual) + `Readout`/`CountUpNumber` trepando + `ExplosionGrid`.
- *Datos:* 27^(n-1) real.
- *Temperatura:* showpiece.

**Prosa.** ⬜ escribir
> «Diez letras de memoria no son diez veces más tabla. Son billones de filas.»

**§4b · ¿y con palabras?** — *(decidir en build):* callout breve O un toggle char/palabra dentro de
ContextExplosion, absorbiendo `CombinatoricExplosionTable`. Texto callout:
> «Y eso contando solo letras. Con palabras enteras el vocabulario no es de veintisiete símbolos, sino de
> decenas de miles. La tabla no explotaría: se saldría de cualquier escala imaginable.»

**Puente → §5:** «Gigantesca no es imposible: hay discos enormes. El problema de verdad es otro, y es peor.»

---

## §5 · El muro   *(sparsity — la decepción se asienta)*

**Prosa.** ⬜ escribir
> «Una tabla de veinte mil filas no sirve de nada si está vacía.»
>
> «Para llenar la fila de t-h-e necesitas haber visto «the» en el texto. Sale en todas partes. ¿Pero «zxq»?
> ¿«qjp»? Esas filas existen en la tabla, esperando, y nunca se llenan. Nadie escribe así.»
>
> «Cuantas más letras de memoria pides, más filas raras aparecen y menos llegas a ver. La tabla crece, pero
> se vacía.»

**VIS §5a · SparsityView** — la tabla n=4 casi toda negra, conteos reales. 🔧/♻️ **rework** (de
`SparsityHeatmap`: datos reales, kit heat ámbar, sin traffic-lights).
- *Idea (una):* la mayoría de contextos posibles nunca se vieron.
- *Qué muestra:* rejilla de contextos posibles para n=4, abrumadoramente negra; solo unas pocas casillas
  encendidas (las vistas de verdad). Número honesto: «de X posibles, solo Y aparecieron». Hover → «visto N
  veces» / «nunca».
- *Mecánica:* `heat` real (rampa ámbar) + grid + `Readout` observados/total + hover.
- *Datos:* `ngramData` diagnostics reales (observedContexts vs contextSpace).
- *Temperatura:* showpiece detective.

**Prosa.** ⬜ escribir
> «Casi todo negro. Esas casillas vacías no son un error: son contextos que el idioma no usa nunca. Pero hay
> un problema más fino escondido ahí.»
>
> «Quizá pienses: pues le doy más texto. Más libros, más datos, hasta llenarla.»

**VIS §5b · InfiniteTable** — ni con datos infinitos se llena. 🔧 **rework** (de
`InfiniteTableThoughtExperiment`: kit ámbar).
- *Idea (una):* la sparsity no se vence con más datos.
- *Qué muestra:* un control para subir los datos de entrenamiento (mil → millón → billón de letras). Para n
  bajo, la tabla se llena. Para n alto, por mucho que subas, sigue casi vacía.
- *Mecánica:* slider + barras de % de llenado por n que recalculan.
- *Datos:* modelo de llenado honesto (coupon-collector), etiquetado como aproximación.
- *Temperatura:* quiet (manipulación directa).

**Prosa (honesta con el límite, pilar 15).** ⬜ escribir
> «Por mucho dato que le eches, las ventanas grandes nunca se llenan. Hay más frases posibles que segundos
> ha vivido el universo. No es cuestión de esforzarse más: es imposible por diseño.»

**Puente → §6:** «Y aun así, lo peor no es la tabla vacía. Es lo que la máquina hace al toparse con una
casilla en blanco.»

---

## §6 · No generaliza   *(el fallo de fondo)*

**Prosa.** ⬜ escribir
> «Pregúntale qué viene después de algo que vio mil veces y responde sin pestañear. Cámbiale una sola letra,
> por algo que nunca vio, y se queda en blanco. Literalmente.»

**VIS §6a · UnseenContext** — visto → seguro; cambia una letra → mudo. 🔧 **rework** (de
`GeneralizationFailureDemo`: datos reales, kit).
- *Idea (una):* no generaliza a contextos no vistos.
- *Qué muestra:* dos contextos casi idénticos. Uno que el libro vio (apuesta segura, barra alta). Otro con
  UNA letra cambiada, que no vio nunca (nada, mudo). La diferencia entre saber y no saber es una letra.
- *Mecánica:* `MarkedText` (marca la letra cambiada) + `HonestBar` (apuesta vs nada) + `Verdict`.
- *Datos:* `ngramData` real (contexto existe / no existe).
- *Temperatura:* quiet.

**Prosa.** ⬜ escribir
> «Y aquí está lo absurdo. Los dos contextos se parecen como dos gotas de agua. Tú responderías igual a los
> dos. La máquina no, porque para ella no se parecen en nada: o vio esa fila exacta, o no la vio. No hay
> punto medio.»
>
> «Y no hace falta rebuscar palabras raras. Un dedo torpe basta.»

**VIS §6b · TypoBreaker** — escribe lo que quieras y rómpelo. 🔧 **rework** (de `TypoWordBreaker`: datos
reales, kit).
- *Idea (una):* tu typo cotidiano también lo rompe (interacción de verdad, lo rompes tú).
- *Qué muestra:* un campo libre. Algo común → apuesta con confianza. Un typo, una palabra inventada, un
  nombre raro → la confianza se desploma a la del azar puro.
- *Mecánica:* input + marca conocido/desconocido + barra de confianza vs línea de azar.
- *Datos:* `ngramData` real (subcadenas vistas / no vistas).
- *Temperatura:* quiet (interacción libre).

**Prosa (diagnóstico de fondo + bookend al «fli fla» de bigram).** ⬜ escribir
> «El bigrama predecía sin entender. Su nieto, el n-grama, predice mejor, pero sigue sin entender nada. Solo
> que ahora lo disimula, hasta que le cambias una letra.»

**KeyTakeaway (sage):** «El n-grama no aprende reglas. Memoriza trozos. Y lo que no memorizó, no existe para él.»

**Puente → §7:** «El fallo tiene una raíz. Y nombrarla es ya medio camino hacia lo que viene.»

---

## §7 · El puente   *(nueva curiosidad → CTA)*

**Prosa.** ⬜ escribir
> «Para la máquina, «gato» y «perro» no se parecen en nada. Tampoco «the cat» y «the dog». Cada contexto es
> una etiqueta, un número, una fila. Y dos filas distintas son tan parecidas como dos números de teléfono.»

**VIS §7 · SimilarityBridge** — palabras parecidas como IDs sin relación → toggle → se agrupan. 🔧 **rework**
(de `SimilarityBlindSpot`: kit ámbar, un solo acento).
- *Idea (una):* le falta entender la similitud → eso es lo que viene.
- *Qué muestra:* palabras claramente parecidas (gato/perro/ratón; lunes/martes) como IDs aislados, sin
  relación. Un toggle revela cómo se AGRUPARÍAN si la máquina entendiera que se parecen. El «antes» es el
  n-grama; el «después», el siguiente capítulo.
- *Mecánica:* chips/IDs dispersos → toggle → se acercan/agrupan.
- *Datos:* ejemplos conceptuales fijos (sin números inventados).
- *Temperatura:* quiet.

**Prosa.** ⬜ escribir
> «Si entendiera que «gato» y «perro» se parecen, lo que aprende de uno valdría para el otro. No tendría que
> ver cada contexto: le bastaría ver contextos parecidos. Dejaría de memorizar y empezaría a generalizar.»
>
> «Eso ya no se hace contando. Hace falta otra cosa.»

**Plegable · Historia (opt-in, máx 1).** 🔧 rework `StatisticalEraTimeline` o ⬜ prosa nueva.
- Contenido: la era en que los n-gramas REINARON de verdad (reconocimiento de voz / traducción, IBM-Jelinek,
  «no hay mejor dato que más dato», años 80-2000). No eran un juguete; movieron la industria hasta que las
  redes neuronales cruzaron el muro. *(Alternativa: Shannon 1951 y sus aproximaciones n-grama de letras —
  pero bigram ya tiene un plegable de Shannon; mejor no duplicar.)*

**CTA · puente al siguiente capítulo (→ `/lab/neural-networks`).** 🔧 rework (ámbar, con oficio).
- Momento cinemático + frase: «Contar nos trajo hasta aquí. Para cruzar el muro, hay que dejar de contar.»
- Hook: «La máquina necesita una idea nueva: que las cosas parecidas se traten parecido. Eso hacen las redes
  neuronales.»
- Botón: → «Las redes neuronales».

---

## ❌ Widgets que se QUITAN (cromo dashboard / backend / verdaderos dupes — NO enseñan)
- ❌ `NgramComparisonDashboard`, `NgramSparsityIndicator`, `NgramPerformanceSummary`, `NgramLossChart`,
  `NgramTechnicalExplanation` — volcados de métricas de backend / fichas técnicas, no enseñan una idea.
- ❌ `NgramStepwisePrediction` — cyan, backend, redundante con la batalla.
- ❌ `NgramContextDrilldown` — backend; su idea (entrar en la distribución de un contexto) la cubre ContextCounter.
- ❌ `NgramInteractiveGenerator` — 3er generador; el «tú prueba» se integra en NgramBattle (cambiar semilla).
- *Merges (no borrar a la ligera; sus ideas se absorben):* `CountingComparisonWidget`,
  `ConcreteImprovementExample` → ContextCounter · `GrowingTablesComparison`, `NgramFiveGramScale` →
  ContextExplosion+SparsityView · `CombinatoricExplosionTable` → §4b.

## Resumen de trabajo
- ♻️ **Rebuild:** §1 ContextWindow (datos reales + juego difícil).
- 🔧 **Rework fuerte (faked→real, kit ámbar):** §2 ContextCounter, §3 NgramBattle (local), §5a SparsityView,
  §5b InfiniteTable, §6a UnseenContext, §6b TypoBreaker, §7 SimilarityBridge, §4a ContextExplosion.
- ⬜ **Construir/decidir:** §4b (callout vs toggle), plegable Historia, primitivas kit nuevas
  (ContextWindow, ExplosionGrid).
- ❌ **Quitar:** 8 widgets (dashboard/backend/dupes) arriba.
- 📝 **Prosa nueva** en todas las secciones (es → en), encuadre en el cuerpo, no en los widgets.

## Conteo de visualizadores: 9-10 (vs ~11 actuales repartidos en 2 modos). No menos: mismos/ más, mejor hilados.
