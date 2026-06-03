# N-gram — log de cambios y aprendizajes

> Historial vivo de la reconstrucción del capítulo N-gram (rama `redesign/ngram-amber-v1`): qué se cambió,
> **por qué**, y sobre todo **qué NO funcionó**. Espejo de `bigram-changelog.md`. Se actualiza con cada iteración.

---

## Decisiones clave (qué se decidió y por qué)

- **Método: narrativa primero.** Corrección del usuario antes de tocar widgets: escribir la narrativa
  perfecta (`ngram-mapa-narrativa.md`) y SÓLO entonces derivar visualizadores. **Mostrar, no contar:**
  maximizar nº de visualizadores enfocados, minimizar texto. Los visualizadores normalmente faltan, no
  sobran. (Memoria `lab-chapters-maximize-visualizers`.)
- **Reusar > borrar.** El plan inicial borraba ~14 widgets y consolidaba en 7. Rechazado. Política nueva:
  REUSAR/REHACER los widgets cuya idea/lógica es buena (re-skin al kit + ámbar, faked→datos reales). Rebuild
  sólo si la mecánica está mal. Borrar SÓLO cromo de dashboard puro (volcados de métricas backend) y dupes
  genuinos. Resultado: 9 visualizadores (vs ~11 repartidos en 2 modos), mejor hilados, casi todos rework.
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
- ❌ **Dashboard density:** muchos widgets son volcados de métricas (PerformanceSummary, ComparisonDashboard,
  SparsityIndicator, LossChart, TechnicalExplanation) — multi-card, multi-color, sin interacción, sin enseñar
  una idea. → borrados; el capítulo enseña por interacción, no por tablas de números.
- ❌ **Traffic-lights rojo-ámbar-verde** en heatmaps/severidad (CombinatoricExplosionTable, SparsityHeatmap,
  InfiniteTable). → rampa de calor única ámbar del kit.
- ❌ **3 generadores** (NgramGenerationBattle, NgramInteractiveGenerator, GenerationPlayground) y **3-4
  widgets de explosión 27^n** y **3 de tabla vacía**. → 1 generador (la batalla, con semilla editable), 1
  explosión, 2 de muro (sparsity real + datos-infinitos, ideas distintas).
- ❌ **Texto de error en inglés hardcodeado** en NgramGenerationBattle («Server may still be starting up»).
  → generación local, sin backend, sin ese estado.
- ❌ **i18n con naming stale:** NgramStepwisePrediction usa claves `models.bigram.stepwise.*`. → se borra.

## Estado por visualizador (se actualiza en build)
| § | Widget | Origen | Estado |
|---|---|---|---|
| §1 | ContextWindow | ContextWindowVisualizer | ⬜ rebuild |
| §2 | ContextCounter | NgramMiniTransitionTable (+ideas) | ⬜ rework/rebuild |
| §3 | NgramBattle | NgramGenerationBattle | ⬜ rework (local) |
| §4 | ContextExplosion | ExponentialGrowthAnimator (+FiveGram) | ⬜ rework |
| §5a | SparsityView | SparsityHeatmap | ⬜ rework |
| §5b | InfiniteTable | InfiniteTableThoughtExperiment | ⬜ rework |
| §6a | UnseenContext | GeneralizationFailureDemo | ⬜ rework |
| §6b | TypoBreaker | TypoWordBreaker | ⬜ rework |
| §7 | SimilarityBridge | SimilarityBlindSpot | ⬜ rework |
| §7 | Historia (plegable) | StatisticalEraTimeline? | ⬜ decidir |
