# n-gram v4 — PLAN de la noche (narrativa + visualizadores) · y cómo no repetir el fallo

> Escrito ANTES de tocar nada (el usuario lo pidió explícito: «haz un md antes de hacer nada con el plan,
> con cómo vas a solucionar esto y cómo evitar que vuelva a ocurrir»). Captura **TODO** el feedback del
> mensaje largo (audio) + el feedback pegado del chat anterior. Fuentes de verdad que NO se reemplazan:
> `ngram-vision.md` (ideas semilla + arquitectura «La fila»), `ngramSpine.ts` (estructura de beats),
> `method-failure-book.md` (gates), `narrative-guidelines.md` (voz). Acento AMBER bajo `[data-ngram-theme]`.
> Rama `redesign/ngram-amber-v1`. **Sin commits hasta que el usuario lo pida.**

---

## 0 · COORDINACIÓN con el otro chat (CRÍTICO — no romper nada)

Hay **otro chat trabajando en paralelo en el mismo working tree**. Ahora mismo migra **bigram** a la
estructura nueva (MDX + i18n por namespaces) y **va a tocar ngram también** (le hará la misma migración de
plomería MDX). Yo hago el **contenido** de ngram. Para no colisionar:

**NO TOCAR (suyo / compartido):**
- `next.config.mjs`, `package.json`, `package-lock.json` (deps MDX ya configuradas).
- `src/features/lab/components/mdx/**` (`labMdxComponents`, `Plane`, `Expandable`, `types`) — es
  chapter-agnostic; los widgets se inyectan desde el shell, así que **no necesito editarlo**.
- `src/features/lab/components/BigramNarrative.tsx`, `src/content/lab/bigram.*.mdx` (bigram entero).
- `src/i18n/**` salvo lo imprescindible — el otro chat puede estar partiéndolo en namespaces. La narrativa
  nueva vive en **MDX**, no en i18n, así que evito tocar `es.ts`/`en.ts` para la prosa. Los widgets llevan
  su copy **inline/local** (no por `t()`) para no chocar con su namespacing.
- `redesign/bigram-editorial-v8` (otra rama; jamás).

**MÍO (seguro de editar):**
- `src/features/lab/components/ngram/**` (todos los widgets + `kit/`) ← **el grueso de la noche, sin colisión.**
- `src/features/lab/data/ngramData.ts`, `ngramSpine.ts`.
- Mis docs de método/plan: este archivo, `ngram-vision.md`, `ngram-narrative-*.md`, `ngram-gates/**`,
  `method-failure-book.md`, `narrative-guidelines.md`, `src/features/lab/components/ngram/kit/AGENTS.md`.

**COORDINADO (el otro chat crea la plomería; yo pongo el contenido encima, con cuidado, lo último):**
- `src/content/lab/ngram.es.mdx` + `ngram.en.mdx` (la narrativa nueva va aquí, formato MDX).
- `src/features/lab/components/NgramNarrative.tsx` (shell: hero + side-rail + CTA + `NGRAM_WIDGETS` map).
- `src/app/lab/bench/page.tsx` (registro de widgets en el bench — additivo, con cuidado).

**Protocolo:** antes de escribir en la zona COORDINADA, `git status` para detectar cambios del otro chat y
no pisarlos. La narrativa la dejo **además** en un draft de seguridad (`ngram-narrative-v4.md`) por si su
migración pisa el `.mdx` — así nunca se pierde y se re-porta en segundos. Trabajo primero lo MÍO (widgets),
que no colisiona, dando tiempo a que su migración de ngram aterrice.

---

## 1 · La ESTRUCTURA NUEVA (cómo funciona ya el doble idioma) — y qué manuales actualizar

El doble idioma se rehízo. Antes: toda la prosa troceada en `i18n/{en,es}.ts` (`t('ruta.con.puntos')`,
`<P html=…/>`, ilegible). Ahora: **la narrativa de cada capítulo es un `.mdx`** que se lee de arriba abajo
como un artículo, con `**negrita**`, `*cursiva*`, y los visualizadores embebidos en orden de lectura como
JSX (`<Plane><Widget/></Plane>`). Esto es justo lo que el usuario pidió: «escríbela para que se lea como un
artículo / una historia, legible, en un sitio donde tú la puedas leer».

**Mecánica (verificada leyendo bigram como plantilla):**
- Contenido: `src/content/lab/<chapter>.es.mdx` y `.en.mdx` (dos imports estáticos, toggle instantáneo).
- Render: el shell `NgramNarrative.tsx` hace
  `const Body = language === 'es' ? NgramEs : NgramEn;` y `<Body components={mdxComponents} />`.
- Puente markdown→editorial: `labMdxComponents("ngram", NGRAM_WIDGETS, {open,close})` mapea
  `p→P`, `h2→Heading`, `h3→Subheading`, `hr→SectionBreak`, `strong/em` con el acento, y expone
  `Section/Anchor/Lead/Plane/Stage/Expandable/PullQuote/FormulaBlock/KeyTakeaway/Callout/Highlight` +
  **los widgets del capítulo** (inyectados desde el shell).
- Hero, CTA, footer y side-rail siguen en el **shell TSX** (son UI, micro-copy por `t()`).
- Tokens por acento vía CSS vars (`var(--ngram-*)`), así un mismo primitive sirve verde (bigram) y ámbar (ngram).

**Cómo lo uso a mi favor:** escribo la narrativa de ngram **directamente en `ngram.{es,en}.mdx`** como prosa
de verdad (no fragmentos), con los widgets embebidos donde tocan. Se lee como cuento → la voz se controla
mucho mejor → desaparece el «la haces fatal en el i18n».

**Manuales a actualizar (el usuario lo pidió: «actualiza todos los manuales para que sepan usarlo»):**
- `narrative-guidelines.md`: nueva sección «Autoría en MDX» (la narrativa se escribe en `.mdx`, no en i18n;
  prosa fluida + widgets embebidos; el shell solo lleva chrome).
- `src/features/lab/components/ngram/kit/AGENTS.md` (y de paso el de bigram si procede): cómo un widget se
  embebe en el `.mdx` y se registra en `NGRAM_WIDGETS`.
- `CLAUDE.md` document-map: añadir `src/content/lab/*.mdx` como hogar de la narrativa.

---

## 2 · PARTE A — Feedback del mensaje largo (audio), punto por punto

### A · NARRATIVA (el problema gordo: «bastante floja / muy mala / suena a IA»)
- **N1.** §1 está mal: **repite el capítulo anterior**. El primer visualizador (apuesta/amnesia) es bueno
  visualmente, pero la frase «antes de tocar nada, daré tres letras/palabras distintas como apuesta» **no
  tiene NADA que ver con el visualizador**. Texto y widget desconectados.
- **N2.** Es **todo órdenes** («tú no lo ves así», «cuando llevas… ella no la tiene», «cuando pones la H, no
  existe»). Y suena **demasiado a “ella”** (la máquina). «Muy ella.» → quitar el imperativo y el
  antropomorfismo cansino.
- **N3.** SplitTheRow: el texto «abrir una fila en 27» **no se entiende NADA** (lo repitió ~6 veces). Hay
  que **DEMOSTRAR**: «ahora queremos almacenar **parejas**» → para cada letra necesito una pareja, cada
  pareja tiene su fila, y cada fila apunta a la siguiente letra. La idea no es mala; **no se comprende**.
- **N4.** «Empezaste con una fila y acabaste con 729. Nadie te dijo que esto es un trigrama» → el remate
  «nadie te dijo eso» es **basura**. Reescribir el momento del descubrimiento sin esa muletilla.
- **N5.** «Ahora la fila se afila» (RowSharpens) **repite lo de antes**. Diferenciar o fundir.
- **N6.** «asómate a esas filas y guarda…» → lo que el usuario quería ahí era **ver cómo CRECE** (la
  construcción que crece), no «asomarse».
- **N7.** Reescribir la narrativa **como él la contó** (su audio / `ngram-vision.md`) y usar los
  visualizadores que describió.
- **N8 (voz, clave).** **No forzar al lector.** Que suene a **historia / artículo de periódico**, **no a
  venta**. Escribir cómo funciona el n-grama de forma **técnica pero con vida, gracia y humor**, entendible
  por todo el mundo y entretenido. **NADA de hype, nada de órdenes, nada de moralejas.** (Cumple
  `prose-anti-ai-tells`: sin ritmo de metralleta, sin conectores obvios, sin moraleja obligatoria.)
- **N9.** Entre widgets está **mal escrito**; falta **un poco más de narrativa** que cosa los widgets.
- **N10.** El estándar de voz lo marca **el `.mdx` de bigram** (cálido, descubrimiento, «vaya mierda ¿no?»,
  historias reales en plegables). La voz de ngram tiene que estar **a ese nivel**.

### B · VISUALIZADORES — qué construir / arreglar (del audio)
- **V-a · Construcción que CRECE (n-grama de Shakespeare construyéndose).** Mostrar cómo se **construye**
  contando parejas y **cómo crece** la tabla a la vista, en directo («a lo bestia», se forma sola). No
  instantáneo: se siente. (≈ GrowingTable, pero de verdad mostrando el llenado por conteo.)
- **V-b · La multiplicación al subir n.** Con trigrama ya viste que multiplica; con 4-grama, mete ~100
  iteraciones y ves que la tabla se vuelve **una salvajada**; cada combinación de 4 letras → una fila de 27.
  Luego 5-grama → crece → 6 → 10 → **gigante**. (Existe un visor para esto y está bien ≈ ExplosionZoom.)
- **V-c · Más átomos que el universo.** Sube a 30/40-grama → de repente tiene **más combinaciones que átomos
  en el universo** → tamaño descomunal. «Si tuvieras que ALMACENAR esto…».
- **V-d · LLENARLA (cómo se llena, con texto literal).** «Y ahora el problema: vas a intentar **llenarla**.»
  Mostrar Shakespeare llenando un 4-grama, **con texto literal corriendo** (había uno en el GitHub anterior
  «de puta madre»). Hacerlo **funcionar mucho mejor**.
- **V-e · Ver una MATRIZ de verdad (4-grama), grande, seleccionable, con zoom.** «Vas a ver la matriz del
  cuatrograma»: que aparezca **en grande**, puedas **seleccionar** filas, hacer **zoom y zoom**, y ver que
  **la mayoría está vacía → el 99% está vacío. ¿Por qué?** (≈ EmptyMatrix «asómate», que le encanta:
  «guapísimo» — **pero hay que mostrar el PORQUÉ**.) «No hemos mostrado realmente una matriz» → mostrarla.
- **V-f · Hacer PENSAR el porqué del vacío.** Que el lector piense: cuántas combinaciones hay, lo difícil
  que es encontrarlas o repetirlas → **la mayoría aparecen UNA sola vez**. Un modelo donde algo ocurre 1-2-3
  veces **no te da nada**. (→ ver §4 PARTE C, la respuesta profunda que me dejó resolver.)
- **V-g · Firehose: explicar la escala.** «Un océano de texto» está bien, **pero no se ve qué coño son 1,5
  billones de letras** (¿cuántos Shakespeares es eso?). Y **«cuatro letras: atascada»** → ¿qué significa
  «atascada»? **Explicar más** lo de la derecha. Que se entienda el problema.
- **V-h · PALABRAS en vez de letras (¡quitado, restaurar!).** «Se han quitado las palabras.» No se muestra
  qué pasa con **palabras**: un Shakespeare con palabras → tabla **50.000 × 50.000** (vs 27×27 del bigrama
  de letras), y un **trigrama de palabras multiplica por 50.000**. Dejarlo claro y **muy visual**. (Mirar
  cómo era en el GitHub anterior.)
- **V-i · LookWhatYouBuilt (la «batalla» Queen).** Mola la batalla que compara varios n a la vez. Está
  bien. **Molaría poder escribir TU propia palabra** (semilla editable).
- **V-j · Lo estéticamente bueno (mantener).** 6-letras (GrowingTable), «escribir un número» (WriteFromMatrix),
  «caer más seguro» (RowSharpens) están **muy bien estéticamente**. La estética NO es el problema; lo es la
  **narrativa** y a veces **qué muestran**.

---

## 3 · PARTE B — Feedback pegado del chat anterior (los 3 duros + otros) · «DALE a estos»

Sobre los 3 que ya rehízo Opus una vez + los del aviso (capturas que mandó el usuario):
- **ss1 · ng-amnesia → REBUILD COMPLETO.** «Sigue flojo, muy flojo.» Aun con la versión «3 palabras → 1
  apuesta», no cae. El punch debe ser **la PÉRDIDA / la ceguera**: am/him/them son distintas y un humano las
  seguiría distinto, pero la máquina, viendo solo «m», está **obligada a la misma apuesta** = es **ciega a
  la diferencia**. Menos letra gigante, más «mira lo que pierde». **Mecanismo nuevo, no pulir.** (Opus.)
- **ss2 · ng-split → rehacer un poco.** «Medio se entiende pero no.» Buena idea, no se comprende. Pide:
  **ver cuándo aparece** una pareja → **pasar el ratón por encima y ver en qué palabra aparece**. Más
  comprensión en general. (Sonnet; mecanismo de hover-a-ejemplo.)
- **ss3 · ng-zoom → rehacer un poco.** «La idea está bien, hacerla más comprensible.» (Sonnet.)
- **ss4 · ng-built (batalla) → bien.** «Molaba la batalla que comparaba varios a la vez, se ve bien.»
  Mantener + añadir **semilla editable** (V-i).
- **ss5 · ng-progress → arreglar detalle + ejemplo nuevo.** «Revisar cómo se ve — es un detalle de **la barra
  que los une**. Y poner **“sin bigram” como ejemplo que no hace nada**» (un nivel 0 = aporreo aleatorio).
- **«mira la idea inicial de estos»** → al rehacer, rescatar mis ideas semilla de `ngram-vision.md`.
- **Resto (cold-review previo):** write/firehose/mute/limit = casi-PASS (polish); grow/sharpen = claros;
  built/progress = familia «comparar texto» (riesgo) → los miro en frío.

---

## 4 · PARTE C — La respuesta PROFUNDA al sparsity (lo que me dejó resolver yo)

El usuario: «que la matriz esté vacía es **irrelevante/evidente** — claro que va a estar vacía. ¿Es que el
lenguaje no la llena? Esa pregunta la tienes que **resolver tú**.» La respuesta (y lo que la narrativa debe
hacer **descubrir**, no soltar):

**El vacío no es el problema; el problema es que NO HAY EVIDENCIA.** Tres ideas encadenadas:

1. **El reparto se diluye.** Cada letra más de contexto **parte tus datos ×27** (×50.000 con palabras), pero
   el texto es **finito**. Las veces que ves un contexto cualquiera se desploman hacia **cero**.
2. **Lo que SÍ ves, lo ves una vez.** En cualquier corpus, **la inmensa mayoría de los n-gramas observados
   aparecen UNA sola vez** (cola larga / Zipf, *hapax*). Una fila con un solo conteo da «100% seguro» a la
   única letra que salió esa vez = **memorizó un accidente, no aprendió una regla**. Una observación no es
   estadística → **confianza falsa sobre ruido**.
3. **No se arregla con más datos, NUNCA.** El lenguaje es **infinitamente productivo**: siempre puedes
   escribir una frase nueva y válida que nadie escribió. Ningún corpus finito las cubre. Así que contar solo
   puede **memorizar lo visto**; jamás **generaliza**. Para el modelo, «the cat sat» y «the dog sat» son
   **celdas sin relación**: no puede compartir evidencia entre contextos **parecidos**.

→ **Dos caras del muro, descubiertas por el lector** (§5): (a) contexto nuevo → fila vacía → **MUDA**;
(b) contexto visto-una-vez → **confianza falsa**. Y como el lenguaje siempre inventa, subir n **empeora**
pasado un punto. **Conclusión que él deduce:** hace falta una máquina que entienda **PARECIDO**, no que
cuente. → puente a redes neuronales («la era del conteo ha terminado»). Esto **resuelve su pregunta** y da
sentido real a §4 (asombro de tamaño) → §5 (por qué el tamaño te mata) → puente.

**Implicación de diseño:** el widget de la matriz (EmptyMatrix / matriz 4-grama real) debe dejar **ver una
fila con conteo = 1** y nombrarlo como «esto pasó una vez en todo Shakespeare» → ese es el «porqué», no solo
«está vacía».

---

## 5 · PARTE D — Plan de SOLUCIÓN

### D1 · Narrativa (lo que más mimo lleva) — en `ngram.{es,en}.mdx`, voz nivel bigram
Arco (de `ngram-vision.md` + spine v3, corrigiendo N1–N10):
- **Hero + §1 · Mirar más atrás.** Promesa humana (no repetir bigram; **engancha** desde la amnesia ya
  vivida). Quitar la frase desconectada (N1). Voz de historia, sin órdenes (N2/N8). El lector **re-siente**
  que con una letra «th/sh/wh» son lo mismo → **quiere** más memoria. Luego WidenWindow: con más contexto la
  apuesta se afila (héroe = el % que sube).
- **§2 · Construirla tú (y CUESTA).** **Demostrar** que ahora guardamos **parejas** (N3): una fila por cada
  pareja; lo construye con las manos; **descubre** que ha hecho un trigrama **sin** la muletilla «nadie te
  dijo» (N4). RowSharpens diferenciado de split (N5): aquí se **investiga** lo afilada que queda cada fila
  (+ hover: en qué palabra aparece la pareja, ss2). GrowingTable: la tabla **CRECE a la vista** al subir n
  (N6, V-a).
- **§3 · Lo que has construido (celebrar).** WriteFromMatrix: escribir = **leer un número** de la matriz
  gigante. LookWhatYouBuilt: batalla 1→4 con **semilla editable** (V-i) = la **única** celebración.
- **§4 · Hasta dónde llega (asombro de TAMAÑO).** ExplosionZoom: ×27 por letra → 30/40-grama → **más que
  átomos** (V-b/V-c). **PALABRAS vs letras** (V-h): 50.000×50.000, trigrama ×50.000. BookFirehose con la
  escala **explicada** (cuántos Shakespeares; qué es «atascada», V-g).
- **§5 · El hueco (el muro, la causa).** Matriz 4-grama **real, grande, con zoom** → 99% vacía → **¿por
  qué?** (V-e/V-f) → fila vista-una-vez → MUDA / confianza falsa → **no generaliza** (PARTE C). Bookend §1.
- **§6 · Puente.** Progression (con nivel 0 «sin bigram», ss5) → BigModelLimit (gato/perro) → Historia
  (plegable, 50 años, autocompletar) → CTA redes neuronales.

### D2 · Visualizadores — acción por widget
| Widget | Acción | Notas |
|---|---|---|
| **AmnesiaReplay** | 🔴 **REBUILD** (Opus) | héroe = la PÉRDIDA/ceguera; misma apuesta forzada para palabras distintas. |
| **SplitTheRow** | 🟠 rework | demostrar «guardamos parejas»; **hover → en qué palabra aparece**; más comprensible. |
| **ExplosionZoom** | 🟠 rework | más comprensible; tabla explota hacia fuera; añadir 30/40-grama «más que átomos». |
| **Progression** | 🟠 rework | arreglar **la barra que une**; añadir nivel 0 «sin bigram» (aporreo). |
| **GrowingTable** | 🟢 keep + reforzar | que se vea el **llenado por conteo** (V-a). |
| **WriteFromMatrix** | 🟡 polish | barras no-ganadoras visibles (que se vea que ELIGE). |
| **LookWhatYouBuilt** | 🟡 polish | **semilla editable** (escribe tu palabra). |
| **RowSharpens** | 🟢 keep | diferenciar de split en la narrativa; jugable. |
| **BookFirehose** | 🟠 rework | **explicar la escala** (Shakespeares; «atascada»); texto literal corriendo. |
| **EmptyMatrix** | 🟠 reforzar | mostrar el **PORQUÉ** (fila vista-una-vez); matriz real seleccionable + zoom. |
| **MuteSlot** | 🟡 polish | 3 zonas compiten; «siempre 0%» se lee como roto. |
| **BigModelLimit** | 🟡 polish | gato/perro más claro; remate visible. |
| **WordsExplosion** (NUEVO) | 🆕 build | palabras: 50.000×50.000; trigrama ×50.000 (V-h). |
| **FillTheMatrix** (NUEVO o = firehose mejor) | 🆕/rework | llenar 4-grama con texto literal de Shakespeare (V-d). |

(WordsExplosion y FillTheMatrix pueden fundirse con ExplosionZoom/BookFirehose si queda más limpio — decide
el agente del widget con el gate, pero la IDEA debe estar.)

### D3 · Manuales (PARTE D §1) — documentar MDX + reglas nuevas

---

## 6 · PARTE E — Cómo EVITAR que vuelva a ocurrir (método)

1. **Narrativa primero y en MDX legible.** Se escribe como cuento en `.mdx`, se lee de corrido; si no es un
   viaje, se rehace antes de tocar widgets. (Mata el «la haces fatal en el i18n».)
2. **Voz anti-IA + anti-orden (gate de prosa).** Un agente ciego revisa la prosa contra `prose-anti-ai-tells`
   **y** contra «¿esto es una orden o una historia? ¿suena a “ella” cansino? ¿hay moraleja?». Si falla, rehacer.
3. **Cada widget se construye CON su beat + la narrativa previa** (`contextPacket`), nunca a ciegas, para que
   texto y widget **encajen** (mata N1: frase desconectada del visualizador).
4. **Gate de ojos-frescos v2** (ya en `method-failure-book.md §8`): captura por estado, sin código, solo
   contexto previo, cero-defectos, bucle hasta PASS; **yo miro la captura real** (no me fío de notas) y el
   listón es «¿una persona normal pilla LA idea?».
5. **Mostrar ESCALA, no números** (gate de escala): «1,5 billones» va con «= N Shakespeares», «99% vacío» con
   la matriz visible, «más que átomos» con la imagen. (Mata V-g.)
6. **Construir CUESTA + celebrar antes de criticar + NO apilar fallos** (1 celebración, 1 muro).
7. **Sonnet por defecto** (build/rework/gates); **Opus solo** para lo más abstracto que Sonnet no saca en 2
   rondas (aquí: AmnesiaReplay rebuild). No fundir cuota.
8. **El juez final es el usuario.** No declaro PASS lo que no he mirado; reviso en frío y duro.

---

## 7 · PARTE F — Orden de ejecución de la noche (no parar)

1. ✅ **Plan** (este archivo).
2. **Manuales**: documentar la autoría MDX + reglas (D3) — colisión-segura.
3. **Narrativa nueva** en `ngram-narrative-v4.md` (draft de seguridad) **y** en `ngram.{es,en}.mdx`
   (estructura buena), voz nivel bigram, arco D1, corrigiendo N1–N10. (Antes de escribir el `.mdx`:
   `git status` para no pisar al otro chat; si está creándolos, mantengo el draft y porteo cuando aterrice.)
4. **Widgets** (lo MÍO, sin colisión, en paralelo con agentes — Sonnet, Opus solo amnesia):
   - 🔴 AmnesiaReplay (Opus, mecanismo de la pérdida).
   - 🆕 WordsExplosion (50k×50k) · 🆕/rework FillTheMatrix (texto literal) · EmptyMatrix (porqué) ·
     ExplosionZoom (átomos) · SplitTheRow (hover) · Progression (barra + nivel 0) · BookFirehose (escala) ·
     polish: WriteFromMatrix, LookWhatYouBuilt (semilla editable), MuteSlot, BigModelLimit.
   - Cada uno: build-contract + bench (`?w=<slug>&theme=…&bare=1&play=1&clicks=N`) ambos temas + **gate
     ojos-frescos** (artefacto en `ngram-gates/<slug>.fresh-eyes.md`) + **yo miro la captura en frío** +
     bucle hasta que una persona normal pille la idea.
5. **Integrar**: registrar widgets en bench + en `NGRAM_WIDGETS` (shell) + embeber en el `.mdx` en orden de
   lectura. `tsc --noEmit` + `eslint` 0.
6. **FLOW GATE** sobre la página viva `/lab/ngram` (lectura ciega del capítulo entero, ambos idiomas y temas).
7. **Regresión**: bigram/transformers no se rompen (no toqué sus ficheros).
8. **Changelog** `ngram-changelog.md`. **Sin commits hasta que el usuario lo pida.**

> Checkpoint cada ≤2 reworks: miro yo las capturas reales y decido si relanzo. El usuario duerme; surfaceo un
> resumen honesto (con mi cold-review) cuando haya bloques cerrados.
