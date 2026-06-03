# N-gram — narrativa definitiva del capítulo (blueprint)

> El capítulo entero, en orden, con la **prosa escrita** (borrador es, calidad de publicación → se porta a
> i18n es+en en sync) y **cada visualizador marcado**. Método: **narrativa primero, visualizadores después**
> (mostrar > contar; maximizar visualizadores, minimizar texto; reusar/rehacer, no borrar por backend).
> Voz: aplicar los pilares + «No suenes a IA — los 7 delatores» (`narrative-guidelines.md`). Tras escribir,
> auditar la prosa con un agente. Revisar mil veces, sección a sección.
>
> **Leyenda:** ✅ vale · 🔧 rehacer (re-skin kit ámbar + faked→real, misma mecánica) · ♻️ rebuild (mecánica
> nueva) · ⬜ construir · (free-lab) = se mantiene en el modo playground, re-skin ámbar.
>
> **Objetivo:** el lector llega de bigram con la AMNESIA (la máquina sólo veía una letra atrás; «th», «sh»,
> «wh» le parecían iguales). Descubre que ampliar la ventana de contexto mejora la predicción, y luego siente
> el coste: la tabla explota (~27^n), se vacía (sparsity) y nunca generaliza (un contexto no visto, aunque
> casi idéntico a uno visto, la deja muda). Ese fallo es la puerta a las redes neuronales. Acento ÁMBAR con
> el mismo sistema visual de bigram. Humor por todo (la máquina que predice sin entender).
>
> **Arco:** curiosidad → triunfo → triunfo mayor → muro → decepción → nueva curiosidad. Triunfo (§3) ANTES
> del muro (§4). Bookends: abre con la amnesia, cierra con «predice sin entender» (callback al «fli fla»).

---

## HERO
- Eyebrow: **«Capítulo 2 · La era del conteo»**
- **Título: «Una ventana más *ancha*»** (acento en «ancha»). *(No nombrar «n-grama» en el hero; se gana en §1.)*
- **Subtítulo:** «El bigrama solo recordaba la última letra que escribías. Vamos a darle algo más de memoria.»
- *(Sin widget.)*

---

## §1 · Mirar más atrás   *(curiosidad → primer triunfo)*

**Prosa (recap de la amnesia, entrando en materia).** ⬜
> «El bigrama se quedó a medias. Escribía bien, letra a letra, pero tenía la memoria de un pez: en cuanto
> ponía una letra se olvidaba de todo lo de antes y solo le quedaba esa, la última, para decidir la
> siguiente. Por eso «th», «sh» y «wh» le daban igual. Las tres acaban en h, y ahí se le acababa la historia.»
>
> «Tú no lees así. Cuando llevas escrito «th» no arrancas de cero, todavía tienes la t metida en la cabeza, y
> el trozo de palabra entero, y por eso hueles lo que viene aunque nadie te enseñara la regla. Eso que
> arrastras tiene nombre, y lo vas a reconocer en cuanto lo veas: el contexto.»
>
> «Así que la pregunta se cae sola. ¿Y si le dejamos mirar más de una letra atrás?»

**VIS §1 · ContextWindow** — el juego de adivinar con contexto creciente. ♻️ **rebuild** (de
`ContextWindowVisualizer`, inline + faked + trivial).
- *Idea (una):* con poco contexto vas a ciegas; con más, casi cantas la respuesta.
- *Qué muestra:* texto real revelado letra a letra. Con UNA letra de contexto la distribución de «qué viene
  después» es plana (un volado). Al ampliar la ventana a 2, 3, 4, la apuesta se concentra hasta casi
  certeza. El lector **apuesta antes de revelar** (pilar 10).
- *Caso DIFÍCIL (pilar 10+11):* una palabra rara letra a letra, donde con poca pista no se acierta y solo el
  contexto tardío fuerza la respuesta. Etiquetar «1/2/3/4 letras de memoria», NO «trigrama» (eso se gana después).
- *Mecánica:* ventana deslizante de n + `HonestBar` con prob REAL + adivina→revela.
- *Datos:* `SHAKESPEARE_TEXT` (fragmento elegido) + `ngramData` n=1..4 reales. *Temperatura:* quiet.

**Prosa (payoff + se gana «n-grama»).** ⬜
> «Con una sola letra de pista ibas a ciegas, y lo sabías. Con cuatro casi cantabas la respuesta antes de que
> apareciera. Lo único que cambió fue cuánto le dejaste recordar.»
>
> «Y resulta que eso tiene nombres, uno por cada tamaño de memoria. Mirar dos letras atrás ya tiene nombre:
> trigrama. Tres, 4-grama. Y así hacia arriba, hasta el n-grama, que mira n. Lo bonito es lo que significa
> hacia atrás: el bigrama nunca fue un modelo aparte, era el más pequeño de la familia, un n-grama con n
> igual a dos.»

**Frase destacada (pull-quote):** «El bigrama no era un modelo aparte. Era un n-grama diminuto.»

**Puente → §2:** «Vale, mirar atrás ayuda. ¿Pero cómo aprende a hacer eso una máquina, si lo único que sabe
hacer es contar?»

---

## §2 · Contar con contexto   *(el cómo: misma mecánica, llave más larga)*

**Prosa.** ⬜
> «Lo mejor es que no hay truco nuevo. Es el mismo de siempre, contar, y solo cambia una cosa de nada.»
>
> «Antes la máquina guardaba una fila por cada letra, la lista de lo que suele venir después de la t. Ahora
> guarda una fila por cada pareja: lo que viene después de t-h, que no es lo mismo que lo que viene después
> de una h suelta cualquiera. La llave del cajón es más larga, eso es todo. Pero una llave más larga abre un
> cajón más concreto.»

**VIS §2 · ContextCounter** — lee el libro y construye la fila de un contexto de 2 letras. 🔧/♻️ **rework**
(de `NgramMiniTransitionTable`; absorbe ideas de `ConcreteImprovementExample`/`CountingComparisonWidget`).
- *Idea (una):* un contexto más largo afila la distribución (de «de todo un poco» a «casi siempre esto»).
- *Qué muestra:* lee el libro (papiro, MISMO idioma que bigram VIS4) contando «lo que sigue a TH». Sale una
  fila ESTRECHA, casi toda la probabilidad en la e. Al lado, la fila ANCHA de «H» del bigrama (de todo un
  poco). El contraste salta a la vista; el % del ganador sube en su sitio.
- *Mecánica:* `ParchmentReader` + `FixedAlphabetRow` (fila «th» afilada) vs fila «h» ancha + `Readout`.
- *Datos:* `ngramData` n=2 (fila «h») vs n=3 (fila «th») reales. *Temperatura:* showpiece tranquilo.

**Prosa (payoff).** ⬜
> «La fila de la t apostaba por la h, sí, pero con la boca pequeña: ganaba y aun así quedaba vida repartida
> por media docena de casillas más. La fila de t-h no tiene esas dudas. Después de «th», la «e» se lo come
> casi todo y al resto le deja las migajas.»

**Puente → §3:** «Si cada letra extra afila tanto la apuesta, la pregunta es inevitable: ¿qué sale si la
dejamos escribir de verdad, párrafos enteros, recordando dos letras, o tres, o cuatro?»

---

## §3 · El salto se siente   *(clímax / triunfo mayor)*

**Prosa (corta, monta el showpiece).** ⬜
> «Lo justo es verlo en marcha. Cuatro máquinas idénticas salvo en una cosa: a cada una le dejamos recordar
> una letra más que a la de su izquierda. Misma semilla para todas, y a escribir.»

**VIS §3 · NgramBattle** — n=1..4 generan a la vez, en LOCAL. 🔧 **rework** (de `NgramGenerationBattle`:
datos locales para paridad con el bench; kit + ámbar; sin texto de error en inglés). *(Su gemelo con backend
se queda en el free-lab.)*
- *Idea (una):* más contexto → texto legible. El salto se SIENTE de izquierda a derecha.
- *Qué muestra:* 4 columnas (n=1..4), misma semilla. n=1 sopa de letras; n=2 sílabas; n=3 palabras; n=4 casi frases.
- *Mecánica:* `MarkedText` typewriter por columna + reveal escalonado + generación local con backoff. La
  semilla la cambia el lector (el «tú prueba» va integrado).
- *Datos:* `ngramData.generateLocal(seed, len, temp, n)` n=1..4. *Temperatura:* showpiece (PLAY).

**Prosa (triunfo + semilla de la duda; celebrar ANTES del muro, pilar 13).** ⬜
> «La de la izquierda escupe sopa de letras y la de la derecha casi hila frases, y entre una y otra no hay ni
> un solo truco nuevo, solo tres letras más de memoria. Acabas de hacer que una máquina escriba mejor sin
> enseñarle una palabra, ni una regla, ni nada. Solo le diste un poco de pasado.»
>
> «Y ahí salta la tentación. Si cuatro va mejor que uno, ¿por qué parar? ¿Por qué no diez letras de memoria?
> ¿Por qué no cien?»

---

## §4 · El coste   *(empieza el muro)*

**Prosa.** ⬜
> «Aquí es donde la idea, que venía tan bien, se estampa contra un muro que no es de ingenio sino de
> aritmética pura.»
>
> «La tabla del bigrama tenía una fila por letra. Veintisiete filas, algo que cabe en una hoja. El trigrama
> ya necesita una fila por cada pareja posible de letras, veintisiete por veintisiete: setecientas
> veintinueve. El 4-grama, una por cada trío: casi veinte mil. Cada letra de memoria que le sumas no añade
> unas pocas filas, multiplica la tabla entera por veintisiete.»

**VIS §4a · ContextExplosion** — el número de filas posibles trepa hasta lo absurdo. 🔧 **rework** (de
`ExponentialGrowthAnimator`; absorbe `NgramFiveGramScale`).
- *Idea (una):* cada letra de contexto multiplica las filas por 27 (~27^n).
- *Qué muestra:* 27 → 729 → 19.683 → 531.441 → 14M… un número que trepa con el idioma de conteo (odómetro)
  y una rejilla que se multiplica ×27 por paso.
- *Mecánica:* avanza n (manual) + `Readout`/`CountUpNumber` + `ExplosionGrid`.
- *Datos:* 27^(n-1) real. *Temperatura:* showpiece.

**Prosa.** ⬜
> «Diez letras de memoria no son diez veces más tabla. Son billones de filas.»

**§4b · ¿y con palabras?** — callout breve (absorbe `CombinatoricExplosionTable`; o toggle char/palabra en
ContextExplosion):
> «Y todo esto contando solo letras, que son veintisiete. Si la máquina fuera con palabras enteras, el
> abecedario pasaría a tener decenas de miles de piezas, y estos números de ahora parecerían de juguete.»

**Puente → §5:** «Pero una tabla gigante, por gigante que sea, se puede guardar en algún disco. El problema
de verdad es otro, y es bastante peor.»

---

## §5 · El muro   *(sparsity — la decepción se asienta)*

**Prosa.** ⬜
> «Una tabla de veinte mil filas no vale nada si está vacía.»
>
> «Para rellenar la fila de t-h-e hace falta haber visto antes «the» en algún sitio, y eso pasa a cada paso,
> así que esa fila se llena sola. Pero la tabla guarda también un hueco para «zxq», y otro para «qjp», y para
> miles de combinaciones que no escribe nadie nunca. Ahí están, reservadas, esperando una visita que no llega.»
>
> «Y cuanto más larga haces la memoria, más se llena la tabla de filas rarísimas que jamás vas a ver. Crece y
> se vacía a la vez.»

**VIS §5a · SparsityView** — la tabla n=4 casi toda negra, conteos reales. 🔧/♻️ **rework** (de
`SparsityHeatmap`: datos reales, kit heat ámbar, sin traffic-lights).
- *Idea (una):* la mayoría de contextos posibles nunca se vieron.
- *Qué muestra:* rejilla de contextos posibles para n=4, casi toda negra; pocas casillas encendidas (las
  vistas de verdad). Número honesto: «de X posibles, solo Y aparecieron». Hover → «visto N veces» / «nunca».
- *Mecánica:* `heat` real (rampa ámbar) + grid + `Readout` observados/total + hover.
- *Datos:* `ngramData` diagnostics reales. *Temperatura:* showpiece detective.

**Prosa (+ puente al infinito).** ⬜
> «Casi todo negro. Y esos huecos no son un fallo del dibujo, son combinaciones que no se usan jamás.»
>
> «Llegados aquí casi todo el mundo piensa lo mismo: vale, pues le doy más texto. Más libros, más datos, lo
> que haga falta hasta llenarla.»

**VIS §5b · InfiniteTable** — ni con datos infinitos se llena. 🔧 **rework** (de
`InfiniteTableThoughtExperiment`: kit ámbar).
- *Idea (una):* la sparsity no se vence con más datos.
- *Qué muestra:* un control para subir los datos de entrenamiento (mil → millón → billón de letras). Para n
  bajo la tabla se llena; para n alto, por mucho que subas, sigue casi vacía.
- *Mecánica:* slider + barras de % de llenado por n que recalculan.
- *Datos:* modelo de llenado honesto (coupon-collector), etiquetado como aproximación. *Temperatura:* quiet.

**Prosa (honesta con el límite, pilar 15).** ⬜
> «No hay manera. Por mucho texto que le metas, las ventanas grandes siguen casi vacías, porque hay más
> combinaciones posibles que segundos lleva existiendo el universo. No es que falte esfuerzo. Es que no cabe.»

**Puente → §6:** «Y aun así, lo peor no es la tabla vacía. Es lo que la máquina hace al toparse con una
casilla en blanco.»

---

## §6 · No generaliza   *(el fallo de fondo)*

**Prosa.** ⬜
> «Le das un contexto que ha visto mil veces y contesta sin pestañear, segurísima. Le cambias una sola letra,
> una, por algo que no vio nunca, y se queda en blanco. En blanco de verdad, sin media palabra que ofrecer.»

**VIS §6a · UnseenContext** — visto → seguro; cambia una letra → mudo. 🔧 **rework** (de
`GeneralizationFailureDemo`: datos reales, kit).
- *Idea (una):* no generaliza a contextos no vistos.
- *Qué muestra:* dos contextos casi idénticos. Uno que el libro vio (apuesta segura, barra alta). Otro con
  UNA letra cambiada, que no vio nunca (nada). La diferencia entre saber y no saber es una letra.
- *Mecánica:* `MarkedText` (marca la letra cambiada) + `HonestBar` (apuesta vs nada) + `Verdict`.
- *Datos:* `ngramData` real (contexto existe / no existe). *Temperatura:* quiet.

**Prosa (+ puente al typo).** ⬜
> «Y lo absurdo es que esos dos contextos se parecen como dos gotas de agua. Tú contestarías lo mismo a los
> dos sin pensarlo, porque para ti se parecen. Para la máquina no se parecen en nada: o vio esa fila clavada,
> letra por letra, o no la vio, y entre esas dos opciones no hay término medio.»
>
> «Lo peor es que ni siquiera hace falta rebuscar palabras raras. Un dedo torpe sobra.»

**VIS §6b · TypoBreaker** — escribe lo que quieras y rómpelo. 🔧 **rework** (de `TypoWordBreaker`: datos
reales, kit).
- *Idea (una):* tu typo cotidiano también lo rompe, y lo rompes tú.
- *Qué muestra:* un campo libre. Algo común → apuesta con confianza. Un typo, una palabra inventada, un
  nombre raro → la confianza se desploma a la del azar puro.
- *Mecánica:* input + marca conocido/desconocido + barra de confianza vs línea de azar.
- *Datos:* `ngramData` real (subcadenas vistas / no vistas). *Temperatura:* quiet.

**Prosa (diagnóstico de fondo, bookend al «fli fla»).** ⬜
> «El bigrama predecía sin entender una palabra de lo que hacía. Su versión grande, el n-grama, predice
> bastante mejor, pero entender, lo que se dice entender, sigue sin entender nada. La diferencia es que ahora
> lo disimula. Hasta que le cambias una letra.»

**KeyTakeaway (sage):** «El n-grama no aprende reglas, memoriza trozos. Y lo que no memorizó no existe para él.»

**Puente → §7:** «El fallo tiene una raíz concreta, y ponerle nombre es ya medio camino hacia el capítulo
siguiente.»

---

## §7 · El puente   *(nueva curiosidad → CTA)*

**Prosa.** ⬜
> «Para la máquina, «gato» y «perro» no tienen nada que ver el uno con el otro. Son dos filas distintas de la
> tabla, dos etiquetas, dos números sin más, y dos números distintos se parecen entre sí lo mismo que dos
> teléfonos cualesquiera: nada.»

**VIS §7 · SimilarityBridge** — palabras parecidas como IDs sin relación → toggle → se agrupan. 🔧 **rework**
(de `SimilarityBlindSpot`: kit ámbar, un solo acento).
- *Idea (una):* le falta entender la similitud → eso es lo que viene.
- *Qué muestra:* palabras claramente parecidas (gato/perro/ratón; lunes/martes) como IDs aislados, sin
  relación. Un toggle revela cómo se agruparían si entendiera que se parecen. El «antes» es el n-grama; el
  «después», el siguiente capítulo.
- *Mecánica:* chips/IDs dispersos → toggle → se acercan/agrupan.
- *Datos:* ejemplos conceptuales fijos. *Temperatura:* quiet.

**Prosa.** ⬜
> «Si la máquina supiera que «gato» y «perro» van juntos, lo que aprende de uno le serviría para el otro de
> regalo, y no necesitaría haber visto cada contexto del mundo, solo unos cuantos parecidos. Dejaría de
> memorizar de carrerilla y empezaría a entender de verdad.»
>
> «Eso ya no se consigue contando. Hace falta otra cosa, y esa otra cosa es el capítulo que viene.»

**Plegable · Historia (opt-in, máx 1).** 🔧 rework `StatisticalEraTimeline` o ⬜ prosa nueva.
- Contenido: la época en que los n-gramas mandaron de verdad (reconocimiento de voz, traducción, la gente de
  IBM con Jelinek, los años 80 y 90, aquello de «no hay mejor dato que más dato»). No eran un juguete, movían
  la industria, hasta que las redes neuronales cruzaron el muro. *(Bigram ya tiene un plegable de Shannon; no
  duplicar.)*

**CTA · puente al siguiente capítulo (→ `/lab/neural-networks`).** 🔧 rework (ámbar, con oficio).
- Momento cinemático + frase: «Contar nos trajo hasta aquí. Para cruzar el muro hay que dejar de contar.»
- Hook: «Hace falta una idea nueva: que las cosas que se parecen se traten parecido. De eso van las redes
  neuronales.»
- Botón: → «Las redes neuronales».

---

## Reparto por modos — NO se borra NADA por el backend (mejor sin backend, pero no es razón para descartar)
La NARRATIVA usa los 9 widgets de enseñanza del kit (tabla), con datos locales reales (paridad con el bench,
igual que la narrativa de bigram). El **FREE-LAB** mantiene TODO su set interactivo/instrumento, re-skin a
ámbar bajo `[data-ngram-theme]` (arreglando el caos multi-acento cyan/esmeralda/violeta/rojo → ámbar):
- `ContextControl`, `TransitionMatrix` (ámbar), `InferenceConsole` (path ngram/ámbar), `NgramStepwisePrediction`
  (ámbar, no cyan), `GenerationPlayground` (path ngram/ámbar), `NgramContextDrilldown` (ámbar),
  `NgramGenerationBattle` (ámbar), `NgramComparisonDashboard`, `NgramSparsityIndicator`, `NgramPerformanceSummary`,
  `NgramLossChart`, `NgramTechnicalExplanation`, `NgramInteractiveGenerator`.
- *Merges suaves (solo si son duplicado real de IDEA y no se pierde nada):* `CountingComparisonWidget`,
  `ConcreteImprovementExample` → ContextCounter · `GrowingTablesComparison`, `NgramFiveGramScale`,
  `CombinatoricExplosionTable` → ContextExplosion+SparsityView. Ante la duda, se quedan. `lmLabClient.ts` intacto.

## Resumen
- ♻️ rebuild: §1 ContextWindow. 🔧 rework (kit ámbar, real): §2 ContextCounter, §3 NgramBattle (local), §4a
  ContextExplosion, §5a SparsityView, §5b InfiniteTable, §6a UnseenContext, §6b TypoBreaker, §7 SimilarityBridge.
- ⬜ decidir en build: §4b (callout vs toggle), plegable Historia, primitivas kit nuevas (ContextWindow, ExplosionGrid).
- Narrativa: 9 visualizadores hilados en arco. Free-lab: set completo, re-skin ámbar.
- Prosa: voz humana (7 delatores evitados), es→en en sync, encuadre en el cuerpo, no en widgets.
