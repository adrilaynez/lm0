# LM0 Landing — Spec definitivo · "El camino por el mundo"

**Fecha:** 2026-06-12 · **Estado:** listo para construir DESDE CERO en una sesión nueva.
**Léelo entero antes de escribir una línea de código.** Una sesión anterior construyó una v1
(túnel 3D oscuro en primera persona) que el usuario rechazó ("cutre") y se borró por completo.
Sus lecciones — técnicas y de dirección — están en §9 y NO son opcionales: son el mapa de minas.

## 0. EL LISTÓN (léelo dos veces)

Esto no es "una landing bonita". Es **una página candidata a Awwwards Site of the Day**, y cada
decisión se toma con ese estándar. Reglas de mentalidad, no negociables:

1. **Las referencias de `lm0-refs/` son EL listón, no una aspiración.** Antes de dar por buena una
   escena, ponla LADO A LADO con su referencia (captura tuya vs imagen ref). Si la tuya pierde
   claramente, no está terminada — itera o escala de herramienta.
2. **Prohibido el "default Three.js look".** Ni un solo objeto con material plano sin entorno, ni
   una luz sin intención, ni una sombra dura accidental. Desde el PRIMER cubo placeholder: env map
   de estudio, sombras blandas, geometría redondeada. Lo cutre en el día 1 se queda para siempre.
3. **Test del screenshot:** si una escena no haría que un diseñador la capturase para guardarla,
   no está lista. Aplícalo a cada parada, al descenso, al zoom-out final.
4. **El movimiento es la mitad de la nota.** Un frame precioso con scroll torpe = suspenso. Easings
   con intención, deceleraciones físicas, nada que salte o tiemble. (La v1 murió por esto.)
5. **Usa TODA la artillería que haga falta** — está explícitamente autorizado por el usuario:
   GSAP completo (todos los plugins son gratis), Lenis, Three.js con post-procesado, **Blender**
   (instálalo si no está: `winget install BlenderFoundation.Blender`) para modelar, hacer bake de
   luz/AO y renderizar offline con **Cycles** (el equivalente libre de Octane — las propias
   referencias tienen ese look de render path-traced). Assets pre-renderizados, lightmaps, sprites
   de alta calidad, GLB+Draco, KTX2 — todo vale si el resultado lo justifica. La única regla: la
   interactividad (máquinas que despiertan y se tocan, scroll scrubbed) no se sacrifica.
6. **No te autoevalúes con benevolencia.** Gates con el usuario (§8) + fresh-eyes ciego. Tu
   "se ve bien" no cuenta; cuenta el suyo.

**Stack base:** GSAP + Lenis + Three.js — y todo lo anterior cuando haga falta. Si una escena no
se ve "de locos", no está terminada.

---

## 1. La idea en una frase

El visitante completa una frase (y descubre que acaba de hacer lo que hace ChatGPT); después
**navega con el scroll por un mundo en miniatura visto desde arriba** — un suelo claro y blando
por el que serpentea un camino dibujado — **parando en tres estaciones, una por era de la historia
de los modelos de lenguaje** (contar 1948 · aprender 1986 · atención 2017); en cada parada hay una
**vitrina 3D espectacular** con la máquina de esa era, que despierta, parpadea y se puede tocar,
y un **pop-up a la derecha** con un visualizador y la explicación; al final, el viaje desemboca en
el presente (cursor/chat) y en el índice de capítulos.

## 2. Referencias visuales — EN EL REPO, en `lm0-refs/` (ÁBRELAS con la herramienta Read antes de codear)

| Archivo | Qué enseña |
|---|---|
| `lm0-refs/01-boceto-camino-estaciones.webp` | El boceto a boli del usuario: camino serpenteante con paradas (Zero → Bigram → Ngram…), "bola mueve al scrollear con luz", "al llegar la bola a bigram se abre esto y se hace zoom" (un panel lateral). |
| `lm0-refs/02-recorrido-completo-mapa-final.webp` | **El plano del ZOOM-OUT FINAL**: el mapa "You are here" de HowGPT — losas tipo keycap numeradas con icono grabado, unidas por tubo cromado sobre suelo crema, etiquetas finas con líneas. OJO al nombre del archivo: el recorrido de LM0 tiene **3 eras, no las 5-7 losas** de la imagen. |
| `lm0-refs/03-como-se-siente-recorrer-el-mapa-vectr.webp` | Cómo debe SENTIRSE recorrer el mapa (vectrfl.com): cámara cenital sobre mundo pálido, la línea dibujada EN el suelo cruzándolo, lista fija de pasos que se expande al llegar. |
| `lm0-refs/04-vitrina-claro.webp` | EL look de las máquinas (claro): caja de cristal sobre peana gris-cálida; keycaps con tokens ("the cat sat on the mat") conectados por hilos de fibra violeta que convergen en un emisor; placa grabada. Metal cepillado + cristal + fibra luminosa. |
| `lm0-refs/05-vitrina-en-el-mapa-aprox.webp` | Cómo se ve más o menos la vitrina/estación EN el mapa (etail.me — "no así literal, para que veas a qué me refiero"): suelo de baldosas crema con sol y sombras blandas, edificio/objeto 3D redondeado cerámico adorable-premium sobre el suelo, texto grande a la izquierda. EL look del mundo. |
| `lm0-refs/06-vitrina-oscuro.webp` | La misma vitrina de noche = EL modo oscuro: cristal oscuro, fibras violeta brillando, serif clara a la izquierda. |
| `lm0-refs/07-vectr-recorrido.webm` | Vídeo del recorrido de vectrfl.com (6,3 s): la línea de luz cruzando el mundo isométrico, la cámara siguiéndola, los pasos expandiéndose. Si no puedes reproducirlo, la captura 03 resume el frame clave. |

## 3. La experiencia, beat a beat

0. **Loader** (≤2 s, una vez por sesión): breve, con intención (p. ej. mono "leyendo el corpus…"
   + recuento real de palabras). Skippeable.
1. **El test (hero).** Frase incompleta en serif grande + caret; 3-4 opciones; al elegir se revelan
   **barras de probabilidad REALES** (conteos de un mini-corpus empaquetado — ver §7.4): "no hay una
   respuesta correcta, hay probabilidades — acabas de hacer lo que hace ChatGPT". El concepto se
   queda de la v1; la EJECUCIÓN debe subir mucho (composición, materia, micro-motion). FRASE NUEVA
   pendiente de decidir con el usuario: natural en español; candidata fuerte: un refrán incompleto
   («en boca cerrada no entran ___» — predicción instantánea para un hispanohablante; EN puede usar
   "the cat sat on the ___"). El test NUNCA bloquea el scroll (autopick con guiño si pasas de largo).
2. **Descenso al mundo.** Transición: la cámara baja/encuadra el mundo-suelo. Aparece la lista fija
   de eras (01 CONTAR · 1948 / 02 APRENDER · 1986 / 03 ATENCIÓN · 2017) que se expande al llegar.
3. **El viaje.** Cámara cenital/picada (~50-60°) con MUCHO zoom siguiendo el camino dibujado en el
   suelo. El scroll es el único motor (scrub total: parar congela, subir rebobina). Las eras tiñen
   el mundo al cruzar: color del camino/acentos, textura del suelo, props alrededor. Lo lejano se
   percibe como puntitos/marcas. Marcas menores en el suelo con los capítulos de cada era
   (bigram, n-gram…) al pasar.
4. **Tres paradas (una por era).** Al llegar la luz a la estación-losa, el scroll se detiene en
   meseta: la **vitrina** queda a un lado (media pantalla aprox.), **despierta** (la luz de su
   interior se enciende, el mecanismo se anima, parpadea) y **reacciona al ratón** (hover/click:
   pulsos, brillo, algún secreto). A la derecha **se abre un pop-up** (DOM, no canvas): visualizador
   bien hecho + 2-4 frases que explican qué hace esa máquina + fichas-enlace a los capítulos de la
   era (Era I → /lab/bigram, /lab/ngram · Era II → /lab/neural-networks, /lab/mlp ·
   Era III → /lab/transformer).
   - **Vitrina Era I (contar):** mecanismo tipo tabla/contador físico — celdas que se encienden con
     frecuencias REALES de un bigram entrenado en cliente; balbucea texto generado de verdad.
   - **Vitrina Era II (aprender):** red de nodos e hilos; DOS pasadas visibles: onda 1 → falla,
     los pesos se reajustan (hilos que engordan/se apagan), onda 2 → casi. "Mejoró delante de mí".
   - **Vitrina Era III (atención):** la referencia literal — tokens en keycaps, hilos de fibra
     convergiendo, arcos de atención. La frase del visitante (la del test) como tokens.
5. **El presente.** El camino desemboca en el final: un cursor parpadeando / campo de chat que
   teclea la frase del visitante y una línea de cierre temática propia. (Re-ejecutar la idea de la
   v1 en el nuevo mundo; copy a re-decidir.)
6. **EL ZOOM-OUT FINAL (petición explícita del usuario).** Justo después de que la máquina termine
   de escribir la frase, al seguir scrolleando **la cámara se eleva y retrocede en UN solo
   movimiento de grúa continuo** (scrubbed, reversible) hasta que se ve **el recorrido completo
   desde arriba, compuesto como `lm0-refs/02-recorrido-completo-mapa-final.webp`**: las 3
   estaciones-era con sus vitrinas, el camino que las une, las zonas de color de cada era — todo lo
   que acabas de vivir, ahora como mapa. Mientras la cámara sube, van apareciendo escalonadas las
   etiquetas DOM (números, nombres de era, líneas finas de conexión estilo la referencia, un
   "estás aquí" en el final del camino). **Este mapa ES el índice**: cada estación clicable → sus
   capítulos (o fichas-enlace al lado), + CTA "Empieza por la Era I".
7. **La carta del autor** (la escribió el usuario: "esto lo hice para mis padres…") va AL FINAL,
   no en medio. Colofón con toggles de tema/idioma.

## 3b. TRANSICIONES — donde se gana o se pierde el "se siente bien"

La v1 murió por el movimiento. Cada junta entre escenas está diseñada; ninguna es un corte.
Reglas generales: **una sola cámara continua en todo el viaje** (sin cortes de plano), todo
scroll-scrubbed y reversible, autoplay solo en micro-momentos (el despertar de una vitrina);
el DOM entra/sale ligado a umbrales de progreso con easings con muelle suave.

1. **Loader → Test:** fundido elegante; opcional que los glifos del loader se asienten formando
   la frase del test (continuidad de materia). Corto, sin ceremonia.
2. **Test → Mundo (EL descenso — la junta más importante).** Al elegir la palabra y revelarse las
   barras, el canvas ya está vivo DETRÁS del DOM del test: la cámara empieza ALTÍSIMA, mirando el
   mundo desde muy arriba (las estaciones son puntitos). Al scrollear, el texto del test se va hacia
   arriba mientras la cámara DESCIENDE en picado suave hacia el inicio del camino, hasta la altitud
   de viaje (la losa "inicio" llenando parte del cuadro). Sensación buscada: "entro en el mundo en
   miniatura". La palabra elegida puede viajar abajo como la chispa que se posa en la losa de salida.
3. **Tramo → Estación (la llegada):** rampa de deceleración (meseta en el mapa progreso→posición,
   con smoothstep en los bordes) + zoom-in suave. SOLO cuando la cámara asienta (~150 ms después),
   la vitrina DESPIERTA (su luz interior se enciende, anillo de pulso en la losa) y DESPUÉS entra el
   pop-up desde la derecha con muelle. Orden estricto: cámara → máquina → panel. Nunca a la vez.
4. **Estación → Tramo (la salida):** orden inverso: el pop-up se recoge primero (al reanudar
   scroll), la vitrina QUEDA encendida detrás (el mundo recuerda tu paso), la cámara acelera con un
   ligero zoom-out a altitud de viaje.
5. **Era → Era (cambio de zona):** nunca un corte: a lo largo del ~15% del tramo, las baldosas del
   suelo disuelven al nuevo tono (patrón de tablero/onda), el color del camino interpola, los props
   antiguos quedan atrás y los nuevos aparecen delante. El cambio se CRUZA, no se teletransporta.
6. **Estación III → Presente (chat):** la cámara baja a su punto MÁS cercano al suelo de toda la
   página (intimidad para el momento del tecleo); el campo de chat se materializa en DOM.
7. **Chat → Zoom-out final:** ver beat 6 de §3 — un único movimiento de grúa ascendente, largo y
   satisfactorio, con parallax de props y etiquetas apareciendo escalonadas al superar cierta altitud.
8. **Microdetalle transversal:** la luz/chispa que recorre el camino deja el tramo recorrido
   sutilmente distinto (camino "encendido" detrás de ti) — el mapa final muestra el rastro completo.

## 4. Dirección de arte

- **Modo claro = base de diseño.** Día suave: suelo crema/blanco de baldosas, sol cálido, sombras
  blandas, materiales cerámica/porcelana redondeada + metal cepillado + cristal + fibra luminosa.
  Adorable-premium (etail), no corporativo.
- **Modo oscuro = la misma escena de noche** (ref. vitrina negra): mundo apagado, cristales oscuros,
  las fibras y LEDs brillando con bloom. Se diseña después de clavar el claro.
- **Acentos por era** (ya canónicos en el sitio): verde (contar), ámbar (aprender), azul/violeta
  (atención). El camino y los props de cada zona los llevan.
- **Tipografía:** serif editorial para frases grandes (Playfair ya cargada: `--font-playfair`),
  mono para placas/labels (`--font-jetbrains-mono`), sans para UI (`--font-geist-sans`).
- **Texto SIEMPRE en DOM** (nítido, accesible, SEO); el canvas es escenario. Los pop-ups son DOM
  anclado a la proyección 3D de la estación.

## 5. Alcance (decidido con el usuario)

- **3 estaciones-vitrina** (una por era). NO una por capítulo: 6 vitrinas "de locos" diluyen el
  listón y alargan el scroll. Los capítulos viven en los pop-ups y como marcas en el suelo.
- Bilingüe ES/EN · dual theme · `prefers-reduced-motion` → fallback estático (misma página sin
  canvas, figuras fijas) · móvil con versión aligerada · sin sonido (v1).
- Marca: **LM0** (loader/wordmark/SEO "LM0 — de cero a ChatGPT").

## 6. Pipeline técnico — cómo llegar a "de locos"

**Dos niveles; se escala solo si hace falta, con GATE del usuario:**

- **Nivel A — procedural en Three.js (primero).** El look etail/HowGPT es geometría redondeada +
  luz suave: muy alcanzable sin assets externos. Recetas concretas:
  - `RoundedBoxGeometry` (three/examples) para losas, keycaps, peanas; `MeshPhysicalMaterial` con
    `clearcoat` suave para cerámica.
  - **Entorno:** `RoomEnvironment` (three/examples) + `PMREMGenerator` → reflejos de estudio sin
    descargar HDRIs. Es la diferencia entre "plástico de tutorial" y "producto".
  - **Cristal de la vitrina:** `MeshPhysicalMaterial` con `transmission: 1, thickness, roughness
    ~0.05-0.15, ior ~1.5` — cristal físico real-time; con buen env map se ve premium.
  - **Hilos de fibra:** `TubeGeometry` fina emisiva + pulsos (sprites viajando por la curva) +
    **bloom selectivo** (UnrealBloomPass, threshold alto en claro / strength en oscuro).
  - **Sombras:** direccional con `PCFSoftShadowMap` + radio alto, o blob-shadows (planos con textura
    radial) bajo cada objeto — el look de sombra blanda de etail.
  - **Suelo:** plano con grid de baldosas sutil (textura procedural en canvas o shader), manchas de
    sol (gradientes), y el camino como cinta/curva pintada encima (mesh plano con UV a lo largo).
- **Nivel B — Blender headless (si A no convence en el gate).** Las vitrinas son hard-surface puro
  (cajas biseladas, peanas, pines, curvas): modelado scriptable en Python de Blender, bake de
  AO/lightmaps con Cycles, export GLB+Draco, KTX2. Claude puede instalar Blender
  (`winget install BlenderFoundation.Blender`) e iterarlo headless con renders de validación
  (render → mirar → ajustar → render). Decisión tras VER la vitrina v1 de nivel A.
- **Nivel C — híbrido pre-renderizado (si ni B alcanza en tiempo real).** Renders Cycles de máxima
  calidad como elementos compuestos: backplates/turntables de la vitrina pre-renderizados (imagen o
  secuencia scrubbed) con capas vivas encima (hilos de fibra, LEDs, pulsos en tiempo real con bloom)
  para conservar el despertar y la interactividad. Es el seguro de vida del listón: la calidad de
  render offline SIEMPRE es alcanzable por esta vía. Elegir el nivel POR PIEZA (el mundo puede ser
  nivel A y las vitrinas nivel C sin que se note la costura, si comparten paleta y luz).

**Spine de scroll (ya validado en la v1, reproducir igual):** Lenis + GSAP ScrollTrigger con el
patrón oficial (`lenis.on('scroll', ScrollTrigger.update)`; `gsap.ticker.add(t => lenis.raf(t*1000))`;
`lagSmoothing(0)`). Contenedor alto (~500-600vh) + stage `position: sticky` (SIN pin de GSAP) +
ScrollTrigger solo-progreso (`start "top top"`, `end "bottom bottom"`, `scrub: true`). Las paradas
son MESETAS en el mapa progreso→posición (la cámara decelera), no pins anidados. Tramos de viaje
proporcionales al tiempo histórico (38 : 31 : 9 años) — el último, cortísimo, se siente como la
aceleración real.

**Cámara:** picada ~50-60° siguiendo la curva del camino con offset y zoom variable (cerca en
paradas — la estación llena media pantalla —, más alto en tramos). Vida sutil (sway mínimo).

**Notas de riesgo (mitigaciones obligatorias):**
- **Cristal caro:** `transmission` renderiza la escena 2×. Solo la vitrina ACTIVA lleva cristal
  físico; las lejanas usan material barato (opacidad/roughness fake) y se permutan por distancia.
- **Pop-ups vs scroll:** los paneles son COMPACTOS, sin scroll interno; la rueda siempre mueve el
  viaje. La meseta de cada parada es ancha para leer con calma.
- **Carga inicial:** el mundo 3D se carga en silencio MIENTRAS el visitante juega con el test
  (5-10 s gratis); el descenso no arranca hasta que está listo (con fallback de espera elegante).
- **Móvil:** el mundo cenital se re-encuadra para vertical (camino más vertical, cámara más alta,
  pop-ups a pantalla inferior) — se diseña, no se encoge.

## 7. Qué reusar del repo (existe hoy, en `redesign/ngram-amber-v1`)

1. **`src/features/lab/data/trainableModel.ts`** — motor n-gram char-level REAL, puro, client-side:
   `TrainedModel(k)`, `foldText` (pliega acentos, alfabeto 27), `feedRange`, `sampleNext` (con
   backoff y temperatura), `makeRng`, `seedFrom`. Entrena en milisegundos.
2. **Receta de los modelos honestos de la landing** (re-implementar, ~150 líneas):
   - Mini-corpus ES/EN empaquetado (~3 KB) con la frase del test repetida en frecuencias controladas
     (p. ej. 31/10/6/3 → barras ~62/20/12/6%) + frases de sabor para que el balbuceo suene a idioma.
   - `getWordProbabilities(locale)`: cuenta apariciones literales de `stem + palabra` en el corpus
     plegado → porcentajes REALES para las barras del test.
   - `getBabbler(locale)`: TrainedModel k=1 sobre el corpus, memoizado; cada llamada genera ~26
     chars con seed incremental → el balbuceo vivo de la vitrina Era I.
   - `corrupt(sentence, level)`: degradaciones deterministas de la frase del visitante (intentos de
     la Era II).
3. **i18n:** claves en `src/i18n/locales/lab/{en,es}.ts` (namespace nuevo, p. ej.
   `lab.landing.lm0.*`; UTF-8; paridad en/es forzada por tipos). Locale-Link de `@/i18n/navigation`.
4. **Estructura:** la landing se monta en `src/app/[locale]/lab/lab-landing-client.tsx` (hoy renderiza
   la landing "chill" antigua — mantenerla intacta hasta validar, como rollback). Metadata en
   `src/app/[locale]/lab/page.tsx`. Fuentes ya cargadas en el layout (Playfair, JetBrains Mono, Geist).
5. **Deps a instalar:** `gsap`, `lenis`, `three`, `@types/three` (npm). No existen en package.json.

## 8. Orden de build con GATES (validación del usuario, no autovalidación)

0. **Antes de codear:** abrir TODAS las imágenes de `lm0-refs/` con Read y estudiarlas; leer §9.
1. **La sensación primero:** mundo-suelo + camino pintado + cámara cenital + scroll scrubbed
   (incluido el descenso del test al mundo y una llegada de prueba), con placeholders.
   → **GATE 1: el usuario scrollea y aprueba el MOVERSE** (su crítica nº1 de la v1).
2. **UNA estación completa:** losa + vitrina Era III v1 (nivel A: cristal físico + keycaps + fibras
   + bloom) + despertar + interactividad hover + pop-up con visualizador. → **GATE 2: captura tuya
   LADO A LADO con `lm0-refs/04-vitrina-claro.webp` delante del usuario. ¿"De locos"?** Si pierde
   claramente: nivel B (Blender), y si tampoco: nivel C (híbrido pre-render). No se avanza a las
   otras dos vitrinas hasta que esta gane.
3. Replicar a 3 eras + zonas de color + marcas de capítulos.
4. Hero test re-ejecutado + frase nueva (decidir con el usuario).
5. Final (cursor/chat) + **el zoom-out de grúa al recorrido completo** (§3 beat 6 — compuesto como
   la ref 02) + carta.
6. Modo oscuro (noche) + fallback estático + móvil + a11y + perf.
7. Gates de calidad del repo: fresh-eyes ciego con capturas (method-failure-book.md), lint, tsc,
   vitest, PROJECT-LOG ("started"/"finished").

## 9. LECCIONES DE LA V1 BORRADA — el mapa de minas

**De dirección (por qué se rechazó):**
- El usuario quería SIEMPRE el mundo cenital de su boceto; el túnel first-person oscuro fue
  interpretación del agente. **Ante ambigüedad espacial: preguntar con referencias, no asumir.**
- Primitivas 3D desnudas (cajas, esferas, tubos finos) sin entorno ni materiales leen a tutorial
  AUNQUE les pongas bloom. El salto de calidad está en: env map de estudio + materiales físicos + sombras
  blandas + geometría redondeada — desde el primer cubo.
- Validar con capturas estáticas engaña: el usuario juzga EL MOVIMIENTO. Validar la sensación de
  scroll con el usuario ANTES de construir encima (Gate 1).
- Texto pequeño abajo-izquierda sobre canvas = ilegible. Los textos de escena, grandes y con sitio.
- El mundo oscuro era además contrario a las referencias del usuario (todas claras, de día).

**Técnicas (errores ya pagados — no repetir):**
1. **Nunca des al engine Three su propio rAF**: usar `gsap.ticker` (el mismo reloj que Lenis).
   Con ventana tapada los rAF se congelan y los relojes divergen.
2. **`scene.background = new THREE.Color(bg)`**, NO `renderer.setClearColor`, cuando hay
   EffectComposer + OutputPass (el clear color se doble-convierte y el fondo oscuro sale gris lavado).
3. **`dispose()` defensivo + `renderer.forceContextLoss()`**: el HMR de Next crea/destruye engines y
   sin esto se agotan los contextos WebGL del navegador (errores "Shader Error 1282", contexto null).
4. **`ScrollTrigger.refresh()` tras `document.fonts.ready`** (las webfonts mueven el layout y los
   triggers quedan descalibrados).
5. **CSS sticky + ScrollTrigger solo-progreso** (sin pin) = cero jank de pin.
6. Texturas de texto en canvas: esperar `document.fonts.ready`; los nombres de familia de next/font
   no son los públicos — usar fallbacks reales ("Playfair Display", Georgia).
7. setState dentro del updater de otro setState = error "Cannot update a component while rendering".
8. **Verificación en navegador con la ventana visible**: si la ventana de Chrome queda tapada,
   Windows congela rAF y las capturas CDP cuelgan (30 s timeout). Protocolo: traer la ventana al
   frente (PowerShell SetForegroundWindow) y/o forzar frames deterministas para capturar.
9. Git: **rama nueva desde `redesign/ngram-amber-v1`** (el worktree tiene trabajo ngram SIN
   commitear — jamás `git add -A`; solo rutas explícitas de la landing). Al mergear: rebase sobre
   main o mergear ngram primero.

## 10. Decisiones pendientes (preguntar al usuario en el momento adecuado)

1. **La frase del test** (candidatas: refrán incompleto ES + "the cat sat on the ___" EN).
2. Copy del final (línea temática de cierre del chat).
3. Sonido ambiente sutil (off por defecto) — opcional, decidir tarde.
