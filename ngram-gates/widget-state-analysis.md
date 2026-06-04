# n-gram — análisis honesto del estado de cada visualizador (handoff al creador de widgets)

Estado tras la sesión que tocó el límite de uso (21:10). **Varios arreglos estrictos en Opus se CORTARON a
medias** → esos widgets quedaron en su estado round-2 (o con edits parciales), NO en el estado pulido. Esta es
la foto real + dónde flojea cada uno + la dirección de arreglo. Sirve para que el agente creador NO repita.

> Veredicto general del usuario: estética genial, lógica/intención/funcionalidad bien, **pero faltan muchos
> retoques gráficos; se nota que están a medias.** El fix no tiene que ser tan ultra-estricto, pero sí pulido.
> Regla nueva: **vale texto encima/junto al widget si hace falta** (o que el cuerpo lo explique). Y los
> niveles de calidad son **reglas fijas de diseño web** (ver `method-failure-book.md` §6 "Reglas estéticas").

## Estado por widget

| Widget (slug) | Estado | Qué FALLA (concreto) | Dirección de arreglo |
|---|---|---|---|
| **WidenWindow** (ng-widen) | ⛔ fix estricto CORTADO → round-2 | La **frase a adivinar está partida en 3 trozos disjuntos**: texto visible («since it serves my pu») + caja de "memoria" («rpo») + ranura «s SIGUIENTE» flotando suelta a la derecha → se lee raro/inconexo. "SIGUIENTE" no se explica (¿qué es?). "ver la real / ocultar / otra palabra" sin explicar. Dos héroes (% + barras). Mucho espacio vacío abajo. | **Unir frase + ventana-de-memoria + ranura-siguiente en UNA línea continua legible** (la ventana resaltada DENTRO de la frase, no en una caja aparte; la ranura «?» pegada al final de la frase). **Explicar con texto** qué es "lo siguiente" y el botón de revelar. Un solo héroe (el %); barras secundarias con sus %. |
| **AmnesiaReplay** (ng-amnesia) | ⛔ fix estricto CORTADO → round-2 (embudo→«e») | El "solo recuerda la última letra" se infiere de un caption, no se VE. Dos héroes (nudo del embudo vs «e» gigante). Labels huérfanos "LO QUE CONSERVA / LA FILA". Espacio muerto a la derecha. | Hacer la **amnesia una ACCIÓN**: t/s/w caen/desaparecen → quedan 3 «h» idénticas → un «e». Un héroe. Quitar labels huérfanos. Compactar. |
| **SplitTheRow** (ng-split) | ⛔ fix estricto CORTADO → round-2 (count-up) | El **1→27 no se VE**, es un resultado estático + botón "×27". "1 / UNA FILA" abstracto al inicio (no dice nada). Falta conector «h»→. Baseline tiles parecen UI muerta. Captions crípticos. | **Mostrar el abanico 1→27→729** (la fila madre pariendo 27 hijas, visible en still). Matar "1"/"UNA FILA" como héroe. Conector «h»→. Quitar tiles + captions. |
| **RowSharpens** (ng-sharpen) | ⛔ fix estricto CORTADO → round-2 | Dos gráficas parecidas que compiten; el salto ancho→afilado NO es dramático (36% vs 49% muy cerca). Selector «t s w…» parece texto, no pulsable. 60% lienzo vacío. | UNA fila que **colapsa de ancha a un pico** en el mismo eje (elegir pares con salto grande, p.ej. qu→u ~100%). Selector con chips claramente pulsables. Matar vacío. |
| **GrowingTable** (ng-grow) | ⛔ fix4 CORTADO → round-3 (contraste) | **Al crecer se vuelve más TENUE/pequeña** (más filas finas en ventana fija) → "looks small" trap; el crecimiento lo dice el número, no se siente. Riesgo de DUPLICAR §4. | **Invertir:** más memoria = más masa visible/brillante en pantalla (footprint crece, filas legibles a altura fija, no encoger). Es el beat POSITIVO "subiste de nivel y es más grande" (NO el awe astronómico de §4). |
| **WriteFromMatrix** (ng-write) | ⛔ **ROTO funcionalmente** (fix2 hecho) | **"Paso" NO hace nada** (2 capturas tras 1 y 5 pasos = idénticas pixel a pixel) → el bucle no avanza. Control "ESCRIBE" + ticks no parece botón. 4 fases no legibles. Héroe ambiguo (3 gigante vs fila vs tabla). Output parece galimatías enmascarado. | **ARREGLAR que "Paso" mute el estado** (más letras, fila/número cambian) y verificar con captura multi-estado. Botón "Paso" claro. Etiquetar 4 fases + resaltar la activa. Fila+número héroe único, atar fila→número→letra. Output plausible (k=4 backoff). |
| **LookWhatYouBuilt** (ng-built) | ⛔ fix estricto CORTADO → round-2 (monta con resultado) | Dos controles compiten (chips de semilla + slider memoria). El salto galimatías→palabras NO es visual (4 columnas grises idénticas; se lee, no se ve). Sin marco "tú". "OTRA VEZ" parece 4ª semilla. Ancla 1→4 pequeña. | UN control. **Degradar col-1 (gris/jitter) y nitidez+calor en col-4** → messy→clean pre-literal. Marco "tú" ("mira lo que escribiste"). "OTRA VEZ" como botón re-roll separado. Ancla 1→4 grande. |
| **ExplosionZoom** (ng-zoom) | ⛔ **PASS FALSO — rehacer** (el "PASS" fue por priming del gate, ver `method-failure-book.md` §8) | DOS números dorados de 8 cifras compitiendo sin héroe (`14.348.907` header + `×387.420.489` botón); columna de fichas n/o/t/u TAPANDO el texto ("5 LETRAS DE MEMORIA"→"ETRAS"); "27" flotando sobre el borde; rejilla 2×2 indescifrable; todo muddy/bajo contraste; ~20% lienzo muerto. (NO era "chrome del bench" — eso fue una alucinación del gate que YO propagué aquí; las fichas SON el widget.) | UN solo número héroe que cambie la imagen (escala en still). Quitar/integrar la columna de fichas para que NO tape texto. Atar caption "×27" a las celdas. Rejilla que se lea como "muestra minúscula de algo inmenso". Contraste flagship. |
| **BookFirehose** (ng-firehose) | ⛔ fix estricto CORTADO → round-2 (4 barras héroe) | Barras "1/2/3/4" ambiguas (¿rango? pasos?) — deben decir "N LETRAS". La barra-4 al 9% parece "un poco menos", no **atascada/muriéndose**. Texto de fondo se cuela bajo las etiquetas (clutter). Contador compite. Muddy/bajo contraste. | Etiquetar "N LETRAS". Barra-4 visiblemente ATASCADA ("ni con un océano se llena"). Quitar bleed del fondo sobre labels. Un héroe (barras), contador a ticker. Subir contraste. |
| **MuteSlot** (ng-mute) | ⛔ fix estricto CORTADO → round-2 (auto-demo) | La barra "muda" parece un slider a ~50% (no CERO). Caja de predicción intermedia compite (3 focos). "muda" bajo contraste. «␣» críptico. | **Ambas barras = mismo medidor**; la muda inequívocamente CERO (vacía + "0%"/línea plana). Quitar caja intermedia. Contraste en "muda", atarla a la rejilla vacía. Etiquetar «␣» = "espacio". |
| **Progression** (ng-progress) | ⛔ fix estricto CORTADO → round-2 (monta con resultado) | 3 tarjetas grises idénticas; la subida galimatías→palabras NO se ve (se lee). Sin frase cálida de cierre. Footers desalineados, alturas dispares. Selector arriba sin explicar. 60% inferior vacío. | Subida como FORMA (degradar tarjeta-1, nitidez tarjeta-3, rampa izq→der). Frase cálida ("mira cuánto ha avanzado"). Alinear footers/alturas. Explicar/quitar selector. Usar el vacío. |
| **BigModelLimit** (ng-limit) | ✅ fix estricto HECHO (re-gate pendiente) | Aislado gato/perro, flujo "pero", sin #IDs, párrafo demoteado. Pendiente: re-gate estricto+usabilidad. | Re-gatear; probablemente cerca. |

## Resumen
- **NINGUNO confirmado PASS.** El supuesto "PASS" de ExplosionZoom fue FALSO (priming del gate, §8) → entra
  en la lista de rehacer. BigModelLimit: re-gate pendiente con el gate v2 (sin priming).
- **ROTO funcional (prioridad):** WriteFromMatrix ("Paso" no avanza).
- **Rehacer arreglo estricto (cortados por el límite), en construcción/a medias:** WidenWindow, AmnesiaReplay,
  SplitTheRow, RowSharpens, GrowingTable, LookWhatYouBuilt, BookFirehose, MuteSlot, Progression (9).
- **Verificar primero al reanudar:** `npx tsc --noEmit` (un agente cortado a media-edición podría haber dejado
  algo roto) + `eslint`. Luego seguir el bucle (Sonnet para reviews, Opus solo para construir widgets).

## Patrón transversal a meter en TODOS (reglas fijas) — ver `method-failure-book.md` §6
Un solo héroe · la idea se VE no se rotula (pero vale texto si hace falta / el cuerpo lo explica) · nada de
espacio muerto · selectores que parezcan pulsables · contraste flagship · nada flotando/inconexo (unir piezas
relacionadas) · etiquetar lo no-evidente · **el estado interactivo debe CAMBIAR de verdad (probarlo, multi-estado)**.
