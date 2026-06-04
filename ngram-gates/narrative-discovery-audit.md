# Auditoría Pedagógica: Descubrir vs. Anunciar — Capítulo N-gram v3

**Fecha:** 2026-06-03  
**Auditor:** Agente independiente (no participó en la construcción del capítulo)  
**Fuentes revisadas:** `narrative-guidelines.md`, `ngram-vision.md`, `ngramSpine.ts`, `NgramNarrative.tsx`, `src/i18n/es.ts` (`ngramNarrative.v3.*`), widgets `.tsx` de `src/features/lab/components/ngram/`

---

## A. Rúbrica aplicada

Las siguientes reglas de `narrative-guidelines.md` actúan como vara de medir:

1. **R1 — Descubrir-no-contar (pilar 3):** ningún término/conclusión llega antes de la experiencia que lo hace obvio. El orden es SENTIR → NOMBRAR.
2. **R2 — Cuerpo monta la escena, el widget da la respuesta (pilar 5/11):** la prosa nunca escribe en el lead la conclusión que el widget podría dejar hallar. "Nunca escribas la conclusión que un visualizador podría dejar que encuentre."
3. **R3 — Construir CUESTA (pilar 12):** cada salto a un nivel superior se gana; el usuario hace el modelo con sus manos y siente que lo levantó él.
4. **R4 — Celebrar antes de criticar (pilar 13):** la victoria se celebra ANTES del anticlímax honesto. No apilar fracasos.
5. **R5 — Narrar el fallo, nunca avisarlo (pilar 11):** el fallo se descubre tocando, no se anuncia en el lead.
6. **R6 — La construcción debe costar — y el usuario intenta la SOLUCIÓN (pilar 10/12):** cuando toca resolver algo, se planta una pregunta con pista suave antes de revelar.
7. **R7 — Mostrar ESCALA, nunca solo el número (CLAUDE.md + narrative-guidelines gates):** números grandes van acompañados de un visual de magnitud que cambia con el número.
8. **R8 — El fallo lo VIVE el usuario, no se lo cuentan (P8):** se dramatiza en el widget, no se describe en la prosa.
9. **R9 — Arco emocional (pilar 13):** curiosidad → logro → logro mayor → triunfo → decepción → nueva curiosidad. No apilar más de UN muro.
10. **R10 — Humor y voz humana (pilar 2 + La voz):** cómplice, no docente. Sin tono de manual, sin guiones largos como muletilla.
11. **R11 — Cero conocimiento asumido (pilar 4):** ningún término técnico antes de la experiencia que lo justifica.
12. **R12 — Puerta "¿y si?" (pilar 8):** cada transición es una pregunta del lector, no un anuncio del narrador.

---

## B. Auditoría sección por sección

### Hero / Apertura

**Idea nueva:** La máquina anterior tenía amnesia; más memoria la arreglaría. Promesa de que "se nos irá de las manos."

**Prosa (v3):**
> "La máquina anterior solo recordaba la última letra que escribías. Vamos a darle más memoria. Se nos va a ir de las manos."

**Veredicto: CUENTA/ANUNCIA parcialmente.**  
La frase "Se nos va a ir de las manos" es un anuncio del narrador de lo que el usuario todavía no ha vivido. El fallo del escalado no se ha ganado aún — ya se tiene la promesa de que saldrá mal. Viola **R5** (narrar el fallo, no avisarlo): el suspenso de "¿saldrá bien o mal?" se destruye en el héroe mismo antes de que el usuario haya tocado nada.

**¿Construcción cuesta?** No aplica al hero.  
**¿Se celebra antes de criticar?** No aplica aún.

---

### §1 · Mirar más atrás — Beat amnesia (AmnesiaReplay)

**Idea nueva:** Con una sola letra de memoria, «th»/«sh»/«wh» son indistinguibles → hay palabras imposibles de acertar.

**Prosa lead (v3):**
> "Antes de arreglarlo, vale la pena verla fallar en cámara lenta."

**Veredicto: ANUNCIA el fallo antes de que ocurra.**  
La frase "vale la pena verla fallar" es un aviso explícito del resultado ("va a fallar") ANTES de que el usuario interactúe. El lector llega al widget sabiendo que el widget va a mostrar un fallo. Esto viola directamente **R2** y **R5**: "nunca escribas en la prosa la conclusión que un visualizador podría dejar que encuentre."

La cita exacta de `narrative-guidelines.md` que se incumple: *"Nunca escribas en la prosa la conclusión que un visualizador podría dejar que encuentre («la tabla está vacía», «se estampa contra un muro», «se queda en blanco») antes de que la encuentre: le quitas la peonza de las manos."*

**¿Construcción cuesta?** El widget es OBSERVE (el lector ve el widget; puede presionar "otra vez" y "tapar"). No construye nada con sus manos. El `ngram-vision.md` decía: "el fallo del bigrama lo descubre él." El widget MUESTRA el fallo con etiqueta "no las distingue" visible desde el primer frame, ANTES de cualquier interacción.

**Caption dentro del widget:**  
`"no las distingue: la misma apuesta para las tres"` — es el anuncio más grave del capítulo. La conclusión está literalmente escrita en la pantalla inicial del widget. El usuario no la deduce: la lee. Viola **R1** y **R2** completamente.

**¿Humor/voz?** "vale la pena verla fallar en cámara lenta" tiene algo de voz, pero es un anuncio de professor, no de cómplice.

---

### §1 · Mirar más atrás — Beat widen (WidenWindow)

**Idea nueva:** Con más letras de memoria, la confianza sube de un volado a casi-certeza.

**Prosa lead (v3):**
> "Así que la pregunta cae sola: ¿y si la dejamos mirar más de una letra atrás?"

**Veredicto: DESCUBRE — el mejor beat del capítulo.**  
El lead hace una pregunta genuina. El widget revela la respuesta progresivamente (el % sube cada vez que el lector pulsa). El héroe (el %) es visible y su subida ES la idea. Cumple **R1**, **R2**, **R12**.

**¿Construcción cuesta?** El lector pulsa "añadir una letra de memoria" — simple pero genuino. Podría costar más (el `ngram-vision.md` hablaba de que el usuario ADIVINA antes de revelar — ese momento de predicción antes de la respuesta está ausente: el lector nunca apuesta cuánto subirá el %).

**Caption "· y acierta"** cuando la apuesta es correcta: esto ES descubrimiento activo. Bien.

**Fallo menor:** La prosa `afterAmnesia` justo antes de este beat ya resume la conclusión del beat anterior:
> "Para ella «th», «sh» y «wh» son lo mismo: las tres acaban en h, y ahí se le acaba el mundo. Con una sola letra de memoria, hay palabras que es imposible acertar, por mucho que se esfuerce."

El usuario lee el diagnóstico completo del AmnesiaReplay en prosa, además del caption del widget. Duplicación: viola la puerta de flujo (cero duplicación, prosa Y widgets).

---

### §2 · Construirla tú — Beat split (SplitTheRow)

**Idea nueva:** Subir de nivel es contar con una llave más larga. El usuario lo construye a mano.

**Prosa lead (v3):**
> "No hay truco nuevo. Es el de siempre, contar, con un cambio de nada: una llave más larga. Antes guardaba una fila por letra, la lista de lo que suele seguir a la t. Ahora hace falta una fila por cada pareja. Y esto no te lo voy a contar. Lo vas a hacer tú."

**Veredicto: PARCIALMENTE DESCUBRE — pero el mecanismo se explica ANTES del widget.**  
La prosa dice exactamente qué hace el trigrama ("una llave más larga", "una fila por cada pareja") ANTES de que el usuario lo haga. El promesa "Lo vas a hacer tú" llega tarde: ya le contaron la respuesta. Viola **R1** (el orden es SENTIR → NOMBRAR, no nombrar → sentir). Sería correcto si la prosa solo hiciera la pregunta ("¿cómo guardarías 'lo que sigue a TH' en vez de 'a H'?") y el widget respondiera.

**Widget (SplitTheRow):** El widget sí es de construcción incremental (stages 0→1→2). El h3 interno en cada stage también anuncia:
- Stage 0: `"una fila de la tabla: ·h"` — correcto, es el punto de partida.
- Stage 1: `"1 fila se abre en 27 — una por cada letra de antes"` — esto DESCRIBE el resultado antes de que el usuario lo vea cambiar. Debería ser una pregunta o solo la fila sin el diagnóstico.
- Stage 2: `"27 × 27 = 729 filas — así nace el trigrama"` — el nombre "trigrama" se da aquí, dentro del widget. Cumple R1 (el nombre llega después de la experiencia) pero barely.

**Prosa payoff (v3):**
> "Empezaste con una fila y acabaste con setecientas veintinueve, partiéndolas a mano. Nadie te dijo 'esto es un trigrama'. Lo levantaste tú."

Contradice lo que pasó: la prosa lead SÍ le dijo que haría una tabla de pares. Además, el h3 del widget dice "así nace el trigrama" antes que el payoff. Incoherencia interna.

**¿Construcción cuesta?** Sí, es un paso físico por etapas. Es el beat más honesto en términos de coste. Cumple **R3** con reservas.

---

### §2 · Construirla tú — Beat sharpen (RowSharpens)

**Idea nueva:** Una llave más larga AFILA la apuesta: tras «h» viene de todo; tras «th» casi siempre «e».

**Prosa lead (v3):**
> "Y fíjate en una de esas hijas, la que sigue a «th». La fila de antes apostaba con la boca pequeña; esta no duda."

**Veredicto: ANUNCIA.**  
"La fila de antes apostaba con la boca pequeña; esta no duda" — ya le dice el resultado. El lector llega al widget sabiendo que la fila de «th» es más afilada. El widget solo confirma lo que la prosa ya dijo. Viola **R2** y **R5**. Debería ser: "fíjate en esta fila — ¿qué ves?"

**¿Construcción cuesta?** No; el widget es exploración pasiva (pick a pair, see row). Correcto para un beat de afilado, pero el lead no deja nada por descubrir.

---

### §2 · Construirla tú — Beat grow (GrowingTable)

**Idea nueva:** Subir de nivel = la MISMA tabla, más grande.

**Prosa lead (v3):**
> "Lo bueno es que esto no se acaba aquí. Subir de nivel es repetir lo mismo: una llave todavía más larga."

**Veredicto: ANUNCIA (leve).**  
"Subir de nivel es repetir lo mismo" ya dice la idea antes del widget. Hubiera bastado "¿qué pasa si subimos un nivel más?" El widget (GrowingTable) lo hace visiblemente — la idea se podría dejar al widget.

**Widget (GrowingTable):** La mecánica (el panel que crece físicamente) SÍ muestra la escala. Cumple **R7** — la escala se ve, no solo se cuenta. El CountUpNumber crece. Es el mejor widget de escala del capítulo.

**Caption:** ninguno extra en el widget. Los h3 internos están bien.

**Prosa bridge (v3):**
> "Si cada nivel afila la apuesta, la pregunta cae sola. ¿Qué sale si la dejamos escribir de verdad?"

Correcto — es una pregunta genuina del lector (**R12**).

---

### §3 · Lo que has construido — Beat write (WriteFromMatrix)

**Idea nueva:** Escribir = buscar tu contexto en la tabla, leer un número, elegir, repetir. No piensa: lee.

**Prosa lead (v3):**
> "Antes de celebrar nada, abramos la tapa y miremos cómo escribe."

**Veredicto: CORRECTO (casi).**  
La frase es una invitación, no un anuncio de resultado. El widget (WriteFromMatrix) muestra el flujo paso a paso.

**Prosa afterWrite (v3):**
> "Ahí está, sin truco: busca tu contexto, lee un número, elige, y repite. No piensa. Lee."

Esto llega DESPUÉS del widget — correcto. Es el nombre-después-de-la-experiencia. Cumple **R1**.

---

### §3 · Lo que has construido — Beat battle / celebración (LookWhatYouBuilt)

**Idea nueva:** De sopa de letras a casi-frases, solo añadiendo memoria. El triunfo se celebra aquí.

**Prosa celebrateLead (v3):**
> "Y ahora sí, la parte buena."

**Veredicto: CORRECTO.**  
Lead mínimo, no anuncia el resultado. El widget muestra las cinco columnas y la diferencia se ve sin leer nada.

**Prosa triumph (v3):**
> "La de una letra escupe sopa de letras; la de cuatro casi hila frases. Entre una y otra no metiste ni una regla, ni una palabra de gramática. Solo un poco de pasado. Mira lo que has construido."

Llega DESPUÉS del widget — correcto. La voz "Mira lo que has construido" es genuina. Cumple **R4** (celebrar antes de criticar).

**Prosa temptation (v3):**
> "Y ahí salta la tentación. Si cuatro va mejor que una, ¿por qué parar? ¿Por qué no diez? ¿Por qué no cien?"

Excelente puente **R12**. Genera la pregunta del lector.

---

### §4 · Hasta dónde llega — Beat zoom (ExplosionZoom)

**Idea nueva:** Cada letra ×27 las filas posibles → la tabla es ASTRONÓMICA. Asombro de tamaño.

**Prosa zoomLead (v3):**
> "Subamos, a ver hasta dónde aguanta."

**Veredicto: CORRECTO.**  
Lead mínimo y con tensión ("¿hasta dónde aguanta?"). No anuncia el resultado. Cumple **R2** y **R12**.

**Widget (ExplosionZoom):** La mecánica (zoom out, la tabla explota visualmente, el % que ves se vuelve ridículo) cumple **R7** — la escala se muestra visualmente, no solo se cuenta. El tag "esto es lo que ves · 0,000…%" en la celda iluminada es un anuncio posterior a la visualización, no anterior, así que es correcto.

**Caption del widget:**
> `"cada letra más multiplica la tabla ×27 · casi toda queda fuera de pantalla"` (estado intermedio)
> `"y la tabla sigue creciendo · esto no toca fondo"` (estado final)

Estas captions llegan DESPUÉS de que el lector ha interactuado. Aceptables.

**Prosa afterZoom (v3):**
> "Aquí pasa algo curioso. Cada letra de memoria que sumas multiplica la tabla por veintisiete, así que te alejas, y te alejas, y el borde no llega. Es difícil hacerse a la idea de lo grande que se vuelve."

Esto repite lo que el widget ya mostró. Duplicación leve (viola puerta flujo de "cero duplicación prosa Y widgets"). La frase "es difícil hacerse a la idea" es condescendencia implícita (**P4**).

---

### §4 · Hasta dónde llega — Beat firehose (BookFirehose)

**Idea nueva:** Es tan inmensa que por muchos libros que viertas apenas se inmuta.

**Prosa firehoseLead (v3):**
> "Crece tan rápido que cuesta imaginar de dónde sacarías texto para tanta fila."

**Veredicto: ANUNCIA la conclusión antes de la interacción.**  
"cuesta imaginar de dónde sacarías texto para tanta fila" ya anticipa que el texto no alcanza. El lector llega al widget sabiendo que no se llenará. Viola **R5** y **R2**.

**Caption dentro del widget:**
- `"un océano de texto vertido · la tabla de 4 letras sigue casi vacía"` (al máximo)
- `"ATASCADA"` (waterline label)
- `"queda vacío"` (texto dentro del vaso)

El caption de estado final ("la tabla de 4 letras SIGUE CASI VACÍA") y el label "ATASCADA" son diagnósticos que el widget comunica VISUALMENTE a la vez que los inscribe en texto. En este caso el texto acompaña a la imagen y no la precede — se puede defender. Sin embargo el problema mayor es la prosa lead, que anticipa el resultado.

**Nota técnica favorable:** El widget tiene una mecánica de descubrimiento genuino (el lector abre el grifo, el contador de letras se dispara, y SOLO ENTONCES puede ver que el nivel del vaso apenas sube). La experiencia SÍ es de descubrimiento secuencial. Pero el lead lo arruina.

**Prosa afterFirehose (v3):**
> "Por muchos libros que eches, se los traga sin pestañear. Es así de inmensa."

Repite la conclusión del widget. Duplicación moderada.

**Prosa bridge (v3):**
> "Descomunal. Y entonces la pones a prueba con una palabra cualquiera que aún no habías escrito."

Buen puente — genera tensión sin anticipar el resultado. Correcto.

---

### §5 · El hueco — Beat mute (MuteSlot)

**Idea nueva:** Casi toda la tabla está vacía; un contexto nuevo cae en un hueco y la máquina se queda MUDA.

**Estructura del widget:** El lector llega al widget SIN lead de prosa (§5 en `NgramNarrative.tsx` abre directamente con el `<Figure>`, sin `<P>` ni `<Lead>` antes). Esto es correcto — es el único beat del capítulo que aplica el principio de "primero el widget, luego la prosa."

**Widget (MuteSlot):** La mecánica empieza con un auto-demo que muestra "contexto conocido → predicción fuerte" y luego automáticamente cambia a "nunca visto → muda." El contraste izquierda/derecha ya visible en el primer frame muestra la conclusión antes de que el lector haga nada.

**Labels dentro del widget:**
- `"contexto conocido"` (pill label izquierda)
- `"nunca visto"` (pill label derecha)
- `"muda"` (verdict label)

Estos labels ANUNCIAN la clasificación antes de que el usuario explore. El lector lee "nunca visto → muda" en el primer frame. Viola **R1** — el orden debería ser: el lector ve el 0%, se pregunta por qué, luego encuentra la etiqueta "nunca visto." El label "muda" tendría que emerger DESPUÉS del momento de choque.

**Grid explorable (madriguera):** El hecho de que el lector pueda explorar las casillas del grid y ver "nunca visto → muda" en el tooltip para las casillas vacías SÍ es un momento de descubrimiento genuino de la sparsity. Es el punto más cercano al "SparsityView" original del `ngram-vision.md`.

**Prosa after (v3):**
> "Le das algo que ha visto mil veces y contesta segurísima. Le cambias una letra, una sola, y se queda en blanco. Muda. Y al asomarte entiendes por qué: esa casilla vacía no es mala suerte, casi toda la tabla está así, y tarde o temprano caes en un hueco. Lo raro es que los dos contextos se parecen como dos gotas de agua. Para ti son casi el mismo. Para ella no: o tenía esa fila guardada, exacta, o no la tenía. Ese es el techo de verdad."

Esta prosa viene DESPUÉS del widget — correcto en orden. Sin embargo, es una prosa que resume y diagnostica completamente la experiencia. El lector que interactuó con el widget ya lo sabe; el que no interactuó recibe la conclusión regalada. El diagnóstico "casi toda la tabla está así" podría dejarse como descubrimiento de la madriguera, no como declaración de la prosa.

**¿Bookend de §1?** La "fila plana" de §5 conectando con la fila plana de §1 (AmnesiaReplay) es una buena intención, pero no se realiza explícitamente en la prosa. El bookend prometido en el spine no se materializa en copy visible.

---

### §6 · El puente — Beat progress (Progression)

**Idea nueva:** Aun con su techo, has llegado lejísimos: de cabezazos a palabras de verdad.

**Prosa progressLead (v3):**
> "Tiene un techo, sí. Pero antes de buscarle sustituto, mira de dónde vienes."

**Veredicto: CORRECTO.** No anuncia resultado; invita a ver.

**Prosa afterProgress (v3):**
> "De dar cabezazos a escribir palabras, sin enseñarle ni una regla. Y esto no se quedó en un juguete de clase: con esta misma idea funcionaron durante años los traductores, el reconocimiento de voz y el teclado de tu móvil. Llevada al límite, con datos de sobra, escribe sorprendentemente bien. Tanto que casi cuela."

La primera frase resume el widget (duplicación leve). La segunda frase anticipa la idea de BigModelLimit ("escribe sorprendentemente bien, tanto que casi cuela") ANTES de que el lector vea el BigModelLimit. Viola **R2** en el puente interno.

---

### §6 · El puente — Beat limit (BigModelLimit)

**Idea nueva:** Hasta un modelo grande trata «gato» y «perro» como islas sin relación.

**Prosa afterLimit (v3):**
> "Y eso es lo raro, porque tú sí sabes que van juntos. Ahí está la grieta: la máquina no entendió nunca nada, solo guardó trozos, y para ella cada contexto es una isla suelta; lo que aprende de uno no le vale para el otro. ¿Y si pudiéramos enseñarle que las cosas parecidas se traten parecido? Dejaría de necesitar haberlo visto todo."

**Veredicto:** La prosa viene después del widget — correcto en orden. La pregunta "¿Y si pudiéramos enseñarle…?" es un buen **R12**.

Sin embargo, la prosa previa (`afterProgress`) ya anticipó que el modelo escribe "sorprendentemente bien, tanto que casi cuela" — cuando el widget de BigModelLimit debería ser el que muestre eso. La prosa steal the thunder de su propio widget.

---

## C. Tabla: Anuncios a convertir en Descubrimientos

| Widget / Sección | Frase que anuncia | Cómo convertirla en descubrimiento |
|---|---|---|
| **Hero** | "Se nos va a ir de las manos." | Eliminar. Dejar solo la promesa de más memoria. El "de las manos" se descubre en §4. |
| **§1 lead (amnesiaLead)** | "Antes de arreglarlo, vale la pena verla fallar en cámara lenta." | Reemplazar con escena neutral: "Antes de cambiar nada, mírala trabajar." Sin decir "fallar". |
| **§1 caption widget (AmnesiaReplay)** | "no las distingue: la misma apuesta para las tres" | Eliminar del primer frame. Puede aparecer DESPUÉS de que el lector pulse "otra vez" al menos una vez, o al final del auto-ciclo. La cabecera "tres palabras distintas / una sola apuesta" ya da la estructura visual; el diagnóstico no necesita ser texto visible desde el inicio. |
| **§2 lead (s2.lead)** | "…una llave más larga. Antes guardaba una fila por letra… Ahora hace falta una fila por cada pareja." | Reemplazar con una pregunta: "¿Cómo guardarías 'lo que sigue a TH' en vez de solo 'a H'? Hay una manera de hacerlo con las mismas cuentas." Dejar que el widget muestre el mecanismo. |
| **§2 widget SplitTheRow h3 stage 1** | "1 fila se abre en 27 — una por cada letra de antes" | Convertir en pregunta: "¿cuántas hijas salieron?" con el tally respondiendo. O simplemente mostrar las 27 filas sin anunciar la conclusión en el h3. |
| **§2 sharpenLead** | "La fila de antes apostaba con la boca pequeña; esta no duda." | Reemplazar con: "Fíjate en esta fila — ¿la ves diferente?" Dejar que el contraste visual responda. |
| **§2 growLead** | "Subir de nivel es repetir lo mismo: una llave todavía más larga." | Reemplazar con pregunta: "¿Qué pasa con la tabla si subimos un nivel más?" El widget responde. |
| **§4 firehoseLead** | "Crece tan rápido que cuesta imaginar de dónde sacarías texto para tanta fila." | Reemplazar con el "¿y si" del lector: "Crece tanto que hay que preguntarse: ¿de dónde sacarías texto para llenarla?" (suave), o directamente: "Ponle texto. Mucho texto." |
| **§4 afterZoom** | "Es difícil hacerse a la idea de lo grande que se vuelve." | Eliminar. Condescendencia implícita (P4). El widget ya mostró el tamaño. Confiar en el lector. |
| **§4 afterFirehose** | "Por muchos libros que eches, se los traga sin pestañear. Es así de inmensa." | Reducir o eliminar. El widget ya mostró esto. Si se deja, condensar a una sola frase interrogativa: "¿Cuánto texto hace falta para llenarla?" (sin responder). |
| **§5 widget (MuteSlot) labels iniciales** | "contexto conocido" / "nunca visto" / "muda" visibles en el primer frame | Ocultar los labels de clasificación hasta que el lector haya interactuado. Mostrar solo las palabras y los porcentajes en el primer frame; los labels emergen después (tras primer flip o clic). |
| **§6 afterProgress** | "Llevada al límite, con datos de sobra, escribe sorprendentemente bien. Tanto que casi cuela." | Mover esta revelación a DESPUÉS de BigModelLimit, no antes. Dejar que el widget muestre primero. |

---

## D. Visión original vs. lo entregado

### Arco de 12 widgets (cumplimiento)

| Widget previsto (ngram-vision.md) | Widget entregado | Estado |
|---|---|---|
| AmnesiaReplay (descubierto) | AmnesiaReplay | PRESENTE, pero con caption que ANUNCIA desde el frame 0 |
| WidenWindow (PLAY/DESCUBRE) | WidenWindow | PRESENTE — el mejor beat del capítulo |
| SplitTheRow (BUILD, construir cuesta) | SplitTheRow | PRESENTE — mecánica correcta, pero lead anticipa |
| RowSharpens (PLAY, investigar) | RowSharpens | PRESENTE — lead anuncia el resultado |
| GrowingTable (DISCOVER) | GrowingTable | PRESENTE — funciona bien |
| WriteFromMatrix (lookup-loop) | WriteFromMatrix | PRESENTE |
| LookWhatYouBuilt (Battle/celebración) | LookWhatYouBuilt | PRESENTE — el único momento de triunfo correcto |
| ExplosionZoom (drill-down, asombro) | ExplosionZoom | PRESENTE — buena mecánica de escala |
| BookFirehose (showpiece) | BookFirehose | PRESENTE — lead anuncia la conclusión |
| MuteSlot (unseen+typo+sparsity) | MuteSlot | PRESENTE — labels de §5 anuncian desde el frame 0 |
| Progression | Progression | PRESENTE |
| BigModelLimit | BigModelLimit | PRESENTE |

**Todos los 12 widgets están implementados.** El arco de secciones se cumplió. Sin embargo:

### Lo que se perdió / diluyó

1. **El BOOKEND prometido** (la fila vuelve plana en §5 cerrando §1) no existe en la copy visible. La §5 no menciona la §1; el círculo no se cierra narrativamente.

2. **El momento "descubrir POR SÍ MISMO que la matriz está casi vacía"** — el SparsityView original tenía que ser el momento en que el USUARIO se asomara a los huecos y concluyera solo. En MuteSlot existe la madriguera (grid explorable), que SÍ permite ese descubrimiento. PERO: los labels "nunca visto" y "muda" están visibles desde el primer frame, ANTES de que el usuario explore. El lector no DESCUBRE la sparsity al asomarse: la lee antes. La visión de "fíjate, está casi toda vacía → el usuario pregunta por qué → concluye que está vacía" se perdió porque los labels le dicen la respuesta antes de la pregunta.

3. **Pistas ocultas "¿cómo lo harías tú?"** — el `ngram-vision.md` pedía explícitamente "piénsalo un poco" antes de revelar soluciones (en V2, V8, V10). Ningún beat del capítulo tiene este patrón. El lector nunca se plantea la solución antes de recibirla.

4. **La CAUSA de la mudez = la sparsity** (que el widget debería mostrar como causa consecuente a la mudez) está mencionada en la prosa `s5.after`, pero el widget ya muestra el grid oscuro en el primer frame, antes de que el lector haya sentido la mudez. La secuencia debería ser: (1) sientes la mudez, (2) te preguntas por qué, (3) te asomas al grid y ves la causa. En la implementación el grid está siempre visible.

5. **No apilar fallos** — cumplido. Solo un muro (§5). §4 es asombro, no derrota. Esto sí se logró.

### Respuesta directa a la pregunta de la matriz vacía

**¿Existe un momento donde el usuario DESCUBRE POR SÍ MISMO que la matriz está casi vacía, VIENDO la matriz?**

**RESPUESTA: PARCIALMENTE.** La madriguera del MuteSlot (el grid de 27 casillas) permite ese descubrimiento — el lector puede pasar el ratón por las casillas oscuras y ver "nunca visto" en el tooltip. Esto es genuino. Sin embargo:

1. El diagnóstico "casi toda la tabla está así" está escrito en la prosa `s5.after` que el lector puede leer antes de explorar el grid.
2. El label "nunca visto" en la pill derecha es visible desde el primer frame, antes de que el lector toque el grid.
3. El grid aparece SIEMPRE visible (no requiere interacción para revelarse), y los tooltips de "nunca visto → muda" están disponibles desde el inicio.

La visión pedía que la sparsity fuera la CAUSA que el lector deduce DESPUÉS de sentir la mudez. En el widget actual, la sparsity (grid oscuro) y la mudez (0%) son simultáneas en el primer frame. El lector no tiene el momento de preguntarse "¿por qué está muda?" porque ya ve el grid oscuro al mismo tiempo.

**La SparsityView del ngram-vision.md (V8)** pedía: "Con la tabla 4/5-grama de Shakespeare: 'fíjate, está casi toda vacía' → el usuario pregunta por qué → concluye que está vacía. Zoom: esto es un cuadradito de la tabla gigante." Este arco causal NO existe en MuteSlot. El grid está ahí desde el principio, sin el momento de pregunta-y-conclusión.

---

## E. Otras reglas

### Humor / voz

La voz v3 es notablemente mejor que v2. Las frases como "Mira lo que has construido" y la construcción "Lo vas a hacer tú" tienen energía humana. Sin embargo:

- "Es difícil hacerse a la idea de lo grande que se vuelve" (§4 afterZoom) es condescendencia implícita (**P4**).
- "Y esto no te lo voy a contar. Lo vas a hacer tú." suena artificialmente enfático después de que la prosa ya explicó el mecanismo.
- Hay pasajes de ritmo metralleta (frases muy cortas encadenadas), especialmente en §5: "Le das algo que ha visto mil veces y contesta segurísima. Le cambias una letra, una sola, y se queda en blanco. Muda." — aquí el ritmo corto funciona porque es dramático; es el uso correcto. Pasajes como "No hay truco nuevo. Es el de siempre, contar, con un cambio de nada: una llave más larga." son más mecánicos.

### Entendible por un niño / sin jerga

- "trigrama", "n-grama", "contexto", "sparsity" — los términos técnicos llegan razonablemente después de la experiencia o se evitan en la prosa principal. Bien.
- El bookend de historia (plegable opcional) cumple el requisito de ser opt-in.

### Escala mostrada (no contada)

- ExplosionZoom: CUMPLE — la escala se ve en la pantalla.
- GrowingTable: CUMPLE — la tabla crece físicamente.
- BookFirehose: CUMPLE PARCIALMENTE — el contador de letras se dispara (escala del texto), el vaso (escala de la tabla) se ve. Sin embargo el lead anticipa la conclusión.
- SplitTheRow stage 2: CUMPLE — la pila de 729 filas vs. la de 27 es visual.

### Un foco a la vez / motion que explica

- WriteFromMatrix: la lente que viaja fila a fila es motion que explica. Correcto.
- BookFirehose: la animación de caída de letras más el vaso que apenas sube — el contraste es motion que explica.
- AmnesiaReplay: la animación de "tapar el contexto" explica la amnesia. Correcto.

---

## F. Top fixes — Los 8 cambios de mayor impacto

1. **ELIMINAR el aviso "Se nos va a ir de las manos" del hero.** El suspenso del escalado es el motor de §4; destruirlo en la portada priva al lector del viaje. Basta la promesa de más memoria.

2. **REESCRIBIR el amnesiaLead: quitar "fallar".** De "vale la pena verla fallar en cámara lenta" a "Antes de cambiar nada, mírala trabajar." Sin anunciar el resultado. El widget muestra el fallo solo.

3. **OCULTAR el caption "no las distingue: la misma apuesta para las tres" del frame inicial de AmnesiaReplay.** Es el anuncio más grave: la conclusión principal del widget está escrita antes de cualquier interacción. Opciones: (a) convertirlo en texto que aparece solo DESPUÉS de que el lector pulse "otra vez" al menos una vez; (b) eliminarlo y confiar en que las tres filas idénticas a la derecha comunican la idea visualmente.

4. **REESCRIBIR el s2.lead: quitar la explicación del trigrama.** En vez de "una fila por cada pareja", hacer solo la pregunta: "¿Cómo guardarías 'lo que sigue a TH' en vez de solo 'a H'?" y dejar que el widget SplitTheRow responda. El payoff "Nadie te dijo 'esto es un trigrama'" sería entonces verdadero.

5. **REESCRIBIR sharpenLead: quitar el diagnóstico.** De "La fila de antes apostaba con la boca pequeña; esta no duda" a "Fíjate en esta fila. ¿La ves diferente?" Dejar que el lector compare.

6. **REESCRIBIR firehoseLead: quitar la anticipación.** De "cuesta imaginar de dónde sacarías texto para tanta fila" (que ya responde) a una pregunta pura: "Una tabla así de grande pide mucho texto. Ponle todo el que quieras."

7. **OCULTAR los labels "contexto conocido" / "nunca visto" / "muda" en el primer frame de MuteSlot.** La secuencia correcta es: (a) el lector ve los dos porcentajes (96% vs 0%) — choque visual; (b) se pregunta por qué son tan distintos; (c) interactúa (flip, exploración del grid); (d) entonces emergen los labels como confirmación. En el estado actual los labels diagnostican antes de la pregunta.

8. **MOVER "escribe sorprendentemente bien, tanto que casi cuela" a DESPUÉS de BigModelLimit.** La prosa `afterProgress` anticipa la revelación del propio widget que viene a continuación. Reordenar: el lector ve BigModelLimit primero, entonces la prosa lo nombra.

---

*Fin de la auditoría. Documento creado para archivo en `ngram-gates/`.*
