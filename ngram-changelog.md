# N-gram — log de cambios y aprendizajes

> Historial vivo de la reconstrucción del capítulo N-gram (rama `redesign/ngram-amber-v1`): qué se cambió,
> **por qué**, y sobre todo **qué NO funcionó**. Espejo de `bigram-changelog.md`. Se actualiza con cada iteración.

---

## v4 (2026-06-05) — reescritura de narrativa + reworks, sobre la estructura MDX nueva

Tras la review dura del usuario (audio largo): la narrativa estaba **muy floja** (órdenes, "muy ella", frases
pegadas a widgets que no les tocaban, escala sin sentir, sparsity sin explicar el porqué) y varios widgets no
se entendían. Plan en `ngram-v4-plan.md`. Hecho **sin tocar** la migración MDX que corría en paralelo en otro
chat (bigram + i18n por namespaces): yo solo el **contenido** (narrativa + widgets).

- **Estructura nueva (del otro chat, ya estable):** la narrativa vive en `src/content/lab/ngram.{es,en}.mdx`
  (prosa + widgets embebidos vía `labMdxComponents`), no en i18n. Documentado en `narrative-guidelines.md`
  («Autoría en MDX»). Se aprovechó para escribir la voz de verdad.
- **Narrativa reescrita entera (ES+EN, en sync)** — descubrimiento-first, voz de historia, sin órdenes / sin
  hype / sin moralejas; construir CUESTA; **una** celebración (§3) + **un** muro (§5). Fuente legible en
  `ngram-narrative-v4.md`. Fixes concretos: fuera la frase desconectada de §1; SplitTheRow ahora **demuestra**
  «guardamos parejas»; fuera el remate «nadie te dijo que es un trigrama»; §6 con bookend y el porqué real.
- **La respuesta al sparsity (que el usuario me dejó resolver):** el problema NO es el vacío (es obvio). Es
  que (1) las pocas filas llenas se vieron **una o dos veces** = accidente, no regla → confianza falsa; (2) el
  lenguaje **no se acaba nunca** → siempre hay contextos nuevos → contar nunca generaliza. Mostrado en
  EmptyMatrix (verdad emergente: «X% vacío» + «de las llenas, Y% vistas una o dos veces»).
- **Widgets:**
  - **AmnesiaReplay** — REBUILD a **embudo**: 3 palabras distintas → la venda deja solo la última letra →
    **una** apuesta. El héroe es la PÉRDIDA (antes «no se entendía / muy flojo»).
  - **SplitTheRow** — fila madre real de la «h» + **hover** en cada hija → frecuencia real + palabra de
    ejemplo + qué sigue (y foreshadow de sparsity: unas miles de veces, otras nunca).
  - **ExplosionZoom** — la cifra ahora llega a **«más filas que átomos en el universo»** con anclas
    graspables (estrellas, arena, átomos) + «10ⁿ»; antes topaba en «387 millones» (no se siente).
  - **BookFirehose** — ancla la escala («1,5 billones de letras ≈ 5,2 millones de libros») y glosa
    **«atascada»** («se para aquí · 6% lleno» + caption explicativa).
  - **EmptyMatrix** — añadido el **porqué** (filas vistas una o dos veces).
  - **WordsExplosion** — NUEVO: letras (27²) → **palabras (50.000² = 2.500 millones)**, ×50.000 por palabra
    de memoria. Restaura la idea de "palabras" que se había quitado.
  - **Progression** — barra de unión arreglada (rampa: salto punteado desde «sin bigram» + climb sólido) +
    nivel 0 «sin bigram» (aporreo) ya presente.
  - **LookWhatYouBuilt** — semilla **editable** («escribe tu palabra»).
  - write / mute / limit — cold-review: PASS (comunican su idea), sin cambios forzados.
- **Verificación:** `tsc` 0 y `eslint` 0 (arreglados de paso 2 errores `react-hooks/refs` pre-existentes en
  BookFirehose + 1 unused en LookWhatYouBuilt). Cada widget validado en el bench (ambos temas) y la página
  viva `/lab/ngram` renderiza la narrativa nueva con los widgets en contexto. **Sin commits** (a la espera del
  usuario). EN aún puede afinarse; pendiente regresión visual de bigram/transformers cuando cierre el otro chat.

---

## Decisiones clave (qué se decidió y por qué)

- **Método: narrativa primero.** Corrección del usuario antes de tocar widgets: escribir la narrativa
  perfecta (`ngram-mapa-narrativa.md`) y SÓLO entonces derivar visualizadores. **Mostrar, no contar:**
  maximizar nº de visualizadores enfocados, minimizar texto. Los visualizadores normalmente faltan, no
  sobran. (Memoria `lab-chapters-maximize-visualizers`.)
- **Reusar > borrar.** El plan inicial borraba ~14 widgets y consolidaba en 7. Rechazado. Política nueva:
  REUSAR/REHACER los widgets cuya idea/lógica es buena (re-skin al kit + ámbar, faked→datos reales). Rebuild
  sólo si la mecánica está mal. NO borrar prácticamente nada. Resultado: narrativa con 9 widgets de enseñanza
  del kit + free-lab con TODO su set instrumento, todo re-skin a ámbar.
- **EL BACKEND ESTÁ BIEN (2ª corrección del usuario).** El backend funciona y es genial. Depender del backend
  NUNCA es razón para borrar/rebuild-a-local/tratar como roto. NO se elimina nada por el backend. Reparto por
  modos: narrativa = widgets del kit con datos LOCALES reales (paridad con el bench, igual que la narrativa de
  bigram va en local — NO porque el backend sea malo); free-lab = todo el set con backend, re-skin a ámbar.
  `lmLabClient.ts` intacto. (Memoria `backend-is-fine-never-delete-for-it`.)
- **Acento ámbar con el sistema de bigram.** No es un look nuevo: son los MISMOS roles de token, primitivas
  del kit, tipografía y motion que bigram, sólo que el acento es ámbar/amarillo en vez de verde editorial.
  Espejo `--ngram-*` ↔ `--bigram-*`, scoped bajo `[data-ngram-theme]`. Aditivo: no toca bigram/lab/shadcn.
- **Arquitectura espejo de bigram (2 capas token-driven bajo `[data-ngram-theme]`):**
  1. Cromo editorial = rama `accent="ngram"` ADITIVA en `narrative-primitives.tsx` (espejo de `"bigram"`).
  2. Widgets = fork `src/features/lab/components/ngram/kit/` (idéntico al de bigram, tokens `--ngram-*`).
- **Datos locales reales (sin backend).** `ngramData.ts` cuenta n=1..4 sobre `SHAKESPEARE_TEXT` (300K) con
  mapas dispersos, misma normalización que bigram (lower → no-[a-z]→espacio → colapsar espacios). Validado
  contra `MATRIX_27_COUNTS` (golden n=2). El bench no tiene backend; todos los widgets funcionan con números
  verdaderos. (El backend `lmLabClient.ts` se MANTIENE: lo usa mlp.)
- **Arco:** curiosidad → triunfo → triunfo mayor → muro → decepción → nueva curiosidad. El triunfo (§3
  batalla) se celebra ANTES del muro (§4 explosión), pilar 13. Bookends: abre con la amnesia de bigram,
  cierra con «predice sin entender» (callback al «fli fla»).
- **CTA → `/lab/neural-networks`** (capítulo 3 confirmado en `lab/page.tsx`). Correcto ya; se re-skin a ámbar.
- **«n-grama» se gana en §1** tras sentir el juego de la ventana (descubrir-no-definir). En el hero NO
  aparece la jerga; el título es la idea («Una ventana más ancha»). El bigrama se reencuadra como n=2.

---

## Notas de build pendientes (de la revisión de la narrativa)
- **§1 ContextWindow:** etiquetar «1/2/3/4 letras de memoria», NO «bigrama/trigrama/4-grama» (esos nombres
  se ganan en la prosa del payoff, después del widget). El juego de adivinar debe ser GENUINAMENTE difícil
  (pilar 10): caso donde con 1 letra no se acierta y solo el contexto tardío lo fuerza.
- **Voz:** convertir imperativos al portar copy («Pregúntale…» → «Le preguntas…»). Cero órdenes al lector.
- **§6a vs §6b:** mantener como escalada, no repetición (demo controlada de 1 letra cambiada → rómpelo tú
  con cualquier typo). Cada uno con su puente.
- **§4b (palabras):** decidir en build callout vs toggle char/palabra en ContextExplosion.

## Qué NO funcionaba en el n-gram actual (para no repetir ❌)
- ❌ **Caos multi-acento dentro del capítulo:** ámbar, cyan, esmeralda, violeta, índigo y rojo conviviendo
  (viola «un acento por capítulo»). Stepwise en cyan, InferenceConsole/Generation en esmeralda, sparsity en
  rojo, comparison en violeta. → todo a ámbar `--ngram-*`.
- ❌ **Datos inventados:** casi todos los widgets educativos con porcentajes a mano (th→e 85% hardcodeado,
  FILL_DATA simulado, etc.). → datos reales de `ngramData`.
- ❌ **§1 nombra el dominio e inventa:** `ContextWindowVisualizer` usa «I want to eat pizza» (nombra el
  dominio) y predicciones faked, y el juego es trivial (se acierta a la primera). → rebuild con texto real,
  sin nombrar dominio, juego difícil.
- ⚠️ **Dashboard density:** varios widgets son volcados de métricas (PerformanceSummary, ComparisonDashboard,
  SparsityIndicator, LossChart, TechnicalExplanation) — multi-card, multi-color. NO se borran (el backend que
  los alimenta está bien): se MANTIENEN en el free-lab como instrumento, re-skin a ámbar y sin multi-acento.
  La NARRATIVA, en cambio, enseña por interacción (widgets del kit), no por tablas de métricas.
- ❌ **Traffic-lights rojo-ámbar-verde** en heatmaps/severidad (CombinatoricExplosionTable, SparsityHeatmap,
  InfiniteTable). → rampa de calor única ámbar del kit.
- ⚠️ **Redundancia de generadores/explosión/vacío:** en la NARRATIVA, 1 generador (batalla, semilla editable),
  1 explosión, 2 de muro (sparsity real + datos-infinitos, ideas distintas). Los demás se quedan en el free-lab.
- ⚠️ **Texto de error en inglés hardcodeado** en NgramGenerationBattle («Server may still be starting up»).
  → i18n; la versión de la narrativa usa generación local (paridad con el bench).
- ⚠️ **i18n con naming stale:** NgramStepwisePrediction usa claves `models.bigram.stepwise.*`. → renombrar a
  claves ngram (no se borra el widget; se re-skin a ámbar y se queda en el free-lab).

## Fase B (pre-pass compartido) — hecho
- **Tokens `--ngram-*`** en globals.css: bridge `@theme inline` (set completo de roles) + bloques
  `[data-ngram-theme="dark|light"]` (base cálida + acento ámbar) + grain + scrollbar + numeric. Aditivo.
- **Rama `accent="ngram"`** en `narrative-primitives.tsx` (espejo exacto de `"bigram"`, clases literales
  `*-ngram-*`; las ramas bigram quedan byte-idénticas = cero regresión). + `KeyTakeaway` (NgramTakeaway sage).
- **Kit fork** `ngram/kit/` (10 archivos) + `ngram/{HonestBar,PairChip,Verdict}` vía script one-shot
  (`--bigram-`→`--ngram-`, clases `bw-`→`nw-` para no colisionar el `<style>` global). eslint verde.
- **`ngramData.ts`**: conteo local n=1..4 sobre `SHAKESPEARE_TEXT` (300.000 chars, con mayúsculas), mapas
  dispersos, normalización = **lowercase → no-[a-z]→espacio → colapsar espacios**. ✅ VALIDADO: la regla
  lowercase da **0 discrepancias** vs `MATRIX_27_COUNTS` (t→h = 7071). Helpers: contextDistribution,
  topFollowers, contextRow, predictAt, diagnostics (contextSpace 27^k, observedContexts, sparsity),
  generateLocal (con backoff + temperatura), validateAgainstBigram.

## Fase D (composición) — en curso
- **NgramNarrative.tsx reescrito**: nuevo arco de 7 secciones, scope `[data-ngram-theme]` + `bg-ngram-bg` +
  ngram-grain, primitivas `accent="ngram"` (Heading/Lead/P/Callout/PullQuote/SectionLabel/SectionBreak/
  FigureWrapper/KeyTakeaway), hero editorial (Playfair «Una ventana ancha»), los 9 widgets del kit
  lazy-cargados en `<Figure>`, plegable Historia (IBM/Jelinek/«no hay mejor dato que más dato»), CTA →
  /lab/neural-networks. Validado en navegador (hero+§1+§2, widgets in-page montan dentro de la figura).
- **i18n**: `ngramNarrative.v2.*` añadido en es.ts Y en.ts (en sync) con toda la prosa auditada.
- **Compartidos**: `accent="ngram"` aditivo en ContinueToast + SectionProgressBar (espejo de bigram).
- **gen-ngram-prose.mjs** → `ngram-narrative.md` (mirror). FLOW GATE pasado: arco sube, puentes «¿y si?»,
  cero duplicación dura, descubrir-no-definir, voz humana.
- **ESLINT baseline**: el repo tiene **139 errores `react-hooks/set-state-in-effect` PRE-EXISTENTES**
  (i18n/context, ContinueToast, widgets viejos…), ajenos a este trabajo. TODOS mis archivos nuevos
  (ngram/*, NgramNarrative, ngramData, ngramSpine) están **eslint-limpios (0)**. tsc --noEmit: 0.
- **Pendiente Fase D**: re-skin free-lab `page.tsx` (scope ámbar; NO borrar widgets, backend OK);
  regresión bigram/transformers; verificación final temas.

## Pase de crítico severo (agente) — hecho + correcciones aplicadas
Veredicto: sólido, on-token, datos honestos, tsc limpio. CERO colores hardcodeados en los 9 widgets.
Hallazgos aplicados:
- (med) kit/AGENTS.md prometía primitivas `ContextWindow`/`ExplosionGrid` inexistentes → corregido: son
  mecánicas únicas dentro de su widget (MarkedText + cursor; grid inline), no primitivas del kit.
- (med) TypoBreaker: voz imperativa («Escribe algo») → placeholder/aria «una palabra».
- (low) TypoBreaker: «azar ≈ 4%» literal → derivado de `CHANCE`.
- (low) ContextWindow: ocultar «0% de confianza» cuando no hay datos.
- (low) ContextCounter: hover en slot vacío ahora selecciona → muestra honestamente «no aparece nunca».
- (low) HonestBar glint `rgba(255,255,255)`: moot (glint={false} en todos los usos ngram).
Verificación visual: SimilarityBridge reflow OK (capturado), ContextExplosion grid = ilustración (el nº es
el dato real). Sin más hallazgos.

## Estado por visualizador (se actualiza en build)
| § | Widget | Origen | Estado |
|---|---|---|---|
| §1 | ContextWindow | ContextWindowVisualizer | ✅ build (kit, real data; k=1 flat→k=4 sharp; bench dark+light OK) |
| §2 | ContextCounter | NgramMiniTransitionTable (+ideas) | ✅ build (kit, real; t-row spread vs th-row spike, hover-drill; bench dark+light OK; deviación reportada: contraste interactivo en vez de re-scan papiro para no duplicar RowTally) |
| §3 | NgramBattle | NgramGenerationBattle | ✅ build (kit, LOCAL gen con backoff; k=1 sopa→k=4 casi frases con nombres; typewriter; bench dark+light OK) |
| §4 | ContextExplosion | ExponentialGrowthAnimator (+FiveGram) | ✅ build (kit, 27^k real; nº trepa + grid satura; manual +×27; bench dark+light, reduced-motion OK) |
| §5a | SparsityView | SparsityHeatmap | ✅ build (kit, REAL counts; mismo grid 27×27, heatmap real a k=2 con bandas q/x/z, colapsa a 99.7% vacío a k=5; hover; bench OK) |
| §5b | InfiniteTable | InfiniteTableThoughtExperiment | ✅ build (kit, modelo honesto calibrado al corpus real; slider datos→fill por k; 5 letras nunca llena; bench OK) |
| §6a | UnseenContext | GeneralizationFailureDemo | ✅ build (kit, REAL pairs verificados: natur→e vs natus UNSEEN; bars + nada + Verdict; bench dark+light OK) |
| §6b | TypoBreaker | TypoWordBreaker | ✅ build (kit, REAL scanContext; escribe→confianza vs línea de azar; typo→nada; chips; bench OK) |
| §7 | SimilarityBridge | SimilarityBlindSpot | ✅ build (kit, concepto; IDs aislados→clusters por similitud con framer layout; un solo acento; bench OK) |
| §7 | Historia (plegable) | StatisticalEraTimeline? | ⬜ decidir |
